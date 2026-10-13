# PROMPT 5 cho agent Pencil — vẽ 5 màn còn thiếu

File `.pen`: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen`
Dữ liệu: `D:/research/pen-data-pack-2-2026-10-13.md` — sinh bằng script `D:/research/tools/gen-pen-pack.mjs` đọc trực tiếp `src/*.js`. **Mọi chữ có nội dung bạn vẽ phải chép từ file này.** Không có trong đó thì không được vẽ.

Đọc lại file pack trước khi vẽ. Không hỏi lại; không chắc thì chọn phương án sát pack nhất, làm tiếp, ghi lại ở báo cáo cuối.

---

## 0. Bối cảnh: 19 màn đã xong, còn thiếu 5

`ACONG` ("Bộ màn chuẩn · hcp") hiện có **6 hàng, 19 màn**, đã đo lại và đạt sạch: mỗi màn `placeholder=0`, `problems=0`, không chữ nội dung nào dưới 14px. Không sửa gì trong 19 màn đó.

Bản web thật còn **5 màn nữa** chưa từng được vẽ. Chúng đã có dữ liệu đầy đủ trong `src/` nhưng chưa lên canvas:

| # | Màn mới | Khổ | Nguồn dữ liệu trong pack |
|---|---|---|---|
| 20 | Case study xuyên suốt · Web | 1440 | mục **1** |
| 21 | Nguồn tham khảo · Web | 1440 | mục **2** |
| 22 | Flashcard · Web | 1440 | mục **3** |
| 23 | Flashcard · Điện thoại | 390 | mục **3** |
| 24 | Bắt đầu: cách dùng tài liệu này · Web | 1440 | mục **4** |

**Mục tiêu duy nhất:** 5 màn này nằm trong `ACONG`, mỗi màn 0 placeholder, 0 node có `problems`, 0 chữ nội dung dưới 14px, 0 chữ tự bịa, và được export PNG vào `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/exports/v3/` (thư mục này chưa có, `Export` sẽ tự tạo; 19 màn cũ nằm ở `exports/v2/`).

Chỉ dừng khi cả 5 màn đạt. Không dừng giữa chừng để hỏi hay báo cáo dở.

---

## 1. Chèn vào đâu

Thêm **2 hàng mới** vào cuối `ACONG`, cách hàng trên 120px, mỗi hàng là một frame con auto-layout ngang căn trên, đặt `name` theo đúng quy ước các hàng cũ (`Hàng <n> · <mô tả>`):

- **`Hàng 7 · Case study, Nguồn`**: màn 20, 21 (hai frame 1440 cạnh nhau).
- **`Hàng 8 · Flashcard, Bắt đầu`**: màn 22, 23, 24 (1440, 390, 1440 cạnh nhau).

Giữ nguyên 6 hàng cũ `Z1r25T` (`Hàng 1 · Trang chủ`), `SB5dg` (`Hàng 2 · Bài L01`), `EGwR4` (`Hàng 3 · L07, Ôn câu hỏi`), `nDdzo` (`Hàng 4 · Ngày học`), `T5nzNy` (`Hàng 5 · Quiz`), `n1BHN` (`Hàng 6 · Phỏng vấn thử`). Không xoá, không đổi tên frame nào. Hàng mới phải hug nội dung, không để 0×0.

Tên frame (đặt `name` đúng chuỗi này):

- `20 · Case study · Web`
- `21 · Nguồn tham khảo · Web`
- `22 · Flashcard · Web`
- `23 · Flashcard · Điện thoại`
- `24 · Bắt đầu · Web`

---

## 2. Token và font — chỉ dùng cái đã có

File đã định nghĩa **647 biến**. Dùng đúng tên, không tạo biến mới, không hardcode hex.

Bảng `hcp-*` (có theme light/dark, đây là bảng phải dùng):

`hcp-bg` · `hcp-surface` · `hcp-sunken` · `hcp-fg` · `hcp-fg-2` · `hcp-fg-3` · `hcp-line` · `hcp-line-2` · `hcp-accent` · `hcp-accent-ink` · `hcp-accent-soft` · `hcp-ok` · `hcp-ok-fill` · `hcp-ok-soft` · `hcp-warn` · `hcp-warn-fill` · `hcp-warn-soft` · `hcp-err` · `hcp-err-soft` · `hcp-code-bg` · `hcp-code-fg`

Font: `$hcp-font` = `Be Vietnam Pro` (mọi chữ nội dung), `$hcp-mono` = `JetBrains Mono` (mã, số, nhãn kỹ thuật).

Thang đo **đo được trên 19 màn cũ** — dùng đúng các giá trị này, không phát minh giá trị mới:

- Cỡ chữ: `12` · `14` · `16` · `18` · `26` · `28` · `40`. Nhãn meta in hoa dùng `12`; **mọi chữ nội dung khác ≥ 14**.
- Độ đậm: `normal` · `600` · `700`. Không dùng giá trị khác.
- Bo góc: `4` · `6` · `8` · `12` · `16`. Khối và ô dùng `8`; thẻ dùng `12`; chip và ô `<kbd>` dùng `6` hoặc `4`.

Không thêm màu, không thêm font, không thêm cỡ chữ ngoài danh sách trên.

---

## 3. Thanh điều hướng — giữ nguyên 5 mục

19 màn cũ dùng thanh 5 mục: `Trang chủ` · `Ngày học` · `Ôn câu hỏi` · `Quiz` · `Phỏng vấn thử`.

**Không thêm mục mới.** Năm màn mới dùng lại đúng thanh đó, tô đậm theo bảng sau (đây là quyết định đã chốt, không mở lại):

| Màn | Mục tô đậm |
|---|---|
| 20 Case study | `Trang chủ` |
| 21 Nguồn tham khảo | `Trang chủ` |
| 22 Flashcard · Web | `Ôn câu hỏi` |
| 23 Flashcard · Điện thoại | `Ôn câu hỏi` |
| 24 Bắt đầu | `Trang chủ` |

Màn 23 dùng thanh dưới cố định như màn `t7CKUy` (Ôn câu hỏi · Điện thoại) đang có.

---

## 4. Năm màn — nội dung bắt buộc

### Màn 20 — Case study xuyên suốt · Web (1440)

Tiêu đề trang: `Case study xuyên suốt`.
Mở bài, nguyên văn: `Ứng dụng quản lý tài liệu: Vue 3 · Python API · PostgreSQL · S3 · SQS worker · Docker/CI-CD. Đi hết happy path rồi đi hết từng failure mode.`

Bố cục hai cột:

**Cột trái — danh sách 17 mục.** Đúng 17 dòng, đúng thứ tự trong bảng mục 1 của pack. Mục 1 (`Kiến trúc tổng thể`) là mục **đang chọn**: nền `hcp-accent-soft`, chữ `hcp-accent-ink`. 16 mục còn lại nền `hcp-surface`, chữ `hcp-fg-2`. Đây là thứ giúp người học thấy trọn vòng đời hệ thống trong một cái liếc.

**Cột phải — nội dung mục 1.**
1. Khối mở đầu: đậm `DocuHub: ứng dụng quản lý tài liệu trên AWS`, dưới là đoạn `pitch` (pack mục 1).
2. Tiêu đề mục: `Kiến trúc tổng thể`.
3. Toàn văn thân mục 1, chép từ pack mục "Toàn văn mục 1 — Kiến trúc tổng thể". Giữ đúng các đoạn đậm dẫn dắt: `Bối cảnh.` · `Failure mode điển hình.` · `Cơ chế vòng đời request.` · `Cách sửa.` · `Tradeoff.` · `Vì sao PostgreSQL mà không phải DynamoDB.` Danh sách 5 bước của "Cơ chế vòng đời request" là `<ol>` 5 mục. Chỗ nào pack ghi trong dấu `` ` `` thì vẽ bằng font `$hcp-mono`.
4. Khung sơ đồ 16:9 ở cuối mục, chứa sơ đồ `flow-request-lifecycle` với 5 nút đúng thứ tự: `Browser` → `CloudFront` → `API Gateway` → `ECS Fargate` → `RDS`. Dưới sơ đồ là chú thích (caption) của sơ đồ đó, nguyên văn từ pack mục 5.

Cột trái rộng khoảng 340, cột phải phần còn lại. Không vẽ 16 mục còn lại.

### Màn 21 — Nguồn tham khảo · Web (1440)

Tiêu đề trang: `Nguồn tham khảo`.
Mở bài, nguyên văn: `Chỉ dẫn tài liệu chính thức. Ngày kiểm tra ghi kèm từng mục. Bài blog và diễn đàn không được dùng làm nguồn chính ở đây.`

Một khối ghi chú ngay dưới, nguyên văn: `Ngày kiểm tra toàn bộ liên kết: 2026-10-01.`

Dưới đó là **8 nhóm**, đúng thứ tự A→H, tiêu đề nhóm là tên nhóm trong pack mục 2. Mỗi nhóm là một danh sách, mỗi dòng một nguồn:

- Tên nguồn (nguyên văn từ pack, ví dụ `Python Data Model`) — đây là phần được gạch chân và tô `hcp-accent-ink`.
- Bên phải, cỡ nhỏ: `<nhóm> · kiểm tra <ngày>`, ví dụ `A · kiểm tra 2026-10-01`, chữ `hcp-fg-3`, font `$hcp-mono`.

Vẽ đủ **122 dòng** trong 8 nhóm. Số mục mỗi nhóm: A 9 · B 10 · C 9 · D 5 · E 8 · F 7 · G 68 · H 6. Không rút gọn, không "…".

Nhóm G có 68 mục nên màn sẽ dài — được phép chia nhóm G thành nhiều cột, miễn giữ đúng thứ tự và đúng nội dung.

### Màn 22 — Flashcard · Web (1440)

Tiêu đề trang: `Flashcard`.
Mở bài, nguyên văn: `Đọc câu hỏi, trả lời miệng, rồi mới bật đáp án. Tự chấm: biết hoặc yếu — trạng thái lưu vào tiến độ.` Hai chữ `biết` và `yếu` in nghiêng.
Dòng phím tắt, nguyên văn: `Space hiện đáp án · ← → đổi câu · 1 biết · 2 yếu · / tìm kiếm`. Mỗi phím (`Space`, `←`, `→`, `1`, `2`, `/`) là một ô `<kbd>`: nền `hcp-sunken`, viền `hcp-line-2`, font `$hcp-mono`.

Thẻ flashcard ở giữa, **đang mở đáp án**:

1. Hàng meta, đúng thứ tự 6 chip này: `A01` · `P0` · `A` · `L1` · chủ đề `So sánh danh tính và so sánh giá trị, is và ==` · trạng thái `Chưa học`. Ô đếm `Câu 1 / 147` đặt cạnh nút đáp án.
2. Mặt trước (câu hỏi), nguyên văn từ pack mục 3.
3. Nút `Ẩn đáp án` (đang mở nên nhãn là `Ẩn đáp án`, không phải `Hiện đáp án`) và bên cạnh là ô đếm.
4. Ba khối mặt sau, đúng thứ tự này, mỗi khối có nhãn riêng:
   - `Trả lời miệng 30–60 giây` — đoạn văn lấy từ pack.
   - `Giải thích sâu` — phần thân dài.
   - `Kết quả đúng và nguyên nhân` — khối có nền `hcp-warn-soft`.
5. Hàng 4 nút ở đáy: `← Câu trước` · `Câu sau →` · `Đã nắm` · `Cần ôn lại`.

### Màn 23 — Flashcard · Điện thoại (390)

Cùng nội dung màn 22, dồn một cột, thanh dưới cố định 5 mục, mục `Ôn câu hỏi` tô đậm.

Trên 390px: thẻ chiếm toàn bộ bề ngang trừ lề; hàng meta xuống dòng; hai nút `Đã nắm` / `Cần ôn lại` là nút chính, đặt trên thanh dưới, mỗi nút cao **ít nhất 44px**. Chỉ vẽ trạng thái **chưa mở đáp án**: nút là `Hiện đáp án`.

### Màn 24 — Bắt đầu: cách dùng tài liệu này · Web (1440)

Tiêu đề trang: `Bắt đầu: cách dùng tài liệu này`. Không có mở bài.

Một cột nội dung rộng khoảng 820, canh giữa, gồm **5 đề mục** đúng thứ tự trong pack mục 4:

1. `Cách dùng` — danh sách 5 gạch đầu dòng, chép nguyên văn từ pack. Gạch đầu dòng 1 có mệnh đề mở đậm: `Một lượt ôn = một vòng.` Gạch 3 có hai chỗ in nghiêng: `Đã nắm`, `Cần ôn lại`.
2. `Lịch ôn` — một đoạn văn, chép nguyên văn từ pack (đã bao gồm tên ba gói).
3. `Nói thẳng về điểm yếu` — một khối `note` (nền `hcp-sunken`, viền `hcp-line`), chữ trong đó đậm ở `AWS` và `Vue 3`.
4. `Tài liệu này là gì và không là gì` — một khối `note` chứa danh sách 3 gạch đầu dòng, chép nguyên văn.
5. `Mười nhóm kiến thức` — bảng 10 dòng, 4 cột: `Nhóm` · `Vì sao phải biết` · `P0` · `Số câu`. Nội dung lấy từ bảng cuối pack mục 4. Hàng tiêu đề nền `hcp-sunken`; cột `Nhóm` dùng `hcp-fg` đậm, cột `Vì sao phải biết` dùng `hcp-fg-2`, hai cột số canh phải và dùng font `$hcp-mono`.

Đây là màn dài (bảng 10 dòng × cột "Vì sao" dài). Cho phép màn cao bao nhiêu cũng được; không cắt chữ, không rút gọn cột "Vì sao".

---

## 5. Sáng tạo: được và không được

Được, và khuyến khích: tự quyết bố cục, phân cấp chữ, nhịp khoảng trắng, cách thể hiện trạng thái đang chọn, cách chia cột cho danh sách dài. Ví dụ: cột trái màn case study vẽ như một mục lục có vạch tiến trình; nhóm nguồn chia hai cột; chip nhóm tô màu theo nhóm A–J.

Không được: sáng tạo **dữ liệu**. Cụ thể:

- Không tự đặt tên tài liệu, không tự viết lại câu trả lời, không thêm câu hỏi, không đổi số.
- Không rút gọn danh sách. 17 mục là 17. 122 nguồn là 122.
- Không đổi nhãn đã có trong pack. Nếu một nhãn không có trong pack, xoá nó khỏi design.
- Không thêm màu hoặc font ngoài mục 2.
- Không vẽ biến thể thứ hai của bất kỳ màn nào.

Đây là app ôn phỏng vấn cho người mới học AWS. Mỗi màn phải trả lời được câu "bây giờ tôi làm gì tiếp" trong 3 giây.

---

## 6. Quy ước đặt tên node (bắt buộc, để đếm được)

Trước khi vẽ, chốt cách đặt `name` cho node lá. Script kiểm ở mục 7 đếm theo `name`, nên tên phải theo đúng quy ước. Hai tiền tố dưới đây **chưa được dùng ở bất kỳ frame nào khác trên canvas** — dùng đúng chúng, đừng dùng tiền tố `Mục ` (đã có 129 node khác mang tiền tố đó, sẽ làm sai phép đếm).

- **Màn 20**: mỗi dòng trong danh sách 17 mục đặt tên `Case <n> · <h>` (ví dụ `Case 1 · Kiến trúc tổng thể`, `Case 17 · Cloud giải được gì, và khi nào người ta rời đi`).
- **Màn 21**: mỗi dòng nguồn đặt tên `Source <n>` với `<n>` chạy 1..122 liên tục qua cả 8 nhóm (A trước, H cuối), đúng thứ tự trong pack.
- **Màn 22, 23, 24**: tên node tự do, chỉ cần dễ đọc.

## 7. Vòng làm cho MỖI màn (bắt buộc, không bỏ bước)

1. Dựng màn, `placeholder: true`. Mỗi node phải có `name` theo mục 6.
2. Chạy script kiểm dưới đây cho màn đó. Phải đạt `ph 0`, `problems 0`, `lt14` chỉ gồm nhãn meta in hoa, `bad` rỗng.
3. Chụp `TakeScreenshot([id])` rồi **xem ảnh**. Phải không có chữ tràn, không có khung sụp 0×0, không có chồng lấn.
4. Đặt `placeholder: false`, export PNG vào `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/exports/v3/`, rồi mới sang màn sau.

```js
const id='<ID>';let ph=0,pr=0;const lt=[],bad=[],fonts=new Set(),vars=new Set();
Get(id,(m,c)=>{if(m.placeholder)ph++;if(c.problems)pr++;
for(const k of ['fill','color','stroke']){const v=m[k];if(typeof v==='string'&&v[0]==='$')vars.add(v.split('-')[0]);}
if(m.type==='text'){const s=String(m.content);if(m.fontFamily)fonts.add(String(m.fontFamily));
if(typeof m.fontSize==='number'&&m.fontSize<14&&s.trim()&&s!==s.toUpperCase())lt.push(s.slice(0,30));
if(/Lorem|TODO|placeholder|Bản mẫu|Ví dụ minh hoạ|Chưa có nội dung|Nội dung sẽ cập nhật|\bXXX\b/.test(s))bad.push(s.slice(0,40));}
return undefined;});
Print(id,'ph',ph,'problems',pr,'lt14',lt.length,lt.join(' / '),'| fonts',[...fonts].join(','),'| vars',[...vars].join(','),'| bad',bad.join(' / '));
```

Đếm số dòng phải khớp — chạy riêng cho màn 20 và 21:

```js
Print('case rows',Get('<id màn 20>',(n)=>n.name&&n.name.indexOf('Case ')===0?1:undefined).length);
Print('source rows',Get('<id màn 21>',(n)=>n.name&&n.name.indexOf('Source ')===0?1:undefined).length);
```

Kỳ vọng: `case rows 17`, `source rows 122`. Nếu lệch, sửa tên node hoặc bổ sung dòng còn thiếu rồi đo lại.

---

## 8. Báo cáo cuối (chỉ gửi khi 5/5 đạt)

1. Bảng 5 dòng: id → tên màn → kết quả script (`ph` / `problems` / `lt14` / `bad`) → số dòng đã kiểm (`17`, `122`, hoặc `—`) → đường dẫn PNG.
2. Xác nhận 2 hàng mới nằm trong `ACONG`, tên và id hàng.
3. Mục "Đã chọn khi không chắc": mỗi dòng một quyết định và lý do. Không có thì ghi "không có".

Không viết "đã làm" cho việc chưa có số đo của script đi kèm.
