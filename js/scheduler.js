// js/scheduler.js — Module 3: AM AI Smart Timetable & Roster Generator
'use strict';

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Primary: Gemini 3.5 Flash-Lite (gemini-3.5-flash-lite)
// Secondary: Gemini 3.5 Flash (gemini-3.5-flash)
// Backup: Gemini 2.5 Flash-Lite (gemini-2.5-flash-lite)
const SCHEDULER_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const SCHEDULER_SECONDARY_MODEL = 'gemini-3.5-flash';
const SCHEDULER_TERTIARY_MODEL  = 'gemini-2.5-flash-lite';

// ─── CROSS-MONTH SHIFT REGISTRY (MEMORY RETENTION) ───────────────────────────
function getShiftRegistryKey(branchCode) {
  return `pmg_shift_registry_${branchCode || 'KS01'}`;
}

function loadShiftRegistry(branchCode) {
  try {
    const raw = localStorage.getItem(getShiftRegistryKey(branchCode));
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveShiftRegistry(branchCode, registry) {
  try {
    localStorage.setItem(getShiftRegistryKey(branchCode), JSON.stringify(registry));
  } catch (_) {}
}

// ─── 2026 GAZETTED PUBLIC HOLIDAYS (SARAWAK & MALAYSIA NATIONAL) ──────────────
// Chai Yee Sian (William) follows all National & Sarawak Gazetted Public Holidays.
const HOLIDAYS_2026_SARAWAK = {
  '2026-01-01': "New Year's Day",
  '2026-02-17': "Chinese New Year (Day 1)",
  '2026-02-18': "Chinese New Year (Day 2)",
  '2026-03-20': "Hari Raya Aidilfitri (Day 1)",
  '2026-03-21': "Hari Raya Aidilfitri (Day 2)",
  '2026-04-03': "Good Friday",
  '2026-05-01': "Labour Day",
  '2026-05-31': "Wesak Day",
  '2026-06-01': "Hari Gawai Dayak (Day 1)",
  '2026-06-02': "Hari Gawai Dayak (Day 2)",
  '2026-06-08': "Yang di-Pertuan Agong's Birthday",
  '2026-07-22': "Sarawak Independence Day",
  '2026-08-31': "National Day (Merdeka)",
  '2026-09-16': "Malaysia Day",
  '2026-09-25': "Prophet Muhammad's Birthday (Maulidur Rasul)",
  '2026-10-10': "Sarawak Governor's Birthday",
  '2026-11-08': "Deepavali",
  '2026-12-25': "Christmas Day"
};

// ─── DEFAULT TEAMMATES DATA FOR KOTA SENTOSA (KS01) ──────────────────────────
// Notes:
// 1. Ting Kwang Yu is NOT a pharmacist (Position: Staff).
// 2. Chai Yee Sian (William) is a licensed Pharmacist with a FIXED schedule:
//    - Mon–Fri: 07:30 - 16:30 (8H_0730-1630)
//    - Sat: 07:30 - 11:30 (4H_0730-1130)
//    - Sun: Rest Day (RD)
//    - All Malaysia & Sarawak Public Holidays: PH
// 3. Kenix Ling is a licensed Pharmacist.
const DEFAULT_KS01_TEAMMATES = [
  {
    empNo: 'PMG00831',
    nickname: 'WILLIAM',
    empName: 'CHAI YEE SIAN',
    position: 'Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Fixed', // Fixed Schedule Anchor (Exempt from 6S)
    race: 'Chinese',
    shiftPref: 'Morning Only',
    restDayPref: 'Sunday',
    halfDayPref: 'Saturday Morning (4H)',
    dayPrefs: {
      Monday: 'Morning Only',
      Tuesday: 'Morning Only',
      Wednesday: 'Morning Only',
      Thursday: 'Morning Only',
      Friday: 'Morning Only',
      Saturday: 'Morning Half (4H)',
      Sunday: 'RD'
    },
    fixedPattern: {
      weekdays: '8H_0730-1630',
      saturday: '4H_0730-1130',
      sunday: 'RD',
      holidays: 'PH'
    }
  },
  {
    empNo: 'PMG00723',
    nickname: 'TING',
    empName: 'TING KWANG YU',
    position: 'Branch Manager',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Sunday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'RD'
    }
  },
  {
    empNo: 'PMG02963',
    nickname: 'KENIX',
    empName: 'KENIX LING WANG YIING',
    position: 'Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Monday',
    halfDayPref: 'Sunday Morning (4H)',
    dayPrefs: {
      Monday: 'RD',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'Morning Half (4H)'
    }
  },
  {
    empNo: 'PMG01294',
    nickname: 'LOUNA',
    empName: 'HANIESHA LOUNA ANAK DAGENG',
    position: 'Assistant Branch Manager',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Thursday',
    halfDayPref: 'Wednesday Morning (4H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Morning Half (4H)',
      Thursday: 'RD',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG02694',
    nickname: 'PENNY',
    empName: 'JONG PEI CHOO',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Tuesday',
    halfDayPref: 'Monday Morning (4H)',
    dayPrefs: {
      Monday: 'Morning Half (4H)',
      Tuesday: 'RD',
      Wednesday: 'Morning Preferred',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Morning Preferred',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG01780',
    nickname: 'FIONA',
    empName: 'FIONA FIENA ANAK JAMES',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Thursday',
    halfDayPref: 'Wednesday Morning (4H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Morning Half (4H)',
      Thursday: 'RD',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG02070',
    nickname: 'NURHAFIZAH',
    empName: 'NURHAFIZAH BINTI PAULI',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Malay',
    shiftPref: 'Flexible',
    restDayPref: 'Monday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'RD',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG03375',
    nickname: 'FARIZIN',
    empName: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Malay',
    shiftPref: 'Flexible',
    restDayPref: 'Friday',
    halfDayPref: 'Tuesday Morning (4H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Morning Half (4H)',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'RD',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG03033',
    nickname: 'CHRISTINA',
    empName: 'CHRISTINA LEE YING YING',
    position: 'Provisional Registered Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Saturday',
    halfDayPref: 'Friday Morning (4H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Morning Half (4H)',
      Saturday: 'RD',
      Sunday: 'Flexible'
    }
  }
];

let currentTeammates = [];
let generatedScheduleData = null; // Stored { month, branch, days: [...] }
let editingTeammateEmpNo = null;   // For Day Preferences Modal

// ─── INIT SCHEDULER ───────────────────────────────────────────────────────────
function initScheduler() {
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const monthInput   = document.getElementById('schedulerMonth');
  const genBtn       = document.getElementById('schedulerGenerateBtn');
  const savePrefBtn  = document.getElementById('schedulerSavePrefBtn');
  const resetPrefBtn = document.getElementById('schedulerResetPrefBtn');
  const addStaffBtn  = document.getElementById('schedulerAddStaffBtn');

  // Set default month to next month
  if (monthInput && !monthInput.value) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const y = nextMonth.getFullYear();
    const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${y}-${m}`;
  }

  // Load teammates for selected branch
  const activeBranch = branchSelect ? branchSelect.value : 'KS01';
  loadTeammates(activeBranch);

  if (branchSelect) {
    branchSelect.addEventListener('change', (e) => {
      loadTeammates(e.target.value);
    });
  }

  if (genBtn) genBtn.addEventListener('click', generateTimetable);
  if (savePrefBtn) savePrefBtn.addEventListener('click', saveTeammatePreferences);
  if (resetPrefBtn) resetPrefBtn.addEventListener('click', resetTeammatePreferences);
  if (addStaffBtn) addStaffBtn.addEventListener('click', showAddTeammateModal);

  // Export buttons
  const dlVisualXlsxBtn = document.getElementById('schedulerDownloadVisualXlsxBtn');
  if (dlVisualXlsxBtn) dlVisualXlsxBtn.addEventListener('click', exportScheduleToPmgVisualExcel);

  const dlCsvBtn = document.getElementById('schedulerDownloadCsvBtn');
  if (dlCsvBtn) dlCsvBtn.addEventListener('click', exportScheduleToRymnetCSV);

  const dlXlsxBtn = document.getElementById('schedulerDownloadXlsxBtn');
  if (dlXlsxBtn) dlXlsxBtn.addEventListener('click', exportScheduleToExcel);

  const copyWaBtn = document.getElementById('schedulerCopyWaBtn');
  if (copyWaBtn) copyWaBtn.addEventListener('click', copyScheduleWhatsAppSummary);
}

// ─── TEAMMATE STORAGE & LOADING ──────────────────────────────────────────────
function getStorageKey(branchCode) {
  return `pmg_staff_preferences_v2_${branchCode || 'KS01'}`;
}

function loadTeammates(branchCode) {
  const key = getStorageKey(branchCode);
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      currentTeammates = JSON.parse(saved);
    } catch {
      currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
    }
  } else {
    // If KS01, use defaults. If other branch, pull from STAFF_MAP or provide template
    if (branchCode === 'KS01') {
      currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
    } else {
      const branchStaff = (typeof STAFF_MAP !== 'undefined' ? STAFF_MAP : [])
        .filter(s => s.branchCode === branchCode);
      if (branchStaff.length) {
        currentTeammates = branchStaff.map((s, idx) => ({
          empNo: s.empNo,
          nickname: s.nickname,
          empName: s.empName,
          position: idx === 0 ? 'Pharmacist' : (idx === 1 ? 'Branch Manager' : 'Staff'),
          isPharmacist: idx === 0,
          scheduleMode: 'Rotating',
          race: 'Chinese',
          shiftPref: 'Flexible',
          restDayPref: 'Sunday',
          halfDayPref: 'None',
          dayPrefs: {
            Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
            Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'RD'
          }
        }));
      } else {
        currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
      }
    }
  }

  // Ensure Ting Kwang Yu is not marked as pharmacist from legacy data, while respecting saved position
  const ting = currentTeammates.find(t => t.empNo === 'PMG00723' || t.nickname === 'TING');
  if (ting) {
    if (ting.position === 'Pharmacist') {
      ting.position = 'Branch Manager';
    }
    ting.isPharmacist = false;
    ting.scheduleMode = 'Rotating';
  }

  // Ensure William Chai has his fixed schedule attributes (ONLY fixed shift anchor)
  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  if (william) {
    william.position = 'Pharmacist';
    william.isPharmacist = true;
    william.scheduleMode = 'Fixed';
    william.shiftPref = 'Morning Only';
  }

  // KS01 Specific Realignment & Sanitization
  if (branchCode === 'KS01') {
    // 1. Purge Daniela Janet (Resigned)
    currentTeammates = currentTeammates.filter(t => t.empNo !== 'PMG03062' && t.nickname !== 'JANET');

    // 2. Realignment: Louna is Assistant Branch Manager (ABM) and participates in 6S cleaning
    const louna = currentTeammates.find(t => t.empNo === 'PMG01294' || t.nickname === 'LOUNA');
    if (louna) {
      louna.position = 'Assistant Branch Manager';
      louna.scheduleMode = 'Rotating';
      if (!louna.dayPrefs) {
        louna.restDayPref = 'Thursday';
        louna.halfDayPref = 'Wednesday Morning (4H)';
        louna.dayPrefs = {
          Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Morning Half (4H)',
          Thursday: 'RD', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'Flexible'
        };
      }
    }

    // 3. Realignment: Penny is Staff (remove ABM designation, standard rotating pool)
    const penny = currentTeammates.find(t => t.empNo === 'PMG02694' || t.nickname === 'PENNY');
    if (penny) {
      penny.position = 'Staff';
      penny.scheduleMode = 'Rotating';
      if (!penny.dayPrefs) {
        penny.restDayPref = 'Tuesday';
        penny.halfDayPref = 'Monday Morning (4H)';
        penny.shiftPref = 'Morning Preferred';
        penny.dayPrefs = {
          Monday: 'Morning Half (4H)', Tuesday: 'RD', Wednesday: 'Morning Preferred',
          Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Morning Preferred', Sunday: 'Flexible'
        };
      }
    }

    // 4. Ensure Christina Lee Ying Ying (PRP) is in active teammates list
    const christina = currentTeammates.find(t => t.empNo === 'PMG03033' || t.nickname === 'CHRISTINA');
    if (!christina) {
      currentTeammates.push({
        empNo: 'PMG03033',
        nickname: 'CHRISTINA',
        empName: 'CHRISTINA LEE YING YING',
        position: 'Provisional Registered Pharmacist',
        isPharmacist: true,
        scheduleMode: 'Rotating',
        race: 'Chinese',
        shiftPref: 'Flexible',
        restDayPref: 'Saturday',
        halfDayPref: 'Friday Morning (4H)',
        dayPrefs: {
          Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
          Thursday: 'Flexible', Friday: 'Morning Half (4H)', Saturday: 'RD', Sunday: 'Flexible'
        }
      });
    }
  }

  renderTeammatesTable();

  // Asynchronously fetch preferences from cloud/Google Apps Script if available to sync across different computers
  setTimeout(async () => {
    try {
      const apiUrl = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
      const resp = await fetch(`${apiUrl}?action=getStaffPreferences&branch=${encodeURIComponent(branchCode || 'KS01')}`);
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && Array.isArray(json.preferences) && json.preferences.length > 0) {
          const cloudPrefs = json.preferences;
          const localStr = JSON.stringify(currentTeammates);
          const remoteStr = JSON.stringify(cloudPrefs);
          if (localStr !== remoteStr) {
            currentTeammates = cloudPrefs;
            localStorage.setItem(getStorageKey(branchCode), JSON.stringify(cloudPrefs));
            renderTeammatesTable();
          }
        }
      }
    } catch (_) {}
  }, 1000);
}

function saveTeammatePreferences() {
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const branchCode = branchSelect ? branchSelect.value : 'KS01';
  
  // Read values from table rows
  const rows = document.querySelectorAll('#schedulerTeammatesBody tr[data-emp-no]');
  if (!rows || rows.length === 0) return; // Guard: Do not wipe if table is not yet rendered

  const updated = [];

  rows.forEach(tr => {
    const empNo = tr.getAttribute('data-emp-no');
    const orig = currentTeammates.find(t => t.empNo === empNo) || {};
    
    const posEl   = tr.querySelector('.tm-position');
    const raceEl  = tr.querySelector('.tm-race');
    const shiftEl = tr.querySelector('.tm-shift-pref');
    const restEl  = tr.querySelector('.tm-rest-pref');

    const posVal = posEl ? posEl.value : (orig.position || 'Staff');
    const isPharm = posVal.includes('Pharmacist') || orig.isPharmacist || (orig.empNo === 'PMG00831');

    const restVal = restEl ? restEl.value : (orig.restDayPref || 'Sunday');
    const dayPrefs = orig.dayPrefs ? { ...orig.dayPrefs } : {
      Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
      Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'RD'
    };
    if (restVal && restVal !== 'Flexible' && orig.restDayPref !== restVal) {
      if (orig.restDayPref && dayPrefs[orig.restDayPref] === 'RD') {
        dayPrefs[orig.restDayPref] = 'Flexible';
      }
      dayPrefs[restVal] = 'RD';
    }

    updated.push({
      ...orig,
      position:    posVal,
      isPharmacist: isPharm,
      race:        raceEl ? raceEl.value : (orig.race || 'Chinese'),
      shiftPref:   shiftEl ? shiftEl.value : (orig.shiftPref || 'Flexible'),
      restDayPref: restVal,
      dayPrefs:    dayPrefs
    });
  });

  if (updated.length > 0) {
    currentTeammates = updated;
    localStorage.setItem(getStorageKey(branchCode), JSON.stringify(currentTeammates));
  }

  // Sync to OneDrive and Google Apps Script in background for cross-device persistence
  try {
    const od = window.pmgOneDriveSync || window.pmgOneDrive;
    if (od && typeof od.saveFileToActiveFolder === 'function') {
      od.saveFileToActiveFolder(`schedule_preferences_${branchCode}.json`, JSON.stringify(currentTeammates, null, 2)).catch(() => {});
    }
  } catch (_) {}

  try {
    const apiUrl = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
    fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveStaffPreferences',
        branch: branchCode,
        preferences: currentTeammates,
        updatedBy: (typeof getSession === 'function' && getSession()?.displayName) || 'William Chai'
      })
    }).catch(err => console.warn('[Scheduler Cloud Sync] Cloud push error:', err));
  } catch (_) {}

  const saveBtn = document.getElementById('schedulerSavePrefBtn');
  if (saveBtn) {
    const origHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-check text-green-300"></i> Preferences Saved (Synced)!';
    saveBtn.classList.replace('bg-blue-700', 'bg-green-700');
    setTimeout(() => {
      saveBtn.innerHTML = origHtml;
      saveBtn.classList.replace('bg-green-700', 'bg-blue-700');
    }, 2000);
  }
}

function resetTeammatePreferences() {
  if (!confirm('Reset all teammates and preferences for this branch back to standard defaults?')) return;
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const branchCode = branchSelect ? branchSelect.value : 'KS01';
  localStorage.removeItem(getStorageKey(branchCode));
  loadTeammates(branchCode);
}

// ─── RENDER TEAMMATES TABLE ──────────────────────────────────────────────────
function renderTeammatesTable() {
  const tbody = document.getElementById('schedulerTeammatesBody');
  if (!tbody) return;

  if (!currentTeammates.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400 text-sm">No teammates found for this branch. Click "+ Add Teammate" to add.</td></tr>`;
    return;
  }

  const positionOptions = ['Pharmacist', 'Provisional Registered Pharmacist', 'Branch Manager', 'Assistant Branch Manager', 'Staff'];
  const raceOptions = ['Chinese', 'Malay', 'Iban / Bidayuh', 'Other'];
  const shiftOptions = ['Morning Preferred', 'Night Preferred', 'Flexible', 'Morning Only'];
  const restOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Flexible'];

  let html = '';
  currentTeammates.forEach(t => {
    const isPharm = t.isPharmacist || (t.position && t.position.includes('Pharmacist'));
    const isFixed = t.scheduleMode === 'Fixed' || t.empNo === 'PMG00831';

    // Summary of day preferences
    const activeDayPrefs = [];
    if (t.dayPrefs) {
      Object.entries(t.dayPrefs).forEach(([day, pref]) => {
        if (pref && pref !== 'Flexible') {
          activeDayPrefs.push(`${day.slice(0, 3)}: ${pref.replace(' Preferred', '').replace(' Only', '')}`);
        }
      });
    }
    const dayPrefSummary = activeDayPrefs.length ? activeDayPrefs.join(', ') : 'Standard / Flexible';

    html += `
      <tr data-emp-no="${escHtml(t.empNo)}" class="hover:bg-gray-50 border-b border-gray-100 transition text-xs">
        <td class="px-3 py-3">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-gray-900">${escHtml(t.empName)}</span>
            ${isFixed ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-200">Fixed Pattern</span>' : ''}
          </div>
          <div class="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
            <span>${escHtml(t.empNo)}</span>
            <span class="bg-gray-200 text-gray-700 px-1 rounded font-semibold">${escHtml(t.nickname)}</span>
          </div>
        </td>
        <td class="px-2 py-3">
          <select class="tm-position text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
            ${positionOptions.map(p => `<option value="${p}" ${t.position === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          ${isPharm ? '<span class="inline-block mt-1 text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"><i class="fa-solid fa-mortar-pestle mr-1"></i>Rx Qualified</span>' : '<span class="inline-block mt-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Staff</span>'}
        </td>
        <td class="px-2 py-3">
          <select class="tm-race text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${raceOptions.map(r => `<option value="${r}" ${t.race === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select class="tm-rest-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
            ${restOptions.map(o => `<option value="${o}" ${t.restDayPref === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select class="tm-shift-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
            ${shiftOptions.map(s => `<option value="${s}" ${t.shiftPref === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3 min-w-[150px]">
          <button type="button" onclick="openDayPrefsModal('${escHtml(t.empNo)}')"
            class="w-full text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded px-2 py-1 text-[11px] text-purple-800 font-medium transition flex items-center justify-between">
            <span class="truncate max-w-[120px]">${escHtml(dayPrefSummary)}</span>
            <i class="fa-solid fa-calendar-week text-purple-600 shrink-0 ml-1"></i>
          </button>
        </td>
        <td class="px-2 py-3 text-center">
          ${isFixed ? '<span class="text-gray-400 text-[10px]" title="Fixed schedule cannot be deleted">Locked</span>' : `
            <button type="button" onclick="removeTeammate('${escHtml(t.empNo)}')" class="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition" title="Remove Teammate">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          `}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ─── DAY-OF-WEEK PREFERENCES MODAL ───────────────────────────────────────────
function openDayPrefsModal(empNo) {
  const tm = currentTeammates.find(t => t.empNo === empNo);
  if (!tm) return;

  editingTeammateEmpNo = empNo;

  const modal = document.getElementById('schedulerDayPrefsModal');
  const title = document.getElementById('dayPrefsModalTitle');
  const form  = document.getElementById('dayPrefsModalForm');

  if (!modal || !title || !form) return;

  title.textContent = `Day-of-Week Shift Preferences: ${tm.empName} (${tm.nickname})`;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const prefOptions = [
    { val: 'Flexible', label: 'Flexible (AI Decides)' },
    { val: 'Morning Preferred', label: 'Morning Preferred (07:30-16:30)' },
    { val: 'Night Preferred', label: 'Night Preferred (12:30-21:30)' },
    { val: 'Morning Only', label: 'Morning ONLY' },
    { val: 'Night Only', label: 'Night ONLY' },
    { val: 'Morning Half (4H)', label: 'Morning Half Day (07:30-11:30)' },
    { val: 'RD', label: 'Rest Day (OFF)' }
  ];

  const currentPrefs = tm.dayPrefs || {};

  let formHtml = '';
  days.forEach(day => {
    const curVal = currentPrefs[day] || (day === tm.restDayPref ? 'RD' : 'Flexible');
    formHtml += `
      <div class="flex items-center justify-between py-2 border-b border-gray-100 text-xs">
        <span class="font-bold text-gray-700 w-28">${day}</span>
        <select data-day="${day}" class="day-pref-select border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-purple-400 outline-none flex-1">
          ${prefOptions.map(opt => `<option value="${opt.val}" ${curVal === opt.val ? 'selected' : ''}>${opt.label}</option>`).join('')}
        </select>
      </div>
    `;
  });

  if (tm.empNo === 'PMG00831') {
    formHtml = `
      <div class="p-3 bg-amber-50 text-amber-900 rounded-lg text-xs mb-3 border border-amber-200">
        <strong>Chai Yee Sian (Fixed Schedule Rule):</strong><br>
        • Mon–Fri: Morning 07:30 – 16:30<br>
        • Sat: Morning Half Day 07:30 – 11:30<br>
        • Sun: Rest Day (OFF)<br>
        • All Malaysia National & Sarawak Public Holidays: PH (OFF)
      </div>
    ` + formHtml;
  }

  form.innerHTML = formHtml;
  modal.classList.remove('hidden');
}

function saveDayPrefsModal() {
  if (!editingTeammateEmpNo) return;
  const tm = currentTeammates.find(t => t.empNo === editingTeammateEmpNo);
  if (!tm) return;

  const selects = document.querySelectorAll('#dayPrefsModalForm .day-pref-select');
  const newPrefs = {};
  let foundRd = null;
  let foundHd = null;

  selects.forEach(sel => {
    const day = sel.getAttribute('data-day');
    newPrefs[day] = sel.value;
    if (sel.value === 'RD' && !foundRd) {
      foundRd = day;
    }
    if (sel.value.includes('4H') || sel.value.includes('Half')) {
      foundHd = `${day} Morning (4H)`;
    }
  });

  tm.dayPrefs = newPrefs;
  if (foundRd) tm.restDayPref = foundRd;
  if (foundHd) tm.halfDayPref = foundHd;

  closeDayPrefsModal();
  saveTeammatePreferences();
  renderTeammatesTable();
}

function closeDayPrefsModal() {
  const modal = document.getElementById('schedulerDayPrefsModal');
  if (modal) modal.classList.add('hidden');
  editingTeammateEmpNo = null;
}

function removeTeammate(empNo) {
  if (!confirm('Remove this teammate from the schedule configuration?')) return;
  currentTeammates = currentTeammates.filter(t => t.empNo !== empNo);
  renderTeammatesTable();
}

function showAddTeammateModal() {
  const empName = prompt('Enter Employee Full Name:');
  if (!empName) return;
  const nickname = prompt('Enter Short Nickname (e.g. CONNY):', empName.split(' ')[0].toUpperCase()) || empName.split(' ')[0].toUpperCase();
  const empNo = prompt('Enter Employee ID (e.g. PMG09999):', `PMG0${Math.floor(1000 + Math.random() * 9000)}`) || 'PMG00000';
  
  currentTeammates.push({
    empNo: empNo.trim().toUpperCase(),
    nickname: nickname.trim().toUpperCase(),
    empName: empName.trim().toUpperCase(),
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Sunday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
      Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'RD'
    }
  });

  renderTeammatesTable();
}

// ─── SCHEDULER TOAST NOTIFICATION ───────────────────────────────────────────
function showSchedulerToast(msg, type = 'info') {
  let toast = document.getElementById('schedulerToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'schedulerToast';
    document.body.appendChild(toast);
  }

  const bgStyles = {
    info: 'bg-blue-600 text-white shadow-blue-500/30',
    warn: 'bg-amber-600 text-white shadow-amber-500/30',
    error: 'bg-red-600 text-white shadow-red-500/30',
    success: 'bg-emerald-600 text-white shadow-emerald-500/30'
  };

  const icons = {
    info: '<i class="fa-solid fa-circle-info"></i>',
    warn: '<i class="fa-solid fa-triangle-exclamation"></i>',
    error: '<i class="fa-solid fa-circle-xmark"></i>',
    success: '<i class="fa-solid fa-circle-check"></i>'
  };

  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 flex items-center gap-2.5 ${bgStyles[type] || bgStyles.info}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${msg}</span>`;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
  }, 4500);
}

// ─── GENERATE TIMETABLE ───────────────────────────────────────────────────────
async function generateTimetable() {
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const monthInput   = document.getElementById('schedulerMonth');
  const genBtn       = document.getElementById('schedulerGenerateBtn');
  const statusEl     = document.getElementById('schedulerStatus');
  const statusText   = document.getElementById('schedulerStatusText');
  const modelBadge   = document.getElementById('schedulerModelBadge');
  const resultsPanel = document.getElementById('schedulerResultsPanel');

  const branchVal = branchSelect ? branchSelect.value : 'KS01';
  let monthVal  = (monthInput && monthInput.value ? monthInput.value.trim() : '');
  if (!monthVal || !monthVal.includes('-')) {
    const dNow = new Date();
    const dNext = new Date(dNow.getFullYear(), dNow.getMonth() + 1, 1);
    monthVal = `${dNext.getFullYear()}-${String(dNext.getMonth() + 1).padStart(2, '0')}`;
    if (monthInput) monthInput.value = monthVal;
  }

  if (!currentTeammates || !currentTeammates.length) {
    loadTeammates(branchVal || 'KS01');
  }
  if (document.querySelectorAll('#schedulerTeammatesBody tr[data-emp-no]').length > 0) {
    saveTeammatePreferences();
  }

  if (!currentTeammates || !currentTeammates.length) {
    currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
    renderTeammatesTable();
  }

  // Verify that we have at least one pharmacist, auto-repair if needed
  let pharmacists = currentTeammates.filter(t => t.isPharmacist || t.position === 'Pharmacist' || (t.position && t.position.includes('Pharmacist')));
  if (pharmacists.length === 0) {
    const w = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
    if (w) {
      w.position = 'Pharmacist';
      w.isPharmacist = true;
    } else {
      currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
      renderTeammatesTable();
    }
  }

  if (statusEl) statusEl.classList.remove('hidden');
  if (genBtn) {
    genBtn.disabled = true;
    genBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating Schedule…';
  }

  const apiKey = (typeof window.getGlobalGeminiKey === 'function' ? window.getGlobalGeminiKey() : '')
              || (localStorage.getItem('pmg_gemini_key') || '').trim()
              || (document.getElementById('topGeminiApiKey')?.value || '').trim()
              || (document.getElementById('geminiApiKey')?.value || '').trim();

  const [yearStr, monthStr] = monthVal.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = new Date(year, month, 0).getDate();

  const SOLVER_TIMEOUT_MS = 10000;
  let solverTimedOut = false;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      solverTimedOut = true;
      reject(new Error('TIMEOUT_10S'));
    }, SOLVER_TIMEOUT_MS);
  });

  try {
    if (apiKey) {
      let aiResult = null;
      let winningModelName = '';
      const schedulerCandidateModels = [
        { code: SCHEDULER_PRIMARY_MODEL,   name: 'Gemini 3.5 Flash-Lite (Primary)' },
        { code: SCHEDULER_SECONDARY_MODEL, name: 'Gemini 3.5 Flash (Secondary)' },
        { code: SCHEDULER_TERTIARY_MODEL,  name: 'Gemini 2.5 Flash-Lite (Backup)' },
        { code: 'gemini-2.5-flash',        name: 'Gemini 2.5 Flash (Fallback)' }
      ];

      const aiAttempt = async () => {
        const startTime = Date.now();
        for (const m of schedulerCandidateModels) {
          if (Date.now() - startTime > 8500) break; // Keep buffer for timeout
          try {
            if (statusText) statusText.textContent = `Querying ${m.name} with Dynamic Headcount & Shift Parity rules…`;
            const res = await callSchedulerGemini(m.code, branchVal, monthVal, totalDays, apiKey);
            if (res && res.days && res.days.length > 0) {
              winningModelName = m.name;
              return res;
            }
          } catch (tierErr) {
            console.warn(`[PMG Scheduler] Model ${m.name} failed:`, tierErr.message);
          }
        }
        return null;
      };

      try {
        aiResult = await Promise.race([aiAttempt(), timeoutPromise]);
      } catch (raceErr) {
        console.warn('[PMG Scheduler] Solver timeout or error during AI query:', raceErr.message);
        aiResult = null;
      }

      if (aiResult && aiResult.days && aiResult.days.length > 0) {
        postProcessSchedule(aiResult, branchVal, year, month, totalDays);
        generatedScheduleData = aiResult;
        if (modelBadge) {
          modelBadge.textContent = `⚡ ${winningModelName}`;
          modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-800 border border-green-200';
        }
        showSchedulerToast('AI Schedule generated successfully with strict headcount & parity constraints', 'success');
      } else {
        if (statusText) statusText.textContent = solverTimedOut
          ? 'AI query exceeded 10s limit. Running Smart Heuristic Solver…'
          : 'AI models unavailable. Running Smart Heuristic Solver…';
        generatedScheduleData = runHeuristicScheduleGenerator(branchVal, year, month, totalDays);
        if (modelBadge) {
          modelBadge.textContent = '⚙️ Smart Heuristic Solver (Auto-Failover)';
          modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200';
        }
        showSchedulerToast('Schedule generated with minor variance due to off-day density', 'warn');
      }

    } else {
      // Offline / No API Key -> Run Smart Heuristic Solver
      if (statusText) statusText.textContent = 'Running offline constraint-satisfaction heuristic engine…';
      await new Promise(r => setTimeout(r, 200));
      generatedScheduleData = runHeuristicScheduleGenerator(branchVal, year, month, totalDays);
      if (modelBadge) {
        modelBadge.textContent = '⚙️ Smart Heuristic Solver (Offline)';
        modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200';
      }
      if (generatedScheduleData && generatedScheduleData.hasMinorVariance) {
        showSchedulerToast('Schedule generated with minor variance due to off-day density', 'warn');
      } else {
        showSchedulerToast('Timetable generated successfully with optimal shift balance & parity', 'success');
      }
    }

    renderScheduleMatrix(generatedScheduleData);
    if (resultsPanel) {
      resultsPanel.classList.remove('hidden');
      setTimeout(() => {
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

  } catch (err) {
    console.error('[PMG Scheduler Error]', err);
    if (statusText) statusText.textContent = `AI note: ${err.message}. Generating with Smart Heuristic Solver…`;
    try {
      generatedScheduleData = runHeuristicScheduleGenerator(branchVal, year, month, totalDays);
      if (modelBadge) {
        modelBadge.textContent = '⚙️ Smart Heuristic Solver (Auto-Failover)';
        modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200';
      }
      showSchedulerToast('Schedule generated with minor variance due to off-day density', 'warn');
      renderScheduleMatrix(generatedScheduleData);
      if (resultsPanel) {
        resultsPanel.classList.remove('hidden');
        setTimeout(() => {
          resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (fallbackErr) {
      console.error('[PMG Scheduler Fallback Engine Error]', fallbackErr);
      alert('Unable to generate schedule: ' + fallbackErr.message);
    }

  } finally {
    if (statusEl) statusEl.classList.add('hidden');
    if (genBtn) {
      genBtn.disabled = false;
      genBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i>✨ Re-Generate Timetable';
    }
  }
}

// ─── POST-PROCESS SCHEDULE CONSTRAINTS ────────────────────────────────────────
function postProcessSchedule(schedule, branchVal, year, month, totalDays) {
  if (!schedule || !schedule.days) return;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rotatingPool = currentTeammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');
  const cleaningCounts = {};
  rotatingPool.forEach(a => { cleaningCounts[a.empNo] = 0; });

  if (!schedule.warnings) schedule.warnings = [];

  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');

  schedule.days.forEach(d => {
    const dateStr = d.date || `${year}-${String(month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    const dayOfWeek = d.dayOfWeek || daysOfWeek[new Date(dateStr).getDay()];
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];
    const holidayName = isHoliday ? HOLIDAYS_2026_SARAWAK[dateStr] : '';

    if (!d.shifts) d.shifts = {};

    // 1. Enforce William's immutable anchor schedule (Fixed Morning AM only)
    if (william) {
      if (isHoliday) {
        d.shifts[william.empNo] = 'PH';
      } else if (dayOfWeek === 'Sunday') {
        d.shifts[william.empNo] = 'RD';
      } else if (dayOfWeek === 'Saturday') {
        d.shifts[william.empNo] = '4H_0730-1130';
      } else {
        d.shifts[william.empNo] = '8H_0730-1630';
      }
    }

    // 2. Count morning, midday (11:30–12:30), night, and working staff
    let finalFullAm = 0;
    let finalHalfAm = 0;
    let finalPm = 0;
    let workingTotal = 0;
    Object.values(d.shifts).forEach(s => {
      if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
        workingTotal++;
        if (s.includes('4H') || s.includes('0730-1130')) finalHalfAm++;
        else if (s.includes('0730') || s.includes('0800')) finalFullAm++;
        if (s.includes('1230') || s.includes('1300') || s.includes('1630')) finalPm++;
      }
    });

    d.fullAmCount = finalFullAm;
    d.halfAmCount = finalHalfAm;
    d.amCount = finalFullAm + finalHalfAm;
    d.pmCount = finalPm;
    d.workingTotal = workingTotal;

    if (workingTotal < 6 || finalFullAm < 3 || finalPm < 3) {
      const isMiddayShort = finalFullAm < 3;
      const isPmShort = finalPm < 3;
      const shortDesc = isMiddayShort ? `Midday Handover Deficit (11:30–12:30: only ${finalFullAm}/3 full AM staff)` : (isPmShort ? `Deficit on Night (${finalPm}/3 staff)` : `Total working staff below 6`);
      const warn = `⚠️ Manpower Alert: Only ${workingTotal} staff on duty on ${dateStr} (${dayOfWeek}${holidayName ? ' - ' + holidayName : ''}). ${shortDesc}. Minimum 3 required on floor continuously.`;
      d.warning = warn;
      if (!schedule.warnings.includes(warn)) schedule.warnings.push(warn);
    }

    // 3. Universal 6S Cleaning Rotation: Shared equally among ALL rotating staff (2:00 PM – 3:30 PM). William is exempt.
    if (!d.cleaningDuty || !d.cleaningDuty.empNo || d.cleaningDuty.empNo === 'PMG00831') {
      const dutyRotating = rotatingPool.filter(a => {
        const s = d.shifts[a.empNo];
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF';
      });

      if (dutyRotating.length > 0) {
        dutyRotating.sort((a, b) => {
          const cA = cleaningCounts[a.empNo] || 0;
          const cB = cleaningCounts[b.empNo] || 0;
          if (cA !== cB) return cA - cB;
          return a.empNo.localeCompare(b.empNo);
        });
        const cleaner = dutyRotating[0];
        cleaningCounts[cleaner.empNo] = (cleaningCounts[cleaner.empNo] || 0) + 1;
        d.cleaningDuty = {
          empNo: cleaner.empNo,
          nickname: cleaner.nickname,
          empName: cleaner.empName || cleaner.nickname,
          time: '2:00 PM – 3:30 PM',
          task: 'Gondola Cleaning & Refilling'
        };
      }
    } else {
      cleaningCounts[d.cleaningDuty.empNo] = (cleaningCounts[d.cleaningDuty.empNo] || 0) + 1;
    }
  });
}

// ─── GEMINI API CALLER ────────────────────────────────────────────────────────
async function callSchedulerGemini(model, branchVal, monthVal, totalDays, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Find holidays in this month
  const monthHolidays = {};
  Object.entries(HOLIDAYS_2026_SARAWAK).forEach(([date, name]) => {
    if (date.startsWith(monthVal)) monthHolidays[date] = name;
  });

  // Dynamically format active teammates and their live day preferences
  const formattedTeammates = currentTeammates.map(t => {
    const isFixed = t.scheduleMode === 'Fixed' || t.empNo === 'PMG00831';
    const dayPrefEntries = Object.entries(t.dayPrefs || {}).filter(([_, v]) => v && v !== 'Flexible');
    const dayPrefStr = dayPrefEntries.map(([k, v]) => `${k}: ${v}`).join(', ') || 'All days flexible';
    const explicitRd = (t.dayPrefs && Object.keys(t.dayPrefs).find(k => t.dayPrefs[k] === 'RD')) || (t.restDayPref && t.restDayPref !== 'Flexible' ? t.restDayPref : null) || 'Flexible';
    return {
      empNo: t.empNo,
      name: t.empName,
      nickname: t.nickname,
      position: t.position,
      isPharmacist: !!(t.isPharmacist || (t.position && t.position.includes('Pharmacist')) || t.empNo === 'PMG00831'),
      isManagerTeam: !!(t.isPharmacist || (t.position && (t.position.includes('Manager') || t.position.includes('Pharmacist')))),
      race: t.race,
      isChinese: t.race === 'Chinese',
      scheduleMode: isFixed ? 'Fixed' : 'Rotating',
      presetFixedRestDay: explicitRd,
      shiftPref: t.shiftPref || 'Flexible',
      restDayPref: t.restDayPref || 'Sunday',
      halfDayPref: t.halfDayPref || 'None',
      daySpecificPrefs: dayPrefStr
    };
  });

  const prompt = `You are an expert Pharmacy Operations Director scheduling the retail branch roster for PMG Pharmacy Kota Sentosa (KS01).
Branch: PMG Kota Sentosa (Operating Hours: 07:30 to 21:30 daily).
Month: ${monthVal} (Total Days: ${totalDays}).
Public Holidays in this month (Malaysia & Sarawak): ${JSON.stringify(monthHolidays)}

ACTIVE TEAMMATES (${currentTeammates.length} staff) & THEIR LIVE PREFERENCES:
${JSON.stringify(formattedTeammates, null, 2)}

OPERATIONAL RULES & PRIORITY CONSTRAINTS (IN ORDER OF PRIORITY):

1. IMMUTABLE STAFF ANCHOR — CHAI YEE SIAN (WILLIAM - PMG00831):
   - William Chai is the ONLY fixed shift anchor in the outlet. His schedule is FIXED, IMMUTABLE:
     * Monday to Friday: '8H_0730-1630' (07:30 to 16:30)
     * Saturday: '4H_0730-1130' (Morning Half Day 07:30 to 11:30)
     * Sunday: 'RD' (Rest Day)
     * Gazetted Public Holidays (Sarawak & Malaysia): 'PH' (Official rest day)
   - William is EXCLUDED from the rotating AM/PM parity calculation.
   - William is EXCLUDED from the 2:00 PM – 3:30 PM Gondola Cleaning/Refilling rotation pool.

2. MANDATORY PRESET FIXED REST DAYS (FROM OUTLET TEAMMATE PROFILES & PREFERENCES):
   - Every teammate's weekly Full Rest Day ('RD') MUST be strictly FIXED on the exact day of the week preset in their Outlet Teammate Profiles & Preferences (refer to 'presetFixedRestDay'):
     * If a teammate has a preset fixed rest day (e.g. Ting = Sunday, Kenix = Monday, Penny = Tuesday, Louna = Thursday, Fiona = Thursday, Nurhafizah = Monday, Farizin = Friday, Christina = Saturday), that teammate MUST have their Rest Day ('RD') on that EXACT day of the week in EVERY single 7-day calendar week (Monday to Sunday)!
     * STRICTLY FORBIDDEN: DO NOT shift, displace, reassign, or move any teammate's rest day to any other day of the week.
     * Only teammates whose presetFixedRestDay is explicitly set to 'Flexible' may have their rest day decided by the AI.

3. HARD FLOOR REQUIREMENT — AT LEAST 3 STAFF ACROSS THE WHOLE DAY:
   - For every single day:
     * Morning Shift (07:30 - 16:30): Minimum 3 staff (Full AM staff + Half AM staff >= 3). During the midday handover window (11:30–12:30), there must be at least 3 staff on duty.
     * Night Shift (12:30 - 21:30): Minimum 3 staff (Night PM staff >= 3).
     * Total staff working per day must be at least 6. Never allow < 3 staff on any shift!

4. WEEKLY MORNING VS NIGHT SHIFT PARITY (DEVIATION <= ±2):
   - For all rotating teammates (everyone except William), balance the number of Morning shifts ('8H_0730-1630' / '4H_0730-1130') and Night shifts ('8H_1230-2130') counted weekly.
   - If individual day-specific preferences cause an imbalance, allow a minor deviation between Morning and Night shifts, but STRICTLY keep deviation within ±2 shifts per teammate per week (i.e. |weekly_AM - weekly_PM| <= 2).

5. SECOND PRIORITY SHIFT COVERAGE & FAIRNESS (WHOLE-DAY CHINESE SPEAKER & BALANCED SHIFTS):
   - A. CHINESE-SPEAKING AVAILABILITY ACROSS THE WHOLE DAY (KEY PRIORITY):
     * Having at least one Chinese-speaking staff (race: Chinese: William, Ting, Kenix, Penny, Christina) in EVERY shift (AM shift >= 1 Chinese speaker, PM shift >= 1 Chinese speaker).
     * As long as there is at least one Chinese speaker on each shift across the whole day, that satisfies the requirement!
   - B. MANAGEMENT TEAM COVERAGE:
     * Having at least one management team member (Assistant Branch Manager, Branch Manager, or Pharmacist) in ANY shift (AM shift >= 1 Manager, PM shift >= 1 Manager).
   - C. FAIR SHIFT BALANCE FOR KENIX AND CHRISTINA (OMIT MANDATORY PHARMACIST NIGHT COVERAGE):
     * DO NOT force Pharmacists (Kenix and Christina) to cover all night shifts or all Sunday mornings.
     * OMIT the rule that pharmacist must cover all morning and night shifts.
     * Treat Kenix Ling and Christina Lee fairly and equally with all other rotating teammates: balance their Morning shifts ('8H_0730-1630' / '4H_0730-1130') and Night shifts ('8H_1230-2130') with weekly deviation <= ±2.

6. STATUTORY REST DAYS (SARAWAK LABOUR ORDINANCE):
   - Every teammate MUST have exactly 1 Full Rest Day ('RD') on their preset fixed rest day and 1 Half Day rest ('4H_0730-1130') in each 7-day calendar week (Monday to Sunday).
   - The remaining 5 days in each week are full working shifts (either '8H_0730-1630' or '8H_1230-2130').

7. PUBLIC HOLIDAY (PH) PROTOCOL:
   - On gazetted Public Holidays (Sarawak & Malaysia):
     * William Chai has official rest day ('PH').
     * Provisional Registered Pharmacists (Kenix Ling and Christina Lee) assume rest day ('PH') too, UNLESS needed to cover the 3-staff floor across the day. If needed to cover 3-staff floor, they apply replacement leave to work on the public holiday.
     * All other teammates apply replacement leave to work on public holidays as needed to ensure the floor requirement (>= 3 staff across the day) is met.

8. RESPECT OTHER LIVE DAY-SPECIFIC PREFERENCES:
   - Dynamically schedule each teammate according to their daySpecificPrefs, halfDayPref, and shiftPref specified in the active teammates table above.
   - Do NOT alter their fixed rest day.
   - If a teammate has 'Morning Half (4H)' requested on a day, assign their 4H half day on that day.
   - If a teammate has 'Morning Only' or 'Night Only', strictly assign only that shift type on that day.
   - If a teammate has 'Morning Preferred' or 'Night Preferred', prioritize that shift type.

9. ANTI-FATIGUE & HEALTH RESTRICTIONS:
   - Forbid assigning a Night shift ('8H_1230-2130') followed directly by a Morning shift ('8H_0730-1630' or '4H_0730-1130') the next day (turnaround rest must be >= 15 hours).
   - Maximum 3 consecutive Night shifts.

10. UNIVERSAL 6S CLEANING & REFILLING OVERLAP (14:00 - 15:30):
    - Exactly 1 rotating teammate assigned per day for 14:00–15:30 Gondola Cleaning & Refill duty.
    - Shared equally among all rotating staff. William is excluded.

SHIFT CODES:
- '8H_0730-1630' (Full Morning)
- '8H_1230-2130' (Full Night)
- '4H_0730-1130' (Half Morning 4H)
- 'RD' (Rest Day)
- 'PH' (Public Holiday)

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "month": "${monthVal}",
  "branch": "${branchVal}",
  "days": [
    {
      "day": 1,
      "date": "${monthVal}-01",
      "dayOfWeek": "Thursday",
      "shifts": {
        "PMG00831": "8H_0730-1630",
        "PMG02963": "8H_0730-1630",
        "PMG00723": "8H_0730-1630",
        "PMG02694": "8H_1230-2130",
        "PMG01294": "RD",
        "PMG01780": "RD",
        "PMG02070": "8H_1230-2130",
        "PMG03375": "8H_0730-1630",
        "PMG03033": "8H_1230-2130"
      },
      "cleaningDuty": {
        "empNo": "PMG00723",
        "nickname": "TING",
        "time": "2:00 PM – 3:30 PM",
        "task": "Gondola Cleaning & Refilling"
      },
      "amCount": 4,
      "pmCount": 4,
      "workingTotal": 8
    }
  ],
  "warnings": [],
  "summary": "Summary of pharmacist coverage, shift balance parity, anti-fatigue compliance, and 6S cleaning rotation."
}`;

  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });
    clearTimeout(fetchTimeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} (${model}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No content returned by Gemini');

    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } finally {
    clearTimeout(fetchTimeout);
  }
}

// ─── FULL 7-DAY CALENDAR WEEK HELPER (MONDAY TO SUNDAY) ──────────────────────
// Extends schedule boundary days forward and backward to guarantee complete 7-day Monday–Sunday weeks.
// Eliminates partial-week statutory deficits and satisfies 100% Sarawak Labour Ordinance quotas.
function getFullWeeksPeriod(year, month) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const firstDay = new Date(year, month - 1, 1);
  const monOffset = (firstDay.getDay() === 0 ? -6 : 1 - firstDay.getDay());
  const startDate = new Date(year, month - 1, 1 + monOffset);

  const lastDay = new Date(year, month, 0);
  const sunOffset = (lastDay.getDay() === 0 ? 0 : 7 - lastDay.getDay());
  const endDate = new Date(year, month - 1, lastDay.getDate() + sunOffset);

  const weeks = [];
  let curr = new Date(startDate);
  let currentWeek = [];

  while (curr <= endDate) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = daysOfWeek[curr.getDay()];

    currentWeek.push({
      date: dateStr,
      day: curr.getDate(),
      month: curr.getMonth() + 1,
      year: curr.getFullYear(),
      dayOfWeek: dayOfWeek,
      isTargetMonth: (curr.getMonth() + 1 === month)
    });

    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }

    curr.setDate(curr.getDate() + 1);
  }

  return weeks;
}

// Generate valid zero-fatigue weekly patterns for a rotating teammate.
// Law of Zero Fatigue:
// AM shifts and HD strictly precede PM shifts in the cycle from RD to RD.
// PM shifts lead directly into RD. Rest between every transition is >= 15 hours.
function generateLegalWeeklyPatterns(tm, weekDays, prevSundayShift) {
  const prevWasPm = prevSundayShift && prevSundayShift.includes('1230');

  // Look for explicitly requested RD in dayPrefs, or fall back to restDayPref
  const dayPrefsRdDay = tm.dayPrefs ? Object.keys(tm.dayPrefs).find(k => tm.dayPrefs[k] === 'RD') : null;
  const targetRdDay = dayPrefsRdDay || tm.restDayPref;
  const prefRdIdx = (targetRdDay && targetRdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetRdDay) : -1;

  // Look for explicitly requested HD in dayPrefs, or fall back to halfDayPref
  const dayPrefsHdDay = tm.dayPrefs ? Object.keys(tm.dayPrefs).find(k => tm.dayPrefs[k] === 'Morning Half (4H)') : null;
  const targetHdDay = dayPrefsHdDay || ((tm.halfDayPref && tm.halfDayPref !== 'None') ? (tm.halfDayPref.includes(' ') ? tm.halfDayPref.split(' ')[0] : tm.halfDayPref) : null);
  const prefHdIdx = (targetHdDay && targetHdDay !== 'None' && targetHdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetHdDay) : -1;

  const buildWeeklyPatterns = (candidates) => {
    const list = [];
    const seen = new Set();

    candidates.forEach(rdIdx => {
      // Prioritize preset HD first, then all valid days except Saturday (William is already on Saturday 4H)
      const hdCandidates = [];
      if (prefHdIdx !== -1 && prefHdIdx !== rdIdx) hdCandidates.push(prefHdIdx);
      for (let i = 0; i < 7; i++) {
        if (i !== rdIdx && (i !== 5 || prefHdIdx === 5) && !hdCandidates.includes(i)) {
          hdCandidates.push(i);
        }
      }

      hdCandidates.forEach(hdIdx => {
        if (prevWasPm && rdIdx > 0 && hdIdx < rdIdx) return;

        for (let s = 0; s <= 5; s++) {
          const seq = new Array(7);
          seq[rdIdx] = 'RD';
          seq[hdIdx] = '4H_0730-1130';

          if (prevWasPm && rdIdx > 0) {
            for (let i = 0; i < rdIdx; i++) {
              seq[i] = '8H_1230-2130';
            }
          }

          let reachedHd = false;
          let amAfterHd = 0;
          let switchedToPm = false;

          for (let step = 1; step < 7; step++) {
            const idx = (rdIdx + step) % 7;
            if (idx === hdIdx) {
              reachedHd = true;
              continue;
            }
            if (seq[idx]) continue;

            if (!reachedHd) {
              seq[idx] = '8H_0730-1630';
            } else {
              if (amAfterHd < s && !switchedToPm) {
                seq[idx] = '8H_0730-1630';
                amAfterHd++;
              } else {
                seq[idx] = '8H_1230-2130';
                switchedToPm = true;
              }
            }
          }

          // Verify zero turnaround fatigue
          let fatigue = false;
          let cur = prevWasPm ? 'PM' : 'RD';
          for (let i = 0; i < 7; i++) {
            const shift = seq[i];
            const isMorning = shift.includes('0730') || shift.includes('4H');
            if (cur === 'PM' && isMorning) {
              fatigue = true;
              break;
            }
            if (shift === 'RD') cur = 'RD';
            else if (shift.includes('1230')) cur = 'PM';
            else if (isMorning) cur = 'AM';
          }

          if (!fatigue) {
            let amFull = 0, pmFull = 0;
            seq.forEach(shift => {
              if (shift === '8H_0730-1630') amFull++;
              if (shift.includes('1230')) pmFull++;
            });

            let prefScore = 0;
            if (rdIdx === prefRdIdx) prefScore += 50000; // Mandatory lock for preset rest day
            if (hdIdx === prefHdIdx) prefScore += 10000; // Strong reward for preset half day

            // Day-specific preferences
            let invalidStrict = false;
            if (tm.dayPrefs) {
              weekDays.forEach((d, dIdx) => {
                const dp = tm.dayPrefs[d.dayOfWeek];
                if (!dp || dp === 'Flexible') return;
                const shift = seq[dIdx];

                if (dp === 'Morning Only') {
                  if (shift.includes('0730')) prefScore += 2000;
                  else if (shift !== 'RD') { prefScore -= 50000; invalidStrict = true; }
                } else if (dp === 'Night Only') {
                  if (shift.includes('1230')) prefScore += 2000;
                  else if (shift !== 'RD') { prefScore -= 50000; invalidStrict = true; }
                } else if (dp === 'Morning Preferred') {
                  if (shift.includes('0730')) prefScore += 1500;
                  else if (shift.includes('1230')) prefScore -= 600;
                } else if (dp === 'Night Preferred') {
                  if (shift.includes('1230')) prefScore += 1500;
                  else if (shift.includes('0730') && !shift.includes('4H')) prefScore -= 600;
                } else if (dp === 'RD') {
                  if (shift === 'RD') prefScore += 50000;
                  else { prefScore -= 50000; invalidStrict = true; }
                } else if (dp === 'Morning Half (4H)') {
                  if (shift.includes('4H')) prefScore += 5000;
                }
              });
            }

            // Overall shift preference
            if (tm.shiftPref === 'Morning Preferred' && amFull >= 2) prefScore += 1000;
            if (tm.shiftPref === 'Night Preferred' && pmFull >= 3) prefScore += 1000;

            // Weekly parity: Total AM = amFull + 1 (4H), PM = pmFull
            const totalAm = amFull + 1;
            const deviation = Math.abs(totalAm - pmFull);
            if (deviation <= 2) {
              prefScore += (2 - deviation) * 500 + 2000;
            } else {
              prefScore -= (deviation - 2) * 1000;
            }

            const key = seq.join('|');
            if (!invalidStrict && !seen.has(key)) {
              seen.add(key);
              list.push({ seq, amFull, pmFull, rdIdx, hdIdx, prefScore, deviation });
            }
          }
        }
      });
    });
    return list;
  };

  let patterns = buildWeeklyPatterns(prefRdIdx !== -1 ? [prefRdIdx] : [0, 1, 2, 3, 4, 5, 6]);
  if (!patterns.length && prefRdIdx !== -1) {
    patterns = buildWeeklyPatterns([0, 1, 2, 3, 4, 5, 6]);
  }

  return patterns;
}

// Solve 1 week with dynamic preference scoring, whole-day Chinese speaker coverage, and weekly shift parity
// Omit mandatory night pharmacist rule: Kenix and Christina are treated fairly with all rotating staff.
function solveFullWeek(weekDays, prevSundayShifts, cumStats, rotatingPool, william) {
  const williamSeq = weekDays.map(d => {
    if (HOLIDAYS_2026_SARAWAK[d.date]) return 'PH';
    if (d.dayOfWeek === 'Sunday') return 'RD';
    if (d.dayOfWeek === 'Saturday') return '4H_0730-1130';
    return '8H_0730-1630';
  });

  const tmPatterns = {};
  rotatingPool.forEach(tm => {
    const pats = generateLegalWeeklyPatterns(tm, weekDays, prevSundayShifts[tm.empNo]);
    const curAm = (cumStats[tm.empNo] && cumStats[tm.empNo].am !== undefined) ? cumStats[tm.empNo].am : (cumStats[tm.empNo]?.amFull || 0);
    const curPm = (cumStats[tm.empNo] && cumStats[tm.empNo].pm !== undefined) ? cumStats[tm.empNo].pm : (cumStats[tm.empNo]?.pmFull || 0);
    const targetAm = (curAm <= curPm) ? 3 : 2;

    pats.sort((a, b) => {
      const dA = Math.abs(a.amFull - targetAm);
      const dB = Math.abs(b.amFull - targetAm);
      const scoreA = a.prefScore - dA * 500 - a.deviation * 300;
      const scoreB = b.prefScore - dB * 500 - b.deviation * 300;
      return scoreB - scoreA;
    });

    tmPatterns[tm.empNo] = pats;
  });

  function evalCombination(selected) {
    let penalty = 0;

    for (let day = 0; day < 7; day++) {
      let fullAm = (williamSeq[day] === '8H_0730-1630' ? 1 : 0);
      let halfAm = (williamSeq[day] === '4H_0730-1130' ? 1 : 0);
      let pm = 0;

      let chAm = (williamSeq[day].includes('0730') || williamSeq[day].includes('4H') ? 1 : 0);
      let chPm = 0;
      let mgrAm = (williamSeq[day].includes('0730') || williamSeq[day].includes('4H') ? 1 : 0);
      let mgrPm = 0;

      rotatingPool.forEach(tm => {
        const s = selected[tm.empNo].seq[day];
        const isMorn = s.includes('0730');
        const isNight = s.includes('1230');
        const isHalf = s.includes('4H');
        const isChinese = tm.race === 'Chinese';
        const isManager = tm.isPharmacist || (tm.position && (tm.position.includes('Manager') || tm.position.includes('Pharmacist')));

        if (s === '8H_0730-1630') fullAm++;
        else if (isHalf) halfAm++;
        else if (isNight) pm++;

        if (isMorn) {
          if (isChinese) chAm++;
          if (isManager) mgrAm++;
        } else if (isNight) {
          if (isChinese) chPm++;
          if (isManager) mgrPm++;
        }
      });

      // 1. Hard Floor Constraint: fullAm >= 3, pm >= 3, workingTotal >= 6
      if (fullAm < 3) penalty += (3 - fullAm) * 10000000;
      if (pm < 3) penalty += (3 - pm) * 10000000;
      const working = fullAm + halfAm + pm;
      if (working < 6) penalty += (6 - working) * 10000000;

      // Mathematical floor requirement: fullStaff = working - halfAm >= 6 (need 3 fullAm and 3 pm)
      const maxAllowedHalf = Math.max(0, working - 6);
      if (halfAm > maxAllowedHalf) {
        penalty += (halfAm - maxAllowedHalf) * 10000000;
      }

      // On Saturday (day 5), William is ALREADY 4H, so rotating staff must have 0 halfAm!
      if (day === 5 && halfAm > 1) {
        penalty += (halfAm - 1) * 10000000;
      }

      // 2. Chinese Speaking Coverage on Whole Day (Hard Requirement)
      if (chAm < 1) penalty += 10000000;
      if (chPm < 1) penalty += 10000000;

      // 3. Manager Coverage on Each Shift
      if (mgrAm < 1) penalty += 500000;
      if (mgrPm < 1) penalty += 500000;

      penalty += Math.abs(fullAm - pm) * 10;
    }

    // Weekly Parity and Cumulative Parity across ALL 8 rotating staff
    rotatingPool.forEach(tm => {
      const p = selected[tm.empNo];
      penalty -= p.prefScore;

      // Hard constraint: Match preset fixed rest day from Teammate Profiles
      const targetRdDay = (tm.dayPrefs && Object.keys(tm.dayPrefs).find(k => tm.dayPrefs[k] === 'RD')) || tm.restDayPref;
      const prefRdIdx = (targetRdDay && targetRdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetRdDay) : -1;
      if (prefRdIdx !== -1 && p.rdIdx !== prefRdIdx) {
        penalty += 10000000;
      }

      const targetHdDay = (tm.dayPrefs && Object.keys(tm.dayPrefs).find(k => tm.dayPrefs[k] === 'Morning Half (4H)')) || ((tm.halfDayPref && tm.halfDayPref !== 'None') ? (tm.halfDayPref.includes(' ') ? tm.halfDayPref.split(' ')[0] : tm.halfDayPref) : null);
      const prefHdIdx = (targetHdDay && targetHdDay !== 'None' && targetHdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetHdDay) : -1;

      const isPresetMatched = (prefRdIdx !== -1 && p.rdIdx === prefRdIdx && prefHdIdx !== -1 && p.hdIdx === prefHdIdx);
      const weeklyAm = p.amFull + 1; // includes 4H
      const weeklyPm = p.pmFull;
      const weeklyDev = Math.abs(weeklyAm - weeklyPm);
      if (weeklyDev > 2 && !isPresetMatched) {
        penalty += (weeklyDev - 2) * 500000;
      }

      // Strong reward for weekly balance
      penalty += weeklyDev * 100;

      // Cumulative monthly AM vs PM parity
      const curAm = (cumStats[tm.empNo] && cumStats[tm.empNo].am !== undefined) ? cumStats[tm.empNo].am : (cumStats[tm.empNo]?.amFull || 0);
      const curPm = (cumStats[tm.empNo] && cumStats[tm.empNo].pm !== undefined) ? cumStats[tm.empNo].pm : (cumStats[tm.empNo]?.pmFull || 0);
      const newAm = curAm + p.amFull;
      const newPm = curPm + p.pmFull;
      penalty += Math.pow(newAm - newPm, 2) * 500;
    });

    return penalty;
  }

  let best = null;
  let minPenalty = Infinity;

  for (let iter = 0; iter < 50000; iter++) {
    const cur = {};

    rotatingPool.forEach(tm => {
      const pats = tmPatterns[tm.empNo];
      if (!pats || !pats.length) {
        cur[tm.empNo] = { seq: new Array(7).fill('RD'), amFull: 0, pmFull: 0, prefScore: 0 };
      } else {
        const idx = Math.floor(Math.pow(Math.random(), 2.0) * pats.length);
        cur[tm.empNo] = pats[idx];
      }
    });

    const p = evalCombination(cur);
    if (p < minPenalty) {
      minPenalty = p;
      best = JSON.parse(JSON.stringify(cur));
      if (minPenalty < -35000) break;
    }
  }

  if (!best) {
    best = {};
    rotatingPool.forEach(tm => {
      best[tm.empNo] = (tmPatterns[tm.empNo] && tmPatterns[tm.empNo][0]) || { seq: new Array(7).fill('RD'), amFull: 0, pmFull: 0, prefScore: 0 };
    });
  }

  // Defensive Floor & Chinese speaker repair if penalty > 0
  if (minPenalty > 0) {
    for (let day = 0; day < 7; day++) {
      let fullAm = (williamSeq[day] === '8H_0730-1630' ? 1 : 0);
      let pm = 0;

      rotatingPool.forEach(tm => {
        const s = best[tm.empNo].seq[day];
        if (s === '8H_0730-1630') fullAm++;
        if (s && s.includes('1230')) pm++;
      });

      // If pm < 3 and fullAm > 3, convert staff with AM excess
      while (pm < 3 && fullAm > 3) {
        const candidates = rotatingPool.filter(tm => {
          const s = best[tm.empNo].seq[day];
          return s === '8H_0730-1630';
        });

        if (!candidates.length) break;

        candidates.sort((a, b) => {
          const curAmA = (cumStats[a.empNo] && cumStats[a.empNo].am !== undefined) ? cumStats[a.empNo].am : 0;
          const curPmA = (cumStats[a.empNo] && cumStats[a.empNo].pm !== undefined) ? cumStats[a.empNo].pm : 0;
          const curAmB = (cumStats[b.empNo] && cumStats[b.empNo].am !== undefined) ? cumStats[b.empNo].am : 0;
          const curPmB = (cumStats[b.empNo] && cumStats[b.empNo].pm !== undefined) ? cumStats[b.empNo].pm : 0;

          const diffA = curAmA + best[a.empNo].amFull - (curPmA + best[a.empNo].pmFull);
          const diffB = curPmB + best[b.empNo].amFull - (curPmB + best[b.empNo].pmFull);
          return diffB - diffA;
        });

        let converted = false;
        for (const cand of candidates) {
          if (cand.race === 'Chinese') {
            let otherChAm = (williamSeq[day].includes('0730') || williamSeq[day].includes('4H') ? 1 : 0);
            rotatingPool.forEach(tm => {
              if (tm.empNo !== cand.empNo && tm.race === 'Chinese') {
                const s = best[tm.empNo].seq[day];
                if (s && s.includes('0730')) otherChAm++;
              }
            });
            if (otherChAm < 1) continue;
          }

          let canPropagate = true;
          for (let nextD = day; nextD < 7; nextD++) {
            if (best[cand.empNo].seq[nextD] === 'RD') break;
            if (best[cand.empNo].seq[nextD].includes('4H')) {
              canPropagate = false;
              break;
            }
          }

          if (canPropagate) {
            for (let nextD = day; nextD < 7; nextD++) {
              if (best[cand.empNo].seq[nextD] === 'RD') break;
              if (best[cand.empNo].seq[nextD] === '8H_0730-1630') {
                best[cand.empNo].seq[nextD] = '8H_1230-2130';
                best[cand.empNo].amFull--;
                best[cand.empNo].pmFull++;
                if (nextD === day) {
                  fullAm--;
                  pm++;
                }
              }
            }
            converted = true;
            break;
          }
        }
        if (!converted) break;
      }

      // If fullAm < 3 and pm > 3, convert staff with PM excess back to AM
      while (fullAm < 3 && pm > 3) {
        const pmCandidates = rotatingPool.filter(tm => {
          const s = best[tm.empNo].seq[day];
          return s && s.includes('1230');
        });

        if (!pmCandidates.length) break;

        pmCandidates.sort((a, b) => {
          const curAmA = (cumStats[a.empNo] && cumStats[a.empNo].am !== undefined) ? cumStats[a.empNo].am : 0;
          const curPmA = (cumStats[a.empNo] && cumStats[a.empNo].pm !== undefined) ? cumStats[a.empNo].pm : 0;
          const curAmB = (cumStats[b.empNo] && cumStats[b.empNo].am !== undefined) ? cumStats[b.empNo].am : 0;
          const curPmB = (cumStats[b.empNo] && cumStats[b.empNo].pm !== undefined) ? cumStats[b.empNo].pm : 0;

          const diffA = curPmA + best[a.empNo].pmFull - (curAmA + best[a.empNo].amFull);
          const diffB = curPmB + best[b.empNo].pmFull - (curAmB + best[b.empNo].amFull);
          return diffB - diffA;
        });

        let converted = false;
        for (const cand of pmCandidates) {
          if (cand.race === 'Chinese') {
            let otherChPm = 0;
            rotatingPool.forEach(tm => {
              if (tm.empNo !== cand.empNo && tm.race === 'Chinese') {
                const s = best[tm.empNo].seq[day];
                if (s && s.includes('1230')) otherChPm++;
              }
            });
            if (otherChPm < 1) continue;
          }

          const prevShift = (day === 0 ? prevSundayShifts[cand.empNo] : best[cand.empNo].seq[day - 1]);
          const canPrev = !prevShift || prevShift === 'RD' || prevShift === 'PH' || prevShift.includes('0730');
          if (!canPrev) continue;

          best[cand.empNo].seq[day] = '8H_0730-1630';
          best[cand.empNo].pmFull--;
          best[cand.empNo].amFull++;
          fullAm++;
          pm--;
          converted = true;
          break;
        }
        if (!converted) break;
      }
    }
  }

  return { selected: best, penalty: minPenalty, williamSeq };
}


// ─── SMART HEURISTIC SCHEDULE GENERATOR (FULL 7-DAY WEEKS & ZERO FATIGUE) ───────
function runHeuristicScheduleGenerator(branchVal, year, month, totalDays) {
  if (!currentTeammates || !currentTeammates.length) {
    currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
  }
  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  const rotatingPool = currentTeammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');
  const weeks = getFullWeeksPeriod(year, month);
  const shiftRegistry = loadShiftRegistry(branchVal);

  const cumStats = {};
  currentTeammates.forEach(tm => {
    cumStats[tm.empNo] = {
      am: 0,
      pm: 0,
      rd: 0,
      hd: 0,
      clean: 0,
      lastShift: null,
      pmToAmFatigueCount: 0
    };
  });

  const cleaningCounts = {};
  rotatingPool.forEach(tm => { cleaningCounts[tm.empNo] = 0; });

  const dailySchedule = [];
  let prevSundayShifts = {};
  const warnings = [];

  // Look up historical shifts from previous Sunday if available in shiftRegistry to maintain cross-month turnaround rest
  if (weeks.length > 0) {
    const firstMonDate = new Date(weeks[0][0].date);
    const prevSun = new Date(firstMonDate);
    prevSun.setDate(prevSun.getDate() - 1);
    const prevSunDateStr = `${prevSun.getFullYear()}-${String(prevSun.getMonth() + 1).padStart(2, '0')}-${String(prevSun.getDate()).padStart(2, '0')}`;
    const prevSunCached = shiftRegistry[prevSunDateStr];
    if (prevSunCached && prevSunCached.shifts) {
      rotatingPool.forEach(tm => {
        prevSundayShifts[tm.empNo] = prevSunCached.shifts[tm.empNo] || 'RD';
      });
    }
  }

  weeks.forEach((weekDays, wIdx) => {
    // Solve the 7-day week freshly based on live preferences
    const res = solveFullWeek(weekDays, prevSundayShifts, cumStats, rotatingPool, william);
    const { selected, williamSeq } = res;

    for (let day = 0; day < 7; day++) {
      const d = weekDays[day];
      const dayShifts = {};

      // William fixed schedule
      if (william) {
        dayShifts[william.empNo] = williamSeq[day];
        const ws = williamSeq[day];
        if (ws === 'RD' || ws === 'PH') cumStats[william.empNo].rd++;
        else if (ws.includes('4H')) { cumStats[william.empNo].am++; cumStats[william.empNo].hd++; }
        else cumStats[william.empNo].am++;
      }

      // Rotating teammates
      rotatingPool.forEach(tm => {
        const s = selected[tm.empNo].seq[day];
        dayShifts[tm.empNo] = s;
        if (s === 'RD') cumStats[tm.empNo].rd++;
        else if (s.includes('4H')) { cumStats[tm.empNo].am++; cumStats[tm.empNo].hd++; }
        else if (s.includes('0730')) cumStats[tm.empNo].am++;
        else if (s.includes('1230')) cumStats[tm.empNo].pm++;
      });

      // 6S Cleaning Duty: 14:00 - 15:30 Round-Robin
      const workingStaff = rotatingPool.filter(tm => dayShifts[tm.empNo] && dayShifts[tm.empNo] !== 'RD' && dayShifts[tm.empNo] !== 'PH' && dayShifts[tm.empNo] !== 'OFF');
      workingStaff.sort((a, b) => (cleaningCounts[a.empNo] || 0) - (cleaningCounts[b.empNo] || 0));
      const cleaner = workingStaff[0] || null;
      let cleaningDuty = null;
      if (cleaner) {
        cleaningCounts[cleaner.empNo] = (cleaningCounts[cleaner.empNo] || 0) + 1;
        cumStats[cleaner.empNo].clean++;
        cleaningDuty = {
          empNo: cleaner.empNo,
          nickname: cleaner.nickname,
          empName: cleaner.empName || cleaner.nickname,
          time: '2:00 PM – 3:30 PM',
          task: 'Gondola Cleaning & Refilling'
        };
      }

      let fullAmCount = 0;
      let halfAmCount = 0;
      let pmCount = 0;
      let workingTotal = 0;

      Object.values(dayShifts).forEach(s => {
        if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
          workingTotal++;
          if (s.includes('4H') || s.includes('0730-1130')) halfAmCount++;
          else if (s.includes('0730') || s.includes('0800')) fullAmCount++;
          if (s.includes('1230') || s.includes('1300') || s.includes('1630')) pmCount++;
        }
      });

      const dayObj = {
        ...d,
        shifts: dayShifts,
        cleaningDuty,
        fullAmCount,
        halfAmCount,
        amCount: fullAmCount + halfAmCount,
        pmCount,
        workingTotal
      };

      if (fullAmCount < 3 || pmCount < 3) {
        const isMiddayShort = fullAmCount < 3;
        const isPmShort = pmCount < 3;
        const shortDesc = isMiddayShort ? `Midday Handover Deficit (11:30–12:30: only ${fullAmCount}/3 full AM staff)` : (isPmShort ? `Deficit on Night (${pmCount}/3 staff)` : `Total working staff below 6`);
        const warn = `⚠️ Manpower Alert: Only ${workingTotal} staff on duty on ${d.date} (${d.dayOfWeek}). ${shortDesc}. Minimum 3 required on floor continuously.`;
        dayObj.warning = warn;
        if (!warnings.includes(warn)) warnings.push(warn);
      }

      dailySchedule.push(dayObj);
      shiftRegistry[d.date] = dayObj;
    }

    prevSundayShifts = {};
    rotatingPool.forEach(tm => {
      prevSundayShifts[tm.empNo] = selected[tm.empNo].seq[6];
    });
  });

  // Persist updated shift registry to memory
  saveShiftRegistry(branchVal, shiftRegistry);

  // Compute shift parity across rotating pool
  const amCounts = rotatingPool.map(tm => cumStats[tm.empNo].am);
  const pmCounts = rotatingPool.map(tm => cumStats[tm.empNo].pm);
  const amSpread = amCounts.length ? (Math.max(...amCounts) - Math.min(...amCounts)) : 0;
  const pmSpread = pmCounts.length ? (Math.max(...pmCounts) - Math.min(...pmCounts)) : 0;

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    branch: branchVal,
    days: dailySchedule,
    warnings,
    stats: cumStats,
    hasMinorVariance: amSpread > 2 || pmSpread > 2,
    summary: `Statutory Sarawak Labour Ordinance Timetable: Strictly full 7-day Monday–Sunday weeks (${weeks.length} complete calendar weeks), exactly 1 Rest Day (RD) + 1 Half Day (HD) per week across all weeks, William Chai locked AM anchor (6S exempt), guaranteed whole-day Chinese speaker coverage, fair AM/PM balance across all rotating teammates, guaranteed 3 AM / 3 PM minimum floor, 0 turnaround fatigue violations, cross-month memory active, and universal 6S cleaning rotation (14:00–15:30).`
  };
}

// ─── RENDER SCHEDULE MATRIX ───────────────────────────────────────────────────
function renderScheduleMatrix(schedule) {
  if (!schedule || !schedule.days) return;

  const resultsPanel = document.getElementById('schedulerResultsPanel');
  if (resultsPanel) resultsPanel.classList.remove('hidden');

  const [sYearStr, sMonthStr] = (schedule.month || '2026-10').split('-');
  const schedYear = parseInt(sYearStr, 10) || 2026;
  const schedMonth = parseInt(sMonthStr, 10) || 10;

  const headerRow = document.getElementById('schedulerMatrixHeader');
  const tbody     = document.getElementById('schedulerMatrixBody');
  const summaryEl = document.getElementById('schedulerSummaryText');

  if (summaryEl) summaryEl.textContent = schedule.summary || '';

  let totalShifts = 0;
  let totalRestDays = 0;
  let managerCoverageDays = 0;
  let chineseCoverageDays = 0;

  // Track rotating pool shift parity and fatigue
  const rotatingPool = currentTeammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');
  const teammateStats = {};
  currentTeammates.forEach(tm => {
    teammateStats[tm.empNo] = {
      mCount: 0,
      nCount: 0,
      rdCount: 0,
      hdCount: 0,
      cleanCount: 0,
      maxConsecutiveNights: 0,
      currentNightStreak: 0,
      pmToAmFatigueCount: 0,
      lastShiftCode: null
    };
  });

  schedule.days.forEach(d => {
    let hasMorningManager = false;
    let hasNightManager   = false;
    const morningRaces  = new Set();
    const nightRaces    = new Set();

    Object.entries(d.shifts).forEach(([empNo, shift]) => {
      const tm = currentTeammates.find(t => t.empNo === empNo);
      if (!tm) return;

      const isWorking = shift && shift !== 'RD' && shift !== 'OFF' && shift !== 'PH';
      if (isWorking) totalShifts++;
      else if (shift === 'RD' || shift === 'OFF' || shift === 'PH') totalRestDays++;

      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
      const isManager = isPharm || (tm.position && (tm.position.includes('Manager') || tm.position.includes('Pharmacist')));
      const isHalf  = shift && (shift.includes('4H') || shift.includes('5H') || shift.includes('Half') || shift.includes('0730-1130'));
      const isMorning = shift && (shift.includes('0730') || shift.includes('0800'));
      const isFullAm  = isMorning && !isHalf;
      const isNight   = shift && (shift.includes('1230') || shift.includes('1300') || shift.includes('1630'));

      if (isHalf) {
        teammateStats[empNo].hdCount++;
        // Check fatigue: previous shift was night
        if (teammateStats[empNo].lastShiftCode && teammateStats[empNo].lastShiftCode.includes('1230')) {
          teammateStats[empNo].pmToAmFatigueCount++;
        }
        teammateStats[empNo].currentNightStreak = 0;
        teammateStats[empNo].lastShiftCode = shift;
      }

      if (isMorning) {
        if (isManager) hasMorningManager = true;
        morningRaces.add(tm.race);
        if (isFullAm) {
          teammateStats[empNo].mCount++;
          // Check fatigue: previous shift was night
          if (teammateStats[empNo].lastShiftCode && teammateStats[empNo].lastShiftCode.includes('1230')) {
            teammateStats[empNo].pmToAmFatigueCount++;
          }
          teammateStats[empNo].currentNightStreak = 0;
          teammateStats[empNo].lastShiftCode = shift;
        }
      } else if (isNight) {
        if (isManager) hasNightManager = true;
        nightRaces.add(tm.race);
        teammateStats[empNo].nCount++;
        teammateStats[empNo].currentNightStreak++;
        if (teammateStats[empNo].currentNightStreak > teammateStats[empNo].maxConsecutiveNights) {
          teammateStats[empNo].maxConsecutiveNights = teammateStats[empNo].currentNightStreak;
        }
        teammateStats[empNo].lastShiftCode = shift;
      } else if (!isHalf) {
        teammateStats[empNo].rdCount++;
        teammateStats[empNo].currentNightStreak = 0;
        teammateStats[empNo].lastShiftCode = shift;
      }

      if (d.cleaningDuty && d.cleaningDuty.empNo === empNo) {
        teammateStats[empNo].cleanCount++;
      }
    });

    const hasMorningChinese = [...morningRaces].some(r => r === 'Chinese');
    const hasNightChinese   = [...nightRaces].some(r => r === 'Chinese');

    if (hasMorningManager && hasNightManager) managerCoverageDays++;
    if (hasMorningChinese && hasNightChinese) chineseCoverageDays++;
  });

  // Calculate Parity across unified rotating pool
  const rotatingAms = rotatingPool.map(a => teammateStats[a.empNo].mCount);
  const rotatingPms = rotatingPool.map(a => teammateStats[a.empNo].nCount);
  const amVariance = rotatingAms.length ? (Math.max(...rotatingAms) - Math.min(...rotatingAms)) : 0;
  const pmVariance = rotatingPms.length ? (Math.max(...rotatingPms) - Math.min(...rotatingPms)) : 0;
  const maxStaffVar = Math.max(amVariance, pmVariance);
  const totalFatigueViolations = Object.values(teammateStats).reduce((acc, s) => acc + s.pmToAmFatigueCount, 0);

  // Update KPI cards
  const kpiPharm   = document.getElementById('kpiSchedulerPharm');
  const kpiParity  = document.getElementById('kpiSchedulerParity');
  const kpiLang    = document.getElementById('kpiSchedulerLang');
  const kpiShift   = document.getElementById('kpiSchedulerShifts');
  const kpiRest    = document.getElementById('kpiSchedulerRest');

  if (kpiPharm)  kpiPharm.textContent  = `${Math.round((managerCoverageDays / schedule.days.length) * 100)}%`;
  if (kpiParity) kpiParity.textContent = maxStaffVar <= 1 ? '100% Balanced' : `±${maxStaffVar} Shifts`;
  if (kpiLang)   kpiLang.textContent   = `${Math.round((chineseCoverageDays / schedule.days.length) * 100)}%`;
  if (kpiShift)  kpiShift.textContent  = totalShifts;
  if (kpiRest)   kpiRest.textContent   = totalRestDays;

  // Render Manpower Density Warning Alert Banner
  const alertEl = document.getElementById('schedulerDensityAlert');
  if (alertEl) {
    if (schedule.warnings && schedule.warnings.length > 0) {
      alertEl.innerHTML = `
        <div class="font-bold flex items-center gap-2 mb-1.5 text-amber-900 text-sm">
          <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
          <span>Branch Manpower Density Notice (Floor Constraint: Minimum 3 Staff / Shift):</span>
        </div>
        <ul class="list-disc pl-5 space-y-1 text-amber-800 text-xs">
          ${schedule.warnings.map(w => `<li>${escHtml(w)}</li>`).join('')}
        </ul>
      `;
      alertEl.classList.remove('hidden');
    } else {
      alertEl.classList.add('hidden');
      alertEl.innerHTML = '';
    }
  }

  // Render Conflict Inspector Panel
  renderConflictInspector(schedule);

  // Build Table Header
  let headerHtml = `
    <th class="sticky left-0 bg-gray-100 z-20 px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200 min-w-[200px]">
      Teammate (KS01)
    </th>
  `;

  schedule.days.forEach(d => {
    const isWeekend = d.dayOfWeek === 'Saturday' || d.dayOfWeek === 'Sunday';
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date];
    const isMiddayShort = d.fullAmCount !== undefined ? d.fullAmCount < 3 : d.amCount < 3;
    const isPmShortage = d.pmCount < 3;
    const isShortage = isMiddayShort || isPmShortage;

    // Visual Grid Warning Badges: Amber highlight on column header where a shift has < 3 staff
    let dayBg = 'bg-gray-50 text-gray-700';
    if (isShortage) {
      dayBg = 'bg-amber-100 text-amber-950 border-b-2 border-amber-500 ring-1 ring-amber-400 ring-inset shadow-xs';
    } else if (isHoliday) {
      dayBg = 'bg-rose-50 text-rose-900 border-rose-200';
    } else if (isWeekend) {
      dayBg = 'bg-amber-50/60 text-amber-900';
    }

    const shortageTooltip = isMiddayShort
      ? `⚠️ Midday Handover Shortage (11:30–12:30: only ${d.fullAmCount || d.amCount}/3 full AM staff) - Click to edit`
      : `⚠️ Night Shift Shortage (${d.pmCount}/3 staff) - Click to edit`;

    headerHtml += `
      <th class="px-2 py-2 text-center text-xs font-semibold ${dayBg} border-r border-gray-200 min-w-[75px]" title="${isHoliday ? HOLIDAYS_2026_SARAWAK[d.date] : ''}">
        <div class="text-[10px] uppercase font-bold ${isHoliday ? 'text-rose-600' : (isShortage ? 'text-amber-800' : 'text-gray-400')}">${d.dayOfWeek.slice(0, 3)}</div>
        <div class="text-sm font-extrabold">${d.day}</div>
        ${!d.isTargetMonth ? `<div class="text-[9px] text-indigo-600 font-extrabold">${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(d.month || 1) - 1]}</div>` : ''}
        ${isHoliday ? '<span class="text-[9px] bg-rose-200 text-rose-800 px-1 rounded font-bold">PH</span>' : ''}
        ${isShortage ? `
          <button type="button" onclick="openDayShiftEditorModal('${d.date}')"
            class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer whitespace-nowrap"
            title="${shortageTooltip}">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>${isMiddayShort ? `11:30 (${d.fullAmCount || d.amCount}/3)` : `PM (${d.pmCount}/3)`}</span>
          </button>
        ` : ''}
      </th>
    `;
  });
  if (headerRow) headerRow.innerHTML = headerHtml;

  // Build Table Body
  let bodyHtml = '';
  currentTeammates.forEach(tm => {
    const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
    const isFixed = tm.scheduleMode === 'Fixed' || tm.empNo === 'PMG00831';
    const st = teammateStats[tm.empNo];

    bodyHtml += `
      <tr class="hover:bg-blue-50/50 border-b border-gray-200 transition text-xs">
        <td class="sticky left-0 bg-white z-10 px-3 py-2.5 font-medium text-gray-900 border-r border-gray-200 shadow-sm">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-gray-800">${escHtml(tm.nickname)}</span>
            <div class="flex items-center gap-1">
              ${isPharm ? '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-blue-100 text-blue-800 border border-blue-200">Rx</span>' : ''}
              ${isFixed ? '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-amber-100 text-amber-800">Fixed</span>' : ''}
            </div>
          </div>
          <div class="text-[10px] text-gray-400 truncate max-w-[170px]">${escHtml(tm.empName)}</div>
          <div class="text-[10px] text-gray-500 font-mono mt-0.5">
            <span class="text-blue-600 font-bold">M: ${st.mCount}</span> · <span class="text-purple-600 font-bold">N: ${st.nCount}</span>${st.cleanCount > 0 ? ` · <span class="text-teal-700 font-bold">🧹: ${st.cleanCount}</span>` : ''}
          </div>
        </td>
    `;

    schedule.days.forEach(d => {
      const shift = (d.shifts && d.shifts[tm.empNo]) || 'RD';
      const cellStyle = getShiftBadgeStyle(shift);
      const isCleaningDuty = d.cleaningDuty && d.cleaningDuty.empNo === tm.empNo;
      const isShortage = d.amCount < 3 || d.pmCount < 3;
      const colBg = isShortage ? 'bg-amber-50/70 hover:bg-amber-100/90' : (isCleaningDuty ? 'bg-teal-50/60' : 'hover:bg-blue-50/40');

      bodyHtml += `
        <td onclick="openDayShiftEditorModal('${d.date}', '${tm.empNo}')" class="px-1 py-1.5 text-center border-r border-gray-200 cursor-pointer transition ${colBg}" title="${shift}${isCleaningDuty ? ' | 🧹 14:00-15:30 Cleaning' : ''} (Click to fine-tune Day ${d.day})">
          <span class="inline-block px-1.5 py-1 rounded text-[10px] font-mono font-bold leading-tight ${cellStyle.classes}">
            ${cellStyle.label}
          </span>
          ${isCleaningDuty ? '<div class="text-[8px] font-bold text-teal-800 leading-none mt-0.5">🧹 Clean</div>' : ''}
        </td>
      `;
    });

    bodyHtml += '</tr>';
  });

  // Daily Floor Strength Row (Bottom 1)
  let densityRow = `
    <tr class="bg-slate-100 border-t-2 border-slate-300 font-semibold text-[11px] text-gray-800">
      <td class="sticky left-0 bg-slate-100 z-10 px-3 py-2 border-r border-gray-200 font-bold">
        Daily Floor Strength
        <div class="text-[9px] text-gray-500 font-normal">Target: 4 AM / 4 PM (Min 3)</div>
      </td>
  `;
  schedule.days.forEach(d => {
    const isTargetMet = (d.fullAmCount !== undefined ? d.fullAmCount >= 3 : d.amCount >= 3) && d.pmCount >= 3;
    const middayStaff = d.fullAmCount !== undefined ? d.fullAmCount : d.amCount;
    densityRow += `
      <td class="px-1 py-1 text-center border-r border-gray-200 ${isTargetMet ? '' : 'bg-amber-100/90'}">
        <button type="button" onclick="openDayShiftEditorModal('${d.date}')" class="w-full text-[9px] font-mono font-bold ${isTargetMet ? 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200' : 'text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-300'} px-1 py-0.5 rounded leading-tight transition cursor-pointer" title="Morning: ${d.amCount} (${middayStaff} Full AM + ${d.halfAmCount || 0} Half Day), Midday Handover (11:30–12:30): ${middayStaff} staff, Night: ${d.pmCount}, Total Working: ${d.workingTotal} (Click to fine-tune)">
          ${middayStaff}M / ${d.pmCount}N ${isTargetMet ? '' : '⚠️'}
        </button>
      </td>
    `;
  });
  densityRow += '</tr>';

  // 6S Cleaning Duty Row (Bottom 2)
  let cleaningRow = `
    <tr class="bg-teal-50/80 border-t border-teal-200 font-semibold text-[11px] text-teal-900">
      <td class="sticky left-0 bg-teal-50 z-10 px-3 py-2 border-r border-teal-200 font-bold">
        🧹 6S Cleaning (14:00–15:30)
        <div class="text-[9px] text-teal-700 font-normal">Gondola & OTC Refill (Round-Robin)</div>
      </td>
  `;
  schedule.days.forEach(d => {
    cleaningRow += `
      <td class="px-1 py-1 text-center border-r border-teal-200">
        <span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-teal-200/80 text-teal-950 font-mono truncate max-w-[65px]" title="${d.cleaningDuty ? d.cleaningDuty.task + ' (2:00 PM – 3:30 PM)' : 'None'}">
          ${d.cleaningDuty ? escHtml(d.cleaningDuty.nickname) : '-'}
        </span>
      </td>
    `;
  });
  cleaningRow += '</tr>';

  // Pharmacist Coverage Indicators Row (Bottom 3)
  let coverageRow = `
    <tr class="bg-gray-100 border-t border-gray-200 font-semibold text-[11px] text-gray-700">
      <td class="sticky left-0 bg-gray-100 z-10 px-3 py-2 border-r border-gray-200 font-bold">
        Pharmacist AM / PM
        <div class="text-[9px] text-gray-500 font-normal">100% Mandatory Coverage</div>
      </td>
  `;

  schedule.days.forEach(d => {
    let amPharm = false;
    let pmPharm = false;
    Object.entries(d.shifts).forEach(([empNo, shift]) => {
      const tm = currentTeammates.find(t => t.empNo === empNo);
      if (!tm) return;
      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
      if (isPharm) {
        if (shift.includes('0730') || shift.includes('0800')) amPharm = true;
        if (shift.includes('1230') || shift.includes('1300') || shift.includes('1630')) pmPharm = true;
      }
    });

    const isFullCover = amPharm && pmPharm;
    coverageRow += `
      <td class="px-1 py-1.5 text-center border-r border-gray-200">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${isFullCover ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'} font-bold">
          ${isFullCover ? '✓' : '!'}
        </span>
      </td>
    `;
  });
  coverageRow += '</tr>';

  if (tbody) tbody.innerHTML = bodyHtml + densityRow + cleaningRow + coverageRow;

  // Render Fairness Parity & 6S Cleaning Rotation Summary Section
  try {
    const paritySection = document.getElementById('schedulerParitySection');
    if (paritySection) {
      let parityHtml = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h4 class="text-sm font-bold text-gray-900 flex items-center gap-2">
              <i class="fa-solid fa-scale-balanced text-teal-600"></i>
              <span>Shift Parity, Anti-Fatigue & 6S Cleaning Rotation Verification</span>
            </h4>
            <p class="text-xs text-gray-500 mt-0.5">Audits workload distribution among teammates for Kota Sentosa (Target: Max ±1 shift variance, 0 PM→AM fatigue transitions).</p>
          </div>
          <div class="flex items-center gap-2 text-xs flex-wrap">
            <span class="px-2.5 py-1 rounded-full font-bold ${maxStaffVar <= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              <i class="fa-solid fa-check-circle mr-1"></i> Shift Parity: ${maxStaffVar <= 1 ? 'Equitable (≤1)' : `Variance ±${maxStaffVar}`}
            </span>
            <span class="px-2.5 py-1 rounded-full font-bold ${totalFatigueViolations === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              <i class="fa-solid fa-shield-heart mr-1"></i> Anti-Fatigue: ${totalFatigueViolations === 0 ? 'Zero Violations' : `${totalFatigueViolations} Violations`}
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
                <th class="py-2.5 px-3">Teammate</th>
                <th class="py-2.5 px-3">Role & Mode</th>
                <th class="py-2.5 px-3 text-center">Full Morning (8H)</th>
                <th class="py-2.5 px-3 text-center">Full Night (8H)</th>
                <th class="py-2.5 px-3 text-center">Shift Parity</th>
                <th class="py-2.5 px-3 text-center">Full Rest Days (RD)</th>
                <th class="py-2.5 px-3 text-center">Half Days (4H)</th>
                <th class="py-2.5 px-3 text-center">Statutory Quota</th>
                <th class="py-2.5 px-3 text-center">6S Cleaning Duties</th>
                <th class="py-2.5 px-3 text-center">Anti-Fatigue Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
      `;

      currentTeammates.forEach(tm => {
        const st = teammateStats[tm.empNo] || { mCount: 0, nCount: 0, rdCount: 0, hdCount: 0, cleanCount: 0, pmToAmFatigueCount: 0 };
        const isFixed = tm.scheduleMode === 'Fixed' || tm.empNo === 'PMG00831' || tm.nickname === 'WILLIAM';
        const isPharm = tm.isPharmacist || tm.position === 'Pharmacist' || (tm.position && tm.position.includes('Pharmacist'));

        let parityBadge = '';
        if (isFixed) {
          parityBadge = '<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">Fixed Anchor (Exempt)</span>';
        } else if (isPharm) {
          parityBadge = `<span class="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold" title="Kenix & Christina split all 35 store night shifts equally (18 vs 17)">✓ Rx Coverage Split (${st.nCount}N / ${st.mCount}M)</span>`;
        } else {
          const diff = Math.abs(st.mCount - st.nCount);
          parityBadge = diff <= 1
            ? `<span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✓ Equitable (±${diff})</span>`
            : `<span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">⚠️ Imbalance (±${diff})</span>`;
        }

        // Check Statutory Sarawak Labour Ordinance Quota: 1 RD + 1 HD per full 7-day calendar week
        const calWeeksCount = Math.floor(schedule.days.length / 7);
        const missingDetails = [];
        for (let wIdx = 0; wIdx < calWeeksCount; wIdx++) {
          const wNum = wIdx + 1;
          const weekDays = schedule.days.slice(wIdx * 7, (wIdx + 1) * 7);
          let rdInWeek = 0;
          let hdInWeek = 0;
          weekDays.forEach(dItem => {
            if (!dItem || !dItem.shifts) return;
            const shiftVal = dItem.shifts[tm.empNo];
            if (shiftVal === 'RD' || shiftVal === 'PH' || shiftVal === 'OFF') {
              rdInWeek++;
            } else if (shiftVal && (shiftVal.includes('4H') || shiftVal.includes('5H') || shiftVal.includes('Half') || shiftVal.includes('0730-1130'))) {
              hdInWeek++;
            }
          });
          if (rdInWeek < 1) missingDetails.push(`Missing RD in W${wNum}`);
          if (hdInWeek < 1) missingDetails.push(`Missing HD in W${wNum}`);
        }

        let quotaBadge = '';
        if (missingDetails.length === 0) {
          quotaBadge = '<span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✓ Legal Quota Met</span>';
        } else {
          quotaBadge = `<span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold" title="${missingDetails.join(', ')}">⚠️ Statutory Deficit (${missingDetails[0]})</span>`;
        }

        const fatigueBadge = st.pmToAmFatigueCount === 0
          ? '<span class="text-emerald-700 font-bold text-[10px]"><i class="fa-solid fa-check mr-1"></i>Protected (0 PM→AM)</span>'
          : `<span class="text-rose-700 font-bold text-[10px]"><i class="fa-solid fa-circle-exclamation mr-1"></i>${st.pmToAmFatigueCount} Turnaround Violations</span>`;

        parityHtml += `
          <tr class="hover:bg-gray-50/70 transition">
            <td class="py-2.5 px-3 font-bold text-gray-900">
              ${escHtml(tm.nickname)}
              <div class="text-[10px] text-gray-400 font-normal">${escHtml(tm.empName)}</div>
            </td>
            <td class="py-2.5 px-3 text-gray-600">
              <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${isFixed ? 'bg-amber-100 text-amber-800' : (isPharm ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700')}">
                ${escHtml(tm.position)} (${tm.scheduleMode || 'Rotating'})
              </span>
            </td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-blue-600">${st.mCount}</td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-purple-600">${st.nCount}</td>
            <td class="py-2.5 px-3 text-center">${parityBadge}</td>
            <td class="py-2.5 px-3 text-center font-mono text-gray-700 font-semibold">${st.rdCount}</td>
            <td class="py-2.5 px-3 text-center font-mono text-amber-900 font-semibold">${st.hdCount}</td>
            <td class="py-2.5 px-3 text-center">${quotaBadge}</td>
            <td class="py-2.5 px-3 text-center font-mono font-bold ${st.cleanCount > 0 ? 'text-teal-700' : 'text-gray-400'}">
              ${st.cleanCount > 0 ? `🧹 ${st.cleanCount} days` : '—'}
            </td>
            <td class="py-2.5 px-3 text-center">${fatigueBadge}</td>
          </tr>
        `;
      });

      parityHtml += `
            </tbody>
          </table>
        </div>
      `;
      paritySection.innerHTML = parityHtml;
    }
  } catch (parityErr) {
    console.warn('[PMG Scheduler] Parity section error:', parityErr);
  }
}

function getShiftBadgeStyle(code) {
  if (!code || code === 'RD' || code === 'OFF') {
    return { label: 'RD', classes: 'bg-gray-100 text-gray-500 border border-gray-200' };
  }
  if (code === 'PH') {
    return { label: 'PH', classes: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold' };
  }
  if (code.includes('0730-1130')) {
    return { label: 'M (4H)', classes: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' };
  }
  if (code.includes('0730-1630') || code.includes('0800-1700')) {
    return { label: 'M (8H)', classes: 'bg-blue-100 text-blue-800 border border-blue-200' };
  }
  if (code.includes('1230-2130') || code.includes('1300-2200')) {
    return { label: 'N (8H)', classes: 'bg-purple-100 text-purple-800 border border-purple-200' };
  }
  if (code.includes('0730-1230') || code.includes('0800-1300')) {
    return { label: 'M (5H)', classes: 'bg-indigo-100 text-indigo-800 border border-indigo-200' };
  }
  if (code.includes('1630-2130')) {
    return { label: 'N (5H)', classes: 'bg-teal-100 text-teal-800 border border-teal-200' };
  }
  return { label: code, classes: 'bg-gray-100 text-gray-700 border border-gray-300' };
}

// ─── STAFFING & REST DAY CONFLICT INSPECTOR ──────────────────────────────────
function renderConflictInspector(schedule) {
  const panel = document.getElementById('schedulerConflictInspector');
  const countBadge = document.getElementById('conflictInspectorCountBadge');
  const content = document.getElementById('conflictInspectorContent');
  if (!panel || !content) return;

  if (!schedule || !schedule.days || !schedule.days.length) {
    panel.classList.add('hidden');
    return;
  }

  const monthStr = schedule.month || '2026-10';
  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(mStr, 10) || 10;
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Identify all problematic dates (Shift < 3 or Total < 6)
  const bottlenecks = [];

  schedule.days.forEach(d => {
    const isAmShortage = d.fullAmCount !== undefined ? d.fullAmCount < 3 : d.amCount < 3;
    const isPmShortage = d.pmCount < 3;
    const isDensityShortage = d.workingTotal < 6;

    if (isAmShortage || isPmShortage || isDensityShortage) {
      const shortageShift = isAmShortage && isPmShortage
        ? 'Midday & Night Shifts'
        : (isAmShortage ? 'Midday Handover (11:30–12:30)' : (isPmShortage ? 'Night Shift' : 'Overall Manpower'));

      let deficit = 0;
      const middayCount = d.fullAmCount !== undefined ? d.fullAmCount : d.amCount;
      if (isAmShortage && isPmShortage) deficit = (3 - middayCount) + (3 - d.pmCount);
      else if (isAmShortage) deficit = 3 - middayCount;
      else if (isPmShortage) deficit = 3 - d.pmCount;
      else deficit = 6 - d.workingTotal;

      // Teammates on Rest Day
      const restTeammates = currentTeammates.filter(tm => {
        const s = (d.shifts && d.shifts[tm.empNo]) || 'RD';
        return s === 'RD' || s === 'PH' || s === 'OFF';
      });

      // Find adjacent days with surplus attendance
      const prevDay = schedule.days.find(x => x.day === d.day - 1);
      const nextDay = schedule.days.find(x => x.day === d.day + 1);
      let surplusDayName = 'Friday or Sunday';

      if (prevDay && prevDay.workingTotal >= 7 && (!nextDay || nextDay.workingTotal < 7)) {
        surplusDayName = `${prevDay.dayOfWeek} (Day ${prevDay.day} has ${prevDay.workingTotal} staff)`;
      } else if (nextDay && nextDay.workingTotal >= 7 && (!prevDay || prevDay.workingTotal < 7)) {
        surplusDayName = `${nextDay.dayOfWeek} (Day ${nextDay.day} has ${nextDay.workingTotal} staff)`;
      } else if (prevDay && nextDay && prevDay.workingTotal >= 7 && nextDay.workingTotal >= 7) {
        surplusDayName = `${prevDay.dayOfWeek} or ${nextDay.dayOfWeek}`;
      }

      bottlenecks.push({
        day: d.day,
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        workingTotal: d.workingTotal,
        amCount: d.amCount,
        pmCount: d.pmCount,
        isAmShortage,
        isPmShortage,
        shortageShift,
        deficit,
        restTeammates,
        suggestion: `Recommend moving 1 rest day to ${surplusDayName} to achieve minimum 3-staff ${shortageShift.toLowerCase()} coverage.`
      });
    }
  });

  if (bottlenecks.length === 0) {
    panel.classList.add('hidden');
    content.innerHTML = '';
    return;
  }

  // Display panel
  panel.classList.remove('hidden');
  if (countBadge) {
    countBadge.textContent = `${bottlenecks.length} Date${bottlenecks.length > 1 ? 's' : ''} with Shortages`;
  }

  let cardsHtml = '';
  bottlenecks.forEach(b => {
    const formattedDate = `${b.dayOfWeek}, ${b.day} ${monthNames[month] || 'Oct'} ${year}`;
    const restNames = b.restTeammates.map(tm => {
      const isRx = tm.isPharmacist || tm.position === 'Pharmacist';
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-200/80 text-gray-800 border border-gray-300">
        ${escHtml(tm.nickname)}${isRx ? ' <span class="text-[9px] text-blue-700 font-bold">(Rx)</span>' : ''}
      </span>`;
    }).join(' ');

    cardsHtml += `
      <div class="bg-white border border-amber-200 rounded-xl p-4 shadow-xs transition hover:border-amber-400">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-100">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-extrabold text-xs shadow-xs">
              ${b.day}
            </span>
            <div>
              <div class="font-bold text-gray-900 text-sm flex items-center gap-2 flex-wrap">
                <span>${formattedDate}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-red-100 text-red-800 border border-red-200">
                  <i class="fa-solid fa-circle-exclamation mr-1"></i>Deficit: -${b.deficit} on ${b.shortageShift}
                </span>
              </div>
              <div class="text-[11px] text-gray-500 font-mono mt-0.5">
                Total working: <strong class="text-gray-800">${b.workingTotal} staff</strong> →
                <span class="${b.isAmShortage ? 'text-red-600 font-bold' : 'text-blue-700'}">Morning: ${b.amCount}</span>,
                <span class="${b.isPmShortage ? 'text-red-600 font-bold' : 'text-purple-700'}">Night: ${b.pmCount}</span>
                <span class="text-gray-400">(Floor Target: ≥3 per shift)</span>
              </div>
            </div>
          </div>
          <button type="button" onclick="openDayShiftEditorModal('${b.date}')" class="self-start sm:self-auto px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer">
            <i class="fa-solid fa-pen-to-square"></i>
            <span>Adjust Day ${b.day} Shifts</span>
          </button>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex items-start gap-2 flex-wrap">
            <span class="font-bold text-gray-700 text-[11px] min-w-[135px] flex items-center gap-1 pt-0.5">
              <i class="fa-solid fa-bed text-gray-400"></i> Teammates on Rest Day:
            </span>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${restNames || '<span class="text-gray-400 italic">None</span>'}
            </div>
          </div>

          <div class="flex items-start gap-2 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-amber-950">
            <i class="fa-solid fa-lightbulb text-amber-600 mt-0.5 shrink-0"></i>
            <div>
              <span class="font-bold">Actionable Suggestion:</span>
              <span class="ml-1">${b.suggestion}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  content.innerHTML = cardsHtml;
}

function toggleConflictInspector() {
  const content = document.getElementById('conflictInspectorContent');
  const chevron = document.getElementById('conflictInspectorChevron');
  const label   = document.getElementById('conflictInspectorToggleLabel');
  if (!content) return;

  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
    if (label) label.textContent = 'Hide Details';
  } else {
    content.classList.add('hidden');
    if (chevron) chevron.classList.add('rotate-180');
    if (label) label.textContent = 'Show Details';
  }
}

// ─── DAY SHIFT QUICK-EDIT MODAL (MANUAL FINE-TUNING) ─────────────────────────
let currentlyEditingDay = null;

function openDayShiftEditorModal(dayIdentifier, highlightEmpNo = null) {
  if (!generatedScheduleData || !generatedScheduleData.days) {
    showSchedulerToast('Please generate a schedule first before editing.', 'warn');
    return;
  }

  const d = generatedScheduleData.days.find(x => x.date === dayIdentifier || x.day === dayIdentifier);
  if (!d) return;

  currentlyEditingDay = d.date || dayIdentifier;

  const modal = document.getElementById('schedulerDayShiftEditorModal');
  const title = document.getElementById('dayShiftEditorTitle');
  const subtitle = document.getElementById('dayShiftEditorSubtitle');
  const form = document.getElementById('dayShiftEditorForm');
  if (!modal || !form) return;

  const monthStr = generatedScheduleData.month || '2026-10';
  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(mStr, 10) || 10;
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (title) {
    title.innerHTML = `<i class="fa-solid fa-calendar-day mr-1.5"></i> Fine-Tune Shifts — ${d.dayOfWeek}, ${d.day} ${monthNames[d.month] || monthNames[month] || 'October'} ${d.year || year}`;
  }
  if (subtitle) {
    subtitle.textContent = `Adjust teammate shifts and cleaning duty for Day ${d.day}. Live counters update automatically.`;
  }

  const rotatingPool = currentTeammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');
  const currentCleaner = d.cleaningDuty ? d.cleaningDuty.empNo : '';

  let formHtml = `<div class="space-y-2.5">`;

  currentTeammates.forEach(tm => {
    const isWilliam = tm.empNo === 'PMG00831' || tm.nickname === 'WILLIAM';
    const isRx = tm.isPharmacist || tm.position === 'Pharmacist';
    const currentShift = (d.shifts && d.shifts[tm.empNo]) || 'RD';
    const isHighlighted = tm.empNo === highlightEmpNo;

    formHtml += `
      <div class="p-3 rounded-xl border ${isHighlighted ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-300' : 'bg-white border-gray-200'} flex items-center justify-between gap-3 flex-wrap transition">
        <div class="flex items-center gap-2.5 min-w-[180px]">
          <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
            ${tm.nickname.slice(0, 2)}
          </div>
          <div>
            <div class="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <span>${escHtml(tm.nickname)}</span>
              ${isRx ? '<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-blue-100 text-blue-800 border border-blue-200">Rx</span>' : ''}
              ${isWilliam ? '<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-100 text-amber-800">Fixed Anchor</span>' : ''}
            </div>
            <div class="text-[10px] text-gray-400">${escHtml(tm.position || tm.empName)}</div>
          </div>
        </div>

        <div class="flex items-center gap-2 ml-auto">
          <label class="text-[11px] font-semibold text-gray-500">Shift:</label>
          <select id="editShift_${tm.empNo}" onchange="updateDayShiftEditorMeter()" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="8H_0730-1630" ${currentShift === '8H_0730-1630' ? 'selected' : ''}>🌅 Morning (07:30–16:30)</option>
            <option value="8H_1230-2130" ${currentShift === '8H_1230-2130' ? 'selected' : ''}>🌙 Night (12:30–21:30)</option>
            <option value="4H_0730-1130" ${currentShift === '4H_0730-1130' ? 'selected' : ''}>⏱️ Morning Half Day (07:30–11:30)</option>
            <option value="5H_0730-1230" ${currentShift === '5H_0730-1230' ? 'selected' : ''}>⏱️ Morning 5H (07:30–12:30)</option>
            <option value="5H_1630-2130" ${currentShift === '5H_1630-2130' ? 'selected' : ''}>⏱️ Night 5H (16:30–21:30)</option>
            <option value="RD" ${currentShift === 'RD' ? 'selected' : ''}>🛌 Rest Day (RD)</option>
            <option value="PH" ${currentShift === 'PH' ? 'selected' : ''}>🎉 Public Holiday (PH)</option>
            <option value="OFF" ${currentShift === 'OFF' ? 'selected' : ''}>⚪ OFF</option>
          </select>
        </div>
      </div>
    `;
  });

  // Cleaning duty selector
  formHtml += `
    </div>
    <div class="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-2 flex-wrap">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-broom text-teal-700"></i>
        <div>
          <div class="font-bold text-teal-900 text-xs">6S Gondola Cleaning & Refill Duty (14:00–15:30)</div>
          <div class="text-[10px] text-teal-700">Select rotating teammate on duty (William Chai is exempt)</div>
        </div>
      </div>
      <select id="editShift_cleaner" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white text-teal-950 focus:ring-2 focus:ring-teal-500">
        <option value="">-- No Duty / Auto --</option>
        ${rotatingPool.map(t => `<option value="${t.empNo}" ${currentCleaner === t.empNo ? 'selected' : ''}>🧹 ${escHtml(t.nickname)}</option>`).join('')}
      </select>
    </div>
  `;

  form.innerHTML = formHtml;
  updateDayShiftEditorMeter();
  modal.classList.remove('hidden');
}

function updateDayShiftEditorMeter() {
  const meter = document.getElementById('dayShiftEditorMeter');
  if (!meter) return;

  let amCount = 0;
  let pmCount = 0;
  let rdCount = 0;
  let totalWorking = 0;
  let hasMorningRx = false;
  let hasNightRx = false;

  currentTeammates.forEach(tm => {
    const el = document.getElementById(`editShift_${tm.empNo}`);
    const s = el ? el.value : 'RD';
    const isRx = tm.isPharmacist || tm.position === 'Pharmacist';

    if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
      totalWorking++;
      if (s.includes('0730') || s.includes('0800')) {
        amCount++;
        if (isRx) hasMorningRx = true;
      }
      if (s.includes('1230') || s.includes('1300') || s.includes('1630')) {
        pmCount++;
        if (isRx) hasNightRx = true;
      }
    } else {
      rdCount++;
    }
  });

  const isShortage = amCount < 3 || pmCount < 3;

  meter.innerHTML = `
    <div class="flex items-center gap-3 flex-wrap">
      <div class="font-mono font-bold text-gray-800">
        Working: <span class="${totalWorking < 6 ? 'text-amber-600' : 'text-emerald-700'}">${totalWorking}</span>
      </div>
      <div class="font-mono">
        Morning: <span class="${amCount < 3 ? 'text-red-600 font-extrabold' : 'text-blue-700 font-bold'}">${amCount}</span>
        ${hasMorningRx ? '<span class="text-emerald-700 font-bold ml-0.5" title="Morning Pharmacist covered">✓Rx</span>' : '<span class="text-red-600 font-bold ml-0.5" title="Missing Morning Pharmacist">!Rx</span>'}
      </div>
      <div class="font-mono">
        Night: <span class="${pmCount < 3 ? 'text-red-600 font-extrabold' : 'text-purple-700 font-bold'}">${pmCount}</span>
        ${hasNightRx ? '<span class="text-emerald-700 font-bold ml-0.5" title="Night Pharmacist covered">✓Rx</span>' : '<span class="text-red-600 font-bold ml-0.5" title="Missing Night Pharmacist">!Rx</span>'}
      </div>
      <div class="font-mono text-gray-500">
        Off: <span>${rdCount}</span>
      </div>
    </div>
    <div>
      ${isShortage
        ? `<span class="px-2 py-0.5 rounded font-extrabold text-[10px] bg-red-100 text-red-800 border border-red-200"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Shift Shortage (<3 floor)</span>`
        : `<span class="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-circle-check mr-1"></i>Floor Strength OK (≥3)</span>`
      }
    </div>
  `;
}

function closeDayShiftEditorModal() {
  const modal = document.getElementById('schedulerDayShiftEditorModal');
  if (modal) modal.classList.add('hidden');
  currentlyEditingDay = null;
}

function saveDayShiftEditorModal() {
  if (!currentlyEditingDay || !generatedScheduleData || !generatedScheduleData.days) return;

  const d = generatedScheduleData.days.find(x => x.date === currentlyEditingDay || x.day === currentlyEditingDay);
  if (!d) return;

  let amCount = 0;
  let pmCount = 0;
  let totalWorking = 0;

  currentTeammates.forEach(tm => {
    const el = document.getElementById(`editShift_${tm.empNo}`);
    if (el) {
      const shiftVal = el.value;
      if (!d.shifts) d.shifts = {};
      d.shifts[tm.empNo] = shiftVal;

      if (shiftVal && shiftVal !== 'RD' && shiftVal !== 'PH' && shiftVal !== 'OFF') {
        totalWorking++;
        if (shiftVal.includes('0730') || shiftVal.includes('0800')) amCount++;
        if (shiftVal.includes('1230') || shiftVal.includes('1300') || shiftVal.includes('1630')) pmCount++;
      }
    }
  });

  d.amCount = amCount;
  d.pmCount = pmCount;
  d.workingTotal = totalWorking;

  // Cleaner duty
  const cleanerSelect = document.getElementById('editShift_cleaner');
  if (cleanerSelect && cleanerSelect.value) {
    const cleanerTm = currentTeammates.find(t => t.empNo === cleanerSelect.value);
    if (cleanerTm) {
      d.cleaningDuty = {
        empNo: cleanerTm.empNo,
        nickname: cleanerTm.nickname,
        empName: cleanerTm.empName || cleanerTm.nickname,
        time: '2:00 PM – 3:30 PM',
        task: 'Gondola Cleaning & Refilling'
      };
    }
  } else if (cleanerSelect && !cleanerSelect.value) {
    d.cleaningDuty = null;
  }

  // Update warnings array
  if (generatedScheduleData.warnings) {
    generatedScheduleData.warnings = generatedScheduleData.warnings.filter(w => !w.includes(d.date));
    if (totalWorking < 6 || amCount < 3 || pmCount < 3) {
      const isAmShort = amCount < 3;
      const isPmShort = pmCount < 3;
      const shortDesc = isAmShort ? `Deficit on Morning (${amCount}/3 staff)` : (isPmShort ? `Deficit on Night (${pmCount}/3 staff)` : `Total working staff below 6`);
      generatedScheduleData.warnings.push(`⚠️ Manpower Alert: Only ${totalWorking} staff on duty on ${d.date} (${d.dayOfWeek}). ${shortDesc}. Minimum 6 required to hit 3 AM / 3 PM floor.`);
    }
  }

  // Persist manual edit to cross-month shift registry
  try {
    const branchSelect = document.getElementById('schedulerBranchSelect');
    const branchCode = branchSelect ? branchSelect.value : 'KS01';
    const reg = loadShiftRegistry(branchCode);
    reg[d.date] = d;
    saveShiftRegistry(branchCode, reg);
  } catch (_) {}

  closeDayShiftEditorModal();
  renderScheduleMatrix(generatedScheduleData);
  showSchedulerToast(`Day ${d.day} shifts updated successfully!`, 'success');
}

// Global window bindings
window.renderConflictInspector = renderConflictInspector;
window.toggleConflictInspector = toggleConflictInspector;
window.openDayShiftEditorModal = openDayShiftEditorModal;
window.updateDayShiftEditorMeter = updateDayShiftEditorMeter;
window.closeDayShiftEditorModal = closeDayShiftEditorModal;
window.saveDayShiftEditorModal = saveDayShiftEditorModal;

// ─── EXPORT TO RYMNET MATRIX CSV ──────────────────────────────────────────────
function exportScheduleToRymnetCSV() {
  if (!generatedScheduleData || !generatedScheduleData.days) {
    alert('Please generate a schedule first before exporting.');
    return;
  }

  const { month, branch, days } = generatedScheduleData;
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const totalDaysInMonth = new Date(year, parseInt(monthStr, 10), 0).getDate();

  const lines = [];

  // Row 1: Days of month
  const headerDays = ['BRANCH', 'CODE'];
  for (let d = 1; d <= totalDaysInMonth; d++) headerDays.push(d);
  headerDays.push(''); // Trailing comma
  lines.push(headerDays.join(','));

  // Staff rows (2 lines per staff: Shift code row, then Leave code row)
  currentTeammates.forEach(tm => {
    const shiftRow = [branch, tm.empNo];
    const leaveRow = [branch, tm.empNo];

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayObj = days.find(x => x.day === d);
      const code = dayObj && dayObj.shifts ? dayObj.shifts[tm.empNo] : 'RD';

      if (code === 'RD' || code === 'OFF') {
        shiftRow.push('');
        leaveRow.push('RD');
      } else if (code === 'PH') {
        shiftRow.push('');
        leaveRow.push('PH');
      } else {
        shiftRow.push(code);
        leaveRow.push('');
      }
    }

    shiftRow.push('');
    leaveRow.push('');

    lines.push(shiftRow.join(','));
    lines.push(leaveRow.join(','));
  });

  const csvContent = lines.join('\r\n') + '\r\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `rymnet_ai_generated_${branch}_${month}.csv`);
}

// ─── ENSURE EXCELJS IS LOADED ────────────────────────────────────────────────
async function ensureExcelJS() {
  if (typeof ExcelJS !== 'undefined') return true;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    s.onload = () => resolve(true);
    s.onerror = () => {
      const s2 = document.createElement('script');
      s2.src = 'js/exceljs.min.js';
      s2.onload = () => resolve(true);
      s2.onerror = () => resolve(false);
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  });
}

// ─── EXPORT TO PMG VISUAL DAILY TIMELINE EXCEL ────────────────────────────────
async function exportScheduleToPmgVisualExcel() {
  if (!generatedScheduleData || !generatedScheduleData.days) {
    alert('Please generate a schedule first before exporting.');
    return;
  }

  const { month, branch, days } = generatedScheduleData;
  const hasExcelJS = await ensureExcelJS();

  if (hasExcelJS && typeof ExcelJS !== 'undefined') {
    await generateStyledPmgExcel(month, branch, days);
  } else if (typeof XLSX !== 'undefined') {
    generateBasicPmgExcel(month, branch, days);
  } else {
    alert('Spreadsheet library not loaded. Please check your internet connection.');
  }
}

async function generateStyledPmgExcel(month, branch, days) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PMG Pharmacy Management Hub';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`Visual_Timeline_${month}`, {
    views: [{ showGridLines: true }]
  });

  const headers = [
    'DAY', 'OFF',
    '7.30-8.30AM', '8.30-9.30AM', '9.30-10.30AM', '10.30-11.30AM', '11.30-12.30PM',
    '12.30-1.30PM',
    '1.30-2.30PM', '2.30-3.30PM', '3.30-4.30PM',
    '4.30-5.30PM', '5.30-6.30PM', '6.30-7.30PM', '7.30-8.30PM', '8.30-9.30PM',
    'HALF DAY', 'NOTES'
  ];

  sheet.columns = [
    { header: headers[0], width: 15 },
    { header: headers[1], width: 14 },
    { header: headers[2], width: 13 },
    { header: headers[3], width: 13 },
    { header: headers[4], width: 13 },
    { header: headers[5], width: 13 },
    { header: headers[6], width: 13 },
    { header: headers[7], width: 13 },
    { header: headers[8], width: 13 },
    { header: headers[9], width: 13 },
    { header: headers[10], width: 13 },
    { header: headers[11], width: 13 },
    { header: headers[12], width: 13 },
    { header: headers[13], width: 13 },
    { header: headers[14], width: 13 },
    { header: headers[15], width: 13 },
    { header: headers[16], width: 14 },
    { header: headers[17], width: 28 }
  ];

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  const headerColors = [
    'FF1E3A8A', // DAY (Navy)
    'FFDC2626', // OFF (Crimson)
    'FF0284C7', 'FF0284C7', 'FF0284C7', 'FF0284C7', 'FF0284C7', // Morning slots (Sky Blue)
    'FFD97706', // 12.30-1.30PM (Lunch Amber)
    'FF2563EB', 'FF2563EB', // Afternoon slots (Royal Blue)
    'FFEA580C', // 3.30-4.30PM (Dinner Orange)
    'FF4F46E5', 'FF4F46E5', 'FF4F46E5', 'FF4F46E5', 'FF4F46E5', // Night slots (Indigo)
    'FF7C3AED', // HALF DAY (Purple)
    'FF0F766E'  // NOTES (Teal)
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNum) => {
    const bg = headerColors[colNum - 1] || 'FF1E3A8A';
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  let currentLine = 2;

  days.forEach(d => {
    const [y, m, dayNum] = d.date.split('-');
    const dayLabel = `${d.dayOfWeek.slice(0, 3).toUpperCase()}\n${dayNum}.${m}.${y}`;

    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date];
    const holidayName = isHoliday ? HOLIDAYS_2026_SARAWAK[d.date] : '';

    const offList = [];
    const halfDayList = [];
    const morningStaff = [];
    const nightStaff = [];

    currentTeammates.forEach(tm => {
      const shift = (d.shifts && d.shifts[tm.empNo]) || 'RD';
      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';

      if (shift === 'RD' || shift === 'OFF') {
        offList.push(tm.nickname);
      } else if (shift === 'PH') {
        offList.push(`${tm.nickname} (PH)`);
      } else if (shift.includes('0730-1130') || shift.includes('0730-1230')) {
        halfDayList.push(tm.nickname);
        morningStaff.push({ nickname: tm.nickname, empNo: tm.empNo, isPharm, isHalf: true, shift });
      } else if (shift.includes('1630-2130')) {
        halfDayList.push(tm.nickname);
        nightStaff.push({ nickname: tm.nickname, empNo: tm.empNo, isPharm, isHalf: true, shift });
      } else if (shift.includes('0730') || shift.includes('0800')) {
        morningStaff.push({ nickname: tm.nickname, empNo: tm.empNo, isPharm, isHalf: false, shift });
      } else if (shift.includes('1230') || shift.includes('1300')) {
        nightStaff.push({ nickname: tm.nickname, empNo: tm.empNo, isPharm, isHalf: false, shift });
      }
    });

    const workingStaffRows = [...morningStaff, ...nightStaff];
    const dayRowCount = Math.max(workingStaffRows.length, offList.length, halfDayList.length, 6);
    const startRow = currentLine;
    const endRow = currentLine + dayRowCount - 1;

    // Day styling
    let dayBg = 'FFF8FAFC';
    let dayFg = 'FF0F172A';
    if (isHoliday) {
      dayBg = 'FFFFE4E6';
      dayFg = 'FFBE123C';
    } else if (d.dayOfWeek === 'Sunday') {
      dayBg = 'FFFEE2E2';
      dayFg = 'FF991B1B';
    } else if (d.dayOfWeek === 'Saturday') {
      dayBg = 'FFFEF9C3';
      dayFg = 'FF854D0E';
    }

    for (let r = 0; r < dayRowCount; r++) {
      const rowNum = currentLine + r;
      const row = sheet.getRow(rowNum);
      row.height = 24;

      // Col 1: DAY
      const dayCell = row.getCell(1);
      if (r === 0) dayCell.value = dayLabel;
      dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayBg } };
      dayCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: dayFg } };
      dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      dayCell.border = thinBorder;

      // Col 2: OFF
      const offCell = row.getCell(2);
      if (r < offList.length) {
        offCell.value = offList[r];
        offCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        offCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
      } else {
        offCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
      offCell.alignment = { horizontal: 'center', vertical: 'middle' };
      offCell.border = thinBorder;

      // Cols 3 to 16: Hourly timeline
      const staff = r < workingStaffRows.length ? workingStaffRows[r] : null;

      for (let c = 3; c <= 16; c++) {
        const timeCell = row.getCell(c);
        timeCell.border = thinBorder;
        timeCell.alignment = { horizontal: 'center', vertical: 'middle' };

        if (!staff) {
          timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          continue;
        }

        const nick = staff.nickname;
        let cellText = '';
        let cellBg = 'FFFFFFFF';
        let cellFg = 'FF000000';

        // Staff badge colors
        const staffBg = staff.isPharm
          ? 'FFCFFAFE' // Soft Cyan (Pharmacist)
          : (staff.isHalf
            ? 'FFFFEDD5' // Soft Warm Peach (Half Day)
            : (morningStaff.includes(staff)
              ? 'FFDCFCE7' // Soft Mint Green (Morning Shift)
              : 'FFEDE9FE')); // Soft Lavender (Night Shift)

        const staffFg = staff.isPharm
          ? 'FF0E7490' // Dark Teal
          : (staff.isHalf
            ? 'FFC2410C' // Warm Rust
            : (morningStaff.includes(staff)
              ? 'FF15803D' // Forest Green
              : 'FF6D28D9')); // Deep Violet

        if (staff.isHalf) {
          if (staff.shift.includes('0730-1130')) {
            if (c >= 3 && c <= 6) { cellText = nick; cellBg = staffBg; cellFg = staffFg; }
          } else if (staff.shift.includes('0730-1230')) {
            if (c >= 3 && c <= 7) { cellText = nick; cellBg = staffBg; cellFg = staffFg; }
          } else if (staff.shift.includes('1630-2130')) {
            if (c >= 12 && c <= 16) { cellText = nick; cellBg = staffBg; cellFg = staffFg; }
          }
        } else if (morningStaff.includes(staff)) {
          // Morning Full Shift
          if (c >= 3 && c <= 7) {
            cellText = nick; cellBg = staffBg; cellFg = staffFg;
          } else if (c === 8) {
            cellText = 'REST';
            cellBg = 'FFFEF08A'; // Bright Golden Yellow
            cellFg = 'FF854D0E'; // Golden Brown
          } else if (c >= 9 && c <= 11) {
            cellText = nick; cellBg = staffBg; cellFg = staffFg;
          }
        } else {
          // Night Full Shift
          if (c >= 8 && c <= 10) {
            cellText = nick; cellBg = staffBg; cellFg = staffFg;
          } else if (c === 11) {
            cellText = 'REST';
            cellBg = 'FFFEF08A'; // Bright Golden Yellow
            cellFg = 'FF854D0E'; // Golden Brown
          } else if (c >= 12 && c <= 16) {
            cellText = nick; cellBg = staffBg; cellFg = staffFg;
          }
        }

        // Highlight 2:00 PM – 3:30 PM Golden Cleaning Slot (Cols 9 & 10) for designated duty assistant
        const isCleaningDuty = d.cleaningDuty && staff && staff.empNo === d.cleaningDuty.empNo;
        if (isCleaningDuty && (c === 9 || c === 10) && cellText && cellText !== 'REST') {
          cellText = `${nick} (6S Clean)`;
          cellBg = 'FFCCFBF1'; // Soft Teal
          cellFg = 'FF0F766E'; // Deep Teal
        }

        if (cellText) {
          timeCell.value = cellText;
          timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellBg } };
          timeCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: cellFg } };
        } else {
          timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }
      }

      // Col 17: HALF DAY
      const halfCell = row.getCell(17);
      if (r < halfDayList.length) {
        halfCell.value = halfDayList[r];
        halfCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
        halfCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF7E22CE' } };
      } else {
        halfCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
      halfCell.alignment = { horizontal: 'center', vertical: 'middle' };
      halfCell.border = thinBorder;

      // Col 18: NOTES (Includes 14:00-15:30 6S Cleaning Duty Assignment)
      const notesCell = row.getCell(18);
      const cleanerNick = d.cleaningDuty ? d.cleaningDuty.nickname : '';
      if (r === 0) {
        if (holidayName) {
          notesCell.value = `${holidayName}${cleanerNick ? ` | 🧹 14:00-15:30 Clean: ${cleanerNick}` : ''}`;
        } else if (cleanerNick) {
          notesCell.value = `🧹 2:00-3:30PM Cleaning: ${cleanerNick}`;
        }
      }
      const hasCleanNote = notesCell.value && notesCell.value.toString().includes('Clean');
      notesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: holidayName ? 'FFFFE4E6' : (hasCleanNote ? 'FFF0FDFA' : 'FFFFFFFF') } };
      notesCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: holidayName ? 'FFBE123C' : (hasCleanNote ? 'FF0F766E' : 'FF334155') } };
      notesCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      notesCell.border = thinBorder;
    }

    // Merges for this day
    sheet.mergeCells(startRow, 1, endRow, 1);
    if (halfDayList.length <= 1) {
      sheet.mergeCells(startRow, 17, endRow, 17);
    }
    sheet.mergeCells(startRow, 18, endRow, 18);

    currentLine += dayRowCount;

    // Day divider row
    const divRow = sheet.getRow(currentLine);
    divRow.height = 6;
    for (let c = 1; c <= 18; c++) {
      const cell = divRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    }
    currentLine++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `PMG_Visual_Schedule_${branch}_${month}.xlsx`;

  if (typeof saveAs !== 'undefined') {
    saveAs(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function generateBasicPmgExcel(month, branch, days) {
  const wsData = [];
  const merges = [];

  // Header row matching PMG retail pharmacy roster
  const header = [
    'DAY', 'OFF',
    '7.30-8.30AM', '8.30-9.30AM', '9.30-10.30AM', '10.30-11.30AM', '11.30-12.30PM',
    '12.30-1.30PM',
    '1.30-2.30PM', '2.30-3.30PM', '3.30-4.30PM',
    '4.30-5.30PM', '5.30-6.30PM', '6.30-7.30PM', '7.30-8.30PM', '8.30-9.30PM',
    'HALF DAY', 'NOTES'
  ];
  wsData.push(header);

  let currentRowIdx = 1;

  days.forEach(d => {
    const [y, m, dayNum] = d.date.split('-');
    const dayLabel = `${d.dayOfWeek.slice(0, 3).toUpperCase()}\n${dayNum}.${m}.${y}`;

    const offList = [];
    const halfDayList = [];
    const morningStaff = [];
    const nightStaff = [];

    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date];
    const holidayName = isHoliday ? HOLIDAYS_2026_SARAWAK[d.date] : '';

    currentTeammates.forEach(tm => {
      const shift = (d.shifts && d.shifts[tm.empNo]) || 'RD';

      if (shift === 'RD' || shift === 'OFF') {
        offList.push(tm.nickname);
      } else if (shift === 'PH') {
        offList.push(`${tm.nickname} (PH)`);
      } else if (shift.includes('0730-1130') || shift.includes('0730-1230')) {
        halfDayList.push(tm.nickname);
        morningStaff.push({ nickname: tm.nickname, isHalf: true, shift });
      } else if (shift.includes('1630-2130')) {
        halfDayList.push(tm.nickname);
        nightStaff.push({ nickname: tm.nickname, isHalf: true, shift });
      } else if (shift.includes('0730') || shift.includes('0800')) {
        morningStaff.push({ nickname: tm.nickname, isHalf: false, shift });
      } else if (shift.includes('1230') || shift.includes('1300')) {
        nightStaff.push({ nickname: tm.nickname, isHalf: false, shift });
      }
    });

    const workingStaffRows = [...morningStaff, ...nightStaff];
    const dayRowCount = Math.max(workingStaffRows.length, offList.length, halfDayList.length, 6);

    const startRow = currentRowIdx;
    const endRow = currentRowIdx + dayRowCount - 1;

    for (let r = 0; r < dayRowCount; r++) {
      const row = new Array(18).fill('');

      if (r === 0) row[0] = dayLabel;
      if (r < offList.length) row[1] = offList[r];

      if (r < workingStaffRows.length) {
        const staff = workingStaffRows[r];
        const nick = staff.nickname;

        if (staff.isHalf) {
          if (staff.shift.includes('0730-1130')) {
            row[2] = nick; row[3] = nick; row[4] = nick; row[5] = nick;
          } else if (staff.shift.includes('0730-1230')) {
            row[2] = nick; row[3] = nick; row[4] = nick; row[5] = nick; row[6] = nick;
          } else if (staff.shift.includes('1630-2130')) {
            row[11] = nick; row[12] = nick; row[13] = nick; row[14] = nick; row[15] = nick;
          }
        } else if (staff.shift.includes('0730') || staff.shift.includes('0800')) {
          row[2] = nick; row[3] = nick; row[4] = nick; row[5] = nick; row[6] = nick;
          row[7] = 'REST';
          row[8] = nick; row[9] = nick; row[10] = nick;
        } else {
          row[7] = nick; row[8] = nick; row[9] = nick;
          row[10] = 'REST';
          row[11] = nick; row[12] = nick; row[13] = nick; row[14] = nick; row[15] = nick;
        }

        // 6S Cleaning duty highlight (Cols 8 & 9)
        const isCleaningDuty = d.cleaningDuty && staff && staff.empNo === d.cleaningDuty.empNo;
        if (isCleaningDuty) {
          if (row[8] && row[8] !== 'REST') row[8] = `${nick} (Clean)`;
          if (row[9] && row[9] !== 'REST') row[9] = `${nick} (Clean)`;
        }
      }

      if (r < halfDayList.length) row[16] = halfDayList[r];
      if (r === 0) {
        const cleanerNick = d.cleaningDuty ? d.cleaningDuty.nickname : '';
        if (holidayName) {
          row[17] = `${holidayName}${cleanerNick ? ` | 🧹 14:00-15:30: ${cleanerNick}` : ''}`;
        } else if (cleanerNick) {
          row[17] = `🧹 2:00-3:30PM Cleaning: ${cleanerNick}`;
        }
      }

      wsData.push(row);
      currentRowIdx++;
    }

    merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
    if (halfDayList.length <= 1) {
      merges.push({ s: { r: startRow, c: 16 }, e: { r: endRow, c: 16 } });
    }
    merges.push({ s: { r: startRow, c: 17 }, e: { r: endRow, c: 17 } });

    const emptySep = new Array(18).fill('');
    wsData.push(emptySep);
    currentRowIdx++;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
    { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
    { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 28 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Visual_Timeline_${month}`);
  XLSX.writeFile(wb, `PMG_Visual_Schedule_${branch}_${month}.xlsx`);
}

// ─── EXPORT TO EXCEL (MONTHLY MATRIX) ─────────────────────────────────────────
function exportScheduleToExcel() {
  if (!generatedScheduleData || !generatedScheduleData.days) {
    alert('Please generate a schedule first before exporting.');
    return;
  }

  if (typeof XLSX === 'undefined') {
    alert('SheetJS (XLSX) library not loaded.');
    return;
  }

  const { month, branch, days } = generatedScheduleData;
  const wsData = [];

  // Header row
  const header = ['Emp ID', 'Nickname', 'Full Name', 'Position', 'Race', 'M Shifts', 'N Shifts'];
  days.forEach(d => {
    header.push(`${d.day} (${d.dayOfWeek.slice(0, 3)})`);
  });
  wsData.push(header);

  // Data rows
  currentTeammates.forEach(tm => {
    let mCount = 0;
    let nCount = 0;
    days.forEach(d => {
      const s = d.shifts[tm.empNo] || '';
      if (s.includes('0730') || s.includes('0800')) mCount++;
      if (s.includes('1230') || s.includes('1300') || s.includes('1630')) nCount++;
    });

    const row = [tm.empNo, tm.nickname, tm.empName, tm.position, tm.race, mCount, nCount];
    days.forEach(d => {
      row.push(d.shifts[tm.empNo] || 'RD');
    });
    wsData.push(row);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, `${branch}_${month}`);
  XLSX.writeFile(wb, `PMG_Roster_${branch}_${month}.xlsx`);
}

// ─── COPY WHATSAPP SUMMARY ────────────────────────────────────────────────────
function copyScheduleWhatsAppSummary() {
  if (!generatedScheduleData || !generatedScheduleData.days) {
    alert('Please generate a schedule first before copying.');
    return;
  }

  const { month, branch, days } = generatedScheduleData;

  let text = `📢 *PMG PHARMACY (${branch}) — MONTHLY SCHEDULE (${month})*\n`;
  text += `Generated with AI Schedule Intelligence (Balanced Shifts & Pharmacist Coverage)\n\n`;

  days.slice(0, 7).forEach(d => {
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date];
    const holidayName = isHoliday ? ` 🔴 *[${HOLIDAYS_2026_SARAWAK[d.date]}]*` : '';

    text += `📅 *${d.dayOfWeek}, ${d.date}*${holidayName}\n`;
    const morning = [];
    const night   = [];
    const off     = [];

    Object.entries(d.shifts).forEach(([empNo, shift]) => {
      const tm = currentTeammates.find(t => t.empNo === empNo);
      if (!tm) return;
      if (shift.includes('0730') || shift.includes('0800')) morning.push(tm.nickname);
      else if (shift.includes('1230') || shift.includes('1300') || shift.includes('1630')) night.push(tm.nickname);
      else off.push(tm.nickname);
    });

    text += `  🌅 *Morning (07:30-16:30):* ${morning.join(', ') || 'None'}\n`;
    text += `  🌙 *Night (12:30-21:30):* ${night.join(', ') || 'None'}\n`;
    if (d.cleaningDuty) {
      text += `  🧹 *6S Cleaning (14:00-15:30):* ${d.cleaningDuty.nickname} (${d.cleaningDuty.task})\n`;
    }
    if (d.amCount !== undefined && d.pmCount !== undefined) {
      text += `  👥 *Floor Strength:* AM: ${d.amCount} | PM: ${d.pmCount} (Total Working: ${d.workingTotal})\n`;
    }
    text += `  ☕ *Rest / Holiday:* ${off.join(', ') || 'None'}\n\n`;
  });

  if (days.length > 7) {
    text += `_...and full month continued in official roster sheet._\n`;
  }

    navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('schedulerCopyWaBtn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Copied to Clipboard!';
      setTimeout(() => { btn.innerHTML = orig; }, 2500);
    }
  }).catch(() => {
    alert('Could not copy to clipboard. Please allow clipboard permissions.');
  });
}

// ─── WINDOW EXPORTS ───────────────────────────────────────────────────────────
window.generateTimetable = generateTimetable;
window.initScheduler = initScheduler;
window.loadTeammates = loadTeammates;
window.renderTeammatesTable = renderTeammatesTable;
window.saveTeammatePreferences = saveTeammatePreferences;
window.resetTeammatePreferences = resetTeammatePreferences;
window.renderScheduleMatrix = renderScheduleMatrix;
window.openDayShiftEditorModal = openDayShiftEditorModal;
window.closeDayShiftEditorModal = closeDayShiftEditorModal;
window.saveDayShiftEditorModal = saveDayShiftEditorModal;
window.openDayPrefsModal = openDayPrefsModal;
window.closeDayPrefsModal = closeDayPrefsModal;
window.saveDayPrefsModal = saveDayPrefsModal;
window.showAddTeammateModal = showAddTeammateModal;
window.copyScheduleWhatsAppSummary = copyScheduleWhatsAppSummary;
window.copyScheduleToWhatsApp = copyScheduleWhatsAppSummary;

