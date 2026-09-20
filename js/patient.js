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

  const todayList = [];
  const upcomingList = [];
  const overdueList = [];

  filteredPatients.forEach(p => {
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
          <button onclick="showNewAppointmentModal('${p.id}')"
            class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
            title="Book Return Appointment">
            <i class="fa-regular fa-calendar-plus"></i> Appt
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

  // Reset custom tests & files
  tempCustomTests = [];
  tempAttachedFiles = [];
  renderTempCustomTests();
  renderTempAttachedFiles();

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
    customTests: [...tempCustomTests],
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

        <!-- Custom Tests -->
        ${(enc.customTests && enc.customTests.length) ? `
          <div class="mt-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-100">
            <span class="font-bold text-gray-700">Other POCT:</span>
            ${enc.customTests.map(ct => `<span class="ml-2 font-medium">${ct.name}: <b>${ct.result} ${ct.unit}</b></span>`).join(', ')}
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

// ─── PEN DRIVE BACKUP & RESTORE ENGINE ───────────────────────────────────────
async function backupToPenDrive() {
  try {
    const session = getSession();
    const branch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'ALL';
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

    // 2. Package into bundle
    const backupBundle = {
      app: 'PMG_MANAGEMENT_HUB',
      version: '1.0',
      type: 'FULL_PENDRIVE_BACKUP',
      exportDate: new Date().toISOString(),
      branch: branch,
      patientCount: patientsData.length,
      docCount: documents.length,
      patients: patientsData,
      documents: documents
    };

    const jsonStr = JSON.stringify(backupBundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `PMG_PatientBackup_${branch}_${dateStr}.pmgbak`;

    // 3. Trigger download
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

    // 4. Update backup status
    localStorage.setItem('pmg_last_backup_date', new Date().toISOString());
    updateBackupStatusBadge();

    alert(`💾 Pen Drive Backup Created Successfully!\n\nFile: ${filename}\nPatients: ${patientsData.length}\nAttached Reports: ${documents.length}\n\nPlease save this file onto your branch USB Pen Drive.`);
  } catch (err) {
    console.error('Backup failed:', err);
    alert('Failed to generate backup: ' + err.message);
  }
}

async function handleRestoreBackupFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!confirm(`Are you sure you want to restore from "${file.name}"?\n\nThis will restore patient profiles, consultation records, and all attached lab blood reports.`)) {
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

      // Update backup status
      localStorage.setItem('pmg_last_backup_date', new Date().toISOString());
      updateBackupStatusBadge();
      renderPatientModule();

      alert(`✅ Restore Complete!\n\n• ${patientsData.length} patient records loaded.\n• ${restoredDocs} lab reports & documents restored into IndexedDB.`);
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

  const lastBackupStr = localStorage.getItem('pmg_last_backup_date');
  if (!lastBackupStr) {
    textEl.textContent = 'Backup: Not backed up yet';
    badgeEl.className = 'text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5';
    return;
  }

  const lastDate = new Date(lastBackupStr);
  const diffDays = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    textEl.textContent = 'USB Backup: Today (Safe)';
    badgeEl.className = 'text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5';
  } else if (diffDays < 7) {
    textEl.textContent = `USB Backup: ${Math.floor(diffDays)}d ago`;
    badgeEl.className = 'text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1.5';
  } else {
    textEl.textContent = `⚠️ Backup Due (${Math.floor(diffDays)}d ago)`;
    badgeEl.className = 'text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5';
  }
}

