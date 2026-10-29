# L16: Vue Router — matcher, guard và việc component được tạo sau cùng

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu
- **Nhảy bước:** bản cũ đưa ngay "12 bước của navigation resolution flow" vào phần cơ chế, trong khi chưa giải thích vì sao điều hướng lại là một đường ống bất đồng bộ.
- **Thuật ngữ chưa giải thích:** `route record`, `matcher`, `params`, `navigation guard`, `pending`, `redirect`, `RouterView`, `createMemoryHistory` xuất hiện lần đầu không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** sơ đồ mermaid dài 11 nút, không có phép ví von nào; cặp Cách tệ / Cách tốt không được đặt cạnh nhau.
- **Câu quá dài / khô:** "Matcher chọn route record trước, guard quyết định sau, và component chỉ được tạo khi mọi guard đã đồng ý — nên đổi params không tạo instance mới" — ba mệnh đề nối bằng dấu phẩy.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)
Giả sử khung chi tiết đơn hàng nằm ở đường dẫn `/orders/:id`. Nhân viên duyệt đơn 4821 rồi bấm sang 4822 trong danh sách bên cạnh.

URL đổi ngay sang 4822, nhưng panel vẫn hiện dữ liệu của 4821: cùng một route record nên component được dùng lại, và đoạn nạp dữ liệu đã chốt `route.params.id` vào một biến lúc `setup`.

Không có request mới nào được gửi. Giả sử trong hai ngày, chín đơn bị duyệt nhầm người vì nhân viên tin vào tiêu đề trên màn hình (con số giả định của kịch bản — cần kiểm tra lại trên hệ thống thật).

Ở màn hình khác, `navigation guard` (hàm chặn kiểm tra trước khi chuyển trang) chặn được người dùng thường vào trang quản trị, cho tới khi có người gọi thẳng API bằng curl và nhận 200. Đoán nhanh: lỗi thứ hai có phải lỗi router? Đáp án: không, đó là nhầm vai của guard.

### 2. Phép ví von đời thường & Sơ đồ chữ
Sân bay: bạn qua quầy vé, kiểm tra an ninh, cửa boarding, rồi mới lên máy bay. Không ai lên máy bay trước khi xong thủ tục. Giới hạn: ở sân bay thủ tục để chặn người; ở đây guard chỉ quyết định màn hình nào được dựng, còn quyền thật do backend kiểm.

```text
URL đổi
  ↓
matcher: URL → route record + params
  ↓
beforeRouteLeave → beforeEach → beforeRouteUpdate (nếu dùng lại instance)
  ↓
beforeEnter của route đích → tải component lười
  ↓
beforeRouteEnter (chưa có this) → beforeResolve
  ↓
afterEach → tạo component → cập nhật DOM

cùng route record → dùng lại instance → setup KHÔNG chạy lại
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)
- **Bước 1 — resolve trước tiên:** matcher so đường dẫn với bảng route để ra route record cùng params; bước này chưa tạo component nào, và kiểm được bằng `router.resolve`.
- **Bước 2 — guard chạy theo thứ tự cố định:** leave, rồi `beforeEach` toàn cục, rồi `beforeEnter` của route đích, rồi `beforeResolve`; điều hướng ở trạng thái chờ cho tới khi mọi hook xong.
- **Bước 3 — ba kết cục:** trả true hoặc undefined để đi tiếp; false để huỷ và giữ URL cũ; trả một vị trí mới để redirect, và lần resolve bắt đầu lại từ bước một.
- **Bước 4 — component được tạo sau cùng:** chỉ params đổi thì không có `setup` mới, nên phải nạp lại bằng watch params kèm hủy request, hoặc buộc tạo mới bằng `:key` trên `router-view`.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)
- **Cách tệ:** `const id = route.params.id` ở đầu `setup` rồi gọi API một lần. Đổi id thì không có gì chạy, vì instance được dùng lại; không có exception nào.
- **Cách tốt:** `watch(() => route.params.id, load, { immediate: true })` cộng `onCleanup(() => ctrl.abort())`, để mỗi id có đúng một request và request cũ bị hủy.
- **Kiểm chứng bằng code (chạy thật):**
```bash
cd lessons/03-vue/l16 && node router-reuse.mjs
```
```text
Nhật ký sự kiện, đúng thứ tự đã chạy:
  beforeEach -> /orders/4821
  afterEach -> /
  beforeEnter -> 4821
  beforeResolve -> /orders/4821
  afterEach -> /orders/4821
  setup (instance #1)
  load dữ liệu cho 4821
  onMounted (instance #1)
  === chuyển sang 4822 ===
  beforeEach -> /orders/4822
  beforeRouteUpdate -> 4822
  beforeResolve -> /orders/4822
  afterEach -> /orders/4822
  load dữ liệu cho 4822

Số lần component OrderDetail được tạo: 1
Số lần hook nạp dữ liệu chạy:        2
URL cuối cùng:                       /orders/4822
```

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng
- **Được gì:** URL là state công khai, copy được, back được; guard cho một chỗ duy nhất để quyết định điều hướng.
- **Đánh đổi gì:** mỗi lần điều hướng là một chuỗi bất đồng bộ, nên phải tự lo trạng thái tải, hủy request và xử lý lỗi ở đúng lớp.
- **Khi nào KHÔNG nên dùng:** không đặt `:key` trên router-view khi cần giữ vị trí cuộn hay bộ lọc phụ; không nạp dữ liệu lớn trong guard; không dùng guard để phân quyền thật; không đặt dữ liệu nhạy cảm trong query param.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Một lần điều hướng đi qua những bước nào, component được tạo ở bước nào?
- **Trả lời mẫu (30–60 giây):** Matcher chọn route record trước, rồi guard chạy, và component chỉ được tạo sau khi guard cho đi tiếp. Bước đầu là resolve: URL được so với bảng route để ra route record cùng params. Sau đó guard chạy theo thứ tự: `beforeRouteLeave`, `beforeEach` toàn cục, `beforeEnter` của route đích, `beforeResolve`. Cuối cùng component mới được tạo, và `beforeRouteEnter` chạy khi chưa có instance.
- **Lỗi hay mắc khi trả lời:** nói "component được tạo rồi guard kiểm tra"; sai thứ tự đó dẫn tới thiết kế sai.

### Câu 2: Guard kiểm tra vai trò trước khi vào trang quản trị — vì sao không phải authorization?
- **Trả lời mẫu (30–60 giây):** Đó là trải nghiệm điều hướng, không phải kiểm soát truy cập, vì mã chạy trên máy người dùng và sửa được. Người dùng mở devtools, sửa state, hoặc gọi thẳng endpoint bằng curl; guard không chạy trong cả ba trường hợp. Thứ thật sự chặn là backend kiểm token ở mỗi request và kiểm quyền trên từng tài nguyên.
- **Lỗi hay mắc khi trả lời:** nói "guard là authorization phía client"; nó chỉ là lớp trải nghiệm, quyền phải kiểm ở backend.

### Câu 3: Đổi từ /orders/4821 sang /orders/4822 thì component có được tạo lại không?
- **Trả lời mẫu (30–60 giây):** Không tạo lại: cùng route record nên instance được dùng lại. Router chạy `beforeRouteUpdate` rồi cập nhật `route.params`; mọi thứ đã chốt trong `setup` vẫn là dữ liệu của đơn trước. Request cũ nếu không hủy có thể về sau và ghi đè dữ liệu mới. Muốn tạo mới thì đặt `:key="route.params.id"` trên router-view, đổi lại là mất state cục bộ.
- **Lỗi hay mắc khi trả lời:** nói "đổi URL là đổi trang nên component mới"; chỉ route record khác mới tạo instance mới.

### Câu 4: Nên nạp dữ liệu trong guard hay trong component?
- **Trả lời mẫu (30–60 giây):** Nạp trong component là mặc định đúng, vì điều hướng không bị treo và người dùng thấy trạng thái tải. Nạp trong guard giữ điều hướng ở trạng thái chờ suốt thời gian chờ, nên màn hình cũ đứng im, không phản hồi. Dùng guard khi dữ liệu quyết định đích đến, ví dụ id không tồn tại thì phải sang 404 trước khi render.
- **Lỗi hay mắc khi trả lời:** nói "luôn nạp trong guard cho chắc" mà bỏ qua cái giá về phản hồi giao diện.

---
## Ghi chú nguồn
- https://router.vuejs.org/guide/advanced/navigation-guards.html
- https://router.vuejs.org/guide/essentials/dynamic-matching.html
- Output: chạy `node router-reuse.mjs` trong `lessons/03-vue/l16/`.
