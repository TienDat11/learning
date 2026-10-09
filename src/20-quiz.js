var QUIZ = QUIZ || [];
QUIZ.push(
{
id: 'QZ01', group: 'A',
q: 'Vì sao hàm Python có tham số kiểu list làm mặc định thì các lần gọi lại ghi vào cùng một danh sách, và bạn sửa thế nào?',
options: [
'Vì Python đánh giá tham số mặc định đúng một lần lúc định nghĩa hàm nên tất cả lần gọi dùng chung một object, sửa bằng None rồi tạo list mới trong thân hàm',
'Vì list mặc định được dựng đúng một lần khi module được nạp và giữ nguyên suốt vòng đời tiến trình, nên chỉ cần nạp lại module trước mỗi request là mặc định được tạo mới hoàn toàn',
'Vì Python truyền list theo tham chiếu nên hàm giữ luôn list của lần gọi đầu tiên, sửa bằng cách deepcopy tham số ở đầu thân hàm',
'Vì list rỗng là một singleton dùng chung trong toàn bộ interpreter, sửa bằng cách khởi tạo bằng list() thay vì bằng ngoặc vuông'
],
answer: 0,
explain: 'Python đánh giá toàn bộ tham số mặc định đúng một lần khi định nghĩa hàm, nên list mặc định là một object duy nhất bị chia sẻ giữa mọi lần gọi. Cách sửa chuẩn là dùng None làm mặc định rồi tạo list mới bên trong thân hàm.',
situational: false
},
{
id: 'QZ02', group: 'A',
q: 'GIL ảnh hưởng thế nào tới việc bạn chọn threading hay asyncio cho một tác vụ I/O-bound chạy trong Python?',
options: [
'GIL khoá bytecode của một tiến trình nên threading chỉ hữu ích khi thư viện C phát thành GIL, còn asyncio phù hợp hơn cho I/O nhiều kết nối chờ',
'GIL chỉ khoá các phép toán trên object Python thuần nên threading vẫn chạy song song được với mọi thư viện, còn asyncio chỉ là lớp cú pháp thay callback nên chọn cách nào cũng được',
'GIL được nhả ra khi có I/O nên threading và asyncio tương đương nhau về chi phí, chọn cách nào cũng được miễn driver hỗ trợ async',
'GIL không tồn tại trong tiến trình có nhiều luồng nên threading luôn nhanh hơn asyncio khi số kết nối chờ tăng lên vài nghìn'
],
answer: 0,
explain: 'GIL chỉ cho một luồng Python chạy bytecode tại một thời điểm trong mỗi tiến trình. I/O-bound vẫn chạy song song được khi thư viện C như socket hay driver database phát thành GIL, còn asyncio nhẹ hơn và quản lý hàng nghìn kết nối chờ dễ dàng hơn.',
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
explain: 'Xử lý ảnh là CPU-bound nên nhiều thread trong cùng tiến trình không tăng tốc do GIL. ProcessPoolExecutor hoặc worker queue tách việc ra tiến trình khác, tận dụng được nhiều nhân và giữ event loop của API không bị nghẽn.',
situational: true
},
{
id: 'QZ04', group: 'B',
q: 'Trong JavaScript, Promise callback và setTimeout callback được đưa vào queue nào và chạy theo thứ tự nào?',
options: [
'Promise callback vào microtask queue chạy trước hết, setTimeout vào macrotask queue chạy sau khi call stack rỗng và mọi microtask đã xong',
'Cả hai loại callback vào cùng một hàng đợi và chạy theo thứ tự đăng ký, nên setTimeout đăng ký trước một Promise sẽ luôn được thực thi trước trong cùng một vòng lặp',
'Promise callback vào macrotask queue còn setTimeout vào microtask queue nên setTimeout luôn chạy trước mọi Promise',
'Cả hai vào microtask queue nhưng setTimeout được ưu tiên vì có độ trễ xác định do timer của runtime quyết định'
],
answer: 0,
explain: 'Promise callback là microtask và được dọn hết sau mỗi lần call stack rỗng, còn setTimeout là macrotask nằm sau các microtask trong cùng một vòng lặp event loop. Vì vậy code đồng bộ chạy trước, microtask chạy sau, macrotask chạy cuối.',
situational: false
},
{
id: 'QZ05', group: 'B',
q: 'Vì sao các hàm tạo closure trong vòng for với let thì hoạt động đúng còn với var thì tất cả callback in ra cùng một giá trị?',
options: [
'let tạo binding riêng cho mỗi vòng lặp nên mỗi closure giữ một giá trị khác nhau, còn var chỉ có một binding hàm nên mọi closure đọc chung giá trị cuối',
'let sao chép giá trị vào từng closure ngay lúc khai báo còn var chỉ giữ tham chiếu tới biến, nên với var mọi closure đọc giá trị mới nhất tại thời điểm chúng được gọi',
'let tạo scope theo khối còn var tạo scope theo hàm, nên closure tạo bằng var không giữ được biến nào và luôn trả về undefined',
'Cả hai đều giữ đúng giá trị ở mỗi vòng, khác biệt chỉ là let tạo biến bất biến nên không thể bị gán lại sau khi khai báo'
],
answer: 0,
explain: 'Khai báo let trong for tạo binding mới cho mọi lần lặp nên mỗi closure giữ ô nhớ riêng. var chỉ tạo một biến duy nhất trong scope hàm, mọi closure cùng trỏ tới đó và khi vòng lặp kết thúc thì cả ba cùng thấy giá trị cuối cùng.',
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
explain: 'Đây là race condition: response cũ có thể tới sau và ghi đè dữ liệu mới, còn request treo giữ tài nguyên. AbortController trong onCleanup của watch hoặc onBeforeUnmount cắt request cũ và bỏ qua kết quả đã huỷ, giữ state luôn khớp với lựa chọn hiện tại.',
situational: true
},
{
id: 'QZ07', group: 'C',
q: 'ref và reactive khác nhau thế nào trong Vue 3 Composition API, kể cả việc truy cập trong template?',
options: [
'ref bọc giá trị trong object .value nên destructuring không mất reactivity, còn reactive dùng Proxy nên phải giữ nguyên đường dẫn và không destructure được',
'ref chỉ dùng được cho kiểu nguyên thuỷ còn reactive dùng cho object, hai cách tương đương về reactivity nên việc chọn ref hay reactive chỉ còn là vấn đề sở thích cú pháp',
'ref dùng Proxy còn reactive dùng getter setter, nên chỉ ref mới theo dõi được thuộc tính lồng nhau và mới hỗ trợ shallowRef',
'Cả hai đều dùng Proxy và đều mất reactivity khi destructure, khác biệt chỉ nằm ở cú pháp khai báo và cách template mở gói'
],
answer: 0,
explain: 'ref tạo object Ref với thuộc tính .value nên trả về biến đã destructure vẫn là ref và giữ liên kết với state; template tự unwrap ref. reactive dựa trên Proxy theo dõi thuộc tính theo đường dẫn nên destructure sẽ mất reactivity và gán lại object sẽ hỏng toàn bộ thuộc tính.',
situational: false
},
{
id: 'QZ08', group: 'C',
q: 'Bạn cần hiện tổng tiền giỏ hàng và đồng thời gọi API lưu đơn khi giỏ hàng đổi. computed và watch nên dùng thế nào?',
options: [
'Tổng tiền là computed vì nó thuần khiết và được cache chỉ tính lại khi phụ thuộc đổi, còn gọi API lưu đơn là watch vì có side effect',
'Cả hai nên là computed vì computed hỗ trợ cả side effect lẫn cache kết quả, nên gọi API lưu đơn đặt trong computed sẽ không bị gọi lặp lại khi state đổi',
'Cả hai nên là watch vì watch mới cache được giá trị tính ra, còn computed chạy lại mỗi lần template render lại',
'Cả hai nên là hàm gọi trực tiếp trong template để Vue tự theo dõi phụ thuộc và tự quyết định khi nào cần tính lại'
],
answer: 0,
explain: 'computed dành cho giá trị thuần khiết suy ra từ state, có cache và chỉ tính lại khi dependency đổi nên không tốn công. watch dành cho side effect như gọi API, ghi log hay điều hướng, và cần onCleanup để hủy tác dụng phụ cũ khi dependency đổi nhanh.',
situational: false
},
{
id: 'QZ09', group: 'C',
q: 'Trang tìm kiếm gõ từ khoá, dùng watch gọi API sau 300ms. Gõ nhanh nhiều từ liên tiếp thì kết quả hiển thị sai từ khoá. Nguyên nhân và cách sửa?',
options: [
'Response của request cũ tới sau request mới, cần abort request trước trong onCleanup hoặc so sánh id của request mới nhất trước khi gán state',
'Vue 3 không tự chờ response nên callback của watch chạy song song, cần đổi sang watchEffect vì watchEffect luôn chờ lần chạy trước kết thúc rồi mới chạy tiếp',
'Debounce 300ms đặt sai chỗ nên phải đặt debounce bên ngoài watch thay vì trong callback, để mỗi phím gõ không tạo request',
'Backend trả kết quả sai thứ tự nên cần sắp xếp lại theo created_at trước khi hiển thị, và thêm phân trang cho danh sách kết quả'
],
answer: 0,
explain: 'Debounce chỉ giảm số lần gọi, không bảo đảm thứ tự trả về khi các request đều đã phát ra. Cần hủy request cũ bằng AbortController trong onCleanup hoặc giữ token tăng dần và bỏ qua response không còn khớp với request mới nhất.',
situational: true
},
{
id: 'QZ10', group: 'D',
q: 'Trong TypeScript, type guard kiểu typeof hoặc in khác gì với ép kiểu bằng as, và khi nào nên dùng?',
options: [
'type guard thu hẹp kiểu và kiểm tra runtime nên an toàn, còn as chỉ là chỉ thị cho compiler và sẽ sai nếu dữ liệu thực khác',
'type guard chỉ hoạt động ở thời gian biên dịch còn as mới là toán tử được kiểm tra lúc chạy, nên as an toàn hơn khi dữ liệu tới từ network và không tin được',
'Hai cách cho cùng kết quả sau biên dịch, type guard chỉ cần khai báo trong interface còn as dùng được trong mọi biểu thức',
'type guard chỉ dùng được với union của primitive còn as là cách duy nhất thu hẹp unknown, nên với object phải dùng as'
],
answer: 0,
explain: 'typeof và in là type guard thật sự ở runtime nên TypeScript thu hẹp kiểu sau đó và an toàn với dữ liệu thật. Toán tử as chỉ xóa thông tin kiểu cho compiler, không kiểm tra gì lúc chạy nên dữ liệu lệch kiểu sẽ sinh lỗi khó truy ở nơi khác.',
situational: false
},
{
id: 'QZ11', group: 'D',
q: 'Khác biệt lớn nhất giữa viết try/catch quanh await và để Promise rejection không xử lý là gì?',
options: [
'await trong try/catch bắt được rejection và cho phép chạy nhánh xử lý hoặc fallback, còn không xử lý thì rejection nổi lên unhandledrejection',
'Hai cách giống nhau vì await tự chuyển rejection thành giá trị undefined, nên nhánh catch chỉ có tác dụng với lỗi đồng bộ và gần như không bao giờ được dùng',
'await biến Promise thành callback nên try/catch không bắt được lỗi mạng, phải dùng .catch gắn trực tiếp vào Promise',
'Chỉ có try/catch mới chạy được trong async function, còn await bên ngoài try/catch sẽ bị treo cho tới khi có timeout'
],
answer: 0,
explain: 'Trong async function, await làm lỗi của Promise được ném như exception đồng bộ nên try/catch bắt được và bạn có thể trả fallback hoặc báo lỗi có ngữ cảnh. Nếu không bắt, rejection chạy tới unhandledrejection và thường chỉ hiện warning mà dễ bị bỏ qua trong production.',
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
explain: 'Dữ liệu từ network là ranh giới không tin được, nên khai báo unknown và kiểm tra ở một chỗ bằng type guard hoặc thư viện validation như zod, rồi mới đưa vào component. Lùi về any hoặc non-null assertion chỉ che lỗi và biến lỗi runtime thành lỗi khó truy.',
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
explain: 'FastAPI dùng contextmanager cho dependency yield: phần trước yield chạy trước handler, phần sau yield chạy sau khi response gửi xong, nên đây là chỗ đúng để đóng session DB hoặc HTTP client. Dạng return chỉ chạy một lần trước handler và không có điểm đóng.',
situational: false
},
{
id: 'QZ14', group: 'E',
q: 'Một endpoint dùng def đồng bộ nhưng bên trong gọi driver DB bất đồng bộ, hoặc ngược lại async def gọi SDK sync. Vấn đề gì xảy ra?',
options: [
'def được chạy trong threadpool nên gọi await bên trong sẽ lỗi, còn async def gọi SDK sync sẽ chặn event loop và làm nghẽn mọi request khác',
'Cả hai cách đều được FastAPI tự động chuyển đổi sang dạng phù hợp nên không có vấn đề gì xảy ra khi trộn hai kiểu khai báo trong cùng một service',
'Chỉ async def gọi SDK sync mới gây nghẽn, còn def gọi await chỉ sinh cảnh báo chứ vẫn chạy đúng và trả kết quả',
'Hai cách đều an toàn vì FastAPI cấp một thread riêng cho từng request nên blocking ở đâu cũng không ảnh hưởng nhau'
],
answer: 0,
explain: 'FastAPI chỉ đẩy hàm def sang threadpool, hàm def không được await nên code await bên trong sẽ hỏng. Ngược lại async def chạy trực tiếp trên event loop, mọi SDK blocking gọi trong đó sẽ giữ chu trình sự kiện và làm mọi request khác phải chờ.',
situational: false
},
{
id: 'QZ15', group: 'E',
q: 'Endpoint trả về danh sách 200 đơn hàng chậm 4 giây vì log SQL có hàng trăm câu SELECT giống hệt nhau. Bạn sửa thế nào?',
options: [
'Đây là lỗi N+1, sửa bằng eager loading như selectinload hoặc joinedload để lấy quan hệ trong một truy vấn',
'Tăng kích thước connection pool và timeout của database để các câu SELECT chạy song song thay vì xếp hàng chờ nhau',
'Thêm index cho mọi cột của cả hai bảng để mỗi câu SELECT nhanh hơn, tổng thời gian giảm theo số câu truy vấn',
'Cache toàn bộ endpoint bằng Redis ở lần gọi đầu để các lần sau không phải chạy lại chuỗi truy vấn giống nhau'
],
answer: 0,
explain: 'Truy vấn mồ côi theo quan hệ tạo N+1: một câu cho danh sách rồi mỗi dòng lại một câu cho chi tiết. selectinload hoặc joinedload gộp chúng thành một hoặc hai câu cố định, giảm thời gian từ hàng trăm round-trip xuống vài mili giây.',
situational: true
},
{
id: 'QZ16', group: 'F',
q: 'Bảng orders có index composite trên (status, created_at) và bạn hỏi lọc created_at tuần này cho mọi status. Điều gì xảy ra và tại sao?',
options: [
'Index chỉ dùng được khi có cột đứng đầu trong điều kiện lọc, nên lọc chỉ theo created_at không dùng được index đó và thường phải quét tuần tự',
'Index composite luôn dùng được cho mọi cột bên trong nó nên truy vấn vẫn chạy nhanh, thứ tự cột chỉ quyết định dung lượng mà index chiếm trên đĩa',
'PostgreSQL tự sinh thêm index riêng cho từng cột trong composite index nên lọc theo cột nào cũng được tối ưu',
'Index chỉ hoạt động với điều kiện IN hoặc so sánh bằng, còn lọc theo khoảng thời gian thì buộc phải quét tuần tự'
],
answer: 0,
explain: 'Composite index B-tree được sắp theo cột đầu rồi tới cột sau, nên chỉ khi điều kiện có ràng buộc trên cột đứng đầu thì các cột sau mới có giá trị để thu hẹp. Lọc chỉ theo created_at sẽ phải quét tuần tự, cần index riêng trên created_at nếu truy vấn đó là phổ biến.',
situational: false
},
{
id: 'QZ17', group: 'F',
q: 'Cột discount_rate có thể NULL cho đơn chưa áp dụng khuyến mãi. Vì sao điều kiện discount_rate = 0 không trả về những dòng đó?',
options: [
'Vì NULL trong so sánh sinh ra UNKNOWN chứ không phải TRUE hay FALSE nên dòng bị loại, muốn lấy phải viết IS NULL hoặc dùng COALESCE',
'Vì PostgreSQL ép NULL thành 0 khi so sánh với một số nên điều kiện discount_rate = 0 vẫn đúng, và NULL được xem như giá trị 0 trong mọi phép so sánh',
'Vì NULL bị index bỏ qua nên planner chọn sai kế hoạch và cần chạy ANALYZE định kỳ để thống kê được cập nhật lại',
'Vì so sánh với NULL luôn trả về FALSE nên dòng bị loại, muốn lấy phải đổi điều kiện thành = ANY hoặc dùng IN'
],
answer: 0,
explain: 'SQL dùng logic ba giá trị: NULL so sánh với bất kỳ giá trị nào cũng cho UNKNOWN, mà WHERE chỉ giữ dòng có kết quả TRUE nên dòng đó bị loại. Muốn xử lý cả hai trường hợp thì viết discount_rate IS NULL, hoặc COALESCE(discount_rate, 0) = 0.',
situational: false
},
{
id: 'QZ18', group: 'F',
q: 'Một báo cáo chạy từ 4 giây lên 40 giây sau khi bảng lớn từ 200 nghìn lên 8 triệu dòng. Bạn bắt đầu kiểm tra bằng cách nào?',
options: [
'Chạy EXPLAIN ANALYZE để so sánh estimate với actual, tìm dòng ước tính sai và kiểm tra chỉ mục hoặc thống kê đang lệch',
'Viết lại toàn bộ truy vấn bằng raw SQL tối ưu thủ công trước khi xem kế hoạch thực thi, vì raw SQL luôn nhanh hơn query builder ở mọi trường hợp',
'Tăng work_mem lên vài GB rồi chạy lại truy vấn, vì bộ nhớ luôn là nguyên nhân chính khi thời gian chạy tăng vọt',
'Thêm DISTINCT vào truy vấn để giảm số dòng trả về, từ đó giảm thời gian sắp xếp và thời gian truyền dữ liệu'
],
answer: 0,
explain: 'EXPLAIN ANALYZE cho biết kế hoạch thực sự kèm thời gian từng node, còn EXPLAIN chỉ là kế hoạch ước tính. Nếu estimate lệch mạnh với actual thì statistics lỗi thời cần ANALYZE, hoặc thiếu index phù hợp như index một phần hay index phủ.',
situational: true
},
{
id: 'QZ19', group: 'G',
q: 'Lambda của bạn cần đọc một bucket S3 nhưng deploy xong báo AccessDenied. Bạn kiểm tra và sửa thế nào?',
options: [
'Gắn chính sách IAM cho execution role của Lambda cho phép s3:GetObject và s3:ListBucket trên ARN bucket, không sửa bucket policy',
'Thêm quyền cho IAM user cá nhân của người deploy, vì Lambda không có execution role riêng mà mượn credential của người gọi nên chỉ cần cấp quyền cho user đó',
'Sửa bucket policy và bật public-read cho bucket để mọi principal đều đọc được, cách này nhanh và ít cấu hình nhất',
'Tắt block public access rồi cấp quyền đọc cho role của mọi tài khoản trong tổ chức để không phải cấu hình từng hàm'
],
answer: 0,
explain: 'Khi Lambda tự gọi dịch vụ AWS, quyền đến từ execution role gắn vào chính Lambda, không phải principal gọi vào Lambda. Nên chỉ cần policy allow đúng action trên ARN bucket trong role, giữ bucket private; mở public hay dùng user cá nhân là lỗ hổng không cần thiết.',
situational: false
},
{
id: 'QZ20', group: 'G',
q: 'API Lambda đang bị độ trễ p99 cao nhưng không xảy ra lúc nào có traffic lớn. Nguyên nhân khả dĩ nhất và cách xử lý?',
options: [
'Cold start khi môi trường bị thu hồi, xử lý bằng provisioned concurrency, tăng memory để init nhanh hơn hoặc tối ưu dependency khởi tạo ngoài handler',
'DynamoDB bị throttling nên SDK phải thử lại nhiều lần với exponential backoff, xử lý bằng cách tăng provisioned capacity của bảng lên gấp đôi để giảm số lần thử lại',
'API Gateway giữ kết nối quá lâu nên integration bị timeout, xử lý bằng cách nâng timeout của integration lên 60 giây cho thoáng',
'Payload không được nén nên thời gian truyền tăng khi mạng chậm, xử lý bằng cách bật gzip cho mọi response mà handler trả về'
],
answer: 0,
explain: 'Traffic thấp đều nên môi trường Lambda bị AWS thu hồi, request sau phải khởi tạo lại runtime và module. Provisioned concurrency giữ sẵn môi trường ấy, tăng memory cũng rút ngắn thời gian init, còn dependency nặng nên nạp ở biến module scope thay vì trong handler. Phương án timeout là bẫy: với REST API của API Gateway, integration timeout có trần 29 giây và không nâng lên được, nên con số 60 giây vừa vô nghĩa vừa cho thấy người trả lời chưa từng chạm giới hạn đó trong thực tế.',
situational: false
},
{
id: 'QZ21', group: 'G',
q: 'Ứng dụng web cần cho người dùng upload ảnh đại diện lên bucket private mà không mở public access. Bạn chọn cách nào?',
options: [
'Sử dụng presigned URL có thời hạn ngắn để client PUT thẳng lên S3, backend chỉ xác thực và sinh URL, giảm tải qua API Gateway',
'Cho client dùng AWS access key có quyền hạn hẹp để gọi thẳng S3, cách này đơn giản và không tốn thêm chi phí trung gian',
'Cho bucket public-read rồi dựa vào URL khó đoán để bảo vệ, vì tên object ngẫu nhiên đủ khó để không ai dò được',
'Backend đọc file từ S3 rồi ghi xuống máy chủ riêng và serve lại qua chính backend, cách này kiểm soát được mọi request'
],
answer: 0,
explain: 'Presigned URL gắn chữ ký và điều kiện thời gian vào chính request nên chỉ dùng được trong cửa sổ đó, backend không phải nhận dữ liệu và không cần lưu secret của AWS trong trình duyệt. Sau khi upload cần kiểm tra kích thước, MIME và có virus scan trước khi dùng.',
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
explain: 'SQS bảo đảm at-least-once nên message có thể được giao lại khi Lambda chưa xoá message trước khi hết visibility timeout, và việc tăng timeout chỉ giảm tần suất chứ không loại bỏ khả năng trùng. Cách đúng là coi handler là idempotent, dựa vào message_id hoặc receipt handle phái sinh khóa duy nhất.',
situational: true
},
{
id: 'QZ23', group: 'H',
q: 'Vì sao multi-stage build trong Dockerfile giúp image nhỏ hơn nhiều so với image một stage?',
options: [
'Stage build chứa compiler và dependency build chỉ tồn tại trong image trung gian, image cuối chỉ copy artifact hoặc cài đặt production dependencies',
'Multi-stage build nén các layer lại nên image luôn nhỏ hơn theo một tỉ lệ cố định so với image dựng bằng một stage',
'Docker tự xoá các layer không được tham chiếu khi build xong nên image một stage cũng nhỏ tương đương multi-stage',
'Image cuối bỏ hết thư viện hệ thống không cần thiết nên nhẹ hơn, còn stage build chỉ ảnh hưởng thời gian dựng image'
],
answer: 0,
explain: 'Trong một stage duy nhất, mọi layer như gcc, header build hay cache pip đều nằm lại trong image dù không dùng lúc chạy. Multi-stage build giữ chúng ở stage builder rồi COPY duy nhất kết quả sang stage cuối nhẹ, nên image nhỏ hơn, pull nhanh hơn và ít bề mặt tấn công hơn.',
situational: false
},
{
id: 'QZ24', group: 'H',
q: 'Container Django bị giết giữa lúc đang trả response, người dùng thấy lỗi 502 dù deploy đã roll sạch. Nguyên nhân thường gặp nhất?',
options: [
'Ứng dụng không bắt tín hiệu SIGTERM, nên process thoát ngay, cần chạy dưới entrypoint nhận signal, dùng exec form CMD và cấu hình stopGracePeriod cùng healthcheck cho đủ thời gian',
'Container thiếu RAM nên kernel chọn process Django làm nạn nhân OOM và giết nó giữa lúc đang trả response, cần nâng memory limit của service lên gấp đôi rồi theo dõi lại',
'Load balancer ngắt kết nối khi healthcheck trả về chậm nên request đang bay bị đóng, cần tăng interval và timeout của healthcheck để nó khoan dung hơn với endpoint chậm',
'Image mới được roll ra trước khi container cũ kịp thoát nên hai phiên bản cùng phục vụ một lúc, cần đặt replicas về 0 rồi mới deploy để tránh chồng chéo phiên bản'
],
answer: 0,
explain: 'Khi container bị dừng, Docker gửi SIGTERM và chỉ chờ stopGracePeriod rồi mới SIGKILL. Nếu process chưa cài handler để dừng nhận request, đóng connection và flush buffer, nó chết ngay lập tức nên request dở dang thành 502; exec form trong Compose tránh việc shell ăn mất tín hiệu.',
situational: true
},
{
id: 'QZ25', group: 'H',
q: 'Container Node của bạn cứ restart mỗi vài phút, log trước khi chết báo JavaScript heap out of memory. Bạn kiểm tra theo thứ tự nào?',
options: [
'Kiểm tra exit code và OOMKilled, đo heap qua metrics, tìm rò rỉ hay cache không giới hạn, rồi chỉ tăng --max-old-space-size nếu workload thực sự cần',
'Tăng memory limit của container lên 4GB rồi coi như đã xử lý xong, vì thông báo heap out of memory là do giới hạn bộ nhớ đặt quá thấp',
'Thêm restart: always trong Compose để container tự khởi động lại và luôn sống, tránh gián đoạn dịch vụ cho người dùng',
'Đổi base image sang bản alpine để giảm bộ nhớ nền của container, nhờ đó phần heap còn lại nhiều hơn cho ứng dụng Node'
],
answer: 0,
explain: 'Restart lặp là triệu chứng, cần tìm lý do: exit code 137 thường là OOMKilled từ memory limit container chứ không phải heap mặc định của Node. Tăng --max-old-space-size chỉ hợp khi workload hợp lệ vốn lớn, còn rò rỉ hay cache không giới hạn phải sửa ở code.',
situational: true
},
{
id: 'QZ26', group: 'I',
q: 'Bạn cần tìm phần tử trùng đầu tiên trong mảng gồm 200 nghìn số. Cách nào và độ phức tạp?',
options: [
'Dùng hash map set các phần tử đã gặp, mỗi vòng kiểm tra has trước rồi add, tổng O(n) thời gian và O(n) bộ nhớ',
'Dùng hai vòng lặp lồng nhau so sánh mọi cặp phần tử, tổng O(n^2) thời gian nhưng chỉ tốn O(1) bộ nhớ phụ',
'Sắp xếp bản sao của mảng rồi tìm cặp giá trị liền nhau bằng nhau, tổng O(n log n) thời gian và O(1) bộ nhớ phụ',
'Đếm tần suất bằng cách duyệt tuần tự và so sánh với phần tử kề trước, tổng O(n) thời gian và O(1) bộ nhớ phụ'
],
answer: 0,
explain: 'Hash map cho phép tra cứu trung bình O(1), nên duyệt một lần theo thứ tự và đánh dấu phần tử đã thấy sẽ phát hiện phần tử trùng đầu tiên sau O(n) phép toán. Hai vòng lặp lồng nhau cho O(n^2) nên với 200 nghìn phần tử sẽ chậm hẳn.',
situational: false
},
{
id: 'QZ27', group: 'I',
q: 'Bạn viết hàm phân trang slice(items, page, size) nhưng lúc page = 0 trả về mảng rỗng và lúc page vượt số trang lại lặp vô hạn trong component. Bạn sửa thế nào?',
options: [
'Chuẩn hoá page về 0-based rồi clamp vào khoảng hợp lệ, trả về mảng rỗng khi ngoài phạm vi và luôn dùng slice với chỉ số khớp',
'Giữ page theo quy ước 1-based như backend rồi chuyển đổi ở tầng UI cho từng màn hình, tránh phải sửa hàm slice',
'Tăng size mặc định lên 1000 để hầu hết trường hợp không cần phân trang, nhờ đó page hiếm khi vượt số trang',
'Bỏ kiểm tra biên vì backend luôn gửi page hợp lệ, nên logic phía client chỉ làm chậm thêm và dễ sinh lỗi'
],
answer: 0,
explain: 'Hai bên dễ lệch quy ước: backend thường đánh số trang từ 1 còn slice trong JavaScript chạy từ 0, và chỉ số lớn hơn độ dài trả về mảng rỗng chứ không lỗi. Chuẩn hoá và clamp giá trị ở một chỗ duy nhất rồi trả về mảng rỗng khi ngoài phạm vi để vòng lặp hiển thị dừng.',
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
explain: 'Unit test chạy nhanh, không chạm I/O và bắt được lỗi logic cục bộ trong khi hàng nghìn test chạy mỗi lần commit. Integration test dựng app thật với TestClient và database test để bắt lỗi wiring, dependency injection và validation mà mock không thể thấy, nên cần cả hai.',
situational: false
}
);

