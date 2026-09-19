// js/roster.js — Module 2: Roster Matrix to Rymnet HRMS Converter
'use strict';

let rosterRawData     = [];
let rosterFlatRecords = [];

let currentWorkbook = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initRoster() {
  const dropZone    = document.getElementById('rosterDropZone');
  const fileInput   = document.getElementById('rosterInput');
  const browseBtn   = document.getElementById('rosterBrowseBtn');
  const sheetSelect = document.getElementById('rosterSheetSelect');

  if (!dropZone || !fileInput) return;

  const openPicker = (e) => {
    e.stopPropagation();
    fileInput.value = '';
    fileInput.click();
  };

  dropZone.addEventListener('click', (e) => {
    if (e.target !== fileInput && e.target !== browseBtn) {
      openPicker(e);
    }
  });

  if (browseBtn) {
    browseBtn.addEventListener('click', openPicker);
  }

  fileInput.addEventListener('click', e => e.stopPropagation());

  fileInput.addEventListener('change', e => {
    if (e.target.files.length) {
      handleRosterFile(e.target.files[0]);
    }
  });

  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      handleRosterFile(e.dataTransfer.files[0]);
    }
  });

  if (sheetSelect) {
    sheetSelect.addEventListener('change', (e) => {
      if (currentWorkbook && e.target.value) {
        selectSheet(e.target.value);
      }
    });
  }

  const dlBtn = document.getElementById('rosterDownloadBtn');
  if (dlBtn) dlBtn.addEventListener('click', downloadRymnetCSV);
}

// ─── FILE HANDLER ─────────────────────────────────────────────────────────────
function handleRosterFile(file) {
  const statusEl       = document.getElementById('rosterStatus');
  const sheetContainer = document.getElementById('rosterSheetSelectContainer');
  const sheetSelect    = document.getElementById('rosterSheetSelect');

  if (statusEl) {
    statusEl.innerHTML = `<div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
      <i class="fa-solid fa-spinner fa-spin"></i> Reading ${escHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)…
    </div>`;
  }

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    if (sheetContainer) sheetContainer.classList.add('hidden');
    currentWorkbook = null;
    Papa.parse(file, {
      skipEmptyLines: false,
      complete(results) {
        rosterRawData = results.data;
        processRoster();
      },
      error(err) {
        if (statusEl) {
          statusEl.innerHTML = `<div class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
            <i class="fa-solid fa-triangle-exclamation"></i> CSV parse error: ${escHtml(err.message)}
          </div>`;
        }
      }
    });
  } else {
    // .xlsx, .xls
    if (typeof XLSX === 'undefined') {
      if (statusEl) {
        statusEl.innerHTML = `<div class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
          <i class="fa-solid fa-triangle-exclamation"></i> Excel parser (SheetJS) is still loading. Please wait 2 seconds and try again.
        </div>`;
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        currentWorkbook = wb;

        // Populate sheet selector if multiple sheets
        if (sheetSelect && wb.SheetNames.length > 1) {
          sheetSelect.innerHTML = wb.SheetNames.map(name =>
            `<option value="${escHtml(name)}">${escHtml(name)}</option>`
          ).join('');
          if (sheetContainer) sheetContainer.classList.remove('hidden');
        } else {
          if (sheetContainer) sheetContainer.classList.add('hidden');
        }

        // Find best sheet (look for one containing day numbers or visual headers)
        let chosenSheet = wb.SheetNames[0];
        for (const sName of wb.SheetNames) {
          const testSheet = wb.Sheets[sName];
          const testData = XLSX.utils.sheet_to_json(testSheet, { header: 1, defval: '' });
          for (let r = 0; r < Math.min(testData.length, 10); r++) {
            const rowStr = testData[r].map(c => String(c).trim().toLowerCase()).join(' ');
            if (rowStr.includes('employee no') || rowStr.includes('employee name') || /\b0?1\s*\([a-z]{3}\)/i.test(rowStr) || (rowStr.includes('day') && rowStr.includes('off'))) {
              chosenSheet = sName;
              break;
            }
          }
        }

        if (sheetSelect) sheetSelect.value = chosenSheet;
        selectSheet(chosenSheet);

      } catch(err) {
        console.error('[PMG Roster] Excel parse error:', err);
        if (statusEl) {
          statusEl.innerHTML = `<div class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
            <i class="fa-solid fa-triangle-exclamation"></i> Excel file error: ${escHtml(err.message)}
          </div>`;
        }
      }
    };
    reader.onerror = function(err) {
      if (statusEl) {
        statusEl.innerHTML = `<div class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
          <i class="fa-solid fa-triangle-exclamation"></i> Could not read file: ${escHtml(err.message)}
        </div>`;
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function selectSheet(sheetName) {
  if (!currentWorkbook || !currentWorkbook.Sheets[sheetName]) return;
  const ws = currentWorkbook.Sheets[sheetName];
  rosterRawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`[PMG Roster] Loaded sheet "${sheetName}" with ${rosterRawData.length} rows`);
  processRoster();
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

  const [yearStr, monthStr] = monthVal.split('-');
  const year  = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const maxDayInMonth = new Date(year, month, 0).getDate();

  rosterFlatRecords = [];
  const unmappedNicknames = new Set();

  // ── Mode 1: Check if file contains Monthly Matrix (Employee No, Employee Name, 01 (Tue)...) ──
  let matrixHeaderIdx = -1;
  for (let r = 0; r < Math.min(rosterRawData.length, 10); r++) {
    const rowStr = rosterRawData[r].map(c => String(c).trim().toLowerCase()).join(' ');
    if (rowStr.includes('employee no') || rowStr.includes('employee name') || /\b0?1\s*\([a-z]{3}\)/i.test(rowStr) || (rowStr.includes('1') && rowStr.includes('2') && rowStr.includes('3') && rowStr.includes('4'))) {
      matrixHeaderIdx = r;
      break;
    }
  }

  // ── Mode 2: Check if file contains Visual Hourly Schedule (DAY, OFF, 7.30-8.30AM...) ──
  let visualHeaderIdx = -1;
  for (let r = 0; r < rosterRawData.length; r++) {
    const rowStr = rosterRawData[r].map(c => String(c).trim().toLowerCase()).join(' ');
    if (rowStr.includes('day') && rowStr.includes('off') && (rowStr.includes('7.30') || rowStr.includes('8.30') || rowStr.includes('half day'))) {
      visualHeaderIdx = r;
      break;
    }
  }

  if (matrixHeaderIdx !== -1) {
    // ══════════════════════════════════════════════════════════════════════════
    // PARSE MODE 1: MONTHLY ROSTER MATRIX (Rymnet Format)
    // ══════════════════════════════════════════════════════════════════════════
    const headerRow  = rosterRawData[matrixHeaderIdx];
    const dayNumbers = [];

    for (let c = 0; c < headerRow.length; c++) {
      const cellVal = String(headerRow[c] || '').trim();
      // Matches "01 (Tue)", "1 (Wed)", "01", "1", etc.
      const match = cellVal.match(/\b0?([1-9]|[12][0-9]|3[01])\b/);
      if (match && !/employee|emp|branch|nickname/i.test(cellVal)) {
        const d = parseInt(match[1], 10);
        if (d >= 1 && d <= 31) {
          dayNumbers.push({ col: c, day: d });
        }
      }
    }

    if (dayNumbers.length === 0) {
      if (statusEl) { statusEl.textContent = 'Error: could not detect day columns (expected 01–31 in header row).'; statusEl.className = 'text-red-600 text-sm mt-2'; }
      return;
    }

    let r = matrixHeaderIdx + 1;
    while (r < rosterRawData.length) {
      const row = rosterRawData[r];
      // Stop if we hit the visual schedule section
      if (visualHeaderIdx !== -1 && r >= visualHeaderIdx) break;

      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      // Check if this row represents an employee
      const hasEmpId = col0.toUpperCase().startsWith('PMG') || /^[A-Z0-9_-]{4,12}$/i.test(col0);
      const hasEmpName = col1.length > 2 && !/^(RD|OD|OFF|SL|MC|ANL|AL|PH|RPL|BL)$/i.test(col1);

      if (hasEmpId || hasEmpName || col0.length > 1) {
        const staffIdentifier = hasEmpId ? col0 : (col0 || col1);
        const staffObj = lookupStaff(staffIdentifier) || lookupStaff(col1);

        const empNo   = staffObj ? staffObj.empNo   : (hasEmpId ? col0 : `UNMAPPED_${col0}`);
        const empName = staffObj ? staffObj.empName : (col1 || col0);
        const nickname = staffObj ? staffObj.nickname : (col0 || col1);

        if (!staffObj) unmappedNicknames.add(col0 || col1);

        const shiftRow = row;
        let leaveRow = null;

        // Check if next row is a leave/status row (empty or non-PMG in col 0/1)
        if (r + 1 < rosterRawData.length) {
          const nextRow = rosterRawData[r + 1];
          const nextCol0 = String(nextRow[0] || '').trim();
          const nextCol1 = String(nextRow[1] || '').trim();
          const isNextEmp = nextCol0.toUpperCase().startsWith('PMG') || (nextCol1.length > 3 && !/^(RD|OD|OFF|SL|MC|ANL|AL|PH|RPL|BL)$/i.test(nextCol1));
          const hasLeaveCodes = dayNumbers.some(({ col }) => {
            const val = String(nextRow[col] || '').trim().toUpperCase();
            return ['RD','OD','OFF','SL','MC','ANL','AL','PH','RPL','BL'].includes(val);
          });

          if (!isNextEmp && hasLeaveCodes) {
            leaveRow = nextRow;
            r++; // consume leave row
          }
        }

        for (const { col, day } of dayNumbers) {
          if (day > maxDayInMonth) continue;

          const shiftVal = String(shiftRow[col] || '').trim();
          const leaveVal = leaveRow ? String(leaveRow[col] || '').trim() : '';

          let shiftCode = '';
          // Priority logic:
          // 1. Definite leaves (Annual, Sick, Replacement, Block) take priority
          if (['ANL','AL','SL','MC','RPL','BL','EL','UPL'].includes(leaveVal.toUpperCase())) {
            shiftCode = resolveShiftCode(leaveVal);
          } else if (shiftVal) {
            shiftCode = resolveShiftCode(shiftVal);
          } else if (leaveVal) {
            shiftCode = resolveShiftCode(leaveVal);
          } else {
            shiftCode = 'OFF'; // empty day in monthly roster
          }

          if (shiftCode) {
            const workDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            rosterFlatRecords.push({
              empNo, empName, nickname,
              isMapped: !!staffObj,
              workDate, shiftCode,
              rawCell: shiftVal || leaveVal || 'OFF',
            });
          }
        }
      }
      r++;
    }

  } else if (visualHeaderIdx !== -1) {
    // ══════════════════════════════════════════════════════════════════════════
    // PARSE MODE 2: VISUAL HOURLY SCHEDULE (DAY, OFF, 7.30-8.30AM...)
    // ══════════════════════════════════════════════════════════════════════════
    const vHeader = rosterRawData[visualHeaderIdx].map(c => String(c).trim());
    const offCol = vHeader.findIndex(h => h.toUpperCase() === 'OFF');
    const timeCols = [];

    // Identify hourly columns (e.g. 7.30-8.30AM, etc.)
    for (let c = 0; c < vHeader.length; c++) {
      const h = vHeader[c];
      if (/(\d{1,2})[.:](\d{2})[-–](\d{1,2})[.:](\d{2})/i.test(h) || /\d+[-–]\d+\s*(AM|PM)/i.test(h)) {
        timeCols.push({ col: c, header: h });
      }
    }

    let currentDate = '';
    for (let r = visualHeaderIdx + 1; r < rosterRawData.length; r++) {
      const row = rosterRawData[r];
      const col0 = String(row[0] || '').trim();

      // Check if row contains a date like 14.09.2026 or 2026-09-14
      const dateMatch = col0.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/) || col0.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
      if (dateMatch) {
        if (dateMatch[3].length === 4) {
          // DD.MM.YYYY
          currentDate = `${dateMatch[3]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`;
        } else {
          // YYYY-MM-DD
          currentDate = `${dateMatch[1]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}`;
        }
      }

      if (!currentDate) continue;

      // Check OFF column
      if (offCol !== -1 && row[offCol]) {
        const offStaffNames = String(row[offCol]).split(/[\n,;/]+/).map(s => s.trim()).filter(Boolean);
        for (const offName of offStaffNames) {
          const staffObj = lookupStaff(offName);
          if (!staffObj) unmappedNicknames.add(offName);
          rosterFlatRecords.push({
            empNo: staffObj ? staffObj.empNo : `UNMAPPED_${offName}`,
            empName: staffObj ? staffObj.empName : offName,
            nickname: staffObj ? staffObj.nickname : offName,
            isMapped: !!staffObj,
            workDate: currentDate,
            shiftCode: 'OFF',
            rawCell: 'OFF (Visual)',
          });
        }
      }

      // Check staff assigned to time slots in this row
      const staffInRow = new Set();
      timeCols.forEach(({ col }) => {
        const val = String(row[col] || '').trim();
        if (val && val.toUpperCase() !== 'REST' && val.length >= 2) {
          staffInRow.add(val.toUpperCase());
        }
      });

      for (const nick of staffInRow) {
        // Find first and last time slot for this staff in this row
        let firstSlot = null, lastSlot = null, count = 0;
        timeCols.forEach(({ col, header }) => {
          const cell = String(row[col] || '').trim().toUpperCase();
          if (cell === nick) {
            if (!firstSlot) firstSlot = header;
            lastSlot = header;
            count++;
          }
        });

        if (firstSlot && lastSlot) {
          const staffObj = lookupStaff(nick);
          if (!staffObj) unmappedNicknames.add(nick);

          // Translate slots into shift code
          let shiftCode = '8H_0730-1630'; // default
          if (firstSlot.includes('7.30') && (lastSlot.includes('3.30') || lastSlot.includes('4.30'))) {
            shiftCode = '8H_0730-1630';
          } else if (firstSlot.includes('7.30') && (lastSlot.includes('11.30') || lastSlot.includes('12.30'))) {
            shiftCode = '5H_0730-1230';
          } else if (firstSlot.includes('12.30') && (lastSlot.includes('8.30') || lastSlot.includes('9.30') || lastSlot.includes('2130'))) {
            shiftCode = '8H_1230-2130';
          } else if (firstSlot.includes('8.00') && (lastSlot.includes('4.00') || lastSlot.includes('5.00'))) {
            shiftCode = '8H_0800-1700';
          } else if (firstSlot.includes('1.00') || firstSlot.includes('1300')) {
            shiftCode = '8H_1300-2200';
          } else if (count <= 5) {
            shiftCode = '5H_0730-1230';
          }

          rosterFlatRecords.push({
            empNo: staffObj ? staffObj.empNo : `UNMAPPED_${nick}`,
            empName: staffObj ? staffObj.empName : nick,
            nickname: staffObj ? staffObj.nickname : nick,
            isMapped: !!staffObj,
            workDate: currentDate,
            shiftCode: shiftCode,
            rawCell: `${firstSlot} -> ${lastSlot} (${count}h)`,
          });
        }
      }
    }
  } else {
    if (statusEl) {
      statusEl.textContent = 'Error: could not recognize format. Expected either Monthly Grid (01–31 headers) or Visual Hourly Schedule (DAY, OFF, 7.30-8.30AM).';
      statusEl.className = 'text-red-600 text-sm mt-2';
    }
    return;
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
