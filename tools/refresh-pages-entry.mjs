// tools/refresh-pages-entry.mjs — make index.html (the GitHub Pages entry) an exact copy
// of the freshly built artifact, but refuse to do it blindly: it first proves that the
// current index.html is the same application, not a different variant, so nothing unique
// is destroyed. Read + write to index.html only.
import { readFileSync, writeFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const TARGET = new URL('hitechcloud-interview-prep.html', root);
const ENTRY = new URL('index.html', root);

const target = readFileSync(TARGET, 'utf8');
const entry = readFileSync(ENTRY, 'utf8');

// The markup shell (everything before the JS bundle) must match, apart from whitespace
// differences that the build itself introduces. If it does not, the two files are not the
// same application and this script must not overwrite the entry file.
const shell = (h) => {
  const cut = h.indexOf('/* ==== src/00-bootstrap.js ==== */');
  return (cut > -1 ? h.slice(0, cut) : h).replace(/\s+/g, ' ').trim();
};

const files = () => {
  const a = shell(target);
  const b = shell(entry);
  return { same: a === b, aLen: a.length, bLen: b.length };
};

const { same, aLen, bLen } = files();
console.log('target bytes : ' + statSync(TARGET).size);
console.log('entry  bytes : ' + statSync(ENTRY).size);
console.log('markup shell : target=' + aLen + ' entry=' + bLen + ' identical=' + same);

if (!same) {
  console.error('REFUSING: the markup shell differs, so index.html is not the same app.');
  console.error('Sample of target shell : ' + shell(target).slice(0, 200));
  console.error('Sample of entry  shell : ' + shell(entry).slice(0, 200));
  process.exit(1);
}

const checks = [
  /data-view="learn"/, /id="view-learn"/, /data-view="questions"/, /id="view-questions"/,
  /data-view="sources"/, /id="theme-btn"/, /id="mock-start"/, /id="quiz-submit"/,
];
for (const c of checks) {
  if (!c.test(target)) { console.error('REFUSING: target is missing ' + c); process.exit(1); }
}

writeFileSync(ENTRY, target, 'utf8');
const after = readFileSync(ENTRY, 'utf8');
console.log('');
console.log('wrote index.html: ' + statSync(ENTRY).size + ' bytes');
console.log('byte-identical to the artifact: ' + (after === target));
console.log('carries the depth layer        : ' + /Thử đoán trước khi đọc tiếp/.test(after));
