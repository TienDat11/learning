// build.mjs — concatenate src/*.js, syntax-check, validate, emit the single-file HTML.
// Deterministic: no network, no clock reads. Exit 0 = valid, 2 = harness broken, 1 = content invalid.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const SRC = join(root, 'src');
const DIST = join(root, 'dist');
const OUT = join(root, 'hitechcloud-interview-prep.html');

if (!existsSync(SRC)) {
  console.error('FATAL: missing src/ directory');
  process.exit(2);
}
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
if (!files.length) {
  console.error('FATAL: no src/*.js files');
  process.exit(2);
}
for (const required of ['assets/style.css', 'assets/body.html']) {
  if (!existsSync(join(root, required))) {
    console.error(`FATAL: missing ${required}`);
    process.exit(2);
  }
}

const parts = files.map((f) => ({ f, code: readFileSync(join(SRC, f), 'utf8') }));
const APP_JS = parts.map((p) => `\n/* ==== src/${p.f} ==== */\n${p.code}`).join('\n');

// ---- 1. syntax check of the whole bundle -------------------------------
try {
  new Function(APP_JS);
} catch (e) {
  console.error('FATAL: syntax error in bundle: ' + e.message);
  process.exit(2);
}

// ---- 2. evaluate the bundle in a sandbox, pull the exports -------------
const mkEl = () => {
  const el = {
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {},
    children: [],
    hidden: false,
    value: '',
    textContent: '',
    innerHTML: '',
    setAttribute() {},
    removeAttribute() {},
    getAttribute: () => null,
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    removeChild() {},
    remove() {},
    focus() {},
    blur() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    contains: () => false,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    scrollIntoView() {},
  };
  return el;
};
const mkDoc = () => ({
  addEventListener() {},
  removeEventListener() {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => mkEl(),
  body: mkEl(),
  head: mkEl(),
  documentElement: mkEl(),
});
const store = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  };
};

const EXPORTS = ['QUESTIONS', 'QUIZ', 'MOCK_SETS', 'STUDY_PLANS', 'CASE_STUDY', 'SOURCES',
  'GROUP_INTROS', 'SOURCE_CHECKED', 'FLOW_SVGS', 'LOGIC', 'LESSONS'];
let data;
try {
  const loader = new Function(
    'document', 'window', 'localStorage', 'navigator', 'console', '__BUILD_CHECK__',
    APP_JS + `\n;return {${EXPORTS.map((n) => `${n}: (typeof ${n} === "undefined" ? undefined : ${n})`).join(',')}};`
  );
  data = loader(
    mkDoc(),
    { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } },
    store(),
    { userAgent: 'node', clipboard: { writeText: async () => {} } },
    { log() {}, warn() {}, error() {} },
    true
  );
} catch (e) {
  console.error('FATAL: bundle failed to evaluate: ' + e.message);
  process.exit(2);
}

const { QUESTIONS, QUIZ, MOCK_SETS, STUDY_PLANS, CASE_STUDY, SOURCES, GROUP_INTROS,
  SOURCE_CHECKED, FLOW_SVGS, LOGIC, LESSONS } = data;

// ---- 3. content validation ---------------------------------------------
const errors = [];
const err = (m) => { if (errors.length < 300) errors.push(m); };
const t = (s) => typeof s === 'string' && s.trim().length > 0;
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const PRIOS = ['P0', 'P1', 'P2'];
const LEVELS = ['L1', 'L2', 'L3'];
const TYPES = ['concept', 'predict', 'debug', 'situation', 'code'];
const GROUPS_ALLOWED = { A: 'ABCDEF', B: 'ABCDEF', C: 'ABCDEF', D: 'ABCDEF', E: 'ABCDEF', F: 'ABCDEF', G: 'DEFG', H: 'DEFGH', I: 'DEFGHI', J: 'DEFGHIJ' };

if (!Array.isArray(QUESTIONS)) err('QUESTIONS is not an array');
if (!Array.isArray(QUIZ)) err('QUIZ is not an array');
if (!LOGIC) err('LOGIC export missing (src/05-logic.js)');

const seen = new Set();
const byId = new Map();
for (const q of QUESTIONS || []) {
  if (!q || typeof q !== 'object') { err('non-object question entry'); continue; }
  if (!t(q.id)) { err('question with no id'); continue; }
  if (seen.has(q.id)) err(`duplicate id ${q.id}`);
  seen.add(q.id);
  byId.set(q.id, q);
  if (!GROUPS.includes(q.group)) err(`${q.id}: bad group "${q.group}"`);
  if (!PRIOS.includes(q.prio)) err(`${q.id}: bad prio "${q.prio}"`);
  if (!LEVELS.includes(q.level)) err(`${q.id}: bad level "${q.level}"`);
  if (!TYPES.includes(q.type)) err(`${q.id}: bad type "${q.type}"`);
  if (!t(q.topic)) err(`${q.id}: missing topic`);
  if (!t(q.q) || q.q.length < 12) err(`${q.id}: question missing or <12 chars`);
  if (!t(q.oral) || q.oral.length < 60) err(`${q.id}: oral missing or <60 chars (${(q.oral || '').length})`);
  if (!t(q.deep) || q.deep.length < 220) err(`${q.id}: deep missing or <220 chars (${(q.deep || '').length})`);
  if (t(q.deep) && /<script/i.test(q.deep)) err(`${q.id}: deep contains <script`);
  if (t(q.deep) && /<img|onerror=|onload=/i.test(q.deep)) err(`${q.id}: deep contains img/event-handler`);
  if (!Array.isArray(q.followups) || q.followups.length < 2) err(`${q.id}: needs >=2 followups`);
  else q.followups.forEach((f, i) => {
    if (!f || !t(f.q)) err(`${q.id}: followup[${i}] missing question`);
    else if (!t(f.a) || f.a.length < 40) err(`${q.id}: followup[${i}] answer missing or <40 chars`);
  });
  if (q.prio === 'P0' && Array.isArray(q.followups) && q.followups.length < 3) err(`${q.id}: P0 needs 3 followups (deep 3-tier chain)`);
  if (!Array.isArray(q.pitfalls) || q.pitfalls.length < 2) err(`${q.id}: needs >=2 pitfalls`);
  else if (q.pitfalls.some((p) => !t(p))) err(`${q.id}: empty pitfall`);
  if (!Array.isArray(q.selfcheck) || q.selfcheck.length !== 3) err(`${q.id}: selfcheck must have exactly 3 entries`);
  else if (q.selfcheck.some((p) => !t(p))) err(`${q.id}: empty selfcheck entry`);
  if ((q.type === 'predict' || q.type === 'debug') && (!t(q.expected) || q.expected.length < 20)) {
    err(`${q.id}: type=${q.type} requires 'expected' outcome text`);
  }
  if (q.code != null && typeof q.code !== 'string') err(`${q.id}: code must be a string or null`);
  if (q.code && /&(lt|gt|amp|quot|#39);/i.test(q.code)) err(`${q.id}: code must be raw text, not HTML-escaped (found entity)`);
  if (q.refs != null && !Array.isArray(q.refs)) err(`${q.id}: refs must be an array`);
}

for (const q of QUIZ || []) {
  if (!q || !t(q.id)) { err('quiz: entry missing id'); continue; }
  if (seen.has(q.id)) err(`quiz id collides with question id: ${q.id}`);
  if (seen.has(q.id)) { /* already reported */ }
  if (!t(q.q)) err(`${q.id}: quiz missing question text`);
  if (!Array.isArray(q.options) || q.options.length < 3) err(`${q.id}: needs >=3 options`);
  else if (q.options.some((o) => !t(o))) err(`${q.id}: empty option`);
  if (typeof q.answer !== 'number' || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) {
    err(`${q.id}: answer index out of range`);
  }
  if (!t(q.explain) || q.explain.length < 60) err(`${q.id}: explanation missing or <60 chars`);
  if (!GROUPS.includes(q.group)) err(`${q.id}: bad group "${q.group}"`);
  if (q.situational !== undefined && typeof q.situational !== 'boolean') err(`${q.id}: situational must be boolean`);
}

const resolveSet = (label, spec) => {
  if (!Array.isArray(spec) || !spec.length) { err(`${label}: needs at least one pick spec`); return []; }
  const out = [];
  for (const s of spec) {
    if (!s || typeof s !== 'object') { err(`${label}: pick entry not an object`); continue; }
    if (s.group && !GROUPS.includes(s.group)) err(`${label}: pick bad group "${s.group}"`);
    if (s.prio && !PRIOS.includes(s.prio)) err(`${label}: pick bad prio "${s.prio}"`);
    if (s.level && !LEVELS.includes(s.level)) err(`${label}: pick bad level "${s.level}"`);
    if (s.type && !TYPES.includes(s.type)) err(`${label}: pick bad type "${s.type}"`);
    const matched = (QUESTIONS || []).filter((q) =>
      (!s.group || q.group === s.group) && (!s.prio || q.prio === s.prio) &&
      (!s.level || q.level === s.level) && (!s.type || q.type === s.type));
    if (!matched.length) err(`${label}: pick matched 0 questions ${JSON.stringify(s)}`);
    const lim = typeof s.limit === 'number' ? s.limit : matched.length;
    for (const q of matched.slice(0, lim)) if (!out.includes(q.id)) out.push(q.id);
  }
  return out;
};

if (!MOCK_SETS || typeof MOCK_SETS !== 'object') err('MOCK_SETS missing');
else for (const [k, set] of Object.entries(MOCK_SETS)) {
  if (!t(set.label)) err(`mock set ${k}: missing label`);
  if (!t(set.brief)) err(`mock set ${k}: missing brief`);
  const ids = resolveSet(`mock set ${k}`, set.pick);
  if (ids.length < 5) err(`mock set ${k}: resolves to ${ids.length} questions, need >=5`);
}

if (!STUDY_PLANS || typeof STUDY_PLANS !== 'object') err('STUDY_PLANS missing');
else for (const [k, plan] of Object.entries(STUDY_PLANS)) {
  if (!t(plan.label)) err(`plan ${k}: missing label`);
  if (!Array.isArray(plan.blocks) || plan.blocks.length < 3) err(`plan ${k}: needs >=3 blocks`);
  else plan.blocks.forEach((b, i) => {
    if (!t(b.what)) err(`plan ${k} block ${i}: missing 'what'`);
    if (!t(b.how)) err(`plan ${k} block ${i}: missing 'how'`);
    const ids = resolveSet(`plan ${k} block ${i}`, b.pick);
    if (!ids.length) err(`plan ${k} block ${i}: resolves to no questions`);
  });
}

if (!CASE_STUDY || !Array.isArray(CASE_STUDY.sections)) err('CASE_STUDY.sections missing');
else {
  if (!t(CASE_STUDY.title)) err('CASE_STUDY.title missing');
  if (!t(CASE_STUDY.pitch) || CASE_STUDY.pitch.length < 120) err('CASE_STUDY.pitch missing or too short');
  if (CASE_STUDY.sections.length < 12) err(`CASE_STUDY.sections length ${CASE_STUDY.sections.length} < 12`);
  const secIds = new Set();
  for (const s of CASE_STUDY.sections) {
    if (!t(s.id)) err('case section missing id');
    if (secIds.has(s.id)) err(`case duplicate section id ${s.id}`);
    secIds.add(s.id);
    if (!t(s.h)) err(`case section ${s.id}: missing heading`);
    if (!t(s.body) || s.body.length < 200) err(`case section ${s.id}: body missing or <200 chars`);
    if (s.flow && !FLOW_SVGS.some((f) => f.id === s.flow)) err(`case section ${s.id}: unknown flow "${s.flow}"`);
  }
}

if (!GROUP_INTROS || typeof GROUP_INTROS !== 'object') err('GROUP_INTROS missing');
else for (const g of GROUPS) {
  const gi = GROUP_INTROS[g];
  if (!gi) { err(`GROUP_INTROS.${g} missing`); continue; }
  if (!t(gi.title)) err(`GROUP_INTROS.${g}.title missing`);
  if (!t(gi.why) || gi.why.length < 80) err(`GROUP_INTROS.${g}.why missing or <80 chars`);
  if (!Array.isArray(gi.p0) || !gi.p0.length) err(`GROUP_INTROS.${g}.p0 missing`);
}

if (!Array.isArray(SOURCES) || SOURCES.length < 20) err(`SOURCES length ${(SOURCES || []).length} < 20`);
const srcKeys = new Set();
for (const s of SOURCES || []) {
  if (!t(s.key)) err(`source missing key: ${s.name}`);
  else if (srcKeys.has(s.key)) err(`duplicate source key ${s.key}`);
  else srcKeys.add(s.key);
  if (!t(s.name)) err(`source ${s.key}: missing name`);
  if (!/^https:\/\//.test(s.url || '')) err(`source ${s.key}: url must be https`);
  if (!t(s.checked)) err(`source ${s.key}: missing checked date`);
  if (!GROUPS.includes(s.group) && s.group !== '*') err(`source ${s.key}: bad group "${s.group}"`);
}
for (const q of QUESTIONS || []) {
  for (const r of q.refs || []) if (!srcKeys.has(r)) err(`${q.id}: unknown source ref "${r}"`);
}

if (!Array.isArray(FLOW_SVGS) || FLOW_SVGS.length < 10) err(`FLOW_SVGS length ${(FLOW_SVGS || []).length} < 10`);
for (const f of FLOW_SVGS || []) {
  if (!t(f.id)) err('flow missing id');
  if (!/<svg[\s>]/.test(f.svg || '')) err(`flow ${f.id}: not an inline <svg>`);
  if (!/viewBox=/.test(f.svg || '')) err(`flow ${f.id}: svg missing viewBox`);
  if (/<script/i.test(f.svg || '')) err(`flow ${f.id}: svg contains <script`);
  if (/\son[a-z]+\s*=/i.test(f.svg || '')) err(`flow ${f.id}: svg contains inline event handler`);
  if (!/role="img"/.test(f.svg || '')) err(`flow ${f.id}: svg missing role="img"`);
  if (!t(f.caption) || f.caption.length < 30) err(`flow ${f.id}: caption missing or <30 chars`);
}

const LESSON_ARR = LESSONS || [];
const LESSON_POS = new Map(LESSON_ARR.map((l, i) => [l && l.id, i]));
const LESSON_BY_ID = new Map(LESSON_ARR.filter((l) => l && l.id).map((l) => [l.id, l]));
const SPINE_NODES = ['client', 'gateway', 'compute', 'data', 'queue', 'all'];
const LESSON_IDS = new Set();
for (const [li, l] of LESSON_ARR.entries()) {
  if (!t(l.id)) { err('lesson missing id'); continue; }
  if (LESSON_IDS.has(l.id)) err(`duplicate lesson id ${l.id}`);
  LESSON_IDS.add(l.id);
  if (!t(l.title)) err(`${l.id}: missing title`);
  if (!t(l.goal)) err(`${l.id}: missing goal`);
  if (!t(l.body) || l.body.length < 600) err(`${l.id}: body missing or <600 chars (${(l.body||'').length})`);
  if (t(l.body) && /<script|<img|onerror=|onload=/i.test(l.body)) err(`${l.id}: body contains script/img/event-handler`);
  if (!Number.isInteger(l.stage) || l.stage < 1) err(`${l.id}: bad stage`);
  if (!Array.isArray(l.sayIt) || l.sayIt.length < 3) err(`${l.id}: needs >=3 sayIt lines`);
  if (!Array.isArray(l.qids) || !l.qids.length) err(`${l.id}: needs qids`);
  else for (const q of l.qids) if (!byId.has(q)) err(`${l.id}: unknown question id "${q}"`);
  if (!Array.isArray(l.refs) || !l.refs.length) err(`${l.id}: needs refs`);
  else for (const r of l.refs) if (!srcKeys.has(r)) err(`${l.id}: unknown source ref "${r}"`);
  if (l.flow && !FLOW_SVGS.some((f) => f.id === l.flow)) err(`${l.id}: unknown flow "${l.flow}"`);
  if (typeof l.bridge !== 'string' || l.bridge.length < 120) err(`${l.id}: bridge missing or <120 chars (${typeof l.bridge === 'string' ? l.bridge.length : 0})`);
  else if (/[<>]/.test(l.bridge)) err(`${l.id}: bridge must be plain text (no < or >)`);
  if (!Array.isArray(l.buildsOn)) err(`${l.id}: buildsOn must be an array`);
  else {
    for (const dep of l.buildsOn) {
      if (typeof dep !== 'string' || !/^L\d{2}$/.test(dep)) err(`${l.id}: bad buildsOn entry "${dep}"`);
      else if (!LESSON_POS.has(dep)) err(`${l.id}: unknown buildsOn lesson "${dep}"`);
      else if (dep === l.id) err(`${l.id}: buildsOn must not contain itself`);
      else if (!(LESSON_POS.get(dep) < li)) err(`${l.id}: buildsOn ${dep} is not an earlier lesson`);
    }
    if (li !== 0 && l.buildsOn.length < 1) err(`${l.id}: buildsOn empty (must link to at least one earlier lesson)`);
  }
  if (typeof l.spine !== 'string' || l.spine.length < 60) err(`${l.id}: spine missing or <60 chars (${typeof l.spine === 'string' ? l.spine.length : 0})`);
  else if (/[<>'"]/.test(l.spine)) err(`${l.id}: spine must be plain text`);
  if (!SPINE_NODES.includes(l.spineNode)) err(`${l.id}: bad spineNode "${l.spineNode}"`);
  else if (li === 0 && l.spineNode !== 'all') err(`${l.id}: first lesson spineNode must be "all"`);
  else if (li !== 0 && l.spineNode === 'all') err(`${l.id}: only the first lesson may use spineNode "all"`);
}

// L01 reachability: every lesson must hang off the backbone ("tới bài 10 vẫn thuộc bài 1").
for (const l of LESSON_ARR) {
  if (!l || !l.id) continue;
  const seen = new Set([l.id]);
  const queue = [l.id];
  let reached = l.id === 'L01';
  while (!reached && queue.length) {
    const cur = queue.shift();
    const node = LESSON_BY_ID.get(cur);
    for (const dep of (node && Array.isArray(node.buildsOn) ? node.buildsOn : [])) {
      if (typeof dep !== 'string' || seen.has(dep)) continue;
      if (dep === 'L01') { reached = true; break; }
      seen.add(dep);
      queue.push(dep);
    }
  }
  if (!reached) err(`${l.id}: buildsOn chain does not reach L01`);
}

// ---- 4. self-containment ------------------------------------------------
const URL_RE = /https?:\/\/(?!www\.w3\.org)[^\s"'<>)]+/g;
const FORBIDDEN = [
  [/<script\s+src=/i, 'external <script src>'],
  [/<link\b[^>]*rel=["']?stylesheet/i, 'external stylesheet'],
  [/@import\s+url/i, 'CSS @import'],
  [/\bfetch\s*\(/, 'fetch()'],
  [/XMLHttpRequest/, 'XMLHttpRequest'],
  [/\brequire\s*\(/, 'require()'],
  [/new\s+WebSocket/, 'WebSocket'],
  [/\bnavigator\.sendBeacon/, 'sendBeacon'],
];
for (const p of parts) {
  for (const [re, label] of FORBIDDEN) {
    const m = p.code.match(re);
    if (m) err(`${p.f}: self-containment violation — ${label} (${String(m[0]).slice(0, 60)})`);
  }
  if (p.f === '00-meta.js') continue; // SOURCES legitimately carries documentation URLs
  const m = p.code.match(URL_RE);
  if (m) err(`${p.f}: external URL literal ${String(m[0]).slice(0, 70)}`);
}

const REQUIRED_UI_IDS = [
  'search', 'f-prio', 'f-level', 'f-group', 'f-status', 'weak-only', 'theme-btn', 'reset-btn', 'print-btn',
  'stat-line', 'progress-bar', 'progress-text', 'q-list', 'q-empty', 'q-count',
  'view-questions', 'view-flashcard', 'view-quiz', 'view-mock', 'view-plan', 'view-case', 'view-sources', 'view-intro',
  'fc-front', 'fc-back', 'fc-reveal', 'fc-next', 'fc-prev', 'fc-know', 'fc-weak', 'fc-count', 'fc-progress',
  'quiz-list', 'quiz-submit', 'quiz-result', 'quiz-reset', 'quiz-count',
  'mock-topic', 'mock-minutes', 'mock-start', 'mock-panel', 'mock-timer', 'mock-next', 'mock-result', 'mock-question',
  'plan-body', 'case-body', 'sources-body', 'intro-body', 'nav-list', 'side-body', 'side-toggle',
];
const BODY = readFileSync(join(root, 'assets', 'body.html'), 'utf8');
const CSS = readFileSync(join(root, 'assets', 'style.css'), 'utf8');
const missingUi = REQUIRED_UI_IDS.filter((id) => !new RegExp(`id=["']${id}["']`).test(BODY));
if (missingUi.length) err(`body.html missing DOM ids: ${missingUi.join(', ')}`);
if (/<script/i.test(CSS)) err('style.css contains <script');
if (/<script\s+src=/i.test(BODY)) err('body.html contains external <script src>');
if (/<link\b/i.test(BODY)) err('body.html contains <link>');
if (!/data-view="questions"/.test(BODY)) err('body.html: missing nav button data-view="questions"');
for (const v of ['questions', 'flashcard', 'quiz', 'mock', 'plan', 'case', 'sources', 'intro']) {
  if (!new RegExp(`data-view="${v}"`).test(BODY)) err(`body.html: missing nav button for view ${v}`);
}

// ---- 5. render ----------------------------------------------------------
const escScript = (s) => s.replace(/<\/script/gi, '<\\/script');
const html = `<!DOCTYPE html>
<html lang="vi" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ôn phỏng vấn — Fullstack Engineer (AWS, Python, VueJS) — HiTechCloud</title>
<meta name="description" content="Tài liệu ôn phỏng vấn Fullstack Engineer (AWS, Python, VueJS): ${(QUESTIONS || []).length} câu hỏi có đáp án, quiz, flashcard, mock interview, case study. Một file HTML tự chứa, mở offline.">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231b5fb8'/%3E%3Cpath d='M8 21V11h3.4l4.6 6.2L20.6 11H24v10h-3.2v-4.6L17 21h-2l-3.8-4.6V21z' fill='%23fff'/%3E%3C/svg%3E">
<style>
${CSS}
</style>
</head>
<body>
${BODY}
<script>
${escScript(APP_JS)}
</script>
</body>
</html>
`;
mkdirSync(DIST, { recursive: true });
writeFileSync(OUT, html, 'utf8');
writeFileSync(join(DIST, 'app.js'), APP_JS, 'utf8');
writeFileSync(join(DIST, 'questions.json'), JSON.stringify(QUESTIONS || [], null, 0), 'utf8');

// ---- 6. metrics ---------------------------------------------------------
const count = (f) => (QUESTIONS || []).filter(f).length;
const FOUNDATION = ['A', 'B', 'C', 'D', 'E', 'F'];
const metrics = {
  questions: (QUESTIONS || []).length,
  unique_ids: seen.size,
  duplicate_ids: (QUESTIONS || []).length - seen.size,
  groups_covered: GROUPS.filter((g) => (QUESTIONS || []).some((q) => q.group === g)).length,
  foundation_share_pct: Number((100 * count((q) => FOUNDATION.includes(q.group)) / Math.max(1, (QUESTIONS || []).length)).toFixed(1)),
  p0: count((q) => q.prio === 'P0'),
  p1: count((q) => q.prio === 'P1'),
  p2: count((q) => q.prio === 'P2'),
  l1: count((q) => q.level === 'L1'),
  l2: count((q) => q.level === 'L2'),
  l3: count((q) => q.level === 'L3'),
  p0_chains_3tier: count((q) => q.prio === 'P0' && Array.isArray(q.followups) && q.followups.length >= 3),
  predict_debug: count((q) => q.type === 'predict' || q.type === 'debug'),
  code_examples: count((q) => typeof q.code === 'string' && q.code.length > 0),
  quiz: (QUIZ || []).length,
  quiz_situational: (QUIZ || []).filter((q) => q.situational).length,
  mock_sets: Object.keys(MOCK_SETS || {}).length,
  plans: Object.keys(STUDY_PLANS || {}).length,
  case_sections: ((CASE_STUDY || {}).sections || []).length,
  flow_svgs: (FLOW_SVGS || []).length,
  lessons: (LESSONS || []).length,
  lessons_with_bridge: (LESSONS || []).filter((l) => typeof l.bridge === 'string' && l.bridge.length > 0).length,
  lessons_linked: (LESSONS || []).filter((l) => Array.isArray(l.buildsOn) && l.buildsOn.length > 0).length,
  lessons_with_spine: (LESSONS || []).filter((l) => typeof l.spine === 'string' && l.spine.length > 0).length,
  lessons_reaching_L01: (() => {
    let n = 0;
    for (const l of LESSON_ARR) {
      if (!l || !l.id) continue;
      const seen = new Set([l.id]);
      const queue = [l.id];
      let reached = l.id === 'L01';
      while (!reached && queue.length) {
        const node = LESSON_BY_ID.get(queue.shift());
        for (const dep of (node && Array.isArray(node.buildsOn) ? node.buildsOn : [])) {
          if (typeof dep !== 'string' || seen.has(dep)) continue;
          if (dep === 'L01') { reached = true; break; }
          seen.add(dep);
          queue.push(dep);
        }
      }
      if (reached) n++;
    }
    return n;
  })(),
  sources: (SOURCES || []).length,
  sources_groups: new Set((SOURCES || []).map((s) => s.group)).size,
  ui_ids_required: REQUIRED_UI_IDS.length,
  ui_ids_present: REQUIRED_UI_IDS.length - missingUi.length,
  src_files: files.length,
  app_bytes: Buffer.byteLength(APP_JS, 'utf8'),
  html_bytes: Buffer.byteLength(html, 'utf8'),
  invalid: errors.length,
};

for (const e of errors.slice(0, 40)) console.error('INVALID: ' + e);
if (errors.length > 40) console.error(`INVALID: ... and ${errors.length - 40} more`);
writeFileSync(join(DIST, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n', 'utf8');

for (const [k, v] of Object.entries(metrics)) console.log(`METRIC ${k}=${v}`);
console.log(`METRIC source_checked=${SOURCE_CHECKED}`);
console.log(errors.length ? `FAILED: ${errors.length} validation error(s)` : 'OK: harness valid');
process.exit(errors.length ? 1 : 0);
