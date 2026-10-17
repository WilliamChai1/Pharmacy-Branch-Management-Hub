const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('scratch/teda_api_dump.json', 'utf8'));

dump.forEach(d => {
  if (d.url.endsWith('.js') && (d.body.includes("'ygAv'") || d.body.includes('"ygAv"') || d.body.includes('ygAv:'))) {
    console.log('Found ygAv in:', d.url);
    const idx = d.body.indexOf('ygAv');
    console.log(d.body.substring(Math.max(0, idx - 30), Math.min(d.body.length, idx + 1500)));
  }
});
