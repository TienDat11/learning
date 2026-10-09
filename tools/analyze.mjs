// tools/analyze.mjs — measure the pedagogical/product gaps in the built bundle.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const files = readFileSync(join(root, 'build.mjs'), 'utf8');
// reuse the harness's own sandbox by shelling out is overkill; just eval the bundle
const { readdirSync } = await import('node:fs');
const src = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).sort();
const APP_JS = src.map((f) => `\n/* ==== src/${f} ==== */\n${readFileSync(join(root, 'src', f), 'utf8')}`).join('\n');

const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], hidden: false, value: '', textContent: '', innerHTML: '', setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {}, blur() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {} });
const mkDoc = () => ({ addEventListener() {}, removeEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };

const loader = new Function('document', 'window', 'localStorage', 'navigator', 'console',
  APP_JS + '\n;return {QUESTIONS, QUIZ, MOCK_SETS, LESSONS, CASE_STUDY, SOURCES, FLOW_SVGS, LOGIC};');
const D = loader(mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } }, store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} });

const { QUESTIONS, QUIZ, LESSONS } = D;
const FIELDS = ['incident', 'askFirst', 'predict', 'naiveCode', 'rootCause', 'tradeoff', 'alternatives', 'observe', 'say30', 'say90', 'anchor', 'attacks'];
const has = (q, f) => q[f] != null && (typeof q[f] === 'string' ? q[f].length > 0 : Array.isArray(q[f]) ? q[f].length > 0 : true);

console.log('=== QUESTIONS: field coverage by prio ===');
const prios = ['P0', 'P1', 'P2'];
console.log('field'.padEnd(14) + prios.map((p) => p.padStart(18)).join('') + '   total');
for (const f of FIELDS) {
  const row = prios.map((p) => {
    const set = QUESTIONS.filter((q) => q.prio === p);
    const n = set.filter((q) => has(q, f)).length;
    return `${n}/${set.length}`.padStart(18);
  });
  const tot = QUESTIONS.filter((q) => has(q, f)).length;
  console.log(f.padEnd(14) + row.join('') + `   ${tot}/${QUESTIONS.length}`);
}

console.log('\n=== which prios lack the full causal block ===');
const CORE = ['incident', 'askFirst', 'predict', 'anchor'];
const full = QUESTIONS.filter((q) => CORE.every((f) => has(q, f)));
console.log(`full causal block: ${full.length}/${QUESTIONS.length}`);
const byPrio = {};
for (const q of QUESTIONS) {
  const k = `${q.prio}/${CORE.every((f) => has(q, f)) ? 'full' : 'partial'}`;
  byPrio[k] = (byPrio[k] || 0) + 1;
}
console.log(byPrio);
console.log('missing lists:');
for (const f of CORE) {
  const miss = QUESTIONS.filter((q) => !has(q, f)).map((q) => q.id);
  console.log(`  ${f}: ${miss.length} -> ${miss.slice(0, 80).join(',')}`);
}

console.log('\n=== QUIZ gameability ===');
console.log('total quiz:', QUIZ.length);
const idx0 = QUIZ.filter((q) => q.answer === 0).length;
console.log('answer at index 0:', idx0);
const longest = QUIZ.filter((q) => {
  const L = q.options.map((o) => o.length);
  return L.indexOf(Math.max(...L)) === q.answer;
}).length;
console.log('correct option is the longest:', longest);
console.log('answers distribution:', QUIZ.reduce((a, q) => (a[q.answer] = (a[q.answer] || 0) + 1, a), {}));

console.log('\n=== selfcheck first-item shape ===');
const selfFirst = QUESTIONS.map((q) => (q.selfcheck || [])[0] || '');
const selfReport = selfFirst.filter((s) => /^(Tôi |Mình |Bạn )?(vẫn )?(chưa )?(hiểu|nắm|giải thích|tự tin|thấy)/i.test(s)).length;
console.log(`self-report-shaped first item: ${selfReport}/${QUESTIONS.length}`);
console.log('samples:', selfFirst.slice(0, 4));

console.log('\n=== LESSONS ===');
console.log('lessons:', LESSONS.length);
for (const f of ['incident', 'attacks', 'predict', 'say30', 'say90', 'anchor', 'timeline', 'bridge', 'spine']) {
  console.log(`  ${f}: ${LESSONS.filter((l) => has(l, f)).length}/${LESSONS.length}`);
}
const ids = LESSONS.map((l) => l.id);
console.log('ids:', ids.join(','));
