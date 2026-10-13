// Điều khiển Edge headless qua CDP để chạy script đo trên trang thật.
// Dùng: node tools/cdp.mjs <url> <expression-file-or-inline> [screenshotOut]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const url = process.argv[2];
const expr = fs.readFileSync(process.argv[3], 'utf8');
const port = 9333;

const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, '--user-data-dir=D:/research/diagrams-v2/preview/edge-profile', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getTargets() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json`); return await r.json(); } catch { await sleep(500); }
  }
  throw new Error('no CDP');
}

const targets = await getTargets();
let page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Page.navigate', { url });
await sleep(1500);
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(res.result?.result?.value ?? res, null, 0));
ws.close();
proc.kill();
process.exit(0);
