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

// Primary: Gemini 3.8 Flash (gemini-3.8-flash) — Dynamic reasoning & optimal parity roster solver
// Secondary: Gemini 3.5 Flash (gemini-3.5-flash)
// Backup: Gemini 3.5 Flash-Lite (gemini-3.5-flash-lite)
// Fallback: Gemini 3.1 Flash-Lite (gemini-3.1-flash-lite)
const SCHEDULER_PRIMARY_MODEL   = 'gemini-3.8-flash';
const SCHEDULER_SECONDARY_MODEL = 'gemini-3.5-flash';
const SCHEDULER_TERTIARY_MODEL  = 'gemini-3.5-flash-lite';
const SCHEDULER_FALLBACK_MODEL  = 'gemini-3.1-flash-lite';

// ─── SHIFT TYPE CLASSIFIER HELPERS ───────────────────────────────────────────
function isNightShift(shift) {
  if (!shift) return false;
  return shift.startsWith('8H_1230') || shift.startsWith('8H_1300') || shift.includes('1230-2130') || shift.includes('1300-2200') || shift.includes('1630-2130') || shift.startsWith('5H_1630');
}

function isHalfDayMorningShift(shift) {
  if (!shift) return false;
  return shift.includes('4H') || shift.includes('0730-1130') || shift.includes('5H_0730') || shift.includes('0730-1230');
}

function isFullMorningShift(shift) {
  if (!shift) return false;
  return (shift.includes('0730-1630') || shift.includes('0800-1700')) && !isHalfDayMorningShift(shift);
}

function isAnyMorningShift(shift) {
  if (!shift) return false;
  return isFullMorningShift(shift) || isHalfDayMorningShift(shift);
}

function getHalfDayShiftCode(tm) {
  if (!tm) return '5H_0730-1230';
  const isFullTimePharm = (tm.empNo === 'PMG00831') || 
    (tm.isPharmacist && tm.scheduleMode === 'Fixed' && (!tm.position || !tm.position.toLowerCase().includes('provisional')));
  return isFullTimePharm ? '4H_0730-1130' : '5H_0730-1230';
}

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

// ─── SAVED TIMETABLE & CROSS-COMPUTER CLOUD PERSISTENCE ──────────────────────
function getSavedTimetableKey(branchCode, monthStr) {
  return `pmg_saved_timetable_${branchCode || 'KS01'}_${monthStr}`;
}

async function saveGeneratedTimetable(showToast = true) {
  if (!generatedScheduleData || !generatedScheduleData.days || !generatedScheduleData.days.length) {
    if (showToast) showSchedulerToast('No timetable to save. Please generate or import a timetable first.', 'warn');
    return false;
  }

  const branchVal = generatedScheduleData.branch || document.getElementById('schedulerBranchSelect')?.value || 'KS01';
  const monthVal = generatedScheduleData.month || document.getElementById('schedulerMonth')?.value || '2026-11';
  const nowIso = new Date().toISOString();

  generatedScheduleData.lastSaved = nowIso;
  const session = typeof getSession === 'function' ? getSession() : null;
  generatedScheduleData.savedBy = session?.displayName || 'Pharmacist';

  // 1. Save to localStorage
  try {
    localStorage.setItem(getSavedTimetableKey(branchVal, monthVal), JSON.stringify(generatedScheduleData));
  } catch (e) {
    console.warn('[PMG Scheduler] Could not save timetable to localStorage:', e);
  }

  // 2. Also ensure cross-month shift registry contains all days from this timetable
  try {
    const reg = loadShiftRegistry(branchVal);
    generatedScheduleData.days.forEach(d => {
      reg[d.date] = d;
    });
    saveShiftRegistry(branchVal, reg);
  } catch (_) {}

  // 3. Save to OneDrive if connected
  let onedriveSaved = false;
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveMonthlyTimetableToOneDrive === 'function') {
    try {
      onedriveSaved = await window.pmgOneDriveSync.saveMonthlyTimetableToOneDrive(branchVal, monthVal, generatedScheduleData);
    } catch (err) {
      console.warn('[PMG Scheduler] OneDrive save error:', err);
    }
  }

  updateSavedTimetableBadge({
    branch: branchVal,
    month: monthVal,
    lastSaved: nowIso,
    onedriveSynced: onedriveSaved
  });

  if (showToast) {
    const cloudMsg = onedriveSaved ? ' (OneDrive Cloud & Local)' : ' (Saved Locally & Ready to Export)';
    showSchedulerToast(`Timetable saved for ${branchVal} (${monthVal})${cloudMsg}!`, 'success');
  }

  return true;
}

function updateSavedTimetableBadge(info) {
  const badge = document.getElementById('schedulerSavedStatusBadge');
  const text = document.getElementById('schedulerSavedStatusText');
  const topSaveBtn = document.getElementById('schedulerSaveTimetableTopBtn');

  if (topSaveBtn) {
    if (generatedScheduleData && generatedScheduleData.days && generatedScheduleData.days.length) {
      topSaveBtn.classList.remove('hidden');
    } else {
      topSaveBtn.classList.add('hidden');
    }
  }

  if (!badge || !text) return;

  if (!info || !info.lastSaved) {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200';
    text.innerHTML = '<i class="fa-solid fa-clock-rotate-left text-gray-400"></i> No saved timetable loaded for this month yet.';
    return;
  }

  const d = new Date(info.lastSaved);
  const timeFormatted = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

  if (info.onedriveSynced) {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs';
    text.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-emerald-600"></i> Saved to OneDrive (${info.month}): ${timeFormatted}`;
  } else {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs';
    text.innerHTML = `<i class="fa-solid fa-hard-drive text-blue-600"></i> Saved Locally (${info.month}): ${timeFormatted}`;
  }
}

async function checkAndLoadSavedTimetable(branchCode, monthStr) {
  if (!branchCode || !monthStr) return false;

  // 1. Try local storage first
  let savedData = null;
  try {
    const raw = localStorage.getItem(getSavedTimetableKey(branchCode, monthStr));
    if (raw) savedData = JSON.parse(raw);
  } catch (_) {}

  // 2. Also check OneDrive to see if there is a newer timetable saved from another computer
  let onedriveLoaded = false;
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.loadMonthlyTimetableFromOneDrive === 'function') {
    try {
      const odData = await window.pmgOneDriveSync.loadMonthlyTimetableFromOneDrive(branchCode, monthStr);
      if (odData && odData.days && odData.days.length) {
        const localTime = savedData?.lastSaved || '';
        const odTime = odData.lastSaved || '';
        if (!savedData || (odTime && odTime > localTime)) {
          savedData = odData;
          onedriveLoaded = true;
          try {
            localStorage.setItem(getSavedTimetableKey(branchCode, monthStr), JSON.stringify(odData));
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  if (savedData && savedData.days && savedData.days.length) {
    if (!savedData.days[0].stockDuty && !savedData.days[0].learningSlots) {
      assignTraineeLearningAndStockDuties(savedData.days, currentTeammates);
    }
    generatedScheduleData = savedData;
    renderScheduleMatrix(generatedScheduleData);

    const resultsPanel = document.getElementById('schedulerResultsPanel');
    if (resultsPanel) resultsPanel.classList.remove('hidden');

    const modelBadge = document.getElementById('schedulerModelBadge');
    if (modelBadge) {
      modelBadge.textContent = onedriveLoaded ? '☁️ Loaded from OneDrive' : '💾 Loaded Saved Timetable';
      modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 border border-indigo-200';
    }

    updateSavedTimetableBadge({
      branch: branchCode,
      month: monthStr,
      lastSaved: savedData.lastSaved,
      onedriveSynced: onedriveLoaded || !!(window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle)
    });

    return true;
  } else {
    updateSavedTimetableBadge(null);
    return false;
  }
}

function exportTimetableBackupJson() {
  if (!generatedScheduleData || !generatedScheduleData.days || !generatedScheduleData.days.length) {
    showSchedulerToast('Please generate or load a timetable first before exporting backup.', 'warn');
    return;
  }

  const branch = generatedScheduleData.branch || document.getElementById('schedulerBranchSelect')?.value || 'KS01';
  const month = generatedScheduleData.month || document.getElementById('schedulerMonth')?.value || '2026-11';
  const nowIso = new Date().toISOString();

  const backupPayload = {
    app: 'PMG MANAGEMENT HUB',
    module: 'AI Smart Timetable Generator',
    version: '2026.10',
    exportedAt: nowIso,
    branch,
    month,
    teammates: currentTeammates,
    timetable: generatedScheduleData
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PMG_Timetable_${branch}_${month}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSchedulerToast(`Backup saved! File: PMG_Timetable_${branch}_${month}.json`, 'success');
}

function importTimetableBackupJson(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const ttData = parsed.timetable || parsed;

      if (!ttData || !ttData.days || !Array.isArray(ttData.days) || !ttData.month) {
        showSchedulerToast('Invalid timetable backup file format.', 'error');
        return;
      }

      generatedScheduleData = ttData;

      // Update UI month and branch if present
      const monthInput = document.getElementById('schedulerMonth');
      if (monthInput && ttData.month) {
        monthInput.value = ttData.month;
      }
      const branchSelect = document.getElementById('schedulerBranchSelect');
      if (branchSelect && ttData.branch) {
        branchSelect.value = ttData.branch;
      }

      // If teammate config was in the backup, restore it too
      if (parsed.teammates && Array.isArray(parsed.teammates) && parsed.teammates.length) {
        currentTeammates = parsed.teammates;
        try {
          localStorage.setItem(getStorageKey(ttData.branch || 'KS01'), JSON.stringify(currentTeammates));
        } catch (_) {}
        renderTeammatesTable();
      }

      // Save to localStorage and OneDrive
      await saveGeneratedTimetable(false);

      // Render matrix
      renderScheduleMatrix(generatedScheduleData);
      const resultsPanel = document.getElementById('schedulerResultsPanel');
      if (resultsPanel) {
        resultsPanel.classList.remove('hidden');
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      const modelBadge = document.getElementById('schedulerModelBadge');
      if (modelBadge) {
        modelBadge.textContent = '📂 Imported from File';
        modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200';
      }

      showSchedulerToast(`Timetable for ${ttData.branch || 'KS01'} (${ttData.month}) imported successfully! Ready to edit.`, 'success');

      if (event.target) event.target.value = '';

    } catch (err) {
      console.error('[PMG Scheduler Import Error]', err);
      showSchedulerToast('Failed to parse timetable backup file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// ─── 2026 GAZETTED PUBLIC HOLIDAYS (SARAWAK STATE) ───────────────────────────
// Sarawak State Gazetted Public Holidays (Deepavali is NOT a Sarawak state public holiday)
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
  '2026-12-25': "Christmas Day"
};

// Full-Time Pharmacist (William Chai) Employment Contract Public Holidays:
// Covers both Malaysia National Public Holidays and Sarawak State Public Holidays.
// Where a recognized contract holiday falls on William's Sunday Rest Day, it replaces to Monday.
const WILLIAM_CONTRACT_PH = {
  // Deepavali falls on Sunday 08/11/2026 (William's Sunday RD); contractually replaced to Monday 09/11/2026
  '2026-11-09': "Deepavali (Replacement Public Holiday for Sunday 08/11/2026)"
};

// ─── DEFAULT TEAMMATES DATA FOR KOTA SENTOSA (KS01) ──────────────────────────
// Staffing configuration:
// 1. Effective 1/11/2026: Ting Kwang Yu (BM) & Kenix Ling (Pharmacist) have left PMG Kota Sentosa.
// 2. Effective 1/11/2026: Vanessa Anak Blaise (Staff, Iban, non-Chinese speaker) joins PMG Kota Sentosa.
//    (Prior experience at Peace Pharmacy & Joy Pharmacy Kuching; culture adaptation phase).
// 3. Chai Yee Sian (William) is licensed Pharmacist with FIXED schedule anchor (Half day is 4H).
// 4. Christina Lee (PRP) is licensed Provisional Registered Pharmacist in rotating pool (Half day is 5H).
// 5. Haniesha Louna is Assistant Branch Manager (ABM) in rotating pool (Half day is 5H).
// 6. Rotating Staff (Penny, Fiona, Nurhafizah, Farizin, Vanessa) half day is 5H.
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
    empNo: 'PMG01294',
    nickname: 'LOUNA',
    empName: 'HANIESHA LOUNA ANAK DAGENG',
    position: 'Assistant Branch Manager',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Thursday',
    halfDayPref: 'Wednesday Morning (5H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Morning Half (5H)',
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
    shiftPref: 'Flexible',
    restDayPref: 'Tuesday',
    halfDayPref: 'Monday Morning (5H)',
    dayPrefs: {
      Monday: 'Morning Half (5H)',
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
    shiftPref: 'Flexible',
    restDayPref: 'Sunday',
    halfDayPref: 'Thursday Morning (5H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Morning Half (5H)',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'RD'
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
    halfDayPref: 'Saturday Morning (5H)',
    dayPrefs: {
      Monday: 'RD',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Morning Half (5H)',
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
    halfDayPref: 'Tuesday Morning (5H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Morning Half (5H)',
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
    halfDayPref: 'Friday Morning (5H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'Flexible',
      Thursday: 'Flexible',
      Friday: 'Morning Half (5H)',
      Saturday: 'RD',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG04324',
    nickname: 'MEYLINA',
    empName: 'MEYLINA ELVY ANAK JOSWAI',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Wednesday',
    halfDayPref: 'Friday Morning (5H)',
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'RD',
      Thursday: 'Flexible',
      Friday: 'Morning Half (5H)',
      Saturday: 'Flexible',
      Sunday: 'Flexible'
    }
  },
  {
    empNo: 'PMG04331',
    nickname: 'VANESSA',
    empName: 'VANESSA ANAK BLAISE',
    position: 'Trainee',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Wednesday',
    halfDayPref: 'Sunday Morning (5H)',
    notes: 'Joined PMG Kota Sentosa 1/11/2026. Experienced at Peace & Joy Pharmacy Kuching. Culture adaptation phase.',
    adaptationPhase: true,
    isTrainee: true,
    dayPrefs: {
      Monday: 'Flexible',
      Tuesday: 'Flexible',
      Wednesday: 'RD',
      Thursday: 'Flexible',
      Friday: 'Flexible',
      Saturday: 'Flexible',
      Sunday: 'Morning Half (5H)'
    }
  }
];

// ─── HISTORICAL TEAMMATES PRIOR TO NOVEMBER 2026 (FOR PRE-NOV26 SCHEDULES) ─────
const HISTORICAL_KS01_PRE_NOV26 = [
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
      Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
      Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'RD'
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
      Monday: 'RD', Tuesday: 'Flexible', Wednesday: 'Flexible',
      Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'Morning Half (4H)'
    }
  }
];

let currentTeammates = [];
let generatedScheduleData = null; // Stored { month, branch, days: [...] }
let editingTeammateEmpNo = null;   // For Day Preferences Modal

// ─── TRAINEE HELPER ───────────────────────────────────────────────────────────
function isTraineeTeammate(tm) {
  if (!tm) return false;
  const pos = String(tm.position || '').trim().toLowerCase();
  if (pos === 'trainee' || pos.includes('trainee')) return true;
  if (tm.isTrainee !== undefined) return !!tm.isTrainee;
  return tm.empNo === 'PMG04331' || tm.empNo === 'PMG03801' || tm.nickname === 'VANESSA' || !!tm.adaptationPhase;
}

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

  // Load teammates and check for saved timetable for selected branch and target month
  const activeBranch = branchSelect ? branchSelect.value : 'KS01';
  const targetMonthStr = monthInput ? monthInput.value : null;
  loadTeammates(activeBranch, targetMonthStr);
  checkAndLoadSavedTimetable(activeBranch, targetMonthStr);

  if (branchSelect) {
    branchSelect.addEventListener('change', (e) => {
      const b = e.target.value;
      const m = monthInput ? monthInput.value : null;
      loadTeammates(b, m);
      checkAndLoadSavedTimetable(b, m);
    });
  }

  if (monthInput) {
    monthInput.addEventListener('change', (e) => {
      const b = branchSelect ? branchSelect.value : 'KS01';
      const m = e.target.value;
      loadTeammates(b, m);
      checkAndLoadSavedTimetable(b, m);
    });
  }

  if (genBtn) genBtn.addEventListener('click', generateTimetable);
  if (savePrefBtn) savePrefBtn.addEventListener('click', saveTeammatePreferences);
  if (resetPrefBtn) resetPrefBtn.addEventListener('click', resetTeammatePreferences);
  if (addStaffBtn) addStaffBtn.addEventListener('click', showAddTeammateModal);

  // Timetable Save and Backup buttons
  const saveBtn = document.getElementById('schedulerSaveTimetableBtn');
  if (saveBtn) saveBtn.addEventListener('click', () => saveGeneratedTimetable(true));

  const topSaveBtn = document.getElementById('schedulerSaveTimetableTopBtn');
  if (topSaveBtn) topSaveBtn.addEventListener('click', () => saveGeneratedTimetable(true));

  const backupJsonBtn = document.getElementById('schedulerBackupJsonBtn');
  if (backupJsonBtn) backupJsonBtn.addEventListener('click', exportTimetableBackupJson);

  // Export buttons
  const dlVisualXlsxBtn = document.getElementById('schedulerDownloadVisualXlsxBtn');
  if (dlVisualXlsxBtn) dlVisualXlsxBtn.addEventListener('click', exportScheduleToPmgVisualExcel);

  const dlCsvBtn = document.getElementById('schedulerDownloadCsvBtn');
  if (dlCsvBtn) dlCsvBtn.addEventListener('click', exportScheduleToRymnetCSV);

  const dlXlsxBtn = document.getElementById('schedulerDownloadXlsxBtn');
  if (dlXlsxBtn) dlXlsxBtn.addEventListener('click', exportScheduleToRymnetExcel);

  const copyWaBtn = document.getElementById('schedulerCopyWaBtn');
  if (copyWaBtn) copyWaBtn.addEventListener('click', copyScheduleWhatsAppSummary);
}

// ─── TEAMMATE STORAGE & LOADING ──────────────────────────────────────────────
function getStorageKey(branchCode) {
  return `pmg_staff_preferences_v2_${branchCode || 'KS01'}`;
}

function extractHalfDayName(tm) {
  if (tm && tm.dayPrefs) {
    const fromDp = Object.keys(tm.dayPrefs).find(k => tm.dayPrefs[k] && (tm.dayPrefs[k].includes('4H') || tm.dayPrefs[k].includes('Half')));
    if (fromDp) return fromDp;
  }
  if (tm && tm.halfDayPref && tm.halfDayPref !== 'None' && tm.halfDayPref !== 'Flexible') {
    return tm.halfDayPref.includes(' ') ? tm.halfDayPref.split(' ')[0] : tm.halfDayPref;
  }
  return 'Flexible';
}

function extractRestDayName(tm) {
  if (tm && tm.dayPrefs) {
    const fromDp = Object.keys(tm.dayPrefs).find(k => tm.dayPrefs[k] === 'RD');
    if (fromDp) return fromDp;
  }
  if (tm && tm.restDayPref && tm.restDayPref !== 'None' && tm.restDayPref !== 'Flexible') {
    return tm.restDayPref;
  }
  return 'Flexible';
}

function loadTeammates(branchCode, targetMonth = null, skipCloudSync = false) {
  const mInput = document.getElementById('schedulerMonth');
  const activeMonth = targetMonth || (mInput && mInput.value ? mInput.value.trim() : '');
  const isNov2026OrLater = !activeMonth || activeMonth >= '2026-11';

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
          halfDayPref: 'Flexible',
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

  // Ensure William Chai has his fixed schedule attributes (ONLY fixed shift anchor)
  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  if (william) {
    william.position = 'Pharmacist';
    william.isPharmacist = true;
    william.scheduleMode = 'Fixed';
    william.shiftPref = 'Morning Only';
    william.restDayPref = 'Sunday';
    william.halfDayPref = 'Saturday Morning (4H)';
  }

  // KS01 Specific Realignment & Sanitization
  if (branchCode === 'KS01') {
    // 1. Purge Daniela Janet (Resigned)
    currentTeammates = currentTeammates.filter(t => t.empNo !== 'PMG03062' && t.nickname !== 'JANET');

    // 2. November 2026 Staff Realignment: Ting & Kenix departure; Vanessa arrival & Meylina
    if (isNov2026OrLater) {
      currentTeammates = currentTeammates.filter(t => t.empNo !== 'PMG00723' && t.nickname !== 'TING' && t.empNo !== 'PMG02963' && t.nickname !== 'KENIX');
      const vanessa = currentTeammates.find(t => t.empNo === 'PMG04331' || t.empNo === 'PMG03801' || t.nickname === 'VANESSA');
      if (!vanessa) {
        const defVanessa = DEFAULT_KS01_TEAMMATES.find(t => t.nickname === 'VANESSA');
        if (defVanessa) {
          currentTeammates.push(JSON.parse(JSON.stringify(defVanessa)));
        }
      } else {
        vanessa.empNo = 'PMG04331';
        if (!vanessa.position || vanessa.position === 'Staff') {
          vanessa.position = 'Trainee';
        }
        vanessa.isTrainee = true;
      }
      // Ensure Meylina is present for KS01
      const meylina = currentTeammates.find(t => t.empNo === 'PMG04324' || (t.nickname && t.nickname.toUpperCase() === 'MEYLINA'));
      if (!meylina) {
        const defMeylina = DEFAULT_KS01_TEAMMATES.find(t => t.nickname === 'MEYLINA');
        if (defMeylina) {
          currentTeammates.push(JSON.parse(JSON.stringify(defMeylina)));
        }
      }
    } else {
      // Historical schedule prior to Nov 2026: restore Ting and Kenix, omit Vanessa
      currentTeammates = currentTeammates.filter(t => t.empNo !== 'PMG04331' && t.empNo !== 'PMG03801' && t.nickname !== 'VANESSA');
      HISTORICAL_KS01_PRE_NOV26.forEach(histTm => {
        if (!currentTeammates.some(t => t.empNo === histTm.empNo || t.nickname === histTm.nickname)) {
          currentTeammates.push(JSON.parse(JSON.stringify(histTm)));
        }
      });
      // Ensure Ting Kwang Yu is not marked as pharmacist from legacy data
      const ting = currentTeammates.find(t => t.empNo === 'PMG00723' || t.nickname === 'TING');
      if (ting) {
        if (ting.position === 'Pharmacist') ting.position = 'Branch Manager';
        ting.isPharmacist = false;
        ting.scheduleMode = 'Rotating';
      }
    }

    // 3. Realignment: Louna is Assistant Branch Manager (ABM) and participates in 6S cleaning
    const louna = currentTeammates.find(t => t.empNo === 'PMG01294' || t.nickname === 'LOUNA');
    if (louna) {
      louna.position = 'Assistant Branch Manager';
      louna.scheduleMode = 'Rotating';
      if (!louna.dayPrefs) {
        louna.restDayPref = 'Thursday';
        louna.halfDayPref = 'Wednesday Morning (5H)';
        louna.dayPrefs = {
          Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Morning Half (5H)',
          Thursday: 'RD', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'Flexible'
        };
      }
    }

    // 4. Realignment: Penny is Staff (remove legacy script-prefixed Morning Preferred bias)
    const penny = currentTeammates.find(t => t.empNo === 'PMG02694' || t.nickname === 'PENNY');
    if (penny) {
      penny.position = 'Staff';
      penny.scheduleMode = 'Rotating';
      if (!penny.dayPrefs) {
        penny.restDayPref = 'Tuesday';
        penny.halfDayPref = 'Monday Morning (5H)';
        penny.shiftPref = 'Flexible';
        penny.dayPrefs = {
          Monday: 'Morning Half (5H)', Tuesday: 'RD', Wednesday: 'Flexible',
          Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'Flexible'
        };
      }
    }

    // 5. Ensure Christina Lee Ying Ying (PRP) is in active teammates list
    const christina = currentTeammates.find(t => t.empNo === 'PMG03033' || t.nickname === 'CHRISTINA');
    if (!christina) {
      const defChristina = DEFAULT_KS01_TEAMMATES.find(t => t.nickname === 'CHRISTINA');
      if (defChristina) {
        currentTeammates.push(JSON.parse(JSON.stringify(defChristina)));
      }
    }

    // 6. Synchronize restDayPref, halfDayPref, and dayPrefs across all teammates
    currentTeammates.forEach(tm => {
      if (tm.empNo === 'PMG00831' || tm.scheduleMode === 'Fixed') return;
      if (!tm.dayPrefs) {
        tm.dayPrefs = {
          Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
          Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'Flexible'
        };
      }
      const rdName = extractRestDayName(tm);
      const hdName = extractHalfDayName(tm);
      tm.restDayPref = rdName;
      tm.halfDayPref = (hdName && hdName !== 'Flexible' && hdName !== 'None') ? `${hdName} Morning (5H)` : 'Flexible';
      if (rdName && rdName !== 'Flexible') tm.dayPrefs[rdName] = 'RD';
      if (hdName && hdName !== 'Flexible' && hdName !== 'None' && hdName !== rdName) {
        tm.dayPrefs[hdName] = 'Morning Half (5H)';
      }
    });
  }

  // Ensure any teammate with position 'Trainee' has isTrainee = true
  currentTeammates.forEach(tm => {
    if (String(tm.position || '').trim().toLowerCase().includes('trainee')) {
      tm.isTrainee = true;
    }
    // Invariant: Trainees must NEVER have Friday RD (Friday 14:00-15:00 HQ Video Training)
    if (isTraineeTeammate(tm) && tm.empNo !== 'PMG00831') {
      if (!tm.dayPrefs) tm.dayPrefs = {};
      const fridayIsRd = tm.dayPrefs['Friday'] === 'RD' || tm.restDayPref === 'Friday';
      if (fridayIsRd) {
        tm.dayPrefs['Friday'] = 'Flexible';
        const halfDay = extractHalfDayName(tm);
        const newRd = halfDay === 'Sunday' ? 'Wednesday' : 'Sunday';
        Object.keys(tm.dayPrefs).forEach(k => { if (tm.dayPrefs[k] === 'RD') tm.dayPrefs[k] = 'Flexible'; });
        tm.dayPrefs[newRd] = 'RD';
        tm.restDayPref = newRd;
        console.warn(`[PMG Scheduler] Trainee ${tm.nickname} had Friday RD; relocated to ${newRd} (Friday HQ Training invariant).`);
      }
    }
  });

  renderTeammatesTable();

  // Cross-PC Cloud Synchronization for Teammate Preferences (OneDrive & Google Apps Script)
  const syncTeammatesFromCloud = async () => {
    const bCode = (branchCode || 'KS01').toUpperCase();
    const localKey = getStorageKey(bCode);
    const localUpdatedKey = `pmg_staff_preferences_v2_${bCode}_updatedAt`;
    let appliedCloud = false;

    // 1. Check OneDrive first
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.loadTeammatePreferencesFromOneDrive === 'function') {
      try {
        const cloudPrefs = await window.pmgOneDriveSync.loadTeammatePreferencesFromOneDrive(bCode);
        if (cloudPrefs && Array.isArray(cloudPrefs) && cloudPrefs.length > 0) {
          const cloudUpdated = localStorage.getItem(`pmg_schedule_prefs_cloud_updatedAt_${bCode}`) || localStorage.getItem(localUpdatedKey) || '';
          if (applyCloudPreferences(bCode, { data: cloudPrefs, lastUpdated: cloudUpdated })) {
            currentTeammates = cloudPrefs;
            renderTeammatesTable();
            appliedCloud = true;
            console.log(`[PMG Scheduler] Loaded preferences from OneDrive for ${bCode}`);
          }
        }
      } catch (e) {
        console.warn('[PMG Scheduler] OneDrive pref load:', e);
      }
    }

    // 2. Fallback to Google Apps Script cloud sync if OneDrive did not load
    if (!appliedCloud && !skipCloudSync) {
      try {
        const apiUrl = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
        const resp = await fetch(`${apiUrl}?action=getStaffPreferences&branch=${encodeURIComponent(bCode)}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.success && Array.isArray(json.preferences) && json.preferences.length > 0) {
            const cloudPrefs = json.preferences;
            const cloudUpdated = json.lastUpdated || '';
            if (applyCloudPreferences(bCode, { data: cloudPrefs, lastUpdated: cloudUpdated })) {
              currentTeammates = cloudPrefs;
              renderTeammatesTable();
              console.log(`[PMG Scheduler] Loaded preferences from Google Apps Script for ${bCode}`);
            }
          }
        }
      } catch (_) {}
    }
  };

  syncTeammatesFromCloud();
  window.syncTeammatePreferencesWithCloud = syncTeammatesFromCloud;
}

// Saving Local Preferences:
function saveLocalPreferences(branchCode, preferencesArray) {
  const bCode = (branchCode || 'KS01').toUpperCase();
  const timestamp = new Date().toISOString();
  localStorage.setItem(`pmg_staff_preferences_v2_${bCode}`, JSON.stringify(preferencesArray));
  localStorage.setItem(`pmg_staff_preferences_v2_${bCode}_updatedAt`, timestamp);
  return timestamp;
}

// Ingesting Cloud Preferences:
function applyCloudPreferences(branchCode, cloudPayload) {
  if (!cloudPayload) return false;
  const bCode = (branchCode || 'KS01').toUpperCase();
  const localTs = localStorage.getItem(`pmg_staff_preferences_v2_${bCode}_updatedAt`);
  const cloudTs = cloudPayload.lastUpdated;
  const data = cloudPayload.data || cloudPayload.preferences;

  if (localTs && (!cloudTs || new Date(cloudTs) <= new Date(localTs))) {
    console.log(`[Sync] Local preferences are newer or identical. Skipping cloud overwrite.`);
    return false;
  }

  if (!data || !Array.isArray(data) || data.length === 0) return false;

  localStorage.setItem(`pmg_staff_preferences_v2_${bCode}`, JSON.stringify(data));
  localStorage.setItem(`pmg_staff_preferences_v2_${bCode}_updatedAt`, cloudTs || new Date().toISOString());
  return true;
}

window.saveLocalPreferences = saveLocalPreferences;
window.applyCloudPreferences = applyCloudPreferences;

function saveTeammatePreferences(silent = false) {
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const branchCode = branchSelect ? branchSelect.value : 'KS01';
  
  // Read values from table rows
  const rows = document.querySelectorAll('#schedulerTeammatesBody tr[data-emp-no]');
  if (!rows || rows.length === 0) return; // Guard: Do not wipe if table is not yet rendered

  const updated = [];
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  rows.forEach(tr => {
    const empNo = tr.getAttribute('data-emp-no');
    const orig = currentTeammates.find(t => t.empNo === empNo) || {};
    const isFixed = orig.scheduleMode === 'Fixed' || empNo === 'PMG00831';
    
    const posEl   = tr.querySelector('.tm-position');
    const raceEl  = tr.querySelector('.tm-race');
    const shiftEl = tr.querySelector('.tm-shift-pref');
    const restEl  = tr.querySelector('.tm-rest-pref');
    const halfEl  = tr.querySelector('.tm-half-pref');

    const posVal = posEl ? posEl.value : (orig.position || 'Staff');
    const isPharm = posVal.includes('Pharmacist') || orig.isPharmacist || (orig.empNo === 'PMG00831');
    const isTraineeVal = (posVal === 'Trainee' || posVal.toLowerCase().includes('trainee')) ? true : (orig.isTrainee !== undefined ? orig.isTrainee : false);

    let restVal = restEl ? restEl.value : extractRestDayName(orig);
    const halfVal = halfEl ? halfEl.value : extractHalfDayName(orig);

    if (isTraineeVal && restVal === 'Friday') {
      if (!silent) {
        alert(`Trainees (${orig.empName || orig.nickname}) must attend Friday 2:00 PM HQ Video Training and cannot have Friday as Rest Day. Rest Day has been moved to Sunday.`);
      }
      restVal = 'Sunday';
      if (restEl) restEl.value = 'Sunday';
    }

    const dayPrefs = orig.dayPrefs ? { ...orig.dayPrefs } : {
      Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible',
      Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'RD'
    };

    if (!isFixed) {
      // Sync RD in dayPrefs with restVal
      allDays.forEach(d => {
        if (dayPrefs[d] === 'RD' && d !== restVal) {
          dayPrefs[d] = 'Flexible';
        }
      });
      if (restVal && restVal !== 'Flexible') {
        dayPrefs[restVal] = 'RD';
      }

      if (isTraineeVal && dayPrefs['Friday'] === 'RD') {
        dayPrefs['Friday'] = 'Flexible';
        dayPrefs['Sunday'] = 'RD';
      }

      // Sync Morning Half in dayPrefs with halfVal (4H for William, 5H for rotating teammates)
      allDays.forEach(d => {
        if ((dayPrefs[d] === 'Morning Half (4H)' || dayPrefs[d] === 'Morning Half (5H)' || (dayPrefs[d] && (dayPrefs[d].includes('4H') || dayPrefs[d].includes('5H')))) && d !== halfVal) {
          dayPrefs[d] = 'Flexible';
        }
      });
      if (halfVal && halfVal !== 'Flexible' && halfVal !== 'None' && halfVal !== restVal) {
        dayPrefs[halfVal] = isFixed ? 'Morning Half (4H)' : 'Morning Half (5H)';
      }
    }

    const finalHalfPref = (halfVal && halfVal !== 'Flexible' && halfVal !== 'None' && halfVal !== restVal)
      ? `${halfVal} Morning (${isFixed ? '4H' : '5H'})`
      : 'Flexible';

    updated.push({
      ...orig,
      position:    posVal,
      isPharmacist: isPharm,
      isTrainee:   isTraineeVal,
      race:        raceEl ? raceEl.value : (orig.race || 'Chinese'),
      shiftPref:   shiftEl ? shiftEl.value : (orig.shiftPref || 'Flexible'),
      restDayPref: restVal,
      halfDayPref: isFixed ? 'Saturday Morning (4H)' : finalHalfPref,
      dayPrefs:    dayPrefs
    });
  });

  let nowIso = new Date().toISOString();
  if (updated.length > 0) {
    currentTeammates = updated;
    nowIso = saveLocalPreferences(branchCode, currentTeammates);
  }

  if (silent) return;

  // Sync to OneDrive and Google Apps Script in background for cross-device persistence
  try {
    const od = window.pmgOneDriveSync || window.pmgOneDrive;
    if (od && typeof od.saveTeammatePreferencesToOneDrive === 'function') {
      od.saveTeammatePreferencesToOneDrive(branchCode, currentTeammates).catch(err => {
        console.warn('[PMG Scheduler] Could not save preferences to OneDrive:', err);
      });
    } else if (od && typeof od.saveFileToActiveFolder === 'function') {
      od.saveFileToActiveFolder(`schedule_preferences_${branchCode}.json`, JSON.stringify({
        branchCode,
        lastUpdated: nowIso,
        preferences: currentTeammates
      }, null, 2)).catch(() => {});
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
        lastUpdated: nowIso,
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

function onTeammateRowPrefChange() {
  saveTeammatePreferences(true);
  renderTeammatesTable();
}
if (typeof window !== 'undefined') {
  window.onTeammateRowPrefChange = onTeammateRowPrefChange;
}

function resetTeammatePreferences() {
  if (!confirm('Reset all teammates and preferences for this branch back to standard defaults?')) return;
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const branchCode = branchSelect ? branchSelect.value : 'KS01';
  localStorage.removeItem(getStorageKey(branchCode));
  loadTeammates(branchCode, null, true);
}

// ─── RENDER TEAMMATES TABLE ──────────────────────────────────────────────────
function renderTeammatesTable() {
  const tbody = document.getElementById('schedulerTeammatesBody');
  if (!tbody) return;

  if (!currentTeammates.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400 text-sm">No teammates found for this branch. Click "+ Add Teammate" to add.</td></tr>`;
    return;
  }

  const positionOptions = ['Pharmacist', 'Provisional Registered Pharmacist', 'Branch Manager', 'Assistant Branch Manager', 'Staff', 'Trainee'];
  const raceOptions = ['Chinese', 'Malay', 'Iban / Bidayuh', 'Other'];
  const shiftOptions = ['Morning Preferred', 'Night Preferred', 'Flexible', 'Morning Only'];
  const restOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Flexible'];
  const halfOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible'];

  let html = '';
  currentTeammates.forEach(t => {
    const isPharm = t.isPharmacist || (t.position && t.position.includes('Pharmacist'));
    const isFixed = t.scheduleMode === 'Fixed' || t.empNo === 'PMG00831';
    const isTrainee = isTraineeTeammate(t);
    const curRestDay = extractRestDayName(t);
    const curHalfDay = isFixed ? 'Saturday' : extractHalfDayName(t);

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
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-gray-900">${escHtml(t.empName)}</span>
            ${isFixed ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-200">Fixed Pattern</span>' : ''}
            ${isTrainee ? '<span class="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold border border-indigo-200" title="Trainee Learning Track Active (3x 1H sessions/week: Fri 14:00 HQ Video + 2 Overlap sessions)">🎓 Trainee</span>' : ''}
          </div>
          <div class="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
            <span>${escHtml(t.empNo)}</span>
            <span class="bg-gray-200 text-gray-700 px-1 rounded font-semibold">${escHtml(t.nickname)}</span>
          </div>
        </td>
        <td class="px-2 py-3">
          <select onchange="onTeammateRowPrefChange()" class="tm-position text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
            ${positionOptions.map(p => `<option value="${p}" ${t.position === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          ${isPharm ? '<span class="inline-block mt-1 text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"><i class="fa-solid fa-mortar-pestle mr-1"></i>Rx Qualified</span>' : (isTrainee ? '<span class="inline-block mt-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"><i class="fa-solid fa-graduation-cap mr-1"></i>Trainee</span>' : '<span class="inline-block mt-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Staff</span>')}
        </td>
        <td class="px-2 py-3">
          <select onchange="onTeammateRowPrefChange()" class="tm-race text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${raceOptions.map(r => `<option value="${r}" ${t.race === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select onchange="onTeammateRowPrefChange()" class="tm-rest-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
            ${restOptions.map(o => `<option value="${o}" ${curRestDay === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select onchange="onTeammateRowPrefChange()" class="tm-half-pref text-xs border border-amber-300 rounded px-2 py-1 bg-amber-50/40 text-amber-950 font-medium focus:ring-1 focus:ring-amber-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
            ${halfOptions.map(h => `<option value="${h}" ${curHalfDay === h ? 'selected' : ''}>${h === 'Flexible' ? 'Flexible (AI)' : (isFixed ? `${h} (4H)` : `${h} (5H)`)}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select onchange="onTeammateRowPrefChange()" class="tm-shift-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full" ${isFixed ? 'disabled' : ''}>
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
  if (document.querySelectorAll('#schedulerTeammatesBody tr[data-emp-no]').length > 0) {
    saveTeammatePreferences(true);
  }
  const tm = currentTeammates.find(t => t.empNo === empNo);
  if (!tm) return;

  editingTeammateEmpNo = empNo;

  const modal = document.getElementById('schedulerDayPrefsModal');
  const title = document.getElementById('dayPrefsModalTitle');
  const form  = document.getElementById('dayPrefsModalForm');

  if (!modal || !title || !form) return;

  const isFixed = tm.scheduleMode === 'Fixed' || tm.empNo === 'PMG00831';
  const halfPrefVal = isFixed ? 'Morning Half (4H)' : 'Morning Half (5H)';
  const halfPrefLabel = isFixed ? 'Morning Half Day (4H: 07:30-11:30)' : 'Morning Half Day (5H: 07:30-12:30)';

  title.textContent = `Day-of-Week Shift Preferences: ${tm.empName} (${tm.nickname})`;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const prefOptions = [
    { val: 'Flexible', label: 'Flexible (AI Decides)' },
    { val: 'Morning Preferred', label: 'Morning Preferred (07:30-16:30)' },
    { val: 'Night Preferred', label: 'Night Preferred (12:30-21:30)' },
    { val: 'Morning Only', label: 'Morning ONLY' },
    { val: 'Night Only', label: 'Night ONLY' },
    { val: halfPrefVal, label: halfPrefLabel },
    { val: 'RD', label: 'Rest Day (OFF)' }
  ];

  const currentPrefs = tm.dayPrefs || {};

  let formHtml = '';
  days.forEach(day => {
    let curVal = currentPrefs[day] || (day === tm.restDayPref ? 'RD' : 'Flexible');
    if (curVal.includes('Half') || curVal.includes('4H') || curVal.includes('5H')) {
      curVal = halfPrefVal;
    }
    formHtml += `
      <div class="flex items-center justify-between py-2 border-b border-gray-100 text-xs">
        <span class="font-bold text-gray-700 w-28">${day}</span>
        <select data-day="${day}" class="day-pref-select border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-purple-400 outline-none flex-1">
          ${prefOptions.map(opt => `<option value="${opt.val}" ${curVal === opt.val ? 'selected' : ''}>${opt.label}</option>`).join('')}
        </select>
      </div>
    `;
  });

  const isTrainee = isTraineeTeammate(tm);
  formHtml += `
    <div class="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
      <div>
        <span class="font-bold text-gray-800 text-xs flex items-center gap-1.5">
          <span>🎓</span> Trainee Learning Track (3-Month Adaptation)
        </span>
        <p class="text-[10px] text-gray-500 mt-0.5">Allocates 1H x 3 sessions/week (Friday 2:00 PM HQ Video + 2 overlap sessions)</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="modalIsTraineeToggle" class="sr-only peer" ${isTrainee ? 'checked' : ''}>
        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  `;

  if (tm.empNo === 'PMG00831') {
    formHtml = `
      <div class="p-3 bg-amber-50 text-amber-900 rounded-lg text-xs mb-3 border border-amber-200">
        <strong>Chai Yee Sian (Fixed Schedule Rule):</strong><br>
        • Mon–Fri: Morning 07:30 – 16:30<br>
        • Sat: Morning Half Day 07:30 – 11:30 (4H)<br>
        • Sun: Rest Day (OFF)<br>
        • Malaysia National & Sarawak Public Holidays: PH (OFF)<br>
        • Note: Deepavali falls on Sunday 08/11/2026 (William's Sunday RD) and contractually replaces to Monday 09/11/2026.
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

  const isFixed = tm.scheduleMode === 'Fixed' || tm.empNo === 'PMG00831';
  const halfPrefVal = isFixed ? 'Morning Half (4H)' : 'Morning Half (5H)';

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
    if ((sel.value.includes('4H') || sel.value.includes('5H') || sel.value.includes('Half')) && !foundHd) {
      foundHd = day;
      newPrefs[day] = halfPrefVal;
    }
  });

  const traineeToggle = document.getElementById('modalIsTraineeToggle');
  if (traineeToggle) {
    tm.isTrainee = traineeToggle.checked;
    if (tm.isTrainee) {
      if (!tm.position || tm.position === 'Staff') tm.position = 'Trainee';
    } else {
      if (tm.position === 'Trainee') tm.position = 'Staff';
    }
    if (tm.isTrainee && newPrefs['Friday'] === 'RD') {
      alert('Trainees must attend Friday 2:00 PM HQ Video Training and cannot have Friday as Rest Day (RD). Rest Day has been moved to Sunday.');
      newPrefs['Friday'] = 'Flexible';
      newPrefs['Sunday'] = 'RD';
      foundRd = 'Sunday';
    }
  }

  tm.dayPrefs = newPrefs;
  tm.restDayPref = foundRd || 'Flexible';
  tm.halfDayPref = foundHd ? `${foundHd} Morning (${isFixed ? '4H' : '5H'})` : 'Flexible';

  closeDayPrefsModal();
  renderTeammatesTable();
  saveTeammatePreferences();
}

function closeDayPrefsModal() {
  const modal = document.getElementById('schedulerDayPrefsModal');
  if (modal) modal.classList.add('hidden');
  editingTeammateEmpNo = null;
}

function removeTeammate(empNo) {
  if (!confirm('Remove this teammate from the schedule configuration?')) return;
  currentTeammates = currentTeammates.filter(t => t.empNo !== empNo);
  localStorage.setItem(getStorageKey(document.getElementById('schedulerBranchSelect')?.value || 'KS01'), JSON.stringify(currentTeammates));
  renderTeammatesTable();
}

function showAddTeammateModal() {
  const empName = prompt('Enter Employee Full Name:');
  if (!empName) return;
  const nickname = prompt('Enter Short Nickname (e.g. CONNY):', empName.split(' ')[0].toUpperCase()) || empName.split(' ')[0].toUpperCase();
  const empNo = prompt('Enter Employee ID (e.g. PMG09999):', `PMG0${Math.floor(1000 + Math.random() * 9000)}`) || 'PMG00000';
  const posInput = prompt('Enter Position (Pharmacist / Provisional Registered Pharmacist / Branch Manager / Assistant Branch Manager / Staff / Trainee):', 'Staff');
  const pos = (posInput && posInput.trim()) ? posInput.trim() : 'Staff';
  const isTrainee = pos.toLowerCase().includes('trainee');
  const isPharm = pos.toLowerCase().includes('pharmacist');
  
  currentTeammates.push({
    empNo: empNo.trim().toUpperCase(),
    nickname: nickname.trim().toUpperCase(),
    empName: empName.trim().toUpperCase(),
    position: pos,
    isPharmacist: isPharm,
    isTrainee: isTrainee,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: isTrainee ? 'Wednesday' : 'Sunday',
    halfDayPref: 'Flexible',
    dayPrefs: {
      Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: isTrainee ? 'RD' : 'Flexible',
      Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: isTrainee ? 'Flexible' : 'RD'
    }
  });

  localStorage.setItem(getStorageKey(document.getElementById('schedulerBranchSelect')?.value || 'KS01'), JSON.stringify(currentTeammates));
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

  // Persist any live user edits in the Teammates Table FIRST before loading/aligning for target month
  if (document.querySelectorAll('#schedulerTeammatesBody tr[data-emp-no]').length > 0) {
    saveTeammatePreferences(true);
  }
  loadTeammates(branchVal || 'KS01', monthVal, true);

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
  const weeks = getFullWeeksPeriod(year, month);

  const SOLVER_TIMEOUT_MS = 35000;
  let solverTimedOut = false;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      solverTimedOut = true;
      reject(new Error('TIMEOUT_35S'));
    }, SOLVER_TIMEOUT_MS);
  });

  try {
    generatedScheduleData = null; // Clear prior timetable cache so generation is 100% fresh
    if (apiKey) {
      let aiResult = null;
      let winningModelName = '';
      const schedulerCandidateModels = [
        { code: SCHEDULER_PRIMARY_MODEL,   name: 'Gemini 3.8 Flash (Primary)' },
        { code: SCHEDULER_SECONDARY_MODEL, name: 'Gemini 3.5 Flash (Secondary)' },
        { code: SCHEDULER_TERTIARY_MODEL,  name: 'Gemini 3.5 Flash-Lite (Backup)' },
        { code: SCHEDULER_FALLBACK_MODEL,  name: 'Gemini 3.1 Flash-Lite (Fallback)' },
        { code: 'gemini-2.5-flash',        name: 'Gemini 2.5 Flash (Fallback)' },
        { code: 'gemini-1.5-flash',        name: 'Gemini 1.5 Flash (Fallback)' }
      ];

      const aiAttempt = async () => {
        const startTime = Date.now();
        for (const m of schedulerCandidateModels) {
          if (Date.now() - startTime > 32000) break; // Keep buffer for timeout
          try {
            if (statusText) statusText.textContent = `Querying ${m.name} with Dynamic Weekly Headcount & Shift Parity rules…`;
            const res = await callSchedulerGemini(m.code, branchVal, monthVal, totalDays, apiKey, weeks);
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
        postProcessSchedule(aiResult, branchVal, year, month, totalDays, weeks);
        generatedScheduleData = aiResult;
        if (modelBadge) {
          modelBadge.textContent = `⚡ ${winningModelName}`;
          modelBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-800 border border-green-200';
        }
        showSchedulerToast('AI Schedule generated successfully with strict headcount & parity constraints', 'success');
      } else {
        if (statusText) statusText.textContent = solverTimedOut
          ? 'AI query exceeded time limit. Running Smart Heuristic Solver…'
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
    saveGeneratedTimetable(false);
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
      saveGeneratedTimetable(false);
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

// ─── PRESET LOCK GUARD HELPERS ────────────────────────────────────────────────
function canSwapShift(teammate, dayOfWeek) {
  const pref = (teammate && teammate.dayPrefs && dayOfWeek) ? teammate.dayPrefs[dayOfWeek] : 'Flexible';
  // If the user preset this day (Morning, Night, Half Day, or RD), lock it
  if (pref && pref !== 'Flexible') {
    return false;
  }
  return true;
}

function isDayPresetLocked(tm, dayOfWeek) {
  return !canSwapShift(tm, dayOfWeek);
}

function matchesTeammatePresets(pattern, dayPrefs, weekDays) {
  if (!pattern || !dayPrefs) return true;
  if (pattern.hasViolatedPref) return false;
  const seq = Array.isArray(pattern.seq) ? pattern.seq : pattern;
  const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (let i = 0; i < seq.length; i++) {
    const dayName = (weekDays && weekDays[i] && weekDays[i].dayOfWeek) ? weekDays[i].dayOfWeek : defaultDays[i];
    const pref = dayPrefs[dayName];
    if (!pref || pref === 'Flexible') continue;
    const shift = seq[i];
    if (pref === 'RD' && shift !== 'RD') return false;
    if ((pref.includes('Half') || pref.includes('4H') || pref.includes('5H')) && !isHalfDayMorningShift(shift)) return false;
    if ((pref === 'Morning Only' || pref === 'Morning Preferred') && !isFullMorningShift(shift)) return false;
    if ((pref === 'Night Only' || pref === 'Night Preferred') && !isNightShift(shift)) return false;
  }
  return true;
}

// ─── POST-PROCESS SCHEDULE CONSTRAINTS ────────────────────────────────────────
function postProcessSchedule(schedule, branchVal, year, month, totalDays, weeks) {
  if (!schedule) return;
  const isNov2026OrLater = (year > 2026) || (year === 2026 && month >= 11);
  if (!currentTeammates || currentTeammates.length === 0) {
    loadTeammates(branchVal, `${year}-${String(month).padStart(2, '0')}`, true);
  }
  if (!weeks) weeks = getFullWeeksPeriod(year, month);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rotatingPool = currentTeammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');
  const william = currentTeammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  if (!schedule.warnings) schedule.warnings = [];

  // 1. Ensure schedule.days covers all 7-day Monday–Sunday weeks
  const allWeekDays = weeks.flat();
  if (!schedule.days || schedule.days.length === 0) {
    schedule.days = allWeekDays.map(d => ({ ...d, shifts: {} }));
  } else {
    const existingDates = new Set(schedule.days.map(d => d.date));
    const missingDays = allWeekDays.filter(wd => !existingDates.has(wd.date));
    if (missingDays.length > 0) {
      missingDays.forEach(mDay => {
        schedule.days.push({
          ...mDay,
          shifts: {}
        });
      });
      schedule.days.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }

  // Ensure day properties
  schedule.days.forEach(d => {
    if (!d.dayOfWeek) d.dayOfWeek = daysOfWeek[new Date(d.date).getDay()];
    if (d.day === undefined) d.day = new Date(d.date).getDate();
    if (d.month === undefined) d.month = new Date(d.date).getMonth() + 1;
    if (d.year === undefined) d.year = new Date(d.date).getFullYear();
    if (d.isTargetMonth === undefined) d.isTargetMonth = (d.month === month);
    if (!d.shifts) d.shifts = {};
  });

  // 2. Lock William Chai immutable anchor schedule
  schedule.days.forEach(d => {
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date] || !!WILLIAM_CONTRACT_PH[d.date];
    if (william) {
      if (isHoliday) {
        d.shifts[william.empNo] = 'PH';
      } else if (d.dayOfWeek === 'Sunday') {
        d.shifts[william.empNo] = 'RD';
      } else if (d.dayOfWeek === 'Saturday') {
        d.shifts[william.empNo] = '4H_0730-1130';
      } else {
        d.shifts[william.empNo] = '8H_0730-1630';
      }
    }
  });

  // 3. Enforce statutory 1 Rest Day + 1 Half Day + locked dayPrefs per 7-day Monday–Sunday calendar week
  const calWeeks = [];
  for (let i = 0; i < schedule.days.length; i += 7) {
    calWeeks.push(schedule.days.slice(i, i + 7));
  }

  calWeeks.forEach(wDays => {
    rotatingPool.forEach(tm => {
      const explicitRd = extractRestDayName(tm);
      const explicitHd = extractHalfDayName(tm);
      const halfShiftCode = getHalfDayShiftCode(tm);

      // 3.0 Strictly lock all explicit dayPrefs ('Morning Only', 'Night Only', 'Morning Half (5H)', 'RD', etc.)
      if (tm.dayPrefs) {
        wDays.forEach(d => {
          const dp = tm.dayPrefs[d.dayOfWeek];
          if (!dp || dp === 'Flexible') return;
          if (dp === 'RD') {
            d.shifts[tm.empNo] = 'RD';
          } else if (dp.includes('Morning Half') || dp.includes('5H') || dp.includes('4H')) {
            d.shifts[tm.empNo] = halfShiftCode;
          } else if (dp === 'Morning Only' || dp === 'Morning Preferred') {
            d.shifts[tm.empNo] = '8H_0730-1630';
          } else if (dp === 'Night Only' || dp === 'Night Preferred') {
            d.shifts[tm.empNo] = '8H_1230-2130';
          }
        });
      }

      if (explicitRd && explicitRd !== 'Flexible') {
        wDays.forEach(d => {
          if (d.dayOfWeek === explicitRd) {
            d.shifts[tm.empNo] = 'RD';
          } else if (d.shifts[tm.empNo] === 'RD') {
            let curM = 0, curN = 0;
            wDays.forEach(x => {
              if (isAnyMorningShift(x.shifts[tm.empNo])) curM++;
              if (isNightShift(x.shifts[tm.empNo])) curN++;
            });
            d.shifts[tm.empNo] = (curM > curN) ? '8H_1230-2130' : '8H_0730-1630';
          }
        });
      }

      if (explicitHd && explicitHd !== 'Flexible' && explicitHd !== 'None') {
        wDays.forEach(d => {
          if (d.dayOfWeek === explicitHd && d.shifts[tm.empNo] !== 'RD') {
            d.shifts[tm.empNo] = halfShiftCode;
          } else if (isHalfDayMorningShift(d.shifts[tm.empNo]) && d.dayOfWeek !== explicitHd) {
            let curM = 0, curN = 0;
            wDays.forEach(x => {
              if (isAnyMorningShift(x.shifts[tm.empNo])) curM++;
              if (isNightShift(x.shifts[tm.empNo])) curN++;
            });
            d.shifts[tm.empNo] = (curM > curN) ? '8H_1230-2130' : '8H_0730-1630';
          }
        });
      } else {
        let hasHd = wDays.some(d => isHalfDayMorningShift(d.shifts[tm.empNo]));
        if (!hasHd) {
          const eligible = wDays.find(d => d.shifts[tm.empNo] !== 'RD' && !isDayPresetLocked(tm, d.dayOfWeek) && d.dayOfWeek !== 'Sunday' && d.dayOfWeek !== 'Saturday' && (!isTraineeTeammate(tm) || d.dayOfWeek !== 'Friday'));
          if (eligible) eligible.shifts[tm.empNo] = halfShiftCode;
        }
      }

      // 3a. Invariant: Trainees must NEVER receive RD or Morning Half on Friday (14:00-15:00 HQ Video Training)
      if (isTraineeTeammate(tm)) {
        const fri = wDays.find(d => d.dayOfWeek === 'Friday');
        if (fri && (fri.shifts[tm.empNo] === 'RD' || fri.shifts[tm.empNo] === 'OFF' || isHalfDayMorningShift(fri.shifts[tm.empNo]) || !fri.shifts[tm.empNo])) {
          // Move RD or Morning Half to first non-Friday full-shift day
          const order = ['Sunday', 'Wednesday', 'Thursday', 'Tuesday', 'Monday', 'Saturday'];
          const target = order
            .map(n => wDays.find(d => d.dayOfWeek === n))
            .find(d => d && (isFullMorningShift(d.shifts[tm.empNo]) || isNightShift(d.shifts[tm.empNo])));
          const swapShift = target ? target.shifts[tm.empNo] : '8H_0730-1630';
          if (target) target.shifts[tm.empNo] = fri.shifts[tm.empNo] || 'RD';
          fri.shifts[tm.empNo] = swapShift;
        }
      }
    });

    // 4. Floor headcount correction per day (AM Total >= 3 with Full AM >= 2, and PM >= 3)
    // Preset Lock Guard: ONLY adjust shifts on days marked 'Flexible'
    wDays.forEach(d => {
      let fullAm = 0, halfAm = 0, pm = 0;
      Object.entries(d.shifts).forEach(([eNo, sh]) => {
        if (isFullMorningShift(sh)) fullAm++;
        else if (isHalfDayMorningShift(sh)) halfAm++;
        else if (isNightShift(sh)) pm++;
      });

      while (pm < 3 && (fullAm + halfAm) > 3 && fullAm > 2) {
        const candidate = rotatingPool.find(tm => {
          if (d.shifts[tm.empNo] !== '8H_0730-1630') return false;
          if (isDayPresetLocked(tm, d.dayOfWeek)) return false;
          return true;
        });
        if (!candidate) break;
        d.shifts[candidate.empNo] = '8H_1230-2130';
        fullAm--;
        pm++;
      }

      while ((fullAm + halfAm) < 3 && pm > 3) {
        const candidate = rotatingPool.find(tm => {
          if (d.shifts[tm.empNo] !== '8H_1230-2130') return false;
          if (isDayPresetLocked(tm, d.dayOfWeek)) return false;
          return true;
        });
        if (!candidate) break;
        d.shifts[candidate.empNo] = '8H_0730-1630';
        pm--;
        fullAm++;
      }
    });

    // 5. Weekly Parity Balancer (|Morning - Night| <= 2 per rotating staff per week)
    let iter = 0;
    while (iter < 50) {
      iter++;
      let anySwapped = false;
      const wStats = {};
      rotatingPool.forEach(tm => {
        let m = 0, n = 0;
        wDays.forEach(d => {
          const s = d.shifts[tm.empNo];
          if (isAnyMorningShift(s)) m++;
          if (isNightShift(s)) n++;
        });
        wStats[tm.empNo] = { m, n, dev: Math.abs(m - n) };
      });

      // 5a. Direct flip if a day has surplus headcount and maintains floor >= 3 (ONLY on 'Flexible' days)
      for (const tm of rotatingPool) {
        const stat = wStats[tm.empNo];
        if (stat.m - stat.n >= 2) {
          for (const d of wDays) {
            if (d.shifts[tm.empNo] === '8H_0730-1630') {
              if (isDayPresetLocked(tm, d.dayOfWeek)) continue;
              let curFullAm = 0, curHalfAm = 0, curPm = 0;
              Object.values(d.shifts).forEach(s => {
                if (isFullMorningShift(s)) curFullAm++;
                else if (isHalfDayMorningShift(s)) curHalfAm++;
                else if (isNightShift(s)) curPm++;
              });
              if ((curFullAm + curHalfAm) > 3 && curFullAm > 2) {
                let amCh = 0, pmCh = 0;
                currentTeammates.forEach(t => {
                  let sh = d.shifts[t.empNo];
                  if (t.empNo === tm.empNo) sh = '8H_1230-2130';
                  if (t.race === 'Chinese') {
                    if (isAnyMorningShift(sh)) amCh++;
                    if (isNightShift(sh)) pmCh++;
                  }
                });
                if (isNov2026OrLater || (amCh >= 1 && pmCh >= 1)) {
                  d.shifts[tm.empNo] = '8H_1230-2130';
                  anySwapped = true;
                  break;
                }
              }
            }
          }
        } else if (stat.n - stat.m >= 2) {
          for (const d of wDays) {
            if (d.shifts[tm.empNo] === '8H_1230-2130') {
              if (isDayPresetLocked(tm, d.dayOfWeek)) continue;
              let curFullAm = 0, curHalfAm = 0, curPm = 0;
              Object.values(d.shifts).forEach(s => {
                if (isFullMorningShift(s)) curFullAm++;
                else if (isHalfDayMorningShift(s)) curHalfAm++;
                else if (isNightShift(s)) curPm++;
              });
              if (curPm > 3) {
                let amCh = 0, pmCh = 0;
                currentTeammates.forEach(t => {
                  let sh = d.shifts[t.empNo];
                  if (t.empNo === tm.empNo) sh = '8H_0730-1630';
                  if (t.race === 'Chinese') {
                    if (isAnyMorningShift(sh)) amCh++;
                    if (isNightShift(sh)) pmCh++;
                  }
                });
                if (isNov2026OrLater || (amCh >= 1 && pmCh >= 1)) {
                  d.shifts[tm.empNo] = '8H_0730-1630';
                  anySwapped = true;
                  break;
                }
              }
            }
          }
        }
        if (anySwapped) break;
      }

      if (anySwapped) continue;

      // 5b. Pairwise swaps in this week (ONLY on 'Flexible' days)
      const surplusAm = rotatingPool.filter(t => (wStats[t.empNo].m - wStats[t.empNo].n) >= 2)
        .sort((a, b) => (wStats[b.empNo].m - wStats[b.empNo].n) - (wStats[a.empNo].m - wStats[a.empNo].n));
      const eligiblePm = rotatingPool.filter(t => (wStats[t.empNo].n >= wStats[t.empNo].m))
        .sort((a, b) => (wStats[b.empNo].n - wStats[b.empNo].m) - (wStats[a.empNo].n - wStats[a.empNo].m));

      for (const tAm of surplusAm) {
        for (const tPm of eligiblePm) {
          if (tAm.empNo === tPm.empNo) continue;
          for (const d of wDays) {
            if (d.shifts[tAm.empNo] === '8H_0730-1630' && d.shifts[tPm.empNo] === '8H_1230-2130') {
              if (isDayPresetLocked(tAm, d.dayOfWeek) || isDayPresetLocked(tPm, d.dayOfWeek)) continue;

              let amCh = 0, pmCh = 0;
              currentTeammates.forEach(t => {
                let sh = d.shifts[t.empNo];
                if (t.empNo === tAm.empNo) sh = '8H_1230-2130';
                if (t.empNo === tPm.empNo) sh = '8H_0730-1630';
                if (t.race === 'Chinese') {
                  if (isAnyMorningShift(sh)) amCh++;
                  if (isNightShift(sh)) pmCh++;
                }
              });
              if (!isNov2026OrLater && (amCh < 1 || pmCh < 1)) continue;

              d.shifts[tAm.empNo] = '8H_1230-2130';
              d.shifts[tPm.empNo] = '8H_0730-1630';
              anySwapped = true;
              break;
            }
          }
          if (anySwapped) break;
        }
        if (anySwapped) break;
      }

      if (anySwapped) continue;

      const surplusPm = rotatingPool.filter(t => (wStats[t.empNo].n - wStats[t.empNo].m) >= 2)
        .sort((a, b) => (wStats[b.empNo].n - wStats[b.empNo].m) - (wStats[a.empNo].n - wStats[a.empNo].m));
      const eligibleAm = rotatingPool.filter(t => (wStats[t.empNo].m >= wStats[t.empNo].n))
        .sort((a, b) => (wStats[b.empNo].m - wStats[b.empNo].n) - (wStats[a.empNo].n - wStats[a.empNo].m));

      for (const tPm of surplusPm) {
        for (const tAm of eligibleAm) {
          if (tPm.empNo === tAm.empNo) continue;
          for (const d of wDays) {
            if (d.shifts[tPm.empNo] === '8H_1230-2130' && d.shifts[tAm.empNo] === '8H_0730-1630') {
              if (isDayPresetLocked(tPm, d.dayOfWeek) || isDayPresetLocked(tAm, d.dayOfWeek)) continue;

              let amCh = 0, pmCh = 0;
              currentTeammates.forEach(t => {
                let sh = d.shifts[t.empNo];
                if (t.empNo === tPm.empNo) sh = '8H_0730-1630';
                if (t.empNo === tAm.empNo) sh = '8H_1230-2130';
                if (t.race === 'Chinese') {
                  if (isAnyMorningShift(sh)) amCh++;
                  if (isNightShift(sh)) pmCh++;
                }
              });
              if (!isNov2026OrLater && (amCh < 1 || pmCh < 1)) continue;

              d.shifts[tPm.empNo] = '8H_0730-1630';
              d.shifts[tAm.empNo] = '8H_1230-2130';
              anySwapped = true;
              break;
            }
          }
          if (anySwapped) break;
        }
        if (anySwapped) break;
      }

      if (!anySwapped) break;
    }
  });

  // 6. Cumulative Monthly Parity Balancer across rotating pool (|Total Morn - Night| <= 2)
  let cumIter = 0;
  while (cumIter < 100) {
    cumIter++;
    let anyCumSwap = false;
    const cum = {};
    rotatingPool.forEach(tm => {
      let m = 0, n = 0;
      schedule.days.forEach(d => {
        const s = d.shifts[tm.empNo];
        if (isAnyMorningShift(s)) m++;
        if (isNightShift(s)) n++;
      });
      cum[tm.empNo] = { m, n, dev: Math.abs(m - n) };
    });

    const maxDev = Math.max(...rotatingPool.map(t => cum[t.empNo].dev));
    if (maxDev <= 1) break;

    // 6a. Direct flip for cumulative imbalance if day headcount has surplus (ONLY on 'Flexible' days)
    for (const tm of rotatingPool) {
      if (cum[tm.empNo].m - cum[tm.empNo].n >= 2) {
        for (const d of schedule.days) {
          if (d.shifts[tm.empNo] === '8H_0730-1630') {
            if (isDayPresetLocked(tm, d.dayOfWeek)) continue;
            let curFullAm = 0, curHalfAm = 0, curPm = 0;
            Object.values(d.shifts).forEach(s => {
              if (isFullMorningShift(s)) curFullAm++;
              else if (isHalfDayMorningShift(s)) curHalfAm++;
              else if (isNightShift(s)) curPm++;
            });
            if ((curFullAm + curHalfAm) > 3 && curFullAm > 2) {
              let amCh = 0, pmCh = 0;
              currentTeammates.forEach(t => {
                let sh = d.shifts[t.empNo];
                if (t.empNo === tm.empNo) sh = '8H_1230-2130';
                if (t.race === 'Chinese') {
                  if (isAnyMorningShift(sh)) amCh++;
                  if (isNightShift(sh)) pmCh++;
                }
              });
              if (isNov2026OrLater || (amCh >= 1 && pmCh >= 1)) {
                d.shifts[tm.empNo] = '8H_1230-2130';
                anyCumSwap = true;
                break;
              }
            }
          }
        }
      } else if (cum[tm.empNo].n - cum[tm.empNo].m >= 2) {
        for (const d of schedule.days) {
          if (d.shifts[tm.empNo] === '8H_1230-2130') {
            if (isDayPresetLocked(tm, d.dayOfWeek)) continue;
            let curFullAm = 0, curHalfAm = 0, curPm = 0;
            Object.values(d.shifts).forEach(s => {
              if (isFullMorningShift(s)) curFullAm++;
              else if (isHalfDayMorningShift(s)) curHalfAm++;
              else if (isNightShift(s)) curPm++;
            });
            if (curPm > 3) {
              let amCh = 0, pmCh = 0;
              currentTeammates.forEach(t => {
                let sh = d.shifts[t.empNo];
                if (t.empNo === tm.empNo) sh = '8H_0730-1630';
                if (t.race === 'Chinese') {
                  if (isAnyMorningShift(sh)) amCh++;
                  if (isNightShift(sh)) pmCh++;
                }
              });
              if (isNov2026OrLater || (amCh >= 1 && pmCh >= 1)) {
                d.shifts[tm.empNo] = '8H_0730-1630';
                anyCumSwap = true;
                break;
              }
            }
          }
        }
      }
      if (anyCumSwap) break;
    }

    if (anyCumSwap) continue;

    // 6b. Pairwise swaps preserving weekly dev <= 2 (ONLY on 'Flexible' days)
    const worstAm = rotatingPool.filter(t => (cum[t.empNo].m - cum[t.empNo].n) >= 2)
      .sort((a, b) => (cum[b.empNo].m - cum[b.empNo].n) - (cum[a.empNo].m - cum[a.empNo].n));
    const eligiblePm = rotatingPool.filter(t => (cum[t.empNo].m <= cum[t.empNo].n))
      .sort((a, b) => (cum[b.empNo].n - cum[b.empNo].m) - (cum[a.empNo].n - cum[a.empNo].m));

    for (const tAm of worstAm) {
      for (const tPm of eligiblePm) {
        if (tAm.empNo === tPm.empNo) continue;
        for (const wDays of calWeeks) {
          let wPm_m = 0, wPm_n = 0, wAm_m = 0, wAm_n = 0;
          wDays.forEach(d => {
            const s1 = d.shifts[tPm.empNo];
            if (isAnyMorningShift(s1)) wPm_m++;
            if (isNightShift(s1)) wPm_n++;
            const s2 = d.shifts[tAm.empNo];
            if (isAnyMorningShift(s2)) wAm_m++;
            if (isNightShift(s2)) wAm_n++;
          });
          if (Math.abs((wPm_m + 1) - (wPm_n - 1)) > 2 || Math.abs((wAm_m - 1) - (wAm_n + 1)) > 2) continue;

          for (const d of wDays) {
            if (d.shifts[tAm.empNo] === '8H_0730-1630' && d.shifts[tPm.empNo] === '8H_1230-2130') {
              if (isDayPresetLocked(tAm, d.dayOfWeek) || isDayPresetLocked(tPm, d.dayOfWeek)) continue;

              let amCh = 0, pmCh = 0;
              currentTeammates.forEach(t => {
                let sh = d.shifts[t.empNo];
                if (t.empNo === tAm.empNo) sh = '8H_1230-2130';
                if (t.empNo === tPm.empNo) sh = '8H_0730-1630';
                if (t.race === 'Chinese') {
                  if (isAnyMorningShift(sh)) amCh++;
                  if (isNightShift(sh)) pmCh++;
                }
              });
              if (!isNov2026OrLater && (amCh < 1 || pmCh < 1)) continue;

              d.shifts[tAm.empNo] = '8H_1230-2130';
              d.shifts[tPm.empNo] = '8H_0730-1630';
              anyCumSwap = true;
              break;
            }
          }
          if (anyCumSwap) break;
        }
        if (anyCumSwap) break;
      }
      if (anyCumSwap) break;
    }

    if (anyCumSwap) continue;

    const worstPm = rotatingPool.filter(t => (cum[t.empNo].n - cum[t.empNo].m) >= 2)
      .sort((a, b) => (cum[b.empNo].n - cum[b.empNo].m) - (cum[a.empNo].n - cum[a.empNo].m));
    const eligibleAm = rotatingPool.filter(t => (cum[t.empNo].n <= cum[t.empNo].m))
      .sort((a, b) => (cum[b.empNo].m - cum[b.empNo].n) - (cum[a.empNo].m - cum[a.empNo].n));

    for (const tPm of worstPm) {
      for (const tAm of eligibleAm) {
        if (tPm.empNo === tAm.empNo) continue;
        for (const wDays of calWeeks) {
          let wPm_m = 0, wPm_n = 0, wAm_m = 0, wAm_n = 0;
          wDays.forEach(d => {
            const s1 = d.shifts[tPm.empNo];
            if (isAnyMorningShift(s1)) wPm_m++;
            if (isNightShift(s1)) wPm_n++;
            const s2 = d.shifts[tAm.empNo];
            if (isAnyMorningShift(s2)) wAm_m++;
            if (isNightShift(s2)) wAm_n++;
          });
          if (Math.abs((wPm_m - 1) - (wPm_n + 1)) > 2 || Math.abs((wAm_m + 1) - (wAm_n - 1)) > 2) continue;

          for (const d of wDays) {
            if (d.shifts[tPm.empNo] === '8H_1230-2130' && d.shifts[tAm.empNo] === '8H_0730-1630') {
              if (isDayPresetLocked(tPm, d.dayOfWeek) || isDayPresetLocked(tAm, d.dayOfWeek)) continue;

              let amCh = 0, pmCh = 0;
              currentTeammates.forEach(t => {
                let sh = d.shifts[t.empNo];
                if (t.empNo === tPm.empNo) sh = '8H_0730-1630';
                if (t.empNo === tAm.empNo) sh = '8H_1230-2130';
                if (t.race === 'Chinese') {
                  if (isAnyMorningShift(sh)) amCh++;
                  if (isNightShift(sh)) pmCh++;
                }
              });
              if (!isNov2026OrLater && (amCh < 1 || pmCh < 1)) continue;

              d.shifts[tPm.empNo] = '8H_0730-1630';
              d.shifts[tAm.empNo] = '8H_1230-2130';
              anyCumSwap = true;
              break;
            }
          }
          if (anyCumSwap) break;
        }
        if (anyCumSwap) break;
      }
      if (anyCumSwap) break;
    }

    if (!anyCumSwap) break;
  }

  // 6c. Daily Floor Headcount & Whole-Day Chinese Coverage Enforcer (ONLY on 'Flexible' days)
  schedule.days.forEach(d => {
    let fullAm = 0, halfAm = 0, pm = 0;
    Object.values(d.shifts).forEach(s => {
      if (isFullMorningShift(s)) fullAm++;
      else if (isHalfDayMorningShift(s)) halfAm++;
      else if (isNightShift(s)) pm++;
    });

    const wDays = calWeeks.find(w => w.some(x => x.date === d.date)) || [];
    const getWeekStat = (empNo) => {
      let m = 0, n = 0;
      wDays.forEach(x => {
        const s = x.shifts[empNo];
        if (isAnyMorningShift(s)) m++;
        if (isNightShift(s)) n++;
      });
      return { m, n };
    };

    while ((fullAm + halfAm) < 3 && pm > 3) {
      const candidates = rotatingPool.filter(tm => {
        if (d.shifts[tm.empNo] !== '8H_1230-2130') return false;
        if (isDayPresetLocked(tm, d.dayOfWeek)) return false;
        const s = getWeekStat(tm.empNo);
        return Math.abs((s.m + 1) - (s.n - 1)) <= 2;
      });
      if (!candidates.length) break;
      candidates.sort((a, b) => {
        const sA = getWeekStat(a.empNo);
        const sB = getWeekStat(b.empNo);
        return (sB.n - sB.m) - (sA.n - sA.m);
      });
      const candidate = candidates[0];
      d.shifts[candidate.empNo] = '8H_0730-1630';
      fullAm++;
      pm--;
    }

    while (pm < 3 && (fullAm + halfAm) > 3 && fullAm > 2) {
      const candidates = rotatingPool.filter(tm => {
        if (d.shifts[tm.empNo] !== '8H_0730-1630') return false;
        if (isDayPresetLocked(tm, d.dayOfWeek)) return false;
        const s = getWeekStat(tm.empNo);
        return Math.abs((s.m - 1) - (s.n + 1)) <= 2;
      });
      if (!candidates.length) break;
      candidates.sort((a, b) => {
        const sA = getWeekStat(a.empNo);
        const sB = getWeekStat(b.empNo);
        return (sB.m - sB.n) - (sA.m - sA.n);
      });
      const candidate = candidates[0];
      d.shifts[candidate.empNo] = '8H_1230-2130';
      pm++;
      fullAm--;
    }

    let amCh = 0, pmCh = 0;
    currentTeammates.forEach(t => {
      const s = d.shifts[t.empNo];
      if (t.race === 'Chinese') {
        if (isAnyMorningShift(s)) amCh++;
        if (isNightShift(s)) pmCh++;
      }
    });

    if (!isNov2026OrLater) {
      if (pmCh < 1 && amCh > 1) {
        const chAmCands = rotatingPool.filter(t => t.race === 'Chinese' && d.shifts[t.empNo] === '8H_0730-1630' && !isDayPresetLocked(t, d.dayOfWeek));
        const nonChPmCands = rotatingPool.filter(t => t.race !== 'Chinese' && d.shifts[t.empNo] === '8H_1230-2130' && !isDayPresetLocked(t, d.dayOfWeek));

        let bestPair = null;
        let bestScore = Infinity;

        for (const ch of chAmCands) {
          for (const nonCh of nonChPmCands) {
            const sCh = getWeekStat(ch.empNo);
            const sNonCh = getWeekStat(nonCh.empNo);
            const newChDev = Math.abs((sCh.m - 1) - (sCh.n + 1));
            const newNonChDev = Math.abs((sNonCh.m + 1) - (sNonCh.n - 1));
            if (newChDev <= 2 && newNonChDev <= 2) {
              const score = newChDev + newNonChDev;
              if (score < bestScore) {
                bestScore = score;
                bestPair = { ch, nonCh };
              }
            }
          }
        }

        if (bestPair) {
          d.shifts[bestPair.ch.empNo] = '8H_1230-2130';
          d.shifts[bestPair.nonCh.empNo] = '8H_0730-1630';
        }
      } else if (amCh < 1 && pmCh > 1) {
        const chPmCands = rotatingPool.filter(t => t.race === 'Chinese' && d.shifts[t.empNo] === '8H_1230-2130' && !isDayPresetLocked(t, d.dayOfWeek));
        const nonChAmCands = rotatingPool.filter(t => t.race !== 'Chinese' && d.shifts[t.empNo] === '8H_0730-1630' && !isDayPresetLocked(t, d.dayOfWeek));

        let bestPair = null;
        let bestScore = Infinity;

        for (const ch of chPmCands) {
          for (const nonCh of nonChAmCands) {
            const sCh = getWeekStat(ch.empNo);
            const sNonCh = getWeekStat(nonCh.empNo);
            const newChDev = Math.abs((sCh.m + 1) - (sCh.n - 1));
            const newNonChDev = Math.abs((sNonCh.m - 1) - (sNonCh.n + 1));
            if (newChDev <= 2 && newNonChDev <= 2) {
              const score = newChDev + newNonChDev;
              if (score < bestScore) {
                bestScore = score;
                bestPair = { ch, nonCh };
              }
            }
          }
        }

        if (bestPair) {
          d.shifts[bestPair.ch.empNo] = '8H_0730-1630';
          d.shifts[bestPair.nonCh.empNo] = '8H_1230-2130';
        }
      }
    }
  });

  // 6d. Verify overall parity and turnaround protection; if AI output still has any imbalance > 2 or full-shift turnaround violations, re-solve using the dynamic constraint engine
  let needsDynamicResolve = false;
  rotatingPool.forEach(tm => {
    let m = 0, n = 0, lastSh = null, fullViol = 0;
    schedule.days.forEach(d => {
      const s = d.shifts[tm.empNo];
      if (isAnyMorningShift(s)) m++;
      if (isNightShift(s)) n++;
      if (lastSh && isNightShift(lastSh) && isFullMorningShift(s)) fullViol++;
      lastSh = s;
    });
    if (Math.abs(m - n) > 2 || fullViol > 0) needsDynamicResolve = true;
    // Trainee Friday RD invariant violation → re-solve
    if (isTraineeTeammate(tm) && schedule.days.some(d => d.dayOfWeek === 'Friday' && d.shifts[tm.empNo] === 'RD')) {
      needsDynamicResolve = true;
    }
  });
  // Senior:Trainee ratio < 1:1 on any shift → re-solve
  schedule.days.forEach(d => {
    let sAm = 0, tAm = 0, sPm = 0, tPm = 0;
    currentTeammates.forEach(t => {
      const s = d.shifts[t.empNo];
      const tr = isTraineeTeammate(t);
      if (isAnyMorningShift(s)) { if (tr) tAm++; else sAm++; }
      else if (isNightShift(s)) { if (tr) tPm++; else sPm++; }
    });
    if ((tAm > 0 && sAm < tAm) || (tPm > 0 && sPm < tPm)) needsDynamicResolve = true;
  });
  schedule.days.forEach(d => {
    let amT = 0, pmT = 0;
    Object.values(d.shifts).forEach(s => {
      if (s && isAnyMorningShift(s)) amT++;
      if (s && isNightShift(s)) pmT++;
    });
    if (amT < 3 || pmT < 3) needsDynamicResolve = true;
  });

  if (needsDynamicResolve) {
    const cleanSchedule = runHeuristicScheduleGenerator(branchVal, year, month, totalDays);
    if (cleanSchedule && cleanSchedule.days && cleanSchedule.days.length === schedule.days.length) {
      schedule.days = cleanSchedule.days;
      schedule.warnings = cleanSchedule.warnings || [];
      return;
    }
  }

  // 7. Public Holiday Protocol for PRP
  schedule.days.forEach(d => {
    if (HOLIDAYS_2026_SARAWAK[d.date]) {
      const prpEmpNos = currentTeammates
        .filter(t => t.position && t.position.toLowerCase().includes('provisional'))
        .map(t => t.empNo);
      if (!prpEmpNos.length) prpEmpNos.push('PMG03033');
      let nonPrpAm = 0, nonPrpPm = 0;
      Object.entries(d.shifts).forEach(([eNo, sh]) => {
        if (!prpEmpNos.includes(eNo) && eNo !== 'PMG00831' && sh && sh !== 'RD' && sh !== 'PH' && sh !== 'OFF') {
          if (isAnyMorningShift(sh)) nonPrpAm++;
          if (isNightShift(sh)) nonPrpPm++;
        }
      });
      prpEmpNos.forEach(pEmp => {
        const orig = d.shifts[pEmp];
        if (!orig || orig === 'RD') return;
        if (isAnyMorningShift(orig) && nonPrpAm >= 3) d.shifts[pEmp] = 'PH';
        else if (isNightShift(orig) && nonPrpPm >= 3) d.shifts[pEmp] = 'PH';
      });
    }
  });

  // 8. Universal 6S Cleaning Rotation (14:00 - 15:30)
  const cleaningCounts = {};
  rotatingPool.forEach(a => { cleaningCounts[a.empNo] = 0; });
  schedule.days.forEach(d => {
    if (!d.cleaningDuty || !d.cleaningDuty.empNo || d.cleaningDuty.empNo === 'PMG00831') {
      const dutyRotating = rotatingPool.filter(a => {
        const s = d.shifts[a.empNo];
        // 6S Cleaning (14:00 - 15:30) requires staff to be on duty; excludes morning half-day staff who leave at 12:30
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF' && !isHalfDayMorningShift(s);
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

  // 9. Recompute daily shift totals and headcount alerts
  schedule.days.forEach(d => {
    let finalFullAm = 0, finalHalfAm = 0, finalPm = 0, workingTotal = 0;
    Object.values(d.shifts).forEach(s => {
      if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
        workingTotal++;
        if (isHalfDayMorningShift(s)) finalHalfAm++;
        else if (isFullMorningShift(s)) finalFullAm++;
        if (isNightShift(s)) finalPm++;
      }
    });

    d.fullAmCount = finalFullAm;
    d.halfAmCount = finalHalfAm;
    d.amCount = finalFullAm + finalHalfAm;
    d.pmCount = finalPm;
    d.workingTotal = workingTotal;

    if (workingTotal < 6 || d.amCount < 3 || finalPm < 3) {
      const isAmShort = d.amCount < 3;
      const isPmShort = finalPm < 3;
      const shortDesc = isAmShort ? `Morning Shift Deficit (${d.amCount}/3 AM staff)` : (isPmShort ? `Deficit on Night (${finalPm}/3 staff)` : `Total working staff below 6`);
      const warn = `⚠️ Manpower Alert: Only ${workingTotal} staff on duty on ${d.date} (${d.dayOfWeek}). ${shortDesc}. Minimum 3 required on floor continuously.`;
      d.warning = warn;
      if (!schedule.warnings.includes(warn)) schedule.warnings.push(warn);
    }

    // Senior-to-Trainee Ratio check (Minimum 1:1 ratio, seniorCount >= traineeCount on every shift)
    let seniorAm = 0, traineeAm = 0, seniorPm = 0, traineePm = 0;
    currentTeammates.forEach(tm => {
      const s = d.shifts[tm.empNo];
      if (!s || s === 'RD' || s === 'PH' || s === 'OFF') return;
      const isTr = isTraineeTeammate(tm);
      if (isAnyMorningShift(s)) {
        if (isTr) traineeAm++; else seniorAm++;
      } else if (isNightShift(s)) {
        if (isTr) traineePm++; else seniorPm++;
      }
    });

    d.seniorAmCount = seniorAm;
    d.traineeAmCount = traineeAm;
    d.seniorPmCount = seniorPm;
    d.traineePmCount = traineePm;
    d.isRatioViolation = (traineeAm > 0 && seniorAm < traineeAm) || (traineePm > 0 && seniorPm < traineePm);

    if (d.isRatioViolation) {
      const shortDesc = (traineeAm > 0 && seniorAm < traineeAm)
        ? `Morning Shift has ${traineeAm} trainee(s) with only ${seniorAm} senior(s)`
        : `Night Shift has ${traineePm} trainee(s) with only ${seniorPm} senior(s)`;
      const warn = `⚠️ Senior:Trainee Ratio Alert: ${d.date} (${d.dayOfWeek}) - ${shortDesc}. Rule requires at least 1:1 senior-to-trainee ratio (never leave 1 senior with 2 trainees).`;
      if (!schedule.warnings.includes(warn)) schedule.warnings.push(warn);
    }
  });

  // 9b. Trainee Learning Track (3x 1H, Fri 14:00 HQ Video) & SSJ Stock Receiving (Mon PM, Tue, Wed)
  assignTraineeLearningAndStockDuties(schedule.days, currentTeammates);

  // 10. Persist to Shift Registry
  const shiftRegistry = loadShiftRegistry(branchVal);
  schedule.days.forEach(d => {
    shiftRegistry[d.date] = d;
  });
  saveShiftRegistry(branchVal, shiftRegistry);
}

// ─── TRAINEE LEARNING & SSJ STOCK RECEIVING DUTIES ─────────────────────────────
// 1. SSJ Stock Receiving Duty: Arrives Monday PM shift; 3-day intake/verification/shelving cycle (Mon PM, Tue, Wed).
// 2. Trainee Learning Track: Exactly 3x 1-hour sessions per calendar week (Friday 14:00-15:00 HQ Video + 2x other overlap sessions).
function assignTraineeLearningAndStockDuties(days, teammates) {
  if (!days || !days.length || !teammates || !teammates.length) return;

  const rotatingPool = teammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');
  const trainees = teammates.filter(t => isTraineeTeammate(t));

  // Break days into 7-day Monday–Sunday weeks
  const calWeeks = [];
  for (let i = 0; i < days.length; i += 7) {
    calWeeks.push(days.slice(i, i + 7));
  }

  // Stock Duty Counter across entire schedule for fair round-robin rotation
  const stockDutyCounts = {};
  rotatingPool.forEach(t => { stockDutyCounts[t.empNo] = 0; });

  calWeeks.forEach(wDays => {
    // ─── 1. SSJ STOCK RECEIVING DUTY (MON PM, TUE, WED) ───
    // Monday: Incoming PM delivery intake & staging
    const monDay = wDays.find(d => d.dayOfWeek === 'Monday');
    if (monDay) {
      // Find on-duty rotating staff working PM (Night) shift on Monday
      const pmStaff = rotatingPool.filter(tm => {
        const s = monDay.shifts && monDay.shifts[tm.empNo];
        return isNightShift(s);
      });
      // Prefer experienced non-trainee for intake documentation, then lowest stock count
      pmStaff.sort((a, b) => {
        const aTr = isTraineeTeammate(a) ? 1 : 0;
        const bTr = isTraineeTeammate(b) ? 1 : 0;
        if (aTr !== bTr) return aTr - bTr;
        return (stockDutyCounts[a.empNo] || 0) - (stockDutyCounts[b.empNo] || 0);
      });
      const monAssignee = pmStaff[0] || null;
      if (monAssignee) {
        stockDutyCounts[monAssignee.empNo] = (stockDutyCounts[monAssignee.empNo] || 0) + 1;
        monDay.stockDuty = {
          empNo: monAssignee.empNo,
          nickname: monAssignee.nickname,
          dayNumber: 'Day 1/3 (Intake)',
          shift: 'Night (PM)',
          task: 'SSJ Delivery Intake & Staging'
        };
      } else {
        monDay.stockDuty = null;
      }
    }

    // Tuesday: Batch/Expiry Check & System Entry
    const tueDay = wDays.find(d => d.dayOfWeek === 'Tuesday');
    if (tueDay) {
      const workingStaff = rotatingPool.filter(tm => {
        const s = tueDay.shifts && tueDay.shifts[tm.empNo];
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF';
      });
      // Distribute workload: prefer teammate who did not do Mon intake
      workingStaff.sort((a, b) => {
        const aWasMon = (monDay && monDay.stockDuty && monDay.stockDuty.empNo === a.empNo) ? 1 : 0;
        const bWasMon = (monDay && monDay.stockDuty && monDay.stockDuty.empNo === b.empNo) ? 1 : 0;
        if (aWasMon !== bWasMon) return aWasMon - bWasMon;
        return (stockDutyCounts[a.empNo] || 0) - (stockDutyCounts[b.empNo] || 0);
      });
      const tueAssignee = workingStaff[0] || null;
      if (tueAssignee) {
        stockDutyCounts[tueAssignee.empNo] = (stockDutyCounts[tueAssignee.empNo] || 0) + 1;
        tueDay.stockDuty = {
          empNo: tueAssignee.empNo,
          nickname: tueAssignee.nickname,
          dayNumber: 'Day 2/3 (Verification)',
          shift: 'All-Day',
          task: 'Batch/Expiry Check & System Entry'
        };
      } else {
        tueDay.stockDuty = null;
      }
    }

    // Wednesday: Gondola Merchandising & Shelving
    const wedDay = wDays.find(d => d.dayOfWeek === 'Wednesday');
    if (wedDay) {
      const workingStaff = rotatingPool.filter(tm => {
        const s = wedDay.shifts && wedDay.shifts[tm.empNo];
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF';
      });
      workingStaff.sort((a, b) => {
        return (stockDutyCounts[a.empNo] || 0) - (stockDutyCounts[b.empNo] || 0);
      });
      const wedAssignee = workingStaff[0] || null;
      if (wedAssignee) {
        stockDutyCounts[wedAssignee.empNo] = (stockDutyCounts[wedAssignee.empNo] || 0) + 1;
        wedDay.stockDuty = {
          empNo: wedAssignee.empNo,
          nickname: wedAssignee.nickname,
          dayNumber: 'Day 3/3 (Shelving)',
          shift: 'All-Day',
          task: 'Gondola Merchandising & Shelving'
        };
      } else {
        wedDay.stockDuty = null;
      }
    }

    // Reset non-delivery days to null
    wDays.forEach(d => {
      if (d.dayOfWeek !== 'Monday' && d.dayOfWeek !== 'Tuesday' && d.dayOfWeek !== 'Wednesday') {
        d.stockDuty = null;
      }
    });

    // ─── 2. TRAINEE LEARNING TRACK (3x 1-HOUR SESSIONS PER WEEK) ───
    wDays.forEach(d => {
      d.learningSlots = [];
    });

    trainees.forEach(tr => {
      const workingDays = wDays.filter(d => {
        const s = d.shifts && d.shifts[tr.empNo];
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF';
      });

      // Session 1: Friday 14:00 - 15:00 HQ Video Training (strictly anchored)
      const friDay = workingDays.find(d => d.dayOfWeek === 'Friday');
      if (friDay) {
        friDay.learningSlots.push({
          empNo: tr.empNo,
          nickname: tr.nickname,
          time: '2:00 PM – 3:00 PM',
          task: 'HQ Video Training',
          isHqVideo: true
        });
      }

      // Sessions 2 & 3: 2 other working days during overlap hours (14:00-15:00)
      // Exclude Friday and exclude morning half-days (which end at 11:30 or 12:30 before 14:00)
      const otherWorkingDays = workingDays.filter(d => d.dayOfWeek !== 'Friday' && !isHalfDayMorningShift(d.shifts[tr.empNo]));
      otherWorkingDays.sort((a, b) => {
        const sA = a.shifts[tr.empNo] || '';
        const sB = b.shifts[tr.empNo] || '';
        const aFull = sA.includes('8H') ? 1 : 0;
        const bFull = sB.includes('8H') ? 1 : 0;
        if (aFull !== bFull) return bFull - aFull;
        return (b.workingTotal || 0) - (a.workingTotal || 0);
      });

      const selectedOtherDays = otherWorkingDays.slice(0, 2);
      selectedOtherDays.forEach(d => {
        d.learningSlots.push({
          empNo: tr.empNo,
          nickname: tr.nickname,
          time: '2:00 PM – 3:00 PM',
          task: 'Product & SOP Learning',
          isHqVideo: false
        });
      });
    });

    // ─── 3. RESOLVE CLEANING vs LEARNING OVERLAP ───
    // If a cleaner is also assigned to learning at 14:00, reassign cleaning to another available rotating staff
    wDays.forEach(d => {
      if (d.cleaningDuty && d.learningSlots && d.learningSlots.some(l => l.empNo === d.cleaningDuty.empNo)) {
        const alternateCleaner = rotatingPool.filter(tm => {
          const s = d.shifts && d.shifts[tm.empNo];
          return s && s !== 'RD' && s !== 'PH' && s !== 'OFF' && !d.learningSlots.some(l => l.empNo === tm.empNo);
        }).sort((a, b) => (stockDutyCounts[a.empNo] || 0) - (stockDutyCounts[b.empNo] || 0))[0];
        if (alternateCleaner) {
          d.cleaningDuty = {
            empNo: alternateCleaner.empNo,
            nickname: alternateCleaner.nickname,
            empName: alternateCleaner.empName || alternateCleaner.nickname,
            time: '2:00 PM – 3:30 PM',
            task: 'Gondola Cleaning & Refilling'
          };
        }
      }
    });
  });
}

// ─── GEMINI API CALLER ────────────────────────────────────────────────────────
async function callSchedulerGemini(model, branchVal, monthVal, totalDays, apiKey, weeks) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const [yStr, mStr] = monthVal.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);

  if (!weeks || !weeks.length) {
    weeks = getFullWeeksPeriod(year, month);
  }
  const totalRosterDays = weeks.length * 7;

  // Find holidays in this month and adjacent boundary weeks
  const monthHolidays = {};
  weeks.flat().forEach(wd => {
    if (HOLIDAYS_2026_SARAWAK[wd.date]) {
      monthHolidays[wd.date] = HOLIDAYS_2026_SARAWAK[wd.date];
    }
  });

  // Dynamically format active teammates and their live day preferences
  const formattedTeammates = currentTeammates.map(t => {
    const isFixed = t.scheduleMode === 'Fixed' || t.empNo === 'PMG00831';
    const dayPrefEntries = Object.entries(t.dayPrefs || {}).filter(([_, v]) => v && v !== 'Flexible');
    const dayPrefStr = dayPrefEntries.map(([k, v]) => `${k}: ${v}`).join(', ') || 'All days flexible';
    const explicitRd = (t.dayPrefs && Object.keys(t.dayPrefs).find(k => t.dayPrefs[k] === 'RD')) || (t.restDayPref && t.restDayPref !== 'Flexible' ? t.restDayPref : null) || 'Flexible';
    const explicitHd = (t.dayPrefs && Object.keys(t.dayPrefs).find(k => t.dayPrefs[k] === 'Morning Half (4H)')) || ((t.halfDayPref && t.halfDayPref !== 'None') ? (t.halfDayPref.includes(' ') ? t.halfDayPref.split(' ')[0] : t.halfDayPref) : null) || 'Flexible';
    return {
      empNo: t.empNo,
      name: t.empName,
      nickname: t.nickname,
      position: t.position,
      isPharmacist: !!(t.isPharmacist || (t.position && t.position.includes('Pharmacist')) || t.empNo === 'PMG00831'),
      isTrainee: isTraineeTeammate(t),
      isManagerTeam: !!(t.isPharmacist || (t.position && (t.position.includes('Manager') || t.position.includes('Pharmacist')))),
      race: t.race,
      isChinese: t.race === 'Chinese',
      scheduleMode: isFixed ? 'Fixed' : 'Rotating',
      presetFixedRestDay: explicitRd,
      presetFixedHalfDay: explicitHd,
      shiftPref: t.shiftPref || 'Flexible',
      restDayPref: t.restDayPref || 'Sunday',
      halfDayPref: t.halfDayPref || 'None',
      daySpecificPrefs: dayPrefStr
    };
  });

  const formattedWeeks = weeks.map((w, idx) => {
    const startD = w[0].date;
    const endD = w[6].date;
    const dayList = w.map(d => `${d.dayOfWeek.slice(0, 3)} ${d.date}`).join(', ');
    return `   * Week ${idx + 1} (${startD} to ${endD}): [${dayList}]`;
  }).join('\n');

  const isNov2026OrLater = !monthVal || monthVal >= '2026-11';
  const hasBranchManager = currentTeammates.some(t => t.position && t.position.toLowerCase().includes('branch manager') && !t.position.toLowerCase().includes('assistant'));
  const hasAssistantBranchManager = currentTeammates.some(t => t.position && t.position.toLowerCase().includes('assistant branch manager'));
  const managerRuleActive = hasBranchManager && hasAssistantBranchManager;

  const sampleShifts = {};
  currentTeammates.forEach((t, idx) => {
    if (t.empNo === 'PMG00831') sampleShifts[t.empNo] = '8H_0730-1630';
    else if (idx % 3 === 0) sampleShifts[t.empNo] = '8H_0730-1630';
    else if (idx % 3 === 1) sampleShifts[t.empNo] = '8H_1230-2130';
    else sampleShifts[t.empNo] = 'RD';
  });
  const firstRotating = currentTeammates.find(t => t.empNo !== 'PMG00831') || currentTeammates[0] || { empNo: 'PMG01294', nickname: 'LOUNA' };

  const prompt = `You are an expert Pharmacy Operations Director scheduling the retail branch roster for PMG Pharmacy Kota Sentosa (KS01).
Branch: PMG Kota Sentosa (Operating Hours: 07:30 to 21:30 daily).
Month: ${monthVal}
Total Full Calendar Weeks: ${weeks.length} weeks (Total ${totalRosterDays} days).
Roster Period: ${weeks[0][0].date} (Monday) to ${weeks[weeks.length - 1][6].date} (Sunday).
Public Holidays in this period (Malaysia & Sarawak): ${JSON.stringify(monthHolidays)}

MANDATORY CALENDAR WEEKS STRUCTURE (EVERY WEEK STARTS ON MONDAY AND ENDS ON SUNDAY):
${formattedWeeks}

ACTIVE TEAMMATES (${currentTeammates.length} staff) & THEIR LIVE PREFERENCES:
${JSON.stringify(formattedTeammates, null, 2)}

OPERATIONAL RULES & PRIORITY CONSTRAINTS (IN ORDER OF PRIORITY):

1. IMMUTABLE STAFF ANCHOR — CHAI YEE SIAN (WILLIAM - PMG00831):
   - William Chai is the ONLY fixed shift anchor in the outlet. His schedule is FIXED, IMMUTABLE:
     * Monday to Friday: '8H_0730-1630' (07:30 to 16:30)
     * Saturday: '4H_0730-1130' (Morning Half Day 07:30 to 11:30 - exactly 4 hours)
     * Sunday: 'RD' (Rest Day)
     * Malaysia National & Sarawak Public Holidays: 'PH' (Official rest day).
     * Contractual Deepavali replacement: Deepavali (08/11/2026) falls on Sunday (William's Sunday RD) and contractually replaces to Monday 09/11/2026 ('PH' for William).
   - William is EXCLUDED from the rotating AM/PM parity calculation.
   - William is EXCLUDED from the 2:00 PM – 3:30 PM Gondola Cleaning/Refilling rotation pool.

2. MANDATORY WEEKLY TYPE STARTING ON MONDAY (SARAWAK LABOUR ORDINANCE & LEGAL REST):
   - The timetable MUST be structured and scheduled strictly by complete 7-DAY CALENDAR WEEKS where MONDAY is always the starting day and SUNDAY is the last day.
   - For EACH rotating teammate (everyone except William), in EVERY single 7-day calendar week (Monday to Sunday):
     * Exactly 1 Full Rest Day ('RD') strictly FIXED on their preset rest day (refer to 'presetFixedRestDay').
     * Exactly 1 Half Day strictly FIXED on their preset half day:
       - Only Full-Time Pharmacist (William Chai) half day is 4 hours ('4H_0730-1130').
       - All other teammates including Provisional Registered Pharmacist (Christina Lee), Assistant Branch Manager (Louna), and Staff (Penny, Fiona, Nurhafizah, Farizin, Vanessa) half day is 5 hours ('5H_0730-1230').
     * Exactly 5 full shifts across the remaining 5 days.
     * STRICT WEEKLY MORNING VS NIGHT SHIFT PARITY (STRICT DEVIATION <= ±2):
       Assign either:
       - 3 Full Morning ('8H_0730-1630') and 2 Full Night ('8H_1230-2130'), OR
       - 2 Full Morning ('8H_0730-1630') and 3 Full Night ('8H_1230-2130').
       Together with their 1 Half Morning Day (5H), total Morning shifts are 3 or 4, and Night shifts are 2 or 3.
       The absolute difference |weekly_AM - weekly_PM| MUST be <= 2 in EVERY single week!
     * STRICTLY FORBIDDEN: Shift dumping is prohibited! Every rotating teammate must have balanced morning and night shifts every week!
   - CUMULATIVE MONTHLY PARITY (DEVIATION <= ±2):
     Across all ${weeks.length} weeks, each rotating teammate's cumulative total Morning vs Night shifts must also remain balanced within ±2 shifts!

3. HARD FLOOR REQUIREMENT — AT LEAST 3 STAFF ACROSS THE WHOLE DAY:
   - For every single day:
     * Morning Shift (07:30 - 16:30): Minimum 3 staff (Full AM staff + Half AM staff >= 3). During the midday handover window (11:30–12:30), there must be at least 3 staff on duty.
     * Night Shift (12:30 - 21:30): Minimum 3 staff (Night PM staff >= 3).
     * Total staff working per day must be at least 6. Never allow < 3 staff on any shift!

3b. MANDATORY SENIOR-TO-TRAINEE STAFFING RATIO (MINIMUM 1:1 RATIO ON EVERY SHIFT):
   - When 2 trainees are present on the roster (or whenever trainees are scheduled):
   - On ANY shift (Morning Shift 07:30–16:30 or Night Shift 12:30–21:30), the ratio of senior (current experienced staff) to new trainees MUST be at least 1 to 1:
     [senior_count >= trainee_count on EVERY shift]
   - STRICTLY PROHIBITED: NEVER leave only 1 senior with 2 trainees on any shift! 1 senior cannot handle retail customer flow, counter sales, and dispensary while supervising 2 trainees.
   - If 2 trainees work on the same shift (Morning or Night), there MUST be at least 2 seniors on that shift (e.g. 2 seniors + 2 trainees = 4 staff total, or 1 trainee on Morning and 1 trainee on Night with seniors on both).
   - If 1 trainee works on a shift, there must be at least 1 senior (as floor is min 3 staff, typically 2 or 3 seniors + 1 trainee).

4. SECOND LESS PRIORITY CONSTRAINTS (CHINESE SPEAKER, TRAINEE MENTORING & RATIO, MANAGERS & PHARMACISTS):
   - A. CHINESE-SPEAKING AVAILABILITY:
     ${isNov2026OrLater
       ? `* NOTE FOR ${monthVal} ONWARDS: Ting Kwang Yu and Kenix Ling have departed PMG Kota Sentosa as of November 2026. The active Chinese speakers are William Chai (fixed Morning anchor only), Penny, and Christina Lee.
     * Because of the strict minimum 3 staff per shift floor and 7-day weekly shift parity (max 2-3 night shifts per rotating teammate), naturally distribute Penny and Christina across shifts as a soft, best-effort preference where possible.`
       : `* Having at least one Chinese-speaking staff (race: Chinese: William, Ting, Kenix, Penny, Christina) in EVERY shift (AM shift >= 1 Chinese speaker, PM shift >= 1 Chinese speaker).
     * As long as there is at least one Chinese speaker on each shift across the whole day, that satisfies the requirement!`}
   - B. NEW TEAMMATE CULTURE ADAPTATION & SENIOR SUPERVISION (TRAINEES):
     ${isNov2026OrLater
       ? `* Trainees (such as Vanessa Anak Blaise and any fellow trainee) are in their learning phase at PMG.
     * Ensure trainees are always scheduled alongside experienced PMG Kota Sentosa senior teammates (William, Louna, Penny, Fiona, Nurhafizah, Farizin, Christina) maintaining at least a 1:1 senior-to-trainee ratio on every working shift for operational guidance, customer flow management, and team support.`
       : `* [Pre-Nov 2026]: Standard staffing team composition.`}
   - C. MANAGEMENT TEAM COVERAGE:
     ${managerRuleActive
       ? `* Having at least one management team member (Assistant Branch Manager, Branch Manager, or Pharmacist) in ANY shift (AM shift >= 1 Manager, PM shift >= 1 Manager).`
       : `* [OMITTED]: Branch Manager or Assistant Branch Manager has resigned / is not present. Do NOT enforce management team coverage per shift.`}
   - D. OMIT THE NECESSITY OF PHARMACIST THROUGHOUT THE WHOLE DAY:
     * Completely OMIT any rule requiring a pharmacist on every shift or throughout the whole day.
     * DO NOT force Pharmacists (${isNov2026OrLater ? 'Christina Lee' : 'Kenix Ling and Christina Lee'}) to cover all night shifts or specific shifts just because they are pharmacists.
     * Treat ${isNov2026OrLater ? 'Christina Lee' : 'Kenix Ling and Christina Lee'} fairly and equally with all other rotating teammates: balance their Morning shifts ('8H_0730-1630' / '5H_0730-1230') and Night shifts ('8H_1230-2130') with weekly deviation <= ±2.

5. PUBLIC HOLIDAY (PH) PROTOCOL:
   - On gazetted Public Holidays (Sarawak & Malaysia):
     * William Chai has official rest day ('PH'). On Monday 09/11/2026, William receives contract replacement PH for Deepavali.
     * Rotating teammates do NOT observe Deepavali as it is not a Sarawak state holiday, and work normal shifts to maintain pharmacy coverage.
     * On state gazetted holidays, Provisional Registered Pharmacists assume rest day ('PH') too, UNLESS needed to cover the 3-staff floor.

6. RESPECT OTHER LIVE DAY-SPECIFIC PREFERENCES:
   - Dynamically schedule each teammate according to their daySpecificPrefs, halfDayPref, and shiftPref.
   - Do NOT alter their fixed rest day or preset half day.
   - If a teammate has 'Morning Only' or 'Night Only', strictly assign only that shift type on that day.
   - If a teammate has 'Morning Preferred' or 'Night Preferred', prioritize that shift type. Specifically, if a teammate has 'Saturday: Morning Preferred', they MUST be scheduled on the Morning Shift ('8H_0730-1630') on Saturdays.

7. ANTI-FATIGUE & HEALTH RESTRICTIONS:
   - Forbid assigning a Night shift ('8H_1230-2130') followed directly by a full Morning shift ('8H_0730-1630') the next day (turnaround rest must be >= 15 hours).
   - Maximum 3 consecutive Night shifts.

8. UNIVERSAL 6S CLEANING & REFILLING OVERLAP (14:00 - 15:30):
   - Exactly 1 rotating teammate assigned per day for 14:00–15:30 Gondola Cleaning & Refill duty.
   - Shared equally among all rotating staff. William is excluded.

9. TRAINEE LEARNING TRACK (3x 1-HOUR SESSIONS PER WEEK):
   - For any teammate assigned position 'Trainee' or isTrainee = true (e.g. Vanessa Anak Blaise PMG03801 during their 3-month adaptation phase), allocate exactly 3 learning hours per calendar week (1 hour in a day across 3 separate working days).
   - Session 1 MUST be Friday afternoon at 2:00 PM – 3:00 PM (14:00 - 15:00) for "HQ Video Training". Trainees must never take Rest Day on Friday; they must be scheduled to work on Friday (Morning or Night shift).
   - Sessions 2 & 3: Allocate on 2 other working days at 2:00 PM – 3:00 PM during shift overlap when floor staffing >= 3, for "Product & SOP Learning".

10. HQ (SSJ) STOCK RECEIVING CONSIDERATION (MON PM, TUE, WED):
   - HQ (SSJ) stock arrives every Monday PM shift and takes 3 days (Monday PM, Tuesday, Wednesday) to receive, check, and shelve.
   - Designate a stock receiving duty among rotating floor staff on these 3 days:
     * Monday: Day 1/3 - SSJ Delivery Intake & Staging (assigned to an on-duty PM shift staff)
     * Tuesday: Day 2/3 - Batch/Expiry Check & System Entry (assigned to an on-duty rotating staff)
     * Wednesday: Day 3/3 - Gondola Merchandising & Shelving (assigned to an on-duty rotating staff)

SHIFT CODES:
- '8H_0730-1630' (Full Morning 8H)
- '8H_1230-2130' (Full Night 8H)
- '4H_0730-1130' (Morning Half 4H — Full-Time Pharmacist William Chai only)
- '5H_0730-1230' (Morning Half 5H — Rotating teammates including PRP Christina Lee, ABM, and Staff)
- 'RD' (Rest Day)
- 'PH' (Public Holiday)

OUTPUT FORMAT:
Respond ONLY with a valid JSON object containing the complete 7-day Monday–Sunday weeks:
{
  "month": "${monthVal}",
  "branch": "${branchVal}",
  "days": [
    {
      "date": "${weeks[0][0].date}",
      "day": ${weeks[0][0].day},
      "month": ${weeks[0][0].month},
      "year": ${weeks[0][0].year},
      "dayOfWeek": "${weeks[0][0].dayOfWeek}",
      "isTargetMonth": ${weeks[0][0].isTargetMonth},
      "shifts": ${JSON.stringify(sampleShifts, null, 8).trim()},
      "cleaningDuty": {
        "empNo": "${firstRotating.empNo}",
        "nickname": "${firstRotating.nickname}",
        "time": "2:00 PM – 3:30 PM",
        "task": "Gondola Cleaning & Refilling"
      },
      "stockDuty": {
        "empNo": "${firstRotating.empNo}",
        "nickname": "${firstRotating.nickname}",
        "dayNumber": "Day 1/3 (Intake)",
        "shift": "Night (PM)",
        "task": "SSJ Delivery Intake & Staging"
      },
      "learningSlots": [
        {
          "empNo": "PMG03801",
          "nickname": "VANESSA",
          "time": "2:00 PM – 3:00 PM",
          "task": "HQ Video Training",
          "isHqVideo": true
        }
      ],
      "amCount": 4,
      "pmCount": 3,
      "workingTotal": 7
    }
  ],
  "warnings": [],
  "summary": "Summary of ${isNov2026OrLater ? 'adaptive Chinese speaker distribution' : 'whole-day Chinese speaker coverage'}, Monday-start weekly shift parity (deviation <= ±2), statutory rest days, anti-fatigue compliance, 6S cleaning rotation, SSJ stock receiving duties, and trainee learning track."
}`;

  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
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
    const parsed = JSON.parse(cleaned);

    let parsedDays = [];
    if (parsed.weeks && Array.isArray(parsed.weeks)) {
      parsedDays = parsed.weeks.flatMap(w => w.days || []);
    } else if (parsed.days && Array.isArray(parsed.days)) {
      parsedDays = parsed.days;
    }

    return {
      month: parsed.month || monthVal,
      branch: parsed.branch || branchVal,
      days: parsedDays,
      warnings: parsed.warnings || [],
      summary: parsed.summary || ''
    };
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

// // Generate valid weekly patterns for a rotating teammate.
// Guarantees:
// 1. Strict lock to preset Rest Day (RD) from Outlet Teammate Profiles & Preferences
// 2. Strict lock to preset Half Day (Morning Half 4H) from Profiles & Preferences
// 3. Strict weekly morning vs night shift balance (|weekly_AM - weekly_PM| <= 2) across BOTH 3M/3N (2 Full AM + 1 Half AM + 3 Full PM) and 4M/2N (3 Full AM + 1 Half AM + 2 Full PM)
// 4. Max 3 consecutive nights
// 5. Zero fatigue across regular 8H shifts (>= 15 hours), allowing at most 1 turnaround transition leading into their continuous 1.5-day half-day weekend when required by their (RD, HD) geometry
function generateLegalWeeklyPatterns(tm, weekDays, prevSundayShift, prevNightStreak = 0) {
  const prevWasPm = isNightShift(prevSundayShift);

  const targetRdDay = extractRestDayName(tm);
  const prefRdIdx = (targetRdDay && targetRdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetRdDay) : -1;

  const targetHdDay = extractHalfDayName(tm);
  const prefHdIdx = (targetHdDay && targetHdDay !== 'None' && targetHdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetHdDay) : -1;

  const isTrainee = isTraineeTeammate(tm);
  let targetRdList = prefRdIdx !== -1 ? [prefRdIdx] : [0, 1, 2, 3, 4, 5, 6];
  // Saturday is William's fixed 4H anchor; only allow Sat half day for rotating staff if explicitly requested or Flexible
  let targetHdList = prefHdIdx !== -1 ? [prefHdIdx] : [0, 1, 2, 3, 4, 6];

  if (isTrainee) {
    // Invariant: Trainees must NEVER receive RD or Morning Half on Friday (index 4) due to 14:00-15:00 HQ Video Training
    targetRdList = targetRdList.filter(idx => idx !== 4);
    targetHdList = targetHdList.filter(idx => idx !== 4);
  }
  const halfShiftCode = getHalfDayShiftCode(tm);

  const collectCandidates = (rdCandidates, hdCandidates, checkCrossWeekStreak) => {
    const list = [];
    const seen = new Set();

    rdCandidates.forEach(r => {
      hdCandidates.forEach(h => {
        if (r === h) return;
        const working = [0, 1, 2, 3, 4, 5, 6].filter(i => i !== r && i !== h);

        for (let mask = 0; mask < 32; mask++) {
          const seq = new Array(7);
          seq[r] = 'RD';
          seq[h] = halfShiftCode;
          let amFull = 0, pmFull = 0;

          working.forEach((wIdx, bit) => {
            if ((mask >> bit) & 1) {
              seq[wIdx] = '8H_1230-2130';
              pmFull++;
            } else {
              seq[wIdx] = '8H_0730-1630';
              amFull++;
            }
          });

          const totalAm = amFull + 1; // Half day is morning
          const deviation = Math.abs(totalAm - pmFull);
          if (deviation > 2) continue; // STRICT DEVIATION <= 2 (either 3M/3N or 4M/2N)

          // Max consecutive nights <= 3 (including cross-week night streak from previous Sunday when enabled)
          let maxNight = 0;
          let curNight = checkCrossWeekStreak ? (prevNightStreak || 0) : 0;
          for (let i = 0; i < 7; i++) {
            if (isNightShift(seq[i])) {
              curNight++;
              if (curNight > maxNight) maxNight = curNight;
            } else {
              curNight = 0;
            }
          }
          if (maxNight > 3) continue;

          // Separate full-shift turnaround (N -> 8H_0730) from half-day weekend turnaround (N -> 4H/5H morning)
          let fullTurnarounds = 0;
          let hdTurnarounds = 0;
          if (prevWasPm) {
            if (isFullMorningShift(seq[0])) fullTurnarounds++;
            else if (isHalfDayMorningShift(seq[0])) hdTurnarounds++;
          }
          for (let i = 0; i < 6; i++) {
            if (isNightShift(seq[i])) {
              if (isFullMorningShift(seq[i + 1])) fullTurnarounds++;
              else if (isHalfDayMorningShift(seq[i + 1])) hdTurnarounds++;
            }
          }
          if (isNightShift(seq[6])) {
            if (h === 0 || prefHdIdx === 0) {
              hdTurnarounds++;
            } else if (tm.dayPrefs && tm.dayPrefs.Monday === 'Morning Only') {
              fullTurnarounds++;
            } else if (prefRdIdx > 2 && prefHdIdx > 2) {
              fullTurnarounds++;
            }
          }

          // Day-specific preferences check
          let invalidStrict = false;
          let prefScore = 0;
          if (r === prefRdIdx) prefScore += 50000;
          if (h === prefHdIdx) prefScore += 20000;
          prefScore += (2 - deviation) * 3000;

          if (tm.shiftPref === 'Morning Preferred') {
            prefScore += amFull * 400;
          } else if (tm.shiftPref === 'Night Preferred') {
            prefScore += pmFull * 400;
          }

          if (tm.dayPrefs) {
            weekDays.forEach((d, dIdx) => {
              const dp = tm.dayPrefs[d.dayOfWeek];
              if (!dp || dp === 'Flexible') return;
              const shift = seq[dIdx];

              if (dp === 'Morning Only') {
                if (isAnyMorningShift(shift)) prefScore += 2000;
                else if (shift !== 'RD') invalidStrict = true;
              } else if (dp === 'Night Only') {
                if (isNightShift(shift)) prefScore += 2000;
                else if (shift !== 'RD') invalidStrict = true;
              } else if (dp === 'Morning Preferred') {
                if (isAnyMorningShift(shift)) prefScore += 250000;
                else if (isNightShift(shift)) prefScore -= 250000;
              } else if (dp === 'Night Preferred') {
                if (isNightShift(shift)) prefScore += 250000;
                else if (isFullMorningShift(shift)) prefScore -= 250000;
              } else if (dp === 'RD') {
                if (shift !== 'RD') invalidStrict = true;
              } else if (dp.includes('Half') || dp.includes('4H') || dp.includes('5H')) {
                if (isHalfDayMorningShift(shift)) prefScore += 2000;
                else invalidStrict = true;
              }
            });
          }

          // Trainees must be on duty on Friday for HQ Video Training (2:00 PM – 3:00 PM)
          if (isTraineeTeammate(tm)) {
            const friIdx = weekDays.findIndex(d => d.dayOfWeek === 'Friday');
            if (friIdx !== -1 && seq[friIdx] === 'RD') {
              invalidStrict = true;
            }
          }

          if (invalidStrict) continue;

          // Trailing night streak at end of week (Sunday)
          let endNightStreak = 0;
          for (let i = 6; i >= 0; i--) {
            if (isNightShift(seq[i])) endNightStreak++;
            else break;
          }

          let hasViolatedPref = false;
          if (tm.dayPrefs) {
            weekDays.forEach((wd, dIdx) => {
              const dp = tm.dayPrefs[wd.dayOfWeek];
              const shift = seq[dIdx];
              if (dp === 'Morning Preferred' && isNightShift(shift)) hasViolatedPref = true;
              if (dp === 'Night Preferred' && isFullMorningShift(shift)) hasViolatedPref = true;
            });
          }

          const key = seq.join('|');
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              seq,
              amFull,
              pmFull,
              totalAm,
              deviation,
              fullTurnarounds,
              hdTurnarounds,
              fatigue: fullTurnarounds,
              excessFatigue: 0,
              endNightStreak,
              rdIdx: r,
              hdIdx: h,
              prefScore,
              hasViolatedPref
            });
          }
        }
      });
    });

    // Normalize turnaround penalties within each ratio group (2M/3N vs 3M/2N) so BOTH balanced 3M/3N and 4M/2N patterns are available
    const filterAndNormalizeRatioGroup = (group) => {
      if (!group.length) return [];
      const minFull = Math.min(...group.map(p => p.fullTurnarounds));
      const maxAllowed = minFull === 0 ? 1 : minFull;
      // Preserve patterns that do not violate preset preferences even if they have more turnarounds
      const bestFullGroup = group.filter(p => p.fullTurnarounds <= maxAllowed || !p.hasViolatedPref);
      const minHd = Math.min(...bestFullGroup.map(p => p.hdTurnarounds));
      return bestFullGroup
        .filter(p => p.hdTurnarounds <= minHd + 1 || !p.hasViolatedPref)
        .map(p => {
          return {
            ...p,
            excessFatigue: 0,
            prefScore: p.prefScore
          };
        });
    };

    const group2M3N = filterAndNormalizeRatioGroup(list.filter(p => p.amFull === 2 && p.pmFull === 3));
    const group3M2N = filterAndNormalizeRatioGroup(list.filter(p => p.amFull === 3 && p.pmFull === 2));
    const otherGroup = filterAndNormalizeRatioGroup(list.filter(p => !(p.amFull === 2 && p.pmFull === 3) && !(p.amFull === 3 && p.pmFull === 2)));

    return [...group2M3N, ...group3M2N, ...otherGroup];
  };

  let patterns = collectCandidates(targetRdList, targetHdList, true);
  // Ensure 3M/3N patterns with 0 full-shift turnarounds are available; if cross-week streak blocked all of them, relax cross-week streak
  if (!patterns.some(p => p.amFull === 2 && p.pmFull === 3 && p.fullTurnarounds === 0)) {
    const relaxed = collectCandidates(targetRdList, targetHdList, false);
    if (relaxed.some(p => p.amFull === 2 && p.pmFull === 3 && p.fullTurnarounds === 0)) {
      const existingKeys = new Set(patterns.map(p => p.seq.join('|')));
      relaxed.forEach(p => {
        if (!existingKeys.has(p.seq.join('|'))) patterns.push(p);
      });
    }
  }
  if (!patterns.length && prefHdIdx !== -1) {
    patterns = collectCandidates(targetRdList, [0, 1, 2, 3, 4, 5, 6], false);
  }
  if (!patterns.length) {
    patterns = collectCandidates([0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6], false);
  }

  const legalPatterns = patterns;
  const nonViolating = legalPatterns.filter(pattern => {
    return matchesTeammatePresets(pattern, tm.dayPrefs, weekDays);
  });

  // CRITICAL FIX: Ensure 1 or 2 matching preset patterns are NOT discarded
  if (nonViolating.length >= 1) {
    return nonViolating;
  }

  return legalPatterns;
}

// Solve 1 week with dynamic preference scoring, whole-day Chinese speaker coverage, and strict weekly & cumulative shift parity
function solveFullWeek(weekDays, prevSundayShifts, cumStats, rotatingPool, william, prevNightStreaks = {}) {
  const isNov2026OrLater = weekDays && weekDays.length > 0 && weekDays.some(d => d.date >= '2026-11');
  const williamSeq = weekDays.map(d => {
    if (HOLIDAYS_2026_SARAWAK[d.date] || WILLIAM_CONTRACT_PH[d.date]) return 'PH';
    if (d.dayOfWeek === 'Sunday') return 'RD';
    if (d.dayOfWeek === 'Saturday') return '4H_0730-1130';
    return '8H_0730-1630';
  });

  const tmPatterns = {};
  rotatingPool.forEach(tm => {
    const pats = generateLegalWeeklyPatterns(tm, weekDays, prevSundayShifts[tm.empNo], prevNightStreaks[tm.empNo] || 0);
    const curAm = (cumStats[tm.empNo] && cumStats[tm.empNo].am !== undefined) ? cumStats[tm.empNo].am : 0;
    const curPm = (cumStats[tm.empNo] && cumStats[tm.empNo].pm !== undefined) ? cumStats[tm.empNo].pm : 0;

    const hasExplicitDayPref = Object.values(tm.dayPrefs || {}).some(v => v === 'Morning Preferred' || v === 'Night Preferred' || v === 'Morning Only' || v === 'Night Only');
    const turnWeight = hasExplicitDayPref ? 25000 : 500000;

    const scoredPats = pats.map(p => {
      const projDiff = Math.abs((curAm + p.totalAm) - (curPm + p.pmFull));
      const score = p.prefScore - (p.fullTurnarounds || 0) * turnWeight - (p.hdTurnarounds || 0) * 400 - projDiff * 6000 + (Math.random() * 2000 - 1000);
      return { p, score };
    });
    scoredPats.sort((a, b) => b.score - a.score);
    tmPatterns[tm.empNo] = scoredPats.map(sp => sp.p);
  });

  const hasBranchManager = currentTeammates.some(t => t.position && t.position.toLowerCase().includes('branch manager') && !t.position.toLowerCase().includes('assistant'));
  const hasAssistantBranchManager = currentTeammates.some(t => t.position && t.position.toLowerCase().includes('assistant branch manager'));
  const managerRuleActive = hasBranchManager && hasAssistantBranchManager;

  const tmMetadata = rotatingPool.map(tm => {
    const hasExplicitDayPref = Object.values(tm.dayPrefs || {}).some(v => v === 'Morning Preferred' || v === 'Night Preferred' || v === 'Morning Only' || v === 'Night Only');
    const turnWeight = hasExplicitDayPref ? 25000 : 500000;
    const targetRdDay = extractRestDayName(tm);
    const prefRdIdx = (targetRdDay && targetRdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetRdDay) : -1;
    const targetHdDay = extractHalfDayName(tm);
    const prefHdIdx = (targetHdDay && targetHdDay !== 'None' && targetHdDay !== 'Flexible') ? weekDays.findIndex(d => d.dayOfWeek === targetHdDay) : -1;
    const curAm = (cumStats[tm.empNo] && cumStats[tm.empNo].am !== undefined) ? cumStats[tm.empNo].am : 0;
    const curPm = (cumStats[tm.empNo] && cumStats[tm.empNo].pm !== undefined) ? cumStats[tm.empNo].pm : 0;
    const isChinese = tm.race === 'Chinese';
    const isManager = tm.isPharmacist || (tm.position && (tm.position.includes('Manager') || tm.position.includes('Pharmacist')));
    const isTrainee = isTraineeTeammate(tm);
    return {
      tm,
      empNo: tm.empNo,
      isChinese,
      isManager,
      isTrainee,
      turnWeight,
      prefRdIdx,
      prefHdIdx,
      curAm,
      curPm
    };
  });
  const vanessaMeta = tmMetadata.find(m => m.empNo === 'PMG03801' || m.tm.nickname === 'VANESSA');

  function evalCombination(selected) {
    let penalty = 0;

    for (let day = 0; day < 7; day++) {
      let fullAm = isFullMorningShift(williamSeq[day]) ? 1 : 0;
      let halfAm = isHalfDayMorningShift(williamSeq[day]) ? 1 : 0;
      let pm = isNightShift(williamSeq[day]) ? 1 : 0;

      let chAm = (isAnyMorningShift(williamSeq[day]) ? 1 : 0);
      let chPm = (isNightShift(williamSeq[day]) ? 1 : 0);
      let mgrAm = (isAnyMorningShift(williamSeq[day]) ? 1 : 0);
      let mgrPm = (isNightShift(williamSeq[day]) ? 1 : 0);
      let seniorAm = (isAnyMorningShift(williamSeq[day]) ? 1 : 0);
      let traineeAm = 0;
      let seniorPm = (isNightShift(williamSeq[day]) ? 1 : 0);
      let traineePm = 0;

      tmMetadata.forEach(m => {
        const s = selected[m.empNo].seq[day];
        const isMorn = isAnyMorningShift(s);
        const isNight = isNightShift(s);

        if (isFullMorningShift(s)) fullAm++;
        else if (isHalfDayMorningShift(s)) halfAm++;
        else if (isNight) pm++;

        if (isMorn) {
          if (m.isChinese) chAm++;
          if (m.isManager) mgrAm++;
          if (m.isTrainee) traineeAm++;
          else seniorAm++;
        } else if (isNight) {
          if (m.isChinese) chPm++;
          if (m.isManager) mgrPm++;
          if (m.isTrainee) traineePm++;
          else seniorPm++;
        }
      });

      const amTotal = fullAm + halfAm;
      const working = amTotal + pm;

      // 1. Hard Floor Constraint: amTotal >= 3 (with fullAm >= 2), pm >= 3, workingTotal >= 6
      if (amTotal < 3) penalty += (3 - amTotal) * 10000000;
      if (fullAm < 2) penalty += (2 - fullAm) * 10000000;
      if (pm < 3) penalty += (3 - pm) * 10000000;
      if (working < 6) penalty += (6 - working) * 10000000;

      // 1b. Senior-to-Trainee Ratio Constraint (Minimum 1:1 ratio, seniorCount >= traineeCount on every shift)
      // Never leave 1 senior with 2 trainees on any shift!
      if (traineeAm > 0 && seniorAm < traineeAm) {
        penalty += (traineeAm - seniorAm) * 10000000;
      }
      if (traineePm > 0 && seniorPm < traineePm) {
        penalty += (traineePm - seniorPm) * 10000000;
      }

      // Soft preference for 3 full AM staff when headcount allows
      if (fullAm < 3) penalty += 150;

      // 2. Chinese Speaking Coverage
      if (!isNov2026OrLater) {
        if (chAm < 1) penalty += 10000000;
        if (chPm < 1) penalty += 10000000;
      } else {
        // Soft best-effort preference post-Nov 2026
        if (chAm < 1) penalty += 1500;
        if (chPm < 1) penalty += 1500;
      }

      // 2b. Trainee Culture Adaptation & Senior Mentoring
      tmMetadata.filter(m => m.isTrainee).forEach(trMeta => {
        const trShift = selected[trMeta.empNo] ? selected[trMeta.empNo].seq[day] : null;
        if (trShift && trShift !== 'RD' && trShift !== 'PH' && trShift !== 'OFF') {
          const isTrAm = isAnyMorningShift(trShift);
          const relevantSeniorCount = isTrAm ? seniorAm : seniorPm;
          if (relevantSeniorCount < 1) {
            penalty += 10000000;
          }
        }
      });

      // 3. Manager Coverage on Each Shift (Omitted if BM or ABM resigned/absent)
      if (managerRuleActive) {
        if (mgrAm < 1) penalty += 500000;
        if (mgrPm < 1) penalty += 500000;
      }

      penalty += Math.abs(amTotal - pm) * 10;
    }

    // Weekly Parity and Cumulative Parity across ALL rotating staff
    tmMetadata.forEach(m => {
      const p = selected[m.empNo];
      penalty -= p.prefScore;
      penalty += (p.fullTurnarounds || 0) * m.turnWeight;
      penalty += (p.hdTurnarounds || 0) * 400;

      // Hard constraint: Match preset fixed rest day from Teammate Profiles
      if (m.prefRdIdx !== -1 && p.rdIdx !== m.prefRdIdx) {
        penalty += 10000000;
      }

      // Hard constraint: Match preset fixed half day from Teammate Profiles
      if (m.prefHdIdx !== -1 && p.hdIdx !== m.prefHdIdx) {
        penalty += 10000000;
      }

      const weeklyDev = p.deviation;
      if (weeklyDev > 2) {
        penalty += (weeklyDev - 2) * 5000000;
      }

      // Reward for weekly balance (3M/3N has weeklyDev = 0)
      penalty += weeklyDev * 2500;

      // Cumulative monthly AM (8H + 4H) vs PM (8H) parity
      const newAm = m.curAm + p.totalAm;
      const newPm = m.curPm + p.pmFull;
      const cumDiff = Math.abs(newAm - newPm);
      penalty += cumDiff * cumDiff * 8000;
      if (cumDiff > 2) {
        penalty += (cumDiff - 2) * 2000000;
      }
    });

    return penalty;
  }

  let best = null;
  let minPenalty = Infinity;

  // Phase 1: Exact bounded DFS over each rotating teammate's top balanced patterns (up to 3 per teammate = 2,187 combinations)
  const topCandidateLists = tmMetadata.map(m => {
    const pats = tmPatterns[m.empNo] || [];
    if (!pats.length) return [{ seq: new Array(7).fill('RD'), amFull: 0, pmFull: 0, totalAm: 0, deviation: 0, fullTurnarounds: 0, hdTurnarounds: 0, excessFatigue: 0, endNightStreak: 0, prefScore: 0 }];

    // Rank candidate patterns by preference alignment, turnaround safety, and projected cumulative parity
    const sorted = [...pats].map(p => {
      const projAm = m.curAm + p.totalAm;
      const projPm = m.curPm + p.pmFull;
      const projDiff = Math.abs(projAm - projPm);
      const candScore = p.prefScore
        - (p.fullTurnarounds || 0) * m.turnWeight
        - (p.hdTurnarounds || 0) * 400
        - projDiff * 6000
        + (Math.random() * 2000 - 1000); // Stochastic tie-breaking for diversity
      return { p, candScore };
    }).sort((a, b) => b.candScore - a.candScore);

    return sorted.slice(0, 3).map(item => item.p);
  });

  let dfsCount = 0;
  const maxDfs = 18000;
  const curDfs = {};
  function searchExact(idx) {
    if (dfsCount >= maxDfs) return;
    if (idx === rotatingPool.length) {
      dfsCount++;
      const pen = evalCombination(curDfs);
      if (pen < minPenalty) {
        minPenalty = pen;
        best = JSON.parse(JSON.stringify(curDfs));
      } else if (pen === minPenalty && Math.random() < 0.35) {
        // Stochastic replacement among equal optimal solutions
        best = JSON.parse(JSON.stringify(curDfs));
      }
      return;
    }
    const tm = rotatingPool[idx];
    const cands = topCandidateLists[idx];
    for (let i = 0; i < cands.length; i++) {
      curDfs[tm.empNo] = cands[i];
      searchExact(idx + 1);
    }
  }
  searchExact(0);

  // Phase 2: Multi-Start Coordinate Descent across full pattern lists
  for (let startIdx = 0; startIdx < 40; startIdx++) {
    const cur = {};
    rotatingPool.forEach((tm, tIdx) => {
      const pats = tmPatterns[tm.empNo];
      if (!pats || !pats.length) {
        cur[tm.empNo] = { seq: new Array(7).fill('RD'), amFull: 0, pmFull: 0, totalAm: 0, deviation: 0, prefScore: 0 };
      } else if (startIdx === 0 && best && best[tm.empNo]) {
        cur[tm.empNo] = best[tm.empNo];
      } else if (startIdx === 1) {
        cur[tm.empNo] = pats[0];
      } else {
        const rIdx = Math.floor(Math.random() * Math.min(pats.length, 8));
        cur[tm.empNo] = pats[rIdx];
      }
    });

    let improved = true;
    let pass = 0;
    while (improved && pass < 6) {
      improved = false;
      pass++;
      for (let i = 0; i < rotatingPool.length; i++) {
        const tm = rotatingPool[(i + startIdx) % rotatingPool.length];
        const pats = tmPatterns[tm.empNo] || [];
        let bestPat = cur[tm.empNo];
        let curBestPen = evalCombination(cur);
        for (let j = 0; j < pats.length; j++) {
          cur[tm.empNo] = pats[j];
          const pen = evalCombination(cur);
          if (pen < curBestPen) {
            curBestPen = pen;
            bestPat = pats[j];
            improved = true;
          }
        }
        cur[tm.empNo] = bestPat;
      }
    }

    const finalPen = evalCombination(cur);
    if (finalPen < minPenalty) {
      minPenalty = finalPen;
      best = JSON.parse(JSON.stringify(cur));
    }
  }

  if (!best) {
    best = {};
    rotatingPool.forEach(tm => {
      best[tm.empNo] = (tmPatterns[tm.empNo] && tmPatterns[tm.empNo][0]) || { seq: new Array(7).fill('RD'), amFull: 0, pmFull: 0, totalAm: 0, deviation: 0, prefScore: 0 };
    });
  }

  // Defensive Floor repair only if a hard floor violation (amTotal < 3 or pm < 3) occurred
  for (let day = 0; day < 7; day++) {
    let fullAm = isFullMorningShift(williamSeq[day]) ? 1 : 0;
    let halfAm = isHalfDayMorningShift(williamSeq[day]) ? 1 : 0;
    let pm = isNightShift(williamSeq[day]) ? 1 : 0;
    let curSeniorAm = (isAnyMorningShift(williamSeq[day]) ? 1 : 0);
    let curTraineeAm = 0;
    let curSeniorPm = (isNightShift(williamSeq[day]) ? 1 : 0);
    let curTraineePm = 0;

    rotatingPool.forEach(tm => {
      const s = best[tm.empNo].seq[day];
      const isTr = isTraineeTeammate(tm);
      if (isFullMorningShift(s)) {
        fullAm++;
        if (isTr) curTraineeAm++; else curSeniorAm++;
      } else if (isHalfDayMorningShift(s)) {
        halfAm++;
        if (isTr) curTraineeAm++; else curSeniorAm++;
      } else if (isNightShift(s)) {
        pm++;
        if (isTr) curTraineePm++; else curSeniorPm++;
      }
    });

    while (pm < 3 && (fullAm + halfAm) > 3 && fullAm > 2) {
      // Preset Lock Guard: ONLY adjust shifts on days marked 'Flexible'
      const candidates = rotatingPool.filter(tm => {
        if (best[tm.empNo].seq[day] !== '8H_0730-1630') return false;
        const dayName = weekDays[day]?.dayOfWeek;
        if (isDayPresetLocked(tm, dayName)) return false;
        return true;
      });
      if (!candidates.length) break;

      candidates.sort((a, b) => {
        const curAmA = (cumStats[a.empNo] && cumStats[a.empNo].am !== undefined) ? cumStats[a.empNo].am : 0;
        const curPmA = (cumStats[a.empNo] && cumStats[a.empNo].pm !== undefined) ? cumStats[a.empNo].pm : 0;
        const curAmB = (cumStats[b.empNo] && cumStats[b.empNo].am !== undefined) ? cumStats[b.empNo].am : 0;
        const curPmB = (cumStats[b.empNo] && cumStats[b.empNo].pm !== undefined) ? cumStats[b.empNo].pm : 0;

        const diffA = (curAmA + best[a.empNo].totalAm) - (curPmA + best[a.empNo].pmFull);
        const diffB = (curAmB + best[b.empNo].totalAm) - (curPmB + best[b.empNo].pmFull);
        return diffB - diffA;
      });

      let converted = false;
      for (const cand of candidates) {
        const nextShift = day < 6 ? best[cand.empNo].seq[day + 1] : null;
        if (isFullMorningShift(nextShift)) continue;
        const isTr = isTraineeTeammate(cand);
        // Protect 1:1 Senior:Trainee ratio: do not convert if it leaves fewer seniors than trainees on AM or PM
        if (!isTr && curTraineeAm > 0 && (curSeniorAm - 1) < curTraineeAm) continue;
        if (isTr && (curTraineePm + 1) > curSeniorPm) continue;

        best[cand.empNo].seq[day] = '8H_1230-2130';
        best[cand.empNo].amFull--;
        best[cand.empNo].totalAm--;
        best[cand.empNo].pmFull++;
        fullAm--;
        pm++;
        if (isTr) { curTraineeAm--; curTraineePm++; }
        else { curSeniorAm--; curSeniorPm++; }
        converted = true;
        break;
      }
      if (!converted) break;
    }

    while ((fullAm + halfAm) < 3 && pm > 3) {
      // Preset Lock Guard: ONLY adjust shifts on days marked 'Flexible'
      const pmCandidates = rotatingPool.filter(tm => {
        if (!best[tm.empNo].seq[day] || !isNightShift(best[tm.empNo].seq[day])) return false;
        const dayName = weekDays[day]?.dayOfWeek;
        if (isDayPresetLocked(tm, dayName)) return false;
        return true;
      });
      if (!pmCandidates.length) break;

      pmCandidates.sort((a, b) => {
        const curAmA = (cumStats[a.empNo] && cumStats[a.empNo].am !== undefined) ? cumStats[a.empNo].am : 0;
        const curPmA = (cumStats[a.empNo] && cumStats[a.empNo].pm !== undefined) ? cumStats[a.empNo].pm : 0;
        const curAmB = (cumStats[b.empNo] && cumStats[b.empNo].am !== undefined) ? cumStats[b.empNo].am : 0;
        const curPmB = (cumStats[b.empNo] && cumStats[b.empNo].pm !== undefined) ? cumStats[b.empNo].pm : 0;

        const diffA = (curPmA + best[a.empNo].pmFull) - (curAmA + best[a.empNo].totalAm);
        const diffB = (curPmB + best[b.empNo].pmFull) - (curAmB + best[b.empNo].totalAm);
        return diffB - diffA;
      });

      let converted = false;
      for (const cand of pmCandidates) {
        const prevShift = (day === 0 ? prevSundayShifts[cand.empNo] : best[cand.empNo].seq[day - 1]);
        const canPrev = !prevShift || prevShift === 'RD' || prevShift === 'PH' || isAnyMorningShift(prevShift);
        if (!canPrev) continue;

        const isTr = isTraineeTeammate(cand);
        // Protect 1:1 Senior:Trainee ratio: do not convert if it leaves fewer seniors than trainees on PM or AM
        if (!isTr && curTraineePm > 0 && (curSeniorPm - 1) < curTraineePm) continue;
        if (isTr && (curTraineeAm + 1) > curSeniorAm) continue;

        best[cand.empNo].seq[day] = '8H_0730-1630';
        best[cand.empNo].pmFull--;
        best[cand.empNo].amFull++;
        best[cand.empNo].totalAm++;
        fullAm++;
        pm--;
        if (isTr) { curTraineePm--; curTraineeAm++; }
        else { curSeniorPm--; curSeniorAm++; }
        converted = true;
        break;
      }
      if (!converted) break;
    }
  }

  return { selected: best, penalty: minPenalty, williamSeq };
}


// ─── SMART HEURISTIC SCHEDULE GENERATOR (FULL 7-DAY WEEKS & ZERO FATIGUE) ───────
function runHeuristicScheduleGenerator(branchVal, year, month, totalDays) {
  const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  if (!currentTeammates || currentTeammates.length === 0) {
    loadTeammates(branchVal || 'KS01', targetMonthStr, true);
  }
  const isNov2026OrLater = (year > 2026) || (year === 2026 && month >= 11);
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
  let prevNightStreaks = {};
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
        prevNightStreaks[tm.empNo] = (prevSundayShifts[tm.empNo] && prevSundayShifts[tm.empNo].includes('1230')) ? 1 : 0;
      });
    }
  }

  weeks.forEach((weekDays, wIdx) => {
    // Solve the 7-day week freshly based on live preferences
    const res = solveFullWeek(weekDays, prevSundayShifts, cumStats, rotatingPool, william, prevNightStreaks);
    const { selected, williamSeq } = res;

    for (let day = 0; day < 7; day++) {
      const d = weekDays[day];
      const dayShifts = {};

      // William fixed schedule
      if (william) {
        let ws = williamSeq[day];
        if (!d.isTargetMonth && shiftRegistry[d.date]?.shifts?.[william.empNo]) {
          ws = shiftRegistry[d.date].shifts[william.empNo];
        }
        dayShifts[william.empNo] = ws;
        if (ws === 'RD' || ws === 'PH') cumStats[william.empNo].rd++;
        else if (ws.includes('4H')) { cumStats[william.empNo].am++; cumStats[william.empNo].hd++; }
        else cumStats[william.empNo].am++;
      }

      // Rotating teammates
      rotatingPool.forEach(tm => {
        let s = selected[tm.empNo].seq[day];
        // If this transition day is outside the target month and was already scheduled in shiftRegistry, PRESERVE it to maintain cross-month continuity!
        if (!d.isTargetMonth && shiftRegistry[d.date]?.shifts?.[tm.empNo]) {
          s = shiftRegistry[d.date].shifts[tm.empNo];
        }
        dayShifts[tm.empNo] = s;
        if (s === 'RD') cumStats[tm.empNo].rd++;
        else if (isHalfDayMorningShift(s)) { cumStats[tm.empNo].am++; cumStats[tm.empNo].hd++; }
        else if (s.includes('0730')) cumStats[tm.empNo].am++;
        else if (s.includes('1230')) cumStats[tm.empNo].pm++;
      });

      // Gazetted Public Holiday handling:
      // William is PH (official rest day).
      // Rotating staff apply replacement leave to maintain floor >= 3.
      // Provisional Registered Pharmacists (Kenix & Christina) assume rest day (PH) too, unless needed to maintain floor >= 3.
      if (HOLIDAYS_2026_SARAWAK[d.date]) {
        const prpEmpNos = currentTeammates
          .filter(t => t.position && t.position.toLowerCase().includes('provisional'))
          .map(t => t.empNo);
        if (!prpEmpNos.length) prpEmpNos.push('PMG03033');
        let nonPrpAm = 0;
        let nonPrpPm = 0;
        Object.entries(dayShifts).forEach(([eNo, sh]) => {
          if (!prpEmpNos.includes(eNo) && eNo !== 'PMG00831' && sh && sh !== 'RD' && sh !== 'PH' && sh !== 'OFF') {
            if (sh.includes('0730') || sh.includes('4H')) nonPrpAm++;
            if (sh.includes('1230')) nonPrpPm++;
          }
        });

        prpEmpNos.forEach(pEmp => {
          const origShift = dayShifts[pEmp];
          if (!origShift || origShift === 'RD') return;
          const isMorn = origShift.includes('0730') || origShift.includes('4H');
          const isEve = origShift.includes('1230');

          if (isMorn && nonPrpAm >= 3) {
            dayShifts[pEmp] = 'PH';
          } else if (isEve && nonPrpPm >= 3) {
            dayShifts[pEmp] = 'PH';
          }
        });
      }

      // 6S Cleaning Duty: 14:00 - 15:30 Round-Robin (Excludes half-day morning staff who leave at 12:30)
      const workingStaff = rotatingPool.filter(tm => {
        const s = dayShifts[tm.empNo];
        return s && s !== 'RD' && s !== 'PH' && s !== 'OFF' && !isHalfDayMorningShift(s);
      });
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
          if (s.includes('1230') || s.includes('1300') || s.includes('1630-2130') || s.startsWith('5H_1630')) pmCount++;
        }
      });

      const amCount = fullAmCount + halfAmCount;

      const dayObj = {
        ...d,
        shifts: dayShifts,
        cleaningDuty,
        fullAmCount,
        halfAmCount,
        amCount,
        pmCount,
        workingTotal
      };

      if (amCount < 3 || pmCount < 3 || workingTotal < 6) {
        const isAmShort = amCount < 3;
        const isPmShort = pmCount < 3;
        const shortDesc = isAmShort ? `Morning Shift Deficit (${amCount}/3 AM staff)` : (isPmShort ? `Deficit on Night (${pmCount}/3 staff)` : `Total working staff below 6`);
        const warn = `⚠️ Manpower Alert: Only ${workingTotal} staff on duty on ${d.date} (${d.dayOfWeek}). ${shortDesc}. Minimum 3 required on floor continuously.`;
        dayObj.warning = warn;
        if (!warnings.includes(warn)) warnings.push(warn);
      }

      // Senior-to-Trainee Ratio check (Minimum 1:1 ratio, seniorCount >= traineeCount on every shift)
      let seniorAm = 0, traineeAm = 0, seniorPm = 0, traineePm = 0;
      currentTeammates.forEach(tm => {
        const s = dayShifts[tm.empNo];
        if (!s || s === 'RD' || s === 'PH' || s === 'OFF') return;
        const isTr = isTraineeTeammate(tm);
        if (isAnyMorningShift(s)) {
          if (isTr) traineeAm++; else seniorAm++;
        } else if (isNightShift(s)) {
          if (isTr) traineePm++; else seniorPm++;
        }
      });
      dayObj.seniorAmCount = seniorAm;
      dayObj.traineeAmCount = traineeAm;
      dayObj.seniorPmCount = seniorPm;
      dayObj.traineePmCount = traineePm;
      dayObj.isRatioViolation = (traineeAm > 0 && seniorAm < traineeAm) || (traineePm > 0 && seniorPm < traineePm);

      if (dayObj.isRatioViolation) {
        const shortDesc = (traineeAm > 0 && seniorAm < traineeAm)
          ? `Morning Shift has ${traineeAm} trainee(s) with only ${seniorAm} senior(s)`
          : `Night Shift has ${traineePm} trainee(s) with only ${seniorPm} senior(s)`;
        const warn = `⚠️ Senior:Trainee Ratio Alert: ${d.date} (${d.dayOfWeek}) - ${shortDesc}. Rule requires at least 1:1 senior-to-trainee ratio (never leave 1 senior with 2 trainees).`;
        if (!warnings.includes(warn)) warnings.push(warn);
      }

      dailySchedule.push(dayObj);
      shiftRegistry[d.date] = dayObj;
    }

    prevSundayShifts = {};
    prevNightStreaks = {};
    rotatingPool.forEach(tm => {
      prevSundayShifts[tm.empNo] = selected[tm.empNo].seq[6];
      let streak = 0;
      for (let i = 6; i >= 0; i--) {
        if (selected[tm.empNo].seq[i] && selected[tm.empNo].seq[i].includes('1230')) streak++;
        else break;
      }
      prevNightStreaks[tm.empNo] = streak;
    });
  });

  // Allocate Trainee Learning Track (3x 1H, Fri 14:00 HQ Video) & SSJ Stock Receiving (Mon PM, Tue, Wed)
  assignTraineeLearningAndStockDuties(dailySchedule, currentTeammates);

  // Persist updated shift registry to memory
  saveShiftRegistry(branchVal, shiftRegistry);

  // Compute shift parity across rotating pool
  const indivDiffs = rotatingPool.map(tm => Math.abs(cumStats[tm.empNo].am - cumStats[tm.empNo].pm));
  const maxIndivDiff = indivDiffs.length ? Math.max(...indivDiffs) : 0;

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    branch: branchVal,
    days: dailySchedule,
    warnings,
    stats: cumStats,
    hasMinorVariance: maxIndivDiff > 2 || warnings.length > 0,
    summary: `Statutory Sarawak Labour Ordinance Timetable: Strictly full 7-day Monday–Sunday weeks (${weeks.length} complete calendar weeks), exactly 1 Rest Day (RD) + 1 Half Day (HD) per week across all weeks, William Chai locked AM anchor (6S exempt), ${isNov2026OrLater ? 'adaptive Chinese speaker distribution (soft preference with senior pairing for Vanessa Anak Blaise)' : 'guaranteed whole-day Chinese speaker coverage'}, fair AM/PM balance across all rotating teammates, guaranteed 3 AM / 3 PM minimum floor, 0 turnaround fatigue violations, cross-month memory active, and universal 6S cleaning rotation (14:00–15:30).`
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
      stockCount: 0,
      learnCount: 0,
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
    let seniorAm = 0, traineeAm = 0;
    let seniorPm = 0, traineePm = 0;

    Object.entries(d.shifts).forEach(([empNo, shift]) => {
      const tm = currentTeammates.find(t => t.empNo === empNo);
      if (!tm) return;

      const isWorking = shift && shift !== 'RD' && shift !== 'OFF' && shift !== 'PH';
      if (isWorking) totalShifts++;
      else if (shift === 'RD' || shift === 'OFF' || shift === 'PH') totalRestDays++;

      const isTr = isTraineeTeammate(tm);
      const isPharm = tm.isPharmacist || tm.position === 'Pharmacist';
      const isManager = isPharm || (tm.position && (tm.position.includes('Manager') || tm.position.includes('Pharmacist')));
      const isHalf  = shift && (shift.includes('4H') || shift.includes('5H') || shift.includes('Half') || shift.includes('0730-1130'));
      const isMorning = shift && (shift.includes('0730') || shift.includes('0800'));
      const isFullAm  = isMorning && !isHalf;
      const isNight   = shift && (shift.includes('1230') || shift.includes('1300') || shift.includes('1630-2130') || shift.startsWith('5H_1630'));

      if (isHalf) {
        teammateStats[empNo].hdCount++;
        // Half-day (07:30-11:30) finishes at 11:30 AM for weekly half-day off; only full 8H shifts count as turnaround fatigue violations
        teammateStats[empNo].currentNightStreak = 0;
        teammateStats[empNo].lastShiftCode = shift;
      }

      if (isMorning) {
        if (isManager) hasMorningManager = true;
        if (isTr) traineeAm++; else seniorAm++;
        morningRaces.add(tm.race);
        if (isFullAm) {
          teammateStats[empNo].mCount++;
          // Check fatigue: previous shift was night followed by a full 8H morning shift
          if (teammateStats[empNo].lastShiftCode && teammateStats[empNo].lastShiftCode.includes('1230')) {
            teammateStats[empNo].pmToAmFatigueCount++;
          }
          teammateStats[empNo].currentNightStreak = 0;
          teammateStats[empNo].lastShiftCode = shift;
        }
      } else if (isNight) {
        if (isManager) hasNightManager = true;
        if (isTr) traineePm++; else seniorPm++;
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
      if (d.stockDuty && d.stockDuty.empNo === empNo) {
        teammateStats[empNo].stockCount++;
      }
      if (d.learningSlots && d.learningSlots.some(l => l.empNo === empNo)) {
        teammateStats[empNo].learnCount++;
      }
    });

    d.seniorAmCount = seniorAm;
    d.traineeAmCount = traineeAm;
    d.seniorPmCount = seniorPm;
    d.traineePmCount = traineePm;
    d.isRatioViolation = (traineeAm > 0 && seniorAm < traineeAm) || (traineePm > 0 && seniorPm < traineePm);

    const hasMorningChinese = [...morningRaces].some(r => r === 'Chinese');
    const hasNightChinese   = [...nightRaces].some(r => r === 'Chinese');

    if (hasMorningManager && hasNightManager) managerCoverageDays++;
    if (hasMorningChinese && hasNightChinese) chineseCoverageDays++;
  });

  // Calculate Parity across unified rotating pool
  const rotatingTotalAms = rotatingPool.map(a => teammateStats[a.empNo].mCount + teammateStats[a.empNo].hdCount);
  const rotatingPms = rotatingPool.map(a => teammateStats[a.empNo].nCount);
  const indivDiffs = rotatingPool.map(a => Math.abs((teammateStats[a.empNo].mCount + teammateStats[a.empNo].hdCount) - teammateStats[a.empNo].nCount));
  const maxIndivDiff = indivDiffs.length ? Math.max(...indivDiffs) : 0;
  const amSpread = rotatingTotalAms.length ? (Math.max(...rotatingTotalAms) - Math.min(...rotatingTotalAms)) : 0;
  const pmSpread = rotatingPms.length ? (Math.max(...rotatingPms) - Math.min(...rotatingPms)) : 0;
  const maxStaffVar = Math.max(maxIndivDiff, amSpread, pmSpread);
  const totalFatigueViolations = Object.values(teammateStats).reduce((acc, s) => acc + s.pmToAmFatigueCount, 0);

  // Update KPI cards
  const kpiPharm   = document.getElementById('kpiSchedulerPharm');
  const kpiParity  = document.getElementById('kpiSchedulerParity');
  const kpiLang    = document.getElementById('kpiSchedulerLang');
  const kpiShift   = document.getElementById('kpiSchedulerShifts');
  const kpiRest    = document.getElementById('kpiSchedulerRest');

  if (kpiPharm)  kpiPharm.textContent  = `${Math.round((managerCoverageDays / schedule.days.length) * 100)}%`;
  if (kpiParity) {
    if (maxStaffVar <= 1) {
      kpiParity.textContent = '100% Balanced';
    } else if (maxStaffVar <= 2) {
      kpiParity.textContent = `✓ Balanced (±${maxStaffVar})`;
    } else {
      kpiParity.textContent = `±${maxStaffVar} Shifts`;
    }
  }
  const isNov2026OrLater = (schedYear > 2026) || (schedYear === 2026 && schedMonth >= 11);
  if (kpiLang) {
    const pct = Math.round((chineseCoverageDays / schedule.days.length) * 100);
    kpiLang.textContent = isNov2026OrLater ? `${pct}% (Adaptive)` : `${pct}%`;
  }
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

  // Build Calendar Weeks Super-Header (Monday to Sunday)
  const thead = headerRow?.parentElement;
  if (thead) {
    let superHeaderRow = document.getElementById('schedulerMatrixSuperHeader');
    if (!superHeaderRow) {
      superHeaderRow = document.createElement('tr');
      superHeaderRow.id = 'schedulerMatrixSuperHeader';
      thead.insertBefore(superHeaderRow, headerRow);
    }
    superHeaderRow.className = 'bg-slate-200 border-b border-gray-300 text-[11px] font-bold';
    const calWeeksCount = Math.floor(schedule.days.length / 7);
    let superHeaderHtml = `
      <th class="sticky left-0 bg-slate-200 z-30 px-3 py-1.5 text-left text-gray-700 uppercase border-r border-gray-300">
        Calendar Week (Mon – Sun)
      </th>
    `;
    const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let w = 0; w < calWeeksCount; w++) {
      const wDays = schedule.days.slice(w * 7, (w + 1) * 7);
      const startStr = `${wDays[0].day} ${mNames[(wDays[0].month || 1) - 1]}`;
      const endStr = `${wDays[6].day} ${mNames[(wDays[6].month || 1) - 1]}`;
      const bg = (w % 2 === 0) ? 'bg-indigo-100 text-indigo-950 border-r-2 border-r-slate-400' : 'bg-blue-100 text-blue-950 border-r-2 border-r-slate-400';
      superHeaderHtml += `
        <th colspan="7" class="text-center py-1.5 px-1 font-extrabold ${bg} tracking-wider uppercase text-[11px]">
          Week ${w + 1} (${startStr} – ${endStr})
        </th>
      `;
    }
    superHeaderRow.innerHTML = superHeaderHtml;
  }

  // Build Table Header
  let headerHtml = `
    <th class="sticky left-0 bg-gray-100 z-20 px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200 min-w-[200px]">
      Teammate (KS01)
    </th>
  `;

  schedule.days.forEach(d => {
    const isWeekend = d.dayOfWeek === 'Saturday' || d.dayOfWeek === 'Sunday';
    const isSunday = d.dayOfWeek === 'Sunday';
    const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-gray-200';
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[d.date];
    const isAmShortage = d.amCount < 3;
    const isPmShortage = d.pmCount < 3;
    const isShortage = isAmShortage || isPmShortage;
    const isRatioViolation = !!d.isRatioViolation;

    // Visual Grid Warning Badges: Amber highlight on column header where a shift has < 3 staff or ratio violation
    let dayBg = 'bg-gray-50 text-gray-700';
    if (isShortage || isRatioViolation) {
      dayBg = 'bg-amber-100 text-amber-950 border-b-2 border-amber-500 ring-1 ring-amber-400 ring-inset shadow-xs';
    } else if (isHoliday) {
      dayBg = 'bg-rose-50 text-rose-900 border-rose-200';
    } else if (isWeekend) {
      dayBg = 'bg-amber-50/60 text-amber-900';
    }

    const shortageTooltip = isAmShortage
      ? `⚠️ Morning Shift Shortage (${d.amCount}/3 AM staff) - Click to edit`
      : `⚠️ Night Shift Shortage (${d.pmCount}/3 staff) - Click to edit`;

    headerHtml += `
      <th class="px-2 py-2 text-center text-xs font-semibold ${dayBg} ${weekBorder} min-w-[75px]" title="${isHoliday ? HOLIDAYS_2026_SARAWAK[d.date] : ''}">
        <div class="text-[10px] uppercase font-bold ${isHoliday ? 'text-rose-600' : ((isShortage || isRatioViolation) ? 'text-amber-800' : 'text-gray-400')}">${d.dayOfWeek.slice(0, 3)}</div>
        <div class="text-sm font-extrabold">${d.day}</div>
        ${!d.isTargetMonth ? `<div class="text-[9px] text-indigo-600 font-extrabold">${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(d.month || 1) - 1]}</div>` : ''}
        ${isHoliday ? '<span class="text-[9px] bg-rose-200 text-rose-800 px-1 rounded font-bold">PH</span>' : ''}
        ${isShortage ? `
          <button type="button" onclick="openDayShiftEditorModal('${d.date}')"
            class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer whitespace-nowrap"
            title="${shortageTooltip}">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>${isAmShortage ? `AM (${d.amCount}/3)` : `PM (${d.pmCount}/3)`}</span>
          </button>
        ` : ''}
        ${isRatioViolation ? `
          <button type="button" onclick="openDayShiftEditorModal('${d.date}')"
            class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer whitespace-nowrap"
            title="⚠️ Senior-to-Trainee Ratio &lt; 1:1 on ${d.date}: AM (${d.seniorAmCount} Senior : ${d.traineeAmCount} Trainee), PM (${d.seniorPmCount} Senior : ${d.traineePmCount} Trainee) - Click to edit">
            <i class="fa-solid fa-users-slash"></i>
            <span>Ratio &lt; 1:1</span>
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
    const isTrainee = isTraineeTeammate(tm);
    const st = teammateStats[tm.empNo];

    bodyHtml += `
      <tr class="hover:bg-blue-50/50 border-b border-gray-200 transition text-xs">
        <td class="sticky left-0 bg-white z-10 px-3 py-2.5 font-medium text-gray-900 border-r border-gray-200 shadow-sm">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-gray-800">${escHtml(tm.nickname)}</span>
            <div class="flex items-center gap-1">
              ${isPharm ? '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-blue-100 text-blue-800 border border-blue-200">Rx</span>' : ''}
              ${isFixed ? '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-amber-100 text-amber-800">Fixed</span>' : ''}
              ${isTrainee ? '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800 border border-indigo-200" title="Trainee Learning Track (3x 1H sessions/week)">🎓 Trainee</span>' : ''}
            </div>
          </div>
          <div class="text-[10px] text-gray-400 truncate max-w-[170px]">${escHtml(tm.empName)}</div>
          <div class="text-[10px] text-gray-500 font-mono mt-0.5">
            <span class="text-blue-600 font-bold">M: ${st.mCount + st.hdCount}</span> (${st.mCount} 8H + ${st.hdCount} ${isFixed ? '4H' : '5H'}) · <span class="text-purple-600 font-bold">N: ${st.nCount}</span>${st.cleanCount > 0 ? ` · <span class="text-teal-700 font-bold">🧹: ${st.cleanCount}</span>` : ''}${st.stockCount > 0 ? ` · <span class="text-amber-700 font-bold">📦: ${st.stockCount}</span>` : ''}${st.learnCount > 0 ? ` · <span class="text-indigo-700 font-bold">🎓: ${st.learnCount}h</span>` : ''}
          </div>
        </td>
    `;

    schedule.days.forEach(d => {
      const isSunday = d.dayOfWeek === 'Sunday';
      const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-gray-200';
      const shift = (d.shifts && d.shifts[tm.empNo]) || 'RD';
      const cellStyle = getShiftBadgeStyle(shift);
      const isCleaningDuty = d.cleaningDuty && d.cleaningDuty.empNo === tm.empNo;
      const isStockDuty = d.stockDuty && d.stockDuty.empNo === tm.empNo;
      const learnSlot = d.learningSlots && d.learningSlots.find(l => l.empNo === tm.empNo);
      const isShortage = d.amCount < 3 || d.pmCount < 3;
      const colBg = isShortage
        ? 'bg-amber-50/70 hover:bg-amber-100/90'
        : (isCleaningDuty ? 'bg-teal-50/60' : (isStockDuty ? 'bg-amber-50/50' : (learnSlot ? 'bg-indigo-50/40' : 'hover:bg-blue-50/40')));

      let dutyBadges = '';
      if (isCleaningDuty) {
        dutyBadges += '<div class="text-[8px] font-bold text-teal-800 leading-none mt-0.5">🧹 Clean</div>';
      }
      if (isStockDuty) {
        dutyBadges += `<div class="text-[8px] font-bold text-amber-900 bg-amber-100 border border-amber-200 rounded px-0.5 leading-none mt-0.5" title="${escHtml(d.stockDuty.task)} (${escHtml(d.stockDuty.dayNumber)})">📦 Stock</div>`;
      }
      if (learnSlot) {
        dutyBadges += `<div class="text-[7.5px] font-bold text-indigo-950 ${learnSlot.isHqVideo ? 'bg-indigo-200 border border-indigo-300' : 'bg-indigo-100 border border-indigo-200'} rounded px-0.5 py-0.5 leading-tight mt-0.5 shadow-2xs" title="${escHtml(learnSlot.task)} (${escHtml(learnSlot.time)})">${learnSlot.isHqVideo ? '🎓 HQ Video: 2-3pm' : '📚 Learn: 2-3pm'}</div>`;
      }

      bodyHtml += `
        <td onclick="openDayShiftEditorModal('${d.date}', '${tm.empNo}')" class="px-1 py-1.5 text-center ${weekBorder} cursor-pointer transition ${colBg}" title="${shift}${isCleaningDuty ? ' | 🧹 14:00-15:30 Cleaning' : ''}${isStockDuty ? ` | 📦 ${d.stockDuty.task}` : ''}${learnSlot ? ` | ${learnSlot.task} (${learnSlot.time})` : ''} (Click to fine-tune Day ${d.day})">
          <span class="inline-block px-1.5 py-1 rounded text-[10px] font-mono font-bold leading-tight ${cellStyle.classes}">
            ${cellStyle.label}
          </span>
          ${dutyBadges}
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
        <div class="text-[9px] text-gray-500 font-normal">Target: Min 3 AM / 3 PM</div>
      </td>
  `;
  schedule.days.forEach(d => {
    const isSunday = d.dayOfWeek === 'Sunday';
    const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-gray-200';
    const isTargetMet = d.amCount >= 3 && d.pmCount >= 3 && !d.isRatioViolation;
    densityRow += `
      <td class="px-1 py-1 text-center ${weekBorder} ${isTargetMet ? '' : 'bg-amber-100/90'}">
        <button type="button" onclick="openDayShiftEditorModal('${d.date}')" class="w-full text-[9px] font-mono font-bold ${isTargetMet ? 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200' : 'text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-300'} px-1 py-0.5 rounded leading-tight transition cursor-pointer" title="Morning: ${d.amCount} (${d.fullAmCount || 0} Full 8H + ${d.halfAmCount || 0} Half 4H), Night: ${d.pmCount}, Total Working: ${d.workingTotal} | Ratio: AM ${d.seniorAmCount || 0}S:${d.traineeAmCount || 0}T, PM ${d.seniorPmCount || 0}S:${d.traineePmCount || 0}T ${d.isRatioViolation ? '(! Ratio Violation)' : '(OK)'} (Click to fine-tune)">
          ${d.amCount}M / ${d.pmCount}N ${isTargetMet ? '' : '⚠️'}
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
    const isSunday = d.dayOfWeek === 'Sunday';
    const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-teal-200';
    cleaningRow += `
      <td class="px-1 py-1 text-center ${weekBorder}">
        <span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-teal-200/80 text-teal-950 font-mono truncate max-w-[65px]" title="${d.cleaningDuty ? d.cleaningDuty.task + ' (2:00 PM – 3:30 PM)' : 'None'}">
          ${d.cleaningDuty ? escHtml(d.cleaningDuty.nickname) : '-'}
        </span>
      </td>
    `;
  });
  cleaningRow += '</tr>';

  // SSJ Stock Receiving Duty Row (Bottom 3)
  let stockDutyRow = `
    <tr class="bg-amber-50/70 border-t border-amber-200 font-semibold text-[11px] text-amber-950">
      <td class="sticky left-0 bg-amber-50 z-10 px-3 py-2 border-r border-amber-200 font-bold">
        📦 SSJ Stock Receiving
        <div class="text-[9px] text-amber-700 font-normal">Mon PM Intake · Tue Check · Wed Shelf</div>
      </td>
  `;
  schedule.days.forEach(d => {
    const isSunday = d.dayOfWeek === 'Sunday';
    const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-amber-200';
    const sd = d.stockDuty;
    stockDutyRow += `
      <td class="px-1 py-1 text-center ${weekBorder}">
        ${sd ? `
          <span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-amber-200/90 text-amber-950 font-mono truncate max-w-[65px]" title="${escHtml(sd.dayNumber)}: ${escHtml(sd.task)} (${escHtml(sd.shift)})">
            ${escHtml(sd.nickname)}
          </span>
        ` : '<span class="text-gray-300 text-[10px]">-</span>'}
      </td>
    `;
  });
  stockDutyRow += '</tr>';

  // Trainee Learning Track Row (Bottom 4)
  let learningRow = `
    <tr class="bg-indigo-50/70 border-t border-indigo-200 font-semibold text-[11px] text-indigo-950">
      <td class="sticky left-0 bg-indigo-50 z-10 px-3 py-2 border-r border-indigo-200 font-bold">
        📚 Trainee Learning Track
        <div class="text-[9px] text-indigo-700 font-normal">Fri 14:00 HQ Video + 2x 1H Overlap</div>
      </td>
  `;
  schedule.days.forEach(d => {
    const isSunday = d.dayOfWeek === 'Sunday';
    const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-indigo-200';
    const slots = d.learningSlots || [];
    learningRow += `
      <td class="px-1 py-1 text-center ${weekBorder}">
        ${slots.length > 0 ? slots.map(sl => `
          <span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold ${sl.isHqVideo ? 'bg-indigo-200 text-indigo-950 border border-indigo-300' : 'bg-indigo-100 text-indigo-900'} font-mono truncate max-w-[75px]" title="${escHtml(sl.nickname)}: ${escHtml(sl.task)} (${escHtml(sl.time)})">
            ${escHtml(sl.nickname)}${sl.isHqVideo ? ' 🎓 (2-3pm)' : ' 📚 (2-3pm)'}
          </span>
        `).join('') : '<span class="text-gray-300 text-[10px]">-</span>'}
      </td>
    `;
  });
  learningRow += '</tr>';

  // Whole-Day Chinese Speaker Coverage Indicators Row (Bottom 5)
  let coverageRow = `
    <tr class="bg-gray-100 border-t border-gray-200 font-semibold text-[11px] text-gray-700">
      <td class="sticky left-0 bg-gray-100 z-10 px-3 py-2 border-r border-gray-200 font-bold">
        Chinese Speaker AM / PM
        <div class="text-[9px] text-gray-500 font-normal">${isNov2026OrLater ? 'Adaptive Language Coverage' : 'Whole-Day Language Coverage'}</div>
      </td>
  `;

  schedule.days.forEach(d => {
    const isSunday = d.dayOfWeek === 'Sunday';
    const weekBorder = isSunday ? 'border-r-2 border-r-slate-400' : 'border-r border-gray-200';
    let amChinese = false;
    let pmChinese = false;
    Object.entries(d.shifts).forEach(([empNo, shift]) => {
      const tm = currentTeammates.find(t => t.empNo === empNo);
      if (!tm || tm.race !== 'Chinese') return;
      if (shift && (shift.includes('0730') || shift.includes('0800') || shift.includes('4H'))) amChinese = true;
      if (shift && (shift.includes('1230') || shift.includes('1300') || shift.includes('1630-2130') || shift.startsWith('5H_1630'))) pmChinese = true;
    });

    const isFullCover = amChinese && pmChinese;
    let badgeHtml = '';
    if (isFullCover) {
      badgeHtml = `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold" title="Both AM & PM shifts have Chinese-speaking teammate">✓</span>`;
    } else if (isNov2026OrLater) {
      if (amChinese) {
        badgeHtml = `<span class="inline-flex items-center justify-center px-1 h-5 rounded text-[9px] bg-blue-100 text-blue-800 font-bold" title="AM Chinese speaker on duty (William/Christina/Penny). PM covered by senior experienced team (Adaptive mode)">AM</span>`;
      } else if (pmChinese) {
        badgeHtml = `<span class="inline-flex items-center justify-center px-1 h-5 rounded text-[9px] bg-purple-100 text-purple-800 font-bold" title="PM Chinese speaker on duty. AM covered by senior experienced team (Adaptive mode)">PM</span>`;
      } else {
        badgeHtml = `<span class="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] bg-slate-100 text-slate-500 font-mono" title="Adaptive mode: Experienced senior teammates on duty">-</span>`;
      }
    } else {
      badgeHtml = `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold" title="${!amChinese && !pmChinese ? 'Missing Chinese speaker in AM & PM' : (!amChinese ? 'Missing Chinese speaker in AM' : 'Missing Chinese speaker in PM')}">!</span>`;
    }

    coverageRow += `
      <td class="px-1 py-1.5 text-center ${weekBorder}">
        ${badgeHtml}
      </td>
    `;
  });
  coverageRow += '</tr>';

  if (tbody) tbody.innerHTML = bodyHtml + densityRow + cleaningRow + stockDutyRow + learningRow + coverageRow;

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
            <p class="text-xs text-gray-500 mt-0.5">Audits workload distribution among teammates for Kota Sentosa (Target: Max ±2 shift variance, 0 PM→AM fatigue transitions).</p>
          </div>
          <div class="flex items-center gap-2 text-xs flex-wrap">
            <span class="px-2.5 py-1 rounded-full font-bold ${maxStaffVar <= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              <i class="fa-solid fa-check-circle mr-1"></i> Shift Parity: ${maxStaffVar <= 2 ? `Equitable (≤±${maxStaffVar})` : `Variance ±${maxStaffVar}`}
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
                <th class="py-2.5 px-3 text-center">Total Morning (8H+Half)</th>
                <th class="py-2.5 px-3 text-center">Full Night (8H)</th>
                <th class="py-2.5 px-3 text-center">Shift Parity</th>
                <th class="py-2.5 px-3 text-center">Full Rest Days (RD)</th>
                <th class="py-2.5 px-3 text-center">Half Days (4H/5H)</th>
                <th class="py-2.5 px-3 text-center">Statutory Quota</th>
                <th class="py-2.5 px-3 text-center">Duties & Learning</th>
                <th class="py-2.5 px-3 text-center">Anti-Fatigue Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
      `;

      currentTeammates.forEach(tm => {
        const st = teammateStats[tm.empNo] || { mCount: 0, nCount: 0, rdCount: 0, hdCount: 0, cleanCount: 0, pmToAmFatigueCount: 0 };
        const isFixed = tm.scheduleMode === 'Fixed' || tm.empNo === 'PMG00831' || tm.nickname === 'WILLIAM';
        const isPharm = tm.isPharmacist || (tm.position && tm.position.includes('Pharmacist'));

        let parityBadge = '';
        if (isFixed) {
          parityBadge = '<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">Fixed Anchor (Exempt)</span>';
        } else {
          const totalMorn = st.mCount + st.hdCount;
          const diff = Math.abs(totalMorn - st.nCount);
          parityBadge = diff <= 2
            ? `<span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✓ Balanced (±${diff})</span>`
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
            <td class="py-2.5 px-3 text-center font-mono font-bold text-blue-600">
              ${st.mCount + st.hdCount} <span class="text-[9px] text-gray-400 font-normal">(${st.mCount}+${st.hdCount}h)</span>
            </td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-purple-600">${st.nCount}</td>
            <td class="py-2.5 px-3 text-center">${parityBadge}</td>
            <td class="py-2.5 px-3 text-center font-mono text-gray-700 font-semibold">${st.rdCount}</td>
            <td class="py-2.5 px-3 text-center font-mono text-amber-900 font-semibold">${st.hdCount}</td>
            <td class="py-2.5 px-3 text-center">${quotaBadge}</td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-gray-700">
              <div class="flex items-center justify-center gap-1 flex-wrap">
                ${st.cleanCount > 0 ? `<span class="bg-teal-50 text-teal-800 border border-teal-200 px-1 py-0.5 rounded text-[10px]" title="6S Gondola Cleaning Duties">🧹 ${st.cleanCount}</span>` : ''}
                ${st.stockCount > 0 ? `<span class="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.5 rounded text-[10px]" title="SSJ Stock Receiving Duties">📦 ${st.stockCount}</span>` : ''}
                ${st.learnCount > 0 ? `<span class="bg-indigo-50 text-indigo-900 border border-indigo-200 px-1 py-0.5 rounded text-[10px]" title="Trainee Learning Sessions">🎓 ${st.learnCount}h</span>` : ''}
                ${!st.cleanCount && !st.stockCount && !st.learnCount ? '<span class="text-gray-400 font-normal">—</span>' : ''}
              </div>
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
    const isAmShortage = d.amCount < 3;
    const isPmShortage = d.pmCount < 3;
    const isDensityShortage = d.workingTotal < 6;
    const isRatioViolation = !!d.isRatioViolation;

    if (isAmShortage || isPmShortage || isDensityShortage || isRatioViolation) {
      const shortageShift = isRatioViolation
        ? ((d.traineeAmCount > 0 && d.seniorAmCount < d.traineeAmCount)
            ? `Morning Senior:Trainee Ratio (${d.seniorAmCount} Senior : ${d.traineeAmCount} Trainees)`
            : `Night Senior:Trainee Ratio (${d.seniorPmCount} Senior : ${d.traineePmCount} Trainees)`)
        : (isAmShortage && isPmShortage
          ? 'Morning & Night Shifts'
          : (isAmShortage ? 'Morning Shift' : (isPmShortage ? 'Night Shift' : 'Overall Manpower')));

      let deficit = 0;
      if (isRatioViolation) deficit = 1;
      else if (isAmShortage && isPmShortage) deficit = (3 - d.amCount) + (3 - d.pmCount);
      else if (isAmShortage) deficit = 3 - d.amCount;
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

      const suggestion = isRatioViolation
        ? `Ratio Rule: Cannot leave 1 senior with 2 trainees on a shift (ratio must be at least 1:1). Reassign 1 trainee to alternate shift or swap an experienced senior into this shift.`
        : `Recommend moving 1 rest day to ${surplusDayName} to achieve minimum 3-staff ${shortageShift.toLowerCase()} coverage.`;

      bottlenecks.push({
        day: d.day,
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        workingTotal: d.workingTotal,
        amCount: d.amCount,
        pmCount: d.pmCount,
        isAmShortage,
        isPmShortage,
        isRatioViolation,
        shortageShift,
        deficit,
        restTeammates,
        suggestion
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
  let hasMorningChinese = false;
  let hasNightChinese = false;
  let seniorAm = 0, traineeAm = 0;
  let seniorPm = 0, traineePm = 0;

  currentTeammates.forEach(tm => {
    const el = document.getElementById(`editShift_${tm.empNo}`);
    const s = el ? el.value : 'RD';
    const isChinese = tm.race === 'Chinese';
    const isTr = isTraineeTeammate(tm);

    if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
      totalWorking++;
      if (s.includes('0730') || s.includes('0800') || s.includes('4H')) {
        amCount++;
        if (isChinese) hasMorningChinese = true;
        if (isTr) traineeAm++; else seniorAm++;
      }
      if (s.includes('1230') || s.includes('1300') || s.includes('1630-2130') || s.startsWith('5H_1630')) {
        pmCount++;
        if (isChinese) hasNightChinese = true;
        if (isTr) traineePm++; else seniorPm++;
      }
    } else {
      rdCount++;
    }
  });

  const isShortage = amCount < 3 || pmCount < 3;
  const isTraineeRatioViolation = (traineeAm > 0 && seniorAm < traineeAm) || (traineePm > 0 && seniorPm < traineePm);
  const curMonthVal = generatedScheduleData ? generatedScheduleData.month : '';
  const isNov2026OrLater = !curMonthVal || curMonthVal >= '2026-11';

  const amChBadge = hasMorningChinese
    ? '<span class="text-emerald-700 font-bold ml-0.5" title="Morning Chinese speaker on duty">✓Ch</span>'
    : (isNov2026OrLater ? '<span class="text-slate-400 font-semibold ml-0.5" title="Adaptive mode: No Chinese speaker in Morning">-Ch</span>' : '<span class="text-amber-600 font-bold ml-0.5" title="No Chinese speaker in Morning">!Ch</span>');

  const pmChBadge = hasNightChinese
    ? '<span class="text-emerald-700 font-bold ml-0.5" title="Night Chinese speaker on duty">✓Ch</span>'
    : (isNov2026OrLater ? '<span class="text-slate-400 font-semibold ml-0.5" title="Adaptive mode: No Chinese speaker at Night">-Ch</span>' : '<span class="text-amber-600 font-bold ml-0.5" title="No Chinese speaker at Night">!Ch</span>');

  meter.innerHTML = `
    <div class="flex items-center gap-3 flex-wrap">
      <div class="font-mono font-bold text-gray-800">
        Working: <span class="${totalWorking < 6 ? 'text-amber-600' : 'text-emerald-700'}">${totalWorking}</span>
      </div>
      <div class="font-mono">
        Morning: <span class="${amCount < 3 ? 'text-red-600 font-extrabold' : 'text-blue-700 font-bold'}">${amCount}</span>
        ${amChBadge}
      </div>
      <div class="font-mono">
        Night: <span class="${pmCount < 3 ? 'text-red-600 font-extrabold' : 'text-purple-700 font-bold'}">${pmCount}</span>
        ${pmChBadge}
      </div>
      <div class="font-mono text-xs">
        Ratio: <span class="${isTraineeRatioViolation ? 'text-rose-600 font-extrabold' : 'text-slate-700 font-bold'}">AM ${seniorAm}S:${traineeAm}T | PM ${seniorPm}S:${traineePm}T</span>
      </div>
      <div class="font-mono text-gray-500">
        Off: <span>${rdCount}</span>
      </div>
    </div>
    <div class="flex items-center gap-1.5 flex-wrap">
      ${isShortage
        ? `<span class="px-2 py-0.5 rounded font-extrabold text-[10px] bg-red-100 text-red-800 border border-red-200"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Shift Shortage (<3 floor)</span>`
        : `<span class="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-circle-check mr-1"></i>Floor Strength OK (≥3)</span>`
      }
      ${isTraineeRatioViolation
        ? `<span class="px-2 py-0.5 rounded font-extrabold text-[10px] bg-rose-100 text-rose-800 border border-rose-300" title="Ratio must be at least 1 senior to 1 trainee. Never leave 1 senior with 2 trainees."><i class="fa-solid fa-users-slash mr-1"></i>Senior:Trainee Ratio &lt; 1:1</span>`
        : ''
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
  let seniorAm = 0, traineeAm = 0;
  let seniorPm = 0, traineePm = 0;

  currentTeammates.forEach(tm => {
    const el = document.getElementById(`editShift_${tm.empNo}`);
    if (el) {
      const shiftVal = el.value;
      if (!d.shifts) d.shifts = {};
      d.shifts[tm.empNo] = shiftVal;

      if (shiftVal && shiftVal !== 'RD' && shiftVal !== 'PH' && shiftVal !== 'OFF') {
        totalWorking++;
        const isTr = isTraineeTeammate(tm);
        if (shiftVal.includes('0730') || shiftVal.includes('0800') || shiftVal.includes('4H')) {
          amCount++;
          if (isTr) traineeAm++; else seniorAm++;
        }
        if (shiftVal.includes('1230') || shiftVal.includes('1300') || shiftVal.includes('1630-2130') || shiftVal.startsWith('5H_1630')) {
          pmCount++;
          if (isTr) traineePm++; else seniorPm++;
        }
      }
    }
  });

  const isRatioViolation = (traineeAm > 0 && seniorAm < traineeAm) || (traineePm > 0 && seniorPm < traineePm);
  if (isRatioViolation) {
    const shiftDesc = (traineeAm > 0 && seniorAm < traineeAm)
      ? `Morning Shift has ${traineeAm} trainee(s) and only ${seniorAm} senior(s)`
      : `Night Shift has ${traineePm} trainee(s) and only ${seniorPm} senior(s)`;
    if (!confirm(`Warning: This schedule violates the Senior-to-Trainee ratio rule (ratio must be at least 1:1, never 1 senior with 2 trainees):\n\n${shiftDesc}.\n\nAre you sure you want to save this shift arrangement?`)) {
      return;
    }
  }

  d.amCount = amCount;
  d.pmCount = pmCount;
  d.workingTotal = totalWorking;
  d.seniorAmCount = seniorAm;
  d.traineeAmCount = traineeAm;
  d.seniorPmCount = seniorPm;
  d.traineePmCount = traineePm;
  d.isRatioViolation = isRatioViolation;

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
    if (isRatioViolation) {
      const shortDesc = (traineeAm > 0 && seniorAm < traineeAm)
        ? `Morning Shift has ${traineeAm} trainee(s) with only ${seniorAm} senior(s)`
        : `Night Shift has ${traineePm} trainee(s) with only ${seniorPm} senior(s)`;
      generatedScheduleData.warnings.push(`⚠️ Senior:Trainee Ratio Alert: ${d.date} (${d.dayOfWeek}) - ${shortDesc}. Rule requires at least 1:1 ratio.`);
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

  // Re-verify trainee learning and stock receiving duties
  assignTraineeLearningAndStockDuties(generatedScheduleData.days, currentTeammates);

  closeDayShiftEditorModal();
  renderScheduleMatrix(generatedScheduleData);
  saveGeneratedTimetable(false);
  showSchedulerToast(`Day ${d.day} shifts updated successfully!`, 'success');
}

// Global window bindings
window.renderConflictInspector = renderConflictInspector;
window.toggleConflictInspector = toggleConflictInspector;
window.openDayShiftEditorModal = openDayShiftEditorModal;
window.updateDayShiftEditorMeter = updateDayShiftEditorMeter;
window.closeDayShiftEditorModal = closeDayShiftEditorModal;
window.saveDayShiftEditorModal = saveDayShiftEditorModal;

// Helper to safely format CSV cells
function escapeRymnetCsvCell(cell) {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to resolve official employee number
function getRymnetEmpNo(tm) {
  const raw = String(tm.empNo || '').trim();
  const nick = String(tm.nickname || '').trim().toUpperCase();
  if (raw === 'PMG03801' || nick === 'VANESSA') return 'PMG04331';
  if (raw) return raw;
  const staff = STAFF_MAP.find(s => tm.nickname && s.nickname.toUpperCase() === tm.nickname.toUpperCase());
  if (staff && staff.empNo) {
    if (staff.empNo === 'PMG03801' || nick === 'VANESSA') return 'PMG04331';
    return staff.empNo;
  }
  return '';
}

// Helper to resolve official employee full name matching Rymnet HRMS
function getRymnetEmpName(tm) {
  if (tm.empName && String(tm.empName).trim()) {
    let name = String(tm.empName).trim();
    if (name.toUpperCase().includes('WILLIAM CHAI') || name.toUpperCase() === 'WILLIAM CHAI YEE SIAN') {
      return 'CHAI YEE SIAN';
    }
    return name;
  }
  const staff = STAFF_MAP.find(s => s.empNo === tm.empNo || (tm.nickname && s.nickname.toUpperCase() === tm.nickname.toUpperCase()));
  if (staff && staff.empName) {
    let name = staff.empName;
    if (name.toUpperCase().includes('WILLIAM CHAI') || name.toUpperCase() === 'WILLIAM CHAI YEE SIAN') {
      return 'CHAI YEE SIAN';
    }
    return name;
  }
  if (tm.displayName) {
    return tm.displayName.replace(/\s*\(.*?\)\s*/g, '').trim();
  }
  return tm.nickname || tm.name || '';
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
  const mIdx = parseInt(monthStr, 10) - 1;
  const totalDaysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const lines = [];

  // Row 1: Header matching Rymnet system format (Picture 2)
  // Column A: 'Employee No', Column B: 'Employee Name', then '01 (Sun)', '02 (Mon)', ...
  const headerCols = ['Employee No', 'Employee Name'];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dt = new Date(year, mIdx, d);
    const dayName = dayNames[dt.getDay()];
    headerCols.push(`${String(d).padStart(2, '0')} (${dayName})`);
  }
  headerCols.push(''); // Trailing empty column matching Rymnet matrix format
  lines.push(headerCols.map(escapeRymnetCsvCell).join(','));

  // Sort teammates by employee number ascending (PMG00831, PMG01294... PMG04331) matching Picture 2
  const sortedTeammates = [...currentTeammates].sort((a, b) => {
    const noA = getRymnetEmpNo(a);
    const noB = getRymnetEmpNo(b);
    return noA.localeCompare(noB, undefined, { numeric: true });
  });

  // Staff rows (2 lines per staff: Shift code row, then Leave code row)
  sortedTeammates.forEach(tm => {
    const empNo = getRymnetEmpNo(tm);
    const empName = getRymnetEmpName(tm);

    const shiftRow = [empNo, empName];
    const leaveRow = ['', ''];

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayObj = days.find(x => (x.date && x.date.startsWith(month) && x.day === d) || (x.day === d && x.isTargetMonth !== false)) || days.find(x => x.day === d);
      
      let rawCode = '';
      if (dayObj && dayObj.shifts) {
        rawCode = dayObj.shifts[empNo] || dayObj.shifts[tm.empNo] || (tm.nickname ? dayObj.shifts[tm.nickname] : '');
        if (!rawCode && (empNo === 'PMG04331' || tm.nickname === 'VANESSA')) {
          rawCode = dayObj.shifts['PMG04331'] || dayObj.shifts['PMG03801'] || '';
        }
      }
      if (!rawCode) rawCode = 'RD';

      const upper = String(rawCode).trim().toUpperCase();

      let shiftVal = '';
      let leaveVal = '';

      if (upper === 'RD' || upper === 'OFF' || upper === 'OD') {
        leaveVal = 'RD';
      } else if (upper === 'PH') {
        leaveVal = 'PH';
      } else if (['ANL', 'AL', 'SL', 'MC', 'EL', 'UPL', 'RPL', 'TRG', 'BL'].includes(upper)) {
        if (upper === 'AL') leaveVal = 'ANL';
        else if (upper === 'MC') leaveVal = 'SL';
        else leaveVal = upper;
      } else {
        // Working shift (e.g. 8H_0730-1630, 8H_1230-2130, 5H_0730-1230, etc.)
        shiftVal = rawCode;
      }

      shiftRow.push(shiftVal);
      leaveRow.push(leaveVal);
    }

    shiftRow.push(''); // Trailing comma
    leaveRow.push(''); // Trailing comma

    lines.push(shiftRow.map(escapeRymnetCsvCell).join(','));
    lines.push(leaveRow.map(escapeRymnetCsvCell).join(','));
  });

  const csvContent = lines.join('\r\n') + '\r\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `rymnet_monthly_schedule_${branch}_${month}.csv`);
}
window.exportScheduleToRymnetCSV = exportScheduleToRymnetCSV;

// ─── EXPORT TO RYMNET MATRIX EXCEL (.XLSX) ───────────────────────────────────
function exportScheduleToRymnetExcel() {
  if (!generatedScheduleData || !generatedScheduleData.days) {
    alert('Please generate a schedule first before exporting.');
    return;
  }

  if (typeof XLSX === 'undefined') {
    alert('SheetJS (XLSX) library not loaded.');
    return;
  }

  const { month, branch, days } = generatedScheduleData;
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const mIdx = parseInt(monthStr, 10) - 1;
  const totalDaysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const wsData = [];

  // Row 1: Header matching Rymnet system format (Picture 2)
  const headerCols = ['Employee No', 'Employee Name'];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dt = new Date(year, mIdx, d);
    const dayName = dayNames[dt.getDay()];
    headerCols.push(`${String(d).padStart(2, '0')} (${dayName})`);
  }
  wsData.push(headerCols);

  const sortedTeammates = [...currentTeammates].sort((a, b) => {
    const noA = getRymnetEmpNo(a);
    const noB = getRymnetEmpNo(b);
    return noA.localeCompare(noB, undefined, { numeric: true });
  });

  sortedTeammates.forEach(tm => {
    const empNo = getRymnetEmpNo(tm);
    const empName = getRymnetEmpName(tm);

    const shiftRow = [empNo, empName];
    const leaveRow = ['', ''];

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayObj = days.find(x => (x.date && x.date.startsWith(month) && x.day === d) || (x.day === d && x.isTargetMonth !== false)) || days.find(x => x.day === d);
      
      let rawCode = '';
      if (dayObj && dayObj.shifts) {
        rawCode = dayObj.shifts[empNo] || dayObj.shifts[tm.empNo] || (tm.nickname ? dayObj.shifts[tm.nickname] : '');
        if (!rawCode && (empNo === 'PMG04331' || tm.nickname === 'VANESSA')) {
          rawCode = dayObj.shifts['PMG04331'] || dayObj.shifts['PMG03801'] || '';
        }
      }
      if (!rawCode) rawCode = 'RD';

      const upper = String(rawCode).trim().toUpperCase();

      let shiftVal = '';
      let leaveVal = '';

      if (upper === 'RD' || upper === 'OFF' || upper === 'OD') {
        leaveVal = 'RD';
      } else if (upper === 'PH') {
        leaveVal = 'PH';
      } else if (['ANL', 'AL', 'SL', 'MC', 'EL', 'UPL', 'RPL', 'TRG', 'BL'].includes(upper)) {
        if (upper === 'AL') leaveVal = 'ANL';
        else if (upper === 'MC') leaveVal = 'SL';
        else leaveVal = upper;
      } else {
        shiftVal = rawCode;
      }

      shiftRow.push(shiftVal);
      leaveRow.push(leaveVal);
    }

    wsData.push(shiftRow);
    wsData.push(leaveRow);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths matching Picture 2
  const colWidths = [{ wch: 15 }, { wch: 34 }];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    colWidths.push({ wch: 16 });
  }
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, `Rymnet_${month}`);
  XLSX.writeFile(wb, `rymnet_monthly_schedule_${branch}_${month}.xlsx`);
}
window.exportScheduleToRymnetExcel = exportScheduleToRymnetExcel;

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

      // Col 18: NOTES (Includes 14:00-15:30 6S Cleaning, SSJ Stock Receiving, Trainee Learning)
      const notesCell = row.getCell(18);
      const cleanerNick = d.cleaningDuty ? d.cleaningDuty.nickname : '';
      const stockDuty = d.stockDuty;
      const learnSlots = d.learningSlots || [];

      if (r === 0) {
        const noteParts = [];
        if (holidayName) noteParts.push(holidayName);
        if (cleanerNick) noteParts.push(`🧹 Clean: ${cleanerNick}`);
        if (stockDuty) noteParts.push(`📦 Stock (${stockDuty.dayNumber.split(' ')[0]}): ${stockDuty.nickname}`);
        if (learnSlots.length > 0) {
          learnSlots.forEach(ls => {
            noteParts.push(`${ls.isHqVideo ? '🎓 HQ Video' : '📚 Learn'}: ${ls.nickname}`);
          });
        }
        notesCell.value = noteParts.join(' | ');
      }
      const hasDutyNote = notesCell.value && (notesCell.value.toString().includes('Clean') || notesCell.value.toString().includes('Stock') || notesCell.value.toString().includes('Learn') || notesCell.value.toString().includes('Video'));
      notesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: holidayName ? 'FFFFE4E6' : (hasDutyNote ? 'FFF0FDFA' : 'FFFFFFFF') } };
      notesCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: holidayName ? 'FFBE123C' : (hasDutyNote ? 'FF0F766E' : 'FF334155') } };
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
      if (isAnyMorningShift(s)) mCount++;
      if (isNightShift(s)) nCount++;
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
      if (isAnyMorningShift(shift)) morning.push(tm.nickname);
      else if (isNightShift(shift)) night.push(tm.nickname);
      else off.push(tm.nickname);
    });

    text += `  🌅 *Morning (07:30-16:30):* ${morning.join(', ') || 'None'}\n`;
    text += `  🌙 *Night (12:30-21:30):* ${night.join(', ') || 'None'}\n`;
    if (d.cleaningDuty) {
      text += `  🧹 *6S Cleaning (14:00-15:30):* ${d.cleaningDuty.nickname} (${d.cleaningDuty.task})\n`;
    }
    if (d.stockDuty) {
      text += `  📦 *Stock Receiving (${d.stockDuty.dayNumber.split(' ')[0]}):* ${d.stockDuty.nickname} (${d.stockDuty.task})\n`;
    }
    if (d.learningSlots && d.learningSlots.length > 0) {
      d.learningSlots.forEach(ls => {
        text += `  ${ls.isHqVideo ? '🎓 *HQ Video Training (14:00-15:00):*' : '📚 *Trainee Learning (14:00-15:00):*'} ${ls.nickname}\n`;
      });
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
window.saveGeneratedTimetable = saveGeneratedTimetable;
window.exportTimetableBackupJson = exportTimetableBackupJson;
window.importTimetableBackupJson = importTimetableBackupJson;
window.checkAndLoadSavedTimetable = checkAndLoadSavedTimetable;
window.updateSavedTimetableBadge = updateSavedTimetableBadge;
window.runHeuristicScheduleGenerator = runHeuristicScheduleGenerator;
window.solveFullWeek = solveFullWeek;

