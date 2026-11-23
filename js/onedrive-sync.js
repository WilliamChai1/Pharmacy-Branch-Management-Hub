// js/onedrive-sync.js — PMG OneDrive Folder Live Sync Engine (Multi-Branch & Multi-PC)
'use strict';

(function(window) {
  const DB_NAME = 'pmg_onedrive_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'handles';
  const HANDLE_KEY = 'pmg_onedrive_root_handle';
  const PATIENTS_STORAGE_KEY = (typeof window !== 'undefined' && window.PATIENTS_STORAGE_KEY) || 'pmg_patients_data_v1';

  // ── UNIVERSAL BACKGROUND POLLING PAUSE GUARD ──
  window._pmgSyncPausedUntil = 0;
  window.pausePmgSyncPolling = function(durationMs = 5000) {
    const target = Date.now() + durationMs;
    if (target > window._pmgSyncPausedUntil) {
      window._pmgSyncPausedUntil = target;
    }
    console.log(`[PMG Sync Guard] Background polling paused for ${durationMs}ms (until ${new Date(window._pmgSyncPausedUntil).toLocaleTimeString()})`);
  };
  window.isPmgSyncPaused = function() {
    return Date.now() < (window._pmgSyncPausedUntil || 0);
  };

  // Recognized branch folders created in PMG OneDrive (Strictly Kota Sentosa)
  const KNOWN_BRANCH_FOLDERS = [
    'KOTA SENTOSA'
  ];

  // Mapping between branch codes/aliases and official OneDrive folder names
  const BRANCH_FOLDER_MAP = {
    // Kota Sentosa (Single Outlet Active)
    'KS01': 'KOTA SENTOSA',
    'KOTA SENTOSA': 'KOTA SENTOSA',
    'PMG PHARMACY (KOTA SENTOSA) SDN BHD': 'KOTA SENTOSA',
    'PMG PHARMACY KOTA SENTOSA': 'KOTA SENTOSA'
  };

  // Reverse mapping from folder name to storage branch code
  const FOLDER_BRANCH_CODE_MAP = {
    'KOTA SENTOSA': 'KS01',
    'KS01': 'KS01'
  };

  class OneDriveSyncEngine {
    constructor() {
      this.rootHandle = null;
      this.mode = 'DISCONNECTED'; // 'PARENT' (Kota Sentosa), 'BRANCH' (single outlet), 'DISCONNECTED'
      this.activeBranchFolder = null;
      this.branchSubHandles = {};
      this.lastKnownModified = 0;
      this.isSyncing = false;
      this.watcherInterval = null;
      this.autoSyncSeconds = 90;
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
            this._hideOneDriveResumeBanner();
            this._startBackgroundWatcher();
            await this.syncWithOneDriveFolder(true);
            // Stock expiry data syncs exclusively via Google Sheets as requested
            await this.syncReturnsWithOneDrive(true);
            await this.syncRentalsWithOneDrive(true);
            setTimeout(() => {
              if (typeof window.runDailyAutoBackupIfDue === 'function') {
                window.runDailyAutoBackupIfDue({ force: false }).catch(() => {});
              }
            }, 4000);
            return;
          } else {
            // Permission in 'prompt' state after PC/browser restart; show 1-click resume bar
            await this._inspectAndConfigureHandle(savedHandle);
            this._updateBadge('PERMISSION_NEEDED', 'OneDrive (Click to grant access)');
            this._showOneDriveResumeBanner();
            return;
          }
        }
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Auto-init failed:', err);
      }

      this._updateBadge('DISCONNECTED', 'OneDrive: Connect Folder');
    }

    // ─── 1-CLICK POST-RESTART AUTO-BACKUP RESUME BAR ─────────────────────────
    _showOneDriveResumeBanner() {
      if (typeof document === 'undefined' || !document.body) return;
      if (document.getElementById('pmgOneDriveResumeBar')) return;
      const folderLabel = this.rootHandle?.name || 'KOTA SENTOSA';
      const bar = document.createElement('div');
      bar.id = 'pmgOneDriveResumeBar';
      bar.className = 'fixed bottom-4 right-4 z-[99990] max-w-md bg-amber-950/95 text-amber-50 border border-amber-400/70 rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 backdrop-blur-sm';
      bar.innerHTML = `
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-shield-halved text-amber-300 text-base"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-extrabold text-white">OneDrive Auto-Backup Paused After Restart</div>
          <div class="text-[11px] text-amber-200 leading-snug">Click once to re-enable silent daily backups to <b>${escapeSyncHtml(folderLabel)}</b>.</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" id="btnPmgResumeAutoBackup" onclick="window.pmgOneDriveSync.resumeAutoBackupAfterRestart()"
            class="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-[11px] rounded-xl transition shadow-sm cursor-pointer whitespace-nowrap">
            🔓 Resume
          </button>
          <button type="button" onclick="window.pmgOneDriveSync._hideOneDriveResumeBanner()" title="Dismiss for now"
            class="p-1.5 text-amber-300 hover:text-white rounded-lg text-xs cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
      document.body.appendChild(bar);
    }

    _hideOneDriveResumeBanner() {
      if (typeof document === 'undefined') return;
      const bar = document.getElementById('pmgOneDriveResumeBar');
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    }

    async resumeAutoBackupAfterRestart() {
      if (!this.rootHandle) {
        return this.connectFolder();
      }
      const btn = typeof document !== 'undefined' ? document.getElementById('btnPmgResumeAutoBackup') : null;
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resuming…';
      }
      try {
        const granted = await this._verifyPermission(this.rootHandle, true, true);
        if (!granted) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🔓 Resume';
          }
          showPmgToast('Permission was not granted. Click Resume or OneDrive Sync anytime to enable backups.', 'warning');
          return false;
        }
        this._hideOneDriveResumeBanner();
        await this._inspectAndConfigureHandle(this.rootHandle);
        this._startBackgroundWatcher();
        await this.syncWithOneDriveFolder(true);
        await this.syncReturnsWithOneDrive(true);
        await this.syncRentalsWithOneDrive(true);
        if (typeof window.runDailyAutoBackupIfDue === 'function') {
          await window.runDailyAutoBackupIfDue({ force: false });
        }
        updateSyncModalInfo();
        showPmgToast('✅ OneDrive Live Sync & Daily Auto-Backup Resumed!', 'success');
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] resumeAutoBackupAfterRestart error:', err);
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔓 Resume';
        }
        return false;
      }
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
        try {
          await this.manualSync();
        } catch (syncErr) {
          console.warn('[PMG OneDrive Sync] Initial sync warning during connect:', syncErr);
        }

        // Cross-PC sync: Refresh timetable preferences & saved roster if scheduler is open
        try {
          if (typeof window.syncTeammatePreferencesWithCloud === 'function') {
            window.syncTeammatePreferencesWithCloud();
          }
          if (typeof window.checkAndLoadSavedTimetable === 'function') {
            const b = document.getElementById('schedulerBranchSelect')?.value || 'KS01';
            const m = document.getElementById('schedulerMonth')?.value || '2026-11';
            window.checkAndLoadSavedTimetable(b, m);
          }
        } catch (_) {}

        const folderDesc = this.mode === 'PARENT' 
          ? `Master "Patient care" (Kota Sentosa)`
          : `Branch Outlet (${this.activeBranchFolder})`;

        alert(`✅ PMG OneDrive Connected Successfully!\n\nFolder: ${handle.name}\nMode: ${folderDesc}\n\nClinical records, encounters, and appointments are now synchronized in real-time across branch PCs.`);
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

      // Automated cleanup: remove legacy non-Kota Sentosa branch folders if present
      const LEGACY_BRANCHES_TO_CLEANUP = [
        'MATANG JAYA', 'SUNGAI MOYAN', 'MALIHAH', 'METROCITY', 'ASTANA', 'SAMARIANG', 'MATANG', 'MOYAN', 'SEMARIANG'
      ];
      for (const legacyBranch of LEGACY_BRANCHES_TO_CLEANUP) {
        try {
          await handle.removeEntry(legacyBranch, { recursive: true });
          console.log(`[PMG OneDrive Sync] 🧹 Auto-removed legacy branch folder: ${legacyBranch}`);
        } catch (_) {}
      }

      // Check if handle has subfolders matching our branch names
      let detectedSubfolders = [];
      try {
        if (typeof handle.entries === 'function') {
          for await (const [name, entry] of handle.entries()) {
            if (entry.kind === 'directory') {
              const upper = name.trim().toUpperCase();
              const canonical = BRANCH_FOLDER_MAP[upper] || (KNOWN_BRANCH_FOLDERS.includes(upper) ? upper : null);
              if (canonical && KNOWN_BRANCH_FOLDERS.includes(canonical)) {
                this.branchSubHandles[canonical] = entry;
                this.branchSubHandles[upper] = entry; // Also store raw handle
                if (!detectedSubfolders.includes(canonical)) {
                  detectedSubfolders.push(canonical);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Reading directory entries:', err.message || err);
      }

      if (detectedSubfolders.length > 0) {
        // Connected to parent "Patient care" folder (Kota Sentosa)
        this.mode = 'PARENT';
        this.activeBranchFolder = this._resolveCurrentBranchName();
        this._updateBadge('CONNECTED', `OneDrive: Live (Kota Sentosa)`);
      } else if (KNOWN_BRANCH_FOLDERS.includes(folderName) || BRANCH_FOLDER_MAP[folderName]) {
        // Connected directly to a branch folder (e.g. "KOTA SENTOSA")
        const canonical = BRANCH_FOLDER_MAP[folderName] || folderName;
        this.mode = 'BRANCH';
        this.activeBranchFolder = canonical;
        this.branchSubHandles[canonical] = handle;
        this._updateBadge('CONNECTED', `OneDrive: Live (${canonical})`);
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
      const pCanon = BRANCH_FOLDER_MAP[pBranch] || pBranch;
      const tCanon = BRANCH_FOLDER_MAP[target] || target;
      return pCanon === tCanon;
    }

    async _getTargetBranchDirectoryHandle(branchFolderName) {
      const rawName = (branchFolderName || this._resolveCurrentBranchName()).toUpperCase();
      const targetName = BRANCH_FOLDER_MAP[rawName] || rawName;

      // STRICT PROTECTION: Never create or access folders outside the 7 managed outlets!
      if (!KNOWN_BRANCH_FOLDERS.includes(targetName)) {
        console.warn(`[PMG OneDrive Sync] Blocked folder creation for unmanaged branch: "${rawName}"`);
        return null;
      }

      if (this.mode === 'PARENT') {
        if (this.branchSubHandles[targetName]) {
          this._cleanupConflictFiles(this.branchSubHandles[targetName]).catch(() => {});
          return this.branchSubHandles[targetName];
        }
        // Try creating or getting subfolder if permitted
        try {
          const sub = await this.rootHandle.getDirectoryHandle(targetName, { create: true });
          this.branchSubHandles[targetName] = sub;
          this._cleanupConflictFiles(sub).catch(() => {});
          return sub;
        } catch (err) {
          console.warn(`[PMG OneDrive Sync] Could not access subfolder ${targetName}:`, err.message || err);
          return null;
        }
      } else if (this.mode === 'BRANCH') {
        this._cleanupConflictFiles(this.rootHandle).catch(() => {});
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

        // Step 0 (IT Browser Wipe Auto-Recovery): If localStorage was cleared by IT, auto-restore from OneDrive vault (per-PC → shared LATEST → newest Daily_Auto_Backups)
        try {
          let pmgKeyCount = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) || '';
            if (k.startsWith('pmg_') || k.startsWith('KS01_')) pmgKeyCount++;
          }
          if (pmgKeyCount <= 4 && typeof window.restoreFullSystemVaultFromObject === 'function') {
            const devTag = typeof window.getDeviceBackupTag === 'function' ? window.getDeviceBackupTag() : '';
            const candidateFiles = [];
            if (devTag) candidateFiles.push(`PMG_FULL_SYSTEM_VAULT_LATEST_${devTag}.pmgbak`);
            candidateFiles.push('PMG_FULL_SYSTEM_VAULT_LATEST.pmgbak');

            let vaultText = '';
            let sourceName = '';
            for (const fname of candidateFiles) {
              try {
                const vFh = await this.rootHandle.getFileHandle(fname, { create: false });
                const vFile = await vFh.getFile();
                const txt = await vFile.text();
                if (txt && txt.trim()) {
                  vaultText = txt;
                  sourceName = fname;
                  break;
                }
              } catch (_) {}
            }

            if (!vaultText) {
              const searchParents = [];
              try {
                const bDir = await this._getTargetBranchDirectoryHandle(this._resolveCurrentBranchName());
                if (bDir) searchParents.push(bDir);
              } catch (_) {}
              if (!searchParents.includes(this.rootHandle)) searchParents.push(this.rootHandle);

              for (const parentDir of searchParents) {
                try {
                  const dailyDir = await parentDir.getDirectoryHandle('Daily_Auto_Backups', { create: false });
                  if (dailyDir && typeof dailyDir.entries === 'function') {
                    const dailyFiles = [];
                    for await (const [name, entry] of dailyDir.entries()) {
                      if (entry.kind === 'file' && /\.pmgbak$/i.test(name)) {
                        dailyFiles.push({ name, entry });
                      }
                    }
                    dailyFiles.sort((a, b) => b.name.localeCompare(a.name));
                    if (dailyFiles.length > 0) {
                      const f = await dailyFiles[0].entry.getFile();
                      const txt = await f.text();
                      if (txt && txt.trim()) {
                        vaultText = txt;
                        sourceName = `Daily_Auto_Backups/${dailyFiles[0].name}`;
                        break;
                      }
                    }
                  }
                } catch (_) {}
              }
            }

            if (vaultText && vaultText.trim()) {
              const vaultObj = JSON.parse(vaultText);
              await window.restoreFullSystemVaultFromObject(vaultObj, { silent: true, skipReload: true });
              console.log(`[PMG OneDrive Sync] 🛡️ Auto-restored full system vault from OneDrive (${sourceName}) after browser storage cleanup.`);
            }
          }
        } catch (autoRestErr) {
          console.warn('[PMG OneDrive Sync] Auto-restore check warning:', autoRestErr);
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
        let allMergedPatientsAcrossBranches = [];
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
          const localBranchPatients = (typeof patientsData !== 'undefined' && Array.isArray(patientsData) ? patientsData : []).filter(p => {
            return this._patientMatchesBranch(p, branchName);
          });

          // Step C: Bidirectional conflict-free merge
          const mergedBranchPatients = this._mergePatientArrays(localBranchPatients, cloudPatients);
          allMergedPatientsAcrossBranches.push(...mergedBranchPatients);

          // Step D: Update global patientsData
          if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
            const otherPatients = patientsData.filter(p => !this._patientMatchesBranch(p, branchName));
            patientsData = [...otherPatients, ...mergedBranchPatients];
          }

          // Step E: Write merged branch records back to OneDrive patients_master.json
          // SMART WRITE GUARD: Only write if there are actual new/modified patient records
          const needsPatientWrite = (cloudPatients.length === 0 && mergedBranchPatients.length > 0) ||
                                    !this._arePatientArraysEqual(mergedBranchPatients, cloudPatients);

          if (needsPatientWrite) {
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
            console.log(`[PMG OneDrive Sync] manualSync: Saved ${mergedBranchPatients.length} patient records to ${branchName}`);
          } else {
            console.log(`[PMG OneDrive Sync] manualSync: Skipped writing patients_master.json for ${branchName} (Data is identical)`);
          }

          // Step F: Bidirectional sync of schedule_settings.json (working hours & overrides)
          try {
            const bCode = FOLDER_BRANCH_CODE_MAP[branchName] || branchName;
            let cloudSched = null;
            try {
              const schedHandle = await dirHandle.getFileHandle('schedule_settings.json', { create: false });
              const sFile = await schedHandle.getFile();
              const sText = await sFile.text();
              if (sText && sText.trim()) {
                const parsed = JSON.parse(sText);
                cloudSched = parsed.schedule || parsed;
                if (parsed.lastUpdated && !cloudSched.lastUpdated) {
                  cloudSched.lastUpdated = parsed.lastUpdated;
                }
              }
            } catch (_) {}

            const localRaw = localStorage.getItem(`pmg_pharmacist_schedule_${bCode}`);
            const localSched = localRaw ? JSON.parse(localRaw) : null;

            if (cloudSched && (!localSched || (cloudSched.lastUpdated || '') > (localSched.lastUpdated || ''))) {
              // Remote OneDrive schedule is newer: update local localStorage
              localStorage.setItem(`pmg_pharmacist_schedule_${bCode}`, JSON.stringify(cloudSched));
              console.log(`[PMG OneDrive Sync] Pulled newer schedule from OneDrive for ${bCode}`);
            } else if (localSched && (!cloudSched || (localSched.lastUpdated || '') > (cloudSched.lastUpdated || ''))) {
              // Local schedule is newer: upload to OneDrive
              const schedPayload = {
                branch: branchName,
                branchCode: bCode,
                lastUpdated: localSched.lastUpdated || nowIso,
                updatedBy: localSched.updatedBy || session?.displayName || 'Pharmacist',
                schedule: localSched
              };
              const schedHandle = await dirHandle.getFileHandle('schedule_settings.json', { create: true });
              const sw = await schedHandle.createWritable();
              await sw.write(JSON.stringify(schedPayload, null, 2));
              await sw.close();
              console.log(`[PMG OneDrive Sync] Uploaded local schedule to OneDrive for ${bCode}`);
            }
          } catch (schedSyncErr) {
            console.warn(`[PMG OneDrive Sync] Schedule sync warning for ${branchName}:`, schedSyncErr);
          }

          // Step F2: Bidirectional sync of monthly AI timetables (monthly_timetable_*.json)
          try {
            const bCode = FOLDER_BRANCH_CODE_MAP[branchName] || branchName;
            if (typeof dirHandle.values === 'function') {
              for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && /^monthly_timetable_\d{4}-\d{2}\.json$/i.test(entry.name)) {
                  try {
                    const match = entry.name.match(/monthly_timetable_(\d{4}-\d{2})\.json/i);
                    const mKey = match ? match[1] : null;
                    if (!mKey) continue;
                    const f = await entry.getFile();
                    const text = await f.text();
                    if (text && text.trim()) {
                      const parsed = JSON.parse(text);
                      const cloudTt = parsed.timetable || parsed;
                      const cloudTime = parsed.lastSaved || cloudTt.lastSaved || '';
                      const localKey = `pmg_saved_timetable_${bCode}_${mKey}`;
                      const localRaw = localStorage.getItem(localKey);
                      const localTt = localRaw ? JSON.parse(localRaw) : null;
                      const localTime = localTt?.lastSaved || '';

                      if (!localTt || (cloudTime && cloudTime > localTime)) {
                        localStorage.setItem(localKey, JSON.stringify(cloudTt));
                        console.log(`[PMG OneDrive Sync] Pulled newer timetable from OneDrive for ${bCode} (${mKey})`);
                      }
                    }
                  } catch (_) {}
                }
              }
            }

            // Push any newer local timetables to OneDrive
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(`pmg_saved_timetable_${bCode}_`)) {
                const mKey = k.replace(`pmg_saved_timetable_${bCode}_`, '');
                if (/^\d{4}-\d{2}$/.test(mKey)) {
                  try {
                    const localRaw = localStorage.getItem(k);
                    if (localRaw) {
                      const localTt = JSON.parse(localRaw);
                      const fileName = `monthly_timetable_${mKey}.json`;
                      let cloudTt = null;
                      try {
                        const h = await dirHandle.getFileHandle(fileName, { create: false });
                        const f = await h.getFile();
                        const t = await f.text();
                        if (t) cloudTt = JSON.parse(t);
                      } catch (_) {}

                      const localTime = localTt.lastSaved || '';
                      const cloudTime = cloudTt?.lastSaved || cloudTt?.timetable?.lastSaved || '';
                      if (!cloudTt || (localTime && localTime > cloudTime)) {
                        const payload = {
                          branch: branchName,
                          branchCode: bCode,
                          month: mKey,
                          lastSaved: localTime || nowIso,
                          savedBy: localTt.savedBy || session?.displayName || 'Pharmacist',
                          timetable: localTt
                        };
                        const h = await dirHandle.getFileHandle(fileName, { create: true });
                        const w = await h.createWritable();
                        await w.write(JSON.stringify(payload, null, 2));
                        await w.close();
                        console.log(`[PMG OneDrive Sync] Uploaded local timetable to OneDrive for ${bCode} (${mKey})`);
                      }
                    }
                  } catch (_) {}
                }
              }
            }
          } catch (ttSyncErr) {
            console.warn(`[PMG OneDrive Sync] Timetable sync warning for ${branchName}:`, ttSyncErr);
          }

          // Step F3: Bidirectional sync of teammate preferences (schedule_preferences_*.json)
          try {
            const bCode = (FOLDER_BRANCH_CODE_MAP[branchName] || branchName || 'KS01').toUpperCase();
            const prefFileName = `schedule_preferences_${bCode}.json`;
            let cloudPrefs = null;
            let cloudPrefTime = '';
            try {
              const pfHandle = await dirHandle.getFileHandle(prefFileName, { create: false });
              const pfFile = await pfHandle.getFile();
              const pfText = await pfFile.text();
              if (pfText && pfText.trim()) {
                const parsed = JSON.parse(pfText);
                cloudPrefs = parsed.preferences || (Array.isArray(parsed) ? parsed : null);
                cloudPrefTime = parsed.lastUpdated || '';
              }
            } catch (_) {}

            const localPrefKey = `pmg_staff_preferences_v2_${bCode}`;
            const localUpdatedKey = `pmg_staff_preferences_v2_${bCode}_updatedAt`;
            const localPrefRaw = localStorage.getItem(localPrefKey);
            const localPrefs = localPrefRaw ? JSON.parse(localPrefRaw) : null;
            const localUpdated = localStorage.getItem(localUpdatedKey) || '';

            // Conflict comparison check via applyCloudPreferences
            if (cloudPrefs && Array.isArray(cloudPrefs) && cloudPrefs.length > 0 && this.applyCloudPreferences(bCode, { data: cloudPrefs, lastUpdated: cloudPrefTime })) {
              if (cloudPrefTime) localStorage.setItem(`pmg_schedule_prefs_cloud_updatedAt_${bCode}`, cloudPrefTime);
              console.log(`[PMG OneDrive Sync] Pulled newer staff preferences from OneDrive for ${bCode} (updatedAt: ${cloudPrefTime})`);
            } else if (localPrefs && Array.isArray(localPrefs) && localPrefs.length > 0 && (!cloudPrefs || !cloudPrefTime || (localUpdated && new Date(localUpdated) > new Date(cloudPrefTime)))) {
              const effectiveUpdatedAt = localUpdated || nowIso;
              localStorage.setItem(localUpdatedKey, effectiveUpdatedAt);
              const prefPayload = {
                branch: branchName,
                branchCode: bCode,
                lastUpdated: effectiveUpdatedAt,
                updatedBy: session?.displayName || 'Pharmacist',
                preferences: localPrefs
              };
              const pfHandle = await dirHandle.getFileHandle(prefFileName, { create: true });
              const pw = await pfHandle.createWritable();
              await pw.write(JSON.stringify(prefPayload, null, 2));
              await pw.close();
              console.log(`[PMG OneDrive Sync] Uploaded local staff preferences to OneDrive for ${bCode} (updatedAt: ${effectiveUpdatedAt})`);
            }
          } catch (prefSyncErr) {
            console.warn(`[PMG OneDrive Sync] Preferences sync warning for ${branchName}:`, prefSyncErr);
          }

          // Step G: Bidirectional sync of patient documents & clinical reports (Airdoc, Blood tests, Lab PDFs)
          try {
            const branchPatientIds = new Set(mergedBranchPatients.map(p => p.id));

            // 1. Read existing patient_documents.json from OneDrive
            let cloudDocs = [];
            try {
              const docHandle = await dirHandle.getFileHandle('patient_documents.json', { create: false });
              const dFile = await docHandle.getFile();
              const dText = await dFile.text();
              if (dText && dText.trim()) {
                const parsedDocs = JSON.parse(dText);
                cloudDocs = Array.isArray(parsedDocs.documents) ? parsedDocs.documents : [];
              }
            } catch (_) {}

            // 2. Export local documents metadata from IndexedDB (memory-leak free; avoids massive base64 conversion)
            const allLocalDocs = (typeof window.exportAllDocumentsMetadata === 'function')
              ? await window.exportAllDocumentsMetadata()
              : ((typeof window.exportAllDocuments === 'function') ? await window.exportAllDocuments() : []);
            const localBranchDocs = allLocalDocs.filter(d => branchPatientIds.has(d.patientId));
            const localDocIdMap = new Map(localBranchDocs.map(d => [d.id, d]));

            // 3. Import missing cloud docs into local IndexedDB
            const docsToImport = cloudDocs.filter(cd => !localDocIdMap.has(cd.id));
            if (docsToImport.length > 0 && typeof window.importAllDocuments === 'function') {
              await window.importAllDocuments(docsToImport);
              console.log(`[PMG OneDrive Sync] Imported ${docsToImport.length} cloud patient document(s) into local IndexedDB for ${branchName}`);
            }

            // 4. Merge all document metadata
            const mergedDocsMap = new Map();
            cloudDocs.forEach(d => mergedDocsMap.set(d.id, d));
            localBranchDocs.forEach(d => mergedDocsMap.set(d.id, d));
            const finalMergedDocs = Array.from(mergedDocsMap.values());

            // 5. Write merged patient_documents.json back to OneDrive (lightweight JSON)
            const docFileHandle = await dirHandle.getFileHandle('patient_documents.json', { create: true });
            const docWritable = await docFileHandle.createWritable();
            await docWritable.write(JSON.stringify({
              branch: branchName,
              lastSync: nowIso,
              count: finalMergedDocs.length,
              documents: finalMergedDocs
            }, null, 2));
            await docWritable.close();

            // 6. Bidirectional native binary sync of AirDoc / Blood Report PDFs with OneDrive Patient_Reports/
            //    - Uploads newly added local PDFs directly as binary files (zero Base64 RAM spike)
            //    - Auto-restores missing PDF blobs from Patient_Reports/ back into IndexedDB after IT browser wipes!
            try {
              this._syncedReportFilenames = this._syncedReportFilenames || new Set();
              if (typeof window.syncPatientReportsBinaryFolder === 'function') {
                await window.syncPatientReportsBinaryFolder(dirHandle, finalMergedDocs, this._syncedReportFilenames);
              }
            } catch (dirErr) {
              console.warn('[PMG OneDrive Sync] Patient_Reports bidirectional binary sync warning:', dirErr);
            }
          } catch (docSyncErr) {
            console.warn(`[PMG OneDrive Sync] Document sync notice for ${branchName}:`, docSyncErr);
          }

          totalMergedPatients += mergedBranchPatients.length;
          syncedBranches.push(branchName);
        }

        // ─── STEP G: UNIVERSAL SYNC — CREDIT NOTES, PRN & DELIVERY ORDERS ──────
        let returnsSyncedCount = 0;
        try {
          await this.syncReturnsWithOneDrive(true);
          const currentReturns = (window.pmgReturns && typeof window.pmgReturns.getReturnsData === 'function')
            ? window.pmgReturns.getReturnsData()
            : JSON.parse(localStorage.getItem('pmg_returns_records_v1') || '[]');
          returnsSyncedCount = Array.isArray(currentReturns) ? currentReturns.length : 0;
        } catch (returnsErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Returns warning:', returnsErr);
        }

        // ─── STEP G2: UNIVERSAL SYNC — MEDICAL EQUIPMENT RENTALS ──────────────
        let rentalsSyncedCount = 0;
        try {
          const syncedRentals = await this.syncRentalsWithOneDrive(true);
          rentalsSyncedCount = Array.isArray(syncedRentals) ? syncedRentals.length : 0;
        } catch (rentalErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Rentals warning:', rentalErr);
        }

        // ─── STEP H: UNIVERSAL SYNC — HR RECRUITMENT & JOB APPLICATIONS ────────
        let recruitmentSyncedCount = 0;
        try {
          if (typeof window.pmgRecruitment !== 'undefined' && typeof window.pmgRecruitment.loadApps === 'function') {
            const apps = window.pmgRecruitment.loadApps();
            if (this.rootHandle && Array.isArray(apps)) {
              let recDir = this.rootHandle;
              try {
                recDir = await this.rootHandle.getDirectoryHandle('RECRUITMENT', { create: true });
              } catch (_) { recDir = this.rootHandle; }

              // Read existing applications to merge bidirectionally
              let cloudApps = [];
              try {
                const exFh = await recDir.getFileHandle('recruitment_full_backup.json', { create: false });
                const exF = await exFh.getFile();
                const exT = await exF.text();
                if (exT && exT.trim()) cloudApps = JSON.parse(exT);
              } catch (_) {}

              const appMap = new Map();
              (cloudApps || []).forEach(a => { if (a && a.id) appMap.set(a.id, a); });
              (apps || []).forEach(a => { if (a && a.id) appMap.set(a.id, a); });
              const mergedApps = Array.from(appMap.values());
              if (typeof window.pmgRecruitment?.saveApps === 'function') {
                window.pmgRecruitment.saveApps(mergedApps);
              }

              // 1. Summary JSON
              const summary = mergedApps.map(a => ({
                id: a.id, name: a.name, position: a.position, status: a.status,
                appliedAt: a.appliedAt, aiScore: a.aiScore, aiVerdict: a.aiVerdict,
                phone: a.phone, email: a.email, preferredBranch: a.preferredBranch,
                spm: a.spm, highestQual: a.highestQual, cgpa: a.cgpa
              }));
              const fhSummary = await recDir.getFileHandle('recruitment_summary.json', { create: true });
              const wSummary = await fhSummary.createWritable();
              await wSummary.write(JSON.stringify(summary, null, 2));
              await wSummary.close();

              // 2. Full backup JSON (applications, documents metadata, interview slots)
              const fhFull = await recDir.getFileHandle('recruitment_full_backup.json', { create: true });
              const wFull = await fhFull.createWritable();
              await wFull.write(JSON.stringify(mergedApps, null, 2));
              await wFull.close();

              // 3. Unpack and write each applicant's real documents into /RECRUITMENT/Applicants/
              try {
                if (typeof window.pmgRecruitment?.saveSingleApplicantToOneDrive === 'function') {
                  for (const app of mergedApps) {
                    await window.pmgRecruitment.saveSingleApplicantToOneDrive(app, this.rootHandle);
                  }
                }
              } catch (appDocErr) {
                console.warn('[PMG OneDrive Sync] Applicant documents folder write warning:', appDocErr);
              }

              recruitmentSyncedCount = mergedApps.length;
            }
          }
        } catch (recErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Recruitment warning:', recErr);
        }

        // ─── STEP I: UNIVERSAL SYNC — PRICING INTELLIGENCE MASTER SKUS ─────────
        let pricingSyncedCount = 0;
        try {
          let skus = null;
          if (window.pmgPricing && Array.isArray(window.pmgPricing.skus) && window.pmgPricing.skus.length > 0) {
            skus = window.pmgPricing.skus;
          } else {
            const rawSkus = localStorage.getItem('pmg_pricing_skus_master') || localStorage.getItem('pmg_pricing_skus_master_v1');
            if (rawSkus) skus = JSON.parse(rawSkus);
          }
          if (skus && skus.length > 0) {
            await this.savePricingMasterToOneDrive(skus);
            pricingSyncedCount = skus.length;
          }
        } catch (pricingErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Pricing warning:', pricingErr);
        }

        // ─── STEP J: STOCK EXPIRY (SYNCED EXCLUSIVELY VIA GOOGLE SHEETS) ───────

        // ─── STEP K: UNIVERSAL SYNC — CUSTOMER PROMO & WHATSAPP BROADCASTER ─────
        try {
          if (typeof window.syncPromoBroadcastWithOneDrive === 'function') {
            await window.syncPromoBroadcastWithOneDrive();
          }
        } catch (promoSyncErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Promo warning:', promoSyncErr);
        }

        // Persist local patientsData and refresh views
        if (typeof savePatientsData === 'function') {
          savePatientsData();
        } else if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
          if (typeof safeStorageSet === 'function') {
            safeStorageSet(PATIENTS_STORAGE_KEY, patientsData);
          } else {
            try {
              localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
            } catch (e) {
              console.warn('[PMG OneDrive Sync] LocalStorage quota warning for patientsData:', e);
            }
          }
        } else if (allMergedPatientsAcrossBranches.length > 0) {
          if (typeof safeStorageSet === 'function') {
            safeStorageSet(PATIENTS_STORAGE_KEY, allMergedPatientsAcrossBranches);
          } else {
            try {
              localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(allMergedPatientsAcrossBranches));
            } catch (e) {
              console.warn('[PMG OneDrive Sync] LocalStorage quota warning for patientsData:', e);
            }
          }
        }
        if (typeof renderPatientModule === 'function') {
          renderPatientModule();
        }

        const mainBranchLabel = syncedBranches[0] || this.activeBranchFolder || 'Kota Sentosa';

        // Record last backup details in localStorage
        try {
          localStorage.setItem('pmg_last_backup_date', nowIso);
          localStorage.setItem('pmg_last_backup_type', `OneDrive Live (${mainBranchLabel})`);
          if (session?.displayName) localStorage.setItem('pmg_last_backup_user', session.displayName);
        } catch (_) {}

        // Step J: Safely snapshot per-PC & anti-clobber shared master vault + trigger today's rolling Daily Auto-Backup if due
        try {
          if (this.rootHandle && typeof window.buildFullSystemVaultBundle === 'function') {
            const devTag = typeof window.getDeviceBackupTag === 'function' ? window.getDeviceBackupTag() : 'PC-DEFAULT';
            const vaultSnap = await window.buildFullSystemVaultBundle({ includeDocBlobs: false });
            if (typeof window.writeMasterVaultSafely === 'function') {
              await window.writeMasterVaultSafely(this.rootHandle, vaultSnap.bundle, devTag);
            } else {
              const vFh = await this.rootHandle.getFileHandle(`PMG_FULL_SYSTEM_VAULT_LATEST_${devTag}.pmgbak`, { create: true });
              const vW = await vFh.createWritable();
              await vW.write(JSON.stringify(vaultSnap.bundle, null, 2));
              await vW.close();
            }
            if (typeof window.runDailyAutoBackupIfDue === 'function') {
              await window.runDailyAutoBackupIfDue({ force: false, rootHandle: this.rootHandle, quiet: true });
            }
          }
        } catch (vaultErr) {
          console.warn('[PMG OneDrive Sync] Full vault snapshot write warning:', vaultErr);
        }

        this._hideOneDriveResumeBanner();
        if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
        if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();

        const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${mainBranchLabel})`);

        return {
          success: true,
          branch: mainBranchLabel,
          count: totalMergedPatients,
          time: timeStr,
          branches: syncedBranches,
          returnsCount: returnsSyncedCount,
          rentalsCount: rentalsSyncedCount,
          recruitmentCount: recruitmentSyncedCount,
          pricingCount: pricingSyncedCount
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
      if (this.isSyncing || this._isSavingToOneDrive) {
        this._pendingSaveToOneDrive = true;
        return false;
      }

      // Check permission without prompting if called silently in background
      const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
      if (!hasPerm) return false;

      const targetBranch = this._resolveCurrentBranchName();
      const dirHandle = await this._getTargetBranchDirectoryHandle(targetBranch);
      if (!dirHandle) return false;

      this.isSyncing = true;
      this._isSavingToOneDrive = true;
      this._updateBadge('SYNCING', 'OneDrive: Syncing…');

      try {
        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();

        // Step 1: Read existing cloud patients first to ensure conflict-free merge
        let cloudPatients = [];
        try {
          const existingFileHandle = await dirHandle.getFileHandle('patients_master.json', { create: false });
          const existingFile = await existingFileHandle.getFile();
          const existingText = await existingFile.text();
          if (existingText && existingText.trim()) {
            const parsed = JSON.parse(existingText);
            if (Array.isArray(parsed.patients)) {
              cloudPatients = parsed.patients;
            }
          }
        } catch (_) {
          // File does not exist yet on OneDrive; cloudPatients remains empty
        }

        // Filter local patients for this specific branch
        const localBranchPatients = (patientsArray || []).filter(p => this._patientMatchesBranch(p, targetBranch));

        // Step 2: Merge local and cloud patients bidirectionally
        const mergedBranchPatients = this._mergePatientArrays(localBranchPatients, cloudPatients);

        // Step 3: Update global in-memory patientsData and localStorage directly (avoid infinite re-entrant save loops)
        if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
          const otherPatients = patientsData.filter(p => !this._patientMatchesBranch(p, targetBranch));
          patientsData = [...otherPatients, ...mergedBranchPatients];
          if (typeof safeStorageSet === 'function') {
            safeStorageSet(PATIENTS_STORAGE_KEY, patientsData);
          } else {
            try {
              localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
            } catch (e) {
              console.warn('[PMG OneDrive Sync] LocalStorage quota warning for patientsData:', e);
            }
          }
        }

        // SMART WRITE GUARD: If cloud already has data and records are 100% equal, skip disk write
        if (cloudPatients.length > 0 && this._arePatientArraysEqual(mergedBranchPatients, cloudPatients)) {
          console.log(`[PMG OneDrive Sync] saveToOneDrive: Skipped disk write for ${targetBranch} (Data is identical)`);
          const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${targetBranch})`);
          this._cleanupConflictFiles(dirHandle).catch(() => {});
          return true;
        }

        const syncPayload = {
          branch: targetBranch,
          lastSync: nowIso,
          syncedBy: session?.displayName || 'Pharmacist',
          device: navigator.userAgent.includes('Edg') ? 'Edge Windows' : 'Chrome Windows',
          count: mergedBranchPatients.length,
          patients: mergedBranchPatients
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
        try {
          localStorage.setItem('pmg_last_backup_date', nowIso);
          localStorage.setItem('pmg_last_backup_type', `OneDrive Live (${targetBranch})`);
          if (session?.displayName) localStorage.setItem('pmg_last_backup_user', session.displayName);
        } catch (_) {}

        if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
        if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();

        const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${targetBranch})`);
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Write warning:', err);
        return false;
      } finally {
        this.isSyncing = false;
        this._isSavingToOneDrive = false;
        if (this._pendingSaveToOneDrive) {
          this._pendingSaveToOneDrive = false;
          setTimeout(() => {
            if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
              this.saveToOneDrive(patientsData);
            }
          }, 600);
        }
      }
    }

    // Compatibility helper for immediate patient sync triggers
    triggerSync() {
      if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
        return this.saveToOneDrive(patientsData);
      }
      return Promise.resolve(false);
    }

    // ─── SAVE SCHEDULE CONFIG TO ONEDRIVE ────────────────────────────────────
    async saveScheduleToOneDrive(branchCode, scheduleObj) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      const bFolder = BRANCH_FOLDER_MAP[(branchCode || '').toUpperCase()] || this.activeBranchFolder || 'KOTA SENTOSA';
      const bCode = FOLDER_BRANCH_CODE_MAP[bFolder] || branchCode || 'KS01';
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return false;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();

        const payload = {
          branch: bFolder,
          branchCode: bCode,
          lastUpdated: scheduleObj.lastUpdated || nowIso,
          updatedBy: scheduleObj.updatedBy || session?.displayName || 'Pharmacist',
          schedule: scheduleObj
        };

        const fileHandle = await dirHandle.getFileHandle('schedule_settings.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        console.log(`[PMG OneDrive Sync] Saved schedule_settings.json to OneDrive for ${bFolder}`);
        return true;
      } catch (err) {
        console.warn(`[PMG OneDrive Sync] Could not save schedule to OneDrive for ${bFolder}:`, err);
        return false;
      }
    }

    // ─── SAVE MONTHLY GENERATED TIMETABLE TO ONEDRIVE ────────────────────────
    async saveMonthlyTimetableToOneDrive(branchCode, monthStr, timetableObj) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      const bFolder = BRANCH_FOLDER_MAP[(branchCode || '').toUpperCase()] || this.activeBranchFolder || 'KOTA SENTOSA';
      const bCode = FOLDER_BRANCH_CODE_MAP[bFolder] || branchCode || 'KS01';
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return false;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();

        const payload = {
          branch: bFolder,
          branchCode: bCode,
          month: monthStr,
          lastSaved: timetableObj.lastSaved || nowIso,
          savedBy: timetableObj.savedBy || session?.displayName || 'Pharmacist',
          timetable: timetableObj
        };

        const fileName = `monthly_timetable_${monthStr}.json`;
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        console.log(`[PMG OneDrive Sync] Saved ${fileName} to OneDrive for ${bFolder}`);
        return true;
      } catch (err) {
        console.warn(`[PMG OneDrive Sync] Could not save ${monthStr} timetable to OneDrive for ${bFolder}:`, err);
        return false;
      }
    }

    // ─── LOAD MONTHLY GENERATED TIMETABLE FROM ONEDRIVE ──────────────────────
    async loadMonthlyTimetableFromOneDrive(branchCode, monthStr) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return null;
      const bFolder = BRANCH_FOLDER_MAP[(branchCode || '').toUpperCase()] || this.activeBranchFolder || 'KOTA SENTOSA';
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return null;

      try {
        const fileName = `monthly_timetable_${monthStr}.json`;
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (!text || !text.trim()) return null;
        const parsed = JSON.parse(text);
        return parsed.timetable || parsed;
      } catch (_) {
        return null;
      }
    }

    // ─── LOCAL / CLOUD PREFERENCES HELPERS ──────────────────────────────────
    saveLocalPreferences(branchCode, preferencesArray) {
      const bCode = (branchCode || 'KS01').toUpperCase();
      const timestamp = new Date().toISOString();
      localStorage.setItem(`pmg_staff_preferences_v2_${bCode}`, JSON.stringify(preferencesArray));
      localStorage.setItem(`pmg_staff_preferences_v2_${bCode}_updatedAt`, timestamp);
      return timestamp;
    }

    applyCloudPreferences(branchCode, cloudPayload) {
      if (!cloudPayload) return false;
      const bCode = (branchCode || 'KS01').toUpperCase();
      const localTs = localStorage.getItem(`pmg_staff_preferences_v2_${bCode}_updatedAt`);
      const cloudTs = cloudPayload.lastUpdated;
      let data = cloudPayload.data || cloudPayload.preferences;

      if (localTs && (!cloudTs || new Date(cloudTs) <= new Date(localTs))) {
        console.log(`[Sync] Local preferences are newer or identical. Skipping cloud overwrite.`);
        return false;
      }

      if (!data || !Array.isArray(data) || data.length === 0) return false;

      // One-time repair for legacy corrupted KS01 cloud snapshots saved prior to fixing the Penny prevHds revert bug
      let effectiveTs = cloudTs || new Date().toISOString();
      if (bCode === 'KS01' && (!cloudTs || new Date(cloudTs) < new Date('2026-11-18T13:12:00.000Z'))) {
        data = JSON.parse(JSON.stringify(data));
        const penny = data.find(t => t.empNo === 'PMG02694' || (t.nickname || '').toUpperCase() === 'PENNY');
        if (penny && penny.dayPrefs &&
            (penny.dayPrefs.Monday === 'Flexible' || !penny.dayPrefs.Monday) &&
            penny.dayPrefs.Friday === 'Morning Half (5H)' &&
            penny.dayPrefs.Tuesday === 'RD' &&
            penny.dayPrefs.Wednesday === 'Morning Preferred' &&
            penny.dayPrefs.Thursday === 'Night Preferred' &&
            penny.dayPrefs.Saturday === 'Morning Preferred' &&
            penny.dayPrefs.Sunday === 'Night Preferred') {
          penny.restDayPref = 'Tuesday';
          penny.halfDayPref = 'Monday Morning (5H)';
          penny.dayPrefs.Monday = 'Morning Half (5H)';
          penny.dayPrefs.Friday = 'Night Preferred';
          effectiveTs = '2026-11-18T13:12:01.000Z';
        }
      }

      localStorage.setItem(`pmg_staff_preferences_v2_${bCode}`, JSON.stringify(data));
      localStorage.setItem(`pmg_staff_preferences_v2_${bCode}_updatedAt`, effectiveTs);
      return true;
    }

    // ─── SAVE TEAMMATE PREFERENCES TO ONEDRIVE ──────────────────────────────
    async saveTeammatePreferencesToOneDrive(branchCode, teammatesList) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      const bFolder = BRANCH_FOLDER_MAP[(branchCode || '').toUpperCase()] || this.activeBranchFolder || 'KOTA SENTOSA';
      const bCode = (FOLDER_BRANCH_CODE_MAP[bFolder] || branchCode || 'KS01').toUpperCase();
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return false;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();
        const localUpdatedKey = `pmg_staff_preferences_v2_${bCode}_updatedAt`;
        const effectiveUpdatedAt = localStorage.getItem(localUpdatedKey) || nowIso;
        try {
          localStorage.setItem(localUpdatedKey, effectiveUpdatedAt);
          localStorage.setItem(`pmg_schedule_prefs_cloud_updatedAt_${bCode}`, effectiveUpdatedAt);
        } catch (_) {}

        const payload = {
          branch: bFolder,
          branchCode: bCode,
          lastUpdated: effectiveUpdatedAt,
          updatedBy: session?.displayName || 'Pharmacist',
          preferences: teammatesList
        };

        const fileName = `schedule_preferences_${bCode}.json`;
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        console.log(`[PMG OneDrive Sync] Saved ${fileName} to OneDrive for ${bFolder}`);
        return true;
      } catch (err) {
        console.warn(`[PMG OneDrive Sync] Could not save preferences to OneDrive for ${bFolder}:`, err);
        return false;
      }
    }

    // ─── LOAD TEAMMATE PREFERENCES FROM ONEDRIVE ────────────────────────────
    async loadTeammatePreferencesFromOneDrive(branchCode) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return null;
      const bFolder = BRANCH_FOLDER_MAP[(branchCode || '').toUpperCase()] || this.activeBranchFolder || 'KOTA SENTOSA';
      const bCode = (FOLDER_BRANCH_CODE_MAP[bFolder] || branchCode || 'KS01').toUpperCase();
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return null;

      try {
        const fileName = `schedule_preferences_${bCode}.json`;
        let fileHandle = null;
        try {
          fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
        } catch (_) {
          try {
            fileHandle = await dirHandle.getFileHandle('schedule_preferences.json', { create: false });
          } catch (_) {}
        }
        if (!fileHandle) return null;

        const file = await fileHandle.getFile();
        const text = await file.text();
        if (!text || !text.trim()) return null;
        const parsed = JSON.parse(text);
        const prefs = parsed.preferences || (Array.isArray(parsed) ? parsed : null);
        if (!prefs || !Array.isArray(prefs) || prefs.length === 0) return null;

        const cloudLastUpdated = parsed && parsed.lastUpdated ? String(parsed.lastUpdated) : '';
        const localUpdatedKey = `pmg_staff_preferences_v2_${bCode}_updatedAt`;
        const localPrefKey = `pmg_staff_preferences_v2_${bCode}`;
        const localUpdated = localStorage.getItem(localUpdatedKey) || '';
        const hasLocalPrefs = !!localStorage.getItem(localPrefKey);

        // Conflict comparison check: Do NOT overwrite local preferences if cloudData.lastUpdated is older than or equal to localUpdated (when localUpdated exists)
        if (hasLocalPrefs && localUpdated && (!cloudLastUpdated || new Date(cloudLastUpdated) <= new Date(localUpdated))) {
          console.log(`[PMG OneDrive Sync] Skipped overwriting local preferences for ${bCode} (cloud lastUpdated "${cloudLastUpdated || 'missing'}" is not newer than local "${localUpdated}")`);
          return null;
        }

        // Store cloud timestamp in dedicated metadata key only; caller's applyCloudPreferences will update localUpdatedKey cleanly
        try {
          const metaKey = `pmg_schedule_prefs_cloud_updatedAt_${bCode}`;
          if (cloudLastUpdated) {
            localStorage.setItem(metaKey, cloudLastUpdated);
          } else {
            localStorage.removeItem(metaKey);
          }
        } catch (_) {}
        return prefs;
      } catch (_) {
        return null;
      }
    }

    // ─── GENERIC SAVE TO ACTIVE BRANCH FOLDER ──────────────────────────────
    async saveFileToActiveFolder(fileName, content) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      const bFolder = this.activeBranchFolder || 'KOTA SENTOSA';
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return false;
      try {
        const fh = await dirHandle.getFileHandle(fileName, { create: true });
        const w = await fh.createWritable();
        await w.write(content);
        await w.close();
        return true;
      } catch (_) {
        return false;
      }
    }

    // ─── SAVE INVOICE OR CREDIT NOTE TO ONEDRIVE (ACCOUNTS SOP HIERARCHY) ──
    async saveInvoiceOrCnToOneDrive(file, branchName, parsedMeta = {}) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') {
        console.warn('[PMG OneDrive Sync] OneDrive not connected. Invoice/CN not saved to cloud.');
        return { success: false, reason: 'DISCONNECTED' };
      }

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) {
          console.warn('[PMG OneDrive Sync] Permission required to save file to OneDrive.');
          return { success: false, reason: 'NO_PERMISSION' };
        }

        const bFolder = BRANCH_FOLDER_MAP[(branchName || '').toUpperCase()] || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
        const branchDir = await this._getTargetBranchDirectoryHandle(bFolder);
        if (!branchDir) {
          return { success: false, reason: 'BRANCH_DIR_ERROR' };
        }

        // 1. Year folder (e.g., '2026')
        const yearStr = parsedMeta.year ? String(parsedMeta.year) : String(new Date().getFullYear());
        const yearDir = await branchDir.getDirectoryHandle(yearStr, { create: true });

        // 2. Month folder (e.g., '09 - September')
        const monthStr = parsedMeta.monthFolder || this._formatCurrentMonthString();
        const monthDir = await yearDir.getDirectoryHandle(monthStr, { create: true });

        // 3. Category folder: 'Invoices' or 'Credit Note'
        const categoryFolder = (parsedMeta.type === 'CN' || parsedMeta.isCreditNote) ? 'Credit Note' : 'Invoices';
        const catDir = await monthDir.getDirectoryHandle(categoryFolder, { create: true });

        // 4. Vendor folder: clean vendor name (e.g. 'DKSH', 'Zuellig Pharma', 'Apex')
        const vendorFolder = (parsedMeta.vendor || 'General').replace(/[<>:"/\\|?*]/g, '').trim() || 'General';
        const vendorDir = await catDir.getDirectoryHandle(vendorFolder, { create: true });

        // 5. Write the file
        const fileName = file.name;
        const fileHandle = await vendorDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        const relPath = `${bFolder}/${yearStr}/${monthStr}/${categoryFolder}/${vendorFolder}/${fileName}`;
        console.log(`[PMG OneDrive Sync] Successfully saved ${categoryFolder} to OneDrive: ${relPath}`);

        // Record in document upload log
        this._recordDocumentUpload({
          branch: bFolder,
          year: yearStr,
          month: monthStr,
          category: categoryFolder,
          vendor: vendorFolder,
          fileName: fileName,
          docNumber: parsedMeta.docNumber || '',
          amount: parsedMeta.amount || '',
          timestamp: new Date().toISOString(),
          size: file.size
        });

        return {
          success: true,
          path: relPath,
          branch: bFolder,
          year: yearStr,
          month: monthStr,
          category: categoryFolder,
          vendor: vendorFolder,
          fileName: fileName
        };
      } catch (err) {
        console.error('[PMG OneDrive Sync] Save Invoice/CN error:', err);
        return { success: false, reason: err.message };
      }
    }

    // ─── SAVE SIGNED DO PROOF TO ONEDRIVE ────────────────────────────────────
    async saveSignedDoProofToOneDrive(file, branchName, doMeta = {}) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') {
        console.warn('[PMG OneDrive Sync] OneDrive not connected. Signed DO not saved to cloud.');
        return { success: false, reason: 'DISCONNECTED' };
      }

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) {
          console.warn('[PMG OneDrive Sync] Permission required to save signed DO to OneDrive.');
          return { success: false, reason: 'NO_PERMISSION' };
        }

        const bFolder = BRANCH_FOLDER_MAP[(branchName || '').toUpperCase()] || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
        const branchDir = await this._getTargetBranchDirectoryHandle(bFolder);
        if (!branchDir) {
          return { success: false, reason: 'BRANCH_DIR_ERROR' };
        }

        // 1. Dedicated DO folder at branch root level (e.g., 'KOTA SENTOSA / DO')
        const doRoot = await branchDir.getDirectoryHandle('DO', { create: true });

        // 2. Year folder under DO (e.g., '2026')
        const yearStr = doMeta.year ? String(doMeta.year) : String(new Date().getFullYear());
        const yearDir = await doRoot.getDirectoryHandle(yearStr, { create: true });

        // 3. Month folder under DO (e.g., '09 - September')
        const monthStr = doMeta.monthFolder || this._formatCurrentMonthString();
        const monthDir = await yearDir.getDirectoryHandle(monthStr, { create: true });

        // 4. Vendor folder: clean vendor name (e.g. 'DKSH', 'Sandoz', 'Intas')
        const vendorFolder = (doMeta.vendor || 'General').replace(/[<>:"/\\|?*]/g, '').trim() || 'General';
        const vendorDir = await monthDir.getDirectoryHandle(vendorFolder, { create: true });

        // 5. Safe file name with DO Number prefix
        const cleanDoNo = (doMeta.doNumber || 'DO').replace(/[<>:"/\\|?*]/g, '_');
        const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.pdf';
        const finalFileName = `${cleanDoNo}_Signed_Proof${ext}`;

        const fileHandle = await vendorDir.getFileHandle(finalFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        const relPath = `${bFolder}/DO/${yearStr}/${monthStr}/${vendorFolder}/${finalFileName}`;
        console.log(`[PMG OneDrive Sync] Successfully saved Signed DO to OneDrive: ${relPath}`);

        this._recordDocumentUpload({
          branch: bFolder,
          year: yearStr,
          month: monthStr,
          category: 'DO',
          vendor: vendorFolder,
          fileName: finalFileName,
          docNumber: doMeta.doNumber || '',
          timestamp: new Date().toISOString(),
          size: file.size
        });

        return {
          success: true,
          path: relPath,
          branch: bFolder,
          year: yearStr,
          month: monthStr,
          category: 'DO',
          vendor: vendorFolder,
          fileName: finalFileName
        };
      } catch (err) {
        console.error('[PMG OneDrive Sync] Save Signed DO error:', err);
        return { success: false, reason: err.message };
      }
    }

    // ─── SAVE RETURNS / CN DATABASE (JSON) TO ONEDRIVE ───────────────────────
    async saveReturnsDatabaseToOneDrive(branchName, returnsData) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      const bFolder = BRANCH_FOLDER_MAP[(branchName || '').toUpperCase()] || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
      const branchDir = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!branchDir) return false;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        const session = typeof getSession === 'function' ? getSession() : null;
        const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');
        const deletedSet = new Set(deletedIds);

        // Step 1: Read existing cloud returns to ensure conflict-free merge
        let cloudReturns = [];
        try {
          const existingHandle = await branchDir.getFileHandle('returns_credit_notes.json', { create: false });
          const ef = await existingHandle.getFile();
          const et = await ef.text();
          if (et && et.trim()) {
            const ep = JSON.parse(et);
            if (Array.isArray(ep.returns)) cloudReturns = ep.returns;
            else if (Array.isArray(ep)) cloudReturns = ep;
          }
        } catch (_) {}

        // Step 2: Merge returns by ID without resurrecting deleted items
        const returnMap = new Map();
        (cloudReturns || []).filter(r => r && r.id && !deletedSet.has(r.id)).forEach(r => returnMap.set(r.id, r));
        (returnsData || []).filter(r => r && r.id && !deletedSet.has(r.id)).forEach(r => {
          if (returnMap.has(r.id)) {
            const cld = returnMap.get(r.id);
            const locTime = r.updatedAt || r.createdAt || '';
            const cldTime = cld.updatedAt || cld.createdAt || '';
            if (locTime >= cldTime) {
              returnMap.set(r.id, { ...cld, ...r });
            }
          } else {
            returnMap.set(r.id, r);
          }
        });
        const mergedReturns = Array.from(returnMap.values());

        const payload = {
          branch: bFolder,
          lastUpdated: new Date().toISOString(),
          updatedBy: session?.displayName || 'Staff',
          totalRecords: mergedReturns.length,
          returns: mergedReturns
        };

        const fileHandle = await branchDir.getFileHandle('returns_credit_notes.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        console.log(`[PMG OneDrive Sync] Saved returns_credit_notes.json to OneDrive for ${bFolder} (${mergedReturns.length} records)`);
        return true;
      } catch (err) {
        console.warn(`[PMG OneDrive Sync] Could not save returns DB to OneDrive for ${bFolder}:`, err);
        return false;
      }
    }

    // ─── LOAD RETURNS / CN DATABASE (JSON) FROM ONEDRIVE ─────────────────────
    async loadReturnsDatabaseFromOneDrive(branchName) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return null;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
        if (!hasPerm) return null;

        // In PARENT mode without specific branch, scan all branches
        if (this.mode === 'PARENT' && (!branchName || branchName === 'ALL')) {
          let allCloudReturns = [];
          for (const b of KNOWN_BRANCH_FOLDERS) {
            try {
              const bDir = await this._getTargetBranchDirectoryHandle(b);
              if (!bDir) continue;
              const fh = await bDir.getFileHandle('returns_credit_notes.json', { create: false });
              const f = await fh.getFile();
              const t = await f.text();
              if (t && t.trim()) {
                const p = JSON.parse(t);
                const arr = Array.isArray(p.returns) ? p.returns : (Array.isArray(p) ? p : []);
                allCloudReturns.push(...arr);
              }
            } catch (_) {}
          }
          return allCloudReturns;
        }

        const bFolder = BRANCH_FOLDER_MAP[(branchName || '').toUpperCase()] || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
        const branchDir = await this._getTargetBranchDirectoryHandle(bFolder);
        if (!branchDir) return null;

        const fileHandle = await branchDir.getFileHandle('returns_credit_notes.json', { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed.returns) ? parsed.returns : (Array.isArray(parsed) ? parsed : []);
        console.log(`[PMG OneDrive Sync] Loaded returns_credit_notes.json from OneDrive (${list.length} records) for ${bFolder}`);
        return list;
      } catch (err) {
        // File may not exist yet on fresh branch setup
        return null;
      }
    }

    // ─── SAVE PRICING MASTER DATABASE (JSON & CSV) TO ONEDRIVE ─────────────────
    async savePricingMasterToOneDrive(skus) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        const session = typeof getSession === 'function' ? getSession() : null;
        const payload = {
          title: 'PMG 7-Branch Pricing Master Database',
          lastUpdated: new Date().toISOString(),
          updatedBy: session?.displayName || 'Pharmacist Chai Yee Sian (William)',
          totalSkus: skus ? skus.length : 0,
          skus: skus || []
        };

        // Determine destination folder (if parent, save to root or PRICING_BACKUP folder; if branch, save to branch folder)
        let targetDir = this.rootHandle;
        if (this.mode === 'PARENT') {
          try {
            targetDir = await this.rootHandle.getDirectoryHandle('PRICING_BACKUP', { create: true });
          } catch (e) {
            targetDir = this.rootHandle;
          }
        }

        // 1. Write JSON master
        const jsonHandle = await targetDir.getFileHandle('pmg_pricing_master.json', { create: true });
        const jsonWritable = await jsonHandle.createWritable();
        await jsonWritable.write(JSON.stringify(payload, null, 2));
        await jsonWritable.close();

        // 2. Generate and write CSV master
        let csv = "Item Code,Description,Brand,Category,Supplier,Custom Cost (RM),Member SP (RM),Non-Member Price (RM),Gross Margin %,Supermarket Benchmark (RM),Competitor Chain Benchmark (RM),Strategic Role,Notes\n";
        (skus || []).forEach(s => {
          const margin = (s.standardSp > 0 && s.costPrice > 0) ? (((s.standardSp - s.costPrice) / s.standardSp) * 100).toFixed(1) : '0.0';
          const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
          csv += [
            escapeCsv(s.code),
            escapeCsv(s.name),
            escapeCsv(s.brand),
            escapeCsv(s.category),
            escapeCsv(s.supplier),
            s.costPrice.toFixed(2),
            s.standardSp.toFixed(2),
            s.nonMemberPrice ? s.nonMemberPrice.toFixed(2) : '',
            margin + '%',
            s.supermarketPrice ? s.supermarketPrice.toFixed(2) : '',
            s.chainPharmacyPrice ? s.chainPharmacyPrice.toFixed(2) : '',
            escapeCsv(s.strategyTag),
            escapeCsv(s.notes)
          ].join(',') + '\n';
        });

        const csvHandle = await targetDir.getFileHandle('pmg_pricing_master.csv', { create: true });
        const csvWritable = await csvHandle.createWritable();
        await csvWritable.write(csv);
        await csvWritable.close();

        // Keep localStorage pmg_pricing_skus_master in sync when within quota
        if (Array.isArray(skus) && skus.length > 0 && skus.length <= 1000) {
          try {
            localStorage.setItem('pmg_pricing_skus_master', JSON.stringify(skus));
          } catch (_) {}
        }

        console.log(`[PMG OneDrive Sync] Successfully auto-backed up ${skus.length} SKUs to OneDrive.`);
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Could not auto-backup pricing to OneDrive:', err);
        return false;
      }
    }

    async loadPricingMasterFromOneDrive() {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return null;
      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
        if (!hasPerm) return null;

        let targetDir = this.rootHandle;
        if (this.mode === 'PARENT') {
          try {
            targetDir = await this.rootHandle.getDirectoryHandle('PRICING_BACKUP');
          } catch (e) {
            targetDir = this.rootHandle;
          }
        }

        const fileHandle = await targetDir.getFileHandle('pmg_pricing_master.json');
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        const skus = parsed.skus || [];
        if (Array.isArray(skus) && skus.length > 0 && skus.length <= 1000) {
          try {
            localStorage.setItem('pmg_pricing_skus_master', JSON.stringify(skus));
          } catch (_) {}
        }
        return skus;
      } catch (e) {
        return null;
      }
    }

    // ─── SAVE STOCK EXPIRY MASTER & BRANCH BACKUP TO ONEDRIVE ────────────────
    async saveStockExpiryToOneDrive(targetBranchName = null) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        let localItems = [];
        try {
          const raw = localStorage.getItem('pmg_stock_expiry_data');
          if (raw) localItems = JSON.parse(raw);
        } catch (_) {}
        if (!Array.isArray(localItems) || localItems.length === 0) {
          if (typeof expiryItems !== 'undefined' && Array.isArray(expiryItems)) {
            localItems = expiryItems;
          }
        }
        if (!localItems || localItems.length === 0) return false;
        if (typeof window.ensureUniqueExpiryRowIds === 'function') {
          localItems = window.ensureUniqueExpiryRowIds(localItems);
        }

        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();
        const updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Staff';

        let clearedKeysList = [];
        try {
          clearedKeysList = (typeof getClearedExpiryKeys === 'function') ? Array.from(getClearedExpiryKeys()) : JSON.parse(localStorage.getItem('pmg_cleared_expiry_keys') || '[]');
        } catch (_) {}

        // 1. In PARENT mode (Master View):
        if (this.mode === 'PARENT') {
          // A: Save master backup in EXPIRY_BACKUP/stock_expiry_master.json
          let expDir = this.rootHandle;
          try {
            expDir = await this.rootHandle.getDirectoryHandle('EXPIRY_BACKUP', { create: true });
          } catch (_) { expDir = this.rootHandle; }

          let masterNeedsWrite = true;
          try {
            const exMasterFh = await expDir.getFileHandle('stock_expiry_master.json', { create: false });
            const exMasterFile = await exMasterFh.getFile();
            const exMasterText = await exMasterFile.text();
            if (exMasterText && exMasterText.trim()) {
              const exParsed = JSON.parse(exMasterText);
              const exItems = Array.isArray(exParsed.items) ? exParsed.items : (Array.isArray(exParsed) ? exParsed : []);
              if (this._areExpiryArraysEqual(localItems, exItems)) {
                masterNeedsWrite = false;
              }
            }
          } catch (_) {}

          if (masterNeedsWrite) {
            const masterPayload = {
              title: 'PMG 7-Branch Stock Expiry Master Database',
              lastUpdated: nowIso,
              updatedBy: updatedBy,
              totalRecords: localItems.length,
              clearedKeys: clearedKeysList,
              items: localItems
            };

            const expHandle = await expDir.getFileHandle('stock_expiry_master.json', { create: true });
            const expW = await expHandle.createWritable();
            await expW.write(JSON.stringify(masterPayload, null, 2));
            await expW.close();
            console.log(`[PMG OneDrive Sync] Saved stock_expiry_master.json (${localItems.length} records)`);
          }

          // B: Save partitioned branch files under each branch folder: [BRANCH]/EXPIRY/stock_expiry.json
          const branchesToProcess = targetBranchName ? [targetBranchName] : KNOWN_BRANCH_FOLDERS;
          for (const bName of branchesToProcess) {
            const canonical = BRANCH_FOLDER_MAP[bName.toUpperCase()] || bName.toUpperCase();
            const dirHandle = await this._getTargetBranchDirectoryHandle(canonical);
            if (!dirHandle) continue;

            try {
              let bExpDir = dirHandle;
              try {
                bExpDir = await dirHandle.getDirectoryHandle('EXPIRY', { create: true });
              } catch (_) { bExpDir = dirHandle; }
              this._cleanupConflictFiles(bExpDir).catch(() => {});

              const bItems = localItems.filter(it => {
                const itB = (it.branch || '').trim().toUpperCase();
                return itB === canonical || (BRANCH_FOLDER_MAP[itB] === canonical);
              });

              let branchNeedsWrite = true;
              try {
                const exFh = await bExpDir.getFileHandle('stock_expiry.json', { create: false });
                const exF = await exFh.getFile();
                const exT = await exF.text();
                if (exT && exT.trim()) {
                  const exP = JSON.parse(exT);
                  const exItems = Array.isArray(exP.items) ? exP.items : (Array.isArray(exP) ? exP : []);
                  if (this._areExpiryArraysEqual(bItems, exItems)) {
                    branchNeedsWrite = false;
                  }
                }
              } catch (_) {}

              if (branchNeedsWrite) {
                const bPayload = {
                  branch: canonical,
                  lastUpdated: nowIso,
                  updatedBy: updatedBy,
                  totalRecords: bItems.length,
                  clearedKeys: clearedKeysList,
                  items: bItems
                };

                const fh1 = await bExpDir.getFileHandle(`stock_expiry_${canonical.replace(/\s+/g, '_')}.json`, { create: true });
                const w1 = await fh1.createWritable();
                await w1.write(JSON.stringify(bPayload, null, 2));
                await w1.close();

                const fhStd = await bExpDir.getFileHandle('stock_expiry.json', { create: true });
                const wStd = await fhStd.createWritable();
                await wStd.write(JSON.stringify(bPayload, null, 2));
                await wStd.close();
                console.log(`[PMG OneDrive Sync] Saved branch expiry for ${canonical} (${bItems.length} records)`);
              }
            } catch (bErr) {
              console.warn(`[PMG OneDrive Sync] Branch expiry write notice for ${canonical}:`, bErr);
            }
          }
        } else {
          // 2. In BRANCH mode (Outlet computer connected directly to branch folder e.g. KOTA SENTOSA):
          const bFolder = this.activeBranchFolder || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
          let bExpDir = this.rootHandle;
          try {
            bExpDir = await this.rootHandle.getDirectoryHandle('EXPIRY', { create: true });
          } catch (_) { bExpDir = this.rootHandle; }
          this._cleanupConflictFiles(bExpDir).catch(() => {});

          let branchNeedsWrite = true;
          try {
            const exFh = await bExpDir.getFileHandle('stock_expiry.json', { create: false });
            const exF = await exFh.getFile();
            const exT = await exF.text();
            if (exT && exT.trim()) {
              const exP = JSON.parse(exT);
              const exItems = Array.isArray(exP.items) ? exP.items : (Array.isArray(exP) ? exP : []);
              if (this._areExpiryArraysEqual(localItems, exItems)) {
                branchNeedsWrite = false;
              }
            }
          } catch (_) {}

          if (branchNeedsWrite) {
            const bPayload = {
              branch: bFolder,
              lastUpdated: nowIso,
              updatedBy: updatedBy,
              totalRecords: localItems.length,
              clearedKeys: clearedKeysList,
              items: localItems
            };

            const fh1 = await bExpDir.getFileHandle(`stock_expiry_${bFolder.replace(/\s+/g, '_')}.json`, { create: true });
            const w1 = await fh1.createWritable();
            await w1.write(JSON.stringify(bPayload, null, 2));
            await w1.close();

            const fhStd = await bExpDir.getFileHandle('stock_expiry.json', { create: true });
            const wStd = await fhStd.createWritable();
            await wStd.write(JSON.stringify(bPayload, null, 2));
            await wStd.close();
            console.log(`[PMG OneDrive Sync] Saved branch expiry for ${bFolder} (${localItems.length} records)`);
          }
        }

        console.log(`[PMG OneDrive Sync] ✅ Successfully saved stock expiry data to OneDrive (${this.mode} mode)`);
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Could not save stock expiry to OneDrive:', err);
        return false;
      }
    }

    // ─── LOAD STOCK EXPIRY MASTER / BRANCH FILE FROM ONEDRIVE ────────────────
    async loadStockExpiryFromOneDrive(targetBranchName = null) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return null;
      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
        if (!hasPerm) return null;

        let cloudItems = [];

        if (this.mode === 'PARENT') {
          let expDir = this.rootHandle;
          try {
            expDir = await this.rootHandle.getDirectoryHandle('EXPIRY_BACKUP', { create: false });
          } catch (_) { expDir = this.rootHandle; }

          try {
            const fh = await expDir.getFileHandle('stock_expiry_master.json', { create: false });
            const file = await fh.getFile();
            const text = await file.text();
            if (text && text.trim()) {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed.clearedKeys) && typeof addClearedExpiryKey === 'function') {
                parsed.clearedKeys.forEach(k => addClearedExpiryKey(k));
              }
              if (Array.isArray(parsed.items)) cloudItems = parsed.items;
              else if (Array.isArray(parsed)) cloudItems = parsed;
            }
          } catch (_) {}

          // Also merge branch-level files if target branch or all
          const branchesToScan = targetBranchName ? [targetBranchName] : KNOWN_BRANCH_FOLDERS;
          for (const bName of branchesToScan) {
            try {
              const dirHandle = await this._getTargetBranchDirectoryHandle(bName);
              if (!dirHandle) continue;

              let bExpDir = dirHandle;
              try { bExpDir = await dirHandle.getDirectoryHandle('EXPIRY', { create: false }); } catch (_) {}

              let bFh = null;
              try {
                bFh = await bExpDir.getFileHandle(`stock_expiry_${bName.replace(/\s+/g, '_')}.json`, { create: false });
              } catch (_) {
                try { bFh = await bExpDir.getFileHandle('stock_expiry.json', { create: false }); } catch (_) {}
              }

              if (bFh) {
                const bf = await bFh.getFile();
                const bt = await bf.text();
                if (bt && bt.trim()) {
                  const bp = JSON.parse(bt);
                  if (Array.isArray(bp.clearedKeys) && typeof addClearedExpiryKey === 'function') {
                    bp.clearedKeys.forEach(k => addClearedExpiryKey(k));
                  }
                  const arr = Array.isArray(bp.items) ? bp.items : (Array.isArray(bp) ? bp : []);
                  if (arr.length > 0) {
                    const mergeFn = typeof mergeExpiryDatasets === 'function' ? mergeExpiryDatasets : (window.pmgExpiry?.mergeDatasets || null);
                    if (mergeFn) cloudItems = mergeFn(cloudItems, arr);
                    else cloudItems.push(...arr);
                  }
                }
              }
            } catch (_) {}
          }
        } else {
          // BRANCH MODE
          const bFolder = this.activeBranchFolder || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
          let bExpDir = this.rootHandle;
          try { bExpDir = await this.rootHandle.getDirectoryHandle('EXPIRY', { create: false }); } catch (_) {}

          const candidateFileNames = [
            `stock_expiry_${bFolder.replace(/\s+/g, '_')}.json`,
            'stock_expiry.json',
            'stock_expiry_master.json'
          ];

          for (const fn of candidateFileNames) {
            try {
              let fh = null;
              try { fh = await bExpDir.getFileHandle(fn, { create: false }); } catch (_) {}
              if (!fh && bExpDir !== this.rootHandle) {
                try { fh = await this.rootHandle.getFileHandle(fn, { create: false }); } catch (_) {}
              }
              if (fh) {
                const f = await fh.getFile();
                const t = await f.text();
                if (t && t.trim()) {
                  const p = JSON.parse(t);
                  if (Array.isArray(p.clearedKeys) && typeof addClearedExpiryKey === 'function') {
                    p.clearedKeys.forEach(k => addClearedExpiryKey(k));
                  }
                  const arr = Array.isArray(p.items) ? p.items : (Array.isArray(p) ? p : []);
                  if (arr.length > 0) {
                    cloudItems = arr;
                    break;
                  }
                }
              }
            } catch (_) {}
          }

          if (cloudItems.length === 0) {
            try {
              const bakDir = await this.rootHandle.getDirectoryHandle('EXPIRY_BACKUP', { create: false });
              const fh = await bakDir.getFileHandle('stock_expiry_master.json', { create: false });
              const f = await fh.getFile();
              const t = await f.text();
              if (t && t.trim()) {
                const p = JSON.parse(t);
                if (Array.isArray(p.clearedKeys) && typeof addClearedExpiryKey === 'function') {
                  p.clearedKeys.forEach(k => addClearedExpiryKey(k));
                }
                cloudItems = Array.isArray(p.items) ? p.items : (Array.isArray(p) ? p : []);
              }
            } catch (_) {}
          }
        }

        return cloudItems;
      } catch (e) {
        return null;
      }
    }

    // ─── BIDIRECTIONAL SYNC & MERGE STOCK EXPIRY WITH ONEDRIVE ───────────────
    async syncStockExpiryWithOneDrive(silent = false) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      if (silent && typeof window.isPmgSyncPaused === 'function' && window.isPmgSyncPaused()) {
        return false;
      }
      try {
        const cloudItems = await this.loadStockExpiryFromOneDrive();
        if (!cloudItems || cloudItems.length === 0) {
          // If no cloud items exist yet, seed cloud with local data
          const writePerm = await this._verifyPermission(this.rootHandle, true, false);
          if (writePerm) {
            await this.saveStockExpiryToOneDrive();
          }
          return false;
        }

        let localItems = [];
        try {
          const raw = localStorage.getItem('pmg_stock_expiry_data');
          if (raw) localItems = JSON.parse(raw);
        } catch (_) {}
        if (!Array.isArray(localItems) || localItems.length === 0) {
          if (typeof expiryItems !== 'undefined' && Array.isArray(expiryItems)) localItems = expiryItems;
        }

        const mergeFn = typeof mergeExpiryDatasets === 'function' ? mergeExpiryDatasets : (window.pmgExpiry?.mergeDatasets || null);
        let merged = [];
        if (mergeFn) {
          merged = mergeFn(localItems, cloudItems);
        } else {
          let clearedKeys = [];
          try {
            clearedKeys = JSON.parse(localStorage.getItem('pmg_cleared_expiry_keys') || '[]');
          } catch (_) {}
          const clearedKeySet = new Set(clearedKeys.map(k => String(k).toUpperCase().trim()));

          const isCleared = (it) => {
            if (!it) return false;
            if (typeof isItemMarkedDoneOrCleared === 'function') {
              return isItemMarkedDoneOrCleared(it, clearedKeySet);
            }
            const st = String(it.status || '').toUpperCase().trim();
            if (st === 'DONE' || st === 'COMPLETED' || st === 'CLEARED' || it.quantity === 0) return true;
            if (it.itemCode && clearedKeySet.has(String(it.itemCode).toUpperCase().trim())) return true;
            if (it.rowId && clearedKeySet.has(`ROW_${it.rowId}`)) return true;
            return false;
          };

          const map = new Map();
          (localItems || []).forEach(it => {
            const k = it.rowId || it.itemCode;
            if (isCleared(it)) {
              it.status = 'DONE';
              it.quantity = 0;
            }
            map.set(k, { ...it });
          });
          (cloudItems || []).forEach(it => {
            const k = it.rowId || it.itemCode;
            if (!map.has(k)) {
              if (isCleared(it)) {
                it.status = 'DONE';
                it.quantity = 0;
              }
              map.set(k, { ...it });
            } else {
              const loc = map.get(k);
              if (isCleared(loc)) {
                // Keep local cleared/done
              } else if (isCleared(it)) {
                loc.status = 'DONE';
                loc.quantity = 0;
              }
            }
          });
          merged = Array.from(map.values());
        }

        if (typeof window.ensureUniqueExpiryRowIds === 'function') {
          merged = window.ensureUniqueExpiryRowIds(merged);
        }

        // Update local memory and localStorage
        if (typeof expiryItems !== 'undefined') {
          expiryItems = merged;
        }
        if (typeof safeStorageSet === 'function') {
          safeStorageSet('pmg_stock_expiry_data', merged);
        } else {
          try {
            localStorage.setItem('pmg_stock_expiry_data', JSON.stringify(merged));
          } catch (e) {
            console.warn('[PMG OneDrive Sync] LocalStorage quota warning for expiry:', e);
          }
        }

        // Re-render UI
        if (typeof renderExpiryUI === 'function') {
          renderExpiryUI();
        }

        console.log(`[PMG OneDrive Sync] ✅ Synced ${merged.length} stock expiry items from OneDrive.`);
        if (!silent && typeof showExpiryToast === 'function') {
          showExpiryToast(`🔄 OneDrive Expiry Synced (${merged.length} items)`);
        }

        // Write the merged result back ONLY IF local had modifications that cloud didn't have!
        const hasLocalModifications = !this._areExpiryArraysEqual(merged, cloudItems);
        if (hasLocalModifications) {
          const writePerm = await this._verifyPermission(this.rootHandle, true, false);
          if (writePerm) {
            await this.saveStockExpiryToOneDrive();
          }
        }

        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Stock expiry sync error:', err);
        return false;
      }
    }

    // ─── BIDIRECTIONAL SYNC & MERGE RETURNS & CREDIT NOTES WITH ONEDRIVE ─────
    async syncReturnsWithOneDrive(silent = false) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      if (silent && typeof window.isPmgSyncPaused === 'function' && window.isPmgSyncPaused()) {
        return false;
      }

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
        if (!hasPerm) return false;

        // 1. Determine target branches to sync
        let targetBranches = [];
        if (this.mode === 'PARENT') {
          const filterEl = document.getElementById('returnsBranchFilter') || document.getElementById('patientBranchFilter');
          const sel = filterEl ? filterEl.value : '';
          if (!sel || sel === 'ALL') {
            targetBranches = [...KNOWN_BRANCH_FOLDERS];
          } else {
            targetBranches = [BRANCH_FOLDER_MAP[sel.toUpperCase()] || sel];
          }
        } else {
          targetBranches = [this.activeBranchFolder || this._resolveCurrentBranchName() || 'KOTA SENTOSA'];
        }

        // Get local returns
        let localReturns = [];
        if (window.pmgReturns && typeof window.pmgReturns.getReturnsData === 'function') {
          localReturns = window.pmgReturns.getReturnsData() || [];
        }
        if (!Array.isArray(localReturns) || localReturns.length === 0) {
          try {
            const raw = localStorage.getItem('pmg_returns_records_v1');
            if (raw) localReturns = JSON.parse(raw);
          } catch (_) {}
        }
        if (!Array.isArray(localReturns)) localReturns = [];

        // Deleted IDs list (tombstone)
        let deletedIds = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');
        } catch (_) {}
        const deletedSet = new Set(deletedIds);

        let overallChanged = false;

        for (const bName of targetBranches) {
          const bFolder = BRANCH_FOLDER_MAP[bName.toUpperCase()] || bName;
          const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
          if (!dirHandle) continue;

          let cloudReturns = [];
          try {
            const fh = await dirHandle.getFileHandle('returns_credit_notes.json', { create: false });
            const file = await fh.getFile();
            const text = await file.text();
            if (text && text.trim()) {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed.returns)) cloudReturns = parsed.returns;
              else if (Array.isArray(parsed)) cloudReturns = parsed;
            }
          } catch (_) {
            // File does not exist yet on OneDrive for this branch
          }

          const cleanCloud = (cloudReturns || []).filter(r => r && r.id && !deletedSet.has(r.id));
          const localBranchReturns = localReturns.filter(r => {
            if (!r || !r.id || deletedSet.has(r.id)) return false;
            const rb = BRANCH_FOLDER_MAP[(r.branch || '').toUpperCase()] || (r.branch || '').toUpperCase();
            return rb === bFolder.toUpperCase() || rb === bName.toUpperCase();
          });

          // Bidirectional merge helper
          const resolveReturnConflict = (loc, cld) => {
            if (!loc) return cld;
            if (!cld) return loc;
            const locTime = loc.updatedAt || loc.createdAt || '';
            const cldTime = cld.updatedAt || cld.createdAt || '';
            if (cldTime && locTime) {
              if (cldTime > locTime) return { ...loc, ...cld };
              if (locTime > cldTime) return { ...cld, ...loc };
            }
            if (cld.signedProof && !loc.signedProof) return { ...loc, ...cld };
            if (loc.signedProof && !cld.signedProof) return { ...cld, ...loc };
            if (cld.xilnexKeyed && !loc.xilnexKeyed) return { ...loc, ...cld };
            if (loc.xilnexKeyed && !cld.xilnexKeyed) return { ...cld, ...loc };
            if ((cld.items || []).length > (loc.items || []).length) return { ...loc, ...cld };
            return { ...loc, ...cld };
          };

          const branchMap = new Map();
          localBranchReturns.forEach(r => branchMap.set(r.id, r));
          cleanCloud.forEach(r => {
            if (branchMap.has(r.id)) {
              branchMap.set(r.id, resolveReturnConflict(branchMap.get(r.id), r));
            } else {
              branchMap.set(r.id, r);
            }
          });

          const mergedBranchReturns = Array.from(branchMap.values());

          // Check if cloud file needs updating
          const cloudNeedsUpdate = !this._areReturnsArraysEqual(mergedBranchReturns, cleanCloud);
          if (cloudNeedsUpdate) {
            const writePerm = await this._verifyPermission(this.rootHandle, true, false);
            if (writePerm) {
              const session = typeof getSession === 'function' ? getSession() : null;
              const payload = {
                branch: bFolder,
                lastUpdated: new Date().toISOString(),
                updatedBy: session?.displayName || 'Staff',
                totalRecords: mergedBranchReturns.length,
                returns: mergedBranchReturns
              };
              const fh = await dirHandle.getFileHandle('returns_credit_notes.json', { create: true });
              const writable = await fh.createWritable();
              await writable.write(JSON.stringify(payload, null, 2));
              await writable.close();
              console.log(`[PMG OneDrive Sync] Saved merged returns_credit_notes.json to OneDrive for ${bFolder} (${mergedBranchReturns.length} records)`);
            }
          }

          // Check if local array needs updating
          const localNeedsUpdate = !this._areReturnsArraysEqual(mergedBranchReturns, localBranchReturns);
          if (localNeedsUpdate || cloudNeedsUpdate) {
            overallChanged = true;
            const otherBranchReturns = localReturns.filter(r => {
              if (!r || !r.id || deletedSet.has(r.id)) return false;
              const rb = BRANCH_FOLDER_MAP[(r.branch || '').toUpperCase()] || (r.branch || '').toUpperCase();
              return rb !== bFolder.toUpperCase() && rb !== bName.toUpperCase();
            });
            localReturns = [...mergedBranchReturns, ...otherBranchReturns];
          }
        }

        if (overallChanged) {
          try {
            localStorage.setItem('pmg_returns_records_v1', JSON.stringify(localReturns));
          } catch (e) {
            console.warn('[PMG OneDrive Sync] LocalStorage quota warning for returns:', e);
          }
          if (window.pmgReturns && typeof window.pmgReturns.onCloudSync === 'function') {
            await window.pmgReturns.onCloudSync(localReturns);
          } else if (typeof renderReturnsUI === 'function') {
            renderReturnsUI();
          }
          console.log(`[PMG OneDrive Sync] ✅ Synced returns & credit notes from OneDrive (${localReturns.length} records).`);
          if (!silent && typeof showPmgToast === 'function') {
            showPmgToast(`🔄 OneDrive Returns Synced (${localReturns.length} records)`, 'success');
          }
        }

        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Returns sync error:', err);
        return false;
      }
    }

    // ─── BIDIRECTIONAL SYNC & MERGE MEDICAL EQUIPMENT RENTALS WITH ONEDRIVE ────
    async syncRentalsWithOneDrive(silent = false) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      if (silent && typeof window.isPmgSyncPaused === 'function' && window.isPmgSyncPaused()) {
        return false;
      }

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
        if (!hasPerm) return false;

        const targetBranch = this.activeBranchFolder || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
        const bFolder = BRANCH_FOLDER_MAP[targetBranch.toUpperCase()] || targetBranch;
        const bCode = FOLDER_BRANCH_CODE_MAP[bFolder] || 'KS01';
        const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
        if (!dirHandle) return false;

        const storageKey = `pmg_medical_equipment_rentals_${bCode}`;

        // 1. Get local rentals
        let localRentals = [];
        try {
          const raw = localStorage.getItem(storageKey) || localStorage.getItem('pmg_medical_equipment_rentals_KS01');
          if (raw) localRentals = JSON.parse(raw);
        } catch (_) {}
        if (!Array.isArray(localRentals)) localRentals = [];

        // 2. Read deleted IDs tombstone
        let deletedIds = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_rentals') || '[]');
        } catch (_) {}
        const deletedSet = new Set(deletedIds);

        // 3. Read cloud medical_equipment_rentals.json from OneDrive
        let cloudRentals = [];
        try {
          const fh = await dirHandle.getFileHandle('medical_equipment_rentals.json', { create: false });
          const file = await fh.getFile();
          const text = await file.text();
          if (text && text.trim()) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed.rentals)) cloudRentals = parsed.rentals;
            else if (Array.isArray(parsed)) cloudRentals = parsed;
          }
        } catch (_) {
          // File does not exist yet on OneDrive
        }

        // 4. Bidirectional conflict-free merge
        const rentalMap = new Map();

        (cloudRentals || []).forEach(r => {
          if (r && r.id && !deletedSet.has(r.id)) {
            rentalMap.set(r.id, r);
          }
        });

        let localChanged = false;

        (localRentals || []).forEach(r => {
          if (!r || !r.id || deletedSet.has(r.id)) return;
          if (!rentalMap.has(r.id)) {
            rentalMap.set(r.id, r);
          } else {
            const cloudRec = rentalMap.get(r.id);
            const localTime = r.updatedAt || r.createdAt || '';
            const cloudTime = cloudRec.updatedAt || cloudRec.createdAt || '';
            if (localTime > cloudTime) {
              rentalMap.set(r.id, { ...cloudRec, ...r });
            } else if (cloudTime > localTime) {
              localChanged = true;
            }
          }
        });

        const mergedRentals = Array.from(rentalMap.values());

        // Update local storage if needed
        if (mergedRentals.length !== localRentals.length || localChanged) {
          localStorage.setItem(storageKey, JSON.stringify(mergedRentals));
          if (storageKey !== 'pmg_medical_equipment_rentals_KS01') {
            localStorage.setItem('pmg_medical_equipment_rentals_KS01', JSON.stringify(mergedRentals));
          }
          if (typeof renderEquipmentRentals === 'function') {
            renderEquipmentRentals();
          }
          console.log(`[PMG OneDrive Sync] Pulled ${mergedRentals.length} rentals from OneDrive into local storage`);
        }

        // Check if OneDrive cloud file needs updating
        const cloudNeedsWrite = (cloudRentals.length !== mergedRentals.length) ||
          JSON.stringify(cloudRentals) !== JSON.stringify(mergedRentals);

        if (cloudNeedsWrite && mergedRentals.length > 0) {
          const session = typeof getSession === 'function' ? getSession() : null;
          const nowIso = new Date().toISOString();
          const payload = {
            branch: bFolder,
            branchCode: bCode,
            lastSync: nowIso,
            syncedBy: session?.displayName || 'Pharmacist',
            count: mergedRentals.length,
            rentals: mergedRentals
          };
          const writeHandle = await dirHandle.getFileHandle('medical_equipment_rentals.json', { create: true });
          const writable = await writeHandle.createWritable();
          await writable.write(JSON.stringify(payload, null, 2));
          await writable.close();
          console.log(`[PMG OneDrive Sync] Uploaded ${mergedRentals.length} rentals to OneDrive (${bFolder})`);
        }

        return mergedRentals;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] syncRentalsWithOneDrive warning:', err);
        return false;
      }
    }

    // ─── SAVE RENTALS TO ONEDRIVE (IMMEDIATE WRITE) ───────────────────────────
    async saveRentalsToOneDrive(branchCode, rentals) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      const bFolder = BRANCH_FOLDER_MAP[(branchCode || '').toUpperCase()] || this.activeBranchFolder || 'KOTA SENTOSA';
      const bCode = FOLDER_BRANCH_CODE_MAP[bFolder] || branchCode || 'KS01';
      const dirHandle = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!dirHandle) return false;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, true, false);
        if (!hasPerm) return false;

        const session = typeof getSession === 'function' ? getSession() : null;
        const nowIso = new Date().toISOString();
        const payload = {
          branch: bFolder,
          branchCode: bCode,
          lastSync: nowIso,
          syncedBy: session?.displayName || 'Pharmacist',
          count: Array.isArray(rentals) ? rentals.length : 0,
          rentals: Array.isArray(rentals) ? rentals : []
        };

        const fileHandle = await dirHandle.getFileHandle('medical_equipment_rentals.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        console.log(`[PMG OneDrive Sync] Immediate write: ${payload.count} rentals saved to OneDrive (${bFolder})`);
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] saveRentalsToOneDrive error:', err);
        return false;
      }
    }

    async saveCustomKeyToOneDrive(key, data) {
      if (key === 'medical_equipment_rentals') {
        return this.saveRentalsToOneDrive('Kota Sentosa', data);
      }
      return false;
    }

    _formatCurrentMonthString() {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${m} - ${names[d.getMonth()]}`;
    }

    _recordDocumentUpload(entry) {
      try {
        const log = JSON.parse(localStorage.getItem('pmg_uploaded_docs_log') || '[]');
        log.unshift(entry);
        if (log.length > 200) log.length = 200;
        localStorage.setItem('pmg_uploaded_docs_log', JSON.stringify(log));
      } catch (e) {
        console.warn('[PMG OneDrive Sync] Could not record upload log:', e);
      }
    }

    getAccountsSubmissionSummary(branchName, year, monthFolder) {
      const bFolder = BRANCH_FOLDER_MAP[(branchName || '').toUpperCase()] || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
      const curYear = year ? String(year) : String(new Date().getFullYear());
      const curMonth = monthFolder || this._formatCurrentMonthString();

      let log = [];
      try {
        log = JSON.parse(localStorage.getItem('pmg_uploaded_docs_log') || '[]');
      } catch (e) {}

      const filtered = log.filter(it => 
        (it.branch || '').toUpperCase() === bFolder.toUpperCase() &&
        String(it.year) === curYear &&
        it.month === curMonth
      );

      const invoices = filtered.filter(it => it.category === 'Invoices');
      const creditNotes = filtered.filter(it => it.category === 'Credit Note');

      const calcTotal = (items) => {
        let sum = 0;
        items.forEach(it => {
          if (it.amount) {
            const num = parseFloat(String(it.amount).replace(/[^0-9.]/g, ''));
            if (!isNaN(num)) sum += num;
          }
        });
        return sum;
      };

      const invTotal = calcTotal(invoices);
      const cnTotal = calcTotal(creditNotes);
      const vendors = Array.from(new Set(filtered.map(it => it.vendor).filter(Boolean)));
      const shareLinkKey = `pmg_onedrive_share_link_${bFolder.replace(/\s+/g, '_')}`;
      const shareLink = localStorage.getItem(shareLinkKey) || localStorage.getItem('pmg_onedrive_share_link') || '';

      return {
        branch: bFolder,
        year: curYear,
        month: curMonth,
        invoicesCount: invoices.length,
        invoicesTotal: invTotal,
        creditNotesCount: creditNotes.length,
        creditNotesTotal: cnTotal,
        vendors,
        shareLink,
        items: filtered
      };
    }

    // ─── LOAD & MERGE FROM ONEDRIVE (BACKGROUND WATCHER) ─────────────────────
    async syncWithOneDriveFolder(force = false) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return false;
      if (this.isSyncing) return false;
      if (!force && typeof window.isPmgSyncPaused === 'function' && window.isPmgSyncPaused()) {
        console.log('[PMG OneDrive Sync] Watcher skipped: auto-polling is temporarily paused.');
        return false;
      }

      // Non-prompting permission query for background checks
      const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
      if (!hasPerm) return false;

      const targetBranch = this._resolveCurrentBranchName();
      const dirHandle = await this._getTargetBranchDirectoryHandle(targetBranch);
      if (!dirHandle) return false;

      let needsOneDriveWriteBack = false;
      try {
        let fileHandle;
        this._cleanupConflictFiles(dirHandle).catch(() => {});

        try {
          fileHandle = await dirHandle.getFileHandle('patients_master.json', { create: false });
        } catch (e) {
          // File does not exist yet or is being synced by OneDrive. Background watcher is strictly read-only!
          return false;
        }

        const file = await fileHandle.getFile();

        // Also check and sync schedule_settings.json in background if present
        try {
          const bCode = FOLDER_BRANCH_CODE_MAP[targetBranch] || targetBranch;
          const schedHandle = await dirHandle.getFileHandle('schedule_settings.json', { create: false });
          const sFile = await schedHandle.getFile();
          const sText = await sFile.text();
          if (sText && sText.trim()) {
            const parsed = JSON.parse(sText);
            const cloudSched = parsed.schedule || parsed;
            const remoteTime = parsed.lastUpdated || cloudSched.lastUpdated || '';
            const localRaw = localStorage.getItem(`pmg_pharmacist_schedule_${bCode}`);
            const localSched = localRaw ? JSON.parse(localRaw) : null;
            if (!localSched || (remoteTime && remoteTime > (localSched.lastUpdated || ''))) {
              try {
                localStorage.setItem(`pmg_pharmacist_schedule_${bCode}`, JSON.stringify(cloudSched));
              } catch (_) {}
              console.log(`[PMG OneDrive Sync] Auto-updated schedule for ${bCode} from OneDrive`);
            }
          }
        } catch (_) {}

        // Also check and sync stock expiry in background
        // Also check and sync returns & credit notes in background
        try {
          await this.syncReturnsWithOneDrive(true);
        } catch (_) {}

        // Also check and sync medical equipment rentals in background
        try {
          await this.syncRentalsWithOneDrive(true);
        } catch (_) {}

        // If file modified timestamp is not newer and not forced, skip reading
        if (!force && file.lastModified <= this.lastKnownModified) {
          return false;
        }

        this.isSyncing = true;
        if (force) {
          this._updateBadge('SYNCING', 'OneDrive: Syncing…');
        }

        const text = await file.text();
        if (!text.trim()) return false;

        const data = JSON.parse(text);
        const incomingPatients = data.patients || [];

        // Conflict-Free Merge with local patientsData
        if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
          const merged = this._mergePatientArrays(patientsData, incomingPatients);
          const hasChanged = !this._arePatientArraysEqual(patientsData, merged);
          patientsData = merged;
          if (hasChanged) {
            if (typeof savePatientsData === 'function') {
              savePatientsData();
            } else if (typeof safeStorageSet === 'function') {
              safeStorageSet(PATIENTS_STORAGE_KEY, patientsData);
            } else {
              try {
                localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
              } catch (e) {
                console.warn('[PMG OneDrive Sync] LocalStorage quota warning for patientsData:', e);
              }
            }
            if (typeof renderPatientModule === 'function') renderPatientModule();
          }

          // Flag write-back to run AFTER releasing this.isSyncing lock so saveToOneDrive is never silently skipped
          if (!this._arePatientArraysEqual(merged, incomingPatients)) {
            needsOneDriveWriteBack = true;
          }
        }

        this.lastKnownModified = file.lastModified;

        const timeStr = new Date(file.lastModified).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        this._updateBadge('CONNECTED', `OneDrive: Synced ${timeStr} (${targetBranch})`);
        return true;
      } catch (err) {
        console.warn('[PMG OneDrive Sync] Read/Merge warning:', err);
        if (force) {
          this._updateBadge('ERROR', 'OneDrive: Sync Warning');
        }
        return false;
      } finally {
        this.isSyncing = false;
        const shouldDrain = this._pendingSaveToOneDrive || (typeof needsOneDriveWriteBack !== 'undefined' && needsOneDriveWriteBack);
        if (shouldDrain) {
          this._pendingSaveToOneDrive = false;
          setTimeout(async () => {
            try {
              const writePerm = await this._verifyPermission(this.rootHandle, true, false);
              if (writePerm && typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
                await this.saveToOneDrive(patientsData);
              }
            } catch (_) {}
          }, 150);
        }
      }
    }

    // ─── CONFLICT-FREE RECORD MERGING ALGORITHM ──────────────────────────────
    _mergePatientArrays(localArr, cloudArr) {
      let deletedIds = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_patient_ids') || '[]');
      } catch (_) {}
      // Explicitly un-tombstone recovered patient Lai Ling Fah so sync never purges her
      deletedIds = (deletedIds || []).filter(x => {
        const s = String(x).toLowerCase().replace(/\D/g, '');
        const sRaw = String(x).toLowerCase().trim();
        return !sRaw.includes('135720') && !sRaw.includes('lai ling fah') && s !== '701206135720' && s !== '60198472986' && s !== '0198472986';
      });
      try {
        localStorage.setItem('pmg_deleted_patient_ids', JSON.stringify(deletedIds));
      } catch (_) {}
      const deletedSet = new Set(deletedIds.map(x => String(x).toLowerCase().trim()));

      const isRecordDeleted = (p) => {
        if (!p) return true;
        if (!p.id || String(p.id).trim() === '') return true; // Null/empty ID
        const pIdUpper = String(p.id).toUpperCase().trim();
        const cleanIc = String(p.ic || '').replace(/\D/g, '');
        if (pIdUpper === 'PT-135720' || cleanIc === '701206135720') return false;

        if (p.status === 'DELETED' || String(p.status).toUpperCase() === 'DELETED') return true;
        if (deletedSet.has(String(p.id).toLowerCase().trim())) return true;
        if (cleanIc && deletedSet.has(cleanIc)) return true;
        // Do NOT check phone number against deletedSet so elderly/child dependents sharing a caretaker phone number are never purged
        return false;
      };

      // If automated consolidation engine is available, utilize full fuzzy & stub consolidation
      const cleanLocal = (localArr || []).filter(p => !isRecordDeleted(p));
      const cleanCloud = (cloudArr || []).filter(p => !isRecordDeleted(p));
      const consolidateFn = (typeof window !== 'undefined' && typeof window.consolidatePatientList === 'function')
        ? window.consolidatePatientList
        : (typeof consolidatePatientList === 'function' ? consolidatePatientList : null);

      if (consolidateFn) {
        return consolidateFn([...cleanLocal, ...cleanCloud]);
      }

      const map = new Map();

      // Index all local patients (strictly drop any deleted)
      cleanLocal.forEach(p => {
        if (p && p.id) map.set(p.id, JSON.parse(JSON.stringify(p)));
      });

      // Merge each cloud patient (strictly skip deleted, null ID, or status: DELETED)
      (cloudArr || []).forEach(cloudP => {
        if (!cloudP || !cloudP.id || isRecordDeleted(cloudP)) return;

        if (!map.has(cloudP.id)) {
          map.set(cloudP.id, JSON.parse(JSON.stringify(cloudP)));
        } else {
          const localP = map.get(cloudP.id);
          // Merge encounters by ID (prevent duplicate or lost encounters)
          const encMap = new Map();
          (localP.encounters || []).forEach(e => encMap.set(e.id || `${e.date}_${e.recordedBy}`, e));
          (cloudP.encounters || []).forEach(e => encMap.set(e.id || `${e.date}_${e.recordedBy}`, e));
          localP.encounters = Array.from(encMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

          // Merge medications by name/id (preserve cleared & overdueDismissed flags)
          const medMap = new Map();
          (localP.medications || []).forEach(m => {
            const k = (m.id || m.name || '').toLowerCase().trim();
            if (k) medMap.set(k, { ...m });
          });
          (cloudP.medications || []).forEach(m => {
            const k = (m.id || m.name || '').toLowerCase().trim();
            if (!k) return;
            if (medMap.has(k)) {
              const existing = medMap.get(k);
              const isCleared = !!(existing.cleared || m.cleared || existing.overdueDismissed || m.overdueDismissed);
              medMap.set(k, {
                ...m,
                ...existing,
                cleared: isCleared,
                overdueDismissed: isCleared,
                clearedAt: existing.clearedAt || m.clearedAt
              });
            } else {
              medMap.set(k, { ...m });
            }
          });
          localP.medications = Array.from(medMap.values());

          // Merge appointments by id safely (preserve Completed/Cancelled terminal status)
          const aptMap = new Map();
          (localP.appointments || []).forEach(a => {
            if (a.status !== 'DELETED' && String(a.status).toUpperCase() !== 'DELETED') {
              aptMap.set(a.id || `${a.date}_${a.time}`, a);
            }
          });
          (cloudP.appointments || []).forEach(cloudApt => {
            if (cloudApt.status === 'DELETED' || String(cloudApt.status).toUpperCase() === 'DELETED') return;
            const key = cloudApt.id || `${cloudApt.date}_${cloudApt.time}`;
            if (!aptMap.has(key)) {
              aptMap.set(key, cloudApt);
            } else {
              const localApt = aptMap.get(key);
              // If either local or cloud has Completed status, strictly keep Completed!
              if (localApt.status === 'Completed' && cloudApt.status !== 'Completed') {
                // Keep local completed status
              } else if (cloudApt.status === 'Completed' && localApt.status !== 'Completed') {
                aptMap.set(key, cloudApt);
              } else {
                const localIsTerminal = localApt.status === 'Cancelled' || localApt.status === 'Missed';
                const cloudIsTerminal = cloudApt.status === 'Cancelled' || cloudApt.status === 'Missed';
                if (localIsTerminal && !cloudIsTerminal) {
                  // Keep local terminal appointment
                } else if (cloudIsTerminal && !localIsTerminal) {
                  aptMap.set(key, cloudApt);
                } else {
                  const lTime = new Date(localApt.statusUpdatedAt || localApt.lastUpdated || localApt.date || 0).getTime();
                  const cTime = new Date(cloudApt.statusUpdatedAt || cloudApt.lastUpdated || cloudApt.date || 0).getTime();
                  if (cTime > lTime) {
                    aptMap.set(key, cloudApt);
                  }
                }
              }
            }
          });
          localP.appointments = Array.from(aptMap.values()).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

          // Overwrite scalar profile fields based on updatedAt timestamps
          const lTime = new Date(localP.updatedAt || localP.lastUpdated || localP.createdAt || 0).getTime();
          const cTime = new Date(cloudP.updatedAt || cloudP.lastUpdated || cloudP.createdAt || 0).getTime();

          if (cTime > lTime) {
            // Cloud is strictly newer: adopt cloud values
            localP.name = cloudP.name || localP.name;
            localP.phone = cloudP.phone || localP.phone;
            localP.ic = cloudP.ic || localP.ic;
            localP.gender = cloudP.gender || localP.gender;
            if (cloudP.age !== undefined && cloudP.age !== null) localP.age = cloudP.age;
            localP.race = cloudP.race || localP.race;
            localP.language = cloudP.language || localP.language;
            localP.branch = cloudP.branch || localP.branch;
            if (Array.isArray(cloudP.conditions) && cloudP.conditions.length) localP.conditions = cloudP.conditions;
            if (Array.isArray(cloudP.chronicConditions) && cloudP.chronicConditions.length) localP.chronicConditions = cloudP.chronicConditions;
            localP.allergies = cloudP.allergies || localP.allergies;
            localP.notes = cloudP.notes || localP.notes;
            localP.nextTcaDate = cloudP.nextTcaDate || localP.nextTcaDate;
            localP.nextTcaPurpose = cloudP.nextTcaPurpose || localP.nextTcaPurpose;
            if (cloudP.hsiScore != null) localP.hsiScore = cloudP.hsiScore;
            if (cloudP.hsiTier != null) localP.hsiTier = cloudP.hsiTier;
            localP.updatedAt = cloudP.updatedAt || localP.updatedAt;
          } else {
            // Local is newer or equal: preserve local edits! Only fill fields that are empty locally
            localP.name = localP.name || cloudP.name;
            localP.phone = localP.phone || cloudP.phone;
            localP.ic = localP.ic || cloudP.ic;
            localP.gender = localP.gender || cloudP.gender;
            if (localP.age === undefined || localP.age === null) localP.age = cloudP.age;
            localP.race = localP.race || cloudP.race;
            localP.language = localP.language || cloudP.language;
            localP.branch = localP.branch || cloudP.branch;
            if (!Array.isArray(localP.conditions) || !localP.conditions.length) localP.conditions = cloudP.conditions || [];
            if (!Array.isArray(localP.chronicConditions) || !localP.chronicConditions.length) localP.chronicConditions = cloudP.chronicConditions || [];
            localP.allergies = localP.allergies || cloudP.allergies;
            localP.notes = localP.notes || cloudP.notes;
            localP.nextTcaDate = localP.nextTcaDate || cloudP.nextTcaDate;
            localP.nextTcaPurpose = localP.nextTcaPurpose || cloudP.nextTcaPurpose;
            if (localP.hsiScore == null && cloudP.hsiScore != null) localP.hsiScore = cloudP.hsiScore;
            if (localP.hsiTier == null && cloudP.hsiTier != null) localP.hsiTier = cloudP.hsiTier;
            if (!localP.updatedAt && cloudP.updatedAt) localP.updatedAt = cloudP.updatedAt;
          }

          map.set(cloudP.id, localP);
        }
      });

      return Array.from(map.values());
    }

    // ─── CONFLICT-PREVENTION DIRTY-CHECKING HELPERS ─────────────────────────
    _arePatientArraysEqual(arrA, arrB) {
      if (!Array.isArray(arrA) || !Array.isArray(arrB)) return false;
      if (arrA.length !== arrB.length) return false;
      if (arrA.length === 0 && arrB.length === 0) return true;

      const mapB = new Map();
      for (const b of arrB) {
        if (b && b.id) mapB.set(b.id, b);
      }
      if (mapB.size !== arrA.length) return false;

      for (const a of arrA) {
        if (!a || !a.id) return false;
        const b = mapB.get(a.id);
        if (!b) return false;

        // Fast field checks (scalars)
        if (a.name !== b.name || a.phone !== b.phone || a.ic !== b.ic || a.gender !== b.gender) return false;
        if (a.age !== b.age || a.branch !== b.branch || a.race !== b.race || a.language !== b.language) return false;
        if (a.nextTcaDate !== b.nextTcaDate || a.nextTcaPurpose !== b.nextTcaPurpose) return false;
        if (a.allergies !== b.allergies || a.notes !== b.notes) return false;
        if ((a.medicalHistory || '') !== (b.medicalHistory || '') || (a.height || '') !== (b.height || '')) return false;
        if ((a.hsiScore ?? '') !== (b.hsiScore ?? '') || (a.hsiTier || '') !== (b.hsiTier || '')) return false;
        if ((a.updatedAt || '') !== (b.updatedAt || '')) return false;

        // Sub-array lengths
        if ((a.encounters?.length || 0) !== (b.encounters?.length || 0)) return false;
        if ((a.appointments?.length || 0) !== (b.appointments?.length || 0)) return false;
        if ((a.medications?.length || 0) !== (b.medications?.length || 0)) return false;
        if ((a.tcaReminders?.length || 0) !== (b.tcaReminders?.length || 0)) return false;
        if ((a.documents?.length || 0) !== (b.documents?.length || 0)) return false;

        // Encounter content & edit timestamp checks (ensures edited consultations always sync to OneDrive)
        if (a.encounters && b.encounters) {
          for (let i = 0; i < a.encounters.length; i++) {
            const encA = a.encounters[i];
            const encB = b.encounters[i];
            if (!encA || !encB) return false;
            if ((encA.id || '') !== (encB.id || '') || (encA.date || '') !== (encB.date || '')) return false;
            if ((encA.lastUpdatedAt || '') !== (encB.lastUpdatedAt || '')) return false;
            if ((encA.chiefComplaint || '') !== (encB.chiefComplaint || '') || (encA.preDiagnostic || '') !== (encB.preDiagnostic || '')) return false;
            if ((encA.planMedications || '') !== (encB.planMedications || '') || (encA.planCounselling || '') !== (encB.planCounselling || '')) return false;
            if ((encA.hsiScore ?? '') !== (encB.hsiScore ?? '') || (encA.hsiTier || '') !== (encB.hsiTier || '')) return false;
            if ((encA.liverPanel?.alt ?? '') !== (encB.liverPanel?.alt ?? '') || (encA.liverPanel?.ast ?? '') !== (encB.liverPanel?.ast ?? '')) return false;
          }
        }

        // Fast appointment checks
        if (a.appointments && b.appointments) {
          for (let i = 0; i < a.appointments.length; i++) {
            const aptA = a.appointments[i];
            const aptB = b.appointments[i];
            if (!aptA || !aptB) return false;
            if (aptA.id !== aptB.id || aptA.date !== aptB.date || aptA.time !== aptB.time || aptA.status !== aptB.status) return false;
          }
        }

        // Fast medication checks
        if (a.medications && b.medications) {
          for (let i = 0; i < a.medications.length; i++) {
            const medA = a.medications[i];
            const medB = b.medications[i];
            if (!medA || !medB) return false;
            if ((medA.name || '') !== (medB.name || '') || (medA.nextRefillDate || '') !== (medB.nextRefillDate || '')) return false;
            if (!!medA.cleared !== !!medB.cleared || !!medA.overdueDismissed !== !!medB.overdueDismissed) return false;
          }
        }
      }
      return true;
    }

    _areExpiryArraysEqual(arrA, arrB) {
      if (!Array.isArray(arrA) || !Array.isArray(arrB)) return false;
      if (arrA.length !== arrB.length) return false;
      if (arrA.length === 0 && arrB.length === 0) return true;

      const getKey = (it) => {
        if (!it) return '';
        if (typeof window.getExpiryItemKey === 'function') {
          return window.getExpiryItemKey(it);
        }
        const b = (it.branch || 'Kota Sentosa').trim().toUpperCase();
        const c = (it.itemCode || '').trim().toUpperCase();
        const bt = (it.batchNumber || '').trim().toUpperCase();
        const exp = String(it.expiryDate || '').trim().toUpperCase();
        if (c && c !== 'N/A') {
          const normCode = c.replace(/^0+(?=\d)/, '');
          return `${b}|${normCode}|${bt || 'NO_BATCH'}|${exp}`;
        }
        if (it.rowId && String(it.rowId) !== 'undefined') return `${b}|ID_${it.rowId}`;
        return `${b}|${(it.itemDescription || '').trim().toUpperCase()}|${bt || 'NO_BATCH'}|${exp}`;
      };

      const numOrNull = (v) => (v !== undefined && v !== null && v !== '' && !isNaN(v)) ? Number(v) : null;

      const mapB = new Map();
      for (const b of arrB) {
        if (b) mapB.set(String(getKey(b)), b);
      }
      if (mapB.size !== arrA.length) return false;

      for (const a of arrA) {
        if (!a) return false;
        const b = mapB.get(String(getKey(a)));
        if (!b) return false;

        if (String(a.rowId || '') !== String(b.rowId || '')) return false;
        if (a.status !== b.status) return false;
        if (!!a.cleared !== !!b.cleared) return false;
        if (a.quantity !== b.quantity) return false;
        if (a.expiryDate !== b.expiryDate) return false;
        if (a.batchNumber !== b.batchNumber) return false;
        if (a.actionPlan !== b.actionPlan) return false;
        if (numOrNull(a.clearancePrice) !== numOrNull(b.clearancePrice)) return false;
        if (numOrNull(a.offeredPrice) !== numOrNull(b.offeredPrice)) return false;
        if (numOrNull(a.normalPrice) !== numOrNull(b.normalPrice)) return false;
        if (a.remarks !== b.remarks) return false;
      }
      return true;
    }

    _areReturnsArraysEqual(arrA, arrB) {
      if (!Array.isArray(arrA) || !Array.isArray(arrB)) return false;
      if (arrA.length !== arrB.length) return false;
      if (arrA.length === 0 && arrB.length === 0) return true;

      const mapB = new Map();
      for (const b of arrB) {
        if (b && b.id) mapB.set(b.id, b);
      }
      if (mapB.size !== arrA.length) return false;

      for (const a of arrA) {
        if (!a || !a.id) return false;
        const b = mapB.get(a.id);
        if (!b) return false;
        if (a.status !== b.status) return false;
        if (a.doNumber !== b.doNumber) return false;
        if (a.totalCartons !== b.totalCartons) return false;
        if (a.cnNumber !== b.cnNumber) return false;
        if (a.cnAmount !== b.cnAmount) return false;
        if (a.xilnexKeyed !== b.xilnexKeyed) return false;
        if ((a.items || []).length !== (b.items || []).length) return false;
        if ((a.updatedAt || a.createdAt) !== (b.updatedAt || b.createdAt)) return false;
        if (JSON.stringify(a.items) !== JSON.stringify(b.items)) return false;
        if (JSON.stringify(a.signedProof) !== JSON.stringify(b.signedProof)) return false;
      }
      return true;
    }

    async _cleanupConflictFiles(dirHandle) {
      if (!dirHandle || typeof dirHandle.entries !== 'function') return;
      try {
        const toDelete = [];
        for await (const [name, entry] of dirHandle.entries()) {
          if (entry.kind === 'file') {
            if (/-(William-Chai|KOTASENTOSAPIPC1|PQ0147MI-CP004)(-\d+)?\.json$/i.test(name) ||
                /^(patients_master|stock_expiry|returns_credit_notes|schedule_settings)-.+\.json$/i.test(name)) {
              toDelete.push(name);
            }
          }
        }
        for (const fname of toDelete) {
          try {
            await dirHandle.removeEntry(fname);
            console.log(`[PMG OneDrive Sync] 🧹 Auto-cleaned conflict duplicate: ${fname}`);
          } catch (_) {}
        }
      } catch (err) {
        // Silently skip if cannot iterate
      }
    }

    // ─── BACKGROUND LIVE WATCHER ─────────────────────────────────────────────
    _startBackgroundWatcher() {
      if (this.watcherInterval) clearInterval(this.watcherInterval);

      // Periodic check every 90 seconds (live sync + automatic daily rolling full-system vault)
      this.watcherInterval = setInterval(() => {
        if (!document.hidden) {
          this.syncWithOneDriveFolder(false);
          if (typeof window.runDailyAutoBackupIfDue === 'function') {
            window.runDailyAutoBackupIfDue({ force: false, quiet: false }).catch(() => {});
          }
        }
      }, this.autoSyncSeconds * 1000);

      // Check when user switches back to browser tab (debounced: at least 20s between checks)
      if (!this._visibilityListenerAttached) {
        this._visibilityListenerAttached = true;
        let lastTabSyncTime = 0;
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            const now = Date.now();
            if (now - lastTabSyncTime >= 20000) {
              lastTabSyncTime = now;
              this.syncWithOneDriveFolder(false);
              if (typeof window.runDailyAutoBackupIfDue === 'function') {
                window.runDailyAutoBackupIfDue({ force: false, quiet: false }).catch(() => {});
              }
            }
          }
        });
      }
    }

    // ─── UI STATUS BADGE UPDATER ─────────────────────────────────────────────
    _updateBadge(status, text) {
      // 1. Module-level badge (Patient Care tab)
      const badgeEl = document.getElementById('oneDriveLiveSyncBadge');
      const textEl = document.getElementById('oneDriveLiveSyncText');
      const iconEl = document.getElementById('oneDriveLiveSyncIcon');

      // 2. Global Top Header badge (Always visible in Top Navbar to AM & BM)
      const hBadgeEl = document.getElementById('headerOneDriveSyncBadge');
      const hTextEl = document.getElementById('headerOneDriveSyncText');
      const hIconEl = document.getElementById('headerOneDriveSyncIcon');

      if (badgeEl && textEl) {
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

      if (hBadgeEl && hTextEl) {
        hTextEl.textContent = text;
        if (status === 'CONNECTED') {
          hBadgeEl.className = 'cursor-pointer text-xs font-semibold text-emerald-100 bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded flex items-center gap-1.5 transition shadow-xs border border-emerald-500/50';
          if (hIconEl) hIconEl.className = 'fa-solid fa-cloud-check text-emerald-200';
        } else if (status === 'SYNCING') {
          hBadgeEl.className = 'cursor-pointer text-xs font-semibold text-blue-100 bg-blue-700 hover:bg-blue-600 px-2.5 py-1 rounded flex items-center gap-1.5 transition shadow-xs border border-blue-500/50';
          if (hIconEl) hIconEl.className = 'fa-solid fa-arrows-rotate text-blue-200 animate-spin';
        } else if (status === 'PERMISSION_NEEDED') {
          hBadgeEl.className = 'cursor-pointer text-xs font-semibold text-amber-100 bg-amber-600 hover:bg-amber-500 px-2.5 py-1 rounded flex items-center gap-1.5 transition shadow-xs border border-amber-400/50';
          if (hIconEl) hIconEl.className = 'fa-solid fa-lock text-amber-200';
        } else if (status === 'ERROR') {
          hBadgeEl.className = 'cursor-pointer text-xs font-semibold text-rose-100 bg-rose-700 hover:bg-rose-600 px-2.5 py-1 rounded flex items-center gap-1.5 transition shadow-xs border border-rose-500/50';
          if (hIconEl) hIconEl.className = 'fa-solid fa-triangle-exclamation text-rose-200';
        } else {
          // DISCONNECTED
          hBadgeEl.className = 'cursor-pointer text-xs font-semibold text-blue-200 bg-blue-800 hover:bg-blue-700 px-2.5 py-1 rounded flex items-center gap-1.5 transition shadow-xs border border-blue-600/60';
          if (hIconEl) hIconEl.className = 'fa-brands fa-microsoft text-sky-300';
        }
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

  // ─── GOOGLE CLOUD ECOSYSTEM SYNC (NON-PATIENT MODULES ONLY — PDPA SAFE) ──
  const GOOGLE_CLOUD_OPS_API_URL = (typeof window !== 'undefined' && window.PMG_SCHEDULE_API_URL) || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
  const OPS_MISC_CLOUD_VAULT_KEY = 'PMG_OPS_MISC_VAULT_KS01';
  const COMMERCIAL_STORAGE_KEYS = [
    'pmg_admin_quotation_data',
    'pmg_admin_invoice_data',
    'pmg_admin_invoice_counter',
    'pmg_admin_incident_data',
    'pmg_admin_history_quotes',
    'pmg_admin_history_invoices',
    'pmg_admin_history_incidents'
  ];

  async function readOpsMiscCloudVault() {
    if (!GOOGLE_CLOUD_OPS_API_URL || typeof fetch !== 'function') return null;
    try {
      const res = await fetch(`${GOOGLE_CLOUD_OPS_API_URL}?branch=${encodeURIComponent(OPS_MISC_CLOUD_VAULT_KEY)}`);
      if (!res || !res.ok) return null;
      const data = await res.json();
      if (data && data.status === 'success' && data.schedule && typeof data.schedule === 'object') {
        return data.schedule;
      }
      if (data && data.schedule && typeof data.schedule === 'object') {
        return data.schedule;
      }
    } catch (err) {
      console.warn('[PMG Google Cloud Sync] Read ops misc vault failed:', err?.message || err);
    }
    return null;
  }

  // PDPA-Safe Commercial Admin Cloud Sanitizer: strips patient NRIC, patientName, and clinic/clinical refs before Google Cloud sync
  function sanitizeCommercialValueForCloud(storageKey, rawStr) {
    if (typeof rawStr !== 'string') return rawStr;
    if (storageKey === 'pmg_admin_invoice_counter') return rawStr;
    try {
      const parsed = JSON.parse(rawStr);
      const stripNode = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(stripNode);
        const out = {};
        Object.keys(obj).forEach((k) => {
          const kl = k.toLowerCase();
          if (
            kl === 'icreg' || kl === 'ic' || kl === 'nric' || kl === 'patientic' ||
            kl === 'patientname' || kl === 'doctorclinicref' || kl === 'clinicalnotes'
          ) {
            return; // Strictly omit PII / NRIC / clinical references from Google Cloud
          }
          out[k] = stripNode(obj[k]);
        });
        return out;
      };
      return JSON.stringify(stripNode(parsed));
    } catch (_) {
      return rawStr;
    }
  }

  async function writeOpsMiscCloudVault(scheduleObj) {
    if (!GOOGLE_CLOUD_OPS_API_URL || typeof fetch !== 'function' || !scheduleObj) return false;
    try {
      const jsonStr = JSON.stringify(scheduleObj);
      if (jsonStr.length > 38000) {
        // Chunked upload using exact Apps Script uploadApplicantDoc schema ({ appId, doc: { field, name, type, data } })
        const b64Payload = btoa(unescape(encodeURIComponent(jsonStr)));
        const uploadRes = await fetch(GOOGLE_CLOUD_OPS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'uploadApplicantDoc',
            appId: OPS_MISC_CLOUD_VAULT_KEY,
            doc: {
              field: 'auditCommercialVault',
              name: 'ops_misc_vault.json',
              type: 'application/json',
              size: jsonStr.length,
              data: `data:application/json;base64,${b64Payload}`
            }
          }),
          redirect: 'follow'
        });
        const uploadJson = uploadRes && uploadRes.ok ? await uploadRes.json().catch(() => null) : null;
        if (!uploadJson || !uploadJson.success || !uploadJson.docId) return false;

        const pointer = { chunkedDocId: uploadJson.docId, updatedAt: new Date().toISOString() };
        const ptrRes = await fetch(GOOGLE_CLOUD_OPS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ branch: OPS_MISC_CLOUD_VAULT_KEY, schedule: pointer, updatedBy: 'PMG Antigravity Cloud' }),
          redirect: 'follow'
        });
        return Boolean(ptrRes && ptrRes.ok);
      }

      const res = await fetch(GOOGLE_CLOUD_OPS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          branch: OPS_MISC_CLOUD_VAULT_KEY,
          schedule: scheduleObj,
          updatedBy: 'PMG Antigravity Cloud'
        }),
        redirect: 'follow'
      });
      return Boolean(res && res.ok);
    } catch (err) {
      console.warn('[PMG Google Cloud Sync] Write ops misc vault failed:', err?.message || err);
      return false;
    }
  }

  async function resolveOpsMiscCloudVault() {
    const raw = await readOpsMiscCloudVault();
    if (!raw) return {};
    if (raw.chunkedDocId && typeof fetch === 'function') {
      try {
        const res = await fetch(`${GOOGLE_CLOUD_OPS_API_URL}?action=getApplicantDoc&docId=${encodeURIComponent(raw.chunkedDocId)}`);
        if (res && res.ok) {
          const docData = await res.json();
          const rawB64 = docData && (docData.data || docData.base64Data);
          if (rawB64) {
            const cleanB64 = String(rawB64).includes(',') ? String(rawB64).split(',')[1] : String(rawB64);
            const decoded = decodeURIComponent(escape(atob(cleanB64)));
            const parsed = JSON.parse(decoded);
            if (parsed && typeof parsed === 'object') return parsed;
          }
        }
      } catch (_) {}
    }
    return raw;
  }

  window.syncAuditFromCloud = async function() {
    try {
      const vault = await resolveOpsMiscCloudVault();
      const cloudAudit = vault && vault.auditWalkthrough ? vault.auditWalkthrough : null;
      const localRaw = localStorage.getItem('pmg_latest_walkthrough_audit');
      let localAudit = null;
      if (localRaw) {
        try { localAudit = JSON.parse(localRaw); } catch (_) {}
      }

      const cloudTs = cloudAudit ? new Date(cloudAudit.timestamp || cloudAudit.updatedAt || 0).getTime() : 0;
      const localTs = localAudit ? new Date(localAudit.timestamp || localAudit.updatedAt || 0).getTime() : 0;

      if (cloudAudit && cloudTs > localTs) {
        localStorage.setItem('pmg_latest_walkthrough_audit', JSON.stringify(cloudAudit));
        if (typeof window.pmgRenderLatestWalkthroughAudit === 'function') {
          try { window.pmgRenderLatestWalkthroughAudit(); } catch (_) {}
        }
        return { status: 'pulled', updated: true };
      } else if (localAudit && localTs > cloudTs) {
        const nextVault = Object.assign({}, vault, { auditWalkthrough: localAudit, updatedAt: new Date().toISOString() });
        await writeOpsMiscCloudVault(nextVault);
        return { status: 'pushed', updated: true };
      }
      return { status: 'in-sync', updated: false };
    } catch (err) {
      console.warn('[PMG Google Cloud Sync] syncAuditFromCloud error:', err?.message || err);
      return { status: 'error', error: err?.message || String(err) };
    }
  };

  window.syncCommercialFromCloud = async function() {
    try {
      const vault = await resolveOpsMiscCloudVault();
      const cloudComm = vault && vault.commercialAdmin ? vault.commercialAdmin : null;
      const localPayload = {};
      let hasLocal = false;
      COMMERCIAL_STORAGE_KEYS.forEach((k) => {
        const val = localStorage.getItem(k);
        if (val !== null) {
          // Enforce Malaysia PDPA: strip patient NRIC, patientName & clinic refs before Google Cloud upload
          localPayload[k] = sanitizeCommercialValueForCloud(k, val);
          hasLocal = true;
        }
      });

      const localMetaTs = Number(localStorage.getItem('pmg_commercial_cloud_ts') || 0);
      const cloudMetaTs = cloudComm && cloudComm.updatedAt ? Number(cloudComm.updatedAt) : 0;

      if (cloudComm && cloudComm.keys && (!hasLocal || (cloudMetaTs > localMetaTs && localMetaTs > 0))) {
        Object.keys(cloudComm.keys).forEach((k) => {
          if (COMMERCIAL_STORAGE_KEYS.includes(k) && typeof cloudComm.keys[k] === 'string') {
            localStorage.setItem(k, cloudComm.keys[k]);
          }
        });
        if (cloudMetaTs) localStorage.setItem('pmg_commercial_cloud_ts', String(cloudMetaTs));
        if (window.pmgAdminUtils && typeof window.pmgAdminUtils.init === 'function') {
          try { window.pmgAdminUtils.init(); } catch (_) {}
        }
        return { status: 'pulled', updated: true };
      } else if (hasLocal) {
        const nextTs = Math.max(Date.now(), localMetaTs || 0);
        localStorage.setItem('pmg_commercial_cloud_ts', String(nextTs));
        const nextVault = Object.assign({}, vault, {
          commercialAdmin: { updatedAt: nextTs, keys: localPayload },
          updatedAt: new Date().toISOString()
        });
        await writeOpsMiscCloudVault(nextVault);
        return { status: 'pushed', updated: true };
      }
      return { status: 'in-sync', updated: false };
    } catch (err) {
      console.warn('[PMG Google Cloud Sync] syncCommercialFromCloud error:', err?.message || err);
      return { status: 'error', error: err?.message || String(err) };
    }
  };

  window.triggerGoogleCloudEcosystemSync = async function(options = {}) {
    const ops = [
      { name: 'Schedule & Teammates', fn: () => typeof window.syncTeammatePreferencesWithCloud === 'function' ? window.syncTeammatePreferencesWithCloud() : Promise.resolve('skipped') },
      { name: 'Stock Expiry', fn: () => window.pmgExpiry && typeof window.pmgExpiry.syncFromSheets === 'function' ? window.pmgExpiry.syncFromSheets(false) : Promise.resolve('skipped') },
      { name: 'Returns & CN', fn: () => window.pmgReturns && typeof window.pmgReturns.syncWithGoogleSheets === 'function' ? window.pmgReturns.syncWithGoogleSheets() : Promise.resolve('skipped') },
      { name: 'Pricing Matrix', fn: () => window.pmgPricing && typeof window.pmgPricing.fetchPricingFromSheets === 'function' ? window.pmgPricing.fetchPricingFromSheets(false) : Promise.resolve('skipped') },
      { name: 'Recruitment', fn: () => window.pmgRecruitment && typeof window.pmgRecruitment.syncAppsFromCloud === 'function' ? window.pmgRecruitment.syncAppsFromCloud(false) : Promise.resolve('skipped') },
      { name: 'Promo Broadcast', fn: () => typeof window.syncPromoBroadcastWithGoogleCloud === 'function' ? window.syncPromoBroadcastWithGoogleCloud(true) : Promise.resolve('skipped') },
      { name: 'Smart Inventory', fn: () => typeof window.syncInventoryConfigWithGoogleCloud === 'function' ? window.syncInventoryConfigWithGoogleCloud(true) : Promise.resolve('skipped') },
      { name: 'Outlet Performance', fn: () => typeof window.syncPerformanceWithCloud === 'function' ? window.syncPerformanceWithCloud(false) : Promise.resolve('skipped') },
      { name: 'SKU Action Plans', fn: () => typeof window.syncSkuActionPlansWithCloud === 'function' ? window.syncSkuActionPlansWithCloud(false) : Promise.resolve('skipped') },
      { name: '5S Audit', fn: () => typeof window.syncAuditFromCloud === 'function' ? window.syncAuditFromCloud() : Promise.resolve('skipped') },
      { name: 'Commercial Admin', fn: () => typeof window.syncCommercialFromCloud === 'function' ? window.syncCommercialFromCloud() : Promise.resolve('skipped') }
    ];

    const settled = await Promise.allSettled(ops.map((op) => {
      try {
        return Promise.resolve(op.fn());
      } catch (err) {
        return Promise.reject(err);
      }
    }));

    const modulesSynced = [];
    const failedModules = [];
    settled.forEach((res, idx) => {
      const label = ops[idx].name;
      if (res.status === 'fulfilled' && res.value !== 'skipped') {
        modulesSynced.push(label);
      } else if (res.status === 'rejected') {
        failedModules.push(label);
      }
    });

    const now = new Date();
    try { localStorage.setItem('pmg_last_google_cloud_sync', now.toISOString()); } catch (_) {}

    return {
      ok: failedModules.length === 0,
      manual: Boolean(options && options.manual),
      time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      modulesSynced,
      failedModules,
      pdpaGuardActive: Boolean(window.PMG_PDPA_MEDICAL_CLOUD_GUARD)
    };
  };

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
        pill.textContent = '✅ Connected (Kota Sentosa • Hybrid Cloud + PDPA OneDrive)';
      } else {
        pill.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200';
        pill.textContent = '☁️ Google Cloud Active • OneDrive (PDPA) Optional';
      }
    }

    if (folderEl) {
      folderEl.textContent = window.pmgOneDriveSync.rootHandle
        ? window.pmgOneDriveSync.rootHandle.name
        : 'Antigravity Google Cloud Active (Link OneDrive for Patient PDPA Vault)';
    }

    if (branchEl) {
      const b = window.pmgOneDriveSync._resolveCurrentBranchName();
      branchEl.textContent = b === 'KOTA SENTOSA' ? 'Kota Sentosa (KS01)' : b;
    }

    if (lastSyncEl) {
      const lastDate = localStorage.getItem('pmg_last_backup_date') || localStorage.getItem('pmg_last_google_cloud_sync');
      const lastType = localStorage.getItem('pmg_last_backup_date')
        ? (localStorage.getItem('pmg_last_backup_type') || 'OneDrive')
        : 'Google Cloud';
      if (lastDate) {
        try {
          const d = new Date(lastDate);
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          lastSyncEl.textContent = `${dateStr} at ${timeStr} (${lastType})`;
        } catch (e) {
          lastSyncEl.textContent = 'Active';
        }
      } else {
        lastSyncEl.textContent = 'Ready to sync';
      }
    }

    // Update Daily Auto-Backup status & Device Tag UI inside #oneDriveSyncModal
    const tagInput = document.getElementById('syncModalDeviceTagInput');
    const devTag = typeof getDeviceBackupTag === 'function' ? getDeviceBackupTag() : 'PC1-Operations';
    if (tagInput && tagInput.value !== devTag && document.activeElement !== tagInput) {
      tagInput.value = devTag;
    }

    const autoStatusEl = document.getElementById('syncModalDailyAutoStatus');
    if (autoStatusEl) {
      const todayStr = typeof getLocalTodayIsoDate === 'function' ? getLocalTodayIsoDate() : new Date().toISOString().split('T')[0];
      const lastAutoDate = localStorage.getItem('pmg_last_auto_vault_date') || '';
      const lastAutoTimeIso = localStorage.getItem('pmg_last_auto_vault_time') || '';
      const lastAutoTag = localStorage.getItem('pmg_last_auto_vault_tag') || devTag;
      if (lastAutoDate === todayStr && lastAutoTimeIso) {
        let tStr = '';
        try { tStr = new Date(lastAutoTimeIso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch (_) {}
        autoStatusEl.className = 'text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5';
        autoStatusEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> <span>✅ Auto-Backed Up Today at ${escapeSyncHtml(tStr || 'today')} (${escapeSyncHtml(lastAutoTag)} · 7-day history in Daily_Auto_Backups/)</span>`;
      } else if (isConn) {
        autoStatusEl.className = 'text-[11px] font-semibold text-indigo-800 bg-indigo-100/80 border border-indigo-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5';
        autoStatusEl.innerHTML = `<i class="fa-solid fa-clock text-indigo-600"></i> <span>⏳ Daily Auto-Backup Ready (${escapeSyncHtml(devTag)} · runs automatically once per day, keeps last 7 days)</span>`;
      } else {
        autoStatusEl.className = 'text-[11px] font-semibold text-amber-900 bg-amber-100/80 border border-amber-300 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5';
        autoStatusEl.innerHTML = `<i class="fa-solid fa-folder-plus text-amber-700"></i> <span>Link your OneDrive folder once to activate hands-free 7-day Daily Auto-Backups for ${escapeSyncHtml(devTag)}</span>`;
      }
    }

    const persistEl = document.getElementById('syncModalPersistBadge');
    if (persistEl) {
      if (window._pmgStoragePersisted === true) {
        persistEl.textContent = '🔒 Browser Storage Protected';
        persistEl.className = 'px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold';
      } else {
        persistEl.textContent = '🛡️ 7-Day Auto-Vault Active';
        persistEl.className = 'px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-full text-[10px] font-bold';
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
      fb.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-blue-600 text-sm"></i> <span>Syncing operational modules via Google Cloud & checking PDPA OneDrive vault...</span>';
      fb.classList.remove('hidden');
    }

    try {
      const cloudRes = await window.triggerGoogleCloudEcosystemSync({ manual: true });
      const isOneDriveLinked = Boolean(window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED');

      if (!isOneDriveLinked) {
        updateSyncModalInfo();
        const syncedList = cloudRes.modulesSynced.length > 0
          ? cloudRes.modulesSynced.map(escapeSyncHtml).join(', ')
          : 'Schedule, Expiry, Returns/CN, Pricing Matrix, Recruitment, Promo Broadcast, Smart Inventory, Performance & 6M Aging Action Plans, 5S Audit & Commercial Admin';

        if (fb) {
          fb.className = 'p-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs space-y-1.5';
          fb.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 text-sky-800">
              <i class="fa-solid fa-cloud-check text-sky-600 text-sm"></i> Google Cloud Operational Sync Complete (${escapeSyncHtml(cloudRes.time)})
            </div>
            <div class="text-[11px] text-sky-900 leading-relaxed">
              <b>Synced Non-Patient Modules:</b> ${syncedList}.
            </div>
            <div class="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
              <div><i class="fa-solid fa-shield-halved text-amber-600"></i> <b>PDPA Medical Privacy Guard (${cloudRes.pdpaGuardActive ? 'Active' : 'Enforced'}):</b> Patient Care clinical records remain strictly on Local Storage & Company OneDrive only (never uploaded to Google Cloud).</div>
              <div>Link your PMG OneDrive folder below anytime to replicate encrypted Patient Care backups.</div>
            </div>
          `;
          fb.classList.remove('hidden');
        }
        showPmgToast(`☁️ Google Cloud Operational Sync Complete (${cloudRes.time}) • Patient Data Kept PDPA-Private`, 'success');
        return;
      }

      const res = await window.pmgOneDriveSync.manualSync();
      updateSyncModalInfo();

      if (fb) {
        fb.className = 'p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1.5';
        fb.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-emerald-700">
            <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i> Hybrid Google Cloud + OneDrive PDPA Sync Complete!
          </div>
          <div class="text-[11px] text-emerald-800 space-y-1">
            <div>• <b>Target:</b> ${escapeSyncHtml(res.branch)} &bull; <b>Time:</b> ${res.time}</div>
            <div class="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-emerald-900 font-medium">
              <div>✓ <b>Patient Care (OneDrive PDPA):</b> ${res.count} records</div>
              <div>✓ <b>Equipment Rentals (OneDrive):</b> ${res.rentalsCount || 0} rentals</div>
              <div>✓ <b>Job Applications:</b> ${res.recruitmentCount || 0} applicants</div>
              <div>✓ <b>Credit Notes & DO:</b> ${res.returnsCount || 0} records</div>
              <div>✓ <b>Pricing SKUs:</b> ${res.pricingCount || 0} master items</div>
              <div>✓ <b>Schedules & Roster:</b> Working hours synced</div>
              <div>✓ <b>Stock Expiry & Aging:</b> Disposition & 6M plans synced</div>
              <div>✓ <b>Promo / Inventory / 5S / Admin:</b> Google Cloud synced</div>
            </div>
          </div>
          <div class="text-[10px] text-emerald-700 mt-1 font-medium">
            Non-patient operations are live on Google Cloud Ecosystem; sensitive Patient Care clinical records remain PDPA-isolated on Company OneDrive.
          </div>
        `;
        fb.classList.remove('hidden');
      }

      showPmgToast(`✅ Hybrid Cloud + OneDrive PDPA Synced (${res.branch} at ${res.time})`, 'success');

    } catch (err) {
      console.error('[PMG OneDrive Sync] Manual sync failed:', err);
      updateSyncModalInfo();

      if (fb) {
        fb.className = 'p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs space-y-1.5';
        fb.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-rose-700">
            <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> Sync Unsuccessful
          </div>
          <div class="text-[11px] text-rose-800">${escapeSyncHtml(err.message || 'Unable to sync with cloud/OneDrive folder.')}</div>
          <div class="text-[10px] text-gray-600 bg-white/80 p-1.5 rounded border border-rose-100">
            <b>Fix:</b> Click <b>"Link / Change Folder"</b> below to re-select your OneDrive folder and grant browser permissions.
          </div>
        `;
        fb.classList.remove('hidden');
      }
      showPmgToast('Sync error: ' + (err.message || 'Sync failed'), 'error');
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
      if (fb && !fb.innerHTML.includes('Sync Complete')) {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── FULL SYSTEM DISASTER VAULT BACKUP & RESTORE (PRE-IT CLEANUP SHIELD) ───
  // Captures & restores 100% of localStorage + all 4 IndexedDB databases:
  //   1. PMG_HEALTH_DB (documents with binary PDF/image blobs + app_data)
  //   2. pmg_returns_db (returns_records + signed DO proof scans)
  //   3. pmg_pricing_matrix_db (skus_store master_skus)
  //   4. pmg_performance_db (perf_store YoY datasets & 6M aging action plans)
  // ═══════════════════════════════════════════════════════════════════════════

  async function readAllIdbKeyValStore(dbName, dbVersion, storeName, isKeyPath = false) {
    if (typeof indexedDB === 'undefined') return isKeyPath ? [] : {};
    return new Promise((resolve) => {
      let settled = false;
      const done = (val) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(val);
      };
      const timer = setTimeout(() => done(isKeyPath ? [] : {}), 4000);
      try {
        const req = indexedDB.open(dbName, dbVersion);
        req.onblocked = () => done(isKeyPath ? [] : {});
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            if (isKeyPath) db.createObjectStore(storeName, { keyPath: 'id' });
            else db.createObjectStore(storeName);
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            return done(isKeyPath ? [] : {});
          }
          try {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            if (isKeyPath) {
              const allReq = store.getAll();
              allReq.onsuccess = () => {
                const res = allReq.result || [];
                db.close();
                done(res);
              };
              allReq.onerror = () => { db.close(); done([]); };
            } else {
              const keysReq = store.getAllKeys();
              const valsReq = store.getAll();
              tx.oncomplete = () => {
                const out = {};
                const keys = keysReq.result || [];
                const vals = valsReq.result || [];
                keys.forEach((k, idx) => { out[String(k)] = vals[idx]; });
                db.close();
                done(out);
              };
              tx.onerror = () => { db.close(); done({}); };
            }
          } catch (_) {
            db.close();
            done(isKeyPath ? [] : {});
          }
        };
        req.onerror = () => done(isKeyPath ? [] : {});
      } catch (_) {
        done(isKeyPath ? [] : {});
      }
    });
  }

  async function writeAllIdbKeyValStore(dbName, dbVersion, storeName, data, isKeyPath = false) {
    if (typeof indexedDB === 'undefined' || !data) return 0;
    return new Promise((resolve) => {
      let settled = false;
      const done = (val) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(val);
      };
      const timer = setTimeout(() => done(0), 4000);
      try {
        const req = indexedDB.open(dbName, dbVersion);
        req.onblocked = () => done(0);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            if (isKeyPath) db.createObjectStore(storeName, { keyPath: 'id' });
            else db.createObjectStore(storeName);
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            return done(0);
          }
          try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            let count = 0;
            if (isKeyPath && Array.isArray(data)) {
              data.forEach(item => {
                if (item && item.id) {
                  store.put(item);
                  count++;
                }
              });
            } else if (!isKeyPath && typeof data === 'object') {
              Object.keys(data).forEach(k => {
                if (data[k] !== undefined) {
                  store.put(data[k], k);
                  count++;
                }
              });
            }
            tx.oncomplete = () => { db.close(); done(count); };
            tx.onerror = () => { db.close(); done(count); };
          } catch (_) {
            db.close();
            done(0);
          }
        };
        req.onerror = () => done(0);
      } catch (_) {
        done(0);
      }
    });
  }

  async function buildFullSystemVaultBundle(options = {}) {
    const includeDocBlobs = options.includeDocBlobs !== false;
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];

    // 1. Capture 100% of localStorage keys
    const localStorageDump = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          localStorageDump[k] = localStorage.getItem(k);
        }
      }
    } catch (_) {}

    // 2. Capture Patient Care records (from memory, IndexedDB, or localStorage)
    let patients = [];
    if (typeof patientsData !== 'undefined' && Array.isArray(patientsData) && patientsData.length > 0) {
      patients = patientsData;
    } else if (typeof window.safeStorageGet === 'function') {
      const idbPts = await window.safeStorageGet('pmg_patients_data_v1');
      if (Array.isArray(idbPts)) patients = idbPts;
    } else if (localStorageDump['pmg_patients_data_v1']) {
      try { patients = JSON.parse(localStorageDump['pmg_patients_data_v1']) || []; } catch (_) {}
    }

    // 3. Capture PMG_HEALTH_DB (documents + app_data)
    let documents = [];
    try {
      if (includeDocBlobs && typeof window.exportAllDocuments === 'function') {
        documents = await window.exportAllDocuments();
      } else if (typeof window.exportAllDocumentsMetadata === 'function') {
        documents = await window.exportAllDocumentsMetadata();
      }
    } catch (_) {}
    const healthAppData = await readAllIdbKeyValStore('PMG_HEALTH_DB', 2, 'app_data', false);
    if (patients.length > 0 && (!Array.isArray(healthAppData['pmg_patients_data_v1']) || healthAppData['pmg_patients_data_v1'].length < patients.length)) {
      healthAppData['pmg_patients_data_v1'] = patients;
    }

    // 4. Capture pmg_returns_db (exact store name: pmg_returns_cn_db + signed DO proof scans)
    let returnsRecords = await readAllIdbKeyValStore('pmg_returns_db', 1, 'pmg_returns_cn_db', true);
    if ((!Array.isArray(returnsRecords) || returnsRecords.length === 0) && localStorageDump['pmg_returns_records_v1']) {
      try {
        const parsedRet = JSON.parse(localStorageDump['pmg_returns_records_v1']);
        if (Array.isArray(parsedRet)) returnsRecords = parsedRet;
      } catch (_) {}
    }

    // 5. Capture pmg_pricing_matrix_db (skus_store)
    const pricingStore = await readAllIdbKeyValStore('pmg_pricing_matrix_db', 1, 'skus_store', false);

    // 6. Capture pmg_performance_db (perf_store YoY datasets & 6M aging plans)
    const performanceStore = await readAllIdbKeyValStore('pmg_performance_db', 1, 'perf_store', false);

    // 7. Also include legacy top-level fields so older restore routines remain 100% compatible
    const pharmacistSchedules = {};
    Object.keys(localStorageDump).forEach(k => {
      if (k.startsWith('pmg_pharmacist_schedule_')) {
        try { pharmacistSchedules[k] = JSON.parse(localStorageDump[k]); } catch (_) {}
      }
    });
    let customerBookings = [];
    try {
      if (localStorageDump['pmg_customer_bookings']) {
        customerBookings = JSON.parse(localStorageDump['pmg_customer_bookings']) || [];
      }
    } catch (_) {}

    const bundle = {
      app: 'PMG_MANAGEMENT_HUB',
      version: '2.0',
      type: 'PMG_FULL_SYSTEM_VAULT_V2',
      exportDate: nowIso,
      branch: 'Kota Sentosa',
      patientCount: patients.length,
      docCount: documents.length,
      localStorageKeyCount: Object.keys(localStorageDump).length,
      returnsCount: Array.isArray(returnsRecords) ? returnsRecords.length : 0,
      pricingCount: Array.isArray(pricingStore.master_skus) ? pricingStore.master_skus.length : 0,
      performanceKeyCount: Object.keys(performanceStore).length,
      scheduleCount: Object.keys(pharmacistSchedules).length,
      bookingCount: customerBookings.length,
      patients,
      documents,
      pharmacistSchedules,
      customerBookings,
      localStorageDump,
      indexedDbDump: {
        healthAppData,
        returnsRecords,
        pricingStore,
        performanceStore
      }
    };

    const filename = `PMG_FULL_SYSTEM_VAULT_KS01_${dateStr}.pmgbak`;
    return {
      bundle,
      filename
    };
  }

  async function exportFullSystemVaultBackup(options = {}) {
    const syncCloudFirst = options.syncCloudFirst !== false;
    const downloadFile = options.downloadFile !== false;
    const fb = document.getElementById('syncModalFeedback');

    if (fb) {
      fb.className = 'p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl flex items-center gap-2 text-xs font-semibold';
      fb.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-indigo-600 text-sm"></i> <span>Shielding all modules: syncing to Google Cloud, OneDrive & packaging Full System Vault (.pmgbak)…</span>';
      fb.classList.remove('hidden');
    }

    // 1. Push latest non-patient operational state to Google Cloud first
    if (syncCloudFirst && typeof window.triggerGoogleCloudEcosystemSync === 'function') {
      try {
        await window.triggerGoogleCloudEcosystemSync({ manual: true });
      } catch (e) {
        console.warn('[PMG Disaster Vault] Cloud sync before export warning:', e);
      }
    }

    // 2. Sync with OneDrive if connected
    const isOneDriveLinked = Boolean(window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED');
    if (isOneDriveLinked) {
      try {
        await window.pmgOneDriveSync.manualSync();
      } catch (e) {
        console.warn('[PMG Disaster Vault] OneDrive sync before export warning:', e);
      }
    }

    // 3. Build complete vault bundle — smart 45MB binary PDF safety guard prevents browser RAM crashes
    //    when hundreds of AirDoc / Blood Report PDFs exist (all binary PDFs are natively mirrored in OneDrive Patient_Reports/)
    const MAX_EMBEDDED_DOC_BYTES = 45 * 1024 * 1024;
    let totalDocBytes = 0;
    if (typeof window.getDocumentsTotalSizeBytes === 'function') {
      try { totalDocBytes = await window.getDocumentsTotalSizeBytes(); } catch (_) {}
    }
    const embedBinaryDocs = options.includeDocBlobs !== undefined
      ? Boolean(options.includeDocBlobs)
      : (totalDocBytes <= MAX_EMBEDDED_DOC_BYTES);

    const devTag = getDeviceBackupTag();
    const { bundle } = await buildFullSystemVaultBundle({ includeDocBlobs: embedBinaryDocs });
    bundle.deviceTag = devTag;
    bundle.binaryDocsStoredInPatientReportsFolder = !embedBinaryDocs;
    const todayStr = getLocalTodayIsoDate();
    const filename = `PMG_FULL_SYSTEM_VAULT_KS01_${devTag}_${todayStr}.pmgbak`;
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    // 4. Write directly to OneDrive folder (per-PC isolated + anti-clobber shared master + KOTA SENTOSA/Daily_Auto_Backups/)
    let savedToOneDriveFolder = false;
    if (isOneDriveLinked && window.pmgOneDriveSync.rootHandle) {
      try {
        await writeMasterVaultSafely(window.pmgOneDriveSync.rootHandle, bundle, devTag);

        let targetBranchDir = window.pmgOneDriveSync.rootHandle;
        if (typeof window.pmgOneDriveSync._getTargetBranchDirectoryHandle === 'function') {
          const bName = window.pmgOneDriveSync._resolveCurrentBranchName();
          const resolvedDir = await window.pmgOneDriveSync._getTargetBranchDirectoryHandle(bName);
          if (resolvedDir) targetBranchDir = resolvedDir;
        }
        const dailyDir = await targetBranchDir.getDirectoryHandle('Daily_Auto_Backups', { create: true });
        const dailyName = `PMG_AUTO_VAULT_${devTag}_${todayStr}.pmgbak`;
        const fhDaily = await dailyDir.getFileHandle(dailyName, { create: true });
        const wDaily = await fhDaily.createWritable();
        await wDaily.write(jsonStr);
        await wDaily.close();
        await pruneOldDailyAutoBackups(dailyDir, devTag, 7);

        try {
          localStorage.setItem('pmg_last_auto_vault_date', todayStr);
          localStorage.setItem('pmg_last_auto_vault_time', bundle.exportDate);
          localStorage.setItem('pmg_last_auto_vault_file', dailyName);
          localStorage.setItem('pmg_last_auto_vault_tag', devTag);
        } catch (_) {}
        savedToOneDriveFolder = true;
      } catch (e) {
        console.warn('[PMG Disaster Vault] Direct OneDrive file write warning:', e);
      }
    }

    // 5. Save/download local master file outside browser storage
    if (downloadFile) {
      let savedViaPicker = false;
      if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PMG Full System Disaster Vault (.pmgbak)',
              accept: { 'application/json': ['.pmgbak', '.json'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          savedViaPicker = true;
        } catch (err) {
          if (err && err.name === 'AbortError') return { aborted: true };
        }
      }

      if (!savedViaPicker && typeof document !== 'undefined') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        if (a.parentNode) a.parentNode.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
    }

    try {
      localStorage.setItem('pmg_last_backup_date', bundle.exportDate);
      localStorage.setItem('pmg_last_backup_type', savedToOneDriveFolder ? 'Full System Vault (OneDrive + Local)' : 'Full System Vault (.pmgbak)');
    } catch (_) {}

    updateSyncModalInfo();
    if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
    if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();

    if (fb) {
      fb.className = 'p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs space-y-1.5';
      fb.innerHTML = `
        <div class="font-extrabold flex items-center gap-1.5 text-emerald-800">
          <i class="fa-solid fa-shield-halved text-emerald-600"></i> Full System Disaster Vault Saved (${escapeSyncHtml(filename)})
        </div>
        <div class="text-[11px] text-emerald-900">
          Protected <b>${bundle.patientCount}</b> patients, <b>${bundle.docCount}</b> lab reports/PDFs, <b>${bundle.localStorageKeyCount}</b> localStorage settings, <b>${bundle.returnsCount}</b> Returns/CNs, <b>${bundle.pricingCount}</b> Pricing SKUs, and <b>${bundle.performanceKeyCount}</b> Performance/Aging datasets.
        </div>
        <div class="text-[10px] text-emerald-700 font-semibold">
          If HQ IT clears browser storage, click <b>"♻️ Restore Full System Vault"</b> and select this file (or simply re-link your OneDrive folder) to restore 100% of your data in 1 click!
        </div>
      `;
      fb.classList.remove('hidden');
    }

    showPmgToast(`🛡️ Full System Vault Saved (${bundle.patientCount} patients, ${bundle.localStorageKeyCount} keys, all 4 IndexedDBs)`, 'success');
    return bundle;
  }

  async function restoreFullSystemVaultFromObject(vaultObj, options = {}) {
    if (!vaultObj || typeof vaultObj !== 'object') {
      throw new Error('Invalid backup file format.');
    }
    const silent = Boolean(options.silent);
    const skipReload = Boolean(options.skipReload);

    let restoredLsCount = 0;
    if (vaultObj.localStorageDump && typeof vaultObj.localStorageDump === 'object') {
      Object.keys(vaultObj.localStorageDump).forEach(k => {
        const val = vaultObj.localStorageDump[k];
        if (typeof val === 'string') {
          try {
            localStorage.setItem(k, val);
            restoredLsCount++;
          } catch (_) {}
        }
      });
    }

    // Restore pharmacistSchedules & customerBookings if present
    if (vaultObj.pharmacistSchedules && typeof vaultObj.pharmacistSchedules === 'object') {
      Object.keys(vaultObj.pharmacistSchedules).forEach(k => {
        try {
          localStorage.setItem(k, JSON.stringify(vaultObj.pharmacistSchedules[k]));
          restoredLsCount++;
        } catch (_) {}
      });
    }
    if (Array.isArray(vaultObj.customerBookings)) {
      try {
        localStorage.setItem('pmg_customer_bookings', JSON.stringify(vaultObj.customerBookings));
      } catch (_) {}
    }

    // Restore patients array (supports both full vault and legacy patient backups)
    const rawPts = Array.isArray(vaultObj.patients)
      ? vaultObj.patients
      : (Array.isArray(vaultObj) ? vaultObj : (vaultObj.indexedDbDump?.healthAppData?.pmg_patients_data_v1 || []));

    if (Array.isArray(rawPts) && rawPts.length > 0) {
      if (typeof window.consolidatePatientList === 'function') {
        const currentPts = (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) ? patientsData : [];
        const mergedPts = window.consolidatePatientList([...currentPts, ...rawPts]);
        if (typeof patientsData !== 'undefined') patientsData = mergedPts;
        if (typeof savePatientsData === 'function') {
          savePatientsData();
        } else if (typeof window.safeStorageSet === 'function') {
          await window.safeStorageSet('pmg_patients_data_v1', mergedPts);
        }
      } else {
        if (typeof window.safeStorageSet === 'function') {
          await window.safeStorageSet('pmg_patients_data_v1', rawPts);
        } else {
          try { localStorage.setItem('pmg_patients_data_v1', JSON.stringify(rawPts)); } catch (_) {}
        }
      }
    }

    // Restore PMG_HEALTH_DB documents (preserves doc.id & patientId links, plus re-hydrates binary PDFs from OneDrive Patient_Reports/ if connected)
    let restoredDocs = 0;
    if (Array.isArray(vaultObj.documents) && vaultObj.documents.length > 0) {
      if (typeof window.importAllDocuments === 'function') {
        try {
          restoredDocs = await window.importAllDocuments(vaultObj.documents);
        } catch (e) {
          console.warn('[PMG Disaster Vault] Document restore warning:', e);
        }
      }
      // If OneDrive is linked, immediately re-hydrate any missing AirDoc / Blood Report PDF binaries from Patient_Reports/
      if (window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && typeof syncPatientReportsBinaryFolder === 'function') {
        try {
          let targetReportDir = window.pmgOneDriveSync.rootHandle;
          if (typeof window.pmgOneDriveSync._getTargetBranchDirectoryHandle === 'function') {
            const bName = window.pmgOneDriveSync._resolveCurrentBranchName();
            const resolvedDir = await window.pmgOneDriveSync._getTargetBranchDirectoryHandle(bName);
            if (resolvedDir) targetReportDir = resolvedDir;
          }
          await syncPatientReportsBinaryFolder(targetReportDir, vaultObj.documents);
        } catch (pdfHydrateErr) {
          console.warn('[PMG Disaster Vault] Binary PDF re-hydration notice:', pdfHydrateErr);
        }
      }
    }

    // Restore all 4 IndexedDB stores if present in indexedDbDump
    const idb = vaultObj.indexedDbDump || {};
    let restoredIdbItems = 0;
    if (idb.healthAppData && typeof idb.healthAppData === 'object') {
      restoredIdbItems += await writeAllIdbKeyValStore('PMG_HEALTH_DB', 2, 'app_data', idb.healthAppData, false);
    }
    if (Array.isArray(idb.returnsRecords) && idb.returnsRecords.length > 0) {
      restoredIdbItems += await writeAllIdbKeyValStore('pmg_returns_db', 1, 'pmg_returns_cn_db', idb.returnsRecords, true);
      try {
        if (!localStorage.getItem('pmg_returns_records_v1')) {
          localStorage.setItem('pmg_returns_records_v1', JSON.stringify(idb.returnsRecords));
        }
      } catch (_) {}
    }
    if (idb.pricingStore && typeof idb.pricingStore === 'object') {
      restoredIdbItems += await writeAllIdbKeyValStore('pmg_pricing_matrix_db', 1, 'skus_store', idb.pricingStore, false);
    }
    if (idb.performanceStore && typeof idb.performanceStore === 'object') {
      restoredIdbItems += await writeAllIdbKeyValStore('pmg_performance_db', 1, 'perf_store', idb.performanceStore, false);
    }

    try {
      localStorage.setItem('pmg_last_backup_date', new Date().toISOString());
      localStorage.setItem('pmg_last_backup_type', 'Restored Full System Vault');
    } catch (_) {}

    if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
    if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();
    if (typeof renderPatientModule === 'function') renderPatientModule();
    updateSyncModalInfo();

    const summary = {
      patientsRestored: Array.isArray(rawPts) ? rawPts.length : 0,
      docsRestored: restoredDocs,
      localStorageRestored: restoredLsCount,
      idbItemsRestored: restoredIdbItems
    };

    if (!silent) {
      showPmgToast(`✅ Full System Vault Restored (${summary.patientsRestored} patients, ${summary.localStorageRestored} settings)`, 'success');
      if (typeof alert === 'function') {
        alert(`✅ Full System Disaster Vault Restored Successfully!\n\n• Patient Profiles & Consultations: ${summary.patientsRestored}\n• Lab Reports & Clinical Documents: ${summary.docsRestored}\n• LocalStorage Module Settings & Rosters: ${summary.localStorageRestored}\n• High-Capacity IndexedDB Datasets (Expiry, Returns, Pricing, Performance): ${summary.idbItemsRestored}\n\nThe page will now refresh to load all restored modules.`);
      }
      if (!skipReload && typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
        setTimeout(() => window.location.reload(), 400);
      }
    }

    return summary;
  }

  function triggerFullSystemVaultRestoreFilePicker() {
    if (typeof document === 'undefined') return;
    let input = document.getElementById('pmgFullVaultRestoreInput');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'pmgFullVaultRestoreInput';
      input.accept = '.pmgbak,.json';
      input.style.display = 'none';
      input.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (typeof confirm === 'function' && !confirm(`Restore Full System Disaster Vault from "${file.name}"?\n\nThis will restore all Patient Care records, Lab PDFs, Roster Timetables, Expiry & 6M Aging Action Plans, Returns & CN, Pricing Matrix, Recruitment, Promo Broadcast, 5S Audit, and Performance Studio datasets.`)) {
          e.target.value = '';
          return;
        }
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          await restoreFullSystemVaultFromObject(parsed, { silent: false, skipReload: false });
        } catch (err) {
          console.error('[PMG Disaster Vault] Restore error:', err);
          if (typeof alert === 'function') alert('Failed to restore Full System Vault: ' + (err.message || err));
        } finally {
          e.target.value = '';
        }
      });
      document.body.appendChild(input);
    }
    input.click();
  }

  // ─── AUTOMATED DAILY ROLLING VAULT ENGINE (PC1/PC2 ISOLATION + 7-DAY PRUNING) ──
  const DEVICE_TAG_STORAGE_KEY = 'pmg_device_backup_tag';
  const DAILY_BACKUP_DIR_NAME = 'Daily_Auto_Backups';
  let _dailyAutoBackupInProgress = false;

  function getLocalTodayIsoDate(refDate = null) {
    const d = refDate instanceof Date ? refDate : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function sanitizeDeviceTag(rawTag) {
    const cleaned = String(rawTag || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 24);
    return cleaned || 'PC1-Operations';
  }

  function getDeviceBackupTag() {
    try {
      const saved = localStorage.getItem(DEVICE_TAG_STORAGE_KEY);
      if (saved && saved.trim()) {
        return sanitizeDeviceTag(saved);
      }
    } catch (_) {}

    // Auto-detect PC2 (Patient Care workstation) vs PC1 (Operations Hub)
    let isPatientWorkstation = false;
    try {
      const pathname = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
      if (/\/patient(\/|$)/i.test(pathname)) {
        isPatientWorkstation = true;
      } else if (typeof patientsData !== 'undefined' && Array.isArray(patientsData) && patientsData.length > 0) {
        isPatientWorkstation = true;
      } else {
        const rawPts = localStorage.getItem(PATIENTS_STORAGE_KEY);
        if (rawPts) {
          const parsed = JSON.parse(rawPts);
          if (Array.isArray(parsed) && parsed.length > 0) isPatientWorkstation = true;
        }
      }
    } catch (_) {}

    return isPatientWorkstation ? 'PC2-PatientCare' : 'PC1-Operations';
  }

  function setDeviceBackupTag(rawTag) {
    const clean = sanitizeDeviceTag(rawTag);
    try {
      localStorage.setItem(DEVICE_TAG_STORAGE_KEY, clean);
    } catch (_) {}
    updateSyncModalInfo();
    return clean;
  }

  function saveDeviceBackupTagFromModal() {
    const inp = typeof document !== 'undefined' ? document.getElementById('syncModalDeviceTagInput') : null;
    if (!inp) return getDeviceBackupTag();
    const saved = setDeviceBackupTag(inp.value);
    inp.value = saved;
    showPmgToast(`🏷️ PC Backup Tag saved as "${saved}" (separate 7-day rolling folder stream active)`, 'success');
    return saved;
  }

  async function writeMasterVaultSafely(rootHandle, bundle, deviceTag) {
    if (!rootHandle || !bundle) return { wroteDeviceLatest: false, wroteSharedLatest: false, preservedExistingPatients: false };
    const tag = sanitizeDeviceTag(deviceTag || getDeviceBackupTag());
    const taggedBundle = Object.assign({}, bundle, { deviceTag: tag });
    const taggedJson = JSON.stringify(taggedBundle, null, 2);

    // 1. Always write device-isolated latest snapshot (PC1 and PC2 never overwrite each other)
    const devFileName = `PMG_FULL_SYSTEM_VAULT_LATEST_${tag}.pmgbak`;
    const devFh = await rootHandle.getFileHandle(devFileName, { create: true });
    const devW = await devFh.createWritable();
    await devW.write(taggedJson);
    await devW.close();

    // 2. Anti-clobber guard for shared PMG_FULL_SYSTEM_VAULT_LATEST.pmgbak:
    //    If this PC has 0 patients locally (e.g. PC1 Operations) while the existing shared master vault
    //    holds PC2's clinical patients/documents, preserve existing clinical arrays so PC1 never wipes PC2's patients.
    let sharedBundleToWrite = taggedBundle;
    let preservedExistingPatients = false;
    const currentPatientCount = Array.isArray(taggedBundle.patients) ? taggedBundle.patients.length : (taggedBundle.patientCount || 0);

    try {
      const existingFh = await rootHandle.getFileHandle('PMG_FULL_SYSTEM_VAULT_LATEST.pmgbak', { create: false });
      const existingFile = await existingFh.getFile();
      const existingText = await existingFile.text();
      if (existingText && existingText.trim()) {
        const existingObj = JSON.parse(existingText);
        const existingPatientCount = Array.isArray(existingObj.patients) ? existingObj.patients.length : (existingObj.patientCount || 0);
        if (currentPatientCount === 0 && existingPatientCount > 0) {
          preservedExistingPatients = true;
          const mergedLs = Object.assign({}, taggedBundle.localStorageDump || {});
          if (existingObj.localStorageDump && existingObj.localStorageDump[PATIENTS_STORAGE_KEY] && !mergedLs[PATIENTS_STORAGE_KEY]) {
            mergedLs[PATIENTS_STORAGE_KEY] = existingObj.localStorageDump[PATIENTS_STORAGE_KEY];
          }
          const mergedIdb = Object.assign({}, taggedBundle.indexedDbDump || {});
          if (existingObj.indexedDbDump && existingObj.indexedDbDump.healthAppData) {
            mergedIdb.healthAppData = Object.assign({}, existingObj.indexedDbDump.healthAppData, mergedIdb.healthAppData || {});
            if (Array.isArray(existingObj.indexedDbDump.healthAppData[PATIENTS_STORAGE_KEY]) && existingObj.indexedDbDump.healthAppData[PATIENTS_STORAGE_KEY].length > 0) {
              mergedIdb.healthAppData[PATIENTS_STORAGE_KEY] = existingObj.indexedDbDump.healthAppData[PATIENTS_STORAGE_KEY];
            }
          }
          sharedBundleToWrite = Object.assign({}, taggedBundle, {
            patientCount: existingPatientCount,
            patients: existingObj.patients,
            docCount: existingObj.docCount || (Array.isArray(existingObj.documents) ? existingObj.documents.length : 0),
            documents: Array.isArray(existingObj.documents) && existingObj.documents.length > 0 ? existingObj.documents : (taggedBundle.documents || []),
            localStorageDump: mergedLs,
            indexedDbDump: mergedIdb,
            preservedPatientsFromTag: existingObj.deviceTag || 'PC2-PatientCare'
          });
        }
      }
    } catch (_) {
      // No existing shared file yet
    }

    const sharedFh = await rootHandle.getFileHandle('PMG_FULL_SYSTEM_VAULT_LATEST.pmgbak', { create: true });
    const sharedW = await sharedFh.createWritable();
    await sharedW.write(JSON.stringify(sharedBundleToWrite, null, 2));
    await sharedW.close();

    return {
      wroteDeviceLatest: true,
      deviceFileName: devFileName,
      wroteSharedLatest: true,
      preservedExistingPatients
    };
  }

  async function pruneOldDailyAutoBackups(dailyDirHandle, deviceTag, keepDays = 7) {
    const removed = [];
    if (!dailyDirHandle || typeof dailyDirHandle.entries !== 'function') return removed;
    const tag = sanitizeDeviceTag(deviceTag || getDeviceBackupTag());
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^PMG_AUTO_VAULT_${escapedTag}_(\\d{4}-\\d{2}-\\d{2})\\.pmgbak$`, 'i');

    const matches = [];
    try {
      for await (const [name, entry] of dailyDirHandle.entries()) {
        if (entry && entry.kind === 'file') {
          const m = name.match(pattern);
          if (m) {
            matches.push({ name, date: m[1] });
          }
        }
      }
    } catch (err) {
      console.warn('[PMG Daily Auto-Backup] Directory listing warning during prune:', err);
      return removed;
    }

    // Sort newest date first
    matches.sort((a, b) => b.date.localeCompare(a.date));
    const limit = Math.max(1, Number(keepDays) || 7);

    for (let i = limit; i < matches.length; i++) {
      const targetName = matches[i].name;
      try {
        if (typeof dailyDirHandle.removeEntry === 'function') {
          await dailyDirHandle.removeEntry(targetName);
          removed.push(targetName);
        }
      } catch (err) {
        console.warn(`[PMG Daily Auto-Backup] Failed to prune old snapshot ${targetName}:`, err);
      }
    }
    return removed;
  }

  // ─── BIDIRECTIONAL NATIVE BINARY PDF SYNC (AirDoc, Blood Reports, Lab PDFs) ───
  // Streams real binary files into OneDrive/Patient_Reports/ (no Base64 RAM spike,
  // handles GBs of PDFs cleanly) AND auto-restores missing PDF blobs back into
  // local IndexedDB after HQ IT wipes browser storage.
  async function syncPatientReportsBinaryFolder(branchDirHandle, docsMetadataList, verifiedCacheSet = null) {
    const stats = { uploaded: 0, restoredFromOneDrive: 0, skippedExisting: 0 };
    if (!branchDirHandle || !Array.isArray(docsMetadataList) || docsMetadataList.length === 0) {
      return stats;
    }

    const reportsFolder = await branchDirHandle.getDirectoryHandle('Patient_Reports', { create: true });

    for (const doc of docsMetadataList) {
      if (!doc || !doc.id) continue;
      try {
        const safeName = `${doc.patientId}_${(doc.name || 'report.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // Check whether local IndexedDB currently holds the actual binary blob
        let localRecord = null;
        if (typeof window.getDocumentById === 'function') {
          try { localRecord = await window.getDocumentById(doc.id); } catch (_) {}
        }
        const hasLocalBlob = Boolean(localRecord && localRecord.blob);

        // Fast skip if already verified on both sides during this session
        if (verifiedCacheSet && verifiedCacheSet.has(safeName) && hasLocalBlob) {
          stats.skippedExisting++;
          continue;
        }

        // Check if binary PDF already exists in OneDrive Patient_Reports/
        let cloudFileHandle = null;
        try {
          cloudFileHandle = await reportsFolder.getFileHandle(safeName, { create: false });
        } catch (_) {
          cloudFileHandle = null;
        }

        if (cloudFileHandle && hasLocalBlob) {
          if (verifiedCacheSet) verifiedCacheSet.add(safeName);
          stats.skippedExisting++;
          continue;
        }

        // Direction 1 (PC → OneDrive): Upload new AirDoc/Blood Report binary directly
        if (!cloudFileHandle && (hasLocalBlob || (doc.dataUrl && typeof window.dataURLtoBlob === 'function'))) {
          const blobToWrite = hasLocalBlob ? localRecord.blob : window.dataURLtoBlob(doc.dataUrl);
          if (blobToWrite) {
            const newFh = await reportsFolder.getFileHandle(safeName, { create: true });
            const rw = await newFh.createWritable();
            await rw.write(blobToWrite);
            await rw.close();
            if (verifiedCacheSet) verifiedCacheSet.add(safeName);
            stats.uploaded++;
          }
          continue;
        }

        // Direction 2 (OneDrive → PC Post-IT-Wipe Recovery): Restore binary PDF back into IndexedDB
        if (cloudFileHandle && !hasLocalBlob && typeof window.putDocumentWithBlob === 'function') {
          const cloudFileBlob = await cloudFileHandle.getFile();
          if (cloudFileBlob) {
            await window.putDocumentWithBlob(doc, cloudFileBlob);
            if (verifiedCacheSet) verifiedCacheSet.add(safeName);
            stats.restoredFromOneDrive++;
          }
        }
      } catch (fErr) {
        console.warn('[PMG OneDrive Sync] Patient_Reports file sync skipped:', fErr);
      }
    }

    if (stats.restoredFromOneDrive > 0) {
      console.log(`[PMG OneDrive Sync] ♻️ Auto-restored ${stats.restoredFromOneDrive} binary PDF report(s) from OneDrive Patient_Reports/ into IndexedDB.`);
    }
    return stats;
  }

  async function runDailyAutoBackupIfDue(options = {}) {
    if (_dailyAutoBackupInProgress) {
      return { skipped: true, reason: 'in_progress' };
    }
    const force = Boolean(options.force);
    const quiet = Boolean(options.quiet);
    const keepDays = Math.max(1, Number(options.keepDays) || 7);
    const todayStr = getLocalTodayIsoDate(options.refDate || null);
    const deviceTag = sanitizeDeviceTag(options.deviceTag || getDeviceBackupTag());

    // Never interrupt while user is actively keying in / saving patient records
    if (!force && typeof window.isPmgSyncPaused === 'function' && window.isPmgSyncPaused()) {
      return { skipped: true, reason: 'user_editing', date: todayStr, deviceTag };
    }

    const lastDate = localStorage.getItem('pmg_last_auto_vault_date') || '';
    const lastTag = localStorage.getItem('pmg_last_auto_vault_tag') || '';
    if (!force && lastDate === todayStr && lastTag === deviceTag) {
      return { skipped: true, reason: 'already_backed_up_today', date: todayStr, deviceTag };
    }

    const rootHandle = options.rootHandle || (window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle) || null;
    if (!rootHandle) {
      return { skipped: true, reason: 'not_connected', date: todayStr, deviceTag };
    }

    // Verify readwrite permission silently (unless caller explicitly opted into prompting)
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync._verifyPermission === 'function') {
      const hasPerm = await window.pmgOneDriveSync._verifyPermission(rootHandle, true, Boolean(options.allowPrompt));
      if (!hasPerm) {
        return { skipped: true, reason: 'no_permission', date: todayStr, deviceTag };
      }
    }

    _dailyAutoBackupInProgress = true;
    try {
      // 1. Resolve branch directory (e.g. KOTA SENTOSA/) so both Patient_Reports/ and Daily_Auto_Backups/ live together cleanly
      let targetBranchDir = rootHandle;
      if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync._getTargetBranchDirectoryHandle === 'function') {
        try {
          const bName = window.pmgOneDriveSync._resolveCurrentBranchName();
          const resolvedDir = await window.pmgOneDriveSync._getTargetBranchDirectoryHandle(bName);
          if (resolvedDir) targetBranchDir = resolvedDir;
        } catch (_) {}
      }

      // Incrementally mirror any newly uploaded AirDoc / Blood Report PDFs natively into Patient_Reports/
      // (Zero Base64 bloat, zero UI freeze, supports gigabytes of PDFs)
      let binarySyncStats = { uploaded: 0, restoredFromOneDrive: 0, skippedExisting: 0 };
      try {
        let localDocsMeta = [];
        if (typeof window.exportAllDocumentsMetadata === 'function') {
          localDocsMeta = await window.exportAllDocumentsMetadata();
        }
        if (localDocsMeta.length > 0) {
          const cacheSet = window.pmgOneDriveSync ? (window.pmgOneDriveSync._syncedReportFilenames = window.pmgOneDriveSync._syncedReportFilenames || new Set()) : null;
          binarySyncStats = await syncPatientReportsBinaryFolder(targetBranchDir, localDocsMeta, cacheSet);
        }
      } catch (binErr) {
        console.warn('[PMG Daily Auto-Backup] Patient_Reports incremental mirror warning:', binErr);
      }

      // 2. Build lightweight daily vault (metadata for PDFs so .pmgbak stays ~1-5MB & saves in <0.2s with zero typing lag;
      //    all actual binary PDFs live natively in OneDrive Patient_Reports/ and auto-rehydrate on recovery!)
      const includeDocBlobs = options.includeDocBlobs === true;
      const { bundle } = await buildFullSystemVaultBundle({ includeDocBlobs });
      bundle.deviceTag = deviceTag;
      bundle.autoBackupDate = todayStr;
      bundle.binaryDocsStoredInPatientReportsFolder = !includeDocBlobs;

      const dailyDir = await targetBranchDir.getDirectoryHandle(DAILY_BACKUP_DIR_NAME, { create: true });
      const filename = `PMG_AUTO_VAULT_${deviceTag}_${todayStr}.pmgbak`;
      const fh = await dailyDir.getFileHandle(filename, { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(bundle, null, 2));
      await writable.close();

      // Update per-PC latest & anti-clobber shared master snapshot
      const masterRes = await writeMasterVaultSafely(rootHandle, bundle, deviceTag);

      // Retain latest N daily snapshots per PC
      const pruned = await pruneOldDailyAutoBackups(dailyDir, deviceTag, keepDays);

      const nowIso = new Date().toISOString();
      try {
        localStorage.setItem('pmg_last_auto_vault_date', todayStr);
        localStorage.setItem('pmg_last_auto_vault_time', nowIso);
        localStorage.setItem('pmg_last_auto_vault_file', filename);
        localStorage.setItem('pmg_last_auto_vault_tag', deviceTag);
        localStorage.setItem('pmg_last_backup_date', nowIso);
        localStorage.setItem('pmg_last_backup_type', `Auto Daily Vault (${deviceTag})`);
      } catch (_) {}

      updateSyncModalInfo();
      if (typeof updateBackupStatusBadge === 'function') updateBackupStatusBadge();
      if (typeof updateDailyBackupBanner === 'function') updateDailyBackupBanner();

      if (!quiet) {
        showPmgToast(`🛡️ Daily Auto-Backup saved to OneDrive (${deviceTag} · ${todayStr})`, 'success');
      }

      return {
        ok: true,
        skipped: false,
        date: todayStr,
        deviceTag,
        filename,
        patientCount: bundle.patientCount,
        docCount: bundle.docCount,
        binarySyncStats,
        pruned,
        preservedExistingPatients: masterRes.preservedExistingPatients
      };
    } catch (err) {
      console.warn('[PMG Daily Auto-Backup] Execution warning:', err);
      return { ok: false, skipped: false, error: err && err.message ? err.message : String(err) };
    } finally {
      _dailyAutoBackupInProgress = false;
    }
  }

  async function requestPersistentBrowserStorage() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
        const already = typeof navigator.storage.persisted === 'function' ? await navigator.storage.persisted() : false;
        const granted = already || await navigator.storage.persist();
        window._pmgStoragePersisted = Boolean(granted);
        updateSyncModalInfo();
        return Boolean(granted);
      }
    } catch (_) {}
    window._pmgStoragePersisted = false;
    return false;
  }

  window.getLocalTodayIsoDate = getLocalTodayIsoDate;
  window.getDeviceBackupTag = getDeviceBackupTag;
  window.setDeviceBackupTag = setDeviceBackupTag;
  window.saveDeviceBackupTagFromModal = saveDeviceBackupTagFromModal;
  window.writeMasterVaultSafely = writeMasterVaultSafely;
  window.pruneOldDailyAutoBackups = pruneOldDailyAutoBackups;
  window.syncPatientReportsBinaryFolder = syncPatientReportsBinaryFolder;
  window.runDailyAutoBackupIfDue = runDailyAutoBackupIfDue;
  window.requestPersistentBrowserStorage = requestPersistentBrowserStorage;
  window.buildFullSystemVaultBundle = buildFullSystemVaultBundle;
  window.exportFullSystemVaultBackup = exportFullSystemVaultBackup;
  window.restoreFullSystemVaultFromObject = restoreFullSystemVaultFromObject;
  window.triggerFullSystemVaultRestoreFilePicker = triggerFullSystemVaultRestoreFilePicker;
  window.pmgDisasterVault = {
    getLocalTodayIsoDate,
    getDeviceBackupTag,
    setDeviceBackupTag,
    saveDeviceBackupTagFromModal,
    writeMasterVaultSafely,
    pruneOldDailyAutoBackups,
    syncPatientReportsBinaryFolder,
    runDailyAutoBackupIfDue,
    requestPersistentBrowserStorage,
    buildFullSystemVaultBundle,
    exportFullSystemVaultBackup,
    restoreFullSystemVaultFromObject,
    triggerFullSystemVaultRestoreFilePicker
  };

  // Global singleton instance
  window.pmgOneDriveSync = new OneDriveSyncEngine();

  // Auto-init when DOM is ready (includes persistent storage request & Google Cloud auto-recovery if IT wiped browser storage!)
  const bootSyncEngine = () => {
    requestPersistentBrowserStorage().catch(() => {});
    window.pmgOneDriveSync.init();
    setTimeout(() => {
      try {
        window.syncAuditFromCloud?.();
        window.syncCommercialFromCloud?.();

        // If localStorage was cleared by HQ IT, automatically pull all non-patient operational modules from Google Cloud
        let pmgKeys = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || '';
          if (k.startsWith('pmg_') || k.startsWith('KS01_')) pmgKeys++;
        }
        if (!localStorage.getItem('pmg_last_google_cloud_sync') && pmgKeys <= 4) {
          console.log('[PMG Auto-Recovery] Empty browser storage detected after cleanup — restoring operational modules from Google Cloud…');
          window.triggerGoogleCloudEcosystemSync?.({ manual: false }).catch(() => {});
        }
      } catch (_) {}
    }, 2500);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSyncEngine);
  } else {
    bootSyncEngine();
  }
})(window);
