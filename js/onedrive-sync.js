// js/onedrive-sync.js — PMG OneDrive Folder Live Sync Engine (Multi-Branch & Multi-PC)
'use strict';

(function(window) {
  const DB_NAME = 'pmg_onedrive_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'handles';
  const HANDLE_KEY = 'pmg_onedrive_root_handle';

  // Recognized branch folders created in PMG OneDrive
  const KNOWN_BRANCH_FOLDERS = [
    'ASTANA',
    'KOTA SENTOSA',
    'MALIHAH',
    'METROCITY',
    'MJK',
    'MOYAN',
    'SEMARIANG'
  ];

  // Mapping between branch codes and OneDrive folder names
  const BRANCH_FOLDER_MAP = {
    'KS01': 'KOTA SENTOSA',
    'KOTA SENTOSA': 'KOTA SENTOSA',
    'ASTANA': 'ASTANA',
    'MALIHAH': 'MALIHAH',
    'METROCITY': 'METROCITY',
    'MJK': 'MJK',
    'MOYAN': 'MOYAN',
    'SEMARIANG': 'SEMARIANG'
  };

  class OneDriveSyncEngine {
    constructor() {
      this.rootHandle = null;
      this.mode = 'DISCONNECTED'; // 'PARENT' (all 7 outlets), 'BRANCH' (single outlet), 'DISCONNECTED'
      this.activeBranchFolder = null;
      this.branchSubHandles = {};
      this.lastKnownModified = 0;
      this.isSyncing = false;
      this.watcherInterval = null;
      this.autoSyncSeconds = 30;
      this.initDone = false;
    }

    // ─── INDEXEDDB PERSISTENCE FOR DIRECTORY HANDLE ──────────────────────────
    async _getDb() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async _storeHandle(handle) {
      try {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Could not save handle to IndexedDB:', err);
        return false;
      }
    }

    async _loadHandle() {
      try {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Could not read handle from IndexedDB:', err);
        return null;
      }
    }

    async _clearHandle() {
      try {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        return false;
      }
    }

    // ─── VERIFY PERMISSION ───────────────────────────────────────────────────
    async _verifyPermission(handle, readWrite = true, allowPrompt = true) {
      if (!handle) return false;
      const opts = { mode: readWrite ? 'readwrite' : 'read' };
      try {
        if (typeof handle.queryPermission === 'function') {
          const status = await handle.queryPermission(opts);
          if (status === 'granted') return true;
          if (!allowPrompt) return false;
        }
        if (allowPrompt && typeof handle.requestPermission === 'function') {
          const status = await handle.requestPermission(opts);
          return status === 'granted';
        }
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Permission verification:', err.message || err);
      }
      return false;
    }

    // ─── INITIALIZE ON PAGE LOAD ─────────────────────────────────────────────
    async init() {
      if (this.initDone) return;
      this.initDone = true;

      // Check if browser supports File System Access API
      if (!window.showDirectoryPicker) {
        this._updateBadge('UNSUPPORTED', 'OneDrive (Browser not supported)');
        return;
      }

      // Try restoring saved handle from IndexedDB
      try {
        const savedHandle = await this._loadHandle();
        if (savedHandle) {
          this.rootHandle = savedHandle;
          // Non-prompting query on page load
          const hasPerm = await this._verifyPermission(savedHandle, false, false);
          if (hasPerm) {
            await this._inspectAndConfigureHandle(savedHandle);
            this._startBackgroundWatcher();
            await this.syncWithOneDriveFolder(true);
            return;
          } else {
            // Permission in 'prompt' state; wait for user click to request permission
            await this._inspectAndConfigureHandle(savedHandle);
            this._updateBadge('PERMISSION_NEEDED', 'OneDrive (Click to grant access)');
            return;
          }
        }
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Auto-init failed:', err);
      }

      this._updateBadge('DISCONNECTED', 'OneDrive: Connect Folder');
    }

    // ─── USER INTERACTIVE CONNECT ────────────────────────────────────────────
    async connectFolder() {
      if (!window.showDirectoryPicker) {
        alert('File System Access API is not supported in this browser.\n\nPlease use Microsoft Edge or Google Chrome on Windows to connect your PMG OneDrive folder.');
        return false;
      }

      try {
        const handle = await window.showDirectoryPicker({
          id: 'pmg_onedrive_folder',
          mode: 'readwrite',
          startIn: 'documents'
        });

        const hasPerm = await this._verifyPermission(handle, true, true);
        if (!hasPerm) {
          alert('Read and Write permissions are required to sync clinical data with your PMG OneDrive folder.');
          return false;
        }

        this.rootHandle = handle;
        await this._storeHandle(handle);
        await this._inspectAndConfigureHandle(handle);

        this._startBackgroundWatcher();

        // Perform immediate bidirectional sync
        await this.manualSync();

        const folderDesc = this.mode === 'PARENT' 
          ? `Master "Patient care" (All 7 Outlets Connected)`
          : `Branch Outlet (${this.activeBranchFolder})`;

        alert(`✅ PMG OneDrive Connected Successfully!\n\nFolder: ${handle.name}\nMode: ${folderDesc}\n\nClinical records, encounters, and appointments are now synchronized in real-time across branch PCs and with Area Manager.`);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
        console.error('[PMG OneDrive Sync] Connect error:', err);
        alert('Could not connect to folder: ' + (err.message || err));
        return false;
      }
    }

    async disconnectFolder() {
      if (!confirm('Disconnect PMG OneDrive folder sync?\n\nLocal browser data will remain intact, but live cloud synchronization will pause.')) {
        return;
      }
      if (this.watcherInterval) {
        clearInterval(this.watcherInterval);
        this.watcherInterval = null;
      }
      this.rootHandle = null;
      this.mode = 'DISCONNECTED';
      this.branchSubHandles = {};
      await this._clearHandle();
      this._updateBadge('DISCONNECTED', 'OneDrive: Connect Folder');
      if (typeof updateSyncModalInfo === 'function') updateSyncModalInfo();
      if (typeof showPmgToast === 'function') {
        showPmgToast('OneDrive sync disconnected.', 'info');
      }
    }

    // ─── INSPECT HANDLE & SUBFOLDERS ─────────────────────────────────────────
    async _inspectAndConfigureHandle(handle) {
      if (!handle) return;
      const folderName = (handle.name || '').trim().toUpperCase();
      this.branchSubHandles = {};

      // Check if handle has subfolders matching our branch names
      let detectedSubfolders = [];
      try {
        if (typeof handle.entries === 'function') {
          for await (const [name, entry] of handle.entries()) {
            if (entry.kind === 'directory') {
              const upper = name.trim().toUpperCase();
              if (KNOWN_BRANCH_FOLDERS.includes(upper)) {
                this.branchSubHandles[upper] = entry;
                detectedSubfolders.push(upper);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Reading directory entries:', err.message || err);
      }

      if (detectedSubfolders.length > 0) {
        // Connected to parent "Patient care" folder (Area Manager Master View)
        this.mode = 'PARENT';
        this.activeBranchFolder = this._resolveCurrentBranchName();
        this._updateBadge('CONNECTED', `OneDrive: Live (All 7 Outlets)`);
      } else if (KNOWN_BRANCH_FOLDERS.includes(folderName)) {
        // Connected directly to a branch folder (e.g. "KOTA SENTOSA")
        this.mode = 'BRANCH';
        this.activeBranchFolder = folderName;
        this.branchSubHandles[folderName] = handle;
        this._updateBadge('CONNECTED', `OneDrive: Live (${folderName})`);
      } else {
        // Custom or unmapped folder name
        this.mode = 'BRANCH';
        this.activeBranchFolder = folderName;
        this.branchSubHandles[folderName] = handle;
        this._updateBadge('CONNECTED', `OneDrive: Live (${folderName})`);
      }
    }

    _resolveCurrentBranchName() {
      const session = typeof getSession === 'function' ? getSession() : null;
      const branchSel = document.getElementById('patientBranchFilter');
      const selected = branchSel ? branchSel.value : '';

      if (selected && BRANCH_FOLDER_MAP[selected.toUpperCase()]) {
        return BRANCH_FOLDER_MAP[selected.toUpperCase()];
      }
      if (session && session.branch && BRANCH_FOLDER_MAP[session.branch.toUpperCase()]) {
        return BRANCH_FOLDER_MAP[session.branch.toUpperCase()];
      }
      return 'KOTA SENTOSA'; // default
    }

    _patientMatchesBranch(p, targetBranchName) {
      if (!p) return false;
      const pBranch = (p.branch || '').trim().toUpperCase();
      const target = (targetBranchName || '').trim().toUpperCase();
      if (pBranch === target) return true;
      if ((pBranch === 'KS01' || pBranch === 'KOTA SENTOSA') && (target === 'KS01' || target === 'KOTA SENTOSA')) return true;
      return false;
    }

    async _getTargetBranchDirectoryHandle(branchFolderName) {
      const targetName = (branchFolderName || this._resolveCurrentBranchName()).toUpperCase();

      if (this.mode === 'PARENT') {
        if (this.branchSubHandles[targetName]) {
          return this.branchSubHandles[targetName];
        }
        // Try creating or getting subfolder if permitted
        try {
          const sub = await this.rootHandle.getDirectoryHandle(targetName, { create: true });
          this.branchSubHandles[targetName] = sub;
          return sub;
        } catch (err) {
          console.warn(`[PMG OneDrive Sync] Could not access subfolder ${targetName}:`, err.message || err);
          return null;
        }
      } else if (this.mode === 'BRANCH') {
        return this.rootHandle;
      }
      return null;
    }

    // ─── USER-INITIATED BIDIRECTIONAL MANUAL SYNC ────────────────────────────
    async manualSync() {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') {
        throw new Error('No OneDrive folder connected yet. Please click "Link / Change Folder" first.');
      }

      if (this.isSyncing) {
        return { success: false, message: 'Sync is already running.' };
      }

      // 1. Verify / Request readwrite permission from the active user gesture
      const hasPerm = await this._verifyPermission(this.rootHandle, true, true);
      if (!hasPerm) {
        this._updateBadge('PERMISSION_NEEDED', 'OneDrive (Click to grant access)');
        throw new Error('OneDrive folder access permission was not granted. Please allow access when prompted by your browser.');
      }

      this.isSyncing = true;
      this._updateBadge('SYNCING', 'OneDrive: Syncing…');

      try {
        // Ensure subfolder handles are populated if in PARENT mode
        if (this.mode === 'PARENT' && Object.keys(this.branchSubHandles).length === 0) {
          await this._inspectAndConfigureHandle(this.rootHandle);
        }

        const branchSel = document.getElementById('patientBranchFilter');
        const selectedFilter = branchSel ? branchSel.value : '';

        let targetBranches = [];
        if (this.mode === 'PARENT' && (!selectedFilter || selectedFilter === 'ALL')) {
          targetBranches = [...KNOWN_BRANCH_FOLDERS];
        } else {
          targetBranches = [this._resolveCurrentBranchName()];
        }

        let totalMergedPatients = 0;
        let syncedBranches = [];
        const nowIso = new Date().toISOString();
        const session = typeof getSession === 'function' ? getSession() : null;

        for (const branchName of targetBranches) {
          const dirHandle = await this._getTargetBranchDirectoryHandle(branchName);
          if (!dirHandle) continue;

          // Step A: Read existing patients_master.json from OneDrive
          let cloudPatients = [];
          try {
            const fileHandle = await dirHandle.getFileHandle('patients_master.json', { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (text && text.trim()) {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed.patients)) {
                cloudPatients = parsed.patients;
              }
            }
          } catch (e) {
            // File does not exist yet; cloudPatients remains empty
          }

          // Step B: Extract local patients belonging to this branch
          const localBranchPatients = (typeof patientsData !== 'undefined' ? patientsData : []).filter(p => {
            return this._patientMatchesBranch(p, branchName);
          });

          // Step C: Bidirectional conflict-free merge
          const mergedBranchPatients = this._mergePatientArrays(localBranchPatients, cloudPatients);

          // Step D: Update global patientsData
          if (typeof patientsData !== 'undefined') {
            const otherPatients = patientsData.filter(p => !this._patientMatchesBranch(p, branchName));
            patientsData = [...otherPatients, ...mergedBranchPatients];
          }

          // Step E: Write merged branch records back to OneDrive patients_master.json
          const syncPayload = {
            branch: branchName,
            lastSync: nowIso,
            syncedBy: session?.displayName || 'Pharmacist',
            device: navigator.userAgent.includes('Edg') ? 'Edge Windows' : 'Chrome Windows',
            count: mergedBranchPatients.length,
            patients: mergedBranchPatients
          };

          const fileHandle = await dirHandle.getFileHandle('patients_master.json', { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(syncPayload, null, 2));
          await writable.close();

          const writtenFile = await fileHandle.getFile();
          this.lastKnownModified = writtenFile.lastModified;

          totalMergedPatients += mergedBranchPatients.length;
          syncedBranches.push(branchName);
        }

        // Persist local patientsData and refresh views
        if (typeof PATIENTS_STORAGE_KEY !== 'undefined' && typeof patientsData !== 'undefined') {
          localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
        }
        if (typeof renderPatientModule === 'function') {
          renderPatientModule();
        }

        const mainBranchLabel = syncedBranches.length > 1 
          ? `All 7 Outlets (${syncedBranches.length} branches)` 
          : (syncedBranches[0] || this.activeBranchFolder || 'Branch');

        // Record last backup details in localStorage
        localStorage.setItem('pmg_last_backup_date', nowIso);
        localStorage.setItem('pmg_last_backup_type', `OneDrive Live (${mainBranchLabel})`);
        if (session?.displayName) localStorage.setItem('pmg_last_backup_user', session.displayName);

        if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
        if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();

        const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${mainBranchLabel})`);

        return {
          success: true,
          branch: mainBranchLabel,
          count: totalMergedPatients,
          time: timeStr,
          branches: syncedBranches
        };
      } catch (err) {
        console.error('[PMG OneDrive Sync] manualSync error:', err);
        this._updateBadge('ERROR', 'OneDrive: Sync Error');
        throw err;
      } finally {
        this.isSyncing = false;
      }
    }

    // ─── SAVE PATIENTS DATA TO ONEDRIVE (AUTO-SAVE HOOK) ──────────────────────
    async saveToOneDrive(patientsArray) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      if (this.isSyncing) return false;

      // Check permission without prompting if called silently in background
      const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
      if (!hasPerm) return false;

      const targetBranch = this._resolveCurrentBranchName();
      const dirHandle = await this._getTargetBranchDirectoryHandle(targetBranch);
      if (!dirHandle) return false;

      this.isSyncing = true;
      this._updateBadge('SYNCING', 'OneDrive: Syncing…');

      try {
        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();

        // Filter patients for this specific branch
        const branchPatients = (patientsArray || []).filter(p => this._patientMatchesBranch(p, targetBranch));

        const syncPayload = {
          branch: targetBranch,
          lastSync: nowIso,
          syncedBy: session?.displayName || 'Pharmacist',
          device: navigator.userAgent.includes('Edg') ? 'Edge Windows' : 'Chrome Windows',
          count: branchPatients.length,
          patients: branchPatients
        };

        const jsonContent = JSON.stringify(syncPayload, null, 2);

        // Write patients_master.json
        const fileHandle = await dirHandle.getFileHandle('patients_master.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();

        // Update last modified tracker
        const writtenFile = await fileHandle.getFile();
        this.lastKnownModified = writtenFile.lastModified;

        // Record last backup details in localStorage
        localStorage.setItem('pmg_last_backup_date', nowIso);
        localStorage.setItem('pmg_last_backup_type', `OneDrive Live (${targetBranch})`);
        if (session?.displayName) localStorage.setItem('pmg_last_backup_user', session.displayName);

        if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
        if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();

        const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${targetBranch})`);
        return true;
      } catch (err) {
        console.error('[PMG OneDrive Sync] Write error:', err);
        this._updateBadge('ERROR', 'OneDrive: Sync Warning');
        return false;
      } finally {
        this.isSyncing = false;
      }
    }

    // ─── LOAD & MERGE FROM ONEDRIVE (BACKGROUND WATCHER) ─────────────────────
    async syncWithOneDriveFolder(force = false) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      if (this.isSyncing) return false;

      // Non-prompting permission query for background checks
      const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
      if (!hasPerm) return false;

      const targetBranch = this._resolveCurrentBranchName();
      const dirHandle = await this._getTargetBranchDirectoryHandle(targetBranch);
      if (!dirHandle) return false;

      try {
        let fileHandle;
        try {
          fileHandle = await dirHandle.getFileHandle('patients_master.json', { create: false });
        } catch (e) {
          // File does not exist yet on OneDrive. If we have local data, write it!
          if (typeof patientsData !== 'undefined' && patientsData.length > 0) {
            await this.saveToOneDrive(patientsData);
          }
          return false;
        }

        const file = await fileHandle.getFile();

        // If file modified timestamp is not newer and not forced, skip reading
        if (!force && file.lastModified <= this.lastKnownModified) {
          return false;
        }

        this.isSyncing = true;
        this._updateBadge('SYNCING', 'OneDrive: Syncing…');

        const text = await file.text();
        if (!text.trim()) return false;

        const data = JSON.parse(text);
        const incomingPatients = data.patients || [];

        // Conflict-Free Merge with local patientsData
        if (typeof patientsData !== 'undefined') {
          const merged = this._mergePatientArrays(patientsData, incomingPatients);
          patientsData = merged;
          if (typeof PATIENTS_STORAGE_KEY !== 'undefined') {
            localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
          }
          if (typeof renderPatientModule === 'function') renderPatientModule();
        }

        this.lastKnownModified = file.lastModified;

        const timeStr = new Date(file.lastModified).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${targetBranch})`);
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Read/Merge error:', err);
        return false;
      } finally {
        this.isSyncing = false;
      }
    }

    // ─── CONFLICT-FREE RECORD MERGING ALGORITHM ──────────────────────────────
    _mergePatientArrays(localArr, cloudArr) {
      const map = new Map();

      // Index all local patients
      (localArr || []).forEach(p => {
        if (p && p.id) map.set(p.id, JSON.parse(JSON.stringify(p)));
      });

      // Merge each cloud patient
      (cloudArr || []).forEach(cloudP => {
        if (!cloudP || !cloudP.id) return;

        if (!map.has(cloudP.id)) {
          map.set(cloudP.id, JSON.parse(JSON.stringify(cloudP)));
        } else {
          const localP = map.get(cloudP.id);
          // Merge encounters by ID (prevent duplicate or lost encounters)
          const encMap = new Map();
          (localP.encounters || []).forEach(e => encMap.set(e.id || `${e.date}_${e.recordedBy}`, e));
          (cloudP.encounters || []).forEach(e => encMap.set(e.id || `${e.date}_${e.recordedBy}`, e));
          localP.encounters = Array.from(encMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

          // Merge medications by name/id
          const medMap = new Map();
          (localP.medications || []).forEach(m => medMap.set(m.id || m.name, m));
          (cloudP.medications || []).forEach(m => medMap.set(m.id || m.name, m));
          localP.medications = Array.from(medMap.values());

          // Merge appointments by id
          const aptMap = new Map();
          (localP.appointments || []).forEach(a => aptMap.set(a.id || `${a.date}_${a.time}`, a));
          (cloudP.appointments || []).forEach(a => aptMap.set(a.id || `${a.date}_${a.time}`, a));
          localP.appointments = Array.from(aptMap.values()).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

          // Overwrite scalar profile fields if cloud has updated values
          localP.name = cloudP.name || localP.name;
          localP.phone = cloudP.phone || localP.phone;
          localP.ic = cloudP.ic || localP.ic;
          localP.conditions = Array.from(new Set([...(localP.conditions || []), ...(cloudP.conditions || [])]));
          localP.allergies = cloudP.allergies || localP.allergies;
          localP.notes = cloudP.notes || localP.notes;
          localP.nextTcaDate = cloudP.nextTcaDate || localP.nextTcaDate;
          localP.nextTcaPurpose = cloudP.nextTcaPurpose || localP.nextTcaPurpose;

          map.set(cloudP.id, localP);
        }
      });

      return Array.from(map.values());
    }

    // ─── BACKGROUND LIVE WATCHER ─────────────────────────────────────────────
    _startBackgroundWatcher() {
      if (this.watcherInterval) clearInterval(this.watcherInterval);

      // Periodic check every 30 seconds
      this.watcherInterval = setInterval(() => {
        if (!document.hidden) {
          this.syncWithOneDriveFolder(false);
        }
      }, this.autoSyncSeconds * 1000);

      // Check immediately when user switches back to browser tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncWithOneDriveFolder(false);
        }
      });
    }

    // ─── UI STATUS BADGE UPDATER ─────────────────────────────────────────────
    _updateBadge(status, text) {
      const badgeEl = document.getElementById('oneDriveLiveSyncBadge');
      const textEl = document.getElementById('oneDriveLiveSyncText');
      const iconEl = document.getElementById('oneDriveLiveSyncIcon');

      if (!badgeEl || !textEl) return;

      textEl.textContent = text;

      if (status === 'CONNECTED') {
        badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 transition shadow-xs';
        if (iconEl) iconEl.className = 'fa-solid fa-cloud-check text-emerald-600';
      } else if (status === 'SYNCING') {
        badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-300 flex items-center gap-1.5 transition shadow-xs';
        if (iconEl) iconEl.className = 'fa-solid fa-arrows-rotate text-blue-600 animate-spin';
      } else if (status === 'PERMISSION_NEEDED') {
        badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 flex items-center gap-1.5 transition shadow-xs';
        if (iconEl) iconEl.className = 'fa-solid fa-lock text-amber-600';
      } else if (status === 'ERROR') {
        badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-300 flex items-center gap-1.5 transition shadow-xs';
        if (iconEl) iconEl.className = 'fa-solid fa-triangle-exclamation text-rose-600';
      } else {
        // DISCONNECTED
        badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 flex items-center gap-1.5 transition shadow-xs';
        if (iconEl) iconEl.className = 'fa-brands fa-microsoft text-blue-600';
      }
    }
  }

  // ─── FLOATING TOAST NOTIFICATION HELPER ────────────────────────────────────
  function showPmgToast(message, type = 'success') {
    let container = document.getElementById('pmgToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pmgToastContainer';
      container.className = 'fixed top-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none max-w-sm';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isError = type === 'error';
    const isWarning = type === 'warning';

    const bgClass = isSuccess ? 'bg-emerald-900/95 text-white border-emerald-500' :
                    isError ? 'bg-rose-900/95 text-white border-rose-500' :
                    isWarning ? 'bg-amber-900/95 text-white border-amber-500' :
                    'bg-slate-900/95 text-white border-blue-500';

    const iconHtml = isSuccess ? '<i class="fa-solid fa-circle-check text-emerald-400 text-base"></i>' :
                     isError ? '<i class="fa-solid fa-triangle-exclamation text-rose-400 text-base"></i>' :
                     '<i class="fa-solid fa-circle-info text-blue-400 text-base"></i>';

    toast.className = `${bgClass} px-4 py-3 rounded-xl border shadow-xl text-xs flex items-center gap-3 pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300 backdrop-blur-sm`;
    toast.innerHTML = `
      ${iconHtml}
      <div class="flex-1 font-medium leading-snug">${message}</div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 4000);
  }
  window.showPmgToast = showPmgToast;

  function escapeSyncHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── MODAL UI HELPERS ──────────────────────────────────────────────────────
  function updateSyncModalInfo() {
    const pill = document.getElementById('syncModalStatusPill');
    const folderEl = document.getElementById('syncModalFolderName');
    const branchEl = document.getElementById('syncModalBranchName');
    const lastSyncEl = document.getElementById('syncModalLastSyncTime');

    if (!window.pmgOneDriveSync) return;

    const isConn = window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED';
    if (pill) {
      if (isConn) {
        pill.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
        pill.textContent = window.pmgOneDriveSync.mode === 'PARENT' ? '✅ Connected (All 7 Outlets)' : '✅ Connected (Branch)';
      } else {
        pill.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200';
        pill.textContent = '❌ Disconnected';
      }
    }

    if (folderEl) {
      folderEl.textContent = window.pmgOneDriveSync.rootHandle ? window.pmgOneDriveSync.rootHandle.name : 'No folder linked yet';
    }

    if (branchEl) {
      const branchSel = document.getElementById('patientBranchFilter');
      const selected = branchSel ? branchSel.value : '';
      if (window.pmgOneDriveSync.mode === 'PARENT' && (!selected || selected === 'ALL')) {
        branchEl.textContent = 'All 7 Outlets (Master View)';
      } else {
        const b = window.pmgOneDriveSync._resolveCurrentBranchName();
        branchEl.textContent = b === 'KOTA SENTOSA' ? 'Kota Sentosa (KS01)' : b;
      }
    }

    if (lastSyncEl) {
      const lastDate = localStorage.getItem('pmg_last_backup_date');
      const lastType = localStorage.getItem('pmg_last_backup_type');
      if (lastDate) {
        try {
          const d = new Date(lastDate);
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          lastSyncEl.textContent = `${dateStr} at ${timeStr} (${lastType || 'OneDrive'})`;
        } catch (e) {
          lastSyncEl.textContent = 'Active';
        }
      } else {
        lastSyncEl.textContent = 'Ready to sync';
      }
    }
  }

  // ─── TRIGGER MANUAL SYNC WITH INSTANT VISUAL FEEDBACK ──────────────────────
  window.triggerManualSyncFromModal = async function() {
    const btn = document.getElementById('btnModalSyncNow');
    const fb = document.getElementById('syncModalFeedback');

    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Syncing...</span>';
    }

    if (fb) {
      fb.className = 'p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex items-center gap-2 text-xs font-semibold';
      fb.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-blue-600 text-sm"></i> <span>Connecting to OneDrive folder and syncing clinical records...</span>';
      fb.classList.remove('hidden');
    }

    try {
      if (!window.pmgOneDriveSync || !window.pmgOneDriveSync.rootHandle || window.pmgOneDriveSync.mode === 'DISCONNECTED') {
        if (fb) {
          fb.className = 'p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1';
          fb.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 text-amber-800">
              <i class="fa-solid fa-circle-exclamation text-amber-600"></i> No Folder Linked Yet
            </div>
            <div>Please click <b>"Link / Change Folder"</b> below to select your PMG OneDrive folder.</div>
          `;
          fb.classList.remove('hidden');
        }
        return;
      }

      const res = await window.pmgOneDriveSync.manualSync();
      updateSyncModalInfo();

      if (fb) {
        fb.className = 'p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1';
        fb.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-emerald-700">
            <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i> Synced Successfully with OneDrive!
          </div>
          <div class="text-[11px] text-emerald-800">
            • Target: <b>${escapeSyncHtml(res.branch)}</b> &bull; Patients: <b>${res.count}</b> &bull; Time: <b>${res.time}</b>
          </div>
          <div class="text-[10px] text-emerald-700 mt-1 font-medium">
            ✓ Clinical records, encounters, and appointments are up to date and saved to OneDrive.
          </div>
        `;
        fb.classList.remove('hidden');
      }

      showPmgToast(`✅ OneDrive Synced: ${res.branch} (${res.count} patients at ${res.time})`, 'success');

    } catch (err) {
      console.error('[PMG OneDrive Sync] Manual sync failed:', err);
      updateSyncModalInfo();

      if (fb) {
        fb.className = 'p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs space-y-1.5';
        fb.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-rose-700">
            <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> Sync Unsuccessful
          </div>
          <div class="text-[11px] text-rose-800">${escapeSyncHtml(err.message || 'Unable to sync with OneDrive folder.')}</div>
          <div class="text-[10px] text-gray-600 bg-white/80 p-1.5 rounded border border-rose-100">
            <b>Fix:</b> Click <b>"Link / Change Folder"</b> below to re-select your OneDrive folder and grant browser permissions.
          </div>
        `;
        fb.classList.remove('hidden');
      }
      showPmgToast('OneDrive Sync: ' + (err.message || 'Sync failed'), 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> <span>Sync Now</span>';
      }
    }
  };

  window.openOneDriveSyncModal = function() {
    const modal = document.getElementById('oneDriveSyncModal');
    if (modal) {
      updateSyncModalInfo();
      const fb = document.getElementById('syncModalFeedback');
      if (fb && !fb.innerHTML.includes('Synced Successfully')) {
        fb.classList.add('hidden');
      }
      modal.classList.remove('hidden');
    }
  };

  window.closeOneDriveSyncModal = function() {
    const modal = document.getElementById('oneDriveSyncModal');
    if (modal) modal.classList.add('hidden');
  };

  window.updateSyncModalInfo = updateSyncModalInfo;

  // Global singleton instance
  window.pmgOneDriveSync = new OneDriveSyncEngine();

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.pmgOneDriveSync.init());
  } else {
    window.pmgOneDriveSync.init();
  }
})(window);
