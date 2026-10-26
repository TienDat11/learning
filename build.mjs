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
for (const required of ['assets/style.css', 'assets/fonts.css', 'assets/body.html']) {
  if (!existsSync(join(root, required))) {
    console.error(`FATAL: missing ${required}`);
    process.exit(2);
  }
}

const parts = files.map((f) => ({ f, code: readFileSync(join(SRC, f), 'utf8') }));
const SRC_JS = parts.map((p) => `\n/* ==== src/${p.f} ==== */\n${p.code}`).join('\n');
// ---- 0. inject the lesson glossary ---------------------------------------
// The glossary is data, not a src module: prepend it so the single-file HTML ships it.
// `<` is escaped so a term can never open a tag inside the inline <script>.
const GLOSSARY_JSON = JSON.stringify(JSON.parse(readFileSync(join(root, 'lesson-glossary.json'), 'utf8')))
  .replace(/</g, '\\u003c');
const APP_JS = `var LESSON_GLOSSARY = ${GLOSSARY_JSON};\n${SRC_JS}`;

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
  'GROUP_INTROS', 'SOURCE_CHECKED', 'FLOW_SVGS', 'LOGIC', 'LESSONS', 'LESSON_GLOSSARY'];
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
  SOURCE_CHECKED, FLOW_SVGS, LOGIC, LESSONS, LESSON_GLOSSARY } = data;

// ---- 3. content validation ---------------------------------------------
const errors = [];
const err = (m) => { if (errors.length < 300) errors.push(m); };
const t = (s) => typeof s === 'string' && s.trim().length > 0;
const arr = (v) => (Array.isArray(v) ? v : []);
// Fields rendered through esc() (plain text, no HTML) vs fields rendered through
// sanitize() (HTML allowed). Getting this wrong shows raw tags to the reader.
// `code` is excluded: it is a code sample, so markup inside it is legitimate content.
// `naiveOut` is excluded: the contract types it as HTML and it goes through sanitize().
const PLAIN_Q = ['oral', 'expected', 'say30', 'say90', 'anchor', 'q', 'topic', 'naiveCode'];
const TRUNC_Q = ['expected', 'oral', 'deep', 'naive', 'rootCause', 'anchor', 'q'];
// Twelve beats every question must carry; see CONTRACT.md "pedagogical chain".
const CHAIN_Q = ['incident', 'askFirst', 'predict', 'anchor', 'naive', 'rootCause',
  'tradeoff', 'alternatives', 'observe', 'attacks', 'say30', 'say90'];
// The same beats for lessons, minus askFirst/attacks which use the lesson shape.
const LESSON_CHAIN = ['incident', 'naive', 'rootCause', 'concept', 'mechanism',
  'failureModes', 'tradeoff', 'alternatives', 'observe'];
const TAG_RE = /<\/?(code|em|strong|b|i|br|p|ul|ol|li|span|div|pre|small)\b[^>]*>/i;
const ENTITY_RE = /&(lt|gt|amp|quot|#39);/i;
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
  // Optional pedagogical chain on a question. Same rule as lessons: optional, but
  // if present it must be complete enough to teach.
  for (const f of ['incident', 'naive', 'rootCause', 'tradeoff', 'alternatives', 'observe']) {
    if (q[f] == null) continue;
    if (!t(q[f]) || q[f].length < 60) err(`${q.id}: ${f} present but <60 chars`);
    else if (/<script|<img|onerror=|onload=/i.test(q[f])) err(`${q.id}: ${f} contains script/img/event-handler`);
  }
  for (const f of ['naiveCode', 'naiveOut', 'say30', 'say90', 'anchor']) {
    if (q[f] == null) continue;
    if (!t(q[f]) || q[f].length < 10) err(`${q.id}: ${f} present but <10 chars`);
  }
  if (q.askFirst != null) {
    if (!Array.isArray(q.askFirst) || !q.askFirst.length) err(`${q.id}: askFirst must be a non-empty array`);
    else if (q.askFirst.some((s) => !t(s) || s.length < 12)) err(`${q.id}: askFirst entry missing or <12 chars`);
  }
  if (q.predict != null) {
    if (!t(q.predict.q) || q.predict.q.length < 12) err(`${q.id}: predict.q missing or <12 chars`);
    if (!t(q.predict.a) || q.predict.a.length < 40) err(`${q.id}: predict.a missing or <40 chars`);
  }
  if (q.attacks != null) {
    if (!Array.isArray(q.attacks) || !q.attacks.length) err(`${q.id}: attacks must be a non-empty array`);
    else q.attacks.forEach((a, i) => {
      if (!t(a && a.q) || a.q.length < 12) err(`${q.id}: attacks[${i}].q missing or <12 chars`);
      if (!t(a && a.a) || a.a.length < 40) err(`${q.id}: attacks[${i}].a missing or <40 chars`);
    });
  }
  // Fields the app renders through esc() must be plain text: an HTML tag here is
  // shown to the reader verbatim. Mirrors the lesson rules for bridge.
  for (const f of PLAIN_Q) {
    if (q[f] == null) continue;
    if (TAG_RE.test(q[f])) err(`${q.id}: ${f} must be plain text (found HTML tag)`);
    if (ENTITY_RE.test(q[f])) err(`${q.id}: ${f} must be plain text, not HTML-escaped (found entity)`);
  }
  // The pedagogical chain is the product: every question carries all twelve beats.
  // A new question that skips one renders as a visibly thinner card than its peers.
  for (const f of CHAIN_Q) {
    const v = q[f];
    if (v == null) { err(`${q.id}: ${f} missing (chain field required on every question)`); continue; }
    const filled = Array.isArray(v) ? v.length > 0
      : (typeof v === 'object' ? t(v.q) && t(v.a) : t(v));
    if (!filled) err(`${q.id}: ${f} present but empty`);
  }
  for (const [i, s] of arr(q.askFirst).entries()) {
    if (TAG_RE.test(s)) err(`${q.id}: askFirst[${i}] must be plain text (found HTML tag)`);
  }
  for (const [i, o] of arr(q.followups).entries()) {
    if (o && o.a && TAG_RE.test(o.a)) err(`${q.id}: followups[${i}].a must be plain text (found HTML tag)`);
  }
  // A field ending in a bare ellipsis is a truncated write, not a style choice.
  for (const f of TRUNC_Q) {
    if (q[f] == null) continue;
    if (/(\.\.\.|…)\s*$/.test(String(q[f]).trim())) err(`${q.id}: ${f} looks truncated (ends with an ellipsis)`);
  }
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
    if (typeof s.limit === 'number' && s.limit > matched.length) {
      err(`${label}: pick ${JSON.stringify(s)} asks for ${s.limit} but only ${matched.length} match`);
    }
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
  // A label that names a count is a promise to the reader; check it holds.
  const m = /(\d+)\s*câu/.exec(String(set.label));
  if (m && Number(m[1]) !== ids.length) {
    err(`mock set ${k}: label says ${m[1]} câu but resolves to ${ids.length}`);
  }
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
    // 'how' quotes counts ("10 câu P0 nhóm G"). Each quote is a promise about what
    // the reader will actually be given, so it must match its pick spec's size.
    const counts = [...String(b.how).matchAll(/(\d+) câu (L3|P0|P1)? ?nhóm ([A-J])/g)]
      .map((m) => ({ want: Number(m[1]), kind: m[2] || null, grp: m[3], raw: m[0] }));
    for (const c of counts) {
      const ok = (b.pick || []).some((s) => {
        if (!s || s.group !== c.grp) return false;
        const kind = s.level === 'L3' ? 'L3' : (s.prio || null);
        if (c.kind && kind !== c.kind) return false;
        const n = (QUESTIONS || []).filter((q) =>
          (!s.group || q.group === s.group) && (!s.prio || q.prio === s.prio) &&
          (!s.level || q.level === s.level) && (!s.type || q.type === s.type)).length;
        const lim = typeof s.limit === 'number' ? Math.min(s.limit, n) : n;
        return lim === c.want;
      });
      if (!ok) err(`plan ${k} block ${i}: 'how' says "${c.raw}" but no pick spec resolves to ${c.want}`);
    }
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
const markerOwner = new Map();
for (const f of FLOW_SVGS || []) {
  if (!t(f.id)) err('flow missing id');
  if (!/<svg[\s>]/.test(f.svg || '')) err(`flow ${f.id}: not an inline <svg>`);
  if (!/viewBox=/.test(f.svg || '')) err(`flow ${f.id}: svg missing viewBox`);
  if (/<script/i.test(f.svg || '')) err(`flow ${f.id}: svg contains <script`);
  if (/\son[a-z]+\s*=/i.test(f.svg || '')) err(`flow ${f.id}: svg contains inline event handler`);
  if (!/role="img"/.test(f.svg || '')) err(`flow ${f.id}: svg missing role="img"`);
  if (!/aria-label=/.test(f.svg || '')) err(`flow ${f.id}: svg missing aria-label`);
  if (!/<title[\s>]/i.test(f.svg || '')) err(`flow ${f.id}: svg missing <title>`);
  if (!/<desc[\s>]/i.test(f.svg || '')) err(`flow ${f.id}: svg missing <desc>`);
  if (/<(?:iframe|object|embed|foreignObject)\b/i.test(f.svg || '')) err(`flow ${f.id}: svg contains embedded frame/object`);
  if (/(?:xlink:)?href\s*=\s*["'](?:https?:)?\/\//i.test(f.svg || '')) err(`flow ${f.id}: svg contains an external href`);
  if (!t(f.caption) || f.caption.length < 30) err(`flow ${f.id}: caption missing or <30 chars`);
  // Marker ids must be unique across the whole set: two SVGs sharing id "arrow" makes
  // url(#arrow) resolve to whichever marker the browser saw first.
  for (const m of String(f.svg || '').matchAll(/<marker\b[^>]*\bid=["']([^"']+)["']/gi)) {
    const id = m[1];
    if (markerOwner.has(id)) err(`marker id "${id}" duplicated in ${markerOwner.get(id)} and ${f.id}`);
    else markerOwner.set(id, f.id);
  }
  // Every url(#x) reference must resolve inside the same SVG.
  for (const m of String(f.svg || '').matchAll(/url\(#([^)]+)\)/g)) {
    const id = m[1].trim();
    if (!new RegExp(`\\bid=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(String(f.svg || ''))) {
      err(`flow ${f.id}: url(#${id}) has no matching id in the same SVG`);
    }
  }
}

const LESSON_ARR = LESSONS || [];
const LESSON_POS = new Map(LESSON_ARR.map((l, i) => [l && l.id, i]));
const LESSON_BY_ID = new Map(LESSON_ARR.filter((l) => l && l.id).map((l) => [l.id, l]));
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
  else {
    for (const q of l.qids) if (!byId.has(q)) err(`${l.id}: unknown question id "${q}"`);
    if (l.qids.length < 3 || l.qids.length > 6) {
      err(`${l.id}: qids has ${l.qids.length} entries, gate allows 3-6`);
    }
  }
  if (!Array.isArray(l.refs) || !l.refs.length) err(`${l.id}: needs refs`);
  else {
    for (const r of l.refs) if (!srcKeys.has(r)) err(`${l.id}: unknown source ref "${r}"`);
    if (l.refs.length < 1 || l.refs.length > 4) {
      err(`${l.id}: refs has ${l.refs.length} entries, gate allows 1-4`);
    }
  }
  // The lesson chain is the product: every lesson carries all beats. A lesson that
  // skips one renders as a visibly thinner card than its neighbours.
  for (const f of LESSON_CHAIN) {
    if (l[f] == null) { err(`${l.id}: ${f} missing (lesson chain field required)`); continue; }
    if (!t(l[f]) || l[f].length < 60) err(`${l.id}: ${f} present but <60 chars`);
    else if (/<script|<img|onerror=|onload=/i.test(l[f])) err(`${l.id}: ${f} contains script/img/event-handler`);
  }
  for (const f of ['naiveCode', 'naiveOut', 'say30', 'say90', 'anchor']) {
    if (l[f] == null) { err(`${l.id}: ${f} missing (lesson chain field required)`); continue; }
    if (!t(l[f]) || l[f].length < 10) err(`${l.id}: ${f} present but <10 chars`);
  }
  if (l.askFirst != null) {
    if (!Array.isArray(l.askFirst) || l.askFirst.length < 1) err(`${l.id}: askFirst must be a non-empty array`);
    else if (l.askFirst.some((s) => !t(s) || s.length < 12)) err(`${l.id}: askFirst entry missing or <12 chars`);
  }
  if (l.predict != null) {
    if (!t(l.predict.q) || l.predict.q.length < 12) err(`${l.id}: predict.q missing or <12 chars`);
    if (!t(l.predict.a) || l.predict.a.length < 40) err(`${l.id}: predict.a missing or <40 chars`);
  }
  if (l.attacks != null) {
    if (!Array.isArray(l.attacks) || l.attacks.length < 1) err(`${l.id}: attacks must be a non-empty array`);
    else l.attacks.forEach((a, i) => {
      if (!t(a && a.q) || a.q.length < 12) err(`${l.id}: attacks[${i}].q missing or <12 chars`);
      if (!t(a && a.a) || a.a.length < 40) err(`${l.id}: attacks[${i}].a missing or <40 chars`);
    });
  }
  if (l.timeline != null) {
    if (!Array.isArray(l.timeline) || l.timeline.length < 2) err(`${l.id}: timeline needs >=2 rows`);
    else l.timeline.forEach((r, i) => {
      if (!Array.isArray(r) || r.length < 2 || !t(r[0]) || !t(r[1])) err(`${l.id}: timeline[${i}] must be [when, what]`);
    });
  }
  if (typeof l.bridge !== 'string' || l.bridge.length < 120) err(`${l.id}: bridge missing or <120 chars (${typeof l.bridge === 'string' ? l.bridge.length : 0})`);
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

// ---- 3b. plain-text vs HTML field gates (every lesson) -------------------
// Plain fields go through esc(); a tag there is shown to the reader verbatim. HTML
// fields go through the whitelist sanitizer, so any tag outside it is silently dropped.
const LESSON_PLAIN = ['title', 'goal', 'stageTitle', 'bridge', 'anchor', 'say30', 'say90', 'naiveCode'];
const LESSON_HTML = ['incident', 'naive', 'naiveOut', 'rootCause', 'concept', 'mechanism',
  'failureModes', 'tradeoff', 'alternatives', 'observe', 'codeNote', 'body'];
// Same whitelist as ALLOWED in vue-app/src/utils.js — one set, not two.
const ALLOWED_TAGS = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'br',
  'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'h3', 'h4']);
const HTML_TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
const FORBIDDEN_HTML = [/<script/i, /<img/i, /<iframe/i, /<style/i, /\son[a-z]+\s*=/i, /javascript:/i];
for (const l of LESSON_ARR) {
  if (!l || !l.id) continue;
  const plain = [
    ...LESSON_PLAIN.map((f) => [f, l[f]]),
    ...arr(l.askFirst).map((s, i) => [`askFirst[${i}]`, s]),
    ...arr(l.sayIt).map((s, i) => [`sayIt[${i}]`, s]),
    ...arr(l.provenance).map((s, i) => [`provenance[${i}]`, s]),
    ...arr(l.timeline).map((r, i) => [`timeline[${i}][0]`, arr(r)[0]]),
  ];
  for (const [f, v] of plain) {
    if (typeof v !== 'string') continue;
    if (TAG_RE.test(v)) err(`${l.id}: ${f} must be plain text (found HTML tag)`);
    if (ENTITY_RE.test(v)) err(`${l.id}: ${f} must be plain text (found entity)`);
  }
  const html = [
    ...LESSON_HTML.map((f) => [f, l[f]]),
    ['predict.q', l.predict && l.predict.q], ['predict.a', l.predict && l.predict.a],
    ...arr(l.attacks).flatMap((a, i) => [[`attacks[${i}].q`, a && a.q], [`attacks[${i}].a`, a && a.a]]),
  ];
  for (const [f, v] of html) {
    if (typeof v !== 'string') continue;
    for (const re of FORBIDDEN_HTML) {
      const m = v.match(re);
      if (m) err(`${l.id}: ${f} contains forbidden markup "${String(m[0]).slice(0, 40)}"`);
    }
    for (const m of v.matchAll(HTML_TAG_RE)) {
      if (!ALLOWED_TAGS.has(m[1].toLowerCase())) err(`${l.id}: ${f} uses tag <${m[1]}> outside the sanitizer allowlist`);
    }
  }
}

// ---- 3c. new-schema content gate ----------------------------------------
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '');
const liCount = (s) => (String(s || '').match(/<li\b/gi) || []).length;
const tokenCount = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const SAY90_LABELS = ['[Nêu vấn đề (30s)]:', '[Cơ chế (45s)]:', '[Ranh giới (15s)]:'];
const BANNED_PHRASES = ['Xem Bài này', 'quen React', 'Giống useMemo', 'Giống Zustand', 'custom hook trong React'];
const SELF_REF_FIELDS = ['title', 'goal', 'bridge', 'incident', 'askFirst', 'predict', 'naive', 'naiveCode',
  'naiveOut', 'timeline', 'rootCause', 'concept', 'mechanism', 'failureModes', 'tradeoff', 'alternatives',
  'observe', 'codeNote', 'body', 'attacks', 'anchor', 'say30', 'say90', 'sayIt', 'provenance'];
const visualOwner = new Map();
for (const l of LESSON_ARR) {
  for (const k of ['spine', 'spineNode', 'flow']) {
    if (k in l) err(`${l.id}: legacy key "${k}" must be removed after migration`);
  }
  if (!Array.isArray(l.visuals)) err(`${l.id}: visuals must be an array`);
  else {
    const want = ['L05', 'L09', 'L24'].includes(l.id) ? 2 : 1;
    if (l.visuals.length !== want) err(`${l.id}: visuals has ${l.visuals.length} entries, gate allows ${want}`);
    const seenV = new Set();
    for (const v of l.visuals) {
      if (!v || !t(v.id)) { err(`${l.id}: visual missing id`); continue; }
      const svg = (FLOW_SVGS || []).find((f) => f.id === v.id);
      if (!svg) err(`${l.id}: visual id "${v.id}" does not resolve in FLOW_SVGS`);
      if (seenV.has(v.id)) err(`${l.id}: duplicate visual id "${v.id}"`);
      seenV.add(v.id);
      if (visualOwner.has(v.id)) err(`${v.id}: bound by both ${visualOwner.get(v.id)} and ${l.id}`);
      else visualOwner.set(v.id, l.id);
      if (typeof v.question !== 'string' || v.question.length < 20 || !v.question.trim().endsWith('?')) {
        err(`${l.id}: visual ${v.id} question must be >=20 chars and end with "?"`);
      }
      if (typeof v.focus !== 'string' || !v.focus.trim()) err(`${l.id}: visual ${v.id} focus must be non-empty`);
      else if (svg && !stripTags(svg.svg).includes(v.focus)) {
        err(`${l.id}: visual ${v.id} focus "${v.focus}" not found in its SVG text`);
      }
    }
  }
  if (l.id === 'L12') {
    const a = l.analogy;
    if (!a || typeof a !== 'object') err('L12: analogy missing');
    else {
      if (!t(a.source)) err('L12: analogy.source must be non-empty');
      if (!Array.isArray(a.pairs) || a.pairs.length < 3) err(`L12: analogy.pairs has ${arr(a.pairs).length} rows, gate allows >=3`);
      else for (const [i, pr] of a.pairs.entries()) {
        if (!pr || !t(pr.from) || !t(pr.to)) err(`L12: analogy.pairs[${i}] needs non-empty from/to`);
      }
      if (typeof a.breaks !== 'string' || a.breaks.length < 40) err(`L12: analogy.breaks has ${typeof a.breaks === 'string' ? a.breaks.length : 0} chars, gate allows >=40`);
      if (typeof a.transfer !== 'string' || !a.transfer.trim().endsWith('?')) err('L12: analogy.transfer must end with "?"');
    }
  } else if ('analogy' in l) {
    err(`${l.id}: analogy is only allowed on L12`);
  }
  const conceptLen = typeof l.concept === 'string' ? l.concept.length : 0;
  if (conceptLen < 120 || conceptLen > 250) err(`${l.id}: concept has ${conceptLen} chars, gate allows 120-250`);
  if (typeof l.incident !== 'string' || !l.incident.startsWith('<p>')) err(`${l.id}: incident must start with <p>`);
  if (typeof l.incident === 'string' && l.incident.length > 1800) err(`${l.id}: incident has ${l.incident.length} chars, gate allows <=1800`);
  if (typeof l.mechanism === 'string') {
    if (l.mechanism.length > 3500) err(`${l.id}: mechanism has ${l.mechanism.length} chars, gate allows <=3500`);
    if (!/<ol\b/i.test(l.mechanism)) err(`${l.id}: mechanism must contain an <ol> list`);
    const n = liCount(l.mechanism);
    if (n < 3 || n > 5) err(`${l.id}: mechanism has ${n} <li>, gate allows 3-5`);
  }
  if (typeof l.failureModes === 'string') {
    const n = liCount(l.failureModes);
    if (n < 2 || n > 4) err(`${l.id}: failureModes has ${n} <li>, gate allows 2-4`);
    if (l.failureModes.length > 2500) err(`${l.id}: failureModes has ${l.failureModes.length} chars, gate allows <=2500`);
  }
  for (const f of ['tradeoff', 'alternatives']) {
    if (typeof l[f] === 'string' && l[f].length > 2500) err(`${l.id}: ${f} has ${l[f].length} chars, gate allows <=2500`);
  }
  if (!t(l.observe)) err(`${l.id}: observe must be non-empty`);
  const bodyLen = typeof l.body === 'string' ? l.body.length : 0;
  if (bodyLen < 600 || bodyLen > 2200) err(`${l.id}: body has ${bodyLen} chars, gate allows 600-2200`);
  if (!Array.isArray(l.attacks) || l.attacks.length !== 4) err(`${l.id}: attacks has ${arr(l.attacks).length} entries, gate allows 4`);
  else for (const [i, a] of l.attacks.entries()) {
    if (!t(a && a.q)) err(`${l.id}: attacks[${i}].q must be non-empty`);
    if (!t(a && a.a)) err(`${l.id}: attacks[${i}].a must be non-empty`);
    if (a && typeof a.a === 'string' && a.a.length > 1600) err(`${l.id}: attacks[${i}].a has ${a.a.length} chars, gate allows <=1600`);
  }
  if (!Array.isArray(l.timeline) || l.timeline.length < 3 || l.timeline.length > 6) {
    err(`${l.id}: timeline has ${arr(l.timeline).length} rows, gate allows 3-6`);
  } else for (const [i, r] of l.timeline.entries()) {
    if (!Array.isArray(r) || r.length !== 2 || !t(r[0]) || !t(r[1])) err(`${l.id}: timeline[${i}] must be exactly [when, what]`);
  }
  if (!Array.isArray(l.askFirst) || l.askFirst.length !== 3) err(`${l.id}: askFirst has ${arr(l.askFirst).length} entries, gate allows 3`);
  else for (const [i, s] of l.askFirst.entries()) {
    if (/Giải mã|Đáp án|→/.test(s)) err(`${l.id}: askFirst[${i}] must not contain "Giải mã", "Đáp án" or "→"`);
  }
  if (!l.predict || !t(l.predict.q)) err(`${l.id}: predict.q must be non-empty`);
  if (!l.predict || !t(l.predict.a)) err(`${l.id}: predict.a must be non-empty`);
  else if (typeof l.incident === 'string' && stripTags(l.incident).includes(stripTags(l.predict.a))) {
    err(`${l.id}: predict.a repeats text already present in incident`);
  }
  const n30 = tokenCount(l.say30);
  if (n30 < 60 || n30 > 85) err(`${l.id}: say30 has ${n30} tokens, gate allows 60-85`);
  const n90 = tokenCount(l.say90);
  if (n90 < 160 || n90 > 210) err(`${l.id}: say90 has ${n90} tokens, gate allows 160-210`);
  for (const lab of SAY90_LABELS) {
    if (typeof l.say90 !== 'string' || !l.say90.includes(lab)) err(`${l.id}: say90 missing label "${lab}"`);
  }
  if (!Array.isArray(l.sayIt) || l.sayIt.length < 4 || l.sayIt.length > 6) {
    err(`${l.id}: sayIt has ${arr(l.sayIt).length} entries, gate allows 4-6`);
  }
  if (typeof l.anchor === 'string' && l.anchor.length > 180) err(`${l.id}: anchor has ${l.anchor.length} chars, gate allows <=180`);
  const blob = JSON.stringify(l);
  for (const bad of BANNED_PHRASES) if (blob.includes(bad)) err(`${l.id}: banned phrase "${bad}"`);
  const selfRe = new RegExp(`\\b${l.id}\\b`);
  for (const f of SELF_REF_FIELDS) {
    if (selfRe.test(JSON.stringify(l[f]))) err(`${l.id}: ${f} references its own id (${l.id})`);
  }
}

// ---- 3d. glossary gate --------------------------------------------------
const normText = (s) => stripTags(s).toLowerCase().replace(/\s+/g, ' ').trim();
const GLOSSARY_ARR = LESSON_GLOSSARY || [];
if (!Array.isArray(LESSON_GLOSSARY)) err('LESSON_GLOSSARY is not an array');
const glossaryById = new Map();
for (const entry of arr(GLOSSARY_ARR)) {
  if (!entry || !t(entry.id)) { err('glossary entry missing id'); continue; }
  if (glossaryById.has(entry.id)) err(`glossary duplicate entry ${entry.id}`);
  glossaryById.set(entry.id, entry);
  if (!/^L\d{2}$/.test(entry.id)) err(`glossary bad id "${entry.id}"`);
}
for (const l of LESSON_ARR) {
  const entry = glossaryById.get(l.id);
  if (!entry) { err(`${l.id}: glossary entry missing`); continue; }
  if (!Array.isArray(entry.rows) || entry.rows.length < 3 || entry.rows.length > 8) {
    err(`${l.id}: glossary has ${arr(entry.rows).length} rows, gate allows 3-8`);
  }
  const terms = new Set();
  const failLis = (String(l.failureModes || '').match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || []).map(normText);
  for (const [i, row] of arr(entry.rows).entries()) {
    if (!row || !t(row.term) || !t(row.is) || !t(row.not)) {
      err(`${l.id}: glossary row ${i} "${(row && row.term) || '?'}" needs non-empty term/is/not`);
      continue;
    }
    if (terms.has(row.term)) err(`${l.id}: glossary duplicate term "${row.term}"`);
    terms.add(row.term);
    if (failLis.includes(normText(row.not))) err(`${l.id}: glossary row "${row.term}" repeats a failureModes bullet`);
  }
}

// ---- 3e. orphan flow gate ----------------------------------------------
const flowConsumers = new Set();
for (const l of LESSON_ARR) {
  for (const v of arr(l.visuals)) if (v && v.id) flowConsumers.add(v.id);
}
for (const s of arr((CASE_STUDY || {}).sections)) if (s && s.flow) flowConsumers.add(s.flow);
for (const f of FLOW_SVGS || []) {
  if (!t(f.id) || flowConsumers.has(f.id)) continue;
  err(`flow ${f.id}: orphan (no lesson visual, no case section)`);
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
  'lesson-pos', 'lp-id', 'lp-t', 'lp-n', 'lp-bar',
];
const BODY = readFileSync(join(root, 'assets', 'body.html'), 'utf8');
const CSS = readFileSync(join(root, 'assets', 'style.css'), 'utf8');
const FONTS = readFileSync(join(root, 'assets', 'fonts.css'), 'utf8');
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
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%234F46E5'/%3E%3Cpath d='M8 21V11h3.4l4.6 6.2L20.6 11H24v10h-3.2v-4.6L17 21h-2l-3.8-4.6V21z' fill='%23fff'/%3E%3C/svg%3E">
<style>
${FONTS}
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
  lessons_migrated: LESSON_ARR.length,
  lesson_visual_bindings: LESSON_ARR.reduce((n, l) => n + arr(l.visuals).length, 0),
  lessons_with_bridge: (LESSONS || []).filter((l) => typeof l.bridge === 'string' && l.bridge.length > 0).length,
  lessons_linked: (LESSONS || []).filter((l) => Array.isArray(l.buildsOn) && l.buildsOn.length > 0).length,
  lessons_with_incident: (LESSONS || []).filter((l) => typeof l.incident === 'string' && l.incident.length > 0).length,
  lessons_with_anchor: (LESSONS || []).filter((l) => typeof l.anchor === 'string' && l.anchor.length > 0).length,
  lessons_with_attacks: (LESSONS || []).filter((l) => Array.isArray(l.attacks) && l.attacks.length > 0).length,
  lessons_with_predict: (LESSONS || []).filter((l) => l.predict && typeof l.predict.q === 'string').length,
  lessons_with_spoken: (LESSONS || []).filter((l) => typeof l.say30 === 'string' && typeof l.say90 === 'string').length,
  questions_with_incident: (QUESTIONS || []).filter((q) => typeof q.incident === 'string' && q.incident.length > 0).length,
  questions_with_anchor: (QUESTIONS || []).filter((q) => typeof q.anchor === 'string' && q.anchor.length > 0).length,
  questions_with_attacks: (QUESTIONS || []).filter((q) => Array.isArray(q.attacks) && q.attacks.length > 0).length,
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
