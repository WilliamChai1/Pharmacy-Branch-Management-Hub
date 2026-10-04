// ══════════════════════════════════════════════════════════════════════════════
// PMG Pharmacy — Pharmacist Schedule, Patient Appointments & Pricing Matrix API
// Sheet: Rymnet Conversion & PMG Walao
// Tabs: PharmacistSchedule, Patient_Appointments, Pricing_Matrix
// ══════════════════════════════════════════════════════════════════════════════

const TAB_SCHEDULE = 'PharmacistSchedule';
const TAB_APPOINTMENTS = 'Patient_Appointments';
const TAB_PRICING = 'Pricing_Matrix';
const TAB_RECRUITMENT = 'Job_Applicants';
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
  'WorkHistory', 'Languages', 'Smoking', 'Resume_URL', 'PayloadJSON', 'LastUpdated'
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
        const aptStatus = String(row[11] || 'Scheduled').trim();
        if (aptStatus.toUpperCase() === 'DELETED') continue;

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
    // ── 3. ACTION: GET JOB APPLICATIONS ──
    if (action === 'getJobApplications' || action === 'getJobApplicants') {
      let recSheet = ss.getSheetByName('Job_Applicants') 
                  || ss.getSheetByName('Form responses 1') 
                  || ss.getSheetByName('Form Responses 1') 
                  || ss.getSheetByName('Tindak Balas Borang 1') 
                  || ss.getSheetByName('Job_Applications') 
                  || ss.getSheetByName(TAB_RECRUITMENT);

      if (!recSheet) {
        const allSheets = ss.getSheets();
        for (let sIdx = 0; sIdx < allSheets.length; sIdx++) {
          const sName = allSheets[sIdx].getName().toLowerCase();
          if (sName.includes('form') || sName.includes('response') || sName.includes('tindak') || sName.includes('applicant') || sName.includes('borang')) {
            recSheet = allSheets[sIdx];
            break;
          }
        }
      }

      if (!recSheet) {
        return buildResponse({ success: true, count: 0, applications: [] });
      }
      const data = recSheet.getDataRange().getValues();
      if (data.length <= 1) return buildResponse({ success: true, count: 0, applications: [] });

      const headerRow = data[0].map(h => String(h || '').trim().toLowerCase());
      const colMap = {};
      headerRow.forEach((h, idx) => {
        if (h.includes('id') || h.includes('app_id') || h.includes('applicationid') || h.includes('application')) colMap.id = colMap.id ?? idx;
        if (h.includes('applied') || h.includes('timestamp') || h.includes('masa') || h.includes('date') || h.includes('tarikh')) colMap.appliedAt = colMap.appliedAt ?? idx;
        if (h.includes('name') || h.includes('nama')) colMap.name = colMap.name ?? idx;
        if (h.includes('position') || h.includes('jawatan')) colMap.position = colMap.position ?? idx;
        if (h.includes('branch') || h.includes('cawangan')) colMap.preferredBranch = colMap.preferredBranch ?? idx;
        if (h.includes('ic') || h.includes('nric') || h.includes('kad pengenalan') || h.includes('k/p')) colMap.ic = colMap.ic ?? idx;
        if (h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('whatsapp') || h.includes('nombor')) colMap.phone = colMap.phone ?? idx;
        if (h.includes('email') || h.includes('emel')) colMap.email = colMap.email ?? idx;
        if (h.includes('dob') || h.includes('birth') || h.includes('lahir')) colMap.dob = colMap.dob ?? idx;
        if (h.includes('age') || h.includes('umur')) colMap.age = colMap.age ?? idx;
        if (h.includes('gender') || h.includes('jantina')) colMap.gender = colMap.gender ?? idx;
        if (h.includes('race') || h.includes('bangsa') || h.includes('kaum')) colMap.race = colMap.race ?? idx;
        if (h.includes('status') || h.includes('status permohonan')) colMap.status = colMap.status ?? idx;
        if (h.includes('score') || h.includes('skor')) colMap.aiScore = colMap.aiScore ?? idx;
        if (h.includes('verdict') || h.includes('keputusan')) colMap.aiVerdict = colMap.aiVerdict ?? idx;
        if (h.includes('spm')) colMap.spm = colMap.spm ?? idx;
        if (h.includes('education') || h.includes('higher') || h.includes('qual') || h.includes('kelayakan') || h.includes('pendidikan')) colMap.highestQual = colMap.highestQual ?? idx;
        if (h.includes('work') || h.includes('history') || h.includes('employment') || h.includes('experience') || h.includes('pengalaman') || h.includes('residential') || h.includes('area')) colMap.workHistory = colMap.workHistory ?? idx;
        if (h.includes('lang') || h.includes('bahasa')) colMap.languages = colMap.languages ?? idx;
        if (h.includes('smok') || h.includes('vape') || h.includes('merokok')) colMap.smokes = colMap.smokes ?? idx;
        if (h.includes('resume') || h.includes('doc') || h.includes('file') || h.includes('muat naik') || h.includes('slip')) colMap.resumeUrl = colMap.resumeUrl ?? idx;
        if (h.includes('payload') || h.includes('json')) colMap.payload = colMap.payload ?? idx;
      });

      const apps = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || (!row[0] && !row[colMap.name ?? 1])) continue;
        let appObj = null;
        const pCol = colMap.payload !== undefined ? colMap.payload : 20;
        try {
          if (row[pCol]) appObj = JSON.parse(row[pCol]);
        } catch (_) {}

        if (!appObj) {
          const rawName = String(row[colMap.name ?? 1] || '').trim();
          if (!rawName) continue;
          const rawApplied = String(row[colMap.appliedAt ?? 0] || '').trim();
          let rawId = colMap.id !== undefined ? String(row[colMap.id] || '').trim() : '';
          if (!rawId || rawId.toLowerCase() === rawApplied.toLowerCase()) {
            let h = 0;
            const seed = rawName + rawApplied;
            for (let c = 0; c < seed.length; c++) h = (Math.imul(31, h) + seed.charCodeAt(c)) | 0;
            rawId = 'APP-' + Math.abs(h).toString(36).toUpperCase();
          }

          appObj = {
            id: rawId,
            appliedAt: rawApplied || new Date().toISOString(),
            name: rawName,
            position: String(row[colMap.position ?? 3] || 'Pharmacist Assistant').trim(),
            preferredBranch: String(row[colMap.preferredBranch ?? 4] || 'Kota Sentosa').trim(),
            ic: String(row[colMap.ic ?? 5] || '').trim(),
            phone: String(row[colMap.phone ?? 6] || '').trim(),
            email: String(row[colMap.email ?? 7] || '').trim(),
            dob: String(row[colMap.dob ?? 8] || '').trim(),
            age: row[colMap.age ?? 9] || '',
            gender: String(row[colMap.gender ?? 10] || '').trim(),
            race: String(row[colMap.race ?? 11] || 'Chinese').trim(),
            status: String(row[colMap.status ?? 12] || 'screening').trim(),
            aiScore: row[colMap.aiScore ?? 13] || 82,
            aiVerdict: String(row[colMap.aiVerdict ?? 14] || 'Eligible / Ready for Review').trim(),
            spm: String(row[colMap.spm ?? 15] || '').trim(),
            highestQual: String(row[colMap.highestQual ?? 16] || '').trim(),
            workHistory: String(row[colMap.workHistory ?? 17] || '').trim(),
            languages: String(row[colMap.languages ?? 18] || '').trim(),
            smokes: String(row[colMap.smokes ?? 19] || 'No').trim()
          };
        }

        const rUrl = colMap.resumeUrl !== undefined ? String(row[colMap.resumeUrl] || '').trim() : '';
        const spmVal = colMap.spm !== undefined ? String(row[colMap.spm] || '').trim() : '';
        const qualVal = colMap.highestQual !== undefined ? String(row[colMap.highestQual] || '').trim() : '';

        if (!Array.isArray(appObj.docs) || appObj.docs.length === 0) {
          const docs = [];
          if (spmVal && spmVal.startsWith('http')) docs.push({ field: 'fileSpm', name: 'SPM_Result.pdf', url: spmVal });
          if (qualVal && qualVal.startsWith('http')) docs.push({ field: 'fileHigherEdu', name: 'Higher_Education.pdf', url: qualVal });
          if (rUrl && rUrl.startsWith('http') && rUrl !== spmVal && rUrl !== qualVal) {
            docs.push({ field: 'fileResume', name: 'Resume.pdf', url: rUrl });
          }
          appObj.docs = docs;
        }

        if (rUrl) appObj.resumeUrl = rUrl;
        else if (qualVal && qualVal.startsWith('http')) appObj.resumeUrl = qualVal;
        else if (spmVal && spmVal.startsWith('http')) appObj.resumeUrl = spmVal;

        apps.push(appObj);
      }
      return buildResponse({ success: true, count: apps.length, applications: apps });
    }

    // ── 3B. ACTION: GET DRIVE FILE BASE64 (FOR VISION SCANNING) ──
    if (action === 'getDriveFileBase64' || action === 'fetchDriveFile') {
      let fileId = String(e.parameter.fileId || '').trim();
      const fileUrl = String(e.parameter.url || '').trim();
      if (!fileId && fileUrl) {
        const m1 = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m1 && m1[1]) fileId = m1[1];
        else {
          const m2 = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (m2 && m2[1]) fileId = m2[1];
        }
      }
      if (!fileId) return buildResponse({ success: false, error: 'No fileId or valid Drive url provided' });
      try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        const b64 = Utilities.base64Encode(blob.getBytes());
        return buildResponse({
          success: true,
          fileId: fileId,
          name: file.getName(),
          mimeType: file.getMimeType(),
          base64: b64
        });
      } catch (fErr) {
        return buildResponse({ success: false, error: 'DriveApp error: ' + fErr.message });
      }
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
        if (sched && Array.isArray(sched.onlineBookings)) {
          sched.onlineBookings = sched.onlineBookings.filter(b => String(b.status || '').toUpperCase() !== 'DELETED');
        }
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
    if (action === 'submitJobApplication' || action === 'submitJobApplicant') {
      const recSheet = ss.getSheetByName('Job_Applicants') || ss.getSheetByName('Job_Applications') || ss.insertSheet('Job_Applicants');
      if (recSheet.getLastRow() === 0) {
        recSheet.appendRow(RECRUITMENT_HEADERS);
        recSheet.getRange(1, 1, 1, RECRUITMENT_HEADERS.length).setFontWeight('bold');
      }

      const a = payload.application || {};
      const appId = String(a.id || ('APP-' + Date.now())).trim();

      // 1. Upload documents/resume to Google Drive if base64 data is present
      let resumeUrl = String(a.resumeUrl || '').trim();
      const processedDocs = [];

      if (Array.isArray(a.docs) && a.docs.length > 0) {
        let driveFolder = null;
        try {
          const folderName = 'PMG_Job_Applicant_Resumes';
          const folders = DriveApp.getFoldersByName(folderName);
          if (folders.hasNext()) {
            driveFolder = folders.next();
          } else {
            driveFolder = DriveApp.createFolder(folderName);
          }
        } catch (fErr) {
          console.warn('Drive folder retrieval failed: ' + fErr.message);
        }

        a.docs.forEach((doc, dIdx) => {
          if (!doc) return;
          if (doc.data && driveFolder) {
            try {
              const cleanB64 = doc.data.includes(',') ? doc.data.split(',')[1] : doc.data;
              const decoded = Utilities.base64Decode(cleanB64);
              const mime = doc.type || 'application/pdf';
              const cleanFileName = String(doc.name || `document_${dIdx + 1}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
              const finalFileName = `${appId}_${cleanFileName}`;
              const blob = Utilities.newBlob(decoded, mime, finalFileName);
              const file = driveFolder.createFile(blob);
              file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              const fileUrl = file.getUrl();
              if (!resumeUrl) resumeUrl = fileUrl;
              processedDocs.push({
                field: doc.field || 'file',
                name: doc.name || cleanFileName,
                size: doc.size || 0,
                type: mime,
                url: fileUrl
              });
            } catch (dErr) {
              console.warn('Failed saving doc to Drive: ' + dErr.message);
              processedDocs.push({
                field: doc.field || 'file',
                name: doc.name || 'document',
                size: doc.size || 0,
                type: doc.type || 'application/octet-stream'
              });
            }
          } else if (doc.url) {
            if (!resumeUrl) resumeUrl = doc.url;
            processedDocs.push(doc);
          } else {
            processedDocs.push({
              field: doc.field || 'file',
              name: doc.name || 'document',
              size: doc.size || 0,
              type: doc.type || 'application/octet-stream'
            });
          }
        });
      }

      // 2. Build lightweight JSON payload (stripping huge base64 strings to prevent 50,000 char cell overflow)
      const cleanApp = Object.assign({}, a);
      cleanApp.resumeUrl = resumeUrl;
      cleanApp.docs = processedDocs;
      const payloadStr = JSON.stringify(cleanApp);

      // 3. Match columns dynamically
      const headers = recSheet.getRange(1, 1, 1, recSheet.getLastColumn()).getValues()[0];
      const headerLower = headers.map(h => String(h || '').trim().toLowerCase());
      const colMap = {};
      headerLower.forEach((h, idx) => {
        if (h.includes('id') || h.includes('app_id') || h.includes('application')) colMap.id = colMap.id ?? idx;
        if (h.includes('applied') || h.includes('timestamp') || h.includes('date')) colMap.appliedAt = colMap.appliedAt ?? idx;
        if (h.includes('name')) colMap.name = colMap.name ?? idx;
        if (h.includes('position')) colMap.position = colMap.position ?? idx;
        if (h.includes('branch')) colMap.preferredBranch = colMap.preferredBranch ?? idx;
        if (h.includes('ic') || h.includes('nric')) colMap.ic = colMap.ic ?? idx;
        if (h.includes('phone') || h.includes('tel') || h.includes('mobile')) colMap.phone = colMap.phone ?? idx;
        if (h.includes('email')) colMap.email = colMap.email ?? idx;
        if (h.includes('dob') || h.includes('birth')) colMap.dob = colMap.dob ?? idx;
        if (h.includes('age')) colMap.age = colMap.age ?? idx;
        if (h.includes('gender')) colMap.gender = colMap.gender ?? idx;
        if (h.includes('race')) colMap.race = colMap.race ?? idx;
        if (h.includes('status')) colMap.status = colMap.status ?? idx;
        if (h.includes('score')) colMap.aiScore = colMap.aiScore ?? idx;
        if (h.includes('verdict')) colMap.aiVerdict = colMap.aiVerdict ?? idx;
        if (h.includes('spm')) colMap.spm = colMap.spm ?? idx;
        if (h.includes('education') || h.includes('qual')) colMap.highestQual = colMap.highestQual ?? idx;
        if (h.includes('work') || h.includes('history') || h.includes('employment')) colMap.workHistory = colMap.workHistory ?? idx;
        if (h.includes('lang')) colMap.languages = colMap.languages ?? idx;
        if (h.includes('smok')) colMap.smokes = colMap.smokes ?? idx;
        if (h.includes('resume') || h.includes('doc') || h.includes('file')) colMap.resumeUrl = colMap.resumeUrl ?? idx;
        if (h.includes('payload') || h.includes('json')) colMap.payload = colMap.payload ?? idx;
        if (h.includes('lastupdated') || h.includes('updated')) colMap.lastUpdated = colMap.lastUpdated ?? idx;
      });

      const rowValues = new Array(headers.length).fill('');
      if (colMap.id !== undefined) rowValues[colMap.id] = appId;
      if (colMap.appliedAt !== undefined) rowValues[colMap.appliedAt] = a.appliedAt || now;
      if (colMap.name !== undefined) rowValues[colMap.name] = a.name || '';
      if (colMap.position !== undefined) rowValues[colMap.position] = a.position || '';
      if (colMap.preferredBranch !== undefined) rowValues[colMap.preferredBranch] = a.preferredBranch || 'Kota Sentosa';
      if (colMap.ic !== undefined) rowValues[colMap.ic] = a.ic || '';
      if (colMap.phone !== undefined) rowValues[colMap.phone] = a.phone || '';
      if (colMap.email !== undefined) rowValues[colMap.email] = a.email || '';
      if (colMap.dob !== undefined) rowValues[colMap.dob] = a.dob || '';
      if (colMap.age !== undefined) rowValues[colMap.age] = a.age || '';
      if (colMap.gender !== undefined) rowValues[colMap.gender] = a.gender || '';
      if (colMap.race !== undefined) rowValues[colMap.race] = a.race || '';
      if (colMap.status !== undefined) rowValues[colMap.status] = a.status || 'new';
      if (colMap.aiScore !== undefined) rowValues[colMap.aiScore] = a.aiScore || '';
      if (colMap.aiVerdict !== undefined) rowValues[colMap.aiVerdict] = a.aiVerdict || '';
      if (colMap.spm !== undefined) rowValues[colMap.spm] = a.spm || '';
      if (colMap.highestQual !== undefined) rowValues[colMap.highestQual] = a.highestQual || '';
      if (colMap.workHistory !== undefined) rowValues[colMap.workHistory] = a.workHistory || '';
      if (colMap.languages !== undefined) rowValues[colMap.languages] = a.languages || '';
      if (colMap.smokes !== undefined) rowValues[colMap.smokes] = a.smokes || 'No';
      if (colMap.resumeUrl !== undefined) rowValues[colMap.resumeUrl] = resumeUrl;
      if (colMap.payload !== undefined) rowValues[colMap.payload] = payloadStr;
      if (colMap.lastUpdated !== undefined) rowValues[colMap.lastUpdated] = now;

      // Check if row already exists for update vs append
      const data = recSheet.getDataRange().getValues();
      let foundRow = 0;
      const idIdx = colMap.id !== undefined ? colMap.id : 0;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]).trim() === appId) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 1) {
        recSheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        recSheet.appendRow(rowValues);
      }

      SpreadsheetApp.flush();

      return buildResponse({
        success: true,
        applicationId: appId,
        resumeUrl: resumeUrl,
        message: 'Application recorded to Job_Applicants successfully.'
      });
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

      SpreadsheetApp.flush();
      return buildResponse({ success: true, branch: branchCode });
    }

    // ── 6. ACTION: DELETE PATIENT PROFILE (CASCADE HARD DELETION) ──
    if (action === 'deletePatient' || action === 'deletePatientProfile') {
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
        const schedSheet = ss.getSheetByName(TAB_SCHEDULE) || ss.getSheetByName('PharmacistSchedule');
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

    // ── 7. ACTION: UPDATE QTY / MARK CLEARED / UPDATE EXPIRY ITEM ──
    if (action === 'update_qty' || action === 'mark_cleared' || action === 'update_expiry' || action === 'update_item' || action === 'updateExpiryItem') {
      const expTabNames = ['Master_Expiry_List', 'Expiry', 'Expiry_Tracker'];
      let expSheet = null;
      for (const tName of expTabNames) {
        expSheet = ss.getSheetByName(tName);
        if (expSheet) break;
      }
      if (!expSheet) {
        return buildResponse({ success: true, message: 'Acknowledged updateExpiryItem', status: payload.status || 'DONE' });
      }

      const rowId = parseInt(payload.rowId, 10);
      const isMarkCleared = action === 'mark_cleared' || payload.subAction === 'mark_cleared' || String(payload.status).toUpperCase() === 'DONE' || String(payload.status).toUpperCase() === 'CLEARED' || String(payload.status).toUpperCase() === 'COMPLETED';
      const newQty = isMarkCleared ? 0 : (payload.quantity !== undefined ? parseFloat(payload.quantity) : null);
      const newExp = payload.expiryDate ? formatDateStr(payload.expiryDate) : null;
      const newCode = payload.itemCode ? String(payload.itemCode).trim() : null;
      const newDesc = payload.itemDescription ? String(payload.itemDescription).trim() : null;
      const newBatch = payload.batchNumber ? String(payload.batchNumber).trim() : null;
      const newStatus = isMarkCleared ? (payload.status || 'DONE') : (payload.status || 'Active');

      let targetRow = (rowId > 1 && rowId <= expSheet.getLastRow()) ? rowId : 0;

      if (targetRow === 0 && (payload.itemCode || payload.batchNumber || payload.itemDescription)) {
        const data = expSheet.getDataRange().getValues();
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
        if (newCode !== null && newCode !== '') expSheet.getRange(targetRow, 3).setValue(newCode);
        if (newDesc !== null && newDesc !== '') expSheet.getRange(targetRow, 4).setValue(newDesc);
        if (newBatch !== null && newBatch !== '') expSheet.getRange(targetRow, 2).setValue(newBatch);
        if (newExp !== null && newExp !== '') expSheet.getRange(targetRow, 5).setValue(newExp);
        if (newQty !== null && !isNaN(newQty)) expSheet.getRange(targetRow, 6).setValue(newQty);
        expSheet.getRange(targetRow, 8).setValue(newStatus);
        expSheet.getRange(targetRow, 9).setValue(now);
        expSheet.getRange(targetRow, 10).setValue(updatedBy);
        SpreadsheetApp.flush();
        return buildResponse({ success: true, rowId: targetRow, status: newStatus, expiryDate: newExp, quantity: newQty });
      }

      if (isMarkCleared && (payload.itemCode || payload.itemDescription)) {
        expSheet.appendRow([
          payload.branch || 'Kota Sentosa',
          payload.batchNumber || 'N/A',
          payload.itemCode || 'N/A',
          payload.itemDescription || '',
          formatDateStr(payload.expiryDate),
          0,
          'Manual Clearance',
          newStatus,
          now,
          updatedBy
        ]);
        SpreadsheetApp.flush();
        targetRow = expSheet.getLastRow();
        return buildResponse({ success: true, rowId: targetRow, status: newStatus, message: 'Row appended and marked ' + newStatus });
      }

      SpreadsheetApp.flush();
      return buildResponse({ success: true, message: 'Expiry update processed' });
    }

    // ── 8. DEFAULT: SAVE PHARMACIST SCHEDULE ──
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
    }

    SpreadsheetApp.flush();
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
