/**
 * PMG Management Hub - Google Sheets Sync Utility
 * Powered by Google Cloud Service Account
 */
const fs = require('fs');
const path = require('path');
const { google } = require('C:\\Users\\User\\AppData\\Roaming\\npm\\node_modules\\mcp-google-sheets\\node_modules\\googleapis');

// Locate service account credentials
const credsPath = path.join(__dirname, '..', 'gen-lang-client-0473802065-d916c4cdb024.json');

if (!fs.existsSync(credsPath)) {
  console.error('[GoogleSheetsSync] Error: Credentials file not found at:', credsPath);
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

const auth = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.readonly'
  ]
);

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Known sheets registry
const KNOWN_SHEETS = {
  'rymnet': '1HVpF66K59fbNOmyvouih5knTPMBwoCZ_lGLczD5QaB0',
  'rymnet conversion': '1HVpF66K59fbNOmyvouih5knTPMBwoCZ_lGLczD5QaB0',
  'pmg walao': '12v4Y8WliN8xmehOCqUtPYdm7Kwbjn-bkWzZE1tb4SYw',
  'walao': '12v4Y8WliN8xmehOCqUtPYdm7Kwbjn-bkWzZE1tb4SYw'
};

async function resolveSpreadsheetId(identifier) {
  if (KNOWN_SHEETS[identifier.toLowerCase()]) {
    return KNOWN_SHEETS[identifier.toLowerCase()];
  }
  if (identifier.length > 25 && !identifier.includes(' ')) {
    return identifier; // Assume direct spreadsheet ID
  }
  // Search drive by name
  const res = await drive.files.list({
    q: `name = '${identifier}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: 'files(id, name)'
  });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  throw new Error(`Spreadsheet "${identifier}" not found or not shared with ${key.client_email}`);
}

async function listSpreadsheets() {
  const res = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: 'files(id, name, modifiedTime)'
  });
  const files = res.data.files || [];
  console.log(`Found ${files.length} accessible spreadsheet(s):`);
  for (const f of files) {
    console.log(`- ${f.name} (ID: ${f.id})`);
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: f.id });
      const tabNames = meta.data.sheets.map(s => s.properties.title);
      console.log(`  Tabs: [ ${tabNames.join(', ')} ]`);
    } catch (e) {
      console.log(`  (Could not fetch tabs: ${e.message})`);
    }
  }
  return files;
}

async function readSheet(sheetIdentifier, tabName, range) {
  const id = await resolveSpreadsheetId(sheetIdentifier);
  const targetRange = tabName ? (range ? `${tabName}!${range}` : tabName) : (range || 'A1:Z100');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: targetRange
  });
  return res.data.values || [];
}

async function writeRange(sheetIdentifier, range, values) {
  const id = await resolveSpreadsheetId(sheetIdentifier);
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
  return res.data;
}

async function appendRows(sheetIdentifier, range, values) {
  const id = await resolveSpreadsheetId(sheetIdentifier);
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });
  return res.data;
}

module.exports = {
  auth,
  sheets,
  drive,
  listSpreadsheets,
  readSheet,
  writeRange,
  appendRows,
  resolveSpreadsheetId,
  clientEmail: key.client_email
};

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'list';

  (async () => {
    try {
      if (action === 'list') {
        await listSpreadsheets();
      } else if (action === 'read') {
        const sheetName = args[1] || 'Rymnet Conversion';
        const tab = args[2] || 'PharmacistSchedule';
        const range = args[3] || 'A1:H10';
        console.log(`Reading from "${sheetName}", tab: "${tab}", range: "${range}"...`);
        const data = await readSheet(sheetName, tab, range);
        console.table(data);
      } else {
        console.log('Usage:');
        console.log('  node scripts/google_sheets_sync.js list');
        console.log('  node scripts/google_sheets_sync.js read "<SheetName>" "<TabName>" "<Range>"');
      }
    } catch (err) {
      console.error('[CLI Error]:', err.message);
      process.exit(1);
    }
  })();
}
