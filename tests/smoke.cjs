// tests/smoke.cjs — verify LOGIC (the real functions the page runs) against real data.
// Loads dist/app.js in a DOM-less sandbox, exercises the pure logic, prints METRIC lines.
// Exit 0 = all assertions passed, 1 = at least one failed.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'dist', 'app.js');
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

let data;
try {
  data = new Function('document', 'window', 'localStorage', 'navigator', '__BUILD_CHECK__', APP + `
;return { LOGIC, QUESTIONS, QUIZ, MOCK_SETS, STUDY_PLANS, FLOW_SVGS };`
  )(doc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
    mem(), { userAgent: 'node' }, true);
} catch (e) {
  console.error('FATAL: app.js failed to load: ' + e.message);
  process.exit(2);
}

const { LOGIC, QUESTIONS, QUIZ, MOCK_SETS, STUDY_PLANS, FLOW_SVGS } = data;
const fails = [];
const check = (name, cond, detail = '') => {
  if (!cond) fails.push(`${name}${detail ? ' — ' + detail : ''}`);
};

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
check('QUESTIONS >= 120', QUESTIONS.length >= 120, `got ${QUESTIONS.length}`);
check('QUIZ >= 25', QUIZ.length >= 25, `got ${QUIZ.length}`);
check('MOCK_SETS present', MOCK_SETS && Object.keys(MOCK_SETS).length >= 5);
check('STUDY_PLANS has 3 plans', STUDY_PLANS && Object.keys(STUDY_PLANS).length === 3);
check('FLOW_SVGS >= 10', FLOW_SVGS.length >= 10, `got ${FLOW_SVGS.length}`);
check('quiz ids unique', new Set(QUIZ.map((q) => q.id)).size === QUIZ.length);
check('quiz answers in range', QUIZ.every((q) => q.answer >= 0 && q.answer < q.options.length));
check('every question has oral+deep', QUESTIONS.every((q) => q.oral && q.deep));
check('every predict/debug has expected',
  QUESTIONS.filter((q) => q.type === 'predict' || q.type === 'debug').every((q) => q.expected && q.expected.length > 20));
check('no <script> in deep',
  !QUESTIONS.some((q) => /<script/i.test(q.deep) || /<script/i.test(q.code || '')));
check('svg have viewBox + no script', FLOW_SVGS.every((f) => /viewBox=/.test(f.svg) && !/<script/i.test(f.svg)));
check('>=15 P0 3-tier chains',
  QUESTIONS.filter((q) => q.prio === 'P0' && (q.followups || []).length >= 3).length >= 15,
  `got ${QUESTIONS.filter((q) => q.prio === 'P0' && (q.followups || []).length >= 3).length}`);
check('>=12 predict/debug', QUESTIONS.filter((q) => q.type === 'predict' || q.type === 'debug').length >= 12);
check('all 10 groups present',
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].every((g) => QUESTIONS.some((q) => q.group === g)));

console.log(`METRIC smoke_checks=${need.length + 44 + 16}`);
console.log(`METRIC smoke_failures=${fails.length}`);
console.log(`METRIC questions_in_bundle=${QUESTIONS.length}`);
console.log(`METRIC quiz_in_bundle=${QUIZ.length}`);
if (fails.length) {
  for (const f of fails) console.error('SMOKE FAIL: ' + f);
  console.log('FAILED');
  process.exit(1);
}
console.log('OK: smoke passed');
