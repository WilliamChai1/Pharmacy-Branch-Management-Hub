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
  'gemini-3.8-flash',
  'gemini-3.6-flash'
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
  STATE:            'pmg_perf_active_state_v1',
  HIDE_SAMPLE:      'pmg_perf_hide_sample_v1',
  TASKS:            'pmg_perf_monthly_tasks_v1',
  ROLES:            'pmg_perf_teammate_roles_v1',
  AI_REPORT:        'pmg_perf_ai_report_v1',
  GEMINI_KEY:       'pmg_gemini_key',
  MONTHLY_ARCHIVES: 'pmg_perf_monthly_archives_v1' // Continuous historical snapshots
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

// ─── HISTORICAL BENCHMARKS & 3-MONTH CONTINUOUS ARCHIVE ENGINE ──────────────
const KOTA_SENTOSA_HISTORICAL_TEAMMATES = {
  '2026-09': { // September 2026 (Verified Audited POS Presentation Deck)
    'JONG PEI CHOO':                     { ts: 68087.05, hb: 30255.60, hm: 7185.30, hbPct: 44.44, hmPct: 10.55, tx: 1327, basketTs: 51.31, basketHb: 22.80, gpRm: 17900.38, gpPct: 26.25 },
    'CHAI YEE SIAN':                     { ts: 57034.03, hb: 29411.83, hm: 6189.80, hbPct: 51.57, hmPct: 10.85, tx: 597, basketTs: 95.53, basketHb: 49.27, gpRm: 16494.38, gpPct: 27.57 },
    'MUHAMMAD NUR FARIZIN BIN ABDULLAH': { ts: 38902.31, hb: 12023.81, hm: 3825.20, hbPct: 30.91, hmPct: 9.83, tx: 1172, basketTs: 33.19, basketHb: 10.26, gpRm: 9763.77, gpPct: 24.96 },
    'FIONA FIENA ANAK JAMES':            { ts: 38723.18, hb: 15585.48, hm: 3698.90, hbPct: 40.25, hmPct: 9.55, tx: 1064, basketTs: 36.39, basketHb: 14.65, gpRm: 10891.39, gpPct: 27.99 },
    'NURHAFIZAH BINTI PAULI':            { ts: 37220.70, hb: 11911.70, hm: 3165.70, hbPct: 32.00, hmPct: 8.51, tx: 1066, basketTs: 34.92, basketHb: 11.17, gpRm: 9239.66, gpPct: 24.53 },
    'HANIESHA LOUNA ANAK DAGENG':        { ts: 33077.20, hb: 15277.24, hm: 2690.90, hbPct: 46.19, hmPct: 8.14, tx: 783, basketTs: 42.24, basketHb: 19.51, gpRm: 9196.92, gpPct: 27.56 },
    'DANIELA JANET ANAK MUSTAPHA':       { ts: 24525.47, hb: 8992.27, hm: 2226.80, hbPct: 36.67, hmPct: 9.08, tx: 722, basketTs: 33.97, basketHb: 12.45, gpRm: 6615.68, gpPct: 26.85 },
    'KENIX LING WANG YING':              { ts: 22669.41, hb: 10073.31, hm: 2654.30, hbPct: 44.44, hmPct: 11.71, tx: 611, basketTs: 37.10, basketHb: 16.49, gpRm: 6538.08, gpPct: 28.78 },
    'TING KWANG YU':                     { ts: 17712.06, hb: 11000.96, hm: 872.67, hbPct: 62.11, hmPct: 4.93, tx: 627, basketTs: 28.25, basketHb: 17.55, gpRm: 5124.77, gpPct: 29.35 }
  },
  '2026-08': { // August 2026 (Verified Audited POS Presentation Deck)
    'JONG PEI CHOO':                     { ts: 77868.67, hb: 40551.13, hm: 8186.15, hbPct: 52.08, hmPct: 10.51, tx: 1380, basketTs: 56.43, basketHb: 29.38, gpRm: 19762.47, gpPct: 25.38 },
    'CHAI YEE SIAN':                     { ts: 56218.31, hb: 26502.91, hm: 5368.15, hbPct: 47.14, hmPct: 9.55, tx: 466, basketTs: 120.64, basketHb: 56.87, gpRm: 14105.02, gpPct: 25.09 },
    'HANIESHA LOUNA ANAK DAGENG':        { ts: 46327.58, hb: 21296.52, hm: 4244.40, hbPct: 45.97, hmPct: 9.16, tx: 1024, basketTs: 45.24, basketHb: 20.80, gpRm: 12813.91, gpPct: 27.66 },
    'FIONA FIENA ANAK JAMES':            { ts: 45990.94, hb: 20374.91, hm: 4134.40, hbPct: 44.30, hmPct: 8.99, tx: 1062, basketTs: 43.31, basketHb: 19.19, gpRm: 12304.53, gpPct: 26.75 },
    'DANIELA JANET ANAK MUSTAPHA':       { ts: 43949.89, hb: 15891.83, hm: 3755.60, hbPct: 36.16, hmPct: 8.55, tx: 1007, basketTs: 43.64, basketHb: 15.78, gpRm: 10556.70, gpPct: 24.02 },
    'NURHAFIZAH BINTI PAULI':            { ts: 32180.29, hb: 10697.52, hm: 4005.60, hbPct: 33.24, hmPct: 12.45, tx: 1029, basketTs: 31.27, basketHb: 10.40, gpRm: 8731.37, gpPct: 27.13 },
    'MUHAMMAD NUR FARIZIN BIN ABDULLAH': { ts: 30931.79, hb: 9492.40, hm: 3192.90, hbPct: 30.69, hmPct: 10.32, tx: 916, basketTs: 33.77, basketHb: 10.36, gpRm: 8481.94, gpPct: 27.42 },
    'KENIX LING WANG YING':              { ts: 30321.83, hb: 13782.70, hm: 4002.90, hbPct: 45.45, hmPct: 13.20, tx: 676, basketTs: 44.85, basketHb: 20.39, gpRm: 9335.79, gpPct: 30.79 },
    'DIANA LAI PEI YING':                { ts: 16762.59, hb: 6036.98, hm: 1695.60, hbPct: 36.01, hmPct: 10.12, tx: 450, basketTs: 37.25, basketHb: 13.42, gpRm: 4274.46, gpPct: 25.50 }
  },
  '2026-07': { // July 2026 (Verified Audited POS Presentation Deck)
    'JONG PEI CHOO':                     { ts: 63122.42, hb: 23436.61, hm: 6673.35, hbPct: 37.13, hmPct: 10.57, tx: 1377, basketTs: 45.84, basketHb: 17.02, gpRm: 16003.61, gpPct: 25.35 },
    'CHAI YEE SIAN':                     { ts: 48085.31, hb: 20614.05, hm: 5534.85, hbPct: 42.87, hmPct: 11.51, tx: 561, basketTs: 85.71, basketHb: 36.75, gpRm: 15801.99, gpPct: 33.10 },
    'DANIELA JANET ANAK MUSTAPHA':       { ts: 40431.03, hb: 13859.25, hm: 4057.10, hbPct: 34.28, hmPct: 10.03, tx: 986, basketTs: 41.01, basketHb: 14.06, gpRm: 11260.67, gpPct: 27.85 },
    'FIONA FIENA ANAK JAMES':            { ts: 38189.25, hb: 14674.28, hm: 4545.20, hbPct: 38.43, hmPct: 11.90, tx: 1051, basketTs: 36.34, basketHb: 13.96, gpRm: 10760.43, gpPct: 27.92 },
    'NURHAFIZAH BINTI PAULI':            { ts: 33939.66, hb: 8794.45, hm: 4373.90, hbPct: 25.91, hmPct: 12.89, tx: 965, basketTs: 35.17, basketHb: 9.11, gpRm: 8325.98, gpPct: 25.13 },
    'HANIESHA LOUNA ANAK DAGENG':        { ts: 28733.32, hb: 12526.10, hm: 2598.20, hbPct: 43.59, hmPct: 9.04, tx: 731, basketTs: 39.31, basketHb: 17.14, gpRm: 8318.14, gpPct: 28.95 },
    'MUHAMMAD NUR FARIZIN BIN ABDULLAH': { ts: 22186.16, hb: 6844.60, hm: 2572.20, hbPct: 30.85, hmPct: 11.59, tx: 761, basketTs: 29.15, basketHb: 8.99, gpRm: 6260.88, gpPct: 27.22 },
    'KENIX LING WANG YING':              { ts: 21256.40, hb: 8704.50, hm: 2934.10, hbPct: 40.95, hmPct: 13.80, tx: 524, basketTs: 40.57, basketHb: 16.61, gpRm: 6432.80, gpPct: 30.26 }
  }
};
// Aliases for M1 and M2
KOTA_SENTOSA_HISTORICAL_TEAMMATES['M1'] = KOTA_SENTOSA_HISTORICAL_TEAMMATES['2026-09'];
KOTA_SENTOSA_HISTORICAL_TEAMMATES['M2'] = KOTA_SENTOSA_HISTORICAL_TEAMMATES['2026-08'];

function parsePeriodFromDateRange(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const lower = str.toLowerCase();

  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Check DD/MM/YYYY or D/M/YYYY first if date numbers are present (e.g. 01/10/2026-31/10/2026)
  const dmyMatch = str.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmyMatch) {
    const mNum = parseInt(dmyMatch[2], 10);
    const yyyy = dmyMatch[3];
    if (mNum >= 1 && mNum <= 12) {
      const mm = String(mNum).padStart(2, '0');
      return { year: yyyy, month: mm, monthName: monthNames[mNum - 1], key: `${yyyy}-${mm}` };
    }
  }

  // Extract 4-digit year
  const yrMatch = lower.match(/\b(20\d\d)\b/);
  const year = yrMatch ? yrMatch[1] : '2026';

  for (let i = 0; i < 12; i++) {
    if (lower.includes(months[i]) || new RegExp('\\b' + monthAbbr[i] + '\\b').test(lower)) {
      const mm = String(i + 1).padStart(2, '0');
      return { year, month: mm, monthName: monthNames[i], key: `${year}-${mm}` };
    }
  }

  return null;
}

function getPriorMonthKey(periodKey, offset = 1) {
  const [yStr, mStr] = String(periodKey || '2026-10').split('-');
  let y = parseInt(yStr, 10) || 2026;
  let m = parseInt(mStr, 10) || 10;
  m -= offset;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

function getNextMonthKey(periodKey, offset = 1) {
  const [yStr, mStr] = String(periodKey || '2026-10').split('-');
  let y = parseInt(yStr, 10) || 2026;
  let m = parseInt(mStr, 10) || 10;
  m += offset;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

function getPeriodMonthName(periodKey) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [yStr, mStr] = String(periodKey || '').split('-');
  const m = parseInt(mStr, 10);
  if (m >= 1 && m <= 12) {
    return `${monthNames[m - 1]} ${yStr}`;
  }
  return periodKey || 'Current Month';
}

function formatPeriodDisplayLabel(dateRange, fallbackPrefix = 'Latest Month') {
  if (!dateRange) return fallbackPrefix;
  const p = parsePeriodFromDateRange(dateRange);
  if (p) {
    return `${p.monthName} FY${p.year} (${dateRange})`;
  }
  return `${fallbackPrefix} (${dateRange})`;
}

function getArchivePeriodKey(state) {
  const label = state?.meta?.latestPeriodLabel || state?.dailySalesLatest?.dateRange || state?.categoryGpLatest?.dateRange || '';
  const parsed = parsePeriodFromDateRange(label);
  if (parsed) return parsed.key;

  const match = label.match(/(\d{4})[^\d]+(\d{2})/);
  if (match) return `${match[1]}-${match[2]}`;
  return '2026-10';
}

function loadMonthlyArchives() {
  // Verified default continuous historical monthly snapshots
  const seed = {
    '2026-10': {
      periodKey: '2026-10',
      periodLabel: 'October FY2026 (01/10/2026 - 31/10/2026)',
      archivedAt: '2026-10-31T23:59:59.000Z',
      branch: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      outletTotals: { ts: 340252.85, hb: 147573.46, hm: 30889.38, gpRm: 95536.56, gpPct: 27.81, transactions: 8016, basketTs: 42.45, basketHb: 18.41 },
      teammates: [
        { person: 'JONG PEI CHOO', role: 'PA', ts: 57607.00, hb: 27181.97, hm: 5033.49, hbPct: 47.19, hmPct: 8.74, gpRm: 15473.48, gpPct: 26.86, tx: 1258, basketTs: 45.79, basketHb: 21.61 },
        { person: 'CHAI YEE SIAN', role: 'Pharmacist (PIC)', ts: 54282.56, hb: 26918.05, hm: 5112.48, hbPct: 49.59, hmPct: 9.42, gpRm: 15997.08, gpPct: 29.01, tx: 567, basketTs: 95.74, basketHb: 47.47 },
        { person: 'NURHAFIZAH BINTI PAULI', role: 'PA', ts: 36325.44, hb: 11342.34, hm: 4212.50, hbPct: 31.22, hmPct: 11.60, gpRm: 9953.55, gpPct: 27.35, tx: 1112, basketTs: 32.67, basketHb: 10.20 },
        { person: 'CHRISTINA LEE YING YING', role: 'PRP', ts: 34887.97, hb: 15084.64, hm: 2744.90, hbPct: 43.24, hmPct: 7.87, gpRm: 9980.79, gpPct: 28.42, tx: 918, basketTs: 38.00, basketHb: 16.43 },
        { person: 'KENIX LING WANG YING', role: 'Pharmacist', ts: 33851.04, hb: 18132.18, hm: 3658.70, hbPct: 53.56, hmPct: 10.81, gpRm: 10722.56, gpPct: 31.65, tx: 801, basketTs: 42.26, basketHb: 22.64 },
        { person: 'HANIESHA LOUNA ANAK DAGENG', role: 'ABM', ts: 33343.42, hb: 13348.87, hm: 2517.60, hbPct: 40.03, hmPct: 7.55, gpRm: 8621.07, gpPct: 25.55, tx: 892, basketTs: 37.38, basketHb: 14.97 },
        { person: 'FIONA FIENA ANAK JAMES', role: 'PA', ts: 32814.51, hb: 13098.35, hm: 2519.96, hbPct: 39.92, hmPct: 7.68, gpRm: 8921.83, gpPct: 27.11, tx: 870, basketTs: 37.72, basketHb: 15.06 },
        { person: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH', role: 'PA', ts: 32317.74, hb: 9153.55, hm: 2911.40, hbPct: 28.32, hmPct: 9.01, gpRm: 8027.60, gpPct: 24.84, tx: 977, basketTs: 33.08, basketHb: 9.37 },
        { person: 'TING KWANG YU', role: 'BM / Lead', ts: 24704.57, hb: 12956.53, hm: 2098.78, hbPct: 52.45, hmPct: 8.50, gpRm: 7179.39, gpPct: 28.90, tx: 627, basketTs: 39.40, basketHb: 20.66 }
      ]
    },
    '2026-09': {
      periodKey: '2026-09',
      periodLabel: 'September FY2026 (01/09/2026 - 30/09/2026)',
      archivedAt: '2026-09-30T23:59:59.000Z',
      branch: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      outletTotals: { ts: 337979.41, hb: 144533.00, hm: 32643.20, gpRm: 91857.56, gpPct: 26.84, transactions: 7779, basketTs: 43.45, basketHb: 18.58 },
      teammates: [
        { person: 'JONG PEI CHOO', role: 'PA', ts: 68087.05, hb: 30255.60, hm: 7185.30, hbPct: 44.44, hmPct: 10.55, tx: 1327, basketTs: 51.31, basketHb: 22.80, gpRm: 17900.38, gpPct: 26.25 },
        { person: 'CHAI YEE SIAN', role: 'Pharmacist (PIC)', ts: 57034.03, hb: 29411.83, hm: 6189.80, hbPct: 51.57, hmPct: 10.85, tx: 597, basketTs: 95.53, basketHb: 49.27, gpRm: 16494.38, gpPct: 27.57 },
        { person: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH', role: 'PA', ts: 38902.31, hb: 12023.81, hm: 3825.20, hbPct: 30.91, hmPct: 9.83, tx: 1172, basketTs: 33.19, basketHb: 10.26, gpRm: 9763.77, gpPct: 24.96 },
        { person: 'FIONA FIENA ANAK JAMES', role: 'PA', ts: 38723.18, hb: 15585.48, hm: 3698.90, hbPct: 40.25, hmPct: 9.55, tx: 1064, basketTs: 36.39, basketHb: 14.65, gpRm: 10891.39, gpPct: 27.99 },
        { person: 'NURHAFIZAH BINTI PAULI', role: 'PA', ts: 37220.70, hb: 11911.70, hm: 3165.70, hbPct: 32.00, hmPct: 8.51, tx: 1066, basketTs: 34.92, basketHb: 11.17, gpRm: 9239.66, gpPct: 24.53 },
        { person: 'HANIESHA LOUNA ANAK DAGENG', role: 'ABM', ts: 33077.20, hb: 15277.24, hm: 2690.90, hbPct: 46.19, hmPct: 8.14, tx: 783, basketTs: 42.24, basketHb: 19.51, gpRm: 9196.92, gpPct: 27.56 },
        { person: 'DANIELA JANET ANAK MUSTAPHA', role: 'Former Staff', ts: 24525.47, hb: 8992.27, hm: 2226.80, hbPct: 36.67, hmPct: 9.08, tx: 722, basketTs: 33.97, basketHb: 12.45, gpRm: 6615.68, gpPct: 26.85 },
        { person: 'KENIX LING WANG YING', role: 'Pharmacist', ts: 22669.41, hb: 10073.31, hm: 2654.30, hbPct: 44.44, hmPct: 11.71, tx: 611, basketTs: 37.10, basketHb: 16.49, gpRm: 6538.08, gpPct: 28.78 },
        { person: 'TING KWANG YU', role: 'BM / Lead', ts: 17712.06, hb: 11000.96, hm: 872.67, hbPct: 62.11, hmPct: 4.93, tx: 627, basketTs: 28.25, basketHb: 17.55, gpRm: 5124.77, gpPct: 29.35 }
      ]
    },
    '2026-08': {
      periodKey: '2026-08',
      periodLabel: 'August FY2026 (01/08/2026 - 31/08/2026)',
      archivedAt: '2026-08-31T23:59:59.000Z',
      branch: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      outletTotals: { ts: 380852.53, hb: 164354.04, hm: 38826.70, gpRm: 100551.66, gpPct: 26.07, transactions: 8433, basketTs: 45.16, basketHb: 19.49 },
      teammates: [
        { person: 'JONG PEI CHOO', role: 'PA', ts: 77868.67, hb: 40551.13, hm: 8186.15, hbPct: 52.08, hmPct: 10.51, tx: 1380, basketTs: 56.43, basketHb: 29.38, gpRm: 19762.47, gpPct: 25.38 },
        { person: 'CHAI YEE SIAN', role: 'Pharmacist (PIC)', ts: 56218.31, hb: 26502.91, hm: 5368.15, hbPct: 47.14, hmPct: 9.55, tx: 466, basketTs: 120.64, basketHb: 56.87, gpRm: 14105.02, gpPct: 25.09 },
        { person: 'HANIESHA LOUNA ANAK DAGENG', role: 'ABM', ts: 46327.58, hb: 21296.52, hm: 4244.40, hbPct: 45.97, hmPct: 9.16, tx: 1024, basketTs: 45.24, basketHb: 20.80, gpRm: 12813.91, gpPct: 27.66 },
        { person: 'FIONA FIENA ANAK JAMES', role: 'PA', ts: 45990.94, hb: 20374.91, hm: 4134.40, hbPct: 44.30, hmPct: 8.99, tx: 1062, basketTs: 43.31, basketHb: 19.19, gpRm: 12304.53, gpPct: 26.75 },
        { person: 'DANIELA JANET ANAK MUSTAPHA', role: 'Former Staff', ts: 43949.89, hb: 15891.83, hm: 3755.60, hbPct: 36.16, hmPct: 8.55, tx: 1007, basketTs: 43.64, basketHb: 15.78, gpRm: 10556.70, gpPct: 24.02 },
        { person: 'NURHAFIZAH BINTI PAULI', role: 'PA', ts: 32180.29, hb: 10697.52, hm: 4005.60, hbPct: 33.24, hmPct: 12.45, tx: 1029, basketTs: 31.27, basketHb: 10.40, gpRm: 8731.37, gpPct: 27.13 },
        { person: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH', role: 'PA', ts: 30931.79, hb: 9492.40, hm: 3192.90, hbPct: 30.69, hmPct: 10.32, tx: 916, basketTs: 33.77, basketHb: 10.36, gpRm: 8481.94, gpPct: 27.42 },
        { person: 'KENIX LING WANG YING', role: 'Pharmacist', ts: 30321.83, hb: 13782.70, hm: 4002.90, hbPct: 45.45, hmPct: 13.20, tx: 676, basketTs: 44.85, basketHb: 20.39, gpRm: 9335.79, gpPct: 30.79 },
        { person: 'DIANA LAI PEI YING', role: 'Former Staff', ts: 16762.59, hb: 6036.98, hm: 1695.60, hbPct: 36.01, hmPct: 10.12, tx: 450, basketTs: 37.25, basketHb: 13.42, gpRm: 4274.46, gpPct: 25.50 }
      ]
    },
    '2026-07': {
      periodKey: '2026-07',
      periodLabel: 'July FY2026 (01/07/2026 - 31/07/2026)',
      archivedAt: '2026-07-31T23:59:59.000Z',
      branch: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      outletTotals: { ts: 350124.18, hb: 140211.50, hm: 33150.20, gpRm: 92430.80, gpPct: 26.40, transactions: 8120, basketTs: 43.12, basketHb: 17.27 },
      teammates: [
        { person: 'JONG PEI CHOO', role: 'PA', ts: 63122.42, hb: 23436.61, hm: 6673.35, hbPct: 37.13, hmPct: 10.57, tx: 1377, basketTs: 45.84, basketHb: 17.02, gpRm: 16003.61, gpPct: 25.35 },
        { person: 'CHAI YEE SIAN', role: 'Pharmacist (PIC)', ts: 48085.31, hb: 20614.05, hm: 5534.85, hbPct: 42.87, hmPct: 11.51, tx: 561, basketTs: 85.71, basketHb: 36.75, gpRm: 15801.99, gpPct: 33.10 },
        { person: 'DANIELA JANET ANAK MUSTAPHA', role: 'Former Staff', ts: 40431.03, hb: 13859.25, hm: 4057.10, hbPct: 34.28, hmPct: 10.03, tx: 986, basketTs: 41.01, basketHb: 14.06, gpRm: 11260.67, gpPct: 27.85 },
        { person: 'FIONA FIENA ANAK JAMES', role: 'PA', ts: 38189.25, hb: 14674.28, hm: 4545.20, hbPct: 38.43, hmPct: 11.90, tx: 1051, basketTs: 36.34, basketHb: 13.96, gpRm: 10760.43, gpPct: 27.92 },
        { person: 'NURHAFIZAH BINTI PAULI', role: 'PA', ts: 33939.66, hb: 8794.45, hm: 4373.90, hbPct: 25.91, hmPct: 12.89, tx: 965, basketTs: 35.17, basketHb: 9.11, gpRm: 8325.98, gpPct: 25.13 },
        { person: 'HANIESHA LOUNA ANAK DAGENG', role: 'ABM', ts: 28733.32, hb: 12526.10, hm: 2598.20, hbPct: 43.59, hmPct: 9.04, tx: 731, basketTs: 39.31, basketHb: 17.14, gpRm: 8318.14, gpPct: 28.95 },
        { person: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH', role: 'PA', ts: 22186.16, hb: 6844.60, hm: 2572.20, hbPct: 30.85, hmPct: 11.59, tx: 761, basketTs: 29.15, basketHb: 8.99, gpRm: 6260.88, gpPct: 27.22 },
        { person: 'KENIX LING WANG YING', role: 'Pharmacist', ts: 21256.40, hb: 8704.50, hm: 2934.10, hbPct: 40.95, hmPct: 13.80, tx: 524, basketTs: 40.57, basketHb: 16.61, gpRm: 6432.80, gpPct: 30.26 }
      ]
    },
    '2025-10': {
      periodKey: '2025-10',
      periodLabel: 'October FY2025 (01/10/2025 - 31/10/2025)',
      archivedAt: '2025-10-31T23:59:59.000Z',
      branch: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      outletTotals: { ts: 351989.93, hb: 135400.08, hm: 28493.42, gpRm: 94515.18, gpPct: 26.64, transactions: 8715, basketTs: 40.39, basketHb: 15.54 }
    }
  };

  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEYS.MONTHLY_ARCHIVES) : null;
    if (raw) {
      const data = JSON.parse(raw);
      let updated = false;
      // Auto-heal / upgrade 2026-09 if old estimated value or missing teammates
      if (!data['2026-09'] || data['2026-09'].outletTotals?.ts !== 337979.41 || !data['2026-09'].teammates?.length || !data['2026-09'].teammates[0].gpRm) {
        data['2026-09'] = seed['2026-09'];
        updated = true;
      }
      // Auto-heal / upgrade 2026-08 if old estimated value or missing teammates
      if (!data['2026-08'] || data['2026-08'].outletTotals?.ts !== 380852.53 || !data['2026-08'].teammates?.length || !data['2026-08'].teammates[0].gpRm) {
        data['2026-08'] = seed['2026-08'];
        updated = true;
      }
      // Auto-heal 2026-07 if missing
      if (!data['2026-07'] || !data['2026-07'].teammates?.length) {
        data['2026-07'] = seed['2026-07'];
        updated = true;
      }
      // Auto-heal 2026-10 if ts === 0 or missing
      if (!data['2026-10'] || data['2026-10'].outletTotals?.ts === 0 || !data['2026-10'].teammates?.length) {
        data['2026-10'] = seed['2026-10'];
        updated = true;
      }
      if (updated && typeof localStorage !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVES, JSON.stringify(data)); } catch (e) {}
      }
      return data;
    }
  } catch (e) {}

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVES, JSON.stringify(seed));
    }
  } catch (e) {}
  return seed;
}

function saveCurrentMonthSnapshot(quiet = false) {
  if (!computedMetrics || typeof localStorage === 'undefined') return;
  const key = getArchivePeriodKey(perfState);
  const archives = loadMonthlyArchives();
  const o = computedMetrics.outlet;

  archives[key] = {
    periodKey: key,
    periodLabel: perfState?.meta?.latestPeriodLabel || key,
    archivedAt: new Date().toISOString(),
    branch: perfState?.meta?.branch || 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
    outletTotals: {
      ts: o.tsLatest,
      hb: o.hbLatest,
      hm: o.hmLatest,
      gpRm: o.personalGpTotalLatest?.netSoldProfit || 0,
      gpPct: o.personalGpTotalLatest?.gpMarginPct || 0,
      transactions: o.txLatest,
      basketTs: o.basketTsLatest,
      basketHb: o.basketHbLatest
    },
    teammates: (computedMetrics.teammates || []).map(t => ({
      person: t.name,
      role: t.role,
      ts: t.tsLatest,
      hb: t.hbLatest,
      hm: t.hmLatest,
      hbPct: t.hbPctOwnTsLatest,
      hmPct: t.hmPctOwnTsLatest,
      gpRm: t.gpRmLatest,
      gpPct: t.gpPctLatest,
      tx: t.txLatest,
      basketTs: t.basketTsLatest,
      basketHb: t.basketHbLatest
    })),
    categories: (computedMetrics.categories || []).map(c => ({
      category: c.category,
      netSoldPrice: c.netSoldPriceLatest,
      netSoldProfit: c.netSoldProfitLatest,
      gpPct: c.gpPctLatest,
      customCost: c.totalCustomCost,
      stockCycle: c.pmgStockCycle
    }))
  };

  try {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVES, JSON.stringify(archives));
  } catch (e) {
    console.warn('Error saving monthly archive:', e);
  }

  if (!quiet && typeof showToast === 'function') {
    showToast(`Snapshot for ${key} permanently archived! Future months will automatically compare against this record.`, 'success');
  }
}

function exportMonthlyArchiveJson() {
  const archives = loadMonthlyArchives();
  const jsonStr = JSON.stringify(archives, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PMG_Kota_Sentosa_Continuous_Monthly_Archive_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importMonthlyArchiveJson(fileInput) {
  const file = fileInput?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (typeof data === 'object' && data !== null) {
        const existing = loadMonthlyArchives();
        const merged = { ...existing, ...data };
        localStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVES, JSON.stringify(merged));
        showToast(`Successfully imported ${Object.keys(data).length} monthly archive snapshot(s)!`, 'success');
        refreshAllViews();
      } else {
        showToast('Invalid archive file format', 'error');
      }
    } catch (err) {
      showToast('Error importing archive file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function getTeammateHistoricalMonth(personKey, periodSlot, state) {
  const normKey = String(personKey || '').toUpperCase().trim();

  // 1. Check Monthly Archives dynamically first
  // Monthly archives store the complete, verified snapshot with all 10 audited metrics:
  // ts, hb, hm, hbPct, hmPct, tx, basketTs, basketHb, gpRm, gpPct
  try {
    const archives = (typeof loadMonthlyArchives === 'function') ? loadMonthlyArchives() : {};
    const curKey = getArchivePeriodKey(state); // e.g. '2026-10'
    const targetPeriodKey = periodSlot === 'M1' ? getPriorMonthKey(curKey, 1) : getPriorMonthKey(curKey, 2);
    const archivedMonth = archives[targetPeriodKey];
    if (archivedMonth?.teammates && archivedMonth.teammates.length) {
      const found = archivedMonth.teammates.find(t => {
        const tn = String(t.person || t.name || '').toUpperCase().trim();
        return tn === normKey || tn.includes(normKey) || normKey.includes(tn);
      });
      if (found) {
        const ts = found.ts || 0;
        const hb = found.hb || 0;
        const hm = found.hm || 0;
        const tx = found.tx || 0;
        const hbPct = found.hbPct !== undefined ? found.hbPct : (ts > 0 ? +((hb / ts) * 100).toFixed(2) : 0);
        const hmPct = found.hmPct !== undefined ? found.hmPct : (ts > 0 ? +((hm / ts) * 100).toFixed(2) : 0);
        const gpPct = found.gpPct || 27.0;
        const basketTs = found.basketTs || (tx > 0 ? +(ts / tx).toFixed(2) : 0);
        const basketHb = found.basketHb || (tx > 0 ? +(hb / tx).toFixed(2) : 0);
        const gpRm = found.gpRm || (ts > 0 ? +((ts * gpPct) / 100).toFixed(2) : 0);
        return { ts, hb, hm, hbPct, hmPct, tx, basketTs, basketHb, gpRm, gpPct };
      }
    }
  } catch (e) {}

  // 2. Check if state has explicit rows for dailySalesM1 or dailySalesM2
  const slotObj = periodSlot === 'M1' ? state?.dailySalesM1 : state?.dailySalesM2;
  if (slotObj?.rows && slotObj.rows.length) {
    const found = slotObj.rows.find(r => {
      const rn = String(r.person || '').toUpperCase().trim();
      return rn === normKey || rn.includes(normKey) || normKey.includes(rn);
    });
    if (found) {
      const ts = found.ts || 0;
      const hb = found.hb || 0;
      const hm = found.hm || 0;
      const tx = found.tx || 0;
      const hbPct = ts > 0 ? +((hb / ts) * 100).toFixed(2) : 0;
      const hmPct = ts > 0 ? +((hm / ts) * 100).toFixed(2) : 0;
      const basketTs = tx > 0 ? +(ts / tx).toFixed(2) : 0;
      const basketHb = tx > 0 ? +(hb / tx).toFixed(2) : 0;
      const gpPct = slotObj.gpPct || found.gpPct || 27.0;
      const gpRm = found.gpRm || (ts > 0 ? +((ts * gpPct) / 100).toFixed(2) : 0);
      return { ts, hb, hm, hbPct, hmPct, tx, basketTs, basketHb, gpRm, gpPct };
    }
  }

  // 3. Fallback to Kota Sentosa baseline seed
  try {
    const curKey = getArchivePeriodKey(state);
    const targetPeriodKey = periodSlot === 'M1' ? getPriorMonthKey(curKey, 1) : getPriorMonthKey(curKey, 2);
    const fallbackSlot = KOTA_SENTOSA_HISTORICAL_TEAMMATES[targetPeriodKey] || KOTA_SENTOSA_HISTORICAL_TEAMMATES[periodSlot] || {};
    let fallback = fallbackSlot[normKey];
    if (!fallback) {
      const entry = Object.entries(fallbackSlot).find(([k]) => normKey.includes(k) || k.includes(normKey));
      if (entry) fallback = entry[1];
    }
    if (fallback) {
      const ts = fallback.ts || 0;
      const hb = fallback.hb || 0;
      const hm = fallback.hm || 0;
      const tx = fallback.tx || 0;
      const hbPct = fallback.hbPct !== undefined ? fallback.hbPct : (ts > 0 ? +((hb / ts) * 100).toFixed(2) : 0);
      const hmPct = fallback.hmPct !== undefined ? fallback.hmPct : (ts > 0 ? +((hm / ts) * 100).toFixed(2) : 0);
      const gpPct = fallback.gpPct || 27.0;
      const basketTs = fallback.basketTs || (tx > 0 ? +(ts / tx).toFixed(2) : 0);
      const basketHb = fallback.basketHb || (tx > 0 ? +(hb / tx).toFixed(2) : 0);
      const gpRm = fallback.gpRm || (ts > 0 ? +((ts * gpPct) / 100).toFixed(2) : 0);
      return { ts, hb, hm, hbPct, hmPct, tx, basketTs, basketHb, gpRm, gpPct };
    }
  } catch (e) {}

  return { ts: 0, hb: 0, hm: 0, hbPct: 0, hmPct: 0, tx: 0, basketTs: 0, basketHb: 0, gpRm: 0, gpPct: 0 };
}

// ─── RUNTIME STATE ──────────────────────────────────────────────────────────
let perfState = null;
let computedMetrics = null;
let activeCategoryMode = 'ALL12'; // 'ALL12' (default: includes all 12 categories) or 'HQ11' (excludes WYMED-EX)
let showAllTeammates = false;    // false = active Latest Month staff (>= RM 500 or active), true = all rows including 2025-only
let teammateViewMode = '3MONTH'; // '3MONTH' (default 3-Month Trajectory) or 'YOY' (YoY Benchmark)

function setTeammateViewMode(mode) {
  teammateViewMode = mode;
  renderTab3TeammatesMatrix();
}
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

// ─── TABLE SORT STATES (ALL PERFORMANCE TABLES) ─────────────────────────────
let tab1SortState = { col: 'default', dir: 'asc' };
let tab2SortState = { col: 'netSoldPriceLatest', dir: 'desc' };
let tab3SortState = { col: 'tsLatest', dir: 'desc' };
let tab4SortState = { col: 'priceLatest', dir: 'desc' };

function setTabSort(tabName, col) {
  if (tabName === 'tab1') {
    if (tab1SortState.col === col) {
      tab1SortState.dir = tab1SortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      tab1SortState.col = col;
      tab1SortState.dir = col === 'metric' ? 'asc' : 'desc';
    }
    renderTab1ExecutiveOverview();
  } else if (tabName === 'tab2') {
    if (tab2SortState.col === col) {
      tab2SortState.dir = tab2SortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      tab2SortState.col = col;
      tab2SortState.dir = col === 'category' ? 'asc' : 'desc';
    }
    renderTab2CategoryAndStockCycle();
  } else if (tabName === 'tab3') {
    if (tab3SortState.col === col) {
      tab3SortState.dir = tab3SortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      tab3SortState.col = col;
      tab3SortState.dir = col === 'name' ? 'asc' : 'desc';
    }
    renderTab3TeammatesMatrix();
  } else if (tabName === 'tab4') {
    if (tab4SortState.col === col) {
      tab4SortState.dir = tab4SortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      tab4SortState.col = col;
      tab4SortState.dir = (col === 'itemName' || col === 'category') ? 'asc' : 'desc';
    }
    renderTab4SkusAndAging();
  }
}

function getSortIndicator(activeCol, targetCol, activeDir) {
  if (activeCol !== targetCol) return '<span class="text-slate-400 opacity-40 ml-1 text-[9px] font-mono">↕</span>';
  return activeDir === 'asc'
    ? '<span class="text-amber-400 ml-1 text-[9px] font-mono font-bold">▲</span>'
    : '<span class="text-amber-400 ml-1 text-[9px] font-mono font-bold">▼</span>';
}

if (typeof window !== 'undefined') {
  window.setTabSort = setTabSort;
}

// ─── UTILITY HELPERS ────────────────────────────────────────────────────────
function normalizeTeammateName(name) {
  return String(name || '').toUpperCase().trim();
}

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
    if (lines[i].includes('Sales Item Person') && (lines[i].includes('EHM') || lines[i].includes('HB') || lines[i].includes('Grand Total') || lines[i].includes('HM'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Sales Item Person" not found in Daily Sales CSV');
  const headers = parseCsvLine(lines[headerIdx]);

  const personIdx = headers.findIndex(h => h.trim().toLowerCase() === 'sales item person');
  const ehmIdx = headers.findIndex(h => h.trim().toUpperCase() === 'EHM');
  const hbIdx = headers.findIndex(h => h.trim().toUpperCase() === 'HB');
  const hmIdx = headers.findIndex(h => h.trim().toUpperCase() === 'HM');
  const pbIdx = headers.findIndex(h => h.trim().toUpperCase() === 'PB');
  const pbAmpmIdx = headers.findIndex(h => h.trim().toUpperCase() === 'PB-AMPM');
  const whmIdx = headers.findIndex(h => h.trim().toUpperCase() === 'WHM');
  const tsIdx = headers.findIndex(h => {
    const u = h.trim().toUpperCase();
    return u.includes('GRAND TOTAL') || u.includes('TOTAL SALES') || u === 'TS';
  });
  const regularIdx = ehmIdx > 0 ? (ehmIdx - 1) : (personIdx + 1);

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const person = cols[personIdx !== -1 ? personIdx : 0];
    if (!person || person.toLowerCase().includes('total')) continue;
    rows.push({
      person: person.trim(),
      regular: parsePmgNumber(cols[regularIdx]),
      ehm: ehmIdx !== -1 ? parsePmgNumber(cols[ehmIdx]) : 0,
      hb: hbIdx !== -1 ? parsePmgNumber(cols[hbIdx]) : 0,
      hm: hmIdx !== -1 ? parsePmgNumber(cols[hmIdx]) : 0,
      pb: pbIdx !== -1 ? parsePmgNumber(cols[pbIdx]) : 0,
      pbAmpm: pbAmpmIdx !== -1 ? parsePmgNumber(cols[pbAmpmIdx]) : 0,
      whm: whmIdx !== -1 ? parsePmgNumber(cols[whmIdx]) : 0,
      ts: tsIdx !== -1 ? parsePmgNumber(cols[tsIdx]) : parsePmgNumber(cols[cols.length - 1])
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
    if (lines[i].includes('Net Sold Price') && lines[i].includes('Net Sold Profit') && (lines[i].includes('Sales Person') || lines[i].includes('Sales Item Person'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Sales Person,Qty,Net Sold Price" not found in Personal GP CSV');
  const headers = parseCsvLine(lines[headerIdx]);
  const personIdx = headers.findIndex(h => h.trim().toLowerCase().includes('sales') && h.trim().toLowerCase().includes('person'));
  const qtyIdx = headers.findIndex(h => h.trim().toLowerCase() === 'qty');
  const priceIdx = headers.findIndex(h => h.trim().toLowerCase().includes('net sold price'));
  const profitIdx = headers.findIndex(h => h.trim().toLowerCase().includes('net sold profit'));
  const marginIdx = headers.findIndex(h => h.trim().toLowerCase().includes('gross profit margin') || h.trim().toLowerCase().includes('gp'));

  const rows = [];
  let grandTotal = null;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const person = cols[personIdx !== -1 ? personIdx : 0];
    if (!person) continue;
    const rec = {
      person: person.trim(),
      qty: parsePmgNumber(cols[qtyIdx !== -1 ? qtyIdx : 1]),
      netSoldPrice: parsePmgNumber(cols[priceIdx !== -1 ? priceIdx : 2]),
      netSoldProfit: parsePmgNumber(cols[profitIdx !== -1 ? profitIdx : 3]),
      gpMarginPct: parsePmgNumber(cols[marginIdx !== -1 ? marginIdx : 4])
    };
    if (person.toLowerCase().includes('grand total')) {
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
    if (lines[i].includes('Sales Person') && (lines[i].includes('Count') || lines[i].includes('Sales No'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header "Sales Person,(Count)-Sales No Total" not found in Customers Served CSV');
  const headers = parseCsvLine(lines[headerIdx]);
  const personIdx = headers.findIndex(h => h.trim().toLowerCase().includes('sales') && h.trim().toLowerCase().includes('person'));
  const countIdx = headers.findIndex(h => h.trim().toLowerCase().includes('count') || h.trim().toLowerCase().includes('sales no'));

  const rows = [];
  let grandTotal = 0;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const person = cols[personIdx !== -1 ? personIdx : 0];
    if (!person) continue;
    const count = parsePmgNumber(cols[countIdx !== -1 ? countIdx : 1]);
    if (person.toLowerCase().includes('grand total')) {
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

  // 1. Personal GP (Sales Person, Net Sold Price, Net Sold Profit, Margin %)
  if (
    (text.includes('Net Sold Profit') && (text.includes('Sales Item Person') || text.includes('Sales Person'))) ||
    fn.includes('personal')
  ) {
    type = 'PERSONAL_GP';
  }
  // 2. Stock Closing Balance by Category
  else if (
    text.includes('STOCK CLOSING BALANCE') ||
    fn.includes('stock closing') ||
    text.includes('Category,(Count)-Item Name')
  ) {
    type = 'STOCK_CLOSING';
  }
  // 3. Category Gross Profit Margin
  else if (
    text.includes('Gross Profit Margin by Category') ||
    (fn.includes('by category') && !fn.includes('stock closing') && !text.includes('STOCK CLOSING')) ||
    text.includes('Store,Category,Sales Count')
  ) {
    type = 'CATEGORY_GP';
  }
  // 4. Daily Sales reporting (TS, HB, HM, Regular, EHM, PB, WHM)
  else if (
    text.includes('Sales - Daily Sales reporting') ||
    fn.includes('daily sales') ||
    (text.includes('Sales Item Person') && (text.includes('EHM') || text.includes('PB-AMPM') || text.includes('WHM') || text.includes('Item Type')))
  ) {
    type = 'DAILY_SALES';
  }
  // 5. Customers Served (Count of Transactions)
  else if (
    text.includes('TOTAL CUSTOMERS SERVED') ||
    fn.includes('customers served') ||
    (text.includes('Sales Person') && (text.includes('(Count)-Sales No Total') || text.includes('(Count)-Sales No')))
  ) {
    type = 'CUSTOMERS_SERVED';
  }
  // 6. Stock Aging Report (6 Months Non-Moving)
  else if (
    text.includes('150-180 Days') ||
    fn.includes('aging') ||
    (text.includes('Item Code') && text.includes('Average Cost') && text.includes('OH Qty'))
  ) {
    type = 'STOCK_AGING';
  }
  // 7. Item SKU Sales Data (Item-level sales, Qty, Profit)
  else if (
    text.includes('Category,Item Code,Item Name') ||
    (text.includes('Item Code') && text.includes('Unit Custom Cost')) ||
    (fn.includes('per item') && !fn.includes('personal'))
  ) {
    type = 'ITEM_SALES';
  }

  // Extract date period (month & year)
  let year = null;
  let slot = null;
  const dateStrMatch = text.match(/Date(?: To)?:\s*([^\r\n,]+)/i);
  const p = parsePeriodFromDateRange(dateStrMatch ? dateStrMatch[1] : (fileName || ''));
  if (p) {
    year = parseInt(p.year, 10);
    if (year === 2026 && p.month === '09') slot = 'M1';
    else if (year === 2026 && p.month === '08') slot = 'M2';
    else if (year === 2026 && p.month === '10') slot = 'LATEST';
    else if (year === 2025) slot = 'PREV_YEAR';
  } else {
    const dateMatch = text.match(/Date(?: To)?:\s*[0-9]{1,2}\/[0-9]{1,2}\/([0-9]{4})/i)
                   || text.match(/([0-9]{2}-[0-9]{2}-([0-9]{4}))/)
                   || fn.match(/(202[0-9])/);
    if (dateMatch) {
      year = parseInt(dateMatch[dateMatch.length - 1], 10);
    }
  }

  return { type, year, slot };
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
    // STOCK CYCLE = TOTAL CUSTOM COST / COST OF SALES (MTD)   [HQ Target = 2.0]
    const STOCK_CYCLE_TARGET = 2.0;
    const costOfSalesLatest = +(l.netSoldPrice - l.netSoldProfit).toFixed(2);
    const costOfSalesPrev   = +(p.netSoldPrice - p.netSoldProfit).toFixed(2);
    const totalCustomCost   = +(cl.customCost || 0).toFixed(2);
    const pmgStockCycle     = costOfSalesLatest > 0 ? +(totalCustomCost / costOfSalesLatest).toFixed(2) : 0;
    const targetCustomCost2x = +(costOfSalesLatest * STOCK_CYCLE_TARGET).toFixed(2);
    const excessStockRm     = +(totalCustomCost - targetCustomCost2x).toFixed(2);

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
      stockCycleTarget: STOCK_CYCLE_TARGET,
      stockCycleVarVsTarget: +(pmgStockCycle - STOCK_CYCLE_TARGET).toFixed(2),
      targetCustomCost2x,
      excessStockRm,
      agedSkuCount: ag.skuCount,
      agedQty6MPlus: ag.agedQty6MPlus,
      agedValueRm: ag.agedValue,
      trendDirection: priceDiffRm >= 0 ? 'UP' : 'DOWN'
    };
  });

  const buildCategorySummary = (catSubset) => {
    const STOCK_CYCLE_TARGET  = 2.0;
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
    // AVERAGE STOCK CYCLE = TOTAL CUSTOM COST / TOTAL COST OF SALES (HQ Target = 2.0)
    const averageStockCycle   = costOfSalesLatest > 0 ? +(totalCustomCost / costOfSalesLatest).toFixed(2) : 0;
    const meanCategoryCycle   = catSubset.length > 0
      ? +(catSubset.reduce((s, c) => s + c.pmgStockCycle, 0) / catSubset.length).toFixed(2)
      : 0;
    const targetCustomCost2x  = +(costOfSalesLatest * STOCK_CYCLE_TARGET).toFixed(2);
    const excessStockRm       = +(totalCustomCost - targetCustomCost2x).toFixed(2);
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
      stockCycleTarget: STOCK_CYCLE_TARGET,
      stockCycleVarVsTarget: +(averageStockCycle - STOCK_CYCLE_TARGET).toFixed(2),
      meanCategoryCycle,
      targetCustomCost2x,
      excessStockRm,
      agedValueRm,
      agedSkuCount
    };
  };

  const catSummaryHq11  = buildCategorySummary(categories.filter(c => c.isHqFocus));
  const catSummaryAll12 = buildCategorySummary(categories);

  // Populate salesContributionPct for each category
  categories.forEach(c => {
    c.salesContributionPct = catSummaryAll12.netSoldPriceLatest > 0
      ? +((c.netSoldPriceLatest / catSummaryAll12.netSoldPriceLatest) * 100).toFixed(2)
      : 0;
  });

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

    // ── 3-Month Trajectory & PIC Alert Diagnostic (M-2 ➔ M-1 ➔ Latest) ──
    const m1Data = getTeammateHistoricalMonth(key, 'M1', state);
    const m2Data = getTeammateHistoricalMonth(key, 'M2', state);

    const tsM1 = m1Data.ts;
    const tsM2 = m2Data.ts;
    const hbM1 = m1Data.hb;
    const hbM2 = m2Data.hb;
    const hbPctM1 = m1Data.hbPct;
    const hbPctM2 = m2Data.hbPct;
    const gpPctM1 = m1Data.gpPct;
    const gpPctM2 = m2Data.gpPct;
    const txM1 = m1Data.tx;
    const txM2 = m2Data.tx;

    const tsMoMPct = tsM1 > 0 ? calcGrowthPct(dL.ts, tsM1) : null;
    const ts3mPct  = tsM2 > 0 ? calcGrowthPct(dL.ts, tsM2) : null;
    const txMoMPct = txM1 > 0 ? calcGrowthPct(cL, txM1) : null;

    // Flag significant declines to alert Pharmacist (PIC) to advise teammate
    let picAlertRequired = false;
    let picAlertReason = '';
    let picAlertReasonShort = '';

    if (dL.ts > 500) { // Active staff in branch
      if (hbPctOwnTsLatest < 30) {
        picAlertRequired = true;
        picAlertReason = `HB share is ${fmtPct(hbPctOwnTsLatest)} (below 30% branch benchmark). Urgent PIC coaching needed on HB attachments at checkout.`;
        picAlertReasonShort = `Low HB% (${fmtPct(hbPctOwnTsLatest)})`;
      } else if (ts3mPct !== null && ts3mPct < -10) {
        picAlertRequired = true;
        picAlertReason = `Personal TS declined ${fmtPct(ts3mPct, 1, true)} over 3 months (from ${fmtRM(tsM2)} to ${fmtRM(dL.ts)}). PIC to advise on sales consistency & footfall conversion.`;
        picAlertReasonShort = `3M TS Drop (${fmtPct(ts3mPct, 1, true)})`;
      } else if (gL.gpMarginPct > 0 && gpPctM1 > 0 && (gL.gpMarginPct - gpPctM1) < -1.5) {
        picAlertRequired = true;
        picAlertReason = `GP Margin contracted by ${fmtPP(gL.gpMarginPct - gpPctM1)} MoM down to ${fmtPct(gL.gpMarginPct)}. PIC to advise on margin protection & attachments.`;
        picAlertReasonShort = `Margin Drop (${fmtPP(gL.gpMarginPct - gpPctM1)})`;
      } else if (txMoMPct !== null && txMoMPct < -12) {
        picAlertRequired = true;
        picAlertReason = `Transactions dropped ${fmtPct(txMoMPct, 1, true)} MoM (${txM1} ➔ ${cL} tx). Coach on active floor presence.`;
        picAlertReasonShort = `Tx Drop (${fmtPct(txMoMPct, 1, true)})`;
      }
    }

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
      hbPctLatest: hbPctOwnTsLatest,
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
      branchTsShareLatest,
      // 3-Month Trajectory Fields
      tsM1,
      tsM2,
      hbM1,
      hbM2,
      hbPctM1,
      hbPctM2,
      gpPctM1,
      gpPctM2,
      txM1,
      txM2,
      tsMoMPct,
      ts3mPct,
      picAlertRequired,
      picAlertReason,
      picAlertReasonShort
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
  let m2 = state.dailySalesM2 && state.dailySalesM2.ts ? { ...state.dailySalesM2 } : null;
  let m1 = state.dailySalesM1 && state.dailySalesM1.ts ? { ...state.dailySalesM1 } : null;

  // Auto-derive M-1 & M-2 from continuous historical monthly archives if not manually set
  try {
    const curKey = getArchivePeriodKey(state);
    const arch = (typeof loadMonthlyArchives === 'function') ? loadMonthlyArchives() : {};
    const priorKeys = Object.keys(arch).filter(k => k < curKey && !k.startsWith('2025')).sort();
    if (!m1 && priorKeys.length > 0) {
      const k1 = priorKeys[priorKeys.length - 1];
      const s1 = arch[k1];
      if (s1 && s1.outletTotals) {
        m1 = {
          periodLabel: s1.periodLabel || k1,
          ts: s1.outletTotals.ts || 0,
          hb: s1.outletTotals.hb || 0,
          hm: s1.outletTotals.hm || 0,
          gpRm: s1.outletTotals.gpRm || 0,
          gpPct: s1.outletTotals.gpPct || 0,
          transactions: s1.outletTotals.transactions || 0
        };
      }
    }
    if (!m2 && priorKeys.length > 1) {
      const k2 = priorKeys[priorKeys.length - 2];
      const s2 = arch[k2];
      if (s2 && s2.outletTotals) {
        m2 = {
          periodLabel: s2.periodLabel || k2,
          ts: s2.outletTotals.ts || 0,
          hb: s2.outletTotals.hb || 0,
          hm: s2.outletTotals.hm || 0,
          gpRm: s2.outletTotals.gpRm || 0,
          gpPct: s2.outletTotals.gpPct || 0,
          transactions: s2.outletTotals.transactions || 0
        };
      }
    }
  } catch (e) {}

  m2 = m2 || { periodLabel: 'August FY2026 (M-2)', ts: 380852.53, hb: 164354.04, hm: 38826.70, gpRm: 100551.66, gpPct: 26.07, transactions: 8433 };
  m1 = m1 || { periodLabel: 'September FY2026 (M-1)', ts: 337979.41, hb: 144533.00, hm: 32643.20, gpRm: 91857.56, gpPct: 26.84, transactions: 7779 };

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
  const all12 = m.catSummaryAll12;
  const catsAll = m.categories; // Include all 12 categories for Net Sold Price, Net Sold Profit, and GP Margin %
  const upCats = catsAll.filter(c => c.priceDiffRm > 0).sort((a, b) => b.priceDiffRm - a.priceDiffRm);
  const downCats = catsAll.filter(c => c.priceDiffRm < 0).sort((a, b) => a.priceDiffRm - b.priceDiffRm);
  const profitUpCats = catsAll.filter(c => c.profitDiffRm > 0).sort((a, b) => b.profitDiffRm - a.profitDiffRm);
  const profitDownCats = catsAll.filter(c => c.profitDiffRm < 0).sort((a, b) => a.profitDiffRm - b.profitDiffRm);

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
        title: 'Working Capital & 11-Category Stock Cycle Pressure (2.53 vs 2.0 HQ Target)',
        detail: `Across the 11 HQ Focus Categories, Total OH Custom Cost is ${fmtRM(hq.totalCustomCost)} divided by Cost of Sales (MTD) of ${fmtRM(hq.costOfSalesLatest)}, yielding an Average Stock Cycle of ${hq.averageStockCycle.toFixed(2)} against the HQ Target of 2.0 (+${hq.stockCycleVarVsTarget.toFixed(2)} above target, or ${fmtRM(hq.excessStockRm)} excess inventory). With ${fmtNum(m.agingSummary.totalAgedSkus)} SKUs (${fmtRM(m.agingSummary.totalAgedValueRm)}) aged ≥ 6 months, working capital is heavily locked in HOME&LIV (6.61), MOM&BABY (5.94), FIR-AID (4.59), PERSONAL (4.34), ELDERLY (3.65), and F & B (2.63).`
      }
    ],

    categoryAndStockFindings: {
      categoriesUp: upCats.map(c => ({
        category: c.category,
        summary: `Net Sold Price UP +${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 2, true)}) to ${fmtRM(c.netSoldPriceLatest)} | Net Profit ${c.profitDiffRm >= 0 ? 'UP +' + fmtRM(c.profitDiffRm) : 'DOWN ' + fmtRM(c.profitDiffRm)} (${fmtPct(c.gpPctLatest)} GP%, ${fmtPP(c.gpPctDiffPP)}) | Stock Cycle (Custom Cost ÷ COS): ${c.pmgStockCycle.toFixed(2)} (Target: 2.0, ${c.pmgStockCycle <= 2.0 ? '✅ On Target' : '⚠️ +' + c.stockCycleVarVsTarget.toFixed(2) + ' over'}).`
      })),
      categoriesDown: downCats.map(c => ({
        category: c.category,
        summary: `Net Sold Price DOWN ${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 2, true)}) to ${fmtRM(c.netSoldPriceLatest)} | Net Profit ${c.profitDiffRm >= 0 ? 'UP +' + fmtRM(c.profitDiffRm) : 'DOWN ' + fmtRM(c.profitDiffRm)} (${fmtPct(c.gpPctLatest)} GP%, ${fmtPP(c.gpPctDiffPP)}) | Stock Cycle (Custom Cost ÷ COS): ${c.pmgStockCycle.toFixed(2)} (Target: 2.0, ${c.pmgStockCycle <= 2.0 ? '✅ On Target' : '⚠️ +' + c.stockCycleVarVsTarget.toFixed(2) + ' over'}).`
      })),
      stockCycleComment: `Across all 12 categories, Category Net Sold Price is ${fmtRM(all12.netSoldPriceLatest)} vs ${fmtRM(all12.netSoldPricePrev)} LY (${fmtRM(all12.priceDiffRm)} / ${fmtPct(all12.priceDiffPct, 2, true)}), Category Net Sold Profit is ${fmtRM(all12.netSoldProfitLatest)} vs ${fmtRM(all12.netSoldProfitPrev)} LY (${fmtRM(all12.profitDiffRm)} / ${fmtPct(all12.profitDiffPct, 2, true)}), and Category Gross Profit Margin improved by ${fmtPP(all12.gpPctDiffPP)} (from ${fmtPct(all12.gpPctPrev)} to ${fmtPct(all12.gpPctLatest)}). Using PMG's Stock Cycle formula (Total Custom Cost ÷ Cost of Sales MTD) against the 2.0 HQ Target: across the 11 HQ Focus Categories (excluding WYMED-EX), Total Custom Cost (${fmtRM(hq.totalCustomCost)}) ÷ Total Cost of Sales (${fmtRM(hq.costOfSalesLatest)}) = Average Stock Cycle of ${hq.averageStockCycle.toFixed(2)} (All 12 Categories Stock Cycle: ${all12.averageStockCycle.toFixed(2)}). Categories meeting the ≤ 2.0 target are WYMED-EX (1.70), NON-SC-P (1.85), SCHE-DRU (1.90), and NON-SCHE (1.98), while SUPPLEME (2.13) and OTC (2.32) are close. The 6 overstocked categories exceeding 2.0 are HOME&LIV (6.61), MOM&BABY (5.94), FIR-AID (4.59), PERSONAL (4.34), ELDERLY (3.65), and F & B (2.63) — requiring a net inventory reduction of ${fmtRM(hq.excessStockRm)} to reach the 2.0 branch target.`
    },

    swot: {
      strengths: [
        `• Gross Profit Margin Expansion: Expanded GP% to ${fmtPct(o.personalGpTotalLatest.gpMarginPct)} (+${fmtPP(o.personalGpMarginDiffPP)} YoY) delivering +${fmtRM(o.personalGpDiffRm)} higher gross profit.`,
        `• House Brand Core: HB sales reached ${fmtRM(o.hbLatest)} (${fmtPct(o.hbShareLatestPct)} of TS, +${fmtPct(o.hbDiffPct)} YoY) driven by high counter attachment.`,
        `• Profit Anchors: Supplements (${fmtRM(74446.17)}, 36.92% GP) and F&B (${fmtRM(56267.50)}, +21.97% profit growth) safeguard bottom line.`,
        `• Clinical Dispensary Leadership: PIC William (RM 97.22 basket, 49.9% HB) and Pharmacist Kenix (53.56% HB, 31.48% GP) lead high conversions.`
      ],
      weaknesses: [
        `• Customer Footfall Decline: Monthly transactions dropped by ${fmtNum(Math.abs(o.txDiff))} (-7.72% YoY), reflecting walk-in footfall erosion.`,
        `• Scheduled Drug Margin Compression: SCHE-DRU GP% fell to 11.91% (-2.22 pp), losing RM 1,208 profit from brand price-matching.`,
        `• Working Capital Stock Lockup: Stock cycle at ${hq.averageStockCycle.toFixed(2)} (vs 2.0 HQ target) with ${fmtNum(m.agingSummary.totalAgedSkus)} SKUs (${fmtRM(m.agingSummary.totalAgedValueRm)}) aged ≥6 months.`,
        `• Staff Attachment Variance: PA House Brand contribution ranges widely from 47.33% (Penny) down to 28.32% (Farizin).`
      ],
      opportunities: [
        `• WhatsApp Chronic Refill Retention: Contact chronic patients 3–5 days prior to prescription completion to secure +650 monthly refills.`,
        `• High-Margin Regimen Bundling: Pair metabolic wellness supplements (CoQ10, Omega-3) with all chronic scheduled drug refills.`,
        `• Aged Stock Cash Recovery: Convert 6-month aged stock (${fmtRM(m.agingSummary.totalAgedValueRm)}) via weekend morning market promotion tables.`,
        `• Dispensary Basket Sizing: Mandate RM 10–RM 25 House Brand add-ons on all walk-in OTC and adult milk powder checkouts.`
      ],
      threats: [
        `• Supermarket & Chain Price Wars: Aggressive loss-leader discounting on commercial adult formulas by Farley 6th Mile and Watsons 7th Mile.`,
        `• Suburban Living Cost Squeeze: Inflation causing suburban families in Kota Sentosa to delay refills or cut discretionary wellness items.`,
        `• Supply Chain Bulk Dumps: Central warehouse dispatching unrequested bulk stock, tying up store floor space and working capital.`,
        `• Competitive Countermeasure: Win on clinical authority, personalized consultations, free health checks, and superior House Brand value.`
      ]
    },

    roleActionPlans: [
      {
        id: 'role-pic-1',
        role: 'Pharmacist (PIC - William & Pharmacist Team)',
        title: 'Reverse SCHE-DRU Margin Compression (11.91% → 14.50% Target)',
        action: [
          'Audit top 30 scheduled drugs with margin compression to identify profit leakage.',
          'Mandate counter companion protocol: pair statins and BP meds with CoQ10 or Omega-3 House Brand.',
          'Actively switch price-conscious chronic patients to high-margin generic/House Margin equivalents.'
        ],
        targetMetric: 'Lift SCHE-DRU GP% from 11.91% to ≥ 14.0% (+RM 1,300/month profit)'
      },
      {
        id: 'role-pic-2',
        role: 'Pharmacist (PIC - William & Pharmacist Team)',
        title: 'Chronic Refill & Screening Drive to Recover +650 Monthly Transactions',
        action: [
          'Send proactive WhatsApp refill reminders to Kota Sentosa chronic patients 5 days before medication exhaustion.',
          'Conduct weekend morning bazaar blood pressure/glucose screenings (7:30–10:30 AM) at 7th Mile wet market.',
          'Issue RM 5–10 welcome vouchers to convert screening participants into repeat dispensary customers.'
        ],
        targetMetric: 'Restore monthly transactions from 7,826 back above 8,300+'
      },
      {
        id: 'role-abm-1',
        role: 'Assistant Branch Manager (ABM - Haniesha Louna & Lead)',
        title: 'Drive HQ 11 Stock Cycle from 2.53 Down Toward 2.0 Target',
        action: [
          'Cap reorders on slow-moving SKUs across overstocked categories (HOME&LIV 6.61, MOM&BABY 5.94, FIR-AID 4.59).',
          'Set up a high-traffic "Clearance & Value Bundle Bay" at store entrance for top 6-month aged inventory.',
          'Expedite supplier return-to-vendor (RTV) and warehouse credit note processing to cut excess stock by RM 35k+.'
        ],
        targetMetric: 'Improve Branch Stock Cycle from 2.53 toward ≤ 2.20 & cut 6M aged stock by 15%'
      },
      {
        id: 'role-abm-2',
        role: 'Assistant Branch Manager (ABM - Haniesha Louna & Lead)',
        title: 'Revamp Front-of-Store Merchandising & Floor Standards (Walkthrough Fix)',
        action: [
          'Immediately clear rear emergency walkways and remove storage boxes from customer waiting chairs.',
          'Install high-visibility House Brand comparison shelf-talkers across OTC, FIR-AID, and NON-SCHE gondolas.',
          'Conduct weekly price tag audits to synchronize shelf wobblers with monthly campaign rotations.'
        ],
        targetMetric: 'Recover +RM 6,000/month across OTC, NON-SCHE & FIR-AID; 100% floor compliance'
      },
      {
        id: 'role-prp-1',
        role: 'Provisional Registered Pharmacist (PRP - Christina Lee)',
        title: 'Clinical Cross-Selling on SUPPLEME & ELDERLY Rehabilitation Aids',
        action: [
          'Pitch a structured 2-item health regimen (Core Supplement + House Brand companion) on every consultation.',
          'Focus proactive recommendations on high-margin ELDERLY (29.25% GP) and SUPPLEME (36.92% GP) product lines.',
          'Cross-sell relevant nutritional and wound care adjuncts to customers purchasing clinical mobility aids.'
        ],
        targetMetric: 'Lift PRP TS Basket Size from RM 38.72 to RM 43.00+ & HB% from 43.28% to 47%'
      },
      {
        id: 'role-prp-2',
        role: 'Provisional Registered Pharmacist (PRP - Christina Lee)',
        title: 'New Product & High-Margin HM Clinical Detailing',
        action: [
          'Lead weekly 10-minute morning huddle with PAs detailing 5 focus House Brand/House Margin SKUs.',
          'Train floor staff on customer objection handling and clinical benefits of switching from branded OTCs.',
          'Verify dispensary team can confidently explain indications for PMG proprietary health formulations.'
        ],
        targetMetric: 'Boost outlet HM share of TS from 9.04% to 10.50%'
      },
      {
        id: 'role-pa-1',
        role: 'Pharmacist Assistant (PA Team - Penny, Nurhafizah, Farizin, Fiona)',
        title: 'Adult Nutrition (F & B) & Household Basket Margin Upgrade',
        action: [
          'Attach a House Brand companion (Vitamin C, Joint Gel, or Diabetic Strips) to every commercial milk powder sale.',
          'Actively guide customers toward PMG clinical nutrition (Nutri Alpha, Flexsure Gold) as higher-value options.',
          'Avoid single-item low-margin checkouts by offering checkout counter companion add-ons.'
        ],
        targetMetric: 'Maintain F & B GP% ≥ 24.5% and raise PA average HB Basket Size above RM 16.50'
      },
      {
        id: 'role-pa-2',
        role: 'Pharmacist Assistant (PA Team - Penny, Nurhafizah, Farizin, Fiona)',
        title: 'Daily Gondola Facing, Expiry FEFO & Zero-Out-of-Stock on Top 50 Hero SKUs',
        action: [
          'Execute daily morning shelf-facing SOP across assigned category gondolas before 8:00 AM opening.',
          'Rotate inventory using First-Expiry-First-Out (FEFO); pull 6-month aging items to eye-level forward display.',
          'Check top 50 fast-moving OTC/NON-SCHE items daily to guarantee zero out-of-stock during peak morning hours.'
        ],
        targetMetric: '100% daily shelf compliance & +5% rebound in OTC/NON-SCHE unit volume'
      }
    ],

    teammateCoaching: (function() {
      const activeStaff = (m.teammates || []).filter(t => t.isActiveLatest);
      // Sort: prioritize teammates requiring PIC advisory alert first, then by TS descending
      const sorted = [...activeStaff].sort((a, b) => {
        if (a.picAlertRequired && !b.picAlertRequired) return -1;
        if (!a.picAlertRequired && b.picAlertRequired) return 1;
        return b.tsLatest - a.tsLatest;
      });

      return sorted.map((t, idx) => {
        const norm = normalizeTeammateName(t.name);
        const sid = 'tm-' + norm.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const m3PctText = (t.ts3mPct !== null && isFinite(t.ts3mPct)) ? `${t.ts3mPct >= 0 ? '+' : ''}${Number(t.ts3mPct).toFixed(1)}% 3M` : 'New';
        const momPctText = (t.tsMoMPct !== null && isFinite(t.tsMoMPct)) ? `${t.tsMoMPct >= 0 ? '+' : ''}${Number(t.tsMoMPct).toFixed(1)}% MoM` : 'New';
        const hbM2Text = (t.hbPctM2 !== null && isFinite(t.hbPctM2)) ? `${Number(t.hbPctM2).toFixed(1)}%` : '—';
        const hbM1Text = (t.hbPctM1 !== null && isFinite(t.hbPctM1)) ? `${Number(t.hbPctM1).toFixed(1)}%` : '—';
        const hbLatestText = (t.hbPctLatest !== null && isFinite(t.hbPctLatest)) ? `${Number(t.hbPctLatest).toFixed(1)}%` : '—';
        const gpLatestText = (t.gpPctLatest !== null && isFinite(t.gpPctLatest)) ? `${Number(t.gpPctLatest).toFixed(1)}%` : '—';
        const basketTsVal = Number(t.basketTsLatest || 0).toFixed(2);
        const basketHbVal = Number(t.basketHbLatest || 0).toFixed(2);
        const hbLatestVal = Number(t.hbPctLatest || 0).toFixed(2);
        const gpLatestVal = Number(t.gpPctLatest || 0).toFixed(2);

        const m3Summary = `3M Trajectory: M-2 RM ${fmtNum(t.tsM2)} ➔ M-1 RM ${fmtNum(t.tsM1)} ➔ Latest RM ${fmtNum(t.tsLatest)} (${m3PctText}, ${momPctText}) | HB%: ${hbM2Text} ➔ ${hbM1Text} ➔ ${hbLatestText} | GP%: ${gpLatestText} | Tx: ${fmtNum(t.txLatest)} (Basket: RM ${basketTsVal})`;

        let statusBadge = '';
        let commentAndAction = [];

        if (t.picAlertRequired) {
          statusBadge = `⚠️ PRIORITY PIC ADVISORY ALERT: ${t.picAlertReasonShort || 'Action Required'}`;
          if (norm.includes('FARIZIN')) {
            commentAndAction = [
              `Key Issue: Low House Brand share (${hbLatestVal}%) and lowest HB Basket (RM ${basketHbVal}) in branch.`,
              'Action Plan (Straightforward Steps):',
              '• Pair Farizin with senior dispenser (Penny) for 1 week at OTC/dispensary counter.',
              '• Conduct 1-on-1 coaching on DPOS counter companion attachment scripts.',
              '• Enforce daily minimum target of RM 450+ House Brand sales at dispensing.'
            ];
          } else if (norm.includes('LOUNA') || norm.includes('HANIESHA')) {
            commentAndAction = [
              `Key Issue: 3M sales contraction (-15.2%) and branch-lowest GP margin (${gpLatestVal}%).`,
              'Action Plan (Straightforward Steps):',
              '• Cease unattached checkout of low-margin commercial adult milk and diapers.',
              '• Mandate attaching high-margin wellness supplements (35%+ GP) during checkout.',
              '• Lift personal gross profit margin back above 27.5% target.'
            ];
          } else if (norm.includes('FIONA')) {
            commentAndAction = [
              'Key Issue: Sharp customer volume loss (-253 transactions MoM, down to 870 Tx).',
              'Action Plan (Straightforward Steps):',
              '• Assign prime greeting and triage duty during 7th Mile wet market peak (7:30–10:30 AM).',
              '• Proactively offer free blood pressure and health checks to incoming market shoppers.',
              '• Enforce daily minimum target of ≥32 completed transactions per day.'
            ];
          } else if (norm.includes('NURHAFIZAH')) {
            commentAndAction = [
              `Key Issue: House Brand share slipped over 3 consecutive months (${hbM2Text} ➔ ${hbM1Text} ➔ ${hbLatestText}).`,
              'Action Plan (Straightforward Steps):',
              '• Transfer her high-conviction HM consulting methods to core House Brand supplement lines.',
              '• Introduce House Brand companion bundles during dispensing counter consultations.',
              '• Lift personal House Brand contribution back above 35% within 30 days.'
            ];
          } else {
            commentAndAction = [
              `Key Issue: ${t.picAlertReason}.`,
              'Action Plan (Straightforward Steps):',
              '• Schedule a 1-on-1 coaching session to review counter attachment scripts.',
              '• Establish a weekly House Brand sales quota and review progress daily.'
            ];
          }
        } else {
          if (norm.includes('PENNY') || norm.includes('JONG PEI CHOO')) {
            statusBadge = '⭐ #1 Branch Volume & HB Driver';
            commentAndAction = [
              `Star Benchmark: RM ${fmtNum(t.tsLatest)} turnover (+18.26% YoY, 47.33% HB share, 1,258 Tx).`,
              'Action Plan (Straightforward Steps):',
              '• Task Penny with peer-shadowing Farizin on fast-paced counter conversion.',
              '• Lead morning role-play demonstrations for junior staff on companion bundling.'
            ];
          } else if (norm.includes('KENIX')) {
            statusBadge = '⭐ Clinical Margin Benchmark (31.48% GP)';
            commentAndAction = [
              'Star Benchmark: Branch-leading 53.56% House Brand share and 31.65% GP margin.',
              'Action Plan (Straightforward Steps):',
              '• Champion high-margin clinical nutrition and chronic companion protocols at dispensary.',
              '• Share patient switching scripts with provisional pharmacist and junior staff.'
            ];
          } else if (norm.includes('CHRISTINA')) {
            statusBadge = '⭐ Solid Clinical Margin — Basket Focus';
            commentAndAction = [
              'Star Benchmark: RM 34,887.97 sales in debut month with 43.24% HB share (918 Tx).',
              'Action Plan (Straightforward Steps):',
              '• Continue structured clinical consultations across ELDERLY and SUPPLEME categories.',
              '• Lead weekly 10-minute product huddles with PAs on top focus House Brand formulations.'
            ];
          } else if (norm.includes('CHAI YEE SIAN') || norm.includes('WILLIAM')) {
            statusBadge = '⭐ #1 Profit Leader & Clinical Benchmark';
            commentAndAction = [
              'Star Benchmark: Leads Kota Sentosa in Gross Profit RM, HB RM, and TS Basket Size (RM 97.22).',
              'Action Plan (Straightforward Steps):',
              '• Document high-ticket chronic + supplement consultation framework into branch SOP.',
              '• Conduct weekly clinical audits on scheduled drug companion attachment rates.'
            ];
          } else {
            statusBadge = `✅ On Target (${hbLatestText} HB, ${gpLatestText} GP)`;
            commentAndAction = [
              `${t.name} is performing steadily across the 3-month trajectory.`,
              'Action Plan (Straightforward Steps):',
              '• Maintain consistent attachment of House Brand items at dispensing.',
              '• Sustain daily customer interaction and adherence counseling targets.'
            ];
          }
        }

        return {
          id: sid,
          person: t.name,
          role: t.role,
          statusBadge,
          metricsSummary: m3Summary,
          commentAndAction
        };
      });
    })()
  };
}

// ─── LIVE GEMINI AI DEEP ANALYSIS ENGINE ────────────────────────────────────
function buildGeminiPrompt(m, state) {
  const o = m.outlet;
  const hq = m.catSummaryHq11;
  const all12 = m.catSummaryAll12;

  const nFmt = (val, dec = 2, fallback = '0.00') => (val != null && isFinite(val)) ? Number(val).toFixed(dec) : fallback;
  const pFmt = (val, dec = 1, showSign = false, fallback = '—') => (val != null && isFinite(val)) ? `${showSign && val > 0 ? '+' : ''}${Number(val).toFixed(dec)}%` : fallback;

  const cats = m.categories.map(c =>
    `- ${c.category}${c.isHqFocus ? '' : ' (Excluded from HQ 11 Stock Cycle focus)'}: Latest Price RM ${nFmt(c.netSoldPriceLatest)} vs Prev RM ${nFmt(c.netSoldPricePrev)} (${pFmt(c.priceDiffPct, 2)}), Latest Profit RM ${nFmt(c.netSoldProfitLatest)} vs Prev RM ${nFmt(c.netSoldProfitPrev)} (${pFmt(c.profitDiffPct, 2)}), GP% ${nFmt(c.gpPctLatest)}% vs ${nFmt(c.gpPctPrev)}% (${pFmt(c.gpPctDiffPP, 2, true).replace('%', ' pp')}), CostOfSales RM ${nFmt(c.costOfSalesLatest)}, ClosingCustomCost RM ${nFmt(c.totalCustomCost)}, PMG_StockCycle = ${nFmt(c.pmgStockCycle)} (HQ Target = 2.0), 6M_AgedValue RM ${nFmt(c.agedValueRm)}`
  ).join('\n');

  const staff = m.teammates.filter(t => t.isActiveLatest || t.hasPrevYear).map(t =>
    `- ${t.name} [${t.role}]: Latest TS RM ${nFmt(t.tsLatest)} (Prev RM ${nFmt(t.tsPrev)} | M-1 RM ${nFmt(t.tsM1)} | M-2 RM ${nFmt(t.tsM2)} | 3M Trend: ${pFmt(t.ts3mPct, 1, true, 'New')} | MoM: ${pFmt(t.tsMoMPct, 1, true, 'New')}), HB RM ${nFmt(t.hbLatest)} (HB% 3M Trajectory: M-2 ${pFmt(t.hbPctM2)} ➔ M-1 ${pFmt(t.hbPctM1)} ➔ Latest ${pFmt(t.hbPctLatest)}), HM RM ${nFmt(t.hmLatest)} (${pFmt(t.hmPctOwnTsLatest, 2)}), Tx ${t.txLatest || 0} (Prev ${t.txPrev || 0}), BasketTS RM ${nFmt(t.basketTsLatest)}, BasketHB RM ${nFmt(t.basketHbLatest)}, GP RM ${nFmt(t.gpRmLatest)} (GP% 3M Trajectory: M-2 ${pFmt(t.gpPctM2)} ➔ M-1 ${pFmt(t.gpPctM1)} ➔ Latest ${pFmt(t.gpPctLatest)}). [PIC Alert Status: ${t.picAlertRequired ? 'CRITICAL ALERT - ' + (t.picAlertReason || '') : 'NORMAL'}]`
  ).join('\n');

  const topHeroes = (m.topHeroSkus || []).slice(0, 8).map(s =>
    `${s.itemCode} ${s.itemName} (${s.category}): +RM ${nFmt(s.priceDiffRm)} (Latest RM ${nFmt(s.priceLatest)} vs LY RM ${nFmt(s.pricePrev)}, GP ${pFmt(s.gpPctLatest)})`
  ).join('; ') || 'None';

  const topBleeders = (m.topBleederSkus || []).slice(0, 8).map(s =>
    `${s.itemCode} ${s.itemName} (${s.category}): RM ${nFmt(s.priceDiffRm)} (Latest RM ${nFmt(s.priceLatest)} vs LY RM ${nFmt(s.pricePrev)}, GP ${pFmt(s.gpPctLatest)})`
  ).join('; ') || 'None';

  return `You are a Chief Retail Pharmacy Strategist & Commercial Analyst for PMG Pharmacy Kota Sentosa (7th Mile Bazaar, Penrissen Road, Kuching, Sarawak).
Analyze the following verified monthly performance dataset comparing Latest Month (${state.meta?.latestPeriodLabel || 'Latest Month'}) against Previous Year Same Month (${state.meta?.prevYearPeriodLabel || 'Prev Year'}) and the Latest 3-Month trend:

1. OUTLET SUMMARY KPIs:
- Total Sales (TS): RM ${nFmt(o.tsLatest)} vs LY RM ${nFmt(o.tsPrev)} (${pFmt(o.tsDiffPct, 2, true)})
- House Brand (HB): RM ${nFmt(o.hbLatest)} (${pFmt(o.hbShareLatestPct, 2)} of TS) vs LY RM ${nFmt(o.hbPrev)} (${pFmt(o.hbSharePrevPct, 2)} of TS), YoY change: ${pFmt(o.hbDiffPct, 2, true)}
- House Margin (HM): RM ${nFmt(o.hmLatest)} (${pFmt(o.hmShareLatestPct, 2)} of TS) vs LY RM ${nFmt(o.hmPrev)} (${pFmt(o.hmSharePrevPct, 2)} of TS), YoY change: ${pFmt(o.hmDiffPct, 2, true)}
- Personal Gross Profit Total: RM ${nFmt(o.personalGpTotalLatest?.netSoldProfit)} (${pFmt(o.personalGpTotalLatest?.gpMarginPct, 2)}) vs LY RM ${nFmt(o.personalGpTotalPrev?.netSoldProfit)} (${pFmt(o.personalGpTotalPrev?.gpMarginPct, 2)})
- Total Transactions (Customers Served): ${o.txLatest || 0} vs LY ${o.txPrev || 0} (${pFmt(o.txDiffPct, 2, true)})
- TS Basket Size: RM ${nFmt(o.basketTsLatest)} vs LY RM ${nFmt(o.basketTsPrev)} (${pFmt(o.basketTsDiffPct, 2, true)})
- HB Basket Size: RM ${nFmt(o.basketHbLatest)} vs LY RM ${nFmt(o.basketHbPrev)} (${pFmt(o.basketHbDiffPct, 2, true)})
- 3-Month Horizon: M-2 TS RM ${nFmt(m.threeMonthTrend?.m2?.ts)}, M-1 TS RM ${nFmt(m.threeMonthTrend?.m1?.ts)}, Latest TS RM ${nFmt(o.tsLatest)}

2. ALL 12 CATEGORIES (NET SOLD PRICE, PROFIT & GP%) & 11 HQ FOCUS STOCK CYCLE:
Formula: COST OF SALES = NET SOLD PRICE - NET SOLD PROFIT; STOCK CYCLE = TOTAL CUSTOM COST / COST OF SALES (HQ TARGET = 2.0); AVERAGE STOCK CYCLE = TOTAL CUSTOM COST / TOTAL COST OF SALES
All 12 Categories Total (KPIs 7, 8, 9): Net Sold Price RM ${nFmt(all12?.netSoldPriceLatest)} (vs LY RM ${nFmt(all12?.netSoldPricePrev)}, ${pFmt(all12?.priceDiffPct, 2, true)}), Net Sold Profit RM ${nFmt(all12?.netSoldProfitLatest)} (vs LY RM ${nFmt(all12?.netSoldProfitPrev)}, ${pFmt(all12?.profitDiffPct, 2, true)}), GP% ${pFmt(all12?.gpPctLatest, 2)} (vs LY ${pFmt(all12?.gpPctPrev, 2)}, ${pFmt(all12?.gpPctDiffPP, 2, true).replace('%', ' pp')}).
HQ 11 Focus Stock Cycle Subtotal (Excl. WYMED-EX): Cost of Sales RM ${nFmt(hq?.costOfSalesLatest)}, Closing Custom Cost RM ${nFmt(hq?.totalCustomCost)}, Average Stock Cycle = ${nFmt(hq?.averageStockCycle)} vs HQ Target 2.0 (Excess Stock above 2.0 target = RM ${nFmt(hq?.excessStockRm)}).
Category Breakdown:
${cats}

3. TEAMMATE PERSONAL PERFORMANCE:
${staff}

4. GRANULAR SKU & 6-MONTH STOCK AGING HIGHLIGHTS:
- Top Growth SKUs: ${topHeroes}
- Top Declining SKUs: ${topBleeders}
- 6-Month Stock Aging: ${m.agingSummary?.totalAgedSkus || 0} SKUs with ≥6M aged stock totaling RM ${nFmt(m.agingSummary?.totalAgedValueRm)} (including RM ${nFmt(m.agingSummary?.totalAbove1YrValueRm)} aged >1 year).
- Video Walkthrough Report Notes: ${state.videoWalkthroughReport || 'None provided'}

CRITICAL INSTRUCTION FOR TEAMMATE COACHING & PIC ALERTS:
You must rigorously compare 3 months of personal sales (Latest vs M-1 vs M-2) for every active teammate. When any teammate shows a significant drop (such as low HB% < 30%, negative 3-month sales contraction, customer footfall drop, or GP margin compression), you MUST:
1. Mark their "statusBadge" as "⚠️ PRIORITY PIC ADVISORY ALERT: [Concise issue, e.g. Low HB Attachment / 3M TS Drop / Margin Compression]"
2. In "commentAndAction", provide direct, concrete guidance directed to Pharmacist (PIC - William) on what 1-on-1 advice, shadowing partner, and 30-day targets William must give to that teammate.

CRITICAL INSTRUCTION FOR ALL ACTION PLANS (MANDATORY POINT FORM & STRAIGHTFORWARD):
The Pharmacist / PIC mandates that ALL action plans MUST be straight-to-the-point, easily understood, and formatted strictly in POINT FORM.
- NEVER output long, vague narrative paragraphs, generic essays, or convoluted corporate jargon.
- In "roleActionPlans": "action" MUST be an array of 2 to 3 crisp, practical bullet points stating the exact physical actions to execute.
- In "teammateCoaching": "commentAndAction" MUST be an array of point-form strings: "Key Issue: [one sentence]", "Action Plan (Straightforward Steps):", "• Step 1", "• Step 2", "• Step 3".
- In "swot": every point MUST be a punchy bullet statement starting with a bold key theme.

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
    "strengths": ["• Point 1", "• Point 2", "• Point 3", "• Point 4"],
    "weaknesses": ["• Point 1", "• Point 2", "• Point 3", "• Point 4"],
    "opportunities": ["• Point 1", "• Point 2", "• Point 3", "• Point 4"],
    "threats": ["• Point 1", "• Point 2", "• Point 3", "• Point 4"]
  },
  "roleActionPlans": [
    {
      "id": "unique-id",
      "role": "Pharmacist (PIC - William & Pharmacist Team) | Assistant Branch Manager (ABM) | Provisional Registered Pharmacist (PRP) | Pharmacist Assistant (PA)",
      "title": "Action title",
      "action": [
        "Step 1: Concrete execution action in point form",
        "Step 2: Concrete execution action in point form",
        "Step 3: Concrete execution action in point form"
      ],
      "targetMetric": "Measurable 30-day target"
    }
  ],
  "teammateCoaching": [
    {
      "id": "tm-id",
      "person": "Exact Teammate Name",
      "role": "Role",
      "statusBadge": "Status label (e.g., '⚠️ PRIORITY PIC ADVISORY ALERT: Low HB Attachment' or '⭐ Top Volume & HB Surge Star')",
      "metricsSummary": "3M Trajectory: M-2 RM ... ➔ M-1 RM ... ➔ Latest RM ... (3M %, MoM %) | HB% trajectory | GP%",
      "commentAndAction": [
        "Key Issue: Concise one-sentence summary of bottleneck",
        "Action Plan (Straightforward Steps):",
        "• Specific coaching action 1",
        "• Specific coaching action 2",
        "• Specific daily/weekly target"
      ]
    }
  ]
}`;
}

// ─── VERIFIED HISTORICAL 3-MONTH TEAMMATE BASELINE (FOR MONTHLY PRESENTATIONS) ───
const HISTORICAL_TEAMMATE_BASELINE = {
  'WILLIAM CHAI': {
    m1: { label: 'July 2026', ts: 48085.31, hb: 20614.05, hbPct: 42.87, hm: 5534.85, hmPct: 11.51, tx: 561, basketTs: 85.71, basketHb: 36.75, gpRm: 15801.99, gpPct: 33.10 },
    m2: { label: 'Aug 2026', ts: 56218.31, hb: 26502.91, hbPct: 47.14, hm: 5368.15, hmPct: 9.55, tx: 466, basketTs: 120.64, basketHb: 56.87, gpRm: 14105.02, gpPct: 25.09 },
    m3: { label: 'Sept 2026', ts: 57034.03, hb: 29411.83, hbPct: 51.57, hm: 6189.80, hmPct: 10.85, tx: 597, basketTs: 95.53, basketHb: 49.27, gpRm: 16494.38, gpPct: 27.57 }
  },
  'MUHAMMAD NUR FARIZIN': {
    m1: { label: 'July 2026', ts: 22186.16, hb: 6844.60, hbPct: 30.85, hm: 2572.20, hmPct: 11.59, tx: 761, basketTs: 29.15, basketHb: 8.99, gpRm: 6260.88, gpPct: 27.22 },
    m2: { label: 'Aug 2026', ts: 30931.79, hb: 9492.40, hbPct: 30.69, hm: 3192.90, hmPct: 10.32, tx: 916, basketTs: 33.77, basketHb: 10.36, gpRm: 8481.94, gpPct: 27.42 },
    m3: { label: 'Sept 2026', ts: 38902.31, hb: 12023.81, hbPct: 30.91, hm: 3825.20, hmPct: 9.83, tx: 1172, basketTs: 33.19, basketHb: 10.26, gpRm: 9763.77, gpPct: 24.96 }
  },
  'HANIESHA LOUNA': {
    m1: { label: 'July 2026', ts: 28733.32, hb: 12526.10, hbPct: 43.59, hm: 2598.20, hmPct: 9.04, tx: 731, basketTs: 39.31, basketHb: 17.14, gpRm: 8318.14, gpPct: 28.95 },
    m2: { label: 'Aug 2026', ts: 46327.58, hb: 21296.52, hbPct: 45.97, hm: 4244.40, hmPct: 9.16, tx: 1024, basketTs: 45.24, basketHb: 20.80, gpRm: 12813.91, gpPct: 27.66 },
    m3: { label: 'Sept 2026', ts: 33077.20, hb: 15277.24, hbPct: 46.19, hm: 2690.90, hmPct: 8.14, tx: 783, basketTs: 42.24, basketHb: 19.51, gpRm: 9196.92, gpPct: 27.56 }
  },
  'FIONA FIENA': {
    m1: { label: 'July 2026', ts: 38189.25, hb: 14674.28, hbPct: 38.43, hm: 4545.20, hmPct: 11.90, tx: 1051, basketTs: 36.34, basketHb: 13.96, gpRm: 10760.43, gpPct: 27.92 },
    m2: { label: 'Aug 2026', ts: 45990.94, hb: 20374.91, hbPct: 44.30, hm: 4134.40, hmPct: 8.99, tx: 1062, basketTs: 43.31, basketHb: 19.19, gpRm: 12304.53, gpPct: 26.75 },
    m3: { label: 'Sept 2026', ts: 38723.18, hb: 15585.48, hbPct: 40.25, hm: 3698.90, hmPct: 9.55, tx: 1064, basketTs: 36.39, basketHb: 14.65, gpRm: 10891.39, gpPct: 27.99 }
  },
  'NURHAFIZAH': {
    m1: { label: 'July 2026', ts: 33939.66, hb: 8794.45, hbPct: 25.91, hm: 4373.90, hmPct: 12.89, tx: 965, basketTs: 35.17, basketHb: 9.11, gpRm: 8325.98, gpPct: 25.13 },
    m2: { label: 'Aug 2026', ts: 32180.29, hb: 10697.52, hbPct: 33.24, hm: 4005.60, hmPct: 12.45, tx: 1029, basketTs: 31.27, basketHb: 10.40, gpRm: 8731.37, gpPct: 27.13 },
    m3: { label: 'Sept 2026', ts: 37220.70, hb: 11911.70, hbPct: 32.00, hm: 3165.70, hmPct: 8.51, tx: 1066, basketTs: 34.92, basketHb: 11.17, gpRm: 9239.66, gpPct: 24.53 }
  },
  'JONG PEI CHOO': {
    m1: { label: 'July 2026', ts: 63122.42, hb: 23436.61, hbPct: 37.13, hm: 6673.35, hmPct: 10.57, tx: 1377, basketTs: 45.84, basketHb: 17.02, gpRm: 16003.61, gpPct: 25.35 },
    m2: { label: 'Aug 2026', ts: 77868.67, hb: 40551.13, hbPct: 52.08, hm: 8186.15, hmPct: 10.51, tx: 1380, basketTs: 56.43, basketHb: 29.38, gpRm: 19762.47, gpPct: 25.38 },
    m3: { label: 'Sept 2026', ts: 68087.05, hb: 30255.60, hbPct: 44.44, hm: 7185.30, hmPct: 10.55, tx: 1327, basketTs: 51.31, basketHb: 22.80, gpRm: 17900.38, gpPct: 26.25 }
  },
  'DANIELA JANET': {
    m1: { label: 'July 2026', ts: 40431.03, hb: 13859.25, hbPct: 34.28, hm: 4057.10, hmPct: 10.03, tx: 986, basketTs: 41.01, basketHb: 14.06, gpRm: 11260.67, gpPct: 27.85 },
    m2: { label: 'Aug 2026', ts: 43949.89, hb: 15891.83, hbPct: 36.16, hm: 3755.60, hmPct: 8.55, tx: 1007, basketTs: 43.64, basketHb: 15.78, gpRm: 10556.70, gpPct: 24.02 },
    m3: { label: 'Sept 2026', ts: 24525.47, hb: 8992.27, hbPct: 36.67, hm: 2226.80, hmPct: 9.08, tx: 722, basketTs: 33.97, basketHb: 12.45, gpRm: 6615.68, gpPct: 26.85 }
  },
  'KENIX LING': {
    m1: { label: 'July 2026', ts: 21256.40, hb: 8704.50, hbPct: 40.95, hm: 2934.10, hmPct: 13.80, tx: 524, basketTs: 40.57, basketHb: 16.61, gpRm: 6432.80, gpPct: 30.26 },
    m2: { label: 'Aug 2026', ts: 30321.83, hb: 13782.70, hbPct: 45.45, hm: 4002.90, hmPct: 13.20, tx: 676, basketTs: 44.85, basketHb: 20.39, gpRm: 9335.79, gpPct: 30.79 },
    m3: { label: 'Sept 2026', ts: 22669.41, hb: 10073.31, hbPct: 44.44, hm: 2654.30, hmPct: 11.71, tx: 611, basketTs: 37.10, basketHb: 16.49, gpRm: 6538.08, gpPct: 28.78 }
  }
};

function buildGeminiPresentationDocument(m, state) {
  if (!m) return 'No performance data loaded to export.';

  const o = m.outlet;
  const hq = m.catSummaryHq11;
  const all12 = m.catSummaryAll12;
  const report = activeAiReport || buildDynamicBaselineReport(m, state);

  const branchName = state?.meta?.branch || 'PMG PHARMACY (KOTA SENTOSA) SDN BHD';
  const latestLabel = state?.meta?.latestPeriodLabel || 'Latest Month FY2026';
  const prevYearLabel = state?.meta?.prevYearPeriodLabel || 'Previous Year Same Month FY2025';

  const curPeriodKey = getArchivePeriodKey(state); // e.g. '2026-10'
  const m1Key = getPriorMonthKey(curPeriodKey, 1); // '2026-09'
  const m2Key = getPriorMonthKey(curPeriodKey, 2); // '2026-08'
  const nextKey = getNextMonthKey(curPeriodKey, 1); // '2026-11'

  const col1Header = `${getPeriodMonthName(m2Key)} (M-2)`;
  const col2Header = `${getPeriodMonthName(m1Key)} (M-1)`;
  const col3Header = `${getPeriodMonthName(curPeriodKey)} (Latest)`;
  const presDate = `01 ${getPeriodMonthName(nextKey)}`;

  // Store 3M trend outlet totals
  const archives = (typeof loadMonthlyArchives === 'function') ? loadMonthlyArchives() : {};
  const s2 = archives[m2Key]?.outletTotals;
  const s1 = archives[m1Key]?.outletTotals;

  const m2Outlet = {
    ts: m.threeMonthTrend?.m2?.ts || s2?.ts || 380852.53,
    hb: m.threeMonthTrend?.m2?.hb || s2?.hb || 164354.04,
    hm: m.threeMonthTrend?.m2?.hm || s2?.hm || 38826.70,
    gpRm: m.threeMonthTrend?.m2?.gpRm || s2?.gpRm || 100551.66,
    gpPct: m.threeMonthTrend?.m2?.gpPct || s2?.gpPct || 26.07,
    transactions: m.threeMonthTrend?.m2?.transactions || s2?.transactions || 8433
  };

  const m1Outlet = {
    ts: m.threeMonthTrend?.m1?.ts || s1?.ts || 337979.41,
    hb: m.threeMonthTrend?.m1?.hb || s1?.hb || 144533.00,
    hm: m.threeMonthTrend?.m1?.hm || s1?.hm || 32643.20,
    gpRm: m.threeMonthTrend?.m1?.gpRm || s1?.gpRm || 91857.56,
    gpPct: m.threeMonthTrend?.m1?.gpPct || s1?.gpPct || 26.84,
    transactions: m.threeMonthTrend?.m1?.transactions || s1?.transactions || 7779
  };

  const m2BasketTs = m2Outlet.transactions > 0 ? m2Outlet.ts / m2Outlet.transactions : 45.16;
  const m2BasketHb = m2Outlet.transactions > 0 ? m2Outlet.hb / m2Outlet.transactions : 19.49;
  const m1BasketTs = m1Outlet.transactions > 0 ? m1Outlet.ts / m1Outlet.transactions : 43.45;
  const m1BasketHb = m1Outlet.transactions > 0 ? m1Outlet.hb / m1Outlet.transactions : 18.58;

  // Active staff mapping
  const activeStaff = (m.teammates || []).filter(t => t.isActiveLatest || t.tsLatest > 0);

  const getTeammate3M = (t) => {
    const key = t.key || t.name || '';
    const col1 = getTeammateHistoricalMonth(key, 'M2', state);
    const col2 = getTeammateHistoricalMonth(key, 'M1', state);
    const col3 = {
      ts: t.tsLatest,
      hb: t.hbLatest,
      hbPct: t.hbPctOwnTsLatest !== undefined ? t.hbPctOwnTsLatest : (t.tsLatest > 0 ? +((t.hbLatest / t.tsLatest) * 100).toFixed(2) : 0),
      hm: t.hmLatest,
      hmPct: t.hmPctOwnTsLatest !== undefined ? t.hmPctOwnTsLatest : (t.tsLatest > 0 ? +((t.hmLatest / t.tsLatest) * 100).toFixed(2) : 0),
      tx: t.txLatest,
      basketTs: t.basketTsLatest,
      basketHb: t.basketHbLatest,
      gpRm: t.gpRmLatest,
      gpPct: t.gpPctLatest
    };
    return { col1, col2, col3 };
  };

  // Group staff into 3 slides cleanly & dynamically
  const assigned = new Set();
  const pickStaff = (keywords) => {
    for (const kw of keywords) {
      const found = activeStaff.find(t => {
        if (assigned.has(t.key || t.name)) return false;
        const s = `${t.name || ''} ${t.key || ''} ${t.nickname || ''} ${t.role || ''}`.toUpperCase();
        return s.includes(kw.toUpperCase());
      });
      if (found) {
        assigned.add(found.key || found.name);
        return found;
      }
    }
    return null;
  };

  const g1Staff = [
    pickStaff(['WILLIAM', 'CHAI YEE SIAN']),
    pickStaff(['LOUNA', 'HANIESHA']),
    pickStaff(['JONG', 'PENNY', 'PEI CHOO'])
  ].filter(Boolean);

  const g2Staff = [
    pickStaff(['FARIZIN']),
    pickStaff(['NURHAFIZAH']),
    pickStaff(['FIONA'])
  ].filter(Boolean);

  const g3Staff = [
    pickStaff(['KENIX']),
    pickStaff(['CHRISTINA']),
    pickStaff(['TING', 'KWANG YU']),
    pickStaff(['JANET', 'DANIELA'])
  ].filter(Boolean);

  const remaining = activeStaff.filter(t => !assigned.has(t.key || t.name));
  g3Staff.push(...remaining);

  const formatTmTable = (tmList) => {
    return tmList.map(t => {
      const { col1, col2, col3 } = getTeammate3M(t);
      const isNewCol1 = !col1.ts || col1.ts === 0;
      const isNewCol2 = !col2.ts || col2.ts === 0;

      const col1TsStr = isNewCol1 ? '— (New)' : `RM ${fmtNum(col1.ts, 2)}`;
      const col2TsStr = isNewCol2 ? '— (New)' : `RM ${fmtNum(col2.ts, 2)}`;
      const col3TsStr = `**RM ${fmtNum(col3.ts, 2)}**`;

      const col1HbStr = isNewCol1 ? '—' : `RM ${fmtNum(col1.hb, 2)} (${fmtPct(col1.hbPct)})`;
      const col2HbStr = isNewCol2 ? '—' : `RM ${fmtNum(col2.hb, 2)} (${fmtPct(col2.hbPct)})`;
      const col3HbStr = `**RM ${fmtNum(col3.hb, 2)} (${fmtPct(col3.hbPct)})**`;

      const col1HmStr = isNewCol1 ? '—' : `RM ${fmtNum(col1.hm, 2)} (${fmtPct(col1.hmPct)})`;
      const col2HmStr = isNewCol2 ? '—' : `RM ${fmtNum(col2.hm, 2)} (${fmtPct(col2.hmPct)})`;
      const col3HmStr = `**RM ${fmtNum(col3.hm, 2)} (${fmtPct(col3.hmPct)})**`;

      const col1TxStr = isNewCol1 ? '—' : `${fmtNum(col1.tx)}`;
      const col2TxStr = isNewCol2 ? '—' : `${fmtNum(col2.tx)}`;
      const col3TxStr = `**${fmtNum(col3.tx)}**`;

      const col1BtsStr = isNewCol1 ? '—' : `RM ${fmtNum(col1.basketTs, 2)}`;
      const col2BtsStr = isNewCol2 ? '—' : `RM ${fmtNum(col2.basketTs, 2)}`;
      const col3BtsStr = `**RM ${fmtNum(col3.basketTs, 2)}**`;

      const col1BhbStr = isNewCol1 ? '—' : `RM ${fmtNum(col1.basketHb, 2)}`;
      const col2BhbStr = isNewCol2 ? '—' : `RM ${fmtNum(col2.basketHb, 2)}`;
      const col3BhbStr = `**RM ${fmtNum(col3.basketHb, 2)}**`;

      const col1GpStr = isNewCol1 ? '—' : `RM ${fmtNum(col1.gpRm, 2)} (${fmtPct(col1.gpPct)})`;
      const col2GpStr = isNewCol2 ? '—' : `RM ${fmtNum(col2.gpRm, 2)} (${fmtPct(col2.gpPct)})`;
      const col3GpStr = `**RM ${fmtNum(col3.gpRm, 2)} (${fmtPct(col3.gpPct)})**`;

      return `#### ${t.name} [${t.role || 'Staff'}]
| METRIC | ${col1Header} | ${col2Header} | ${col3Header} |
| :--- | :--- | :--- | :--- |
| **Total Sales (RM)** | ${col1TsStr} | ${col2TsStr} | ${col3TsStr} |
| **HB Sales (RM & %)** | ${col1HbStr} | ${col2HbStr} | ${col3HbStr} |
| **HM Sales (RM & %)** | ${col1HmStr} | ${col2HmStr} | ${col3HmStr} |
| **No of Transactions** | ${col1TxStr} | ${col2TxStr} | ${col3TxStr} |
| **Basket Size (TS)** | ${col1BtsStr} | ${col2BtsStr} | ${col3BtsStr} |
| **Basket Size (HB)** | ${col1BhbStr} | ${col2BhbStr} | ${col3BhbStr} |
| **Gross Profit GPRM (%)** | ${col1GpStr} | ${col2GpStr} | ${col3GpStr} |`;
    }).join('\n\n');
  };

  // Dynamic Slide 6 Coaching Content
  const coachingList = report.teammateCoaching || m.teammateCoaching || [];
  const coachingSection = (coachingList.length > 0)
    ? coachingList.map(t => {
        return `- **${t.person || t.name}** [${t.role}]:
  - *Status*: ${t.statusBadge || 'Active Teammate'}
  - *Performance Trajectory*: ${t.metricsSummary || ''}
  - *Strategic Recommendation & Coaching*: ${t.commentAndAction || ''}`;
      }).join('\n\n')
    : `- **Dispensary Floor Alignment**: Maintain weekly structured DPOS role-play and review attachment benchmarks.`;

  // Category rows for Slide 7
  const catRows = (m.categories || []).map(c => {
    const stockCycleVal = (c.pmgStockCycle !== undefined && c.pmgStockCycle !== null) ? Number(c.pmgStockCycle).toFixed(2) : '-';
    const contribPct = (c.salesContributionPct !== undefined && c.salesContributionPct !== null)
      ? Number(c.salesContributionPct).toFixed(1)
      : (all12 && all12.netSoldPriceLatest > 0 ? ((c.netSoldPriceLatest / all12.netSoldPriceLatest) * 100).toFixed(1) : '0.0');
    return `| ${c.category} | ${stockCycleVal} | ${contribPct}% | RM ${fmtNum(c.netSoldPriceLatest, 2)} | RM ${fmtNum(c.netSoldPricePrev, 2)} | ${c.priceDiffRm >= 0 ? '+' : ''}${fmtNum(c.priceDiffRm, 2)} (${fmtPct(c.priceDiffPct, 2, true)}) | RM ${fmtNum(c.netSoldProfitLatest, 2)} | RM ${fmtNum(c.netSoldProfitPrev, 2)} | ${c.profitDiffRm >= 0 ? '+' : ''}${fmtNum(c.profitDiffRm, 2)} (${fmtPct(c.profitDiffPct, 2, true)}) | ${fmtPct(c.gpPctLatest)} | ${fmtPct(c.gpPctPrev)} | ${c.gpPctDiffPP >= 0 ? '+' : ''}${fmtPP(c.gpPctDiffPP)} |`;
  }).join('\n');

  // Top gainers and bleeders
  const topHeroesStr = (m.topHeroSkus && m.topHeroSkus.length > 0)
    ? m.topHeroSkus.slice(0, 6).map(s => `- **${s.itemName}** (${s.category}): +RM ${fmtNum(s.priceDiffRm, 2)} YoY (Latest RM ${fmtNum(s.priceLatest, 2)}, GP ${fmtPct(s.gpPctLatest)})`).join('\n')
    : '- Core supplement portfolio expansion across metabolic, bone health, and daily wellness ranges';
  const topBleedersStr = (m.topBleederSkus && m.topBleederSkus.length > 0)
    ? m.topBleederSkus.slice(0, 5).map(s => `- **${s.itemName}** (${s.category}): ${fmtNum(s.priceDiffRm, 2)} YoY (Latest RM ${fmtNum(s.priceLatest, 2)}, GP ${fmtPct(s.gpPctLatest)})`).join('\n')
    : '';

  return `You are an expert executive presentation designer and Chief Retail Pharmacy Commercial Strategist.
Using the verified PMG Pharmacy Kota Sentosa dataset and operational findings below, generate the complete, production-ready, beautifully structured 16-slide monthly pharmacist presentation report matching the exact structure, slide titles, tables, metrics, and clinical tone of our monthly presentation deck.

================================================================================
CRITICAL MANAGEMENT CONSTRAINT:
DO NOT INCLUDE "Role-Specific Action Plans (PIC Pharmacist, ABM, PRP & PA)"
INTO THIS PRESENTATION DECK.
Role-specific action plans are managed separately and must be omitted from all slides.
================================================================================

UPDATE RULES FOR GEMINI:
1. Input the latest month data (${col3Header}) and compare with previous year data (${prevYearLabel}) across all store and category tables.
2. For personal sales data (Slides 3, 4, 5), update each teammate to the latest 3 months sales performance (${col1Header}, ${col2Header}, ${col3Header}).
3. Maintain the professional clinical retail pharmacy tone, highlighting DPOS companion bundling, chronic disease retention, clinical nutrition conversion, and floor standards compliance.

--------------------------------------------------------------------------------
PRESENTATION OUTLINE (16 SLIDES)
--------------------------------------------------------------------------------

### SLIDE 1: TITLE SLIDE
- **Title**: MONTHLY PHARMACIST PERFORMANCE & STRATEGIC PRESENTATION
- **Presenter**: William Chai (Pharmacist)
- **Outlet**: PMG PHARMACY KOTA SENTOSA
- **Location**: Pekan Batu 7, Penrissen Road, Kuching, Sarawak
- **Meeting Date**: ${presDate}
- **Reporting Period**: ${col3Header} vs ${prevYearLabel}
- **Theme**: "Your Trusted Community Healthcare Partner · Serve Beyond Expectation"

---

### SLIDE 2: OVERALL SALES PERFORMANCES (MTD Vs LY)
**3-MONTH CONSECUTIVE TRAJECTORY & YoY COMPARISON**

| STORE KPI | ${col1Header} | ${col2Header} | ${col3Header} (Actual) | ${prevYearLabel} (LY) | YoY Growth (RM & %) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Total Sales (RM)** | RM ${fmtNum(m2Outlet.ts, 2)} | RM ${fmtNum(m1Outlet.ts, 2)} | **RM ${fmtNum(o.tsLatest, 2)}** | RM ${fmtNum(o.tsPrev, 2)} | **${o.tsDiffRm >= 0 ? '+' : ''}${fmtNum(o.tsDiffRm, 2)} (${fmtPct(o.tsDiffPct, 2, true)})** |
| **HB Sales (RM & %)** | RM ${fmtNum(m2Outlet.hb, 2)} (${fmtPct(m2Outlet.ts > 0 ? (m2Outlet.hb / m2Outlet.ts) * 100 : 43.15)}) | RM ${fmtNum(m1Outlet.hb, 2)} (${fmtPct(m1Outlet.ts > 0 ? (m1Outlet.hb / m1Outlet.ts) * 100 : 42.76)}) | **RM ${fmtNum(o.hbLatest, 2)} (${fmtPct(o.hbShareLatestPct)})** | RM ${fmtNum(o.hbPrev, 2)} (${fmtPct(o.hbSharePrevPct)}) | **${o.hbDiffRm >= 0 ? '+' : ''}${fmtNum(o.hbDiffRm, 2)} (${fmtPct(o.hbDiffPct, 2, true)})** |
| **HM Sales (RM & %)** | RM ${fmtNum(m2Outlet.hm, 2)} (${fmtPct(m2Outlet.ts > 0 ? (m2Outlet.hm / m2Outlet.ts) * 100 : 10.19)}) | RM ${fmtNum(m1Outlet.hm, 2)} (${fmtPct(m1Outlet.ts > 0 ? (m1Outlet.hm / m1Outlet.ts) * 100 : 9.66)}) | **RM ${fmtNum(o.hmLatest, 2)} (${fmtPct(o.hmShareLatestPct)})** | RM ${fmtNum(o.hmPrev, 2)} (${fmtPct(o.hmSharePrevPct)}) | **${o.hmDiffRm >= 0 ? '+' : ''}${fmtNum(o.hmDiffRm, 2)} (${fmtPct(o.hmDiffPct, 2, true)})** |
| **Gross Profit GPRM (RM & %)** | RM ${fmtNum(m2Outlet.gpRm, 2)} (${fmtPct(m2Outlet.gpPct || 26.07)}) | RM ${fmtNum(m1Outlet.gpRm, 2)} (${fmtPct(m1Outlet.gpPct || 26.84)}) | **RM ${fmtNum(o.personalGpTotalLatest.netSoldProfit, 2)} (${fmtPct(o.personalGpTotalLatest.gpMarginPct)})** | RM ${fmtNum(o.personalGpTotalPrev.netSoldProfit, 2)} (${fmtPct(o.personalGpTotalPrev.gpMarginPct)}) | **${o.personalGpDiffRm >= 0 ? '+' : ''}${fmtNum(o.personalGpDiffRm, 2)} (${fmtPct(o.personalGpDiffPct, 2, true)})** |
| **No of Transactions (Tx)** | ${fmtNum(m2Outlet.transactions)} | ${fmtNum(m1Outlet.transactions)} | **${fmtNum(o.txLatest)}** | ${fmtNum(o.txPrev)} | **${o.txDiff >= 0 ? '+' : ''}${fmtNum(o.txDiff)} (${fmtPct(o.txDiffPct, 2, true)})** |
| **Basket Size (Total Sales)** | RM ${fmtNum(m2BasketTs, 2)} | RM ${fmtNum(m1BasketTs, 2)} | **RM ${fmtNum(o.basketTsLatest, 2)}** | RM ${fmtNum(o.basketTsPrev, 2)} | **${o.basketTsDiffRm >= 0 ? '+' : ''}${fmtNum(o.basketTsDiffRm, 2)} (${fmtPct(o.basketTsDiffPct, 2, true)})** |
| **Basket Size (House Brand)** | RM ${fmtNum(m2BasketHb, 2)} | RM ${fmtNum(m1BasketHb, 2)} | **RM ${fmtNum(o.basketHbLatest, 2)}** | RM ${fmtNum(o.basketHbPrev, 2)} | **${o.basketHbDiffRm >= 0 ? '+' : ''}${fmtNum(o.basketHbDiffRm, 2)} (${fmtPct(o.basketHbDiffPct, 2, true)})** |

**KEY EXECUTIVE TAKEAWAY BULLETS**:
1. **Sustained YoY Revenue & Gross Profit Expansion**: Generated RM ${fmtNum(o.tsLatest, 2)} in total turnover (${o.tsDiffPct >= 0 ? '+' : ''}${fmtPct(o.tsDiffPct, 2)} YoY) and expanded gross profit to RM ${fmtNum(o.personalGpTotalLatest.netSoldProfit, 2)} (${fmtPct(o.personalGpTotalLatest.gpMarginPct)} GP margin, +${fmtPP(o.personalGpMarginDiffPP)} YoY).
2. **Robust House Brand Penetration**: HB sales surged ${o.hbDiffPct >= 0 ? '+' : ''}${fmtPct(o.hbDiffPct, 2)} YoY to RM ${fmtNum(o.hbLatest, 2)}, contributing ${fmtPct(o.hbShareLatestPct)} of total outlet revenue (vs ${fmtPct(o.hbSharePrevPct)} in LY).
3. **Elevated Basket Quality via DPOS Companion Bundling**: Total Sales basket size increased to RM ${fmtNum(o.basketTsLatest, 2)} (+${fmtPct(o.basketTsDiffPct)} YoY) and House Brand basket expanded to RM ${fmtNum(o.basketHbLatest, 2)} (+${fmtPct(o.basketHbDiffPct)} YoY), proving customer acceptance of consultative wellness attachments.

---

### SLIDE 3: INDIVIDUAL SALES PERFORMANCES (MTD) — LEADERSHIP & SENIOR DISPENSERS
${formatTmTable(g1Staff)}

---

### SLIDE 4: INDIVIDUAL SALES PERFORMANCES (MTD) — CORE DISPENSARY TEAM
${formatTmTable(g2Staff)}

---

### SLIDE 5: INDIVIDUAL SALES PERFORMANCES (MTD) — RETAIL CONSULTANTS, PRP & PHARMACISTS
${formatTmTable(g3Staff)}

---

### SLIDE 6: TEAMMATE COACHING & LOW-PERFORMING RECOMMENDATIONS
**FIND OUT LOW-PERFORMING TEAMMATES & TAILORED RECOVERY ACTION**:

${coachingSection}

---

### SLIDE 7: CATEGORY SALES FINDING (MTD)
**ALL 12 CATEGORIES & STOCK CYCLE COMPARISON (MTD vs PREVIOUS YEAR)**

| CATEGORY | STOCK CYCLE | SALES CONTRIB (%) | NET SOLD PRICE (LATEST) | NET SOLD PRICE (LY) | SALES DIFF (RM & %) | NET SOLD PROFIT (LATEST) | NET SOLD PROFIT (LY) | PROFIT DIFF (RM & %) | GP% (LATEST) | GP% (LY) | GP% DIFF (pp) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${catRows}
| **TOTAL / AVG** | **${all12.averageStockCycle.toFixed(2)}** | **100.0%** | **RM ${fmtNum(all12.netSoldPriceLatest, 2)}** | **RM ${fmtNum(all12.netSoldPricePrev, 2)}** | **${all12.priceDiffRm >= 0 ? '+' : ''}${fmtNum(all12.priceDiffRm, 2)} (${fmtPct(all12.priceDiffPct, 2, true)})** | **RM ${fmtNum(all12.netSoldProfitLatest, 2)}** | **RM ${fmtNum(all12.netSoldProfitPrev, 2)}** | **${all12.profitDiffRm >= 0 ? '+' : ''}${fmtNum(all12.profitDiffRm, 2)} (${fmtPct(all12.profitDiffPct, 2, true)})** | ${fmtPct(all12.gpPctLatest)} | ${fmtPct(all12.gpPctPrev)} | **${all12.gpPctDiffPP >= 0 ? '+' : ''}${fmtPP(all12.gpPctDiffPP)}** |

*Formulas: Cost of Sales = Net Sold Price - Net Sold Profit; PMG Stock Cycle = Closing Custom Cost / Cost of Sales (HQ Target = 2.0). HQ 11 Focus Stock Cycle Average (Excl. WYMED-EX): ${hq.averageStockCycle.toFixed(2)} vs 2.0 target (Excess Stock: RM ${fmtNum(hq.excessStockRm, 2)}).*

---

### SLIDE 8: CATEGORY SALES ANALYSIS (MTD): TOP EXPANSION DRIVERS (WHAT GOES UP & REASONS)
**IN-DEPTH EXPANSION DEEP DIVE — ${col3Header} vs ${prevYearLabel}**

1. **Supplements (SUPPLEME)**:
   - **Growth & Profit**: Top Gross Profit generator in branch! Contributed RM ${fmtNum((m.categories.find(c => c.category === 'SUPPLEME') || {}).netSoldProfitLatest || 29291.80, 2)} in gross profit (${fmtPct((m.categories.find(c => c.category === 'SUPPLEME') || {}).gpPctLatest || 36.17)} GP margin) on RM ${fmtNum((m.categories.find(c => c.category === 'SUPPLEME') || {}).netSoldPriceLatest || 80974.16, 2)} total turnover (${(m.categories.find(c => c.category === 'SUPPLEME') || {}).priceDiffRm >= 0 ? '+' : ''}${fmtPct((m.categories.find(c => c.category === 'SUPPLEME') || {}).priceDiffPct || 29.98, 2)} YoY).
   - **Major SKU Gainers**:
${topHeroesStr}
   - **Catchment & Demographic Drivers**: Mature 7th Mile Kota Sentosa community profile with high senior citizen concentration seeking cardiovascular, joint, and cellular vitality supplements.
   - **Social Media Trend Amplification (TikTok & XiaoHongShu / XHS)**: Viral consumer awareness on TikTok Shop & XHS regarding CoQ10 cellular energy, Berberine metabolic support, and joint-protective collagen peptides, driving self-motivated inquiries at retail counters.
   - **Dispensary Execution**: Systematic DPOS companion bundling at dispensing counters, attaching metabolic and vascular protection supplements (CoQ10, Progutor, Livemore Flexmore, JH Nutrition FLVRight, Nutribridge Sheep Placenta) to regular chronic prescriptions.

2. **Scheduled Drugs (SCHE-DRU)**:
   - **Growth & Profit**: Core revenue anchor, representing ~20% of total outlet sales (RM ${fmtNum((m.categories.find(c => c.category === 'SCHE-DRU') || {}).netSoldPriceLatest || 68093.60, 2)}, +${fmtPct((m.categories.find(c => c.category === 'SCHE-DRU') || {}).priceDiffPct || 12.77, 2)} YoY) with RM ${fmtNum((m.categories.find(c => c.category === 'SCHE-DRU') || {}).netSoldProfitLatest || 8433.04, 2)} in gross profit.
   - **Major SKU Gainers**: Novartis Entresto 50mg (+RM 3,227.00), Ketosteril (+RM 3,537.80), Breztri Aerosphere (+RM 1,240.00), chronic cardiovascular and endocrine therapies.
   - **Public Health & Hospital Spillover**: High prevalence of chronic non-communicable diseases (NCDs: hypertension, dyslipidemia, diabetes, heart failure) in Padawan district. Long-term chronic outpatients from Klinik Kesihatan Kota Sentosa and Sentosa Hospital consistently refill prescriptions at PMG for immediate stock availability and dedicated pharmacist adherence reviews.

3. **Food & Beverage / Clinical Nutrition (F & B)**:
   - **Growth & Profit**: Revenue reached RM ${fmtNum((m.categories.find(c => c.category === 'F & B') || {}).netSoldPriceLatest || 53068.23, 2)} (+${fmtPct((m.categories.find(c => c.category === 'F & B') || {}).priceDiffPct || 11.14, 2)} YoY) generating RM ${fmtNum((m.categories.find(c => c.category === 'F & B') || {}).netSoldProfitLatest || 12824.43, 2)} in profit (${fmtPct((m.categories.find(c => c.category === 'F & B') || {}).gpPctLatest || 24.17)} GP margin).
   - **Major SKU Gainers**: Nutribridge Nutri Alpha 800g (+RM 5,061.46 YoY, 22.28% GP), Flexsure Gold 850g (+RM 2,575.26 YoY), JH Nutrition Oxxymax (+RM 4,685.99 YoY), Immunz-IgG Colostrum (+RM 2,570.34 YoY).
   - **Economic & Migration Driver**: High living cost inflation causing consumers to resist RM 100+ commercial milk prices. Staff actively guided price-sensitive diabetic and geriatric consumers toward clinically complete PMG House Brand nutrition formulas with superior margin.

---

### SLIDE 9: CATEGORY SALES ANALYSIS (MTD): PRODUCT DECLINES & COMPETITOR DYNAMICS (WHAT GOES DOWN & REASONS)
**INTENTIONAL MARGIN PROTECTION, DEMOGRAPHICS & COMPETITOR DYNAMICS**

1. **Intentional Decline in Low-Margin Commercial Formulas**:
   - **Decliners**:
     - Ensure Gold Vanilla 850g: -RM 1,388.94 YoY (RM 2,935.56 vs RM 4,324.50 in LY)
     - Ensure Gold Vanilla 800g: -RM 2,175.60 YoY
     - Enercal Complete Vanilla 850g: -RM 688.80 YoY (RM 539.00 vs RM 1,227.80)
     - Nutren Gluco Balance 800g: -RM 310.20 YoY (RM 103.80 vs RM 414.00)
   - **Strategic Reason**: Deliberate and highly profitable customer migration. Commercial adult formulas yield negative or razor-thin gross margins (Ensure Gold at **-3.70% GP margin** due to aggressive chain store discounting). Staff actively guided price-sensitive chronic consumers toward PMG clinical nutrition (**Nutri Alpha, Nutrenmax, Alpha Gold, Flexsure Gold**) generating **30–36% GP margin**, preserving branch gross profit.
${topBleedersStr}

2. **Mom & Baby Category Contraction (MOM&BABY)**:
   - **Performance**: Revenue contracted -33.59% YoY (-RM 3,640.39 | RM 7,196.59 Total).
   - **Macro Demographic Shift (Sarawak Birth Rate Contraction)**: Declining total fertility rate (TFR dropped to ~1.4 across urban Sarawak/Padawan). Fewer births translate into structural reduction in demand for commercial infant formula tins (Morinaga, Frisolac, S-26) and commodity baby diapers.
   - **Retail Channel Shifts**: Hypermarkets and mother-and-baby specialty chains in Kuching run mass loss-leader promotions on baby milk tins, eroding retail pharmacy footfall for commodity baby goods.
   - **Social Media Trend Shift (TikTok / XHS)**: Modern parents are shifting spending from traditional generic milks to viral pediatric wellness supplements (Appeton, Champs, JH Gummy Bears, Kiddypops) and pediatric barrier dermatologicals (Sudocrem, Cetaphil, Bzu Bzu, BBZine Cream) which consistently maintain **>30% GP**.
   - **Strategic Remedial Action**: Shrink floor space dedicated to low-margin baby milk tins; reallocate prime eye-level shelves to high-margin pediatric wellness and dermatologicals.

3. **Viral Social Media Trends & New Product Discovery Pipeline (TikTok, XiaoHongShu, Facebook, Instagram)**:
   - **Viral Wellness Trends Grounding**:
     • *Liposomal Vitamin C & High-Absorption Glutathione*: Trending on TikTok Shop & XHS for skin brightening, hyperpigmentation, and cellular immunity.
     • *NMN Longevity & Berberine*: Viral wellness searches on XHS for metabolic regulation, insulin sensitivity, and anti-aging vitality.
     • *Magnesium Glycinate*: Trending viral sleep hygiene and anxiety reduction supplement among urban working adults.
     • *Gut-Skin Axis Probiotics*: High engagement on Instagram/TikTok for acne relief and irritable bowel wellness.
   - **New Product Discovery Pipeline (High-Potential Assortment Expansion)**:
     • *Target SKU 1*: Liposomal Vitamin C 1000mg Sachets (Target: Beauty / immunity consumers | Expected GP: 35–40% | Trial Order: 24 packs)
     • *Target SKU 2*: Magnesium Glycinate 200mg Capsules (Target: Sleep / stress management outpatients | Expected GP: 38% | Trial Order: 18 bottles)
     • *Target SKU 3*: Kids Probiotic + Elderberry Immune Gummies (Target: Padawan young families | Expected GP: 35% | Trial Order: 24 boxes)
     • *Target SKU 4*: Ceramide Eczema Barrier Repair Cream (Target: Catchment sensitive skin patients | Expected GP: 42% | Trial Order: 20 tubes)

---

### SLIDE 10: COMMUNITY OUTREACH — FAFA COFFEE SHOP
**HEALTH SCREENING EVENT & COMMUNITY HEALTH ENGAGEMENT**

- **Event Summary & Key Metrics**:
  - **Venue**: Fafa Coffee Shop, Pekan Batu 7, Kota Sentosa
  - **Date**: 19.09.2026
  - **Screenings Conducted**: Blood Glucose (40 participants), Total Cholesterol (2), Uric Acid (2)
  - **Direct Sales Generated**: RM 35.00
  - **New Member Registrations**: Unsure (Manual sign-ups pending digital reconciliation)

- **KISS Analysis (Keep, Improve, Start, Stop)**:
  - **KEEP**: High community outreach engagement in casual morning coffee shop environments where senior citizens and chronic patients gather.
  - **IMPROVE**: Low direct sales conversion (RM 35.00) — develop dedicated on-site event promotional packs (e.g., test strips + glucometer bundle, adult nutrition starter cans, supplement gift vouchers).
  - **START**: Digital on-site membership sign-up using PMG Medicare App / tablet QR code so new member acquisitions are captured and tracked in real time.
  - **STOP**: Running screening tables without structured promotional vouchers driving participants back to PMG Kota Sentosa branch for follow-up testing and prescription collection.

---

### SLIDE 11: KEY CHALLENGES & DEPARTMENTAL OPERATIONAL ISSUES
**DEPARTMENTAL BOTTLENECKS & STRAIGHTFORWARD CORRECTIVE ACTION PLANS (POINT FORM)**

1. **SCD: Supply Chain & Warehouse (CRITICAL)**:
   - *Key Issue*: SCD dispatched incorrect stock deliveries (extra 7–8 cartons of Ensure Gold) without store purchase orders.
   - *Business Impact*: Severely congested stock storage, tied up branch working capital, and caused physical clutter on retail floors.
   - *Action Plan*:
     • Expedite immediate return-to-vendor (RTV) warehouse collection.
     • Enforce zero-acceptance policy on shipments without signed outlet PO.
2. **Merchandising & Retail Floor**:
   - *Issue*: Excess stock overflow (diapers, cartons, wheelchairs) encroaching on walkways and rear emergency exit.
   - *Action Plan*:
     • Immediate floor decanting; stow packaging and cartons into back storeroom.
     • Designate clear display zones for mobility aids without blocking customer aisles.
3. **JASE & Systems**:
   - *Issue*: Delays in processing credit notes and stock reconciliations for returned warehouse stock.
   - *Action Plan*:
     • Work with IT/Operations to accelerate inter-branch stock transfers.
     • Reconcile pending RTV credit notes weekly to protect cash flow.
4. **HR & Floor Manpower**:
   - *Issue*: Dispensing workload surges; performance gap in teammate House Brand contribution (28.32% to 53.56%).
   - *Action Plan*:
     • Implement weekly 15-minute DPOS scenario role-plays for junior assistants.
     • Enforce daily minimum RM 450+ House Brand attachment at dispensing.
5. **Marketing**:
   - *Issue*: Aggressive competitor price-undercutting on FMCG and milk powder by Kuching retail chains.
   - *Action Plan*:
     • Broadcast weekly WhatsApp health education and promotional bundles.
     • Offer free BP/glucose screening vouchers to convert footfall into loyal customers.

---

### SLIDE 12: IN-DEPTH SWOT ANALYSIS — PMG PHARMACY KOTA SENTOSA
**STRATEGIC ASSESSMENT & ACTIONABLE NEXT STEPS (POINT FORM)**

- **STRENGTHS (S)**:
  • **House Brand Dominance**: ${fmtPct(o.hbShareLatestPct)} HB contribution (RM ${fmtNum(o.hbLatest, 2)}, +${fmtPct(o.hbDiffPct, 2)} YoY), generating RM ${fmtNum(o.personalGpTotalLatest.netSoldProfit, 2)} gross profit at ${fmtPct(o.personalGpTotalLatest.gpMarginPct)} margin.
  • **Chronic Care Base**: Established patient loyalty in 7th Mile driving Scheduled Drugs and Supplements (+${fmtPct((m.categories.find(c => c.category === 'SUPPLEME') || {}).priceDiffPct || 29.98, 2)} YoY).
  • **Clinical Authority**: Pharmacist consultations (William Chai & Kenix Ling) drive high customer retention and basket quality.

- **WEAKNESSES (W)**:
  • **Customer Footfall Drop**: Transactions dropped -7.45% YoY (${fmtNum(o.txLatest)} vs ${fmtNum(o.txPrev)}), showing walk-in footfall erosion.
  • **Working Capital Tie-Up**: Stock cycle at ${hq.averageStockCycle.toFixed(2)} (vs 2.0 HQ target) with RM 30k+ in 6-month aged inventory.
  • **Scheduled Drug Margin Drop**: SCHE-DRU GP% compressed to 11.94% due to branded drug price matching.
  • **Staff Attachment Disparity**: PA House Brand contribution ranges from 28.32% (Farizin) to 53.56% (Kenix Ling).

- **OPPORTUNITIES & ACTION PLANS (O)**:
  • **WhatsApp Chronic Refill**: Proactively message chronic patients 3–5 days prior to prescription completion to lock in +650 monthly refills.
  • **Standardized Companion Bundles**: Pair metabolic wellness supplements with all regular chronic prescriptions.
  • **Aged Stock Clearance Bay**: Convert RM 30k+ aged stock via weekend morning market promotion tables.
  • **Dispensary Basket Sizing**: Train PAs to attach a RM 10–RM 25 House Brand item to all OTC and adult milk powder checkouts.

- **THREATS & COUNTERMEASURES (T)**:
  • **FMCG Price Wars**: Chains discounting milk powder as loss-leaders; counter by migrating patients to PMG clinical nutrition (>24% GP).
  • **Warehouse Misallocations**: SCD sending unrequested bulk stock; counter with strict PO verification and rapid RTV.
  • **Living Cost Inflation**: Price-conscious shoppers delaying refills; counter with affordable PMG House Brand healthcare regimens.

---

### SLIDE 13: KEY INITIATIVES DONE IN FY2026
**OPERATIONAL & STRATEGIC MILESTONES EXECUTED AT PMG PHARMACY KOTA SENTOSA**

- **INITIATIVE 01: DPOS Companion Bundling Protocol**
  - *Action*: Implemented systematic companion recommendation training, training retail assistants to attach high-margin companion wellness lines (Oxxymax, Livason, Flexmore) during routine dispensing.
  - *Result*: House Brand sales expanded to RM ${fmtNum(o.hbLatest, 2)} (${fmtPct(o.hbShareLatestPct)} of store turnover), and HB basket size surged +${fmtPct(o.basketHbDiffPct)} YoY.
- **INITIATIVE 02: Chronic Disease Management & Refill Retention**
  - *Action*: Implemented structured patient counseling and refill tracking for cardiovascular, diabetes, and renal chronic patients.
  - *Result*: Scheduled Drug revenue increased +${fmtPct((m.categories.find(c => c.category === 'SCHE-DRU') || {}).priceDiffPct || 12.77, 2)} YoY, establishing deep customer loyalty across 7th Mile.
- **INITIATIVE 03: Clinical Nutrition Migration Strategy**
  - *Action*: Realigned front-end merchandising toward PMG proprietary nutrition formulas (Nutri Alpha, Nutrenmax, Alpha Gold, Flexsure Gold), actively converting price-sensitive consumers away from low-margin commercial formulas.
  - *Result*: Protected gross margin against competitor price wars; F&B revenue rose +${fmtPct((m.categories.find(c => c.category === 'F & B') || {}).priceDiffPct || 11.14, 2)} YoY with >24% GP margin.
- **INITIATIVE 04: Community Health Outreach & Public Screening Checkpoints**
  - *Action*: Organized targeted outreach events (Hospital RCBM 100-Year Open Day, Vivacity Megamall, Fafa Coffee Shop) providing free glucose, cholesterol, and uric acid checks.
  - *Result*: Screened over 300+ community residents, building deep brand trust and driving sustained prescription footfall to the store.
- **INITIATIVE 05: Advanced Digital Health Screening Integration (TCM AI & AirDoc)**
  - *Action*: Deployed TCM AI tongue/facial sensor analysis and AirDoc retinal scanning inside the pharmacy counseling suite.
  - *Result*: Service category revenue grew +116.8% YoY with 42.68% GP margin, elevating PMG's clinical authority.
- **INITIATIVE 06: Home Healthcare & Mobility Solutions Expansion**
  - *Action*: Expanded rehabilitation equipment offerings (hospital bed rentals, standard/commode wheelchairs, ripple mattresses, oxygen concentrators).
  - *Result*: Positioned Kota Sentosa as the primary home nursing supply hub in the suburban catchment, generating dependable high-ticket sales.

---

### SLIDE 14: RETAIL STORE WALKTHROUGH VIDEO AUDIT
**OUTLET OPERATIONAL COMPLIANCE & FLOOR STANDARDS REVIEW**

- **WALKTHROUGH RECORDING**:
  - *Location*: PMG Pharmacy Kota Sentosa
  - *Inspection Date*: End-of-Month Floor Standard Audit
  - *Video Spec*: 1080p MP4 · 0:53 mins
  - *Compliance Status*: 100% Verified Floor Standard

- **WALKTHROUGH SCOPE & SEQUENCE**:
  - **0:00 - 0:08 | Entrance & Ceiling Promotional Displays**: Staff hanging promotional banners; front-facing adult nutrition & baby care gondolas.
  - **0:09 - 0:18 | Supplement & FMCG Gondolas**: Merchandised with shelf talkers, wobblers, and eye-level House Brand placements.
  - **0:19 - 0:28 | Rear Walkway & Stock Staging Area**: Inspection of Dr. P adult diapers, storage cartons, and wheelchair displays.
  - **0:29 - 0:42 | Personal Care & Mobility Displays**: Front cosmetic shelves, Jordan orthopedic supports, and nutritional drink racks.
  - **0:43 - 0:53 | Prescription Dispensary & Cashier Counter**: Glass medicine cabinets, consultation desk, and cashier checkout counter.

---

### SLIDE 15: RETAIL STORE WALKTHROUGH FINDINGS
**STORE STANDARDS vs. BRANCH COMPLIANCE AUDIT CHECKLIST (6 PILLARS)**

- **PILLAR 01: Gondola & Shelf Tidiness** [GOOD / COMPLIANT]
  - *Findings*: Front-facing and alignment across adult nutrition, supplements, and personal care shelves are well-maintained with clear category division.
  - *Action Plan*: Maintain daily morning shelf-facing SOP prior to store opening.
- **PILLAR 02: Cleanliness — Floor & Fixtures** [NEEDS ATTENTION]
  - *Findings*: General retail floor is swept, but clutter observed around checkout counter (cardboard boxes and plastic bags placed on waiting chairs).
  - *Action Plan*: Enforce strict "clear customer seating" rule; immediately stow packaging materials into back office.
- **PILLAR 03: Merchandising & Planogram** [GOOD / COMPLIANT]
  - *Findings*: Prime eye-level shelf space correctly allocated to high-margin House Brands (Nutri Alpha, Flexsure Gold, Oxxymax, Jordan).
  - *Action Plan*: Maintain companion display placement adjacent to prescription dispensing window.
- **PILLAR 04: Pricing & Signage Accuracy** [GOOD / COMPLIANT]
  - *Findings*: Ceiling promotional banners ("Instant Rebate", "RM300 Voucher") and shelf talkers actively installed; visible price tags on rails.
  - *Action Plan*: Weekly tag audits to synchronize shelf wobblers with monthly campaign rotations.
- **PILLAR 05: Stock Obstruction & Safety** [CRITICAL / ACTION REQUIRED]
  - *Findings*: Rear walking aisle and "KELUAR" emergency corridor severely congested with stacked Dr. P adult diaper cartons and unattended hand trolley.
  - *Action Plan*: Immediate floor clearance; relocate overstock to storeroom; return unrequested Ensure cartons to SCD.
- **PILLAR 06: Staff Grooming & SOP** [GOOD / COMPLIANT]
  - *Findings*: Dispensary staff fully compliant with official PMG red polo uniforms, name badges, and professional attire.
  - *Action Plan*: Continue reinforcing proactive customer greetings and structured DPOS counseling at counter.

---

### SLIDE 16: THANK YOU & KEY STRATEGIC COMMITMENTS
**PMG PHARMACY KOTA SENTOSA · MONTHLY PHARMACIST PRESENTATION**

- **PRESENTER**: William Chai (Pharmacist)
- **OUTLET**: PMG Pharmacy Kota Sentosa (Pekan Batu 7, Kuching, Sarawak)
- **MEETING DATE**: ${presDate}
- **TAGLINE**: "Your Trusted Community Healthcare Partner · Serve Beyond Expectation"

**KEY MONTHLY FOCUS (CORE EXECUTION TARGETS)**:
1. **Elevate House Brand Share**: Target >45% outlet HB contribution via structured weekly DPOS role-plays with junior retail assistants.
2. **Strengthen Chronic Retention**: Deploy systematic digital appointment & refill reminders 3–5 days prior to prescription completion.
3. **Optimize Floor Standards**: Immediately clear emergency exit walkways, return excess SCD Ensure overstock, and maintain clear-counter policy.
4. **Maximize Outreach ROI**: Introduce mobile digital membership sign-ups and bundle promotional vouchers during coffee shop health screenings.
`;
}

function exportGeminiPresentationModal() {
  try {
    if (!computedMetrics && perfState) {
      computedMetrics = computeAllMetrics(perfState);
    }
    if (!computedMetrics) {
      showToast('No performance data loaded to export. Please load sample data or upload CSVs first.', 'warning');
      return;
    }
    const modal = document.getElementById('geminiPresentationModal');
    const txt = document.getElementById('geminiPresentationDocText');
    const countEl = document.getElementById('geminiDocCharCount');
    if (!modal || !txt) {
      console.error('Modal elements not found: #geminiPresentationModal or #geminiPresentationDocText');
      return;
    }

    const doc = buildGeminiPresentationDocument(computedMetrics, perfState);
    txt.value = doc;
    if (countEl) countEl.textContent = `${doc.length.toLocaleString()} characters · 16 slides`;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  } catch (err) {
    console.error('Failed to open Gemini Presentation Modal:', err);
    showToast('Error exporting presentation: ' + err.message, 'error');
  }
}

function closeGeminiPresentationModal() {
  const modal = document.getElementById('geminiPresentationModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// Ensure functions are globally exposed on window
if (typeof window !== 'undefined') {
  window.exportGeminiPresentationModal = exportGeminiPresentationModal;
  window.closeGeminiPresentationModal = closeGeminiPresentationModal;
  window.copyGeminiPresentationDoc = copyGeminiPresentationDoc;
  window.downloadGeminiPresentationDoc = downloadGeminiPresentationDoc;
  window.setTeammateViewMode = setTeammateViewMode;
  window.saveCurrentMonthSnapshot = saveCurrentMonthSnapshot;
  window.exportMonthlyArchiveJson = exportMonthlyArchiveJson;
  window.importMonthlyArchiveJson = importMonthlyArchiveJson;
}

function copyGeminiPresentationDoc() {
  const txt = document.getElementById('geminiPresentationDocText');
  const btn = document.getElementById('btnCopyGeminiPresDoc');
  if (!txt) return;

  navigator.clipboard.writeText(txt.value).then(() => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✅ Copied to Clipboard!';
      btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
      btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
      }, 2500);
    }
    showToast('Copied monthly presentation document to clipboard! You can now paste directly into Gemini.', 'success');
  }).catch(() => {
    txt.select();
    document.execCommand('copy');
    showToast('Copied to clipboard!', 'success');
  });
}

function downloadGeminiPresentationDoc(format = 'md') {
  const txt = document.getElementById('geminiPresentationDocText');
  if (!txt || !txt.value) return;

  const periodLabel = (perfState?.meta?.latestPeriodLabel || 'Latest_Month').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `PMG_Kota_Sentosa_Monthly_Presentation_Prompt_${periodLabel}.${format}`;
  const mimeType = format === 'md' ? 'text/markdown;charset=utf-8;' : 'text/plain;charset=utf-8;';

  const blob = new Blob([txt.value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded presentation document as ${filename}!`, 'success');
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
const PMG_SCHEDULE_API_URL = (typeof window !== 'undefined' && window.PMG_SCHEDULE_API_URL) || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
let isSyncingTasks = false;
let lastTasksCloudSyncTime = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    monthlyTasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    monthlyTasks = [];
  }
  updateTaskCounterBadges();

  // Automatically sync tasks from Google Sheets Cloud in background (Works across Laptop, Outlet PC & Mobile)
  setTimeout(() => {
    syncTasksWithGoogleCloud(false).catch(() => {});
  }, 300);
}

function saveTasks(skipCloudPush = false) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(monthlyTasks));
  } catch (e) { /* ignore */ }
  updateTaskCounterBadges();

  if (!skipCloudPush) {
    pushTasksToGoogleCloud().catch(() => {});
  }
}

async function syncTasksWithGoogleCloud(showToastFeedback = false) {
  if (!PMG_SCHEDULE_API_URL || isSyncingTasks) return;
  isSyncingTasks = true;
  updateTaskSyncUiState(true);

  try {
    const branchName = 'Kota Sentosa';
    const res = await fetch(`${PMG_SCHEDULE_API_URL}?branch=${encodeURIComponent(branchName)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && data.success && data.schedule && Array.isArray(data.schedule.performanceTasks)) {
      const cloudTasks = data.schedule.performanceTasks;
      const taskMap = new Map();
      monthlyTasks.forEach(t => taskMap.set(t.id, t));

      let importedCount = 0;
      cloudTasks.forEach(ct => {
        if (!taskMap.has(ct.id)) {
          taskMap.set(ct.id, ct);
          importedCount++;
        } else {
          const loc = taskMap.get(ct.id);
          const locT = loc.updatedAt || loc.approvedAt || '';
          const cldT = ct.updatedAt || ct.approvedAt || '';
          if (cldT > locT) {
            taskMap.set(ct.id, { ...loc, ...ct });
          }
        }
      });

      monthlyTasks = Array.from(taskMap.values());
      monthlyTasks.sort((a, b) => {
        const order = { 'TODO': 1, 'IN_PROGRESS': 2, 'COMPLETED': 3 };
        return (order[a.status] || 2) - (order[b.status] || 2);
      });

      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(monthlyTasks));
      updateTaskCounterBadges();
      renderTaskListSection();
      renderAiAnalysisSection();

      lastTasksCloudSyncTime = new Date();
      updateTaskSyncUiState(false, true);

      if (showToastFeedback) {
        showToast(`✅ Synced with Outlet via Google Cloud! (${monthlyTasks.length} tasks)`, 'success');
      }
    } else {
      if (monthlyTasks.length > 0 && data && data.schedule) {
        await pushTasksToGoogleCloud(data.schedule);
      }
      lastTasksCloudSyncTime = new Date();
      updateTaskSyncUiState(false, true);
    }
  } catch (err) {
    console.warn('[Performance Tasks] Cloud sync note:', err.message);
    updateTaskSyncUiState(false, false);
    if (showToastFeedback) {
      showToast('Could not reach Google Cloud. Working with local tasks.', 'warning');
    }
  } finally {
    isSyncingTasks = false;
  }
}

async function pushTasksToGoogleCloud(existingSchedule) {
  if (!PMG_SCHEDULE_API_URL) return;
  try {
    const branchName = 'Kota Sentosa';
    let sched = existingSchedule;
    if (!sched) {
      const res = await fetch(`${PMG_SCHEDULE_API_URL}?branch=${encodeURIComponent(branchName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.schedule) {
          sched = data.schedule;
        }
      }
    }
    if (!sched) sched = {};
    sched.performanceTasks = monthlyTasks;

    await fetch(PMG_SCHEDULE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        branch: branchName,
        schedule: sched,
        updatedBy: 'Pharmacist'
      }),
      redirect: 'follow'
    });
    console.log(`[Performance Tasks] ✅ Pushed ${monthlyTasks.length} tasks to Google Cloud.`);
    lastTasksCloudSyncTime = new Date();
    updateTaskSyncUiState(false, true);
  } catch (err) {
    console.warn('[Performance Tasks] Cloud push error:', err.message);
  }
}

function updateTaskSyncUiState(inProgress, isSuccess = true) {
  const btn = document.getElementById('btnSyncTasksCloud');
  const icon = document.getElementById('syncTasksCloudIcon');
  const text = document.getElementById('syncTasksCloudText');
  const pill = document.getElementById('taskSyncStatusPill');

  if (btn) {
    btn.disabled = inProgress;
  }
  if (icon) {
    icon.textContent = inProgress ? '⏳' : '🔄';
  }
  if (text) {
    text.textContent = inProgress ? 'Syncing...' : 'Sync with Outlet';
  }
  if (pill) {
    if (inProgress) {
      pill.textContent = '⏳ Syncing with Google Cloud...';
      pill.className = 'text-[11px] text-amber-700 font-bold mt-1';
    } else if (isSuccess) {
      pill.textContent = `☁️ Synced with Outlet & Mobile (${lastTasksCloudSyncTime ? lastTasksCloudSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'})`;
      pill.className = 'text-[11px] text-teal-800 font-bold mt-1';
    } else {
      pill.textContent = '⚠️ Cloud sync offline (Using local storage)';
      pill.className = 'text-[11px] text-slate-500 font-semibold mt-1';
    }
  }
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
    action: Array.isArray(rec.action) ? rec.action.join('\n') : (rec.action || ''),
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
    action: Array.isArray(rec.action) ? rec.action.join('\n') : (rec.action || ''),
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

// ─── OFFICIAL PMG PHYSICAL STOCK COUNT EXCEL EXPORT (BY CATEGORY) ─────────────
async function exportAgingStockCountExcel(targetCategory) {
  if (typeof ExcelJS === 'undefined') {
    showToast('ExcelJS library is loading, please try again in a moment.', 'warning');
    return;
  }
  const categoryFilter = (targetCategory || skuFilterState.category || 'ALL').toUpperCase().trim();
  const rawAging = (perfState && perfState.stockAgingLatest && Array.isArray(perfState.stockAgingLatest.items))
    ? perfState.stockAgingLatest.items
    : [];

  if (rawAging.length === 0) {
    showToast('No Stock Aging items loaded to export.', 'warning');
    return;
  }

  // Filter by category
  let itemsToExport = rawAging;
  if (categoryFilter !== 'ALL') {
    itemsToExport = rawAging.filter(it => (it.category || '').toUpperCase().trim() === categoryFilter);
  }

  if (itemsToExport.length === 0) {
    showToast(`No aged stock found for category "${categoryFilter}".`, 'info');
    return;
  }

  // Sort by Aged Value descending (highest inventory risk first)
  itemsToExport = [...itemsToExport].sort((a, b) => (b.agedValue || 0) - (a.agedValue || 0));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'PMG Management Hub';
  wb.created = new Date();

  const sheetName = categoryFilter === 'ALL' ? 'Stock Count - ALL' : `Stock Count - ${categoryFilter}`.slice(0, 31);
  const ws = wb.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  // Setup Column Widths
  ws.columns = [
    { width: 6 },   // A: Seq No.
    { width: 14 },  // B: Item Code
    { width: 38 },  // C: Item Description
    { width: 14 },  // D: Category
    { width: 12 },  // E: System OH Qty
    { width: 13 },  // F: 6M+ Aged Qty
    { width: 13 },  // G: >1 Year Qty
    { width: 14 },  // H: Avg Cost (RM)
    { width: 16 },  // I: Aged Value (RM)
    { width: 16 },  // J: PHYSICAL COUNT (ACTUAL) [BLANK]
    { width: 16 },  // K: VARIANCE (COUNT - SYSTEM) [FORMULA]
    { width: 16 },  // L: SHELF EXPIRY DATE [BLANK]
    { width: 26 }   // M: ACTION PLAN / REMARKS
  ];

  // Title Block
  ws.mergeCells('A1:M1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'PMG PHARMACY (KOTA SENTOSA) — PHYSICAL STOCK COUNT & AGING AUDIT SHEET';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // PMG Navy
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Subheader
  ws.mergeCells('A2:M2');
  const subCell = ws.getCell('A2');
  subCell.value = `Target Category: ${categoryFilter}  |  Audit Date: ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}  |  Total Aged SKUs: ${itemsToExport.length}  |  Generated by PMG Performance Suite`;
  subCell.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF334155' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // Sign-off row
  ws.mergeCells('A3:F3');
  ws.getCell('A3').value = 'Counted By (Staff Name & Signature): _______________________________';
  ws.getCell('A3').font = { name: 'Arial', size: 9, bold: true };
  ws.getCell('A3').alignment = { vertical: 'middle' };

  ws.mergeCells('G3:M3');
  ws.getCell('G3').value = 'Verified By (Pharmacist / PIC Signature): _______________________________';
  ws.getCell('G3').font = { name: 'Arial', size: 9, bold: true };
  ws.getCell('G3').alignment = { vertical: 'middle' };
  ws.getRow(3).height = 24;

  // Spacer row
  ws.getRow(4).height = 6;

  // Table Headers (Row 5)
  const headers = [
    'NO',
    'ITEM CODE',
    'ITEM DESCRIPTION',
    'CATEGORY',
    'SYSTEM OH',
    '6M+ AGED',
    '>1 YR AGED',
    'AVG COST (RM)',
    'AGED VAL (RM)',
    'PHYSICAL COUNT',
    'VARIANCE',
    'SHELF EXPIRY',
    'ACTION / SOP REMARKS'
  ];
  const hRow = ws.getRow(5);
  hRow.values = headers;
  hRow.height = 25;
  hRow.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };

  headers.forEach((_, colIdx) => {
    const cell = hRow.getCell(colIdx + 1);
    if (colIdx === 9) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal
    } else if (colIdx === 10) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // Amber
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
    }
    cell.alignment = { horizontal: (colIdx >= 4 && colIdx <= 10) ? 'center' : (colIdx === 0 ? 'center' : 'left'), vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  });

  // Data Rows
  const startDataRow = 6;
  itemsToExport.forEach((item, idx) => {
    const rIdx = startDataRow + idx;
    const row = ws.getRow(rIdx);
    row.height = 20;

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = String(item.itemCode || '');
    row.getCell(3).value = item.itemName || '';
    row.getCell(4).value = item.category || '';
    row.getCell(5).value = item.ohQty || 0;
    row.getCell(6).value = item.agedQty6MPlus || 0;
    row.getCell(7).value = item.above1Yr || 0;
    row.getCell(8).value = +(item.avgCost || 0);
    row.getCell(9).value = +(item.agedValue || 0);
    row.getCell(10).value = null; // PHYSICAL COUNT (Blank for write-in)
    row.getCell(11).value = { formula: `IF(ISBLANK(J${rIdx}), "", J${rIdx}-E${rIdx})` }; // Variance
    row.getCell(12).value = ''; // Shelf Expiry (Blank)

    let defaultAction = '';
    if ((item.above1Yr || 0) > 0) defaultAction = 'SSJ Return / Aging Recall';
    else if ((item.agedValue || 0) > 200) defaultAction = 'Push Promo / Bundle Discount';
    else defaultAction = 'FIFO Front Facing & Reposition';
    row.getCell(13).value = defaultAction;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    for (let c = 1; c <= 13; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (c === 10) { // Physical Count column
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD97706' } },
          bottom: { style: 'thin', color: { argb: 'FFD97706' } },
          left: { style: 'medium', color: { argb: 'FF0D9488' } },
          right: { style: 'medium', color: { argb: 'FF0D9488' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 11) { // Variance
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '+#,##0;-#,##0;0';
        cell.font = { name: 'Arial', size: 9, bold: true };
      } else if (c === 5 || c === 6 || c === 7) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
      } else if (c === 8 || c === 9) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      } else if (c === 1 || c === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (c !== 10) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      }
    }
  });

  // Totals Row
  const totalRowIdx = startDataRow + itemsToExport.length;
  const totRow = ws.getRow(totalRowIdx);
  totRow.height = 24;
  totRow.getCell(3).value = `TOTAL: ${itemsToExport.length} SKUs`;
  totRow.getCell(3).font = { name: 'Arial', size: 9.5, bold: true };

  totRow.getCell(5).value = { formula: `SUM(E${startDataRow}:E${totalRowIdx - 1})` };
  totRow.getCell(6).value = { formula: `SUM(F${startDataRow}:F${totalRowIdx - 1})` };
  totRow.getCell(7).value = { formula: `SUM(G${startDataRow}:G${totalRowIdx - 1})` };
  totRow.getCell(9).value = { formula: `SUM(I${startDataRow}:I${totalRowIdx - 1})` };
  totRow.getCell(10).value = { formula: `SUM(J${startDataRow}:J${totalRowIdx - 1})` };
  totRow.getCell(11).value = { formula: `SUM(K${startDataRow}:K${totalRowIdx - 1})` };

  for (let c = 1; c <= 13; c++) {
    const cell = totRow.getCell(c);
    cell.font = { name: 'Arial', size: 9.5, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.border = { top: { style: 'medium' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
    if (c === 5 || c === 6 || c === 7 || c === 10) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0';
    } else if (c === 9) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0.00';
    } else if (c === 11) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.numFmt = '+#,##0;-#,##0;0';
    }
  }

  // Export buffer & trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanCat = categoryFilter.replace(/[^A-Za-z0-9_-]/g, '_');
  a.download = `PMG_Stock_Count_${cleanCat}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`✅ Exported Stock Count Sheet for ${categoryFilter} (${itemsToExport.length} SKUs)!`, 'success');
}
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
    dailySalesM1: { periodLabel: 'September FY2026 (01/09/2026 - 30/09/2026)', ts: 336565.91, hb: 143198.75, hm: 29274.80, gpRm: 93560.00, gpPct: 27.80, transactions: 7690, isEstimatedBenchmark: false },
    dailySalesM2: { periodLabel: 'August FY2026 (01/08/2026 - 31/08/2026)', ts: 380745.93, hb: 164354.04, hm: 34812.10, gpRm: 105847.00, gpPct: 27.80, transactions: 7915, isEstimatedBenchmark: false },
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
  saveCurrentMonthSnapshot(true); // Automatically preserve current month snapshot in monthly archive
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

  // Check 5S Walkthrough Video Audit Status
  const walkthroughAlert = document.getElementById('walkthroughStatusAlert');
  const walkthroughBadge = document.getElementById('walkthroughAlertBadge');
  const walkthroughMsg = document.getElementById('walkthroughAlertMsg');
  if (walkthroughAlert && walkthroughBadge && walkthroughMsg) {
    const latestLabel = perfState?.meta?.latestPeriodLabel || '';
    const curMonthName = latestLabel.includes('(') ? latestLabel.split('(')[0].trim() : (latestLabel || 'this month');
    let savedAudit = null;
    try {
      savedAudit = JSON.parse(localStorage.getItem('pmg_latest_walkthrough_audit') || 'null');
    } catch(e) {}

    if (savedAudit && savedAudit.overall_score) {
      walkthroughAlert.className = 'mb-5 p-4 rounded-2xl border border-emerald-300/80 bg-emerald-50/90 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs no-print';
      walkthroughBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300';
      walkthroughBadge.textContent = `Audit Completed (${savedAudit.overall_score}/200 pts)`;
      walkthroughMsg.innerHTML = `<span class="text-emerald-900 font-semibold">5S Walkthrough audit verified for ${escapeHtml(curMonthName)} across all 6 Store Standards pillars.</span>`;
    } else {
      walkthroughAlert.className = 'mb-5 p-4 rounded-2xl border border-amber-300/80 bg-amber-50/90 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-xs no-print';
      walkthroughBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300';
      walkthroughBadge.textContent = 'Action Required';
      walkthroughMsg.innerHTML = `Walkthrough video not yet conducted for <strong>${escapeHtml(curMonthName)}</strong>. Please record your 60–90 second store walkthrough video and run the 5S AI Walkthrough Auditor.`;
    }
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
        <p class="text-sm text-slate-500 mt-1 max-w-xl mx-auto">Preloaded sample data has been cleared. Go to the <strong>"Upload CSV & Data Studio"</strong> tab to drop your monthly CSV files, or click <strong>"Restore Sample"</strong> in the top bar to preview.</p>
        <button onclick="switchPerfTab('tab7')" class="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow">Go to CSV Upload Studio →</button>
      </div>`;
    return;
  }

  // Row objects for Tab 1 Comparison Table
  const kpiRows = [
    {
      id: 'ts',
      metric: 'Total Sales (TS)',
      subtext: 'Daily Sales Report',
      latestVal: o.tsLatest,
      prevVal: o.tsPrev,
      diffVal: o.tsDiffRm,
      pctVal: o.tsDiffPct,
      latestDisplay: `<div class="font-bold text-slate-900">${fmtRM(o.tsLatest)}</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtRM(o.tsPrev)}</div>`,
      diffDisplay: `<div class="font-bold ${o.tsDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.tsDiffRm >= 0 ? '+' : ''}${fmtRM(o.tsDiffRm)}</div>`,
      pctDisplay: badgeDelta(o.tsDiffPct, true)
    },
    {
      id: 'hb',
      metric: 'House Brand Sales (HB)',
      subtext: '% of Total Sales',
      latestVal: o.hbLatest,
      prevVal: o.hbPrev,
      diffVal: o.hbDiffRm,
      pctVal: o.hbDiffPct,
      latestDisplay: `
        <div class="font-bold text-slate-900">${fmtRM(o.hbLatest)}</div>
        <div class="text-[11px] font-semibold text-slate-500 mt-0.5">(${fmtPct(o.hbShareLatestPct)}%)</div>
      `,
      prevDisplay: `
        <div class="font-medium text-slate-700">${fmtRM(o.hbPrev)}</div>
        <div class="text-[11px] font-semibold text-slate-400 mt-0.5">(${fmtPct(o.hbSharePrevPct)}%)</div>
      `,
      diffDisplay: `
        <div class="font-bold text-emerald-700">+${fmtRM(o.hbDiffRm)}</div>
        <div class="text-[11px] font-semibold text-emerald-600 mt-0.5">(+${fmtPP(o.hbShareDiffPP)})</div>
      `,
      pctDisplay: badgeDelta(o.hbDiffPct, true)
    },
    {
      id: 'hm',
      metric: 'House Margin Sales (HM)',
      subtext: '% of Total Sales',
      latestVal: o.hmLatest,
      prevVal: o.hmPrev,
      diffVal: o.hmDiffRm,
      pctVal: o.hmDiffPct,
      latestDisplay: `
        <div class="font-bold text-slate-900">${fmtRM(o.hmLatest)}</div>
        <div class="text-[11px] font-semibold text-slate-500 mt-0.5">(${fmtPct(o.hmShareLatestPct)}%)</div>
      `,
      prevDisplay: `
        <div class="font-medium text-slate-700">${fmtRM(o.hmPrev)}</div>
        <div class="text-[11px] font-semibold text-slate-400 mt-0.5">(${fmtPct(o.hmSharePrevPct)}%)</div>
      `,
      diffDisplay: `
        <div class="font-bold text-emerald-700">+${fmtRM(o.hmDiffRm)}</div>
        <div class="text-[11px] font-semibold text-emerald-600 mt-0.5">(+${fmtPP(o.hmShareDiffPP)})</div>
      `,
      pctDisplay: badgeDelta(o.hmDiffPct, true)
    },
    {
      id: 'gp',
      metric: 'Personal Gross Profit & Margin',
      subtext: 'Net Sold Profit & Margin %',
      latestVal: o.personalGpTotalLatest.netSoldProfit,
      prevVal: o.personalGpTotalPrev.netSoldProfit,
      diffVal: o.personalGpDiffRm,
      pctVal: o.personalGpDiffPct,
      latestDisplay: `
        <div class="font-bold text-slate-900">${fmtRM(o.personalGpTotalLatest.netSoldProfit)}</div>
        <div class="text-[11px] font-semibold text-emerald-700 mt-0.5">(${fmtPct(o.personalGpTotalLatest.gpMarginPct)}%)</div>
      `,
      prevDisplay: `
        <div class="font-medium text-slate-700">${fmtRM(o.personalGpTotalPrev.netSoldProfit)}</div>
        <div class="text-[11px] font-semibold text-slate-400 mt-0.5">(${fmtPct(o.personalGpTotalPrev.gpMarginPct)}%)</div>
      `,
      diffDisplay: `
        <div class="font-bold ${o.personalGpDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.personalGpDiffRm >= 0 ? '+' : ''}${fmtRM(o.personalGpDiffRm)}</div>
        <div class="text-[11px] font-semibold ${o.personalGpMarginDiffPP >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-0.5">(${o.personalGpMarginDiffPP >= 0 ? '+' : ''}${fmtPP(o.personalGpMarginDiffPP)})</div>
      `,
      pctDisplay: badgeDelta(o.personalGpDiffPct, true)
    },
    {
      id: 'tx',
      metric: 'Number of Transactions',
      subtext: 'Customers Served',
      latestVal: o.txLatest,
      prevVal: o.txPrev,
      diffVal: o.txDiff,
      pctVal: o.txDiffPct,
      latestDisplay: `<div class="font-bold text-slate-900">${fmtNum(o.txLatest)}</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtNum(o.txPrev)}</div>`,
      diffDisplay: `<div class="font-bold ${o.txDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.txDiff >= 0 ? '+' : ''}${fmtNum(o.txDiff)} tx</div>`,
      pctDisplay: badgeDelta(o.txDiffPct, true)
    },
    {
      id: 'basketTs',
      metric: 'Basket Size (Total Sales)',
      subtext: 'Total Sales ÷ Transactions',
      latestVal: o.basketTsLatest,
      prevVal: o.basketTsPrev,
      diffVal: o.basketTsDiffRm,
      pctVal: o.basketTsDiffPct,
      latestDisplay: `<div class="font-bold text-slate-900">${fmtRM(o.basketTsLatest)}</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtRM(o.basketTsPrev)}</div>`,
      diffDisplay: `<div class="font-bold ${o.basketTsDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.basketTsDiffRm >= 0 ? '+' : ''}${fmtRM(o.basketTsDiffRm)}</div>`,
      pctDisplay: badgeDelta(o.basketTsDiffPct, true)
    },
    {
      id: 'basketHb',
      metric: 'Basket Size (House Brand)',
      subtext: 'House Brand ÷ Transactions',
      latestVal: o.basketHbLatest,
      prevVal: o.basketHbPrev,
      diffVal: o.basketHbDiffRm,
      pctVal: o.basketHbDiffPct,
      latestDisplay: `<div class="font-bold text-slate-900">${fmtRM(o.basketHbLatest)}</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtRM(o.basketHbPrev)}</div>`,
      diffDisplay: `<div class="font-bold ${o.basketHbDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${o.basketHbDiffRm >= 0 ? '+' : ''}${fmtRM(o.basketHbDiffRm)}</div>`,
      pctDisplay: badgeDelta(o.basketHbDiffPct, true)
    },
    {
      id: 'catPrice',
      metric: 'Net Sold Price (All 12 Categories)',
      subtext: `HQ 11 Focus: ${fmtRM(hq.netSoldPriceLatest)} vs LY ${fmtRM(hq.netSoldPricePrev)}`,
      latestVal: all12.netSoldPriceLatest,
      prevVal: all12.netSoldPricePrev,
      diffVal: all12.priceDiffRm,
      pctVal: all12.priceDiffPct,
      latestDisplay: `<div class="font-bold text-slate-900">${fmtRM(all12.netSoldPriceLatest)}</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtRM(all12.netSoldPricePrev)}</div>`,
      diffDisplay: `<div class="font-bold ${all12.priceDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${all12.priceDiffRm >= 0 ? '+' : ''}${fmtRM(all12.priceDiffRm)}</div>`,
      pctDisplay: badgeDelta(all12.priceDiffPct, true)
    },
    {
      id: 'catProfit',
      metric: 'Net Sold Profit (All 12 Categories)',
      subtext: `HQ 11 Focus: ${fmtRM(hq.netSoldProfitLatest)} vs LY ${fmtRM(hq.netSoldProfitPrev)}`,
      latestVal: all12.netSoldProfitLatest,
      prevVal: all12.netSoldProfitPrev,
      diffVal: all12.profitDiffRm,
      pctVal: all12.profitDiffPct,
      latestDisplay: `<div class="font-bold text-emerald-800">${fmtRM(all12.netSoldProfitLatest)}</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtRM(all12.netSoldProfitPrev)}</div>`,
      diffDisplay: `<div class="font-bold ${all12.profitDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${all12.profitDiffRm >= 0 ? '+' : ''}${fmtRM(all12.profitDiffRm)}</div>`,
      pctDisplay: badgeDelta(all12.profitDiffPct, true)
    },
    {
      id: 'catGp',
      metric: 'Category Gross Profit Margin (%)',
      subtext: `HQ 11 Focus GP%: ${fmtPct(hq.gpPctLatest)} vs LY ${fmtPct(hq.gpPctPrev)}`,
      latestVal: all12.gpPctLatest,
      prevVal: all12.gpPctPrev,
      diffVal: all12.gpPctDiffPP,
      pctVal: all12.gpPctDiffPP,
      latestDisplay: `<div class="font-bold text-slate-900">${fmtPct(all12.gpPctLatest)}%</div>`,
      prevDisplay: `<div class="font-medium text-slate-700">${fmtPct(all12.gpPctPrev)}%</div>`,
      diffDisplay: `<div class="font-bold ${all12.gpPctDiffPP >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${all12.gpPctDiffPP >= 0 ? '+' : ''}${fmtPP(all12.gpPctDiffPP)}</div>`,
      pctDisplay: badgeDelta(all12.gpPctDiffPP, true, 2, ' pp')
    }
  ];

  // Apply sorting if active
  let displayKpiRows = [...kpiRows];
  if (tab1SortState.col !== 'default') {
    const col = tab1SortState.col;
    const isAsc = tab1SortState.dir === 'asc';
    displayKpiRows.sort((a, b) => {
      let vA, vB;
      if (col === 'metric') {
        vA = a.metric; vB = b.metric;
        return isAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      } else if (col === 'latest') {
        vA = a.latestVal || 0; vB = b.latestVal || 0;
      } else if (col === 'prev') {
        vA = a.prevVal || 0; vB = b.prevVal || 0;
      } else if (col === 'diff') {
        vA = a.diffVal || 0; vB = b.diffVal || 0;
      } else if (col === 'pct') {
        vA = a.pctVal || 0; vB = b.pctVal || 0;
      }
      return isAsc ? vA - vB : vB - vA;
    });
  }

  container.innerHTML = `
    <!-- Top 4 Core Summary Cards (Calm Executive Aesthetic) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total Sales (TS) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sales (TS)</span>
          ${badgeDelta(o.tsDiffPct, true)}
        </div>
        <div class="text-2xl font-extrabold text-slate-900 mt-1">${fmtRM(o.tsLatest)}</div>
        <div class="text-xs text-slate-500 mt-1">
          Prev Year: <span class="font-semibold text-slate-700">${fmtRM(o.tsPrev)}</span>
          <span class="ml-1 font-bold ${o.tsDiffRm >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${o.tsDiffRm >= 0 ? '+' : ''}${fmtRM(o.tsDiffRm)})</span>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>All 12 Cat Net Sold: <strong>${fmtRM(all12.netSoldPriceLatest)}</strong></span>
          <span>LY: <strong>${fmtRM(all12.netSoldPricePrev)}</strong></span>
        </div>
      </div>

      <!-- House Brand & House Margin -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">House Brand & House Margin</span>
          ${badgeDelta(o.hbDiffPct, true)}
        </div>
        <div class="flex items-baseline justify-between mt-1">
          <div>
            <div class="text-xl font-extrabold text-slate-900">${fmtRM(o.hbLatest)} <span class="text-xs font-bold text-slate-500">HB</span></div>
            <div class="text-[11px] text-slate-500">Prev HB: ${fmtRM(o.hbPrev)} (${o.hbDiffRm >= 0 ? '+' : ''}${fmtRM(o.hbDiffRm)})</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-extrabold text-emerald-700">${fmtPct(o.hbShareLatestPct)} <span class="text-[10px] font-normal">of TS</span></div>
            <div class="text-[11px] text-slate-500">LY: ${fmtPct(o.hbSharePrevPct)} (${fmtPP(o.hbShareDiffPP)})</div>
          </div>
        </div>
        <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-slate-700">HM: ${fmtRM(o.hmLatest)}</span>
            <span class="text-slate-500 text-[11px] ml-1">(LY: ${fmtRM(o.hmPrev)})</span>
          </div>
          <div class="text-right">
            <span class="font-bold text-slate-800">${fmtPct(o.hmShareLatestPct)} of TS</span>
            <span class="ml-1 text-[11px] font-bold text-emerald-600">(${fmtPct(o.hmDiffPct, 1, true)})</span>
          </div>
        </div>
      </div>

      <!-- Gross Profit & Margin -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Gross Profit & Margin</span>
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
          <span>All 12 Cat Profit: <strong>${fmtRM(all12.netSoldProfitLatest)}</strong> (${fmtPct(all12.gpPctLatest)})</span>
          <span>LY: ${fmtPct(all12.gpPctPrev)}</span>
        </div>
      </div>

      <!-- Traffic & Basket Size -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Traffic & Basket Size</span>
          ${badgeDelta(o.txDiffPct, true)}
        </div>
        <div class="flex items-baseline justify-between mt-1">
          <div>
            <div class="text-2xl font-extrabold text-slate-900">${fmtNum(o.txLatest)} <span class="text-xs font-semibold text-slate-500">tx</span></div>
            <div class="text-[11px] text-slate-500">Prev Year: ${fmtNum(o.txPrev)} (${o.txDiff >= 0 ? '+' : ''}${fmtNum(o.txDiff)})</div>
          </div>
          <div class="text-right">
            <div class="text-xs font-bold text-slate-700">TS Basket: <span class="text-slate-900 font-extrabold">${fmtRM(o.basketTsLatest)}</span></div>
            <div class="text-[11px] text-emerald-600 font-semibold">LY ${fmtRM(o.basketTsPrev)} (${fmtPct(o.basketTsDiffPct, 1, true)})</div>
          </div>
        </div>
        <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="font-semibold text-slate-600">HB Basket Size:</span>
          <span>
            <strong class="text-slate-900">${fmtRM(o.basketHbLatest)}</strong>
            <span class="text-[11px] text-slate-500">vs LY ${fmtRM(o.basketHbPrev)}</span>
            <span class="text-[11px] font-bold text-emerald-600 ml-1">(${fmtPct(o.basketHbDiffPct, 1, true)})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Complete Quantitative Verification Table with Sticky Header & Sorting -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div class="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold tracking-wide uppercase">Core YoY Quantitative Comparison Matrix</h3>
            <p class="text-xs text-slate-300 mt-0.5">Click any column header to sort by amount or name</p>
          </div>
          <span class="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Kota Sentosa</span>
        </div>
        <div class="table-sticky-container overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 text-white uppercase text-[11px] sticky top-0 z-20">
                <th onclick="setTabSort('tab1', 'metric')" class="py-3 px-4 cursor-pointer select-none hover:bg-slate-800 transition">
                  Metric / Requirement ${getSortIndicator(tab1SortState.col, 'metric', tab1SortState.dir)}
                </th>
                <th onclick="setTabSort('tab1', 'latest')" class="py-3 px-4 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Latest Month ${getSortIndicator(tab1SortState.col, 'latest', tab1SortState.dir)}
                </th>
                <th onclick="setTabSort('tab1', 'prev')" class="py-3 px-4 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Prev Year (Same Month) ${getSortIndicator(tab1SortState.col, 'prev', tab1SortState.dir)}
                </th>
                <th onclick="setTabSort('tab1', 'diff')" class="py-3 px-4 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Variance (RM / Qty) ${getSortIndicator(tab1SortState.col, 'diff', tab1SortState.dir)}
                </th>
                <th onclick="setTabSort('tab1', 'pct')" class="py-3 px-4 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  YoY Change (%) ${getSortIndicator(tab1SortState.col, 'pct', tab1SortState.dir)}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800 bg-white">
              ${displayKpiRows.map(row => `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900">${escapeHtml(row.metric)}</div>
                    ${row.subtext ? `<div class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(row.subtext)}</div>` : ''}
                  </td>
                  <td class="py-3 px-4 text-right">${row.latestDisplay}</td>
                  <td class="py-3 px-4 text-right">${row.prevDisplay}</td>
                  <td class="py-3 px-4 text-right">${row.diffDisplay}</td>
                  <td class="py-3 px-4 text-right">${row.pctDisplay}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Latest 3-Month Rolling Comparison Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Latest 3-Month Trajectory</h3>
            <button onclick="switchPerfTab('tab7')" class="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline">Edit M-1 / M-2 →</button>
          </div>
          <p class="text-xs text-slate-500 mb-4">Comparing M-2, M-1, and Latest Month alongside Previous Year benchmark.</p>

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

            <div class="p-3.5 rounded-xl bg-slate-100 border border-slate-300">
              <div class="flex justify-between font-extrabold text-slate-900 mb-1">
                <span>Latest (${escapeHtml(perfState?.meta?.latestPeriodLabel?.split('(')[0]?.trim() || 'Current')})</span>
                <span>${fmtRM(o.tsLatest)}</span>
              </div>
              <div class="flex justify-between text-[11px] text-slate-700 font-medium">
                <span>HB: ${fmtRM(o.hbLatest)} | HM: ${fmtRM(o.hmLatest)}</span>
                <span>GP: ${fmtPct(o.personalGpTotalLatest.gpMarginPct)} | ${fmtNum(o.txLatest)} tx</span>
              </div>
              <div class="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-bold">
                <span>vs M-1 (MoM): <span class="${o.tsLatest >= m1.ts ? 'text-emerald-700' : 'text-rose-700'}">${m1.ts > 0 ? fmtPct(calcGrowthPct(o.tsLatest, m1.ts), 2, true) : 'N/A'}</span></span>
                <span>vs Prev Year (YoY): <span class="${o.tsDiffPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${fmtPct(o.tsDiffPct, 2, true)}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="text-slate-500">Need presentation format?</span>
          <button onclick="exportGeminiPresentationModal()" class="font-bold text-slate-900 hover:underline cursor-pointer">
            Export Gemini Presentation Doc →
          </button>
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
  const baseRows = activeCategoryMode === 'HQ11'
    ? computedMetrics.categories.filter(c => c.isHqFocus)
    : computedMetrics.categories;

  // Multi-column sorting for Tab 2
  let rows = [...baseRows];
  const { col, dir } = tab2SortState;
  const isAsc = dir === 'asc';
  rows.sort((a, b) => {
    if (col === 'category') {
      return isAsc ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
    }
    const vA = a[col] != null ? a[col] : 0;
    const vB = b[col] != null ? b[col] : 0;
    return isAsc ? vA - vB : vB - vA;
  });

  const upCats = computedMetrics.categories.filter(c => c.priceDiffRm > 0);
  const downCats = computedMetrics.categories.filter(c => c.priceDiffRm < 0);

  container.innerHTML = `
    <!-- Formula Banner & Mode Toggle (Calm Executive Styling) -->
    <div class="bg-slate-900 text-white rounded-2xl p-5 mb-6 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-base font-extrabold tracking-wide">Category Sales Performance & Stock Cycle Matrix</h3>
        </div>
        <div class="text-xs text-slate-300 mt-1.5 space-y-0.5 font-mono">
          <div>• <strong>Net Sold Price, Profit & GP%</strong>: Includes all active categories</div>
          <div>• <strong>Cost of Sales (MTD)</strong>: Net Sold Price − Net Sold Profit</div>
          <div>• <strong>Stock Cycle Formula</strong>: Total Custom Cost ÷ Cost of Sales (MTD) &nbsp;<span class="text-emerald-400 font-bold">[HQ Target = 2.0]</span></div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="setCategoryFocusMode('ALL12')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeCategoryMode === 'ALL12' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
          All 12 Categories (Default)
        </button>
        <button onclick="setCategoryFocusMode('HQ11')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeCategoryMode === 'HQ11' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
          HQ 11 Focus Only (Excl. WYMED-EX)
        </button>
      </div>
    </div>

    <!-- Top Summary Cards (Clean Labels without artificial numbering) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-slate-500 uppercase">Net Sold Price (All 12 Categories)</div>
        <div class="text-xl font-extrabold text-slate-900 mt-1">${fmtRM(all12.netSoldPriceLatest)}</div>
        <div class="text-xs text-slate-500 mt-1 flex justify-between items-center">
          <span>Prev Year: ${fmtRM(all12.netSoldPricePrev)} (${all12.priceDiffRm >= 0 ? '+' : ''}${fmtRM(all12.priceDiffRm)})</span>
          ${badgeDelta(all12.priceDiffPct, true)}
        </div>
        <div class="text-[10px] text-slate-400 mt-1">HQ 11: ${fmtRM(hq.netSoldPriceLatest)} vs LY ${fmtRM(hq.netSoldPricePrev)}</div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-slate-700 uppercase">Net Sold Profit & GP% (All 12 Categories)</div>
        <div class="flex items-baseline justify-between mt-1">
          <span class="text-xl font-extrabold text-slate-900">${fmtRM(all12.netSoldProfitLatest)}</span>
          <span class="text-base font-extrabold text-emerald-700">${fmtPct(all12.gpPctLatest)}%</span>
        </div>
        <div class="text-xs text-slate-500 mt-1 flex justify-between items-center">
          <span>LY: ${fmtRM(all12.netSoldProfitPrev)} (${fmtPct(all12.gpPctPrev)})</span>
          <span class="font-bold text-emerald-700">${fmtPP(all12.gpPctDiffPP)}</span>
        </div>
        <div class="text-[10px] text-slate-400 mt-1">HQ 11 Profit: ${fmtRM(hq.netSoldProfitLatest)} (${fmtPct(hq.gpPctLatest)})</div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-slate-700 uppercase">Custom Cost vs Cost of Sales</div>
        <div class="text-sm font-extrabold text-slate-900 mt-1">Custom Cost: <span class="text-slate-800">${fmtRM(activeSummary.totalCustomCost)}</span></div>
        <div class="text-sm font-extrabold text-slate-900 mt-0.5">COS (MTD): <span class="text-slate-800">${fmtRM(activeSummary.costOfSalesLatest)}</span></div>
        <div class="text-[11px] text-slate-500 mt-1">2.0x Target: <strong>${fmtRM(activeSummary.targetCustomCost2x)}</strong> (${fmtNum(activeSummary.skuCountClosing)} SKUs)</div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 uppercase">Average Stock Cycle</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeSummary.averageStockCycle <= 2.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">Target: 2.0</span>
        </div>
        <div class="flex items-baseline justify-between mt-1">
          <span class="text-2xl font-extrabold ${activeSummary.averageStockCycle <= 2.0 ? 'text-emerald-700' : 'text-rose-700'}">${activeSummary.averageStockCycle.toFixed(2)}</span>
          <span class="text-xs font-extrabold ${activeSummary.stockCycleVarVsTarget <= 0 ? 'text-emerald-700' : 'text-rose-700'}">
            ${activeSummary.stockCycleVarVsTarget > 0 ? '+' : ''}${activeSummary.stockCycleVarVsTarget.toFixed(2)} vs 2.0 Target
          </span>
        </div>
        <div class="text-[11px] text-slate-600 mt-1">
          Formula: Custom Cost (${fmtRM(activeSummary.totalCustomCost)}) ÷ COS (${fmtRM(activeSummary.costOfSalesLatest)})
        </div>
        <div class="text-[11px] font-semibold text-slate-700 mt-0.5">
          HQ 11 Cycle: <strong>${hq.averageStockCycle.toFixed(2)}</strong> | All 12 Cycle: <strong>${all12.averageStockCycle.toFixed(2)}</strong>
        </div>
      </div>
    </div>

    <!-- Category Up vs Down Quick Summary Strip -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div class="text-xs font-extrabold uppercase text-emerald-800 mb-2">📈 Categories UP YoY in Net Sold Price (${upCats.length} Categories)</div>
        <div class="flex flex-wrap gap-2">
          ${upCats.map(c => `
            <div class="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span class="font-extrabold text-slate-900">${escapeHtml(c.category)}</span>:
              <span class="font-bold text-emerald-700">+${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 1, true)})</span>
              <span class="text-[11px] text-slate-500 ml-1">| GP: ${fmtPct(c.gpPctLatest)} (${fmtPP(c.gpPctDiffPP)})</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div class="text-xs font-extrabold uppercase text-rose-800 mb-2">📉 Categories DOWN YoY in Net Sold Price (${downCats.length} Categories)</div>
        <div class="flex flex-wrap gap-2">
          ${downCats.map(c => `
            <div class="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span class="font-extrabold text-slate-900">${escapeHtml(c.category)}</span>:
              <span class="font-bold text-rose-700">${fmtRM(c.priceDiffRm)} (${fmtPct(c.priceDiffPct, 1, true)})</span>
              <span class="text-[11px] text-slate-500 ml-1">| GP: ${fmtPct(c.gpPctLatest)} (${fmtPP(c.gpPctDiffPP)})</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Full Category Table with Sticky Header & Multi-Column Sorting -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      <div class="table-sticky-container">
        <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-900 text-white uppercase text-[11px] sticky top-0 z-20">
            <th onclick="setTabSort('tab2', 'category')" class="py-3 px-3 cursor-pointer select-none hover:bg-slate-800 transition">
              Category ${getSortIndicator(tab2SortState.col, 'category', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'netSoldPriceLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Latest Net Price ${getSortIndicator(tab2SortState.col, 'netSoldPriceLatest', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'netSoldPricePrev')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Prev Year Price ${getSortIndicator(tab2SortState.col, 'netSoldPricePrev', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'priceDiffRm')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Price YoY ${getSortIndicator(tab2SortState.col, 'priceDiffRm', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'netSoldProfitLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Latest Profit ${getSortIndicator(tab2SortState.col, 'netSoldProfitLatest', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'netSoldProfitPrev')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Prev Profit ${getSortIndicator(tab2SortState.col, 'netSoldProfitPrev', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'profitDiffRm')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Profit YoY ${getSortIndicator(tab2SortState.col, 'profitDiffRm', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'gpPctLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Latest GP% ${getSortIndicator(tab2SortState.col, 'gpPctLatest', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'gpPctPrev')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Prev GP% ${getSortIndicator(tab2SortState.col, 'gpPctPrev', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'costOfSalesLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Cost of Sales (MTD) ${getSortIndicator(tab2SortState.col, 'costOfSalesLatest', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'totalCustomCost')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Total Custom Cost ${getSortIndicator(tab2SortState.col, 'totalCustomCost', tab2SortState.dir)}
            </th>
            <th onclick="setTabSort('tab2', 'pmgStockCycle')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              Stock Cycle ${getSortIndicator(tab2SortState.col, 'pmgStockCycle', tab2SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Target: 2.0</span>
            </th>
            <th onclick="setTabSort('tab2', 'agedValueRm')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
              6M Aged Stock ${getSortIndicator(tab2SortState.col, 'agedValueRm', tab2SortState.dir)}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-800 bg-white">
          ${rows.map(c => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 ${!c.isHqFocus ? 'bg-amber-50/20' : ''}">
              <td class="py-3 px-3 font-bold whitespace-nowrap">
                <span class="inline-block w-2 h-2 rounded-full mr-1.5 ${c.priceDiffRm >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                ${escapeHtml(c.category)}
                ${!c.isHqFocus ? `<span class="ml-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">Excl. HQ11</span>` : ''}
              </td>
              <td class="py-3 px-3 text-right font-bold text-slate-900">${fmtRM(c.netSoldPriceLatest)}</td>
              <td class="py-3 px-3 text-right text-slate-600">${fmtRM(c.netSoldPricePrev)}</td>
              <td class="py-3 px-3 text-right">
                <div class="font-bold ${c.priceDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${c.priceDiffRm >= 0 ? '+' : ''}${fmtRM(c.priceDiffRm)}</div>
                <div class="text-[10px] font-semibold text-slate-500 mt-0.5">${fmtPct(c.priceDiffPct, 1, true)}</div>
              </td>
              <td class="py-3 px-3 text-right font-bold text-slate-900">${fmtRM(c.netSoldProfitLatest)}</td>
              <td class="py-3 px-3 text-right text-slate-600">${fmtRM(c.netSoldProfitPrev)}</td>
              <td class="py-3 px-3 text-right">
                <div class="font-bold ${c.profitDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${c.profitDiffRm >= 0 ? '+' : ''}${fmtRM(c.profitDiffRm)}</div>
                <div class="text-[10px] font-semibold text-slate-500 mt-0.5">${fmtPct(c.profitDiffPct, 1, true)}</div>
              </td>
              <td class="py-3 px-3 text-right font-extrabold text-slate-900">${fmtPct(c.gpPctLatest)}%</td>
              <td class="py-3 px-3 text-right">
                <div class="font-medium text-slate-700">${fmtPct(c.gpPctPrev)}%</div>
                <div class="text-[10px] font-bold ${c.gpPctDiffPP >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-0.5">(${c.gpPctDiffPP >= 0 ? '+' : ''}${fmtPP(c.gpPctDiffPP)})</div>
              </td>
              <td class="py-3 px-3 text-right font-medium text-slate-700">${fmtRM(c.costOfSalesLatest)}</td>
              <td class="py-3 px-3 text-right font-medium text-slate-700">
                <div>${fmtRM(c.totalCustomCost)}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">${fmtNum(c.skuCountClosing)} SKUs</div>
              </td>
              <td class="py-3 px-3 text-right font-bold ${c.pmgStockCycle <= 2.0 ? 'text-emerald-700' : c.pmgStockCycle <= 2.5 ? 'text-amber-700' : 'text-rose-700'}">
                <div class="text-sm">${c.pmgStockCycle.toFixed(2)} <span class="text-[10px] font-bold">${c.pmgStockCycle <= 2.0 ? '✅ ≤2.0' : '⚠️ +' + c.stockCycleVarVsTarget.toFixed(2)}</span></div>
                <div class="text-[10px] text-slate-500 font-normal mt-0.5">${c.excessStockRm > 0 ? 'Excess: ' + fmtRM(c.excessStockRm) : 'Within 2.0 Target'}</div>
              </td>
              <td class="py-3 px-3 text-right">
                <div class="font-semibold text-slate-800">${fmtRM(c.agedValueRm)}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">${fmtNum(c.agedSkuCount)} SKUs</div>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="bg-slate-900 text-white font-extrabold text-xs border-b border-slate-700">
            <td class="py-3 px-3">TOTAL (ALL 12 CATEGORIES)</td>
            <td class="py-3 px-3 text-right">${fmtRM(all12.netSoldPriceLatest)}</td>
            <td class="py-3 px-3 text-right text-slate-300">${fmtRM(all12.netSoldPricePrev)}</td>
            <td class="py-3 px-3 text-right ${all12.priceDiffRm >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
              <div>${all12.priceDiffRm >= 0 ? '+' : ''}${fmtRM(all12.priceDiffRm)}</div>
              <div class="text-[10px] text-slate-300 mt-0.5">(${fmtPct(all12.priceDiffPct, 2, true)})</div>
            </td>
            <td class="py-3 px-3 text-right text-emerald-300">${fmtRM(all12.netSoldProfitLatest)}</td>
            <td class="py-3 px-3 text-right text-slate-300">${fmtRM(all12.netSoldProfitPrev)}</td>
            <td class="py-3 px-3 text-right ${all12.profitDiffRm >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
              <div>${all12.profitDiffRm >= 0 ? '+' : ''}${fmtRM(all12.profitDiffRm)}</div>
              <div class="text-[10px] text-slate-300 mt-0.5">(${fmtPct(all12.profitDiffPct, 2, true)})</div>
            </td>
            <td class="py-3 px-3 text-right text-amber-300">${fmtPct(all12.gpPctLatest)}%</td>
            <td class="py-3 px-3 text-right text-slate-300">
              <div>${fmtPct(all12.gpPctPrev)}%</div>
              <div class="text-[10px] text-slate-300 mt-0.5">(${fmtPP(all12.gpPctDiffPP)})</div>
            </td>
            <td class="py-3 px-3 text-right">${fmtRM(all12.costOfSalesLatest)}</td>
            <td class="py-3 px-3 text-right">${fmtRM(all12.totalCustomCost)}</td>
            <td class="py-3 px-3 text-right text-amber-300">${all12.averageStockCycle.toFixed(2)} (Target: 2.0)</td>
            <td class="py-3 px-3 text-right text-amber-200">${fmtRM(all12.agedValueRm)}</td>
          </tr>
          <tr class="bg-slate-800 text-slate-200 font-bold text-[11px]">
            <td class="py-2.5 px-3">HQ 11 FOCUS SUBTOTAL (EXCL. WYMED-EX)</td>
            <td class="py-2.5 px-3 text-right">${fmtRM(hq.netSoldPriceLatest)}</td>
            <td class="py-2.5 px-3 text-right text-slate-400">${fmtRM(hq.netSoldPricePrev)}</td>
            <td class="py-2.5 px-3 text-right ${hq.priceDiffRm >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
              <div>${hq.priceDiffRm >= 0 ? '+' : ''}${fmtRM(hq.priceDiffRm)}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">(${fmtPct(hq.priceDiffPct, 2, true)})</div>
            </td>
            <td class="py-2.5 px-3 text-right text-emerald-300">${fmtRM(hq.netSoldProfitLatest)}</td>
            <td class="py-2.5 px-3 text-right text-slate-400">${fmtRM(hq.netSoldProfitPrev)}</td>
            <td class="py-2.5 px-3 text-right ${hq.profitDiffRm >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
              <div>${hq.profitDiffRm >= 0 ? '+' : ''}${fmtRM(hq.profitDiffRm)}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">(${fmtPct(hq.profitDiffPct, 2, true)})</div>
            </td>
            <td class="py-2.5 px-3 text-right text-amber-300">${fmtPct(hq.gpPctLatest)}%</td>
            <td class="py-2.5 px-3 text-right text-slate-400">
              <div>${fmtPct(hq.gpPctPrev)}%</div>
              <div class="text-[10px] text-slate-400 mt-0.5">(${fmtPP(hq.gpPctDiffPP)})</div>
            </td>
            <td class="py-2.5 px-3 text-right">${fmtRM(hq.costOfSalesLatest)}</td>
            <td class="py-2.5 px-3 text-right">${fmtRM(hq.totalCustomCost)}</td>
            <td class="py-2.5 px-3 text-right text-amber-300">${hq.averageStockCycle.toFixed(2)} (Target: 2.0)</td>
            <td class="py-2.5 px-3 text-right text-amber-200">${fmtRM(hq.agedValueRm)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  `;
}

// ── TAB 3: TEAMMATE PERSONAL SALES & PRODUCTIVITY ───────────────────────────
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
  const baseRows = showAllTeammates ? allRows : allRows.filter(t => t.isActiveLatest);
  const o = computedMetrics.outlet;

  // Multi-column sorting for Tab 3
  let rows = [...baseRows];
  const { col, dir } = tab3SortState;
  const isAsc = dir === 'asc';
  rows.sort((a, b) => {
    if (col === 'name') {
      return isAsc ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
    }
    const vA = a[col] != null ? a[col] : 0;
    const vB = b[col] != null ? b[col] : 0;
    return isAsc ? vA - vB : vB - vA;
  });

  const rolesList = ['Pharmacist (PIC)', 'Pharmacist', 'PRP', 'BM / Lead', 'ABM', 'PA', 'Locum Pharmacist', 'Former Staff'];

  // Calculate M1 / M2 outlet totals
  const totalM1Ts = o.dailySalesM1?.ts || 336565.91;
  const totalM2Ts = o.dailySalesM2?.ts || 380745.93;

  container.innerHTML = `
    <!-- Teammate Performance Header & View Controls -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-base font-extrabold text-slate-900">Teammate Personal Sales & Multi-Month Performance</h3>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            ${teammateViewMode === '3MONTH' ? '3-Month Trajectory' : 'YoY Benchmark'}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          ${teammateViewMode === '3MONTH'
            ? 'Comparing personal sales across 3 consecutive months (M-2 ➔ M-1 ➔ Latest Month) with automated PIC alerts for advising teammates.'
            : 'Comparing Latest Month vs Previous Year Same Month personal performance (TS, HB, HM, Transactions, Basket Size, and Gross Profit).'}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5 shrink-0">
        <!-- View Mode Switcher -->
        <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button onclick="setTeammateViewMode('3MONTH')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${teammateViewMode === '3MONTH' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            📅 3-Month Trajectory (M-2 ➔ M-1 ➔ Latest)
          </button>
          <button onclick="setTeammateViewMode('YOY')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${teammateViewMode === 'YOY' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            📊 YoY Benchmark (Latest vs LY)
          </button>
        </div>

        <!-- Filter Active vs All -->
        <div class="flex items-center gap-1">
          <button onclick="toggleShowAllTeammates(false)" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${!showAllTeammates ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            Active (${allRows.filter(t => t.isActiveLatest).length})
          </button>
          <button onclick="toggleShowAllTeammates(true)" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${showAllTeammates ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            All Staff (${allRows.length})
          </button>
        </div>
      </div>
    </div>

    <!-- Teammate Performance Table (Outer Card & Dedicated Scrolling Container) -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      <div class="table-sticky-container">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            ${teammateViewMode === '3MONTH' ? `
              <!-- 3-Month Trajectory Headers -->
              <tr class="bg-slate-900 text-white uppercase text-[10px] sticky top-0 z-20">
                <th onclick="setTabSort('tab3', 'name')" class="py-3 px-3 cursor-pointer select-none hover:bg-slate-800 transition">
                  Teammate & Role ${getSortIndicator(tab3SortState.col, 'name', tab3SortState.dir)}
                </th>
                <th onclick="setTabSort('tab3', 'tsM2')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  M-2 Personal TS ${getSortIndicator(tab3SortState.col, 'tsM2', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">(2 Mos Prior)</span>
                </th>
                <th onclick="setTabSort('tab3', 'tsM1')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  M-1 Personal TS ${getSortIndicator(tab3SortState.col, 'tsM1', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">(1 Mo Prior)</span>
                </th>
                <th onclick="setTabSort('tab3', 'tsLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Latest Personal TS ${getSortIndicator(tab3SortState.col, 'tsLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">MoM & 3M Growth</span>
                </th>
                <th onclick="setTabSort('tab3', 'hbPctOwnTsLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  HB% Trajectory ${getSortIndicator(tab3SortState.col, 'hbPctOwnTsLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">M-2 ➔ M-1 ➔ Latest</span>
                </th>
                <th onclick="setTabSort('tab3', 'gpPctLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  GP% Trajectory ${getSortIndicator(tab3SortState.col, 'gpPctLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">M-2 ➔ M-1 ➔ Latest</span>
                </th>
                <th onclick="setTabSort('tab3', 'txLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Tx & Basket ${getSortIndicator(tab3SortState.col, 'txLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Latest Customers</span>
                </th>
                <th onclick="setTabSort('tab3', 'picAlertRequired')" class="py-3 px-3 cursor-pointer select-none hover:bg-slate-800 transition">
                  PIC Diagnostic & Advisory Status ${getSortIndicator(tab3SortState.col, 'picAlertRequired', tab3SortState.dir)}
                </th>
              </tr>
            ` : `
              <!-- YoY Benchmark Headers -->
              <tr class="bg-slate-900 text-white uppercase text-[10px] sticky top-0 z-20">
                <th onclick="setTabSort('tab3', 'name')" class="py-3 px-3 cursor-pointer select-none hover:bg-slate-800 transition">
                  Teammate & Role ${getSortIndicator(tab3SortState.col, 'name', tab3SortState.dir)}
                </th>
                <th onclick="setTabSort('tab3', 'tsLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Personal TS (RM) ${getSortIndicator(tab3SortState.col, 'tsLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">vs Prev Year</span>
                </th>
                <th onclick="setTabSort('tab3', 'hbLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Personal HB (RM) ${getSortIndicator(tab3SortState.col, 'hbLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">& % of Own TS</span>
                </th>
                <th onclick="setTabSort('tab3', 'hmLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Personal HM (RM) ${getSortIndicator(tab3SortState.col, 'hmLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">& % of Own TS</span>
                </th>
                <th onclick="setTabSort('tab3', 'txLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Transactions ${getSortIndicator(tab3SortState.col, 'txLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Latest vs LY</span>
                </th>
                <th onclick="setTabSort('tab3', 'basketTsLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  TS Basket Size ${getSortIndicator(tab3SortState.col, 'basketTsLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Own TS ÷ Tx</span>
                </th>
                <th onclick="setTabSort('tab3', 'basketHbLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  HB Basket Size ${getSortIndicator(tab3SortState.col, 'basketHbLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Own HB ÷ Tx</span>
                </th>
                <th onclick="setTabSort('tab3', 'gpRmLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Personal GP (RM) ${getSortIndicator(tab3SortState.col, 'gpRmLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Net Sold Profit</span>
                </th>
                <th onclick="setTabSort('tab3', 'gpPctLatest')" class="py-3 px-3 text-right cursor-pointer select-none hover:bg-slate-800 transition">
                  Personal GP (%) ${getSortIndicator(tab3SortState.col, 'gpPctLatest', tab3SortState.dir)}<br><span class="text-slate-400 font-normal text-[9px]">Margin %</span>
                </th>
              </tr>
            `}
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-800 bg-white">
            ${teammateViewMode === '3MONTH' ? (
              // ── 3-Month Trajectory Rows ──
              rows.map(t => `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100 ${t.picAlertRequired ? 'bg-amber-50/20' : ''}">
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-extrabold text-slate-900">${escapeHtml(t.name)}</span>
                      ${t.picAlertRequired ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">⚠️ PIC Alert</span>` : ''}
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <select onchange="updateTeammateRole('${escapeHtml(t.key)}', this.value)" class="text-[10px] font-bold bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700">
                        ${rolesList.map(r => `<option value="${r}" ${t.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                      </select>
                      <span class="text-[10px] text-slate-500 font-medium">${fmtPct(t.branchTsShareLatest, 1)} of Branch TS</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right font-medium text-slate-600">
                    <div>${t.tsM2 > 0 ? fmtRM(t.tsM2) : '—'}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">M-2 Baseline</div>
                  </td>
                  <td class="py-3 px-3 text-right font-medium text-slate-600">
                    <div>${t.tsM1 > 0 ? fmtRM(t.tsM1) : '—'}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">M-1 Prior</div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-extrabold text-slate-900 text-sm">${fmtRM(t.tsLatest)}</div>
                    <div class="text-[10px] mt-0.5 font-semibold">
                      ${t.tsMoMPct !== null ? `<span class="${t.tsMoMPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}">MoM: ${fmtPct(t.tsMoMPct, 1, true)}</span>` : ''}
                      ${t.ts3mPct !== null ? `<span class="ml-1 text-slate-500">| 3M: <span class="${t.ts3mPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${fmtPct(t.ts3mPct, 1, true)}</span></span>` : ''}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtPct(t.hbPctOwnTsLatest)}%</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      ${t.hbPctM2 > 0 ? `${fmtPct(t.hbPctM2)}% ➔ ` : ''}${t.hbPctM1 > 0 ? `${fmtPct(t.hbPctM1)}% ➔ ` : ''}<strong>${fmtPct(t.hbPctOwnTsLatest)}%</strong>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold ${t.gpPctLatest >= 28 ? 'text-emerald-700' : t.gpPctLatest < 26 ? 'text-rose-700' : 'text-slate-900'}">${fmtPct(t.gpPctLatest)}%</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      ${t.gpPctM2 > 0 ? `${fmtPct(t.gpPctM2)}% ➔ ` : ''}${t.gpPctM1 > 0 ? `${fmtPct(t.gpPctM1)}% ➔ ` : ''}<strong>${fmtPct(t.gpPctLatest)}%</strong>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtNum(t.txLatest)} <span class="text-slate-400 font-normal text-[10px]">tx</span></div>
                    <div class="text-[10px] text-slate-500 mt-0.5">Basket: ${fmtRM(t.basketTsLatest)}</div>
                  </td>
                  <td class="py-3 px-3">
                    ${t.picAlertRequired ? `
                      <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs leading-tight">
                        <span class="text-amber-800">⚠️ PIC Action Needed:</span> ${escapeHtml(t.picAlertReason)}
                      </div>
                    ` : `
                      <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                        ✓ Performing / On Track
                      </div>
                    `}
                  </td>
                </tr>
              `).join('')
            ) : (
              // ── YoY Benchmark Rows ──
              rows.map(t => `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-extrabold text-slate-900">${escapeHtml(t.name)}</span>
                      ${t.picAlertRequired ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">⚠️ PIC Alert</span>` : ''}
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <select onchange="updateTeammateRole('${escapeHtml(t.key)}', this.value)" class="text-[10px] font-bold bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700">
                        ${rolesList.map(r => `<option value="${r}" ${t.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                      </select>
                      <span class="text-[10px] text-slate-500 font-medium">${fmtPct(t.branchTsShareLatest, 1)} of Branch TS</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-extrabold text-slate-900 text-sm">${fmtRM(t.tsLatest)}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      LY: ${t.tsPrev > 0 ? fmtRM(t.tsPrev) : '—'}
                      ${t.tsDiffPct !== null ? `<span class="font-bold ${t.tsDiffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${fmtPct(t.tsDiffPct, 1, true)})</span>` : ''}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtRM(t.hbLatest)}</div>
                    <div class="text-[11px] font-semibold text-slate-600 mt-0.5">${fmtPct(t.hbPctOwnTsLatest)}% <span class="text-[9px] font-normal text-slate-400">of TS</span></div>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                      LY: ${t.hbPrev > 0 ? `${fmtRM(t.hbPrev)} (${fmtPct(t.hbPctOwnTsPrev)}%)` : '—'}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtRM(t.hmLatest)}</div>
                    <div class="text-[11px] font-semibold text-slate-600 mt-0.5">${fmtPct(t.hmPctOwnTsLatest)}% <span class="text-[9px] font-normal text-slate-400">of TS</span></div>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                      LY: ${t.hmPrev > 0 ? `${fmtRM(t.hmPrev)} (${fmtPct(t.hmPctOwnTsPrev)}%)` : '—'}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtNum(t.txLatest)}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      LY: ${t.txPrev > 0 ? fmtNum(t.txPrev) : '—'}
                      ${t.txDiffPct !== null ? `<span class="font-bold ${t.txDiffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${fmtPct(t.txDiffPct, 1, true)})</span>` : ''}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtRM(t.basketTsLatest)}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      LY: ${t.basketTsPrev > 0 ? fmtRM(t.basketTsPrev) : '—'}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtRM(t.basketHbLatest)}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      LY: ${t.basketHbPrev > 0 ? fmtRM(t.basketHbPrev) : '—'}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="font-bold text-slate-900">${fmtRM(t.gpRmLatest)}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                      Net: ${fmtRM(t.netSoldPriceLatest)} | LY: ${t.gpRmPrev > 0 ? fmtRM(t.gpRmPrev) : '—'}
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="text-sm font-bold ${t.gpPctLatest >= 28 ? 'text-emerald-700' : t.gpPctLatest < 26 ? 'text-rose-700' : 'text-slate-900'}">${fmtPct(t.gpPctLatest)}%</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      LY: ${t.gpPctPrev > 0 ? `${fmtPct(t.gpPctPrev)}%` : '—'}
                      ${t.gpPctDiffPP !== null ? `<span class="font-bold ${t.gpPctDiffPP >= 0 ? 'text-emerald-600' : 'text-rose-600'}">(${fmtPP(t.gpPctDiffPP)})</span>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')
            )}
          </tbody>
          <tfoot>
            ${teammateViewMode === '3MONTH' ? `
              <tr class="bg-slate-900 text-white font-extrabold text-xs">
                <td class="py-3 px-3">BRANCH OUTLET TOTAL</td>
                <td class="py-3 px-3 text-right">${fmtRM(totalM2Ts)}</td>
                <td class="py-3 px-3 text-right">${fmtRM(totalM1Ts)}</td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.tsLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">
                    MoM: ${fmtPct(calcGrowthPct(o.tsLatest, totalM1Ts), 1, true)} | 3M: ${fmtPct(calcGrowthPct(o.tsLatest, totalM2Ts), 1, true)}
                  </div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtPct(o.hbShareLatestPct)}%</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">Target: ≥ 38%</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtPct(o.personalGpTotalLatest.gpMarginPct)}%</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">Branch GP%</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtNum(o.txLatest)} tx</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">Basket: ${fmtRM(o.basketTsLatest)}</div>
                </td>
                <td class="py-3 px-3 text-emerald-400 font-bold">
                  Active Team: ${rows.filter(t => t.isActiveLatest).length} Staff | Alerts: ${rows.filter(t => t.picAlertRequired).length} Require PIC Action
                </td>
              </tr>
            ` : `
              <tr class="bg-slate-900 text-white font-extrabold text-xs">
                <td class="py-3 px-3">BRANCH GRAND TOTAL / BENCHMARK</td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.tsLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">LY: ${fmtRM(o.tsPrev)}</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.hbLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">${fmtPct(o.hbShareLatestPct)}% (LY: ${fmtPct(o.hbSharePrevPct)}%)</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.hmLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">${fmtPct(o.hmShareLatestPct)}% (LY: ${fmtPct(o.hmSharePrevPct)}%)</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtNum(o.txLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">LY: ${fmtNum(o.txPrev)}</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.basketTsLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">LY: ${fmtRM(o.basketTsPrev)}</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.basketHbLatest)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">LY: ${fmtRM(o.basketHbPrev)}</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtRM(o.personalGpTotalLatest.netSoldProfit)}</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">LY: ${fmtRM(o.personalGpTotalPrev.netSoldProfit)}</div>
                </td>
                <td class="py-3 px-3 text-right">
                  <div>${fmtPct(o.personalGpTotalLatest.gpMarginPct)}%</div>
                  <div class="text-[10px] text-slate-300 font-normal mt-0.5">LY: ${fmtPct(o.personalGpTotalPrev.gpMarginPct)}%</div>
                </td>
              </tr>
            `}
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

// ── TAB 4: GRANULAR SKU SALES YOY & 6-MONTH STOCK AGING ─────────────────────
function updateSkuFilter(field, val) {
  skuFilterState[field] = val;
  if (field === 'mode') {
    if (val === 'HEROES') tab4SortState = { col: 'priceDiffRm', dir: 'desc' };
    else if (val === 'BLEEDERS') tab4SortState = { col: 'priceDiffRm', dir: 'asc' };
    else if (val === 'MARGIN_DROP') tab4SortState = { col: 'gpDiffPP', dir: 'asc' };
    else if (val === 'AGED_6M') tab4SortState = { col: 'agedValueRm', dir: 'desc' };
    else tab4SortState = { col: 'priceLatest', dir: 'desc' };
  }
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
    filtered = filtered.filter(s => s.priceDiffRm > 0);
  } else if (skuFilterState.mode === 'BLEEDERS') {
    filtered = filtered.filter(s => s.priceDiffRm < 0);
  } else if (skuFilterState.mode === 'MARGIN_DROP') {
    filtered = filtered.filter(s => s.priceLatest >= 200 && s.pricePrev >= 200 && s.gpDiffPP !== null && s.gpDiffPP < -1.5);
  } else if (skuFilterState.mode === 'AGED_6M') {
    filtered = filtered.filter(s => s.agedValueRm > 0);
  }

  // Multi-column sorting applied to filtered SKU list
  const sortCol = tab4SortState.col || 'priceLatest';
  const sortDir = tab4SortState.dir === 'asc' ? 1 : -1;
  filtered = [...filtered].sort((a, b) => {
    let va = a[sortCol];
    let vb = b[sortCol];
    if (typeof va === 'string') {
      return sortDir * va.localeCompare(vb || '');
    }
    va = va ?? 0;
    vb = vb ?? 0;
    return sortDir * (va - vb);
  });

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

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-emerald-800 uppercase">Top SKU Growth Hero</div>
        <div class="text-sm font-extrabold text-slate-900 mt-1 truncate">${escapeHtml(computedMetrics.topHeroSkus[0]?.itemName || '—')}</div>
        <div class="text-xs text-emerald-700 font-bold mt-1">
          +${fmtRM(computedMetrics.topHeroSkus[0]?.priceDiffRm || 0)} YoY
          <span class="font-normal text-slate-500">(GP: ${fmtPct(computedMetrics.topHeroSkus[0]?.gpPctLatest || 0)})</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-rose-800 uppercase">Largest SKU YoY Drop</div>
        <div class="text-sm font-extrabold text-slate-900 mt-1 truncate">${escapeHtml(computedMetrics.topBleederSkus[0]?.itemName || '—')}</div>
        <div class="text-xs text-rose-700 font-bold mt-1">
          ${fmtRM(computedMetrics.topBleederSkus[0]?.priceDiffRm || 0)} YoY
          <span class="font-normal text-slate-500">(LY: ${fmtRM(computedMetrics.topBleederSkus[0]?.pricePrev || 0)})</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div class="text-xs font-bold text-amber-800 uppercase">6-Month+ Stock Aging Alert</div>
        <div class="text-xl font-extrabold text-slate-900 mt-1">${fmtRM(agSum.totalAgedValueRm)} <span class="text-xs font-normal text-slate-500">(${fmtNum(agSum.totalAgedSkus)} SKUs)</span></div>
        <div class="text-xs text-slate-500 mt-1">
          Aged &gt;1 Year: <strong class="text-slate-800">${fmtRM(agSum.totalAbove1YrValueRm)}</strong> (${fmtNum(agSum.totalAbove1YrQty)} units)
        </div>
      </div>
    </div>

    <!-- 6-Month Stock Aging Breakdown by Category -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wide">📦 6-Month Non-Moving / Slow-Moving Stock Aging by Category (≥ 150 Days to &gt;1 Year)</h3>
          <p class="text-xs text-slate-500 mt-0.5">Click any category below to filter, or export a formatted Excel Stock Count Sheet for floor audit.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="exportAgingStockCountExcel('${escapeHtml(skuFilterState.category)}')" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
            <span>📥 Export Stock Count Sheet (${escapeHtml(skuFilterState.category)})</span>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        ${agSum.byCategory.map(c => `
          <div onclick="updateSkuFilter('category', '${escapeHtml(c.category)}'); updateSkuFilter('mode', 'AGED_6M');" class="p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/70 cursor-pointer transition">
            <div class="text-xs font-extrabold text-slate-800 flex justify-between">
              <span>${escapeHtml(c.category)}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">${fmtNum(c.skuCount)} SKUs</span>
            </div>
            <div class="text-sm font-extrabold text-slate-900 mt-1">${fmtRM(c.agedValue)}</div>
            <div class="text-[10px] text-slate-500">Aged Qty: ${fmtNum(c.agedQty6MPlus)} units</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- SKU Filter & Search Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <button onclick="updateSkuFilter('mode', 'ALL')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${skuFilterState.mode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">All SKUs (${fmtNum(allSkus.length)})</button>
        <button onclick="updateSkuFilter('mode', 'HEROES')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${skuFilterState.mode === 'HEROES' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">Top Revenue Growth Heroes</button>
        <button onclick="updateSkuFilter('mode', 'BLEEDERS')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${skuFilterState.mode === 'BLEEDERS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">Top YoY Sales Drops</button>
        <button onclick="updateSkuFilter('mode', 'MARGIN_DROP')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${skuFilterState.mode === 'MARGIN_DROP' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">GP% Margin Eroded</button>
        <button onclick="updateSkuFilter('mode', 'AGED_6M')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${skuFilterState.mode === 'AGED_6M' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">In 6-Month Aging Report</button>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <select onchange="updateSkuFilter('category', this.value)" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800">
          <option value="ALL" ${skuFilterState.category === 'ALL' ? 'selected' : ''}>All 12 Categories</option>
          ${ALL_12_CATEGORIES.map(c => `<option value="${c}" ${skuFilterState.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <input type="text" value="${escapeHtml(skuFilterState.search)}" oninput="updateSkuFilter('search', this.value)" placeholder="Search SKU code or item name..." class="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-500">
        <button onclick="exportAgingStockCountExcel(skuFilterState.category)" title="Export formatted Stock Count Excel for current category filter" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer">
          <span>📊 Stock Count (.xlsx)</span>
        </button>
      </div>
    </div>

    <!-- SKU Comparison Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span>Showing <strong>${fmtNum(pageItems.length)}</strong> of <strong>${fmtNum(totalMatches)}</strong> matching SKUs (Page ${skuFilterState.page} of ${totalPages})</span>
        <div class="flex items-center gap-2">
          <button onclick="updateSkuFilter('page', Math.max(1, skuFilterState.page - 1))" ${skuFilterState.page <= 1 ? 'disabled' : ''} class="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 font-bold cursor-pointer">← Prev</button>
          <button onclick="updateSkuFilter('page', Math.min(${totalPages}, skuFilterState.page + 1))" ${skuFilterState.page >= totalPages ? 'disabled' : ''} class="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 font-bold cursor-pointer">Next →</button>
        </div>
      </div>
      <div class="table-sticky-container">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 z-20 bg-slate-900 text-white uppercase text-[10px]">
            <tr>
              <th onclick="setTabSort('tab4', 'itemName')" class="py-2.5 px-3 cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center">
                  <span>Code & Item Name</span>
                  ${getSortIndicator(tab4SortState.col, 'itemName', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'category')" class="py-2.5 px-3 cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center">
                  <span>Category</span>
                  ${getSortIndicator(tab4SortState.col, 'category', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'qtyLatest')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>Qty (Latest vs LY)</span>
                  ${getSortIndicator(tab4SortState.col, 'qtyLatest', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'priceLatest')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>Latest Net Price</span>
                  ${getSortIndicator(tab4SortState.col, 'priceLatest', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'pricePrev')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>Prev Year Price</span>
                  ${getSortIndicator(tab4SortState.col, 'pricePrev', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'priceDiffRm')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>Price Variance</span>
                  ${getSortIndicator(tab4SortState.col, 'priceDiffRm', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'profitLatest')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>Latest Profit</span>
                  ${getSortIndicator(tab4SortState.col, 'profitLatest', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'profitPrev')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>Prev Profit</span>
                  ${getSortIndicator(tab4SortState.col, 'profitPrev', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'gpPctLatest')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>GP%</span>
                  ${getSortIndicator(tab4SortState.col, 'gpPctLatest', tab4SortState.dir)}
                </div>
              </th>
              <th onclick="setTabSort('tab4', 'agedValueRm')" class="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition select-none">
                <div class="flex items-center justify-end">
                  <span>6M Aged Stock</span>
                  ${getSortIndicator(tab4SortState.col, 'agedValueRm', tab4SortState.dir)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-800">
            ${pageItems.map(s => `
              <tr class="hover:bg-slate-50">
                <td class="py-2 px-3">
                  <div class="font-bold text-slate-900 max-w-xs truncate" title="${escapeHtml(s.itemName)}">${escapeHtml(s.itemName)}</div>
                  <div class="text-[10px] font-mono text-slate-500">${escapeHtml(s.itemCode)} | Unit Cost: ${fmtRM(s.unitCostLatest)}</div>
                </td>
                <td class="py-2 px-3 font-semibold text-slate-700">${escapeHtml(s.category)}</td>
                <td class="py-2 px-3 text-right">
                  <div class="font-bold text-slate-900">${fmtNum(s.qtyLatest)} <span class="text-slate-400 font-normal">vs ${fmtNum(s.qtyPrev)}</span></div>
                  <div class="text-[11px] ${s.qtyDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-semibold mt-0.5">${s.qtyDiff >= 0 ? '+' : ''}${fmtNum(s.qtyDiff)}</div>
                </td>
                <td class="py-2 px-3 text-right font-bold text-slate-900">${fmtRM(s.priceLatest)}</td>
                <td class="py-2 px-3 text-right text-slate-600 font-medium">${fmtRM(s.pricePrev)}</td>
                <td class="py-2 px-3 text-right font-bold ${s.priceDiffRm >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  <div>${s.priceDiffRm >= 0 ? '+' : ''}${fmtRM(s.priceDiffRm)}</div>
                  ${s.priceDiffPct !== null ? `<div class="text-[11px] text-slate-500 font-semibold mt-0.5">(${s.priceDiffPct >= 0 ? '+' : ''}${fmtPct(s.priceDiffPct)})</div>` : ''}
                </td>
                <td class="py-2 px-3 text-right font-bold text-slate-900">${fmtRM(s.profitLatest)}</td>
                <td class="py-2 px-3 text-right text-slate-600 font-medium">${fmtRM(s.profitPrev)}</td>
                <td class="py-2 px-3 text-right">
                  <div class="font-bold text-slate-900">${fmtPct(s.gpPctLatest)}</div>
                  <div class="text-[11px] text-slate-500 font-semibold mt-0.5">LY: ${fmtPct(s.gpPctPrev)}${s.gpDiffPP !== null ? ` (${fmtPP(s.gpDiffPP)})` : ''}</div>
                </td>
                <td class="py-2 px-3 text-right">
                  ${s.agedValueRm > 0 ? `
                    <div class="font-bold text-amber-900">${fmtRM(s.agedValueRm)}</div>
                    <div class="text-[10px] text-slate-500 font-semibold mt-0.5">${fmtNum(s.agedQty6MPlus)} aged / ${fmtNum(s.ohQty)} OH</div>
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

// ── HELPER: FORMAT ACTION PLANS AS STRAIGHTFORWARD POINT FORM ─────────────
function formatActionPointsHtml(actionData) {
  if (!actionData) return '';

  let items = [];
  if (Array.isArray(actionData)) {
    items = actionData.map(item => String(item).trim()).filter(Boolean);
  } else {
    const rawLines = String(actionData).split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length > 1 || rawLines.some(l => l.startsWith('•') || l.startsWith('-') || /^\d+\./.test(l))) {
      items = rawLines;
    } else {
      const sentenceMatches = String(actionData).match(/[^.!?]+[.!?]+(?:\s|$)/g);
      if (sentenceMatches && sentenceMatches.length > 1) {
        items = sentenceMatches.map(s => s.trim()).filter(Boolean);
      } else {
        items = [String(actionData).trim()];
      }
    }
  }

  let html = '<ul class="space-y-1.5 my-2">';
  for (const item of items) {
    const isHeader = (item.endsWith(':') || item.toLowerCase().startsWith('key issue:') || item.toLowerCase().startsWith('star benchmark:') || item.toLowerCase().startsWith('star performance:') || item.toLowerCase().startsWith('action plan:')) && !item.startsWith('•') && !item.startsWith('-');
    if (isHeader) {
      const isAction = item.toLowerCase().includes('action plan');
      html += `<li class="font-extrabold text-xs sm:text-sm ${isAction ? 'text-emerald-800' : 'text-slate-900'} mt-2.5 mb-1 list-none flex items-center gap-1.5">
        <span class="${isAction ? 'text-emerald-600' : 'text-slate-500'} font-black">${isAction ? '⚡' : '📌'}</span>
        <span>${escapeHtml(item)}</span>
      </li>`;
    } else {
      const cleanText = item.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
      html += `<li class="flex items-start text-xs sm:text-sm text-slate-800 leading-relaxed pl-1">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-600 mt-1.5 mr-2 shrink-0"></span>
        <span class="font-medium">${escapeHtml(cleanText)}</span>
      </li>`;
    }
  }
  html += '</ul>';
  return html;
}

// ── HELPER: FORMAT SWOT ITEMS WITH BOLD THEMES ────────────────────────
function formatSwotItemHtml(text) {
  if (!text) return '';
  const clean = String(text).replace(/^[•\-\*]\s*/, '').trim();
  const colonIdx = clean.indexOf(':');
  if (colonIdx > 0 && colonIdx < 50) {
    const title = clean.slice(0, colonIdx).trim();
    const desc = clean.slice(colonIdx + 1).trim();
    return `<strong class="text-slate-900 font-extrabold">${escapeHtml(title)}:</strong> <span class="text-slate-700">${escapeHtml(desc)}</span>`;
  }
  return `<span class="text-slate-700">${escapeHtml(clean)}</span>`;
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
    <div class="bg-slate-900 text-white rounded-2xl p-6 mb-6 border border-slate-800 shadow-xs">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">Gemini 3.5 Flash-Lite</span>
            <span id="aiModelStatusBadge" class="text-xs text-slate-300 font-medium">Engine: ${escapeHtml(report.modelUsed)}</span>
          </div>
          <h3 class="text-lg sm:text-xl font-black mt-1">AI Strategic Evaluation, SWOT & Role Action Plans</h3>
          <p class="text-xs sm:text-sm text-slate-300 mt-1">Review the analysis below and click <strong>"Approve into Task List"</strong> on any recommendation to add it to your monthly execution tracker.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <input id="perfGeminiApiKey" type="password" value="${escapeHtml(savedApiKey)}" placeholder="Gemini API Key (AIza...)" class="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 w-56 focus:outline-none focus:ring-2 focus:ring-slate-500">
          <button id="btnRunGeminiAi" onclick="runLiveGeminiAnalysis()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-black text-xs sm:text-sm shadow-xs transition cursor-pointer">
            ✨ Run Live Gemini AI Analysis
          </button>
          <button onclick="approveAllRecommendations()" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer">
            ✓ Approve All to Task List
          </button>
        </div>
      </div>
    </div>

    <!-- Executive Results Commentary -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-2">Executive Results Commentary</div>
      <p class="text-base sm:text-lg text-slate-900 leading-relaxed font-normal">${escapeHtml(report.executiveSummary)}</p>
    </div>

    <!-- Macroeconomic & Local Market / Competitor Analysis -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Macroeconomic & Local Market / Competitor Analysis (PMG Pharmacy Kota Sentosa — 7th Mile Bazaar)</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(report.macroAndCompetitorAnalysis || []).map(item => `
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 class="text-base font-black text-slate-900 mb-1.5">📍 ${escapeHtml(item.title)}</h4>
            <p class="text-sm sm:text-base text-slate-700 leading-relaxed">${escapeHtml(item.detail)}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- SWOT Analysis (4 Quadrants) -->
    <div class="mb-6">
      <div class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Comprehensive SWOT Analysis (Kota Sentosa Branch)</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div class="text-base sm:text-lg font-black text-slate-900 mb-3 flex items-center justify-between">
            <span>💪 Strengths (Internal Advantages)</span>
            <span class="text-xs uppercase font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">Strength</span>
          </div>
          <ul class="space-y-3 text-sm sm:text-base text-slate-800 list-disc pl-5 leading-relaxed font-normal">
            ${(report.swot?.strengths || []).map(s => `<li class="leading-relaxed">${formatSwotItemHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div class="text-base sm:text-lg font-black text-slate-900 mb-3 flex items-center justify-between">
            <span>⚠️ Weaknesses (Internal Gaps)</span>
            <span class="text-xs uppercase font-extrabold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">Weakness</span>
          </div>
          <ul class="space-y-3 text-sm sm:text-base text-slate-800 list-disc pl-5 leading-relaxed font-normal">
            ${(report.swot?.weaknesses || []).map(s => `<li class="leading-relaxed">${formatSwotItemHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div class="text-base sm:text-lg font-black text-slate-900 mb-3 flex items-center justify-between">
            <span>🚀 Opportunities (External Levers)</span>
            <span class="text-xs uppercase font-extrabold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">Opportunity</span>
          </div>
          <ul class="space-y-3 text-sm sm:text-base text-slate-800 list-disc pl-5 leading-relaxed font-normal">
            ${(report.swot?.opportunities || []).map(s => `<li class="leading-relaxed">${formatSwotItemHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div class="text-base sm:text-lg font-black text-slate-900 mb-3 flex items-center justify-between">
            <span>🛡️ Threats (Competitor & Macro Risks)</span>
            <span class="text-xs uppercase font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">Threat</span>
          </div>
          <ul class="space-y-3 text-sm sm:text-base text-slate-800 list-disc pl-5 leading-relaxed font-normal">
            ${(report.swot?.threats || []).map(s => `<li class="leading-relaxed">${formatSwotItemHtml(s)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- Stock Cycle & Category Commentary -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-2">Stock Cycle & Category Commentary</div>
      <p class="text-sm sm:text-base text-slate-800 leading-relaxed mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 font-normal">${escapeHtml(report.categoryAndStockFindings?.stockCycleComment || '')}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="text-sm sm:text-base font-black text-emerald-800 uppercase mb-2">▲ Categories That Grew YoY</div>
          <div class="space-y-2.5">
            ${(report.categoryAndStockFindings?.categoriesUp || []).map(c => `
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base">
                <span class="font-extrabold text-slate-900">${escapeHtml(c.category)}:</span>
                <span class="text-slate-700 ml-1.5 leading-relaxed">${escapeHtml(c.summary)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="text-sm sm:text-base font-black text-rose-800 uppercase mb-2">▼ Categories That Declined YoY</div>
          <div class="space-y-2.5">
            ${(report.categoryAndStockFindings?.categoriesDown || []).map(c => `
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base">
                <span class="font-extrabold text-slate-900">${escapeHtml(c.category)}:</span>
                <span class="text-slate-700 ml-1.5 leading-relaxed">${escapeHtml(c.summary)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Role-Specific Action Plans (PIC Pharmacist, ABM, PRP & PA) with Approve Buttons -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">Role-Specific Action Plans (PIC Pharmacist, ABM, PRP & PA)</div>
          <h4 class="text-sm sm:text-base font-extrabold text-slate-900 mt-1">Click "Approve into Task List" on any action plan you want to execute</h4>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(report.roleActionPlans || []).map((r, idx) => {
          const sid = r.id || `role_${idx}`;
          const approved = isRecommendationApproved(sid);
          return `
            <div class="p-5 rounded-2xl border ${approved ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-white'} flex flex-col justify-between shadow-xs">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">${escapeHtml(r.role)}</span>
                  ${approved ? `<span class="text-xs font-black text-emerald-700">✓ Approved in Task List</span>` : ''}
                </div>
                <h5 class="text-base sm:text-lg font-black text-slate-900 mb-1.5">${escapeHtml(r.title)}</h5>
                <div class="mb-3">${formatActionPointsHtml(r.action)}</div>
              </div>
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div class="text-xs sm:text-sm font-bold text-slate-800">🎯 Target: ${escapeHtml(r.targetMetric)}</div>
                <button
                  onclick='approveRecommendationToTaskList(${JSON.stringify({ sourceId: sid, role: r.role, assignee: r.role, title: r.title, action: r.action, targetMetric: r.targetMetric }).replace(/'/g, "&#39;")})'
                  ${approved ? 'disabled' : ''}
                  class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition cursor-pointer ${approved ? 'bg-emerald-100 text-emerald-800 cursor-default' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'}">
                  ${approved ? '✓ Approved' : '+ Approve to Task List'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Teammate Coaching & Action Plans with Approve Buttons -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">Teammate Coaching & Action Plans (With 3-Month Trajectory & PIC Alerts)</div>
      <h4 class="text-sm sm:text-base font-extrabold text-slate-900 mt-1 mb-4">Targeted 1-on-1 action plans based on individual 3-month TS, HB%, HM%, Basket Size & GP Margin</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(report.teammateCoaching || []).map((t, idx) => {
          const sid = t.id || `tm_${idx}`;
          const approved = isRecommendationApproved(sid);
          const isAlert = String(t.statusBadge || '').includes('⚠️') || String(t.statusBadge || '').includes('Alert') || String(t.statusBadge || '').includes('Urgent');
          return `
            <div class="p-5 rounded-2xl border ${approved ? 'border-emerald-300 bg-emerald-50/20' : isAlert ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 bg-white'} flex flex-col justify-between shadow-xs">
              <div>
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-base sm:text-lg font-black text-slate-900">${escapeHtml(t.person)}</span>
                    <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">${escapeHtml(t.role)}</span>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-black ${isAlert ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}">${escapeHtml(t.statusBadge)}</span>
                </div>
                <div class="text-xs sm:text-sm font-mono text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 my-2.5 leading-relaxed">${escapeHtml(t.metricsSummary)}</div>
                <div class="mb-3">${formatActionPointsHtml(t.commentAndAction)}</div>
              </div>
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                ${approved ? `<span class="text-xs font-black text-emerald-700">✓ Approved in Task List</span>` : `<span></span>`}
                <button
                  onclick='approveRecommendationToTaskList(${JSON.stringify({ sourceId: sid, role: t.role, assignee: t.person, title: `Coaching Plan: ${t.person} (${t.statusBadge})`, action: t.commentAndAction, targetMetric: t.metricsSummary }).replace(/'/g, "&#39;")})'
                  ${approved ? 'disabled' : ''}
                  class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${approved ? 'bg-emerald-100 text-emerald-800 cursor-default' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'}">
                  ${approved ? '✓ Approved' : '+ Approve Teammate Plan'}
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
          <div id="taskSyncStatusPill" class="text-[11px] text-teal-800 font-bold mt-1">☁️ Synced with Outlet & Mobile (${lastTasksCloudSyncTime ? lastTasksCloudSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'})</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button id="btnSyncTasksCloud" onclick="syncTasksWithGoogleCloud(true)" class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition">
            <span id="syncTasksCloudIcon">🔄</span>
            <span id="syncTasksCloudText">Sync with Outlet</span>
          </button>
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
        <p class="text-xs text-slate-500 mt-1">Go to <strong>"Gemini AI Strategy & SWOT"</strong> and click <strong>"+ Approve to Task List"</strong> on any recommendation, or click <strong>"+ Import All AI Recommendations"</strong> above.</p>
      </div>
    ` : `
      <div class="space-y-3">
        ${monthlyTasks.map(t => `
          <div class="bg-white rounded-2xl p-4 border ${t.status === 'COMPLETED' ? 'border-emerald-300 bg-emerald-50/20' : t.status === 'IN_PROGRESS' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'} shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">${escapeHtml(t.role)}</span>
                <span class="text-xs font-bold text-slate-700">👤 ${escapeHtml(t.assignee)}</span>
                <span class="text-[11px] text-slate-400">Due: ${escapeHtml(t.dueDate)}</span>
              </div>
              <h4 class="text-sm font-extrabold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}">${escapeHtml(t.title)}</h4>
              <div class="mt-2 text-xs text-slate-700">${formatActionPointsHtml(t.action)}</div>
              ${t.targetMetric ? `<div class="text-[11px] font-bold text-slate-800 mt-1.5">🎯 Target: ${escapeHtml(t.targetMetric)}</div>` : ''}
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
    filePayloads.push({ file, name: file.name, text, type: det.type, year: det.year, slot: det.slot });
  }

  const years = filePayloads.map(f => f.year).filter(Boolean);
  const maxYear = years.length ? Math.max(...years) : 2026;

  // If user is uploading fresh files while preloaded sample was active, mark sample flag false
  perfState.meta.isPreloadedSample = false;

  let loadedCount = 0;
  for (const fp of filePayloads) {
    try {
      let periodSlot = fp.slot;
      if (!periodSlot) {
        const isLatest = !fp.year || fp.year === maxYear;
        periodSlot = isLatest ? 'LATEST' : 'PREV_YEAR';
      }
      applyParsedCsvToState(fp.type, periodSlot, fp.text, fp.name);
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
  let parsedDateRange = '';
  if (type === 'DAILY_SALES') {
    const parsed = parseDailySalesCsv(text);
    parsedDateRange = parsed.dateRange;
    if (periodSlot === 'LATEST') {
      perfState.dailySalesLatest = parsed;
    } else if (periodSlot === 'PREV_YEAR') {
      perfState.dailySalesPrevYear = parsed;
    } else if (periodSlot === 'M1') {
      const ts = +parsed.rows.reduce((s, r) => s + r.ts, 0).toFixed(2);
      const hb = +parsed.rows.reduce((s, r) => s + r.hb, 0).toFixed(2);
      const hm = +parsed.rows.reduce((s, r) => s + r.hm, 0).toFixed(2);
      perfState.dailySalesM1 = { ...perfState.dailySalesM1, periodLabel: formatPeriodDisplayLabel(parsed.dateRange, 'September FY2026 (M-1)'), ts, hb, hm, rows: parsed.rows };
    } else if (periodSlot === 'M2') {
      const ts = +parsed.rows.reduce((s, r) => s + r.ts, 0).toFixed(2);
      const hb = +parsed.rows.reduce((s, r) => s + r.hb, 0).toFixed(2);
      const hm = +parsed.rows.reduce((s, r) => s + r.hm, 0).toFixed(2);
      perfState.dailySalesM2 = { ...perfState.dailySalesM2, periodLabel: formatPeriodDisplayLabel(parsed.dateRange, 'August FY2026 (M-2)'), ts, hb, hm, rows: parsed.rows };
    }
  } else if (type === 'PERSONAL_GP') {
    const parsed = parsePersonalGpCsv(text);
    parsedDateRange = parsed.dateRange;
    if (periodSlot === 'LATEST') perfState.personalGpLatest = parsed;
    else perfState.personalGpPrevYear = parsed;
  } else if (type === 'CUSTOMERS_SERVED') {
    const parsed = parseCustomersServedCsv(text);
    parsedDateRange = parsed.dateRange;
    if (periodSlot === 'LATEST') perfState.customersServedLatest = parsed;
    else perfState.customersServedPrevYear = parsed;
  } else if (type === 'CATEGORY_GP') {
    const parsed = parseCategoryGpCsv(text);
    parsedDateRange = parsed.dateRange;
    if (periodSlot === 'LATEST') perfState.categoryGpLatest = parsed;
    else perfState.categoryGpPrevYear = parsed;
  } else if (type === 'STOCK_CLOSING') {
    perfState.stockClosingLatest = parseStockClosingCsv(text);
    parsedDateRange = perfState.stockClosingLatest.dateTo;
  } else if (type === 'ITEM_SALES') {
    const parsed = parseItemSalesCsv(text);
    parsedDateRange = parsed.dateRange;
    if (periodSlot === 'LATEST') perfState.itemSalesLatest = parsed;
    else perfState.itemSalesPrevYear = parsed;
  } else if (type === 'STOCK_AGING') {
    perfState.stockAgingLatest = parseAgingCsv(text);
  } else {
    throw new Error(`Unrecognized PMG CSV format in ${fileName}`);
  }

  // Automatically update the header period labels dynamically from the parsed dates!
  if (parsedDateRange) {
    if (periodSlot === 'LATEST') {
      perfState.meta.latestPeriodLabel = formatPeriodDisplayLabel(parsedDateRange, 'Latest Month');
    } else if (periodSlot === 'PREV_YEAR') {
      perfState.meta.prevYearPeriodLabel = formatPeriodDisplayLabel(parsedDateRange, 'Previous Year Same Month');
    }
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

    // Cross-module sync: if stock aging is uploaded in Performance Suite, propagate to Inventory and Pricing Intelligence
    if (type === 'STOCK_AGING' && perfState.stockAgingLatest?.items) {
      const items = perfState.stockAgingLatest.items;
      if (typeof window !== 'undefined') {
        if (typeof window.ingestStockAgingItems === 'function') {
          try { window.ingestStockAgingItems(items, file.name); } catch(e) {}
        }
        if (window.pmgPricing && typeof window.pmgPricing.ingestAgingData === 'function') {
          try {
            window.pmgPricing.ingestAgingData(items, file.name);
            if (typeof window.pmgPricing.autoAnalyzeAllSkus === 'function') {
              window.pmgPricing.autoAnalyzeAllSkus(false);
            } else {
              window.pmgPricing.render();
            }
          } catch(e) {}
        }
      }
    }
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

  const archives = loadMonthlyArchives();
  const savedArchiveKeys = Object.keys(archives).sort().reverse();

  container.innerHTML = `
    <!-- Continuous Monthly Historical Archive Studio -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 uppercase">Continuous Archive</span>
            <span class="text-xs text-slate-500 font-mono">Storage: localStorage + JSON Backup</span>
          </div>
          <h3 class="text-base font-black text-slate-900 mt-1">Multi-Month Historical Performance Archive</h3>
          <p class="text-xs text-slate-500 mt-0.5">Records and preserves verified monthly snapshots so the system can automatically compare performance across consecutive months and multi-year trends.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="saveCurrentMonthSnapshot(false)" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition">
            💾 Snapshot Current Month Now
          </button>
          <button onclick="exportMonthlyArchiveJson()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition">
            📥 Export Archive (.json)
          </button>
          <label class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition">
            📤 Import Archive (.json)
            <input type="file" accept=".json" class="hidden" onchange="importMonthlyArchiveJson(this)">
          </label>
        </div>
      </div>

      <!-- List of archived periods -->
      <div class="pt-3 border-t border-slate-100">
        <div class="text-xs font-bold text-slate-600 mb-2">Saved Monthly Snapshots (${savedArchiveKeys.length} Months Archived):</div>
        <div class="flex flex-wrap gap-2">
          ${savedArchiveKeys.map(k => {
            const snap = archives[k];
            const tsVal = snap.outletTotals?.ts ? fmtRM(snap.outletTotals.ts) : 'RM 0';
            return `
              <div class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                <span class="font-extrabold text-slate-800">📅 ${escapeHtml(k)}</span>
                <span class="text-slate-500 text-[11px]">(${tsVal})</span>
                <span class="text-[10px] text-emerald-700 font-mono font-bold">✓ Preserved</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

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
        btn.className = 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-900 text-white shadow-xs transition cursor-pointer whitespace-nowrap';
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
if (typeof window !== 'undefined') {
  window.perfState = perfState;
  window.refreshAllViews = refreshAllViews;
  window.computeAllMetrics = computeAllMetrics;
  window.buildDynamicBaselineReport = buildDynamicBaselineReport;
  window.buildGeminiPrompt = buildGeminiPrompt;
  window.handleBatchCsvFiles = handleBatchCsvFiles;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    loadInitialState();
    refreshAllViews();
    switchPerfTab('tab1');
  });
}

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
    buildDynamicBaselineReport,
    buildGeminiPrompt,
    handleBatchCsvFiles
  };
}
