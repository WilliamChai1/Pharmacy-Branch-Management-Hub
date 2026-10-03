// ══════════════════════════════════════════════════════════════════════════════
// PMG Pharmacy — Pharmacist Schedule, Patient Appointments & Pricing Matrix API
// Sheet: Rymnet Conversion & PMG Walao
// Tabs: PharmacistSchedule, Patient_Appointments, Pricing_Matrix
// ══════════════════════════════════════════════════════════════════════════════

const TAB_SCHEDULE = 'PharmacistSchedule';
const TAB_APPOINTMENTS = 'Patient_Appointments';
const TAB_PRICING = 'Pricing_Matrix';
const TAB_RECRUITMENT = 'Job_Applications';
const TAB_PREFERENCES = 'Staff_Preferences';

const APPOINTMENT_HEADERS = [
  'AppointmentId', 'PatientId', 'PatientName', 'PatientPhone', 'PatientIc',
  'Branch', 'Date', 'Time', 'Purpose', 'Service', 'Pharmacist',
  'Status', 'StatusUpdatedAt', 'Notes', 'BookingType', 'CreatedAt',
  'LastUpdated', 'UpdatedBy'
];

const PRICING_HEADERS = [
  'Item Code', 'Item Name', 'Brand', 'Category', 'Supplier',
  'Custom Cost', 'Member Price', 'Non-Member Price', 'Gross Margin (%)',
  'Supermarket Price', 'Chain Pharmacy Price', 'Strategy Tag',
  'Competitor Name', 'Notes', 'LastUpdated', 'UpdatedBy'
];

const RECRUITMENT_HEADERS = [
  'ApplicationId', 'AppliedAt', 'Name', 'Position', 'Branch',
  'IC', 'Phone', 'Email', 'DOB', 'Age', 'Gender', 'Race',
  'Status', 'AIScore', 'AIVerdict', 'SPM', 'Education',
  'WorkHistory', 'Languages', 'Smoking', 'PayloadJSON', 'LastUpdated'
];

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action ? e.parameter.action : '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── 1. ACTION: GET APPOINTMENTS ──
    if (action === 'getAppointments') {
      const aptSheet = ss.getSheetByName(TAB_APPOINTMENTS);
      if (!aptSheet) {
        return buildResponse({ success: true, count: 0, appointments: [] });
      }
      const data = aptSheet.getDataRange().getValues();
      if (data.length <= 1) return buildResponse({ success: true, count: 0, appointments: [] });

      const branchParam = (e.parameter.branch || '').trim().toLowerCase();
      const appointments = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        const aptBranch = String(row[5] || '').trim();
        if (branchParam && branchParam !== 'all' && aptBranch.toLowerCase() !== branchParam) {
          continue;
        }

        appointments.push({
          id: String(row[0]).trim(),
          patientId: String(row[1] || '').trim(),
          patientName: String(row[2] || '').trim(),
          patientPhone: String(row[3] || '').trim(),
          patientIc: String(row[4] || '').trim(),
          branch: aptBranch || 'Kota Sentosa',
          date: formatDateStr(row[6]),
          time: String(row[7] || '').trim(),
          purpose: String(row[8] || '').trim(),
          service: String(row[9] || '').trim(),
          pharmacist: String(row[10] || '').trim(),
          status: String(row[11] || 'Scheduled').trim(),
          statusUpdatedAt: String(row[12] || '').trim(),
          notes: String(row[13] || '').trim(),
          bookingType: String(row[14] || 'in_person').trim(),
          createdAt: String(row[15] || '').trim(),
          lastUpdated: String(row[16] || '').trim(),
          updatedBy: String(row[17] || '').trim()
        });
      }
      return buildResponse({ success: true, count: appointments.length, appointments: appointments });
    }

    // ── 2. ACTION: GET PRICING MATRIX ──
    if (action === 'getPricingMatrix') {
      const pSheet = ss.getSheetByName(TAB_PRICING);
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
          competitorName: String(row[12] || 'Local Competitors').trim(),
          notes: String(row[13] || '').trim(),
          lastUpdated: String(row[14] || ''),
          updatedBy: String(row[15] || '')
        });
      }
      return buildResponse({ success: true, count: skus.length, skus: skus });
    }

    // ── 3. ACTION: GET JOB APPLICATIONS ──
    if (action === 'getJobApplications') {
      const recSheet = ss.getSheetByName(TAB_RECRUITMENT);
      if (!recSheet) {
        return buildResponse({ success: true, count: 0, applications: [] });
      }
      const data = recSheet.getDataRange().getValues();
      if (data.length <= 1) return buildResponse({ success: true, count: 0, applications: [] });

      const apps = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        let appObj = null;
        try {
          if (row[20]) appObj = JSON.parse(row[20]);
        } catch (_) {}

        if (!appObj) {
          appObj = {
            id: String(row[0]).trim(),
            appliedAt: String(row[1] || '').trim(),
            name: String(row[2] || '').trim(),
            position: String(row[3] || '').trim(),
            preferredBranch: String(row[4] || 'Kota Sentosa').trim(),
            ic: String(row[5] || '').trim(),
            phone: String(row[6] || '').trim(),
            email: String(row[7] || '').trim(),
            dob: String(row[8] || '').trim(),
            age: row[9] || '',
            gender: String(row[10] || '').trim(),
            race: String(row[11] || '').trim(),
            status: String(row[12] || 'new').trim(),
            aiScore: row[13] || null,
            aiVerdict: String(row[14] || '').trim(),
            spm: String(row[15] || '').trim(),
            highestQual: String(row[16] || '').trim(),
            workHistory: String(row[17] || '').trim(),
            languages: String(row[18] || '').trim(),
            smokes: String(row[19] || 'No').trim()
          };
        }
        apps.push(appObj);
      }
      return buildResponse({ success: true, count: apps.length, applications: apps });
    }

    // ── 4. ACTION: GET STAFF PREFERENCES ──
    if (action === 'getStaffPreferences') {
      const prefSheet = ss.getSheetByName(TAB_PREFERENCES);
      if (!prefSheet) {
        return buildResponse({ success: true, preferences: [] });
      }
      const data = prefSheet.getDataRange().getValues();
      const branchParam = (e.parameter.branch || 'KS01').trim().toUpperCase();
      let prefs = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && String(row[0]).trim().toUpperCase() === branchParam) {
          try {
            prefs = JSON.parse(row[1]);
          } catch (_) {}
          break;
        }
      }
      return buildResponse({ success: true, preferences: prefs });
    }

    // ── 5. DEFAULT: GET PHARMACIST SCHEDULE ──
    const branch = (e.parameter.branch || 'Kota Sentosa').trim();
    let sheet = ss.getSheetByName(TAB_SCHEDULE);

    if (!sheet) {
      sheet = ss.insertSheet(TAB_SCHEDULE);
      sheet.appendRow(['BranchCode', 'BranchName', 'ScheduleJSON', 'LastUpdated', 'UpdatedBy']);
      return buildResponse({ success: false, error: 'Sheet just created, no data yet.' });
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowBranch = String(data[i][0] || '').trim();
      if (rowBranch.toLowerCase() === branch.toLowerCase()) {
        let sched;
        try { sched = JSON.parse(data[i][2]); } catch(_) { sched = null; }
        return buildResponse({
          success: true,
          branch: rowBranch,
          schedule: sched,
          lastUpdated: data[i][3],
          updatedBy: data[i][4]
        });
      }
    }

    return buildResponse({ success: false, error: 'Branch not found: ' + branch });
  } catch(err) {
    return buildResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date().toISOString();
    const updatedBy = payload.updatedBy || 'Staff';

    // ── 1. ACTION: UPDATE APPOINTMENT STATUS (TICK / COMPLETE / MISSED) ──
    if (action === 'updateAppointmentStatus') {
      const aptSheet = ss.getSheetByName(TAB_APPOINTMENTS) || ss.insertSheet(TAB_APPOINTMENTS);
      if (aptSheet.getLastRow() === 0) {
        aptSheet.appendRow(APPOINTMENT_HEADERS);
        aptSheet.getRange(1, 1, 1, APPOINTMENT_HEADERS.length).setFontWeight('bold');
      }

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
          formatDateStr(a.date),
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

      // Also sync status inside PharmacistSchedule onlineBookings if present
      try {
        const branch = payload.branch || (payload.appointment && payload.appointment.branch) || 'Kota Sentosa';
        const schedSheet = ss.getSheetByName(TAB_SCHEDULE);
        if (schedSheet) {
          const sData = schedSheet.getDataRange().getValues();
          for (let i = 1; i < sData.length; i++) {
            if (String(sData[i][0]).toLowerCase().trim() === branch.toLowerCase().trim()) {
              let sched = null;
              try { sched = JSON.parse(sData[i][2]); } catch(_) {}
              if (sched && Array.isArray(sched.onlineBookings)) {
                let modified = false;
                sched.onlineBookings.forEach(b => {
                  if ((b.id && b.id === aptId) || (b.ref && b.ref === aptId)) {
                    b.status = newStatus;
                    b.statusUpdatedAt = statusUpdatedAt;
                    modified = true;
                  }
                });
                if (modified) {
                  sched.lastUpdated = now;
                  schedSheet.getRange(i + 1, 3).setValue(JSON.stringify(sched));
                  schedSheet.getRange(i + 1, 4).setValue(now);
                  schedSheet.getRange(i + 1, 5).setValue(updatedBy);
                }
              }
              break;
            }
          }
        }
      } catch(e) {
        // Non-fatal
      }

      return buildResponse({ success: true, appointmentId: aptId, status: newStatus, statusUpdatedAt: statusUpdatedAt });
    }

    // ── 2. ACTION: SAVE APPOINTMENTS BATCH ──
    if (action === 'saveAppointments') {
      const aptSheet = ss.getSheetByName(TAB_APPOINTMENTS) || ss.insertSheet(TAB_APPOINTMENTS);
      if (aptSheet.getLastRow() === 0) {
        aptSheet.appendRow(APPOINTMENT_HEADERS);
        aptSheet.getRange(1, 1, 1, APPOINTMENT_HEADERS.length).setFontWeight('bold');
      }
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
          formatDateStr(a.date),
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

    // ── 3. ACTION: SAVE PRICING MATRIX ──
    if (action === 'savePricingMatrix') {
      const pSheet = ss.getSheetByName(TAB_PRICING) || ss.insertSheet(TAB_PRICING);
      const skus = payload.skus || [];

      pSheet.clear();
      pSheet.appendRow(PRICING_HEADERS);
      pSheet.getRange(1, 1, 1, PRICING_HEADERS.length).setFontWeight('bold');

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
          s.competitorName || 'Local Competitors',
          s.notes || '',
          now,
          updatedBy
        ]);
      });

      if (rowsToAdd.length > 0) {
        pSheet.getRange(2, 1, rowsToAdd.length, PRICING_HEADERS.length).setValues(rowsToAdd);
      }
      return buildResponse({ success: true, count: rowsToAdd.length });
    }

    // ── 4. ACTION: SUBMIT JOB APPLICATION ──
    if (action === 'submitJobApplication') {
      const recSheet = ss.getSheetByName(TAB_RECRUITMENT) || ss.insertSheet(TAB_RECRUITMENT);
      if (recSheet.getLastRow() === 0) {
        recSheet.appendRow(RECRUITMENT_HEADERS);
        recSheet.getRange(1, 1, 1, RECRUITMENT_HEADERS.length).setFontWeight('bold');
      }

      const a = payload.application || {};
      const appId = String(a.id || ('APP-' + Date.now())).trim();
      const payloadStr = JSON.stringify(a);

      const data = recSheet.getDataRange().getValues();
      let foundRow = 0;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === appId) {
          foundRow = i + 1;
          break;
        }
      }

      const rowValues = [
        appId,
        a.appliedAt || now,
        a.name || '',
        a.position || '',
        a.preferredBranch || 'Kota Sentosa',
        a.ic || '',
        a.phone || '',
        a.email || '',
        a.dob || '',
        a.age || '',
        a.gender || '',
        a.race || '',
        a.status || 'new',
        a.aiScore || '',
        a.aiVerdict || '',
        a.spm || '',
        a.highestQual || '',
        a.workHistory || '',
        a.languages || '',
        a.smokes || 'No',
        payloadStr,
        now
      ];

      if (foundRow > 1) {
        recSheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        recSheet.appendRow(rowValues);
      }

      return buildResponse({ success: true, applicationId: appId });
    }

    // ── 5. ACTION: SAVE STAFF PREFERENCES ──
    if (action === 'saveStaffPreferences') {
      const prefSheet = ss.getSheetByName(TAB_PREFERENCES) || ss.insertSheet(TAB_PREFERENCES);
      if (prefSheet.getLastRow() === 0) {
        prefSheet.appendRow(['BranchCode', 'PreferencesJSON', 'LastUpdated', 'UpdatedBy']);
        prefSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      }

      const branchCode = String(payload.branch || 'KS01').trim().toUpperCase();
      const prefsStr = JSON.stringify(payload.preferences || []);
      const pData = prefSheet.getDataRange().getValues();

      let foundRow = 0;
      for (let i = 1; i < pData.length; i++) {
        if (String(pData[i][0]).trim().toUpperCase() === branchCode) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 1) {
        prefSheet.getRange(foundRow, 2).setValue(prefsStr);
        prefSheet.getRange(foundRow, 3).setValue(now);
        prefSheet.getRange(foundRow, 4).setValue(updatedBy);
      } else {
        prefSheet.appendRow([branchCode, prefsStr, now, updatedBy]);
      }

      return buildResponse({ success: true, branch: branchCode });
    }

    // ── 6. DEFAULT: SAVE PHARMACIST SCHEDULE ──
    const branch = (payload.branch || 'Kota Sentosa').trim();
    const sched = payload.schedule;

    if (!sched) return buildResponse({ success: false, error: 'No schedule or recognized action provided.' });

    let sheet = ss.getSheetByName(TAB_SCHEDULE);
    if (!sheet) {
      sheet = ss.insertSheet(TAB_SCHEDULE);
      sheet.appendRow(['BranchCode', 'BranchName', 'ScheduleJSON', 'LastUpdated', 'UpdatedBy']);
    }

    const schedJson = JSON.stringify(sched);
    const branchName = sched.branchName || branch;
    const data = sheet.getDataRange().getValues();

    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim().toLowerCase() === branch.toLowerCase()) {
        sheet.getRange(i + 1, 1, 1, 5).setValues([[branch, branchName, schedJson, now, updatedBy]]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([branch, branchName, schedJson, now, updatedBy]);
    return buildResponse({ success: true, branch: branch, lastUpdated: now });
  } catch(err) {
    return buildResponse({ success: false, error: err.message });
  }
}

function formatDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).trim();
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
