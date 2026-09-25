// ══════════════════════════════════════════════════════════════════════════════
// PMG Pharmacy - Master Stock Expiry Tracker & Monthly Categorizer Web API v2.0
// Sheet: Master_Expiry + Auto-generated Monthly Tabs (AUG 2026, SEP 2026, etc.)
// ══════════════════════════════════════════════════════════════════════════════

const MASTER_TAB = 'Master_Expiry';
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const HEADERS = ['Branch', 'Batch number', 'Item code', 'Item description', 'Expiry date', 'Quantity', 'Source File', 'Status', 'LastUpdated', 'UpdatedBy'];
const MONTHLY_HEADERS = ['Batch number', 'Item code', 'Item description', 'Expiry date', 'Quantity', 'Source File', 'Branch'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PMG Expiry Tracker')
    .addItem('🔄 Rebuild Monthly Tabs', 'menuRebuildTabs')
    .addItem('🧹 Clean/Reset Master Sheet', 'menuResetMaster')
    .addToUi();
}

function menuRebuildTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  distributeToMonthlyTabs(ss);
  SpreadsheetApp.getUi().alert('✅ Monthly tabs rebuilt successfully!');
}

function menuResetMaster() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert('Reset Master Sheet', 'Are you sure you want to clear Master_Expiry and remove test rows?', ui.ButtonSet.YES_NO);
  if (res === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(MASTER_TAB);
    if (sheet) sheet.clear();
    else sheet = ss.insertSheet(MASTER_TAB);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    ui.alert('Master sheet has been reset to empty with headers.');
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const branch = (e.parameter.branch || '').trim();
    const status = (e.parameter.status || '').trim(); // 'Active', 'Cleared', or '' (all)
    
    let sheet = ss.getSheetByName(MASTER_TAB);
    if (!sheet) {
      sheet = ss.insertSheet(MASTER_TAB);
      sheet.appendRow(HEADERS);
      return buildResponse({ success: true, count: 0, items: [] });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return buildResponse({ success: true, count: 0, items: [] });

    const headers = data[0].map(h => String(h).toLowerCase().trim());
    const branchIdx = headers.indexOf('branch');
    const batchIdx  = headers.indexOf('batch number');
    const codeIdx   = headers.indexOf('item code');
    const descIdx   = headers.indexOf('item description');
    const expIdx    = headers.indexOf('expiry date');
    const qtyIdx    = headers.indexOf('quantity');
    const fileIdx   = headers.indexOf('source file');
    const statIdx   = headers.indexOf('status');

    const items = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rBranch = String(row[branchIdx] || '').trim();
      const rStatus = String(row[statIdx] || 'Active').trim();

      if (branch && branch.toLowerCase() !== 'all' && rBranch.toLowerCase() !== branch.toLowerCase()) continue;
      if (status && rStatus.toLowerCase() !== status.toLowerCase()) continue;

      items.push({
        rowId: i + 1,
        branch: rBranch || 'Kota Sentosa',
        batchNumber: String(row[batchIdx] !== undefined ? row[batchIdx] : 'N/A'),
        itemCode: String(row[codeIdx] !== undefined ? row[codeIdx] : 'N/A'),
        itemDescription: String(row[descIdx] || ''),
        expiryDate: formatDate(row[expIdx]),
        quantity: parseFloat(row[qtyIdx]) || 0,
        sourceFile: String(row[fileIdx] || ''),
        status: rStatus || 'Active'
      });
    }

    return buildResponse({ success: true, count: items.length, items: items });
  } catch (err) {
    return buildResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'batch_insert';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(MASTER_TAB);
    if (!sheet) {
      sheet = ss.insertSheet(MASTER_TAB);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    const now = new Date().toISOString();
    const updatedBy = payload.updatedBy || 'Staff';

    // ── ACTION: CLEAR ALL ──
    if (action === 'clear_all') {
      sheet.clear();
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      return buildResponse({ success: true, message: 'Master sheet cleared.' });
    }

    // ── ACTION: BATCH INSERT ──
    if (action === 'batch_insert') {
      const items = payload.items || [];
      const rowsToAdd = [];
      items.forEach(it => {
        rowsToAdd.push([
          it.branch || 'Kota Sentosa',
          it.batchNumber || 'N/A',
          it.itemCode || 'N/A',
          it.itemDescription || it.itemName || '',
          formatDate(it.expiryDate),
          parseFloat(it.quantity) || 0,
          it.sourceFile || 'Direct Upload',
          it.status || 'Active',
          now,
          updatedBy
        ]);
      });

      if (rowsToAdd.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 10).setValues(rowsToAdd);
        if (!payload.skipDistribution) {
          distributeToMonthlyTabs(ss);
        }
      }
      return buildResponse({ success: true, count: rowsToAdd.length });
    }

    // ── ACTION: REBUILD MONTHLY TABS ──
    if (action === 'rebuild_tabs') {
      distributeToMonthlyTabs(ss);
      return buildResponse({ success: true, message: 'Monthly tabs rebuilt.' });
    }

    // ── ACTION: UPDATE QTY / MARK CLEARED ──
    if (action === 'update_qty' || action === 'mark_cleared') {
      const rowId = parseInt(payload.rowId, 10);
      const newQty = payload.quantity !== undefined ? parseFloat(payload.quantity) : null;
      const newStatus = action === 'mark_cleared' ? 'Cleared' : (payload.status || 'Active');

      if (rowId > 1 && rowId <= sheet.getLastRow()) {
        if (newQty !== null) sheet.getRange(rowId, 6).setValue(newQty);
        sheet.getRange(rowId, 8).setValue(newStatus);
        sheet.getRange(rowId, 9).setValue(now);
        sheet.getRange(rowId, 10).setValue(updatedBy);
        if (!payload.skipDistribution) distributeToMonthlyTabs(ss);
        return buildResponse({ success: true, rowId: rowId, status: newStatus });
      }
    }

    return buildResponse({ success: false, error: 'Unrecognized action or invalid rowId' });
  } catch (err) {
    return buildResponse({ success: false, error: err.message });
  }
}

function distributeToMonthlyTabs(ss) {
  const master = ss.getSheetByName(MASTER_TAB);
  if (!master || master.getLastRow() <= 1) return;

  const data = master.getDataRange().getValues();
  const rows = data.slice(1).filter(r => String(r[7]).trim() !== 'Cleared' && parseFloat(r[5]) > 0);
  const grouped = {};

  rows.forEach(r => {
    const expStr = formatDate(r[4]);
    const tab = getMonthYearTab(expStr);
    if (!grouped[tab]) grouped[tab] = [];
    grouped[tab].push([r[1], r[2], r[3], expStr, r[5], r[6], r[0]]);
  });

  for (const [tabName, tabRows] of Object.entries(grouped)) {
    if (tabName === 'UNSCHEDULED') continue;
    let tSheet = ss.getSheetByName(tabName);
    if (!tSheet) {
      tSheet = ss.insertSheet(tabName);
    }
    tSheet.clear();
    tSheet.appendRow(MONTHLY_HEADERS);
    tSheet.getRange(1, 1, 1, MONTHLY_HEADERS.length).setFontWeight('bold');
    if (tabRows.length > 0) {
      tSheet.getRange(2, 1, tabRows.length, MONTHLY_HEADERS.length).setValues(tabRows);
      tSheet.getRange(2, 4, tabRows.length, 1).setNumberFormat("@");
    }
  }
}

function formatDate(val) {
  if (!val || val === 'N/A') return 'N/A';
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(val).trim();
}

function getMonthYearTab(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'UNSCHEDULED';
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10) - 1;
    let y = parseInt(parts[2], 10);
    if (y < 100) y += 2000;
    if (m >= 0 && m <= 11) return `${MONTH_NAMES[m]} ${y}`;
  }
  return 'UNSCHEDULED';
}

function buildResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
