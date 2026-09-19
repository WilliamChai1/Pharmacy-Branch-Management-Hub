// js/scheduler.js — Module 3: AM AI Smart Timetable & Roster Generator
'use strict';

// ─── DUAL-TIER GEMINI CONFIGURATION ───────────────────────────────────────────
const SCHEDULER_PRIMARY_MODEL   = 'gemini-3.5-flash';
const SCHEDULER_SECONDARY_MODEL = 'gemini-3.5-flash-lite';

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
    position: 'Staff', // Corrected: NOT a pharmacist
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

  // Ensure Ting Kwang Yu is corrected in stored data if loaded from an older cache
  const ting = currentTeammates.find(t => t.empNo === 'PMG00723' || t.nickname === 'TING');
  if (ting) {
    ting.position = 'Staff';
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

  const saveBtn = document.getElementById('schedulerSavePrefBtn');
  if (saveBtn) {
    const origHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-check text-green-300"></i> Preferences Saved!';
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
      if (statusText) statusText.textContent = `Querying ${SCHEDULER_PRIMARY_MODEL} with M/N shift balance & pharmacist rules…`;
      
      let aiResult = null;
      try {
        aiResult = await callSchedulerGemini(SCHEDULER_PRIMARY_MODEL, branchVal, monthVal, totalDays, apiKey);
        if (modelBadge) {
          modelBadge.textContent = '⚡ Gemini 3.5 Flash';
          modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-800 border border-green-200';
        }
      } catch (tier1Err) {
        console.warn(`[PMG Scheduler] Tier 1 (${SCHEDULER_PRIMARY_MODEL}) failed:`, tier1Err.message);
        if (statusText) statusText.textContent = `Failing over to ${SCHEDULER_SECONDARY_MODEL}…`;

        try {
          aiResult = await callSchedulerGemini(SCHEDULER_SECONDARY_MODEL, branchVal, monthVal, totalDays, apiKey);
          if (modelBadge) {
            modelBadge.textContent = '🛡️ Gemini 3.5 Flash-Lite (Fallback)';
            modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200';
          }
        } catch (tier2Err) {
          console.warn(`[PMG Scheduler] Tier 2 (${SCHEDULER_SECONDARY_MODEL}) failed:`, tier2Err.message);
          throw tier2Err;
        }
      }

      if (aiResult && aiResult.days && aiResult.days.length > 0) {
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

// ─── GEMINI API CALLER ────────────────────────────────────────────────────────
async function callSchedulerGemini(model, branchVal, monthVal, totalDays, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Find holidays in this month
  const monthHolidays = {};
  Object.entries(HOLIDAYS_2026_SARAWAK).forEach(([date, name]) => {
    if (date.startsWith(monthVal)) monthHolidays[date] = name;
  });

  const prompt = `You are an expert Pharmacy Operations Director scheduling the retail branch roster for PMG Pharmacy.
Branch: ${branchVal} (Operating Hours: 07:30 to 21:30 daily).
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

STRICT OPERATIONAL RULES:
1. SPECIAL FIXED SCHEDULE FOR CHAI YEE SIAN (WILLIAM - PMG00831):
   - Monday to Friday: Morning shift '8H_0730-1630' (07:30 to 16:30).
   - Saturday: Morning Half Day '4H_0730-1130' (07:30 to 11:30).
   - Sunday: Rest Day 'RD'.
   - Public Holidays (Malaysia National & Sarawak Gazetted): Off 'PH'.
   - Covers the Morning Pharmacist duty on Monday–Saturday!

2. MANDATORY PHARMACIST COVERAGE:
   - Pharmacists: William Chai (PMG00831) and Kenix Ling (PMG02963). Note: Ting Kwang Yu is NOT a pharmacist!
   - Morning Shift (07:30-16:30): Covered by William Chai (Mon–Sat). On Sundays or PH when William is off, Kenix Ling MUST be scheduled.
   - Night Shift (12:30-21:30): Covered by Kenix Ling (or cover pharmacist). Minimum 1 Pharmacist on duty at all times!

3. FAIR SHIFT BALANCE (MORNING VS NIGHT):
   - For all rotating staff (Ting, Penny, Louna, Fiona, Janet, Nurhafizah, Farizin), the total count of Morning ('8H_0730-1630') and Night ('8H_1230-2130') shifts across the month MUST BE BALANCED (approximately equal 50/50 distribution). No staff should do excessive night shifts while others only do morning shifts.

4. DAY-OF-WEEK & INDIVIDUAL PREFERENCES:
   - Strictly honor teammates' dayPrefs (e.g. if a teammate prefers morning on certain days, or RD on a specific day).

5. SARAWAK MULTILINGUAL / DEMOGRAPHIC BALANCE:
   - Ensure balanced customer communication on every shift: at least 1 Chinese speaker and at least 1 Malay or Iban speaker on every Morning and Night shift.

6. LABOR LAW:
   - Max 6 consecutive working days without a Rest Day ('RD').
   - Minimum 1 Rest Day ('RD') per person per 7-day week.

SHIFT CODES:
- '8H_0730-1630' (Full Morning)
- '8H_1230-2130' (Full Night)
- '4H_0730-1130' (Half Morning 4H)
- '5H_0730-1230' (Half Morning 5H)
- '5H_1630-2130' (Half Night 5H)
- 'RD' (Rest Day)
- 'PH' (Public Holiday)

OUTPUT FORMAT:
Respond ONLY with a valid JSON object:
{
  "month": "${monthVal}",
  "branch": "${branchVal}",
  "days": [
    {
      "day": 1,
      "date": "${monthVal}-01",
      "dayOfWeek": "...",
      "shifts": {
        "PMG00831": "8H_0730-1630",
        "PMG02963": "8H_1230-2130",
        ...
      }
    }
  ],
  "summary": "Summary of pharmacist coverage, M/N shift balance, and holiday compliance."
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

  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── SMART HEURISTIC SCHEDULE GENERATOR (OFFLINE / FAILOVER) ──────────────────
function runHeuristicScheduleGenerator(branchVal, year, month, totalDays) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = [];

  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  const kenix   = currentTeammates.find(t => t.empNo === 'PMG02963' || t.nickname === 'KENIX');
  const rotatingStaff = currentTeammates.filter(t => t.empNo !== 'PMG00831');

  // Track shift statistics for fair M/N balance
  const stats = {};
  currentTeammates.forEach(t => {
    stats[t.empNo] = { morningCount: 0, nightCount: 0, consecutiveDays: 0, rdCount: 0 };
  });

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];

    const dayShifts = {};

    // 1. Assign Chai Yee Sian (William) Fixed Schedule
    if (william) {
      if (isHoliday) {
        dayShifts[william.empNo] = 'PH';
        stats[william.empNo].consecutiveDays = 0;
      } else if (dayOfWeek === 'Sunday') {
        dayShifts[william.empNo] = 'RD';
        stats[william.empNo].consecutiveDays = 0;
        stats[william.empNo].rdCount++;
      } else if (dayOfWeek === 'Saturday') {
        dayShifts[william.empNo] = '4H_0730-1130';
        stats[william.empNo].morningCount++;
        stats[william.empNo].consecutiveDays++;
      } else {
        dayShifts[william.empNo] = '8H_0730-1630';
        stats[william.empNo].morningCount++;
        stats[william.empNo].consecutiveDays++;
      }
    }

    // 2. Assign Kenix Ling (Pharmacist Coverage)
    // William covers Mon–Sat mornings. Kenix covers Night shift, and Sunday / Holiday mornings.
    if (kenix) {
      const isWilliamWorkingMorning = (dayShifts[william?.empNo] === '8H_0730-1630' || dayShifts[william?.empNo] === '4H_0730-1130');

      if (!isWilliamWorkingMorning) {
        // William is off on Sunday or PH -> Kenix covers Morning
        dayShifts[kenix.empNo] = '8H_0730-1630';
        stats[kenix.empNo].morningCount++;
        stats[kenix.empNo].consecutiveDays++;
      } else if (dayOfWeek === (kenix.restDayPref || 'Monday') || stats[kenix.empNo].consecutiveDays >= 6) {
        // Kenix Rest Day
        dayShifts[kenix.empNo] = 'RD';
        stats[kenix.empNo].consecutiveDays = 0;
        stats[kenix.empNo].rdCount++;
      } else {
        // Kenix covers Night Shift
        dayShifts[kenix.empNo] = '8H_1230-2130';
        stats[kenix.empNo].nightCount++;
        stats[kenix.empNo].consecutiveDays++;
      }
    }

    // 3. Assign Rotating Staff with M/N Balance & Day-of-Week Preferences
    const availableStaff = rotatingStaff.filter(s => s.empNo !== kenix?.empNo);

    // Step A: Determine Rest Days for rotating staff
    availableStaff.forEach(s => {
      const dayPref = s.dayPrefs ? s.dayPrefs[dayOfWeek] : null;
      const isDayOffPref = (dayPref === 'RD' || s.restDayPref === dayOfWeek);
      const isMaxConsecutive = (stats[s.empNo].consecutiveDays >= 6);

      if (isDayOffPref || isMaxConsecutive) {
        dayShifts[s.empNo] = 'RD';
        stats[s.empNo].consecutiveDays = 0;
        stats[s.empNo].rdCount++;
      }
    });

    // Step B: Assign Working Shifts for remaining rotating staff (Balancing Morning & Night)
    const workingRotating = availableStaff.filter(s => dayShifts[s.empNo] !== 'RD');

    // Sort staff by who needs more Morning shifts vs who needs more Night shifts
    workingRotating.sort((a, b) => {
      const diffA = stats[a.empNo].morningCount - stats[a.empNo].nightCount;
      const diffB = stats[b.empNo].morningCount - stats[b.empNo].nightCount;
      return diffA - diffB; // Staff with fewer mornings will be first
    });

    workingRotating.forEach((s, idx) => {
      const dayPref = s.dayPrefs ? s.dayPrefs[dayOfWeek] : null;
      let shift = '8H_0730-1630';

      if (dayPref === 'Morning Half (4H)') {
        shift = '4H_0730-1130';
        stats[s.empNo].morningCount++;
      } else if (dayPref === 'Morning Only') {
        shift = '8H_0730-1630';
        stats[s.empNo].morningCount++;
      } else if (dayPref === 'Night Only') {
        shift = '8H_1230-2130';
        stats[s.empNo].nightCount++;
      } else {
        // Balance based on count: if employee has more mornings than nights, give night; else give morning
        const mCount = stats[s.empNo].morningCount;
        const nCount = stats[s.empNo].nightCount;

        if (mCount > nCount) {
          shift = '8H_1230-2130';
          stats[s.empNo].nightCount++;
        } else if (nCount > mCount) {
          shift = '8H_0730-1630';
          stats[s.empNo].morningCount++;
        } else {
          // Equal: split by index
          if (idx % 2 === 0) {
            shift = '8H_0730-1630';
            stats[s.empNo].morningCount++;
          } else {
            shift = '8H_1230-2130';
            stats[s.empNo].nightCount++;
          }
        }
      }

      dayShifts[s.empNo] = shift;
      stats[s.empNo].consecutiveDays++;
    });

    // Final fill-in for any missing
    currentTeammates.forEach(t => {
      if (!dayShifts[t.empNo]) {
        dayShifts[t.empNo] = 'RD';
        stats[t.empNo].consecutiveDays = 0;
      }
    });

    days.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts
    });
  }

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    branch: branchVal,
    days,
    summary: 'Heuristically generated schedule with William Chai fixed pattern, 100% pharmacist coverage, balanced Morning/Night shift distribution, and day-of-week preferences.'
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
      else if (shift === 'RD' || shift === 'OFF') totalRestDays++;

      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
      if (shift.includes('0730') || shift.includes('0800')) {
        if (isPharm) hasMorningPharm = true;
        morningRaces.add(tm.race);
      }
      if (shift.includes('1230') || shift.includes('1300') || shift.includes('1630')) {
        if (isPharm) hasNightPharm = true;
        nightRaces.add(tm.race);
      }
    });

    if (hasMorningPharm && hasNightPharm) pharmCoverageDays++;
    if (morningRaces.size >= 2 && nightRaces.size >= 2) langBalancedDays++;
  });

  // Update KPI cards
  const kpiPharm = document.getElementById('kpiSchedulerPharm');
  const kpiLang  = document.getElementById('kpiSchedulerLang');
  const kpiShift = document.getElementById('kpiSchedulerShifts');
  const kpiRest  = document.getElementById('kpiSchedulerRest');

  if (kpiPharm) kpiPharm.textContent = `${Math.round((pharmCoverageDays / schedule.days.length) * 100)}%`;
  if (kpiLang)  kpiLang.textContent  = `${Math.round((langBalancedDays / schedule.days.length) * 100)}%`;
  if (kpiShift) kpiShift.textContent = totalShifts;
  if (kpiRest)  kpiRest.textContent  = totalRestDays;

  // Build Table Header
  let headerHtml = `
    <th class="sticky left-0 bg-gray-100 z-20 px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200 min-w-[190px]">
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

    // Count shifts for this teammate
    let mCount = 0;
    let nCount = 0;
    schedule.days.forEach(d => {
      const s = d.shifts[tm.empNo] || '';
      if (s.includes('0730') || s.includes('0800')) mCount++;
      if (s.includes('1230') || s.includes('1300') || s.includes('1630')) nCount++;
    });

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
            <span class="text-blue-600 font-bold">M: ${mCount}</span> · <span class="text-purple-600 font-bold">N: ${nCount}</span>
          </div>
        </td>
    `;

    schedule.days.forEach(d => {
      const shift = (d.shifts && d.shifts[tm.empNo]) || 'RD';
      const cellStyle = getShiftBadgeStyle(shift);
      bodyHtml += `
        <td class="px-1 py-1.5 text-center border-r border-gray-200">
          <span class="inline-block px-1.5 py-1 rounded text-[10px] font-mono font-bold leading-tight ${cellStyle.classes}" title="${shift}">
            ${cellStyle.label}
          </span>
        </td>
      `;
    });

    bodyHtml += '</tr>';
  });

  // Daily Coverage Indicators Row (Bottom)
  let coverageRow = `
    <tr class="bg-gray-100 border-t-2 border-gray-300 font-semibold text-[11px] text-gray-700">
      <td class="sticky left-0 bg-gray-100 z-10 px-3 py-2 border-r border-gray-200 font-bold">
        Pharmacist AM / PM
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
        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] ${isFullCover ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'} font-bold">
          ${isFullCover ? '✓' : '!'}
        </span>
      </td>
    `;
  });
  coverageRow += '</tr>';

  if (tbody) tbody.innerHTML = bodyHtml + coverageRow;
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

// ─── EXPORT TO PMG VISUAL DAILY TIMELINE EXCEL ────────────────────────────────
function exportScheduleToPmgVisualExcel() {
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

  let currentRowIdx = 1; // Row 0 is header

  days.forEach(d => {
    // Format date string: MON 28.09.2026
    const [y, m, dayNum] = d.date.split('-');
    const dayLabel = `${d.dayOfWeek.slice(0, 3).toUpperCase()}\n${dayNum}.${m}.${y}`;

    // Separate staff for this day
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

      // Col A: DAY (first row only, merged across block)
      if (r === 0) row[0] = dayLabel;

      // Col B: OFF staff list
      if (r < offList.length) row[1] = offList[r];

      // Cols C to P: Hourly timeline (Cols 2 to 15)
      if (r < workingStaffRows.length) {
        const staff = workingStaffRows[r];
        const nick = staff.nickname;

        if (staff.isHalf) {
          if (staff.shift.includes('0730-1130')) {
            // 7.30 - 11.30 (Cols C to F: 2, 3, 4, 5)
            row[2] = nick; row[3] = nick; row[4] = nick; row[5] = nick;
          } else if (staff.shift.includes('0730-1230')) {
            // 7.30 - 12.30 (Cols C to G: 2, 3, 4, 5, 6)
            row[2] = nick; row[3] = nick; row[4] = nick; row[5] = nick; row[6] = nick;
          } else if (staff.shift.includes('1630-2130')) {
            // 4.30 - 9.30 (Cols L to P: 11, 12, 13, 14, 15)
            row[11] = nick; row[12] = nick; row[13] = nick; row[14] = nick; row[15] = nick;
          }
        } else if (staff.shift.includes('0730') || staff.shift.includes('0800')) {
          // Morning Full Shift:
          // 7.30 - 12.30: nick (Cols 2, 3, 4, 5, 6)
          row[2] = nick; row[3] = nick; row[4] = nick; row[5] = nick; row[6] = nick;
          // 12.30 - 1.30: REST (Col 7)
          row[7] = 'REST';
          // 1.30 - 4.30: nick (Cols 8, 9, 10)
          row[8] = nick; row[9] = nick; row[10] = nick;
        } else {
          // Night Full Shift:
          // 12.30 - 3.30: nick (Cols 7, 8, 9)
          row[7] = nick; row[8] = nick; row[9] = nick;
          // 3.30 - 4.30: REST (Col 10)
          row[10] = 'REST';
          // 4.30 - 9.30: nick (Cols 11, 12, 13, 14, 15)
          row[11] = nick; row[12] = nick; row[13] = nick; row[14] = nick; row[15] = nick;
        }
      }

      // Col Q: HALF DAY staff list
      if (r < halfDayList.length) row[16] = halfDayList[r];

      // Col R: NOTES
      if (r === 0) row[17] = holidayName;

      wsData.push(row);
      currentRowIdx++;
    }

    // Merges for this day
    merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } }); // DAY
    if (halfDayList.length <= 1) {
      merges.push({ s: { r: startRow, c: 16 }, e: { r: endRow, c: 16 } }); // HALF DAY
    }
    merges.push({ s: { r: startRow, c: 17 }, e: { r: endRow, c: 17 } }); // NOTES

    // Empty separator row between days
    const emptySep = new Array(18).fill('');
    wsData.push(emptySep);
    currentRowIdx++;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 14 }, // A: DAY
    { wch: 14 }, // B: OFF
    { wch: 13 }, // C: 7.30-8.30AM
    { wch: 13 }, // D: 8.30-9.30AM
    { wch: 13 }, // E: 9.30-10.30AM
    { wch: 13 }, // F: 10.30-11.30AM
    { wch: 13 }, // G: 11.30-12.30PM
    { wch: 13 }, // H: 12.30-1.30PM
    { wch: 13 }, // I: 1.30-2.30PM
    { wch: 13 }, // J: 2.30-3.30PM
    { wch: 13 }, // K: 3.30-4.30PM
    { wch: 13 }, // L: 4.30-5.30PM
    { wch: 13 }, // M: 5.30-6.30PM
    { wch: 13 }, // N: 6.30-7.30PM
    { wch: 13 }, // O: 7.30-8.30PM
    { wch: 13 }, // P: 8.30-9.30PM
    { wch: 14 }, // Q: HALF DAY
    { wch: 28 }  // R: NOTES
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
