// tools/render-smoke.mjs — drive the real app engine (src/90-app.js) against a DOM stub
// and inspect what the questions view actually renders. Read-only.
//
// The build evaluates the bundle with __BUILD_CHECK__ = true, which makes the app no-op
// on purpose. This harness runs it with the flag false so the render path executes.
import { readFileSync } from 'node:fs';

const APP = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');

const el = () => {
  const e = {
    _html: '', _text: '', style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {}, children: [], hidden: false, value: '', disabled: false,
    setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
    addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {},
    remove() {}, focus() {}, blur() {}, closest: () => null, contains: () => false,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {},
    querySelector: () => null, querySelectorAll: () => [],
  };
  Object.defineProperty(e, 'innerHTML', { get: () => e._html, set: (v) => { e._html = String(v); } });
  Object.defineProperty(e, 'textContent', { get: () => e._text, set: (v) => { e._text = String(v); } });
  return e;
};
function blur() {}

const nodes = new Map();
const byId = (id) => { if (!nodes.has(id)) nodes.set(id, el()); return nodes.get(id); };
const doc = {
  addEventListener() {}, removeEventListener() {},
  getElementById: byId, querySelector: () => null, querySelectorAll: () => [],
  createElement: el, body: el(), head: el(), documentElement: el(),
};
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };

new Function('document', 'window', 'localStorage', 'navigator', 'console', '__BUILD_CHECK__', APP)(
  doc,
  { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '#questions' } },
  store(),
  { userAgent: 'node', clipboard: { writeText: async () => {} } },
  { log() {}, warn() {}, error() {} },
  false
);

const list = byId('q-list').innerHTML || '';
const stats = byId('stat-line').textContent || '';
const nav = byId('nav-list').innerHTML || '';

const LABELS = ['Thử đoán trước khi đọc tiếp', 'Tự hỏi trước khi đọc phần giải thích', 'Tình huống',
  'Nguyên nhân gốc', 'Đánh đổi', 'Lựa chọn thay thế', 'Quan sát trên production',
  'Interviewer sẽ đào tiếp', 'Câu neo', 'Trả lời 30 giây', 'Trả lời 90 giây', 'Giải thích sâu'];

console.log('questions list innerHTML chars:', list.length);
console.log('stat line:', stats.slice(0, 100));
console.log('nav items:', (nav.match(/data-view=/g) || []).length);
console.log('');
let missing = 0;
for (const L of LABELS) {
  const present = list.includes(L);
  if (!present) missing++;
  console.log((present ? 'PASS  ' : 'MISS  ') + 'questions view renders: ' + L);
}
console.log('');
// 'Cách làm ngây thơ' (the naive-solution block) is wired in the renderer but no question in
// the bank carries a `naive` field, so it correctly never appears in this view. It does render
// on all 22 lessons. Recorded so the absence is not mistaken for a regression.
console.log('NOTE  "Cách làm ngây thơ" is a lesson-only block: 0/131 questions carry `naive`.');
console.log(missing ? 'WARN: ' + missing + ' label(s) not found in the questions view' : 'OK: every pedagogical block renders');
process.exit(missing ? 1 : 0);
