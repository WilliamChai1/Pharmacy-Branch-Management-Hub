const fs = require('fs');

// Mock localStorage and window
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Load code from pricing-intelligence.js in a sandbox
const code = fs.readFileSync('js/pricing-intelligence.js', 'utf8');

// Test parsing
const csvText = fs.readFileSync('C:/Users/User/Downloads/Monthly report data/Item sales data Aug 2026.csv', 'utf8');

// Create mock engine
let capturedClass = null;
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
console.log('✅ Pricing Engine initialized successfully.');

const parsed = engine.processXilnexCsvText(csvText, 'Item sales data Aug 2026.csv');
console.log(`✅ Parsed ${parsed.length} SKUs from Xilnex CSV.`);

engine.applyXilnexImport('replace');
console.log(`✅ Imported ${engine.skus.length} SKUs into Pricing Engine.`);

// Test default filtering
const initialFiltered = engine.getFilteredSkus();
console.log(`✅ Filtered count: ${initialFiltered.length}`);

// Test Margin Sort: Descending (Highest to Lowest)
engine.toggleMarginSort(); // 'desc'
console.log(`Sort order after 1st toggle: ${engine.marginSortOrder}`);
const sortedDesc = engine.getFilteredSkus();
console.log('Top 3 Highest Margin Items:');
for (let i = 0; i < 3; i++) {
  const s = sortedDesc[i];
  const m = engine.calculateMargin(s.costPrice, s.standardSp);
  console.log(`  ${i+1}. ${s.name} | Cost: RM ${s.costPrice.toFixed(2)} | SP: RM ${s.standardSp.toFixed(2)} | Margin: ${m}%`);
}

// Test Margin Sort: Ascending (Lowest to Highest)
engine.toggleMarginSort(); // 'asc'
console.log(`Sort order after 2nd toggle: ${engine.marginSortOrder}`);
const sortedAsc = engine.getFilteredSkus();
console.log('Top 3 Lowest Margin Items:');
for (let i = 0; i < 3; i++) {
  const s = sortedAsc[i];
  const m = engine.calculateMargin(s.costPrice, s.standardSp);
  console.log(`  ${i+1}. ${s.name} | Cost: RM ${s.costPrice.toFixed(2)} | SP: RM ${s.standardSp.toFixed(2)} | Margin: ${m}%`);
}

// Test Margin Sort: Back to default ('none')
engine.toggleMarginSort(); // 'none'
console.log(`Sort order after 3rd toggle: ${engine.marginSortOrder}`);

console.log('🎉 Full flow test passed successfully!');
