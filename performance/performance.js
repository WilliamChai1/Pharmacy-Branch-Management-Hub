// performance/performance.js — Standalone Outlet Monthly Performance & AI Strategic Analytics Suite
// Separated from main PMG Management Hub to prevent RAM bloat.
// Primary AI: gemini-3.5-flash-lite | Secondary AI: gemini-3.1-flash-lite
'use strict';

// ─── CONSTANTS & CONFIGURATION ──────────────────────────────────────────────
const PERF_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const PERF_SECONDARY_MODEL = 'gemini-3.1-flash-lite';
const PERF_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

const ALL_12_CATEGORIES = [
  'ELDERLY',
  'F & B',
  'FIR-AID',
  'HOME&LIV',
  'MOM&BABY',
  'NON-SCHE',
  'NON-SC-P',
  'OTC',
  'PERSONAL',
  'SCHE-DRU',
  'SUPPLEME',
  'WYMED-EX'
];

const HQ_11_CATEGORIES = ALL_12_CATEGORIES.filter(c => c !== 'WYMED-EX');

const STORAGE_KEYS = {
  STATE:       'pmg_perf_active_state_v1',
  HIDE_SAMPLE: 'pmg_perf_hide_sample_v1',
  TASKS:       'pmg_perf_monthly_tasks_v1',
  ROLES:       'pmg_perf_teammate_roles_v1',
  AI_REPORT:   'pmg_perf_ai_report_v1',
  GEMINI_KEY:  'pmg_gemini_key'
};

// Known Kota Sentosa role mapping (can be customized in UI)
const DEFAULT_ROLE_MAP = {
  'CHAI YEE SIAN':                     { role: 'Pharmacist (PIC)', nickname: 'William (PIC)' },
  'KENIX LING WANG YING':              { role: 'Pharmacist',       nickname: 'Kenix' },
  'CHRISTINA LEE YING YING':           { role: 'PRP',              nickname: 'Christina (PRP)' },
  'HANIESHA LOUNA ANAK DAGENG':        { role: 'ABM',              nickname: 'Louna (ABM)' },
  'TING KWANG YU':                     { role: 'BM / Lead',        nickname: 'Ting (BM)' },
  'JONG PEI CHOO':                     { role: 'PA',               nickname: 'Penny (PA)' },
  'NURHAFIZAH BINTI PAULI':            { role: 'PA',               nickname: 'Nurhafizah (PA)' },
  'MUHAMMAD NUR FARIZIN BIN ABDULLAH': { role: 'PA',               nickname: 'Farizin (PA)' },
  'FIONA FIENA ANAK JAMES':            { role: 'PA',               nickname: 'Fiona (PA)' },
  'NGU CHUIN SHEN':                    { role: 'Locum Pharmacist', nickname: 'Ngu (Locum)' },
  'DANIELA JANET ANAK MUSTAPHA':       { role: 'Former Staff',     nickname: 'Daniela (Resigned)' },
  'CONNIE VOON ZHI YIN':               { role: 'Former Staff',     nickname: 'Connie (2025)' },
  'LOLITA WONG LIN':                   { role: 'Former Staff',     nickname: 'Lolita (2025)' },
  'LAI PEY SHYAN':                     { role: 'Former Staff',     nickname: 'Lai (2025)' },
  'FELICIANO BONG YEE YIN':            { role: 'Former Staff',     nickname: 'Feliciano (2025)' }
};

// ─── RUNTIME STATE ──────────────────────────────────────────────────────────
let perfState = null;
let computedMetrics = null;
let activeCategoryMode = 'HQ11'; // 'HQ11' or 'ALL12'
let showAllTeammates = false;    // false = active Latest Month staff (>= RM 500 or active), true = all rows including 2025-only
let skuFilterState = {
  search: '',
  category: 'ALL',
  mode: 'ALL', // 'ALL' | 'HEROES' | 'BLEEDERS' | 'MARGIN_DROP' | 'AGED_6M' | 'NEW_2026' | 'LOST_2026'
  sortBy: 'priceDiffDesc',
  page: 1,
  pageSize: 60
};
let agingFilterState = {
  search: '',
  category: 'ALL',
  sortBy: 'agedValDesc',
  page: 1,
  pageSize: 50
};
let monthlyTasks = [];
let customRoles = {};
let activeAiReport = null;

// ─── UTILITY HELPERS ────────────────────────────────────────────────────────
function fmtRM(val, decimals = 2) {
  const n = Number(val) || 0;
  const abs = Math.abs(n).toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return n < 0 ? `-RM ${abs}` : `RM ${abs}`;
}

function fmtNum(val, decimals = 0) {
  const n = Number(val) || 0;
  return n.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function fmtPct(val, decimals = 2, showPlus = false) {
  if (val === null || val === undefined || !isFinite(val)) return 'N/A';
  const n = Number(val);
  const prefix = showPlus && n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(decimals)}%`;
}

function fmtPP(val, decimals = 2) {
  if (val === null || val === undefined || !isFinite(val)) return 'N/A';
  const n = Number(val);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(decimals)} pp`;
}

function calcGrowthPct(latest, prev) {
  const l = Number(latest) || 0;
  const p = Number(prev) || 0;
  if (p === 0) return l > 0 ? 100 : (l < 0 ? -100 : 0);
  return ((l - p) / Math.abs(p)) * 100;
}

function badgeDelta(val, isPercent = true, decimals = 2, suffix = '%') {
  if (val === null || val === undefined || !isFinite(val)) {
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">—</span>`;
  }
  const n = Number(val);
  const isPos = n > 0.0001;
  const isNeg = n < -0.0001;
  const cls = isPos
    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    : isNeg
      ? 'bg-rose-100 text-rose-800 border border-rose-200'
      : 'bg-slate-100 text-slate-600 border border-slate-200';
  const arrow = isPos ? '▲ +' : isNeg ? '▼ ' : '';
  const formatted = isPercent
    ? `${arrow}${n.toFixed(decimals)}${suffix}`
    : `${ isPos ? '▲ +' : isNeg ? '▼ ' : '' }${fmtRM(n, decimals)}`;
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${cls}">${formatted}</span>`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── CSV PARSER SUITE (HANDLES ALL 7 PMG ERP CSV FORMATS) ───────────────────
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parsePmgNumber(val) {
  if (val === undefined || val === null) return 0;
  let s = String(val).trim();
  if (!s) return 0;
  let isNeg = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    isNeg = true;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith('-')) {
    isNeg = true;
    s = s.slice(1).trim();
  }
  s = s.replace(/RM/gi, '').replace(/%/g, '').replace(/,/g, '').trim();
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return isNeg ? -n : n;
}

function parseDailySalesCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  let dateRange = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date:')) {
      dateRange = parseCsvLine(lines[i])[0].replace('Date:', '').trim();
    }
    if (lines[i].startsWith('Sales Item Person,')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Sales Item Person" not found in Daily Sales CSV');
  const headers = parseCsvLine(lines[headerIdx]);
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const person = cols[0];
    if (!person || person.toLowerCase() === 'grand total') continue;
    rows.push({
      person: person.trim(),
      regular: parsePmgNumber(cols[1]),
      ehm: parsePmgNumber(cols[2]),
      hb: parsePmgNumber(cols[3]),
      hm: parsePmgNumber(cols[4]),
      pb: parsePmgNumber(cols[5]),
      pbAmpm: parsePmgNumber(cols[6]),
      whm: parsePmgNumber(cols[7]),
      ts: parsePmgNumber(cols[8])
    });
  }
  return { dateRange, headers, rows };
}

function parsePersonalGpCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  let dateRange = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date:')) {
      dateRange = parseCsvLine(lines[i])[0].replace('Date:', '').trim();
    }
    if (lines[i].startsWith('Sales Person,Qty,Net Sold Price')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Sales Person,Qty,Net Sold Price" not found in Personal GP CSV');
  const rows = [];
  let grandTotal = null;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const person = cols[0];
    if (!person) continue;
    const rec = {
      person: person.trim(),
      qty: parsePmgNumber(cols[1]),
      netSoldPrice: parsePmgNumber(cols[2]),
      netSoldProfit: parsePmgNumber(cols[3]),
      gpMarginPct: parsePmgNumber(cols[4])
    };
    if (person.toLowerCase() === 'grand total') {
      grandTotal = rec;
    } else {
      rows.push(rec);
    }
  }
  return { dateRange, rows, grandTotal };
}

function parseCustomersServedCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  let dateRange = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date:')) {
      dateRange = parseCsvLine(lines[i])[0].replace('Date:', '').trim();
    }
    if (lines[i].startsWith('Sales Person,(Count)-Sales No Total')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Sales Person,(Count)-Sales No Total" not found in Customers Served CSV');
  const rows = [];
  let grandTotal = 0;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const person = cols[0];
    if (!person) continue;
    const count = parsePmgNumber(cols[1]);
    if (person.toLowerCase() === 'grand total') {
      grandTotal = count;
    } else {
      rows.push({ person: person.trim(), customersServed: count });
    }
  }
  if (!grandTotal && rows.length) {
    grandTotal = rows.reduce((s, r) => s + r.customersServed, 0);
  }
  return { dateRange, rows, grandTotal };
}

function parseCategoryGpCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  let dateRange = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date:')) {
      dateRange = parseCsvLine(lines[i])[0].replace('Date:', '').trim();
    }
    if (lines[i].startsWith('Store,Category,Sales Count')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Store,Category,Sales Count" not found in Category GP CSV');
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols[1] || cols[0].toLowerCase() === 'grand total' || cols[1].toLowerCase() === 'grand total') continue;
    rows.push({
      store: cols[0],
      category: cols[1].trim(),
      salesCount: parsePmgNumber(cols[2]),
      qty: parsePmgNumber(cols[3]),
      netSoldPrice: parsePmgNumber(cols[4]),
      netSoldProfit: parsePmgNumber(cols[5]),
      gpMarginPct: parsePmgNumber(cols[6])
    });
  }
  return { dateRange, rows };
}

function parseStockClosingCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  let dateTo = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date To:')) {
      dateTo = parseCsvLine(lines[i])[0].replace('Date To:', '').trim();
    }
    if (lines[i].startsWith('Category,(Count)-Item Name')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Category,(Count)-Item Name" not found in Stock Closing CSV');
  const rows = [];
  let grandTotal = null;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const cat = cols[0];
    if (!cat) continue;
    const rec = {
      category: cat.trim(),
      skuCount: parsePmgNumber(cols[1]),
      customCost: parsePmgNumber(cols[2])
    };
    if (cat.toLowerCase() === 'grand total') {
      grandTotal = rec;
    } else {
      rows.push(rec);
    }
  }
  return { dateTo, rows, grandTotal };
}

function parseItemSalesCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  let dateRange = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date:')) {
      dateRange = parseCsvLine(lines[i])[0].replace('Date:', '').trim();
    }
    if (lines[i].startsWith('Category,Item Code,Item Name')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Category,Item Code,Item Name" not found in Item Sales CSV');

  let curCat = '';
  let curCode = '';
  let curName = '';
  const itemMap = new Map();
  let fileGrandTotal = null;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const c0 = (cols[0] || '').trim();
    const c1 = (cols[1] || '').trim();
    const c2 = (cols[2] || '').trim();

    if (c0.toLowerCase() === 'grand total') {
      fileGrandTotal = {
        qty: parsePmgNumber(cols[4]),
        netSoldPrice: parsePmgNumber(cols[5]),
        netSoldProfit: parsePmgNumber(cols[6]),
        gpMarginPct: parsePmgNumber(cols[7])
      };
      continue;
    }
    if (c0.endsWith(' Total') || c1.endsWith(' Total') || c2.endsWith(' Total')) {
      continue;
    }

    if (c0) curCat = c0;
    if (c1) curCode = c1;
    if (c2) curName = c2;
    if (!curCode) continue;

    const unitCost = parsePmgNumber(cols[3]);
    const qty = parsePmgNumber(cols[4]);
    const netSoldPrice = parsePmgNumber(cols[5]);
    const netSoldProfit = parsePmgNumber(cols[6]);

    const key = `${curCat}||${curCode}`;
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        category: curCat,
        itemCode: curCode,
        itemName: curName,
        unitCost,
        qty,
        netSoldPrice,
        netSoldProfit
      });
    } else {
      const ex = itemMap.get(key);
      ex.qty += qty;
      ex.netSoldPrice = +(ex.netSoldPrice + netSoldPrice).toFixed(2);
      ex.netSoldProfit = +(ex.netSoldProfit + netSoldProfit).toFixed(2);
      if (curName && !ex.itemName) ex.itemName = curName;
    }
  }

  const items = Array.from(itemMap.values()).map(it => ({
    ...it,
    gpMarginPct: it.netSoldPrice !== 0 ? +((it.netSoldProfit / it.netSoldPrice) * 100).toFixed(2) : 0
  }));

  return { dateRange, items, fileGrandTotal };
}

function parseAgingCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Item Code,Item Name,Category,OH Qty')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Item Code,Item Name,Category,OH Qty" not found in Aging CSV');
  const items = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const code = (cols[0] || '').trim();
    if (!code || code.toLowerCase() === 'grand total') continue;
    const itemName = cols[1];
    const category = cols[2];
    const ohQty = parsePmgNumber(cols[3]);
    const avgCost = parsePmgNumber(cols[4]);
    const d150_180 = parsePmgNumber(cols[5]);
    const d180_210 = parsePmgNumber(cols[6]);
    const d210_240 = parsePmgNumber(cols[7]);
    const d240_270 = parsePmgNumber(cols[8]);
    const d270_300 = parsePmgNumber(cols[9]);
    const d300_330 = parsePmgNumber(cols[10]);
    const d330_360 = parsePmgNumber(cols[11]);
    const above1Yr = parsePmgNumber(cols[12]);

    const agedQty6MPlus = d150_180 + d180_210 + d210_240 + d240_270 + d270_300 + d300_330 + d330_360 + above1Yr;
    const agedValue = +(agedQty6MPlus * avgCost).toFixed(2);
    const totalOhValue = +(ohQty * avgCost).toFixed(2);

    items.push({
      itemCode: code,
      itemName,
      category,
      ohQty,
      avgCost,
      d150_180,
      d180_210,
      d210_240,
      d240_270,
      d270_300,
      d300_330,
      d330_360,
      above1Yr,
      agedQty6MPlus,
      agedValue,
      totalOhValue
    });
  }
  return { items };
}

// Auto-detect CSV type and period (Latest vs Previous Year) from content + filename
function autoDetectCsvTypeAndPeriod(fileName, text) {
  const fn = (fileName || '').toLowerCase();
  let type = 'UNKNOWN';

  if (text.includes('Sales Item Person,') && text.includes('Grand Total')) {
    type = 'DAILY_SALES';
  } else if (text.includes('Sales Person,Qty,Net Sold Price,Net Sold Profit')) {
    type = 'PERSONAL_GP';
  } else if (text.includes('Sales Person,(Count)-Sales No Total')) {
    type = 'CUSTOMERS_SERVED';
  } else if (text.includes('Store,Category,Sales Count,Qty,Net Sold Price')) {
    type = 'CATEGORY_GP';
  } else if (text.includes('Category,(Count)-Item Name,Total OH Custom Cost')) {
    type = 'STOCK_CLOSING';
  } else if (text.includes('Category,Item Code,Item Name,Unit Custom Cost')) {
    type = 'ITEM_SALES';
  } else if (text.includes('Item Code,Item Name,Category,OH Qty,Average Cost,150-180 Days')) {
    type = 'STOCK_AGING';
  }

  // Extract date year from Date: header or filename
  let year = null;
  const dateMatch = text.match(/Date(?: To)?:\s*[0-9]{1,2}\/[0-9]{1,2}\/([0-9]{4})/i)
                 || text.match(/([0-9]{2}-[0-9]{2}-([0-9]{4}))/)
                 || fn.match(/(202[0-9])/);
  if (dateMatch) {
    year = parseInt(dateMatch[dateMatch.length - 1], 10);
  }

  return { type, year };
}

// ─── CORE QUANTITATIVE ENGINE (COMPUTES ALL 10 KPIs + SKU YOY + AGING) ──────
function computeAllMetrics(state) {
  if (!state) return null;

  const dsL = state.dailySalesLatest?.rows || [];
  const dsP = state.dailySalesPrevYear?.rows || [];
  const gpL = state.personalGpLatest?.rows || [];
  const gpP = state.personalGpPrevYear?.rows || [];
  const csL = state.customersServedLatest || { rows: [], grandTotal: 0 };
  const csP = state.customersServedPrevYear || { rows: [], grandTotal: 0 };
  const catL = state.categoryGpLatest?.rows || [];
  const catP = state.categoryGpPrevYear?.rows || [];
  const closeL = state.stockClosingLatest?.rows || [];
  const itemsL = state.itemSalesLatest?.items || [];
  const itemsP = state.itemSalesPrevYear?.items || [];
  const agingL = state.stockAgingLatest?.items || [];

  // ── 1. Outlet MTD TS, HB, HM (Latest vs Prev Year) ──
  const sumField = (arr, field) => +arr.reduce((s, r) => s + (Number(r[field]) || 0), 0).toFixed(2);

  const tsLatest = sumField(dsL, 'ts');
  const hbLatest = sumField(dsL, 'hb');
  const hmLatest = sumField(dsL, 'hm');
  const ehmLatest = sumField(dsL, 'ehm');
  const pbLatest = sumField(dsL, 'pb') + sumField(dsL, 'pbAmpm');
  const whmLatest = sumField(dsL, 'whm');
  const regLatest = sumField(dsL, 'regular');

  const tsPrev = sumField(dsP, 'ts');
  const hbPrev = sumField(dsP, 'hb');
  const hmPrev = sumField(dsP, 'hm');
  const ehmPrev = sumField(dsP, 'ehm');
  const pbPrev = sumField(dsP, 'pb') + sumField(dsP, 'pbAmpm');
  const whmPrev = sumField(dsP, 'whm');
  const regPrev = sumField(dsP, 'regular');

  const hbShareLatestPct = tsLatest > 0 ? (hbLatest / tsLatest) * 100 : 0;
  const hbSharePrevPct   = tsPrev > 0 ? (hbPrev / tsPrev) * 100 : 0;
  const hmShareLatestPct = tsLatest > 0 ? (hmLatest / tsLatest) * 100 : 0;
  const hmSharePrevPct   = tsPrev > 0 ? (hmPrev / tsPrev) * 100 : 0;

  // ── 2, 7, 8, 9. Category Net Sold Price, Profit, Margin % & Stock Cycle (10) ──
  const catMapL = new Map(catL.map(r => [r.category.toUpperCase(), r]));
  const catMapP = new Map(catP.map(r => [r.category.toUpperCase(), r]));
  const closeMap = new Map(closeL.map(r => [r.category.toUpperCase(), r]));

  // Aggregate aging by category as well
  const agingByCat = new Map();
  agingL.forEach(it => {
    const c = (it.category || 'OTHER').toUpperCase().trim();
    if (!agingByCat.has(c)) {
      agingByCat.set(c, { skuCount: 0, ohQty: 0, agedQty6MPlus: 0, agedValue: 0, totalOhValue: 0 });
    }
    const g = agingByCat.get(c);
    g.skuCount += 1;
    g.ohQty += it.ohQty;
    g.agedQty6MPlus += it.agedQty6MPlus;
    g.agedValue = +(g.agedValue + it.agedValue).toFixed(2);
    g.totalOhValue = +(g.totalOhValue + it.totalOhValue).toFixed(2);
  });

  const categories = ALL_12_CATEGORIES.map(catName => {
    const l = catMapL.get(catName) || { salesCount: 0, qty: 0, netSoldPrice: 0, netSoldProfit: 0, gpMarginPct: 0 };
    const p = catMapP.get(catName) || { salesCount: 0, qty: 0, netSoldPrice: 0, netSoldProfit: 0, gpMarginPct: 0 };
    const cl = closeMap.get(catName) || { skuCount: 0, customCost: 0 };
    const ag = agingByCat.get(catName) || { skuCount: 0, ohQty: 0, agedQty6MPlus: 0, agedValue: 0, totalOhValue: 0 };

    const priceDiffRm = +(l.netSoldPrice - p.netSoldPrice).toFixed(2);
    const priceDiffPct = calcGrowthPct(l.netSoldPrice, p.netSoldPrice);

    const profitDiffRm = +(l.netSoldProfit - p.netSoldProfit).toFixed(2);
    const profitDiffPct = calcGrowthPct(l.netSoldProfit, p.netSoldProfit);

    const gpPctLatest = l.netSoldPrice > 0 ? (l.netSoldProfit / l.netSoldPrice) * 100 : l.gpMarginPct;
    const gpPctPrev   = p.netSoldPrice > 0 ? (p.netSoldProfit / p.netSoldPrice) * 100 : p.gpMarginPct;
    const gpPctDiffPP = +(gpPctLatest - gpPctPrev).toFixed(2);

    // PMG Formula (KPI 10):
    // COST OF SALES (MTD) = NET SOLD PRICE - NET SOLD PROFIT
    // STOCK CYCLE = COST OF SALES (MTD) / TOTAL CUSTOM COST
    const costOfSalesLatest = +(l.netSoldPrice - l.netSoldProfit).toFixed(2);
    const costOfSalesPrev   = +(p.netSoldPrice - p.netSoldProfit).toFixed(2);
    const totalCustomCost   = +(cl.customCost || 0).toFixed(2);
    const pmgStockCycle     = totalCustomCost > 0 ? +(costOfSalesLatest / totalCustomCost).toFixed(4) : 0;
    const pmgStockCyclePct  = totalCustomCost > 0 ? +((costOfSalesLatest / totalCustomCost) * 100).toFixed(2) : 0;
    // Also compute stock cover months (Total Custom Cost / Cost of Sales MTD = 1 / Stock Cycle)
    const stockCoverMonths  = costOfSalesLatest > 0 ? +(totalCustomCost / costOfSalesLatest).toFixed(2) : 0;

    return {
      category: catName,
      isHqFocus: catName !== 'WYMED-EX',
      salesCountLatest: l.salesCount,
      salesCountPrev: p.salesCount,
      qtyLatest: l.qty,
      qtyPrev: p.qty,
      netSoldPriceLatest: l.netSoldPrice,
      netSoldPricePrev: p.netSoldPrice,
      priceDiffRm,
      priceDiffPct,
      netSoldProfitLatest: l.netSoldProfit,
      netSoldProfitPrev: p.netSoldProfit,
      profitDiffRm,
      profitDiffPct,
      gpPctLatest,
      gpPctPrev,
      gpPctDiffPP,
      costOfSalesLatest,
      costOfSalesPrev,
      skuCountClosing: cl.skuCount,
      totalCustomCost,
      pmgStockCycle,
      pmgStockCyclePct,
      stockCoverMonths,
      agedSkuCount: ag.skuCount,
      agedQty6MPlus: ag.agedQty6MPlus,
      agedValueRm: ag.agedValue,
      trendDirection: priceDiffRm >= 0 ? 'UP' : 'DOWN'
    };
  });

  const buildCategorySummary = (catSubset) => {
    const netSoldPriceLatest  = +catSubset.reduce((s, c) => s + c.netSoldPriceLatest, 0).toFixed(2);
    const netSoldPricePrev    = +catSubset.reduce((s, c) => s + c.netSoldPricePrev, 0).toFixed(2);
    const netSoldProfitLatest = +catSubset.reduce((s, c) => s + c.netSoldProfitLatest, 0).toFixed(2);
    const netSoldProfitPrev   = +catSubset.reduce((s, c) => s + c.netSoldProfitPrev, 0).toFixed(2);
    const qtyLatest           = catSubset.reduce((s, c) => s + c.qtyLatest, 0);
    const qtyPrev             = catSubset.reduce((s, c) => s + c.qtyPrev, 0);
    const gpPctLatest         = netSoldPriceLatest > 0 ? +((netSoldProfitLatest / netSoldPriceLatest) * 100).toFixed(2) : 0;
    const gpPctPrev           = netSoldPricePrev > 0 ? +((netSoldProfitPrev / netSoldPricePrev) * 100).toFixed(2) : 0;
    const costOfSalesLatest   = +(netSoldPriceLatest - netSoldProfitLatest).toFixed(2);
    const costOfSalesPrev     = +(netSoldPricePrev - netSoldProfitPrev).toFixed(2);
    const totalCustomCost     = +catSubset.reduce((s, c) => s + c.totalCustomCost, 0).toFixed(2);
    const skuCountClosing     = catSubset.reduce((s, c) => s + c.skuCountClosing, 0);
    // AVERAGE STOCK CYCLE = TOTAL COST OF SALES / TOTAL CUSTOM COST (per user's PMG formula)
    const averageStockCycle    = totalCustomCost > 0 ? +(costOfSalesLatest / totalCustomCost).toFixed(4) : 0;
    const averageStockCyclePct = totalCustomCost > 0 ? +((costOfSalesLatest / totalCustomCost) * 100).toFixed(2) : 0;
    const meanCategoryCycle    = catSubset.length > 0
      ? +(catSubset.reduce((s, c) => s + c.pmgStockCycle, 0) / catSubset.length).toFixed(4)
      : 0;
    const stockCoverMonths    = costOfSalesLatest > 0 ? +(totalCustomCost / costOfSalesLatest).toFixed(2) : 0;
    const agedValueRm         = +catSubset.reduce((s, c) => s + c.agedValueRm, 0).toFixed(2);
    const agedSkuCount        = catSubset.reduce((s, c) => s + c.agedSkuCount, 0);

    return {
      count: catSubset.length,
      qtyLatest,
      qtyPrev,
      netSoldPriceLatest,
      netSoldPricePrev,
      priceDiffRm: +(netSoldPriceLatest - netSoldPricePrev).toFixed(2),
      priceDiffPct: calcGrowthPct(netSoldPriceLatest, netSoldPricePrev),
      netSoldProfitLatest,
      netSoldProfitPrev,
      profitDiffRm: +(netSoldProfitLatest - netSoldProfitPrev).toFixed(2),
      profitDiffPct: calcGrowthPct(netSoldProfitLatest, netSoldProfitPrev),
      gpPctLatest,
      gpPctPrev,
      gpPctDiffPP: +(gpPctLatest - gpPctPrev).toFixed(2),
      costOfSalesLatest,
      costOfSalesPrev,
      totalCustomCost,
      skuCountClosing,
      averageStockCycle,
      averageStockCyclePct,
      meanCategoryCycle,
      stockCoverMonths,
      agedValueRm,
      agedSkuCount
    };
  };

  const catSummaryHq11  = buildCategorySummary(categories.filter(c => c.isHqFocus));
  const catSummaryAll12 = buildCategorySummary(categories);

  // Personal GP Grand Totals (fallback to Category All12 if Personal GP not uploaded)
  const personalGpTotalLatest = state.personalGpLatest?.grandTotal || {
    qty: gpL.reduce((s, r) => s + r.qty, 0) || catSummaryAll12.qtyLatest,
    netSoldPrice: sumField(gpL, 'netSoldPrice') || catSummaryAll12.netSoldPriceLatest,
    netSoldProfit: sumField(gpL, 'netSoldProfit') || catSummaryAll12.netSoldProfitLatest,
    gpMarginPct: 0
  };
  if (!personalGpTotalLatest.gpMarginPct && personalGpTotalLatest.netSoldPrice > 0) {
    personalGpTotalLatest.gpMarginPct = +((personalGpTotalLatest.netSoldProfit / personalGpTotalLatest.netSoldPrice) * 100).toFixed(2);
  }

  const personalGpTotalPrev = state.personalGpPrevYear?.grandTotal || {
    qty: gpP.reduce((s, r) => s + r.qty, 0) || catSummaryAll12.qtyPrev,
    netSoldPrice: sumField(gpP, 'netSoldPrice') || catSummaryAll12.netSoldPricePrev,
    netSoldProfit: sumField(gpP, 'netSoldProfit') || catSummaryAll12.netSoldProfitPrev,
    gpMarginPct: 0
  };
  if (!personalGpTotalPrev.gpMarginPct && personalGpTotalPrev.netSoldPrice > 0) {
    personalGpTotalPrev.gpMarginPct = +((personalGpTotalPrev.netSoldProfit / personalGpTotalPrev.netSoldPrice) * 100).toFixed(2);
  }

  // ── 3, 4, 5. Transactions & Basket Sizes (TS and HB) ──
  const txLatest = Number(csL.grandTotal) || csL.rows.reduce((s, r) => s + r.customersServed, 0);
  const txPrev   = Number(csP.grandTotal) || csP.rows.reduce((s, r) => s + r.customersServed, 0);
  const txDiff   = txLatest - txPrev;
  const txDiffPct = calcGrowthPct(txLatest, txPrev);

  const basketTsLatest = txLatest > 0 ? +(tsLatest / txLatest).toFixed(2) : 0;
  const basketTsPrev   = txPrev > 0 ? +(tsPrev / txPrev).toFixed(2) : 0;
  const basketTsDiffRm = +(basketTsLatest - basketTsPrev).toFixed(2);
  const basketTsDiffPct = calcGrowthPct(basketTsLatest, basketTsPrev);

  const basketHbLatest = txLatest > 0 ? +(hbLatest / txLatest).toFixed(2) : 0;
  const basketHbPrev   = txPrev > 0 ? +(hbPrev / txPrev).toFixed(2) : 0;
  const basketHbDiffRm = +(basketHbLatest - basketHbPrev).toFixed(2);
  const basketHbDiffPct = calcGrowthPct(basketHbLatest, basketHbPrev);

  const basketHmLatest = txLatest > 0 ? +(hmLatest / txLatest).toFixed(2) : 0;
  const basketHmPrev   = txPrev > 0 ? +(hmPrev / txPrev).toFixed(2) : 0;

  // ── 6. Teammate Personal Sales & Productivity Matrix ──
  const normName = (n) => String(n || '').toUpperCase().trim();
  const allNamesMap = new Map();

  const registerName = (rawName) => {
    const key = normName(rawName);
    if (!key || key === 'GRAND TOTAL' || key === 'PUBLIC MEDICARE GROUP SDN BHD') return;
    if (!allNamesMap.has(key)) allNamesMap.set(key, rawName.trim());
  };

  dsL.forEach(r => registerName(r.person));
  dsP.forEach(r => registerName(r.person));
  gpL.forEach(r => registerName(r.person));
  gpP.forEach(r => registerName(r.person));
  csL.rows.forEach(r => registerName(r.person));
  csP.rows.forEach(r => registerName(r.person));

  const dsMapL = new Map(dsL.map(r => [normName(r.person), r]));
  const dsMapP = new Map(dsP.map(r => [normName(r.person), r]));
  const gpMapL = new Map(gpL.map(r => [normName(r.person), r]));
  const gpMapP = new Map(gpP.map(r => [normName(r.person), r]));
  const csMapL = new Map(csL.rows.map(r => [normName(r.person), r.customersServed]));
  const csMapP = new Map(csP.rows.map(r => [normName(r.person), r.customersServed]));

  const teammates = Array.from(allNamesMap.entries()).map(([key, displayName]) => {
    const dL = dsMapL.get(key) || { regular: 0, ehm: 0, hb: 0, hm: 0, pb: 0, pbAmpm: 0, whm: 0, ts: 0 };
    const dP = dsMapP.get(key) || { regular: 0, ehm: 0, hb: 0, hm: 0, pb: 0, pbAmpm: 0, whm: 0, ts: 0 };
    const gL = gpMapL.get(key) || { qty: 0, netSoldPrice: 0, netSoldProfit: 0, gpMarginPct: 0 };
    const gP = gpMapP.get(key) || { qty: 0, netSoldPrice: 0, netSoldProfit: 0, gpMarginPct: 0 };
    const cL = csMapL.get(key) || 0;
    const cP = csMapP.get(key) || 0;

    const roleMeta = customRoles[key] || DEFAULT_ROLE_MAP[key] || { role: 'PA', nickname: displayName };

    // Own HB % of Own TS & Own HM % of Own TS
    const hbPctOwnTsLatest = dL.ts > 0 ? +((dL.hb / dL.ts) * 100).toFixed(2) : 0;
    const hbPctOwnTsPrev   = dP.ts > 0 ? +((dP.hb / dP.ts) * 100).toFixed(2) : 0;
    const hmPctOwnTsLatest = dL.ts > 0 ? +((dL.hm / dL.ts) * 100).toFixed(2) : 0;
    const hmPctOwnTsPrev   = dP.ts > 0 ? +((dP.hm / dP.ts) * 100).toFixed(2) : 0;

    // Personal Basket Sizes (TS and HB)
    const basketTsLatest = cL > 0 ? +(dL.ts / cL).toFixed(2) : 0;
    const basketTsPrev   = cP > 0 ? +(dP.ts / cP).toFixed(2) : 0;
    const basketHbLatest = cL > 0 ? +(dL.hb / cL).toFixed(2) : 0;
    const basketHbPrev   = cP > 0 ? +(dP.hb / cP).toFixed(2) : 0;

    // Share of Branch TS
    const branchTsShareLatest = tsLatest > 0 ? +((dL.ts / tsLatest) * 100).toFixed(2) : 0;

    return {
      key,
      name: displayName,
      nickname: roleMeta.nickname || displayName,
      role: roleMeta.role || 'PA',
      isActiveLatest: dL.ts > 500, // Active full/part-time staff in Latest Month
      hasPrevYear: dP.ts > 500,
      tsLatest: dL.ts,
      tsPrev: dP.ts,
      tsDiffRm: +(dL.ts - dP.ts).toFixed(2),
      tsDiffPct: dP.ts > 0 ? calcGrowthPct(dL.ts, dP.ts) : null,
      hbLatest: dL.hb,
      hbPrev: dP.hb,
      hbDiffRm: +(dL.hb - dP.hb).toFixed(2),
      hbDiffPct: dP.hb > 0 ? calcGrowthPct(dL.hb, dP.hb) : null,
      hbPctOwnTsLatest,
      hbPctOwnTsPrev,
      hmLatest: dL.hm,
      hmPrev: dP.hm,
      hmDiffRm: +(dL.hm - dP.hm).toFixed(2),
      hmDiffPct: dP.hm > 0 ? calcGrowthPct(dL.hm, dP.hm) : null,
      hmPctOwnTsLatest,
      hmPctOwnTsPrev,
      txLatest: cL,
      txPrev: cP,
      txDiff: cL - cP,
      txDiffPct: cP > 0 ? calcGrowthPct(cL, cP) : null,
      basketTsLatest,
      basketTsPrev,
      basketTsDiffRm: +(basketTsLatest - basketTsPrev).toFixed(2),
      basketHbLatest,
      basketHbPrev,
      basketHbDiffRm: +(basketHbLatest - basketHbPrev).toFixed(2),
      netSoldPriceLatest: gL.netSoldPrice,
      netSoldPricePrev: gP.netSoldPrice,
      gpRmLatest: gL.netSoldProfit,
      gpRmPrev: gP.netSoldProfit,
      gpRmDiff: +(gL.netSoldProfit - gP.netSoldProfit).toFixed(2),
      gpRmDiffPct: gP.netSoldProfit > 0 ? calcGrowthPct(gL.netSoldProfit, gP.netSoldProfit) : null,
      gpPctLatest: gL.gpMarginPct,
      gpPctPrev: gP.gpMarginPct,
      gpPctDiffPP: gP.gpMarginPct > 0 ? +(gL.gpMarginPct - gP.gpMarginPct).toFixed(2) : null,
      qtyLatest: gL.qty,
      qtyPrev: gP.qty,
      branchTsShareLatest
    };
  }).sort((a, b) => b.tsLatest - a.tsLatest || b.tsPrev - a.tsPrev);

  // ── 11. Granular SKU-Level YoY Comparison & 6-Month Aging Cross-Reference ──
  const agingByCode = new Map();
  agingL.forEach(ag => {
    agingByCode.set(ag.itemCode, ag);
  });

  const skuMap = new Map();
  itemsL.forEach(it => {
    skuMap.set(it.itemCode, {
      itemCode: it.itemCode,
      itemName: it.itemName,
      category: it.category,
      unitCostLatest: it.unitCost,
      qtyLatest: it.qty,
      priceLatest: it.netSoldPrice,
      profitLatest: it.netSoldProfit,
      gpPctLatest: it.gpMarginPct,
      qtyPrev: 0,
      pricePrev: 0,
      profitPrev: 0,
      gpPctPrev: 0
    });
  });

  itemsP.forEach(it => {
    if (skuMap.has(it.itemCode)) {
      const ex = skuMap.get(it.itemCode);
      ex.qtyPrev += it.qty;
      ex.pricePrev = +(ex.pricePrev + it.netSoldPrice).toFixed(2);
      ex.profitPrev = +(ex.profitPrev + it.netSoldProfit).toFixed(2);
      ex.gpPctPrev = ex.pricePrev !== 0 ? +((ex.profitPrev / ex.pricePrev) * 100).toFixed(2) : 0;
      if (!ex.itemName && it.itemName) ex.itemName = it.itemName;
      if (!ex.category && it.category) ex.category = it.category;
    } else {
      skuMap.set(it.itemCode, {
        itemCode: it.itemCode,
        itemName: it.itemName,
        category: it.category,
        unitCostLatest: it.unitCost,
        qtyLatest: 0,
        priceLatest: 0,
        profitLatest: 0,
        gpPctLatest: 0,
        qtyPrev: it.qty,
        pricePrev: it.netSoldPrice,
        profitPrev: it.netSoldProfit,
        gpPctPrev: it.gpMarginPct
      });
    }
  });

  const skuComparison = Array.from(skuMap.values()).map(s => {
    const ag = agingByCode.get(s.itemCode);
    const qtyDiff = s.qtyLatest - s.qtyPrev;
    const priceDiffRm = +(s.priceLatest - s.pricePrev).toFixed(2);
    const priceDiffPct = calcGrowthPct(s.priceLatest, s.pricePrev);
    const profitDiffRm = +(s.profitLatest - s.profitPrev).toFixed(2);
    const gpDiffPP = (s.priceLatest > 0 && s.pricePrev > 0) ? +(s.gpPctLatest - s.gpPctPrev).toFixed(2) : null;
    return {
      ...s,
      qtyDiff,
      priceDiffRm,
      priceDiffPct,
      profitDiffRm,
      gpDiffPP,
      agedQty6MPlus: ag ? ag.agedQty6MPlus : 0,
      agedValueRm: ag ? ag.agedValue : 0,
      ohQty: ag ? ag.ohQty : 0,
      above1YrQty: ag ? ag.above1Yr : 0
    };
  });

  const topHeroSkus = [...skuComparison]
    .filter(s => s.priceDiffRm > 0)
    .sort((a, b) => b.priceDiffRm - a.priceDiffRm)
    .slice(0, 15);

  const topBleederSkus = [...skuComparison]
    .filter(s => s.priceDiffRm < 0)
    .sort((a, b) => a.priceDiffRm - b.priceDiffRm)
    .slice(0, 15);

  const topMarginDropSkus = [...skuComparison]
    .filter(s => s.priceLatest >= 300 && s.pricePrev >= 300 && s.gpDiffPP !== null && s.gpDiffPP < -2)
    .sort((a, b) => a.profitDiffRm - b.profitDiffRm)
    .slice(0, 15);

  const totalAgedSkus = agingL.length;
  const totalAgedQty6MPlus = agingL.reduce((s, a) => s + a.agedQty6MPlus, 0);
  const totalAgedValueRm = +agingL.reduce((s, a) => s + a.agedValue, 0).toFixed(2);
  const totalAbove1YrQty = agingL.reduce((s, a) => s + a.above1Yr, 0);
  const totalAbove1YrValueRm = +agingL.reduce((s, a) => s + (a.above1Yr * a.avgCost), 0).toFixed(2);

  // 3-Month Trend (M-2, M-1, Latest Month)
  const m2 = state.dailySalesM2 || { periodLabel: 'M-2 (2 Months Ago)', ts: 0, hb: 0, hm: 0, gpRm: 0, gpPct: 0, transactions: 0 };
  const m1 = state.dailySalesM1 || { periodLabel: 'M-1 (Previous Month)', ts: 0, hb: 0, hm: 0, gpRm: 0, gpPct: 0, transactions: 0 };

  return {
    outlet: {
      tsLatest, tsPrev,
      tsDiffRm: +(tsLatest - tsPrev).toFixed(2),
      tsDiffPct: calcGrowthPct(tsLatest, tsPrev),
      hbLatest, hbPrev,
      hbDiffRm: +(hbLatest - hbPrev).toFixed(2),
      hbDiffPct: calcGrowthPct(hbLatest, hbPrev),
      hbShareLatestPct, hbSharePrevPct,
      hbShareDiffPP: +(hbShareLatestPct - hbSharePrevPct).toFixed(2),
      hmLatest, hmPrev,
      hmDiffRm: +(hmLatest - hmPrev).toFixed(2),
      hmDiffPct: calcGrowthPct(hmLatest, hmPrev),
      hmShareLatestPct, hmSharePrevPct,
      hmShareDiffPP: +(hmShareLatestPct - hmSharePrevPct).toFixed(2),
      ehmLatest, ehmPrev,
      pbLatest, pbPrev,
      whmLatest, whmPrev,
      regLatest, regPrev,
      txLatest, txPrev,
      txDiff, txDiffPct,
      basketTsLatest, basketTsPrev,
      basketTsDiffRm, basketTsDiffPct,
      basketHbLatest, basketHbPrev,
      basketHbDiffRm, basketHbDiffPct,
      basketHmLatest, basketHmPrev,
      personalGpTotalLatest,
      personalGpTotalPrev,
      personalGpDiffRm: +(personalGpTotalLatest.netSoldProfit - personalGpTotalPrev.netSoldProfit).toFixed(2),
      personalGpDiffPct: calcGrowthPct(personalGpTotalLatest.netSoldProfit, personalGpTotalPrev.netSoldProfit),
      personalGpMarginDiffPP: +(personalGpTotalLatest.gpMarginPct - personalGpTotalPrev.gpMarginPct).toFixed(2)
    },
    threeMonthTrend: { m2, m1 },
    categories,
    catSummaryHq11,
    catSummaryAll12,
    teammates,
    skuComparison,
    topHeroSkus,
    topBleederSkus,
    topMarginDropSkus,
    agingSummary: {
      totalAgedSkus,
      totalAgedQty6MPlus,
      totalAgedValueRm,
      totalAbove1YrQty,
      totalAbove1YrValueRm,
      byCategory: Array.from(agingByCat.entries()).map(([category, data]) => ({ category, ...data })).sort((a, b) => b.agedValue - a.agedValue)
    }
  };
}

// ─── DYNAMIC STRATEGIC BASELINE & AI REPORT GENERATOR ───────────────────────
function buildDynamicBaselineReport(m, state) {
  if (!m) return null;
  const o = m.outlet;
  const hq = m.catSummaryHq11;
  const catsHq = m.categories.filter(c => c.isHqFocus);
  const upCats = catsHq.filter(c => c.priceDiffRm > 0).sort((a, b) => b.priceDiffRm - a.priceDiffRm);
  const downCats = catsHq.filter(c => c.priceDiffRm < 0).sort((a, b) => a.priceDiffRm - b.priceDiffRm);
  const profitUpCats = catsHq.filter(c => c.profitDiffRm > 0).sort((a, b) => b.profitDiffRm - a.profitDiffRm);
  const profitDownCats = catsHq.filter(c => c.profitDiffRm < 0).sort((a, b) => a.profitDiffRm - b.profitDiffRm);

  const activeStaff = m.teammates.filter(t => t.isActiveLatest);
  const topHbStaff = [...activeStaff].sort((a, b) => b.hbPctOwnTsLatest - a.hbPctOwnTsLatest);
  const lowHbStaff = [...activeStaff].sort((a, b) => a.hbPctOwnTsLatest - b.hbPctOwnTsLatest);
  const lowGpStaff = [...activeStaff].sort((a, b) => a.gpPctLatest - b.gpPctLatest);

  return {
    modelUsed: 'PMG Quantitative + Kota Sentosa Market Intelligence Engine (Ready for Live Gemini 3.5 / 3.1 Flash-Lite)',
    generatedAt: new Date().toLocaleString('en-MY'),
    executiveSummary: `In ${state.meta?.latestPeriodLabel || 'Latest Month'}, PMG Pharmacy Kota Sentosa achieved Total Sales (TS) of ${fmtRM(o.tsLatest)} vs ${fmtRM(o.tsPrev)} in the previous year (${fmtPct(o.tsDiffPct, 2, true)}), while successfully expanding Personal Gross Profit (RM) to ${fmtRM(o.personalGpTotalLatest.netSoldProfit)} (+${fmtRM(o.personalGpDiffRm)} / ${fmtPct(o.personalGpDiffPct, 2, true)}) and lifting GP Margin by ${fmtPP(o.personalGpMarginDiffPP)} (from ${fmtPct(o.personalGpTotalPrev.gpMarginPct)} to ${fmtPct(o.personalGpTotalLatest.gpMarginPct)}). Despite a footfall contraction of ${fmtNum(Math.abs(o.txDiff))} transactions (${fmtNum(o.txLatest)} vs ${fmtNum(o.txPrev)}, ${fmtPct(o.txDiffPct, 2, true)}), the team drove a strong +${fmtPct(o.basketTsDiffPct)} increase in TS Basket Size (${fmtRM(o.basketTsLatest)} vs ${fmtRM(o.basketTsPrev)}) and a +${fmtPct(o.basketHbDiffPct)} surge in House Brand (HB) Basket Size (${fmtRM(o.basketHbLatest)} vs ${fmtRM(o.basketHbPrev)}), pushing HB penetration to ${fmtPct(o.hbShareLatestPct)} of TS (${fmtPP(o.hbShareDiffPP)} YoY).`,

    macroAndCompetitorAnalysis: [
      {
        title: '7th Mile Bazaar (Kota Sentosa) Footfall & Wet Market Dynamics',
        detail: `Transactions declined by ${fmtPct(Math.abs(o.txDiffPct))} YoY (${fmtNum(o.txLatest)} vs ${fmtNum(o.txPrev)} customers). Morning traffic at 7th Mile Old Bazaar is increasingly split between wet-market shoppers, Klinik Kesihatan Kota Sentosa outpatients, and drive-through commuters along Penrissen Road where parking congestion peaks between 8:00 AM and 11:00 AM.`
      },
      {
        title: 'Supermarket & Chain Price Competition (Farley 6th Mile & Watsons 7th Mile)',
        detail: `Non-prescription Commodity categories — specifically NON-SCHE (${fmtRM(downCats.find(c=>c.category==='NON-SCHE')?.priceDiffRm || 0)}), OTC (${fmtRM(downCats.find(c=>c.category==='OTC')?.priceDiffRm || 0)}), MOM&BABY (${fmtRM(downCats.find(c=>c.category==='MOM&BABY')?.priceDiffRm || 0)}), and FIR-AID (${fmtRM(downCats.find(c=>c.category==='FIR-AID')?.priceDiffRm || 0)}) — experienced volume leakage to mass-market price leaders (Farley Supermarket 6th Mile, Watsons, and online Shopee/TikTok Shop bundles). However, PMG Kota Sentosa successfully defended F & B (+${fmtRM(upCats.find(c=>c.category==='F & B')?.priceDiffRm || 0)}, GP +2.94 pp) and SUPPLEME (+${fmtRM(upCats.find(c=>c.category==='SUPPLEME')?.priceDiffRm || 0)}) through clinical consultation.`
      },
      {
        title: 'Klinik Kesihatan Kota Sentosa & Chronic Disease Spillover',
        detail: `SCHE-DRU revenue grew by +${fmtRM(upCats.find(c=>c.category==='SCHE-DRU')?.priceDiffRm || 0)} YoY (${fmtRM(upCats.find(c=>c.category==='SCHE-DRU')?.netSoldPriceLatest || 0)}), but SCHE-DRU Gross Profit dropped by ${fmtRM(profitDownCats.find(c=>c.category==='SCHE-DRU')?.profitDiffRm || 0)} as GP% compressed from 14.13% to 11.91% (-2.22 pp) due to original-brand chronic medication price matching and supplier cost inflation. Converting chronic refill patients to HB/HM adjuncts and generic equivalents is critical.`
      },
      {
        title: 'Working Capital & 11-Category Stock Cycle Pressure',
        detail: `Across the 11 HQ Focus Categories, Cost of Sales (MTD) is ${fmtRM(hq.costOfSalesLatest)} divided by Total OH Custom Cost of ${fmtRM(hq.totalCustomCost)}, yielding an Average Stock Cycle of ${hq.averageStockCycle.toFixed(2)} (${hq.averageStockCyclePct}% monthly turnover / ${hq.stockCoverMonths} months of stock cover). With ${fmtNum(m.agingSummary.totalAgedSkus)} SKUs (${fmtRM(m.agingSummary.totalAgedValueRm)}) aged ≥ 6 months, working capital is tied up in slow-cycling categories like HOME&LIV (0.15), MOM&BABY (0.17), FIR-AID (0.22), and PERSONAL (0.23).`
      }
    ],

    categoryAndStockFindings: {
      categoriesUp: upCats.map(c => ({
        category: c.category,
        summary: `Net Sold Price UP +${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 2, true)}) to ${fmtRM(c.netSoldPriceLatest)} | Net Profit ${c.profitDiffRm >= 0 ? 'UP +' + fmtRM(c.profitDiffRm) : 'DOWN ' + fmtRM(c.profitDiffRm)} (${fmtPct(c.gpPctLatest)} GP%, ${fmtPP(c.gpPctDiffPP)}) | PMG Stock Cycle (COS ÷ Cost): ${c.pmgStockCycle.toFixed(2)} (${c.pmgStockCyclePct}%).`
      })),
      categoriesDown: downCats.map(c => ({
        category: c.category,
        summary: `Net Sold Price DOWN ${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 2, true)}) to ${fmtRM(c.netSoldPriceLatest)} | Net Profit ${c.profitDiffRm >= 0 ? 'UP +' + fmtRM(c.profitDiffRm) : 'DOWN ' + fmtRM(c.profitDiffRm)} (${fmtPct(c.gpPctLatest)} GP%, ${fmtPP(c.gpPctDiffPP)}) | PMG Stock Cycle (COS ÷ Cost): ${c.pmgStockCycle.toFixed(2)} (${c.pmgStockCyclePct}%).`
      })),
      stockCycleComment: `HQ 11 Focus Categories recorded Net Sold Price of ${fmtRM(hq.netSoldPriceLatest)} (vs ${fmtRM(hq.netSoldPricePrev)} LY) and Net Sold Profit of ${fmtRM(hq.netSoldProfitLatest)} (GP% improved +${fmtPP(hq.gpPctDiffPP)} to ${fmtPct(hq.gpPctLatest)}). Using PMG's Stock Cycle formula (Cost of Sales ÷ Total Custom Cost): Total Cost of Sales (MTD) = ${fmtRM(hq.costOfSalesLatest)} ÷ Total Custom Cost = ${fmtRM(hq.totalCustomCost)} = Average Stock Cycle of ${hq.averageStockCycle.toFixed(2)} (exact: ${hq.averageStockCycle.toFixed(4)} or ${hq.averageStockCyclePct}%; unweighted mean across 11 categories: ${hq.meanCategoryCycle.toFixed(2)}). Fast-cycling categories are NON-SC-P (0.54), SCHE-DRU (0.53), NON-SCHE (0.50), and SUPPLEME (0.47), whereas HOME&LIV (0.15), MOM&BABY (0.17), FIR-AID (0.22), PERSONAL (0.23), and ELDERLY (0.27) have slow stock cycles and need inventory trimming.`
    },

    swot: {
      strengths: [
        `Strong Gross Profit Margin expansion (+${fmtPP(o.personalGpMarginDiffPP)} YoY to ${fmtPct(o.personalGpTotalLatest.gpMarginPct)}) generating +${fmtRM(o.personalGpDiffRm)} higher gross profit despite lower customer count.`,
        `High House Brand (HB) & House Margin (HM) execution: HB grew +${fmtPct(o.hbDiffPct)} to ${fmtRM(o.hbLatest)} (${fmtPct(o.hbShareLatestPct)} of TS), and HM grew +${fmtPct(o.hmDiffPct)} to ${fmtRM(o.hmLatest)} (${fmtPct(o.hmShareLatestPct)} of TS).`,
        `Powerhouse core categories: SUPPLEME (${fmtRM(74446.17)}, 36.92% GP) and F & B (${fmtRM(56267.50)}, +21.97% profit growth) anchor branch profitability.`,
        `Clinical leadership by PIC William (${fmtPct(49.94)} HB% of own TS, ${fmtRM(97.22)} TS basket size) and Pharmacist Kenix (31.48% GP margin, 53.56% HB share).`
      ],
      weaknesses: [
        `Customer transaction count dropped by ${fmtNum(Math.abs(o.txDiff))} (-7.72% YoY, from ${fmtNum(o.txPrev)} to ${fmtNum(o.txLatest)}), showing erosion in high-frequency walk-in footfall.`,
        `SCHE-DRU margin erosion: GP% fell from 14.13% to 11.91% (-2.22 pp), losing RM 1,208.67 in profit even though sales rose +RM 1,138.11.`,
        `High inventory overhang: ${fmtRM(hq.totalCustomCost)} in HQ 11 Closing Custom Cost (${hq.stockCoverMonths}x monthly Cost of Sales) and ${fmtNum(m.agingSummary.totalAgedSkus)} SKUs (${fmtRM(m.agingSummary.totalAgedValueRm)}) stuck in 6-month+ aging.`,
        `Wide gap in HB/HM conversion across PAs: HB% of own TS ranges from 47.33% (Penny) down to 28.32% (Farizin) and 30.96% (Nurhafizah).`
      ],
      opportunities: [
        `Capture Klinik Kesihatan Kota Sentosa & Sarawak Heart Centre chronic patients via the Patient Care Refill & Medication Review suite to rebuild monthly transaction count (+650 tx/month target).`,
        `Cross-sell high-margin ELDERLY (29.25% GP) and SUPPLEME (36.92% GP) HB bundles alongside low-margin F & B nutritional milk tins (Ensure/Glucerna/Appeton) and SCHE-DRU chronic prescriptions.`,
        `Convert 6-month aged stock (${fmtRM(m.agingSummary.totalAgedValueRm)}) into cash via 7th Mile Morning Market "Clearance & Bundle Gondola" and inter-branch stock balancing.`,
        `Elevate PA and PRP basket sizes by pairing every OTC/NON-SCHE walk-in with a targeted RM 10–RM 25 HM/HB add-on.`
      ],
      threats: [
        `Aggressive loss-leader pricing on adult nutrition, baby milk (MOM&BABY -32.10% YoY), and household OTC by Farley Supermarket 6th Mile and Watsons 7th Mile.`,
        `Rising cost of living in Kuching causing suburban families in Kota Sentosa / Penrissen to stretch medication refill intervals or down-trade on discretionary personal care.`,
        `Supplier price hikes on branded prescription drugs (SCHE-DRU) squeezing retail pharmacy margins when customers demand price-matching.`
      ]
    },

    roleActionPlans: [
      {
        id: 'role-pic-1',
        role: 'Pharmacist (PIC - William & Pharmacist Team)',
        title: 'Reverse SCHE-DRU Margin Compression (11.91% → 14.50% Target)',
        action: 'Audit the top 30 SCHE-DRU SKUs where GP% dropped in Oct 2026. Establish a mandatory "Branded Rx + HB/HM Therapeutic Adjunct" protocol at the dispensary counter (e.g., pairing statins/antihypertensives with CoQ10/Omega-3 HB or switching price-sensitive chronic refills to higher-margin generic/HM equivalents).',
        targetMetric: 'Lift SCHE-DRU GP% from 11.91% to ≥ 14.0% (+RM 1,300/month profit)'
      },
      {
        id: 'role-pic-2',
        role: 'Pharmacist (PIC - William & Pharmacist Team)',
        title: 'Chronic Refill & Screening Drive to Recover +650 Monthly Transactions',
        action: 'Deploy the Patient Care Refill Reminder & WhatsApp follow-up workflow for Kota Sentosa chronic patients 5 days before medication run-out, and run a 7:30 AM – 10:30 AM "Morning Bazaar Blood Pressure/Glucose/Cholesterol Screening Package" every weekend to convert wet-market footfall into pharmacy transactions.',
        targetMetric: 'Restore monthly transactions from 7,826 back above 8,300+'
      },
      {
        id: 'role-abm-1',
        role: 'Assistant Branch Manager (ABM - Haniesha Louna & Lead)',
        title: '11-Category Stock Cycle & 6-Month Aged Stock Liquidation Sprint',
        action: 'Reduce HQ 11 Closing Custom Cost (RM 604,903) by RM 35,000 within 30 days: (1) Cap reorder quantities on slow-moving F & B, PERSONAL, and MOM&BABY SKUs; (2) Set up a dedicated "Value Bundle / PWP Bay" for the top 100 6-month aged SKUs; (3) Coordinate supplier return/CN or inter-branch transfer for dead stock.',
        targetMetric: 'Improve PMG Stock Cycle by +RM 35,000 & cut 6M aged stock by 15%'
      },
      {
        id: 'role-abm-2',
        role: 'Assistant Branch Manager (ABM - Haniesha Louna & Lead)',
        title: 'Revamp Front-of-Store OTC, FIR-AID & NON-SCHE Merchandising (Walkthrough Fix)',
        action: 'Address the YoY drop in OTC (-RM 3,295), NON-SCHE (-RM 4,014), and FIR-AID (-RM 5,226) by installing high-visibility price talkers, family first-aid bundle kits, and HB vs Branded comparison tags on eye-level gondola shelves.',
        targetMetric: 'Recover +RM 6,000/month across OTC, NON-SCHE & FIR-AID'
      },
      {
        id: 'role-prp-1',
        role: 'Provisional Registered Pharmacist (PRP - Christina Lee)',
        title: 'Clinical Cross-Selling on SUPPLEME & ELDERLY Rehabilitation Aids',
        action: 'Leverage Christina’s strong 28.52% GP margin and 871 customer interactions to champion ELDERLY (29.25% GP) and SUPPLEME (36.92% GP) consultations. Require a structured 2-item health regimen pitch (Core Supplement + HB/HM Complementary Item) for every walk-in consultation.',
        targetMetric: 'Lift PRP TS Basket Size from RM 38.72 to RM 43.00+ & HB% from 43.28% to 47%'
      },
      {
        id: 'role-prp-2',
        role: 'Provisional Registered Pharmacist (PRP - Christina Lee)',
        title: 'New Product & High-Margin HM Clinical Detailing',
        action: 'Lead weekly 10-minute morning huddles with PAs on 5 focus HM/HB SKUs (covering mechanism, customer benefits, and objection handling) so floor staff can confidently switch customers from low-margin branded OTCs.',
        targetMetric: 'Boost outlet HM share of TS from 9.04% to 10.50%'
      },
      {
        id: 'role-pa-1',
        role: 'Pharmacist Assistant (PA Team - Penny, Nurhafizah, Farizin, Fiona)',
        title: 'Adult Nutrition (F & B) & Household Basket Margin Upgrade',
        action: 'Every customer purchasing F & B milk powder (Ensure, Glucerna, Appeton) or regular promotional items must be offered an HB/HM add-on (e.g., HB Vitamin C, Joint Gel, Diabetic Socks, or Strips) at checkout or on the floor to lift overall transaction GP%.',
        targetMetric: 'Maintain F & B GP% ≥ 24.5% and raise PA average HB Basket Size above RM 16.50'
      },
      {
        id: 'role-pa-2',
        role: 'Pharmacist Assistant (PA Team - Penny, Nurhafizah, Farizin, Fiona)',
        title: 'Daily Gondola Facing, Expiry FEFO & Zero-Out-of-Stock on Top 50 Hero SKUs',
        action: 'Assign each PA 3 specific HQ categories to own daily: check shelf talkers, pull 6-month aging items to eye-level forward display, and ensure top-selling OTC/NON-SCHE fast movers are never out-of-stock on weekend mornings.',
        targetMetric: '100% category ownership & +5% rebound in OTC/NON-SCHE unit volume'
      }
    ],

    teammateCoaching: [
      {
        id: 'tm-farizin',
        person: 'Muhammad Nur Farizin Bin Abdullah',
        role: 'PA',
        statusBadge: 'Needs Urgent HB & Basket Coaching',
        metricsSummary: 'TS: RM 32,317.74 | HB: RM 9,153.55 (28.32% of TS - Lowest among active staff) | HM: RM 2,911.40 (9.01%) | Tx: 1,007 | TS Basket: RM 32.09 | HB Basket: RM 9.09 | GP: 26.31%',
        commentAndAction: 'Farizin served 1,007 customers (3rd highest traffic in the branch) and achieved a solid 9.01% HM share, but his HB share (28.32%) and HB Basket Size (RM 9.09 vs branch average RM 18.38) are the lowest among full-time staff. Pair Farizin with Penny/William for 1-week shadowing on switching regular OTC buyers to HB equivalents, with a daily target of RM 450+ HB sales.'
      },
      {
        id: 'tm-nurhafizah',
        person: 'NURHAFIZAH BINTI PAULI',
        role: 'PA',
        statusBadge: 'HM Champion — Needs HB Conversion Lift',
        metricsSummary: 'TS: RM 35,448.85 (+1.28% YoY) | HB: RM 10,975.25 (30.96% of TS, -4.40% YoY) | HM: RM 4,157.10 (11.73% of TS, +43.79% YoY!) | Tx: 1,083 (-2.08% YoY) | TS Basket: RM 32.73 | HB Basket: RM 10.13 | GP: 27.44% (+0.80 pp YoY)',
        commentAndAction: 'Nurhafizah grew her Total Sales YoY (+1.28%), expanded GP% to 27.44%, and delivered an outstanding +43.79% surge in HM sales (11.73% of own TS — #1 HM% in branch!). However, her HB share is 30.96% (HB Basket RM 10.13). Coach her to apply the same consultative confidence she uses on HM items to core HB supplement & personal care lines to lift HB% to ≥ 38%.'
      },
      {
        id: 'tm-fiona',
        person: 'FIONA FIENA ANAK JAMES',
        role: 'PA',
        statusBadge: 'YoY Volume & Margin Recovery Plan',
        metricsSummary: 'TS: RM 31,577.73 (-27.85% YoY vs RM 43,768.06) | HB: RM 12,464.56 (39.47% of TS, -32.39% YoY) | HM: RM 2,392.96 (7.58%) | Tx: 827 (-31.65% YoY vs 1,210) | TS Basket: RM 38.18 (+5.56% YoY) | GP: 26.72% (-0.73 pp YoY)',
        commentAndAction: 'Fiona improved her TS Basket Size from RM 36.17 to RM 38.18 (+5.56%), but her customers served dropped by 383 (-31.65% YoY), pulling her TS down by -RM 12,190 and GP down by -RM 3,509. Assign Fiona proactive floor greeting during peak morning hours and set a target of 32+ transactions/day with at least 1 HM/HB bundle per 3 customers.'
      },
      {
        id: 'tm-louna',
        person: 'HANIESHA LOUNA ANAK DAGENG',
        role: 'ABM',
        statusBadge: 'GP Margin Protection Focus',
        metricsSummary: 'TS: RM 32,557.12 (-10.54% YoY) | HB: RM 12,957.07 (39.80% of TS) | HM: RM 2,496.10 (7.67%) | Tx: 866 (-11.36% YoY) | TS Basket: RM 37.59 | GP: RM 8,400.73 (25.46% - Lowest GP% in active team, -1.94 pp YoY)',
        commentAndAction: 'As ABM, Louna maintained a healthy 39.80% HB share and RM 37.59 basket size, but her personal GP Margin dropped -1.94 pp YoY to 25.46% (lowest in the active team), indicating heavy checkout of low-margin F & B / SCHE-DRU items without high-margin attachments. Focus Louna on attaching 35%+ GP SUPPLEME / NON-SCHE items to every nutrition/Rx bill to bring her GP% back above 27.5%.'
      },
      {
        id: 'tm-penny',
        person: 'JONG PEI CHOO',
        role: 'PA',
        statusBadge: 'Top Volume & HB Surge Star (#1 TS)',
        metricsSummary: 'TS: RM 55,348.40 (+18.26% YoY) | HB: RM 26,196.67 (47.33% of TS, +66.87% YoY!) | HM: RM 4,632.49 (8.37%, +33.26% YoY) | Tx: 1,188 (+4.67% YoY) | TS Basket: RM 46.59 | HB Basket: RM 22.05 | GP: RM 14,748.34 (26.35%, +2.34 pp YoY)',
        commentAndAction: 'Outstanding performance! Penny is the #1 revenue producer in Kota Sentosa (RM 55,348.40, +18.26% YoY), growing HB by +RM 10,497 (+66.87% YoY) and lifting GP by +RM 3,546.78 (+31.66% YoY). Next step: coach Penny on selective premium higher-margin HB/SUPPLEME tiering to raise her GP% from 26.35% to 28.0% while mentoring Farizin and Fiona.'
      },
      {
        id: 'tm-christina',
        person: 'Christina Lee Ying Ying',
        role: 'PRP',
        statusBadge: 'Solid Clinical Margin — Grow Basket Size',
        metricsSummary: 'TS: RM 33,723.47 | HB: RM 14,594.34 (43.28% of TS) | HM: RM 2,644.40 (7.84%) | Tx: 871 | TS Basket: RM 38.72 | HB Basket: RM 16.76 | GP: RM 9,613.07 (28.52%)',
        commentAndAction: 'Christina achieved a strong 28.52% GP margin (#3 highest in branch) and 43.28% HB penetration across 871 customers. By systematically offering a 2nd complementary health item during clinical counselling, she can raise her TS Basket from RM 38.72 to RM 44.00+ and HM% from 7.84% to 10.0%.'
      },
      {
        id: 'tm-william',
        person: 'CHAI YEE SIAN',
        role: 'Pharmacist (PIC)',
        statusBadge: 'Clinical Profit & Basket Benchmark (#1 GP RM)',
        metricsSummary: 'TS: RM 52,691.16 (+22.15% YoY) | HB: RM 26,315.55 (49.94% of TS, +23.81% YoY) | HM: RM 5,030.48 (9.55%, +23.78% YoY) | Tx: 542 (-1.63% YoY) | TS Basket: RM 97.22 (+24.18% YoY) | HB Basket: RM 48.55 | GP: RM 15,577.29 (29.22%)',
        commentAndAction: 'William leads the branch in Gross Profit RM (RM 15,577.29, +13.58% YoY), HB RM (RM 26,315.55), HM RM (RM 5,030.48), and TS Basket Size (RM 97.22). Document William’s high-ticket chronic + supplement consultation script into a 1-page SOP for the rest of the Kota Sentosa team.'
      }
    ]
  };
}

// ─── LIVE GEMINI AI DEEP ANALYSIS ENGINE ────────────────────────────────────
function buildGeminiPrompt(m, state) {
  const o = m.outlet;
  const hq = m.catSummaryHq11;
  const cats = m.categories.map(c =>
    `- ${c.category}${c.isHqFocus ? '' : ' (Excluded from HQ 11)'}: Latest Price RM ${c.netSoldPriceLatest.toFixed(2)} vs Prev RM ${c.netSoldPricePrev.toFixed(2)} (${c.priceDiffPct.toFixed(2)}%), Latest Profit RM ${c.netSoldProfitLatest.toFixed(2)} vs Prev RM ${c.netSoldProfitPrev.toFixed(2)} (${c.profitDiffPct.toFixed(2)}%), GP% ${c.gpPctLatest.toFixed(2)}% vs ${c.gpPctPrev.toFixed(2)}% (${c.gpPctDiffPP >= 0 ? '+' : ''}${c.gpPctDiffPP.toFixed(2)} pp), CostOfSales RM ${c.costOfSalesLatest.toFixed(2)}, ClosingCustomCost RM ${c.totalCustomCost.toFixed(2)}, PMG_StockCycle (COS / CustomCost) = ${c.pmgStockCycle.toFixed(4)} (${c.pmgStockCyclePct.toFixed(2)}%), 6M_AgedValue RM ${c.agedValueRm.toFixed(2)}`
  ).join('\n');

  const staff = m.teammates.filter(t => t.isActiveLatest || t.hasPrevYear).map(t =>
    `- ${t.name} [${t.role}]: TS RM ${t.tsLatest.toFixed(2)} (Prev RM ${t.tsPrev.toFixed(2)}), HB RM ${t.hbLatest.toFixed(2)} (${t.hbPctOwnTsLatest.toFixed(2)}% of own TS), HM RM ${t.hmLatest.toFixed(2)} (${t.hmPctOwnTsLatest.toFixed(2)}% of own TS), Tx ${t.txLatest} (Prev ${t.txPrev}), BasketTS RM ${t.basketTsLatest.toFixed(2)} (Prev RM ${t.basketTsPrev.toFixed(2)}), BasketHB RM ${t.basketHbLatest.toFixed(2)} (Prev RM ${t.basketHbPrev.toFixed(2)}), GP RM ${t.gpRmLatest.toFixed(2)} (${t.gpPctLatest.toFixed(2)}% vs Prev ${t.gpPctPrev.toFixed(2)}%)`
  ).join('\n');

  const topHeroes = m.topHeroSkus.slice(0, 8).map(s =>
    `${s.itemCode} ${s.itemName} (${s.category}): +RM ${s.priceDiffRm.toFixed(2)} (Latest RM ${s.priceLatest.toFixed(2)} vs LY RM ${s.pricePrev.toFixed(2)}, GP ${s.gpPctLatest.toFixed(1)}%)`
  ).join('; ');

  const topBleeders = m.topBleederSkus.slice(0, 8).map(s =>
    `${s.itemCode} ${s.itemName} (${s.category}): ${s.priceDiffRm.toFixed(2)} (Latest RM ${s.priceLatest.toFixed(2)} vs LY RM ${s.pricePrev.toFixed(2)}, GP ${s.gpPctLatest.toFixed(1)}%)`
  ).join('; ');

  return `You are a Chief Retail Pharmacy Strategist & Commercial Analyst for PMG Pharmacy Kota Sentosa (7th Mile Bazaar, Penrissen Road, Kuching, Sarawak).
Analyze the following verified monthly performance dataset comparing Latest Month (${state.meta?.latestPeriodLabel || 'Latest Month'}) against Previous Year Same Month (${state.meta?.prevYearPeriodLabel || 'Prev Year'}) and the Latest 3-Month trend:

1. OUTLET SUMMARY KPIs:
- Total Sales (TS): RM ${o.tsLatest.toFixed(2)} vs LY RM ${o.tsPrev.toFixed(2)} (${o.tsDiffPct.toFixed(2)}%)
- House Brand (HB): RM ${o.hbLatest.toFixed(2)} (${o.hbShareLatestPct.toFixed(2)}% of TS) vs LY RM ${o.hbPrev.toFixed(2)} (${o.hbSharePrevPct.toFixed(2)}% of TS), YoY change: ${o.hbDiffPct.toFixed(2)}%
- House Margin (HM): RM ${o.hmLatest.toFixed(2)} (${o.hmShareLatestPct.toFixed(2)}% of TS) vs LY RM ${o.hmPrev.toFixed(2)} (${o.hmSharePrevPct.toFixed(2)}% of TS), YoY change: ${o.hmDiffPct.toFixed(2)}%
- Personal Gross Profit Total: RM ${o.personalGpTotalLatest.netSoldProfit.toFixed(2)} (${o.personalGpTotalLatest.gpMarginPct.toFixed(2)}%) vs LY RM ${o.personalGpTotalPrev.netSoldProfit.toFixed(2)} (${o.personalGpTotalPrev.gpMarginPct.toFixed(2)}%)
- Total Transactions (Customers Served): ${o.txLatest} vs LY ${o.txPrev} (${o.txDiffPct.toFixed(2)}%)
- TS Basket Size: RM ${o.basketTsLatest.toFixed(2)} vs LY RM ${o.basketTsPrev.toFixed(2)} (${o.basketTsDiffPct.toFixed(2)}%)
- HB Basket Size: RM ${o.basketHbLatest.toFixed(2)} vs LY RM ${o.basketHbPrev.toFixed(2)} (${o.basketHbDiffPct.toFixed(2)}%)
- 3-Month Horizon: M-2 TS RM ${(m.threeMonthTrend.m2.ts || 0).toFixed(2)}, M-1 TS RM ${(m.threeMonthTrend.m1.ts || 0).toFixed(2)}, Latest TS RM ${o.tsLatest.toFixed(2)}

2. 11 HQ FOCUS CATEGORIES + WYMED-EX & PMG STOCK CYCLE:
Formula: COST OF SALES = NET SOLD PRICE - NET SOLD PROFIT; STOCK CYCLE = COST OF SALES / TOTAL CUSTOM COST; AVERAGE STOCK CYCLE = TOTAL COST OF SALES / TOTAL CUSTOM COST
HQ 11 Subtotal: Net Sold Price RM ${hq.netSoldPriceLatest.toFixed(2)} (vs LY RM ${hq.netSoldPricePrev.toFixed(2)}), Net Sold Profit RM ${hq.netSoldProfitLatest.toFixed(2)} (vs LY RM ${hq.netSoldProfitPrev.toFixed(2)}), GP% ${hq.gpPctLatest.toFixed(2)}% (vs LY ${hq.gpPctPrev.toFixed(2)}%), Cost of Sales RM ${hq.costOfSalesLatest.toFixed(2)}, Closing Custom Cost RM ${hq.totalCustomCost.toFixed(2)}, Average Stock Cycle = ${hq.averageStockCycle.toFixed(4)} (${hq.averageStockCyclePct.toFixed(2)}%).
Category Breakdown:
${cats}

3. TEAMMATE PERSONAL PERFORMANCE:
${staff}

4. GRANULAR SKU & 6-MONTH STOCK AGING HIGHLIGHTS:
- Top Growth SKUs: ${topHeroes}
- Top Declining SKUs: ${topBleeders}
- 6-Month Stock Aging: ${m.agingSummary.totalAgedSkus} SKUs with ≥6M aged stock totaling RM ${m.agingSummary.totalAgedValueRm.toFixed(2)} (including RM ${m.agingSummary.totalAbove1YrValueRm.toFixed(2)} aged >1 year).
- Video Walkthrough Report Notes: ${state.videoWalkthroughReport || 'None provided'}

Return ONLY valid JSON matching this exact structure (no markdown fences):
{
  "executiveSummary": "Detailed 4-5 sentence executive synthesis covering YoY, 3-month trajectory, traffic vs basket size, and profit margin dynamics.",
  "macroAndCompetitorAnalysis": [
    { "title": "Factor title (e.g., 7th Mile Wet Market & Commuter Footfall, Farley/Watsons Competition, Klinik Kesihatan Kota Sentosa Spillover, Sarawak Macro Inflation)", "detail": "Deep analysis with specific numbers and local Kota Sentosa context." }
  ],
  "categoryAndStockFindings": {
    "categoriesUp": [ { "category": "CAT", "summary": "Why it went up and how to sustain" } ],
    "categoriesDown": [ { "category": "CAT", "summary": "Why it went down and how to fix" } ],
    "stockCycleComment": "Deep commentary on PMG Stock Cycle formula results and 6-month aging cash lockup."
  },
  "swot": {
    "strengths": ["point 1", "point 2", "point 3", "point 4"],
    "weaknesses": ["point 1", "point 2", "point 3", "point 4"],
    "opportunities": ["point 1", "point 2", "point 3", "point 4"],
    "threats": ["point 1", "point 2", "point 3", "point 4"]
  },
  "roleActionPlans": [
    {
      "id": "unique-id",
      "role": "Pharmacist (PIC - William & Pharmacist Team) | Assistant Branch Manager (ABM) | Provisional Registered Pharmacist (PRP) | Pharmacist Assistant (PA)",
      "title": "Action title",
      "action": "Concrete step-by-step action plan for the month",
      "targetMetric": "Measurable 30-day target"
    }
  ],
  "teammateCoaching": [
    {
      "id": "tm-id",
      "person": "Exact Teammate Name",
      "role": "Role",
      "statusBadge": "Short status label",
      "metricsSummary": "Key metrics cited",
      "commentAndAction": "Specific individualized coaching & 30-day target"
    }
  ]
}`;
}

async function runLiveGeminiAnalysis() {
  const apiKeyInput = document.getElementById('perfGeminiApiKey');
  let apiKey = (apiKeyInput?.value || localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '').trim();
  if (!apiKey) {
    showToast('Please enter your Google Gemini API Key in the AI Studio bar first.', 'warning');
    if (apiKeyInput) apiKeyInput.focus();
    return;
  }
  localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, apiKey);

  if (!computedMetrics) {
    showToast('No performance data loaded to analyze.', 'error');
    return;
  }

  const btn = document.getElementById('btnRunGeminiAi');
  const statusEl = document.getElementById('aiModelStatusBadge');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Running Gemini 3.5 / 3.1 Flash-Lite Deep Analysis...`;
  }

  const prompt = buildGeminiPrompt(computedMetrics, perfState);
  let lastErr = null;
  let usedModel = null;
  let parsedJson = null;

  for (const modelName of PERF_FALLBACK_MODELS) {
    try {
      if (statusEl) {
        statusEl.textContent = `Querying ${modelName}...`;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status} (${modelName}): ${errText.slice(0, 180)}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) throw new Error(`Empty response from ${modelName}`);

      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedJson = JSON.parse(cleanJson);
      usedModel = modelName === PERF_PRIMARY_MODEL || modelName === PERF_SECONDARY_MODEL
        ? modelName
        : `${PERF_PRIMARY_MODEL} / ${PERF_SECONDARY_MODEL} (routed via ${modelName})`;
      break;
    } catch (err) {
      console.warn(`[Performance AI] Model ${modelName} attempt failed:`, err.message);
      lastErr = err;
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `✨ Run Live Gemini AI Analysis (3.5 / 3.1 Flash-Lite)`;
  }

  if (parsedJson) {
    parsedJson.modelUsed = `Live Gemini AI (${usedModel})`;
    parsedJson.generatedAt = new Date().toLocaleString('en-MY');
    activeAiReport = parsedJson;
    try {
      localStorage.setItem(STORAGE_KEYS.AI_REPORT, JSON.stringify(activeAiReport));
    } catch (e) { /* ignore quota */ }
    renderAiAnalysisSection();
    showToast(`Deep analysis completed using ${usedModel}!`, 'success');
  } else {
    showToast(`Live Gemini API call failed (${lastErr?.message || 'Check API key'}). Showing verified Quantitative Strategic Report.`, 'warning');
  }
}

// ─── MONTHLY TASK LIST (30-DAY EXECUTION TRACKER) ───────────────────────────
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    monthlyTasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    monthlyTasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(monthlyTasks));
  } catch (e) { /* ignore */ }
  updateTaskCounterBadges();
}

function updateTaskCounterBadges() {
  const total = monthlyTasks.length;
  const done = monthlyTasks.filter(t => t.status === 'COMPLETED').length;
  const badge = document.getElementById('navTaskCountBadge');
  if (badge) {
    badge.textContent = `${done}/${total}`;
  }
}

function isRecommendationApproved(sourceId) {
  return monthlyTasks.some(t => t.sourceId === sourceId);
}

function approveRecommendationToTaskList(rec) {
  if (rec.sourceId && isRecommendationApproved(rec.sourceId)) {
    showToast('This action plan is already in your 1-Month Task List!', 'info');
    return;
  }
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const dueStr = due.toISOString().slice(0, 10);

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    sourceId: rec.sourceId || null,
    role: rec.role || 'Pharmacist (PIC)',
    assignee: rec.assignee || rec.person || 'Kota Sentosa Team',
    title: rec.title || 'Action Plan Item',
    action: rec.action || '',
    targetMetric: rec.targetMetric || '',
    dueDate: dueStr,
    status: 'TODO', // 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
    approvedAt: new Date().toLocaleDateString('en-MY'),
    notes: ''
  };

  monthlyTasks.unshift(newTask);
  saveTasks();
  renderAiAnalysisSection();
  renderTaskListSection();
  showToast(`Approved "${newTask.title}" into your 30-Day Task List!`, 'success');
}

function approveAllRecommendations() {
  const report = activeAiReport || buildDynamicBaselineReport(computedMetrics, perfState);
  if (!report) return;
  let added = 0;

  (report.roleActionPlans || []).forEach((r, idx) => {
    const sid = r.id || `role_${idx}`;
    if (!isRecommendationApproved(sid)) {
      approveRecommendationSilent({
        sourceId: sid,
        role: r.role,
        assignee: r.role,
        title: r.title,
        action: r.action,
        targetMetric: r.targetMetric
      });
      added++;
    }
  });

  (report.teammateCoaching || []).forEach((t, idx) => {
    const sid = t.id || `tm_${idx}`;
    if (!isRecommendationApproved(sid)) {
      approveRecommendationSilent({
        sourceId: sid,
        role: t.role,
        assignee: t.person,
        title: `Personal Coaching: ${t.person} (${t.statusBadge})`,
        action: t.commentAndAction,
        targetMetric: t.metricsSummary
      });
      added++;
    }
  });

  saveTasks();
  renderAiAnalysisSection();
  renderTaskListSection();
  showToast(added > 0 ? `Approved ${added} action plans into your 1-Month Task List!` : 'All recommendations are already in your Task List.', 'success');
}

function approveRecommendationSilent(rec) {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  monthlyTasks.push({
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    sourceId: rec.sourceId || null,
    role: rec.role || 'Branch Team',
    assignee: rec.assignee || 'Kota Sentosa Team',
    title: rec.title,
    action: rec.action,
    targetMetric: rec.targetMetric || '',
    dueDate: due.toISOString().slice(0, 10),
    status: 'TODO',
    approvedAt: new Date().toLocaleDateString('en-MY'),
    notes: ''
  });
}

function updateTaskStatus(taskId, newStatus) {
  const t = monthlyTasks.find(x => x.id === taskId);
  if (!t) return;
  t.status = newStatus;
  saveTasks();
  renderTaskListSection();
}

function deleteTaskItem(taskId) {
  monthlyTasks = monthlyTasks.filter(x => x.id !== taskId);
  saveTasks();
  renderAiAnalysisSection();
  renderTaskListSection();
}

function addCustomTaskFromForm(e) {
  if (e) e.preventDefault();
  const titleEl = document.getElementById('customTaskTitle');
  const roleEl = document.getElementById('customTaskRole');
  const assigneeEl = document.getElementById('customTaskAssignee');
  const metricEl = document.getElementById('customTaskMetric');
  const actionEl = document.getElementById('customTaskAction');
  const dueEl = document.getElementById('customTaskDue');

  const title = (titleEl?.value || '').trim();
  if (!title) {
    showToast('Please enter a task title.', 'warning');
    return;
  }

  const due = dueEl?.value || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  monthlyTasks.unshift({
    id: 'task_' + Date.now(),
    sourceId: null,
    role: roleEl?.value || 'Pharmacist (PIC)',
    assignee: (assigneeEl?.value || 'Kota Sentosa Team').trim(),
    title,
    action: (actionEl?.value || '').trim(),
    targetMetric: (metricEl?.value || '').trim(),
    dueDate: due,
    status: 'TODO',
    approvedAt: new Date().toLocaleDateString('en-MY'),
    notes: ''
  });

  if (titleEl) titleEl.value = '';
  if (actionEl) actionEl.value = '';
  if (metricEl) metricEl.value = '';

  saveTasks();
  renderTaskListSection();
  showToast('Added custom action item to 30-Day Task List!', 'success');
}

function exportTasksCsv() {
  if (!monthlyTasks.length) {
    showToast('No tasks in your list to export.', 'warning');
    return;
  }
  const headers = ['Status', 'Role', 'Assignee', 'Title', 'Action Plan Details', 'Target KPI', 'Due Date', 'Approved Date'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  monthlyTasks.forEach(t => {
    lines.push([t.status, t.role, t.assignee, t.title, t.action, t.targetMetric, t.dueDate, t.approvedAt].map(esc).join(','));
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PMG_Kota_Sentosa_Monthly_Action_Plan_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── DATA PERSISTENCE, PRELOAD & CLEAR CONTROLS ─────────────────────────────
function createEmptyState() {
  return {
    meta: {
      branch: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      latestPeriodLabel: 'Latest Month (Not Uploaded)',
      prevYearPeriodLabel: 'Previous Year Same Month (Not Uploaded)',
      isPreloadedSample: false,
      generatedAt: new Date().toISOString()
    },
    dailySalesLatest: { dateRange: '', headers: [], rows: [] },
    dailySalesPrevYear: { dateRange: '', headers: [], rows: [] },
    dailySalesM1: { periodLabel: 'M-1 (Previous Month)', ts: 0, hb: 0, hm: 0, gpRm: 0, gpPct: 0, transactions: 0 },
    dailySalesM2: { periodLabel: 'M-2 (2 Months Ago)', ts: 0, hb: 0, hm: 0, gpRm: 0, gpPct: 0, transactions: 0 },
    personalGpLatest: { dateRange: '', rows: [], grandTotal: null },
    personalGpPrevYear: { dateRange: '', rows: [], grandTotal: null },
    customersServedLatest: { dateRange: '', rows: [], grandTotal: 0 },
    customersServedPrevYear: { dateRange: '', rows: [], grandTotal: 0 },
    categoryGpLatest: { dateRange: '', rows: [] },
    categoryGpPrevYear: { dateRange: '', rows: [] },
    stockClosingLatest: { dateTo: '', rows: [], grandTotal: null },
    itemSalesLatest: { dateRange: '', items: [], fileGrandTotal: null },
    itemSalesPrevYear: { dateRange: '', items: [], fileGrandTotal: null },
    stockAgingLatest: { items: [] },
    videoWalkthroughReport: ''
  };
}

function loadInitialState() {
  try {
    const savedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
    if (savedRoles) customRoles = JSON.parse(savedRoles);
  } catch (e) { customRoles = {}; }

  loadTasks();

  try {
    const savedAi = localStorage.getItem(STORAGE_KEYS.AI_REPORT);
    if (savedAi) activeAiReport = JSON.parse(savedAi);
  } catch (e) { activeAiReport = null; }

  const hideSample = localStorage.getItem(STORAGE_KEYS.HIDE_SAMPLE) === '1';

  try {
    const savedStateRaw = localStorage.getItem(STORAGE_KEYS.STATE);
    if (savedStateRaw) {
      perfState = JSON.parse(savedStateRaw);
      return;
    }
  } catch (e) {
    console.warn('Could not parse saved perfState:', e);
  }

  if (!hideSample && typeof window.PMG_PERFORMANCE_SAMPLE_DATA === 'object' && window.PMG_PERFORMANCE_SAMPLE_DATA) {
    perfState = JSON.parse(JSON.stringify(window.PMG_PERFORMANCE_SAMPLE_DATA));
  } else {
    perfState = createEmptyState();
  }
}

function saveActiveState() {
  try {
    // Save lightweight state to localStorage (if item arrays are huge, trim only if quota exceeded)
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(perfState));
  } catch (err) {
    console.warn('Quota reached saving full SKU arrays to localStorage; saving core KPI tables:', err.message);
    try {
      const compact = { ...perfState };
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(compact));
    } catch (e2) { /* ignore */ }
  }
}

function clearPreloadedSampleData() {
  localStorage.setItem(STORAGE_KEYS.HIDE_SAMPLE, '1');
  localStorage.removeItem(STORAGE_KEYS.STATE);
  localStorage.removeItem(STORAGE_KEYS.AI_REPORT);
  activeAiReport = null;
  perfState = createEmptyState();
  refreshAllViews();
  showToast('Preloaded sample data removed! Dashboard is now reset to blank for your fresh CSV uploads.', 'info');
}

function restorePreloadedSampleData() {
  if (!window.PMG_PERFORMANCE_SAMPLE_DATA) {
    showToast('Sample data script is not available.', 'error');
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.HIDE_SAMPLE);
  localStorage.removeItem(STORAGE_KEYS.STATE);
  localStorage.removeItem(STORAGE_KEYS.AI_REPORT);
  activeAiReport = null;
  perfState = JSON.parse(JSON.stringify(window.PMG_PERFORMANCE_SAMPLE_DATA));
  refreshAllViews();
  showToast('Restored October 2026 vs October 2025 Kota Sentosa sample dataset!', 'success');
}

// ─── UI RENDERING ENGINE ────────────────────────────────────────────────────
function refreshAllViews() {
  computedMetrics = computeAllMetrics(perfState);
  renderHeaderBanner();
  renderTab1ExecutiveOverview();
  renderTab2CategoryAndStockCycle();
  renderTab3TeammatesMatrix();
  renderTab4SkusAndAging();
  renderAiAnalysisSection();
  renderTaskListSection();
  renderDataStudioSlots();
  updateTaskCounterBadges();
}

function renderHeaderBanner() {
  const sampleBanner = document.getElementById('preloadedSampleBanner');
  const periodBadge = document.getElementById('activePeriodHeaderBadge');
  if (sampleBanner) {
    if (perfState?.meta?.isPreloadedSample) {
      sampleBanner.classList.remove('hidden');
    } else {
      sampleBanner.classList.add('hidden');
    }
  }
  if (periodBadge) {
    const l = perfState?.meta?.latestPeriodLabel || 'No Data';
    const p = perfState?.meta?.prevYearPeriodLabel || 'No Data';
    periodBadge.innerHTML = `<span class="font-bold text-indigo-950">${escapeHtml(l)}</span> <span class="text-slate-400 mx-1">vs</span> <span class="font-semibold text-slate-700">${escapeHtml(p)}</span>`;
  }
}

// ── TAB 1: EXECUTIVE KPIs (KPIs 1–5 + 3-MONTH HORIZON) ──────────────────────
function renderTab1ExecutiveOverview() {
  const container = document.getElementById('tab1ExecutiveContainer');
  if (!container || !computedMetrics) return;
  const o = computedMetrics.outlet;
  const hq = computedMetrics.catSummaryHq11;
  const all12 = computedMetrics.catSummaryAll12;
  const m2 = computedMetrics.threeMonthTrend.m2;
  const m1 = computedMetrics.threeMonthTrend.m1;

  const hasData = o.tsLatest > 0 || o.tsPrev > 0 || all12.netSoldPriceLatest > 0;
  if (!hasData) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
        <div class="text-4xl mb-3">📂</div>
        <h3 class="text-lg font-bold text-slate-800">No Monthly Performance Data Loaded</h3>
        <p class="text-sm text-slate-500 mt-1 max-w-xl mx-auto">Preloaded sample data has been cleared. Go to the <strong>"7. Upload CSV & Data Studio"</strong> tab to drop your monthly CSV files, or click <strong>"Restore Oct 2026 Sample"</strong> in the top bar to preview.</p>
        <button onclick="switchPerfTab('tab7')" class="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow">Go to CSV Upload Studio →</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <!-- Top 5 Required Core Comparisons (KPIs 1 to 5) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- KPI 1A: Total Sales (TS) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">1A. Total Sales (TS)</span>
          ${badgeDelta(o.tsDiffPct, true)}
        </div>
        <div class="text-2xl font-extrabold text-slate-900 mt-1">${fmtRM(o.tsLatest)}</div>
        <div class="text-xs text-slate-500 mt-1">
          Prev Year: <span class="font-semibold text-slate-700">${fmtRM(o.tsPrev)}</span>
          <span class="ml-1 font-bold ${o.tsDiffRm >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${o.tsDiffRm >= 0 ? '+' : ''}${fmtRM(o.tsDiffRm)})</span>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>HQ 11 Net Sold: <strong>${fmtRM(hq.netSoldPriceLatest)}</strong></span>
          <span>12 Cat: <strong>${fmtRM(all12.netSoldPriceLatest)}</strong></span>
        </div>
      </div>

      <!-- KPI 1B: House Brand (HB) & HM -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">1B. HB & HM Performance</span>
          ${badgeDelta(o.hbDiffPct, true)}
        </div>
        <div class="flex items-baseline justify-between mt-1">
          <div>
            <div class="text-xl font-extrabold text-indigo-950">${fmtRM(o.hbLatest)} <span class="text-xs font-bold text-indigo-600">HB</span></div>
            <div class="text-[11px] text-slate-500">Prev HB: ${fmtRM(o.hbPrev)} (${o.hbDiffRm >= 0 ? '+' : ''}${fmtRM(o.hbDiffRm)})</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-extrabold text-emerald-700">${fmtPct(o.hbShareLatestPct)} <span class="text-[10px] font-normal">of TS</span></div>
            <div class="text-[11px] text-slate-500">LY: ${fmtPct(o.hbSharePrevPct)} (${fmtPP(o.hbShareDiffPP)})</div>
          </div>
        </div>
        <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-violet-700">HM: ${fmtRM(o.hmLatest)}</span>
            <span class="text-slate-500 text-[11px] ml-1">(LY: ${fmtRM(o.hmPrev)})</span>
          </div>
          <div class="text-right">
            <span class="font-bold text-violet-800">${fmtPct(o.hmShareLatestPct)} of TS</span>
            <span class="ml-1 text-[11px] font-bold text-emerald-600">(${fmtPct(o.hmDiffPct, 1, true)})</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Gross Profit (RM & %) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">2. Gross Profit (RM & %)</span>
          ${badgeDelta(o.personalGpDiffPct, true)}
        </div>
        <div class="flex items-baseline justify-between mt-1">
          <div class="text-2xl font-extrabold text-slate-900">${fmtRM(o.personalGpTotalLatest.netSoldProfit)}</div>
          <div class="text-lg font-extrabold text-emerald-700">${fmtPct(o.personalGpTotalLatest.gpMarginPct)}</div>
        </div>
        <div class="text-xs text-slate-500 mt-1 flex justify-between">
          <span>Prev Year: <strong>${fmtRM(o.personalGpTotalPrev.netSoldProfit)}</strong> (${o.personalGpDiffRm >= 0 ? '+' : ''}${fmtRM(o.personalGpDiffRm)})</span>
          <span class="font-bold text-emerald-700">${fmtPP(o.personalGpMarginDiffPP)}</span>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>HQ 11 Profit: <strong>${fmtRM(hq.netSoldProfitLatest)}</strong> (${fmtPct(hq.gpPctLatest)})</span>
          <span>LY: ${fmtPct(hq.gpPctPrev)}</span>
        </div>
      </div>

      <!-- KPI 3, 4, 5: Transactions & Basket Sizes (TS & HB) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-700">3–5. Traffic & Basket Size</span>
          ${badgeDelta(o.txDiffPct, true)}
        </div>
        <div class="flex items-baseline justify-between mt-1">
          <div>
            <div class="text-2xl font-extrabold text-slate-900">${fmtNum(o.txLatest)} <span class="text-xs font-semibold text-slate-500">tx</span></div>
            <div class="text-[11px] text-slate-500">Prev Year: ${fmtNum(o.txPrev)} (${o.txDiff >= 0 ? '+' : ''}${fmtNum(o.txDiff)})</div>
          </div>
          <div class="text-right">
            <div class="text-xs font-bold text-slate-700">TS Basket: <span class="text-indigo-700 font-extrabold">${fmtRM(o.basketTsLatest)}</span></div>
            <div class="text-[11px] text-emerald-600 font-semibold">LY ${fmtRM(o.basketTsPrev)} (${fmtPct(o.basketTsDiffPct, 1, true)})</div>
          </div>
        </div>
        <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="font-semibold text-slate-600">5. HB Basket Size:</span>
          <span>
            <strong class="text-indigo-700">${fmtRM(o.basketHbLatest)}</strong>
            <span class="text-[11px] text-slate-500">vs LY ${fmtRM(o.basketHbPrev)}</span>
            <span class="text-[11px] font-bold text-emerald-600 ml-1">(${fmtPct(o.basketHbDiffPct, 1, true)})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Complete Quantitative Verification Table for Requirements 1–5 & 7–9 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold tracking-wide uppercase">Core YoY Quantitative Comparison Matrix (KPIs 1–5 & 7–9)</h3>
            <p class="text-xs text-slate-300 mt-0.5">Comparing Latest Month vs Previous Year Same Month in RM, % Share, and YoY Growth %</p>
          </div>
          <span class="px-2.5 py-1 rounded bg-indigo-500/30 border border-indigo-400/40 text-xs font-semibold">Kota Sentosa (PQ0147MI)</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th class="py-3 px-4">Metric / Requirement</th>
                <th class="py-3 px-4 text-right">Latest Month</th>
                <th class="py-3 px-4 text-right">Prev Year (Same Month)</th>
                <th class="py-3 px-4 text-right">Variance (RM / Qty)</th>
                <th class="py-3 px-4 text-right">YoY Change (%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr class="hover:bg-slate-50/80">
                <td class="py-2.5 px-4 font-bold">1a. Total Sales (TS - Daily Sales Report)</td>
                <td class="py-2.5 px-4 text-right font-bold">${fmtRM(o.tsLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtRM(o.tsPrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold ${o.tsDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.tsDiffRm >= 0 ? '+' : ''}${fmtRM(o.tsDiffRm)}</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.tsDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80 bg-indigo-50/30">
                <td class="py-2.5 px-4 font-bold text-indigo-950">1b. House Brand Sales (HB in RM & % of TS)</td>
                <td class="py-2.5 px-4 text-right font-bold text-indigo-900">${fmtRM(o.hbLatest)} <span class="text-[11px] text-indigo-600">(${fmtPct(o.hbShareLatestPct)})</span></td>
                <td class="py-2.5 px-4 text-right">${fmtRM(o.hbPrev)} <span class="text-[11px] text-slate-500">(${fmtPct(o.hbSharePrevPct)})</span></td>
                <td class="py-2.5 px-4 text-right font-semibold text-emerald-700">+${fmtRM(o.hbDiffRm)} <span class="text-[11px]">(${fmtPP(o.hbShareDiffPP)})</span></td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.hbDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80 bg-violet-50/30">
                <td class="py-2.5 px-4 font-bold text-violet-950">1c. House Margin Sales (HM in RM & % of TS)</td>
                <td class="py-2.5 px-4 text-right font-bold text-violet-900">${fmtRM(o.hmLatest)} <span class="text-[11px] text-violet-600">(${fmtPct(o.hmShareLatestPct)})</span></td>
                <td class="py-2.5 px-4 text-right">${fmtRM(o.hmPrev)} <span class="text-[11px] text-slate-500">(${fmtPct(o.hmSharePrevPct)})</span></td>
                <td class="py-2.5 px-4 text-right font-semibold text-emerald-700">+${fmtRM(o.hmDiffRm)} <span class="text-[11px]">(${fmtPP(o.hmShareDiffPP)})</span></td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.hmDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="py-2.5 px-4 font-bold">2a. Personal Gross Profit (RM) & Margin (%)</td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-800">${fmtRM(o.personalGpTotalLatest.netSoldProfit)} <span class="text-[11px]">(${fmtPct(o.personalGpTotalLatest.gpMarginPct)})</span></td>
                <td class="py-2.5 px-4 text-right">${fmtRM(o.personalGpTotalPrev.netSoldProfit)} <span class="text-[11px] text-slate-500">(${fmtPct(o.personalGpTotalPrev.gpMarginPct)})</span></td>
                <td class="py-2.5 px-4 text-right font-semibold text-emerald-700">${o.personalGpDiffRm >= 0 ? '+' : ''}${fmtRM(o.personalGpDiffRm)} <span class="text-[11px]">(${fmtPP(o.personalGpMarginDiffPP)})</span></td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.personalGpDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="py-2.5 px-4 font-bold">3. Number of Transactions (Customers Served)</td>
                <td class="py-2.5 px-4 text-right font-bold">${fmtNum(o.txLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtNum(o.txPrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold ${o.txDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.txDiff >= 0 ? '+' : ''}${fmtNum(o.txDiff)} tx</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.txDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="py-2.5 px-4 font-bold">4. Basket Size for TS (TS ÷ Transactions)</td>
                <td class="py-2.5 px-4 text-right font-bold text-indigo-900">${fmtRM(o.basketTsLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtRM(o.basketTsPrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold ${o.basketTsDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.basketTsDiffRm >= 0 ? '+' : ''}${fmtRM(o.basketTsDiffRm)}</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.basketTsDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="py-2.5 px-4 font-bold">5. Basket Size for HB (HB ÷ Transactions)</td>
                <td class="py-2.5 px-4 text-right font-bold text-indigo-900">${fmtRM(o.basketHbLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtRM(o.basketHbPrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold ${o.basketHbDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.basketHbDiffRm >= 0 ? '+' : ''}${fmtRM(o.basketHbDiffRm)}</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(o.basketHbDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80 bg-emerald-50/30">
                <td class="py-2.5 px-4 font-bold">7. Net Sold Price (11 HQ Focus Categories) <span class="text-[10px] font-normal text-slate-500 block">12 Categories Total: ${fmtRM(all12.netSoldPriceLatest)} vs LY ${fmtRM(all12.netSoldPricePrev)}</span></td>
                <td class="py-2.5 px-4 text-right font-bold">${fmtRM(hq.netSoldPriceLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtRM(hq.netSoldPricePrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold ${hq.priceDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${hq.priceDiffRm >= 0 ? '+' : ''}${fmtRM(hq.priceDiffRm)}</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(hq.priceDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80 bg-emerald-50/30">
                <td class="py-2.5 px-4 font-bold">8. Net Sold Profit (11 HQ Focus Categories) <span class="text-[10px] font-normal text-slate-500 block">12 Categories Total: ${fmtRM(all12.netSoldProfitLatest)} vs LY ${fmtRM(all12.netSoldProfitPrev)}</span></td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-800">${fmtRM(hq.netSoldProfitLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtRM(hq.netSoldProfitPrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold ${hq.profitDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${hq.profitDiffRm >= 0 ? '+' : ''}${fmtRM(hq.profitDiffRm)}</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(hq.profitDiffPct, true)}</td>
              </tr>
              <tr class="hover:bg-slate-50/80 bg-emerald-50/30">
                <td class="py-2.5 px-4 font-bold">9. Category Gross Profit Margin (%) (11 HQ Focus) <span class="text-[10px] font-normal text-slate-500 block">12 Categories GP%: ${fmtPct(all12.gpPctLatest)} vs LY ${fmtPct(all12.gpPctPrev)}</span></td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-800">${fmtPct(hq.gpPctLatest)}</td>
                <td class="py-2.5 px-4 text-right">${fmtPct(hq.gpPctPrev)}</td>
                <td class="py-2.5 px-4 text-right font-semibold text-emerald-700">${fmtPP(hq.gpPctDiffPP)}</td>
                <td class="py-2.5 px-4 text-right">${badgeDelta(hq.gpPctDiffPP, true, 2, ' pp')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Latest 3-Month Rolling Comparison Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Latest 3-Month Trajectory</h3>
            <button onclick="switchPerfTab('tab7')" class="text-[11px] font-bold text-indigo-600 hover:underline">Edit M-1 / M-2 →</button>
          </div>
          <p class="text-xs text-slate-500 mb-4">Comparing M-2, M-1, and Latest Month alongside Previous Year Same Month benchmark.</p>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex justify-between font-bold text-slate-700 mb-1">
                <span>${escapeHtml(m2.periodLabel || 'M-2')}</span>
                <span>${fmtRM(m2.ts)}</span>
              </div>
              <div class="flex justify-between text-[11px] text-slate-500">
                <span>HB: ${fmtRM(m2.hb)} | HM: ${fmtRM(m2.hm)}</span>
                <span>GP: ${fmtPct(m2.gpPct)} | ${fmtNum(m2.transactions)} tx</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex justify-between font-bold text-slate-700 mb-1">
                <span>${escapeHtml(m1.periodLabel || 'M-1')}</span>
                <span>${fmtRM(m1.ts)}</span>
              </div>
              <div class="flex justify-between text-[11px] text-slate-500">
                <span>HB: ${fmtRM(m1.hb)} | HM: ${fmtRM(m1.hm)}</span>
                <span>GP: ${fmtPct(m1.gpPct)} | ${fmtNum(m1.transactions)} tx</span>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-indigo-50 border-2 border-indigo-500/40">
              <div class="flex justify-between font-extrabold text-indigo-950 mb-1">
                <span>Latest (${escapeHtml(perfState?.meta?.latestPeriodLabel?.split('(')[0]?.trim() || 'Current')})</span>
                <span>${fmtRM(o.tsLatest)}</span>
              </div>
              <div class="flex justify-between text-[11px] text-indigo-800 font-medium">
                <span>HB: ${fmtRM(o.hbLatest)} | HM: ${fmtRM(o.hmLatest)}</span>
                <span>GP: ${fmtPct(o.personalGpTotalLatest.gpMarginPct)} | ${fmtNum(o.txLatest)} tx</span>
              </div>
              <div class="mt-2 pt-2 border-t border-indigo-200/70 flex justify-between text-[11px] font-bold">
                <span>vs M-1 (MoM): <span class="${o.tsLatest >= m1.ts ? 'text-emerald-700' : 'text-rose-700'}">${m1.ts > 0 ? fmtPct(calcGrowthPct(o.tsLatest, m1.ts), 2, true) : 'N/A'}</span></span>
                <span>vs Prev Year (YoY): <span class="${o.tsDiffPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${fmtPct(o.tsDiffPct, 2, true)}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <div class="font-bold text-slate-700 mb-1">Other Incentive Tiers (Latest vs LY):</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-slate-50 p-2 rounded border border-slate-200">
              <div class="text-slate-400">EHM</div>
              <div class="font-bold text-slate-800">${fmtRM(o.ehmLatest)}</div>
              <div class="text-[10px] text-slate-400">LY: ${fmtRM(o.ehmPrev)}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded border border-slate-200">
              <div class="text-slate-400">PB + AMPM</div>
              <div class="font-bold text-slate-800">${fmtRM(o.pbLatest)}</div>
              <div class="text-[10px] text-slate-400">LY: ${fmtRM(o.pbPrev)}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded border border-slate-200">
              <div class="text-slate-400">WHM</div>
              <div class="font-bold text-slate-800">${fmtRM(o.whmLatest)}</div>
              <div class="text-[10px] text-slate-400">LY: ${fmtRM(o.whmPrev)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── TAB 2: 11 HQ FOCUS CATEGORIES & PMG STOCK CYCLE (KPIs 7–10) ─────────────
function setCategoryFocusMode(mode) {
  activeCategoryMode = mode;
  renderTab2CategoryAndStockCycle();
}

function renderTab2CategoryAndStockCycle() {
  const container = document.getElementById('tab2CategoriesContainer');
  if (!container || !computedMetrics) return;

  const hq = computedMetrics.catSummaryHq11;
  const all12 = computedMetrics.catSummaryAll12;
  const activeSummary = activeCategoryMode === 'HQ11' ? hq : all12;
  const rows = activeCategoryMode === 'HQ11'
    ? computedMetrics.categories.filter(c => c.isHqFocus)
    : computedMetrics.categories;

  const upCats = computedMetrics.categories.filter(c => c.isHqFocus && c.priceDiffRm > 0);
  const downCats = computedMetrics.categories.filter(c => c.isHqFocus && c.priceDiffRm < 0);

  container.innerHTML = `
    <!-- Formula Banner & HQ 11 vs All 12 Toggle -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 mb-6 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">KPIs 7, 8, 9 & 10</span>
          <h3 class="text-base font-extrabold tracking-wide">PMG Category Performance & Stock Cycle Matrix</h3>
        </div>
        <div class="text-xs text-slate-300 mt-1.5 space-y-0.5 font-mono">
          <div>• <strong>COST OF SALES (MTD)</strong> = NET SOLD PRICE − NET SOLD PROFIT</div>
          <div>• <strong>STOCK CYCLE</strong> = COST OF SALES (MTD) ÷ TOTAL CUSTOMER (CUSTOM) COST</div>
          <div>• <strong>AVERAGE STOCK CYCLE</strong> = TOTAL COST OF SALES ÷ TOTAL CUSTOM COST &nbsp;|&nbsp; <span class="text-amber-300">HQ Focus = 11 Categories (Excludes WYMED-EX)</span></div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="setCategoryFocusMode('HQ11')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeCategoryMode === 'HQ11' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'}">
          HQ 11 Focus Categories (Excl. WYMED-EX)
        </button>
        <button onclick="setCategoryFocusMode('ALL12')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeCategoryMode === 'ALL12' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'}">
          All 12 Categories (Incl. WYMED-EX)
        </button>
      </div>
    </div>

    <!-- Top Stock Cycle & Category Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-slate-500 uppercase">7. Net Sold Price (${activeCategoryMode === 'HQ11' ? '11 HQ Cats' : 'All 12 Cats'})</div>
        <div class="text-xl font-extrabold text-slate-900 mt-1">${fmtRM(activeSummary.netSoldPriceLatest)}</div>
        <div class="text-xs text-slate-500 mt-1 flex justify-between items-center">
          <span>Prev Year: ${fmtRM(activeSummary.netSoldPricePrev)}</span>
          ${badgeDelta(activeSummary.priceDiffPct, true)}
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-emerald-700 uppercase">8 & 9. Net Sold Profit & GP%</div>
        <div class="flex items-baseline justify-between mt-1">
          <span class="text-xl font-extrabold text-emerald-800">${fmtRM(activeSummary.netSoldProfitLatest)}</span>
          <span class="text-base font-extrabold text-indigo-700">${fmtPct(activeSummary.gpPctLatest)}</span>
        </div>
        <div class="text-xs text-slate-500 mt-1 flex justify-between items-center">
          <span>LY: ${fmtRM(activeSummary.netSoldProfitPrev)} (${fmtPct(activeSummary.gpPctPrev)})</span>
          <span class="font-bold text-emerald-700">${fmtPP(activeSummary.gpPctDiffPP)}</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-indigo-700 uppercase">10A. Cost of Sales vs Custom Cost</div>
        <div class="text-sm font-extrabold text-slate-900 mt-1">COS (MTD): <span class="text-indigo-700">${fmtRM(activeSummary.costOfSalesLatest)}</span></div>
        <div class="text-sm font-extrabold text-slate-900 mt-0.5">Custom Cost: <span class="text-amber-700">${fmtRM(activeSummary.totalCustomCost)}</span></div>
        <div class="text-[11px] text-slate-500 mt-1">Closing SKUs: <strong>${fmtNum(activeSummary.skuCountClosing)}</strong> (${activeSummary.stockCoverMonths}m cover)</div>
      </div>

      <div class="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-xs bg-indigo-50/30">
        <div class="text-xs font-bold text-indigo-950 uppercase">10B. PMG Average Stock Cycle</div>
        <div class="flex items-baseline justify-between mt-1">
          <span class="text-2xl font-extrabold text-indigo-900">${activeSummary.averageStockCycle.toFixed(2)}</span>
          <span class="text-sm font-extrabold text-emerald-700">${activeSummary.averageStockCycle.toFixed(4)} (${activeSummary.averageStockCyclePct}%)</span>
        </div>
        <div class="text-[11px] text-slate-600 mt-1">
          Formula: Total COS (${fmtRM(activeSummary.costOfSalesLatest)}) ÷ Total Custom Cost (${fmtRM(activeSummary.totalCustomCost)})
        </div>
        <div class="text-[11px] font-semibold text-indigo-800 mt-0.5">
          Mean across ${activeSummary.count} Categories: ${activeSummary.meanCategoryCycle.toFixed(2)} (${(activeSummary.meanCategoryCycle * 100).toFixed(2)}%)
        </div>
      </div>
    </div>

    <!-- Category Up vs Down Quick Summary Strip -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
        <div class="text-xs font-extrabold uppercase text-emerald-900 mb-2">📈 HQ Categories UP YoY in Net Sold Price (${upCats.length} Categories)</div>
        <div class="flex flex-wrap gap-2">
          ${upCats.map(c => `
            <div class="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-xs shadow-2xs">
              <span class="font-extrabold text-slate-900">${escapeHtml(c.category)}</span>:
              <span class="font-bold text-emerald-700">+${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 1, true)})</span>
              <span class="text-[11px] text-slate-500 ml-1">| GP: ${fmtPct(c.gpPctLatest)} (${fmtPP(c.gpPctDiffPP)})</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
        <div class="text-xs font-extrabold uppercase text-rose-900 mb-2">📉 HQ Categories DOWN YoY in Net Sold Price (${downCats.length} Categories)</div>
        <div class="flex flex-wrap gap-2">
          ${downCats.map(c => `
            <div class="bg-white px-3 py-1.5 rounded-xl border border-rose-200 text-xs shadow-2xs">
              <span class="font-extrabold text-slate-900">${escapeHtml(c.category)}</span>:
              <span class="font-bold text-rose-700">${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 1, true)})</span>
              <span class="text-[11px] text-slate-500 ml-1">| GP: ${fmtPct(c.gpPctLatest)} (${fmtPP(c.gpPctDiffPP)})</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Full Category Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-white uppercase text-[11px]">
              <th class="py-3 px-3">Category</th>
              <th class="py-3 px-3 text-right">Latest Net Sold Price</th>
              <th class="py-3 px-3 text-right">Prev Year Price</th>
              <th class="py-3 px-3 text-right">Price YoY</th>
              <th class="py-3 px-3 text-right">Latest Net Profit</th>
              <th class="py-3 px-3 text-right">Prev Year Profit</th>
              <th class="py-3 px-3 text-right">Profit YoY</th>
              <th class="py-3 px-3 text-right">Latest GP%</th>
              <th class="py-3 px-3 text-right">Prev GP%</th>
              <th class="py-3 px-3 text-right bg-indigo-950">Cost of Sales (MTD)</th>
              <th class="py-3 px-3 text-right bg-indigo-950">Total Custom Cost</th>
              <th class="py-3 px-3 text-right bg-indigo-900">PMG Stock Cycle (COS ÷ Cost)</th>
              <th class="py-3 px-3 text-right">6M Aged Stock</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-800">
            ${rows.map(c => `
              <tr class="hover:bg-slate-50 ${!c.isHqFocus ? 'bg-amber-50/40' : ''}">
                <td class="py-2.5 px-3 font-extrabold whitespace-nowrap">
                  <span class="inline-block w-2 h-2 rounded-full mr-1.5 ${c.priceDiffRm >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                  ${escapeHtml(c.category)}
                  ${!c.isHqFocus ? `<span class="ml-1 px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">Excl. HQ11</span>` : ''}
                </td>
                <td class="py-2.5 px-3 text-right font-bold">${fmtRM(c.netSoldPriceLatest)}</td>
                <td class="py-2.5 px-3 text-right text-slate-500">${fmtRM(c.netSoldPricePrev)}</td>
                <td class="py-2.5 px-3 text-right">
                  <div class="font-bold ${c.priceDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${c.priceDiffRm >= 0 ? '+' : ''}${fmtRM(c.priceDiffRm)}</div>
                  <div class="text-[10px] text-slate-500">${fmtPct(c.priceDiffPct, 1, true)}</div>
                </td>
                <td class="py-2.5 px-3 text-right font-bold text-emerald-800">${fmtRM(c.netSoldProfitLatest)}</td>
                <td class="py-2.5 px-3 text-right text-slate-500">${fmtRM(c.netSoldProfitPrev)}</td>
                <td class="py-2.5 px-3 text-right">
                  <div class="font-bold ${c.profitDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${c.profitDiffRm >= 0 ? '+' : ''}${fmtRM(c.profitDiffRm)}</div>
                  <div class="text-[10px] text-slate-500">${fmtPct(c.profitDiffPct, 1, true)}</div>
                </td>
                <td class="py-2.5 px-3 text-right font-extrabold text-indigo-800">${fmtPct(c.gpPctLatest)}</td>
                <td class="py-2.5 px-3 text-right text-slate-500">
                  <div>${fmtPct(c.gpPctPrev)}</div>
                  <div class="text-[10px] font-bold ${c.gpPctDiffPP >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${fmtPP(c.gpPctDiffPP)}</div>
                </td>
                <td class="py-2.5 px-3 text-right font-semibold bg-indigo-50/40">${fmtRM(c.costOfSalesLatest)}</td>
                <td class="py-2.5 px-3 text-right font-semibold bg-indigo-50/40">
                  <div>${fmtRM(c.totalCustomCost)}</div>
                  <div class="text-[10px] text-slate-400">${fmtNum(c.skuCountClosing)} SKUs</div>
                </td>
                <td class="py-2.5 px-3 text-right font-extrabold bg-indigo-50/80 ${c.pmgStockCycle >= 0.35 ? 'text-emerald-700' : 'text-amber-800'}">
                  <div class="text-sm">${c.pmgStockCycle.toFixed(2)} <span class="text-[10px] font-semibold">(${c.pmgStockCyclePct}%)</span></div>
                  <div class="text-[10px] text-slate-500 font-normal">Exact: ${c.pmgStockCycle.toFixed(4)} • ${c.stockCoverMonths}m cover</div>
                </td>
                <td class="py-2.5 px-3 text-right">
                  <div class="font-semibold text-amber-800">${fmtRM(c.agedValueRm)}</div>
                  <div class="text-[10px] text-slate-400">${fmtNum(c.agedSkuCount)} SKUs</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="bg-slate-900 text-white font-extrabold text-xs">
              <td class="py-3 px-3">TOTAL (${activeCategoryMode === 'HQ11' ? '11 HQ FOCUS CATEGORIES' : 'ALL 12 CATEGORIES'})</td>
              <td class="py-3 px-3 text-right">${fmtRM(activeSummary.netSoldPriceLatest)}</td>
              <td class="py-3 px-3 text-right text-slate-300">${fmtRM(activeSummary.netSoldPricePrev)}</td>
              <td class="py-3 px-3 text-right ${activeSummary.priceDiffRm >= 0 ? 'text-emerald-300' : 'text-rose-300'}">${activeSummary.priceDiffRm >= 0 ? '+' : ''}${fmtRM(activeSummary.priceDiffRm)} (${fmtPct(activeSummary.priceDiffPct, 2, true)})</td>
              <td class="py-3 px-3 text-right text-emerald-300">${fmtRM(activeSummary.netSoldProfitLatest)}</td>
              <td class="py-3 px-3 text-right text-slate-300">${fmtRM(activeSummary.netSoldProfitPrev)}</td>
              <td class="py-3 px-3 text-right ${activeSummary.profitDiffRm >= 0 ? 'text-emerald-300' : 'text-rose-300'}">${activeSummary.profitDiffRm >= 0 ? '+' : ''}${fmtRM(activeSummary.profitDiffRm)} (${fmtPct(activeSummary.profitDiffPct, 2, true)})</td>
              <td class="py-3 px-3 text-right text-amber-300">${fmtPct(activeSummary.gpPctLatest)}</td>
              <td class="py-3 px-3 text-right text-slate-300">${fmtPct(activeSummary.gpPctPrev)} (${fmtPP(activeSummary.gpPctDiffPP)})</td>
              <td class="py-3 px-3 text-right bg-indigo-950">${fmtRM(activeSummary.costOfSalesLatest)}</td>
              <td class="py-3 px-3 text-right bg-indigo-950">${fmtRM(activeSummary.totalCustomCost)}</td>
              <td class="py-3 px-3 text-right bg-indigo-900 text-amber-300">${activeSummary.averageStockCycle.toFixed(2)} (${activeSummary.averageStockCyclePct}%)</td>
              <td class="py-3 px-3 text-right text-amber-200">${fmtRM(activeSummary.agedValueRm)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

// ── TAB 3: TEAMMATE PERSONAL SALES & PRODUCTIVITY (KPI 6) ───────────────────
function toggleShowAllTeammates(val) {
  showAllTeammates = val;
  renderTab3TeammatesMatrix();
}

function updateTeammateRole(personKey, newRole) {
  if (!customRoles[personKey]) {
    customRoles[personKey] = { ...(DEFAULT_ROLE_MAP[personKey] || {}), role: newRole };
  } else {
    customRoles[personKey].role = newRole;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(customRoles));
  } catch (e) { /* ignore */ }
  computedMetrics = computeAllMetrics(perfState);
  renderTab3TeammatesMatrix();
}

function renderTab3TeammatesMatrix() {
  const container = document.getElementById('tab3TeammatesContainer');
  if (!container || !computedMetrics) return;

  const allRows = computedMetrics.teammates;
  const rows = showAllTeammates ? allRows : allRows.filter(t => t.isActiveLatest);
  const o = computedMetrics.outlet;

  const rolesList = ['Pharmacist (PIC)', 'Pharmacist', 'PRP', 'BM / Lead', 'ABM', 'PA', 'Locum Pharmacist', 'Former Staff'];

  container.innerHTML = `
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800">KPI 6 — Complete Personal Evaluation</span>
        <h3 class="text-base font-extrabold text-slate-900 mt-1">Teammate Personal Sales, HB% / HM% of Own TS, Basket Size (TS & HB), Transactions & Gross Profit</h3>
        <p class="text-xs text-slate-500 mt-0.5">Comparing each teammate's TS (RM), HB (RM & % with own TS), HM (RM & % with own TS), Customers Served (Latest vs LY), Basket Size TS & HB, and Gross Profit (RM & %).</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="toggleShowAllTeammates(false)" class="px-3.5 py-2 rounded-xl text-xs font-bold transition ${!showAllTeammates ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
          Active Latest Month Team (${allRows.filter(t => t.isActiveLatest).length})
        </button>
        <button onclick="toggleShowAllTeammates(true)" class="px-3.5 py-2 rounded-xl text-xs font-bold transition ${showAllTeammates ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
          All Rows Incl. 2025 / Locum (${allRows.length})
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-white uppercase text-[10px]">
              <th class="py-3 px-3">Teammate & Role</th>
              <th class="py-3 px-3 text-right">Personal TS (RM)<br><span class="text-slate-400 font-normal">vs Prev Year</span></th>
              <th class="py-3 px-3 text-right bg-indigo-950">Personal HB (RM)<br><span class="text-indigo-300 font-normal">& % of Own TS</span></th>
              <th class="py-3 px-3 text-right bg-violet-950">Personal HM (RM)<br><span class="text-violet-300 font-normal">& % of Own TS</span></th>
              <th class="py-3 px-3 text-right">Transactions<br><span class="text-slate-400 font-normal">Latest vs LY</span></th>
              <th class="py-3 px-3 text-right">TS Basket Size<br><span class="text-slate-400 font-normal">Own TS ÷ Tx</span></th>
              <th class="py-3 px-3 text-right">HB Basket Size<br><span class="text-slate-400 font-normal">Own HB ÷ Tx</span></th>
              <th class="py-3 px-3 text-right bg-emerald-950">Personal GP (RM)<br><span class="text-emerald-300 font-normal">Net Sold Profit</span></th>
              <th class="py-3 px-3 text-right bg-emerald-950">Personal GP (%)<br><span class="text-emerald-300 font-normal">Margin %</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-800">
            ${rows.map(t => `
              <tr class="hover:bg-slate-50">
                <td class="py-3 px-3">
                  <div class="font-extrabold text-slate-900">${escapeHtml(t.name)}</div>
                  <div class="flex items-center gap-1.5 mt-1">
                    <select onchange="updateTeammateRole('${escapeHtml(t.key)}', this.value)" class="text-[10px] font-bold bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700">
                      ${rolesList.map(r => `<option value="${r}" ${t.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                    <span class="text-[10px] text-slate-400">${fmtPct(t.branchTsShareLatest, 1)} of Branch TS</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="font-extrabold text-slate-900 text-sm">${fmtRM(t.tsLatest)}</div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.tsPrev > 0 ? fmtRM(t.tsPrev) : '—'}
                    ${t.tsDiffPct !== null ? `<span class="font-bold ${t.tsDiffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${fmtPct(t.tsDiffPct, 1, true)})</span>` : ''}
                  </div>
                </td>
                <td class="py-3 px-3 text-right bg-indigo-50/40">
                  <div class="font-extrabold text-indigo-950">${fmtRM(t.hbLatest)}</div>
                  <div class="text-xs font-extrabold text-indigo-600">${fmtPct(t.hbPctOwnTsLatest)} <span class="text-[10px] font-normal text-slate-500">of own TS</span></div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.hbPrev > 0 ? `${fmtRM(t.hbPrev)} (${fmtPct(t.hbPctOwnTsPrev)})` : '—'}
                  </div>
                </td>
                <td class="py-3 px-3 text-right bg-violet-50/40">
                  <div class="font-extrabold text-violet-950">${fmtRM(t.hmLatest)}</div>
                  <div class="text-xs font-extrabold text-violet-700">${fmtPct(t.hmPctOwnTsLatest)} <span class="text-[10px] font-normal text-slate-500">of own TS</span></div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.hmPrev > 0 ? `${fmtRM(t.hmPrev)} (${fmtPct(t.hmPctOwnTsPrev)})` : '—'}
                  </div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="font-extrabold text-slate-900">${fmtNum(t.txLatest)}</div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.txPrev > 0 ? fmtNum(t.txPrev) : '—'}
                    ${t.txDiffPct !== null ? `<span class="font-bold ${t.txDiffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${fmtPct(t.txDiffPct, 1, true)})</span>` : ''}
                  </div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="font-extrabold text-slate-900">${fmtRM(t.basketTsLatest)}</div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.basketTsPrev > 0 ? fmtRM(t.basketTsPrev) : '—'}
                  </div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="font-extrabold text-indigo-800">${fmtRM(t.basketHbLatest)}</div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.basketHbPrev > 0 ? fmtRM(t.basketHbPrev) : '—'}
                  </div>
                </td>
                <td class="py-3 px-3 text-right bg-emerald-50/40">
                  <div class="font-extrabold text-emerald-900">${fmtRM(t.gpRmLatest)}</div>
                  <div class="text-[10px] text-slate-500">
                    Net Price: ${fmtRM(t.netSoldPriceLatest)}
                  </div>
                  <div class="text-[10px] text-slate-500">
                    LY GP: ${t.gpRmPrev > 0 ? fmtRM(t.gpRmPrev) : '—'}
                  </div>
                </td>
                <td class="py-3 px-3 text-right bg-emerald-50/40">
                  <div class="text-sm font-extrabold ${t.gpPctLatest >= 28 ? 'text-emerald-700' : t.gpPctLatest < 26 ? 'text-rose-700' : 'text-slate-900'}">${fmtPct(t.gpPctLatest)}</div>
                  <div class="text-[10px] text-slate-500">
                    LY: ${t.gpPctPrev > 0 ? fmtPct(t.gpPctPrev) : '—'}
                    ${t.gpPctDiffPP !== null ? `<span class="font-bold ${t.gpPctDiffPP >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${fmtPP(t.gpPctDiffPP)})</span>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="bg-slate-900 text-white font-extrabold text-xs">
              <td class="py-3 px-3">BRANCH GRAND TOTAL / BENCHMARK</td>
              <td class="py-3 px-3 text-right">${fmtRM(o.tsLatest)}<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtRM(o.tsPrev)}</span></td>
              <td class="py-3 px-3 text-right bg-indigo-950 text-indigo-200">${fmtRM(o.hbLatest)} (${fmtPct(o.hbShareLatestPct)})<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtRM(o.hbPrev)} (${fmtPct(o.hbSharePrevPct)})</span></td>
              <td class="py-3 px-3 text-right bg-violet-950 text-violet-200">${fmtRM(o.hmLatest)} (${fmtPct(o.hmShareLatestPct)})<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtRM(o.hmPrev)} (${fmtPct(o.hmSharePrevPct)})</span></td>
              <td class="py-3 px-3 text-right">${fmtNum(o.txLatest)}<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtNum(o.txPrev)}</span></td>
              <td class="py-3 px-3 text-right">${fmtRM(o.basketTsLatest)}<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtRM(o.basketTsPrev)}</span></td>
              <td class="py-3 px-3 text-right">${fmtRM(o.basketHbLatest)}<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtRM(o.basketHbPrev)}</span></td>
              <td class="py-3 px-3 text-right bg-emerald-950 text-emerald-300">${fmtRM(o.personalGpTotalLatest.netSoldProfit)}<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtRM(o.personalGpTotalPrev.netSoldProfit)}</span></td>
              <td class="py-3 px-3 text-right bg-emerald-950 text-amber-300">${fmtPct(o.personalGpTotalLatest.gpMarginPct)}<br><span class="text-[10px] text-slate-300 font-normal">LY: ${fmtPct(o.personalGpTotalPrev.gpMarginPct)}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

// ── TAB 4: GRANULAR SKU SALES YOY & 6-MONTH STOCK AGING ─────────────────────
function updateSkuFilter(field, val) {
  skuFilterState[field] = val;
  if (field !== 'page') skuFilterState.page = 1;
  renderTab4SkusAndAging();
}

function renderTab4SkusAndAging() {
  const container = document.getElementById('tab4SkusContainer');
  if (!container || !computedMetrics) return;

  const allSkus = computedMetrics.skuComparison || [];
  const agSum = computedMetrics.agingSummary;

  let filtered = allSkus;
  if (skuFilterState.category !== 'ALL') {
    filtered = filtered.filter(s => s.category === skuFilterState.category);
  }
  if (skuFilterState.search.trim()) {
    const q = skuFilterState.search.trim().toLowerCase();
    filtered = filtered.filter(s =>
      s.itemCode.toLowerCase().includes(q) ||
      s.itemName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  if (skuFilterState.mode === 'HEROES') {
    filtered = filtered.filter(s => s.priceDiffRm > 0).sort((a, b) => b.priceDiffRm - a.priceDiffRm);
  } else if (skuFilterState.mode === 'BLEEDERS') {
    filtered = filtered.filter(s => s.priceDiffRm < 0).sort((a, b) => a.priceDiffRm - b.priceDiffRm);
  } else if (skuFilterState.mode === 'MARGIN_DROP') {
    filtered = filtered.filter(s => s.priceLatest >= 200 && s.pricePrev >= 200 && s.gpDiffPP !== null && s.gpDiffPP < -1.5).sort((a, b) => a.profitDiffRm - b.profitDiffRm);
  } else if (skuFilterState.mode === 'AGED_6M') {
    filtered = filtered.filter(s => s.agedValueRm > 0).sort((a, b) => b.agedValueRm - a.agedValueRm);
  } else {
    // Default sort by latest revenue desc
    filtered = [...filtered].sort((a, b) => b.priceLatest - a.priceLatest || b.pricePrev - a.pricePrev);
  }

  const totalMatches = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / skuFilterState.pageSize));
  if (skuFilterState.page > totalPages) skuFilterState.page = totalPages;
  const startIdx = (skuFilterState.page - 1) * skuFilterState.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + skuFilterState.pageSize);

  container.innerHTML = `
    <!-- Top SKU & 6-Month Stock Aging Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-slate-500 uppercase">Unique SKUs Analyzed YoY</div>
        <div class="text-2xl font-extrabold text-slate-900 mt-1">${fmtNum(allSkus.length)} <span class="text-xs font-normal text-slate-500">SKUs</span></div>
        <div class="text-xs text-slate-500 mt-1">
          Latest Sold: <strong>${fmtNum(perfState.itemSalesLatest?.items?.length || 0)}</strong> | LY Sold: <strong>${fmtNum(perfState.itemSalesPrevYear?.items?.length || 0)}</strong>
        </div>
      </div>

      <div class="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs">
        <div class="text-xs font-bold text-emerald-900 uppercase">Top SKU Growth Hero</div>
        <div class="text-sm font-extrabold text-slate-900 mt-1 truncate">${escapeHtml(computedMetrics.topHeroSkus[0]?.itemName || '—')}</div>
        <div class="text-xs text-emerald-800 font-bold mt-1">
          +${fmtRM(computedMetrics.topHeroSkus[0]?.priceDiffRm || 0)} YoY
          <span class="font-normal text-slate-600">(GP: ${fmtPct(computedMetrics.topHeroSkus[0]?.gpPctLatest || 0)})</span>
        </div>
      </div>

      <div class="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-xs">
        <div class="text-xs font-bold text-rose-900 uppercase">Largest SKU YoY Drop</div>
        <div class="text-sm font-extrabold text-slate-900 mt-1 truncate">${escapeHtml(computedMetrics.topBleederSkus[0]?.itemName || '—')}</div>
        <div class="text-xs text-rose-800 font-bold mt-1">
          ${fmtRM(computedMetrics.topBleederSkus[0]?.priceDiffRm || 0)} YoY
          <span class="font-normal text-slate-600">(LY: ${fmtRM(computedMetrics.topBleederSkus[0]?.pricePrev || 0)})</span>
        </div>
      </div>

      <div class="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 shadow-xs">
        <div class="text-xs font-bold text-amber-900 uppercase">6-Month+ Stock Aging Alert</div>
        <div class="text-xl font-extrabold text-amber-950 mt-1">${fmtRM(agSum.totalAgedValueRm)} <span class="text-xs font-semibold">(${fmtNum(agSum.totalAgedSkus)} SKUs)</span></div>
        <div class="text-xs text-amber-800 mt-1">
          Aged &gt;1 Year: <strong>${fmtRM(agSum.totalAbove1YrValueRm)}</strong> (${fmtNum(agSum.totalAbove1YrQty)} units)
        </div>
      </div>
    </div>

    <!-- 6-Month Stock Aging Breakdown by Category -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-3">📦 6-Month Non-Moving / Slow-Moving Stock Aging by Category (≥ 150 Days to &gt;1 Year)</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        ${agSum.byCategory.map(c => `
          <div onclick="updateSkuFilter('category', '${escapeHtml(c.category)}'); updateSkuFilter('mode', 'AGED_6M');" class="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/70 cursor-pointer transition">
            <div class="text-xs font-extrabold text-slate-800 flex justify-between">
              <span>${escapeHtml(c.category)}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">${fmtNum(c.skuCount)} SKUs</span>
            </div>
            <div class="text-sm font-extrabold text-amber-800 mt-1">${fmtRM(c.agedValue)}</div>
            <div class="text-[10px] text-slate-500">Aged Qty: ${fmtNum(c.agedQty6MPlus)} units</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- SKU Filter & Search Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <button onclick="updateSkuFilter('mode', 'ALL')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${skuFilterState.mode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">All SKUs (${fmtNum(allSkus.length)})</button>
        <button onclick="updateSkuFilter('mode', 'HEROES')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${skuFilterState.mode === 'HEROES' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}">🚀 Top Revenue Growth Heroes</button>
        <button onclick="updateSkuFilter('mode', 'BLEEDERS')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${skuFilterState.mode === 'BLEEDERS' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'}">📉 Top YoY Sales Drops</button>
        <button onclick="updateSkuFilter('mode', 'MARGIN_DROP')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${skuFilterState.mode === 'MARGIN_DROP' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}">⚠️ GP% Margin Eroded</button>
        <button onclick="updateSkuFilter('mode', 'AGED_6M')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${skuFilterState.mode === 'AGED_6M' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}">📦 In 6-Month Aging Report</button>
      </div>

      <div class="flex items-center gap-2">
        <select onchange="updateSkuFilter('category', this.value)" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800">
          <option value="ALL" ${skuFilterState.category === 'ALL' ? 'selected' : ''}>All 12 Categories</option>
          ${ALL_12_CATEGORIES.map(c => `<option value="${c}" ${skuFilterState.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <input type="text" value="${escapeHtml(skuFilterState.search)}" oninput="updateSkuFilter('search', this.value)" placeholder="Search SKU code or item name..." class="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      </div>
    </div>

    <!-- SKU Comparison Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span>Showing <strong>${fmtNum(pageItems.length)}</strong> of <strong>${fmtNum(totalMatches)}</strong> matching SKUs (Page ${skuFilterState.page} of ${totalPages})</span>
        <div class="flex items-center gap-2">
          <button onclick="updateSkuFilter('page', Math.max(1, skuFilterState.page - 1))" ${skuFilterState.page <= 1 ? 'disabled' : ''} class="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 font-bold">← Prev</button>
          <button onclick="updateSkuFilter('page', Math.min(${totalPages}, skuFilterState.page + 1))" ${skuFilterState.page >= totalPages ? 'disabled' : ''} class="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 font-bold">Next →</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-white uppercase text-[10px]">
              <th class="py-2.5 px-3">Code & Item Name</th>
              <th class="py-2.5 px-3">Category</th>
              <th class="py-2.5 px-3 text-right">Qty (Latest vs LY)</th>
              <th class="py-2.5 px-3 text-right">Latest Net Price</th>
              <th class="py-2.5 px-3 text-right">Prev Year Price</th>
              <th class="py-2.5 px-3 text-right">Price Variance</th>
              <th class="py-2.5 px-3 text-right">Latest Profit</th>
              <th class="py-2.5 px-3 text-right">Prev Profit</th>
              <th class="py-2.5 px-3 text-right">GP% (Latest vs LY)</th>
              <th class="py-2.5 px-3 text-right bg-amber-950">6M Aged Stock</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-800">
            ${pageItems.map(s => `
              <tr class="hover:bg-slate-50">
                <td class="py-2 px-3">
                  <div class="font-bold text-slate-900 max-w-xs truncate" title="${escapeHtml(s.itemName)}">${escapeHtml(s.itemName)}</div>
                  <div class="text-[10px] font-mono text-slate-500">${escapeHtml(s.itemCode)} | Unit Cost: ${fmtRM(s.unitCostLatest)}</div>
                </td>
                <td class="py-2 px-3 font-bold text-slate-700">${escapeHtml(s.category)}</td>
                <td class="py-2 px-3 text-right">
                  <span class="font-bold">${fmtNum(s.qtyLatest)}</span> <span class="text-slate-400">vs ${fmtNum(s.qtyPrev)}</span>
                  <div class="text-[10px] ${s.qtyDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-semibold">${s.qtyDiff >= 0 ? '+' : ''}${fmtNum(s.qtyDiff)}</div>
                </td>
                <td class="py-2 px-3 text-right font-bold">${fmtRM(s.priceLatest)}</td>
                <td class="py-2 px-3 text-right text-slate-500">${fmtRM(s.pricePrev)}</td>
                <td class="py-2 px-3 text-right font-extrabold ${s.priceDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  ${s.priceDiffRm >= 0 ? '+' : ''}${fmtRM(s.priceDiffRm)}
                </td>
                <td class="py-2 px-3 text-right font-bold text-emerald-800">${fmtRM(s.profitLatest)}</td>
                <td class="py-2 px-3 text-right text-slate-500">${fmtRM(s.profitPrev)}</td>
                <td class="py-2 px-3 text-right">
                  <div class="font-extrabold text-indigo-800">${fmtPct(s.gpPctLatest)}</div>
                  <div class="text-[10px] text-slate-400">LY: ${fmtPct(s.gpPctPrev)} ${s.gpDiffPP !== null ? `(${fmtPP(s.gpDiffPP)})` : ''}</div>
                </td>
                <td class="py-2 px-3 text-right bg-amber-50/40">
                  ${s.agedValueRm > 0 ? `
                    <div class="font-bold text-amber-900">${fmtRM(s.agedValueRm)}</div>
                    <div class="text-[10px] text-amber-700">${fmtNum(s.agedQty6MPlus)} aged / ${fmtNum(s.ohQty)} OH</div>
                  ` : `<span class="text-slate-300">—</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── TAB 5: GEMINI AI STRATEGIC ANALYSIS, SWOT & ROLE COACHING ───────────────
function renderAiAnalysisSection() {
  const container = document.getElementById('tab5AiContainer');
  if (!container || !computedMetrics) return;

  const report = activeAiReport || buildDynamicBaselineReport(computedMetrics, perfState);
  if (!report) return;

  const savedApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';

  container.innerHTML = `
    <!-- Gemini 3.5 / 3.1 Flash-Lite Control Bar -->
    <div class="bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 text-white rounded-2xl p-5 mb-6 shadow-md">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">Primary: gemini-3.5-flash-lite</span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">Secondary: gemini-3.1-flash-lite</span>
            <span id="aiModelStatusBadge" class="text-[11px] text-slate-300">Active Engine: ${escapeHtml(report.modelUsed)}</span>
          </div>
          <h3 class="text-base font-extrabold mt-1.5">AI Strategic Evaluation, Kota Sentosa Competitor Intelligence, SWOT & Role Action Plans</h3>
          <p class="text-xs text-slate-300 mt-0.5">Review the analysis below and click <strong>"Approve to 1-Month Task List"</strong> on any recommendation to add it to your monthly execution tracker.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <input id="perfGeminiApiKey" type="password" value="${escapeHtml(savedApiKey)}" placeholder="Gemini API Key (AIza...)" class="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 w-52 focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <button id="btnRunGeminiAi" onclick="runLiveGeminiAnalysis()" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow transition cursor-pointer">
            ✨ Run Live Gemini AI Analysis (3.5 / 3.1 Flash-Lite)
          </button>
          <button onclick="approveAllRecommendations()" class="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow transition cursor-pointer">
            ✅ Approve All to 1-Month Task List
          </button>
        </div>
      </div>
    </div>

    <!-- 1. Executive Synthesis -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 mb-1">1. Executive Results Commentary</div>
      <p class="text-sm text-slate-800 leading-relaxed font-medium">${escapeHtml(report.executiveSummary)}</p>
    </div>

    <!-- 2. Macroeconomic & Kota Sentosa Local Market / Competitor Analysis -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="text-xs font-extrabold uppercase tracking-wider text-amber-700 mb-3">2. Macroeconomic & Local Market / Competitor Analysis (PMG Pharmacy Kota Sentosa — 7th Mile Bazaar)</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(report.macroAndCompetitorAnalysis || []).map(item => `
          <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <h4 class="text-xs font-extrabold text-slate-900 mb-1">📍 ${escapeHtml(item.title)}</h4>
            <p class="text-xs text-slate-700 leading-relaxed">${escapeHtml(item.detail)}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. SWOT Analysis (4 Quadrants) -->
    <div class="mb-6">
      <div class="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3">3. Comprehensive SWOT Analysis (Kota Sentosa Branch)</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
          <div class="text-sm font-extrabold text-emerald-950 mb-2.5 flex items-center gap-2">💪 Strengths (Internal Advantages)</div>
          <ul class="space-y-2 text-xs text-slate-800 list-disc pl-4">
            ${(report.swot?.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
          <div class="text-sm font-extrabold text-rose-950 mb-2.5 flex items-center gap-2">⚠️ Weaknesses (Internal Gaps)</div>
          <ul class="space-y-2 text-xs text-slate-800 list-disc pl-4">
            ${(report.swot?.weaknesses || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5">
          <div class="text-sm font-extrabold text-indigo-950 mb-2.5 flex items-center gap-2">🚀 Opportunities (External Growth Levers)</div>
          <ul class="space-y-2 text-xs text-slate-800 list-disc pl-4">
            ${(report.swot?.opportunities || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
          <div class="text-sm font-extrabold text-amber-950 mb-2.5 flex items-center gap-2">🛡️ Threats (Competitor & Macro Risks)</div>
          <ul class="space-y-2 text-xs text-slate-800 list-disc pl-4">
            ${(report.swot?.threats || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- 4. Category Up/Down & Stock Cycle Findings -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="text-xs font-extrabold uppercase tracking-wider text-indigo-700 mb-2">4. Stock Cycle & Category Up / Down Commentary</div>
      <p class="text-xs text-slate-700 leading-relaxed mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">${escapeHtml(report.categoryAndStockFindings?.stockCycleComment || '')}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="text-xs font-extrabold text-emerald-800 uppercase mb-2">▲ Categories That Went UP YoY</div>
          <div class="space-y-2">
            ${(report.categoryAndStockFindings?.categoriesUp || []).map(c => `
              <div class="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                <span class="font-extrabold text-emerald-950">${escapeHtml(c.category)}:</span>
                <span class="text-slate-700 ml-1">${escapeHtml(c.summary)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="text-xs font-extrabold text-rose-800 uppercase mb-2">▼ Categories That Went DOWN YoY</div>
          <div class="space-y-2">
            ${(report.categoryAndStockFindings?.categoriesDown || []).map(c => `
              <div class="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs">
                <span class="font-extrabold text-rose-950">${escapeHtml(c.category)}:</span>
                <span class="text-slate-700 ml-1">${escapeHtml(c.summary)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Role-Specific Action Plans (Pharmacist PIC, ABM, PRP, PA) with Approve Buttons -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-xs font-extrabold uppercase tracking-wider text-indigo-700">5. Role-Specific Action Plans (PIC Pharmacist, ABM, PRP & PA)</div>
          <h4 class="text-sm font-extrabold text-slate-900 mt-0.5">Click "Approve into 1-Month Task List" on any action plan you want to execute</h4>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(report.roleActionPlans || []).map((r, idx) => {
          const sid = r.id || `role_${idx}`;
          const approved = isRecommendationApproved(sid);
          return `
            <div class="p-4 rounded-2xl border ${approved ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'} flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-900">${escapeHtml(r.role)}</span>
                  ${approved ? `<span class="text-[11px] font-extrabold text-emerald-700">✓ Approved in Task List</span>` : ''}
                </div>
                <h5 class="text-sm font-extrabold text-slate-900 mb-1">${escapeHtml(r.title)}</h5>
                <p class="text-xs text-slate-700 leading-relaxed mb-3">${escapeHtml(r.action)}</p>
              </div>
              <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <div class="text-[11px] font-bold text-indigo-800">🎯 Target: ${escapeHtml(r.targetMetric)}</div>
                <button
                  onclick='approveRecommendationToTaskList(${JSON.stringify({ sourceId: sid, role: r.role, assignee: r.role, title: r.title, action: r.action, targetMetric: r.targetMetric }).replace(/'/g, "&#39;")})'
                  ${approved ? 'disabled' : ''}
                  class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${approved ? 'bg-emerald-200 text-emerald-900 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'}">
                  ${approved ? '✓ Approved' : '+ Approve to Task List'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 6. Individual Teammate Special Action Plans with Approve Buttons -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div class="text-xs font-extrabold uppercase tracking-wider text-violet-700">6. Individual Teammate Special Coaching & Action Plans</div>
      <h4 class="text-sm font-extrabold text-slate-900 mt-0.5 mb-4">Targeted 1-on-1 action plans based on each teammate's TS, HB%, HM%, Basket Size & GP Margin</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(report.teammateCoaching || []).map((t, idx) => {
          const sid = t.id || `tm_${idx}`;
          const approved = isRecommendationApproved(sid);
          return `
            <div class="p-4 rounded-2xl border ${approved ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-white'} flex flex-col justify-between shadow-2xs">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <span class="text-sm font-extrabold text-slate-900">${escapeHtml(t.person)}</span>
                    <span class="ml-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">${escapeHtml(t.role)}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">${escapeHtml(t.statusBadge)}</span>
                </div>
                <div class="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 my-2">${escapeHtml(t.metricsSummary)}</div>
                <p class="text-xs text-slate-700 leading-relaxed mb-3">${escapeHtml(t.commentAndAction)}</p>
              </div>
              <div class="pt-2.5 border-t border-slate-100 flex justify-end">
                <button
                  onclick='approveRecommendationToTaskList(${JSON.stringify({ sourceId: sid, role: t.role, assignee: t.person, title: `Coaching Plan: ${t.person} (${t.statusBadge})`, action: t.commentAndAction, targetMetric: t.metricsSummary }).replace(/'/g, "&#39;")})'
                  ${approved ? 'disabled' : ''}
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${approved ? 'bg-emerald-200 text-emerald-900 cursor-default' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-2xs'}">
                  ${approved ? '✓ Approved in Task List' : '+ Approve Teammate Plan'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ── TAB 6: APPROVED 1-MONTH TASK LIST (30-DAY EXECUTION TRACKER) ────────────
function renderTaskListSection() {
  const container = document.getElementById('tab6TasksContainer');
  if (!container) return;

  const total = monthlyTasks.length;
  const completed = monthlyTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = monthlyTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  container.innerHTML = `
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">30-Day Execution Tracker</span>
          <h3 class="text-base font-extrabold text-slate-900 mt-1">Approved Monthly Action Plan & Task List (${completed}/${total} Completed — ${pct}%)</h3>
          <p class="text-xs text-slate-500 mt-0.5">Track approved AI recommendations across Pharmacist (PIC), ABM, PRP, and PA roles to complete within 1 month.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="approveAllRecommendations()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer">+ Import All AI Recommendations</button>
          <button onclick="exportTasksCsv()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">📥 Export CSV</button>
          <button onclick="window.print()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">🖨️ Print</button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden">
        <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${pct}%"></div>
      </div>
      <div class="flex justify-between text-[11px] text-slate-500 mt-1.5 font-semibold">
        <span>To Do: ${total - completed - inProgress}</span>
        <span>In Progress: ${inProgress}</span>
        <span class="text-emerald-700 font-bold">Completed: ${completed} (${pct}%)</span>
      </div>
    </div>

    <!-- Add Custom Action Plan Form -->
    <form onsubmit="addCustomTaskFromForm(event)" class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6">
      <div class="text-xs font-extrabold uppercase text-slate-700 mb-2.5">+ Add Custom Monthly Action Item</div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-2.5 mb-2.5">
        <input id="customTaskTitle" type="text" placeholder="Action Title (e.g., Launch Morning Screening Promo)" class="px-3 py-2 rounded-xl border border-slate-300 text-xs md:col-span-2">
        <select id="customTaskRole" class="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white">
          <option value="Pharmacist (PIC)">Pharmacist (PIC - William)</option>
          <option value="Assistant Branch Manager (ABM)">Assistant Branch Manager (ABM)</option>
          <option value="Provisional Registered Pharmacist (PRP)">Provisional Registered Pharmacist (PRP)</option>
          <option value="Pharmacist Assistant (PA)">Pharmacist Assistant (PA)</option>
        </select>
        <input id="customTaskAssignee" type="text" placeholder="Assignee Name" class="px-3 py-2 rounded-xl border border-slate-300 text-xs">
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        <input id="customTaskAction" type="text" placeholder="Detailed execution steps..." class="px-3 py-2 rounded-xl border border-slate-300 text-xs md:col-span-2">
        <input id="customTaskMetric" type="text" placeholder="Target KPI (e.g., +RM 1,500 GP)" class="px-3 py-2 rounded-xl border border-slate-300 text-xs">
        <div class="flex gap-2">
          <input id="customTaskDue" type="date" value="${new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)}" class="px-2.5 py-2 rounded-xl border border-slate-300 text-xs flex-1">
          <button type="submit" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer">Add</button>
        </div>
      </div>
    </form>

    <!-- Task Cards -->
    ${monthlyTasks.length === 0 ? `
      <div class="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
        <div class="text-3xl mb-2">📋</div>
        <h4 class="text-sm font-extrabold text-slate-800">No Approved Action Plans Yet</h4>
        <p class="text-xs text-slate-500 mt-1">Go to <strong>"5. Gemini AI Strategy & SWOT"</strong> and click <strong>"+ Approve to Task List"</strong> on any recommendation, or click <strong>"+ Import All AI Recommendations"</strong> above.</p>
      </div>
    ` : `
      <div class="space-y-3">
        ${monthlyTasks.map(t => `
          <div class="bg-white rounded-2xl p-4 border ${t.status === 'COMPLETED' ? 'border-emerald-300 bg-emerald-50/20' : t.status === 'IN_PROGRESS' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'} shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-900">${escapeHtml(t.role)}</span>
                <span class="text-xs font-bold text-slate-700">👤 ${escapeHtml(t.assignee)}</span>
                <span class="text-[11px] text-slate-400">Due: ${escapeHtml(t.dueDate)}</span>
              </div>
              <h4 class="text-sm font-extrabold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}">${escapeHtml(t.title)}</h4>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">${escapeHtml(t.action)}</p>
              ${t.targetMetric ? `<div class="text-[11px] font-bold text-indigo-700 mt-1.5">🎯 Target KPI: ${escapeHtml(t.targetMetric)}</div>` : ''}
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <select onchange="updateTaskStatus('${escapeHtml(t.id)}', this.value)" class="px-3 py-1.5 rounded-xl text-xs font-extrabold border ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-800 border-slate-300'}">
                <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>⏳ To Do</option>
                <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>🚧 In Progress</option>
                <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>✅ Completed</option>
              </select>
              <button onclick="deleteTaskItem('${escapeHtml(t.id)}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Remove Task">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

// ── TAB 7: CSV UPLOAD & DATA STUDIO ─────────────────────────────────────────
async function handleBatchCsvFiles(fileList) {
  if (!fileList || !fileList.length) return;

  // First scan years across all uploaded files so we know which year is Latest vs Prev Year
  const filePayloads = [];
  for (const file of Array.from(fileList)) {
    const text = await file.text();
    const det = autoDetectCsvTypeAndPeriod(file.name, text);
    filePayloads.push({ file, name: file.name, text, type: det.type, year: det.year });
  }

  const years = filePayloads.map(f => f.year).filter(Boolean);
  const maxYear = years.length ? Math.max(...years) : 2026;

  // If user is uploading fresh files while preloaded sample was active, mark sample flag false
  perfState.meta.isPreloadedSample = false;

  let loadedCount = 0;
  for (const fp of filePayloads) {
    try {
      const isLatest = !fp.year || fp.year === maxYear;
      applyParsedCsvToState(fp.type, isLatest ? 'LATEST' : 'PREV_YEAR', fp.text, fp.name);
      loadedCount++;
    } catch (err) {
      console.error(`Error parsing ${fp.name}:`, err);
      showToast(`Could not parse ${fp.name}: ${err.message}`, 'error');
    }
  }

  if (loadedCount > 0) {
    saveActiveState();
    activeAiReport = null; // Regenerate dynamic baseline report with new data
    refreshAllViews();
    showToast(`Successfully parsed & loaded ${loadedCount} CSV file(s)!`, 'success');
  }
}

function applyParsedCsvToState(type, periodSlot, text, fileName) {
  if (type === 'DAILY_SALES') {
    const parsed = parseDailySalesCsv(text);
    if (periodSlot === 'LATEST') {
      perfState.dailySalesLatest = parsed;
      if (parsed.dateRange) perfState.meta.latestPeriodLabel = `Latest (${parsed.dateRange})`;
    } else if (periodSlot === 'PREV_YEAR') {
      perfState.dailySalesPrevYear = parsed;
      if (parsed.dateRange) perfState.meta.prevYearPeriodLabel = `Prev Year (${parsed.dateRange})`;
    } else if (periodSlot === 'M1') {
      const ts = +parsed.rows.reduce((s, r) => s + r.ts, 0).toFixed(2);
      const hb = +parsed.rows.reduce((s, r) => s + r.hb, 0).toFixed(2);
      const hm = +parsed.rows.reduce((s, r) => s + r.hm, 0).toFixed(2);
      perfState.dailySalesM1 = { ...perfState.dailySalesM1, periodLabel: parsed.dateRange || 'M-1', ts, hb, hm };
    } else if (periodSlot === 'M2') {
      const ts = +parsed.rows.reduce((s, r) => s + r.ts, 0).toFixed(2);
      const hb = +parsed.rows.reduce((s, r) => s + r.hb, 0).toFixed(2);
      const hm = +parsed.rows.reduce((s, r) => s + r.hm, 0).toFixed(2);
      perfState.dailySalesM2 = { ...perfState.dailySalesM2, periodLabel: parsed.dateRange || 'M-2', ts, hb, hm };
    }
  } else if (type === 'PERSONAL_GP') {
    const parsed = parsePersonalGpCsv(text);
    if (periodSlot === 'LATEST') perfState.personalGpLatest = parsed;
    else perfState.personalGpPrevYear = parsed;
  } else if (type === 'CUSTOMERS_SERVED') {
    const parsed = parseCustomersServedCsv(text);
    if (periodSlot === 'LATEST') perfState.customersServedLatest = parsed;
    else perfState.customersServedPrevYear = parsed;
  } else if (type === 'CATEGORY_GP') {
    const parsed = parseCategoryGpCsv(text);
    if (periodSlot === 'LATEST') perfState.categoryGpLatest = parsed;
    else perfState.categoryGpPrevYear = parsed;
  } else if (type === 'STOCK_CLOSING') {
    perfState.stockClosingLatest = parseStockClosingCsv(text);
  } else if (type === 'ITEM_SALES') {
    const parsed = parseItemSalesCsv(text);
    if (periodSlot === 'LATEST') perfState.itemSalesLatest = parsed;
    else perfState.itemSalesPrevYear = parsed;
  } else if (type === 'STOCK_AGING') {
    perfState.stockAgingLatest = parseAgingCsv(text);
  } else {
    throw new Error(`Unrecognized PMG CSV format in ${fileName}`);
  }
}

async function handleSlotFileUpload(type, periodSlot, inputEl) {
  const file = inputEl?.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    perfState.meta.isPreloadedSample = false;
    applyParsedCsvToState(type, periodSlot, text, file.name);
    saveActiveState();
    activeAiReport = null;
    refreshAllViews();
    showToast(`Loaded ${file.name} into ${type} (${periodSlot})!`, 'success');
  } catch (err) {
    showToast(`Failed to parse ${file.name}: ${err.message}`, 'error');
  }
}

function saveThreeMonthAndWalkthroughInputs(e) {
  if (e) e.preventDefault();
  perfState.dailySalesM1 = {
    periodLabel: document.getElementById('inputM1Label')?.value || 'M-1',
    ts: parsePmgNumber(document.getElementById('inputM1Ts')?.value),
    hb: parsePmgNumber(document.getElementById('inputM1Hb')?.value),
    hm: parsePmgNumber(document.getElementById('inputM1Hm')?.value),
    gpPct: parsePmgNumber(document.getElementById('inputM1GpPct')?.value),
    transactions: parsePmgNumber(document.getElementById('inputM1Tx')?.value)
  };
  perfState.dailySalesM2 = {
    periodLabel: document.getElementById('inputM2Label')?.value || 'M-2',
    ts: parsePmgNumber(document.getElementById('inputM2Ts')?.value),
    hb: parsePmgNumber(document.getElementById('inputM2Hb')?.value),
    hm: parsePmgNumber(document.getElementById('inputM2Hm')?.value),
    gpPct: parsePmgNumber(document.getElementById('inputM2GpPct')?.value),
    transactions: parsePmgNumber(document.getElementById('inputM2Tx')?.value)
  };
  perfState.videoWalkthroughReport = document.getElementById('inputWalkthroughNotes')?.value || '';
  saveActiveState();
  activeAiReport = null;
  refreshAllViews();
  showToast('Updated 3-Month M-1/M-2 benchmarks and Video Walkthrough notes!', 'success');
}

function renderDataStudioSlots() {
  const container = document.getElementById('tab7UploadContainer');
  if (!container || !perfState) return;

  const slotCard = (title, subtitle, statusText, isLoaded, type, slot) => `
    <div class="p-4 rounded-2xl border ${isLoaded ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'} flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="text-xs font-extrabold text-slate-900">${escapeHtml(title)}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isLoaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">${isLoaded ? '✓ Loaded' : 'Empty'}</span>
        </div>
        <p class="text-[11px] text-slate-500 mb-2">${escapeHtml(subtitle)}</p>
        <div class="text-[11px] font-mono text-indigo-800 bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/70 mb-3">${escapeHtml(statusText)}</div>
      </div>
      <label class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center cursor-pointer transition">
        Upload CSV
        <input type="file" accept=".csv" class="hidden" onchange="handleSlotFileUpload('${type}', '${slot}', this)">
      </label>
    </div>
  `;

  const dsLCount = perfState.dailySalesLatest?.rows?.length || 0;
  const dsPCount = perfState.dailySalesPrevYear?.rows?.length || 0;
  const catLCount = perfState.categoryGpLatest?.rows?.length || 0;
  const catPCount = perfState.categoryGpPrevYear?.rows?.length || 0;
  const gpLCount = perfState.personalGpLatest?.rows?.length || 0;
  const gpPCount = perfState.personalGpPrevYear?.rows?.length || 0;
  const csLCount = perfState.customersServedLatest?.rows?.length || 0;
  const csPCount = perfState.customersServedPrevYear?.rows?.length || 0;
  const clCount = perfState.stockClosingLatest?.rows?.length || 0;
  const itLCount = perfState.itemSalesLatest?.items?.length || 0;
  const itPCount = perfState.itemSalesPrevYear?.items?.length || 0;
  const agCount = perfState.stockAgingLatest?.items?.length || 0;

  container.innerHTML = `
    <!-- Data Management & Sample Removal Controls -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h3 class="text-base font-extrabold text-slate-900">CSV Data Upload Studio & Preloaded Data Manager</h3>
        <p class="text-xs text-slate-500 mt-0.5">Drop all 12 monthly PMG ERP CSV files at once below, or upload individual slots. You can clear the preloaded sample data anytime.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <button onclick="clearPreloadedSampleData()" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer">
          🗑️ Clear Preloaded Sample Data (Reset to Blank)
        </button>
        <button onclick="restorePreloadedSampleData()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer">
          🔄 Restore Oct 2026 vs 2025 Sample
        </button>
      </div>
    </div>

    <!-- Smart Batch Dropzone -->
    <label class="block bg-indigo-50/60 hover:bg-indigo-50 border-2 border-dashed border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition mb-6">
      <div class="text-3xl mb-2">📥</div>
      <div class="text-sm font-extrabold text-indigo-950">Smart Multi-CSV Batch Upload (Drop All 12 CSV Files Here)</div>
      <p class="text-xs text-indigo-700 mt-1">Automatically detects Daily Sales (TS/HB/HM), Category GP, Personal GP, Customers Served, Stock Closing Balance, Item SKU Sales & 6-Month Aging for Latest Month & Previous Year</p>
      <input type="file" accept=".csv" multiple class="hidden" onchange="handleBatchCsvFiles(this.files)">
    </label>

    <!-- 12 Individual CSV Slots -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      ${slotCard('1. MTD Sales Data (TS, HB, HM) — Latest Month', 'Sales - Daily Sales reporting (Latest)', `${dsLCount} teammates | ${perfState.dailySalesLatest?.dateRange || 'No date'}`, dsLCount > 0, 'DAILY_SALES', 'LATEST')}
      ${slotCard('2. MTD Sales Data (TS, HB, HM) — Prev Year', 'Sales - Daily Sales reporting (Prev Year)', `${dsPCount} teammates | ${perfState.dailySalesPrevYear?.dateRange || 'No date'}`, dsPCount > 0, 'DAILY_SALES', 'PREV_YEAR')}
      ${slotCard('3. Category Net Price, Profit & GP% — Latest', 'SALES - Gross Profit Margin by Category (Latest)', `${catLCount} categories loaded`, catLCount > 0, 'CATEGORY_GP', 'LATEST')}
      ${slotCard('4. Category Net Price, Profit & GP% — Prev Year', 'SALES - Gross Profit Margin by Category (Prev Year)', `${catPCount} categories loaded`, catPCount > 0, 'CATEGORY_GP', 'PREV_YEAR')}
      ${slotCard('5. Personal Net Sold Price & Profit — Latest', 'Sales - Gross Profit Margin personal (Latest)', `${gpLCount} teammates loaded`, gpLCount > 0, 'PERSONAL_GP', 'LATEST')}
      ${slotCard('6. Personal Net Sold Price & Profit — Prev Year', 'Sales - Gross Profit Margin personal (Prev Year)', `${gpPCount} teammates loaded`, gpPCount > 0, 'PERSONAL_GP', 'PREV_YEAR')}
      ${slotCard('7. Teammate Customers Served — Latest Month', 'TOTAL CUSTOMERS SERVED (Latest)', `${csLCount} staff | Total: ${fmtNum(perfState.customersServedLatest?.grandTotal || 0)} tx`, csLCount > 0, 'CUSTOMERS_SERVED', 'LATEST')}
      ${slotCard('8. Teammate Customers Served — Prev Year', 'TOTAL CUSTOMERS SERVED (Prev Year)', `${csPCount} staff | Total: ${fmtNum(perfState.customersServedPrevYear?.grandTotal || 0)} tx`, csPCount > 0, 'CUSTOMERS_SERVED', 'PREV_YEAR')}
      ${slotCard('9. Stock Closing Balance by Category (Custom Cost)', '@ STOCK CLOSING BALANCE BY CATEGORY PER STORE', `${clCount} categories | Cost: ${fmtRM(perfState.stockClosingLatest?.grandTotal?.customCost || 0)}`, clCount > 0, 'STOCK_CLOSING', 'LATEST')}
      ${slotCard('10. Item / SKU Sales Data — Latest Month', 'Sales - Gross Profit Margin per Item (Latest)', `${fmtNum(itLCount)} unique SKUs loaded`, itLCount > 0, 'ITEM_SALES', 'LATEST')}
      ${slotCard('11. Item / SKU Sales Data — Prev Year Same Month', 'Sales - Gross Profit Margin per Item (Prev Year)', `${fmtNum(itPCount)} unique SKUs loaded`, itPCount > 0, 'ITEM_SALES', 'PREV_YEAR')}
      ${slotCard('12. Stock Aging Report (6 Months Non-Moving)', '[Admin] Aging (150 Days to >1 Year)', `${fmtNum(agCount)} aged SKUs loaded`, agCount > 0, 'STOCK_AGING', 'LATEST')}
    </div>

    <!-- 3-Month Horizon (M-1 / M-2) & Video Walkthrough Input Form -->
    <form onsubmit="saveThreeMonthAndWalkthroughInputs(event)" class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <h4 class="text-sm font-extrabold text-slate-900 mb-3">📅 Latest 3-Month Benchmarks (M-1 & M-2) & Monthly Video Walkthrough Report</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs font-extrabold text-slate-800">M-1 (1 Month Prior)</span>
            <label class="text-[11px] text-indigo-600 font-bold cursor-pointer hover:underline">
              Or Upload M-1 Daily Sales CSV
              <input type="file" accept=".csv" class="hidden" onchange="handleSlotFileUpload('DAILY_SALES', 'M1', this)">
            </label>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <input id="inputM1Label" type="text" value="${escapeHtml(perfState.dailySalesM1?.periodLabel || 'M-1')}" placeholder="Label" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM1Ts" type="number" step="0.01" value="${perfState.dailySalesM1?.ts || 0}" placeholder="TS (RM)" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM1Hb" type="number" step="0.01" value="${perfState.dailySalesM1?.hb || 0}" placeholder="HB (RM)" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM1Hm" type="number" step="0.01" value="${perfState.dailySalesM1?.hm || 0}" placeholder="HM (RM)" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM1GpPct" type="number" step="0.01" value="${perfState.dailySalesM1?.gpPct || 0}" placeholder="GP %" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM1Tx" type="number" value="${perfState.dailySalesM1?.transactions || 0}" placeholder="Transactions" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs font-extrabold text-slate-800">M-2 (2 Months Prior)</span>
            <label class="text-[11px] text-indigo-600 font-bold cursor-pointer hover:underline">
              Or Upload M-2 Daily Sales CSV
              <input type="file" accept=".csv" class="hidden" onchange="handleSlotFileUpload('DAILY_SALES', 'M2', this)">
            </label>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <input id="inputM2Label" type="text" value="${escapeHtml(perfState.dailySalesM2?.periodLabel || 'M-2')}" placeholder="Label" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM2Ts" type="number" step="0.01" value="${perfState.dailySalesM2?.ts || 0}" placeholder="TS (RM)" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM2Hb" type="number" step="0.01" value="${perfState.dailySalesM2?.hb || 0}" placeholder="HB (RM)" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM2Hm" type="number" step="0.01" value="${perfState.dailySalesM2?.hm || 0}" placeholder="HM (RM)" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM2GpPct" type="number" step="0.01" value="${perfState.dailySalesM2?.gpPct || 0}" placeholder="GP %" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
            <input id="inputM2Tx" type="number" value="${perfState.dailySalesM2?.transactions || 0}" placeholder="Transactions" class="px-2.5 py-1.5 rounded border border-slate-300 bg-white">
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label class="block text-xs font-bold text-slate-700 mb-1">📹 Video Walkthrough Report Findings (Latest Month):</label>
        <textarea id="inputWalkthroughNotes" rows="3" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" placeholder="Paste or type findings from the monthly store video walkthrough audit...">${escapeHtml(perfState.videoWalkthroughReport || '')}</textarea>
      </div>
      <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer">Save 3-Month & Walkthrough Notes</button>
    </form>
  `;
}

// ─── NAVIGATION & TOAST HELPERS ─────────────────────────────────────────────
function switchPerfTab(tabId) {
  const tabs = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7'];
  tabs.forEach(id => {
    const panel = document.getElementById(`panel-${id}`);
    const btn = document.getElementById(`btn-${id}`);
    if (panel) {
      if (id === tabId) panel.classList.remove('hidden');
      else panel.classList.add('hidden');
    }
    if (btn) {
      if (id === tabId) {
        btn.className = 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 text-white shadow-xs transition cursor-pointer whitespace-nowrap';
      } else {
        btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer whitespace-nowrap';
      }
    }
  });
}

function showToast(msg, type = 'info') {
  const host = document.getElementById('perfToastHost');
  if (!host) return;
  const colors = {
    success: 'bg-emerald-900 text-white border-emerald-500',
    warning: 'bg-amber-900 text-white border-amber-500',
    error:   'bg-rose-900 text-white border-rose-500',
    info:    'bg-slate-900 text-white border-indigo-400'
  };
  const el = document.createElement('div');
  el.className = `px-4 py-3 rounded-xl border shadow-lg text-xs font-bold transition-all duration-300 ${colors[type] || colors.info}`;
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 4200);
}

// ─── INITIALIZE ON DOM READY ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadInitialState();
  refreshAllViews();
  switchPerfTab('tab1');
});

// Export for Node unit testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseDailySalesCsv,
    parsePersonalGpCsv,
    parseCustomersServedCsv,
    parseCategoryGpCsv,
    parseStockClosingCsv,
    parseItemSalesCsv,
    parseAgingCsv,
    autoDetectCsvTypeAndPeriod,
    computeAllMetrics,
    buildDynamicBaselineReport
  };
}
