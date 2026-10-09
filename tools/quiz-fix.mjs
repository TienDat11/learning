// tools/quiz-fix.mjs — replace quiz distractors (options[1..3]) with length-balanced,
// misconception-based alternatives. The correct option (index 0) and `explain` are
// preserved byte-for-byte, so `answer: 0` stays valid.
//
// Why: measured on the evaluated bundle, the correct option was the LONGEST of the four
// in 28/28 items (mean ratio 1.47, worst 2.42). A learner could score 28/28 by always
// picking the longest string without reading the question. Each replacement below is a
// misconception a real candidate holds, sized to within ~15% of the correct option.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]tools$/, '');
const FILE = join(root, 'src', '20-quiz.js');

const NEW = {
  QZ01: [
    'Vì list mặc định được gắn vào chính object hàm và chỉ khởi tạo lại khi module được import lại, sửa bằng cách reload module trước mỗi request',
    'Vì Python truyền list theo tham chiếu nên hàm giữ luôn list của lần gọi đầu tiên, sửa bằng cách deepcopy tham số ở đầu thân hàm',
    'Vì list rỗng là một singleton dùng chung trong toàn bộ interpreter, sửa bằng cách khởi tạo bằng list() thay vì bằng ngoặc vuông',
  ],
  QZ02: [
    'GIL chỉ khoá các phép toán trên object Python thuần nên threading luôn song song được với mọi thư viện, còn asyncio chỉ để thay callback',
    'GIL được nhả ra khi có I/O nên threading và asyncio tương đương nhau về chi phí, chọn cách nào cũng được miễn driver hỗ trợ async',
    'GIL không tồn tại trong tiến trình có nhiều luồng nên threading luôn nhanh hơn asyncio khi số kết nối chờ tăng lên vài nghìn',
  ],
  QZ03: [
    'Tăng số worker uvicorn lên bằng đúng số nhân CPU để mỗi tiến trình nhận một phần ảnh và chạy song song hết mức có thể',
    'Bọc hàm xử lý trong async def rồi await trực tiếp để event loop tự chia thời gian cho các ảnh đang chờ trong hàng đợi',
    'Tăng giới hạn threadpool của Starlette lên 200 để các tác vụ xử lý ảnh không phải xếp hàng chờ nhau trước khi chạy',
  ],
  QZ04: [
    'Cả hai vào cùng một hàng đợi và chạy theo thứ tự đăng ký, nên setTimeout đăng ký trước một Promise sẽ được chạy trước',
    'Promise callback vào macrotask queue còn setTimeout vào microtask queue nên setTimeout luôn chạy trước mọi Promise',
    'Cả hai vào microtask queue nhưng setTimeout được ưu tiên vì có độ trễ xác định do timer của runtime quyết định',
  ],
  QZ05: [
    'let sao chép giá trị vào closure ngay lúc khai báo, còn var giữ tham chiếu tới biến nên giá trị bị ghi đè khi vòng lặp kết thúc',
    'let tạo scope theo khối còn var tạo scope theo hàm, nên closure tạo bằng var không giữ được biến nào và luôn trả về undefined',
    'Cả hai đều giữ đúng giá trị ở mỗi vòng, khác biệt chỉ là let tạo biến bất biến nên không thể bị gán lại sau khi khai báo',
  ],
  QZ06: [
    'Dùng Promise.all cho mọi lần đổi tab để chờ tất cả request xong rồi mới cập nhật state một lần, tránh tranh chấp giữa các lần gọi',
    'Chuyển sang XHR synchronous để trình duyệt chặn cho tới khi có response, nhờ vậy thứ tự trả về luôn khớp với thứ tự gọi',
    'Giữ nguyên các request đang bay và chỉ gán state khi tất cả đã hoàn tất, để request treo không ghi đè dữ liệu mới hơn',
  ],
  QZ07: [
    'ref chỉ dùng được cho kiểu nguyên thuỷ còn reactive dùng cho object, hai cách tương đương về reactivity nên chọn theo kiểu dữ liệu',
    'ref dùng Proxy còn reactive dùng getter setter, nên chỉ ref mới theo dõi được thuộc tính lồng nhau và mới hỗ trợ shallowRef',
    'Cả hai đều dùng Proxy và đều mất reactivity khi destructure, khác biệt chỉ nằm ở cú pháp khai báo và cách template mở gói',
  ],
  QZ08: [
    'Cả hai nên là computed vì computed hỗ trợ cả side effect và tự cache kết quả nên không gọi API lặp lại khi state đổi',
    'Cả hai nên là watch vì watch mới cache được giá trị tính ra, còn computed chạy lại mỗi lần template render lại',
    'Cả hai nên là hàm gọi trực tiếp trong template để Vue tự theo dõi phụ thuộc và tự quyết định khi nào cần tính lại',
  ],
  QZ09: [
    'Vue 3 không tự chờ response nên callback của watch chạy song song, cần đổi sang watchEffect để các lần chạy được tuần tự hoá',
    'Debounce 300ms đặt sai chỗ nên phải đặt debounce bên ngoài watch thay vì trong callback, để mỗi phím gõ không tạo request',
    'Backend trả kết quả sai thứ tự nên cần sắp xếp lại theo created_at trước khi hiển thị, và thêm phân trang cho danh sách kết quả',
  ],
  QZ10: [
    'type guard chỉ hoạt động ở thời gian biên dịch còn as có kiểm tra lúc chạy, nên as an toàn hơn khi dữ liệu tới từ network',
    'Hai cách cho cùng kết quả sau biên dịch, type guard chỉ cần khai báo trong interface còn as dùng được trong mọi biểu thức',
    'type guard chỉ dùng được với union của primitive còn as là cách duy nhất thu hẹp unknown, nên với object phải dùng as',
  ],
  QZ11: [
    'Hai cách giống nhau vì await tự chuyển rejection thành giá trị undefined, nên try/catch chỉ có tác dụng với lỗi đồng bộ',
    'await biến Promise thành callback nên try/catch không bắt được lỗi mạng, phải dùng .catch gắn trực tiếp vào Promise',
    'Chỉ có try/catch mới chạy được trong async function, còn await bên ngoài try/catch sẽ bị treo cho tới khi có timeout',
  ],
  QZ12: [
    'Declare type là Profile rồi dùng non-null assertion, vì dữ liệu do backend của chính team trả về nên luôn đúng schema',
    'Chuyển thẳng vào component rồi dùng optional chaining ở mọi chỗ truy cập, không cần kiểm tra kiểu tập trung ở biên',
    'Dùng any cho field đó để linh hoạt rồi ép kiểu tại chỗ dùng, vì any không gây lỗi biên dịch và dễ đổi khi API thay đổi',
  ],
  QZ13: [
    'Hai dạng giống hệt nhau về vòng đời, chỉ khác là yield cho phép ghi giá trị trả về cho request và return thì không',
    'Dependency dạng yield chạy sau khi response đã gửi tới client nên không dùng để đóng session được, phải dùng return',
    'Chỉ dependency dạng return mới được Depends cache lại, còn dạng yield luôn chạy lại mỗi lần được yêu cầu trong request',
  ],
  QZ14: [
    'Cả hai cách đều được FastAPI tự động chuyển đổi sang dạng phù hợp nên không có vấn đề gì xảy ra khi trộn hai kiểu',
    'Chỉ async def gọi SDK sync mới gây nghẽn, còn def gọi await chỉ sinh cảnh báo chứ vẫn chạy đúng và trả kết quả',
    'Hai cách đều an toàn vì FastAPI cấp một thread riêng cho từng request nên blocking ở đâu cũng không ảnh hưởng nhau',
  ],
  QZ15: [
    'Tăng kích thước connection pool và timeout của database để các câu SELECT chạy song song thay vì xếp hàng chờ nhau',
    'Thêm index cho mọi cột của cả hai bảng để mỗi câu SELECT nhanh hơn, tổng thời gian giảm theo số câu truy vấn',
    'Cache toàn bộ endpoint bằng Redis ở lần gọi đầu để các lần sau không phải chạy lại chuỗi truy vấn giống nhau',
  ],
  QZ16: [
    'Index composite luôn dùng được cho mọi cột bên trong nên truy vấn vẫn nhanh, thứ tự cột chỉ ảnh hưởng dung lượng lưu',
    'PostgreSQL tự sinh thêm index riêng cho từng cột trong composite index nên lọc theo cột nào cũng được tối ưu',
    'Index chỉ hoạt động với điều kiện IN hoặc so sánh bằng, còn lọc theo khoảng thời gian thì buộc phải quét tuần tự',
  ],
  QZ17: [
    'Vì PostgreSQL ép NULL thành 0 khi so sánh với một số nên điều kiện discount_rate = 0 vẫn đúng và dòng vẫn được trả về',
    'Vì NULL bị index bỏ qua nên planner chọn sai kế hoạch và cần chạy ANALYZE định kỳ để thống kê được cập nhật lại',
    'Vì so sánh với NULL luôn trả về FALSE nên dòng bị loại, muốn lấy phải đổi điều kiện thành = ANY hoặc dùng IN',
  ],
  QZ18: [
    'Viết lại toàn bộ truy vấn bằng raw SQL tối ưu thủ công trước khi xem kế hoạch thực thi của planner hiện tại',
    'Tăng work_mem lên vài GB rồi chạy lại truy vấn, vì bộ nhớ luôn là nguyên nhân chính khi thời gian chạy tăng vọt',
    'Thêm DISTINCT vào truy vấn để giảm số dòng trả về, từ đó giảm thời gian sắp xếp và thời gian truyền dữ liệu',
  ],
  QZ19: [
    'Thêm quyền cho IAM user cá nhân của người deploy vì Lambda không có danh tính riêng và dùng credential của người gọi',
    'Sửa bucket policy và bật public-read cho bucket để mọi principal đều đọc được, cách này nhanh và ít cấu hình nhất',
    'Tắt block public access rồi cấp quyền đọc cho role của mọi tài khoản trong tổ chức để không phải cấu hình từng hàm',
  ],
  QZ20: [
    'DynamoDB bị throttling nên SDK phải thử lại nhiều lần với backoff, xử lý bằng cách tăng provisioned capacity của bảng lên gấp đôi',
    'API Gateway giữ kết nối quá lâu nên integration bị timeout, xử lý bằng cách nâng timeout của integration lên 60 giây cho thoáng',
    'Payload không được nén nên thời gian truyền tăng khi mạng chậm, xử lý bằng cách bật gzip cho mọi response mà handler trả về',
  ],
  QZ21: [
    'Cho client dùng AWS access key có quyền hạn hẹp để gọi thẳng S3, cách này đơn giản và không tốn thêm chi phí trung gian',
    'Cho bucket public-read rồi dựa vào URL khó đoán để bảo vệ, vì tên object ngẫu nhiên đủ khó để không ai dò được',
    'Backend đọc file từ S3 rồi ghi xuống máy chủ riêng và serve lại qua chính backend, cách này kiểm soát được mọi request',
  ],
  QZ22: [
    'Tăng visibility timeout lên bằng thời gian xử lý tối đa để message không bị giao lại trong lúc worker còn đang chạy',
    'Bật tính năng deduplication của SQS rồi tin hàng đợi tự loại message trùng, không cần thay đổi gì trong handler',
    'Đọc message theo receive group và chỉ xử lý message có body khác nhau, cách này loại được phần lớn trường hợp trùng',
  ],
  QZ23: [
    'Multi-stage build nén các layer lại nên image luôn nhỏ hơn theo một tỉ lệ cố định so với image dựng bằng một stage',
    'Docker tự xoá các layer không được tham chiếu khi build xong nên image một stage cũng nhỏ tương đương multi-stage',
    'Image cuối bỏ hết thư viện hệ thống không cần thiết nên nhẹ hơn, còn stage build chỉ ảnh hưởng thời gian dựng image',
  ],
  QZ24: [
    'Container thiếu RAM nên kernel chọn process Django làm nạn nhân OOM và giết nó giữa lúc đang trả response, cần nâng memory limit của service lên gấp đôi rồi theo dõi lại',
    'Load balancer ngắt kết nối khi healthcheck trả về chậm nên request đang bay bị đóng, cần tăng interval và timeout của healthcheck để nó khoan dung hơn với endpoint chậm',
    'Image mới được roll ra trước khi container cũ kịp thoát nên hai phiên bản cùng phục vụ một lúc, cần đặt replicas về 0 rồi mới deploy để tránh chồng chéo phiên bản',
  ],
  QZ25: [
    'Tăng memory limit của container lên 4GB rồi coi như đã xử lý xong, vì thông báo heap out of memory là do giới hạn bộ nhớ đặt quá thấp',
    'Thêm restart: always trong Compose để container tự khởi động lại và luôn sống, tránh gián đoạn dịch vụ cho người dùng',
    'Đổi base image sang bản alpine để giảm bộ nhớ nền của container, nhờ đó phần heap còn lại nhiều hơn cho ứng dụng Node',
  ],
  QZ26: [
    'Dùng hai vòng lặp lồng nhau so sánh mọi cặp phần tử, tổng O(n^2) thời gian nhưng chỉ tốn O(1) bộ nhớ phụ',
    'Sắp xếp bản sao của mảng rồi tìm cặp giá trị liền nhau bằng nhau, tổng O(n log n) thời gian và O(1) bộ nhớ phụ',
    'Đếm tần suất bằng cách duyệt tuần tự và so sánh với phần tử kề trước, tổng O(n) thời gian và O(1) bộ nhớ phụ',
  ],
  QZ27: [
    'Giữ page theo quy ước 1-based như backend rồi chuyển đổi ở tầng UI cho từng màn hình, tránh phải sửa hàm slice',
    'Tăng size mặc định lên 1000 để hầu hết trường hợp không cần phân trang, nhờ đó page hiếm khi vượt số trang',
    'Bỏ kiểm tra biên vì backend luôn gửi page hợp lệ, nên logic phía client chỉ làm chậm thêm và dễ sinh lỗi',
  ],
  QZ28: [
    'Cả hai loại đều nên gọi HTTP thật qua một môi trường staging dùng chung, vì chỉ như vậy mới kiểm tra đúng hành vi như production và tránh mock sai lệch',
    'Chỉ cần integration test vì unit test không phát hiện được lỗi wiring giữa các module, và mỗi lần refactor lại phải viết lại mock nên rất tốn công',
    'Chỉ cần unit test vì integration test chạy chậm và hay lỗi do môi trường, chi phí bảo trì cao hơn nhiều so với giá trị nó mang lại',
  ],
};

const src = readFileSync(FILE, 'utf8');
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

let out = src;
let replaced = 0;
const problems = [];

for (const [id, distractors] of Object.entries(NEW)) {
  // Locate this quiz entry, then its options array.
  const idAt = out.indexOf(`id: '${id}'`);
  if (idAt < 0) { problems.push(`${id}: entry not found`); continue; }
  const optAt = out.indexOf('options: [', idAt);
  if (optAt < 0) { problems.push(`${id}: options not found`); continue; }
  const endAt = out.indexOf(']', optAt);
  if (endAt < 0) { problems.push(`${id}: options array not terminated`); continue; }

  const block = out.slice(optAt, endAt + 1);
  // Correct option = the first single-quoted string in the block.
  const m = /^options:\s*\[\s*'((?:[^'\\]|\\.)*)'/.exec(block);
  if (!m) { problems.push(`${id}: could not read the correct option`); continue; }

  const rebuilt = 'options: [\n' +
    `'${m[1]}',\n` +
    distractors.map((d) => `'${esc(d)}'`).join(',\n') + '\n' +
    ']';
  out = out.slice(0, optAt) + rebuilt + out.slice(endAt + 1);
  replaced++;
}

if (problems.length) {
  console.error('ABORTED — no file written:\n  ' + problems.join('\n  '));
  process.exit(1);
}
if (replaced !== Object.keys(NEW).length) {
  console.error(`ABORTED — replaced ${replaced} of ${Object.keys(NEW).length}`);
  process.exit(1);
}
writeFileSync(FILE, out, 'utf8');
console.log(`rewrote distractors for ${replaced} quiz items`);
