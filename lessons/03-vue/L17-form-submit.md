# L17: Form submit — bốn trạng thái, khóa double submit và Idempotency-Key

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu
- **Nhảy bước:** bản cũ nêu `Idempotency-Key` như một khái niệm có sẵn ở bước cơ chế, chưa cho thấy vì sao khóa phải gắn với ý định chứ không với màn hình.
- **Thuật ngữ chưa giải thích:** `Idempotency-Key`, `idempotency`, `inFlight`, `payload`, `409`, `422`, `commit`, `race condition`, `AbortController` xuất hiện lần đầu không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** sơ đồ `stateDiagram` đặt ngay đầu phần cơ chế, không có phép ví von nào và không có cặp Cách tệ / Cách tốt.
- **Câu quá dài / khô:** "Khóa định danh ý định, không định danh request, nên khóa phải sinh khi mở form, giữ nguyên qua các lần thử lại, và chỉ đổi khi ý định đổi" — ba mệnh đề trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)
Giả sử màn hình nhập đơn hàng nội bộ. Nhân viên nhập liên tiếp nhiều đơn trong ca, và một người sinh `idempotencyKey = ref(crypto.randomUUID())` ngay trong `setup` vì tiện.

Đơn thứ nhất thành công lúc 9h00. Đơn thứ hai nhập lúc 9h04, bấm Gửi, và nhận lại đúng mã đơn của đơn thứ nhất. Nhân viên tưởng máy lỗi, bấm lại ba lần, vẫn ra mã đơn cũ.

Ở ca khác, mạng chập và request tạo đơn timeout sau 10 giây (con số giả định của kịch bản — cần kiểm tra lại trên hệ thống thật). Nhân viên bấm Thử lại, lần này thành công; cuối ngày đối chiếu thấy hai đơn giống hệt nhau cho cùng một lần nhập.

Đoán nhanh: lỗi nằm ở nút Gửi hay ở chỗ khóa được sinh? Đáp án: ở chỗ sinh khóa — khóa đang định danh màn hình, không định danh ý định.

### 2. Phép ví von đời thường & Sơ đồ chữ
Quầy lấy số thứ tự: số của bạn định danh lượt bạn cần làm, không định danh số lần bạn gõ cửa. Gõ cửa ba lần với cùng số vé vẫn là một lượt. Giới hạn: quầy phải lưu vé đã xử lý; nếu quên, vé cũ vẫn tạo lượt mới.

```text
idle ──bấm Gửi──→ submitting ──2xx──→ success
                      │
                      └──4xx/5xx hoặc timeout──→ error
                                                   │
                        Thử lại, CÙNG khóa ────────┘
  mở form mới → khóa mới

client: inFlight chặn cú bấm thứ hai
server: cùng khóa + đã xong → trả kết quả cũ
        cùng khóa + đang chạy → 409
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)
- **Bước 1 — bốn trạng thái, không phải hai:** idle, submitting, success, error; mỗi trạng thái quyết định nút có bấm được không, thông báo hiện gì, và có cho gửi tiếp không.
- **Bước 2 — disabled không phải khóa:** nó chỉ có hiệu lực sau khi render lại; khóa thật là một biến thường kiểm ở dòng đầu hàm gửi, trước mọi thứ khác.
- **Bước 3 — khóa định danh ý định:** `Idempotency-Key` (khóa định danh duy nhất cho một thao tác để server không xử lý trùng) sinh khi mở form, giữ nguyên qua các lần thử lại, chỉ đổi khi dữ liệu đổi.
- **Bước 4 — server lưu khóa kèm kết quả:** trùng khóa và request gốc đã xong thì trả kết quả đã lưu; trùng khóa và request gốc đang chạy thì trả 409; dùng lại khóa với payload khác thì trả 422.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)
- **Cách tệ:** sinh khóa trong `setup` và bỏ trống nhánh lỗi — mọi đơn trong phiên màn hình là cùng một ý định, và lần thử lại sinh khóa mới nên tạo đơn thứ hai.
- **Cách tốt:** `key = key ?? crypto.randomUUID()` giữ khóa của ý định khi thử lại; `key = null` trong hàm sửa dữ liệu là chỗ duy nhất đổi ý định; `if (inFlight) return` chặn cú bấm thứ hai.
- **Kiểm chứng bằng code (chạy thật):**
```bash
cd lessons/03-vue/l17 && node idempotency.mjs
```
```text
=== Tình huống 1: bấm Gửi ba lần ===
  Số bản ghi đơn hàng trên server: 1
  Mã đơn: ORD-0001
  lần 1 -> 201, lần 2 -> bị chặn (inFlight), lần 3 -> bị chặn (inFlight)

=== Tình huống 2: timeout rồi Thử lại, giữ nguyên khoá ===
  Số bản ghi đơn hàng trên server: 1
  Mã đơn: ORD-0001

=== Tình huống 3: timeout rồi Thử lại với khoá mới ===
  Số bản ghi đơn hàng trên server: 2
  Mã đơn: ORD-0001, ORD-0002

=== Tình huống 4: request thứ hai tới khi request đầu chưa xong ===
  Số bản ghi đơn hàng trên server: 0
  server trả HTTP 409 — "A request is outstanding for this Idempotency-Key"
```

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng
- **Được gì:** thử lại trở nên an toàn, người dùng bấm lại mà không sợ tạo đơn trùng, trạng thái giao diện luôn khớp lần gửi mới nhất.
- **Đánh đổi gì:** server phải lưu khóa kèm kết quả trong một khoảng thời gian, nên tốn chỗ và cần chính sách hết hạn.
- **Khi nào KHÔNG nên dùng:** không cần khóa server khi thao tác là ghi đè theo khóa chính; không dùng khóa chung cho nhiều dòng trong một lần gửi hàng loạt; không dựa vào validation client để chặn dữ liệu sai.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao vô hiệu hoá nút gửi không phải là idempotency?
- **Trả lời mẫu (30–60 giây):** Vô hiệu nút chỉ chặn một đường bấm trên một tab; nó không chặn request thứ hai tới server. Nút bị vô hiệu sau khi trạng thái render lại, nên hai cú bấm trong cùng khung hình vẫn lọt. Người dùng còn có thể tải lại trang, mở tab khác, hoặc một lớp retry tự động gửi lại khi mạng chập. Lớp còn thiếu là bảng idempotency ở server, lưu khóa kèm kết quả.
- **Lỗi hay mắc khi trả lời:** nói "disabled là đủ nếu bấm chậm"; phải nêu các đường không đi qua nút.

### Câu 2: Request tạo đơn timeout sau 10 giây — kết luận được gì, lần thử lại làm gì?
- **Trả lời mẫu (30–60 giây):** Không kết luận được gì. Timeout chỉ nói client không nhận được phản hồi trong 10 giây, không nói server đã ghi hay chưa. Request có thể đã tới, đã commit, và chỉ phản hồi bị mất trên đường về. Vì vậy lần thử lại phải dùng đúng khóa của ý định đó, để server nhận ra và trả kết quả cũ thay vì tạo bản ghi thứ hai.
- **Lỗi hay mắc khi trả lời:** coi timeout là "chưa xảy ra"; timeout là mất phản hồi, không phải mất thao tác.

### Câu 3: Hai response về lệch thứ tự, lần thứ hai thất bại — giao diện hiển thị gì?
- **Trả lời mẫu (30–60 giây):** Phải hiển thị trạng thái của lần gửi mới nhất, không phải của response về sau cùng. Nếu lần thứ nhất thành công nhưng về sau, còn lần thứ hai thất bại nhưng về trước, người dùng thấy lỗi trong khi đơn đã được tạo. Cách chặn là bộ đếm phiên: mỗi lần gửi tăng số, response chỉ được áp dụng khi số của nó bằng số hiện tại; cộng thêm `AbortController` để hủy request cũ.
- **Lỗi hay mắc khi trả lời:** nói "dùng await là đủ"; await chỉ đảm bảo thứ tự trong một hàm, hai lần gửi là hai hàm song song.

### Câu 4: Validation ở client đã chặn số lượng âm và SKU sai — còn thiếu gì?
- **Trả lời mẫu (30–60 giây):** Thiếu toàn bộ lớp server. Kiểm tra ở client chỉ là trải nghiệm: mã client chạy trên máy người dùng và bị bỏ qua khi ai đó gọi API trực tiếp. Server phải kiểm kiểu dữ liệu, miền giá trị, sự tồn tại của SKU, và quyền của người gọi trên tài nguyên đó — bốn việc khác nhau. Client vẫn nên validate để phản hồi nhanh, nhưng không được là lớp duy nhất.
- **Lỗi hay mắc khi trả lời:** nói "đã có validation ở form nên server không cần"; form không phải ranh giới tin cậy.

---
## Ghi chú nguồn
- https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
- Output: chạy `node idempotency.mjs` trong `lessons/03-vue/l17/`.
