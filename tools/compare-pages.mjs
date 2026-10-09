// tools/compare-pages.mjs — compare the Pages entry file against the built artifact.
import { readFileSync } from 'node:fs';

for (const f of ['hitechcloud-interview-prep.html', 'index.html']) {
  const h = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  const uniq = (a) => [...new Set(a)].join(', ') || '(none)';
  console.log('--- ' + f + '  bytes=' + Buffer.byteLength(h, 'utf8'));
  console.log('    data-view values : ' + uniq([...h.matchAll(/data-view="([a-z]+)"/g)].map((m) => m[1])));
  console.log('    id="view-*"      : ' + uniq([...h.matchAll(/id="view-([a-z]+)"/g)].map((m) => m[1])));
  console.log('    "Lộ trình học"   : ' + /Lộ trình học/.test(h));
  console.log('    var LESSONS      : ' + /var LESSONS/.test(h));
  console.log('    depth labels     : ' + /Thử đoán trước khi đọc tiếp/.test(h));
  console.log('    lesson block     : ' + /Nguyên nhân gốc/.test(h));
  console.log('    gen title        : ' + ((h.match(/<title>([^<]+)<\/title>/) || [])[1] || '(none)'));
}
