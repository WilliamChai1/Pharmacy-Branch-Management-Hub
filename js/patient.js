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
    branch: 'Kota Sentosa',
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
    branch: 'Kota Sentosa',
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
    branch: 'Kota Sentosa',
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

  // Ensure all existing patients for Kota Sentosa are uniformly labeled 'Kota Sentosa'
  if (Array.isArray(patientsData)) {
    patientsData.forEach(p => {
      const bUpper = String(p.branch || '').toUpperCase().replace(/[\s\-_\(\)\[\]]/g, '');
      if (!p.branch || bUpper.includes('SENTOSA') || bUpper.includes('KS01') || bUpper === 'KS' || bUpper === 'ALL' || bUpper === 'ALLBRANCHES') {
        p.branch = 'Kota Sentosa';
      }
    });
  }
}

function savePatientsData() {
  localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patientsData));
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveToOneDrive === 'function') {
    window.pmgOneDriveSync.saveToOneDrive(patientsData).catch(err => {
      console.warn('[PMG OneDrive Sync] Auto-save error:', err);
    });
  }
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
function setupPatientEventListeners() {
  ['today', 'upcoming', 'overdue', 'all', 'schedule'].forEach(tab => {
    const btn = document.getElementById(`patientSubTabBtn_${tab}`);
    if (btn) btn.addEventListener('click', () => switchPatientSubTab(tab));
  });

  const branchFilter = document.getElementById('patientBranchFilter');
  if (branchFilter) {
    branchFilter.addEventListener('change', () => {
      if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.syncWithOneDriveFolder === 'function') {
        window.pmgOneDriveSync.syncWithOneDriveFolder(true).catch(() => {});
      }
      renderPatientModule();
    });
  }

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

  // Auto-populate meds & supplements when selected patient in Encounter Modal changes
  const pSel = document.getElementById('encounterPatientSelect');
  if (pSel) {
    pSel.addEventListener('change', (e) => {
      const pId = e.target.value;
      const p = patientsData.find(pt => pt.id === pId);
      if (p) {
        if (p.medications && p.medications.length) {
          document.getElementById('encPlanMeds').value = p.medications.map(m => typeof m === 'string' ? m : `${m.name} ${m.dosage || ''}`.trim()).join('\n');
        } else if (p.encounters && p.encounters.length && p.encounters[0].planMedications) {
          document.getElementById('encPlanMeds').value = p.encounters[0].planMedications;
        } else {
          document.getElementById('encPlanMeds').value = '';
        }

        if (p.encounters && p.encounters.length && p.encounters[0].planSupplements) {
          document.getElementById('encPlanSupps').value = p.encounters[0].planSupplements;
        } else {
          document.getElementById('encPlanSupps').value = '';
        }

        if (p.nextTcaDate) {
          document.getElementById('encTcaDate').value = p.nextTcaDate;
        } else {
          document.getElementById('encTcaDate').value = '';
        }
        if (p.nextTcaPurpose) {
          document.getElementById('encTcaPurpose').value = p.nextTcaPurpose;
        } else {
          document.getElementById('encTcaPurpose').value = 'Chronic Medication Refill & Health Review';
        }
      }
    });
  }

  // Auto-calculation listeners inside Encounter Modal
  setupEncounterAutoCalculations();
}

function switchPatientSubTab(tab) {
  activePatientSubTab = tab;
  ['today', 'upcoming', 'overdue', 'all', 'schedule'].forEach(t => {
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
        opt.textContent = b.code === 'KS01' ? 'Kota Sentosa' : `${b.code} – ${b.name}`;
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
    if (selectedBranch) {
      const pBranchUpper = (p.branch || '').toUpperCase();
      const selBranchUpper = selectedBranch.toUpperCase();
      const match = (pBranchUpper === selBranchUpper) ||
                    ((pBranchUpper === 'KS01' || pBranchUpper === 'KOTA SENTOSA') && (selBranchUpper === 'KS01' || selBranchUpper === 'KOTA SENTOSA'));
      if (!match) return false;
    }
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
      const isPending = (apt.status === 'Scheduled' || apt.status === 'Pending Approval');
      if (apt.date === todayStr && isPending) {
        todayAptCount++;
        todayList.push({ patient: p, appointment: apt });
      } else if (apt.date > todayStr && apt.date <= next7DaysStr && isPending) {
        dueIn7DaysCount++;
        upcomingList.push({ patient: p, appointment: apt });
      } else if (apt.date < todayStr && (apt.status === 'Scheduled' || apt.status === 'Missed' || apt.status === 'Pending Approval')) {
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
  renderPharmacistScheduleTab(filteredPatients);
  updateBackupStatusBadge();
  updateDailyBackupBanner();
}

// ─── RENDER QUEUES ───────────────────────────────────────────────────────────
function renderTodayQueue(items) {
  const tbody = document.getElementById('patientTodayBody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 text-sm">
      <i class="fa-regular fa-calendar-check text-2xl mb-2 text-gray-300 block"></i>
      No appointments scheduled for today. Click <b>"+ Book Appt"</b> to schedule.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const p = item.patient;
    const apt = item.appointment;
    const isRefill = (apt.type === 'refill_extension' || (apt.purpose && apt.purpose.toLowerCase().includes('refill')));
    const isExtension = (apt.type === 'refill_extension' || apt.status === 'Pending Approval');
    const waMsg = buildWhatsAppMessage(p, apt);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waMsg)}`;
    const branchDisplay = (p.branch === 'KS01' || p.branch === 'KOTA SENTOSA') ? 'Kota Sentosa' : p.branch;

    const purposeBadge = isRefill
      ? `<span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">Refill 1 Month Supply</span>`
      : `<span class="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg">Visit</span>`;

    return `
      <tr class="hover:bg-blue-50/40 transition border-b border-gray-100">
        <td class="px-4 py-3 font-semibold text-gray-900">${apt.time || '—'}</td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.phone} · ${branchDisplay}</span>
        </td>
        <td class="px-4 py-3">
          ${purposeBadge}
          ${apt.notes ? `<p class="text-[11px] text-gray-500 mt-1 italic truncate max-w-xs">${escHtml(apt.notes)}</p>` : ''}
        </td>
        <td class="px-4 py-3">
          ${isExtension ? `
            <span class="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block"></span> Extension Pending
            </span>
          ` : `
            <span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block"></span> Scheduled
            </span>
          `}
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          ${isExtension ? `
            <button onclick="approveRefillExtension('${p.id}', '${apt.id}')"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1 shadow-sm"
              title="Approve Refill & 1-Month Extension">
              <i class="fa-solid fa-check"></i> Approve (+1 Mo)
            </button>
          ` : `
            <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Completed')"
              class="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1"
              title="Mark as Completed">
              <i class="fa-solid fa-check"></i> Done
            </button>
          `}
          <a href="${waUrl}" target="_blank" rel="noopener"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1"
            title="Send WhatsApp Reminder">
            <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp
          </a>
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 text-sm">
      <i class="fa-regular fa-calendar text-2xl mb-2 text-gray-300 block"></i>
      No appointments in the next 7 days.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const p = item.patient;
    const apt = item.appointment;
    const isRefill = (apt.type === 'refill_extension' || (apt.purpose && apt.purpose.toLowerCase().includes('refill')));
    const isExtension = (apt.type === 'refill_extension' || apt.status === 'Pending Approval');
    const waMsg = buildWhatsAppMessage(p, apt);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waMsg)}`;
    const branchDisplay = (p.branch === 'KS01' || p.branch === 'KOTA SENTOSA') ? 'Kota Sentosa' : p.branch;

    const purposeBadge = isRefill
      ? `<span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">Refill 1 Month Supply</span>`
      : `<span class="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg">Visit</span>`;

    return `
      <tr class="hover:bg-blue-50/40 transition border-b border-gray-100">
        <td class="px-4 py-3 font-semibold text-gray-800">${apt.date} <span class="text-xs text-gray-400">(${apt.time || '—'})</span></td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.phone} · ${branchDisplay}</span>
        </td>
        <td class="px-4 py-3">
          ${purposeBadge}
        </td>
        <td class="px-4 py-3">
          ${isExtension ? `
            <span class="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block"></span> Extension Pending
            </span>
          ` : `
            <span class="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">Scheduled</span>
          `}
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          ${isExtension ? `
            <button onclick="approveRefillExtension('${p.id}', '${apt.id}')"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition mr-1 shadow-sm"
              title="Approve Refill & 1-Month Extension">
              <i class="fa-solid fa-check"></i> Approve (+1 Mo)
            </button>
          ` : ''}
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 text-sm">
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
    const branchDisplay = (p.branch === 'KS01' || p.branch === 'KOTA SENTOSA') ? 'Kota Sentosa' : p.branch;

    const dateStr = apt ? apt.date : (med ? med.nextRefillDate : '—');
    const details = apt ? (apt.purpose || 'Missed Appointment') : (med ? `${med.name} (Due: ${med.nextRefillDate})` : 'Overdue');

    return `
      <tr class="hover:bg-rose-50/30 transition border-b border-gray-100">
        <td class="px-4 py-3 font-semibold text-rose-700">${dateStr}</td>
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.phone} · ${branchDisplay}</span>
        </td>
        <td class="px-4 py-3">
          <span class="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded">
            ${item.type}
          </span>
          <p class="text-xs text-gray-600 mt-0.5">${details}</p>
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

  const todayStr = getTodayDateString(0);

  tbody.innerHTML = patients.map(p => {
    const lastEnc = (p.encounters && p.encounters.length) ? p.encounters[0] : null;
    const branchDisplay = (p.branch === 'KS01' || p.branch === 'KOTA SENTOSA') ? 'Kota Sentosa' : p.branch;

    // 1. Next Appointment / TCA Reminder Date
    const futureApts = (p.appointments || []).filter(a => a.status === 'Scheduled').sort((a, b) => a.date.localeCompare(b.date));
    const nextApt = futureApts.length ? futureApts[0] : null;

    let reminderHtml = '<span class="text-xs text-gray-400 italic">None</span>';
    if (nextApt) {
      const isToday = (nextApt.date === todayStr);
      const isPast = (nextApt.date < todayStr);
      let badgeCls = 'bg-blue-50 text-blue-800 border-blue-200';
      if (isToday) badgeCls = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      else if (isPast) badgeCls = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';

      reminderHtml = `
        <div class="space-y-0.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeCls}">
            <i class="fa-regular fa-calendar-check text-[10px]"></i> ${nextApt.date} ${nextApt.time ? '· ' + nextApt.time : ''}
          </span>
          <p class="text-[10px] text-gray-500 truncate max-w-[170px]" title="${escHtml(nextApt.purpose || 'Appointment')}">
            ${escHtml(nextApt.purpose || 'Appointment')}
          </p>
        </div>
      `;
    } else if (p.nextTcaDate) {
      const isPast = (p.nextTcaDate < todayStr);
      const isToday = (p.nextTcaDate === todayStr);
      let badgeCls = 'bg-purple-50 text-purple-800 border-purple-200';
      if (isToday) badgeCls = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      else if (isPast) badgeCls = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';

      reminderHtml = `
        <div class="space-y-0.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeCls}">
            <i class="fa-regular fa-bell text-[10px]"></i> TCA: ${p.nextTcaDate}
          </span>
          <p class="text-[10px] text-gray-500 truncate max-w-[170px]" title="${escHtml(p.nextTcaPurpose || 'Follow-up Reminder')}">
            ${escHtml(p.nextTcaPurpose || 'Follow-up Reminder')}
          </p>
        </div>
      `;
    }

    // 2. Medication List (with wrapping)
    let medsList = [];
    if (p.medications && p.medications.length) {
      medsList = p.medications.map(m => typeof m === 'string' ? m : `${m.name} ${m.dosage || ''}`.trim());
    } else if (lastEnc && lastEnc.planMedications) {
      medsList = lastEnc.planMedications.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }

    let medsHtml = '<span class="text-xs text-gray-400 italic">None recorded</span>';
    if (medsList.length) {
      medsHtml = `
        <div class="space-y-1.5 min-w-[150px] max-w-[280px]">
          ${medsList.slice(0, 4).map(m => `
            <div class="text-[11px] font-semibold text-gray-800 flex items-start gap-1.5 break-words whitespace-normal leading-snug" title="${escHtml(m)}">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1"></span>
              <span class="break-words">${escHtml(m)}</span>
            </div>
          `).join('')}
          ${medsList.length > 4 ? `<span class="text-[10px] font-semibold text-blue-600 cursor-pointer block hover:underline" onclick="viewPatientProfile('${p.id}')">+${medsList.length - 4} more...</span>` : ''}
        </div>
      `;
    }

    // 3. Supplement List (with word wrapping)
    let suppsList = [];
    if (lastEnc && lastEnc.planSupplements) {
      suppsList = lastEnc.planSupplements.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    } else if (p.supplements && p.supplements.length) {
      suppsList = p.supplements.map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
    }

    let suppsHtml = '<span class="text-xs text-gray-400 italic">None</span>';
    if (suppsList.length) {
      suppsHtml = `
        <div class="space-y-1.5 min-w-[150px] max-w-[280px]">
          ${suppsList.slice(0, 4).map(s => `
            <div class="text-[11px] font-semibold text-emerald-800 flex items-start gap-1.5 break-words whitespace-normal leading-snug" title="${escHtml(s)}">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
              <span class="break-words">${escHtml(s)}</span>
            </div>
          `).join('')}
          ${suppsList.length > 4 ? `<span class="text-[10px] font-semibold text-emerald-600 cursor-pointer block hover:underline" onclick="viewPatientProfile('${p.id}')">+${suppsList.length - 4} more...</span>` : ''}
        </div>
      `;
    }

    return `
      <tr class="hover:bg-blue-50/40 transition border-b border-gray-100">
        <td class="px-4 py-3">
          <button onclick="viewPatientProfile('${p.id}')" class="text-blue-700 hover:underline font-bold text-left block">
            ${p.name}
          </button>
          <span class="text-[11px] text-gray-400">${p.gender}, ${p.age} yrs · ${p.ic || 'No IC'}</span>
        </td>
        <td class="px-3 py-3 text-xs text-gray-700">${p.phone || '—'}</td>
        <td class="px-3 py-3">
          <span class="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">${branchDisplay}</span>
        </td>
        <td class="px-4 py-3">${reminderHtml}</td>
        <td class="px-4 py-3">${medsHtml}</td>
        <td class="px-4 py-3">${suppsHtml}</td>
        <td class="px-3 py-3 text-right whitespace-nowrap">
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
  let rawBranch = patient?.branch;
  if (!rawBranch || rawBranch === 'ALL' || rawBranch === 'ALLBRANCHES') {
    rawBranch = (typeof getSession === 'function' && getSession()?.branch) || 'Kota Sentosa';
  }
  const branch = typeof normalizeBranchCode === 'function' ? normalizeBranchCode(rawBranch) : 'Kota Sentosa';
  const name = patient?.name || '';
  const phone = patient?.phone || '';
  const ic = patient?.ic || '';

  const params = new URLSearchParams();
  params.set('book', '1');
  params.set('branch', branch);

  if (typeof getPharmacistSchedule === 'function' && typeof packScheduleForUrl === 'function') {
    const sched = getPharmacistSchedule(branch);
    const packedSched = packScheduleForUrl(sched);
    if (packedSched) {
      params.set('sch', packedSched);
    }
  }

  if (name) params.set('name', name);
  if (phone) params.set('phone', phone);
  if (ic) params.set('ic', ic);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Constructs the complete multilingual WhatsApp booking message.
 * Formatted with clean universal markdown and spacing (no broken symbols).
 */
function buildPatientSupplyBookingMessage(patient) {
  let rawBranch = patient?.branch;
  if (!rawBranch || rawBranch === 'ALL' || rawBranch === 'ALLBRANCHES') {
    rawBranch = (typeof getSession === 'function' && getSession()?.branch) || 'Kota Sentosa';
  }
  const branchCode = typeof normalizeBranchCode === 'function' ? normalizeBranchCode(rawBranch) : 'Kota Sentosa';
  const branchInfo = BRANCH_SCHEDULES[branchCode] || BRANCH_SCHEDULES['Kota Sentosa'];
  const sched = typeof getPharmacistSchedule === 'function' ? getPharmacistSchedule(branchCode) : null;
  const branchName = sched ? (sched.branchName || branchInfo?.name) : (branchInfo ? branchInfo.name : 'PMG Pharmacy Kota Sentosa');
  
  // Dynamically determine current active consultation hours from weekly template
  let activeOpen = '';
  let activeClose = '';
  if (sched && sched.weeklyTemplate) {
    const todayNum = String(new Date().getDay()); // 0 = Sun .. 6 = Sat
    const todayTmpl = sched.weeklyTemplate[todayNum];
    if (todayTmpl && todayTmpl.isOpen) {
      activeOpen = todayTmpl.open;
      activeClose = todayTmpl.close;
    } else {
      // Find first open day in weekly template
      for (const d of ['1','2','3','4','5','6','0']) {
        if (sched.weeklyTemplate[d] && sched.weeklyTemplate[d].isOpen) {
          activeOpen = sched.weeklyTemplate[d].open;
          activeClose = sched.weeklyTemplate[d].close;
          break;
        }
      }
    }
  }
  const openTime = activeOpen || (branchInfo ? branchInfo.open : '08:00');
  const closeTime = activeClose || (branchInfo ? branchInfo.close : '17:00');
  const pharmacistName = sched ? (sched.defaultPharmacist || branchInfo?.pharmacist) : (branchInfo ? branchInfo.pharmacist : 'William Chai (Pharmacist)');

  const lang = getPatientLanguageByRace(patient);
  const supplyText = getPatientSupplySummary(patient, lang);
  const bookingUrl = getPatientSelfBookingUrl(patient);
  const patientName = patient.name || 'Pelanggan';

  const tcaReminderZh = patient.nextTcaDate ? `\n\n*建议复查/续药提醒日期：* ${patient.nextTcaDate}${patient.nextTcaPurpose ? ' (' + patient.nextTcaPurpose + ')' : ''}` : '';
  const tcaReminderMy = patient.nextTcaDate ? `\n\n*Cadangan Tarikh Temujanji/Ulangan:* ${patient.nextTcaDate}${patient.nextTcaPurpose ? ' (' + patient.nextTcaPurpose + ')' : ''}` : '';
  const tcaReminderEn = patient.nextTcaDate ? `\n\n*Recommended Follow-up/Refill Date:* ${patient.nextTcaDate}${patient.nextTcaPurpose ? ' (' + patient.nextTcaPurpose + ')' : ''}` : '';

  if (lang === 'Chinese') {
    return `您好 *${patientName}*，这里是 *${branchName}*（${openTime} - ${closeTime}）。\n\n${supplyText}${tcaReminderZh}\n\n为确保您的健康指标控制平稳并避免断药，我们建议您提前安排。\n\n👉 *您可以直接点击下方专属链接，选择适合您的时间到店面诊，或直接申请1个月慢病续药：*\n🔗 ${bookingUrl}\n\n如果您有任何用药疑问，或需要我们提前备妥药物，欢迎直接回复此 WhatsApp。\n\nPMG 药剂师团队祝您与家人身体健康！`;
  } else if (lang === 'Malay') {
    return `Salam sejahtera *${patientName}*, ini pesanan daripada *${branchName}* (${openTime} - ${closeTime}).\n\n${supplyText}${tcaReminderMy}\n\nBagi memastikan kesihatan anda kekal terkawal tanpa gangguan bekalan ubat, kami mencadangkan anda merancang lebih awal.\n\n👉 *Sila klik pautan peribadi di bawah untuk memilih masa temujanji atau memohon lanjutan bekalan ubat 1 bulan:*\n🔗 ${bookingUrl}\n\nSekiranya anda mempunyai sebarang pertanyaan mengenai ubat-ubatan, sila balas mesej ini.\n\nPasukan Farmasi PMG sentiasa sedia membantu!`;
  } else {
    return `Dear *${patientName}*, warm greetings from *${branchName}* (${openTime} - ${closeTime}).\n\n${supplyText}${tcaReminderEn}\n\nTo ensure your health metrics stay in optimal control and prevent any medication disruption, we recommend planning ahead.\n\n👉 *You can click your personalized link below to select a convenient appointment time, or request a 1-month refill extension:*\n🔗 ${bookingUrl}\n\nIf you have any questions or would like us to prepare your medications in advance, feel free to reply directly.\n\nWishing you good health from your PMG Pharmacy team!`;
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
  const bCode = typeof normalizeBranchCode === 'function' ? normalizeBranchCode(patient?.branch) : 'Kota Sentosa';
  const branchName = bCode === 'Kota Sentosa' ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${bCode}`;
  const lang = patient.language || 'English';
  const name = patient.name;
  const date = appointment.date;
  const time = appointment.time || '10:00';
  const purpose = appointment.purpose || 'Follow-up Consultation';

  if (lang === 'Chinese') {
    return `您好 ${name}，这里是 ${branchName}。\n\n温馨提醒您，您预约的【${purpose}】时间为：\n📅 日期：${date}\n⏰ 时间：${time}\n\n请问需要我们提前为您准备好药物吗？如需调整时间，请随时回复我们。祝您身体健康！`;
  } else if (lang === 'Malay') {
    return `Salam ${name}, ini peringatan mesra dari ${branchName}.\n\nTemujanji anda untuk [${purpose}] dijadualkan pada:\n📅 Tarikh: ${date}\n⏰ Masa: ${time}\n\nSila maklumkan sekiranya anda ingin kami sediakan ubat lebih awal, atau jika ingin menjadualkan semula. Terima kasih & semoga sihat selalu!`;
  } else {
    return `Hello ${name}, this is a friendly reminder from ${branchName}.\n\nYour appointment for [${purpose}] is scheduled for:\n📅 Date: ${date}\n⏰ Time: ${time}\n\nWould you like us to prepare your medications in advance? Please let us know if you need to reschedule. Thank you and stay healthy!`;
  }
}

function buildWhatsAppRecallMessage(patient, item) {
  const bCode = typeof normalizeBranchCode === 'function' ? normalizeBranchCode(patient?.branch) : 'Kota Sentosa';
  const branchName = bCode === 'Kota Sentosa' ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${bCode}`;
  const lang = patient.language || 'English';
  const name = patient.name;
  const bookingUrl = getPatientSelfBookingUrl(patient);

  if (lang === 'Chinese') {
    return `您好 *${name}*，这里是 *${branchName}*。\n\n我们注意到您的长期慢病药物已到期 / 错过了近期的复查提醒。为确保您的血压、血糖与健康指标平稳控制，建议您尽快回来复查并补充药物。\n\n👉 *您可以直接点击下方专属链接，选择适合您的时间到店面诊，或直接申请1个月慢病续药：*\n🔗 ${bookingUrl}\n\n我们药剂师团队已准备好为您服务。如有任何疑问，欢迎随时联系我们！祝您身体健康！`;
  } else if (lang === 'Malay') {
    return `Salam *${name}*, ini peringatan mesra dari *${branchName}*。\n\nKami mendapati bekalan ubat kronik anda telah tamat tempoh / terlepas tarikh temujanji ulangan. Demi mengekalkan kawalan kesihatan yang baik, kami mencadangkan anda memperbaharui bekalan ubat anda secepat mungkin。\n\n👉 *Sila klik pautan peribadi di bawah untuk memilih masa temujanji atau memohon lanjutan bekalan ubat 1 bulan:*\n🔗 ${bookingUrl}\n\nAhli farmasi kami sedia membantu anda. Terima kasih dan kekal sihat!`;
  } else {
    return `Hello *${name}*, this is a friendly reminder from *${branchName}*.\n\nWe noticed that your chronic medication supply is overdue or you have missed your follow-up review. Maintaining steady medication compliance is essential for your long-term health control.\n\n👉 *You may click your personalized link below to select a convenient appointment time, or request a 1-month refill extension:*\n🔗 ${bookingUrl}\n\nOur pharmacy team is ready to assist you. Please let us know if you have any questions!`;
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

// ─── PHARMACIST SCHEDULE & BOOKINGS ROSTER ───────────────────────────────────

let currentSchedViewMode = 'booked'; // 'booked' or 'reminders'

function switchSchedViewMode(mode) {
  currentSchedViewMode = mode;
  const btnBooked = document.getElementById('schedTabBtn_booked');
  const btnRemind = document.getElementById('schedTabBtn_reminders');
  const secBooked = document.getElementById('schedSection_booked');
  const secRemind = document.getElementById('schedSection_reminders');

  if (mode === 'booked') {
    if (btnBooked) {
      btnBooked.className = 'px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs bg-white text-indigo-900 flex items-center gap-2';
    }
    if (btnRemind) {
      btnRemind.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 transition flex items-center gap-2';
    }
    if (secBooked) secBooked.classList.remove('hidden');
    if (secRemind) secRemind.classList.add('hidden');
  } else {
    if (btnBooked) {
      btnBooked.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 transition flex items-center gap-2';
    }
    if (btnRemind) {
      btnRemind.className = 'px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs bg-white text-amber-900 flex items-center gap-2';
    }
    if (secBooked) secBooked.classList.add('hidden');
    if (secRemind) secRemind.classList.remove('hidden');
  }

  renderPharmacistScheduleTab();
}

function getFormattedDateWithDay(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

function renderPharmacistScheduleTab(patientsList) {
  const tbodyBooked = document.getElementById('schedBookingsBody');
  const tbodyRemind = document.getElementById('schedRemindersBody');
  if (!tbodyBooked && !tbodyRemind) return;

  const pts = patientsList || (typeof patientsData !== 'undefined' ? patientsData : []);
  const todayStr = getTodayDateString(0);
  const tomorrowStr = getTodayDateString(1);
  const next7DaysStr = getTodayDateString(7);

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: CUSTOMER BOOKED APPOINTMENTS (Confirmed Slots with Time & Pharmacist)
  // ═══════════════════════════════════════════════════════════════════════════
  const allBookings = [];
  const pharmacistNames = new Set([
    'William Chai (Pharmacist)',
    'Kenix Ling (Pharmacist)',
    'Ting Kwang Yu (BM)',
    'Duty Pharmacist'
  ]);

  pts.forEach(p => {
    (p.appointments || []).forEach(apt => {
      if (!apt.id) apt.id = 'APT-' + Math.random().toString(36).substring(2, 9);
      if (apt.pharmacist) pharmacistNames.add(apt.pharmacist);
      allBookings.push({ patient: p, appointment: apt });
    });
  });

  // Populate Pharmacist filter dropdown
  const pharmFilterEl = document.getElementById('schedFilterPharmacist');
  if (pharmFilterEl) {
    const currentVal = pharmFilterEl.value;
    const sortedPharms = Array.from(pharmacistNames).filter(Boolean).sort();
    let optHtml = '<option value="">All Pharmacists</option>';
    sortedPharms.forEach(ph => {
      optHtml += `<option value="${escHtml(ph)}" ${currentVal === ph ? 'selected' : ''}>${escHtml(ph)}</option>`;
    });
    pharmFilterEl.innerHTML = optHtml;
  }

  // Populate modal pharmacist dropdown
  const reschedPharmEl = document.getElementById('reschedPharmacist');
  if (reschedPharmEl && reschedPharmEl.options.length <= 4) {
    const sortedPharms = Array.from(pharmacistNames).filter(Boolean).sort();
    let mOpts = '';
    sortedPharms.forEach(ph => {
      mOpts += `<option value="${escHtml(ph)}">${escHtml(ph)}</option>`;
    });
    reschedPharmEl.innerHTML = mOpts;
  }

  // Compute Booked KPIs
  let kpiUpcoming = 0;
  let kpiToday = 0;
  let kpiPending = 0;
  let kpiCompleted = 0;

  allBookings.forEach(({ appointment: apt }) => {
    const isAct = (apt.status === 'Scheduled' || apt.status === 'Pending Approval');
    if (apt.date >= todayStr && isAct) kpiUpcoming++;
    if (apt.date === todayStr && isAct) kpiToday++;
    if (apt.status === 'Pending Approval') kpiPending++;
    if (apt.status === 'Completed' || apt.status === 'Approved') kpiCompleted++;
  });

  const kpiUpEl = document.getElementById('schedKpiUpcoming');
  const kpiToEl = document.getElementById('schedKpiToday');
  const kpiPeEl = document.getElementById('schedKpiPending');
  const kpiCoEl = document.getElementById('schedKpiCompleted');
  const badgeCountEl = document.getElementById('scheduleBadgeCount');
  const countBookedBadge = document.getElementById('schedCountBookedBadge');

  if (kpiUpEl) kpiUpEl.textContent = kpiUpcoming;
  if (kpiToEl) kpiToEl.textContent = kpiToday;
  if (kpiPeEl) kpiPeEl.textContent = kpiPending;
  if (kpiCoEl) kpiCoEl.textContent = kpiCompleted;
  if (badgeCountEl) badgeCountEl.textContent = kpiUpcoming;
  if (countBookedBadge) countBookedBadge.textContent = kpiUpcoming;

  // Filter Booked Appointments
  if (tbodyBooked) {
    const selPharm = pharmFilterEl ? pharmFilterEl.value.trim().toLowerCase() : '';
    const selTimeframe = document.getElementById('schedFilterTimeframe')?.value || 'upcoming';
    const selStatus = document.getElementById('schedFilterStatus')?.value || 'active';
    const query = (document.getElementById('schedSearchInput')?.value || '').toLowerCase().trim();

    const filteredBookings = allBookings.filter(({ patient: p, appointment: apt }) => {
      if (selPharm && !(apt.pharmacist || '').toLowerCase().includes(selPharm)) return false;

      if (selTimeframe === 'today') {
        if (apt.date !== todayStr) return false;
      } else if (selTimeframe === 'next7') {
        if (apt.date < todayStr || apt.date > next7DaysStr) return false;
      } else if (selTimeframe === 'upcoming') {
        if (apt.date < todayStr) return false;
      }

      if (selStatus === 'active') {
        if (apt.status !== 'Scheduled' && apt.status !== 'Pending Approval') return false;
      } else if (selStatus !== 'all') {
        if (apt.status !== selStatus) return false;
      }

      if (query) {
        const matchPName = (p.name || '').toLowerCase().includes(query);
        const matchPhone = (p.phone || '').includes(query);
        const matchIc = (p.ic || '').toLowerCase().includes(query);
        const matchPurp = (apt.purpose || '').toLowerCase().includes(query);
        const matchNotes = (apt.notes || '').toLowerCase().includes(query);
        const matchPharm = (apt.pharmacist || '').toLowerCase().includes(query);
        if (!matchPName && !matchPhone && !matchIc && !matchPurp && !matchNotes && !matchPharm) {
          return false;
        }
      }

      return true;
    });

    filteredBookings.sort((a, b) => {
      const cmpDate = (a.appointment.date || '').localeCompare(b.appointment.date || '');
      if (cmpDate !== 0) return cmpDate;
      return (a.appointment.time || '').localeCompare(b.appointment.time || '');
    });

    if (!filteredBookings.length) {
      tbodyBooked.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12 text-gray-400 text-xs italic">
            <i class="fa-regular fa-calendar-xmark text-2xl text-gray-300 block mb-2"></i>
            No confirmed customer bookings match the selected filters.
          </td>
        </tr>
      `;
    } else {
      tbodyBooked.innerHTML = filteredBookings.map(({ patient: p, appointment: apt }) => {
        const isToday = apt.date === todayStr;
        const isTomorrow = apt.date === tomorrowStr;

        let dateBadge = '';
        if (isToday) {
          dateBadge = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">TODAY</span>';
        } else if (isTomorrow) {
          dateBadge = '<span class="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">TOMORROW</span>';
        }

        let statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
        if (apt.status === 'Completed' || apt.status === 'Approved') statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
        if (apt.status === 'Pending Approval') statusClass = 'bg-amber-50 text-amber-900 border-amber-300 font-bold animate-pulse';
        if (apt.status === 'Missed') statusClass = 'bg-rose-50 text-rose-800 border-rose-200';

        let cleanPhone = (p.phone || '').replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);

        const isRefill = (apt.type === 'refill_extension' || (apt.purpose && apt.purpose.includes('Refill')) || (apt.purpose && apt.purpose.includes('Supply')));

        return `
          <tr class="hover:bg-indigo-50/40 transition text-xs">
            <!-- Booked Date & Time Slot -->
            <td class="px-4 py-3.5 whitespace-nowrap">
              <div class="font-extrabold text-gray-900 text-xs flex items-center">
                <span>${getFormattedDateWithDay(apt.date)}</span>
                ${dateBadge}
              </div>
              <div class="text-indigo-700 font-bold text-xs mt-1 flex items-center gap-1.5">
                <i class="fa-regular fa-clock text-[11px]"></i>
                <span>${escHtml(apt.time || '10:00')}</span>
              </div>
            </td>

            <!-- Duty Pharmacist -->
            <td class="px-4 py-3.5 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-900 font-bold px-2.5 py-1 rounded-xl text-xs shadow-2xs">
                <i class="fa-solid fa-user-doctor text-purple-600 text-xs"></i>
                <span>${escHtml(apt.pharmacist || 'Duty Pharmacist')}</span>
              </span>
            </td>

            <!-- Patient Details -->
            <td class="px-4 py-3.5">
              <button type="button" onclick="viewPatientProfile('${p.id}')"
                class="font-black text-blue-700 hover:text-blue-900 hover:underline text-xs text-left block">
                ${escHtml(p.name)}
              </button>
              <div class="flex items-center gap-1.5 mt-0.5 flex-wrap text-[11px]">
                ${cleanPhone ? `
                  <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener"
                    class="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1">
                    <i class="fa-brands fa-whatsapp text-emerald-600"></i> ${escHtml(p.phone || '—')}
                  </a>
                ` : `<span class="text-gray-400">No phone</span>`}
                <span class="text-gray-400 font-semibold">&bull; ${escHtml(p.branch || 'Branch')}</span>
              </div>
            </td>

            <!-- Purpose & Details -->
            <td class="px-4 py-3.5">
              <div class="font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                <span>${escHtml(apt.purpose || 'Chronic Consultation')}</span>
                ${isRefill ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">Refill Supply</span>' : ''}
              </div>
              ${apt.notes ? `<div class="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">${escHtml(apt.notes)}</div>` : ''}
            </td>

            <!-- Status -->
            <td class="px-4 py-3.5 whitespace-nowrap">
              <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusClass}">
                ${apt.status || 'Scheduled'}
              </span>
            </td>

            <!-- Actions: Reschedule vs WhatsApp Reminder -->
            <td class="px-4 py-3.5 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-2">
                <!-- Reschedule / Shift Change Button (Opens Modal) -->
                <button type="button" onclick="openRescheduleModal('${p.id}', '${apt.id}')"
                  class="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5"
                  title="Shift change or appointment rescheduling">
                  <i class="fa-solid fa-calendar-pen text-indigo-600"></i>
                  <span>Reschedule</span>
                </button>

                <!-- WhatsApp Routine Appointment Reminder (Direct WhatsApp Chat) -->
                <button type="button" onclick="sendDirectAppointmentReminderWa('${p.id}', '${apt.id}')"
                  class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5"
                  title="Send confirmed appointment reminder directly to customer on WhatsApp">
                  <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                  <span>WhatsApp Reminder</span>
                </button>

                <!-- Quick Mark Done (if active) -->
                ${(apt.status === 'Scheduled' || apt.status === 'Pending Approval') ? `
                  <button type="button" onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Completed')"
                    class="text-gray-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition" title="Mark Consultation Completed">
                    <i class="fa-solid fa-circle-check text-sm"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: APPOINTMENT REMINDER DATES (Next TCA in SOAP & Medication Refill Due)
  // ═══════════════════════════════════════════════════════════════════════════
  const reminderItems = [];
  let remindTotal = 0;
  let remindToday = 0;
  let remindNext7 = 0;
  let remindOverdue = 0;

  pts.forEach(p => {
    const bookedApt = (p.appointments || []).find(a => a.date >= todayStr && (a.status === 'Scheduled' || a.status === 'Pending Approval'));
    const isBooked = !!bookedApt;

    // 1. Next TCA Date from Consult & POCT / SOAP
    if (p.nextTcaDate) {
      const isPast = p.nextTcaDate < todayStr;
      const isTod = p.nextTcaDate === todayStr;
      const isSoon = p.nextTcaDate > todayStr && p.nextTcaDate <= next7DaysStr;

      remindTotal++;
      if (isTod) remindToday++;
      if (isSoon) remindNext7++;
      if (isPast) remindOverdue++;

      reminderItems.push({
        patient: p,
        date: p.nextTcaDate,
        purpose: p.nextTcaPurpose || 'Follow-up Consultation & Refill',
        source: p.nextTcaRecordedBy ? `Consultation SOAP (by ${p.nextTcaRecordedBy})` : 'Consultation SOAP Assessment',
        type: 'tca',
        isBooked,
        bookedSlot: bookedApt ? `${bookedApt.date} (${bookedApt.time || '10:00'})` : null
      });
    }

    // 2. Chronic medication refill due dates
    (p.medications || []).forEach(med => {
      if (med.nextRefillDate && med.nextRefillDate !== p.nextTcaDate) {
        const isPast = med.nextRefillDate < todayStr;
        const isTod = med.nextRefillDate === todayStr;
        const isSoon = med.nextRefillDate > todayStr && med.nextRefillDate <= next7DaysStr;

        const alreadyIn = reminderItems.some(r => r.patient.id === p.id && r.date === med.nextRefillDate);
        if (!alreadyIn) {
          remindTotal++;
          if (isTod) remindToday++;
          if (isSoon) remindNext7++;
          if (isPast) remindOverdue++;

          reminderItems.push({
            patient: p,
            date: med.nextRefillDate,
            purpose: `Refill Due: ${med.name} (${med.dosage || ''})`,
            source: 'Chronic Medication Supply Tracking',
            type: 'med_refill',
            isBooked,
            bookedSlot: bookedApt ? `${bookedApt.date} (${bookedApt.time || '10:00'})` : null
          });
        }
      }
    });
  });

  // Update Reminders KPIs & Badges
  const rKpiTotal = document.getElementById('remindKpiTotal');
  const rKpiToday = document.getElementById('remindKpiToday');
  const rKpiNext7 = document.getElementById('remindKpiNext7');
  const rKpiOverdue = document.getElementById('remindKpiOverdue');
  const countRemindBadge = document.getElementById('schedCountRemindersBadge');

  if (rKpiTotal) rKpiTotal.textContent = remindTotal;
  if (rKpiToday) rKpiToday.textContent = remindToday;
  if (rKpiNext7) rKpiNext7.textContent = remindNext7;
  if (rKpiOverdue) rKpiOverdue.textContent = remindOverdue;
  if (countRemindBadge) countRemindBadge.textContent = remindTotal;

  // Render Reminders Table
  if (tbodyRemind) {
    const selRTimeframe = document.getElementById('remindFilterTimeframe')?.value || 'upcoming';
    const selRBooking = document.getElementById('remindFilterBookingStatus')?.value || 'unbooked';
    const rQuery = (document.getElementById('remindSearchInput')?.value || '').toLowerCase().trim();

    const filteredReminders = reminderItems.filter(item => {
      if (selRTimeframe === 'today') {
        if (item.date !== todayStr) return false;
      } else if (selRTimeframe === 'next7') {
        if (item.date < todayStr || item.date > next7DaysStr) return false;
      } else if (selRTimeframe === 'overdue') {
        if (item.date >= todayStr) return false;
      } else if (selRTimeframe === 'upcoming') {
        if (item.date < todayStr) return false;
      }

      if (selRBooking === 'unbooked') {
        if (item.isBooked) return false;
      } else if (selRBooking === 'booked') {
        if (!item.isBooked) return false;
      }

      if (rQuery) {
        const p = item.patient;
        const matchName = (p.name || '').toLowerCase().includes(rQuery);
        const matchPhone = (p.phone || '').includes(rQuery);
        const matchIc = (p.ic || '').toLowerCase().includes(rQuery);
        const matchPurp = (item.purpose || '').toLowerCase().includes(rQuery);
        if (!matchName && !matchPhone && !matchIc && !matchPurp) return false;
      }

      return true;
    });

    filteredReminders.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (!filteredReminders.length) {
      tbodyRemind.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-12 text-gray-400 text-xs italic">
            <i class="fa-regular fa-bell-slash text-2xl text-gray-300 block mb-2"></i>
            No appointment reminder dates match the selected filters.
          </td>
        </tr>
      `;
    } else {
      tbodyRemind.innerHTML = filteredReminders.map(item => {
        const p = item.patient;
        const isPast = item.date < todayStr;
        const isToday = item.date === todayStr;

        let dateBadge = '';
        if (isToday) {
          dateBadge = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">DUE TODAY</span>';
        } else if (isPast) {
          dateBadge = '<span class="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">OVERDUE</span>';
        }

        let cleanPhone = (p.phone || '').replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);

        let bookingStatusHtml = item.isBooked
          ? `<span class="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-xl"><i class="fa-solid fa-circle-check text-emerald-600"></i> Slot Booked: ${escHtml(item.bookedSlot || '')}</span>`
          : `<span class="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-xl"><i class="fa-regular fa-clock text-amber-600"></i> No Slot Booked Yet</span>`;

        return `
          <tr class="hover:bg-amber-50/40 transition text-xs">
            <!-- Reminder Date -->
            <td class="px-4 py-3.5 whitespace-nowrap">
              <div class="font-extrabold text-gray-900 text-xs flex items-center">
                <span>${getFormattedDateWithDay(item.date)}</span>
                ${dateBadge}
              </div>
              <div class="text-[11px] font-mono text-gray-500 mt-0.5">${item.date}</div>
            </td>

            <!-- Patient Details -->
            <td class="px-4 py-3.5">
              <button type="button" onclick="viewPatientProfile('${p.id}')"
                class="font-black text-blue-700 hover:text-blue-900 hover:underline text-xs text-left block">
                ${escHtml(p.name)}
              </button>
              <div class="flex items-center gap-1.5 mt-0.5 flex-wrap text-[11px]">
                ${cleanPhone ? `
                  <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener"
                    class="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1">
                    <i class="fa-brands fa-whatsapp text-emerald-600"></i> ${escHtml(p.phone || '—')}
                  </a>
                ` : `<span class="text-gray-400">No phone</span>`}
                <span class="text-gray-400 font-semibold">&bull; ${escHtml(p.branch || 'Branch')}</span>
              </div>
            </td>

            <!-- Purpose & Source -->
            <td class="px-4 py-3.5">
              <div class="font-bold text-gray-900">${escHtml(item.purpose)}</div>
              <div class="text-[11px] text-gray-500 mt-0.5 italic">${escHtml(item.source)}</div>
            </td>

            <!-- Booking Status -->
            <td class="px-4 py-3.5 whitespace-nowrap">
              ${bookingStatusHtml}
            </td>

            <!-- Actions -->
            <td class="px-4 py-3.5 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-2">
                <!-- Send WhatsApp Booking Link -->
                <button type="button" onclick="sendReminderBookingLinkWa('${p.id}')"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5"
                  title="Send WhatsApp invitation with customer self-booking link">
                  <i class="fa-brands fa-whatsapp text-sm"></i>
                  <span>Send Booking Link</span>
                </button>

                <!-- Book Confirmed Slot Directly -->
                <button type="button" onclick="showNewAppointmentModalWithDate('${p.id}', '${item.date}')"
                  class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1"
                  title="Book a confirmed time slot directly for this patient">
                  <i class="fa-solid fa-calendar-plus text-indigo-600"></i>
                  <span>Book Slot</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

// ─── DIRECT REMINDER & BOOKING LINK ACTIONS ──────────────────────────────────

function sendDirectAppointmentReminderWa(patientId, appointmentId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) return;
  const apt = (p.appointments || []).find(a => a.id === appointmentId);
  if (!apt) return;

  let cleanPhone = (p.phone || '').replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);
  if (!cleanPhone) {
    alert('This patient does not have a recorded phone number for WhatsApp.');
    return;
  }

  let rawBranch = p.branch || 'Kota Sentosa';
  const branchCode = typeof normalizeBranchCode === 'function' ? normalizeBranchCode(rawBranch) : 'Kota Sentosa';
  const branchInfo = BRANCH_SCHEDULES[branchCode] || BRANCH_SCHEDULES['Kota Sentosa'];
  const sched = typeof getPharmacistSchedule === 'function' ? getPharmacistSchedule(branchCode) : null;
  const branchName = sched ? (sched.branchName || branchInfo?.name) : (branchInfo ? branchInfo.name : 'PMG Pharmacy Kota Sentosa');
  const dutyPharm = (apt.pharmacist && !apt.pharmacist.includes('Ting')) ? apt.pharmacist : (sched ? sched.defaultPharmacist : 'William Chai (Pharmacist)');
  const bookingUrl = typeof getPatientSelfBookingUrl === 'function' ? getPatientSelfBookingUrl(p) : window.location.href;

  const lang = typeof getPatientLanguageByRace === 'function' ? getPatientLanguageByRace(p) : 'Chinese';
  let msg = '';

  if (lang === 'Chinese') {
    msg = `您好 *${p.name}*，这里是 *PMG Pharmacy (${branchName})* 的温馨预约提醒。\n\n您在我们药剂行已预订了健康咨询/续药服务：\n📅 *预约日期：* ${apt.date}\n⏰ *预约时间：* ${apt.time || '10:00'}\n👨‍⚕️ *主理药剂师：* ${dutyPharm}\n\n期待您的到来！如需更改时间或查看预约详情，也可使用您的专属链接：\n🔗 ${bookingUrl}\n\n祝您身体健康！\n*PMG Pharmacy*`;
  } else if (lang === 'Malay') {
    msg = `Salam sejahtera *${p.name}*, ini adalah peringatan mesra temujanji daripada *PMG Pharmacy (${branchName})*.\n\nAnda mempunyai temujanji rundingan kesihatan/ulangan ubat yang telah disahkan:\n📅 *Tarikh:* ${apt.date}\n⏰ *Masa:* ${apt.time || '10:00'}\n👨‍⚕️ *Ahli Farmasi Bertugas:* ${dutyPharm}\n\nKami menantikan kedatangan anda. Jika perlu membuat sebarang penukaran, anda juga boleh menggunakan pautan peribadi anda di sini:\n🔗 ${bookingUrl}\n\nSemoga sihat sejahtera,\n*PMG Pharmacy*`;
  } else {
    msg = `Hello *${p.name}*, this is a friendly appointment reminder from *PMG Pharmacy (${branchName})*.\n\nYou have a confirmed consultation/refill appointment scheduled:\n📅 *Date:* ${apt.date}\n⏰ *Time:* ${apt.time || '10:00'}\n👨‍⚕️ *Duty Pharmacist:* ${dutyPharm}\n\nWe look forward to seeing you! If you need to make changes, you can also access your personal booking portal here:\n🔗 ${bookingUrl}\n\nBest regards,\n*PMG Pharmacy*`;
  }

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

function sendReminderBookingLinkWa(patientId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) return;

  let cleanPhone = (p.phone || '').replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);
  if (!cleanPhone) {
    alert('This patient does not have a recorded phone number for WhatsApp.');
    return;
  }

  const msg = typeof buildPatientSupplyBookingMessage === 'function'
    ? buildPatientSupplyBookingMessage(p)
    : `Hello ${p.name}, please click this link to book your consultation appointment: ${getPatientSelfBookingUrl(p)}`;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

function showNewAppointmentModalWithDate(patientId, defaultDate) {
  showNewAppointmentModal(patientId);
  if (defaultDate) {
    const dInput = document.getElementById('aptDate');
    if (dInput) dInput.value = defaultDate;
  }
}

// ─── RESCHEDULE & SHIFT CHANGE MODAL LOGIC ───────────────────────────────────

function openRescheduleModal(patientId, appointmentId, directWa = false) {
  const modal = document.getElementById('rescheduleAppointmentModal');
  if (!modal) return;

  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) {
    alert('Patient record not found.');
    return;
  }

  const apt = (p.appointments || []).find(a => a.id === appointmentId);
  if (!apt) {
    alert('Appointment record not found.');
    return;
  }

  // Populate hidden keys
  document.getElementById('reschedPatientId').value = patientId;
  document.getElementById('reschedAppointmentId').value = appointmentId;

  // Populate Summary
  document.getElementById('reschedPatientName').textContent = p.name;
  document.getElementById('reschedPatientPhone').textContent = p.phone || 'No phone number';
  document.getElementById('reschedPatientBranch').textContent = (p.branch === 'KS01' || p.branch === 'KOTA SENTOSA') ? 'Kota Sentosa' : p.branch;
  document.getElementById('reschedOriginalSlot').textContent = `${apt.date} (${apt.time || '10:00'}) · ${(apt.pharmacist && !apt.pharmacist.includes('Ting')) ? apt.pharmacist : 'William Chai (Pharmacist)'}`;

  // Populate Inputs
  document.getElementById('reschedNewDate').value = apt.date || getTodayDateString(1);
  document.getElementById('reschedNewTime').value = apt.time || '10:00';

  const pharmSel = document.getElementById('reschedPharmacist');
  if (pharmSel) {
    let targetPharm = apt.pharmacist || '';
    if (targetPharm.includes('Ting') || !targetPharm) {
      targetPharm = 'William Chai (Pharmacist)';
    }
    let matched = false;
    for (let i = 0; i < pharmSel.options.length; i++) {
      if (pharmSel.options[i].value.toLowerCase().includes(targetPharm.toLowerCase())) {
        pharmSel.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      pharmSel.value = 'William Chai (Pharmacist)';
    }
  }

  document.getElementById('reschedReason').value = '';

  const langSel = document.getElementById('reschedLanguageSelect');
  if (langSel) {
    langSel.value = typeof getPatientLanguageByRace === 'function' ? getPatientLanguageByRace(p) : 'Chinese';
  }

  updateRescheduleMessagePreview();
  modal.classList.remove('hidden');

  if (directWa) {
    setTimeout(() => {
      document.getElementById('reschedMessagePreview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }
}

function closeRescheduleModal() {
  const modal = document.getElementById('rescheduleAppointmentModal');
  if (modal) modal.classList.add('hidden');
}

function setReschedQuickTime(timeStr) {
  const timeInput = document.getElementById('reschedNewTime');
  if (timeInput) {
    timeInput.value = timeStr;
    updateRescheduleMessagePreview();
  }
}

function buildRescheduleWhatsAppMessage(patient, originalApt, newDate, newTime, newPharm, reason, lang) {
  const patientName = patient?.name || 'Pelanggan';
  let rawBranch = patient?.branch || 'Kota Sentosa';
  const branchCode = typeof normalizeBranchCode === 'function' ? normalizeBranchCode(rawBranch) : 'Kota Sentosa';
  const branchInfo = BRANCH_SCHEDULES[branchCode] || BRANCH_SCHEDULES['Kota Sentosa'];
  const sched = typeof getPharmacistSchedule === 'function' ? getPharmacistSchedule(branchCode) : null;
  const branchName = sched ? (sched.branchName || branchInfo.name) : (branchInfo ? branchInfo.name : 'PMG Pharmacy Kota Sentosa');
  const dutyPharm = (newPharm && !newPharm.includes('Ting')) ? newPharm : ((originalApt?.pharmacist && !originalApt.pharmacist.includes('Ting')) ? originalApt.pharmacist : (sched ? sched.defaultPharmacist : 'William Chai (Pharmacist)'));
  const bookingUrl = typeof getPatientSelfBookingUrl === 'function' ? getPatientSelfBookingUrl(patient) : window.location.href;

  const origSlot = originalApt ? `${originalApt.date} (${originalApt.time || '10:00'})` : '原定时间';
  const reasonText = reason ? reason.trim() : '';

  if (lang === 'Chinese') {
    return `您好 *${patientName}*，这里是 *PMG Pharmacy (${branchName})*。

由于药剂师执勤排班调动（Shift Adjustment）${reasonText ? '（' + reasonText + '）' : ''}，您原定于 *${origSlot}* 的咨询/续药预约需要改期。

现为您调整安排至：
📅 *新预约日期：* ${newDate}
⏰ *新预约时间：* ${newTime}
👨‍⚕️ *主理药剂师：* ${dutyPharm}

如以上新时间方便您，请回复确认即可。
若此时间对您不便，您也可以点击以下专属预约链接，自行选择最方便您的日期与时间：
🔗 ${bookingUrl}

给您带来不便，我们深表歉意！感谢您的理解与支持。
祝您身体健康！
*PMG Pharmacy*`;
  } else if (lang === 'Malay') {
    return `Salam sejahtera *${patientName}*, kami dari *PMG Pharmacy (${branchName})*.

Harap maklum bahawa disebabkan perubahan jadual syif ahli farmasi kami (Shift Adjustment)${reasonText ? ' (' + reasonText + ')' : ''}, temujanji rundingan kesihatan/ulangan ubat anda yang asal pada *${origSlot}* perlu dijadualkan semula.

Kami cadangkan tarikh & masa baharu seperti berikut:
📅 *Tarikh Baharu:* ${newDate}
⏰ *Masa Baharu:* ${newTime}
👨‍⚕️ *Ahli Farmasi Bertugas:* ${dutyPharm}

Sekiranya masa ini sesuai, sila balas mesej ini untuk pengesahan.
Jika masa ini kurang sesuai, anda juga boleh klik pautan khas di bawah untuk memilih sendiri tarikh & masa yang paling mudah untuk anda:
🔗 ${bookingUrl}

Kami memohon maaf atas sebarang kesulitan. Terima kasih atas pemahaman anda!
Semoga sihat sejahtera,
*PMG Pharmacy*`;
  } else {
    // English
    return `Hello *${patientName}*, this is *PMG Pharmacy (${branchName})*.

Please be informed that due to a pharmacist duty shift adjustment${reasonText ? ' (' + reasonText + ')' : ''}, your consultation/refill appointment originally scheduled on *${origSlot}* needs to be rescheduled.

We have updated your tentative slot to:
📅 *New Date:* ${newDate}
⏰ *New Time:* ${newTime}
👨‍⚕️ *Duty Pharmacist:* ${dutyPharm}

If this updated time works for you, simply reply to confirm.
If you prefer a different slot, you can easily choose a convenient date and time using your personal booking link below:
🔗 ${bookingUrl}

We sincerely apologize for any inconvenience caused and appreciate your kind understanding.
Best regards,
*PMG Pharmacy*`;
  }
}

function updateRescheduleMessagePreview() {
  const previewEl = document.getElementById('reschedMessagePreview');
  if (!previewEl) return;

  const pId = document.getElementById('reschedPatientId')?.value;
  const aptId = document.getElementById('reschedAppointmentId')?.value;
  const p = patientsData.find(pt => pt.id === pId);
  const apt = p?.appointments?.find(a => a.id === aptId);

  const newDate = document.getElementById('reschedNewDate')?.value || getTodayDateString(1);
  const newTime = document.getElementById('reschedNewTime')?.value || '10:00';
  const newPharm = document.getElementById('reschedPharmacist')?.value || 'Duty Pharmacist';
  const reason = document.getElementById('reschedReason')?.value || '';
  const lang = document.getElementById('reschedLanguageSelect')?.value || 'Chinese';

  const msg = buildRescheduleWhatsAppMessage(p, apt, newDate, newTime, newPharm, reason, lang);
  previewEl.textContent = msg;
}

function saveReschedule(sendWhatsApp = false) {
  const pId = document.getElementById('reschedPatientId')?.value;
  const aptId = document.getElementById('reschedAppointmentId')?.value;
  const p = patientsData.find(pt => pt.id === pId);
  if (!p) {
    alert('Patient record not found.');
    return;
  }

  const apt = (p.appointments || []).find(a => a.id === aptId);
  if (!apt) {
    alert('Appointment record not found.');
    return;
  }

  const newDate = document.getElementById('reschedNewDate')?.value;
  const newTime = document.getElementById('reschedNewTime')?.value;
  const newPharm = document.getElementById('reschedPharmacist')?.value;
  const reason = document.getElementById('reschedReason')?.value?.trim();
  const lang = document.getElementById('reschedLanguageSelect')?.value || 'Chinese';

  if (!newDate) {
    alert('Please choose a valid new appointment date.');
    return;
  }
  if (!newTime) {
    alert('Please enter a valid appointment time slot.');
    return;
  }

  // Update appointment fields
  const oldSlot = `${apt.date} ${apt.time || ''}`;
  apt.date = newDate;
  apt.time = newTime;
  if (newPharm) apt.pharmacist = newPharm;

  if (reason) {
    apt.notes = (apt.notes ? apt.notes + ' · ' : '') + `[Rescheduled from ${oldSlot}: ${reason}]`;
  } else {
    apt.notes = (apt.notes ? apt.notes + ' · ' : '') + `[Rescheduled from ${oldSlot}]`;
  }

  if (apt.status !== 'Completed') {
    apt.status = 'Scheduled';
  }

  // Persist patient record
  savePatientsData();

  if (sendWhatsApp) {
    let cleanPhone = (p.phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);

    if (!cleanPhone) {
      alert('This patient does not have a recorded phone number for WhatsApp.');
    } else {
      const msg = buildRescheduleWhatsAppMessage(p, { date: oldSlot.split(' ')[0], time: oldSlot.split(' ')[1], pharmacist: apt.pharmacist }, newDate, newTime, newPharm, reason, lang);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }
  }

  closeRescheduleModal();
  renderPatientModule();

  if (typeof showPmgToast === 'function') {
    showPmgToast(`✅ Appointment for ${p.name} rescheduled to ${newDate} (${newTime})`, 'success');
  } else {
    alert(`Appointment for ${p.name} rescheduled to ${newDate} (${newTime}) successfully!`);
  }
}

function whatsappRescheduleCustomer(patientId, appointmentId) {
  openRescheduleModal(patientId, appointmentId, true);
}

// ─── MALAYSIAN IC AUTO AGE & GENDER PARSER ──────────────────────────────────
function onPatientIcInput(icVal) {
  if (!icVal) return;
  const clean = String(icVal).replace(/\D/g, '');
  if (clean.length >= 6) {
    const yy = parseInt(clean.substring(0, 2), 10);
    const mm = parseInt(clean.substring(2, 4), 10);
    const dd = parseInt(clean.substring(4, 6), 10);

    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentYY = currentYear % 100;
      const birthYear = (yy > currentYY) ? (1900 + yy) : (2000 + yy);

      let age = currentYear - birthYear;
      if (now.getMonth() < (mm - 1) || (now.getMonth() === (mm - 1) && now.getDate() < dd)) {
        age--;
      }

      if (age >= 0 && age <= 130) {
        const ageInput = document.getElementById('newPatientAge');
        if (ageInput) ageInput.value = age;
      }
    }
  }

  // Detect gender from 12th digit (last digit of Malaysian MyKad)
  if (clean.length >= 12) {
    const lastDigit = parseInt(clean.charAt(11), 10);
    const genderSel = document.getElementById('newPatientGender');
    if (genderSel && !isNaN(lastDigit)) {
      genderSel.value = (lastDigit % 2 === 1) ? 'Male' : 'Female';
    }
  }
}

// ─── NEW / EDIT PATIENT MODAL ────────────────────────────────────────────────
let editingPatientId = null;
let returnToProfilePatientId = null;

function showNewPatientModal() {
  editingPatientId = null;
  returnToProfilePatientId = null;
  const modal = document.getElementById('patientNewModal');
  if (!modal) return;

  const titleEl = document.getElementById('patientNewModalTitle');
  if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-user-plus text-blue-700"></i> Register New Patient Profile';

  const saveBtn = document.getElementById('patientNewModalSaveBtn');
  if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> Save Patient Profile';

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
    const rawBranch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'Kota Sentosa';
    branchSel.value = normalizeBranchCode(rawBranch);
  }

  document.querySelectorAll('.patient-cond-cb').forEach(cb => cb.checked = false);
  modal.classList.remove('hidden');
}

function editPatientProfile(patientId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) return;

  // Immediately close patient profile modal so the edit form is fully visible
  const profModal = document.getElementById('patientProfileModal');
  if (profModal && !profModal.classList.contains('hidden')) {
    returnToProfilePatientId = patientId;
    profModal.classList.add('hidden');
  }

  editingPatientId = patientId;
  const modal = document.getElementById('patientNewModal');
  if (!modal) return;

  const titleEl = document.getElementById('patientNewModalTitle');
  if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-pen text-amber-600"></i> Edit Patient Profile (${escHtml(p.name)})`;

  const saveBtn = document.getElementById('patientNewModalSaveBtn');
  if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Update Profile';

  document.getElementById('newPatientName').value = p.name || '';
  document.getElementById('newPatientIc').value = p.ic || '';
  document.getElementById('newPatientPhone').value = p.phone || '';
  document.getElementById('newPatientGender').value = p.gender || 'Male';
  document.getElementById('newPatientAge').value = p.age || '';
  document.getElementById('newPatientRace').value = p.race || 'Chinese';
  document.getElementById('newPatientLanguage').value = p.language || 'Chinese';
  document.getElementById('newPatientAllergies').value = p.allergies || '';
  document.getElementById('newPatientNotes').value = p.notes || '';

  const branchSel = document.getElementById('newPatientBranch');
  if (branchSel && p.branch) branchSel.value = p.branch;

  const pConds = Array.isArray(p.conditions) ? p.conditions : (Array.isArray(p.chronicConditions) ? p.chronicConditions : []);
  document.querySelectorAll('.patient-cond-cb').forEach(cb => {
    cb.checked = pConds.includes(cb.value);
  });

  modal.classList.remove('hidden');
}

function editCurrentPatientProfile() {
  if (typeof viewingPatientId !== 'undefined' && viewingPatientId) {
    editPatientProfile(viewingPatientId);
  } else {
    alert('No patient profile currently open.');
  }
}

function closeNewPatientModal() {
  const modal = document.getElementById('patientNewModal');
  if (modal) modal.classList.add('hidden');
  editingPatientId = null;

  // Seamlessly restore profile modal if user came from profile view
  if (returnToProfilePatientId) {
    const pid = returnToProfilePatientId;
    returnToProfilePatientId = null;
    viewPatientProfile(pid);
  }
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

  const ic = document.getElementById('newPatientIc').value.trim();
  const gender = document.getElementById('newPatientGender').value;
  const age = Number(document.getElementById('newPatientAge').value) || 0;
  const race = document.getElementById('newPatientRace').value;
  const language = document.getElementById('newPatientLanguage').value;
  const branch = normalizeBranchCode(document.getElementById('newPatientBranch').value || 'Kota Sentosa');
  const allergies = document.getElementById('newPatientAllergies').value.trim();
  const notes = document.getElementById('newPatientNotes').value.trim();

  if (editingPatientId) {
    const p = patientsData.find(pt => pt.id === editingPatientId);
    if (p) {
      p.name = name;
      p.ic = ic;
      p.phone = phone;
      p.gender = gender;
      p.age = age;
      p.race = race;
      p.language = language;
      p.branch = branch;
      p.conditions = conditions;
      p.chronicConditions = conditions;
      p.allergies = allergies;
      p.notes = notes;
      p.updatedAt = new Date().toISOString();

      savePatientsData();
      const pidToReturn = returnToProfilePatientId || editingPatientId;
      returnToProfilePatientId = null;
      editingPatientId = null;
      closeNewPatientModal();
      renderPatientModule();

      if (pidToReturn) {
        viewPatientProfile(pidToReturn);
      }
      if (typeof showPmgToast === 'function') {
        showPmgToast(`✅ Profile for ${p.name} updated successfully!`, 'success');
      } else {
        alert(`Profile for ${p.name} updated successfully!`);
      }
      return;
    }
  }

  const newId = 'PT-' + (1000 + patientsData.length + 1);
  const newPatient = {
    id: newId,
    name,
    ic,
    phone,
    gender,
    age,
    race,
    language,
    branch,
    conditions,
    allergies,
    notes,
    createdAt: getTodayDateString(0),
    encounters: [],
    medications: [],
    appointments: []
  };

  patientsData.unshift(newPatient);
  savePatientsData();
  closeNewPatientModal();
  renderPatientModule();
  if (typeof showPmgToast === 'function') {
    showPmgToast(`✅ Patient ${newPatient.name} registered!`, 'success');
  }
}

// ─── CLINICAL ENCOUNTER (SOAP + POCT) MODAL ──────────────────────────────────
let editingEncounterId = null;

function showNewEncounterModal(patientId) {
  editingEncounterId = null;
  const modal = document.getElementById('patientEncounterModal');
  if (!modal) return;

  const titleEl = document.getElementById('patientEncounterModalTitle');
  if (titleEl) {
    titleEl.innerHTML = '<i class="fa-solid fa-notes-medical text-teal-600"></i> Pharmacist Clinical Encounter & POCT Suite';
  }

  const saveBtn = document.getElementById('encModalSaveBtn');
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-1.5"></i> Save Clinical Encounter';
  }

  const selectEl = document.getElementById('encounterPatientSelect');
  if (selectEl) {
    selectEl.disabled = false;
    selectEl.innerHTML = patientsData.map(p => `
      <option value="${p.id}" ${patientId === p.id ? 'selected' : ''}>${p.name} (${p.branch} · ${p.phone || 'No phone'})</option>
    `).join('');
  }

  // Reset form fields
  document.getElementById('encDate').value = getTodayDateString(0);
  document.getElementById('encChiefComplaint').value = '';
  document.getElementById('encHpi').value = '';
  if (document.getElementById('encMedicalHistory')) document.getElementById('encMedicalHistory').value = '';

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

  // BCA (Body Composition Analysis)
  if (document.getElementById('encBodyFat')) document.getElementById('encBodyFat').value = '';
  if (document.getElementById('encVisceralFat')) document.getElementById('encVisceralFat').value = '';
  if (document.getElementById('encMuscleMass')) document.getElementById('encMuscleMass').value = '';
  if (document.getElementById('encMetabolicAge')) document.getElementById('encMetabolicAge').value = '';
  if (document.getElementById('encBmrWater')) document.getElementById('encBmrWater').value = '';

  // Specialty Scans
  document.getElementById('encVitD').value = '';
  document.getElementById('encFerritin').value = '';
  document.getElementById('encTeda').value = '';
  if (document.getElementById('encTedaLink')) document.getElementById('encTedaLink').value = '';
  const tedaBtn = document.getElementById('openTedaLinkBtn');
  if (tedaBtn) tedaBtn.classList.add('hidden');
  const tedaStatus = document.getElementById('tedaFetchStatus');
  if (tedaStatus) { tedaStatus.textContent = ''; tedaStatus.className = 'text-[10px] text-amber-700 font-medium'; }
  const tedaDetails = document.getElementById('encTedaDetailsBadge');
  if (tedaDetails) tedaDetails.classList.add('hidden');
  window._cachedTedaReport = null;
  removeAirdocFile();
  removeCgmFile();
  removeZentalogFile();
  document.getElementById('encRossmaxAct').value = '';

  // Plan
  document.getElementById('encPreDiag').value = '';
  document.getElementById('encPlanMeds').value = '';
  document.getElementById('encPlanSupps').value = '';
  document.getElementById('encPlanCounselling').value = '';
  document.getElementById('encReferral').value = '';

  // Next TCA (Date Reminder)
  document.getElementById('encTcaDate').value = '';
  const encTcaTimeEl = document.getElementById('encTcaTime');
  if (encTcaTimeEl) encTcaTimeEl.value = '10:00';
  document.getElementById('encTcaPurpose').value = 'Chronic Medication Refill & Health Review';

  // If patientId is provided, pre-fill medications & supplements & medical history if available
  const pTarget = patientsData.find(pt => pt.id === patientId);
  if (pTarget) {
    if (document.getElementById('encMedicalHistory')) {
      if (pTarget.medicalHistory) {
        document.getElementById('encMedicalHistory').value = pTarget.medicalHistory;
      } else {
        const histParts = [];
        const pConds = Array.isArray(pTarget.conditions) ? pTarget.conditions : (Array.isArray(pTarget.chronicConditions) ? pTarget.chronicConditions : []);
        if (pConds.length) histParts.push('Chronic Illnesses: ' + pConds.join(', '));
        if (pTarget.allergies) histParts.push('Allergies: ' + pTarget.allergies);
        if (pTarget.notes) histParts.push('Notes: ' + pTarget.notes);
        if (histParts.length) document.getElementById('encMedicalHistory').value = histParts.join('\n');
      }
    }

    if (pTarget.medications && pTarget.medications.length) {
      document.getElementById('encPlanMeds').value = pTarget.medications.map(m => typeof m === 'string' ? m : `${m.name} ${m.dosage || ''}`.trim()).join('\n');
    } else if (pTarget.encounters && pTarget.encounters.length && pTarget.encounters[0].planMedications) {
      document.getElementById('encPlanMeds').value = pTarget.encounters[0].planMedications;
    }

    if (pTarget.encounters && pTarget.encounters.length && pTarget.encounters[0].planSupplements) {
      document.getElementById('encPlanSupps').value = pTarget.encounters[0].planSupplements;
    }

    if (pTarget.nextTcaDate) {
      document.getElementById('encTcaDate').value = pTarget.nextTcaDate;
    }
    if (pTarget.nextTcaPurpose) {
      document.getElementById('encTcaPurpose').value = pTarget.nextTcaPurpose;
    }
  }

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

function prefillMedicalHistoryFromProfile() {
  const patientSelect = document.getElementById('encounterPatientSelect');
  if (!patientSelect) return;
  const patientId = patientSelect.value;
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) {
    if (typeof showPmgToast === 'function') showPmgToast('No patient selected', 'warning');
    return;
  }
  const histEl = document.getElementById('encMedicalHistory');
  if (!histEl) return;

  if (p.medicalHistory) {
    histEl.value = p.medicalHistory;
    if (typeof showPmgToast === 'function') showPmgToast('Synced medical history from profile', 'success');
    return;
  }

  const parts = [];
  const pConds = Array.isArray(p.conditions) ? p.conditions : (Array.isArray(p.chronicConditions) ? p.chronicConditions : []);
  if (pConds && pConds.length) parts.push('Chronic Illnesses: ' + pConds.join(', '));
  if (p.allergies) parts.push('Allergies: ' + p.allergies);
  if (p.notes) parts.push('Notes: ' + p.notes);

  if (parts.length) {
    histEl.value = parts.join('\n');
    if (typeof showPmgToast === 'function') showPmgToast('Synced medical history from profile', 'success');
  } else {
    if (typeof showPmgToast === 'function') showPmgToast('No medical history or conditions recorded in profile yet', 'info');
  }
}

function editEncounterRecord(patientId, encounterId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p || !p.encounters) return;
  const enc = p.encounters.find(e => e.id === encounterId);
  if (!enc) return;

  // Immediately close patient profile modal so the edit form is fully visible
  const profModal = document.getElementById('patientProfileModal');
  if (profModal && !profModal.classList.contains('hidden')) {
    returnToProfilePatientId = patientId;
    profModal.classList.add('hidden');
  }

  editingEncounterId = encounterId;
  const modal = document.getElementById('patientEncounterModal');
  if (!modal) return;

  const titleEl = document.getElementById('patientEncounterModalTitle');
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-600"></i> Edit Clinical Encounter (SOAP) · ${enc.date}`;
  }
  const saveBtn = document.getElementById('encModalSaveBtn');
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Update Clinical Encounter';
  }

  const selectEl = document.getElementById('encounterPatientSelect');
  if (selectEl) {
    selectEl.innerHTML = `<option value="${p.id}" selected>${p.name} (${p.branch} · ${p.phone || 'No phone'})</option>`;
    selectEl.disabled = true;
  }

  // Pre-fill fields
  document.getElementById('encDate').value = enc.date || getTodayDateString(0);
  document.getElementById('encChiefComplaint').value = enc.chiefComplaint || '';
  document.getElementById('encHpi').value = enc.hpi || '';
  if (document.getElementById('encMedicalHistory')) {
    document.getElementById('encMedicalHistory').value = enc.medicalHistory || p.medicalHistory || '';
  }

  // Vitals
  const v = enc.vitals || {};
  document.getElementById('encBpSys').value = v.bpSys ?? '';
  document.getElementById('encBpDia').value = v.bpDia ?? '';
  document.getElementById('encPulse').value = v.pulse ?? '';
  document.getElementById('encSpo2').value = v.spo2 ?? '';
  document.getElementById('encWeight').value = v.weight ?? '';
  document.getElementById('encHeight').value = v.height ?? '';
  document.getElementById('encBmi').value = v.bmi ?? '';

  // Body Composition
  const b = enc.bodyComposition || {};
  if (document.getElementById('encBodyFat')) document.getElementById('encBodyFat').value = b.bodyFat ?? '';
  if (document.getElementById('encVisceralFat')) document.getElementById('encVisceralFat').value = b.visceralFat ?? '';
  if (document.getElementById('encMuscleMass')) document.getElementById('encMuscleMass').value = b.muscleMass ?? '';
  if (document.getElementById('encMetabolicAge')) document.getElementById('encMetabolicAge').value = b.metabolicAge ?? '';
  if (document.getElementById('encBmrWater')) document.getElementById('encBmrWater').value = b.bmrWater || '';

  // Lipid
  const l = enc.lipidPanel || {};
  document.getElementById('encTc').value = l.tc ?? '';
  document.getElementById('encTg').value = l.tg ?? '';
  document.getElementById('encHdl').value = l.hdl ?? '';
  document.getElementById('encLdl').value = l.ldl ?? '';
  document.getElementById('encAi').value = l.ai ?? '';
  document.getElementById('encRchd').value = l.rChd ?? '';

  // Liver
  const liv = enc.liverPanel || {};
  document.getElementById('encAst').value = liv.ast ?? '';
  document.getElementById('encAlt').value = liv.alt ?? '';
  document.getElementById('encAlb').value = liv.alb ?? '';

  // Kidney
  const k = enc.kidneyPanel || {};
  document.getElementById('encUa').value = k.ua ?? '';
  document.getElementById('encCreatinine').value = k.creatinine ?? '';
  document.getElementById('encUrea').value = k.urea ?? '';
  document.getElementById('encEgfr').value = k.egfr ?? '';

  // Glycemic & Heme
  const g = enc.glycemicHeme || {};
  document.getElementById('encGlucose').value = g.glucose ?? '';
  if (g.glucoseType) document.getElementById('encGlucoseType').value = g.glucoseType;
  document.getElementById('encHba1c').value = g.hba1c ?? '';
  document.getElementById('encHb').value = g.hb ?? '';
  document.getElementById('encHct').value = g.hct ?? '';

  // Specialty
  const sp = enc.specialtyScans || {};
  document.getElementById('encVitD').value = sp.vitD || '';
  document.getElementById('encFerritin').value = sp.ferritin || '';
  document.getElementById('encTeda').value = sp.teda || '';
  if (document.getElementById('encTedaLink')) {
    document.getElementById('encTedaLink').value = sp.tedaLink || (sp.teda && sp.teda.startsWith('http') ? sp.teda : '');
  }
  document.getElementById('encRossmaxAct').value = sp.rossmaxAct || '';

  removeAirdocFile();
  removeCgmFile();
  removeZentalogFile();

  if (sp.airdoc) {
    const badgeEl = document.getElementById('encAirdocBadge');
    if (badgeEl) badgeEl.innerHTML = `<span class="text-indigo-700 font-bold">Saved: ${escHtml(sp.airdoc)}</span>`;
  }
  if (sp.cgm) {
    const badgeEl = document.getElementById('encCgmBadge');
    if (badgeEl) badgeEl.innerHTML = `<span class="text-teal-700 font-bold">Saved: ${escHtml(sp.cgm)}</span>`;
  }
  if (sp.zentalog) {
    const badgeEl = document.getElementById('encZentalogBadge');
    if (badgeEl) badgeEl.innerHTML = `<span class="text-amber-700 font-bold">Saved: ${escHtml(sp.zentalog)}</span>`;
  }

  // Plan
  document.getElementById('encPreDiag').value = enc.preDiagnostic || '';
  document.getElementById('encPlanMeds').value = enc.planMedications || '';
  document.getElementById('encPlanSupps').value = enc.planSupplements || '';
  document.getElementById('encPlanCounselling').value = enc.planCounselling || '';
  document.getElementById('encReferral').value = enc.referral || '';

  // Next TCA
  document.getElementById('encTcaDate').value = enc.nextTcaDate || '';
  document.getElementById('encTcaPurpose').value = enc.nextTcaPurpose || 'Chronic Medication Refill & Health Review';

  tempAttachedFiles = [];
  renderTempAttachedFiles();

  modal.classList.remove('hidden');
}

function closeEncounterModal() {
  const modal = document.getElementById('patientEncounterModal');
  if (modal) modal.classList.add('hidden');
  editingEncounterId = null;
  const selectEl = document.getElementById('encounterPatientSelect');
  if (selectEl) selectEl.disabled = false;

  // Seamlessly restore profile modal if user came from profile view
  if (returnToProfilePatientId) {
    const pid = returnToProfilePatientId;
    returnToProfilePatientId = null;
    viewPatientProfile(pid);
  }
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

// ─── TEDA LINK & AUTO-DECRYPTION HELPERS ───────────────────────────────────────
function extractTedaRid(urlOrText) {
  if (!urlOrText) return '';
  const match = urlOrText.match(/rid=([a-f0-9\-]{32,36})/i);
  if (match) return match[1];
  const rawMatch = urlOrText.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (rawMatch) return rawMatch[1];
  return '';
}

function checkTedaUrl(url) {
  const btn = document.getElementById('openTedaLinkBtn');
  if (btn) {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }
  const rid = extractTedaRid(url);
  const statusEl = document.getElementById('tedaFetchStatus');
  if (rid && statusEl && !window._cachedTedaReport) {
    statusEl.textContent = 'Report ID detected. Click "Auto-Analyze Link" to load.';
  }
}

function openTedaLink() {
  const linkEl = document.getElementById('encTedaLink');
  let url = linkEl ? linkEl.value.trim() : '';
  if (!url) {
    const tedaEl = document.getElementById('encTeda');
    const tedaVal = tedaEl ? tedaEl.value.trim() : '';
    if (tedaVal.startsWith('http://') || tedaVal.startsWith('https://')) {
      url = tedaVal;
    }
  }
  if (url) window.open(url, '_blank');
}

function appendTedaTag(tag) {
  const el = document.getElementById('encTeda');
  if (!el) return;
  const current = el.value.trim();
  if (!current) {
    el.value = tag;
  } else if (!current.includes(tag)) {
    el.value = `${current}\n• ${tag}`;
  }
}

// Protobuf wire format decoder for ReportResult message (field 1: data, field 2: key)
function decodeTedaProtobuf(uint8) {
  let pos = 0;
  let cipherData = null;
  let cipherKey = null;
  while (pos < uint8.length) {
    const tag = uint8[pos++];
    const wireType = tag & 0x07;
    const fieldNum = tag >> 3;
    if (wireType !== 2) {
      if (wireType === 0) { while ((uint8[pos++] & 0x80) !== 0); }
      else if (wireType === 1) { pos += 8; }
      else if (wireType === 5) { pos += 4; }
      else throw new Error('Unsupported wire type: ' + wireType);
      continue;
    }
    let len = 0, shift = 0;
    while (true) {
      const b = uint8[pos++];
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    const bytes = uint8.subarray(pos, pos + len);
    pos += len;
    if (fieldNum === 1) cipherData = bytes;
    else if (fieldNum === 2) cipherKey = bytes;
  }
  return { cipherData, cipherKey };
}

function u8ToCryptoJsWordArray(u8) {
  const words = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

function hexToUtf8String(hexStr) {
  const cleanHex = hexStr.replace(/\s|0x/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

async function fetchAndDecryptTedaReport(rid) {
  if (typeof CryptoJS === 'undefined') {
    throw new Error('CryptoJS library is not loaded. Please ensure internet connectivity to load CryptoJS.');
  }

  const endpoint = `https://sg-app.qiaolz.com/report/result2?rid=${encodeURIComponent(rid)}&mac=&lang=&v=3.0.0`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': '*/*'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch TEDA report (HTTP ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('Received empty response from TEDA server.');
  }

  const uint8 = new Uint8Array(arrayBuffer);
  const { cipherData, cipherKey } = decodeTedaProtobuf(uint8);
  if (!cipherData || !cipherKey) {
    throw new Error('Invalid TEDA report payload structure.');
  }

  // Step 1: Decrypt inner key using AES-256-ECB with a0 (rid without dashes)
  const a0Str = rid.replace(/-/g, '');
  const a0Key = CryptoJS.enc.Utf8.parse(a0Str);
  const keyWA = u8ToCryptoJsWordArray(cipherKey);
  const decKeyRes = CryptoJS.AES.decrypt(
    { ciphertext: keyWA },
    a0Key,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  const innerKeyStr = hexToUtf8String(decKeyRes.toString());

  // Step 2: Decrypt data using DES-ECB with innerKeyStr
  const dataWA = u8ToCryptoJsWordArray(cipherData);
  const innerKeyWA = CryptoJS.enc.Utf8.parse(innerKeyStr);
  const decDataRes = CryptoJS.DES.decrypt(
    { ciphertext: dataWA },
    innerKeyWA,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  const reportJsonStr = hexToUtf8String(decDataRes.toString());
  const reportWrapper = JSON.parse(reportJsonStr);
  const r = reportWrapper.data || reportWrapper;

  // Process & structure the clinical report
  const structured = {
    rid,
    advice: r.advice || '',
    immunityScore: r.score1 != null ? r.score1 : '',
    healthScore: r.score2 != null ? r.score2 : '',
    reportDate: r.timeStr || '',
    zangfuSummary: '',
    tizhiSummary: '',
    jingluoSummary: '',
    jizhuSummary: '',
    subHealthZangfu: [],
    subHealthTizhi: [],
    blockedJingluo: [],
    spinePressure: [],
    raw: r
  };

  if (Array.isArray(r.itemList)) {
    r.itemList.forEach(sec => {
      if (sec.alias === 'zangfu') {
        structured.zangfuSummary = sec.itemName || '';
        if (sec.items) {
          structured.subHealthZangfu = sec.items.filter(it => it.levelText === '亚健康' || (it.score != null && it.score < 7.0));
        }
      } else if (sec.alias === 'qixue') {
        structured.tizhiSummary = sec.itemName || '';
        if (sec.items) {
          structured.subHealthTizhi = sec.items.filter(it => it.levelText === '亚健康' || (it.score != null && it.score < 7.0));
        }
      } else if (sec.alias === 'jingluo') {
        structured.jingluoSummary = sec.itemName || '';
        if (sec.items) {
          structured.blockedJingluo = sec.items.filter(it => it.levelText === '亚健康' || (it.score != null && it.score < 7.0));
        }
      } else if (sec.alias === 'jizhu') {
        structured.jizhuSummary = sec.itemName || '';
        if (sec.items) {
          structured.spinePressure = sec.items.filter(it => (it.score != null && it.score < 7.0));
        }
      }
    });
  }

  return structured;
}

async function autoAnalyzeTedaLink() {
  const linkEl = document.getElementById('encTedaLink');
  const rawUrl = linkEl ? linkEl.value.trim() : '';
  const statusEl = document.getElementById('tedaFetchStatus');
  const btn = document.getElementById('fetchTedaBtn');

  const rid = extractTedaRid(rawUrl);
  if (!rid) {
    alert('Please paste a valid TEDA WellScan report link or Report ID (containing "rid=...").\n\nExample: https://sg-report.qiaolz.com/#/pages/reportTv/reportTvMain?rid=3d07d3b7-0267-43ca-8d6b-a350c39f8cdb&lang=');
    if (linkEl) linkEl.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Decrypting...';
  }
  if (statusEl) {
    statusEl.className = 'text-[10px] text-amber-700 font-medium';
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching & decrypting online report…';
  }

  try {
    const report = await fetchAndDecryptTedaReport(rid);
    window._cachedTedaReport = report;

    // Build human-readable clinical summary for textarea
    const lines = [];
    lines.push(`【TEDA 中医脉诊经络健康评估 · 报告日期: ${report.reportDate || '最新'}】`);
    if (report.immunityScore || report.healthScore) {
      const immVal = Number(report.immunityScore);
      const immNote = (!isNaN(immVal) && immVal < 50) ? '【亚健康/偏低，需强化免疫】' : '【正常/良好】';
      lines.push(`• 综合指数: 免疫力指数 ${report.immunityScore}分 ${immNote} | 健康指数 ${report.healthScore}分`);
    }
    if (report.advice) {
      lines.push(`• 核心调理原则: ${report.advice}`);
    }
    if (report.subHealthZangfu.length > 0) {
      const zfList = report.subHealthZangfu.map(it => `${it.name} ${it.score}分${it.wuxing ? `(${it.wuxing})` : ''}`).join('、');
      lines.push(`• 脏腑辩证 (亚健康): ${zfList}`);
    } else if (report.zangfuSummary) {
      lines.push(`• 脏腑辩证: ${report.zangfuSummary}`);
    }

    if (report.subHealthTizhi.length > 0) {
      const tzList = report.subHealthTizhi.map(it => `${it.name} ${it.score}分`).join('、');
      lines.push(`• 气血体质 (偏颇): ${tzList}`);
    } else if (report.tizhiSummary) {
      lines.push(`• 气血体质: ${report.tizhiSummary}`);
    }

    if (report.blockedJingluo.length > 0) {
      const jlList = report.blockedJingluo.map(it => `${it.name} ${it.score}分`).join('、');
      lines.push(`• 经络淤堵: ${jlList}`);
    } else if (report.jingluoSummary) {
      lines.push(`• 经络状态: ${report.jingluoSummary}`);
    }

    if (report.spinePressure.length > 0) {
      const spList = report.spinePressure.slice(0, 5).map(it => `${it.name} ${it.score}分`).join('、');
      lines.push(`• 脊柱压力: ${spList}`);
    }

    const tedaTextEl = document.getElementById('encTeda');
    if (tedaTextEl) {
      tedaTextEl.value = lines.join('\n');
    }

    // Populate visual quick badges
    const badgeContainer = document.getElementById('encTedaDetailsBadge');
    const immunityBadge = document.getElementById('tedaImmunityBadge');
    const principleBadge = document.getElementById('tedaPrincipleBadge');
    const zangfuText = document.getElementById('tedaZangfuText');
    const tizhiText = document.getElementById('tedaTizhiText');
    const jingluoText = document.getElementById('tedaJingluoText');

    if (badgeContainer) badgeContainer.classList.remove('hidden');
    if (immunityBadge) {
      const imm = Number(report.immunityScore);
      const isSuboptimal = !isNaN(imm) && imm < 50;
      const color = isSuboptimal ? 'text-rose-600' : 'text-emerald-600';
      const label = isSuboptimal ? '(亚健康/偏低)' : '(良好/正常)';
      immunityBadge.innerHTML = `Immunity: <span class="${color} font-black">${report.immunityScore}</span>/100 ${label} · Health: <span class="font-black">${report.healthScore}</span>/100`;
    }
    if (principleBadge) {
      principleBadge.textContent = report.advice ? (report.advice.match(/【(.*?)】/)?.[0] || '亚健康调理') : 'TEDA Verified';
    }
    if (zangfuText) {
      zangfuText.textContent = report.subHealthZangfu.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', ') || 'Normal';
    }
    if (tizhiText) {
      tizhiText.textContent = report.subHealthTizhi.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', ') || 'Balanced';
    }
    if (jingluoText) {
      jingluoText.textContent = report.blockedJingluo.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', ') || 'Smooth';
    }

    if (statusEl) {
      statusEl.className = 'text-[10px] text-emerald-700 font-bold';
      statusEl.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600"></i> Online Report Decrypted & Loaded';
    }

    checkTedaUrl(rawUrl);

  } catch (err) {
    console.warn('[TEDA Auto-Analyze Notice]', err);
    if (statusEl) {
      statusEl.className = 'text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-300 font-medium leading-tight';
      statusEl.innerHTML = `
        <div class="flex items-center gap-1.5 text-emerald-700 font-bold mb-0.5">
          <i class="fa-solid fa-circle-check text-emerald-600"></i> TEDA Link Attached &amp; Saved (ID: <code>${rid.slice(0, 8)}...</code>)
        </div>
        <div class="text-[10px] text-gray-600">
          Due to server anti-hotlinking, click <b>"Open TEDA Report"</b> to view in full TV mode, or tap quick TCM tags below.
        </div>
      `;
    }

    // Pre-fill encounter notes with the report link so it is permanently recorded
    const tedaTextEl = document.getElementById('encTeda');
    if (tedaTextEl && !tedaTextEl.value.trim()) {
      tedaTextEl.value = `【TEDA 中医脉诊经络健康评估】\n• 报告编号: ${rid}\n• 在线报告链接: ${rawUrl}`;
    }

    checkTedaUrl(rawUrl);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bolt text-yellow-300"></i> Auto-Analyze Link';
    }
  }
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

// ─── CGM (CONTINUOUS GLUCOSE MONITORING) PDF HELPERS ───────────────────────
let selectedCgmFile = null;

function handleCgmFile(files) {
  if (!files || !files[0]) return;
  selectedCgmFile = files[0];
  const nameEl = document.getElementById('encCgmFileName');
  const badgeEl = document.getElementById('encCgmBadge');
  const removeBtn = document.getElementById('encCgmRemoveBtn');

  if (nameEl) nameEl.textContent = `${selectedCgmFile.name} (${formatFileSize(selectedCgmFile.size)})`;
  if (badgeEl) badgeEl.innerHTML = '<span class="text-teal-700 font-bold">CGM PDF Ready</span>';
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function removeCgmFile() {
  selectedCgmFile = null;
  const fileInput = document.getElementById('encCgmPdf');
  if (fileInput) fileInput.value = '';
  const nameEl = document.getElementById('encCgmFileName');
  if (nameEl) nameEl.textContent = '';
  const badgeEl = document.getElementById('encCgmBadge');
  if (badgeEl) badgeEl.textContent = 'No PDF selected';
  const removeBtn = document.getElementById('encCgmRemoveBtn');
  if (removeBtn) removeBtn.classList.add('hidden');
}

// ─── ZENTALOG DIET & HOME LOG PDF HELPERS ──────────────────────────────────
let selectedZentalogFile = null;

function handleZentalogFile(files) {
  if (!files || !files[0]) return;
  selectedZentalogFile = files[0];
  const nameEl = document.getElementById('encZentalogFileName');
  const badgeEl = document.getElementById('encZentalogBadge');
  const removeBtn = document.getElementById('encZentalogRemoveBtn');

  if (nameEl) nameEl.textContent = `${selectedZentalogFile.name} (${formatFileSize(selectedZentalogFile.size)})`;
  if (badgeEl) badgeEl.innerHTML = '<span class="text-amber-700 font-bold">Zentalog PDF Ready</span>';
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function removeZentalogFile() {
  selectedZentalogFile = null;
  const fileInput = document.getElementById('encZentalogPdf');
  if (fileInput) fileInput.value = '';
  const nameEl = document.getElementById('encZentalogFileName');
  if (nameEl) nameEl.textContent = '';
  const badgeEl = document.getElementById('encZentalogBadge');
  if (badgeEl) badgeEl.textContent = 'No PDF selected';
  const removeBtn = document.getElementById('encZentalogRemoveBtn');
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

  // Save CGM PDF into IndexedDB if attached
  if (selectedCgmFile) {
    try {
      const savedCgm = await savePatientDocument(pId, selectedCgmFile, 'CGM Glucose Report (' + document.getElementById('encDate').value + ')');
      attachedDocIds.push({ id: savedCgm.id, name: '[CGM Report] ' + savedCgm.name, size: savedCgm.size });
    } catch (err) {
      console.error('Error saving CGM PDF to IndexedDB:', err);
    }
  }

  // Save Zentalog PDF into IndexedDB if attached
  if (selectedZentalogFile) {
    try {
      const savedZenta = await savePatientDocument(pId, selectedZentalogFile, 'Zentalog Diet & Home Report (' + document.getElementById('encDate').value + ')');
      attachedDocIds.push({ id: savedZenta.id, name: '[Zentalog Report] ' + savedZenta.name, size: savedZenta.size });
    } catch (err) {
      console.error('Error saving Zentalog PDF to IndexedDB:', err);
    }
  }

  const encDateVal = document.getElementById('encDate').value || getTodayDateString(0);
  const chiefComplaintVal = document.getElementById('encChiefComplaint').value.trim();
  const hpiVal = document.getElementById('encHpi').value.trim();
  const medHistoryVal = document.getElementById('encMedicalHistory') ? document.getElementById('encMedicalHistory').value.trim() : '';
  if (medHistoryVal) {
    p.medicalHistory = medHistoryVal;
  }

  const vitalsObj = {
    bpSys: Number(document.getElementById('encBpSys').value) || null,
    bpDia: Number(document.getElementById('encBpDia').value) || null,
    pulse: Number(document.getElementById('encPulse').value) || null,
    spo2: Number(document.getElementById('encSpo2').value) || null,
    weight: Number(document.getElementById('encWeight').value) || null,
    height: Number(document.getElementById('encHeight').value) || null,
    bmi: Number(document.getElementById('encBmi').value) || null
  };

  const bcaObj = {
    bodyFat: Number(document.getElementById('encBodyFat')?.value) || null,
    visceralFat: Number(document.getElementById('encVisceralFat')?.value) || null,
    muscleMass: Number(document.getElementById('encMuscleMass')?.value) || null,
    metabolicAge: Number(document.getElementById('encMetabolicAge')?.value) || null,
    bmrWater: document.getElementById('encBmrWater') ? document.getElementById('encBmrWater').value.trim() : ''
  };

  const lipidObj = {
    tc: Number(document.getElementById('encTc').value) || null,
    tg: Number(document.getElementById('encTg').value) || null,
    hdl: Number(document.getElementById('encHdl').value) || null,
    ldl: Number(document.getElementById('encLdl').value) || null,
    ai: Number(document.getElementById('encAi').value) || null,
    rChd: Number(document.getElementById('encRchd').value) || null
  };

  const liverObj = {
    ast: Number(document.getElementById('encAst').value) || null,
    alt: Number(document.getElementById('encAlt').value) || null,
    alb: Number(document.getElementById('encAlb').value) || null
  };

  const kidneyObj = {
    ua: Number(document.getElementById('encUa').value) || null,
    creatinine: Number(document.getElementById('encCreatinine').value) || null,
    urea: Number(document.getElementById('encUrea').value) || null,
    egfr: Number(document.getElementById('encEgfr').value) || null
  };

  const glycemicObj = {
    glucose: Number(document.getElementById('encGlucose').value) || null,
    glucoseType: document.getElementById('encGlucoseType').value,
    hba1c: Number(document.getElementById('encHba1c').value) || null,
    hb: Number(document.getElementById('encHb').value) || null,
    hct: Number(document.getElementById('encHct').value) || null
  };

  const specialtyObj = {
    vitD: document.getElementById('encVitD').value || null,
    ferritin: document.getElementById('encFerritin').value || null,
    teda: document.getElementById('encTeda').value.trim() || null,
    tedaLink: document.getElementById('encTedaLink') ? document.getElementById('encTedaLink').value.trim() : null,
    airdoc: selectedAirdocFile ? selectedAirdocFile.name : null,
    cgm: selectedCgmFile ? selectedCgmFile.name : null,
    zentalog: selectedZentalogFile ? selectedZentalogFile.name : null,
    rossmaxAct: document.getElementById('encRossmaxAct').value.trim() || null
  };

  const customTestsVal = document.getElementById('encOtherTestsNotes') ? document.getElementById('encOtherTestsNotes').value.trim() : '';
  const preDiagVal = document.getElementById('encPreDiag').value.trim();
  const planMedsVal = document.getElementById('encPlanMeds').value.trim();
  const planSuppsVal = document.getElementById('encPlanSupps').value.trim();
  const planCounsellingVal = document.getElementById('encPlanCounselling').value.trim();
  const referralVal = document.getElementById('encReferral').value.trim();

  // If in Edit Mode for an existing encounter
  if (editingEncounterId) {
    if (!p.encounters) p.encounters = [];
    const targetEnc = p.encounters.find(e => e.id === editingEncounterId);
    if (targetEnc) {
      targetEnc.date = encDateVal;
      targetEnc.lastUpdatedBy = recorder;
      targetEnc.lastUpdatedAt = new Date().toISOString();
      targetEnc.chiefComplaint = chiefComplaintVal;
      targetEnc.hpi = hpiVal;
      targetEnc.medicalHistory = medHistoryVal;
      targetEnc.vitals = vitalsObj;
      targetEnc.bodyComposition = bcaObj;
      targetEnc.lipidPanel = lipidObj;
      targetEnc.liverPanel = liverObj;
      targetEnc.kidneyPanel = kidneyObj;
      targetEnc.glycemicHeme = glycemicObj;

      // Preserve previously attached diagnostic filenames if not re-uploaded
      if (!specialtyObj.airdoc && targetEnc.specialtyScans?.airdoc) specialtyObj.airdoc = targetEnc.specialtyScans.airdoc;
      if (!specialtyObj.cgm && targetEnc.specialtyScans?.cgm) specialtyObj.cgm = targetEnc.specialtyScans.cgm;
      if (!specialtyObj.zentalog && targetEnc.specialtyScans?.zentalog) specialtyObj.zentalog = targetEnc.specialtyScans.zentalog;
      targetEnc.specialtyScans = specialtyObj;

      targetEnc.customTests = customTestsVal;
      targetEnc.preDiagnostic = preDiagVal;
      targetEnc.planMedications = planMedsVal;
      targetEnc.planSupplements = planSuppsVal;
      targetEnc.planCounselling = planCounsellingVal;
      targetEnc.referral = referralVal;
      if (attachedDocIds.length) {
        targetEnc.attachedDocs = (targetEnc.attachedDocs || []).concat(attachedDocIds);
      }

      const tcaDate = document.getElementById('encTcaDate').value;
      if (tcaDate) {
        const tcaPurpose = document.getElementById('encTcaPurpose').value.trim() || 'Follow-up Consultation & Refill';
        p.nextTcaDate = tcaDate;
        p.nextTcaPurpose = tcaPurpose;
        p.nextTcaRecordedBy = recorder;
        targetEnc.nextTcaDate = tcaDate;
        targetEnc.nextTcaPurpose = tcaPurpose;
      }

      savePatientsData();
      const pidToReturn = returnToProfilePatientId || (viewingPatientId === pId ? pId : null);
      returnToProfilePatientId = null;
      editingEncounterId = null;
      closeEncounterModal();
      renderPatientModule();

      if (pidToReturn) {
        viewPatientProfile(pidToReturn);
      }

      if (typeof showPmgToast === 'function') {
        showPmgToast('✅ Consultation record updated successfully!', 'success');
      } else {
        alert('Consultation record updated successfully!');
      }
      return;
    }
  }

  const newEnc = {
    id: 'ENC-' + Date.now(),
    date: encDateVal,
    recordedBy: recorder,
    chiefComplaint: chiefComplaintVal,
    hpi: hpiVal,
    medicalHistory: medHistoryVal,
    vitals: vitalsObj,
    bodyComposition: bcaObj,
    lipidPanel: lipidObj,
    liverPanel: liverObj,
    kidneyPanel: kidneyObj,
    glycemicHeme: glycemicObj,
    specialtyScans: specialtyObj,
    customTests: customTestsVal,
    preDiagnostic: preDiagVal,
    planMedications: planMedsVal,
    planSupplements: planSuppsVal,
    planCounselling: planCounsellingVal,
    referral: referralVal,
    attachedDocs: attachedDocIds
  };

  if (!p.encounters) p.encounters = [];
  p.encounters.unshift(newEnc);

  // Next TCA Date Reminder (Customer will self-book exact date/time via portal link)
  const tcaDate = document.getElementById('encTcaDate').value;
  if (tcaDate) {
    const tcaPurpose = document.getElementById('encTcaPurpose').value.trim() || 'Follow-up Consultation & Refill';
    p.nextTcaDate = tcaDate;
    p.nextTcaPurpose = tcaPurpose;
    p.nextTcaRecordedBy = recorder;
    newEnc.nextTcaDate = tcaDate;
    newEnc.nextTcaPurpose = tcaPurpose;
  }

  savePatientsData();
  closeEncounterModal();
  renderPatientModule();

  if (viewingPatientId === pId) {
    viewPatientProfile(pId);
  }

  // Prompt pharmacist to send WhatsApp Consultation Summary with Google Review & Community links
  setTimeout(() => {
    if (p.phone) {
      const sendWa = confirm(`✅ Consultation & POCT recorded successfully for ${p.name}!\n\nWould you like to send the Consultation Summary & Google 5-Star Review link to ${p.name} via WhatsApp now?`);
      if (sendWa) {
        const waSummary = buildConsultationWaSummary(p, newEnc);
        const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waSummary)}`;
        window.open(waUrl, '_blank');
      }
    }
  }, 300);
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
    <span class="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-xl">${c}</span>
  `).join('') || '<span class="text-sm text-gray-400">None recorded</span>';

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

function formatPlanListHtml(text, type = 'med') {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  const dotColor = type === 'supp' ? 'text-emerald-600' : 'text-blue-600';
  const textColor = type === 'supp' ? 'text-emerald-950' : 'text-gray-900';
  return `
    <div class="mt-1 space-y-1">
      ${lines.map(line => `
        <div class="flex items-start gap-2 text-xs sm:text-sm ${textColor}">
          <span class="${dotColor} font-black mt-0.5">•</span>
          <span class="font-semibold leading-relaxed">${escHtml(line)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// Tab 1: Encounters History (SOAP & POCT) - Enlarged with In-SOAP Document Integration
async function renderProfileEncounters(p) {
  const container = document.getElementById('profEncountersList');
  if (!container) return;

  if (!p.encounters || !p.encounters.length) {
    container.innerHTML = `<div class="text-center py-12 text-gray-400 text-sm">
      <i class="fa-regular fa-clipboard text-3xl mb-3 text-gray-300 block"></i>
      No clinical encounters recorded yet. Click <b>"Consult & POCT"</b> to begin an encounter.
    </div>`;
    return;
  }

  // Pre-load all documents stored in IndexedDB for this patient
  let allDocs = [];
  try {
    allDocs = await getPatientDocuments(p.id);
  } catch (_) { allDocs = []; }

  container.innerHTML = p.encounters.map(enc => {
    const bpCls = (enc.vitals && enc.vitals.bpSys && enc.vitals.bpDia)
      ? getBpClassification(enc.vitals.bpSys, enc.vitals.bpDia)
      : { label: '—', badge: 'bg-gray-100 text-gray-600' };

    const waSummary = buildConsultationWaSummary(p, enc);
    const waUrl = `https://wa.me/${formatPhoneForWa(p.phone)}?text=${encodeURIComponent(waSummary)}`;

    // Match attached documents: by encounterId OR by encounter date
    const encDocs = (allDocs || []).filter(doc => (doc.encounterId && doc.encounterId === enc.id) || (doc.date && doc.date === enc.date));
    const rawTedaLink = enc.specialtyScans?.tedaLink || (enc.specialtyScans?.teda && enc.specialtyScans.teda.startsWith('http') ? enc.specialtyScans.teda : null);
    const tedaUrl = rawTedaLink || null;
    const tedaNotes = (enc.specialtyScans && enc.specialtyScans.teda && !enc.specialtyScans.teda.startsWith('http')) ? enc.specialtyScans.teda : null;
    const airdocPdf = (enc.specialtyScans && enc.specialtyScans.airdoc) ? enc.specialtyScans.airdoc : null;
    const cgmPdf = (enc.specialtyScans && enc.specialtyScans.cgm) ? enc.specialtyScans.cgm : null;
    const zentalogPdf = (enc.specialtyScans && enc.specialtyScans.zentalog) ? enc.specialtyScans.zentalog : null;
    const hasAttachments = (encDocs.length > 0) || tedaUrl || airdocPdf || cgmPdf || zentalogPdf;

    return `
      <div class="bg-white border-2 border-gray-200 rounded-3xl p-5 sm:p-7 mb-6 shadow-sm hover:border-blue-300 transition">
        <div class="flex items-center justify-between border-b pb-3.5 mb-4 flex-wrap gap-2">
          <div>
            <span class="text-base sm:text-lg font-black text-gray-900">${enc.date}</span>
            <span class="text-sm text-gray-500 font-semibold ml-2.5">by ${enc.recordedBy}</span>
          </div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="px-3 py-1 rounded-xl text-xs sm:text-sm font-black ${bpCls.badge}">
              BP ${enc.vitals ? enc.vitals.bpSys + '/' + enc.vitals.bpDia : '—'} mmHg (${bpCls.label})
            </span>
            <button onclick="editEncounterRecord('${p.id}', '${enc.id}')"
              class="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition shadow-xs"
              title="Edit / Update this consultation record">
              <i class="fa-solid fa-pen-to-square text-sm"></i> Edit Record
            </button>
            <a href="${waUrl}" target="_blank" rel="noopener"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition shadow-xs"
              title="Send Consultation Summary via WhatsApp">
              <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp Summary
            </a>
          </div>
        </div>

        <!-- SOAP Breakdown -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
          <!-- Subjective -->
          <div class="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 shadow-xs">
            <p class="font-extrabold text-blue-900 mb-1.5 flex items-center gap-1.5">
              <span>📌</span> Chief Complaint & History (CC & HPI):
            </p>
            <p class="text-gray-900 font-semibold leading-relaxed">${enc.chiefComplaint || '—'}</p>
            ${enc.hpi ? `<p class="text-gray-600 mt-2 italic text-xs sm:text-sm border-t border-blue-200/50 pt-1.5 leading-relaxed">${enc.hpi}</p>` : ''}
          </div>

          <!-- Pre-Diagnostic -->
          <div class="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-xs">
            <p class="font-extrabold text-amber-950 mb-1.5 flex items-center gap-1.5">
              <span>🔍</span> Pre-Diagnostic / Clinical Impression:
            </p>
            <p class="text-gray-900 font-medium leading-relaxed">${enc.preDiagnostic || '—'}</p>
          </div>

          ${enc.medicalHistory ? `
            <div class="md:col-span-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs sm:text-sm">
              <span class="font-extrabold text-indigo-950 flex items-center gap-1.5 mb-0.5">
                <i class="fa-solid fa-file-medical text-indigo-600"></i> Past Medical & Health History:
              </span>
              <p class="text-gray-800 whitespace-pre-line leading-relaxed font-medium">${escHtml(enc.medicalHistory)}</p>
            </div>
          ` : ''}
        </div>

        <!-- Key POCT Results Pills -->
        <div class="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
          ${enc.vitals && enc.vitals.pulse ? `<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-xl font-medium">Pulse: <b>${enc.vitals.pulse} bpm</b></span>` : ''}
          ${enc.vitals && enc.vitals.spo2 ? `<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-xl font-medium">SpO2: <b>${enc.vitals.spo2}%</b></span>` : ''}
          ${enc.glycemicHeme && enc.glycemicHeme.glucose ? `<span class="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-xl font-medium">Glucose (${enc.glycemicHeme.glucoseType}): <b>${enc.glycemicHeme.glucose} mmol/L</b></span>` : ''}
          ${enc.glycemicHeme && enc.glycemicHeme.hba1c ? `<span class="bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-xl font-medium">HbA1c: <b>${enc.glycemicHeme.hba1c}%</b></span>` : ''}
          ${enc.lipidPanel && enc.lipidPanel.tc ? `<span class="bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-xl font-medium">TC: <b>${enc.lipidPanel.tc}</b> | HDL: <b>${enc.lipidPanel.hdl}</b> | AI: <b>${enc.lipidPanel.ai}</b></span>` : ''}
          ${enc.kidneyPanel && enc.kidneyPanel.ua ? `<span class="bg-rose-50 text-rose-900 border border-rose-200 px-3 py-1 rounded-xl font-medium">Uric Acid: <b>${enc.kidneyPanel.ua} umol/L</b></span>` : ''}
          ${enc.kidneyPanel && enc.kidneyPanel.creatinine ? `<span class="bg-indigo-50 text-indigo-900 border border-indigo-200 px-3 py-1 rounded-xl font-medium">Creatinine: <b>${enc.kidneyPanel.creatinine}</b> | eGFR: <b>${enc.kidneyPanel.egfr}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.vitD ? `<span class="px-3 py-1 rounded-xl font-medium ${enc.specialtyScans.vitD === 'Sufficient' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}">Vit D: <b>${enc.specialtyScans.vitD}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.ferritin ? `<span class="px-3 py-1 rounded-xl font-medium ${enc.specialtyScans.ferritin === 'Sufficient' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}">Ferritin: <b>${enc.specialtyScans.ferritin}</b></span>` : ''}
          ${enc.specialtyScans && enc.specialtyScans.rossmaxAct ? `<span class="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl font-medium">Rossmax ACT: <b>${enc.specialtyScans.rossmaxAct}</b></span>` : ''}
        </div>

        <!-- TEDA TCM & Meridian Assessment Text (if recorded) -->
        ${tedaNotes ? `
          <div class="mt-3.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950">
            <p class="font-extrabold text-amber-900 mb-1 flex items-center gap-1.5">
              <i class="fa-solid fa-yin-yang text-amber-700"></i> TEDA TCM & Meridian Assessment:
            </p>
            <p class="text-gray-800 whitespace-pre-line leading-relaxed font-medium">${escHtml(tedaNotes)}</p>
          </div>
        ` : ''}

        <!-- Attached Lab Reports, Documents & Diagnostic Scans -->
        ${hasAttachments ? `
          <div class="mt-4 p-4 bg-slate-50 border-2 border-dashed border-blue-200 rounded-2xl">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs sm:text-sm font-extrabold text-blue-950 flex items-center gap-2">
                <i class="fa-solid fa-paperclip text-blue-600 text-sm"></i>
                <span>Attached Lab Reports & Scans (${encDocs.length + (tedaUrl ? 1 : 0) + (airdocPdf ? 1 : 0) + (cgmPdf ? 1 : 0) + (zentalogPdf ? 1 : 0)} files):</span>
              </span>
            </div>
            <div class="flex flex-wrap gap-2.5">
              ${encDocs.map(doc => {
                const isPdf = doc.type && doc.type.includes('pdf');
                return `
                  <div class="bg-white border border-blue-200 rounded-xl p-2.5 flex items-center gap-3 shadow-xs hover:border-blue-400 transition">
                    <div class="w-8 h-8 rounded-lg ${isPdf ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center shrink-0">
                      <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-image'} text-base"></i>
                    </div>
                    <div class="text-left">
                      <p class="text-xs font-bold text-gray-900 truncate max-w-[200px]" title="${escHtml(doc.name)}">${escHtml(doc.name)}</p>
                      <p class="text-[10px] text-gray-500">${doc.date} · ${formatFileSize(doc.size)}</p>
                    </div>
                    <button onclick="previewDoc('${doc.id}')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition ml-1 shadow-xs">
                      <i class="fa-solid fa-eye text-[11px]"></i> View
                    </button>
                  </div>
                `;
              }).join('')}
              ${tedaUrl ? `
                <a href="${tedaUrl}" target="_blank" rel="noopener"
                  class="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition shadow-xs"
                  title="Open live TEDA WellScan online report in new window">
                  <i class="fa-solid fa-yin-yang text-amber-700 text-sm"></i>
                  <span>Open TEDA Report (${extractTedaRid(tedaUrl) ? extractTedaRid(tedaUrl).slice(0, 8) + '...' : 'Online'})</span>
                </a>
              ` : ''}
              ${airdocPdf ? `
                <div class="bg-purple-100 text-purple-950 border border-purple-300 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                  <i class="fa-solid fa-file-pdf text-red-600"></i> Airdoc Retinal: ${escHtml(airdocPdf)}
                </div>
              ` : ''}
              ${cgmPdf ? `
                <div class="bg-teal-100 text-teal-950 border border-teal-300 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                  <i class="fa-solid fa-chart-area text-teal-700"></i> CGM Report: ${escHtml(cgmPdf)}
                </div>
              ` : ''}
              ${zentalogPdf ? `
                <div class="bg-amber-100 text-amber-950 border border-amber-300 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                  <i class="fa-solid fa-apple-whole text-amber-700"></i> Zentalog: ${escHtml(zentalogPdf)}
                </div>
              ` : ''}
            </div>
          </div>
        ` : `
          <div class="mt-3 text-xs text-gray-400 flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 w-fit font-medium">
            <i class="fa-solid fa-paperclip text-gray-300"></i> No attached documents for this encounter
          </div>
        `}

        <!-- Other POCT / Screening Notes -->
        ${enc.customTests ? `
          <div class="mt-3 text-xs sm:text-sm bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span class="font-bold text-gray-700">Other POCT / Notes:</span>
            <span class="ml-1.5 text-gray-900 font-medium">${typeof enc.customTests === 'string' ? enc.customTests : (Array.isArray(enc.customTests) ? enc.customTests.map(ct => `${ct.name}: ${ct.result} ${ct.unit}`).join(', ') : '')}</span>
          </div>
        ` : ''}

        <!-- Plan of Action -->
        <div class="mt-4 pt-3.5 border-t text-sm sm:text-base space-y-3">
          ${enc.planMedications ? `
            <div class="p-3 bg-gray-50/80 rounded-xl border border-gray-200">
              <span class="font-extrabold text-gray-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>💊</span> <span>Medications (Prescription / Refills):</span>
              </span>
              ${formatPlanListHtml(enc.planMedications, 'med')}
            </div>
          ` : ''}
          ${enc.planSupplements ? `
            <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span class="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>🌿</span> <span>Companion Supplements (Nutraceuticals):</span>
              </span>
              ${formatPlanListHtml(enc.planSupplements, 'supp')}
            </div>
          ` : ''}
          ${enc.planCounselling ? `
            <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <span class="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>🗣️</span> <span>Patient Counselling & Lifestyle Advice:</span>
              </span>
              <p class="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium mt-1 whitespace-pre-line">${escHtml(enc.planCounselling)}</p>
            </div>
          ` : ''}
          ${enc.referral ? `
            <div class="text-xs sm:text-sm text-gray-700">
              <span class="font-bold text-gray-900">🚨 Referral / Follow-up:</span> <span class="font-medium">${escHtml(enc.referral)}</span>
            </div>
          ` : ''}
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
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400 text-sm">No POCT records recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = p.encounters.map(enc => {
    const v = enc.vitals || {};
    const l = enc.lipidPanel || {};
    const k = enc.kidneyPanel || {};
    const g = enc.glycemicHeme || {};
    const bpCls = (v.bpSys && v.bpDia) ? getBpClassification(v.bpSys, v.bpDia) : { badge: 'bg-gray-100 text-gray-500' };

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-sm">
        <td class="px-4 py-3 font-bold text-gray-900">${enc.date}</td>
        <td class="px-4 py-3">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${bpCls.badge}">${v.bpSys || '—'}/${v.bpDia || '—'}</span>
          <span class="text-xs text-gray-500 font-medium ml-1">${v.pulse ? v.pulse + ' bpm' : ''}</span>
        </td>
        <td class="px-4 py-3 font-semibold text-gray-800">${g.glucose ? `${g.glucose} (${g.glucoseType})` : '—'}</td>
        <td class="px-4 py-3 font-bold text-purple-700">${g.hba1c ? `${g.hba1c}%` : '—'}</td>
        <td class="px-4 py-3">${l.tc ? `TC: ${l.tc} | HDL: ${l.hdl || '—'}` : '—'}</td>
        <td class="px-4 py-3 font-mono text-blue-700 font-bold">${l.ai ? l.ai : '—'}</td>
        <td class="px-4 py-3 text-rose-700 font-bold">${k.ua ? `${k.ua} umol/L` : '—'}</td>
        <td class="px-4 py-3 text-indigo-700 font-semibold">${k.creatinine ? `${k.creatinine} (eGFR: ${k.egfr || '—'})` : '—'}</td>
      </tr>
    `;
  }).join('');
}

// Tab 3: Chronic Meds & Refills
function renderProfileMeds(p) {
  const tbody = document.getElementById('profMedsBody');
  if (!tbody) return;

  if (!p.medications || !p.medications.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400 text-sm">No chronic medications listed. Click "+ Add Medication" above to add.</td></tr>`;
    return;
  }

  tbody.innerHTML = p.medications.map(med => {
    const todayStr = getTodayDateString(0);
    let dueBadge = 'bg-green-100 text-green-800 font-bold';
    let dueLabel = med.nextRefillDate;
    if (med.nextRefillDate < todayStr) {
      dueBadge = 'bg-red-100 text-red-800 font-bold';
      dueLabel += ' (Overdue)';
    } else if (med.nextRefillDate <= getTodayDateString(7)) {
      dueBadge = 'bg-amber-100 text-amber-800 font-bold';
      dueLabel += ' (Due Soon)';
    }

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-sm">
        <td class="px-4 py-3 font-extrabold text-gray-900">${med.name}</td>
        <td class="px-4 py-3 text-gray-700 font-medium">${med.dosage}</td>
        <td class="px-4 py-3 text-gray-500">${med.lastDispensed || '—'}</td>
        <td class="px-4 py-3 text-gray-600 font-medium">${med.supplyDays} days</td>
        <td class="px-4 py-3">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs ${dueBadge}">${dueLabel}</span>
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400 text-sm">No appointment or refill extension history.</td></tr>`;
    return;
  }

  tbody.innerHTML = p.appointments.map(apt => {
    let stBadge = 'bg-blue-100 text-blue-800';
    if (apt.status === 'Completed' || apt.status === 'Approved') stBadge = 'bg-emerald-100 text-emerald-800 font-bold';
    if (apt.status === 'Missed') stBadge = 'bg-red-100 text-red-800';
    if (apt.status === 'Pending Approval') stBadge = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse';

    const isRefillExtension = (apt.type === 'refill_extension' || (apt.purpose && apt.purpose.includes('Extension')) || apt.status === 'Pending Approval');

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-sm">
        <td class="px-4 py-3.5 font-bold text-gray-900">${apt.date} <span class="text-xs text-gray-500 font-normal">(${apt.time || '—'})</span></td>
        <td class="px-4 py-3.5 font-semibold text-gray-900">
          ${escHtml(apt.purpose || 'Check-up')}
          ${apt.pharmacist ? `<span class="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-lg ml-1.5"><i class="fa-solid fa-user-doctor text-[10px]"></i> ${escHtml(apt.pharmacist)}</span>` : ''}
          ${isRefillExtension ? `<span class="inline-block bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-lg ml-1.5"><i class="fa-solid fa-pills mr-1"></i>Refill Extension</span>` : ''}
        </td>
        <td class="px-4 py-3.5">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${stBadge}">${apt.status}</span>
        </td>
        <td class="px-4 py-3.5 text-gray-600 italic text-xs max-w-xs">${escHtml(apt.notes || '—')}</td>
        <td class="px-4 py-3.5 text-right whitespace-nowrap">
          ${(apt.status === 'Pending Approval' || (isRefillExtension && apt.status !== 'Approved' && apt.status !== 'Completed')) ? `
            <button onclick="approveRefillExtension('${p.id}', '${apt.id}')"
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 ml-auto">
              <i class="fa-solid fa-check text-sm"></i> Approve (+1 Mo)
            </button>
          ` : (apt.status === 'Scheduled' ? `
            <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Completed')"
              class="text-green-700 hover:underline font-bold mr-3 text-xs">Mark Done</button>
            <button onclick="markAppointmentStatus('${p.id}', '${apt.id}', 'Missed')"
              class="text-rose-700 hover:underline font-bold text-xs">Missed</button>
          ` : '—')}
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
  const branchName = (patient.branch === 'KS01' || patient.branch === 'KOTA SENTOSA') ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${patient.branch}`;
  const lang = patient.language || 'English';
  const name = patient.name;
  const date = enc.date;

  const v = enc.vitals || {};
  const g = enc.glycemicHeme || {};
  const l = enc.lipidPanel || {};

  const googleReviewLink = 'https://g.page/r/CUU3ygRE9IC6EBM/review';
  const waCommunityLink = 'https://chat.whatsapp.com/D1d7scuEzrQ15rwFndmSHr';
  const personalFbLink = 'https://www.facebook.com/profile.php?id=61563952747645';
  const outletFbLink = 'https://www.facebook.com/profile.php?id=61589640333203';

  if (lang === 'Chinese') {
    let msg = `尊敬的 ${name}，这是您于 ${date} 在【${branchName}】的健康咨询与检查报告小结：\n\n`;
    msg += `🩺 *测量数据：*\n`;
    if (v.bpSys && v.bpDia) msg += `• 血压：${v.bpSys}/${v.bpDia} mmHg (${getBpClassification(v.bpSys, v.bpDia).label})\n`;
    if (v.pulse) msg += `• 脉搏：${v.pulse} bpm\n`;
    if (g.glucose) msg += `• 血糖 (${g.glucoseType})：${g.glucose} mmol/L\n`;
    if (g.hba1c) msg += `• 糖化血红蛋白 HbA1c：${g.hba1c}%\n`;
    if (l.tc) msg += `• 总胆固醇：${l.tc} mmol/L | AI指数：${l.ai || '—'}\n`;

    if (enc.preDiagnostic) msg += `\n🔍 *药剂师评估：*\n${enc.preDiagnostic}\n`;
    if (enc.planCounselling) msg += `\n🗣️ *饮食与生活注意：*\n${enc.planCounselling}\n`;

    msg += `\n🌟 *如果您对我们今天的健康咨询与检测服务满意，诚挚邀请您为我们留下 5 星好评支持：*\n⭐ 谷歌5星好评：${googleReviewLink}\n\n`;
    msg += `👥 *欢迎加入我们的健康关怀 WhatsApp 社区（获取最新健康资讯与用药指导）：*\n👉 社区链接：${waCommunityLink}\n\n`;
    msg += `📱 *关注我们获取更多保健知识：*\n• 药剂师主页：${personalFbLink}\n• PMG Kota Sentosa 专页：${outletFbLink}\n\n`;
    msg += `祝您身体健康！如有任何用药疑问，欢迎随时联系我们。`;
    return msg;
  } else if (lang === 'Malay') {
    let msg = `Salam ${name}, ini adalah ringkasan konsultasi kesihatan anda pada ${date} di 【${branchName}】：\n\n`;
    msg += `🩺 *Keputusan Pemeriksaan:*\n`;
    if (v.bpSys && v.bpDia) msg += `• Tekanan Darah (BP): ${v.bpSys}/${v.bpDia} mmHg\n`;
    if (v.pulse) msg += `• Nadi: ${v.pulse} bpm\n`;
    if (g.glucose) msg += `• Gula Darah (${g.glucoseType}): ${g.glucose} mmol/L\n`;
    if (l.tc) msg += `• Kolesterol: ${l.tc} mmol/L\n`;

    if (enc.preDiagnostic) msg += `\n🔍 *Penilaian Ahli Farmasi:*\n${enc.preDiagnostic}\n`;
    if (enc.planCounselling) msg += `\n🗣️ *Nasihat Gaya Hidup:*\n${enc.planCounselling}\n`;

    msg += `\n🌟 *Jika anda berpuas hati dengan perkhidmatan dan ujian kesihatan kami, sudilah berikan kami penilaian 5 bintang di Google:*\n⭐ Ulasan Google 5 Bintang: ${googleReviewLink}\n\n`;
    msg += `👥 *Sertai Komuniti WhatsApp Kesihatan Kami (dapatkan tips kesihatan & nasihat ubatan terkini):*\n👉 Pautan Komuniti: ${waCommunityLink}\n\n`;
    msg += `📱 *Ikuti kami di Facebook untuk info kesihatan harian:*\n• Profil Ahli Farmasi: ${personalFbLink}\n• Halaman PMG Kota Sentosa: ${outletFbLink}\n\n`;
    msg += `Semoga sihat selalu! Hubungi kami jika ada sebarang pertanyaan.`;
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
    if (enc.planCounselling) msg += `\n🗣️ *Lifestyle & Dietary Advice:*\n${enc.planCounselling}\n`;

    msg += `\n🌟 *If you are satisfied with our health consultation and testing service today, we would greatly appreciate your 5-star Google review:*\n⭐ Rate 5 Stars on Google: ${googleReviewLink}\n\n`;
    msg += `👥 *Join our WhatsApp Health Community (for the latest health tips & updates):*\n👉 Community Link: ${waCommunityLink}\n\n`;
    msg += `📱 *Follow us on Facebook for daily healthcare updates:*\n• Pharmacist Profile: ${personalFbLink}\n• PMG Kota Sentosa Page: ${outletFbLink}\n\n`;
    msg += `Stay healthy! Feel free to message us if you have any questions.`;
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
  const rawBranch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'Kota Sentosa';
  const branch = normalizeBranchCode(rawBranch);
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

/**
 * Google Apps Script Web App URL for live pharmacist schedule sync.
 * Pharmacist edits in "Manage Working Hours" → pushed to Google Sheets.
 * Customer opens booking link → fetches latest schedule from Google Sheets.
 * No patient data is ever sent here — working hours only.
 */
const PMG_SCHEDULE_API_URL = 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';

const BRANCH_SCHEDULES = {
  'Kota Sentosa': { name: 'Kota Sentosa', open: '07:30', close: '21:30', pharmacist: 'William Chai (Pharmacist)', phone: '60168334455' },
  'KOTA SENTOSA': { name: 'Kota Sentosa', open: '07:30', close: '21:30', pharmacist: 'William Chai (Pharmacist)', phone: '60168334455' },
  'KS01':         { name: 'Kota Sentosa', open: '07:30', close: '21:30', pharmacist: 'William Chai (Pharmacist)', phone: '60168334455' },
  'ASTANA':       { name: 'Astana',       open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'MALIHAH':      { name: 'Malihah',      open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'METROCITY':    { name: 'Metrocity',    open: '08:30', close: '21:30', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'MJK':          { name: 'MJK',          open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'MOYAN':        { name: 'Moyan',        open: '08:00', close: '21:00', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
  'SEMARIANG':    { name: 'Semariang',    open: '07:30', close: '21:30', pharmacist: 'Duty Pharmacist', phone: '60123456789' },
};

function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

/**
 * Normalizes branch codes so KS01, KOTA SENTOSA, ALL, and variations are always recognized consistently.
 */
function normalizeBranchCode(code) {
  if (!code) return 'Kota Sentosa';
  const str = String(code).trim();
  const clean = str.toUpperCase().replace(/[\s\-_\(\)\[\]]/g, '');
  if (clean.includes('SENTOSA') || clean.includes('KS01') || clean === 'KS' || clean === 'ALL' || clean === 'ALLBRANCHES') {
    return 'Kota Sentosa';
  }
  return str;
}

/**
 * Serializes the pharmacist schedule into a compact URL-safe Base64 parameter.
 * Uses delta/common-hours encoding to compress schedule payloads to ~100 characters.
 * Prevents URL truncation in WhatsApp and mobile browsers, ensuring customer booking links
 * strictly reflect the pharmacist's configured working hours across all devices.
 */
function packScheduleForUrl(sched) {
  if (!sched) return '';
  try {
    const weekly = sched.weeklyTemplate || {};
    const counts = {};
    for (let i = 0; i <= 6; i++) {
      const d = weekly[String(i)];
      if (d && d.isOpen && d.open && d.close) {
        const key = `${d.open}|${d.close}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    let commonHours = ["08:00", "17:00"];
    let maxCount = -1;
    for (const [k, v] of Object.entries(counts)) {
      if (v > maxCount) {
        maxCount = v;
        commonHours = k.split("|");
      }
    }

    const off = [];
    const custom = {};
    for (let i = 0; i <= 6; i++) {
      const d = weekly[String(i)];
      if (!d || !d.isOpen) {
        off.push(i);
      } else if (d.open !== commonHours[0] || d.close !== commonHours[1]) {
        custom[i] = [d.open, d.close];
      }
    }

    const compact = {
      b: normalizeBranchCode(sched.branchCode || 'Kota Sentosa'),
      p: sched.defaultPharmacist || 'William Chai (Pharmacist)',
      t: commonHours,
      off: off
    };
    if (Object.keys(custom).length > 0) compact.c = custom;
    if (sched.dateOverrides && Object.keys(sched.dateOverrides).length > 0) {
      compact.o = {};
      for (const [dt, ov] of Object.entries(sched.dateOverrides)) {
        if (ov.isClosed) {
          compact.o[dt] = [0, ov.reason || ''];
        } else {
          compact.o[dt] = [1, ov.open, ov.close, ov.reason || ''];
        }
      }
    }

    const jsonStr = JSON.stringify(compact);
    let b64 = '';
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(jsonStr, 'utf8').toString('base64');
    } else {
      b64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode('0x' + p1)));
    }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.warn('[PMG Schedule] Failed to pack schedule for URL:', e);
    return '';
  }
}

/**
 * Unpacks a Base64 schedule parameter from the booking URL and returns a full schedule object.
 * Supports both modern compact format (t/off/c) and legacy format (w) for 100% backwards compatibility.
 */
function unpackScheduleFromUrl(schParam, branchCode) {
  if (!schParam) return null;
  try {
    let b64 = decodeURIComponent(schParam).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    let jsonStr = '';
    if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(b64, 'base64').toString('utf8');
    } else {
      jsonStr = decodeURIComponent(Array.prototype.map.call(atob(b64), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    }
    const compact = JSON.parse(jsonStr);
    const code = normalizeBranchCode(compact.b || branchCode || 'Kota Sentosa');
    const defInfo = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['Kota Sentosa'] || { name: 'Kota Sentosa', open: '07:30', close: '21:30', pharmacist: 'William Chai (Pharmacist)' };

    const daysMeta = [
      { num: "1", name: "Monday" },
      { num: "2", name: "Tuesday" },
      { num: "3", name: "Wednesday" },
      { num: "4", name: "Thursday" },
      { num: "5", name: "Friday" },
      { num: "6", name: "Saturday" },
      { num: "0", name: "Sunday" }
    ];

    const weeklyTemplate = {};
    const defaultHours = compact.t || [defInfo.open, defInfo.close];
    const offDays = new Set((compact.off || []).map(Number));

    daysMeta.forEach(({ num, name }) => {
      const dayIdx = Number(num);
      if (compact.w && compact.w[num]) {
        const arr = compact.w[num];
        weeklyTemplate[num] = {
          dayName: name,
          isOpen: arr[0] === 1,
          open: arr[1] || defaultHours[0],
          close: arr[2] || defaultHours[1],
          pharmacist: arr[3] || compact.p || defInfo.pharmacist
        };
      } else {
        const isOff = offDays.has(dayIdx);
        const custom = (compact.c && compact.c[num]) || null;
        weeklyTemplate[num] = {
          dayName: name,
          isOpen: !isOff,
          open: custom ? custom[0] : defaultHours[0],
          close: custom ? custom[1] : defaultHours[1],
          pharmacist: compact.p || defInfo.pharmacist
        };
      }
    });

    const dateOverrides = {};
    if (compact.o) {
      for (const [dt, ov] of Object.entries(compact.o)) {
        if (Array.isArray(ov)) {
          if (ov[0] === 0) {
            dateOverrides[dt] = { isClosed: true, reason: ov[1] || 'Closed / Rest Day' };
          } else {
            dateOverrides[dt] = { isClosed: false, open: ov[1], close: ov[2], reason: ov[3] || 'Special Shift' };
          }
        } else if (typeof ov === 'object') {
          dateOverrides[dt] = ov;
        }
      }
    }

    return {
      branchCode: code,
      branchName: compact.n || defInfo.name,
      defaultPharmacist: compact.p || defInfo.pharmacist,
      weeklyTemplate: weeklyTemplate,
      dateOverrides: dateOverrides,
      lastUpdated: new Date().toISOString()
    };
  } catch (e) {
    console.warn('[PMG Schedule] Failed to unpack schedule from URL:', e);
    return null;
  }
}

/**
 * Retrieves the full schedule configuration for a branch (template + overrides).
 */
function getPharmacistSchedule(branchCode) {
  const code = normalizeBranchCode(branchCode);
  const defInfo = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['Kota Sentosa'] || { name: 'Kota Sentosa', open: '07:30', close: '21:30', pharmacist: 'William Chai (Pharmacist)' };

  let data = null;
  try {
    const raw = localStorage.getItem(`pmg_pharmacist_schedule_${code}`) ||
                (code === 'Kota Sentosa' ? (localStorage.getItem('pmg_pharmacist_schedule_KOTA SENTOSA') || localStorage.getItem('pmg_pharmacist_schedule_KS01')) : null) ||
                (branchCode ? localStorage.getItem(`pmg_pharmacist_schedule_${branchCode}`) : null) ||
                localStorage.getItem('pmg_pharmacist_schedule_Kota Sentosa') ||
                localStorage.getItem('pmg_pharmacist_schedule_KOTA SENTOSA') ||
                localStorage.getItem('pmg_pharmacist_schedule_KS01');
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
    data.branchCode = code;
    if (!data.branchName) data.branchName = defInfo.name;
    if (!data.defaultPharmacist) data.defaultPharmacist = defInfo.pharmacist;
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
 * Saves schedule config to localStorage and automatically syncs to PMG OneDrive folder.
 */
function savePharmacistSchedule(branchCode, scheduleObj) {
  const code = normalizeBranchCode(branchCode);
  if (!scheduleObj) return;

  const nowIso = new Date().toISOString();
  scheduleObj.lastUpdated = nowIso;
  scheduleObj.updatedBy = (typeof getSession === 'function' ? getSession()?.displayName : 'Pharmacist') || 'Pharmacist';
  scheduleObj.branchCode = code;

  const jsonStr = JSON.stringify(scheduleObj);
  localStorage.setItem(`pmg_pharmacist_schedule_${code}`, jsonStr);
  if (code === 'Kota Sentosa') {
    localStorage.setItem('pmg_pharmacist_schedule_KOTA SENTOSA', jsonStr);
    localStorage.setItem('pmg_pharmacist_schedule_KS01', jsonStr);
  }

  // Sync to OneDrive branch folder if linked
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveScheduleToOneDrive === 'function') {
    window.pmgOneDriveSync.saveScheduleToOneDrive(code, scheduleObj).catch(err => {
      console.warn('[PMG OneDrive Sync] Auto-save schedule warning:', err);
    });
  }

  // Push to Google Sheets for live cross-device customer booking availability
  pushScheduleToSheets(code, scheduleObj);
}

/**
 * Asynchronously pushes pharmacist schedule to Google Sheets.
 * Uses no-cors + text/plain to bypass browser CORS preflight (OPTIONS) issues
 * with Google Apps Script endpoints. Data still reaches the sheet reliably.
 */
async function pushScheduleToSheets(branchCode, scheduleObj) {
  if (!PMG_SCHEDULE_API_URL || !scheduleObj) return;
  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const payload = {
      branch: branchCode,
      schedule: scheduleObj,
      updatedBy: (session && session.displayName) || scheduleObj.updatedBy || 'Pharmacist'
    };
    // Use no-cors + text/plain to avoid CORS preflight OPTIONS rejection.
    // Apps Script receives e.postData.contents as the JSON string — fully works.
    // Response is opaque (unreadable) but the write to Sheets succeeds.
    await fetch(PMG_SCHEDULE_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    console.log(`[PMG Sheets] ✅ Schedule push sent for ${branchCode}`);
  } catch (err) {
    console.warn('[PMG Sheets] Could not push schedule to Google Sheets (offline?):', err.message);
    // Graceful: localStorage + &sch= URL param still serve as fallback for customers
  }
}


/**
 * Asynchronously fetches the latest pharmacist schedule from Google Sheets.
 * Saves result into localStorage as a cache so subsequent page calls are instant.
 * Called when a customer opens the self-booking link.
 */
async function fetchScheduleFromSheets(branchCode) {
  if (!PMG_SCHEDULE_API_URL) return null;
  try {
    const url = `${PMG_SCHEDULE_API_URL}?branch=${encodeURIComponent(branchCode)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6 sec timeout
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.success && data.schedule) {
      // Cache to localStorage (directly, no re-push to Sheets)
      const code = normalizeBranchCode(branchCode);
      const jsonStr = JSON.stringify(data.schedule);
      localStorage.setItem(`pmg_pharmacist_schedule_${code}`, jsonStr);
      if (code === 'Kota Sentosa') {
        localStorage.setItem('pmg_pharmacist_schedule_KOTA SENTOSA', jsonStr);
        localStorage.setItem('pmg_pharmacist_schedule_KS01', jsonStr);
      }
      console.log(`[PMG Sheets] ✅ Fetched live schedule for ${branchCode} (last updated: ${data.lastUpdated})`);
      return data.schedule;
    }
    console.warn('[PMG Sheets] No schedule found in Sheets for:', branchCode);
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[PMG Sheets] Fetch timed out — using cached/URL schedule fallback.');
    } else {
      console.warn('[PMG Sheets] Fetch error:', err.message);
    }
    return null;
  }
}



/**
 * Resolves the effective schedule for a specific date (YYYY-MM-DD):
 * Checks date overrides first, then weekly template, then static fallback.
 */
function getPharmacistScheduleForDate(branchCode, dateStr) {
  const code = normalizeBranchCode(branchCode);
  const defInfo = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['Kota Sentosa'] || { name: 'Kota Sentosa', open: '07:30', close: '21:30', pharmacist: 'William Chai (Pharmacist)' };
  const sched = getPharmacistSchedule(code);

  // 1. Check Specific Date Overrides (Priority 1)
  if (sched.dateOverrides && sched.dateOverrides[dateStr]) {
    const ov = sched.dateOverrides[dateStr];
    if (ov.isClosed) {
      return {
        branchCode: code,
        branchName: sched.branchName || defInfo.name,
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
        branchName: sched.branchName || defInfo.name,
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
    const parts = dateStr.split('-').map(Number);
    const d = (parts.length === 3) ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateStr);
    const dayOfWeek = String(d.getDay()); // 0 = Sunday .. 6 = Saturday
    const tmpl = sched.weeklyTemplate && sched.weeklyTemplate[dayOfWeek];

    if (tmpl) {
      if (!tmpl.isOpen) {
        return {
          branchCode: code,
          branchName: sched.branchName || defInfo.name,
          date: dateStr,
          isOpen: false,
          isClosed: true,
          open: '',
          close: '',
          pharmacist: '',
          reason: 'Pharmacist Weekly Rest Day',
          isOverride: false
        };
      } else {
        return {
          branchCode: code,
          branchName: sched.branchName || defInfo.name,
          date: dateStr,
          isOpen: true,
          isClosed: false,
          open: tmpl.open || defInfo.open,
          close: tmpl.close || defInfo.close,
          pharmacist: tmpl.pharmacist || sched.defaultPharmacist || defInfo.pharmacist,
          reason: 'Regular Weekly Template',
          isOverride: false
        };
      }
    }
  }

  // 3. Fall back to static branch schedule (Priority 3)
  return {
    branchCode: code,
    branchName: sched.branchName || defInfo.name,
    date: dateStr,
    isOpen: true,
    isClosed: false,
    open: defInfo.open,
    close: defInfo.close,
    pharmacist: sched.defaultPharmacist || defInfo.pharmacist,
    reason: 'Default Branch Hours',
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
  const rawUserBranch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'Kota Sentosa';
  const userBranch = normalizeBranchCode(rawUserBranch);

  const branchSelect = document.getElementById('shareBookingBranchSelect');
  if (branchSelect) {
    for (let opt of branchSelect.options) {
      if (normalizeBranchCode(opt.value) === userBranch || opt.text.includes(userBranch)) {
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
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
  const info = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['Kota Sentosa'] || BRANCH_SCHEDULES['KS01'];
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
  const params = new URLSearchParams();
  params.set('book', '1');
  params.set('branch', code);
  const packed = packScheduleForUrl(sched);
  if (packed) params.set('sch', packed);

  const bookingUrl = `${baseUrl}?${params.toString()}`;

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
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
  const sched = getPharmacistSchedule(code);
  const info = BRANCH_SCHEDULES[code] || BRANCH_SCHEDULES['Kota Sentosa'] || BRANCH_SCHEDULES['KS01'];
  const bookingUrl = inputEl ? inputEl.value : '';

  const msg = `Halo! Anda boleh tempah slot pemeriksaan kesihatan atau rundingan ahli farmasi di PMG Pharmacy (${sched.branchName || info.name}) di pautan berikut:\n\n${bookingUrl}\n\nWaktu Perundingan: ${info.open} - ${info.close}.\nJumpa anda nanti!`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── CUSTOMER SELF-SERVICE BOOKING VIEW (?book=1) ────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
let currentCustomerBooking = null;

async function initCustomerBooking(defaultBranchCode = 'Kota Sentosa') {
  const urlParams = new URLSearchParams(window.location.search);
  let branchParam = normalizeBranchCode(urlParams.get('branch') || defaultBranchCode);

  // ── Step 1: Show loading state immediately ────────────────────────────────
  const timeSelect = document.getElementById('custBookTime');
  const submitBtn  = document.getElementById('custBookSubmitBtn');
  const descEl     = document.getElementById('custBranchHoursDesc');
  if (timeSelect) {
    timeSelect.innerHTML = '<option value="">⏳ Loading available time slots...</option>';
    timeSelect.disabled = true;
  }
  if (submitBtn) submitBtn.disabled = true;
  if (descEl) descEl.innerHTML = '<span class="text-blue-600 animate-pulse">⏳ Fetching latest pharmacist schedule...</span>';

  // ── Step 2: Fetch live schedule from Google Sheets (primary source) ────────
  let fetchedFromSheets = false;
  try {
    const sheetsSchedule = await fetchScheduleFromSheets(branchParam);
    if (sheetsSchedule) {
      fetchedFromSheets = true;
    }
  } catch (_) { /* network issue, fall through */ }

  // ── Step 3: Fallback to &sch= URL param if Sheets fetch failed ────────────
  if (!fetchedFromSheets) {
    const schParam = urlParams.get('sch');
    if (schParam) {
      const unpacked = unpackScheduleFromUrl(schParam, branchParam);
      if (unpacked) {
        // Cache locally without re-pushing to Sheets (customer device)
        const code = normalizeBranchCode(unpacked.branchCode || branchParam);
        const jsonStr = JSON.stringify(unpacked);
        localStorage.setItem(`pmg_pharmacist_schedule_${code}`, jsonStr);
        if (code === 'Kota Sentosa') {
          localStorage.setItem('pmg_pharmacist_schedule_KOTA SENTOSA', jsonStr);
          localStorage.setItem('pmg_pharmacist_schedule_KS01', jsonStr);
        }
        console.log('[PMG Customer Booking] Schedule loaded from &sch= URL param (offline fallback).');
      }
    }
  }

  // ── Step 4: Set up branch selector ────────────────────────────────────────
  const select = document.getElementById('custBranchSelect');
  if (select) {
    select.value = branchParam;
    if (!select.value) {
      for (let opt of select.options) {
        if (normalizeBranchCode(opt.value) === branchParam) {
          select.value = opt.value;
          break;
        }
      }
    }
    // Lock branch selector so customer cannot switch to another unconnected branch
    select.disabled = true;
    select.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-90');
    const lockNotice = document.getElementById('custBranchLockNotice');
    if (lockNotice) lockNotice.classList.remove('hidden');
  }

  // ── Step 5: Pre-fill Name, Phone, IC from query params ────────────────────
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

  // ── Step 6: Set booking type (in_person vs refill_extension) ──────────────
  const typeParam = urlParams.get('type') || urlParams.get('service');
  if (typeParam && (typeParam.toLowerCase().includes('refill') || typeParam.toLowerCase().includes('extension'))) {
    const refillRadio = document.querySelector('input[name="custBookingType"][value="refill_extension"]');
    if (refillRadio) {
      refillRadio.checked = true;
      toggleBookingType('refill_extension');
    }
  } else {
    toggleBookingType('in_person');
  }

  // ── Step 7: Set date picker bounds ────────────────────────────────────────
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

  // ── Step 8: Render time slots using the resolved schedule ─────────────────
  updateCustBookHours();
}

/**
 * Toggles UI between In-Person Consultation and 1-Month Refill Extension Request
 */
function toggleBookingType(type) {
  const timeContainer = document.getElementById('custTimeSlotContainer');
  const refillNotice = document.getElementById('custRefillExtensionNotice');
  const submitText = document.getElementById('custBookSubmitText');
  const dateLabel = document.getElementById('custDateLabel');
  const timeSelect = document.getElementById('custBookTime');

  if (type === 'refill_extension') {
    if (timeContainer) timeContainer.classList.add('hidden');
    if (refillNotice) refillNotice.classList.remove('hidden');
    if (submitText) submitText.textContent = 'Submit Refill & 1-Month Extension Request (提交续药与顺延申请)';
    if (dateLabel) dateLabel.textContent = 'Select Expected Refill Date (选择预计取药日期)';
    if (timeSelect) timeSelect.required = false;
  } else {
    if (timeContainer) timeContainer.classList.remove('hidden');
    if (refillNotice) refillNotice.classList.add('hidden');
    if (submitText) submitText.textContent = 'Confirm & Book Appointment (确认预约)';
    if (dateLabel) dateLabel.textContent = 'Select Date (选择面诊日期)';
    if (timeSelect) timeSelect.required = true;
  }
}

function updateCustBookHours() {
  const branchSelect = document.getElementById('custBranchSelect');
  let rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
  const dateInput = document.getElementById('custBookDate');
  const dateStr = dateInput ? dateInput.value : '';

  const schedForDate = getPharmacistScheduleForDate(code, dateStr);

  const titleEl = document.getElementById('custBranchHoursTitle');
  const descEl  = document.getElementById('custBranchHoursDesc');
  const bannerEl = document.getElementById('custDateStatusBanner');
  const timeSelect = document.getElementById('custBookTime');
  const submitBtn = document.getElementById('custBookSubmitBtn');
  const submitText = document.getElementById('custBookSubmitText');

  if (titleEl) titleEl.textContent = `${schedForDate.branchName} Operating Hours`;

  if (descEl) {
    if (schedForDate.isClosed) {
      descEl.innerHTML = `<span class="text-rose-600 font-bold">⚠️ Pharmacist is closed / off on this date</span><br>Reason: <b>${escHtml(schedForDate.reason || 'Rest Day')}</b>`;
    } else {
      descEl.innerHTML = `Operating Hours: <b>${schedForDate.open} – ${schedForDate.close}</b> (Mon – Sun)${schedForDate.isOverride ? ' <span class="text-xs text-indigo-600 font-bold">(Special Shift)</span>' : ''}`;
    }
  }

  if (schedForDate.isClosed) {
    // Banner warning
    if (bannerEl) {
      bannerEl.className = 'rounded-2xl p-4 text-sm sm:text-base font-bold flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-800';
      bannerEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-600 text-base"></i>
        <span><b>Branch is Closed on ${dateStr}</b> (${escHtml(schedForDate.reason || 'Rest Day / Public Holiday')}). Please choose another date.</span>`;
      bannerEl.classList.remove('hidden');
    }

    if (timeSelect) {
      timeSelect.innerHTML = `<option value="">No consultation slots available (Closed)</option>`;
      timeSelect.disabled = true;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = `Branch Closed on Selected Date`;
    return;
  }

  // Date is open!
  if (bannerEl) {
    if (schedForDate.isOverride) {
      bannerEl.className = 'rounded-2xl p-4 text-sm sm:text-base font-bold flex items-center gap-2.5 bg-indigo-50 border border-indigo-200 text-indigo-800';
      bannerEl.innerHTML = `<i class="fa-solid fa-circle-info text-indigo-600 text-base"></i>
        <span><b>Special Hours for ${dateStr}:</b> Open ${schedForDate.open} – ${schedForDate.close} (${escHtml(schedForDate.reason || 'Special Shift')})</span>`;
      bannerEl.classList.remove('hidden');
    } else {
      bannerEl.classList.add('hidden');
    }
  }

  if (submitBtn) submitBtn.disabled = false;

  const bookingTypeEl = document.querySelector('input[name="custBookingType"]:checked');
  const currentBookingType = bookingTypeEl ? bookingTypeEl.value : 'in_person';
  if (submitText) {
    submitText.textContent = (currentBookingType === 'refill_extension')
      ? 'Submit Refill & 1-Month Extension Request (提交续药与顺延申请)'
      : 'Confirm & Book Appointment (确认预约)';
  }

  if (!timeSelect) return;
  timeSelect.disabled = false;

  const [openH, openM] = schedForDate.open.split(':').map(Number);
  const [closeH, closeM] = schedForDate.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Prevent time slot collisions: collect already-booked slots for this date and branch
  const bookedTimes = new Set();

  // A. From customer bookings in localStorage
  let custBookings = [];
  try {
    custBookings = JSON.parse(localStorage.getItem('pmg_customer_bookings') || '[]');
  } catch (_) { custBookings = []; }

  custBookings.forEach(b => {
    if ((normalizeBranchCode(b.branchCode) === code || b.branchName === schedForDate.branchName) && b.date === dateStr && b.status !== 'Cancelled' && b.time && !b.time.includes('Anytime')) {
      bookedTimes.add(b.time);
    }
  });

  // B. From patientsData appointments
  if (typeof patientsData !== 'undefined' && Array.isArray(patientsData)) {
    patientsData.forEach(pt => {
      if (!pt.branch || normalizeBranchCode(pt.branch) === code || pt.branch === schedForDate.branchName) {
        (pt.appointments || []).forEach(apt => {
          if (apt.date === dateStr && apt.status !== 'Cancelled' && apt.status !== 'Missed' && apt.time && !apt.time.includes('Anytime')) {
            bookedTimes.add(apt.time);
          }
        });
      }
    });
  }

  let options = '';
  let availableCount = 0;
  for (let m = openMinutes; m <= closeMinutes - 30; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const timeVal = `${hh}:${mm}`;

    const hourNum = Math.floor(m / 60);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    const label = `${displayHour}:${mm} ${ampm}`;

    const isBooked = bookedTimes.has(timeVal);
    if (isBooked) {
      options += `<option value="${timeVal}" disabled class="bg-gray-100 text-gray-400">⛔ ${label} (${timeVal}) - 已约满 (Fully Booked)</option>`;
    } else {
      availableCount++;
      options += `<option value="${timeVal}">🟢 ${label} (${timeVal}) - 可预约 (Available)</option>`;
    }
  }

  if (availableCount === 0) {
    options = `<option value="" disabled selected>⚠️ All consultation slots are fully booked for ${dateStr}. Please select another date.</option>` + options;
  }

  timeSelect.innerHTML = options;
}

function handleCustomerBookingSubmit(e) {
  e.preventDefault();

  const branchCode = normalizeBranchCode(document.getElementById('custBranchSelect').value);
  const date = document.getElementById('custBookDate').value;
  const schedForDate = getPharmacistScheduleForDate(branchCode, date);

  if (schedForDate.isClosed) {
    alert(`Sorry, the pharmacy is closed on ${date} (${schedForDate.reason || 'Rest Day / Public Holiday'}). Please select another date.`);
    return;
  }

  const bookingTypeEl = document.querySelector('input[name="custBookingType"]:checked');
  const bookingType = bookingTypeEl ? bookingTypeEl.value : 'in_person';

  let time = '';
  let service = '';
  let purpose = '';
  let status = 'Scheduled';

  if (bookingType === 'refill_extension') {
    time = 'Anytime (Refill Collection)';
    service = 'Refill Chronic Medication & Supplements (+1 Month Extension)';
    purpose = '1-Month Refill Extension Request (Pending Approval)';
    status = 'Pending Approval';
  } else {
    const timeSelect = document.getElementById('custBookTime');
    time = timeSelect ? timeSelect.value : '';
    if (!time) {
      alert('Please select an available consultation time slot.');
      return;
    }
    service = 'In-Person Consultation & Health Screening';
    purpose = 'In-Person Consultation & Health Screening';
    status = 'Scheduled';
  }

  const preferredPharmEl = document.getElementById('custPharmacistSelect');
  const preferredPharm = preferredPharmEl && preferredPharmEl.value ? preferredPharmEl.value : (schedForDate.pharmacist || schedForDate.branchName);

  const branchInfo = {
    name: schedForDate.branchName,
    pharmacist: preferredPharm
  };

  const name = document.getElementById('custBookName').value.trim();
  const phone = document.getElementById('custBookPhone').value.trim();
  const ic = document.getElementById('custBookIc') ? document.getElementById('custBookIc').value.trim() : '';

  if (!name || !phone || !date) {
    alert('Please fill in your name, phone number, and preferred date.');
    return;
  }

  const bookingRef = (bookingType === 'refill_extension' ? 'PMG-EXT-' : 'PMG-BK-') + Math.floor(100000 + Math.random() * 900000);

  const bookingData = {
    id: bookingRef,
    ref: bookingRef,
    source: 'Customer Self-Service Portal',
    bookingType: bookingType,
    branchCode,
    branchName: branchInfo.name,
    pharmacist: branchInfo.pharmacist,
    service,
    purpose,
    date,
    time,
    status: status,
    patientName: name,
    patientPhone: phone,
    patientIc: ic,
    notes: bookingType === 'refill_extension' ? 'Customer requested 1-Month Extension for Routine Meds/Supplements (Pending Approval)' : 'Booked via Online Customer Portal',
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
      purpose,
      pharmacist: branchInfo.pharmacist,
      status: status,
      type: bookingType,
      notes: bookingData.notes,
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
      branch: normalizeBranchCode(branchInfo.name || branchCode || 'Kota Sentosa'),
      allergies: 'None recorded',
      chronicConditions: [bookingType === 'refill_extension' ? 'Chronic Medication Refill' : 'Pending Consultation'],
      medications: [],
      encounters: [],
      documents: [],
      appointments: [
        {
          id: bookingRef,
          date,
          time,
          service,
          purpose,
          pharmacist: branchInfo.pharmacist,
          status: status,
          type: bookingType,
          notes: bookingData.notes,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };
    patientsData.unshift(newPatient);
    savePatientsData();
  }

  // Trigger OneDrive Sync
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveToOneDrive === 'function') {
    window.pmgOneDriveSync.saveToOneDrive(patientsData);
  }

  // Render Confirmation Screen
  document.getElementById('custConfirmRef').textContent = bookingRef;
  document.getElementById('custConfirmName').textContent = name;
  document.getElementById('custConfirmBranch').textContent = branchInfo.name;
  document.getElementById('custConfirmDateTime').textContent = (bookingType === 'refill_extension') ? `${date} (Expected Refill Collection)` : `${date} at ${time}`;
  document.getElementById('custConfirmService').textContent = (bookingType === 'refill_extension') ? '1-Month Refill Extension (Pending Approval)' : service;

  const confirmDateLabel = document.getElementById('custConfirmDateLabel');
  if (confirmDateLabel) {
    confirmDateLabel.textContent = (bookingType === 'refill_extension') ? 'Refill Date (预计取药):' : 'Date & Time (预约时间):';
  }

  if (bookingType === 'refill_extension') {
    document.getElementById('custSuccessTitle').textContent = 'Extension Request Submitted!';
    document.getElementById('custSuccessSubtitle').textContent = '您的慢病常备药物续药与【顺延 1 个月复诊】申请已提交。执业药剂师将在审核您的用药记录后予以批准，系统将自动更新您的下一次复诊提醒。';
  } else {
    document.getElementById('custSuccessTitle').textContent = 'Appointment Confirmed!';
    document.getElementById('custSuccessSubtitle').textContent = '您的到店面诊预约已成功登记，我们期待为您服务。';
  }

  document.getElementById('customerBookingFormCard').classList.add('hidden');
  document.getElementById('customerBookingSuccessCard').classList.remove('hidden');
}

function sendCustomerBookingWaConfirm() {
  if (!currentCustomerBooking) return;
  const b = currentCustomerBooking;
  let msg = '';
  if (b.bookingType === 'refill_extension' || (b.service && b.service.includes('Extension'))) {
    msg = `*PMG Pharmacy - 慢病用药续订与顺延申请确认*

编号: ${b.ref}
顾客姓名: ${b.patientName}
分店: ${b.branchName}
申请类型: 常备药物与保健品续订 (+1 个月复诊顺延)
预计取药日期: ${b.date}

我们已收到您的续药申请。驻店药剂师将审核您的用药档案，批准后将为您自动顺延下一次复诊提醒日期并备齐药物。如有疑问，欢迎随时联系我们！祝您身体健康！`;
  } else {
    msg = `*PMG Pharmacy - 到店预约确认*

编号: ${b.ref}
顾客姓名: ${b.patientName}
分店: ${b.branchName}
预约日期: ${b.date}
预约时段: ${b.time}
服务项目: ${b.service}
指定药剂师: ${b.pharmacist}

感谢您选择 PMG Pharmacy。请提前 5-10 分钟到达。如需更改时间，欢迎回复此信息。祝您身体健康！`;
  }

  const cleanPhone = b.patientPhone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('0') ? '60' + cleanPhone.slice(1) : cleanPhone;
  const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

/**
 * Pharmacist Action: Approves a customer's 1-Month Refill Extension request,
 * extends the patient's Next TCA Reminder Date by 30 days, saves to storage, and syncs to OneDrive.
 */
function approveRefillExtension(patientId, appointmentId) {
  const p = patientsData.find(pt => pt.id === patientId);
  if (!p) {
    alert('Patient record not found.');
    return;
  }

  const apt = (p.appointments || []).find(a => a.id === appointmentId);

  // Calculate new TCA date: 30 days from current TCA date (if in future) or from today
  const today = new Date();
  let baseDate = today;
  if (p.nextTcaDate) {
    const existingTca = new Date(p.nextTcaDate);
    if (!isNaN(existingTca.getTime()) && existingTca > today) {
      baseDate = existingTca;
    }
  }
  const nextMonthDate = new Date(baseDate);
  nextMonthDate.setDate(nextMonthDate.getDate() + 30);
  const newTcaDateStr = nextMonthDate.toISOString().split('T')[0];

  p.nextTcaDate = newTcaDateStr;
  p.nextTcaPurpose = 'Approved 1-Month Refill Extension';

  if (apt) {
    apt.status = 'Approved';
    apt.notes = (apt.notes || '') + ` [Approved on ${getTodayDateString(0)} - Next TCA set to ${newTcaDateStr}]`;
  }

  // Also update customer bookings list in localStorage if matching ref
  try {
    const custBookings = JSON.parse(localStorage.getItem('pmg_customer_bookings') || '[]');
    const cb = custBookings.find(b => b.id === appointmentId || b.ref === appointmentId);
    if (cb) {
      cb.status = 'Approved';
      localStorage.setItem('pmg_customer_bookings', JSON.stringify(custBookings));
    }
  } catch (_) {}

  // Also shift medication refill dates by 30 days if present
  if (Array.isArray(p.medications)) {
    p.medications.forEach(med => {
      if (med.nextRefillDate) {
        const medDate = new Date(med.nextRefillDate);
        if (!isNaN(medDate.getTime())) {
          medDate.setDate(medDate.getDate() + 30);
          med.nextRefillDate = medDate.toISOString().split('T')[0];
        }
      }
    });
  }

  savePatientsData();

  // Sync to OneDrive
  if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveToOneDrive === 'function') {
    window.pmgOneDriveSync.saveToOneDrive(patientsData);
  }

  renderPatientModule();
  if (viewingPatientId === p.id) {
    viewPatientProfile(p.id);
  }

  // Offer to send WhatsApp confirmation to patient
  const confirmWa = confirm(`✅ 1-Month Extension Approved!\n\nPatient: ${p.name}\nNew Next TCA Reminder: ${newTcaDateStr}\n\nWould you like to send WhatsApp confirmation to the patient now?`);
  if (confirmWa) {
    const waText = `您好 *${p.name}*，这里是 *PMG Pharmacy (${p.branch})* 药剂关怀团队。

您的常规慢病药物与保健品续药及【顺延 1 个月复诊】申请已审核通过！

🗓️ *更新后下一次复诊/随访提醒日期：* ${newTcaDateStr}
💊 *常规用药与保健品：* 药剂师已为您备妥常规用药，您可在方便时间前往分店取药。

如有任何用药疑问或需要安排送药服务，欢迎随时联系我们。祝您身体健康，生活顺心！`;

    const cleanPhone = formatPhoneForWa(p.phone);
    if (cleanPhone) {
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    }
  }
}

function resetCustomerBookingForm() {
  document.getElementById('customerBookingForm').reset();
  document.getElementById('customerBookingSuccessCard').classList.add('hidden');
  document.getElementById('customerBookingFormCard').classList.remove('hidden');
  initCustomerBooking('Kota Sentosa');
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── PHARMACIST OPERATING HOURS & SHIFT MODAL CONTROLLER ─────────────────────
// ═════════════════════════════════════════════════════════════════════════════
let activeHoursSubTab = 'weekly';

function openManageHoursModal() {
  const modal = document.getElementById('manageHoursModal');
  if (!modal) return;

  const session = typeof getSession === 'function' ? getSession() : null;
  const rawUserBranch = (session && session.branch && session.branch !== 'ALL') ? session.branch : 'Kota Sentosa';
  const userBranch = normalizeBranchCode(rawUserBranch);

  const branchSelect = document.getElementById('hoursBranchSelect');
  if (branchSelect) {
    for (let opt of branchSelect.options) {
      if (normalizeBranchCode(opt.value) === userBranch || opt.text.includes(userBranch)) {
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
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
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
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
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
  updateShareBookingUrl();
  updateCustBookHours();
  alert(`Weekly template for ${sched.branchName || code} saved successfully!`);
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
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
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
  updateShareBookingUrl();
  updateCustBookHours();
  const form = document.getElementById('dateOverrideForm');
  if (form) form.reset();
  toggleOverrideTimeInputs();
}

function deleteDateOverride(dateStr) {
  const branchSelect = document.getElementById('hoursBranchSelect');
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
  const sched = getPharmacistSchedule(code);

  if (sched.dateOverrides && sched.dateOverrides[dateStr]) {
    delete sched.dateOverrides[dateStr];
    savePharmacistSchedule(code, sched);
    renderDateOverridesTbody(sched);
    updateShareBookingUrl();
    updateCustBookHours();
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
  const rawCode = branchSelect ? branchSelect.value : 'Kota Sentosa';
  const code = normalizeBranchCode(rawCode);
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64 string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function runAiClinicalReview() {
  const apiKey = (localStorage.getItem('pmg_gemini_key') || '').trim();
  if (!apiKey) {
    alert('API Key is required to auto generate clinical recommendations.\n\nPlease enter your API Key in the 5S Walkthrough Auditor tab, or load the setup link (index.html?setkey=YOUR_KEY).');
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
    rossmaxAct: document.getElementById('encRossmaxAct')?.value.trim() || '',
    customPoctNotes: document.getElementById('encOtherTestsNotes')?.value.trim() || ''
  };

  const bca = {
    weight: document.getElementById('encWeight')?.value || '',
    height: document.getElementById('encHeight')?.value || '',
    bmi: document.getElementById('encBmi')?.value || '',
    bodyFat: document.getElementById('encBodyFat')?.value || '',
    visceralFat: document.getElementById('encVisceralFat')?.value || '',
    muscleMass: document.getElementById('encMuscleMass')?.value || '',
    metabolicAge: document.getElementById('encMetabolicAge')?.value || '',
    bmrWater: document.getElementById('encBmrWater')?.value.trim() || ''
  };

  const tedaNotes = document.getElementById('encTeda')?.value.trim() || '';
  const tedaLink = document.getElementById('encTedaLink')?.value.trim() || '';

  const planMeds = document.getElementById('encPlanMeds')?.value.trim() || '';
  const planSupps = document.getElementById('encPlanSupps')?.value.trim() || '';
  const chronicMeds = (patient.medications || []).map(m => `${m.name} ${m.dose || ''} (${m.freq || ''})`).join(', ');
  const fullMedsList = [chronicMeds, planMeds].filter(Boolean).join('; ');

  const loadingEl = document.getElementById('aiClinicalLoading');
  const loadingText = document.getElementById('aiClinicalLoadingText');
  const resultPanel = document.getElementById('aiClinicalResultPanel');
  const runBtn = document.getElementById('btnAiClinicalReview');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (loadingText) loadingText.textContent = `Generating clinical recommendations…`;
  if (resultPanel) resultPanel.classList.add('hidden');
  if (runBtn) runBtn.disabled = true;

  // Process Airdoc Retinal PDF / Image for Multimodal Gemini Inspection
  let airdocBase64 = null;
  let airdocMimeType = 'application/pdf';
  if (selectedAirdocFile) {
    if (selectedAirdocFile.size > 15 * 1024 * 1024) {
      alert('The attached Airdoc PDF exceeds 15MB. Analyzing based on file metadata and notes.');
    } else {
      try {
        if (loadingText) loadingText.textContent = `Reading Airdoc Retinal AI report (${selectedAirdocFile.name})…`;
        airdocMimeType = selectedAirdocFile.type || 'application/pdf';
        airdocBase64 = await readFileAsBase64(selectedAirdocFile);
      } catch (err) {
        console.warn('[PMG AI Review] Could not encode Airdoc PDF for multimodal review:', err);
      }
    }
  }

  // Process CGM Continuous Glucose Monitoring PDF for Multimodal Gemini Inspection
  let cgmBase64 = null;
  let cgmMimeType = 'application/pdf';
  if (selectedCgmFile) {
    if (selectedCgmFile.size > 15 * 1024 * 1024) {
      alert('The attached CGM PDF exceeds 15MB. Analyzing based on file metadata and notes.');
    } else {
      try {
        if (loadingText) loadingText.textContent = `Reading CGM Report (${selectedCgmFile.name})…`;
        cgmMimeType = selectedCgmFile.type || 'application/pdf';
        cgmBase64 = await readFileAsBase64(selectedCgmFile);
      } catch (err) {
        console.warn('[PMG AI Review] Could not encode CGM PDF for multimodal review:', err);
      }
    }
  }

  // Process Zentalog Diet, Exercise & Home Log PDF for Multimodal Gemini Inspection
  let zentalogBase64 = null;
  let zentalogMimeType = 'application/pdf';
  if (selectedZentalogFile) {
    if (selectedZentalogFile.size > 15 * 1024 * 1024) {
      alert('The attached Zentalog PDF exceeds 15MB. Analyzing based on file metadata and notes.');
    } else {
      try {
        if (loadingText) loadingText.textContent = `Reading Zentalog Report (${selectedZentalogFile.name})…`;
        zentalogMimeType = selectedZentalogFile.type || 'application/pdf';
        zentalogBase64 = await readFileAsBase64(selectedZentalogFile);
      } catch (err) {
        console.warn('[PMG AI Review] Could not encode Zentalog PDF for multimodal review:', err);
      }
    }
  }

  // Check & Auto-Decrypt TEDA WellScan Online Report if link provided
  let tedaDecryptedData = window._cachedTedaReport || null;
  if (!tedaDecryptedData && tedaLink) {
    const rid = extractTedaRid(tedaLink);
    if (rid) {
      try {
        if (loadingText) loadingText.textContent = 'Decrypting & analyzing TEDA WellScan online report…';
        tedaDecryptedData = await fetchAndDecryptTedaReport(rid);
        window._cachedTedaReport = tedaDecryptedData;
      } catch (err) {
        console.warn('[PMG AI Review] TEDA on-the-fly fetch failed:', err);
      }
    }
  }

  const airdocFilePromptText = selectedAirdocFile
    ? `ATTACHED RETINAL SCAN DOCUMENT: [Filename: "${selectedAirdocFile.name}", Size: ${formatFileSize(selectedAirdocFile.size)}].
PLEASE INSPECT AND ANALYZE THE ATTACHED AIRDOC RETINAL REPORT MULTIMODALLY. Extract optic disc (CDR), microvascular status (arteriolar narrowing, AV nicking, hemorrhages, microaneurysms, hard exudates), hypertensive/diabetic retinopathy grading, and Airdoc AI cardiovascular risk score.`
    : 'No Airdoc scan file uploaded for this consultation.';

  const cgmFilePromptText = selectedCgmFile
    ? `ATTACHED CONTINUOUS GLUCOSE MONITORING (CGM) DOCUMENT: [Filename: "${selectedCgmFile.name}", Size: ${formatFileSize(selectedCgmFile.size)}].
PLEASE INSPECT AND ANALYZE THE ATTACHED CGM REPORT MULTIMODALLY. Extract Time-in-Range (TIR % between 3.9 - 10.0 mmol/L), Time Below Range (TBR % hypoglycemia < 3.9 mmol/L), Time Above Range (TAR % hyperglycemia > 10.0 mmol/L), Glucose Management Indicator (GMI / estimated HbA1c), Glycemic Variability (%CV target <= 36%), nocturnal hypoglycemic dips, and mealtime glycemic excursions.`
    : 'No CGM report file uploaded for this consultation.';

  const zentalogFilePromptText = selectedZentalogFile
    ? `ATTACHED ZENTALOG DIET, EXERCISE & HOME LOG DOCUMENT: [Filename: "${selectedZentalogFile.name}", Size: ${formatFileSize(selectedZentalogFile.size)}].
PLEASE INSPECT AND ANALYZE THE ATTACHED ZENTALOG REPORT MULTIMODALLY. Extract dietary macronutrient triggers (carbohydrate spikes, late-night dinners, ultra-processed food intake), physical activity/step patterns, and home blood pressure/glucose patterns.`
    : 'No Zentalog report file uploaded for this consultation.';

  const medHistoryText = document.getElementById('encMedicalHistory')?.value.trim() || patient.medicalHistory || 'None noted';

  const prompt = `You are an expert Clinical Pharmacist and Nutritional Specialist for PMG Pharmacy in Malaysia.
Evaluate this patient consultation, POCT laboratory profile, specialty scans (Airdoc Retinal AI, Continuous Glucose Monitoring [CGM], Zentalog Diet & Lifestyle Log, and TEDA TCM/Meridian Scan), Body Composition Analysis, and medication regimen.

PATIENT PROFILE:
Name: ${patient.name || 'Anonymous'}
Age: ${patient.age || 'N/A'}, Gender: ${patient.gender || 'N/A'}
Known Allergies: ${patient.allergies || 'None'}
Chronic Conditions: ${(patient.chronicConditions || patient.conditions || []).join(', ') || 'None noted'}
Medical History (PMHx, Surgeries, Illnesses): ${medHistoryText}
Current Chronic Medications: ${chronicMeds || 'None listed'}

CURRENT CONSULTATION (SOAP):
Chief Complaint: ${cc}
History of Present Illness: ${hpi}

OBJECTIVE VITALS & ANTHROPOMETRY:
BP: ${vitals.bpSys && vitals.bpDia ? vitals.bpSys + '/' + vitals.bpDia + ' mmHg' : 'Not taken'}
Pulse: ${vitals.pulse ? vitals.pulse + ' bpm' : 'N/A'}, SpO2: ${vitals.spo2 ? vitals.spo2 + '%' : 'N/A'}
Weight: ${bca.weight || 'N/A'} kg, Height: ${bca.height || 'N/A'} cm, BMI: ${bca.bmi || 'N/A'}

BODY COMPOSITION ANALYSIS (BCA - Branch Analyzer):
- Body Fat: ${bca.bodyFat ? bca.bodyFat + '%' : 'Not tested'}
- Visceral Fat Rating: ${bca.visceralFat ? bca.visceralFat + ' (Rating scale: 1-9 Normal, 10-14 High, >=15 Very High / Severe)' : 'Not tested'}
- Skeletal Muscle Mass: ${bca.muscleMass ? bca.muscleMass + ' kg' : 'Not tested'}
- Metabolic / Biological Age: ${bca.metabolicAge ? bca.metabolicAge + ' yrs (Chronological Age: ' + (patient.age || 'N/A') + ' yrs)' : 'Not tested'}
- BMR / Body Water: ${bca.bmrWater || 'Not recorded'}

POCT LABORATORY READINGS:
Blood Glucose: ${vitals.glucose ? vitals.glucose + ' mmol/L (' + vitals.glucoseType + ')' : 'N/A'}, HbA1c: ${vitals.hba1c ? vitals.hba1c + '%' : 'N/A'}
Lipid Panel: TC: ${vitals.tc || 'N/A'} mmol/L, TG: ${vitals.tg || 'N/A'}, HDL: ${vitals.hdl || 'N/A'}, LDL: ${vitals.ldl || 'N/A'}, AI: ${vitals.ai || 'N/A'}, R-CHD: ${vitals.rchd || 'N/A'}
Kidney Panel: Uric Acid: ${vitals.ua || 'N/A'} umol/L, Creatinine: ${vitals.creatinine || 'N/A'} umol/L, Urea: ${vitals.urea || 'N/A'} mmol/L, eGFR: ${vitals.egfr || 'N/A'}
Liver Panel: AST: ${vitals.ast || 'N/A'} U/L, ALT: ${vitals.alt || 'N/A'} U/L, Albumin: ${vitals.alb || 'N/A'} g/L
Specialty Tests: Vit D: ${vitals.vitD || 'N/A'}, Ferritin: ${vitals.ferritin || 'N/A'}, Rossmax ACT (Artery Condition / Vascular Stiffness): ${vitals.rossmaxAct || 'N/A'}
Other POCT Notes: ${vitals.customPoctNotes || 'None'}

SPECIALTY WELLNESS & DIAGNOSTIC SCANS:
- TEDA TCM & Meridian Wellness Scan:
  * TEDA Link: ${tedaLink || 'None provided'}
  ${tedaDecryptedData ? `
  * DECRYPTED ONLINE TEDA WELLSCAN DATA (Live API Extraction):
    - Report ID: ${tedaDecryptedData.rid}
    - Report Date: ${tedaDecryptedData.reportDate || 'Recent'}
    - Overall Immunity Score (免疫力指数): ${tedaDecryptedData.immunityScore}/100 [TEDA standard: score < 50 is suboptimal/low immunity, >= 50 is normal/good] | Overall Health Score (健康指数): ${tedaDecryptedData.healthScore}/100
    - Core Conditioning Principle / Advice: ${tedaDecryptedData.advice || 'N/A'}
    - Sub-health Zang-Fu Organs (脏腑辩证 亚健康 [score < 7.0]): ${tedaDecryptedData.subHealthZangfu.map(z => `${z.name} ${z.score}分 (${z.wuxing || ''})`).join('; ') || (tedaDecryptedData.zangfuSummary || 'All organs normal')}
    - Constitutional Disharmonies (气血津液体质 [score < 7.0]): ${tedaDecryptedData.subHealthTizhi.map(t => `${t.name} ${t.score}分`).join('; ') || (tedaDecryptedData.tizhiSummary || 'Balanced')}
    - Blocked / Sluggish Meridians (经络淤堵 [score < 7.0]): ${tedaDecryptedData.blockedJingluo.map(j => `${j.name} ${j.score}分`).join('; ') || (tedaDecryptedData.jingluoSummary || 'Normal flow')}
    - Spine Load / Pressure (脊柱负荷 [score < 7.0]): ${tedaDecryptedData.spinePressure.map(s => `${s.name} ${s.score}分`).join('; ') || (tedaDecryptedData.jizhuSummary || 'Normal')}
    - Pharmacist Additional Notes: ${tedaNotes || 'None'}
  ` : `
  * TCM Findings & Meridians: ${tedaNotes || 'Not recorded'}
  *(Note: TEDA evaluates: Qi balance [Qi deficiency, Qi stagnation], Yin & Yang harmony, 12 Organ Meridians, Dampness/Phlegm [湿气/痰湿]. Benchmark: score < 7.0 is suboptimal, score >= 7.0 is normal/good; Immunity score < 50 is suboptimal, >= 50 is good.)
  `}
- Airdoc Retinal AI Scan:
  * ${airdocFilePromptText}
- Continuous Glucose Monitoring (CGM):
  * ${cgmFilePromptText}
- Zentalog Diet, Exercise & Home Log:
  * ${zentalogFilePromptText}

PRESCRIBED / PROPOSED MEDICATIONS:
${fullMedsList || 'No prescription medications currently recorded'}

CURRENT / PROPOSED SUPPLEMENTS:
${planSupps || 'None recorded'}

CRITICAL CLINICAL INSTRUCTIONS:
1. TEDA TCM & MERIDIAN WELLNESS BENCHMARKS & SYNTHESIS:
   - TEDA Benchmark Rules:
     * Component / organ / meridian / spine scores < 7.0 are SUBOPTIMAL (亚健康 / 偏低 / 淤堵) and warrant intervention.
     * Scores >= 7.0 are GOOD / NORMAL.
     * Overall Immunity Index < 50 is SUBOPTIMAL / LOW IMMUNITY (需提升免疫); >= 50 is NORMAL / HEALTHY.
   - Synthesize Qi status (deficiency vs stagnation), Yin/Yang balance, dampness/phlegm (湿气), and organ meridians (Liver, Kidney, Spleen, Heart, Lung).
   - Correlate TCM findings with Western POCT labs (e.g. Spleen Qi deficiency & dampness with visceral fat/triglycerides; Kidney Yin deficiency with arterial stiffness and hypertension).

2. CONTINUOUS GLUCOSE MONITORING (CGM) & ZENTALOG DIET/LIFESTYLE INTEGRATION:
   - If CGM report is attached: inspect TIR (Time-in-Range), TBR (hypoglycemia risk), TAR (hyperglycemia spikes), %CV (glycemic variability target <= 36%), and nocturnal dips.
   - If Zentalog is attached: correlate mealtime carbohydrate surges, late-night dinners, and exercise/step deficits directly with CGM excursions and blood lipid/glucose readings.

3. AIRDOC RETINAL MICROVASCULAR & OPTIC EVALUATION:
   - Inspect cup-to-disc ratio (CDR), retinal microvessels (arteriolar narrowing, AV nicking, hemorrhages, microaneurysms, hard exudates), hypertensive/diabetic retinopathy signs, and cardiovascular risk.

4. MULTI-SYSTEM INTEGRATIVE CLINICAL SYNTHESIS:
   - Integrate Retinal Microvasculature (Airdoc) + Glycemic Dynamics (CGM) + Lifestyle Triggers (Zentalog) + Artery Stiffness (Rossmax ACT) + Body Composition (Visceral Fat / Muscle) + TCM Energetic Constitution (TEDA) + POCT Laboratory Blood Readings into a unified, holistic health profile.

5. DRUG-DRUG & DRUG-SUPPLEMENT INTERACTIONS:
   - Identify interactions between medications and proposed supplements ("none", "moderate", or "high").

6. PMG HOUSE BRAND COMPANION SUPPLEMENT RECOMMENDATIONS:
   - Recommend 2-4 companion supplements/nutraceuticals to counter drug-induced depletions (e.g. statin-induced CoQ10 depletion, metformin-induced B12 depletion) or optimize metabolic, cardiovascular, retinal, or joint health.
   - CRITICAL: Prioritize PMG House Brands:
     * "JH Nutrition" (Alpha Gold, Systoright, Flexson, Livason, Nacous NAC, Eclipx, Immucol, Citazinc)
     * "V-Infinity" (Neuright B-Complex+ALA, Fiono Omega-3 1200mg, Neoflex, Tygeres, Tyreps, Vtrox)
     * "Nutribridge" (Glycoway, Lipicholin, Neo-D3, Opticlear, Q-Folix, Vitaglo, Zencool, Flexsure Gold)
     * "Livemore" (Co-Q10 Plus, Gasmint, Ginoba, Methylcobalamin, Neo-D3, Neomega)
     * Other PMG brands: Biowell, Lucentia, Dermisk, Axon

7. CHRONOTHERAPY (BEST TIMING OF INTAKE):
   - Categorize all medications and recommended supplements into: Morning, Afternoon, Evening, Bedtime with precise scientific rationale.

8. CLINICAL ASSESSMENT & PRE-DIAGNOSTIC:
   - Concise pharmacist impression of current disease control and risk stratification. Avoid words like "AI", formulate as professional clinical impression.

9. COUNSELLING & LIFESTYLE:
   - 3 to 5 targeted, practical lifestyle and dietary counselling pearls.

RESPONSE MUST BE STRICTLY VALID JSON matching this structure:
{
  "interactionSummary": "none" | "moderate" | "high",
  "interactionDetails": "string",
  "specialtySynthesis": {
    "airdocRetinalStatus": "e.g. Normal / Early Arteriolar Narrowing / Grade 1 Hypertensive Retinopathy / Glaucoma Risk / Not Attached",
    "airdocSummary": "Concise summary of retinal microvascular and optic findings from Airdoc (or note stating no scan was attached)",
    "cgmStatus": "e.g. Optimal TIR 82% / High Glycemic Variability (CV 41%) / Post-prandial Excursions / Not Attached",
    "cgmSummary": "Concise summary of CGM metrics (TIR %, TAR %, TBR %, GMI, %CV, nocturnal dips)",
    "zentalogStatus": "e.g. High Carb Spikes & Low Activity / Good Compliance / Sedentary / Not Attached",
    "zentalogSummary": "Concise summary of diet, exercise, and home monitoring patterns",
    "bcaStatus": "e.g. Optimal / Elevated Visceral Fat / Sarcopenic Risk / Metabolic Age +7 yrs / Not Tested",
    "bcaSummary": "Concise summary of visceral fat, skeletal muscle mass, body fat %, and metabolic age",
    "tedaTcmStatus": "e.g. Spleen Qi Deficiency with Dampness / Kidney Yin Weak / Liver Fire / Balanced / Not Recorded",
    "tedaTcmSummary": "Concise summary of TCM Qi, Yin-Yang balance, meridian vitality, and dampness/phlegm (adhering to score < 7.0 suboptimal, immunity < 50 suboptimal)",
    "multiSystemCorrelation": "Holistic clinical synthesis correlating retinal microvessels, arterial stiffness, CGM glycemic variability, Zentalog lifestyle patterns, body composition, TCM meridian patterns, and blood POCT labs"
  },
  "houseBrands": [
    {
      "brand": "Livemore" | "JH Nutrition" | "V-Infinity" | "Nutribridge" | "PMG",
      "product": "Product Name",
      "indication": "Clinical rationale (addressing drug depletions, metabolic health, ocular protection, or TCM constitutional support)",
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
      if (loadingText) loadingText.textContent = `Generating clinical recommendations…`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

      const requestParts = [{ text: prompt }];
      if (airdocBase64) {
        requestParts.push({
          inlineData: {
            mimeType: airdocMimeType,
            data: airdocBase64
          }
        });
      }
      if (cgmBase64) {
        requestParts.push({
          inlineData: {
            mimeType: cgmMimeType,
            data: cgmBase64
          }
        });
      }
      if (zentalogBase64) {
        requestParts.push({
          inlineData: {
            mimeType: zentalogMimeType,
            data: zentalogBase64
          }
        });
      }

      const payload = {
        contents: [
          {
            role: 'user',
            parts: requestParts
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2500,
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
    alert('Could not auto generate clinical recommendations. Please verify your API key and network connection.');
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

  // 1.5. Specialty Scans: Airdoc, CGM, Zentalog, Body Composition & TEDA TCM Synthesis
  const specPanel = document.getElementById('aiSpecialtyScansPanel');
  if (specPanel) {
    const synth = res.specialtySynthesis || res.airdocTedaSynthesis;
    if (synth && (synth.airdocSummary || synth.cgmSummary || synth.zentalogSummary || synth.bcaSummary || synth.tedaTcmSummary || synth.tedaSummary || synth.multiSystemCorrelation)) {
      specPanel.classList.remove('hidden');

      // Airdoc Retinal Card
      const airdocBadge = document.getElementById('aiAirdocStatusBadge');
      const airdocText = document.getElementById('aiAirdocSummaryText');
      if (airdocBadge) {
        airdocBadge.textContent = synth.airdocRetinalStatus || 'Evaluated';
        const st = (synth.airdocRetinalStatus || '').toLowerCase();
        if (st.includes('normal') || st.includes('clear')) {
          airdocBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200';
        } else if (st.includes('grade') || st.includes('narrowing') || st.includes('nicking') || st.includes('risk')) {
          airdocBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200';
        } else {
          airdocBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200';
        }
      }
      if (airdocText) {
        airdocText.textContent = synth.airdocSummary || 'No specific retinal findings reported.';
      }

      // CGM Card
      const cgmBadge = document.getElementById('aiCgmStatusBadge');
      const cgmText = document.getElementById('aiCgmSummaryText');
      if (cgmBadge) {
        cgmBadge.textContent = synth.cgmStatus || 'Evaluated';
        const st = (synth.cgmStatus || '').toLowerCase();
        if (st.includes('optimal') || st.includes('good') || st.includes('normal')) {
          cgmBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200';
        } else if (st.includes('high') || st.includes('variability') || st.includes('spike') || st.includes('tbr') || st.includes('tar')) {
          cgmBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200';
        } else {
          cgmBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200';
        }
      }
      if (cgmText) {
        cgmText.textContent = synth.cgmSummary || 'CGM continuous glucose metrics evaluated.';
      }

      // Zentalog Card
      const zentaBadge = document.getElementById('aiZentalogStatusBadge');
      const zentaText = document.getElementById('aiZentalogSummaryText');
      if (zentaBadge) {
        zentaBadge.textContent = synth.zentalogStatus || 'Evaluated';
        const st = (synth.zentalogStatus || '').toLowerCase();
        if (st.includes('optimal') || st.includes('good') || st.includes('balanced') || st.includes('compliant')) {
          zentaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200';
        } else if (st.includes('high') || st.includes('sedentary') || st.includes('spike') || st.includes('late')) {
          zentaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200';
        } else {
          zentaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200';
        }
      }
      if (zentaText) {
        zentaText.textContent = synth.zentalogSummary || 'Dietary triggers, exercise, and home logs analyzed.';
      }

      // Body Composition (BCA) Card
      const bcaBadge = document.getElementById('aiBcaStatusBadge');
      const bcaText = document.getElementById('aiBcaSummaryText');
      if (bcaBadge) {
        bcaBadge.textContent = synth.bcaStatus || 'Evaluated';
        const st = (synth.bcaStatus || '').toLowerCase();
        if (st.includes('optimal') || st.includes('healthy') || st.includes('balanced')) {
          bcaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200';
        } else if (st.includes('elevated') || st.includes('high') || st.includes('sarcopenic') || st.includes('+')) {
          bcaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200';
        } else {
          bcaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200';
        }
      }
      if (bcaText) {
        bcaText.textContent = synth.bcaSummary || 'Visceral fat and muscle mass analyzed.';
      }

      // TEDA TCM & Meridian Card
      const tedaBadge = document.getElementById('aiTedaStatusBadge');
      const tedaText = document.getElementById('aiTedaSummaryText');
      if (tedaBadge) {
        tedaBadge.textContent = synth.tedaTcmStatus || synth.tedaMetabolicStatus || 'Evaluated';
        const st = (synth.tedaTcmStatus || synth.tedaMetabolicStatus || '').toLowerCase();
        if (st.includes('balanced') || st.includes('harmonious') || st.includes('normal')) {
          tedaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200';
        } else if (st.includes('deficiency') || st.includes('stagnation') || st.includes('fire') || st.includes('damp') || st.includes('weak') || st.includes('stasis')) {
          tedaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200';
        } else {
          tedaBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200';
        }
      }
      if (tedaText) {
        tedaText.textContent = synth.tedaTcmSummary || synth.tedaSummary || 'TCM meridian energy and Qi/Yin/Yang balance analyzed.';
      }

      // Holistic Multi-System Correlation
      const corrText = document.getElementById('aiMultiSystemCorrText');
      if (corrText) {
        corrText.textContent = synth.multiSystemCorrelation || 'Retinal microvasculature, CGM glycemic dynamics, Zentalog diet, body composition, TCM constitution, and arterial conditions correlated with POCT panel.';
      }
    } else {
      specPanel.classList.add('hidden');
    }
  }

  // 2. House Brand Supplements with Selection Checkboxes & Individual Add Buttons
  const houseBrandsEl = document.getElementById('aiHouseBrandsList');
  if (houseBrandsEl) {
    if (res.houseBrands && res.houseBrands.length) {
      houseBrandsEl.innerHTML = res.houseBrands.map((item, idx) => {
        let badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
        const brandUpper = (item.brand || '').toUpperCase();
        if (brandUpper.includes('JH')) badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
        else if (brandUpper.includes('INFINITY')) badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
        else if (brandUpper.includes('NUTRI')) badgeColor = 'bg-teal-100 text-teal-800 border-teal-200';
        else if (brandUpper.includes('LIVE')) badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';

        return `
          <div class="p-3 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-xs transition">
            <div class="flex items-start justify-between gap-2 mb-1">
              <label class="flex items-center gap-2 cursor-pointer font-bold text-gray-900 text-xs sm:text-sm">
                <input type="checkbox" class="ai-supp-cb w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer" data-idx="${idx}" onchange="onSuppSelectionChange()" checked>
                <span>${escHtml(item.product)}</span>
              </label>
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}">${escHtml(item.brand)}</span>
                <button type="button" onclick="applySingleAiSupplement(${idx})" class="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-2 py-0.5 rounded-lg transition" title="Add this item to Plan">
                  <i class="fa-solid fa-plus text-[10px]"></i> Add
                </button>
              </div>
            </div>
            <p class="text-xs text-gray-600 ml-6 mb-1">${escHtml(item.indication)}</p>
            <p class="text-xs font-semibold text-purple-900 ml-6 flex items-center gap-1.5">
              <i class="fa-solid fa-prescription text-purple-600 text-[11px]"></i>
              <span>${escHtml(item.dosage)}</span>
            </p>
          </div>
        `;
      }).join('');
    } else {
      houseBrandsEl.innerHTML = '<p class="text-xs text-gray-500 italic p-3">No specific companion supplements required for this case.</p>';
    }
  }

  // 3. Chronotherapy Timing Grid (Dynamic Based on Selected Supplements)
  updateChronotherapyView();

  // 4. Assessment & Counselling
  const assessEl = document.getElementById('aiAssessmentText');
  if (assessEl) {
    assessEl.textContent = res.assessmentSummary || 'Patient stable.';
  }

  const counselEl = document.getElementById('aiCounsellingList');
  if (counselEl) {
    const points = res.counsellingPoints || [];
    if (points.length) {
      counselEl.innerHTML = points.map(p => `<li>${escHtml(p)}</li>`).join('');
    } else {
      counselEl.innerHTML = '<li>Regular lifestyle maintenance and medication adherence.</li>';
    }
  }

  panel.classList.remove('hidden');
}

// ─── SELECTABLE HOUSE BRAND SUPPLEMENTS HELPERS ─────────────────────────────
function toggleAllAiSupplements(checked) {
  document.querySelectorAll('.ai-supp-cb').forEach(cb => {
    cb.checked = checked;
  });
  onSuppSelectionChange();
}

function onSuppSelectionChange() {
  updateChronotherapyView();
}

function applySingleAiSupplement(idx) {
  if (!currentAiReviewResult || !currentAiReviewResult.houseBrands || !currentAiReviewResult.houseBrands[idx]) return;
  const item = currentAiReviewResult.houseBrands[idx];
  const suppInput = document.getElementById('encPlanSupps');
  if (!suppInput) return;

  const line = `${item.product} (${item.dosage})`;
  const existing = suppInput.value.trim();
  if (existing) {
    suppInput.value = `${existing}\n${line}`;
  } else {
    suppInput.value = line;
  }
  if (typeof showPmgToast === 'function') {
    showPmgToast(`✅ Added ${item.product} to Plan`, 'success');
  } else {
    alert(`Added ${item.product} to Plan`);
  }
}

function applyAiSupplements() {
  if (!currentAiReviewResult || !currentAiReviewResult.houseBrands || !currentAiReviewResult.houseBrands.length) {
    alert('No recommended supplements available to apply.');
    return;
  }
  const checkedBoxes = Array.from(document.querySelectorAll('.ai-supp-cb:checked'));
  if (!checkedBoxes.length) {
    alert('Please select at least one supplement checkbox to apply to your plan.');
    return;
  }
  const suppInput = document.getElementById('encPlanSupps');
  if (!suppInput) return;

  const selectedItems = checkedBoxes.map(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    return currentAiReviewResult.houseBrands[idx];
  }).filter(Boolean);

  const newSupps = selectedItems.map(b => `${b.product} (${b.dosage})`).join('\n');
  const existing = suppInput.value.trim();
  if (existing) {
    suppInput.value = `${existing}\n${newSupps}`;
  } else {
    suppInput.value = newSupps;
  }
  if (typeof showPmgToast === 'function') {
    showPmgToast(`✅ Added ${selectedItems.length} selected supplement(s) to Plan!`, 'success');
  } else {
    alert(`✅ Added ${selectedItems.length} selected supplement(s) to Plan!`);
  }
}

// ─── DYNAMIC CHRONOTHERAPY HELPERS ──────────────────────────────────────────
function getActiveChronotherapy() {
  if (!currentAiReviewResult || !currentAiReviewResult.chronotherapy) return {};
  const c = currentAiReviewResult.chronotherapy;
  const houseBrands = currentAiReviewResult.houseBrands || [];
  const uncheckedProductNames = [];

  document.querySelectorAll('.ai-supp-cb').forEach(cb => {
    if (!cb.checked) {
      const idx = parseInt(cb.dataset.idx, 10);
      if (houseBrands[idx] && houseBrands[idx].product) {
        uncheckedProductNames.push(houseBrands[idx].product.toLowerCase().trim());
      }
    }
  });

  const filterSlot = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(it => {
      const itemLower = (it.item || '').toLowerCase().trim();
      const isUnchecked = uncheckedProductNames.some(pName => itemLower.includes(pName) || pName.includes(itemLower));
      return !isUnchecked;
    });
  };

  return {
    morning: filterSlot(c.morning),
    afternoon: filterSlot(c.afternoon),
    evening: filterSlot(c.evening),
    bedtime: filterSlot(c.bedtime)
  };
}

function updateChronotherapyView() {
  const timingGridEl = document.getElementById('aiTimingGrid');
  if (!timingGridEl) return;

  const slots = [
    { key: 'morning',   label: 'Morning (Breakfast)', icon: 'fa-sun text-amber-500',   bg: 'bg-amber-50/50' },
    { key: 'afternoon', label: 'Afternoon (Lunch)',   icon: 'fa-sun text-orange-500',  bg: 'bg-orange-50/50' },
    { key: 'evening',   label: 'Evening (Dinner)',    icon: 'fa-cloud-sun text-indigo-500', bg: 'bg-indigo-50/50' },
    { key: 'bedtime',   label: 'Bedtime (Night)',     icon: 'fa-moon text-blue-700',   bg: 'bg-blue-50/50' }
  ];

  const chrono = getActiveChronotherapy();
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
            <span class="font-bold text-[11px] text-gray-900 block">${escHtml(it.item)}</span>
            <span class="text-[10px] text-gray-500 block leading-tight">${escHtml(it.note || '')}</span>
          </div>
        `).join('') : '<span class="text-[10px] text-gray-400 italic">None scheduled</span>'}
      </div>
    `;
  }).join('');
}

function applyAiSchedule() {
  const chrono = getActiveChronotherapy();
  if (!chrono.morning?.length && !chrono.afternoon?.length && !chrono.evening?.length && !chrono.bedtime?.length) {
    alert('No scheduled items in the chronotherapy plan to apply.');
    return;
  }
  const counselInput = document.getElementById('encPlanCounselling');
  if (!counselInput) return;

  let lines = ['[Chronotherapy Timing of Intake]'];
  if (chrono.morning && chrono.morning.length)     lines.push(`• Morning: ${chrono.morning.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);
  if (chrono.afternoon && chrono.afternoon.length) lines.push(`• Afternoon: ${chrono.afternoon.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);
  if (chrono.evening && chrono.evening.length)     lines.push(`• Evening: ${chrono.evening.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);
  if (chrono.bedtime && chrono.bedtime.length)     lines.push(`• Bedtime: ${chrono.bedtime.map(i => i.item + (i.note ? ' (' + i.note + ')' : '')).join(', ')}`);

  const scheduleText = lines.join('\n');
  const existing = counselInput.value.trim();
  if (existing) {
    counselInput.value = `${existing}\n\n${scheduleText}`;
  } else {
    counselInput.value = scheduleText;
  }
  if (typeof showPmgToast === 'function') {
    showPmgToast('✅ Chronotherapy schedule added to Counselling Plan!', 'success');
  } else {
    alert('✅ Chronotherapy schedule added to Counselling Plan!');
  }
}

function applyAiAssessment() {
  if (!currentAiReviewResult || !currentAiReviewResult.assessmentSummary) {
    alert('No assessment summary available.');
    return;
  }
  const preDiagInput = document.getElementById('encPreDiag');
  if (!preDiagInput) return;

  const existing = preDiagInput.value.trim();
  let impressionText = `[Clinical Impression]: ${currentAiReviewResult.assessmentSummary}`;
  const synth = currentAiReviewResult.specialtySynthesis || currentAiReviewResult.airdocTedaSynthesis;
  if (synth?.multiSystemCorrelation) {
    impressionText += `\n[Integrative Health Synthesis]: ${synth.multiSystemCorrelation}`;
  }

  if (existing) {
    preDiagInput.value = `${existing}\n\n${impressionText}`;
  } else {
    preDiagInput.value = impressionText;
  }
  if (typeof showPmgToast === 'function') {
    showPmgToast('✅ Clinical impression applied to Pre-Diagnostic!', 'success');
  } else {
    alert('✅ Clinical impression applied to Pre-Diagnostic!');
  }
}

// ─── CHRONOTHERAPY WHATSAPP SHARING & IMAGE EXPORT ──────────────────────────
function shareChronotherapyWa() {
  const chrono = getActiveChronotherapy();
  const patientSelect = document.getElementById('encounterPatientSelect');
  const patientId = patientSelect ? patientSelect.value : null;
  const patient = patientsData.find(p => p.id === patientId);
  if (!patient || !patient.phone) {
    alert('Please select a patient with a valid phone number to share via WhatsApp.');
    return;
  }

  const lang = patient.language || 'Chinese';
  const name = patient.name;
  const branchName = (patient.branch === 'KS01' || patient.branch === 'KOTA SENTOSA') ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${patient.branch}`;

  let msg = '';
  if (lang === 'Chinese') {
    msg += `尊敬的 ${name}，这是【${branchName}】药剂师为您定制的每日最佳服药与保健品时间表（时间治疗学 Chronotherapy）：\n\n`;
    if (chrono.morning?.length) {
      msg += `🌅 *早晨（早餐后 / 晨起）：*\n${chrono.morning.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.afternoon?.length) {
      msg += `☀️ *中午（午餐后）：*\n${chrono.afternoon.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.evening?.length) {
      msg += `🌇 *傍晚（晚餐后）：*\n${chrono.evening.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.bedtime?.length) {
      msg += `🌙 *睡前：*\n${chrono.bedtime.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    msg += `💡 *温馨提示：* 按时规律服用可达最佳吸收效果并减少肠胃不适。如有任何用药疑问，欢迎随时联系 PMG 药剂师！`;
  } else if (lang === 'Malay') {
    msg += `Salam ${name}, ini adalah jadual masa pengambilan ubat & suplemen harian anda dari 【${branchName}】 (Kronoterapi):\n\n`;
    if (chrono.morning?.length) {
      msg += `🌅 *Pagi (Selepas Sarapan):*\n${chrono.morning.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.afternoon?.length) {
      msg += `☀️ *Tengah Hari (Selepas Makan Tengah Hari):*\n${chrono.afternoon.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.evening?.length) {
      msg += `🌇 *Petang / Malam (Selepas Makan Malam):*\n${chrono.evening.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.bedtime?.length) {
      msg += `🌙 *Sebelum Tidur:*\n${chrono.bedtime.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    msg += `💡 *Peringatan Mesra:* Ambil mengikut jadual untuk penyerapan optimum dan mengurangkan kesan sampingan. Hubungi ahli farmasi PMG jika ada soalan!`;
  } else {
    msg += `Dear ${name}, here is your personalized daily medication and supplement timing schedule from ${branchName} (Chronotherapy):\n\n`;
    if (chrono.morning?.length) {
      msg += `🌅 *Morning (After Breakfast):*\n${chrono.morning.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.afternoon?.length) {
      msg += `☀️ *Afternoon (After Lunch):*\n${chrono.afternoon.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.evening?.length) {
      msg += `🌇 *Evening (After Dinner):*\n${chrono.evening.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    if (chrono.bedtime?.length) {
      msg += `🌙 *Bedtime:*\n${chrono.bedtime.map(i => `• *${i.item}*${i.note ? ` (${i.note})` : ''}`).join('\n')}\n\n`;
    }
    msg += `💡 *Pharmacist Tip:* Taking items at recommended optimal times maximizes clinical absorption and minimizes gastrointestinal upset. Feel free to reach out with any questions!`;
  }

  const waUrl = `https://wa.me/${formatPhoneForWa(patient.phone)}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

function downloadChronotherapyImage() {
  const chrono = getActiveChronotherapy();
  const patientSelect = document.getElementById('encounterPatientSelect');
  const patientId = patientSelect ? patientSelect.value : null;
  const patient = patientsData.find(p => p.id === patientId) || { name: 'Customer', branch: 'Kota Sentosa' };
  const session = typeof getSession === 'function' ? getSession() : null;
  const pharmacist = session ? session.displayName : 'PMG Pharmacist';
  const encDate = document.getElementById('encDate')?.value || getTodayDateString(0);
  const branchName = (patient.branch === 'KS01' || patient.branch === 'KOTA SENTOSA') ? 'PMG Pharmacy Kota Sentosa' : `PMG Pharmacy ${patient.branch}`;

  const slots = [
    { title: 'Morning (早晨 / Breakfast)', icon: '☀️', color: '#b45309', bg: '#fffbeb', border: '#fde68a', items: chrono.morning || [] },
    { title: 'Afternoon (中午 / Lunch)', icon: '🌤️', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', items: chrono.afternoon || [] },
    { title: 'Evening (傍晚 / Dinner)', icon: '🌇', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', items: chrono.evening || [] },
    { title: 'Bedtime (睡前 / Night)', icon: '🌙', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', items: chrono.bedtime || [] }
  ];

  const totalItems = slots.reduce((acc, s) => acc + s.items.length, 0);
  if (totalItems === 0) {
    alert('No scheduled medications or supplements in the chronotherapy plan to export.');
    return;
  }

  const canvas = document.getElementById('chronoCanvas') || document.createElement('canvas');
  const width = 1200;
  const maxItemsPerSlot = Math.max(...slots.map(s => s.items.length), 2);
  const cardHeight = Math.max(340, 110 + maxItemsPerSlot * 65);
  const height = 240 + cardHeight + 110;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Top Banner
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#1e3a8a');
  gradient.addColorStop(1, '#0284c7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 140);

  // Top Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('PMG PHARMACY · CHRONOTHERAPY SCHEDULE', 50, 60);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '600 19px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Personalized Medication & Supplement Timing (时间治疗学服药指南)', 50, 98);

  // Patient Info Bar
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(50, 160, width - 100, 56, 12);
  } else {
    ctx.rect(50, 160, width - 100, 56);
  }
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Patient: ${patient.name}`, 75, 195);
  ctx.fillText(`Date: ${encDate}`, 430, 195);
  ctx.fillText(`Pharmacist: ${pharmacist}`, 680, 195);
  ctx.fillText(`Branch: ${branchName}`, 940, 195);

  // 4 Slot Cards
  const cardWidth = 260;
  const gap = 16;
  const startX = 50;
  const startY = 240;

  slots.forEach((s, idx) => {
    const x = startX + idx * (cardWidth + gap);
    const y = startY;

    // Card background
    ctx.fillStyle = s.bg;
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, cardWidth, cardHeight, 14);
    } else {
      ctx.rect(x, y, cardWidth, cardHeight);
    }
    ctx.fill();
    ctx.stroke();

    // Card Header Bar
    ctx.fillStyle = s.color;
    ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${s.icon} ${s.title}`, x + 14, y + 36);

    // Divider line
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 48);
    ctx.lineTo(x + cardWidth - 14, y + 48);
    ctx.stroke();

    // Items
    let itemY = y + 78;
    if (s.items.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('None scheduled', x + 20, itemY);
    } else {
      s.items.forEach(it => {
        // Bullet dot
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x + 20, itemY - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Item name
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
        const itemName = it.item.length > 23 ? it.item.substring(0, 21) + '...' : it.item;
        ctx.fillText(itemName, x + 30, itemY);

        // Note / Dosage
        if (it.note) {
          ctx.fillStyle = '#64748b';
          ctx.font = '13px "Segoe UI", system-ui, sans-serif';
          const itemNote = it.note.length > 27 ? it.note.substring(0, 25) + '...' : it.note;
          ctx.fillText(itemNote, x + 30, itemY + 20);
          itemY += 52;
        } else {
          itemY += 40;
        }
      });
    }
  });

  // Footer Bar
  const footerY = height - 45;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PMG Pharmacy Healthcare Group · Caring for your health every moment · PMG 关爱您的健康每一刻', width / 2, footerY);
  ctx.textAlign = 'left';

  // Export & Download
  const link = document.createElement('a');
  link.download = `PMG_Chronotherapy_${patient.name.replace(/\s+/g, '_')}_${encDate}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof showPmgToast === 'function') {
    showPmgToast('✅ Chronotherapy schedule card downloaded successfully! You can send this picture to your customer on WhatsApp.', 'success');
  } else {
    alert('✅ Chronotherapy schedule image downloaded successfully!');
  }
}
