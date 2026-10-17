const fs = require('fs');
const crypto = require('crypto');

// Protobuf decoding:
// Field 1: data (bytes) -> tag 0x0A
// Field 2: key (bytes) -> tag 0x12
function decodeProtobuf(buffer) {
  let pos = 0;
  let data = null;
  let key = null;

  while (pos < buffer.length) {
    const tag = buffer[pos++];
    const wireType = tag & 0x07;
    const fieldNum = tag >> 3;

    if (wireType !== 2) {
      throw new Error(`Unsupported wire type: ${wireType}`);
    }

    // Read varint length
    let len = 0;
    let shift = 0;
    while (true) {
      const b = buffer[pos++];
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }

    const fieldBytes = buffer.subarray(pos, pos + len);
    pos += len;

    if (fieldNum === 1) data = fieldBytes;
    else if (fieldNum === 2) key = fieldBytes;
  }

  return { data, key };
}

// AES ECB Decrypt
function decryptAesEcb(ciphertext, keyStr) {
  const key = Buffer.from(keyStr, 'utf8');
  const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

// Pure JS DES ECB Decryption (Pkcs7)
// Since DES blocks are 8 bytes, let's implement or use standard DES
const DES = (function() {
  // Let's test with crypto if --openssl-legacy-provider or write standard DES
  return {
    decrypt: function(ciphertext, keyStr) {
      const key = Buffer.from(keyStr.substring(0, 8), 'utf8');
      const decipher = crypto.createDecipheriv('des-ecb', key, null);
      decipher.setAutoPadding(true);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    }
  };
})();

async function run() {
  const dump = JSON.parse(fs.readFileSync('scratch/teda_api_dump.json', 'utf8'));
  const apiEntry = dump.find(d => d.url.includes('report/result2'));
  const rawBase64 = apiEntry.body;
  const rawBuf = Buffer.from(rawBase64, 'base64');
  console.log('Total raw buffer length:', rawBuf.length);

  const { data, key } = decodeProtobuf(rawBuf);
  console.log('Decoded protobuf fields: data len =', data.length, 'key len =', key.length);

  const rid = "3d07d3b7-0267-43ca-8d6b-a350c39f8cdb";
  const a0 = rid.replace(/-/g, ''); // 32 bytes
  console.log('Key a0:', a0);

  // Step 1: Decrypt key using AES-256-ECB with a0
  console.log('Attempting AES decrypt of key...');
  const decryptedKey = decryptAesEcb(key, a0);
  console.log('Decrypted inner key:', decryptedKey);

  // Step 2: Decrypt data using DES-ECB with decryptedKey
  console.log('Attempting DES decrypt of data with inner key...');
  const decryptedData = DES.decrypt(data, decryptedKey);
  console.log('Decrypted data length:', decryptedData.length);
  console.log('Data preview:', decryptedData.substring(0, 500));

  const json = JSON.parse(decryptedData);
  console.log('Successfully parsed JSON keys:', Object.keys(json));
  fs.writeFileSync('scratch/teda_decrypted.json', JSON.stringify(json, null, 2));
}

run().catch(console.error);
