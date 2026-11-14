/**
 * PMG Management Hub - Portable Google Sheets Sync Utility
 * Supports Antigravity Cloud env secrets, GOOGLE_APPLICATION_CREDENTIALS, or local service account JSON.
 * Patient medical data is NEVER managed through this Google Sheets utility (PDPA isolation).
 */
const fs = require('fs');
const path = require('path');

function loadGoogleApis() {
  const candidates = [
    () => require('googleapis'),
    () => process.env.GOOGLEAPIS_PATH ? require(process.env.GOOGLEAPIS_PATH) : null,
    () => process.env.APPDATA
      ? require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'mcp-google-sheets', 'node_modules', 'googleapis'))
      : null,
    () => require('/usr/local/lib/node_modules/mcp-google-sheets/node_modules/googleapis')
  ];
  for (const loader of candidates) {
    try {
      const mod = loader();
      if (mod && mod.google) return mod.google;
    } catch (_) {}
  }
  return null;
}

function loadServiceAccountCredentials() {
  if (process.env.PMG_GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.PMG_GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }

  const rootDir = path.join(__dirname, '..');
  const preferredPath = path.join(rootDir, 'gen-lang-client-0473802065-d916c4cdb024.json');
  if (fs.existsSync(preferredPath)) {
    return JSON.parse(fs.readFileSync(preferredPath, 'utf8'));
  }

  // Fallback scan for any gitignored local service account file (zero hardcoded filenames required)
  try {
    const files = fs.readdirSync(rootDir);
    const match = files.find((f) => /^(gen-lang-client-.*|.*service[-_]account.*)\.json$/i.test(f));
    if (match) {
      return JSON.parse(fs.readFileSync(path.join(rootDir, match), 'utf8'));
    }
  } catch (_) {}

  throw new Error(
    'Google Service Account credentials not found. Set PMG_GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

let cachedClients = null;
function getSheetsClient() {
  if (cachedClients) return cachedClients;
  const google = loadGoogleApis();
  if (!google) {
    throw new Error('Cannot resolve "googleapis" package. Run "npm install" or set GOOGLEAPIS_PATH.');
  }
  const key = loadServiceAccountCredentials();
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
  cachedClients = { auth, sheets, drive, clientEmail: key.client_email };
  return cachedClients;
}

// Known sheets registry (Non-patient operational sheets only)
const KNOWN_SHEETS = {
  'rymnet': '1HVpF66K59fbNOmyvouih5knTPMBwoCZ_lGLczD5QaB0',
  'rymnet conversion': '1HVpF66K59fbNOmyvouih5knTPMBwoCZ_lGLczD5QaB0',
  'pmg walao': '12v4Y8WliN8xmehOCqUtPYdm7Kwbjn-bkWzZE1tb4SYw',
  'walao': '12v4Y8WliN8xmehOCqUtPYdm7Kwbjn-bkWzZE1tb4SYw'
};

async function resolveSpreadsheetId(identifier) {
  const { drive, clientEmail } = getSheetsClient();
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
  throw new Error(`Spreadsheet "${identifier}" not found or not shared with ${clientEmail}`);
}

async function listSpreadsheets() {
  const { sheets, drive } = getSheetsClient();
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
  const { sheets } = getSheetsClient();
  const id = await resolveSpreadsheetId(sheetIdentifier);
  const targetRange = tabName ? (range ? `${tabName}!${range}` : tabName) : (range || 'A1:Z100');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: targetRange
  });
  return res.data.values || [];
}

async function writeRange(sheetIdentifier, range, values) {
  const { sheets } = getSheetsClient();
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
  const { sheets } = getSheetsClient();
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
  getSheetsClient,
  listSpreadsheets,
  readSheet,
  writeRange,
  appendRows,
  resolveSpreadsheetId,
  KNOWN_SHEETS
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
