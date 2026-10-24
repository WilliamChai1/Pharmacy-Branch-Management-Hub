// js/expiry.js — Module 5: Stock Expiry Tracker & OCR Extraction Engine
'use strict';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const PMG_EXPIRY_API_URL = window.PMG_EXPIRY_API_URL || 'https://script.google.com/macros/s/AKfycbyp0uv8uw2ckUJ9eoq16o10Z0v-4c-ToQpuSwLXXwHpW9dnmw1OVll9gzhCmdwFaJIBTA/exec';
const EXPIRY_STORAGE_KEY = 'pmg_stock_expiry_data';
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ─── MULTI-TIER GEMINI AI CONFIGURATION ───────────────────────────────────────
// Primary: gemini-3.5-flash-lite (15 RPM / 500 RPD — fast invoice OCR)
// Secondary: gemini-3.1-flash-lite (15 RPM / 500 RPD — high quota fallback)
// Tertiary: gemini-3.5-flash (5 RPM / 20 RPD — complex multi-column invoice reasoning)
const EXPIRY_OCR_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const EXPIRY_OCR_SECONDARY_MODEL = 'gemini-3.1-flash-lite';
const EXPIRY_OCR_TERTIARY_MODEL  = 'gemini-3.5-flash';
const PMG_GLOBAL_FALLBACK_KEY    = ''; // Revoked/leaked fallback key neutralized

// ─── STATE ────────────────────────────────────────────────────────────────────
const HQ_RETURN_POLICY_STORAGE_KEY = 'pmg_hq_return_policy_data';
const HQ_RETURN_SHEET_URL_STORAGE_KEY = 'pmg_hq_return_sheet_url';
let hqReturnPolicyList = [];
let hqReturnPolicyCodeMap = new Map();
let hqReturnPolicyDescMap = new Map();

let expiryItems = [];
let pendingOcrItems = [];
let activeExpiryFilter = {
  branch: 'Kota Sentosa',
  horizon: '9months', // '9months', '12months', 'critical', 'all', 'cleared'
  returnPolicy: 'all', // 'all', 'non_returnable', 'returnable', 'special', 'unlisted'
  actionPlan: 'all', // 'all', 'blank', or specific action plan
  search: '',
  sortOrder: 'asc' // 'asc' (earliest expiry first) | 'desc' (latest expiry first)
};
let expiryCurrentPage = 1;
const EXPIRY_PAGE_SIZE = 100;

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBranchCode(code) {
  if (!code) return 'Kota Sentosa';
  const str = String(code).trim();
  const clean = str.toUpperCase().replace(/[\s\-_\(\)\[\]]/g, '');
  if (clean.includes('SENTOSA') || clean.includes('KS01') || clean.includes('PQ0147') || clean === 'KS' || clean === 'ALL' || clean === 'ALLBRANCHES') {
    return 'Kota Sentosa';
  }
  return str;
}

// ─── PERSISTENT CLEARED / DONE EXPIRY TOMBSTONES ─────────────────────────────
const EXPIRY_CLEARED_KEYS_KEY = 'pmg_cleared_expiry_keys';

function getClearedExpiryKeys() {
  try {
    const raw = localStorage.getItem(EXPIRY_CLEARED_KEYS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (_) {
    return new Set();
  }
}

function addClearedExpiryKey(key) {
  if (!key) return;
  try {
    const set = getClearedExpiryKeys();
    set.add(String(key).trim().toUpperCase());
    localStorage.setItem(EXPIRY_CLEARED_KEYS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('[PMG Expiry] Error saving cleared expiry key:', e);
  }
}

function removeClearedExpiryKey(key) {
  if (!key) return;
  try {
    const set = getClearedExpiryKeys();
    set.delete(String(key).trim().toUpperCase());
    localStorage.setItem(EXPIRY_CLEARED_KEYS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('[PMG Expiry] Error removing cleared expiry key:', e);
  }
}

function isItemMarkedDoneOrCleared(item, clearedKeysSet = null) {
  if (!item) return false;
  const statusUpper = String(item.status || '').trim().toUpperCase();
  if (statusUpper === 'DONE' || statusUpper === 'COMPLETED' || statusUpper === 'CLEARED' || item.quantity === 0) {
    return true;
  }
  const set = clearedKeysSet || getClearedExpiryKeys();
  const codeUpper = String(item.itemCode || '').trim().toUpperCase();
  if (codeUpper && codeUpper !== 'N/A' && set.has(codeUpper)) return true;
  const rId = item.rowId !== undefined && item.rowId !== null ? String(item.rowId).trim() : '';
  if (rId && rId !== 'undefined' && rId !== 'null' && set.has(`ROW_${rId}`.toUpperCase())) return true;
  const itemKey = typeof getExpiryItemKey === 'function' ? getExpiryItemKey(item) : '';
  if (itemKey && set.has(itemKey.toUpperCase())) return true;
  // Also check legacy 3-part key (BRANCH|CODE|BATCH)
  if (codeUpper && codeUpper !== 'N/A') {
    const b = (item.branch || 'Kota Sentosa').trim().toUpperCase();
    const bt = (item.batchNumber || '').trim().toUpperCase();
    const legacyBatchKey = (bt && bt !== 'N/A') ? bt : 'NO_BATCH';
    if (set.has(`${b}|${codeUpper}|${legacyBatchKey}`)) return true;
  }
  return false;
}

// ─── UNIQUE ROW IDENTITY, NORMALIZATION & DATA HEALING ENGINE ──────────────
function normalizeProductCode(c) {
  if (!c) return '';
  const s = String(c).trim().toUpperCase();
  if (s === 'N/A' || s === 'NONE' || s === '-' || s === 'UNKNOWN') return '';
  return s.replace(/^0+(?=\d)/, '');
}

function normalizeProductDesc(d) {
  if (!d) return '';
  return String(d).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeBatchNumber(b) {
  if (!b) return '';
  const s = String(b).trim().toUpperCase();
  if (s === 'N/A' || s === 'NONE' || s === '-' || s === 'NO_BATCH' || s === 'NO BATCH') return '';
  return s.replace(/[^A-Z0-9]/g, '');
}

function getCanonicalExpiryDate(dateVal) {
  if (!dateVal) return '';
  const parsed = parseExpiryDate(dateVal);
  if (!parsed) {
    const s = String(dateVal).trim();
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
    }
    return s.toUpperCase();
  }
  return formatExpiryDateDisplay(parsed);
}

function areExpiryItemsSameProductAndBatch(a, b) {
  if (!a || !b) return false;
  const bA = (a.branch || 'Kota Sentosa').trim().toUpperCase();
  const bB = (b.branch || 'Kota Sentosa').trim().toUpperCase();
  if (bA !== bB) return false;

  const cA = normalizeProductCode(a.itemCode);
  const cB = normalizeProductCode(b.itemCode);
  const dA = normalizeProductDesc(a.itemDescription);
  const dB = normalizeProductDesc(b.itemDescription);

  let productMatches = false;
  if (cA && cB) {
    productMatches = (cA === cB);
  } else if (dA && dB) {
    productMatches = (dA === dB || (dA.length >= 8 && dB.length >= 8 && (dA.startsWith(dB) || dB.startsWith(dA))));
  }
  if (!productMatches) return false;

  const btA = normalizeBatchNumber(a.batchNumber);
  const btB = normalizeBatchNumber(b.batchNumber);
  if (btA !== btB) return false;

  const expA = getCanonicalExpiryDate(a.expiryDate);
  const expB = getCanonicalExpiryDate(b.expiryDate);
  if (expA !== expB) return false;

  return true;
}

function consolidatePendingOcrItems(items) {
  if (!Array.isArray(items) || items.length <= 1) return items || [];
  const map = new Map();
  items.forEach(it => {
    const b = (it.branch || 'Kota Sentosa').trim().toUpperCase();
    const c = normalizeProductCode(it.itemCode);
    const d = normalizeProductDesc(it.itemDescription);
    const bt = normalizeBatchNumber(it.batchNumber);
    const exp = getCanonicalExpiryDate(it.expiryDate);
    const pKey = c ? `C_${c}` : `D_${d.slice(0, 30)}`;
    const groupKey = `${b}|${pKey}|${bt || 'NO_BATCH'}|${exp}`;

    if (!map.has(groupKey)) {
      map.set(groupKey, { ...it, quantity: Number(it.quantity) || 1 });
    } else {
      const existing = map.get(groupKey);
      existing.quantity = (Number(existing.quantity) || 0) + (Number(it.quantity) || 1);
      if (it.sourceFile && !String(existing.sourceFile || '').includes(it.sourceFile)) {
        existing.sourceFile = `${existing.sourceFile || ''}, ${it.sourceFile}`.replace(/^,\s*/, '');
      }
      if (it.autoCorrected) existing.autoCorrected = true;
      if (it.isShortDated) existing.isShortDated = true;
    }
  });
  return Array.from(map.values());
}

function healAndConsolidateExpiryItems(items) {
  if (!Array.isArray(items) || items.length === 0) return items || [];

  const clearedSet = getClearedExpiryKeys();

  // Enforce guaranteed tombstones for known obsolete/cleared items across computers
  const guaranteedTombstones = [
    '14', 'ROW_14', 'ROW_1815', 'ROW_3675', 'ROW_3676', 'ROW_3678',
    'ROW_1818', 'ROW_3383',
    'KOTA SENTOSA|123590|NO_BATCH_12/11/2026_YUMMY BITES (APPLE)|12/11/2026',
    'KOTA SENTOSA|123590|NO_BATCH_12/10/2026_YUMMY BITES (APPLE)|12/10/2026',
    'KOTA SENTOSA|145662|612125-A|30/11/2026',
    'KOTA SENTOSA|145662|612125A|30/11/2026'
  ];
  guaranteedTombstones.forEach(k => {
    addClearedExpiryKey(k);
    clearedSet.add(k);
  });
  removeClearedExpiryKey('17');
  removeClearedExpiryKey('ROW_17');

  const resultMap = new Map();

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;

    const rId = String(it.rowId || '').trim();
    if (rId && (clearedSet.has(rId) || clearedSet.has(`ROW_${rId}`))) {
      it.status = 'DONE';
      it.quantity = 0;
    }

    const descUpper = String(it.itemDescription || '').toUpperCase();
    const expCanon = getCanonicalExpiryDate(it.expiryDate);

    // Rule A: Yummy Bites Apple Nov 2026 or Oct 2026 is obsolete / DONE
    if (/YUMMY BITES.*APPLE/i.test(descUpper) && (expCanon === '12/11/2026' || expCanon === '12/10/2026')) {
      it.status = 'DONE';
      it.quantity = 0;
    }

    // Rule B: Athomer Mini Propolis batch 612125-A with 30/11/2026 is obsolete / DONE
    const btNorm = normalizeBatchNumber(it.batchNumber);
    if (/ATHOMER.*PROPOLIS/i.test(descUpper) && btNorm === '612125A' && expCanon === '30/11/2026') {
      it.status = 'DONE';
      it.quantity = 0;
    }

    // General consolidation:
    // When multiple records share the EXACT same branch, product, batch, and canonical expiry date:
    // Add quantities together and merge them!
    const b = (it.branch || 'Kota Sentosa').trim().toUpperCase();
    const c = normalizeProductCode(it.itemCode);
    const d = normalizeProductDesc(it.itemDescription);
    const bt = normalizeBatchNumber(it.batchNumber);
    const isDone = (it.status === 'DONE' || it.status === 'Cleared' || Number(it.quantity) === 0);

    const groupKey = `${b}|${c ? 'C_' + c : 'D_' + d.slice(0, 30)}|${bt || 'NO_BATCH'}|${expCanon}|${isDone ? 'DONE' : 'ACTIVE'}`;

    if (!resultMap.has(groupKey)) {
      resultMap.set(groupKey, it);
    } else {
      const existing = resultMap.get(groupKey);
      if (!isDone) {
        // Active duplicate: sum quantities!
        existing.quantity = (Number(existing.quantity) || 0) + (Number(it.quantity) || 0);
        if (it.sourceFile && !String(existing.sourceFile || '').includes(it.sourceFile)) {
          existing.sourceFile = `${existing.sourceFile || ''}, ${it.sourceFile}`.replace(/^,\s*/, '');
        }
        if (it.lastUpdated && (!existing.lastUpdated || it.lastUpdated > existing.lastUpdated)) {
          existing.lastUpdated = it.lastUpdated;
          if (it.updatedBy) existing.updatedBy = it.updatedBy;
        }
      }
    }
  }

  return Array.from(resultMap.values());
}

function getExpiryRowUid(it, fallbackIdx = '') {
  if (!it) return '';
  if (it.rowId !== undefined && it.rowId !== null) {
    const s = String(it.rowId).trim();
    if (s !== '' && s !== 'undefined' && s !== 'null' && s !== 'NaN') return s;
  }
  if (it.tempId !== undefined && it.tempId !== null) {
    const t = String(it.tempId).trim();
    if (t !== '' && t !== 'undefined' && t !== 'null') return t;
  }
  const b = String(it.branch || 'KS').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const c = String(it.itemCode || 'NA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const bt = String(it.batchNumber || 'NB').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const exp = String(it.expiryDate || 'NE').replace(/[^a-zA-Z0-9]/g, '');
  const desc = String(it.itemDescription || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
  return `EXP_${b}_${c}_${bt}_${exp}_${desc}${fallbackIdx !== '' ? '_' + fallbackIdx : ''}`;
}

function findExpiryItemById(rowId) {
  if (rowId === undefined || rowId === null) return null;
  if (typeof rowId === 'object') return rowId;
  const target = String(rowId).trim();
  if (!target || target === 'undefined' || target === 'null' || target === 'NaN') return null;
  return expiryItems.find(it => {
    if (!it) return false;
    if (it.rowId !== undefined && it.rowId !== null && String(it.rowId).trim() === target) return true;
    if (it.tempId !== undefined && it.tempId !== null && String(it.tempId).trim() === target) return true;
    return getExpiryRowUid(it) === target;
  }) || null;
}

function ensureUniqueExpiryRowIds(itemsArray) {
  if (!Array.isArray(itemsArray)) return [];

  // 1. Filter out synthetic test items (TEST-0..TEST-999 / Test Product 0..999)
  const cleaned = itemsArray.filter(it => {
    if (!it) return false;
    const code = String(it.itemCode || '').trim();
    const desc = String(it.itemDescription || '').trim();
    if (/^TEST-\d+$/i.test(code) && /^Test Product \d+$/i.test(desc)) return false;
    return true;
  });

  // 2. Auto-heal misplaced Galvus Met 50/500 (expiry 03/2027) clearance promo that landed on 195 ENO BOTTLE (expiry 10/2028)
  const enoMisplaced = cleaned.find(it =>
    String(it.itemCode || '').trim() === '21022327' &&
    String(it.itemDescription || '').toUpperCase().includes('ENO BOTTLE') &&
    (Number(it.offeredPrice) === 115.5 || Number(it.normalPrice) === 128 || (String(it.expiryDate || '').includes('2028') && String(it.actionPlan || '').toLowerCase().includes('clearance')))
  );
  const galvus0327 = cleaned.find(it => {
    const codeNorm = String(it.itemCode || '').trim().replace(/^0+/, '');
    const descUp = String(it.itemDescription || '').toUpperCase();
    const expStr = String(it.expiryDate || '').trim();
    return (codeNorm === '11090' || (descUp.includes('GALVUS') && descUp.includes('50/500'))) &&
           (expStr.includes('03/2027') || expStr.includes('3/2027') || expStr.includes('2027-03'));
  });

  if (galvus0327 && enoMisplaced) {
    if (!galvus0327.offeredPrice) {
      const offPrice = Number(enoMisplaced.offeredPrice) || 115.5;
      galvus0327.offeredPrice = offPrice;
      galvus0327.clearancePrice = offPrice;
      galvus0327.normalPrice = Number(enoMisplaced.normalPrice) || 128;
      galvus0327.actionPlan = `Clearance Promo (Offer: RM ${offPrice.toFixed(2)})`;
      galvus0327.tagTheme = enoMisplaced.tagTheme || 'neon';
      galvus0327.tagSize = enoMisplaced.tagSize || 'compact';
      galvus0327.tagPrintTarget = enoMisplaced.tagPrintTarget || 'a4';
      galvus0327.promoBanner = enoMisplaced.promoBanner || '🔥 CLEARANCE SALE';
      galvus0327.promoRemark = enoMisplaced.promoRemark || '* While Stocks Last · Short Expiry Deal';
      galvus0327.showBarcode = false;
      galvus0327.pricingUpdatedAt = enoMisplaced.pricingUpdatedAt || new Date().toISOString();
      galvus0327.lastUpdated = new Date().toISOString();
    }
    delete enoMisplaced.offeredPrice;
    delete enoMisplaced.clearancePrice;
    delete enoMisplaced.normalPrice;
    delete enoMisplaced.actionPlan;
    delete enoMisplaced.tagTheme;
    delete enoMisplaced.tagSize;
    delete enoMisplaced.tagPrintTarget;
    delete enoMisplaced.promoBanner;
    delete enoMisplaced.promoRemark;
    delete enoMisplaced.pricingUpdatedAt;
  }

  // 3. Heal and consolidate duplicate items sharing the same branch, product, batch, and canonical expiry
  const healed = healAndConsolidateExpiryItems(cleaned);

  // 4. Assign guaranteed-unique deterministic rowId to every item
  const usedIds = new Set();
  healed.forEach((it, idx) => {
    const rawId = it.rowId !== undefined && it.rowId !== null ? String(it.rowId).trim() : '';
    const isValidRaw = rawId !== '' && rawId !== 'undefined' && rawId !== 'null' && rawId !== 'NaN';
    if (isValidRaw && !usedIds.has(rawId)) {
      usedIds.add(rawId);
      return;
    }

    let candidate = '';
    const rawTemp = it.tempId !== undefined && it.tempId !== null ? String(it.tempId).trim() : '';
    if (rawTemp && rawTemp !== 'undefined' && rawTemp !== 'null' && !usedIds.has(rawTemp)) {
      candidate = rawTemp;
    } else {
      const b = String(it.branch || 'KS').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const c = String(it.itemCode || 'NA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const bt = String(it.batchNumber || 'NB').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const exp = String(it.expiryDate || 'NE').replace(/[^a-zA-Z0-9]/g, '');
      const desc = String(it.itemDescription || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
      const base = `EXP_${isValidRaw ? rawId + '_' : ''}${b}_${c}_${bt}_${exp}_${desc}`;
      candidate = base;
      let suffix = 1;
      while (usedIds.has(candidate)) {
        candidate = `${base}_${idx}_${suffix++}`;
      }
    }
    it.rowId = candidate;
    usedIds.add(String(candidate));
  });

  return healed;
}
window.ensureUniqueExpiryRowIds = ensureUniqueExpiryRowIds;

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
function initExpiryModule() {
  initHqReturnPolicy();
  loadLocalExpiryData();
  setupExpiryEventListeners();
  renderExpiryUI();
  updateAccountsShareUi(document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa');

  // Asynchronously hydrate from IndexedDB (preserves complete expiry dataset without localStorage quota limits)
  if (typeof safeStorageGet === 'function') {
    safeStorageGet(EXPIRY_STORAGE_KEY).then(idbItems => {
      if (Array.isArray(idbItems) && idbItems.length > 0) {
        if (!expiryItems || expiryItems.length < idbItems.length) {
          expiryItems = ensureUniqueExpiryRowIds(idbItems);
          renderExpiryUI();
        }
      }
    }).catch(console.warn);
  }
  
  // Immediately synchronize with OneDrive if folder is connected
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.syncStockExpiryWithOneDrive === 'function') {
    window.pmgOneDriveSync.syncStockExpiryWithOneDrive(true).catch(console.warn);
  }

  // Fetch fresh data from Google Sheet in background
  syncExpiryFromSheets(false);
}

function loadLocalExpiryData() {
  // Ensure default cleared SKUs and records are in persistent tombstone
  addClearedExpiryKey('119253');
  addClearedExpiryKey('ROW_6951');
  addClearedExpiryKey('KOTA SENTOSA|119253|NO_BATCH');
  addClearedExpiryKey('232903');
  addClearedExpiryKey('ROW_321');
  addClearedExpiryKey('KOTA SENTOSA|232903|DLVL');
  addClearedExpiryKey('102787');
  addClearedExpiryKey('ROW_7076');
  addClearedExpiryKey('ROW_7109');
  addClearedExpiryKey('KOTA SENTOSA|102787|5F01097');
  addClearedExpiryKey('KOTA SENTOSA|102787|5H04819');
  addClearedExpiryKey('14');
  addClearedExpiryKey('ROW_14');
  addClearedExpiryKey('ROW_1815');
  addClearedExpiryKey('ROW_3675');
  addClearedExpiryKey('ROW_3676');
  addClearedExpiryKey('ROW_3678');
  addClearedExpiryKey('ROW_1818');
  addClearedExpiryKey('ROW_3383');
  addClearedExpiryKey('KOTA SENTOSA|123590|NO_BATCH_12/11/2026_YUMMY BITES (APPLE)|12/11/2026');
  addClearedExpiryKey('KOTA SENTOSA|123590|NO_BATCH_12/10/2026_YUMMY BITES (APPLE)|12/10/2026');
  addClearedExpiryKey('KOTA SENTOSA|145662|612125-A|30/11/2026');
  addClearedExpiryKey('KOTA SENTOSA|145662|612125A|30/11/2026');

  // Remove accidental 'N/A' or 'ROW_UNDEFINED' tombstones if any were ever stored
  removeClearedExpiryKey('N/A');
  removeClearedExpiryKey('ROW_UNDEFINED');
  removeClearedExpiryKey('ROW_NULL');
  removeClearedExpiryKey('17');
  removeClearedExpiryKey('ROW_17');

  try {
    const raw = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (raw) {
      expiryItems = JSON.parse(raw);
    }
    // If local storage is empty or only had small preliminary test items, seed with full Kota Sentosa master dataset
    if ((!expiryItems || expiryItems.length < 500) && Array.isArray(window.PMG_SEED_EXPIRY_DATA) && window.PMG_SEED_EXPIRY_DATA.length > 0) {
      console.log(`[PMG Expiry] Preloading ${window.PMG_SEED_EXPIRY_DATA.length} master seed records for Kota Sentosa...`);
      expiryItems = window.PMG_SEED_EXPIRY_DATA;
    }

    expiryItems = ensureUniqueExpiryRowIds(expiryItems);

    // Strictly enforce DONE / Cleared status on any items in tombstone set
    const clearedSet = getClearedExpiryKeys();
    if (Array.isArray(expiryItems)) {
      expiryItems.forEach(it => {
        if (isItemMarkedDoneOrCleared(it, clearedSet)) {
          it.status = 'DONE';
          it.quantity = 0;
        }
      });
    }
    saveLocalExpiryData();
  } catch (e) {
    console.warn('[PMG Expiry] Error reading local expiry data:', e);
    if (Array.isArray(window.PMG_SEED_EXPIRY_DATA)) {
      expiryItems = ensureUniqueExpiryRowIds(window.PMG_SEED_EXPIRY_DATA);
    } else {
      expiryItems = [];
    }
  }
}

function saveLocalExpiryData() {
  try {
    expiryItems = ensureUniqueExpiryRowIds(expiryItems);
    if (typeof safeStorageSet === 'function') {
      safeStorageSet(EXPIRY_STORAGE_KEY, expiryItems);
    } else {
      localStorage.setItem(EXPIRY_STORAGE_KEY, JSON.stringify(expiryItems));
    }
  } catch (e) {
    console.warn('[PMG Expiry] Error saving local expiry data:', e);
  }
}

// ─── HQ RETURN POLICY ENGINE (LIVE GOOGLE SHEET CROSS-REFERENCE) ───────────────
function initHqReturnPolicy() {
  try {
    const raw = localStorage.getItem(HQ_RETURN_POLICY_STORAGE_KEY);
    if (raw) {
      hqReturnPolicyList = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[PMG Expiry] Error reading stored HQ policy data:', e);
  }

  // If local storage is empty or contains old Poison-only seed (< 2000 items), upgrade to multi-category master seed
  if ((!hqReturnPolicyList || !Array.isArray(hqReturnPolicyList) || hqReturnPolicyList.length < 2000) && Array.isArray(window.PMG_HQ_RETURN_POLICY_SEED)) {
    hqReturnPolicyList = window.PMG_HQ_RETURN_POLICY_SEED;
    try {
      localStorage.setItem(HQ_RETURN_POLICY_STORAGE_KEY, JSON.stringify(hqReturnPolicyList));
    } catch (e) {}
  }

  try {
    const rawVendors = localStorage.getItem('pmg_hq_direct_vendors');
    if (rawVendors) {
      window.PMG_HQ_DIRECT_VENDORS = JSON.parse(rawVendors);
    }
  } catch (e) {}

  buildHqReturnPolicyMaps();
  updateHqPolicyHeaderBadge();
}

function buildHqReturnPolicyMaps() {
  hqReturnPolicyCodeMap.clear();
  hqReturnPolicyDescMap.clear();

  if (!Array.isArray(hqReturnPolicyList)) return;

  for (const item of hqReturnPolicyList) {
    if (!item) continue;
    const code = String(item.code || '').trim();
    if (code && code !== 'N/A') {
      hqReturnPolicyCodeMap.set(code, item);
      const stripped = code.replace(/^0+/, '');
      if (stripped && !hqReturnPolicyCodeMap.has(stripped)) {
        hqReturnPolicyCodeMap.set(stripped, item);
      }
    }
    const desc = String(item.desc || '').trim().toUpperCase();
    if (desc) {
      if (!hqReturnPolicyDescMap.has(desc)) {
        hqReturnPolicyDescMap.set(desc, item);
      }
    }
  }
}

function updateHqPolicyHeaderBadge() {
  const pill = document.getElementById('hqReturnStatusCountPill');
  const modalBadge = document.getElementById('modalHqPolicyCountBadge');
  const lastSyncEl = document.getElementById('hqReturnLastSyncTime');

  const count = Array.isArray(hqReturnPolicyList) ? hqReturnPolicyList.length : 0;
  if (pill) pill.textContent = `${count} Rules Active (All Categories)`;
  if (modalBadge) modalBadge.textContent = `${count} Items`;

  const lastSync = localStorage.getItem('pmg_hq_return_last_sync');
  if (lastSyncEl && lastSync) {
    try {
      const d = new Date(lastSync);
      lastSyncEl.textContent = `Synced: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      lastSyncEl.textContent = 'Live Google Sheet (Multi-Tab)';
    }
  }
}

function getHqPolicyForItem(it) {
  if (!it) return null;
  const code = String(it.itemCode || '').trim();
  if (code && code !== 'N/A') {
    if (hqReturnPolicyCodeMap.has(code)) return hqReturnPolicyCodeMap.get(code);
    const stripped = code.replace(/^0+/, '');
    if (stripped && hqReturnPolicyCodeMap.has(stripped)) return hqReturnPolicyCodeMap.get(stripped);
  }
  const desc = String(it.itemDescription || '').trim().toUpperCase();
  if (desc && hqReturnPolicyDescMap.has(desc)) return hqReturnPolicyDescMap.get(desc);

  return null;
}

function getItemHqReturnStatus(it) {
  const pol = getHqPolicyForItem(it);
  if (!pol) return 'UNLISTED';
  return String(pol.status || 'NON-RETURNABLE').trim().toUpperCase();
}

function renderHqReturnPolicyBadge(it) {
  const pol = getHqPolicyForItem(it);
  if (!pol) {
    return `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200" title="Item not explicitly listed in HQ return matrix. Standard brand terms apply.">
        <i class="fa-regular fa-circle-question text-[9px] text-slate-400"></i> Unlisted
      </span>`;
  }

  const status = (pol.status || 'NON-RETURNABLE').toUpperCase();
  const brand = escHtml(pol.brand || '');
  const cat = escHtml(pol.category || '');
  const tooltip = escHtml(pol.policy || pol.summary || 'HQ Policy Rule');
  const catBadge = cat ? `<span class="text-[8px] font-bold px-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">${cat}</span>` : '';

  if (status === 'NON-RETURNABLE') {
    return `
      <div class="inline-flex flex-col items-center gap-0.5">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200" title="${tooltip}">
          <i class="fa-solid fa-ban text-[9px] text-rose-600"></i> Non-Returnable
        </span>
        <div class="flex items-center gap-1">
          ${catBadge}
          ${brand ? `<span class="text-[9px] font-mono text-gray-400">${brand}</span>` : ''}
        </div>
      </div>`;
  }

  if (status === 'RETURNABLE') {
    return `
      <div class="inline-flex flex-col items-center gap-0.5">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title="${tooltip}">
          <i class="fa-solid fa-circle-check text-[9px] text-emerald-600"></i> Returnable
        </span>
        <div class="flex items-center gap-1">
          ${catBadge}
          ${brand ? `<span class="text-[9px] font-mono text-emerald-700 font-semibold">${brand}</span>` : ''}
        </div>
      </div>`;
  }

  return `
    <div class="inline-flex flex-col items-center gap-0.5">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="${tooltip}">
        <i class="fa-solid fa-triangle-exclamation text-[9px] text-amber-600"></i> Special
      </span>
      <div class="flex items-center gap-1">
        ${catBadge}
        ${brand ? `<span class="text-[9px] font-mono text-amber-700 font-semibold">${brand}</span>` : ''}
      </div>
    </div>`;
}

function parseCsvLines(csvText) {
  const lines = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some(col => col.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(col => col.length > 0)) {
      lines.push(currentRow);
    }
  }
  return lines;
}

function extractCellString(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const val = cell.value;
  if (typeof val === 'object') {
    if (val.richText) return val.richText.map(t => t.text).join('').trim();
    if (val.text) return String(val.text).trim();
    if (val.result !== undefined) return String(val.result).trim();
  }
  return String(val).trim();
}

function classifyHqPolicyText(policyText) {
  if (!policyText) return { status: 'NON-RETURNABLE', summary: 'Standard HQ policy: non-returnable for expired stock.' };
  const raw = policyText.trim();
  const up = raw.toUpperCase();

  if (
    up.includes('INFORM SALES REP') ||
    up.includes('REFER TO LOCAL REP') ||
    up.includes('REFER TO YOUR LOCAL SALES REP') ||
    up.includes('THOMAS') ||
    up.includes('UNDER WARRANTY') ||
    up.includes('CAN ASK PURCHASER') ||
    up.includes('ASK PURCHASER TO REQUEST') ||
    up.includes('ASK PURCHASER REQUEST') ||
    up.includes('PLEASE INFORM THE PURCHASER') ||
    up.includes('REPORT WFR TEST CARDS') ||
    up.includes('CONTACT SUPPLIER')
  ) {
    return {
      status: 'SPECIAL',
      summary: raw.length > 85 ? raw.substring(0, 82) + '...' : raw
    };
  }

  const isReturnableTerm = (
    up.includes('RETURNABLE WITHIN') ||
    up.includes('RETURN BEFORE EXPIRY') ||
    up.includes('RECOMMEND TO RETURN BEFORE') ||
    up.includes('ONLY ACCEPT RETURN BEFORE') ||
    up.includes('ONLY ACCEPT RETURN WITHIN') ||
    up.includes('CAN RETURN TO SCD') ||
    up.includes('PRODUCTS ARE RETURNABLE') ||
    up.includes('RETURN ARE ACCEPTED') ||
    up.includes('RETURNABLE, STOCK NO NEED RETURN') ||
    up.includes('RETURNABLE:') ||
    (up.includes('RETURNABLE') && !up.includes('NON-RETURNABLE') && !up.includes('NON RETURNABLE') && !up.includes('NOT RETURNABLE'))
  );

  const isReturnableBeforeExpiryOnly = (
    (up.includes('NON-RETURNABLE AFTER EXPIR') || up.includes('NON RETURNABLE AFTER EXPIR') || up.includes('NON-RETURABLE AFTER')) &&
    !up.includes('ALL PRODUCTS ARE NON-RETURNABLE') &&
    !up.includes('LOOSE ITEMS')
  );

  if (isReturnableTerm) {
    let summary = raw;
    if (up.includes('BEFORE EXPIRY') || up.includes('BEFORE EXPIRED')) {
      summary = 'Returnable before expiry date';
    } else if (up.includes('WITHIN 1 MONTH') || up.includes('WITHIN 1 MONTHS')) {
      summary = 'Returnable within 1 month after expiry';
    } else if (up.includes('WITHIN 2 MONTH') || up.includes('WITHIN 2 MONTHS')) {
      summary = 'Returnable within 2 months after expiry';
    } else if (up.includes('SABAH') || up.includes('SARAWAK')) {
      summary = raw.length > 85 ? raw.substring(0, 82) + '...' : raw;
    }
    return {
      status: 'RETURNABLE',
      summary: summary.length > 85 ? summary.substring(0, 82) + '...' : summary
    };
  }

  if (isReturnableBeforeExpiryOnly) {
    return {
      status: 'RETURNABLE',
      summary: 'Returnable BEFORE expiry only (strictly non-returnable after expiry)'
    };
  }

  let summary = 'Non-returnable for expiry. (Defect/recall only)';
  if (up.includes('BATCH:')) {
    summary = raw;
  } else if (up.includes('END CONSIGMENT') || up.includes('DELISTED')) {
    summary = 'Delisted / End Consignment - Non-returnable';
  } else if (raw.length > 0 && raw.length <= 80) {
    summary = raw;
  }

  return {
    status: 'NON-RETURNABLE',
    summary: summary
  };
}

async function parseHqReturnPolicyWorkbook(arrayBuffer) {
  const ExcelLib = (typeof ExcelJS !== 'undefined') ? ExcelJS : (window.ExcelJS || null);
  if (!ExcelLib) {
    throw new Error('ExcelJS library is not available in browser runtime.');
  }

  const wb = new ExcelLib.Workbook();
  await wb.xlsx.load(arrayBuffer);

  const categories = ['POISON', 'OTC', 'PC', 'M&B', 'SUP', 'FA', 'EC', 'F&B', 'H&L'];
  const results = [];

  for (const cat of categories) {
    const normCat = cat.replace(/[^A-Z0-9]/g, '');
    let ws = null;
    for (const sheet of wb.worksheets) {
      const normSheet = sheet.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normSheet === normCat) {
        ws = sheet;
        break;
      }
    }
    if (!ws) continue;

    // Detect PIC text from rows 1-8
    let picText = '';
    for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= 4; c++) {
        const txt = extractCellString(row.getCell(c));
        if (txt.toLowerCase().includes('person in charge') || txt.toLowerCase().includes('pic')) {
          picText = txt;
          break;
        }
      }
      if (picText) break;
    }
    if (picText && window.PMG_HQ_CATEGORY_METADATA && window.PMG_HQ_CATEGORY_METADATA[cat]) {
      window.PMG_HQ_CATEGORY_METADATA[cat].pic = picText;
    }

    // Detect Header Row
    let headerRow = 8;
    for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
      const c1 = extractCellString(ws.getRow(r).getCell(1)).toUpperCase();
      const c2 = extractCellString(ws.getRow(r).getCell(2)).toUpperCase();
      if (c1.includes('ITEM CODE') || c2.includes('DESCRIPTION')) {
        headerRow = r;
        break;
      }
    }

    let currentBrand = '';
    let currentBrandPolicy = '';

    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const c1 = extractCellString(row.getCell(1));
      const c2 = extractCellString(row.getCell(2));
      const c3 = extractCellString(row.getCell(3));
      const c4 = extractCellString(row.getCell(4));

      if (!c1 && !c2 && !c3 && !c4) continue;
      if (c1.toLowerCase().includes('all product') || c1.toLowerCase().includes('loose items')) continue;

      if (c3) {
        if (c3 !== currentBrand) {
          currentBrand = c3;
          currentBrandPolicy = '';
        }
      }

      if (c4) {
        if (
          c4.toUpperCase().includes('RETURN') ||
          c4.toUpperCase().includes('DEFECT') ||
          c4.toUpperCase().includes('INFORM') ||
          c4.toUpperCase().includes('REP') ||
          c4.toUpperCase().includes('PURCHASER') ||
          c4.length > 5
        ) {
          currentBrandPolicy = c4;
        }
      }

      const digits = c1.replace(/[^0-9]/g, '');
      const isCode = digits.length >= 4 && digits.length <= 10;
      const hasDesc = c2.length >= 2 && !c2.toUpperCase().includes('DESCRIPTION');

      if (isCode && hasDesc) {
        const itemCode = digits;
        const itemDesc = c2;
        const brand = c3 || currentBrand || 'Direct';
        const rawPolicy = c4 || currentBrandPolicy || 'NON-RETURNABLE';
        const { status, summary } = classifyHqPolicyText(rawPolicy);

        results.push({
          code: itemCode,
          desc: itemDesc,
          brand: brand,
          category: cat,
          policy: rawPolicy,
          status: status,
          summary: summary
        });
      }
    }
  }

  // Parse Direct Vendors from SRWK-D
  const srwkWs = wb.worksheets.find(w => w.name.toUpperCase().includes('SRWK') || w.name.toUpperCase().includes('DIRECT'));
  if (srwkWs) {
    const directVendors = [];
    for (let r = 4; r <= srwkWs.rowCount; r++) {
      const row = srwkWs.getRow(r);
      const type = extractCellString(row.getCell(1));
      const brand = extractCellString(row.getCell(2));
      const srwk = extractCellString(row.getCell(3));
      const sbh = extractCellString(row.getCell(4));
      if (type || brand) {
        directVendors.push({ type, brand, sarawak: srwk || '-', sabah: sbh || '-' });
      }
    }
    if (directVendors.length > 0) {
      window.PMG_HQ_DIRECT_VENDORS = directVendors;
      try {
        localStorage.setItem('pmg_hq_direct_vendors', JSON.stringify(directVendors));
      } catch (e) {}
    }
  }

  return results;
}

function parseHqReturnPolicyCsvText(csvText) {
  const rows = parseCsvLines(csvText);
  const results = [];
  let currentBrand = '';
  let currentPolicy = 'NON-RETURNABLE';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const colA = (row[0] || '').trim();
    const colB = (row[1] || '').trim();
    const colC = (row[2] || '').trim();

    if (colA.includes('ALL PRODUCT THAT COME IN SET') || colA.includes('Person in Charge') || colA.includes('Manufactory Defect') || colA.includes('NO MOVING')) {
      continue;
    }

    if (colA && !colB && !/^\d{5,8}$/.test(colA)) {
      currentBrand = colA;
      if (colC) currentPolicy = colC;
      continue;
    }

    if (colC && (colC.toUpperCase().includes('RETURN') || colC.toUpperCase().includes('INFORM') || colC.length > 5)) {
      currentPolicy = colC;
    }

    const isItemCode = /^\d{5,8}$/.test(colA);
    const hasDesc = colB.length > 2 && !colB.toUpperCase().includes('DESCRIPTION');

    if (isItemCode || (hasDesc && colA && !colA.toUpperCase().includes('CODE'))) {
      const itemCode = isItemCode ? colA : (colA.length <= 10 ? colA : '');
      const itemDesc = colB;
      const policyText = colC || currentPolicy || 'NON-RETURNABLE';
      const { status, summary } = classifyHqPolicyText(policyText);

      results.push({
        code: itemCode,
        desc: itemDesc,
        brand: currentBrand || 'Direct',
        category: 'POISON',
        policy: policyText,
        status: status,
        summary: summary
      });
    }
  }

  return results;
}

async function syncHqReturnPolicy(showToast = true) {
  const customUrl = localStorage.getItem(HQ_RETURN_SHEET_URL_STORAGE_KEY);
  const rawUrl = customUrl || (window.PMG_DEFAULT_HQ_RETURN_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1u2wfNbx77eiah3g3NPofbS391uESt7tA/edit?rtpof=true&gid=179261997#gid=179261997');
  
  if (showToast) {
    showExpiryToast('🔄 Fetching live HQ Multi-Category Return Policy sheet (All Tabs)...');
  }

  try {
    const idMatch = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    let parsedRules = [];

    if (idMatch && !rawUrl.includes('format=csv')) {
      const xlsxUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=xlsx`;
      const res = await fetch(xlsxUrl);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      parsedRules = await parseHqReturnPolicyWorkbook(arrayBuffer);
    } else {
      let csvUrl = rawUrl;
      if (!csvUrl.includes('format=csv') && idMatch) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
      }
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const text = await res.text();
      parsedRules = parseHqReturnPolicyCsvText(text);
    }

    if (!parsedRules || parsedRules.length === 0) {
      throw new Error('No valid product rules parsed from sheet.');
    }

    hqReturnPolicyList = parsedRules;
    localStorage.setItem(HQ_RETURN_POLICY_STORAGE_KEY, JSON.stringify(hqReturnPolicyList));
    localStorage.setItem('pmg_hq_return_last_sync', new Date().toISOString());

    buildHqReturnPolicyMaps();
    updateHqPolicyHeaderBadge();
    renderExpiryUI();

    if (showToast) {
      showExpiryToast(`✅ HQ Return Policy synced! (${hqReturnPolicyList.length} rules active across all categories)`);
    }
  } catch (err) {
    console.warn('[PMG Expiry] Failed to fetch live HQ sheet:', err);
    if (!hqReturnPolicyList || hqReturnPolicyList.length === 0) {
      if (Array.isArray(window.PMG_HQ_RETURN_POLICY_SEED)) {
        hqReturnPolicyList = window.PMG_HQ_RETURN_POLICY_SEED;
        buildHqReturnPolicyMaps();
        updateHqPolicyHeaderBadge();
        renderExpiryUI();
      }
    }
    if (showToast) {
      showExpiryToast(`⚠️ Live sync failed (${err.message}). Using cached policy rules (${hqReturnPolicyList ? hqReturnPolicyList.length : 0} rules).`);
    }
  }
}

let hqReturnPolicyActiveCategory = 'ALL';
let hqReturnPolicyActiveStatus = 'ALL';

function openHqReturnPolicyModal() {
  const modal = document.getElementById('modalHqReturnPolicy');
  if (!modal) return;
  const input = document.getElementById('hqReturnSheetUrlInput');
  const storedUrl = localStorage.getItem(HQ_RETURN_SHEET_URL_STORAGE_KEY) || window.PMG_DEFAULT_HQ_RETURN_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1u2wfNbx77eiah3g3NPofbS391uESt7tA/edit?rtpof=true&gid=179261997#gid=179261997';
  if (input) input.value = storedUrl;

  const extLink = document.getElementById('hqReturnSheetExternalLink');
  if (extLink) extLink.href = storedUrl;

  const searchInput = document.getElementById('modalHqPolicySearchInput');
  if (searchInput) searchInput.value = '';

  const statusFilter = document.getElementById('modalHqPolicyStatusFilter');
  if (statusFilter) statusFilter.value = hqReturnPolicyActiveStatus;

  renderHqPolicyCategoryTabs();
  updateHqPolicyPicBanner();
  filterHqPolicyModalRows('');
  modal.classList.remove('hidden');
}

function closeHqReturnPolicyModal() {
  const modal = document.getElementById('modalHqReturnPolicy');
  if (modal) modal.classList.add('hidden');
}

function renderHqPolicyCategoryTabs() {
  const container = document.getElementById('modalHqPolicyCategoryTabs');
  if (!container) return;

  const cats = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'POISON', label: 'Poison' },
    { key: 'OTC', label: 'OTC' },
    { key: 'PC', label: 'Personal Care' },
    { key: 'M&B', label: 'Mother & Baby' },
    { key: 'SUP', label: 'Supplements' },
    { key: 'FA', label: 'First Aid' },
    { key: 'EC', label: 'Eye Care' },
    { key: 'F&B', label: 'Food & Beverage' },
    { key: 'H&L', label: 'Health & Living' },
    { key: 'DIRECT_VENDORS', label: 'Direct Reps (SRWK-D)' }
  ];

  const catCounts = {};
  if (Array.isArray(hqReturnPolicyList)) {
    for (const it of hqReturnPolicyList) {
      const c = (it.category || 'POISON').toUpperCase();
      catCounts[c] = (catCounts[c] || 0) + 1;
    }
  }

  container.innerHTML = cats.map(c => {
    const isActive = hqReturnPolicyActiveCategory === c.key;
    const count = c.key === 'ALL'
      ? (hqReturnPolicyList ? hqReturnPolicyList.length : 0)
      : c.key === 'DIRECT_VENDORS'
      ? (window.PMG_HQ_DIRECT_VENDORS ? window.PMG_HQ_DIRECT_VENDORS.length : 18)
      : (catCounts[c.key] || 0);

    const activeClasses = 'bg-indigo-600 text-white font-bold shadow-xs';
    const inactiveClasses = 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 font-medium';

    return `
      <button type="button" onclick="setHqPolicyCategoryFilter('${c.key}')"
        class="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${isActive ? activeClasses : inactiveClasses}">
        <span>${escHtml(c.label)}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600 font-bold'}">${count}</span>
      </button>`;
  }).join('');
}

function updateHqPolicyPicBanner() {
  const labelEl = document.getElementById('modalHqPicCategoryLabel');
  const detailEl = document.getElementById('modalHqPicDetail');
  if (!labelEl || !detailEl) return;

  if (hqReturnPolicyActiveCategory === 'ALL') {
    labelEl.textContent = 'Multi-Category Master Engine:';
    detailEl.textContent = '9 Categories Active (Poison, OTC, PC, M&B, SUP, FA, EC, F&B, H&L) · 5,200+ Rules Live';
    return;
  }

  if (hqReturnPolicyActiveCategory === 'DIRECT_VENDORS') {
    labelEl.textContent = 'Direct Vendor Sales Rep Directory (SRWK-D):';
    detailEl.textContent = 'Contact local vendor area reps for direct-send returns and warranty exchanges';
    return;
  }

  const meta = (window.PMG_HQ_CATEGORY_METADATA && window.PMG_HQ_CATEGORY_METADATA[hqReturnPolicyActiveCategory]) || {};
  labelEl.textContent = `${meta.label || hqReturnPolicyActiveCategory} Person in Charge:`;
  detailEl.textContent = meta.pic || 'Refer to PMG Merchandising Department';
}

function setHqPolicyCategoryFilter(category) {
  hqReturnPolicyActiveCategory = category;
  renderHqPolicyCategoryTabs();
  updateHqPolicyPicBanner();
  const searchInput = document.getElementById('modalHqPolicySearchInput');
  filterHqPolicyModalRows(searchInput ? searchInput.value : '');
}

function setHqPolicyStatusFilter(status) {
  hqReturnPolicyActiveStatus = status;
  const searchInput = document.getElementById('modalHqPolicySearchInput');
  filterHqPolicyModalRows(searchInput ? searchInput.value : '');
}

function saveHqReturnSheetUrlAndSync() {
  const input = document.getElementById('hqReturnSheetUrlInput');
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    localStorage.setItem(HQ_RETURN_SHEET_URL_STORAGE_KEY, val);
    const extLink = document.getElementById('hqReturnSheetExternalLink');
    if (extLink) extLink.href = val;
  }
  syncHqReturnPolicy(true);
}

function filterHqPolicyModalRows(query) {
  const tbody = document.getElementById('modalHqPolicyTbody');
  const thead = document.getElementById('modalHqPolicyThead');
  if (!tbody) return;
  const q = (query || '').toLowerCase().trim();

  // If DIRECT_VENDORS tab is selected
  if (hqReturnPolicyActiveCategory === 'DIRECT_VENDORS') {
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th class="p-2 w-1/4">Type / Vendor Line</th>
          <th class="p-2 w-28">Brand Code</th>
          <th class="p-2">Sarawak Sales Rep Contact</th>
          <th class="p-2">Sabah Sales Rep Contact</th>
        </tr>`;
    }
    const vendors = window.PMG_HQ_DIRECT_VENDORS || [];
    const filteredVendors = vendors.filter(v => {
      if (!q) return true;
      const t = String(v.type || '').toLowerCase();
      const b = String(v.brand || '').toLowerCase();
      const sr = String(v.sarawak || '').toLowerCase();
      const sb = String(v.sabah || '').toLowerCase();
      return t.includes(q) || b.includes(q) || sr.includes(q) || sb.includes(q);
    });

    const countEl = document.getElementById('modalHqPolicyFilteredCount');
    if (countEl) countEl.textContent = `${filteredVendors.length} direct vendor lines`;

    if (filteredVendors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-400">No direct vendor contacts found matching "${escHtml(q)}"</td></tr>`;
      return;
    }

    tbody.innerHTML = filteredVendors.map(v => `
      <tr class="hover:bg-slate-50 transition border-b border-gray-100">
        <td class="p-2 font-bold text-gray-900">${escHtml(v.type || '—')}</td>
        <td class="p-2 font-mono text-indigo-700 font-bold">${escHtml(v.brand || '—')}</td>
        <td class="p-2 font-medium text-emerald-800"><i class="fa-solid fa-phone text-[10px] text-emerald-600 mr-1"></i>${escHtml(v.sarawak || '—')}</td>
        <td class="p-2 font-medium text-blue-800"><i class="fa-solid fa-phone text-[10px] text-blue-600 mr-1"></i>${escHtml(v.sabah || '—')}</td>
      </tr>
    `).join('');
    return;
  }

  // Merchandise rules view
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th class="p-2 w-16 text-center">Cat</th>
        <th class="p-2 w-20">Code</th>
        <th class="p-2">Item Description</th>
        <th class="p-2 w-24">Brand / Vendor</th>
        <th class="p-2 text-center w-28">HQ Return Status</th>
        <th class="p-2">Specific Terms &amp; Conditions</th>
      </tr>`;
  }

  const filtered = (hqReturnPolicyList || []).filter(item => {
    if (hqReturnPolicyActiveCategory !== 'ALL' && item.category !== hqReturnPolicyActiveCategory) {
      return false;
    }
    if (hqReturnPolicyActiveStatus !== 'ALL' && item.status !== hqReturnPolicyActiveStatus) {
      return false;
    }
    if (!q) return true;
    const c = String(item.code || '').toLowerCase();
    const d = String(item.desc || '').toLowerCase();
    const b = String(item.brand || '').toLowerCase();
    const p = String(item.policy || '').toLowerCase();
    const cat = String(item.category || '').toLowerCase();
    return c.includes(q) || d.includes(q) || b.includes(q) || p.includes(q) || cat.includes(q);
  });

  const countEl = document.getElementById('modalHqPolicyFilteredCount');
  if (countEl) countEl.textContent = `${filtered.length} matching rules`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">No policy rules found matching your filter criteria.</td></tr>`;
    return;
  }

  const displayRows = filtered.slice(0, 200);
  tbody.innerHTML = displayRows.map(it => {
    const isNonRet = it.status === 'NON-RETURNABLE';
    const isRet = it.status === 'RETURNABLE';
    const badgeHtml = isNonRet
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap"><i class="fa-solid fa-ban text-[9px] mr-1"></i>NON-RETURNABLE</span>`
      : isRet
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap"><i class="fa-solid fa-circle-check text-[9px] mr-1"></i>RETURNABLE</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap"><i class="fa-solid fa-triangle-exclamation text-[9px] mr-1"></i>${escHtml(it.status)}</span>`;

    return `
      <tr class="hover:bg-slate-50 transition border-b border-gray-100">
        <td class="p-2 text-center whitespace-nowrap"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">${escHtml(it.category || '—')}</span></td>
        <td class="p-2 font-mono font-bold text-blue-900">${escHtml(it.code || '—')}</td>
        <td class="p-2 font-medium text-gray-900">${escHtml(it.desc || '—')}</td>
        <td class="p-2 font-mono text-gray-600">${escHtml(it.brand || '—')}</td>
        <td class="p-2 text-center whitespace-nowrap">${badgeHtml}</td>
        <td class="p-2 text-gray-600 text-[11px]">${escHtml(it.policy || it.summary || '—')}</td>
      </tr>`;
  }).join('');
}

// ─── UNIQUE KEY & SMART MERGE ENGINE ─────────────────────────────────────────
function getExpiryItemKey(item) {
  if (!item) return '';
  const b = (item.branch || 'Kota Sentosa').trim().toUpperCase();
  const c = (item.itemCode || '').trim().toUpperCase();
  const bt = (item.batchNumber || '').trim().toUpperCase();
  const exp = (typeof formatExpiryDateDisplay === 'function' ? formatExpiryDateDisplay(item.expiryDate || '') : String(item.expiryDate || '')).trim().toUpperCase();
  const d = (item.itemDescription || '').trim().toUpperCase().slice(0, 40);
  if (c && c !== 'N/A') {
    const normCode = c.replace(/^0+(?=\d)/, '');
    const batchKey = (bt && bt !== 'N/A') ? bt : `NO_BATCH_${exp}_${d.slice(0, 20)}`;
    return `${b}|${normCode}|${batchKey}|${exp}`;
  }
  if (d && d !== 'N/A') {
    return `${b}|DESC_${d}|${bt || 'NO_BATCH'}|${exp}`;
  }
  if (item.tempId) {
    return `${b}|TEMP_${item.tempId}`;
  }
  if (item.rowId !== undefined && item.rowId !== null && String(item.rowId) !== 'undefined') {
    return `${b}|ID_${item.rowId}`;
  }
  return '';
}

function mergeExpiryDatasets(localList, remoteList) {
  const cleanLocal = ensureUniqueExpiryRowIds(Array.isArray(localList) ? localList : []);
  const cleanRemote = ensureUniqueExpiryRowIds(Array.isArray(remoteList) ? remoteList : []);
  if (cleanRemote.length === 0) return cleanLocal;
  if (cleanLocal.length === 0) return cleanRemote;

  const clearedSet = getClearedExpiryKeys();
  const map = new Map();
  const rowIdMap = new Map();
  const batchMap = new Map();

  // Helper to extract offeredPrice from item or actionPlan if not directly present
  const resolveOfferedPrice = (item) => {
    if (!item) return undefined;
    if (item.offeredPrice !== undefined && item.offeredPrice !== null && !isNaN(item.offeredPrice) && Number(item.offeredPrice) > 0) {
      return Number(item.offeredPrice);
    }
    if (item.clearancePrice !== undefined && item.clearancePrice !== null && !isNaN(item.clearancePrice) && Number(item.clearancePrice) > 0) {
      return Number(item.clearancePrice);
    }
    if (item.actionPlan) {
      const m = String(item.actionPlan).match(/offer:\s*rm\s*([\d.]+)/i) || String(item.actionPlan).match(/rm\s*([\d.]+)/i);
      if (m && m[1]) {
        const p = parseFloat(m[1]);
        if (!isNaN(p) && p > 0) return p;
      }
    }
    return undefined;
  };

  // Index local items first
  cleanLocal.forEach((it, idx) => {
    const key = getExpiryItemKey(it) || `ROW_${it.rowId || idx}`;
    const clone = { ...it };
    if (isItemMarkedDoneOrCleared(clone, clearedSet)) {
      clone.status = 'DONE';
      clone.quantity = 0;
    }
    const resolvedOff = resolveOfferedPrice(clone);
    if (resolvedOff !== undefined) {
      clone.offeredPrice = resolvedOff;
      if (clone.clearancePrice === undefined) clone.clearancePrice = resolvedOff;
    }
    map.set(key, clone);

    const rId = String(clone.rowId || '').trim();
    if (rId && rId !== 'undefined' && rId !== 'null' && rId !== 'NaN') {
      rowIdMap.set(rId, key);
    }

    const b = (clone.branch || 'Kota Sentosa').trim().toUpperCase();
    const c = normalizeProductCode(clone.itemCode);
    const d = normalizeProductDesc(clone.itemDescription);
    const bt = normalizeBatchNumber(clone.batchNumber);
    if (bt && bt !== 'NOBATCH' && bt !== 'NONE') {
      const bKey = `${b}|${c ? 'C_' + c : 'D_' + d.slice(0, 30)}|${bt}`;
      batchMap.set(bKey, key);
    }
  });

  // Merge remote items
  cleanRemote.forEach((rem, idx) => {
    const remKey = getExpiryItemKey(rem) || `ROW_${rem.rowId || idx}`;
    const remIsCleared = isItemMarkedDoneOrCleared(rem, clearedSet);
    const remResolvedOff = resolveOfferedPrice(rem);
    if (remResolvedOff !== undefined) {
      rem.offeredPrice = remResolvedOff;
      if (rem.clearancePrice === undefined) rem.clearancePrice = remResolvedOff;
    }

    // Determine target key in local map:
    // 1. Direct key match (same branch, product, batch, expiry)
    // 2. Exact rowId match (same database row whose expiry was updated)
    // 3. Exact batch match (non-generic batch on same product and branch)
    let targetKey = null;
    if (map.has(remKey)) {
      targetKey = remKey;
    } else {
      const rId = String(rem.rowId || '').trim();
      if (rId && rowIdMap.has(rId)) {
        targetKey = rowIdMap.get(rId);
      } else {
        const b = (rem.branch || 'Kota Sentosa').trim().toUpperCase();
        const c = normalizeProductCode(rem.itemCode);
        const d = normalizeProductDesc(rem.itemDescription);
        const bt = normalizeBatchNumber(rem.batchNumber);
        if (bt && bt !== 'NOBATCH' && bt !== 'NONE') {
          const bKey = `${b}|${c ? 'C_' + c : 'D_' + d.slice(0, 30)}|${bt}`;
          if (batchMap.has(bKey)) {
            targetKey = batchMap.get(bKey);
          }
        }
      }
    }

    if (!targetKey || !map.has(targetKey)) {
      const clone = { ...rem };
      if (remIsCleared) {
        clone.status = 'DONE';
        clone.quantity = 0;
      }
      map.set(remKey, clone);
    } else {
      const loc = map.get(targetKey);
      const locIsCleared = isItemMarkedDoneOrCleared(loc, clearedSet);
      const locTs = loc.lastUpdated ? new Date(loc.lastUpdated).getTime() : 0;
      const remTs = rem.lastUpdated ? new Date(rem.lastUpdated).getTime() : 0;

      // Compare timestamps & pricing updates
      const locPricingTs = loc.pricingUpdatedAt ? new Date(loc.pricingUpdatedAt).getTime() : locTs;
      const remPricingTs = rem.pricingUpdatedAt ? new Date(rem.pricingUpdatedAt).getTime() : remTs;

      let winOfferedPrice = loc.offeredPrice;
      let winClearancePrice = loc.clearancePrice;
      let winNormalPrice = loc.normalPrice;
      let winActionPlan = loc.actionPlan;
      let winTheme = loc.tagTheme;
      let winSize = loc.tagSize;
      let winBanner = loc.promoBanner;
      let winRemark = loc.promoRemark;
      let winPricingUpdatedAt = loc.pricingUpdatedAt;

      if (remPricingTs > locPricingTs && (rem.offeredPrice !== undefined || rem.clearancePrice !== undefined)) {
        winOfferedPrice = rem.offeredPrice !== undefined ? rem.offeredPrice : rem.clearancePrice;
        winClearancePrice = rem.clearancePrice !== undefined ? rem.clearancePrice : rem.offeredPrice;
        winNormalPrice = rem.normalPrice !== undefined ? rem.normalPrice : loc.normalPrice;
        winActionPlan = rem.actionPlan || loc.actionPlan;
        winTheme = rem.tagTheme || loc.tagTheme;
        winSize = rem.tagSize || loc.tagSize;
        winBanner = rem.promoBanner || loc.promoBanner;
        winRemark = rem.promoRemark || loc.promoRemark;
        winPricingUpdatedAt = rem.pricingUpdatedAt;
      } else {
        if (winOfferedPrice === undefined && rem.offeredPrice !== undefined) winOfferedPrice = rem.offeredPrice;
        if (winClearancePrice === undefined && rem.clearancePrice !== undefined) winClearancePrice = rem.clearancePrice;
        if (winNormalPrice === undefined && rem.normalPrice !== undefined) winNormalPrice = rem.normalPrice;
        if (!winActionPlan && rem.actionPlan) winActionPlan = rem.actionPlan;
        if (!winTheme && rem.tagTheme) winTheme = rem.tagTheme;
        if (!winSize && rem.tagSize) winSize = rem.tagSize;
        if (!winBanner && rem.promoBanner) winBanner = rem.promoBanner;
        if (!winRemark && rem.promoRemark) winRemark = rem.promoRemark;
      }

      if (remTs > locTs) {
        // Remote is strictly newer than local! Remote updates inventory attributes
        const updatedItem = {
          ...loc,
          ...rem,
          rowId: loc.rowId || rem.rowId,
          offeredPrice: winOfferedPrice,
          clearancePrice: winClearancePrice,
          normalPrice: winNormalPrice,
          actionPlan: winActionPlan,
          tagTheme: winTheme,
          tagSize: winSize,
          promoBanner: winBanner,
          promoRemark: winRemark,
          pricingUpdatedAt: winPricingUpdatedAt
        };
        if (remIsCleared) {
          updatedItem.status = 'DONE';
          updatedItem.quantity = 0;
          updatedItem.clearedAt = rem.clearedAt || rem.lastUpdated || new Date().toISOString();
        }
        if (targetKey !== remKey) {
          map.delete(targetKey);
        }
        map.set(remKey, updatedItem);
      } else if (locTs > remTs) {
        // Local is strictly newer than remote!
        const updatedItem = {
          ...rem,
          ...loc,
          offeredPrice: winOfferedPrice,
          clearancePrice: winClearancePrice,
          normalPrice: winNormalPrice,
          actionPlan: winActionPlan,
          tagTheme: winTheme,
          tagSize: winSize,
          promoBanner: winBanner,
          promoRemark: winRemark,
          pricingUpdatedAt: winPricingUpdatedAt
        };
        if (locIsCleared) {
          updatedItem.status = 'DONE';
          updatedItem.quantity = 0;
        }
        map.set(targetKey, updatedItem);
      } else {
        // Timestamps equal or absent:
        if (locIsCleared || remIsCleared) {
          loc.status = 'DONE';
          loc.quantity = 0;
        } else {
          if (rem.quantity !== undefined && loc.quantity === undefined) loc.quantity = rem.quantity;
          if (rem.expiryDate && !loc.expiryDate) loc.expiryDate = rem.expiryDate;
          if (rem.batchNumber && (!loc.batchNumber || loc.batchNumber === 'N/A')) loc.batchNumber = rem.batchNumber;
          loc.offeredPrice = winOfferedPrice;
          loc.clearancePrice = winClearancePrice;
          loc.normalPrice = winNormalPrice;
          loc.actionPlan = winActionPlan;
          loc.tagTheme = winTheme;
          loc.tagSize = winSize;
          loc.promoBanner = winBanner;
          loc.promoRemark = winRemark;
          if (winPricingUpdatedAt) loc.pricingUpdatedAt = winPricingUpdatedAt;
        }
        map.set(targetKey, loc);
      }
    }
  });

  return ensureUniqueExpiryRowIds(Array.from(map.values()));
}
window.mergeExpiryDatasets = mergeExpiryDatasets;

// ─── DATE & HORIZON UTILITIES ────────────────────────────────────────────────
/**
 * Parses dates formatted as DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD.
 * Auto-corrects 2-digit years and common inverted invoice OCR dates.
 */
const MONTH_NAMES_MAP = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, september: 9, sept: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12
};

function parseExpiryDate(dateVal) {
  if (!dateVal || String(dateVal).trim() === '' || String(dateVal).toUpperCase() === 'N/A') return null;

  if (dateVal instanceof Date) {
    const d = new Date(dateVal.getTime());
    if (d.getFullYear() < 2000) d.setFullYear(d.getFullYear() + 100);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string' && (dateVal.includes('GMT') || dateVal.includes('Standard Time') || dateVal.includes('UTC') || (dateVal.includes('T') && dateVal.includes('-')))) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() < 2000) d.setFullYear(d.getFullYear() + 100);
      return d;
    }
  }

  let str = String(dateVal).trim();
  str = str.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
  str = str.replace(/[-.\s]+/g, '/');
  const parts = str.split('/').filter(p => p.length > 0);

  if (parts.length === 3) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim();
    const p2 = parts[2].trim();

    let d, m, y;
    if (p1.toLowerCase() in MONTH_NAMES_MAP) {
      d = parseInt(p0, 10);
      m = MONTH_NAMES_MAP[p1.toLowerCase()];
      y = parseInt(p2, 10);
    } else if (p0.toLowerCase() in MONTH_NAMES_MAP) {
      m = MONTH_NAMES_MAP[p0.toLowerCase()];
      d = parseInt(p1, 10);
      y = parseInt(p2, 10);
    } else {
      d = parseInt(p0, 10);
      m = parseInt(p1, 10);
      y = parseInt(p2, 10);
    }

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;

    // Handle 4-digit year at start (YYYY/MM/DD)
    if (d > 1000) {
      const temp = d; d = y; y = temp;
    }

    // Normalize 2-digit year first (e.g. 26 -> 2026, 27 -> 2027)
    if (y < 100) {
      y += 2000;
    }

    // Auto-fix inverted dates (e.g. 28/02/2004 from invoice format 04-02-28)
    if (y >= 2000 && y <= 2024 && d >= 26 && d <= 35) {
      const correctedYear = 2000 + d;
      const correctedDay = (y >= 2001 && y <= 2024) ? (y - 2000) : 1;
      d = correctedDay;
      y = correctedYear;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;

    const dateObj = new Date(y, m - 1, d);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  } else if (parts.length === 2) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim();
    let m, y;
    if (p0.toLowerCase() in MONTH_NAMES_MAP) {
      m = MONTH_NAMES_MAP[p0.toLowerCase()];
      y = parseInt(p1, 10);
    } else if (p1.toLowerCase() in MONTH_NAMES_MAP) {
      m = MONTH_NAMES_MAP[p1.toLowerCase()];
      y = parseInt(p0, 10);
    } else {
      const n0 = parseInt(p0, 10);
      const n1 = parseInt(p1, 10);
      if (n0 > 1000) {
        y = n0;
        m = n1;
      } else {
        m = n0;
        y = n1;
      }
    }
    if (y < 100) y += 2000;
    if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return null;
    const dateObj = new Date(y, m, 0); // Last day of month
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  return null;
}

function formatExpiryDateDisplay(dateVal) {
  const d = parseExpiryDate(dateVal);
  if (!d) return String(dateVal || 'N/A');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${month}/${yr}`;
}

function getExpiryMonthYearKey(dateVal) {
  const d = parseExpiryDate(dateVal);
  if (!d) return 'UNSCHEDULED';
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 0 && m <= 11) {
    return `${MONTH_NAMES[m]} ${y}`;
  }
  return 'UNSCHEDULED';
}

function calculateExpiryHorizon(dateVal) {
  const d = parseExpiryDate(dateVal);
  if (!d) {
    return { monthsLeft: 999, daysLeft: 9999, label: 'Unknown', color: 'gray', level: 'safe' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const monthsLeft = +(daysLeft / 30.4375).toFixed(1);

  if (daysLeft < 0) {
    return { monthsLeft, daysLeft, label: 'EXPIRED', color: 'rose', level: 'expired' };
  } else if (monthsLeft < 3) {
    return { monthsLeft, daysLeft, label: `< 3 Mos (${daysLeft}d)`, color: 'red', level: 'critical' };
  } else if (monthsLeft < 6) {
    return { monthsLeft, daysLeft, label: `3-6 Mos (${Math.round(monthsLeft)}m)`, color: 'amber', level: 'urgent' };
  } else if (monthsLeft <= 9) {
    return { monthsLeft, daysLeft, label: `6-9 Mos (${Math.round(monthsLeft)}m)`, color: 'yellow', level: 'kpi' };
  } else if (monthsLeft <= 12) {
    return { monthsLeft, daysLeft, label: `9-12 Mos (${Math.round(monthsLeft)}m)`, color: 'blue', level: 'monitor' };
  } else {
    return { monthsLeft, daysLeft, label: `> 12 Mos (${Math.round(monthsLeft)}m)`, color: 'emerald', level: 'safe' };
  }
}

// ─── GOOGLE SHEETS & ONEDRIVE SYNC ───────────────────────────────────────────
/**
 * Synchronizes stock expiry items bidirectionally across OneDrive folder and Google Sheets.
 */
async function syncExpiryFromSheets(showPrompt = true) {
  // 0. Auto-polling pause check
  if (!showPrompt && typeof window.isPmgSyncPaused === 'function' && window.isPmgSyncPaused()) {
    console.log('[PMG Expiry] Sheets background sync skipped: auto-polling is temporarily paused.');
    return;
  }

  const btn = document.getElementById('expirySyncBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin text-sm mr-1.5"></i>Syncing...`;
  }

  try {
    // 1. Synchronize with OneDrive first (local-first, conflict-free merge)
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.syncStockExpiryWithOneDrive === 'function') {
      await window.pmgOneDriveSync.syncStockExpiryWithOneDrive(!showPrompt);
    }

    // 2. Fetch live data from Google Sheets
    try {
      const url = `${PMG_EXPIRY_API_URL}?action=getExpiry&branch=all`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
          expiryItems = mergeExpiryDatasets(expiryItems, data.items);
          saveLocalExpiryData();
          renderExpiryUI();
          if (showPrompt) {
            showExpiryToast(`✅ Synced ${expiryItems.length} items live with OneDrive & Google Sheets!`);
          }
          return;
        }
      }
    } catch (sheetErr) {
      console.warn('[PMG Expiry] Sheets fetch notice:', sheetErr);
    }

    if (showPrompt) {
      showExpiryToast(`✅ Stock Expiry active with ${expiryItems.length} items.`);
    }
  } catch (err) {
    console.warn('[PMG Expiry] Sync warning:', err);
    if (showPrompt) showExpiryToast(`⚠️ Sync notice: using local database of ${expiryItems.length} items.`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-arrows-rotate text-sm mr-1.5"></i>Sync Cloud & Folder`;
    }
  }
}

/**
 * Pushes updated quantity, expiry date, or clearance status to Google Sheets.
 */
async function pushExpiryUpdateToSheets(rowId, quantity, status, expiryDate = null, extraFields = {}) {
  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const item = findExpiryItemById(rowId);
    const nowIso = new Date().toISOString();

    const isDoneOrCleared = status === 'DONE' || status === 'COMPLETED' || status === 'Cleared';
    const primaryAction = isDoneOrCleared ? 'mark_cleared' : (expiryDate ? 'update_item' : 'update_qty');

    const rawIdStr = String(rowId || '').trim();
    const numRowId = /^\d+$/.test(rawIdStr) ? parseInt(rawIdStr, 10) : NaN;
    // If rowId is non-numeric, invalid, or beyond Google Sheet rows (> 2100), insert/append via batch_insert
    if (isNaN(numRowId) || numRowId <= 1 || numRowId > 2100) {
      if (isDoneOrCleared || quantity !== null) {
        return await pushBatchExpiryToSheets([{
          rowId: item?.rowId || rowId,
          branch: item?.branch || extraFields.branch || 'Kota Sentosa',
          batchNumber: item?.batchNumber || extraFields.batchNumber || 'N/A',
          itemCode: item?.itemCode || extraFields.itemCode || 'N/A',
          itemDescription: item?.itemDescription || extraFields.itemDescription || '',
          expiryDate: expiryDate || item?.expiryDate || 'N/A',
          quantity: quantity !== null ? quantity : (item?.quantity || 0),
          sourceFile: item?.sourceFile || 'Direct Update',
          status: status || (isDoneOrCleared ? 'DONE' : 'Active'),
          actionPlan: extraFields.actionPlan !== undefined ? extraFields.actionPlan : item?.actionPlan,
          offeredPrice: extraFields.offeredPrice !== undefined ? extraFields.offeredPrice : item?.offeredPrice,
          clearancePrice: extraFields.clearancePrice !== undefined ? extraFields.clearancePrice : item?.clearancePrice,
          normalPrice: item?.normalPrice,
          pricingUpdatedAt: item?.pricingUpdatedAt
        }]);
      }
    }

    const payload = {
      action: primaryAction,
      subAction: primaryAction,
      rowId: numRowId,
      branch: item?.branch || extraFields.branch || 'Kota Sentosa',
      itemCode: item?.itemCode || extraFields.itemCode || '',
      itemDescription: item?.itemDescription || extraFields.itemDescription || '',
      batchNumber: item?.batchNumber || extraFields.batchNumber || '',
      quantity: quantity,
      status: status || (isDoneOrCleared ? 'DONE' : 'Active'),
      expiryDate: expiryDate || item?.expiryDate || '',
      lastUpdated: nowIso,
      updatedBy: session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist',
      skipDistribution: true
    };
    if (extraFields.itemDescription) payload.itemDescription = extraFields.itemDescription;
    if (extraFields.batchNumber) payload.batchNumber = extraFields.batchNumber;
    if (extraFields.itemCode) payload.itemCode = extraFields.itemCode;
    if (extraFields.actionPlan !== undefined) {
      payload.actionPlan = extraFields.actionPlan;
    } else if (item?.actionPlan) {
      payload.actionPlan = item.actionPlan;
    }
    if (extraFields.offeredPrice !== undefined) {
      payload.offeredPrice = extraFields.offeredPrice;
    } else if (item?.offeredPrice !== undefined) {
      payload.offeredPrice = item.offeredPrice;
    }
    if (extraFields.clearancePrice !== undefined) {
      payload.clearancePrice = extraFields.clearancePrice;
    } else if (item?.clearancePrice !== undefined) {
      payload.clearancePrice = item.clearancePrice;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(PMG_EXPIRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    if (data && data.success === false) {
      // If server rejected because of invalid rowId, fallback to batch_insert
      if (String(data.error).includes('rowId')) {
        return await pushBatchExpiryToSheets([{
          rowId: item?.rowId || rowId,
          branch: item?.branch || extraFields.branch || 'Kota Sentosa',
          batchNumber: item?.batchNumber || extraFields.batchNumber || 'N/A',
          itemCode: item?.itemCode || extraFields.itemCode || 'N/A',
          itemDescription: item?.itemDescription || extraFields.itemDescription || '',
          expiryDate: expiryDate || item?.expiryDate || 'N/A',
          quantity: quantity !== null ? quantity : (item?.quantity || 0),
          sourceFile: item?.sourceFile || 'Direct Update',
          status: status || (isDoneOrCleared ? 'DONE' : 'Active'),
          actionPlan: extraFields.actionPlan !== undefined ? extraFields.actionPlan : item?.actionPlan,
          offeredPrice: extraFields.offeredPrice !== undefined ? extraFields.offeredPrice : item?.offeredPrice,
          clearancePrice: extraFields.clearancePrice !== undefined ? extraFields.clearancePrice : item?.clearancePrice,
          normalPrice: item?.normalPrice,
          pricingUpdatedAt: item?.pricingUpdatedAt
        }]);
      }
      throw new Error(data.error || 'Server rejected update');
    }
    return true;
  } catch (err) {
    console.error('[PMG Expiry] Update push failed:', err);
    throw err;
  }
}

/**
 * Batch-inserts newly extracted OCR invoice items into Google Sheets.
 */
async function pushBatchExpiryToSheets(items) {
  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const payload = {
      action: 'batch_insert',
      items: items,
      skipDistribution: true,
      updatedBy: session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist'
    };

    const res = await fetch(PMG_EXPIRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).catch(() => {});
    if (res && res.ok) {
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}
      return data && data.success;
    }
    return false;
  } catch (err) {
    console.warn('[PMG Expiry] Batch insert failed:', err);
    return false;
  }
}

function cleanNumericFloatString(val) {
  if (val === null || val === undefined) return 'N/A';
  let s = String(val).trim();
  if (s.endsWith('.0') && /^\d+$/.test(s.slice(0, -2))) {
    s = s.slice(0, -2);
  }
  return s || 'N/A';
}

// ─── MONTH FOLDER LOOKUP & SOP FILENAME PARSER ─────────────────────────────
const MONTH_FOLDER_MAP = {
  'JAN': '01 - January', 'JANUARY': '01 - January',
  'FEB': '02 - February', 'FEBRUARY': '02 - February',
  'MAR': '03 - March', 'MARCH': '03 - March',
  'APR': '04 - April', 'APRIL': '04 - April',
  'MAY': '05 - May',
  'JUN': '06 - June', 'JUNE': '06 - June',
  'JUL': '07 - July', 'JULY': '07 - July',
  'AUG': '08 - August', 'AUGUST': '08 - August',
  'SEP': '09 - September', 'SEPTEMBER': '09 - September',
  'OCT': '10 - October', 'OCTOBER': '10 - October',
  'NOV': '11 - November', 'NOVEMBER': '11 - November',
  'DEC': '12 - December', 'DECEMBER': '12 - December'
};

/**
 * Parses scanned documents named according to Accounts SOP format:
 * "(vendor name) (invoices number) (total amount in RM) - (month) (INV or CN)"
 * e.g. "Sung Hoe 12345 RM 1500.50 - SEP INV.pdf"
 * e.g. "Zuellig Pharma 99234 RM 420.00 - SEP CN.pdf"
 */
function parseInvoiceOrCnFilename(filename) {
  const cleanName = filename.replace(/\.[^/.]+$/, '').trim();
  
  // Detect CN vs INV
  const isCreditNote = /\b(CN|CREDIT\s*NOTE)\b/i.test(cleanName) || /[\s\-_]CN$/i.test(cleanName);
  const docType = isCreditNote ? 'CN' : 'INV';
  
  // Extract month folder
  let detectedMonthFolder = '';
  const monthMatch = cleanName.match(/\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/i);
  if (monthMatch) {
    const mKey = monthMatch[1].toUpperCase();
    detectedMonthFolder = MONTH_FOLDER_MAP[mKey] || '';
  }
  
  // Extract Year if present (e.g. 2025, 2026, 2027)
  let detectedYear = '';
  const yearMatch = cleanName.match(/\b(202[4-9]|203[0-9])\b/);
  if (yearMatch) {
    detectedYear = yearMatch[1];
  } else {
    detectedYear = String(new Date().getFullYear());
  }

  // Extract amount in RM if present (e.g. RM 1,234.50, RM1234.50, RM 450)
  let detectedAmount = '';
  const rmPattern = /\bRM\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i;
  const rmMatch = cleanName.match(rmPattern);
  if (rmMatch) {
    detectedAmount = 'RM ' + rmMatch[1].replace(/,/g, '');
  }

  // Strip trailing '- (month) (INV or CN)' or '- (month) (year) (INV or CN)'
  const tailRegex = /[-–]\s*(?:(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*)?(?:202[0-9]|203[0-9])?\s*(?:INV|CN|INVOICE|CREDIT\s*NOTE).*$/i;
  const headPart = cleanName.replace(tailRegex, '').trim();

  // Strip \bRM\s*[\d,.]*
  let beforeRm = headPart.replace(/\s*\bRM\s*[\d,.]*.*$/i, '').trim();
  if (beforeRm === headPart && /\s+[\d,.]+\s*$/.test(headPart)) {
    const possibleAmtMatch = headPart.match(/\s+([\d,.]+)\s*$/);
    if (possibleAmtMatch && !detectedAmount) {
      detectedAmount = 'RM ' + possibleAmtMatch[1];
    }
    beforeRm = headPart.replace(/\s+[\d,.]+\s*$/, '').trim();
  }

  const tokens = beforeRm.split(/\s+/).filter(Boolean);
  let vendor = '';
  let docNumber = '';
  if (tokens.length >= 2) {
    docNumber = tokens.pop();
    vendor = tokens.join(' ');
  } else if (tokens.length === 1) {
    vendor = tokens[0];
  } else {
    vendor = 'General';
  }

  vendor = vendor.replace(/[<>:"/\\|?*]/g, '').trim();

  return {
    raw: filename,
    isCreditNote,
    type: docType,
    vendor: vendor || 'General',
    docNumber: docNumber || '',
    amount: detectedAmount || '',
    monthFolder: detectedMonthFolder || '',
    year: detectedYear
  };
}

// ─── GEMINI OCR INVOICE EXTRACTION ──────────────────────────────────────────
/**
 * Processes a single invoice file via Gemini Multimodal Vision API directly in the browser.
 * Returns array of validated stock items.
 */
async function extractInvoiceItemsFromPdf(file, branch, onStatus) {
  const apiKey = (typeof window.getGlobalGeminiKey === 'function' ? window.getGlobalGeminiKey() : '')
              || (localStorage.getItem('pmg_gemini_key') || '').trim()
              || PMG_GLOBAL_FALLBACK_KEY;
  const base64Data = await readFileAsBase64(file);

  if (typeof onStatus === 'function') {
    onStatus(`Analyzing ${file.name} layout & extracting line items via Gemini AI…`);
  }

  const prompt = `
You are an expert pharmaceutical invoice parser for Malaysian pharmacy chains (e.g. PMG Pharmacy).
Analyze this Malaysian pharmaceutical invoice document carefully.

CRITICAL INVOICE LAYOUT & LINE ASSOCIATION RULES:
Malaysian pharmaceutical invoices (e.g. Apex Pharmacy, DKSH, Zuellig Pharma, Hovid, Xepa, Novugen, CCM, Inova, Sung Hoe, etc.) format line items across TWO (or more) horizontal lines:
- LINE 1 (Product Line): [Line #]  [Item Code]  [Product Description / Medicine Name]  ...  [Billed / Delivered Quantity]
- LINE 2 (Sub-Line):     Lot No. : [Batch Number]   Expiration Date :[DD-MM-YY]

1. THE LOT NUMBER AND EXPIRATION DATE ARE ALWAYS PRINTED ON THE LINE IMMEDIATELY *BELOW* (UNDERNEATH) THE PRODUCT DESCRIPTION:
   - They belong strictly to the product printed DIRECTLY ABOVE them.
   - **NEVER** pair a product with the Lot No. / Expiration Date printed above it!
   - Example 1 (DO NOT SHIFT ROWS):
     113229  VICIDE 5% CREAM 10GM
     Lot No. : 2510018 Expiration Date :31-10-28
     131741  VOZAN 20MG TAB 10'S - NOVUGEN
     Lot No. : 26126A1 Expiration Date :29-02-28
     -> Correct pairing for VICIDE (113229): Batch "2510018", Expiry "31/10/2028".
     -> Correct pairing for VOZAN (131741): Batch "26126A1", Expiry "29/02/2028".
     (DO NOT assign the 31-10-28 from the line above Vozan to Vozan! Vozan's expiry is 29-02-28 printed on the line BELOW it).

   - Example 2 (ROSUVID & QUANTITY MATCHING):
     77  101426  HOVID HOVASC 5MG TAB 10'SX10                                  17
         Lot No. : CF12600 Expiration Date :30-11-28
     78  143036  HOVID ROSUVID 20MG TAB 10'SX3                                  4
         Lot No. : CG03515 Expiration Date :28-02-29
     79  103310  HYDRINATE 50MG TAB 10'S                                       15
         Lot No. : 2510353 Expiration Date :30-09-28
     -> Correct pairing for HOVID ROSUVID (Item Code 143036):
        * Description: "HOVID ROSUVID 20MG TAB 10'SX3"
        * Quantity: 4 (from the same horizontal line on the right column).
        * Batch / Lot: "CG03515" (from the line directly BELOW it).
        * Expiry Date: "28/02/2029" (from "28-02-29" printed directly BELOW it. "28" is Day 28, "02" is Feb, "29" is Year 2029).
     (DO NOT assign the batch/expiry or quantity from line 77 or line 76 to Rosuvid!).

2. QUANTITY ASSOCIATION:
   - The billed/delivered quantity is printed on the SAME HORIZONTAL LINE as the Item Code and Product Description, usually in the rightmost column (e.g. Qty, Billed Qty, Invoice Qty).
   - In Example 2 above, HOVID ROSUVID on Line 78 has Quantity 4. Do NOT take quantity from another row (like 11, 13, 17, or 15).

3. EXPIRATION DATE CONVERSION (DD-MM-YY to DD/MM/YYYY):
   - Malaysian invoices write dates as DD-MM-YY (Day-Month-Year):
     * "28-02-29" -> Day 28, Month 02 (February), Year 2029 -> "28/02/2029".
     * "30-11-28" -> Day 30, Month 11 (November), Year 2028 -> "30/11/2028".
     * "29-02-28" -> Day 29, Month 02 (February), Year 2028 -> "29/02/2028".
     * "30-07-27" -> Day 30, Month 07 (July), Year 2027 -> "30/07/2027".
     * "31-01-28" -> Day 31, Month 01 (January), Year 2028 -> "31/01/2028".
     * "31-12-28" -> Day 31, Month 12 (December), Year 2028 -> "31/12/2028".
     * "09-05-27" -> Day 09, Month 05 (May), Year 2027 -> "09/05/2027".
   - If Month/Year format (e.g. "10/28" or "OCT-28"), output last day of month -> "31/10/2028".
   - Always output 4-digit year (YYYY) between 2026 and 2035.

4. MULTI-LINE DESCRIPTIONS:
   - If a product description wraps across 2 lines before the Lot No. line (e.g. "VENTOLIN EVOHALER 100 MG 200" on line 1, "DOSES BOT" on line 2, followed by "Lot No. : J42R Expiration Date :09-05-27"), concatenate the description lines into "VENTOLIN EVOHALER 100 MG 200 DOSES BOT". The Lot No. directly below it belongs to that item.

FIELDS TO OUTPUT FOR EACH ITEM:
- "itemCode": Internal product code or SKU (typically 4-8 digits like "143036", "131741" or alphanumeric). If not found, output "N/A".
- "itemDescription": Full product or medicine name with strength/form if shown (e.g., "HOVID ROSUVID 20MG TAB 10'SX3", "VOZAN 20MG TAB 10'S - NOVUGEN").
- "batchNumber": Look for Batch / Lot / Lot No. printed on the sub-line BELOW the product name. If none, output "N/A".
- "expiryDate": The product's shelf-life expiration date, strictly formatted as "DD/MM/YYYY" (e.g., "28/02/2029").
- "quantity": Billed or delivered quantity as a positive number (e.g., 4).

Return ONLY a valid JSON array of objects. No markdown formatting, no explanations.
`;

  const modelsToTry = [
    EXPIRY_OCR_PRIMARY_MODEL,
    EXPIRY_OCR_SECONDARY_MODEL,
    EXPIRY_OCR_TERTIARY_MODEL,
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];
  let items = null;
  let successfulModel = '';
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      if (typeof onStatus === 'function') onStatus(`Extracting ${file.name} with ${model}…`);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type || 'application/pdf',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      };

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (resData.error || !resData.candidates || resData.candidates.length === 0) {
        throw new Error(resData.error?.message || `Model ${model} returned empty response.`);
      }

      const rawText = resData.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
        successfulModel = model;
        break;
      }
    } catch (err) {
      console.warn(`[PMG Expiry] ${model} attempt failed on ${file.name}:`, err);
      lastError = err;
    }
  }

  if (!items || items.length === 0) {
    throw lastError || new Error(`No stock items were identified in ${file.name}.`);
  }

  // Attach metadata and run heuristic validation
  return items.map((it, idx) => {
    const rawExp = it.expiryDate || '';
    const parsedExp = parseExpiryDate(rawExp);
    const formattedExp = formatExpiryDateDisplay(parsedExp || rawExp);

    let isAutoCorrected = false;
    let isShortDated = false;
    let isAmbiguous = false;

    if (parsedExp) {
      const horizon = calculateExpiryHorizon(parsedExp);
      if (horizon.monthsLeft < 6) isShortDated = true;
      const parts = String(rawExp).replace(/[-.]/g, '/').split('/');
      if (parts.length === 3 && parseInt(parts[2], 10) < 100 && parseInt(parts[0], 10) >= 26) {
        isAutoCorrected = true;
      }
    } else {
      isAmbiguous = true;
    }

    const generatedId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${idx}`;
    return {
      rowId: generatedId,
      tempId: generatedId,
      branch: branch || 'Kota Sentosa',
      batchNumber: cleanNumericFloatString(it.batchNumber),
      itemCode: cleanNumericFloatString(it.itemCode),
      itemDescription: it.itemDescription || it.itemName || 'Item',
      expiryDate: formattedExp,
      quantity: Math.max(1, parseFloat(it.quantity) || 1),
      sourceFile: file.name,
      status: 'Active',
      selected: true,
      autoCorrected: isAutoCorrected,
      isShortDated: isShortDated,
      isAmbiguous: isAmbiguous,
      ocrModel: successfulModel
    };
  });
}

/**
 * Master Batch Handler for both Invoices and Credit Notes.
 * 1. Automatically saves documents into company OneDrive following Accounts SOP:
 *    [Branch] -> [Year] -> [Month] -> [Invoices | Credit Note] -> [Vendor] -> [Filename]
 * 2. If Credit Note (CN): Completely OMITS Gemini OCR extraction to save tokens and time.
 * 3. If Invoice (INV): Saves to OneDrive AND extracts batch/expiry items via Gemini AI.
 * 4. Updates Accounts Department Submission panel in real time.
 */
async function handleBatchInvoiceAndCnUpload(files, branch) {
  if (!files || files.length === 0) return;

  const statusEl = document.getElementById('expiryOcrStatus');
  const spinnerEl = document.getElementById('expiryOcrSpinner');
  if (spinnerEl) spinnerEl.classList.remove('hidden');

  const fileList = Array.from(files);
  const totalFiles = fileList.length;
  let cnCount = 0;
  let invCount = 0;
  let oneDriveSavedCount = 0;
  const invoicesToExtract = [];

  const targetBranch = branch || document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';

  for (let i = 0; i < totalFiles; i++) {
    const file = fileList[i];
    const parsed = parseInvoiceOrCnFilename(file.name);

    if (statusEl) {
      statusEl.textContent = `[${i + 1}/${totalFiles}] Saving to OneDrive: ${file.name}…`;
    }

    // Auto-save to OneDrive if OneDrive sync engine is active
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveInvoiceOrCnToOneDrive === 'function') {
      try {
        const res = await window.pmgOneDriveSync.saveInvoiceOrCnToOneDrive(file, targetBranch, parsed);
        if (res && res.success) {
          oneDriveSavedCount++;
        }
      } catch (err) {
        console.warn(`[PMG Expiry] OneDrive save error on ${file.name}:`, err);
      }
    }

    if (parsed.isCreditNote) {
      cnCount++;
      console.log(`[PMG Expiry] Credit Note detected: ${file.name} -> Filed to OneDrive Credit Note/${parsed.vendor}/. Expiry OCR omitted.`);
    } else {
      invCount++;
      invoicesToExtract.push({ file, parsed });
    }
  }

  // Refresh Accounts Submission Bar
  updateAccountsShareUi(targetBranch);

  // If there are invoices that require OCR extraction
  if (invoicesToExtract.length > 0) {
    pendingOcrItems = [];
    const sourceNames = [];

    for (let j = 0; j < invoicesToExtract.length; j++) {
      const { file } = invoicesToExtract[j];
      try {
        const extractedItems = await extractInvoiceItemsFromPdf(
          file,
          targetBranch,
          (msg) => { if (statusEl) statusEl.textContent = `[Invoice ${j + 1}/${invoicesToExtract.length}] ${msg}`; }
        );
        if (Array.isArray(extractedItems) && extractedItems.length > 0) {
          pendingOcrItems.push(...extractedItems);
          sourceNames.push(file.name);
        }
      } catch (ocrErr) {
        console.error(`[PMG Expiry] OCR extraction error on ${file.name}:`, ocrErr);
      }
    }

    if (spinnerEl) spinnerEl.classList.add('hidden');

    if (pendingOcrItems.length > 0) {
      // Consolidate repeated items across uploaded invoices with same product, batch, and canonical expiry
      pendingOcrItems = consolidatePendingOcrItems(pendingOcrItems);
      const msg = `✓ Extracted & consolidated ${pendingOcrItems.length} items from ${sourceNames.length} invoice(s).` +
        (cnCount > 0 ? ` (${cnCount} CN(s) saved to OneDrive with OCR omitted per SOP)` : '');
      if (statusEl) {
        statusEl.textContent = msg;
        statusEl.className = 'text-xs text-emerald-700 font-semibold';
      }
      showExpiryToast(`✅ ${pendingOcrItems.length} line items ready for review!`);
      openOcrReviewModal(sourceNames.length === 1 ? sourceNames[0] : `${sourceNames.length} Invoices (${pendingOcrItems.length} Items)`);
    } else {
      if (statusEl) {
        statusEl.textContent = `Upload complete. ${cnCount} CN(s) & ${invCount} Invoice(s) filed to OneDrive. No inventory items extracted.`;
        statusEl.className = 'text-xs text-gray-600 font-semibold';
      }
    }
  } else {
    // Only Credit Notes were uploaded
    if (spinnerEl) spinnerEl.classList.add('hidden');
    if (statusEl) {
      statusEl.textContent = `✓ ${cnCount} Credit Note(s) filed to OneDrive Credit Note folder! Expiry OCR check omitted per SOP.`;
      statusEl.className = 'text-xs text-emerald-700 font-semibold';
    }
    showExpiryToast(`✅ ${cnCount} Credit Note(s) saved to OneDrive Credit Note folder (OCR omitted per SOP).`);
  }
}

/**
 * Backwards compatibility wrapper for single-file calls.
 */
async function handleInvoicePdfExtraction(file, branch) {
  return handleBatchInvoiceAndCnUpload([file], branch);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── REVIEW & COMMIT OCR ITEMS ───────────────────────────────────────────────
function openOcrReviewModal(fileName) {
  const modal = document.getElementById('expiryOcrModal');
  if (!modal) return;

  const titleEl = document.getElementById('expiryOcrFileName');
  if (titleEl) titleEl.textContent = fileName;

  renderOcrReviewRows();
  modal.classList.remove('hidden');
}

function closeOcrReviewModal() {
  const modal = document.getElementById('expiryOcrModal');
  if (modal) modal.classList.add('hidden');
  pendingOcrItems = [];
}

function renderOcrReviewRows() {
  const tbody = document.getElementById('expiryOcrTbody');
  if (!tbody) return;

  if (pendingOcrItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">No items available.</td></tr>`;
    return;
  }

  tbody.innerHTML = pendingOcrItems.map((it, idx) => `
    <tr class="border-b hover:bg-blue-50/40 text-xs sm:text-sm">
      <td class="p-2.5 text-center">
        <input type="checkbox" ${it.selected ? 'checked' : ''} onchange="togglePendingItemSelect(${idx}, this.checked)" class="rounded text-blue-600">
      </td>
      <td class="p-2.5 font-mono text-gray-500 font-bold">
        <input type="text" value="${escHtml(it.itemCode)}" onchange="updatePendingItemField(${idx}, 'itemCode', this.value)" class="w-20 px-1.5 py-1 border rounded font-mono">
      </td>
      <td class="p-2.5">
        <input type="text" value="${escHtml(it.itemDescription)}" onchange="updatePendingItemField(${idx}, 'itemDescription', this.value)" class="w-full px-2 py-1 border rounded">
      </td>
      <td class="p-2.5 font-mono">
        <input type="text" value="${escHtml(it.batchNumber)}" onchange="updatePendingItemField(${idx}, 'batchNumber', this.value)" class="w-24 px-1.5 py-1 border rounded font-mono">
      </td>
      <td class="p-2.5 text-center">
        <input type="text" value="${escHtml(it.expiryDate)}" onchange="updatePendingItemField(${idx}, 'expiryDate', this.value)" class="w-28 px-1.5 py-1 border ${it.isShortDated || it.isAmbiguous ? 'border-amber-400 bg-amber-50/60' : 'border-blue-200'} rounded text-center font-bold text-blue-700 font-mono text-xs">
        <div class="flex items-center justify-center gap-1 mt-1">
          ${it.autoCorrected ? `
            <span class="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5" title="Inverted format auto-corrected (Year & Day resolved)">
              <i class="fa-solid fa-wand-magic-sparkles text-[8px]"></i> Auto-Fixed
            </span>
          ` : it.isShortDated ? `
            <span class="text-[9px] text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5" title="Short-dated stock (< 6 months)">
              <i class="fa-solid fa-triangle-exclamation text-[8px]"></i> Short-Dated
            </span>
          ` : `
            <span class="text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
              <i class="fa-solid fa-check text-[8px]"></i> AI Verified
            </span>
          `}
        </div>
      </td>
      <td class="p-2.5 text-center">
        <input type="number" min="1" value="${it.quantity}" onchange="updatePendingItemField(${idx}, 'quantity', this.value)" class="w-16 px-1.5 py-1 border rounded text-center font-bold">
      </td>
      <td class="p-2.5 text-center">
        <button onclick="removePendingOcrItem(${idx})" class="text-rose-500 hover:text-rose-700 p-1" title="Remove item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function togglePendingItemSelect(idx, checked) {
  if (pendingOcrItems[idx]) pendingOcrItems[idx].selected = checked;
}

function updatePendingItemField(idx, field, value) {
  if (pendingOcrItems[idx]) {
    if (field === 'quantity') {
      pendingOcrItems[idx][field] = parseFloat(value) || 0;
    } else {
      pendingOcrItems[idx][field] = value.trim();
    }
  }
}

function removePendingOcrItem(idx) {
  pendingOcrItems.splice(idx, 1);
  renderOcrReviewRows();
}

async function confirmOcrBatchInsert(itemsToCommit = null) {
  const selectedItems = Array.isArray(itemsToCommit) ? itemsToCommit : pendingOcrItems.filter(it => it.selected);
  if (selectedItems.length === 0) {
    alert('Please select at least one item to save.');
    return;
  }

  const branchSelect = document.getElementById('expiryOcrBranchSelect');
  const targetBranch = branchSelect ? branchSelect.value : 'Kota Sentosa';

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();
  const userName = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  // Consolidate selected items first so repeated lines within the batch are combined
  const consolidated = consolidatePendingOcrItems(selectedItems);

  const itemsToInsert = [];
  const itemsToUpdateInSheets = [];

  consolidated.forEach((it, idx) => {
    it.branch = targetBranch;
    it.lastUpdated = nowIso;
    it.updatedBy = userName;

    // Check if an existing item in expiryItems matches:
    // SAME branch, SAME product, SAME batch, and SAME canonical expiry date!
    const existing = expiryItems.find(ex => areExpiryItemsSameProductAndBatch(ex, it));

    if (existing) {
      // MATCH FOUND: Add quantities together!
      const addedQty = Number(it.quantity) || 0;
      existing.quantity = (Number(existing.quantity) || 0) + addedQty;

      // If it was previously Cleared or DONE, reactivate with the incoming stock
      if (existing.quantity > 0 && (existing.status === 'Cleared' || existing.status === 'DONE')) {
        existing.status = 'Active';
        delete existing.clearedAt;
      }
      existing.lastUpdated = nowIso;
      existing.updatedBy = userName;
      if (it.sourceFile && !String(existing.sourceFile || '').includes(it.sourceFile)) {
        existing.sourceFile = `${existing.sourceFile || ''}, ${it.sourceFile}`.replace(/^,\s*/, '');
      }
      itemsToUpdateInSheets.push(existing);
    } else {
      // DIFFERENT batch or DIFFERENT expiry date: keep as a NEW, separate item!
      if (!it.rowId || String(it.rowId) === 'undefined') {
        it.rowId = it.tempId || `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${idx}`;
      }
      it.status = it.status || 'Active';
      itemsToInsert.push(it);
    }
  });

  const commitBtn = document.getElementById('expiryOcrCommitBtn');
  if (commitBtn) {
    commitBtn.disabled = true;
    commitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Saving to Google Sheet...`;
  }

  // 1. Insert new items and heal/re-consolidate dataset
  if (itemsToInsert.length > 0) {
    expiryItems.unshift(...itemsToInsert);
  }
  expiryItems = ensureUniqueExpiryRowIds(expiryItems);
  saveLocalExpiryData();
  renderExpiryUI();

  // 2. Save to OneDrive
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(targetBranch).catch(console.warn);
  }

  // 3. Push updates to Google Sheet
  // For merged existing items: update quantity in Sheets
  for (const upItem of itemsToUpdateInSheets) {
    pushExpiryUpdateToSheets(upItem.rowId, upItem.quantity, upItem.status, upItem.expiryDate, {
      branch: upItem.branch,
      batchNumber: upItem.batchNumber,
      itemCode: upItem.itemCode,
      itemDescription: upItem.itemDescription
    }).catch(console.warn);
  }
  // For new items: batch insert
  let ok = true;
  if (itemsToInsert.length > 0) {
    ok = await pushBatchExpiryToSheets(itemsToInsert);
  }

  if (commitBtn) {
    commitBtn.disabled = false;
    commitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-1.5"></i>Confirm & Save to Google Sheet`;
  }

  closeOcrReviewModal();
  const summaryMsg = `✅ Saved ${consolidated.length} line(s) (${itemsToUpdateInSheets.length} merged into existing stock, ${itemsToInsert.length} new items added)!`;
  showExpiryToast(summaryMsg);
}

// ─── EXPIRY DATE & QUANTITY EDITING & CLEARANCE ─────────────────────────────
/**
 * Updates an item's expiry date inline from the table or modal.
 * Validates with parseExpiryDate, re-calculates horizons, updates KPIs, and syncs to Sheets.
 */
function updateExpiryItemDate(rowId, newDateStr, inputEl) {
  const item = findExpiryItemById(rowId);
  if (!item) return;

  const parsed = parseExpiryDate(newDateStr);
  if (!parsed) {
    alert(`⚠️ Invalid expiry date "${newDateStr}". Please enter a valid date (e.g. DD/MM/YYYY, MM/YYYY, or MM/YY).`);
    if (inputEl) {
      inputEl.value = formatExpiryDateDisplay(item.expiryDate);
    }
    return;
  }

  const formattedDate = formatExpiryDateDisplay(parsed);
  const oldDate = formatExpiryDateDisplay(item.expiryDate);
  if (formattedDate === oldDate) {
    if (inputEl) inputEl.value = formattedDate;
    return;
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();
  item.expiryDate = formattedDate;
  item.lastUpdated = nowIso;
  item.updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  saveLocalExpiryData();
  renderExpiryUI();
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }
  pushExpiryUpdateToSheets(item.rowId, item.quantity, item.status, item.expiryDate);
  showExpiryToast(`✅ Expiry date updated to ${formattedDate} (${item.itemDescription || item.itemCode})`);
}

function updateExpiryItemQuantity(rowId, newQty) {
  const item = findExpiryItemById(rowId);
  if (!item) return;

  const val = parseFloat(newQty);
  if (isNaN(val) || val < 0) return;

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();

  item.quantity = val;
  if (val === 0) {
    item.status = 'Cleared';
    item.clearedAt = nowIso;
  } else if (item.status === 'Cleared' && val > 0) {
    item.status = 'Active';
    delete item.clearedAt;
  }

  item.lastUpdated = nowIso;
  item.updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  saveLocalExpiryData();
  renderExpiryUI();
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }
  pushExpiryUpdateToSheets(item.rowId, item.quantity, item.status, item.expiryDate);
}

function getItemActionPlan(it) {
  if (!it) return '';
  const offNum = parseFloat(it.offeredPrice !== undefined ? it.offeredPrice : it.clearancePrice);
  const hasOffer = !isNaN(offNum) && offNum > 0;
  if (it.actionPlan && String(it.actionPlan).trim() !== '') {
    const planStr = String(it.actionPlan).trim();
    if (hasOffer && (planStr.toLowerCase().includes('clearance') || planStr.toLowerCase().includes('promo')) && !/rm\s*[\d.]+/i.test(planStr)) {
      return `Clearance Promo (Offer: RM ${offNum.toFixed(2)})`;
    }
    return planStr;
  }
  if (hasOffer) {
    return `Clearance Promo (Offer: RM ${offNum.toFixed(2)})`;
  }
  const retStatus = getItemHqReturnStatus(it);
  if (retStatus === 'RETURNABLE' || retStatus === 'SPECIAL') {
    return 'Returnable with Condition';
  }
  return '';
}

function updateExpiryActionPlan(rowId, val) {
  const item = findExpiryItemById(rowId);
  if (!item) return;

  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(25000);
  }

  const cleanVal = (val || '').trim();
  const nowIso = new Date().toISOString();
  item.actionPlan = cleanVal;
  item.lastUpdated = nowIso;

  // Extract offeredPrice if present in the plan text (e.g. "Clearance Promo (Offer: RM 8.00)")
  const m = cleanVal.match(/offer:\s*rm\s*([\d.]+)/i) || cleanVal.match(/rm\s*([\d.]+)/i);
  if (m && m[1]) {
    const parsedPrice = parseFloat(m[1]);
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      item.offeredPrice = parsedPrice;
      item.clearancePrice = parsedPrice;
      item.pricingUpdatedAt = nowIso;
    }
  } else if (!cleanVal.toLowerCase().includes('clearance') && !cleanVal.toLowerCase().includes('promo') && item.offeredPrice) {
    delete item.offeredPrice;
    delete item.clearancePrice;
    item.pricingUpdatedAt = nowIso;
  }

  saveLocalExpiryData();
  renderExpiryUI();

  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }
  pushExpiryUpdateToSheets(item.rowId, item.quantity, item.status, item.expiryDate, {
    actionPlan: item.actionPlan,
    offeredPrice: item.offeredPrice,
    clearancePrice: item.clearancePrice
  });

  // If user selected Clearance Promo (and didn't manually type a price inside the text), open the price tag modal for THIS exact item!
  if ((cleanVal.toLowerCase().includes('clearance') || cleanVal.toLowerCase().includes('promo')) && (!item.offeredPrice || !(m && m[1]))) {
    openClearancePriceTagModal(item);
  }
}

async function markExpiryItemCleared(rowId) {
  const target = findExpiryItemById(rowId);
  if (!target) return;

  // 1. Race condition prevention: Pause background auto-polling for 15 seconds
  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(15000);
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();
  const userName = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';
  const targetKey = getExpiryItemKey(target);
  const targetIdStr = target.rowId !== undefined && target.rowId !== null ? String(target.rowId).trim() : '';

  // Add specific row & batch/expiry key to persistent tombstone set permanently (never bare itemCode, which would clear future batches!)
  if (targetIdStr && targetIdStr !== 'undefined' && targetIdStr !== 'null') {
    addClearedExpiryKey(`ROW_${targetIdStr}`);
  }
  if (targetKey) addClearedExpiryKey(targetKey);

  // Mark matching rows with same rowId OR same exact (branch, itemCode, batch, expiryDate) as cleared
  expiryItems.forEach(it => {
    if (!it) return;
    const itIdStr = it.rowId !== undefined && it.rowId !== null ? String(it.rowId).trim() : '';
    const isSameId = targetIdStr && targetIdStr !== 'undefined' && itIdStr === targetIdStr;
    const isSameKey = targetKey && (getExpiryItemKey(it) === targetKey);
    if (isSameId || isSameKey) {
      it.status = 'DONE';
      it.quantity = 0;
      it.clearedAt = nowIso;
      it.lastUpdated = nowIso;
      it.updatedBy = userName;
    }
  });

  saveLocalExpiryData();
  renderExpiryUI();

  // 2. Persist to OneDrive immediately so other connected computers sync this clearance
  try {
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
      window.pmgOneDriveSync.saveStockExpiryToOneDrive(target.branch).catch(console.warn);
    }
  } catch (odErr) {
    console.warn('[markExpiryItemCleared] OneDrive sync notice:', odErr);
  }

  // 3. Persist to connected Google Sheet
  try {
    await pushExpiryUpdateToSheets(target.rowId, 0, 'DONE', target.expiryDate, {
      branch: target.branch,
      itemCode: target.itemCode,
      itemDescription: target.itemDescription,
      batchNumber: target.batchNumber
    });
    showExpiryToast(`✅ Marked ${target.itemDescription || target.itemCode} as DONE and persisted!`);
  } catch (err) {
    console.warn('[markExpiryItemCleared] Cloud sheet notice (persisted locally & in tombstone):', err);
    // DO NOT ROLL BACK. Local clearance is authoritative and tombstoned permanently.
    showExpiryToast(`✅ Marked ${target.itemDescription || target.itemCode} as DONE (Saved locally & queued for cloud sync)`);
  }
}

async function reactivateExpiryItem(rowId) {
  const item = findExpiryItemById(rowId);
  if (!item) return;

  const qtyStr = prompt(`Enter restored quantity for ${item.itemDescription || item.itemCode}:`, '1');
  const qty = parseFloat(qtyStr);
  if (isNaN(qty) || qty <= 0) return;

  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(5000);
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();

  // Remove from cleared tombstone
  if (item.itemCode) removeClearedExpiryKey(item.itemCode);
  if (item.rowId) removeClearedExpiryKey(`ROW_${item.rowId}`);
  const itemKey = getExpiryItemKey(item);
  if (itemKey) removeClearedExpiryKey(itemKey);

  item.status = 'Active';
  item.quantity = qty;
  delete item.clearedAt;
  item.lastUpdated = nowIso;
  item.updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  saveLocalExpiryData();
  renderExpiryUI();
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }
  try {
    await pushExpiryUpdateToSheets(item.rowId, item.quantity, 'Active', item.expiryDate);
    showExpiryToast(`Restored item with quantity ${qty}.`);
  } catch (err) {
    showExpiryToast(`⚠️ Item restored locally; sheet update notice: ${err.message}`);
  }
}

function openEditExpiryItemModal(rowId) {
  const item = findExpiryItemById(rowId);
  if (!item) return;

  const modal = document.getElementById('expiryEditModal');
  if (!modal) return;

  const editRowId = document.getElementById('editRowId');
  const editBranch = document.getElementById('editBranch');
  const editItemCode = document.getElementById('editItemCode');
  const editItemDesc = document.getElementById('editItemDesc');
  const editBatch = document.getElementById('editBatch');
  const editQty = document.getElementById('editQty');
  const editExpiry = document.getElementById('editExpiry');

  if (editRowId) editRowId.value = item.rowId;
  if (editBranch) editBranch.value = item.branch || 'Kota Sentosa';
  if (editItemCode) editItemCode.value = item.itemCode || '';
  if (editItemDesc) editItemDesc.value = item.itemDescription || '';
  if (editBatch) editBatch.value = item.batchNumber || '';
  if (editQty) editQty.value = item.quantity;
  if (editExpiry) editExpiry.value = formatExpiryDateDisplay(item.expiryDate);

  const editActionPlan = document.getElementById('editActionPlan');
  const editOfferedPrice = document.getElementById('editOfferedPrice');
  if (editActionPlan) editActionPlan.value = item.actionPlan || '';
  if (editOfferedPrice) editOfferedPrice.value = item.offeredPrice !== undefined ? item.offeredPrice : '';

  modal.classList.remove('hidden');
}

function closeEditExpiryItemModal() {
  const modal = document.getElementById('expiryEditModal');
  if (modal) modal.classList.add('hidden');
}

async function handleEditExpiryItemSubmit(e) {
  e.preventDefault();
  const rowId = document.getElementById('editRowId')?.value;
  const item = findExpiryItemById(rowId);
  if (!item) return;

  const branch = document.getElementById('editBranch')?.value;
  const itemCode = document.getElementById('editItemCode')?.value.trim();
  const itemDescription = document.getElementById('editItemDesc')?.value.trim();
  const batchNumber = document.getElementById('editBatch')?.value.trim();
  const qtyVal = parseFloat(document.getElementById('editQty')?.value);
  const expiryRaw = document.getElementById('editExpiry')?.value.trim();

  const actionPlanVal = document.getElementById('editActionPlan')?.value.trim();
  const offeredPriceRaw = document.getElementById('editOfferedPrice')?.value.trim();
  const offeredPriceVal = parseFloat(offeredPriceRaw);

  const parsed = parseExpiryDate(expiryRaw);
  if (!parsed) {
    alert(`⚠️ Invalid expiry date "${expiryRaw}". Please enter a valid date (e.g. DD/MM/YYYY, MM/YYYY, or MM/YY).`);
    return;
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();

  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(25000);
  }

  const formattedDate = formatExpiryDateDisplay(parsed);
  item.branch = branch;
  item.itemCode = itemCode;
  item.itemDescription = itemDescription;
  item.batchNumber = batchNumber;
  item.quantity = isNaN(qtyVal) ? item.quantity : qtyVal;
  item.expiryDate = formattedDate;

  if (actionPlanVal !== undefined) item.actionPlan = actionPlanVal;
  if (!isNaN(offeredPriceVal) && offeredPriceVal >= 0) {
    item.offeredPrice = offeredPriceVal;
    item.clearancePrice = offeredPriceVal;
    item.pricingUpdatedAt = nowIso;
    if (!item.actionPlan || item.actionPlan.toLowerCase().includes('clearance') || item.actionPlan.toLowerCase().includes('promo')) {
      item.actionPlan = `Clearance Promo (Offer: RM ${offeredPriceVal.toFixed(2)})`;
    }
  } else if (offeredPriceRaw === '') {
    delete item.offeredPrice;
    delete item.clearancePrice;
    item.pricingUpdatedAt = nowIso;
  }

  if (item.quantity === 0) {
    item.status = 'Cleared';
    item.clearedAt = nowIso;
  } else if (item.status === 'Cleared' && item.quantity > 0) {
    item.status = 'Active';
    delete item.clearedAt;
  }
  item.lastUpdated = nowIso;
  item.updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  saveLocalExpiryData();
  renderExpiryUI();
  closeEditExpiryItemModal();

  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }

  pushExpiryUpdateToSheets(item.rowId, item.quantity, item.status, item.expiryDate, {
    branch: item.branch,
    itemCode: item.itemCode,
    itemDescription: item.itemDescription,
    batchNumber: item.batchNumber,
    actionPlan: item.offeredPrice ? `Clearance Promo (Offer: RM ${item.offeredPrice.toFixed(2)})` : item.actionPlan,
    offeredPrice: item.offeredPrice,
    clearancePrice: item.clearancePrice
  });

  showExpiryToast(`✅ Saved changes for ${item.itemDescription || item.itemCode}`);
}

// ─── ATTRACTIVE CLEARANCE PRICE TAG & PROMO LABEL ENGINE ──────────────────────
let activePriceTagItem = null;

function generateBarcodeSvg(code, height = 11) {
  const safeCode = String(code || '100000').replace(/[^a-zA-Z0-9]/g, '') || '100000';
  let bars = `<rect width="2" height="${height}" x="0" fill="#000" /><rect width="1" height="${height}" x="4" fill="#000" />`;
  let x = 7;
  for (let i = 0; i < safeCode.length; i++) {
    const c = safeCode.charCodeAt(i);
    const w1 = (c % 3) + 1;
    const w2 = ((c >> 1) % 2) + 1;
    bars += `<rect width="${w1}" height="${height}" x="${x}" fill="#000" />`;
    x += w1 + ((c % 2) + 1);
    bars += `<rect width="${w2}" height="${height}" x="${x}" fill="#000" />`;
    x += w2 + 2;
  }
  bars += `<rect width="2" height="${height}" x="${x}" fill="#000" /><rect width="1" height="${height}" x="${x + 4}" fill="#000" />`;
  const totalW = x + 6;
  return `<svg viewBox="0 0 ${totalW} ${height}" style="width: 100%; height: ${height}px; display: block;" preserveAspectRatio="none">${bars}</svg>`;
}

function renderSinglePriceTagMarkup(item, opts = {}) {
  const theme = opts.theme || 'flame';
  const banner = opts.banner || '🔥 CLEARANCE SALE';
  const size = opts.size || 'compact'; // 'compact', 'medium', 'shelf', 'mini'
  const offeredPrice = parseFloat(opts.offeredPrice !== undefined ? opts.offeredPrice : (item?.offeredPrice || 0));
  const normalPrice = parseFloat(opts.normalPrice !== undefined ? opts.normalPrice : (item?.normalPrice || 0));
  const footerNote = opts.footerNote !== undefined ? opts.footerNote : '* While Stocks Last · Short Expiry Deal';
  const showBarcode = opts.showBarcode !== undefined ? Boolean(opts.showBarcode) : true;
  const forPrint = Boolean(opts.forPrint);

  const branch = (item?.branch || 'Kota Sentosa').toUpperCase();
  const sku = item?.itemCode || 'N/A';
  const batch = item?.batchNumber || 'N/A';
  const expiry = formatExpiryDateDisplay(item?.expiryDate || 'N/A');
  const desc = (item?.itemDescription || `ITEM CODE: ${sku}`).trim();

  // Price formatting
  const priceFormatted = offeredPrice > 0 ? offeredPrice.toFixed(2) : '0.00';
  const priceParts = priceFormatted.split('.');
  const wholePart = priceParts[0];
  const decimalPart = priceParts[1] || '00';

  // Discount calculation
  let hasDiscount = (normalPrice > offeredPrice && offeredPrice > 0);
  let discountPct = hasDiscount ? Math.round(((normalPrice - offeredPrice) / normalPrice) * 100) : 0;

  // Sizing definitions in exact mm for print, px for screen
  let widthCss = '240px';
  let heightCss = '168px';
  let bannerFontSize = '10.5px';
  let titleFontSize = '9px';
  let priceMainFontSize = '24px';
  let barcodeHeight = 10;

  if (size === 'medium') {
    // 70mm x 45mm (Shelf Tag)
    widthCss = forPrint ? '70mm' : '290px';
    heightCss = forPrint ? '45mm' : '190px';
    bannerFontSize = forPrint ? '9.5pt' : '12px';
    titleFontSize = forPrint ? '8pt' : '10.5px';
    priceMainFontSize = forPrint ? '25pt' : '30px';
    barcodeHeight = 12;
  } else if (size === 'shelf') {
    // 90mm x 55mm (Large Display / Gondola Talker)
    widthCss = forPrint ? '90mm' : '350px';
    heightCss = forPrint ? '55mm' : '215px';
    bannerFontSize = forPrint ? '11.5pt' : '14px';
    titleFontSize = forPrint ? '9.5pt' : '12px';
    priceMainFontSize = forPrint ? '30pt' : '36px';
    barcodeHeight = 14;
  } else if (size === 'mini') {
    // 40mm x 25mm (Mini Box / Tube)
    widthCss = forPrint ? '40mm' : '190px';
    heightCss = forPrint ? '25mm' : '125px';
    bannerFontSize = forPrint ? '6.5pt' : '8.5px';
    titleFontSize = forPrint ? '6pt' : '8px';
    priceMainFontSize = forPrint ? '16pt' : '19px';
    barcodeHeight = 8;
  } else {
    // compact: 50mm x 35mm (Standard Box Sticker)
    widthCss = forPrint ? '50mm' : '240px';
    heightCss = forPrint ? '35mm' : '168px';
    bannerFontSize = forPrint ? '7.5pt' : '10.5px';
    titleFontSize = forPrint ? '6.8pt' : '9px';
    priceMainFontSize = forPrint ? '19pt' : '24px';
    barcodeHeight = 10;
  }

  // Theme palettes
  let borderColor = '#b91c1c';
  let bannerBg = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
  let bannerColor = '#ffffff';
  let bannerBorder = '#f59e0b';
  let metaBg = '#fef2f2';
  let metaColor = '#991b1b';
  let cardBg = '#ffffff';
  let titleColor = '#111827';
  let expiryBg = '#fee2e2';
  let expiryColor = '#b91c1c';
  let expiryBorder = '#fca5a5';
  let priceBoxBg = '#fef3c7';
  let priceBoxBorder = '#f59e0b';
  let priceColor = '#b91c1c';
  let tagShadow = forPrint ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)';

  if (theme === 'pmg') {
    borderColor = '#047857';
    bannerBg = 'linear-gradient(135deg, #059669 0%, #065f46 100%)';
    bannerColor = '#ffffff';
    bannerBorder = '#10b981';
    metaBg = '#ecfdf5';
    metaColor = '#065f46';
    cardBg = '#ffffff';
    titleColor = '#0f172a';
    expiryBg = '#ecfdf5';
    expiryColor = '#047857';
    expiryBorder = '#a7f3d0';
    priceBoxBg = '#f0fdf4';
    priceBoxBorder = '#10b981';
    priceColor = '#047857';
  } else if (theme === 'neon') {
    borderColor = '#000000';
    bannerBg = '#000000';
    bannerColor = '#fef08a';
    bannerBorder = '#dc2626';
    metaBg = '#dc2626';
    metaColor = '#ffffff';
    cardBg = '#fef08a';
    titleColor = '#000000';
    expiryBg = '#000000';
    expiryColor = '#ffffff';
    expiryBorder = '#000000';
    priceBoxBg = '#ffffff';
    priceBoxBorder = '#000000';
    priceColor = '#dc2626';
  } else if (theme === 'mono') {
    borderColor = '#111827';
    bannerBg = '#111827';
    bannerColor = '#ffffff';
    bannerBorder = '#374151';
    metaBg = '#f3f4f6';
    metaColor = '#111827';
    cardBg = '#ffffff';
    titleColor = '#000000';
    expiryBg = '#111827';
    expiryColor = '#ffffff';
    expiryBorder = '#111827';
    priceBoxBg = '#f9fafb';
    priceBoxBorder = '#111827';
    priceColor = '#000000';
  }

  // Discount badge markup
  let discountMarkup = '';
  if (hasDiscount) {
    discountMarkup = `
      <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 0.5px;">
        <span style="font-size: ${size === 'mini' ? '5.5pt' : '7pt'}; font-weight: 700; color: #6b7280; text-decoration: line-through; line-height: 1;">WAS RM ${normalPrice.toFixed(2)}</span>
        <span style="background: ${theme === 'neon' ? '#000000' : '#dc2626'}; color: #ffffff; font-weight: 900; font-size: ${size === 'mini' ? '5.5pt' : '7pt'}; padding: 0.5px 3.5px; border-radius: 2px; letter-spacing: 0.2px; line-height: 1.1;">SAVE ${discountPct}%</span>
      </div>
    `;
  } else {
    discountMarkup = `
      <span style="font-size: ${size === 'mini' ? '6pt' : '7.5pt'}; font-weight: 900; color: ${priceColor}; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1;">
        ★ SPECIAL OFFER
      </span>
    `;
  }

  // Barcode / Footer row
  let bottomMarkup = '';
  if (showBarcode && size !== 'mini') {
    bottomMarkup = `
      <div style="margin-top: 1px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
        ${generateBarcodeSvg(sku, barcodeHeight)}
        <div style="font-size: 5.5pt; font-family: monospace; font-weight: 700; color: #4b5563; line-height: 1; letter-spacing: 0.5px; margin-top: 0.5px;">* ${escHtml(sku)} *</div>
      </div>
    `;
  } else if (footerNote && size !== 'mini') {
    bottomMarkup = `
      <div style="font-size: 6pt; color: #6b7280; text-align: center; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; margin-top: 1px; flex-shrink: 0;">
        ${escHtml(footerNote)}
      </div>
    `;
  }

  return `
    <div class="pmg-price-tag-card" style="width: ${widthCss}; height: ${heightCss}; box-sizing: border-box; background: ${cardBg}; border: 1.5px solid ${borderColor}; border-radius: 5px; overflow: hidden; display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: ${tagShadow}; position: relative; justify-content: space-between;">
      
      <!-- Top Banner Header -->
      <div style="background: ${bannerBg}; color: ${bannerColor}; padding: ${size === 'mini' ? '1.5px 3px' : '2px 4px'}; text-align: center; font-weight: 900; font-size: ${bannerFontSize}; letter-spacing: 0.5px; text-transform: uppercase; border-bottom: 1.5px solid ${bannerBorder}; line-height: 1.1; flex-shrink: 0;">
        ${escHtml(banner)}
      </div>

      <!-- Main Sticker Core -->
      <div style="padding: ${size === 'mini' ? '1.5px 3px' : '2px 4px'}; flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 0; box-sizing: border-box;">
        
        <!-- Store & Expiry Compact Strip -->
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${size === 'mini' ? '5.5pt' : '6.5pt'}; font-weight: 700; background: ${metaBg}; color: ${metaColor}; padding: 1px 3px; border-radius: 3px; margin-bottom: 1px; flex-shrink: 0; line-height: 1.1;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">PMG · ${escHtml(branch)}</span>
          <span style="background: ${expiryBg}; color: ${expiryColor}; border: 0.5px solid ${expiryBorder}; padding: 0.5px 2.5px; border-radius: 2px; font-weight: 900; white-space: nowrap;">EXP: ${escHtml(expiry)}</span>
        </div>

        <!-- Product Name & SKU -->
        <div style="flex-shrink: 0; margin-bottom: 1px;">
          <div style="font-size: ${titleFontSize}; font-weight: 800; color: ${titleColor}; line-height: 1.15; text-transform: uppercase; max-height: ${size === 'mini' ? '11px' : '21px'}; overflow: hidden; display: -webkit-box; -webkit-line-clamp: ${size === 'mini' ? '1' : '2'}; -webkit-box-orient: vertical;" title="${escHtml(desc)}">
            ${escHtml(desc)}
          </div>
          <div style="font-size: ${size === 'mini' ? '5pt' : '6pt'}; font-family: monospace; font-weight: 700; color: #6b7280; line-height: 1; margin-top: 0.5px;">
            SKU: ${escHtml(sku)} ${batch && batch !== 'N/A' ? `· B: ${escHtml(batch)}` : ''}
          </div>
        </div>

        <!-- Eye-Catching HERO Promotional Price Box -->
        <div style="background: ${priceBoxBg}; border: 1.5px solid ${priceBoxBorder}; border-radius: 4px; padding: ${size === 'mini' ? '1px 3px' : '2px 5px'}; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; margin: 1px 0;">
          <div style="display: flex; align-items: center; gap: 2px;">
            ${discountMarkup}
          </div>
          <div style="display: flex; align-items: baseline; justify-content: flex-end; color: ${priceColor};">
            <span style="font-size: ${size === 'mini' ? '8pt' : '10pt'}; font-weight: 900; margin-right: 1px; line-height: 1;">RM</span>
            <span style="font-size: ${priceMainFontSize}; font-weight: 950; line-height: 0.95; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">${wholePart}</span>
            <span style="font-size: ${size === 'mini' ? '8pt' : '11pt'}; font-weight: 900; line-height: 1;">.${decimalPart}</span>
          </div>
        </div>

        <!-- Vector Barcode or Footer -->
        ${bottomMarkup}

      </div>
    </div>
  `;
}

function openClearancePriceTagModal(rowId) {
  const item = (rowId && typeof rowId === 'object') ? rowId : findExpiryItemById(rowId);
  if (!item) return;
  activePriceTagItem = item;

  const modal = document.getElementById('clearancePriceTagModal');
  if (!modal) return;

  // Populate item details
  const bBadge = document.getElementById('tagModalBranchBadge');
  const iDesc = document.getElementById('tagModalItemDesc');
  const iCode = document.getElementById('tagModalItemCode');
  const iBatch = document.getElementById('tagModalBatch');
  const iExp = document.getElementById('tagModalExpiryPill');
  const iQty = document.getElementById('tagModalStockQty');

  if (bBadge) bBadge.textContent = item.branch || 'Kota Sentosa';
  if (iDesc) iDesc.textContent = item.itemDescription || item.itemCode || 'Product';
  if (iCode) iCode.textContent = item.itemCode || 'N/A';
  if (iBatch) iBatch.textContent = item.batchNumber || 'N/A';
  if (iExp) iExp.textContent = 'EXP: ' + formatExpiryDateDisplay(item.expiryDate);
  if (iQty) iQty.textContent = item.quantity || '0';

  // Populate inputs
  const offInput = document.getElementById('tagOfferedPrice');
  const normInput = document.getElementById('tagNormalPrice');
  const themeSel = document.getElementById('tagThemeSelect');
  const sizeSel = document.getElementById('tagSizeSelect');
  const printTargetSel = document.getElementById('tagPrintTargetSelect');
  const copiesInput = document.getElementById('tagCopiesInput');
  const noteInput = document.getElementById('tagFooterNoteInput');
  const bannerSel = document.getElementById('tagBannerSelect');

  let initialOffered = item.offeredPrice !== undefined ? item.offeredPrice : (item.clearancePrice !== undefined ? item.clearancePrice : '');
  if (initialOffered === '' && item.actionPlan) {
    const m = String(item.actionPlan).match(/offer:\s*rm\s*([\d.]+)/i) || String(item.actionPlan).match(/rm\s*([\d.]+)/i);
    if (m && m[1]) initialOffered = m[1];
  }
  if (offInput) offInput.value = initialOffered;
  if (normInput) normInput.value = item.normalPrice !== undefined ? item.normalPrice : '';
  if (themeSel) themeSel.value = item.tagTheme || 'flame';
  if (sizeSel) sizeSel.value = item.tagSize || 'compact';
  if (printTargetSel) printTargetSel.value = item.tagPrintTarget || 'a4';
  if (copiesInput) copiesInput.value = item.quantity && item.quantity > 0 ? item.quantity : 1;
  if (noteInput) noteInput.value = item.promoRemark || '* While Stocks Last · Short Expiry Deal';
  if (bannerSel && item.promoBanner) bannerSel.value = item.promoBanner;

  updatePriceTagLivePreview();
  modal.classList.remove('hidden');

  setTimeout(() => {
    if (offInput) {
      offInput.focus();
      if (!offInput.value) offInput.select?.();
    }
  }, 100);
}

function closeClearancePriceTagModal() {
  const modal = document.getElementById('clearancePriceTagModal');
  if (modal) modal.classList.add('hidden');
}

function updatePriceTagLivePreview() {
  if (!activePriceTagItem) return;

  const container = document.getElementById('priceTagLiveContainer');
  if (!container) return;

  const offPriceVal = parseFloat(document.getElementById('tagOfferedPrice')?.value) || 0;
  const normPriceVal = parseFloat(document.getElementById('tagNormalPrice')?.value) || 0;
  const theme = document.getElementById('tagThemeSelect')?.value || 'flame';
  const size = document.getElementById('tagSizeSelect')?.value || 'compact';
  const printTarget = document.getElementById('tagPrintTargetSelect')?.value || 'a4';
  const banner = document.getElementById('tagBannerSelect')?.value || '🔥 CLEARANCE SALE';
  const footerNote = document.getElementById('tagFooterNoteInput')?.value || '* While Stocks Last · Short Expiry Deal';
  const showBarcode = false;

  // Discount preview badge on left panel
  const discPill = document.getElementById('tagDiscountPillPreview');
  const discText = document.getElementById('tagDiscountText');
  if (discPill && discText) {
    if (normPriceVal > offPriceVal && offPriceVal > 0) {
      const pct = Math.round(((normPriceVal - offPriceVal) / normPriceVal) * 100);
      const saveAmt = (normPriceVal - offPriceVal).toFixed(2);
      discText.textContent = `Save ${pct}% (RM ${saveAmt})`;
      discPill.classList.remove('hidden');
    } else {
      discPill.classList.add('hidden');
    }
  }

  // Size indicator badge
  const sizeBadge = document.getElementById('tagSizeBadge');
  if (sizeBadge) {
    let dimStr = '50mm × 35mm';
    if (size === 'medium') dimStr = '70mm × 45mm';
    else if (size === 'shelf') dimStr = '90mm × 55mm';
    else if (size === 'mini') dimStr = '40mm × 25mm';

    const targetStr = printTarget === 'thermal' ? '🏷️ Thermal Roll' : '📄 A4 Sheet Grid (✂ Cut Guides)';
    sizeBadge.textContent = `${dimStr} · ${targetStr}`;
  }

  // Render sticker preview
  container.innerHTML = renderSinglePriceTagMarkup(activePriceTagItem, {
    theme,
    banner,
    size,
    offeredPrice: offPriceVal,
    normalPrice: normPriceVal,
    footerNote,
    showBarcode,
    forPrint: false,
    printTarget
  });
}

function quickRoundOfferPrice(mode) {
  const offInput = document.getElementById('tagOfferedPrice');
  if (!offInput) return;
  let val = parseFloat(offInput.value);
  if (isNaN(val) || val <= 0) val = 10;

  if (mode === 'round') {
    val = Math.round(val);
  } else if (mode === '90') {
    val = Math.floor(val) + 0.90;
  } else if (mode === '50') {
    val = Math.floor(val) + 0.50;
  }
  offInput.value = val.toFixed(2);
  updatePriceTagLivePreview();
}

function setTagCopiesToStock() {
  const copiesInput = document.getElementById('tagCopiesInput');
  if (copiesInput && activePriceTagItem) {
    copiesInput.value = activePriceTagItem.quantity && activePriceTagItem.quantity > 0 ? activePriceTagItem.quantity : 1;
    showExpiryToast(`📦 Print copies set to match stock: ${copiesInput.value} unit(s)`);
  }
}

function fillA4SheetCopies() {
  const copiesInput = document.getElementById('tagCopiesInput');
  if (!copiesInput) return;
  const size = document.getElementById('tagSizeSelect')?.value || 'compact';
  let sheetCount = 18;
  if (size === 'medium') sheetCount = 10;
  else if (size === 'shelf') sheetCount = 8;
  else if (size === 'mini') sheetCount = 24;

  copiesInput.value = sheetCount;
  showExpiryToast(`📄 Set to ${sheetCount} copies to fill a complete A4 sheet!`);
}

function saveClearancePriceTag(silent = false) {
  if (!activePriceTagItem) return false;

  const offInput = document.getElementById('tagOfferedPrice');
  const offeredPrice = parseFloat(offInput?.value);

  if (isNaN(offeredPrice) || offeredPrice <= 0) {
    if (!silent) alert('Please enter a valid offered clearance price (RM).');
    return false;
  }

  // 1. Race condition prevention: Pause background auto-polling for 25 seconds
  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(25000);
  }

  const normalPrice = parseFloat(document.getElementById('tagNormalPrice')?.value) || null;
  const theme = document.getElementById('tagThemeSelect')?.value || 'flame';
  const size = document.getElementById('tagSizeSelect')?.value || 'compact';
  const printTarget = document.getElementById('tagPrintTargetSelect')?.value || 'a4';
  const banner = document.getElementById('tagBannerSelect')?.value || '🔥 CLEARANCE SALE';
  const footerNote = document.getElementById('tagFooterNoteInput')?.value || '';
  const nowIso = new Date().toISOString();
  const session = typeof getSession === 'function' ? getSession() : null;
  const updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';
  const formattedPlan = `Clearance Promo (Offer: RM ${offeredPrice.toFixed(2)})`;

  // Ensure activePriceTagItem has a valid unique rowId
  if (!activePriceTagItem.rowId || String(activePriceTagItem.rowId).trim() === '' || String(activePriceTagItem.rowId).trim() === 'undefined') {
    activePriceTagItem.rowId = getExpiryRowUid(activePriceTagItem, Date.now());
  }
  const targetId = String(activePriceTagItem.rowId).trim();
  const targetKey = getExpiryItemKey(activePriceTagItem);

  // Update active item reference
  activePriceTagItem.offeredPrice = offeredPrice;
  activePriceTagItem.clearancePrice = offeredPrice;
  if (normalPrice) activePriceTagItem.normalPrice = normalPrice;
  else delete activePriceTagItem.normalPrice;
  activePriceTagItem.actionPlan = formattedPlan;
  activePriceTagItem.tagTheme = theme;
  activePriceTagItem.tagSize = size;
  activePriceTagItem.tagPrintTarget = printTarget;
  activePriceTagItem.promoBanner = banner;
  activePriceTagItem.promoRemark = footerNote;
  activePriceTagItem.showBarcode = false;
  activePriceTagItem.pricingUpdatedAt = nowIso;
  activePriceTagItem.lastUpdated = nowIso;
  activePriceTagItem.updatedBy = updatedBy;

  // Also update any exact matching row (same unique rowId OR same exact branch + itemCode + batch + expiryDate)
  if (Array.isArray(expiryItems)) {
    expiryItems.forEach(it => {
      if (!it) return;
      const itId = (it.rowId !== undefined && it.rowId !== null) ? String(it.rowId).trim() : '';
      const isSameId = Boolean(targetId && targetId !== 'undefined' && itId === targetId);
      const isSameItem = Boolean(targetKey && getExpiryItemKey(it) === targetKey);
      if (it === activePriceTagItem || isSameId || isSameItem) {
        it.offeredPrice = offeredPrice;
        it.clearancePrice = offeredPrice;
        if (normalPrice) it.normalPrice = normalPrice;
        else delete it.normalPrice;
        it.actionPlan = formattedPlan;
        it.tagTheme = theme;
        it.tagSize = size;
        it.tagPrintTarget = printTarget;
        it.promoBanner = banner;
        it.promoRemark = footerNote;
        it.showBarcode = false;
        it.pricingUpdatedAt = nowIso;
        it.lastUpdated = nowIso;
        it.updatedBy = updatedBy;
      }
    });
  }

  // Immediately save locally and refresh UI
  saveLocalExpiryData();
  renderExpiryUI();

  // Save to OneDrive immediately
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(activePriceTagItem.branch).catch(console.warn);
  }

  // Push to Google Sheets in background
  pushExpiryUpdateToSheets(activePriceTagItem.rowId, activePriceTagItem.quantity, activePriceTagItem.status, activePriceTagItem.expiryDate, {
    actionPlan: formattedPlan,
    offeredPrice: offeredPrice,
    clearancePrice: offeredPrice
  }).catch(console.warn);

  if (!silent) {
    showExpiryToast(`✅ Saved offered price RM ${offeredPrice.toFixed(2)} for ${activePriceTagItem.itemDescription || activePriceTagItem.itemCode}`);
    closeClearancePriceTagModal();
  }
  return true;
}

function printClearancePriceTags() {
  if (!activePriceTagItem) return;

  const offInput = document.getElementById('tagOfferedPrice');
  const offeredPrice = parseFloat(offInput?.value);
  if (isNaN(offeredPrice) || offeredPrice <= 0) {
    alert('Please enter a valid clearance price (RM) before printing.');
    if (offInput) offInput.focus();
    return;
  }

  // Auto-save offered price to product and close the modal directly
  saveClearancePriceTag(true);
  closeClearancePriceTagModal();
  showExpiryToast(`✅ Saved clearance price RM ${offeredPrice.toFixed(2)}! Preparing print...`);

  const copies = parseInt(document.getElementById('tagCopiesInput')?.value, 10) || 1;
  const size = document.getElementById('tagSizeSelect')?.value || 'compact';
  const theme = document.getElementById('tagThemeSelect')?.value || 'flame';
  const banner = document.getElementById('tagBannerSelect')?.value || '🔥 CLEARANCE SALE';
  const footerNote = document.getElementById('tagFooterNoteInput')?.value || '* While Stocks Last · Short Expiry Deal';
  const showBarcode = false;
  const printTarget = document.getElementById('tagPrintTargetSelect')?.value || 'a4';
  const normalPrice = parseFloat(document.getElementById('tagNormalPrice')?.value) || 0;

  let widthMm = '50mm';
  let heightMm = '35mm';
  if (size === 'medium') { widthMm = '70mm'; heightMm = '45mm'; }
  else if (size === 'shelf') { widthMm = '90mm'; heightMm = '55mm'; }
  else if (size === 'mini') { widthMm = '40mm'; heightMm = '25mm'; }

  const singleStickerHtml = renderSinglePriceTagMarkup(activePriceTagItem, {
    theme,
    banner,
    size,
    offeredPrice,
    normalPrice,
    footerNote,
    showBarcode,
    forPrint: true,
    printTarget
  });

  let stickersHtml = '';
  for (let i = 0; i < copies; i++) {
    if (printTarget === 'a4') {
      stickersHtml += `
        <div class="tag-cut-cell">
          <div class="tag-cut-guide">
            <span class="cut-icon">✂</span>
            ${singleStickerHtml}
          </div>
        </div>
      `;
    } else {
      stickersHtml += `
        <div class="tag-thermal-item">
          ${singleStickerHtml}
        </div>
      `;
    }
  }

  // Remove any previous printing iframe
  const oldIframe = document.getElementById('pmgPriceTagPrintIframe');
  if (oldIframe) oldIframe.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'pmgPriceTagPrintIframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();

  let pageCss = '';
  if (printTarget === 'thermal') {
    pageCss = `
      @page {
        size: ${widthMm} ${heightMm};
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .tag-thermal-item {
        width: ${widthMm};
        height: ${heightMm};
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
        overflow: hidden;
      }
    `;
  } else {
    // A4 sheet mode
    pageCss = `
      @page {
        size: A4 portrait;
        margin: 8mm 6mm;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .tag-a4-sheet-container {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        align-content: flex-start;
        gap: 3mm;
        margin: 0 auto;
        box-sizing: border-box;
      }
      .tag-cut-cell {
        box-sizing: border-box;
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 2mm;
      }
      .tag-cut-guide {
        position: relative;
        border: 1px dashed #94a3b8;
        border-radius: 4px;
        padding: 0.5mm;
        background: #ffffff;
        box-sizing: border-box;
      }
      .cut-icon {
        position: absolute;
        top: -7px;
        left: -3px;
        font-size: 8px;
        color: #94a3b8;
        line-height: 1;
        background: #ffffff;
        padding: 0 1px;
      }
    `;
  }

  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Clearance Price Tags - ${escHtml(activePriceTagItem.itemCode || 'SKU')}</title>
      <style>
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        ${pageCss}
      </style>
    </head>
    <body>
      ${printTarget === 'thermal' ? stickersHtml : `<div class="tag-a4-sheet-container">${stickersHtml}</div>`}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
            setTimeout(function() {
              if (window.frameElement) window.frameElement.remove();
            }, 3000);
          }, 350);
        };
      <\/script>
    </body>
    </html>
  `);
  doc.close();

  showExpiryToast(`🖨️ Printing ${copies} clearance price tag(s) [${printTarget === 'thermal' ? 'Thermal Roll' : 'A4 Grid with Cut Guides'}]...`);
}

function updateExpiryOfferedPrice(rowId, val) {
  const item = findExpiryItemById(rowId);
  if (!item) return;

  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(25000);
  }

  const num = parseFloat(val);
  const nowIso = new Date().toISOString();
  const session = typeof getSession === 'function' ? getSession() : null;
  const updatedBy = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  if (!item.rowId || String(item.rowId).trim() === '' || String(item.rowId).trim() === 'undefined') {
    item.rowId = getExpiryRowUid(item, Date.now());
  }
  const targetId = String(item.rowId).trim();
  const targetKey = getExpiryItemKey(item);

  let formattedPlan = item.actionPlan;
  if (isNaN(num) || num <= 0) {
    formattedPlan = (item.actionPlan || '').toLowerCase().includes('promo') ? '' : item.actionPlan;
  } else {
    formattedPlan = `Clearance Promo (Offer: RM ${num.toFixed(2)})`;
  }

  if (Array.isArray(expiryItems)) {
    expiryItems.forEach(it => {
      if (!it) return;
      const itId = (it.rowId !== undefined && it.rowId !== null) ? String(it.rowId).trim() : '';
      const isSameId = Boolean(targetId && targetId !== 'undefined' && itId === targetId);
      const isSameItem = Boolean(targetKey && getExpiryItemKey(it) === targetKey);
      if (it === item || isSameId || isSameItem) {
        if (isNaN(num) || num <= 0) {
          delete it.offeredPrice;
          delete it.clearancePrice;
          it.actionPlan = formattedPlan;
        } else {
          it.offeredPrice = num;
          it.clearancePrice = num;
          it.actionPlan = formattedPlan;
        }
        it.pricingUpdatedAt = nowIso;
        it.lastUpdated = nowIso;
        it.updatedBy = updatedBy;
      }
    });
  }

  saveLocalExpiryData();
  renderExpiryUI();

  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }

  pushExpiryUpdateToSheets(item.rowId, item.quantity, item.status, item.expiryDate, {
    actionPlan: formattedPlan,
    offeredPrice: !isNaN(num) && num > 0 ? num : undefined,
    clearancePrice: !isNaN(num) && num > 0 ? num : undefined
  }).catch(console.warn);

  if (!isNaN(num) && num > 0) {
    showExpiryToast(`✅ Offered price RM ${num.toFixed(2)} set for ${item.itemDescription || item.itemCode}`);
  }
}

// ─── FILTERING & UI RENDERING ────────────────────────────────────────────────
function filterExpiryItems() {
  const filtered = expiryItems.filter(it => {
    // 1. Branch filter
    if (activeExpiryFilter.branch && activeExpiryFilter.branch !== 'ALL') {
      const bNorm = normalizeBranchCode(it.branch);
      if (bNorm.toLowerCase() !== activeExpiryFilter.branch.toLowerCase()) return false;
    }

    // 2. Horizon / Status filter
    const horizon = calculateExpiryHorizon(it.expiryDate);
    const isCleared = isItemMarkedDoneOrCleared(it);

    if (activeExpiryFilter.horizon === 'cleared') {
      if (!isCleared) return false;
    } else if (activeExpiryFilter.horizon === 'promo') {
      if (isCleared) return false;
      const isPromo = Boolean(it.offeredPrice) || Boolean(it.clearancePrice) || String(it.actionPlan || '').toLowerCase().includes('promo') || String(it.actionPlan || '').toLowerCase().includes('clearance');
      if (!isPromo) return false;
    } else {
      // Non-cleared views
      if (isCleared) return false;
      if (activeExpiryFilter.horizon === '9months' && horizon.monthsLeft > 9) return false;
      if (activeExpiryFilter.horizon === '12months' && horizon.monthsLeft > 12) return false;
      if (activeExpiryFilter.horizon === 'critical' && horizon.monthsLeft >= 6) return false;
    }

    // 3. HQ Return Policy filter
    if (activeExpiryFilter.returnPolicy && activeExpiryFilter.returnPolicy !== 'all') {
      const returnStatus = getItemHqReturnStatus(it);
      if (activeExpiryFilter.returnPolicy === 'non_returnable' && returnStatus !== 'NON-RETURNABLE') return false;
      if (activeExpiryFilter.returnPolicy === 'returnable' && returnStatus !== 'RETURNABLE') return false;
      if (activeExpiryFilter.returnPolicy === 'special' && returnStatus !== 'SPECIAL') return false;
      if (activeExpiryFilter.returnPolicy === 'unlisted' && returnStatus !== 'UNLISTED') return false;
    }

    // 3.5 Action Plan Filter (including Blank filter)
    if (activeExpiryFilter.actionPlan && activeExpiryFilter.actionPlan !== 'all') {
      const planRaw = String(it.actionPlan || '').trim();
      if (activeExpiryFilter.actionPlan === 'blank') {
        if (planRaw !== '') return false;
      } else {
        if (!planRaw.toLowerCase().includes(activeExpiryFilter.actionPlan.toLowerCase())) return false;
      }
    }

    // 4. Search filter
    if (activeExpiryFilter.search) {
      const q = activeExpiryFilter.search.toLowerCase().trim();
      const code = String(it.itemCode || '').toLowerCase();
      const desc = String(it.itemDescription || '').toLowerCase();
      const batch = String(it.batchNumber || '').toLowerCase();
      const plan = String(it.actionPlan || '').toLowerCase();
      const promoRem = String(it.promoRemark || '').toLowerCase();
      if (!code.includes(q) && !desc.includes(q) && !batch.includes(q) && !plan.includes(q) && !promoRem.includes(q)) return false;
    }

    return true;
  });

  if (activeExpiryFilter.sortOrder === 'asc' || activeExpiryFilter.sortOrder === 'desc') {
    const isAsc = activeExpiryFilter.sortOrder === 'asc';
    filtered.sort((a, b) => {
      const dA = parseExpiryDate(a.expiryDate);
      const dB = parseExpiryDate(b.expiryDate);
      if (!dA && !dB) return 0;
      if (!dA) return 1;
      if (!dB) return -1;
      return isAsc ? (dA.getTime() - dB.getTime()) : (dB.getTime() - dA.getTime());
    });
  }

  return filtered;
}

function toggleExpiryDateSort() {
  if (activeExpiryFilter.sortOrder === 'asc') {
    activeExpiryFilter.sortOrder = 'desc';
  } else {
    activeExpiryFilter.sortOrder = 'asc';
  }

  const icon = document.getElementById('expiryDateSortIcon');
  if (icon) {
    if (activeExpiryFilter.sortOrder === 'asc') {
      icon.className = 'fa-solid fa-arrow-down-short-wide text-blue-400 text-xs';
    } else {
      icon.className = 'fa-solid fa-arrow-up-wide-short text-amber-400 text-xs';
    }
  }

  expiryCurrentPage = 1;
  renderExpiryTable();
}
window.toggleExpiryDateSort = toggleExpiryDateSort;

function renderExpiryUI() {
  expiryItems = ensureUniqueExpiryRowIds(expiryItems);
  renderExpiryKpis();
  renderExpiryTable();
}

function renderExpiryKpis() {
  let criticalCount = 0;
  let urgentCount = 0;
  let kpi9mCount = 0;
  let monitor12mCount = 0;
  let clearedCount = 0;

  const targetBranch = activeExpiryFilter.branch;

  expiryItems.forEach(it => {
    if (targetBranch && targetBranch !== 'ALL') {
      if (normalizeBranchCode(it.branch).toLowerCase() !== targetBranch.toLowerCase()) return;
    }

    if (isItemMarkedDoneOrCleared(it)) {
      clearedCount++;
      return;
    }

    const h = calculateExpiryHorizon(it.expiryDate);
    if (h.monthsLeft < 3) criticalCount++;
    else if (h.monthsLeft < 6) urgentCount++;
    else if (h.monthsLeft <= 9) kpi9mCount++;
    else if (h.monthsLeft <= 12) monitor12mCount++;
  });

  const total9mKpi = criticalCount + urgentCount + kpi9mCount;

  setText('expiryKpiCritical', criticalCount);
  setText('expiryKpiUrgent', urgentCount);
  setText('expiryKpi9m', total9mKpi);
  setText('expiryKpi12m', monitor12mCount);
  setText('expiryKpiCleared', clearedCount);
}

function renderExpiryTable() {
  const tbody = document.getElementById('expiryTableTbody');
  const countEl = document.getElementById('expiryFilteredCount');
  if (!tbody) return;

  const items = filterExpiryItems();
  if (countEl) countEl.textContent = `${items.length} items`;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-12 text-gray-400">
          <i class="fa-solid fa-box-open text-4xl mb-3 text-gray-300 block"></i>
          No expiry stock records found matching your filters.
          <p class="text-xs text-gray-400 mt-1">Upload a PDF invoice or click "+ Quick Add" to begin tracking.</p>
        </td>
      </tr>`;
    return;
  }

  const totalItems = items.length;
  const maxDisplay = expiryCurrentPage * EXPIRY_PAGE_SIZE;
  const displayedItems = items.slice(0, maxDisplay);

  const paginationCount = document.getElementById('expiryPaginationCount');
  const loadMoreBtn = document.getElementById('expiryLoadMoreBtn');
  if (paginationCount) {
    paginationCount.textContent = `Showing 1–${Math.min(totalItems, displayedItems.length)} of ${totalItems} items`;
  }
  if (loadMoreBtn) {
    if (totalItems > maxDisplay) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.innerHTML = `<i class="fa-solid fa-angles-down"></i> Load More (${Math.min(EXPIRY_PAGE_SIZE, totalItems - maxDisplay)} more)`;
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  const skuBatchMap = {};
  expiryItems.forEach(x => {
    const code = String(x.itemCode || '').trim();
    if (!code) return;
    if (!skuBatchMap[code]) skuBatchMap[code] = [];
    skuBatchMap[code].push(x);
  });

  tbody.innerHTML = displayedItems.map((it, idx) => {
    const h = calculateExpiryHorizon(it.expiryDate);
    const isCleared = isItemMarkedDoneOrCleared(it);
    if (!it.rowId || String(it.rowId).trim() === '' || String(it.rowId).trim() === 'undefined') {
      it.rowId = getExpiryRowUid(it, idx);
    }
    const safeRowId = escHtml(String(it.rowId).replace(/'/g, "\\'"));
    const offeredNum = parseFloat(it.offeredPrice !== undefined ? it.offeredPrice : it.clearancePrice);
    const hasValidOffer = !isNaN(offeredNum) && offeredNum > 0;
    const itemBatches = skuBatchMap[String(it.itemCode || '').trim()] || [];

    let badgeClass = 'bg-gray-100 text-gray-600';
    if (h.level === 'expired' || h.level === 'critical') badgeClass = 'bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse';
    else if (h.level === 'urgent') badgeClass = 'bg-amber-100 text-amber-800 font-bold border border-amber-200';
    else if (h.level === 'kpi') badgeClass = 'bg-yellow-100 text-yellow-800 font-bold border border-yellow-200';
    else if (h.level === 'monitor') badgeClass = 'bg-blue-100 text-blue-700 font-semibold';
    else if (h.level === 'safe') badgeClass = 'bg-emerald-100 text-emerald-700';

    return `
      <tr class="border-b hover:bg-slate-50/80 transition ${isCleared ? 'opacity-50 bg-gray-50' : ''}">
        <td class="p-3 text-center">
          <input type="checkbox" class="expiry-write-off-cb w-4 h-4 text-rose-600 rounded cursor-pointer"
            data-row-id="${safeRowId}"
            ${selectedWriteOffRowIds.has(it.rowId) ? 'checked' : ''}
            onchange="toggleSelectWriteOffItem('${safeRowId}', this.checked)">
        </td>
        <td class="p-3 text-xs font-bold text-gray-700 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border text-slate-700">
            <i class="fa-solid fa-shop text-[10px] text-blue-600"></i> ${escHtml(it.branch)}
          </span>
        </td>
        <td class="p-3 font-mono text-xs font-extrabold text-blue-900 whitespace-nowrap">
          ${escHtml(it.itemCode)}
        </td>
        <td class="p-3 text-xs font-semibold text-gray-800 ${isCleared ? 'line-through text-gray-400' : ''}">
          ${escHtml(it.itemDescription)}
          <div class="text-[10px] text-gray-400 font-mono mt-0.5">Batch: ${escHtml(it.batchNumber || 'N/A')} · File: ${escHtml(it.sourceFile || 'Direct')}</div>
          ${itemBatches.length > 1 ? `
            <button type="button" onclick="openSkuBatchExplorerModal('${escHtml(String(it.itemCode).replace(/'/g, "\\'"))}')"
              class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition shadow-2xs cursor-pointer" title="View all ${itemBatches.length} batches and expiry dates for this SKU">
              <i class="fa-solid fa-boxes-stacked text-indigo-600"></i> ${itemBatches.length} Batches (View all)
            </button>
          ` : ''}
        </td>
        <td class="p-3 text-center whitespace-nowrap text-xs">
          ${renderHqReturnPolicyBadge(it)}
        </td>
        <td class="p-3 text-center text-xs whitespace-nowrap">
          ${isCleared ? `
            <span class="text-gray-400 text-xs italic">${escHtml(getItemActionPlan(it) || '—')}</span>
          ` : `
            <div class="flex flex-col items-center gap-1">
              <input type="text"
                list="actionPlanOptions"
                value="${escHtml(getItemActionPlan(it))}"
                placeholder="Action plan remark…"
                onchange="updateExpiryActionPlan('${safeRowId}', this.value)"
                class="w-36 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white font-medium text-gray-800"
                title="Action Plan Remark (e.g. Returnable with Condition, Vendor Return Pending, Clearance Promo / PWP)">
              ${hasValidOffer ? `
                <div class="flex items-center justify-center gap-1">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-2xs cursor-pointer hover:opacity-90 transition"
                    onclick="openClearancePriceTagModal('${safeRowId}')" title="Clearance Offer: RM ${offeredNum.toFixed(2)} (Click to Edit / Print Tag)">
                    <i class="fa-solid fa-tag text-[8px] text-amber-200"></i> RM ${offeredNum.toFixed(2)}
                  </span>
                  <button type="button" onclick="openClearancePriceTagModal('${safeRowId}')"
                    class="p-0.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition text-[11px] cursor-pointer" title="Print Price Tag Sticker">
                    <i class="fa-solid fa-print"></i>
                  </button>
                </div>
              ` : (String(it.actionPlan || '').toLowerCase().includes('clearance') || String(it.actionPlan || '').toLowerCase().includes('promo')) ? `
                <button type="button" onclick="openClearancePriceTagModal('${safeRowId}')"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 transition animate-pulse cursor-pointer"
                  title="Click to input offered price and print price tag">
                  <i class="fa-solid fa-tag text-amber-600 text-[9px]"></i> + Set Offer Price
                </button>
              ` : ''}
            </div>
          `}
        </td>
        <td class="p-3 text-xs font-bold text-center whitespace-nowrap">
          ${isCleared ? `
            <span class="font-mono text-gray-400">${formatExpiryDateDisplay(it.expiryDate)}</span>
          ` : `
            <div class="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-lg px-2 py-1 shadow-2xs transition group" title="Click to edit expiry date (e.g. DD/MM/YYYY or MM/YYYY)">
              <i class="fa-regular fa-calendar-days text-[11px] text-slate-400 group-hover:text-blue-500 transition"></i>
              <input type="text"
                value="${formatExpiryDateDisplay(it.expiryDate)}"
                placeholder="DD/MM/YYYY"
                onchange="updateExpiryItemDate('${safeRowId}', this.value, this)"
                onkeydown="if(event.key==='Enter') this.blur()"
                class="w-24 text-center font-mono font-bold text-xs text-slate-800 focus:text-blue-900 focus:outline-none bg-transparent">
            </div>
          `}
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          <span class="text-xs px-2.5 py-1 rounded-full ${badgeClass}">
            ${h.label}
          </span>
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          ${isCleared ? `
            <span class="text-xs font-bold text-gray-400 font-mono">0</span>
          ` : `
            <input type="number" min="0" value="${it.quantity}"
              onchange="updateExpiryItemQuantity('${safeRowId}', this.value)"
              class="w-16 px-2 py-1 text-center font-bold text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 bg-white">
          `}
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          ${isCleared ? `
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <i class="fa-solid fa-circle-check mr-1"></i>Cleared
            </span>
          ` : `
            <span class="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Active
            </span>
          `}
        </td>
        <td class="p-3 text-center whitespace-nowrap text-xs">
          ${isCleared ? `
            <button onclick="reactivateExpiryItem('${safeRowId}')" class="text-blue-600 hover:underline font-semibold text-xs cursor-pointer">
              <i class="fa-solid fa-rotate-left mr-1"></i>Restore
            </button>
          ` : `
            <div class="inline-flex items-center gap-1.5">
              <button onclick="markExpiryItemCleared('${safeRowId}')"
                class="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition cursor-pointer"
                title="Click when stock is fully sold or cleared">
                <i class="fa-solid fa-check mr-1 text-emerald-600"></i>Done Clear
              </button>
              <button onclick="openClearancePriceTagModal('${safeRowId}')"
                class="p-1.5 ${hasValidOffer ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-300' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'} rounded-lg transition cursor-pointer"
                title="${hasValidOffer ? 'Clearance Promo: RM ' + offeredNum.toFixed(2) + ' (Print/Edit Price Tag)' : 'Generate Clearance Price Tag Sticker'}">
                <i class="fa-solid fa-tag text-xs"></i>
              </button>
              <button onclick="openEditExpiryItemModal('${safeRowId}')"
                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                title="Edit item details (Description, Batch, Expiry, Qty)">
                <i class="fa-solid fa-pen-to-square text-xs"></i>
              </button>
            </div>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function loadMoreExpiryRows() {
  expiryCurrentPage++;
  renderExpiryTable();
}

// ─── EXPORT TO EXCEL (MATCHING PICTURE 3 & HQ KPI 9-MONTH FORMAT) ────────────
/**
 * Generates a styled, multi-tab Excel workbook identical to Photo 3 using ExcelJS.
 * Each month has its own tab (AUG 2026, SEP 2026, etc.), ordered chronologically.
 */
async function exportHqExpiryExcel() {
  const btn = document.getElementById('expiryExportBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generating Excel...`;
  }

  try {
    if (typeof ExcelJS === 'undefined') {
      alert('ExcelJS engine not yet loaded. Please wait a moment and try again.');
      return;
    }

    const branch = activeExpiryFilter.branch || 'Kota Sentosa';
    const activeOnly = expiryItems.filter(it => !isItemMarkedDoneOrCleared(it));

    // Filter by branch if specific
    const branchItems = (branch === 'ALL') ? activeOnly : activeOnly.filter(it => normalizeBranchCode(it.branch).toLowerCase() === branch.toLowerCase());

    if (branchItems.length === 0) {
      alert(`No active stock expiry records to export for ${branch}.`);
      return;
    }

    // Group items by Month/Year tab
    const monthGroups = {};
    branchItems.forEach(it => {
      const tabName = getExpiryMonthYearKey(it.expiryDate);
      if (!monthGroups[tabName]) monthGroups[tabName] = [];
      monthGroups[tabName].push(it);
    });

    // Sort month tabs chronologically
    const sortedTabs = Object.keys(monthGroups).sort((a, b) => {
      const pA = a.split(' ');
      const pB = b.split(' ');
      if (pA.length === 2 && pB.length === 2) {
        const yA = parseInt(pA[1], 10);
        const yB = parseInt(pB[1], 10);
        const mA = MONTH_NAMES.indexOf(pA[0]);
        const mB = MONTH_NAMES.indexOf(pB[0]);
        return (yA * 100 + mA) - (yB * 100 + mB);
      }
      return a.localeCompare(b);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PMG Pharmacy Management Hub';
    workbook.created = new Date();

    // ── Tab 1: Sheet1 (Master staging summary matching Photo 3) ──────────────
    const summarySheet = workbook.addWorksheet('Sheet1', { views: [{ showGridLines: true }] });
    summarySheet.columns = [
      { header: 'Batch number', key: 'batch', width: 16 },
      { header: 'Item code', key: 'code', width: 16 },
      { header: 'Item description', key: 'desc', width: 38 },
      { header: 'HQ Return Policy', key: 'hqPolicy', width: 18 },
      { header: 'Action Plan Remark', key: 'actionPlan', width: 26 },
      { header: 'Expiry date', key: 'expiry', width: 16 },
      { header: 'Quantity', key: 'qty', width: 14 },
      { header: 'Source File', key: 'file', width: 32 },
      { header: 'Branch', key: 'branch', width: 16 },
    ];
    styleExcelHeaderRow(summarySheet.getRow(1));

    branchItems.forEach(it => {
      const row = summarySheet.addRow({
        batch: it.batchNumber || 'N/A',
        code: it.itemCode || 'N/A',
        desc: it.itemDescription || '',
        hqPolicy: getItemHqReturnStatus(it),
        actionPlan: getItemActionPlan(it),
        expiry: formatExpiryDateDisplay(it.expiryDate),
        qty: it.quantity || 0,
        file: it.sourceFile || 'Invoice Upload',
        branch: it.branch || branch
      });
      styleExcelDataRow(row);
    });

    // ── Subsequent Tabs: Chronological Month Tabs (AUG 2026, SEP 2026...) ───
    sortedTabs.forEach(tabName => {
      const itemsInMonth = monthGroups[tabName];
      const sheet = workbook.addWorksheet(tabName, { views: [{ showGridLines: true }] });
      sheet.columns = [
        { header: 'Batch number', key: 'batch', width: 16 },
        { header: 'Item code', key: 'code', width: 16 },
        { header: 'Item description', key: 'desc', width: 38 },
        { header: 'HQ Return Policy', key: 'hqPolicy', width: 18 },
        { header: 'Action Plan Remark', key: 'actionPlan', width: 26 },
        { header: 'Expiry date', key: 'expiry', width: 16 },
        { header: 'Quantity', key: 'qty', width: 14 },
        { header: 'Source File', key: 'file', width: 32 },
        { header: 'Branch', key: 'branch', width: 16 },
      ];
      styleExcelHeaderRow(sheet.getRow(1));

      itemsInMonth.forEach(it => {
        const row = sheet.addRow({
          batch: it.batchNumber || 'N/A',
          code: it.itemCode || 'N/A',
          desc: it.itemDescription || '',
          hqPolicy: getItemHqReturnStatus(it),
          actionPlan: getItemActionPlan(it),
          expiry: formatExpiryDateDisplay(it.expiryDate),
          qty: it.quantity || 0,
          file: it.sourceFile || 'Invoice Upload',
          branch: it.branch || branch
        });
        styleExcelDataRow(row);
      });
    });

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `PMG_HQ_Expiry_KPI_Report_${cleanFileName(branch)}_${dateStr}.xlsx`);

    showExpiryToast(`✅ Exported HQ Expiry Report with ${sortedTabs.length} monthly tabs!`);
  } catch (err) {
    console.error('[PMG Expiry] Excel export error:', err);
    alert('Failed to generate Excel report: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-file-excel mr-1.5 text-emerald-300"></i>Export HQ KPI Report (Excel)`;
    }
  }
}

function styleExcelHeaderRow(row) {
  row.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // PMG Navy
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 24;
}

function styleExcelDataRow(row) {
  row.font = { name: 'Arial', size: 9.5 };
  row.alignment = { vertical: 'middle' };
  row.getCell(4).alignment = { horizontal: 'center' };
  row.getCell(5).alignment = { horizontal: 'right' };
}

// ─── REPLENISHMENT ENGINE CROSS-CHECK INTEGRATION ────────────────────────────
/**
 * Exposes active near-expiry stock (within maxMonths) across all branches
 * for Module 1 (Inventory Replenishment Engine) to cross-reference against ordering CSVs.
 */
function getShortDatedStockForReplenishment(maxMonths = 12) {
  const mapByCode = {};

  expiryItems.forEach(it => {
    if (isItemMarkedDoneOrCleared(it)) return;
    const h = calculateExpiryHorizon(it.expiryDate);
    if (h.monthsLeft > maxMonths) return;

    const code = String(it.itemCode || '').trim().toUpperCase();
    if (!code || code === 'N/A') return;

    if (!mapByCode[code]) mapByCode[code] = [];
    mapByCode[code].push({
      branch: it.branch,
      batchNumber: it.batchNumber,
      expiryDate: formatExpiryDateDisplay(it.expiryDate),
      quantity: it.quantity,
      monthsLeft: h.monthsLeft,
      horizonLabel: h.label,
      level: h.level
    });
  });

  return mapByCode;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
function setupExpiryEventListeners() {
  const branchSelect = document.getElementById('expiryBranchFilter');
  if (branchSelect) {
    branchSelect.addEventListener('change', e => {
      activeExpiryFilter.branch = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
      updateAccountsShareUi(e.target.value || 'Kota Sentosa');
    });
  }

  const horizonSelect = document.getElementById('expiryHorizonFilter');
  if (horizonSelect) {
    horizonSelect.addEventListener('change', e => {
      activeExpiryFilter.horizon = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  const returnPolicySelect = document.getElementById('expiryReturnPolicyFilter');
  if (returnPolicySelect) {
    returnPolicySelect.addEventListener('change', e => {
      activeExpiryFilter.returnPolicy = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  const actionPlanSelect = document.getElementById('expiryActionPlanFilter');
  if (actionPlanSelect) {
    actionPlanSelect.addEventListener('change', e => {
      activeExpiryFilter.actionPlan = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  const searchInput = document.getElementById('expirySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      activeExpiryFilter.search = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  // PDF Dropzone & Multi-file Upload (Invoices + Credit Notes)
  const dropZone = document.getElementById('expiryDropZone');
  const fileInput = document.getElementById('expiryFileInput');
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files.length) {
        const branch = document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
        handleBatchInvoiceAndCnUpload(e.target.files, branch);
        e.target.value = '';
      }
    });
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-blue-500', 'bg-blue-50/50'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-500', 'bg-blue-50/50'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        const branch = document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
        handleBatchInvoiceAndCnUpload(e.dataTransfer.files, branch);
      }
    });
  }
}

// ─── TOAST NOTIFICATION ──────────────────────────────────────────────────────
function showExpiryToast(msg) {
  const toast = document.getElementById('expiryToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden', 'opacity-0');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 4000);
}

// ─── MANUAL QUICK ADD MODAL ──────────────────────────────────────────────────
function openQuickAddExpiryModal() {
  const modal = document.getElementById('expiryQuickAddModal');
  if (modal) modal.classList.remove('hidden');
}

function closeQuickAddExpiryModal() {
  const modal = document.getElementById('expiryQuickAddModal');
  if (modal) modal.classList.add('hidden');
}

async function handleQuickAddSubmit(e) {
  e.preventDefault();
  const branch = document.getElementById('qaBranch').value;
  const itemCode = document.getElementById('qaItemCode').value.trim();
  const itemDescription = document.getElementById('qaItemDesc').value.trim();
  const batchNumber = document.getElementById('qaBatch').value.trim() || 'N/A';
  const expiryDate = document.getElementById('qaExpiry').value.trim();
  const quantity = parseFloat(document.getElementById('qaQty').value) || 1;

  if (!itemCode || !itemDescription || !expiryDate) {
    alert('Please fill in Item Code, Description, and Expiry Date.');
    return;
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();
  const userName = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  const newItem = {
    rowId: 'qa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    branch: branch,
    batchNumber: batchNumber,
    itemCode: itemCode,
    itemDescription: itemDescription,
    expiryDate: formatExpiryDateDisplay(expiryDate),
    quantity: quantity,
    sourceFile: 'Manual Quick Entry',
    status: 'Active',
    lastUpdated: nowIso,
    updatedBy: userName
  };

  expiryItems.unshift(newItem);
  saveLocalExpiryData();
  renderExpiryUI();

  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(branch).catch(console.warn);
  }

  // Push to Sheets
  await pushBatchExpiryToSheets([newItem]);

  closeQuickAddExpiryModal();
  document.getElementById('expiryQuickAddForm')?.reset();
  showExpiryToast(`✅ Added ${itemDescription} to Stock Expiry Tracker!`);
}

// ─── API KEY MANAGEMENT HELPER ───────────────────────────────────────────────
function promptUpdateGeminiKey() {
  if (typeof window.openGlobalGeminiModal === 'function') {
    window.openGlobalGeminiModal();
    return;
  }
  const current = (typeof window.getGlobalGeminiKey === 'function' ? window.getGlobalGeminiKey() : '')
               || (localStorage.getItem('pmg_gemini_key') || '');
  const newKey = prompt('🔑 Google Gemini API Key:\n(Leave blank to use the built-in system key)', current);
  if (newKey !== null) {
    if (typeof window.setGlobalGeminiKey === 'function') {
      window.setGlobalGeminiKey(newKey);
    } else {
      const trimmed = newKey.trim();
      if (trimmed) localStorage.setItem('pmg_gemini_key', trimmed);
      else localStorage.removeItem('pmg_gemini_key');
    }
    showExpiryToast('✅ Global Gemini API key saved across PMG Hub!');
  }
}
window.promptUpdateGeminiKey = promptUpdateGeminiKey;

// ─── ACCOUNTS DEPARTMENT ONEDRIVE SUBMISSION HELPERS ─────────────────────────
function updateAccountsShareUi(branchName) {
  const branch = branchName || document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
  if (!window.pmgOneDriveSync || typeof window.pmgOneDriveSync.getAccountsSubmissionSummary !== 'function') {
    return;
  }

  const summary = window.pmgOneDriveSync.getAccountsSubmissionSummary(branch);

  const branchBadge = document.getElementById('accountsBarBranchBadge');
  if (branchBadge) branchBadge.textContent = summary.branch;

  const monthBadge = document.getElementById('accountsBarMonthBadge');
  if (monthBadge) monthBadge.textContent = `${summary.month} ${summary.year}`;

  const invCountEl = document.getElementById('accountsSummaryInvCount');
  if (invCountEl) {
    const totalStr = summary.invoicesTotal > 0 ? ` (RM ${summary.invoicesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '';
    invCountEl.textContent = `${summary.invoicesCount} doc(s)${totalStr}`;
  }

  const cnCountEl = document.getElementById('accountsSummaryCnCount');
  if (cnCountEl) {
    const totalStr = summary.creditNotesTotal > 0 ? ` (RM ${summary.creditNotesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '';
    cnCountEl.textContent = `${summary.creditNotesCount} doc(s)${totalStr}`;
  }

  const linkBtnText = document.getElementById('accountsShareLinkBtnText');
  if (linkBtnText) {
    linkBtnText.textContent = summary.shareLink ? 'OneDrive Link (Set)' : 'OneDrive Link';
  }
}

function copyAccountsWhatsAppSummary() {
  const branch = document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
  if (!window.pmgOneDriveSync || typeof window.pmgOneDriveSync.getAccountsSubmissionSummary !== 'function') {
    showExpiryToast('OneDrive Sync engine not ready.');
    return;
  }

  const summary = window.pmgOneDriveSync.getAccountsSubmissionSummary(branch);
  const invStr = `${summary.invoicesCount} doc(s)${summary.invoicesTotal > 0 ? ` (~RM ${summary.invoicesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ''}`;
  const cnStr = `${summary.creditNotesCount} doc(s)${summary.creditNotesTotal > 0 ? ` (~RM ${summary.creditNotesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ''}`;
  const vendorListStr = summary.vendors.length > 0 ? summary.vendors.join(', ') : 'Pending upload';

  const shareLink = summary.shareLink || '[Please click "OneDrive Link" in Hub to attach link]';

  const text = `*PMG PHARMACY (${summary.branch}) - MONTHLY ACCOUNTS SUBMISSION*
📅 *Period:* ${summary.month} ${summary.year}

📄 *Invoices (INV):* ${invStr}
📑 *Credit Notes (CN):* ${cnStr}
🏢 *Vendors (${summary.vendors.length}):* ${vendorListStr}

📂 *OneDrive Folder Link:*
${shareLink}

_Arranged per Accounts SOP:_
Year (${summary.year}) ➔ Month (${summary.month}) ➔ Invoices / Credit Note ➔ Vendor Folders`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showExpiryToast('📋 Copied WhatsApp Accounts Summary to clipboard!');
    }).catch(() => {
      prompt('Copy your WhatsApp summary:', text);
    });
  } else {
    prompt('Copy your WhatsApp summary:', text);
  }
}

function promptSetOneDriveShareLink() {
  const branch = document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
  const bKey = `pmg_onedrive_share_link_${branch.replace(/\s+/g, '_').toUpperCase()}`;
  const current = localStorage.getItem(bKey) || localStorage.getItem('pmg_onedrive_share_link') || '';

  if (current) {
    const choice = confirm(
      `🔗 OneDrive Folder Link is currently set:\n\n${current}\n\nClick OK to open this link in a new tab, or Cancel to edit/change the link.`
    );
    if (choice) {
      window.open(current, '_blank');
      return;
    }
  }

  const res = prompt(
    `🔗 OneDrive Folder Link for ${branch} Accounts Submission:\n(Paste the link generated from your company OneDrive to share with your accounts officer)`,
    current
  );

  if (res !== null) {
    const trimmed = res.trim();
    if (trimmed) {
      localStorage.setItem(bKey, trimmed);
      localStorage.setItem('pmg_onedrive_share_link', trimmed);
      showExpiryToast('✅ Accounts OneDrive link saved!');
    } else {
      localStorage.removeItem(bKey);
      showExpiryToast('OneDrive link cleared.');
    }
    updateAccountsShareUi(branch);
  }
}

// ─── MULTI-BATCH / SKU EXPIRY EXPLORER ─────────────────────────────────────────
let currentExplorerItemCode = '';

function openSkuBatchExplorerModal(itemCode) {
  currentExplorerItemCode = itemCode;
  const modal = document.getElementById('skuBatchExplorerModal');
  const codeEl = document.getElementById('batchExplorerSkuCode');
  const nameEl = document.getElementById('batchExplorerSkuName');
  const tbody = document.getElementById('batchExplorerTbody');
  const qtyBadge = document.getElementById('batchExplorerTotalQtyBadge');
  if (!modal || !tbody) return;

  const matches = expiryItems.filter(x => String(x.itemCode || '').trim() === String(itemCode).trim());
  matches.sort((a, b) => {
    const dA = parseExpiryDate(a.expiryDate);
    const dB = parseExpiryDate(b.expiryDate);
    if (!dA && !dB) return 0;
    if (!dA) return 1;
    if (!dB) return -1;
    return dA.getTime() - dB.getTime();
  });

  const first = matches[0] || {};
  if (codeEl) codeEl.textContent = itemCode;
  if (nameEl) nameEl.textContent = first.itemDescription || 'SKU Batches';

  let totalQty = 0;
  tbody.innerHTML = matches.map((m, i) => {
    const qty = parseFloat(m.remainingQty !== undefined ? m.remainingQty : m.quantity) || 0;
    totalQty += qty;
    const h = calculateExpiryHorizon(m.expiryDate);
    const cost = parseFloat(m.unitCost || m.costPrice || 0);

    let hBadge = 'bg-blue-100 text-blue-700';
    if (h.level === 'critical' || h.level === 'expired') hBadge = 'bg-rose-100 text-rose-700 font-bold';
    else if (h.level === 'urgent') hBadge = 'bg-amber-100 text-amber-800 font-bold';
    else if (h.level === 'kpi') hBadge = 'bg-yellow-100 text-yellow-800 font-bold';

    return `
      <tr class="border-b hover:bg-slate-50 transition">
        <td class="p-2.5 font-mono font-bold text-slate-800">
          ${escHtml(m.batchNumber || 'N/A')}
          ${i === 0 ? '<span class="ml-1 text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold">Earliest Expiry</span>' : ''}
        </td>
        <td class="p-2.5 text-center font-mono font-bold text-slate-900">${formatExpiryDateDisplay(m.expiryDate)}</td>
        <td class="p-2.5 text-center">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${hBadge}">
            ${h.daysLeft !== null ? (h.daysLeft < 0 ? 'EXPIRED' : `${h.daysLeft}d left (${h.monthsLeft}m)`) : 'Valid'}
          </span>
        </td>
        <td class="p-2.5 text-center font-bold text-slate-800">${qty}</td>
        <td class="p-2.5 text-right font-mono font-semibold text-slate-700">RM ${cost.toFixed(2)}</td>
        <td class="p-2.5 text-slate-600 text-xs">${escHtml(getItemActionPlan(m) || '—')}</td>
      </tr>
    `;
  }).join('');

  if (qtyBadge) qtyBadge.textContent = `${totalQty} Units Total across ${matches.length} Batches`;
  modal.classList.remove('hidden');
}

function closeSkuBatchExplorerModal() {
  const modal = document.getElementById('skuBatchExplorerModal');
  if (modal) modal.classList.add('hidden');
}

function filterExpiryByCurrentSku() {
  if (!currentExplorerItemCode) return;
  const searchInput = document.getElementById('expirySearchInput');
  if (searchInput) {
    searchInput.value = currentExplorerItemCode;
    activeExpiryFilter.search = currentExplorerItemCode;
  }
  closeSkuBatchExplorerModal();
  expiryCurrentPage = 1;
  renderExpiryUI();
}

// ─── WRITE-OFF SELECTION & 100% HQ COMPLIANT FORM ENGINE ───────────────────────
const selectedWriteOffRowIds = new Set();
let activeWriteOffFormType = 'poison'; // 'poison' | 'non_poison'

function toggleSelectWriteOffItem(rowId, isChecked) {
  if (isChecked) {
    selectedWriteOffRowIds.add(rowId);
  } else {
    selectedWriteOffRowIds.delete(rowId);
  }
  updateWriteOffSelectedCounter();
}

function toggleSelectAllExpiry(isChecked) {
  const displayed = filterExpiryItems();
  displayed.forEach(it => {
    if (it.rowId) {
      if (isChecked) selectedWriteOffRowIds.add(it.rowId);
      else selectedWriteOffRowIds.delete(it.rowId);
    }
  });
  document.querySelectorAll('.expiry-write-off-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  updateWriteOffSelectedCounter();
}

function updateWriteOffSelectedCounter() {
  const count = selectedWriteOffRowIds.size;
  const countEl = document.getElementById('writeOffSelectedCount');
  const btnEl = document.getElementById('btnOpenWriteOffModal');
  if (countEl) countEl.textContent = count;
  if (btnEl) {
    if (count > 0) btnEl.classList.remove('hidden');
    else btnEl.classList.add('hidden');
  }
  const allCb = document.getElementById('expirySelectAllCheckbox');
  if (allCb) {
    const displayed = filterExpiryItems();
    allCb.checked = displayed.length > 0 && displayed.every(d => selectedWriteOffRowIds.has(d.rowId));
  }
}

function openStockWriteOffModal() {
  if (selectedWriteOffRowIds.size === 0) {
    alert('Please select at least 1 item using the checkbox to generate a Write-Off form.');
    return;
  }
  const modal = document.getElementById('stockWriteOffModal');
  if (!modal) return;

  const dateInput = document.getElementById('writeOffSubmissionDate');
  if (dateInput && !dateInput.value) {
    const now = new Date();
    dateInput.value = now.toISOString().split('T')[0];
  }

  setWriteOffFormType(activeWriteOffFormType);
  renderWriteOffModalItems();
  modal.classList.remove('hidden');
}

function closeStockWriteOffModal() {
  const modal = document.getElementById('stockWriteOffModal');
  if (modal) modal.classList.add('hidden');
}

function setWriteOffFormType(type) {
  activeWriteOffFormType = type;
  const btnPoison = document.getElementById('btnWriteOffTypePoison');
  const btnNonPoison = document.getElementById('btnWriteOffTypeNonPoison');
  const titleEl = document.getElementById('writeOffModalTitle');

  if (type === 'poison') {
    if (btnPoison) btnPoison.className = 'px-3 py-1 rounded-lg font-bold text-xs transition bg-rose-700 text-white shadow-2xs';
    if (btnNonPoison) btnNonPoison.className = 'px-3 py-1 rounded-lg font-bold text-xs transition text-gray-600 hover:text-gray-900';
    if (titleEl) titleEl.textContent = 'HQ Official Poison Stock Write-Off Form';
  } else {
    if (btnPoison) btnPoison.className = 'px-3 py-1 rounded-lg font-bold text-xs transition text-gray-600 hover:text-gray-900';
    if (btnNonPoison) btnNonPoison.className = 'px-3 py-1 rounded-lg font-bold text-xs transition bg-slate-800 text-white shadow-2xs';
    if (titleEl) titleEl.textContent = 'HQ Official Non-Poison Stock Write-Off Form';
  }
  renderWriteOffModalItems();
}

function renderWriteOffModalItems() {
  const tbody = document.getElementById('writeOffItemsTbody');
  const totalCostSumEl = document.getElementById('writeOffTotalCostSum');
  if (!tbody) return;

  const selectedItems = expiryItems.filter(it => selectedWriteOffRowIds.has(it.rowId));
  let totalCost = 0;

  tbody.innerHTML = selectedItems.map((it, idx) => {
    const qty = parseFloat(it.remainingQty !== undefined ? it.remainingQty : it.quantity) || 1;
    const unitCost = parseFloat(it.unitCost || it.costPrice || 0);
    const rowTotal = qty * unitCost;
    totalCost += rowTotal;

    const defaultDisposal = activeWriteOffFormType === 'poison'
      ? 'SENT TO WAREHOUSE FOR DISPOSAL'
      : (it.disposalMethod || 'LOCAL DISPOSAL');

    const defaultPiSupplier = it.supplier || it.sourceFile || 'N/A';

    return `
      <tr class="border-b hover:bg-slate-50 transition" data-row-id="${escHtml(it.rowId)}">
        <td class="p-2 text-center font-bold text-gray-500">${idx + 1}</td>
        <td class="p-2 font-mono font-bold text-blue-900">${escHtml(it.itemCode)}</td>
        <td class="p-2 font-semibold text-gray-800">${escHtml(it.itemDescription)}</td>
        <td class="p-2 text-center font-mono font-semibold">${formatExpiryDateDisplay(it.expiryDate)}</td>
        <td class="p-2 text-center">
          <input type="text" class="writeoff-uom w-12 text-center bg-white border border-gray-300 rounded px-1 py-0.5 text-xs font-bold" value="${escHtml(it.uom || 'Unit')}">
        </td>
        <td class="p-2 text-center">
          <input type="number" min="1" step="1" class="writeoff-qty w-14 text-center bg-white border border-gray-300 rounded px-1 py-0.5 text-xs font-bold" value="${qty}" onchange="recalculateWriteOffRowTotal(this)">
        </td>
        <td class="p-2 text-right">
          <input type="number" min="0" step="0.01" class="writeoff-unitcost w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 text-xs font-mono font-bold" value="${unitCost.toFixed(2)}" onchange="recalculateWriteOffRowTotal(this)">
        </td>
        <td class="p-2 text-right font-mono font-extrabold text-rose-700 writeoff-row-total">
          RM ${rowTotal.toFixed(2)}
        </td>
        <td class="p-2">
          <input type="text" class="writeoff-reason w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-medium" value="${escHtml(it.writeOffReason || 'LACK OF MONITORING')}">
        </td>
        <td class="p-2">
          <input type="text" class="writeoff-pisupplier w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-medium" value="${escHtml(defaultPiSupplier)}">
        </td>
        <td class="p-2">
          <input type="text" class="writeoff-disposal w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-medium" value="${escHtml(defaultDisposal)}">
        </td>
        <td class="p-2 text-center">
          <button type="button" onclick="removeWriteOffRow('${escHtml(it.rowId)}')" class="text-gray-400 hover:text-rose-600 p-1 transition cursor-pointer" title="Remove from this write-off list">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (totalCostSumEl) totalCostSumEl.textContent = `RM ${totalCost.toFixed(2)}`;
}

function recalculateWriteOffRowTotal(inputEl) {
  const row = inputEl.closest('tr');
  if (!row) return;
  const qtyEl = row.querySelector('.writeoff-qty');
  const unitCostEl = row.querySelector('.writeoff-unitcost');
  const totalEl = row.querySelector('.writeoff-row-total');

  const q = parseFloat(qtyEl?.value) || 0;
  const c = parseFloat(unitCostEl?.value) || 0;
  const tot = q * c;
  if (totalEl) totalEl.textContent = `RM ${tot.toFixed(2)}`;

  let grandTotal = 0;
  document.querySelectorAll('.writeoff-row-total').forEach(el => {
    const val = parseFloat(el.textContent.replace(/[^\d.]/g, '')) || 0;
    grandTotal += val;
  });
  const totalCostSumEl = document.getElementById('writeOffTotalCostSum');
  if (totalCostSumEl) totalCostSumEl.textContent = `RM ${grandTotal.toFixed(2)}`;
}

function removeWriteOffRow(rowId) {
  selectedWriteOffRowIds.delete(rowId);
  updateWriteOffSelectedCounter();
  renderWriteOffModalItems();
  if (selectedWriteOffRowIds.size === 0) {
    closeStockWriteOffModal();
  }
}

function printOfficialWriteOffForm() {
  const isPoison = activeWriteOffFormType === 'poison';
  const preparedBy = document.getElementById('writeOffPreparedBy')?.value || 'William Chai';
  const subDate = document.getElementById('writeOffSubmissionDate')?.value || new Date().toISOString().split('T')[0];
  const rows = Array.from(document.querySelectorAll('#writeOffItemsTbody tr'));

  if (!rows.length) {
    alert('No items to print.');
    return;
  }

  let grandTotal = 0;
  const tableRowsHtml = rows.map((r, i) => {
    const code = r.children[1].textContent.trim();
    const desc = r.children[2].textContent.trim();
    const exp = r.children[3].textContent.trim();
    const uom = r.querySelector('.writeoff-uom')?.value || 'Unit';
    const qty = r.querySelector('.writeoff-qty')?.value || '1';
    const cost = parseFloat(r.querySelector('.writeoff-unitcost')?.value || 0).toFixed(2);
    const tot = parseFloat(r.querySelector('.writeoff-row-total')?.textContent.replace(/[^\d.]/g, '') || 0).toFixed(2);
    grandTotal += parseFloat(tot);
    const reason = r.querySelector('.writeoff-reason')?.value || 'LACK OF MONITORING';
    const pi = r.querySelector('.writeoff-pisupplier')?.value || 'N/A';
    const disposal = r.querySelector('.writeoff-disposal')?.value || (isPoison ? 'SENT TO WAREHOUSE FOR DISPOSAL' : 'LOCAL DISPOSAL');

    return `
      <tr>
        <td style="text-align:center; padding: 6px; border: 1px solid #333;">${i + 1}</td>
        <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #333;">${escHtml(code)}</td>
        <td style="padding: 6px; border: 1px solid #333;">${escHtml(desc)}</td>
        <td style="text-align:center; font-family: monospace; padding: 6px; border: 1px solid #333;">${escHtml(exp)}</td>
        <td style="text-align:center; padding: 6px; border: 1px solid #333;">${escHtml(uom)}</td>
        <td style="text-align:center; font-weight: bold; padding: 6px; border: 1px solid #333;">${escHtml(qty)}</td>
        <td style="text-align:right; font-family: monospace; padding: 6px; border: 1px solid #333;">${cost}</td>
        <td style="text-align:right; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #333;">${tot}</td>
        <td style="padding: 6px; border: 1px solid #333;">${escHtml(reason)}</td>
        <td style="padding: 6px; border: 1px solid #333;">${escHtml(pi)}</td>
        <td style="padding: 6px; border: 1px solid #333;">${escHtml(disposal)}</td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the official printable HQ form.');
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>HQ ${isPoison ? 'Poison' : 'Non-Poison'} Stock Write-Off Form - PMG PHARMACY KOTA SENTOSA</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
        .notes-box { font-size: 10px; margin-bottom: 8px; line-height: 1.35; color: #333; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
        .meta-table td { padding: 4px 6px; }
        .main-table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 5px; }
        .main-table th { background: #f0f0f0; border: 1px solid #333; padding: 6px; text-transform: uppercase; font-size: 10px; }
        .total-row td { font-weight: bold; background: #fafafa; border: 1px solid #333; padding: 6px; font-size: 11px; }
        .sig-container { margin-top: 30px; display: flex; justify-content: flex-end; }
        .sig-box { width: 320px; border-top: 1px solid #333; padding-top: 6px; text-align: left; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="notes-box">
        <b>NOTE:</b> This form must be submitted to the Admin in Charge (AIC) for approval to write off expired products that are non-returnable or cannot be credited (CN).<br>
        Attach clear photos showing the item, correct quantity, and expiry/manufacturing date via email.<br>
        <b>Do not dispose of the products until AIC approval has been obtained.</b><br>
        <b>Monthly Submission Date:</b> 14th of the month | Should be attached to the Stock Expiry List upon submission.
      </div>

      <h3 style="margin: 8px 0; text-transform: uppercase; border-bottom: 2px solid #222; padding-bottom: 4px;">
        ${isPoison ? 'POISON' : 'NON-POISON'} STOCK WRITE OFF FORM
      </h3>

      <table class="meta-table">
        <tr>
          <td style="width: 15%; font-weight: bold;">Branch Code</td>
          <td style="width: 35%; font-family: monospace; font-weight: bold;">PQ0147MI</td>
          <td style="width: 15%; font-weight: bold;">Prepared By</td>
          <td style="width: 35%;">${escHtml(preparedBy)}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Branch Name</td>
          <td style="font-weight: bold;">PMG PHARMACY KOTA SENTOSA</td>
          <td style="font-weight: bold;">Date</td>
          <td>${escHtml(subDate)}</td>
        </tr>
      </table>

      <div style="font-size: 10px; font-style: italic; margin-bottom: 4px; color: #555;">
        The Total Cost will be Automatically Calculated
      </div>

      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 30px;">No.</th>
            <th style="width: 80px;">Item Code</th>
            <th>Item Description</th>
            <th style="width: 80px;">Expiry Date</th>
            <th style="width: 50px;">UOM</th>
            <th style="width: 50px;">Quantity</th>
            <th style="width: 80px;">Unit Cost (RM)</th>
            <th style="width: 90px;">Total Cost (RM)</th>
            <th style="width: 140px;">Reason for Expiry</th>
            <th style="width: 170px;">PI No. / Supplier / Date</th>
            <th style="width: 150px;">Disposal Method</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="7" style="text-align: right; text-transform: uppercase;">TOTAL</td>
            <td style="text-align: right; font-family: monospace; color: #b91c1c;">RM ${grandTotal.toFixed(2)}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>

      <div class="sig-container">
        <div class="sig-box">
          <b>Verified by:</b><br>
          <span style="font-size: 10px; color: #555;">(sign & include pharmacist chop)</span>
          <div style="height: 50px;"></div>
          <b>(Pharmacist Person-in-charge)</b><br>
          ${escHtml(preparedBy)}
        </div>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}

function exportWriteOffCsv() {
  const isPoison = activeWriteOffFormType === 'poison';
  const preparedBy = document.getElementById('writeOffPreparedBy')?.value || 'William Chai';
  const subDate = document.getElementById('writeOffSubmissionDate')?.value || new Date().toISOString().split('T')[0];
  const rows = Array.from(document.querySelectorAll('#writeOffItemsTbody tr'));

  if (!rows.length) {
    alert('No items to export.');
    return;
  }

  const lines = [
    `"NOTE: This form must be submitted to the Admin in Charge (AIC) for approval to write off expired products that are non-returnable or cannot be credited (CN)."`,
    `"Attach clear photos showing the item, correct quantity, and expiry/manufacturing date via email."`,
    `"Do not dispose of the products until AIC approval has been obtained."`,
    `"Monthly Submission Date: 14th of the month"`,
    `"Should be attached to the Stock Expiry List upon submission."`,
    `""`,
    `"Branch Code","PQ0147MI","Prepared By","${preparedBy}"`,
    `"Branch Name","PMG PHARMACY KOTA SENTOSA","Date","${subDate}"`,
    `"Form Type","${isPoison ? 'POISON WRITE OFF FORM' : 'NON-POISON WRITE OFF FORM'}"`,
    `"The Total Cost will be Automatically Calculated"`,
    `"No.","Item Code","Item Description","Expiry Date","UOM","Quantity","Unit Cost (RM)","Total Cost (RM)","Reason for Expiry","PI No. / Supplier / Purchase Date","Disposal Method"`
  ];

  let grandTotal = 0;
  rows.forEach((r, i) => {
    const code = r.children[1].textContent.trim();
    const desc = r.children[2].textContent.trim();
    const exp = r.children[3].textContent.trim();
    const uom = r.querySelector('.writeoff-uom')?.value || 'Unit';
    const qty = r.querySelector('.writeoff-qty')?.value || '1';
    const cost = parseFloat(r.querySelector('.writeoff-unitcost')?.value || 0).toFixed(2);
    const tot = parseFloat(r.querySelector('.writeoff-row-total')?.textContent.replace(/[^\d.]/g, '') || 0).toFixed(2);
    grandTotal += parseFloat(tot);
    const reason = r.querySelector('.writeoff-reason')?.value || 'LACK OF MONITORING';
    const pi = r.querySelector('.writeoff-pisupplier')?.value || 'N/A';
    const disposal = r.querySelector('.writeoff-disposal')?.value || (isPoison ? 'SENT TO WAREHOUSE FOR DISPOSAL' : 'LOCAL DISPOSAL');

    lines.push(`"${i + 1}","${code}","${desc.replace(/"/g, '""')}","${exp}","${uom}","${qty}","${cost}","${tot}","${reason}","${pi.replace(/"/g, '""')}","${disposal}"`);
  });

  lines.push(`"","","","","","TOTAL","","${grandTotal.toFixed(2)}","","",""`);
  lines.push(`""`);
  lines.push(`"","","","","","","","Verified by: (sign & include pharmacist chop)","","(Pharmacist Person-in-charge)"`);

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PMG_${isPoison ? 'Poison' : 'NonPoison'}_WriteOff_PQ0147MI_${subDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function confirmAndExecuteWriteOff() {
  const count = selectedWriteOffRowIds.size;
  if (count === 0) return;

  const conf = confirm(
    `Are you sure you want to write off these ${count} item(s)?\n\n` +
    `Once confirmed:\n` +
    `1. They will be removed from your active stock expiry tracking list.\n` +
    `2. A local archive entry is recorded.\n\n` +
    `Ensure you have printed or exported the official HQ write-off form first.`
  );
  if (!conf) return;

  // Mark/remove from expiryItems
  const toRemove = new Set(selectedWriteOffRowIds);
  const archived = [];
  expiryItems = expiryItems.filter(it => {
    if (toRemove.has(it.rowId)) {
      archived.push({
        ...it,
        writtenOffAt: new Date().toISOString(),
        writeOffType: activeWriteOffFormType
      });
      return false;
    }
    return true;
  });

  // Save archived items
  try {
    const existingArchive = JSON.parse(localStorage.getItem('pmg_written_off_stock_archive') || '[]');
    localStorage.setItem('pmg_written_off_stock_archive', JSON.stringify([...existingArchive, ...archived]));
  } catch (err) {
    console.warn('Failed to save to write-off archive:', err);
  }

  selectedWriteOffRowIds.clear();
  updateWriteOffSelectedCounter();
  saveLocalExpiryData();
  closeStockWriteOffModal();
  renderExpiryUI();

  if (window.pmgOneDriveSync?.saveStockExpiryToOneDrive) {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive('Kota Sentosa');
  }

  showExpiryToast(`✅ Successfully written off and removed ${count} expired item(s)!`);
}

// Window exports
window.openSkuBatchExplorerModal = openSkuBatchExplorerModal;
window.closeSkuBatchExplorerModal = closeSkuBatchExplorerModal;
window.filterExpiryByCurrentSku = filterExpiryByCurrentSku;
window.toggleSelectWriteOffItem = toggleSelectWriteOffItem;
window.toggleSelectAllExpiry = toggleSelectAllExpiry;
window.openStockWriteOffModal = openStockWriteOffModal;
window.closeStockWriteOffModal = closeStockWriteOffModal;
window.setWriteOffFormType = setWriteOffFormType;
window.recalculateWriteOffRowTotal = recalculateWriteOffRowTotal;
window.removeWriteOffRow = removeWriteOffRow;
window.printOfficialWriteOffForm = printOfficialWriteOffForm;
window.exportWriteOffCsv = exportWriteOffCsv;
window.confirmAndExecuteWriteOff = confirmAndExecuteWriteOff;
window.updateAccountsShareUi = updateAccountsShareUi;
window.copyAccountsWhatsAppSummary = copyAccountsWhatsAppSummary;
window.promptSetOneDriveShareLink = promptSetOneDriveShareLink;
window.handleBatchInvoiceAndCnUpload = handleBatchInvoiceAndCnUpload;
window.confirmOcrBatchInsert = confirmOcrBatchInsert;
window.ensureUniqueExpiryRowIds = ensureUniqueExpiryRowIds;
window.getExpiryItemKey = getExpiryItemKey;
window.setPendingOcrItems = (items) => { pendingOcrItems = items; };
window.getPendingOcrItems = () => pendingOcrItems;

// HQ Return Policy Engine exports
window.syncHqReturnPolicy = syncHqReturnPolicy;
window.openHqReturnPolicyModal = openHqReturnPolicyModal;
window.closeHqReturnPolicyModal = closeHqReturnPolicyModal;
window.saveHqReturnSheetUrlAndSync = saveHqReturnSheetUrlAndSync;
window.filterHqPolicyModalRows = filterHqPolicyModalRows;
window.setHqPolicyCategoryFilter = setHqPolicyCategoryFilter;
window.setHqPolicyStatusFilter = setHqPolicyStatusFilter;
window.parseHqReturnPolicyWorkbook = parseHqReturnPolicyWorkbook;
window.getHqPolicyForItem = getHqPolicyForItem;
window.getItemHqReturnStatus = getItemHqReturnStatus;
window.initHqReturnPolicy = initHqReturnPolicy;

// Clearance Promo Price Tag Engine exports
window.openClearancePriceTagModal = openClearancePriceTagModal;
window.closeClearancePriceTagModal = closeClearancePriceTagModal;
window.updatePriceTagLivePreview = updatePriceTagLivePreview;
window.quickRoundOfferPrice = quickRoundOfferPrice;
window.setTagCopiesToStock = setTagCopiesToStock;
window.fillA4SheetCopies = fillA4SheetCopies;
window.saveClearancePriceTag = saveClearancePriceTag;
window.printClearancePriceTags = printClearancePriceTags;
window.updateExpiryOfferedPrice = updateExpiryOfferedPrice;

window.pmgExpiry = {
  getItems: () => expiryItems,
  setItems: (items) => { expiryItems = ensureUniqueExpiryRowIds(items); saveLocalExpiryData(); renderExpiryUI(); },
  mergeDatasets: mergeExpiryDatasets,
  ensureUniqueRowIds: ensureUniqueExpiryRowIds,
  getItemKey: getExpiryItemKey,
  saveLocal: saveLocalExpiryData,
  renderUI: renderExpiryUI,
  syncFromOneDrive: () => window.pmgOneDriveSync?.syncStockExpiryWithOneDrive(false),
  saveToOneDrive: (branch) => window.pmgOneDriveSync?.saveStockExpiryToOneDrive(branch),
  syncFromSheets: syncExpiryFromSheets,
  getShortDatedStock: getShortDatedStockForReplenishment,
  syncHqReturnPolicy: syncHqReturnPolicy,
  getHqPolicyForItem: getHqPolicyForItem,
  getItemHqReturnStatus: getItemHqReturnStatus,
  openPriceTag: openClearancePriceTagModal,
  printPriceTag: printClearancePriceTags,
  setOfferedPrice: updateExpiryOfferedPrice
};


