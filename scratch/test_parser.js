const fs = require('fs');

function cleanNumber(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseCsv(text) {
  const lines = [];
  const rawLines = text.split(/\r?\n/);
  for (let raw of rawLines) {
    const line = raw.trim();
    if (!line) continue;
    if (!line.includes('"')) {
      lines.push(line.split(',').map(p => p.trim()));
      continue;
    }
    const row = [];
    let field = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (c === ',' && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    row.push(field.trim());
    lines.push(row);
  }
  return lines;
}

function detectXilnexColumns(headerRow) {
  const mapping = {
    code: -1, name: -1, brand: -1, category: -1,
    cost: -1, price: -1, nonMemberPrice: -1,
    qty: -1, margin: -1, isNetSoldPrice: false,
    supplier: -1, supermarket: -1, chain: -1
  };
  headerRow.forEach((rawCol, idx) => {
    const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (col === 'unitcustomcost' || col === 'customcost' || col.includes('customcost')) mapping.cost = idx;
    else if (col === 'memberprice' || col.includes('memberprice') || col === 'memberpricerm') mapping.price = idx;
    else if (col === 'nonmemberprice' || col.includes('nonmember')) mapping.nonMemberPrice = idx;
    else if (col === 'netsoldprice' || col === 'soldprice') { mapping.price = idx; mapping.isNetSoldPrice = true; }
    else if (col === 'qty' || col === 'quantity' || col === 'soldqty') mapping.qty = idx;
    else if (col.includes('grossprofitmargin') || col.includes('profitmargin') || col === 'margin') mapping.margin = idx;
  });
  headerRow.forEach((rawCol, idx) => {
    const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (mapping.code === -1 && (col === 'itemcode' || col === 'code' || col === 'barcode' || col === 'sku')) mapping.code = idx;
    else if (mapping.name === -1 && (col === 'itemname' || col === 'description' || col === 'itemdescription' || col === 'name')) mapping.name = idx;
    else if (mapping.brand === -1 && (col === 'brand' || col === 'brandname')) mapping.brand = idx;
    else if (mapping.category === -1 && (col === 'category' || col === 'group' || col === 'itemgroup' || col === 'department')) mapping.category = idx;
    else if (mapping.cost === -1 && (col === 'cost' || col === 'costprice' || col === 'unitcost' || col === 'basecost')) mapping.cost = idx;
    else if (mapping.price === -1 && (col === 'sellingprice' || col === 'price' || col === 'retailprice' || col === 'unitprice' || col === 'sp')) mapping.price = idx;
  });
  return mapping;
}

const csvText = fs.readFileSync('C:/Users/User/Downloads/Monthly report data/Item sales data Aug 2026.csv', 'utf8');
const rows = parseCsv(csvText);
let headerIdx = -1, mapping = null;
for (let r = 0; r < Math.min(rows.length, 50); r++) {
  const m = detectXilnexColumns(rows[r]);
  if (m.name !== -1 || m.code !== -1) {
    headerIdx = r;
    mapping = m;
    break;
  }
}

console.log('Header found at row index:', headerIdx);
console.log('Mapping:', mapping);

const sampleParsed = [];
for (let r = headerIdx + 1; r < headerIdx + 8; r++) {
  const row = rows[r];
  const code = mapping.code !== -1 ? row[mapping.code] : '';
  const name = mapping.name !== -1 ? row[mapping.name] : '';
  const cost = mapping.cost !== -1 ? cleanNumber(row[mapping.cost]) : 0;
  let sp = mapping.price !== -1 ? cleanNumber(row[mapping.price]) : 0;
  const qty = mapping.qty !== -1 ? Math.abs(cleanNumber(row[mapping.qty])) : 0;
  if (mapping.isNetSoldPrice && qty > 0) {
    sp = parseFloat((sp / qty).toFixed(2));
  }
  const margin = sp > 0 ? parseFloat((((sp - cost) / sp) * 100).toFixed(2)) : 0;
  sampleParsed.push({ code, name, cost, sp, qty, margin });
}
console.log('Sample parsed:');
console.table(sampleParsed);
