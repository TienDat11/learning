# L14: Component — props xuống, emit lên, v-model và key theo danh tính

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu
- **Nhảy bước:** bản cũ nêu `v-model` là "cú pháp rút gọn" ngay đầu bài mà chưa nói vì sao con không được ghi vào prop — thiếu động cơ trước khi vào cú pháp.
- **Thuật ngữ chưa giải thích:** `props`, `emit`, `v-model`, `defineModel`, `slot`, `instance`, `identity`, `payload` xuất hiện lần đầu không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** sơ đồ mermaid chỉ vẽ mũi tên, không có phép ví von nào; cặp Cách tệ / Cách tốt không được đặt cạnh nhau.
- **Câu quá dài / khô:** "Cùng một mảng dữ liệu, cùng một component, khác đúng một thuộc tính, mà chữ nội bộ về khách hàng nằm trên đơn của người khác và console không in gì" — bốn mệnh đề trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)
Giả sử bảng duyệt 50 yêu cầu hoàn tiền có một ô ghi chú mỗi dòng. Một người đặt một `note = ref('')` duy nhất ở component cha rồi truyền cho mọi dòng, và dùng `:key="index"` vì mảng chưa có id ổn định.

Gõ vào dòng thứ hai thì cả 50 dòng nhảy cùng một chữ. Bấm sắp xếp theo số tiền thì ghi chú cũ nằm sai dòng, có ghi chú nội bộ hiện trên đơn của người khác.

Không exception, không cảnh báo. Đoán nhanh: lỗi binding hay lỗi đặt state? Đáp án: binding đúng, state đặt sai cấp.

### 2. Phép ví von đời thường & Sơ đồ chữ
Phòng họp có ghế dán tên. Nếu tên dán trên ghế (index), người đổi chỗ để lại vở trên ghế cũ. Nếu tên dán trên người (id), vở đi theo người. Giới hạn: ghế không tự quyết định ai ngồi — chính cha quyết định danh tính bằng `key`.

```text
component cha (giữ state)
  │ props ↓ (một chiều)
  ↓
component con (đọc, không ghi)
  │ emit ↑ (sự kiện kèm payload)
  ↓
cha gán lại state → render lại

key = id      → instance đi theo dòng dữ liệu
key = index   → instance đi theo vị trí
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)
- **Bước 1 — props là một chiều:** cha truyền giá trị xuống, Vue gói chúng trong một object; con đọc được, còn ghi thì bản dev cảnh báo, bản production im lặng.
- **Bước 2 — emit là đường ngược:** con gọi `emit('approve', id)`; Vue tra danh sách listener cha đã đăng ký và gọi chúng với payload, còn việc ghi state vẫn thuộc về cha.
- **Bước 3 — v-model chỉ là cú pháp:** `v-model="x"` mở thành prop `modelValue` cộng sự kiện `update:modelValue`; `defineModel()` khai báo cả hai phía và trả về một ref.
- **Bước 4 — key quyết định danh tính:** khi render danh sách, Vue ghép phần tử mới với instance cũ theo `key`; cùng key thì tái dùng instance và giữ state cục bộ của nó.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)
- **Cách tệ:** `:key="index"` cộng một `ref` ghi chú đặt ở cha. Gõ một ô thì mọi ô đổi; sau khi sắp xếp thì chữ nằm trên đơn khác. Nguyên nhân: state ở sai cấp và danh tính instance là vị trí.
- **Cách tốt:** `:key="row.id"` để danh tính là dòng dữ liệu, bản nháp sống trong từng instance, mọi thay đổi đi lên cha bằng `emit` hoặc `defineModel`.
- **Kiểm chứng bằng code (chạy thật):**
```bash
cd lessons/03-vue/l14 && node key-demo.mjs
```
```text
=== 1. key theo id ===
  sau khi sắp xếp (giảm dần theo amount): B = "ghi chú cho B" | C = "" | A = ""

=== 2. key theo chỉ số (index) ===
  sau khi sắp xếp (giảm dần theo amount): B = "" | C = "ghi chú cho B" | A = ""

=== 3. một ref đặt ở cha, dùng chung cho mọi dòng ===
  sau khi gõ vào B: A = "chỉ gõ vào dòng B" | B = "chỉ gõ vào dòng B" | C = "chỉ gõ vào dòng B"
```

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng
- **Được gì:** một nguồn sự thật duy nhất; con dùng lại được ở nhiều ngữ cảnh vì không phụ thuộc nơi giữ state.
- **Đánh đổi gì:** mỗi thay đổi đi qua một sự kiện và một listener, nên cây sâu nhiều tầng sinh chuỗi truyền dài; key sai cho lỗi im lặng.
- **Khi nào KHÔNG nên dùng:** không truyền props cho trạng thái mở của panel hay bản nháp riêng của con; không dùng props cộng emit cho giá trị mà ba nhánh không có tổ tiên chung cùng ghi; không dùng index làm key khi danh sách có thể sắp xếp.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: v-model trên component thực chất là gì?
- **Trả lời mẫu (30–60 giây):** Chỉ là cú pháp rút gọn cho một prop và một listener. `v-model="qty"` mở thành `:modelValue="qty"` cộng `@update:modelValue`. Con muốn đổi thì phát `update:modelValue` với giá trị mới, cha tự gán lại. `defineModel()` khai báo cả hai phía và trả về một ref: đọc thì đọc prop, ghi thì phát sự kiện.
- **Lỗi hay mắc khi trả lời:** nói v-model là "binding hai chiều vào state của cha"; con không ghi được vào state của cha.

### Câu 2: State của ô ghi chú từng dòng nên nằm ở đâu?
- **Trả lời mẫu (30–60 giây):** Trong component dòng, vì bản nháp thuộc về từng dòng. Đặt một `ref('')` ở cha rồi truyền cho mọi dòng thì 50 dòng dùng chung một ô. Khi người dùng bấm Lưu, con phát `emit('save', { id, note })`; cha là nơi duy nhất sửa mảng.
- **Lỗi hay mắc khi trả lời:** nói "để trong cha cho dễ quản lý" — tiêu chí là nơi duy nhất cần dữ liệu, không phải nơi tiện.

### Câu 3: Dùng index làm key thì chuyện gì xảy ra khi sắp xếp?
- **Trả lời mẫu (30–60 giây):** Chữ trong ô đi theo vị trí, không theo dòng, nên bản nháp nằm sai đơn. `key` là danh tính instance: với `:key="index"`, dòng ở vị trí 0 luôn là instance số 0; sắp xếp lại chỉ đưa dữ liệu mới vào instance cũ. Với `:key="row.id"`, Vue ghép đúng instance với đúng dòng và di chuyển nó.
- **Lỗi hay mắc khi trả lời:** nói "index làm component render lại" — nó không tạo lại instance, chính vì thế state mới dính sai chỗ.

### Câu 4: ref(props.row.note) lệch khi nào, đồng bộ có chủ đích là gì?
- **Trả lời mẫu (30–60 giây):** Nó là ảnh chụp tại thời điểm mount; prop đổi sau đó thì bản nháp không đổi theo. Cách đồng bộ: watch prop khi mỗi lần đổi đều phải ghi đè bản nháp, hoặc computed có setter khi mọi thay đổi phải đi thẳng lên cha. Điều kiện: đừng ghi đè giữa lúc người dùng đang gõ.
- **Lỗi hay mắc khi trả lời:** nói "dùng watch là xong" mà bỏ điều kiện không ghi đè khi đang gõ.

---
## Ghi chú nguồn
- https://vuejs.org/guide/components/v-model.html
- https://vuejs.org/guide/essentials/list.html
- https://vuejs.org/api/reactivity-core.html
- Script và output: `lessons/03-vue/l14/key-demo.mjs`, chạy bằng `node` với `vue@3.5.44` và `jsdom`.
