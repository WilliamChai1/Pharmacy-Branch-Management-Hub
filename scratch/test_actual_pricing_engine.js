const fs = require('fs');

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

const code = fs.readFileSync('js/pricing-intelligence.js', 'utf8');
const fn = new Function('window', 'document', 'localStorage', code);
fn(mockWindow, mockWindow.document, global.localStorage);

const engine = mockWindow.pmgPricing;

const filePath = 'C:/Users/User/OneDrive - Public Medicare Group Sdn Bhd/William (Pharmacist)/PO PROJECT/pricing 3.csv';
const fileText = fs.readFileSync(filePath, 'utf8');
const sampleLines = fileText.split(/\r?\n/).slice(0, 15).join('\n');

const parsed = engine.processXilnexCsvText(sampleLines, 'pricing 3.csv');

console.log('✅ Parsed successfully using actual js/pricing-intelligence.js!');
console.log('Detected mapping:', engine.pendingXilnexMapping.mapping);
console.log('\nParsed Items:');
console.table(parsed.slice(0, 8).map(s => ({
  code: s.code,
  name: s.name.substring(0, 35),
  brand: s.brand,
  category: s.category,
  cost: s.costPrice,
  sp: s.standardSp,
  nonMember: s.nonMemberPrice,
  supplier: s.supplier,
  strategy: s.strategyTag
})));
