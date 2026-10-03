// js/recruitment.js — PMG HR Recruitment & Applicant Management Module
// William Chai only. Integrates with Patient Care schedule (KS).
'use strict';

(() => {
// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & STORAGE KEYS
// ─────────────────────────────────────────────────────────────────────────────
const REC_KEY         = 'pmg_recruitment_apps_v1';
const REC_SLOTS_KEY   = 'pmg_recruitment_slots_v1';
const REC_SETTINGS_KEY= 'pmg_recruitment_settings_v1';
const MAX_FILE_MB     = 15;

const POSITIONS = [
  { value: 'pharmacist', label: 'Pharmacist (Ahli Farmasi)' },
  { value: 'pharmacy_assistant', label: 'Pharmacy Assistant (Pembantu Farmasi)' },
  { value: 'nutritionist', label: 'Nutritionist (Pakar Pemakanan)' },
  { value: 'dietitian', label: 'Dietitian (Dietitian)' },
  { value: 'cashier', label: 'Cashier / Counter Staff' },
  { value: 'management_trainee', label: 'Management Trainee' },
];

const BRANCHES_APPLY = [
  'PMG Pharmacy Kota Sentosa',
  'PMG Pharmacy Matang Jaya',
  'PMG Pharmacy Sungai Moyan',
  'PMG Pharmacy Malihah',
  'PMG Pharmacy Metrocity',
  'PMG Pharmacy Astana',
  'PMG Pharmacy Samariang',
  'Any / Flexible',
];

const STATUS_META = {
  new:       { label: 'New Application',        color: 'bg-blue-100 text-blue-700',   icon: 'fa-inbox' },
  reviewing: { label: 'Under AI Review',         color: 'bg-amber-100 text-amber-700', icon: 'fa-robot' },
  shortlist: { label: 'Shortlisted',             color: 'bg-emerald-100 text-emerald-700', icon: 'fa-check-circle' },
  invited:   { label: 'Interview Invited',        color: 'bg-purple-100 text-purple-700', icon: 'fa-calendar-check' },
  rejected:  { label: 'Not Suitable',            color: 'bg-red-100 text-red-700',     icon: 'fa-times-circle' },
  hired:     { label: 'Hired',                   color: 'bg-teal-100 text-teal-700',   icon: 'fa-user-check' },
};

// KS pharmacist schedule (William Chai) — Mon-Fri 8H, Sat 4H, Sun off
// Interview slots are auto-excluded if Patient Care calendar is booked on that time
const WILLIAM_SCHEDULE = { 0: null, 1:'0800-1700', 2:'0800-1700', 3:'0800-1700', 4:'0800-1700', 5:'0800-1700', 6:'0800-1200' };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function genId() { return 'APP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase(); }
function now() { return new Date().toISOString(); }
function fmtDate(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtDateTime(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'}); }
function sanitize(str) { return (str||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function el(id) { return document.getElementById(id); }

const DEFAULT_SPM_SUBJECTS = [
  'Bahasa Melayu',
  'Bahasa Inggeris',
  'Sejarah',
  'Matematik',
  'Sains',
  'Pendidikan Islam / Moral',
  'Matematik Tambahan',
  'Biologi / Prinsip Perakaunan'
];

const SPM_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'E', 'G', 'TH'];

function createSpmRowHtml(subject = '', grade = '') {
  return `
    <div class="spm-subject-row flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-300 shadow-2xs">
      <input type="text" name="spmSubject" value="${sanitize(subject)}" placeholder="e.g. Fizik / Prinsip Perakaunan"
        class="text-xs min-w-0 flex-1 font-semibold"
        style="border:1px solid #9ca3af; border-radius:.5rem; padding:.5rem .75rem; font-size:.85rem; font-weight:600; color:#111827 !important; background:#ffffff !important; outline:none; -webkit-text-fill-color:#111827 !important; transition:box-shadow .15s;"
        onfocus="this.style.boxShadow='0 0 0 2px #3b82f6'; this.style.borderColor='#3b82f6';"
        onblur="this.style.boxShadow=''; this.style.borderColor='#9ca3af';">
      <select name="spmGrade" class="rec-input text-xs font-bold font-mono w-28 bg-slate-50 border-gray-300" style="width:7rem;flex-shrink:0;">
        <option value="">-- Grade --</option>
        ${SPM_GRADES.map(g => `<option value="${g}" ${g === grade ? 'selected' : ''}>${g}</option>`).join('')}
      </select>
      <button type="button" onclick="this.closest('.spm-subject-row').remove()" class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded text-xs transition cursor-pointer flex-shrink-0" title="Remove Subject">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
}

function toast(msg, type='info') {
  const t = document.createElement('div');
  const colors = { info:'bg-blue-700', success:'bg-emerald-700', error:'bg-red-700', warn:'bg-amber-600' };
  t.className = `fixed bottom-6 right-4 z-[9999] px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl flex items-center gap-2 transition-all ${colors[type]||colors.info}`;
  t.innerHTML = `<i class="fa-solid ${type==='success'?'fa-check-circle':type==='error'?'fa-triangle-exclamation':'fa-circle-info'}"></i> ${sanitize(msg)}`;
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 3200);
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────────────────────────
function loadApps() { try { return JSON.parse(localStorage.getItem(REC_KEY)||'[]'); } catch { return []; } }
function saveApps(apps) {
  localStorage.setItem(REC_KEY, JSON.stringify(apps));
  // Auto-backup to OneDrive if connected
  try {
    if (window.pmgOneDrive && typeof window.pmgOneDrive.saveRecruitmentToOneDrive === 'function') {
      window.pmgOneDrive.saveRecruitmentToOneDrive(apps);
    }
  } catch(e) {}
}
function loadSlots() { try { return JSON.parse(localStorage.getItem(REC_SLOTS_KEY)||'[]'); } catch { return []; } }
function saveSlots(slots) { localStorage.setItem(REC_SLOTS_KEY, JSON.stringify(slots)); }
// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL GEMINI KEY & ONEDRIVE INTEGRATION (Shared with Whole Program)
// ─────────────────────────────────────────────────────────────────────────────
function getGlobalGeminiKey() {
  return localStorage.getItem('pmg_gemini_key')
    || (document.getElementById('geminiApiKey')?.value)
    || (window.pmgPricing?.geminiKey)
    || '';
}

function promptSetGeminiKey() {
  const current = getGlobalGeminiKey();
  const entered = prompt('Enter your Gemini API Key (saved globally for the whole PMG Hub):', current);
  if (entered !== null) {
    const val = entered.trim();
    if (val) {
      localStorage.setItem('pmg_gemini_key', val);
      const elKey = document.getElementById('geminiApiKey');
      if (elKey) elKey.value = val;
      toast('Global Gemini API Key saved!', 'success');
      renderAmDashboard();
    } else {
      localStorage.removeItem('pmg_gemini_key');
      toast('Gemini API Key cleared.', 'info');
      renderAmDashboard();
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

function recDataUrlToBlob(dataUrl) {
  if (typeof window.dataURLtoBlob === 'function') {
    return window.dataURLtoBlob(dataUrl);
  }
  if (!dataUrl || !dataUrl.includes(',')) return null;
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    return null;
  }
}

// Save a single applicant's profile and real uploaded document files into OneDrive /RECRUITMENT/Applicants/
async function saveSingleApplicantToOneDrive(app, rootHandle) {
  if (!rootHandle || !app) return false;
  try {
    const recDir = await rootHandle.getDirectoryHandle('RECRUITMENT', { create: true });
    const applicantsDir = await recDir.getDirectoryHandle('Applicants', { create: true });
    
    const safeName = (app.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
    const folderName = `${safeName}_${app.id}`;
    const appDir = await applicantsDir.getDirectoryHandle(folderName, { create: true });

    // 1. Write Applicant Profile Info Text File
    const profileText = [
      `======================================================`,
      `PMG PHARMACY - JOB APPLICATION PROFILE`,
      `======================================================`,
      `Application ID   : ${app.id}`,
      `Candidate Name   : ${app.name}`,
      `Position Applied : ${app.position}`,
      `Preferred Outlet : ${app.preferredBranch || 'Any Kuching Outlet'}`,
      `Submission Date  : ${app.appliedAt}`,
      `Status           : ${app.status}`,
      `------------------------------------------------------`,
      `CONTACT INFORMATION`,
      `------------------------------------------------------`,
      `Phone Number     : ${app.phone}`,
      `Email Address    : ${app.email}`,
      `IC Number        : ${app.ic}`,
      `Date of Birth    : ${app.dob}`,
      `Gender / Race    : ${app.gender} / ${app.race}`,
      `Religion         : ${app.religion}`,
      `Residential Addr : ${app.address || 'N/A'}`,
      `Own Transport    : ${app.hasTransport || 'Yes'} (Able to travel: ${app.ableToTravel || 'Yes'})`,
      `Shift Flexibility: ${app.canDoShift || 'Yes'}, 3-Year Commitment: ${app.accept3yr || 'Yes'}`,
      `------------------------------------------------------`,
      `ACADEMIC & EDUCATION BACKGROUND`,
      `------------------------------------------------------`,
      `Highest Qual     : ${app.highestQual || 'N/A'} (${app.major || ''})`,
      `University / Inst: ${app.institution || 'N/A'} (CGPA: ${app.cgpa || 'N/A'})`,
      `SPM Results      :\n${app.spm || 'N/A'}`,
      `Languages Known  : ${app.languages || 'N/A'}`,
      `Work Experience  :\n${app.experience || 'None reported'}`,
      `------------------------------------------------------`,
      `ATTACHED DOCUMENTS (${(app.docs || []).length} files)`,
      `------------------------------------------------------`,
      ...(app.docs || []).map((d, i) => `${i + 1}. [${(d.field || 'doc').replace('file', '').toUpperCase()}] ${d.name} (${Math.round((d.size || 0) / 1024)} KB)`),
      `======================================================`
    ].join('\r\n');

    const profileFh = await appDir.getFileHandle('Applicant_Profile.txt', { create: true });
    const pw = await profileFh.createWritable();
    await pw.write(profileText);
    await pw.close();

    // 2. Write each uploaded document as a standalone file (PDF, JPG, PNG)
    if (Array.isArray(app.docs)) {
      for (const doc of app.docs) {
        if (!doc.data) continue;
        const prefix = (doc.field || 'doc').replace('file', '').toUpperCase();
        const cleanName = `${prefix}_${(doc.name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        
        let exists = false;
        try {
          await appDir.getFileHandle(cleanName, { create: false });
          exists = true;
        } catch (_) { exists = false; }

        if (!exists) {
          const blob = recDataUrlToBlob(doc.data);
          if (blob) {
            const docFh = await appDir.getFileHandle(cleanName, { create: true });
            const dw = await docFh.createWritable();
            await dw.write(blob);
            await dw.close();
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.warn(`[PMG Recruitment] Error saving files for ${app.name} to OneDrive:`, err);
    return false;
  }
}

// Universal OneDrive Backup — uses window.pmgOneDriveSync (same as Patient Care, Expiry, Returns)
async function backupRecruitmentToOneDrive() {
  const engine = window.pmgOneDriveSync;
  if (!engine) {
    toast('OneDrive sync engine not loaded. Please connect OneDrive from the top bar.', 'warn');
    return;
  }

  // Connect folder if not already connected
  if (!engine.rootHandle) {
    const ok = await engine.connectFolder();
    if (!ok || !engine.rootHandle) {
      toast('OneDrive folder connection cancelled.', 'warn');
      return;
    }
  }

  try {
    toast('Syncing recruitment data & documents to OneDrive...', 'info');
    const apps = loadApps();
    const rootHandle = engine.rootHandle;
    const recDir = await rootHandle.getDirectoryHandle('RECRUITMENT', { create: true });

    // 1. Save summary JSON
    const summary = apps.map(a => ({
      id: a.id, name: a.name, position: a.position, status: a.status,
      appliedAt: a.appliedAt, aiScore: a.aiScore, aiVerdict: a.aiVerdict,
      phone: a.phone, email: a.email, preferredBranch: a.preferredBranch,
      spm: a.spm, highestQual: a.highestQual, cgpa: a.cgpa,
      age: a.age, gender: a.gender, race: a.race, religion: a.religion
    }));
    const fh = await recDir.getFileHandle('recruitment_summary.json', { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(summary, null, 2));
    await w.close();

    // 2. Save full applications backup with uploaded documents
    const fullFh = await recDir.getFileHandle('recruitment_full_backup.json', { create: true });
    const fullW = await fullFh.createWritable();
    await fullW.write(JSON.stringify(apps, null, 2));
    await fullW.close();

    // 3. Unpack and save all applicants' document files into /RECRUITMENT/Applicants/
    let totalDocsPushed = 0;
    for (const app of apps) {
      const ok = await saveSingleApplicantToOneDrive(app, rootHandle);
      if (ok && app.docs) totalDocsPushed += app.docs.length;
    }

    toast(`✅ Backed up ${apps.length} applicants & pushed ${totalDocsPushed} documents to OneDrive /RECRUITMENT/Applicants/`, 'success');
  } catch(e) {
    console.error('[Recruitment OneDrive Backup]', e);
    toast('OneDrive backup error: ' + e.message, 'error');
  }
}

function patchOneDriveWithRecruitment() {
  // auto trigger if already connected
  if (window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle) {
    backupRecruitmentToOneDrive();
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// AI EVALUATION via Gemini
// ─────────────────────────────────────────────────────────────────────────────
// Primary: Gemini 3.5 Flash-Lite (fast, free-tier-friendly pre-screen)
// Secondary: Gemini 3.5 Flash (deep eval, fallback with retry)
const GEMINI_MODELS = {
  lite:  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Primary — Fast Screen)' },
  flash: { id: 'gemini-3.5-flash',      label: 'Gemini 3.5 Flash (Secondary — Deep Eval)'    },
};

// ─────────────────────────────────────────────────────────────────────────────
// NUMEROLOGY — Life Path Number from Date of Birth
// Used as one signal among many to assess personality for sales role
// ─────────────────────────────────────────────────────────────────────────────
function calcLifePathNumber(dob) {
  // dob: YYYY-MM-DD
  if (!dob) return null;
  const digits = dob.replace(/-/g,'').split('').map(Number);
  let sum = digits.reduce((a,b)=>a+b,0);
  // Reduce to single digit (keep master numbers 11, 22, 33)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a,b)=>a+b,0);
  }
  return sum;
}

const NUMEROLOGY_PROFILES = {
  1:  { name:'The Leader',      salesFit:'★★★★★', traits:'Self-starter, ambitious, goal-oriented. Natural closer. Excellent for target-driven sales. May need coaching on listening.' },
  2:  { name:'The Diplomat',    salesFit:'★★★☆☆', traits:'Cooperative, empathetic, good listener. Builds trust well. Slower to close; needs confidence coaching for assertive selling.' },
  3:  { name:'The Communicator',salesFit:'★★★★★', traits:'Naturally charming, expressive, persuasive. Excellent for product promotion and customer engagement. Watch for inconsistency.' },
  4:  { name:'The Builder',     salesFit:'★★★☆☆', traits:'Disciplined, systematic, reliable. Strong on plan execution and follow-through. Not a natural "talker" but earns trust.' },
  5:  { name:'The Adventurer',  salesFit:'★★★★☆', traits:'Energetic, versatile, great communicator. Handles pressure well. Can be impulsive; needs structure.' },
  6:  { name:'The Nurturer',    salesFit:'★★★★☆', traits:'Caring, responsible, customer-service oriented. Excellent for healthcare/pharmacy sales. Very good at building loyalty.' },
  7:  { name:'The Analyst',     salesFit:'★★☆☆☆', traits:'Introspective, detail-oriented, knowledgeable. Better suited to specialist/technical roles than front-line sales.' },
  8:  { name:'The Executive',   salesFit:'★★★★★', traits:'Business-minded, results-driven, handles rejection well. Natural for high-target sales environments. Strong stress resilience.' },
  9:  { name:'The Humanitarian',salesFit:'★★★☆☆', traits:'Compassionate, idealistic, broad thinking. Good for relationship-based selling; may deprioritize personal sales targets.' },
  11: { name:'The Visionary',   salesFit:'★★★★☆', traits:'Highly intuitive, inspirational communicator. Excellent brand ambassador. Can be over-sensitive to rejection.' },
  22: { name:'The Master Builder',salesFit:'★★★★★', traits:'Exceptional planner and executor. Rare number. Strategic thinker with high sales ceiling if motivated by mission.' },
  33: { name:'The Master Teacher',salesFit:'★★★★☆', traits:'Deeply empathetic, inspiring presence. Outstanding for pharmacy counselling-led sales. Extremely rare.' },
};

function getNumerologyInfo(dob) {
  const num = calcLifePathNumber(dob);
  if (!num) return null;
  const profile = NUMEROLOGY_PROFILES[num] || { name:'Unknown', salesFit:'—', traits:'No profile available.' };
  return { number: num, ...profile };
}

function detectMissingSpmCoreSubjects(spmText) {
  const text = (spmText || '').toLowerCase();
  const missing = [];

  // 1. Bahasa Melayu
  if (!text.includes('melayu') && !text.includes('bm')) {
    missing.push('Bahasa Melayu (BM)');
  }
  // 2. Bahasa Inggeris
  if (!text.includes('inggeris') && !text.includes('english') && !text.includes('bi')) {
    missing.push('Bahasa Inggeris (BI)');
  }
  // 3. Matematik
  if (!text.includes('matematik') && !text.includes('math') && !text.includes('hisab')) {
    missing.push('Matematik (Mathematics)');
  }
  // 4. Sains / Science
  if (!text.includes('sains') && !text.includes('science') && !text.includes('fizik') && !text.includes('kimia') && !text.includes('biologi')) {
    missing.push('Sains (Science / Pure Sciences)');
  }
  // 5. Sejarah
  if (!text.includes('sejarah') && !text.includes('history')) {
    missing.push('Sejarah (History)');
  }
  // 6. Pendidikan Moral / Islam
  if (!text.includes('moral') && !text.includes('islam') && !text.includes('agama')) {
    missing.push('Pendidikan Moral / Pendidikan Islam');
  }

  return missing;
}

async function runAiEvaluation(app, apiKey, modelKey = 'lite') {
  // Primary: lite. Fallback to flash if lite fails.
  const modelsToTry = modelKey === 'lite'
    ? [GEMINI_MODELS.lite.id, GEMINI_MODELS.flash.id]
    : [GEMINI_MODELS.flash.id, GEMINI_MODELS.lite.id];

  const spmRaw = app.spm || '';
  const missingCore = detectMissingSpmCoreSubjects(spmRaw);
  let spmSummary = spmRaw ? `SPM Results: ${spmRaw}` : 'SPM Results: Not provided';
  if (missingCore.length > 0) {
    spmSummary += `\n⚠️ MISSING CORE SPM SUBJECTS DETECTED: ${missingCore.join(', ')}.\nCRITICAL MALAYSIAN SPM RULE: Malaysian candidates are mandated to take 6 core SPM subjects (BM, BI, Maths, Science, Sejarah, Moral/Islam). Any core subject omitted from the applicant's results means they FAILED THAT SUBJECT ('G' / Fail) and concealed it. Treat these missing subjects as FAILED ('G').`;
  }

  // Numerology
  const numInfo = getNumerologyInfo(app.dob);
  const numerologySection = numInfo
    ? `NUMEROLOGY PROFILE (Life Path Number ${numInfo.number} — ${numInfo.name}):\n- Sales Fit Rating: ${numInfo.salesFit}\n- Personality Traits: ${numInfo.traits}\n- Note: Numerology is ONE supplementary data point only. Do NOT use it as primary decision factor.`
    : 'NUMEROLOGY: DOB not provided — cannot calculate.';

  const prompt = `You are an experienced HR manager for PUBLIC MEDICARE GROUP (PMG) pharmacy chain in Kuching, Sarawak, Malaysia. You are helping William Chai screen job applicants for a SALES-ORIENTED community pharmacy team.

═══════════════════════════════════════
PMG EVALUATION PRIORITIES (in order):
═══════════════════════════════════════
1. PLAN EXECUTION ABILITY — Can this person set targets, follow through, and deliver results consistently? Look at work history (did they stay and achieve?), contract acceptance, and responses that show self-discipline.
2. COMMUNICATION SKILLS — Critical for pharmacy sales. Must be able to explain products clearly in Malay AND English, handle objections, counsel patients, and upsell. Multi-language (Iban/Bidayuh/Mandarin) is a major bonus.
3. STRESS RESILIENCE — Community pharmacy is physically and emotionally demanding (long shifts, difficult customers, stock pressure). Flag candidates who smoke/vape (health risk), have mental health concerns, or show fragile patterns.
4. SMOKING / VAPING — PMG does NOT want staff who smoke or vape. This reflects poorly on health image of a pharmacy. If "Yes" to smoking, flag as CONCERN and reduce score.

IMPORTANT CONTEXT:
- This is a community pharmacy in Sarawak, East Malaysia
- Local Kuching universities (e.g., Cyberjaya College Kuching, UNIMAS, Curtin Sarawak) are BELOW international standards. Do NOT overweight local CGPA.
- SPM is often a BETTER indicator of aptitude than local diploma/degree GPA. Analyze Sciences (Bio, Chem, Add Maths) and English grades carefully.
- CRITICAL SPM FAILURE RULE: In Malaysia, SPM has 6 compulsory core subjects: Bahasa Melayu, Bahasa Inggeris, Matematik, Sains (or Pure Science), Sejarah, and Pendidikan Moral/Islam. If ANY of these 6 core subjects is missing or omitted from the candidate's declared SPM results, IT MEANS THEY FAILED THAT SUBJECT (Grade G / Fail) and concealed it. You MUST treat every missing core subject as a FAIL ('G'). Strictly penalize their Qualification Fit and Plan Execution scores, flag this under concerns, and explicitly state which core subjects were failed/omitted in spmAnalysis.
- Pharmacy Assistant: SPM primary. 3B+ in relevant subjects is good.
- Pharmacist: Must have BPharm degree + valid Malaysia Pharmacy Board APC.
- Nutritionist/Dietitian: Relevant degree required; local diploma treated cautiously.
- Sarawak demographics: Iban, Bidayuh, Chinese, Malay. Multi-language is a strong plus.
- Travel between branches and shift work required.
- 3-year contract is standard. Govt job applicants = HIGH retention risk.

═══════════════════════════════════════
APPLICANT PROFILE:
═══════════════════════════════════════
- Name: ${app.name}
- Position Applied: ${app.position}
- Age: ${app.age || '?'}, Gender: ${app.gender || '?'}, Race: ${app.race || '?'}
- Marital Status: ${app.maritalStatus || '?'}
- Religion: ${app.religion || '?'}
- DOB: ${app.dob || '?'}
- IC/NRIC: ${app.ic || '?'}
- Phone: ${app.phone || '?'}
- Address: ${app.address || '?'}
- Preferred Branch: ${app.preferredBranch || '?'}
- Willing to Travel: ${app.willingToTravel || '?'}

EDUCATION:
- ${spmSummary}
- Highest Qualification: ${app.highestQual || '?'}
- Institution: ${app.institution || '?'}
- CGPA/Grade: ${app.cgpa || '?'}
- Education History: ${app.educationHistory || '—'}
- Additional Certs: ${app.additionalCerts || 'None stated'}

WORK EXPERIENCE:
${app.workHistory || 'No work history provided.'}
- Notice Required: ${app.noticeRequired || '?'}
- Skills: ${app.skills || '—'}
- IT Knowledge: ${app.itSkills || '—'}

LANGUAGE PROFICIENCY:
${app.languages || 'Not specified'}

FAMILY BACKGROUND:
${app.familyBackground || 'Not provided'}

${numerologySection}

═══════════════════════════════════════
SCREENING QUESTIONNAIRE (HR/001/2023):
═══════════════════════════════════════
- Transport/Driving: ${app.hasTransport || '?'} | License: ${app.drivingLicense || '?'}
- Able to travel branches: ${app.ableToTravel || '?'}
- ⚠️ SMOKES / VAPES: ${app.smokes || '?'} ← IMPORTANT: PMG prefers non-smokers. Flag "Yes" as concern.
- Health issues: ${app.healthIssues || '?'}
- Recent surgery (6 months): ${app.recentSurgery || '?'}
- Depression medication: ${app.depressionMeds || '?'}
- Height/Weight: ${app.height||'?'}cm / ${app.weight||'?'}kg
- Can do shift work: ${app.canDoShift || '?'}
- Accept 3-year contract: ${app.accept3yr || '?'}
- Future study/govt job plan: ${app.futurePlan || '?'} — ${app.futurePlanDetail || ''}

HEALTH & INTERESTS:
- Mental/physical illness declared: ${app.healthDeclaration || 'No'} — ${app.healthDeclarationDetail || ''}

SUPPLEMENTARY:
- Relatives at PMG: ${app.relativesAtPmg || 'No'} — ${app.relativesAtPmgDetail || ''}


EMERGENCY CONTACT: ${app.emergencyContact || '?'}
REFERENCES: ${app.references || 'Not provided'}

═══════════════════════════════════════
EVALUATION INSTRUCTIONS:
═══════════════════════════════════════
Score each of these four pillars (0–25 each), then sum for total score (0–100):
A. Plan Execution (0–25): History of commitment, completing tasks, discipline, contract willingness
B. Communication (0–25): Language skills, role-fit for customer-facing sales, multi-language bonus
C. Stress Resilience (0–25): Health, lifestyle (smoking is a negative), shift adaptability, stability
PUBLIC & ONLINE FOOTPRINT RESEARCH:
- Cross-reference the candidate's declared background, institutions (${app.institution || 'local'}), and verify alignment with Sarawak retail pharmacy sector realities.
- Note any verifiable public professional presence, school credibility, or areas requiring interview verification.
- PRIVACY & ETHICS RULE: Under the Malaysian Personal Data Protection Act 2010 (PDPA) and fair employment practices, evaluate the candidate based on verified job qualifications, aptitude, and direct interview verification. Do not fabricate or hallucinate unverified private social media rumors or private family gossip.

Return ONLY valid JSON with exactly these keys:
{
  "score": <integer 0-100>,
  "pillarScores": { "planExecution": <0-25>, "communication": <0-25>, "stressResilience": <0-25>, "qualificationFit": <0-25> },
  "verdict": "<Highly Recommended | Recommended | Borderline | Not Recommended>",
  "smokingFlag": <true|false>,
  "strengths": ["<point 1>", "<point 2>", ...],
  "concerns": ["<concern 1>", ...],
  "spmAnalysis": "<detailed analysis of SPM results and aptitude for the role>",
  "qualificationRisk": "<assessment of whether local university CGPA is a reliable indicator>",
  "retentionRisk": "<Low | Medium | High>",
  "numerologyInsight": "<brief interpretation of Life Path Number ${numInfo?.number || '?'} — ${numInfo?.name || '?'} in context of this pharmacy sales role>",
  "communicationAssessment": "<detailed assessment of communication fit for pharmacy sales>",
  "planExecutionAssessment": "<assessment of plan execution and follow-through ability>",
  "stressResilienceAssessment": "<assessment of stress handling, lifestyle, and shift readiness>",
  "onlineFootprintNotes": "<assessment of candidate's public educational/professional footprint and what to verify in interview>",
  "interviewQuestions": ["<Q1 — probe communication>", "<Q2 — probe plan execution>", "<Q3 — probe stress handling>", "<Q4 — probe sales scenario>", "<Q5 — probe commitment/retention>"],
  "summary": "<2-3 sentence overall assessment for William Chai to read quickly>"
}

Return ONLY valid JSON. No markdown, no extra text.`;

  let lastErr = null;
  for (const modelId of modelsToTry) {
    // Try with Google Search grounding first, gracefully fallback to standard if unsupported
    const toolAttempts = [
      [{ googleSearch: {} }],
      null
    ];

    for (const tools of toolAttempts) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const reqBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2500 },
        };
        if (tools) reqBody.tools = tools;

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });

        if (!resp.ok) {
          const err = await resp.text();
          // If tools cause error (e.g. 400 unsupported or quota), skip to no-tools
          if (tools) continue;
          throw new Error(`Gemini API error ${resp.status}: ${err.slice(0,200)}`);
        }

        const data = await resp.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const clean = raw.replace(/^```json?\s*/i,'').replace(/```\s*$/,'').trim();
        const result = JSON.parse(clean);
        result._modelUsed = modelId + (tools ? ' + Web Grounding' : '');
        return result;
      } catch(e) {
        if (tools) continue; // Try fallback without tools
        lastErr = e;
        console.warn(`[Recruitment AI] ${modelId} failed:`, e.message, '— trying next model...');
      }
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}



// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW SLOT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getAvailableSlots(dateStr) {
  // dateStr: YYYY-MM-DD
  const d = new Date(dateStr);
  const dow = d.getDay(); // 0=Sun
  const sched = WILLIAM_SCHEDULE[dow];
  if (!sched) return []; // Sunday = off

  // Generate slots: 30-min blocks within working hours, skip lunch 1230-1330
  const [startH, endH] = sched.split('-').map(t => parseInt(t.slice(0,2))*60 + parseInt(t.slice(2)));
  const slots = [];
  for (let t = startH + 30; t <= endH - 30; t += 30) { // start 30 min after clock-in
    const h = Math.floor(t/60), m = t%60;
    const lbl = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    // Skip lunch
    if (t >= 12*60+30 && t < 13*60+30) continue;
    // Skip already booked
    const booked = loadSlots().some(s => s.date === dateStr && s.time === lbl && s.confirmed);
    if (!booked) slots.push(lbl);
  }
  return slots;
}

// ─────────────────────────────────────────────────────────────────────────────
// IC AUTO-CALCULATION (DOB, AGE, GENDER)
// ─────────────────────────────────────────────────────────────────────────────
function onIcInput(inputEl) {
  if (!inputEl) return;
  const raw = inputEl.value.replace(/[^0-9]/g, '');
  const form = inputEl.closest('form');
  if (!form) return;

  if (raw.length >= 6) {
    const yy = parseInt(raw.slice(0, 2), 10);
    const mm = parseInt(raw.slice(2, 4), 10);
    const dd = parseInt(raw.slice(4, 6), 10);

    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const current2DigitYear = currentYear % 100;

    // Malaysian IC century rule:
    // If yy <= current 2-digit year (e.g. 26), 2000s; otherwise 1900s
    const fullYear = (yy <= current2DigitYear) ? (currentCentury + yy) : (currentCentury - 100 + yy);

    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      const birthDate = new Date(fullYear, mm - 1, dd);
      if (birthDate.getFullYear() === fullYear && birthDate.getMonth() === mm - 1 && birthDate.getDate() === dd) {
        const formattedDob = `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        const dobInput = form.querySelector('input[name="dob"]');
        if (dobInput) dobInput.value = formattedDob;

        // Calculate age
        const today = new Date();
        let age = today.getFullYear() - fullYear;
        const m = today.getMonth() - (mm - 1);
        if (m < 0 || (m === 0 && today.getDate() < dd)) {
          age--;
        }
        const ageInput = form.querySelector('input[name="age"]');
        if (ageInput && age >= 0 && age < 120) ageInput.value = age;
      }
    }
  }

  // 12th digit represents gender: Odd = Male, Even = Female
  if (raw.length >= 12) {
    const genderDigit = parseInt(raw.charAt(11), 10);
    const genderSelect = form.querySelector('select[name="gender"]');
    if (genderSelect && !isNaN(genderDigit)) {
      genderSelect.value = (genderDigit % 2 !== 0) ? 'Male / Lelaki' : 'Female / Perempuan';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION FORM RENDER (PUBLIC LINK VIEW & STANDALONE PORTAL)
// ─────────────────────────────────────────────────────────────────────────────
function renderPublicForm(targetContainerId) {
  const container = el(targetContainerId || 'recruitmentPublicFormArea');
  if (!container) return;

  container.innerHTML = `
<div class="max-w-2xl mx-auto">
  <div class="bg-blue-800 rounded-2xl p-6 mb-5 text-white shadow-md text-center">
    <div class="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
      <i class="fa-solid fa-file-signature text-white text-xl"></i>
    </div>
    <h1 class="text-2xl font-bold tracking-tight">Job Application</h1>
    <p class="text-xs text-blue-200 mt-1">Please fill in your details and upload your documents below.</p>
  </div>

  <form id="recPublicForm" class="space-y-5" onsubmit="window.pmgRecruitment.submitPublicForm(event)">

    <!-- SECTION 1: POSITION -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-briefcase text-blue-600"></i> Position Applied</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="rec-label">Position / Jawatan *</label>
          <select name="position" required class="rec-input">
            <option value="">— Select Position —</option>
            ${POSITIONS.map(p=>`<option value="${p.value}">${p.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="rec-label">Preferred Branch / Cawangan Pilihan *</label>
          <select name="preferredBranch" required class="rec-input">
            <option value="">— Select Branch —</option>
            ${BRANCHES_APPLY.map(b=>`<option value="${b}">${b}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- SECTION 2: PERSONAL DATA -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-id-card text-blue-600"></i> Personal Data / Maklumat Peribadi</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="sm:col-span-2">
          <label class="rec-label">Full Name (Underline Surname) / Nama Penuh *</label>
          <input type="text" name="name" required class="rec-input" placeholder="e.g. CHAI YEE SIAN">
        </div>
        <div>
          <label class="rec-label">Gender / Jantina *</label>
          <select name="gender" required class="rec-input">
            <option value="">—</option>
            <option>Male / Lelaki</option>
            <option>Female / Perempuan</option>
          </select>
        </div>
        <div>
          <label class="rec-label">Marital Status / Status Perkahwinan *</label>
          <select name="maritalStatus" required class="rec-input">
            <option value="">—</option>
            <option>Single / Bujang</option>
            <option>Married / Berkahwin</option>
            <option>Divorced / Bercerai</option>
            <option>Widowed / Balu</option>
          </select>
        </div>
        <div>
          <label class="rec-label">NRIC / Passport No. *</label>
          <input type="text" name="ic" required class="rec-input" placeholder="e.g. 030904-13-1234" oninput="window.pmgRecruitment.onIcInput(this)">
        </div>
        <div>
          <label class="rec-label">Date of Birth / Tarikh Lahir *</label>
          <input type="date" name="dob" required class="rec-input">
        </div>
        <div>
          <label class="rec-label">Age / Umur *</label>
          <input type="number" name="age" required min="17" max="65" class="rec-input" placeholder="e.g. 23">
        </div>
        <div>
          <label class="rec-label">Race / Bangsa *</label>
          <input type="text" name="race" required class="rec-input" placeholder="e.g. Iban, Bidayuh, Chinese, Malay">
        </div>
        <div>
          <label class="rec-label">Religion / Agama</label>
          <input type="text" name="religion" class="rec-input" placeholder="e.g. Christian, Islam, Buddhism">
        </div>
        <div>
          <label class="rec-label">Citizenship / Warganegara *</label>
          <select name="citizenship" required class="rec-input">
            <option>Malaysian</option>
            <option>Permanent Resident</option>
            <option>Others</option>
          </select>
        </div>
        <div>
          <label class="rec-label">Place of Birth / Tempat Lahir</label>
          <input type="text" name="placeOfBirth" class="rec-input" placeholder="e.g. Hospital KK, Sabah">
        </div>
        <div>
          <label class="rec-label">IC Colour / Warna IC</label>
          <select name="icColour" class="rec-input">
            <option>Blue / Biru (Malaysian)</option>
            <option>Red / Merah (PR)</option>
            <option>Others</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="rec-label">Home Address / Alamat Rumah *</label>
          <textarea name="address" required rows="2" class="rec-input" placeholder="Full address including postcode and state"></textarea>
        </div>
        <div>
          <label class="rec-label">Contact No. / No. Telefon *</label>
          <input type="tel" name="phone" required class="rec-input" placeholder="e.g. 011-12345678">
        </div>
        <div>
          <label class="rec-label">Email Address</label>
          <input type="email" name="email" class="rec-input" placeholder="e.g. name@gmail.com">
        </div>
        <div>
          <label class="rec-label">Height / Ketinggian (cm)</label>
          <input type="number" name="height" min="100" max="220" class="rec-input" placeholder="e.g. 165">
        </div>
        <div>
          <label class="rec-label">Weight / Berat (kg)</label>
          <input type="number" name="weight" min="30" max="200" class="rec-input" placeholder="e.g. 55">
        </div>
        <div>
          <label class="rec-label">Driving License / Lesen Memandu</label>
          <select name="drivingLicense" class="rec-input">
            <option value="No">No / Tidak</option>
            <option value="Yes - Class D">Yes - Class D (Car)</option>
            <option value="Yes - Class B2">Yes - Class B2 (Motorcycle)</option>
            <option value="Yes - Both">Yes - Both / Kedua-dua</option>
          </select>
        </div>
      </div>
    </div>


    <!-- SECTION 3: EMERGENCY CONTACT -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-phone-alt text-red-500"></i> Emergency Contact / Kenalan Kecemasan</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label class="rec-label">Name / Nama *</label><input type="text" name="ecName" required class="rec-input"></div>
        <div><label class="rec-label">Relationship / Hubungan *</label><input type="text" name="ecRelation" required class="rec-input" placeholder="e.g. Father, Mother, Spouse"></div>
        <div><label class="rec-label">Contact No. *</label><input type="tel" name="ecPhone" required class="rec-input"></div>
        <div><label class="rec-label">Address / Alamat</label><input type="text" name="ecAddress" class="rec-input"></div>
      </div>
    </div>

    <!-- SECTION 4: FAMILY -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-users text-indigo-500"></i> Family Particulars / Maklumat Keluarga</h3>
      <p class="text-xs text-gray-500 mb-3">List immediate family members (parents, siblings, spouse, children).</p>
      <div id="recFamilyRows">
        ${[0,1,2].map(i=>`
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <input type="text" name="famName${i}" class="rec-input text-xs" placeholder="Name">
          <input type="text" name="famRelation${i}" class="rec-input text-xs" placeholder="Relation">
          <input type="number" name="famAge${i}" class="rec-input text-xs" placeholder="Age">
          <input type="text" name="famOccupation${i}" class="rec-input text-xs" placeholder="Occupation">
        </div>`).join('')}
      </div>
      <button type="button" onclick="window.pmgRecruitment.addFamilyRow()" class="text-xs text-blue-600 hover:underline mt-1">+ Add more family members</button>
    </div>

    <!-- SECTION 5: EDUCATIONAL BACKGROUND -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-graduation-cap text-amber-600"></i> Educational Background / Latar Belakang Pendidikan</h3>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
        <strong>SPM is important!</strong> Please list ALL SPM subjects and grades clearly. This helps us evaluate your aptitude accurately.
      </div>

      <!-- SPM RESULTS: SCHOOL & 2-COLUMN SUBJECT-GRADE BREAKDOWN -->
      <div class="mb-4 bg-slate-50/70 p-3.5 rounded-xl border border-gray-200">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
          <div class="sm:col-span-2">
            <label class="rec-label">Secondary School / Nama Sekolah Menengah (SPM) *</label>
            <input type="text" name="spmSchool" id="recSpmSchool" required placeholder="e.g. SMK St. Joseph / SMK Green Road, Kuching" class="rec-input text-xs">
          </div>
          <div>
            <label class="rec-label">SPM Year / Tahun *</label>
            <input type="number" min="1980" max="2035" name="spmYear" id="recSpmYear" required placeholder="e.g. 2022" class="rec-input text-xs">
          </div>
        </div>

        <div class="flex items-center justify-between mb-2">
          <label class="rec-label mb-0 font-bold text-gray-800">SPM Subject &amp; Grade Breakdown / Keputusan SPM *</label>
          <span class="text-[11px] text-gray-500">Core SPM: 8–10 subjects (max 12)</span>
        </div>

        <div id="spmSubjectsContainer" class="space-y-1.5">
          ${DEFAULT_SPM_SUBJECTS.map(subj => createSpmRowHtml(subj, '')).join('')}
        </div>

        <div class="mt-2.5 flex items-center justify-between">
          <button type="button" onclick="window.pmgRecruitment.addSpmSubjectRow()" class="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer">
            <i class="fa-solid fa-plus"></i> + Add Subject / Tambah Subjek
          </button>
          <span class="text-[11px] text-gray-400">Click "+" to add up to 12 subjects</span>
        </div>
      </div>

      <table class="w-full text-xs mb-2 border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="p-2 text-left">From</th><th class="p-2 text-left">To</th>
            <th class="p-2 text-left">School / Institution</th>
            <th class="p-2 text-left">Certificate / Degree & CGPA</th>
          </tr>
        </thead>
        <tbody>
          ${[0,1,2,3].map(i=>`
          <tr class="border-t border-gray-100">
            <td class="p-1"><input type="text" name="eduFrom${i}" class="rec-input text-xs" placeholder="Year"></td>
            <td class="p-1"><input type="text" name="eduTo${i}" class="rec-input text-xs" placeholder="Year"></td>
            <td class="p-1"><input type="text" name="eduInst${i}" class="rec-input text-xs" placeholder="Institution name"></td>
            <td class="p-1"><input type="text" name="eduCert${i}" class="rec-input text-xs" placeholder="e.g. Diploma Healthcare, CGPA 3.74"></td>
          </tr>`).join('')}
        </tbody>
      </table>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="rec-label">Highest Qualification *</label>
          <select name="highestQual" required class="rec-input">
            <option value="">—</option>
            <option>SPM / O-Level</option>
            <option>STPM / A-Level</option>
            <option>Certificate</option>
            <option>Diploma</option>
            <option>Advanced Diploma</option>
            <option>Bachelor Degree</option>
            <option>Master / PhD</option>
          </select>
        </div>
        <div>
          <label class="rec-label">Main Institution Name</label>
          <input type="text" name="institution" class="rec-input" placeholder="e.g. Cyberjaya College Kuching">
        </div>
        <div>
          <label class="rec-label">CGPA / Final Grade</label>
          <input type="text" name="cgpa" class="rec-input" placeholder="e.g. 3.74 or Credit">
        </div>
      </div>

      <div class="mt-3">
        <label class="rec-label">Additional Certifications / Sijil Tambahan</label>
        <input type="text" name="additionalCerts" class="rec-input" placeholder="e.g. BLS, First Aid, DOSM halal cert, etc.">
      </div>
    </div>


    <!-- SECTION 6: LANGUAGE PROFICIENCY -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-language text-purple-600"></i> Language Proficiency / Kemahiran Bahasa</h3>
      <div class="overflow-x-auto">
        <table class="text-xs w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="p-2 text-left">Language</th>
              <th class="p-2 text-center" colspan="3">Written / Bertulis</th>
              <th class="p-2 text-center" colspan="3">Spoken / Lisan</th>
            </tr>
            <tr class="text-[10px]">
              <th></th>
              <th class="p-1 text-center">Excellent</th><th class="p-1 text-center">Good</th><th class="p-1 text-center">Average</th>
              <th class="p-1 text-center">Excellent</th><th class="p-1 text-center">Good</th><th class="p-1 text-center">Average</th>
            </tr>
          </thead>
            ${['Malay / BM','English / BI','Mandarin','Iban','Bidayuh'].map(lang=>{
              const key = lang.replace(/[^a-z]/gi,'');
              return `
              <tr class="border-t border-gray-100">
                <td class="p-2 font-medium text-gray-700">${lang}</td>
                <td class="p-1 text-center"><input type="radio" name="lang_${key}_written" value="Excellent" class="h-3.5 w-3.5 accent-blue-600"></td>
                <td class="p-1 text-center"><input type="radio" name="lang_${key}_written" value="Good" class="h-3.5 w-3.5 accent-blue-600"></td>
                <td class="p-1 text-center"><input type="radio" name="lang_${key}_written" value="Average" class="h-3.5 w-3.5 accent-blue-600"></td>
                <td class="p-1 text-center"><input type="radio" name="lang_${key}_spoken" value="Excellent" class="h-3.5 w-3.5 accent-blue-600"></td>
                <td class="p-1 text-center"><input type="radio" name="lang_${key}_spoken" value="Good" class="h-3.5 w-3.5 accent-blue-600"></td>
                <td class="p-1 text-center"><input type="radio" name="lang_${key}_spoken" value="Average" class="h-3.5 w-3.5 accent-blue-600"></td>
              </tr>`;
            }).join('')}
            <tr class="border-t border-gray-100 bg-slate-50/50">
              <td class="p-1.5 font-medium text-gray-700">
                <input type="text" name="lang_other_custom" placeholder="Others (specify language/dialect)" class="rec-input text-xs py-1">
              </td>
              <td class="p-1 text-center"><input type="radio" name="lang_Others_written" value="Excellent" class="h-3.5 w-3.5 accent-blue-600"></td>
              <td class="p-1 text-center"><input type="radio" name="lang_Others_written" value="Good" class="h-3.5 w-3.5 accent-blue-600"></td>
              <td class="p-1 text-center"><input type="radio" name="lang_Others_written" value="Average" class="h-3.5 w-3.5 accent-blue-600"></td>
              <td class="p-1 text-center"><input type="radio" name="lang_Others_spoken" value="Excellent" class="h-3.5 w-3.5 accent-blue-600"></td>
              <td class="p-1 text-center"><input type="radio" name="lang_Others_spoken" value="Good" class="h-3.5 w-3.5 accent-blue-600"></td>
              <td class="p-1 text-center"><input type="radio" name="lang_Others_spoken" value="Average" class="h-3.5 w-3.5 accent-blue-600"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-3">
        <label class="rec-label">Other Languages / Dialects (Fill in text / Lain-lain bahasa atau dialek)</label>
        <input type="text" name="langOthersText" class="rec-input text-xs" placeholder="e.g. Foochow (fluent spoken), Hokkien (conversational), Hakka, Cantonese, Tamil, Melanau, Kayan">
      </div>
    </div>

    <!-- SECTION 7: EMPLOYMENT HISTORY -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-building text-slate-600"></i> Employment History / Sejarah Pekerjaan <span class="text-xs font-normal text-gray-400">(Start with most recent)</span></h3>
      <div class="overflow-x-auto">
        <table class="text-xs w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="p-2 text-left">From</th>
              <th class="p-2 text-left">To</th>
              <th class="p-2 text-left">Company / Syarikat</th>
              <th class="p-2 text-left">Position / Jawatan</th>
            </tr>
          </thead>
          <tbody>
            ${[0,1,2,3].map(i=>`
            <tr class="border-t border-gray-100">
              <td class="p-1"><input type="text" name="empFrom${i}" class="rec-input text-xs" placeholder="YYYY"></td>
              <td class="p-1"><input type="text" name="empTo${i}" class="rec-input text-xs" placeholder="YYYY / Present"></td>
              <td class="p-1"><input type="text" name="empCo${i}" class="rec-input text-xs" placeholder="Company Name"></td>
              <td class="p-1"><input type="text" name="empPos${i}" class="rec-input text-xs" placeholder="Position / Role"></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div><label class="rec-label">Notice Required</label><input type="text" name="noticeRequired" class="rec-input" placeholder="e.g. 1 month, immediate"></div>
        <div><label class="rec-label">Skills Possessed / Kemahiran</label><input type="text" name="skills" class="rec-input" placeholder="e.g. dispensing, counselling"></div>
      </div>
      <div class="mt-3">
        <label class="rec-label">Technical / IT Knowledge</label>
        <input type="text" name="itSkills" class="rec-input" placeholder="e.g. Xilnex POS, Microsoft Office, Pharmacy Management System">
      </div>
    </div>

    <!-- SECTION 8: HEALTH & INTERESTS -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-heart-pulse text-red-500"></i> Health & Interests / Kesihatan & Minat</h3>
      <div class="space-y-3">
        <div>
          <label class="rec-label">Do you have or have you suffered from any mental illness, physical disability, disease or serious illness?</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="healthDeclaration" value="Yes" class="accent-blue-600"> Yes</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="healthDeclaration" value="No" checked class="accent-blue-600"> No</label>
          </div>
          <input type="text" name="healthDeclarationDetail" class="rec-input mt-1 text-xs" placeholder="If yes, please give details">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="rec-label">Do you smoke or vape? / Adakah anda merokok atau vaping?</label>
            <select name="smokes" class="rec-input"><option value="No">No</option><option value="Yes">Yes</option><option value="Used to, quit">Used to, quit</option></select>
          </div>
          <div>
            <label class="rec-label">Any health issues? / Ada masalah kesihatan?</label>
            <input type="text" name="healthIssues" class="rec-input" placeholder="If none, write 'None'">
          </div>
          <div>
            <label class="rec-label">Recent surgery in past 6 months? / Pembedahan 6 bulan lepas?</label>
            <select name="recentSurgery" class="rec-input"><option value="No">No</option><option value="Yes">Yes</option></select>
          </div>
          <div>
            <label class="rec-label">Taking depression medication? / Ubat kemurungan?</label>
            <select name="depressionMeds" class="rec-input"><option value="No">No</option><option value="Yes">Yes</option></select>
          </div>
        </div>
      </div>
    </div>


    <!-- SECTION 9: REFERENCES -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-address-book text-indigo-500"></i> References / Rujukan <span class="text-xs font-normal text-gray-400">(Do not include relatives)</span></h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${[0,1].map(i=>`
        <div class="border border-gray-100 rounded-lg p-3">
          <p class="text-xs font-bold text-gray-500 mb-2">Reference ${i+1}</p>
          <input type="text" name="ref${i}Name" class="rec-input text-xs mb-2" placeholder="Full Name">
          <input type="text" name="ref${i}Occ" class="rec-input text-xs mb-2" placeholder="Occupation / Company">
          <input type="text" name="ref${i}Rel" class="rec-input text-xs mb-2" placeholder="Relation (e.g. Ex-supervisor)">
          <input type="tel" name="ref${i}Phone" class="rec-input text-xs mb-2" placeholder="Contact No.">
          <input type="text" name="ref${i}Years" class="rec-input text-xs" placeholder="Years Known">
        </div>`).join('')}
      </div>
    </div>

    <!-- SECTION 10: APPLICANT QUESTIONNAIRE -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-clipboard-question text-emerald-600"></i> Additional Questionnaire / Soalan Tambahan</h3>
      <div class="space-y-3">
        <div>
          <label class="rec-label">Do you have transport? How do you commute? / Ada kenderaan sendiri? *</label>
          <input type="text" name="hasTransport" required class="rec-input" placeholder="e.g. Yes, I drive my own car (Class D license)">
        </div>
        <div>
          <label class="rec-label">Are you able to travel to other branches if needed? / Boleh pergi ke cawangan lain? *</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="ableToTravel" value="Yes" required class="accent-blue-600"> Yes</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="ableToTravel" value="No" class="accent-blue-600"> No</label>
          </div>
        </div>
        <div>
          <label class="rec-label">Can you do shift work? / Boleh buat kerja syif? *</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="canDoShift" value="Yes" required class="accent-blue-600"> Yes</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="canDoShift" value="No" class="accent-blue-600"> No</label>
          </div>
        </div>
        <div>
          <label class="rec-label">Do you accept a 3-year employment contract? / Terima kontrak 3 tahun? *</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="accept3yr" value="Yes" required class="accent-blue-600"> Yes</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="accept3yr" value="No" class="accent-blue-600"> No</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="accept3yr" value="Negotiable" class="accent-blue-600"> Negotiable</label>
          </div>
        </div>
        <div>
          <label class="rec-label">Do you have any plans to further study, find another job, or wait for a government offer within 3 years? *</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="futurePlan" value="No" required class="accent-blue-600"> No</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="futurePlan" value="Yes" class="accent-blue-600"> Yes</label>
          </div>
          <input type="text" name="futurePlanDetail" class="rec-input mt-1 text-xs" placeholder="If yes, please explain">
        </div>
        <div>
          <label class="rec-label">Willing to work at which specific location? / Lokasi pilihan</label>
          <input type="text" name="willingToTravel" class="rec-input" placeholder="e.g. Kota Sentosa preferred, willing to help other branches when needed">
        </div>
      </div>
    </div>

    <!-- SECTION 11: SUPPLEMENTARY -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-circle-info text-slate-500"></i> Supplementary Information / Maklumat Tambahan</h3>
      <div class="space-y-3">
        <div>
          <label class="rec-label">Do you have any relatives or friends employed by PMG?</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="relativesAtPmg" value="No" checked class="accent-blue-600"> No</label>
            <label class="flex items-center gap-1 text-sm"><input type="radio" name="relativesAtPmg" value="Yes" class="accent-blue-600"> Yes</label>
          </div>
          <input type="text" name="relativesAtPmgDetail" class="rec-input mt-1 text-xs" placeholder="If yes, please state name and relationship">
        </div>
      </div>
    </div>

    <!-- SECTION 12: DOCUMENT UPLOAD -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-file-arrow-up text-blue-600"></i> Document Upload / Muat Naik Dokumen</h3>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-3">
        <i class="fa-solid fa-circle-info mr-1"></i>
        Accept: PDF, JPG, PNG. Max ${MAX_FILE_MB}MB per file. Upload original scan/photo — not edited copies.
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="rec-label">Recent Passport Photo *</label>
          <input type="file" name="filePhoto" accept="image/*,.pdf" required class="rec-file-input">
        </div>
        <div>
          <label class="rec-label">NRIC / MyKad (Front & Back) *</label>
          <input type="file" name="fileIC" accept="image/*,.pdf" required class="rec-file-input" multiple>
        </div>
        <div>
          <label class="rec-label">SPM Result Slip *</label>
          <input type="file" name="fileSPM" accept="image/*,.pdf" required class="rec-file-input">
        </div>
        <div>
          <label class="rec-label">Diploma / Degree Certificate</label>
          <input type="file" name="fileDegree" accept="image/*,.pdf" class="rec-file-input" multiple>
        </div>
        <div>
          <label class="rec-label">Transcript / Academic Results</label>
          <input type="file" name="fileTranscript" accept="image/*,.pdf" class="rec-file-input" multiple>
        </div>
        <div>
          <label class="rec-label">Other Supporting Documents</label>
          <input type="file" name="fileOther" accept="image/*,.pdf" class="rec-file-input" multiple>
        </div>
      </div>
    </div>


    <!-- DECLARATION -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-signature text-gray-500"></i> Declaration / Pengakuan</h3>
      <p class="text-xs text-gray-600 mb-4 leading-relaxed">
        I declare that the information given in this application for employment is accurate and that I have withheld no information which would in any way affect my employment by the Company. I accept that if any information given in this application is in any way false or incorrect, the Company shall have the right to terminate my employment without notice and without giving any reason.
      </p>
      <div class="flex items-start gap-2">
        <input type="checkbox" name="declaration" required id="recDeclaration" class="mt-0.5 h-4 w-4 rounded accent-blue-600">
        <label for="recDeclaration" class="text-xs text-gray-700">I agree to the above declaration and confirm all information provided is true and accurate. / <em>Saya bersetuju dengan pengakuan di atas dan mengesahkan semua maklumat yang diberikan adalah benar dan tepat.</em></label>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <button type="button" onclick="window.pmgRecruitment.resetPublicForm()" class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-xl transition">
        <i class="fa-solid fa-rotate-left mr-1"></i> Reset
      </button>
      <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-xl transition flex items-center gap-2 shadow-sm">
        <i class="fa-solid fa-paper-plane"></i> Submit Application / Hantar Permohonan
      </button>
    </div>
  </form>
</div>`;
}

function renderPublicPortalForm(targetContainerId) {
  renderPublicForm(targetContainerId || 'publicJobAppContainer');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT PUBLIC FORM
// ─────────────────────────────────────────────────────────────────────────────
async function submitPublicForm(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const get = (k) => fd.get(k) || '';

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

  // Build employment history string (From, To, Company, Position only)
  const empRows = [0,1,2,3].map(i => {
    const from=get(`empFrom${i}`), to=get(`empTo${i}`), co=get(`empCo${i}`), pos=get(`empPos${i}`);
    if (!co) return '';
    return `${from}–${to} | ${co} | ${pos}`;
  }).filter(Boolean).join('\n');


  // Build education string
  const eduRows = [0,1,2,3].map(i => {
    const from=get(`eduFrom${i}`), to=get(`eduTo${i}`), inst=get(`eduInst${i}`), cert=get(`eduCert${i}`);
    if (!inst) return '';
    return `${from}–${to}: ${inst} — ${cert}`;
  }).filter(Boolean).join('\n');

  // Build family string
  const famRows = [0,1,2].map(i => {
    const name=get(`famName${i}`), rel=get(`famRelation${i}`), age=get(`famAge${i}`), occ=get(`famOccupation${i}`);
    if (!name) return '';
    return `${name} (${rel}, Age ${age}, ${occ})`;
  }).filter(Boolean).join('; ');

  // Build references string
  const refs = [0,1].map(i => {
    const name=get(`ref${i}Name`), occ=get(`ref${i}Occ`), rel=get(`ref${i}Rel`), phone=get(`ref${i}Phone`), yrs=get(`ref${i}Years`);
    if (!name) return '';
    return `${name} | ${occ} | ${rel} | ${phone} | ${yrs} yrs`;
  }).filter(Boolean).join('\n');

  // Language proficiency
  const langKeys = ['Malay / BM','English / BI','Mandarin','Iban','Bidayuh'];
  const langItems = [];
  langKeys.forEach(lang => {
    const key = lang.replace(/[^a-z]/gi,'');
    const w = fd.get(`lang_${key}_written`);
    const s = fd.get(`lang_${key}_spoken`);
    if (w || s) {
      langItems.push(`${lang}: Written (${w || '—'}), Spoken (${s || '—'})`);
    }
  });

  const customLang = get('lang_other_custom').trim();
  const customW = fd.get('lang_Others_written');
  const customS = fd.get('lang_Others_spoken');
  if (customLang && (customW || customS)) {
    langItems.push(`${customLang}: Written (${customW || '—'}), Spoken (${customS || '—'})`);
  }
  const langText = get('langOthersText').trim();
  if (langText) {
    langItems.push(`Additional: ${langText}`);
  }
  const langSummary = langItems.join('; ');

  // Process file uploads → base64 metadata (no fileLicense needed)
  const fileFields = ['filePhoto','fileIC','fileSPM','fileDegree','fileTranscript','fileOther'];
  const uploadedDocs = [];
  for (const field of fileFields) {
    const files = form[field] ? Array.from(form[field].files) : [];
    for (const f of files) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast(`File "${f.name}" exceeds ${MAX_FILE_MB}MB limit`, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';
        return;
      }
      try {
        const b64 = await fileToBase64(f);
        uploadedDocs.push({ field, name: f.name, size: f.size, type: f.type, data: b64 });
      } catch(err) {
        toast(`Error reading file ${f.name}`, 'error');
      }
    }
  }

  // Extract SPM School, Year & Subjects Breakdown
  const spmSchool = get('spmSchool');
  const spmYear = get('spmYear');
  const spmSubjects = [];
  const subjInputs = form.querySelectorAll('input[name="spmSubject"]');
  const gradeInputs = form.querySelectorAll('select[name="spmGrade"]');
  subjInputs.forEach((inp, idx) => {
    const sName = inp.value.trim();
    const sGrade = gradeInputs[idx]?.value.trim();
    if (sName && sGrade) {
      spmSubjects.push(`${sName}: ${sGrade}`);
    }
  });

  const spmCombinedText = [
    spmSchool ? `School: ${spmSchool}${spmYear ? ` (${spmYear})` : ''}` : '',
    spmSubjects.length > 0 ? `Results: ${spmSubjects.join(', ')}` : (get('spm') || '')
  ].filter(Boolean).join('\n');

  const app = {
    id: genId(),
    appliedAt: now(),
    status: 'new',
    aiScore: null,
    aiVerdict: null,
    aiReport: null,

    // Position
    position: POSITIONS.find(p=>p.value===get('position'))?.label || get('position'),
    positionKey: get('position'),
    preferredBranch: get('preferredBranch'),

    // Personal
    name: get('name'),
    gender: get('gender'),
    maritalStatus: get('maritalStatus'),
    ic: get('ic'),
    dob: get('dob'),
    age: get('age'),
    race: get('race'),
    religion: get('religion'),
    citizenship: get('citizenship'),
    placeOfBirth: get('placeOfBirth'),
    icColour: get('icColour'),
    address: get('address'),
    phone: get('phone'),
    email: get('email'),
    height: get('height'),
    weight: get('weight'),
    drivingLicense: get('drivingLicense'),

    // Emergency
    emergencyContact: `${get('ecName')} (${get('ecRelation')}) — ${get('ecPhone')}; ${get('ecAddress')}`,

    // Family
    familyBackground: famRows,

    // Education
    spm: spmCombinedText || get('spm') || 'Not provided',
    spmSchool: spmSchool,
    spmYear: spmYear,
    spmSubjects: spmSubjects,
    highestQual: get('highestQual'),
    institution: get('institution'),
    cgpa: get('cgpa'),
    additionalCerts: get('additionalCerts'),
    educationHistory: eduRows,

    // Language
    languages: langSummary,

    // Employment
    workHistory: empRows,
    noticeRequired: get('noticeRequired'),
    skills: get('skills'),
    itSkills: get('itSkills'),

    // Health
    healthDeclaration: get('healthDeclaration'),
    healthDeclarationDetail: get('healthDeclarationDetail'),
    smokes: get('smokes'),
    healthIssues: get('healthIssues'),
    recentSurgery: get('recentSurgery'),
    depressionMeds: get('depressionMeds'),

    // References
    references: refs,

    // Screening
    hasTransport: get('hasTransport'),
    ableToTravel: get('ableToTravel'),
    canDoShift: get('canDoShift'),
    accept3yr: get('accept3yr'),
    futurePlan: get('futurePlan'),
    futurePlanDetail: get('futurePlanDetail'),
    willingToTravel: get('willingToTravel'),

    // Supplementary
    relativesAtPmg: get('relativesAtPmg'),
    relativesAtPmgDetail: get('relativesAtPmgDetail'),

    // Documents
    docs: uploadedDocs,
    docNames: uploadedDocs.map(d=>d.name),
  };


  const apps = loadApps();
  apps.unshift(app);
  saveApps(apps);

  // Cloud Sync: push application to Google Sheets so it instantly appears on William's PC
  try {
    const apiUrl = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
    await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'submitJobApplication',
        application: app
      })
    });
  } catch (cloudErr) {
    console.warn('[Recruitment] Cloud submission error:', cloudErr);
  }

  // Push uploaded documents directly to OneDrive folder /RECRUITMENT/Applicants/ immediately
  try {
    const engine = window.pmgOneDriveSync || window.pmgOneDrive;
    if (engine && engine.rootHandle) {
      saveSingleApplicantToOneDrive(app, engine.rootHandle);
    }
  } catch (odErr) {
    console.warn('[Recruitment] Instant OneDrive push skipped:', odErr);
  }

  // Show success
  const container = form.closest('#publicJobAppContainer')
                 || form.closest('#recruitmentPublicFormArea')
                 || el('publicJobAppContainer')
                 || el('recruitmentPublicFormArea');
  if (container) {
    const isPortal = container.id === 'publicJobAppContainer' || !!el('publicJobAppContainer');
    const resetCall = isPortal 
      ? "window.pmgRecruitment.renderPublicPortalForm('publicJobAppContainer')" 
      : "window.pmgRecruitment.renderPublicForm('recruitmentPublicFormArea')";
    container.innerHTML = `
<div class="max-w-lg mx-auto text-center py-16">
  <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
    <i class="fa-solid fa-check-circle text-emerald-600 text-4xl"></i>
  </div>
  <h2 class="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
  <p class="text-gray-600 text-sm mb-4">Your application reference is <span class="font-mono font-bold text-blue-700">${app.id}</span></p>
  <p class="text-gray-500 text-xs mb-6">William Chai will review your application and contact you within 3–5 working days if you are shortlisted for an interview at PMG Pharmacy Kota Sentosa.</p>
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left text-xs text-blue-800">
    <p class="font-bold mb-1">What happens next?</p>
    <ol class="list-decimal ml-4 space-y-1">
      <li>AI pre-screening of your documents (within 24 hours)</li>
      <li>William Chai review (within 3 working days)</li>
      <li>If shortlisted, you will receive an interview appointment link via phone/email</li>
      <li>Face-to-face interview at PMG Pharmacy Kota Sentosa</li>
    </ol>
  </div>
  <button onclick="${resetCall}" class="mt-6 px-5 py-2.5 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition">
    Submit Another Application
  </button>
</div>`;
  }

  toast('Application submitted successfully! Reference: ' + app.id, 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// AM DASHBOARD RENDER
// ─────────────────────────────────────────────────────────────────────────────
function renderAmDashboard() {
  const apps = loadApps();
  const apiKey = getGlobalGeminiKey();

  const counts = {};
  Object.keys(STATUS_META).forEach(k => counts[k] = 0);
  apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  const filterEl = el('recFilterStatus');
  const filterVal = filterEl?.value || 'all';
  const searchVal = (el('recSearchInput')?.value || '').toLowerCase();

  const filtered = apps.filter(a => {
    const matchStatus = filterVal === 'all' || a.status === filterVal;
    const matchSearch = !searchVal || a.name.toLowerCase().includes(searchVal) ||
      a.position.toLowerCase().includes(searchVal) || a.id.toLowerCase().includes(searchVal);
    return matchStatus && matchSearch;
  });

  const dash = el('recAmDashboardContent');
  if (!dash) return;

  dash.innerHTML = `
<!-- Stats Bar -->
<div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
  ${Object.entries(STATUS_META).map(([k,m])=>`
  <button onclick="window.pmgRecruitment.filterByStatus('${k}')" class="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-sm transition ${filterVal===k?'ring-2 ring-blue-400':''}">
    <p class="text-xl font-bold text-gray-900">${counts[k]}</p>
    <p class="text-[10px] text-gray-500 leading-tight">${m.label}</p>
  </button>`).join('')}
</div>

<!-- Gemini Key Status Notice (only if completely unset) -->
${!apiKey ? `
<div class="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
  <div class="flex items-center gap-2">
    <i class="fa-solid fa-key text-amber-600 text-sm"></i>
    <p class="text-xs text-amber-800 font-medium">Gemini API Key is not set in PMG Hub yet. (Shared across 5S Auditor, Pricing, and HR Recruitment)</p>
  </div>
  <button onclick="window.pmgRecruitment.promptSetGeminiKey()" class="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold transition">
    Set Hub Gemini Key
  </button>
</div>` : ''}


<!-- Table -->
<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div class="p-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
    <div class="flex items-center gap-2">
      <input type="text" id="recSearchInput" placeholder="Search name, position, ID..." oninput="window.pmgRecruitment.renderAmDashboard()"
        class="border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-48 focus:ring-2 focus:ring-blue-400 outline-none" value="${sanitize(searchVal)}">
      <select id="recFilterStatus" onchange="window.pmgRecruitment.renderAmDashboard()"
        class="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-400 outline-none">
        <option value="all" ${filterVal==='all'?'selected':''}>All Status</option>
        ${Object.entries(STATUS_META).map(([k,m])=>`<option value="${k}" ${filterVal===k?'selected':''}>${m.label}</option>`).join('')}
      </select>
      <button type="button" onclick="window.pmgRecruitment.syncAppsFromCloud(true)" class="border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5" title="Refresh & Sync from Cloud">
        <i class="fa-solid fa-arrows-rotate"></i> Sync Cloud
      </button>
    </div>
    <span class="text-xs text-gray-400">${filtered.length} application${filtered.length!==1?'s':''}</span>
  </div>
  ${filtered.length === 0 ? `
  <div class="text-center py-16 text-gray-400">
    <i class="fa-solid fa-inbox text-4xl mb-3"></i>
    <p class="text-sm font-medium">No applications yet</p>
    <p class="text-xs mt-1">Share the application form link with candidates</p>
  </div>` : `
  <div class="overflow-x-auto">
    <table class="w-full text-xs">
      <thead class="bg-slate-50 text-gray-600 font-bold">
        <tr>
          <th class="p-3 text-left">Ref ID</th>
          <th class="p-3 text-left">Name</th>
          <th class="p-3 text-left">Position</th>
          <th class="p-3 text-left">Branch</th>
          <th class="p-3 text-left">Applied</th>
          <th class="p-3 text-left">AI Score</th>
          <th class="p-3 text-left">Status</th>
          <th class="p-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        ${filtered.map(app => {
          const m = STATUS_META[app.status] || STATUS_META.new;
          const scoreColor = app.aiScore >= 75 ? 'text-emerald-700 font-bold' :
                             app.aiScore >= 50 ? 'text-amber-700 font-bold' :
                             app.aiScore !== null ? 'text-red-700 font-bold' : 'text-gray-400';
          return `
          <tr class="hover:bg-gray-50 transition">
            <td class="p-3 font-mono text-blue-700">${sanitize(app.id)}</td>
            <td class="p-3 font-semibold text-gray-900">${sanitize(app.name)}</td>
            <td class="p-3 text-gray-600">${sanitize(app.position)}</td>
            <td class="p-3 text-gray-500">${sanitize(app.preferredBranch||'—')}</td>
            <td class="p-3 text-gray-500">${fmtDate(app.appliedAt)}</td>
            <td class="p-3 ${scoreColor}">
              ${app.aiScore !== null ? app.aiScore + '/100' : '<span class="text-gray-300">—</span>'}
              ${app.aiVerdict ? `<br><span class="text-[9px] font-normal text-gray-500">${sanitize(app.aiVerdict)}</span>` : ''}
            </td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.color}"><i class="fa-solid ${m.icon} mr-1"></i>${m.label}</span></td>
            <td class="p-3">
              <div class="flex items-center gap-1">
                <button onclick="window.pmgRecruitment.viewApp('${app.id}')" title="View" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><i class="fa-solid fa-eye"></i></button>
                ${!app.aiReport && app.status === 'new' ? `<button onclick="window.pmgRecruitment.runAI('${app.id}')" title="Run AI Evaluation" class="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"><i class="fa-solid fa-robot"></i></button>` : ''}
                ${app.status === 'shortlist' ? `<button onclick="window.pmgRecruitment.openScheduleModal('${app.id}')" title="Schedule Interview" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><i class="fa-solid fa-calendar-plus"></i></button>` : ''}
                <button onclick="window.pmgRecruitment.deleteApp('${app.id}')" title="Delete" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`}
</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW APPLICATION DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function viewApp(appId) {
  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app) { toast('Application not found', 'error'); return; }
  const apiKey = getGlobalGeminiKey();

  const m = STATUS_META[app.status] || STATUS_META.new;

  // Render AI report section
  let aiSection = '';
  if (app.aiReport) {
    const r = app.aiReport;
    const sc = r.score >= 75 ? 'bg-emerald-500' : r.score >= 50 ? 'bg-amber-500' : 'bg-red-500';
    const numInfo = getNumerologyInfo(app.dob);

    // Pillar score bars
    const pillars = r.pillarScores || {};
    const pillarDefs = [
      { key:'planExecution',    label:'Plan Execution',    icon:'fa-bullseye',       color:'bg-blue-500' },
      { key:'communication',    label:'Communication',     icon:'fa-comments',       color:'bg-purple-500' },
      { key:'stressResilience', label:'Stress Resilience', icon:'fa-shield-heart',   color:'bg-amber-500' },
      { key:'qualificationFit', label:'Qualification Fit', icon:'fa-graduation-cap', color:'bg-emerald-500' },
    ];

    aiSection = `
<div class="bg-slate-900 rounded-xl p-4 text-white mb-4">
  <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
    <div class="flex items-center gap-2">
      <i class="fa-solid fa-robot text-purple-400"></i>
      <span class="font-bold text-sm">Gemini AI Evaluation Report</span>
      <span class="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">${sanitize(r._modelUsed || 'gemini-3.5-flash-lite')}</span>
    </div>
    <span class="text-xs text-slate-400">Evaluated ${fmtDateTime(app.aiEvaluatedAt)}</span>
  </div>

  ${r.smokingFlag ? `<div class="bg-red-900/60 border border-red-500 rounded-lg p-2 mb-3 flex items-center gap-2 text-xs text-red-300">
    <i class="fa-solid fa-ban text-red-400 text-base"></i>
    <strong class="text-red-300">⚠ SMOKING / VAPING FLAGGED</strong> — PMG policy: non-smoker preferred. This is a concern for pharmacy health image.
  </div>` : '<div class="bg-emerald-900/40 border border-emerald-700 rounded-lg p-2 mb-3 flex items-center gap-2 text-xs text-emerald-300"><i class="fa-solid fa-check-circle text-emerald-400"></i> Non-smoker confirmed — good for pharmacy health image.</div>'}

  <div class="flex items-center gap-4 mb-4 flex-wrap">
    <div class="w-16 h-16 rounded-full ${sc} flex items-center justify-center shrink-0 shadow-lg">
      <span class="text-xl font-black">${r.score}</span>
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-bold text-base">${sanitize(r.verdict)}</p>
      <p class="text-slate-300 text-xs mt-1 leading-relaxed">${sanitize(r.summary)}</p>
      <p class="text-xs mt-1">Retention Risk: <span class="font-bold ${r.retentionRisk==='High'?'text-red-400':r.retentionRisk==='Medium'?'text-amber-400':'text-emerald-400'}">${sanitize(r.retentionRisk||'—')}</span></p>
    </div>
  </div>

  <!-- Sales Pillar Scorecard -->
  <div class="bg-slate-800 rounded-xl p-3 mb-3">
    <p class="text-xs font-bold text-blue-300 mb-2"><i class="fa-solid fa-chart-bar mr-1"></i>Sales Team Pillar Scores</p>
    <div class="grid grid-cols-2 gap-2">
      ${pillarDefs.map(p => {
        const val = pillars[p.key] || 0;
        const pct = (val / 25) * 100;
        return `<div>
          <div class="flex justify-between text-[10px] mb-0.5">
            <span class="flex items-center gap-1"><i class="fa-solid ${p.icon} text-xs"></i>${p.label}</span>
            <span class="font-bold">${val}/25</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full ${p.color} rounded-full transition-all" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- Numerology Card -->
  ${numInfo ? `<div class="bg-indigo-900/50 border border-indigo-700 rounded-xl p-3 mb-3">
    <p class="text-xs font-bold text-indigo-300 mb-1.5"><i class="fa-solid fa-star-of-david mr-1"></i>Numerology — Life Path Number ${numInfo.number}: ${sanitize(numInfo.name)}</p>
    <p class="text-xs text-indigo-200 mb-1">Sales Fit: <span class="font-bold text-yellow-300">${sanitize(numInfo.salesFit)}</span></p>
    <p class="text-[11px] text-slate-300 mb-1">${sanitize(numInfo.traits)}</p>
    ${r.numerologyInsight ? `<p class="text-[11px] text-indigo-200 italic border-t border-indigo-800 pt-1.5 mt-1.5"><i class="fa-solid fa-robot text-indigo-400 mr-1"></i>${sanitize(r.numerologyInsight)}</p>` : ''}
  </div>` : ''}

  <!-- 3 Key Dimensions -->
  <div class="space-y-2 mb-3">
    <div class="bg-slate-800 rounded-lg p-3">
      <p class="text-xs font-bold text-blue-300 mb-1"><i class="fa-solid fa-bullseye mr-1"></i>Plan Execution Assessment</p>
      <p class="text-xs text-slate-300">${sanitize(r.planExecutionAssessment||'—')}</p>
    </div>
    <div class="bg-slate-800 rounded-lg p-3">
      <p class="text-xs font-bold text-purple-300 mb-1"><i class="fa-solid fa-comments mr-1"></i>Communication Assessment</p>
      <p class="text-xs text-slate-300">${sanitize(r.communicationAssessment||'—')}</p>
    </div>
    <div class="bg-slate-800 rounded-lg p-3">
      <p class="text-xs font-bold text-amber-300 mb-1"><i class="fa-solid fa-shield-heart mr-1"></i>Stress Resilience Assessment</p>
      <p class="text-xs text-slate-300">${sanitize(r.stressResilienceAssessment||'—')}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
    <div>
      <p class="text-xs font-bold text-emerald-400 mb-1"><i class="fa-solid fa-plus mr-1"></i>Strengths</p>
      <ul class="text-xs text-slate-300 space-y-1">${(r.strengths||[]).map(s=>`<li class="flex gap-1"><i class="fa-solid fa-check text-emerald-400 mt-0.5 shrink-0"></i>${sanitize(s)}</li>`).join('')}</ul>
    </div>
    <div>
      <p class="text-xs font-bold text-red-400 mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Concerns</p>
      <ul class="text-xs text-slate-300 space-y-1">${(r.concerns||[]).map(c=>`<li class="flex gap-1"><i class="fa-solid fa-xmark text-red-400 mt-0.5 shrink-0"></i>${sanitize(c)}</li>`).join('')}</ul>
    </div>
  </div>

  <div class="bg-slate-800 rounded-lg p-3 mb-3">
    <p class="text-xs font-bold text-amber-300 mb-1"><i class="fa-solid fa-school mr-1"></i>SPM Analysis</p>
    <p class="text-xs text-slate-300">${sanitize(r.spmAnalysis||'—')}</p>
  </div>
  <div class="bg-slate-800 rounded-lg p-3 mb-3">
    <p class="text-xs font-bold text-amber-300 mb-1"><i class="fa-solid fa-graduation-cap mr-1"></i>Qualification Risk</p>
    <p class="text-xs text-slate-300">${sanitize(r.qualificationRisk||'—')}</p>
  </div>
  ${r.onlineFootprintNotes ? `
  <div class="bg-slate-800 rounded-lg p-3 mb-3">
    <p class="text-xs font-bold text-cyan-300 mb-1"><i class="fa-solid fa-globe mr-1"></i>Public Footprint & Background Verification (AI)</p>
    <p class="text-xs text-slate-300 leading-relaxed">${sanitize(r.onlineFootprintNotes)}</p>
  </div>` : ''}
  <div class="bg-slate-800 rounded-lg p-3">
    <p class="text-xs font-bold text-purple-300 mb-2"><i class="fa-solid fa-comments mr-1"></i>Suggested Interview Questions</p>
    <ol class="text-xs text-slate-300 space-y-1 list-decimal ml-4">${(r.interviewQuestions||[]).map(q=>`<li>${sanitize(q)}</li>`).join('')}</ol>
  </div>
</div>`;
  } else {
    aiSection = `
<div class="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center mb-4">
  <i class="fa-solid fa-robot text-gray-300 text-2xl mb-2"></i>
  <p class="text-xs text-gray-500 mb-2">AI evaluation not yet run</p>
  <button onclick="window.pmgRecruitment.runAI('${appId}')" class="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition">
    <i class="fa-solid fa-robot mr-1"></i>Run Gemini AI Evaluation
  </button>
</div>`;
  }


  // Build docs section
  const docsSection = app.docs && app.docs.length > 0 ? `
<div class="mb-4">
  <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1"><i class="fa-solid fa-paperclip text-gray-400"></i>Uploaded Documents (${app.docs.length})</h4>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    ${app.docs.map((d,i)=>`
    <div class="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-xs bg-white shadow-2xs">
      <div class="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <i class="fa-solid ${d.type && d.type.includes('pdf')?'fa-file-pdf text-red-500 text-base':'fa-file-image text-blue-500 text-base'} shrink-0"></i>
        <div class="min-w-0">
          <p class="truncate font-semibold text-gray-800">${sanitize(d.name)}</p>
          <p class="text-[10px] text-gray-400 uppercase">${sanitize((d.field || 'doc').replace('file', ''))} &bull; ${Math.round((d.size||0)/1024)} KB</p>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" onclick="window.pmgRecruitment.viewDoc('${app.id}', ${i})" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[11px] transition flex items-center gap-1" title="Preview Document">
          <i class="fa-solid fa-eye"></i> View
        </button>
        <a href="${d.data}" download="${sanitize(d.name)}" class="p-1 text-gray-400 hover:text-gray-700 rounded transition" title="Download">
          <i class="fa-solid fa-download"></i>
        </a>
      </div>
    </div>`).join('')}
  </div>
</div>` : '<p class="text-xs text-gray-400 mb-4">No documents uploaded.</p>';

  const content = el('recAmDetailContent');
  if (!content) return;

  content.innerHTML = `
<div class="flex items-center justify-between mb-4">
  <button onclick="window.pmgRecruitment.switchRecTab('dashboard')" class="text-xs text-blue-600 hover:underline flex items-center gap-1">
    <i class="fa-solid fa-arrow-left"></i> Back to Applications
  </button>
  <div class="flex items-center gap-2">
    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.color}"><i class="fa-solid ${m.icon} mr-1"></i>${m.label}</span>
    <select onchange="window.pmgRecruitment.updateStatus('${appId}', this.value)" class="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-400 outline-none">
      ${Object.entries(STATUS_META).map(([k,sm])=>`<option value="${k}" ${app.status===k?'selected':''}>${sm.label}</option>`).join('')}
    </select>
  </div>
</div>

${aiSection}

<!-- Candidate & Family Public Research (OSINT) -->
<div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white mb-4 border border-indigo-800/40 shadow-sm">
  <div class="flex items-center justify-between mb-2.5 flex-wrap gap-2">
    <div class="flex items-center gap-2">
      <i class="fa-solid fa-magnifying-glass-chart text-cyan-400"></i>
      <h4 class="text-xs font-bold text-white uppercase tracking-wide">Candidate & Family Public Research (Social Media & Web)</h4>
    </div>
    <span class="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">Due Diligence Review</span>
  </div>
  <p class="text-xs text-slate-300 mb-3 leading-relaxed">
    1-Click direct links to search real-time public profiles, social media, and web footprint for <strong>${sanitize(app.name)}</strong>:
  </p>
  
  <!-- Candidate Search Buttons -->
  <div class="flex flex-wrap gap-2 mb-3">
    <a href="https://www.facebook.com/search/people/?q=${encodeURIComponent(app.name)}" target="_blank"
      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs">
      <i class="fa-brands fa-facebook"></i> Facebook Profile Search
    </a>
    <a href="https://www.google.com/search?q=${encodeURIComponent('site:instagram.com "' + app.name + '"')}" target="_blank"
      class="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs">
      <i class="fa-brands fa-instagram"></i> Instagram Search
    </a>
    <a href="https://www.google.com/search?q=${encodeURIComponent('site:linkedin.com/in "' + app.name + '"')}" target="_blank"
      class="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs">
      <i class="fa-brands fa-linkedin"></i> LinkedIn Search
    </a>
    <a href="https://www.google.com/search?q=${encodeURIComponent('"' + app.name + '" ' + (app.placeOfBirth || app.preferredBranch || 'Sarawak'))}" target="_blank"
      class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs">
      <i class="fa-brands fa-google"></i> Google Web Search
    </a>
  </div>

  <!-- Family Members Direct Search Links -->
  ${app.familyBackground ? `
  <div class="border-t border-indigo-900/60 pt-2.5 mt-2.5">
    <p class="text-[11px] font-bold text-indigo-300 mb-1.5 flex items-center gap-1">
      <i class="fa-solid fa-users text-indigo-400"></i> Family Members Verification:
    </p>
    <div class="flex flex-wrap gap-1.5">
      ${app.familyBackground.split(';').map(fam => {
        const trimmed = fam.trim();
        if (!trimmed) return '';
        const famName = trimmed.replace(/\(.*?\)/g, '').trim();
        if (!famName) return '';
        return `
        <div class="inline-flex items-center gap-1.5 bg-slate-800/80 border border-indigo-800/50 rounded-lg px-2.5 py-1 text-[11px]">
          <span class="text-slate-200 font-medium">${sanitize(trimmed)}</span>
          <a href="https://www.facebook.com/search/people/?q=${encodeURIComponent(famName)}" target="_blank" title="Search ${sanitize(famName)} on Facebook" class="text-blue-400 hover:text-blue-300 ml-1">
            <i class="fa-brands fa-facebook"></i>
          </a>
          <a href="https://www.google.com/search?q=${encodeURIComponent('"' + famName + '" Sarawak')}" target="_blank" title="Search ${sanitize(famName)} on Google" class="text-slate-400 hover:text-slate-200">
            <i class="fa-brands fa-google"></i>
          </a>
        </div>`;
      }).join('')}
    </div>
  </div>` : ''}

  <!-- Legal & PDPA Guidance -->
  <div class="bg-indigo-950/70 border border-indigo-800/40 rounded-lg p-2.5 mt-3 text-[10px] text-slate-300 flex items-start gap-2">
    <i class="fa-solid fa-scale-balanced text-amber-400 text-xs shrink-0 mt-0.5"></i>
    <div>
      <span class="text-amber-300 font-bold">Malaysian Employment Law &amp; PDPA 2010 Compliance:</span>
      Public search links are provided for lawful pre-employment verification. Under the <em>Personal Data Protection Act 2010 (Act 709)</em>, hiring evaluations must prioritize candidate job qualifications, integrity, and direct interview responses. Family member information is gathered strictly for emergency and conflict-of-interest declarations.
    </div>
  </div>
</div>


<!-- Personal Info -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
  <h4 class="text-xs font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2"><i class="fa-solid fa-id-card text-blue-500"></i>${sanitize(app.name)} — ${sanitize(app.position)}</h4>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
    ${[
      ['Ref ID', app.id], ['Applied', fmtDateTime(app.appliedAt)], ['Position', app.position],
      ['Preferred Branch', app.preferredBranch], ['Gender', app.gender], ['Age', app.age],
      ['Race', app.race], ['Religion', app.religion], ['Marital Status', app.maritalStatus],
      ['NRIC/IC', app.ic], ['DOB', app.dob], ['Citizenship', app.citizenship],
      ['IC Colour', app.icColour], ['Place of Birth', app.placeOfBirth], ['Height', app.height ? app.height+'cm' : '—'],
      ['Weight', app.weight ? app.weight+'kg' : '—'], ['Phone', app.phone], ['Email', app.email],
      ['Driving License', app.drivingLicense],
    ].map(([k,v])=>`<div><p class="text-[10px] text-gray-400 uppercase tracking-wide">${k}</p><p class="font-medium text-gray-800">${sanitize(String(v||'—'))}</p></div>`).join('')}
    <div class="col-span-2 sm:col-span-3"><p class="text-[10px] text-gray-400 uppercase tracking-wide">Address</p><p class="font-medium text-gray-800">${sanitize(app.address||'—')}</p></div>
    <div class="col-span-2 sm:col-span-3"><p class="text-[10px] text-gray-400 uppercase tracking-wide">Emergency Contact</p><p class="font-medium text-gray-800">${sanitize(app.emergencyContact||'—')}</p></div>
  </div>
</div>

<!-- Education & SPM -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
  <h4 class="text-xs font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2"><i class="fa-solid fa-graduation-cap text-amber-500"></i>Education</h4>
  <div class="bg-amber-50 rounded-lg p-3 mb-3">
    <p class="text-[10px] text-amber-700 font-bold uppercase mb-1">SPM Results</p>
    <p class="text-xs text-gray-800 whitespace-pre-line">${sanitize(app.spm||'Not provided')}</p>
  </div>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
    <div><p class="text-[10px] text-gray-400 uppercase">Highest Qual</p><p class="font-medium">${sanitize(app.highestQual||'—')}</p></div>
    <div><p class="text-[10px] text-gray-400 uppercase">Institution</p><p class="font-medium">${sanitize(app.institution||'—')}</p></div>
    <div><p class="text-[10px] text-gray-400 uppercase">CGPA/Grade</p><p class="font-medium">${sanitize(app.cgpa||'—')}</p></div>
    <div class="col-span-2 sm:col-span-3"><p class="text-[10px] text-gray-400 uppercase">Additional Certs</p><p class="font-medium">${sanitize(app.additionalCerts||'—')}</p></div>
  </div>
  ${app.educationHistory ? `<p class="text-[10px] text-gray-400 uppercase mb-1">Education History</p><p class="text-xs whitespace-pre-line font-mono text-gray-700">${sanitize(app.educationHistory)}</p>` : ''}
</div>

<!-- Work & Screening -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
  <h4 class="text-xs font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2"><i class="fa-solid fa-briefcase text-slate-500"></i>Work History & Screening</h4>
  <div class="bg-gray-50 rounded-lg p-3 mb-3">
    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Employment History</p>
    <p class="text-xs whitespace-pre-line font-mono text-gray-700">${sanitize(app.workHistory||'No previous employment.')}</p>
  </div>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
    ${[
      ['Notice Period', app.noticeRequired||'?'],
      ['Skills', app.skills||'—'], ['IT Skills', app.itSkills||'—'],
      ['Has Transport', app.hasTransport||'?'], ['Able to Travel Branches', app.ableToTravel||'?'],
      ['Can Do Shift', app.canDoShift||'?'], ['Accept 3yr Contract', app.accept3yr||'?'],
      ['Future Study/Govt Plan', app.futurePlan||'?'], ['Smokes/Vapes', app.smokes||'?'],
      ['Health Issues', app.healthIssues||'None'], ['Depression Meds', app.depressionMeds||'No'],
      ['Recent Surgery', app.recentSurgery||'No'], ['Relatives at PMG', app.relativesAtPmg||'No'],
    ].map(([k,v])=>`<div><p class="text-[10px] text-gray-400 uppercase">${k}</p><p class="font-medium text-gray-800">${sanitize(String(v))}</p></div>`).join('')}

    ${app.futurePlanDetail ? `<div class="col-span-2 sm:col-span-3"><p class="text-[10px] text-gray-400 uppercase">Future Plan Details</p><p class="font-medium text-red-700">${sanitize(app.futurePlanDetail)}</p></div>` : ''}
  </div>
</div>

<!-- Languages -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
  <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2"><i class="fa-solid fa-language text-purple-500"></i>Languages</h4>
  <p class="text-xs text-gray-600">${sanitize(app.languages||'Not specified')}</p>
</div>

<!-- References -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
  <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2"><i class="fa-solid fa-address-book text-indigo-500"></i>References</h4>
  <p class="text-xs text-gray-600 whitespace-pre-line font-mono">${sanitize(app.references||'Not provided')}</p>
</div>

<!-- Documents -->
${docsSection}

<!-- Action Buttons -->
<div class="flex flex-wrap gap-2 pt-2">
  ${!app.aiReport ? `<button onclick="window.pmgRecruitment.runAI('${appId}')" class="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"><i class="fa-solid fa-robot"></i>Run AI Evaluation</button>` : ''}
  ${app.status === 'shortlist' ? `<button onclick="window.pmgRecruitment.openScheduleModal('${appId}')" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"><i class="fa-solid fa-calendar-plus"></i>Schedule Interview</button>` : ''}
  <button onclick="window.pmgRecruitment.updateStatus('${appId}','shortlist')" class="px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition"><i class="fa-solid fa-check mr-1"></i>Shortlist</button>
  <button onclick="window.pmgRecruitment.updateStatus('${appId}','rejected')" class="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"><i class="fa-solid fa-times mr-1"></i>Reject</button>
  <button onclick="window.pmgRecruitment.printApp('${appId}')" class="px-4 py-2 bg-gray-700 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"><i class="fa-solid fa-print mr-1"></i>Print</button>
  <button onclick="window.pmgRecruitment.exportAppPdf('${appId}')" class="px-4 py-2 bg-slate-600 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition"><i class="fa-solid fa-file-pdf mr-1"></i>Export PDF</button>
</div>`;

  switchRecTab('detail');
}

// ─────────────────────────────────────────────────────────────────────────────
// AI RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function runAI(appId) {
  const apiKey = getGlobalGeminiKey();
  if (!apiKey) {
    promptSetGeminiKey();
    return;
  }

  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app) return;

  toast('Running Gemini 3.5 Flash-Lite evaluation… please wait', 'info');

  // Update status to reviewing
  app.status = 'reviewing';
  saveApps(apps);

  try {
    // Always start with lite (primary). runAiEvaluation auto-falls back to flash.
    const report = await runAiEvaluation(app, apiKey, 'lite');
    app.aiScore = report.score;
    app.aiVerdict = report.verdict;
    app.aiReport = report;
    app.aiEvaluatedAt = now();
    app.status = report.score >= 60 ? 'shortlist' : 'reviewing';
    saveApps(apps);
    const modelLabel = report._modelUsed?.includes('lite') ? 'Flash-Lite' : 'Flash';
    toast(`AI Evaluation complete [${modelLabel}]! Score: ${report.score}/100 — ${report.verdict}`, 'success');
    viewApp(appId); // refresh detail view

  } catch(err) {
    app.status = 'new';
    saveApps(apps);
    toast('AI evaluation failed: ' + err.message, 'error');
    console.error('[Recruitment AI]', err);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// STATUS & ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
function updateStatus(appId, newStatus) {
  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app) return;
  app.status = newStatus;
  saveApps(apps);
  toast(`Status updated to: ${STATUS_META[newStatus]?.label}`, 'success');
  renderAmDashboard();
  // Refresh detail if open
  const detailEl = el('recAmDetailContent');
  if (detailEl && !detailEl.classList.contains('hidden')) viewApp(appId);
}

function deleteApp(appId) {
  if (!confirm('Delete this application? This cannot be undone.')) return;
  const apps = loadApps().filter(a => a.id !== appId);
  saveApps(apps);
  toast('Application deleted', 'info');
  renderAmDashboard();
  switchRecTab('dashboard');
}

function filterByStatus(status) {
  const el2 = el('recFilterStatus');
  if (el2) { el2.value = status; }
  renderAmDashboard();
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW SCHEDULING MODAL
// ─────────────────────────────────────────────────────────────────────────────
function openScheduleModal(appId) {
  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app) return;

  const modal = el('modalRecInterviewSchedule');
  if (!modal) return;

  el('schedModalAppName').textContent = app.name;
  el('schedModalAppPos').textContent = app.position;
  el('schedModalAppId').value = appId;

  // Set min date to tomorrow
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  el('schedModalDate').min = tomorrow.toISOString().split('T')[0];
  el('schedModalDate').value = '';
  el('schedModalTimeSlot').innerHTML = '<option value="">— Pick a date first —</option>';
  el('schedModalLocation').value = 'PMG Pharmacy Kota Sentosa, Jalan Setia Raja, Kota Sentosa, Kuching, Sarawak';
  el('schedModalNotes').value = '';

  modal.classList.remove('hidden');
}

function closeScheduleModal() {
  const modal = el('modalRecInterviewSchedule');
  if (modal) modal.classList.add('hidden');
}

function updateScheduleTimeSlots() {
  const dateVal = el('schedModalDate')?.value;
  const slotSel = el('schedModalTimeSlot');
  if (!dateVal || !slotSel) return;

  const slots = getAvailableSlots(dateVal);
  slotSel.innerHTML = slots.length === 0
    ? '<option value="">No slots available on this day</option>'
    : '<option value="">— Select Time —</option>' + slots.map(s=>`<option value="${s}">${s}</option>`).join('');
}

async function confirmInterviewSchedule() {
  const appId = el('schedModalAppId')?.value;
  const date = el('schedModalDate')?.value;
  const time = el('schedModalTimeSlot')?.value;
  const location = el('schedModalLocation')?.value;
  const notes = el('schedModalNotes')?.value || '';

  if (!date || !time) { toast('Please select date and time', 'warn'); return; }

  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app) return;

  // Save slot
  const slots = loadSlots();
  slots.push({ id: genId(), appId, applicantName: app.name, position: app.position, date, time, location, notes, confirmed: true, createdAt: now() });
  saveSlots(slots);

  // Update app status
  app.status = 'invited';
  app.interviewDate = date;
  app.interviewTime = time;
  app.interviewLocation = location;
  saveApps(apps);

  // Build appointment message for candidate
  const msg = `Dear ${app.name},\n\nCongratulations! You have been shortlisted for an interview at PMG Pharmacy.\n\nInterview Details:\nDate: ${date}\nTime: ${time}\nLocation: ${location}\n\nPlease bring:\n- Original IC / MyKad\n- All original academic certificates\n- Any professional certifications\n\nContact: William Chai\nPhone: +601110990693\n\nWe look forward to meeting you.\n\nBest regards,\nPMG Pharmacy HR Team`;

  closeScheduleModal();
  toast('Interview scheduled! ' + date + ' ' + time, 'success');

  // Show message template
  if (confirm('Interview scheduled! Open WhatsApp message template?')) {
    const waLink = `https://wa.me/${(app.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank');
  }

  renderAmDashboard();
  viewApp(appId);
}

function copyFormLink() {
  const url = 'https://williamchai1.github.io/Pharmacy-Branch-Management-Hub/?apply=1';
  navigator.clipboard.writeText(url)
    .then(()=>toast('Public application form link copied! (Direct access, no login needed)', 'success'))
    .catch(()=>toast('Link: ' + url, 'warn'));
}

function shareViaWhatsApp() {
  const url = 'https://williamchai1.github.io/Pharmacy-Branch-Management-Hub/?apply=1';
  const msg = `📋 *PMG Pharmacy Job Application*\n\nInterested in joining PUBLIC MEDICARE GROUP (PMG) Pharmacy team in Kuching, Sarawak?\n\nPositions available:\n• Pharmacist\n• Pharmacy Assistant\n• Nutritionist / Dietitian\n\n🔗 Apply directly online (No login required):\n${url}\n\nFill in your details and upload your SPM/education results directly.\n\nFor enquiries, contact William Chai (PMG Kota Sentosa) at +601110990693.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB SWITCHER (Clean: dashboard, slots, apply, detail — no settings tab)
// ─────────────────────────────────────────────────────────────────────────────
function switchRecTab(tab) {
  ['dashboard','slots','apply','detail'].forEach(t => {
    const v = el(`recTab-${t}`);
    const b = el(`recTabBtn-${t}`);
    if (v) { if (t === tab) v.classList.remove('hidden'); else v.classList.add('hidden'); }
    if (b) {
      const active = 'border-b-2 border-blue-600 text-blue-700 font-bold';
      const inactive = 'border-b-2 border-transparent text-gray-500 hover:text-gray-700';
      b.className = `rec-tab-btn text-xs py-2 px-3 transition flex items-center gap-1.5 ${t===tab?active:inactive}`;
    }
  });

  if (tab === 'slots') renderSlotsTab();
  if (tab === 'apply') renderPublicForm();
  if (tab === 'dashboard') renderAmDashboard();
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW SLOTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function renderSlotsTab() {
  const container = el('recSlotsContent');
  if (!container) return;
  const slots = loadSlots().sort((a,b)=>a.date>b.date?1:-1);

  // Calendar grid for next 2 weeks
  const days = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(); d.setDate(d.getDate()+i);
    days.push(d);
  }

  const booked = {};
  slots.forEach(s => { if (!booked[s.date]) booked[s.date] = []; booked[s.date].push(s); });

  container.innerHTML = `
<div class="mb-4">
  <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-calendar-week text-purple-600"></i>Upcoming Interview Schedule (Next 14 Days)</h4>
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
    ${days.map(d => {
      const iso = d.toISOString().split('T')[0];
      const dow = d.getDay();
      const isOff = dow === 0;
      const daySlots = booked[iso] || [];
      const avail = isOff ? 0 : getAvailableSlots(iso).length;
      return `
<div class="border rounded-xl p-2 text-center text-xs ${isOff?'bg-gray-50 text-gray-300 border-gray-100':'bg-white border-gray-200 hover:shadow-sm transition'}">
  <p class="font-bold text-[10px] text-gray-400">${d.toLocaleDateString('en-MY',{weekday:'short'}).toUpperCase()}</p>
  <p class="text-sm font-bold ${isOff?'text-gray-300':'text-gray-900'}">${d.getDate()}</p>
  <p class="text-[10px] ${isOff?'text-gray-300':'text-gray-400'}">${d.toLocaleDateString('en-MY',{month:'short'})}</p>
  ${!isOff ? `<p class="text-[10px] mt-1 ${avail>3?'text-emerald-600':avail>0?'text-amber-600':'text-red-500'} font-semibold">${avail} slot${avail!==1?'s':''}</p>` : '<p class="text-[10px] text-gray-200 mt-1">Off</p>'}
  ${daySlots.length>0 ? `<p class="text-[10px] text-blue-600 font-bold">${daySlots.length} booked</p>` : ''}
</div>`;
    }).join('')}
  </div>
</div>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div class="p-3 border-b border-gray-100">
    <h4 class="text-xs font-bold text-gray-700">All Scheduled Interviews</h4>
  </div>
  ${slots.length === 0 ? `<div class="text-center py-10 text-gray-400 text-xs"><i class="fa-solid fa-calendar text-3xl mb-2"></i><p>No interviews scheduled yet</p></div>` : `
  <table class="w-full text-xs">
    <thead class="bg-slate-50 text-gray-600 font-bold">
      <tr>
        <th class="p-3 text-left">Date & Time</th>
        <th class="p-3 text-left">Applicant</th>
        <th class="p-3 text-left">Position</th>
        <th class="p-3 text-left">Location</th>
        <th class="p-3 text-left">Notes</th>
        <th class="p-3 text-left">Action</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-50">
      ${slots.map(s=>`
      <tr class="hover:bg-gray-50">
        <td class="p-3 font-semibold text-gray-900">${sanitize(s.date)} ${sanitize(s.time)}</td>
        <td class="p-3"><button onclick="window.pmgRecruitment.viewApp('${s.appId}')" class="text-blue-600 hover:underline">${sanitize(s.applicantName)}</button></td>
        <td class="p-3 text-gray-600">${sanitize(s.position)}</td>
        <td class="p-3 text-gray-500">${sanitize(s.location)}</td>
        <td class="p-3 text-gray-400">${sanitize(s.notes||'—')}</td>
        <td class="p-3"><button onclick="window.pmgRecruitment.deleteSlot('${s.id}')" class="text-red-400 hover:text-red-600 text-xs"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`).join('')}
    </tbody>
  </table>`}
</div>`;
}

function deleteSlot(slotId) {
  if (!confirm('Remove this interview slot?')) return;
  const slots = loadSlots().filter(s => s.id !== slotId);
  saveSlots(slots);
  toast('Interview slot removed', 'info');
  renderSlotsTab();
}

// ─────────────────────────────────────────────────────────────────────────────
// MISC HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function addFamilyRow() {
  const container = el('recFamilyRows');
  if (!container) return;
  const i = container.querySelectorAll('div').length;
  const div = document.createElement('div');
  div.className = 'grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2';
  div.innerHTML = `
    <input type="text" name="famName${i}" class="rec-input text-xs" placeholder="Name">
    <input type="text" name="famRelation${i}" class="rec-input text-xs" placeholder="Relation">
    <input type="number" name="famAge${i}" class="rec-input text-xs" placeholder="Age">
    <input type="text" name="famOccupation${i}" class="rec-input text-xs" placeholder="Occupation">`;
  container.appendChild(div);
}

function addSpmSubjectRow(subject = '', grade = '') {
  const container = document.getElementById('spmSubjectsContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.innerHTML = createSpmRowHtml(subject, grade);
  container.appendChild(div.firstElementChild);
}

function resetPublicForm() {
  const f = document.getElementById('recPublicForm');
  if (f) f.reset();
  const spmCont = document.getElementById('spmSubjectsContainer');
  if (spmCont) {
    spmCont.innerHTML = DEFAULT_SPM_SUBJECTS.map(subj => createSpmRowHtml(subj, '')).join('');
  }
}

function printApp(appId) {
  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app) {
    toast('Application not found', 'error');
    return;
  }

  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow popups for this site to export or print candidate applications.');
    return;
  }

  const m = STATUS_META[app.status] || STATUS_META.new;
  const ai = app.aiReport || null;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PMG Candidate Dossier — ${sanitize(app.name)} (${sanitize(app.id)})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #1f2937;
      margin: 0;
      padding: 16px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title { font-size: 18pt; font-weight: 800; color: #1e3a8a; margin: 0; }
    .subtitle { font-size: 9pt; color: #6b7280; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 700;
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 1.5px solid #e5e7eb;
      padding-bottom: 4px;
      margin-top: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5pt; }
    th, td { padding: 4px 8px; text-align: left; vertical-align: top; }
    .prop-table td:first-child { width: 28%; font-weight: 600; color: #4b5563; }
    .prop-table td:last-child { width: 72%; color: #111827; }
    .data-table th { background: #f3f4f6; font-weight: 700; border: 1px solid #d1d5db; color: #374151; }
    .data-table td { border: 1px solid #e5e7eb; }
    .ai-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin-top: 10px;
      page-break-inside: avoid;
    }
    .ai-score {
      font-size: 20pt;
      font-weight: 900;
      color: #1e3a8a;
    }
    .pill { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5pt; font-weight: 600; background: #e2e8f0; margin-right: 4px; }
    ul { margin: 4px 0 8px 18px; padding: 0; }
    li { margin-bottom: 2px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
    <div><strong>Ready to print or save as PDF.</strong> Click the button below or press Ctrl+P.</div>
    <div>
      <button onclick="window.print()" style="padding: 6px 14px; font-weight: 700; background: #1e3a8a; color: white; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
      <button onclick="window.close()" style="padding: 6px 12px; margin-left: 6px; font-weight: 600; background: #e5e7eb; color: #374151; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    </div>
  </div>

  <div class="header">
    <div>
      <h1 class="title">PMG PHARMACY</h1>
      <p class="subtitle">Candidate Application Dossier &bull; PMG Kota Sentosa</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">${sanitize(m.label)}</span>
      <p style="font-size: 8.5pt; color: #6b7280; margin: 4px 0 0 0;">Ref: <strong>${sanitize(app.id)}</strong></p>
      <p style="font-size: 8.5pt; color: #6b7280; margin: 2px 0 0 0;">Applied: ${fmtDateTime(app.appliedAt)}</p>
    </div>
  </div>

  <div class="section-title">1. Position & Placement</div>
  <table class="prop-table">
    <tr><td>Position Applied:</td><td><strong>${sanitize(app.position)}</strong></td></tr>
    <tr><td>Preferred Branch:</td><td>${sanitize(app.preferredBranch || 'Kota Sentosa')}</td></tr>
    <tr><td>Willing to Travel:</td><td>${sanitize(app.willingToTravel || app.ableToTravel || 'Yes')}</td></tr>
  </table>

  <div class="section-title">2. Personal Particulars</div>
  <table class="prop-table">
    <tr><td>Full Name:</td><td><strong>${sanitize(app.name)}</strong></td></tr>
    <tr><td>NRIC / Passport:</td><td>${sanitize(app.ic || 'N/A')}</td></tr>
    <tr><td>Date of Birth / Age:</td><td>${sanitize(app.dob || 'N/A')} (${sanitize(String(app.age || ''))} years old)</td></tr>
    <tr><td>Gender / Race / Religion:</td><td>${sanitize(app.gender || 'N/A')} / ${sanitize(app.race || 'N/A')} / ${sanitize(app.religion || 'N/A')}</td></tr>
    <tr><td>Marital Status:</td><td>${sanitize(app.maritalStatus || 'Single')}</td></tr>
    <tr><td>Contact Phone / Email:</td><td>${sanitize(app.phone || 'N/A')} &bull; ${sanitize(app.email || 'N/A')}</td></tr>
    <tr><td>Residential Address:</td><td>${sanitize(app.address || 'N/A')}</td></tr>
    <tr><td>Transport & License:</td><td>${sanitize(app.hasTransport || 'Yes')} (License: ${sanitize(app.drivingLicense || 'None')})</td></tr>
  </table>

  <div class="section-title">3. Education & SPM Results</div>
  <table class="prop-table">
    <tr><td>Highest Qualification:</td><td><strong>${sanitize(app.highestQual || 'N/A')}</strong> (${sanitize(app.major || '')})</td></tr>
    <tr><td>Institution / University:</td><td>${sanitize(app.institution || 'N/A')} (CGPA: ${sanitize(app.cgpa || 'N/A')})</td></tr>
    <tr><td>SPM Results:</td><td style="white-space: pre-line; font-family: monospace, sans-serif;">${sanitize(app.spm || 'Not specified')}</td></tr>
    <tr><td>Language Proficiency:</td><td>${sanitize(app.languages || 'Not specified')}</td></tr>
  </table>

  <div class="section-title">4. Operational & Contractual Readiness</div>
  <table class="prop-table">
    <tr><td>Shift Work (incl. Weekends):</td><td><strong>${sanitize(app.canDoShift || 'Yes')}</strong></td></tr>
    <tr><td>3-Year Commitment:</td><td><strong>${sanitize(app.accept3yr || 'Yes')}</strong></td></tr>
    <tr><td>Smokes / Vapes:</td><td>${app.smokes === 'Yes' ? '<strong style="color:red;">YES (Flagged)</strong>' : 'No'}</td></tr>
    <tr><td>Health Declaration:</td><td>${sanitize(app.healthDeclaration || 'Good health')} ${app.healthDeclarationDetail ? `(${sanitize(app.healthDeclarationDetail)})` : ''}</td></tr>
    <tr><td>Future Study / Govt Plan:</td><td>${sanitize(app.futurePlan || 'No')} ${app.futurePlanDetail ? `(${sanitize(app.futurePlanDetail)})` : ''}</td></tr>
    <tr><td>Emergency Contact:</td><td>${sanitize(app.emergencyContact || 'N/A')}</td></tr>
  </table>

  ${ai ? `
  <div class="section-title">5. AI Screening & Executive Evaluation</div>
  <div class="ai-box">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 8px;">
      <div>
        <div style="font-size: 8.5pt; text-transform: uppercase; color: #64748b; font-weight: 700;">Evaluation Verdict</div>
        <div style="font-size: 13pt; font-weight: 800; color: #0f172a;">${sanitize(ai.verdict || 'Reviewed')}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 8.5pt; text-transform: uppercase; color: #64748b; font-weight: 700;">Overall Fit Score</div>
        <div class="ai-score">${ai.score !== undefined ? ai.score : '—'}<span style="font-size: 12pt; color: #64748b;">/100</span></div>
      </div>
    </div>

    ${ai.summary ? `<p style="font-size: 9.5pt; margin-top: 4px; color: #334155; line-height: 1.4;">${sanitize(ai.summary)}</p>` : ''}

    <div style="margin-top: 8px;">
      <strong>Key Strengths:</strong>
      <ul>${(ai.strengths || []).map(s => `<li>${sanitize(s)}</li>`).join('')}</ul>
    </div>

    <div style="margin-top: 6px;">
      <strong style="color: #b91c1c;">Areas of Concern / Red Flags:</strong>
      <ul>${(ai.concerns || []).map(c => `<li>${sanitize(c)}</li>`).join('')}</ul>
    </div>

    ${ai.spmAnalysis ? `
    <div style="margin-top: 6px;">
      <strong>SPM Aptitude Analysis:</strong>
      <p style="margin: 2px 0 6px 0; font-size: 9.5pt; color: #334155;">${sanitize(ai.spmAnalysis)}</p>
    </div>` : ''}

    ${ai.interviewQuestions && ai.interviewQuestions.length > 0 ? `
    <div style="margin-top: 6px;">
      <strong>Suggested Probing Interview Questions:</strong>
      <ol style="margin: 2px 0 0 18px; padding: 0; font-size: 9.5pt;">${ai.interviewQuestions.map(q => `<li>${sanitize(q)}</li>`).join('')}</ol>
    </div>` : ''}
  </div>` : ''}

  <div style="margin-top: 24px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between;">
    <span>Public Medicare Group (PMG) &bull; Kota Sentosa PIC Portal</span>
    <span>Confidential &bull; Generated on ${new Date().toLocaleDateString('en-GB')}</span>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    });
  <\/script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}

function exportAppPdf(appId) {
  // Directly opens styled candidate dossier ready for Print / Save as PDF
  printApp(appId);
}

function viewDoc(appId, docIdx) {
  const apps = loadApps();
  const app = apps.find(a => a.id === appId);
  if (!app || !app.docs || !app.docs[docIdx]) {
    toast('Document not found', 'error');
    return;
  }

  const doc = app.docs[docIdx];
  const modal = el('modalRecDocViewer');
  const title = el('recDocModalTitle');
  const subtitle = el('recDocModalSubtitle');
  const body = el('recDocModalBody');
  const dlBtn = el('recDocModalDownloadBtn');

  if (!modal || !body) return;

  const docTypeLabel = (doc.field || 'Document').replace('file', '').toUpperCase();
  title.textContent = `${docTypeLabel} — ${doc.name}`;
  subtitle.textContent = `Candidate: ${app.name} (${app.id}) • Size: ${Math.round((doc.size || 0)/1024)} KB`;

  if (dlBtn) {
    dlBtn.href = doc.data || '#';
    dlBtn.download = doc.name || 'document';
  }

  const isPdf = (doc.type && doc.type.toLowerCase().includes('pdf')) || (doc.name && doc.name.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    body.innerHTML = `
      <iframe src="${doc.data}" class="w-full h-full rounded-lg border border-slate-300 bg-white" title="${sanitize(doc.name)}">
        <p class="p-4 text-center text-sm text-gray-500">Your browser does not support inline PDF preview. <a href="${doc.data}" download="${sanitize(doc.name)}" class="text-blue-600 underline font-bold">Click here to download</a>.</p>
      </iframe>`;
  } else {
    body.innerHTML = `
      <div class="w-full h-full flex items-center justify-center overflow-auto p-2">
        <img src="${doc.data}" alt="${sanitize(doc.name)}" class="max-h-[80vh] max-w-full object-contain rounded-lg shadow-sm border border-slate-200 bg-white">
      </div>`;
  }

  modal.classList.remove('hidden');
}

function closeDocViewer() {
  const modal = el('modalRecDocViewer');
  if (modal) {
    modal.classList.add('hidden');
    const body = el('recDocModalBody');
    if (body) body.innerHTML = '';
  }
}

async function syncAppsFromCloud(force = false) {
  try {
    const apiUrl = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
    if (!apiUrl) return;

    const res = await fetch(`${apiUrl}?action=getJobApplications`);
    if (!res.ok) return;

    const data = await res.json();
    if (data && data.success && Array.isArray(data.applications)) {
      const localApps = loadApps();
      const localMap = new Map(localApps.map(a => [a.id, a]));
      let changesCount = 0;

      data.applications.forEach(remoteApp => {
        if (!remoteApp || !remoteApp.id) return;
        const existing = localMap.get(remoteApp.id);
        if (!existing) {
          localMap.set(remoteApp.id, remoteApp);
          changesCount++;
        } else {
          if (remoteApp.aiReport && !existing.aiReport) {
            localMap.set(remoteApp.id, { ...existing, ...remoteApp });
            changesCount++;
          }
        }
      });

      if (changesCount > 0 || force) {
        const merged = Array.from(localMap.values());
        merged.sort((a,b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
        localStorage.setItem(REC_KEY, JSON.stringify(merged));

        // Push new applicant files to OneDrive if handle available
        const engine = window.pmgOneDriveSync || window.pmgOneDrive;
        if (engine && engine.rootHandle) {
          merged.forEach(app => saveSingleApplicantToOneDrive(app, engine.rootHandle));
        }

        renderAmDashboard();
        if (force) toast(`Synced ${data.applications.length} applications from cloud.`, 'success');
      }
    }
  } catch(e) {
    console.warn('[Recruitment] Cloud sync error:', e);
    if (force) toast('Could not fetch cloud applications: ' + e.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
function init() {
  patchOneDriveWithRecruitment();

  // Initial cloud sync
  syncAppsFromCloud(false);

  // Check URL for apply view
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'apply') {
    setTimeout(() => switchRecTab('apply'), 500);
  }

  // Initial render
  renderAmDashboard();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
window.pmgRecruitment = {
  init,
  renderPublicForm,
  renderPublicPortalForm,
  renderAmDashboard,
  viewApp,
  runAI,
  deleteApp,
  updateStatus,
  filterByStatus,
  openScheduleModal,
  closeScheduleModal,
  updateScheduleTimeSlots,
  confirmInterviewSchedule,
  backupRecruitmentToOneDrive,
  saveSingleApplicantToOneDrive,
  copyFormLink,
  shareViaWhatsApp,
  switchRecTab,
  renderSlotsTab,
  deleteSlot,
  addFamilyRow,
  addSpmSubjectRow,
  resetPublicForm,
  printApp,
  exportAppPdf,
  submitPublicForm,
  onIcInput,
  viewDoc,
  closeDocViewer,
  syncAppsFromCloud,
  loadApps,
  saveApps,
  loadSlots,
  getGlobalGeminiKey,
  promptSetGeminiKey,
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
