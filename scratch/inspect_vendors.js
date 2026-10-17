const https = require('https');

https.get('https://sg-report.qiaolz.com/static/js/chunk-vendors.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('chunk-vendors.js size:', data.length);
    // Find jsonpScriptSrc or chunk mapping
    let pos = data.indexOf('jsonpScriptSrc');
    if (pos !== -1) {
      console.log('jsonpScriptSrc:', data.substring(pos, pos + 300));
    }
    // Or search for script.src
    let srcPos = 0;
    while((srcPos = data.indexOf('.src =', srcPos)) !== -1) {
      console.log('.src =', data.substring(Math.max(0, srcPos - 50), Math.min(data.length, srcPos + 200)));
      srcPos += 6;
    }
  });
});
