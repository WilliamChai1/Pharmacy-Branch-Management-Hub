const https = require('https');
const fs = require('fs');
const path = require('path');

https.get('https://sg-report.qiaolz.com/static/js/index.js', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let cIdx = data.indexOf('convertReportData');
    let start = data.lastIndexOf('ygAv', cIdx);
    start = data.lastIndexOf("function", start);
    let end = data.indexOf("a['exports']=", cIdx);
    end = data.indexOf("}", end) + 2;
    const code = data.substring(start, end);
    fs.writeFileSync(path.join(__dirname, 'ygav_module.js'), code);
    console.log('Saved ygav_module.js, length:', code.length);
  });
});
