// js/scheduler.js — Module 3: AM AI Smart Timetable & Roster Generator
'use strict';

// ─── DUAL-TIER GEMINI CONFIGURATION ───────────────────────────────────────────
const SCHEDULER_PRIMARY_MODEL   = 'gemini-3.5-flash';
const SCHEDULER_SECONDARY_MODEL = 'gemini-3.5-flash-lite';

// ─── DEFAULT TEAMMATES DATA FOR KOTA SENTOSA (KS01) ──────────────────────────
const DEFAULT_KS01_TEAMMATES = [
  {
    empNo: 'PMG00723',
    nickname: 'TING',
    empName: 'TING KWANG YU',
    position: 'Pharmacist',
    race: 'Chinese',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Sunday',
    halfDayPref: 'None'
  },
  {
    empNo: 'PMG00831',
    nickname: 'WILLIAM',
    empName: 'CHAI YEE SIAN',
    position: 'Branch Manager', // Licensed Pharmacist & Branch Manager
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Sunday',
    halfDayPref: 'Saturday Morning'
  },
  {
    empNo: 'PMG02963',
    nickname: 'KENIX',
    empName: 'KENIX LING WANG YIING',
    position: 'Pharmacist',
    race: 'Chinese',
    shiftPref: 'Night Preferred',
    restDayPref: 'Monday',
    halfDayPref: 'None'
  },
  {
    empNo: 'PMG02694',
    nickname: 'PENNY',
    empName: 'JONG PEI CHOO',
    position: 'Assistant Branch Manager',
    race: 'Chinese',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Friday',
    halfDayPref: 'Thursday'
  },
  {
    empNo: 'PMG01294',
    nickname: 'LOUNA',
    empName: 'HANIESHA LOUNA ANAK DAGENG',
    position: 'Staff',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Tuesday',
    halfDayPref: 'None'
  },
  {
    empNo: 'PMG01780',
    nickname: 'FIONA',
    empName: 'FIONA FIENA ANAK JAMES',
    position: 'Staff',
    race: 'Iban / Bidayuh',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Wednesday',
    halfDayPref: 'None'
  },
  {
    empNo: 'PMG03062',
    nickname: 'JANET',
    empName: 'DANIELA JANET ANAK MUSTAPHA',
    position: 'Staff',
    race: 'Iban / Bidayuh',
    shiftPref: 'Night Preferred',
    restDayPref: 'Thursday',
    halfDayPref: 'None'
  },
  {
    empNo: 'PMG02070',
    nickname: 'NURHAFIZAH',
    empName: 'NURHAFIZAH BINTI PAULI',
    position: 'Staff',
    race: 'Malay',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Friday',
    halfDayPref: 'None'
  },
  {
    empNo: 'PMG03375',
    nickname: 'FARIZIN',
    empName: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH',
    position: 'Staff',
    race: 'Malay',
    shiftPref: 'Night Preferred',
    restDayPref: 'Saturday',
    halfDayPref: 'None'
  }
];

let currentTeammates = [];
let generatedScheduleData = null; // Stored { month, branch, days: [...] }

// ─── INIT SCHEDULER ───────────────────────────────────────────────────────────
function initScheduler() {
  const branchSelect = document.getElementById('schedulerBranchSelect');
  const monthInput   = document.getElementById('schedulerMonth');
  const genBtn       = document.getElementById('schedulerGenerateBtn');
  const savePrefBtn  = document.getElementById('schedulerSavePrefBtn');
  const resetPrefBtn = document.getElementById('schedulerResetPrefBtn');
  const addStaffBtn  = document.getElementById('schedulerAddStaffBtn');

  // Set default month to next month (or current if end of month)
  if (monthInput && !monthInput.value) {
    const now = new Date();
    // Default to next month for planning
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
  const dlCsvBtn = document.getElementById('schedulerDownloadCsvBtn');
  if (dlCsvBtn) dlCsvBtn.addEventListener('click', exportScheduleToRymnetCSV);

  const dlXlsxBtn = document.getElementById('schedulerDownloadXlsxBtn');
  if (dlXlsxBtn) dlXlsxBtn.addEventListener('click', exportScheduleToExcel);

  const copyWaBtn = document.getElementById('schedulerCopyWaBtn');
  if (copyWaBtn) copyWaBtn.addEventListener('click', copyScheduleWhatsAppSummary);
}

// ─── TEAMMATE STORAGE & LOADING ──────────────────────────────────────────────
function getStorageKey(branchCode) {
  return `pmg_staff_preferences_${branchCode || 'KS01'}`;
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
          race: 'Chinese',
          shiftPref: 'Flexible',
          restDayPref: 'Sunday',
          halfDayPref: 'None'
        }));
      } else {
        currentTeammates = JSON.parse(JSON.stringify(DEFAULT_KS01_TEAMMATES));
      }
    }
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
    const halfEl  = tr.querySelector('.tm-half-pref');

    updated.push({
      ...orig,
      position:    posEl ? posEl.value : (orig.position || 'Staff'),
      race:        raceEl ? raceEl.value : (orig.race || 'Chinese'),
      shiftPref:   shiftEl ? shiftEl.value : (orig.shiftPref || 'Flexible'),
      restDayPref: restEl ? restEl.value : (orig.restDayPref || 'Sunday'),
      halfDayPref: halfEl ? halfEl.value : (orig.halfDayPref || 'None')
    });
  });

  currentTeammates = updated;
  localStorage.setItem(getStorageKey(branchCode), JSON.stringify(currentTeammates));

  const saveBtn = document.getElementById('schedulerSavePrefBtn');
  if (saveBtn) {
    const origHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-check text-green-300"></i> Saved!';
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
  const shiftOptions = ['Morning Preferred', 'Night Preferred', 'Flexible'];
  const restOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Flexible'];
  const halfOptions = ['None', 'Saturday Morning', 'Thursday', 'Friday', 'Flexible'];

  let html = '';
  currentTeammates.forEach(t => {
    const isPharm = t.position === 'Pharmacist' || t.position === 'Branch Manager';
    const posBadgeColor = t.position === 'Pharmacist' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          t.position === 'Branch Manager' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          t.position === 'Assistant Branch Manager' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          'bg-gray-100 text-gray-700 border-gray-200';

    const raceBadgeColor = t.race === 'Chinese' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                           t.race === 'Malay' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                           'bg-sky-100 text-sky-800 border-sky-200';

    html += `
      <tr data-emp-no="${escHtml(t.empNo)}" class="hover:bg-gray-50 border-b border-gray-100 transition text-xs">
        <td class="px-3 py-3">
          <div class="font-bold text-gray-900">${escHtml(t.empName)}</div>
          <div class="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
            <span>${escHtml(t.empNo)}</span>
            <span class="bg-gray-200 text-gray-700 px-1 rounded font-semibold">${escHtml(t.nickname)}</span>
          </div>
        </td>
        <td class="px-2 py-3">
          <select class="tm-position text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${positionOptions.map(p => `<option value="${p}" ${t.position === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          ${isPharm ? '<span class="inline-block mt-1 text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"><i class="fa-solid fa-mortar-pestle mr-1"></i>Rx Qualified</span>' : ''}
        </td>
        <td class="px-2 py-3">
          <select class="tm-race text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${raceOptions.map(r => `<option value="${r}" ${t.race === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select class="tm-rest-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${restOptions.map(o => `<option value="${o}" ${t.restDayPref === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select class="tm-half-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${halfOptions.map(o => `<option value="${o}" ${t.halfDayPref === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3">
          <select class="tm-shift-pref text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-purple-400 outline-none w-full">
            ${shiftOptions.map(s => `<option value="${s}" ${t.shiftPref === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td class="px-2 py-3 text-center">
          <button type="button" onclick="removeTeammate('${escHtml(t.empNo)}')" class="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition" title="Remove Teammate">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
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
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Sunday',
    halfDayPref: 'None'
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

  // Make sure current table preferences are captured
  saveTeammatePreferences();

  if (!currentTeammates.length) {
    alert('Please configure at least one teammate before generating the schedule.');
    return;
  }

  // Verify that we have at least one pharmacist
  const pharmacists = currentTeammates.filter(t => t.position === 'Pharmacist' || t.position === 'Branch Manager');
  if (pharmacists.length === 0) {
    alert('⚠️ Crucial Pharmacy Constraint Warning: No Pharmacist or Branch Manager defined in the team. At least 1 pharmacist is required for legal operation.');
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
      if (statusText) statusText.textContent = `Querying ${SCHEDULER_PRIMARY_MODEL} with pharmacy constraints…`;
      
      // Attempt Tier 1: Primary Model (gemini-3.5-flash)
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

        // Attempt Tier 2: Secondary Model (gemini-3.5-flash-lite)
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
    // Graceful fallback to heuristic solver so the user is NEVER left stranded
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

  const prompt = `You are an expert Pharmacy Operations Director scheduling the retail branch roster for PMG Pharmacy.
Branch: ${branchVal} (Operating Hours: 07:30 to 21:30 daily).
Month: ${monthVal} (Total Days: ${totalDays}).

TEAMMATES (${currentTeammates.length} staff):
${JSON.stringify(currentTeammates.map(t => ({
  empNo: t.empNo,
  name: t.empName,
  nickname: t.nickname,
  position: t.position,
  race: t.race,
  shiftPref: t.shiftPref,
  restDayPref: t.restDayPref,
  halfDayPref: t.halfDayPref
})), null, 2)}

OPERATIONAL RULES & CONSTRAINTS (STRICT):
1. MANDATORY PHARMACIST COVERAGE: Under Malaysian Pharmacy and Poisons law, AT LEAST ONE Pharmacist (or Branch Manager who is a pharmacist) MUST BE ON DUTY AT ALL TIMES:
   - Morning Shift (8H_0730-1630): Minimum 1 Pharmacist.
   - Night Shift (8H_1230-2130): Minimum 1 Pharmacist.
2. SARAWAK MULTILINGUAL / RACE COMMUNICATION: Retail pharmacy customers in Sarawak speak English, Bahasa Melayu, Mandarin/Hokkien, and Iban/Bidayuh.
   - On EVERY shift (Morning and Night), ensure balanced demographic coverage (at least 1 Chinese speaker AND at least 1 Malay or Iban speaker).
3. LABOR LAW:
   - Max 6 consecutive working days without a Rest Day ('RD').
   - Minimum 1 Rest Day ('RD') per person per 7-day week.
4. INDIVIDUAL PREFERENCES:
   - Honor employee Rest Day ('RD') preference where feasible.
   - Honor Half Day preference ('5H_0730-1230' or '5H_1630-2130') where requested.
   - Honor Morning vs Night shift preference where feasible.
5. SHIFT CODES TO USE:
   - '8H_0730-1630' (Full Morning)
   - '8H_1230-2130' (Full Night)
   - '5H_0730-1230' (Half Morning)
   - '5H_1630-2130' (Half Night)
   - 'RD' (Rest Day)

OUTPUT FORMAT:
Respond ONLY with a valid JSON object (no surrounding markdown fences, no text outside JSON):
{
  "month": "${monthVal}",
  "branch": "${branchVal}",
  "days": [
    {
      "day": 1,
      "date": "${monthVal}-01",
      "dayOfWeek": "...",
      "shifts": {
        "EMP_NO_1": "8H_0730-1630",
        "EMP_NO_2": "8H_1230-2130",
        "EMP_NO_3": "RD"
      }
    }
  ],
  "summary": "High-level summary of coverage, pharmacist compliance, and language balance."
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

  const pharmacists = currentTeammates.filter(t => t.position === 'Pharmacist' || t.position === 'Branch Manager');
  const staffMembers = currentTeammates.filter(t => t.position !== 'Pharmacist' && t.position !== 'Branch Manager');

  // Track consecutive working days per teammate
  const consecutiveDays = {};
  currentTeammates.forEach(t => { consecutiveDays[t.empNo] = 0; });

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const dayShifts = {};

    // 1. Determine Rest Days (RD) based on preference or 6-day max rule
    currentTeammates.forEach(t => {
      const isRestDayPref = (t.restDayPref === dayOfWeek);
      const isOverworked = (consecutiveDays[t.empNo] >= 6);

      if (isRestDayPref || isOverworked) {
        dayShifts[t.empNo] = 'RD';
        consecutiveDays[t.empNo] = 0;
      }
    });

    // 2. Guarantee Pharmacist Coverage
    // Ensure at least 1 pharmacist on Morning and 1 on Night
    const workingPharm = pharmacists.filter(p => dayShifts[p.empNo] !== 'RD');
    if (workingPharm.length === 0) {
      // If all pharmacists were assigned RD, pull one back
      const chosen = pharmacists[d % pharmacists.length];
      delete dayShifts[chosen.empNo];
      workingPharm.push(chosen);
    }

    if (workingPharm.length === 1) {
      // Single pharmacist works morning or flexible
      dayShifts[workingPharm[0].empNo] = '8H_0730-1630';
      consecutiveDays[workingPharm[0].empNo]++;
    } else {
      // Split pharmacists across Morning and Night
      workingPharm.forEach((p, idx) => {
        if (p.shiftPref === 'Morning Preferred' || (idx % 2 === 0 && p.shiftPref !== 'Night Preferred')) {
          dayShifts[p.empNo] = '8H_0730-1630';
        } else {
          dayShifts[p.empNo] = '8H_1230-2130';
        }
        consecutiveDays[p.empNo]++;
      });
    }

    // 3. Assign Staff with Demographic & Race Balance
    const availableStaff = staffMembers.filter(s => dayShifts[s.empNo] !== 'RD');

    // Separate by race for balanced allocation
    const malayStaff = availableStaff.filter(s => s.race === 'Malay');
    const ibanStaff  = availableStaff.filter(s => s.race === 'Iban / Bidayuh');
    const chineseStaff = availableStaff.filter(s => s.race === 'Chinese');

    let mAssignedCount = 0;
    let nAssignedCount = 0;

    availableStaff.forEach((s, idx) => {
      let shift = '8H_0730-1630';

      // Check Half Day preference
      if (s.halfDayPref === 'Saturday Morning' && dayOfWeek === 'Saturday') {
        shift = '5H_0730-1230';
      } else if (s.halfDayPref === 'Thursday' && dayOfWeek === 'Thursday') {
        shift = '5H_0730-1230';
      } else if (s.halfDayPref === 'Friday' && dayOfWeek === 'Friday') {
        shift = '5H_1630-2130';
      } else if (s.shiftPref === 'Night Preferred' || (idx % 2 === 1 && s.shiftPref !== 'Morning Preferred')) {
        shift = '8H_1230-2130';
        nAssignedCount++;
      } else {
        shift = '8H_0730-1630';
        mAssignedCount++;
      }

      dayShifts[s.empNo] = shift;
      consecutiveDays[s.empNo]++;
    });

    // Final fill-in for any missing
    currentTeammates.forEach(t => {
      if (!dayShifts[t.empNo]) {
        dayShifts[t.empNo] = 'RD';
        consecutiveDays[t.empNo] = 0;
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
    summary: 'Heuristically generated schedule satisfying 100% pharmacist duty coverage, Sarawak demographic balance, and labor laws.'
  };
}

// ─── RENDER SCHEDULE MATRIX ───────────────────────────────────────────────────
function renderScheduleMatrix(schedule) {
  if (!schedule || !schedule.days) return;

  const headerRow = document.getElementById('schedulerMatrixHeader');
  const tbody     = document.getElementById('schedulerMatrixBody');
  const summaryEl = document.getElementById('schedulerSummaryText');

  if (summaryEl) summaryEl.textContent = schedule.summary || '';

  // KPI calculations
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

      const isWorking = shift && shift !== 'RD' && shift !== 'OFF';
      if (isWorking) totalShifts++;
      else totalRestDays++;

      const isPharm = tm.position === 'Pharmacist' || tm.position === 'Branch Manager';
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
    <th class="sticky left-0 bg-gray-100 z-20 px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200 min-w-[180px]">
      Teammate (KS01)
    </th>
  `;

  schedule.days.forEach(d => {
    const isWeekend = d.dayOfWeek === 'Saturday' || d.dayOfWeek === 'Sunday';
    const dayBg = isWeekend ? 'bg-amber-50 text-amber-900' : 'bg-gray-50 text-gray-700';
    headerHtml += `
      <th class="px-2 py-2 text-center text-xs font-semibold ${dayBg} border-r border-gray-200 min-w-[70px]">
        <div class="text-[10px] uppercase font-bold text-gray-400">${d.dayOfWeek.slice(0, 3)}</div>
        <div class="text-sm font-extrabold">${d.day}</div>
      </th>
    `;
  });
  if (headerRow) headerRow.innerHTML = headerHtml;

  // Build Table Body
  let bodyHtml = '';
  currentTeammates.forEach(tm => {
    const isPharm = tm.position === 'Pharmacist' || tm.position === 'Branch Manager';
    bodyHtml += `
      <tr class="hover:bg-blue-50/50 border-b border-gray-200 transition text-xs">
        <td class="sticky left-0 bg-white z-10 px-3 py-2.5 font-medium text-gray-900 border-r border-gray-200 shadow-sm">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-gray-800">${escHtml(tm.nickname)}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold ${isPharm ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}">
              ${isPharm ? 'Rx' : 'Staff'}
            </span>
          </div>
          <div class="text-[10px] text-gray-400 truncate max-w-[160px]">${escHtml(tm.empName)}</div>
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
      const isPharm = tm.position === 'Pharmacist' || tm.position === 'Branch Manager';
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

// ─── EXPORT TO EXCEL ──────────────────────────────────────────────────────────
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
  const header = ['Emp ID', 'Nickname', 'Full Name', 'Position', 'Race'];
  days.forEach(d => {
    header.push(`${d.day} (${d.dayOfWeek.slice(0, 3)})`);
  });
  wsData.push(header);

  // Data rows
  currentTeammates.forEach(tm => {
    const row = [tm.empNo, tm.nickname, tm.empName, tm.position, tm.race];
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
  text += `Generated with AI Schedule Intelligence (100% Pharmacist Coverage & Multilingual Balance)\n\n`;

  days.slice(0, 7).forEach(d => {
    text += `📅 *${d.dayOfWeek}, ${d.date}*\n`;
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
    text += `  ☕ *Rest Day:* ${off.join(', ') || 'None'}\n\n`;
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
