var QUIZ = QUIZ || [];
QUIZ.push(
{
id: 'QZ01', group: 'A',
q: 'Vì sao hàm Python có tham số kiểu list làm mặc định thì các lần gọi lại ghi vào cùng một danh sách, và bạn sửa thế nào?',
options: [
'Vì list mặc định được dựng đúng một lần khi module được nạp và giữ nguyên suốt vòng đời tiến trình, nên chỉ cần nạp lại module trước mỗi request là mặc định được tạo mới hoàn toàn',
'Vì Python đánh giá tham số mặc định đúng một lần lúc định nghĩa hàm nên tất cả lần gọi dùng chung một object, sửa bằng None rồi tạo list mới trong thân hàm',
'Vì Python truyền list theo tham chiếu nên hàm giữ luôn list của lần gọi đầu tiên, sửa bằng cách deepcopy tham số ở đầu thân hàm',
'Vì list rỗng là một singleton dùng chung trong toàn bộ interpreter, sửa bằng cách khởi tạo bằng list() thay vì bằng ngoặc vuông'
],
answer: 1,
explain: 'Đáp án B đúng vì Python đánh giá giá trị mặc định đúng một lần khi câu lệnh def chạy, rồi gắn object đó vào thuộc tính __defaults__ của hàm, nên mọi lần gọi dùng chung một list và dữ liệu rò từ lần này sang lần khác. Sửa bằng None rồi tạo list mới trong thân hàm đúng với cơ chế đó. Bẫy A: nạp lại module không tạo lại mặc định, vì mặc định đã nằm trong hàm từ lúc def chạy. Bẫy C: list là truyền tham chiếu, và deepcopy tham số không giải thích nguồn gốc việc gom dữ liệu qua các lần gọi. Bẫy D: list rỗng viết bằng ngoặc vuông không phải singleton toàn interpreter; lỗi nằm ở việc cùng một object được gắn vào hàm. (Đọc sâu cơ chế tại Bài L07)',
situational: false
},
{
id: 'QZ02', group: 'A',
q: 'GIL ảnh hưởng thế nào tới việc bạn chọn threading hay asyncio cho một tác vụ I/O-bound chạy trong Python?',
options: [
'GIL chỉ khoá các phép toán trên object Python thuần nên threading vẫn chạy song song được với mọi thư viện, còn asyncio chỉ là lớp cú pháp thay callback nên chọn cách nào cũng được',
'GIL được nhả ra khi có I/O nên threading và asyncio tương đương nhau về chi phí, chọn cách nào cũng được miễn driver hỗ trợ async',
'GIL không tồn tại trong tiến trình có nhiều luồng nên threading luôn nhanh hơn asyncio khi số kết nối chờ tăng lên vài nghìn',
'GIL khoá bytecode của một tiến trình nên threading chỉ hữu ích khi thư viện C phát thành GIL, còn asyncio phù hợp hơn cho I/O nhiều kết nối chờ'
],
answer: 3,
explain: 'Đáp án D đúng vì GIL chỉ cho một luồng chạy bytecode Python tại một thời điểm trong mỗi tiến trình, còn các thư viện C như socket hay driver database nhả GIL khi chờ I/O, nên threading vẫn có ích cho I/O. Asyncio phù hợp hơn khi số kết nối chờ lớn, vì một luồng quản lý được hàng nghìn coroutine với chi phí thấp hơn nhiều so với hàng nghìn luồng. Bẫy A: GIL không khóa từng phép toán riêng lẻ, và threading không chạy song song code Python thuần. Bẫy B: nhả GIL khi I/O là đúng, nhưng kết luận chi phí tương đương và cách nào cũng được là sai khi số kết nối tăng. Bẫy C: GIL không biến mất khi có nhiều luồng, nên khẳng định threading luôn nhanh hơn là sai. (Đọc sâu cơ chế tại Bài L07)',
situational: false
},
{
id: 'QZ03', group: 'A',
q: 'Một tác vụ xử lý ảnh chạy 3 giây mỗi ảnh trong API FastAPI, mỗi request ổn định 1 ảnh và CPU 8 nhân bị khai thác dưới 20%. Bạn xử lý thế nào?',
options: [
'Đưa xử lý ảnh sang ProcessPoolExecutor hoặc Celery worker để bỏ GIL, vì đây là tác vụ CPU-bound chứ không phải I/O-bound',
'Tăng số worker uvicorn lên bằng đúng số nhân CPU để mỗi tiến trình nhận một phần ảnh từ hàng đợi và xử lý song song, nhờ đó tận dụng hết số nhân đang bỏ trống',
'Bọc hàm xử lý trong async def rồi await trực tiếp để event loop tự chia thời gian cho các ảnh đang chờ trong hàng đợi',
'Tăng giới hạn threadpool của Starlette lên 200 để các tác vụ xử lý ảnh không phải xếp hàng chờ nhau trước khi chạy'
],
answer: 0,
explain: 'Đáp án A đúng vì xử lý ảnh là CPU-bound: GIL khiến nhiều thread trong một tiến trình không chạy song song phần tính toán, nên cần tiến trình riêng như ProcessPoolExecutor hoặc worker queue như Celery để dùng nhiều nhân và giữ event loop của API không bị nghẽn. Bẫy B: uvicorn worker là tiến trình phục vụ HTTP, không tự nhận việc từ hàng đợi ảnh; tăng worker chỉ nhân thêm RAM và kết nối. Bẫy C: async def với await không biến phần tính toán thành I/O, nên CPU vẫn chặn event loop. Bẫy D: tăng threadpool không gỡ GIL, các thread vẫn tranh nhau một GIL. (Đọc sâu cơ chế tại Bài L07)',
situational: true
},
{
id: 'QZ04', group: 'B',
q: 'Trong JavaScript, Promise callback và setTimeout callback được đưa vào queue nào và chạy theo thứ tự nào?',
options: [
'Cả hai loại callback vào cùng một hàng đợi và chạy theo thứ tự đăng ký, nên setTimeout đăng ký trước một Promise sẽ luôn được thực thi trước trong cùng một vòng lặp',
'Promise callback vào macrotask queue còn setTimeout vào microtask queue nên setTimeout luôn chạy trước mọi Promise',
'Promise callback vào microtask queue chạy trước hết, setTimeout vào macrotask queue chạy sau khi call stack rỗng và mọi microtask đã xong',
'Cả hai vào microtask queue nhưng setTimeout được ưu tiên vì có độ trễ xác định do timer của runtime quyết định'
],
answer: 2,
explain: 'Đáp án C đúng vì Promise callback vào microtask queue, còn setTimeout vào macrotask queue. Sau khi call stack rỗng, event loop dọn hết microtask trước rồi mới lấy một macrotask tiếp theo. Bẫy A: hai loại không chung hàng đợi, nên thứ tự đăng ký không quyết định thứ tự giữa Promise và setTimeout. Bẫy B: đảo ngược hai hàng đợi, đây là lỗi nhớ nhầm phổ biến. Bẫy D: setTimeout không vào microtask, và delay chỉ là mức tối thiểu trước khi callback được xếp hàng, không phải độ ưu tiên. (Đọc sâu cơ chế tại Bài L13)',
situational: false
},
{
id: 'QZ05', group: 'B',
q: 'Vì sao các hàm tạo closure trong vòng for với let thì hoạt động đúng còn với var thì tất cả callback in ra cùng một giá trị?',
options: [
'let sao chép giá trị vào từng closure ngay lúc khai báo còn var chỉ giữ tham chiếu tới biến, nên với var mọi closure đọc giá trị mới nhất tại thời điểm chúng được gọi',
'let tạo scope theo khối còn var tạo scope theo hàm, nên closure tạo bằng var không giữ được biến nào và luôn trả về undefined',
'let tạo binding riêng cho mỗi vòng lặp nên mỗi closure giữ một giá trị khác nhau, còn var chỉ có một binding hàm nên mọi closure đọc chung giá trị cuối',
'Cả hai đều giữ đúng giá trị ở mỗi vòng, khác biệt chỉ là let tạo biến bất biến nên không thể bị gán lại sau khi khai báo'
],
answer: 2,
explain: 'Đáp án C đúng vì let trong vòng for tạo một binding mới cho mỗi lần lặp, nên mỗi closure giữ ô nhớ riêng với đúng giá trị của vòng đó. var chỉ có một binding ở scope hàm, nên mọi closure cùng đọc giá trị cuối khi được gọi. Bẫy A: closure không sao chép giá trị lúc khai báo; nó giữ tham chiếu tới binding, và với var binding đó dùng chung. Bẫy B: closure của var không trả undefined; nó trả giá trị cuối của biến dùng chung. Bẫy D: let không bất biến và vẫn gán lại được; khác biệt nằm ở phạm vi binding theo vòng lặp. (Đọc sâu cơ chế tại Bài L13)',
situational: false
},
{
id: 'QZ06', group: 'B',
q: 'Trong một component Vue, người dùng đổi tab liên tục nên các lời gọi fetch chồng lên nhau và cây component bị unmount. Bạn xử lý gì?',
options: [
'Khoá response bằng AbortController và abort request cũ trong onCleanup hoặc onBeforeUnmount, đồng thời bỏ qua kết quả của request đã bị huỷ',
'Dùng Promise.all cho mọi lần đổi tab để chờ tất cả request hoàn tất rồi mới ghi state một lần, nhờ vậy không còn lần ghi nào chồng lên lần ghi nào',
'Chuyển sang XHR synchronous để trình duyệt chặn cho tới khi có response, nhờ vậy thứ tự trả về luôn khớp với thứ tự gọi',
'Giữ nguyên các request đang bay và chỉ gán state khi tất cả đã hoàn tất, để request treo không ghi đè dữ liệu mới hơn'
],
answer: 0,
explain: 'Đáp án A đúng vì đây là race condition: response của request cũ có thể tới sau và ghi đè lựa chọn hiện tại, còn request treo vẫn giữ tài nguyên. AbortController cắt request cũ trong onCleanup của watch hoặc onBeforeUnmount, và hàm bỏ qua kết quả đã bị hủy nên state luôn khớp lựa chọn mới nhất. Bẫy B: Promise.all chờ tất cả xong rồi vẫn ghi kết quả của lựa chọn cũ, và chậm hơn. Bẫy C: XHR đồng bộ chặn luồng chính, làm giao diện đứng và không bảo đảm thứ tự khi có nhiều request. Bẫy D: giữ request đang bay và chỉ gán khi tất cả xong vẫn ghi kết quả cũ, vì request treo không bị hủy. (Đọc sâu cơ chế tại Bài L13)',
situational: true
},
{
id: 'QZ07', group: 'C',
q: 'ref và reactive khác nhau thế nào trong Vue 3 Composition API, kể cả việc truy cập trong template?',
options: [
'ref chỉ dùng được cho kiểu nguyên thuỷ còn reactive dùng cho object, hai cách tương đương về reactivity nên việc chọn ref hay reactive chỉ còn là vấn đề sở thích cú pháp',
'ref dùng Proxy còn reactive dùng getter setter, nên chỉ ref mới theo dõi được thuộc tính lồng nhau và mới hỗ trợ shallowRef',
'Cả hai đều dùng Proxy và đều mất reactivity khi destructure, khác biệt chỉ nằm ở cú pháp khai báo và cách template mở gói',
'ref bọc giá trị trong object có .value nên truyền ref đi vẫn giữ reactivity; reactive dùng Proxy và destructure làm mất reactivity, cần toRefs để giữ liên kết'
],
answer: 3,
explain: 'Đáp án D đúng vì destructure một object reactive() copy giá trị nguyên thủy ra ngoài và cắt liên kết với Proxy, nên dùng toRefs(state) để giữ liên kết từng thuộc tính. ref giữ giá trị trong .value nên truyền ref đi vẫn còn liên kết; còn const v = r.value chỉ lấy primitive ra ngoài. Bẫy A: ref và reactive khác nhau về cách theo dõi và cách mất reactivity, không chỉ khác cú pháp. Bẫy B: đảo ngược cơ chế, vì reactive dùng Proxy còn ref dùng getter và setter trên thuộc tính value. Bẫy C: ref không dùng Proxy, và khẳng định cả hai đều mất reactivity khi destructure là sai với ref. (Đọc sâu cơ chế tại Bài L12)',
situational: false
},
{
id: 'QZ08', group: 'C',
q: 'Bạn cần hiện tổng tiền giỏ hàng và đồng thời gọi API lưu đơn khi giỏ hàng đổi. computed và watch nên dùng thế nào?',
options: [
'Cả hai nên là computed vì computed hỗ trợ cả side effect lẫn cache kết quả, nên gọi API lưu đơn đặt trong computed sẽ không bị gọi lặp lại khi state đổi',
'Tổng tiền là computed vì nó thuần khiết và được cache chỉ tính lại khi phụ thuộc đổi, còn gọi API lưu đơn là watch vì có side effect',
'Cả hai nên là watch vì watch mới cache được giá trị tính ra, còn computed chạy lại mỗi lần template render lại',
'Cả hai nên là hàm gọi trực tiếp trong template để Vue tự theo dõi phụ thuộc và tự quyết định khi nào cần tính lại'
],
answer: 1,
explain: 'Đáp án B đúng vì tổng tiền là giá trị thuần khiết suy ra từ state, computed cache và chỉ tính lại khi dependency đổi. Gọi API lưu đơn là tác dụng phụ, nên đặt trong watch, nơi khai báo rõ nguồn và dùng onCleanup. Bẫy A: đặt side effect trong computed làm mất ý nghĩa của cache, vì nó không còn là giá trị suy ra thuần. Bẫy C: đảo ngược vai trò, watch không cache giá trị tính ra và không dành cho giá trị suy ra. Bẫy D: hàm gọi trong template không được cache và chạy lại theo mỗi lần render, không có chỗ kiểm soát cho side effect. (Đọc sâu cơ chế tại Bài L13)',
situational: false
},
{
id: 'QZ09', group: 'C',
q: 'Trang tìm kiếm gõ từ khoá, dùng watch gọi API sau 300ms. Gõ nhanh nhiều từ liên tiếp thì kết quả hiển thị sai từ khoá. Nguyên nhân và cách sửa?',
options: [
'Vue 3 không tự chờ response nên callback của watch chạy song song, cần đổi sang watchEffect vì watchEffect luôn chờ lần chạy trước kết thúc rồi mới chạy tiếp',
'Debounce 300ms đặt sai chỗ nên phải đặt debounce bên ngoài watch thay vì trong callback, để mỗi phím gõ không tạo request',
'Backend trả kết quả sai thứ tự nên cần sắp xếp lại theo created_at trước khi hiển thị, và thêm phân trang cho danh sách kết quả',
'Response của request cũ tới sau request mới, cần abort request trước trong onCleanup hoặc so sánh id của request mới nhất trước khi gán state'
],
answer: 3,
explain: 'Đáp án D đúng vì debounce chỉ giảm số lần bắt đầu request; các request đã phát ra vẫn có thể về sau request mới, và response cũ ghi đè kết quả mới. Cách sửa là abort request trước trong onCleanup, hoặc giữ một token tăng dần và bỏ qua response không khớp request mới nhất. Bẫy A: watchEffect không chờ lần chạy trước kết thúc và không giải quyết thứ tự response. Bẫy B: debounce đặt ngoài watch vẫn có thể bắn nhiều request chồng nhau; vấn đề là thứ tự trả về, không phải số lần gọi. Bẫy C: sắp xếp theo created_at sửa thứ tự hiển thị, không ngăn kết quả của từ khóa cũ được gán vào state. (Đọc sâu cơ chế tại Bài L13)',
situational: true
},
{
id: 'QZ10', group: 'D',
q: 'Trong TypeScript, type guard kiểu typeof hoặc in khác gì với ép kiểu bằng as, và khi nào nên dùng?',
options: [
'type guard chỉ hoạt động ở thời gian biên dịch còn as mới là toán tử được kiểm tra lúc chạy, nên as an toàn hơn khi dữ liệu tới từ network và không tin được',
'type guard thu hẹp kiểu và kiểm tra runtime nên an toàn, còn as chỉ là chỉ thị cho compiler và sẽ sai nếu dữ liệu thực khác',
'Hai cách cho cùng kết quả sau biên dịch, type guard chỉ cần khai báo trong interface còn as dùng được trong mọi biểu thức',
'type guard chỉ dùng được với union của primitive còn as là cách duy nhất thu hẹp unknown, nên với object phải dùng as'
],
answer: 1,
explain: 'Đáp án B đúng vì typeof và in là kiểm tra thật ở runtime, TypeScript thu hẹp kiểu sau đó, nên an toàn khi dữ liệu đến từ bên ngoài. as chỉ là chỉ thị cho compiler, không kiểm tra gì lúc chạy, nên dữ liệu lệch kiểu sinh lỗi ở chỗ khác và rất khó truy. Bẫy A: đảo ngược, type guard chạy ở runtime còn as chỉ có tác dụng lúc biên dịch. Bẫy C: hai cách không cho cùng kết quả, vì guard có kiểm tra còn as bỏ qua kiểm tra; guard cũng không cần khai báo trong interface. Bẫy D: type guard không giới hạn ở union của primitive; object được kiểm tra bằng in hoặc hàm guard tự viết. (Đọc sâu cơ chế tại Bài L18)',
situational: false
},
{
id: 'QZ11', group: 'D',
q: 'Khác biệt lớn nhất giữa viết try/catch quanh await và để Promise rejection không xử lý là gì?',
options: [
'Hai cách giống nhau vì await tự chuyển rejection thành giá trị undefined, nên nhánh catch chỉ có tác dụng với lỗi đồng bộ và gần như không bao giờ được dùng',
'await biến Promise thành callback nên try/catch không bắt được lỗi mạng, phải dùng .catch gắn trực tiếp vào Promise',
'await trong try/catch bắt được rejection và cho phép chạy nhánh xử lý hoặc fallback, còn không xử lý thì rejection nổi lên unhandledrejection',
'Chỉ có try/catch mới chạy được trong async function, còn await bên ngoài try/catch sẽ bị treo cho tới khi có timeout'
],
answer: 2,
explain: 'Đáp án C đúng vì await làm lỗi của Promise được ném như exception trong async function, nên try/catch bắt được và có thể trả fallback hoặc báo lỗi có ngữ cảnh. Rejection không được xử lý đi tới unhandledrejection: trình duyệt chỉ ghi console, còn Node từ phiên bản 15 mặc định thoát tiến trình. Bẫy A: await không biến rejection thành undefined; nó ném lỗi và làm nhánh catch có tác dụng. Bẫy B: try/catch bắt được lỗi từ await, kể cả lỗi mạng; .catch là cách khác chứ không phải cách duy nhất. Bẫy D: await ngoài try/catch không treo; rejection vẫn bị ném và nếu không bắt sẽ thành unhandled. (Đọc sâu cơ chế tại Bài L18)',
situational: false
},
{
id: 'QZ12', group: 'D',
q: 'Backend trả JSON không có schema ổn định, kiểu field profile có thể là object hoặc null. Bạn xử lý ở tầng TypeScript thế nào?',
options: [
'Declare type là unknown rồi dùng type guard hoặc schema validation ở biên, nếu không khớp thì trả về trạng thái lỗi có kiểm soát',
'Declare type là Profile rồi dùng non-null assertion, vì dữ liệu do backend của chính team viết ra nên luôn đúng schema và không cần kiểm tra lại ở client',
'Chuyển thẳng vào component rồi dùng optional chaining ở mọi chỗ truy cập, không cần kiểm tra kiểu tập trung ở biên',
'Dùng any cho field đó để linh hoạt rồi ép kiểu tại chỗ dùng, vì any không gây lỗi biên dịch và dễ đổi khi API thay đổi'
],
answer: 0,
explain: 'Đáp án A đúng vì dữ liệu từ network là ranh giới không đáng tin: khai báo unknown, kiểm tra một lần ở biên bằng type guard hoặc schema validation như zod, rồi mới đưa vào component. Khi không khớp, trả trạng thái lỗi có kiểm soát thay vì để lỗi nổ ở chỗ dùng. Bẫy B: non-null assertion tin rằng backend luôn đúng schema, nên lỗi chỉ lộ ra lúc runtime. Bẫy C: optional chaining chỉ tránh crash khi truy cập, không kiểm tra kiểu, và rải logic ra mọi chỗ dùng. Bẫy D: any tắt kiểm tra kiểu, và ép kiểu tại chỗ dùng chỉ che lỗi. (Đọc sâu cơ chế tại Bài L18)',
situational: true
},
{
id: 'QZ13', group: 'E',
q: 'Trong FastAPI, dependency dùng yield khác dependency dùng return thế nào về vòng đời tài nguyên?',
options: [
'Dependency dạng yield giữ context cả trước và sau yield nên phù hợp mở rồi đóng session DB, còn dạng return chỉ chạy trước xử lý request',
'Hai dạng giống hệt nhau về vòng đời và đều chạy đúng một lần cho mỗi request, chỉ khác là yield cho phép ghi giá trị trả về cho endpoint sử dụng',
'Dependency dạng yield chạy sau khi response đã gửi tới client nên không dùng để đóng session được, phải dùng return',
'Chỉ dependency dạng return mới được Depends cache lại, còn dạng yield luôn chạy lại mỗi lần được yêu cầu trong request'
],
answer: 0,
explain: 'Đáp án A đúng vì FastAPI dựng dependency yield như context manager: phần trước yield chạy trước handler, phần sau yield chạy sau khi response đã gửi, nên đó là chỗ đóng session hoặc client. Dependency return chỉ có phần khởi tạo và không có điểm dọn dẹp. Bẫy B: hai dạng có vòng đời khác nhau, yield chính là dạng có thêm phần dọn. Bẫy C: phần sau yield chạy sau khi response gửi, và đó chính là lý do dùng nó để đóng tài nguyên. Bẫy D: Depends cache theo request ở cả hai dạng, không phải chỉ dạng return. (Đọc sâu cơ chế tại Bài L07)',
situational: false
},
{
id: 'QZ14', group: 'E',
q: 'Một endpoint dùng def đồng bộ nhưng bên trong gọi driver DB bất đồng bộ, hoặc ngược lại async def gọi SDK sync. Vấn đề gì xảy ra?',
options: [
'Cả hai cách đều được FastAPI tự động chuyển đổi sang dạng phù hợp nên không có vấn đề gì xảy ra khi trộn hai kiểu khai báo trong cùng một service',
'Chỉ async def gọi SDK sync mới gây nghẽn, còn def gọi await chỉ sinh cảnh báo chứ vẫn chạy đúng và trả kết quả',
'def được chạy trong threadpool nên gọi await bên trong sẽ lỗi, còn async def gọi SDK sync sẽ chặn event loop và làm nghẽn mọi request khác',
'Hai cách đều an toàn vì FastAPI cấp một thread riêng cho từng request nên blocking ở đâu cũng không ảnh hưởng nhau'
],
answer: 2,
explain: 'Đáp án C đúng vì FastAPI chạy hàm def trong threadpool nên lệnh await bên trong def không hợp lệ, còn async def chạy trực tiếp trên event loop; SDK đồng bộ trong async def sẽ chặn cả tiến trình. Bẫy A: FastAPI không tự chuyển đổi hai kiểu; trộn sai gây lỗi hoặc nghẽn. Bẫy B: nửa đầu đúng, chỉ async def gọi SDK sync mới chặn event loop; nhưng def gọi await là lỗi thật chứ không chỉ cảnh báo. Bẫy D: không có thread riêng cho từng request; các request dùng chung threadpool có giới hạn nên blocking vẫn ảnh hưởng nhau. (Đọc sâu cơ chế tại Bài L07)',
situational: false
},
{
id: 'QZ15', group: 'E',
q: 'Endpoint trả về danh sách 200 đơn hàng chậm 4 giây vì log SQL có hàng trăm câu SELECT giống hệt nhau. Bạn sửa thế nào?',
options: [
'Tăng kích thước connection pool và timeout của database để các câu SELECT chạy song song thay vì xếp hàng chờ nhau',
'Đây là lỗi N+1, sửa bằng eager loading như selectinload hoặc joinedload để lấy quan hệ trong một truy vấn',
'Thêm index cho mọi cột của cả hai bảng để mỗi câu SELECT nhanh hơn, tổng thời gian giảm theo số câu truy vấn',
'Cache toàn bộ endpoint bằng Redis ở lần gọi đầu để các lần sau không phải chạy lại chuỗi truy vấn giống nhau'
],
answer: 1,
explain: 'Đáp án B đúng vì hàng trăm câu SELECT giống nhau, một câu cho danh sách rồi một câu cho mỗi quan hệ, là dấu hiệu N+1. selectinload hoặc joinedload gộp chúng thành một hoặc hai truy vấn cố định, giảm số round-trip từ hàng trăm xuống vài. Bẫy A: tăng pool và timeout chỉ che chỗ nghẽn, số truy vấn vẫn tăng theo dữ liệu. Bẫy C: index cho mọi cột tốn chi phí ghi và không giảm số câu truy vấn; mỗi câu nhanh hơn một chút vẫn còn hàng trăm câu. Bẫy D: cache chỉ che lỗi ở lần gọi đầu, và chuỗi truy vấn vẫn chậm khi cache trượt. (Đọc sâu cơ chế tại Bài L08)',
situational: true
},
{
id: 'QZ16', group: 'F',
q: 'Bảng orders có index composite trên (status, created_at) và bạn hỏi lọc created_at tuần này cho mọi status. Điều gì xảy ra và tại sao?',
options: [
'Index composite luôn dùng được cho mọi cột bên trong nó nên truy vấn vẫn chạy nhanh, thứ tự cột chỉ quyết định dung lượng mà index chiếm trên đĩa',
'PostgreSQL tự sinh thêm index riêng cho từng cột trong composite index nên lọc theo cột nào cũng được tối ưu',
'Index chỉ hoạt động với điều kiện IN hoặc so sánh bằng, còn lọc theo khoảng thời gian thì buộc phải quét tuần tự',
'Index chỉ dùng được khi có cột đứng đầu trong điều kiện lọc, nên lọc chỉ theo created_at không dùng được index đó và thường phải quét tuần tự'
],
answer: 3,
explain: 'Đáp án D đúng vì B-tree composite được sắp theo cột đầu rồi tới cột sau; chỉ khi điều kiện có ràng buộc trên cột đứng đầu, các cột sau mới giúp thu hẹp. Lọc chỉ theo created_at không dùng được index đó và thường phải quét tuần tự; nếu truy vấn này phổ biến thì cần index riêng trên created_at. Bẫy A: không phải cột nào trong index cũng dùng được; thứ tự cột quyết định, không chỉ ảnh hưởng dung lượng. Bẫy B: PostgreSQL không tự sinh index riêng cho từng cột của composite. Bẫy C: index không chỉ phục vụ phép bằng hay IN; điều kiện khoảng vẫn dùng được khi cột đầu đã có ràng buộc. (Đọc sâu cơ chế tại Bài L05)',
situational: false
},
{
id: 'QZ17', group: 'F',
q: 'Cột discount_rate có thể NULL cho đơn chưa áp dụng khuyến mãi. Vì sao điều kiện discount_rate = 0 không trả về những dòng đó?',
options: [
'Vì PostgreSQL ép NULL thành 0 khi so sánh với một số nên điều kiện discount_rate = 0 vẫn đúng, và NULL được xem như giá trị 0 trong mọi phép so sánh',
'Vì NULL trong so sánh sinh ra UNKNOWN chứ không phải TRUE hay FALSE nên dòng bị loại, muốn lấy phải viết IS NULL hoặc dùng COALESCE',
'Vì NULL bị index bỏ qua nên planner chọn sai kế hoạch và cần chạy ANALYZE định kỳ để thống kê được cập nhật lại',
'Vì so sánh với NULL luôn trả về FALSE nên dòng bị loại, muốn lấy phải đổi điều kiện thành = ANY hoặc dùng IN'
],
answer: 1,
explain: 'Đáp án B đúng vì SQL dùng logic ba giá trị: so sánh với NULL cho UNKNOWN, và WHERE chỉ giữ dòng có TRUE, nên dòng NULL bị loại. Viết discount_rate IS NULL hoặc COALESCE(discount_rate, 0) = 0 là hai cách xử lý đúng. Bẫy A: PostgreSQL không ép NULL thành 0; NULL vẫn là giá trị thiếu. Bẫy C: việc chọn kế hoạch hay có index không quyết định NULL có khớp hay không; ANALYZE không sửa ngữ nghĩa so sánh. Bẫy D: so sánh với NULL cho UNKNOWN chứ không phải FALSE, và đổi sang = ANY hay IN cũng không đưa NULL vào kết quả. (Đọc sâu cơ chế tại Bài L08)',
situational: false
},
{
id: 'QZ18', group: 'F',
q: 'Một báo cáo chạy từ 4 giây lên 40 giây sau khi bảng lớn từ 200 nghìn lên 8 triệu dòng. Bạn bắt đầu kiểm tra bằng cách nào?',
options: [
'Viết lại toàn bộ truy vấn bằng raw SQL tối ưu thủ công trước khi xem kế hoạch thực thi, vì raw SQL luôn nhanh hơn query builder ở mọi trường hợp',
'Tăng work_mem lên vài GB rồi chạy lại truy vấn, vì bộ nhớ luôn là nguyên nhân chính khi thời gian chạy tăng vọt',
'Thêm DISTINCT vào truy vấn để giảm số dòng trả về, từ đó giảm thời gian sắp xếp và thời gian truyền dữ liệu',
'Chạy EXPLAIN ANALYZE để so sánh estimate với actual, tìm dòng ước tính sai và kiểm tra chỉ mục hoặc thống kê đang lệch'
],
answer: 3,
explain: 'Đáp án D đúng vì EXPLAIN ANALYZE chạy thật và cho thời gian từng node cùng số dòng actual, còn EXPLAIN chỉ là ước tính. Khi estimate lệch mạnh với actual, statistics lỗi thời cần ANALYZE, hoặc thiếu index phù hợp như index một phần hay index phủ. Bẫy A: viết lại bằng raw SQL trước khi biết nút nghẽn là đoán mò, và raw SQL không tự động nhanh hơn. Bẫy B: tăng work_mem chỉ giúp khi sort hoặc hash tràn ra đĩa, và phải được xác nhận bằng kế hoạch trước. Bẫy C: DISTINCT thêm một bước sort hoặc hash, không sửa lý do truy vấn chậm, và có thể làm chậm hơn. (Đọc sâu cơ chế tại Bài L08)',
situational: true
},
{
id: 'QZ19', group: 'G',
q: 'Lambda của bạn cần đọc một bucket S3 nhưng deploy xong báo AccessDenied. Bạn kiểm tra và sửa thế nào?',
options: [
'Gắn chính sách IAM cho execution role của Lambda cho phép s3:ListBucket trên ARN bucket arn:aws:s3:::tên-bucket và s3:GetObject trên ARN object arn:aws:s3:::tên-bucket/*, không sửa bucket policy',
'Thêm quyền cho IAM user cá nhân của người deploy, vì Lambda không có execution role riêng mà mượn credential của người gọi nên chỉ cần cấp quyền cho user đó',
'Sửa bucket policy và bật public-read cho bucket, cách này nhanh và ít cấu hình nhất',
'Tắt block public access rồi cấp quyền đọc cho role của mọi tài khoản trong tổ chức để không phải cấu hình từng hàm'
],
answer: 0,
explain: 'Đáp án A đúng vì khi Lambda tự gọi dịch vụ AWS, quyền đến từ execution role gắn vào chính Lambda. Chỉ cần policy cho đúng action trên đúng ARN: arn:aws:s3:::tên-bucket cho ListBucket, arn:aws:s3:::tên-bucket/* cho GetObject, và giữ bucket private. Bẫy B: Lambda không mượn credential của người deploy, nên quyền của user cá nhân không tới được Lambda lúc chạy. Bẫy C: public-read mở dữ liệu cho cả Internet, không cần thiết để sửa một lỗi quyền. Bẫy D: tắt block public access và cấp quyền cho mọi tài khoản là lỗ hổng lớn hơn lỗi ban đầu. (Đọc sâu cơ chế tại Bài L02)',
situational: false
},
{
id: 'QZ20', group: 'G',
q: 'API Lambda đang bị độ trễ p99 cao nhưng không xảy ra lúc nào có traffic lớn. Nguyên nhân khả dĩ nhất và cách xử lý?',
options: [
'DynamoDB bị throttling nên SDK phải thử lại nhiều lần với exponential backoff, xử lý bằng cách tăng provisioned capacity của bảng lên gấp đôi để giảm số lần thử lại',
'API Gateway giữ kết nối quá lâu nên integration bị timeout, xử lý bằng cách nâng timeout của integration lên 60 giây cho thoáng',
'Cold start khi môi trường bị thu hồi, xử lý bằng provisioned concurrency, tăng memory để init nhanh hơn hoặc tối ưu dependency khởi tạo ngoài handler',
'Payload không được nén nên thời gian truyền tăng khi mạng chậm, xử lý bằng cách bật gzip cho mọi response mà handler trả về'
],
answer: 2,
explain: 'Đáp án C đúng vì traffic thấp và đều nghĩa là môi trường Lambda bị thu hồi, request sau phải khởi tạo lại runtime và module, nên p99 cao vào những lúc vắng. Provisioned concurrency giữ sẵn môi trường, tăng memory rút ngắn thời gian init, còn dependency nặng nên nạp ở module scope thay vì trong handler. Bẫy A: throttling của DynamoDB xuất hiện khi tải tăng, không khớp với triệu chứng xảy ra lúc vắng. Bẫy B: nâng timeout của integration không rút ngắn cold start, và timeout của integration có trần cứng nên không phải lối thoát. Bẫy D: nén payload không liên quan tới thời gian khởi tạo môi trường. (Đọc sâu cơ chế tại Bài L03)',
situational: false
},
{
id: 'QZ21', group: 'G',
q: 'Ứng dụng web cần cho người dùng upload ảnh đại diện lên bucket private mà không mở public access. Bạn chọn cách nào?',
options: [
'Cho client dùng AWS access key có quyền hạn hẹp để gọi thẳng S3, cách này đơn giản và không tốn thêm chi phí trung gian',
'Cho bucket public-read rồi dựa vào URL khó đoán để bảo vệ, vì tên object ngẫu nhiên đủ khó để không ai dò được',
'Sử dụng presigned URL có thời hạn ngắn để client PUT thẳng lên S3, backend chỉ xác thực và sinh URL, giảm tải qua API Gateway',
'Backend đọc file từ S3 rồi ghi xuống máy chủ riêng và serve lại qua chính backend, cách này kiểm soát được mọi request'
],
answer: 2,
explain: 'Đáp án C đúng vì presigned URL gắn chữ ký và thời hạn vào đúng request, nên client upload thẳng lên S3 trong cửa sổ đó; backend không nhận dữ liệu và không cần đưa secret vào trình duyệt. Sau upload vẫn phải kiểm tra kích thước, MIME và quét virus. Bẫy A: đặt access key ở client là lộ thông tin xác thực, và hạn chế quyền không làm nó an toàn. Bẫy B: public-read biến bucket thành công khai, còn tên ngẫu nhiên không phải cơ chế kiểm soát truy cập. Bẫy D: backend đọc rồi serve lại tốn băng thông và tải qua backend, trái với mục tiêu giảm tải. (Đọc sâu cơ chế tại Bài L05)',
situational: true
},
{
id: 'QZ22', group: 'G',
q: 'Một Lambda xử lý SQS nhận cùng một message hai lần và tạo ra hai bản ghi trùng. Bạn xử lý thế nào để hệ thống đúng?',
options: [
'Thiết kế xử lý idempotent, ví dụ upsert theo message_id, đặt tên khóa duy nhất theo event id, vì SQS là at-least-once nên có thể giao lặp',
'Tăng visibility timeout lên bằng thời gian xử lý tối đa để message không bị giao lại trong lúc worker còn đang chạy',
'Bật tính năng deduplication của SQS rồi tin hàng đợi tự loại message trùng, không cần thay đổi gì trong handler',
'Đọc message theo receive group và chỉ xử lý message có body khác nhau, cách này loại được phần lớn trường hợp trùng'
],
answer: 0,
explain: 'Đáp án A đúng vì SQS standard là at-least-once: message có thể được giao lại trước khi xóa, nên handler phải idempotent, ví dụ upsert theo khóa nghiệp vụ hoặc theo SQS MessageId. MessageId ổn định qua các lần giao lại, còn receipt handle đổi mỗi lần nhận. Bẫy B: tăng visibility timeout chỉ giảm tần suất giao lại, không loại được khả năng trùng. Bẫy C: deduplication là tính năng của FIFO với cửa sổ giới hạn, không phải cơ chế tự loại mọi trùng lặp của queue standard, và handler vẫn phải đúng. Bẫy D: SQS không có receive group để lọc trùng theo nội dung; so sánh body không xác định được trùng nghiệp vụ. (Đọc sâu cơ chế tại Bài L06)',
situational: true
},
{
id: 'QZ23', group: 'H',
q: 'Vì sao multi-stage build trong Dockerfile giúp image nhỏ hơn nhiều so với image một stage?',
options: [
'Multi-stage build nén các layer lại nên image luôn nhỏ hơn theo một tỉ lệ cố định so với image dựng bằng một stage',
'Docker tự xoá các layer không được tham chiếu khi build xong nên image một stage cũng nhỏ tương đương multi-stage',
'Image cuối bỏ hết thư viện hệ thống không cần thiết nên nhẹ hơn, còn stage build chỉ ảnh hưởng thời gian dựng image',
'Stage build chứa compiler và dependency build chỉ tồn tại trong image trung gian, image cuối chỉ copy artifact hoặc cài đặt production dependencies'
],
answer: 3,
explain: 'Đáp án D đúng vì trong một stage, compiler, header và cache pip đều nằm lại trong layer của image dù lúc chạy không cần. Multi-stage giữ chúng ở stage builder rồi chỉ COPY artifact hoặc cài production dependencies sang stage cuối. Bẫy A: không có cơ chế nén layer theo tỉ lệ cố định; kích thước nằm ở nội dung các layer. Bẫy B: Docker không xóa layer chỉ vì không được tham chiếu; layer vẫn là một phần của image. Bẫy C: multi-stage không tự xóa thư viện hệ thống; lợi ích đến từ việc không copy các thứ dùng để build sang image cuối. (Đọc sâu cơ chế tại Bài L10)',
situational: false
},
{
id: 'QZ24', group: 'H',
q: 'Container Django bị giết giữa lúc đang trả response, người dùng thấy lỗi 502 dù deploy đã roll sạch. Nguyên nhân thường gặp nhất?',
options: [
'Container thiếu RAM nên kernel chọn process Django làm nạn nhân OOM và giết nó giữa lúc đang trả response, cần nâng memory limit của service lên gấp đôi rồi theo dõi lại',
'Ứng dụng không bắt tín hiệu SIGTERM, nên process thoát ngay, cần chạy dưới entrypoint nhận signal, dùng exec form CMD và cấu hình stopGracePeriod cùng healthcheck cho đủ thời gian',
'Load balancer ngắt kết nối khi healthcheck trả về chậm nên request đang bay bị đóng, cần tăng interval và timeout của healthcheck để nó khoan dung hơn với endpoint chậm',
'Image mới được roll ra trước khi container cũ kịp thoát nên hai phiên bản cùng phục vụ một lúc, cần đặt replicas về 0 rồi mới deploy để tránh chồng chéo phiên bản'
],
answer: 1,
explain: 'Đáp án B đúng vì khi dừng container, Docker gửi SIGTERM rồi chờ stopGracePeriod trước khi SIGKILL. Nếu process không bắt tín hiệu để ngừng nhận request, đóng connection và flush, các request đang bay sẽ bị cắt thành 502. Exec form tránh việc shell nuốt tín hiệu. Bẫy A: OOM kill để lại dấu hiệu khác như exit code 137 và OOMKilled, không phải mẫu lỗi này. Bẫy C: healthcheck chỉ đánh dấu trạng thái, không cắt các request đang chạy trong lúc tắt. Bẫy D: đưa replicas về 0 rồi deploy gây downtime có chủ đích, không sửa việc process không dừng êm. (Đọc sâu cơ chế tại Bài L03)',
situational: true
},
{
id: 'QZ25', group: 'H',
q: 'Container Node của bạn cứ restart mỗi vài phút, log trước khi chết báo JavaScript heap out of memory. Bạn kiểm tra theo thứ tự nào?',
options: [
'Tăng memory limit của container lên 4GB rồi coi như đã xử lý xong, vì thông báo heap out of memory là do giới hạn bộ nhớ đặt quá thấp',
'Thêm restart: always trong Compose để container tự khởi động lại và luôn sống, tránh gián đoạn dịch vụ cho người dùng',
'Đổi base image sang bản alpine để giảm bộ nhớ nền của container, nhờ đó phần heap còn lại nhiều hơn cho ứng dụng Node',
'Kiểm tra exit code và OOMKilled, đo heap qua metrics, tìm rò rỉ hay cache không giới hạn, rồi chỉ tăng --max-old-space-size nếu workload thực sự cần'
],
answer: 3,
explain: 'Đáp án D đúng vì restart lặp chỉ là triệu chứng. Kiểm tra exit code và OOMKilled cho biết ai đã giết tiến trình; đo heap qua metrics cho thấy xu hướng tăng; sau đó tìm rò rỉ hoặc cache không giới hạn. Chỉ tăng --max-old-space-size khi workload hợp lệ thật sự cần nhiều bộ nhớ hơn. Bẫy A: tăng limit mà không đo chỉ che dấu rò rỉ, bộ nhớ vẫn tiếp tục tăng. Bẫy B: restart always giữ container sống nhưng che lỗi và làm mất bằng chứng. Bẫy C: alpine giảm kích thước image, không sửa heap của ứng dụng đang rò rỉ. (Đọc sâu cơ chế tại Bài L01)',
situational: true
},
{
id: 'QZ26', group: 'I',
q: 'Bạn cần tìm phần tử trùng đầu tiên trong mảng gồm 200 nghìn số. Cách nào và độ phức tạp?',
options: [
'Dùng hai vòng lặp lồng nhau so sánh mọi cặp phần tử, tổng O(n^2) thời gian nhưng chỉ tốn O(1) bộ nhớ phụ',
'Dùng hash map set các phần tử đã gặp, mỗi vòng kiểm tra has trước rồi add, tổng O(n) thời gian và O(n) bộ nhớ',
'Sắp xếp bản sao của mảng rồi tìm cặp giá trị liền nhau bằng nhau, tổng O(n log n) thời gian và O(1) bộ nhớ phụ',
'Đếm tần suất bằng cách duyệt tuần tự và so sánh với phần tử kề trước, tổng O(n) thời gian và O(1) bộ nhớ phụ'
],
answer: 1,
explain: 'Đáp án B đúng vì hash set có tra cứu trung bình O(1). Duyệt một lần theo thứ tự, mỗi phần tử kiểm tra đã thấy chưa rồi thêm vào set, nên phần tử trùng đầu tiên được phát hiện sau O(n) phép toán. Bẫy A: hai vòng lồng nhau là O(n^2), chậm hẳn với 200 nghìn phần tử, dù ít bộ nhớ hơn. Bẫy C: sắp xếp làm mất thứ tự xuất hiện nên không tìm đúng trùng đầu tiên theo vị trí gốc, và tốn O(n log n) cùng thường cần bản sao. Bẫy D: so sánh với phần tử kề chỉ bắt trùng đứng cạnh nhau, không bắt được trùng nằm xa. (Đọc sâu cơ chế tại Bài L13)',
situational: false
},
{
id: 'QZ27', group: 'I',
q: 'Bạn viết hàm phân trang slice(items, page, size) nhưng lúc page = 0 trả về mảng rỗng và lúc page vượt số trang lại lặp vô hạn trong component. Bạn sửa thế nào?',
options: [
'Giữ page theo quy ước 1-based như backend rồi chuyển đổi ở tầng UI cho từng màn hình, tránh phải sửa hàm slice',
'Tăng size mặc định lên 1000 để hầu hết trường hợp không cần phân trang, nhờ đó page hiếm khi vượt số trang',
'Chuẩn hoá page về 0-based rồi clamp vào khoảng hợp lệ, trả về mảng rỗng khi ngoài phạm vi và luôn dùng slice với chỉ số khớp',
'Bỏ kiểm tra biên vì backend luôn gửi page hợp lệ, nên logic phía client chỉ làm chậm thêm và dễ sinh lỗi'
],
answer: 2,
explain: 'Đáp án C đúng vì hai bên dễ lệch quy ước: backend đánh số trang từ 1, còn slice trong JavaScript dùng chỉ số từ 0. Chuẩn hóa về một quy ước và clamp page vào khoảng hợp lệ ở một chỗ, trả về mảng rỗng khi ngoài phạm vi để vòng lặp hiển thị dừng. Bẫy A: giữ 1-based rồi chuyển đổi ở từng màn hình lặp logic và dễ lệch. Bẫy B: tăng size chỉ che lỗi ở trường hợp hiếm, không sửa biên. Bẫy D: bỏ kiểm tra biên khiến trang vượt số trang lặp vô hạn, và không có gì bảo đảm backend luôn gửi giá trị hợp lệ. (Đọc sâu cơ chế tại Bài L13)',
situational: true
},
{
id: 'QZ28', group: 'J',
q: 'Bạn viết test cho hàm Python và cho endpoint FastAPI. Ranh giới giữa unit test và integration test nên đặt ở đâu?',
options: [
'Unit test chỉ kiểm tra hàm với input và mock dependency, integration test dựng app thật qua TestClient với database test để kiểm tra routing, dependency và schema',
'Cả hai loại đều nên gọi HTTP thật qua một môi trường staging dùng chung, vì chỉ như vậy mới kiểm tra đúng hành vi như production và tránh mock sai lệch',
'Chỉ cần integration test vì unit test không phát hiện được lỗi wiring giữa các module, và mỗi lần refactor lại phải viết lại mock nên rất tốn công',
'Chỉ cần unit test vì integration test chạy chậm và hay lỗi do môi trường, chi phí bảo trì cao hơn nhiều so với giá trị nó mang lại'
],
answer: 0,
explain: 'Đáp án A đúng vì unit test chạy nhanh, không chạm I/O, và bắt lỗi logic cục bộ; integration test dựng app thật qua TestClient với database test để bắt lỗi wiring, dependency và validation mà mock không thấy. Ranh giới nằm ở chỗ có I/O thật hay không, và cần cả hai. Bẫy B: staging dùng chung chậm, không cô lập và không tái lập được. Bẫy C: chỉ integration thì phản hồi chậm và khó khoanh vùng lỗi logic. Bẫy D: chỉ unit bỏ sót lỗi ghép nối giữa route, dependency và schema. (Đọc sâu cơ chế tại Bài L11)',
situational: false
}
);

