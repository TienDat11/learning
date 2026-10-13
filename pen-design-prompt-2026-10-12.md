# PROMPT cho agent Pencil — hoàn thiện UI web ôn phỏng vấn Fullstack (AWS · Python · VueJS)

File: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen` (đang mở). Không xóa, không sửa 14 frame gốc. Mọi màn mới là frame top-level mới, dùng `FindEmptySpace` để đặt bên phải/dưới frame `w17Ep4`, `placeholder:true` khi đang làm, `clip:true`.

## 0. Quyết định đã chốt (không mở lại)
- Hướng: H5 "Phiếu kiểm tra" (frame `LSwtv`, `KkN9g`, `w17Ep4`) là chuẩn. Copy cấu trúc của chúng, đừng vẽ lại từ đầu.
- Đổi palette + font sang token của site thật (app offline chỉ có 2 font này). Tạo biến mới tiền tố `hcp-` với theme `mode: light|dark` bằng `SetVariables` (merge, không replace):
  - light: bg #FAFAFA, surface #FFFFFF, sunken #F2F2F4, fg #0A0A0A, fg-2 #4A4A54, fg-3 #5F5F6A, line #E8E8EC, line-2 #C9C9D1 (chỉ cho nét), accent #4F46E5, accent-ink #4338CA, accent-soft #EEF2FF, ok #047857, ok-fill #10B981, ok-soft #ECFDF5, warn #92400E, warn-fill #F59E0B, warn-soft #FEF3C7, err #B91C1C, err-soft #FEF2F2, code-bg #0F0F12, code-fg #E6E6EA.
  - dark: bg #0B0B0D, surface #141418, sunken #1C1C22, fg #F4F4F5, fg-2 #C4C4CC, fg-3 #A6A6B0, line #2A2A32, line-2 #44444F, accent #818CF8, accent-ink #C7D2FE, accent-soft #1E1B4B, ok #6EE7B7, ok-fill #10B981, ok-soft #062E22, warn #FCD34D, warn-fill #F59E0B, warn-soft #2A1F05, err #FCA5A5, err-soft #2D0F0F, code-bg #08080A, code-fg #E6E6EA.
  - Font: "Be Vietnam Pro" (400, 600) cho mọi chữ; "JetBrains Mono" cho nhãn mono, mã, id bài. Bỏ Barlow Condensed / Chivo / Share Tech Mono / amber #FFB000 ở các frame mới.
  - Quy tắc màu: indigo chỉ cho thứ bấm được; xanh lá chỉ cho trạng thái GO/xong; vàng chỉ cho cảnh báo/"đang kiểm". Không gradient, bóng tối thiểu, bo góc 8 (card 12).
- Chữ nhỏ nhất 14px (nhãn mono uppercase 12px chỉ cho meta không quan trọng, tối đa 1 dòng). Nút ≥ 44×44 trên mobile. Mobile: hành động chính nằm ở thanh dưới cố định.
- KHÔNG còn chữ placeholder: không "Tên bài học", "Tên chương", "chờ duyệt", "RESEARCH_GAP", "Mô tả ngắn…", "Thuật ngữ 1". Dùng dữ liệu thật ở mục 3. Hiện có 30 chuỗi placeholder ở `w17Ep4` và 11 ở `LSwtv` — frame mới phải là 0 (kiểm bằng `Get` visitor với regex `RESEARCH_GAP|chờ duyệt|Tên bài|Tên chương|placeholder|Thuật ngữ \d`).

## 1. Màn cần vẽ (mỗi màn: Web 1440 + Điện thoại 390; màn 1, 2 thêm bản dark)
1. **Trang chủ** (copy `w17Ep4`): tiêu đề "Còn 8 ngày · 0/23 bài đạt GO"; card "Bước tiếp theo" (bài L01 thật, goal thật, nút "Mở bài L01"); 3 ô số: Bài GO 0/23, Thẻ đến hạn hôm nay 65 (dòng phụ "bộ P0 · 5 hộp Leitner"; ngày đầu cả 65 câu P0 đều ở hộp 1 nên đều đến hạn), Câu P0 đã nói được 0/65; dải 4 lối vào: Ngày học · Ôn câu hỏi (136 câu) · Quiz 28 câu · Phỏng vấn thử (6 bộ); 5 chặng với tiêu đề thật và 23 bài với tiêu đề thật, trạng thái mỗi bài (Chưa mở / Đang kiểm / GO). Bài không có sơ đồ (L07, L08, L13, L14, L15, L16) ghi "không sơ đồ" màu fg-3, KHÔNG dùng màu cảnh báo (không phải lỗi). Bỏ khối "Chú giải trạng thái" lớn, thay bằng chú giải 1 dòng. (Số đếm từ `src/` ngày 2026-10-12; app tự đếm khi chạy.)
2. **Bài học L01** (copy `LSwtv`): breadcrumb "Chặng 1 — AWS nền tảng · L01", tiêu đề thật, goal thật, thanh 5 pha dính trên có trạng thái. 5 pha, mỗi pha kết thúc bằng hàng "GO khi: …" + nút "Xác nhận GO":
   - Pha 1 Kiểm tra trước khi bay: 3 câu askFirst thật; khối Dự đoán (predict thật) có ô "Viết dự đoán của bạn" + nút "Mở đáp án" (đáp án ẩn).
   - Pha 2 Hệ thống: khung sơ đồ 16:9 (ghi "flow-request-lifecycle" — SVG thật do code chèn) + 2 khối Khái niệm / Cơ chế dạng đoạn văn ngắn.
   - Pha 3 Mô phỏng sự cố: card sự cố, timeline 5 mốc thật dạng dọc, khối "Cách sửa ngây thơ" có code block tối + output, khối "Nguyên nhân gốc", danh sách failure modes.
   - Pha 4 Phát biểu: tab 30 giây / 90 giây, đồng hồ lớn "00:00 / 00:30", nút Bắt đầu, bản mẫu say30 che mờ tới khi hết giờ ("Mở bản mẫu"), 5 câu sayIt đánh số, câu neo nổi bật.
   - Pha 5 Hỏi-đáp CTO: 4 câu attacks thật, mỗi câu thu gọn, đáp án ẩn; 3 khối nhỏ Đánh đổi / Phương án khác / Quan sát được gì; hàng "Câu hỏi liên quan: G01 · G12 · G05" (chip bấm được).
   - Cột phải (web) / ngăn kéo dưới (mobile): Câu neo, Tài liệu đọc, Nguồn.
   - Chân bài: "Bài đạt khi pha 3 và pha 5 GO" + Bài trước / Bài sau.
   - Vẽ 2 trạng thái: pha 1 đang làm; pha 1 đã GO + pha 2 mở.
3. **Ngày học** (mới): chọn "Gói 6 giờ" / "Gói 2 ngày" / "Gói 3 ngày"; gói đang chọn hiện các khối (Làm gì / Làm thế nào / Câu nào) theo thứ tự, khối hiện tại nổi bật, nút "Bắt đầu khối"; chế độ phụ "Chọn 6 bài" với 6 ô chọn bài và nút "Đi theo thứ tự".
4. **Ôn câu hỏi** (mới): web = cột lọc trái (nhóm A–J tên thật, P0/P1/P2, L1–L3, ô tìm) + thẻ câu hỏi giữa; mobile = lọc thành sheet. Thẻ G01 hai trạng thái: (a) chỉ câu hỏi + nút "Tôi đã nói xong, mở đáp án"; (b) đã mở: Trả lời miệng → Nói 30s/90s → Giải thích sâu → Chuỗi hỏi sâu 3 tầng (mỗi đáp án ẩn) → Bẫy thường gặp → khối "Tự đánh giá" với 3 câu selfcheck thật của câu đó (làm thành 3 nút chọn được; mức thấp nhất bắt đầu bằng "Tôi vẫn chưa giải thích được…") → 2 nút Leitner "Nhớ được (1)" / "Chưa nhớ (2)". Lý do: app chấm Leitner 2 mức, chỉ cho bộ P0. Bộ đếm "Còn 65 thẻ P0 đến hạn", ngày đầu cả 65 thẻ đều ở hộp 1.
5. **Quiz** (mới): 1 câu/màn, 4 lựa chọn, trạng thái đúng/sai kèm giải thích, thanh 7/28, màn tổng kết + "Làm lại câu sai".
6. **Phỏng vấn thử** (mới): chọn 1 trong 6 bộ (tên thật mục 3); màn phỏng vấn: 1 câu, đếm ngược 90s, "Hết giờ, xem đáp án", tự chấm; màn tổng kết liệt kê câu yếu + "Ôn lại các câu này".

## 2. Kiểm tra bắt buộc sau mỗi màn
- `Get(screen,(n,c)=>c.problems&&Print(n.name,c.problems))` rỗng; không chữ đè chữ hay đè đường kẻ.
- Đếm placeholder regex ở mục 0 = 0.
- Mọi text có `fill`; tương phản chữ ≥ 4.5:1 (fg / fg-2 / fg-3 trên bg/surface; không dùng line-2 cho chữ).
- Mobile: nút ≥ 44 cao; không chữ < 14 ngoài nhãn meta.
- `TakeScreenshot` từng màn, tự soát, sửa trực tiếp (không xóa làm lại), bỏ `placeholder`.
- Xong: `Export` PNG mọi frame mới vào `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/exports/v2/` và in danh sách id → tên màn.

## 3. Dữ liệu thật (dùng nguyên văn)
Chặng: 1 "Chặng 1 — AWS nền tảng" (L01–L06) · 2 "Chặng 2 — Python gắn vào AWS" (L07–L11) · 3 "Chặng 3 — VueJS" (L12–L17) · 4 "Chặng 4 — Nối hai mảng" (L18–L22) · 5 "Chặng 5 — Phòng thủ" (L23).
Bài: L01 Đọc một kiến trúc serverless từ trái sang phải · L02 IAM: hai lớp quyền của một hệ thống serverless · L03 Lambda: handler, cold start, concurrency và retry · L04 API Gateway: cổng vào và nơi chặn request rác · L05 S3 presigned URL và DynamoDB: dữ liệu to, truy vấn rẻ · L06 SQS, worker, DLQ và cách biết hệ thống đang chết dần · L07 Vòng đời một request trong FastAPI: từ khoá def quyết định số phận event loop · L08 Dependency injection cho auth và DB session: connection pool bị biến thành hàng đợi · L09 Backend Python gọi AWS: credential, timeout, retry và idempotency · L10 Lambda hay container/ECS: chọn theo vòng đời công việc, không theo mức độ hiện đại · L11 Đo lường và sự cố: log, metric, alarm, transaction và một dòng UPDATE thua cuộc · L12 Reactivity: ref, reactive và cái Proxy · L13 computed, watch và watchEffect: dependency, caching, side effect · L14 Component: SFC, script setup, props và emits · L15 Composable, provide/inject và Pinia: tách logic hay chia sẻ trạng thái · L16 Vue Router: route params, navigation guard và lazy loading · L17 Form, trạng thái và chuyển kiến thức từ React sang Vue · L18 Hợp đồng API giữa Vue và FastAPI · L19 Auth xuyên hai phía: token, nơi lưu, interceptor, và ai quyết định quyền · L20 Upload file: từ ô chọn file tới S3 · L21 Đẩy việc nặng sang SQS và worker · L22 Một tính năng end-to-end: từ ô nhập tới hàng trong DB, kèm ba chỗ hỏng · L23 DDoS: bản chất, các thời kỳ, và cách phòng thủ theo tầng.
(Tiêu đề dài: web cho xuống 2 dòng, không cắt; mobile tối đa 2 dòng rồi cắt.)

L01 goal: "Sau bài này bạn phải nói được ranh giới trách nhiệm chung nằm ở đâu, region và Availability Zone khác nhau thế nào, và một request đi qua gateway, hàm, cơ sở dữ liệu theo thứ tự nào."
L01 askFirst: (1) "Trong chuỗi trình duyệt, cổng vào, hàm, cơ sở dữ liệu, hàng đợi, tầng nào có thể xếp hàng mà không để lại dấu vết overload trên dashboard của chính nó?" (2) "Phần nào của chuỗi đó do AWS chịu trách nhiệm, phần nào là của bạn, và ranh giới đó nằm ở thao tác nào cụ thể?" (3) "Nếu bạn nhân bản gấp đôi tầng tính toán, điều gì có thể tệ hơn chứ không phải tốt hơn?"
L01 predict: "Giả sử bạn tăng gấp mười số instance chạy song song của service trung tâm trong cùng một Region. Theo bạn, tổng số kết nối tới cơ sở dữ liệu sau đó tăng hay giảm, và p99 của request đi theo chiều nào?"
L01 timeline: H+0 "Vụ sale cuối năm bắt đầu; 200 request/giây vào endpoint đăng ký" · H+4p "p99 tăng từ 180 ms lên 4,2 giây; request treo rồi trả 504" · H+6p "Mọi hộp đều 'chạy', không hộp nào báo quá tải" · H+20p "Request chết vì chờ suất kết nối tới tầng dữ liệu" · H+30p "Nhân bản tầng tính toán phải đi kèm mở trần tầng dưới".
L01 anchor: "Nhân bản tầng trên mà không mở trần tầng dưới làm p99 tăng thêm, không phải giảm; đọc chuỗi request là cách duy nhất biết mình đang sửa đúng chỗ."
L01 attacks: (1) "Bạn nói nhân bản tầng tính toán làm tầng dưới tệ hơn. Vậy khi nào nhân bản tầng trên là đúng và khi nào là sai?" (2) "Ranh giới trách nhiệm chung nằm ở đâu chính xác, và vì sao phần lớn sự cố bảo mật bắt nguồn từ chỗ vượt qua nó?" (3) "Một Zone mất điện, bạn có một instance ở mỗi hai Zone trong cùng Region. Hệ thống sống hay chết?" (4) "Vì sao đặt một lớp cache ở biên trước mỗi Region thay vì nhân bản cả stack sang nhiều Region?"
L01 câu hỏi liên quan: G01, G12, G05.
L07 (bài mobile): askFirst 1 "Vì sao CPU và RDS đều rảnh mà độ trễ lại tăng gấp sáu mươi lần?"; anchor "Một lệnh chặn trong async def khoá cả event loop, không chỉ request đang chạy."
G01: nhóm "G · AWS: Lambda, S3, SQS, RDS và DynamoDB", P0, L1: "Hãy phân biệt Region với Availability Zone và cho biết phía khách hàng chịu trách nhiệm gì trong mô hình trách nhiệm chung?"
Nhóm: A Python sâu: data model, GIL và asyncio · B JavaScript, event loop và TypeScript · C VueJS: reactivity, component và state · D Web nền tảng: HTTP, cache và bảo mật · E Python web: FastAPI và Django/DRF · F PostgreSQL: index, transaction và MVCC · G AWS: Lambda, S3, SQS, RDS và DynamoDB · H Container, CI/CD và vận hành · I System design và kiến trúc ứng dụng web · J Hành vi và giao tiếp trong công việc thực tế.
Gói: "Gói 6 giờ — dồn lực vào P0 của AWS, Vue và Python" (5 khối: AWS P0 · Vue P0 · Python P0 · FastAPI và Django P0 · Postgres và kiểm thử P0), "Gói 2 ngày", "Gói 3 ngày" (7 khối).
Bộ phỏng vấn thử: Cơn lưu luyện P0 đêm trước phỏng vấn · Bù khoảng trống AWS · Bù khoảng trống VueJS · Nền tảng Python và SQL · API, web và bảo mật · Full mock 30 câu, giống phòng phỏng vấn thật.
