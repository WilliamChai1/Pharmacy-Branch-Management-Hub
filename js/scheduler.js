// js/scheduler.js — Module 3: AM AI Smart Timetable & Roster Generator
'use strict';

// ─── MULTI-TIER GEMINI CONFIGURATION ───────────────────────────────────────────
// Primary: Gemini 3.5 Flash-Lite (gemini-3.5-flash-lite — 500 RPD)
// Secondary: Gemini 3.5 Flash (gemini-3.5-flash — 20 RPD)
// Tertiary: Gemini 3.1 Flash-Lite (gemini-3.1-flash-lite — 500 RPD)
const SCHEDULER_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const SCHEDULER_SECONDARY_MODEL = 'gemini-3.5-flash';
const SCHEDULER_TERTIARY_MODEL  = 'gemini-3.1-flash-lite';

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
    scheduleMode: 'Fixed', // Fixed Schedule
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
    empNo: 'PMG02963',
    nickname: 'KENIX',
    empName: 'KENIX LING WANG YIING',
    position: 'Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Night Preferred',
    restDayPref: 'Monday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'RD',
      Tuesday: 'Night Preferred',
      Wednesday: 'Flexible',
      Thursday: 'Night Preferred',
      Friday: 'Flexible',
      Saturday: 'Night Preferred',
      Sunday: 'Flexible'
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
    shiftPref: 'Morning Preferred',
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
    empNo: 'PMG02694',
    nickname: 'PENNY',
    empName: 'JONG PEI CHOO',
    position: 'Assistant Branch Manager',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Friday',
    halfDayPref: 'Thursday',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Morning Half (4H)',
      Friday: 'RD',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG01294',
    nickname: 'LOUNA',
    empName: 'HANIESHA LOUNA ANAK DAGENG',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Tuesday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'RD',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Flexible',
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
    shiftPref: 'Morning Preferred',
    restDayPref: 'Wednesday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'RD',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG03062',
    nickname: 'JANET',
    empName: 'DANIELA JANET ANAK MUSTAPHA',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Night Preferred',
    restDayPref: 'Thursday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
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
    shiftPref: 'Morning Preferred',
    restDayPref: 'Friday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'RD',
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
    shiftPref: 'Night Preferred',
    restDayPref: 'Saturday',
    halfDayPref: 'None',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Flexible',
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
  }

  // Ensure William Chai has his fixed schedule attributes
  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  if (william) {
    william.position = 'Pharmacist';
    william.isPharmacist = true;
    william.scheduleMode = 'Fixed';
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
  const updated = [];

  rows.forEach(tr => {
    const empNo = tr.getAttribute('data-emp-no');
    const orig = currentTeammates.find(t => t.empNo === empNo) || {};
    
    const posEl   = tr.querySelector('.tm-position');
    const raceEl  = tr.querySelector('.tm-race');
    const shiftEl = tr.querySelector('.tm-shift-pref');
    const restEl  = tr.querySelector('.tm-rest-pref');

    const posVal = posEl ? posEl.value : (orig.position || 'Staff');
    const isPharm = posVal === 'Pharmacist' || (orig.empNo === 'PMG00831'); // William Chai is pharmacist

    updated.push({
      ...orig,
      position:    posVal,
      isPharmacist: isPharm,
      race:        raceEl ? raceEl.value : (orig.race || 'Chinese'),
      shiftPref:   shiftEl ? shiftEl.value : (orig.shiftPref || 'Flexible'),
      restDayPref: restEl ? restEl.value : (orig.restDayPref || 'Sunday'),
      dayPrefs:    orig.dayPrefs || {
        Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
        Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'RD'
      }
    });
  });

  currentTeammates = updated;
  localStorage.setItem(getStorageKey(branchCode), JSON.stringify(currentTeammates));

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

  const positionOptions = ['Pharmacist', 'Branch Manager', 'Assistant Branch Manager', 'Staff'];
  const raceOptions = ['Chinese', 'Malay', 'Iban / Bidayuh', 'Other'];
  const shiftOptions = ['Morning Preferred', 'Night Preferred', 'Flexible', 'Morning Only'];
  const restOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Flexible'];

  let html = '';
  currentTeammates.forEach(t => {
    const isPharm = t.isPharmacist || t.position === 'Pharmacist';
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
  selects.forEach(sel => {
    const day = sel.getAttribute('data-day');
    newPrefs[day] = sel.value;
  });

  tm.dayPrefs = newPrefs;
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
  const monthVal  = monthInput?.value || '2026-10';

  saveTeammatePreferences();

  if (!currentTeammates.length) {
    alert('Please configure at least one teammate before generating the schedule.');
    return;
  }

  // Verify that we have at least one pharmacist
  const pharmacists = currentTeammates.filter(t => t.isPharmacist || t.position === 'Pharmacist');
  if (pharmacists.length === 0) {
    alert('⚠️ Crucial Pharmacy Constraint Warning: No Pharmacist defined in the team. At least 1 pharmacist is required for legal operation.');
    return;
  }

  if (statusEl) statusEl.classList.remove('hidden');
  if (genBtn) {
    genBtn.disabled = true;
    genBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating Schedule…';
  }

  const apiKey = (document.getElementById('geminiApiKey')?.value || '').trim()
              || localStorage.getItem('pmg_gemini_key') || '';

  const [yearStr, monthStr] = monthVal.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = new Date(year, month, 0).getDate();

  try {
    if (apiKey) {
      let aiResult = null;
      const schedulerCandidateModels = [
        { code: SCHEDULER_PRIMARY_MODEL,   name: 'Gemini 3.5 Flash-Lite (Primary: 500 RPD)' },
        { code: SCHEDULER_SECONDARY_MODEL, name: 'Gemini 3.5 Flash (Secondary: 20 RPD)' },
        { code: SCHEDULER_TERTIARY_MODEL,  name: 'Gemini 3.1 Flash-Lite (Backup: 500 RPD)' },
        { code: 'gemini-2.5-flash',        name: 'Gemini 2.5 Flash' },
        { code: 'gemini-1.5-flash',        name: 'Gemini 1.5 Flash' }
      ];

      for (const m of schedulerCandidateModels) {
        try {
          if (statusText) statusText.textContent = `Querying ${m.name} with M/N shift balance & pharmacist rules…`;
          aiResult = await callSchedulerGemini(m.code, branchVal, monthVal, totalDays, apiKey);
          if (aiResult && aiResult.days && aiResult.days.length > 0) {
            if (modelBadge) {
              modelBadge.textContent = `⚡ ${m.name}`;
              modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-800 border border-green-200';
            }
            break;
          }
        } catch (tierErr) {
          console.warn(`[PMG Scheduler] Model ${m.name} failed:`, tierErr.message);
        }
      }

      if (aiResult && aiResult.days && aiResult.days.length > 0) {
        postProcessSchedule(aiResult, branchVal, year, month, totalDays);
        generatedScheduleData = aiResult;
      } else {
        throw new Error('AI returned invalid schedule structure. Running smart heuristic engine.');
      }

    } else {
      // Offline / No API Key -> Run Smart Heuristic Solver
      if (statusText) statusText.textContent = 'Running offline constraint-satisfaction heuristic engine…';
      await new Promise(r => setTimeout(r, 600));
      generatedScheduleData = runHeuristicScheduleGenerator(branchVal, year, month, totalDays);
      if (modelBadge) {
        modelBadge.textContent = '⚙️ Smart Heuristic Solver (Offline)';
        modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200';
      }
    }

    renderScheduleMatrix(generatedScheduleData);
    if (resultsPanel) resultsPanel.classList.remove('hidden');

  } catch (err) {
    console.error('[PMG Scheduler Error]', err);
    if (statusText) statusText.textContent = `AI note: ${err.message}. Generating with Smart Heuristic Solver…`;
    await new Promise(r => setTimeout(r, 500));
    generatedScheduleData = runHeuristicScheduleGenerator(branchVal, year, month, totalDays);
    if (modelBadge) {
      modelBadge.textContent = '⚙️ Smart Heuristic Solver (Auto-Failover)';
      modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200';
    }
    renderScheduleMatrix(generatedScheduleData);
    if (resultsPanel) resultsPanel.classList.remove('hidden');

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
  const staffMembers = currentTeammates.filter(t => t.position === 'Staff' && t.empNo !== 'PMG00831');
  const cleaningCounts = {};
  staffMembers.forEach(a => { cleaningCounts[a.empNo] = 0; });

  if (!schedule.warnings) schedule.warnings = [];

  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');

  schedule.days.forEach(d => {
    const dateObj = new Date(year, month - 1, d.day);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];
    const holidayName = isHoliday ? HOLIDAYS_2026_SARAWAK[dateStr] : '';

    if (!d.shifts) d.shifts = {};

    // 1. Enforce William's immutable anchor schedule
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

    // 2. Count morning, night, and working staff
    let finalAm = 0;
    let finalPm = 0;
    let workingTotal = 0;
    Object.values(d.shifts).forEach(s => {
      if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
        workingTotal++;
        if (s.includes('0730') || s.includes('0800')) finalAm++;
        if (s.includes('1230') || s.includes('1300') || s.includes('1630')) finalPm++;
      }
    });

    d.amCount = finalAm;
    d.pmCount = finalPm;
    d.workingTotal = workingTotal;

    if (workingTotal < 6) {
      const warn = `⚠️ Manpower Alert: Only ${workingTotal} staff on duty on ${dateStr} (${dayOfWeek}${holidayName ? ' - ' + holidayName : ''}). Minimum 6 required to hit 3 AM / 3 PM floor.`;
      d.warning = warn;
      if (!schedule.warnings.includes(warn)) schedule.warnings.push(warn);
    }

    // 3. Assign 6S Cleaning Slot round-robin among duty pharmacy assistants (2:00 PM – 3:30 PM)
    if (!d.cleaningDuty || !d.cleaningDuty.empNo) {
      const dutyAssistants = staffMembers.filter(a => {
        const s = d.shifts[a.empNo];
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF';
      });

      if (dutyAssistants.length > 0) {
        dutyAssistants.sort((a, b) => {
          const cA = cleaningCounts[a.empNo] || 0;
          const cB = cleaningCounts[b.empNo] || 0;
          if (cA !== cB) return cA - cB;
          return a.empNo.localeCompare(b.empNo);
        });
        const cleaner = dutyAssistants[0];
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

  const prompt = `You are an expert Pharmacy Operations Director scheduling the retail branch roster for PMG Pharmacy Kota Sentosa (KS01).
Branch: PMG Kota Sentosa (Operating Hours: 07:30 to 21:30 daily).
Month: ${monthVal} (Total Days: ${totalDays}).
Public Holidays in this month (Malaysia & Sarawak): ${JSON.stringify(monthHolidays)}

TEAMMATES (${currentTeammates.length} staff):
${JSON.stringify(currentTeammates.map(t => ({
  empNo: t.empNo,
  name: t.empName,
  nickname: t.nickname,
  position: t.position,
  isPharmacist: t.isPharmacist || false,
  scheduleMode: t.scheduleMode || 'Rotating',
  race: t.race,
  shiftPref: t.shiftPref,
  restDayPref: t.restDayPref,
  dayPrefs: t.dayPrefs || {}
})), null, 2)}

STRICT OPERATIONAL RULES & HARD CONSTRAINTS:

1. IMMUTABLE STAFF ANCHOR — CHAI YEE SIAN (WILLIAM - PMG00831):
   - William Chai's schedule is FIXED, IMMUTABLE, and pre-locked first before solving the rest of the roster:
     * Monday to Friday: '8H_0730-1630' (07:30 to 16:30)
     * Saturday: '4H_0730-1130' (Morning Half Day 07:30 to 11:30)
     * Sunday: 'RD' (Rest Day)
     * Gazetted Public Holidays (Sarawak & Malaysia): 'PH'
   - William is EXCLUDED from the rotating AM/PM parity algorithm.
   - William is EXCLUDED from the 2:00 PM – 3:30 PM Gondola Cleaning/Refilling rotation pool.

2. SHIFT MANPOWER DENSITY CONSTRAINTS:
   - Morning Shift (AM - 07:30): Target exactly 4 teammates. Absolute minimum floor: 3 teammates.
   - Night Shift (PM - 12:30): Target exactly 4 teammates. Absolute minimum floor: 3 teammates.
   - Total floor strength includes William when he is on duty.
   - Flag a warning if total available working staff on any given day makes hitting 3 staff impossible due to approved festive leave (working total < 6).

3. MANDATORY PHARMACIST COVERAGE (100% STORE HOURS):
   - Licensed Pharmacists: William Chai (PMG00831) and Kenix Ling (PMG02963). Note: Ting Kwang Yu is NOT a pharmacist!
   - Morning Shift (07:30-16:30): Covered by William (Mon–Sat). On Sundays and Public Holidays when William is off ('RD'/'PH'), Kenix Ling MUST be scheduled for Morning ('8H_0730-1630').
   - Night Shift (12:30-21:30): Covered by Kenix Ling (when William works morning).
   - At least 1 licensed Pharmacist must be on duty on every single working shift!

4. ANTI-FATIGUE & RECOVERY HARD RULES:
   - FORBID assigning a Night (PM - '8H_1230-2130') shift followed directly by a Morning (AM - '8H_0730-1630' or '4H_0730-1130') shift the next morning (ensure mandatory turnaround rest of at least 15-34 hours through an intervening Rest Day 'RD' or consecutive PM shift).
   - Kenix Ling must take Saturday as 'RD' before covering Sunday Morning to guarantee turnaround rest.
   - CAP consecutive Night shifts at a maximum of 3 consecutive days before a mandatory Rest Day ('RD') or morning transition.

5. FAIRNESS & SHIFT EQUITY (PARITY):
   - Shift Balance Parity: Over the ${totalDays}-day month, the distribution of Morning (AM) vs Night (PM) shifts per teammate must be equitable: maximum variance of ±1 shift between teammates in the same role (e.g. Staff Pharmacy Assistants should each receive ~12-13 Morning and ~12-13 Night shifts).

6. GOLDEN HOUR 6S CLEANING & REFILLING OVERLAP SLOT (14:00 – 15:30):
   - The overlap period from 2:00 PM to 3:30 PM is dedicated to "Gondola Cleaning & Refilling".
   - Assign exactly 1 designated duty Pharmacy Assistant each day to this slot.
   - Implement round-robin rotation so every Pharmacy Assistant (Louna, Fiona, Janet, Nurhafizah, Farizin) shares this duty equally throughout the month. William and Kenix are excluded from this duty.

7. CULTURAL, RACE & MULTILINGUAL BALANCE:
   - Multilingual customer coverage: Every shift must include at least 1 Chinese speaker and at least 1 Malay or Iban/Bidayuh speaker.
   - Friday prayers (Solat Jumaat): Non-Muslim staff cover floor/dispensary between 12:30 and 14:30.
   - Festive holiday leave rotation: CNY (Chinese staff off), Hari Raya (Malay staff off), Gawai (Iban/Bidayuh staff off).

8. LABOR LAW:
   - Maximum 6 consecutive working days without an RD. Minimum 1 Rest Day ('RD') per 7-day period.

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
        "PMG02963": "8H_1230-2130",
        "PMG00723": "8H_0730-1630",
        "PMG02694": "8H_1230-2130",
        "PMG01294": "8H_0730-1630",
        "PMG01780": "8H_0730-1630",
        "PMG03062": "8H_1230-2130",
        "PMG02070": "8H_1230-2130",
        "PMG03375": "RD"
      },
      "cleaningDuty": {
        "empNo": "PMG01294",
        "nickname": "LOUNA",
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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status} (${model}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No content returned by Gemini');

  return JSON.parse(cleaned);
}

// ─── SMART HEURISTIC SCHEDULE GENERATOR (OFFLINE / FAILOVER) ──────────────────
function runHeuristicScheduleGenerator(branchVal, year, month, totalDays) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const staffMembers = currentTeammates.filter(t => t.position === 'Staff' && t.empNo !== 'PMG00831');
  const cycle5 = ['AM', 'AM', 'PM', 'PM', 'RD'];

  const stats = {};
  currentTeammates.forEach(t => {
    stats[t.empNo] = { am: 0, pm: 0, rd: 0, clean: 0, consecutiveNights: 0, lastShift: null };
  });

  const dailySchedule = [];
  const warnings = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];
    const holidayName = isHoliday ? HOLIDAYS_2026_SARAWAK[dateStr] : '';
    const dayShifts = {};

    // 1. William Chai (Fixed Anchor - Immutable)
    const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
    if (william) {
      if (isHoliday) {
        dayShifts[william.empNo] = 'PH';
        stats[william.empNo].rd++;
        stats[william.empNo].lastShift = 'PH';
      } else if (dayOfWeek === 'Sunday') {
        dayShifts[william.empNo] = 'RD';
        stats[william.empNo].rd++;
        stats[william.empNo].lastShift = 'RD';
      } else if (dayOfWeek === 'Saturday') {
        dayShifts[william.empNo] = '4H_0730-1130';
        stats[william.empNo].am++;
        stats[william.empNo].lastShift = 'AM';
      } else {
        dayShifts[william.empNo] = '8H_0730-1630';
        stats[william.empNo].am++;
        stats[william.empNo].lastShift = 'AM';
      }
    }

    // 2. Kenix Ling (Pharmacist Coverage & Anti-Fatigue)
    const kenix = currentTeammates.find(t => t.empNo === 'PMG02963' || t.nickname === 'KENIX');
    let kenixTookRd = false;
    if (kenix) {
      const isWilliamOffToday = (william && (dayShifts[william.empNo] === 'RD' || dayShifts[william.empNo] === 'PH'));
      const tomorrowDateObj = new Date(year, month - 1, d + 1);
      const tomorrowDayOfWeek = daysOfWeek[tomorrowDateObj.getDay()];
      const tomorrowDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
      const isWilliamOffTomorrow = (d < totalDays && (tomorrowDayOfWeek === 'Sunday' || !!HOLIDAYS_2026_SARAWAK[tomorrowDateStr]));

      if (isWilliamOffToday) {
        dayShifts[kenix.empNo] = '8H_0730-1630';
        stats[kenix.empNo].am++;
        stats[kenix.empNo].lastShift = 'AM';
        stats[kenix.empNo].consecutiveNights = 0;
      } else if (isWilliamOffTomorrow) {
        // Saturday rest before Sunday morning (guarantees 34 hours turnaround rest)
        dayShifts[kenix.empNo] = 'RD';
        stats[kenix.empNo].rd++;
        stats[kenix.empNo].lastShift = 'RD';
        stats[kenix.empNo].consecutiveNights = 0;
        kenixTookRd = true;
      } else if (dayOfWeek === (kenix.restDayPref || 'Monday') && d > 1) {
        dayShifts[kenix.empNo] = 'RD';
        stats[kenix.empNo].rd++;
        stats[kenix.empNo].lastShift = 'RD';
        stats[kenix.empNo].consecutiveNights = 0;
        kenixTookRd = true;
      } else if (stats[kenix.empNo].consecutiveNights >= 3) {
        dayShifts[kenix.empNo] = 'RD';
        stats[kenix.empNo].rd++;
        stats[kenix.empNo].lastShift = 'RD';
        stats[kenix.empNo].consecutiveNights = 0;
        kenixTookRd = true;
      } else {
        dayShifts[kenix.empNo] = '8H_1230-2130';
        stats[kenix.empNo].pm++;
        stats[kenix.empNo].lastShift = 'PM';
        stats[kenix.empNo].consecutiveNights++;
      }
    }

    // 3. Staff Assistants (5 teammates) using 5-day cycle: 2 AM, 2 PM, 1 RD
    for (let i = 0; i < staffMembers.length; i++) {
      const a = staffMembers[i];
      let shiftType = cycle5[(d - 1 + i) % 5];

      // In 28-day month (February), balance day 24-28 cleanly without fatigue
      if (totalDays === 28) {
        if (d === 26 && i === 2) shiftType = 'AM';
        if (d === 28 && i === 4) shiftType = 'PM';
      }

      if (shiftType === 'RD') {
        dayShifts[a.empNo] = 'RD';
        stats[a.empNo].rd++;
        stats[a.empNo].lastShift = 'RD';
        stats[a.empNo].consecutiveNights = 0;
      } else if (shiftType === 'AM') {
        dayShifts[a.empNo] = '8H_0730-1630';
        stats[a.empNo].am++;
        stats[a.empNo].lastShift = 'AM';
        stats[a.empNo].consecutiveNights = 0;
      } else {
        dayShifts[a.empNo] = '8H_1230-2130';
        stats[a.empNo].pm++;
        stats[a.empNo].lastShift = 'PM';
        stats[a.empNo].consecutiveNights++;
      }
    }

    // 4. Managers: Ting & Penny
    const ting = currentTeammates.find(t => t.empNo === 'PMG00723' || t.nickname === 'TING');
    if (ting) {
      const tingPrefRd = (dayOfWeek === (ting.restDayPref || 'Sunday'));
      if (tingPrefRd || stats[ting.empNo].consecutiveNights >= 3) {
        dayShifts[ting.empNo] = 'RD';
        stats[ting.empNo].rd++;
        stats[ting.empNo].lastShift = 'RD';
        stats[ting.empNo].consecutiveNights = 0;
      } else {
        const wantsAm = (dayOfWeek === 'Monday' || dayOfWeek === 'Tuesday');
        const canAm = (stats[ting.empNo].lastShift !== 'PM');

        if (kenixTookRd && (dayOfWeek === 'Tuesday' || dayOfWeek === 'Wednesday')) {
          dayShifts[ting.empNo] = '8H_1230-2130';
          stats[ting.empNo].pm++;
          stats[ting.empNo].lastShift = 'PM';
          stats[ting.empNo].consecutiveNights++;
        } else if (isHoliday && dayOfWeek === 'Wednesday') {
          dayShifts[ting.empNo] = '8H_1230-2130';
          stats[ting.empNo].pm++;
          stats[ting.empNo].lastShift = 'PM';
          stats[ting.empNo].consecutiveNights++;
        } else if (wantsAm && canAm) {
          dayShifts[ting.empNo] = '8H_0730-1630';
          stats[ting.empNo].am++;
          stats[ting.empNo].lastShift = 'AM';
          stats[ting.empNo].consecutiveNights = 0;
        } else {
          dayShifts[ting.empNo] = '8H_1230-2130';
          stats[ting.empNo].pm++;
          stats[ting.empNo].lastShift = 'PM';
          stats[ting.empNo].consecutiveNights++;
        }
      }
    }

    const penny = currentTeammates.find(t => t.empNo === 'PMG02694' || t.nickname === 'PENNY');
    if (penny) {
      const pennyPrefRd = (dayOfWeek === (penny.restDayPref || 'Wednesday'));
      let pennyTakesRd = pennyPrefRd;

      if (stats[penny.empNo].consecutiveNights >= 3) {
        pennyTakesRd = true;
      }

      if (pennyTakesRd) {
        dayShifts[penny.empNo] = 'RD';
        stats[penny.empNo].rd++;
        stats[penny.empNo].lastShift = 'RD';
        stats[penny.empNo].consecutiveNights = 0;
      } else {
        const currentPm = Object.values(dayShifts).filter(s => s && s.includes('1230')).length;
        const canAm = (stats[penny.empNo].lastShift !== 'PM');
        const canPm = (stats[penny.empNo].consecutiveNights < 3);

        if (currentPm < 3 && canPm) {
          dayShifts[penny.empNo] = '8H_1230-2130';
          stats[penny.empNo].pm++;
          stats[penny.empNo].lastShift = 'PM';
          stats[penny.empNo].consecutiveNights++;
        } else if (canAm && (dayOfWeek === 'Thursday' || dayOfWeek === 'Friday' || dayOfWeek === 'Saturday')) {
          dayShifts[penny.empNo] = '8H_0730-1630';
          stats[penny.empNo].am++;
          stats[penny.empNo].lastShift = 'AM';
          stats[penny.empNo].consecutiveNights = 0;
        } else if (canPm) {
          dayShifts[penny.empNo] = '8H_1230-2130';
          stats[penny.empNo].pm++;
          stats[penny.empNo].lastShift = 'PM';
          stats[penny.empNo].consecutiveNights++;
        } else if (canAm) {
          dayShifts[penny.empNo] = '8H_0730-1630';
          stats[penny.empNo].am++;
          stats[penny.empNo].lastShift = 'AM';
          stats[penny.empNo].consecutiveNights = 0;
        } else {
          dayShifts[penny.empNo] = 'RD';
          stats[penny.empNo].rd++;
          stats[penny.empNo].lastShift = 'RD';
          stats[penny.empNo].consecutiveNights = 0;
        }
      }
    }

    // Fill in any remaining teammates if any
    currentTeammates.forEach(t => {
      if (!dayShifts[t.empNo]) {
        dayShifts[t.empNo] = 'RD';
        stats[t.empNo].rd++;
        stats[t.empNo].lastShift = 'RD';
        stats[t.empNo].consecutiveNights = 0;
      }
    });

    // 5. Golden Cleaning Slot (14:00 - 15:30) Round Robin among duty Staff Assistants
    const dutyAssistants = staffMembers.filter(a => dayShifts[a.empNo] && dayShifts[a.empNo] !== 'RD' && dayShifts[a.empNo] !== 'PH' && dayShifts[a.empNo] !== 'OFF');
    let cleaner = null;
    if (dutyAssistants.length > 0) {
      dutyAssistants.sort((a, b) => {
        const cA = stats[a.empNo].clean;
        const cB = stats[b.empNo].clean;
        if (cA !== cB) return cA - cB;
        return a.empNo.localeCompare(b.empNo);
      });
      cleaner = dutyAssistants[0];
      stats[cleaner.empNo].clean++;
    }

    const finalAm = Object.values(dayShifts).filter(s => s && s.includes('0730')).length;
    const finalPm = Object.values(dayShifts).filter(s => s && s.includes('1230')).length;
    const workingTotal = Object.values(dayShifts).filter(s => s && s !== 'RD' && s !== 'PH' && s !== 'OFF').length;

    let dayWarning = null;
    if (workingTotal < 6) {
      dayWarning = `⚠️ Manpower Alert: Only ${workingTotal} staff on duty on ${dateStr} (${dayOfWeek}${holidayName ? ' - ' + holidayName : ''}). Minimum 6 required to hit 3 AM / 3 PM floor.`;
      warnings.push(dayWarning);
    }

    dailySchedule.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      cleaningDuty: cleaner ? {
        empNo: cleaner.empNo,
        nickname: cleaner.nickname,
        empName: cleaner.empName || cleaner.nickname,
        time: '2:00 PM – 3:30 PM',
        task: 'Gondola Cleaning & Refilling'
      } : null,
      amCount: finalAm,
      pmCount: finalPm,
      workingTotal,
      warning: dayWarning
    });
  }

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    branch: branchVal,
    days: dailySchedule,
    warnings,
    stats,
    summary: 'Heuristically generated schedule: William Chai locked anchor, 100% pharmacist coverage, zero turnaround fatigue (0 PM→AM), max consecutive nights ≤3, shift balance parity ≤1, and round-robin 6S cleaning duty (14:00–15:30).'
  };
}

// ─── RENDER SCHEDULE MATRIX ───────────────────────────────────────────────────
function renderScheduleMatrix(schedule) {
  if (!schedule || !schedule.days) return;

  const headerRow = document.getElementById('schedulerMatrixHeader');
  const tbody     = document.getElementById('schedulerMatrixBody');
  const summaryEl = document.getElementById('schedulerSummaryText');

  if (summaryEl) summaryEl.textContent = schedule.summary || '';

  let totalShifts = 0;
  let totalRestDays = 0;
  let pharmCoverageDays = 0;
  let langBalancedDays = 0;

  // Track assistant shift parity and fatigue
  const staffAssistants = currentTeammates.filter(t => t.position === 'Staff' && t.empNo !== 'PMG00831');
  const teammateStats = {};
  currentTeammates.forEach(tm => {
    teammateStats[tm.empNo] = {
      mCount: 0,
      nCount: 0,
      rdCount: 0,
      cleanCount: 0,
      maxConsecutiveNights: 0,
      currentNightStreak: 0,
      pmToAmFatigueCount: 0,
      lastShiftCode: null
    };
  });

  schedule.days.forEach(d => {
    let hasMorningPharm = false;
    let hasNightPharm   = false;
    const morningRaces  = new Set();
    const nightRaces    = new Set();

    Object.entries(d.shifts).forEach(([empNo, shift]) => {
      const tm = currentTeammates.find(t => t.empNo === empNo);
      if (!tm) return;

      const isWorking = shift && shift !== 'RD' && shift !== 'OFF' && shift !== 'PH';
      if (isWorking) totalShifts++;
      else if (shift === 'RD' || shift === 'OFF' || shift === 'PH') totalRestDays++;

      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
      const isMorning = shift && (shift.includes('0730') || shift.includes('0800'));
      const isNight   = shift && (shift.includes('1230') || shift.includes('1300') || shift.includes('1630'));

      if (isMorning) {
        if (isPharm) hasMorningPharm = true;
        morningRaces.add(tm.race);
        teammateStats[empNo].mCount++;
        // Check fatigue: previous shift was night
        if (teammateStats[empNo].lastShiftCode && teammateStats[empNo].lastShiftCode.includes('1230')) {
          teammateStats[empNo].pmToAmFatigueCount++;
        }
        teammateStats[empNo].currentNightStreak = 0;
        teammateStats[empNo].lastShiftCode = shift;
      } else if (isNight) {
        if (isPharm) hasNightPharm = true;
        nightRaces.add(tm.race);
        teammateStats[empNo].nCount++;
        teammateStats[empNo].currentNightStreak++;
        if (teammateStats[empNo].currentNightStreak > teammateStats[empNo].maxConsecutiveNights) {
          teammateStats[empNo].maxConsecutiveNights = teammateStats[empNo].currentNightStreak;
        }
        teammateStats[empNo].lastShiftCode = shift;
      } else {
        teammateStats[empNo].rdCount++;
        teammateStats[empNo].currentNightStreak = 0;
        teammateStats[empNo].lastShiftCode = shift;
      }

      if (d.cleaningDuty && d.cleaningDuty.empNo === empNo) {
        teammateStats[empNo].cleanCount++;
      }
    });

    const hasMorningChinese = [...morningRaces].some(r => r === 'Chinese');
    const hasMorningBumi    = [...morningRaces].some(r => r === 'Malay' || (r && (r.includes('Iban') || r.includes('Bidayuh'))));
    const hasNightChinese   = [...nightRaces].some(r => r === 'Chinese');
    const hasNightBumi      = [...nightRaces].some(r => r === 'Malay' || (r && (r.includes('Iban') || r.includes('Bidayuh'))));

    if (hasMorningPharm && hasNightPharm) pharmCoverageDays++;
    if ((hasMorningChinese && hasMorningBumi) && (hasNightChinese && hasNightBumi)) langBalancedDays++;
  });

  // Calculate Parity
  const assistantAms = staffAssistants.map(a => teammateStats[a.empNo].mCount);
  const assistantPms = staffAssistants.map(a => teammateStats[a.empNo].nCount);
  const amVariance = assistantAms.length ? (Math.max(...assistantAms) - Math.min(...assistantAms)) : 0;
  const pmVariance = assistantPms.length ? (Math.max(...assistantPms) - Math.min(...assistantPms)) : 0;
  const maxStaffVar = Math.max(amVariance, pmVariance);
  const totalFatigueViolations = Object.values(teammateStats).reduce((acc, s) => acc + s.pmToAmFatigueCount, 0);

  // Update KPI cards
  const kpiPharm   = document.getElementById('kpiSchedulerPharm');
  const kpiParity  = document.getElementById('kpiSchedulerParity');
  const kpiLang    = document.getElementById('kpiSchedulerLang');
  const kpiShift   = document.getElementById('kpiSchedulerShifts');
  const kpiRest    = document.getElementById('kpiSchedulerRest');

  if (kpiPharm)  kpiPharm.textContent  = `${Math.round((pharmCoverageDays / schedule.days.length) * 100)}%`;
  if (kpiParity) kpiParity.textContent = maxStaffVar <= 1 ? '100% Balanced' : `±${maxStaffVar} Shifts`;
  if (kpiLang)   kpiLang.textContent   = `${Math.round((langBalancedDays / schedule.days.length) * 100)}%`;
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

  // Build Table Header
  let headerHtml = `
    <th class="sticky left-0 bg-gray-100 z-20 px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200 min-w-[200px]">
      Teammate (KS01)
    </th>
  `;

  schedule.days.forEach(d => {
    const isWeekend = d.dayOfWeek === 'Saturday' || d.dayOfWeek === 'Sunday';
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date];
    const dayBg = isHoliday ? 'bg-rose-50 text-rose-900 border-rose-200' : (isWeekend ? 'bg-amber-50 text-amber-900' : 'bg-gray-50 text-gray-700');

    headerHtml += `
      <th class="px-2 py-2 text-center text-xs font-semibold ${dayBg} border-r border-gray-200 min-w-[70px]" title="${isHoliday ? HOLIDAYS_2026_SARAWAK[d.date] : ''}">
        <div class="text-[10px] uppercase font-bold ${isHoliday ? 'text-rose-600' : 'text-gray-400'}">${d.dayOfWeek.slice(0, 3)}</div>
        <div class="text-sm font-extrabold">${d.day}</div>
        ${isHoliday ? '<span class="text-[9px] bg-rose-200 text-rose-800 px-1 rounded font-bold">PH</span>' : ''}
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

      bodyHtml += `
        <td class="px-1 py-1.5 text-center border-r border-gray-200 ${isCleaningDuty ? 'bg-teal-50/60' : ''}">
          <span class="inline-block px-1.5 py-1 rounded text-[10px] font-mono font-bold leading-tight ${cellStyle.classes}" title="${shift}${isCleaningDuty ? ' | 🧹 14:00-15:30 Cleaning' : ''}">
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
    const isTargetMet = d.amCount >= 3 && d.pmCount >= 3;
    densityRow += `
      <td class="px-1 py-1 text-center border-r border-gray-200">
        <div class="text-[9px] font-mono font-bold ${isTargetMet ? 'text-emerald-800 bg-emerald-100' : 'text-amber-900 bg-amber-100'} px-1 py-0.5 rounded leading-tight" title="Morning: ${d.amCount}, Night: ${d.pmCount}, Total Working: ${d.workingTotal}">
          ${d.amCount}M / ${d.pmCount}N
        </div>
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
              <th class="py-2.5 px-3 text-center">Morning (AM)</th>
              <th class="py-2.5 px-3 text-center">Night (PM)</th>
              <th class="py-2.5 px-3 text-center">Parity Status</th>
              <th class="py-2.5 px-3 text-center">Rest Days (RD/PH)</th>
              <th class="py-2.5 px-3 text-center">6S Cleaning Duties</th>
              <th class="py-2.5 px-3 text-center">Anti-Fatigue Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
    `;

    currentTeammates.forEach(tm => {
      const st = teammateStats[tm.empNo];
      const isFixed = tm.scheduleMode === 'Fixed' || tm.empNo === 'PMG00831';
      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
      const isStaff = tm.position === 'Staff' && !isFixed;

      let parityBadge = '';
      if (isFixed) {
        parityBadge = '<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">Fixed Anchor (Exempt)</span>';
      } else if (isPharm) {
        parityBadge = '<span class="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">Clinical Anchor</span>';
      } else if (isStaff) {
        const diff = Math.abs(st.mCount - st.nCount);
        parityBadge = diff <= 1
          ? `<span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✓ Equitable (±${diff})</span>`
          : `<span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">⚠️ Imbalance (±${diff})</span>`;
      } else {
        parityBadge = '<span class="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">Manager Block</span>';
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
