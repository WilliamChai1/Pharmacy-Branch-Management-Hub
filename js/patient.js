// js/patient.js — Patient Care, POCT Suites, SOAP Assessment & Chronic Appointment Engine
'use strict';

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
    conditions: ['Hypertension', 'Type 2 Diabetes', 'Dyslipidemia'],
    allergies: 'Penicillin',
    notes: 'Prefers morning appointments before 11:00 AM.',
    createdAt: getTodayDateString(-60),
    encounters: [
      {
        id: 'ENC-101',
        date: getTodayDateString(-30),
        recordedBy: 'William Chai (Pharmacist)',
        chiefComplaint: 'Routine Chronic Refill & BP Review',
        hpi: 'Patient reports occasional morning dizziness. Compliant with Amlodipine and Metformin. No chest pain or shortness of breath.',
        vitals: {
          bpSys: 136,
          bpDia: 86,
          pulse: 74,
          spo2: 98,
          weight: 72,
          height: 168,
          bmi: 25.5
        },
        lipidPanel: {
          tc: 5.4,
          tg: 1.8,
          hdl: 1.1,
          ldl: 3.5,
          ai: 3.91,
          rChd: 4.91
        },
        liverPanel: {
          ast: 28,
          alt: 32,
          alb: 42
        },
        kidneyPanel: {
          ua: 380,
          creatinine: 88,
          urea: 5.4,
          egfr: 78
        },
        glycemicHeme: {
          glucose: 6.8,
          glucoseType: 'Fasting',
          hba1c: 6.9,
          hb: 14.2,
          hct: 42.5
        },
        specialtyScans: {
          vitD: 24,
          ferritin: 110,
          teda: 'Mild metabolic stress',
          airdoc: 'Grade 1 Hypertensive Retinopathy signs',
          rossmaxAct: 'Vascular Age: 65 yrs (ACT 4)'
        },
        customTests: [
          { name: 'Urine Microalbumin', result: 'Negative', unit: 'dipstick', notes: 'Routine check' }
        ],
        preDiagnostic: 'Suboptimally controlled Stage 1 Hypertension with pre-diabetic glycemic profile and borderline dyslipidemia.',
        planMedications: 'Continue Amlodipine 10mg OD (morning), Metformin 500mg BD (with food).',
        planSupplements: 'Recommended CoQ10 100mg OD (cardiovascular support) and B-Complex (for long-term Metformin user).',
        planCounselling: 'Advised DASH diet (low sodium), brisk walking 30 mins 4x/week, home BP log.',
        referral: 'Review in 1 month. Refer GP if BP persistently > 140/90 mmHg.',
        attachedDocs: []
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
        date: getTodayDateString(1),
        time: '10:30',
        purpose: 'Chronic Refill & BP Review',
        status: 'Scheduled',
        notes: 'Prepare Amlodipine 10mg & Metformin 500mg 1 month pack.'
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
    notes: 'Monitored for lipid profile and liver enzymes.',
    createdAt: getTodayDateString(-90),
    encounters: [
      {
        id: 'ENC-102',
        date: getTodayDateString(-35),
        recordedBy: 'William Chai (Pharmacist)',
        chiefComplaint: 'Lipid & Liver Enzymes Review',
        hpi: 'Patient taking Atorvastatin 20mg daily. Complains of mild bilateral calf tiredness after evening prayers.',
        vitals: {
          bpSys: 142,
          bpDia: 90,
          pulse: 70,
          spo2: 99,
          weight: 65,
          height: 155,
          bmi: 27.1
        },
        lipidPanel: {
          tc: 6.2,
          tg: 2.1,
          hdl: 1.2,
          ldl: 4.1,
          ai: 4.17,
          rChd: 5.17
        },
        liverPanel: {
          ast: 34,
          alt: 38,
          alb: 40
        },
        kidneyPanel: {
          ua: 310,
          creatinine: 74,
          urea: 4.8,
          egfr: 84
        },
        glycemicHeme: {
          glucose: 5.9,
          glucoseType: 'Random',
          hba1c: null,
          hb: 13.0,
          hct: 39.0
        },
        specialtyScans: {
          vitD: null,
          ferritin: null,
          teda: null,
          airdoc: null,
          rossmaxAct: 'ACT 3 (Normal vascular compliance)'
        },
        customTests: [],
        preDiagnostic: 'Hypercholesterolemia with Stage 2 Hypertension. Mild statin-associated muscle symptoms suspected.',
        planMedications: 'Atorvastatin 20mg ON, Perindopril 4mg OD.',
        planSupplements: 'High-potency CoQ10 150mg OD for statin-induced myalgia + Omega-3 Fish Oil 1200mg BD.',
        planCounselling: 'Advised strict reduction of saturated fats, santan, and fried food. Hydration > 2L daily.',
        referral: 'Follow up lipid profile in 1 month.',
        attachedDocs: []
      }
    ],
    medications: [
      {
        id: 'MED-103',
        name: 'Atorvastatin 20mg',
        dosage: '1 tab ON (Night)',
        lastDispensed: getTodayDateString(-35),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(-5) // Overdue!
      },
      {
        id: 'MED-104',
        name: 'Perindopril 4mg',
        dosage: '1 tab OD (Morning)',
        lastDispensed: getTodayDateString(-35),
        supplyDays: 30,
        nextRefillDate: getTodayDateString(-5) // Overdue!
      }
    ],
    appointments: [
      {
        id: 'APT-102',
        date: getTodayDateString(-5),
        time: '14:30',
        purpose: 'Lipid Review & Refill',
        status: 'Missed',
        notes: 'Missed appointment on Friday. Requires WhatsApp recall.'
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
    notes: 'Recurrent gout flare-ups on 1st MTP joint.',
    createdAt: getTodayDateString(-45),
    encounters: [
      {
        id: 'ENC-103',
        date: getTodayDateString(-15),
        recordedBy: 'Kenix Ling (Pharmacist)',
        chiefComplaint: 'Right big toe swelling and severe throbbing pain',
        hpi: 'Pain began 2 nights ago after seafood dinner. Score 8/10. Unable to wear tight shoes.',
        vitals: {
          bpSys: 122,
          bpDia: 78,
          pulse: 72,
          spo2: 99,
          weight: 84,
          height: 172,
          bmi: 28.4
        },
        lipidPanel: { tc: 4.8, tg: 1.5, hdl: 1.3, ldl: 2.8, ai: 2.69, rChd: 3.69 },
        liverPanel: { ast: 24, alt: 26, alb: 44 },
        kidneyPanel: { ua: 495, creatinine: 92, urea: 5.1, egfr: 88 },
        glycemicHeme: { glucose: 5.4, glucoseType: 'Fasting', hba1c: null, hb: 15.0, hct: 45.0 },
        specialtyScans: {},
        customTests: [],
        preDiagnostic: 'Acute Gouty Arthritis flare with underlying chronic Hyperuricemia (UA 495 umol/L).',
        planMedications: 'Colchicine 500mcg for acute flare, continue Allopurinol 100mg after acute phase settles.',
        planSupplements: 'Tart Cherry extract + Celery seed extract 1 cap BD + Vitamin C 1000mg.',
        planCounselling: 'Strict low-purine diet (avoid beer, shellfish, organ meats). Drink 3L water daily.',
        referral: 'Return for Uric Acid POCT in 2 weeks.',
        attachedDocs: []
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
        date: getTodayDateString(0),
        time: '15:00',
        purpose: 'Uric Acid POCT & Joint Review',
        status: 'Scheduled',
        notes: 'Check UA level and assess joint recovery.'
      }
    ]
  }
];

let patientsData = [];
let activePatientSubTab = 'today';
let viewingPatientId = null;
let activeProfileTab = 'encounters'; // 'encounters', 'trends', 'meds', 'docs', 'apts'
let tempCustomTests = []; // For the encounter modal
let tempAttachedFiles = []; // For the encounter modal
let selectedAirdocFile = null; // For the Airdoc PDF report

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
function initPatientModule() {
  loadPatientsData();
  setupPatientEventListeners();
  updateBackupStatusBadge();
  updateDailyBackupBanner();
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
  ['today', 'upcoming', 'overdue', 'all'].forEach(tab => {
    const btn = document.getElementById(`patientSubTabBtn_${tab}`);
    if (btn) btn.addEventListener('click', () => switchPatientSubTab(tab));
  });

  const branchFilter = document.getElementById('patientBranchFilter');
  if (branchFilter) branchFilter.addEventListener('change', () => renderPatientModule());

  const searchInput = document.getElementById('patientSearchInput');
  if (searchInput) searchInput.addEventListener('input', () => renderPatientModule());

  const newPatientBtn = document.getElementById('patientNewBtn');
  if (newPatientBtn) newPatientBtn.addEventListener('click', () => showNewPatientModal());

  const newEncounterBtn = document.getElementById('patientNewScreeningBtn');
  if (newEncounterBtn) newEncounterBtn.addEventListener('click', () => showNewEncounterModal());

  const newAptBtn = document.getElementById('patientNewAptBtn');
  if (newAptBtn) newAptBtn.addEventListener('click', () => showNewAppointmentModal());

  const exportBtn = document.getElementById('patientExportExcelBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportPatientDataToExcel);

  // Auto-calculation listeners inside Encounter Modal
  setupEncounterAutoCalculations();
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

// ─── AUTO-CALCULATIONS IN ENCOUNTER MODAL ─────────────────────────────────────
function setupEncounterAutoCalculations() {
  // BMI Calculation: Weight (kg) / (Height (m) ^ 2)
  const wtEl = document.getElementById('encWeight');
  const htEl = document.getElementById('encHeight');
  const bmiEl = document.getElementById('encBmi');
  const calcBmi = () => {
    const w = parseFloat(wtEl.value);
    const h = parseFloat(htEl.value);
    if (w > 0 && h > 0) {
      const m = h / 100;
      const bmi = (w / (m * m)).toFixed(1);
      if (bmiEl) bmiEl.value = bmi;
    }
  };
  if (wtEl) wtEl.addEventListener('input', calcBmi);
  if (htEl) htEl.addEventListener('input', calcBmi);

  // Lipid Ratios:
  // Arteriosclerosis Index (AI) = (TC - HDL) / HDL
  // Coronary Heart Disease Risk (R-CHD) = TC / HDL
  const tcEl = document.getElementById('encTc');
  const hdlEl = document.getElementById('encHdl');
  const aiEl = document.getElementById('encAi');
  const rChdEl = document.getElementById('encRchd');
  const calcLipid = () => {
    const tc = parseFloat(tcEl.value);
    const hdl = parseFloat(hdlEl.value);
    if (tc > 0 && hdl > 0) {
      const ai = ((tc - hdl) / hdl).toFixed(2);
      const rchd = (tc / hdl).toFixed(2);
      if (aiEl) aiEl.value = ai;
      if (rChdEl) rChdEl.value = rchd;
    }
  };
  if (tcEl) tcEl.addEventListener('input', calcLipid);
  if (hdlEl) hdlEl.addEventListener('input', calcLipid);

  // eGFR simplified calculation (CKD-EPI approximation for pharmacy screening)
  const creatEl = document.getElementById('encCreatinine');
  const egfrEl = document.getElementById('encEgfr');
  const calcEgfr = () => {
    const creat = parseFloat(creatEl.value);
    if (creat > 0) {
      // Simplified adult Cockcroft-Gault / CKD-EPI estimate:
      // ~ (140 - age) * weight / (72 * (creat/88.4)) [* 0.85 if female]
      const pSel = document.getElementById('encounterPatientSelect');
      const pId = pSel ? pSel.value : null;
      const p = patientsData.find(pt => pt.id === pId);
      const age = p ? (p.age || 50) : 50;
      const isFemale = p && p.gender === 'Female';
      const wt = parseFloat(wtEl.value) || (isFemale ? 55 : 70);

      const crMgDl = creat / 88.4;
      let crcl = ((140 - age) * wt) / (72 * crMgDl);
      if (isFemale) crcl *= 0.85;
      if (egfrEl) egfrEl.value = Math.min(120, Math.round(crcl));
    }
  };
  if (creatEl) creatEl.addEventListener('input', calcEgfr);
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

function getHba1cClassification(val) {
  val = Number(val) || 0;
  if (!val) return { label: '—', badge: 'bg-gray-100 text-gray-600' };
  if (val >= 6.5) return { label: 'Diabetic Range', badge: 'bg-red-100 text-red-700 font-semibold' };
  if (val >= 5.7) return { label: 'Pre-diabetes', badge: 'bg-amber-100 text-amber-700 font-semibold' };
  return { label: 'Normal (<5.7%)', badge: 'bg-green-100 text-green-700 font-semibold' };
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
    if (!isAM && session && session.branch && session.branch !== 'ALL') {
      branchFilterEl.value = session.branch;
      branchFilterEl.disabled = true;
    }
  }

  const selectedBranch = branchFilterEl ? branchFilterEl.value : '';

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

  const todayStr = getTodayDateString(0);
  const next7DaysStr = getTodayDateString(7);

  let todayAptCount = 0;
  let dueIn7DaysCount = 0;
  let overdueCount = 0;
  const totalPatientsCount = filteredPatients.length;

  const pharmFilterEl = document.getElementById('patientPharmacistFilter');
  const selectedPharm = pharmFilterEl ? pharmFilterEl.value.trim().toLowerCase() : '';

  const todayList = [];
  const upcomingList = [];
  const overdueList = [];

  filteredPatients.forEach(p => {
    (p.appointments || []).forEach(apt => {
      // Filter by selected pharmacist if specified
      if (selectedPharm && !(apt.pharmacist || '').toLowerCase().includes(selectedPharm)) {
        return;
      }
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

    (p.medications || []).forEach(med => {
      if (med.nextRefillDate) {
        if (med.nextRefillDate < todayStr) {
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

  const kpiTodayEl = document.getElementById('kpiPatientToday');
  const kpiDueEl = document.getElementById('kpiPatientDue7');
  const kpiOverdueEl = document.getElementById('kpiPatientOverdue');
  const kpiTotalEl = document.getElementById('kpiPatientTotal');

  if (kpiTodayEl) kpiTodayEl.textContent = todayAptCount;
  if (kpiDueEl) kpiDueEl.textContent = dueIn7DaysCount;
  if (kpiOverdueEl) kpiOverdueEl.textContent = overdueCount;
  if (kpiTotalEl) kpiTotalEl.textContent = totalPatientsCount;

  renderTodayQueue(todayList);
  renderUpcomingQueue(upcomingList);
  renderOverdueQueue(overdueList);
  renderPatientDirectory(filteredPatients);
  updateBackupStatusBadge();
  updateDailyBackupBanner();
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
    const pharmBadge = apt.pharmacist
      ? `<span class="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded ml-1.5"><i class="fa-solid fa-user-doctor text-[9px]"></i> ${escHtml(apt.pharmacist)}</span>`
      : `<span class="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded ml-1.5"><i class="fa-solid fa-user-doctor text-[9px]"></i> Duty Pharmacist</span>`;

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
          ${pharmBadge}
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
    const pharmBadge = apt.pharmacist
      ? `<span class="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded ml-1.5"><i class="fa-solid fa-user-doctor text-[9px]"></i> ${escHtml(apt.pharmacist)}</span>`
      : `<span class="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded ml-1.5"><i class="fa-solid fa-user-doctor text-[9px]"></i> Duty Pharmacist</span>`;

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
          ${pharmBadge}
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
    const lastEnc = (p.encounters && p.encounters.length) ? p.encounters[0] : null;
    let bpDisplay = '—';
    if (lastEnc && lastEnc.vitals && lastEnc.vitals.bpSys && lastEnc.vitals.bpDia) {
      const cls = getBpClassification(lastEnc.vitals.bpSys, lastEnc.vitals.bpDia);
      bpDisplay = `<span class="inline-block px-1.5 py-0.5 rounded text-[11px] ${cls.badge}">${lastEnc.vitals.bpSys}/${lastEnc.vitals.bpDia} mmHg</span>`;
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
          <button onclick="showNewEncounterModal('${p.id}')"
            class="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1"
            title="Start Pharmacist Consultation & POCT">
            <i class="fa-solid fa-notes-medical"></i> Consult & POCT
          </button>
          <button onclick="sendPatientBookingWhatsApp('${p.id}')"
            class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
            title="Send WhatsApp Customer Self-Booking Link (Auto Language by Race & Supply Countdown)">
            <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i> Appt
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── WHATSAPP MESSAGE BUILDERS ───────────────────────────────────────────────
function formatPhoneForWa(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = '60' + cleaned.slice(1);
  return cleaned;
}

/**
 * Automatically detects the preferred communication language based on patient race,
 * explicit language setting, or Sarawak/Malaysian naming conventions.
 */
function getPatientLanguageByRace(patient) {
  if (!patient) return 'English';

  const race = (patient.race || '').trim().toLowerCase();
  const lang = (patient.language || '').trim().toLowerCase();

  // Explicit race priority
  if (race.includes('chinese') || race.includes('cina') || race.includes('hua') || lang.includes('chinese') || lang.includes('mandarin')) {
    return 'Chinese';
  }
  if (race.includes('malay') || race.includes('melayu') || lang.includes('malay')) {
    return 'Malay';
  }
  if (race.includes('iban') || race.includes('bidayuh') || race.includes('dayak')) {
    return lang === 'english' ? 'English' : 'Malay';
  }
  if (race.includes('indian') || race.includes('india')) {
    return 'English';
  }

  // Name heuristic fallback (common in Sarawak and Malaysia)
  const name = (patient.name || '').toLowerCase();
  if (/\b(bin|binti|bt|mohd|muhammad|nur|siti|ahmad|abdul|nor|dayang|awang|anak)\b/.test(name)) {
    return 'Malay';
  }
  const chineseSurnames = [
    'tan', 'lim', 'lee', 'wong', 'ng', 'ong', 'teo', 'ting', 'chai', 'lau',
    'hii', 'ling', 'tiong', 'sim', 'jong', 'chin', 'kong', 'yong', 'phang',
    'sia', 'law', 'ho', 'goh', 'yap', 'chan', 'chong', 'chew', 'chua', 'kueh',
    'tay', 'pang', 'song', 'loo', 'low', 'koh', 'khoo', 'ang', 'heng', 'yeo',
    'choo', 'seah', 'ko', 'chen', 'zhang', 'huang', 'lin', 'wu'
  ];
  const nameTokens = name.split(/[\s,.-]+/);
  if (nameTokens.some(tok => chineseSurnames.includes(tok))) {
    return 'Chinese';
  }

  if (lang === 'chinese') return 'Chinese';
  if (lang === 'malay') return 'Malay';
  return 'English';
}

/**
 * Calculates medication supply countdown and generates natural phrasing
 * informing the patient that their supply is running out / due for refill.
 */
function getPatientSupplySummary(patient, lang) {
  const meds = Array.isArray(patient.medications) ? patient.medications.filter(m => m && m.name) : [];

  if (meds.length > 0) {
    let minDaysLeft = 999;
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    meds.forEach(m => {
      let days = null;
      if (m.nextRefillDate) {
        const refillTime = new Date(m.nextRefillDate).getTime();
        days = Math.round((refillTime - todayZero) / 86400000);
      } else if (m.lastDispensed && m.supplyDays) {
        const dispTime = new Date(m.lastDispensed).getTime();
        const dueTime = dispTime + (parseInt(m.supplyDays, 10) || 30) * 86400000;
        days = Math.round((dueTime - todayZero) / 86400000);
      }
      if (days !== null && days < minDaysLeft) {
        minDaysLeft = days;
      }
    });

    const medNamesZh = meds.slice(0, 3).map(m => m.name).join('、') + (meds.length > 3 ? ' 等' : '');
    const medNamesMy = meds.slice(0, 3).map(m => m.name).join(', ') + (meds.length > 3 ? ' dll.' : '');
    const medNamesEn = meds.slice(0, 3).map(m => m.name).join(', ') + (meds.length > 3 ? ' etc.' : '');

    if (minDaysLeft <= 0) {
      if (lang === 'Chinese') {
        return `根据我们的配药系统记录，您的常规药物【${medNamesZh}】药量预计已经用完或已到期续药。为保持血压与血糖指标平稳，切勿中断用药。`;
      } else if (lang === 'Malay') {
        return `Berdasarkan rekod sistem pengeluaran ubat kami, baki bekalan ubat rutin anda [${medNamesMy}] dijangka telah habis atau sudah tiba tarikh ulangan (refill). Jangan biarkan rawatan anda terputus demi memastikan kesihatan sentiasa terkawal.`;
      } else {
        return `Based on our dispensing records, your regular medication supply [${medNamesEn}] is now due for refill or running out. Maintaining consistent medication adherence is vital for your health control.`;
      }
    } else if (minDaysLeft <= 7) {
      if (lang === 'Chinese') {
        return `根据我们的配药系统记录，您的常规药物【${medNamesZh}】预计大约在 ${minDaysLeft} 天内即将用完。建议您提前安排预约，以确保按时补足药量。`;
      } else if (lang === 'Malay') {
        return `Berdasarkan semakan sistem kami, bekalan ubat rutin anda [${medNamesMy}] dijangka akan habis dalam masa lebih kurang ${minDaysLeft} hari lagi. Anda disarankan membuat tempahan awal sebelum ubat habis.`;
      } else {
        return `According to our records, your regular medication supply [${medNamesEn}] is estimated to finish in about ${minDaysLeft} day(s). We recommend booking your refill appointment in advance.`;
      }
    } else {
      if (lang === 'Chinese') {
        return `根据我们的配药系统记录，您的常规用药【${medNamesZh}】即将需要续药。我们随时为您做好药物准备与健康指标复查。`;
      } else if (lang === 'Malay') {
        return `Berdasarkan rekod kami, bekalan ubat rutin anda [${medNamesMy}] akan tiba masa untuk ulangan bekalan seterusnya bersama sesi semakan kesihatan.`;
      } else {
        return `Based on our records, your regular medication supply [${medNamesEn}] will soon be due for its next scheduled refill and review.`;
      }
    }
  }

  // Fallback: check recent encounters if any
  const encs = Array.isArray(patient.encounters) && patient.encounters.length > 0 ? patient.encounters[0] : null;
  if (encs && (encs.planMedications || encs.planSupplements)) {
    if (lang === 'Chinese') {
      return `根据您上次来访的健康随访记录，您的日常慢病药物与保健品预计快要用完了。建议您及时回来复查并补充所需用药。`;
    } else if (lang === 'Malay') {
      return `Berdasarkan rekod konsultasi anda sebelum ini, bekalan ubat dan suplemen kesihatan harian anda dijangka akan habis tidak lama lagi. Anda digalakkan datang untuk semakan semula.`;
    } else {
      return `Based on your recent consultation records, your regular medication and health supplement supply should be finishing soon.`;
    }
  }

  // General fallback
  if (lang === 'Chinese') {
    return `温馨提醒您，根据您的用药周期计算，您的日常药物与健康补充品应该快用完了。建议您提前预约药剂师进行健康指标复查与用药咨询。`;
  } else if (lang === 'Malay') {
    return `Peringatan mesra, berdasarkan kitaran rawatan anda, bekalan ubat dan suplemen harian anda mungkin akan habis tidak lama lagi. Anda dialu-alukan membuat temujanji untuk semakan kesihatan.`;
  } else {
    return `Friendly reminder that based on your supply cycle, your daily medication and wellness supplements should be finishing soon.`;
  }
}

/**
 * Builds the personalized customer self-service booking portal URL with pre-filled query params.
 */
function getPatientSelfBookingUrl(patient) {
  const baseUrl = window.location.origin + window.location.pathname;
  const branch = patient.branch || 'KS01';
  const name = patient.name || '';
  const phone = patient.phone || '';
  const ic = patient.ic || '';
  const service = 'Chronic Medication Review & Refill';

  const params = new URLSearchParams();
  params.set('book', '1');
  params.set('branch', branch);
  if (name) params.set('name', name);
  if (phone) params.set('phone', phone);
  if (ic) params.set('ic', ic);
  params.set('service', service);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Constructs the complete multilingual WhatsApp booking message.
 */
function buildPatientSupplyBookingMessage(patient) {
  const branchCode = patient.branch || 'KS01';
  const branchInfo = BRANCH_SCHEDULES[branchCode] || BRANCH_SCHEDULES['KS01'];
  const sched = typeof getPharmacistSchedule === 'function' ? getPharmacistSchedule(branchCode) : null;
  const branchName = sched ? (sched.branchName || branchInfo.name) : (branchInfo ? branchInfo.name : `PMG Pharmacy ${branchCode}`);
  const monTemplate = sched && sched.weeklyTemplate ? (sched.weeklyTemplate['1'] || sched.weeklyTemplate['0']) : null;
  const openTime = (monTemplate && monTemplate.open) || (branchInfo ? branchInfo.open : '07:30');
  const closeTime = (monTemplate && monTemplate.close) || (branchInfo ? branchInfo.close : '21:30');
  const pharmacistName = sched ? (sched.defaultPharmacist || branchInfo.pharmacist) : (branchInfo ? branchInfo.pharmacist : 'Ahli Farmasi PMG');

  const lang = getPatientLanguageByRace(patient);
  const supplyText = getPatientSupplySummary(patient, lang);
  const bookingUrl = getPatientSelfBookingUrl(patient);
  const patientName = patient.name || 'Pelanggan';

  if (lang === 'Chinese') {
    return `您好 ${patientName}，这里是 PMG Pharmacy（${branchName}）药剂团队。🌸\n\n${supplyText}\n\n为方便您妥善安排时间，我们特别为您开通了【顾客线上自主预约系统】。您可以直接点击下方专属链接，自主挑选最适合您的复查与取药时间：\n\n👉 点击预约专属链接：\n${bookingUrl}\n\n⏰ 药剂师驻店时间：${openTime} – ${closeTime}（星期一至星期日）\n👨‍⚕️ 驻店药剂师：${pharmacistName}\n\n如果您有任何药物疑问，或需要我们提前备妥药物，欢迎直接回复此信息。祝您身体健康，平安顺心！`;
  } else if (lang === 'Malay') {
    return `Salam sejahtera ${patientName}, ini adalah pesanan daripada pasukan farmasi PMG Pharmacy (${branchName}). 🌸\n\n${supplyText}\n\nBagi memudahkan urusan anda tanpa perlu menunggu lama, kami menyediakan 【Sistem Tempahan Temujanji Kendiri Dalam Talian】. Anda boleh memilih sendiri tarikh dan masa yang paling sesuai untuk sesi semakan kesihatan dan ulangan ubat (refill):\n\n👉 Tekan pautan peribadi untuk pilih masa temujanji:\n${bookingUrl}\n\n⏰ Waktu Bertugas Ahli Farmasi: ${openTime} – ${closeTime} (Setiap Hari)\n👨‍⚕️ Ahli Farmasi Bertugas: ${pharmacistName}\n\nJika anda ada sebarang pertanyaan atau ingin kami sediakan ubat terlebih dahulu, sila balas mesej ini. Terima kasih dan semoga sentiasa sihat!`;
  } else {
    return `Hello ${patientName}, this is the pharmacy team from PMG Pharmacy (${branchName}). 🌸\n\n${supplyText}\n\nTo help you plan ahead without waiting, we have provided an 【Online Self-Booking Portal】. You can easily select your preferred date and time for your routine health review, pharmacist consultation, and medication refill:\n\n👉 Tap your personalized link to book your slot:\n${bookingUrl}\n\n⏰ Pharmacist Consultation Hours: ${openTime} – ${closeTime} (Daily)\n👨‍⚕️ Duty Pharmacist: ${pharmacistName}\n\nIf you have any questions or need your medications packed in advance, simply reply to this message. Stay healthy!`;
  }
}

/**
 * Directly triggers WhatsApp to send the customer self-booking link with supply reminder.
 */
function sendPatientBookingWhatsApp(patientId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) {
    alert('Patient record not found.');
    return;
  }

  let phone = p.phone;
  if (!phone || phone.trim() === '') {
    phone = prompt(`Please enter WhatsApp mobile number for ${p.name}:`, '01');
    if (!phone || phone.trim() === '') return;
    p.phone = phone.trim();
    savePatientsData();
  }

  const cleanPhone = formatPhoneForWa(phone);
  if (!cleanPhone) {
    alert('Please enter a valid mobile number with country/area code.');
    return;
  }

  const msg = buildPatientSupplyBookingMessage(p);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
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

  if (viewingPatientId === patientId) {
    viewPatientProfile(patientId);
  }
}

// ─── NEW PATIENT MODAL ───────────────────────────────────────────────────────
function showNewPatientModal() {
  const modal = document.getElementById('patientNewModal');
  if (!modal) return;

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
    encounters: [],
    medications: [],
    appointments: []
  };

  patientsData.unshift(newPatient);
  savePatientsData();
  closeNewPatientModal();
  renderPatientModule();
}

// ─── CLINICAL ENCOUNTER (SOAP + POCT) MODAL ──────────────────────────────────
function showNewEncounterModal(patientId) {
  const modal = document.getElementById('patientEncounterModal');
  if (!modal) return;

  const selectEl = document.getElementById('encounterPatientSelect');
  if (selectEl) {
    selectEl.innerHTML = patientsData.map(p => `
      <option value="${p.id}" ${patientId === p.id ? 'selected' : ''}>${p.name} (${p.branch} · ${p.phone || 'No phone'})</option>
    `).join('');
  }

  // Reset form fields
  document.getElementById('encDate').value = getTodayDateString(0);
  document.getElementById('encChiefComplaint').value = '';
  document.getElementById('encHpi').value = '';

  // Vitals
  document.getElementById('encBpSys').value = '';
  document.getElementById('encBpDia').value = '';
  document.getElementById('encPulse').value = '';
  document.getElementById('encSpo2').value = '';
  document.getElementById('encWeight').value = '';
  document.getElementById('encHeight').value = '';
  document.getElementById('encBmi').value = '';

  // Lipid
  document.getElementById('encTc').value = '';
  document.getElementById('encTg').value = '';
  document.getElementById('encHdl').value = '';
  document.getElementById('encLdl').value = '';
  document.getElementById('encAi').value = '';
  document.getElementById('encRchd').value = '';

  // Liver
  document.getElementById('encAst').value = '';
  document.getElementById('encAlt').value = '';
  document.getElementById('encAlb').value = '';

  // Kidney
  document.getElementById('encUa').value = '';
  document.getElementById('encCreatinine').value = '';
  document.getElementById('encUrea').value = '';
  document.getElementById('encEgfr').value = '';

  // Glycemic / Heme
  document.getElementById('encGlucose').value = '';
  document.getElementById('encGlucoseType').value = 'Fasting';
  document.getElementById('encHba1c').value = '';
  document.getElementById('encHb').value = '';
  document.getElementById('encHct').value = '';

  // Specialty Scans
  document.getElementById('encVitD').value = '';
  document.getElementById('encFerritin').value = '';
  document.getElementById('encTeda').value = '';
  const tedaBtn = document.getElementById('openTedaLinkBtn');
  if (tedaBtn) tedaBtn.classList.add('hidden');
  removeAirdocFile();
  document.getElementById('encRossmaxAct').value = '';

  // Plan
  document.getElementById('encPreDiag').value = '';
  document.getElementById('encPlanMeds').value = '';
  document.getElementById('encPlanSupps').value = '';
  document.getElementById('encPlanCounselling').value = '';
  document.getElementById('encReferral').value = '';

  // Next TCA (Return Appointment)
  document.getElementById('encTcaDate').value = '';
  document.getElementById('encTcaTime').value = '10:00';
  document.getElementById('encTcaPurpose').value = 'Chronic Medication Refill & Health Review';

  // Reset other POCT notes & files
  const otherNotesEl = document.getElementById('encOtherTestsNotes');
  if (otherNotesEl) otherNotesEl.value = '';
  tempAttachedFiles = [];
  renderTempAttachedFiles();

  // Reset AI Clinical Review panel & state
  const aiPanel = document.getElementById('aiClinicalResultPanel');
  if (aiPanel) aiPanel.classList.add('hidden');
  const aiLoading = document.getElementById('aiClinicalLoading');
  if (aiLoading) aiLoading.classList.add('hidden');
  currentAiReviewResult = null;

  modal.classList.remove('hidden');
}

function closeEncounterModal() {
  const modal = document.getElementById('patientEncounterModal');
  if (modal) modal.classList.add('hidden');
}

// Quick-fill Chief Complaint Chip
function setChiefComplaint(text) {
  const el = document.getElementById('encChiefComplaint');
  if (el) {
    el.value = text;
    el.focus();
  }
}

// Accordion collapse toggle
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  const icon = document.getElementById(panelId + '_icon');
  if (!panel) return;
  panel.classList.toggle('hidden');
  if (icon) icon.classList.toggle('rotate-180');
}

// ─── TEDA LINK HELPERS ───────────────────────────────────────────────────────
function checkTedaUrl(url) {
  const btn = document.getElementById('openTedaLinkBtn');
  if (!btn) return;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }
}

function openTedaLink() {
  const url = document.getElementById('encTeda').value.trim();
  if (url) window.open(url, '_blank');
}

// ─── AIRDOC RETINAL REPORT PDF HELPERS ───────────────────────────────────────
function handleAirdocFile(files) {
  if (!files || !files[0]) return;
  selectedAirdocFile = files[0];
  const nameEl = document.getElementById('encAirdocFileName');
  const badgeEl = document.getElementById('encAirdocBadge');
  const removeBtn = document.getElementById('encAirdocRemoveBtn');

  if (nameEl) nameEl.textContent = `${selectedAirdocFile.name} (${formatFileSize(selectedAirdocFile.size)})`;
  if (badgeEl) badgeEl.innerHTML = '<span class="text-emerald-700 font-bold">PDF Ready</span>';
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function removeAirdocFile() {
  selectedAirdocFile = null;
  const fileInput = document.getElementById('encAirdocPdf');
  if (fileInput) fileInput.value = '';
  const nameEl = document.getElementById('encAirdocFileName');
  if (nameEl) nameEl.textContent = '';
  const badgeEl = document.getElementById('encAirdocBadge');
  if (badgeEl) badgeEl.textContent = 'No PDF selected';
  const removeBtn = document.getElementById('encAirdocRemoveBtn');
  if (removeBtn) removeBtn.classList.add('hidden');
}

// ─── QUICK TCA (RETURN APPOINTMENT) HELPER ──────────────────────────────────
function setQuickTca(days) {
  const target = new Date();
  target.setDate(target.getDate() + days);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const dateInput = document.getElementById('encTcaDate');
  if (dateInput) {
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

// Dynamic Custom Tests
function addCustomTestRow() {
  const name = prompt('Enter Test Name (e.g. Saliva Cortisol, Troponin-I):');
  if (!name) return;
  const result = prompt('Enter Test Result Value:');
  const unit = prompt('Enter Unit (e.g. nmol/L, ng/mL):', '');
  const notes = prompt('Enter Reference Range / Remarks (Optional):', '');

  tempCustomTests.push({ name, result, unit, notes });
  renderTempCustomTests();
}

function removeCustomTestRow(idx) {
  tempCustomTests.splice(idx, 1);
  renderTempCustomTests();
}

function renderTempCustomTests() {
  const container = document.getElementById('encCustomTestsList');
  if (!container) return;
  if (!tempCustomTests.length) {
    container.innerHTML = `<p class="text-gray-400 text-xs italic">No custom tests added. Click "+ Add Custom Test" to log other POCTs or scans.</p>`;
    return;
  }
  container.innerHTML = tempCustomTests.map((t, idx) => `
    <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 text-xs mb-1.5">
      <div>
        <span class="font-bold text-gray-800">${t.name}:</span>
        <span class="font-semibold text-blue-700 ml-1">${t.result} ${t.unit}</span>
        ${t.notes ? `<span class="text-gray-500 text-[11px] ml-2">(${t.notes})</span>` : ''}
      </div>
      <button onclick="removeCustomTestRow(${idx})" class="text-rose-600 hover:text-rose-800 text-xs">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

// File Attachment Handler
function handleEncounterFiles(files) {
  for (let i = 0; i < files.length; i++) {
    tempAttachedFiles.push(files[i]);
  }
  renderTempAttachedFiles();
}

function removeTempFile(idx) {
  tempAttachedFiles.splice(idx, 1);
  renderTempAttachedFiles();
}

function renderTempAttachedFiles() {
  const container = document.getElementById('encAttachedFilesList');
  if (!container) return;
  if (!tempAttachedFiles.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = tempAttachedFiles.map((f, idx) => `
    <div class="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs mb-1.5">
      <div class="flex items-center gap-2 truncate">
        <i class="fa-solid fa-file-lines text-blue-600"></i>
        <span class="font-semibold text-gray-800 truncate">${f.name}</span>
        <span class="text-gray-400 text-[10px]">(${formatFileSize(f.size)})</span>
      </div>
      <button onclick="removeTempFile(${idx})" class="text-rose-600 hover:text-rose-800 text-xs ml-2">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

async function saveNewEncounter() {
  const pId = document.getElementById('encounterPatientSelect').value;
  const p = patientsData.find(pt => pt.id === pId);
  if (!p) return;

  const session = getSession();
  const recorder = session ? `${session.displayName} (${session.role})` : 'Pharmacist';

  // Save attached files into IndexedDB
  const attachedDocIds = [];
  for (const file of tempAttachedFiles) {
    try {
      const savedDoc = await savePatientDocument(pId, file, 'Uploaded during Consultation on ' + document.getElementById('encDate').value);
      attachedDocIds.push({ id: savedDoc.id, name: savedDoc.name, size: savedDoc.size });
    } catch (err) {
      console.error('Error saving document to IndexedDB:', err);
    }
  }

  // Save Airdoc PDF into IndexedDB if attached
  if (selectedAirdocFile) {
    try {
      const savedAirdoc = await savePatientDocument(pId, selectedAirdocFile, 'Airdoc Retinal AI Scan Report (' + document.getElementById('encDate').value + ')');
      attachedDocIds.push({ id: savedAirdoc.id, name: '[Airdoc AI Report] ' + savedAirdoc.name, size: savedAirdoc.size });
    } catch (err) {
      console.error('Error saving Airdoc PDF to IndexedDB:', err);
    }
  }

  const newEnc = {
    id: 'ENC-' + Date.now(),
    date: document.getElementById('encDate').value || getTodayDateString(0),
    recordedBy: recorder,
    chiefComplaint: document.getElementById('encChiefComplaint').value.trim(),
    hpi: document.getElementById('encHpi').value.trim(),
    vitals: {
      bpSys: Number(document.getElementById('encBpSys').value) || null,
      bpDia: Number(document.getElementById('encBpDia').value) || null,
      pulse: Number(document.getElementById('encPulse').value) || null,
      spo2: Number(document.getElementById('encSpo2').value) || null,
      weight: Number(document.getElementById('encWeight').value) || null,
      height: Number(document.getElementById('encHeight').value) || null,
      bmi: Number(document.getElementById('encBmi').value) || null
    },
    lipidPanel: {
      tc: Number(document.getElementById('encTc').value) || null,
      tg: Number(document.getElementById('encTg').value) || null,
      hdl: Number(document.getElementById('encHdl').value) || null,
      ldl: Number(document.getElementById('encLdl').value) || null,
      ai: Number(document.getElementById('encAi').value) || null,
      rChd: Number(document.getElementById('encRchd').value) || null
    },
    liverPanel: {
      ast: Number(document.getElementById('encAst').value) || null,
      alt: Number(document.getElementById('encAlt').value) || null,
      alb: Number(document.getElementById('encAlb').value) || null
    },
    kidneyPanel: {
      ua: Number(document.getElementById('encUa').value) || null,
      creatinine: Number(document.getElementById('encCreatinine').value) || null,
      urea: Number(document.getElementById('encUrea').value) || null,
      egfr: Number(document.getElementById('encEgfr').value) || null
    },
    glycemicHeme: {
      glucose: Number(document.getElementById('encGlucose').value) || null,
      glucoseType: document.getElementById('encGlucoseType').value,
      hba1c: Number(document.getElementById('encHba1c').value) || null,
      hb: Number(document.getElementById('encHb').value) || null,
      hct: Number(document.getElementById('encHct').value) || null
    },
    specialtyScans: {
      vitD: document.getElementById('encVitD').value || null,
      ferritin: document.getElementById('encFerritin').value || null,
      teda: document.getElementById('encTeda').value.trim() || null,
      airdoc: selectedAirdocFile ? selectedAirdocFile.name : null,
      rossmaxAct: document.getElementById('encRossmaxAct').value.trim() || null
    },
    customTests: document.getElementById('encOtherTestsNotes') ? document.getElementById('encOtherTestsNotes').value.trim() : '',
    preDiagnostic: document.getElementById('encPreDiag').value.trim(),
    planMedications: document.getElementById('encPlanMeds').value.trim(),
    planSupplements: document.getElementById('encPlanSupps').value.trim(),
    planCounselling: document.getElementById('encPlanCounselling').value.trim(),
    referral: document.getElementById('encReferral').value.trim(),
    attachedDocs: attachedDocIds
  };

  if (!p.encounters) p.encounters = [];
  p.encounters.unshift(newEnc);

  // Auto-book Next TCA (Return Appointment) if filled
  const tcaDate = document.getElementById('encTcaDate').value;
  if (tcaDate) {
    const tcaTime = document.getElementById('encTcaTime').value || '10:00';
    const tcaPurpose = document.getElementById('encTcaPurpose').value.trim() || 'Follow-up Consultation & Refill';
    const newApt = {
      id: 'APT-' + Date.now(),
      date: tcaDate,
      time: tcaTime,
      purpose: tcaPurpose,
      pharmacist: recorder,
      status: 'Scheduled',
      notes: 'Scheduled during consultation on ' + (document.getElementById('encDate').value || getTodayDateString(0))
    };
    if (!p.appointments) p.appointments = [];
    p.appointments.unshift(newApt);
  }

  savePatientsData();
  closeEncounterModal();
  renderPatientModule();

  if (viewingPatientId === pId) {
    viewPatientProfile(pId);
  }
}

// ─── BOOK APPOINTMENT MODAL ──────────────────────────────────────────────────
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

  const aptPharmEl = document.getElementById('aptPharmacist');
  if (aptPharmEl) {
    const session = getSession();
    if (session && session.displayName) {
      const match = Array.from(aptPharmEl.options).find(opt => opt.value.toLowerCase().includes(session.displayName.toLowerCase()));
      if (match) {
        aptPharmEl.value = match.value;
      }
    }
  }

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

  const aptPharmEl = document.getElementById('aptPharmacist');
  const attendingPharm = aptPharmEl ? aptPharmEl.value.trim() : 'Duty Pharmacist';

  const newApt = {
    id: 'APT-' + Date.now(),
    date: document.getElementById('aptDate').value,
    time: document.getElementById('aptTime').value,
    purpose: document.getElementById('aptPurpose').value.trim(),
    pharmacist: attendingPharm,
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

// ─── PATIENT FULL PROFILE & HISTORY MODAL ────────────────────────────────────
function viewPatientProfile(patientId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) return;

  viewingPatientId = patientId;
  const modal = document.getElementById('patientProfileModal');
  if (!modal) return;

  document.getElementById('profName').textContent = p.name;
  document.getElementById('profMeta').textContent = `${p.gender}, ${p.age} yrs · IC: ${p.ic || '—'} · Phone: ${p.phone || '—'} · Branch: ${p.branch} · Language: ${p.language}`;
  document.getElementById('profConditions').innerHTML = (p.conditions || []).map(c => `
    <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${c}</span>
  `).join('') || '<span class="text-xs text-gray-400">None recorded</span>';

  document.getElementById('profAllergies').textContent = p.allergies || 'None known';
  document.getElementById('profNotes').textContent = p.notes || 'None';

  switchProfileTab('encounters');
  modal.classList.remove('hidden');
}

function closePatientProfileModal() {
  const modal = document.getElementById('patientProfileModal');
  if (modal) modal.classList.add('hidden');
  viewingPatientId = null;
}

function switchProfileTab(tab) {
  activeProfileTab = tab;
  ['encounters', 'trends', 'meds', 'docs', 'apts'].forEach(t => {
    const btn = document.getElementById(`profTabBtn_${t}`);
    const view = document.getElementById(`profTabView_${t}`);
    if (btn) {
      if (t === tab) {
        btn.classList.add('border-blue-700', 'text-blue-700', 'font-bold');
        btn.classList.remove('border-transparent', 'text-gray-500');
      } else {
        btn.classList.remove('border-blue-700', 'text-blue-700', 'font-bold');
        btn.classList.add('border-transparent', 'text-gray-500');
      }
    }
    if (view) {
      if (t === tab) view.classList.remove('hidden');
      else view.classList.add('hidden');
    }
  });

  const p = patientsData.find(pt => pt.id === viewingPatientId);
  if (!p) return;

  if (tab === 'encounters') renderProfileEncounters(p);
  else if (tab === 'trends') renderProfileTrends(p);
  else if (tab === 'meds') renderProfileMeds(p);
  else if (tab === 'docs') renderProfileDocs(p);
  else if (tab === 'apts') renderProfileApts(p);
}

// Tab 1: Encounters History (SOAP & POCT)
function renderProfileEncounters(p) {
  const container = document.getElementById('profEncountersList');
  if (!container) return;

  if (!p.encounters || !p.encounters.length) {
    container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs">
      <i class="fa-regular fa-clipboard text-2xl mb-2 text-gray-300 block"></i>
      No clinical encounters recorded yet. Click <b>"Consult & POCT"</b> to begin an encounter.
    </div>`;
    return;
  }

  container.innerHTML = p.encounters.map(enc => {
    const bpCls = (enc.vitals && enc.vitals.bpSys && enc.vitals.bpDia)
      ? getBpClassification(enc.vitals.bpSys, enc.vitals.bpDia)
      : { label: '—', badge: 'bg-gray-100 text-gray-600' };

    const waSummary = buildConsultationWaSummary(p, enc);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waSummary)}`;

    return `
      <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div class="flex items-center justify-between border-b pb-2 mb-3">
          <div>
            <span class="text-xs font-bold text-gray-900">${enc.date}</span>
            <span class="text-[11px] text-gray-400 ml-2">by ${enc.recordedBy}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${bpCls.badge}">
              BP ${enc.vitals ? enc.vitals.bpSys + '/' + enc.vitals.bpDia : '—'} mmHg (${bpCls.label})
            </span>
            <a href="${waUrl}" target="_blank" rel="noopener"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 transition"
              title="Send Consultation Summary via WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp Summary
            </a>
          </div>
        </div>

        <!-- SOAP Breakdown -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <!-- Subjective -->
          <div class="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
            <p class="font-bold text-blue-900 mb-1">📌 Chief Complaint & History (CC & HPI):</p>
            <p class="text-gray-800 font-medium">${enc.chiefComplaint || '—'}</p>
            ${enc.hpi ? `<p class="text-gray-600 mt-1 italic text-[11px]">${enc.hpi}</p>` : ''}
          </div>

          <!-- Pre-Diagnostic -->
          <div class="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
            <p class="font-bold text-amber-900 mb-1">🔍 Pre-Diagnostic / Clinical Impression:</p>
            <p class="text-gray-800">${enc.preDiagnostic || '—'}</p>
          </div>
        </div>

        <!-- Key POCT Results Pills -->
        <div class="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          ${enc.vitals && enc.vitals.pulse ? `<span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Pulse: <b>${enc.vitals.pulse} bpm</b></span>` : ''}
          ${enc.vitals && enc.vitals.spo2 ? `<span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">SpO2: <b>${enc.vitals.spo2}%</b></span>` : ''}
          ${enc.glycemicHeme && enc.glycemicHeme.glucose ? `<span class="bg-teal-50 text-teal-800 px-2 py-0.5 rounded">Glucose (${enc.glycemicHeme.glucoseType}): <b>${enc.glycemicHeme.glucose} mmol/L</b></span>` : ''}
          ${enc.glycemicHeme && enc.glycemicHeme.hba1c ? `<span class="bg-purple-50 text-purple-800 px-2 py-0.5 rounded">HbA1c: <b>${enc.glycemicHeme.hba1c}%</b></span>` : ''}
          ${enc.lipidPanel && enc.lipidPanel.tc ? `<span class="bg-blue-50 text-blue-800 px-2 py-0.5 rounded">TC: <b>${enc.lipidPanel.tc}</b> | HDL: <b>${enc.lipidPanel.hdl}</b> | AI: <b>${enc.lipidPanel.ai}</b></span>` : ''}
          ${enc.kidneyPanel && enc.kidneyPanel.ua ? `<span class="bg-rose-50 text-rose-800 px-2 py-0.5 rounded">Uric Acid: <b>${enc.kidneyPanel.ua} umol/L</b></span>` : ''}
          ${enc.kidneyPanel && enc.kidneyPanel.creatinine ? `<span class="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">Creatinine: <b>${enc.kidneyPanel.creatinine}</b> | eGFR: <b>${enc.kidneyPanel.egfr}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.vitD ? `<span class="px-2 py-0.5 rounded ${enc.specialtyScans.vitD === 'Sufficient' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}">Vit D: <b>${enc.specialtyScans.vitD}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.ferritin ? `<span class="px-2 py-0.5 rounded ${enc.specialtyScans.ferritin === 'Sufficient' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}">Ferritin: <b>${enc.specialtyScans.ferritin}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.rossmaxAct ? `<span class="bg-amber-50 text-amber-800 px-2 py-0.5 rounded">Rossmax ACT: <b>${enc.specialtyScans.rossmaxAct}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.teda ? `<a href="${enc.specialtyScans.teda}" target="_blank" class="bg-cyan-50 text-cyan-800 hover:underline px-2 py-0.5 rounded inline-flex items-center gap-1 font-medium"><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> TEDA Scan Report</a>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.airdoc ? `<span class="bg-purple-50 text-purple-800 px-2 py-0.5 rounded inline-flex items-center gap-1"><i class="fa-solid fa-file-pdf text-red-500"></i> Airdoc AI: <b>${enc.specialtyScans.airdoc}</b></span>` : ''}
        </div>

        <!-- Other POCT / Screening Notes -->
        ${enc.customTests ? `
          <div class="mt-2 text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <span class="font-bold text-gray-700">Other POCT / Notes:</span>
            <span class="ml-1.5 text-gray-800 font-medium">${typeof enc.customTests === 'string' ? enc.customTests : (Array.isArray(enc.customTests) ? enc.customTests.map(ct => `${ct.name}: ${ct.result} ${ct.unit}`).join(', ') : '')}</span>
          </div>
        ` : ''}

        <!-- Plan of Action -->
        <div class="mt-3 pt-2 border-t text-xs space-y-1">
          ${enc.planMedications ? `<p>💊 <b>Medications:</b> <span class="text-gray-700">${enc.planMedications}</span></p>` : ''}
          ${enc.planSupplements ? `<p>🌿 <b>Supplements (Nutraceuticals):</b> <span class="text-emerald-700 font-semibold">${enc.planSupplements}</span></p>` : ''}
          ${enc.planCounselling ? `<p>🗣️ <b>Counselling & Diet:</b> <span class="text-gray-600">${enc.planCounselling}</span></p>` : ''}
          ${enc.referral ? `<p>🚨 <b>Referral:</b> <span class="text-rose-700 font-bold">${enc.referral}</span></p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Tab 2: POCT Test Trends Table
function renderProfileTrends(p) {
  const tbody = document.getElementById('profTrendsBody');
  if (!tbody) return;

  if (!p.encounters || !p.encounters.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-gray-400 text-xs">No POCT records.</td></tr>`;
    return;
  }

  tbody.innerHTML = p.encounters.map(enc => {
    const v = enc.vitals || {};
    const l = enc.lipidPanel || {};
    const k = enc.kidneyPanel || {};
    const g = enc.glycemicHeme || {};
    const bpCls = (v.bpSys && v.bpDia) ? getBpClassification(v.bpSys, v.bpDia) : { badge: 'bg-gray-100 text-gray-500' };

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
        <td class="px-3 py-2 font-semibold text-gray-900">${enc.date}</td>
        <td class="px-3 py-2">
          <span class="inline-block px-1.5 py-0.5 rounded ${bpCls.badge}">${v.bpSys || '—'}/${v.bpDia || '—'}</span>
          <span class="text-[10px] text-gray-400">${v.pulse ? v.pulse + ' bpm' : ''}</span>
        </td>
        <td class="px-3 py-2">${g.glucose ? `${g.glucose} (${g.glucoseType})` : '—'}</td>
        <td class="px-3 py-2 font-semibold text-purple-700">${g.hba1c ? `${g.hba1c}%` : '—'}</td>
        <td class="px-3 py-2">${l.tc ? `TC: ${l.tc} | HDL: ${l.hdl || '—'}` : '—'}</td>
        <td class="px-3 py-2 font-mono text-blue-700">${l.ai ? l.ai : '—'}</td>
        <td class="px-3 py-2 text-rose-700 font-semibold">${k.ua ? `${k.ua} umol/L` : '—'}</td>
        <td class="px-3 py-2 text-indigo-700">${k.creatinine ? `${k.creatinine} (eGFR: ${k.egfr || '—'})` : '—'}</td>
      </tr>
    `;
  }).join('');
}

// Tab 3: Chronic Meds & Refills
function renderProfileMeds(p) {
  const tbody = document.getElementById('profMedsBody');
  if (!tbody) return;

  if (!p.medications || !p.medications.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400 text-xs">No chronic medications listed.</td></tr>`;
    return;
  }

  tbody.innerHTML = p.medications.map(med => {
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

// Tab 4: Lab Reports & Documents (IndexedDB)
async function renderProfileDocs(p) {
  const container = document.getElementById('profDocsGallery');
  if (!container) return;

  container.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs">Loading attached documents...</div>`;

  try {
    const docs = await getPatientDocuments(p.id);
    if (!docs.length) {
      container.innerHTML = `
        <div class="text-center py-10 text-gray-400 text-xs border border-dashed rounded-xl p-6">
          <i class="fa-solid fa-file-medical text-3xl mb-2 text-gray-300 block"></i>
          No lab reports or blood test documents uploaded for this patient.<br>
          <label class="mt-3 inline-block bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition">
            <i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> Upload Lab Report (PDF / Image)
            <input type="file" accept="application/pdf,image/*" class="hidden" onchange="uploadPatientDocDirect(event, '${p.id}')">
          </label>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <span class="text-xs font-bold text-gray-700">${docs.length} Document(s) Stored in Local IndexedDB</span>
        <label class="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1">
          <i class="fa-solid fa-plus"></i> Upload Document
          <input type="file" accept="application/pdf,image/*" class="hidden" onchange="uploadPatientDocDirect(event, '${p.id}')">
        </label>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        ${docs.map(doc => {
          const isPdf = doc.type.includes('pdf');
          return `
            <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-blue-300 transition flex flex-col justify-between">
              <div class="flex items-start gap-2.5 mb-2">
                <div class="w-9 h-9 rounded-lg ${isPdf ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center shrink-0">
                  <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-image'} text-lg"></i>
                </div>
                <div class="overflow-hidden">
                  <p class="font-bold text-gray-900 text-xs truncate" title="${doc.name}">${doc.name}</p>
                  <p class="text-[10px] text-gray-400">${doc.date} · ${formatFileSize(doc.size)}</p>
                </div>
              </div>
              ${doc.notes ? `<p class="text-[11px] text-gray-500 italic mb-2 line-clamp-2">${doc.notes}</p>` : ''}
              <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                <button onclick="previewDoc('${doc.id}')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded font-semibold transition">
                  <i class="fa-solid fa-eye"></i> View
                </button>
                <button onclick="deleteDocConfirm('${doc.id}', '${p.id}')" class="text-rose-600 hover:text-rose-800 text-xs p-1 transition" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-rose-600 text-xs">Error accessing IndexedDB storage: ${err.message}</p>`;
  }
}

async function uploadPatientDocDirect(event, patientId) {
  const file = event.target.files[0];
  if (!file) return;
  const notes = prompt('Enter remarks for this document (e.g. Pathlab Full Blood Test 2026):', 'Full Blood Report');
  try {
    await savePatientDocument(patientId, file, notes || '');
    const p = patientsData.find(pt => pt.id === patientId);
    if (p) renderProfileDocs(p);
  } catch (err) {
    alert('Failed to save document: ' + err.message);
  }
}

async function previewDoc(docId) {
  try {
    const doc = await getDocumentById(docId);
    if (!doc || !doc.blob) {
      alert('Document not found in storage.');
      return;
    }

    const url = URL.createObjectURL(doc.blob);
    const modal = document.getElementById('patientDocPreviewModal');
    const container = document.getElementById('docPreviewContainer');
    const titleEl = document.getElementById('docPreviewTitle');

    if (titleEl) titleEl.textContent = doc.name;

    if (doc.type.includes('pdf')) {
      container.innerHTML = `<iframe src="${url}" class="w-full h-[75vh] rounded-lg border"></iframe>`;
    } else {
      container.innerHTML = `<img src="${url}" alt="Lab Report" class="max-w-full max-h-[75vh] mx-auto rounded-lg shadow">`;
    }

    if (modal) modal.classList.remove('hidden');
  } catch (err) {
    alert('Could not preview document: ' + err.message);
  }
}

function closeDocPreviewModal() {
  const modal = document.getElementById('patientDocPreviewModal');
  if (modal) modal.classList.add('hidden');
}

async function deleteDocConfirm(docId, patientId) {
  if (!confirm('Are you sure you want to delete this document from local storage?')) return;
  await deletePatientDocument(docId);
  const p = patientsData.find(pt => pt.id === patientId);
  if (p) renderProfileDocs(p);
}

// Tab 5: Appointments History
function renderProfileApts(p) {
  const tbody = document.getElementById('profAptsBody');
  if (!tbody) return;

  if (!p.appointments || !p.appointments.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400 text-xs">No appointment history.</td></tr>`;
    return;
  }

  tbody.innerHTML = p.appointments.map(apt => {
    let stBadge = 'bg-blue-100 text-blue-800';
    if (apt.status === 'Completed') stBadge = 'bg-green-100 text-green-800';
    if (apt.status === 'Missed') stBadge = 'bg-red-100 text-red-800';

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
        <td class="px-3 py-2 font-semibold text-gray-800">${apt.date} ${apt.time || ''}</td>
        <td class="px-3 py-2 font-medium text-gray-900">
          ${escHtml(apt.purpose || 'Check-up')}
          ${apt.pharmacist ? `<span class="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1.5"><i class="fa-solid fa-user-doctor text-[9px]"></i> ${escHtml(apt.pharmacist)}</span>` : ''}
        </td>
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

// Prompt Add Medication (Profile tab)
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
  renderProfileMeds(p);
  renderPatientModule();
}

// ─── WHATSAPP CONSULTATION SUMMARY BUILDER ───────────────────────────────────
function buildConsultationWaSummary(patient, enc) {
  const branchName = patient.branch === 'KS01' ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${patient.branch}`;
  const lang = patient.language || 'English';
  const name = patient.name;
  const date = enc.date;

  const v = enc.vitals || {};
  const g = enc.glycemicHeme || {};
  const l = enc.lipidPanel || {};

  if (lang === 'Chinese') {
    let msg = `尊敬的 ${name}，这是您于 ${date} 在【${branchName}】的健康咨询与检查报告小结：\n\n`;
    msg += `🩺 *测量数据：*\n`;
    if (v.bpSys && v.bpDia) msg += `• 血压：${v.bpSys}/${v.bpDia} mmHg (${getBpClassification(v.bpSys, v.bpDia).label})\n`;
    if (v.pulse) msg += `• 脉搏：${v.pulse} bpm\n`;
    if (g.glucose) msg += `• 血糖 (${g.glucoseType})：${g.glucose} mmol/L\n`;
    if (g.hba1c) msg += `• 糖化血红蛋白 HbA1c：${g.hba1c}%\n`;
    if (l.tc) msg += `• 总胆固醇：${l.tc} mmol/L | AI指数：${l.ai || '—'}\n`;

    if (enc.preDiagnostic) msg += `\n🔍 *药剂师评估：*\n${enc.preDiagnostic}\n`;
    if (enc.planMedications) msg += `\n💊 *用药建议：*\n${enc.planMedications}\n`;
    if (enc.planSupplements) msg += `\n🌿 *保健品推荐：*\n${enc.planSupplements}\n`;
    if (enc.planCounselling) msg += `\n🗣️ *饮食与生活注意：*\n${enc.planCounselling}\n`;

    msg += `\n祝您身体健康！如有任何用药疑问，欢迎随时联系我们。`;
    return msg;
  } else if (lang === 'Malay') {
    let msg = `Salam ${name}, ini adalah ringkasan konsultasi kesihatan anda pada ${date} di 【${branchName}】：\n\n`;
    msg += `🩺 *Keputusan Pemeriksaan:*\n`;
    if (v.bpSys && v.bpDia) msg += `• Tekanan Darah (BP): ${v.bpSys}/${v.bpDia} mmHg\n`;
    if (v.pulse) msg += `• Nadi: ${v.pulse} bpm\n`;
    if (g.glucose) msg += `• Gula Darah (${g.glucoseType}): ${g.glucose} mmol/L\n`;
    if (l.tc) msg += `• Kolesterol: ${l.tc} mmol/L\n`;

    if (enc.preDiagnostic) msg += `\n🔍 *Penilaian Ahli Farmasi:*\n${enc.preDiagnostic}\n`;
    if (enc.planMedications) msg += `\n💊 *Ubat-ubatan:*\n${enc.planMedications}\n`;
    if (enc.planSupplements) msg += `\n🌿 *Suplemen Disyorkan:*\n${enc.planSupplements}\n`;
    if (enc.planCounselling) msg += `\n🗣️ *Nasihat Gaya Hidup:*\n${enc.planCounselling}\n`;

    msg += `\nSemoga sihat selalu! Hubungi kami jika ada sebarang pertanyaan.`;
    return msg;
  } else {
    let msg = `Dear ${name}, here is your health consultation summary from ${branchName} on ${date}:\n\n`;
    msg += `🩺 *Health Vitals & POCT:*\n`;
    if (v.bpSys && v.bpDia) msg += `• Blood Pressure: ${v.bpSys}/${v.bpDia} mmHg\n`;
    if (v.pulse) msg += `• Pulse: ${v.pulse} bpm\n`;
    if (g.glucose) msg += `• Blood Glucose (${g.glucoseType}): ${g.glucose} mmol/L\n`;
    if (g.hba1c) msg += `• HbA1c: ${g.hba1c}%\n`;
    if (l.tc) msg += `• Total Cholesterol: ${l.tc} mmol/L (AI: ${l.ai || '—'})\n`;

    if (enc.preDiagnostic) msg += `\n🔍 *Pharmacist Clinical Impression:*\n${enc.preDiagnostic}\n`;
    if (enc.planMedications) msg += `\n💊 *Medications:*\n${enc.planMedications}\n`;
    if (enc.planSupplements) msg += `\n🌿 *Recommended Supplements:*\n${enc.planSupplements}\n`;
    if (enc.planCounselling) msg += `\n🗣️ *Lifestyle & Dietary Advice:*\n${enc.planCounselling}\n`;

    msg += `\nStay healthy! Feel free to message us if you have any questions.`;
    return msg;
  }
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

  // Sheet 3: POCT Encounters Log
  const wsEnc = workbook.addWorksheet('POCT_Encounters_Log', { views: [{ showGridLines: true }] });
  wsEnc.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Patient Name', key: 'name', width: 22 },
    { header: 'Pharmacist', key: 'recordedBy', width: 20 },
    { header: 'BP (mmHg)', key: 'bp', width: 14 },
    { header: 'Glucose', key: 'glucose', width: 14 },
    { header: 'HbA1c (%)', key: 'hba1c', width: 12 },
    { header: 'Cholesterol', key: 'tc', width: 12 },
    { header: 'AI Index', key: 'ai', width: 10 },
    { header: 'Uric Acid', key: 'ua', width: 12 },
    { header: 'Pre-Diagnostic', key: 'preDiag', width: 30 },
    { header: 'Action Plan', key: 'plan', width: 35 }
  ];

  [wsApt, wsPat, wsEnc].forEach(ws => {
    const row1 = ws.getRow(1);
    row1.height = 26;
    row1.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

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

    (p.encounters || []).forEach(enc => {
      const v = enc.vitals || {};
      const g = enc.glycemicHeme || {};
      const l = enc.lipidPanel || {};
      const k = enc.kidneyPanel || {};

      wsEnc.addRow({
        date: enc.date,
        name: p.name,
        recordedBy: enc.recordedBy,
        bp: v.bpSys ? `${v.bpSys}/${v.bpDia}` : '—',
        glucose: g.glucose ? `${g.glucose} (${g.glucoseType})` : '—',
        hba1c: g.hba1c || '—',
        tc: l.tc || '—',
        ai: l.ai || '—',
        ua: k.ua || '—',
        preDiag: enc.preDiagnostic || '—',
        plan: [enc.planMedications, enc.planSupplements, enc.planCounselling].filter(Boolean).join(' | ')
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `PMG_Clinical_POCT_Register_${getTodayDateString(0)}.xlsx`;

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

// ─── CLOUD ONEDRIVE & PEN DRIVE BACKUP ENGINE ────────────────────────────────
async function createPatientBackupBundle(type = 'DAILY_ONEDRIVE_BACKUP') {
  const session = getSession();
  const branch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'KS01';
  const dateStr = getTodayDateString(0);

  // 1. Gather all documents from IndexedDB
  let documents = [];
  if (typeof exportAllDocuments === 'function') {
    try {
      documents = await exportAllDocuments();
    } catch (err) {
      console.warn('Error exporting documents from IndexedDB:', err);
    }
  }

  // 2. Gather pharmacist working hour schedules & customer bookings from localStorage
  const pharmacistSchedules = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pmg_pharmacist_schedule_')) {
      try {
        pharmacistSchedules[key] = JSON.parse(localStorage.getItem(key));
      } catch (_) {}
    }
  }

  let customerBookings = [];
  try {
    customerBookings = JSON.parse(localStorage.getItem('pmg_customer_bookings') || '[]');
  } catch (_) {}

  // 3. Package into bundle
  const backupBundle = {
    app: 'PMG_MANAGEMENT_HUB',
    version: '1.2',
    type: type,
    exportDate: new Date().toISOString(),
    branch: branch,
    patientCount: patientsData.length,
    docCount: documents.length,
    scheduleCount: Object.keys(pharmacistSchedules).length,
    bookingCount: customerBookings.length,
    patients: patientsData,
    documents: documents,
    pharmacistSchedules: pharmacistSchedules,
    customerBookings: customerBookings
  };

  const filename = `PMG_PatientBackup_${branch}_${dateStr}.pmgbak`;
  const jsonStr = JSON.stringify(backupBundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  return {
    bundle: backupBundle,
    filename,
    blob,
    branch,
    patientCount: patientsData.length,
    docCount: documents.length,
    scheduleCount: Object.keys(pharmacistSchedules).length,
    bookingCount: customerBookings.length
  };
}

// 1-Click Daily Backup directly to Microsoft OneDrive
async function backupToOneDrive() {
  try {
    const { filename, blob, patientCount, docCount, scheduleCount } = await createPatientBackupBundle('DAILY_ONEDRIVE_BACKUP');
    let savedViaPicker = false;

    // Use File System Access API (Chromium Edge/Chrome) to allow choosing/saving to OneDrive folder
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PMG Encrypted Patient Care Backup (.pmgbak)',
            accept: { 'application/json': ['.pmgbak'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        savedViaPicker = true;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User closed the file dialog without saving
          return;
        }
        console.warn('showSaveFilePicker failed, falling back to download:', err);
      }
    }

    if (!savedViaPicker) {
      // Standard browser download
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

    // Record last backup details
    const session = getSession();
    const nowIso = new Date().toISOString();
    localStorage.setItem('pmg_last_backup_date', nowIso);
    localStorage.setItem('pmg_last_backup_type', 'OneDrive');
    if (session && session.displayName) {
      localStorage.setItem('pmg_last_backup_user', session.displayName);
    }

    updateBackupStatusBadge();
    updateDailyBackupBanner();

    alert(`☁️ Daily OneDrive Backup Saved Successfully!\n\n• File: ${filename}\n• Patients: ${patientCount}\n• Attached Reports: ${docCount}\n• Pharmacist Schedules: ${scheduleCount} branch(es)\n\nSaved to your branch OneDrive sync folder. OneDrive will automatically synchronize this file with Area Manager William Chai in the cloud.`);
  } catch (err) {
    console.error('OneDrive backup failed:', err);
    alert('Failed to generate OneDrive backup: ' + err.message);
  }
}

// Offline fallback: Backup to physical USB Pen Drive
async function backupToPenDrive() {
  try {
    const { filename, blob, patientCount, docCount, scheduleCount, bookingCount } = await createPatientBackupBundle('FULL_PENDRIVE_BACKUP');

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

    const session = getSession();
    const nowIso = new Date().toISOString();
    localStorage.setItem('pmg_last_backup_date', nowIso);
    localStorage.setItem('pmg_last_backup_type', 'USB Pen Drive');
    if (session && session.displayName) {
      localStorage.setItem('pmg_last_backup_user', session.displayName);
    }

    updateBackupStatusBadge();
    updateDailyBackupBanner();

    alert(`💾 USB Pen Drive Backup Saved!\n\nFile: ${filename}\nPatients: ${patientCount}\nAttached Reports: ${docCount}\nPharmacist Schedules: ${scheduleCount} branch(es)\nCustomer Bookings: ${bookingCount}\n\nPlease save this file onto your branch USB Pen Drive.`);
  } catch (err) {
    console.error('Backup failed:', err);
    alert('Failed to generate backup: ' + err.message);
  }
}

async function handleRestoreBackupFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!confirm(`Are you sure you want to restore from "${file.name}"?\n\nThis will restore patient profiles, consultation records, attached lab reports, and pharmacist working hour schedules.`)) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target.result;
      const backup = JSON.parse(content);

      if (!backup || (!backup.patients && !Array.isArray(backup))) {
        throw new Error('Invalid backup file format.');
      }

      // Restore patients
      patientsData = backup.patients || backup;
      savePatientsData();

      // Restore IndexedDB documents
      let restoredDocs = 0;
      if (backup.documents && Array.isArray(backup.documents) && typeof importAllDocuments === 'function') {
        restoredDocs = await importAllDocuments(backup.documents);
      }

      // Restore pharmacist schedules
      let restoredSchedules = 0;
      if (backup.pharmacistSchedules && typeof backup.pharmacistSchedules === 'object') {
        Object.keys(backup.pharmacistSchedules).forEach(k => {
          try {
            localStorage.setItem(k, JSON.stringify(backup.pharmacistSchedules[k]));
            restoredSchedules++;
          } catch (_) {}
        });
      }

      // Restore customer bookings
      if (backup.customerBookings && Array.isArray(backup.customerBookings)) {
        localStorage.setItem('pmg_customer_bookings', JSON.stringify(backup.customerBookings));
      }

      // Update backup status
      localStorage.setItem('pmg_last_backup_date', new Date().toISOString());
      localStorage.setItem('pmg_last_backup_type', 'Restored Archive');
      updateBackupStatusBadge();
      updateDailyBackupBanner();
      renderPatientModule();

      alert(`✅ Restore Complete!\n\n• ${patientsData.length} patient records loaded.\n• ${restoredDocs} lab reports & documents restored into IndexedDB.\n• ${restoredSchedules} branch pharmacist working hour schedules restored.`);
    } catch (err) {
      console.error('Restore error:', err);
      alert('Failed to restore backup: ' + err.message);
    } finally {
      event.target.value = '';
    }
  };
  reader.onerror = () => {
    alert('Failed to read backup file.');
    event.target.value = '';
  };
  reader.readAsText(file);
}

function updateBackupStatusBadge() {
  const textEl = document.getElementById('backupStatusText');
  const badgeEl = document.getElementById('backupStatusBadge');
  if (!textEl || !badgeEl) return;

  const todayStr = getTodayDateString(0);
  const lastBackupStr = localStorage.getItem('pmg_last_backup_date');
  const lastType = localStorage.getItem('pmg_last_backup_type') || 'OneDrive';

  if (!lastBackupStr) {
    textEl.textContent = 'OneDrive: Backup Due';
    badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 transition';
    return;
  }

  const lastDate = new Date(lastBackupStr);
  const lastDateStr = lastBackupStr.split('T')[0];
  const isBackedUpToday = (lastDateStr === todayStr);

  if (isBackedUpToday) {
    const timeStr = lastDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    textEl.textContent = `OneDrive: Today ${timeStr} (Safe)`;
    badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition';
  } else {
    const diffDays = Math.max(1, Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
    textEl.textContent = `⚠️ OneDrive Due (${diffDays}d ago)`;
    badgeEl.className = 'cursor-pointer text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition';
  }
}

function updateDailyBackupBanner() {
  const banner = document.getElementById('patientDailyBackupBanner');
  const title = document.getElementById('backupBannerTitle');
  const desc = document.getElementById('backupBannerDesc');
  const icon = document.getElementById('backupBannerIcon');
  const actionBtn = document.getElementById('backupBannerActionBtn');
  if (!banner || !title || !desc) return;

  const todayStr = getTodayDateString(0);
  const lastBackupStr = localStorage.getItem('pmg_last_backup_date');
  const lastType = localStorage.getItem('pmg_last_backup_type') || 'OneDrive';
  const lastUser = localStorage.getItem('pmg_last_backup_user') || 'Pharmacist';

  const lastDateStr = lastBackupStr ? lastBackupStr.split('T')[0] : '';
  const isBackedUpToday = (lastDateStr === todayStr);

  if (!lastBackupStr) {
    banner.className = 'mb-4 p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm transition';
    if (icon) {
      icon.className = 'w-9 h-9 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0';
      icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-lg"></i>';
    }
    title.innerHTML = `⚠️ Daily Cloud Backup Required (No Backup Recorded Yet)`;
    desc.innerHTML = `Please run your first daily backup to Microsoft OneDrive. This saves all patient profiles, appointments, and test records to your company cloud folder.`;
    if (actionBtn) {
      actionBtn.className = 'bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5';
      actionBtn.innerHTML = '<i class="fa-brands fa-microsoft"></i> Backup to OneDrive Now';
    }
    banner.classList.remove('hidden');
  } else if (!isBackedUpToday) {
    const lastDateFormatted = new Date(lastBackupStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    banner.className = 'mb-4 p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm transition';
    if (icon) {
      icon.className = 'w-9 h-9 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0';
      icon.innerHTML = '<i class="fa-brands fa-microsoft text-lg"></i>';
    }
    title.innerHTML = `⚠️ Daily Backup Due for Today (${todayStr})`;
    desc.innerHTML = `Last backup was performed on <b>${lastDateFormatted}</b> (${lastType} by ${lastUser}). Back up today's consults & appointments to sync with Area Manager.`;
    if (actionBtn) {
      actionBtn.className = 'bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5';
      actionBtn.innerHTML = '<i class="fa-brands fa-microsoft"></i> Backup Today\'s Records (OneDrive)';
    }
    banner.classList.remove('hidden');
  } else {
    const timeFormatted = new Date(lastBackupStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    banner.className = 'mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm transition';
    if (icon) {
      icon.className = 'w-9 h-9 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0';
      icon.innerHTML = '<i class="fa-solid fa-cloud-arrow-up text-lg text-emerald-700"></i>';
    }
    title.innerHTML = `✅ Today's Cloud Backup Completed (${timeFormatted} today)`;
    desc.innerHTML = `Saved to <b>OneDrive (${lastType})</b> by ${lastUser}. Synced with Area Manager & protected against local PC loss.`;
    if (actionBtn) {
      actionBtn.className = 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5';
      actionBtn.innerHTML = '<i class="fa-brands fa-microsoft"></i> Re-Backup to OneDrive';
    }
    banner.classList.remove('hidden');
  }
}

function openOneDriveGuideModal() {
  const modal = document.getElementById('oneDriveGuideModal');
  if (modal) modal.classList.remove('hidden');
}

function closeOneDriveGuideModal() {
  const modal = document.getElementById('oneDriveGuideModal');
  if (modal) modal.classList.add('hidden');
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── BRANCH OPERATING HOURS & DYNAMIC PHARMACIST SCHEDULES ───────────────────
// ═════════════════════════════════════════════════════════════════════════════
const BRANCH_SCHEDULES = {
  'KS01': { name: 'Kota Sentosa (KS01)', open: '07:30', close: '21:30', pharmacist: 'Pharmacist William / Ting', phone: '60168334455' },
  'BR02': { name: 'Branch 02 (BR02)',    open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'BR03': { name: 'Branch 03 (BR03)',    open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'BR04': { name: 'Branch 04 (BR04)',    open: '08:30', close: '21:30', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'BR05': { name: 'Branch 05 (BR05)',    open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'BR06': { name: 'Branch 06 (BR06)',    open: '07:30', close: '21:30', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
};

function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

/**
 * Retrieves the full schedule configuration for a branch (template + overrides).
 */
function getPharmacistSchedule(branchCode) {
  const code = branchCode || 'KS01';
  const defInfo = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['KS01'];

  const storageKey = `pmg_pharmacist_schedule_${code}`;
  let data = null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) data = JSON.parse(raw);
  } catch (_) { data = null; }

  if (!data) {
    data = {
      branchCode: code,
      branchName: defInfo.name,
      defaultPharmacist: defInfo.pharmacist,
      weeklyTemplate: {
        "1": { dayName: "Monday",    isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist },
        "2": { dayName: "Tuesday",   isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist },
        "3": { dayName: "Wednesday", isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist },
        "4": { dayName: "Thursday",  isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist },
        "5": { dayName: "Friday",    isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist },
        "6": { dayName: "Saturday",  isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist },
        "0": { dayName: "Sunday",    isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist }
      },
      dateOverrides: {}
    };
  } else {
    // Ensure all 7 days exist in weeklyTemplate
    if (!data.weeklyTemplate) data.weeklyTemplate = {};
    const daysMeta = [
      { num: "1", name: "Monday" },
      { num: "2", name: "Tuesday" },
      { num: "3", name: "Wednesday" },
      { num: "4", name: "Thursday" },
      { num: "5", name: "Friday" },
      { num: "6", name: "Saturday" },
      { num: "0", name: "Sunday" }
    ];
    daysMeta.forEach(({ num, name }) => {
      if (!data.weeklyTemplate[num]) {
        data.weeklyTemplate[num] = { dayName: name, isOpen: true, open: defInfo.open, close: defInfo.close, pharmacist: defInfo.pharmacist };
      }
    });
    if (!data.dateOverrides) data.dateOverrides = {};
  }

  return data;
}

/**
 * Saves schedule config to localStorage.
 */
function savePharmacistSchedule(branchCode, scheduleObj) {
  const code = branchCode || 'KS01';
  localStorage.setItem(`pmg_pharmacist_schedule_${code}`, JSON.stringify(scheduleObj));
}

/**
 * Resolves the effective schedule for a specific date (YYYY-MM-DD):
 * Checks date overrides first, then weekly template, then static fallback.
 */
function getPharmacistScheduleForDate(branchCode, dateStr) {
  const code = branchCode || 'KS01';
  const defInfo = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['KS01'];
  const sched = getPharmacistSchedule(code);

  // 1. Check Specific Date Overrides (Priority 1)
  if (sched.dateOverrides && sched.dateOverrides[dateStr]) {
    const ov = sched.dateOverrides[dateStr];
    if (ov.isClosed) {
      return {
        branchCode: code,
        branchName: defInfo.name,
        date: dateStr,
        isOpen: false,
        isClosed: true,
        open: '',
        close: '',
        pharmacist: '',
        reason: ov.reason || 'Closed / Rest Day / Public Holiday',
        isOverride: true
      };
    } else {
      return {
        branchCode: code,
        branchName: defInfo.name,
        date: dateStr,
        isOpen: true,
        isClosed: false,
        open: ov.open || defInfo.open,
        close: ov.close || defInfo.close,
        pharmacist: ov.pharmacist || sched.defaultPharmacist || defInfo.pharmacist,
        reason: ov.reason || 'Special Working Hours',
        isOverride: true
      };
    }
  }

  // 2. Fall back to Weekly Template (Priority 2)
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = String(d.getDay()); // 0 = Sunday .. 6 = Saturday
    const tmpl = sched.weeklyTemplate && sched.weeklyTemplate[dayOfWeek];

    if (tmpl) {
      if (!tmpl.isOpen) {
        return {
          branchCode: code,
          branchName: defInfo.name,
          date: dateStr,
          isOpen: false,
          isClosed: true,
          open: '',
          close: '',
          pharmacist: '',
          reason: 'Weekly Rest Day',
          isOverride: false
        };
      } else {
        return {
          branchCode: code,
          branchName: defInfo.name,
          date: dateStr,
          isOpen: true,
          isClosed: false,
          open: tmpl.open || defInfo.open,
          close: tmpl.close || defInfo.close,
          pharmacist: tmpl.pharmacist || defInfo.pharmacist,
          reason: '',
          isOverride: false
        };
      }
    }
  }

  // 3. Fall back to static branch schedule (Priority 3)
  return {
    branchCode: code,
    branchName: defInfo.name,
    date: dateStr,
    isOpen: true,
    isClosed: false,
    open: defInfo.open,
    close: defInfo.close,
    pharmacist: defInfo.pharmacist,
    reason: '',
    isOverride: false
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── SHARE CUSTOMER BOOKING LINK MODAL (STAFF VIEW) ──────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function openShareBookingModal() {
  const modal = document.getElementById('shareBookingModal');
  if (!modal) return;

  const session = typeof getSession === 'function' ? getSession() : null;
  const userBranch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'KS01';

  const branchSelect = document.getElementById('shareBookingBranchSelect');
  if (branchSelect) {
    for (let opt of branchSelect.options) {
      if (opt.value === userBranch || opt.text.includes(userBranch)) {
        branchSelect.value = opt.value;
        break;
      }
    }
  }

  updateShareBookingUrl();
  modal.classList.remove('hidden');
}

function closeShareBookingModal() {
  const modal = document.getElementById('shareBookingModal');
  if (modal) modal.classList.add('hidden');
}

function updateShareBookingUrl() {
  const branchSelect = document.getElementById('shareBookingBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const info = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['KS01'];
  const sched = getPharmacistSchedule(code);

  const titleEl = document.getElementById('shareBookingHoursTitle');
  const descEl  = document.getElementById('shareBookingHoursDetails');
  if (titleEl) titleEl.textContent = `${sched.branchName || info.name} Pharmacist Hours`;

  const overrideCount = sched.dateOverrides ? Object.keys(sched.dateOverrides).length : 0;
  const overrideNote = overrideCount > 0 ? `<br><span class="text-purple-700 font-semibold text-[10px]">✨ ${overrideCount} specific date / holiday override(s) active</span>` : '';

  if (descEl) {
    descEl.innerHTML = `Standard Consultation Hours: <b>${info.open} – ${info.close}</b> (Mon – Sun)<br>Duty Pharmacist: <b>${escHtml(sched.defaultPharmacist || info.pharmacist)}</b>${overrideNote}`;
  }

  const baseUrl = window.location.origin + window.location.pathname;
  const bookingUrl = `${baseUrl}?book=1&branch=${encodeURIComponent(code)}`;

  const inputEl = document.getElementById('shareBookingUrlInput');
  if (inputEl) inputEl.value = bookingUrl;
}

function copyShareBookingUrl() {
  const inputEl = document.getElementById('shareBookingUrlInput');
  if (!inputEl) return;
  inputEl.select();
  navigator.clipboard.writeText(inputEl.value).then(() => {
    const textEl = document.getElementById('copyBookingBtnText');
    if (textEl) {
      textEl.textContent = 'Copied!';
      setTimeout(() => { textEl.textContent = 'Copy'; }, 2000);
    }
  }).catch(() => {
    alert('Link copied to clipboard: ' + inputEl.value);
  });
}

function shareBookingViaWhatsApp() {
  const inputEl = document.getElementById('shareBookingUrlInput');
  const branchSelect = document.getElementById('shareBookingBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const sched = getPharmacistSchedule(code);
  const info = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['KS01'];
  const bookingUrl = inputEl ? inputEl.value : '';

  const msg = `Halo! Anda boleh tempah slot pemeriksaan kesihatan atau rundingan ahli farmasi di PMG Pharmacy (${sched.branchName || info.name}) di pautan berikut:\n\n${bookingUrl}\n\nWaktu Perundingan: ${info.open} - ${info.close}.\nJumpa anda nanti!`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── CUSTOMER SELF-SERVICE BOOKING VIEW (?book=1) ────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
let currentCustomerBooking = null;

function initCustomerBooking(defaultBranchCode = 'KS01') {
  const urlParams = new URLSearchParams(window.location.search);
  const branchParam = urlParams.get('branch') || defaultBranchCode;

  const select = document.getElementById('custBranchSelect');
  if (select) {
    select.value = BRANCH_SCHEDULES[branchParam] ? branchParam : 'KS01';
  }

  // Pre-fill Name, Phone, IC, Service, Notes if passed via query params from WhatsApp link
  const nameParam = urlParams.get('name');
  if (nameParam) {
    const nameInput = document.getElementById('custBookName');
    if (nameInput) nameInput.value = nameParam;
  }

  const phoneParam = urlParams.get('phone');
  if (phoneParam) {
    const phoneInput = document.getElementById('custBookPhone');
    if (phoneInput) phoneInput.value = phoneParam;
  }

  const icParam = urlParams.get('ic');
  if (icParam) {
    const icInput = document.getElementById('custBookIc');
    if (icInput) icInput.value = icParam;
  }

  const serviceParam = urlParams.get('service');
  if (serviceParam) {
    const radio = document.querySelector(`input[name="custService"][value="${serviceParam}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  const notesParam = urlParams.get('notes');
  if (notesParam) {
    const notesInput = document.getElementById('custBookNotes');
    if (notesInput) notesInput.value = notesParam;
  }

  const dateInput = document.getElementById('custBookDate');
  if (dateInput) {
    const today = new Date();
    const minStr = today.toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 60);
    const maxStr = maxDate.toISOString().split('T')[0];

    dateInput.min = minStr;
    dateInput.max = maxStr;
    if (!dateInput.value) {
      dateInput.value = minStr;
    }
  }

  updateCustBookHours();
}

function updateCustBookHours() {
  const branchSelect = document.getElementById('custBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const dateInput = document.getElementById('custBookDate');
  const dateStr = dateInput ? dateInput.value : '';

  const schedForDate = getPharmacistScheduleForDate(code, dateStr);

  const titleEl = document.getElementById('custBranchHoursTitle');
  const descEl  = document.getElementById('custBranchHoursDesc');
  const bannerEl = document.getElementById('custDateStatusBanner');
  const timeSelect = document.getElementById('custBookTime');
  const submitBtn = document.getElementById('custBookSubmitBtn');
  const submitText = document.getElementById('custBookSubmitText');

  if (titleEl) titleEl.textContent = `${schedForDate.branchName} Pharmacist Hours`;

  if (descEl) {
    if (schedForDate.isClosed) {
      descEl.innerHTML = `<span class="text-rose-600 font-bold">⚠️ Pharmacist is closed / off on this date</span><br>Reason: <b>${escHtml(schedForDate.reason || 'Rest Day')}</b>`;
    } else {
      descEl.innerHTML = `Operating Hours: <b>${schedForDate.open} – ${schedForDate.close}</b>${schedForDate.isOverride ? ' <span class="text-xs text-indigo-600 font-bold">(Special Shift)</span>' : ''}<br>Duty Pharmacist: <b>${escHtml(schedForDate.pharmacist)}</b>`;
    }
  }

  if (schedForDate.isClosed) {
    // Banner warning
    if (bannerEl) {
      bannerEl.className = 'rounded-xl p-3 text-xs font-semibold flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800';
      bannerEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-600 text-sm"></i>
        <span><b>Branch Pharmacist is OFF / Closed on ${dateStr}</b> (${escHtml(schedForDate.reason || 'Rest Day / Public Holiday')}). Please choose another date.</span>`;
      bannerEl.classList.remove('hidden');
    }

    if (timeSelect) {
      timeSelect.innerHTML = `<option value="">No consultation slots available (Closed)</option>`;
      timeSelect.disabled = true;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    if (submitText) {
      submitText.textContent = `Branch Closed on Selected Date`;
    }
    return;
  }

  // Date is open!
  if (bannerEl) {
    if (schedForDate.isOverride) {
      bannerEl.className = 'rounded-xl p-3 text-xs font-semibold flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800';
      bannerEl.innerHTML = `<i class="fa-solid fa-circle-info text-indigo-600 text-sm"></i>
        <span><b>Special Hours for ${dateStr}:</b> Open ${schedForDate.open} – ${schedForDate.close} (${escHtml(schedForDate.reason || 'Special Shift')}) · Duty Pharmacist: <b>${escHtml(schedForDate.pharmacist)}</b></span>`;
      bannerEl.classList.remove('hidden');
    } else {
      bannerEl.classList.add('hidden');
    }
  }

  if (submitBtn) {
    submitBtn.disabled = false;
  }
  if (submitText) {
    submitText.textContent = `Confirm & Book Appointment`;
  }

  if (!timeSelect) return;
  timeSelect.disabled = false;

  const [openH, openM] = schedForDate.open.split(':').map(Number);
  const [closeH, closeM] = schedForDate.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let options = '';
  for (let m = openMinutes; m <= closeMinutes - 30; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const timeVal = `${hh}:${mm}`;

    const hourNum = Math.floor(m / 60);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    const label = `${displayHour}:${mm} ${ampm}`;

    options += `<option value="${timeVal}">${label} (${timeVal})</option>`;
  }

  if (!options) {
    options = `<option value="">No slots available within hours</option>`;
  }

  timeSelect.innerHTML = options;
}

function handleCustomerBookingSubmit(e) {
  e.preventDefault();

  const branchCode = document.getElementById('custBranchSelect').value;
  const date = document.getElementById('custBookDate').value;
  const time = document.getElementById('custBookTime').value;
  const schedForDate = getPharmacistScheduleForDate(branchCode, date);

  if (schedForDate.isClosed) {
    alert(`Sorry, the pharmacy is closed for consultation on ${date} (${schedForDate.reason || 'Rest Day / Public Holiday'}). Please select another date.`);
    return;
  }

  const preferredPharmEl = document.getElementById('custPharmacistSelect');
  const preferredPharm = preferredPharmEl && preferredPharmEl.value ? preferredPharmEl.value : (schedForDate.pharmacist || schedForDate.branchName);

  const branchInfo = {
    name: schedForDate.branchName,
    pharmacist: preferredPharm
  };

  const serviceEl = document.querySelector('input[name="custService"]:checked');
  const service = serviceEl ? serviceEl.value : 'Comprehensive Health Screening';

  const name = document.getElementById('custBookName').value.trim();
  const phone = document.getElementById('custBookPhone').value.trim();
  const ic = document.getElementById('custBookIc').value.trim();
  const notes = document.getElementById('custBookNotes').value.trim();

  if (!name || !phone || !date || !time) {
    alert('Please fill in your name, phone number, date, and preferred time.');
    return;
  }

  const bookingRef = 'PMG-BK-' + Math.floor(100000 + Math.random() * 900000);

  const bookingData = {
    id: bookingRef,
    ref: bookingRef,
    source: 'Customer Self-Service Portal',
    branchCode,
    branchName: branchInfo.name,
    pharmacist: branchInfo.pharmacist,
    service,
    purpose: service,
    date,
    time,
    status: 'Scheduled',
    patientName: name,
    patientPhone: phone,
    patientIc: ic,
    notes: notes || 'Booked via Online Customer Portal',
    createdAt: new Date().toISOString()
  };

  currentCustomerBooking = bookingData;

  // Save to customer bookings list in localStorage
  let custBookings = [];
  try {
    custBookings = JSON.parse(localStorage.getItem('pmg_customer_bookings') || '[]');
  } catch (_) { custBookings = []; }
  custBookings.unshift(bookingData);
  localStorage.setItem('pmg_customer_bookings', JSON.stringify(custBookings));

  // Attach to patientsData (match phone or ic, else create entry)
  const cleanPhone = phone.replace(/\D/g, '');
  let patient = patientsData.find(p => (p.phone && p.phone.replace(/\D/g, '') === cleanPhone) || (ic && p.ic === ic));
  if (patient) {
    if (!patient.appointments) patient.appointments = [];
    patient.appointments.unshift({
      id: bookingRef,
      date,
      time,
      service,
      purpose: service,
      pharmacist: branchInfo.pharmacist,
      notes: `[Customer Online Booking] ${notes}`,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    });
    savePatientsData();
  } else {
    const newPatient = {
      id: 'P-' + Date.now(),
      name: name,
      ic: ic || '',
      phone: phone,
      gender: 'Other',
      dob: '',
      age: '',
      branch: branchInfo.name.split(' ')[0] || 'Kota Sentosa',
      allergies: 'None recorded',
      chronicConditions: ['Pending Consultation'],
      medications: [],
      encounters: [],
      documents: [],
      appointments: [
        {
          id: bookingRef,
          date,
          time,
          service,
          purpose: service,
          pharmacist: branchInfo.pharmacist,
          notes: `[Customer Online Booking] ${notes}`,
          status: 'Scheduled',
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };
    patientsData.unshift(newPatient);
    savePatientsData();
  }

  // Render Confirmation Screen
  document.getElementById('custConfirmRef').textContent = bookingRef;
  document.getElementById('custConfirmName').textContent = name;
  document.getElementById('custConfirmBranch').textContent = branchInfo.name;
  document.getElementById('custConfirmDateTime').textContent = `${date} at ${time}`;
  document.getElementById('custConfirmService').textContent = service;
  document.getElementById('custConfirmPharmacist').textContent = branchInfo.pharmacist;

  document.getElementById('customerBookingFormCard').classList.add('hidden');
  document.getElementById('customerBookingSuccessCard').classList.remove('hidden');
}

function sendCustomerBookingWaConfirm() {
  if (!currentCustomerBooking) return;
  const b = currentCustomerBooking;
  const msg = `*PMG Pharmacy Appointment Confirmation*\nRef: ${b.ref}\nName: ${b.patientName}\nBranch: ${b.branchName}\nDate: ${b.date}\nTime: ${b.time}\nService: ${b.service}\nPharmacist: ${b.pharmacist}\n\nThank you for choosing PMG Pharmacy. Please arrive 5-10 minutes early. For enquiries, contact our branch.`;

  const cleanPhone = b.patientPhone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('0') ? '60' + cleanPhone.slice(1) : cleanPhone;
  const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

function resetCustomerBookingForm() {
  document.getElementById('customerBookingForm').reset();
  document.getElementById('customerBookingSuccessCard').classList.add('hidden');
  document.getElementById('customerBookingFormCard').classList.remove('hidden');
  initCustomerBooking('KS01');
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── PHARMACIST OPERATING HOURS & SHIFT MODAL CONTROLLER ─────────────────────
// ═════════════════════════════════════════════════════════════════════════════
let activeHoursSubTab = 'weekly';

function openManageHoursModal() {
  const modal = document.getElementById('manageHoursModal');
  if (!modal) return;

  const session = typeof getSession === 'function' ? getSession() : null;
  const userBranch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'KS01';

  const branchSelect = document.getElementById('hoursBranchSelect');
  if (branchSelect) {
    for (let opt of branchSelect.options) {
      if (opt.value === userBranch || opt.text.includes(userBranch)) {
        branchSelect.value = opt.value;
        break;
      }
    }
  }

  // Pre-fill override date input with today
  const overrideDateInput = document.getElementById('overrideDateInput');
  if (overrideDateInput && !overrideDateInput.value) {
    overrideDateInput.value = new Date().toISOString().split('T')[0];
  }

  switchHoursSubTab('weekly');
  renderManageHoursModal();
  modal.classList.remove('hidden');
}

function closeManageHoursModal() {
  const modal = document.getElementById('manageHoursModal');
  if (modal) modal.classList.add('hidden');
  updateShareBookingUrl();
  updateCustBookHours();
}

function switchHoursSubTab(tabName) {
  activeHoursSubTab = tabName;
  const tabs = ['weekly', 'overrides', 'sync'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const pane = document.getElementById(`hoursSubTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (t === tabName) {
      if (btn) {
        btn.className = 'px-3 py-1.5 rounded-lg bg-white shadow-sm text-indigo-700 font-bold';
      }
      if (pane) pane.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = 'px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-bold';
      }
      if (pane) pane.classList.add('hidden');
    }
  });

  renderManageHoursModal();
}

function renderManageHoursModal() {
  const branchSelect = document.getElementById('hoursBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const sched = getPharmacistSchedule(code);

  if (activeHoursSubTab === 'weekly') {
    renderWeeklyTemplateTbody(sched);
  } else if (activeHoursSubTab === 'overrides') {
    renderDateOverridesTbody(sched);
  } else if (activeHoursSubTab === 'sync') {
    renderRosterSyncTab(sched);
  }
}

function renderWeeklyTemplateTbody(sched) {
  const tbody = document.getElementById('weeklyTemplateTbody');
  if (!tbody) return;

  const dayOrder = [
    { num: '1', label: 'Monday' },
    { num: '2', label: 'Tuesday' },
    { num: '3', label: 'Wednesday' },
    { num: '4', label: 'Thursday' },
    { num: '5', label: 'Friday' },
    { num: '6', label: 'Saturday' },
    { num: '0', label: 'Sunday' }
  ];

  let html = '';
  dayOrder.forEach(({ num, label }) => {
    const item = (sched.weeklyTemplate && sched.weeklyTemplate[num]) || {
      dayName: label,
      isOpen: true,
      open: '07:30',
      close: '21:30',
      pharmacist: sched.defaultPharmacist || 'Duty Pharmacist'
    };

    html += `
      <tr class="hover:bg-gray-50/80 transition" data-day="${num}">
        <td class="p-2.5 font-bold text-gray-800">${label}</td>
        <td class="p-2.5 text-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="tmplOpen_${num}" ${item.isOpen ? 'checked' : ''} onchange="toggleWeeklyRowInputs('${num}')" class="sr-only peer">
            <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </td>
        <td class="p-2.5">
          <input type="time" id="tmplTimeOpen_${num}" value="${item.open || '07:30'}" ${item.isOpen ? '' : 'disabled'}
            class="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40">
        </td>
        <td class="p-2.5">
          <input type="time" id="tmplTimeClose_${num}" value="${item.close || '21:30'}" ${item.isOpen ? '' : 'disabled'}
            class="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40">
        </td>
        <td class="p-2.5">
          <input type="text" id="tmplPharm_${num}" value="${escHtml(item.pharmacist || '')}" placeholder="Duty Pharmacist" ${item.isOpen ? '' : 'disabled'}
            class="border border-gray-300 rounded px-2 py-1 text-xs w-full outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40">
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function toggleWeeklyRowInputs(dayNum) {
  const chk = document.getElementById(`tmplOpen_${dayNum}`);
  const isOpen = chk ? chk.checked : true;
  const o = document.getElementById(`tmplTimeOpen_${dayNum}`);
  const c = document.getElementById(`tmplTimeClose_${dayNum}`);
  const p = document.getElementById(`tmplPharm_${dayNum}`);
  if (o) o.disabled = !isOpen;
  if (c) c.disabled = !isOpen;
  if (p) p.disabled = !isOpen;
}

function saveWeeklyTemplate(e) {
  if (e) e.preventDefault();
  const branchSelect = document.getElementById('hoursBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const sched = getPharmacistSchedule(code);

  const dayNums = ['1', '2', '3', '4', '5', '6', '0'];
  dayNums.forEach(num => {
    const chk = document.getElementById(`tmplOpen_${num}`);
    const isOpen = chk ? chk.checked : true;
    const openVal = document.getElementById(`tmplTimeOpen_${num}`)?.value || '07:30';
    const closeVal = document.getElementById(`tmplTimeClose_${num}`)?.value || '21:30';
    const pharmVal = document.getElementById(`tmplPharm_${num}`)?.value?.trim() || sched.defaultPharmacist;

    sched.weeklyTemplate[num] = {
      dayName: sched.weeklyTemplate[num]?.dayName || num,
      isOpen,
      open: openVal,
      close: closeVal,
      pharmacist: pharmVal
    };
  });

  savePharmacistSchedule(code, sched);
  alert(`Weekly template for ${code} saved successfully!`);
}

function toggleOverrideTimeInputs() {
  const sel = document.getElementById('overrideStatusSelect');
  const row = document.getElementById('overrideTimeRow');
  if (sel && row) {
    if (sel.value === 'custom') {
      row.classList.remove('hidden');
    } else {
      row.classList.add('hidden');
    }
  }
}

function saveDateOverride(e) {
  if (e) e.preventDefault();
  const branchSelect = document.getElementById('hoursBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const sched = getPharmacistSchedule(code);

  const dateInput = document.getElementById('overrideDateInput');
  const dateStr = dateInput ? dateInput.value : '';
  if (!dateStr) {
    alert('Please choose a date.');
    return;
  }

  const statusSel = document.getElementById('overrideStatusSelect')?.value || 'closed';
  const reason = document.getElementById('overrideReasonInput')?.value?.trim() || '';

  if (statusSel === 'closed') {
    sched.dateOverrides[dateStr] = {
      isClosed: true,
      open: '',
      close: '',
      pharmacist: '',
      reason: reason || 'Rest Day / Public Holiday'
    };
  } else {
    const openVal = document.getElementById('overrideOpenInput')?.value || '07:30';
    const closeVal = document.getElementById('overrideCloseInput')?.value || '16:30';
    const pharmVal = document.getElementById('overridePharmacistInput')?.value?.trim() || sched.defaultPharmacist;

    sched.dateOverrides[dateStr] = {
      isClosed: false,
      open: openVal,
      close: closeVal,
      pharmacist: pharmVal,
      reason: reason || 'Custom Working Hours'
    };
  }

  savePharmacistSchedule(code, sched);
  renderDateOverridesTbody(sched);
  const form = document.getElementById('dateOverrideForm');
  if (form) form.reset();
  toggleOverrideTimeInputs();
}

function deleteDateOverride(dateStr) {
  const branchSelect = document.getElementById('hoursBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const sched = getPharmacistSchedule(code);

  if (sched.dateOverrides && sched.dateOverrides[dateStr]) {
    delete sched.dateOverrides[dateStr];
    savePharmacistSchedule(code, sched);
    renderDateOverridesTbody(sched);
  }
}

function renderDateOverridesTbody(sched) {
  const tbody = document.getElementById('dateOverridesTbody');
  const badge = document.getElementById('overrideCountBadge');
  if (!tbody) return;

  const overrides = sched.dateOverrides || {};
  const dates = Object.keys(overrides).sort();
  if (badge) badge.textContent = dates.length;

  if (dates.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-gray-400 text-xs italic">
          No date overrides recorded. Pharmacist hours follow the Fixed Weekly Template.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  dates.forEach(d => {
    const item = overrides[d];
    const isClosed = item.isClosed;
    const statusPill = isClosed
      ? `<span class="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-ban"></i> Closed / Rest Day</span>`
      : `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${item.open} – ${item.close}</span>`;

    html += `
      <tr class="hover:bg-gray-50/80 transition text-xs">
        <td class="p-2.5 font-bold font-mono text-gray-900">${d}</td>
        <td class="p-2.5">${statusPill}</td>
        <td class="p-2.5 text-gray-700">${escHtml(item.pharmacist || '—')}</td>
        <td class="p-2.5 text-gray-600">${escHtml(item.reason || '—')}</td>
        <td class="p-2.5 text-center">
          <button type="button" onclick="deleteDateOverride('${d}')" class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition" title="Delete this override">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function renderRosterSyncTab(sched) {
  const sel = document.getElementById('rosterSyncPharmacistSelect');
  const preview = document.getElementById('rosterSyncPreview');
  if (!sel || !preview) return;

  const records = typeof rosterFlatRecords !== 'undefined' ? rosterFlatRecords : [];
  if (!records || records.length === 0) {
    sel.innerHTML = `<option value="">(No Roster Loaded in Module 1)</option>`;
    sel.disabled = true;
    preview.innerHTML = `
      <p class="text-amber-800 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> No roster data loaded.</p>
      <p class="text-gray-500 text-[11px] mt-1">Please go to <b>Module 1 (Roster Matrix)</b> and upload your monthly schedule file (CSV or Excel) first.</p>
    `;
    return;
  }

  const staffSet = new Map();
  records.forEach(r => {
    if (r.nickname && !staffSet.has(r.nickname)) {
      staffSet.set(r.nickname, r.empName || r.nickname);
    }
  });

  let optHtml = '';
  const priorityNames = ['WILLIAM', 'TING', 'FIONA', 'LOUNA'];
  staffSet.forEach((empName, nick) => {
    const isPri = priorityNames.includes(nick.toUpperCase());
    optHtml += `<option value="${escHtml(nick)}" ${isPri ? 'selected' : ''}>${escHtml(nick)} (${escHtml(empName)})</option>`;
  });

  sel.innerHTML = optHtml;
  sel.disabled = false;

  const datesSet = new Set(records.map(r => r.workDate));
  preview.innerHTML = `
    <p class="text-emerald-800 font-bold"><i class="fa-solid fa-check-circle"></i> Ready to Sync from Loaded Roster</p>
    <p class="text-[11px] text-gray-600 mt-1">Detected <b>${records.length} shifts</b> covering <b>${datesSet.size} days</b> in loaded roster.</p>
  `;
}

function syncPharmacistHoursFromRoster() {
  const branchSelect = document.getElementById('hoursBranchSelect');
  const code = branchSelect ? branchSelect.value : 'KS01';
  const sched = getPharmacistSchedule(code);

  const sel = document.getElementById('rosterSyncPharmacistSelect');
  const targetStaff = sel ? sel.value : '';
  if (!targetStaff) {
    alert('Please select a staff member from the roster to sync.');
    return;
  }

  const records = typeof rosterFlatRecords !== 'undefined' ? rosterFlatRecords : [];
  const staffRecords = records.filter(r => r.nickname && r.nickname.toUpperCase() === targetStaff.toUpperCase());

  if (staffRecords.length === 0) {
    alert(`No records found in loaded roster for ${targetStaff}.`);
    return;
  }

  let syncCount = 0;
  staffRecords.forEach(rec => {
    if (!rec.workDate) return;
    const isOff = !rec.shiftCode || ['OFF', 'RD', 'OD', 'WO'].includes(rec.shiftCode) || ['RD', 'OD', 'OFF', 'ANL', 'AL', 'SL', 'MC', 'PH'].includes(rec.leaveCode);

    if (isOff) {
      const leaveReason = rec.leaveCode || 'Rest Day';
      sched.dateOverrides[rec.workDate] = {
        isClosed: true,
        open: '',
        close: '',
        pharmacist: '',
        reason: leaveReason === 'RD' ? 'Rest Day' : leaveReason
      };
      syncCount++;
    } else {
      let openTime = '07:30';
      let closeTime = '21:30';

      const m = rec.shiftCode.match(/(\d{4})-(\d{4})/);
      if (m) {
        openTime = `${m[1].slice(0,2)}:${m[1].slice(2,4)}`;
        closeTime = `${m[2].slice(0,2)}:${m[2].slice(2,4)}`;
      }

      sched.dateOverrides[rec.workDate] = {
        isClosed: false,
        open: openTime,
        close: closeTime,
        pharmacist: `Pharmacist ${rec.empName || rec.nickname}`,
        reason: `Roster Shift (${rec.shiftCode})`
      };
      syncCount++;
    }
  });

  savePharmacistSchedule(code, sched);
  alert(`Successfully synced ${syncCount} dates from Roster for ${targetStaff}! Check the Date Overrides tab.`);
  switchHoursSubTab('overrides');
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── AI CLINICAL CASE REVIEW & HOUSE-BRAND OPTIMIZER (GEMINI 3.5) ─────────────
// ═════════════════════════════════════════════════════════════════════════════
let currentAiReviewResult = null;

async function runAiClinicalReview() {
  const apiKey = (localStorage.getItem('pmg_gemini_key') || '').trim();
  if (!apiKey) {
    alert('Gemini API Key is required for AI Clinical Case Review.\n\nPlease enter your API Key in the 5S Walkthrough Auditor tab, or load the setup link (index.html?setkey=YOUR_KEY).');
    return;
  }

  const patientSelect = document.getElementById('encounterPatientSelect');
  const patientId = patientSelect ? patientSelect.value : null;
  const patient = patientsData.find(p => p.id === patientId) || {};

  const cc = document.getElementById('encChiefComplaint')?.value.trim() || 'Routine health review';
  const hpi = document.getElementById('encHpi')?.value.trim() || 'None reported';

  const vitals = {
    bpSys: document.getElementById('encBpSys')?.value || '',
    bpDia: document.getElementById('encBpDia')?.value || '',
    pulse: document.getElementById('encPulse')?.value || '',
    spo2: document.getElementById('encSpo2')?.value || '',
    weight: document.getElementById('encWeight')?.value || '',
    height: document.getElementById('encHeight')?.value || '',
    bmi: document.getElementById('encBmi')?.value || '',
    tc: document.getElementById('encTc')?.value || '',
    tg: document.getElementById('encTg')?.value || '',
    hdl: document.getElementById('encHdl')?.value || '',
    ldl: document.getElementById('encLdl')?.value || '',
    ai: document.getElementById('encAi')?.value || '',
    rchd: document.getElementById('encRchd')?.value || '',
    glucose: document.getElementById('encGlucose')?.value || '',
    glucoseType: document.getElementById('encGlucoseType')?.value || 'Fasting',
    hba1c: document.getElementById('encHba1c')?.value || '',
    ua: document.getElementById('encUa')?.value || '',
    creatinine: document.getElementById('encCreatinine')?.value || '',
    urea: document.getElementById('encUrea')?.value || '',
    egfr: document.getElementById('encEgfr')?.value || '',
    ast: document.getElementById('encAst')?.value || '',
    alt: document.getElementById('encAlt')?.value || '',
    alb: document.getElementById('encAlb')?.value || '',
    vitD: document.getElementById('encVitD')?.value || '',
    ferritin: document.getElementById('encFerritin')?.value || '',
    rossmaxAct: document.getElementById('encRossmaxAct')?.value || '',
    customPoctNotes: document.getElementById('encOtherTestsNotes')?.value || ''
  };

  const planMeds = document.getElementById('encPlanMeds')?.value.trim() || '';
  const planSupps = document.getElementById('encPlanSupps')?.value.trim() || '';
  const chronicMeds = (patient.medications || []).map(m => `${m.name} ${m.dose || ''} (${m.freq || ''})`).join(', ');
  const fullMedsList = [chronicMeds, planMeds].filter(Boolean).join('; ');

  const loadingEl = document.getElementById('aiClinicalLoading');
  const loadingText = document.getElementById('aiClinicalLoadingText');
  const resultPanel = document.getElementById('aiClinicalResultPanel');
  const runBtn = document.getElementById('btnAiClinicalReview');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (loadingText) loadingText.textContent = `Analysing case with Gemini 3.5 Flash…`;
  if (resultPanel) resultPanel.classList.add('hidden');
  if (runBtn) runBtn.disabled = true;

  const prompt = `You are an expert Clinical Pharmacist and Nutritional Specialist for PMG Pharmacy in Malaysia.
Evaluate this patient consultation, POCT laboratory profile, and medication regimen.

PATIENT PROFILE:
Name: ${patient.name || 'Anonymous'}
Age: ${patient.age || 'N/A'}, Gender: ${patient.gender || 'N/A'}
Known Allergies: ${patient.allergies || 'None'}
Chronic Conditions: ${(patient.chronicConditions || []).join(', ') || 'None noted'}
Current Chronic Medications: ${chronicMeds || 'None listed'}

CURRENT CONSULTATION (SOAP):
Chief Complaint: ${cc}
History of Present Illness: ${hpi}

OBJECTIVE VITALS & POCT LAB READINGS:
BP: ${vitals.bpSys && vitals.bpDia ? vitals.bpSys + '/' + vitals.bpDia + ' mmHg' : 'Not taken'}
Pulse: ${vitals.pulse ? vitals.pulse + ' bpm' : 'N/A'}, SpO2: ${vitals.spo2 ? vitals.spo2 + '%' : 'N/A'}
BMI: ${vitals.bmi || 'N/A'} (Weight: ${vitals.weight || 'N/A'} kg, Height: ${vitals.height || 'N/A'} cm)
Blood Glucose: ${vitals.glucose ? vitals.glucose + ' mmol/L (' + vitals.glucoseType + ')' : 'N/A'}, HbA1c: ${vitals.hba1c ? vitals.hba1c + '%' : 'N/A'}
Lipid Panel: TC: ${vitals.tc || 'N/A'} mmol/L, TG: ${vitals.tg || 'N/A'}, HDL: ${vitals.hdl || 'N/A'}, LDL: ${vitals.ldl || 'N/A'}, AI: ${vitals.ai || 'N/A'}, R-CHD: ${vitals.rchd || 'N/A'}
Kidney Panel: Uric Acid: ${vitals.ua || 'N/A'} umol/L, Creatinine: ${vitals.creatinine || 'N/A'} umol/L, Urea: ${vitals.urea || 'N/A'} mmol/L, eGFR: ${vitals.egfr || 'N/A'}
Liver Panel: AST: ${vitals.ast || 'N/A'} U/L, ALT: ${vitals.alt || 'N/A'} U/L, Albumin: ${vitals.alb || 'N/A'} g/L
Specialty Tests: Vit D Home Kit: ${vitals.vitD || 'N/A'}, Ferritin Home Kit: ${vitals.ferritin || 'N/A'}, Rossmax ACT: ${vitals.rossmaxAct || 'N/A'}
Other POCT Notes: ${vitals.customPoctNotes || 'None'}

PRESCRIBED / PROPOSED MEDICATIONS:
${fullMedsList || 'No prescription medications currently recorded'}

CURRENT / PROPOSED SUPPLEMENTS:
${planSupps || 'None recorded'}

CRITICAL INSTRUCTIONS:
1. DRUG-DRUG & DRUG-SUPPLEMENT INTERACTIONS:
   - Identify any interactions between current/prescribed medications and proposed supplements.
   - Severity: "none", "moderate", or "high". Explain mechanisms clearly.
2. PMG HOUSE BRAND COMPANION SUPPLEMENT RECOMMENDATIONS:
   - Recommend 2-4 companion supplements/nutraceuticals to counter drug-induced depletions (e.g. statin-induced CoQ10 depletion, metformin-induced B12 depletion) or optimize cardiovascular, metabolic, joint, or liver health based on their POCT readings.
   - CRITICAL: Prioritize PMG House Brands:
     * "JH Nutrition" (Alpha Gold, Systoright, Flexson, Livason, Nacous NAC, Eclipx, Immucol, Citazinc)
     * "V-Infinity" (Neuright B-Complex+ALA, Fiono Omega-3 1200mg, Neoflex, Tygeres, Tyreps, Vtrox)
     * "Nutribridge" (Glycoway, Lipicholin, Neo-D3, Opticlear, Q-Folix, Vitaglo, Zencool, Flexsure Gold)
     * "Livemore" (Co-Q10 Plus, Gasmint, Ginoba, Methylcobalamin, Neo-D3, Neomega)
     * Other PMG brands: Biowell, Lucentia, Dermisk, Axon
3. CHRONOTHERAPY (BEST TIMING OF INTAKE):
   - Categorize all medications and recommended supplements into:
     * Morning (Breakfast)
     * Afternoon (Lunch)
     * Evening (Dinner)
     * Bedtime (Night)
   - State specific rationale (e.g., morning BP surge, fat solubility with food, statin cholesterol synthesis peak overnight).
4. CLINICAL ASSESSMENT & PRE-DIAGNOSTIC:
   - Concise pharmacist impression of current disease control and risk stratification.
5. COUNSELLING & LIFESTYLE:
   - 3 to 5 targeted, practical lifestyle and diet counselling pearls.

RESPONSE MUST BE STRICTLY VALID JSON matching this structure:
{
  "interactionSummary": "none" | "moderate" | "high",
  "interactionDetails": "string",
  "houseBrands": [
    {
      "brand": "Livemore" | "JH Nutrition" | "V-Infinity" | "Nutribridge" | "PMG",
      "product": "Product Name",
      "indication": "Clinical rationale",
      "dosage": "e.g. 1 capsule OD after breakfast"
    }
  ],
  "chronotherapy": {
    "morning": [ { "item": "Medication/Supplement", "note": "Reason" } ],
    "afternoon": [ { "item": "Medication/Supplement", "note": "Reason" } ],
    "evening": [ { "item": "Medication/Supplement", "note": "Reason" } ],
    "bedtime": [ { "item": "Medication/Supplement", "note": "Reason" } ]
  },
  "assessmentSummary": "Concise summary",
  "counsellingPoints": ["Point 1", "Point 2", "Point 3"]
}`;

  let parsed = null;
  const primaryModel = typeof AUDIT_PRIMARY_MODEL !== 'undefined' ? AUDIT_PRIMARY_MODEL : 'gemini-3.5-flash';
  const secondaryModel = typeof AUDIT_SECONDARY_MODEL !== 'undefined' ? AUDIT_SECONDARY_MODEL : 'gemini-3.5-flash-lite';
  const models = [primaryModel, secondaryModel];

  for (let m of models) {
    try {
      if (loadingText) loadingText.textContent = `Analysing case with ${m}…`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.warn(`[PMG AI Review] ${m} returned ${resp.status}:`, errText);
        continue;
      }

      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) continue;

      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
      if (parsed) break;
    } catch (err) {
      console.warn(`[PMG AI Review] Error with model ${m}:`, err);
    }
  }

  if (loadingEl) loadingEl.classList.add('hidden');
  if (runBtn) runBtn.disabled = false;

  if (!parsed) {
    alert('AI Clinical Case Review failed. Please check your Gemini API key and network connection.');
    return;
  }

  currentAiReviewResult = parsed;
  renderAiClinicalReview(parsed);
}

function renderAiClinicalReview(res) {
  const panel = document.getElementById('aiClinicalResultPanel');
  if (!panel) return;

  // 1. Interaction Alert
  const alertEl = document.getElementById('aiInteractionsAlert');
  if (alertEl) {
    const summary = (res.interactionSummary || 'none').toLowerCase();
    if (summary === 'high') {
      alertEl.className = 'rounded-lg p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-800';
      alertEl.innerHTML = `
        <div class="flex items-center gap-1.5 font-bold mb-0.5">
          <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> HIGH DRUG INTERACTION / CONTRAINDICATION DETECTED
        </div>
        <p class="text-[11px] leading-relaxed">${res.interactionDetails || 'High risk interaction identified between prescribed regimen.'}</p>
      `;
    } else if (summary === 'moderate') {
      alertEl.className = 'rounded-lg p-2.5 text-xs bg-amber-50 border border-amber-200 text-amber-800';
      alertEl.innerHTML = `
        <div class="flex items-center gap-1.5 font-bold mb-0.5">
          <i class="fa-solid fa-circle-exclamation text-amber-600"></i> MODERATE INTERACTION / MONITORING REQUIRED
        </div>
        <p class="text-[11px] leading-relaxed">${res.interactionDetails || 'Moderate interaction present. Monitor patient closely.'}</p>
      `;
    } else {
      alertEl.className = 'rounded-lg p-2.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800';
      alertEl.innerHTML = `
        <div class="flex items-center gap-1.5 font-bold mb-0.5">
          <i class="fa-solid fa-circle-check text-emerald-600"></i> NO SIGNIFICANT INTERACTIONS DETECTED
        </div>
        <p class="text-[11px] leading-relaxed">${res.interactionDetails || 'The evaluated medication and supplement regimen is safe and free of high-risk contraindications.'}</p>
      `;
    }
  }

  // 2. House Brand Supplements
  const houseBrandsEl = document.getElementById('aiHouseBrandsList');
  if (houseBrandsEl) {
    if (res.houseBrands && res.houseBrands.length) {
      houseBrandsEl.innerHTML = res.houseBrands.map(item => {
        let badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
        const brandUpper = (item.brand || '').toUpperCase();
        if (brandUpper.includes('JH')) badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
        else if (brandUpper.includes('INFINITY')) badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
        else if (brandUpper.includes('NUTRI')) badgeColor = 'bg-teal-100 text-teal-800 border-teal-200';
        else if (brandUpper.includes('LIVE')) badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';

        return `
          <div class="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-bold text-gray-900">${item.product}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}">${item.brand}</span>
            </div>
            <p class="text-[11px] text-gray-600 mb-1">${item.indication}</p>
            <p class="text-[11px] font-semibold text-purple-900"><i class="fa-solid fa-prescription mr-1 text-purple-600"></i>${item.dosage}</p>
          </div>
        `;
      }).join('');
    } else {
      houseBrandsEl.innerHTML = '<p class="text-[11px] text-gray-500 italic">No specific companion supplements required for this case.</p>';
    }
  }

  // 3. Chronotherapy Timing Grid
  const timingGridEl = document.getElementById('aiTimingGrid');
  if (timingGridEl) {
    const slots = [
      { key: 'morning',   label: 'Morning (Breakfast)', icon: 'fa-sun text-amber-500',   bg: 'bg-amber-50/50' },
      { key: 'afternoon', label: 'Afternoon (Lunch)',   icon: 'fa-sun text-orange-500',  bg: 'bg-orange-50/50' },
      { key: 'evening',   label: 'Evening (Dinner)',    icon: 'fa-cloud-sun text-indigo-500', bg: 'bg-indigo-50/50' },
      { key: 'bedtime',   label: 'Bedtime (Night)',     icon: 'fa-moon text-blue-700',   bg: 'bg-blue-50/50' }
    ];

    const chrono = res.chronotherapy || {};
    timingGridEl.innerHTML = slots.map(s => {
      const items = chrono[s.key] || [];
      return `
        <div class="border border-gray-200 rounded-lg p-2.5 ${s.bg}">
          <div class="font-bold text-[11px] text-gray-800 flex items-center gap-1.5 mb-1.5 pb-1 border-b border-gray-200">
            <i class="fa-solid ${s.icon}"></i>
            <span>${s.label}</span>
          </div>
          ${items.length ? items.map(it => `
            <div class="mb-1.5 last:mb-0">
              <span class="font-bold text-[11px] text-gray-900 block">${it.item}</span>
              <span class="text-[10px] text-gray-500 block leading-tight">${it.note}</span>
            </div>
          `).join('') : '<span class="text-[10px] text-gray-400 italic">None scheduled</span>'}
        </div>
      `;
    }).join('');
  }

  // 4. Assessment & Counselling
  const assessEl = document.getElementById('aiAssessmentText');
  if (assessEl) {
    assessEl.textContent = res.assessmentSummary || 'Patient stable.';
  }

  const counselEl = document.getElementById('aiCounsellingList');
  if (counselEl) {
    const points = res.counsellingPoints || [];
    if (points.length) {
      counselEl.innerHTML = points.map(p => `<li>${p}</li>`).join('');
    } else {
      counselEl.innerHTML = '<li>Regular lifestyle maintenance and medication adherence.</li>';
    }
  }

  panel.classList.remove('hidden');
}

function applyAiSupplements() {
  if (!currentAiReviewResult || !currentAiReviewResult.houseBrands || !currentAiReviewResult.houseBrands.length) {
    alert('No AI recommended supplements to apply.');
    return;
  }
  const suppInput = document.getElementById('encPlanSupps');
  if (!suppInput) return;

  const newSupps = currentAiReviewResult.houseBrands.map(b => `${b.product} (${b.dosage})`).join(', ');
  const existing = suppInput.value.trim();
  if (existing) {
    suppInput.value = `${existing}; ${newSupps}`;
  } else {
    suppInput.value = newSupps;
  }
  alert('✅ House Brand Supplements added to Plan of Action!');
}

function applyAiSchedule() {
  if (!currentAiReviewResult || !currentAiReviewResult.chronotherapy) {
    alert('No chronotherapy schedule available to apply.');
    return;
  }
  const counselInput = document.getElementById('encPlanCounselling');
  if (!counselInput) return;

  const c = currentAiReviewResult.chronotherapy;
  let lines = ['[Chronotherapy Timing of Intake]'];
  if (c.morning && c.morning.length)   lines.push(`• Morning: ${c.morning.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);
  if (c.afternoon && c.afternoon.length) lines.push(`• Afternoon: ${c.afternoon.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);
  if (c.evening && c.evening.length)   lines.push(`• Evening: ${c.evening.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);
  if (c.bedtime && c.bedtime.length)   lines.push(`• Bedtime: ${c.bedtime.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);

  const scheduleText = lines.join('\n');
  const existing = counselInput.value.trim();
  if (existing) {
    counselInput.value = `${existing}\n\n${scheduleText}`;
  } else {
    counselInput.value = scheduleText;
  }
  alert('✅ Chronotherapy schedule added to Counselling Plan!');
}

function applyAiAssessment() {
  if (!currentAiReviewResult || !currentAiReviewResult.assessmentSummary) {
    alert('No AI assessment summary available.');
    return;
  }
  const preDiagInput = document.getElementById('encPreDiag');
  if (!preDiagInput) return;

  const existing = preDiagInput.value.trim();
  if (existing) {
    preDiagInput.value = `${existing}\n[AI Review]: ${currentAiReviewResult.assessmentSummary}`;
  } else {
    preDiagInput.value = currentAiReviewResult.assessmentSummary;
  }
  alert('✅ Clinical assessment applied to Pre-Diagnostic!');
}


