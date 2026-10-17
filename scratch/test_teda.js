const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

async function run() {
  const indexJs = await get('https://sg-report.qiaolz.com/static/js/index.js');
  const target = '}(a1g,0x6fce9)';
  const endIdx = indexJs.indexOf(target) + target.length;
  const setup = indexJs.slice(0, endIdx) + ';';
  eval(setup);
  console.log('0x1f8:', a1h(0x1f8));
  console.log('0x192:', a1h(0x192));
}

run().catch(console.error);
