// Batch BC — JavaScript/TypeScript B07..B14 and Vue C10..C12.
// NOTE: the build forbids the literal `fetch(` and `require(` in src (self-containment
// check), so examples here use `api.get(...)` / named helpers instead.
export default {
B07: {
incident: `<p>Một dashboard gọi 40 endpoint để dựng bốn thẻ số liệu. Dev dùng <code>Promise.all([...])</code> cho cả 40. Một endpoint phụ — dịch vụ đọc số lượt xem — bị lỗi 500 trong 2 giây, và toàn bộ dashboard trắng: không thẻ nào hiện, dù 39 endpoint còn lại đã trả dữ liệu thành công. Người dùng báo "dashboard hỏng", trong khi thực tế chỉ một ô số liệu phụ hỏng.</p>`,
askFirst: [
`<code>Promise.all</code> làm gì với các promise còn lại khi một cái reject?`,
`Khi nào bạn cần tất cả thành công, khi nào chỉ cần những cái thành công?`,
`Làm sao giới hạn số request chạy song song mà vẫn nhanh?`,
],
predict: {
q: `Bốn promise, cái thứ ba reject sau 10 ms, ba cái kia resolve sau 5 giây. <code>Promise.all</code>, <code>allSettled</code>, <code>race</code> và <code>any</code> trả về gì?`,
a: `<p><code>Promise.all</code> reject sau 10 ms với lỗi của promise thứ ba, và ba promise còn lại <em>vẫn tiếp tục chạy</em> — chúng không bị huỷ. <code>allSettled</code> chờ đủ 5 giây rồi trả mảng bốn phần tử, mỗi phần tử có <code>status</code> là <code>fulfilled</code> hoặc <code>rejected</code>. <code>race</code> settle theo kết quả đầu tiên, tức reject sau 10 ms. <code>any</code> chờ tới khi có ít nhất một promise <code>fulfilled</code>, nên nó resolve sau 5 giây; nếu tất cả đều reject thì nó reject bằng <code>AggregateError</code>.</p>`,
},
anchor: `Promise.all là "tất cả hoặc không gì cả" — một lỗi phụ làm sập cả kết quả, và các promise còn lại vẫn chạy tiếp chứ không được huỷ.`,
attacks: [
{ q: `Bạn nói Promise.all không huỷ các promise còn lại. Vậy làm sao thực sự huỷ chúng?`, a: `Phải truyền tín hiệu huỷ vào chính hàm thực hiện công việc, thường qua <code>AbortController</code>. <code>Promise.all</code> chỉ quan sát, nó không có quyền dừng một tác vụ đang chạy. Mẫu đúng là tạo một controller, truyền <code>controller.signal</code> vào từng lời gọi, và trong nhánh <code>catch</code> gọi <code>controller.abort()</code>. Lưu ý là huỷ chỉ có tác dụng nếu tầng bên dưới thực sự tôn trọng signal — một lời gọi không nhận signal thì vẫn chạy tới hết.` },
{ q: `Có 2.000 URL cần gọi. Bạn giới hạn đồng thời thế nào mà không viết lại toàn bộ?`, a: `Chia thành các lô: cắt mảng thành nhóm 20 rồi <code>await Promise.all</code> từng nhóm theo thứ tự. Cách này đơn giản, dễ đọc, và giới hạn cứng số request đang bay. Cách tổng quát hơn là một worker pool — duy trì N worker cùng rút việc từ một hàng đợi chung, nên worker nào xong trước thì nhận việc tiếp, không phải chờ cả lô. Đánh đổi: chia lô dễ viết nhưng có hiện tượng một lô chậm giữ chỗ; worker pool tận dụng tốt hơn nhưng phức tạp hơn và khó suy luận về thứ tự.` },
],
},
B08: {
incident: `<p>Ô tìm kiếm gọi API mỗi lần gõ phím. Người dùng gõ "da" rồi sửa thành "danang" trong vòng 200 ms. Request cho "da" tới server sau request cho "danang" nhưng lại trả về trước, và kết quả "da" ghi đè kết quả đúng. Người dùng thấy danh sách của "da" trong khi ô nhập ghi "danang". Thêm debounce 300 ms làm giảm số request nhưng lỗi vẫn còn, chỉ ít xuất hiện hơn.</p>`,
askFirst: [
`Debounce giải quyết vấn đề gì, và không giải quyết vấn đề gì?`,
`Vì sao response về sai thứ tự lại ghi đè được kết quả mới?`,
`Cần thêm cơ chế gì ngoài debounce?`,
],
predict: {
q: `Hai request được phát ra: A cho "da" và B cho "danang". B trả về sau A. Nếu code chỉ có <code>.then(data => state.q = data)</code> thì state cuối cùng là gì?`,
a: `<p>State cuối cùng là kết quả của B, tức "danang" — trong trường hợp này đúng. Nhưng nếu mạng chậm bất thường và A trả về <em>sau</em> B, state cuối cùng là "da", sai. Điểm cốt lõi là thứ tự hoàn thành không được bảo đảm bởi thứ tự phát ra, nên code đúng phải <em>không phụ thuộc</em> vào thứ tự đó. Hai cách: huỷ request cũ bằng <code>AbortController</code>, hoặc gắn số thứ tự tăng dần cho mỗi lần gọi và bỏ qua response có số nhỏ hơn số mới nhất đã phát.</p>`,
},
anchor: `Debounce giảm số request chứ không bảo đảm thứ tự trả về, nên vẫn phải có tín hiệu huỷ hoặc số thứ tự để chống ghi đè.`,
attacks: [
{ q: `Debounce và throttle khác nhau ở đâu, và bạn chọn cái nào cho ô tìm kiếm?`, a: `Debounce chờ cho tới khi người dùng ngừng thao tác trong một khoảng, rồi mới chạy một lần — phù hợp với ô tìm kiếm vì bạn chỉ muốn gọi khi người dùng đã gõ xong. Throttle chạy đều đặn tối đa một lần trong mỗi khoảng, bất kể người dùng còn thao tác — phù hợp với sự kiện cuộn hay kéo chuột, nơi bạn cần cập nhật liên tục nhưng có giới hạn. Với tìm kiếm, debounce là lựa chọn đúng; nhưng nhớ rằng debounce chỉ giảm tần suất, nên vẫn cần xử lý thứ tự.` },
{ q: `Nếu tôi so sánh từ khoá trả về với từ khoá hiện tại trong state trước khi gán thì đã đủ chưa?`, a: `Đủ cho trường hợp hai lần gõ khác nhau, nhưng không đủ khi người dùng gõ cùng một từ khoá hai lần — ví dụ gõ "da", xoá, rồi gõ lại "da". Hai request có cùng từ khoá, nên phép so sánh không phân biệt được cái nào mới hơn, và kết quả cũ có thể ghi đè. Cách chắc chắn là dùng định danh đơn điệu — số thứ tự tăng dần hoặc một token cho mỗi lần gọi — và chỉ nhận response khi định danh của nó bằng định danh mới nhất.` },
],
},
B09: {
incident: `<p>Một response API có trường <code>status</code> nhận ba giá trị chuỗi. Dev khai báo <code>status: string</code> rồi viết chuỗi <code>if/else</code> so sánh với từng giá trị. Khi backend thêm giá trị thứ tư, không có lỗi biên dịch nào, và nhánh mặc định âm thầm hiển thị sai nhãn cho một trạng thái mới. Lỗi chỉ lộ ra khi khách hàng báo đơn hàng hiển thị sai trạng thái.</p>`,
askFirst: [
`Kiểu <code>string</code> cho một tập giá trị hữu hạn đánh mất thông tin gì?`,
`Union của các literal khác gì enum, và khi nào chọn cái nào?`,
`TypeScript có kiểm tra gì ở ranh giới mạng không?`,
],
predict: {
q: `Với <code>type Status = "new" | "paid" | "shipped"</code> và một hàm nhận <code>Status</code>, điều gì xảy ra nếu bạn truyền một biến kiểu <code>string</code> vào?`,
a: `<p>Lỗi biên dịch: <code>string</code> không gán được cho union của ba literal, vì <code>string</code> rộng hơn. Đây chính là giá trị của union literal — nó thu hẹp miền giá trị và buộc mọi nơi phải xử lý đúng tập đó. Hệ quả thực tế rất đáng giá: nếu bạn dùng <code>switch</code> trên union và bật kiểm tra đầy đủ, thêm một giá trị mới vào union sẽ làm compiler báo lỗi ngay tại mọi chỗ chưa xử lý. Còn nếu bạn ép bằng <code>as Status</code> thì bạn đã tự tay tắt bảo vệ đó.</p>`,
},
anchor: `Khai báo kiểu càng rộng thì compiler càng ít giúp được — union của literal biến "thêm giá trị mới" thành lỗi biên dịch thay vì lỗi production.`,
attacks: [
{ q: `type và interface khác nhau thế nào, và bạn chọn cái nào?`, a: `Khác biệt thực tế nhỏ hơn nhiều so với các cuộc tranh luận trên mạng. <code>interface</code> có thể được khai báo bổ sung nhiều lần và tự gộp lại — hữu ích khi mở rộng kiểu của thư viện bên ngoài; nó cũng cho thông báo lỗi dễ đọc hơn trong nhiều trường hợp. <code>type</code> linh hoạt hơn: nó biểu diễn được union, intersection, tuple, mapped type và conditional type — những thứ <code>interface</code> không làm được. Quy tắc thực dụng: dùng <code>interface</code> cho hình dạng object công khai của module, dùng <code>type</code> khi cần union hoặc các phép biến đổi kiểu.` },
{ q: `TypeScript có bảo vệ bạn trước dữ liệu sai từ API không?`, a: `Không, và đây là hiểu nhầm tốn kém nhất về TypeScript. Kiểu bị xoá hoàn toàn khi biên dịch, nên <code>const data: User = await res.json()</code> không kiểm tra gì cả — nó chỉ là một lời khẳng định với compiler. Nếu backend trả về hình dạng khác, bạn nhận lỗi runtime ở tận sâu trong component. Cách đúng là coi dữ liệu mạng là <code>unknown</code> và kiểm tra ở biên bằng type guard hoặc thư viện validate schema, rồi mới chuyển thành kiểu có tên.` },
],
},
B10: {
incident: `<p>Một thành phần hiển thị thông tin người dùng gọi <code>user.profile.name</code>. Backend đổi để <code>profile</code> có thể là <code>null</code> cho tài khoản chưa hoàn tất hồ sơ. Vì kiểu ở client vẫn khai báo <code>profile: Profile</code>, không có lỗi biên dịch nào; production ném <code>Cannot read properties of null</code> và trắng trang với những tài khoản đó. Một dev đề xuất đổi sang <code>any</code> để "hết lỗi kiểu".</p>`,
askFirst: [
`Vì sao <code>any</code> không sửa được lỗi này mà chỉ làm nó muộn hơn?`,
`<code>unknown</code> khác <code>any</code> ở điểm nào?`,
`Chỗ nào là nơi đúng để kiểm tra dữ liệu từ mạng?`,
],
predict: {
q: `Biến <code>x: any</code> và <code>y: unknown</code> — bạn làm được gì với mỗi biến?`,
a: `<p>Với <code>any</code> bạn làm được mọi thứ: đọc thuộc tính bất kỳ, gọi nó như hàm, gán nó vào biến kiểu khác — compiler không kiểm tra gì. Với <code>unknown</code> bạn chỉ được gán vào <code>any</code> hoặc <code>unknown</code>; muốn dùng phải thu hẹp trước bằng type guard, phép so sánh, hoặc validate schema. Nói cách khác <code>any</code> tắt kiểm tra và lan truyền sự im lặng đó ra khắp nơi nó chảy qua, còn <code>unknown</code> buộc bạn chứng minh kiểu trước khi dùng. Đó là lý do <code>unknown</code> là kiểu đúng cho mọi dữ liệu đến từ bên ngoài.</p>`,
},
anchor: `any tắt kiểm tra và lan sự im lặng đi khắp nơi nó chảy qua; unknown buộc bạn chứng minh kiểu trước khi dùng.`,
attacks: [
{ q: `never dùng để làm gì trong thực tế?`, a: `Hai công dụng chính. Thứ nhất, nó là kiểu của nhánh không bao giờ trả về — hàm luôn ném lỗi, hoặc vòng lặp vô hạn. Thứ hai, và hữu ích hơn, nó dùng để kiểm tra tính đầy đủ: trong nhánh <code>default</code> của một <code>switch</code> trên union, nếu bạn gán giá trị còn lại cho biến kiểu <code>never</code>, compiler sẽ báo lỗi ngay khi bạn thêm một giá trị mới vào union mà quên xử lý. Đó là cách biến một lỗi production thành một lỗi biên dịch.` },
{ q: `Nếu backend của chính team mình viết thì có cần kiểm tra dữ liệu không?`, a: `Cần, vì "backend của mình" không loại bỏ được các nguyên nhân khác: một bản deploy cũ còn chạy, một proxy trả về trang lỗi HTML với status 200, một trường bị đổi tên trong nhánh chưa merge, hoặc cache trả về payload của phiên bản trước. Ranh giới mạng là ranh giới không tin được bất kể ai viết đầu bên kia. Chi phí kiểm tra ở một chỗ — hàm parse response — nhỏ hơn nhiều so với chi phí gỡ một lỗi null ở tận sâu trong cây component.` },
],
},
B11: {
incident: `<p>Một module tiện ích vừa export một hàm vừa chạy code ở cấp module để đăng ký một listener toàn cục. Khi một file khác import nó chỉ để dùng một hàm định dạng ngày, listener cũng được đăng ký, và một kết nối bị mở thêm. Trên trang có nhiều bundle, việc này xảy ra nhiều lần, và log cho thấy cùng một listener được đăng ký bốn lần.</p>`,
askFirst: [
`Code ở cấp module chạy khi nào, và bao nhiêu lần?`,
`Vì sao import để dùng một hàm nhỏ lại kéo theo tác dụng phụ?`,
`Làm sao giữ module không có tác dụng phụ?`,
],
predict: {
q: `Hai file cùng <code>import { fmt } from "./utils.js"</code>. Code ở cấp module của <code>utils.js</code> chạy mấy lần?`,
a: `<p>Đúng một lần. Module trong ESM được đánh giá một lần duy nhất cho mỗi lần tải, và kết quả được cache; các lần import sau nhận cùng một thực thể module. Đây là lý do state ở cấp module hoạt động như một singleton trong phạm vi một bản tải. Nhưng cũng chính vì vậy, nếu module đó chạy tác dụng phụ ở cấp cao nhất thì tác dụng phụ đó xảy ra ngay khi module đầu tiên import nó — kể cả khi mục đích chỉ là dùng một hàm thuần tuý.</p>`,
},
anchor: `Module được đánh giá đúng một lần và cache lại, nên tác dụng phụ ở cấp module biến mọi import — kể cả import chỉ để dùng một hàm nhỏ — thành một hành động có hệ quả.`,
attacks: [
{ q: `Vậy singleton đặt ở cấp module có an toàn không?`, a: `An toàn trong phạm vi một tiến trình và một bản tải module, nhưng có ba điểm cần lưu ý. Thứ nhất, trên server, state cấp module được chia sẻ giữa mọi request của cùng tiến trình — đó chính là bẫy rò rỉ dữ liệu giữa người dùng. Thứ hai, trong quá trình phát triển có hot reload, module có thể được đánh giá lại nên singleton bị tạo mới và state cũ mất. Thứ ba, nếu có nhiều bản sao của cùng một package trong cây phụ thuộc, bạn có nhiều thực thể module khác nhau và singleton không còn là singleton.` },
{ q: `Làm sao phát hiện một module có tác dụng phụ mà không đọc hết file?`, a: `Nhìn phần đầu và phần cuối file: mọi câu lệnh không nằm trong khai báo hàm hay lớp đều là tác dụng phụ ở cấp module. Tìm các mẫu như gọi hàm ngay khi định nghĩa, đăng ký listener, mở kết nối, đọc biến môi trường, hoặc ghi vào đối tượng toàn cục. Một dấu hiệu gián tiếp mạnh là lỗi chỉ xuất hiện khi chạy test cho một module khác — nghĩa là module bị import gián tiếp đã gây tác dụng phụ.` },
],
},
B12: {
incident: `<p>Một trang danh sách có thể mở và đóng một bảng chi tiết nhiều lần. Mỗi lần mở, component đăng ký một listener <code>resize</code> và một <code>setInterval</code> làm mới dữ liệu. Component bị gỡ nhưng không ai huỷ đăng ký. Sau khoảng 30 lần mở, trang chậm hẳn, và log cho thấy hàm làm mới được gọi 30 lần mỗi giây thay vì một lần.</p>`,
askFirst: [
`Cái gì giữ cho component đã gỡ vẫn chạy?`,
`Vì sao số lần gọi tăng theo số lần mở thay vì giữ nguyên?`,
`Dọn dẹp đúng cách trông như thế nào?`,
],
predict: {
q: `Một <code>setInterval</code> được tạo trong component nhưng không bị huỷ khi component unmount. Chuyện gì xảy ra với callback của nó?`,
a: `<p>Callback tiếp tục chạy mãi. <code>setInterval</code> trả về một handle do môi trường chạy giữ, không phải do component giữ, nên việc component bị gỡ không dừng được timer. Nếu callback đó tham chiếu tới state hoặc DOM của component, toàn bộ closure — và mọi thứ nó bắt giữ — không thể được thu hồi, đó chính là rò rỉ bộ nhớ. Mỗi lần component được tạo lại, một interval mới được thêm vào, nên số lần callback chạy tỉ lệ với số lần component từng được tạo.</p>`,
},
anchor: `Timer và listener do môi trường chạy giữ, không do component giữ — không huỷ chúng thì component đã gỡ vẫn tiếp tục chạy và giữ luôn bộ nhớ của nó.`,
attacks: [
{ q: `Trong Vue 3 với Composition API, bạn dọn dẹp ở đâu?`, a: `Trong <code>onBeforeUnmount</code> hoặc <code>onUnmounted</code> của chính component, hoặc gọn hơn là trong <code>onScopeDispose</code> nếu logic nằm trong một composable — như vậy composable tự dọn phần nó đã tạo, và component dùng nó không phải nhớ. Với <code>watch</code> và <code>watchEffect</code>, Vue tự dừng chúng khi scope bị huỷ, nên bạn chỉ cần dọn những gì bạn tự tạo: <code>setInterval</code>, <code>addEventListener</code> trên <code>window</code> hoặc <code>document</code>, observer, và kết nối mạng.` },
{ q: `Làm sao tìm ra rò rỉ bộ nhớ trong một ứng dụng đang chạy?`, a: `Ba bước thực dụng. Một là dùng tab Memory của DevTools: chụp heap snapshot, thực hiện hành động nghi ngờ mười lần, chụp lại, rồi so sánh số thực thể của lớp component — nếu số đó tăng đều theo số lần hành động thì đó là rò rỉ. Hai là xem đường giữ trong snapshot để biết ai đang giữ đối tượng; thường thủ phạm là timer, listener toàn cục, hoặc một mảng cache không có giới hạn. Ba là kiểm tra các subscription và interval trong code, vì đó là nguồn phổ biến nhất.` },
],
},
B13: {
incident: `<p>Một dev cần sao chép sâu một object cấu hình trước khi sửa. Họ dùng <code>JSON.parse(JSON.stringify(cfg))</code> theo thói quen. Bản sao trông đúng cho tới khi một trường kiểu <code>Date</code> trở thành chuỗi, một trường <code>undefined</code> biến mất hoàn toàn, và một giá trị <code>NaN</code> biến thành <code>null</code>. Một so sánh sau đó sai, và bug chỉ xuất hiện ở môi trường có trường ngày tháng được đặt.</p>`,
askFirst: [
`<code>JSON.stringify</code> làm gì với <code>undefined</code>, <code>Date</code>, <code>NaN</code> và <code>Infinity</code>?`,
`Có cách sao chép sâu nào đúng hơn trong môi trường hiện đại?`,
`Sao chép sâu có luôn là điều bạn muốn không?`,
],
predict: {
q: `Cho <code>const o = { a: undefined, b: new Date(0), c: NaN, d: Infinity, e: [1,2] }</code>, bản sao qua vòng JSON có những trường nào và giá trị gì?`,
a: `<p>Bản sao có <code>b</code> là chuỗi ISO chứ không còn là <code>Date</code>, <code>c</code> và <code>d</code> đều thành <code>null</code> vì JSON không có cách biểu diễn chúng, và <code>a</code> biến mất hoàn toàn vì <code>undefined</code> bị bỏ qua trong object. <code>e</code> được sao chép đúng vì mảng và số là kiểu JSON biểu diễn được. Ngoài ra cách này còn ném lỗi với cấu trúc vòng, và mất mọi prototype nên kết quả không còn là thực thể của lớp ban đầu.</p>`,
},
anchor: `Vòng JSON chỉ sao chép được đúng tập giá trị mà JSON biểu diễn được — mọi thứ khác bị đổi kiểu, bị bỏ, hoặc thành null trong im lặng.`,
attacks: [
{ q: `structuredClone có thay thế được vòng JSON trong mọi trường hợp không?`, a: `Không. <code>structuredClone</code> xử lý được <code>Date</code>, <code>Map</code>, <code>Set</code>, mảng có kiểu, và cả cấu trúc vòng — tốt hơn hẳn vòng JSON. Nhưng nó vẫn không sao chép được hàm, không giữ prototype tuỳ chỉnh, và ném lỗi với các đối tượng không clone được như handle của DOM hay <code>WeakMap</code>. Nếu object của bạn chứa phương thức hoặc thực thể của lớp, cả hai cách đều không đủ và bạn cần một hàm khởi tạo tường minh.` },
{ q: `Khi nào sao chép sâu lại là lựa chọn sai?`, a: `Khi chi phí lớn hơn lợi ích, hoặc khi nó che đi vấn đề thiết kế. Với một cấu trúc lớn được sao chép trong mỗi lần render, bạn vừa tốn thời gian vừa tốn bộ nhớ. Trong nhiều trường hợp, cách đúng là không sửa dữ liệu dùng chung ngay từ đầu: tạo object mới bằng toán tử trải ở đúng cấp cần đổi, hoặc giữ state bất biến để việc so sánh tham chiếu trở nên rẻ và đáng tin. Sao chép sâu thường là dấu hiệu ai đó đang sửa dữ liệu mà không sở hữu nó.` },
],
},
B14: {
incident: `<p>Một job chạy nền trong trình duyệt gọi ba API song song. Một API lỗi, và vì lời gọi nằm trong một hàm <code>async</code> không có <code>try/catch</code>, promise bị reject mà không ai bắt. Trình duyệt chỉ ghi một dòng cảnh báo vào console; job coi như đã hoàn tất và hiển thị trạng thái thành công cho người dùng. Ba ngày sau mới có người phát hiện dữ liệu chưa bao giờ được đồng bộ.</p>`,
askFirst: [
`Điều gì xảy ra với một promise bị reject mà không có ai bắt?`,
`Vì sao lỗi này im lặng hơn nhiều so với một exception đồng bộ?`,
`Chỗ đúng để bắt lỗi trong một hàm async là ở đâu?`,
],
predict: {
q: `Trong một hàm <code>async</code>, <code>await</code> một promise bị reject bên trong khối <code>try</code> — <code>catch</code> có bắt được không?`,
a: `<p>Có. <code>await</code> chuyển một rejection thành một exception được ném tại chính dòng đó, nên <code>catch</code> bắt được và bạn có thể chạy nhánh xử lý hoặc trả về giá trị dự phòng. Đây là khác biệt quan trọng so với việc không dùng <code>await</code>: nếu bạn chỉ gọi hàm async mà không await và không gắn <code>catch</code>, rejection trở thành một sự kiện toàn cục không ai xử lý, và trong trình duyệt nó chỉ là một cảnh báo dễ bị bỏ qua giữa hàng trăm dòng log khác.</p>`,
},
anchor: `await biến rejection thành exception tại chỗ nên try/catch bắt được; bỏ await thì rejection rơi ra ngoài và chỉ còn là một cảnh báo im lặng.`,
attacks: [
{ q: `Vì sao lỗi trong code async lại khó phát hiện hơn lỗi đồng bộ?`, a: `Vì nó mất ngữ cảnh. Một exception đồng bộ làm dừng luồng thực thi ngay và thường làm hỏng cả thao tác, nên lộ ra lập tức. Một rejection không được xử lý chỉ phát một sự kiện, không dừng gì cả; phần code sau đó vẫn chạy như thể mọi thứ thành công. Hệ quả là trạng thái ứng dụng lệch khỏi thực tế mà không có tín hiệu rõ ràng. Cách chống là bắt ở ranh giới — mọi hàm async được gọi từ sự kiện UI đều nên có xử lý lỗi — và theo dõi sự kiện rejection toàn cục để ghi log tập trung.` },
{ q: `Bắt lỗi ở mọi hàm async có phải là cách đúng?`, a: `Không. Bắt ở mọi nơi dẫn tới nuốt lỗi và che mất nguyên nhân gốc, đúng như vấn đề của <code>except: pass</code> trong Python. Nguyên tắc là bắt ở ranh giới nơi bạn có đủ ngữ cảnh để quyết định: hiển thị lỗi cho người dùng, thử lại, hay chuyển sang trạng thái dự phòng. Ở các tầng bên trong, hãy để lỗi nổi lên kèm ngữ cảnh bổ sung, và chỉ bắt khi bạn thực sự xử lý được. Một hàm tiện ích trả về promise nên để người gọi quyết định.` },
],
},
C10: {
incident: `<p>Một ứng dụng ẩn mục quản trị khỏi menu với người dùng thường, và chặn route <code>/admin</code> bằng một navigation guard kiểm tra vai trò lấy từ state ở client. Một người dùng mở DevTools, sửa giá trị vai trò trong store, và vào được giao diện quản trị. Họ không sửa được dữ liệu vì API vẫn trả 403 — nhưng họ nhìn thấy được cấu trúc màn hình và danh sách tên người dùng.</p>`,
askFirst: [
`Guard ở client bảo vệ được cái gì và không bảo vệ được cái gì?`,
`Vì sao "ẩn nút" không phải là phân quyền?`,
`Tầng nào mới là nơi quyết định quyền thật?`,
],
predict: {
q: `Một route có <code>beforeEnter</code> trả về <code>false</code>. Điều gì xảy ra với navigation, và state của ứng dụng có thay đổi không?`,
a: `<p>Navigation bị huỷ: URL không đổi và component của route đó không được dựng. Nếu guard trả về một route khác thì Vue Router chuyển hướng tới đó. Điểm cần nhớ là guard chạy ở client, trong trình duyệt của người dùng, nên nó chỉ điều khiển <em>trải nghiệm</em> chứ không phải quyền truy cập. Bất kỳ ai cũng có thể sửa state, gọi thẳng API, hoặc đọc bundle để biết có những route nào. Vì vậy guard là lớp UX, còn quyền thật phải được kiểm tra ở server cho từng request.</p>`,
},
anchor: `Guard ở client điều khiển trải nghiệm chứ không cấp quyền — quyền thật chỉ tồn tại ở tầng API, nơi mọi request đều bị kiểm tra lại.`,
attacks: [
{ q: `Vậy nếu API đã kiểm tra quyền rồi thì guard ở client còn cần không?`, a: `Cần, nhưng vì lý do khác: trải nghiệm và rò rỉ thông tin. Guard tránh cho người dùng thấy một màn hình trắng rồi hàng loạt lỗi 403, và tránh tải những bundle chỉ dùng cho vai trò khác. Nó cũng ngăn việc vô tình hiển thị dữ liệu đã có trong bộ nhớ cache của phiên trước. Nhưng phải nói rõ trong phỏng vấn: guard là lớp phòng ngừa thừa, không phải lớp bảo vệ. Nếu bạn chỉ có guard mà API không kiểm tra thì đó là lỗ hổng, không phải một thiếu sót nhỏ.` },
{ q: `Người dùng đăng nhập rồi, token hết hạn, và một guard kiểm tra "đã đăng nhập chưa" dựa vào state. Vấn đề gì xảy ra?`, a: `State ở client có thể nói "đã đăng nhập" trong khi token đã hết hạn hoặc đã bị thu hồi ở server. Khi đó guard cho qua, route được dựng, rồi mọi request trả 401 và người dùng thấy một loạt lỗi. Cách xử lý đúng là để tầng gọi API phát hiện 401 ở một chỗ duy nhất, xoá phiên, và điều hướng về trang đăng nhập — thay vì rải kiểm tra ở từng guard. Guard chỉ nên quyết định dựa trên trạng thái phiên đã được xác nhận gần đây.` },
],
},
C11: {
incident: `<p>Form tạo đơn hàng có nút Gửi. Người dùng bấm hai lần vì lần đầu không thấy phản hồi trong 1,5 giây, và hai đơn hàng giống nhau được tạo. Backend không có ràng buộc duy nhất nên cả hai đều hợp lệ. Sau đó đội thêm <code>disabled</code> cho nút khi đang gửi, nhưng lỗi vẫn xảy ra trên mạng chậm khi request đầu bị timeout ở phía client trong khi server đã ghi xong.</p>`,
askFirst: [
`Vì sao vô hiệu hoá nút không đủ để chống tạo trùng?`,
`Cần thêm gì ở tầng API để chống trùng thật?`,
`Trạng thái loading, lỗi và rỗng nên được thiết kế thế nào?`,
],
predict: {
q: `Request tạo đơn bị timeout ở phía client sau 30 giây, nhưng server đã ghi xong ở giây thứ 2. Nếu người dùng bấm Gửi lại thì chuyện gì xảy ra?`,
a: `<p>Một đơn hàng thứ hai được tạo, vì phía client không biết request đầu đã thành công. Timeout ở client chỉ có nghĩa "tôi không nhận được phản hồi trong thời gian cho phép", hoàn toàn không có nghĩa "server chưa làm gì". Đây là lý do chống trùng phải nằm ở server, dựa trên một khoá do client sinh ra một lần cho mỗi thao tác nghiệp vụ và giữ nguyên qua mọi lần thử. Vô hiệu hoá nút chỉ là lớp giảm tần suất ở giao diện.</p>`,
},
anchor: `Client không phân biệt được "chưa chạy" với "đã chạy nhưng mất phản hồi", nên chống trùng phải nằm ở server với một khoá ổn định cho mỗi thao tác.`,
attacks: [
{ q: `Khoá chống trùng nên sinh ở client hay ở server?`, a: `Ở client, nhưng phải sinh đúng lúc: một lần cho mỗi thao tác nghiệp vụ, ví dụ khi người dùng mở form, và giữ nguyên khoá đó qua mọi lần thử lại của cùng thao tác. Nếu server sinh khoá thì mỗi request là một thao tác mới và không chống được gì. Nếu client sinh khoá mới ở mỗi lần bấm thì bạn chống được retry tự động của mạng nhưng không chống được người dùng bấm hai lần. Server lưu khoá đó cùng bản ghi và từ chối khoá đã tồn tại, thường kèm thời hạn để bảng không phình vô hạn.` },
{ q: `Bốn trạng thái loading, error, empty và success — sai lầm phổ biến nhất khi hiển thị chúng là gì?`, a: `Gộp chúng lại thành một biến boolean. Khi đó "đang tải" và "không có dữ liệu" trông giống nhau, nên người dùng thấy vòng xoay mãi hoặc thấy thông báo rỗng trong lúc dữ liệu còn đang tới. Sai lầm thứ hai là không phân biệt "rỗng vì chưa có gì" với "rỗng vì bộ lọc không khớp" — hai trường hợp cần hai thông điệp và hai hành động khác nhau. Sai lầm thứ ba là để trạng thái lỗi không có đường phục hồi: người dùng phải tải lại cả trang thay vì bấm thử lại.` },
],
},
C12: {
incident: `<p>Trang chủ tải 2,1 MB JavaScript trong một bundle duy nhất, trong đó có cả trình soạn thảo văn bản chỉ dùng ở trang quản trị. Chỉ số LCP là 4,8 giây trên mạng 4G. Ngoài ra, nút đóng của hộp thoại là một <code>div</code> có sự kiện click, nên người dùng bàn phím không đóng được hộp thoại, và trình đọc màn hình không thông báo gì.</p>`,
askFirst: [
`Phần nào của bundle thực sự cần cho lần tải đầu?`,
`Vì sao một <code>div</code> có click không tương đương một <code>button</code>?`,
`Đo bằng gì để biết cải thiện có tác dụng?`,
],
predict: {
q: `Một component nặng chỉ dùng khi người dùng bấm vào tab thứ ba. Nếu bạn chuyển nó sang tải theo yêu cầu, chỉ số nào thay đổi và chỉ số nào không?`,
a: `<p>Kích thước bundle ban đầu và các chỉ số tải trang như LCP giảm, vì trình duyệt không phải tải và phân tích cú pháp phần code đó nữa. Nhưng khi người dùng bấm tab thứ ba, họ phải chờ thêm một vòng tải, nên có một độ trễ mới xuất hiện ở tương tác đó. Vì vậy tải theo yêu cầu không miễn phí: nó chuyển chi phí từ lúc tải trang sang lúc tương tác. Cần cân nhắc tần suất sử dụng — nếu 90% người dùng mở tab đó ngay, tải trước vẫn tốt hơn.`,
},
anchor: `Tải theo yêu cầu không xoá chi phí, nó chuyển chi phí từ lúc tải trang sang lúc tương tác — nên quyết định dựa trên tần suất dùng thật.`,
attacks: [
{ q: `Vì sao dùng div làm nút lại là lỗi, khi nó trông giống hệt?`, a: `Vì một phần lớn hành vi của nút đến từ trình duyệt chứ không từ CSS. <code>button</code> đã có sẵn khả năng nhận focus bằng Tab, kích hoạt bằng Enter và Space, thông báo vai trò cho trình đọc màn hình, và trạng thái disabled đúng chuẩn. Một <code>div</code> có click không có gì trong số đó, nên bạn phải tự thêm <code>tabindex</code>, xử lý bàn phím, gán <code>role</code> và trạng thái ARIA — và gần như luôn làm thiếu một thứ. Dùng đúng thẻ ngữ nghĩa rẻ hơn và đúng hơn là tự dựng lại hành vi.` },
{ q: `Bạn đo cải thiện hiệu năng bằng cách nào để không tự lừa mình?`, a: `Đo trên thiết bị và mạng đại diện cho người dùng thật, không đo trên máy phát triển với cache đã ấm. Dùng bốn chỉ số cốt lõi — LCP cho tốc độ hiển thị nội dung chính, INP cho độ trễ phản hồi tương tác, CLS cho mức xê dịch bố cục, và TTFB cho phía server. Quan trọng nhất là nhìn phân vị p75 chứ không phải giá trị trung bình, vì trung bình che mất nhóm người dùng chậm. Và luôn so sánh trước/sau trên cùng một kịch bản đo, nếu không thì con số không có nghĩa gì.` },
],
},
};
