// tools/depth-audit.mjs — score every P0 question against the nine-dimension
// interview-depth contract, using the text the learner actually reads
// (deep + followups + attacks + the pedagogical fields).
//
// The point is to find P0 topics where the material still cannot support a reasoned
// answer to a changed condition, not to produce a vanity score.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const src = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).sort();
const APP_JS = src.map((f) => `\n/* ==== src/${f} ==== */\n${readFileSync(join(root, 'src', f), 'utf8')}`).join('\n');
const mkEl = () => ({ style: { setProperty() {}, removeProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, children: [], hidden: false, value: '', textContent: '', innerHTML: '', setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {}, blur() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, contains: () => false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), scrollIntoView() {} });
const mkDoc = () => ({ addEventListener() {}, removeEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl() });
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => Array.from(m.keys())[i] ?? null, get length() { return m.size; } }; };
const loader = new Function('document', 'window', 'localStorage', 'navigator', 'console', APP_JS + '\n;return {QUESTIONS};');
const { QUESTIONS } = loader(mkDoc(), { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: '' } }, store(), { userAgent: 'node', clipboard: { writeText: async () => {} } }, { log() {}, warn() {}, error() {} });

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').toLowerCase();
const textOf = (q) => {
  const parts = [q.q, q.oral, q.deep, q.expected, q.incident, q.rootCause, q.tradeoff, q.alternatives, q.observe, q.anchor,
    ...(q.followups || []).flatMap((f) => [f && f.q, f && f.a]),
    ...(q.attacks || []).flatMap((a) => [a && a.q, a && a.a]),
    ...(q.pitfalls || []), ...(q.selfcheck || [])];
  return strip(parts.filter(Boolean).join(' \n '));
};

const DIM = {
  'WHAT (định nghĩa)': [/là gì|định nghĩa|khái niệm|bản chất/],
  'WHY (vì sao tồn tại)': [/vì sao|tại sao|do đâu|nguyên nhân|lý do/],
  'WITHOUT (không có nó thì sao)': [/không có|nếu không|thiếu|trước khi có|thay vì/],
  'HOW (cơ chế bên trong)': [/cơ chế|bên trong|thực chất|hoạt động|đánh giá|thực thi|triển khai/],
  'FAILURE (hỏng dưới tải/lỗi)': [/lỗi|hỏng|thất bại|race|deadlock|timeout|sập|treo|trùng|mất/],
  'TRADE-OFF (đánh đổi)': [/đánh đổi|trade|cái giá|chi phí|tốn|hy sinh/],
  'ALTERNATIVE (cách khác)': [/thay thế|cách khác|lựa chọn khác|hoặc dùng|thay vì dùng|phương án/],
  'SIGNAL (quan sát production)': [/metric|log|trace|theo dõi|giám sát|cảnh báo|explain|đo |quan sát|dashboard|chỉ số/],
  'CHANGED (đổi giả định)': [/nếu |khi nào|thay đổi|tăng lên|gấp|hàng nghìn|đồng thời|10\.000|1\.000|quy mô|tải cao/],
};

const rows = [];
for (const q of QUESTIONS) {
  if (q.prio !== 'P0') continue;
  const t = textOf(q);
  const miss = Object.entries(DIM).filter(([, res]) => !res.some((re) => re.test(t))).map(([k]) => k);
  rows.push({ id: q.id, group: q.group, topic: q.topic, miss, chars: t.length });
}

const incomplete = rows.filter((r) => r.miss.length);
console.log(`P0 questions: ${rows.length}`);
console.log(`fully covering all 9 dimensions: ${rows.length - incomplete.length}`);
console.log(`with at least one gap: ${incomplete.length}\n`);
for (const r of incomplete) console.log(`  ${r.id} [${r.group}] ${r.topic}\n      missing: ${r.miss.join(' | ')}`);
console.log('\ntext volume per P0 question (stripped chars): min=%d median=%d max=%d',
  Math.min(...rows.map((r) => r.chars)),
  rows.map((r) => r.chars).sort((a, b) => a - b)[Math.floor(rows.length / 2)],
  Math.max(...rows.map((r) => r.chars)));
