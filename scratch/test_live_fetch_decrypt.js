const https = require('https');

async function testFetchAndDecrypt(rid) {
  const url = `https://sg-app.qiaolz.com/report/result2?rid=${encodeURIComponent(rid)}&mac=&lang=&v=3.0.0`;
  console.log('Fetching:', url);

  const arrayBuffer = await new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://sg-report.qiaolz.com',
        'Referer': 'https://sg-report.qiaolz.com/'
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });

  console.log('Fetched buffer length:', arrayBuffer.length);

  // Protobuf parser
  let pos = 0;
  let cipherData = null;
  let cipherKey = null;

  while (pos < arrayBuffer.length) {
    const tag = arrayBuffer[pos++];
    const wireType = tag & 0x07;
    const fieldNum = tag >> 3;
    if (wireType !== 2) throw new Error('Unsupported wire type: ' + wireType);
    let len = 0, shift = 0;
    while (true) {
      const b = arrayBuffer[pos++];
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    const bytes = arrayBuffer.subarray(pos, pos + len);
    pos += len;
    if (fieldNum === 1) cipherData = bytes;
    else if (fieldNum === 2) cipherKey = bytes;
  }

  console.log('Protobuf parsed: data len =', cipherData.length, 'key len =', cipherKey.length);

  // Load CryptoJS
  const cryptoJsCode = await new Promise((resolve, reject) => {
    https.get('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });

  const vm = require('vm');
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(cryptoJsCode, ctx);
  const CryptoJS = ctx.CryptoJS || ctx.window.CryptoJS;

  function u8ToWordArray(u8) {
    const words = [];
    for (let i = 0; i < u8.length; i++) {
      words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
    }
    return CryptoJS.lib.WordArray.create(words, u8.length);
  }

  function hexToUtf8(hexStr) {
    const cleanHex = hexStr.replace(/\s|0x/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  const a0Str = rid.replace(/-/g, '');
  const a0Key = CryptoJS.enc.Utf8.parse(a0Str);

  const keyWA = u8ToWordArray(cipherKey);
  const decKeyRes = CryptoJS.AES.decrypt(
    { ciphertext: keyWA },
    a0Key,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  const innerKeyStr = hexToUtf8(decKeyRes.toString());
  console.log('Inner Key decrypted:', innerKeyStr);

  const dataWA = u8ToWordArray(cipherData);
  const innerKeyWA = CryptoJS.enc.Utf8.parse(innerKeyStr);
  const decDataRes = CryptoJS.DES.decrypt(
    { ciphertext: dataWA },
    innerKeyWA,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  const reportJsonStr = hexToUtf8(decDataRes.toString());
  const report = JSON.parse(reportJsonStr);
  console.log('Decrypted Advice:', report.data.advice);
  console.log('Immunity Score:', report.data.score1);
  return report.data;
}

testFetchAndDecrypt('3d07d3b7-0267-43ca-8d6b-a350c39f8cdb')
  .then(data => console.log('Successfully completed end-to-end fetch & decrypt test!'))
  .catch(console.error);
