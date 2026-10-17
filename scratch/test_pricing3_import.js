const fs = require('fs');

const filePath = 'C:/Users/User/OneDrive - Public Medicare Group Sdn Bhd/William (Pharmacist)/PO PROJECT/pricing 3.csv';

// Load code from pricing-intelligence.js in a sandbox
const code = fs.readFileSync('js/pricing-intelligence.js', 'utf8');

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const mockWindow = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  }
};

const fn = new Function('window', 'document', 'localStorage', code);
fn(mockWindow, mockWindow.document, global.localStorage);

const engine = mockWindow.pmgPricing;

// Read only first 200 rows for initial speed check
const fileText = fs.readFileSync(filePath, 'utf8');
const lines = fileText.split(/\r?\n/).slice(0, 100).join('\n');

const parsed = engine.processXilnexCsvText(lines, 'pricing 3.csv');

console.log('Mapping detected:');
console.log(engine.pendingXilnexMapping.mapping);

console.log('\nFirst 5 parsed SKUs:');
console.table(parsed.slice(0, 5).map(s => ({
  code: s.code,
  name: s.name.substring(0, 35),
  cost: s.costPrice,
  sp: s.standardSp,
  nonMember: s.nonMemberPrice,
  category: s.category,
  supplier: s.supplier,
  strategy: s.strategyTag
})));
