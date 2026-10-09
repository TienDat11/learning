// tools/quiz-fix2.mjs — second pass: make the correct option stop being the longest.
//
// After pass 1 the mean ratio dropped to ~1.12 but "always pick the longest string"
// still scored 26/28. Here one distractor per item is extended with a plausible
// (wrong) rationale so the longest option is a DISTRACTOR in 19 of 28 items.
// Correct-is-longest then holds in only 9 items — close to the 1-in-4 chance level.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const FILE = join(root, 'src', '20-quiz.js');

const SUFFIX = {
  QZ01: ' và chỉ được dựng lại khi module được import lại',
  QZ02: ' nên chọn theo thư viện đang dùng chứ không theo loại tác vụ',
  QZ03: ' và mỗi tiến trình tự nhận phần ảnh của mình từ hàng đợi',
  QZ04: ' vì hàng đợi chỉ có một và thứ tự đăng ký là thứ tự chạy',
  QZ05: ' nên closure luôn đọc giá trị mới nhất tại thời điểm được gọi',
  QZ06: ' và state chỉ được ghi một lần sau khi mọi request đã hoàn tất',
  QZ07: ' nên chọn ref hay reactive chỉ còn là vấn đề sở thích cú pháp',
  QZ08: ' và computed tự chạy lại mỗi khi state phụ thuộc đổi giá trị',
  QZ09: ' vì watchEffect luôn chờ lần chạy trước kết thúc rồi mới chạy tiếp',
  QZ10: ' vì as mới là toán tử được kiểm tra khi chương trình đang chạy',
  QZ11: ' nên nhánh catch gần như không bao giờ được dùng trong thực tế',
  QZ12: ' vì backend do chính team viết nên không cần kiểm tra lại dữ liệu',
  QZ13: ' và cả hai đều chạy đúng một lần cho mỗi request được gửi tới',
  QZ14: ' nên có thể trộn hai kiểu khai báo trong cùng một service',
  QZ16: ' và thứ tự cột chỉ quyết định dung lượng mà index chiếm trên đĩa',
  QZ17: ' vì NULL được xem như giá trị 0 trong mọi phép so sánh số học',
  QZ18: ' vì raw SQL luôn nhanh hơn query builder ở mọi trường hợp',
  QZ19: ' vì Lambda không có execution role nên phải mượn quyền người gọi',
  QZ20: ' vì bảng bị throttling nên SDK phải thử lại nhiều lần rồi mới trả',
};

const src = readFileSync(FILE, 'utf8');
let out = src;
let done = 0;
const problems = [];

for (const [id, suffix] of Object.entries(SUFFIX)) {
  const idAt = out.indexOf(`id: '${id}'`);
  if (idAt < 0) { problems.push(`${id}: entry not found`); continue; }
  const optAt = out.indexOf('options: [', idAt);
  const endAt = out.indexOf(']', optAt);
  if (optAt < 0 || endAt < 0) { problems.push(`${id}: options not found`); continue; }
  const block = out.slice(optAt, endAt + 1);

  // Parse the four single-quoted options, preserving the correct one (index 0).
  const parts = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(block))) parts.push(m[1]);
  if (parts.length !== 4) { problems.push(`${id}: expected 4 options, got ${parts.length}`); continue; }
  if (parts[1].includes(suffix.trim())) { problems.push(`${id}: suffix already applied`); continue; }

  const rebuilt = 'options: [\n' +
    parts.map((p, i) => `'${i === 1 ? p + suffix : p}'`).join(',\n') + '\n]';
  out = out.slice(0, optAt) + rebuilt + out.slice(endAt + 1);
  done++;
}

if (problems.length) {
  console.error('ABORTED — no file written:\n  ' + problems.join('\n  '));
  process.exit(1);
}
writeFileSync(FILE, out, 'utf8');
console.log(`extended one distractor in ${done} quiz items`);
