# Goldfish Review Loop — báo cáo kết quả

Ngày: 2026-10-29. Phạm vi: 25 bài học tiếng Việt và phần render của web app.

## 1. Phạm vi

| Nhóm | Bài | Nguồn render |
|---|---|---|
| `lessons/01-aws/` | L01–L06 | `src/35-lessons-aws.js` |
| `lessons/02-python/` | L07–L11 | `src/36-lessons-py.js` |
| `lessons/03-vue/` | L12–L17 | `src/37-lessons-vue.js` |
| `lessons/04-noi-hai-mang/` | L18–L22 | `src/38-lessons-link.js` |
| `lessons/05-phong-thu/` | L23 | `src/39-lessons-security.js` |
| `lessons/06-dao-sau/` | L24–L25 | `src/41-lessons-deep.js` |

Tổng: 25 bài, 6 file JS sinh nội dung, 1 file glossary (`lesson-glossary.json`).

## 2. Hai auditor

| Auditor | Góc nhìn | Cách kiểm |
|---|---|---|
| `comprehension` | Người đọc lần đầu: chỗ nào không hiểu được, thuật ngữ nào chưa mở ngoặc, câu nào quá dài, độ dày giữa các chặng có đều không | Đọc 25 file `.md` đối chiếu 6 file JS; đếm mục, đếm nhãn, đo độ dài câu |
| `codebase_details` | Máy đọc: mã có làm đúng điều bài nói không, có ký hiệu ma (tên hàm không tồn tại trong snippet), cổng hợp đồng có xanh không, có rác trên đĩa không | Chạy `node build.mjs` (cổng bắt buộc), đối chiếu từng `codeNote`/`mechanism` với `code`, `git status` |

Hai auditor chạy song song, chỉ đọc — không sửa file. Mỗi phát hiện đi qua bước `PROPOSE FIX` trước khi áp dụng.

## 3. Kết quả tổng hợp

12 mục, **tất cả đều `PROPOSE FIX -> Applied`**. Không mục nào bị bác bỏ.

| ID | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| B1 | Blocker | L23 (`src/39`): chuỗi `JavaScript:` trong trường `alternatives` khớp `FORBIDDEN_HTML` của `build.mjs` → cả 25 bài không qua cổng | `PROPOSE FIX -> Applied` |
| B2 | Blocker | Cả 25 file `.md` mất khối `## Ghi chú nguồn` và mất câu chặn số liệu giả định, trong khi mảng `provenance` trong JS vẫn còn | `PROPOSE FIX -> Applied` |
| M1 | Major | L07–L11 (`src/36`): `incident` mở bằng "Kịch bản giả định…" thay vì khuôn "Không có thứ này thì đau ở đâu?" | `PROPOSE FIX -> Applied` |
| M2 | Major | L03 (`src/35`): `codeNote` nhắc `ledger.claim(key)` — hàm không tồn tại trong snippet | `PROPOSE FIX -> Applied` |
| M3 | Major | L06 (`src/35`): `codeNote` nhắc `ledger.claim(key)` và `do_work` — cả hai không tồn tại trong snippet | `PROPOSE FIX -> Applied` |
| M4 | Major | L04 (`src/35`): `codeNote` nói `cors_headers` trả dict rỗng khi origin lạ, code trả `{"Vary": "Origin"}` | `PROPOSE FIX -> Applied` |
| M5 | Major | L10 (`src/36`): `mechanism` nói đọc header định danh nếu client gửi, code luôn sinh `uuid4()` và không đọc header | `PROPOSE FIX -> Applied` |
| M6 | Major | Nhóm thuật ngữ cốt lõi không mở ngoặc (xem 4.2) | `PROPOSE FIX -> Applied` |
| N1 | Nit | L13 (`src/37`): `import { onWatcherCleanup }` nhưng không dùng — import chết trong snippet người học copy | `PROPOSE FIX -> Applied` |
| N2 | Nit | L13 (`src/37`): câu tự giải thích "hai lần gõ cách nhau 0 ms" — khoảng cách 0 ms không tạo ra tình huống debounce | `PROPOSE FIX -> Applied` |
| N3 | Nit | L05 (`src/35`): gloss chèn giữa câu dưới dạng ngoặc đơn rời ở Bước 3 và Bước 4, làm câu gãy | `PROPOSE FIX -> Applied` |
| N4 | Nit | L14 (`src/37`): `OrderRow` có root `<tr>` nhưng cha render trực tiếp, thiếu `<table>`/`<tbody>` | `PROPOSE FIX -> Applied` |

## 4. Chi tiết

### 4.1 Hai blocker

**B1 — cổng hợp đồng đỏ.** `build.mjs:491` có `FORBIDDEN_HTML` gồm `/javascript:/i`. Văn xuôi của L23 viết "…client không chạy được JavaScript: đừng chọn hành động thử thách…", dấu hai chấm ngay sau chữ JavaScript khớp regex, nên `node build.mjs` trả `INVALID: L23: alternatives contains forbidden markup "JavaScript:"` và `exit 1`. Cách sửa: viết lại câu, **không** nới gate.

**B2 — mất provenance.** Chuỗi "cần kiểm tra lại" xuất hiện 0 lần trên cả 25 file `.md`, không file nào có `## Ghi chú nguồn`, trong khi mọi lesson trong `src/*.js` đều còn mảng `provenance` ghi rõ số liệu là giả định. Nặng nhất là 8 file L08–L15 không có một từ hedging nào: người đọc gặp "341/344 đơn hàng", "30.000 dòng" như số đo thật. Cách sửa: thêm `## Ghi chú nguồn` cuối mỗi file và câu chặn tại chỗ xuất hiện con số kịch bản đầu tiên.

### 4.2 M6 — nhóm thuật ngữ cốt lõi

Gộp sáu phát hiện major của `comprehension`, cùng một loại lỗi: thuật ngữ quyết định bài nhưng chưa được mở ngoặc ở lần xuất hiện đầu.

| Bài | Thuật ngữ | Ghi chú |
|---|---|---|
| L18 | `SKU`, `envelope` | SKU dùng 6+ lần làm đơn vị nghiệp vụ trung tâm; envelope là thuật ngữ chính của bài (409 + envelope có `code`/`message`/`correlation_id`) |
| L19 | `single-flight`, `XSS` | single-flight là tên cơ chế trung tâm (gộp N lời gọi refresh thành một Promise) |
| L21 | `relay` | một trong hai nhân vật chính của cơ chế outbox |
| L22 | `artifact`, `OAC` | câu chốt "deploy là đổi con trỏ tới một artifact bất biến"; OAC là cách sửa duy nhất cho lỗ hổng bucket public |
| L24 | `B-tree`, `idx_scan` | bài dạy đọc `EXPLAIN` nhưng không nói B-tree là gì; `idx_scan` xuất hiện như tên chỉ số có sẵn |
| L25 | backtick trong trường render HTML | 8 dòng dùng `` `…` `` trong trường văn xuôi, app render HTML nên người học thấy nguyên dấu backtick |

### 4.3 Bốn nit

N1 và N2 nằm trong snippet L13 mà người học copy nguyên, nên sửa tại chỗ. N3 là lỗi văn phong làm câu gãy. N4 là HTML không hợp lệ: trình duyệt tự sửa cây DOM nên ví dụ không còn dạy đúng điều bài muốn dạy.

## 5. Cổng kiểm sau khi áp dụng

```
node build.mjs
→ exit 0, "OK: harness valid"
→ METRIC lessons=25, lessons_migrated=25, invalid=0

node vue-app/build.mjs
→ exit 0, "PUBLISHED: D:\research\index.html"
```

Hai chuỗi này là chuỗi do chính script in ra: `build.mjs:822` in `OK: harness valid` khi `errors.length === 0`, `vue-app/build.mjs:104` in `PUBLISHED: ` + đường dẫn publish.

## 6. Bằng chứng kiểm lại trên cây làm việc

| Kiểm | Kết quả |
|---|---|
| `^## Ghi chú nguồn` trong `lessons/**/L*.md` | 25/25 file |
| `cần kiểm tra lại` trong `lessons/**/L*.md` | 25 file |
| `JavaScript:` trong `src/39-lessons-security.js` | 0 (chỉ còn 1 lần trong trường `code` của `src/37`, hợp lệ) |
| `ledger.claim` / `do_work` trong `src/35`, `src/36` | 0 |
| `onWatcherCleanup` trong `src/37` | 0 |

## 7. Ghi chú

- `node build.mjs` (lệnh audit bắt buộc của `codebase_details`) ghi lại `hitechcloud-interview-prep.html`; artifact đó đã được build lại và nằm trong cùng commit này.
- 9 file `tmp_L*.txt`, `tmp_mech_L*.txt`, `tmpw_L*.txt` ở gốc repo là dump nháp từ đợt rewrite. Đã bị `.gitignore` loại nên không lọt vào repo, nhưng vẫn còn trên đĩa — nên xoá khi dọn máy.
- Giới hạn của vòng này: `comprehension` chưa soi từng dòng `mechanism`/`code` của L24 và L25, và chỉ đọc bản rút gọn của L21/L22. Các kết luận "đúng" là trên phần đã đọc, không phải toàn bộ 25 bài.
- Không auditor nào sửa file. Mọi thay đổi nội dung do bước áp dụng thực hiện, sau khi mục tương ứng đã `PROPOSE FIX`.
