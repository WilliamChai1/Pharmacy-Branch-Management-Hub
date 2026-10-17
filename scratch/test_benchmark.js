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

const start = Date.now();
const filePath = 'C:/Users/User/OneDrive - Public Medicare Group Sdn Bhd/William (Pharmacist)/PO PROJECT/pricing 3.csv';
const content = fs.readFileSync(filePath, 'utf8');
const rows = parseCsv(content);
console.log(`Parsed ${rows.length} rows in ${Date.now() - start}ms`);
