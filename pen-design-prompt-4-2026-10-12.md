# PROMPT 4 cho agent Pencil — MỘT mục tiêu, làm tới khi xong

File: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen`
Dữ liệu: `D:/research/pen-data-pack-2026-10-12.md`. File này được sinh bằng script từ `src/*.js`. **Mọi chữ có nội dung bạn vẽ phải lấy từ file này.**
Quy tắc token và font giữ nguyên như prompt 1 mục 0: chỉ dùng biến `hcp-*`, font `$hcp-font` và `$hcp-mono`.

## MỤC TIÊU DUY NHẤT
Frame `ACONG` chứa đủ **19 màn** ở bảng dưới. Mỗi màn có 0 placeholder, 0 node có `problems`, 0 chữ nội dung dưới 14px, 0 chữ tự bịa. Mỗi màn được export PNG vào `exports/v2/`.
Chỉ dừng khi cả 19 màn đạt. Không dừng giữa chừng để hỏi, không dừng để báo cáo dở. Bảng 19 màn, lưới, nhãn được phép và script kiểm đều nằm trong file này; đọc lại file thay vì hỏi. Nếu không chắc một chi tiết, chọn phương án sát `pen-data-pack` nhất, làm tiếp, rồi ghi lại trong báo cáo cuối.

## Sự thật đo bằng MCP lúc 2026-10-12 (đừng cãi, cứ sửa theo)
- Báo cáo trước ghi "5 biến thể đã được gom, không xóa". Sai: `SjiKO`, `mhtom`, `byuD0`, `y44qC`, `EdkvG` **không còn trong file**. Ba frame cũ đã đổi tên thành `[Bỏ] Trang chủ · Web` (`mJRQx`), `[Bỏ] 1. Bộ màn · hcp` (`YYF3t`), `[Bỏ] 2. Bộ màn · phương án B` (`nK0QT`).
- `ACONG` là bộ chuẩn. **ID thật đo bằng MCP lúc 2026-10-12 tối** (đã dựng xong 19/19 màn; dùng bảng này, đừng dùng ID cũ `TmPkD`, `T0svj`, `x97RRZ`, `D2jUx`, `GbuX6`, `A5CiU7`, `PDU35`, `kOo3D`, `UMChd`, `HHbc7`, `ZAHmY`, `NQypQ`, `O5Zag`, `Ok2mi`, `FWUXC`):
  - `Z1r25T` Hàng 1 · Trang chủ: `M4Mca` màn 1 · `f0PS7t` màn 2 (dark) · `HSmVZ` màn 3
  - `SB5dg` Hàng 2 · Bài L01: `TviG6` màn 4 · `JIPT1` màn 5 · `JaO5E` màn 6 · `k30Kyi` màn 7 (dark)
  - `EGwR4` Hàng 3 · L07, Ôn câu hỏi: `LVxjj` màn 8 · `Axvrb` màn 9 · `t7CKUy` màn 10
  - `nDdzo` Hàng 4 · Ngày học: `jAjkG` màn 11 · `gpO7b` màn 12
  - `T5nzNy` Hàng 5 · Quiz: `CoSuG` màn 13 · `SRZYJ` màn 14 · `JBZ4V` màn 15
  - `n1BHN` Hàng 6 · Phỏng vấn thử: `BW0FS` màn 16 · `dhMa0` màn 17 · `szBzQ` màn 18 · `sCvnc` màn 19
  - Cả 19 màn đã `problems=0`, `lt14=0`, `bad` rỗng; PNG đã export vào `exports/v2/`.
- `nK0QT`, `YYF3t`, `mJRQx` đã đổi tên "[Bỏ] …" và dời xuống dưới `ACONG`. Không xóa.
- **Chữ bịa cũ đã dọn sạch.** Đo lại bằng MCP 2026-10-12 tối. Các frame cũ nêu ở bản prompt trước (`GbuX6`, `u07as7`, `uPInL`, `rioZ3`, `VAg0W`, `q9Yu0m`, `x8Ubu`, `D2jUx`, `PDU35`…) không còn trên canvas; PNG cũ nằm ở `exports/v2/_old/`.
  Đã kiểm bằng đọc node (✔ = đạt, đừng sửa lại):
  - ✔ 19/19 màn `problems=0`, `lt14=0`, `bad` rỗng; không frame nào 0×0.
  - ✔ Nút chính mỗi màn bài học = "Hoàn thành chặng này" (TviG6, JIPT1, JaO5E, k30Kyi, LVxjj); không còn "Xác nhận GO" / "Pha sau" / "Bài trước" / "Bài sau" / "Bài đạt khi pha 3 và pha 5 GO".
  - ✔ Không còn "Bản mẫu 30 giây" / "Mở bản mẫu" (JaO5E) và "Bắt đầu khối" (jAjkG, gpO7b).
  - ✔ Quiz đang làm (CoSuG) vẽ đúng QZ19 nguyên văn, đáp án A, "Câu 19/28"; tổng kết (SRZYJ) "21/28 đúng (75%)", "Câu sai: 7", nhãn "VÍ DỤ".
  - ✔ Ngày học (jAjkG, gpO7b): khối 1 có đủ "Làm gì" + "Làm thế nào" + "Câu nào / 8 câu P0 nhóm G"; khối 2–5 chỉ có "Làm gì".
  - ✔ L07 (LVxjj) không có khung sơ đồ; `flow: null` trong `src/`.
  - ✔ Ôn câu hỏi (Axvrb): G01 có "Thuật ngữ cần biết" 5 mục, "Trả lời miệng", "Chuỗi hỏi sâu 3 tầng" (3 followup thật), "Tự chấm" 3 nút = 3 câu selfcheck.
  - ✔ Thanh điều hướng tô đậm đúng mục: Axvrb/t7CKUy → Ôn câu hỏi; jAjkG/gpO7b → Ngày học; CoSuG/SRZYJ/JBZ4V → Quiz; BW0FS/dhMa0/szBzQ/sCvnc → Phỏng vấn thử. Màn bài học tô "Trang chủ" vì bài nằm trong lộ trình ở trang chủ.
  Chưa kiểm (nếu sửa màn liên quan thì kiểm lại): pixel-level của màn 16–19 (Phỏng vấn thử) và màu dark mode của f0PS7t/k30Kyi.
- Kiểm lại bằng script trong mục "Vòng làm cho MỖI màn" nếu bạn sửa bất kỳ màn nào: `problems` phải 0, `bad` rỗng, `lt14` chỉ gồm nhãn meta in hoa.
- **Nhãn không có nguồn đã bị xóa khỏi canvas:** "Xác nhận GO", "Bài đạt khi pha 3 và pha 5 GO", "Bài trước", "Bài sau", "Bắt đầu khối", "Pha sau", "Bản mẫu 30 giây", "Mở bản mẫu". Nút chính của bài học đúng nguồn là **"Hoàn thành chặng này"** / **"Bài tiếp theo / Về danh sách"** (`vue-app/src/views/Lesson.vue:182`). Đừng vẽ lại các nhãn cũ.
- Số liệu đúng: **147 câu, 71 câu P0, nhóm G 29 câu**. "Thẻ đến hạn" 71, dòng phụ "bộ P0 · 71 câu · 5 hộp", ô "0 / 71", lối vào "Ôn câu hỏi" 147 câu.
- Khối "Thuật ngữ cần biết" của L01 có **7 mục** nguyên văn: Cloud, Region, Availability Zone (AZ), Managed service, Serverless, Shared responsibility model, p99.
- Sơ đồ L01 có 5 nút: Trình duyệt → CloudFront → API Gateway → ECS Fargate → RDS (xem pack).
- Tài liệu đọc của L01 đúng 3 tên: **Amazon VPC · AWS Lambda — Best practices · AWS CloudFormation**.
- Pack đã sinh lại sau khi sửa chú thích trong `src/`. AZ ghi "một hoặc nhiều trung tâm dữ liệu". p99 ghi "mốc độ trễ mà 99% request nhanh hơn hoặc bằng". Serverless không còn ý "chỉ viết hàm". Chép đúng bản mới.

## Quyền hạn (lệnh của chủ file, ghi đè mọi quy tắc "không đụng frame của agent khác")
- Bạn được phép đọc, Copy, đổi tên và di chuyển **mọi** frame, kể cả `mJRQx`, `YYF3t`, `nK0QT` và các frame do agent con tạo.
- Trước khi sửa, kiểm tra không còn agent con nào đang chạy trên `ACONG` hoặc `nK0QT`. Nếu còn, chờ chúng dừng. Không spawn thêm agent.
- Muốn lấy phần tốt từ `nK0QT` (`CdWFB`, `u07as7`, `blaD2`) hoặc `YYF3t` thì được Copy vào `ACONG`. Lấy về rồi vẫn phải sửa chữ theo pack.
- Khi 19 màn đã đạt: đổi tên `YYF3t`, `nK0QT`, `mJRQx` thành "[Bỏ] <tên cũ>" và dời chúng xuống dưới `ACONG`. **Không xóa** frame nào. Đổi tên `ACONG` thành "Bộ màn chuẩn · hcp".

## 19 màn trong `ACONG` (đúng thứ tự, xếp lưới, cách nhau 120px)
| # | Màn | Khổ | Nguồn |
|---|---|---|---|
| 1 | Trang chủ · Web | 1440 | sửa `TmPkD` |
| 2 | Trang chủ · Web · Tối | 1440 | sửa `T0svj` (`theme:{mode:"dark"}`) |
| 3 | Trang chủ · Điện thoại | 390 | sửa `x97RRZ` |
| 4 | Bài L01 · Web · A (pha 1 đang làm) | 1440 | sửa `D2jUx` |
| 5 | Bài L01 · Web · B (pha 1 GO, pha 2 và 3 mở) | 1440 | sửa `GbuX6` |
| 6 | Bài L01 · Web · C (pha 4 và 5 mở) | 1440 | sửa `A5CiU7` |
| 7 | Bài L01 · Web · A · Tối | 1440 | Copy màn 4, `theme:{mode:"dark"}` |
| 8 | Bài L07 · Điện thoại | 390 | mới |
| 9 | Ôn câu hỏi · Web | 1440 | mới |
| 10 | Ôn câu hỏi · Điện thoại | 390 | mới |
| 11 | Ngày học · Web | 1440 | mới |
| 12 | Ngày học · Điện thoại | 390 | mới |
| 13 | Quiz · Web · đang làm | 1440 | mới |
| 14 | Quiz · Web · tổng kết | 1440 | mới |
| 15 | Quiz · Điện thoại · đang làm | 390 | mới |
| 16 | Phỏng vấn thử · Web · chọn bộ | 1440 | mới |
| 17 | Phỏng vấn thử · Web · đang phỏng vấn | 1440 | mới |
| 18 | Phỏng vấn thử · Web · tổng kết | 1440 | mới |
| 19 | Phỏng vấn thử · Điện thoại · đang phỏng vấn | 390 | mới |

**Xếp lưới trong `ACONG`** (cách nhau 120px cả ngang lẫn dọc, mỗi hàng một frame con auto-layout ngang, căn trên):
- Hàng 1: màn 1, 2, 3
- Hàng 2: màn 4, 5, 6, 7
- Hàng 3: màn 8, 9, 10
- Hàng 4: màn 11, 12
- Hàng 5: màn 13, 14, 15
- Hàng 6: màn 16, 17, 18, 19
Hàng thừa: không có. Giữ đúng 6 hàng `Z1r25T`, `SB5dg`, `EGwR4`, `nDdzo`, `T5nzNy`, `n1BHN`; màn đang nằm sai hàng thì dời sang đúng hàng. Mỗi hàng phải hug nội dung (không để 0×0 sau khi có màn).

**Chuẩn nhãn:** mỗi chữ trên design phải có nguồn trong bảng dưới (file:dòng trong `vue-app/src`, hoặc dòng trong pack). Chữ không có trong bảng và không có trong pack → xóa khỏi design. Danh sách này không tự hợp lệ: mỗi dòng đã được script đối chiếu với `vue-app/src` và pack ngày 12/10.

**Nhãn có nguồn** (dùng nguyên văn):
- Tên 5 pha bài học: "1. Kiểm tra trước khi bay" · "2. Hệ thống (sơ đồ)" · "3. Mô phỏng sự cố" · "4. Phát biểu" · "5. Hỏi-đáp CTO" — `Lesson.vue:15-19`.
- Trong bài học: "Sự cố" (`Lesson.vue:89`), "Dòng thời gian" (`Lesson.vue:91`), "Nguyên nhân gốc" (`Lesson.vue:97`), "Trả lời 30 giây" / "Trả lời 90 giây" (`Lesson.vue:103-104`), "Phải nói được" (`Lesson.vue:106`), "CTO hỏi:" (`Lesson.vue:119`), "Dự đoán trước khi xem đáp án:" + nút "Hiện đáp án" (`Lesson.vue:66-67`), "Gợi nhớ 01:" (`Lesson.vue:62`), "← Về" (`Lesson.vue:141`), "Chặng n / 6" (`Lesson.vue:166`), nút "Hoàn thành chặng này" / "Bài tiếp theo / Về danh sách" (`Lesson.vue:182`). Tiêu đề khối lấy từ pack: "Khái niệm", "Cơ chế", "Timeline", "Cách sửa ngây thơ", "Lỗi thường gặp", "Thuật ngữ cần biết", "Câu neo", "Tài liệu đọc", "Câu hỏi liên quan", "Quan sát được gì" (pack mục L01). "Đánh đổi", "Phương án khác" (`DrillCard.vue:125,129`).
- Ôn câu hỏi: "Tình huống", "Tự hỏi trước khi trả lời", "Đoán trước", "Tôi đã nói xong, mở đáp án", "Trả lời miệng", "30 giây", "90 giây", "Đi sâu", "Kết quả mong đợi", "Chuỗi hỏi sâu 3 tầng", "Hiện đáp án", "Lỗi hay gặp", "Quan sát trên production", "Câu hỏi phản biện", "Tự chấm" (`DrillCard.vue:61-149`); 3 nút tự chấm = 3 câu selfcheck trong pack. Cột lọc: "Tìm", "Tất cả nhóm", "Ưu tiên", "Mức", "Tất cả" (`Drill.vue:124-143`), "Chỉ thẻ đến hạn hôm nay (N)" (`Drill.vue:151`), "N thẻ" (`Drill.vue:157`), "← Trước" / "Sau →" (`Drill.vue:168-170`).
- Hôm nay (Leitner, `Today.vue`): "Phương pháp Leitner" (123), "Đúng thì lên hộp. Sai thì về hộp một." (124), "Mở đáp án" / "Thu đáp án" (156), "Nhớ được" / "Chưa nhớ" (160-161), "Sẵn sàng" (167), "(đề xuất, không phải điểm chuẩn)" (169).
- Trang chủ (`Home.vue`): "Lộ trình học — 23 bài" (50), "Bước tiếp theo:" (64), "Đã học" / "Chưa học" (82). Số liệu tổng và ô "Thẻ đến hạn hôm nay" / "Câu P0 đã nói thành tiếng" lấy theo pack dòng 6-8.
- Phỏng vấn thử (`Mock.vue`): "Mock interview" (110), dòng giới thiệu (112), "← Danh sách bộ" (125), "Câu i/N" (133), đồng hồ "m:ss" (53, 134 — Vue in "1:30", không phải "01:30"), "Xem đáp án" / "Hết giờ, xem đáp án" (164), "Hỏi sâu" (151), "Xong bộ" (174), "Đạt k/N" (175), "Cần ôn lại: <ID>, …" (177), "Ôn n câu chưa đạt" (179), "Làm lại bộ này" / "Chọn bộ khác" (184-185).
- Quiz (`Quiz.vue`): "Câu i/N" (59), "Nhóm X" (60), "Tình huống" (61), "Đúng." / "Chưa đúng. Đáp án là <chữ>." (78), "Câu tiếp" / "Xem kết quả" (84), "Kết quả" (90), "k/N đúng (p%)" (91), "Câu sai: n" (93), "Đáp án: <chữ>. <lựa chọn>" (97), "Làm lại câu sai (n)" (104), "Làm lại từ đầu" (106).
- Ngày học: "Gói 6 giờ" / "Gói 2 ngày" / "Gói 3 ngày", "Làm gì", "Làm thế nào", "Câu nào" (pack mục Ngày học).
- Thanh điều hướng: `App.vue:75,79` hiện chỉ có "Hôm nay (Leitner)" và "Lộ trình 23 bài". Thanh 5 mục trên design ("Trang chủ", "Ngày học", "Ôn câu hỏi", "Quiz", "Phỏng vấn thử") **chưa có nguồn**; giữ nguyên, chờ người dùng chốt có nối 5 trang vào App.vue hay không.

**Không có nguồn — xóa khỏi design:** "Bản mẫu 30 giây", "Mở bản mẫu", "Bạn phải nói được" (dùng "Phải nói được"), "GO khi: …", "Xác nhận GO", "Xác nhận GO pha 1", "Pha sau", "Câu neo · Tài liệu", "Bài đạt khi pha 3 và pha 5 GO", "Bài trước", "Bài sau", "Bắt đầu khối", "Hôm nay có 71 thẻ đến hạn", "HÔM NAY", "Tìm câu hỏi", "Tầng 1/2/3", "KHỐI n".

**Số trên design — cách đếm:**
- 147 câu, 71 P0, 23 bài, 5 chặng, Quiz 28, 6 bộ: đếm `QUESTIONS`, `prio==='P0'`, `LESSONS`, `stage` khác nhau, `QUIZ`, `MOCK_SETS` (pack dòng 6).
- "71" thẻ đến hạn: lần đầu chưa ôn câu nào → mọi câu P0 đều đến hạn (`Drill.vue:236` `dueTotal`).
- Số câu mỗi bộ phỏng vấn: `LOGIC.resolvePick` trên `MOCK_SETS[k].pick` — 25 / 28 / 23 / 27 / 22 / 31 (theo thứ tự p0_blitz, aws_focus, vue_focus, python_sql_core, web_api_security, full_mock).
- Số câu mỗi nhóm trên chip lọc: đếm `QUESTIONS` theo `group` (pack dòng 11-20).
- Ví dụ trạng thái (Đạt 18/25, 21/28 đúng, Câu sai: 7, Câu 19/28, 1:30): là trạng thái mẫu, phải gắn nhãn "Ví dụ".


Nội dung bắt buộc từng màn:
- **1–3**: số liệu theo pack. Ngoài ra giữ nguyên những gì `ZFepf` đã đạt: dải "Hôm nay", card "Bước tiếp theo" kèm 3 câu askFirst, ô tìm có gợi ý phím `/`, không có chip "CHƯA MỞ".
- **4–7**:
  - Tất cả: khối "Thuật ngữ cần biết" có 7 mục.
    - Trạng thái A: hiện thành dải thu gọn ngay trên pha 2. Hàng tiêu đề ghi "Thuật ngữ cần biết · 7", có mũi tên mở.
    - Trạng thái B: mở sẵn ở đầu pha 2.
    - Trạng thái C: thu gọn.
  - Màn B: sơ đồ 5 nút thật trong khung 16:9; code `naiveCode` nguyên văn trên nền code tối; dưới code là đoạn `naiveOut`.
  - Màn C: 5 câu sayIt, 4 câu attacks (1 câu mở kèm đáp án thật), 3 khối Đánh đổi / Phương án khác / Quan sát được gì, chip G01 · G12 · G05.
  - Cột phải ở cả 4 màn: Câu neo, Tài liệu đọc (đúng 3 tên thật, không có mục "Nguồn" riêng).
- **8 (L07)**:
  - Thanh pha dính ở trên.
  - Có nút mở ngăn kéo "Câu neo · Tài liệu".
  - Thanh dưới cố định: nút chính "Hoàn thành chặng này", cao ít nhất 44px.
  - Khối "Thuật ngữ cần biết" của L07 **chưa có trong src**. Chỉ vẽ hàng tiêu đề thu gọn, không tự viết mục nào.
- **9–10 (Ôn câu hỏi)**:
  - Cột lọc (trên điện thoại là chip cuộn ngang) ghi 10 nhóm, mỗi nhóm có tên đầy đủ và số câu theo pack.
  - Thẻ G01 vẽ 2 trạng thái: (a) chưa mở: câu hỏi + nút "Tôi đã nói xong, mở đáp án"; (b) đã mở theo thứ tự "Thuật ngữ cần biết" (5 mục, mở sẵn) → "Trả lời miệng" (oral 2 câu đầu) → "Chuỗi hỏi sâu 3 tầng" (3 followup thật, đáp án ẩn) → Tài liệu (2 refs của G01) → "Tự chấm" 3 nút selfcheck của G01.
  - Thẻ G27 vẽ ở trạng thái (a).
- **11–12 (Ngày học)**:
  - Có 3 tab gói: 6 giờ / 2 ngày / 3 ngày. Đang chọn "Gói 6 giờ".
  - Hiện 5 khối theo thứ tự. Khối 1 nổi bật, có 3 dòng "Làm gì / Làm thế nào / Câu nào".
  - Khối 2–5 chỉ hiện dòng "Làm gì".
  - "Câu nào" diễn đạt bằng chữ, ví dụ "8 câu P0 nhóm G". Không hiện JSON.
- **13–15 (Quiz)**:
  - Đang làm: QZ19 kèm 4 lựa chọn A–D thật, đã chọn A, hiện "Đúng." và phần giải thích thật. Thanh tiến độ "Câu 19/28".
  - Tổng kết: "21/28 đúng (75%)", "Câu sai: 7", danh sách câu sai kèm "Đáp án: …", nút "Làm lại câu sai (7)" và "Làm lại từ đầu". Không chia điểm theo 10 nhóm (app không có).
  - Số điểm ở màn tổng kết là trạng thái minh hoạ. Ghi rõ nhãn "Ví dụ" bằng chữ fg-3 cỡ 12px.
- **16–19 (Phỏng vấn thử)**:
  - Chọn bộ: 6 bộ thật, mỗi bộ có tên, brief, "N câu" (số câu tối đa trong pack) và nút "Bắt đầu".
  - Đang phỏng vấn (17 web, 19 điện thoại): bộ "Bù khoảng trống AWS", câu G01, "Câu 1/28", đồng hồ vòng "1:30" đếm ngược 90 giây. Màn 17 vẽ trạng thái đã mở đáp án: "Trả lời miệng" (oral G01), "Hỏi sâu" (3 followup), 2 nút "Đạt" / "Chưa đạt". Màn 19 vẽ trạng thái chưa mở: nút "Xem đáp án" ở thanh dưới cao ≥ 44px.
  - Tổng kết: "Xong bộ", "Đạt 21/28", "Cần ôn lại: …" (7 ID nhóm G có thật), nút "Ôn 7 câu chưa đạt", "Làm lại bộ này", "Chọn bộ khác"; nhãn "Ví dụ".

## Sáng tạo: được và không được
Được, và khuyến khích: tự quyết bố cục, phân cấp chữ, nhịp khoảng trắng, cách thể hiện trạng thái và cách biểu diễn trực quan. Ví dụ:
- Vẽ 5 hộp Leitner thành 5 cột có số thẻ.
- Timeline sự cố đặt dọc, có mốc đỏ.
- Đồng hồ phát biểu dạng vòng.
- Bản đồ 23 bài dạng tuyến tàu.

Đây là app ôn phỏng vấn cho người mới học AWS. Mỗi màn phải trả lời được câu "bây giờ tôi làm gì tiếp" trong 3 giây.
Không được: sáng tạo **dữ liệu**. Cụ thể là không tự đặt tên tài liệu, không viết code thay, không thêm câu hỏi, không đổi số. Không thêm màu hoặc font ngoài `hcp-*`. Không vẽ biến thể thứ hai của bất kỳ màn nào.

## Vòng làm cho MỖI màn (bắt buộc, không bỏ bước)
1. Dựng hoặc sửa màn.
2. Chụp `TakeScreenshot([id])` rồi xem ảnh. Phải không có chữ tràn, không có khung sụp 0×0, không có chồng lấn.
3. Chạy script kiểm dưới đây cho màn đó. Phải đạt `ph 0`, `problems 0`, `lt14` chỉ gồm nhãn meta in hoa, `bad` rỗng.
4. Đặt `placeholder:false`, export PNG, rồi mới sang màn sau.

```js
const id='<ID>';let ph=0,pr=0;const lt=[],bad=[],fonts=new Set(),vars=new Set();
Get(id,(m)=>{if(m.placeholder)ph++;const p=m.problems;if(p&&(Array.isArray(p)?p.length:Object.keys(p).length))pr++;
for(const k of ['fill','color','stroke']){const v=m[k];if(typeof v==='string'&&v[0]==='$')vars.add(v.split('-')[0]);}
if(m.type==='text'){const s=String(m.content);if(m.fontFamily)fonts.add(String(m.fontFamily));
if(typeof m.fontSize==='number'&&m.fontSize<14&&s.trim()&&s!==s.toUpperCase())lt.push(s.slice(0,30));
if(/Shared Responsibility|Well-Architected|Regions và|AWS Documentation|Global Infrastructure|psycopg2|replicas =|\b67\b|136|139|cold start xảy ra|Gần đúng|Đã nắm|thẻ P0|Nói thành lời|Bảo vệ|20:00|Câu tiếp theo|Hết phiên|Chọn 6 bài|Đọc L01 đến L06|một trung tâm dữ liệu độc|1% request chậm nhất|chỉ viết hàm/.test(s))bad.push(s.slice(0,40));}
return undefined;});
Print(id,'ph',ph,'problems',pr,'lt14',lt.length,lt.join(' / '),'| fonts',[...fonts].join(','),'| vars',[...vars].join(','),'| bad',bad.join(' / '));
```

## Báo cáo cuối (chỉ gửi khi 19/19 đạt)
1. Bảng 19 dòng, mỗi dòng: id → tên màn → kết quả script (ph / problems / lt14 / bad) → đường dẫn PNG.
2. Danh sách frame đã đổi tên "[Bỏ]".
3. Mục "Đã chọn khi không chắc": mỗi dòng ghi một quyết định và lý do. Nếu không có thì ghi "không có".

Không viết "đã làm" cho việc chưa có số đo của script đi kèm.
