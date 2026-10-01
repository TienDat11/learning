// tests/smoke.cjs — verify LOGIC (the real functions the page runs) against real data.
// Loads dist/app.js in a DOM-less sandbox, exercises the pure logic, prints METRIC lines.
// Exit 0 = all assertions passed, 1 = at least one failed.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const distPath = path.join(root, 'dist');
const smokePath = path.join(distPath, 'smoke.json');
const appPath = path.join(distPath, 'app.js');
if (!fs.existsSync(appPath)) {
  console.error('FATAL: dist/app.js missing — run `node build.mjs` first');
  process.exit(2);
}
const APP = fs.readFileSync(appPath, 'utf8');

const el = () => {
  const e = {
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {}, children: [], hidden: false, value: '', textContent: '', innerHTML: '',
    setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
    addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {},
    remove() {}, focus() {}, blur() {}, closest: () => null, contains: () => false,
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {},
  };
  return e;
};
const doc = () => ({
  addEventListener() {}, removeEventListener() {},
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => el(), body: el(), head: el(), documentElement: el(),
});
const mem = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  };
};
const fails = [];
let checkCount = 0;
let crashed = false;
let LOGIC, QUESTIONS, QUIZ, MOCK_SETS, STUDY_PLANS, FLOW_SVGS;

const check = (name, cond, detail = '') => {
  checkCount++;
  if (!cond) fails.push(`${name}${detail ? ' — ' + detail : ''}`);
};

// Data comes from other agents and may be the wrong type entirely — coerce, never assume.
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const str = (v) => (typeof v === 'string' ? v : '');

// Always emit dist/smoke.json + the METRIC lines, whatever happened above.
const finish = (fatal) => {
  const report = {
    checks: checkCount,
    failures: fails.length,
    fails,
    questions_in_bundle: arr(QUESTIONS).length,
    quiz_in_bundle: arr(QUIZ).length,
    crashed,
  };
  try {
    fs.mkdirSync(distPath, { recursive: true });
    fs.writeFileSync(smokePath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  } catch (e) {
    console.error('FATAL: cannot write dist/smoke.json: ' + e.message);
    process.exit(2);
  }
  console.log(`METRIC smoke_checks=${report.checks}`);
  console.log(`METRIC smoke_failures=${report.failures}`);
  console.log(`METRIC questions_in_bundle=${report.questions_in_bundle}`);
  console.log(`METRIC quiz_in_bundle=${report.quiz_in_bundle}`);
  for (const f of fails) console.error('SMOKE FAIL: ' + f);
  if (fatal) { console.log('FAILED'); process.exit(2); }
  if (report.failures) { console.log('FAILED'); process.exit(1); }
  console.log('OK: smoke passed');
  process.exit(0);
};

try {
  let data;
  try {
    const EXPORTS = ['LOGIC', 'QUESTIONS', 'QUIZ', 'MOCK_SETS', 'STUDY_PLANS', 'FLOW_SVGS'];
    // Same `typeof` guards build.mjs uses: a bundle that has not shipped LOGIC yet must
    // still load, so the missing export is a check failure rather than a fatal error.
    data = new Function('document', 'window', 'localStorage', 'navigator', 'console', '__BUILD_CHECK__', APP + `
;return {${EXPORTS.map((n) => `${n}: (typeof ${n} === "undefined" ? undefined : ${n})`).join(',')}};`
    )(doc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
      mem(), { userAgent: 'node' }, { log() {}, warn() {}, error() {}, info() {}, debug() {} }, true);
  } catch (e) {
    console.error('FATAL: app.js failed to load: ' + e.message);
    crashed = true;
    fails.push('app.js failed to load: ' + (e && e.message ? e.message : String(e)));
    finish(true);
  }
  ({ LOGIC, QUESTIONS, QUIZ, MOCK_SETS, STUDY_PLANS, FLOW_SVGS } = data || {});

// ---- LOGIC must exist and be callable ----------------------------------
const need = ['normalize', 'stripTags', 'esc', 'haystack', 'matchQuery', 'filterQuestions', 'quizScore', 'resolvePick'];
check('LOGIC exported', !!LOGIC, 'LOGIC is ' + typeof LOGIC);
for (const fn of need) check(`LOGIC.${fn} exists`, LOGIC && typeof LOGIC[fn] === 'function');

if (LOGIC) {
  // ---- normalize must strip Vietnamese diacritics ----------------------
  const N = LOGIC.normalize;
  check('normalize strips dấu (mutable default)', N('Mutable Default Argument') === N('mutable default argument'), `got "${N('Mutable Default Argument')}"`);
  check('normalize maps đ', N('Đọc') === 'doc', `got "${N('Đọc')}"`);
  check('normalize lowercases + trims', N('  SQS   VISIBILITY ') === 'sqs visibility', `got "${N('  SQS   VISIBILITY ')}"`);
  check('normalize handles Ô', N('Ô') === 'o', `got "${N('Ô')}"`);

  // ---- esc must escape every dangerous char ---------------------------
  const E = LOGIC.esc;
  check('esc escapes <', E('<img>').includes('&lt;'));
  check('esc escapes & first', E('a & b').includes('&amp;'));
  check('esc escapes quotes', E('"x"').includes('&quot;') && E("'x'").includes('&#39;'));

  // ---- matchQuery: diacritic-insensitive + multi-term AND -------------
  const M = LOGIC.matchQuery;
  const q0 = { id: 'A01', topic: 'Mutable default argument', q: 'Sao lưu default argument lai object duoc tao san?',
    oral: 'x', deep: 'x', followups: [], pitfalls: [], selfcheck: [], tags: [] };
  check('matchQuery ignores dấu', M(q0, 'khong') === false, 'unrelated term matched');
  check('matchQuery matches ASCII term', M(q0, 'default argument') === true);
  const q1 = { ...q0, topic: 'Mutable default argument' };
  check('matchQuery matches topic without dấu', M(q1, 'default') === true);
  const qv = { ...q0, topic: 'Destructuring làm mất liên kết', q: 'Khi nào destructure phá vỡ reactivity?' };
  check('matchQuery matches Vietnamese unaccented input', M(qv, 'reactivity') === true);
  check('matchQuery empty needle = true', M(q0, '') === true);
  check('matchQuery whitespace needle = true', M(q0, '   ') === true);

  // ---- haystack must find text inside deep HTML ------------------------
  const H = LOGIC.haystack;
  const h = H({ ...q0, deep: '<p>Đánh giá <code>default</code> một lần.</p>' });
  check('haystack includes deep text', h.includes('default'), `haystack="${h}"`);
  check('haystack is normalized (no dấu)', !/[àáảãạăằắẳẵặâầấẩẫậ]/.test(h), `haystack="${h}"`);
  check('haystack strips tags', !h.includes('<'), `haystack="${h}"`);

  // ---- filterQuestions --------------------------------------------------
  const list = [
    { id: 'X1', group: 'A', prio: 'P0', level: 'L2', type: 'concept', topic: 'abc', q: 'q' },
    { id: 'X2', group: 'A', prio: 'P1', level: 'L3', type: 'predict', topic: 'abc', q: 'q' },
    { id: 'X3', group: 'G', prio: 'P0', level: 'L2', type: 'concept', topic: 'abc', q: 'q' },
  ];
  const F = LOGIC.filterQuestions;
  const run = (f, st) => F(list, Object.assign({ q: '', prio: '', level: '', group: '', status: '', weakOnly: false }, st, { statusMap: f }));
  check('filter: no filter returns all', run(null, {}).length === 3);
  check('filter: prio P0', run({ X1: 'known', X2: 'known', X3: 'weak' }, { prio: 'P0' }).length === 2);
  check('filter: group G', run(null, { group: 'G' }).length === 1);
  check('filter: level L3', run(null, { level: 'L3' }).length === 1);
  check('filter: weakOnly', run({ X1: 'known', X2: 'known', X3: 'weak' }, { weakOnly: true }).length === 1);
  check('filter: status known', run({ X1: 'known', X2: 'weak', X3: 'known' }, { status: 'known' }).length === 2);
  check('filter: combined prio+group', run(null, { prio: 'P0', group: 'A' }).length === 1);
  check('filter: search text', run(null, { q: 'abc' }).length === 3, 'text search broke');

  // ---- quizScore --------------------------------------------------------
  const Q = LOGIC.quizScore;
  const quiz = [
    { id: 'q1', group: 'A', options: ['a', 'b'], answer: 1 },
    { id: 'q2', group: 'G', options: ['a', 'b'], answer: 0 },
  ];
  const s1 = Q(quiz, { q1: 1, q2: 0 });
  check('quizScore all correct = 2', s1.correct === 2, JSON.stringify(s1));
  check('quizScore total = 2', s1.total === 2);
  const s2 = Q(quiz, { q1: 0, q2: 0 });
  check('quizScore 1 correct', s2.correct === 1, JSON.stringify(s2));
  const s3 = Q(quiz, {});
  check('quizScore blank = 0', s3.correct === 0);
  check('quizScore reports wrong ids', Array.isArray(s2.wrong) && s2.wrong.includes('q1'));
  check('quizScore groups by group', typeof s2.perGroup === 'object' && typeof s2.perGroup.A === 'number');

  // ---- resolvePick ------------------------------------------------------
  const R = LOGIC.resolvePick;
  check('resolvePick by prio', R({ prio: 'P0' }, list).length === 2);
  check('resolvePick respects limit', R({ prio: 'P0', limit: 1 }, list).length === 1);
  check('resolvePick empty spec = all', R({}, list).length === 3);
}

// ---- data-level invariants the UI relies on ----------------------------
try {
  const Q = arr(QUESTIONS);
  const ZZ = arr(QUIZ);
  const MS = obj(MOCK_SETS);
  const SP = obj(STUDY_PLANS);
  const FS = arr(FLOW_SVGS);
  const chains3 = Q.filter((q) => q && q.prio === 'P0' && arr(q.followups).length >= 3).length;
  const predictDebug = Q.filter((q) => q && (q.type === 'predict' || q.type === 'debug')).length;
  // Same definition build.mjs uses, so smoke and readiness agree on the count.
  const codeExamples = Q.filter((q) => q && typeof q.code === 'string' && q.code.length > 0).length;

  check('QUESTIONS >= 120', Q.length >= 120, `got ${Q.length}`);
  check('QUESTIONS <= 160', Q.length <= 160, `got ${Q.length}`);
  check('QUIZ >= 25', ZZ.length >= 25, `got ${ZZ.length}`);
  check('QUIZ <= 30', ZZ.length <= 30, `got ${ZZ.length}`);
  check('MOCK_SETS present', !!MS && Object.keys(MS).length >= 5);
  check('STUDY_PLANS has 3 plans', !!SP && Object.keys(SP).length === 3);
  check('FLOW_SVGS >= 10', FS.length >= 10, `got ${FS.length}`);
  check('quiz ids unique', new Set(ZZ.map((q) => q && q.id)).size === ZZ.length);
  check('quiz answers in range',
    ZZ.every((q) => q && Number.isInteger(q.answer) && q.answer >= 0 && arr(q.options).length > 0 && q.answer < q.options.length));
  check('every question has oral+deep', Q.every((q) => q && q.oral && q.deep));
  check('every predict/debug has expected',
    Q.filter((q) => q && (q.type === 'predict' || q.type === 'debug')).every((q) => str(q.expected).length > 20));
  check('no <script> in deep',
    !Q.some((q) => q && (/<script/i.test(str(q.deep)) || /<script/i.test(str(q.code)))));
  check('svg have viewBox + no script',
    FS.every((f) => f && /viewBox=/.test(str(f.svg)) && !/<script/i.test(str(f.svg))));
  check('>=15 P0 3-tier chains', chains3 >= 15, `got ${chains3}`);
  check('>=12 predict/debug', predictDebug >= 12, `got ${predictDebug}`);
  check('>=50 code examples', codeExamples >= 50, `got ${codeExamples}`);
  check('all 10 groups present',
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].every((g) => Q.some((q) => q && q.group === g)));
} catch (e) {
  fails.push('data invariants crashed: ' + (e && e.message ? e.message : String(e)));
}
} catch (e) {
  crashed = true;
  fails.push('smoke crashed: ' + (e && e.message ? e.message : String(e)));
}
finish(false);
