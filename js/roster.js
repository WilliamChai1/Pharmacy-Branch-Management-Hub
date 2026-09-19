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
          sheetSelect.innerHTML = `<option value="__ALL__">📅 All Sheets Combined (Whole Month)</option>` +
            wb.SheetNames.map(name =>
              `<option value="${escHtml(name)}">${escHtml(name)}</option>`
            ).join('');
          if (sheetContainer) sheetContainer.classList.remove('hidden');
          sheetSelect.value = '__ALL__';
          selectSheet('__ALL__');
        } else {
          if (sheetContainer) sheetContainer.classList.add('hidden');
          selectSheet('__ALL__');
        }

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
  processRoster(sheetName);
}

// ─── PARSE A SINGLE SHEET'S DATA ──────────────────────────────────────────────
function parseSingleSheet(rawData, year, month, maxDayInMonth, unmappedNicknames) {
  if (!rawData || rawData.length < 2) return [];

  const leaveCodesList = ['RD', 'OD', 'OFF', 'ANL', 'AL', 'SL', 'MC', 'PH', 'RPL', 'BL', 'EL', 'UPL', 'TRG'];

  // Check if sheet contains Monthly Matrix (Employee No, Employee Name, 01 (Tue)...)
  let matrixHeaderIdx = -1;
  for (let r = 0; r < Math.min(rawData.length, 10); r++) {
    const rowStr = rawData[r].map(c => String(c).trim().toLowerCase()).join(' ');
    if (rowStr.includes('employee no') || rowStr.includes('employee name') || /\b0?1\s*\([a-z]{3}\)/i.test(rowStr) || (rowStr.includes('1') && rowStr.includes('2') && rowStr.includes('3') && rowStr.includes('4'))) {
      matrixHeaderIdx = r;
      break;
    }
  }

  // Check if sheet contains Visual Hourly Schedule (DAY, OFF, 7.30-8.30AM...)
  let visualHeaderIdx = -1;
  for (let r = 0; r < rawData.length; r++) {
    const rowStr = rawData[r].map(c => String(c).trim().toLowerCase()).join(' ');
    if (rowStr.includes('day') && rowStr.includes('off') && (rowStr.includes('7.30') || rowStr.includes('8.30') || rowStr.includes('half day'))) {
      visualHeaderIdx = r;
      break;
    }
  }

  const records = [];

  // ════════════════════════════════════════════════════════════════════════════
  // MODE 1: MONTHLY MATRIX (Employee No, Employee Name, 01 (Tue)...)
  // ════════════════════════════════════════════════════════════════════════════
  if (matrixHeaderIdx !== -1) {
    const headerRow  = rawData[matrixHeaderIdx];
    const dayNumbers = [];

    for (let c = 0; c < headerRow.length; c++) {
      const cellVal = String(headerRow[c] || '').trim();
      const match = cellVal.match(/\b0?([1-9]|[12][0-9]|3[01])\b/);
      if (match && !/employee|emp|branch|nickname/i.test(cellVal)) {
        const d = parseInt(match[1], 10);
        if (d >= 1 && d <= 31) {
          dayNumbers.push({ col: c, day: d });
        }
      }
    }

    if (dayNumbers.length > 0) {
      let r = matrixHeaderIdx + 1;
      while (r < rawData.length) {
        const row = rawData[r];
        if (visualHeaderIdx !== -1 && r >= visualHeaderIdx) break;

        const col0 = String(row[0] || '').trim();
        const col1 = String(row[1] || '').trim();

        const hasEmpId   = col0.toUpperCase().startsWith('PMG') || /^[A-Z0-9_-]{4,12}$/i.test(col0);
        const hasEmpName = col1.length > 2 && !/^(RD|OD|OFF|SL|MC|ANL|AL|PH|RPL|BL)$/i.test(col1);

        if (hasEmpId || hasEmpName || col0.length > 1) {
          const staffIdentifier = hasEmpId ? col0 : (col0 || col1);
          const staffObj = lookupStaff(staffIdentifier) || lookupStaff(col1);

          const empNo    = staffObj ? staffObj.empNo   : (hasEmpId ? col0 : `UNMAPPED_${col0}`);
          const empName  = staffObj ? staffObj.empName : (col1 || col0);
          const nickname = staffObj ? staffObj.nickname : (col0 || col1);

          if (!staffObj) unmappedNicknames.add(col0 || col1);

          const shiftRow = row;
          let leaveRow = null;

          if (r + 1 < rawData.length) {
            const nextRow = rawData[r + 1];
            const nextCol0 = String(nextRow[0] || '').trim();
            const nextCol1 = String(nextRow[1] || '').trim();
            const isNextEmp = nextCol0.toUpperCase().startsWith('PMG') || (nextCol1.length > 3 && !/^(RD|OD|OFF|SL|MC|ANL|AL|PH|RPL|BL)$/i.test(nextCol1));
            const hasLeaveCodes = dayNumbers.some(({ col }) => {
              const val = String(nextRow[col] || '').trim().toUpperCase();
              return leaveCodesList.includes(val);
            });

            if (!isNextEmp && hasLeaveCodes) {
              leaveRow = nextRow;
              r++;
            }
          }

          for (const { col, day } of dayNumbers) {
            if (day > maxDayInMonth) continue;

            const shiftVal = String(shiftRow[col] || '').trim();
            const leaveVal = leaveRow ? String(leaveRow[col] || '').trim() : '';

            let shiftCode = '';
            let leaveCode = '';

            // Check shiftVal
            if (shiftVal) {
              const sUpper = shiftVal.toUpperCase();
              if (leaveCodesList.includes(sUpper)) {
                leaveCode = resolveShiftCode(sUpper);
              } else {
                shiftCode = resolveShiftCode(shiftVal);
              }
            }

            // Check leaveVal
            if (leaveVal) {
              const lUpper = leaveVal.toUpperCase();
              if (leaveCodesList.includes(lUpper)) {
                leaveCode = resolveShiftCode(lUpper);
              } else if (!shiftCode) {
                shiftCode = resolveShiftCode(leaveVal);
              }
            }

            // Normalise leave codes
            if (leaveCode.toUpperCase() === 'OFF') leaveCode = 'RD';
            if (leaveCode.toUpperCase() === 'AL')  leaveCode = 'ANL';
            if (leaveCode.toUpperCase() === 'MC')  leaveCode = 'SL';

            // If neither shift nor leave was in the row, default to Rest Day
            if (!shiftCode && !leaveCode) {
              leaveCode = 'RD';
            }

            const workDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            records.push({
              empNo,
              empName,
              nickname,
              isMapped: !!staffObj,
              workDate,
              day, // Integer day of month 1..31
              shiftCode: shiftCode || '',
              leaveCode: leaveCode || '',
              rawCell: `${shiftVal} / ${leaveVal}`.trim(),
            });
          }
        }
        r++;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MODE 2: VISUAL HOURLY SCHEDULE (DAY, OFF, 7.30-8.30AM...)
  // ════════════════════════════════════════════════════════════════════════════
  if (visualHeaderIdx !== -1) {
    const vHeader = rawData[visualHeaderIdx].map(c => String(c).trim());
    const offCol  = vHeader.findIndex(h => h.toUpperCase() === 'OFF');
    const timeCols = [];

    for (let c = 0; c < vHeader.length; c++) {
      const h = vHeader[c];
      if (/(\d{1,2})[.:](\d{2})[-–](\d{1,2})[.:](\d{2})/i.test(h) || /\d+[-–]\d+\s*(AM|PM)/i.test(h)) {
        timeCols.push({ col: c, header: h });
      }
    }

    let currentDate = '';

    for (let r = visualHeaderIdx + 1; r < rawData.length; r++) {
      const row  = rawData[r];
      const col0 = String(row[0] || '').trim();

      // Detect start of a new day block (e.g. "MON", "TUES", "WED", etc.)
      const isDayName = /^(MON|TUE|TUES|WED|THU|THUR|THURS|FRI|SAT|SUN)\b/i.test(col0);

      // If this row has a day name, look ahead up to 6 rows to locate the date
      if (isDayName) {
        for (let look = r; look < Math.min(r + 6, rawData.length); look++) {
          const lookCol0 = String(rawData[look][0] || '').trim();
          const dMatch = lookCol0.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/) || lookCol0.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
          if (dMatch) {
            if (dMatch[3].length === 4) {
              currentDate = `${dMatch[3]}-${dMatch[2].padStart(2,'0')}-${dMatch[1].padStart(2,'0')}`;
            } else {
              currentDate = `${dMatch[1]}-${dMatch[2].padStart(2,'0')}-${dMatch[3].padStart(2,'0')}`;
            }
            break;
          }
        }
      }

      // Also check if current row's col0 itself is a date
      const directDateMatch = col0.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/) || col0.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
      if (directDateMatch) {
        if (directDateMatch[3].length === 4) {
          currentDate = `${directDateMatch[3]}-${directDateMatch[2].padStart(2,'0')}-${directDateMatch[1].padStart(2,'0')}`;
        } else {
          currentDate = `${directDateMatch[1]}-${directDateMatch[2].padStart(2,'0')}-${directDateMatch[3].padStart(2,'0')}`;
        }
      }

      if (!currentDate) continue;

      const dayNum = parseInt(currentDate.split('-')[2], 10);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > maxDayInMonth) continue;

      // Check if this date has a Public Holiday remark
      const isPH = /PH\b|MALAYSIA DAY|PUBLIC HOLIDAY/i.test(col0) ||
        (offCol !== -1 && /PH\b|MALAYSIA DAY|PUBLIC HOLIDAY/i.test(String(row[offCol] || '')));

      // ── Process OFF column ────────────────────────────────────────────────
      if (offCol !== -1 && row[offCol]) {
        const offStaffNames = String(row[offCol]).split(/[\n,;/]+/).map(s => s.trim()).filter(Boolean);
        for (const offName of offStaffNames) {
          // Skip general holiday labels like "PH - MALAYSIA DAY"
          if (/PH\b|MALAYSIA DAY|PUBLIC HOLIDAY/i.test(offName)) continue;

          const staffObj = lookupStaff(offName);
          if (!staffObj) unmappedNicknames.add(offName);

          records.push({
            empNo: staffObj ? staffObj.empNo : `UNMAPPED_${offName}`,
            empName: staffObj ? staffObj.empName : offName,
            nickname: staffObj ? staffObj.nickname : offName,
            isMapped: !!staffObj,
            workDate: currentDate,
            day: dayNum, // Integer day 1..31
            shiftCode: '',
            leaveCode: isPH ? 'PH' : 'OFF',
            rawCell: 'OFF (Visual)',
          });
        }
      }

      // ── Process working staff in time columns ──────────────────────────────
      const staffInRow = new Set();
      timeCols.forEach(({ col }) => {
        const val = String(row[col] || '').trim();
        if (val && val.toUpperCase() !== 'REST' && val.length >= 2) {
          staffInRow.add(val.toUpperCase());
        }
      });

      for (const nick of staffInRow) {
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

          let shiftCode = '8H_0730-1630';

          if (count === 4 || (firstSlot.includes('7.30') && lastSlot.includes('11.30'))) {
            shiftCode = '4H_0730-1130';
          } else if (count === 5 && firstSlot.includes('7.30')) {
            shiftCode = '5H_0730-1230';
          } else if (count === 5 && firstSlot.includes('8.00')) {
            shiftCode = '5H_0800-1300';
          } else if (count === 5 && (firstSlot.includes('4.30') || firstSlot.includes('1630'))) {
            shiftCode = '5H_1630-2130';
          } else if (firstSlot.includes('7.30') && (lastSlot.includes('3.30') || lastSlot.includes('4.30'))) {
            shiftCode = '8H_0730-1630';
          } else if (firstSlot.includes('8.00') && (lastSlot.includes('4.00') || lastSlot.includes('5.00'))) {
            shiftCode = '8H_0800-1700';
          } else if (firstSlot.includes('8.30') && (lastSlot.includes('5.00') || lastSlot.includes('5.30'))) {
            shiftCode = '8H_0830-1730';
          } else if (firstSlot.includes('12.30') && (lastSlot.includes('8.30') || lastSlot.includes('9.30') || lastSlot.includes('2130'))) {
            shiftCode = '8H_1230-2130';
          } else if (firstSlot.includes('1.00') || firstSlot.includes('1300')) {
            shiftCode = '8H_1300-2200';
          } else if (count <= 4) {
            shiftCode = '4H_0730-1130';
          } else if (count <= 5) {
            shiftCode = '5H_0730-1230';
          } else {
            shiftCode = '8H_0730-1630';
          }

          records.push({
            empNo: staffObj ? staffObj.empNo : `UNMAPPED_${nick}`,
            empName: staffObj ? staffObj.empName : nick,
            nickname: staffObj ? staffObj.nickname : nick,
            isMapped: !!staffObj,
            workDate: currentDate,
            day: dayNum, // Integer day 1..31
            shiftCode: shiftCode,
            leaveCode: isPH ? 'PH' : '',
            rawCell: `${firstSlot} -> ${lastSlot} (${count}h)`,
          });
        }
      }
    }
  }

  return records;
}

// ─── PROCESS ROSTER (ALL SHEETS OR SINGLE SHEET) ──────────────────────────────
function processRoster(targetSheet) {
  const statusEl  = document.getElementById('rosterStatus');
  const monthVal  = document.getElementById('rosterMonth')?.value || '';
  const branchVal = document.getElementById('rosterBranchCode')?.value?.trim() || 'KS01';

  if (!monthVal) {
    if (statusEl) {
      statusEl.innerHTML = `<div class="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold">
        ⚠ Please select the Month/Year before uploading.
      </div>`;
    }
    return;
  }

  const [yearStr, monthStr] = monthVal.split('-');
  const year  = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const maxDayInMonth = new Date(year, month, 0).getDate();

  rosterFlatRecords = [];
  const unmappedNicknames = new Set();
  const allExtractedRecords = [];
  const processedSheetNames = [];

  if (currentWorkbook && (!targetSheet || targetSheet === '__ALL__')) {
    // ══════════════════════════════════════════════════════════════════════════
    // PROCESS ALL SHEETS (WHOLE MONTH)
    // ══════════════════════════════════════════════════════════════════════════
    currentWorkbook.SheetNames.forEach(sName => {
      const ws = currentWorkbook.Sheets[sName];
      const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const recs = parseSingleSheet(sheetData, year, month, maxDayInMonth, unmappedNicknames);
      if (recs.length > 0) {
        processedSheetNames.push(sName);
        allExtractedRecords.push(...recs);
      }
    });

  } else if (currentWorkbook && targetSheet) {
    // Single sheet from workbook
    const ws = currentWorkbook.Sheets[targetSheet];
    const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const recs = parseSingleSheet(sheetData, year, month, maxDayInMonth, unmappedNicknames);
    if (recs.length > 0) {
      processedSheetNames.push(targetSheet);
      allExtractedRecords.push(...recs);
    }

  } else if (rosterRawData && rosterRawData.length > 0) {
    // CSV or single raw data
    const recs = parseSingleSheet(rosterRawData, year, month, maxDayInMonth, unmappedNicknames);
    if (recs.length > 0) {
      processedSheetNames.push('CSV');
      allExtractedRecords.push(...recs);
    }
  }

  if (allExtractedRecords.length === 0) {
    if (statusEl) {
      statusEl.innerHTML = `<div class="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
        <i class="fa-solid fa-triangle-exclamation"></i> Could not find any valid schedule data in the uploaded file.
        Please ensure the sheet contains either day columns (01–31) or visual time slots (DAY, OFF, 7.30-8.30AM).
      </div>`;
    }
    return;
  }

  // ── Merge & Deduplicate across all sheets ──────────────────────────────────
  const mergedMap = new Map();
  allExtractedRecords.forEach(rec => {
    const key = `${rec.empNo}_${rec.workDate}`;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, { ...rec });
    } else {
      const existing = mergedMap.get(key);

      // If new record has an active shift code, prefer it over empty/OFF/RD
      if (rec.shiftCode && !['OFF', 'RD', 'OD'].includes(rec.shiftCode)) {
        existing.shiftCode = rec.shiftCode;
      }

      // If new record has a specific leave code (RPL, PH, SL, ANL, BL, etc.)
      if (rec.leaveCode && !['OFF', 'RD', 'OD'].includes(rec.leaveCode)) {
        existing.leaveCode = rec.leaveCode;
      } else if (!existing.leaveCode && rec.leaveCode) {
        existing.leaveCode = rec.leaveCode;
      }

      // If an active shift is present, clear generic rest day leave codes
      if (existing.shiftCode && ['OFF', 'RD', 'OD'].includes(existing.leaveCode)) {
        existing.leaveCode = '';
      }

      if (rec.rawCell) {
        existing.rawCell = `${existing.rawCell}; ${rec.rawCell}`;
      }
    }
  });

  // Sort chronologically by date, then by EmpNo
  rosterFlatRecords = Array.from(mergedMap.values()).sort((a, b) => {
    const dComp = a.workDate.localeCompare(b.workDate);
    if (dComp !== 0) return dComp;
    return a.empNo.localeCompare(b.empNo);
  });

  renderRosterPreview(unmappedNicknames);

  if (statusEl) {
    const u = unmappedNicknames.size;
    const sheetDesc = processedSheetNames.length > 1
      ? `Processed all ${processedSheetNames.length} sheets: "${processedSheetNames.join('", "')}"`
      : `Processed sheet "${processedSheetNames[0] || 'Schedule'}"`;

    let msg = `<div class="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center justify-between flex-wrap gap-2">
      <div>
        <i class="fa-solid fa-circle-check text-green-600 mr-1.5"></i>
        <span>${sheetDesc} — <strong>${rosterFlatRecords.length} total schedule records</strong> for ${monthVal}!</span>
      </div>`;

    if (u > 0) {
      msg += `<span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded text-xs font-bold">
        ⚠ ${u} unmapped nickname(s): ${[...unmappedNicknames].join(', ')}
      </span>`;
    }
    msg += `</div>`;
    statusEl.innerHTML = msg;
  }

  const panel = document.getElementById('rosterResultPanel');
  if (panel) panel.classList.remove('hidden');
}

// ─── PREVIEW TABLE (RYMNET MATRIX PREVIEW) ──────────────────────────────────
function renderRosterPreview(unmappedSet) {
  const tbody   = document.getElementById('rosterPreviewBody');
  const summary = document.getElementById('rosterPreviewSummary');
  const thead   = document.querySelector('#rosterResultPanel thead');
  if (!tbody) return;

  const monthVal = document.getElementById('rosterMonth')?.value || '2026-09';
  const branchVal = document.getElementById('rosterBranchCode')?.value?.trim() || 'KS01';
  const [yearStr, monthStr] = monthVal.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const maxDayInMonth = new Date(year, month, 0).getDate();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 1. Group records by employee (seed with branch staff first)
  const employeeMap = new Map();

  const branchStaff = STAFF_MAP.filter(s => !s.branchCode || s.branchCode === branchVal);
  (branchStaff.length > 0 ? branchStaff : STAFF_MAP).forEach(s => {
    employeeMap.set(s.empNo, {
      empNo: s.empNo,
      empName: s.empName,
      nickname: s.nickname,
      isMapped: true,
      days: {},
    });
  });

  rosterFlatRecords.forEach(rec => {
    if (!employeeMap.has(rec.empNo)) {
      employeeMap.set(rec.empNo, {
        empNo: rec.empNo,
        empName: rec.empName,
        nickname: rec.nickname,
        isMapped: rec.isMapped,
        days: {},
      });
    }
    employeeMap.get(rec.empNo).days[rec.day] = rec;
  });

  // 2. Render dynamic Matrix Header (first 14 days preview)
  const previewDays = Math.min(maxDayInMonth, 14);
  if (thead) {
    let thHtml = `<tr>
      <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-100 sticky left-0 z-10">Employee No</th>
      <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-100">Employee Name</th>`;

    for (let d = 1; d <= previewDays; d++) {
      const dt = new Date(year, month - 1, d);
      const dayName = dayNames[dt.getDay()];
      thHtml += `<th class="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase border-l border-gray-200 whitespace-nowrap">
        ${String(d).padStart(2,'0')} (${dayName})
      </th>`;
    }
    if (maxDayInMonth > previewDays) {
      thHtml += `<th class="px-3 py-2 text-center text-xs font-semibold text-gray-500 italic bg-gray-50">… +${maxDayInMonth - previewDays} days</th>`;
    }
    thHtml += `</tr>`;
    thead.innerHTML = thHtml;
  }

  // 3. Render paired Shift & Leave rows for each employee
  let rowsHtml = '';
  employeeMap.forEach(emp => {
    const rowBg  = !emp.isMapped ? 'bg-amber-50' : 'hover:bg-blue-50/40';
    const border = !emp.isMapped ? 'border-l-4 border-amber-400' : '';

    // Shift row
    rowsHtml += `<tr class="border-t border-gray-200 ${rowBg} ${border}">
      <td class="px-3 py-2 font-mono text-xs font-semibold text-blue-900 bg-white/80 sticky left-0 z-10">${escHtml(emp.empNo)}</td>
      <td class="px-3 py-2 text-xs font-medium text-gray-800 whitespace-nowrap">${escHtml(emp.empName)}</td>`;

    for (let d = 1; d <= previewDays; d++) {
      const rec = emp.days[d];
      let sVal = rec ? (rec.shiftCode || '') : '';
      if (['RD','OD','OFF','ANL','AL','SL','MC','PH','RPL','BL','EL','UPL','TRG'].includes(sVal.toUpperCase())) {
        sVal = '';
      }
      rowsHtml += `<td class="px-2 py-1.5 text-center text-xs border-l border-gray-100 font-mono">
        ${sVal ? `<span class="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold">${escHtml(sVal)}</span>` : ''}
      </td>`;
    }
    if (maxDayInMonth > previewDays) rowsHtml += `<td class="px-2 py-1.5 text-center text-xs text-gray-400 bg-gray-50">…</td>`;
    rowsHtml += `</tr>`;

    // Leave row
    rowsHtml += `<tr class="border-b border-gray-200 bg-gray-50/50 text-gray-500">
      <td class="px-3 py-1 text-[11px] text-gray-400 italic bg-gray-50/80 sticky left-0 z-10">↳ Leave / Rest</td>
      <td class="px-3 py-1 text-[11px] text-gray-400 italic"></td>`;

    for (let d = 1; d <= previewDays; d++) {
      const rec = emp.days[d];
      let lVal = rec ? (rec.leaveCode || '') : '';
      if (!lVal && rec && ['RD','OD','OFF','ANL','AL','SL','MC','PH','RPL','BL','EL','UPL','TRG'].includes(rec.shiftCode?.toUpperCase())) {
        lVal = rec.shiftCode;
      }
      if (!lVal && !rec?.shiftCode) lVal = 'RD';
      if (lVal.toUpperCase() === 'OFF') lVal = 'RD';
      if (lVal.toUpperCase() === 'AL')  lVal = 'ANL';
      if (lVal.toUpperCase() === 'MC')  lVal = 'SL';

      const lClass = ['ANL','SL','RPL','BL','PH'].includes(lVal.toUpperCase())
        ? 'bg-amber-100 text-amber-800 font-bold'
        : (lVal ? 'text-gray-600 font-semibold' : '');

      rowsHtml += `<td class="px-2 py-1 text-center text-xs border-l border-gray-100 font-mono">
        ${lVal ? `<span class="inline-block px-1 py-0.2 rounded text-[11px] ${lClass}">${escHtml(lVal)}</span>` : ''}
      </td>`;
    }
    if (maxDayInMonth > previewDays) rowsHtml += `<td class="px-2 py-1 text-center text-xs text-gray-400 bg-gray-50">…</td>`;
    rowsHtml += `</tr>`;
  });

  tbody.innerHTML = rowsHtml;

  if (summary) {
    summary.textContent = `Showing ${employeeMap.size} staff members across ${maxDayInMonth} days (Rymnet Matrix format)`;
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── DOWNLOAD RYMNET MATRIX CSV ───────────────────────────────────────────────
function downloadRymnetCSV() {
  if (!rosterFlatRecords.length) {
    alert('No records to export. Please upload a roster file first.');
    return;
  }

  const monthVal  = document.getElementById('rosterMonth')?.value  || '2026-09';
  const branchVal = document.getElementById('rosterBranchCode')?.value?.trim() || 'KS01';

  const [yearStr, monthStr] = monthVal.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const maxDayInMonth = new Date(year, month, 0).getDate();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 1. Generate Header: Employee No,Employee Name,01 (Tue),02 (Wed),...30 (Wed),
  const headerCols = ['Employee No', 'Employee Name'];
  for (let d = 1; d <= maxDayInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    const dayName = dayNames[dt.getDay()];
    headerCols.push(`${String(d).padStart(2, '0')} (${dayName})`);
  }
  headerCols.push(''); // Trailing comma matching official format
  const lines = [headerCols.join(',')];

  // 2. Group records by employee (seed with branch staff first)
  const employeeMap = new Map();

  const branchStaff = STAFF_MAP.filter(s => !s.branchCode || s.branchCode === branchVal);
  (branchStaff.length > 0 ? branchStaff : STAFF_MAP).forEach(s => {
    employeeMap.set(s.empNo, {
      empNo: s.empNo,
      empName: s.empName,
      days: {}
    });
  });

  rosterFlatRecords.forEach(rec => {
    if (!employeeMap.has(rec.empNo)) {
      employeeMap.set(rec.empNo, {
        empNo: rec.empNo,
        empName: rec.empName,
        days: {}
      });
    }
    employeeMap.get(rec.empNo).days[rec.day] = rec;
  });

  // 3. For each employee, generate paired Shift row and Leave row
  employeeMap.forEach(emp => {
    const shiftRow = [emp.empNo, `"${emp.empName.replace(/"/g, '""')}"`];
    const leaveRow = ['', ''];

    for (let d = 1; d <= maxDayInMonth; d++) {
      const rec = emp.days[d];
      let sVal = '';
      let lVal = '';

      if (rec) {
        sVal = rec.shiftCode || '';
        lVal = rec.leaveCode || '';

        // If sVal is actually a leave code (e.g. RD, OD, OFF, SL, ANL)
        if (['RD', 'OD', 'OFF', 'ANL', 'AL', 'SL', 'MC', 'PH', 'RPL', 'BL', 'EL', 'UPL', 'TRG'].includes(sVal.toUpperCase())) {
          if (!lVal) lVal = sVal;
          sVal = '';
        }

        // Normalize leave codes for Rymnet
        if (lVal.toUpperCase() === 'OFF') lVal = 'RD';
        if (lVal.toUpperCase() === 'AL')  lVal = 'ANL';
        if (lVal.toUpperCase() === 'MC')  lVal = 'SL';

      } else {
        // Default unscheduled day is Rest Day
        sVal = '';
        lVal = 'RD';
      }

      shiftRow.push(sVal);
      leaveRow.push(lVal);
    }

    shiftRow.push(''); // Trailing comma
    leaveRow.push(''); // Trailing comma

    lines.push(shiftRow.join(','));
    lines.push(leaveRow.join(','));
  });

  const csvContent = lines.join('\r\n') + '\r\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `rymnet_monthly_schedule_${branchVal}_${monthVal}.csv`);

  const dlBtn = document.getElementById('rosterDownloadBtn');
  if (dlBtn) {
    const orig = dlBtn.innerHTML;
    dlBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Downloaded Rymnet Matrix!';
    dlBtn.disabled = true;
    setTimeout(() => { dlBtn.innerHTML = orig; dlBtn.disabled = false; }, 3000);
  }
}
