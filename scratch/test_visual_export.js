const ExcelJS = require('../js/exceljs.min.js');

async function testFullExport() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PMG Management Hub';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Visual_Timeline', {
    views: [{ showGridLines: true }]
  });

  const headers = [
    'DAY', 'OFF',
    '7.30-8.30AM', '8.30-9.30AM', '9.30-10.30AM', '10.30-11.30AM', '11.30-12.30PM',
    '12.30-1.30PM',
    '1.30-2.30PM', '2.30-3.30PM', '3.30-4.30PM',
    '4.30-5.30PM', '5.30-6.30PM', '6.30-7.30PM', '7.30-8.30PM', '8.30-9.30PM',
    'HALF DAY', 'NOTES'
  ];

  sheet.columns = [
    { header: headers[0], width: 15 },
    { header: headers[1], width: 14 },
    { header: headers[2], width: 13 },
    { header: headers[3], width: 13 },
    { header: headers[4], width: 13 },
    { header: headers[5], width: 13 },
    { header: headers[6], width: 13 },
    { header: headers[7], width: 13 },
    { header: headers[8], width: 13 },
    { header: headers[9], width: 13 },
    { header: headers[10], width: 13 },
    { header: headers[11], width: 13 },
    { header: headers[12], width: 13 },
    { header: headers[13], width: 13 },
    { header: headers[14], width: 13 },
    { header: headers[15], width: 13 },
    { header: headers[16], width: 14 },
    { header: headers[17], width: 28 }
  ];

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  const headerColors = [
    'FF1E3A8A', // DAY
    'FFDC2626', // OFF
    'FF0284C7', 'FF0284C7', 'FF0284C7', 'FF0284C7', 'FF0284C7', // Morning
    'FFD97706', // 12.30-1.30PM
    'FF2563EB', 'FF2563EB', // Afternoon
    'FFEA580C', // 3.30-4.30PM
    'FF4F46E5', 'FF4F46E5', 'FF4F46E5', 'FF4F46E5', 'FF4F46E5', // Night
    'FF7C3AED', // HALF DAY
    'FF0F766E'  // NOTES
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNum) => {
    const bg = headerColors[colNum - 1] || 'FF1E3A8A';
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // Sample Day Data
  const sampleDays = [
    {
      date: '2026-10-01',
      dayOfWeek: 'Thursday',
      isHoliday: false,
      holidayName: '',
      off: ['JANET', 'FIONA'],
      halfDay: ['PENNY'],
      morningStaff: [
        { nickname: 'WILLIAM', isPharm: true, isHalf: false },
        { nickname: 'TING', isPharm: false, isHalf: false },
        { nickname: 'PENNY', isPharm: false, isHalf: true }
      ],
      nightStaff: [
        { nickname: 'KENIX', isPharm: true, isHalf: false },
        { nickname: 'LOUNA', isPharm: false, isHalf: false },
        { nickname: 'FARIZIN', isPharm: false, isHalf: false }
      ]
    },
    {
      date: '2026-10-02',
      dayOfWeek: 'Friday',
      isHoliday: true,
      holidayName: 'Public Holiday Example',
      off: ['PENNY', 'NURHAFIZAH'],
      halfDay: [],
      morningStaff: [
        { nickname: 'WILLIAM', isPharm: true, isHalf: false },
        { nickname: 'TING', isPharm: false, isHalf: false }
      ],
      nightStaff: [
        { nickname: 'KENIX', isPharm: true, isHalf: false },
        { nickname: 'LOUNA', isPharm: false, isHalf: false }
      ]
    }
  ];

  let currentLine = 2;

  sampleDays.forEach(d => {
    const working = [...d.morningStaff, ...d.nightStaff];
    const dayRowCount = Math.max(working.length, d.off.length, d.halfDay.length, 6);
    const startRow = currentLine;
    const endRow = currentLine + dayRowCount - 1;

    // Determine Day styling
    let dayBg = 'FFF8FAFC';
    let dayFg = 'FF0F172A';
    if (d.isHoliday) {
      dayBg = 'FFFFE4E6';
      dayFg = 'FFBE123C';
    } else if (d.dayOfWeek === 'Sunday') {
      dayBg = 'FFFEE2E2';
      dayFg = 'FF991B1B';
    } else if (d.dayOfWeek === 'Saturday') {
      dayBg = 'FFFEF9C3';
      dayFg = 'FF854D0E';
    }

    const [y, m, dayNum] = d.date.split('-');
    const dayLabel = `${d.dayOfWeek.slice(0, 3).toUpperCase()}\n${dayNum}.${m}.${y}`;

    for (let r = 0; r < dayRowCount; r++) {
      const rowNum = currentLine + r;
      const row = sheet.getRow(rowNum);
      row.height = 24;

      // Col 1: DAY
      const dayCell = row.getCell(1);
      if (r === 0) dayCell.value = dayLabel;
      dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayBg } };
      dayCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: dayFg } };
      dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      dayCell.border = thinBorder;

      // Col 2: OFF
      const offCell = row.getCell(2);
      if (r < d.off.length) {
        offCell.value = d.off[r];
        offCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        offCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
      } else {
        offCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
      offCell.alignment = { horizontal: 'center', vertical: 'middle' };
      offCell.border = thinBorder;

      // Cols 3 to 16: Hourly timeline
      const staff = r < working.length ? working[r] : null;
      for (let c = 3; c <= 16; c++) {
        const timeCell = row.getCell(c);
        timeCell.border = thinBorder;
        timeCell.alignment = { horizontal: 'center', vertical: 'middle' };

        if (!staff) {
          timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          continue;
        }

        const nick = staff.nickname;
        let cellText = '';
        let cellBg = 'FFFFFFFF';
        let cellFg = 'FF000000';
        let isBold = true;

        // Staff badge colors
        let staffBg = staff.isPharm ? 'FFCFFAFE' : (staff.isHalf ? 'FFFFEDD5' : (d.morningStaff.includes(staff) ? 'FFDCFCE7' : 'FFEDE9FE'));
        let staffFg = staff.isPharm ? 'FF0E7490' : (staff.isHalf ? 'FFC2410C' : (d.morningStaff.includes(staff) ? 'FF15803D' : 'FF6D28D9'));

        if (staff.isHalf) {
          // Half day morning: 7.30 - 11.30 (Cols 3, 4, 5, 6)
          if (c >= 3 && c <= 6) {
            cellText = nick;
            cellBg = staffBg;
            cellFg = staffFg;
          }
        } else if (d.morningStaff.includes(staff)) {
          // Morning full shift:
          if (c >= 3 && c <= 7) {
            cellText = nick;
            cellBg = staffBg;
            cellFg = staffFg;
          } else if (c === 8) {
            cellText = 'REST';
            cellBg = 'FFFEF08A';
            cellFg = 'FF854D0E';
          } else if (c >= 9 && c <= 11) {
            cellText = nick;
            cellBg = staffBg;
            cellFg = staffFg;
          }
        } else {
          // Night full shift:
          if (c >= 8 && c <= 10) {
            cellText = nick;
            cellBg = staffBg;
            cellFg = staffFg;
          } else if (c === 11) {
            cellText = 'REST';
            cellBg = 'FFFEF08A';
            cellFg = 'FF854D0E';
          } else if (c >= 12 && c <= 16) {
            cellText = nick;
            cellBg = staffBg;
            cellFg = staffFg;
          }
        }

        if (cellText) {
          timeCell.value = cellText;
          timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellBg } };
          timeCell.font = { name: 'Calibri', size: 10, bold: isBold, color: { argb: cellFg } };
        } else {
          timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }
      }

      // Col 17: HALF DAY
      const halfCell = row.getCell(17);
      if (r < d.halfDay.length) {
        halfCell.value = d.halfDay[r];
        halfCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
        halfCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF7E22CE' } };
      } else {
        halfCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
      halfCell.alignment = { horizontal: 'center', vertical: 'middle' };
      halfCell.border = thinBorder;

      // Col 18: NOTES
      const notesCell = row.getCell(18);
      if (r === 0 && d.holidayName) notesCell.value = d.holidayName;
      notesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: d.holidayName ? 'FFFFE4E6' : 'FFFFFFFF' } };
      notesCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFBE123C' } };
      notesCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      notesCell.border = thinBorder;
    }

    // Merges for this day
    sheet.mergeCells(startRow, 1, endRow, 1);
    if (d.halfDay.length <= 1) {
      sheet.mergeCells(startRow, 17, endRow, 17);
    }
    if (d.holidayName) {
      sheet.mergeCells(startRow, 18, endRow, 18);
    }

    currentLine += dayRowCount;

    // Day divider row
    const divRow = sheet.getRow(currentLine);
    divRow.height = 6;
    for (let c = 1; c <= 18; c++) {
      const cell = divRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    }
    currentLine++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  console.log('Full styled export test succeeded! Buffer length:', buffer.length);
}

testFullExport().catch(console.error);
