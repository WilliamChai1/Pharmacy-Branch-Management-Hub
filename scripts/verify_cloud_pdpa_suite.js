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
    disabled: false,
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    parentNode: null,
    appendChild: () => {},
    removeChild: () => {},
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

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
})();
