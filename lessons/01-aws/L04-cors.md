# L04: Vì sao curl trả 200 mà trình duyệt vẫn chặn request

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 3 kết luận "hai request: một OPTIONS rồi một GET thật" trước khi bài nói `preflight request` (request OPTIONS trình duyệt gửi thăm dò trước) là gì và vì sao chỉ một số request cần nó. Bước 4 mục 4 thả cùng lúc sáu header `Access-Control-*` mà không nói header nào là bắt buộc, header nào là tuỳ chọn.
- **Thuật ngữ chưa giải thích:** `origin`, `preflight request`, `simple request`, `safelisted header`, `credentials`, `Access-Control-Max-Age`, `Access-Control-Expose-Headers`, `Vary`, `reject`. Chữ "origin" được dùng xuyên bài mà chưa có một dòng định nghĩa.
- **Thiếu ví von / ví dụ trực diện:** không có phép ví von nào cho ý "server trả lời, trình duyệt mới là bên chặn". Sơ đồ là `mermaid sequenceDiagram`, không đọc được ở nhiều nơi. Cách tệ và Cách tốt chỉ tồn tại trong `naiveCode` của app, không nằm cạnh nhau trong bài.
- **Câu quá dài / khô:** câu "Với API Gateway, header CORS phải có trên cả response preflight do gateway tạo và response thật do integration trả về." gộp hai vế đối lập trong một dòng, đúng chỗ người đọc dễ bỏ sót nhất. Đoạn về `Access-Control-Expose-Headers` cũng nhồi ba ý liền.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử giao diện chạy ở `app.example.com`, API ở `api.example.com`. Trang gọi `fetch` tới API kèm header `Authorization`.

Bạn thử bằng `curl` trên máy mình: 201, body JSON đúng như mong đợi. Ba ngày liền, 100 phần trăm số lần thử đều 201.

Nhưng trên trình duyệt, nút bấm không làm gì. Console hiện một dòng đỏ. Tab Network cho thấy request đã đi, server đã trả 201, và trình duyệt vẫn nói không đọc được.

Đau ở đâu? Đau ở chỗ **hai công cụ nói hai chuyện khác nhau, và cả hai đều đúng**. `curl` không bị chặn. Trình duyệt bị chặn. Bạn sẽ mất hàng giờ nếu đi sửa server, vì server không làm gì sai.

**Câu hỏi dự đoán:** Server trả 200 kèm body đầy đủ nhưng thiếu header `Access-Control-Allow-Origin`, code giao diện nhận được gì?
**Đáp án:** `fetch` bị reject. Không có status, không có body. Code thấy một lỗi mạng, dù server đã trả 200.

### 2. Phép ví von đời thường & Sơ đồ chữ

Bạn nhờ một người bạn qua văn phòng bên cạnh lấy hồ sơ. Văn phòng đưa hồ sơ cho người bạn — họ không có lý do gì để từ chối. Nhưng người bạn chỉ được phép đưa hồ sơ cho bạn nếu văn phòng có ghi rõ tên bạn trong giấy uỷ quyền. Không có tên, người bạn giữ hồ sơ lại và nói: "tôi không được phép đưa cái này cho cậu".

Trong ví dụ này, `curl` là **bạn tự đi lấy**. Không có người bạn nào đứng giữa, nên không ai kiểm giấy uỷ quyền.

*Giới hạn của phép ví von:* người bạn trong ví dụ "quyết định"; còn trình duyệt chỉ so chuỗi ký tự theo một luật cố định, không suy xét gì.

```text
Trang ở origin A: https://app.example.com
API  ở origin B: https://api.example.com

1) PREFLIGHT (hỏi trước, chỉ khi cần)
   trình duyệt ──OPTIONS /files──► server B
                Origin: https://app.example.com
                Access-Control-Request-Method: POST
                Access-Control-Request-Headers: authorization
   trình duyệt ◄──204 + Access-Control-Allow-Origin: https://app.example.com── server B
                     (thiếu header này ⇒ DỪNG, không gửi request thật)

2) REQUEST THẬT
   trình duyệt ──POST /files──► server B ──► 201 + Access-Control-Allow-Origin
   trình duyệt: header có khớp origin không?
        ├── khớp    → cho JavaScript đọc body
        └── không   → CHẶN việc đọc; fetch reject; server vẫn ghi log 201
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — `origin` là ba thứ cộng lại:** scheme, host và port. `https://app.example.com` và `https://api.example.com` là hai origin khác nhau, dù cùng tên miền gốc. Khác origin thì mặc định bị coi là không tin nhau.
- **Bước 2 — Mặc định trình duyệt không cho trang này đọc response từ origin khác:** đây là luật bảo vệ người dùng: một trang lạ không được đọc dữ liệu của bạn từ một API mà trình duyệt đang giữ cookie.
- **Bước 3 — Server có thể nới luật đó bằng header:** `Access-Control-Allow-Origin` nói origin nào được đọc. Đây là lời khai của server, không phải một lệnh chặn.
- **Bước 4 — Với request "không đơn giản", trình duyệt hỏi trước:** nếu method không phải GET/POST/HEAD, hoặc có header lạ như `Authorization`, hoặc content type lạ, trình duyệt gửi `preflight request` bằng method OPTIONS. Nó chỉ gửi request thật khi preflight được trả lời hợp lệ.
- **Bước 5 — Preflight và request thật là hai response khác nhau, có thể do hai nơi sinh ra:** với API Gateway, response preflight có thể do gateway tạo, còn response thật do hàm của bạn trả. Cả hai đều phải có header. Sửa một chỗ là sửa một nửa.
- **Bước 6 — Khi request mang cookie hoặc credential, không được dùng `*`:** `Access-Control-Allow-Origin` phải là đúng origin của trang, kèm `Access-Control-Allow-Credentials: true`. Dấu sao chỉ dùng được khi không có credential.
- **Bước 7 — CORS không phải xác thực:** nó không chặn `curl`, không chặn script trên máy chủ, không chặn ai biết cách gửi HTTP. Nó chỉ chặn **trình duyệt** cho JavaScript đọc response. Vì vậy server vẫn phải tự kiểm tra quyền.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** chỉ bật CORS cho preflight ở gateway, rồi tin rằng đã xong.

```text
# Cấu hình sai điển hình trên API Gateway (mô tả, không phải lệnh chạy được):
#   - bật CORS ở phần gateway cho route OPTIONS
#   - hàm trả response thật mà không thêm header nào
```

Điều gì xảy ra: preflight qua, request thật đi, server trả 201, rồi trình duyệt chặn ở bước đọc vì response thật thiếu header. Triệu chứng rất khó chịu: lần đầu sửa thì "gần được", và bạn tưởng lỗi nằm ở chỗ khác.

Vì sao hỏng: bạn chỉ sửa một trong hai response. Trình duyệt kiểm cả hai, ở hai thời điểm khác nhau.

- **Cách tốt:** khai báo header ở một chỗ duy nhất, và cho cả hai nhánh dùng chung.

```python
ALLOWED = {"https://app.example.com"}

def cors_headers(origin: str) -> dict:
    if origin not in ALLOWED:                 # chỉ echo origin đã biết
        return {}
    return {
        "Access-Control-Allow-Origin": origin,   # đúng origin, không dùng "*"
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-tenant-id",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin",                        # cache không trộn hai origin
    }
```

Vì sao đúng: một hàm duy nhất sinh header, nên preflight và response thật không thể lệch nhau. Echo đúng origin thay vì `*` nên dùng được cả khi có cookie. `Vary: Origin` bảo cache đừng trả response của origin này cho origin khác.

- **Kiểm chứng bằng code (chạy thật):** chạy trong `lessons/01-aws/l04/`. Script dựng hai server cục bộ, một cái không gửi header CORS, một cái có, rồi tự gọi `curl -i` và in nguyên văn phần server trả về.

```bash
python cors_demo.py
```

```text
========================================================================
Server 1: không gửi header CORS (port 8801)
$ curl -i -X OPTIONS -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: x-tenant-id' http://127.0.0.1:8801/files
------------------------------------------------------------------------
HTTP/1.0 204 No Content
Server: BaseHTTP/0.6 Python/3.14.3
Date: Thu, 29 Oct 2026 06:43:09 GMT

========================================================================
Server 2: có gửi header CORS (port 8802)
$ curl -i -X OPTIONS -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: x-tenant-id' http://127.0.0.1:8802/files
------------------------------------------------------------------------
HTTP/1.0 204 No Content
Server: BaseHTTP/0.6 Python/3.14.3
Date: Thu, 29 Oct 2026 06:43:09 GMT
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: x-tenant-id, content-type
Access-Control-Max-Age: 600
Vary: Origin

========================================================================
Request thật (POST) tới server 2: server chạy xong, trả 201
$ curl -i -X POST -H 'Origin: http://localhost:5173' -H 'x-tenant-id: t-1' -H 'Content-Type: application/json' -d '{"name":"a"}' http://127.0.0.1:8802/files
------------------------------------------------------------------------
HTTP/1.0 201 Created
Server: BaseHTTP/0.6 Python/3.14.3
Date: Thu, 29 Oct 2026 06:43:09 GMT
Content-Type: application/json
Content-Length: 11
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: x-tenant-id, content-type
Access-Control-Max-Age: 600
Vary: Origin

{"ok":true}

Ghi chú: cả bốn khối trên đều do curl in ra. curl không có origin,
không hỏi trước và không thi hành CORS, nên nó không bao giờ thấy lỗi chặn.
```

Đọc hai khối đầu: cả hai đều trả **204**. Khác biệt duy nhất là bốn header. Trình duyệt nhận 204 từ server 1 sẽ dừng và không gửi `POST`. Với `curl`, hai response này chỉ là hai chuỗi byte, và **không có gì bị chặn** — đúng như dòng ghi chú cuối output.

**Giới hạn của thí nghiệm:** `curl` chứng minh server gửi gì. Việc trình duyệt chặn việc đọc response là hành vi của trình duyệt, và `curl` không tái hiện được. Muốn thấy, phải mở trang thật và đọc console cùng tab Network.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** CORS cho phép giao diện ở một origin gọi API ở origin khác, mà vẫn giữ được lá chắn mặc định cho những trang không được phép.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** preflight là thêm một vòng khứ hồi cho mỗi request không đơn giản, trừ khi bạn dùng `Access-Control-Max-Age` để cache. Khai báo header ở hai nơi (gateway và hàm) là hai chỗ có thể lệch nhau. Dùng `*` thì đơn giản nhưng không dùng được với credential.
- **Khi nào KHÔNG nên dùng:** đừng mở CORS cho mọi origin nếu API có dữ liệu người dùng — hãy echo đúng origin trong danh sách cho phép. Đừng dựa vào CORS để bảo vệ API khỏi người gọi không phải trình duyệt; nó không làm được việc đó. Và đừng thêm CORS khi hai bên cùng một origin — trình duyệt không kiểm tra gì trong trường hợp đó.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao `curl` trả 200 mà trình duyệt vẫn báo lỗi?

- **Trả lời mẫu (30–60 giây):** Vì CORS là luật do trình duyệt thi hành, không phải do server. `curl` không có origin, không gửi preflight và không kiểm header, nên nó thấy đúng những byte server gửi. Trình duyệt thì kiểm `Access-Control-Allow-Origin` trước khi cho JavaScript đọc body. Thiếu header đó, nó chặn việc đọc dù server đã trả 200 và đã ghi log 200.
- **Lỗi hay mắc khi trả lời:** nói "server chặn request". Cách nói đúng: request đã tới và đã được xử lý; chỗ bị chặn là bước đọc response.

### Câu 2: Khi nào trình duyệt gửi preflight, và nó hỏi những gì?

- **Trả lời mẫu (30–60 giây):** Khi request không thuộc nhóm đơn giản: method khác GET/POST/HEAD, hoặc có header lạ như `Authorization`, hoặc content type lạ. Preflight là một request OPTIONS mang `Origin`, `Access-Control-Request-Method` và `Access-Control-Request-Headers`. Server trả lời bằng các header `Access-Control-Allow-*`. Chỉ khi câu trả lời khớp thì trình duyệt mới gửi request thật. `Access-Control-Max-Age` giữ kết quả đó trong cache để khỏi hỏi lại mỗi lần.
- **Lỗi hay mắc khi trả lời:** nói preflight mang luôn token xác thực. Cách nói đúng: preflight không mang credential của ứng dụng; nó chỉ mô tả request sắp gửi.

### Câu 3: API dùng cookie thì có dùng được `Access-Control-Allow-Origin: *` không?

- **Trả lời mẫu (30–60 giây):** Không. Khi request mang credential, `Access-Control-Allow-Origin` phải là đúng origin của trang, không được là dấu sao. Ngoài ra phải có `Access-Control-Allow-Credentials: true`, và phía `fetch` phải đặt `credentials: "include"`. Dấu sao chỉ hợp lệ khi không có credential. Vì vậy tôi thường echo lại origin sau khi kiểm nó nằm trong danh sách cho phép, và thêm `Vary: Origin` để cache không trộn response của hai origin.
- **Lỗi hay mắc khi trả lời:** chỉ sửa `Access-Control-Allow-Origin` mà quên `Access-Control-Allow-Credentials`. Cách nói đúng: thiếu một trong hai thì trình duyệt vẫn chặn.

### Câu 4: Sửa CORS ở đâu khi API chạy sau API Gateway?

- **Trả lời mẫu (30–60 giây):** Ở cả hai chỗ sinh response. Response preflight có thể do gateway tạo, response thật do hàm trả. Nếu chỉ bật CORS cho route OPTIONS thì preflight qua mà request thật vẫn bị chặn. Cách tôi làm là để một hàm duy nhất sinh header rồi dùng cho mọi nhánh, kể cả nhánh lỗi. Kiểm chứng bằng cách gọi thử một request lỗi và xem response lỗi có header không.
- **Lỗi hay mắc khi trả lời:** quên nhánh lỗi. Cách nói đúng: response 4xx và 5xx cũng cần header, nếu không giao diện không đọc được thông báo lỗi.

---
## Ghi chú nguồn

- MDN — CORS (khái niệm và luật của trình duyệt): https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Fetch Standard — CORS protocol và preflight: https://fetch.spec.whatwg.org/
- MDN — `Access-Control-Allow-Origin`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
- MDN — `Access-Control-Max-Age`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
- API Gateway — CORS cho REST API: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html

Các con số trong bài (ba ngày, 100 phần trăm, cổng 8801/8802, `Max-Age` 600) là giả định của kịch bản hoặc của script — cần kiểm tra lại trên hệ thống thật. Khối output ở mục 4 là output thật của `cors_demo.py`, ghi lại từ lần chạy trên máy; dòng `Date` thay đổi theo lần chạy.
