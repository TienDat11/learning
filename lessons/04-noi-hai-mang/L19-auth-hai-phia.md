# L19: Auth xuyên hai phía — token, nơi lưu, interceptor, và ai quyết định quyền

> **Trạng thái:** bản viết lại theo phong cách "vấn đề trước, cơ chế sau". Output ở mục 4 là output thật của script trong `l19/`.
> **Số liệu:** mọi con số là giả định của kịch bản, ghi rõ "giả sử" ở chỗ dùng.

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 bước vào ngay "single-flight" và đoạn `refreshPromise` mà chưa nói vì sao `401` là chuyện của cả phiên chứ không của từng request. Người đọc phải tự suy ra mối liên hệ giữa "xoay vòng token" và "bão refresh".
- **Thuật ngữ chưa giải thích:** `access token`, `refresh token`, `single-flight`, `token rotation`, `HttpOnly`, `SameSite`, `XSS`, `CSRF`, `race condition` xuất hiện lần đầu không kèm ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** cơ chế gộp `401` chỉ được mô tả bằng mười dòng code; không có sơ đồ chữ cho thấy 40 request cùng chờ một Promise.
- **Câu quá dài / khô:** "Vì mỗi 401 lại kích hoạt một vòng thử lại, bão refresh tự nuôi mình: nó chiếm hết connection pool, đẩy p99 của endpoint refresh lên 6,4 giây, và mọi thứ trông như server chậm chứ không như client sai" — một câu bốn mệnh đề.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Giả sử 9h00 thứ Hai, khoảng 1.000 người mở ứng dụng trong vài phút đầu giờ. `access token` (thẻ truy cập ngắn hạn gửi kèm mỗi request) sống 15 phút.

Tới 9h15, gần một nghìn request cùng nhận `401`. Mỗi request tự gọi `/auth/refresh`.

Endpoint refresh xoay vòng token: mỗi lần cấp cặp mới thì `refresh token` (thẻ làm mới dài hạn) cũ chết ngay.

Câu hỏi dự đoán: 1.000 request thì có bao nhiêu lời gọi refresh? Đáp án: 1.024 lời gọi trong một giây, 1 thành công, 1.023 thất bại.

Con số đáng chú ý: không có lỗi `5xx` nào, nên alert không kêu. Pool 20 connection bị chiếm hết, p99 của endpoint refresh lên 6,4 giây.

### 2. Phép ví von đời thường & Sơ đồ chữ

Refresh token giống vé gửi xe có đánh số: mỗi lần bạn quay lại lấy xe, vé cũ bị thu và đổi vé mới. Nếu 40 người cùng cầm bản photo của một vé, chỉ người đầu tiên lấy được xe.

Giới hạn của phép ví von: bãi xe chỉ có một quầy, còn server refresh chịu được nhiều lời gọi đồng thời — cái chết ở đây là vé bị thu, không phải quầy quá tải.

```text
40 request mang access token hết hạn
        │
        ▼
   cả 40 nhận 401
        │
   refreshPromise đã có?
     ┌──┴───┐
    chưa    rồi
     │        │
     ▼        ▼
 tạo 1 lời   chờ chính
 gọi refresh  Promise đó
     │        │
     └───┬────┘
         ▼
  cấp cặp mới, token cũ chết
         │
         ▼
  gắn token mới, gửi lại đúng 1 lần
```

Chỗ nghẽn là nhánh "rồi": nếu không có nó, mỗi request tự mở một lời gọi và chúng giết token của nhau.

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Một token thành hai:** access token sống ngắn và đi kèm mọi request nên dễ lộ nhất; refresh token sống dài và chỉ dùng để đổi token mới. Tách ra vì hai thứ có hai mức rủi ro khác nhau.
- **Bước 2 — Chỗ lưu quyết định thiệt hại:** `localStorage` đọc được bằng mọi JavaScript trong origin, nên một lỗ XSS là mất cả phiên dài hạn. Access token giữ trong RAM, refresh token trong cookie `HttpOnly` (loại cookie JavaScript không đọc được).
- **Bước 3 — `401` là chuyện của cả phiên:** nếu mỗi request tự refresh, số lời gọi tỉ lệ với số request đang bay. Gộp bằng `single-flight` (cơ chế gộp nhiều yêu cầu xin mới token cùng lúc thành đúng 1 lần gọi mạng) thì còn đúng một lời gọi.
- **Bước 4 — Quyền vẫn do backend quyết định:** token hợp lệ chỉ chứng minh danh tính. Mỗi request, FastAPI vẫn phải lọc truy vấn theo danh tính lấy từ token.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** lưu cả hai token trong `localStorage`, và thấy `401` thì gọi refresh ngay trong interceptor của từng request. Hỏng vì `n` request sinh `n` lời gọi, và `token rotation` (xoay vòng thẻ) làm lời đầu giết đúng cái token mà `n-1` lời còn lại đang cầm.
- **Cách tốt:** một biến `refreshPromise` dùng chung, nhả khóa trong `finally`, và một cờ đánh dấu đã replay. Lời gọi đầu tạo Promise; 39 lời còn lại chờ chính Promise đó nên không gọi server lần nào.

**Kiểm chứng bằng code (chạy thật):**

```
cd lessons/04-noi-hai-mang/l19
node refresh_sim.mjs
```

```
=== Chế độ A: không single-flight, replay tối đa 1 lần ===
Lời gọi /auth/refresh                           40
  trong đó thành công                            1
  trong đó bị từ chối (token đã bị xoay vòng)   39
Request thành công                               1
Request thất bại                                39

=== Chế độ B: single-flight, replay tối đa 1 lần ===
Lời gọi /auth/refresh                            1
  trong đó thành công                            1
Request thành công                              40
Request thất bại                                 0

=== Chế độ C: không single-flight, KHÔNG chặn replay (trần an toàn 3 vòng) ===
Lời gọi /auth/refresh                          117
  trong đó thành công                            3
  trong đó bị từ chối (token đã bị xoay vòng)  114
```

Ba khối là ba mức hỏng. A là hỏng vì nhân bản. B là cách đúng. C là hỏng vì không có cờ chặn replay — 117 lời gọi chỉ trong 3 vòng, và trần 3 vòng là giới hạn của script chứ không phải của code thật.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** một lỗ XSS không rút được phiên dài hạn; single-flight biến 1.000 lời gọi thành đúng một; cookie chỉ đi tới đúng một đường dẫn nên bề mặt tấn công hẹp.
- **Đánh đổi gì:** tải lại trang mất access token, nên mỗi lần khởi động phải refresh im lặng — trang đầu chậm thêm một round trip. Nhánh cookie kéo theo CSRF token và ba thuộc tính dễ cấu hình sai.
- **Khi nào KHÔNG nên dùng:** ứng dụng một trang nội bộ không có dữ liệu nhạy cảm, hoặc CLI gọi API bằng token tĩnh do quản trị cấp. Ở đó single-flight chỉ thêm một biến trạng thái mà không cứu được gì.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Bốn mươi request cùng nhận `401`, interceptor dùng một Promise chung. Refresh chạy mấy lần?

- **Trả lời mẫu (30–60 giây):** Đúng một lần. Request đầu thấy biến `refreshPromise` rỗng nên tạo lời gọi và lưu lại; 39 request còn lại thấy nó đã có nên chờ chính Promise đó. JavaScript chạy một luồng, nên không hai request nào cùng lọt qua phép kiểm trước khi biến được gán. Trong mô phỏng, số lời gọi giảm từ 40 xuống 1 và số request thành công tăng từ 1 lên 40.
- **Lỗi hay mắc khi trả lời:** nói "dùng hàng đợi request cũng thế nên chọn cái nào cũng được". Cách nói đúng: hàng đợi cần ai đó nhớ mở cửa ở cả hai nhánh; Promise đã mang sẵn `resolve` và `reject`.

### Câu 2: Vì sao `401` từ chính endpoint `/auth/refresh` không được đưa vào nhánh chờ và gửi lại?

- **Trả lời mẫu (30–60 giây):** Vì `401` ở đó nghĩa là refresh token đã chết, nên mọi lần thử lại đều thất bại theo cùng một cách. Đưa nó vào nhánh chờ biến một lần lỗi thành vòng lặp. Chế độ C trong mô phỏng cho thấy hình dạng vòng đó: 117 lời gọi chỉ trong 3 vòng. Việc phải làm khi refresh trả `401` là đăng xuất, không phải thử lại.
- **Lỗi hay mắc khi trả lời:** nói "mọi 401 đều đáng được refresh". Cách nói đúng: phải phân biệt `401` của request nghiệp vụ với `401` của chính endpoint refresh, thường bằng cách so URL.

### Câu 3: Vì sao để access token trong `localStorage` là chỗ đắt, còn để trong RAM thì phải refresh mỗi lần tải trang?

- **Trả lời mẫu (30–60 giây):** `localStorage` đọc được bằng mọi JavaScript trong origin, nên một lỗ XSS là mất cả phiên dài hạn. RAM thì mã lạ không đọc được, nhưng mất khi tải lại trang, nên phải trả một round trip mỗi lần khởi động. Với access token sống ngắn, mất nó chỉ hại trong khoảng còn lại; với refresh token sống dài, mất nó hại cho tới khi bị thu hồi — nên nó phải nằm trong cookie `HttpOnly`.
- **Lỗi hay mắc khi trả lời:** nói "để trong RAM là an toàn tuyệt đối". Cách nói đúng: mã XSS không đọc được token nhưng vẫn gọi được API bằng phiên đó.

### Câu 4: Một request mang access token hợp lệ vẫn nhận `403`. Vì sao đây không phải lỗi cấu hình?

- **Trả lời mẫu (30–60 giây):** Token hợp lệ chỉ chứng minh danh tính, không chứng minh quyền trên bản ghi cụ thể. Nếu backend chỉ kiểm token rồi trả dữ liệu, người dùng A đổi id trong URL là đọc được dữ liệu của B. Vì vậy câu truy vấn phải lọc theo danh tính, và `403` là kết quả đúng khi bộ lọc không khớp.
- **Lỗi hay mắc khi trả lời:** nói "đã có token thì phải qua được". Cách nói đúng: kiểm danh tính và kiểm quyền là hai bước khác nhau, ở hai chỗ khác nhau.

---
## Ghi chú nguồn

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie — `HttpOnly` chặn đọc qua `document.cookie` nhưng cookie vẫn được gửi kèm request.
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html — không lưu token xác thực trong `localStorage`/`sessionStorage`.
- https://fastapi.tiangolo.com/tutorial/handling-errors/ — cách một lỗi được ném và trả về theo mã.
