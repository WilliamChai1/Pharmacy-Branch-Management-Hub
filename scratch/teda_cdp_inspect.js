const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userDataDir = path.join(__dirname, 'chrome_temp_profile');
const targetUrl = "https://sg-report.qiaolz.com/#/pages/reportTv/reportTvMain?rid=3d07d3b7-0267-43ca-8d6b-a350c39f8cdb&lang=";

async function checkPort() {
  for (let i = 0; i < 20; i++) {
    try {
      await new Promise((res, rej) => {
        const req = http.get('http://127.0.0.1:9222/json/version', res);
        req.on('error', rej);
        req.end();
      });
      return true;
    } catch(e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

async function run() {
  console.log("Launching dedicated Chrome instance on port 9222...");
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-sandbox'
  ]);

  const ready = await checkPort();
  if (!ready) throw new Error("Chrome failed to open port 9222");

  console.log("Chrome port 9222 is ready. Creating tab...");
  const newTab = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 9222,
      path: `/json/new?${encodeURIComponent(targetUrl)}`,
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });

  console.log("Created tab:", newTab.id);
  const ws = new WebSocket(newTab.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const networkResponses = [];
  const allUrls = [];

  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id).resolve(msg.result);
      callbacks.delete(msg.id);
    }

    if (msg.method === 'Network.requestWillBeSent') {
      allUrls.push(msg.params.request.url);
    }

    if (msg.method === 'Network.responseReceived') {
      const res = msg.params.response;
      networkResponses.push({
        requestId: msg.params.requestId,
        url: res.url,
        status: res.status,
        mimeType: res.mimeType
      });
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  console.log("WebSocket connected.");

  await send('Network.enable');
  await send('Page.enable');

  console.log("Navigating to target URL...");
  await send('Page.navigate', { url: targetUrl });

  console.log("Waiting 12 seconds for full SPA load...");
  await new Promise(resolve => setTimeout(resolve, 12000));

  console.log(`Total URLs requested: ${allUrls.length}`);
  allUrls.forEach(u => console.log('REQ:', u));

  // Fetch response bodies
  const apiData = [];
  for (const item of networkResponses) {
    if (item.url.includes('api') || item.url.includes('report') || item.url.includes('qiaolz') || item.mimeType.includes('json')) {
      try {
        const bodyRes = await send('Network.getResponseBody', { requestId: item.requestId });
        if (bodyRes && bodyRes.body) {
          console.log(`\n=== BODY from ${item.url} ===`);
          console.log(bodyRes.body.substring(0, 1000));
          apiData.push({ url: item.url, body: bodyRes.body });
        }
      } catch (e) {}
    }
  }

  const pageText = await send('Runtime.evaluate', {
    expression: 'document.body.innerText'
  });
  console.log("\n=== RENDERED PAGE TEXT ===");
  const textVal = pageText && pageText.result ? pageText.result.value : '';
  console.log(textVal.substring(0, 2000));

  fs.writeFileSync(path.join(__dirname, 'teda_api_dump.json'), JSON.stringify(apiData, null, 2));
  fs.writeFileSync(path.join(__dirname, 'teda_page_text.txt'), textVal);

  ws.close();
  chrome.kill();
  console.log("\nDone!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
