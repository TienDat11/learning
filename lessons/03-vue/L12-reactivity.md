# L12: Reactivity — ref, reactive và cái Proxy ghi sổ ai đọc khóa nào

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu
- **Nhảy bước:** bản cũ mở bằng sơ đồ `track/trigger` trước khi nói vì sao cần theo dõi phụ thuộc; người đọc phải tin cơ chế trước khi thấy vấn đề nó giải.
- **Thuật ngữ chưa giải thích:** `reactivity`, `Proxy`, `trap`, `effect`, `Dep`, `Link`, `WeakMap`, `shallowRef`, `markRaw`, `destructuring` xuất hiện lần đầu mà không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** phép ví von bảng tính nằm rải ở mục "Điều bạn đã biết", không đặt cạnh một cặp Cách tệ / Cách tốt để so.
- **Câu quá dài / khô:** kiểu câu "Vì vậy sổ ghi ở mức từng khóa của từng object, không phải mức component, và mỗi khóa có một tập effect riêng, trong khi trigger chỉ đánh thức đúng những effect đã đọc khóa đó" nhồi ba mệnh đề trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)
Giả sử bảng duyệt chi phí hoàn ứng chạy bằng JavaScript thuần. Dữ liệu nằm trong một object. Chữ trên màn hình do bốn chỗ tự ghi vào DOM (cây thẻ HTML mà trình duyệt vẽ ra).

Một người thêm panel sidebar và huy hiệu menu ở file khác. Rồi sửa hàm duyệt đơn và chỉ gọi hai hàm cập nhật quen tay. Hai chỗ còn lại không ai gọi.

Kết quả: huy hiệu ghi 341, bảng có 344 dòng. Không exception, console sạch.

Đoán nhanh: lỗi ở dữ liệu hay ở chỗ nối dữ liệu với màn hình? Đáp án: ở chỗ nối. Dữ liệu đúng, chỉ hai cạnh phụ thuộc bị quên.

### 2. Phép ví von đời thường & Sơ đồ chữ
Bảng tính: gõ ô A1, ô B1 chứa công thức tự đổi, vì bảng tính biết B1 đọc A1. Giới hạn: object JavaScript không tự có công thức — chỉ object đi qua `Proxy` (lớp bọc đứng chặn trước object để bắt thao tác đọc `get` và ghi `set`) mới được ghi sổ.

```text
effect đang chạy
  │ đọc state.q → trap get
  ↓
track: nối effect vào Dep của khóa q
  │
state.q = 'hd' → trap set
  ↓
trigger: lấy Dep của q → đánh thức đúng effect đã đọc
  ↓
scheduler gộp các lần đánh dấu trong một tick → effect chạy 1 lần
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)
- **Bước 1 — Bọc object:** `reactive(obj)` trả về một `Proxy` mới. Object gốc giữ nguyên, nên chỉ chỗ đọc qua Proxy mới được theo dõi.
- **Bước 2 — Track khi đọc:** mỗi lần đọc một khóa, Vue ghi `effect` (hàm phản ứng tự chạy lại khi dữ liệu nó đọc đổi) đang chạy vào `Dep` (đối tượng giữ danh sách liên kết hai chiều các `Link` trỏ tới những effect phụ thuộc khóa đó), theo `WeakMap` rồi `Map` theo khóa.
- **Bước 3 — Trigger khi ghi:** trap `set` so sánh bằng `Object.is`, bằng nhau thì bỏ qua; khác thì tra đúng `Dep` của khóa và đánh dấu các effect phụ thuộc.
- **Bước 4 — Gộp trong một tick:** nhiều lần gán trong cùng một tick còn một lần chạy. `ref` (vỏ bọc có `.value`) dùng cho mọi giá trị; `reactive` chỉ cho object không bị gán lại cả biến.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)
- **Cách tệ:** `const { q: plainQ } = filters` — `destructuring` (tách thuộc tính ra biến rời) đọc qua Proxy đúng một lần rồi giữ bản sao chuỗi. Gõ tiếp thì `plainQ` đứng yên, console sạch.
- **Cách tốt:** đọc `filters.q` mỗi lần dùng, hoặc `toRefs(filters)` để biến từng khóa thành ref còn nối với Proxy. Gốc rễ: vẫn còn một đường đọc đi qua trap.
- **Kiểm chứng bằng code (chạy thật):**
```bash
cd lessons/03-vue/l12 && node reactivity-demo.mjs
```
```text
=== 4. destructure làm đứt dây, toRefs thì không ===
  [biến rời] effect lần 1: plainQ = ""
  sau filters.q = 'hd': plainQ = "", effect chạy 1 lần
  [toRefs] effect lần 1: q.value = "hd"
  [toRefs] effect lần 2: q.value = "hdd"
  sau filters.q = 'hdd': q.value = "hdd", effect chạy 2 lần

=== 3. effect có scheduler: gộp nhiều lần đổi trong một tick ===
  gán 3 lần: scheduler được gọi 3 lần, hàng đợi gộp còn 1 job
  sau microtask: effect thật sự chạy 1 lần
```

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng
- **Được gì:** không phải viết mã cập nhật giao diện; mỗi thay đổi chỉ chạy lại đúng effect đã đọc khóa đó.
- **Đánh đổi gì:** mọi lần đọc đi qua một trap; `reactive` bọc đệ quy object lồng, nên dữ liệu lớn tốn thời gian mount và bộ nhớ.
- **Khi nào KHÔNG nên dùng:** mảng rất lớn bất biến chỉ để hiển thị (dùng `shallowRef` cộng `markRaw`); instance thư viện ngoài; trang tĩnh không có dữ liệu đổi.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vue theo dõi phụ thuộc ở mức khóa, mức object hay mức component?
- **Trả lời mẫu (30–60 giây):** Ở mức từng khóa của từng object. Lúc effect chạy, mỗi lần đọc thuộc tính đi qua trap `get` và effect đó được ghi vào `Dep` của đúng khóa, trong `WeakMap` theo object rồi `Map` theo khóa. Khi ghi, trap `set` so sánh bằng `Object.is` và chỉ đánh thức đúng `Dep` đó. Vì vậy component đọc ba khóa chỉ chạy lại khi một trong ba khóa đổi.
- **Lỗi hay mắc khi trả lời:** nói "theo mức component" — khi đó mọi thay đổi đều render lại cả component; nói đúng là mức khóa.

### Câu 2: Vì sao destructure hoặc gán lại cả biến lại làm mất reactivity?
- **Trả lời mẫu (30–60 giây):** Cả hai đều cắt đường đọc qua Proxy. Destructure đọc `filters.q` đúng một lần rồi giữ một chuỗi, nên không còn khóa nào để track. Gán lại `state = reactive({...})` thay Proxy cũ bằng Proxy mới, còn ba component vẫn giữ tham chiếu cũ. Cả hai đều không ném lỗi, nên giao diện chỉ đứng yên.
- **Lỗi hay mắc khi trả lời:** nói "destructure thì không reactive" mà không giải thích cơ chế; phải nói rõ: đọc một lần rồi cắt dây.

### Câu 3: Bảng 30.000 dòng chỉ để hiển thị — chọn ref, reactive hay shallowRef?
- **Trả lời mẫu (30–60 giây):** `shallowRef` cho mảng, `markRaw` cho từng dòng, `reactive` chỉ cho bộ lọc nhỏ. `reactive` bọc đệ quy object lồng, nên 30.000 dòng là 30.000 Proxy. `shallowRef` chỉ theo dõi `.value`: gán cả mảng thì cập nhật, sửa một dòng thì không. Điều kiện: dữ liệu bất biến ở mức từng dòng.
- **Lỗi hay mắc khi trả lời:** chọn `shallowRef` mà quên nói rằng `push` vào mảng sẽ không cập nhật gì.

### Câu 4: Giới hạn nào của Proxy khiến Vue không theo dõi được số nguyên hay instance thư viện?
- **Trả lời mẫu (30–60 giây):** Proxy chỉ chặn được truy cập thuộc tính trên object mà nó bọc. Số và chuỗi là nguyên thủy nên phải đi qua `ref`. Instance như bản đồ tự quản lý trạng thái bên trong, nên Vue không thấy nó đổi và bọc nó có thể làm hỏng nó — dùng `markRaw`. Kiểm chứng bằng `isReactive`, hoặc bằng việc giao diện đứng yên sau khi gọi một method của thư viện.
- **Lỗi hay mắc khi trả lời:** nói "Vue không hỗ trợ thư viện ngoài"; đúng hơn là Proxy chỉ bắt được truy cập thuộc tính.

---
## Ghi chú nguồn
- https://vuejs.org/api/reactivity-core.html
- https://vuejs.org/guide/essentials/watchers.html
- https://vuejs.org/guide/essentials/list.html
- Script và output: `lessons/03-vue/l12/reactivity-demo.mjs`, chạy bằng `node` với `@vue/reactivity@3.5.44`.
