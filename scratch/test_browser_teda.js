const https = require('https');
const fs = require('fs');

https.get('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js', res => {
  let cjsCode = '';
  res.on('data', c => cjsCode += c);
  res.on('end', () => {
    const vm = require('vm');
    const ctx = { window: {}, console };
    vm.createContext(ctx);
    vm.runInContext(cjsCode, ctx);
    const CryptoJS = ctx.CryptoJS || ctx.window.CryptoJS;

    // Protobuf decode
    function decodeProtobuf(uint8) {
      let pos = 0;
      let data = null;
      let key = null;
      while (pos < uint8.length) {
        const tag = uint8[pos++];
        const wireType = tag & 0x07;
        const fieldNum = tag >> 3;
        if (wireType !== 2) throw new Error('Unsupported wire type: ' + wireType);
        let len = 0, shift = 0;
        while (true) {
          const b = uint8[pos++];
          len |= (b & 0x7f) << shift;
          if ((b & 0x80) === 0) break;
          shift += 7;
        }
        const fieldBytes = uint8.subarray(pos, pos + len);
        pos += len;
        if (fieldNum === 1) data = fieldBytes;
        else if (fieldNum === 2) key = fieldBytes;
      }
      return { data, key };
    }

    // Convert Uint8Array to CryptoJS WordArray
    function uint8ArrayToWordArray(u8) {
      const words = [];
      for (let i = 0; i < u8.length; i++) {
        words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
      }
      return CryptoJS.lib.WordArray.create(words, u8.length);
    }

    // Decode hex string to UTF-8
    function hexToUtf8(hexStr) {
      const cleanHex = hexStr.replace(/\s|0x/g, '');
      const bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
      }
      return new TextDecoder('utf-8').decode(bytes);
    }

    function decryptTedaData(rawArrayBuffer, rid) {
      const u8 = new Uint8Array(rawArrayBuffer);
      const { data: cipherDataU8, key: cipherKeyU8 } = decodeProtobuf(u8);

      const a0Str = rid.replace(/-/g, ''); // 32 chars
      const a0Key = CryptoJS.enc.Utf8.parse(a0Str);

      // Step 1: Decrypt inner key using AES-256-ECB
      const cipherKeyWA = uint8ArrayToWordArray(cipherKeyU8);
      const decKeyRes = CryptoJS.AES.decrypt(
        { ciphertext: cipherKeyWA },
        a0Key,
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
      );
      const decKeyHex = decKeyRes.toString();
      const innerKeyStr = hexToUtf8(decKeyHex);
      console.log('Decrypted inner key:', innerKeyStr);

      // Step 2: Decrypt data using DES-ECB
      const innerKeyWA = CryptoJS.enc.Utf8.parse(innerKeyStr);
      const cipherDataWA = uint8ArrayToWordArray(cipherDataU8);
      const decDataRes = CryptoJS.DES.decrypt(
        { ciphertext: cipherDataWA },
        innerKeyWA,
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
      );
      const decDataHex = decDataRes.toString();
      const reportJsonStr = hexToUtf8(decDataHex);
      return JSON.parse(reportJsonStr);
    }

    // Test with actual dump
    const dump = JSON.parse(fs.readFileSync('scratch/teda_api_dump.json', 'utf8'));
    const apiEntry = dump.find(d => d.url.includes('report/result2'));
    const rawBuf = Buffer.from(apiEntry.body, 'base64');
    const rid = "3d07d3b7-0267-43ca-8d6b-a350c39f8cdb";

    const reportObj = decryptTedaData(rawBuf, rid);
    console.log('Success! Report data advice:', reportObj.data.advice);
    console.log('Zangfu count:', reportObj.data.itemList[0].items.length);
    console.log('Tizhi count:', reportObj.data.itemList[1].items.length);
    console.log('Jingluo count:', reportObj.data.itemList[2].items.length);
  });
});
