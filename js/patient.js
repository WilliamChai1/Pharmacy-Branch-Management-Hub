// js/patient.js — Patient Care, Chronic Refill & Appointment Management Engine
'use strict';

// ─── STORAGE KEY & DEFAULT SEED DATA ─────────────────────────────────────────
const PATIENTS_STORAGE_KEY = 'pmg_patients_data_v1';

// Helper to get formatted date string (YYYY-MM-DD)
function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_PATIENTS_DATA = [
  {
    id: 'PT-1001',
    name: 'Tan Ah Kow',
    ic: '640512-13-5431',
    phone: '+60168889922',
    gender: 'Male',
    age: 62,
    race: 'Chinese',
    language: 'Chinese',
    branch: 'KS01',
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: 'Penicillin',
    notes: 'Prefers morning appointments before 11:00 AM.',
    createdAt: getTodayDateString(-60),
    screenings: [
      {
        id: 'SC-101',
        date: getTodayDateString(-30),
        bpSys: 136,
        bpDia: 86,
        pulse: 74,
        glucose: 6.8,
        glucoseType: 'Fasting',
        cholesterol: 5.1,
        uricAcid: 380,
        weight: 72,
        height: 168,
        recordedBy: 'William Chai (Pharmacist)',
        notes: 'BP slightly elevated. Reminded on low sodium diet and regular brisk walking.'
      },
      {
        id: 'SC-102',
        date: getTodayDateString(-60),
        bpSys: 144,
        bpDia: 92,
        pulse: 78,
        glucose: 7.4,
        glucoseType: 'Fasting',
        cholesterol: 5.6,
        uricAcid: 410,
        weight: 73.5,
        height: 168,
        recordedBy: 'Kenix Ling (Pharmacist)',
        notes: 'Initial check, medication compliance emphasized.'
      }
    ],
    medications: [
      {
        id: 'MED-101',
        name: 'Amlodipine 10mg',
        dosage: '1 tab OD (Morning)',
        lastDispensed: getTodayDateString(-28),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(2)
      },
      {
        id: 'MED-102',
        name: 'Metformin 500mg',
        dosage: '1 tab BD (With meals)',
        lastDispensed: getTodayDateString(-28),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(2)
      }
    ],
    appointments: [
      {
        id: 'APT-101',
        date: getTodayDateString(1), // Tomorrow
        time: '10:30',
        purpose: 'Chronic Refill & BP Review',
        status: 'Scheduled',
        notes: 'Prepare Amlodipine 10mg and Metformin 500mg 1 month pack in advance.'
      }
    ]
  },
  {
    id: 'PT-1002',
    name: 'Hajah Fatimah Binti Osman',
    ic: '680824-13-5890',
    phone: '+60138012345',
    gender: 'Female',
    age: 58,
    race: 'Malay',
    language: 'Malay',
    branch: 'KS01',
    conditions: ['Dyslipidemia', 'Hypertension'],
    allergies: 'None',
    notes: 'Takes medication faithfully. Monitored for lipid profile.',
    createdAt: getTodayDateString(-90),
    screenings: [
      {
        id: 'SC-103',
        date: getTodayDateString(-35),
        bpSys: 142,
        bpDia: 90,
        pulse: 70,
        glucose: 5.9,
        glucoseType: 'Random',
        cholesterol: 6.2,
        uricAcid: 310,
        weight: 65,
        height: 155,
        recordedBy: 'William Chai (Pharmacist)',
        notes: 'Cholesterol above target. Recommended CoQ10 companion with Atorvastatin.'
      }
    ],
    medications: [
      {
        id: 'MED-103',
        name: 'Atorvastatin 20mg',
        dosage: '1 tab ON (Night)',
        lastDispensed: getTodayDateString(-35),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(-5) // Overdue by 5 days!
      },
      {
        id: 'MED-104',
        name: 'Perindopril 4mg',
        dosage: '1 tab OD (Morning)',
        lastDispensed: getTodayDateString(-35),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(-5) // Overdue
      }
    ],
    appointments: [
      {
        id: 'APT-102',
        date: getTodayDateString(-5),
        time: '14:30',
        purpose: 'Lipid Review & Refill',
        status: 'Missed',
        notes: 'Patient did not attend on Friday. Needs WhatsApp recall.'
      }
    ]
  },
  {
    id: 'PT-1003',
    name: 'Alexander Anak Stephen',
    ic: '811105-13-6113',
    phone: '+60198547210',
    gender: 'Male',
    age: 45,
    race: 'Iban / Bidayuh',
    language: 'English',
    branch: 'KS01',
    conditions: ['Hyperuricemia / Gout'],
    allergies: 'Aspirin',
    notes: 'Recurrent gout flare-ups. Needs uric acid re-test.',
    createdAt: getTodayDateString(-45),
    screenings: [
      {
        id: 'SC-104',
        date: getTodayDateString(-15),
        bpSys: 122,
        bpDia: 78,
        pulse: 72,
        glucose: 5.4,
        glucoseType: 'Fasting',
        cholesterol: 4.8,
        uricAcid: 495,
        weight: 84,
        height: 172,
        recordedBy: 'Kenix Ling (Pharmacist)',
        notes: 'Uric acid elevated at 495 umol/L. Counselled on purine-rich food reduction.'
      }
    ],
    medications: [
      {
        id: 'MED-105',
        name: 'Allopurinol 100mg',
        dosage: '1 tab OD (After food)',
        lastDispensed: getTodayDateString(-15),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(15)
      }
    ],
    appointments: [
      {
        id: 'APT-103',
        date: getTodayDateString(0), // Today!
        time: '15:00',
        purpose: 'Uric Acid Re-test & Consultation',
        status: 'Scheduled',
        notes: 'Perform fingerprick uric acid check and check joint pain status.'
      }
    ]
  },
  {
    id: 'PT-1004',
    name: 'Bong Nyuk Chin',
    ic: '580315-13-5122',
    phone: '+60128765432',
    gender: 'Female',
    age: 68,
    race: 'Chinese',
    language: 'Chinese',
    branch: 'KS01',
    conditions: ['Hypertension', 'Osteoarthritis'],
    allergies: 'None',
    notes: 'Daughter usually comes to collect refill.',
    createdAt: getTodayDateString(-120),
    screenings: [
      {
        id: 'SC-105',
        date: getTodayDateString(-20),
        bpSys: 130,
        bpDia: 80,
        pulse: 68,
        glucose: 5.8,
        glucoseType: 'Random',
        cholesterol: 4.9,
        uricAcid: 340,
        weight: 58,
        height: 152,
        recordedBy: 'William Chai (Pharmacist)',
        notes: 'BP well controlled. Recommended Glucosamine + Chondroitin for knee joint.'
      }
    ],
    medications: [
      {
        id: 'MED-106',
        name: 'Telmisartan 40mg',
        dosage: '1 tab OD',
        lastDispensed: getTodayDateString(-20),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(10)
      }
    ],
    appointments: [
      {
        id: 'APT-104',
        date: getTodayDateString(4),
        time: '11:00',
        purpose: 'BP Review & Joint Supplement',
        status: 'Scheduled',
        notes: 'Check knee mobility and refill Telmisartan.'
      }
    ]
  },
  {
    id: 'PT-1005',
    name: 'Mohd Razif Bin Kassim',
    ic: '730919-13-5567',
    phone: '+60178901234',
    gender: 'Male',
    age: 53,
    race: 'Malay',
    language: 'Malay',
    branch: 'BR02',
    conditions: ['Hypertension', 'Dyslipidemia'],
    allergies: 'None',
    notes: 'Branch 02 chronic regular patient.',
    createdAt: getTodayDateString(-70),
    screenings: [
      {
        id: 'SC-106',
        date: getTodayDateString(-25),
        bpSys: 138,
        bpDia: 88,
        pulse: 76,
        glucose: 6.1,
        glucoseType: 'Random',
        cholesterol: 5.8,
        uricAcid: 370,
        weight: 78,
        height: 169,
        recordedBy: 'Branch 02 Pharmacist',
        notes: 'BP moderate. Advised regular exercise.'
      }
    ],
    medications: [
      {
        id: 'MED-107',
        name: 'Simvastatin 20mg',
        dosage: '1 tab ON',
        lastDispensed: getTodayDateString(-25),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(5)
      }
    ],
    appointments: [
      {
        id: 'APT-105',
        date: getTodayDateString(5),
        time: '11:30',
        purpose: 'Chronic Refill',
        status: 'Scheduled',
        notes: 'Refill Simvastatin 20mg.'
      }
    ]
  }
];

let patientsData = [];
let activePatientSubTab = 'today'; // 'today', 'upcoming', 'overdue', 'all'
let viewingPatientId = null;

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
function initPatientModule() {
  loadPatientsData();
  setupPatientEventListeners();
  renderPatientModule();
}

function loadPatientsData() {
  const saved = localStorage.getItem(PATIENTS_STORAGE_KEY);
  if (saved) {
    try {
      patientsData = JSON.parse(saved);
    } catch {
      patientsData = JSON.parse(JSON.stringify(DEFAULT_PATIENTS_DATA));
    }
  } else {
    patientsData = JSON.parse(JSON.stringify(DEFAULT_PATIENTS_DATA));
    savePatientsData();
  }
}

function savePatientsData() {
  localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
function setupPatientEventListeners() {
  // Subtab switching
  ['today', 'upcoming', 'overdue', 'all'].forEach(tab => {
    const btn = document.getElementById(`patientSubTabBtn_${tab}`);
    if (btn) {
      btn.addEventListener('click', () => switchPatientSubTab(tab));
    }
  });

  // Branch filter
  const branchFilter = document.getElementById('patientBranchFilter');
  if (branchFilter) {
    branchFilter.addEventListener('change', () => renderPatientModule());
  }

  // Search input
  const searchInput = document.getElementById('patientSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderPatientModule());
  }

  // Modals & Action buttons
  const newPatientBtn = document.getElementById('patientNewBtn');
  if (newPatientBtn) newPatientBtn.addEventListener('click', () => showNewPatientModal());

  const newScreeningBtn = document.getElementById('patientNewScreeningBtn');
  if (newScreeningBtn) newScreeningBtn.addEventListener('click', () => showNewScreeningModal());

  const newAptBtn = document.getElementById('patientNewAptBtn');
  if (newAptBtn) newAptBtn.addEventListener('click', () => showNewAppointmentModal());

  const exportBtn = document.getElementById('patientExportExcelBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportPatientDataToExcel);
}

function switchPatientSubTab(tab) {
  activePatientSubTab = tab;
  ['today', 'upcoming', 'overdue', 'all'].forEach(t => {
    const btn = document.getElementById(`patientSubTabBtn_${t}`);
    const view = document.getElementById(`patientView_${t}`);
    if (btn) {
      if (t === tab) {
        btn.classList.add('border-blue-700', 'text-blue-700', 'active');
        btn.classList.remove('border-transparent', 'text-gray-500');
      } else {
        btn.classList.remove('border-blue-700', 'text-blue-700', 'active');
        btn.classList.add('border-transparent', 'text-gray-500');
      }
    }
    if (view) {
      if (t === tab) view.classList.remove('hidden');
      else view.classList.add('hidden');
    }
  });
  renderPatientModule();
}

// ─── CLINICAL CLASSIFICATION HELPERS ─────────────────────────────────────────
function getBpClassification(sys, dia) {
  sys = Number(sys) || 0;
  dia = Number(dia) || 0;
  if (!sys || !dia) return { label: '—', badge: 'bg-gray-100 text-gray-600' };

  if (sys > 180 || dia > 120) {
    return { label: 'Crisis Alert', badge: 'bg-red-700 text-white font-bold animate-pulse' };
  } else if (sys >= 140 || dia >= 90) {
    return { label: 'Stage 2 HTN', badge: 'bg-red-100 text-red-700 font-semibold' };
  } else if (sys >= 130 || dia >= 80) {
    return { label: 'Stage 1 HTN', badge: 'bg-amber-100 text-amber-700 font-semibold' };
  } else if (sys >= 120 && dia < 80) {
    return { label: 'Elevated', badge: 'bg-yellow-100 text-yellow-800 font-semibold' };
  } else {
    return { label: 'Normal', badge: 'bg-green-100 text-green-700 font-semibold' };
  }
}

function getGlucoseClassification(val, type = 'Fasting') {
  val = Number(val) || 0;
  if (!val) return { label: '—', badge: 'bg-gray-100 text-gray-600' };

  if (type === 'Fasting') {
    if (val >= 7.0) return { label: 'High (Diabetic)', badge: 'bg-red-100 text-red-700 font-semibold' };
    if (val >= 5.6) return { label: 'Impaired (Pre-DM)', badge: 'bg-amber-100 text-amber-700 font-semibold' };
    return { label: 'Normal', badge: 'bg-green-100 text-green-700 font-semibold' };
  } else {
    if (val >= 11.1) return { label: 'High (Diabetic)', badge: 'bg-red-100 text-red-700 font-semibold' };
    if (val >= 7.8) return { label: 'Elevated', badge: 'bg-amber-100 text-amber-700 font-semibold' };
    return { label: 'Normal', badge: 'bg-green-100 text-green-700 font-semibold' };
  }
}

function getCholesterolClassification(val) {
  val = Number(val) || 0;
  if (!val) return { label: '—', badge: 'bg-gray-100 text-gray-600' };
  if (val >= 6.2) return { label: 'High', badge: 'bg-red-100 text-red-700 font-semibold' };
  if (val >= 5.2) return { label: 'Borderline', badge: 'bg-amber-100 text-amber-700 font-semibold' };
  return { label: 'Desirable', badge: 'bg-green-100 text-green-700 font-semibold' };
}

function getUricAcidClassification(val, gender = 'Male') {
  val = Number(val) || 0;
  if (!val) return { label: '—', badge: 'bg-gray-100 text-gray-600' };
  const threshold = gender === 'Female' ? 360 : 420;
  if (val > threshold) return { label: 'Elevated (High)', badge: 'bg-red-100 text-red-700 font-semibold' };
  return { label: 'Normal', badge: 'bg-green-100 text-green-700 font-semibold' };
}

function getBmiClassification(weight, height) {
  weight = Number(weight) || 0;
  height = Number(height) || 0;
  if (!weight || !height) return { bmi: '—', label: '—', badge: 'bg-gray-100 text-gray-600' };
  const m = height / 100;
  const bmi = (weight / (m * m)).toFixed(1);
  if (bmi >= 27.5) return { bmi, label: 'Obese', badge: 'bg-red-100 text-red-700 font-semibold' };
  if (bmi >= 23.0) return { bmi, label: 'Overweight', badge: 'bg-amber-100 text-amber-700 font-semibold' };
  if (bmi < 18.5) return { bmi, label: 'Underweight', badge: 'bg-yellow-100 text-yellow-800 font-semibold' };
  return { bmi, label: 'Normal', badge: 'bg-green-100 text-green-700 font-semibold' };
}

// ─── RENDER MAIN MODULE ──────────────────────────────────────────────────────
function renderPatientModule() {
  const session = getSession();
  const isAM = session && session.role === 'AM';
  const branchFilterEl = document.getElementById('patientBranchFilter');
  const searchInput = document.getElementById('patientSearchInput');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

  // Populate branch filter if needed
  if (branchFilterEl && branchFilterEl.options.length <= 1) {
    branchFilterEl.innerHTML = '<option value="">All Branches</option>';
    if (typeof BRANCHES !== 'undefined') {
      BRANCHES.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.code;
        opt.textContent = `${b.code} – ${b.name}`;
        branchFilterEl.appendChild(opt);
      });
    }
    // Default to user's branch if BM
    if (!isAM && session && session.branch && session.branch !== 'ALL') {
      branchFilterEl.value = session.branch;
      branchFilterEl.disabled = true;
    }
  }

  const selectedBranch = branchFilterEl ? branchFilterEl.value : '';

  // Filter patients by branch and query
  const filteredPatients = patientsData.filter(p => {
    if (selectedBranch && p.branch !== selectedBranch) return false;
    if (query) {
      const matchName = p.name.toLowerCase().includes(query);
      const matchIc = (p.ic || '').toLowerCase().includes(query);
      const matchPhone = (p.phone || '').includes(query);
      const matchCond = (p.conditions || []).some(c => c.toLowerCase().includes(query));
      if (!matchName && !matchIc && !matchPhone && !matchCond) return false;
    }
    return true;
  });

  // Calculate KPIs
  const todayStr = getTodayDateString(0);
  const next7DaysStr = getTodayDateString(7);

  let todayAptCount = 0;
  let dueIn7DaysCount = 0;
  let overdueCount = 0;
  const totalPatientsCount = filteredPatients.length;

  const todayList = [];
  const upcomingList = [];
  const overdueList = [];

  filteredPatients.forEach(p => {
    // Check appointments
    (p.appointments || []).forEach(apt => {
      const isPending = apt.status === 'Scheduled';
      if (apt.date === todayStr && isPending) {
        todayAptCount++;
        todayList.push({ patient: p, appointment: apt });
      } else if (apt.date > todayStr && apt.date <= next7DaysStr && isPending) {
        dueIn7DaysCount++;
        upcomingList.push({ patient: p, appointment: apt });
      } else if (apt.date < todayStr && (apt.status === 'Scheduled' || apt.status === 'Missed')) {
        overdueCount++;
        overdueList.push({ patient: p, appointment: apt, type: 'Missed Appointment' });
      }
    });

    // Check chronic refill due dates
    (p.medications || []).forEach(med => {
      if (med.nextRefillDate) {
        if (med.nextRefillDate < todayStr) {
          // Check if not already in overdue list
          const exists = overdueList.some(item => item.patient.id === p.id && item.medication && item.medication.id === med.id);
          if (!exists) {
            overdueCount++;
            overdueList.push({ patient: p, medication: med, type: 'Overdue Refill' });
          }
        } else if (med.nextRefillDate >= todayStr && med.nextRefillDate <= next7DaysStr) {
          dueIn7DaysCount++;
        }
      }
    });
  });

  // Update KPI Cards in DOM
  const kpiTodayEl = document.getElementById('kpiPatientToday');
  const kpiDueEl = document.getElementById('kpiPatientDue7');
  const kpiOverdueEl = document.getElementById('kpiPatientOverdue');
  const kpiTotalEl = document.getElementById('kpiPatientTotal');

  if (kpiTodayEl) kpiTodayEl.textContent = todayAptCount;
  if (kpiDueEl) kpiDueEl.textContent = dueIn7DaysCount;
  if (kpiOverdueEl) kpiOverdueEl.textContent = overdueCount;
  if (kpiTotalEl) kpiTotalEl.textContent = totalPatientsCount;

  // Render Sub-tab views
  renderTodayQueue(todayList);
  renderUpcomingQueue(upcomingList);
  renderOverdueQueue(overdueList);
  renderPatientDirectory(filteredPatients);
}

// ─── RENDER QUEUES ───────────────────────────────────────────────────────────
function renderTodayQueue(items) {
  const tbody = document.getElementById('patientTodayBody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400 text-sm">
      <i class="fa-regular fa-calendar-check text-2xl mb-2 text-gray-300 block"></i>
      No appointments scheduled for today. Click <b>"+ Book Appointment"</b> to schedule.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const p = item.patient;
    const apt = item.appointment;
    const waMsg = buildWhatsAppMessage(p, apt);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waMsg)}`;

    return `
      <tr class="hover:bg-blue-50/40 transition border-b border-gray-100">
        <td class="px-4 py-3 font-semibold text-gray-900">${apt.time || '—'}</td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.phone} · ${p.branch}</span>
        </td>
        <td class="px-4 py-3">
          <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
            ${apt.purpose || 'Check-up'}
          </span>
          ${apt.notes ? `<p class="text-[11px] text-gray-500 mt-0.5 italic truncate max-w-xs">${apt.notes}</p>` : ''}
        </td>
        <td class="px-4 py-3 text-xs text-gray-600">
          ${(p.conditions || []).map(c => `<span class="inline-block bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded mr-1">${c}</span>`).join('') || '—'}
        </td>
        <td class="px-4 py-3">
          <span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block"></span> Scheduled
          </span>
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <a href="${waUrl}" target="_blank" rel="noopener"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1"
            title="Send WhatsApp Reminder">
            <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp
          </a>
          <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Completed')"
            class="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1"
            title="Mark as Completed">
            <i class="fa-solid fa-check"></i> Done
          </button>
          <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Missed')"
            class="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
            title="Mark as Missed">
            <i class="fa-solid fa-xmark"></i> Missed
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderUpcomingQueue(items) {
  const tbody = document.getElementById('patientUpcomingBody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400 text-sm">
      <i class="fa-regular fa-calendar text-2xl mb-2 text-gray-300 block"></i>
      No appointments in the next 7 days.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const p = item.patient;
    const apt = item.appointment;
    const waMsg = buildWhatsAppMessage(p, apt);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waMsg)}`;

    return `
      <tr class="hover:bg-blue-50/40 transition border-b border-gray-100">
        <td class="px-4 py-3 font-semibold text-gray-800">${apt.date} <span class="text-xs text-gray-400">(${apt.time || '—'})</span></td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.phone} · ${p.branch}</span>
        </td>
        <td class="px-4 py-3">
          <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
            ${apt.purpose || 'Check-up'}
          </span>
        </td>
        <td class="px-4 py-3 text-xs text-gray-600">
          ${(p.conditions || []).join(', ') || '—'}
        </td>
        <td class="px-4 py-3">
          <span class="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">Scheduled</span>
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <a href="${waUrl}" target="_blank" rel="noopener"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
            title="Send WhatsApp Reminder">
            <i class="fa-brands fa-whatsapp text-sm"></i> Reminder
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOverdueQueue(items) {
  const tbody = document.getElementById('patientOverdueBody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400 text-sm">
      <i class="fa-regular fa-circle-check text-2xl mb-2 text-emerald-400 block"></i>
      Awesome! No overdue refills or missed appointments across this branch.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const p = item.patient;
    const apt = item.appointment;
    const med = item.medication;
    const waMsg = buildWhatsAppRecallMessage(p, item);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waMsg)}`;

    const dateStr = apt ? apt.date : (med ? med.nextRefillDate : '—');
    const details = apt ? (apt.purpose || 'Missed Appointment') : (med ? `${med.name} (Due: ${med.nextRefillDate})` : 'Overdue');

    return `
      <tr class="hover:bg-rose-50/30 transition border-b border-gray-100">
        <td class="px-4 py-3 font-semibold text-rose-700">${dateStr}</td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.phone} · ${p.branch}</span>
        </td>
        <td class="px-4 py-3">
          <span class="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded">
            ${item.type}
          </span>
          <p class="text-xs text-gray-600 mt-0.5">${details}</p>
        </td>
        <td class="px-4 py-3 text-xs text-gray-600">
          ${(p.conditions || []).join(', ') || '—'}
        </td>
        <td class="px-4 py-3">
          <span class="bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">Requires Follow-up</span>
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <a href="${waUrl}" target="_blank" rel="noopener"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition shadow-sm">
            <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp Recall
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPatientDirectory(patients) {
  const tbody = document.getElementById('patientDirectoryBody');
  if (!tbody) return;

  if (!patients.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400 text-sm">
      No patients matching your search criteria. Click <b>"+ New Patient"</b> to register.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = patients.map(p => {
    const lastSc = (p.screenings && p.screenings.length) ? p.screenings[0] : null;
    let bpDisplay = '—';
    if (lastSc && lastSc.bpSys && lastSc.bpDia) {
      const cls = getBpClassification(lastSc.bpSys, lastSc.bpDia);
      bpDisplay = `<span class="inline-block px-1.5 py-0.5 rounded text-[11px] ${cls.badge}">${lastSc.bpSys}/${lastSc.bpDia} mmHg</span>`;
    }

    // Earliest upcoming refill
    let nextRefill = '—';
    if (p.medications && p.medications.length) {
      const dates = p.medications.map(m => m.nextRefillDate).filter(Boolean).sort();
      if (dates.length) nextRefill = dates[0];
    }

    return `
      <tr class="hover:bg-blue-50/40 transition border-b border-gray-100">
        <td class="px-4 py-3 font-mono text-xs text-gray-500 font-semibold">${p.id}</td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.gender}, ${p.age} yrs · ${p.ic || 'No IC'}</span>
        </td>
        <td class="px-4 py-3 text-xs text-gray-700">${p.phone || '—'}</td>
        <td class="px-4 py-3">
          <span class="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">${p.branch}</span>
        </td>
        <td class="px-4 py-3">
          ${(p.conditions || []).map(c => `<span class="inline-block bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded mr-1">${c}</span>`).join('') || '<span class="text-xs text-gray-400">None</span>'}
        </td>
        <td class="px-4 py-3 text-xs">${bpDisplay}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button onclick="viewPatientProfile('${p.id}')"
            class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1">
            <i class="fa-regular fa-folder-open"></i> Profile
          </button>
          <button onclick="showNewScreeningModal('${p.id}')"
            class="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1"
            title="Record Health Screening">
            <i class="fa-solid fa-heart-pulse"></i> Screening
          </button>
          <button onclick="showNewAppointmentModal('${p.id}')"
            class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
            title="Book Return Appointment">
            <i class="fa-regular fa-calendar-plus"></i> Appt
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── WHATSAPP MESSAGE BUILDER (MULTILINGUAL) ─────────────────────────────────
function formatPhoneForWa(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = '60' + cleaned.slice(1);
  return cleaned;
}

function buildWhatsAppMessage(patient, appointment) {
  const branchName = patient.branch === 'KS01' ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${patient.branch}`;
  const lang = patient.language || 'English';
  const name = patient.name;
  const date = appointment.date;
  const time = appointment.time || 'your scheduled time';
  const purpose = appointment.purpose || 'Chronic Medication Refill & Health Review';

  if (lang === 'Chinese') {
    return `您好 ${name}，这里是 ${branchName}。\n\n温馨提醒您，您预约的【${purpose}】时间为：\n📅 日期：${date}\n⏰ 时间：${time}\n\n请问需要我们提前为您准备好药物吗？如需调整时间，请随时回复我们。祝您身体健康！`;
  } else if (lang === 'Malay') {
    return `Salam ${name}, ini peringatan mesra dari ${branchName}.\n\nTemujanji anda untuk [${purpose}] dijadualkan pada:\n📅 Tarikh: ${date}\n⏰ Masa: ${time}\n\nSila maklumkan sekiranya anda ingin kami sediakan ubat lebih awal, atau jika ingin menjadualkan semula. Terima kasih & semoga sihat selalu!`;
  } else {
    return `Hello ${name}, this is a friendly reminder from ${branchName}.\n\nYour appointment for [${purpose}] is scheduled for:\n📅 Date: ${date}\n⏰ Time: ${time}\n\nWould you like us to prepare your medications in advance? Please let us know if you need to reschedule. Thank you and stay healthy!`;
  }
}

function buildWhatsAppRecallMessage(patient, item) {
  const branchName = patient.branch === 'KS01' ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${patient.branch}`;
  const lang = patient.language || 'English';
  const name = patient.name;

  if (lang === 'Chinese') {
    return `您好 ${name}，这里是 ${branchName}。\n\n我们注意到您的长期慢病药物已经到期需要续药，为确保您的血压与血糖控制平稳，建议您尽快回来复查并补充药物。\n\n您可以在今天或明天方便的时间过来，我们已准备好为您服务！如有任何问题，欢迎随时联系我们。`;
  } else if (lang === 'Malay') {
    return `Salam ${name}, ini peringatan mesra dari ${branchName}.\n\nBekalan ubat kronik anda telah tamat tempoh dan perlu diulang semula untuk memastikan tahap kesihatan anda kekal terkawal.\n\nSila datang ke cawangan kami pada masa lapang anda untuk pemeriksaan & pengambilan ubat. Terima kasih!`;
  } else {
    return `Hello ${name}, this is ${branchName}.\n\nWe noticed that your chronic medication supply is due for refill. Maintaining steady medication compliance is essential for your blood pressure and health control.\n\nPlease drop by our branch at your earliest convenience to review and collect your medication. Thank you!`;
  }
}

// ─── APPOINTMENT STATUS TOGGLE ───────────────────────────────────────────────
function markAppointmentStatus(patientId, appointmentId, newStatus) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p || !p.appointments) return;
  const apt = p.appointments.find(a => a.id === appointmentId);
  if (!apt) return;

  apt.status = newStatus;
  savePatientsData();
  renderPatientModule();

  // If viewing patient profile modal, refresh it
  if (viewingPatientId === patientId) {
    viewPatientProfile(patientId);
  }
}

// ─── MODALS LOGIC ────────────────────────────────────────────────────────────

// 1. New Patient Modal
function showNewPatientModal() {
  const modal = document.getElementById('patientNewModal');
  if (!modal) return;

  // Clear fields
  document.getElementById('newPatientName').value = '';
  document.getElementById('newPatientIc').value = '';
  document.getElementById('newPatientPhone').value = '';
  document.getElementById('newPatientGender').value = 'Male';
  document.getElementById('newPatientAge').value = '';
  document.getElementById('newPatientRace').value = 'Chinese';
  document.getElementById('newPatientLanguage').value = 'Chinese';
  document.getElementById('newPatientAllergies').value = '';
  document.getElementById('newPatientNotes').value = '';

  const branchSel = document.getElementById('newPatientBranch');
  const session = getSession();
  if (branchSel) {
    branchSel.value = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'KS01';
  }

  // Clear condition checkboxes
  document.querySelectorAll('.patient-cond-cb').forEach(cb => cb.checked = false);

  modal.classList.remove('hidden');
}

function closeNewPatientModal() {
  const modal = document.getElementById('patientNewModal');
  if (modal) modal.classList.add('hidden');
}

function saveNewPatient() {
  const name = document.getElementById('newPatientName').value.trim();
  const phone = document.getElementById('newPatientPhone').value.trim();
  if (!name) {
    alert('Please enter patient name.');
    return;
  }

  const conditions = [];
  document.querySelectorAll('.patient-cond-cb:checked').forEach(cb => conditions.push(cb.value));

  const newId = 'PT-' + (1000 + patientsData.length + 1);
  const newPatient = {
    id: newId,
    name,
    ic: document.getElementById('newPatientIc').value.trim(),
    phone,
    gender: document.getElementById('newPatientGender').value,
    age: Number(document.getElementById('newPatientAge').value) || 0,
    race: document.getElementById('newPatientRace').value,
    language: document.getElementById('newPatientLanguage').value,
    branch: document.getElementById('newPatientBranch').value || 'KS01',
    conditions,
    allergies: document.getElementById('newPatientAllergies').value.trim(),
    notes: document.getElementById('newPatientNotes').value.trim(),
    createdAt: getTodayDateString(0),
    screenings: [],
    medications: [],
    appointments: []
  };

  patientsData.unshift(newPatient);
  savePatientsData();
  closeNewPatientModal();
  renderPatientModule();
}

// 2. Health Screening Modal
function showNewScreeningModal(patientId) {
  const modal = document.getElementById('patientScreeningModal');
  if (!modal) return;

  const selectEl = document.getElementById('screeningPatientSelect');
  if (selectEl) {
    selectEl.innerHTML = patientsData.map(p => `
      <option value="${p.id}" ${patientId === p.id ? 'selected' : ''}>${p.name} (${p.branch} · ${p.phone || 'No phone'})</option>
    `).join('');
  }

  document.getElementById('screeningDate').value = getTodayDateString(0);
  document.getElementById('screeningBpSys').value = '';
  document.getElementById('screeningBpDia').value = '';
  document.getElementById('screeningPulse').value = '';
  document.getElementById('screeningGlucose').value = '';
  document.getElementById('screeningGlucoseType').value = 'Fasting';
  document.getElementById('screeningCholesterol').value = '';
  document.getElementById('screeningUricAcid').value = '';
  document.getElementById('screeningWeight').value = '';
  document.getElementById('screeningHeight').value = '';
  document.getElementById('screeningNotes').value = '';

  modal.classList.remove('hidden');
}

function closeScreeningModal() {
  const modal = document.getElementById('patientScreeningModal');
  if (modal) modal.classList.add('hidden');
}

function saveNewScreening() {
  const pId = document.getElementById('screeningPatientSelect').value;
  const p = patientsData.find(pt => pt.id === pId);
  if (!p) return;

  const session = getSession();
  const recorder = session ? `${session.displayName} (${session.role})` : 'Pharmacist';

  const newSc = {
    id: 'SC-' + Date.now(),
    date: document.getElementById('screeningDate').value || getTodayDateString(0),
    bpSys: Number(document.getElementById('screeningBpSys').value) || null,
    bpDia: Number(document.getElementById('screeningBpDia').value) || null,
    pulse: Number(document.getElementById('screeningPulse').value) || null,
    glucose: Number(document.getElementById('screeningGlucose').value) || null,
    glucoseType: document.getElementById('screeningGlucoseType').value,
    cholesterol: Number(document.getElementById('screeningCholesterol').value) || null,
    uricAcid: Number(document.getElementById('screeningUricAcid').value) || null,
    weight: Number(document.getElementById('screeningWeight').value) || null,
    height: Number(document.getElementById('screeningHeight').value) || null,
    recordedBy: recorder,
    notes: document.getElementById('screeningNotes').value.trim()
  };

  if (!p.screenings) p.screenings = [];
  p.screenings.unshift(newSc);

  savePatientsData();
  closeScreeningModal();
  renderPatientModule();

  if (viewingPatientId === pId) {
    viewPatientProfile(pId);
  }
}

// 3. Book Appointment Modal
function showNewAppointmentModal(patientId) {
  const modal = document.getElementById('patientAptModal');
  if (!modal) return;

  const selectEl = document.getElementById('aptPatientSelect');
  if (selectEl) {
    selectEl.innerHTML = patientsData.map(p => `
      <option value="${p.id}" ${patientId === p.id ? 'selected' : ''}>${p.name} (${p.branch} · ${p.phone || 'No phone'})</option>
    `).join('');
  }

  document.getElementById('aptDate').value = getTodayDateString(1);
  document.getElementById('aptTime').value = '10:00';
  document.getElementById('aptPurpose').value = 'Chronic Medication Refill & BP Review';
  document.getElementById('aptNotes').value = '';

  modal.classList.remove('hidden');
}

function closeAppointmentModal() {
  const modal = document.getElementById('patientAptModal');
  if (modal) modal.classList.add('hidden');
}

function saveNewAppointment() {
  const pId = document.getElementById('aptPatientSelect').value;
  const p = patientsData.find(pt => pt.id === pId);
  if (!p) return;

  const newApt = {
    id: 'APT-' + Date.now(),
    date: document.getElementById('aptDate').value,
    time: document.getElementById('aptTime').value,
    purpose: document.getElementById('aptPurpose').value.trim(),
    status: 'Scheduled',
    notes: document.getElementById('aptNotes').value.trim()
  };

  if (!p.appointments) p.appointments = [];
  p.appointments.unshift(newApt);

  savePatientsData();
  closeAppointmentModal();
  renderPatientModule();

  if (viewingPatientId === pId) {
    viewPatientProfile(pId);
  }
}

// 4. Patient Full Profile / History View Modal
function viewPatientProfile(patientId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) return;

  viewingPatientId = patientId;
  const modal = document.getElementById('patientProfileModal');
  if (!modal) return;

  // Header info
  document.getElementById('profName').textContent = p.name;
  document.getElementById('profMeta').textContent = `${p.gender}, ${p.age} yrs · IC: ${p.ic || '—'} · Phone: ${p.phone || '—'} · Branch: ${p.branch} · Preferred: ${p.language}`;
  document.getElementById('profConditions').innerHTML = (p.conditions || []).map(c => `
    <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${c}</span>
  `).join('') || '<span class="text-xs text-gray-400">None recorded</span>';

  document.getElementById('profAllergies').textContent = p.allergies || 'None known';
  document.getElementById('profNotes').textContent = p.notes || 'None';

  // Screenings Table
  const scBody = document.getElementById('profScreeningsBody');
  if (scBody) {
    if (!p.screenings || !p.screenings.length) {
      scBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400 text-xs">No screening records yet.</td></tr>`;
    } else {
      scBody.innerHTML = p.screenings.map(sc => {
        const bpCls = getBpClassification(sc.bpSys, sc.bpDia);
        const glucCls = getGlucoseClassification(sc.glucose, sc.glucoseType);
        const cholCls = getCholesterolClassification(sc.cholesterol);
        const uricCls = getUricAcidClassification(sc.uricAcid, p.gender);
        const bmiCls = getBmiClassification(sc.weight, sc.height);

        return `
          <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
            <td class="px-3 py-2 font-semibold text-gray-800">${sc.date}</td>
            <td class="px-3 py-2">
              <span class="inline-block px-1.5 py-0.5 rounded ${bpCls.badge}">${sc.bpSys || '—'}/${sc.bpDia || '—'}</span>
              <span class="text-[10px] text-gray-400 ml-1">${sc.pulse ? sc.pulse + ' bpm' : ''}</span>
            </td>
            <td class="px-3 py-2">
              <span class="inline-block px-1.5 py-0.5 rounded ${glucCls.badge}">${sc.glucose || '—'}</span>
              <span class="text-[10px] text-gray-400 ml-1">(${sc.glucoseType})</span>
            </td>
            <td class="px-3 py-2">
              <span class="inline-block px-1.5 py-0.5 rounded ${cholCls.badge}">${sc.cholesterol || '—'}</span>
            </td>
            <td class="px-3 py-2">
              <span class="inline-block px-1.5 py-0.5 rounded ${uricCls.badge}">${sc.uricAcid || '—'}</span>
            </td>
            <td class="px-3 py-2">
              <span class="inline-block px-1.5 py-0.5 rounded ${bmiCls.badge}">${bmiCls.bmi}</span>
            </td>
            <td class="px-3 py-2 text-gray-500 italic max-w-xs truncate">${sc.notes || '—'}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Medications Table
  const medBody = document.getElementById('profMedsBody');
  if (medBody) {
    if (!p.medications || !p.medications.length) {
      medBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400 text-xs">No chronic medications listed.</td></tr>`;
    } else {
      medBody.innerHTML = p.medications.map(med => {
        const todayStr = getTodayDateString(0);
        let dueBadge = 'bg-green-100 text-green-800';
        let dueLabel = med.nextRefillDate;
        if (med.nextRefillDate < todayStr) {
          dueBadge = 'bg-red-100 text-red-800 font-bold';
          dueLabel += ' (Overdue)';
        } else if (med.nextRefillDate <= getTodayDateString(7)) {
          dueBadge = 'bg-amber-100 text-amber-800 font-semibold';
          dueLabel += ' (Due Soon)';
        }

        return `
          <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
            <td class="px-3 py-2 font-bold text-gray-900">${med.name}</td>
            <td class="px-3 py-2 text-gray-600">${med.dosage}</td>
            <td class="px-3 py-2 text-gray-500">${med.lastDispensed || '—'}</td>
            <td class="px-3 py-2 text-gray-500">${med.supplyDays} days</td>
            <td class="px-3 py-2">
              <span class="inline-block px-2 py-0.5 rounded text-[11px] ${dueBadge}">${dueLabel}</span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Appointments Table
  const aptBody = document.getElementById('profAptsBody');
  if (aptBody) {
    if (!p.appointments || !p.appointments.length) {
      aptBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400 text-xs">No appointment history.</td></tr>`;
    } else {
      aptBody.innerHTML = p.appointments.map(apt => {
        let stBadge = 'bg-blue-100 text-blue-800';
        if (apt.status === 'Completed') stBadge = 'bg-green-100 text-green-800';
        if (apt.status === 'Missed') stBadge = 'bg-red-100 text-red-800';

        return `
          <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
            <td class="px-3 py-2 font-semibold text-gray-800">${apt.date} ${apt.time || ''}</td>
            <td class="px-3 py-2 font-medium text-gray-900">${apt.purpose}</td>
            <td class="px-3 py-2">
              <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${stBadge}">${apt.status}</span>
            </td>
            <td class="px-3 py-2 text-gray-500 italic">${apt.notes || '—'}</td>
            <td class="px-3 py-2 text-right">
              ${apt.status === 'Scheduled' ? `
                <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Completed')"
                  class="text-green-700 hover:underline font-bold mr-2 text-[11px]">Mark Done</button>
                <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Missed')"
                  class="text-rose-700 hover:underline font-bold text-[11px]">Missed</button>
              ` : '—'}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  modal.classList.remove('hidden');
}

function closePatientProfileModal() {
  const modal = document.getElementById('patientProfileModal');
  if (modal) modal.classList.add('hidden');
  viewingPatientId = null;
}

// 5. Add Medication to Patient (from Profile modal)
function promptAddMedication() {
  if (!viewingPatientId) return;
  const p = patientsData.find(pt => pt.id === viewingPatientId);
  if (!p) return;

  const medName = prompt('Enter Medication Name & Strength (e.g. Amlodipine 10mg):');
  if (!medName) return;

  const dosage = prompt('Enter Dosage Instructions (e.g. 1 tab OD morning):', '1 tab OD');
  const supplyDays = Number(prompt('Enter Supply Duration in Days (e.g. 30):', '30')) || 30;

  const lastDispensed = getTodayDateString(0);
  const nextRefillDate = getTodayDateString(supplyDays);

  if (!p.medications) p.medications = [];
  p.medications.push({
    id: 'MED-' + Date.now(),
    name: medName.trim(),
    dosage: dosage ? dosage.trim() : '1 tab OD',
    lastDispensed,
    supplyDays,
    nextRefillDate
  });

  savePatientsData();
  viewPatientProfile(viewingPatientId);
  renderPatientModule();
}

// ─── EXPORT TO EXCEL ─────────────────────────────────────────────────────────
async function exportPatientDataToExcel() {
  if (typeof ExcelJS === 'undefined') {
    alert('ExcelJS library not ready. Please check internet connection.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PMG Management Hub';
  workbook.created = new Date();

  // Sheet 1: Appointments Queue
  const wsApt = workbook.addWorksheet('Appointments_Queue', { views: [{ showGridLines: true }] });
  wsApt.columns = [
    { header: 'Appt Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Patient Name', key: 'name', width: 22 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Branch', key: 'branch', width: 12 },
    { header: 'Purpose', key: 'purpose', width: 28 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];

  // Sheet 2: Patient Registry
  const wsPat = workbook.addWorksheet('Patient_Registry', { views: [{ showGridLines: true }] });
  wsPat.columns = [
    { header: 'Patient ID', key: 'id', width: 12 },
    { header: 'Full Name', key: 'name', width: 22 },
    { header: 'IC Number', key: 'ic', width: 18 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Branch', key: 'branch', width: 12 },
    { header: 'Language', key: 'language', width: 12 },
    { header: 'Chronic Conditions', key: 'conditions', width: 30 },
    { header: 'Allergies', key: 'allergies', width: 20 },
    { header: 'Next Refill Due', key: 'refill', width: 16 }
  ];

  // Header styles
  [wsApt, wsPat].forEach(ws => {
    const row1 = ws.getRow(1);
    row1.height = 26;
    row1.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  // Populate Appointments
  patientsData.forEach(p => {
    (p.appointments || []).forEach(apt => {
      wsApt.addRow({
        date: apt.date,
        time: apt.time || '',
        name: p.name,
        phone: p.phone,
        branch: p.branch,
        purpose: apt.purpose,
        status: apt.status,
        notes: apt.notes || ''
      });
    });

    // Earliest refill
    let nextRefill = '—';
    if (p.medications && p.medications.length) {
      const dates = p.medications.map(m => m.nextRefillDate).filter(Boolean).sort();
      if (dates.length) nextRefill = dates[0];
    }

    wsPat.addRow({
      id: p.id,
      name: p.name,
      ic: p.ic || '',
      phone: p.phone,
      gender: p.gender,
      age: p.age,
      branch: p.branch,
      language: p.language,
      conditions: (p.conditions || []).join(', '),
      allergies: p.allergies || 'None',
      refill: nextRefill
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `PMG_Patient_Appointments_${getTodayDateString(0)}.xlsx`;

  if (typeof saveAs !== 'undefined') {
    saveAs(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
