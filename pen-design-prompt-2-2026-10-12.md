# PROMPT 2 cho agent Pencil — vẽ tiếp phần còn thiếu

File: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen`.
Đọc lại `D:/research/pen-design-prompt-2026-10-12.md` (mục 0 token/quy tắc, mục 2 checklist, mục 3 dữ liệu thật). Mọi quy tắc ở đó vẫn áp dụng.

## Kết quả kiểm tra lượt 1 (đo bằng MCP)
- Mới có 1/16 màn: `mJRQx` "Trang chủ · Web". Đạt: 0 placeholder, 0 lỗi clip, 2 font đúng, chỉ dùng token `hcp-*`, dữ liệu 23 bài và 5 chặng đúng.
- Frame gốc `DZgw3` "Trang chủ · Web" đã bị xóa, trái với yêu cầu "không xóa 14 frame gốc". Nếu còn undo được thì khôi phục, nếu không thì ghi rõ trong báo cáo cuối.
- Có 61/125 chữ cỡ 12px (mono uppercase), gồm cả mã bài và chip trạng thái. Đây là thông tin chính của lộ trình, không phải meta.

## A. Sửa `mJRQx` (sửa trực tiếp, không vẽ lại)
1. Mã bài (L01…) và chip trạng thái lên 14px. Nhãn "CHẶNG 1", breadcrumb, "BƯỚC TIẾP THEO" giữ 12px.
2. Bỏ chip "CHƯA MỞ" ở 22 bài vì lặp lại thành nhiễu. Chưa mở thì không gắn chip, chỉ gắn "ĐANG KIỂM" (vàng) và "GO" (xanh). Giữ "không sơ đồ" màu fg-3.
3. Ô "Câu P0 đã nói thành tiếng" cần có mẫu số: "0 / 65". Ô "Thẻ đến hạn hôm nay": app dùng 5 hộp Leitner chỉ trên **bộ P0** (`src/90-app.js:889-950`, khoảng ôn 1·2·4·8·16 ngày), nên dòng phụ fg-3 ghi "bộ P0 · 65 câu · 5 hộp". Ngày đầu, mọi thẻ đều nằm ở hộp 1 và đều đến hạn, nên số thật là **65**; vẽ 65 cho trạng thái hôm nay. Không ghi "trên 136 câu" hay "cả 10 nhóm". Các số lấy từ `src/` ngày 2026-10-12: 136 câu, 65 P0, 28 quiz, 6 bộ phỏng vấn thử, 23 bài. App tự đếm khi chạy.
4. Thanh trên: thêm ô tìm kiếm "Tìm bài, câu hỏi, thuật ngữ" có gợi ý phím `/`, và nút đổi sáng/tối (icon). Đặt trước menu.
5. Card "Bước tiếp theo": bỏ khoảng trống khoảng 70px giữa dòng meta và tiêu đề. Dưới mô tả, thêm 3 câu askFirst thật của L01, đánh số, fg-2, 14px, để người học khởi động ngay.
6. Thêm một dải "Hôm nay" ngay dưới tiêu đề: "Gói 6 giờ · Khối 1/5: AWS P0 — Lambda, API Gateway, S3, IAM, RDS/DynamoDB" kèm nút "Tiếp tục khối". Mục đích: người học có 8 ngày, cần biết hôm nay làm gì.

## B. Vẽ các màn còn thiếu, theo thứ tự này (xong màn nào thì chụp màn đó)
1. Trang chủ · Điện thoại (390). Thứ tự: tiêu đề "Còn 8 ngày", dải Hôm nay, card Bước tiếp theo, 3 số liệu trên một hàng cuộn ngang, 4 lối vào xếp lưới 2×2, 5 chặng thu gọn được (chặng đang học mở sẵn). Thanh dưới cố định: Trang chủ · Ngày học · Ôn câu · Quiz · Thử PV, mỗi nút cao ít nhất 44px.
2. Bài L01 · Web, trạng thái A (pha 1 đang làm), đúng mục 1.2 của prompt 1. Thanh 5 pha dính trên. Mỗi pha có hàng "GO khi: …" và nút "Xác nhận GO". Pha 2–5 ở trạng thái thu gọn nhưng vẫn thấy tiêu đề và một dòng mô tả. Cột phải gồm Câu neo, Tài liệu đọc, Nguồn.
3. Bài L01 · Web, trạng thái B: pha 1 đã GO (xanh, thu gọn, có dấu tick), pha 2 mở với khung sơ đồ 16:9, Khái niệm, Cơ chế. Thêm pha 3 mở để thấy timeline 5 mốc, code block tối và khối Nguyên nhân gốc.
4. Bài L01 · Web, trạng thái C: pha 4 (đồng hồ 30s/90s, bản mẫu bị che mờ, 5 câu sayIt) và pha 5 (4 câu CTO thu gọn, 1 câu mở đáp án, 3 khối Đánh đổi / Phương án khác / Quan sát, chip G01 · G12 · G05).
5. Bài L07 · Điện thoại: thanh pha dính trên, có nút mở ngăn kéo "Câu neo / Tài liệu". Thanh dưới cố định: "Xác nhận GO pha 1" (nút chính) và "Pha sau".
6. Ôn câu hỏi · Web + Điện thoại: thẻ G01 ở trạng thái (a) chưa mở và (b) đã mở, đúng mục 1.4 của prompt 1. Cột lọc liệt kê 10 nhóm kèm số câu: A 18 · B 14 · C 15 · D 14 · E 12 · F 12 · G 18 · H 13 · I 8 · J 12 (tổng 136). Nhóm C có thêm C14 "defineProps generic, withDefaults và typed emits trong Vue 3 với TypeScript" và C15 "Pinia store có kiểu TypeScript: setup store, storeToRefs và biên dữ liệu API". Có thể dùng C14 làm thẻ ví dụ thứ hai.
7. Ngày học · Web + Điện thoại (mục 1.3 prompt 1).
8. Quiz · Web + Điện thoại: một màn đang làm câu, một màn tổng kết.
9. Phỏng vấn thử · Web + Điện thoại: màn chọn bộ, màn đang phỏng vấn, màn tổng kết.
10. Bản tối (Copy rồi đặt `theme:{mode:"dark"}` cho frame): Trang chủ · Web và Bài L01 · Web trạng thái A.

## C. Báo cáo cuối
In danh sách id → tên màn, và với mỗi màn: số placeholder (phải = 0), số chữ dưới 14px ngoài nhãn meta (phải = 0), số node có `problems` (phải = 0). Export PNG vào `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/exports/v2/`.
