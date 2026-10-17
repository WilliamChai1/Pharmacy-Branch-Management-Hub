global.window = { location: { search: '' }, navigator: { userAgent: 'Mozilla/5.0' } };
global.navigator = global.window.navigator;
global.document = { addEventListener: () => {}, write: () => {}, documentElement: { clientWidth: 1920 } };

const https = require('https');
https.get('https://sg-report.qiaolz.com/static/js/index.js', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Only run up to a1h definition
    const closeBracket = data.indexOf('];a1g=function()');
    const a1hFunc = data.indexOf('function a1h(a,b){');
    const endA1h = data.indexOf('}(a1g,');
    const initCode = data.substring(0, endA1h + 50);
    // Find where a1e is invoked
    const a1eIdx = data.indexOf('a1e();');
    eval(data.substring(0, a1eIdx + 6));
    console.log('0x1bb (crypto):', a1h(0x1bb));
    console.log('0xb7 (enc):', a1h(0xb7));
    console.log('0x1f9 (utf8):', a1h(0x1f9));
    console.log('0x94 (lib):', a1h(0x94));
    console.log('0x25a (wordarray):', a1h(0x25a));
    console.log('0x203 (protobuf):', a1h(0x203));
    console.log('0x1c3 (qSjo):', a1h(0x1c3));
    console.log('0x247 (fromJSON):', a1h(0x247));
    console.log('0x17e (decrypt):', a1h(0x17e));
    console.log('0x261 (ECB):', a1h(0x261));
    console.log('0x149 (pad):', a1h(0x149));
    console.log('0x1cb (Pkcs7):', a1h(0x1cb));
    console.log('0x196 (toString):', a1h(0x196));
    console.log('0x20a (decode):', a1h(0x20a));
    console.log('0x163 (data):', a1h(0x163));
    console.log('0x166 (parse):', a1h(0x166));
    console.log('0xe9 (Hex or Latin1?):', a1h(0xe9));
    console.log('0xdc (DES):', a1h(0xdc));
    console.log('0xde (mode):', a1h(0xde));
  });
});
