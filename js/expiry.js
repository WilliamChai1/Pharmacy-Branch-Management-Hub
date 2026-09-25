// js/expiry.js — Module 5: Stock Expiry Tracker & OCR Extraction Engine
'use strict';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const PMG_EXPIRY_API_URL = 'https://script.google.com/macros/s/AKfycbyp0uv8uw2ckUJ9eoq16o10Z0v-4c-ToQpuSwLXXwHpW9dnmw1OVll9gzhCmdwFaJIBTA/exec';
const EXPIRY_STORAGE_KEY = 'pmg_stock_expiry_data';
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ─── DUAL-TIER GEMINI AI CONFIGURATION ───────────────────────────────────────
// Primary: gemini-3.5-flash-lite (fast, cost-efficient, specialized for invoice OCR)
// Secondary: gemini-3.5-flash (higher multi-category reasoning fallback)
const EXPIRY_OCR_PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const EXPIRY_OCR_SECONDARY_MODEL = 'gemini-3.5-flash';
const PMG_GLOBAL_FALLBACK_KEY    = 'AIzaSyBxKYPJWxi3ILfxPTlQFytzoXJvIZ72m4k';

// ─── STATE ────────────────────────────────────────────────────────────────────
let expiryItems = [];
let pendingOcrItems = [];
let activeExpiryFilter = {
  branch: '',
  horizon: '9months', // '9months', '12months', 'critical', 'all', 'cleared'
  search: ''
};
let expiryCurrentPage = 1;
const EXPIRY_PAGE_SIZE = 100;

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
function initExpiryModule() {
  loadLocalExpiryData();
  setupExpiryEventListeners();
  renderExpiryUI();
  // Fetch fresh data from Google Sheet in background
  syncExpiryFromSheets(false);
}

function loadLocalExpiryData() {
  try {
    const raw = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (raw) {
      expiryItems = JSON.parse(raw);
    }
    // If local storage is empty or only had small preliminary test items, seed with full Kota Sentosa master dataset
    if ((!expiryItems || expiryItems.length < 500) && Array.isArray(window.PMG_SEED_EXPIRY_DATA) && window.PMG_SEED_EXPIRY_DATA.length > 0) {
      console.log(`[PMG Expiry] Preloading ${window.PMG_SEED_EXPIRY_DATA.length} master seed records for Kota Sentosa...`);
      expiryItems = window.PMG_SEED_EXPIRY_DATA;
      saveLocalExpiryData();
    }
  } catch (e) {
    console.warn('[PMG Expiry] Error reading local expiry data:', e);
    if (Array.isArray(window.PMG_SEED_EXPIRY_DATA)) {
      expiryItems = window.PMG_SEED_EXPIRY_DATA;
    } else {
      expiryItems = [];
    }
  }
}

function saveLocalExpiryData() {
  try {
    localStorage.setItem(EXPIRY_STORAGE_KEY, JSON.stringify(expiryItems));
  } catch (e) {
    console.warn('[PMG Expiry] Error saving local expiry data:', e);
  }
}

// ─── DATE & HORIZON UTILITIES ────────────────────────────────────────────────
/**
 * Parses dates formatted as DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD.
 * Auto-corrects 2-digit years and common inverted invoice OCR dates.
 */
const MONTH_NAMES_MAP = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, september: 9, sept: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12
};

function parseExpiryDate(dateVal) {
  if (!dateVal || String(dateVal).trim() === '' || String(dateVal).toUpperCase() === 'N/A') return null;

  if (dateVal instanceof Date) {
    const d = new Date(dateVal.getTime());
    if (d.getFullYear() < 2000) d.setFullYear(d.getFullYear() + 100);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string' && (dateVal.includes('GMT') || dateVal.includes('Standard Time') || dateVal.includes('UTC') || (dateVal.includes('T') && dateVal.includes('-')))) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() < 2000) d.setFullYear(d.getFullYear() + 100);
      return d;
    }
  }

  let str = String(dateVal).trim();
  str = str.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
  str = str.replace(/[-.]/g, '/');
  const parts = str.split('/');

  if (parts.length === 3) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim();
    const p2 = parts[2].trim();

    let d, m, y;
    if (p1.toLowerCase() in MONTH_NAMES_MAP) {
      d = parseInt(p0, 10);
      m = MONTH_NAMES_MAP[p1.toLowerCase()];
      y = parseInt(p2, 10);
    } else if (p0.toLowerCase() in MONTH_NAMES_MAP) {
      m = MONTH_NAMES_MAP[p0.toLowerCase()];
      d = parseInt(p1, 10);
      y = parseInt(p2, 10);
    } else {
      d = parseInt(p0, 10);
      m = parseInt(p1, 10);
      y = parseInt(p2, 10);
    }

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;

    // Handle 4-digit year at start (YYYY/MM/DD)
    if (d > 1000) {
      const temp = d; d = y; y = temp;
    }

    // Auto-fix inverted dates (e.g. 28/02/2004 from invoice format 04-02-28)
    if (y <= 2025 && d >= 26 && d <= 35) {
      const correctedYear = 2000 + d;
      const correctedDay = (y >= 2001 && y <= 2025) ? (y - 2000) : 1;
      d = correctedDay;
      y = correctedYear;
    } else if (y < 100) {
      y += 2000;
    }

    const dateObj = new Date(y, m - 1, d);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  } else if (parts.length === 2) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim();
    let m, y;
    if (p0.toLowerCase() in MONTH_NAMES_MAP) {
      m = MONTH_NAMES_MAP[p0.toLowerCase()];
      y = parseInt(p1, 10);
    } else {
      m = parseInt(p0, 10);
      y = parseInt(p1, 10);
    }
    if (y < 100) y += 2000;
    const dateObj = new Date(y, m, 0); // Last day of month
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  return null;
}

function formatExpiryDateDisplay(dateVal) {
  const d = parseExpiryDate(dateVal);
  if (!d) return String(dateVal || 'N/A');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${month}/${yr}`;
}

function getExpiryMonthYearKey(dateVal) {
  const d = parseExpiryDate(dateVal);
  if (!d) return 'UNSCHEDULED';
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 0 && m <= 11) {
    return `${MONTH_NAMES[m]} ${y}`;
  }
  return 'UNSCHEDULED';
}

function calculateExpiryHorizon(dateVal) {
  const d = parseExpiryDate(dateVal);
  if (!d) {
    return { monthsLeft: 999, daysLeft: 9999, label: 'Unknown', color: 'gray', level: 'safe' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const monthsLeft = +(daysLeft / 30.4375).toFixed(1);

  if (daysLeft < 0) {
    return { monthsLeft, daysLeft, label: 'EXPIRED', color: 'rose', level: 'expired' };
  } else if (monthsLeft < 3) {
    return { monthsLeft, daysLeft, label: `< 3 Mos (${daysLeft}d)`, color: 'red', level: 'critical' };
  } else if (monthsLeft < 6) {
    return { monthsLeft, daysLeft, label: `3-6 Mos (${Math.round(monthsLeft)}m)`, color: 'amber', level: 'urgent' };
  } else if (monthsLeft <= 9) {
    return { monthsLeft, daysLeft, label: `6-9 Mos (${Math.round(monthsLeft)}m)`, color: 'yellow', level: 'kpi' };
  } else if (monthsLeft <= 12) {
    return { monthsLeft, daysLeft, label: `9-12 Mos (${Math.round(monthsLeft)}m)`, color: 'blue', level: 'monitor' };
  } else {
    return { monthsLeft, daysLeft, label: `> 12 Mos (${Math.round(monthsLeft)}m)`, color: 'emerald', level: 'safe' };
  }
}

// ─── GOOGLE SHEETS API SYNC ──────────────────────────────────────────────────
/**
 * Fetches all stock expiry items from the user's Google Sheet Web App.
 */
async function syncExpiryFromSheets(showPrompt = true) {
  const btn = document.getElementById('expirySyncBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin text-sm mr-1.5"></i>Syncing...`;
  }

  try {
    const url = `${PMG_EXPIRY_API_URL}?branch=all`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);

    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      const isDummyOnly = data.items.length > 0 && data.items.every(it => String(it.batchNumber || '').startsWith('TEST-'));
      if (!isDummyOnly && (data.items.length >= expiryItems.length || expiryItems.length === 0)) {
        expiryItems = data.items.map((it, idx) => ({
          ...it,
          rowId: it.rowId || (idx + 2),
          quantity: parseFloat(it.quantity) || 0,
          status: it.status || 'Active'
        }));
        saveLocalExpiryData();
        renderExpiryUI();
        if (showPrompt) {
          showExpiryToast(`✅ Synced ${expiryItems.length} items live from Google Sheets!`);
        }
      } else if (showPrompt) {
        showExpiryToast(`✅ Local database active with ${expiryItems.length} items.`);
      }
    } else {
      if (showPrompt) showExpiryToast(`⚠️ Sync failed: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.warn('[PMG Expiry] Sync error:', err);
    if (showPrompt) showExpiryToast(`⚠️ Could not connect to Google Sheets (using local cache of ${expiryItems.length} items).`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-arrows-rotate text-sm mr-1.5"></i>Sync Sheet`;
    }
  }
}

/**
 * Pushes updated quantity or clearance status to Google Sheets.
 */
async function pushExpiryUpdateToSheets(rowId, quantity, status) {
  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const payload = {
      action: status === 'Cleared' ? 'mark_cleared' : 'update_qty',
      rowId: rowId,
      quantity: quantity,
      status: status,
      updatedBy: session?.displayName || 'Pharmacist'
    };

    await fetch(PMG_EXPIRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    console.log(`[PMG Expiry] ✅ Update pushed for row ${rowId}: Qty=${quantity}, Status=${status}`);
  } catch (err) {
    console.warn('[PMG Expiry] Update push failed:', err);
  }
}

/**
 * Batch-inserts newly extracted OCR invoice items into Google Sheets.
 */
async function pushBatchExpiryToSheets(items) {
  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const payload = {
      action: 'batch_insert',
      items: items,
      updatedBy: session?.displayName || 'Pharmacist'
    };

    const res = await fetch(PMG_EXPIRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    return data && data.success;
  } catch (err) {
    console.warn('[PMG Expiry] Batch insert failed:', err);
    return false;
  }
}

function cleanNumericFloatString(val) {
  if (val === null || val === undefined) return 'N/A';
  let s = String(val).trim();
  if (s.endsWith('.0') && /^\d+$/.test(s.slice(0, -2))) {
    s = s.slice(0, -2);
  }
  return s || 'N/A';
}

// ─── GEMINI OCR INVOICE EXTRACTION ──────────────────────────────────────────
/**
 * Processes a PDF invoice file using Gemini Multimodal Vision API directly in the browser.
 */
async function handleInvoicePdfExtraction(file, branch) {
  const statusEl = document.getElementById('expiryOcrStatus');
  const spinnerEl = document.getElementById('expiryOcrSpinner');
  if (statusEl) statusEl.textContent = `Reading & converting ${file.name}…`;
  if (spinnerEl) spinnerEl.classList.remove('hidden');

  try {
    const apiKey = (localStorage.getItem('pmg_gemini_key') || '').trim() || PMG_GLOBAL_FALLBACK_KEY;
    const base64Data = await readFileAsBase64(file);

    if (statusEl) statusEl.textContent = `Analyzing invoice layout & extracting line items via Gemini Multimodal AI…`;

    const prompt = `
You are an expert pharmaceutical invoice parser for Malaysian pharmacy chains (e.g. PMG Pharmacy).
Analyze this invoice document carefully.
Identify:
1. Supplier Name (e.g. DKSH, Zuellig Pharma, Sung Hoe, SSJ, Pahang Pharmacy, Apex, TLS, etc.)
2. Document Date (e.g. 2026)
3. Table of Line Items (products, medicines, OTC items)

Extract all inventory line items into a JSON array of objects.
CRITICAL EXTRACTION RULES:
- "batchNumber": Look for Batch / Lot / Lot No. (e.g. "2605447", "SE07", "BT-8890"). If printed alongside expiry date (e.g. "SE07 23/05/26"), correctly isolate the batch number. If none, output "N/A".
- "itemCode": Internal product code or SKU (typically 4-8 digits like "119356", "105675" or alphanumeric). If not found, output "N/A".
- "itemDescription": Full product or medicine name with strength/form if shown (e.g., "VASELINE BABY PROTECTING JELLY 50ML", "MAGNOMINT TAB 10'S").
- "expiryDate": The product's shelf-life expiration date, strictly formatted as "DD/MM/YYYY":
    * IMPORTANT: Expiration dates are ALWAYS in the future relative to the invoice date (typically 2026 to 2035). They are NEVER in the past or year 2000.
    * Malaysian pharmaceutical invoices write dates in DD-MM-YY (Day-Month-Year) or DD/MM/YYYY.
    * If 2-digit year (e.g., "04-02-28"), "28" is the YEAR 2028, "02" is February, "04" is the day -> output "04/02/2028".
    * If Month/Year format (e.g., "10/28" or "OCT-28"), output the last day of the month -> "31/10/2028".
    * Do NOT confuse Invoice Date, Order Date, or Manufacturing Date (MFG/DOM) with Expiry Date (EXP/LUAR TARIKH).
- "quantity": Billed or delivered quantity as a positive number.
Return ONLY a valid JSON array of objects. No markdown formatting, no explanations.
`;

    const modelsToTry = [EXPIRY_OCR_PRIMARY_MODEL, EXPIRY_OCR_SECONDARY_MODEL];
    let items = null;
    let successfulModel = '';
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        if (statusEl) statusEl.textContent = `Analyzing invoice with ${model}…`;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type || 'application/pdf',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        };

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (resData.error || !resData.candidates || resData.candidates.length === 0) {
          throw new Error(resData.error?.message || `Model ${model} returned empty response.`);
        }

        const rawText = resData.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed;
          successfulModel = model;
          break;
        }
      } catch (err) {
        console.warn(`[PMG Expiry] ${model} attempt failed:`, err);
        lastError = err;
      }
    }

    if (!items || items.length === 0) {
      throw lastError || new Error('No stock items were identified in this document.');
    }

    // Attach metadata and run heuristic validation
    pendingOcrItems = items.map((it, idx) => {
      const rawExp = it.expiryDate || '';
      const parsedExp = parseExpiryDate(rawExp);
      const formattedExp = formatExpiryDateDisplay(parsedExp || rawExp);

      let isAutoCorrected = false;
      let isShortDated = false;
      let isAmbiguous = false;

      if (parsedExp) {
        const horizon = calculateExpiryHorizon(parsedExp);
        if (horizon.monthsLeft < 6) isShortDated = true;
        const parts = String(rawExp).replace(/[-.]/g, '/').split('/');
        if (parts.length === 3 && parseInt(parts[2], 10) < 100 && parseInt(parts[0], 10) >= 26) {
          isAutoCorrected = true;
        }
      } else {
        isAmbiguous = true;
      }

      return {
        tempId: `pending_${Date.now()}_${idx}`,
        branch: branch || 'Kota Sentosa',
        batchNumber: cleanNumericFloatString(it.batchNumber),
        itemCode: cleanNumericFloatString(it.itemCode),
        itemDescription: it.itemDescription || it.itemName || 'Item',
        expiryDate: formattedExp,
        quantity: Math.max(1, parseFloat(it.quantity) || 1),
        sourceFile: file.name,
        status: 'Active',
        selected: true,
        autoCorrected: isAutoCorrected,
        isShortDated: isShortDated,
        isAmbiguous: isAmbiguous
      };
    });

    if (spinnerEl) spinnerEl.classList.add('hidden');
    if (statusEl) statusEl.textContent = `✓ Extracted ${pendingOcrItems.length} items from ${file.name} (via ${successfulModel})`;

    openOcrReviewModal(file.name);
  } catch (err) {
    console.error('[PMG Expiry] OCR Extraction Error:', err);
    if (spinnerEl) spinnerEl.classList.add('hidden');
    if (statusEl) {
      statusEl.textContent = `Extraction failed: ${err.message}`;
      statusEl.className = 'text-xs text-rose-600 font-semibold';
    }
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── REVIEW & COMMIT OCR ITEMS ───────────────────────────────────────────────
function openOcrReviewModal(fileName) {
  const modal = document.getElementById('expiryOcrModal');
  if (!modal) return;

  const titleEl = document.getElementById('expiryOcrFileName');
  if (titleEl) titleEl.textContent = fileName;

  renderOcrReviewRows();
  modal.classList.remove('hidden');
}

function closeOcrReviewModal() {
  const modal = document.getElementById('expiryOcrModal');
  if (modal) modal.classList.add('hidden');
  pendingOcrItems = [];
}

function renderOcrReviewRows() {
  const tbody = document.getElementById('expiryOcrTbody');
  if (!tbody) return;

  if (pendingOcrItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">No items available.</td></tr>`;
    return;
  }

  tbody.innerHTML = pendingOcrItems.map((it, idx) => `
    <tr class="border-b hover:bg-blue-50/40 text-xs sm:text-sm">
      <td class="p-2.5 text-center">
        <input type="checkbox" ${it.selected ? 'checked' : ''} onchange="togglePendingItemSelect(${idx}, this.checked)" class="rounded text-blue-600">
      </td>
      <td class="p-2.5 font-mono text-gray-500 font-bold">
        <input type="text" value="${escHtml(it.itemCode)}" onchange="updatePendingItemField(${idx}, 'itemCode', this.value)" class="w-20 px-1.5 py-1 border rounded font-mono">
      </td>
      <td class="p-2.5">
        <input type="text" value="${escHtml(it.itemDescription)}" onchange="updatePendingItemField(${idx}, 'itemDescription', this.value)" class="w-full px-2 py-1 border rounded">
      </td>
      <td class="p-2.5 font-mono">
        <input type="text" value="${escHtml(it.batchNumber)}" onchange="updatePendingItemField(${idx}, 'batchNumber', this.value)" class="w-24 px-1.5 py-1 border rounded font-mono">
      </td>
      <td class="p-2.5 text-center">
        <input type="text" value="${escHtml(it.expiryDate)}" onchange="updatePendingItemField(${idx}, 'expiryDate', this.value)" class="w-28 px-1.5 py-1 border ${it.isShortDated || it.isAmbiguous ? 'border-amber-400 bg-amber-50/60' : 'border-blue-200'} rounded text-center font-bold text-blue-700 font-mono text-xs">
        <div class="flex items-center justify-center gap-1 mt-1">
          ${it.autoCorrected ? `
            <span class="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5" title="Inverted format auto-corrected (Year & Day resolved)">
              <i class="fa-solid fa-wand-magic-sparkles text-[8px]"></i> Auto-Fixed
            </span>
          ` : it.isShortDated ? `
            <span class="text-[9px] text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5" title="Short-dated stock (< 6 months)">
              <i class="fa-solid fa-triangle-exclamation text-[8px]"></i> Short-Dated
            </span>
          ` : `
            <span class="text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
              <i class="fa-solid fa-check text-[8px]"></i> AI Verified
            </span>
          `}
        </div>
      </td>
      <td class="p-2.5 text-center">
        <input type="number" min="1" value="${it.quantity}" onchange="updatePendingItemField(${idx}, 'quantity', this.value)" class="w-16 px-1.5 py-1 border rounded text-center font-bold">
      </td>
      <td class="p-2.5 text-center">
        <button onclick="removePendingOcrItem(${idx})" class="text-rose-500 hover:text-rose-700 p-1" title="Remove item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function togglePendingItemSelect(idx, checked) {
  if (pendingOcrItems[idx]) pendingOcrItems[idx].selected = checked;
}

function updatePendingItemField(idx, field, value) {
  if (pendingOcrItems[idx]) {
    if (field === 'quantity') {
      pendingOcrItems[idx][field] = parseFloat(value) || 0;
    } else {
      pendingOcrItems[idx][field] = value.trim();
    }
  }
}

function removePendingOcrItem(idx) {
  pendingOcrItems.splice(idx, 1);
  renderOcrReviewRows();
}

async function confirmOcrBatchInsert() {
  const selectedItems = pendingOcrItems.filter(it => it.selected);
  if (selectedItems.length === 0) {
    alert('Please select at least one item to save.');
    return;
  }

  const branchSelect = document.getElementById('expiryOcrBranchSelect');
  const targetBranch = branchSelect ? branchSelect.value : 'Kota Sentosa';

  selectedItems.forEach(it => {
    it.branch = targetBranch;
  });

  const commitBtn = document.getElementById('expiryOcrCommitBtn');
  if (commitBtn) {
    commitBtn.disabled = true;
    commitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Saving to Google Sheet...`;
  }

  // 1. Append locally
  expiryItems.unshift(...selectedItems);
  saveLocalExpiryData();
  renderExpiryUI();

  // 2. Push to Google Sheet
  const ok = await pushBatchExpiryToSheets(selectedItems);

  if (commitBtn) {
    commitBtn.disabled = false;
    commitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-1.5"></i>Confirm & Save to Google Sheet`;
  }

  closeOcrReviewModal();
  showExpiryToast(ok ? `✅ Saved ${selectedItems.length} items to Google Sheet (${targetBranch})!` : `Saved locally (Sheet update in progress).`);
}

// ─── QUANTITY EDITING & CLEARANCE ───────────────────────────────────────────
function updateExpiryItemQuantity(rowId, newQty) {
  const item = expiryItems.find(it => it.rowId === rowId);
  if (!item) return;

  const val = parseFloat(newQty);
  if (isNaN(val) || val < 0) return;

  item.quantity = val;
  if (val === 0) {
    item.status = 'Cleared';
  } else if (item.status === 'Cleared' && val > 0) {
    item.status = 'Active';
  }

  saveLocalExpiryData();
  renderExpiryUI();
  pushExpiryUpdateToSheets(rowId, item.quantity, item.status);
}

function markExpiryItemCleared(rowId) {
  const item = expiryItems.find(it => it.rowId === rowId);
  if (!item) return;

  item.status = 'Cleared';
  item.quantity = 0;
  saveLocalExpiryData();
  renderExpiryUI();
  pushExpiryUpdateToSheets(rowId, 0, 'Cleared');
  showExpiryToast(`✅ Marked ${item.itemDescription || item.itemCode} as Cleared!`);
}

function reactivateExpiryItem(rowId) {
  const item = expiryItems.find(it => it.rowId === rowId);
  if (!item) return;

  const qtyStr = prompt(`Enter restored quantity for ${item.itemDescription || item.itemCode}:`, '1');
  const qty = parseFloat(qtyStr);
  if (isNaN(qty) || qty <= 0) return;

  item.status = 'Active';
  item.quantity = qty;
  saveLocalExpiryData();
  renderExpiryUI();
  pushExpiryUpdateToSheets(rowId, item.quantity, 'Active');
  showExpiryToast(`Restored item with quantity ${qty}.`);
}

// ─── FILTERING & UI RENDERING ────────────────────────────────────────────────
function filterExpiryItems() {
  return expiryItems.filter(it => {
    // 1. Branch filter
    if (activeExpiryFilter.branch && activeExpiryFilter.branch !== 'ALL') {
      const bNorm = normalizeBranchCode(it.branch);
      if (bNorm.toLowerCase() !== activeExpiryFilter.branch.toLowerCase()) return false;
    }

    // 2. Horizon / Status filter
    const horizon = calculateExpiryHorizon(it.expiryDate);
    const isCleared = it.status === 'Cleared' || it.quantity === 0;

    if (activeExpiryFilter.horizon === 'cleared') {
      if (!isCleared) return false;
    } else {
      // Non-cleared views
      if (isCleared) return false;
      if (activeExpiryFilter.horizon === '9months' && horizon.monthsLeft > 9) return false;
      if (activeExpiryFilter.horizon === '12months' && horizon.monthsLeft > 12) return false;
      if (activeExpiryFilter.horizon === 'critical' && horizon.monthsLeft >= 6) return false;
    }

    // 3. Search filter
    if (activeExpiryFilter.search) {
      const q = activeExpiryFilter.search.toLowerCase().trim();
      const code = String(it.itemCode || '').toLowerCase();
      const desc = String(it.itemDescription || '').toLowerCase();
      const batch = String(it.batchNumber || '').toLowerCase();
      if (!code.includes(q) && !desc.includes(q) && !batch.includes(q)) return false;
    }

    return true;
  });
}

function renderExpiryUI() {
  renderExpiryKpis();
  renderExpiryTable();
}

function renderExpiryKpis() {
  let criticalCount = 0;
  let urgentCount = 0;
  let kpi9mCount = 0;
  let monitor12mCount = 0;
  let clearedCount = 0;

  const targetBranch = activeExpiryFilter.branch;

  expiryItems.forEach(it => {
    if (targetBranch && targetBranch !== 'ALL') {
      if (normalizeBranchCode(it.branch).toLowerCase() !== targetBranch.toLowerCase()) return;
    }

    if (it.status === 'Cleared' || it.quantity === 0) {
      clearedCount++;
      return;
    }

    const h = calculateExpiryHorizon(it.expiryDate);
    if (h.monthsLeft < 3) criticalCount++;
    else if (h.monthsLeft < 6) urgentCount++;
    else if (h.monthsLeft <= 9) kpi9mCount++;
    else if (h.monthsLeft <= 12) monitor12mCount++;
  });

  const total9mKpi = criticalCount + urgentCount + kpi9mCount;

  setText('expiryKpiCritical', criticalCount);
  setText('expiryKpiUrgent', urgentCount);
  setText('expiryKpi9m', total9mKpi);
  setText('expiryKpi12m', monitor12mCount);
  setText('expiryKpiCleared', clearedCount);
}

function renderExpiryTable() {
  const tbody = document.getElementById('expiryTableTbody');
  const countEl = document.getElementById('expiryFilteredCount');
  if (!tbody) return;

  const items = filterExpiryItems();
  if (countEl) countEl.textContent = `${items.length} items`;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-gray-400">
          <i class="fa-solid fa-box-open text-4xl mb-3 text-gray-300 block"></i>
          No expiry stock records found matching your filters.
          <p class="text-xs text-gray-400 mt-1">Upload a PDF invoice or click "+ Quick Add" to begin tracking.</p>
        </td>
      </tr>`;
    return;
  }

  const totalItems = items.length;
  const maxDisplay = expiryCurrentPage * EXPIRY_PAGE_SIZE;
  const displayedItems = items.slice(0, maxDisplay);

  const paginationCount = document.getElementById('expiryPaginationCount');
  const loadMoreBtn = document.getElementById('expiryLoadMoreBtn');
  if (paginationCount) {
    paginationCount.textContent = `Showing 1–${Math.min(totalItems, displayedItems.length)} of ${totalItems} items`;
  }
  if (loadMoreBtn) {
    if (totalItems > maxDisplay) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.innerHTML = `<i class="fa-solid fa-angles-down"></i> Load More (${Math.min(EXPIRY_PAGE_SIZE, totalItems - maxDisplay)} more)`;
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  tbody.innerHTML = displayedItems.map((it, idx) => {
    const h = calculateExpiryHorizon(it.expiryDate);
    const isCleared = it.status === 'Cleared' || it.quantity === 0;

    let badgeClass = 'bg-gray-100 text-gray-600';
    if (h.level === 'expired' || h.level === 'critical') badgeClass = 'bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse';
    else if (h.level === 'urgent') badgeClass = 'bg-amber-100 text-amber-800 font-bold border border-amber-200';
    else if (h.level === 'kpi') badgeClass = 'bg-yellow-100 text-yellow-800 font-bold border border-yellow-200';
    else if (h.level === 'monitor') badgeClass = 'bg-blue-100 text-blue-700 font-semibold';
    else if (h.level === 'safe') badgeClass = 'bg-emerald-100 text-emerald-700';

    return `
      <tr class="border-b hover:bg-slate-50/80 transition ${isCleared ? 'opacity-50 bg-gray-50' : ''}">
        <td class="p-3 text-xs font-bold text-gray-700 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border text-slate-700">
            <i class="fa-solid fa-shop text-[10px] text-blue-600"></i> ${escHtml(it.branch)}
          </span>
        </td>
        <td class="p-3 font-mono text-xs font-extrabold text-blue-900 whitespace-nowrap">
          ${escHtml(it.itemCode)}
        </td>
        <td class="p-3 text-xs font-semibold text-gray-800 ${isCleared ? 'line-through text-gray-400' : ''}">
          ${escHtml(it.itemDescription)}
          <div class="text-[10px] text-gray-400 font-mono mt-0.5">Batch: ${escHtml(it.batchNumber || 'N/A')} · File: ${escHtml(it.sourceFile || 'Direct')}</div>
        </td>
        <td class="p-3 text-xs font-bold text-center whitespace-nowrap">
          <span class="font-mono text-gray-900">${formatExpiryDateDisplay(it.expiryDate)}</span>
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          <span class="text-xs px-2.5 py-1 rounded-full ${badgeClass}">
            ${h.label}
          </span>
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          ${isCleared ? `
            <span class="text-xs font-bold text-gray-400 font-mono">0</span>
          ` : `
            <input type="number" min="0" value="${it.quantity}"
              onchange="updateExpiryItemQuantity(${it.rowId}, this.value)"
              class="w-16 px-2 py-1 text-center font-bold text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 bg-white">
          `}
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          ${isCleared ? `
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <i class="fa-solid fa-circle-check mr-1"></i>Cleared
            </span>
          ` : `
            <span class="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Active
            </span>
          `}
        </td>
        <td class="p-3 text-center whitespace-nowrap text-xs">
          ${isCleared ? `
            <button onclick="reactivateExpiryItem(${it.rowId})" class="text-blue-600 hover:underline font-semibold text-xs">
              <i class="fa-solid fa-rotate-left mr-1"></i>Restore
            </button>
          ` : `
            <button onclick="markExpiryItemCleared(${it.rowId})"
              class="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition"
              title="Click when stock is fully sold or cleared">
              <i class="fa-solid fa-check mr-1 text-emerald-600"></i>Done Clear
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function loadMoreExpiryRows() {
  expiryCurrentPage++;
  renderExpiryTable();
}

// ─── EXPORT TO EXCEL (MATCHING PICTURE 3 & HQ KPI 9-MONTH FORMAT) ────────────
/**
 * Generates a styled, multi-tab Excel workbook identical to Photo 3 using ExcelJS.
 * Each month has its own tab (AUG 2026, SEP 2026, etc.), ordered chronologically.
 */
async function exportHqExpiryExcel() {
  const btn = document.getElementById('expiryExportBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generating Excel...`;
  }

  try {
    if (typeof ExcelJS === 'undefined') {
      alert('ExcelJS engine not yet loaded. Please wait a moment and try again.');
      return;
    }

    const branch = activeExpiryFilter.branch || 'Kota Sentosa';
    const activeOnly = expiryItems.filter(it => it.status !== 'Cleared' && it.quantity > 0);

    // Filter by branch if specific
    const branchItems = (branch === 'ALL') ? activeOnly : activeOnly.filter(it => normalizeBranchCode(it.branch).toLowerCase() === branch.toLowerCase());

    if (branchItems.length === 0) {
      alert(`No active stock expiry records to export for ${branch}.`);
      return;
    }

    // Group items by Month/Year tab
    const monthGroups = {};
    branchItems.forEach(it => {
      const tabName = getExpiryMonthYearKey(it.expiryDate);
      if (!monthGroups[tabName]) monthGroups[tabName] = [];
      monthGroups[tabName].push(it);
    });

    // Sort month tabs chronologically
    const sortedTabs = Object.keys(monthGroups).sort((a, b) => {
      const pA = a.split(' ');
      const pB = b.split(' ');
      if (pA.length === 2 && pB.length === 2) {
        const yA = parseInt(pA[1], 10);
        const yB = parseInt(pB[1], 10);
        const mA = MONTH_NAMES.indexOf(pA[0]);
        const mB = MONTH_NAMES.indexOf(pB[0]);
        return (yA * 100 + mA) - (yB * 100 + mB);
      }
      return a.localeCompare(b);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PMG Pharmacy Management Hub';
    workbook.created = new Date();

    // ── Tab 1: Sheet1 (Master staging summary matching Photo 3) ──────────────
    const summarySheet = workbook.addWorksheet('Sheet1', { views: [{ showGridLines: true }] });
    summarySheet.columns = [
      { header: 'Batch number', key: 'batch', width: 16 },
      { header: 'Item code', key: 'code', width: 16 },
      { header: 'Item description', key: 'desc', width: 38 },
      { header: 'Expiry date', key: 'expiry', width: 16 },
      { header: 'Quantity', key: 'qty', width: 14 },
      { header: 'Source File', key: 'file', width: 32 },
      { header: 'Branch', key: 'branch', width: 16 },
    ];
    styleExcelHeaderRow(summarySheet.getRow(1));

    branchItems.forEach(it => {
      const row = summarySheet.addRow({
        batch: it.batchNumber || 'N/A',
        code: it.itemCode || 'N/A',
        desc: it.itemDescription || '',
        expiry: formatExpiryDateDisplay(it.expiryDate),
        qty: it.quantity || 0,
        file: it.sourceFile || 'Invoice Upload',
        branch: it.branch || branch
      });
      styleExcelDataRow(row);
    });

    // ── Subsequent Tabs: Chronological Month Tabs (AUG 2026, SEP 2026...) ───
    sortedTabs.forEach(tabName => {
      const itemsInMonth = monthGroups[tabName];
      const sheet = workbook.addWorksheet(tabName, { views: [{ showGridLines: true }] });
      sheet.columns = [
        { header: 'Batch number', key: 'batch', width: 16 },
        { header: 'Item code', key: 'code', width: 16 },
        { header: 'Item description', key: 'desc', width: 38 },
        { header: 'Expiry date', key: 'expiry', width: 16 },
        { header: 'Quantity', key: 'qty', width: 14 },
        { header: 'Source File', key: 'file', width: 32 },
        { header: 'Branch', key: 'branch', width: 16 },
      ];
      styleExcelHeaderRow(sheet.getRow(1));

      itemsInMonth.forEach(it => {
        const row = sheet.addRow({
          batch: it.batchNumber || 'N/A',
          code: it.itemCode || 'N/A',
          desc: it.itemDescription || '',
          expiry: formatExpiryDateDisplay(it.expiryDate),
          qty: it.quantity || 0,
          file: it.sourceFile || 'Invoice Upload',
          branch: it.branch || branch
        });
        styleExcelDataRow(row);
      });
    });

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `PMG_HQ_Expiry_KPI_Report_${cleanFileName(branch)}_${dateStr}.xlsx`);

    showExpiryToast(`✅ Exported HQ Expiry Report with ${sortedTabs.length} monthly tabs!`);
  } catch (err) {
    console.error('[PMG Expiry] Excel export error:', err);
    alert('Failed to generate Excel report: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-file-excel mr-1.5 text-emerald-300"></i>Export HQ KPI Report (Excel)`;
    }
  }
}

function styleExcelHeaderRow(row) {
  row.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // PMG Navy
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 24;
}

function styleExcelDataRow(row) {
  row.font = { name: 'Arial', size: 9.5 };
  row.alignment = { vertical: 'middle' };
  row.getCell(4).alignment = { horizontal: 'center' };
  row.getCell(5).alignment = { horizontal: 'right' };
}

// ─── REPLENISHMENT ENGINE CROSS-CHECK INTEGRATION ────────────────────────────
/**
 * Exposes active near-expiry stock (within maxMonths) across all branches
 * for Module 1 (Inventory Replenishment Engine) to cross-reference against ordering CSVs.
 */
function getShortDatedStockForReplenishment(maxMonths = 12) {
  const mapByCode = {};

  expiryItems.forEach(it => {
    if (it.status === 'Cleared' || it.quantity <= 0) return;
    const h = calculateExpiryHorizon(it.expiryDate);
    if (h.monthsLeft > maxMonths) return;

    const code = String(it.itemCode || '').trim().toUpperCase();
    if (!code || code === 'N/A') return;

    if (!mapByCode[code]) mapByCode[code] = [];
    mapByCode[code].push({
      branch: it.branch,
      batchNumber: it.batchNumber,
      expiryDate: formatExpiryDateDisplay(it.expiryDate),
      quantity: it.quantity,
      monthsLeft: h.monthsLeft,
      horizonLabel: h.label,
      level: h.level
    });
  });

  return mapByCode;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
function setupExpiryEventListeners() {
  const branchSelect = document.getElementById('expiryBranchFilter');
  if (branchSelect) {
    branchSelect.addEventListener('change', e => {
      activeExpiryFilter.branch = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  const horizonSelect = document.getElementById('expiryHorizonFilter');
  if (horizonSelect) {
    horizonSelect.addEventListener('change', e => {
      activeExpiryFilter.horizon = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  const searchInput = document.getElementById('expirySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      activeExpiryFilter.search = e.target.value;
      expiryCurrentPage = 1;
      renderExpiryUI();
    });
  }

  // PDF Dropzone
  const dropZone = document.getElementById('expiryDropZone');
  const fileInput = document.getElementById('expiryFileInput');
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files.length) {
        const branch = document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
        handleInvoicePdfExtraction(e.target.files[0], branch);
      }
    });
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-blue-500', 'bg-blue-50/50'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-500', 'bg-blue-50/50'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
      if (e.dataTransfer.files.length) {
        const branch = document.getElementById('expiryBranchFilter')?.value || 'Kota Sentosa';
        handleInvoicePdfExtraction(e.dataTransfer.files[0], branch);
      }
    });
  }
}

// ─── TOAST NOTIFICATION ──────────────────────────────────────────────────────
function showExpiryToast(msg) {
  const toast = document.getElementById('expiryToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden', 'opacity-0');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 4000);
}

// ─── MANUAL QUICK ADD MODAL ──────────────────────────────────────────────────
function openQuickAddExpiryModal() {
  const modal = document.getElementById('expiryQuickAddModal');
  if (modal) modal.classList.remove('hidden');
}

function closeQuickAddExpiryModal() {
  const modal = document.getElementById('expiryQuickAddModal');
  if (modal) modal.classList.add('hidden');
}

async function handleQuickAddSubmit(e) {
  e.preventDefault();
  const branch = document.getElementById('qaBranch').value;
  const itemCode = document.getElementById('qaItemCode').value.trim();
  const itemDescription = document.getElementById('qaItemDesc').value.trim();
  const batchNumber = document.getElementById('qaBatch').value.trim() || 'N/A';
  const expiryDate = document.getElementById('qaExpiry').value.trim();
  const quantity = parseFloat(document.getElementById('qaQty').value) || 1;

  if (!itemCode || !itemDescription || !expiryDate) {
    alert('Please fill in Item Code, Description, and Expiry Date.');
    return;
  }

  const newItem = {
    rowId: expiryItems.length + 2,
    branch: branch,
    batchNumber: batchNumber,
    itemCode: itemCode,
    itemDescription: itemDescription,
    expiryDate: formatExpiryDateDisplay(expiryDate),
    quantity: quantity,
    sourceFile: 'Manual Quick Entry',
    status: 'Active'
  };

  expiryItems.unshift(newItem);
  saveLocalExpiryData();
  renderExpiryUI();

  // Push to Sheets
  await pushBatchExpiryToSheets([newItem]);

  closeQuickAddExpiryModal();
  document.getElementById('expiryQuickAddForm')?.reset();
  showExpiryToast(`✅ Added ${itemDescription} to Stock Expiry Tracker!`);
}

// ─── API KEY MANAGEMENT HELPER ───────────────────────────────────────────────
function promptUpdateGeminiKey() {
  const current = localStorage.getItem('pmg_gemini_key') || '';
  const newKey = prompt('🔑 Google Gemini API Key:\n(Leave blank to use the built-in system key)', current);
  if (newKey !== null) {
    const trimmed = newKey.trim();
    if (trimmed) {
      localStorage.setItem('pmg_gemini_key', trimmed);
      showExpiryToast('✅ Custom Gemini API key saved!');
    } else {
      localStorage.removeItem('pmg_gemini_key');
      showExpiryToast('✅ Using built-in default system Gemini API key.');
    }
  }
}
window.promptUpdateGeminiKey = promptUpdateGeminiKey;
