const https = require('https');

https.get('https://sg-report.qiaolz.com/static/js/index.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = 0;
    while((idx = data.indexOf('.js', idx)) !== -1) {
      console.log('js string:', data.substring(Math.max(0, idx - 40), Math.min(data.length, idx + 40)));
      idx += 3;
    }
  });
});
