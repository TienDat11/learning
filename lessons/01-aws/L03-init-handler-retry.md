# L03: Một lần gọi Lambda đi qua Init, handler và retry như thế nào

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 3 trả lời "ba lần" cho câu hỏi số lần chạy, nhưng quy tắc "một lần đầu cộng hai lần thử lại" chỉ được nói ở phần đáp án, không được suy ra từ cơ chế. Bước 4 mục 6 gộp `event source mapping`, `stream`, `shard`, `redrive policy` và `dead-letter queue` vào một bullet, nên người đọc gặp bốn khái niệm mới trong một câu.
- **Thuật ngữ chưa giải thích:** `Init phase`, `Invoke phase`, `cold start`, `warm`, `async invoke`, `timeout`, `event source mapping`, `shard`, `redrive policy`, `dead-letter queue`, `idempotency`, `tác dụng phụ`. Có chỗ bài dùng chữ "idempotent" mà chưa từng định nghĩa.
- **Thiếu ví von / ví dụ trực diện:** không có phép ví von nào cho việc "Init chạy một lần, handler chạy nhiều lần". Sơ đồ là `mermaid sequenceDiagram`, không đọc được ở nhiều nơi và không in ra giấy được. Không có sơ đồ thời gian dạng chữ cho ba lần thử.
- **Câu quá dài / khô:** câu "Với stream, Lambda thử lại cả lô và lỗi lặp lại sẽ chặn shard cho tới khi hết lỗi hoặc dữ liệu hết hạn." nhồi ba mệnh đề. Cả đoạn về retry đọc như danh sách tính năng hơn là một chuỗi nhân quả.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử hàm của bạn tạo ba kích thước ảnh và gửi một email xác nhận. Với ảnh 4 MB, một lần chạy mất khoảng 5 giây. Nhưng ai đó đặt timeout (giới hạn thời gian chạy) là 3 giây.

Mỗi lần chạy đều bị dừng ở giây thứ ba. Email đã gửi ở giây thứ hai. Hàm được gọi bất đồng bộ từ sự kiện upload của S3, nên Lambda tự thử lại: một lần đầu, hai lần nữa.

Kết quả: khách nhận ba email cho một tấm ảnh, và không kích thước nào được tạo xong. Không có lỗi nào hiện lên dashboard, vì mỗi lần chạy đều "đúng" theo nghĩa nó chạy đúng 3 giây rồi bị dừng.

Đau ở đâu? Đau ở chỗ **bạn không kiểm soát được số lần code mình chạy**. Nền tảng quyết định điều đó, và nó quyết định dựa trên kiểu gọi, không dựa trên code của bạn.

**Câu hỏi dự đoán:** Cùng một lỗi timeout, nếu hàm được gọi đồng bộ qua API Gateway thì ai thử lại?
**Đáp án:** không ai tự động. API Gateway trả lỗi về cho client, và client quyết định có gửi lại hay không.

### 2. Phép ví von đời thường & Sơ đồ chữ

Một quán cà phê có máy pha. Sáng mở cửa, nhân viên bật máy, đổ nước, làm nóng — đó là một lần cho cả ngày. Mỗi ly khách gọi là một lần bấm nút. Nếu ly bị đổ, nhân viên pha ly mới; máy không khởi động lại từ đầu.

*Giới hạn của phép ví von:* quán cà phê mở cửa cả ngày, còn environment Lambda có thể bị thu hồi sau vài phút rảnh, và lần gọi sau lại phải bật máy từ đầu.

```text
Environment LẠNH (cold start)              Environment ẤM (warm)
┌───────────────────────────────┐          ┌──────────────────────────┐
│ INIT: nạp code, mở kết nối    │          │ (bỏ qua Init)            │
│ mất thêm vài trăm ms          │          │                          │
├───────────────────────────────┤          ├──────────────────────────┤
│ INVOKE: chạy handler          │          │ INVOKE: chạy handler     │
└───────────────────────────────┘          └──────────────────────────┘

Một sự kiện lỗi, gọi bất đồng bộ:
  lần 1 ──timeout 3s──►  chờ ~1 phút  ──►  lần 2 ──timeout──►  chờ ~2 phút  ──►  lần 3
     ▲ email đã gửi ở giây 2        ▲ email gửi lần 2          ▲ email gửi lần 3
     └──────────── 3 email, 0 kích thước ảnh nào xong ────────────┘
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Có hai pha, không phải một:** `Init` (pha khởi tạo) chạy code bên ngoài handler: nạp thư viện, mở kết nối, đọc biến môi trường. `Invoke` (pha thực thi) chạy thân handler cho đúng một sự kiện.
- **Bước 2 — Init chạy một lần cho mỗi environment, không phải mỗi request:** environment được tái dùng, nên lần gọi thứ hai trên cùng environment bỏ qua Init. Đó là lý do mở kết nối ngoài handler có lợi.
- **Bước 3 — Lần gọi đầu trên một environment mới gọi là `cold start`:** (lần khởi động đầu tiên phải tạo mới môi trường). Nó gồm thời gian tạo environment cộng thời gian Init. Lần gọi sau trên environment đó là `warm` và nhanh hơn.
- **Bước 4 — Timeout là dừng tiến trình, không phải hoàn tác:** khi hết thời gian, Lambda dừng tiến trình ngay. Những gì đã ghi ra ngoài — email, dòng trong database, object trên S3 — vẫn còn. Không có rollback.
- **Bước 5 — Ai thử lại là do kiểu gọi quyết định:** gọi bất đồng bộ thì Lambda thử lại hai lần nữa, cách nhau khoảng 1 phút và 2 phút (hành vi có tài liệu; con số chờ có thể cấu hình). Gọi đồng bộ thì không ai thử lại. Đọc từ hàng đợi thì hàng đợi quyết định.
- **Bước 6 — Vì thế số lần chạy là thông tin của nền tảng, còn khoá chống lặp là thông tin của nghiệp vụ:** `idempotency` (tính chất xử lý một lần hay nhiều lần vẫn ra đúng một kết quả) phải nằm trong code, không nằm trong cấu hình.
- **Bước 7 — Khoá phải được ghi trước tác dụng phụ:** nếu bạn gửi email rồi mới ghi khoá, lần chạy bị dừng giữa hai bước đó vẫn để lại email mà không có khoá. Ghi khoá trước, làm việc sau.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** để tác dụng phụ ở giữa handler, không có khoá, và tin rằng mỗi sự kiện chỉ chạy một lần.

```python
def handler(event, context):
    send_email(event["to"])          # tác dụng phụ: không rút lại được
    for size in (128, 512, 1024):    # việc thật: chậm hơn timeout
        make_thumbnail(event["key"], size)
    return {"ok": True}
```

Điều gì xảy ra: email đi ở giây thứ hai, tiến trình bị dừng ở giây thứ ba, Lambda thử lại hai lần, mỗi lần lại gửi một email. Khách nhận ba email, ảnh vẫn chưa có thumbnail nào.

Vì sao hỏng: bạn đặt tác dụng phụ **trước** việc dài, và không có gì chặn lần chạy thứ hai. Retry không biết bạn đã gửi email; nó chỉ biết lần gọi trước thất bại.

- **Cách tốt:** ghi khoá trước, kiểm khoá ở đầu handler, và đặt tác dụng phụ sau khi việc chính xong.

```python
def handler(event, context):
    key = event["message_id"]
    if not ledger.claim(key):        # ghi khoá có điều kiện, nguyên tử
        return {"skipped": "đã xử lý"}
    for size in (128, 512, 1024):
        make_thumbnail(event["key"], size)
    send_email(event["to"])          # chỉ tới đây khi việc chính đã xong
    return {"ok": True}
```

Vì sao đúng: lần thử thứ hai gặp khoá đã tồn tại và thoát ngay. Số lần handler chạy vẫn là ba; số tác dụng phụ là một. Đó chính là định nghĩa của idempotent.

- **Kiểm chứng bằng code (chạy thật):** chạy trong `lessons/01-aws/l03/`. Đây là mô phỏng cơ chế retry, không phải Lambda thật: một message, ba lần giao, timeout 3 giây, việc thật 5 giây, tác dụng phụ ở giây thứ hai.

```bash
python retry_idempotency.py
```

```text
Giả định: một message 'anh-001.jpg', 3 lần giao, timeout 3s, việc thật 5s,
tác dụng phụ (gửi email) xảy ra ở giây thứ 2.

  Lần 1: dừng ở timeout 3.0s, việc thật cần 5.0s
  Lần 2: dừng ở timeout 3.0s, việc thật cần 5.0s
  Lần 3: dừng ở timeout 3.0s, việc thật cần 5.0s

Không có khoá idempotency:
  Số lần handler được gọi:      3
  Số dòng đã ghi:               3
  Số dòng trùng (cùng message): 2
  Số message duy nhất:          1

  Lần 1: dừng ở timeout 3.0s sau khi đã giữ khoá
  Lần 2: bỏ qua: khoá đã tồn tại
  Lần 3: bỏ qua: khoá đã tồn tại

Có khoá idempotency (ghi khoá trước tác dụng phụ):
  Số lần handler được gọi:      3
  Số dòng đã ghi:               1
  Số dòng trùng (cùng message): 0
  Số message duy nhất:          1

Đọc ra: số lần handler chạy không đổi (vẫn 3), chỉ số tác dụng phụ đổi từ 3 xuống 1.
```

Đọc hai dòng cuối của mỗi khối: **số lần handler chạy không đổi**. Khoá không làm Lambda thôi thử lại; nó làm lần thử thứ hai và thứ ba không để lại dấu vết.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** tách Init ra ngoài handler cho bạn tái dùng kết nối và giảm thời gian mỗi lần gọi. Idempotency cho bạn chịu được retry mà không nhân đôi tác dụng phụ.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** mỗi lần cold start là một lần trả giá về độ trễ, và bạn không điều khiển được lúc nào environment bị thu hồi. Khoá idempotency cần một nơi lưu bền và một thao tác ghi nguyên tử, tức thêm một lời gọi mạng cho mỗi sự kiện. Đặt timeout dài để tránh retry thì lại tốn tiền và giữ environment lâu hơn.
- **Khi nào KHÔNG nên dùng:** đừng thêm khoá idempotency cho một hàm chỉ đọc dữ liệu và trả về — chạy lại không đổi gì thì không cần khoá. Đừng thử lại lỗi do dữ liệu đầu vào sai: ba lần chạy sẽ hỏng giống hệt nhau, chỉ nhân ba tác dụng phụ. Và đừng dùng khoá theo nội dung nếu nội dung có thể đổi giữa hai lần gửi hợp lệ khác nhau.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Init và handler khác nhau ở điểm nào, và vì sao điều đó quan trọng?

- **Trả lời mẫu (30–60 giây):** Init chạy code bên ngoài handler, một lần cho mỗi environment. Handler chạy mỗi lần gọi, cho đúng một sự kiện. Điều đó quan trọng vì mọi thứ bạn mở ở Init — kết nối, client, bảng cấu hình — được tái dùng, còn mọi thứ bạn mở trong handler thì trả giá mỗi lần. Lần gọi đầu trên environment mới là cold start, gồm cả thời gian tạo môi trường.
- **Lỗi hay mắc khi trả lời:** nói "Init chạy một lần cho mỗi request". Cách nói đúng: một lần cho mỗi environment, và environment được tái dùng cho nhiều request.

### Câu 2: Một lời gọi bất đồng bộ thất bại thì Lambda làm gì?

- **Trả lời mẫu (30–60 giây):** Lambda thử lại hai lần nữa, cách lần trước khoảng 1 phút rồi 2 phút, nên tổng cộng ba lần chạy. Hết lượt thì sự kiện bị bỏ, hoặc vào dead-letter queue nếu bạn đã cấu hình. Điều quan trọng là mỗi lần thử chạy lại từ đầu handler, nên tác dụng phụ có thể xảy ra nhiều lần. Vì vậy code phải idempotent, không phải vì Lambda thích gọi lại mà vì nó không biết bạn đã làm gì.
- **Lỗi hay mắc khi trả lời:** nói "Lambda thử lại vô hạn". Cách nói đúng: hai lần thử lại, rồi bỏ hoặc vào DLQ.

### Câu 3: Đổi sang đọc từ SQS bằng event source mapping thì điều gì quyết định số lần thử?

- **Trả lời mẫu (30–60 giây):** Hàng đợi quyết định, không phải Lambda. `visibility timeout` (khoảng thời gian ẩn message khỏi các worker khác khi đang xử lý) quyết định bao lâu thì message hiện lại. `redrive policy` với `maxReceiveCount` quyết định sau bao nhiêu lần nhận thì message sang Dead-Letter Queue - DLQ (hàng đợi chứa các message xử lý lỗi nhiều lần). Nếu hàm lỗi, message không bị xoá, nên nó quay lại sau đúng khoảng ẩn. Vì vậy tôi luôn đặt visibility timeout dài hơn thời gian xử lý thực tế.
- **Lỗi hay mắc khi trả lời:** nói "Lambda retry ba lần" cho mọi kiểu gọi. Cách nói đúng: ba lần chỉ đúng cho gọi bất đồng bộ; hàng đợi và stream có luật riêng.

### Câu 4: Làm sao biết một lỗi là tạm thời hay vĩnh viễn, và cách xử lý khác nhau thế nào?

- **Trả lời mẫu (30–60 giây):** Lỗi tạm thời là lỗi mà lần sau có thể khác: timeout mạng, dịch vụ đích đang bận, giới hạn tần suất. Lỗi vĩnh viễn là lỗi mà lần sau y hệt: dữ liệu thiếu trường, sai định dạng, ảnh hỏng. Cách phân biệt thực dụng là đọc thông báo lỗi và kiểm tra xem ba lần chạy có dừng ở cùng một dòng không. Với lỗi vĩnh viễn, thử lại chỉ nhân tác dụng phụ, nên tôi đẩy thẳng vào DLQ để người xử lý.
- **Lỗi hay mắc khi trả lời:** tăng số lần retry khi gặp lỗi dữ liệu. Cách nói đúng: retry chỉ có ích khi nguyên nhân có thể biến mất giữa hai lần thử.

---
## Ghi chú nguồn

- Lambda — Runtime environment, Init và Invoke: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html
- Lambda — Asynchronous invocation và số lần thử lại: https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html
- Lambda — Error handling và retry: https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html
- Lambda — Timeout: https://docs.aws.amazon.com/lambda/latest/dg/configuration-timeout.html
- Lambda — Event source mapping với SQS: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
- SQS — Visibility timeout: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html

Các con số trong bài (timeout 3 giây, việc thật 5 giây, email ở giây thứ hai, ảnh 4 MB, ba lần giao) là giả định của kịch bản — cần kiểm tra lại trên hệ thống thật. Riêng "hai lần thử lại, cách nhau khoảng 1 phút và 2 phút" là hành vi có tài liệu của Lambda cho gọi bất đồng bộ. Khối output ở mục 4 là output thật của script `retry_idempotency.py`, ghi lại từ lần chạy trên máy.
