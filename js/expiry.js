// js/expiry.js — Module 5: Stock Expiry Tracker & OCR Extraction Engine
'use strict';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const PMG_EXPIRY_API_URL = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
const EXPIRY_STORAGE_KEY = 'pmg_stock_expiry_data';
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ─── MULTI-TIER GEMINI AI CONFIGURATION ───────────────────────────────────────
// Primary: gemini-3.5-flash-lite (15 RPM / 500 RPD — fast invoice OCR)
// Secondary: gemini-3.5-flash (5 RPM / 20 RPD — complex multi-column invoice reasoning)
// Tertiary: gemini-3.1-flash-lite (15 RPM / 500 RPD — high quota fallback)
const EXPIRY_OCR_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const EXPIRY_OCR_SECONDARY_MODEL = 'gemini-3.5-flash';
const EXPIRY_OCR_TERTIARY_MODEL  = 'gemini-3.1-flash-lite';
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
  search: ''
};
let expiryCurrentPage = 1;
const EXPIRY_PAGE_SIZE = 100;

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
  if (item.itemCode && set.has(String(item.itemCode).trim().toUpperCase())) return true;
  if (item.rowId && set.has(`ROW_${item.rowId}`)) return true;
  const itemKey = typeof getExpiryItemKey === 'function' ? getExpiryItemKey(item) : '';
  if (itemKey && set.has(itemKey.toUpperCase())) return true;
  return false;
}

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
function initExpiryModule() {
  initHqReturnPolicy();
  loadLocalExpiryData();
  setupExpiryEventListeners();
  renderExpiryUI();
  updateAccountsShareUi(document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa');
  
  // Immediately synchronize with OneDrive if folder is connected
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.syncStockExpiryWithOneDrive === 'function') {
    window.pmgOneDriveSync.syncStockExpiryWithOneDrive(true).catch(console.warn);
  }

  // Fetch fresh data from Google Sheet in background
  syncExpiryFromSheets(false);
}

function loadLocalExpiryData() {
  // Ensure default SKU 119253 is in persistent tombstone
  addClearedExpiryKey('119253');
  addClearedExpiryKey('ROW_6951');
  addClearedExpiryKey('KOTA SENTOSA|119253|NO_BATCH');

  try {
    const raw = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (raw) {
      expiryItems = JSON.parse(raw);
    }
    // If local storage is empty or only had small preliminary test items, seed with full Kota Sentosa master dataset
    if ((!expiryItems || expiryItems.length < 500) && Array.isArray(window.PMG_SEED_EXPIRY_DATA) && window.PMG_SEED_EXPIRY_DATA.length > 0) {
      console.log(`[PMG Expiry] Preloading ${window.PMG_SEED_EXPIRY_DATA.length} master seed records for Kota Sentosa...`);
      expiryItems = window.PMG_SEED_EXPIRY_DATA;
      saveLocalExpiryData();
    }

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
  } catch (e) {
    console.warn('[PMG Expiry] Error reading local expiry data:', e);
    if (Array.isArray(window.PMG_SEED_EXPIRY_DATA)) {
      expiryItems = window.PMG_SEED_EXPIRY_DATA;
    } else {
      expiryItems = [];
    }
  }
}

function saveLocalExpiryData() {
  try {
    localStorage.setItem(EXPIRY_STORAGE_KEY, JSON.stringify(expiryItems));
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

  // If local storage is empty, fallback to pre-seeded rules from hq_return_policy.js
  if ((!hqReturnPolicyList || hqReturnPolicyList.length === 0) && Array.isArray(window.PMG_HQ_RETURN_POLICY_SEED)) {
    hqReturnPolicyList = window.PMG_HQ_RETURN_POLICY_SEED;
    try {
      localStorage.setItem(HQ_RETURN_POLICY_STORAGE_KEY, JSON.stringify(hqReturnPolicyList));
    } catch (e) {}
  }

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
  if (pill) pill.textContent = `${count} Rules Active`;
  if (modalBadge) modalBadge.textContent = `${count} Items`;

  const lastSync = localStorage.getItem('pmg_hq_return_last_sync');
  if (lastSyncEl && lastSync) {
    try {
      const d = new Date(lastSync);
      lastSyncEl.textContent = `Synced: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      lastSyncEl.textContent = 'Live Google Sheet';
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
  const tooltip = escHtml(pol.policy || pol.summary || 'HQ Policy Rule');

  if (status === 'NON-RETURNABLE') {
    return `
      <div class="inline-flex flex-col items-center">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200" title="${tooltip}">
          <i class="fa-solid fa-ban text-[9px] text-rose-600"></i> Non-Returnable
        </span>
        ${brand ? `<span class="text-[9px] font-mono text-gray-400 mt-0.5">${brand}</span>` : ''}
      </div>`;
  }

  if (status === 'RETURNABLE') {
    return `
      <div class="inline-flex flex-col items-center">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title="${tooltip}">
          <i class="fa-solid fa-circle-check text-[9px] text-emerald-600"></i> Returnable
        </span>
        ${brand ? `<span class="text-[9px] font-mono text-emerald-700 mt-0.5">${brand}</span>` : ''}
      </div>`;
  }

  return `
    <div class="inline-flex flex-col items-center">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="${tooltip}">
        <i class="fa-solid fa-triangle-exclamation text-[9px] text-amber-600"></i> Special
      </span>
      ${brand ? `<span class="text-[9px] font-mono text-amber-700 mt-0.5">${brand}</span>` : ''}
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
      const upperPolicy = policyText.toUpperCase();

      let status = 'NON-RETURNABLE';
      if (upperPolicy.includes('INFORM SALES REP') || upperPolicy.includes('THOMAS')) {
        status = 'SPECIAL';
      } else if (upperPolicy.includes('NON-RETURNABLE') || upperPolicy.includes('NON RETURNABLE') || upperPolicy.includes('NO RETURN')) {
        status = 'NON-RETURNABLE';
      } else if (upperPolicy.includes('RETURNABLE')) {
        status = 'RETURNABLE';
      }

      results.push({
        code: itemCode,
        desc: itemDesc,
        brand: currentBrand || 'Direct',
        policy: policyText,
        status: status,
        summary: policyText.length > 80 ? policyText.substring(0, 77) + '...' : policyText
      });
    }
  }

  return results;
}

async function syncHqReturnPolicy(showToast = true) {
  const customUrl = localStorage.getItem(HQ_RETURN_SHEET_URL_STORAGE_KEY);
  const rawUrl = customUrl || (window.PMG_DEFAULT_HQ_RETURN_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1u2wfNbx77eiah3g3NPofbS391uESt7tA/edit?gid=179261997#gid=179261997');
  
  let csvUrl = rawUrl;
  if (!csvUrl.includes('format=csv')) {
    const gidMatch = csvUrl.match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '179261997';
    const idMatch = csvUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gid}`;
    }
  }

  if (showToast) {
    showExpiryToast('🔄 Fetching live HQ Return Policy sheet...');
  }

  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();

    const parsedRules = parseHqReturnPolicyCsvText(text);
    if (parsedRules.length === 0) {
      throw new Error('No valid product rules parsed from sheet.');
    }

    hqReturnPolicyList = parsedRules;
    localStorage.setItem(HQ_RETURN_POLICY_STORAGE_KEY, JSON.stringify(hqReturnPolicyList));
    localStorage.setItem('pmg_hq_return_last_sync', new Date().toISOString());

    buildHqReturnPolicyMaps();
    updateHqPolicyHeaderBadge();
    renderExpiryUI();

    if (showToast) {
      showExpiryToast(`✅ HQ Return Policy synced! (${hqReturnPolicyList.length} rules active)`);
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
      showExpiryToast(`⚠️ Live sync failed (${err.message}). Using cached policy rules.`);
    }
  }
}

function openHqReturnPolicyModal() {
  const modal = document.getElementById('modalHqReturnPolicy');
  if (!modal) return;
  const input = document.getElementById('hqReturnSheetUrlInput');
  const storedUrl = localStorage.getItem(HQ_RETURN_SHEET_URL_STORAGE_KEY) || window.PMG_DEFAULT_HQ_RETURN_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1u2wfNbx77eiah3g3NPofbS391uESt7tA/edit?gid=179261997#gid=179261997';
  if (input) input.value = storedUrl;

  const extLink = document.getElementById('hqReturnSheetExternalLink');
  if (extLink) extLink.href = storedUrl;

  const searchInput = document.getElementById('modalHqPolicySearchInput');
  if (searchInput) searchInput.value = '';

  filterHqPolicyModalRows('');
  modal.classList.remove('hidden');
}

function closeHqReturnPolicyModal() {
  const modal = document.getElementById('modalHqReturnPolicy');
  if (modal) modal.classList.add('hidden');
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
  if (!tbody) return;
  const q = (query || '').toLowerCase().trim();

  const filtered = (hqReturnPolicyList || []).filter(item => {
    if (!q) return true;
    const c = String(item.code || '').toLowerCase();
    const d = String(item.desc || '').toLowerCase();
    const b = String(item.brand || '').toLowerCase();
    const p = String(item.policy || '').toLowerCase();
    return c.includes(q) || d.includes(q) || b.includes(q) || p.includes(q);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-400">No policy rules found matching "${escHtml(q)}"</td></tr>`;
    return;
  }

  const displayRows = filtered.slice(0, 200);
  tbody.innerHTML = displayRows.map(it => {
    const isNonRet = it.status === 'NON-RETURNABLE';
    const isRet = it.status === 'RETURNABLE';
    const badgeHtml = isNonRet
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">NON-RETURNABLE</span>`
      : isRet
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">RETURNABLE</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">${escHtml(it.status)}</span>`;

    return `
      <tr class="hover:bg-slate-50 transition border-b border-gray-100">
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
  if (c && c !== 'N/A') {
    const batchKey = (bt && bt !== 'N/A') ? bt : 'NO_BATCH';
    return `${b}|${c}|${batchKey}`;
  }
  if (item.rowId) {
    return `${b}|ID_${item.rowId}`;
  }
  const d = (item.itemDescription || '').trim().toUpperCase().slice(0, 40);
  return `${b}|${d}|${bt || 'NO_BATCH'}`;
}

function mergeExpiryDatasets(localList, remoteList) {
  if (!Array.isArray(remoteList) || remoteList.length === 0) return localList || [];
  if (!Array.isArray(localList) || localList.length === 0) return remoteList;

  const clearedSet = getClearedExpiryKeys();
  const map = new Map();

  // Index local items first
  localList.forEach((it, idx) => {
    const key = getExpiryItemKey(it) || `ROW_${it.rowId || idx}`;
    const clone = { ...it };
    if (isItemMarkedDoneOrCleared(clone, clearedSet)) {
      clone.status = 'DONE';
      clone.quantity = 0;
    }
    map.set(key, clone);
  });

  // Merge remote items
  remoteList.forEach((rem, idx) => {
    const key = getExpiryItemKey(rem) || `ROW_${rem.rowId || idx}`;
    const remIsCleared = isItemMarkedDoneOrCleared(rem, clearedSet);

    if (!map.has(key)) {
      const clone = { ...rem };
      if (remIsCleared) {
        clone.status = 'DONE';
        clone.quantity = 0;
      }
      map.set(key, clone);
    } else {
      const loc = map.get(key);
      const locIsCleared = isItemMarkedDoneOrCleared(loc, clearedSet);
      const locTs = loc.lastUpdated ? new Date(loc.lastUpdated).getTime() : 0;
      const remTs = rem.lastUpdated ? new Date(rem.lastUpdated).getTime() : 0;

      // CRITICAL: If local is Cleared / DONE, ALWAYS preserve it — even if remote is newer.
      // This prevents background polling / Sheets sync from reverting a just-cleared item.
      if (locIsCleared) {
        loc.status = 'DONE';
        loc.quantity = 0;
        // Local cleared state wins. Keep local as-is.
      } else if (remIsCleared) {
        // Remote cleared takes priority over local Active
        map.set(key, {
          ...loc,
          status: 'DONE',
          quantity: 0,
          clearedAt: rem.clearedAt || rem.lastUpdated || new Date().toISOString(),
          lastUpdated: rem.lastUpdated || loc.lastUpdated,
          updatedBy: rem.updatedBy || loc.updatedBy,
          rowId: loc.rowId || rem.rowId
        });
      } else if (remTs > locTs) {
        // Remote is strictly newer: adopt remote fields
        map.set(key, {
          ...loc,
          ...rem,
          rowId: loc.rowId || rem.rowId
        });
      } else if (locTs > remTs) {
        // Local is strictly newer: retain local
      } else {
        // Timestamps are equal or absent — merge non-empty values
        if (rem.quantity !== undefined && loc.quantity === undefined) loc.quantity = rem.quantity;
        if (rem.expiryDate && !loc.expiryDate) loc.expiryDate = rem.expiryDate;
        if (rem.batchNumber && (!loc.batchNumber || loc.batchNumber === 'N/A')) loc.batchNumber = rem.batchNumber;
      }
    }
  });

  return Array.from(map.values());
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
    const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
    const nowIso = new Date().toISOString();

    const isDoneOrCleared = status === 'DONE' || status === 'COMPLETED' || status === 'Cleared';
    const primaryAction = isDoneOrCleared ? 'mark_cleared' : (expiryDate ? 'update_item' : 'update_qty');

    const payload = {
      action: primaryAction,
      subAction: primaryAction,
      rowId: rowId,
      branch: item?.branch || extraFields.branch || 'Kota Sentosa',
      itemCode: item?.itemCode || extraFields.itemCode || '',
      itemDescription: item?.itemDescription || extraFields.itemDescription || '',
      batchNumber: item?.batchNumber || extraFields.batchNumber || '',
      quantity: quantity,
      status: status || (isDoneOrCleared ? 'DONE' : 'Active'),
      expiryDate: expiryDate || item?.expiryDate || '',
      lastUpdated: nowIso,
      updatedBy: session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist'
    };
    if (extraFields.itemDescription) payload.itemDescription = extraFields.itemDescription;
    if (extraFields.batchNumber) payload.batchNumber = extraFields.batchNumber;
    if (extraFields.itemCode) payload.itemCode = extraFields.itemCode;

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
      action: 'batch_insert_expiry',
      items: items,
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
  const apiKey = (localStorage.getItem('pmg_gemini_key') || '').trim() || PMG_GLOBAL_FALLBACK_KEY;
  const base64Data = await readFileAsBase64(file);

  if (typeof onStatus === 'function') {
    onStatus(`Analyzing ${file.name} layout & extracting line items via Gemini AI…`);
  }

  const prompt = `
You are an expert pharmaceutical invoice parser for Malaysian pharmacy chains (e.g. PMG Pharmacy).
Analyze this invoice document carefully.
Identify:
1. Supplier Name (e.g. DKSH, Zuellig Pharma, Sung Hoe, SSJ, Pahang Pharmacy, Apex, TLS, etc.)
2. Document Date (e.g. 2026)
3. Table of Line Items (products, medicines, OTC items)

Extract all inventory line items into a JSON array of objects.
CRITICAL EXTRACTION RULES:
- "batchNumber": Look for Batch / Lot / Lot No. (e.g. "2605447", "SE07", "BT-8890"). If printed alongside expiry date (e.g. "SE07 23/05/26"), correctly isolate the batch number. If none, output "N/A".
- "itemCode": Internal product code or SKU (typically 4-8 digits like "119356", "105675" or alphanumeric). If not found, output "N/A".
- "itemDescription": Full product or medicine name with strength/form if shown (e.g., "VASELINE BABY PROTECTING JELLY 50ML", "MAGNOMINT TAB 10'S").
- "expiryDate": The product's shelf-life expiration date, strictly formatted as "DD/MM/YYYY":
    * IMPORTANT: Expiration dates are ALWAYS in the future relative to the invoice date (typically 2026 to 2035). They are NEVER in the past or year 2000.
    * Malaysian pharmaceutical invoices write dates in DD-MM-YY (Day-Month-Year) or DD/MM/YYYY.
    * If 2-digit year (e.g., "04-02-28"), "28" is the YEAR 2028, "02" is February, "04" is the day -> output "04/02/2028".
    * If Month/Year format (e.g., "10/28" or "OCT-28"), output the last day of the month -> "31/10/2028".
    * Do NOT confuse Invoice Date, Order Date, or Manufacturing Date (MFG/DOM) with Expiry Date (EXP/LUAR TARIKH).
- "quantity": Billed or delivered quantity as a positive number.
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

    return {
      tempId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${idx}`,
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
      const msg = `✓ Extracted ${pendingOcrItems.length} items from ${sourceNames.length} invoice(s).` +
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

async function confirmOcrBatchInsert() {
  const selectedItems = pendingOcrItems.filter(it => it.selected);
  if (selectedItems.length === 0) {
    alert('Please select at least one item to save.');
    return;
  }

  const branchSelect = document.getElementById('expiryOcrBranchSelect');
  const targetBranch = branchSelect ? branchSelect.value : 'Kota Sentosa';

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();
  const userName = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';

  selectedItems.forEach(it => {
    it.branch = targetBranch;
    it.lastUpdated = nowIso;
    it.updatedBy = userName;
  });

  const commitBtn = document.getElementById('expiryOcrCommitBtn');
  if (commitBtn) {
    commitBtn.disabled = true;
    commitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Saving to Google Sheet...`;
  }

  // 1. Append locally
  expiryItems.unshift(...selectedItems);
  saveLocalExpiryData();
  renderExpiryUI();

  // 2. Save to OneDrive
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(targetBranch).catch(console.warn);
  }

  // 3. Push to Google Sheet
  const ok = await pushBatchExpiryToSheets(selectedItems);

  if (commitBtn) {
    commitBtn.disabled = false;
    commitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-1.5"></i>Confirm & Save to Google Sheet`;
  }

  closeOcrReviewModal();
  showExpiryToast(ok ? `✅ Saved ${selectedItems.length} items to Google Sheet (${targetBranch})!` : `Saved locally (Sheet update in progress).`);
}

// ─── EXPIRY DATE & QUANTITY EDITING & CLEARANCE ─────────────────────────────
/**
 * Updates an item's expiry date inline from the table or modal.
 * Validates with parseExpiryDate, re-calculates horizons, updates KPIs, and syncs to Sheets.
 */
function updateExpiryItemDate(rowId, newDateStr, inputEl) {
  const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
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
  const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
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
  if (it.actionPlan && String(it.actionPlan).trim() !== '') {
    return it.actionPlan;
  }
  const retStatus = getItemHqReturnStatus(it);
  if (retStatus === 'RETURNABLE' || retStatus === 'SPECIAL') {
    return 'Returnable with Condition';
  }
  return '';
}

function updateExpiryActionPlan(rowId, val) {
  const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
  if (!item) return;
  item.actionPlan = (val || '').trim();
  item.lastUpdated = new Date().toISOString();
  saveLocalExpiryData();
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
    window.pmgOneDriveSync.saveStockExpiryToOneDrive(item.branch).catch(console.warn);
  }
  pushExpiryUpdateToSheets(item.rowId, item.quantity, item.status, item.expiryDate, { actionPlan: item.actionPlan });
}

async function markExpiryItemCleared(rowId) {
  const target = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
  if (!target) return;

  // 1. Race condition prevention: Pause background auto-polling for 5 seconds
  if (typeof window.pausePmgSyncPolling === 'function') {
    window.pausePmgSyncPolling(5000);
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();
  const userName = session?.displayName || localStorage.getItem('pmg_user_name') || 'Pharmacist';
  const targetKey = getExpiryItemKey(target);

  // Snapshot for rollback in case Google Sheet write fails
  const rollbackSnapshot = JSON.parse(JSON.stringify(expiryItems));

  // Add to persistent tombstone set
  if (target.itemCode) addClearedExpiryKey(target.itemCode);
  if (target.rowId) addClearedExpiryKey(`ROW_${target.rowId}`);
  if (targetKey) addClearedExpiryKey(targetKey);

  // Mark all matching rows with same rowId OR same itemCode & branch as cleared to eliminate duplicate ghosts
  expiryItems.forEach(it => {
    const isSameId = it.rowId === target.rowId || String(it.rowId) === String(target.rowId);
    const isSameKey = targetKey && (getExpiryItemKey(it) === targetKey);
    const isSameCode = it.itemCode && target.itemCode && (String(it.itemCode).trim().toUpperCase() === String(target.itemCode).trim().toUpperCase()) && (String(it.branch).trim().toLowerCase() === String(target.branch).trim().toLowerCase());
    if (isSameId || isSameKey || isSameCode) {
      it.status = 'DONE';
      it.quantity = 0;
      it.clearedAt = nowIso;
      it.lastUpdated = nowIso;
      it.updatedBy = userName;
    }
  });

  saveLocalExpiryData();
  renderExpiryUI();

  try {
    // 2. Persist to connected Google Sheet row immediately
    await pushExpiryUpdateToSheets(target.rowId, 0, 'DONE', target.expiryDate, {
      branch: target.branch,
      itemCode: target.itemCode,
      itemDescription: target.itemDescription,
      batchNumber: target.batchNumber
    });

    // 3. Save to OneDrive
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveStockExpiryToOneDrive === 'function') {
      window.pmgOneDriveSync.saveStockExpiryToOneDrive(target.branch).catch(console.warn);
    }

    showExpiryToast(`✅ Marked ${target.itemDescription || target.itemCode} as DONE and persisted!`);
  } catch (err) {
    console.error('[markExpiryItemCleared] Failed to persist cleared status:', err);

    // Rollback state if write request fails (keep item visible and show error toast)
    expiryItems = rollbackSnapshot;
    if (target.itemCode) removeClearedExpiryKey(target.itemCode);
    if (target.rowId) removeClearedExpiryKey(`ROW_${target.rowId}`);
    if (targetKey) removeClearedExpiryKey(targetKey);

    saveLocalExpiryData();
    renderExpiryUI();

    showExpiryToast(`❌ Google Sheet update failed: Clearance for ${target.itemDescription || target.itemCode} not saved. Item restored.`);
  }
}

async function reactivateExpiryItem(rowId) {
  const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
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
  const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
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

  modal.classList.remove('hidden');
}

function closeEditExpiryItemModal() {
  const modal = document.getElementById('expiryEditModal');
  if (modal) modal.classList.add('hidden');
}

async function handleEditExpiryItemSubmit(e) {
  e.preventDefault();
  const rowId = document.getElementById('editRowId')?.value;
  const item = expiryItems.find(it => it.rowId === rowId || String(it.rowId) === String(rowId));
  if (!item) return;

  const branch = document.getElementById('editBranch')?.value;
  const itemCode = document.getElementById('editItemCode')?.value.trim();
  const itemDescription = document.getElementById('editItemDesc')?.value.trim();
  const batchNumber = document.getElementById('editBatch')?.value.trim();
  const qtyVal = parseFloat(document.getElementById('editQty')?.value);
  const expiryRaw = document.getElementById('editExpiry')?.value.trim();

  const parsed = parseExpiryDate(expiryRaw);
  if (!parsed) {
    alert(`⚠️ Invalid expiry date "${expiryRaw}". Please enter a valid date (e.g. DD/MM/YYYY, MM/YYYY, or MM/YY).`);
    return;
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const nowIso = new Date().toISOString();

  const formattedDate = formatExpiryDateDisplay(parsed);
  item.branch = branch;
  item.itemCode = itemCode;
  item.itemDescription = itemDescription;
  item.batchNumber = batchNumber;
  item.quantity = isNaN(qtyVal) ? item.quantity : qtyVal;
  item.expiryDate = formattedDate;
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
    batchNumber: item.batchNumber
  });

  showExpiryToast(`✅ Saved changes for ${item.itemDescription || item.itemCode}`);
}

// ─── FILTERING & UI RENDERING ────────────────────────────────────────────────
function filterExpiryItems() {
  return expiryItems.filter(it => {
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

    // 4. Search filter
    if (activeExpiryFilter.search) {
      const q = activeExpiryFilter.search.toLowerCase().trim();
      const code = String(it.itemCode || '').toLowerCase();
      const desc = String(it.itemDescription || '').toLowerCase();
      const batch = String(it.batchNumber || '').toLowerCase();
      if (!code.includes(q) && !desc.includes(q) && !batch.includes(q)) return false;
    }

    return true;
  });
}

function renderExpiryUI() {
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

  tbody.innerHTML = displayedItems.map((it, idx) => {
    const h = calculateExpiryHorizon(it.expiryDate);
    const isCleared = isItemMarkedDoneOrCleared(it);

    let badgeClass = 'bg-gray-100 text-gray-600';
    if (h.level === 'expired' || h.level === 'critical') badgeClass = 'bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse';
    else if (h.level === 'urgent') badgeClass = 'bg-amber-100 text-amber-800 font-bold border border-amber-200';
    else if (h.level === 'kpi') badgeClass = 'bg-yellow-100 text-yellow-800 font-bold border border-yellow-200';
    else if (h.level === 'monitor') badgeClass = 'bg-blue-100 text-blue-700 font-semibold';
    else if (h.level === 'safe') badgeClass = 'bg-emerald-100 text-emerald-700';

    return `
      <tr class="border-b hover:bg-slate-50/80 transition ${isCleared ? 'opacity-50 bg-gray-50' : ''}">
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
        </td>
        <td class="p-3 text-center whitespace-nowrap text-xs">
          ${renderHqReturnPolicyBadge(it)}
        </td>
        <td class="p-3 text-center text-xs whitespace-nowrap">
          ${isCleared ? `
            <span class="text-gray-400 text-xs italic">${escHtml(getItemActionPlan(it) || '—')}</span>
          ` : `
            <input type="text"
              list="actionPlanOptions"
              value="${escHtml(getItemActionPlan(it))}"
              placeholder="Action plan remark…"
              onchange="updateExpiryActionPlan(${it.rowId}, this.value)"
              class="w-36 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white font-medium text-gray-800"
              title="Action Plan Remark (e.g. Returnable with Condition, Vendor Return Pending, Clearance Promo / PWP)">
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
                onchange="updateExpiryItemDate(${it.rowId}, this.value, this)"
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
              onchange="updateExpiryItemQuantity(${it.rowId}, this.value)"
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
            <button onclick="reactivateExpiryItem(${it.rowId})" class="text-blue-600 hover:underline font-semibold text-xs">
              <i class="fa-solid fa-rotate-left mr-1"></i>Restore
            </button>
          ` : `
            <div class="inline-flex items-center gap-1.5">
              <button onclick="markExpiryItemCleared(${it.rowId})"
                class="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition"
                title="Click when stock is fully sold or cleared">
                <i class="fa-solid fa-check mr-1 text-emerald-600"></i>Done Clear
              </button>
              <button onclick="openEditExpiryItemModal(${it.rowId})"
                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
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
    rowId: expiryItems.length + 2,
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
  const current = localStorage.getItem('pmg_gemini_key') || '';
  const newKey = prompt('🔑 Google Gemini API Key:\n(Leave blank to use the built-in system key)', current);
  if (newKey !== null) {
    const trimmed = newKey.trim();
    if (trimmed) {
      localStorage.setItem('pmg_gemini_key', trimmed);
      showExpiryToast('✅ Custom Gemini API key saved!');
    } else {
      localStorage.removeItem('pmg_gemini_key');
      showExpiryToast('✅ Using built-in default system Gemini API key.');
    }
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

// Window exports
window.updateAccountsShareUi = updateAccountsShareUi;
window.copyAccountsWhatsAppSummary = copyAccountsWhatsAppSummary;
window.promptSetOneDriveShareLink = promptSetOneDriveShareLink;
window.handleBatchInvoiceAndCnUpload = handleBatchInvoiceAndCnUpload;

// HQ Return Policy Engine exports
window.syncHqReturnPolicy = syncHqReturnPolicy;
window.openHqReturnPolicyModal = openHqReturnPolicyModal;
window.closeHqReturnPolicyModal = closeHqReturnPolicyModal;
window.saveHqReturnSheetUrlAndSync = saveHqReturnSheetUrlAndSync;
window.filterHqPolicyModalRows = filterHqPolicyModalRows;
window.getHqPolicyForItem = getHqPolicyForItem;
window.getItemHqReturnStatus = getItemHqReturnStatus;
window.initHqReturnPolicy = initHqReturnPolicy;

window.pmgExpiry = {
  getItems: () => expiryItems,
  setItems: (items) => { expiryItems = items; saveLocalExpiryData(); renderExpiryUI(); },
  mergeDatasets: mergeExpiryDatasets,
  saveLocal: saveLocalExpiryData,
  renderUI: renderExpiryUI,
  syncFromOneDrive: () => window.pmgOneDriveSync?.syncStockExpiryWithOneDrive(false),
  saveToOneDrive: (branch) => window.pmgOneDriveSync?.saveStockExpiryToOneDrive(branch),
  syncFromSheets: syncExpiryFromSheets,
  getShortDatedStock: getShortDatedStockForReplenishment,
  syncHqReturnPolicy: syncHqReturnPolicy,
  getHqPolicyForItem: getHqPolicyForItem,
  getItemHqReturnStatus: getItemHqReturnStatus
};


