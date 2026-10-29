# L15: State ở đâu — component, cây component hay store toàn cục

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu
- **Nhảy bước:** bản cũ liệt kê ba mức "khai ở đâu" ngay trong mục "Điều bạn đã biết" mà chưa cho thấy triệu chứng cụ thể của từng mức, nên người đọc phải nhớ ba khái niệm trừu tượng cùng lúc.
- **Thuật ngữ chưa giải thích:** `composable`, `singleton`, `provide / inject`, `store`, `$reset`, `setup store`, `module scope` xuất hiện lần đầu không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** sơ đồ mermaid vẽ mũi tên `inject` nhưng không có phép ví von nào, và không có cặp Cách tệ / Cách tốt đặt cạnh nhau.
- **Câu quá dài / khô:** "Store là một instance cho mỗi app, không phải cho mỗi tiến trình, nên biến module sống lâu hơn app và rò sang lần chạy sau" — ba mệnh đề trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)
Giả sử tính năng tải tài liệu có ba component: huy hiệu trên thanh menu, vùng kéo thả, panel chi tiết. Ba component nằm ở ba nhánh cây khác nhau, không cái nào là cha của cái nào.

Một người viết `composable` (hàm tái sử dụng logic có trạng thái reactive) với `files = ref([])` bên trong, rồi gọi nó ở cả ba nơi, vì nghĩ gọi cùng một hàm là dùng chung dữ liệu.

Kéo ba tệp vào vùng kéo thả: vùng kéo thả giữ đúng 3 tệp. Panel chi tiết và huy hiệu đều ghi 0, vì mỗi component nhận một hộp `ref` riêng.

Sau đó có người sửa nhanh bằng cách đưa `files` ra phạm vi module; huy hiệu đúng trên trình duyệt, nhưng bài test chạy sau thấy sẵn 3 tệp của bài trước. Đoán nhanh: hai cách sai này khác nhau ở đâu? Đáp án: một cách sai phạm vi trong app, cách kia sai phạm vi giữa các lần chạy.

### 2. Phép ví von đời thường & Sơ đồ chữ
Ba người cùng mua sổ tay giống hệt nhau: ai ghi sổ người nấy — đó là gọi composable ba lần. Để chung một cuốn trên bàn tòa nhà là biến module: mọi phòng thấy, và cuốn đó không bao giờ bị dọn. Mỗi phòng họp một cuốn riêng là `Pinia store` (kho giữ trạng thái dùng chung cho toàn ứng dụng). Giới hạn: store không tự xóa khi tan họp; bạn phải gọi `reset()`.

```text
App.vue  provide('theme', ref)
  │
  ├─ Layout ── Sidebar ── ThemeToggle  inject('theme')
  │        inject đi ngược lên tổ tiên, dừng ở App.vue
  │
  └─ nhánh khác không có tổ tiên chung
        └─ store: một instance cho mỗi app

module scope → sống theo tiến trình
store        → sống theo app
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)
- **Bước 1 — state cục bộ thuộc về một instance:** `ref` khai trong `setup` được tạo mỗi lần component được tạo và chết cùng instance.
- **Bước 2 — provide ghi vào chuỗi tổ tiên:** `provide(key, value)` lưu cặp khóa và giá trị trên instance hiện tại; `inject` (cơ chế truyền từ component tổ tiên xuống thẳng con cháu) đi ngược lên cha, ông cho tới khi gặp khóa đó.
- **Bước 3 — phản ứng phải nằm trong giá trị:** provide một `ref` thì con inject nguyên trạng và vẫn cập nhật; provide `theme.value` thì con nhận bản sao chuỗi tại thời điểm inject.
- **Bước 4 — store là một instance cho mỗi app:** `defineStore` chỉ khai báo; state được tạo ở lần `useStore()` đầu tiên trong app. `$reset()` chỉ có trên option store, setup store phải tự viết action `reset()`.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)
- **Cách tệ:** gọi `useFiles()` ở ba nơi và tin đó là chia sẻ dữ liệu — ba hộp `ref` riêng, ba con số khác nhau. Sửa bằng biến module thì đúng trên trình duyệt nhưng rò giữa các bài test.
- **Cách tốt:** một store cho dữ liệu ba nhánh cùng đọc ghi; provide chính `ref` cho phụ thuộc theo cây; và một action `reset()` gọi lúc đăng xuất.
- **Kiểm chứng bằng code (chạy thật):**
```bash
cd lessons/03-vue/l15 && node state-scope.mjs
```
```text
Số tệp đếm được ở đầu mỗi bài test:
  test 1 — singleton, thêm 3 tệp           ->  3
  test 2 — singleton, không thêm gì        ->  3
  test 3 — hàm tạo mới, thêm 3 tệp         ->  3
  test 4 — hàm tạo mới, không thêm gì      ->  0
  test 5 — pinia (app mới), thêm 3 tệp     ->  3
  test 6 — pinia (app mới), không thêm gì  ->  0
  test 7 — pinia (cùng app), thêm 3 tệp    ->  3
  test 8 — pinia (cùng app) sau reset()    ->  0

Composable gọi ở ba component, mỗi nơi tự gọi:
  A thấy 2, B thấy 1, C thấy 0
```

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng
- **Được gì:** state ở đúng phạm vi thì reset dễ, test cô lập được, và không phải truyền props qua tầng không dùng.
- **Đánh đổi gì:** store toàn cục làm mọi thứ phụ thuộc một chỗ; provide thì khó thấy ai cung cấp giá trị khi đọc riêng một component.
- **Khi nào KHÔNG nên dùng:** không dùng store cho state của một màn hình; không dùng provide cho dữ liệu phải copy được bằng đường dẫn; không dùng biến phạm vi module cho state của người dùng, kể cả khi nó chạy đúng trên máy bạn.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: provide/inject có tự làm mọi giá trị trở nên reactive không?
- **Trả lời mẫu (30–60 giây):** Không. provide chỉ đưa một tham chiếu xuống cây; tính reactive phải có sẵn trong giá trị đó. `provide('cfg', 5)` đưa con số 5, con nhận bản sao và không bao giờ thấy giá trị mới. `provide('cfg', ref(5))` đưa một ref, con inject được ref đó và đọc `.value`, nên vẫn cập nhật. Với object thường, hai bên chia sẻ tham chiếu nên sửa thuộc tính thì cả hai thấy, nhưng không có trap nên template không vẽ lại.
- **Lỗi hay mắc khi trả lời:** nói "provide tự unwrap ref"; tài liệu nói ngược lại — ref được inject nguyên trạng để giữ dây phản ứng.

### Câu 2: Huy hiệu, vùng kéo thả và panel chi tiết ở ba nhánh cây — đặt state ở đâu?
- **Trả lời mẫu (30–60 giây):** Trong một store, vì ba component không có quan hệ cha con trực tiếp và cùng đọc cùng ghi. Đặt trong component thì mỗi instance có bản riêng: huy hiệu đếm 0 trong khi vùng kéo đã có ba tệp. provide chỉ đi theo cây, nên chỉ dùng được nếu cả ba nằm dưới một tổ tiên chung.
- **Lỗi hay mắc khi trả lời:** trả lời "dùng provide cho mọi trường hợp" là bỏ qua điều kiện cây.

### Câu 3: Pinia khác biến ở phạm vi module ở điểm nào?
- **Trả lời mẫu (30–60 giây):** Biến module là singleton của cả tiến trình, không gắn với app; Pinia là store reactive gắn với từng app. Một `ref` ở phạm vi module chia sẻ giữa mọi lần import, kể cả giữa các bài test trong cùng tiến trình, nên state rò từ bài này sang bài khác. Store được tạo khi gọi `useStore()` trong một app, nên mỗi app có một bản và có thể reset. Biến module vẫn đúng cho hằng số cấu hình hoặc cache không gắn với phiên người dùng.
- **Lỗi hay mắc khi trả lời:** nói "Pinia nhanh hơn biến module"; khác biệt là phạm vi sống và khả năng cô lập.

### Câu 4: Một composable gọi ở ba component tạo ba bản state — khi nào đúng, khi nào sai?
- **Trả lời mẫu (30–60 giây):** Đúng khi state là của từng instance, sai khi ba component cần nhìn cùng một dữ liệu. Composable tái dùng logic, không chia sẻ dữ liệu: mỗi lần gọi chạy lại thân hàm nên mọi `ref` bên trong là bản mới. Ô tìm kiếm riêng cho từng bảng thì ba bản là đúng; huy hiệu đếm tệp đang tải thì ba bản làm ba con số khác nhau trên cùng màn hình.
- **Lỗi hay mắc khi trả lời:** trả lời "luôn là lỗi"; phải nêu cả hai phía vì cùng hành vi có thể là thiết kế đúng.

---
## Ghi chú nguồn
- https://vuejs.org/guide/components/provide-inject.html
- https://pinia.vuejs.org/core-concepts/
- Output: chạy `node state-scope.mjs` trong `lessons/03-vue/l15/`.
