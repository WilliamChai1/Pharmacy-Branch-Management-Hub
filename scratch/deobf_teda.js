const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('scratch/teda_api_dump.json', 'utf8'));
const jsFile = dump.find(d => d.url.includes('f3f39e77.js'));

const endIdx = jsFile.body.indexOf('a8e();');
const initCode = jsFile.body.substring(0, endIdx);
eval(initCode);

console.log('0x1be (module name):', a8h(0x1be));
console.log('0x248 (func name):', a8h(0x248));
console.log('0x229 (key field):', a8h(0x229));
console.log('0x246 (responseType):', a8h(0x246));
console.log('0x25e (rid field):', a8h(0x25e));
console.log('0x1ec (url):', a8h(0x1ec));
console.log('0x198 (method):', a8h(0x198));
console.log('0x2b9 (apiName):', a8h(0x2b9));
console.log('0x2bf (app):', a8h(0x2bf));
console.log('0x272 (data field):', a8h(0x272));
console.log('0x1b9 (responseType field):', a8h(0x1b9));
