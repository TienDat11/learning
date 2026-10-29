# L25: Chọn FastAPI, Django hay Flask theo ba trục — I/O, schema, thành phần có sẵn

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ vào bảng chọn ba framework ở bước cơ chế, trong khi người đọc chưa có lý do để tin ba trục đó là đủ. Thiếu bước "vì sao chỉ ba câu này".
- **Nhảy bước:** sự cố `async def` gọi driver đồng bộ được kể ở bước 3 nhưng cơ chế event loop chỉ xuất hiện ở bước 4 — người đọc phải tự nối hai phần.
- **Thuật ngữ chưa giải thích:** `WSGI`, `ASGI`, `event loop`, `threadpool`, `middleware`, `DI - Dependency Injection`, `Depends`, `OpenAPI`, `Pydantic`, `serializer`, `teardown`, `CPU-bound` / `I/O-bound`.
- **Thiếu ví von / ví dụ trực diện:** "event loop bị chặn" là khái niệm trừu tượng nhất bài, nhưng không có hình ảnh nào cho thấy vì sao 40 request biến thành một hàng đợi.
- **Câu quá dài / khô:** "Async chỉ đổi cách chờ; nếu bên trong vẫn là lời gọi chặn thì nó tệ hơn đồng bộ vì mất luôn khả năng song song thật" — hai mệnh đề nhân quả gộp trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử một endpoint tra cứu đơn hàng chạy 220 ms, trong đó 200 ms là chờ database.

Endpoint được đổi từ `def` sang `async def` để tăng số request xử lý đồng thời. Nhưng driver database vẫn là bản đồng bộ.

Trên máy dev, một request một lúc, nó nhanh hơn khoảng 10 ms. Không ai thấy vấn đề.

Trên production với 40 request đồng thời, p99 lên 6,4 giây và health check bắt đầu timeout.

**Câu hỏi dự đoán:** lúc đó có bao nhiêu kết nối database đang mở?

**Đáp án:** **1**. Uvicorn chạy một `event loop` (vòng lặp sự kiện) trên một worker. Mỗi lần `async def` gọi driver đồng bộ, cả vòng lặp đứng yên đúng bằng thời gian chờ database. Bốn mươi request không chồng lên nhau — chúng xếp hàng sau nhau.

(Mọi con số trong bài là giả định của kịch bản — cần kiểm tra lại trên hệ thống thật.)

### 2. Phép ví von đời thường & Sơ đồ chữ

Một quầy tiếp nhận chỉ có **một nhân viên**. Nếu nhân viên đứng chờ máy fax thay vì bấm nút rồi quay sang việc khác, cả hàng phải chờ theo.

*Giới hạn của phép ví von:* người thật biết mình đang chờ, còn `event loop` chỉ biết nó không có việc gì chạy tiếp.

```text
40 request đồng thời
   ↓
[event loop] ── gọi driver đồng bộ ──→ đứng yên 200 ms
   │                                   │
   ├─ request 2 chờ ───────────────────┤
   ├─ request 3 chờ ───────────────────┤   → p99 = tổng thời gian phía trước
   └─ ... request 40 chờ ──────────────┘
                                        ↓
                              [database] chỉ thấy 1 kết nối
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Trục I/O:** `WSGI` (chuẩn giao tiếp đồng bộ giữa web server và ứng dụng Python) cho một request chiếm một luồng tới khi xong. `ASGI` (chuẩn giao tiếp bất đồng bộ giữa web server và ứng dụng Python) cho phép chờ I/O mà không chiếm luồng.
- **Bước 2 — Trục schema:** FastAPI lấy type hint cộng Pydantic làm hợp đồng. Django lấy model và serializer. Flask để bạn tự chọn.
- **Bước 3 — Trục thành phần có sẵn:** Django có ORM, migration, admin, auth. FastAPI có routing, validation, OpenAPI. Flask gần như chỉ có routing.
- **Bước 4 — Vòng đời request:** `middleware` (lớp bọc trung gian xử lý trước và sau khi request vào hàm chính) chạy trước; `DI - Dependency Injection` (cơ chế tự động khởi tạo và tiêm các thành phần phụ thuộc vào hàm) mở tài nguyên; teardown chạy sau khi response được gửi.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** đổi `def` sang `async def` mà giữ driver đồng bộ, rồi tin rằng đã tăng được concurrency. Nó hỏng vì `def` vốn đã được đẩy sang threadpool — mỗi lời gọi chặn chỉ chiếm một luồng. Chuyển sang `async def` làm lời gọi chặn chiếm cả event loop.
- **Cách tốt:** chọn mô hình I/O theo chỗ request thật sự chờ. Chờ I/O bất đồng bộ thì dùng client async; chờ CPU thì đẩy việc sang worker hoặc hàng đợi.
- **Kiểm chứng bằng code (chạy thật):** script có hai phần — một bảng quyết định chỉ dùng thư viện chuẩn, và một đoạn dùng `fastapi` để in OpenAPI sinh từ type hint. Không có số đo hiệu năng nào trong output.

```text
cd lessons/06-dao-sau/l25
uv venv --python <đường dẫn python3> .venv
uv pip install --python .venv/Scripts/python.exe fastapi
./.venv/Scripts/python.exe framework_axes.py
```

Kết quả chạy trên máy này (fastapi 0.162.0):

```text
========== A. Bảng quyết định theo ba trục ==========
Số request mỗi giây chỉ là giả định của kịch bản.

--- Đầu vào mẫu: API tra cứu cho mobile ---
  Trục 1 — request chờ gì:            io-mang
  Trục 2 — schema lấy từ đâu:         type-hint
  Trục 3 — thành phần muốn có sẵn:    không có
  Giả sử có 120 request mỗi giây.
  => Chọn: FastAPI
  Cái giá: Routing, validate và OpenAPI có sẵn; đổi lại bạn tự dựng ORM, migration, admin và auth, và tự chọn driver bất đồng bộ đúng.

--- Đầu vào mẫu: Bảng điều khiển nội bộ cho vận hành ---
  Trục 1 — request chờ gì:            io-db
  Trục 2 — schema lấy từ đâu:         db-model
  Trục 3 — thành phần muốn có sẵn:    admin, orm, migration, auth
  Giả sử có 15 request mỗi giây.
  => Chọn: Django
  Cái giá: ORM, migration, admin, auth có sẵn; đổi lại mọi thứ đi kèm một quan điểm, và bẻ quan điểm đó thường đắt hơn viết từ đầu.

--- Đầu vào mẫu: Service nhỏ nén ảnh, hai endpoint ---
  Trục 1 — request chờ gì:            cpu
  Trục 2 — schema lấy từ đâu:         tu-chon
  Trục 3 — thành phần muốn có sẵn:    không có
  Giả sử có 5 request mỗi giây.
  => Chọn: Flask
  Cái giá: Tự do tối đa, ghép thư viện theo ý; đổi lại bộ khung tự chế luôn thiếu người bảo trì và bạn tự chịu mọi ranh giới.

========== B. OpenAPI sinh từ type hint ==========
fastapi 0.162.0
Đường dẫn có trong hợp đồng: ['/orders/{order_id}']
Tham số của route, sinh từ chữ ký hàm:
  order_id   in=path   required=True schema={"type": "integer", "title": "Order Id"}
  tenant     in=query  required=True schema={"type": "string", "description": "M\u00e3 tenant, b\u1eaft bu\u1ed9c theo h\u1ee3p \u0111\u1ed3ng", "title": "Tenant"}
  chi_tiet   in=query  required=False schema={"type": "boolean", "default": false, "title": "Chi Tiet"}
Schema của response, sinh từ model Pydantic:
{
  "properties": {
    "id": {
      "type": "integer",
      "title": "Id"
    },
    "code": {
      "type": "string",
      "title": "Code"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "total": {
      "type": "number",
      "title": "Total"
    }
  },
  "type": "object",
  "required": [
    "id",
    "code",
    "status",
    "total"
  ],
  "title": "OrderOut"
}
Kiểu trả về khai báo trong type hint: OrderOut
Số dòng tài liệu phải viết tay: 0 (mọi thứ trên đây sinh từ khai báo type).
```

Ba chỗ đáng đọc kỹ:

- **`Đường dẫn có trong hợp đồng`** là thứ client đọc được, và nó bằng đúng chuỗi trong `@app.get`.
- **`tenant` là `required=True`** chỉ vì nó có `= Query(...)` không kèm giá trị mặc định. Hợp đồng đổi theo chữ ký hàm, không theo tài liệu.
- **`chi_tiet` có `"default": false`** vì kiểu là `bool` với mặc định `False`. Client gửi `?chi_tiet=maybe` sẽ bị chặn trước khi thân hàm chạy.

Giới hạn: bảng quyết định là luật do bài này đặt ra, không phải khuyến nghị chính thức của dự án nào. Phần B chỉ chứng minh OpenAPI sinh từ type hint — không nói gì về tốc độ.

Một chi tiết thứ tự dễ nói sai khi phỏng vấn: trong FastAPI, `solve_dependencies` chạy **trước** `request_body_to_args`. Nghĩa là dependency được mở trước khi body được validate.

**Tự thử:** đổi `chi_tiet: bool = False` thành `chi_tiet: bool = Query()` rồi chạy lại. `required` thành gì, và vì sao?

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** Django cho admin, auth, migration, ORM trong một lần cài nên tuần đầu rất nhanh. FastAPI cho code nhỏ và hợp đồng rõ. Flask cho tự do tối đa.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** mọi thứ đi kèm một quan điểm, và bẻ quan điểm đó thường đắt hơn viết từ đầu. Chọn FastAPI thì bạn tự dựng auth, migration, admin. Chọn Flask thì bộ khung tự chế luôn thiếu người bảo trì.
- **Khi nào KHÔNG nên dùng:** đừng chọn FastAPI khi driver chưa có bản async — bạn sẽ có đúng sự cố ở đầu bài. Đừng chọn FastAPI khi cần admin ngay tuần đầu. Đừng chọn Django khi mọi request đều chờ dịch vụ ngoài. Đừng chọn Flask cho hệ thống nhiều người bảo trì. Và đừng dùng framework nào khi chỉ có một hai endpoint đơn giản.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao `async def` gọi driver đồng bộ lại tệ hơn `def`?

- **Trả lời mẫu (30–60 giây):** Vì `def` bị đẩy sang `threadpool` (bể luồng) nên một lời gọi chặn chỉ chiếm một luồng, các request khác vẫn được phục vụ. Còn `async def` chạy trên event loop nên lời gọi chặn khoá luôn mọi request đang chờ. Kết quả là p99 bằng tổng thời gian các request phía trước. Dấu hiệu kiểm chứng: p99 tăng theo concurrency trong khi CPU thấp và số kết nối database bằng 1.
- **Lỗi hay mắc khi trả lời:** nói "async nhanh hơn" mà không nói nhanh hơn khi nào. Cách nói đúng: nêu điều kiện — driver chưa có bản async và trong thân hàm không có `await`.

### Câu 2: Service dành 90% thời gian chờ một dịch vụ ngoài, chọn gì?

- **Trả lời mẫu (30–60 giây):** Tôi chọn FastAPI với client async, vì đó đúng là hình dạng mà ASGI có lợi: chờ I/O không chiếm luồng nên một worker phục vụ được nhiều request đồng thời. Điều kiện là client của dịch vụ ngoài có bản async và tôi đặt giới hạn concurrency để không dội hàng loạt request sang dịch vụ đó. Dấu hiệu kiểm chứng: p99 gần như phẳng khi tăng concurrency.
- **Lỗi hay mắc khi trả lời:** bỏ qua việc đặt trần cho dịch vụ phía sau. Cách nói đúng: nếu p99 vẫn tăng tuyến tính thì trong đường đi còn một lời gọi chặn.

### Câu 3: Schema lấy từ type hint khác schema lấy từ model ở chỗ nào?

- **Trả lời mẫu (30–60 giây):** Type hint đặt hợp đồng HTTP ở tầng giao diện, nên nó mô tả đúng cái client gửi và nhận, và sinh OpenAPI trực tiếp. Model đặt hợp đồng ở tầng lưu trữ, nên schema database là gốc và API là hình chiếu của nó. Cái giá của cách thứ hai là hợp đồng dễ lệch khỏi cái client cần; cái giá của cách thứ nhất là bạn phải tự nối nó xuống database. Kiểm bằng cách diff OpenAPI giữa hai bản deploy.
- **Lỗi hay mắc khi trả lời:** nói FastAPI "tự sinh tài liệu nên không cần schema". Cách nói đúng: OpenAPI chỉ mô tả hợp đồng HTTP, không mô tả schema database.

### Câu 4: Workload là nén ảnh. Chọn gì, và vì sao không phải async?

- **Trả lời mẫu (30–60 giây):** Nén ảnh là CPU-bound nên async không giúp gì: event loop chỉ có một luồng và mọi phép tính đều chiếm nó. Lựa chọn đúng là đẩy việc sang worker riêng hoặc hàng đợi, còn tầng HTTP chỉ nhận việc và trả về ngay. Framework nào cũng được, miễn là không chặn vòng lặp. Dấu hiệu: CPU chạm trần cùng lúc p99 tăng.
- **Lỗi hay mắc khi trả lời:** khuyên tăng số worker của framework là xong. Cách nói đúng: thời gian xử lý tỉ lệ với số ảnh chứ không với số request đồng thời, nên phải tách phần tính toán khỏi tiến trình phục vụ HTTP.

---
## Ghi chú nguồn

- https://fastapi.tiangolo.com/features/ — FastAPI dựa trên OpenAPI để mô tả API và JSON Schema cho model dữ liệu; tài liệu tương tác sinh từ đó; dựa trên khai báo kiểu chuẩn của Python qua Pydantic; có hệ thống dependency injection theo đồ thị.
- https://docs.djangoproject.com/en/5.2/topics/migrations/ — `makemigrations` đóng gói thay đổi model thành file migration, `migrate` áp chúng vào database; migration là hệ thống quản lý phiên bản cho schema.
- Script `lessons/06-dao-sau/l25/framework_axes.py` và output ở Phần 2 mục 4: chạy thật trong phiên này với fastapi 0.162.0.

Chưa kiểm trong bài: tài liệu Flask (mọi câu về Flask ở mức hiểu biết chung); hành vi threadpool mặc định của FastAPI ở mức số đo; tài liệu Starlette về ASGI; bất kỳ benchmark nào giữa ba framework. Số request, độ trễ và p99 trong bài là kịch bản giả định.
