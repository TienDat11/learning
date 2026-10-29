# L20: Upload lên S3 — ký quyền ghi, rồi xác nhận thứ thật sự nằm trong bucket

> **Trạng thái:** bản viết lại theo phong cách "vấn đề trước, cơ chế sau". Output ở mục 4 là output thật của script trong `l20/`.
> **Số liệu:** mọi con số là giả định của kịch bản, ghi rõ "giả sử" ở chỗ dùng.

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 nói ngay "chữ ký chỉ ràng buộc những gì nằm trong canonical request" mà chưa giải thích canonical request là gì, và vì sao `Content-Length` không ký được. Người đọc phải chấp nhận kết luận trước khi hiểu lý do.
- **Thuật ngữ chưa giải thích:** `presigned URL`, `ETag`, `head_object`, `VersionId`, `canonical request`, `forbidden request header`, `OAC`, `content-length-range` xuất hiện lần đầu không kèm ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** quan hệ "URL có hạn ≠ nội dung đúng" chỉ được phát biểu bằng văn xuôi, không có sơ đồ chữ cho ba trạm presign → PUT → confirm.
- **Câu quá dài / khô:** "Thứ tự này quan trọng hơn nó trông. Ký trước rồi mới ghi bản ghi: một lần ghi hỏng là một URL đã ra đời mà không ai giữ ID của nó" — câu thứ hai nhồi ba mệnh đề.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Giả sử một buổi sáng có 10.000 người tải tệp lên, mỗi tệp 5 MB. Server cấp một `presigned URL` (đường dẫn có chữ ký số và hạn dùng để trình duyệt tải tệp thẳng lên S3).

Một người dùng mạng 3G nhận URL lúc 10:04:12, URL sống 600 giây. Đường lên 50 kbit/s, tệp 5 MB cần khoảng 800 giây.

Câu hỏi dự đoán: người đó bấm gửi lúc 10:15 thì S3 trả gì? Đáp án: `403`.

Vì hạn tính từ lúc ký, không từ lúc byte bắt đầu đi. Và không thành phần nào trong hệ thống biết object nào đang tồn tại — trừ S3, mà S3 không tự gọi cho bạn.

### 2. Phép ví von đời thường & Sơ đồ chữ

Presigned URL giống phiếu gửi hàng có ghi giờ hết hiệu lực và địa chỉ kho: phiếu cho phép bạn tự mang hàng tới kho, nhưng không ghi hàng nặng bao nhiêu, và ai nhặt được phiếu cũng dùng được.

Giới hạn của phép ví von: phiếu giấy chỉ dùng một lần, còn presigned URL dùng lại được nhiều lần cho tới hạn — nên nó không chống được việc ghi đè.

```text
Vue ──POST /uploads/presign──► API ──ghi PENDING──► PostgreSQL
                                │
                                └──ký URL 10 phút──► Vue
                                                      │
                                          PUT byte thẳng (API không thấy)
                                                      ▼
                                                     S3
                                                      │
Vue ──POST /uploads/{id}/confirm──► API ──head_object─┘
                                     │
                        khớp ────────┴──────── lệch
                         │                       │
                    SCANNING → READY      xoá đúng VersionId
```

Chỗ chặn nằm ở mũi tên `head_object`: đó là lần duy nhất API chạm vào sự thật.

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Byte không đi qua API:** trình duyệt nói chuyện trực tiếp với S3. Nhờ vậy 50 GB không phải đi qua cổng hai lần, nhưng API cũng thôi làm nhân chứng.
- **Bước 2 — Chữ ký chỉ ràng buộc thứ đã ký:** `Content-Type` ký được nên S3 tự từ chối request sai header. `Content-Length` thì không, vì trình duyệt tự đặt header đó và JavaScript không được sửa.
- **Bước 3 — Vì vậy phải có bước xác nhận:** `head_object` trả metadata mà không trả body: kích thước, content type, `VersionId`, và `ETag` (mã băm kiểm tra tính toàn vẹn của đối tượng).
- **Bước 4 — Ghi bản ghi trước khi ký:** ký trước rồi mới ghi thì một lần ghi hỏng để lại một URL không ai giữ ID. Ghi trước thì chỉ còn một hàng `PENDING` mà worker dọn xử lý.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** nhận `key` từ client, ký URL sống một ngày, không có bước xác nhận. Hỏng ở ba điểm: client chọn key thì ghi đè được tệp của tenant khác; URL dài hạn thì dùng lại được lâu; và không ai đối chiếu nội dung.
- **Cách tốt:** server tự sinh key, ghi `PENDING` trước, ký 600 giây kèm `Content-Type`, rồi confirm bằng `head_object` và xoá theo `VersionId` khi lệch.

**Kiểm chứng bằng code (chạy thật):**

```
cd lessons/04-noi-hai-mang/l20
python presign_head.py
```

```
== Bước xác nhận: head_object rồi quyết định ==
bản ghi khai: 51200 byte, image/png

tình huống: đúng như đã khai
  quyết định: READY
  lý do     : khớp 51200 byte, image/png
  đã xoá    : không xoá gì

tình huống: sai kích thước
  quyết định: KHONG-READY
  lý do     : kích thước thật 943718400 byte khác lời khai 51200 byte; đã xoá version v2
  đã xoá    : [('tenant-a/avatar/9f3c1d2e4b5a.png', 'v2')]

tình huống: object chưa tồn tại
  quyết định: KHONG-READY
  lý do     : object chưa tồn tại: client chưa PUT hoặc PUT hỏng
  đã xoá    : không xoá gì
```

Script cũng tự kiểm công thức ký bằng đúng bộ tham số trong ví dụ của tài liệu S3: chữ ký tính được khớp từng ký tự với chữ ký tài liệu in, nên code ký đúng chuẩn. Phần `head_object` là mô phỏng bằng dict — nó giữ hình dạng dữ liệu và thứ tự quyết định, không giữ độ trễ mạng.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** không tốn băng thông hai lần, không chạm trần body của tầng trước; quyền ghi chỉ sống mười phút trên một key do server đặt; chỉ bản ghi `READY` mới được phục vụ.
- **Đánh đổi gì:** ba request thay vì một, thêm trạng thái trung gian và một worker dọn; Versioning tốn dung lượng; quét nội dung thêm độ trễ trước khi người dùng thấy tệp; hạn ngắn đẩy lỗi sang người mạng chậm.
- **Khi nào KHÔNG nên dùng:** tệp nhỏ, hiếm, không phục vụ lại cho người khác — upload qua API trực tiếp chỉ một request, không có object mồ côi. Cũng đừng dùng khi cần S3 tự chặn kích thước: lúc đó phải dùng presigned POST với `content-length-range`.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao không ký được kích thước vào một presigned PUT phát ra từ trình duyệt?

- **Trả lời mẫu (30–60 giây):** Vì `Content-Length` là forbidden request header: trình duyệt tự đặt nó và JavaScript không được sửa. Chữ ký chỉ ràng buộc những gì đã nằm trong canonical request, nên không có giá trị nào để ký. Vì vậy kích thước nằm ngoài hợp đồng và phải kiểm ở bước confirm bằng `head_object`.
- **Lỗi hay mắc khi trả lời:** nói "cứ thêm `ContentLength` vào `Params` là S3 chặn". Cách nói đúng: phải chuyển sang presigned POST nếu muốn S3 tự chặn kích thước.

### Câu 2: `head_object` trả về những gì, và dùng gì để quyết định chuyển `READY`?

- **Trả lời mẫu (30–60 giây):** HEAD trả metadata mà không trả body: `ContentLength`, `ContentType`, `VersionId`, `ETag`, và checksum nếu có. Ba trường quyết định là kích thước, content type, và `VersionId` của đúng bản vừa đọc. Kích thước bắt tệp sai cỡ, content type bắt tệp đội lốt, `VersionId` để lần xoá nhắm đúng một bản.
- **Lỗi hay mắc khi trả lời:** nói "đọc `ETag` rồi so với hash client gửi". Cách nói đúng: `ETag` của multipart không phải MD5 của cả tệp, nên đừng dùng nó làm bằng chứng toàn vẹn duy nhất.

### Câu 3: Một URL còn hạn nhận 900 MB tại key của một ảnh 5 MB. Phát hiện ở đâu, và vì sao xoá theo key là sai?

- **Trả lời mẫu (30–60 giây):** Phát hiện ở bước confirm, khi `head_object` trả `ContentLength` lớn hơn lời khai. Không phát hiện sớm hơn được vì chữ ký không mang kích thước. Xoá theo key là sai vì key có thể đã bị ghi đè: nếu giữa lúc đọc và lúc xoá có một PUT hợp lệ, xoá theo key xoá bản hợp lệ và để bản độc ở version cũ.
- **Lỗi hay mắc khi trả lời:** nói "rút hạn URL xuống 60 giây là chặn được". Cách nói đúng: script tự động bắn hai lệnh PUT trong vài trăm mili-giây, nên hạn ngắn không đóng được cửa sổ ghi đè.

### Câu 4: Client PUT xong rồi mất mạng trước khi gọi confirm. Thiết kế nào để object không thành rác vĩnh viễn?

- **Trả lời mẫu (30–60 giây):** Bản ghi `PENDING` đã được ghi trước khi ký, nên nó là manh mối duy nhất. Một worker định kỳ quét các bản ghi quá hạn, gọi `head_object` xem object có thật, rồi mới quyết định xoá hay đánh dấu lỗi. Thời hạn của worker phải dài hơn thời gian xác nhận tối đa, nếu không nó xoá object của một lời xác nhận đang trên đường tới.
- **Lỗi hay mắc khi trả lời:** nói "bật lifecycle xoá sau 24 giờ là xong". Cách nói đúng: lifecycle xoá cả object hợp lệ chưa kịp confirm; phải đối chiếu bản ghi trước.

---
## Ghi chú nguồn

- https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html — presigned URL là bearer token; S3 kiểm hạn tại thời điểm nhận request.
- https://docs.aws.amazon.com/AmazonS3/latest/developerguide/sigv4-query-string-auth.html — cấu trúc URL, `X-Amz-Expires`, và test vector dùng cho script.
- https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html — `HeadObject` trả `ContentLength`, `ContentType`, `VersionId`; 404 nếu có `s3:ListBucket`, 403 nếu không.
- https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header — `Content-Length` nằm trong danh sách forbidden request header.
