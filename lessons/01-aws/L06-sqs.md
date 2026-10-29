# L06: Vì sao thêm consumer không làm hàng đợi nhanh hơn

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 3 tính ra 0,15 message mỗi giây rồi mới giải thích vì sao kích thước lô không đổi con số đó — người đọc phải tin trước, hiểu sau. Bước 4 mục 6 đưa `redrive policy`, `maxReceiveCount` và `dead-letter queue` trong một bullet, ba khái niệm mới cùng lúc.
- **Thuật ngữ chưa giải thích:** `consumer`, `visibility timeout`, `receipt handle`, `long polling`, `redrive policy`, `maxReceiveCount`, `dead-letter queue`, `giao ít nhất một lần`, `backlog`, `throughput`. Có chỗ bài dùng chữ "at-least-once" và "idempotent" mà không có dòng tiếng Việt bên cạnh.
- **Thiếu ví von / ví dụ trực diện:** không có phép ví von nào cho ý "message bị ẩn chứ không bị xoá". Sơ đồ là `mermaid sequenceDiagram`, không đọc được ở nhiều nơi. Cách tệ và Cách tốt không được đặt cạnh nhau.
- **Câu quá dài / khô:** câu "Điều ít ai để ý: với lô 10, message cuối trong lô chỉ được xử lý xong ở giây 400, nhưng nó đã hết hạn ẩn từ giây 30." gộp phép tính, kết luận và hệ quả vào một dòng. Đoạn "Vì sao thêm consumer không làm hàng đợi nhanh hơn" cũng là một khối dày đặc.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử sau một đợt nhập dữ liệu, hàng đợi còn 12 000 message tồn. Bạn có 6 consumer (tiến trình lấy việc ra làm), mỗi lần nhận tối đa 10 message, xử lý lần lượt, mỗi message khoảng 40 giây.

Bạn đặt `visibility timeout` (khoảng thời gian ẩn message khỏi các worker khác khi đang xử lý) là 30 giây.

Ba ngày sau, khách phàn nàn nhận hai email xác nhận cho cùng một đơn. Backlog thì gần như không giảm.

Đau ở đâu? Đau ở hai chỗ cùng lúc. Thứ nhất, **thêm consumer không làm hàng đợi nhanh hơn** nếu tài nguyên phía sau đã kín. Thứ hai, **message bị làm lại** mà không ai bấm gì — chỉ vì một tham số nhỏ hơn thời gian xử lý.

**Câu hỏi dự đoán:** Message đã được consumer nhận, vậy nó còn nằm trong hàng đợi không?
**Đáp án:** còn. Nó chỉ bị ẩn tạm. Hết khoảng ẩn mà chưa có lệnh xoá thì nó hiện lại cho consumer khác.

### 2. Phép ví von đời thường & Sơ đồ chữ

Một quầy phát việc ở hội chợ. Bạn rút một xấp phiếu, mỗi phiếu là một việc. Quầy đánh dấu xấp phiếu đó là "đang có người làm" trong 30 giây. Nếu sau 30 giây bạn chưa trả phiếu về kèm dấu "xong", quầy coi như bạn bỏ đi và đưa phiếu cho người khác — người đó làm lại việc từ đầu.

*Giới hạn của phép ví von:* quầy thật biết bạn còn đứng đó hay không; hàng đợi thì không. Nó chỉ biết đã nhận được lệnh xoá hay chưa.

```text
Hàng đợi:  [m1][m2][m3] ................ [m12000]

Consumer 1 nhận lô 10  →  10 message bị ẨN 30 giây
  giây 0    : bắt đầu m1
  giây 30   : m1 hết hạn ẩn, CHƯA xoá  →  hiện lại
  giây 40   : m1 mới xong ở consumer 1
  giây 31   : consumer 2 (đang rảnh) nhận lại m1  ←  GIAO TRÙNG

Thông lượng = số consumer ÷ thời gian một message
   6 ÷ 40 giây = 0,15 message/giây
   12 000 ÷ 0,15 = 80 000 giây ≈ 22 giờ

Trần phía sau: chỉ 6 suất xử lý song song
   thêm consumer  →  thông lượng ĐỨNG YÊN, giao trùng TĂNG
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Hàng đợi là nơi giữ việc, consumer là nơi làm việc:** consumer chủ động hỏi hàng đợi, hàng đợi không đẩy. Số việc đang làm cùng lúc bằng số consumer, không bằng số message trong hàng đợi.
- **Bước 2 — Nhận message là ẩn nó, không phải xoá nó:** message vẫn nằm trong hàng đợi nhưng không ai khác nhận được trong khoảng `visibility timeout`. Hết khoảng đó mà chưa xoá thì nó hiện lại.
- **Bước 3 — Xoá phải dùng `receipt handle` của lần giao hiện tại:** mỗi lần giao cấp một mã khác nhau. Dùng mã cũ để xoá là xoá sai lần giao, và message vẫn quay lại.
- **Bước 4 — Thông lượng bằng số consumer chia thời gian một message:** 6 consumer, mỗi message 40 giây, ra 0,15 message mỗi giây. Kích thước lô không đổi con số này: lô chỉ quyết định bao nhiêu message bị ẩn cùng lúc.
- **Bước 5 — `visibility timeout` phải phủ cả lô, không phải một message:** với lô 10 và 40 giây mỗi message, message cuối trong lô chỉ xong ở giây 400. Nếu khoảng ẩn là 30 giây thì nó đã hiện lại từ giây 30, suốt 370 giây.
- **Bước 6 — Hàng đợi không biết consumer đã chết:** message của một consumer chết quay lại sau đúng khoảng ẩn, không phải ngay lúc chết. Khoảng ẩn ngắn thì phục hồi nhanh nhưng dễ trùng; dài thì hết trùng nhưng chậm phục hồi.
- **Bước 7 — Vì thế mọi tác dụng phụ phải chịu được lặp, và message hỏng phải có chỗ đi:** mô hình là giao ít nhất một lần. `Dead-Letter Queue - DLQ` (hàng đợi chứa các message xử lý lỗi nhiều lần) nhận message sau `maxReceiveCount` lần giao, để nó không quay vòng mãi.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** thấy backlog không giảm thì thêm consumer, và để visibility timeout ở mức mặc định.

```text
# Cấu hình sai điển hình (mô tả, không phải lệnh chạy được):
#   - visibility timeout = 30 giây, trong khi một lô 10 message mất 400 giây
#   - tăng consumer từ 6 lên 12, 24, 48 vì "backlog không giảm"
#   - handler gửi email ở đầu hàm, không có khoá chống lặp
```

Điều gì xảy ra: thông lượng đứng yên ở 0,15 message mỗi giây vì tài nguyên phía sau chỉ nhận 6 việc song song. Giao trùng tăng gấp đôi mỗi lần bạn nhân đôi consumer. Khách nhận thêm email trùng, còn backlog thì vẫn thế.

Vì sao hỏng: bạn tăng số người bốc phiếu, không tăng số bếp. Và mỗi người rảnh thêm là một chỗ nữa có thể nhặt lại message đang bay.

- **Cách tốt:** đo trước, đặt visibility timeout theo thời gian của cả lô, và cho mỗi message một khoá chống lặp.

```python
def handle(message, receipt_handle):
    key = message["message_id"]
    if not ledger.claim(key):                 # đã xử lý thì bỏ qua
        queue.delete(ReceiptHandle=receipt_handle)
        return
    do_work(message)
    send_email(message["to"])                 # sau khi việc chính xong
    queue.delete(ReceiptHandle=receipt_handle)

# visibility timeout >= thời gian xử lý cả lô + biên an toàn
# ví dụ: lô 10 × 40 giây = 400 giây → đặt 600 giây
```

Vì sao đúng: khoảng ẩn dài hơn thời gian xử lý nên message không hiện lại giữa chừng. Khoá chống lặp xử lý nốt trường hợp consumer chết sau khi đã làm xong nhưng trước khi kịp xoá. Và bạn chỉ thêm consumer sau khi biết tài nguyên phía sau còn suất trống.

- **Kiểm chứng bằng code (chạy thật):** chạy trong `lessons/01-aws/l06/`. Đây là mô phỏng cơ chế, không phải SQS thật: không có mạng, không có độ trễ API, không có hàng đợi FIFO.

```bash
python visibility.py
```

```text
Kịch bản: 12 000 message, lô 10, mỗi message 40 giây xử lý.

   consumer   vis  trần sau   lần giao  giao trùng  xử lý lại     giây   msg/giây
          2    30         -      12018          18          0   240001      0.050
          6    30         -      12054          54          0    80001      0.150
          6   600         -      12000           0          0    80001      0.150
         12    30         -      12108         108          0    40001      0.300
         12    30         6      12114         114          0    80001      0.150

2 → 6 consumer: thông lượng 0.050 → 0.150 msg/giây (gấp 3.0).
6 → 12 consumer: thông lượng 0.150 → 0.300 msg/giây (gấp 2.0), giao trùng 54 → 108.
12 consumer nhưng tài nguyên sau chỉ 6 suất: 0.150 msg/giây, giao trùng 114.
vis 30 → 600 giây, vẫn 6 consumer: giao trùng 54 → 0.

Công thức: consumer × lô ÷ thời gian một lô = consumer ÷ thời gian một message.
   2 consumer ÷ 40 giây = 0.050 msg/giây
   6 consumer ÷ 40 giây = 0.150 msg/giây
  12 consumer ÷ 40 giây = 0.300 msg/giây
  trần phía sau 6 suất ÷ 40 giây = 0.150 msg/giây
```

Bốn điều đọc được từ bảng. Thông lượng đi theo số consumer, tuyến tính — cho tới khi có trần. Giao trùng xuất hiện đúng khi khoảng ẩn ngắn hơn thời gian xử lý: 54 lần ở 30 giây, 0 lần ở 600 giây, cùng code cùng dữ liệu. Thêm consumer làm trùng tăng: 6 lên 12 thì 54 lên 108. Và dòng cuối cùng là câu trả lời cho cả bài: 12 consumer nhưng chỉ 6 suất phía sau vẫn cho 0,150 message mỗi giây, còn giao trùng tăng lên 114.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** hàng đợi tách việc chậm ra khỏi đường trả lời người dùng, và cho bạn thử lại tự động khi worker chết. Consumer hỏng không làm mất việc.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** mọi tác dụng phụ phải idempotent, tức thêm một nơi lưu khoá và một lời gọi mạng cho mỗi message. Visibility timeout dài thì phục hồi chậm; ngắn thì giao trùng. Thêm consumer khi tài nguyên phía sau đã kín chỉ tăng trùng chứ không tăng thông lượng.
- **Khi nào KHÔNG nên dùng:** đừng dùng hàng đợi khi người dùng đang chờ kết quả ngay — thêm một khớp chỉ làm chậm. Đừng dùng khi thứ tự tuyệt đối là bắt buộc và bạn không kiểm soát được khoá phân vùng của hàng đợi FIFO. Và đừng dùng hàng đợi để "thay" việc tối ưu: nếu mỗi message mất 40 giây vì một truy vấn thiếu index, sửa truy vấn rẻ hơn nhiều so với nhân bản consumer.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao message đã được nhận vẫn có thể bị xử lý hai lần?

- **Trả lời mẫu (30–60 giây):** Vì nhận message chỉ là ẩn nó, không phải xoá nó. Hết `visibility timeout` mà chưa có lệnh xoá thì message hiện lại cho consumer khác. Có hai nguồn trùng độc lập: khoảng ẩn ngắn hơn thời gian xử lý, và consumer chết sau khi đã làm xong nhưng trước khi kịp xoá. Cả hai đều nằm ngoài tầm kiểm soát của code, nên mô hình là giao ít nhất một lần. Vì vậy mọi tác dụng phụ phải idempotent.
- **Lỗi hay mắc khi trả lời:** nói "xoá message là xong". Cách nói đúng: xoá bằng `receipt handle` của lần giao hiện tại, và khoá chống lặp phải ghi trước tác dụng phụ.

### Câu 2: Thêm consumer có làm hàng đợi nhanh hơn không?

- **Trả lời mẫu (30–60 giây):** Chỉ khi tài nguyên phía sau còn suất trống. Thông lượng xấp xỉ số consumer chia thời gian một message, nên 6 consumer với 40 giây cho 0,15 message mỗi giây. Nhưng nếu mỗi message gọi một dịch vụ chỉ nhận 6 việc song song thì thông lượng bị chặn ở đúng 0,15, dù bạn có 60 consumer. Lúc đó thêm consumer chỉ tăng giao trùng. Cách biết: nhân đôi consumer rồi đo lại thông lượng.
- **Lỗi hay mắc khi trả lời:** nói "thêm consumer là tăng thông lượng tuyến tính" mà không nêu điều kiện. Cách nói đúng: tuyến tính cho tới trần của tài nguyên phía sau.

### Câu 3: Visibility timeout nên đặt bao nhiêu?

- **Trả lời mẫu (30–60 giây):** Dài hơn thời gian xử lý **cả lô**, cộng một biên an toàn. Với lô 10 và 40 giây mỗi message, cả lô mất khoảng 400 giây, nên tôi đặt 600 giây chứ không phải 30. Nếu đặt ngắn hơn, message cuối lô hiện lại rất lâu trước khi được xoá, và bạn nhận giao trùng. Cái giá của khoảng ẩn dài là message của một consumer chết bị treo lâu hơn trước khi được giao lại.
- **Lỗi hay mắc khi trả lời:** đặt theo thời gian của một message. Cách nói đúng: theo thời gian của cả lô, vì cả lô bị ẩn cùng lúc.

### Câu 4: Message luôn lỗi thì xử lý thế nào?

- **Trả lời mẫu (30–60 giây):** Tôi cấu hình `redrive policy` với `maxReceiveCount`, để sau một số lần nhận thì message sang `Dead-Letter Queue`. Không có bước này, message lỗi quay vòng mãi và không ai thấy nó. Đồng thời tôi phân biệt lỗi tạm thời và lỗi vĩnh viễn: lỗi dữ liệu sai thì thử lại chỉ nhân tác dụng phụ, nên đẩy thẳng vào DLQ. DLQ cần người xem, và cần một cảnh báo khi nó có message — nếu không nó chỉ là nơi chôn việc.
- **Lỗi hay mắc khi trả lời:** coi DLQ là giải pháp khử trùng. Cách nói đúng: DLQ chặn vòng lặp vô hạn; khử trùng là việc của khoá idempotency trong code.

---
## Ghi chú nguồn

- SQS — Visibility timeout: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
- SQS — Dead-letter queues và `maxReceiveCount`: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html
- SQS — At-least-once delivery cho standard queue: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html
- SQS — Long polling: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html
- Lambda — Event source mapping với SQS: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html

Mọi con số trong bài (12 000 message, lô 10, 40 giây mỗi message, visibility 30 và 600 giây, 6 và 12 consumer, trần 6 suất phía sau) là giả định của kịch bản — cần kiểm tra lại trên hệ thống thật. Bảng ở mục 4 là output thật của `visibility.py`, ghi lại từ lần chạy trên máy; script không đổi.
