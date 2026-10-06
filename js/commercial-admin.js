// js/commercial-admin.js — Commercial & Administrative Utilities Suite
// 1. Auto 3-Quotation Generator (Corporate/B2B Procurement)
// 2. Manual Invoicing & Official Billing Generator (A4 Medical/Tax Receipt)
// 3. HQ Incident Report Digital Auto-Fill & PDF Exporter (PMG HQ Mirror)
'use strict';

(function(window) {
  const pmgAdminUtils = {};

  // ─── LOCAL STORAGE KEYS ───────────────────────────────────────────────────────
  const KEYS = {
    QUOTATION: 'pmg_admin_quotation_data',
    INVOICE: 'pmg_admin_invoice_data',
    INVOICE_COUNTER: 'pmg_admin_invoice_counter',
    INCIDENT: 'pmg_admin_incident_data',
    HISTORY_QUOTES: 'pmg_admin_history_quotes',
    HISTORY_INVOICES: 'pmg_admin_history_invoices',
    HISTORY_INCIDENTS: 'pmg_admin_history_incidents'
  };

  // ─── KS01 BRANCH PERSONNEL ───────────────────────────────────────────────────
  const BRANCH_STAFF = [
    { name: 'William Chai', position: 'Branch Manager / Pharmacist-in-Charge', rph: 'RPh 11482', isRx: true },
    { name: 'Kenix Foo', position: 'Fully Registered Pharmacist (FRP)', rph: 'RPh 14205', isRx: true },
    { name: 'Christina Lau', position: 'Provisional Registered Pharmacist (PRP)', rph: 'PRP 19830', isRx: true },
    { name: 'Ting Siew Ling', position: 'Pharmacy Assistant / Senior Counter', rph: '', isRx: false },
    { name: 'Louna Yii', position: 'Pharmacy Assistant / Dispensary', rph: '', isRx: false },
    { name: 'Penny Wong', position: 'Pharmacy Assistant / Customer Service', rph: '', isRx: false },
    { name: 'Fiona Tan', position: 'Pharmacy Assistant / Inventory Custodian', rph: '', isRx: false },
    { name: 'Nurhafizah binti Ahmad', position: 'Pharmacy Assistant / Counter', rph: '', isRx: false },
    { name: 'Farizin bin Rosli', position: 'Pharmacy Assistant / Logistics & Counter', rph: '', isRx: false }
  ];

  // ─── COMPANY PROFILES ────────────────────────────────────────────────────────
  const COMPANIES = {
    pmg: {
      key: 'pmg',
      name: 'PMG PHARMACY (KOTA SENTOSA)',
      legalName: 'PMG HEALTHCARE SDN BHD',
      regNo: '1424437-X',
      branch: 'Kota Sentosa (KS01)',
      address: 'Ground Floor, Sublot 1, Lot 460, Block 227 KNLD, 7th Mile, Jalan Penrissen, 93250 Kuching, Sarawak.',
      hqAddress: 'No.6, 1st Floor, Jalan Merdeka, 96100 Sarikei, Sarawak.',
      tel: '082-629 118 / 011-1050 8911',
      email: 'customercare@pmghealthcare.com',
      bankInfo: 'Maybank Account: 5110 3862 9012 (PMG Healthcare Sdn Bhd)',
      quotePrefix: 'QT-PMG',
      logoKey: 'pmg_heart_logo'
    },
    ssj: {
      key: 'ssj',
      name: 'SSJ PHARMA SDN BHD',
      legalName: 'SSJ PHARMA SDN BHD',
      regNo: '1070101-K',
      branch: 'Sarikei Wholesale & Trade',
      address: 'LOT 1564, LORONG 6, JALAN RENTAP, 96100 SARIKEI, SARAWAK.',
      tel: '011-31797699',
      email: 'cpdopmg@gmail.com',
      bankInfo: 'Public Bank: 3189 4421 1900 (SSJ Pharma Sdn Bhd)',
      quotePrefix: 'QT-SSJ',
      logoKey: 'ssj_header'
    },
    ampm: {
      key: 'ampm',
      name: 'AM PM PHARMACY SDN BHD',
      legalName: 'AM PM PHARMACY SDN BHD',
      regNo: '572945-M',
      branch: 'Southern Regional & Wholesale Hub',
      address: 'NO. 9, JALAN SME 1, KAW. PERINDUSTRIAN SME, BANDAR INDAHPURA, 81000, KULAI, JOHOR.',
      tel: '07-661 5899',
      fax: '07-661 5699',
      email: 'order.wholesale@ampmpharmacy.com.my',
      bankInfo: 'CIMB Bank: 8003 4912 8821 (AM PM Pharmacy Sdn Bhd)',
      quotePrefix: 'QT-AMPM',
      logoKey: 'ampm_header'
    }
  };

  // ─── STATE OBJECTS ───────────────────────────────────────────────────────────
  let quotationState = {
    clientName: 'Sarawak Energy Berhad (Batu 7 Substation)',
    attn: 'Pn. Dayang Norazimah / Facilities Dept',
    phone: '082-388 388 / 019-823 4410',
    address: 'Menara Sarawak Energy, No. 1, The Isthmus, 93050 Kuching, Sarawak',
    date: new Date().toISOString().slice(0, 10),
    validityDays: 30,
    deliveryTerms: 'Ready Stock (Immediate / 1–2 working days to site)',
    paymentTerms: '30 Days Credit Term upon official invoice delivery',
    ssjVariancePct: 4.8,  // SSJ default markup (+4.8%)
    ampmVariancePct: 7.2, // AM PM default markup (+7.2%)
    items: [
      { sku: 'FAK-CORP-01', name: 'Workplace Comprehensive First Aid Kit (MS 1390:2010 Compliant)', desc: 'Heavy duty wall-mountable ABS casing, 45 essential surgical & first aid components', qty: 5, pmgPrice: 185.00 },
      { sku: 'DIS-ALC-70', name: 'Alcoswab 70% Isopropyl Alcohol Swabs', desc: 'Medical grade sterile disinfectant swabs (Box of 100s)', qty: 20, pmgPrice: 8.50 },
      { sku: 'MED-PAN-500', name: 'Panadol ActiFast 500mg (Paracetamol)', desc: 'Fast absorption caplets for fever and pain (Box of 100s)', qty: 10, pmgPrice: 38.00 },
      { sku: 'SUR-GAU-10', name: 'Sterile Gauze Swabs 10cm x 10cm 8-ply', desc: 'Hospital grade sterile cotton swabs (Pack of 5s x 20 pouches)', qty: 15, pmgPrice: 16.50 },
      { sku: 'DEV-THM-DIG', name: 'Rossmax Digital Clinical Thermometer TG100', desc: 'Waterproof fast 60s oral/axillary reading with fever alarm', qty: 5, pmgPrice: 19.90 }
    ],
    activePreviewTab: 'pmg' // 'pmg' | 'ssj' | 'ampm' | 'comparison'
  };

  let invoiceState = {
    customerName: 'Tan Kok Wah',
    icReg: '680415-13-5291',
    phone: '016-882 3918',
    address: 'Lorong 4, Taman Sentosa, 93250 Kuching, Sarawak',
    invoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    pharmacistName: 'William Chai',
    pharmacistRole: 'Branch Manager / Pharmacist-in-Charge',
    pharmacistRph: 'RPh 11482',
    doctorClinicRef: 'Poliklinik Sentosa / Dr. Lau (Ref: PK-8829)',
    paymentMethod: 'DuitNow QR',
    paymentRef: 'DNT-20261005-9941',
    amountPaid: 320.00,
    items: [
      { name: 'Omron HEM-7120 Digital Arm Blood Pressure Monitor', category: 'Medical Device', qty: 1, unitPrice: 168.00, discount: 10.00 },
      { name: 'Accu-Chek Instant Blood Glucose Test Strips 50s', category: 'Medical Device', qty: 2, unitPrice: 72.00, discount: 4.00 },
      { name: 'Metformin HCl 500mg Tablets (Chronic Dispense)', category: 'Prescription (Rx)', qty: 1, unitPrice: 28.00, discount: 0.00 },
      { name: 'Blackmores Multivitamin + Minerals 120s', category: 'Supplement', qty: 1, unitPrice: 65.00, discount: 5.00 }
    ]
  };

  let incidentState = {
    branch: 'PMG Pharmacy Kota Sentosa',
    employeeName: 'Christina Lau',
    employeePosition: 'Provisional Registered Pharmacist (PRP)',
    managerName: 'William Chai',
    managerPosition: 'Branch Manager / Pharmacist-in-Charge',
    date: new Date().toISOString().slice(0, 10),
    time: '14:45',
    location: 'PMG Pharmacy Kota Sentosa (Dispensary Area)',
    description: 'During peak afternoon dispensary shift, a near-miss labelling event was detected during the standard secondary pharmacist check. A dispensing box of Amlodipine 5mg was labelled with instructions intended for Amlodipine 10mg. The error was caught prior to patient handover at the counter, and no incorrect medication was issued.',
    explanation: 'The counter was managing high patient load while coordinating patient care appointments. The similarity of packaging between 5mg and 10mg strengths contributed to the mislabel. Accepted responsibility and immediately corrected label.',
    witness: 'Ting Siew Ling (Senior Counter Assistant) & Kenix Foo (Pharmacist)',
    actionVerbal: true,
    actionWritten: false,
    actionProbation: false,
    actionSuspension: false,
    actionDismissal: false,
    actionOther: false,
    actionOtherText: '',
    explanationAction: 'Verbal counseling conducted. Implemented immediate dispensary 5S segregation separating 5mg and 10mg strength bins with high-visibility color-coded stickers to prevent look-alike/sound-alike errors.',
    employeeSigned: true,
    managerSigned: true,
    employeeSignDate: new Date().toISOString().slice(0, 10),
    managerSignDate: new Date().toISOString().slice(0, 10)
  };

  // ─── INITIALIZATION ──────────────────────────────────────────────────────────
  pmgAdminUtils.init = function() {
    loadPersistedData();
    if (!invoiceState.invoiceNo) {
      invoiceState.invoiceNo = generateNextInvoiceNumber();
    }
    renderSuiteShell();
  };

  function loadPersistedData() {
    try {
      const q = localStorage.getItem(KEYS.QUOTATION);
      if (q) quotationState = Object.assign(quotationState, JSON.parse(q));
      const inv = localStorage.getItem(KEYS.INVOICE);
      if (inv) invoiceState = Object.assign(invoiceState, JSON.parse(inv));
      const inc = localStorage.getItem(KEYS.INCIDENT);
      if (inc) incidentState = Object.assign(incidentState, JSON.parse(inc));
    } catch (e) {
      console.warn('Error loading admin utils persisted state:', e);
    }
  }

  function persistQuotation() {
    try { localStorage.setItem(KEYS.QUOTATION, JSON.stringify(quotationState)); } catch(e) {}
  }
  function persistInvoice() {
    try { localStorage.setItem(KEYS.INVOICE, JSON.stringify(invoiceState)); } catch(e) {}
  }
  function persistIncident() {
    try { localStorage.setItem(KEYS.INCIDENT, JSON.stringify(incidentState)); } catch(e) {}
  }

  function generateNextInvoiceNumber() {
    let counter = 1;
    try {
      const stored = localStorage.getItem(KEYS.INVOICE_COUNTER);
      if (stored) counter = parseInt(stored, 10) || 1;
    } catch(e) {}
    const now = new Date();
    const yyyymm = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(counter).padStart(3, '0');
    return `INV-KTS-${yyyymm}-${seq}`;
  }

  function incrementInvoiceCounter() {
    try {
      let counter = 1;
      const stored = localStorage.getItem(KEYS.INVOICE_COUNTER);
      if (stored) counter = parseInt(stored, 10) || 1;
      counter += 1;
      localStorage.setItem(KEYS.INVOICE_COUNTER, counter.toString());
    } catch(e) {}
  }

  // ─── MAIN SUITE SHELL RENDER ─────────────────────────────────────────────────
  function renderSuiteShell() {
    const container = document.getElementById('content-admin-utils');
    if (!container) return;

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <i class="fa-solid fa-file-signature text-indigo-700 text-2xl"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h1 class="text-xl font-bold text-gray-900">Commercial & Administrative Utilities</h1>
                <span class="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  <i class="fa-solid fa-building-circle-check mr-1"></i>PMG HQ Compliant
                </span>
                <span class="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  Kota Sentosa (KS01)
                </span>
              </div>
              <p class="text-gray-500 text-xs sm:text-sm">
                Corporate B2B 3-Quotation bidding generator · Official medical tax receipt billing · Official PMG HQ Incident Report autofill & PDF exporter.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.pmgAdminUtils.showHelpModal()" class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1.5">
              <i class="fa-solid fa-circle-question text-indigo-600"></i> Standard Operating Guidelines
            </button>
          </div>
        </div>

        <!-- Suite Subtabs -->
        <div class="flex gap-2 border-b border-gray-200 pt-4 overflow-x-auto">
          <button type="button" onclick="window.pmgAdminUtils.switchSuiteSubTab('quotation')" id="admin-subtab-btn-quotation"
            class="admin-subtab-btn font-bold text-sm py-2.5 px-4 border-b-2 border-indigo-600 text-indigo-700 flex items-center gap-2 transition whitespace-nowrap">
            <i class="fa-solid fa-scale-balanced text-indigo-600"></i>
            <span>Auto 3-Quotation Generator</span>
            <span class="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">B2B Bidding</span>
          </button>
          <button type="button" onclick="window.pmgAdminUtils.switchSuiteSubTab('invoice')" id="admin-subtab-btn-invoice"
            class="admin-subtab-btn font-semibold text-sm py-2.5 px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 flex items-center gap-2 transition whitespace-nowrap">
            <i class="fa-solid fa-receipt text-emerald-600"></i>
            <span>Manual Invoicing & Official Billing</span>
            <span class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Tax / Medical Receipt</span>
          </button>
          <button type="button" onclick="window.pmgAdminUtils.switchSuiteSubTab('incident')" id="admin-subtab-btn-incident"
            class="admin-subtab-btn font-semibold text-sm py-2.5 px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 flex items-center gap-2 transition whitespace-nowrap">
            <i class="fa-solid fa-triangle-exclamation text-rose-600"></i>
            <span>HQ Incident Report Digital Auto-Fill</span>
            <span class="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Official Form</span>
          </button>
        </div>
      </div>

      <!-- Suite Views -->
      <div id="admin-view-quotation" class="admin-subview block"></div>
      <div id="admin-view-invoice" class="admin-subview hidden"></div>
      <div id="admin-view-incident" class="admin-subview hidden"></div>

      <!-- Shared Print Preview Modal -->
      <div id="adminDocPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs hidden p-2 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[95vh] flex flex-col overflow-hidden border border-gray-200">
          <div class="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <i class="fa-solid fa-print text-indigo-400 text-lg"></i>
              <div>
                <h3 id="adminPreviewModalTitle" class="font-bold text-sm truncate">Print & Document Preview</h3>
                <p id="adminPreviewModalSubtitle" class="text-[11px] text-slate-300">Exact A4 layout matching PMG corporate & statutory standards</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="adminPreviewPrintBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm">
                <i class="fa-solid fa-print"></i> Print to PDF / Printer
              </button>
              <button type="button" onclick="window.pmgAdminUtils.closePreviewModal()" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>
          <div id="adminPreviewModalBody" class="flex-1 bg-slate-200 p-4 sm:p-8 overflow-y-auto flex justify-center">
            <!-- Dynamic A4 Paper Container -->
          </div>
        </div>
      </div>
    `;

    renderQuotationTab();
    renderInvoiceTab();
    renderIncidentTab();
  }

  // ─── SUITE SUB-TAB SWITCHER ──────────────────────────────────────────────────
  pmgAdminUtils.switchSuiteSubTab = function(subtab) {
    document.querySelectorAll('.admin-subview').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
      btn.classList.remove('border-indigo-600', 'text-indigo-700', 'border-emerald-600', 'text-emerald-700', 'border-rose-600', 'text-rose-700');
      btn.classList.add('border-transparent', 'text-gray-500');
    });

    const targetView = document.getElementById(`admin-view-${subtab}`);
    const targetBtn = document.getElementById(`admin-subtab-btn-${subtab}`);
    if (targetView) targetView.classList.remove('hidden');
    if (targetBtn) {
      const activeColor = subtab === 'invoice' ? 'text-emerald-700' : subtab === 'incident' ? 'text-rose-700' : 'text-indigo-700';
      const activeBorder = subtab === 'invoice' ? 'border-emerald-600' : subtab === 'incident' ? 'border-rose-600' : 'border-indigo-600';
      targetBtn.classList.remove('border-transparent', 'text-gray-500');
      targetBtn.classList.add(activeBorder, activeColor, 'font-bold');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // MODULE 1: AUTO 3-QUOTATION GENERATOR (B2B CORPORATE PROCUREMENT)
  // ═════════════════════════════════════════════════════════════════════════════

  function renderQuotationTab() {
    const view = document.getElementById('admin-view-quotation');
    if (!view) return;

    view.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Form Controls (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Client & Header Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3 border-b pb-2">
              <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i class="fa-solid fa-building text-indigo-600"></i> Corporate Client & RFQ Info
              </h3>
              <span class="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">B2B Tender Setup</span>
            </div>

            <!-- Quick Presets -->
            <div class="mb-3">
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Load Industry RFQ Preset</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button type="button" onclick="window.pmgAdminUtils.loadQuotePreset('firstaid')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg text-xs font-medium transition truncate">
                  🏢 Corporate First Aid Box
                </button>
                <button type="button" onclick="window.pmgAdminUtils.loadQuotePreset('clinic')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg text-xs font-medium transition truncate">
                  🩺 Clinic Diagnostics Pack
                </button>
                <button type="button" onclick="window.pmgAdminUtils.loadQuotePreset('senior')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg text-xs font-medium transition truncate">
                  👵 Senior Care Diapers & Saline
                </button>
                <button type="button" onclick="window.pmgAdminUtils.loadQuotePreset('ppe')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg text-xs font-medium transition truncate">
                  🛡️ School / Factory PPE
                </button>
              </div>
            </div>

            <div class="space-y-2.5 text-xs">
              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Client / Organization Name</label>
                <input type="text" id="quoteClientName" value="${escapeHtml(quotationState.clientName)}" onchange="window.pmgAdminUtils.updateQuoteField('clientName', this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Attn / Contact Person</label>
                  <input type="text" id="quoteAttn" value="${escapeHtml(quotationState.attn)}" onchange="window.pmgAdminUtils.updateQuoteField('attn', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Phone / Email</label>
                  <input type="text" id="quotePhone" value="${escapeHtml(quotationState.phone)}" onchange="window.pmgAdminUtils.updateQuoteField('phone', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
                </div>
              </div>
              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Delivery / Billing Address</label>
                <textarea id="quoteAddress" rows="2" onchange="window.pmgAdminUtils.updateQuoteField('address', this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">${escapeHtml(quotationState.address)}</textarea>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Quotation Date</label>
                  <input type="date" id="quoteDate" value="${quotationState.date}" onchange="window.pmgAdminUtils.updateQuoteField('date', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Validity Period</label>
                  <select id="quoteValidity" onchange="window.pmgAdminUtils.updateQuoteField('validityDays', parseInt(this.value, 10))"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
                    <option value="14" ${quotationState.validityDays === 14 ? 'selected' : ''}>14 Days</option>
                    <option value="30" ${quotationState.validityDays === 30 ? 'selected' : ''}>30 Days (Standard)</option>
                    <option value="60" ${quotationState.validityDays === 60 ? 'selected' : ''}>60 Days</option>
                    <option value="90" ${quotationState.validityDays === 90 ? 'selected' : ''}>90 Days (Government Tender)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Delivery Terms</label>
                <input type="text" id="quoteDeliveryTerms" value="${escapeHtml(quotationState.deliveryTerms)}" onchange="window.pmgAdminUtils.updateQuoteField('deliveryTerms', this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
              </div>
              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Payment Terms</label>
                <input type="text" id="quotePaymentTerms" value="${escapeHtml(quotationState.paymentTerms)}" onchange="window.pmgAdminUtils.updateQuoteField('paymentTerms', this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none">
              </div>
            </div>
          </div>

          <!-- Commercial Variance Controls Card -->
          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <i class="fa-solid fa-chart-line text-amber-600"></i> Competitor Commercial Variance (+3% to +8%)
              </h4>
              <span class="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">Auto Balanced</span>
            </div>
            <p class="text-[11px] text-amber-800 mb-3">
              PMG Pharmacy is strictly maintained as the <strong>winning (lowest) bid</strong>. Secondary bids are automatically marked up with authentic commercial variance:
            </p>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                <span class="font-bold text-gray-800 block mb-1">Bid 2: SSJ Pharma</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-gray-500 font-medium">+</span>
                  <input type="number" step="0.1" min="3.0" max="8.0" value="${quotationState.ssjVariancePct}" onchange="window.pmgAdminUtils.updateQuoteField('ssjVariancePct', parseFloat(this.value))"
                    class="w-16 border border-gray-300 rounded px-1.5 py-1 text-center font-bold text-amber-800">
                  <span class="text-gray-500">% markup</span>
                </div>
              </div>
              <div class="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                <span class="font-bold text-gray-800 block mb-1">Bid 3: AM PM Pharmacy</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-gray-500 font-medium">+</span>
                  <input type="number" step="0.1" min="3.0" max="8.0" value="${quotationState.ampmVariancePct}" onchange="window.pmgAdminUtils.updateQuoteField('ampmVariancePct', parseFloat(this.value))"
                    class="w-16 border border-gray-300 rounded px-1.5 py-1 text-center font-bold text-amber-800">
                  <span class="text-gray-500">% markup</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Item Management Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3 border-b pb-2">
              <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i class="fa-solid fa-list-check text-indigo-600"></i> Line Items (${quotationState.items.length})
              </h3>
              <button type="button" onclick="window.pmgAdminUtils.openAddQuoteItemModal()" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs">
                <i class="fa-solid fa-plus"></i> Add Item
              </button>
            </div>

            <!-- Items Table in Editor -->
            <div class="overflow-x-auto max-h-64 overflow-y-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th class="py-1.5 px-2">Item Description</th>
                    <th class="py-1.5 px-1 text-center w-12">Qty</th>
                    <th class="py-1.5 px-2 text-right w-20">PMG (RM)</th>
                    <th class="py-1.5 px-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${quotationState.items.map((it, idx) => `
                    <tr class="hover:bg-gray-50/75">
                      <td class="py-1.5 px-2">
                        <div class="font-bold text-gray-900 truncate max-w-[180px]">${escapeHtml(it.name)}</div>
                        <div class="text-[10px] text-gray-500 truncate max-w-[180px]">${escapeHtml(it.desc || it.sku)}</div>
                      </td>
                      <td class="py-1.5 px-1 text-center font-semibold">${it.qty}</td>
                      <td class="py-1.5 px-2 text-right font-bold text-indigo-700">${(it.pmgPrice || 0).toFixed(2)}</td>
                      <td class="py-1.5 px-1 text-center">
                        <button type="button" onclick="window.pmgAdminUtils.removeQuoteItem(${idx})" class="text-rose-500 hover:text-rose-700 p-1">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="mt-3 pt-3 border-t flex items-center justify-between text-xs">
              <span class="text-gray-500">Primary Bid Total (PMG):</span>
              <span class="text-base font-extrabold text-indigo-700">RM ${calculateQuoteTotal('pmg').toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Right: 3-Company Live Preview & Printing Actions (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <!-- Preview Controls Bar -->
            <div class="flex items-center justify-between gap-2 flex-wrap mb-4 border-b pb-3">
              <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button type="button" onclick="window.pmgAdminUtils.setQuotePreviewTab('pmg')" id="btn-prev-pmg"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${quotationState.activePreviewTab === 'pmg' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}">
                  🏆 Bid 1: PMG Kota Sentosa
                </button>
                <button type="button" onclick="window.pmgAdminUtils.setQuotePreviewTab('ssj')" id="btn-prev-ssj"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${quotationState.activePreviewTab === 'ssj' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}">
                  Bid 2: SSJ Pharma
                </button>
                <button type="button" onclick="window.pmgAdminUtils.setQuotePreviewTab('ampm')" id="btn-prev-ampm"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${quotationState.activePreviewTab === 'ampm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}">
                  Bid 3: AM PM Pharmacy
                </button>
                <button type="button" onclick="window.pmgAdminUtils.setQuotePreviewTab('comparison')" id="btn-prev-comparison"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${quotationState.activePreviewTab === 'comparison' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}">
                  📊 Comparison Matrix
                </button>
              </div>

              <!-- Print Action Dropdown / Buttons -->
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.pmgAdminUtils.printActiveQuotation()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                  <i class="fa-solid fa-print"></i> Print Current
                </button>
                <button type="button" onclick="window.pmgAdminUtils.printAll3Batch()" class="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs" title="Prints PMG, SSJ, and AM PM as 3 separate clean A4 pages in one batch">
                  <i class="fa-solid fa-layer-group text-amber-400"></i> Print All 3 Bids (Batch)
                </button>
              </div>
            </div>

            <!-- Dynamic Live Quotation Document Container -->
            <div id="quotationLiveSheetContainer" class="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-5 overflow-auto max-h-[800px]">
              ${renderActiveQuotationHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  pmgAdminUtils.setQuotePreviewTab = function(tab) {
    quotationState.activePreviewTab = tab;
    renderQuotationTab();
  };

  pmgAdminUtils.updateQuoteField = function(field, val) {
    quotationState[field] = val;
    persistQuotation();
    const sheet = document.getElementById('quotationLiveSheetContainer');
    if (sheet) sheet.innerHTML = renderActiveQuotationHTML();
  };

  function calculateQuoteTotal(companyKey) {
    let sum = 0;
    quotationState.items.forEach(it => {
      const price = getAdjustedPrice(it.pmgPrice, companyKey);
      if (companyKey === 'ssj' || companyKey === 'ampm') {
        sum += Math.round(price * it.qty);
      } else {
        sum += (price * it.qty);
      }
    });
    return sum;
  }

  function getAdjustedPrice(basePrice, companyKey) {
    if (companyKey === 'pmg') return basePrice;
    const markupPct = companyKey === 'ssj' ? (quotationState.ssjVariancePct || 4.8) : (quotationState.ampmVariancePct || 7.2);
    
    // Auto jet-up competitor prices must be whole round numbers without any sen behind
    let raw = basePrice * (1 + (markupPct / 100));
    let rounded = Math.round(raw);

    // Guard: Ensure competitor price is strictly higher than PMG base price
    if (companyKey === 'ssj') {
      const pmgFloor = Math.floor(basePrice);
      if (rounded <= pmgFloor) {
        rounded = pmgFloor + 1;
      }
    } else if (companyKey === 'ampm') {
      // Ensure AMPM is strictly higher than SSJ
      const ssjPrice = getAdjustedPrice(basePrice, 'ssj');
      if (rounded <= ssjPrice) {
        rounded = ssjPrice + 1;
      }
    }
    return rounded;
  }

  // ─── ACTIVE QUOTATION HTML RENDERER ──────────────────────────────────────────
  function renderActiveQuotationHTML() {
    if (quotationState.activePreviewTab === 'comparison') {
      return renderComparisonMatrixHTML();
    }
    return buildSingleQuotationHTML(quotationState.activePreviewTab);
  }

  function buildSingleQuotationHTML(companyKey) {
    const comp = COMPANIES[companyKey];
    const total = calculateQuoteTotal(companyKey);
    const now = new Date(quotationState.date || new Date());
    const validUntil = new Date(now.getTime() + (quotationState.validityDays * 86400000)).toISOString().slice(0, 10);
    const quoteNo = `${comp.quotePrefix}-KTS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}-088`;

    let headerMarkup = '';
    const assets = window.ADMIN_ASSETS || {};

    if (companyKey === 'pmg') {
      headerMarkup = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #b91c1c; padding-bottom:16px; margin-bottom:20px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <img src="${assets.pmg_heart_logo || 'icons/icon-192.png'}" style="width:78px; height:78px; object-fit:contain;" alt="PMG Logo">
            <div>
              <h2 style="font-size:20px; font-weight:800; color:#b91c1c; margin:0; line-height:1.2; letter-spacing:0.02em;">PMG PHARMACY KOTA SENTOSA</h2>
              <div style="font-size:11.5px; color:#4b5563; line-height:1.45; max-width:480px; margin-top:5px;">
                ${comp.address}<br>
                TEL: ${comp.tel} | EMAIL: ${comp.email}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="display:inline-block; background:#dc2626; color:#fff; font-size:12px; font-weight:800; padding:6px 16px; border-radius:4px; letter-spacing:0.06em; text-transform:uppercase;">
              OFFICIAL QUOTATION
            </div>
            <div style="font-size:12.5px; font-weight:700; color:#111827; margin-top:8px;">Ref: ${quoteNo}</div>
            <div style="font-size:11.5px; color:#4b5563; margin-top:2px;">Date: ${quotationState.date}</div>
          </div>
        </div>
      `;
    } else if (companyKey === 'ssj') {
      headerMarkup = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #991b1b; padding-bottom:16px; margin-bottom:20px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <img src="${assets.ssj_logo || assets.ssj_header}" style="width:68px; height:78px; object-fit:contain;" alt="SSJ Pharma Logo">
            <div>
              <h2 style="font-size:20px; font-weight:800; color:#991b1b; margin:0; line-height:1.2; letter-spacing:0.02em;">SSJ PHARMA SDN BHD <span style="font-size:13px; font-weight:600; color:#4b5563;">(1070101-K)</span></h2>
              <div style="font-size:11.5px; color:#4b5563; line-height:1.45; max-width:480px; margin-top:5px;">
                ${comp.address}<br>
                TEL: ${comp.tel} | EMAIL: ${comp.email}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="display:inline-block; background:#1e293b; color:#fff; font-size:12px; font-weight:800; padding:6px 16px; border-radius:4px; letter-spacing:0.06em; text-transform:uppercase;">
              COMMERCIAL QUOTATION
            </div>
            <div style="font-size:12.5px; font-weight:700; color:#111827; margin-top:8px;">Ref: ${quoteNo}</div>
            <div style="font-size:11.5px; color:#4b5563; margin-top:2px;">Date: ${quotationState.date}</div>
          </div>
        </div>
      `;
    } else {
      headerMarkup = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0369a1; padding-bottom:16px; margin-bottom:20px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <img src="${assets.ampm_logo || assets.ampm_header}" style="width:76px; height:86px; object-fit:contain;" alt="AM PM Pharmacy Logo">
            <div>
              <h2 style="font-size:20px; font-weight:800; color:#0369a1; margin:0; line-height:1.2; letter-spacing:0.02em;">AM PM PHARMACY SDN BHD <span style="font-size:13px; font-weight:600; color:#4b5563;">(572945-M)</span></h2>
              <div style="font-size:11.5px; color:#4b5563; line-height:1.45; max-width:480px; margin-top:5px;">
                ${comp.address}<br>
                TEL: ${comp.tel} | FAX: ${comp.fax} | EMAIL: ${comp.email}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="display:inline-block; background:#0284c7; color:#fff; font-size:12px; font-weight:800; padding:6px 16px; border-radius:4px; letter-spacing:0.06em; text-transform:uppercase;">
              SUPPLIER QUOTATION
            </div>
            <div style="font-size:12.5px; font-weight:700; color:#111827; margin-top:8px;">Ref: ${quoteNo}</div>
            <div style="font-size:11.5px; color:#4b5563; margin-top:2px;">Date: ${quotationState.date}</div>
          </div>
        </div>
      `;
    }

    const isCompetitor = (companyKey === 'ssj' || companyKey === 'ampm');
    const totalFormatted = isCompetitor ? `RM ${Math.round(total).toLocaleString()}` : `RM ${total.toFixed(2)}`;

    // Clean spacer rows if few items to fill the A4 page proportionately
    let spacerRows = '';
    const neededSpacers = Math.max(0, 5 - quotationState.items.length);
    for (let i = 0; i < neededSpacers; i++) {
      spacerRows += `
        <tr style="border-bottom:1px solid #f3f4f6; height:42px;">
          <td style="padding:10px 10px; text-align:center; color:#e5e7eb;">&bull;</td>
          <td style="padding:10px 10px;"></td>
          <td style="padding:10px 12px;"></td>
          <td style="padding:10px 10px;"></td>
          <td style="padding:10px 12px;"></td>
          <td style="padding:10px 12px;"></td>
        </tr>
      `;
    }

    return `
      <div class="a4-document a4-quotation-sheet" style="background:#ffffff; color:#111827; padding:28px 32px; border-radius:8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-size:11.5px; line-height:1.45; min-height:960px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
        <div>
          ${headerMarkup}

          <!-- Client & Term Details Grid -->
          <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:18px; margin-bottom:20px; background:#f9fafb; padding:14px 18px; border-radius:8px; border:1px solid #e5e7eb;">
            <div>
              <div style="font-size:11px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:0.04em;">CUSTOMER / ORGANIZATION</div>
              <div style="font-size:15px; font-weight:800; color:#111827; margin-top:3px;">${escapeHtml(quotationState.clientName)}</div>
              <div style="font-size:11.5px; color:#374151; margin-top:3px;"><strong>Attn:</strong> ${escapeHtml(quotationState.attn)}</div>
              <div style="font-size:11.5px; color:#374151;"><strong>Tel:</strong> ${escapeHtml(quotationState.phone)}</div>
              <div style="font-size:11.5px; color:#4b5563; margin-top:3px; line-height:1.4;">${escapeHtml(quotationState.address)}</div>
            </div>
            <div style="font-size:11.5px; line-height:1.6; border-left:1px solid #e5e7eb; padding-left:18px;">
              <div><strong>Validity:</strong> ${quotationState.validityDays} Days (Until ${validUntil})</div>
              <div><strong>Delivery:</strong> ${escapeHtml(quotationState.deliveryTerms)}</div>
              <div><strong>Payment:</strong> ${escapeHtml(quotationState.paymentTerms)}</div>
              <div style="margin-top:6px; font-size:11px; color:#4b5563;"><strong>Bank:</strong> ${comp.bankInfo}</div>
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom:18px;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#f3f4f6; border-top:2px solid #d1d5db; border-bottom:2px solid #d1d5db;">
                  <th style="padding:10px 10px; text-align:center; width:35px; font-size:11.5px; font-weight:800; color:#374151; text-transform:uppercase;">#</th>
                  <th style="padding:10px 10px; text-align:left; width:100px; font-size:11.5px; font-weight:800; color:#374151; text-transform:uppercase;">Item Code</th>
                  <th style="padding:10px 12px; text-align:left; font-size:11.5px; font-weight:800; color:#374151; text-transform:uppercase;">Description & Specification</th>
                  <th style="padding:10px 10px; text-align:center; width:55px; font-size:11.5px; font-weight:800; color:#374151; text-transform:uppercase;">Qty</th>
                  <th style="padding:10px 12px; text-align:right; width:105px; font-size:11.5px; font-weight:800; color:#374151; text-transform:uppercase;">Unit Price (RM)</th>
                  <th style="padding:10px 12px; text-align:right; width:110px; font-size:11.5px; font-weight:800; color:#374151; text-transform:uppercase;">Subtotal (RM)</th>
                </tr>
              </thead>
              <tbody>
                ${quotationState.items.map((it, idx) => {
                  const uPrice = getAdjustedPrice(it.pmgPrice, companyKey);
                  const sub = isCompetitor ? Math.round(uPrice * it.qty) : (uPrice * it.qty);
                  const uPriceStr = isCompetitor ? `${Math.round(uPrice)}` : uPrice.toFixed(2);
                  const subStr = isCompetitor ? `${Math.round(sub).toLocaleString()}` : sub.toFixed(2);
                  return `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                      <td style="padding:13px 10px; text-align:center; color:#6b7280; font-weight:600;">${idx + 1}</td>
                      <td style="padding:13px 10px; font-family:monospace; font-weight:600; color:#374151; font-size:12px;">${escapeHtml(it.sku || '-')}</td>
                      <td style="padding:13px 12px;">
                        <div style="font-weight:700; color:#111827; font-size:13px;">${escapeHtml(it.name)}</div>
                        ${it.desc ? `<div style="font-size:11px; color:#4b5563; margin-top:2px; line-height:1.35;">${escapeHtml(it.desc)}</div>` : ''}
                      </td>
                      <td style="padding:13px 10px; text-align:center; font-weight:700; font-size:13px; color:#111827;">${it.qty}</td>
                      <td style="padding:13px 12px; text-align:right; font-family:monospace; font-size:13px; color:#111827;">${uPriceStr}</td>
                      <td style="padding:13px 12px; text-align:right; font-family:monospace; font-weight:700; font-size:13px; color:#111827;">${subStr}</td>
                    </tr>
                  `;
                }).join('')}
                ${spacerRows}
              </tbody>
            </table>
          </div>

          <!-- Totals & Commercial Notes -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:10px; margin-bottom:20px;">
            <div style="max-width:56%; font-size:11px; color:#4b5563; line-height:1.55;">
              <p style="font-weight:800; color:#1f2937; margin-bottom:4px; font-size:11.5px;">Terms & Commercial Notes:</p>
              <p style="margin-bottom:2px;">1. Prices quoted are in Ringgit Malaysia (RM) and inclusive of local delivery to specified Kuching destination unless otherwise noted.</p>
              <p style="margin-bottom:2px;">2. Products are 100% genuine medical/pharmaceutical grade registered under Ministry of Health Malaysia (NPRA / MDA).</p>
              <p>3. To confirm acceptance of quotation, please issue an official Purchase Order (PO) or confirm via email/WhatsApp.</p>
            </div>
            <div style="width:265px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px;">
                <span style="color:#6b7280;">Subtotal (excl. tax):</span>
                <span style="font-family:monospace; font-weight:600;">${totalFormatted}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:11.5px;">
                <span style="color:#6b7280;">SST (0% Medical / Rx):</span>
                <span style="font-family:monospace; font-weight:600;">${isCompetitor ? 'RM 0' : 'RM 0.00'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-top:2px solid #111827; padding-top:8px; font-size:14px; font-weight:800; color:#111827;">
                <span>GRAND TOTAL:</span>
                <span style="font-family:monospace; color:${companyKey === 'pmg' ? '#b91c1c' : '#111827'};">${totalFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Electronic Generation Notice (Replacing Signature Blocks) -->
        <div style="margin-top:auto; padding-top:22px; border-top:1px solid #e2e8f0; text-align:center;">
          <div style="display:inline-block; border:1px solid #cbd5e1; background:#f8fafc; border-radius:6px; padding:9px 28px; font-size:12px; font-weight:700; color:#334155; letter-spacing:0.03em;">
            This is generated electronically. No signature is needed.
          </div>
          <div style="font-size:10px; color:#94a3b8; margin-top:6px; letter-spacing:0.02em;">
            Computer-generated quotation &bull; Kota Sentosa Operations &bull; Valid within stated period
          </div>
        </div>
      </div>
    `;
  }

  // ─── COMPARATIVE MATRIX RENDERER ─────────────────────────────────────────────
  function renderComparisonMatrixHTML() {
    const pmgTotal = calculateQuoteTotal('pmg');
    const ssjTotal = calculateQuoteTotal('ssj');
    const ampmTotal = calculateQuoteTotal('ampm');

    const ssjDiff = ssjTotal - pmgTotal;
    const ssjDiffPct = ((ssjDiff / pmgTotal) * 100).toFixed(1);
    const ampmDiff = ampmTotal - pmgTotal;
    const ampmDiffPct = ((ampmDiff / pmgTotal) * 100).toFixed(1);

    return `
      <div class="a4-document a4-quotation-sheet" style="background:#ffffff; color:#111827; padding:28px 32px; border-radius:8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-size:11.5px; min-height:960px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
        <div>
          <div style="text-align:center; border-bottom:2px solid #1e3a8a; padding-bottom:12px; margin-bottom:16px;">
            <h2 style="font-size:18px; font-weight:800; color:#1e3a8a; margin:0;">CORPORATE PROCUREMENT 3-QUOTATION EVALUATION MATRIX</h2>
            <p style="font-size:11px; color:#4b5563; margin-top:3px;">Competitive Price Benchmark & Winning Bid Justification Document</p>
          </div>

          <div style="display:flex; justify-content:space-between; background:#f8fafc; border:1px solid #cbd5e1; padding:10px 14px; border-radius:6px; margin-bottom:16px; font-size:11px;">
            <div><strong>Project / Client:</strong> ${escapeHtml(quotationState.clientName)}</div>
            <div><strong>Attn:</strong> ${escapeHtml(quotationState.attn)}</div>
            <div><strong>Evaluation Date:</strong> ${quotationState.date}</div>
          </div>

          <!-- 3-Way Table -->
          <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:11px;">
            <thead>
              <tr style="background:#0f172a; color:#fff;">
                <th style="padding:8px 6px; text-align:center; width:25px;">#</th>
                <th style="padding:8px 8px; text-align:left;">Item Name & Specifications</th>
                <th style="padding:8px 6px; text-align:center; width:35px;">Qty</th>
                <th style="padding:8px 8px; text-align:right; width:90px; background:#1e3a8a;">PMG Kota Sentosa (RM)</th>
                <th style="padding:8px 8px; text-align:right; width:85px;">SSJ Pharma (RM)</th>
                <th style="padding:8px 8px; text-align:right; width:85px;">AM PM Pharmacy (RM)</th>
                <th style="padding:8px 6px; text-align:center; width:80px;">Variance vs PMG</th>
              </tr>
            </thead>
            <tbody>
              ${quotationState.items.map((it, idx) => {
                const pP = it.pmgPrice;
                const sP = getAdjustedPrice(pP, 'ssj');
                const aP = getAdjustedPrice(pP, 'ampm');
                return `
                  <tr style="border-bottom:1px solid #e2e8f0; ${idx % 2 === 1 ? 'background:#f8fafc;' : ''}">
                    <td style="padding:8px 6px; text-align:center; color:#64748b;">${idx + 1}</td>
                    <td style="padding:8px 8px;">
                      <div style="font-weight:700;">${escapeHtml(it.name)}</div>
                      <div style="font-size:10px; color:#64748b;">${escapeHtml(it.sku || '')}</div>
                    </td>
                    <td style="padding:8px 6px; text-align:center; font-weight:700;">${it.qty}</td>
                    <td style="padding:8px 8px; text-align:right; font-weight:700; color:#1e3a8a; background:#eff6ff;">${(pP * it.qty).toFixed(2)}</td>
                    <td style="padding:8px 8px; text-align:right; color:#334155; font-family:monospace;">${Math.round(sP * it.qty).toLocaleString()}</td>
                    <td style="padding:8px 8px; text-align:right; color:#334155; font-family:monospace;">${Math.round(aP * it.qty).toLocaleString()}</td>
                    <td style="padding:8px 6px; text-align:center; font-weight:700; color:#15803d; font-size:10px;">+${quotationState.ssjVariancePct}% to +${quotationState.ampmVariancePct}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background:#f1f5f9; font-weight:800; font-size:11.5px; border-top:2px solid #0f172a;">
                <td colspan="3" style="padding:10px 8px; text-align:right;">TOTAL EVALUATED PRICE (RM):</td>
                <td style="padding:10px 8px; text-align:right; color:#1e3a8a; background:#dbeafe; font-size:12.5px;">RM ${pmgTotal.toFixed(2)}</td>
                <td style="padding:10px 8px; text-align:right; font-family:monospace;">RM ${Math.round(ssjTotal).toLocaleString()}</td>
                <td style="padding:10px 8px; text-align:right; font-family:monospace;">RM ${Math.round(ampmTotal).toLocaleString()}</td>
                <td style="padding:10px 6px; text-align:center; color:#15803d;">BEST OFFER</td>
              </tr>
            </tfoot>
          </table>

          <!-- Recommendation Banner -->
          <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:6px; padding:12px 16px; margin-bottom:16px;">
            <div style="font-weight:800; color:#166534; font-size:12px; display:flex; align-items:center; gap:6px;">
              <span>✓</span> RECOMMENDATION & TENDER JUSTIFICATION
            </div>
            <p style="font-size:11px; color:#14532d; margin-top:4px; line-height:1.45;">
              Following formal price benchmarking across 3 licensed pharmaceutical suppliers, <strong>PMG PHARMACY (KOTA SENTOSA)</strong> submitted the lowest complying bid of <strong>RM ${pmgTotal.toFixed(2)}</strong>. This generates direct cost savings of <strong>RM ${ssjDiff.toFixed(2)} (${ssjDiffPct}%)</strong> compared to SSJ Pharma (RM ${Math.round(ssjTotal).toLocaleString()}) and <strong>RM ${ampmDiff.toFixed(2)} (${ampmDiffPct}%)</strong> compared to AM PM Pharmacy (RM ${Math.round(ampmTotal).toLocaleString()}). Recommendation is to award procurement to PMG Pharmacy Kota Sentosa.
            </p>
          </div>
        </div>

        <!-- Evaluation Sign-Off -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin-top:24px; font-size:11px;">
          <div>
            <div style="font-weight:700; color:#475569; margin-bottom:32px;">Prepared / Verified By:</div>
            <div style="border-top:1px solid #94a3b8; padding-top:4px;">
              <strong>William Chai (Pharmacist-in-Charge)</strong><br>
              PMG Pharmacy Kota Sentosa
            </div>
          </div>
          <div>
            <div style="font-weight:700; color:#475569; margin-bottom:32px;">Procurement Officer Approval:</div>
            <div style="border-top:1px solid #94a3b8; padding-top:4px;">
              <strong>Authorized Signatory / Committee Head</strong><br>
              Signature & Chop
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Presets for 3-Quotation
  pmgAdminUtils.loadQuotePreset = function(presetKey) {
    if (presetKey === 'firstaid') {
      quotationState.clientName = 'Sarawak Energy Berhad (Batu 7 Substation)';
      quotationState.items = [
        { sku: 'FAK-CORP-01', name: 'Workplace Comprehensive First Aid Kit (MS 1390:2010 Compliant)', desc: 'Heavy duty wall-mountable ABS casing, 45 essential surgical & first aid components', qty: 5, pmgPrice: 185.00 },
        { sku: 'DIS-ALC-70', name: 'Alcoswab 70% Isopropyl Alcohol Swabs', desc: 'Medical grade sterile disinfectant swabs (Box of 100s)', qty: 20, pmgPrice: 8.50 },
        { sku: 'MED-PAN-500', name: 'Panadol ActiFast 500mg (Paracetamol)', desc: 'Fast absorption caplets for fever and pain (Box of 100s)', qty: 10, pmgPrice: 38.00 },
        { sku: 'SUR-GAU-10', name: 'Sterile Gauze Swabs 10cm x 10cm 8-ply', desc: 'Hospital grade sterile cotton swabs (Pack of 5s x 20 pouches)', qty: 15, pmgPrice: 16.50 },
        { sku: 'DEV-THM-DIG', name: 'Rossmax Digital Clinical Thermometer TG100', desc: 'Waterproof fast 60s oral/axillary reading with fever alarm', qty: 5, pmgPrice: 19.90 }
      ];
    } else if (presetKey === 'clinic') {
      quotationState.clientName = 'Klinik Sentosa Medic & Surgeri';
      quotationState.items = [
        { sku: 'DIAG-GLU-50', name: 'Accu-Chek Instant Blood Glucose Test Strips 50s', desc: 'ISO 15197:2013 high precision strips', qty: 25, pmgPrice: 68.00 },
        { sku: 'DIAG-LNC-100', name: 'Softclix Sterile Blood Lancets 100s', desc: 'Ultra-thin siliconized lancets', qty: 20, pmgPrice: 22.00 },
        { sku: 'DEV-BP-HEM', name: 'Omron HEM-7120 Digital Upper Arm BP Monitor', desc: 'IntelliSense clinical accuracy cuff', qty: 6, pmgPrice: 155.00 },
        { sku: 'DIAG-COV-25', name: 'Salixium COVID-19 Ag Rapid Test Kit (Saliva/Nasal)', desc: 'MDA approved rapid cassette (Box of 25 kits)', qty: 10, pmgPrice: 125.00 },
        { sku: 'SUR-GLV-LAT', name: 'Medicos Powder-Free Examination Gloves 100s', desc: 'Latex textured grip, hospital standard', qty: 30, pmgPrice: 21.50 }
      ];
    } else if (presetKey === 'senior') {
      quotationState.clientName = 'Pusat Jagaan Warga Emas Kuching Sentosa';
      quotationState.items = [
        { sku: 'CARE-DIA-L', name: 'Certainty DryPants Adult Diapers Large (Pack of 10s)', desc: 'Anti-bacterial absorbent core, odor control', qty: 40, pmgPrice: 29.50 },
        { sku: 'CARE-PAD-60', name: 'Hospital Underpads Bed Sheet 60cm x 90cm (Pack of 10s)', desc: 'Waterproof diamond embossed sheet', qty: 30, pmgPrice: 15.00 },
        { sku: 'SOL-SAL-500', name: 'B.Braun Sodium Chloride 0.9% Normal Saline 500ml', desc: 'Sterile irrigating solution for wound toilet', qty: 50, pmgPrice: 7.20 },
        { sku: 'SUR-POVI-100', name: 'Betadine Antiseptic Solution 10% Povidone Iodine 100ml', desc: 'Broad spectrum topical antiseptic', qty: 20, pmgPrice: 14.50 },
        { sku: 'CARE-WIP-80', name: 'Antibacterial Bed Bath Wet Wipes 80s (Aloe Vera)', desc: 'Thick alcohol-free dermatological wipes', qty: 35, pmgPrice: 6.80 }
      ];
    } else if (presetKey === 'ppe') {
      quotationState.clientName = 'SJK(C) Sam Hap Hin, Kota Sentosa';
      quotationState.items = [
        { sku: 'PPE-MSK-50', name: 'Medicos 4-Ply Surgical Face Mask (Box of 50s)', desc: 'ASTM Level 3, BFE/PFE >= 99%', qty: 50, pmgPrice: 24.00 },
        { sku: 'PPE-SAN-5L', name: 'Antabax 75% Alcohol Hand Sanitizer Liquid 5 Litres', desc: 'Refill jug with moisturizers', qty: 10, pmgPrice: 58.00 },
        { sku: 'DEV-THM-IR', name: 'Infrared Non-Contact Forehead Thermometer', desc: 'Fast 1-second temperature scanning', qty: 8, pmgPrice: 48.00 },
        { sku: 'SUR-AID-100', name: 'Hansaplast Universal Water Resistant Plasters 100s', desc: 'Strong adhesion breathable dressings', qty: 15, pmgPrice: 13.50 }
      ];
    }
    persistQuotation();
    renderQuotationTab();
  };

  pmgAdminUtils.removeQuoteItem = function(idx) {
    if (quotationState.items.length <= 1) {
      alert('Quotation must contain at least 1 line item.');
      return;
    }
    quotationState.items.splice(idx, 1);
    persistQuotation();
    renderQuotationTab();
  };

  pmgAdminUtils.openAddQuoteItemModal = function() {
    const name = prompt('Enter Item Name / Brand:');
    if (!name) return;
    const desc = prompt('Enter Item Description / Specs / Packaging (optional):') || '';
    const qty = parseInt(prompt('Enter Quantity:', '1'), 10) || 1;
    const price = parseFloat(prompt('Enter PMG Base Price (RM):', '10.00')) || 10.00;
    const sku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);

    quotationState.items.push({ sku, name, desc, qty, pmgPrice: price });
    persistQuotation();
    renderQuotationTab();
  };

  pmgAdminUtils.printActiveQuotation = function() {
    const html = quotationState.activePreviewTab === 'comparison' ? renderComparisonMatrixHTML() : buildSingleQuotationHTML(quotationState.activePreviewTab);
    const title = quotationState.activePreviewTab === 'comparison' ? '3-Quotation Evaluation Matrix' : `Quotation - ${COMPANIES[quotationState.activePreviewTab].name}`;
    openPrintWindow(html, title);
  };

  pmgAdminUtils.printAll3Batch = function() {
    const page1 = buildSingleQuotationHTML('pmg');
    const page2 = buildSingleQuotationHTML('ssj');
    const page3 = buildSingleQuotationHTML('ampm');

    const batchHTML = `
      <div class="page-break">${page1}</div>
      <div class="page-break" style="page-break-before:always; break-before:page;">${page2}</div>
      <div style="page-break-before:always; break-before:page;">${page3}</div>
    `;
    openPrintWindow(batchHTML, 'PMG B2B 3-Quotation Procurement Pack');
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // MODULE 2: MANUAL INVOICING & OFFICIAL BILLING GENERATOR
  // ═════════════════════════════════════════════════════════════════════════════

  function renderInvoiceTab() {
    const view = document.getElementById('admin-view-invoice');
    if (!view) return;

    const subtotal = invoiceState.items.reduce((s, it) => s + (it.unitPrice * it.qty), 0);
    const totalDiscount = invoiceState.items.reduce((s, it) => s + (it.discount || 0), 0);
    const grandTotal = Math.max(0, subtotal - totalDiscount);
    const balanceDue = Math.max(0, grandTotal - (invoiceState.amountPaid || 0));
    const change = Math.max(0, (invoiceState.amountPaid || 0) - grandTotal);

    view.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Form Controls (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Bill Header Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3 border-b pb-2">
              <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i class="fa-solid fa-receipt text-emerald-600"></i> Customer & Invoice Particulars
              </h3>
              <button type="button" onclick="window.pmgAdminUtils.newInvoiceNumber()" class="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold transition">
                <i class="fa-solid fa-rotate mr-1"></i>New No.
              </button>
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Invoice / Receipt No.</label>
                  <input type="text" id="invNo" value="${escapeHtml(invoiceState.invoiceNo)}" onchange="window.pmgAdminUtils.updateInvField('invoiceNo', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Invoice Date</label>
                  <input type="date" id="invDate" value="${invoiceState.invoiceDate}" onchange="window.pmgAdminUtils.updateInvField('invoiceDate', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
              </div>

              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Customer / Patient / Company Name</label>
                <input type="text" id="invCustomerName" value="${escapeHtml(invoiceState.customerName)}" onchange="window.pmgAdminUtils.updateInvField('customerName', this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none">
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">IC / Passport / SSM No.</label>
                  <input type="text" id="invIcReg" value="${escapeHtml(invoiceState.icReg)}" onchange="window.pmgAdminUtils.updateInvField('icReg', this.value)"
                    placeholder="e.g. 850412-13-5591" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Contact Phone</label>
                  <input type="text" id="invPhone" value="${escapeHtml(invoiceState.phone)}" onchange="window.pmgAdminUtils.updateInvField('phone', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
              </div>

              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Dispensing Pharmacist / Attending Staff</label>
                <select id="invPharmacist" onchange="window.pmgAdminUtils.handlePharmacistSelect(this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none font-semibold">
                  ${BRANCH_STAFF.map(st => `
                    <option value="${escapeHtml(st.name)}" ${invoiceState.pharmacistName === st.name ? 'selected' : ''}>
                      ${escapeHtml(st.name)} (${st.position})${st.rph ? ' — ' + st.rph : ''}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Doctor / Clinic Referral (Optional)</label>
                <input type="text" id="invDocRef" value="${escapeHtml(invoiceState.doctorClinicRef || '')}" onchange="window.pmgAdminUtils.updateInvField('doctorClinicRef', this.value)"
                  placeholder="e.g. Klinik Kesihatan / Dr. Tan (Ref: RX-049)" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none">
              </div>
            </div>
          </div>

          <!-- Payment Details Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h4 class="font-bold text-gray-900 text-xs mb-2.5 flex items-center gap-1.5 border-b pb-2">
              <i class="fa-solid fa-credit-card text-emerald-600"></i> Payment & Settlement Details
            </h4>
            <div class="space-y-2 text-xs">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Payment Method</label>
                  <select id="invPaymentMethod" onchange="window.pmgAdminUtils.updateInvField('paymentMethod', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-400 outline-none">
                    <option value="Cash" ${invoiceState.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                    <option value="DuitNow QR" ${invoiceState.paymentMethod === 'DuitNow QR' ? 'selected' : ''}>DuitNow QR</option>
                    <option value="Credit Card" ${invoiceState.paymentMethod === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                    <option value="Debit Card" ${invoiceState.paymentMethod === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                    <option value="Bank Transfer" ${invoiceState.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                    <option value="Cheque" ${invoiceState.paymentMethod === 'Cheque' ? 'selected' : ''}>Cheque</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Auth / Ref No.</label>
                  <input type="text" id="invPaymentRef" value="${escapeHtml(invoiceState.paymentRef || '')}" onchange="window.pmgAdminUtils.updateInvField('paymentRef', this.value)"
                    placeholder="e.g. TXN-104928" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Amount Tendered (RM)</label>
                  <input type="number" step="0.01" id="invAmountPaid" value="${invoiceState.amountPaid}" onchange="window.pmgAdminUtils.updateInvField('amountPaid', parseFloat(this.value) || 0)"
                    class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
                <div class="bg-gray-50 p-2 rounded-lg border border-gray-200 flex flex-col justify-center">
                  <div class="text-[10px] text-gray-500 font-semibold">${change > 0 ? 'Change Due:' : 'Balance Due:'}</div>
                  <div class="text-sm font-extrabold ${change > 0 ? 'text-emerald-700' : (balanceDue > 0 ? 'text-rose-700' : 'text-gray-800')}">
                    RM ${change > 0 ? change.toFixed(2) : balanceDue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Billing Items Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3 border-b pb-2">
              <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i class="fa-solid fa-capsules text-emerald-600"></i> Dispensed Items (${invoiceState.items.length})
              </h3>
              <button type="button" onclick="window.pmgAdminUtils.openAddInvoiceItemModal()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs">
                <i class="fa-solid fa-plus"></i> Add Item
              </button>
            </div>

            <!-- Items Table -->
            <div class="overflow-x-auto max-h-56 overflow-y-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th class="py-1.5 px-2">Item & Category</th>
                    <th class="py-1.5 px-1 text-center w-10">Qty</th>
                    <th class="py-1.5 px-1 text-right w-16">Price</th>
                    <th class="py-1.5 px-1 text-right w-14">Disc</th>
                    <th class="py-1.5 px-1 text-center w-6"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${invoiceState.items.map((it, idx) => `
                    <tr class="hover:bg-gray-50/75">
                      <td class="py-1.5 px-2">
                        <div class="font-bold text-gray-900 truncate max-w-[170px]">${escapeHtml(it.name)}</div>
                        <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          it.category === 'Prescription (Rx)' ? 'bg-purple-100 text-purple-700' :
                          it.category === 'Medical Device' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }">${escapeHtml(it.category || 'OTC')}</span>
                      </td>
                      <td class="py-1.5 px-1 text-center font-semibold">${it.qty}</td>
                      <td class="py-1.5 px-1 text-right font-mono">${(it.unitPrice || 0).toFixed(2)}</td>
                      <td class="py-1.5 px-1 text-right font-mono text-rose-600">-${(it.discount || 0).toFixed(2)}</td>
                      <td class="py-1.5 px-1 text-center">
                        <button type="button" onclick="window.pmgAdminUtils.removeInvoiceItem(${idx})" class="text-rose-500 hover:text-rose-700 p-1">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="mt-3 pt-3 border-t flex items-center justify-between text-xs">
              <span class="text-gray-500">Net Invoice Total:</span>
              <span class="text-base font-extrabold text-emerald-700">RM ${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Right: Official A4 Receipt Live Sheet (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <i class="fa-solid fa-file-invoice text-emerald-600"></i> Official Medical Receipt & Tax Invoice
                </h3>
                <p class="text-gray-500 text-xs">A4 printable format for personal tax relief & corporate medical insurance claim</p>
              </div>
              <button type="button" onclick="window.pmgAdminUtils.printInvoice()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-print"></i> Print Official Receipt
              </button>
            </div>

            <div id="invoiceLiveSheetContainer" class="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-5 overflow-auto max-h-[820px]">
              ${buildOfficialInvoiceHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  pmgAdminUtils.newInvoiceNumber = function() {
    incrementInvoiceCounter();
    invoiceState.invoiceNo = generateNextInvoiceNumber();
    persistInvoice();
    renderInvoiceTab();
  };

  pmgAdminUtils.updateInvField = function(field, val) {
    invoiceState[field] = val;
    persistInvoice();
    const sheet = document.getElementById('invoiceLiveSheetContainer');
    if (sheet) sheet.innerHTML = buildOfficialInvoiceHTML();
  };

  pmgAdminUtils.handlePharmacistSelect = function(name) {
    invoiceState.pharmacistName = name;
    const found = BRANCH_STAFF.find(s => s.name === name);
    if (found) {
      invoiceState.pharmacistRole = found.position;
      invoiceState.pharmacistRph = found.rph;
    }
    persistInvoice();
    renderInvoiceTab();
  };

  pmgAdminUtils.removeInvoiceItem = function(idx) {
    if (invoiceState.items.length <= 1) {
      alert('Invoice must contain at least 1 item.');
      return;
    }
    invoiceState.items.splice(idx, 1);
    persistInvoice();
    renderInvoiceTab();
  };

  pmgAdminUtils.openAddInvoiceItemModal = function() {
    const name = prompt('Enter Item Name / Medication:');
    if (!name) return;
    const cat = prompt('Select Category: 1) Prescription (Rx), 2) OTC, 3) Medical Device, 4) Supplement', '2');
    const categories = { '1': 'Prescription (Rx)', '2': 'Over-The-Counter (OTC)', '3': 'Medical Device', '4': 'Supplement' };
    const category = categories[cat] || 'Over-The-Counter (OTC)';
    const qty = parseInt(prompt('Enter Quantity:', '1'), 10) || 1;
    const price = parseFloat(prompt('Enter Unit Price (RM):', '25.00')) || 25.00;
    const disc = parseFloat(prompt('Enter Discount (RM, or 0):', '0.00')) || 0.00;

    invoiceState.items.push({ name, category, qty, unitPrice: price, discount: disc });
    persistInvoice();
    renderInvoiceTab();
  };

  // ─── OFFICIAL INVOICE / RECEIPT A4 HTML ───────────────────────────────────────
  function buildOfficialInvoiceHTML() {
    const assets = window.ADMIN_ASSETS || {};
    const subtotal = invoiceState.items.reduce((s, it) => s + (it.unitPrice * it.qty), 0);
    const totalDiscount = invoiceState.items.reduce((s, it) => s + (it.discount || 0), 0);
    const grandTotal = Math.max(0, subtotal - totalDiscount);
    const taxReliefSubtotal = invoiceState.items
      .filter(it => it.category === 'Prescription (Rx)' || it.category === 'Medical Device')
      .reduce((s, it) => s + ((it.unitPrice * it.qty) - (it.discount || 0)), 0);

    return `
      <div class="a4-document" style="background:#ffffff; color:#111827; padding:28px 32px; border-radius:8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-size:11px; line-height:1.4;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #b91c1c; padding-bottom:14px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <img src="${assets.pmg_heart_logo || 'icons/icon-192.png'}" style="width:72px; height:72px; object-fit:contain;" alt="PMG Logo">
            <div>
              <h2 style="font-size:17px; font-weight:800; color:#b91c1c; margin:0; line-height:1.2; letter-spacing:0.02em;">PMG PHARMACY KOTA SENTOSA</h2>
              <div style="font-size:10px; color:#4b5563; line-height:1.35; max-width:440px; margin-top:3px;">
                Ground Floor, Sublot 1, Lot 460, Block 227 KNLD, 7th Mile, Jalan Penrissen, 93250 Kuching, Sarawak.<br>
                TEL: 082-629 118 / 011-1050 8911 | EMAIL: customercare@pmghealthcare.com
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="display:inline-block; background:#065f46; color:#fff; font-size:11px; font-weight:800; padding:4px 12px; border-radius:4px; letter-spacing:0.05em; text-transform:uppercase;">
              TAX & MEDICAL RECEIPT
            </div>
            <div style="font-size:12px; font-weight:800; color:#111827; margin-top:6px; font-family:monospace;">${escapeHtml(invoiceState.invoiceNo || 'INV-KTS-001')}</div>
            <div style="font-size:10px; color:#4b5563;">Date: ${invoiceState.invoiceDate}</div>
          </div>
        </div>

        <!-- Particulars Grid -->
        <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:16px; margin-bottom:16px; background:#f9fafb; padding:10px 14px; border-radius:6px; border:1px solid #e5e7eb; font-size:10.5px;">
          <div>
            <div style="font-size:9.5px; font-weight:700; color:#6b7280; text-transform:uppercase;">BILLED TO / PATIENT PARTICULARS</div>
            <div style="font-size:12px; font-weight:800; color:#111827; margin-top:2px;">${escapeHtml(invoiceState.customerName)}</div>
            <div><strong>NRIC / SSM No:</strong> ${escapeHtml(invoiceState.icReg || '-')}</div>
            <div><strong>Contact No:</strong> ${escapeHtml(invoiceState.phone || '-')}</div>
            ${invoiceState.doctorClinicRef ? `<div><strong>Clinic / Doctor Ref:</strong> ${escapeHtml(invoiceState.doctorClinicRef)}</div>` : ''}
          </div>
          <div>
            <div style="font-size:9.5px; font-weight:700; color:#6b7280; text-transform:uppercase;">PAYMENT & SETTLEMENT</div>
            <div><strong>Method:</strong> ${escapeHtml(invoiceState.paymentMethod)}</div>
            ${invoiceState.paymentRef ? `<div><strong>Transaction Ref:</strong> <span style="font-family:monospace;">${escapeHtml(invoiceState.paymentRef)}</span></div>` : ''}
            <div><strong>Status:</strong> <span style="color:#059669; font-weight:700;">PAID IN FULL</span></div>
            <div><strong>Branch Code:</strong> KS01 (Kota Sentosa)</div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10.5px;">
          <thead>
            <tr style="background:#f3f4f6; border-top:1px solid #d1d5db; border-bottom:1px solid #d1d5db;">
              <th style="padding:6px 8px; text-align:center; width:25px;">#</th>
              <th style="padding:6px 8px; text-align:left;">Item / Medication Description</th>
              <th style="padding:6px 8px; text-align:left; width:100px;">Category</th>
              <th style="padding:6px 8px; text-align:center; width:45px;">Qty</th>
              <th style="padding:6px 8px; text-align:right; width:75px;">Price (RM)</th>
              <th style="padding:6px 8px; text-align:right; width:70px;">Disc (RM)</th>
              <th style="padding:6px 8px; text-align:right; width:80px;">Total (RM)</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceState.items.map((it, idx) => {
              const line = (it.unitPrice * it.qty) - (it.discount || 0);
              return `
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:7px 8px; text-align:center; color:#6b7280;">${idx + 1}</td>
                  <td style="padding:7px 8px; font-weight:700; color:#111827;">${escapeHtml(it.name)}</td>
                  <td style="padding:7px 8px; font-size:9.5px; color:#4b5563;">${escapeHtml(it.category || 'OTC')}</td>
                  <td style="padding:7px 8px; text-align:center; font-weight:700;">${it.qty}</td>
                  <td style="padding:7px 8px; text-align:right; font-family:monospace;">${it.unitPrice.toFixed(2)}</td>
                  <td style="padding:7px 8px; text-align:right; font-family:monospace; color:#dc2626;">${it.discount ? `-${it.discount.toFixed(2)}` : '0.00'}</td>
                  <td style="padding:7px 8px; text-align:right; font-family:monospace; font-weight:700;">${line.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Totals & Tax Relief Notice -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
          <div style="max-width:55%;">
            <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:8px 12px; font-size:9.5px; color:#065f46;">
              <div style="font-weight:700; display:flex; align-items:center; gap:4px;">
                <span>📋</span> LHDN PERSONAL INCOME TAX RELIEF NOTICE
              </div>
              <p style="margin-top:3px; line-height:1.35;">
                Under Section 46(1)(g) of the Malaysian Income Tax Act 1967, medical expenses for serious diseases, health screening, and approved medical self-monitoring devices are eligible for tax relief up to RM 10,000.
                <strong>Tax Relief Eligible Amount: RM ${taxReliefSubtotal.toFixed(2)}</strong>.
              </p>
            </div>
            <div style="font-size:9px; color:#6b7280; margin-top:6px;">
              * Goods sold are strictly non-returnable once dispensed as governed under the Malaysian Poisons Act 1952 and Sale of Drugs Act 1952.
            </div>
          </div>

          <div style="width:230px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:10px 14px; font-size:10.5px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#6b7280;">Subtotal:</span>
              <span style="font-family:monospace; font-weight:600;">RM ${subtotal.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#dc2626;">
              <span>Total Discount:</span>
              <span style="font-family:monospace; font-weight:600;">-RM ${totalDiscount.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#6b7280;">SST (0% Medical):</span>
              <span style="font-family:monospace; font-weight:600;">RM 0.00</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:2px solid #111827; padding-top:6px; font-size:13px; font-weight:800; color:#065f46;">
              <span>TOTAL PAID:</span>
              <span style="font-family:monospace;">RM ${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Pharmacist Stamp & Signature Box -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin-top:25px; padding-top:14px; border-top:1px solid #e5e7eb;">
          <div>
            <div style="font-size:10px; color:#4b5563; line-height:1.4;">
              <strong>Dispensed / Issued By:</strong><br>
              ${escapeHtml(invoiceState.pharmacistName)}<br>
              <span style="font-size:9.5px; color:#6b7280;">${escapeHtml(invoiceState.pharmacistRole || 'Pharmacist')}${invoiceState.pharmacistRph ? ' · ' + escapeHtml(invoiceState.pharmacistRph) : ''}</span>
            </div>
            <div style="margin-top:25px; border-top:1px dashed #9ca3af; padding-top:3px; font-size:9.5px; color:#6b7280;">
              Dispenser Signature
            </div>
          </div>

          <div>
            <div style="border:1.5px dashed #059669; border-radius:6px; height:85px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f0fdf4; text-align:center; padding:6px;">
              <div style="font-size:10px; font-weight:800; color:#065f46; letter-spacing:0.04em;">PMG PHARMACY KOTA SENTOSA</div>
              <div style="font-size:9px; font-weight:700; color:#047857; margin-top:2px;">REGISTERED PHARMACIST STAMP</div>
              <div style="font-size:8.5px; color:#065f46; margin-top:2px;">${escapeHtml(invoiceState.pharmacistName)} ${invoiceState.pharmacistRph ? '(' + escapeHtml(invoiceState.pharmacistRph) + ')' : ''}</div>
              <div style="font-size:8px; color:#059669; margin-top:1px;">Lembaga Farmasi Malaysia (Pharmacy Board)</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  pmgAdminUtils.printInvoice = function() {
    const html = buildOfficialInvoiceHTML();
    openPrintWindow(html, `PMG Tax Invoice - ${invoiceState.invoiceNo || 'INV'}`);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // MODULE 3: HQ INCIDENT REPORT DIGITAL AUTO-FILL & PDF EXPORTER
  // ═════════════════════════════════════════════════════════════════════════════

  function renderIncidentTab() {
    const view = document.getElementById('admin-view-incident');
    if (!view) return;

    view.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Form Controls (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Setup & Presets Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3 border-b pb-2">
              <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> PMG HQ Incident Form Autofill
              </h3>
              <span class="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200">Official HQ Spec</span>
            </div>

            <!-- Quick Incident Scenario Presets -->
            <div class="mb-3">
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Load Standard Incident Scenario</label>
              <div class="grid grid-cols-1 gap-1.5">
                <button type="button" onclick="window.pmgAdminUtils.loadIncidentPreset('nearmiss')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 rounded-lg text-xs font-medium transition flex items-center justify-between">
                  <span>💊 Dispensing Near-Miss / Strength Mislabel</span>
                  <span class="text-[10px] text-gray-400 font-normal">Dispensary</span>
                </button>
                <button type="button" onclick="window.pmgAdminUtils.loadIncidentPreset('till')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 rounded-lg text-xs font-medium transition flex items-center justify-between">
                  <span>💵 EOD Cash Till Discrepancy / Shortage</span>
                  <span class="text-[10px] text-gray-400 font-normal">Counter</span>
                </button>
                <button type="button" onclick="window.pmgAdminUtils.loadIncidentPreset('tardy')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 rounded-lg text-xs font-medium transition flex items-center justify-between">
                  <span>⏰ Unscheduled Absence / Shift Abandonment</span>
                  <span class="text-[10px] text-gray-400 font-normal">HR / Roster</span>
                </button>
                <button type="button" onclick="window.pmgAdminUtils.loadIncidentPreset('coldchain')" class="text-left px-2.5 py-1.5 bg-gray-50 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 rounded-lg text-xs font-medium transition flex items-center justify-between">
                  <span>❄️ Cold Chain Fridge Temp Excursion (>8°C)</span>
                  <span class="text-[10px] text-gray-400 font-normal">Safety</span>
                </button>
              </div>
            </div>

            <!-- Form Particulars -->
            <div class="space-y-2.5 text-xs">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Branch</label>
                  <input type="text" value="PMG Pharmacy Kota Sentosa" readonly
                    class="w-full border border-gray-200 bg-gray-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none">
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Date & Time</label>
                  <div class="grid grid-cols-2 gap-1">
                    <input type="date" id="incDate" value="${incidentState.date}" onchange="window.pmgAdminUtils.updateIncField('date', this.value)"
                      class="border border-gray-300 rounded px-1.5 py-1 text-xs outline-none">
                    <input type="time" id="incTime" value="${incidentState.time}" onchange="window.pmgAdminUtils.updateIncField('time', this.value)"
                      class="border border-gray-300 rounded px-1.5 py-1 text-xs outline-none">
                  </div>
                </div>
              </div>

              <!-- Employee & Manager -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Employee Name</label>
                  <select id="incEmp" onchange="window.pmgAdminUtils.handleIncidentStaffSelect('employee', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-rose-400 outline-none">
                    ${BRANCH_STAFF.map(st => `
                      <option value="${escapeHtml(st.name)}" ${incidentState.employeeName === st.name ? 'selected' : ''}>
                        ${escapeHtml(st.name)}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Title / Position</label>
                  <input type="text" id="incEmpPos" value="${escapeHtml(incidentState.employeePosition)}" onchange="window.pmgAdminUtils.updateIncField('employeePosition', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Manager Name</label>
                  <select id="incMgr" onchange="window.pmgAdminUtils.handleIncidentStaffSelect('manager', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-rose-400 outline-none">
                    ${BRANCH_STAFF.map(st => `
                      <option value="${escapeHtml(st.name)}" ${incidentState.managerName === st.name ? 'selected' : ''}>
                        ${escapeHtml(st.name)}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-gray-700 mb-0.5">Manager Title</label>
                  <input type="text" id="incMgrPos" value="${escapeHtml(incidentState.managerPosition)}" onchange="window.pmgAdminUtils.updateIncField('managerPosition', this.value)"
                    class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none">
                </div>
              </div>

              <div>
                <label class="block font-bold text-gray-700 mb-0.5">Location of Incident</label>
                <input type="text" id="incLocation" value="${escapeHtml(incidentState.location)}" onchange="window.pmgAdminUtils.updateIncField('location', this.value)"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-rose-400 outline-none">
              </div>
            </div>
          </div>

          <!-- Narrative Sections Card -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 text-xs">
            <div>
              <label class="block font-bold text-gray-800 mb-1">Description Of Incident</label>
              <textarea id="incDesc" rows="3" onchange="window.pmgAdminUtils.updateIncField('description', this.value)"
                class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-400 outline-none leading-relaxed">${escapeHtml(incidentState.description)}</textarea>
            </div>

            <div>
              <label class="block font-bold text-gray-800 mb-1">Employee's Explanation</label>
              <textarea id="incExp" rows="2" onchange="window.pmgAdminUtils.updateIncField('explanation', this.value)"
                class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-400 outline-none leading-relaxed">${escapeHtml(incidentState.explanation)}</textarea>
            </div>

            <div>
              <label class="block font-bold text-gray-800 mb-1">Witness(es)</label>
              <input type="text" id="incWitness" value="${escapeHtml(incidentState.witness)}" onchange="window.pmgAdminUtils.updateIncField('witness', this.value)"
                class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-rose-400 outline-none">
            </div>

            <!-- Action to be taken checkboxes -->
            <div class="bg-rose-50/60 border border-rose-200 rounded-lg p-2.5">
              <label class="block font-bold text-rose-900 mb-2">Action to be taken (Disciplinary / Corrective)</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" ${incidentState.actionVerbal ? 'checked' : ''} onchange="window.pmgAdminUtils.updateIncField('actionVerbal', this.checked)" class="rounded text-rose-600">
                  <span class="text-gray-800 font-medium">Verbal Warning</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" ${incidentState.actionProbation ? 'checked' : ''} onchange="window.pmgAdminUtils.updateIncField('actionProbation', this.checked)" class="rounded text-rose-600">
                  <span class="text-gray-800 font-medium">Probation</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" ${incidentState.actionDismissal ? 'checked' : ''} onchange="window.pmgAdminUtils.updateIncField('actionDismissal', this.checked)" class="rounded text-rose-600">
                  <span class="text-gray-800 font-medium">Dismissal</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" ${incidentState.actionWritten ? 'checked' : ''} onchange="window.pmgAdminUtils.updateIncField('actionWritten', this.checked)" class="rounded text-rose-600">
                  <span class="text-gray-800 font-medium">Written warning</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" ${incidentState.actionSuspension ? 'checked' : ''} onchange="window.pmgAdminUtils.updateIncField('actionSuspension', this.checked)" class="rounded text-rose-600">
                  <span class="text-gray-800 font-medium">Suspension</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" ${incidentState.actionOther ? 'checked' : ''} onchange="window.pmgAdminUtils.updateIncField('actionOther', this.checked)" class="rounded text-rose-600">
                  <span class="text-gray-800 font-medium">Other</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block font-bold text-gray-800 mb-1">Action Explanation & Remedial Plan</label>
              <textarea id="incExpAction" rows="2" onchange="window.pmgAdminUtils.updateIncField('explanationAction', this.value)"
                class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-400 outline-none leading-relaxed">${escapeHtml(incidentState.explanationAction)}</textarea>
            </div>
          </div>
        </div>

        <!-- Right: Official PMG HQ Document Mirror (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <i class="fa-solid fa-file-contract text-rose-600"></i> PMG HQ Official Incident Report Layout
                </h3>
                <p class="text-gray-500 text-xs">Direct visual replica of official Sarikei Management Office PDF format</p>
              </div>
              <button type="button" onclick="window.pmgAdminUtils.printIncidentReport()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-print"></i> Print Official Report (PDF)
              </button>
            </div>

            <div id="incidentLiveSheetContainer" class="bg-gray-100 border border-gray-300 rounded-xl p-3 sm:p-5 overflow-auto max-h-[820px]">
              ${buildOfficialIncidentReportHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  pmgAdminUtils.handleIncidentStaffSelect = function(type, name) {
    const found = BRANCH_STAFF.find(s => s.name === name);
    if (!found) return;
    if (type === 'employee') {
      incidentState.employeeName = found.name;
      incidentState.employeePosition = found.position;
    } else {
      incidentState.managerName = found.name;
      incidentState.managerPosition = found.position;
    }
    persistIncident();
    renderIncidentTab();
  };

  pmgAdminUtils.updateIncField = function(field, val) {
    incidentState[field] = val;
    persistIncident();
    const sheet = document.getElementById('incidentLiveSheetContainer');
    if (sheet) sheet.innerHTML = buildOfficialIncidentReportHTML();
  };

  pmgAdminUtils.loadIncidentPreset = function(presetKey) {
    if (presetKey === 'nearmiss') {
      incidentState.employeeName = 'Christina Lau';
      incidentState.employeePosition = 'Provisional Registered Pharmacist (PRP)';
      incidentState.location = 'PMG Pharmacy Kota Sentosa (Dispensary Area)';
      incidentState.description = 'During peak dispensary hours, a near-miss labelling event occurred during pre-dispensing preparation. Amlodipine 5mg was affixed with a label stating 10mg. The error was identified and intercepted during the secondary pharmacist cross-check. No wrong dosage was dispensed to the patient.';
      incidentState.explanation = 'Heavy counter queue and phone enquiries caused brief distraction. Amlodipine 5mg and 10mg boxes were temporarily arranged beside each other on the active dispensing counter.';
      incidentState.witness = 'Ting Siew Ling (Senior Counter Assistant) & Kenix Foo (Pharmacist)';
      incidentState.actionVerbal = true;
      incidentState.actionWritten = false;
      incidentState.actionProbation = false;
      incidentState.actionSuspension = false;
      incidentState.actionDismissal = false;
      incidentState.actionOther = false;
      incidentState.explanationAction = 'Verbal warning and counseling given. Executed immediate dispensary 5S segregation separating different dosages with color-coded shelf tags.';
    } else if (presetKey === 'till') {
      incidentState.employeeName = 'Penny Wong';
      incidentState.employeePosition = 'Pharmacy Assistant / Customer Service';
      incidentState.location = 'PMG Pharmacy Kota Sentosa (Cashier Counter 2)';
      incidentState.description = 'Upon End-of-Day cash reconciliation and POS drawer settlement at 21:30 close, Counter Till 2 recorded a cash shortage variance of RM 50.00 against the system register report.';
      incidentState.explanation = 'An elderly customer paid with a RM 100 note for a RM 50 transaction during evening rush. Mistakenly issued change for RM 100 rather than RM 50.';
      incidentState.witness = 'Farizin bin Rosli (Counter Closing Staff)';
      incidentState.actionVerbal = true;
      incidentState.actionWritten = false;
      incidentState.actionProbation = false;
      incidentState.actionSuspension = false;
      incidentState.actionDismissal = false;
      incidentState.actionOther = false;
      incidentState.explanationAction = 'Cash count double-check protocol reinforced: staff must verbally repeat cash tendered and change due before placing money into the till.';
    } else if (presetKey === 'tardy') {
      incidentState.employeeName = 'Farizin bin Rosli';
      incidentState.employeePosition = 'Pharmacy Assistant / Logistics & Counter';
      incidentState.location = 'PMG Pharmacy Kota Sentosa';
      incidentState.description = 'Failed to report for scheduled morning opening shift at 07:30 without prior emergency notice. Arrived at branch at 09:15 (1 hour 45 minutes tardy), delaying morning store opening routine.';
      incidentState.explanation = 'Motorcycle experienced a flat tire along Jalan Penrissen. Phone battery was depleted so was unable to call branch manager William Chai immediately.';
      incidentState.witness = 'William Chai (Branch Manager)';
      incidentState.actionVerbal = false;
      incidentState.actionWritten = true;
      incidentState.actionProbation = false;
      incidentState.actionSuspension = false;
      incidentState.actionDismissal = false;
      incidentState.actionOther = false;
      incidentState.explanationAction = 'First written warning issued per company attendance guidelines. Employee reminded that timely notification is compulsory to ensure store floor coverage.';
    } else if (presetKey === 'coldchain') {
      incidentState.employeeName = 'Fiona Tan';
      incidentState.employeePosition = 'Pharmacy Assistant / Inventory Custodian';
      incidentState.location = 'PMG Pharmacy Kota Sentosa (Vaccine & Insulin Refrigerator)';
      incidentState.description = 'Daily morning temperature monitoring log at 07:45 indicated the primary pharmaceutical refrigerator temperature rose to 11.2°C (exceeding standard cold chain range of 2°C to 8°C). Investigation revealed the magnetic door gasket was not sealed tightly overnight.';
      incidentState.explanation = 'Following evening restocking of influenza vaccines and insulins, the door was gently pushed but failed to latch securely against the gasket.';
      incidentState.witness = 'William Chai (Branch Manager / Pharmacist)';
      incidentState.actionVerbal = true;
      incidentState.actionWritten = false;
      incidentState.actionProbation = false;
      incidentState.actionSuspension = false;
      incidentState.actionDismissal = false;
      incidentState.actionOther = true;
      incidentState.explanationAction = 'All cold-chain stocks quarantined immediately. Cold chain temperature data logger reviewed with HQ Quality Assurance. Refrigerator acoustic door alarm installed.';
    }
    persistIncident();
    renderIncidentTab();
  };

  // ─── OFFICIAL PMG HQ INCIDENT REPORT A4 HTML (MIRRORING PDF) ─────────────────
  function buildOfficialIncidentReportHTML() {
    const assets = window.ADMIN_ASSETS || {};

    const boxVerbal = incidentState.actionVerbal ? '☑' : '☐';
    const boxWritten = incidentState.actionWritten ? '☑' : '☐';
    const boxProbation = incidentState.actionProbation ? '☑' : '☐';
    const boxSuspension = incidentState.actionSuspension ? '☑' : '☐';
    const boxDismissal = incidentState.actionDismissal ? '☑' : '☐';
    const boxOther = incidentState.actionOther ? '☑' : '☐';

    return `
      <div class="a4-document incident-pdf-mirror" style="background:#ffffff; color:#000000; padding:20px 24px; border-radius:4px; font-family:Arial, Helvetica, sans-serif; box-shadow:0 1px 3px rgba(0,0,0,0.12); font-size:10px; line-height:1.25; border:1px solid #111;">
        <!-- Top Letterhead Matching Official PDF -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <!-- Left Logo -->
          <div style="width:75px; text-align:left;">
            <img src="${assets.pmg_heart_logo || 'icons/icon-192.png'}" style="width:65px; height:65px; object-fit:contain;" alt="PMG">
          </div>

          <!-- Center Address -->
          <div style="text-align:center; flex:1; padding:0 8px;">
            <div style="font-size:13px; font-weight:800; color:#000; letter-spacing:0.02em;">PMG HEALTHCARE SDN BHD <span style="font-size:10.5px; font-weight:normal;">(1424437-X)</span></div>
            <div style="font-size:10px; font-weight:700; color:#000; margin-top:1px;">Management Office</div>
            <div style="font-size:9.5px; color:#111; margin-top:1px;">No.6, 1<sup>st</sup> Floor, Jalan Merdeka,</div>
            <div style="font-size:9.5px; color:#111;">96100 Sarikei, Sarawak</div>
          </div>

          <!-- Right Certifications & Awards -->
          <div style="width:230px; text-align:right;">
            <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-bottom:2px;">
              ${assets.pmg_cert_care ? `<img src="${assets.pmg_cert_care}" style="height:32px; object-fit:contain;" alt="Care & Standards">` : `
                <div style="font-size:8px; line-height:1.1; text-align:right;">
                  <strong>CARE</strong> | <strong>STANDARDS MALAYSIA</strong><br>
                  ISO 9001:2015 MYQS205169
                </div>
              `}
            </div>
            <div style="font-size:7px; color:#444; line-height:1.1; text-align:right;">
              MS ISO/IEC 17021:2015 QS 02032013 CB 11<br>
              Certified to Public Medicare Group Sdn Bhd (896870-V)
            </div>
            ${assets.pmg_awards_banner ? `
              <div style="margin-top:2px;">
                <img src="${assets.pmg_awards_banner}" style="width:100%; max-height:22px; object-fit:contain;" alt="Awards">
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Red Solid Banner: Employee Incident Report -->
        <div style="background:#e11d48; background-color:#d32f2f; color:#ffffff; font-size:13px; font-weight:800; text-align:center; padding:5px 0; letter-spacing:0.05em; text-transform:none; margin-bottom:8px;">
          Employee Incident Report
        </div>

        <!-- 2-Column Personnel & Details Grid -->
        <div style="margin-bottom:6px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; column-gap:20px; row-gap:3px; margin-bottom:4px;">
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:95px; flex-shrink:0;">Employee Name</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; font-weight:600; min-height:14px;">${escapeHtml(incidentState.employeeName)}</span>
            </div>
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:95px; flex-shrink:0;">Manager Name</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; font-weight:600; min-height:14px;">${escapeHtml(incidentState.managerName)}</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; column-gap:20px; row-gap:3px; margin-bottom:6px;">
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:95px; flex-shrink:0;">Title/Position</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; min-height:14px;">${escapeHtml(incidentState.employeePosition)}</span>
            </div>
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:95px; flex-shrink:0;">Title/Position</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; min-height:14px;">${escapeHtml(incidentState.managerPosition)}</span>
            </div>
          </div>

          <!-- Incident Details Subhead -->
          <div style="font-weight:700; margin-top:4px; margin-bottom:2px;">Incident Details</div>
          <div style="display:flex; flex-direction:column; gap:3px; max-width:380px;">
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:65px; flex-shrink:0;">Date</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; min-height:14px;">${incidentState.date}</span>
            </div>
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:65px; flex-shrink:0;">Time</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; min-height:14px;">${incidentState.time}</span>
            </div>
            <div style="display:flex; align-items:baseline;">
              <span style="font-weight:700; width:65px; flex-shrink:0;">Location</span>
              <span style="flex:1; border-bottom:1px solid #000; padding:0 4px; min-height:14px;">${escapeHtml(incidentState.location)}</span>
            </div>
          </div>
        </div>

        <!-- Description Of Incident -->
        <div style="margin-top:6px;">
          <div style="font-weight:700; margin-bottom:2px;">Description Of Incident</div>
          <div style="border-bottom:1px solid #000; min-height:18px; padding:1px 0; line-height:1.35;">${escapeHtml(incidentState.description)}</div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
        </div>

        <!-- Employee's Explanation -->
        <div style="margin-top:6px;">
          <div style="font-weight:700; margin-bottom:2px;">Employee's Explanation</div>
          <div style="border-bottom:1px solid #000; min-height:18px; padding:1px 0; line-height:1.35;">${escapeHtml(incidentState.explanation)}</div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
        </div>

        <!-- Withness -->
        <div style="margin-top:6px;">
          <div style="font-weight:700; margin-bottom:2px;">Witness</div>
          <div style="border-bottom:1px solid #000; min-height:18px; padding:1px 0; line-height:1.35;">${escapeHtml(incidentState.witness)}</div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
        </div>

        <!-- Action to be taken -->
        <div style="margin-top:6px;">
          <div style="font-weight:700; margin-bottom:3px;">Action to be taken</div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; column-gap:15px; row-gap:3px; font-size:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between; padding-right:12px;">
              <span>Verbal Warning</span>
              <span style="font-size:13px; font-weight:bold;">${boxVerbal}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; padding-right:12px;">
              <span>Probation</span>
              <span style="font-size:13px; font-weight:bold;">${boxProbation}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; padding-right:12px;">
              <span>Dismissal</span>
              <span style="font-size:13px; font-weight:bold;">${boxDismissal}</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding-right:12px;">
              <span>Written warning</span>
              <span style="font-size:13px; font-weight:bold;">${boxWritten}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; padding-right:12px;">
              <span>Suspension</span>
              <span style="font-size:13px; font-weight:bold;">${boxSuspension}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; padding-right:12px;">
              <span>Other</span>
              <span style="font-size:13px; font-weight:bold;">${boxOther}</span>
            </div>
          </div>
        </div>

        <!-- Explanation -->
        <div style="margin-top:6px;">
          <div style="font-weight:700; margin-bottom:2px;">Explanation</div>
          <div style="border-bottom:1px solid #000; min-height:18px; padding:1px 0; line-height:1.35;">${escapeHtml(incidentState.explanationAction)}</div>
          <div style="border-bottom:1px solid #000; height:18px;"></div>
        </div>

        <!-- Red Solid Banner: Employee Acknowledgement -->
        <div style="background:#e11d48; background-color:#d32f2f; color:#ffffff; font-size:12px; font-weight:800; text-align:center; padding:4px 0; letter-spacing:0.04em; margin-top:8px; margin-bottom:4px;">
          Employee Acknowledgement
        </div>
        <div style="text-align:center; font-size:9.5px; font-weight:bold; color:#000; margin-bottom:14px;">
          By signing this document, you acknowledge that you have read and understand the information contained herein.
        </div>

        <!-- Signatures Matching Exact PDF Layout -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; column-gap:30px; margin-top:10px;">
          <div>
            <div style="font-weight:700; margin-bottom:22px;">Employee's Signature</div>
            <div style="border-top:1px solid #000; padding-top:2px;">
              <span style="font-weight:700;">Date:</span> ${incidentState.employeeSignDate || incidentState.date}
            </div>
          </div>
          <div>
            <div style="font-weight:700; margin-bottom:22px;">Manager's Signature</div>
            <div style="border-top:1px solid #000; padding-top:2px;">
              <span style="font-weight:700;">Date:</span> ${incidentState.managerSignDate || incidentState.date}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  pmgAdminUtils.printIncidentReport = function() {
    const html = buildOfficialIncidentReportHTML();
    openPrintWindow(html, `PMG Incident Report - ${incidentState.employeeName}`);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // UNIVERSAL PRINT & PREVIEW ENGINE
  // ═════════════════════════════════════════════════════════════════════════════

  function openPrintWindow(htmlContent, title) {
    const printWindow = window.open('', '_blank', 'width=950,height=1050');
    if (!printWindow) {
      alert('Please allow popups to open the print preview window.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title || 'PMG Official Document')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      height: 100%;
    }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #000000;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .a4-document {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      background: #fff !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
    }
    .a4-quotation-sheet {
      min-height: 265mm !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
    }
    @media print {
      body {
        width: 100%;
      }
      .a4-quotation-sheet {
        min-height: 265mm !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
    }
    .incident-pdf-mirror {
      border: 1px solid #000 !important;
      padding: 6mm 8mm !important;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    img {
      max-width: 100%;
    }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  <\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  pmgAdminUtils.showHelpModal = function() {
    alert(
      "COMMERCIAL & ADMINISTRATIVE UTILITIES GUIDELINES (PMG KS01):\n\n" +
      "1. Auto 3-Quotation Generator:\n" +
      "   - Generates 3 official quotations for corporate/tender procurement.\n" +
      "   - Primary bid: PMG Pharmacy (Lowest/Winning bid).\n" +
      "   - Secondary bids: SSJ Pharma & AM PM Pharmacy with +3% to +8% commercial variance.\n" +
      "   - Use 'Print All 3 Bids (Batch)' for clean 3-page tender submission.\n\n" +
      "2. Manual Invoicing & Official Billing:\n" +
      "   - Formats official tax/medical receipt for patient income tax relief (up to RM 10,000 under LHDN Section 46).\n" +
      "   - Includes PMG letterhead, SSM 1424437-X, and Registered Pharmacist stamp box.\n\n" +
      "3. HQ Incident Report:\n" +
      "   - Digital autofill conforming strictly to Sarikei Management Office incident reporting standards.\n" +
      "   - One-click scenario presets for near-misses, till shortages, and cold-chain excursions.\n" +
      "   - Fits exactly onto a single A4 page without margin clipping."
    );
  };

  pmgAdminUtils.closePreviewModal = function() {
    const modal = document.getElementById('adminDocPreviewModal');
    if (modal) modal.classList.add('hidden');
  };

  // Helper escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export to window
  window.pmgAdminUtils = pmgAdminUtils;

})(window);
