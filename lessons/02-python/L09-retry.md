# L09: Lỗi nào phải sửa dữ liệu, lỗi nào đáng retry

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ vào "Bước 3. Một ví dụ có số" với phép nhân "100 request thành 400" trước khi giải thích vì sao 422 sinh ra **trước** handler. Người đọc chưa có nền để hiểu vì sao gửi lại không đổi kết quả.
- **Thuật ngữ chưa giải thích:** `exponential backoff`, `jitter`, `idempotency key`, `retry storm`, `circuit breaker`, `Retry-After` xuất hiện lần đầu không kèm tiếng Việt trong ngoặc.
- **Thiếu ví von / ví dụ trực diện:** bản cũ không có sơ đồ chữ cho cây quyết định "lỗi này có đáng gọi lại không"; không đặt "Cách tệ" cạnh "Cách tốt" trong cùng một khối.
- **Câu quá dài / khô:** kiểu câu như "Vòng retry được đặt trên mọi mã khác 200, nên nó áp cả cho lỗi dữ liệu và lỗi quyền, hai nhóm mà lần gọi sau không thể khác lần trước." — mệnh đề phụ lồng trong mệnh đề chính.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Dịch vụ đơn hàng gọi API thanh toán của đối tác. Một lập trình viên bọc lời gọi trong vòng retry ba lần cho **mọi** mã trạng thái khác 200. Ý định tốt: hệ thống chịu lỗi hơn.

Ba tuần sau đối tác gửi bảng lỗi:

- **62 phần trăm** request của dịch vụ này là **422**, và mỗi 422 được gửi **bốn lần**.
- Trong một sự cố cấu hình, 100 request nhận **429** và bị đẩy thành **400 request trong cùng một giây**.
- Đối tác hạ hạn mức của dịch vụ xuống.

Log phía mình chỉ ghi `upstream error` và số lần thử. Không có mã trạng thái gốc, nên đội trực không phân biệt được lỗi dữ liệu với lỗi tạm thời. `(Các con số của kịch bản — cần kiểm tra lại trên hệ thống thật.)`

**Câu hỏi dự đoán:** nếu gửi lại **cùng một payload sai**, kết quả mong đợi khác gì lần đầu?

**Đáp án:** không khác gì. Cùng payload sai thì cùng kết quả sai. Retry chỉ có nghĩa khi **lần gọi sau có thể khác lần trước** — tức khi lỗi là tạm thời.

Thuật ngữ dùng trong bài:

- `exponential backoff` — tăng thời gian chờ theo cấp số nhân sau mỗi lần thử lại.
- `jitter` — độ lệch ngẫu nhiên cộng thêm vào thời gian chờ để tránh các máy thử lại cùng một khắc.
- `retry storm` — bão thử lại làm sập hẳn dịch vụ đang yếu.
- `idempotency key` — khóa do phía gọi gửi kèm, để server nhận ra "đây là cùng một giao dịch" và không ghi hai lần.

### 2. Phép ví von đời thường & Sơ đồ chữ

Gửi lại request giống gọi lại tổng đài khi máy bận. Máy bận thì gọi lại có ích. Nhưng nếu bạn **quay sai số** thì gọi lại một nghìn lần vẫn là số sai — chỉ làm tổng đài kẹt thêm.

*Giới hạn của phép ví von:* tổng đài biết bạn là ai; server thì không, trừ khi bạn gửi kèm `idempotency key`.

```text
  response lỗi
      │
      ├── 422, 400 ────→ dữ liệu sai. Sửa payload. KHÔNG gọi lại.
      ├── 401, 403 ────→ credential/quyền sai. Sửa ở phía mình. KHÔNG gọi lại.
      ├── 409 ─────────→ trạng thái đã đổi. Đọc lại rồi quyết. KHÔNG gửi y nguyên.
      ├── 429 ─────────→ tạm thời. Chờ đúng Retry-After rồi gọi lại.
      ├── 5xx ─────────→ tạm thời. Backoff + jitter, có trần số lần.
      └── timeout ─────→ KHÔNG BIẾT server đã ghi hay chưa.
                         Chỉ gọi lại nếu có idempotency key.
                                   │
                    ┌──────────────┴──────────────┐
                    │  mọi client cùng chờ 1s     │  ← không jitter:
                    │  rồi cùng gửi lại           │    dồn thành 1 đỉnh
                    └─────────────────────────────┘
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Kiểm dữ liệu xảy ra ở biên.** FastAPI đọc body theo schema **trước** khi gọi handler. Body sai kiểu hoặc thiếu trường bị trả 422 ngay. Handler không chạy, nên không có tác dụng phụ nào để gọi lại.
- **Bước 2 — Sau biên là quyền.** Nếu handler đã chạy mà vẫn lỗi thì nhóm tiếp theo là 401/403: credential hoặc quyền sai. Sửa ở phía gọi, không phải gọi lại.
- **Bước 3 — 409 là xung đột trạng thái.** Tài nguyên đã đổi từ lúc client đọc. Client phải đọc lại trạng thái rồi quyết định, không gửi lại y nguyên.
- **Bước 4 — Chỉ nhóm tạm thời đáng gọi lại.** Đó là 429, 5xx và timeout. 429 phải tôn trọng `Retry-After`; các lỗi còn lại dùng backoff tăng dần kèm `jitter`. Và timeout chỉ an toàn khi request **idempotent** hoặc mang `idempotency key` — vì timeout không chứng minh server chưa ghi.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** `for attempt in range(MAX_TRIES + 1)` bọc quanh mọi mã khác 200, `time.sleep(1)` cố định. Điều xảy ra: payload sai được gửi 4 lần và nhận 4 lần 422; khi đối tác trả 429 thì 100 request thành 400 trong cùng một giây, đúng lúc họ yêu cầu giảm tải. Lý do hỏng: retry áp cho cả nhóm **không thể khác** ở lần sau, và không có jitter nên mọi client dồn vào một khắc.
- **Cách tốt:** một tập `RETRYABLE = {429, 500, 502, 503, 504}`. Mã ngoài tập đi thẳng ra ngoài bằng `raise_for_status`. Trong tập thì chờ `Retry-After` nếu đối tác gửi, ngược lại `2 ** attempt`, cộng jitter. Mọi request ghi mang `Idempotency-Key`. Lý do giải quyết được: mỗi nhánh lỗi nhận đúng cách xử lý của nó, và lần gọi lại không tạo giao dịch thứ hai.
- **Kiểm chứng bằng code (chạy thật):** mô phỏng trong `lessons/02-python/L09-retry/jitter_sim.py`.

```
python jitter_sim.py
```

Output đã chạy:

```
Mo phong: 200 client cung loi tai t=0; server song lai sau 2.0s,
nhan toi da 50 request/giay; backoff 0.5s * 2^k; toi da 5 lan gui moi client.

khong jitter               tong gui:   950 | dinh 100ms khi thu lai:  200 | xong: 100/200
                           dinh 100ms tinh ca lan dau:  200
co jitter (full jitter)    tong gui:   961 | dinh 100ms khi thu lai:   64 | xong: 148/200
                           dinh 100ms tinh ca lan dau:  250
```

Đọc hai dòng theo đúng một ý: **jitter không giảm tổng số request** (950 so với 961, gần như bằng nhau), nhưng nó **san đỉnh** từ 200 xuống 64 request trong 100 ms, và nhờ vậy số client xong tăng từ 100 lên 148. Đây là toàn bộ giá trị của jitter: không phải gửi ít hơn, mà là không gửi cùng lúc.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** retry có giới hạn cho lỗi tạm thời tăng tỉ lệ thành công khi đối tác chập chờn, không cần người can thiệp. `idempotency key` cho phép gọi lại an toàn.
- **Đánh đổi gì:** mỗi lần retry là thêm tải và thêm độ trễ cho người dùng cuối, nên phải có trần số lần **và** trần tổng thời gian. `idempotency key` cần một bảng lưu key cùng kết quả, cộng logic dọn key cũ. Không retry thì phản hồi nhanh, tải thấp, nhưng một timeout ngắn cũng thành lỗi cho người dùng.
- **Khi nào KHÔNG nên dùng:** đừng retry trên endpoint **không idempotent** mà không có chỗ lưu key — bạn sẽ tạo hai bản ghi. Đừng đặt retry ở **nhiều tầng**: số lần thử là **tích** các vòng, không phải tổng. Đừng retry một 4xx (trừ 429). Đừng dùng retry đồng bộ cho tác vụ dài: đẩy vào SQS, trả 202, để worker retry theo lịch.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao 422 không bao giờ đáng retry?

- **Trả lời mẫu (30–60 giây):** Vì 422 được sinh **trước khi handler chạy**. FastAPI validate body theo schema ở biên; body sai thì response 422 được dựng ngay, handler và mọi tác dụng phụ của nó không chạy. Lần gọi sau với cùng payload đi đúng đường cũ và cho đúng kết quả cũ. Dấu hiệu kiểm chứng: log có cùng một thông báo lỗi trường cho cả bốn lần thử, và handler không xuất hiện trong log. Ngoại lệ duy nhất: nếu client **sinh lại** payload mỗi lần và payload có thể khác đi thì mới có chuyện lần sau đúng.
- **Lỗi hay mắc khi trả lời:** nói "4xx nào cũng không retry" mà không phân biệt 429. Cách nói đúng: 422/400/401/403/409 không retry; **429 thì có**, và phải tôn trọng `Retry-After`.

### Câu 2: 429 khác 5xx ở chỗ nào khi quyết định retry?

- **Trả lời mẫu (30–60 giây):** Cả hai đều tạm thời, nhưng 429 là tín hiệu **do đối tác chủ động gửi** kèm thời điểm được phép thử lại. 429 nói hạn mức đã hết trong cửa sổ hiện tại, và `Retry-After` cho biết sau bao lâu hạn mức mở lại. Vì vậy với 429 tôi đọc header thay vì tự chọn khoảng chờ; với 5xx thì dùng backoff tăng dần. Nếu bỏ qua header và thử theo backoff riêng, các client khác cũng làm vậy và cùng dồn vào một thời điểm. Dấu hiệu: lưu lượng theo giây có các đỉnh trùng nhau sau mỗi khoảng backoff; thêm jitter thì các đỉnh tản ra.
- **Lỗi hay mắc khi trả lời:** nói "429 cũng như 503, cứ backoff là được". Cách nói đúng: nêu rằng `Retry-After` là **thông tin từ phía đối tác**, ưu tiên hơn khoảng chờ tự tính.

### Câu 3: Nếu request ghi dữ liệu bị timeout, làm sao biết có được gọi lại?

- **Trả lời mẫu (30–60 giây):** Từ phía client thì **không biết được**. Timeout chỉ nói client không nhận được phản hồi trong hạn; server có thể đã ghi xong trước khi mất kết nối. Vì vậy tôi chỉ gọi lại khi request mang `idempotency key` hoặc bản thân thao tác idempotent. Với key, server tra key và trả lại kết quả cũ thay vì ghi lần hai; không có key thì mỗi lần gọi là một bản ghi mới. Dấu hiệu kiểm chứng: đếm bản ghi theo khóa nghiệp vụ sau một đợt timeout; lớn hơn số đơn gốc là đã ghi trùng.
- **Lỗi hay mắc khi trả lời:** nói "timeout nghĩa là request chưa tới server". Sai: timeout chỉ là **không có phản hồi**. Cách nói đúng: phân biệt "không tới" với "không biết", rồi nêu điều kiện idempotent.

### Câu 4: Đặt retry ở tầng nào thì hợp lý?

- **Trả lời mẫu (30–60 giây):** Đặt ở **đúng một tầng** sở hữu ngữ cảnh nghiệp vụ, thường là tầng gọi dịch vụ ngoài. Lý do: mỗi tầng có vòng retry riêng thì số lần thử là **tích** của các vòng, không phải tổng — ba tầng, mỗi tầng ba lần, là 27 lần gửi. Nếu hạ tầng bên dưới (SDK, load balancer) đã retry thì tầng trên phải biết và không retry thêm, hoặc phải đặt trần tổng thời gian. Dấu hiệu kiểm chứng: log đối tác cho thấy số lần thử bằng tích các cấu hình; đếm tay trên một request là thấy ngay.
- **Lỗi hay mắc khi trả lời:** nói "retry càng nhiều tầng càng bền". Cách nói đúng: nêu phép **tích**, nêu ví dụ 27 lần, và nêu cách chặn bằng trần tổng thời gian.

---
## Ghi chú nguồn

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After — ngữ nghĩa `Retry-After` và 429.
- https://fastapi.tiangolo.com/tutorial/body/ — kiểm body theo schema trước khi handler chạy (nguồn của 422).
- https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html — Lambda có thể gọi lại, nên handler phải idempotent.
- Đã kiểm trong bài này: chạy `jitter_sim.py` trong `lessons/02-python/L09-retry/`; bảng "khong jitter / co jitter" là output thật của script. Chưa kiểm: số lần retry mặc định của từng dịch vụ AWS; các con số 100 request, ba lần retry, 2 giây `Retry-After` là thông số kịch bản.
