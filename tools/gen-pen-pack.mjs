// language: JavaScript (Node ESM), file: tools/gen-pen-pack.mjs
// Sinh gói dữ liệu thật cho agent Pencil từ src/*.js. Không sửa tay đầu ra.
// Chạy: node tools/gen-pen-pack.mjs > pen-data-pack-2-<ngày>.md
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

// src/*.js gán biến toàn cục; 90-app.js cần DOM nên chạy tới đó sẽ ném lỗi.
// Mọi global dữ liệu (00-60) nằm trước 90-app.js theo thứ tự tên file, nên bỏ qua lỗi là an toàn.
const ctx = createContext({ console, window: {}, document: {} });
for (const f of readdirSync(SRC).filter((f) => f.endsWith('.js')).sort()) {
  try {
    runInContext(readFileSync(join(SRC, f), 'utf8'), ctx, { filename: f, displayErrors: false });
  } catch { /* file cần DOM — bỏ qua */ }
}
const Q = ctx.QUESTIONS || [];
const LESSONS = ctx.LESSONS || [];
const QUIZ = ctx.QUIZ || [];
const MOCKS = ctx.MOCK_SETS || {};
const PLANS = ctx.STUDY_PLANS || {};
const CASE = ctx.CASE_STUDY || { title: '', pitch: '', sections: [] };
const SRC_LIST = ctx.SOURCES || [];
const GI = ctx.GROUP_INTROS || {};
const FLOWS = ctx.FLOW_SVGS || [];
const CHECKED = ctx.SOURCE_CHECKED;
const LOGIC = ctx.LOGIC || {};

// ---- HTML -> text, giữ cấu trúc đoạn / danh sách / đậm / code ----
function htmlToText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(ul|ol)>/gi, '\n')
    .replace(/<strong>(.*?)<\/strong>/gis, '**$1**')
    .replace(/<em>(.*?)<\/em>/gis, '*$1*')
    .replace(/<code>(.*?)<\/code>/gis, '`$1`')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
// Nhãn nút bên trong <svg>: lấy mọi <text> và bỏ thẻ.
function svgLabels(svg) {
  const out = [];
  const re = /<text[^>]*>(.*?)<\/text>/gis;
  let m;
  while ((m = re.exec(String(svg || '')))) {
    const t = m[1].replace(/<[^>]+>/g, '').trim();
    if (t) out.push(t);
  }
  return out;
}
const flowById = (id) => FLOWS.find((f) => f && f.id === id);

// ---- nguyên văn khối "Bắt đầu" (src/90-app.js:876-903), chép tay, có kiểm tra độ dài ----
const INTRO_BULLETS = [
  '<strong>Một lượt ôn = một vòng.</strong> Lọc theo nhóm, trả lời miệng trước khi mở đáp án, xong mới đọc phần giải thích sâu.',
  'Mỗi câu có bốn phần: trả lời miệng 30–60 giây, giải thích sâu, ví dụ code khi có (kèm kết quả đúng và nguyên nhân) và chuỗi hỏi đào sâu.',
  'Đánh dấu <em>Đã nắm</em> hoặc <em>Cần ôn lại</em> ngay dưới mỗi câu. Tiến độ lưu trong trình duyệt; bật “Chỉ hiện câu đánh dấu yếu” để ôn đúng chỗ đứng.',
  'Flashcard luyện nhịp trả lời nhanh, Quiz kiểm tra hiểu bằng trắc nghiệm, Mock interview luyện to nhỏ có đồng hồ đếm ngược.',
  'Case study là một hệ thống duy nhất, đi hết happy path rồi đi hết từng failure mode.',
].map(htmlToText);

const INTRO_PLAN_TAIL = '. Ít thời gian thì chạy kịch bản 6 giờ; có 2–3 ngày thì chạy kịch bản 2 ngày, phần còn lại dùng kịch bản 3 ngày để luyện sâu.';
const INTRO_PLAN = 'Mục “Lịch ôn” có ba kịch bản: ' +
  Object.keys(PLANS).map((k) => PLANS[k].label).join(' · ') + INTRO_PLAN_TAIL;

const INTRO_WEAK = htmlToText(
  'Nền tảng của bạn mạnh ở Django/DRF, FastAPI, React/TypeScript, PostgreSQL, Docker và CI/CD. ' +
  'Hai chỗ cần dựng lại: <strong>AWS</strong> — đường đi của một request qua API Gateway → Lambda/IAM → RDS hoặc DynamoDB → CloudWatch, và khi nào tách việc nặng sang SQS; ' +
  '<strong>Vue 3</strong> — reactivity, computed so với watch, composable, SFC, và cách trả lời khi được hỏi Vue so với React. ' +
  'Đừng né tránh chỗ này: trả lời thẳng “phần này tôi mới ôn sâu gần đây”, rồi nói rõ bạn đã học bằng cách nào và sẽ làm gì với nó trong dự án thật.'
);

const INTRO_DISCLAIMER = [
  'Đây là bộ câu hỏi luyện tập do tôi tự soạn để ôn cho vị trí Fullstack Engineer, không phải bộ câu hỏi phỏng vấn thật của HiTechCloud. Tôi không có và không khẳng định có đề phỏng vấn hay quy trình tuyển dụng nội bộ của công ty.',
  'Ba lớp nội dung, đừng gộp chúng làm một. (a) Yêu cầu trong JD: Python tối thiểu 2 năm, thành thạo VueJS, TypeScript là điểm cộng, AWS Lambda/API Gateway/S3/RDS hoặc DynamoDB, Docker, phát hành tự động, theo dõi logs/metrics/chi phí và xử lý lỗi production. (b) Kiến thức nền tảng: Python, JavaScript/TypeScript, HTTP, SQL, Vue, FastAPI/Django — đúng với mọi công ty, không riêng gì đây. (c) Câu hỏi luyện tập trong tài liệu này: tôi viết để tự kiểm tra, có thể khác hẳn đề thật.',
  'Vì vậy: học để hiểu cơ chế, không học để đoán đề. Câu nào thuộc lớp (a) thì bám sát đúng chữ trong JD; câu nào thuộc lớp (b) thì trả lời bằng cơ chế và tradeoff; và nếu phỏng vấn hỏi thứ không có trong này thì cứ nói thẳng là mình chưa gặp, rồi phân tích từ nền tảng.',
].map(htmlToText);

const P = [];
const w = (s = '') => P.push(s);

const counts = {
  q: Q.length,
  p0: Q.filter((q) => q && q.prio === 'P0').length,
  lessons: LESSONS.length,
  stages: new Set(LESSONS.map((l) => l && l.stage)).size,
  quiz: QUIZ.length,
  mocks: Object.keys(MOCKS).length,
  caseSections: (CASE.sections || []).length,
  sources: SRC_LIST.length,
  flows: FLOWS.length,
  deck: Q.slice().sort((a, b) => (a.prio === 'P0' ? 0 : 9) - (b.prio === 'P0' ? 0 : 9) || a.id.localeCompare(b.id)).length,
};

w('# Gói dữ liệu thật cho agent Pencil — 4 màn còn thiếu');
w('');
w('Sinh bằng script `tools/gen-pen-pack.mjs` đọc trực tiếp `src/*.js`. **Không sửa tay file này.**');
w('Mọi chữ agent vẽ phải chép nguyên văn từ đây. Chữ không có trong đây thì không được vẽ.');
w('');
w('File `.pen`: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen`');
w('Token: chỉ dùng biến `hcp-*` đã có trong file. Font: `$hcp-font` (Be Vietnam Pro), `$hcp-mono` (JetBrains Mono).');
w('');
w('## 0. Số liệu toàn site');
w('');
w('| Đại lượng | Số | Nguồn |');
w('|---|---|---|');
w(`| Câu hỏi | ${counts.q} | \`QUESTIONS.length\` |`);
w(`| Câu P0 | ${counts.p0} | \`QUESTIONS.filter(prio==='P0')\` |`);
w(`| Bài học | ${counts.lessons} | \`LESSONS.length\` |`);
w(`| Chặng | ${counts.stages} | \`new Set(LESSONS.stage)\` |`);
w(`| Quiz | ${counts.quiz} | \`QUIZ.length\` |`);
w(`| Bộ phỏng vấn thử | ${counts.mocks} | \`Object.keys(MOCK_SETS)\` |`);
w(`| Mục case study | ${counts.caseSections} | \`CASE_STUDY.sections.length\` |`);
w(`| Nguồn tham khảo | ${counts.sources} | \`SOURCES.length\` |`);
w(`| Sơ đồ | ${counts.flows} | \`FLOW_SVGS.length\` |`);
w(`| Thẻ flashcard | ${counts.deck} | \`QUESTIONS\` sắp theo P0 rồi id |`);
w('');
w('Số câu mỗi nhóm (chip lọc / bảng nhóm):');
w('');
w('| Nhóm | Tên nhóm | P0 | Tổng |');
w('|---|---|---|---|');
for (const g of Object.keys(GI).sort()) {
  const total = Q.filter((q) => q && q.group === g).length;
  const p0 = Q.filter((q) => q && q.group === g && q.prio === 'P0').length;
  w(`| ${g} | ${GI[g].title} | ${p0} | ${total} |`);
}
w('');
w('---');
w('');
w('## 1. Case study xuyên suốt (`view-case`)');
w('');
w('### Tiêu đề và mở bài (nguyên văn)');
w('');
w('**' + CASE.title + '**');
w('');
w(CASE.pitch);
w('');
w(`### ${counts.caseSections} mục, đúng thứ tự này`);
w('');
w('| # | `h` (tiêu đề hiển thị) | `flow` | Có sơ đồ |');
w('|---|---|---|---|');
(CASE.sections || []).forEach((s, i) => {
  w(`| ${i + 1} | ${s.h} | ${s.flow ? '`' + s.flow + '`' : '—'} | ${s.flow ? 'có' : 'không'} |`);
});
w('');
w('Cột trái màn này là danh sách 17 mục trên. Mục đang chọn là **mục 1 — ' + CASE.sections[0].h + '**.');
w('');
w('### Toàn văn mục 1 — ' + CASE.sections[0].h + ' (vẽ nguyên văn)');
w('');
w(htmlToText(CASE.sections[0].body));
w('');
w('Sơ đồ nhúng trong mục 1 (khung 16:9, chép nguyên nhãn):');
w('');
const f1 = flowById(CASE.sections[0].flow);
if (f1) {
  w('Chú thích: ' + f1.caption);
  w('');
  w('Nhãn trong sơ đồ, đúng thứ tự: ' + svgLabels(f1.svg).join(' · '));
}
w('');
w('### Toàn văn mục 2 — ' + CASE.sections[1].h + ' (chỉ để tham chiếu, không cần vẽ)');
w('');
w(htmlToText(CASE.sections[1].body).slice(0, 1800));
w('');
w('---');
w('');
w('## 2. Nguồn tham khảo (`view-sources`)');
w('');
w('Mở bài nguyên văn: “Chỉ dẫn tài liệu chính thức. Ngày kiểm tra ghi kèm từng mục. Bài blog và diễn đàn không được dùng làm nguồn chính ở đây.”');
w('');
w(`Dòng ngày kiểm tra toàn bộ: “Ngày kiểm tra toàn bộ liên kết: ${String(CHECKED)}.”`);
w('');
w(`Nhóm theo \`SOURCES[].group\`, tiêu đề nhóm lấy từ \`GROUP_INTROS[g].title\`. ${counts.sources} mục trong 8 nhóm:`);
w('');
const byGroup = {};
SRC_LIST.forEach((s) => { if (s) (byGroup[s.group] = byGroup[s.group] || []).push(s); });
for (const g of Object.keys(byGroup).sort()) {
  const items = byGroup[g];
  w(`### Nhóm ${g} — ${GI[g] ? GI[g].title : 'Nhóm ' + g} (${items.length} mục)`);
  w('');
  items.forEach((s) => w(`- [${s.name}](${s.url}) — \`${s.group} · kiểm tra ${s.checked}\``));
  w('');
}
w('---');
w('');
w('## 3. Flashcard (`view-flashcard`)');
w('');
w('Mở bài nguyên văn: “Đọc câu hỏi, trả lời miệng, rồi mới bật đáp án. Tự chấm: *biết* hoặc *yếu* — trạng thái lưu vào tiến độ.”');
w('');
w('Dòng phím tắt nguyên văn: “Space hiện đáp án · ← → đổi câu · 1 biết · 2 yếu · / tìm kiếm” (mỗi phím là một `<kbd>`).');
w('');
w('Năm nhãn nút, nguyên văn: “Hiện đáp án” · “← Câu trước” · “Câu sau →” · “Đã nắm” · “Cần ôn lại”.');
w('');
const deck = Q.slice().sort((a, b) => (a.prio === 'P0' ? 0 : 9) - (b.prio === 'P0' ? 0 : 9) || a.id.localeCompare(b.id));
const card = deck[0];
w(`Thẻ đầu tiên của bộ (${counts.deck} thẻ, sắp P0 trước rồi theo id): \`${card.id}\`.`);
w('');
w('Hàng meta trên thẻ, đúng thứ tự 6 chip: `' + card.id + '` · `' + card.prio + '` · `' + card.group + '` · `' + card.level + '` · ' + card.topic + ' · trạng thái.');
w('');
w('Mặt trước (câu hỏi), nguyên văn:');
w('');
w('> ' + String(card.q).replace(/\n+/g, ' '));
w('');
w('Mặt sau (đáp án) gồm các khối có nhãn, đúng thứ tự này, và chỉ hiện khi câu có dữ liệu:');
w('');
w('1. `Trả lời miệng 30–60 giây` — đoạn văn.');
w('2. `Giải thích sâu` — HTML.');
w('3. `Kết quả đúng và nguyên nhân` — đoạn văn (khối có class `expected`).');
w('');
w('Hàng meta trên thẻ còn có chip trạng thái, một trong bốn nhãn: `Chưa học` · `Đang ôn` · `Đã nắm` · `Yếu`.');
w('Ô đếm tiến độ ghi `Câu <i>/<N>`. Nút đổi nhãn theo trạng thái: khi đáp án đang mở thì nút là `Ẩn đáp án`, khi đang đóng là `Hiện đáp án`.');
w('');
w('Đoạn đầu mặt sau của thẻ ' + card.id + ', nguyên văn:');
w('');
w(htmlToText(card.oral).slice(0, 900));
w('');
w('---');
w('');
w('## 4. Bắt đầu: cách dùng tài liệu này (`view-intro`)');
w('');
w('Tiêu đề trang: “Bắt đầu: cách dùng tài liệu này”. Không có mở bài.');
w('');
w('### 5 đề mục, đúng thứ tự');
w('');
w('**Đề mục 1 — `Cách dùng`** (danh sách 5 gạch đầu dòng):');
w('');
INTRO_BULLETS.forEach((b) => w('- ' + b));
w('');
w('**Đề mục 2 — `Lịch ôn`** (một đoạn văn):');
w('');
w(INTRO_PLAN);
w('');
w('**Đề mục 3 — `Nói thẳng về điểm yếu`** (một khối `note`):');
w('');
w(INTRO_WEAK);
w('');
w('**Đề mục 4 — `Tài liệu này là gì và không là gì`** (một khối `note` chứa danh sách 3 gạch đầu dòng):');
w('');
INTRO_DISCLAIMER.forEach((b) => w('- ' + b));
w('');
w('**Đề mục 5 — `Mười nhóm kiến thức`** (bảng 10 dòng, 4 cột `Nhóm` · `Vì sao phải biết` · `P0` · `Số câu`):');
w('');
w('| Nhóm | Vì sao phải biết | P0 | Số câu |');
w('|---|---|---|---|');
for (const g of Object.keys(GI).sort()) {
  const total = Q.filter((q) => q && q.group === g).length;
  const p0 = Q.filter((q) => q && q.group === g && q.prio === 'P0').length;
  w(`| ${GI[g].title} | ${GI[g].why} | ${p0} | ${total} |`);
}
w('');
w('---');
w('');
w('## 5. Sơ đồ dùng trong case study và bài học');
w('');
w('13 sơ đồ. Mỗi sơ đồ là SVG vector, tự đổi màu theo theme. Trong màn case study chỉ nhúng sơ đồ của mục đang chọn.');
w('');
w('| `id` | Chú thích |');
w('|---|---|');
FLOWS.forEach((f) => w(`| \`${f.id}\` | ${f.caption} |`));
w('');
w('Nhãn từng sơ đồ (dùng khi vẽ lại):');
w('');
FLOWS.forEach((f) => {
  w(`- \`${f.id}\`: ${svgLabels(f.svg).join(' · ')}`);
});
w('');
w('---');
w('');
w('## 6. Nhãn được phép và bị cấm');
w('');
w('Nhãn dùng được ở 4 màn mới (nguyên văn, đã đối chiếu `assets/body.html` + `src/90-app.js`):');
w('');
w('- Case study: `Case study xuyên suốt` · mở bài “Ứng dụng quản lý tài liệu: Vue 3 · Python API · PostgreSQL · S3 · SQS worker · Docker/CI-CD. Đi hết happy path rồi đi hết từng failure mode.” · tiêu đề + mở bài ở trên · 17 nhãn mục.');
w('- Nguồn: `Nguồn tham khảo` · mở bài ở trên · 8 tiêu đề nhóm · mỗi mục là tên nguồn kèm `<nhóm> · kiểm tra <ngày>`.');
w('- Flashcard: `Flashcard` · mở bài · dòng phím tắt · 5 nhãn nút ở trên.');
w('- Bắt đầu: `Bắt đầu: cách dùng tài liệu này` · 5 đề mục ở trên.');
w('- Thanh điều hướng 5 mục, giống hệt các màn đã có: `Trang chủ` · `Ngày học` · `Ôn câu hỏi` · `Quiz` · `Phỏng vấn thử`.');
w('');
w('Không có nguồn — không được vẽ: mọi chữ tự đặt, mọi số tự bịa, mọi tên tài liệu không nằm trong mục 2, mọi nhãn trạng thái không nằm trong danh sách trên.');

process.stdout.write(P.join('\n') + '\n');
