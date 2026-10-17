const ExcelJS = require('../js/exceljs.min.js');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Visual_Timeline');

  sheet.columns = [
    { header: 'DAY', key: 'day', width: 16 },
    { header: 'OFF', key: 'off', width: 16 },
    { header: '7.30-8.30AM', key: 'c1', width: 14 },
    { header: '8.30-9.30AM', key: 'c2', width: 14 },
    { header: '9.30-10.30AM', key: 'c3', width: 14 },
    { header: '10.30-11.30AM', key: 'c4', width: 14 },
    { header: '11.30-12.30PM', key: 'c5', width: 14 },
    { header: '12.30-1.30PM', key: 'c6', width: 14 },
    { header: '1.30-2.30PM', key: 'c7', width: 14 },
    { header: '2.30-3.30PM', key: 'c8', width: 14 },
    { header: '3.30-4.30PM', key: 'c9', width: 14 },
    { header: '4.30-5.30PM', key: 'c10', width: 14 },
    { header: '5.30-6.30PM', key: 'c11', width: 14 },
    { header: '6.30-7.30PM', key: 'c12', width: 14 },
    { header: '7.30-8.30PM', key: 'c13', width: 14 },
    { header: '8.30-9.30PM', key: 'c14', width: 14 },
    { header: 'HALF DAY', key: 'half', width: 16 },
    { header: 'NOTES', key: 'notes', width: 30 }
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell, colNum) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  console.log('Success! Buffer length:', buffer.length);
}

test().catch(err => console.error(err));
