// tools/dump-depth.mjs — print the fields that decide what a learner already reads
// for a set of question ids, stripped of HTML, so authored additions complement
// instead of restating. Usage: node tools/dump-depth.mjs A01 A02 ...
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const src = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).sort();
const APP_JS = src.map((f) => readFileSync(join(root, 'src', f), 'utf8')).join('\n');
const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, appendChild() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({}) });
const mkDoc = () => ({ addEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: mkEl, body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };
const { QUESTIONS, LESSONS } = new Function('document', 'window', 'localStorage', 'navigator', 'console', '__BUILD_CHECK__',
  APP_JS + ';return {QUESTIONS, LESSONS};')(
  mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } },
  store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} }, true);

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const only = process.argv.slice(2);
const want = (id) => !only.length || only.includes(id);

for (const q of QUESTIONS) {
  if (!want(q.id)) continue;
  console.log('\n' + '='.repeat(70));
  console.log(`${q.id} [${q.group}/${q.prio}/${q.level}/${q.type}] ${q.topic}`);
  console.log('Q: ' + strip(q.q));
  console.log('ORAL: ' + strip(q.oral));
  console.log('DEEP: ' + strip(q.deep));
  if (q.expected) console.log('EXPECTED: ' + strip(q.expected));
  console.log('ATTACKS: ' + (q.attacks || []).map((a) => strip(a.q)).join(' || '));
  console.log('FOLLOWUPS: ' + (q.followups || []).map((f) => strip(f.q)).join(' || '));
}
for (const l of LESSONS) {
  if (!want(l.id)) continue;
  console.log('\n' + '='.repeat(70));
  console.log(`${l.id} LESSON ${l.title}`);
  console.log('INCIDENT: ' + strip(l.incident));
  console.log('TRADEOFF: ' + strip(l.tradeoff));
  console.log('ALTERNATIVES: ' + strip(l.alternatives));
  console.log('OBSERVE: ' + strip(l.observe));
  console.log('SAY30: ' + strip(l.say30));
  console.log('SAY90: ' + strip(l.say90));
  console.log('PREDICT q: ' + strip((l.predict || {}).q) + '  ||  a: ' + strip((l.predict || {}).a));
}
