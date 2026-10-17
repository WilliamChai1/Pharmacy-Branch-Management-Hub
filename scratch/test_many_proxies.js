const https = require('https');
const http = require('http');

const targetUrl = 'https://sg-app.qiaolz.com/report/result2?rid=3d07d3b7-0267-43ca-8d6b-a350c39f8cdb&mac=&lang=&v=3.0.0';

const proxies = [
  { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` },
  { name: 'allorigins_raw', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
  { name: 'allorigins_get', url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}` },
  { name: 'cors_sh', url: `https://proxy.cors.sh/${targetUrl}`, headers: { 'x-cors-api-key': 'temp_demo' } },
  { name: 'corsanywhere', url: `https://cors-anywhere.herokuapp.com/${targetUrl}` },
  { name: 'thingproxy', url: `https://thingproxy.freeboard.io/fetch/${targetUrl}` },
  { name: 'jswrapper', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` }
];

async function test(p) {
  return new Promise((resolve) => {
    try {
      const u = new URL(p.url);
      const mod = u.protocol === 'https:' ? https : http;
      const req = mod.request({
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
        headers: Object.assign({
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://sg-report.qiaolz.com/'
        }, p.headers || {}),
        timeout: 6000
      }, res => {
        let len = 0;
        res.on('data', c => len += c.length);
        res.on('end', () => resolve({ name: p.name, status: res.statusCode, len }));
      });
      req.on('error', e => resolve({ name: p.name, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ name: p.name, error: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ name: p.name, error: e.message });
    }
  });
}

async function main() {
  for (const p of proxies) {
    const res = await test(p);
    console.log(res);
  }
}
main();
