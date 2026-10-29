# L18: Hợp đồng API giữa Vue và FastAPI

> **Trạng thái:** bản viết lại theo phong cách "vấn đề trước, cơ chế sau". Output ở mục 4 là output thật của script trong `l18/`.
> **Số liệu:** mọi con số là giả định của kịch bản, ghi rõ "giả sử" ở chỗ dùng.

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 mở đầu bằng "Pydantic chặn ở biên vào" rồi dùng liền `response_model`, `exception handler`, `openapi.json`. Chưa có bước nào giải thích vì sao body không đáng tin, nên người đọc phải tin trước rồi mới hiểu sau.
- **Thuật ngữ chưa giải thích:** `API contract`, `response_model`, `preflight request`, `envelope`, `correlation id`, `OpenAPI`, `interceptor` xuất hiện lần đầu mà không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** "ba chỗ mà một response phải đi qua" chỉ là ba đoạn văn xuôi, không có sơ đồ chữ. Không có cặp Cách tệ / Cách tốt đặt cạnh nhau.
- **Câu quá dài / khô:** "Vì sao đổi tên một trường trong body mà không đổi mã lại làm vỡ client cũ" là một câu hơn 60 từ, nhồi bốn mệnh đề.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Giả sử 100 nhân viên nội bộ thử tính năng đặt hàng. Một buổi chiều, 37 người bấm Đặt hàng với SKU bị chặn.

Server trả `200` kèm body `{"ok": false, "error": "sku bị chặn"}`. Trình duyệt thấy `res.ok === true`, chạy nhánh thành công, hiện toast xanh.

Dashboard lỗi tính bằng số response có mã `>= 400` chia tổng số response. Tử số bằng 0. Tỉ lệ lỗi không nhích một điểm.

Câu hỏi dự đoán: 37 người đó thấy gì? Đáp án: 37 toast xanh, và 0 đơn được tạo.

Đây là chỗ cần một `API contract` (hợp đồng giao tiếp quy định khuôn dữ liệu và mã trạng thái giữa frontend và backend). Không có nó, hai đầu tự đoán ý nhau.

### 2. Phép ví von đời thường & Sơ đồ chữ

Hợp đồng API giống biên lai chuyển khoản: con số trên biên lai là kết quả, dòng ghi chú chỉ là lời giải thích. Ngân hàng, kế toán và máy đối soát đều đọc con số, không ai đọc ghi chú.

Giới hạn của phép ví von: biên lai giấy không sửa được sau khi in, còn body JSON thì sửa được ở mọi bản deploy — nên hợp đồng phải được sinh ra từ một nguồn, không phải từ kỷ luật của người viết.

```text
Vue ──POST /orders──► Pydantic ──sai hình dạng──► 422 + details từng trường
                          │
                          └─đúng──► Handler ──SKU bị chặn──► 409 + envelope
                                        │
                                        └─tạo mới──► 201 + Location
                                                        │
                              response_model lọc ───────┘
                                        │
                                        ▼
                            Vue đọc status, không đọc tên trường
```

Chỗ nghẽn nằm ở mũi tên đầu tiên: nếu Pydantic không chặn, dữ liệu bẩn đi thẳng vào handler và cơ sở dữ liệu.

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Một response có hai người đọc:** máy đọc mã trạng thái, người đọc câu thông báo. Hai người đọc hai kênh khác nhau, nên chúng có thể nói hai điều trái nhau.
- **Bước 2 — Máy chỉ đọc được mã:** thư viện HTTP, cache, gateway, access log, alert đều phân loại theo mã. Không tầng nào trong số đó đọc trường `ok` trong body.
- **Bước 3 — Vì vậy kết quả phải đi bằng mã:** `201` tạo mới, `409` xung đột nghiệp vụ, `422` sai hình dạng, `403` thiếu quyền. Body chỉ còn chở chi tiết.
- **Bước 4 — Cả hai kênh phải sinh từ một nguồn:** model Pydantic khai báo hình dạng. FastAPI sinh mã, sinh body, sinh `response_model` (khuôn lọc và kiểm tra dữ liệu trả về của FastAPI), và sinh `openapi.json`.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** mọi route trả `200`, kết quả nhét vào `{"ok": false}`. Hỏng vì những tầng bạn không viết chỉ đọc mã; chúng thấy `200` và cho qua.
- **Cách tốt:** ném `HTTPException(status_code=409)`, khai `response_model=OrderOut`, đăng ký một exception handler chung. Mã đúng ngay từ chỗ ném, và trường nội bộ bị cắt ở chiều ra.

**Kiểm chứng bằng code (chạy thật):**

```
cd lessons/04-noi-hai-mang/l18
python -m venv .venv
uv pip install --python .venv/Scripts/python.exe fastapi httpx
.venv/Scripts/python.exe contract_check.py
```

```
=== 1. Tạo mới hợp lệ ===
POST /orders  gửi: {"sku": "abc-1", "qty": 2}
<- 201
Location: /orders/ord-1001
body: {"id": "ord-1001", "sku": "abc-1", "qty": 2}

=== 2. SKU bị chặn ===
POST /orders  gửi: {"sku": "banned-sku", "qty": 1}
<- 409
body: {"code": "sku_blocked", "message": "SKU banned-sku đang bị chặn", "correlation_id": "corr-0001"}

=== 3. Dữ liệu sai hình dạng ===
POST /orders  gửi: {"sku": "abc-1", "qty": 0}
<- 422
body: {"code": "invalid_body", "message": "Body không đúng hình dạng; xem details.", "correlation_id": "corr-0002", "details": [{"field": "body.qty", "msg": "Input should be greater than or equal to 1"}]}

=== 4. Client cũ gửi tên trường cũ ===
POST /orders  gửi: {"sku": "abc-1", "quantity": 2}
<- 422
body: {"code": "invalid_body", "message": "Body không đúng hình dạng; xem details.", "correlation_id": "corr-0003", "details": [{"field": "body.qty", "msg": "Field required"}]}

=== Dùng Location của đơn vừa tạo ===
GET /orders/ord-1001 -> 200
body: {"id": "ord-1001", "sku": "abc-1", "qty": 2}
```

Khối 4 là câu trả lời cho cả bài: đổi tên trường trong body mà không đổi mã vẫn làm vỡ client, và nó vỡ bằng `422` — không có `500`, không có exception nào báo "hợp đồng đã đổi".

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** kết quả thành bại nằm ở một kênh máy đọc; lệch schema bị chặn ở CI; trường nội bộ không lọt ra vì màng lọc là khai báo.
- **Đánh đổi gì:** mỗi trường mới phải trả lời ba câu (bắt buộc hay tuỳ chọn, có lộ ra ngoài không, client cũ chịu được không); hai đội phải phối hợp trước mỗi lần deploy.
- **Khi nào KHÔNG nên dùng:** prototype một người làm cả hai đầu, chưa có người dùng thật, hoặc webhook nội bộ một chiều không ai đọc lại body. Dưới ngưỡng đó, chi phí bảo trì hợp đồng lớn hơn thiệt hại nó ngăn được.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao phải tách 422 và 409 thay vì trả 400 cho mọi lỗi phía client?

- **Trả lời mẫu (30–60 giây):** Mỗi mã là một chỉ thị cho interceptor. `422` nghĩa là sửa được tại chỗ, nên giao diện chiếu mảng `details` vào đúng ô nhập. `409` nghĩa là dữ liệu đúng hình dạng nhưng trạng thái đã đổi, nên phải tải lại trạng thái mới chứ sửa ô nhập vô ích. `400` chỉ dành cho gói tin hỏng ở mức giao thức. Gộp cả ba thành `400` là mất thông tin mà không được gì.
- **Lỗi hay mắc khi trả lời:** nói "400 là lỗi của client nên gộp cũng được". Cách nói đúng: chỉ gộp khi client chỉ hiện một câu chung; hễ client rẽ nhánh theo mã thì mỗi mã phải mang một nghĩa riêng.

### Câu 2: Cùng một route `POST /orders`, ba tình huống: thiếu `qty`, SKU bị chặn, tạo mới thành công. Mã nào cho tình huống nào?

- **Trả lời mẫu (30–60 giây):** Thiếu `qty` là `422`, vì Pydantic chặn ở biên vào trước khi handler chạy. SKU bị chặn là `409`, vì hình dạng đúng nhưng nghiệp vụ từ chối. Tạo mới thành công là `201` kèm header `Location`, để client không phải đoán id từ body. Ba mã dẫn tới ba hành vi giao diện khác nhau nên không gộp được.
- **Lỗi hay mắc khi trả lời:** nói "tạo mới trả 200". Cách nói đúng: `200` là "đã xử lý xong", `201` là "đã sinh ra một tài nguyên có địa chỉ" — chỉ `201` mới đi kèm `Location`.

### Câu 3: Backend đổi tên trường `qty` thành `quantity`, giữ nguyên mọi mã. Client cũ vỡ ở đâu?

- **Trả lời mẫu (30–60 giây):** Vỡ ở bước kiểm dữ liệu vào. Client cũ gửi `quantity`, model mới cần `qty`, và Pydantic mặc định bỏ qua trường lạ. Nên `quantity` biến mất im lặng, `qty` thiếu, và request nhận `422` với `Field required`. Không có `500`, không có exception. Đó chính là định nghĩa của một thay đổi hợp đồng: hình dạng body là một phần của hợp đồng, không chỉ mã.
- **Lỗi hay mắc khi trả lời:** nói "đổi tên trường thì mã cũng phải đổi". Cách nói đúng: mã không đổi, và chính vì mã không đổi nên lỗi mới khó thấy.

### Câu 4: Vì sao phải có `response_model` khi handler đã trả đúng dữ liệu?

- **Trả lời mẫu (30–60 giây):** `response_model` là màng lọc khai báo, không phải kiểm tra thừa. Nó quyết định trường nào được ra ngoài, nên trường nội bộ không lọt chỉ vì người viết handler quên. Trong thí nghiệm, handler trả dict có `internal_note` nhưng body nhận được chỉ có ba trường. Bỏ `response_model` thì `internal_note` thành hợp đồng công khai, và lần sau đổi tên nó lại là một thay đổi hợp đồng ngoài ý muốn.
- **Lỗi hay mắc khi trả lời:** nói "dùng chung model cho cả đầu vào và đầu ra cho gọn". Cách nói đúng: đó là cách phổ biến nhất để trường chỉ nên có ở đầu vào lọt ra đầu ra.

---
## Ghi chú nguồn

- https://fastapi.tiangolo.com/tutorial/response-model/ — `response_model` lọc dữ liệu ra ngoài và sinh JSON Schema.
- https://fastapi.tiangolo.com/tutorial/response-status-code/ — `status_code` là tham số decorator, `201` là "Created".
- https://fastapi.tiangolo.com/tutorial/handling-errors/ — `HTTPException` được `raise`; có thể ghi đè handler của `RequestValidationError`.
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie — thuộc tính cookie dùng ở bài sau.
