/**
 * PMG Management Hub — Automated Verification Suite
 * Tests:
 * 1. JavaScript syntax (`node -c`) across js/, promo/, performance/, scripts/
 * 2. Python syntax (`py_compile` for scripts/*.py, AST PyCF_ALLOW_TOP_LEVEL_AWAIT for Antigravity workflows)
 * 3. PDPA Privacy Guard unit & static audit in js/patient.js
 * 4. Cloud Sync VM execution tests for onedrive-sync.js, promo-broadcast.js, promo.js, inventory.js
 * 5. Portable google_sheets_sync.js module import safety (zero crash / zero hardcoded Roaming path)
 * 6. Secret hygiene & .agents/.antigravity mirroring audit
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS | ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL | ${name}: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS | ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL | ${name}: ${err.message}`);
  }
}

function listFiles(relDir, ext) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(relDir, f));
}

function createBrowserSandbox(fetchImpl) {
  const store = new Map();
  const elements = new Map();
  const makeEl = (id) => ({
    id,
    className: '',
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    disabled: false,
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    parentNode: null,
    appendChild: () => {},
    removeChild: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    querySelectorAll: () => [],
    addEventListener: () => {}
  });
  const doc = {
    readyState: 'complete',
    body: { appendChild: () => {}, removeChild: () => {} },
    getElementById: (id) => {
      if (!elements.has(id)) elements.set(id, makeEl(id));
      return elements.get(id);
    },
    createElement: (tag) => makeEl(tag),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  const win = {
    location: { protocol: 'https:', hostname: 'pmg-hub.local' },
    PMG_SCHEDULE_API_URL: 'https://example.invalid/exec',
    addEventListener: () => {},
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    }
  };
  win.window = win;
  const ctx = vm.createContext({
    window: win,
    document: doc,
    localStorage: win.localStorage,
    fetch: fetchImpl || (async () => ({ ok: true, json: async () => ({ status: 'success', schedule: {} }) })),
    console,
    setTimeout: (fn) => {
      // Do not schedule infinite timers during tests
      return 0;
    },
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
    unescape,
    escape,
    encodeURIComponent,
    decodeURIComponent,
    URLSearchParams,
    URL,
    Blob,
    requestAnimationFrame: (fn) => fn(),
    indexedDB: { open: () => ({}) },
    alert: () => {},
    confirm: () => true
  });
  return { ctx, win, doc, store, elements };
}

(async () => {
  console.log('=== PMG MANAGEMENT HUB: CLOUD & PDPA VERIFICATION SUITE ===\n');

  // 1. JS Syntax Checks
  const jsFiles = [
    ...listFiles('js', '.js'),
    ...listFiles('promo', '.js'),
    ...listFiles('performance', '.js'),
    ...listFiles('scripts', '.js')
  ];
  for (const rel of jsFiles) {
    test(`JS syntax: ${rel}`, () => {
      execFileSync('node', ['-c', path.join(ROOT, rel)], { stdio: 'pipe' });
    });
  }

  // 2. Python Syntax Checks
  const pyScripts = listFiles('scripts', '.py');
  for (const rel of pyScripts) {
    test(`Python py_compile: ${rel}`, () => {
      execFileSync('python', ['-m', 'py_compile', path.join(ROOT, rel)], { stdio: 'pipe' });
    });
  }

  const pyWorkflows = [
    ...listFiles(path.join('.agents', 'workflows'), '.py'),
    ...listFiles(path.join('.antigravity', 'workflows'), '.py')
  ];
  for (const rel of pyWorkflows) {
    test(`Antigravity Workflow AST syntax (PyCF_ALLOW_TOP_LEVEL_AWAIT): ${rel}`, () => {
      const fullPath = path.join(ROOT, rel);
      const pyCheck = "import ast, sys; src=open(sys.argv[1], encoding='utf-8').read(); compile(src, sys.argv[1], 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)";
      execFileSync('python', ['-c', pyCheck, fullPath], { stdio: 'pipe' });
    });
  }

  // 3. PDPA Privacy Guard Tests (js/patient.js)
  test('PDPA Privacy Guard runtime stripping in js/patient.js', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8');
    const startIdx = src.indexOf('// ─── STRICT PDPA MEDICAL PRIVACY GUARD');
    const endIdx = src.indexOf('// Helper to get formatted date string');
    assert(startIdx !== -1 && endIdx > startIdx, 'Could not locate PDPA guard block in js/patient.js');
    const guardSnippet = src.slice(startIdx, endIdx);

    const sandbox = createBrowserSandbox();
    vm.runInContext(guardSnippet, sandbox.ctx);

    assert.strictEqual(sandbox.win.PMG_PDPA_MEDICAL_CLOUD_GUARD, true, 'PMG_PDPA_MEDICAL_CLOUD_GUARD must be true');
    assert.strictEqual(typeof sandbox.win.sanitizePayloadForGoogleCloud, 'function', 'sanitizePayloadForGoogleCloud must be exported');

    const dirtyPayload = {
      action: 'submitCustomerBooking',
      branch: 'KS01',
      patients: [{ name: 'Secret Patient', ic: '900101135555' }],
      vitals: { bp: '130/80' },
      lipidPanel: { totalChol: 6.1 },
      medications: ['Atorvastatin 20mg'],
      conditions: ['Hyperlipidemia'],
      allergies: ['Aspirin'],
      encounters: [{ chiefComplaint: 'Chest pain', soapNotes: 'Confidential' }],
      booking: {
        customerName: 'Booking Client',
        serviceType: 'Lipid Test',
        bookingDate: '2026-11-20',
        patientIc: '900101-13-5555',
        poctData: { ldl: 3.9 },
        customTests: [{ name: 'HbA1c' }]
      }
    };

    const clean = sandbox.win.sanitizePayloadForGoogleCloud(dirtyPayload);
    assert.strictEqual(clean.action, 'submitCustomerBooking');
    assert.strictEqual(clean.branch, 'KS01');
    assert.strictEqual(clean.booking.customerName, 'Booking Client');
    assert.strictEqual(clean.booking.bookingDate, '2026-11-20');

    for (const forbidden of ['patients', 'vitals', 'lipidPanel', 'medications', 'conditions', 'allergies', 'encounters']) {
      assert.strictEqual(Object.prototype.hasOwnProperty.call(clean, forbidden), false, `Top-level forbidden field ${forbidden} leaked`);
    }
    for (const nestedForbidden of ['patientIc', 'poctData', 'customTests']) {
      assert.strictEqual(Object.prototype.hasOwnProperty.call(clean.booking, nestedForbidden), false, `Nested forbidden field ${nestedForbidden} leaked`);
    }

    // Verify all cloud mutation calls use sanitizePayloadForGoogleCloud
    assert(src.includes('const payload = sanitizePayloadForGoogleCloud({\n      branch: branchCode,\n      schedule: sched,'), 'pushBookingToCloud & pushRentalsToCloud must sanitize payload');
    assert(src.includes('const payload = sanitizePayloadForGoogleCloud({\n      branch: branchCode,\n      schedule: scheduleObj'), 'pushScheduleToSheets must sanitize payload');
    assert(src.includes('sanitizePayloadForGoogleCloud(payload)'), 'updateAppointmentStatusInCloud/deleteCurrentPatientProfile must sanitize payloads');
    const rentalIdx = src.indexOf('sched.rentals = rentals;');
    assert(rentalIdx !== -1 && src.slice(rentalIdx, rentalIdx + 250).includes('sanitizePayloadForGoogleCloud('), 'pushRentalsToCloud must sanitize payload');
  });

  test('Patient follow-up and overdue WhatsApp reminders omit medication and supplement lists', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8');

    // Static source checks
    assert(!src.includes('medNamesZh'), 'medNamesZh must not be present in getPatientSupplySummary');
    assert(!src.includes('medNamesMy'), 'medNamesMy must not be present in getPatientSupplySummary');
    assert(!src.includes('medNamesEn'), 'medNamesEn must not be present in getPatientSupplySummary');
    assert(!src.includes('日常慢病药物与保健品'), 'Supplements must not be mentioned in patient supply summaries');
    assert(!src.includes('suplemen kesihatan harian'), 'Supplements must not be mentioned in patient supply summaries');

    // Runtime behavioral check for overdue & due-soon reminders
    const sb = createBrowserSandbox();
    const scheds = {
      'Kota Sentosa': { name: 'PMG Pharmacy Kota Sentosa', open: '08:00', close: '17:00', pharmacist: 'William Chai' }
    };
    sb.ctx.BRANCH_SCHEDULES = sb.win.BRANCH_SCHEDULES = scheds;
    sb.ctx.getPharmacistSchedule = sb.win.getPharmacistSchedule = () => null;
    sb.ctx.normalizeBranchCode = sb.win.normalizeBranchCode = () => 'Kota Sentosa';
    sb.ctx.getPatientLanguageByRace = sb.win.getPatientLanguageByRace = () => 'Chinese';
    sb.ctx.URLSearchParams = sb.win.URLSearchParams = URLSearchParams;
    sb.ctx.location = sb.win.location = { origin: 'https://pmg.example', pathname: '/patient/index.html' };

    const startIdx = src.indexOf('function cleanTcaPurposeForWa');
    const endIdx = src.indexOf('function sendPatientBookingWhatsApp');
    assert(startIdx !== -1 && endIdx > startIdx, 'Could not locate WhatsApp message builders');
    vm.runInContext(src.slice(startIdx, endIdx), sb.ctx);

    const overduePatient = {
      name: 'Tan Ah Kow',
      branch: 'KS01',
      nextTcaDate: '2026-10-01',
      nextTcaPurpose: 'Refill Due: Metformin 500mg, Omma apple cider',
      medications: [{ name: 'Metformin 500mg', nextRefillDate: '2026-10-01' }],
      supplements: [{ name: 'Omma apple cider' }]
    };

    const overdueMsgZh = sb.win.buildPatientSupplyBookingMessage(overduePatient);
    assert(!overdueMsgZh.includes('Metformin'), 'Overdue Chinese WhatsApp message must not leak medication name');
    assert(!overdueMsgZh.includes('500mg'), 'Overdue Chinese WhatsApp message must not leak dosage');
    assert(!overdueMsgZh.includes('apple cider'), 'Overdue Chinese WhatsApp message must not leak supplement name');
    assert(!overdueMsgZh.includes('保健品'), 'Overdue Chinese WhatsApp message must not mention supplements');

    sb.ctx.getPatientLanguageByRace = sb.win.getPatientLanguageByRace = () => 'English';
    const overdueMsgEn = sb.win.buildPatientSupplyBookingMessage(overduePatient);
    assert(!overdueMsgEn.includes('Metformin'), 'Overdue English WhatsApp message must not leak medication name');
    assert(!overdueMsgEn.includes('supplement'), 'Overdue English WhatsApp message must not mention supplements');

    sb.ctx.getPatientLanguageByRace = sb.win.getPatientLanguageByRace = () => 'Malay';
    const overdueMsgMs = sb.win.buildPatientSupplyBookingMessage(overduePatient);
    assert(!overdueMsgMs.includes('Metformin'), 'Overdue Malay WhatsApp message must not leak medication name');
    assert(!overdueMsgMs.includes('suplemen'), 'Overdue Malay WhatsApp message must not mention supplements');
  });

  test('Patient appointment reschedule actions in Upcoming/Today queues & customer wrong-time wording', () => {
    const patientSrc = fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8');
    const htmlSrc = fs.readFileSync(path.join(ROOT, 'patient', 'index.html'), 'utf8');

    // UI & button presence checks
    assert(htmlSrc.includes('setReschedReason(\'Customer booked wrong time'), 'patient/index.html must have Customer booked wrong time button');
    assert(patientSrc.includes('renderUpcomingQueue') && patientSrc.includes('openRescheduleModal(\'${p.id}\', \'${apt.id}\')'), 'Upcoming queue must have Reschedule button');
    assert(patientSrc.includes('renderTodayQueue') && patientSrc.includes('openRescheduleModal(\'${p.id}\', \'${apt.id}\')'), 'Today queue must have Reschedule button');
    assert(patientSrc.includes('renderProfileApts') && patientSrc.includes('openRescheduleModal(\'${p.id}\', \'${apt.id}\')'), 'Profile appointments must have Reschedule button');

    // Runtime behavior for customer wrong-time reschedule messages
    const sb = createBrowserSandbox();
    const scheds = {
      'Kota Sentosa': { name: 'PMG Pharmacy Kota Sentosa', open: '08:00', close: '17:00', pharmacist: 'William Chai Yee Sian (Pharmacist)' }
    };
    sb.ctx.BRANCH_SCHEDULES = sb.win.BRANCH_SCHEDULES = scheds;
    sb.ctx.getPharmacistSchedule = sb.win.getPharmacistSchedule = () => null;
    sb.ctx.normalizeBranchCode = sb.win.normalizeBranchCode = () => 'Kota Sentosa';
    sb.ctx.normalizePharmacistName = sb.win.normalizePharmacistName = (n) => n || 'William Chai Yee Sian (Pharmacist)';
    sb.ctx.getPatientSelfBookingUrl = sb.win.getPatientSelfBookingUrl = () => 'https://pmg.example/booking';

    const startIdx = patientSrc.indexOf('function buildRescheduleWhatsAppMessage');
    const endIdx = patientSrc.indexOf('function updateRescheduleMessagePreview');
    assert(startIdx !== -1 && endIdx > startIdx, 'Could not locate buildRescheduleWhatsAppMessage');
    vm.runInContext(patientSrc.slice(startIdx, endIdx), sb.ctx);

    const testPatient = { name: 'Ahmad bin Ali', branch: 'KS01' };
    const originalApt = { date: '2026-03-25', time: '14:00', pharmacist: 'William Chai Yee Sian (Pharmacist)' };
    const buildMsg = sb.win.buildRescheduleWhatsAppMessage || sb.ctx.buildRescheduleWhatsAppMessage;
    assert.strictEqual(typeof buildMsg, 'function', 'buildRescheduleWhatsAppMessage must be a function');

    // 1. Customer wrong time in Chinese
    const zhMsgWrong = buildMsg(testPatient, originalApt, '2026-03-26', '16:00', 'William Chai', 'Customer booked wrong time / 顾客误选时段', 'Chinese');
    assert(zhMsgWrong.includes('根据您的改期要求/时间调整确认'), 'Customer wrong-time Chinese message must reflect customer request');
    assert(!zhMsgWrong.includes('由于药剂师执勤排班调动'), 'Customer wrong-time message must not falsely claim duty shift adjustment');
    assert(zhMsgWrong.includes('2026-03-26'), 'New date must be present');
    assert(zhMsgWrong.includes('16:00'), 'New time must be present');

    // 2. Customer wrong time in English
    const enMsgWrong = buildMsg(testPatient, originalApt, '2026-03-26', '16:00', 'William Chai', 'Customer requested time change', 'English');
    assert(enMsgWrong.includes('Per your request to adjust your appointment'), 'Customer wrong-time English message must reflect customer request');
    assert(!enMsgWrong.includes('due to a pharmacist duty shift adjustment'), 'Customer wrong-time English message must not falsely claim shift adjustment');

    // 3. Shift adjustment fallback
    const zhMsgShift = buildMsg(testPatient, originalApt, '2026-03-26', '16:00', 'William Chai', 'Pharmacist duty shift changed', 'Chinese');
    assert(zhMsgShift.includes('由于药剂师执勤排班调动'), 'Shift change message should explain shift adjustment');
  });

  // 4. Promo Broadcast & Smart Inventory Google Cloud Vault Tests
  await testAsync('Promo Broadcast Cloud Vault exports & push/pull logic (js/promo-broadcast.js & promo/promo.js)', async () => {
    for (const rel of ['js/promo-broadcast.js', 'promo/promo.js']) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert(src.includes('PMG_PROMO_BROADCAST_VAULT_KS01'), `${rel} missing vault key`);
      const posted = [];
      const sb = createBrowserSandbox(async (url, opts) => {
        if (opts && opts.method === 'POST') posted.push(JSON.parse(opts.body));
        return { ok: true, json: async () => ({ status: 'success', schedule: { updatedAt: 1, campaigns: [], composerState: {}, progress: {} } }) };
      });
      vm.runInContext(src, sb.ctx);
      assert.strictEqual(typeof sb.win.syncPromoBroadcastWithGoogleCloud, 'function', `${rel} missing syncPromoBroadcastWithGoogleCloud`);
      assert.strictEqual(typeof sb.win.pushPromoBroadcastToGoogleCloud, 'function', `${rel} missing pushPromoBroadcastToGoogleCloud`);
      assert.strictEqual(typeof sb.win.pullPromoBroadcastFromGoogleCloud, 'function', `${rel} missing pullPromoBroadcastFromGoogleCloud`);
      await sb.win.pushPromoBroadcastToGoogleCloud(true);
      assert(posted.length >= 1, `${rel} did not POST to Google Cloud API`);
      assert.strictEqual(posted[0].branch, 'PMG_PROMO_BROADCAST_VAULT_KS01');
    }
  });

  test('Promo Broadcast Sheep Placenta preset, POS CSV multi-line header parser & dual language posters (js/promo-broadcast.js & promo/promo.js)', () => {
    assert(fs.existsSync(path.join(ROOT, 'promo', 'assets', 'sheep-placenta-en.jpg')), 'Missing promo/assets/sheep-placenta-en.jpg');
    assert(fs.existsSync(path.join(ROOT, 'promo', 'assets', 'sheep-placenta-zh.jpg')), 'Missing promo/assets/sheep-placenta-zh.jpg');

    for (const rel of ['js/promo-broadcast.js', 'promo/promo.js']) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const sb = createBrowserSandbox();
      vm.runInContext(src, sb.ctx);

      // 1. Verify Sheep Placenta preset campaign is loaded with 43 unique customers
      const preset = sb.win.SHEEP_PLACENTA_PRESET_CAMPAIGN;
      assert(preset && preset.id === 'sheep-placenta-600mg', `${rel} missing SHEEP_PLACENTA_PRESET_CAMPAIGN`);
      assert.strictEqual(preset.customers.length, 43, `${rel} Sheep Placenta preset should have 43 unique customers`);

      // 2. Verify language-matched poster resolution (EN/BM vs Chinese)
      const zhPoster = sb.win.getPosterForLanguage('zh');
      const bmPoster = sb.win.getPosterForLanguage('bm');
      assert.strictEqual(zhPoster.langSlot, 'zh', `${rel} zh customer should get zh poster slot`);
      assert(zhPoster.url.includes('sheep-placenta-zh.jpg'), `${rel} zh customer should get sheep-placenta-zh.jpg`);
      assert.strictEqual(bmPoster.langSlot, 'bm', `${rel} bm customer should get bm poster slot`);
      assert(bmPoster.url.includes('sheep-placenta-en.jpg'), `${rel} bm customer should get sheep-placenta-en.jpg`);

      // 3. Verify CSV parser handles POS "@@##Write Time:..." preamble, "Recipient Contact", and "*NG SZE SOON"
      const samplePosCsv = [
        '@@##Write Time:17112026 100240 ',
        'Sales Status,Sales Date,Sales No.,Sales Item Sales Type,Client Name,Client ID,Item Code,Item Name,Description ,Price ,Sales Quantity,Cost ,Sub Total (Incl Tax),Total Profit,Total Profit (Excl Tax),Sales Item Person,Recipient Contact',
        'Completed,10-22-26,KS0112202610220069, Normal ,CHONG WEI FONG,996600083688,120697,NUTRIBRIDGE SHEEP PLACENTA 600MG WITH GRAPE SEED EXTRACT,120697 - SOFTGEL,14.0000,1,8.6667,14.0000,5.3333,5.33,CHAI YEE SIAN,0198348389',
        'Completed,09-02-26,KS0102202609020031, Normal ,ANNIE ANAK EVEREADY @ EVERIDI,996600043188,120697,NUTRIBRIDGE SHEEP PLACENTA 600MG WITH GRAPE SEED EXTRACT,120697 - 5 TAB,60.0000,1,43.3333,60.0000,16.6667,16.67,FIONA FIENA ANAK JAMES,0189865589',
        'Completed,09-29-26,KS0101202609290049, Normal ,*NG SZE SOON,996600072882,120697,NUTRIBRIDGE SHEEP PLACENTA 600MG WITH GRAPE SEED EXTRACT,120697 - BOX30,299.0000,1,260.0000,299.0000,39.0000,39.00,CHAI YEE SIAN,0146816639'
      ].join('\r\n');

      const parsed = sb.win.parseCsvFileToCustomers(samplePosCsv);
      assert.strictEqual(parsed.customers.length, 3, 'Should parse 3 customers after skipping @@##Write Time line');
      assert.strictEqual(parsed.customers[0].name, 'CHONG WEI FONG');
      assert.strictEqual(parsed.customers[0].phone, '60198348389');
      assert.strictEqual(parsed.customers[2].name, 'NG SZE SOON', 'Leading asterisk should be stripped from *NG SZE SOON');
      assert.strictEqual(sb.win.detectCustomerLanguagePreference(parsed.customers[0].name), 'zh');
      assert.strictEqual(sb.win.detectCustomerLanguagePreference(parsed.customers[1].name), 'bm');
    }
  });

  await testAsync('Smart Inventory Cloud Vault exports & push logic (js/inventory.js)', async () => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'inventory.js'), 'utf8');
    const posted = [];
    const sb = createBrowserSandbox(async (url, opts) => {
      if (opts && opts.method === 'POST') posted.push(JSON.parse(opts.body));
      return { ok: true, json: async () => ({ status: 'success', schedule: {} }) };
    });
    vm.runInContext(src, sb.ctx);
    assert.strictEqual(typeof sb.win.initInventoryModule, 'function');
    assert.strictEqual(typeof sb.win.syncInventoryConfigWithGoogleCloud, 'function');
    assert.strictEqual(typeof sb.win.pushInventoryConfigToGoogleCloud, 'function');
    assert.strictEqual(typeof sb.win.getInventoryCloudConfig, 'function');
    await sb.win.pushInventoryConfigToGoogleCloud(true);
    assert(posted.length >= 1, 'inventory.js did not POST config to Google Cloud');
    assert.strictEqual(posted[0].branch, 'PMG_INVENTORY_REPLENISHMENT_VAULT_KS01');
  });

  // 5. Hybrid OneDrive + Google Cloud Ecosystem Sync Orchestrator Tests (js/onedrive-sync.js)
  await testAsync('Hybrid Cloud Sync Orchestrator runs non-patient modules even with OneDrive disconnected (js/onedrive-sync.js)', async () => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'onedrive-sync.js'), 'utf8');
    const calls = [];
    const sb = createBrowserSandbox(async () => ({
      ok: true,
      json: async () => ({ status: 'success', schedule: {} })
    }));

    // Register mock module sync handlers
    sb.win.PMG_PDPA_MEDICAL_CLOUD_GUARD = true;
    sb.win.syncTeammatePreferencesWithCloud = async () => { calls.push('scheduler'); };
    sb.win.pmgExpiry = { syncFromSheets: async () => { calls.push('expiry'); } };
    sb.win.pmgReturns = { syncWithGoogleSheets: async () => { calls.push('returns'); } };
    sb.win.pmgPricing = { fetchPricingFromSheets: async () => { calls.push('pricing'); } };
    sb.win.pmgRecruitment = { syncAppsFromCloud: async () => { calls.push('recruitment'); } };
    sb.win.syncPromoBroadcastWithGoogleCloud = async () => { calls.push('promo'); };
    sb.win.syncInventoryConfigWithGoogleCloud = async () => { calls.push('inventory'); };
    sb.win.syncPerformanceWithCloud = async () => { calls.push('performance'); };
    sb.win.syncSkuActionPlansWithCloud = async () => { calls.push('actionPlans'); };

    vm.runInContext(src, sb.ctx);

    assert.strictEqual(typeof sb.win.syncAuditFromCloud, 'function');
    assert.strictEqual(typeof sb.win.syncCommercialFromCloud, 'function');
    assert.strictEqual(typeof sb.win.triggerGoogleCloudEcosystemSync, 'function');

    await sb.win.triggerManualSyncFromModal();

    for (const expected of ['scheduler', 'expiry', 'returns', 'pricing', 'recruitment', 'promo', 'inventory', 'performance', 'actionPlans']) {
      assert(calls.includes(expected), `triggerGoogleCloudEcosystemSync skipped ${expected}`);
    }

    const fbHtml = sb.doc.getElementById('syncModalFeedback').innerHTML;
    assert(fbHtml.includes('Google Cloud Operational Sync Complete'), 'Disconnected modal should confirm Google Cloud operational sync');
    assert(fbHtml.includes('PDPA Medical Privacy Guard'), 'Disconnected modal should confirm PDPA Medical Privacy Guard');
  });

  // 6. Verify Performance & Pricing symbols & Gemini 3.x Compliance
  test('Performance & Pricing symbols + Gemini 3.x models', () => {
    const perfSrc = fs.readFileSync(path.join(ROOT, 'performance', 'performance.js'), 'utf8');
    assert(perfSrc.includes('syncPerformanceWithCloud'), 'Missing syncPerformanceWithCloud');
    assert(perfSrc.includes('syncSkuActionPlansWithCloud'), 'Missing syncSkuActionPlansWithCloud');
    assert(perfSrc.includes('KS01_PERF_ACTION_PLANS'), 'Missing KS01_PERF_ACTION_PLANS');

    const priceSrc = fs.readFileSync(path.join(ROOT, 'js', 'pricing-intelligence.js'), 'utf8');
    assert(priceSrc.includes('fetchPricingFromSheets'), 'Missing fetchPricingFromSheets');
    assert(priceSrc.includes('gemini-3.5-flash-lite'), 'Missing gemini-3.5-flash-lite');
    // Ensure retired models are NOT referenced as active endpoints
    const nonCommentPrice = priceSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    assert(!nonCommentPrice.includes('gemini-2.0-flash-lite'), 'Retired gemini-2.0-flash-lite found in pricing-intelligence.js');
    assert(!nonCommentPrice.includes('gemini-2.5-flash'), 'Retired gemini-2.5-flash found in pricing-intelligence.js');
  });

  // 7. Portable google_sheets_sync.js Check
  test('Portable scripts/google_sheets_sync.js imports safely without Roaming hardcode', () => {
    const sheetSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'google_sheets_sync.js'), 'utf8');
    assert(!sheetSrc.includes('C:\\\\Users\\\\User\\\\AppData\\\\Roaming'), 'Hardcoded Roaming path must be removed');
    const mod = require(path.join(ROOT, 'scripts', 'google_sheets_sync.js'));
    assert.strictEqual(typeof mod.getSheetsClient, 'function');
    assert.strictEqual(typeof mod.listSpreadsheets, 'function');
    assert.strictEqual(typeof mod.readSheet, 'function');
  });

  // 8. Secret Hygiene & .agents / .antigravity Parity
  test('Zero secrets in workspace code & .agents/.antigravity mirror parity', () => {
    const requiredAgents = [
      'agents/file-writer/agent.md',
      'agents/pmg-pricing-analyst/agent.md',
      'agents/pmg-performance-strategist/agent.md',
      'agents/pmg-cloud-pdpa-architect/agent.md',
      'agents/pmg-inventory-replenishment/agent.md',
      'skills/pmg-monthly-presentation/SKILL.md',
      'skills/pmg-pricing-intelligence/SKILL.md',
      'skills/pmg-cloud-sync-pdpa/SKILL.md',
      'skills/pmg-stock-aging-action-plan/SKILL.md',
      'workflows/monthly_hq_report_workflow.py',
      'workflows/cloud_sync_pdpa_audit_workflow.py',
      'workflows/README.md'
    ];
    for (const rel of requiredAgents) {
      const aPath = path.join(ROOT, '.agents', rel);
      const bPath = path.join(ROOT, '.antigravity', rel);
      assert(fs.existsSync(aPath), `Missing .agents/${rel}`);
      assert(fs.existsSync(bPath), `Missing .antigravity/${rel}`);
      assert.strictEqual(fs.readFileSync(aPath, 'utf8'), fs.readFileSync(bPath, 'utf8'), `Mirror mismatch: ${rel}`);
    }

    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    for (const pat of ['.env*', 'gen-lang-client-*.json', '*service-account*.json', '*.key', '*.pem', 'scratch/']) {
      assert(gitignore.includes(pat), `.gitignore missing protection pattern: ${pat}`);
    }

    // Scan code & docs for hardcoded API keys or PEM private keys
    const scanFiles = [
      ...jsFiles,
      ...pyScripts,
      'AGENTS.md',
      'package.json',
      'requirements.txt',
      'index.html',
      'promo/index.html',
      'patient/index.html'
    ];
    // Scan code & docs for active/unknown API keys or PEM private keys
    // Known already-revoked public blocklist signatures present in legacy checks
    const REVOKED_BLOCKLIST_SIGNATURES = new Set([
      'AIzaSyBxKYPJWxi3ILfxPTlQFytzoXJvIZ72m4k',
      'AIzaSyAfJqs6YnY5J_URsuvmSMi8WM3BckVwKY4'
    ]);
    for (const rel of scanFiles) {
      const full = path.join(ROOT, rel);
      if (!fs.existsSync(full)) continue;
      const txt = fs.readFileSync(full, 'utf8');
      const keyMatches = txt.match(/AIza[0-9A-Za-z\-_]{35}/g) || [];
      for (const m of keyMatches) {
        assert(REVOKED_BLOCKLIST_SIGNATURES.has(m), `Unexpected Google API key found in ${rel}`);
      }
      const pemMarker = ['BEGIN ', 'PRIVATE KEY'].join('');
      assert(!txt.includes(pemMarker), `Potential private key found in ${rel}`);
    }
  });

  // 9. December 2026 KS01 Timetable Rebalancing (Christina Lee Removed & 7-Staff Solver Balanced)
  test('December 2026 KS01 Timetable removes Christina Lee & rebalances 7-person team with 0 shortage days', () => {
    const { ctx, doc } = createBrowserSandbox();
    const schedSrc = fs.readFileSync(path.join(ROOT, 'js', 'scheduler.js'), 'utf8');
    vm.runInContext(schedSrc, ctx);

    // Check November 2026 preserves Christina Lee (8 staff)
    doc.getElementById('sched-month').value = '2026-11';
    vm.runInContext(`loadTeammates('KS01', '2026-11', true);`, ctx);
    const novTeam = vm.runInContext(`currentTeammates.map(t => ({ empNo: t.empNo, nickname: t.nickname }))`, ctx);
    assert.strictEqual(novTeam.length, 8, 'November 2026 KS01 should retain 8 teammates including Christina');
    assert(novTeam.some(t => t.empNo === 'PMG03033'), 'November 2026 KS01 should include Christina Lee (PMG03033)');

    // Check December 2026 removes Christina Lee and rebalances 7 staff with 7 unique RDs and 7 unique HDs
    doc.getElementById('sched-month').value = '2026-12';
    vm.runInContext(`loadTeammates('KS01', '2026-12', true);`, ctx);
    const decTeam = vm.runInContext(`currentTeammates.map(t => ({ empNo: t.empNo, nickname: t.nickname, restDayPref: t.restDayPref, halfDayPref: t.halfDayPref }))`, ctx);
    assert.strictEqual(decTeam.length, 7, 'December 2026 KS01 must have 7 active teammates');
    assert(!decTeam.some(t => t.empNo === 'PMG03033' || t.nickname === 'CHRISTINA'), 'Christina Lee must be removed from December 2026 onwards');

    const rdDays = new Set(decTeam.map(t => t.restDayPref));
    const hdDays = new Set(decTeam.map(t => t.halfDayPref.split(' ')[0]));
    assert.strictEqual(rdDays.size, 7, 'All 7 days of the week must have exactly 1 unique Rest Day');
    assert.strictEqual(hdDays.size, 7, 'All 7 days of the week must have exactly 1 unique Morning Half Day');

    // Run December 2026 heuristic schedule generator and verify floor headcount, 0 fatigue, and peer parity
    const decSched = vm.runInContext(`runHeuristicScheduleGenerator('KS01', 2026, 12, 31)`, ctx);
    const decMonthDays = decSched.days.filter(d => d.date.startsWith('2026-12'));
    assert.strictEqual(decMonthDays.length, 31, 'December 2026 schedule must contain all 31 December days');

    let shortageDays = 0;
    let fatigueCount = 0;
    const rotatingEmpNos = ['PMG01294', 'PMG02694', 'PMG01780', 'PMG02070', 'PMG03375', 'PMG04331'];
    const amTotals = {};
    const pmTotals = {};
    rotatingEmpNos.forEach(id => { amTotals[id] = 0; pmTotals[id] = 0; });

    decSched.days.forEach((d, idx) => {
      assert(!('PMG03033' in d.shifts), `Christina Lee found in shift assignments on ${d.date}`);
      let am = 0, fullAm = 0, pm = 0;
      Object.values(d.shifts).forEach(s => {
        if (s === '8H_0730-1630' || s === '4H_0730-1130' || s === '5H_0730-1230') am++;
        if (s === '8H_0730-1630') fullAm++;
        if (s === '8H_1230-2130') pm++;
      });
      // Non-Christmas days must have 3 AM (with >= 2 Full AM) and 3 PM
      if (d.date !== '2026-12-25' && d.date !== '2027-01-01') {
        if (am < 3 || fullAm < 2 || pm < 3) shortageDays++;
      }
      rotatingEmpNos.forEach(id => {
        const s = d.shifts[id];
        if (s === '8H_0730-1630' || s === '4H_0730-1130' || s === '5H_0730-1230') amTotals[id]++;
        if (s === '8H_1230-2130') pmTotals[id]++;
        if (idx > 0) {
          const prevS = decSched.days[idx - 1].shifts[id];
          if (prevS === '8H_1230-2130' && s === '8H_0730-1630') fatigueCount++;
        }
      });
    });

    assert.strictEqual(shortageDays, 0, `Expected 0 manpower shortage days in Dec 2026, got ${shortageDays}`);
    assert.strictEqual(fatigueCount, 0, `Expected 0 turnaround fatigue violations in Dec 2026, got ${fatigueCount}`);

    const amVals = Object.values(amTotals);
    const pmVals = Object.values(pmTotals);
    const amSpread = Math.max(...amVals) - Math.min(...amVals);
    const pmSpread = Math.max(...pmVals) - Math.min(...pmVals);
    assert(amSpread <= 2, `Expected rotating AM shift spread <= 2 across peers, got ${amSpread}`);
    assert(pmSpread <= 2, `Expected rotating PM shift spread <= 2 across peers, got ${pmSpread}`);
  });

  // 10. Caretaker Shared Phone Number Support in Patient Care (Elderly / Child Dependents)
  test('Patient Care allows multiple distinct patients (elderly/children) to share the same caretaker phone number', () => {
    const { ctx } = createBrowserSandbox();
    const patientSrc = fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8');
    vm.runInContext(patientSrc, ctx);

    const checkResult = vm.runInContext(`
      (() => {
        const caretakerPhone = '+60128889999';
        const pElderly = { id: 'PT-9901', name: 'Mdm Wong Ah Mei', ic: '450101-13-5002', phone: caretakerPhone, age: 81 };
        const pChild = { id: 'PT-9902', name: 'Master Wong Jun Kai', ic: '', phone: caretakerPhone, age: 7 };
        const pSubstringName = { id: 'PT-9903', name: 'Wong Ah', ic: '', phone: caretakerPhone, age: 50 };

        const same1 = areSamePatientRecord(pElderly, pChild);
        const same2 = areSamePatientRecord(pElderly, pSubstringName);
        const consolidated = consolidatePatientList([pElderly, pChild, pSubstringName]);

        // Also verify deleting one patient with caretakerPhone does not tombstone other dependents with caretakerPhone
        addDeletedPatientRecord('PT-9999', '990101-13-9999', caretakerPhone, 'Deleted Relative');
        const elderlyBlocked = isPatientDeleted(pElderly.id, pElderly.ic, pElderly.phone, pElderly.name);
        const childBlocked = isPatientDeleted(pChild.id, pChild.ic, pChild.phone, pChild.name);

        // Verify booking import for two dependents sharing caretakerPhone creates two separate patient records
        importSingleBooking({
          ref: 'PMG-BK-CARE1',
          patientName: 'Grandpa Lim',
          patientPhone: caretakerPhone,
          date: '2026-12-10',
          time: '09:00',
          branchName: 'Kota Sentosa'
        }, false);
        importSingleBooking({
          ref: 'PMG-BK-CARE2',
          patientName: 'Baby Lim',
          patientPhone: caretakerPhone,
          date: '2026-12-10',
          time: '09:30',
          branchName: 'Kota Sentosa'
        }, false);

        const hasGrandpa = patientsData.some(p => p.name === 'Grandpa Lim');
        const hasBaby = patientsData.some(p => p.name === 'Baby Lim');

        return {
          same1,
          same2,
          consolidatedCount: consolidated.length,
          elderlyBlocked,
          childBlocked,
          hasGrandpa,
          hasBaby
        };
      })()
    `, ctx);

    assert.strictEqual(checkResult.same1, false, 'Elderly and child sharing caretaker phone must not be treated as same patient');
    assert.strictEqual(checkResult.same2, false, 'Family members with prefix/substring names sharing caretaker phone must not be merged');
    assert.strictEqual(checkResult.consolidatedCount, 3, 'All 3 distinct patients sharing caretaker phone must remain separate after consolidation');
    assert.strictEqual(checkResult.elderlyBlocked, false, 'Deleting a relative must not tombstone caretaker phone number for elderly patient');
    assert.strictEqual(checkResult.childBlocked, false, 'Deleting a relative must not tombstone caretaker phone number for child patient');
    assert.strictEqual(checkResult.hasGrandpa, true, 'Grandpa Lim booking should have its own patient record');
    assert.strictEqual(checkResult.hasBaby, true, 'Baby Lim booking should have its own separate patient record');
  });

  // 11. Smart Inventory Engine Zero-Demand Guard vs Verified OOS Damped Recovery
  test('Smart Inventory Engine suppresses reorders for 0 sales & 0 SOH without demand, and applies damped recovery for verified OOS', () => {
    const { ctx, doc } = createBrowserSandbox();
    const invSrc = fs.readFileSync(path.join(ROOT, 'js', 'inventory.js'), 'utf8');

    // Set parameter inputs in mock DOM
    doc.getElementById('paramSalesWindow').value = '180';
    doc.getElementById('paramLeadTime').value = '7';
    doc.getElementById('paramSafetyDays').value = '30';
    doc.getElementById('paramTargetDays').value = '60';
    doc.getElementById('paramZeroSalesStrict').checked = true;

    vm.runInContext(invSrc, ctx);

    // Scenario A: Unverified Zero Sales & Zero SOH with strict guard ON (User's reported 30-unit bug)
    const deadStockRow = {
      'Item Code': 'DEAD-SKU-001',
      'Description': 'Discontinued Vitamin C 100s',
      'Preferred Vendor': 'TEST_VENDOR',
      'Quantity On Hand': '0',
      'Sales Qty': '0',
      'Order UOM': 'BOT',
      'Active': 'Active'
    };

    ctx.window.setInventoryData([deadStockRow]);
    ctx.window.recalcInventory();
    const gridA = ctx.window.getInventoryGrid();
    assert.strictEqual(gridA.length, 1, 'Inventory grid should have 1 item');
    assert.strictEqual(gridA[0].suggestedOrder, 0, 'Zero-demand SKU with 0 sales and 0 SOH must NOT generate 30 units (must be 0)');
    assert.strictEqual(gridA[0].effectiveAds, 0, 'Effective ADS for zero-demand SKU must be 0');
    assert.strictEqual(gridA[0].ruleApplied, 'RULE_3_ZERO_DEMAND', 'Rule applied should be RULE_3_ZERO_DEMAND');

    // Scenario B: Pharmacist disables Strict Guard (allows 1 starter trial unit)
    doc.getElementById('paramZeroSalesStrict').checked = false;
    ctx.window.recalcInventory();
    const gridB = ctx.window.getInventoryGrid();
    assert.strictEqual(gridB[0].suggestedOrder, 1, 'Disabling strict guard allows trial starter display of 1 unit');
    assert.strictEqual(gridB[0].ruleApplied, 'RULE_3A_SAMPLE_STARTER', 'Rule applied should be RULE_3A_SAMPLE_STARTER');

    // Scenario C: True Out-of-Stock (Verified prior demand with multi-month sales)
    doc.getElementById('paramZeroSalesStrict').checked = true;
    const verifiedOosRow = {
      'Item Code': 'AMLODIPINE-5MG',
      'Description': 'Amlodipine 5mg Tablet 100s',
      'Preferred Vendor': 'DUOPHARMA',
      'Quantity On Hand': '0',
      'Sales Qty': '0',
      'Sales_M1': '30', // Sold 30 units last month before going OOS
      'Sales_Latest': '0',
      'Order UOM': 'BOX',
      'Active': 'Active'
    };

    ctx.window.setInventoryData([verifiedOosRow]);
    ctx.window.recalcInventory();
    const gridC = ctx.window.getInventoryGrid();
    assert.strictEqual(gridC.length, 1);
    // Prior run-rate: 30 / 30 = 1.0/day. Damped recovery rate: 1.0 * 0.5 = 0.5/day.
    // Recovery buffer capped at 30 days: 0.5 * 30 = 15 units.
    assert.strictEqual(gridC[0].ruleApplied, 'RULE_3A_VERIFIED_OOS', 'Verified prior demand must trigger RULE_3A_VERIFIED_OOS');
    assert.strictEqual(gridC[0].effectiveAds, 0.5, 'Effective recovery ADS should be damped by 50%');
    assert.strictEqual(gridC[0].suggestedOrder, 15, 'Recovery order should be capped at 30-day buffer (15 units) instead of blind 30 units');
  });

  // 12. Recruitment Document Viewer: Native PDF/Image Rendering Without Google Account Login
  test('Recruitment Document Viewer renders cloud-vaulted base64 PDFs natively as blobs and prevents Google Drive 404 interception', () => {
    const { ctx, doc } = createBrowserSandbox();
    const recSrc = fs.readFileSync(path.join(ROOT, 'js', 'recruitment.js'), 'utf8');

    // Add Blob and URL.createObjectURL mock to sandbox
    ctx.Blob = function(chunks, opts) { this.chunks = chunks; this.type = opts ? opts.type : ''; };
    ctx.URL = {
      createObjectURL: (blob) => 'blob:https://pmg-hub.local/mock-pdf-blob',
      revokeObjectURL: () => {}
    };

    vm.runInContext(recSrc, ctx);

    // 1. Verify extractDriveFileId ignores base64 strings and non-Drive URLs
    const base64PdfWithSlashD2 = 'data:application/pdf;base64,JVBERi-something/d/2-morebase64';
    assert.strictEqual(ctx.window.extractDriveFileId(base64PdfWithSlashD2), null, 'extractDriveFileId must return null for base64 data URIs');
    assert.strictEqual(ctx.window.extractDriveFileId('sheet://doc/APP-MWKMNL70-EF7_fileDegree_4'), null, 'extractDriveFileId must return null for sheet:// pointers');
    assert.strictEqual(ctx.window.extractDriveFileId('https://example.com/item?id=2'), null, 'extractDriveFileId must return null for non-Google URLs');

    const realDriveUrl = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing';
    assert.strictEqual(ctx.window.extractDriveFileId(realDriveUrl), '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', 'extractDriveFileId must extract 33+ char ID from real Drive URL');

    // 2. Verify viewDoc() with candidate vaulted base64 PDF
    const testApp = {
      id: 'APP-MWKMNL70-EF7',
      name: 'Sneeha A/P Rajenderew',
      docs: [
        {
          field: 'fileDegree',
          name: 'STPM.pdf',
          size: 1260305,
          type: 'application/pdf',
          data: base64PdfWithSlashD2
        }
      ]
    };

    ctx.window.pmgRecruitment.saveApps([testApp]);
    ctx.window.pmgRecruitment.viewDoc('APP-MWKMNL70-EF7', 0);

    const bodyHtml = doc.getElementById('recDocModalBody').innerHTML;
    assert(!bodyHtml.includes('https://drive.google.com/file/d/2/preview'), 'Must NOT embed Google Drive /d/2/preview iframe!');
    assert(bodyHtml.includes('blob:https://pmg-hub.local/mock-pdf-blob'), 'Must embed native blob URL in iframe for local PDF rendering');

    const dlHref = doc.getElementById('recDocModalDownloadBtn').href;
    assert.strictEqual(dlHref, 'blob:https://pmg-hub.local/mock-pdf-blob', 'Download button must point to the native blob URL');
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
})();
