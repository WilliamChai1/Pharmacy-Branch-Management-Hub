const fs = require('fs');

function parseCsv(text) {
  const lines = [];
  const rawLines = text.split(/\r?\n/);
  for (let r = 0; r < rawLines.length; r++) {
    const line = rawLines[r];
    if (!line || !line.trim()) continue;
    if (!line.includes('"')) {
      const sep = line.includes('\t') ? '\t' : ',';
      const parts = line.split(sep).map(p => p.trim());
      if (parts.some(p => p.length > 0)) lines.push(parts);
      continue;
    }
    const row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if ((c === ',' || c === '\t') && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    row.push(field.trim());
    if (row.some(p => p.length > 0)) lines.push(row);
  }
  return lines;
}

function cleanNumber(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function detectXilnexColumns(headerRow) {
  const mapping = {
    code: -1,
    name: -1,
    description: -1,
    brand: -1,
    category: -1,
    cost: -1,             // PMG Custom Cost
    price: -1,            // PMG Member Price (Selling Price)
    nonMemberPrice: -1,   // PMG Non-Member Price / Normal Price
    qty: -1,
    margin: -1,
    isNetSoldPrice: false,
    supplier: -1,
    supermarket: -1,
    chain: -1
  };

  // Pass 1: PMG-specific & Xilnex export header priority
  headerRow.forEach((rawCol, idx) => {
    const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Margin MUST be matched before cost so 'Profit Margin % (Custom Cost)' is never caught as cost
    if (col.includes('grossprofitmargin') || col.includes('profitmargin') || col === 'grossmargin' || col === 'margin') {
      mapping.margin = idx;
    }
    // 2. Cost (must NOT contain margin or profit)
    else if (!col.includes('margin') && !col.includes('profit') &&
             (col === 'unitcustomcost' || col === 'customcost' || col === 'customcostrm' || col.includes('customcost') || col === 'unitcost' || col === 'costprice' || col === 'cost')) {
      mapping.cost = idx;
    }
    // 3. Member Price / Member Selling Price
    else if (col === 'memberprice' || col.includes('memberprice') || col === 'memberpricerm' || col === 'memberp' || col === 'membersellingprice') {
      mapping.price = idx;
    }
    // 4. Normal Price / Non-Member Price
    else if (col === 'normalprice' || col === 'normalsellingprice' || col === 'normalp' || col === 'nonmemberprice' || col.includes('nonmember') || col === 'nonmemberpricerm' || col === 'nonmemberp' || col === 'nonmembersellingprice' || col === 'retailprice' || col === 'rsp') {
      mapping.nonMemberPrice = idx;
    }
    // 5. Net Sold Price (from sales report)
    else if (col === 'netsoldprice' || col === 'soldprice' || col.includes('netsoldprice')) {
      mapping.price = idx;
      mapping.isNetSoldPrice = true;
    }
    // 6. Qty
    else if (col === 'qty' || col === 'quantity' || col === 'soldqty' || col === 'salesqty') {
      mapping.qty = idx;
    }
    // 7. Category (strict)
    else if (col === 'category' || col === 'itemcategory') {
      mapping.category = idx;
    }
    // 8. Preferred Vendor / Supplier
    else if (col === 'preferredvendor' || col === 'vendor' || col === 'vendorname' || col === 'supplier' || col === 'suppliername') {
      mapping.supplier = idx;
    }
    // 9. Specific Item Name vs Description
    else if (col === 'name' || col === 'itemname' || col === 'productname') {
      mapping.name = idx;
    }
  });

  // Pass 2: Fallback to standard headers if not matched by PMG-specific headers
  headerRow.forEach((rawCol, idx) => {
    const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (mapping.code === -1 && (col === 'itemcode' || col === 'code' || col === 'barcode' || col === 'itembarcode' || col === 'sku' || col === 'productcode' || col === 'itemno')) {
      mapping.code = idx;
    }
    if (mapping.name === -1 && (col === 'description' || col === 'itemdescription' || col === 'itemdesc')) {
      mapping.name = idx;
    } else if (mapping.description === -1 && (col === 'description' || col === 'itemdescription' || col === 'itemdesc')) {
      mapping.description = idx;
    }
    if (mapping.brand === -1 && (col === 'brand' || col === 'brandname' || col === 'principal' || col === 'manufacturer' || col === 'mfg')) {
      mapping.brand = idx;
    }
    if (mapping.category === -1 && (col === 'group' || col === 'department' || col === 'itemgroup' || col === 'itemtype' || col === 'type' || col === 'dept' || col === 'division')) {
      mapping.category = idx;
    }
    if (mapping.cost === -1 && !col.includes('margin') && !col.includes('profit') && (col === 'basecost' || col === 'avgcost' || col === 'averagecost' || col === 'standardcost' || col === 'stdcost' || col === 'lastcost' || col === 'purchaseprice' || col === 'buyprice')) {
      mapping.cost = idx;
    }
    if (mapping.price === -1 && (col === 'sellingprice' || col === 'price' || col === 'standardprice' || col === 'sp' || col === 'unitprice' || col === 'srp')) {
      mapping.price = idx;
    }
    if (mapping.supplier === -1 && (col === 'distributor' || col.includes('vendor') || col.includes('supplier'))) {
      mapping.supplier = idx;
    }
    if (mapping.supermarket === -1 && (col.includes('supermarket') || col.includes('farley') || col.includes('emart'))) {
      mapping.supermarket = idx;
    }
    if (mapping.chain === -1 && (col.includes('chain') || col.includes('watsons') || col.includes('guardian') || col.includes('alpro') || col.includes('competitor'))) {
      mapping.chain = idx;
    }
  });

  return mapping;
}

// Test 1: pricing 3.csv
const raw1 = fs.readFileSync('C:/Users/User/OneDrive - Public Medicare Group Sdn Bhd/William (Pharmacist)/PO PROJECT/pricing 3.csv', 'utf8');
const rows1 = parseCsv(raw1.split(/\r?\n/).slice(0, 5).join('\n'));
console.log('Test 1 (pricing 3.csv) Mapping:', detectXilnexColumns(rows1[0]));

// Test 2: Item sales data Aug 2026.csv
const raw2 = fs.readFileSync('C:/Users/User/Downloads/Monthly report data/Item sales data Aug 2026.csv', 'utf8');
const rows2 = parseCsv(raw2);
let headerIdx2 = -1, map2 = null;
for (let r = 0; r < 50; r++) {
  const m = detectXilnexColumns(rows2[r]);
  if (m.name !== -1 || m.code !== -1) {
    headerIdx2 = r;
    map2 = m;
    break;
  }
}
console.log('Test 2 (Item sales data Aug 2026.csv) Row ' + headerIdx2 + ' Mapping:', map2);
