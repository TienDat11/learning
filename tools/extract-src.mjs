// extract-src.mjs — reverse of build.mjs: split the bundle out of the built HTML
// back into src/*.js. Round-trip must be byte-identical, otherwise src/ is not the
// source of truth for the shipped file.
//
// build.mjs builds:  APP_JS = parts.map(p => `\n/* ==== src/${p.f} ==== */\n${p.code}`).join('\n')
// so splitting on the marker with the surrounding newlines is exact and lossless.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const HTML = join(root, 'hitechcloud-interview-prep.html');
const SRC = join(root, 'src');

const html = readFileSync(HTML, 'utf8');
const start = html.lastIndexOf('<script>');
const end = html.lastIndexOf('</script>');
if (start < 0 || end < 0) throw new Error('no <script> block found');
let bundle = html.slice(start + '<script>'.length, end);
if (bundle.startsWith('\n')) bundle = bundle.slice(1);
if (bundle.endsWith('\n')) bundle = bundle.slice(0, -1);
// NOTE: do NOT undo escScript(). escScript turns a literal `</script` into `<\/script`,
// but valid source already contains `<\/script` inside regex literals
// (e.g. /<script[\s\S]*?<\/script>/gi). The two are indistinguishable, and escScript is
// idempotent, so leaving the escape in place round-trips exactly.

const chunks = bundle.split(/\n\/\* ==== src\/([^ ]+) ==== \*\/\n/);
if (chunks.length < 3) throw new Error('no src markers found — not a build.mjs output');

mkdirSync(SRC, { recursive: true });
let n = 0;
let total = 0;
for (let i = 1; i < chunks.length; i += 2) {
  const name = chunks[i];
  let code = chunks[i + 1];
  const isLast = i + 2 >= chunks.length;
  if (!isLast) code = code.replace(/\n$/, ''); // drop the join separator
  writeFileSync(join(SRC, name), code, 'utf8');
  total += code.length;
  n++;
  console.log(`wrote src/${name} (${code.length} chars)`);
}
console.log(`files=${n} chars=${total}`);
