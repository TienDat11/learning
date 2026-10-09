// Batch A — Python P1/P2 questions A08..A18.
// Each question gains: incident (the production failure), askFirst (questions to answer
// before reading the explanation), predict (a committed guess), anchor (one causal
// sentence), attacks (what a hostile interviewer asks next).
// Values are plain JS literals; add-fields.mjs serialises them with JSON.stringify.
export default {
A08: {
incident: `<p>Endpoint <code>GET /reports/export</code> trả CSV cho bảng <code>events</code> có 2,4 triệu dòng. Dev viết <code>rows = db.execute(select).fetchall()</code> rồi mới ghi file. Ở staging bảng chỉ có 50 nghìn dòng nên chạy trong 1,2 giây và tốn 90 MB. Lên production, worker bị OOM kill ở mức 3,5 GB sau khoảng 40 giây, và container restart liên tục. Log ứng dụng không có exception nào — chỉ có exit code 137 từ Docker. Điều đáng chú ý là bản thân truy vấn SQL chỉ mất 600 ms; toàn bộ phần thời gian và bộ nhớ còn lại nằm ở chỗ vật chất hoá kết quả thành list trong bộ nhớ Python.</p>`,
askFirst: [
`Bộ nhớ bị chiếm ở dòng nào, và dòng đó có nhất thiết phải tồn tại không?`,
`Nếu bỏ được dòng đó, điều gì thay đổi về bộ nhớ và về thời gian tới byte đầu tiên?`,
`Vì sao lỗi chỉ xuất hiện khi bảng lớn hơn, chứ không xuất hiện khi code sai?`,
],
predict: {
q: `Hàm <code>def gen(): if False: yield 1</code> khi được gọi, rồi <code>next()</code> một lần, sẽ làm gì?`,
a: `<p>Gọi <code>gen()</code> không chạy thân hàm, chỉ dựng generator. Lần <code>next()</code> đầu tiên mới thực sự chạy thân hàm; nó chạm tới cuối mà không gặp <code>yield</code> nào nên ném <code>StopIteration</code> ngay lập tức. Đây là điểm dễ sai: sự tồn tại của từ khoá <code>yield</code> ở đâu đó trong thân hàm là điều quyết định hàm trở thành generator, chứ không phải việc nhánh chứa nó có được thực thi hay không.</p>`,
},
anchor: `Generator là khung hàm bị treo giữa các lần next nên bộ nhớ chỉ giữ một phần tử tại một thời điểm — vật chất hoá nó thành list là tự tay trả lại toàn bộ chi phí.`,
attacks: [
{ q: `Bạn nói generator tiết kiệm bộ nhớ. Vậy vì sao chuyển sang generator mà endpoint vẫn chậm như cũ?`, a: `Vì bộ nhớ và độ trễ là hai trục khác nhau. Generator bỏ được chi phí vật chất hoá, nhưng không làm truy vấn nhanh hơn và không giảm số round-trip. Nếu consumer vẫn gọi <code>list(...)</code> ở đâu đó thì bộ nhớ quay lại y nguyên. Và nếu mỗi phần tử cần thêm một truy vấn phụ thì bạn đã đổi OOM thành N+1 — chậm nhưng không chết, nên khó phát hiện hơn.` },
{ q: `Generator chỉ đi được một lần. Nếu tôi cần duyệt hai lượt trên cùng dữ liệu thì làm thế nào?`, a: `Ba lựa chọn với đánh đổi khác nhau. Một là chạy lại truy vấn cho lượt thứ hai, chấp nhận đọc database hai lần. Hai là <code>itertools.tee</code>, nhưng nó đệm những phần tử chưa được tiêu thụ nên bộ nhớ có thể quay lại đúng như cũ. Ba là tách thành hai nhánh xử lý trong cùng một lượt duy nhất, mỗi phần tử đi qua cả hai — thường là cách đúng, vì giữ được tính một lượt và không đệm gì.` },
],
},
A09: {
incident: `<p>Job đối soát thanh toán chạy mỗi đêm. Một dev bọc toàn bộ thân job trong <code>try: ... except: pass</code> với lý do "job không bao giờ được chết". Ba tuần sau, kế toán báo còn 4.120 giao dịch chưa được đối soát. Log của job vẫn ghi <code>done, 0 errors</code> mỗi đêm. Nguyên nhân thật là một lỗi kết nối database thoáng qua ở giữa vòng lặp: <code>except:</code> trần bắt luôn lỗi đó, nuốt nó, và vòng lặp tiếp tục với phần dữ liệu còn lại. Cùng câu lệnh đó cũng bắt luôn <code>KeyboardInterrupt</code>, nên khi ops bấm Ctrl-C để dừng job đang treo, job vẫn chạy tiếp.</p>`,
askFirst: [
`<code>except:</code> trần bắt được những gì mà <code>except Exception:</code> không bắt?`,
`Nếu job không được phép chết, nó phải làm gì thay vì nuốt lỗi?`,
`Vì sao dòng log "0 errors" lại là dấu hiệu đáng ngờ chứ không phải tin tốt?`,
],
predict: {
q: `Trong <code>try/except/else/finally</code>, khối <code>else</code> chạy khi nào, và <code>finally</code> có chạy khi <code>try</code> thoát bằng <code>return</code> không?`,
a: `<p><code>else</code> chỉ chạy khi khối <code>try</code> kết thúc mà không ném lỗi nào — đó là chỗ đặt code chỉ nên chạy khi mọi thứ thành công, tránh việc vô tình bắt lỗi của chính code xử lý thành công. <code>finally</code> luôn chạy, kể cả khi <code>try</code> thoát bằng <code>return</code>, bằng <code>break</code>, hay bằng một exception chưa được bắt. Một điểm ít người để ý: nếu <code>finally</code> có <code>return</code>, nó ghi đè giá trị trả về của <code>try</code> và nuốt luôn exception đang bay.</p>`,
},
anchor: `except trần bắt cả tín hiệu hệ thống lẫn lỗi lập trình, nên nó biến một sự cố ồn ào thành một dòng log im lặng.`,
attacks: [
{ q: `Vậy bạn khuyên không bao giờ dùng except Exception?`, a: `Không. Ở ranh giới hệ thống — một worker, một request handler, một job runner — bắt <code>Exception</code> là đúng, vì bạn cần ghi log có ngữ cảnh rồi quyết định thử lại hay bỏ. Điều sai là bắt rồi <em>im lặng</em>. Quy tắc thực dụng: bắt ở ranh giới, log kèm định danh công việc, rồi hoặc ném lại, hoặc chuyển sang trạng thái lỗi có kiểm soát. Còn <code>except:</code> trần thì gần như luôn sai, vì nó bắt cả <code>KeyboardInterrupt</code> và <code>SystemExit</code>.` },
{ q: `Làm sao bạn phát hiện một except đang nuốt lỗi trong một codebase lớn?`, a: `Bắt đầu bằng việc tìm các khối <code>except</code> mà thân chỉ có <code>pass</code>, <code>continue</code>, hoặc một dòng log không kèm exception. Bước hai là kiểm tra exception gốc có được truyền vào logger hay không — mất stack trace là mất khả năng chẩn đoán. Bước ba là đối chiếu số liệu nghiệp vụ với số liệu kỹ thuật: job ghi 0 lỗi nhưng bảng đích thiếu dòng là dấu hiệu kinh điển. Về lâu dài, cấu hình linter cấm <code>except:</code> trần và cấm <code>pass</code> trong thân <code>except</code>.` },
],
},
A10: {
incident: `<p>Một service đọc file cấu hình trong mỗi request. Dev viết <code>f = open(path); data = json.load(f)</code> và không đóng file. Sau khoảng 1.020 request, service bắt đầu ném <code>OSError: [Errno 24] Too many open files</code>. Cùng lúc đó, ở một chỗ khác trong codebase có một context manager tự viết: <code>__exit__</code> của nó trả về <code>True</code>, nên lỗi ghi log bên trong khối <code>with</code> bị nuốt hoàn toàn — chương trình chạy tiếp như chưa có gì xảy ra.</p>`,
askFirst: [
`Điều gì đảm bảo <code>__exit__</code> được gọi kể cả khi thân khối <code>with</code> ném lỗi?`,
`Giá trị trả về của <code>__exit__</code> quyết định điều gì?`,
`Vì sao lỗi chỉ xuất hiện sau khoảng một nghìn request chứ không phải ngay lập tức?`,
],
predict: {
q: `<code>__exit__</code> trả về <code>True</code> khác gì trả về <code>False</code> hay <code>None</code> khi thân khối <code>with</code> đang có exception?`,
a: `<p>Trả <code>True</code> nghĩa là "tôi đã xử lý lỗi này" — Python nuốt exception và chương trình tiếp tục sau khối <code>with</code>. Trả <code>False</code> hoặc <code>None</code> nghĩa là không xử lý, exception tiếp tục nổi lên. Vì <code>None</code> là giá trị trả về mặc định của một hàm không có <code>return</code>, nên một <code>__exit__</code> viết theo thói quen sẽ tự động truyền lỗi ra ngoài. Đây là chỗ dễ viết ngược nhất trong toàn bộ giao thức context manager.</p>`,
},
anchor: `__exit__ trả True là nuốt lỗi, trả False hoặc None là để lỗi nổi lên — viết ngược dấu này là tự tay tắt mọi cảnh báo của khối with.`,
attacks: [
{ q: `Viết context manager bằng class khác gì dùng contextlib.contextmanager?`, a: `Bản dùng <code>@contextmanager</code> biến một generator thành context manager: code trước <code>yield</code> là phần mở, code sau <code>yield</code> là phần đóng, và phần đóng chạy trong <code>finally</code>. Khác biệt quan trọng nằm ở xử lý lỗi: nếu thân khối <code>with</code> ném lỗi, exception được ném vào ngay tại điểm <code>yield</code>, nên bạn phải bọc <code>try/except</code> quanh <code>yield</code> nếu muốn nuốt nó. Bản class cho quyền kiểm soát rõ ràng hơn qua giá trị trả về của <code>__exit__</code>, và phù hợp khi cần giữ state phức tạp hoặc tái sử dụng nhiều nơi.` },
{ q: `Nếu trong __exit__ bạn ném một exception mới thì chuyện gì xảy ra với exception cũ?`, a: `Exception mới thay thế exception đang bay, và exception cũ được gắn vào thuộc tính <code>__context__</code> của nó. Traceback khi đó in ra cả hai theo chuỗi "During handling of the above exception, another exception occurred". Điều này quan trọng khi dọn tài nguyên: nếu việc đóng kết nối cũng lỗi, bạn có thể che mất lỗi gốc — nguyên nhân thật của sự cố — bằng một lỗi phụ. Cách xử lý là bọc riêng phần dọn dẹp trong <code>try/except</code> và log lỗi dọn dẹp, đừng để nó thay thế lỗi chính.` },
],
},
A11: {
incident: `<p>Model <code>Article</code> khai báo <code>tags = []</code> ngay trong thân lớp với ý định làm giá trị mặc định. Trên staging mọi thứ đúng vì mỗi test chỉ tạo một bài. Trên production, sau khi tạo 10.000 bài, mọi bài đều hiển thị cùng một danh sách tag — chính là danh sách của bài được gắn thẻ sau cùng. Không có exception nào được ném ra, chỉ có dữ liệu sai. Cùng lúc, một lớp con kế thừa theo mô hình kim cương gọi nhầm phương thức của lớp ông thay vì lớp cha gần nhất.</p>`,
askFirst: [
`<code>tags = []</code> trong thân lớp nằm trên object nào?`,
`Ai quyết định phương thức nào được gọi khi một lớp có nhiều lớp cha?`,
`Vì sao lỗi này không xuất hiện ở staging?`,
],
predict: {
q: `Với <code>class Child(Base)</code>, <code>Child.__mro__</code> chứa những gì và thứ tự đó quyết định điều gì?`,
a: `<p><code>Child.__mro__</code> cho <code>(Child, Base, object)</code>. Thứ tự này là thứ tự Python duyệt để tìm thuộc tính và phương thức: lớp con trước, rồi tới lớp cha, rồi <code>object</code>. Với đa kế thừa, thứ tự do C3 linearization tính ra và đảm bảo hai tính chất — lớp con luôn đứng trước lớp cha của nó, và thứ tự tương đối giữa các lớp cha được giữ nguyên. Đó là lý do cùng một tập lớp cha luôn cho cùng một MRO, không phụ thuộc thứ tự khai báo.</p>`,
},
anchor: `Gán trong thân lớp là gán lên object lớp và bị mọi instance chia sẻ; chỉ gán trong __init__ mới tạo thuộc tính riêng cho từng instance.`,
attacks: [
{ q: `Nếu tôi luôn gán self.tags = [] trong __init__ thì thuộc tính lớp còn dùng để làm gì?`, a: `Vẫn hữu ích cho hai việc: hằng số dùng chung và giá trị mặc định chỉ đọc. Ví dụ <code>max_retries = 3</code> hay <code>table_name = "articles"</code> nên nằm ở cấp lớp vì chúng bất biến. Vấn đề chỉ xuất hiện với giá trị mutable, vì instance nào sửa cũng sửa lên object lớp dùng chung. Một điểm tinh tế: nếu bạn chỉ <em>đọc</em> thuộc tính lớp qua <code>self</code>, Python không tạo bản sao; nhưng ngay khi bạn <em>gán</em> <code>self.x = ...</code>, nó tạo thuộc tính mới trên instance và từ đó che thuộc tính lớp.` },
{ q: `MRO giải quyết vấn đề gì mà đa kế thừa đơn giản không giải quyết được?`, a: `Nó giải quyết tính không xác định. Nếu không có thứ tự tuyệt đối, một lớp kế thừa từ hai lớp cùng định nghĩa một phương thức sẽ không biết gọi bản nào, và hành vi phụ thuộc vào thứ tự khai báo — cực kỳ khó gỡ lỗi. C3 linearization biến câu hỏi đó thành một hàm thuần tuý của tập lớp, nên kết quả tất định và kiểm tra được. Hệ quả thực tế là bạn có thể gọi <code>super()</code> trong mọi lớp của chuỗi và mỗi lớp chỉ chạy đúng một lần, kể cả trong mô hình kim cương.` },
],
},
A12: {
incident: `<p>Một API trả về 200 đơn hàng. Serializer đọc <code>order.total</code>, và <code>total</code> được viết bằng <code>@property</code> có truy vấn database để cộng các dòng chi tiết. Vì trông như một thuộc tính bình thường, không ai để ý rằng mỗi lần truy cập là một truy vấn. Kết quả: 1 truy vấn lấy đơn hàng cộng 200 truy vấn tính tổng, endpoint mất 4,1 giây. Cùng lúc, một <code>@dataclass</code> khai báo <code>items: list = []</code> làm module đổ ngay khi import, vì dataclass từ chối giá trị mặc định mutable.</p>`,
askFirst: [
`Vì sao cú pháp thuộc tính làm chi phí thật bị che đi?`,
`Vì sao dataclass từ chối mặc định là list, trong khi hàm thường thì không?`,
`Sửa thế nào để giữ cú pháp gọn mà không sinh N+1?`,
],
predict: {
q: `<code>@dataclass class Cart: items: list = []</code> sẽ làm gì khi module được import?`,
a: `<p>Nó ném <code>ValueError: mutable default for field items is not allowed</code> ngay lúc định nghĩa lớp. Đây là điểm thú vị: dataclass biết chính xác cái bẫy mà tham số mặc định của hàm vẫn để lọt, và nó chọn cách chặn từ đầu. Cách viết đúng là <code>field(default_factory=list)</code>, nghĩa là "gọi hàm này để tạo giá trị mới cho mỗi instance" — đúng cùng một ý tưởng với việc dùng <code>None</code> rồi tạo list trong thân hàm.</p>`,
},
anchor: `property che một lời gọi hàm sau cú pháp thuộc tính, nên công việc đắt đỏ đặt trong đó biến mọi vòng lặp thành N+1 mà không ai nhìn thấy.`,
attacks: [
{ q: `Vậy khi nào nên dùng property, khi nào nên dùng phương thức thường?`, a: `Nguyên tắc là chi phí phải lộ ra qua cú pháp. Property phù hợp khi việc tính toán rẻ, thuần tuý, không chạm I/O — ví dụ ghép <code>full_name</code> từ hai trường, hoặc chuẩn hoá một giá trị đã có trong bộ nhớ. Ngay khi việc tính cần truy vấn database, gọi mạng hay đọc file, hãy dùng phương thức có tên động từ như <code>compute_total()</code>, vì cú pháp gọi hàm nhắc người đọc rằng có chi phí. Một dấu hiệu khác: nếu property có thể ném exception do I/O thì nó gần như chắc chắn nên là phương thức.` },
{ q: `classmethod và staticmethod khác nhau chỗ nào, và khi nào chọn cái nào?`, a: `<code>classmethod</code> nhận <code>cls</code> nên biết mình được gọi trên lớp nào; nó phù hợp cho alternate constructor như <code>from_dict()</code>, vì lớp con gọi sẽ nhận đúng lớp con. <code>staticmethod</code> không nhận <code>self</code> cũng không nhận <code>cls</code>, thực chất chỉ là một hàm thường được đặt trong namespace của lớp để thể hiện quan hệ logic — ví dụ một hàm validate định dạng. Nếu hàm cần biết lớp, dùng <code>classmethod</code>; nếu nó hoàn toàn độc lập, dùng <code>staticmethod</code>; còn nếu nó cần state của instance thì đó là phương thức thường.` },
],
},
A13: {
incident: `<p>Một hàm được annotate <code>def find_user(uid: int) -> dict:</code> nhưng trên đường không tìm thấy, nó <code>return None</code>. Type checker không chạy trong CI. Ba tháng sau, một endpoint gọi <code>find_user(uid)["email"]</code> và ném <code>TypeError: NoneType object is not subscriptable</code> — lỗi 500 đầu tiên trong production. Annotation đã nói dối suốt ba tháng mà không ai biết, vì Python không hề kiểm tra nó lúc chạy.</p>`,
askFirst: [
`Python có thực thi annotation lúc chạy không?`,
`Annotation được lưu ở đâu, và ai thực sự đọc chúng?`,
`Vì sao một annotation sai vẫn tồn tại được lâu như vậy?`,
],
predict: {
q: `<code>def f(x: int) -> str: return x</code> — gọi <code>f("abc")</code> thì chuyện gì xảy ra?`,
a: `<p>Không có gì bất thường: hàm trả về chính chuỗi <code>"abc"</code>. Python đánh giá biểu thức trong annotation lúc định nghĩa hàm và lưu kết quả vào <code>f.__annotations__</code>, nhưng không bao giờ kiểm tra giá trị truyền vào hay giá trị trả về. Muốn có kiểm tra lúc chạy thì phải dùng một thư viện chủ động đọc annotation để tự kiểm tra, ví dụ Pydantic, hoặc một decorator như <code>@typechecked</code> của thư viện bên ngoài. Đây là lý do annotation một mình không bảo vệ được gì trong production.</p>`,
},
anchor: `Annotation là dữ liệu mô tả chứ không phải ràng buộc — không có type checker trong CI thì nó chỉ là một dòng tài liệu có thể sai.`,
attacks: [
{ q: `Vậy annotation có tác dụng gì lúc chạy, hay chỉ để cho đẹp?`, a: `Có tác dụng thật, nhưng không phải để kiểm tra. FastAPI đọc annotation của tham số để validate và sinh OpenAPI; Pydantic đọc chúng để dựng model; <code>dataclasses</code> đọc chúng để sinh <code>__init__</code>; một số thư viện DI đọc chúng để tự inject. Điểm chung là annotation trở thành <em>input cho một bộ máy khác</em>, chứ không phải một hàng rào. Nên câu trả lời đúng trong phỏng vấn là: annotation có giá trị lúc chạy khi và chỉ khi có thứ gì đó chủ động đọc nó.` },
{ q: `from __future__ import annotations thay đổi điều gì, và khi nào nó gây hại?`, a: `Nó khiến mọi annotation được lưu dưới dạng chuỗi thay vì được đánh giá ngay, theo PEP 563. Lợi là forward reference hoạt động mà không cần dấu ngoặc kép, và thời gian import giảm vì annotation không phải thực thi. Hại là bất kỳ ai đọc <code>__annotations__</code> lúc chạy sẽ nhận chuỗi chứ không nhận đối tượng kiểu, nên phải gọi <code>typing.get_type_hints()</code> để phân giải. Với FastAPI và Pydantic thì chúng xử lý được, nhưng code tự viết để soi annotation thì rất dễ vỡ.` },
],
},
A14: {
incident: `<p>Một job băm ảnh để phát hiện trùng lặp chạy 12.000 ảnh trong 4 phút. Dev đổi sang <code>ThreadPoolExecutor(max_workers=8)</code> vì máy có 8 nhân, kỳ vọng còn khoảng 30 giây. Thực tế job chạy 3 phút 50 giây — nhanh hơn không đáng kể. Đo lại thì tỉ lệ thời gian so với chạy tuần tự là 1,05. Cùng lúc, đội nghe nói CPython có bản free-threaded nên hỏi có nên chuyển sang để bỏ hẳn vấn đề này.</p>`,
askFirst: [
`GIL thực sự tuần tự hoá cái gì?`,
`Khi nào GIL được nhả ra?`,
`Vì sao 8 luồng không cho tốc độ gần 8 lần?`,
],
predict: {
q: `Với một tác vụ CPU-bound thuần Python, chạy 8 luồng so với chạy tuần tự thì tỉ lệ thời gian xấp xỉ bao nhiêu, và vì sao?`,
a: `<p>Xấp xỉ 1,0, có khi còn chậm hơn chạy tuần tự vì chi phí chuyển ngữ cảnh giữa các luồng. GIL chỉ cho một luồng thực thi bytecode tại một thời điểm trong mỗi tiến trình, nên 8 luồng vẫn xếp hàng qua cùng một khoá. Muốn dùng hết 8 nhân cho CPU-bound thì phải dùng nhiều tiến trình — <code>ProcessPoolExecutor</code> hoặc <code>multiprocessing</code> — vì mỗi tiến trình có interpreter và GIL riêng.</p>`,
},
anchor: `GIL giữ đúng một luồng chạy bytecode tại một thời điểm, nên CPU-bound không scale theo số luồng; chỉ I/O mới được lợi vì thư viện C nhả GIL quanh lời gọi chặn.`,
attacks: [
{ q: `Bản free-threaded của CPython có phải chỉ cần bật là xong?`, a: `Không. Nó là một bản build riêng — trên Linux thường là <code>python3.13t</code>, cấu hình bằng <code>--disable-gil</code> khi build. Lúc chạy có thể kiểm soát bằng biến môi trường <code>PYTHON_GIL=0</code> hoặc cờ <code>-X gil=0</code>, và kiểm tra trạng thái bằng <code>sys._is_gil_enabled()</code>. Ba điều cần lưu ý: extension C phải được build lại và khai báo hỗ trợ, hiệu năng đơn luồng thường thấp hơn bản có GIL, và tính song song thật chỉ đạt được khi code không tranh chấp trên cùng cấu trúc dữ liệu.` },
{ q: `Nếu GIL chặn song song, vì sao threading vẫn nhanh hơn hẳn cho tác vụ I/O?`, a: `Vì phần lớn thời gian của tác vụ I/O không nằm trong bytecode Python. Khi một luồng gọi vào thư viện C — socket, <code>read</code>, driver database — thư viện nhả GIL trong lúc chờ, nên các luồng khác chạy bytecode được. Vì vậy với 100 request mạng đang chờ, 100 luồng vẫn hữu ích dù chỉ một luồng chạy Python tại một thời điểm. Điều này cũng giải thích vì sao một vòng lặp Python thuần cộng số trong luồng thì không nhanh hơn, còn gọi mạng thì nhanh hơn nhiều.` },
],
},
A15: {
incident: `<p>Một endpoint tổng hợp giá gọi 10.000 URL cùng lúc bằng <code>await asyncio.gather(*[fetch(u) for u in urls])</code>. Ở staging với 50 URL, p99 là 300 ms. Ở production, service ném <code>OSError: [Errno 24] Too many open files</code> và đối tác bắt đầu trả 429 vì bị dội cùng lúc. Điều bất ngờ là CPU gần như rảnh — nút thắt không nằm ở tính toán mà ở số kết nối đồng thời và ở phía bị gọi.</p>`,
askFirst: [
`<code>await</code> thực chất làm gì với luồng thực thi?`,
`Vì sao <code>gather</code> 10.000 coroutine lại mở tới 10.000 kết nối?`,
`Nếu một URL lỗi thì <code>gather</code> xử lý thế nào?`,
],
predict: {
q: `<code>asyncio.gather</code> với ba coroutine, một cái ném lỗi — mặc định chuyện gì xảy ra với hai cái còn lại?`,
a: `<p>Mặc định <code>return_exceptions=False</code>, nên exception đầu tiên được ném ngay ra ngoài <code>gather</code>, và hai coroutine còn lại <em>vẫn tiếp tục chạy</em> chứ không bị huỷ. Đây là điểm hay bị hiểu sai: <code>gather</code> không huỷ anh em khi có lỗi. Muốn huỷ thì phải dùng <code>asyncio.TaskGroup</code> — khi một task lỗi, nó huỷ các task còn lại và ném ra <code>ExceptionGroup</code>. Còn nếu muốn nhận hết kết quả bất kể lỗi, dùng <code>return_exceptions=True</code>.</p>`,
},
anchor: `await nhường quyền điều khiển cho event loop chứ không tạo luồng mới, nên mọi thứ chặn trong coroutine là chặn cả event loop.`,
attacks: [
{ q: `TaskGroup khác gather ở điểm nào quan trọng nhất trong production?`, a: `Ở hành vi khi có lỗi. <code>gather</code> để các task anh em chạy tiếp tới hết, nên bạn có thể đã ghi nửa dữ liệu rồi mới ném lỗi ra — trạng thái dở dang. <code>TaskGroup</code> huỷ các task còn lại ngay khi một task lỗi, nên cửa sổ dở dang hẹp hơn nhiều, và nó gom mọi lỗi vào một <code>ExceptionGroup</code> để bạn không mất thông tin. Đánh đổi là bạn phải xử lý <code>ExceptionGroup</code>, và các task bị huỷ phải được viết để chịu được <code>CancelledError</code>.` },
{ q: `task.cancel() có dừng coroutine ngay lập tức không?`, a: `Không. <code>cancel()</code> chỉ đặt yêu cầu huỷ; <code>CancelledError</code> được ném vào coroutine tại điểm <code>await</code> kế tiếp. Nghĩa là nếu coroutine đang chạy một vòng lặp CPU thuần không có <code>await</code>, nó sẽ không bị huỷ cho tới khi chạm một điểm await. Hệ quả thực tế là code dọn dẹp phải nằm trong <code>finally</code>, và bên trong <code>finally</code> bạn không được nuốt <code>CancelledError</code> — nuốt nó là phá vỡ cơ chế huỷ của toàn bộ hệ thống.` },
],
},
A16: {
incident: `<p>Một endpoint <code>async def</code> gọi <code>requests.get()</code> tới dịch vụ đối tác, mất 3 giây. Trước khi thêm endpoint đó, p99 của service là 90 ms. Sau khi thêm, p99 của <em>mọi</em> endpoint tăng lên hơn 3 giây, kể cả những endpoint không hề gọi đối tác. Số request mỗi giây giảm từ 1.400 xuống 300 dù CPU chỉ dùng 12%.</p>`,
askFirst: [
`Dòng nào thực sự chặn, và nó chặn cái gì?`,
`Vì sao các endpoint không liên quan cũng chậm đi?`,
`Làm sao phát hiện kiểu lỗi này trên production?`,
],
predict: {
q: `Trong một <code>async def</code> đang chạy lời gọi blocking 3 giây, các request khác tới cùng tiến trình sẽ ra sao?`,
a: `<p>Chúng phải chờ hết 3 giây đó. <code>async def</code> chạy trực tiếp trên event loop của tiến trình, và event loop là một luồng duy nhất. Khi bạn gọi một hàm blocking, luồng đó không quay lại event loop, nên không coroutine nào khác được chạy — không phải chậm, mà là đứng hoàn toàn. Đây là khác biệt cốt lõi so với <code>def</code> thường: FastAPI đẩy <code>def</code> sang threadpool nên nó không giữ event loop.</p>`,
},
anchor: `Một lời gọi blocking trong async def giữ luồng của event loop, nên nó chặn toàn bộ tiến trình chứ không chỉ request đang gọi.`,
attacks: [
{ q: `Làm sao bạn biết event loop đang bị chặn chứ không phải database chậm?`, a: `Ba dấu hiệu phân biệt. Thứ nhất, chạy uvicorn ở chế độ debug để nhận cảnh báo về handle chạy quá lâu — nó chỉ đích danh chỗ chặn. Thứ hai, đo event loop lag: nếu độ trễ của mọi endpoint cùng tăng trong khi thời gian truy vấn database không đổi thì nút thắt nằm ở loop. Thứ ba, nhìn hình dạng tải: số request mỗi giây giảm mạnh trong khi CPU thấp là chữ ký của chặn I/O đồng bộ, còn database chậm thường kèm thời gian truy vấn tăng trong log.` },
{ q: `Chuyển lời gọi blocking sang run_in_executor có giải quyết hết vấn đề không?`, a: `Nó gỡ được event loop, nhưng chỉ dời nút thắt. Threadpool mặc định có giới hạn số luồng — với anyio là 40 token — nên nếu bạn đẩy nhiều hơn thế, các lời gọi lại xếp hàng và độ trễ quay lại. Bạn cũng phải chọn đúng executor: thread cho I/O blocking, process cho CPU-bound. Và nếu đối tác chỉ chịu được 50 kết nối đồng thời thì việc đẩy sang threadpool vẫn tạo ra 500 kết nối nếu bạn không giới hạn. Giải pháp thật thường là đổi sang HTTP client async, rồi đặt một semaphore để giới hạn đồng thời.` },
],
},
A17: {
incident: `<p>Một service có 180 unit test, tất cả xanh, độ phủ 92%. Một lần deploy, tính năng chuyển tiền lỗi: giao dịch bị trừ hai lần khi client thử lại. Bộ test không phát hiện vì repository database đã bị mock, và mock được lập trình để luôn trả về thành công — nó không mô phỏng được hành vi thật của một lần ghi trùng. Sau đó đội thêm một integration test dựng database thật và tìm ra lỗi trong 10 phút.</p>`,
askFirst: [
`Mock đang che mất loại lỗi nào?`,
`Ranh giới nên đặt mock ở đâu?`,
`Vì sao độ phủ 92% vẫn không bắt được lỗi này?`,
],
predict: {
q: `Nếu bạn mock một repository và assert rằng <code>save()</code> được gọi đúng một lần, test đó thực sự kiểm tra điều gì?`,
a: `<p>Nó kiểm tra <em>cách viết code</em>, không kiểm tra <em>hành vi</em>. Test sẽ đỏ khi bạn refactor sang một API khác tương đương về nghiệp vụ, và sẽ xanh khi logic nghiệp vụ sai nhưng vẫn gọi <code>save()</code> đúng một lần. Đây là dấu hiệu mock bị đặt sai chỗ: mock nên thay thế hệ thống bạn không sở hữu — mạng, dịch vụ bên thứ ba, đồng hồ, nguồn ngẫu nhiên — chứ không nên thay thế chính tầng bạn đang muốn kiểm tra.</p>`,
},
anchor: `Mock ở ranh giới hệ thống; mock thứ bạn sở hữu là tự che lỗi của chính mình.`,
attacks: [
{ q: `Vậy có nên bỏ mock và dùng database thật trong mọi test?`, a: `Không, vì chi phí. Một test cần database thật mất hàng trăm mili giây tới vài giây; 1.000 test như vậy là hàng chục phút mỗi lần commit, và đội sẽ bắt đầu bỏ qua CI. Cách cân bằng thường dùng là hình kim tự tháp: nhiều unit test nhanh cho logic thuần, một tầng integration test dựng database thật (qua container hoặc schema tạm) cho các luồng quan trọng như ghi nhiều bước, ràng buộc duy nhất và transaction, và vài e2e test cho luồng người dùng chính. Điều quan trọng là phải có ít nhất một tầng chạm hệ thống thật.` },
{ q: `Fixture scope ảnh hưởng gì tới tính đúng đắn của test?`, a: `Rất nhiều, và theo hướng âm thầm. Fixture ở scope <code>session</code> hoặc <code>module</code> được tạo một lần và chia sẻ, nên nếu nó chứa state mutable — một database dùng chung, một cache, một đối tượng cấu hình bị sửa — thì test này để lại dấu vết cho test khác. Triệu chứng kinh điển là test xanh khi chạy riêng và đỏ khi chạy cả bộ, hoặc đổi thứ tự chạy thì kết quả đổi. Quy tắc an toàn là fixture mặc định ở scope <code>function</code>, chỉ nâng lên scope rộng hơn khi việc tạo thực sự đắt và fixture thực sự bất biến.` },
],
},
A18: {
incident: `<p>Một service cần vừa phục vụ 5.000 kết nối đang chờ phản hồi từ đối tác, vừa băm ảnh để tạo thumbnail. Đội chọn multiprocessing cho cả hai vì "nhiều tiến trình thì dùng hết được nhiều nhân". Kết quả: phần chờ mạng tốn 6 GB RAM vì mỗi tiến trình giữ một bản sao trạng thái, và chi phí serialize dữ liệu ảnh qua ranh giới tiến trình còn lớn hơn thời gian băm. p99 tăng gấp bốn lần.</p>`,
askFirst: [
`Điểm nghẽn của từng loại công việc là gì?`,
`Vì sao cùng một lựa chọn lại đúng cho việc này và sai cho việc kia?`,
`Chi phí ẩn của multiprocessing là gì?`,
],
predict: {
q: `Với 10.000 kết nối mạng đang chờ và 8 nhân cần băm ảnh, bạn chọn mô hình nào cho từng phần?`,
a: `<p>Phần chờ mạng dùng asyncio: chi phí mỗi kết nối là một coroutine nhẹ, một luồng đủ quản lý hàng nghìn kết nối đang chờ, và không tốn nhân nào vì thời gian nằm ở phía đối tác. Phần băm ảnh dùng nhiều tiến trình: đây là CPU-bound thuần, GIL chặn luồng, nên chỉ tiến trình mới dùng hết 8 nhân. Điểm mấu chốt là hai phần có điểm nghẽn khác nhau, nên câu trả lời đúng là dùng cả hai mô hình trong cùng một hệ thống, chứ không phải chọn một cái cho tất cả.</p>`,
},
anchor: `Chọn mô hình theo điểm nghẽn: chờ I/O thì asyncio, tính toán thì process, chờ thư viện C nhả GIL thì thread.`,
attacks: [
{ q: `asyncio có nhanh hơn threading không?`, a: `Không nhanh hơn về bản chất — cả hai đều không vượt được GIL cho CPU-bound, và cả hai đều chạy trên một nhân nếu chỉ có một tiến trình. asyncio thắng ở chi phí tài nguyên cho mỗi đơn vị công việc: một coroutine nhẹ hơn một luồng hệ điều hành rất nhiều, nên quản lý 10.000 kết nối đang chờ là khả thi. Nhưng nó thua ở chỗ không có song song thật, và mọi thư viện blocking đều phải thay bằng bản async. Nếu hệ sinh thái của bạn toàn thư viện blocking thì threading thực dụng hơn.` },
{ q: `Nhược điểm thật của multiprocessing trong production là gì?`, a: `Bốn thứ. Một là chi phí khởi động: mỗi tiến trình phải import lại module và khởi tạo lại tài nguyên. Hai là serialize: mọi thứ qua ranh giới tiến trình phải được pickle, và với dữ liệu lớn chi phí này có thể lớn hơn chính công việc. Ba là bộ nhớ: mỗi tiến trình có không gian địa chỉ riêng nên trạng thái lớn bị nhân bản. Bốn là không chia sẻ state: bạn phải đồng bộ qua queue hoặc shared memory, và mọi giả định về tính nhất quán phải được viết lại.` },
],
},
};
