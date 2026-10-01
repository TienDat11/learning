// tests/score.cjs — the benchmark metric. Reads dist/metrics.json (REQUIRED, written by
// build.mjs) and dist/smoke.json (OPTIONAL, written by tests/smoke.cjs). Prints
// `METRIC readiness=<0..100>` plus secondary METRIC lines. Deterministic, stdlib only.
//
// Exit 0 whenever it scored (readiness may legitimately be 0). Exit 2 when
// dist/metrics.json is missing or unparseable — nothing to score.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const metricsPath = path.join(root, 'dist', 'metrics.json');
const smokePath = path.join(root, 'dist', 'smoke.json');

let metrics;
try {
  metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  if (!metrics || typeof metrics !== 'object') throw new Error('not a JSON object');
} catch (e) {
  console.error('FATAL: dist/metrics.json missing or unparseable — run `node build.mjs` first (' + e.message + ')');
  process.exit(2);
}

// Missing smoke output is not fatal: score it as a total smoke failure.
let smoke;
try {
  smoke = JSON.parse(fs.readFileSync(smokePath, 'utf8'));
  if (!smoke || typeof smoke !== 'object') throw new Error('not a JSON object');
} catch (e) {
  smoke = { checks: 1, failures: 1, crashed: true };
  console.error('WARN: dist/smoke.json missing or unparseable — scoring as total smoke failure (' + e.message + ')');
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const m = (k) => num(metrics[k]);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ---- ratios ----------------------------------------------------------------
const questions = m('questions');
const quiz = m('quiz');
const invalid = m('invalid');
const uiPresent = m('ui_ids_present');
const uiRequired = m('ui_ids_required');
const smokeChecks = num(smoke.checks);
const smokeFailures = num(smoke.failures);

const smokeRatio = clamp01(1 - smokeFailures / Math.max(1, smokeChecks));
const validRatio = clamp01(1 - invalid / 50);
const uiRatio = clamp01(uiPresent / Math.max(1, uiRequired));

// ---- weighted progress -----------------------------------------------------
const readiness = 100 * (
  0.30 * clamp01(questions / 120) +
  0.06 * clamp01(quiz / 25) +
  0.05 * clamp01(m('p0_chains_3tier') / 15) +
  0.04 * clamp01(m('predict_debug') / 12) +
  0.04 * clamp01(m('code_examples') / 50) +
  0.04 * clamp01(m('flow_svgs') / 10) +
  0.05 * clamp01(m('sources') / 20) +
  0.05 * clamp01(m('case_sections') / 12) +
  0.04 * clamp01(m('mock_sets') / 5) +
  0.03 * clamp01(m('plans') / 3) +
  0.05 * clamp01(m('groups_covered') / 10) +
  0.05 * uiRatio +
  0.08 * smokeRatio +
  0.12 * validRatio
);

// ---- penalties (each >= 0) -------------------------------------------------
const penalties = [];
if (questions > 160) penalties.push(0.5 * (questions - 160));
if (quiz > 30) penalties.push(0.5 * (quiz - 30));
if (questions >= 30) {
  const share = m('foundation_share_pct');
  if (share < 50) penalties.push(0.4 * (50 - share));
  if (share > 75) penalties.push(0.3 * (share - 75));
  const p0 = m('p0');
  if (p0 < 0.20 * questions) penalties.push(0.3 * (0.20 * questions - p0));
}
const duplicateIds = m('duplicate_ids');
if (duplicateIds > 0) penalties.push(2 * duplicateIds);

const penalty = penalties.reduce((a, b) => a + Math.max(0, b), 0);
const clamped = Math.min(100, Math.max(0, readiness - penalty));
const finalReadiness = Math.round(clamped * 10) / 10;
const gaps = invalid + smokeFailures;

// ---- report ----------------------------------------------------------------
const out = [`METRIC readiness=${finalReadiness.toFixed(1)}`, `METRIC gaps=${gaps}`];
const PASS_THROUGH = [
  'questions', 'unique_ids', 'duplicate_ids', 'groups_covered', 'foundation_share_pct',
  'p0', 'p1', 'p2', 'l1', 'l2', 'l3', 'p0_chains_3tier', 'predict_debug', 'code_examples',
  'quiz', 'quiz_situational', 'mock_sets', 'plans', 'case_sections', 'flow_svgs',
  'sources', 'sources_groups', 'ui_ids_present', 'ui_ids_required',
  'src_files', 'app_bytes', 'html_bytes', 'invalid',
];
for (const k of PASS_THROUGH) out.push(`METRIC ${k}=${metrics[k] === undefined ? 0 : metrics[k]}`);
out.push(`METRIC smoke_checks=${smokeChecks}`);
out.push(`METRIC smoke_failures=${smokeFailures}`);
out.push(`METRIC smoke_crashed=${smoke.crashed ? 1 : 0}`);
console.log(out.join('\n'));
console.log(`OK: scored readiness=${finalReadiness.toFixed(1)} gaps=${gaps}`);
process.exit(0);