const https = require('https');
const fs = require('fs');
const path = require('path');

https.get('https://sg-report.qiaolz.com/static/js/index.js', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Total length:', data.length);
    const slice = data.substring(50000);
    fs.writeFileSync(path.join(__dirname, 'index_tail.js'), slice);
    console.log('Saved index_tail.js, length:', slice.length);
  });
});
