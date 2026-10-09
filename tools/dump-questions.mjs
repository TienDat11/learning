// tools/dump-questions.mjs — inventory of the question bank for backfill planning.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const src = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).sort();
const APP_JS = src.map((f) => `\n/* ==== src/${f} ==== */\n${readFileSync(join(root, 'src', f), 'utf8')}`).join('\n');
const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], hidden: false, value: '', textContent: '', innerHTML: '', setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {}, blur() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {} });
const mkDoc = () => ({ addEventListener() {}, removeEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };
const loader = new Function('document', 'window', 'localStorage', 'navigator', 'console', APP_JS + '\n;return {QUESTIONS, LESSONS};');
const { QUESTIONS, LESSONS } = loader(mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } }, store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} });

const mode = process.argv[2] || 'list';
const FIELDS = ['incident', 'askFirst', 'predict', 'naive', 'naiveCode', 'rootCause', 'tradeoff', 'alternatives', 'observe', 'attacks', 'say30', 'say90', 'anchor'];

if (mode === 'list') {
  for (const q of QUESTIONS) {
    const have = FIELDS.filter((f) => q[f] != null && (typeof q[f] === 'string' ? q[f] : true)).length;
    console.log(`${q.id}\t${q.prio}\t${q.level}\t${q.type}\t${have}/13\t${q.topic}`);
  }
} else if (mode === 'show') {
  const id = process.argv[3];
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) { console.log('not found'); process.exit(1); }
  console.log(JSON.stringify(q, null, 2));
} else if (mode === 'gaps') {
  for (const q of QUESTIONS) {
    const miss = FIELDS.filter((f) => q[f] == null || (typeof q[f] === 'string' && !q[f].length) || (Array.isArray(q[f]) && !q[f].length));
    console.log(`${q.id}\t${q.prio}\tmissing: ${miss.join(',')}`);
  }
} else if (mode === 'lessons') {
  for (const l of LESSONS) console.log(`${l.id}\t${l.stage}\t${l.title}\tqids=${(l.qids || []).join('/')}`);
}
