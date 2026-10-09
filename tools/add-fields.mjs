// tools/add-fields.mjs — insert pedagogical fields into question objects.
//
// Usage: node tools/add-fields.mjs tools/content/<batch>.mjs
//
// The batch module default-exports { <questionId>: { <field>: <value>, ... } }.
// Fields are serialised with JSON.stringify (double-quoted), so a stray apostrophe
// inside authored Vietnamese can never terminate a single-quoted JS string and break
// the bundle — the failure mode that bit an earlier repair round.
//
// Each block is inserted immediately after the `type: '...',` line of the target
// question, mirroring the field order the P0 questions already use.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const SRC = join(root, 'src');

const batchPath = process.argv[2];
if (!batchPath) { console.error('usage: node tools/add-fields.mjs <batch.mjs>'); process.exit(2); }
const mod = await import(pathToFileURL(resolve(batchPath)).href);
const CONTENT = mod.default || mod;

const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
const read = new Map(files.map((f) => [f, readFileSync(join(SRC, f), 'utf8')]));

const problems = [];
const plan = []; // { file, id, insertAfterLine }

for (const [id, fields] of Object.entries(CONTENT)) {
  let hit = null;
  for (const [f, text] of read) {
    const lines = text.split('\n');
    const idLine = lines.findIndex((l) => l.trim() === `id: '${id}',`);
    if (idLine < 0) continue;
    // the question's own `type:` line is the first one after its id. Indentation is
    // not uniform across src files (some use none, some four spaces), so match on the
    // trimmed content and reuse whatever indent that line carries.
    const typeLine = lines.findIndex((l, i) => i > idLine && /^\s*type: '/.test(l));
    if (typeLine < 0) { problems.push(`${id}: no type: line after id (${f})`); continue; }
    const indent = /^(\s*)/.exec(lines[typeLine])[1];
    // sanity: the next id after typeLine must not appear before it
    hit = { f, idLine, typeLine, indent };
    break;
  }
  if (!hit) { if (!problems.some((p) => p.startsWith(id + ':'))) problems.push(`${id}: id line not found in any src file`); continue; }

  const block = Object.entries(fields).map(([k, v]) => `${hit.indent}${k}: ${JSON.stringify(v)},`);
  for (const line of block) {
    if (line.includes('\n')) { problems.push(`${id}.${line.split(':')[0]}: serialised value contains a raw newline`); }
  }
  plan.push({ ...hit, id, block });
}

if (problems.length) {
  console.error('ABORTED — no file written:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// Apply from the bottom of each file upward so earlier line numbers stay valid.
const byFile = new Map();
for (const p of plan) {
  if (!byFile.has(p.f)) byFile.set(p.f, []);
  byFile.get(p.f).push(p);
}
let total = 0;
for (const [f, items] of byFile) {
  const lines = read.get(f).split('\n');
  items.sort((a, b) => b.typeLine - a.typeLine);
  for (const it of items) {
    lines.splice(it.typeLine + 1, 0, ...it.block);
    total += it.block.length;
  }
  writeFileSync(join(SRC, f), lines.join('\n'), 'utf8');
  console.log(`${f}: inserted ${items.length} question block(s)`);
}
console.log(`fields inserted: ${total} across ${plan.length} questions`);
