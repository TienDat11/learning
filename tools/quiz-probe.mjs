// tools/quiz-probe.mjs — measure quiz gameability against the REAL evaluated bundle.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const src = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).sort();
const APP_JS = src.map((f) => `\n/* ==== src/${f} ==== */\n${readFileSync(join(root, 'src', f), 'utf8')}`).join('\n');

const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], hidden: false, value: '', textContent: '', innerHTML: '', setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {}, blur() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {} });
const mkDoc = () => ({ addEventListener() {}, removeEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };
const loader = new Function('document', 'window', 'localStorage', 'navigator', 'console',
  APP_JS + '\n;return {QUIZ};');
const { QUIZ } = loader(mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } }, store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} });

// replicate orderFor() from src/90-app.js
const seedFrom = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const orderFor = (id, n) => { const o = []; for (let i = 0; i < n; i++) o.push(i); let s = seedFrom(String(id)) || 1; for (let k = n - 1; k > 0; k--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (k + 1); const t = o[k]; o[k] = o[j]; o[j] = t; } return o; };

const pos = {};
let longestHit = 0, blatant = 0, sumC = 0, sumD = 0;
const rows = [];
for (const q of QUIZ) {
  const opts = q.options.map((o) => String(o));
  const order = orderFor(q.id, opts.length);
  const p = order.indexOf(q.answer);
  pos[p] = (pos[p] || 0) + 1;
  const lens = opts.map((o) => o.length);
  const cLen = lens[q.answer];
  const dMax = Math.max(...lens.filter((_, i) => i !== q.answer));
  const isLongest = lens.indexOf(Math.max(...lens)) === q.answer;
  if (isLongest) longestHit++;
  if (cLen > 1.5 * dMax) blatant++;
  sumC += cLen; sumD += dMax;
  rows.push({ id: q.id, n: opts.length, renderedPos: p, cLen, dMax, ratio: (cLen / dMax).toFixed(2), isLongest });
}
console.log('quiz items:', QUIZ.length);
console.log('rendered position of correct answer:', JSON.stringify(pos));
console.log('correct option is the longest:', longestHit, '/', QUIZ.length);
console.log('correct > 1.5x longest distractor (blatant):', blatant);
console.log('avg correct len:', (sumC / QUIZ.length).toFixed(1), ' avg longest distractor:', (sumD / QUIZ.length).toFixed(1));
console.log('\nper item (ratio = correctLen / longestDistractorLen):');
for (const r of rows) console.log(`  ${r.id}  n=${r.n} pos=${r.renderedPos} c=${String(r.cLen).padStart(3)} d=${String(r.dMax).padStart(3)} ratio=${r.ratio}${r.isLongest ? '  <-- LONGEST' : ''}`);
