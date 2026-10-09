// tools/verify-claims.mjs — execute the question bank's own runnable Python/JS examples
// and diff observed output against the documented `expected` text. Read-only.
//
// The brief asserted specific defects (closure late binding, comprehension cells,
// tuple-immutability-implies-hashability, where defaults are stored). This harness
// reproduces the file's actual snippets so the claims can be judged on evidence.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const src = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).sort();
const APP_JS = src.map((f) => `\n/* ==== src/${f} ==== */\n${readFileSync(join(root, 'src', f), 'utf8')}`).join('\n');
const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], hidden: false, value: '', textContent: '', innerHTML: '', setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {}, blur() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {} });
const mkDoc = () => ({ addEventListener() {}, removeEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };
const loader = new Function('document', 'window', 'localStorage', 'navigator', 'console', APP_JS + '\n;return {QUESTIONS};');
const { QUESTIONS } = loader(mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } }, store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} });

const outDir = join(root, '.scratch', 'verify');
mkdirSync(outDir, { recursive: true });

const only = process.argv.slice(2);
const targets = QUESTIONS.filter((q) => typeof q.code === 'string' && q.code.trim() &&
  (!only.length || only.includes(q.id)));

let ran = 0, matched = 0, mismatched = [], skipped = [];

for (const q of targets) {
  const isPy = q.group === 'A' || /\bdef |\bimport |print\(/.test(q.code);
  const isJs = q.group === 'B' || /console\.log|=>|const |let /.test(q.code);
  const ext = isPy ? 'py' : isJs ? 'mjs' : null;
  if (!ext) { skipped.push(`${q.id}: language not recognised`); continue; }
  const file = join(outDir, `${q.id}.${ext}`);
  writeFileSync(file, q.code, 'utf8');
  const bin = isPy ? (process.env.PYTHON || 'python') : process.execPath;
  const r = spawnSync(bin, [file], { encoding: 'utf8', timeout: 20000 });
  if (r.error || (r.status !== 0 && !r.stdout)) {
    skipped.push(`${q.id}: did not run standalone (${(r.error && r.error.code) || 'exit ' + r.status})`);
    continue;
  }
  ran++;
  const observed = (r.stdout || '').trim();
  console.log(`\n=== ${q.id} [${ext}] exit=${r.status} ===`);
  console.log('--- observed ---');
  console.log(observed || '(no output)');
  console.log('--- documented expected (first 400 chars) ---');
  console.log(String(q.expected || '').slice(0, 400));
}

console.log(`\n\nran=${ran} skipped=${skipped.length}`);
if (skipped.length) { console.log('SKIPPED:'); for (const s of skipped) console.log('  ' + s); }
