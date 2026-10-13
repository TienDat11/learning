import fs from 'node:fs';
import path from 'node:path';
const dir = 'D:/research/diagrams-v2/diagrams';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
const allIds = new Map();
const report = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  const flowId = f.replace(/\.mobile\.svg$|\.svg$/, '');
  const problems = [];
  const stack = [];
  const re = /<\/?([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;
  let m;
  while ((m = re.exec(s))) {
    const tag = m[0];
    if (tag.startsWith('</')) { const top = stack.pop(); if (top !== m[1]) problems.push(`tag lệch: ${top} vs ${m[1]}`); }
    else if (!m[2]) stack.push(m[1]);
  }
  if (stack.length) problems.push('thẻ chưa đóng: ' + stack.join(','));
  if (!s.startsWith('<svg')) problems.push('không bắt đầu bằng <svg');
  for (const bad of ['<script', '<foreignObject', '<style', 'href="http', '<animate', 'xlink:href="http', 'url(http', '<image']) if (s.includes(bad)) problems.push('cấm: ' + bad);
  const sizes = [...s.matchAll(/font-size="([\d.]+)"/g)].map(x => +x[1]);
  const minFs = Math.min(...sizes);
  if (minFs < 14) problems.push('font-size nhỏ nhất ' + minFs);
  if (!/<title id="[^"]+">/.test(s) || !/<desc id="[^"]+">/.test(s)) problems.push('thiếu title/desc');
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map(x => x[1]);
  for (const id of ids) {
    if (!id.startsWith(flowId + '-')) problems.push('id thiếu tiền tố: ' + id);
    if (allIds.has(id)) problems.push(`trùng id với ${allIds.get(id)}: ${id}`);
    else allIds.set(id, f);
  }
  const hasSvgOnly = !/<svg[^>]*width=/.test(s);
  const textCount = (s.match(/<text /g) || []).length;
  const vb = s.match(/viewBox="([^"]+)"/)[1];
  const texts = [...s.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map(x => x[1]);
  const longLabels = texts.filter(t => t.split(' ').length > 3 && !/^(Access|Keep|Trần|Batching|Chỉ|Không|Retry|Deadlock|Môi trường|Poll|Init chạy|Client PUT|Preflight|Request thật|Cơ sở|Phòng)/.test(t));
  report.push({ file: f, viewBox: vb, minFontSize: minFs, textNodes: textCount, problems, longLabels });
}
console.log(JSON.stringify(report, null, 1));
console.log('total ids', allIds.size);
