// js/db.js — IndexedDB Storage Engine for Large Documents & Attachments
'use strict';

const DB_NAME = 'PMG_HEALTH_DB';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';

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
