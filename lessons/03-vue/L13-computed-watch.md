# L13: computed, watch và watchEffect — giá trị suy ra, tác dụng phụ và response cũ

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu
- **Nhảy bước:** bản cũ vào ngay bốn dạng nguồn của `watch` và ba giá trị `flush`, trong khi chưa nói vì sao hai công cụ phải tách vai.
- **Thuật ngữ chưa giải thích:** `computed`, `watch`, `watchEffect`, `side effect`, `race condition`, `flush`, `onCleanup`, `AbortController`, `debounce` xuất hiện lần đầu không có ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** sơ đồ mermaid đặt ngay đầu phần cơ chế, không có phép ví von nào và không có cặp Cách tệ / Cách tốt.
- **Câu quá dài / khô:** "Nếu mỗi callback gán thẳng rows.value = data, lần ghi cuối là của a — từ khóa ngắn nhất, cũ nhất, nên màn hình hiện kết quả của a trong khi ô tìm kiếm đang ghi abc" — ba mệnh đề nối bằng dấu phẩy.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)
Giả sử trang danh sách đơn có bộ lọc sáu trường. Một người viết `watch(filters, reload, { deep: true })` cho chắc, rồi đặt luôn mảng kết quả vào chính `filters`.

Mỗi phím gõ: watcher chạy, gọi API, rồi gán `filters.rows`. Vì `rows` nằm trong object đang bị watch, watcher lại chạy. Mỗi ký tự sinh thêm request cho tới khi server trả 429 (mã "quá nhiều request").

Cùng lúc, panel tổng tiền gọi API trong một `computed` (giá trị dẫn xuất có bộ nhớ đệm `cache`). Panel hiện `[object Promise]`.

Đoán nhanh: lỗi ở computed hay ở chỗ đặt tác dụng phụ? Đáp án: ở chỗ đặt — hai công cụ bị hoán vai.

### 2. Phép ví von đời thường & Sơ đồ chữ
Hai người cùng dùng một bảng số. Một người chỉ cần biết "tổng là bao nhiêu", hỏi lúc nào trả lời lúc đó. Người kia cần "khi số đổi thì gửi tin nhắn", phải làm chứ không thể chỉ biết. Giới hạn: `computed` không chạy khi không ai đọc, còn `watch` chạy kể cả khi không ai cần kết quả.

```text
dependency đổi
  ├─ computed: bật dirty flag (cờ đệm đã cũ) → dừng
  │     └─ có ai đọc .value → tính lại → cache
  └─ watch: đẩy callback vào hàng đợi theo flush
        └─ callback chạy → tác dụng phụ (gọi API)
              └─ response về → còn là bản mới nhất không?
                    ├─ phải → ghi state
                    └─ cũ   → bỏ
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)
- **Bước 1 — computed là effect lười:** lần đọc đầu chạy hàm và ghi lại khóa đã đọc; kết quả giữ cùng một cờ bẩn, nên đọc mười lần trong một render chỉ tính một lần.
- **Bước 2 — watch là effect chủ động:** nguồn là ref, getter, mảng getter hoặc object reactive; nguồn đổi thì callback vào hàng đợi theo `flush` pre, post hoặc sync.
- **Bước 3 — dọn dẹp giữa hai lần chạy:** callback nhận `onCleanup`, hàm dọn chạy trước lần chạy kế tiếp — chỗ đúng để xóa timer và gọi `AbortController` (bộ điều khiển hủy request đang chạy dở).
- **Bước 4 — chặn response cũ:** `debounce` (trì hoãn chỉ chạy sau khi ngừng gõ) giảm số lần bắt đầu; bộ đếm phiên chặn việc ghi. Thiếu bước này thì `race condition` (lỗi đua thời gian) vẫn xảy ra.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)
- **Cách tệ:** một object chứa cả đầu vào lẫn kết quả, deep watch nó, rồi trong callback gán lại `rows` và `total` — watcher tự gọi chính nó. Và `computed` chứa `await`, nên giá trị là Promise bị cache.
- **Cách tốt:** tách nguồn (`keyword`) khỏi đích (`rows`); watch đúng nguồn, debounce, dọn dẹp bằng `onCleanup`. Phần lọc dữ liệu để trong `computed`. Gốc rễ: mỗi công cụ trả lời đúng một câu hỏi.
- **Kiểm chứng bằng code (chạy thật):**
```bash
cd lessons/03-vue/l13 && node computed-watch-race.mjs
```
```text
=== 1. computed lười và có cache ===
  gán q = 'HDD' nhưng chưa đọc: số lần tính = 0
  đọc lần 1 = "hdd", số lần tính = 1
  đọc lần 2 = "hdd", số lần tính = 1

=== 6. response về lệch thứ tự ===
  [không chặn] thứ tự response về: abc → ab → a
  [không chặn] rows cuối cùng: kết quả cho "a"
  [đánh số] response "ab" mang token 2, token mới nhất là 3: bỏ
  [đánh số] rows cuối cùng: kết quả cho "abc"
  [huỷ] rows cuối cùng: kết quả cho "abc"
```

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng
- **Được gì:** computed rẻ vì chỉ tính khi có người đọc; watch cho một chỗ duy nhất đặt tác dụng phụ, kèm chỗ dọn dẹp tường minh.
- **Đánh đổi gì:** watch là mã mệnh lệnh — tự lo debounce, hủy, chốt phiên, xử lý lỗi; deep watch trên object lớn duyệt cả cây mỗi lần đổi.
- **Khi nào KHÔNG nên dùng:** không dùng watch để tính giá trị hiển thị; không dùng computed cho việc gọi mạng; không dùng `watchEffect` khi phụ thuộc chỉ xuất hiện sau `await` hoặc khi cần giá trị cũ.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: computed và watch khác nhau ở bước nào trong cơ chế?
- **Trả lời mẫu (30–60 giây):** computed là effect lười có cache, watch là effect chủ động chạy callback. Khi dependency đổi, cả hai đều được trigger, nhưng computed chỉ bật cờ bẩn rồi dừng; hàm tính chỉ chạy khi có ai đọc `.value`. Watch đưa callback vào hàng đợi ngay theo `flush`, nên nó chạy kể cả khi không ai đọc gì.
- **Lỗi hay mắc khi trả lời:** nói "computed nhanh hơn watch"; chúng trả lời hai câu hỏi khác nhau, không phải hai tốc độ.

### Câu 2: Lọc danh sách và gọi API nên đặt ở đâu?
- **Trả lời mẫu (30–60 giây):** Lọc đặt trong `computed`, gọi API đặt trong `watch` có debounce. Hàm computed phải đồng bộ và thuần: cùng đầu vào cho cùng đầu ra. Gọi API là tác dụng phụ, cần hoãn, cần hủy request cũ, cần xử lý lỗi — ba thứ computed không có. Đặt lời gọi trong computed thì template nhận một Promise bị cache.
- **Lỗi hay mắc khi trả lời:** nói "computed cũng chạy lại khi state đổi nên dùng được" — nó chỉ chạy khi có người đọc, và kết quả async bị giữ nguyên.

### Câu 3: Vì sao debounce một mình không đủ để chặn response cũ?
- **Trả lời mẫu (30–60 giây):** Debounce quyết định có gửi hay không, không quyết định response nào được ghi. Hai request đã gửi vẫn có thể về lệch thứ tự. Debounce chỉ đủ khi khoảng cách giữa các lần gõ luôn nhỏ hơn ngưỡng. Cần thêm bộ đếm phiên hoặc so controller: response chỉ được ghi khi nó vẫn là bản mới nhất.
- **Lỗi hay mắc khi trả lời:** trả lời "debounce là đủ"; phải nêu hai lớp: giảm số lần bắt đầu và chặn việc ghi.

### Câu 4: flush pre khác post ở đâu, khi nào cần post?
- **Trả lời mẫu (30–60 giây):** `pre` chạy trước khi component cập nhật DOM, `post` chạy sau khi DOM đã cập nhật, `sync` chạy ngay tại dòng gán. Cần `post` khi callback phải đọc thứ đã render, ví dụ đo chiều cao một phần tử vừa thêm. Thứ tự thật đo được: sync, rồi dòng ngay sau khi gán, rồi pre, rồi post.
- **Lỗi hay mắc khi trả lời:** nói post "chạy sau khi render xong" mà không phân biệt với `nextTick`.

---
## Ghi chú nguồn
- https://vuejs.org/api/reactivity-core.html
- https://vuejs.org/guide/essentials/watchers.html
- Script và output: `lessons/03-vue/l13/computed-watch-race.mjs`, chạy bằng `node` với `vue@3.5.44`.
