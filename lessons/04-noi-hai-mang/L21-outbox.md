# L21: Outbox — vì sao ghi cơ sở dữ liệu và gửi message lệch nhau, và chỗ nào vá được

> **Trạng thái:** bản viết lại theo phong cách "vấn đề trước, cơ chế sau". Output ở mục 4 là output thật của script trong `l21/`.
> **Số liệu:** mọi con số là giả định của kịch bản, ghi rõ "giả sử" ở chỗ dùng.

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 dùng ngay `FOR UPDATE SKIP LOCKED` và "đánh dấu đã gửi trong một transaction riêng" mà chưa nói vì sao hai dòng `INSERT` và `send` không nằm chung được một transaction. Người đọc phải tin kết luận trước khi thấy lý do.
- **Thuật ngữ chưa giải thích:** `dual-write`, `transactional outbox`, `visibility timeout`, `receipt handle`, `relay`, `DLQ`, `at-least-once`, `idempotent`, `SKIP LOCKED` xuất hiện lần đầu không kèm ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** hai chiều lệch (mất và ma) chỉ được liệt kê bằng gạch đầu dòng; không có sơ đồ chữ cho thấy hàng đợi nằm ngoài transaction.
- **Câu quá dài / khô:** "Vì mỗi 401 lại kích hoạt một vòng thử lại..." không có ở bài này, nhưng "Vì vậy hệ thống giao ít nhất một lần, và chạy trùng là chuyện bình thường chứ không phải ngoại lệ" gộp ba ý trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Hai dòng code trông như một việc:

```python
db.execute("INSERT INTO invoices ...")
queue.send({"invoice_id": ...})
```

Chúng là hai việc, ở hai hệ thống, không có transaction chung. Đó là `dual-write` (lỗi ghi đồng thời vào hai hệ thống khác nhau không có giao dịch chung).

Giả sử `visibility timeout` (thời gian message bị ẩn khỏi hàng đợi sau khi một worker nhận) là 30 giây, còn thời gian xử lý p99 là 45 giây.

Câu hỏi dự đoán: message được nhận ở giây 0 thì chuyện gì xảy ra ở giây 30? Đáp án: nó hiện lại, và worker khác nhận nó — dù worker đầu vẫn đang chạy.

Với 10.000 tệp, giả sử 15% message bị giao lại: 1.500 lần chạy thừa, và 340 khách nhận hai hoá đơn.

### 2. Phép ví von đời thường & Sơ đồ chữ

Ghi cơ sở dữ liệu rồi gửi message giống viết hoá đơn vào sổ rồi mới chạy ra bưu điện: nếu bạn ngã trên đường, sổ đã có hoá đơn nhưng thư chưa đi. Outbox là việc dán luôn con tem vào trang sổ, để bất kỳ ai mở sổ ra cũng biết còn thư chưa gửi.

Giới hạn của phép ví von: người đưa thư chỉ giao đúng một lần, còn relay có thể gửi cùng một message hai lần — nên phép ví von không nói gì về chuyện trùng.

```text
API ──một transaction──► [ orders + outbox ]  (cùng commit)
                                │
                                ▼
                        relay: đọc hàng chưa gửi
                                │
                    ┌───────────┴────────────┐
                    ▼                        ▼
              send lên hàng đợi        đánh dấu đã gửi
                    │                  (transaction riêng)
                    ▼                        │
                 worker ◄────────────────────┘
                    │
                    └─► chèn message_id + việc nghiệp vụ (cùng transaction)
```

Chỗ chặn nằm ở mũi tên "đánh dấu đã gửi": nó ở ngoài lần gửi, nên chết giữa hai bước là gửi lại.

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Transaction chỉ bao trùm một hệ thống:** commit của cơ sở dữ liệu không rollback được hàng đợi, và hàng đợi không giữ message lại chờ commit. Nên giữa hai lời gọi luôn có một khoảng thời gian.
- **Bước 2 — Trong khoảng đó có đúng hai chiều lệch:** ghi thành công mà gửi lỗi thì mất việc; gửi thành công mà commit lỗi thì có message trỏ tới hàng không tồn tại.
- **Bước 3 — Ghi message như một hàng dữ liệu:** `transactional outbox` (bảng hộp thư đi nằm cùng giao dịch database với dữ liệu nghiệp vụ) biến việc gửi thành hệ quả của commit, nên chiều mất biến mất.
- **Bước 4 — Cái còn lại là trùng:** relay gửi xong rồi chết trước khi đánh dấu thì lần sau gửi lại. Chỉ consumer idempotent mới làm lần gửi thừa thành vô hại.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** `send` ngay sau `commit`, visibility để mặc định 30 giây, `json.loads` nằm ngoài `try`. Hỏng ở ba điểm: mất việc khi gửi lỗi, chạy trùng khi lease hết hạn, và message hỏng định dạng quay vòng mãi không tới được hàng đợi lỗi.
- **Cách tốt:** outbox trong cùng transaction, relay đọc bằng `FOR UPDATE SKIP LOCKED`, worker chèn `message_id` trong cùng transaction với việc nghiệp vụ, và tách lỗi tạm thời khỏi lỗi vĩnh viễn.

**Kiểm chứng bằng code (chạy thật):**

```
cd lessons/04-noi-hai-mang/l21
python outbox_sim.py
```

```
== Tổng hợp ==
kịch bản                            gửi   mất  trùng   ma
1. commit ok, gửi lỗi                 0     1      0    0
2. gửi ok, commit lỗi                 1     0      0    1
3. outbox, relay chết giữa chừng      2     0      1    0
```

Ba dòng là toàn bộ bài học, và script đếm chúng trên dữ liệu thật của từng kịch bản. Dòng 3 là dòng quan trọng: outbox không xoá được trùng, nó chỉ chuyển chiều lệch từ "mất" sang "trùng". Dòng cuối của output đầy đủ chứng minh phần còn lại: hai message đã gửi, nhưng bảng `processed` có khoá chính trên `message_id` nên lần thứ hai bị bỏ qua, và hoá đơn thực tế là 1.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** một hàng đã commit chắc chắn sinh ra message; việc gửi thành bước có thể thử lại; giao trùng trở thành vô hại thay vì phải đi đền khách.
- **Đánh đổi gì:** thêm một bảng, một relay chạy liên tục, một bảng khoá phải dọn. Độ trễ tăng thêm một nhịp quét — relay chạy mỗi phút thì mọi việc chậm thêm tới một phút. Visibility dài cũng có giá ngược lại: worker chết thật thì message nằm ẩn lâu hơn.
- **Khi nào KHÔNG nên dùng:** việc không quan trọng, ví dụ một thông báo đẩy trong ứng dụng — bỏ một cái cũng không sao thì gửi thẳng sau commit đơn giản hơn nhiều. Cũng đừng dùng khi message nằm trong chính cơ sở dữ liệu: lúc đó một transaction là đủ.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao không thể đặt `queue.send` vào trong cùng transaction với `INSERT`?

- **Trả lời mẫu (30–60 giây):** Vì transaction của cơ sở dữ liệu không bao trùm hàng đợi. Hàng đợi không tham gia commit đó nên không rollback theo, và cũng không giữ message lại chờ commit. Muốn một transaction thì phải dùng transaction phân tán, mà ghép chặt hai hệ thống là điều thường không mong muốn.
- **Lỗi hay mắc khi trả lời:** nói "gửi sau commit là an toàn vì commit đã xong". Cách nói đúng: commit xong mà gửi lỗi thì việc đó mất, và không ai biết.

### Câu 2: Outbox vá chiều nào, và vì sao nó không vá được chiều còn lại?

- **Trả lời mẫu (30–60 giây):** Outbox vá chiều mất: message trở thành một hàng trong cùng transaction nên commit xong là chắc chắn có đường để nó ra đời. Nó không vá chiều trùng, vì bước "đánh dấu đã gửi" là một transaction riêng nằm sau khi message đã ra khỏi tay. Relay gửi xong rồi chết trước khi đánh dấu là chuyện bình thường, không phải sự cố hiếm.
- **Lỗi hay mắc khi trả lời:** nói "outbox cho exactly-once". Cách nói đúng: outbox cho at-least-once; exactly-once về kết quả chỉ có khi consumer idempotent.

### Câu 3: Worker nhận cùng một message hai lần. Cần gì để khách chỉ nhận một hoá đơn?

- **Trả lời mẫu (30–60 giây):** Cần một khoá chống trùng được ghi trong cùng transaction với việc nghiệp vụ. Chèn `message_id` vào bảng đã xử lý; khoá chính làm trọng tài nên lần thứ hai nhận lỗi trùng khoá và chỉ xác nhận message. Chỗ đặt khoá quan trọng hơn bản thân khoá: nếu chèn ở transaction riêng thì có khoảng thời gian chết giữa "đã ghi khoá" và "đã gửi hoá đơn".
- **Lỗi hay mắc khi trả lời:** nói "SELECT kiểm tra trước rồi mới chạy là đủ". Cách nói đúng: hai worker cùng `SELECT` sẽ cùng thấy "chưa có" ở mức `READ COMMITTED`, nên chỉ ràng buộc nguyên tử mới chặn được.

### Câu 4: Vì sao vẫn phải giữ visibility timeout dài, dù đã có outbox và consumer idempotent?

- **Trả lời mẫu (30–60 giây):** Vì outbox giải bài toán mất message ở phía ghi, không giải bài toán giao trùng ở phía đọc. Visibility ngắn hơn thời gian xử lý thì message hiện lại giữa lúc worker còn đang chạy. Idempotent làm lần chạy thừa vô hại về kết quả, nhưng không làm nó miễn phí: vẫn tốn CPU, vẫn gọi dịch vụ ngoài. Ở 10.000 message và 15% bị giao lại, đó là 1.500 lần chạy thừa.
- **Lỗi hay mắc khi trả lời:** nói "đã idempotent thì visibility bao nhiêu cũng được". Cách nói đúng: idempotent bảo vệ kết quả, không bảo vệ tài nguyên.

---
## Ghi chú nguồn

- https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html — SQS giao ít nhất một lần, ứng dụng phải idempotent.
- https://microservices.io/patterns/data/transactional-outbox.html — "sent if and only if the transaction commits"; relay có thể publish hơn một lần.
- https://www.postgresql.org/docs/current/sql-select.html — `FOR UPDATE SKIP LOCKED` bỏ qua hàng không khoá được ngay.
