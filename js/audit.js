// js/audit.js — Module 3: Outlet 5S AI Walkthrough Auditor (Area Manager Only)
'use strict';

let auditVideoFile   = null;
let auditChecklistState = {};  // { itemId: boolean }

// ─── MULTI-TIER GEMINI CONFIGURATION ───────────────────────────────────────────
// User tier requirement (Google AI Studio Free Tier):
// Primary: Gemini 3.5 Flash-Lite (15 RPM / 500 RPD) — Ultra-fast, high-throughput routine tasks
// Secondary: Gemini 3.5 Flash (5 RPM / 20 RPD) — Deep reasoning, 5S video & multimodal vision
// Tertiary: Gemini 3.1 Flash-Lite (15 RPM / 500 RPD) — High-volume fallback
// Fallback: Gemini 2.5 Flash / 2.0 Flash-Lite / 1.5 Flash
const AUDIT_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const AUDIT_SECONDARY_MODEL = 'gemini-3.5-flash';
const AUDIT_TERTIARY_MODEL  = 'gemini-3.1-flash-lite';
const AUDIT_FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initAudit() {
  const dropZone  = document.getElementById('auditDropZone');
  const fileInput = document.getElementById('auditInput');
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files.length) handleAuditVideoSelect(e.target.files[0]);
  });
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleAuditVideoSelect(e.dataTransfer.files[0]);
  });

  // Persist API key to localStorage and clear stale revoked key
  const apiKeyInput = document.getElementById('geminiApiKey');
  if (apiKeyInput) {
    let saved = localStorage.getItem('pmg_gemini_key') || '';
    if (saved === 'AIzaSyAfJqs6YnY5J_URsuvmSMi8WM3BckVwKY4') {
      localStorage.removeItem('pmg_gemini_key');
      saved = '';
    }
    apiKeyInput.value = saved;
    apiKeyInput.addEventListener('input', () => {
      const val = apiKeyInput.value.trim();
      if (val) localStorage.setItem('pmg_gemini_key', val);
      else localStorage.removeItem('pmg_gemini_key');
    });
  }

  // Populate branch select if empty and BRANCHES is available
  const branchSelect = document.getElementById('auditBranchSelect');
  if (branchSelect && branchSelect.options.length <= 1 && typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
    BRANCHES.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.code;
      opt.textContent = `${b.code} – ${b.name}`;
      branchSelect.appendChild(opt);
    });
  }

  const runBtn = document.getElementById('auditRunBtn');
  if (runBtn) runBtn.addEventListener('click', runAudit);
}

// ─── TEST API KEY (MULTI-TIER: FLASH-LITE PRIMARY, FLASH SECONDARY) ──────────
async function testGeminiApiKey() {
  const statusEl = document.getElementById('geminiKeyStatus');
  const apiKey = (document.getElementById('geminiApiKey')?.value || '').trim()
              || localStorage.getItem('pmg_gemini_key') || '';

  if (!apiKey) {
    if (statusEl) {
      statusEl.className = 'text-[11px] mt-1 text-red-600 font-semibold';
      statusEl.textContent = '❌ Please enter an API key first.';
    }
    return;
  }

  if (statusEl) {
    statusEl.className = 'text-[11px] mt-1 text-amber-600 font-semibold';
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Testing connection with Gemini 3.5 Flash-Lite (Primary: 500 RPD)…';
  }

  const candidateModels = [
    { code: AUDIT_PRIMARY_MODEL,   name: 'Gemini 3.5 Flash-Lite (Primary: 500 RPD)' },
    { code: AUDIT_SECONDARY_MODEL, name: 'Gemini 3.5 Flash (Secondary: 20 RPD)' },
    { code: AUDIT_TERTIARY_MODEL,  name: 'Gemini 3.1 Flash-Lite (High Quota: 500 RPD)' },
    { code: 'gemini-2.5-flash',    name: 'Gemini 2.5 Flash' },
    { code: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
    { code: 'gemini-1.5-flash',    name: 'Gemini 1.5 Flash (Fallback)' }
  ];

  let verifiedModel = null;
  let lastErrorMsg = '';

  for (let i = 0; i < candidateModels.length; i++) {
    const m = candidateModels[i];
    try {
      if (statusEl && i > 0) {
        statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Checking ${m.name}…`;
      }

      const testResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.code}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generation_config: { max_output_tokens: 5 }
        })
      });

      if (testResp.ok) {
        verifiedModel = m;
        break;
      }

      if (testResp.status === 403) {
        if (statusEl) {
          statusEl.className = 'text-[11px] mt-1 text-red-600 font-semibold';
          statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> 403 Key Revoked/Invalid. <a href="https://aistudio.google.com/app/apikey" target="_blank" class="underline font-bold text-red-700">Get a new free key here</a>.';
        }
        return;
      }

      const errJson = await testResp.json().catch(() => ({}));
      lastErrorMsg = errJson?.error?.message || `HTTP ${testResp.status}`;
    } catch (netErr) {
      lastErrorMsg = netErr.message;
    }
  }

  if (verifiedModel) {
    localStorage.setItem('pmg_gemini_key', apiKey);
    if (statusEl) {
      statusEl.className = 'text-[11px] mt-1 text-emerald-600 font-semibold';
      statusEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> API key verified on <b>${verifiedModel.name}</b>! AI features are active and ready.`;
    }
  } else {
    if (statusEl) {
      statusEl.className = 'text-[11px] mt-1 text-red-600 font-semibold';
      statusEl.textContent = `❌ Verification failed: ${lastErrorMsg || 'Unable to connect to Google Gemini API'}`;
    }
  }
}

// ─── VIDEO SELECT ─────────────────────────────────────────────────────────────
function handleAuditVideoSelect(file) {
  auditVideoFile = file;
  const preview = document.getElementById('auditVideoPreview');
  const videoEl = document.getElementById('auditVideoEl');
  const infoEl  = document.getElementById('auditVideoInfo');

  if (videoEl) {
    const url = URL.createObjectURL(file);
    videoEl.src = url;
    videoEl.load();
  }
  if (infoEl) infoEl.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
  if (preview) preview.classList.remove('hidden');

  // Reset previous report
  const reportContainer = document.getElementById('auditReportContainer');
  if (reportContainer) reportContainer.classList.add('hidden');
}

// ─── CLIENT-SIDE VIDEO KEYFRAME EXTRACTION ────────────────────────────────────
// Extracts 6 frames evenly distributed across the video and converts to lightweight JPEG base64.
// This is 100% reliable in-browser, bypassing heavy video uploads, CORS blocks, and processing timeouts.
function extractVideoFrames(videoFile, numFrames = 6, setStatus = () => {}) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = async () => {
      try {
        let duration = video.duration;
        if (!duration || isNaN(duration) || !isFinite(duration) || duration <= 0) {
          duration = 60; // fallback duration estimate
        }

        const timestamps = [];
        for (let i = 0; i < numFrames; i++) {
          const frac = (i + 0.5) / numFrames;
          timestamps.push(duration * frac);
        }

        const frames = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Scale to max width/height 1024 to keep payload lightweight and fast
        const maxDim = 1024;
        let w = video.videoWidth || 800;
        let h = video.videoHeight || 600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;

        for (let idx = 0; idx < timestamps.length; idx++) {
          const t = timestamps[idx];
          const timeLabel = formatTime(t);
          setStatus(`Extracting walkthrough keyframe ${idx + 1}/${timestamps.length} (${timeLabel})…`);

          await seekVideo(video, t);
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const base64Data = dataUrl.split(',')[1];
          frames.push({
            timeSec: t,
            timestampStr: timeLabel,
            base64: base64Data
          });
        }

        cleanup();
        resolve(frames);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Browser could not decode the video file. Please ensure it is an MP4 or MOV format.'));
    };
  });
}

function seekVideo(video, time) {
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    }, 3500);

    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.min(time, Math.max(0, (video.duration || time + 1) - 0.1));
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── RUN AUDIT ────────────────────────────────────────────────────────────────
async function runAudit() {
  const apiKey = (document.getElementById('geminiApiKey')?.value || '').trim()
              || localStorage.getItem('pmg_gemini_key') || '';

  const branchSelect = document.getElementById('auditBranchSelect');
  const session = typeof getSession === 'function' ? getSession() : null;
  const branchName = (branchSelect && branchSelect.options[branchSelect.selectedIndex]?.text)
                  || (session ? session.branch : 'Kota Sentosa');

  if (!auditVideoFile && !apiKey) {
    alert('Please upload a walkthrough video and enter your Gemini API key.');
    return;
  }

  const progressEl   = document.getElementById('auditProgress');
  const statusTextEl = document.getElementById('auditStatusText');
  const runBtn       = document.getElementById('auditRunBtn');

  if (progressEl) progressEl.classList.remove('hidden');
  if (runBtn) { runBtn.disabled = true; runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Analysing…'; }

  const setStatus = msg => { if (statusTextEl) statusTextEl.textContent = msg; };

  try {
    if (!apiKey) {
      setStatus('No Gemini API key detected — running offline demo report…');
      await sleep(1200);
      renderMockAuditReport(branchName);
      alert('Note: Running in Demo Mode because no Gemini API key was provided. Enter a free Gemini API key above to run live AI audits with Gemini 3.5 Flash.');
    } else if (!auditVideoFile) {
      alert('Please upload a store walkthrough video (MP4/MOV) first.');
      if (progressEl) progressEl.classList.add('hidden');
      if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i>Run 5S AI Audit'; }
      return;
    } else {
      // Step 1: Extract keyframes
      setStatus('Step 1/3 — Extracting video walkthrough keyframes…');
      const frames = await extractVideoFrames(auditVideoFile, 6, setStatus);

      // Step 2: Gemini Vision evaluation with Gemini 3.5 Flash (Primary) / Flash-Lite (Secondary)
      setStatus('Step 2/3 — Evaluating 5S compliance across 4 categories with Gemini 3.5 Flash…');
      const reportJson = await callGeminiGenerateWithFrames(frames, branchName, apiKey, setStatus);

      // Step 3: Render report
      setStatus('Step 3/3 — Rendering audit findings & action plan…');
      renderAuditReport(reportJson);
    }
  } catch (err) {
    console.error('Audit failure:', err);
    let errMsg = err.message || 'Unknown error';
    if (errMsg.includes('403')) {
      errMsg = 'Gemini API Key rejected (403 Forbidden). Please click "Get Free Key" to generate a new free key in Google AI Studio and paste it above.';
    }
    setStatus(`⚠️ Error: ${errMsg}. Showing sample reference report.`);
    alert(`5S Walkthrough Audit Notice:\n\n${errMsg}\n\nA demo reference report has been displayed below.`);
    renderMockAuditReport(branchName);
  } finally {
    if (progressEl) progressEl.classList.add('hidden');
    if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>Re-Run Audit'; }
  }
}

// ─── GEMINI GENERATE WITH KEYFRAMES (DUAL-TIER: 3.5 FLASH & 3.5 FLASH-LITE) ──
async function callGeminiGenerateWithFrames(frames, branchName, apiKey, setStatus) {
  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = `You are an official compliance auditor for PMG PHARMACY SDN BHD.
Analyse the provided sequence of keyframe images extracted from a store walkthrough video (with timestamp labels) and produce a detailed structured JSON audit report strictly calibrated against the official PMG HQ Branch Compliance Audit Marking Scheme.
This audit score directly determines outlet performance grading and team bonus payout.

═══════════════════════════════════════════════════════════════════════════
OFFICIAL PMG HQ AUDIT MARKING SCHEME & CATEGORIES (TOTAL: 200 POINTS):
═══════════════════════════════════════════════════════════════════════════
1. Stock Management (72 Points) [Passing threshold: 80% = 57.6 pts]
   - 1.1 Stock Expiry Control and Management (3 pts): Check expiry color tags, clearance basket, no expired items on shelves.
   - 1.2 Stock Cycle (3 pts): Optimal range 1.5 - 2.5 months (buffer 2.0 mo standard).
   - 1.3 Stock Aging (3 pts): No stagnant or dead stock left unaddressed.
   - 1.4 Controlled Substance Storage / Cold Chain (3 pts): Poison cabinet locked; fridge temperature between 2°C–8°C.
   - 1.5 Stock Accuracy (60 pts, 1 pt/SKU): Physical stock must tally with system records.

2. Customer Service (6 Points) [Passing threshold: 80% = 4.8 pts]
   - 2.1 Customer Greeting (3 pts): Warm professional greeting within 3 seconds.
   - 2.2 Customer Request / Special Order Items (3 pts): Special order request book updated.

3. Display (48 Points) [Passing threshold: 80% = 38.4 pts]
   - 3.1 Display at Cashier (3 pts): QR code payment display, marketing QR codes visible.
   - 3.2 Licensing Display Up-to-date (6 pts):
       a) Business Registration / Trading License / Body Corporate (3 pts)
       b) Poison A License / ARC / FRP / Pharmacist on Duty Display (3 pts)
   - 3.3 Fire Extinguisher License Up-to-date & Unobstructed (3 pts)
   - 3.4 Price Tag Display Up-to-Date (30 pts, 1 pt/SKU): Every item must have price tag; barcode sticker price must MATCH gondola price tag exactly.
   - 3.5 Marketing Display (6 pts):
       3.5.1 Promotion Campaign Display Up-to-date (3 pts)
       3.5.2 POSM / KKLIU Display Up-to-date (3 pts): NO EXPIRED campaign POSM materials on display.

4. Recording (18 Points) [Passing threshold: 80% = 14.4 pts]
   - 4.1 Poison C Record (3 pts)
   - 4.2 Codeine and Pseudoephedrine Record (3 pts)
   - 4.3 Codeine and Pseudoephedrine Stock Accuracy (6 pts)
   - 4.4 Prescription Record (3 pts)
   - 4.5 Temperature Record (Fridge, Store) (3 pts)

5. Cleanliness (22 Points) [Passing threshold: 80% = 17.6 pts] - HIGH VISIBILITY IN WALKTHROUGH:
   - 5.1 Indoor (Other areas, walkways, floor clean) (2 pts)
   - 5.2 Prescription Counter (2 pts): Dust-free, wiped, no residue.
   - 5.3 Cashier Counter (2 pts): Dust-free, wiped, no dead insects, no loose documents.
   - 5.4 Shop Entrance (Glass Door, Front Shop) (2 pts): Clean glass, no smudges or dirt.
   - 5.5 Counseling Area (2 pts): Clean table, tidy chairs.
   - 5.6 Pantry (2 pts): Clean sink, tidy counter, no food waste.
   - 5.7 Toilet (2 pts): Clean, dry floor, no foul odor or stains.
   - 5.8 Stock Shelves (2 pts): Dust-free, wiped, no dead insects.
   - 5.9 Store Room / Stock Storage Area (2 pts): Organized, clean floor.
   - 5.10 Products (OTC, POM) on Gondola (2 pts): All displayed products must be free from dust coats.
   - 5.11 Shop Facilities (Fridges, Fan, PC, TV, CCTV) (2 pts): ABSOLUTELY NO personal beverages/food stored in medication fridge!

6. Tidiness (14 Points) [Passing threshold: 80% = 11.2 pts] - HIGH VISIBILITY IN WALKTHROUGH:
   - 6.1 Glass Door Entrance Display (2 pts): Neat marketing, no peeling stickers.
   - 6.2 Prescription Counter (2 pts): Neat dispensing tools, no clutter.
   - 6.3 Cashier Counter (2 pts): Organized receipt rolls, cash drawer neat.
   - 6.4 Counseling Area (2 pts): Patient leaflets neatly organized.
   - 6.5 Pantry (2 pts): Tidy utensils and cabinets.
   - 6.6 Store Room / Storage Walkway (2 pts): Clear walkways (min 1m), no cartons on floor.
   - 6.7 Stock Arrangement (OTC/POM) (2 pts): NO empty spaces or gaps between products; front-facing labels; strict compliance with SOP "1.3.1.1 In-Store Merchandising Display Rules in PMG Pharmacy".

7. Operation (16 Points) [Passing threshold: 80% = 12.8 pts]
   - 7.1 Proper Petty Cash Record, Storage and Accuracy (2 pts)
   - 7.2 Invoices / Credit Notes Received into System < 2 Days (2 pts)
   - 7.3 Stock Arrangement - FIFO Adherence (2 pts): Items arranged according to First-In First-Out method to minimize expiry risk.
   - 7.4 Gondola Label and Stock Display Matching (2 pts)
   - 7.5 Cashier Operation & Membership Policy (4 pts)
   - 7.6 Stock Management Procedures & Daily SOP (4 pts)

8. Team Member's Attire (4 Points) [Passing threshold: 80% = 3.2 pts]
   - 8.1 Pharmacists/Nutritionist/Dietitian (2 pts): White Coat + Lanyard (1 pt), Professional Formal Attire + Closed-Toe Footwear (1 pt)
   - 8.2 BM/ABM/Health Advisor/PA (2 pts): Uniform + Lanyard (1 pt), Formal Long Pants / Over-Knee Skirt + Closed-Toe Footwear (1 pt)

═══════════════════════════════════════════════════════════════════════════
STRICT PMG HQ BONUS & PASSING CRITERIA:
═══════════════════════════════════════════════════════════════════════════
HQ Standard: "To achieve an overall passing score, every component of the audit criteria must meet or exceed the passing standard (80% per category)".
- Tier 1 Bonus (Achieved): Overall score >= 90% (>= 180/200) AND every category >= 80% (Pass).
- Tier 2 Bonus (Achieved): Overall score 80% - 89% (160–179/200) AND every category >= 80% (Pass).
- Bonus At Risk / Forfeited: Overall score < 80% OR ANY single category < 80% (Fail).

Return ONLY valid JSON matching this schema:
{
  "overall_score": <integer 0-200>,
  "max_score": 200,
  "percentage": <float 0-100>,
  "overall_status": "<Pass|Fail>",
  "bonus_tier": "<Tier 1 Achieved (Full Bonus) | Tier 2 Achieved (Standard Bonus) | Bonus At Risk / Forfeited>",
  "bonus_tier_reason": "<string explanation>",
  "branch_observed": "${branchName || 'Target Outlet'}",
  "audit_date": "${today}",
  "categories": [
    {
      "id": "CAT_1",
      "clause_num": "1",
      "name": "Stock Management",
      "score": <number>,
      "max_points": 72,
      "percentage": <number>,
      "status": "<Pass|Fail>",
      "findings": [
        {
          "timestamp": "<MM:SS>",
          "clause": "<e.g. 1.4 Controlled Substance Storage>",
          "observation": "<string>",
          "points_deducted": <number>,
          "severity": "<Low|Medium|High>",
          "corrective_action": "<string>",
          "deadline": "<3-Day SLA | 1-Month SLA | Immediate>"
        }
      ],
      "checklist_items": ["<action item 1>", "<action item 2>"]
    }
    // ... all 8 categories included
  ],
  "timestamped_deductions": [
    {
      "timestamp": "<MM:SS>",
      "clause": "<e.g. 5.3 Cashier Counter Cleanliness>",
      "category": "<e.g. Cleanliness>",
      "observation": "<string>",
      "points_deducted": <number>,
      "corrective_action": "<string>",
      "deadline": "<3-Day SLA | 1-Month SLA>"
    }
  ],
  "top_priority_actions": ["<string>", "<string>", "<string>"],
  "pre_audit_checklist": [
    { "text": "<action>", "sla": "<3-Day SLA | Immediate | 1-Month SLA>" }
  ],
  "whatsapp_summary": "<concise WhatsApp-ready message with bonus status, score / 200, and top 3-day action items>"
}`;

  const contentsParts = [];
  frames.forEach((f, i) => {
    contentsParts.push({
      text: `Walkthrough Keyframe #${i + 1} at timestamp [${f.timestampStr}]:`
    });
    contentsParts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: f.base64
      }
    });
  });

  contentsParts.push({
    text: `Conduct a strict walkthrough audit of this pharmacy outlet (${branchName}) against all 8 official PMG HQ Audit categories. Deduct points with exact clauses and timestamps. Return the JSON report.`
  });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: contentsParts }],
    generation_config: {
      response_mime_type: 'application/json',
      temperature: 0.2,
      max_output_tokens: 4096,
    }
  };

  const candidateModels = [
    { code: AUDIT_PRIMARY_MODEL,   name: 'Gemini 3.5 Flash-Lite (Primary: 500 RPD)' },
    { code: AUDIT_SECONDARY_MODEL, name: 'Gemini 3.5 Flash (Secondary: 20 RPD)' },
    { code: AUDIT_TERTIARY_MODEL,  name: 'Gemini 3.1 Flash-Lite (High Quota: 500 RPD)' },
    { code: 'gemini-2.5-flash',    name: 'Gemini 2.5 Flash' },
    { code: 'gemini-1.5-flash',    name: 'Gemini 1.5 Flash (Fallback)' }
  ];
  let lastErr = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const m = candidateModels[i];
    try {
      setStatus(`Analysing walkthrough keyframes against PMG HQ Rubric with ${m.name}…`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m.code}:generateContent?key=${apiKey}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (resp.status === 403) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(`Gemini API 403 Forbidden: Invalid or revoked API key. ${errJson?.error?.message || ''}`);
      }

      if (resp.status === 404 || resp.status === 429 || resp.status >= 500) {
        const errText = await resp.text();
        console.warn(`${m.name} returned status ${resp.status}: ${errText}. Attempting next tier.`);
        lastErr = new Error(`${m.name} returned HTTP ${resp.status}`);
        if (i < candidateModels.length - 1) {
          setStatus(`${m.name} busy or quota exceeded. Switching to ${candidateModels[i + 1].name}…`);
          await sleep(800);
        }
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini API error (${resp.status}): ${errText}`);
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text);
      parsed._modelUsed = m.name;
      return parsed;
    } catch (err) {
      lastErr = err;
      if (err.message && err.message.includes('403')) {
        throw err;
      }
      console.warn(`Error on ${m.name}:`, err);
      if (i < candidateModels.length - 1) {
        setStatus(`${m.name} encountered error. Switching to ${candidateModels[i + 1].name}…`);
        await sleep(800);
      }
    }
  }

  throw lastErr || new Error('Failed to obtain audit report from Gemini Vision.');
}

// ─── MOCK DEMO REPORT (CALIBRATED TO OFFICIAL PMG HQ KOTA SENTOSA AUDIT) ───────
function renderMockAuditReport(branchOverride) {
  const session    = typeof getSession === 'function' ? getSession() : null;
  const branchName = branchOverride || (session ? session.branch : 'Kota Sentosa');
  const today      = new Date().toISOString().slice(0, 10);

  const mockReport = {
    overall_score: 171,
    max_score: 200,
    percentage: 85.5,
    overall_status: 'Fail',
    bonus_tier: 'Bonus At Risk / Forfeited',
    bonus_tier_reason: 'Category 5. Cleanliness failed (12/22, 54.5% < 80% passing threshold). HQ standard requires all 8 categories to meet or exceed 80% to qualify for bonus payout.',
    branch_observed: branchName,
    audit_date: today,
    _modelUsed: 'Official PMG HQ Compliance Engine (Natasha Vischilla Rubric)',
    categories: [
      {
        id: 'CAT_1',
        clause_num: '1',
        name: 'Stock Management',
        score: 63,
        max_points: 72,
        percentage: 87.5,
        status: 'Pass',
        findings: [
          {
            timestamp: '00:15',
            clause: '1.2 Stock Cycle',
            observation: 'Stock cycle is 2.73, which is above the optimal HQ standard range of 1.5–2.5 months.',
            points_deducted: 3,
            severity: 'High',
            corrective_action: 'Implement targeted promotions to reduce excess stock. Adjust reorder buffer points to 2.0 mo standard.',
            deadline: '1-Month SLA'
          },
          {
            timestamp: '00:45',
            clause: '1.5 Stock Accuracy',
            observation: 'Physical stock count shows only 18/20 sampled SKUs tally with Xilnex inventory (90% accuracy).',
            points_deducted: 6,
            severity: 'Medium',
            corrective_action: 'Double check discrepancies and submit stock adjustment form to admin-in-charge.',
            deadline: '3-Day SLA'
          }
        ],
        checklist_items: [
          'Verify stock accuracy of all fast-moving items against Xilnex before audit',
          'Review 2.0-month HQ reorder buffer and submit excess stock clearance list'
        ]
      },
      {
        id: 'CAT_2',
        clause_num: '2',
        name: 'Customer Service',
        score: 6,
        max_points: 6,
        percentage: 100.0,
        status: 'Pass',
        findings: [],
        checklist_items: [
          'Maintain 3-second warm customer greeting upon entry',
          'Keep special customer order notebook at cashier'
        ]
      },
      {
        id: 'CAT_3',
        clause_num: '3',
        name: 'Display',
        score: 42,
        max_points: 48,
        percentage: 87.5,
        status: 'Pass',
        findings: [
          {
            timestamp: '00:28',
            clause: '3.4 Price Tag Display Up-to-Date',
            observation: '9/10 price tags updated. 1 item barcode sticker price differs from the gondola shelf tag.',
            points_deducted: 3,
            severity: 'Medium',
            corrective_action: 'Remove outdated price tag and replace with updated one. Ensure barcode sticker matches gondola tag exactly.',
            deadline: '3-Day SLA'
          },
          {
            timestamp: '01:10',
            clause: '3.5.2 POSM / KKLIU Marketing Display',
            observation: 'Expired campaign POSM materials still on display on end-cap gondola.',
            points_deducted: 3,
            severity: 'Medium',
            corrective_action: 'Remove expired campaign POSM materials immediately. Display current KKLIU promotional banners.',
            deadline: '3-Day SLA'
          }
        ],
        checklist_items: [
          'Remove all expired campaign POSM materials from end-caps and glass entrance',
          'Audit gondola price tags against current barcode sticker prices',
          'Verify Fire Extinguisher license tag and Pharmacist on Duty display'
        ]
      },
      {
        id: 'CAT_4',
        clause_num: '4',
        name: 'Recording',
        score: 18,
        max_points: 18,
        percentage: 100.0,
        status: 'Pass',
        findings: [],
        checklist_items: [
          'Ensure Poison C and Cold Chain fridge temperature logs are signed twice daily',
          'Verify Codeine and Pseudoephedrine physical stock tally with register book'
        ]
      },
      {
        id: 'CAT_5',
        clause_num: '5',
        name: 'Cleanliness',
        score: 12,
        max_points: 22,
        percentage: 54.5,
        status: 'Fail',
        findings: [
          {
            timestamp: '00:35',
            clause: '5.3 Cashier Counter Cleanliness',
            observation: 'Cashier counter surface is dusty with dead insects and paper clutter.',
            points_deducted: 2,
            severity: 'High',
            corrective_action: 'Wipe and clean all surfaces to remove dust and dead insects.',
            deadline: '3-Day SLA'
          },
          {
            timestamp: '00:52',
            clause: '5.7 Toilet Cleanliness',
            observation: 'Staff toilet very dirty; stains on bowl and floor wet.',
            points_deducted: 2,
            severity: 'High',
            corrective_action: 'Conduct regular daily cleaning to keep toilet clean and dry.',
            deadline: '3-Day SLA'
          },
          {
            timestamp: '01:05',
            clause: '5.8 Stock Shelves Cleanliness',
            observation: 'Dusty surfaces on OTC gondola lower shelves.',
            points_deducted: 2,
            severity: 'Medium',
            corrective_action: 'Wipe and clean all surfaces on shelves to remove any dust and dead insects.',
            deadline: '3-Day SLA'
          },
          {
            timestamp: '01:18',
            clause: '5.10 Products Cleanliness (OTC, POM)',
            observation: 'Dust on item packaging displayed on gondola row 3.',
            points_deducted: 2,
            severity: 'Medium',
            corrective_action: 'Ensure all stock displayed on gondolas is wiped free from dust.',
            deadline: '3-Day SLA'
          },
          {
            timestamp: '01:32',
            clause: '5.11 Shop Facilities Cleanliness',
            observation: 'Personal beverages stored inside medication cold chain fridge.',
            points_deducted: 2,
            severity: 'High',
            corrective_action: 'Remove all personal beverages/food from medication fridge immediately. No food or drinks permitted inside at any time.',
            deadline: '3-Day SLA'
          }
        ],
        checklist_items: [
          'Deep-clean cashier counter, prescription counter, and counseling desk',
          'Wipe all gondola shelves and displayed medicine bottles to remove dust',
          'Remove ALL food and beverages from medication cold chain fridge',
          'Perform thorough sanitization of toilet and pantry'
        ]
      },
      {
        id: 'CAT_6',
        clause_num: '6',
        name: 'Tidiness',
        score: 12,
        max_points: 14,
        percentage: 85.7,
        status: 'Pass',
        findings: [
          {
            timestamp: '01:24',
            clause: '6.7 Stock Arrangement (OTC/POM)',
            observation: 'Empty spaces between products on Vitamin C gondola; items not displayed neatly or face-forward.',
            points_deducted: 2,
            severity: 'Medium',
            corrective_action: 'Ensure all items displayed on gondola are arranged neatly and face-forward per SOP 1.3.1.1.',
            deadline: '3-Day SLA'
          }
        ],
        checklist_items: [
          'Eliminate empty gaps on gondolas by front-facing products per SOP 1.3.1.1',
          'Ensure backroom walkways maintain minimum 1m clearance with no cartons on floor'
        ]
      },
      {
        id: 'CAT_7',
        clause_num: '7',
        name: 'Operation',
        score: 14,
        max_points: 16,
        percentage: 87.5,
        status: 'Pass',
        findings: [
          {
            timestamp: '01:40',
            clause: '7.3 Stock Arrangement - FIFO Adherence',
            observation: 'Some stocks were not arranged according to the FIFO (First-In First-Out) method.',
            points_deducted: 2,
            severity: 'High',
            corrective_action: 'Gondola PIC must conduct regular checks to ensure items are arranged strictly by FIFO to minimize expiry.',
            deadline: '3-Day SLA'
          }
        ],
        checklist_items: [
          'Audit all gondolas to ensure older batches are placed in front (FIFO adherence)',
          'Verify invoices and credit notes are keyed into system within 2 days',
          'Check that gondola shelf labels match displayed merchandise'
        ]
      },
      {
        id: 'CAT_8',
        clause_num: '8',
        name: "Team Member's Attire",
        score: 4,
        max_points: 4,
        percentage: 100.0,
        status: 'Pass',
        findings: [],
        checklist_items: [
          'Pharmacists: White coat, official lanyard, formal attire + closed-toe footwear',
          'Assistants/Advisors: PMG uniform, lanyard, formal trousers + closed-toe shoes'
        ]
      }
    ],
    timestamped_deductions: [
      {
        timestamp: '00:15',
        clause: '1.2 Stock Cycle',
        category: 'Stock Management',
        observation: 'Stock cycle is 2.73 (Above 1.5–2.5 optimal range).',
        points_deducted: 3,
        corrective_action: 'Implement targeted promotions and reduce reorder buffer to 2.0 mo standard.',
        deadline: '1-Month SLA'
      },
      {
        timestamp: '00:28',
        clause: '3.4 Price Tag Display',
        category: 'Display',
        observation: 'Barcode sticker price differs from gondola shelf price tag on 1 SKU.',
        points_deducted: 3,
        corrective_action: 'Replace outdated shelf price tag. Ensure barcode and shelf tags match.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '00:35',
        clause: '5.3 Cashier Counter Cleanliness',
        category: 'Cleanliness',
        observation: 'Cashier counter dusty with dead insects and paper clutter.',
        points_deducted: 2,
        corrective_action: 'Wipe all surfaces and file loose receipts.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '00:45',
        clause: '1.5 Stock Accuracy',
        category: 'Stock Management',
        observation: 'Physical count 18/20 tally with Xilnex inventory (90%).',
        points_deducted: 6,
        corrective_action: 'Recount discrepancies and submit adjustment form to admin.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '00:52',
        clause: '5.7 Toilet Cleanliness',
        category: 'Cleanliness',
        observation: 'Staff toilet very dirty with wet floor and stains.',
        points_deducted: 2,
        corrective_action: 'Perform deep cleaning and keep toilet dry daily.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '01:05',
        clause: '5.8 Stock Shelves Cleanliness',
        category: 'Cleanliness',
        observation: 'Dusty surfaces on OTC gondola lower shelves.',
        points_deducted: 2,
        corrective_action: 'Wipe shelves clean and remove dead insects.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '01:10',
        clause: '3.5.2 POSM Marketing Display',
        category: 'Display',
        observation: 'Expired promotional campaign POSM banners still on display.',
        points_deducted: 3,
        corrective_action: 'Remove expired campaign materials immediately.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '01:18',
        clause: '5.10 Products Cleanliness',
        category: 'Cleanliness',
        observation: 'Dust on item packaging on gondola row 3.',
        points_deducted: 2,
        corrective_action: 'Wipe product packaging to maintain dust-free presentation.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '01:24',
        clause: '6.7 Stock Arrangement',
        category: 'Tidiness',
        observation: 'Empty gaps between products on Vitamin C gondola; items disarranged.',
        points_deducted: 2,
        corrective_action: 'Refill from back-store and face forward per SOP 1.3.1.1.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '01:32',
        clause: '5.11 Shop Facilities',
        category: 'Cleanliness',
        observation: 'Personal beverages stored inside medication cold chain fridge.',
        points_deducted: 2,
        corrective_action: 'Remove all personal beverages/food from medication fridge immediately.',
        deadline: '3-Day SLA'
      },
      {
        timestamp: '01:40',
        clause: '7.3 Stock Arrangement - FIFO',
        category: 'Operation',
        observation: 'Stocks on gondola not arranged according to FIFO method.',
        points_deducted: 2,
        corrective_action: 'Rearrange older batches to front to minimize expiry risk.',
        deadline: '3-Day SLA'
      }
    ],
    top_priority_actions: [
      '🔴 [3-Day SLA] Cleanliness: Wipe cashier counter and stock shelves to remove all dust and dead insects.',
      '🔴 [3-Day SLA] Facilities: Remove personal drinks and food from medication cold chain fridge immediately.',
      '🔴 [3-Day SLA] Tidiness & FIFO: Refill gondola gaps and arrange products strictly by FIFO method.',
      '🟡 [3-Day SLA] Display: Take down expired POSM campaign materials and sync price tags.',
      '🟡 [1-Month SLA] Stock Cycle: Reduce buffer to 2.0 mo and run targeted clearance promos.'
    ],
    pre_audit_checklist: [
      { text: 'Cashier & prescription counters wiped clean and free of dead insects', sla: '3-Day SLA' },
      { text: 'All products on gondolas wiped free of dust and facing forward (SOP 1.3.1.1)', sla: '3-Day SLA' },
      { text: 'Medication fridge completely free of personal food or beverages', sla: 'Immediate' },
      { text: 'Expired campaign POSM posters and banners taken down', sla: '3-Day SLA' },
      { text: 'Price tags on gondolas match barcode stickers on items', sla: '3-Day SLA' },
      { text: 'Stock arranged by First-In First-Out (FIFO) method', sla: '3-Day SLA' },
      { text: 'Poison cabinet locked and controlled medicine registers verified', sla: 'Immediate' },
      { text: 'Staff toilet and pantry thoroughly cleaned and dry', sla: 'Daily SLA' },
      { text: 'Fire extinguisher unobstructed and inspection license up to date', sla: 'Immediate' }
    ],
    whatsapp_summary: `📋 *PMG HQ Compliance Audit Report – ${branchName}*
Date: ${today}
Auditor: PMG HQ Audit System (Natasha Vischilla Rubric)

Overall Score: *171 / 200 (85.5%)*
Status: *FAIL* ⚠️
Bonus Tier: *At Risk / Forfeited* (Cleanliness Failed: 12/22, 54.5%)

⚠️ *HQ Bonus Rule Reminder*:
"To achieve an overall passing score and bonus payout, every component of the audit criteria must meet or exceed 80%."

🔴 *Top Rectifications (Submit proof to Retail Dev Dept within 3 days)*:
1. Wipe cashier counter and all stock shelves (remove dust & dead insects).
2. Remove personal drinks from medication fridge immediately.
3. Remove expired POSM campaign materials.
4. Refill gondola gaps and arrange all items by FIFO.
5. Deep-clean staff toilet.

Please complete all checklist items before the official auditor visit!`
  };

  renderAuditReport(mockReport);
}

// ─── RENDER AUDIT REPORT ──────────────────────────────────────────────────────
function renderAuditReport(report) {
  const container = document.getElementById('auditReportContainer');
  if (!container) return;
  container.classList.remove('hidden');

  // Overall score gauge (out of 200)
  const score    = Math.max(0, Math.min(200, report.overall_score || 0));
  const maxScore = report.max_score || 200;
  const pct      = Math.round((score / maxScore) * 100);

  // Check if any category failed (< 80%)
  const failedCategories = (report.categories || []).filter(c => {
    const cPct = c.percentage !== undefined ? c.percentage : (c.score / c.max_points * 100);
    return c.status === 'FAIL' || c.status === 'Fail' || cPct < 80;
  });
  const hasCategoryFailure = failedCategories.length > 0;
  const isOverallPass = pct >= 80 && !hasCategoryFailure;

  const scoreCol = isOverallPass ? '#16a34a' : (pct >= 80 ? '#d97706' : '#dc2626');
  const dashArr  = 2 * Math.PI * 40;
  const dashOff  = dashArr * (1 - pct / 100);

  const gaugeEl = document.getElementById('auditGauge');
  if (gaugeEl) {
    gaugeEl.innerHTML = `
      <svg viewBox="0 0 100 100" class="w-36 h-36 mx-auto">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="10"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="${scoreCol}" stroke-width="10"
          stroke-dasharray="${dashArr.toFixed(2)}" stroke-dashoffset="${dashOff.toFixed(2)}"
          stroke-linecap="round" transform="rotate(-90 50 50)"
          style="transition: stroke-dashoffset 1.2s ease;"/>
        <text x="50" y="47" text-anchor="middle" dominant-baseline="central"
          font-size="18" font-weight="900" fill="${scoreCol}">${score}</text>
        <text x="50" y="62" text-anchor="middle" font-size="8" fill="#6b7280">/ ${maxScore} (${pct}%)</text>
      </svg>
      <p class="text-center text-sm font-bold mt-1" style="color:${scoreCol}">
        ${isOverallPass ? '✅ OVERALL PASS' : '❌ OVERALL FAIL'}
      </p>`;
  }

  // Bonus Tier Banner
  const bonusBannerEl = document.getElementById('auditBonusTierBanner');
  if (bonusBannerEl) {
    let bonusTitle = '';
    let bonusSub = '';
    let bannerClasses = '';

    if (pct >= 90 && !hasCategoryFailure) {
      bonusTitle = 'Bonus Tier: Tier 1 Achieved (Full Team Bonus)';
      bonusSub = 'Exceptional performance. All 8 compliance categories met or exceeded the 80% passing threshold.';
      bannerClasses = 'bg-emerald-50 border-emerald-300 text-emerald-900';
    } else if (pct >= 80 && !hasCategoryFailure) {
      bonusTitle = 'Bonus Tier: Tier 2 Achieved (Standard Team Bonus)';
      bonusSub = 'Passing standard achieved. All 8 compliance categories met the 80% passing threshold.';
      bannerClasses = 'bg-blue-50 border-blue-300 text-blue-900';
    } else {
      bonusTitle = 'Bonus Tier: At Risk / Forfeited';
      bonusSub = hasCategoryFailure
        ? `HQ Policy: All 8 audit categories must reach >= 80% passing threshold. Failed Category: ${failedCategories.map(c => c.name).join(', ')}. Rectification required within SLA.`
        : 'Overall audit score is below the 80% minimum standard. Rectification required within SLA.';
      bannerClasses = 'bg-rose-50 border-rose-300 text-rose-900';
    }

    bonusBannerEl.className = `mt-3 p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs ${bannerClasses}`;
    bonusBannerEl.innerHTML = `
      <div class="flex items-center gap-2.5">
        <i class="fa-solid ${!hasCategoryFailure && pct >= 80 ? 'fa-award text-emerald-600 text-lg' : 'fa-triangle-exclamation text-rose-600 text-lg'}"></i>
        <div>
          <span class="font-bold text-sm leading-tight">${bonusTitle}</span>
          <p class="text-[11px] opacity-90 mt-0.5">${bonusSub}</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded text-xs font-bold uppercase shadow-2xs ${!hasCategoryFailure && pct >= 80 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
        ${!hasCategoryFailure && pct >= 80 ? 'Bonus Qualified' : 'Action Required'}
      </span>
    `;
  }

  // Score & Engine meta
  setAuditText('auditBranch',     report.branch_observed || '—');
  setAuditText('auditDate',       report.audit_date       || '—');
  setAuditText('auditScoreText',  `${score} / ${maxScore} (${pct}%)`);
  setAuditText('auditEngineText', report._modelUsed       || 'Gemini 3.5 Flash (Primary)');
  setAuditText('auditModelBadge', report._modelUsed ? report._modelUsed.replace(' (Primary)', '').replace(' (Secondary)', '') : 'Gemini 3.5 Flash');

  // Category cards (8 Categories)
  const catsEl = document.getElementById('auditCategoryCards');
  if (catsEl && report.categories) {
    catsEl.innerHTML = report.categories.map(cat => {
      const cPct = cat.percentage !== undefined ? cat.percentage : Math.round(cat.score / cat.max_points * 100);
      const isPass = cat.status === 'Pass' || cat.status === 'PASS' || cPct >= 80;

      const catCol = isPass ? 'border-green-400 bg-green-50/70' : 'border-red-400 bg-red-50/80';
      const catBadge = isPass ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300';

      const findingCount = (cat.findings || []).length;

      return `<div class="border-l-4 rounded-xl p-3.5 shadow-2xs ${catCol} flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-1.5 gap-1">
            <h4 class="font-bold text-xs text-gray-900 leading-tight">${escHtml(cat.clause_num ? cat.clause_num + '. ' + cat.name : cat.name)}</h4>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${catBadge} shrink-0">${isPass ? 'PASS' : 'FAIL'}</span>
          </div>
          <div class="flex items-baseline justify-between mt-2">
            <span class="text-base font-black text-gray-900">${cat.score} <span class="text-xs font-normal text-gray-500">/ ${cat.max_points} pts</span></span>
            <span class="text-xs font-bold ${isPass ? 'text-green-700' : 'text-red-700'}">${Math.round(cPct)}%</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
          <span>Passing standard: 80%</span>
          <span class="${findingCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}">${findingCount} deduction${findingCount !== 1 ? 's' : ''}</span>
        </div>
      </div>`;
    }).join('');
  }

  // Findings table (Timestamped deductions)
  const findingsEl = document.getElementById('auditFindingsBody');
  if (findingsEl) {
    const deductions = report.timestamped_deductions && report.timestamped_deductions.length > 0
      ? report.timestamped_deductions
      : [];

    // Fallback: extract findings from categories if timestamped_deductions not populated
    if (deductions.length === 0 && report.categories) {
      report.categories.forEach(cat => {
        (cat.findings || []).forEach(f => deductions.push({
          timestamp: f.timestamp,
          clause: f.clause || cat.name,
          category: cat.name,
          observation: f.observation,
          points_deducted: f.points_deducted || 2,
          corrective_action: f.corrective_action,
          deadline: f.deadline
        }));
      });
    }

    if (deductions.length === 0) {
      findingsEl.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-xs text-gray-400 font-medium">✅ Excellent! No 5S deficiencies or point deductions spotted in this walkthrough video.</td></tr>`;
    } else {
      findingsEl.innerHTML = deductions.map((f, i) => {
        const isLongDeadline = f.deadline && f.deadline.includes('Month');
        const slaClass = isLongDeadline ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200';

        return `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} border-b border-gray-100 hover:bg-amber-50/40 transition">
          <td class="px-3 py-2.5 text-xs font-mono font-bold text-blue-700">
            <span class="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">${escHtml(f.timestamp || '00:00')}</span>
          </td>
          <td class="px-3 py-2.5 text-xs font-semibold text-gray-800">
            ${escHtml(f.clause || f.category || 'General')}
          </td>
          <td class="px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
            ${escHtml(f.observation)}
          </td>
          <td class="px-3 py-2.5 text-xs text-center shrink-0">
            <span class="inline-block px-2 py-0.5 rounded font-extrabold text-red-700 bg-red-100 border border-red-200">
              -${f.points_deducted || 2} pts
            </span>
          </td>
          <td class="px-3 py-2.5 text-xs text-gray-800 leading-snug">
            <div>${escHtml(f.corrective_action || 'Submit proof of corrective action to Retail Development Department.')}</div>
            <span class="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${slaClass}">
              <i class="fa-solid fa-clock mr-1"></i>${escHtml(f.deadline || '3-Day SLA')}
            </span>
          </td>
        </tr>`;
      }).join('');
    }
  }

  // Priority actions
  const priorityEl = document.getElementById('auditPriorityActions');
  if (priorityEl && report.top_priority_actions) {
    priorityEl.innerHTML = `<ul class="space-y-2">
      ${report.top_priority_actions.map(a => `
        <li class="flex items-start gap-2 text-xs font-medium text-gray-900 bg-white p-2.5 rounded-lg border border-red-200 shadow-2xs">
          <span class="shrink-0 mt-0.5 font-bold text-red-600">→</span>
          <span class="flex-1">${escHtml(a)}</span>
        </li>
      `).join('')}
    </ul>`;
  }

  // Pre-Audit Correction Checklist
  auditChecklistState = {};
  const checklistEl = document.getElementById('auditChecklist');
  if (checklistEl) {
    const items = [];
    if (report.pre_audit_checklist && report.pre_audit_checklist.length > 0) {
      report.pre_audit_checklist.forEach(item => {
        if (typeof item === 'string') items.push({ text: item, sla: '3-Day SLA' });
        else items.push(item);
      });
    } else if (report.categories) {
      report.categories.forEach(cat => {
        (cat.checklist_items || []).forEach(ci => items.push({ text: ci, sla: '3-Day SLA' }));
      });
    }

    if (items.length === 0) {
      checklistEl.innerHTML = `<p class="text-xs text-gray-400">All audit preparation items complete.</p>`;
    } else {
      let idx = 0;
      checklistEl.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          ${items.map(item => {
            const id = `chk_${idx++}`;
            auditChecklistState[id] = false;
            const slaText = item.sla || '3-Day SLA';
            const slaBadge = slaText.includes('Month') ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

            return `<div class="flex items-start gap-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition shadow-2xs">
              <input type="checkbox" id="${id}" class="mt-0.5 h-4 w-4 rounded border-gray-300 accent-emerald-600 shrink-0 cursor-pointer" onchange="toggleChecklist('${id}', this.checked)">
              <div class="flex-1 min-w-0">
                <label for="${id}" id="lbl_${id}" class="text-xs text-gray-800 font-medium cursor-pointer block leading-snug">${escHtml(item.text)}</label>
                <span class="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${slaBadge}">${escHtml(slaText)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      `;
    }
  }

  // Store WhatsApp summary for copy button
  window._auditWhatsappSummary = report.whatsapp_summary || '';

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── CHECKLIST TOGGLE ─────────────────────────────────────────────────────────
function toggleChecklist(id, checked) {
  auditChecklistState[id] = checked;
  const lbl = document.getElementById(`lbl_${id}`);
  if (lbl) {
    lbl.className = checked
      ? 'text-sm text-gray-400 line-through cursor-pointer'
      : 'text-sm text-gray-700 cursor-pointer';
  }
}

// ─── WHATSAPP COPY ────────────────────────────────────────────────────────────
function copyWhatsAppSummary() {
  const text = window._auditWhatsappSummary || '';
  if (!text) { alert('No audit summary available yet.'); return; }
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('auditWABtn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Copied!';
      setTimeout(() => { btn.innerHTML = orig; }, 2500);
    }
  }).catch(() => {
    prompt('Copy this text:', text);
  });
}

// ─── PRINT PDF ────────────────────────────────────────────────────────────────
function printAuditReport() {
  window.print();
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function setAuditText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Expose globals for inline HTML event handlers
window.testGeminiApiKey = testGeminiApiKey;
window.runAudit = runAudit;
window.toggleChecklist = toggleChecklist;
window.copyWhatsAppSummary = copyWhatsAppSummary;
window.printAuditReport = printAuditReport;
