// tools/render-smoke.mjs — drive the real app engine (src/90-app.js) against a DOM stub
// and inspect what the questions and learn views actually render. Read-only.
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

const nodes = new Map();
const byId = (id) => { if (!nodes.has(id)) nodes.set(id, el()); return nodes.get(id); };
const doc = {
  addEventListener() {}, removeEventListener() {},
  getElementById: byId, querySelector: () => null, querySelectorAll: () => [],
  createElement: el, body: el(), head: el(), documentElement: el(),
};
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };

// The bundle is evaluated with a trailing return so the harness can compare what was
// rendered against the data that produced it (not against a second, hand-kept copy).
const engine = new Function('document', 'window', 'localStorage', 'navigator', 'console', '__BUILD_CHECK__',
  APP + `
;return {LESSONS: (typeof LESSONS === "undefined" ? undefined : LESSONS)};`)(
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
const learn = byId('learn-body').innerHTML || '';
const LESSONS = Array.isArray(engine && engine.LESSONS) ? engine.LESSONS : [];

const failures = [];
const fail = (msg) => { failures.push(msg); console.log('FAIL  ' + msg); };
const pass = (msg) => console.log('PASS  ' + msg);

// ---- questions view (unchanged contract) -------------------------------
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
console.log('NOTE  "Cách làm ngây thơ" is a lesson-only block: 0/131 questions carry `naive`.');
console.log(missing ? 'WARN: ' + missing + ' label(s) not found in the questions view' : 'OK: every pedagogical block renders');
console.log('');

// ---- learn view: 25 articles, one per lesson ---------------------------
const articles = Array.from(learn.matchAll(/<article class="lesson"[\s\S]*?<\/article>/g)).map((m) => m[0]);
console.log('learn innerHTML chars:', learn.length);
console.log('learn articles:', articles.length, '(want 25)');
if (articles.length !== 25) fail('learn view renders ' + articles.length + ' articles, want 25');

const byLesson = new Map();
for (const html of articles) {
  const id = (html.match(/data-lesson="(L\d+)"/) || [])[1];
  if (id) byLesson.set(id, html);
}

// All 25 lessons are migrated to visuals; every article must satisfy the same contract.
const migrated = LESSONS.filter((l) => l && l.id);

// ---- forbidden leading strings -----------------------------------------
{
  const forbidden = ['Xem bài này', 'Thuật nguyên cần biết'];
  const bad = [];
  for (const l of LESSONS) {
    const html = byLesson.get(l.id);
    if (html && forbidden.some((f) => html.includes(f))) bad.push(l.id);
  }
  if (bad.length) fail('forbidden leading string present on: ' + bad.join(', '));
  else pass('no "Xem bài này" / "Thuật nguyên cần biết" in any article');
}

// Every required block has exactly one canonical wording.
const REQUIRED_LABELS = [
  'Dự đoán trước khi đọc',
  'Sự cố',
  'Cách làm ngây thơ',
  'Bây giờ mới gọi tên khái niệm',
  'Cơ chế bên trong',
  'Interviewer sẽ đào tiếp',
  'Câu neo',
];
const SPOKEN_LABELS = ['Trả lời 30 giây', 'Trả lời 90 giây'];

for (const label of REQUIRED_LABELS) {
  const bad = migrated.filter((l) => !(byLesson.get(l.id) || '').includes(label)).map((l) => l.id);
  if (bad.length) fail('learn label "' + label + '" missing on ' + bad.join(', '));
  else pass('learn label "' + label + '" on all ' + migrated.length + ' lessons');
}

{
  const bad = migrated
    .filter((l) => {
      const html = byLesson.get(l.id) || '';
      return !SPOKEN_LABELS.every((s) => html.includes(s));
    })
    .map((l) => l.id);
  if (bad.length) fail('learn label "30/90 giây" missing on ' + bad.join(', '));
  else pass('learn label "30/90 giây" on all ' + migrated.length + ' lessons');
}

{
  // A glossary table is not the incident timeline table; require an explicit
  // glossary marker so a timeline table cannot satisfy the check.
  const isGlossary = (html) =>
    /<table[^>]*class="[^"]*gloss/i.test(html) ||
    /(Thuật ngữ|Glossary|Từ khoá)[\s\S]{0,240}?<table/i.test(html);
  const bad = LESSONS.filter((l) => l && l.id && !isGlossary(byLesson.get(l.id) || ''));
  if (bad.length) fail('glossary <table> missing on ' + bad.map((l) => l.id).join(', '));
  else pass('glossary <table> on all ' + migrated.length + ' lessons');
}

// ---- figures match visuals --------------------------------------------
{
  const bad = [];
  for (const l of LESSONS) {
    const html = byLesson.get(l.id) || '';
    const want = Array.isArray(l.visuals) ? l.visuals.length : 0;
    const got = (html.match(/<figure[\s>]/g) || []).length;
    if (got !== want) bad.push(l.id + ':' + got + '/' + want);
  }
  if (bad.length) fail('figure count != visuals.length: ' + bad.join(', '));
  else pass('figure count matches visuals.length on every lesson');
}

// ---- retired DOM hooks -------------------------------------------------
for (const hook of ['lesson-fig', 'lesson-spine']) {
  if (learn.includes(hook)) fail('retired hook still rendered: .' + hook);
  else pass('retired hook absent: .' + hook);
}

// ---- predict answer is hidden before the first click -------------------
{
  const target = LESSONS.find((l) => l && l.predict && typeof l.predict.a === 'string' && l.predict.a.trim());
  const html = target ? (byLesson.get(target.id) || '') : '';
  const plain = target
    ? String(target.predict.a).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';
  const snippet = plain.slice(0, 40);
  if (!target || !snippet) {
    fail('no lesson carries predict.a to test');
  } else {
    const idx = html.indexOf(snippet);
    if (idx < 0) {
      fail('predict.a text not found in ' + target.id + ' article (cannot verify hidden state)');
    } else {
      const before = html.slice(Math.max(0, idx - 800), idx);
      const tagRe = /<(div|details|p|section)[^>]*(?:predict|ans)[^>]*>/gi;
      let tag = null;
      let m;
      while ((m = tagRe.exec(before))) tag = m[0];
      const hidden = !!tag && (
        /\bhidden\b/.test(tag) ||
        /aria-hidden="true"/.test(tag) ||
        /display:\s*none/.test(tag) ||
        (/^<details/i.test(tag) && !/\bopen\b/.test(tag))
      );
      const occurrences = html.split(snippet).length - 1;
      if (!hidden) fail('predict.a container is not hidden in ' + target.id + ': ' + (tag || 'no container'));
      else if (occurrences !== 1) fail('predict.a text leaks outside the hidden container in ' + target.id + ' (' + occurrences + ' occurrences)');
      else pass('predict.a hidden before click in ' + target.id + ' (container: ' + tag.trim() + ')');
    }
  }
}

console.log('');
console.log(failures.length ? 'WARN: ' + failures.length + ' learn-view check(s) failed' : 'OK: learn view matches the new schema');
process.exit(failures.length ? 1 : 0);
