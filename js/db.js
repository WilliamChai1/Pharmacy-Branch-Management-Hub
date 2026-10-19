// js/db.js — IndexedDB Storage Engine for Large Documents & Attachments
'use strict';

const DB_NAME = 'PMG_HEALTH_DB';
const DB_VERSION = 2;
const STORE_DOCUMENTS = 'documents';
const STORE_APP_DATA = 'app_data';

let dbInstance = null;

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('patientId', 'patientId', { unique: false });
        docStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_APP_DATA)) {
        db.createObjectStore(STORE_APP_DATA);
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.error('IndexedDB open error:', e);
      reject(e);
    };
  });
}

// ─── SAVE DOCUMENT (FILE / BLOB) ─────────────────────────────────────────────
async function savePatientDocument(patientId, file, notes = '') {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const docId = 'DOC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const record = {
      id: docId,
      patientId: patientId,
      name: file.name || 'Lab_Report',
      type: file.type || 'application/octet-stream',
      size: file.size || 0,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      blob: file, // Store binary Blob directly in IndexedDB!
      notes: notes
    };

    const tx = db.transaction([STORE_DOCUMENTS], 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.add(record);

    req.onsuccess = () => resolve(record);
    req.onerror = (e) => reject(e);
  });
}

// ─── GET DOCUMENTS FOR A PATIENT ─────────────────────────────────────────────
async function getPatientDocuments(patientId) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCUMENTS], 'readonly');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const index = store.index('patientId');
    const req = index.getAll(patientId);

    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = (e) => reject(e);
  });
}

// ─── GET SINGLE DOCUMENT BY ID ───────────────────────────────────────────────
async function getDocumentById(docId) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCUMENTS], 'readonly');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.get(docId);

    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e);
  });
}

// ─── DELETE DOCUMENT ─────────────────────────────────────────────────────────
async function deletePatientDocument(docId) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCUMENTS], 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.delete(docId);

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e);
  });
}

// ─── HELPER: FORMAT BYTES ────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── BLOB <-> DATAURL HELPERS ────────────────────────────────────────────────
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// ─── EXPORT ALL DOCUMENTS (FOR PEN DRIVE BACKUP) ─────────────────────────────
async function exportAllDocuments() {
  const db = await openIndexedDB();
  return new Promise(async (resolve, reject) => {
    try {
      const tx = db.transaction([STORE_DOCUMENTS], 'readonly');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const req = store.getAll();

      req.onsuccess = async (e) => {
        const records = e.target.result || [];
        const exported = [];

        for (const rec of records) {
          let dataUrl = '';
          if (rec.blob) {
            try {
              dataUrl = await blobToDataURL(rec.blob);
            } catch (err) {
              console.warn('Failed to convert blob for doc:', rec.id, err);
            }
          }
          exported.push({
            id: rec.id,
            patientId: rec.patientId,
            name: rec.name,
            type: rec.type,
            size: rec.size,
            date: rec.date,
            createdAt: rec.createdAt,
            notes: rec.notes || '',
            dataUrl: dataUrl
          });
        }

        resolve(exported);
      };

      req.onerror = (e) => reject(e);
    } catch (err) {
      reject(err);
    }
  });
}

// ─── IMPORT / RESTORE ALL DOCUMENTS (FROM PEN DRIVE BACKUP) ──────────────────
async function importAllDocuments(docsList = []) {
  if (!Array.isArray(docsList) || docsList.length === 0) return 0;
  const db = await openIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCUMENTS], 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    let count = 0;

    for (const doc of docsList) {
      let blob = null;
      if (doc.dataUrl) {
        try {
          blob = dataURLtoBlob(doc.dataUrl);
        } catch (err) {
          console.warn('Failed to reconstruct blob for doc:', doc.id, err);
        }
      }

      const record = {
        id: doc.id,
        patientId: doc.patientId,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        date: doc.date,
        createdAt: doc.createdAt || new Date().toISOString(),
        blob: blob,
        notes: doc.notes || ''
      };

      store.put(record); // put overwrites or inserts
      count++;
    }

    tx.oncomplete = () => resolve(count);
    tx.onerror = (e) => reject(e);
  });
}

// ─── KEY-VALUE STORAGE ENGINE (LARGE DATASETS / ZERO QUOTA LIMITS) ───────────
function getIdbItem(key) {
  return new Promise(async (resolve) => {
    try {
      const db = await openIndexedDB();
      if (!db.objectStoreNames.contains(STORE_APP_DATA)) return resolve(null);
      const tx = db.transaction([STORE_APP_DATA], 'readonly');
      const store = tx.objectStore(STORE_APP_DATA);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    } catch (e) {
      console.warn('[PMG IDB] getIdbItem error:', e);
      resolve(null);
    }
  });
}

function setIdbItem(key, value) {
  return new Promise(async (resolve) => {
    try {
      const db = await openIndexedDB();
      if (!db.objectStoreNames.contains(STORE_APP_DATA)) return resolve(false);
      const tx = db.transaction([STORE_APP_DATA], 'readwrite');
      const store = tx.objectStore(STORE_APP_DATA);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn('[PMG IDB] setIdbItem error:', e);
        resolve(false);
      };
    } catch (e) {
      console.warn('[PMG IDB] setIdbItem exception:', e);
      resolve(false);
    }
  });
}

function removeIdbItem(key) {
  return new Promise(async (resolve) => {
    try {
      const db = await openIndexedDB();
      if (!db.objectStoreNames.contains(STORE_APP_DATA)) return resolve(false);
      const tx = db.transaction([STORE_APP_DATA], 'readwrite');
      const store = tx.objectStore(STORE_APP_DATA);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      console.warn('[PMG IDB] removeIdbItem exception:', e);
      resolve(false);
    }
  });
}

/**
 * Universal safe storage helper.
 * 1. Always persists complete data to IndexedDB (zero quota limits).
 * 2. Manages localStorage with safety guards (catches QuotaExceededError and prunes if oversized).
 */
async function safeStorageSet(key, value) {
  // Always persist to IndexedDB
  await setIdbItem(key, value);

  // Safely manage localStorage
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    // If payload is larger than 1.2MB, offload from localStorage to avoid exhausting quota
    if (serialized.length > 1200000) {
      try { localStorage.removeItem(key); } catch (_) {}
      return true;
    }
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[PMG Storage] LocalStorage quota exceeded for "${key}". Data is safely persisted in IndexedDB.`, err);
    try { localStorage.removeItem(key); } catch (_) {}
  }
  return true;
}

/**
 * Universal safe storage retrieval.
 * Tries IndexedDB first, falls back to localStorage.
 */
async function safeStorageGet(key) {
  try {
    const idbVal = await getIdbItem(key);
    if (idbVal !== null && idbVal !== undefined) return idbVal;
  } catch (_) {}

  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  return null;
}

/**
 * Proactively clean up oversized items from localStorage to relieve quota pressure.
 */
async function autoRelieveLocalStorageQuota() {
  try {
    // 1. Stock expiry data (can be 2.8MB+)
    const rawExpiry = localStorage.getItem('pmg_stock_expiry_data');
    if (rawExpiry && rawExpiry.length > 800000) {
      try {
        const parsed = JSON.parse(rawExpiry);
        await setIdbItem('pmg_stock_expiry_data', parsed);
        localStorage.removeItem('pmg_stock_expiry_data');
        console.log('[PMG Storage] Offloaded stock expiry data to IndexedDB to free localStorage quota.');
      } catch (_) {}
    }

    // 2. Patient data (can be 1MB+)
    const rawPatients = localStorage.getItem('pmg_patients_data_v1');
    if (rawPatients) {
      try {
        const parsed = JSON.parse(rawPatients);
        await setIdbItem('pmg_patients_data_v1', parsed);
        if (rawPatients.length > 1200000) {
          localStorage.removeItem('pmg_patients_data_v1');
          console.log('[PMG Storage] Offloaded large patients data to IndexedDB to free localStorage quota.');
        }
      } catch (_) {}
    }
  } catch (e) {
    console.warn('[PMG Storage] autoRelieveLocalStorageQuota warning:', e);
  }
}

// Run auto-relief on script load
if (typeof window !== 'undefined' && window.indexedDB) {
  setTimeout(() => {
    autoRelieveLocalStorageQuota().catch(() => {});
  }, 100);
}

// Expose on window for cross-module & OneDrive sync engine access
window.openIndexedDB = openIndexedDB;
window.exportAllDocuments = exportAllDocuments;
window.importAllDocuments = importAllDocuments;
window.dataURLtoBlob = dataURLtoBlob;
window.blobToDataURL = blobToDataURL;
window.savePatientDocument = savePatientDocument;
window.getPatientDocuments = getPatientDocuments;
window.getDocumentById = getDocumentById;
window.getIdbItem = getIdbItem;
window.setIdbItem = setIdbItem;
window.removeIdbItem = removeIdbItem;
window.safeStorageSet = safeStorageSet;
window.safeStorageGet = safeStorageGet;
window.autoRelieveLocalStorageQuota = autoRelieveLocalStorageQuota;

