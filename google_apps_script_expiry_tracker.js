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
    // ── ACTION: PROXY TEDA REPORT DATA ──
    const action = (e.parameter && e.parameter.action ? e.parameter.action : '').trim();
    if (action === 'proxyTeda') {
      const rid = (e.parameter.rid || '').trim();
      if (!rid) {
        return buildResponse({ success: false, error: 'Missing rid parameter' });
      }
      try {
        const endpoint = 'https://sg-app.qiaolz.com/report/result2?rid=' + encodeURIComponent(rid) + '&mac=&lang=&v=3.0.0';
        const res = UrlFetchApp.fetch(endpoint, {
          method: 'get',
          headers: {
            'Referer': 'https://sg-report.qiaolz.com/'
          },
          muteHttpExceptions: true
        });
        const bytes = res.getContent();
        const base64Data = Utilities.base64Encode(bytes);
        return buildResponse({ success: true, rid: rid, data: base64Data, size: bytes.length });
      } catch (fErr) {
        return buildResponse({ success: false, error: fErr.message });
      }
    }

    // ── ACTION: GET PATIENT APPOINTMENTS & TODAY QUEUE ──
    if (action === 'getAppointments') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let aptSheet = ss.getSheetByName('Patient_Appointments');
      if (!aptSheet) {
        return buildResponse({ success: true, count: 0, appointments: [] });
      }
      const data = aptSheet.getDataRange().getValues();
      if (data.length <= 1) return buildResponse({ success: true, count: 0, appointments: [] });

      const branchParam = (e.parameter.branch || '').trim().toLowerCase();
      const dateParam = (e.parameter.date || '').trim();

      const apts = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        const aptStatus = String(row[11] || 'Scheduled').trim();
        if (aptStatus === 'DELETED') continue;

        const b = String(row[5] || '').trim();
        const d = String(row[6] || '').trim();

        if (branchParam && branchParam !== 'all' && b.toLowerCase() !== branchParam) continue;
        if (dateParam && dateParam !== 'all' && d !== dateParam) continue;

        apts.push({
          rowId: i + 1,
          id: String(row[0] || ''),
          patientId: String(row[1] || ''),
          patientName: String(row[2] || ''),
          patientPhone: String(row[3] || ''),
          patientIc: String(row[4] || ''),
          branch: b || 'Kota Sentosa',
          date: d,
          time: String(row[7] || ''),
          purpose: String(row[8] || ''),
          service: String(row[9] || ''),
          pharmacist: String(row[10] || ''),
          status: String(row[11] || 'Scheduled'),
          statusUpdatedAt: String(row[12] || ''),
          notes: String(row[13] || ''),
          bookingType: String(row[14] || 'in_person'),
          createdAt: String(row[15] || ''),
          lastUpdated: String(row[16] || ''),
          updatedBy: String(row[17] || '')
        });
      }
      return buildResponse({ success: true, count: apts.length, appointments: apts });
    }

    // ── ACTION: GET PRICING MATRIX ──
    if (action === 'getPricingMatrix') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let pSheet = ss.getSheetByName('Pricing_Matrix');
      if (!pSheet) {
        return buildResponse({ success: true, count: 0, skus: [] });
      }
      const data = pSheet.getDataRange().getValues();
      if (data.length <= 1) return buildResponse({ success: true, count: 0, skus: [] });

      const skus = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || (!row[0] && !row[1])) continue;
        const code = String(row[0] || '').trim();
        const name = String(row[1] || '').trim();
        const cost = parseFloat(row[5]) || 0;
        const sp = parseFloat(row[6]) || 0;
        const nonMemberSp = parseFloat(row[7]) || (sp > 0 ? parseFloat((sp * 1.1).toFixed(2)) : 0);

        skus.push({
          rowId: i + 1,
          id: 'sku-' + (code ? code.replace(/[^a-zA-Z0-9_-]/g, '_') : i),
          code: code || 'N/A',
          name: name || 'Untitled Item',
          brand: String(row[2] || 'General').trim(),
          category: String(row[3] || 'General OTC').trim(),
          supplier: String(row[4] || 'Direct').trim(),
          costPrice: cost,
          standardSp: sp,
          currentBranchSp: sp,
          nonMemberSp: nonMemberSp,
          supermarketPrice: row[9] ? parseFloat(row[9]) : null,
          chainPharmacyPrice: row[10] ? parseFloat(row[10]) : null,
          strategyTag: String(row[11] || 'core_rx').trim(),
          competitorName: String(row[12] || 'Farley / Emart / Watsons').trim(),
          notes: String(row[13] || '').trim(),
          lastUpdated: String(row[14] || ''),
          updatedBy: String(row[15] || '')
        });
      }
      return buildResponse({ success: true, count: skus.length, skus: skus });
    }

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
      if (status) {
        const sLower = status.toLowerCase();
        const rLower = rStatus.toLowerCase();
        if (sLower === 'active') {
          if (rLower === 'cleared' || rLower === 'done' || rLower === 'completed') continue;
        } else if (rLower !== sLower) {
          continue;
        }
      }

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

    // ── ACTION: UPDATE QTY / MARK CLEARED / UPDATE EXPIRY / UPDATE ITEM ──
    if (action === 'update_qty' || action === 'mark_cleared' || action === 'update_expiry' || action === 'update_item' || action === 'updateExpiryItem') {
      const rowId = parseInt(payload.rowId, 10);
      const isMarkCleared = action === 'mark_cleared' || payload.subAction === 'mark_cleared' || String(payload.status).toUpperCase() === 'DONE' || String(payload.status).toUpperCase() === 'CLEARED' || String(payload.status).toUpperCase() === 'COMPLETED';
      const newQty = isMarkCleared ? 0 : (payload.quantity !== undefined ? parseFloat(payload.quantity) : null);
      const newExp = payload.expiryDate ? formatDate(payload.expiryDate) : null;
      const newCode = payload.itemCode ? String(payload.itemCode).trim() : null;
      const newDesc = payload.itemDescription ? String(payload.itemDescription).trim() : null;
      const newBatch = payload.batchNumber ? String(payload.batchNumber).trim() : null;
      const newStatus = isMarkCleared ? (payload.status || 'DONE') : (payload.status || 'Active');

      let targetRow = (rowId > 1 && rowId <= sheet.getLastRow()) ? rowId : 0;

      // Fallback: search for row by Item Code + Batch + Branch if rowId is out of bounds
      if (targetRow === 0 && (payload.itemCode || payload.batchNumber || payload.itemDescription)) {
        const data = sheet.getDataRange().getValues();
        const targetCode = (payload.itemCode ? String(payload.itemCode).trim().toUpperCase() : '');
        const targetBranch = (payload.branch ? String(payload.branch).trim().toLowerCase() : '');

        for (let i = 1; i < data.length; i++) {
          const r = data[i];
          const rCode = String(r[2] || '').trim().toUpperCase();
          const rBranch = String(r[0] || '').trim().toLowerCase();
          const matchBranch = !targetBranch || targetBranch === 'all' || rBranch === targetBranch;

          if (targetCode && targetCode !== 'N/A' && rCode === targetCode && matchBranch) {
            targetRow = i + 1;
            break;
          }
        }
      }

      if (targetRow > 1) {
        if (newCode !== null && newCode !== '') sheet.getRange(targetRow, 3).setValue(newCode);
        if (newDesc !== null && newDesc !== '') sheet.getRange(targetRow, 4).setValue(newDesc);
        if (newBatch !== null && newBatch !== '') sheet.getRange(targetRow, 2).setValue(newBatch);
        if (newExp !== null && newExp !== '') sheet.getRange(targetRow, 5).setValue(newExp);
        if (newQty !== null && !isNaN(newQty)) sheet.getRange(targetRow, 6).setValue(newQty);
        sheet.getRange(targetRow, 8).setValue(newStatus);
        sheet.getRange(targetRow, 9).setValue(now);
        sheet.getRange(targetRow, 10).setValue(updatedBy);
        SpreadsheetApp.flush();
        if (!payload.skipDistribution) distributeToMonthlyTabs(ss);
        return buildResponse({ success: true, rowId: targetRow, status: newStatus, expiryDate: newExp, quantity: newQty });
      }

      // If item was being marked cleared/done but was not in sheet yet, append row as DONE
      if (isMarkCleared && (payload.itemCode || payload.itemDescription)) {
        sheet.appendRow([
          payload.branch || 'Kota Sentosa',
          payload.batchNumber || 'N/A',
          payload.itemCode || 'N/A',
          payload.itemDescription || '',
          formatDate(payload.expiryDate),
          0,
          'Manual Clearance',
          newStatus,
          now,
          updatedBy
        ]);
        SpreadsheetApp.flush();
        targetRow = sheet.getLastRow();
        return buildResponse({ success: true, rowId: targetRow, status: newStatus, message: 'Row appended and marked ' + newStatus });
      }
    }

    // ── ACTION: UPDATE APPOINTMENT STATUS (TICK / COMPLETE / MISSED) ──
    if (action === 'updateAppointmentStatus') {
      const aptSheet = ss.getSheetByName('Patient_Appointments') || ss.insertSheet('Patient_Appointments');
      const aptId = String(payload.appointmentId || '').trim();
      const newStatus = String(payload.status || 'Completed').trim();
      const statusUpdatedAt = payload.statusUpdatedAt || now;
      const data = aptSheet.getDataRange().getValues();

      let foundRow = 0;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === aptId) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 1) {
        aptSheet.getRange(foundRow, 12).setValue(newStatus); // Status
        aptSheet.getRange(foundRow, 13).setValue(statusUpdatedAt); // StatusUpdatedAt
        aptSheet.getRange(foundRow, 17).setValue(now); // LastUpdated
        aptSheet.getRange(foundRow, 18).setValue(updatedBy); // UpdatedBy
      } else if (payload.appointment) {
        const a = payload.appointment;
        aptSheet.appendRow([
          aptId,
          a.patientId || '',
          a.patientName || '',
          a.patientPhone || '',
          a.patientIc || '',
          a.branch || 'Kota Sentosa',
          a.date || '',
          a.time || '',
          a.purpose || '',
          a.service || '',
          a.pharmacist || '',
          newStatus,
          statusUpdatedAt,
          a.notes || '',
          a.bookingType || 'in_person',
          a.createdAt || now,
          now,
          updatedBy
        ]);
      }
      return buildResponse({ success: true, appointmentId: aptId, status: newStatus, statusUpdatedAt: statusUpdatedAt });
    }

    // ── ACTION: SAVE APPOINTMENTS BATCH ──
    if (action === 'saveAppointments') {
      const aptSheet = ss.getSheetByName('Patient_Appointments') || ss.insertSheet('Patient_Appointments');
      const appointments = payload.appointments || [];
      const data = aptSheet.getDataRange().getValues();
      const aptMap = new Map();
      for (let i = 1; i < data.length; i++) {
        const id = String(data[i][0]).trim();
        if (id) aptMap.set(id, i + 1);
      }

      appointments.forEach(a => {
        const id = String(a.id || '').trim();
        if (!id) return;
        const rowVals = [
          id,
          a.patientId || '',
          a.patientName || '',
          a.patientPhone || '',
          a.patientIc || '',
          a.branch || 'Kota Sentosa',
          a.date || '',
          a.time || '',
          a.purpose || '',
          a.service || '',
          a.pharmacist || '',
          a.status || 'Scheduled',
          a.statusUpdatedAt || now,
          a.notes || '',
          a.bookingType || 'in_person',
          a.createdAt || now,
          now,
          updatedBy
        ];
        if (aptMap.has(id)) {
          const rNum = aptMap.get(id);
          aptSheet.getRange(rNum, 1, 1, rowVals.length).setValues([rowVals]);
        } else {
          aptSheet.appendRow(rowVals);
          aptMap.set(id, aptSheet.getLastRow());
        }
      });
      return buildResponse({ success: true, count: appointments.length });
    }

    // ── ACTION: SAVE PRICING MATRIX ──
    if (action === 'savePricingMatrix') {
      const pSheet = ss.getSheetByName('Pricing_Matrix') || ss.insertSheet('Pricing_Matrix');
      const skus = payload.skus || [];
      const pricingHeaders = ['Item Code', 'Item Name', 'Brand', 'Category', 'Supplier', 'Custom Cost', 'Member Price', 'Non-Member Price', 'Gross Margin (%)', 'Supermarket Price', 'Chain Pharmacy Price', 'Strategy Tag', 'Competitor Name', 'Notes', 'LastUpdated', 'UpdatedBy'];

      pSheet.clear();
      pSheet.appendRow(pricingHeaders);
      pSheet.getRange(1, 1, 1, pricingHeaders.length).setFontWeight('bold');

      const rowsToAdd = [];
      skus.forEach(s => {
        const cost = parseFloat(s.costPrice) || 0;
        const sp = parseFloat(s.standardSp) || 0;
        const margin = sp > 0 ? (((sp - cost) / sp) * 100).toFixed(2) + '%' : '0.00%';
        rowsToAdd.push([
          s.code || '',
          s.name || '',
          s.brand || 'General',
          s.category || 'General OTC',
          s.supplier || 'Direct',
          cost,
          sp,
          parseFloat(s.nonMemberSp) || sp,
          margin,
          s.supermarketPrice ? parseFloat(s.supermarketPrice) : '',
          s.chainPharmacyPrice ? parseFloat(s.chainPharmacyPrice) : '',
          s.strategyTag || 'core_rx',
          s.competitorName || 'Farley / Emart / Watsons',
          s.notes || '',
          now,
          updatedBy
        ]);
      });

      if (rowsToAdd.length > 0) {
        pSheet.getRange(2, 1, rowsToAdd.length, pricingHeaders.length).setValues(rowsToAdd);
      }
      return buildResponse({ success: true, count: rowsToAdd.length });
    }

    // ── ACTION: DELETE PATIENT PROFILE (CASCADE HARD DELETION) ──
    if (action === 'deletePatient') {
      const patientId = String(payload.patientId || '').trim();
      const patientIc = String(payload.patientIc || '').replace(/\D/g, '');
      const patientName = String(payload.patientName || '').trim();
      const patientNameLower = patientName.toLowerCase();
      const patientPhone = String(payload.patientPhone || payload.phone || '').trim();
      const patientPhoneClean = patientPhone.replace(/\D/g, '');
      const branch = String(payload.branch || 'Kota Sentosa').trim();

      if (!patientId && !patientIc && !patientName && !patientPhone) {
        return buildResponse({ success: false, error: 'Missing patient identification (ID, IC, Name, or Phone)' });
      }

      let totalDeletedRows = 0;
      const tabDetails = {};
      const tabErrors = [];

      function rowMatchesPatient(rowVals) {
        if (!rowVals || !rowVals.length) return false;
        for (let col = 0; col < rowVals.length; col++) {
          const val = rowVals[col];
          if (val === null || val === undefined || val === '') continue;
          const valStr = String(val).trim();
          const valLower = valStr.toLowerCase();
          const valDigits = valStr.replace(/\D/g, '');

          // 1. Exact ID match (case-insensitive)
          if (patientId && (valStr === patientId || valLower === patientId.toLowerCase())) {
            return true;
          }

          // 2. Name match (case-insensitive)
          if (patientNameLower && (valLower === patientNameLower || valLower.includes(patientNameLower))) {
            return true;
          }

          // 3. IC match (digits comparison, min 6 digits)
          if (patientIc && patientIc.length >= 6 && valDigits === patientIc) {
            return true;
          }

          // 4. Phone match (exact digits or 8-digit suffix match)
          if (patientPhoneClean && patientPhoneClean.length >= 7) {
            if (valDigits === patientPhoneClean) return true;
            if (patientPhoneClean.length >= 8 && valDigits.length >= 8) {
              if (valDigits.endsWith(patientPhoneClean.slice(-8)) || patientPhoneClean.endsWith(valDigits.slice(-8))) {
                return true;
              }
            }
          }
        }
        return false;
      }

      function processTabDeletion(tabNameList) {
        tabNameList.forEach(tName => {
          try {
            const sheet = ss.getSheetByName(tName);
            if (!sheet || sheet.getLastRow() <= 1) return;

            const data = sheet.getDataRange().getValues();
            let countForTab = 0;

            for (let r = data.length - 1; r >= 1; r--) {
              const row = data[r];
              if (rowMatchesPatient(row)) {
                sheet.deleteRow(r + 1);
                countForTab++;
                totalDeletedRows++;
              }
            }
            if (countForTab > 0) {
              tabDetails[tName] = countForTab;
            }
          } catch (tErr) {
            tabErrors.push({ tab: tName, error: tErr.message });
          }
        });
      }

      // 1. 'Patients' (Master Directory)
      const patientDirTabs = ['Patients', 'Patients_Master', 'PatientsMaster', 'PatientProfiles', 'Patient Directory', 'Patient_Master'];
      processTabDeletion(patientDirTabs);

      // 2. 'Overdue_Refills' & 'Appointments' (Active & Missed refills)
      const overdueRefillTabs = [
        'Overdue & Missed Refills', 'Overdue_Refills', 'OverdueRefills',
        'Missed_Refills', 'Missed Refills', 'Refills', 'Active & Missed refills',
        'Overdue_Missed_Refills', 'Overdue Refills'
      ];
      processTabDeletion(overdueRefillTabs);

      const appointmentTabs = ['Patient_Appointments', 'Appointments', 'Patient Appointments'];
      processTabDeletion(appointmentTabs);

      // 3. 'SOAP_Encounters' / 'Consultation_History'
      const clinicalTabs = [
        'SOAP_Encounters', 'SOAP Encounters', 'SOAP',
        'Consultation_History', 'Consultation History', 'Consultations',
        'Encounters', 'Patient_Encounters'
      ];
      processTabDeletion(clinicalTabs);

      // 4. Remove bookings from PharmacistSchedule tab
      try {
        const schedSheet = ss.getSheetByName('PharmacistSchedule');
        if (schedSheet && schedSheet.getLastRow() > 1) {
          const sData = schedSheet.getDataRange().getValues();
          for (let r = 1; r < sData.length; r++) {
            const rowBranch = String(sData[r][0] || '').trim();
            if (rowBranch.toLowerCase() === branch.toLowerCase() || branch.toLowerCase() === 'all') {
              try {
                const sched = JSON.parse(sData[r][2]);
                if (sched && Array.isArray(sched.onlineBookings)) {
                  const prevLen = sched.onlineBookings.length;
                  sched.onlineBookings = sched.onlineBookings.filter(b => {
                    const bPatId = String(b.patientId || b.id || '').trim();
                    const bIc = String(b.patientIc || b.ic || '').replace(/\D/g, '');
                    const bName = String(b.patientName || b.name || '').trim().toLowerCase();
                    const bPhone = String(b.patientPhone || b.phone || '').replace(/\D/g, '');
                    if (patientId && bPatId === patientId) return false;
                    if (patientNameLower && bName === patientNameLower) return false;
                    if (patientIc && bIc && bIc === patientIc) return false;
                    if (patientPhoneClean && bPhone && bPhone === patientPhoneClean) return false;
                    return true;
                  });
                  if (sched.onlineBookings.length !== prevLen) {
                    schedSheet.getRange(r + 1, 3).setValue(JSON.stringify(sched));
                    schedSheet.getRange(r + 1, 4).setValue(now);
                    schedSheet.getRange(r + 1, 5).setValue(updatedBy);
                  }
                }
              } catch (_) {}
            }
          }
        }
      } catch (sErr) {
        tabErrors.push({ tab: 'PharmacistSchedule', error: sErr.message });
      }

      SpreadsheetApp.flush();

      return buildResponse({
        success: true,
        patientId: patientId,
        patientName: patientName,
        deletedRowsCount: totalDeletedRows,
        tabDetails: tabDetails,
        tabErrors: tabErrors,
        message: 'Patient profile cascade deletion committed to Google Sheet successfully.'
      });
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
