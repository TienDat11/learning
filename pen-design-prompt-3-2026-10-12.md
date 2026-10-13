# PROMPT 3 cho agent Pencil — dừng vẽ biến thể, vẽ các màn còn thiếu

File: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen`.
Đọc lại `D:/research/pen-design-prompt-2026-10-12.md` (mục 0 token/quy tắc, mục 2 checklist, mục 3 dữ liệu thật) và `D:/research/pen-design-prompt-2-2026-10-12.md` (mục B). Mọi quy tắc ở đó vẫn áp dụng.

## Kết quả kiểm tra lượt 2 (đo bằng MCP ngày 2026-10-12)
- Mục B của prompt 2 (10 màn) chưa có màn nào: không có Trang chủ · Điện thoại mới, Bài L01 A/B/C, L07 mobile, Ôn câu hỏi, Ngày học, Quiz, Phỏng vấn thử, bản tối.
- Thay vào đó có 6 biến thể Trang chủ · Web: `ZFepf`, `SjiKO`, `mhtom`, `byuD0`, `y44qC`, `EdkvG`. Năm frame `SjiKO`…`EdkvG` dùng palette/font ngoài token (`sw-*` Archivo/Inter/Geist Mono, `cc-*` Familjen/Public Sans, `mv-*` Newsreader, `zk-*` Zilla Slab/Space Mono, `dp-*` Chakra Petch/IBM Plex + amber). Điều này trái với mục 0 prompt 1: hướng H5 + token `hcp-*` đã chốt, không mở lại.
- `exports/v2/Ui7oq.png` có trong thư mục export nhưng node `Ui7oq` không còn trên canvas.
- `ZFepf` "1. Trang chủ · Web" đạt gần hết mục A: chỉ dùng `hcp-*` và 2 font đúng, 0 placeholder, 0 clip, đã bỏ chip CHƯA MỞ, có ô tìm `/`, có dải Hôm nay + "Tiếp tục khối", có 3 câu askFirst, có "0 / 65". Còn 1 lỗi: ô "Thẻ đến hạn hôm nay" vẽ **12** với dòng phụ **"trên 136 câu"** (node `Nr5sQ`, `yM5p6`), trong khi prompt 2 mục A.3 yêu cầu **65** và "bộ P0 · 65 câu · 5 hộp".

## A. Chốt Trang chủ · Web
1. `ZFepf` là bản chuẩn của Trang chủ · Web. Sửa: `Nr5sQ` → "67"; `yM5p6` → "bộ P0 · 67 câu · 5 hộp". Ô "Câu P0 đã nói thành tiếng" → "0 / 67". (Dữ liệu vừa tăng: hiện có 139 câu, 67 câu P0. App tự đếm khi chạy; vẽ theo số này.)
2. Gom 5 biến thể `SjiKO`, `mhtom`, `byuD0`, `y44qC`, `EdkvG` và `mJRQx` sang cột riêng phía dưới (Move, không xóa), đổi tên thành tiền tố "[Bỏ] ". Không tạo thêm biến thể nào nữa.

## B. Vẽ đúng 10 màn của prompt 2 mục B, theo thứ tự
Copy `ZFepf` hoặc `LSwtv`/`KkN9g` làm khung. Chỉ dùng token `hcp-*`, font `$hcp-font` / `$hcp-mono`. Xong màn nào thì chụp màn đó, chạy checklist mục 2 prompt 1, rồi mới sang màn sau.
1. Trang chủ · Điện thoại (390).
2–4. Bài L01 · Web, trạng thái A / B / C.
5. Bài L07 · Điện thoại.
6. Ôn câu hỏi · Web + Điện thoại. Số câu theo nhóm hiện tại: A 18 · B 14 · C 15 · D 14 · E 12 · F 12 · G 21 · H 13 · I 8 · J 12 (tổng 139). Có thể dùng G27 "SNS, SQS, EventBridge: fan-out và chọn dịch vụ khi đơn hàng tạo xong" làm thẻ ví dụ thứ hai.
7. Ngày học · Web + Điện thoại.
8. Quiz · Web + Điện thoại (đang làm + tổng kết).
9. Phỏng vấn thử · Web + Điện thoại (chọn bộ + đang phỏng vấn + tổng kết).
10. Bản tối: copy `ZFepf` và Bài L01 · Web trạng thái A, đặt `theme:{mode:"dark"}`.

## C. Yêu cầu mới: người học là newbie AWS/cloud
Nội dung đang được bổ sung giải thích thuật ngữ ngay trong bài. Thiết kế phải có chỗ cho phần này:
- Bài L01 (cả A/B/C) và L07 mobile: đầu pha 2 "Hệ thống" có khối **"Thuật ngữ cần biết"**: danh sách 5 dòng, mỗi dòng gồm thuật ngữ đậm + 1 câu giải thích fg-2 14px. Dữ liệu L01: "Region: một vùng địa lý của AWS, ví dụ Singapore, gồm nhiều trung tâm dữ liệu." · "Availability Zone (AZ): một trung tâm dữ liệu độc lập về điện và mạng bên trong Region." · "Serverless: bạn chỉ viết hàm, AWS lo máy chủ và tự tăng giảm số bản chạy." · "Mô hình trách nhiệm chung: AWS giữ an toàn cho hạ tầng, bạn giữ an toàn cho cấu hình, quyền và dữ liệu của mình." · "p99: độ trễ mà 99% request nhanh hơn, tức là 1% request chậm nhất."
- Thẻ câu hỏi đã mở (màn 6, trạng thái b): khối "Thuật ngữ cần biết" nằm trước "Giải thích sâu", thu gọn được, mặc định mở.
- Trong đoạn văn, thuật ngữ có giải thích ngay sau nó trong ngoặc (fg-2), ví dụ "EC2 (máy chủ ảo thuê theo giờ)". Không vẽ tooltip hay trang thuật ngữ riêng.

## D. Báo cáo cuối
In danh sách id → tên màn. Với mỗi màn mới: số placeholder (= 0), số chữ dưới 14px ngoài nhãn meta (= 0), số node có `problems` (= 0), danh sách font và tiền tố biến màu đã dùng (chỉ `hcp-`). Export PNG vào `exports/v2/`. Nói rõ việc `Ui7oq` có trên canvas hay không, và `DZgw3` có khôi phục được hay không.
