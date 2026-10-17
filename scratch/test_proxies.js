const https = require('https');

async function testFetch(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        headers: headers,
        timeout: 8000
      }, res => {
        let len = 0;
        res.on('data', c => len += c.length);
        res.on('end', () => resolve({ status: res.statusCode, len }));
      });
      req.on('error', e => resolve({ error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function run() {
  const target = 'https://sg-app.qiaolz.com/report/result2?rid=3d07d3b7-0267-43ca-8d6b-a350c39f8cdb&mac=&lang=&v=3.0.0';
  
  console.log('Testing direct with Referer:', await testFetch(target, { 'Referer': 'https://sg-report.qiaolz.com/' }));
  console.log('Testing allorigins:', await testFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`));
  console.log('Testing codetabs:', await testFetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`));
}

run();
