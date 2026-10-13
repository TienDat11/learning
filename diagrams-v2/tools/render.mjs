// Render các SVG ra PNG thật qua Edge CDP. Dùng: node tools/render.mjs <kind: desk|mob> <outPng>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const kind = process.argv[2];
const out = process.argv[3];
const dir = 'D:/research/diagrams-v2/diagrams';
const prev = 'D:/research/diagrams-v2/preview';
const width = kind === 'desk' ? 720 : 360;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg') && (kind === 'desk' ? !f.includes('.mobile.') : f.includes('.mobile.'))).sort();

const body = files.map(f => `<div class="c"><div class="n">${f}</div><img src="../diagrams/${f}" style="width:${width}px;display:block"></div>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#FAFAFA;padding:16px;width:${width + 32}px;font:12px sans-serif;color:#5F5F6A}.c{margin-bottom:24px}.n{margin-bottom:4px}</style></head><body>${body}</body></html>`;
const page = path.join(prev, `render-${kind}.html`);
fs.writeFileSync(page, html);

const port = 9444 + (kind === 'desk' ? 0 : 1);
const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=D:/research/diagrams-v2/preview/edge-${kind}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(500); } }
const pg = targets.find(t => t.type === 'page');
const ws = new WebSocket(pg.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: width + 32, height: 800, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `file:///${page.replace(/\\/g, '/')}` });
await sleep(1500);
const h = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
const H = h.result.result.value;
await send('Emulation.setDeviceMetricsOverride', { width: width + 32, height: H, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: width + 32, height: H, scale: 1 } });
fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log('saved', out, 'files', files.length, 'height', H);
ws.close(); proc.kill(); process.exit(0);
