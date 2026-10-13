import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRCROOT = join(ROOT, '..', 'src');
const DIST = join(ROOT, 'dist');
const OUT = join(DIST, 'index.html');
const FONTS = readFileSync(join(ROOT, '..', 'assets', 'fonts.css'), 'utf8');
const FAVICON = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%276%27 fill=%27%234F46E5%27/%3E%3Cpath d=%27M8 21V11h3.4l4.6 6.2L20.6 11H24v10h-3.2v-4.6L17 21h-2l-3.8-4.6V21z%27 fill=%27%23fff%27/%3E%3C/svg%3E">';

// ---- helpers: escape only what the HTML parser would break on ----
// Inline JS: `</script` ends the element and `<!--` switches the parser into escaped
// state. Both can only occur inside string/regex/comment text in valid JS, where the
// replacements below are equivalent. Newlines and code are left untouched.
function safeInlineJs(src) {
  return src.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '\\x3C!--');
}
// Inline JSON: `<` only occurs inside JSON strings, so \u003c is a legal JSON escape.
function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ---- 1. loader: run src/*.js in a vm, keep JSON-safe exports ----
// LOGIC is kept out of the payload: its functions would be dropped by JSON.stringify.
const VM_EXPORTS = ['QUESTIONS', 'QUIZ', 'MOCK_SETS', 'STUDY_PLANS', 'CASE_STUDY', 'SOURCES',
  'GROUP_INTROS', 'SOURCE_CHECKED', 'FLOW_SVGS', 'LESSONS', 'LESSON_IMAGES'];
const files = readdirSync(SRCROOT).filter((f) => f.endsWith('.js')).sort();
const payload = {};
const ctx = createContext({
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  require: () => { throw new Error('no require in src'); },
  __BUILD_CHECK__: true,
});
ctx.__HCP_DATA = payload;
for (const f of files) {
  runInContext(readFileSync(join(SRCROOT, f), 'utf8'), ctx, { filename: f, displayErrors: false });
  for (const k of VM_EXPORTS) {
    if (typeof ctx[k] !== 'undefined') payload[k] = ctx[k];
  }
}
const LOGIC_SRC = readFileSync(join(SRCROOT, '05-logic.js'), 'utf8');

// ---- 2. vite build ----
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
execSync('node node_modules/vite/bin/vite.js build', { cwd: ROOT, stdio: 'inherit' });

// ---- 3. inline the emitted JS and CSS chunks ----
let html = readFileSync(OUT, 'utf8');
const assetDir = join(DIST, 'assets');
const assetText = new Map(readdirSync(assetDir).map((f) => [f, readFileSync(join(assetDir, f), 'utf8')]));
let inlined = 0;
html = html.replace(/<script\b[^>]*\bsrc="\/?assets\/([^"]+\.js)"[^>]*><\/script>/g, (_, name) => {
  const js = assetText.get(name);
  if (js === undefined) throw new Error('missing asset ' + name);
  inlined++;
  return '<script type="module">\n' + safeInlineJs(js) + '\n</script>';
});
html = html.replace(/<link\b[^>]*\bhref="\/?assets\/([^"]+\.css)"[^>]*>/g, (_, name) => {
  const css = assetText.get(name);
  if (css === undefined) throw new Error('missing asset ' + name);
  if (/<\/style/i.test(css)) throw new Error('</style found in ' + name);
  inlined++;
  return '<style>\n' + css + '\n</style>';
});
if (inlined !== assetText.size) {
  throw new Error('inlined ' + inlined + ' of ' + assetText.size + ' emitted assets');
}

// ---- 4. head: favicon, fonts, LOGIC (classic script), data payload ----
if (/<\/style/i.test(FONTS)) throw new Error('</style found in fonts.css');
const head = '\n' + FAVICON + '\n' +
  '<style>\n' + FONTS + '\n</style>\n' +
  '<script>\n' + safeInlineJs(LOGIC_SRC) + '\n</script>\n' +
  '<script>\nwindow.__HCP_DATA = ' + safeJson(payload) + ';\nwindow.__HCP_DATA.LOGIC = LOGIC;\n</script>\n';
if (!html.includes('</head>')) throw new Error('no </head> in emitted html');
html = html.replace('</head>', () => head + '</head>');

writeFileSync(OUT, html, 'utf8');
console.log('OK: ' + OUT + ' (' + Math.round(Buffer.byteLength(html) / 1024) + ' KiB)');
