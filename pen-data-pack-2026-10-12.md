# Gói dữ liệu thật cho agent Pencil (sinh từ src/*.js ngày 2026-10-12, bằng script, không sửa tay)

Chỉ copy chữ từ file này. Không viết lại, không rút gọn ý, không tự đặt tên tài liệu. Câu dài được phép cắt bằng "…" ở cuối dòng thu gọn, không được sửa chữ.

## Số liệu toàn site
- 23 bài · 5 chặng · 147 câu · 71 câu P0 · Quiz 28 câu · Phỏng vấn thử 6 bộ
- Số câu theo nhóm: A 18 · B 14 · C 15 · D 14 · E 12 · F 12 · G 29 · H 13 · I 8 · J 12 (tổng 147)
- Thẻ đến hạn hôm nay (ngày đầu): **71** · dòng phụ "bộ P0 · 71 câu · 5 hộp" · Câu P0 đã nói thành tiếng "0 / 71"

## Tên 10 nhóm (GROUP_INTROS) và số câu
- A Python sâu: data model, GIL và asyncio (18)
- B JavaScript, event loop và TypeScript (14)
- C VueJS: reactivity, component và state (15)
- D Web nền tảng: HTTP, cache và bảo mật (14)
- E Python web: FastAPI và Django/DRF (12)
- F PostgreSQL: index, transaction và MVCC (12)
- G AWS: Lambda, S3, SQS, RDS và DynamoDB (29)
- H Container, CI/CD và vận hành (13)
- I System design và kiến trúc ứng dụng web (8)
- J Hành vi và giao tiếp trong công việc thực tế (12)

## Sơ đồ L01 thật (diagrams-v2/diagrams/flow-request-lifecycle.svg, viewBox 640×248)
5 nút trái sang phải: 1 Trình duyệt "gọi API" → 2 CloudFront "TLS, cache" → 3 API Gateway "xác thực JWT" → 4 ECS Fargate "FastAPI" → 5 RDS "PostgreSQL" → mũi tên về "response 200". Vẽ đúng 5 nút này. Không vẽ Lambda/DynamoDB trong sơ đồ.

## L01 (Chặng 1 — AWS nền tảng)
- Tiêu đề: Đọc một kiến trúc serverless từ trái sang phải
- Goal: Sau bài này bạn phải nói được ranh giới trách nhiệm chung nằm ở đâu, region (vùng địa lý độc lập chứa nhiều trung tâm dữ liệu) và Availability Zone (một hoặc nhiều trung tâm dữ liệu tách biệt điện, mạng trong cùng Region) khác nhau thế nào, và một request đi qua gateway (cổng vào HTTP do AWS quản lý), hàm, cơ sở dữ liệu theo thứ tự nào.
- askFirst:
  1. Trong chuỗi trình duyệt, cổng vào, hàm, cơ sở dữ liệu, hàng đợi, tầng nào có thể xếp hàng mà không để lại dấu vết overload (quá tải) trên dashboard của chính nó?
  2. Phần nào của chuỗi đó do AWS chịu trách nhiệm, phần nào là của bạn, và ranh giới đó nằm ở thao tác nào cụ thể?
  3. Nếu bạn nhân bản gấp đôi tầng tính toán, điều gì có thể tệ hơn chứ không phải tốt hơn?
- Dự đoán (predict.q): Giả sử bạn tăng gấp mười số instance chạy song song của service trung tâm trong cùng một Region. Theo bạn, tổng số kết nối tới cơ sở dữ liệu sau đó tăng hay giảm, và p99 của request đi theo chiều nào?
- Đáp án dự đoán (ẩn): Tăng. Mỗi môi trường thực thi mở kết nối riêng, nên nhân bản mười lần nghĩa là khoảng mười lần số kết nối đồng thời, trong khi trần kết nối của cơ sở dữ liệu không thay đổi theo. Kết quả p99 đi lên chứ không xuống: các request không chết vì hàm chậm, mà chết vì chờ được cấp một suất kết nối. Nhân bản tầng tính toán mà không nhìn tầng dưới là cách nhanh nhất để làm hệ thống tệ hơn ngay chính lúc bạn nghĩ mình đang sửa nó.
- **Thuật ngữ cần biết (7 mục, đầu pha 2):**
- **Cloud**: thuê hạ tầng máy chủ, mạng, lưu trữ của nhà cung cấp theo nhu cầu, thay vì tự mua và đặt máy trong công ty.
- **Region**: vùng địa lý độc lập, ví dụ Singapore, chứa vài Availability Zone bên trong.
- **Availability Zone (AZ)**: một hoặc nhiều trung tâm dữ liệu độc lập về điện và mạng, nằm trong một Region.
- **Managed service**: dịch vụ mà AWS vận hành hộ phần máy chủ, vá lỗi và sao lưu hạ tầng, giống Postgres do người khác cài và vá cho bạn; bạn chỉ cấu hình và dùng.
- **Serverless**: mô hình AWS lo máy chủ và tự co giãn, bạn trả theo mức dùng (ví dụ Lambda, API Gateway, DynamoDB).
- **Shared responsibility model**: mô hình trách nhiệm chung, AWS lo hạ tầng bên dưới, bạn lo dữ liệu, cấu hình, phân quyền bên trên.
- **p99**: mốc độ trễ mà 99 trên 100 request nhanh hơn hoặc bằng; 1% request chậm hơn mốc này là phần đuôi.
- Khái niệm (concept), câu 1-2: Bây giờ mới gọi tên. Thứ mà bạn cần trước khi đụng vào bất kỳ tham số nào là chuỗi request : một thứ tự cố định của các bước — trình duyệt gọi cổng vào, cổng vào khớp và kiểm tra rồi gọi hàm, hàm chạm dữ liệu rồi đẩy việc nặng sang hàng đợi, response quay ngược lại.
- Cơ chế (mechanism):
Request trong hệ thống này đi qua chuỗi cố định:
- Trình duyệt gửi tới cổng vào (API Gateway): khớp route, xử lý CORS, xác thực token, áp giới hạn tốc độ.
- Cổng vào gọi hàm (Lambda) với execution role; hàm đọc event, ghi vào cơ sở dữ liệu (DynamoDB/RDS), đẩy việc nặng sang hàng đợi (SQS) rồi trả response.
- Response quay ngược theo đúng chuỗi đó; mỗi khớp là một ranh giới tin cậy khác nhau — token do client giữ, quyền gọi do resource policy của cổng vào quyết định, quyền bên trong do execution role quyết định. Đọc đúng nghĩa là đi theo chuỗi đó và hỏi ở mỗi khớp: ai kiểm soát dữ liệu, ai giữ bí mật, hỏng thì hỏng ở đâu, và ranh giới trách nhiệm nằm giữa hai phía nào của khớp đó.
- Sơ đồ: khung 16:9 ghi "flow-request-lifecycle" (file thật: D:/research/diagrams-v2/diagrams/flow-request-lifecycle.svg, có bản .mobile.svg)
- Timeline:
  - H+0: Vụ sale cuối năm bắt đầu; lưu lượng tăng theo cam kết, 200 request/giây vào endpoint đăng ký
  - H+4p: p99 tăng từ 180 ms lên 4,2 giây; ba lần thử tải ghi nhận request bị treo rồi trả 504
  - H+6p: Đội chạy lại sơ đồ; thấy mọi hộp đều "chạy", không hộp nào báo quá tải
  - H+20p: Phát hiện: một số request không chết vì tính toán, mà chết vì chờ được cấp một suất kết nối tới tầng dữ liệu
  - H+30p: Chốt lại: nhân bản tầng tính toán phải đi kèm mở trần tầng dưới, không phải chạy đơn lẻ
- Cách sửa ngây thơ, code block tối (naiveCode, nguyên văn):
```
# Script "chay sua" dang duoc su dung moi lan p99 tang:
# tang gop doi cap do co gian cua service trung tam.
# Co so dua tren dashboard: moi dung thu trong service deu "xanh".

# truoc: max_instances = 2
# sau:   max_instances = 10

# Ket qua mong doi: p99 gia di.
# Ket qua that: p99 tang them vi cap duoi bi an
```
- Output (naiveOut): Sau khi nâng số instance lên 10, p99 tăng thêm 30% trong vòng năm phút, không giảm. Log của tầng dưới cho thấy hàng chờ cấp kết nối tăng vọt và xuất hiện lỗi cấp phát kết nối; các request bị treo đúng tại thời điểm chờ được cấp một suất, không phải tại thời điểm tính toán. Dashboard của tầng tính toán vẫn toàn xanh vì mỗi instance đơn lẻ không quá tải — chúng chỉ không được giao thêm kết nối mới.
- Nguyên nhân gốc (rootCause, nguyên văn từ src/35-lessons-aws.js:34):
Nguồn gốc nằm ở cách đọc sơ đồ: hệ thống bị đọc như một danh sách các hộp độc lập, nên mỗi hộp được tối ưu riêng biệt, và các khớp nối giữa hộp — nơi request thực sự bị xếp hàng, nơi ranh giới tin cậy thay đổi — không ai sở hữu. Hai hiện tượng trông giống nhau trên dashboard mà nguyên nhân khác nhau:
  - Request chờ được cấp suất tới tầng dùng chung (tầng dùng chung là tầng dữ liệu mà nhiều instance cùng xin kết nối; chờ được cấp suất nghĩa là xếp hàng đợi tới lượt dùng): tầng dưới bị nghẽn, log tầng dưới báo hàng chờ cấp kết nối tăng.
  - Request bị chặn ở lớp ranh giới vì vượt trần giới hạn (lớp ranh giới là cổng vào áp giới hạn tốc độ; trần giới hạn là hạn mức mà dịch vụ chỉ phục vụ tới đó): bạn đang vượt hợp đồng của mình với dịch vụ đó (hợp đồng là hạn mức đã cam kết với dịch vụ), log cổng vào đếm mã 429 tăng.Cả hai đều cho ra p99 (p99 là ngưỡng độ trễ mà 99 trên 100 request nhanh hơn nó, chỉ 1 request chậm hơn) cao và một phần request lỗi. Chẩn đoán sai hiện tượng sẽ sửa sai chỗ.
- Lỗi thường gặp (failureModes, nguyên văn từ src/35-lessons-aws.js:37):
Việc đọc sai chuỗi tạo ra bốn kiểu hỏng mới:
  - Nhân bản tầng tính toán đơn lẻ. Làm tầng dưới bị nghẽn nhanh hơn như đã thấy ở phần cách sửa ngây thơ, vì trần kết nối không theo kịp.
  - Gộp ranh giới trách nhiệm. Tin rằng thuê hạ tầng đám mây nghĩa là bên vận hành lo luôn việc sao lưu và mã hóa dữ liệu, nên một lần xoá nhầm có thể không khôi phục được.
  - Đa Zone cho compute, để dữ liệu nằm chết một Zone. Trông như có dự phòng nhưng mất Zone nào vẫn chết vì tài nguyên có trạng thái không được nhân bản.
  - Cho rằng Region tự failover. Cơ chế failover giữa hai Region gần như luôn phải tự dựng, và chi phí cho việc đó không nằm trong bảng giá mặc định.
- say30 (bản mẫu 30 giây, che mờ): Tôi đọc kiến trúc serverless (kiểu chạy không cần quản lý server) bằng cách đi theo chuỗi request: trình duyệt gọi cổng vào, cổng vào khớp route (đường dẫn đã khai báo), xác thực rồi gọi hàm, hàm chạm dữ liệu rồi đẩy việc nặng sang hàng đợi, response quay ngược lại đúng đường. Mỗi khớp là một ranh giới tin cậy khác nhau, nên khi p99 (mốc độ trễ mà 99% request nhanh hơn hoặc bằng) tăng tôi nhìn độ trễ của từng tầng trong chuỗi, không nhìn p99 tổng, vì p99 tổng tăng mà mọi tầng "xanh" thường nghĩa là tầng dưới bị nghẽn hoặc request bị chặn ở lớp trần, chứ không phải tầng tính toán chậm.
- sayIt (5 câu):
  1. AWS chịu trách nhiệm bảo mật hạ tầng vật lý và lớp ảo hóa (phần mềm chia một máy vật lý thành nhiều máy ảo); tôi chịu trách nhiệm dữ liệu, cấu hình, phân quyền, mã hóa và sao lưu. Ranh giới nằm ở chỗ tôi bấm tạo tài nguyên.
  2. Region là vùng địa lý độc lập gồm nhiều Availability Zone (một hoặc nhiều trung tâm dữ liệu độc lập về điện và mạng, viết tắt AZ); dữ liệu không rời đi Region cho tới khi tôi chủ động sao chép sang nơi khác.
  3. Cùng một Region, các AZ nằm sau hạ tầng mạng độ trễ thấp nên nhiều dịch vụ có thể nhân bản đồng bộ qua AZ, nhưng mức đồng bộ và chi phí truyền dữ liệu qua AZ là tuỳ từng dịch vụ nên tôi kiểm tra theo dịch vụ chứ không giả định; nhân bản qua Region thì bất đồng bộ và thành bài toán của tôi.
  4. Đa Zone dùng để chịu sự cố hạ tầng, đa Region dùng để chịu thảm họa cấp vùng hoặc đáp ứng quy định dữ liệu, và tôi phải trả tiền cho sự khác biệt đó.
  5. Tôi đọc sơ đồ AWS bằng cách đi theo chuỗi request và hỏi ở mỗi bước ai kiểm soát dữ liệu, ai giữ bí mật, chết thì chết ở đâu.
- Câu hỏi CTO (attacks):
  1. Bạn nói nhân bản tầng tính toán làm tầng dưới tệ hơn. Vậy khi nào nhân bản tầng trên là đúng và khi nào là sai?
     Đáp án: Đúng khi tầng dưới có trần dư thừa và p99 của tầng dưới còn thấp; sai khi p99 tầng dưới đã cao hoặc số kết nối đang dùng gần trần của tầng dưới, vì lúc đó nhân bản tầng trên chỉ đẩy lượng request tới một tầng đang nghẽn, và p99 tổng tăng thêm. Cách kiểm tra là nhìn metric độ trễ của tầng dưới trước khi nhân bản, không phải chỉ nhìn p99 tổng.
  2. Ranh giới trách nhiệm chung nằm ở đâu chính xác, và vì sao phần lớn sự cố bảo mật bắt nguồn từ chỗ vượt qua nó?
     Đáp án: Ranh giới nằm ở thao tác bạn bấm tạo một tài nguyên: phía dưới là phần do bên vận hành hạ tầng chịu trách nhiệm, phía trên là mọi thứ do bạn chịu trách nhiệm. Sự cố bảo mật xảy ra khi bạn giả định phần "phía dưới" lo luôn cho bạn phần "phía trên" — ví dụ tin rằng dữ liệu được sao lưu và mã hóa tự động mà không cấu hình, rồi để một bucket lưu dữ liệu công khai vì quên bước cấu hình quyền truy cập.
  3. Một Zone mất điện, bạn có một instance ở mỗi hai Zone trong cùng Region. Hệ thống sống hay chết?
     Đáp án: Tùy loại tài nguyên. Instance tính toán ở Zone mất điện thì chết, instance ở Zone kia vẫn chạy, nên lớp tính toán sống nếu có cơ chế cân bằng tải chuyển request. Nhưng nếu tài nguyên có trạng thái, ví dụ cơ sở dữ liệu chính, nằm chết ở đúng Zone bị mất điện thì toàn bộ hệ thống chết vì các instance tính toán còn sống không có nơi ghi dữ liệu. Vì vậy "hai Zone" chỉ là câu chuyện về tính toán, còn "hai hay nhiều Zone cho dữ liệu" là câu chuyện riêng.
  4. Vì sao đặt một lớp cache ở biên trước mỗi Region thay vì nhân bản cả stack sang nhiều Region?
     Đáp án: Vì chi phí nhân bản cả stack (data, compute, queue, monitor) sang nhiều Region rất cao và đòi giải quyết xung đột ghi khi hai Region cùng sửa một dữ liệu. Đặt cache ở biên trước mỗi Region chỉ nhân bản dữ liệu tĩnh hoặc ít đổi, trả độ trễ thấp cho người dùng ở nhiều nơi mà không phải trả chi phí đồng bộ dữ liệu hai chiều, và không phải lo xung đột ghi. Lựa chọn đúng phụ thuộc vào phần nào trong ứng dụng bạn chấp nhận được độ trễ đọc cao hơn.
- Đánh đổi (tradeoff), câu 1: Chi trả cho việc đọc đúng: một buổi thời gian để vẽ lại chuỗi request và mỗi ranh giới tin cậy, thay vì phản xạ tăng instance (một máy chủ ảo đang chạy ứng dụng) ngay khi thấy p99 (mốc độ trễ mà 99% request nhanh hơn hoặc bằng) tăng.
- Phương án khác (alternatives), câu 1: Nếu traffic thực sự là dòng ổn định và không có đỉnh, một cụm máy chạy dài hạn với pool kết nối cố định thường rẻ hơn và dễ dự đoán hơn chuỗi serverless, vì bạn không phải trả tiền theo mỗi lần gọi và không phải lo trần kết nối bị ăn theo số instance.
- Quan sát được gì (observe), 4 nhóm: Công cụ theo dõi CloudWatch · Log của cổng vào · Log của tầng dưới · Log truy vết CloudTrail
- Câu neo (anchor): Nhân bản tầng trên mà không mở trần tầng dưới làm p99 tăng thêm, không phải giảm; đọc chuỗi request là cách duy nhất biết mình đang sửa đúng chỗ.
- Câu hỏi liên quan: G01 · G12 · G05
- Tài liệu đọc (refs → SOURCES, đúng 3 mục): Amazon VPC (docs.aws.amazon.com) · AWS Lambda — Best practices (docs.aws.amazon.com) · AWS CloudFormation (docs.aws.amazon.com)

## L07 (Chặng 2 — Python gắn vào AWS) — màn điện thoại
- Tiêu đề: Vòng đời một request trong FastAPI: từ khoá def quyết định số phận event loop
- Goal: Sau bài này bạn phải nói được thứ tự middleware, routing, dependency, handler, response model; và vì sao đổi def thành async def mà giữ nguyên thân hàm lại biến một endpoint 20 ms thành một endpoint 200 ms.
- askFirst:
  1. Vì sao CPU và RDS đều rảnh mà độ trễ lại tăng gấp sáu mươi lần?
  2. Vì sao chỉ một endpoint đổi cách viết mà mọi endpoint khác trong cùng tiến trình cũng chậm?
  3. Nếu bạn thêm bốn tiến trình worker nữa cho dịch vụ này, điều gì tăng và điều gì có thể vỡ tiếp?
- Dự đoán: Ba endpoint cùng làm một việc: ngủ 0,2 giây rồi trả lời. Endpoint A viết def và gọi time.sleep. Endpoint B viết async def và gọi time.sleep. Endpoint C viết async def và await asyncio.sleep. Một tiến trình uvicorn, mỗi endpoint nhận 200 request đồng thời. Endpoint nào xong trước, và B mất bao lâu?
- Câu neo: Một lệnh chặn trong async def khoá cả event loop, không chỉ request đang chạy.
- Tài liệu đọc: FastAPI Tutorial (fastapi.tiangolo.com) · asyncio — High-Level Coroutines and Tasks (docs.python.org)
- Câu hỏi liên quan: E01 · E02 · E08
- Thuật ngữ cần biết: **chưa có trong src/** (đang được bổ sung). Màn L07 vẽ khối này ở trạng thái thu gọn, chỉ có hàng tiêu đề "Thuật ngữ cần biết" + mũi tên mở. Không tự viết mục nào.

## Câu hỏi mẫu cho màn Ôn câu hỏi
### G01 · P0 · L1 · Region và Availability Zone, mô hình trách nhiệm chung
- Câu hỏi: Hãy phân biệt Region với Availability Zone và cho biết phía khách hàng chịu trách nhiệm gì trong mô hình trách nhiệm chung?
- Trả lời miệng (oral), 2 câu đầu: Region là một khu vực địa lý độc lập gồm nhiều Availability Zone, còn mỗi Availability Zone là một trung tâm dữ liệu hoặc cụm trung tâm dữ liệu có nguồn điện và mạng riêng. Bạn chọn Region gần người dùng để giảm độ trễ và đáp ứng yêu cầu lưu trữ dữ liệu trong lãnh thổ nhất định, rồi triển khai dự phòng qua nhiều Zone để một sự cố cháy nổ hay mất điện không đánh sập toàn bộ hệ thống.
- Followups: (1) Vì sao triển khai ở hai Zone trong cùng Region rẻ và đơn giản hơn hai Region? (2) Khách hàng chịu trách nhiệm cụ thể những gì trong mô hình trách nhiệm chung? (3) Khi nào bạn chấp nhận chạy single Zone dù biết rủi ro?
- Thuật ngữ cần biết (đầu deep):
- **Region**: vùng địa lý lớn và độc lập của AWS, ví dụ Singapore, gồm nhiều AZ; giống một tỉnh có nhiều toà nhà tách biệt.
- **Availability Zone (AZ)**: một hoặc nhiều trung tâm dữ liệu độc lập về điện và mạng trong một Region; giống hai phòng máy đặt ở hai toà nhà khác nhau.
- **Mô hình trách nhiệm chung (shared responsibility model)**: AWS lo hạ tầng vật lý, bạn lo dữ liệu, quyền truy cập và cấu hình; giống Docker, nền tảng lo host còn bạn lo image và biến môi trường.
- **Điểm hỏng duy nhất (single point of failure)**: thành phần mà nếu hỏng thì cả hệ thống sập; hai máy cùng một AZ là một điểm như vậy.
- **Đa AZ (multi-AZ)**: đặt tài nguyên ở ít nhất hai AZ để một AZ sập thì bản còn lại vẫn phục vụ.
- refs: Amazon VPC (docs.aws.amazon.com) · AWS CloudFormation (docs.aws.amazon.com)

### G27 · P0 · L2 · SNS, SQS, EventBridge: fan-out và chọn dịch vụ khi đơn hàng tạo xong
- Câu hỏi: Đơn hàng vừa tạo xong cần gửi mail, cập nhật kho và ghi analytics. Bạn dùng SNS, SQS hay EventBridge, và vì sao chọn cách đó thay vì cách còn lại?
- Trả lời miệng (oral), 2 câu đầu: Ba dịch vụ này đều giúp các phần của hệ thống trao đổi tin mà không cần gọi trực tiếp nhau, nhưng mỗi cái làm một việc khác. Amazon SNS (dịch vụ thông báo kiểu push: bạn gửi một tin vào một topic, tức kênh phát tin, rồi SNS đẩy bản sao tới mọi bên đã đăng ký) là kiểu đẩy.
- Followups: (1) Khi nào SNS fan-out là đủ, và khi nào phải thêm EventBridge vào kiến trúc? (2) Nếu analytics chậm và queue của nó đầy, ảnh hưởng gì tới email và cập nhật kho? (3) Làm sao đảm bảo kho chỉ bị trừ một lần khi SQS giao trùng message OrderCreated?
- Thuật ngữ cần biết (đầu deep):
- **SNS (Amazon Simple Notification Service)**: dịch vụ thông báo kiểu push, bạn gửi một tin vào topic và SNS đẩy bản sao tới mọi bên đăng ký. Ví dụ đời thường: loa phát thanh của tòa nhà, nói một lần là mọi phòng nghe.
- **SQS (Amazon Simple Queue Service)**: hàng đợi tin nhắn, tin nằm chờ tới khi một bên kéo về xử lý xong rồi xóa. Ví dụ đời thường: quầy làm thủ tục, khách xếp hàng và nhân viên gọi từng người.
- **EventBridge (Amazon EventBridge)**: bus sự kiện, trung tâm nhận sự kiện rồi gửi tới đích theo quy tắc (rule) khớp mẫu sự kiện. Ví dụ đời thường: bưu điện phân loại thư theo địa chỉ và loại thư.
- **Fan-out**: một tin gửi đi, nhiều nơi nhận, mỗi nơi nhận một bản sao. Ví dụ đời thường: thông báo họp gửi vào nhóm chat, mọi thành viên đều thấy.
- **DLQ (dead-letter queue, hàng đợi thư chết)**: nơi chứa tin đã thử lại nhiều lần vẫn lỗi, để người xem sau. Ví dụ đời thường: hộp thư "không giao được" của bưu điện.
- **Idempotent (tính lặp an toàn)**: xử lý cùng một yêu cầu nhiều lần vẫn cho kết quả như chỉ làm một lần. Ví dụ đời thường: bấm thanh toán hai lần nhưng chỉ bị trừ tiền một lần.
- refs: Amazon SNS (docs.aws.amazon.com) · Amazon EventBridge (docs.aws.amazon.com) · Amazon SQS — Visibility timeout (docs.aws.amazon.com) · Amazon SQS — Dead-letter queues (docs.aws.amazon.com)

## Tự chấm 3 nút (selfcheck, sinh từ src/16-q-g.js; bản Vue dùng làm nhãn 3 nút chấm, DrillCard.vue:38-40)
### G01
1. Tôi vẫn chưa giải thích được lưu lượng chuyển giữa các Zone khi một Zone sập theo cơ chế định tuyến nào
2. Tôi có thể giải thích bằng ví dụ web chạy hai Zone ở Singapore và một Zone mất điện thì Zone còn lại gánh tải
3. Tôi có thể chọn Region và thiết kế dự phòng đa Zone cho một web production nhỏ có yêu cầu lưu dữ liệu trong khu vực
### G27
1. Tôi vẫn chưa giải thích được vì sao SNS có thể thử lại tới SQS hàng chục nghìn lần mà vẫn cần một queue riêng cho từng bên
2. Tôi có thể giải thích bằng ví dụ queue analytics tồn đọng nhưng email và kho vẫn được xử lý vì mỗi bên có queue riêng
3. Tôi có thể viết đoạn gửi (publish) sự kiện OrderCreated kèm MessageAttributes và filter policy cho queue kho trong một buổi làm việc

## Quiz mẫu: QZ19 (nhóm G)
- Câu: Lambda của bạn cần đọc một bucket S3 nhưng deploy xong báo AccessDenied. Bạn kiểm tra và sửa thế nào?
  A. Gắn chính sách IAM (lớp phân quyền của AWS) cho execution role (danh tính mà hàm mượn để biết nó được chạm tài nguyên nào) của Lambda cho phép s3:GetObject và s3:ListBucket trên ARN bucket, không sửa bucket policy
  B. Thêm quyền cho IAM user cá nhân của người deploy, vì Lambda không có execution role riêng mà mượn credential của người gọi nên chỉ cần cấp quyền cho user đó
  C. Sửa bucket policy và bật public-read (mở cho mọi principal đều đọc được) cho bucket, cách này nhanh và ít cấu hình nhất
  D. Tắt block public access rồi cấp quyền đọc cho role của mọi tài khoản trong tổ chức để không phải cấu hình từng hàm
- Đáp án đúng: A · Giải thích: Khi Lambda tự gọi dịch vụ AWS, quyền đến từ execution role gắn vào chính Lambda, không phải principal gọi vào Lambda. Nên chỉ cần policy allow đúng action trên ARN bucket trong role, giữ bucket private; mở public hay dùng user cá nhân là lỗ hổng không cần thiết.

## Quiz mẫu 2: QZ01 (nhóm A) — dùng làm câu sai ví dụ ở màn tổng kết
- Câu: Vì sao hàm Python có tham số kiểu list làm mặc định thì các lần gọi lại ghi vào cùng một danh sách, và bạn sửa thế nào?
  A. Vì list mặc định được dựng đúng một lần khi module được nạp và giữ nguyên suốt vòng đời tiến trình, nên chỉ cần nạp lại module trước mỗi request là mặc định được tạo mới hoàn toàn
  B. Vì Python đánh giá tham số mặc định đúng một lần lúc định nghĩa hàm nên tất cả lần gọi dùng chung một object, sửa bằng None rồi tạo list mới trong thân hàm
  C. Vì Python truyền list theo tham chiếu nên hàm giữ luôn list của lần gọi đầu tiên, sửa bằng cách deepcopy tham số ở đầu thân hàm
  D. Vì list rỗng là một singleton dùng chung trong toàn bộ interpreter, sửa bằng cách khởi tạo bằng list() thay vì bằng ngoặc vuông
- Đáp án đúng: B

## Ngày học (STUDY_PLANS)
### Gói 6 giờ — dồn lực vào P0 của AWS, Vue và Python (5 khối)
1. Làm gì: AWS P0: Lambda, API Gateway, S3, IAM, RDS/DynamoDB — phần bạn yếu nhất, phải trả lời được không cần mở tài liệu.
   Câu nào: [{"group":"G","prio":"P0","limit":8}]
   Làm thế nào: 80 phút, 10 câu P0 nhóm G, mỗi câu 6 phút: đọc q, trả lời miệng 60 giây không nhìn `oral`, mới mở `oral` để đối chiếu, câu nào sai hoặc nói ấp úng thì đánh đỏ. 10 phút cuối: chép lại 3 dòng cốt lõi (cold start + memory, presigned URL hết hạn, least privilege) vào một mảnh giấy, đó là phần bạn sẽ nói sai nhiều nhất dưới áp lực.
2. Làm gì: Vue P0: reactivity (ref/reactive/computed), props và emits một chiều, v-model, key ổn định trong v-for, cấu trúc SFC.
   Câu nào: [{"group":"C","prio":"P0","limit":7}]
3. Làm gì: Python P0: data model, closure, GIL và threading, async/await, typing, quy ước exception — nền để mọi câu hỏi kỹ thuật khác đứng vững.
   Câu nào: [{"group":"A","limit":7}]
4. Làm gì: FastAPI và Django P0: vòng đời request, Pydantic v2, async def trong DB driver, dependency injection cho auth, N+1.
   Câu nào: [{"group":"E","prio":"P0","limit":5}]
5. Làm gì: Postgres và kiểm thử P0: index, EXPLAIN, transaction, isolation, N+1, pytest.
   Câu nào: [{"group":"F","prio":"P0","limit":4},{"group":"F","prio":"P1","limit":4}]

### Gói 2 ngày — ngày 1 nền tảng, ngày 2 AWS, ops và một bộ mock (7 khối)
1. Làm gì: Nền Python và JavaScript: data model Python, closure, event loop, Promise, `this`, CORS, HTTP.
   Câu nào: [{"group":"A","limit":6},{"group":"B","limit":4}]
   Làm thế nào: 90 phút buổi sáng ngày 1: 6 câu nhóm A, 4 câu nhóm B. Luân phiên 10 phút đọc q — 4 phút tự trả lời — 3 phút đọc `deep` — 3 phút nói lại bằng ví dụ riêng. 15 phút cuối dùng cho câu `predict` và `debug`, phần này sai nhiều nhất vì dễ đoán theo thói quen.
2. Làm gì: Vue toàn diện: reactivity, component, vòng đời, composable, Pinia, router, form và hiệu năng.
   Câu nào: [{"group":"C","prio":"P0","limit":6},{"group":"C","prio":"P1","limit":4},{"group":"C","level":"L3","limit":2}]
3. Làm gì: Web và bảo mật: HTTP, cookie, CSP, OWASP API security, rate limit, xác thực.
   Câu nào: [{"group":"D","limit":7}]
4. Làm gì: FastAPI và Django: DI, auth, transaction, background task, test, so sánh serializer với Pydantic.
   Câu nào: [{"group":"E","prio":"P0","limit":6},{"group":"E","prio":"P1","limit":3}]
5. Làm gì: Postgres: index, EXPLAIN, MVCC, transaction, constraint, upsert, pagination.
   Câu nào: [{"group":"F","prio":"P0","limit":4},{"group":"F","level":"L3","limit":3}]
6. Làm gì: AWS ngày 2 buổi sáng: serverless (Lambda, API Gateway, S3, presigned URL), hạ tầng bền (RDS, DynamoDB, SQS, DLQ, VPC), quan sát và chi phí.
   Câu nào: [{"group":"G","prio":"P0","limit":6},{"group":"G","level":"L3","limit":3},{"group":"H","prio":"P0","limit":2},{"group":"H","level":"L3","limit":2}]
7. Làm gì: Ops và mock buổi chiều ngày 2: Docker multi-stage, image nhỏ, GitHub Actions, systemd, signal; rồi một bộ mock có bấm giờ.
   Câu nào: [{"group":"I","limit":5},{"group":"J","limit":4}]

### Gói 3 ngày — hết nền tảng, đào sâu AWS và Vue, rồi full mock (8 khối)
1. Làm gì: Python và JS nền: data model, closure, event loop, GIL, async, `this`, CORS, HTTP.
   Câu nào: [{"group":"A","limit":5},{"group":"B","limit":3}]
   Làm thế nào: 60 phút buổi sáng ngày 1: 5 câu P0 nhóm A và 3 câu nhóm B. Quy tắc tối giản: chỉ mở `oral` sau khi đã nói hết 60 giây tự trả lời, nói liền một mạch như trong phỏng vấn thật.
2. Làm gì: Vue lần 1: những gì bạn dùng hằng ngày — ref, reactive, computed, watch, props/emits, v-model, key.
   Câu nào: [{"group":"C","prio":"P0","limit":7}]
3. Làm gì: Web, SQL, FastAPI: HTTP và bảo mật, index và transaction, DI, auth, N+1, test.
   Câu nào: [{"group":"D","limit":4},{"group":"F","prio":"P0","limit":4},{"group":"E","prio":"P0","limit":4}]
4. Làm gì: Vue lần 2 đào sâu: watch cleanup với race condition, guard, composable, Pinia, form và accessibility, câu L3.
   Câu nào: [{"group":"C","prio":"P1","limit":4},{"group":"C","level":"L3","limit":2}]
5. Làm gì: AWS serverless và dữ liệu: Lambda, API Gateway, S3 và presigned URL, RDS, DynamoDB, IAM.
   Câu nào: [{"group":"G","prio":"P0","limit":6},{"group":"G","level":"L3","limit":2}]
6. Làm gì: AWS vận hành và quan sát: SQS và DLQ, VPC, CloudWatch, Secrets, CloudFront, ECS, IaC, chi phí.
   Câu nào: [{"group":"H","prio":"P0","limit":3},{"group":"H","level":"L3","limit":3},{"group":"I","level":"L3","limit":2}]
7. Làm gì: Mock toàn bộ: một bộ mock có bấm giờ, không tra cứu, mô phỏng đúng nhịp phỏng vấn.
   Câu nào: [{"group":"G","limit":4},{"group":"C","limit":4},{"group":"A","limit":3},{"group":"E","limit":3}]
8. Làm gì: Rà yếu và chốt: quay lại đúng những câu đã bỏ trong mock, đào sâu nhóm bạn yếu nhất, tập trả lời theo nguyên nhân gốc.
   Câu nào: [{"group":"G","prio":"P0","limit":3},{"group":"C","prio":"P0","limit":3},{"group":"H","level":"L3","limit":2},{"level":"L3","limit":3}]

## Phỏng vấn thử (MOCK_SETS, 6 bộ)
1. Cơn lưu luyện P0 đêm trước phỏng vấn · số câu tối đa 25
   Chỉ những câu P0, ưu tiên tầng cơ chế sâu, để bạn quét lại đúng những gì nhà tuyển dụng chắc chắn hỏi trong một buổi ngắn trước ngày phỏng vấn.
2. Bù khoảng trống AWS · số câu tối đa 28
   Dồn nhóm G (AWS) và nhóm H (vận hành, triển khai) vào một lượt, vì đây là hai mảng yếu rõ nhất so với JD Fullstack Engineer AWS.
3. Bù khoảng trống VueJS · số câu tối đa 28
   Nhóm C (VueJS) là trọng tâm, nhóm B (JavaScript, TypeScript) là nền để bạn đủ tự tin về reactivity, lifecycle và typing.
4. Nền tảng Python và SQL · số câu tối đa 27
   Nhóm A cùng nhóm E và F để bạn giữ chắc Python cốt lõi và SQL thực chiến, phần vốn mạnh không được hở khi đến phần hỏi về dữ liệu.
5. API, web và bảo mật · số câu tối đa 22
   Nhóm D (HTTP, CORS, cookie, CSP) gặp nhóm H (secret, CloudWatch (công cụ theo dõi metric/log của AWS), chi phí) ở các câu hỏi về presigned URL (địa chỉ ký sẵn cho phép đúng một hành động trên đúng một tệp trong thời gian ngắn), token và lỗ hổng khi nói chuyện về sản phẩm thật.
6. Full mock 30 câu, giống phòng phỏng vấn thật · số câu tối đa 31
   Trộn P0 và P1 với các nhóm I và J để bạn quen nhịp trả lời dưới áp lực thời gian, đúng thứ tự và độ khó của một buổi phỏng vấn thực tế.
