// js/onedrive-sync.js — PMG OneDrive Folder Live Sync Engine (Multi-Branch & Multi-PC)
'use strict';

(function(window) {
  const DB_NAME = 'pmg_onedrive_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'handles';
  const HANDLE_KEY = 'pmg_onedrive_root_handle';

  // Recognized branch folders created in PMG OneDrive (Strictly the 7 Outlets Managed by AM)
  const KNOWN_BRANCH_FOLDERS = [
    'MATANG JAYA',
    'SUNGAI MOYAN',
    'MALIHAH',
    'METROCITY',
    'ASTANA',
    'SAMARIANG',
    'KOTA SENTOSA'
  ];

  // Mapping between branch codes/aliases and official OneDrive folder names
  const BRANCH_FOLDER_MAP = {
    // Matang Jaya
    'MATANG JAYA': 'MATANG JAYA',
    'MATANG': 'MATANG JAYA',
    'MJ01': 'MATANG JAYA',
    'PMG PHARMACY (MATANG JAYA) SDN BHD': 'MATANG JAYA',
    'PMG PHARMACY MATANG JAYA': 'MATANG JAYA',

    // Sungai Moyan
    'SUNGAI MOYAN': 'SUNGAI MOYAN',
    'MOYAN': 'SUNGAI MOYAN',
    'PMG PHARMACY (SUNGAI MOYAN) SDN BHD': 'SUNGAI MOYAN',
    'PMG PHARMACY SUNGAI MOYAN': 'SUNGAI MOYAN',

    // Malihah
    'MALIHAH': 'MALIHAH',
    'PMG PHARMACY (MALIHAH) SDN BHD': 'MALIHAH',
    'PMG PHARMACY MALIHAH': 'MALIHAH',

    // Metrocity
    'METROCITY': 'METROCITY',
    'PMG PHARMACY (METROCITY) SDN BHD': 'METROCITY',
    'PMG PHARMACY METROCITY': 'METROCITY',

    // Astana
    'ASTANA': 'ASTANA',
    'PMG PHARMACY (ASTANA) SDN BHD': 'ASTANA',
    'PMG PHARMACY ASTANA': 'ASTANA',

    // Samariang
    'SAMARIANG': 'SAMARIANG',
    'SEMARIANG': 'SAMARIANG',
    'PMG PHARMACY (SAMARIANG) SDN BHD': 'SAMARIANG',
    'PMG PHARMACY SAMARIANG': 'SAMARIANG',

    // Kota Sentosa
    'KS01': 'KOTA SENTOSA',
    'KOTA SENTOSA': 'KOTA SENTOSA',
    'PMG PHARMACY (KOTA SENTOSA) SDN BHD': 'KOTA SENTOSA',
    'PMG PHARMACY KOTA SENTOSA': 'KOTA SENTOSA'
  };

  // Reverse mapping from folder name to storage branch code
  const FOLDER_BRANCH_CODE_MAP = {
    'MATANG JAYA': 'MATANG JAYA',
    'MATANG': 'MATANG JAYA',
    'SUNGAI MOYAN': 'SUNGAI MOYAN',
    'MOYAN': 'SUNGAI MOYAN',
    'MALIHAH': 'MALIHAH',
    'METROCITY': 'METROCITY',
    'ASTANA': 'ASTANA',
    'SAMARIANG': 'SAMARIANG',
    'SEMARIANG': 'SAMARIANG',
    'KOTA SENTOSA': 'KS01',
    'KS01': 'KS01'
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
        // Connected to parent "Patient care" folder (Area Manager Master View)
        this.mode = 'PARENT';
        this.activeBranchFolder = this._resolveCurrentBranchName();
        this._updateBadge('CONNECTED', `OneDrive: Live (All 7 Outlets)`);
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

            // 2. Export local documents from IndexedDB
            const allLocalDocs = (typeof window.exportAllDocuments === 'function') ? await window.exportAllDocuments() : [];
            const localBranchDocs = allLocalDocs.filter(d => branchPatientIds.has(d.patientId));
            const localDocIdMap = new Map(localBranchDocs.map(d => [d.id, d]));

            // 3. Import missing cloud docs into local IndexedDB
            const docsToImport = cloudDocs.filter(cd => !localDocIdMap.has(cd.id));
            if (docsToImport.length > 0 && typeof window.importAllDocuments === 'function') {
              await window.importAllDocuments(docsToImport);
              console.log(`[PMG OneDrive Sync] Imported ${docsToImport.length} cloud patient document(s) into local IndexedDB for ${branchName}`);
            }

            // 4. Merge all documents
            const mergedDocsMap = new Map();
            cloudDocs.forEach(d => mergedDocsMap.set(d.id, d));
            localBranchDocs.forEach(d => mergedDocsMap.set(d.id, d));
            const finalMergedDocs = Array.from(mergedDocsMap.values());

            // 5. Write merged patient_documents.json back to OneDrive
            const docFileHandle = await dirHandle.getFileHandle('patient_documents.json', { create: true });
            const docWritable = await docFileHandle.createWritable();
            await docWritable.write(JSON.stringify({
              branch: branchName,
              lastSync: nowIso,
              count: finalMergedDocs.length,
              documents: finalMergedDocs
            }, null, 2));
            await docWritable.close();

            // 6. Write standalone report files into Patient_Reports folder for easy opening in Windows File Explorer
            try {
              const reportsFolder = await dirHandle.getDirectoryHandle('Patient_Reports', { create: true });
              for (const doc of finalMergedDocs) {
                if (doc.dataUrl && typeof window.dataURLtoBlob === 'function') {
                  try {
                    const safeName = `${doc.patientId}_${(doc.name || 'report.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                    let fileExists = false;
                    try {
                      await reportsFolder.getFileHandle(safeName, { create: false });
                      fileExists = true;
                    } catch (_) { fileExists = false; }

                    if (!fileExists) {
                      const blob = window.dataURLtoBlob(doc.dataUrl);
                      const reportFileHandle = await reportsFolder.getFileHandle(safeName, { create: true });
                      const rw = await reportFileHandle.createWritable();
                      await rw.write(blob);
                      await rw.close();
                    }
                  } catch (fErr) {
                    console.warn('[PMG OneDrive Sync] Individual file write skipped:', fErr);
                  }
                }
              }
            } catch (dirErr) {
              console.warn('[PMG OneDrive Sync] Patient_Reports directory write error:', dirErr);
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
          let allReturns = [];
          if (typeof window.pmgReturns !== 'undefined' && typeof window.pmgReturns.getReturnsData === 'function') {
            allReturns = window.pmgReturns.getReturnsData() || [];
          } else {
            const rawReturns = localStorage.getItem('pmg_returns_records_v1');
            if (rawReturns) allReturns = JSON.parse(rawReturns);
          }
          if (Array.isArray(allReturns) && allReturns.length > 0) {
            for (const branchName of syncedBranches) {
              const branchReturns = allReturns.filter(r => (r.branch || '').toUpperCase() === branchName.toUpperCase());
              await this.saveReturnsDatabaseToOneDrive(branchName, branchReturns);
            }
            returnsSyncedCount = allReturns.length;
          }
        } catch (returnsErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Returns warning:', returnsErr);
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
            const rawSkus = localStorage.getItem('pmg_pricing_skus_master_v1');
            if (rawSkus) skus = JSON.parse(rawSkus);
          }
          if (skus && skus.length > 0) {
            await this.savePricingMasterToOneDrive(skus);
            pricingSyncedCount = skus.length;
          }
        } catch (pricingErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Pricing warning:', pricingErr);
        }

        // ─── STEP J: UNIVERSAL SYNC — STOCK EXPIRY & DISPOSAL TRACKER ──────────
        try {
          const rawExpiry = localStorage.getItem('pmg_stock_expiry_data') || localStorage.getItem('pmg_expiry_entries_v1');
          if (rawExpiry && this.rootHandle) {
            let expDir = this.rootHandle;
            try {
              expDir = await this.rootHandle.getDirectoryHandle('EXPIRY_BACKUP', { create: true });
            } catch (_) { expDir = this.rootHandle; }
            const expHandle = await expDir.getFileHandle('stock_expiry_master.json', { create: true });
            const expW = await expHandle.createWritable();
            await expW.write(rawExpiry);
            await expW.close();
          }
        } catch (expErr) {
          console.warn('[PMG OneDrive Sync] Universal sync: Expiry warning:', expErr);
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
          branches: syncedBranches,
          returnsCount: returnsSyncedCount,
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

        // Step 3: Update global in-memory patientsData and localStorage
        if (typeof patientsData !== 'undefined') {
          const otherPatients = patientsData.filter(p => !this._patientMatchesBranch(p, targetBranch));
          patientsData = [...otherPatients, ...mergedBranchPatients];
          if (typeof PATIENTS_STORAGE_KEY !== 'undefined') {
            localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
          }
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

        // Step 1: Read existing cloud returns to ensure conflict-free merge
        let cloudReturns = [];
        try {
          const existingHandle = await branchDir.getFileHandle('returns_credit_notes.json', { create: false });
          const ef = await existingHandle.getFile();
          const et = await ef.text();
          if (et && et.trim()) {
            const ep = JSON.parse(et);
            if (Array.isArray(ep.returns)) cloudReturns = ep.returns;
          }
        } catch (_) {}

        // Step 2: Merge returns by ID
        const returnMap = new Map();
        (cloudReturns || []).forEach(r => { if (r && r.id) returnMap.set(r.id, r); });
        (returnsData || []).forEach(r => { if (r && r.id) returnMap.set(r.id, r); });
        const mergedReturns = Array.from(returnMap.values());

        const payload = {
          branch: bFolder,
          lastUpdated: new Date().toISOString(),
          updatedBy: session?.displayName || 'Staff',
          returns: mergedReturns
        };

        const fileHandle = await branchDir.getFileHandle('returns_credit_notes.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        console.log(`[PMG OneDrive Sync] Saved returns_credit_notes.json to OneDrive for ${bFolder}`);
        return true;
      } catch (err) {
        console.warn(`[PMG OneDrive Sync] Could not save returns DB to OneDrive for ${bFolder}:`, err);
        return false;
      }
    }

    // ─── LOAD RETURNS / CN DATABASE (JSON) FROM ONEDRIVE ─────────────────────
    async loadReturnsDatabaseFromOneDrive(branchName) {
      if (!this.rootHandle || this.mode === 'DISCONNECTED') return null;
      const bFolder = BRANCH_FOLDER_MAP[(branchName || '').toUpperCase()] || this._resolveCurrentBranchName() || 'KOTA SENTOSA';
      const branchDir = await this._getTargetBranchDirectoryHandle(bFolder);
      if (!branchDir) return null;

      try {
        const hasPerm = await this._verifyPermission(this.rootHandle, false, false);
        if (!hasPerm) return null;

        const fileHandle = await branchDir.getFileHandle('returns_credit_notes.json');
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        console.log(`[PMG OneDrive Sync] Loaded returns_credit_notes.json from OneDrive (${parsed.returns?.length || 0} records)`);
        return parsed.returns || [];
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
          updatedBy: session?.displayName || 'Area Manager Chai Yee Sian (William)',
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
        return parsed.skus || [];
      } catch (e) {
        return null;
      }
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
              localStorage.setItem(`pmg_pharmacist_schedule_${bCode}`, JSON.stringify(cloudSched));
              console.log(`[PMG OneDrive Sync] Auto-updated schedule for ${bCode} from OneDrive`);
            }
          }
        } catch (_) {}

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

          // Merge appointments by id safely (preserve Completed/Missed terminal status)
          const aptMap = new Map();
          (localP.appointments || []).forEach(a => aptMap.set(a.id || `${a.date}_${a.time}`, a));
          (cloudP.appointments || []).forEach(cloudApt => {
            const key = cloudApt.id || `${cloudApt.date}_${cloudApt.time}`;
            if (!aptMap.has(key)) {
              aptMap.set(key, cloudApt);
            } else {
              const localApt = aptMap.get(key);
              const localIsTerminal = localApt.status === 'Completed' || localApt.status === 'Missed' || localApt.status === 'Cancelled';
              const cloudIsTerminal = cloudApt.status === 'Completed' || cloudApt.status === 'Missed' || cloudApt.status === 'Cancelled';
              if (localIsTerminal && !cloudIsTerminal) {
                // Keep local completed/missed appointment
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
          });
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
        fb.className = 'p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1.5';
        fb.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-emerald-700">
            <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i> Universal OneDrive Sync Complete!
          </div>
          <div class="text-[11px] text-emerald-800 space-y-1">
            <div>• <b>Target:</b> ${escapeSyncHtml(res.branch)} &bull; <b>Time:</b> ${res.time}</div>
            <div class="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-emerald-900 font-medium">
              <div>✓ <b>Patient Care:</b> ${res.count} records</div>
              <div>✓ <b>Job Applications:</b> ${res.recruitmentCount || 0} applicants</div>
              <div>✓ <b>Credit Notes & DO:</b> ${res.returnsCount || 0} records</div>
              <div>✓ <b>Pricing SKUs:</b> ${res.pricingCount || 0} master items</div>
              <div>✓ <b>Schedules:</b> Working hours synced</div>
              <div>✓ <b>Stock Expiry:</b> Disposition logs synced</div>
            </div>
          </div>
          <div class="text-[10px] text-emerald-700 mt-1 font-medium">
            All records across the entire PMG Management Hub are synchronized with your OneDrive folder.
          </div>
        `;
        fb.classList.remove('hidden');
      }

      showPmgToast(`✅ Universal OneDrive Synced (${res.branch} at ${res.time})`, 'success');

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
