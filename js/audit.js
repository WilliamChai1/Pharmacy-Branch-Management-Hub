// js/audit.js — Module 3: Outlet 5S AI Walkthrough Auditor (Area Manager Only)
'use strict';

let auditVideoFile   = null;
let auditChecklistState = {};  // { itemId: boolean }

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

// ─── TEST API KEY ─────────────────────────────────────────────────────────────
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
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Verifying API key with Google AI Studio…';
  }

  try {
    const testResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
        generation_config: { max_output_tokens: 5 }
      })
    });

    if (testResp.ok) {
      localStorage.setItem('pmg_gemini_key', apiKey);
      if (statusEl) {
        statusEl.className = 'text-[11px] mt-1 text-green-600 font-semibold';
        statusEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> API key is active and verified! Ready to audit.';
      }
    } else {
      const errData = await testResp.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${testResp.status}`;
      if (statusEl) {
        statusEl.className = 'text-[11px] mt-1 text-red-600 font-semibold';
        if (testResp.status === 403) {
          statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> 403 Key Revoked/Invalid. <a href="https://aistudio.google.com/app/apikey" target="_blank" class="underline font-bold text-red-700">Get a new free key here</a>.';
        } else {
          statusEl.textContent = `❌ Verification failed: ${msg}`;
        }
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.className = 'text-[11px] mt-1 text-red-600 font-semibold';
      statusEl.textContent = `❌ Connection error: ${err.message}`;
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
// Extracts 6-8 frames evenly distributed across the video and converts to lightweight JPEG base64.
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
      alert('Note: Running in Demo Mode because no Gemini API key was provided. Enter a free Gemini API key above to run live AI audits on your videos.');
    } else if (!auditVideoFile) {
      alert('Please upload a store walkthrough video (MP4/MOV) first.');
      if (progressEl) progressEl.classList.add('hidden');
      if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i>Run 5S AI Audit'; }
      return;
    } else {
      // Step 1: Extract keyframes
      setStatus('Step 1/3 — Extracting video walkthrough keyframes…');
      const frames = await extractVideoFrames(auditVideoFile, 6, setStatus);

      // Step 2: Gemini Vision evaluation
      setStatus('Step 2/3 — Evaluating 5S compliance across 4 categories with Gemini Vision…');
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

// ─── GEMINI GENERATE WITH KEYFRAMES ───────────────────────────────────────────
async function callGeminiGenerateWithFrames(frames, branchName, apiKey, setStatus) {
  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = `You are a professional retail pharmacy 5S compliance auditor for PMG Pharmacy.
Analyse the provided sequence of keyframe images extracted from a store walkthrough video (with timestamp labels) and produce a detailed structured JSON audit report.

Evaluate across FOUR mandatory categories:
1. DISPENSARY_HYGIENE: Paperwork clutter, prescription organisation, compounding area cleanliness, expired stock on shelves, unorganised medications.
2. MERCHANDISING_SHELVING: Shelf gaps, face-forward product alignment, missing price tags, planogram compliance, dusty displays.
3. FLOOR_SAFETY: Corridor clearances (min 1m walkway), supplier cartons on floor, wet hazards, emergency exit obstruction.
4. POP_MARKETING: Current promotional displays, expired posters removed, POP material condition and placement.

Return ONLY valid JSON matching this schema exactly:
{
  "overall_score": <integer 0-100>,
  "branch_observed": "${branchName || 'Target Outlet'}",
  "audit_date": "${today}",
  "categories": [
    {
      "id": "DISPENSARY_HYGIENE",
      "name": "Dispensary & Counter Hygiene",
      "score": <integer 0-100>,
      "status": "<PASS|FAIL|ATTENTION>",
      "findings": [
        { "timestamp": "<MM:SS>", "observation": "<string>", "severity": "<Low|Medium|High>" }
      ],
      "checklist_items": ["<action item 1>", "<action item 2>"]
    },
    {
      "id": "MERCHANDISING_SHELVING",
      "name": "Merchandising & Shelf Facing",
      "score": <integer 0-100>,
      "status": "<PASS|FAIL|ATTENTION>",
      "findings": [
        { "timestamp": "<MM:SS>", "observation": "<string>", "severity": "<Low|Medium|High>" }
      ],
      "checklist_items": ["<action item 1>", "<action item 2>"]
    },
    {
      "id": "FLOOR_SAFETY",
      "name": "Floor Safety & Backroom Storage",
      "score": <integer 0-100>,
      "status": "<PASS|FAIL|ATTENTION>",
      "findings": [
        { "timestamp": "<MM:SS>", "observation": "<string>", "severity": "<Low|Medium|High>" }
      ],
      "checklist_items": ["<action item 1>", "<action item 2>"]
    },
    {
      "id": "POP_MARKETING",
      "name": "POP & Marketing Compliance",
      "score": <integer 0-100>,
      "status": "<PASS|FAIL|ATTENTION>",
      "findings": [
        { "timestamp": "<MM:SS>", "observation": "<string>", "severity": "<Low|Medium|High>" }
      ],
      "checklist_items": ["<action item 1>", "<action item 2>"]
    }
  ],
  "top_priority_actions": ["<string>", "<string>", "<string>"],
  "whatsapp_summary": "<concise 3-4 line WhatsApp-ready text with emojis>"
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
    text: `Conduct a thorough 5S walkthrough audit of this pharmacy outlet (${branchName}) using the keyframes above. Return the JSON report.`
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

  const candidateModels = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastErr = null;

  for (const model of candidateModels) {
    try {
      setStatus(`Analysing frames with Gemini Vision (${model})…`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (resp.status === 403) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(`Gemini API 403 Forbidden: Invalid or revoked API key. ${errJson?.error?.message || ''}`);
      }

      if (resp.status === 404) {
        // Model not available on this endpoint, try next candidate model
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini API error (${resp.status}): ${errText}`);
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      if (err.message && err.message.includes('403')) {
        throw err;
      }
    }
  }

  throw lastErr || new Error('Failed to obtain audit report from Gemini Vision.');
}

// ─── MOCK DEMO REPORT ─────────────────────────────────────────────────────────
function renderMockAuditReport(branchOverride) {
  const session    = typeof getSession === 'function' ? getSession() : null;
  const branchName = branchOverride || (session ? session.branch : 'Kota Sentosa');
  const today      = new Date().toISOString().slice(0, 10);

  const mockReport = {
    overall_score: 74,
    branch_observed: branchName,
    audit_date: today,
    categories: [
      {
        id: 'DISPENSARY_HYGIENE',
        name: 'Dispensary & Counter Hygiene',
        score: 68,
        status: 'ATTENTION',
        findings: [
          { timestamp: '00:12', observation: 'Loose prescription slips stacked unsorted on the dispensary counter.', severity: 'Medium' },
          { timestamp: '00:45', observation: 'Compounding area shows residue; surfaces not wiped down post-preparation.', severity: 'High' },
          { timestamp: '01:03', observation: 'Two expired stock items spotted on the bottom shelf of the controlled medicines cabinet.', severity: 'High' },
        ],
        checklist_items: [
          'Sort and file all prescription slips into daily folders',
          'Clean and sanitise compounding counter with 70% IPA solution',
          'Remove expired stock immediately; update expiry register',
        ]
      },
      {
        id: 'MERCHANDISING_SHELVING',
        name: 'Merchandising & Shelf Facing',
        score: 80,
        status: 'PASS',
        findings: [
          { timestamp: '00:30', observation: 'Vitamin C section has 2 gap-outs visible; no shelf talker present.', severity: 'Low' },
          { timestamp: '01:15', observation: 'Three products face inward; labels not visible to customers.', severity: 'Low' },
        ],
        checklist_items: [
          'Fill gap-outs in Vitamin C section from back-store',
          'Face forward all products in aisle 3',
          'Update missing shelf talkers for OTC supplements',
        ]
      },
      {
        id: 'FLOOR_SAFETY',
        name: 'Floor Safety & Backroom Storage',
        score: 72,
        status: 'ATTENTION',
        findings: [
          { timestamp: '00:55', observation: 'Supplier carton (Kotra Pharma) left on store floor blocking dispensary access.', severity: 'High' },
          { timestamp: '01:20', observation: 'Backroom corridor width estimated at ~0.7m; below 1m clearance standard.', severity: 'Medium' },
        ],
        checklist_items: [
          'Move all supplier cartons off the floor to designated shelving within 1 hour',
          'Clear backroom corridor to minimum 1m clearance',
          'Label "clear zone" floor markings in backroom',
        ]
      },
      {
        id: 'POP_MARKETING',
        name: 'POP & Marketing Compliance',
        score: 82,
        status: 'PASS',
        findings: [
          { timestamp: '00:08', observation: 'One promotional poster (Aug 2026 campaign) still displayed; campaign has ended.', severity: 'Medium' },
        ],
        checklist_items: [
          'Remove expired August 2026 promotional poster immediately',
          'Replace with current September campaign POP material',
        ]
      }
    ],
    top_priority_actions: [
      '🔴 URGENT: Remove expired medicines from dispensary cabinet (safety & compliance)',
      '🔴 URGENT: Clear supplier carton blocking dispensary corridor (fire safety)',
      '🟡 Clean compounding area surfaces before next patient service',
    ],
    whatsapp_summary: `📋 *5S Audit – ${branchName} (${today})*\n\nOverall Score: *74/100* ⚠️ ATTENTION REQUIRED\n\n🔴 Urgent: Expired stock in dispensary cabinet + corridor blocked by supplier carton\n🟡 Attention: Compounding area needs cleaning; expired POP poster to remove\n✅ Shelving & merchandising generally good\n\nPlease action priority items before closing today.`
  };

  renderAuditReport(mockReport);
}

// ─── RENDER AUDIT REPORT ──────────────────────────────────────────────────────
function renderAuditReport(report) {
  const container = document.getElementById('auditReportContainer');
  if (!container) return;
  container.classList.remove('hidden');

  // Overall score gauge
  const score    = Math.max(0, Math.min(100, report.overall_score || 0));
  const scoreCol = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const dashArr  = 2 * Math.PI * 40;
  const dashOff  = dashArr * (1 - score / 100);

  const gaugeEl = document.getElementById('auditGauge');
  if (gaugeEl) {
    gaugeEl.innerHTML = `
      <svg viewBox="0 0 100 100" class="w-36 h-36 mx-auto">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="10"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="${scoreCol}" stroke-width="10"
          stroke-dasharray="${dashArr.toFixed(2)}" stroke-dashoffset="${dashOff.toFixed(2)}"
          stroke-linecap="round" transform="rotate(-90 50 50)"
          style="transition: stroke-dashoffset 1.2s ease;"/>
        <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
          font-size="20" font-weight="bold" fill="${scoreCol}">${score}</text>
        <text x="50" y="64" text-anchor="middle" font-size="8" fill="#6b7280">/ 100</text>
      </svg>
      <p class="text-center text-sm font-semibold mt-1" style="color:${scoreCol}">
        ${score >= 80 ? '✅ PASS' : score >= 60 ? '⚠️ ATTENTION' : '❌ FAIL'}
      </p>`;
  }

  // Score meta
  setAuditText('auditBranch',    report.branch_observed || '—');
  setAuditText('auditDate',      report.audit_date       || '—');
  setAuditText('auditScoreText', `${score} / 100`);

  // Category cards
  const catsEl = document.getElementById('auditCategoryCards');
  if (catsEl && report.categories) {
    catsEl.innerHTML = report.categories.map(cat => {
      const catCol = cat.status === 'PASS' ? 'border-green-400 bg-green-50'
                   : cat.status === 'FAIL' ? 'border-red-400 bg-red-50'
                   : 'border-amber-400 bg-amber-50';
      const catBadge = cat.status === 'PASS' ? 'bg-green-100 text-green-700'
                     : cat.status === 'FAIL' ? 'bg-red-100 text-red-700'
                     : 'bg-amber-100 text-amber-700';
      return `<div class="border-l-4 rounded-lg p-4 ${catCol}">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-semibold text-sm text-gray-800">${escHtml(cat.name)}</h4>
          <span class="text-xs font-bold px-2 py-0.5 rounded ${catBadge}">${cat.score}/100 · ${cat.status}</span>
        </div>
        ${cat.findings?.length ? `<ul class="space-y-1 mb-2">
          ${cat.findings.map(f => `<li class="text-xs flex gap-2">
            <span class="font-mono text-gray-400 shrink-0">${escHtml(f.timestamp)}</span>
            <span class="${f.severity==='High'?'text-red-700':f.severity==='Medium'?'text-amber-700':'text-gray-700'}">${escHtml(f.observation)}</span>
            <span class="shrink-0 text-xs italic text-gray-400">(${f.severity})</span>
          </li>`).join('')}
        </ul>` : ''}
      </div>`;
    }).join('');
  }

  // Findings table
  const findingsEl = document.getElementById('auditFindingsBody');
  if (findingsEl && report.categories) {
    const allFindings = [];
    report.categories.forEach(cat => {
      (cat.findings || []).forEach(f => allFindings.push({ ...f, category: cat.name }));
    });
    findingsEl.innerHTML = allFindings.map((f, i) => {
      const sevClass = f.severity === 'High' ? 'bg-red-100 text-red-700'
                     : f.severity === 'Medium' ? 'bg-amber-100 text-amber-700'
                     : 'bg-gray-100 text-gray-600';
      return `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100">
        <td class="px-3 py-2 text-xs font-mono">${escHtml(f.timestamp)}</td>
        <td class="px-3 py-2 text-xs text-gray-600">${escHtml(f.category)}</td>
        <td class="px-3 py-2 text-xs">${escHtml(f.observation)}</td>
        <td class="px-3 py-2 text-xs text-center">
          <span class="px-2 py-0.5 rounded text-xs font-semibold ${sevClass}">${f.severity}</span>
        </td>
      </tr>`;
    }).join('');
  }

  // Checklist
  auditChecklistState = {};
  const checklistEl = document.getElementById('auditChecklist');
  if (checklistEl && report.categories) {
    let idx = 0;
    checklistEl.innerHTML = report.categories.map(cat => {
      if (!cat.checklist_items?.length) return '';
      return `<div class="mb-4">
        <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">${escHtml(cat.name)}</h5>
        <ul class="space-y-2">
          ${cat.checklist_items.map(item => {
            const id = `chk_${idx++}`;
            auditChecklistState[id] = false;
            return `<li class="flex items-start gap-2">
              <input type="checkbox" id="${id}" class="mt-0.5 accent-blue-600" onchange="toggleChecklist('${id}', this.checked)">
              <label for="${id}" id="lbl_${id}" class="text-sm text-gray-700 cursor-pointer">${escHtml(item)}</label>
            </li>`;
          }).join('')}
        </ul>
      </div>`;
    }).join('');
  }

  // Priority actions
  const priorityEl = document.getElementById('auditPriorityActions');
  if (priorityEl && report.top_priority_actions) {
    priorityEl.innerHTML = `<ul class="space-y-2">
      ${report.top_priority_actions.map(a => `<li class="flex gap-2 text-sm text-gray-800"><span class="shrink-0">→</span>${escHtml(a)}</li>`).join('')}
    </ul>`;
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
