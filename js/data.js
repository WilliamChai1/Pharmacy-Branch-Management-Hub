// js/data.js — PMG Branch Operations & Management Hub
// Static fallback data (used when offline or Google Sheets is unreachable).
// Live data is fetched from Google Sheets on every app load — see GOOGLE_SHEETS_CONFIG below.

'use strict';

// ─── GOOGLE SHEETS CONFIG ─────────────────────────────────────────────────────
//
// ✅ SAFE TO PUBLISH TO WEB (operational data, no passwords):
//    • Staff sheet   → Nickname, EmpNo, EmpName, BranchName
//    • Branches sheet → BranchName, shift start times
//
// 🔴 NEVER PUBLISH TO WEB:
//    • Users / credentials (usernames & PINs).
//    • Keep credentials ONLY in the USERS array below in this file.
//    • To change a PIN → edit USERS in this file → push to GitHub (~1 min).
//
// SETUP (one-time):
//   1. Upload Rymnet Conversion Excel to Google Sheets.
//   2. Click "Staff" tab → File → Share → Publish to web
//      → Select "Staff" → Format: CSV → Publish → copy URL.
//   3. Paste URL into staffCSV below. Leave usersCSV EMPTY.
//   4. Push data.js to GitHub — staff list auto-syncs on every page load.
//
const GOOGLE_SHEETS_CONFIG = {
  usersCSV:  '',   // 🔴 KEEP EMPTY — credentials never go to the web
  staffCSV:  '',   // ✅ https://docs.google.com/spreadsheets/d/e/2PACX-1vTlHMEjiMuH7Km9XtJkwENvsephsxLD6gMoX1uNrpyg-MOB24NU3-PaYbz53UvegxvnHVYbrBwHz693/pub?gid=1659746892&single=true&output=csv
  branchCSV: '',   // ✅ Paste published Branches CSV URL here (optional)
};

// ─── BRANCHES ────────────────────────────────────────────────────────────────
const BRANCHES = [
  { code: 'KS01', name: 'Kota Sentosa', startTime: '0730' },
  { code: 'BR02', name: 'Branch 02',    startTime: '0800' },
  { code: 'BR03', name: 'Branch 03',    startTime: '0800' },
  { code: 'BR04', name: 'Branch 04',    startTime: '0830' },
  { code: 'BR05', name: 'Branch 05',    startTime: '0800' },
  { code: 'BR06', name: 'Branch 06',    startTime: '0730' },
];

// ─── USERS / CREDENTIALS (offline fallback) ───────────────────────────────────
// When Google Sheets is reachable, this is overridden by live sheet data.
// Role: 'AM' if AssignedBranch === 'ALL', else 'BM'.
let USERS = [
  { username: 'williamchai', password: '833445', branch: 'Kota Sentosa', role: 'BM', displayName: 'William Chai' },
  { username: 'am',          password: '9999',   branch: 'ALL',          role: 'AM', displayName: 'Area Manager'  },
  { username: 'KS01',        password: '1234',   branch: 'Kota Sentosa', role: 'BM', displayName: 'Manager KS01'  },
  { username: 'BR02',        password: '1234',   branch: 'Branch 02',    role: 'BM', displayName: 'Manager BR02'  },
  { username: 'BR03',        password: '1234',   branch: 'Branch 03',    role: 'BM', displayName: 'Manager BR03'  },
  { username: 'BR04',        password: '1234',   branch: 'Branch 04',    role: 'BM', displayName: 'Manager BR04'  },
  { username: 'BR05',        password: '1234',   branch: 'Branch 05',    role: 'BM', displayName: 'Manager BR05'  },
  { username: 'BR06',        password: '1234',   branch: 'Branch 06',    role: 'BM', displayName: 'Manager BR06'  },
];

// ─── STAFF NICKNAME → RYMNET MAPPING (offline fallback) ──────────────────────
// When Google Sheets is reachable, this is overridden by live sheet data.
// Roselin (PMG03631) and Jamie (PMG03532) have left PMG — removed 19 Sep 2026.
let STAFF_MAP = [
  // ── Kota Sentosa (KS01) — active staff only ──
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'TING',       empNo: 'PMG00723', empName: 'TING KWANG YU'                   },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'WILLIAM',    empNo: 'PMG00831', empName: 'CHAI YEE SIAN'                    },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'LOUNA',      empNo: 'PMG01294', empName: 'HANIESHA LOUNA ANAK DAGENG'       },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'FIONA',      empNo: 'PMG01780', empName: 'FIONA FIENA ANAK JAMES'           },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'NURHAFIZAH', empNo: 'PMG02070', empName: 'NURHAFIZAH BINTI PAULI'           },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'PENNY',      empNo: 'PMG02694', empName: 'JONG PEI CHOO'                   },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'KENIX',      empNo: 'PMG02963', empName: 'KENIX LING WANG YIING'            },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'JANET',      empNo: 'PMG03062', empName: 'DANIELA JANET ANAK MUSTAPHA'     },
  { branch: 'Kota Sentosa', branchCode: 'KS01', nickname: 'FARIZIN',    empNo: 'PMG03375', empName: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH'},
  // ── BR02–BR06: add rows here OR just update the Google Sheet ──
];

// ─── LOOKUP TABLES (rebuilt after any live data load) ────────────────────────
let NICKNAME_LOOKUP = {};

function rebuildLookups() {
  NICKNAME_LOOKUP = {};
  STAFF_MAP.forEach(s => {
    NICKNAME_LOOKUP[s.nickname.toUpperCase().trim()] = s;
  });
}
rebuildLookups(); // Build from fallback data immediately

// ─── LIVE GOOGLE SHEETS LOADER ────────────────────────────────────────────────
// Called once on app boot. Silently falls back to static data if fetch fails.
async function loadLiveSheetData() {
  const indicator = document.getElementById('liveDataIndicator');
  const setIndicator = (msg, colour) => {
    if (indicator) { indicator.textContent = msg; indicator.className = `text-xs px-2 py-0.5 rounded ${colour}`; }
  };

  let loadedAnything = false;

  // ── Users / Credentials: NEVER loaded from external URL ──────────────────
  // Credentials stay in the USERS array in this file only.
  // This block is intentionally blocked for security — do NOT remove this guard.
  if (GOOGLE_SHEETS_CONFIG.usersCSV) {
    console.warn('[PMG Hub] ⛔ Security: usersCSV is set but will NOT be fetched. ' +
      'Credentials must stay in data.js only. Remove the usersCSV URL.');
    // Do NOT fetch — fall through to local USERS array always.
  }

  // ── Load Staff sheet ──────────────────────────────────────────────────────
  if (GOOGLE_SHEETS_CONFIG.staffCSV) {
    try {
      const resp = await fetchWithTimeout(GOOGLE_SHEETS_CONFIG.staffCSV, 5000);
      if (resp.ok) {
        const text   = await resp.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const liveStaff = parsed.data
          .filter(row => row.Nickname && row.EmpNo)
          .map(row => {
            const branchName = String(row.BranchName || '').trim();
            const bObj       = BRANCHES.find(b => b.name === branchName || b.code === branchName);
            return {
              branch:     branchName,
              branchCode: bObj ? bObj.code : branchName,
              nickname:   String(row.Nickname).trim().toUpperCase(),
              empNo:      String(row.EmpNo).trim(),
              empName:    String(row.EmpName || row.Nickname).trim(),
            };
          });
        if (liveStaff.length > 0) {
          STAFF_MAP = liveStaff;
          rebuildLookups(); // Rebuild with live data
          loadedAnything = true;
          console.log(`[PMG Hub] Loaded ${liveStaff.length} staff from Google Sheets.`);
        }
      }
    } catch (e) {
      console.warn('[PMG Hub] Staff sheet fetch failed, using offline fallback.', e.message);
    }
  }

  // ── Load Branches sheet (optional) ───────────────────────────────────────
  if (GOOGLE_SHEETS_CONFIG.branchCSV) {
    try {
      const resp = await fetchWithTimeout(GOOGLE_SHEETS_CONFIG.branchCSV, 5000);
      if (resp.ok) {
        const text   = await resp.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsed.data.forEach(row => {
          if (!row.BranchName) return;
          const existing = BRANCHES.find(b => b.name === row.BranchName.trim());
          if (existing && row.Col2_StartTime) existing.startTime = String(row.Col2_StartTime).trim();
        });
        loadedAnything = true;
      }
    } catch (e) {
      console.warn('[PMG Hub] Branches sheet fetch failed.', e.message);
    }
  }

  if (loadedAnything) {
    setIndicator('🟢 Live data synced', 'bg-green-100 text-green-700');
  } else if (GOOGLE_SHEETS_CONFIG.usersCSV || GOOGLE_SHEETS_CONFIG.staffCSV) {
    setIndicator('🟡 Offline — using cached data', 'bg-amber-100 text-amber-700');
  } else {
    setIndicator('📋 Offline mode (no sheet linked)', 'bg-gray-100 text-gray-500');
  }
}

function fetchWithTimeout(url, ms) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

// ─── SHIFT CODE MAPPING ───────────────────────────────────────────────────────
const SHIFT_CODE_MAP = [
  // 8-Hour Full Shifts
  { patterns: ['0730-1630', '07:30-16:30', '07:30 - 16:30', '7:30-16:30', '7.30-4.30PM', '7.30-4.30', '8H_0730-1630', '8H_0730-0430'],  code: '8H_0730-1630' },
  { patterns: ['0800-1700', '08:00-17:00', '08:00 - 17:00', '8:00-17:00', '8.00-5.00PM', '8.00-5.00', '8H_0800-1700'],                     code: '8H_0800-1700' },
  { patterns: ['0830-1730', '08:30-17:30', '08:30 - 17:30', '8:30-17:30', '8.30-5.30PM', '8.30-5.30', '8H_0830-1730'],                     code: '8H_0830-1730' },
  { patterns: ['1230-2130', '12:30-21:30', '12:30 - 21:30', '12.30-9.30PM', '12.30-9.30', '8H_1230-2130'],                                 code: '8H_1230-2130' },
  { patterns: ['1300-2200', '13:00-22:00', '13:00 - 22:00', '1.00-10.00PM', '1.00-10.00', '8H_1300-2200'],                                 code: '8H_1300-2200' },
  { patterns: ['1330-2230', '13:30-22:30', '13:30 - 22:30', '1.30-10.30PM', '1.30-10.30', '8H_1330-2230'],                                 code: '8H_1330-2230' },

  // 5-Hour Half Shifts
  { patterns: ['0730-1230', '07:30-12:30', '7:30-12:30', '7.30-12.30PM', '7.30-12.30', '5H_0730-1230'],                                     code: '5H_0730-1230' },
  { patterns: ['0800-1300', '08:00-13:00', '8:00-13:00', '8.00-1.00PM', '8.00-1.00', '5H_0800-1300'],                                       code: '5H_0800-1300' },
  { patterns: ['1630-2130', '16:30-21:30', '4.30-9.30PM', '4.30-9.30', '5H_1630-2130'],                                                     code: '5H_1630-2130' },

  // 4-Hour Part Shifts
  { patterns: ['0730-1130', '07:30-11:30', '7:30-11:30', '7.30-11.30AM', '7.30-11.30', '4H_0730-1130'],                                     code: '4H_0730-1130' },

  // Rest & Leave Status Codes (Rymnet standard)
  { patterns: ['RD', 'REST DAY', 'REST'],                                                                                                    code: 'RD'           },
  { patterns: ['OD', 'OFF DAY', 'OFF'],                                                                                                      code: 'OD'           },
  { patterns: ['ANL', 'AL', 'ANNUAL LEAVE', 'A/L'],                                                                                          code: 'ANL'          },
  { patterns: ['SL', 'MC', 'SICK LEAVE', 'SICK', 'MEDICAL CERTIFICATE', 'MED CERT'],                                                         code: 'SL'           },
  { patterns: ['PH', 'PUBLIC HOLIDAY', 'PH OFF'],                                                                                            code: 'PH'           },
  { patterns: ['RPL', 'REPLACEMENT LEAVE', 'REPLACEMENT', 'RL'],                                                                             code: 'RPL'          },
  { patterns: ['BL', 'BLOCK LEAVE', 'BEREAVEMENT LEAVE'],                                                                                    code: 'BL'           },
  { patterns: ['EL', 'EMERGENCY LEAVE'],                                                                                                     code: 'EL'           },
  { patterns: ['UPL', 'UNPAID LEAVE'],                                                                                                       code: 'UPL'          },
  { patterns: ['TRAINING', 'TRG'],                                                                                                           code: 'TRG'          },
  { patterns: ['NA', 'N/A'],                                                                                                                 code: 'NA'           },
];

// ─── PUBLIC HELPERS ──────────────────────────────────────────────────────────

function resolveShiftCode(raw) {
  if (!raw || String(raw).trim() === '') return '';
  const upper = String(raw).toUpperCase().trim();

  // If already standard Rymnet shift pattern (e.g. 8H_0730-1630, 5H_0800-1300, 4H_0730-1130)
  if (/^[0-9]H_[0-9]{4}-[0-9]{4}$/.test(upper)) {
    return upper;
  }

  for (const entry of SHIFT_CODE_MAP) {
    for (const pat of entry.patterns) {
      if (upper === pat.toUpperCase()) return entry.code;
    }
  }

  // Flexible numeric time-range match: "0730-1630" or "730-1630"
  const m = upper.replace(/[:\s]/g, '').match(/^(\d{3,4})-(\d{3,4})$/);
  if (m) {
    const s1 = parseInt(m[1], 10);
    const s2 = parseInt(m[2], 10);
    const diff = Math.round((s2 - s1) / 100);
    const prefix = diff <= 5 ? `${diff}H` : '8H';
    return `${prefix}_${m[1].padStart(4,'0')}-${m[2].padStart(4,'0')}`;
  }

  return upper || 'UNKNOWN';
}

function lookupStaff(query) {
  if (!query) return null;
  const q = String(query).toUpperCase().trim();

  // 1. By nickname
  if (NICKNAME_LOOKUP[q]) return NICKNAME_LOOKUP[q];

  // 2. By EmpNo (e.g. PMG00723)
  const byNo = STAFF_MAP.find(s => s.empNo && s.empNo.toUpperCase().trim() === q);
  if (byNo) return byNo;

  // 3. By full employee name
  const byName = STAFF_MAP.find(s => s.empName && s.empName.toUpperCase().trim() === q);
  if (byName) return byName;

  // 4. By partial/fuzzy name
  const byPartial = STAFF_MAP.find(s => s.empName && s.empName.toUpperCase().includes(q));
  if (byPartial) return byPartial;

  return null;
}

function getBranch(codeOrName) {
  const q = String(codeOrName).trim();
  return BRANCHES.find(b => b.code === q || b.name === q) || null;
}
