# PROMPT: Dựng lại web ôn phỏng vấn bằng Vue, thay file HTML hiện tại

## 1. Mục tiêu
- Thay `D:/research/hitechcloud-interview-prep.html` (file single-file sinh bởi `build.mjs`) bằng một ứng dụng Vue 3.
- Người học chưa biết AWS, Python, Vue. Ngày phỏng vấn 20/10/2026 (còn 8 ngày kể từ 12/10/2026). Mục tiêu: học 6 bài trong một ngày và trả lời được câu hỏi CTO bằng lời của mình.
- Trang chủ phải cho thấy toàn bộ lộ trình 23 bài. Mỗi bài phải cho biết người học đang ở đâu và bước tiếp theo là gì.

## 2. Nguồn dữ liệu (đã kiểm tra)
- `src/*.js` là nguồn chân lý. Không sửa file HTML sinh ra, không sửa `src/` nếu chưa có yêu cầu.
- Câu hỏi: `src/10-q-a.js`, `src/18-q-i.js`, `src/20-quiz.js`, `src/21-q-depth.js`.
- Bài học L01–L23: `src/35-lessons-aws.js` (L01–L06), `src/36-lessons-py.js` (L07–L11), `src/37-lessons-vue.js` (L12–L17), `src/38-lessons-link.js` (L18–L22), `src/39-lessons-security.js` (L23).
- Case study: `src/50-case.js`. Sơ đồ: `src/60-flows.js`. Nguồn tài liệu: `src/00-meta.js`.
- Các file `src/` không phải ES module. Chúng gán biến toàn cục (`var LESSONS = LESSONS || []`, `LESSONS.push(...)`). Phải viết loader đọc chúng, không `import` trực tiếp.
- Field plain text (`oral`, `expected`, `say30`, `say90`, `anchor`, `q`, `askFirst`, `followups[].a`) được escape khi render. Field `body`, `deep` là HTML. Không được render plain text như HTML.
- Đọc `CONTRACT.md` và `DESIGN.md` ở gốc dự án trước khi viết code. Đây là hợp đồng dữ liệu và thiết kế đã có.

## 3. Sơ đồ
- Nguồn: `diagrams-v2/diagrams/manifest.json` và các file SVG đi kèm, nếu đã có. Hiện chưa xác nhận `diagrams/` tồn tại. `diagrams-v2/preview/` có 3 file (chưa rõ ai tạo).
- Quyết định tạm của phiên trước: vẽ 13 flow (gồm `flow-sqs-visibility` và `flow-cicd-pipeline`, vì `src/50-case.js` cs-05 và cs-10 đang tham chiếu hai flow này). Yêu cầu gốc của người dùng là 11. Chưa được người dùng xác nhận. Nếu người dùng chọn 11, bỏ hai flow và sửa cs-05/cs-10 là việc riêng.
- Hai flow đang pending-review: `flow-request-lifecycle` (caption ghi CloudFront/ECS/RDS, nhưng L01 là serverless) và `flow-db-transaction` (L11, check-then-act đồng thời chưa thể hiện được).
- Mapping bài → flow đã kiểm bằng `src/35` và `src/36`–`39`:
  - L01 `flow-request-lifecycle`; L02 `flow-auth-jwt`; L03 `flow-lambda-cold-start`; L04 `flow-cors-preflight`; L05 `flow-upload-presign`; L06 `flow-queue-worker`.
  - L07 và L08: không có flow (`null`).
  - L09 `flow-failure-retry`; L10 `flow-lambda-cold-start` (dùng chung với L03, cần xác nhận); L11 `flow-db-transaction`.
  - L12 `flow-vue-reactivity`; L13–L16: không có flow (`null`); L17 `flow-idempotency`.
  - L18 `flow-request-lifecycle`; L19 `flow-auth-jwt`; L20 `flow-upload-presign`; L21 `flow-queue-worker`; L22 `flow-request-lifecycle`; L23 `flow-ddos-defense`.
- Bài không có flow (L07, L08, L13, L14, L15, L16): hiển thị placeholder theo id, dạng "RESEARCH_GAP: flow-Lxx, sơ đồ chưa có". Không hiển thị lorem, không vẽ hình thay thế.
- Mỗi SVG có id prefix theo flow-id. Không trùng id giữa các file.

## 4. Thiết kế
- Hướng: H5 "Phiếu kiểm tra". Đây là lựa chọn theo trọng số luyện tập (cùng điểm 24/35 với H1). Không phải điểm đo được. Mobile chưa đo.
- Luồng một bài theo mô tả của H5 (chưa đối chiếu từng pha với data): kiểm tra trước khi bay (dự đoán) → hệ thống (sơ đồ) → mô phỏng sự cố → phát biểu (30 giây, 90 giây) → hỏi-đáp CTO. Nếu một pha không có dữ liệu, hiển thị trạng thái thiếu rõ ràng, không ẩn pha.
- Trang chủ: 23 bài theo 5 chặng (6/5/6/5/1), có thanh tiến độ và nút "Bước tiếp theo".
- Có chế độ "Ngày học": chọn 6 bài và đi theo thứ tự. Dùng `STUDY_PLANS` hiện có trong `src/` nếu đã có. Không tự phát minh lịch.
- Màu: lấy từ `:root` và `html[data-theme="dark"]` trong `hitechcloud-interview-prep.html`. Không dùng `--muted` (không tồn tại). Dùng `--fg-3`.
- Tỉ lệ WCAG tính từ hex, không đo trên ảnh:
  - Sáng: `--fg` #0A0A0A trên #FFFFFF 19.80:1; `--fg-3` #5F5F6A 6.30:1; `--fg-2` #4A4A54 8.75:1; `--accent-ink` #4338CA 7.90:1.
  - Tối: `--fg-3` #A6A6B0 trên #141418 7.61:1; `--accent` #818CF8 6.16:1.
  - `--line-2` #C9C9D1 chỉ dùng cho nét (1.65:1), không dùng cho chữ.
- Mobile 390 px:
  - nút tối thiểu 44 × 44 px;
  - các hành động chính nằm trong nửa dưới màn hình;
  - không cắt nội dung, chữ nhỏ nhất 14 px.
- Không đặt chữ đè lên đường, không đặt hai khối chồng nhau.
- Chữ nhỏ nhất trong SVG 14 đơn vị viewBox, cả desktop và mobile.

## 5. Giữ hành vi cũ
- Key localStorage hiện có: `hcp-progress-v1`, `hcp-theme-v1`, `hcp-lessons-v1`. Không dùng lại cho dữ liệu mới.
- Key mới: `hcp-leitner-v1` và các key khác được ghi trong `CONTRACT.md`.
- Chế độ tối, chế độ in, phím tắt (xem `kbd-hint` trong `assets/body.html`), và bộ đếm thẻ Leitner phải còn.
- Danh sách 57 id bắt buộc trong `REQUIRED_UI_IDS` (`build.mjs`) không còn là ràng buộc của app Vue. Phải ghi rõ trong báo cáo những id nào không còn. Không bỏ lặng lẽ.
- Ràng buộc cũ "offline, không `<script src>`, không link ngoài" vẫn nên giữ. Nếu không giữ, nêu rõ trong báo cáo.

## 6. Thứ tự làm việc
1. Đọc `CONTRACT.md`, `DESIGN.md`, `build.mjs`, `tests/smoke.cjs`. Liệt kê hành vi cần giữ.
2. Kiểm lại trong `src/` (grep, không đoán):
   - `flow:` của L07–L23 (đã có kết quả ở mục 3, nhưng chạy lại trước khi giữ);
   - chuỗi `O(n) bình phương` (audit cũ báo lỗi ở I02, chưa xác nhận đã sửa);
   - các lỗi ghi trong `audit/CONSOLIDATED-REVIEW.md` (82 thẻ thô ở 18 câu, QZ07, B05, E11, D03, G11 vs QZ22, D07 vs E12). Ghi rõ lỗi nào còn, lỗi nào đã sửa.
3. Dùng Pencil (`pencil-design` skill, MCP `pencil`) vẽ mockup desktop và mobile cho: trang chủ, một bài học, chế độ ngày học. Tạo frame mới, không sửa 14 frame gốc của `untitled.pen`. Đọc file .pen chỉ qua MCP, không `Read` trực tiếp.
4. Dựng app Vue 3 + Vite. Loader đọc `src/*.js` như mục 2.
5. Sao lưu file HTML hiện tại sang `.scratch/hitechcloud-interview-prep.v1.html` trước khi thay. Không xóa bản gốc.
6. Build ra một file HTML (nếu giữ offline). Ghi kết quả vào `hitechcloud-interview-prep.html` chỉ sau khi test pass.
7. Viết test cho app Vue. Không chạy lại `tests/smoke.cjs` cũ như bằng chứng, vì nó kiểm tra DOM của HTML cũ.
8. Mở app bằng trình duyệt. Chụp desktop 1440 px và mobile 390 px. Chạy luồng: chọn bài → dự đoán → xem đáp án → tự nói 30 giây → hỏi-đáp CTO → đánh dấu xong → bài tiếp theo.
9. Báo cáo: file đã tạo, bảng pass/fail theo bước, mục chưa xác nhận, và tỉ lệ WCAG tính từ hex.

## 7. Không làm
- Không sửa `src/` để khớp sơ đồ. Nếu lệch, ghi vào báo cáo.
- Không tự đổi nội dung bài học.
- Không xóa file cũ. Không ghi đè `diagrams/` cũ.
- Không dùng màu ngoài token của site.
- Không báo "xong" khi chưa chạy app và xem màn hình.

## 8. Điều đã biết nhưng chưa xác nhận
- Sơ đồ: chưa vẽ, chưa render. Trạng thái `diagrams-v2/` chưa rõ.
- Mobile một tay: chưa đo bằng tọa độ node.
- L10 có cần sơ đồ riêng hay không: chưa rõ.
- Chưa kiểm tra `untitled.pen` có thay đổi không (hash mốc `A9A49BC3A5DDE87EBD1D1FA5EA968FFEBB31745EBCD6C0519D6F253D748B4AF5`, mtime 2026-10-12 00:07:30).
