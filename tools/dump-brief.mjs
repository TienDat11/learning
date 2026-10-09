// tools/dump-brief.mjs — compact, truncated digest of a set of question ids.
// Reads dist/app.js so it sees the merged depth layer exactly as the learner does.
// Usage: node tools/dump-brief.mjs C01 C02 ...
import { readFileSync } from 'node:fs';

const S = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, appendChild() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({}) });
const mkDoc = () => ({ addEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: mkEl, body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };
const { QUESTIONS } = new Function('document', 'window', 'localStorage', 'navigator', 'console', '__BUILD_CHECK__',
  S + ';return {QUESTIONS};')(
  mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } },
  store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} }, true);

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const SEP = ' || ';

for (const id of process.argv.slice(2)) {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) { console.log('\nMISSING ' + id); continue; }
  console.log('\n==== ' + q.id + ' [' + q.group + '/' + q.prio + '/' + q.level + '/' + q.type + '] ' + q.topic);
  console.log('Q: ' + strip(q.q));
  console.log('ORAL: ' + strip(q.oral).slice(0, 400));
  console.log('DEEP: ' + strip(q.deep).slice(0, 1500));
  if (q.expected) console.log('EXPECTED: ' + strip(q.expected).slice(0, 480));
  if (q.attacks) console.log('ATTACKS: ' + q.attacks.map((a) => strip(a.q)).join(SEP));
}
