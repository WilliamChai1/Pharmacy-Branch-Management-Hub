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

const rawCsv = fs.readFileSync('C:/Users/User/OneDrive - Public Medicare Group Sdn Bhd/William (Pharmacist)/PO PROJECT/pricing 3.csv', 'utf8');
const rows = parseCsv(rawCsv.split(/\r?\n/).slice(0, 20).join('\n'));

const headers = rows[0];
const mapping = detectXilnexColumns(headers);

const parsedSkus = [];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.length === 0 || !row.some(c => c && c.trim())) continue;

  const code = mapping.code !== -1 ? (row[mapping.code] || '').trim() : `XIL-${r}`;
  const name = mapping.name !== -1 ? (row[mapping.name] || '').trim() : (code || `Item ${r}`);
  if (!name && !code) continue;

  let brand = mapping.brand !== -1 ? (row[mapping.brand] || '').trim() : '';
  let category = mapping.category !== -1 ? (row[mapping.category] || '').trim() : '';
  
  if (category) {
    const catUpper = category.toUpperCase();
    if (catUpper === 'FIR-AID' || catUpper.includes('FIRST AID')) category = 'First Aid / Wound Care';
    else if (catUpper === 'PERSONAL' || catUpper.includes('PERSONAL')) category = 'Personal Care';
    else if (catUpper === 'F & B' || catUpper === 'F&B' || catUpper.includes('FOOD')) category = 'Food & Beverage';
    else if (catUpper.includes('HEALTH') || catUpper.includes('SUPP')) category = 'Health & Supplements';
    else if (catUpper.includes('RX') || catUpper.includes('DISPENS') || catUpper.includes('POM')) category = 'Prescription (Rx)';
  } else {
    category = 'General OTC';
  }

  if (!brand || brand === 'General') {
    const upperName = name.toUpperCase();
    if (upperName.includes('SURGIPLUS')) brand = 'Surgiplus';
    else if (upperName.includes('MEDICOS')) brand = 'Medicos';
    else if (upperName.includes('FLAMINGO')) brand = 'Flamingo';
    else if (upperName.includes('SENSODYNE')) brand = 'Sensodyne';
    else if (upperName.includes('NIVEA')) brand = 'Nivea';
    else if (upperName.includes('TAISHIN')) brand = 'Taishin';
    else if (upperName.includes('BLACKMORES')) brand = 'Blackmores';
    else if (upperName.includes('ACCU-CHEK')) brand = 'Accu-Chek';
    else if (upperName.includes('PANADOL') || upperName.includes('GSK')) brand = 'GSK';
    else if (upperName.includes('OXY')) brand = 'Rohto Oxy';
    else if (upperName.includes('NOVOFINE') || upperName.includes('NOVO')) brand = 'Novo Nordisk';
    else {
      const firstWord = name.split(/[\s-]/)[0];
      brand = (firstWord && firstWord.length > 2 && isNaN(firstWord)) ? firstWord : 'General';
    }
  }

  const cost = mapping.cost !== -1 ? cleanNumber(row[mapping.cost]) : 0;
  let sp = mapping.price !== -1 ? cleanNumber(row[mapping.price]) : 0;
  const nonMemberSp = mapping.nonMemberPrice !== -1 
    ? cleanNumber(row[mapping.nonMemberPrice]) 
    : (sp > 0 ? parseFloat((sp * 1.1).toFixed(2)) : null);

  const supplier = mapping.supplier !== -1 ? (row[mapping.supplier] || '').trim() || 'Direct' : 'Direct';
  const internalNotes = mapping.description !== -1 ? (row[mapping.description] || '').trim() : '';

  let strategyTag = 'core_rx';
  if (cost > 0 && sp > 0) {
    const m = ((sp - cost) / sp) * 100;
    if (m >= 45) strategyTag = 'margin_builder';
    else if (m < 15) strategyTag = 'kvi_defensive';
  }

  parsedSkus.push({
    code,
    name,
    brand,
    category,
    costPrice: cost,
    standardSp: sp,
    nonMemberPrice: nonMemberSp,
    supplier,
    notes: internalNotes,
    margin: sp > 0 ? (((sp - cost) / sp) * 100).toFixed(2) + '%' : '0%',
    strategyTag
  });
}

console.log('Processed SKUs:');
console.table(parsedSkus.slice(0, 10));
