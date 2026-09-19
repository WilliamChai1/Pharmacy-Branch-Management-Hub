// js/roster.js — Module 2: Roster Matrix to Rymnet HRMS Converter
'use strict';

let rosterRawData     = [];
let rosterFlatRecords = [];

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initRoster() {
  const dropZone  = document.getElementById('rosterDropZone');
  const fileInput = document.getElementById('rosterInput');
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files.length) handleRosterFile(e.target.files[0]);
  });
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleRosterFile(e.dataTransfer.files[0]);
  });

  const dlBtn = document.getElementById('rosterDownloadBtn');
  if (dlBtn) dlBtn.addEventListener('click', downloadRymnetCSV);
}

// ─── FILE HANDLER ─────────────────────────────────────────────────────────────
function handleRosterFile(file) {
  const statusEl = document.getElementById('rosterStatus');
  if (statusEl) { statusEl.textContent = `Reading: ${file.name}…`; statusEl.className = 'text-blue-600 text-sm mt-2'; }

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    Papa.parse(file, {
      complete(results) { rosterRawData = results.data; processRoster(); },
      error(err) { if (statusEl) { statusEl.textContent = `CSV parse error: ${err.message}`; statusEl.className = 'text-red-600 text-sm mt-2'; } }
    });
  } else {
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        rosterRawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        processRoster();
      } catch(err) {
        if (statusEl) { statusEl.textContent = `XLSX parse error: ${err.message}`; statusEl.className = 'text-red-600 text-sm mt-2'; }
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

// ─── PROCESS ROSTER ───────────────────────────────────────────────────────────
function processRoster() {
  const statusEl  = document.getElementById('rosterStatus');
  const monthVal  = document.getElementById('rosterMonth')?.value || '';
  const branchVal = document.getElementById('rosterBranchCode')?.value?.trim() || 'KS01';

  if (!monthVal) {
    if (statusEl) { statusEl.textContent = '⚠ Please select the Month/Year before uploading.'; statusEl.className = 'text-amber-600 text-sm mt-2'; }
    return;
  }
  if (!rosterRawData || rosterRawData.length < 2) {
    if (statusEl) { statusEl.textContent = 'Error: file appears empty or has only 1 row.'; statusEl.className = 'text-red-600 text-sm mt-2'; }
    return;
  }

  // Row 0 = headers: first cell is the nickname column label, remaining = day numbers
  const headerRow  = rosterRawData[0];
  const dayNumbers = [];
  for (let c = 1; c < headerRow.length; c++) {
    const d = parseInt(String(headerRow[c]).trim(), 10);
    if (!isNaN(d) && d >= 1 && d <= 31) dayNumbers.push({ col: c, day: d });
  }

  if (dayNumbers.length === 0) {
    if (statusEl) { statusEl.textContent = 'Error: could not detect day columns (expected numbers 1–31 in header row).'; statusEl.className = 'text-red-600 text-sm mt-2'; }
    return;
  }

  const [yearStr, monthStr] = monthVal.split('-');
  const year  = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const maxDayInMonth = new Date(year, month, 0).getDate();

  rosterFlatRecords = [];
  const unmappedNicknames = new Set();

  for (let r = 1; r < rosterRawData.length; r++) {
    const row      = rosterRawData[r];
    const nickname = String(row[0] || '').trim();
    if (!nickname) continue;

    const staffObj = lookupStaff(nickname);
    if (!staffObj) unmappedNicknames.add(nickname);

    const empNo   = staffObj ? staffObj.empNo   : `UNMAPPED_${nickname}`;
    const empName = staffObj ? staffObj.empName : nickname;

    for (const { col, day } of dayNumbers) {
      if (day > maxDayInMonth) continue;
      const cellRaw   = String(row[col] || '').trim();
      if (!cellRaw) continue;
      const workDate  = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const shiftCode = resolveShiftCode(cellRaw);
      if (!shiftCode) continue;

      rosterFlatRecords.push({
        empNo, empName, nickname,
        isMapped: !!staffObj,
        workDate, shiftCode,
        rawCell: cellRaw,
      });
    }
  }

  renderRosterPreview(unmappedNicknames);

  if (statusEl) {
    const u = unmappedNicknames.size;
    statusEl.textContent = `✓ Generated ${rosterFlatRecords.length} schedule records.`
      + (u > 0 ? ` ⚠ ${u} unmapped nickname(s): ${[...unmappedNicknames].join(', ')}` : '');
    statusEl.className = u > 0 ? 'text-amber-600 text-sm mt-2 font-medium' : 'text-green-600 text-sm mt-2 font-medium';
  }

  const panel = document.getElementById('rosterResultPanel');
  if (panel) panel.classList.remove('hidden');
}

// ─── PREVIEW TABLE ────────────────────────────────────────────────────────────
function renderRosterPreview(unmappedSet) {
  const tbody   = document.getElementById('rosterPreviewBody');
  const summary = document.getElementById('rosterPreviewSummary');
  if (!tbody) return;

  const preview = rosterFlatRecords.slice(0, 15);

  tbody.innerHTML = preview.map(rec => {
    const rowBg = !rec.isMapped ? 'bg-amber-50' : '';
    const border = !rec.isMapped ? 'border-l-4 border-amber-400' : '';
    const empLabel = !rec.isMapped
      ? `<span class="text-amber-700 font-semibold font-mono text-xs" title="Nickname not in staff map">${escHtml(rec.empNo)}</span>`
      : `<span class="font-mono text-xs text-gray-700">${escHtml(rec.empNo)}</span>`;
    return `<tr class="border-b border-gray-100 ${rowBg} ${border}">
      <td class="px-3 py-2">${empLabel}</td>
      <td class="px-3 py-2 text-xs text-gray-700">${escHtml(rec.empName)}</td>
      <td class="px-3 py-2 text-xs text-gray-500">${escHtml(rec.nickname)}</td>
      <td class="px-3 py-2 text-xs font-mono">${escHtml(rec.workDate)}</td>
      <td class="px-3 py-2 text-xs">
        <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${shiftBadgeClass(rec.shiftCode)}">${escHtml(rec.shiftCode)}</span>
      </td>
      <td class="px-3 py-2 text-xs text-gray-400 italic">${escHtml(rec.rawCell)}</td>
    </tr>`;
  }).join('');

  if (preview.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400 text-sm">No records generated. Check your file format.</td></tr>';
  }

  if (summary) {
    summary.textContent = `Showing ${preview.length} of ${rosterFlatRecords.length} records`
      + (unmappedSet?.size > 0 ? ` · ${unmappedSet.size} unmapped nicknames highlighted in amber` : '');
  }
}

function shiftBadgeClass(code) {
  if (!code || code === 'UNKNOWN') return 'bg-red-100 text-red-700';
  if (['OFF','AL','MC','PH','EL','UPL','TRG'].includes(code)) return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── DOWNLOAD RYMNET CSV ──────────────────────────────────────────────────────
function downloadRymnetCSV() {
  if (!rosterFlatRecords.length) {
    alert('No records to export. Please upload a roster file first.');
    return;
  }

  const monthVal  = document.getElementById('rosterMonth')?.value  || 'YYYY-MM';
  const branchVal = document.getElementById('rosterBranchCode')?.value?.trim() || 'BRANCH';

  const header = 'Emp_ID,Emp_Name,Work_Date,Shift_Code\r\n';
  const body   = rosterFlatRecords
    .map(r => `${r.empNo},"${r.empName.replace(/"/g,'""')}",${r.workDate},${r.shiftCode}`)
    .join('\r\n');

  const blob = new Blob([header + body + '\r\n'], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `rymnet_${branchVal}_${monthVal}.csv`);

  const dlBtn = document.getElementById('rosterDownloadBtn');
  if (dlBtn) {
    const orig = dlBtn.innerHTML;
    dlBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Downloaded!';
    dlBtn.disabled = true;
    setTimeout(() => { dlBtn.innerHTML = orig; dlBtn.disabled = false; }, 3000);
  }
}
