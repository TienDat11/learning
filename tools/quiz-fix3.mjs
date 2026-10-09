// tools/quiz-fix3.mjs — replace (not append) the first distractor for the 19 items where
// pass 2 appended a clause. Appending produced tautologies ("...reload module before each
// request and is only rebuilt when the module is imported again"). Each replacement below
// is one coherent wrong-but-plausible explanation, sized just above the correct option so
// "always pick the longest" no longer finds the right answer.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const FILE = join(root, 'src', '20-quiz.js');

const D1 = {
  QZ01: 'Vì list mặc định được dựng đúng một lần khi module được nạp và giữ nguyên suốt vòng đời tiến trình, nên chỉ cần nạp lại module trước mỗi request là mặc định được tạo mới hoàn toàn',
  QZ02: 'GIL chỉ khoá các phép toán trên object Python thuần nên threading vẫn chạy song song được với mọi thư viện, còn asyncio chỉ là lớp cú pháp thay callback nên chọn cách nào cũng được',
  QZ03: 'Tăng số worker uvicorn lên bằng đúng số nhân CPU để mỗi tiến trình nhận một phần ảnh từ hàng đợi và xử lý song song, nhờ đó tận dụng hết số nhân đang bỏ trống',
  QZ04: 'Cả hai loại callback vào cùng một hàng đợi và chạy theo thứ tự đăng ký, nên setTimeout đăng ký trước một Promise sẽ luôn được thực thi trước trong cùng một vòng lặp',
  QZ05: 'let sao chép giá trị vào từng closure ngay lúc khai báo còn var chỉ giữ tham chiếu tới biến, nên với var mọi closure đọc giá trị mới nhất tại thời điểm chúng được gọi',
  QZ06: 'Dùng Promise.all cho mọi lần đổi tab để chờ tất cả request hoàn tất rồi mới ghi state một lần, nhờ vậy không còn lần ghi nào chồng lên lần ghi nào',
  QZ07: 'ref chỉ dùng được cho kiểu nguyên thuỷ còn reactive dùng cho object, hai cách tương đương về reactivity nên việc chọn ref hay reactive chỉ còn là vấn đề sở thích cú pháp',
  QZ08: 'Cả hai nên là computed vì computed hỗ trợ cả side effect lẫn cache kết quả, nên gọi API lưu đơn đặt trong computed sẽ không bị gọi lặp lại khi state đổi',
  QZ09: 'Vue 3 không tự chờ response nên callback của watch chạy song song, cần đổi sang watchEffect vì watchEffect luôn chờ lần chạy trước kết thúc rồi mới chạy tiếp',
  QZ10: 'type guard chỉ hoạt động ở thời gian biên dịch còn as mới là toán tử được kiểm tra lúc chạy, nên as an toàn hơn khi dữ liệu tới từ network và không tin được',
  QZ11: 'Hai cách giống nhau vì await tự chuyển rejection thành giá trị undefined, nên nhánh catch chỉ có tác dụng với lỗi đồng bộ và gần như không bao giờ được dùng',
  QZ12: 'Declare type là Profile rồi dùng non-null assertion, vì dữ liệu do backend của chính team viết ra nên luôn đúng schema và không cần kiểm tra lại ở client',
  QZ13: 'Hai dạng giống hệt nhau về vòng đời và đều chạy đúng một lần cho mỗi request, chỉ khác là yield cho phép ghi giá trị trả về cho endpoint sử dụng',
  QZ14: 'Cả hai cách đều được FastAPI tự động chuyển đổi sang dạng phù hợp nên không có vấn đề gì xảy ra khi trộn hai kiểu khai báo trong cùng một service',
  QZ16: 'Index composite luôn dùng được cho mọi cột bên trong nó nên truy vấn vẫn chạy nhanh, thứ tự cột chỉ quyết định dung lượng mà index chiếm trên đĩa',
  QZ17: 'Vì PostgreSQL ép NULL thành 0 khi so sánh với một số nên điều kiện discount_rate = 0 vẫn đúng, và NULL được xem như giá trị 0 trong mọi phép so sánh',
  QZ18: 'Viết lại toàn bộ truy vấn bằng raw SQL tối ưu thủ công trước khi xem kế hoạch thực thi, vì raw SQL luôn nhanh hơn query builder ở mọi trường hợp',
  QZ19: 'Thêm quyền cho IAM user cá nhân của người deploy, vì Lambda không có execution role riêng mà mượn credential của người gọi nên chỉ cần cấp quyền cho user đó',
  QZ20: 'DynamoDB bị throttling nên SDK phải thử lại nhiều lần với exponential backoff, xử lý bằng cách tăng provisioned capacity của bảng lên gấp đôi để giảm số lần thử lại',
};

const src = readFileSync(FILE, 'utf8');
let out = src;
let done = 0;
const problems = [];

for (const [id, text] of Object.entries(D1)) {
  const idAt = out.indexOf(`id: '${id}'`);
  if (idAt < 0) { problems.push(`${id}: entry not found`); continue; }
  const optAt = out.indexOf('options: [', idAt);
  const endAt = out.indexOf(']', optAt);
  if (optAt < 0 || endAt < 0) { problems.push(`${id}: options not found`); continue; }
  const block = out.slice(optAt, endAt + 1);
  const parts = [...block.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
  if (parts.length !== 4) { problems.push(`${id}: expected 4 options, got ${parts.length}`); continue; }
  parts[1] = text;
  const rebuilt = 'options: [\n' + parts.map((p) => `'${p}'`).join(',\n') + '\n]';
  out = out.slice(0, optAt) + rebuilt + out.slice(endAt + 1);
  done++;
}

if (problems.length) {
  console.error('ABORTED — no file written:\n  ' + problems.join('\n  '));
  process.exit(1);
}
writeFileSync(FILE, out, 'utf8');
console.log(`replaced first distractor in ${done} quiz items`);
