# L10: Nối log của cùng một đơn qua API, Lambda và SQS

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ mở bằng "Bước 1. Đoán trước" với bốn id (`requestId`, `aws_request_id`, `messageId`, `correlation_id`) trước khi giải thích mỗi id do **tầng nào** sinh và tồn tại trong phạm vi nào.
- **Thuật ngữ chưa giải thích:** `correlation ID`, `ContextVar`, `MessageAttributes`, `distributed tracing`, `span`, `invocation`, `container warm` xuất hiện lần đầu không kèm tiếng Việt trong ngoặc.
- **Thiếu ví von / ví dụ trực diện:** bản cũ không có sơ đồ chữ cho việc id đi qua ba ranh giới; không đặt "Cách tệ" (log chuỗi tự do) cạnh "Cách tốt" (log JSON có field) trong cùng một khối.
- **Câu quá dài / khô:** kiểu câu như "Message gửi qua SQS không mang thuộc tính nào của request gốc, nên worker không có cách nào biết message thuộc đơn nào ngoài nội dung body." — hai mệnh đề nối bằng "nên", phải đọc lại mới tách được ý.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Một đơn hàng đi qua ba tầng: API Gateway → Lambda nhận request → SQS → Lambda worker. Một khách báo đơn không tới sau 30 phút.

Đội trực mở ba nhóm log:

- Nhóm API Gateway có một `requestId`.
- Nhóm Lambda nhận request có `aws_request_id` **khác**.
- Nhóm worker có `messageId` **thứ ba**.

Không id nào xuất hiện ở cả ba nhóm. Mỗi nhóm có khoảng 200 dòng trong khung giờ đó. Bốn mươi phút sau, người trực tìm ra đơn bằng cách **đọc thủ công và ghép theo thời gian**. `(Các con số của kịch bản — cần kiểm tra lại trên hệ thống thật.)`

**Câu hỏi dự đoán:** ba id kia do ai sinh ra, và id nào tồn tại ở tầng nào?

**Đáp án:** mỗi tầng sinh id cho **phạm vi của chính nó**, và không id nào tự lan sang tầng sau:

- `requestId` — API Gateway sinh cho từng request tới nó.
- `aws_request_id` — runtime Lambda sinh cho từng **invocation** (một lần chạy hàm).
- `messageId` — SQS sinh khi message được gửi vào hàng đợi.

Thuật ngữ dùng trong bài:

- `correlation ID` — mã định danh gắn xuyên suốt một request qua nhiều hàm/dịch vụ.
- `ContextVar` — biến ngữ cảnh giữ giá trị riêng cho từng tác vụ async hoặc từng luồng.
- `MessageAttributes` — metadata gửi kèm message SQS, tách khỏi body nghiệp vụ.

### 2. Phép ví von đời thường & Sơ đồ chữ

Ba tầng giống ba quầy trong một bệnh viện: quầy tiếp nhận phát số thứ tự riêng, phòng xét nghiệm ghi mã mẫu riêng, phòng trả kết quả ghi số hồ sơ riêng. Không quầy nào biết số của quầy kia. Muốn lần lại một bệnh nhân, phải có **một mã bệnh nhân do quầy đầu tiên phát** và ghi mã đó lên mọi phiếu.

*Giới hạn của phép ví von:* bệnh nhân tự mang mã của mình đi; còn message SQS chỉ mang theo những gì code **chủ động** đặt vào.

```text
 API Gateway          Lambda A               SQS            Lambda worker
 ┌───────────┐      ┌────────────┐      ┌──────────┐      ┌────────────┐
 │ requestId │      │aws_request_│      │messageId │      │aws_request_│
 │  gw-77    │      │  id lam-a-1│      │ msg-aaa  │      │ id lam-a-2 │
 └───────────┘      └────────────┘      └──────────┘      └────────────┘
       │                  │                  │                  │
       └──── không id nào tự đi tiếp ───────┴──────────────────┘
                          │
        ✂ RANH GIỚI: mỗi mũi tên là một lời gọi mới

 CÁCH TỐT: một correlation_id do biên tạo, đi kèm mọi dòng log

 ┌──────────────────────────────────────────────────────────────┐
 │ correlation_id = corr-a1                                     │
 │   ├─ api-gateway   : log JSON có field correlation_id        │
 │   ├─ lambda-api    : log JSON có field correlation_id        │
 │   │     └─ gửi SQS: MessageAttributes{correlation_id}  ──────┼──→
 │   └─ lambda-worker : đọc MessageAttributes, log cùng id      │
 └──────────────────────────────────────────────────────────────┘
        ↓
   một truy vấn: filter correlation_id = "corr-a1"
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Tạo ở biên, không tạo ở giữa.** Middleware của API đọc header định danh nếu client gửi; nếu không, sinh giá trị mới. Giá trị đó là `correlation_id` cho cả đường đi. Tạo ở giữa đường thì các tầng trước đã log mà không có nó.
- **Bước 2 — Ghi log dạng JSON có field.** Mọi dòng log ghi dạng JSON có field `correlation_id`. Log chuỗi tự do không lọc được theo field, nên mọi truy vấn phải tìm chuỗi con — và tìm chuỗi con sẽ khớp cả dòng của đơn khác.
- **Bước 3 — Truyền qua ranh giới bằng `MessageAttributes`.** Khi gửi SQS, `correlation_id` đi trong `MessageAttributes`, không nhét vào body. Worker đọc được mà không phải parse nghiệp vụ.
- **Bước 4 — Nhận và reset ở worker.** Worker đọc thuộc tính từ record, bind vào `ContextVar` của lần chạy, và **reset sau mỗi invocation** — vì container Lambda được tái sử dụng, id của đơn trước sẽ dính sang đơn sau.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** chỉ log id do runtime sinh (`aws_request_id`) dạng chuỗi tự do. Điều xảy ra: mỗi nhóm log có id riêng, không id nào có mặt ở cả ba nhóm; truy một đơn thành thao tác đọc thủ công và thời gian tỉ lệ với số dòng log. Lý do hỏng: id đó thuộc **một invocation**, không thuộc **một đơn**.
- **Cách tốt:** tạo `correlation_id` ở biên, ghi vào log JSON, truyền qua `MessageAttributes`, worker đọc lại và reset trong `finally`. Lý do giải quyết được: mọi tầng cùng tham chiếu **một** giá trị, nên một truy vấn lọc theo field là ra toàn bộ đường đi.
- **Kiểm chứng bằng code (chạy thật):** `lessons/02-python/L10-log-correlation/` có `emit_logs.py` sinh log mẫu và `trace_order.py` lọc theo `correlation_id`.

```
python emit_logs.py
python trace_order.py
```

Output đã chạy:

```
da ghi 12 dong vao logs.jsonl
---
Tong so dong log: 12
Loc theo correlation_id = corr-a1 -> 7 dong

Dong thoi gian cua don nay:
  2026-10-29T10:00:00.00Z  api-gateway   request_received
  2026-10-29T10:00:00.05Z  lambda-api    order_accepted       order_id=A-1001 aws_request_id=lam-a-1
  2026-10-29T10:00:00.09Z  lambda-api    message_sent         aws_request_id=lam-a-1 messageId=msg-aaa
  2026-10-29T10:00:01.24Z  lambda-worker message_received     aws_request_id=lam-a-2 messageId=msg-aaa
  2026-10-29T10:00:01.35Z  lambda-worker payment_failed       aws_request_id=lam-a-2 messageId=msg-aaa error=upstream 503
  2026-10-29T10:00:02.40Z  lambda-worker message_redelivered  aws_request_id=lam-a-3 messageId=msg-aaa
  2026-10-29T10:00:02.46Z  lambda-worker order_completed      aws_request_id=lam-a-3 messageId=msg-aaa

Neu chi co mot id he thong thi loc duoc bao nhieu dong:
  requestId       tong  2 dong, o cac tang: api-gateway=2
  aws_request_id  tong 10 dong, o cac tang: lambda-api=4, lambda-worker=6
  messageId       tong  8 dong, o cac tang: lambda-api=2, lambda-worker=6
  order_id        tong  2 dong, o cac tang: lambda-api=2
```

Đọc bảng theo một ý duy nhất: **không id hệ thống nào phủ được cả ba tầng.** `requestId` chỉ thấy 2 dòng ở một tầng. `aws_request_id` thấy 10 dòng nhưng vắt qua hai tầng chứ không chỉ một đơn. `correlation_id` thấy đúng **7 dòng**, từ `api-gateway` tới `lambda-worker`, và trong đó có cả dòng `payment_failed` lẫn `message_redelivered` — tức là đọc được nguyên nhân, không phải chỉ đọc được sự tồn tại.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** truy một đơn bằng **một** truy vấn thay vì ghép tay; log JSON lọc và ghép được bằng máy; `MessageAttributes` tách id khỏi payload nghiệp vụ.
- **Đánh đổi gì:** log JSON dài hơn log chuỗi ngắn, nên tốn dung lượng lưu. Mọi chỗ ghi log phải đi qua **cùng một cấu hình**, nếu không sẽ có dòng thiếu field và đường đi đứt đúng chỗ đó. `MessageAttributes` có giới hạn số lượng và kích thước. Nếu client cũng có id riêng thì phải ánh xạ hai id và ghi cả hai.
- **Khi nào KHÔNG nên dùng:** đừng dùng `correlation_id` thay cho `distributed tracing` khi câu hỏi là "60 phần trăm độ trễ nằm ở tầng nào" — correlation trả lời "thuộc đơn nào", tracing trả lời "mất bao lâu ở đâu". Đừng nhét cả context lớn vào `MessageAttributes`. Đừng dùng `requestId` của API Gateway làm id chung nếu còn đường vào khác (job theo lịch, message từ hệ thống khác) — các đường đó không có `requestId`.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao không dùng luôn `requestId` của API Gateway làm `correlation_id`?

- **Trả lời mẫu (30–60 giây):** Dùng được **nếu** mọi đường vào đều đi qua API Gateway và code chủ động đọc rồi chuyển tiếp. Nhưng `requestId` thuộc phạm vi một request tới API Gateway; nó **không nằm trong payload** mà Lambda nhận. Nếu có thêm đường vào khác — job theo lịch, message từ hệ thống khác — các đường đó không có `requestId` và sẽ thiếu id. Dấu hiệu kiểm chứng: đếm số message tới worker không có id; khác 0 nghĩa là đã có đường vào không qua cổng đó.
- **Lỗi hay mắc khi trả lời:** nói "dùng luôn cho tiện". Cách nói đúng: nêu điều kiện "mọi đường vào qua cùng một cổng", rồi nêu cách đếm để kiểm.

### Câu 2: Correlation ID có thay được distributed tracing không?

- **Trả lời mẫu (30–60 giây):** Không. Nó trả lời **món này thuộc đơn nào**, không trả lời **thời gian từng bước** hay quan hệ cha con giữa các lời gọi. Correlation là một field trong log; tracing ghi `span` có thời điểm bắt đầu, kết thúc và span cha. Khi cần biết 60 phần trăm độ trễ nằm ở tầng nào, log chỉ cho biết các mốc rời rạc, còn tracing cho biết cấu trúc. Nếu câu hỏi là "vì sao chậm" mà log chỉ trả lời được "đã gọi những gì", đó là giới hạn của correlation.
- **Lỗi hay mắc khi trả lời:** nói "có correlation_id là đủ để debug". Cách nói đúng: tách hai câu hỏi — "thuộc đơn nào" và "mất bao lâu ở đâu" — rồi gán đúng công cụ cho từng câu.

### Câu 3: Nếu worker chạy lại cùng một message, `correlation_id` có đổi không?

- **Trả lời mẫu (30–60 giây):** Không đổi **nếu** id được lưu cùng message. Id nằm trong `MessageAttributes` nên nó đi theo message qua mọi lần nhận lại. Nó **đổi** nếu worker sinh id mới cho mỗi lần chạy — đó là lỗi, vì như vậy mỗi lần thử thành một "đơn" khác trong log. Muốn phân biệt lần thử thứ nhất và thứ hai thì thêm một field đếm số lần nhận, **không** đổi `correlation_id`. Kiểm chứng: hai lần chạy cùng đơn phải cho cùng id và khác số lần thử.
- **Lỗi hay mắc khi trả lời:** nói "mỗi lần chạy sinh id mới cho sạch". Cách nói đúng: id thuộc **đơn/message**, số lần thử là field **riêng**.

### Câu 4: Có nên đặt toàn bộ context vào `MessageAttributes` không?

- **Trả lời mẫu (30–60 giây):** Không nên. `MessageAttributes` là metadata có ràng buộc riêng về số lượng và kích thước, không phải chỗ chứa payload tuỳ ý. Chỉ nên đặt vài trường cần cho việc nối log, như `correlation_id` và tên đơn vị gọi; phần còn lại để trong body. Dấu hiệu: message bị từ chối khi gửi do vượt giới hạn thuộc tính — lúc đó đã nhét quá nhiều. Và nếu cần cả context lớn cho nghiệp vụ thì đó là dấu hiệu body mới là chỗ đúng.
- **Lỗi hay mắc khi trả lời:** nói "cứ đặt hết vào cho tiện đọc". Cách nói đúng: nêu giới hạn cứng của thuộc tính, nêu tiêu chí "chỉ trường phục vụ nối log".

---
## Ghi chú nguồn

- https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html — `requestId` trong context của request.
- https://docs.aws.amazon.com/lambda/latest/dg/python-context.html — `aws_request_id` trong object context.
- https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html — `MessageAttributes`.
- https://docs.python.org/3/library/contextvars.html — `ContextVar`.
- Đã kiểm trong bài này: chạy `emit_logs.py` và `trace_order.py` trong `lessons/02-python/L10-log-correlation/`; bảng "12 dòng / 7 dòng / theo từng id" là output thật. Chưa kiểm: cú pháp query chi tiết của CloudWatch Logs Insights, hạn mức của SQS `MessageAttributes`, và các con số 40 phút, 200 dòng là thông số kịch bản.
