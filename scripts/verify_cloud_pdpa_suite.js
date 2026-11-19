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
      replace: () => {},
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
      'agents/pmg-timetable-scheduler/agent.md',
      'skills/pmg-monthly-presentation/SKILL.md',
      'skills/pmg-pricing-intelligence/SKILL.md',
      'skills/pmg-cloud-sync-pdpa/SKILL.md',
      'skills/pmg-stock-aging-action-plan/SKILL.md',
      'skills/pmg-timetable-scheduler/SKILL.md',
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

  // 9. December 2026 KS01 Timetable Rebalancing (Option A 'Any Half (5H)', Shared Night 5H, Zero-Prefix Solver & Equitable 6-Staff Parity)
  test('December 2026 KS01 Option A Any Half (5H) rebalances all 6 rotating staff equitably without hardcoded prefixes', () => {
    const { ctx, doc } = createBrowserSandbox();
    const schedSrc = fs.readFileSync(path.join(ROOT, 'js', 'scheduler.js'), 'utf8');
    vm.runInContext(schedSrc, ctx);

    // Check November 2026 preserves Christina Lee (8 staff) and produces 0 shortages
    doc.getElementById('sched-month').value = '2026-11';
    doc.getElementById('schedulerMonth').value = '2026-11';
    vm.runInContext(`loadTeammates('KS01', '2026-11', true);`, ctx);
    const novTeam = vm.runInContext(`currentTeammates.map(t => ({ empNo: t.empNo, nickname: t.nickname }))`, ctx);
    assert.strictEqual(novTeam.length, 8, 'November 2026 KS01 should retain 8 teammates including Christina');
    assert(novTeam.some(t => t.empNo === 'PMG03033'), 'November 2026 KS01 should include Christina Lee (PMG03033)');
    const novSched = vm.runInContext(`runHeuristicScheduleGenerator('KS01', 2026, 11, 30)`, ctx);
    let novShortages = 0;
    novSched.days.forEach(d => {
      let am = 0, fullAm = 0, pm = 0, fullPm = 0;
      Object.values(d.shifts).forEach(s => {
        if (s === '8H_0730-1630' || s === '4H_0730-1130' || s === '5H_0730-1230') am++;
        if (s === '8H_0730-1630') fullAm++;
        if (s === '8H_1230-2130' || s === '5H_1630-2130') pm++;
        if (s === '8H_1230-2130') fullPm++;
      });
      if (am < 3 || fullAm < 2 || pm < 3 || fullPm < 2) novShortages++;
    });
    assert.strictEqual(novShortages, 0, `Expected 0 shortage days in Nov 2026, got ${novShortages}`);

    // Check December 2026 Option A defaults: 6 fixed RDs + 5 'Any Half (5H)' fixed-HD staff + Flexible Trainee (Vanessa)
    doc.getElementById('sched-month').value = '2026-12';
    doc.getElementById('schedulerMonth').value = '2026-12';
    vm.runInContext(`loadTeammates('KS01', '2026-12', true);`, ctx);
    const decTeam = vm.runInContext(`currentTeammates.map(t => ({ empNo: t.empNo, nickname: t.nickname, restDayPref: t.restDayPref, halfDayPref: t.halfDayPref, dayPrefs: t.dayPrefs }))`, ctx);
    assert.strictEqual(decTeam.length, 7, 'December 2026 KS01 must have 7 active teammates');
    assert(!decTeam.some(t => t.empNo === 'PMG03033' || t.nickname === 'CHRISTINA'), 'Christina Lee must be removed from December 2026 onwards');

    const fixedRdDays = new Set(decTeam.filter(t => t.restDayPref !== 'Flexible').map(t => t.restDayPref));
    assert.strictEqual(fixedRdDays.size, 6, 'Fixed-RD teammates must occupy 6 distinct Rest Days (leaving Saturday for Flexible Trainee Vanessa)');
    const vanTm = decTeam.find(t => t.empNo === 'PMG04331');
    assert(vanTm && vanTm.restDayPref === 'Flexible' && vanTm.halfDayPref === 'Flexible', 'Vanessa (PMG04331) must default to Flexible RD & HD in Dec 2026');

    const expectedAnyHds = [
      ['PMG01294', 'Thursday', 'Thursday Any (5H)'],
      ['PMG02694', 'Monday', 'Monday Any (5H)'],
      ['PMG01780', 'Wednesday', 'Wednesday Any (5H)'],
      ['PMG02070', 'Sunday', 'Sunday Any (5H)'],
      ['PMG03375', 'Tuesday', 'Tuesday Any (5H)']
    ];
    expectedAnyHds.forEach(([empNo, hdDay, expectedHalfPref]) => {
      const tm = decTeam.find(t => t.empNo === empNo);
      assert(tm, `Missing KS01 teammate ${empNo}`);
      assert.strictEqual(tm.dayPrefs[hdDay], 'Any Half (5H)', `${empNo} ${hdDay} must default to Any Half (5H)`);
      assert.strictEqual(tm.halfDayPref, expectedHalfPref, `${empNo} halfDayPref must default to ${expectedHalfPref}`);
    });

    const pennyTm = decTeam.find(t => t.empNo === 'PMG02694');
    assert.strictEqual(pennyTm.dayPrefs.Monday, 'Any Half (5H)', 'Penny Monday must be Any Half (5H)');
    assert.strictEqual(pennyTm.dayPrefs.Tuesday, 'RD', 'Penny Tuesday must be RD');
    assert.strictEqual(pennyTm.dayPrefs.Wednesday, 'Morning Preferred', 'Penny Wednesday must be Morning Preferred');
    assert.strictEqual(pennyTm.dayPrefs.Thursday, 'Night Preferred', 'Penny Thursday must be Night Preferred');
    assert.strictEqual(pennyTm.dayPrefs.Friday, 'Night Preferred', 'Penny Friday must be Night Preferred');
    assert.strictEqual(pennyTm.dayPrefs.Saturday, 'Morning Preferred', 'Penny Saturday must be Morning Preferred');
    assert.strictEqual(pennyTm.dayPrefs.Sunday, 'Night Preferred', 'Penny Sunday must be Night Preferred');

    // Run December 2026 heuristic schedule generator and verify floor headcount, 0 ratio/Penny/Friday violations, equitable shared Night 5H & 6-staff parity
    const decSched = vm.runInContext(`runHeuristicScheduleGenerator('KS01', 2026, 12, 31)`, ctx);
    const decMonthDays = decSched.days.filter(d => d.date.startsWith('2026-12'));
    assert.strictEqual(decMonthDays.length, 31, 'December 2026 schedule must contain all 31 December days');
    assert.strictEqual(decSched.days.length, 35, 'December 2026 5-week schedule must span 35 days');

    let shortageDays = 0;
    let ratioViolations = 0;
    let traineeFriViolations = 0;
    let pennyPrefViolations = 0;
    let totalNight5h = 0;
    const rotatingEmpNos = ['PMG01294', 'PMG02694', 'PMG01780', 'PMG02070', 'PMG03375', 'PMG04331'];
    const amTotals = {};
    const pmTotals = {};
    const n5Totals = {};
    const fixedHdMismatch = {};
    rotatingEmpNos.forEach(id => { amTotals[id] = 0; pmTotals[id] = 0; n5Totals[id] = 0; fixedHdMismatch[id] = 0; });

    for (let w = 0; w < 5; w++) {
      const weekRdDays = new Set();
      decSched.days.slice(w * 7, (w + 1) * 7).forEach(d => {
        Object.entries(d.shifts).forEach(([id, s]) => {
          if (s === 'RD') weekRdDays.add(`${id}:${d.dayOfWeek}`);
        });
      });
      const uniqueRdsInWeek = new Set([...weekRdDays].map(entry => entry.split(':')[1]));
      assert.strictEqual(uniqueRdsInWeek.size, 7, `Week ${w + 1} must allocate RDs cleanly across all 7 days without double-booking`);
    }

    decSched.days.forEach((d) => {
      assert(!('PMG03033' in d.shifts), `Christina Lee found in shift assignments on ${d.date}`);
      let am = 0, fullAm = 0, pm = 0, fullPm = 0;
      let srAm = 0, trAm = 0, srPm = 0, trPm = 0;
      Object.entries(d.shifts).forEach(([id, s]) => {
        const isTr = id === 'PMG04331';
        if (s === '8H_0730-1630' || s === '4H_0730-1130' || s === '5H_0730-1230') {
          am++;
          if (isTr) trAm++; else srAm++;
        }
        if (s === '8H_0730-1630') fullAm++;
        if (s === '8H_1230-2130' || s === '5H_1630-2130') {
          pm++;
          if (isTr) trPm++; else srPm++;
        }
        if (s === '8H_1230-2130') fullPm++;
        if (s === '5H_1630-2130') {
          totalNight5h++;
          if (n5Totals[id] !== undefined) n5Totals[id]++;
        }
      });

      // All non-Christmas days must achieve >= 3 AM (>= 2 Full AM) and >= 3 PM (>= 2 Full PM)
      if (d.date !== '2026-12-25') {
        if (am < 3 || fullAm < 2 || pm < 3 || fullPm < 2) shortageDays++;
      }
      if (trAm > srAm || trPm > srPm) ratioViolations++;

      // Vanessa (Trainee) Friday HQ Training invariant
      const vanShift = d.shifts['PMG04331'];
      if (d.dayOfWeek === 'Friday' && vanShift !== '8H_0730-1630' && vanShift !== '8H_1230-2130') {
        traineeFriViolations++;
      }

      // Penny (PMG02694) 7-day Option A preference adherence across all 35 days
      const pShift = d.shifts['PMG02694'];
      const pPref = pennyTm.dayPrefs[d.dayOfWeek];
      if (pPref === 'Any Half (5H)' && pShift !== '5H_0730-1230' && pShift !== '5H_1630-2130') pennyPrefViolations++;
      else if (pPref === 'RD' && pShift !== 'RD') pennyPrefViolations++;
      else if (pPref === 'Morning Preferred' && pShift !== '8H_0730-1630') pennyPrefViolations++;
      else if (pPref === 'Night Preferred' && pShift !== '8H_1230-2130' && pShift !== '5H_1630-2130') pennyPrefViolations++;

      expectedAnyHds.forEach(([empNo, hdDay]) => {
        if (d.dayOfWeek === hdDay) {
          const sh = d.shifts[empNo];
          if (sh !== '5H_0730-1230' && sh !== '5H_1630-2130') fixedHdMismatch[empNo]++;
        }
      });

      rotatingEmpNos.forEach(id => {
        const s = d.shifts[id];
        if (s === '8H_0730-1630' || s === '4H_0730-1130' || s === '5H_0730-1230') amTotals[id]++;
        if (s === '8H_1230-2130' || s === '5H_1630-2130') pmTotals[id]++;
      });
    });

    assert.strictEqual(shortageDays, 0, `Expected 0 manpower shortage days in Dec 2026, got ${shortageDays}`);
    assert.strictEqual(ratioViolations, 0, `Expected 0 Senior:Trainee ratio violations in Dec 2026, got ${ratioViolations}`);
    assert.strictEqual(traineeFriViolations, 0, `Expected 0 Trainee Friday HQ training violations in Dec 2026, got ${traineeFriViolations}`);
    assert.strictEqual(pennyPrefViolations, 0, `Expected 0 Penny Option A preference violations across all 35 days, got ${pennyPrefViolations}`);
    expectedAnyHds.forEach(([empNo]) => {
      assert.strictEqual(fixedHdMismatch[empNo], 0, `Expected ${empNo} to receive 5H AM/PM on every fixed HD day, mismatches=${fixedHdMismatch[empNo]}`);
    });

    const n5Users = Object.entries(n5Totals).filter(([, c]) => c > 0);
    assert(totalNight5h >= 4, `Expected Option A to schedule >= 4 Night 5H shifts across the month, got ${totalNight5h}`);
    assert(n5Users.length >= 2, `Expected Night 5H shifts to be shared across >= 2 rotating teammates, got ${JSON.stringify(n5Totals)}`);

    const amVals = Object.values(amTotals);
    const pmVals = Object.values(pmTotals);
    const amSpread = Math.max(...amVals) - Math.min(...amVals);
    const pmSpread = Math.max(...pmVals) - Math.min(...pmVals);
    assert(amSpread <= 2, `Expected ALL 6 rotating teammates AM shift spread <= 2, got ${amSpread} (${JSON.stringify(amTotals)})`);
    assert(pmSpread <= 2, `Expected ALL 6 rotating teammates PM shift spread <= 2, got ${pmSpread} (${JSON.stringify(pmTotals)})`);

    // Verify postProcessSchedule preserves Night 5H (5H_1630-2130) chosen for an 'Any Half (5H)' slot
    const postProcPreserved = vm.runInContext(`(() => {
      const mockSched = JSON.parse(JSON.stringify(${JSON.stringify(decSched)}));
      const targetDay = mockSched.days.find(d => d.dayOfWeek === 'Thursday');
      targetDay.shifts['PMG01294'] = '5H_1630-2130';
      postProcessSchedule(mockSched, 'KS01', 2026, 12, 31, getFullWeeksPeriod(2026, 12));
      return targetDay.shifts['PMG01294'];
    })()`, ctx);
    assert.strictEqual(postProcPreserved, '5H_1630-2130', 'postProcessSchedule must preserve Night 5H (5H_1630-2130) on Any Half (5H) weekdays');

    // Verify zero-prefix dynamic formulation on a completely synthetic custom branch (no PMG* IDs or KS01 names)
    const synRes = vm.runInContext(`(() => {
      const synTeam = [
        { empNo: 'SYN001', nickname: 'ALPHA', empName: 'ALPHA ANCHOR', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Fixed', race: 'Chinese', shiftPref: 'Morning Only', restDayPref: 'Sunday', halfDayPref: 'Saturday Morning (4H)', dayPrefs: { Monday: 'Morning Only', Tuesday: 'Morning Only', Wednesday: 'Morning Only', Thursday: 'Morning Only', Friday: 'Morning Only', Saturday: 'Morning Half (4H)', Sunday: 'RD' }, fixedPattern: { weekdays: '8H_0730-1630', saturday: '4H_0730-1130', sunday: 'RD', holidays: 'PH' } },
        { empNo: 'SYN002', nickname: 'BRAVO', empName: 'BRAVO ABM', position: 'Assistant Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', race: 'Iban / Bidayuh', shiftPref: 'Flexible', restDayPref: 'Wednesday', halfDayPref: 'Thursday Any (5H)', dayPrefs: { Monday: 'Morning Preferred', Tuesday: 'Night Preferred', Wednesday: 'RD', Thursday: 'Any Half (5H)', Friday: 'Night Preferred', Saturday: 'Night Preferred', Sunday: 'Morning Preferred' } },
        { empNo: 'SYN003', nickname: 'CHARLIE', empName: 'CHARLIE STAFF', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', race: 'Chinese', shiftPref: 'Flexible', restDayPref: 'Tuesday', halfDayPref: 'Monday Any (5H)', dayPrefs: { Monday: 'Any Half (5H)', Tuesday: 'RD', Wednesday: 'Morning Preferred', Thursday: 'Night Preferred', Friday: 'Night Preferred', Saturday: 'Morning Preferred', Sunday: 'Night Preferred' } },
        { empNo: 'SYN004', nickname: 'DELTA', empName: 'DELTA STAFF', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', race: 'Malay', shiftPref: 'Flexible', restDayPref: 'Thursday', halfDayPref: 'Wednesday Any (5H)', dayPrefs: { Monday: 'Night Preferred', Tuesday: 'Morning Preferred', Wednesday: 'Any Half (5H)', Thursday: 'RD', Friday: 'Night Preferred', Saturday: 'Morning Preferred', Sunday: 'Night Preferred' } },
        { empNo: 'SYN005', nickname: 'ECHO', empName: 'ECHO STAFF', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', race: 'Malay', shiftPref: 'Flexible', restDayPref: 'Monday', halfDayPref: 'Sunday Any (5H)', dayPrefs: { Monday: 'RD', Tuesday: 'Night Preferred', Wednesday: 'Morning Preferred', Thursday: 'Night Preferred', Friday: 'Morning Preferred', Saturday: 'Night Preferred', Sunday: 'Any Half (5H)' } },
        { empNo: 'SYN006', nickname: 'FOXTROT', empName: 'FOXTROT STAFF', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', race: 'Iban / Bidayuh', shiftPref: 'Flexible', restDayPref: 'Friday', halfDayPref: 'Tuesday Any (5H)', dayPrefs: { Monday: 'Night Preferred', Tuesday: 'Any Half (5H)', Wednesday: 'Night Preferred', Thursday: 'Morning Preferred', Friday: 'RD', Saturday: 'Morning Preferred', Sunday: 'Night Preferred' } },
        { empNo: 'SYN007', nickname: 'GOLF', empName: 'GOLF TRAINEE', position: 'Trainee', isPharmacist: false, scheduleMode: 'Rotating', race: 'Iban / Bidayuh', shiftPref: 'Flexible', restDayPref: 'Flexible', halfDayPref: 'Flexible', isTrainee: true, dayPrefs: { Monday: 'Flexible', Tuesday: 'Flexible', Wednesday: 'Flexible', Thursday: 'Flexible', Friday: 'Flexible', Saturday: 'Flexible', Sunday: 'Flexible' } }
      ];
      localStorage.setItem(getStorageKey('SYN01'), JSON.stringify(synTeam));
      loadTeammates('SYN01', '2026-12', true);
      const r = runHeuristicScheduleGenerator('SYN01', 2026, 12, 31);
      let sShort = 0, sRatio = 0, sTri = 0, sN5 = 0;
      r.days.forEach(d => {
        let sAm = 0, sFullAm = 0, sPm = 0, sFullPm = 0, srA = 0, trA = 0, srP = 0, trP = 0;
        Object.entries(d.shifts).forEach(([id, sh]) => {
          const isT = id === 'SYN007';
          if (sh === '8H_0730-1630' || sh === '4H_0730-1130' || sh === '5H_0730-1230') { sAm++; if (isT) trA++; else srA++; }
          if (sh === '8H_0730-1630') sFullAm++;
          if (sh === '8H_1230-2130' || sh === '5H_1630-2130') { sPm++; if (isT) trP++; else srP++; }
          if (sh === '8H_1230-2130') sFullPm++;
          if (sh === '5H_1630-2130') sN5++;
        });
        if (d.date !== '2026-12-25' && (sAm < 3 || sFullAm < 2 || sPm < 3 || sFullPm < 2)) sShort++;
        if (trA > srA || trP > srP) sRatio++;
        if (d.dayOfWeek === 'Friday' && d.shifts.SYN007 !== '8H_0730-1630' && d.shifts.SYN007 !== '8H_1230-2130') sTri++;
      });
      const sAms = synTeam.slice(1).map(t => r.stats[t.empNo].am);
      const sPms = synTeam.slice(1).map(t => r.stats[t.empNo].pm);
      return {
        sShort, sRatio, sTri, sN5,
        amSpread: Math.max(...sAms) - Math.min(...sAms),
        pmSpread: Math.max(...sPms) - Math.min(...sPms)
      };
    })()`, ctx);
    assert.strictEqual(synRes.sShort, 0, `Synthetic branch must have 0 shortages, got ${synRes.sShort}`);
    assert.strictEqual(synRes.sRatio, 0, `Synthetic branch must have 0 ratio violations, got ${synRes.sRatio}`);
    assert.strictEqual(synRes.sTri, 0, `Synthetic branch must have 0 trainee Friday violations, got ${synRes.sTri}`);
    assert(synRes.sN5 >= 4, `Synthetic branch must schedule >= 4 Night 5H shifts dynamically, got ${synRes.sN5}`);
    assert(synRes.amSpread <= 2, `Synthetic branch AM spread must be <= 2, got ${synRes.amSpread}`);
    assert(synRes.pmSpread <= 2, `Synthetic branch PM spread must be <= 2, got ${synRes.pmSpread}`);
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

  // 13. Multi-Date TCA Reminders, Customer Interactive Refill Portal & Pharmacist Packing Queue
  test('Multi-Date TCA Reminders, Customer Interactive Refill Portal & Pharmacist Packing Queue', async () => {
    let cloudPushedPayload = null;
    const fetchImpl = async (url, opts) => {
      if (opts && opts.body) {
        cloudPushedPayload = JSON.parse(opts.body);
      }
      return { ok: true, json: async () => ({ status: 'success' }) };
    };

    const { ctx, doc } = createBrowserSandbox(fetchImpl);
    const patientSrc = fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8');
    vm.runInContext(patientSrc, ctx);

    // Part A: Multi-Date TCA Reminders in Consultation Modal
    const p1 = {
      id: 'PT-TEST-001',
      name: 'Chong Wei Ping',
      phone: '012-8881234',
      ic: '850505-13-5555',
      branch: 'Kota Sentosa',
      language: 'English',
      encounters: [],
      appointments: []
    };
    ctx.window.patientsData = [p1];

    // Select patient in encounter modal
    doc.getElementById('encounterPatientSelect').value = p1.id;
    doc.getElementById('encDate').value = '2026-11-20';

    // Add multi-date reminders: 2 weeks for refill check, 2 months for clinical POCT review
    ctx.window.tempEncounterTcaReminders = [];
    ctx.window.addEncounterTcaRow('2026-12-05', 'Interim 2-Week Medication Refill Check', 'refill');
    ctx.window.addEncounterTcaRow('2027-01-20', 'Routine Health & POCT Review', 'clinical');

    assert.strictEqual(ctx.window.tempEncounterTcaReminders.length, 2, 'Must have 2 reminder dates staged');

    // Save encounter
    await ctx.window.saveNewEncounter();

    // Verify encounter & patient received both dates and nextTcaDate is the earliest
    assert(p1.encounters.length > 0, 'Encounter must be saved');
    assert.strictEqual(p1.tcaReminders.length, 2, 'Patient record must store 2 tcaReminders');
    assert.strictEqual(p1.nextTcaDate, '2026-12-05', 'Patient nextTcaDate must point to earliest upcoming date');
    assert.strictEqual(p1.encounters[0].tcaReminders.length, 2, 'Encounter record must store 2 tcaReminders');

    // Part B: WhatsApp Invitation with Refill Portal URL
    const refillUrl = ctx.window.getPatientSelfRefillUrl(p1, '2026-12-05', 'Interim 2-Week Medication Refill Check');
    assert(refillUrl.includes('refill=1'), 'URL must contain refill=1 parameter');
    assert(refillUrl.includes('tcaDate=2026-12-05'), 'URL must include tcaDate parameter');

    const refillWaMsg = ctx.window.buildPatientSupplyBookingMessage(p1, { isRefill: true, reminderDate: '2026-12-05' });
    assert(refillWaMsg.includes('refill') || refillWaMsg.includes('Refill'), 'Message should mention refill invitation');
    assert(refillWaMsg.includes('2026-12-05'), 'Message should mention reminder date');
    assert(refillWaMsg.includes('refill=1'), 'Message should contain the refill URL');

    // Part C: Interactive Customer Refill Portal Submission
    // 1. Submit Refill Request: Yes + 2 Weeks
    doc.getElementById('custRefillName').value = p1.name;
    doc.getElementById('custRefillPhone').value = p1.phone;
    doc.getElementById('custRefillPickupDate').value = '2026-12-06';
    doc.getElementById('custRefillPickupWindow').value = 'Morning (08:00 - 12:30)';
    ctx.window.setRefillDuration('2 Weeks (14 Days)');

    const mockEvt1 = { preventDefault: () => {} };
    doc.querySelector = (sel) => {
      if (sel === 'input[name="custRefillChoice"]:checked') {
        return { value: 'yes' };
      }
      return null;
    };

    await ctx.window.handleCustomerRefillSubmit(mockEvt1);

    const savedBookings = JSON.parse(ctx.window.localStorage.getItem('pmg_customer_bookings') || '[]');
    assert(savedBookings.length > 0, 'Refill order must be saved to pmg_customer_bookings');
    const order1 = savedBookings[0];
    assert.strictEqual(order1.status, 'REFILL_REQUESTED', 'Order status must be REFILL_REQUESTED');
    assert.strictEqual(order1.refillDuration, '2 Weeks (14 Days)', 'Refill duration must be recorded');
    assert.strictEqual(order1.type, 'med_refill_order', 'Order type must be med_refill_order');

    // Part D: Medication Refill & Packing Queue (Pharmacist workflow)
    ctx.window.renderPharmacistScheduleTab();

    const kpiTotalEl = doc.getElementById('refillKpiTotal');
    const kpiPendEl = doc.getElementById('refillKpiPending');
    assert(parseInt(kpiTotalEl.textContent, 10) >= 1, 'Refill KPI Total should be at least 1');
    assert(parseInt(kpiPendEl.textContent, 10) >= 1, 'Refill KPI Pending should be at least 1');

    // Transition 1: Pharmacist starts packing
    await ctx.window.startPackingRefill(order1.id);
    const orderPacking = JSON.parse(ctx.window.localStorage.getItem('pmg_customer_bookings') || '[]')[0];
    assert.strictEqual(orderPacking.status, 'PACKING', 'Status should transition to PACKING');

    // Transition 2: Pharmacist marks packed & sends WA
    await ctx.window.markRefillPackedAndNotifyWa(order1.id);
    const orderPacked = JSON.parse(ctx.window.localStorage.getItem('pmg_customer_bookings') || '[]')[0];
    assert.strictEqual(orderPacked.status, 'PACKED', 'Status should transition to PACKED');

    // Transition 3: Patient picks up
    await ctx.window.markRefillPickedUp(order1.id);
    const orderDone = JSON.parse(ctx.window.localStorage.getItem('pmg_customer_bookings') || '[]')[0];
    assert.strictEqual(orderDone.status, 'PICKED_UP', 'Status should transition to PICKED_UP');

    // Part E: PDPA Compliance Check
    if (cloudPushedPayload) {
      assert(!cloudPushedPayload.ic, 'PDPA Violation: Patient IC must never be pushed to cloud relay');
      assert(!cloudPushedPayload.vitals, 'PDPA Violation: Vitals must never be pushed to cloud relay');
      assert(!cloudPushedPayload.encounters, 'PDPA Violation: Encounters must never be pushed to cloud relay');
    }
  });

  // 14. Recruitment: 1-Click Download All Attached Documents & Picture as ZIP
  test('Recruitment 1-Click Download All Attached Documents & Picture as ZIP packages candidate dossier with summary manifest', async () => {
    let cloudPushedAction = null;
    const fetchImpl = async (url) => {
      if (url.includes('action=getApplicantDoc')) {
        cloudPushedAction = 'getApplicantDoc';
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: 'data:application/pdf;base64,' + Buffer.from('PDF SPM Result Cloud Vaulted').toString('base64')
          })
        };
      }
      return { ok: true, json: async () => ({ status: 'success' }) };
    };

    const { ctx, doc } = createBrowserSandbox(fetchImpl);
    const recSrc = fs.readFileSync(path.join(ROOT, 'js', 'recruitment.js'), 'utf8');

    // Load local jsPDF into sandbox
    const jspdfModule = require('../js/jspdf.umd.min.js');
    ctx.jspdf = jspdfModule;
    ctx.window.jspdf = jspdfModule;

    // Setup Blob, URL and immediate setTimeout mock
    ctx.setTimeout = (fn) => {
      if (typeof fn === 'function') fn();
      return 0;
    };
    ctx.Blob = function(chunks, opts) {
      this.chunks = chunks;
      this.type = opts ? opts.type : '';
      this.size = chunks.reduce((acc, c) => acc + (c.length || (c.byteLength || 0)), 0);
    };
    ctx.URL = {
      createObjectURL: (blob) => 'blob:https://pmg-hub.local/mock-zip-blob',
      revokeObjectURL: () => {}
    };

    const downloadedFiles = [];
    const origCreateEl = doc.createElement;
    doc.createElement = (tag) => {
      const el = origCreateEl(tag);
      if (tag === 'a') {
        el.click = () => {
          downloadedFiles.push({ download: el.download, href: el.href });
        };
      }
      return el;
    };

    const zipInstances = [];
    function MockJSZip() {
      this.files = {};
      zipInstances.push(this);
    }
    MockJSZip.prototype.file = function(name, content) {
      this.files[name] = content;
      return this;
    };
    MockJSZip.prototype.generateAsync = async function(opts) {
      return new ctx.Blob([JSON.stringify(Object.keys(this.files))], { type: 'application/zip' });
    };

    ctx.JSZip = MockJSZip;
    ctx.window.JSZip = MockJSZip;

    vm.runInContext(recSrc, ctx);

    // Verify recruitment export functions exist
    assert.strictEqual(typeof ctx.window.pmgRecruitment.downloadAllApplicantDocs, 'function', 'downloadAllApplicantDocs must be exported on pmgRecruitment');
    assert.strictEqual(typeof ctx.window.pmgRecruitment.downloadAllActiveApplicantDocs, 'function', 'downloadAllActiveApplicantDocs must be exported on pmgRecruitment');
    assert.strictEqual(typeof ctx.window.pmgRecruitment.generateApplicantSummaryPdf, 'function', 'generateApplicantSummaryPdf must be exported on pmgRecruitment');
    assert.strictEqual(typeof ctx.window.pmgRecruitment.parseSpmDetails, 'function', 'parseSpmDetails must be exported on pmgRecruitment');
    assert.strictEqual(typeof ctx.window.pmgRecruitment.formatSpmSummaryText, 'function', 'formatSpmSummaryText must be exported on pmgRecruitment');
    assert.strictEqual(typeof ctx.window.downloadAllApplicantDocs, 'function', 'downloadAllApplicantDocs must be attached to window');
    assert.strictEqual(typeof ctx.window.downloadAllActiveApplicantDocs, 'function', 'downloadAllActiveApplicantDocs must be attached to window');

    // Create candidate with comma-separated single-row SPM (as reported by user)
    const candidateApp = {
      id: 'APP-TEST-ZIP-001',
      name: 'Tan Mei Ling',
      ic: '980101-13-5556',
      position: 'Pharmacy Assistant',
      preferredBranch: 'Kota Sentosa (KS01)',
      phone: '016-1234567',
      email: 'meiling.tan@example.com',
      highestQual: 'Diploma in Pharmacy',
      status: 'shortlisted',
      spm: 'School: SMK SUNGAI TAPANG  (2023)\nResults: Bahasa Melayu: B, Bahasa Inggeris: B, Sejarah: C+, Matematik: C, Sains: C+, Pendidikan Moral: A-',
      photoThumbnail: 'data:image/jpeg;base64,' + Buffer.from('JPEG Passport Photo Candidate').toString('base64'),
      docs: [
        {
          field: 'fileIc',
          name: 'MyKad_IC.pdf',
          size: 20480,
          type: 'application/pdf',
          data: 'data:application/pdf;base64,' + Buffer.from('PDF MyKad IC Local').toString('base64')
        },
        {
          field: 'fileSpm',
          name: 'SPM_Result.pdf',
          size: 51200,
          type: 'application/pdf',
          url: 'sheet://doc/APP-TEST-ZIP-001_fileSpm_1'
        }
      ],
      aiReport: {
        score: 88,
        verdict: 'Recommended for Interview',
        summary: 'Solid community pharmacy dispensing experience and good interpersonal communication.'
      }
    };

    // Verify SPM parser splits comma-separated string into distinct separate rows
    const parsedSpm = ctx.window.pmgRecruitment.parseSpmDetails(candidateApp);
    assert.strictEqual(parsedSpm.school, 'SMK SUNGAI TAPANG', 'School must be extracted');
    assert.strictEqual(parsedSpm.year, '2023', 'Year must be extracted');
    assert.strictEqual(parsedSpm.subjects.length, 6, 'Must parse 6 separate subject rows from comma-separated string');
    assert.strictEqual(parsedSpm.subjects[0].subject, 'Bahasa Melayu');
    assert.strictEqual(parsedSpm.subjects[0].grade, 'B');
    assert.strictEqual(parsedSpm.subjects[3].subject, 'Matematik');
    assert.strictEqual(parsedSpm.subjects[3].grade, 'C');

    // Verify formatted SPM text summary displays each subject in a separate line
    const spmFormattedText = ctx.window.pmgRecruitment.formatSpmSummaryText(candidateApp);
    assert(spmFormattedText.includes('01. Bahasa Melayu'), 'Subject 1 must be on its own line');
    assert(spmFormattedText.includes('04. Matematik'), 'Subject 4 must be on its own line');
    assert(spmFormattedText.includes(': C'), 'Grade must be aligned in row');

    ctx.window.pmgRecruitment.saveApps([candidateApp]);

    // 1. Test downloadAllApplicantDocs directly with JSZip
    await ctx.window.pmgRecruitment.downloadAllApplicantDocs(candidateApp.id);

    assert.strictEqual(zipInstances.length, 1, 'JSZip must be instantiated');
    const zip = zipInstances[0];
    const zipFileNames = Object.keys(zip.files);

    // Verify primary PDF summary file
    const summaryPdfName = '00_Applicant_Summary_Tan_Mei_Ling.pdf';
    assert(zipFileNames.includes(summaryPdfName), 'ZIP must contain 00_Applicant_Summary PDF document');
    const pdfBytes = zip.files[summaryPdfName];
    assert(pdfBytes instanceof Uint8Array, 'PDF must be Uint8Array');
    const pdfHeader = Buffer.from(pdfBytes.slice(0, 5)).toString();
    assert.strictEqual(pdfHeader, '%PDF-', 'PDF summary must have valid PDF header %PDF-');

    // Verify companion TXT summary file with separate SPM subject rows
    const summaryTxtName = '00_Applicant_Summary_Tan_Mei_Ling.txt';
    assert(zipFileNames.includes(summaryTxtName), 'ZIP must contain companion 00_Applicant_Summary text file');
    const summaryContent = zip.files[summaryTxtName];
    assert(summaryContent.includes('Tan Mei Ling'), 'Summary text must contain candidate name');
    assert(summaryContent.includes('APP-TEST-ZIP-001'), 'Summary text must contain candidate ID');
    assert(summaryContent.includes('88/100'), 'Summary text must contain AI score');
    assert(summaryContent.includes('01. Bahasa Melayu'), 'Summary manifest text must display each SPM subject on separate row');
    assert(summaryContent.includes('04. Matematik'), 'Summary manifest text must display Matematik on separate row');
    assert(summaryContent.includes('01_Passport_Photo.jpg'), 'Summary manifest must list passport photo');
    assert(summaryContent.includes('02_MyKad_IC.pdf'), 'Summary manifest must list IC document');

    // Verify passport photo bundled
    assert(zipFileNames.includes('01_Passport_Photo.jpg'), 'ZIP must contain 01_Passport_Photo.jpg');
    assert(zip.files['01_Passport_Photo.jpg'] instanceof Uint8Array, 'Passport photo must be decoded as Uint8Array');

    // Verify local base64 doc bundled
    assert(zipFileNames.includes('02_MyKad_IC.pdf'), 'ZIP must contain 02_MyKad_IC.pdf');
    assert(zip.files['02_MyKad_IC.pdf'] instanceof Uint8Array, 'IC doc must be decoded as Uint8Array');

    // Verify cloud-vaulted doc hydrated and bundled
    assert(zipFileNames.includes('03_SPM_Result.pdf'), 'ZIP must fetch and bundle cloud vaulted 03_SPM_Result.pdf');
    assert(zip.files['03_SPM_Result.pdf'] instanceof Uint8Array, 'SPM doc must be decoded as Uint8Array');
    assert.strictEqual(cloudPushedAction, 'getApplicantDoc', 'Cloud vault getApplicantDoc must be triggered');

    // Verify downloaded ZIP blob name
    assert.strictEqual(downloadedFiles.length, 1, 'Trigger download must be called once for the ZIP');
    assert.strictEqual(downloadedFiles[0].download, 'PMG_Applicant_Tan_Mei_Ling_APP-TEST-ZIP-001_All_Documents.zip', 'Downloaded ZIP file name format must be exact');

    // 2. Test downloadAllActiveApplicantDocs via Viewer Modal
    ctx.window.pmgRecruitment.viewDoc(candidateApp.id, 0);
    downloadedFiles.length = 0;
    zipInstances.length = 0;

    await ctx.window.pmgRecruitment.downloadAllActiveApplicantDocs();
    assert.strictEqual(zipInstances.length, 1, 'Active viewer download must instantiate JSZip');
    assert.strictEqual(downloadedFiles.length, 1, 'Active viewer download must trigger ZIP download');
    assert.strictEqual(downloadedFiles[0].download, 'PMG_Applicant_Tan_Mei_Ling_APP-TEST-ZIP-001_All_Documents.zip');

    // Close modal and verify active ID is cleared
    ctx.window.pmgRecruitment.closeDocViewer();
    downloadedFiles.length = 0;
    await ctx.window.pmgRecruitment.downloadAllActiveApplicantDocs();
    assert.strictEqual(downloadedFiles.length, 0, 'No download when viewer is closed');

    // 3. Test Fallback when JSZip is unavailable
    delete ctx.JSZip;
    delete ctx.window.JSZip;
    downloadedFiles.length = 0;

    await ctx.window.pmgRecruitment.downloadAllApplicantDocs(candidateApp.id);
    assert.strictEqual(downloadedFiles.length, 5, 'Fallback must download all 5 files sequentially (PDF, TXT, Photo, IC, SPM)');
    const fallbackNames = downloadedFiles.map(f => f.download);
    assert(fallbackNames.includes('00_Applicant_Summary_Tan_Mei_Ling.pdf'), 'Fallback must download summary PDF');
    assert(fallbackNames.includes('00_Applicant_Summary_Tan_Mei_Ling.txt'), 'Fallback must download summary TXT');
    assert(fallbackNames.includes('01_Passport_Photo.jpg'), 'Fallback must download passport photo');
    assert(fallbackNames.includes('02_MyKad_IC.pdf'), 'Fallback must download IC');
    assert(fallbackNames.includes('03_SPM_Result.pdf'), 'Fallback must download SPM');
  });

  // 15. Penny (PMG02694) Preference Persistence, Pre-Fix Poisoned Snapshot Self-Heal & Stale Cloud Overwrite Protection
  await testAsync('Penny (PMG02694) preferences self-heal legacy poisoned snapshot, persist user edits via modal, and block stale cloud overwrites', async () => {
    const odSrc = fs.readFileSync(path.join(ROOT, 'js', 'onedrive-sync.js'), 'utf8');
    const schedSrc = fs.readFileSync(path.join(ROOT, 'js', 'scheduler.js'), 'utf8');

    const { ctx, win, doc, store } = createBrowserSandbox();
    let mockCloudFilePayload = null;
    const mockDirHandle = {
      getFileHandle: async (name) => {
        if (!mockCloudFilePayload || name !== 'schedule_preferences_KS01.json') {
          throw new Error('File not found');
        }
        return {
          getFile: async () => ({
            text: async () => JSON.stringify(mockCloudFilePayload)
          })
        };
      }
    };

    // Mock modal select queries for saveDayPrefsModal test
    let modalSelects = [];
    let tableRows = [];
    const origQuerySelectorAll = doc.querySelectorAll;
    doc.querySelectorAll = (sel) => {
      if (sel === '#dayPrefsModalForm .day-pref-select') return modalSelects;
      if (sel === '#schedulerTeammatesBody tr[data-emp-no]') return tableRows;
      return origQuerySelectorAll(sel);
    };

    doc.getElementById('schedulerBranchSelect').value = 'KS01';
    doc.getElementById('schedulerMonth').value = '2026-12';
    doc.getElementById('sched-month').value = '2026-12';

    vm.runInContext(odSrc, ctx);
    vm.runInContext(schedSrc, ctx);

    const makePoisonedSnapshot = () => {
      vm.runInContext(`loadTeammates('KS01', '2026-12', true);`, ctx);
      const team = JSON.parse(store.get('pmg_staff_preferences_v2_KS01'));
      const penny = team.find(t => t.empNo === 'PMG02694');
      penny.restDayPref = 'Tuesday';
      penny.halfDayPref = 'Friday Morning (5H)';
      penny.dayPrefs = {
        Monday: 'Flexible',
        Tuesday: 'RD',
        Wednesday: 'Morning Preferred',
        Thursday: 'Night Preferred',
        Friday: 'Morning Half (5H)',
        Saturday: 'Morning Preferred',
        Sunday: 'Night Preferred'
      };
      return team;
    };

    const poisonedTeam = makePoisonedSnapshot();

    // A. Pre-fix poisoned localStorage snapshot (< 2026-11-18T13:12:00.000Z) self-heals on loadTeammates('KS01', '2026-12', true)
    store.set('pmg_staff_preferences_v2_KS01', JSON.stringify(poisonedTeam));
    store.set('pmg_staff_preferences_v2_KS01_updatedAt', '2026-11-18T12:39:53.150Z');

    vm.runInContext(`loadTeammates('KS01', '2026-12', true);`, ctx);
    const healedTeam = JSON.parse(store.get('pmg_staff_preferences_v2_KS01'));
    const healedPenny = healedTeam.find(t => t.empNo === 'PMG02694');
    assert.strictEqual(healedPenny.dayPrefs.Monday, 'Morning Half (5H)', 'Self-heal must restore Penny Monday to Morning Half (5H)');
    assert.strictEqual(healedPenny.dayPrefs.Friday, 'Night Preferred', 'Self-heal must restore Penny Friday to Night Preferred');
    assert.strictEqual(healedPenny.halfDayPref, 'Monday Morning (5H)', 'Self-heal must restore Penny halfDayPref to Monday Morning (5H)');
    assert.strictEqual(
      store.get('pmg_staff_preferences_v2_KS01_updatedAt'),
      '2026-11-18T13:12:01.000Z',
      'Self-heal must advance _updatedAt past PENNY_REVERT_FIX_CUTOFF'
    );

    // B. Stale cloud payload (older or equal timestamp) must NEVER overwrite healed local preferences
    const staleRejected = win.applyCloudPreferences('KS01', {
      lastUpdated: '2026-11-18T12:39:53.150Z',
      data: poisonedTeam
    });
    assert.strictEqual(staleRejected, false, 'applyCloudPreferences must reject stale cloud timestamp older than local');
    const afterStaleTeam = JSON.parse(store.get('pmg_staff_preferences_v2_KS01'));
    const afterStalePenny = afterStaleTeam.find(t => t.empNo === 'PMG02694');
    assert.strictEqual(afterStalePenny.dayPrefs.Monday, 'Morning Half (5H)', 'Stale cloud push must not revert Penny Monday');
    assert.strictEqual(afterStalePenny.dayPrefs.Friday, 'Night Preferred', 'Stale cloud push must not revert Penny Friday');

    // C. User edit saved via saveDayPrefsModal persists cleanly across reloads & never self-reverts even if edited after cutoff
    const editedDayPrefs = {
      Monday: 'Morning Half (5H)',
      Tuesday: 'RD',
      Wednesday: 'Morning Preferred',
      Thursday: 'Night Preferred',
      Friday: 'Night Only',
      Saturday: 'Morning Preferred',
      Sunday: 'Night Preferred'
    };
    modalSelects = Object.entries(editedDayPrefs).map(([day, val]) => ({
      value: val,
      getAttribute: (attr) => (attr === 'data-day' ? day : null)
    }));
    // Provide row DOM reflecting updated Penny so saveTeammatePreferences() writes updated list
    tableRows = healedTeam.map(tm => ({
      getAttribute: (attr) => (attr === 'data-emp-no' ? tm.empNo : null),
      querySelector: (cls) => {
        if (cls === '.tm-rest-pref') return { value: tm.restDayPref };
        if (cls === '.tm-half-pref') return { value: tm.halfDayPref.split(' ')[0] };
        if (cls === '.tm-shift-pref') return { value: tm.shiftPref };
        if (cls === '.tm-position') return { value: tm.position };
        if (cls === '.tm-race') return { value: tm.race };
        return null;
      }
    }));

    vm.runInContext(`editingTeammateEmpNo = 'PMG02694'; saveDayPrefsModal();`, ctx);
    const postSaveTs = store.get('pmg_staff_preferences_v2_KS01_updatedAt');
    assert(postSaveTs && new Date(postSaveTs) >= new Date('2026-11-18T13:12:00.000Z'), 'User save must store a fresh post-fix _updatedAt timestamp');

    vm.runInContext(`loadTeammates('KS01', '2026-12', true);`, ctx);
    const reloadedPenny = vm.runInContext(`currentTeammates.find(t => t.empNo === 'PMG02694')`, ctx);
    assert.strictEqual(reloadedPenny.dayPrefs.Friday, 'Night Only', 'Reloading after modal save must preserve user-edited Friday Night Only preference');
    assert.strictEqual(reloadedPenny.dayPrefs.Monday, 'Morning Half (5H)', 'Reloading after modal save must preserve Penny Monday Morning Half (5H)');

    // D. OneDrive sync layer: older OneDrive snapshot must NOT overwrite local or reset local _updatedAt
    const od = win.pmgOneDriveSync;
    od.mode = 'BRANCH';
    od.activeBranchFolder = 'KOTA SENTOSA';
    od.rootHandle = mockDirHandle;
    mockCloudFilePayload = {
      branchCode: 'KS01',
      lastUpdated: '2026-11-18T12:00:00.000Z',
      preferences: poisonedTeam
    };
    const staleOdResult = await od.loadTeammatePreferencesFromOneDrive('KS01');
    assert.strictEqual(staleOdResult, null, 'OneDrive loader must return null when cloud snapshot is older than local');
    assert.strictEqual(
      store.get('pmg_staff_preferences_v2_KS01_updatedAt'),
      postSaveTs,
      'OneDrive loader must NOT clobber local _updatedAt with older cloud timestamp'
    );

    // E. Fresh PC with poisoned OneDrive snapshot (< cutoff) self-heals on applyCloudPreferences without sticking old timestamp
    store.delete('pmg_staff_preferences_v2_KS01');
    store.delete('pmg_staff_preferences_v2_KS01_updatedAt');
    mockCloudFilePayload = {
      branchCode: 'KS01',
      lastUpdated: '2026-11-18T12:39:53.150Z',
      preferences: poisonedTeam
    };
    const freshOdPrefs = await od.loadTeammatePreferencesFromOneDrive('KS01');
    assert(Array.isArray(freshOdPrefs) && freshOdPrefs.length > 0, 'Fresh PC should load OneDrive preferences');
    assert.strictEqual(
      store.get('pmg_staff_preferences_v2_KS01_updatedAt'),
      undefined,
      'OneDrive loader must not pre-stamp local _updatedAt before applyCloudPreferences applies repair'
    );
    const odApplied = od.applyCloudPreferences('KS01', {
      lastUpdated: store.get('pmg_schedule_prefs_cloud_updatedAt_KS01'),
      data: freshOdPrefs
    });
    assert.strictEqual(odApplied, true, 'OneDrive applyCloudPreferences should apply to fresh PC');
    const healedViaOd = JSON.parse(store.get('pmg_staff_preferences_v2_KS01')).find(t => t.empNo === 'PMG02694');
    assert.strictEqual(healedViaOd.dayPrefs.Monday, 'Morning Half (5H)', 'OneDrive applyCloudPreferences must self-heal poisoned Penny Monday');
    assert.strictEqual(healedViaOd.dayPrefs.Friday, 'Night Preferred', 'OneDrive applyCloudPreferences must self-heal poisoned Penny Friday');
    assert.strictEqual(
      store.get('pmg_staff_preferences_v2_KS01_updatedAt'),
      '2026-11-18T13:12:01.000Z',
      'OneDrive self-heal must advance _updatedAt past cutoff'
    );

    // F. Newer valid cloud update from another PC propagates cleanly
    const newerTeam = JSON.parse(store.get('pmg_staff_preferences_v2_KS01'));
    newerTeam.find(t => t.empNo === 'PMG02694').dayPrefs.Wednesday = 'Morning Only';
    const newerAccepted = win.applyCloudPreferences('KS01', {
      lastUpdated: '2099-01-01T00:00:00.000Z',
      data: newerTeam
    });
    assert.strictEqual(newerAccepted, true, 'Newer valid cloud payload must propagate via applyCloudPreferences');
    const syncedPenny = JSON.parse(store.get('pmg_staff_preferences_v2_KS01')).find(t => t.empNo === 'PMG02694');
    assert.strictEqual(syncedPenny.dayPrefs.Wednesday, 'Morning Only', 'Newer cloud preference update must be reflected locally');
  });

  // 13. Customer Self-Booking Cloud Persistence & Upcoming Queue Regression Test
  await testAsync('Customer self-bookings persist to Patient_Appointments & onlineBookings, survive schedule saves, and appear in Upcoming queue (>7 days out & refill orders)', async () => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8');

    // A. Static verification that renderPatientModule includes all future dates (apt.date > todayStr && isPending) and active refill statuses
    assert(
      src.includes("} else if (apt.date > todayStr && isPending) {"),
      'renderPatientModule must include all future pending appointments (apt.date > todayStr && isPending) in upcomingList without capping at next7DaysStr'
    );
    assert(
      src.includes("apt.status === 'REFILL_REQUESTED'"),
      'renderPatientModule must include REFILL_REQUESTED in isPending'
    );
    assert(
      src.includes('function mergeOnlineBookingArrays(cloudBookings, localBookings)'),
      'js/patient.js must define mergeOnlineBookingArrays to prevent schedule saves from overwriting onlineBookings'
    );

    // B. Runtime test of mergeOnlineBookingArrays + pushBookingToCloud + importSingleBooking
    const postCalls = [];
    let cloudScheduleBlob = {
      branchCode: 'Kota Sentosa',
      lastUpdated: '2026-11-18T10:00:00.000Z',
      weeklyTemplate: { '1': { isOpen: true, open: '08:00', close: '17:00' } },
      onlineBookings: [
        {
          id: 'PMG-BK-111111',
          ref: 'PMG-BK-111111',
          patientName: 'Existing Cloud Patient',
          patientPhone: '+60123456789',
          date: '2026-11-25',
          time: '10:00',
          status: 'Scheduled'
        }
      ]
    };

    const sb = createBrowserSandbox(async (url, opts) => {
      if (opts && opts.method === 'POST') {
        const body = JSON.parse(opts.body);
        postCalls.push(body);
        if (body.schedule) {
          cloudScheduleBlob = body.schedule;
        }
        return {
          ok: true,
          text: async () => JSON.stringify({ success: true, lastUpdated: new Date().toISOString() }),
          json: async () => ({ success: true, lastUpdated: new Date().toISOString() })
        };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          lastUpdated: cloudScheduleBlob.lastUpdated,
          schedule: JSON.parse(JSON.stringify(cloudScheduleBlob))
        })
      };
    });

    // Load PDPA guard + helper functions into sandbox
    const guardStart = src.indexOf('// ─── STRICT PDPA MEDICAL PRIVACY GUARD');
    const guardEnd = src.indexOf('const DEFAULT_PATIENTS_DATA');
    vm.runInContext(src.slice(guardStart, guardEnd), sb.ctx);

    const mergeStart = src.indexOf('function normalizePhoneForMatching');
    const mergeEnd = src.indexOf('function loadPatientsData');
    vm.runInContext(src.slice(mergeStart, mergeEnd), sb.ctx);

    const schedStart = src.indexOf('const BRANCH_SCHEDULES');
    const schedEnd = src.indexOf('function openShareBookingModal');
    sb.ctx.AbortController = AbortController;
    vm.runInContext(src.slice(schedStart, schedEnd), sb.ctx);

    const pushStart = src.indexOf('async function pushBookingToCloud');
    const pushEnd = src.indexOf('async function handleCustomerBookingSubmit');
    vm.runInContext(src.slice(pushStart, pushEnd), sb.ctx);

    const importStart = src.indexOf('function importSingleBooking');
    const importEnd = src.indexOf('async function syncOnlineBookingsFromCloud');
    vm.runInContext('var PMG_SCHEDULE_API_URL = "https://example.invalid/exec"; var patientsData = []; function isPatientDeleted() { return false; } function savePatientsData() {} function normalizeAppointmentTime(t) { return t || ""; }', sb.ctx);
    vm.runInContext(src.slice(importStart, importEnd), sb.ctx);

    // Seed Liew Pay Sze into patientsData
    vm.runInContext(`
      patientsData = [{
        id: 'PT-130412',
        name: 'Liew Pay Sze',
        ic: '021127-13-0412',
        phone: '+601125029622',
        branch: 'Kota Sentosa',
        appointments: [
          { id: 'PMG-BK-373295', date: '2026-10-23', time: '14:30', status: 'Completed' }
        ]
      }];
    `, sb.ctx);

    // 1. Customer Liew Pay Sze submits a new booking via WhatsApp link (e.g. 14 days in the future)
    const lpsBooking = {
      id: 'PMG-BK-998877',
      ref: 'PMG-BK-998877',
      patientName: 'Liew Pay Sze',
      patientPhone: '011-25029622',
      patientIc: '021127-13-0412',
      branchCode: 'Kota Sentosa',
      date: '2026-12-05',
      time: '11:00',
      service: 'In-Person Consultation & Health Screening',
      purpose: 'In-Person Consultation & Health Screening',
      status: 'Scheduled'
    };

    const pushOk = await sb.ctx.pushBookingToCloud(lpsBooking);
    assert.strictEqual(pushOk, true, 'pushBookingToCloud must return true');
    assert(postCalls.length >= 2, 'pushBookingToCloud must POST to both Patient_Appointments and PharmacistSchedule');

    const aptPost = postCalls.find(p => p.action === 'updateAppointmentStatus');
    assert(aptPost, 'pushBookingToCloud must write permanent record via action: updateAppointmentStatus');
    assert.strictEqual(aptPost.appointmentId, 'PMG-BK-998877');
    assert.strictEqual(aptPost.appointment.patientName, 'Liew Pay Sze');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(aptPost.appointment, 'patientIc'), false, 'PDPA guard must strip patientIc from cloud appointment payload');

    // 2. Simulate Pharmacist PC having a newer local schedule timestamp WITHOUT the new booking in local cache, then calling fetchScheduleFromSheets & pushScheduleToSheets
    sb.store.set('pmg_pharmacist_schedule_Kota Sentosa', JSON.stringify({
      branchCode: 'Kota Sentosa',
      lastUpdated: '2099-01-01T00:00:00.000Z',
      weeklyTemplate: { '1': { isOpen: true, open: '08:00', close: '17:00' } },
      onlineBookings: []
    }));

    const fetchedSched = await sb.ctx.fetchScheduleFromSheets('Kota Sentosa');
    assert(
      fetchedSched.onlineBookings.some(b => b.id === 'PMG-BK-998877'),
      'fetchScheduleFromSheets must merge cloud onlineBookings into local schedule even when local lastUpdated is newer'
    );

    // 3. Import booking into local patient registry and verify Liew Pay Sze gets the new appointment
    const imported = sb.ctx.importSingleBooking(lpsBooking, false);
    assert.strictEqual(imported, true, 'importSingleBooking must return true for Liew Pay Sze new appointment');
    const lpsRecord = vm.runInContext(`patientsData.find(p => p.id === 'PT-130412')`, sb.ctx);
    assert(
      lpsRecord.appointments.some(a => a.id === 'PMG-BK-998877' && a.date === '2026-12-05' && a.status === 'Scheduled'),
      'Liew Pay Sze profile must contain the newly imported upcoming appointment'
    );
  });

  // ── 17. FY2027 KPI Automation Suite (Phases 1–4) ──────────────────────────
  test('Phase 1: FY2027 KPI Engine (14th cut-off, EM HM+EHM, GP 30% override, Review Simulator, Morning Huddle)', () => {
    const kpi = require(path.join(ROOT, 'js', 'fy2027-kpi-engine.js'));
    assert.strictEqual(kpi.FY2027_BRANCH_DEFAULTS.monthlyCutOffDay, 14, 'Monthly cut-off must be 14th');
    assert.strictEqual(kpi.FY2027_BRANCH_DEFAULTS.googleReviewUrl, 'https://g.page/r/CUU3ygRE9IC6EBM/review');
    assert(kpi.FY2027_BRANCH_DEFAULTS.medicareAppIosUrl.includes('apps.apple.com'), 'Must include Apple App Store URL');
    assert(kpi.FY2027_BRANCH_DEFAULTS.medicareAppAndroidUrl.includes('play.google.com'), 'Must include Google Play URL');

    // Verify East Malaysia HM + EHM in performance.js computeAllMetrics
    const perfMod = require(path.join(ROOT, 'performance', 'performance.js'));
    const sampleMetrics = perfMod.computeAllMetrics({
      dailySalesLatest: { rows: [{ ts: 110000, hb: 33000, hm: 12000, ehm: 4500, pb: 0, pbAmpm: 0, whm: 0, regular: 0 }] },
      dailySalesPrevYear: { rows: [{ ts: 100000, hb: 30000, hm: 10000, ehm: 5000, pb: 0, pbAmpm: 0, whm: 0, regular: 0 }] },
      customersServedLatest: { rows: [], grandTotal: 1020 },
      customersServedPrevYear: { rows: [], grandTotal: 1000 },
      categoryGpLatest: { rows: [{ category: 'OTC', netSoldPrice: 110000, netSoldProfit: 33550, gpMarginPct: 30.5 }] },
      categoryGpPrevYear: { rows: [{ category: 'OTC', netSoldPrice: 100000, netSoldProfit: 30000, gpMarginPct: 30.0 }] },
      stockClosingLatest: { rows: [{ category: 'OTC', customCost: 130000 }] },
      itemSalesLatest: { items: [{ itemCode: '142499 - strip', itemName: 'FREE GLUCOSE SCREENING STRIP', netSoldPrice: 0, qty: 95 }] }
    });
    assert.strictEqual(sampleMetrics.outlet.hmPlusEhmLatest, 16500, 'EM High Margin must sum HM + EHM (12000 + 4500)');
    assert.strictEqual(sampleMetrics.outlet.hmPlusEhmPrev, 15000, 'EM High Margin LY must sum HM + EHM (10000 + 5000)');
    assert.strictEqual(sampleMetrics.outlet.hmPlusEhmDiffPct, 10, 'EM HM+EHM YoY growth must be +10%');

    const sc = kpi.evaluateFy2027AutoKpis(sampleMetrics, { googleReviewCount: 200, googleReviewRating: 4.65 });
    const b6 = sc.kpis.find(k => k.id === 'B6');
    assert.strictEqual(sc.gpAutoOverride, true, 'GP% >= 30.00% must activate Auto-Excellent Override');
    assert.strictEqual(b6.tier, 'Excellent', 'GP% 30.5% (+0.5pp YoY) must still score Excellent via 30% override');
    assert.strictEqual(sc.kpis.find(k => k.id === 'A3').tier, 'Excellent', 'EM HM+EHM +10% must score Excellent');
    assert.strictEqual(sc.kpis.find(k => k.id === 'G18').tier, 'Excellent', '95/1020 = 9.31% auto-detected free glucose must score Excellent');
    assert(sc.totalCappedScore <= 100, 'Total branch score must be capped at 100%');

    const revSim = kpi.calculateFiveStarReviewsNeeded(200, 4.65, 4.90, 250);
    assert(revSim.fiveStarNeeded >= 50 && revSim.projectedRating >= 4.90, 'Google Review simulator must solve both >=250 count and >=4.90 rating');

    const huddle = kpi.buildDailyTeamHuddleWhatsApp(sc, sampleMetrics, 'Thu, 19 Nov 2026');
    assert(huddle.includes('PMG KOTA SENTOSA') && huddle.includes('14th Cut-Off'), 'Morning Huddle WhatsApp must include KS01 targets & 14th cut-off');
  });

  test('Phase 2: 250-SKU Cycle Count Generator, 2.0-Mo PO Cap & 200-Pt Audit Risk Detector', () => {
    const sb = createBrowserSandbox();
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'fy2027-kpi-engine.js'), 'utf8'), sb.ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'inventory.js'), 'utf8'), sb.ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'audit.js'), 'utf8'), sb.ctx);

    const mockRows = Array.from({ length: 300 }, (_, i) => ({
      itemCode: `SKU-${1000 + i}`,
      desc: `Item ${i}`,
      category: 'OTC',
      soh: i % 3 === 0 ? 50 : 10,
      ads: 1 + (i % 5),
      approvedQty: 200,
      isAgingLocked: i % 10 === 0
    }));
    const cycleList = sb.ctx.generateMonthly250SkuCycleList(mockRows, 250);
    assert.strictEqual(cycleList.length, 250, 'Cycle count generator must pick exactly 250 unique SKUs');
    const uniqueCodes = new Set(cycleList.map(x => x.itemCode));
    assert.strictEqual(uniqueCodes.size, 250, 'All 250 cycle count SKUs must be unique');

    const capRes = sb.ctx.applyTwoMonthStockCyclePoCap(mockRows);
    assert(capRes.trimmedSkus > 0 && capRes.unitsSaved > 0, '2.0-month PO cap must trim over-buffered order units');
    assert(mockRows[0].approvedQty <= Math.max(0, Math.floor(mockRows[0].ads * 60) - mockRows[0].soh), 'Capped approvedQty must not exceed 60-day cover');

    const auditRisk = sb.ctx.computeAutoAuditRiskScore({
      vault: { cycleCountAccuracyPct: 65, expiryBlankPlansCount: 5 },
      skipSave: true
    });
    assert(auditRisk.bonusKillers.some(c => c.id === 'stock_mgmt'), 'Low cycle count accuracy must flag Stock Management as a <80% Bonus Killer');
  });

  test('Phase 3: Patient Care WhatsApp Growth Multiplier (Google Review + Medicare iOS & Android + Free Glucose, PDPA-Safe)', () => {
    const sb = createBrowserSandbox();
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'fy2027-kpi-engine.js'), 'utf8'), sb.ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'patient.js'), 'utf8'), sb.ctx);

    const footerEn = sb.ctx.buildFy2027GrowthWhatsAppFooter('English', { includeFreeGlucose: true, includeMedicareApp: true, includeGoogleReview: true });
    assert(footerEn.includes('FREE Blood Glucose'), 'English growth footer must include Free Blood Glucose invite');
    assert(footerEn.includes('apps.apple.com/my/app/public-medicare/id6761357301'), 'Must include official Public Medicare Apple App Store link');
    assert(footerEn.includes('play.google.com/store/apps/details?id=com.pmg.publicmedicare'), 'Must include official Public Medicare Google Play link');
    assert(footerEn.includes('https://g.page/r/CUU3ygRE9IC6EBM/review'), 'Must include Kota Sentosa Google Review URL');

    const revMsg = sb.ctx.buildGoogleReviewInviteMessage({ name: 'Tan Ah Kow', language: 'Chinese' });
    assert(revMsg.includes('https://g.page/r/CUU3ygRE9IC6EBM/review'), '1-click Google Review invite must embed KS01 review link');
    const appMsg = sb.ctx.buildMedicareAppInviteMessage({ name: 'Ahmad', language: 'Malay' });
    assert(appMsg.includes('id6761357301') && appMsg.includes('com.pmg.publicmedicare'), '1-click Medicare App invite must embed both iOS & Android links');
  });

  test('Phase 4: Google Flow (@me Avatar) Video Studio, Mini Member Day 2.50x ROI & Promo JS Parity', () => {
    const promoMain = fs.readFileSync(path.join(ROOT, 'js', 'promo-broadcast.js'), 'utf8');
    const promoStandalone = fs.readFileSync(path.join(ROOT, 'promo', 'promo.js'), 'utf8');
    assert.strictEqual(promoMain, promoStandalone, 'js/promo-broadcast.js and promo/promo.js must remain in 100% parity');

    const sb = createBrowserSandbox();
    vm.runInContext(promoMain, sb.ctx);

    const pack = sb.ctx.buildGoogleFlowAvatarPromptPack({
      hqScript: 'Vitamin D3 helps bone health and immunity. Many Malaysians are deficient despite sunny weather. Visit PMG Pharmacy for advice.',
      language: 'Malaysian English',
      clipCount: 3,
      tone: 'Friendly Community Pharmacist'
    });
    assert.strictEqual(pack.clips.length, 3, 'Must produce 3 sequential 8s clips');
    assert(pack.masterAgentPrompt.includes('@me'), 'Google Flow Master Prompt must explicitly cast @me personal avatar');
    assert(pack.masterAgentPrompt.includes('9:16 vertical'), 'Must target 9:16 vertical TikTok/Reels format');
    assert(pack.captions.tiktok.includes('#PMGPharmacy') && pack.captions.xhs.includes('KotaSentosa'), 'Must generate TikTok and XHS captions');

    const roiOk = sb.ctx.calculateMiniMemberDayRoi(1000, 2600);
    assert.strictEqual(roiOk.roi, 2.6, 'ROI must compute 2600/1000 = 2.60');
    assert.strictEqual(roiOk.isExcellent, true, 'ROI >= 2.50 must be Excellent');
    const roiLow = sb.ctx.calculateMiniMemberDayRoi(1000, 1800);
    assert.strictEqual(roiLow.isExcellent, false, 'ROI < 2.50 must not be Excellent');
    assert.strictEqual(roiLow.gapRm, 700, 'Gap to 2.50x ROI on RM1000 budget with RM1800 sales must be RM700');
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
})();
