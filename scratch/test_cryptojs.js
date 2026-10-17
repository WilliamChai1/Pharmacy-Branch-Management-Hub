const fs = require('fs');

async function testWithCryptoJs() {
  const t = await fetch('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js').then(r => r.text());
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', t + '; return module.exports;');
  const CryptoJS = fn(mod, mod.exports);

  function decodeTedaProtobuf(uint8) {
    let pos = 0;
    let cipherData = null;
    let cipherKey = null;

    while (pos < uint8.length) {
      const tag = uint8[pos++];
      const wireType = tag & 0x07;
      const fieldNum = tag >> 3;

      if (wireType !== 2) {
        if (wireType === 0) {
          while (pos < uint8.length && (uint8[pos++] & 0x80) !== 0) {}
        } else if (wireType === 1) pos += 8;
        else if (wireType === 5) pos += 4;
        else break;
        continue;
      }

      let len = 0;
      let shift = 0;
      while (pos < uint8.length) {
        const b = uint8[pos++];
        len |= (b & 0x7f) << shift;
        if ((b & 0x80) === 0) break;
        shift += 7;
      }
      const bytes = uint8.subarray(pos, pos + len);
      pos += len;
      if (fieldNum === 1) cipherData = bytes;
      else if (fieldNum === 2) cipherKey = bytes;
    }
    return { cipherData, cipherKey };
  }

  function u8ToCryptoJsWordArray(u8) {
    const words = [];
    for (let i = 0; i < u8.length; i++) {
      words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
    }
    return CryptoJS.lib.WordArray.create(words, u8.length);
  }

  function hexToUtf8String(hexStr) {
    const cleanHex = hexStr.replace(/\s|0x/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  const rid = 'cbb5d2e9-2dc3-4da0-aeb1-62d6e8bab38f';
  const url = `https://sg-app.qiaolz.com/report/result2?rid=${rid}&mac=&lang=&v=3.0.0`;
  const res = await fetch(url, { headers: { 'Referer': 'https://sg-report.qiaolz.com/' } });
  const buf = await res.arrayBuffer();

  const uint8 = new Uint8Array(buf);
  const { cipherData, cipherKey } = decodeTedaProtobuf(uint8);

  // Step 1: AES decrypt cipherKey
  const a0Str = rid.replace(/-/g, '');
  const a0Key = CryptoJS.enc.Utf8.parse(a0Str);
  const keyWA = u8ToCryptoJsWordArray(cipherKey);

  const decKeyRes = CryptoJS.AES.decrypt(
    { ciphertext: keyWA },
    a0Key,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  const innerKeyStr = hexToUtf8String(decKeyRes.toString(CryptoJS.enc.Hex));
  console.log('Decrypted inner key with CryptoJS:', innerKeyStr);

  // Step 2: DES decrypt cipherData
  const dataWA = u8ToCryptoJsWordArray(cipherData);
  const desKeyWA = CryptoJS.enc.Utf8.parse(innerKeyStr.slice(0, 8));
  const decDataRes = CryptoJS.DES.decrypt(
    { ciphertext: dataWA },
    desKeyWA,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );

  const reportJsonStr = hexToUtf8String(decDataRes.toString(CryptoJS.enc.Hex));
  const reportObj = JSON.parse(reportJsonStr);
  const r = reportObj.data || reportObj;

  console.log('=== EXACT VALUES EXTRACTED VIA BROWSER CRYPTOJS ===');
  console.log('Health Score:', r.score1);
  console.log('Immunity Score:', r.score2);
  console.log('Advice:', r.advice);
  console.log('Zangfu:', r.itemList?.[0]?.items?.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', '));
  console.log('Tizhi:', r.itemList?.[1]?.items?.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', '));
  console.log('Jingluo:', r.itemList?.[2]?.items?.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', '));
  console.log('Spine:', r.itemList?.[3]?.items?.slice(0, 3).map(x => `${x.name} ${x.score}`).join(', '));
}

testWithCryptoJs().catch(console.error);
