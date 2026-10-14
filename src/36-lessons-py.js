var LESSONS = LESSONS || [];
LESSONS.push(
{id: 'L07', stage: 2, stageTitle: 'Chặng 2 — Python gắn vào AWS', stageIntro: '<p>Chặng một dựng hạ tầng: cổng, hàm, kho, hàng đợi. Chặng hai lấp ngược lại từ phía code: bạn đã biết hệ thống chạy trên AWS, giờ cần một API Python đứng được trong hệ thống đó mà không phá bốn điều đã học, execution role, connection pool, giới hạn đồng thời và tính bền của việc nền. Năm bài này đi theo đúng thứ tự một request đi qua ứng dụng, rồi từ ứng dụng ra tới AWS.</p>', title: 'Vòng đời một request trong FastAPI: từ khoá def quyết định số phận event loop', goal: 'Sau bài này bạn phải nói được thứ tự middleware, routing, dependency, handler, response model; vì sao def và async def đặt công việc chặn vào hai chỗ khác nhau; và vì sao một lời gọi time.sleep hay requests.get bên trong async def làm đứng cả worker, dù CPU vẫn rảnh.', bridge: 'Bài trước bạn đã đẩy việc nặng sang SQS để đường trả lời không bị treo. Bài này quay lại đường trả lời và nhìn nó từ phía code. Với Django bạn đã quen một request đi qua middleware, URL resolver, view rồi mới tới response, và FastAPI cũng đi đúng thứ tự đó. Khác biệt nằm ở một từ khoá: handler viết def hay async def quyết định hàm chạy trên nhóm luồng hay trên event loop. Viết async def rồi gọi requests.get hoặc time.sleep bên trong, cả event loop đứng yên và mọi request của tiến trình đó phải chờ.', buildsOn: ['L01'], spine: 'Trên đường L01, bài này nhìn khớp compute từ phía code: một uvicorn worker chạy một event loop, request đi qua middleware, routing, dependency và handler, và từ khoá def hay async def quyết định công việc chặn nằm ở đâu.', spineNode: 'compute', incident: '<p>Kịch bản minh hoạ, không phải sự cố thật. Dịch vụ tài liệu có endpoint <code>GET /orders/{order_id}/report</code> gọi API báo cáo nội bộ bằng <code>requests.get</code>. Một người trong nhóm thấy các endpoint khác viết <code>async def</code>, nên đổi endpoint này cho đồng bộ. Chỉ một từ khoá đổi, thân hàm không đổi.</p><p>Sau deploy, p99 của chính endpoint đó tăng từ 140 ms lên vài giây. <code>/health</code> cũng trả lời chậm, dù nó không gọi ra ngoài. CPU container chỉ khoảng 4 phần trăm, log ứng dụng không có lỗi nào. Load balancer bắt đầu trả 504 vì health check không kịp hồi.</p><p>Dashboard trông như hệ thống đang rảnh, vì tiến trình không tính toán gì cả. Nó đang ngủ trên một lời gọi mạng, và mọi request khác xếp hàng sau lời gọi đó.</p>', askFirst: ['Vì sao CPU container chỉ 4 phần trăm mà p99 vẫn tăng hàng chục lần?', 'Vì sao /health cũng chậm dù nó không gọi ra ngoài?', 'Đổi đúng một từ khoá def thành async def, điều gì thật sự thay đổi trong tiến trình?'], predict: {q: 'Ba endpoint cùng làm một việc: chờ 0,2 giây rồi trả lời. Endpoint A viết def và gọi time.sleep. Endpoint B viết async def và gọi time.sleep. Endpoint C viết async def và await asyncio.sleep. Một tiến trình uvicorn, mỗi endpoint nhận 200 request đồng thời. Theo bạn endpoint nào xong trước, và endpoint B mất bao lâu?', a: '<p>Đây là tính toán theo mô hình, chưa phải số đo: A mất khoảng 1 giây, B mất khoảng 40 giây, C mất khoảng 0,2 giây cộng chi phí lập lịch. Hãy tự chạy lại bằng hey hoặc Locust để xác nhận trên máy của bạn.</p><p>A nhanh vì FastAPI đưa hàm <code>def</code> sang nhóm luồng có 40 suất. 200 request chia thành 5 lượt, mỗi lượt 40 request ngủ song song 0,2 giây, tổng khoảng 1 giây.</p><p>B chậm vì <code>time.sleep</code> là lệnh chặn. Với <code>async def</code>, luồng đang chạy chính là event loop, nên không tác vụ nào khác được lên lịch trong suốt 0,2 giây đó. 200 request xếp thành một hàng dài: 200 nhân 0,2 bằng 40 giây.</p><p>C nhanh vì <code>await asyncio.sleep</code> nhường quyền lại cho event loop, nên 200 tác vụ cùng ngủ song song.</p>'}, naive: '<p>Cách làm đầu tiên ai cũng viết: endpoint khai báo <code>async def</code> vì nghe hiện đại, rồi gọi <code>requests.get</code> hoặc một driver đồng bộ bên trong. Trên máy cá nhân với một request mỗi lần, nó chạy đúng và nhanh, nên không ai thấy vấn đề.</p><p>Lỗi nằm ở chỗ tưởng rằng <code>async</code> làm code chạy song song. Thực tế <code>async def</code> chỉ hứa rằng bên trong sẽ có điểm nhường quyền. Nếu thân hàm chặn luồng mà không nhường, lời hứa đó không được giữ, và cái giá là cả tiến trình.</p><p>Bước sửa ngây thơ tiếp theo là đổi mọi endpoint sang <code>async def</code> cho nhất quán. Đổi từ khoá mà không đổi công việc bên trong thì không cải thiện gì, và có thể làm tệ hơn.</p>', naiveCode: 'import time\n\nimport requests\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n\n@app.get("/sleep-block")\nasync def sleep_block():\n    # ❌ Cách làm sai phổ biến: time.sleep trong async def khoá cả event loop.\n    # Hàm chạy trực tiếp trên event loop, nên luồng đang đứng cũng là luồng phục vụ mọi request.\n    time.sleep(0.2)\n    return {"ok": True}\n\n\n@app.get("/orders/{order_id}/report")\nasync def order_report(order_id: str):\n    # ❌ Cách làm sai phổ biến: async def nhưng gọi requests.get, một thư viện đồng bộ.\n    # requests.get giữ luồng cho tới khi có phản hồi. Trong lúc chờ, không request nào khác được chạy.\n    # timeout=5 chỉ giới hạn từng thao tác socket, không phải tổng thời gian của lời gọi.\n    resp = requests.get(f"report.internal/orders/{order_id}", timeout=5)\n    return resp.json()', naiveOut: '<p>Với một request, cả hai endpoint chạy đúng và nhanh. Lỗi chỉ lộ ra khi có nhiều request đồng thời, cần đo bằng hey hoặc Locust.</p><p>Triệu chứng đặc trưng: các request xếp hàng nối tiếp nhau, <code>/health</code> cũng chậm dù nó không chạm gì, và thời gian của cả đợt tải xấp xỉ số request nhân với thời gian chặn.</p><p>Log ứng dụng không có exception nào. <code>top</code> hiển thị CPU thấp vì tiến trình đang ngủ chứ không tính toán. Đó là lý do đọc CPU một mình sẽ đánh lạc hướng.</p>', timeline: [['9h02', 'Endpoint GET /orders/{order_id}/report được deploy, p99 khoảng 140 ms. CPU container khoảng 3 phần trăm.'], ['9h12', 'Một commit đổi def thành async def cho đồng bộ với các endpoint khác. Thân hàm vẫn gọi requests.get.'], ['9h13', 'p99 của endpoint này tăng lên vài giây. /health cũng chậm vì cùng tiến trình.'], ['9h16', 'Số request xếp hàng tăng liên tục. CPU container vẫn dưới 5 phần trăm.'], ['9h19', 'Load balancer bắt đầu trả 504 vì health check không kịp trả lời.'], ['9h24', 'Rollback commit đổi từ khoá. Độ trễ trở về mức cũ trong vài chục giây, không cần restart.'], ['9h31', 'Đọc lại: biểu đồ CPU và biểu đồ độ trễ tách rời hoàn toàn. Đó là dấu hiệu chặn luồng, không phải thiếu tài nguyên.']], rootCause: '<p>FastAPI chạy trên ASGI, và mỗi tiến trình uvicorn có <strong>một</strong> event loop trên <strong>một</strong> luồng. Event loop lập lịch theo kiểu hợp tác: nó chỉ chuyển sang tác vụ khác khi tác vụ hiện tại gặp một <code>await</code> thật sự. Không có bộ định thời nào ngắt một hàm đang chạy.</p><p><strong>Hàm đồng bộ không nhường quyền.</strong> <code>time.sleep</code>, <code>requests.get</code> và driver psycopg2 gọi thẳng xuống hệ điều hành và giữ luồng cho tới khi xong. Bên trong <code>requests.get</code> còn có DNS, TCP và TLS, và tất cả đều chặn.</p><p><strong>Hai điều kiện gặp nhau thì thảm hoạ xảy ra.</strong> Hàm chạy trên event loop và thân hàm chặn luồng. Trong suốt thời gian chặn, event loop không nhận kết nối mới, không đọc byte nào từ socket, không chạy health check. Một request chặn 200 ms thì trần thông lượng của cả tiến trình là 5 request mỗi giây, bất kể máy còn bao nhiêu CPU.</p><p><strong>Vì sao def thì không khoá event loop.</strong> FastAPI đưa hàm <code>def</code> sang nhóm luồng của AnyIO, mặc định 40 suất. Cùng một lệnh chặn ở đó chỉ chiếm một suất, và event loop vẫn chạy các request khác.</p>', concept: '<p>Mô hình cần nhớ: event loop là một luồng duy nhất luân phiên phục vụ nhiều tác vụ. Mọi tác vụ phải tự nhường quyền bằng <code>await</code>. Công việc không nhường được, như lệnh chặn hay tính toán nặng, phải đưa ra khỏi event loop.</p><p>Có hai đường ra. Đường thứ nhất là nhóm luồng: <code>def</code> trong FastAPI, hoặc <code>asyncio.to_thread</code>. Đường thứ hai là tiến trình khác hoặc hàng đợi, dành cho tính toán nặng. Chọn def hay async def thực chất là chọn chỗ đặt lệnh chặn.</p>', mechanism: '<p>Một request đi qua năm chặng theo đúng thứ tự này. Thứ tự quan trọng vì mỗi chặng có thể làm hỏng chặng sau.</p><ul><li><strong>Middleware.</strong> Các middleware bọc lồng nhau, nên lớp đăng ký sau cùng là lớp ngoài cùng: nó thấy request trước và thấy response sau. Middleware chạy trước mọi route, kể cả <code>/health</code>.</li><li><strong>Routing.</strong> Khớp đường dẫn và phương thức trước. Route không khớp thì không tốn công giải dependency.</li><li><strong>Dependency.</strong> Được giải trước thân hàm. Mỗi dependency chạy đúng một lần cho mỗi request và được cache theo request.</li><li><strong>Handler.</strong> Đây là chỗ từ khoá quyết định. <code>def</code> được đưa sang nhóm luồng; <code>async def</code> được <code>await</code> trực tiếp trên event loop.</li><li><strong>Response model.</strong> Lọc và ép kiểu dữ liệu trả về. Trường không khai báo trong model không ra tới client, dù đối tượng có nó.</li></ul><p><strong>Cách đọc một lời gọi chặn.</strong> Hãy hỏi một câu: lệnh này có nhường quyền khi chờ không? <code>await asyncio.sleep</code> và <code>await http.get</code> của httpx có nhường. <code>time.sleep</code>, <code>requests.get</code> và psycopg2 thì không. Nếu không nhường mà đang nằm trong <code>async def</code>, bạn đang chặn event loop.</p><p><strong>Có await vẫn có thể chặn.</strong> <code>await</code> một hàm đồng bộ không nhường quyền cho ai. Hàm đó đã chặn luồng xong trước khi <code>await</code> kịp có tác dụng. Chỉ đối tượng bất đồng bộ thật mới nhường quyền.</p>', failureModes: '<p>Có bốn cách sửa hỏng, và cả bốn đều gặp trong thực tế.</p><p><strong>async def cộng tính toán nặng.</strong> Nén ảnh, băm mật khẩu, dựng báo cáo không có điểm nhường quyền tự nhiên. Đặt trong async def thì cả tiến trình đứng yên cho tới khi tính xong. Driver bất đồng bộ không cứu được việc này.</p><p><strong>Dùng nhóm luồng như hàng đợi ẩn.</strong> Chuyển hết sang def là đúng về event loop, nhưng nhóm luồng chỉ có 40 suất. Nếu mỗi request giữ một luồng 8 giây vì chờ dịch vụ ngoài, 40 luồng cạn sau vài giây tải và bạn quay lại đúng hàng đợi cũ, chỉ dời sang chỗ khác.</p><p><strong>Middleware chứa lệnh chặn.</strong> Middleware chạy trước mọi route. Một lệnh chặn trong đó làm chậm cả route không chạm dữ liệu, và làm trễ health check của load balancer.</p><p><strong>Trộn hai loại driver.</strong> Một nửa endpoint dùng driver đồng bộ, nửa còn lại dùng driver bất đồng bộ, tạo hai pool cùng mở tới một cơ sở dữ liệu. Số kết nối thật là tổng của cả hai, và nhân lên theo số worker.</p>', tradeoff: '<p>Nhóm luồng không miễn phí. Mỗi luồng tốn bộ nhớ ngăn xếp và chi phí chuyển ngữ cảnh. Phần mã Python thuần vẫn chạy qua GIL, nên nhóm luồng giúp rất nhiều với công việc chờ mạng và hầu như không giúp với công việc tính toán.</p><p>Driver bất đồng bộ là đích đến đúng nhưng đắt về công sức. Mọi lời gọi phải đi qua thư viện mới như httpx.AsyncClient hay asyncpg, mọi thư viện phụ thuộc cũng cần bản bất đồng bộ, và lazy loading của ORM không còn an toàn vì nó phát sinh truy vấn ngay giữa một await.</p><p>Và bất đồng bộ giải quyết việc chờ, không giải quyết việc tính. Một tiến trình vẫn dùng một lõi CPU cho mã Python.</p>', alternatives: '<p>Nếu hệ thống còn nhiều đoạn đồng bộ và chưa muốn viết lại, chạy nhiều worker là cách rẻ nhất: <code>uvicorn --workers 4</code> cho bốn event loop độc lập. Cái giá là số kết nối tới cơ sở dữ liệu nhân bốn, nên phải kiểm tra <code>max_connections</code> trước khi tăng.</p><p>Nếu chỉ có một hàm chặn lẻ loi trong luồng async, <code>asyncio.to_thread</code> đưa nó sang luồng riêng mà không cần đổi kiến trúc. Đây là ngoại lệ, không phải cách tổ chức toàn bộ tầng dữ liệu.</p><p>Nếu công việc là tính toán nặng, đưa nó sang tiến trình riêng hoặc qua SQS, rồi để API trả về ngay. Đây đúng là chỗ bài trước đã dùng.</p>', observe: '<ul><li><strong>Hình dạng biểu đồ.</strong> p99 tăng vọt trong khi CPU tiến trình thấp là chữ ký của chặn event loop. Nghẽn tài nguyên thì CPU và độ trễ đi cùng nhau.</li><li><strong>Cảnh báo slow callback của asyncio.</strong> Bật <code>PYTHONASYNCIODEBUG=1</code> hoặc <code>loop.set_debug(True)</code> để asyncio log cảnh báo kèm thời gian khi một tác vụ chiếm event loop quá lâu. Dòng log có tên tác vụ, từ đó lần ra hàm chặn.</li><li><strong>Dump stack.</strong> <code>py-spy dump --pid &lt;pid&gt;</code> cho thấy luồng đang đứng ở đâu ngay lúc đó, thường là trong socket hoặc <code>time.sleep</code>.</li><li><strong>Nhóm luồng.</strong> Theo dõi số suất đang dùng của AnyIO. Chạm trần 40 nghĩa là nghẽn đã chuyển sang nhóm luồng.</li></ul><p>Đọc cùng với timeout: <code>requests.get(timeout=5)</code> là timeout cho từng thao tác socket, không phải tổng thời gian. <code>asyncio.wait_for</code> cũng không cứu được khi event loop đang bị chặn, vì nó dựa vào chính event loop đó để đếm giờ.</p>', attacks: [{q: 'Sao không chuyển hết sang def cho an toàn?', a: '<p>Vì nhóm luồng có trần 40 suất. Chuyển hết sang def chỉ đổi chỗ nghẽn: khi 40 luồng cùng chờ dịch vụ ngoài, request thứ 41 xếp hàng ở cửa nhóm luồng, dù event loop vẫn rảnh. Và với công việc tính toán, GIL khiến nhóm luồng gần như không tăng được gì.</p><p>Đúng cách là đặt mỗi loại việc vào đúng chỗ: chờ mạng thì await, tính toán nặng thì tiến trình riêng.</p>'}, {q: 'Django cũng có async rồi, khác gì FastAPI?', a: '<p>Cùng một luật. Django 3.1 thêm view async def, và dưới ASGI view đồng bộ cũng chạy trong nhóm luồng. Khác biệt là mã Django điển hình còn nhiều đoạn đồng bộ trong ORM, template và thư viện, nên phải bọc bằng <code>sync_to_async</code> và <code>async_to_sync</code> ở các ranh giới. FastAPI ít nợ đồng bộ hơn, nên ranh giới dễ giữ hơn.</p>'}, {q: 'Vậy đặt timeout 5 giây cho requests.get là đủ rồi chứ?', a: '<p>Chưa đủ. Timeout của requests áp cho từng thao tác socket, nên tổng thời gian có thể vượt 5 giây. Trong lúc luồng bị chặn, event loop không làm gì được. Timeout là lưới an toàn cho một phụ thuộc bị treo, không phải cách sửa việc gọi đồng bộ bên trong async def.</p>'}, {q: 'Tăng số worker cho nhanh được không?', a: '<p>Được về thông lượng, nhưng mỗi worker có pool kết nối riêng. Bốn worker nhân pool 20 cộng overflow 10 là 120 kết nối, vượt <code>max_connections</code> mặc định 100 của PostgreSQL. Sửa chỗ chặn trước, rồi mới cân số worker với hạn mức kết nối.</p>'}], anchor: 'Một lệnh chặn trong async def khoá cả event loop, không chỉ request đang chạy.', say30: 'Từ khoá def hay async def quyết định một lệnh chặn làm chậm một request hay đứng cả tiến trình. Mỗi uvicorn worker chỉ có một event loop trên một luồng, nên nếu em viết async def rồi gọi requests.get hay time.sleep, không request nào khác được xử lý cho tới khi lệnh đó xong. Bên dưới chữ def, FastAPI đưa hàm sang nhóm luồng 40 suất, nên em chỉ dùng async def khi mọi thứ bên trong thật sự có await.', say90: 'Em nghĩ về request như năm chặng: middleware, routing, dependency, handler, rồi response model. Middleware chạy trước mọi route, kể cả health check, nên một lệnh chặn ở đó làm chậm toàn bộ. Ở handler, em chọn def khi dùng thư viện đồng bộ như requests hay psycopg2, và async def khi mọi lời gọi đều là await thật, ví dụ httpx.AsyncClient. Em cũng nhớ rằng await một hàm đồng bộ không nhường quyền cho ai. Khi thấy p99 tăng mà CPU thấp, em dùng py-spy dump để xem luồng đang đứng ở đâu. Và một điều hay bị bỏ qua: thêm worker không sửa lệnh chặn, nó chỉ nhân số pool kết nối lên.', body: '<p><strong>Tóm tắt để tra cứu.</strong> Phần trên là cách suy ra; phần này là bản rút gọn để ôn nhanh khi sắp vào phỏng vấn.</p><p><strong>Thứ tự một request.</strong> Middleware, routing, dependency, handler, response model. Middleware bọc lồng nhau nên lớp đăng ký sau cùng chạy đầu tiên. Route không khớp thì không giải dependency. Dependency được cache theo request.</p><p><strong>def so với async def.</strong> <code>def</code> được đưa sang nhóm luồng của AnyIO, mặc định 40 suất; chặn ở đó chiếm một luồng. <code>async def</code> chạy trực tiếp trên event loop; chặn ở đó khoá cả tiến trình. Trong <code>async def</code> chỉ nên <code>await</code> những thứ thật sự bất đồng bộ.</p><p><strong>Bốn câu hỏi khi đọc một đoạn code FastAPI.</strong></p><ul><li>Hàm này là def hay async def?</li><li>Bên trong có lệnh nào chặn luồng không: time.sleep, requests.get, psycopg2?</li><li>Nếu có, nó có nằm trong async def không?</li><li>Nếu bắt buộc phải có, đã đưa ra nhóm luồng hoặc sang tiến trình khác chưa?</li></ul><p><strong>Bất đồng bộ không phải song song.</strong> Một tiến trình vẫn là một event loop trên một luồng. Bất đồng bộ tăng số việc đang chờ, không tăng số việc đang tính.</p><p><strong>Chữ ký của sự cố.</strong> p99 tăng, CPU thấp, không có lỗi. Đây gần như chắc chắn là chặn event loop. Dùng py-spy dump để thấy luồng đang đứng ở đâu.</p><p><strong>Khi điều kiện đổi.</strong> Nghẽn chưa sửa được ngay thì tăng worker, nhớ nhân số kết nối với max_connections. Chỉ có một hàm chặn lẻ thì dùng asyncio.to_thread. Nhiều chờ mạng thì dùng driver bất đồng bộ. Nhiều tính toán thì đưa sang tiến trình riêng hoặc SQS.</p>', code: 'import time\nfrom collections.abc import AsyncIterator\nfrom contextlib import asynccontextmanager\nfrom typing import Annotated\n\nimport httpx\nimport requests\nfrom fastapi import Depends, FastAPI, Request\nfrom pydantic import BaseModel\n\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI) -> AsyncIterator[None]:\n    # ✅ Cách làm chuẩn: một AsyncClient cho cả tiến trình, giữ connection pool riêng.\n    # Tạo client mới cho mỗi request thì mỗi lần đều phải bắt tay TCP và TLS lại.\n    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:\n        app.state.http = client\n        yield\n\n\napp = FastAPI(lifespan=lifespan)\n\n\n@app.middleware("http")\nasync def timing(request: Request, call_next):\n    # ✅ Cách làm chuẩn: middleware chạy trước mọi route, nên bên trong chỉ có await thật.\n    started = time.perf_counter()\n    response = await call_next(request)\n    response.headers["x-process-ms"] = f"{(time.perf_counter() - started) * 1000:.1f}"\n    return response\n\n\nclass OrderReport(BaseModel):\n    # ✅ Cách làm chuẩn: response model lọc trường ra ngoài. Trường nội bộ không khai báo ở đây sẽ không lộ.\n    order_id: str\n    total: int\n\n\ndef get_http(request: Request) -> httpx.AsyncClient:\n    return request.app.state.http\n\n\nHttpDep = Annotated[httpx.AsyncClient, Depends(get_http)]\n\n\n@app.get("/health")\nasync def health() -> dict[str, bool]:\n    # ✅ Cách làm chuẩn: không gọi gì ra ngoài, nên luôn trả lời ngay dù hệ thống đang chậm.\n    return {"ok": True}\n\n\n@app.get("/orders/{order_id}/report", response_model=OrderReport)\nasync def order_report(order_id: str, http: HttpDep) -> dict:\n    # ✅ Cách làm chuẩn: await httpx.AsyncClient. Trong lúc chờ, event loop phục vụ request khác.\n    resp = await http.get(f"report.internal/orders/{order_id}")\n    resp.raise_for_status()\n    return resp.json()\n\n\n@app.get("/orders/{order_id}/legacy-report")\ndef legacy_report(order_id: str) -> dict:\n    # ✅ Cách làm chuẩn khi buộc phải dùng thư viện đồng bộ: viết def.\n    # FastAPI chạy hàm này trong nhóm luồng 40 suất, nên requests.get không khoá event loop.\n    resp = requests.get(f"legacy.internal/orders/{order_id}", timeout=5)\n    resp.raise_for_status()\n    return resp.json()', codeNote: '<p>Đoạn này gom đủ năm chặng và hai cách đặt công việc chặn. Middleware <code>timing</code> chỉ có await thật, nên không khoá event loop cho cả route không chạm dữ liệu.</p><p>Endpoint <code>/orders/{order_id}/report</code> dùng httpx.AsyncClient được tạo một lần trong lifespan, nên mỗi request chỉ là một await và không bắt tay TCP lại. Response model <code>OrderReport</code> là lớp lọc cuối cùng trước khi dữ liệu ra ngoài.</p><p>Endpoint <code>/legacy-report</code> dùng requests.get, là thư viện đồng bộ, nên viết <code>def</code> để FastAPI đưa sang nhóm luồng. Chỗ dễ sập là nhóm luồng vẫn có trần 40 suất: nếu mỗi lời gọi giữ luồng vài giây, phải có timeout và đo số suất đang dùng.</p>', flow: null, sayIt: ['Từ khoá def hay async def quyết định một lệnh chặn làm chậm một request hay làm đứng cả tiến trình.', 'FastAPI đưa hàm def sang nhóm luồng 40 suất, còn async def chạy thẳng trên event loop, nên requests.get hay time.sleep trong async def sẽ khoá mọi request khác của worker đó.', 'Request đi qua middleware, routing, dependency, handler rồi response model, và middleware chạy trước cả health check, nên lệnh chặn ở đó là chuyện nghiêm trọng nhất.', 'Await một hàm đồng bộ không nhường quyền cho ai, vì hàm đã chặn xong trước khi await có tác dụng.', 'Khi p99 tăng mà CPU thấp, em nghi chặn event loop trước, và dùng py-spy dump để tìm đúng dòng đang đứng.'], qids: ['E01', 'E02', 'E08'], refs: ['fastapi-tutorial', 'py-asyncio']},
{id: 'L08', stage: 2, stageTitle: 'Chặng 2 — Python gắn vào AWS',
title: 'Lambda và RDS: connection pool nhân theo số container, không theo pool_size',
goal: 'Sau bài này bạn phải nói được vì sao mỗi container Lambda có một pool riêng làm tổng số kết nối tới RDS bằng số container chứ không bằng pool_size, khi nào NullPool là lựa chọn đúng, và vì sao RDS Proxy là chỗ gom kết nối trước khi chạm max_connections.',
bridge: 'Bài trước bạn đã thấy Lambda là một container nhỏ, mỗi container xử lý một request tại một thời điểm, khác với Uvicorn chạy vài worker sống lâu dùng chung một event loop. Khi đưa FastAPI và SQLAlchemy từ VPS sang Lambda, bạn mang theo connection pool quen thuộc, nhưng pool đó được thiết kế cho một tiến trình sống lâu, không cho hàng trăm container được bật lên rồi tắt đi. Bài này đặt câu hỏi: khi Lambda scale ra, pool của một container nhân lên thành bao nhiêu kết nối tới RDS.',
buildsOn: ['L07'],
spine: 'Trên đường L01, bài này nối Lambda với RDS PostgreSQL qua SQLAlchemy, và chỉ ra rằng số kết nối thật tới cơ sở dữ liệu bằng số container nhân số kết nối mỗi container giữ, còn RDS Proxy là nơi gom các kết nối đó trước khi chạm trần max_connections.',
spineNode: 'data',
incident: '<p>Một API FastAPI chạy trên Lambda, kết nối tới RDS PostgreSQL bằng SQLAlchemy. Engine được tạo ở cấp module với <code>pool_size=5</code> và <code>max_overflow=5</code>. Parameter group của RDS đặt <code>max_connections</code> bằng 100. Lúc 20h00 một chiến dịch gửi email đẩy khoảng 150 request đồng thời vào <code>GET /products</code>, và Lambda bật khoảng 150 container để phục vụ.</p><p>Log ứng dụng bắt đầu có dòng <code>FATAL: sorry, too many clients already</code>. Các container mới không mở được kết nối tới RDS và trả 500, tỉ lệ lỗi tăng theo số container được bật thêm. CPU của RDS chỉ khoảng 15 phần trăm, và Performance Insights không có truy vấn chậm nào.</p><p>Đội trực tăng <code>pool_size</code> lên 10 và <code>max_overflow</code> lên 10, rồi deploy lại. Lỗi vẫn y nguyên, vì không container nào thật sự cần tới 10 kết nối cùng lúc.</p>',
askFirst: ['Mỗi container chỉ xử lý một request một lúc, vậy vì sao pool_size không quyết định số kết nối tới RDS?', 'Nếu CPU RDS thấp và không có truy vấn chậm, tài nguyên nào thật sự đã cạn?', 'NullPool có giải quyết được burst 150 request cùng lúc không, hay nó chỉ bỏ phần kết nối nhàn rỗi?'],
predict: {q: 'Lambda có 150 container đã warm. Mỗi container chỉ chạy một request một lúc, pool_size=5, max_overflow=5, và RDS đặt max_connections=100. Mỗi container giữ tối đa bao nhiêu kết nối, và tổng số kết nối có vượt 100 không?', a: '<p>Trong một container, request chỉ mượn một kết nối tại một thời điểm. Nhưng QueuePool không đóng kết nối khi trả về; nó giữ lại trong pool để dùng cho lần gọi sau. Sau request đầu tiên, mỗi container giữ đúng một kết nối nhàn rỗi.</p><p>Vì vậy 150 container warm giữ khoảng 150 kết nối, vượt trần 100 dù không container nào chạm <code>pool_size</code>. Số container là biến quyết định. <code>pool_size</code> chỉ là trần của một container, và container này gần như không bao giờ chạm trần đó.</p>'},
naive: '<p>Cách làm đầu tiên khi chuyển từ VPS sang Lambda là giữ nguyên cấu hình engine như trên VPS: tạo engine ở cấp module, đặt pool_size và max_overflow, rồi tin rằng pool sẽ chặn số kết nối tới RDS. Trên VPS điều này đúng, vì một tiến trình Uvicorn sống lâu với vài worker có tổng số kết nối bị giới hạn bởi số worker nhân pool.</p><p>Trên Lambda không có tiến trình nào để giới hạn. Mỗi container là một tiến trình riêng, có engine riêng và pool riêng. Lambda scale theo số request đồng thời, nên số container, và do đó số kết nối, không có trần cố định trong code.</p>',
naiveCode: 'import os\nfrom fastapi import FastAPI\nfrom mangum import Mangum\nfrom sqlalchemy import create_engine, text\n\napp = FastAPI()\n\n# ❌ Cách làm sai phổ biến: copy cấu hình pool từ VPS sang Lambda.\n# Mỗi container có engine và pool riêng, nên pool_size nhân theo số container.\nengine = create_engine(\n    os.environ["DATABASE_URL"],\n    pool_size=5,\n    max_overflow=5,\n)\n\n\n@app.get("/products")\ndef list_products():\n    # Mượn kết nối từ pool của container này rồi trả lại pool, không đóng.\n    with engine.connect() as conn:\n        rows = conn.execute(text("SELECT id, name FROM products LIMIT 50")).mappings().all()\n    return {"items": [dict(r) for r in rows]}\n\n\nhandler = Mangum(app)',
naiveOut: '<p>Chạy ổn khi chỉ có vài container. Khi burst kéo số container sống lên khoảng 150, các container sau không mở được kết nối tới RDS, và log trả về <code>FATAL: sorry, too many clients already</code>. Trong code không có dòng lỗi SQL nào, vì lỗi xảy ra lúc mở kết nối chứ không phải lúc chạy câu lệnh.</p>',
timeline: [['20h00:00', 'Chiến dịch email bắt đầu, lưu lượng vào /products tăng vọt.'], ['20h00:40', 'Lambda bật container mới. Mỗi container mở một kết nối ở request đầu tiên và giữ lại trong pool.'], ['20h01:10', 'Số container warm vượt 100. Container mới không mở được kết nối, log báo too many clients already.'], ['20h01:15', 'Tỉ lệ 500 tăng theo số container lạnh mới. CPU RDS vẫn thấp.'], ['20h05:00', 'Đội trực tăng pool_size lên 10 và deploy. Lỗi không đổi, vì số container không đổi.'], ['20h12:00', 'Đội trực đặt reserved concurrency 40 cho hàm. Lỗi 500 về gần 0; request vượt trần nhận 429 từ API Gateway. Đây là hành vi đúng, vì RDS được bảo vệ.']],
rootCause: '<p>Lỗi nằm ở đơn vị tính. Trên VPS, bạn đếm kết nối theo tiến trình, và số tiến trình ổn định. Trên Lambda, đơn vị nhân bản là container, và mỗi container chứa cả engine lẫn pool.</p><p><strong>Pool chỉ biết chính nó.</strong> QueuePool của SQLAlchemy giới hạn số kết nối trong một tiến trình. Nó không biết có bao nhiêu container khác đang chạy cùng lúc, nên không có cách nào giữ tổng số kết nối dưới max_connections.</p><p><strong>Mỗi container vẫn giữ kết nối nhàn rỗi.</strong> Sau mỗi lần gọi, kết nối được trả về pool và nằm đó chờ. Container warm sống thêm một thời gian, nên kết nối đó tồn tại thêm một thời gian. Nhân với số container, con số này trở thành tổng số kết nối của cả hệ thống.</p>',
concept: '<p>Điểm cần đổi là đơn vị tính. Khi chạy trên Lambda, đơn vị nhân bản là <strong>container</strong>, và mỗi container là một bản sao của toàn bộ ứng dụng, gồm cả engine và pool.</p><p>Connection pool là một semaphore nằm trong tiến trình. Nó giới hạn số kết nối trong một tiến trình, không giới hạn tổng số kết nối của toàn hệ thống. Khi số tiến trình thay đổi theo lưu lượng, tổng số kết nối cũng thay đổi, và pool không thể tự điều chỉnh theo.</p><p>Vì vậy, muốn kiểm soát tổng số kết nối trên Lambda, phải kiểm soát ở hai tầng khác: số container chạy đồng thời, và số kết nối thật được mở tới PostgreSQL.</p>',
mechanism: '<p>Vòng đời của một container và một pool.</p><ul><li>Lambda khởi tạo container ở pha INIT. Mọi dòng ở cấp module, gồm cả <code>create_engine</code>, chạy đúng một lần ở đây. Engine lúc này chưa mở kết nối nào.</li><li>Request đầu tiên mượn một kết nối, thực hiện TCP, TLS và xác thực với PostgreSQL. Khi request xong, kết nối được trả về pool chứ không đóng.</li><li>Container warm được tái sử dụng cho các request sau, nên kết nối vẫn còn. Lambda thu hồi container sau một thời gian không dùng, và khi đó kết nối mới đóng theo.</li><li>Khi có nhiều request đồng thời, Lambda bật thêm container thay vì để một container xử lý song song. Mỗi container có kết nối riêng của nó.</li></ul><p>Tổng kết nối tới RDS xấp xỉ bằng số container warm nhân với số kết nối mỗi container đang giữ. Với một request một lúc, con số mỗi container thường là 1.</p><p>Hai lựa chọn để thay đổi phương trình này.</p><ul><li><strong>NullPool</strong> không giữ kết nối nào sau khi trả về. Mỗi lần mượn mở một kết nối mới và đóng ngay khi trả. Container không còn giữ kết nối nhàn rỗi, nên số kết nối tới DB bằng số request đang chạy.</li><li><strong>RDS Proxy</strong> nằm giữa Lambda và RDS. Proxy giữ một pool kết nối phía backend tới RDS, và cho phép Lambda mở nhiều kết nối phía client tới proxy. Proxy ghép các kết nối client vào ít kết nối backend hơn.</li></ul><p>Hai thứ kết hợp với nhau. NullPool giữ phía client gọn, còn RDS Proxy giữ phía backend ổn định. Mở kết nối tới proxy thường rẻ hơn mở tới RDS, vì proxy đã giữ sẵn kết nối backend.</p>',
failureModes: '<p>Có bốn cách hỏng quen thuộc.</p><ul><li><strong>Chỉ tăng pool_size.</strong> Với Lambda, pool_size gần như không ảnh hưởng tổng số kết nối. Tăng nó chỉ làm cấu hình trông an toàn hơn trong khi lỗi vẫn xảy ra.</li><li><strong>NullPool không chặn được burst.</strong> 150 request cùng lúc vẫn cần 150 kết nối cùng lúc. NullPool chỉ bỏ phần kết nối nhàn rỗi. Muốn chặn peak phải giới hạn số container bằng reserved concurrency, hoặc gom kết nối bằng RDS Proxy.</li><li><strong>Proxy bị ghim phiên.</strong> Các câu lệnh giữ trạng thái phiên như SET, bảng tạm hoặc advisory lock mức phiên khiến proxy không ghép được kết nối đó nữa. Lợi ích gom kết nối giảm dần khi ứng dụng dùng nhiều tính năng này.</li><li><strong>Trỏ nhầm endpoint.</strong> Nếu DATABASE_URL vẫn trỏ thẳng tới RDS, Lambda bỏ qua proxy và mọi cấu hình gom kết nối trở nên vô nghĩa.</li></ul>',
tradeoff: '<p>NullPool đổi phần kết nối nhàn rỗi lấy chi phí mở kết nối ở mọi lần gọi. Nếu không có proxy, mỗi lần gọi phải trả một lần TCP, TLS và xác thực tới RDS, và phần này có thể chiếm đáng kể thời gian của một endpoint nhẹ.</p><p>RDS Proxy đổi một hop mạng và chi phí dịch vụ lấy việc số kết nối backend ổn định. Lambda phải nằm trong cùng VPC với proxy, và security group phải cho phép đúng luồng. Đây là cái giá đáng trả khi số container có thể vượt trần của RDS.</p><p>Reserved concurrency đổi thông lượng lấy sự an toàn. Request vượt trần bị từ chối với lỗi throttle thay vì xếp hàng, nên client phải được thiết kế để xử lý 429 hoặc retry có backoff.</p>',
alternatives: '<p>Có bốn lựa chọn, và chúng không loại trừ nhau.</p><ul><li><strong>Reserved concurrency</strong> đặt trần số container chạy cùng lúc, ví dụ 40, với dự phòng cho job nền và công cụ vận hành. Đây là cách đơn giản nhất để giữ tổng kết nối dưới max_connections.</li><li><strong>Pool nhỏ, không proxy</strong> dùng pool_size=1, max_overflow=0 và reserved concurrency bằng số kết nối cho phép. Phù hợp khi lưu lượng thấp và đều.</li><li><strong>Tăng max_connections</strong> bằng cách nâng instance class. Cách này đắt và chỉ dời trần, không xoá trần.</li><li><strong>Container sống lâu</strong> như ECS thay cho Lambda. Khi số tiến trình ổn định, pool phát huy đúng vai trò của nó, như bài về lựa chọn compute đã chỉ ra.</li></ul>',
observe: '<p>Bốn chỉ số, đọc cùng nhau.</p><ul><li><strong>DatabaseConnections của RDS</strong> so với max_connections. Chạm 90 phần trăm là dấu hiệu sớm nhất.</li><li><strong>ConcurrentExecutions và số container</strong> của Lambda. Đường này phải đi cùng đường DatabaseConnections; nếu DatabaseConnections tăng theo ConcurrentExecutions, nguyên nhân đã rõ.</li><li><strong>pg_stat_activity</strong> nhóm theo application_name và state. Nhiều phiên idle từ cùng một nguồn cho thấy pool đang giữ kết nối nhàn rỗi trên nhiều container.</li><li><strong>Throttles của Lambda.</strong> Tăng lên nghĩa là reserved concurrency đang làm đúng việc chặn.</li></ul><p>DatabaseConnections chạm trần trong khi ConcurrentExecutions tăng là dấu hiệu rõ nhất của lỗi này.</p>',
attacks: [{q: 'Sao không tăng max_connections trên RDS cho xong?', a: '<p>Tăng được, nhưng nó chỉ dời trần. Mỗi kết nối PostgreSQL tốn bộ nhớ, nên max_connections lớn hơn thường kéo theo instance lớn hơn. Burst tiếp theo vượt trần mới thì lỗi lặp lại. Cách bền là chặn số container đồng thời và gom kết nối bằng proxy.</p>'}, {q: 'NullPool có phải là cách làm chuẩn cho Lambda không?', a: '<p>Không đứng một mình. NullPool bỏ phần kết nối nhàn rỗi nên hợp với Lambda, vì container không giữ kết nối khi không làm gì. Nhưng nó không chặn được peak, và nếu không có proxy thì mỗi lần gọi phải trả một lần handshake. Khi đã có RDS Proxy, NullPool kết hợp rất tốt vì handshake tới proxy rẻ hơn tới RDS.</p>'}, {q: 'Khi nào thì cần RDS Proxy?', a: '<p>Khi số container có thể vượt trần của RDS trong burst, hoặc khi thời gian mở kết nối làm chậm endpoint. Proxy cũng hữu ích khi nhiều dịch vụ cùng nối vào một RDS. Nếu lưu lượng thấp, đều và reserved concurrency đã nhỏ, có thể chưa cần proxy.</p>'}, {q: 'Pool của SQLAlchemy có tự biết Lambda đang scale không?', a: '<p>Không. Pool chỉ biết tiến trình của chính nó. Nó không nhìn thấy các container khác đang chạy cùng lúc, nên giới hạn tổng số kết nối phải nằm ở tầng hạ tầng: reserved concurrency hoặc proxy.</p>'}],
anchor: 'Với Lambda, pool không quyết định tổng số kết nối, số container mới quyết định.',
say30: 'Với Lambda, pool_size không quyết định tổng số kết nối tới RDS, số container mới quyết định. Mỗi container có engine và pool riêng, và chỉ xử lý một request một lúc, nên sau mỗi lần gọi nó vẫn giữ một kết nối nhàn rỗi. Bật 150 container tức là có 150 kết nối, vượt max_connections bằng 100 dù pool_size chỉ bằng 5. Vì vậy tôi chặn số container đồng thời bằng reserved concurrency, đặt RDS Proxy trước RDS, và dùng NullPool để container không giữ kết nối khi nhàn rỗi.',
say90: 'Trên VPS, connection pool hoạt động tốt vì tiến trình sống lâu và số worker cố định, nên tổng kết nối bị chặn bởi số worker nhân pool. Lambda đổi điều đó, vì mỗi container là một tiến trình riêng có engine và pool riêng. Container warm giữ lại kết nối sau mỗi lần gọi, nên tổng kết nối xấp xỉ số container warm nhân số kết nối mỗi container đang giữ. Khi burst đưa số container vượt trần max_connections, lỗi too many clients xuất hiện ở tầng PostgreSQL, và tăng pool_size không chữa được vì mỗi container gần như chỉ dùng một kết nối. Cách tôi làm là ba lớp: reserved concurrency để chặn số container chạy cùng lúc dưới trần, NullPool trong code để container không giữ kết nối nhàn rỗi, và RDS Proxy để gom kết nối phía backend. Đổi lại, tôi chấp nhận request vượt trần nhận 429 và client phải retry có backoff, và proxy chỉ phát huy khi các câu lệnh không ghim phiên.',
body: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Container</strong>: môi trường chạy của Lambda cho một bản sao hàm, có thể được tái sử dụng cho nhiều lần gọi liên tiếp.</li><li><strong>Connection Pool</strong>: tập kết nối được giữ trong tiến trình để tái sử dụng, do QueuePool của SQLAlchemy quản lý.</li><li><strong>NullPool</strong>: pool không giữ kết nối nào; mở khi mượn, đóng khi trả.</li><li><strong>max_connections</strong>: trần số phiên đồng thời của PostgreSQL, đặt trong parameter group của RDS.</li><li><strong>RDS Proxy</strong>: dịch vụ đặt giữa ứng dụng và RDS, gom nhiều kết nối phía client vào ít kết nối phía backend.</li><li><strong>Reserved concurrency</strong>: trần số container của một hàm Lambda được phép chạy cùng lúc.</li><li><strong>Burst</strong>: đợt tăng lưu lượng đột ngột trong thời gian ngắn.</li></ul><p><strong>Ánh xạ từ VPS.</strong> Khi chạy FastAPI trên VPS, luồng là Nginx, Uvicorn với vài worker, rồi PostgreSQL. Số kết nối tối đa bằng số worker nhân pool, và bạn kiểm soát nó bằng hai con số cố định. Trên Lambda, luồng là API Gateway, mỗi container là một bản sao của Uvicorn và engine, rồi PostgreSQL. Số container không cố định và do Lambda quyết định theo lưu lượng.</p><p><strong>Vì sao pool không đủ.</strong> QueuePool là một semaphore trong tiến trình. Nó chặn số kết nối của chính container đó, còn tổng số kết nối của toàn hệ thống là tổng của mọi container. Khi không có tầng nào giới hạn số container, không có con số nào trong code đảm bảo tổng kết nối dưới max_connections.</p><p><strong>Ba lớp kiểm soát.</strong> Lớp thứ nhất là số container đồng thời, do reserved concurrency quyết định. Lớp thứ hai là số kết nối mỗi container giữ, do NullPool hoặc pool nhỏ quyết định. Lớp thứ ba là số kết nối backend thật tới PostgreSQL, do RDS Proxy quyết định. Cần cả ba khi lưu lượng có burst lớn.</p><p><strong>Khi nào dùng NullPool.</strong> Khi container có thể nhàn rỗi lâu, hoặc khi bạn không muốn tổng kết nối tăng theo thời gian sống của container. Trên Lambda, NullPool là lựa chọn an toàn mặc định, với điều kiện chấp nhận chi phí mở kết nối ở mỗi lần gọi nếu không có proxy.</p><p><strong>Khi nào đặt RDS Proxy.</strong> Khi burst có thể đưa số container vượt trần RDS, khi nhiều dịch vụ cùng nối vào một cơ sở dữ liệu, hoặc khi thời gian mở kết nối làm chậm endpoint. Proxy yêu cầu Lambda nằm trong VPC và cần kiểm tra các câu lệnh có ghim phiên hay không.</p><p><strong>Những chỗ dễ sập.</strong> Tăng pool_size và coi như đã xử lý burst. Tin rằng NullPool là đủ mà không giới hạn concurrency. Đặt DATABASE_URL trỏ thẳng tới RDS khi đã có proxy. Quên rằng max_connections phải chia cho tất cả client, gồm cả job nền và công cụ vận hành.</p>',
code: 'import os\nfrom fastapi import FastAPI\nfrom mangum import Mangum\nfrom sqlalchemy import create_engine, text\nfrom sqlalchemy.pool import NullPool\n\napp = FastAPI()\n\n# ✅ Cách làm chuẩn: DATABASE_URL trỏ tới endpoint của RDS Proxy, không trỏ thẳng tới RDS.\nDATABASE_URL = os.environ["DATABASE_URL"]\n\n# ✅ Cách làm chuẩn: NullPool để container không giữ kết nối khi nhàn rỗi.\n# Mỗi lần mượn mở một kết nối tới proxy và đóng ngay khi trả về, nên số kết nối\n# phía client bằng số request đang chạy chứ không bằng số container đã bật.\nengine = create_engine(\n    DATABASE_URL,\n    poolclass=NullPool,\n    connect_args={"sslmode": "require", "connect_timeout": 3},\n)\n\n\n@app.get("/products")\ndef list_products():\n    # Hàm def được FastAPI chạy trong threadpool. psycopg2 là driver đồng bộ,\n    # nên gọi nó ở đây là đúng; không gọi trong async def.\n    with engine.connect() as conn:\n        rows = conn.execute(text("SELECT id, name FROM products LIMIT 50")).mappings().all()\n    return {"items": [dict(r) for r in rows]}\n\n\n# ✅ Cách làm chuẩn: giới hạn đồng thời ở tầng Lambda. Hạ tầng đặt reserved concurrency = 40,\n# nên tối đa 40 container chạy cùng lúc, cộng với dự phòng cho job nền vẫn dưới max_connections.\nhandler = Mangum(app)',
codeNote: 'Đoạn này gom ba quyết định. Engine dùng NullPool để container không giữ kết nối nhàn rỗi, và DATABASE_URL trỏ tới RDS Proxy để gom kết nối phía backend. Trần số container đồng thời không nằm trong code mà nằm ở reserved concurrency, vì chỉ hạ tầng mới nhìn thấy tổng số container. Chỗ dễ sập là DATABASE_URL: nếu trỏ nhầm tới RDS, proxy bị bỏ qua và toàn bộ cấu hình trên trở nên vô nghĩa.',
flow: null,
sayIt: ['Với Lambda, pool_size không quyết định tổng số kết nối tới RDS, vì mỗi container có engine và pool riêng và sau mỗi lần gọi vẫn giữ một kết nối nhàn rỗi.', 'Số container đồng thời mới là biến quyết định, nên 150 container warm tương đương 150 kết nối, và nếu RDS đặt max_connections bằng 100 thì lỗi too many clients là điều chắc chắn.', 'Tôi chặn số container chạy cùng lúc bằng reserved concurrency, vì chỉ hạ tầng mới nhìn thấy tổng số container, còn pool trong code chỉ biết chính nó.', 'Trong code tôi dùng NullPool để container không giữ kết nối khi nhàn rỗi, và đặt DATABASE_URL trỏ tới RDS Proxy để gom kết nối phía backend.', 'Đổi lại, request vượt trần nhận 429 và client phải retry có backoff, còn RDS Proxy chỉ phát huy khi các câu lệnh không ghim phiên.'],
qids: ['E03', 'E05', 'E06'],
refs: ['fastapi-dependencies', 'py-asyncio', 'fastapi-testing']},
{id: 'L09', stage: 2, stageTitle: 'Chặng 2 — Python gắn vào AWS',
title: 'Validation tại biên với Pydantic: tách lỗi 4xx do dữ liệu sai khỏi lỗi 5xx để không retry vô ích',
goal: 'Sau bài này bạn phải nói được vì sao một lỗi 422 do người dùng gửi sai không bao giờ được retry, vì sao chỉ lỗi 5xx và timeout tạm thời mới đáng thử lại có backoff và jitter, vì sao 401 hoặc 403 từ đối tác là lỗi cấu hình của chính bạn chứ không phải lỗi của người dùng, và vì sao retry mù quáng trên mọi lỗi nhân tải lên một dịch vụ đang yếu.',
bridge: 'Bài trước bạn đã khai báo timeout và retry tường minh cho lời gọi ra ngoài, và thấy retry là con dao hai lưỡi: nó cứu được lỗi thoáng qua nhưng nhân tải lên đúng lúc đối tác yếu nhất. Bài này trả lời câu hỏi còn thiếu: retry trên lỗi nào mới có ích. Câu trả lời bắt đầu ở biên hệ thống, nơi dữ liệu từ người dùng đi vào. Pydantic kiểm tra hình dạng dữ liệu ở đó, còn mã trạng thái HTTP phải nói thật lỗi thuộc về ai. Nếu mọi lỗi đều trả 500, hệ thống không phân biệt được việc sửa dữ liệu với việc chờ đợi.',
buildsOn: ['L02', 'L08'],
spine: 'Trên đường L01, bài này đặt khớp validation ở đầu compute: Pydantic chặn dữ liệu sai trước khi nó chạm đối tác hay cơ sở dữ liệu, còn mã 4xx và 5xx quyết định client có được phép thử lại hay không.',
spineNode: 'compute',
incident: '<p>Một đối tác đối soát gọi POST /invoices hàng loạt vào cuối tháng. Sáng thứ Hai, nhật ký ghi nhận 38.000 lần trả 500 trong bốn mươi phút. Đội trực làm đúng như sách dạy: bật retry ở client, thêm hai lần thử cho mỗi request.</p><p>Số 500 không giảm, còn số request tới /invoices tăng gấp ba. Phần lớn 500 hoá ra không phải lỗi hệ thống. Trường amount_cents bị gửi dưới dạng chuỗi có dấu chấm, và handler cũ bắt mọi Exception rồi trả 500. Mỗi request sai bị retry ba lần, và mỗi lần đều nhận đúng lỗi cũ.</p><p>Đến 10h40, hàng đợi SQS export-jobs đã vượt 200.000 message vì worker cũng retry các message có payload sai. Sự cố không đến từ đối tác. Nó đến từ việc không ai phân biệt được ai đã làm sai.</p>',
askFirst: [
'Một request có amount_cents sai kiểu thì handler của bạn trả mã nào? Mã đó nói với client và với cơ chế retry điều gì?',
'Vì sao retry trên lỗi 422 không bao giờ làm request thành công, còn retry trên 503 đôi khi thì có?',
'Nếu 500 request cùng thử lại ba lần, số lời gọi thật vào dịch vụ yếu là bao nhiêu, và điều đó xảy ra lúc nào?',
],
predict: {
q: 'Client gửi amount_cents là "1.250.000" thay vì số nguyên, và bạn đặt retry tối đa ba lần cho mọi lỗi. Có bao nhiêu lần request này đi tới server, và client nhận kết quả cuối cùng là gì?',
a: '<p><strong>Bốn lần đi tới server, và kết quả cuối cùng là 422.</strong> Lần gọi đầu và ba lần retry đều bị cùng một lỗi kiểu dữ liệu từ chối, vì không có gì trong request đổi giữa các lần. Pydantic chặn ngay khi giải mã body, trước khi handler chạy, nên không tốn thời gian xử lý nghiệp vụ. Nhưng lỗi vẫn đi qua toàn bộ vòng retry và đổ thêm tải lên endpoint đang yếu.</p><p>Con số này có ý nghĩa vận hành. Nhân bốn với số client đang gửi dữ liệu sai, rồi nhân thêm với thời gian chờ của mỗi lần gọi, bạn sẽ thấy lượng tải thừa. Retry trên lỗi do người gọi gây ra không sửa được gì; nó chỉ lặp lại lỗi.</p>',
},
naive: '<p>Cách làm quen thuộc từ Django REST Framework là bọc mọi thứ trong try except Exception, trả 500 kèm thông báo chung, rồi bật retry ở client cho chắc. Bạn nghĩ mình an toàn vì không request nào bị bỏ rơi. Thực tế có hai lỗi nằm sẵn: lỗi do người dùng bị đóng gói thành lỗi hệ thống, và lỗi hệ thống thật bị retry như thể đó là lỗi của người dùng.</p><p>Trong FastAPI, người viết hay bỏ Pydantic model và nhận body dưới dạng dict, rồi tự kiểm tra bằng if. Cách này làm mất hình dạng lỗi mà client cần để quyết định có nên thử lại hay không.</p>',
naiveCode: `# ❌ Cách làm sai phổ biến: mọi lỗi đều thành 500, và mọi lỗi đều bị retry.
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import httpx

app = FastAPI()


@app.exception_handler(Exception)
async def catch_all(request, exc):
    # ❌ Bắt cả lỗi dữ liệu lẫn lỗi hệ thống thật rồi trả 500.
    # Client đọc 500 và retry, nên request sai bị retry vô ích.
    return JSONResponse(status_code=500, content={"error": "internal"})


@app.post("/invoices")
async def create_invoice(body: dict):
    # ❌ Không có schema: amount_cents là chuỗi "1.250.000" đi thẳng xuống đối tác.
    async with httpx.AsyncClient() as client:
        # ❌ Không timeout tường minh, không phân loại lỗi trước khi retry.
        for _ in range(4):
            resp = await client.post("partner.example/charges", json=body)
            # ❌ Coi mọi mã dưới 500 là thành công, kể cả 422 của đối tác.
            if resp.status_code < 500:
                return resp.json()
    return JSONResponse(status_code=500, content={"error": "internal"})`,
naiveOut: '<p>Chạy thử 1.000 request, trong đó 5 phần trăm có amount_cents sai kiểu. Nhật ký chỉ có dòng 500 internal và không có stack trace nào, vì handler đã nuốt lỗi. Đối tác trả 422 cho các request sai, nhưng vòng lặp coi đó là thành công và trả thân lỗi với mã 200, nên client không biết request đã thất bại.</p><p>Khi đối tác chậm, httpx ném ReadTimeout ra ngoài vòng lặp, catch_all trả 500, và client retry trên mọi 500 kể cả khi request chưa từng được xử lý. Với POST không có khoá idempotency, lần retry đó có thể tạo thêm một bản ghi đối soát. Dashboard không có cảnh báo nào, vì hệ thống vẫn chạy và tỷ lệ 500 bị đọc như sự cố hạ tầng.</p>',
timeline: [
['09h00', 'Đối tác đối soát bắt đầu gửi hàng loạt; khoảng 5 phần trăm request có amount_cents là chuỗi có dấu chấm.'],
['09h10', 'catch_all trả 500 cho mọi exception; nhật ký không có stack trace, dashboard chỉ thấy tỷ lệ 500 tăng.'],
['09h25', 'Đội bật retry ba lần ở client cho mọi 500, vì giả định 500 luôn là lỗi tạm thời.'],
['09h40', 'Số request tới endpoint tăng gấp ba; đối tác bắt đầu chậm vì nhận cùng một payload sai nhiều lần.'],
['10h05', 'Phát hiện: lỗi 422 bị gói thành 500 nên client retry những request mà server không bao giờ xử lý được.'],
['10h40', 'Hàng đợi SQS export-jobs vượt 200.000 message vì worker retry các message có payload sai.'],
['11h20', 'Bản sửa: Pydantic chặn sớm, handler phân loại 4xx không retry, 5xx tạm thời có backoff và jitter.'],
],
rootCause: '<p>Nguyên nhân không nằm ở việc thiếu retry hay thiếu validation. Nó nằm ở chỗ mọi lỗi bị quy về một mã duy nhất, nên client và cơ chế retry không còn đọc được ai đã làm sai.</p><ul><li><strong>Dữ liệu không có schema ở biên.</strong> Body nhận dạng dict nên amount_cents là chuỗi đi thẳng xuống đối tác. Pydantic không có cơ hội chặn khi không có model.</li><li><strong>catch_all bắt Exception.</strong> Lỗi 422 do người dùng gửi sai và lỗi 503 do đối tác đều thành 500, nên không ai phân loại được chúng.</li><li><strong>Retry theo mã số thay vì theo nguyên nhân.</strong> Client retry mọi 500, kể cả lỗi chắc chắn lặp lại, và nhân tải lên một dịch vụ vốn đã yếu.</li><li><strong>Thân lỗi bị coi là thành công.</strong> Vòng lặp trả nguyên phản hồi 4xx với mã 200, nên lỗi không bao giờ đến được chỗ cần xử lý.</li></ul>',
concept: '<p><strong>Biên hệ thống</strong> là chỗ dữ liệu từ bên ngoài đi vào và phải được kiểm tra trước khi chạm vào nghiệp vụ. Trong FastAPI, biên là body, query và path được Pydantic model hoá. Mọi thứ phía sau biên được coi là dữ liệu đã đúng hình dạng.</p><p>Mã HTTP là hợp đồng nói cho người gọi biết <strong>lỗi thuộc về ai</strong>. Lỗi 4xx nghĩa là request của người gọi sai, và chỉ sửa request mới có kết quả. Lỗi 5xx nghĩa là phía server không xử lý được, và thử lại có thể thành công khi điều kiện đổi. Phân biệt hai loại này là điều kiện để retry có nghĩa.</p><p>So với Django REST Framework, serializer.is_valid và ValidationError đã làm phần kiểm tra này, và DRF trả 400 cho lỗi serializer. FastAPI làm tương tự bằng Pydantic, nhưng mặc định trả 422, còn việc chọn mã nào cho loại lỗi nào là việc của bạn.</p>',
mechanism: '<p>Mỗi request đi qua bốn bước, và mỗi bước đưa ra một quyết định khác nhau về việc lỗi thuộc về ai.</p><ul><li><strong>Biên vào.</strong> Pydantic kiểm tra body trước khi handler chạy. Dữ liệu sai bị FastAPI trả 422 ngay, nên không có lần gọi đối tác nào được thực hiện.</li><li><strong>Gọi đối tác.</strong> send_charge gửi request với Idempotency-Key cố định và timeout tường minh. Nếu gặp lỗi kết nối hoặc mã 429, 5xx, nó chờ theo backoff có jitter rồi thử lại, tối đa ba lần.</li><li><strong>Phân loại phản hồi.</strong> 401 và 403 được tách thành cấu hình sai và không retry. Các mã 4xx còn lại được xem là đối tác từ chối payload và cũng không retry.</li><li><strong>Biên ra.</strong> Phản hồi 200 vẫn đi qua PartnerReceipt.model_validate. Nếu hình dạng sai, request được coi là lỗi của đối tác và trả 502 kèm log, không để lọt vào nghiệp vụ.</li></ul>',
failureModes: '<p>Khi phân loại sai, có bốn kiểu hỏng quen thuộc.</p><ul><li><strong>Retry trên 422.</strong> Request sai được gửi lại đúng như cũ, nên không bao giờ thành công và chỉ nhân tải lên endpoint đang yếu.</li><li><strong>Không retry trên 503 tạm thời.</strong> Làm quá cứng khiến những request đáng cứu bị trả lỗi khi đối tác chỉ chớp nháy trong vài giây.</li><li><strong>Retry không có jitter.</strong> Mọi client cùng backoff 1, 2, 4 giây sẽ đồng loạt đập lại cùng lúc, tạo ra một đợt sóng mới đúng khi đối tác đang hồi phục.</li><li><strong>Retry POST không có Idempotency-Key.</strong> Lần đầu đối tác đã tạo charge nhưng phản hồi bị mất, lần retry tạo thêm một charge. Chỉ retry POST khi khoá idempotency do phía bạn sinh được giữ nguyên qua mọi lần thử.</li></ul><p>Và một lỗi đáng kể nữa: bắt Exception ở cấp toàn cục rồi trả 500. Nó che mất mọi phân loại phía trên, vì không còn gì để phân loại.</p>',
tradeoff: '<p>Model Pydantic chặt làm tăng số lần trả 422, và đôi khi client cũ gửi trường hơi khác sẽ bị từ chối. Đổi lại, lỗi được phát hiện sớm và có cấu trúc, thay vì lan vào đối tác rồi quay về dưới dạng lỗi không rõ nguồn. Cách hợp lý là version schema ở biên và cho một khoảng chuyển tiếp ngắn có log cảnh báo.</p><p>Phân loại lỗi tường minh cũng có chi phí. Mỗi mã đối tác trả về cần một quyết định retry được viết ra và được kiểm thử. Đây là công việc bảo trì thật, đổi lại hệ thống không tự nhân lỗi lên.</p><p>Retry với backoff làm request chậm hơn trong sự cố. Vì vậy phải đặt tổng ngân sách thời gian, không chỉ số lần thử, để client không chờ lâu hơn SLA của chính nó.</p>',
alternatives: '<p><strong>Retry ở tầng hạ tầng.</strong> Khi Lambda đọc từ SQS, để hàng đợi tự retry bằng visibility timeout và redrive policy trỏ tới DLQ. Ứng dụng chỉ cần trả lỗi có phân loại, còn số lần thử và nơi lưu message cuối cùng do hạ tầng quản lý. Cái giá là retry vẫn chỉ đáng tin khi handler phân biệt được lỗi nào có thể thử lại.</p><p><strong>Tách phần gọi đối tác sang worker.</strong> API trả 202 ngay sau khi ghi job, worker thử lại theo nhịp riêng và đẩy message thất bại sang DLQ. Người gọi không còn chờ đối tác, và lỗi 4xx của payload được đưa về trạng thái rejected thay vì bị retry.</p><p><strong>Thư viện retry có sẵn như tenacity.</strong> Nó gọn hơn vòng lặp tự viết và có sẵn jitter, nhưng logic phân loại lỗi vẫn phải do bạn viết, vì thư viện không biết 422 là lỗi người dùng hay lỗi cấu hình.</p>',
observe: '<p>Đo theo mã và theo nguồn, không đo theo tổng số lỗi.</p><ul><li><strong>Tỷ lệ 422 theo endpoint:</strong> tăng đột biến nghĩa là một client vừa đổi hợp đồng dữ liệu. Đây là tín hiệu cho đội đối tác, không phải sự cố hạ tầng.</li><li><strong>Tỷ lệ 5xx tách theo nguồn:</strong> log structlog có trường error_source nhận giá trị partner, timeout hoặc internal. Trên CloudWatch, lọc theo trường này để biết ai đang nghẽn.</li><li><strong>Số lần retry trên mỗi request:</strong> ghi thêm attempt vào log. Nếu trung bình vượt hai, bạn đang nhân tải lên đối tác.</li><li><strong>Độ sâu hàng đợi và DLQ:</strong> message trong DLQ tăng đều thường là payload hỏng, không phải hạ tầng hỏng. Trường hợp đó cần sửa schema hoặc đối tác, không cần thêm retry.</li></ul>',
attacks: [
{q: 'Vì sao không retry luôn cho chắc, dù sao thêm một lần thử cũng không hại gì?', a: '<p>Vì lần thử thêm có hại khi lỗi là 4xx do người dùng gây ra hoặc khi dịch vụ đang quá tải. Mỗi lần retry là một request mới tới dịch vụ đã yếu. Với 500 client cùng retry ba lần, số lời gọi tăng gấp bốn đúng lúc hệ thống cần ít tải nhất. Retry chỉ có lợi khi lỗi tạm thời và có backoff; retry không phân loại chỉ biến một sự cố thành hai sự cố.</p>'},
{q: '429 là 4xx, vậy nó có nên retry không?', a: '<p>Có, và đây là ngoại lệ cần nói rõ. 429 nghĩa là bạn vượt hạn mức, không phải request sai, nên sau một khoảng thời gian thử lại có thể thành công. Phải tôn trọng header Retry-After nếu đối tác gửi, và vẫn áp backoff với jitter. Retry 429 không có backoff là cách biến rate limit thành một vòng lặp tự nhân tải.</p>'},
{q: 'Pydantic đã trả 422 rồi, còn cần làm gì thêm ở biên?', a: '<p>Pydantic chỉ bảo vệ chiều vào. Chiều ra, tức phản hồi của đối tác, cũng cần một model, vì đối tác có thể trả 200 với payload đổi hình dạng. Nếu không validate chiều ra, lỗi sẽ lọt vào nghiệp vụ và lộ ra ở chỗ rất xa, chẳng hạn một bản ghi đối soát sai. Lỗi đó nên là 502 có log, không phải 500 không rõ nguồn.</p>'},
{q: 'Nếu tôi chỉ có một endpoint và một đối tác thì có cần cả bảng phân loại này không?', a: '<p>Có, vì chi phí của bảng phân loại nhỏ hơn nhiều so với một đợt retry sai. Tối thiểu cần ba thứ: model Pydantic cho input, bảng quyết định cho mã đối tác, và một test cho mỗi nhánh. Số lượng endpoint không đổi việc retry trên 422 là vô ích.</p>'},
],
anchor: 'Retry chỉ có nghĩa với lỗi tạm thời: 4xx do dữ liệu sai thì trả về ngay, 5xx tạm thời thì retry có backoff và jitter, còn lỗi cấu hình phía mình thì trả 502 và cảnh báo.',
say30: 'Em tách lỗi theo việc ai gây ra nó, không theo một mã chung. Dữ liệu sai bị Pydantic chặn và trả 422 ngay, và em không retry vì gửi lại cũng sai y hệt. Timeout và 5xx tạm thời thì em retry có giới hạn với backoff và jitter, còn lỗi 401 từ đối tác thì trả 502 để cảnh báo vì đó là credential của mình.',
say90: 'Em phân loại lỗi theo nguồn gốc. Lỗi do người dùng gửi sai, ví dụ amount_cents là chuỗi có dấu chấm, bị Pydantic chặn và trả 422 ngay, vì request đó sẽ sai y hệt ở mọi lần thử và retry chỉ nhân thêm tải lên endpoint đang yếu. Lỗi tạm thời như timeout, 429 và 503 từ đối tác được retry có giới hạn, backoff tăng theo cấp số nhân, cộng jitter ngẫu nhiên, và luôn có ngân sách tổng thời gian. Lỗi 401 hoặc 403 từ đối tác thì em không retry mà trả 502 và cảnh báo, vì credential của mình hỏng chứ không phải lỗi của người dùng. Điều em hay nhắc khi review là đừng bao giờ bắt Exception toàn cục rồi trả 500, vì khi đó mọi phân loại ở trên đều mất.',
body: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Pydantic</strong>: thư viện kiểm tra dữ liệu bằng cách khai báo kiểu và ràng buộc trên model. FastAPI dùng nó cho body, query, path và response.</li><li><strong>422 Unprocessable Content</strong>: mã HTTP báo request đúng cú pháp nhưng dữ liệu không hợp lệ theo schema hoặc nghiệp vụ.</li><li><strong>Retry</strong>: gửi lại cùng một request sau khi lần trước thất bại. Chỉ an toàn khi lỗi tạm thời và thao tác có idempotency.</li><li><strong>Backoff và jitter</strong>: backoff là tăng dần khoảng chờ giữa các lần thử; jitter là thêm yếu tố ngẫu nhiên để các client không thử lại cùng lúc.</li><li><strong>Idempotency-Key</strong>: khoá do phía bạn sinh, gửi kèm request để đối tác nhận ra lần gửi lặp và không tạo kết quả thứ hai.</li><li><strong>DLQ</strong>: dead-letter queue, hàng đợi nhận các message thất bại sau nhiều lần xử lý, để người vận hành xem xét thay vì để chúng quay vòng mãi.</li></ul><p><strong>Quy tắc phân loại.</strong> Với mỗi lỗi, hỏi ba câu: lỗi thuộc về ai, lỗi có tạm thời không, và thử lại có làm request thành công không. Chỉ khi cả ba câu trả lời là tạm thời và thử lại được thì mới retry. Lỗi do người gọi gây ra thì trả về ngay với mã 4xx. Lỗi của chính bạn thì trả 5xx và cảnh báo.</p><p><strong>Ví dụ cụ thể.</strong> Một request có amount_cents là chuỗi bị FastAPI trả 422 trước khi handler chạy. Client nhận danh sách lỗi có loc, và biết phải sửa trường đó. Nếu cùng request đó được retry, đối tác sẽ trả đúng lỗi cũ, và tải tăng gấp ba mà không có gì được sửa.</p><p><strong>Vì sao cần phân biệt.</strong> Retry là công cụ đổi thời gian và tải lấy khả năng thành công. Khi lỗi tạm thời, đổi như vậy đáng. Khi lỗi không tự khỏi, nó chỉ tiêu tốn tải của chính hệ thống đang gặp sự cố.</p>',
code: `# --- app/schemas.py ---
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InvoiceIn(BaseModel):
    # ✅ Cách làm chuẩn: schema chặt ở biên, trường lạ bị từ chối.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    invoice_id: str = Field(min_length=1, max_length=64, pattern=r"^INV-[0-9]{6}$")
    # Số nguyên theo đơn vị nhỏ nhất, không nhận chuỗi có dấu chấm.
    amount_cents: int = Field(gt=0, le=10_000_000)
    currency: Literal["VND", "USD"]


class PartnerReceipt(BaseModel):
    # Validate cả chiều ra: đối tác trả 200 nhưng sai hình dạng vẫn là lỗi.
    receipt_id: str = Field(min_length=1)
    status: Literal["accepted"]


# --- app/partner.py ---
import asyncio
import random

import httpx
from pydantic import ValidationError

from app.schemas import InvoiceIn, PartnerReceipt

MAX_ATTEMPTS = 3
# Mã tạm thời: đối tác quá tải hoặc vượt hạn mức, thử lại có thể thành công.
RETRYABLE_STATUS = {429, 500, 502, 503, 504}
# ✅ Cách làm chuẩn: timeout tường minh cho từng giai đoạn, không dùng mặc định.
TIMEOUT = httpx.Timeout(connect=1.0, read=3.0, write=2.0, pool=1.0)


class PartnerRejected(Exception):
    pass  # 4xx còn lại: đối tác từ chối payload, không retry.


class PartnerUnavailable(Exception):
    pass  # Timeout hoặc 5xx tạm thời sau khi đã hết lượt thử.


class PartnerMisconfigured(Exception):
    pass  # 401 hoặc 403: credential phía mình sai.


class PartnerBadPayload(Exception):
    pass  # Phản hồi 200 nhưng sai hình dạng.


def backoff(attempt: int) -> float:
    # ✅ Cách làm chuẩn: backoff tăng theo cấp số nhân, cộng jitter ngẫu nhiên
    # để các client không đập lại cùng một thời điểm.
    return min(4.0, 0.2 * 2**attempt) * random.uniform(0.5, 1.0)


async def send_charge(client: httpx.AsyncClient, body: InvoiceIn) -> PartnerReceipt:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            resp = await client.post(
                "/charges",
                json=body.model_dump(),
                # ✅ Cách làm chuẩn: khoá idempotency giữ nguyên qua mọi lần thử.
                headers={"Idempotency-Key": body.invoice_id},
                timeout=TIMEOUT,
            )
        except httpx.TransportError as exc:
            # Timeout và mất kết nối là lỗi tạm thời: thử lại được.
            if attempt == MAX_ATTEMPTS:
                raise PartnerUnavailable("timeout hoặc mất kết nối") from exc
            await asyncio.sleep(backoff(attempt))
            continue

        if resp.status_code in {401, 403}:
            # ✅ Cách làm chuẩn: credential sai thì KHÔNG retry, mà cảnh báo ngay.
            raise PartnerMisconfigured(resp.status_code)
        if resp.status_code in RETRYABLE_STATUS:
            if attempt == MAX_ATTEMPTS:
                raise PartnerUnavailable(f"đối tác trả {resp.status_code}")
            await asyncio.sleep(backoff(attempt))
            continue
        if resp.status_code >= 400:
            # ✅ Cách làm chuẩn: 4xx còn lại là request bị từ chối, retry vô ích.
            raise PartnerRejected(resp.status_code)

        try:
            # ✅ Cách làm chuẩn: chiều ra cũng đi qua Pydantic.
            # ValidationError và JSONDecodeError đều là ValueError.
            return PartnerReceipt.model_validate(resp.json())
        except ValueError as exc:
            raise PartnerBadPayload() from exc
    raise AssertionError("vòng lặp luôn return hoặc raise trước khi tới đây")


# --- app/main.py ---
from contextlib import asynccontextmanager

import httpx
import structlog
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.partner import (
    PartnerBadPayload,
    PartnerMisconfigured,
    PartnerRejected,
    PartnerUnavailable,
    send_charge,
)
from app.schemas import InvoiceIn

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ Cách làm chuẩn: một AsyncClient cho cả tiến trình, đóng khi shutdown.
    async with httpx.AsyncClient(base_url="partner.example") as client:
        app.state.partner = client
        yield


app = FastAPI(lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def invalid_input(request: Request, exc: RequestValidationError):
    # ✅ Cách làm chuẩn: 422 có code ổn định để client phân loại, không retry.
    return JSONResponse(
        status_code=422,
        content={"code": "invalid_input", "errors": jsonable_encoder(exc.errors())},
    )


@app.post("/invoices", status_code=202)
async def create_invoice(body: InvoiceIn, request: Request):
    # Tới đây body đã qua Pydantic. Dữ liệu sai đã bị chặn bằng 422 ở trên.
    try:
        receipt = await send_charge(request.app.state.partner, body)
    except PartnerRejected as exc:
        log.warning("partner_rejected", status=exc.args[0], invoice_id=body.invoice_id)
        return JSONResponse(status_code=422, content={"code": "partner_rejected"})
    except PartnerUnavailable:
        # ✅ Cách làm chuẩn: 503 kèm Retry-After là lỗi tạm thời, người gọi được thử lại.
        return JSONResponse(
            status_code=503,
            content={"code": "partner_unavailable"},
            headers={"Retry-After": "5"},
        )
    except PartnerMisconfigured as exc:
        # ✅ Cách làm chuẩn: lỗi credential là lỗi của chúng ta, trả 502 và cảnh báo.
        log.error("partner_misconfigured", status=exc.args[0])
        return JSONResponse(status_code=502, content={"code": "partner_misconfigured"})
    except PartnerBadPayload:
        log.error("partner_bad_payload", invoice_id=body.invoice_id)
        return JSONResponse(status_code=502, content={"code": "partner_bad_payload"})
    return {"receipt_id": receipt.receipt_id}


# --- tests/test_partner.py ---
import httpx
import pytest

from app.partner import PartnerRejected, PartnerUnavailable, send_charge
from app.schemas import InvoiceIn

BODY = InvoiceIn(invoice_id="INV-000001", amount_cents=100, currency="VND")


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    # Bỏ chờ backoff để test chạy nhanh và xác định.
    async def instant(_):
        return None

    monkeypatch.setattr("app.partner.asyncio.sleep", instant)


@pytest.mark.asyncio
async def test_5xx_duoc_retry_dung_ba_lan():
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(503)

    async with httpx.AsyncClient(base_url="partner.example", transport=httpx.MockTransport(handler)) as c:
        with pytest.raises(PartnerUnavailable):
            await send_charge(c, BODY)
    assert calls == 3


@pytest.mark.asyncio
async def test_4xx_khong_retry():
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(400, json={"error": "bad"})

    async with httpx.AsyncClient(base_url="partner.example", transport=httpx.MockTransport(handler)) as c:
        with pytest.raises(PartnerRejected):
            await send_charge(c, BODY)
    assert calls == 1`,
codeNote: '<p>Đoạn code tách ba việc. Schema chặt ở biên để dữ liệu sai bị 422 trước khi đi ra ngoài. Bảng phân loại trong send_charge quyết định mỗi mã đối tác là retry, từ chối hay cảnh báo. Lớp exception trung gian để handler trả đúng mã cho client, không cần đoán từ chuỗi lỗi.</p><p>Hai test cuối khoá đúng hai hợp đồng quan trọng nhất: 5xx được thử đúng ba lần, còn 4xx chỉ gọi đối tác một lần. Chúng dùng httpx.MockTransport nên không ra mạng. Test chạy với pytest-asyncio.</p><p>Điểm dễ sai là mã 422 trả về khi đối tác từ chối. Đó là mã phản ánh payload không đạt hợp đồng của đối tác, không phải lỗi hệ thống. Nếu đội đối tác muốn mã khác, sửa tại một chỗ trong handler, không sửa retry.</p>',
flow: 'flow-failure-retry',
sayIt: [
'Em validate ở biên bằng Pydantic, nên dữ liệu sai bị trả 422 trước khi chạm vào nghiệp vụ, và em không bao giờ retry 422 vì gửi lại cũng sai y hệt.',
'Em phân loại lỗi theo nguyên nhân chứ không theo mã chung: timeout và 5xx tạm thời được retry có giới hạn, backoff tăng dần và có jitter.',
'Lỗi 401 hoặc 403 từ đối tác là credential của mình, nên em trả 502 và cảnh báo thay vì retry, vì retry không sửa được gì.',
'Chiều ra cũng validate bằng Pydantic, vì đối tác có thể trả 200 với hình dạng đổi, và lỗi đó phải có log chứ không được lọt thành 500.',
'Em không bao giờ bắt Exception toàn cục rồi trả 500, vì khi đó mọi phân loại đều mất và retry trở thành nguồn nhân tải.',
],
qids: ['E03', 'G11', 'G14'],
refs: ['py-asyncio', 'aws-iam', 'aws-s3-presigned', 'aws-lambda-best']},
{id: 'L10', stage: 2, stageTitle: 'Chặng 2 — Python gắn vào AWS',
title: 'Structured logging và correlation ID: một request đi từ API Gateway qua Lambda sang SQS vẫn đọc được trên CloudWatch',
goal: 'Sau bài này bạn phải nói được vì sao print văn bản thường không đủ khi một request đi qua nhiều dịch vụ, vì sao structlog xuất JSON có correlation_id mới truy vết được, correlation_id được sinh ở đâu và đi qua API Gateway, Lambda và SQS ra sao, và khi mở CloudWatch Logs Insights bạn lọc theo trường nào để thấy toàn bộ hành trình của một request.',
bridge: 'Bài trước bạn đã đặt lời gọi ra ngoài trong một ngân sách thời gian rõ ràng và biết lỗi nào đáng thử lại. Nhưng khi có lỗi, bạn vẫn phải tìm được đúng lần gọi đã gây ra nó. Với FastAPI trên VPS, bạn quen mở một file log và ghép các dòng theo thời gian. Trên AWS, một request chạm API Gateway, rồi một hàm Lambda, rồi một message trong SQS, và mỗi dịch vụ ghi log ở một nơi với một mã riêng. Bài này biến log thành dữ liệu có cấu trúc và gắn một mã chung đi suốt hành trình đó.',
buildsOn: ['L03', 'L09'],
spine: 'Trên đường L01, bài này đứng ở khớp quan sát. Log có cấu trúc và một correlation ID chung cho phép nối API Gateway, Lambda và SQS thành một chuỗi, nhờ đó bạn đọc CloudWatch Logs Insights để tìm đúng một request thay vì đoán theo thời gian.',
spineNode: 'compute',
incident: '<p>Khách hàng nhắn lúc chín giờ sáng: đơn DH-20817 đã thanh toán nhưng email xác nhận không đến. Người trực mở CloudWatch. Log API Gateway có một request ID, log Lambda nhận đơn có một request ID khác, và log worker gửi email lại dùng message ID thứ ba. Ba dòng log đều đúng, nhưng không có trường nào nối chúng lại với nhau.</p><p>Mất gần bốn mươi phút để lọc theo khoảng thời gian và đoán. Cuối cùng người trực thấy worker có một lỗi timeout khi gọi nhà cung cấp email, nhưng lỗi đó nằm giữa hàng trăm dòng của các đơn khác chạy cùng lúc. Log dạng văn bản chỉ cho biết chuyện gì đã xảy ra, không cho biết chuyện đó thuộc về request nào.</p><p>Sau sự cố, đội thêm một correlation ID vào mọi dòng log dưới dạng JSON và truyền nó qua MessageAttributes của SQS. Lần sau, một truy vấn theo một trường là thấy cả chuỗi.</p>',
askFirst: ['Ba request ID ở ba dịch vụ có cùng giá trị không? Nếu không, vì sao lọc theo request ID của API Gateway không tìm được dòng log của worker?', 'Nếu log chỉ là câu chữ tự do như "Gửi email xong", bạn lọc theo trường nào để lấy riêng một đơn hàng?', 'correlation ID nên được sinh ở đâu, và nếu client đã gửi một ID thì có nên tin tuyệt đối vào nó không?'],
predict: {q: 'Một API nhận POST /orders, ghi log bằng print rồi đặt message vào SQS. Worker Lambda đọc message đó và ghi log tiếp. Bạn muốn tìm mọi dòng log của một đơn hàng trên CloudWatch. Bạn cần truyền thứ gì từ API sang worker, và thứ đó phải nằm ở đâu trong mỗi dòng log?', a: '<p><strong>Bạn cần một correlation ID được sinh một lần và truyền đi suốt chuỗi.</strong> API sinh ID khi request vào, đặt nó vào MessageAttributes của message SQS, và worker đọc lại từ đó để gắn vào mọi dòng log của mình.</p><p>Nó phải nằm trong mỗi dòng log như một trường JSON riêng, ví dụ correlation_id, chứ không chỉ nằm trong câu chữ. Nếu nó chỉ nằm trong chuỗi kiểu "đơn 123 xong", bạn phải dùng regex để tìm, và đổi câu chữ là truy vấn hỏng. Request ID của API Gateway không đủ, vì nó chỉ tồn tại ở tầng gateway và Lambda hay SQS không mang nó theo.</p>'},
naive: '<p>Cách làm quen thuộc từ Django là print hoặc logger.info với câu chữ đầy đủ, ví dụ "Gửi email cho đơn 123 xong". Trên VPS, bạn grep file log là ra. Trên Lambda, cách này vẫn chạy, nhưng mỗi dòng là một chuỗi tự do và không có trường nào để lọc.</p><p>Chỗ sai nằm ở việc không có khoá chung. Mỗi dịch vụ tự ghi request ID riêng, nên khi worker chạy sau API vài giây, không có cách nào biết dòng nào thuộc đơn nào, trừ khi đọc từng dòng bằng mắt. Khi có hàng nghìn request đồng thời, cách này sụp hoàn toàn.</p>',
naiveCode: `# ❌ Cách làm sai phổ biến: log là câu chữ tự do, không có trường nào để lọc theo đơn hàng.
import logging

logger = logging.getLogger(__name__)


def handle_order(order_id: str) -> None:
    # Câu chữ thay đổi tuỳ người viết, không thể lọc chắc chắn theo order_id.
    logger.info(f"Bắt đầu xử lý đơn {order_id}")
    # Worker chạy sau đó không biết dòng này thuộc request nào.
    logger.info("Đã gửi email xong")`,
naiveOut: 'CloudWatch hiển thị hai dòng cạnh nhau: <code>Bắt đầu xử lý đơn DH-20817</code> và <code>Đã gửi email xong</code>. Không có trường nào trong dòng thứ hai nhắc đến DH-20817, nên Logs Insights không lọc được chuỗi. Khi có một trăm worker chạy song song, dòng thứ hai có thể thuộc về bất kỳ đơn nào.',
timeline: [['09h00', 'Khách đặt đơn DH-20817. API Gateway sinh request ID riêng, API ghi một dòng log dạng văn bản.'], ['09h01', 'API đặt message vào SQS. Worker Lambda nhận message và ghi log tiếp, không có mã chung nào được truyền đi.'], ['09h02', 'Worker gọi nhà cung cấp email và gặp timeout. Dòng lỗi ghi "Gửi email thất bại" mà không có mã đơn.'], ['09h08', 'Khách nhắn lần hai. Người trực lọc theo khoảng thời gian nhưng có hơn bốn trăm dòng trong phút đó.'], ['09h30', 'Người trực đối chiếu thủ công theo giờ và nội dung. Tìm được lỗi nhưng chưa chắc đó là đơn nào.'], ['09h45', 'Đội thêm correlation ID vào JSON và truyền qua MessageAttributes của SQS. Lỗi tiếp theo được truy vết trong ba mươi giây.']],
rootCause: '<p>Nguyên nhân nằm ở định dạng log và ở việc không có khoá chung, không phải ở CloudWatch.</p><p><strong>Log dạng văn bản không có cấu trúc.</strong> Một dòng là một chuỗi tự do. CloudWatch Logs Insights lọc được theo trường JSON, còn với văn bản bạn chỉ có regex dễ vỡ.</p><p><strong>Mỗi dịch vụ có mã riêng.</strong> API Gateway có requestId, Lambda có aws_request_id trong context, SQS có messageId. Những mã này không tự truyền sang nhau, nên không có khoá để nối các dòng log của cùng một đơn.</p>',
concept: '<p>Log có cấu trúc là log mà mỗi dòng là một object JSON, với các trường cố định như level, event, correlation_id, và các trường nghiệp vụ như order_id. Với Django bạn đã quen cấu hình LOGGING và formatter JSON để Logstash hay CloudWatch đọc được. Với FastAPI và Lambda, <strong>structlog</strong> làm việc đó gọn hơn: bạn gọi logger.info với tên sự kiện và các cặp khoá giá trị, rồi nó xuất ra một dòng JSON.</p><p><strong>Correlation ID</strong> là một chuỗi do bạn sinh một lần khi request vào hệ thống, rồi đi theo mọi lời gọi và message sau đó. Đây là khoá chung duy nhất mà bạn tự kiểm soát. Request ID của từng dịch vụ thuộc về dịch vụ đó, còn correlation ID thuộc về cả hành trình.</p>',
mechanism: '<p>Luồng đi của một request gồm bốn bước, và mỗi bước đều giữ lại correlation ID.</p><ul><li><strong>API Gateway</strong> nhận request và chuyển tiếp header lên Lambda. Gateway không sinh được UUID tuỳ ý, nhưng nó có requestId, còn code của bạn tự đọc header X-Correlation-Id do client gửi.</li><li><strong>Lambda API</strong> chạy middleware: đọc header, nếu thiếu hoặc không hợp lệ thì sinh uuid4, rồi bind_contextvars với correlation_id. Mọi dòng log sau đó tự có trường này mà không phải truyền tay vào từng hàm.</li><li><strong>SQS</strong> nhận message với MessageAttributes chứa correlation_id. Đây là metadata riêng của message, không lẫn vào body JSON nghiệp vụ.</li><li><strong>Worker Lambda</strong> đọc record.messageAttributes trong event SQS, bind lại correlation_id, rồi ghi log. Dòng log của worker có cùng giá trị với dòng log của API.</li></ul><p>Ở phía đọc, CloudWatch Logs Insights chạy truy vấn trên các log group, ví dụ lọc correlation_id bằng giá trị lấy từ ticket hoặc từ header phản hồi. Kết quả trả về mọi dòng của hành trình, sắp theo timestamp.</p>',
failureModes: '<p>Cách làm này có bốn kiểu hỏng cần kiểm soát.</p><ul><li><strong>Contextvars rò giữa các lần gọi.</strong> Lambda tái sử dụng container. Nếu bind correlation_id ở lần gọi trước mà không clear, lần gọi sau sẽ ghi log với ID cũ. Mỗi handler phải gọi clear_contextvars ở đầu.</li><li><strong>Thiếu trường ở đường bất đồng bộ.</strong> Task asyncio kế thừa context lúc được tạo, nhưng thread do code tự tạo thì không. Với thread pool, cần chạy qua contextvars.copy_context để giữ correlation_id.</li><li><strong>Log chứa dữ liệu nhạy cảm.</strong> Đưa cả body request, số thẻ hay email vào JSON là đưa dữ liệu cá nhân vào CloudWatch, và ai có quyền đọc log cũng đọc được. Chỉ log các trường cần để truy vết.</li><li><strong>Chi phí log tăng.</strong> CloudWatch Logs tính tiền theo dung lượng log được ingest. Log mức DEBUG ở production nhân chi phí rất nhanh, nên level phải đặt theo môi trường.</li></ul>',
tradeoff: '<p>JSON log dễ lọc và dễ đọc bằng máy, nhưng khó đọc bằng mắt khi chạy local. Bạn nên dùng renderer dạng console ở môi trường dev và JSONRenderer trên Lambda. Các lệnh logger.info giữ nguyên, chỉ đổi processor lúc khởi động.</p><p>Correlation ID tự sinh thêm một trường trong message và một header trong request, nhưng đổi lại bạn có khoá nối cả chuỗi. Với một service duy nhất và một log group, chi phí này không đáng. Với nhiều dịch vụ thì đáng.</p>',
alternatives: '<p>AWS X-Ray cũng truyền trace qua API Gateway, Lambda và SQS bằng header X-Amzn-Trace-Id, và cho sơ đồ thời gian trực quan hơn. Nhưng X-Ray là công cụ trace riêng, còn correlation ID trong log JSON là thứ bạn tự kiểm soát và đọc được ngay trong CloudWatch Logs Insights. Nhiều đội dùng cả hai: X-Ray để xem thời gian, correlation ID để tìm log.</p><p>AWS Lambda Powertools for Python cung cấp logger JSON và decorator lấy correlation ID từ event API Gateway hoặc SQS. Nó tiện hơn tự viết, nhưng bạn vẫn phải hiểu cơ chế bên dưới để biết nó làm gì với contextvars.</p>',
observe: '<p>Bốn dấu hiệu cho biết logging đang hoạt động đúng.</p><ul><li><strong>Mỗi dòng log là JSON hợp lệ.</strong> Logs Insights parse được trường level và correlation_id mà không cần regex.</li><li><strong>Một correlation ID xuất hiện ở ít nhất ba dòng.</strong> Dòng của API, dòng của worker và dòng lỗi phải có cùng giá trị. Nếu thiếu ở worker, MessageAttributes chưa được truyền đúng.</li><li><strong>Metrics của Lambda.</strong> Trong namespace AWS/Lambda, xem Invocations, Errors, Duration và Throttles theo hàm. Đây là số tổng hợp, không phải theo request, nên dùng để phát hiện xu hướng.</li><li><strong>Log không chứa dữ liệu nhạy cảm.</strong> Thử tìm email và số thẻ trong log bằng Logs Insights. Nếu có kết quả, bộ lọc trường đang sai.</li></ul>',
attacks: [{q: 'Lambda đã có request ID trong context, vậy cần correlation ID làm gì?', a: 'Request ID của Lambda chỉ đúng cho một lần gọi của một hàm. Khi đơn đi từ API sang SQS rồi sang worker, đó là hai lần gọi với hai request ID khác nhau, cộng thêm request của API Gateway. Correlation ID là giá trị do bạn sinh một lần và giữ suốt chuỗi, nên một truy vấn duy nhất lấy được tất cả. Tôi vẫn log aws_request_id để đối chiếu với CloudWatch, nhưng không dùng nó làm khoá nghiệp vụ.'}, {q: 'Nếu client tự gửi X-Correlation-Id, có nên tin giá trị đó không?', a: 'Dùng được để nối với hệ thống phía client, nhưng không nên tin tuyệt đối. Client có thể gửi chuỗi quá dài hoặc có ký tự lạ, nên tôi giới hạn độ dài và kiểu ký tự, còn nếu sai thì sinh ID mới. Giá trị hợp lệ vẫn được trả lại trong header phản hồi để phía client tìm được log.'}, {q: 'Warm container thì contextvars có bị lẫn giữa các request không?', a: 'Có, nếu không làm gì. Lambda giữ container để tái sử dụng, nên giá trị bind ở lần gọi trước vẫn còn. Vì vậy handler của tôi luôn gọi clear_contextvars trước khi bind ID mới. Đây là dòng code rất dễ quên, và lỗi của nó là log sai đơn mà không báo lỗi gì.'}, {q: 'Log hết mọi thứ ở mức DEBUG để sau này tiện điều tra, có được không?', a: 'Không nên ở production. CloudWatch Logs tính tiền theo dung lượng log được ingest, và DEBUG nhân nhiều lần khối lượng đó. Body request thường chứa dữ liệu cá nhân, mà ai có quyền đọc log cũng đọc được. Tôi đặt level INFO, chỉ log trường cần để truy vết, và bật DEBUG có thời hạn khi điều tra.'}],
anchor: 'Log có cấu trúc biến mỗi dòng thành dữ liệu lọc được, còn correlation ID là khoá duy nhất nối API Gateway, Lambda và SQS thành một hành trình.',
say30: 'Em log dạng JSON bằng structlog và sinh một correlation ID khi request vào API. ID đó đi theo message SQS sang worker, nên trên CloudWatch Logs Insights em lọc một trường là thấy toàn bộ hành trình của một đơn. Không có ID chung thì em chỉ đoán theo thời gian.',
say90: 'Khi một request đi qua API Gateway, Lambda API, SQS và worker Lambda, mỗi dịch vụ có mã riêng: requestId, aws_request_id, messageId. Những mã này không tự truyền sang nhau, nên em tự sinh một correlation ID trong middleware FastAPI, lấy từ header X-Correlation-Id nếu hợp lệ hoặc sinh mới. Em bind nó bằng structlog contextvars, và mọi dòng log sau đó tự có trường đó. Khi gửi SQS, em đặt nó vào MessageAttributes, còn worker đọc lại từ event record. Có một cái bẫy trên Lambda: container được tái sử dụng, nên em luôn clear contextvars ở đầu mỗi handler để ID cũ không lẫn sang lần gọi mới. Về metrics, em xem Invocations, Errors, Duration và Throttles trong CloudWatch để biết xu hướng, rồi dùng log để tìm một request cụ thể.',
body: '<p><strong>Tóm tắt để tra cứu.</strong> Log có cấu trúc là mỗi dòng một object JSON với các trường cố định như level, event và correlation_id. Với Django bạn đã làm việc này bằng formatter JSON trong LOGGING, còn với FastAPI và Lambda, structlog làm gọn hơn.</p><p><strong>Các bước cấu hình.</strong></p><ul><li>Cấu hình structlog một lần lúc import, với add_log_level, TimeStamper và JSONRenderer.</li><li>Middleware đọc X-Correlation-Id, kiểm tra độ dài, gọi clear_contextvars rồi bind_contextvars.</li><li>Khi gửi SQS, truyền correlation_id trong MessageAttributes với DataType String.</li><li>Worker đọc record.messageAttributes và bind lại trước khi xử lý.</li></ul><p><strong>Đọc trên CloudWatch.</strong> Logs Insights lọc theo trường, ví dụ filter correlation_id bằng giá trị cần tìm rồi sort theo @timestamp. Metrics của Lambda nằm trong namespace AWS/Lambda và cho thấy số lần gọi, lỗi, thời lượng và throttle theo hàm, không theo từng request.</p>',
code: `import json
import os
import uuid

import boto3
import structlog
from fastapi import FastAPI, Request

# ✅ Cách làm chuẩn: cấu hình structlog một lần khi khởi động, xuất mỗi dòng log thành JSON.
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()
app = FastAPI()
sqs = boto3.client("sqs", region_name="ap-southeast-1")
QUEUE_URL = os.environ["QUEUE_URL"]


@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    # ✅ Cách làm chuẩn: xoá ngữ cảnh của lần gọi trước, vì Lambda tái sử dụng container.
    structlog.contextvars.clear_contextvars()
    incoming = request.headers.get("x-correlation-id", "")
    # Chỉ nhận ID có độ dài hợp lý, còn lại sinh mới.
    corr = incoming if 0 < len(incoming) <= 64 else uuid.uuid4().hex
    # Gắn correlation_id vào mọi dòng log của request này.
    structlog.contextvars.bind_contextvars(correlation_id=corr)
    request.state.correlation_id = corr
    response = await call_next(request)
    response.headers["x-correlation-id"] = corr
    return response


@app.post("/orders")
def create_order(payload: dict, request: Request):
    order_id = uuid.uuid4().hex
    log.info("order_created", order_id=order_id)
    # ✅ Cách làm chuẩn: đưa correlation_id vào MessageAttributes, không nhét vào body nghiệp vụ.
    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps({"order_id": order_id}),
        MessageAttributes={
            "correlation_id": {"DataType": "String", "StringValue": request.state.correlation_id},
        },
    )
    return {"order_id": order_id}


def worker_handler(event, context):
    # ✅ Cách làm chuẩn: xoá ngữ cảnh cũ rồi lấy lại correlation_id từ từng record SQS.
    structlog.contextvars.clear_contextvars()
    for record in event["Records"]:
        corr = record["messageAttributes"]["correlation_id"]["stringValue"]
        # Gắn cả request ID của Lambda để đối chiếu với CloudWatch.
        structlog.contextvars.bind_contextvars(
            correlation_id=corr, aws_request_id=context.aws_request_id
        )
        body = json.loads(record["body"])
        log.info("worker_started", order_id=body["order_id"])
        # Xử lý nghiệp vụ ở đây; mọi dòng log sau đây đều mang correlation_id.
        log.info("worker_done", order_id=body["order_id"])`,
codeNote: 'Đoạn code gồm ba phần: cấu hình structlog, middleware trên API, và worker đọc lại ID từ SQS. Mỗi phần đều xoá ngữ cảnh cũ trước khi bind ID mới, vì container Lambda được tái sử dụng giữa các lần gọi.',
flow: 'flow-lambda-cold-start',
sayIt: ['Em không đọc log bằng cách grep câu chữ. Em log dạng JSON bằng structlog, để mỗi dòng có trường correlation_id và CloudWatch Logs Insights lọc được.', 'Correlation ID do middleware FastAPI sinh hoặc nhận từ header, được bind vào contextvars, rồi truyền qua MessageAttributes của SQS. Worker Lambda đọc lại từ record và gắn vào mọi dòng log của nó.', 'Một điểm em luôn để ý là Lambda tái sử dụng container, nên em clear contextvars ở đầu mỗi handler. Nếu không, log của đơn sau sẽ mang ID của đơn trước.', 'Trên CloudWatch, em xem Invocations, Errors, Duration và Throttles để biết xu hướng, còn khi cần tìm một request cụ thể thì em lọc theo correlation_id.'],
qids: ['G16', 'H02', 'H03', 'H07'],
refs: ['aws-ecs', 'docker-multi-stage', 'docker-security', 'gh-actions', 'aws-lambda-best']},
{id: 'L11', stage: 2, stageTitle: 'Chặng 2 — Python gắn vào AWS',
title: 'Test Python AWS với pytest: dependency_overrides cắt boto3 khỏi mạng thật',
goal: 'Sau bài này bạn phải nói được vì sao endpoint gọi boto3 trực tiếp là không test được an toàn, dependency_overrides thay một Depends bằng fake ra sao và vì sao phải trỏ đúng object, vì sao patch sai chỗ vẫn để test gọi AWS thật, và cách chặn mạng để một test lỡ tay không bao giờ chạm S3 hay SQS thật.',
bridge: 'Bài trước bạn đã đặt phép kiểm tra vào đúng câu lệnh ghi để cơ sở dữ liệu tự bảo vệ dữ liệu. Bài này áp đúng tư duy đó lên bộ test. Với Django trên VPS, bạn quen với việc test dùng database riêng và mock những gì đi ra ngoài. Trên AWS, thứ đi ra ngoài là S3, SQS và DynamoDB qua boto3. Nếu test chạm thật, nó ghi vào bucket thật, đọc nhầm message của worker thật và tốn tiền. Dependency injection của FastAPI cho bạn một điểm cắt tự nhiên, nhưng chỉ khi boto3 được đưa vào qua Depends ngay từ đầu.',
buildsOn: ['L08', 'L10'],
spine: 'Trên đường L01, bài này đứng ở khớp kiểm thử. Ranh giới giữa code và AWS phải được cắt rõ ràng thì suite mới chạy nhanh, lặp lại được, và không bao giờ gọi mạng ra ngoài khi chạy trong CI.',
spineNode: 'compute',
incident: '<p>Đội đang làm endpoint POST /reports/export. Endpoint này sinh file CSV, ghi lên bucket reports-staging bằng boto3 và gửi một message vào queue export-jobs. Test pytest cho endpoint được viết theo kiểu quen tay: route tự gọi boto3.client("s3") và boto3.client("sqs") ngay bên trong hàm, và CI chạy với profile trỏ tới account staging.</p><p>Suite pass trên máy của mọi người, nhưng trong CI thỉnh thoảng đỏ với lỗi NoSuchKey, vì hai test cùng ghi và xoá một key trên bucket thật. Điều tệ hơn lộ ra sau hai ngày: worker staging báo timeout vì một test đã gọi receive_message trên queue thật và lấy mất message mà worker đang chờ.</p><p>Một người thêm patch boto3.client trong test và thấy test xanh hẳn. Nhưng khi kiểm tra CloudTrail, họ thấy các sự kiện PutObject và ReceiveMessage đến từ role của CI runner, và chúng vẫn xuất hiện sau khi patch. Suite chạy mất mười bốn phút vì mỗi lời gọi mạng thật đều phải chờ timeout.</p>',
askFirst: ['Vì sao một test có thể xanh trong khi vẫn gửi PutObject thật lên bucket staging?', 'Nếu bạn chỉ thay boto3 bằng một fake trong test, làm sao biết fake đã thật sự được dùng?', 'Bạn sẽ chặn những đường ra mạng nào trước khi cho suite chạy trong CI?'],
predict: {q: 'Hai cách viết test dưới đây đều có chữ mock trong code. Cách A patch boto3.client trong test, còn route dùng biến s3 được tạo ở cấp module lúc import. Cách B route khai báo Depends(get_s3_client) và test đặt app.dependency_overrides[get_s3_client]. Cách nào thật sự thay được client mà route đang dùng, và cách nào vẫn gọi AWS thật dù test xanh?',
a: '<p><strong>Cách A vẫn gọi AWS thật.</strong> Biến s3 được tạo khi module được import, tức là boto3.client("s3") đã chạy và trả về một object client hoàn chỉnh trước khi test bắt đầu. Patch boto3.client sau đó chỉ đổi tên gọi về sau, không đổi object đã tồn tại. Route vẫn dùng client thật, nên test xanh và PutObject vẫn bay sang bucket staging.</p><p><strong>Cách B thay được client.</strong> Route nhận client qua Depends, nên FastAPI gọi get_s3_client mỗi khi resolve dependency và kiểm tra bảng dependency_overrides trước. Nếu key trong bảng là đúng object get_s3_client mà route import, fake được trả về và không có request nào ra mạng.</p><p>Điều kiện là key phải đúng object. Nếu bạn định nghĩa một hàm trùng tên ở module khác rồi dùng nó làm key, override sẽ không bao giờ khớp và test lại gọi thật mà không báo lỗi gì.</p>'},
naive: '<p>Cách làm đầu tiên ai cũng viết: tạo client boto3 ở cấp module để khỏi phải tạo lại mỗi request, rồi trong test chỉ cần patch boto3.client là xong. Nó trông gọn và đúng ý nghĩa mock AWS, nên người review thường cho qua.</p><p>Chỗ sai nằm ở thời điểm. Client được tạo khi module được import, trước khi test chạy patch. Patch sau đó không chạm vào object đã tồn tại, nên route vẫn giữ client thật và test xanh một cách giả tạo. Vì không có lỗi nào, không ai phát hiện cho đến khi nhìn vào CloudTrail.</p><p>Biến thể thứ hai còn khó thấy hơn: test patch đúng chuỗi boto3.client, nhưng route đã import bằng from boto3 import client ở đầu file. Tên client trong module đó vẫn trỏ về hàm gốc, nên patch không bao giờ tới được.</p>',
naiveCode: `# ❌ Cách làm sai phổ biến: client tạo ở cấp module, không có điểm nào để thay thế
import boto3
from fastapi import APIRouter

router = APIRouter()

# Client bị tạo lúc import. Mọi lời gọi về sau đều dùng object này,
# và patch chạy sau đó không đổi được nó.
s3 = boto3.client("s3", region_name="ap-southeast-1")


@router.post("/reports/export")
def export_report(report_id: str):
    s3.put_object(Bucket="reports-staging", Key=f"exports/{report_id}.csv", Body=b"id,total")
    return {"ok": True}


# ❌ Cách làm sai phổ biến: patch chuỗi boto3.client rồi tưởng là đã chặn AWS
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app


def test_export_report():
    # Patch này xanh, nhưng s3 đã được tạo từ trước nên vẫn là client thật.
    with patch("boto3.client"):
        resp = TestClient(app).post("/reports/export", params={"report_id": "r1"})
    # ❌ Assert này pass và che mất việc PutObject thật vừa được gửi đi.
    assert resp.status_code == 200`,
naiveOut: '<p>Test xanh, log CI sạch, không có exception nào. Nhưng CloudTrail ghi PutObject vào reports-staging và ReceiveMessage trên export-jobs, với principal là role của CI runner. Một test khác vừa đọc queue vừa đợi message, nên worker staging nhận timeout.</p><p>Điều đáng chú ý là suite không báo lỗi gì khi gọi mạng thật. Nó chỉ chậm, mười bốn phút, vì các lời gọi thật phải chờ timeout trên runner. Bạn chỉ phát hiện được sự cố bằng cách đối chiếu log AWS với thời điểm chạy test.</p>',
timeline: [['09h00', 'Endpoint export được merge. Test dùng patch boto3.client và CI xanh.'], ['09h40', 'Một test khác chạy song song ghi cùng key exports/r1.csv lên bucket staging, lần ghi và đọc đan xen nhau.'], ['11h15', 'Test đọc message từ queue export-jobs trên AWS thật và lấy mất message mà worker staging đang đợi.'], ['11h20', 'Worker staging báo timeout. Ai đó nghĩ đây là lỗi hạ tầng và restart worker.'], ['13h00', 'Một người thêm log để in ra client đang được dùng và thấy đó vẫn là client thật.'], ['14h30', 'Đối chiếu CloudTrail: PutObject và ReceiveMessage đến từ role của CI runner, trùng thời điểm với các lần chạy suite.'], ['16h00', 'Chuyển sang Depends với dependency_overrides, bật chặn socket trong pytest, và đặt tiền tố key duy nhất cho mỗi lần chạy.']],
rootCause: '<p>Ba điều kiện cùng xảy ra, và chỉ cần một trong ba được sửa thì sự cố đã lộ ra ngay trong CI.</p><ul><li><strong>Client được tạo ở cấp module.</strong> Object bị khoá lúc import, nên mọi thứ patch sau đó đều đến muộn.</li><li><strong>Không có điểm cắt tường minh.</strong> Route tự quyết định dùng boto3 nào, nên test không có chỗ nào để đưa fake vào một cách sạch sẽ.</li><li><strong>Không có chốt chặn mạng.</strong> Test chạy với credential thật và có đường ra mạng, nên một lời gọi thật vẫn thành công và không ai ngăn.</li></ul><p>Ba lỗi này cộng lại tạo ra một test xanh nhưng hành vi sai. Không lỗi nào trong số đó làm test đỏ, nên người viết test không có tín hiệu để sửa.</p>',
concept: '<p>Khái niệm cần nắm là <strong>điểm cắt</strong>, tức chỗ mà code lấy một phụ thuộc ra ngoài và cho phép thay phụ thuộc đó. Trong FastAPI, điểm cắt chính là Depends. Route không tự tạo client mà khai báo rằng nó cần một client, còn việc cung cấp client nằm trong một hàm riêng.</p><p>Test chỉ an toàn khi mọi đường ra AWS đi qua một điểm cắt như vậy. Nếu có một lời gọi nằm ngoài điểm cắt, không có cách nào để test thay nó, và bạn chỉ có thể hy vọng nó không chạy.</p><p>So với Django: nếu bạn quen dùng override_settings hoặc mock một service trong test, thì dependency_overrides là bản tương đương của FastAPI cho đúng việc đó. Khác biệt là nó thay theo object hàm chứ không theo tên chuỗi.</p>',
mechanism: '<p><strong>FastAPI giải quyết Depends theo từng request.</strong> Khi request đến, FastAPI đọc chữ ký của route, tìm các Depends, rồi gọi từng dependency. Trước khi gọi, nó kiểm tra app.dependency_overrides: nếu hàm gốc có mặt trong bảng, FastAPI gọi hàm thay thế. Cơ chế này áp dụng cả cho dependency lồng nhau.</p><p><strong>Bảng override được khoá bằng object hàm.</strong> Key là chính đối tượng get_s3_client được import, không phải tên chuỗi. Vì vậy test phải import đúng hàm mà route đang dùng, và phải dọn bảng sau mỗi test. Nếu không, override của test trước sẽ rò sang test sau.</p><p><strong>Moto chặn ở tầng botocore.</strong> mock_aws của moto bắt các request mà botocore định gửi và trả về phản hồi giả được lưu trong bộ nhớ. Code gọi boto3 vẫn chạy đường đi thật, chỉ khác là không có socket nào mở ra. Moto không tự chặn các HTTP client khác, nên cần thêm một lớp chặn socket.</p><p><strong>Chặn socket là chốt cuối.</strong> pytest-socket với tuỳ chọn --disable-socket khiến mọi lần mở socket ra ngoài bị từ chối. Test lỡ tay gọi mạng sẽ lỗi ngay tại dòng đó, không còn pass âm thầm.</p>',
failureModes: '<p>Các kiểu hỏng khi test AWS bằng pytest:</p><ul><li><strong>Override trỏ sai object.</strong> Một hàm trùng tên ở module khác không khớp key, nên test gọi thật mà không có cảnh báo. Cách phòng là import đúng hàm từ module gốc và có một test kiểm tra override thật sự được dùng.</li><li><strong>Override rò giữa các test.</strong> Quên clear bảng làm test sau nhận fake của test trước, và lỗi chỉ xuất hiện khi chạy theo một thứ tự nhất định. Dùng fixture với yield và clear trong finally.</li><li><strong>Fake không khớp hợp đồng thật.</strong> Một fake trả về dict thiếu trường mà boto3 thật luôn có sẽ làm test xanh nhưng production lỗi. Moto giảm rủi ro này vì nó đi qua botocore thật, còn fake tự viết thì không.</li><li><strong>Bucket giả thiếu bước khởi tạo.</strong> Phải tạo bucket trước khi put, và thiếu LocationConstraint ở region khác us-east-1 sẽ lỗi. Đây là lỗi của môi trường test, không phải của route.</li><li><strong>Chạy suite với profile thật trên máy dev.</strong> Nếu không ghi đè credential bằng giá trị giả, một test lỡ tay vẫn có thể dùng quyền của bạn khi socket chưa bị chặn.</li></ul>',
tradeoff: '<p>Đưa boto3 qua Depends và viết override thêm một lớp gián tiếp. Mỗi endpoint phải khai báo dependency, và mỗi test phải biết tên hàm để override. Đổi lại, route đọc rõ hơn và việc thay implementation chỉ cần sửa một chỗ.</p><p>Moto đáng tin hơn fake tự viết, nhưng nó không hoàn hảo. Mỗi dịch vụ có độ phủ khác nhau, và các hành vi như kiểm tra IAM policy thật, throttling hay eventual consistency không được mô phỏng đầy đủ. Test vẫn chạy nhanh và xác định, nhưng không thay được một lần kiểm tra trên staging thật.</p><p>Chặn socket làm suite đỏ ngay khi ai đó thêm một lời gọi mạng mới. Điều này tốt cho CI, nhưng sẽ phiền nếu một thư viện cần kết nối cục bộ. Lúc đó bạn thêm ngoại lệ tường minh cho loopback thay vì tắt chặn.</p>',
alternatives: '<p><strong>botocore Stubber.</strong> Stubber cho phép khai báo trước response và kiểm tra tham số đúng như bạn mong đợi trên một client cụ thể. Nó chính xác với từng lời gọi, nhưng bạn phải viết kịch bản cho mọi lệnh gọi, nên phù hợp để kiểm tra tham số hơn là test luồng nhiều bước.</p><p><strong>LocalStack trong Docker Compose.</strong> Bạn trỏ boto3 tới một endpoint cục bộ qua biến môi trường AWS_ENDPOINT_URL, còn code không đổi. Lợi ích là đi qua HTTP thật, gần production hơn. Cái giá là cần Docker chạy trước suite và thời gian khởi động dài hơn.</p><p><strong>Một bucket test thật với tiền tố duy nhất.</strong> Mỗi lần chạy dùng một prefix ngẫu nhiên, dọn sau khi xong, và role chỉ có quyền trên bucket test. Cách này kiểm tra được quyền IAM thật, nhưng vẫn chạm mạng và vẫn chậm, nên chỉ nên đặt trong suite tích hợp chạy riêng.</p>',
observe: '<ul><li><strong>CloudTrail theo principal.</strong> Lọc các sự kiện có userIdentity là role của CI runner trong khung giờ chạy test. Bất kỳ sự kiện nào từ đó là bằng chứng test đã chạm AWS thật.</li><li><strong>Lỗi chặn socket trong CI.</strong> Khi socket bị chặn, một lời gọi thật thành lỗi rõ ràng. Theo dõi số test lỗi kiểu này trong mỗi lần chạy để biết có đường ra mạng mới vừa được thêm vào.</li><li><strong>Thời gian suite.</strong> Chạy pytest --durations=10 để thấy test nào chậm bất thường. Một test chậm vài giây thường là đang chờ timeout của một lời gọi thật.</li><li><strong>Tiền tố key trong bucket test.</strong> Ghi log tiền tố của mỗi lần chạy. Khi có lỗi NoSuchKey hay ghi đè, bạn biết ngay hai lần chạy nào đang tranh nhau.</li><li><strong>Phạm vi credential.</strong> Kiểm tra xem CI có thật sự cần quyền ghi vào bucket staging không. Nếu không, role chỉ nên có quyền trên bucket test.</li></ul><p>Trong các tín hiệu này, CloudTrail theo principal là bằng chứng trực tiếp nhất. Các tín hiệu còn lại chỉ cho thấy có điều bất thường.</p>',
attacks: [{q: 'Sao không chỉ dùng moto là đủ, khỏi cần dependency_overrides?', a: '<p>Moto bắt được lời gọi boto3 khi nó nằm trong mock_aws, nhưng nó không cho bạn biết route đang dùng client nào, và nó không tự chặn mọi kết nối mạng. Nếu một client được tạo trước khi mock_aws bật, client đó có thể không bị bắt và vẫn gọi ra ngoài. Dependency override buộc route nhận đúng object bạn muốn, nên ranh giới rõ ràng và dễ kiểm chứng.</p><p>Thực tế là dùng cả hai: override để chọn client, moto để giả lập hành vi, và chặn socket làm chốt cuối.</p>'},
{q: 'Nếu CI không có quyền AWS thật thì có cần lo chuyện này không?', a: '<p>Có, vì lỗi không chỉ nằm ở quyền. Khi CI có quyền đọc, test có thể đọc dữ liệu thật và phụ thuộc vào trạng thái staging. Khi có quyền ghi, test có thể xoá hoặc ghi đè. Thiếu quyền cũng không làm test nhanh hơn: mỗi lời gọi vẫn chờ timeout, và suite trở nên chậm và không xác định.</p>'},
{q: 'Stubber có đủ không, hay vẫn cần moto?', a: '<p>Stubber rất tốt khi bạn muốn kiểm tra chính xác tham số của một lời gọi cụ thể, vì nó bắt được lỗi sai tên trường. Nhưng nó gắn với từng lời gọi bạn khai báo trước, nên khi luồng có nhiều bước như ghi S3 rồi đọc lại, kịch bản sẽ dài và dễ lệch. Moto hợp với luồng nhiều bước, còn Stubber hợp với kiểm tra hợp đồng tham số của một hàm.</p>'},
{q: 'Chặn socket có làm hỏng TestClient không?', a: '<p>Không. TestClient của Starlette chạy ứng dụng ASGI ngay trong tiến trình và không mở socket ra ngoài. Nếu một thư viện thật sự cần socket cục bộ, bạn thêm ngoại lệ tường minh cho địa chỉ loopback chứ không tắt cơ chế chặn.</p>'}],
anchor: 'Patch sai chỗ làm test xanh trong khi boto3 vẫn gọi AWS thật, nên ranh giới phải nằm ở dependency có thể override và chốt cuối nằm ở chặn socket.',
say30: 'Em test endpoint dùng boto3 bằng cách đưa client vào qua Depends rồi override trong test bằng app.dependency_overrides. Lý do là client tạo ở cấp module bị khoá lúc import, nên patch boto3.client trong test không đổi được object route đang giữ, và test vẫn xanh trong khi PutObject thật bay sang staging. Với override, key phải đúng object get_s3_client mà route import, và em dọn bảng sau mỗi test.',
say90: 'Em chia test thành ba lớp. Lớp đầu là điểm cắt: route không tự tạo boto3 client mà nhận qua Depends, nên trong test em override get_s3_client trỏ về một client moto. Lớp hai là giả lập: mock_aws bắt các request botocore và trả phản hồi trong bộ nhớ, nên code gọi boto3 vẫn chạy đường đi thật mà không ra mạng. Lớp ba là chốt cuối: credential môi trường được đặt thành giá trị giả, và pytest-socket chặn socket, nên nếu có ai thêm một lời gọi ra ngoài thì test lỗi ngay chứ không pass âm thầm. Điểm em hay gặp là patch sai chỗ, nên em kiểm tra bằng cách đọc lại dữ liệu từ bucket giả chứ không chỉ nhìn vào status code. Trong CI em bật thêm CloudTrail theo role của runner để có bằng chứng nếu có gì lọt qua.',
body: '<p><strong>Tóm tắt để ôn nhanh.</strong> Phần trên giải thích vì sao. Phần này là các quy tắc để áp dụng ngay.</p><p><strong>Đưa boto3 qua Depends.</strong> Route khai báo nó cần một client, còn việc tạo client nằm trong một hàm riêng như get_s3_client. Với Django, đây giống việc tách service ra khỏi view. Khác biệt là FastAPI thực hiện việc tách đó qua khai báo tham số.</p><p><strong>Override bằng đúng object.</strong> app.dependency_overrides[get_s3_client] = lambda: fake. Key là hàm gốc được import từ module của route. Luôn dọn bảng trong fixture bằng yield và clear trong finally.</p><p><strong>Không tạo client ở cấp module.</strong> Client tạo lúc import là object bị khoá sớm, và patch về sau không với tới được. Tạo client trong một hàm factory có lru_cache để chỉ có một client mỗi process.</p><p><strong>Bộ ba chốt chặn.</strong> Credential giả qua biến môi trường để không bao giờ dùng profile của máy dev. Moto cho luồng nhiều bước chạy trong bộ nhớ. pytest-socket với --disable-socket để lời gọi ra ngoài lỗi ngay.</p><p><strong>Lỗi AWS phải được xử lý trong route.</strong> ClientError từ boto3 nên được đổi thành HTTP 503 có chủ đích, không để lọt thành 500 không rõ nguyên nhân. Test phải kiểm tra nhánh này bằng một fake ném ClientError, vì đây là nhánh thường bị bỏ sót.</p><p><strong>Khi nào chạy suite tích hợp.</strong> Kiểm tra quyền IAM thật và hành vi eventual consistency chỉ đáng chạy trên một bucket test riêng, trong job tách khỏi unit test, và chỉ khi credential được cấp rõ ràng.</p>',
code: `# --- app/storage.py ---
from functools import lru_cache

import boto3
from botocore.config import Config


@lru_cache(maxsize=1)
def get_s3_client():
    # ✅ Cách làm chuẩn: client được tạo trong một hàm factory có cache.
    # Route khai báo Depends(get_s3_client), nên test có đúng một điểm để override.
    return boto3.client(
        "s3",
        region_name="ap-southeast-1",
        config=Config(
            connect_timeout=2,
            read_timeout=5,
            retries={"max_attempts": 3, "mode": "standard"},
        ),
    )


# --- app/routes/reports.py ---
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException

from app.storage import get_s3_client

router = APIRouter()


@router.post("/reports/export")
def export_report(report_id: str, s3=Depends(get_s3_client)):
    # Route không biết client đến từ đâu. Test có thể thay nó mà không sửa route.
    key = f"exports/{report_id}.csv"
    try:
        s3.put_object(Bucket="reports-staging", Key=key, Body=b"id,total")
    except ClientError as exc:
        # ✅ Cách làm chuẩn: lỗi AWS được đổi thành lỗi HTTP có chủ đích.
        raise HTTPException(status_code=503, detail="storage unavailable") from exc
    return {"key": key}


# --- tests/conftest.py ---
import boto3
import pytest
from fastapi.testclient import TestClient
from moto import mock_aws

from app.main import app
from app.storage import get_s3_client


@pytest.fixture(autouse=True)
def fake_aws_credentials(monkeypatch):
    # ✅ Cách làm chuẩn: ghi đè credential bằng giá trị giả trước mọi test.
    # Nếu có đường đi nào lọt ra AWS thật, nó dùng key giả và bị từ chối.
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-southeast-1")
    monkeypatch.delenv("AWS_PROFILE", raising=False)


@pytest.fixture
def s3_fake():
    # Moto giả lập S3 trong bộ nhớ của tiến trình. Client được tạo bên trong mock_aws.
    with mock_aws():
        s3 = boto3.client("s3", region_name="ap-southeast-1")
        s3.create_bucket(
            Bucket="reports-staging",
            CreateBucketConfiguration={"LocationConstraint": "ap-southeast-1"},
        )
        yield s3


@pytest.fixture
def client(s3_fake):
    # ✅ Cách làm chuẩn: key là đúng object get_s3_client mà route import.
    app.dependency_overrides[get_s3_client] = lambda: s3_fake
    try:
        yield TestClient(app)
    finally:
        # Dọn bảng để override của test này không rò sang test sau.
        app.dependency_overrides.clear()


# --- tests/test_reports.py ---
from botocore.exceptions import ClientError

from app.main import app
from app.storage import get_s3_client


def test_export_writes_to_fake_bucket(client, s3_fake):
    resp = client.post("/reports/export", params={"report_id": "r1"})

    assert resp.status_code == 200
    # Đọc lại từ bucket giả để chứng minh ghi thật sự xảy ra trên đúng client.
    obj = s3_fake.get_object(Bucket="reports-staging", Key="exports/r1.csv")
    assert obj["Body"].read() == b"id,total"


class _DenyingS3:
    def put_object(self, **kwargs):
        raise ClientError({"Error": {"Code": "AccessDenied", "Message": "denied"}}, "PutObject")


def test_export_returns_503_when_s3_denies(client):
    # Nhánh lỗi thường bị bỏ sót, nên có test riêng cho nó.
    app.dependency_overrides[get_s3_client] = lambda: _DenyingS3()

    resp = client.post("/reports/export", params={"report_id": "r2"})

    assert resp.status_code == 503


# --- pytest.ini ---
# [pytest]
# addopts = --disable-socket`,
codeNote: '<p>Đoạn này gom bốn quyết định. Client được tạo trong một factory có cache, nên không bị khoá ở cấp module và vẫn chỉ có một client mỗi process. Route nhận client qua Depends, và test thay nó bằng override trên đúng hàm get_s3_client.</p><p>Credential giả và pytest-socket là hai chốt cuối. Chúng không thay thế override. Chúng chỉ bảo đảm rằng nếu override bị sai thì lỗi xảy ra ngay, không chạm AWS thật. Nhánh ClientError có test riêng vì đây là chỗ hay bị bỏ sót.</p><p>Chỗ dễ sập là key của override. Nếu route import một tên khác hoặc một wrapper khác, bảng override vẫn có khoá nhưng không bao giờ được tra cứu, và test lại gọi mạng mà không có cảnh báo.</p>',
flow: 'flow-db-transaction',
sayIt: ['Em test endpoint AWS bằng cách đưa boto3 client vào qua Depends rồi override trong test, vì client tạo ở cấp module thì patch sau đó không đổi được nó.', 'Khoá của dependency_overrides là chính object hàm get_s3_client, nên override phải dùng đúng hàm mà route import, và phải dọn bảng sau mỗi test.', 'Moto giả lập S3 trong bộ nhớ, nên luồng nhiều bước vẫn chạy đường đi boto3 thật mà không ra mạng.', 'Em đặt thêm ba chốt: credential giả qua biến môi trường, pytest-socket chặn socket, và kiểm tra CloudTrail theo role CI nếu nghi có lọt.', 'Nhánh ClientError phải có test riêng, vì route đổi lỗi AWS thành 503 có chủ đích, và đó là chỗ người ta hay quên kiểm tra.'],
qids: ['G13', 'F07', 'F10'],
refs: ['aws-cloudwatch', 'pg-transactions', 'pg-mvcc', 'aws-sqs-dlq', 'aws-rds']}
);
