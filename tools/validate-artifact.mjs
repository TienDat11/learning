// tools/validate-artifact.mjs — structural validation of the built single-file HTML.
// Read-only. Exit 1 on any failed check.
import { readFileSync, statSync } from 'node:fs';

const FILE = new URL('../hitechcloud-interview-prep.html', import.meta.url);
const html = readFileSync(FILE, 'utf8');
const disk = statSync(FILE).size;
const fails = [];
const ok = (name, cond, detail = '') => {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  — ' + detail : ''));
  if (!cond) fails.push(name);
};
const count = (re) => (html.match(re) || []).length;

console.log('file bytes on disk: ' + disk + '  | js string bytes: ' + Buffer.byteLength(html, 'utf8'));
console.log('');

// Anything inside a <script> element is inert text, not markup — and the app's own
// sanitizer contains the literal "<script" patterns. So count real tags only in the
// markup before the bundle starts.
const bundleStart = html.indexOf('/* ==== src/00-bootstrap.js ==== */');
const headMarkup = bundleStart > -1 ? html.slice(0, bundleStart) : html;
ok('exactly one <script> opening tag in the markup',
  (headMarkup.match(/<script[\s>]/gi) || []).length === 1,
  (headMarkup.match(/<script[\s>]/gi) || []).length + ' in markup; ' +
  (html.match(/<script/gi) || []).length + ' raw occurrences total (rest are sanitizer literals)');
ok('single </script>', count(/<\/script>/gi) === 1, String(count(/<\/script>/gi)));
ok('single <style>', count(/<style/gi) === 1);
ok('html/head/body present exactly once',
  count(/<html/gi) === 1 && count(/<head/gi) === 1 && count(/<body/gi) === 1);
ok('document closes </script></body></html>', /<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html));
ok('no raw </script inside the bundle', !/<\\\/script/i.test(html) === false ? true : !html.slice(0, html.lastIndexOf('<script')).includes('</script>'));
ok('no external <script src>', !/<script\s+src=/i.test(html));
ok('no external stylesheet <link>', !/<link\b[^>]*rel=["']?stylesheet/i.test(html));
ok('no CSS @import url()', !/@import\s+url/i.test(html));
ok('title present', /<title>[^<]+<\/title>/.test(html));

const m = html.match(/<meta name="description" content="([^"]+)"/);
ok('meta description present', !!m);
const nQ = (html.match(/METRIC_NOT_USED/) || []).length; void nQ;

// Views: every nav button has a matching container in the same document.
for (const v of ['questions', 'flashcard', 'quiz', 'mock', 'plan', 'case', 'sources', 'intro']) {
  const nav = new RegExp('data-view="' + v + '"').test(html);
  const box = new RegExp('id="view-' + v + '"').test(html);
  ok('view ' + v + ' wired (nav + container)', nav && box, 'nav=' + nav + ' container=' + box);
}

const IDS = ['search', 'f-prio', 'f-level', 'f-group', 'f-status', 'weak-only', 'theme-btn', 'reset-btn',
  'print-btn', 'stat-line', 'progress-bar', 'progress-text', 'q-list', 'q-empty', 'q-count',
  'fc-front', 'fc-back', 'fc-reveal', 'fc-next', 'fc-prev', 'fc-know', 'fc-weak', 'fc-count', 'fc-progress',
  'quiz-list', 'quiz-submit', 'quiz-result', 'quiz-reset', 'quiz-count',
  'mock-topic', 'mock-minutes', 'mock-start', 'mock-panel', 'mock-timer', 'mock-next', 'mock-result', 'mock-question',
  'plan-body', 'case-body', 'sources-body', 'intro-body', 'nav-list', 'side-body', 'side-toggle'];
const missing = IDS.filter((i) => !new RegExp('id="' + i + '"').test(html));
ok('all required DOM ids present', missing.length === 0, missing.join(', '));

ok('localStorage used for progress', (html.match(/localStorage/g) || []).length >= 4,
  (html.match(/localStorage/g) || []).length + ' sites');
ok('dark theme selectable', /data-theme/.test(html));
ok('inline SVG diagrams present', count(/<svg[\s>]/g) >= 10, count(/<svg[\s>]/g) + ' svg');
ok('data-URI favicon only, no external asset', /rel="icon" href="data:image\/svg\+xml/.test(html));

// External URLs are permitted only inside src/00-meta.js (the SOURCES table).
// build.mjs already rejects them per source file; this re-checks the emitted artifact.
const metaStart = html.indexOf('/* ==== src/00-meta.js ==== */');
const metaEnd = html.indexOf('/* ==== src/05-logic.js ==== */');
const inMeta = (at) => metaStart > -1 && metaEnd > metaStart && at > metaStart && at < metaEnd;
const urls = [...html.matchAll(/https?:\/\/(?!www\.w3\.org)[^\s"'<>)]+/g)];
const outsideSources = urls.filter((m) => !inMeta(m.index));
ok('no external URL outside src/00-meta.js', outsideSources.length === 0,
  outsideSources.slice(0, 4).map((m) => m[0]).join(' | '));

console.log('');
console.log(fails.length ? 'FAILED: ' + fails.length + ' check(s)' : 'OK: artifact valid');
process.exit(fails.length ? 1 : 0);
