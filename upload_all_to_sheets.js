// upload_all_to_sheets.js
// Bulk uploader for PMG Stock Expiry Tracker to Google Sheets Web App
const fs = require('fs');
const path = require('path');

const API_URL = 'https://script.google.com/macros/s/AKfycbyp0uv8uw2ckUJ9eoq16o10Z0v-4c-ToQpuSwLXXwHpW9dnmw1OVll9gzhCmdwFaJIBTA/exec';
const SEED_FILE = path.join(__dirname, 'js', 'seed_expiry_data.js');

async function main() {
  const shouldClear = process.argv.includes('--clear');

  console.log('Loading seed records from js/seed_expiry_data.js...');
  const fileContent = fs.readFileSync(SEED_FILE, 'utf-8');
  const jsonStart = fileContent.indexOf('[');
  const jsonEnd = fileContent.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not find JSON array in seed_expiry_data.js');
  }
  const items = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));
  console.log(`Loaded ${items.length} items for Kota Sentosa.`);

  if (shouldClear) {
    console.log('Clearing existing rows in Google Sheet Master_Expiry...');
    const clearRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'clear_all' }),
      redirect: 'follow'
    });
    console.log('Clear response:', await clearRes.text());
  }

  const BATCH_SIZE = 250;
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);
  console.log(`Starting bulk upload: ${totalBatches} batches of ${BATCH_SIZE} items...`);

  for (let i = 0; i < totalBatches; i++) {
    const chunk = items.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    process.stdout.write(`Batch ${i + 1}/${totalBatches} (${chunk.length} items)... `);

    let retries = 3;
    let ok = false;
    while (retries > 0 && !ok) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'batch_insert',
            items: chunk,
            skipDistribution: true,
            updatedBy: 'Bulk Ingestion'
          }),
          redirect: 'follow'
        });
        const data = await res.json();
        if (data.success) {
          console.log(`✅ Done (Count: ${data.count})`);
          ok = true;
        } else {
          console.log(`⚠️ Failed: ${data.error}`);
          retries--;
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err) {
        retries--;
        console.log(`Retrying (${err.message})...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.log('Triggering monthly tabs distribution...');
  try {
    const distRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'rebuild_tabs' }),
      redirect: 'follow'
    });
    console.log('Rebuild tabs response:', await distRes.text());
  } catch (e) {
    console.log('Note: Rebuild can also be triggered via Google Sheet menu.');
  }

  console.log('🎉 Bulk ingestion complete!');
}

main().catch(console.error);
