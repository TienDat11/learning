# L20: Upload lên S3: ký quyền ghi, rồi xác nhận thứ thật sự nằm trong bucket

> **Trạng thái:** bản viết lại đủ bảy bước, nằm ngoài `src/`. Chưa nối vào app, chưa đo với người đọc thứ hai.
> **Số liệu:** mọi con số trong bài là giả định của kịch bản, được ghi "Giả sử" ở chỗ dùng. Không phải số đo từ hệ thống thật, không phải mặc định của AWS.

**Tiên quyết:** biết một HTTP request gồm method, path, header và body; biết S3 lưu object theo cặp bucket và key; biết một API trả JSON.

## Bước 1. Đoán trước

Giả sử một buổi sáng có 10.000 người dùng tải tệp lên, mỗi tệp trung bình 5 MB. Một người dùng mạng 3G nhận URL ký lúc 10:04:12, URL sống 600 giây. Đường lên của người đó đo được 50 kbit/s.

1. Người đó bấm gửi lúc 10:15. S3 trả gì?
2. Một người khác PUT xong 5 MB rồi mất mạng trước khi gọi endpoint xác nhận. Lúc đó thành phần nào trong hệ thống biết object ấy đang tồn tại?

Viết đáp án ra giấy. Đáp án nằm ở cuối bước 3.

## Bước 2. Điều bạn đã biết

Bạn đã từng làm upload kiểu này: Vue gửi `POST /files` kèm `FormData`, server đọc từng khối byte, ghi xuống đĩa hoặc vào một kho, rồi trả về đường dẫn. Một request, một nơi giữ byte, và server biết chính xác mình vừa nhận gì vì nó vừa đọc nó.

Bài này giữ nguyên mục tiêu đó — đưa byte của người dùng vào một kho bền — và thay từng khớp:

- Kho là S3, không phải đĩa của server.
- Byte không đi qua API. Trình duyệt nói chuyện trực tiếp với S3.
- Quyền ghi không phải một token trong header, mà là một chữ ký nằm trong URL.

Khớp thứ ba là khớp đáng chú ý nhất. Khi byte không đi qua API, API thôi làm nhân chứng. Nó cấp quyền rồi đứng ngoài, nên mọi thứ nó biết về tệp, cho tới khi tự đi kiểm, đều là lời khai của client.

Tài liệu S3 gọi presigned URL là bearer token: ai giữ URL thì dùng được, không cần thêm gì. Câu đó giải thích cả ba chuyện trong bài này cùng lúc — hạn phải ngắn, key phải do server đặt, và nội dung phải tự đi kiểm.

## Bước 3. Một ví dụ có số

Giả sử 10.000 người, mỗi người 5 MB. Tổng byte là 50.000 MB, khoảng 50 GB.

Nếu byte đi qua API, 50 GB vào cổng và 50 GB ra S3. Giả sử tầng trước đặt trần body 10 MB — con số của kịch bản, không phải mặc định của dịch vụ nào — thì tệp 5 MB vừa khít và tệp 12 MB không qua được. Với presigned URL, API chỉ gửi đi 10.000 URL, mỗi URL khoảng 300 byte, tổng khoảng 3 MB.

Giờ tới phần hạn. Giả sử đường lên 50 kbit/s. Tệp 5 MB là 40 Mbit, tức 40.000 kbit. Chia cho 50 kbit mỗi giây được 800 giây, khoảng 13 phút 20 giây. URL sống 600 giây và được ký lúc 10:04:12, nên hết hạn lúc 10:14:12. Người đó bắt đầu lúc 10:15, muộn hơn hạn gần một phút. S3 từ chối.

Còn phần object mồ côi: giả sử 1.240 object nằm trong bucket mà không hàng metadata nào trỏ tới, mỗi object 5 MB. Đó là 6.200 MB, khoảng 6,05 GB, và hoá đơn dung lượng tháng nào cũng có phần này.

**Đáp án bước 1:** PUT nhận 403, vì hạn tính từ lúc ký chứ không từ lúc byte bắt đầu đi. Và không thành phần nào trong hệ thống biết object kia tồn tại: bản ghi vẫn ở trạng thái chờ, không ai có danh sách object. Chỉ S3 biết, và S3 không tự gọi cho bạn.

## Bước 4. Cơ chế, từng bước một

```mermaid
sequenceDiagram
  participant V as Vue
  participant A as API FastAPI
  participant D as PostgreSQL
  participant S as S3
  V->>A: POST /uploads/presign (loại, kích thước khai, content-type)
  A->>D: ghi bản ghi PENDING, key do server sinh
  A-->>V: 413 / 415, hoặc URL ký cho đúng một PUT
  V->>S: PUT byte (không qua API)
  V->>A: POST /uploads/{id}/confirm
  A->>S: head_object(key)
  S-->>A: ContentLength, ContentType, VersionId
  A->>D: khớp thì SCANNING rồi READY, lệch thì lỗi
```

1. **Xin quyền ghi.** Vue gửi loại tệp, kích thước khai và content type. API trả 413 nếu vượt hạn mức, 415 nếu loại không nằm trong allowlist, rồi tự sinh key dạng `uploads/{tenant}/{kind}/{uuid}`.

   Key do server sinh, không phải client chọn. Lý do nằm trong tài liệu S3: nếu object cùng key đã tồn tại, S3 thay thế object cũ bằng object vừa tải lên. Ghi đè là hành vi mặc định, không phải lỗi cấu hình, nên cho client chọn key là cho nó quyền ghi đè dữ liệu của tenant khác.

2. **Ghi bản ghi trước, ký sau.** Hàng PENDING vào PostgreSQL trước, URL ký sau. Hạn của URL là `X-Amz-Date` cộng `X-Amz-Expires`, và tài liệu nói rõ S3 kiểm hạn tại thời điểm nhận request. Vì vậy URL sống mười phút tính từ giây ký, không phải từ giây người dùng bấm gửi.

   Thứ tự này quan trọng hơn nó trông. Ký trước rồi mới ghi bản ghi: một lần ghi hỏng là một URL đã ra đời mà không ai giữ ID của nó. Ghi trước: một lần ký hỏng chỉ để lại một hàng PENDING mà worker dọn sẽ xử lý.

3. **Byte đi thẳng.** Trình duyệt PUT lên S3. Chữ ký chỉ ràng buộc những gì đã nằm trong canonical request: method, path, query string, và các header có tên trong `X-Amz-SignedHeaders`.

   `Content-Type` ký được, và nên ký. `Content-Length` thì không: nó nằm trong danh sách forbidden request header của Fetch, nghĩa là trình duyệt tự đặt và JavaScript không được sửa. Không có cách nào ký một con số kích thước vào một PUT phát ra từ trình duyệt. Đây là toàn bộ lý do phải có bước 4.

4. **Xác nhận bằng `head_object`.** Endpoint confirm gọi HEAD lên key. HEAD trả metadata mà không trả body: `ContentLength`, `ContentType`, `VersionId`, `ETag`, và checksum nếu object được tải lên kèm checksum. Đọc ba thứ, so với bản ghi:

   - kích thước thật so với kích thước client đã khai;
   - content type thật so với loại đã khai và đã ký;
   - `VersionId` của bản vừa đọc, để ghim đúng bản đó.

   Khớp thì chuyển sang quét nội dung, và chỉ sau khi quét xong mới READY. Lệch thì xoá đúng `VersionId` vừa đọc và đánh dấu bản ghi lỗi.

   Phải xoá theo version, không theo key. Trong mười phút URL còn sống, người khác có thể PUT đè lên cùng key. Xoá theo key là xoá bản mới nhất — có thể là bản hợp lệ — và để bản độc ở một version cũ mà không ai nhìn thấy.

5. **Dọn phần dư.** Worker định kỳ tìm bản ghi PENDING quá hạn, gọi `head_object` xem object có thật, rồi mới xoá. Không kiểm trước khi xoá là xoá nhầm object của một lời xác nhận đang trên đường tới.

Một chi tiết dễ sai khi viết code: `head_object` trả 404 khi bạn có quyền `s3:ListBucket`, và 403 khi không có — tài liệu nói rõ. Nên nhánh xử lý phải coi cả hai là "không đọc được metadata", chứ đừng chỉ bắt 404 rồi để 403 rơi vào nhánh lỗi hệ thống.

**Vì sao URL còn hạn không chứng minh nội dung.** URL chứng minh ba thứ: người gửi có quyền ghi, trên key này, trong khoảng thời gian này. Nó không nói gì về số byte, và cũng không nói gì về việc lần PUT nào đã ghi. Hai lời gọi PUT cùng một URL, cùng một key, cả hai trước hạn: lần thứ hai ghi đè lần thứ nhất, và chữ ký hợp lệ trong cả hai lần.

## Bước 5. Thí nghiệm nhỏ

Chạy trong thư mục `lessons/04-noi-hai-mang/l20/`. Script chỉ dùng thư viện chuẩn của Python 3.

```
python presign_head.py
```

Kết quả đã chạy trên máy này:

```
== Kiểm code ký với ví dụ trong tài liệu S3 ==
chữ ký tính được: aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
chữ ký tài liệu : aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
khớp: True

== Presigned URL cho một lần PUT ==
X-Amz-Algorithm     AWS4-HMAC-SHA256
X-Amz-Credential    AKIAFAKEFAKEFAKE0001/20261029/ap-southeast-1/s3/aws4_request
X-Amz-Date          20261029T100412Z
X-Amz-Expires       600
X-Amz-SignedHeaders content-type;host
X-Amz-Signature     8777f404a581cb5dfea5f67b3c1fd4b86617ae2d6966b9c04da40b531c0dcae7
Header đã ký        content-type: image/png
URL đầy đủ:
https://htc-uploads.s3.ap-southeast-1.amazonaws.com/tenant-a/avatar/9f3c1d2e4b5a.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAFAKEFAKEFAKE0001%2F20261029%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20261029T100412Z&X-Amz-Expires=600&X-Amz-SignedHeaders=content-type%3Bhost&X-Amz-Signature=8777f404a581cb5dfea5f67b3c1fd4b86617ae2d6966b9c04da40b531c0dcae7

Chú ý: trong URL không có kích thước. Không có tham số nào nói
object phải nặng đúng 51200 byte.

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

Đọc output theo ba phần.

**Phần đầu là phép tự kiểm.** Script tự viết công thức ký, rồi chạy trên đúng bộ tham số trong ví dụ của tài liệu S3 — cùng bucket, key, thời điểm và credential mẫu công khai. Chữ ký ra khớp từng ký tự với chữ ký tài liệu in, nên code ký đúng chuẩn chứ không phải một chuỗi bịa trông giống chữ ký.

**Phần giữa là URL của kịch bản.** Credential là chuỗi giả, không gọi được AWS, nhưng cấu trúc URL thì thật: `X-Amz-Expires` bằng 600, `X-Amz-SignedHeaders` chỉ có `content-type;host`. Nhìn vào đó thấy ngay điều bài này muốn nói: không tham số nào mang kích thước.

**Phần cuối là ba quyết định.** Cùng bản ghi khai 51.200 byte và `image/png`, ba trạng thái kho cho ba kết quả:

- Object khớp: READY, không xoá gì.
- Object nặng 943.718.400 byte, mang `text/html`: KHONG-READY, xoá đúng version `v2` vừa đọc chứ không xoá theo key.
- Không có object: KHONG-READY, không xoá gì — xoá ở đây là xoá hư không.

Phần `head_object` trong script là **mô phỏng** bằng một dict, không phải lời gọi S3. Cái được mô phỏng là hình dạng dữ liệu trả về và thứ tự quyết định; cái không được mô phỏng là độ trễ, lỗi mạng, và việc S3 thật trả 403 thay vì 404 khi thiếu quyền `ListBucket`.

**Tự thử:** đổi `DECLARED_TYPE` thành `"image/jpeg"` rồi chạy lại. Tình huống thứ nhất chuyển thành KHONG-READY, và lý do là content type lệch. Đó chính là nhánh bắt được object `text/html` đội lốt ảnh.

## Bước 6. Bốn câu luyện tập

Trả lời trước khi mở đáp án.

**Câu 1.** Vì sao không ký được kích thước vào một presigned PUT phát ra từ trình duyệt?

<details>
<summary>Đáp án</summary>

Kết luận: vì `Content-Length` là forbidden request header, trình duyệt tự đặt nó và JavaScript không được sửa, nên không có giá trị nào để đưa vào canonical request mà ký. Chữ ký chỉ ràng buộc những gì đã ký, nên kích thước nằm ngoài hợp đồng.

Điều kiện để đúng: request phát ra từ trình duyệt qua Fetch hoặc XHR. Với client tự viết, header đặt được, nên ký kích thước mới có nghĩa — nhưng client đó cũng tự sửa được, nên giá trị bảo vệ thấp hơn vẻ ngoài.

Cách kiểm: thử `fetch(url, {headers: {"Content-Length": "100"}})` từ trình duyệt và xem header thật gửi đi. Giá trị bạn đặt không xuất hiện.

</details>

**Câu 2.** `head_object` trả về những gì, và dùng những gì trong đó để quyết định chuyển READY?

<details>
<summary>Đáp án</summary>

Kết luận: HEAD trả metadata mà không trả body — `ContentLength`, `ContentType`, `VersionId`, `ETag`, và checksum nếu có. Ba trường quyết định là kích thước, content type, và `VersionId` của đúng bản vừa đọc.

Kích thước bắt được tệp to hơn hoặc nhỏ hơn lời khai. Content type bắt được tệp đội lốt. `VersionId` để lần xoá và lần phục vụ sau đó nhắm đúng một bản, thay vì nhắm "bản mới nhất của key" — thứ có thể đã đổi giữa hai lời gọi.

Điều kiện để đúng: bản ghi phải được ghi trước khi ký, nếu không thì không có gì để so.

Cách kiểm: ghi cả giá trị thật và giá trị khai vào log ở bước xác nhận. Chênh lệch khác 0 trên đường bình thường nghĩa là chữ ký đang thiếu một ràng buộc.

</details>

**Câu 3.** Một URL còn hạn nhận được 900 MB tại key của một ảnh đại diện khai 5 MB. Hệ thống phát hiện ở đâu, và vì sao xoá theo key là sai?

<details>
<summary>Đáp án</summary>

Kết luận: phát hiện ở bước xác nhận, khi `head_object` trả `ContentLength` lớn hơn kích thước đã khai. Không phát hiện sớm hơn được, vì chữ ký không mang kích thước và API không thấy byte nào.

Xoá theo key là sai vì key có thể đã bị ghi đè. Nếu giữa lúc đọc metadata và lúc xoá có một PUT hợp lệ khác, xoá theo key xoá bản hợp lệ và để bản độc nằm ở version cũ. Xoá theo `VersionId` vừa đọc thì chỉ đụng đúng bản đã kiểm.

Điều kiện để đúng: bucket bật Versioning. Không có Versioning thì không có `VersionId`, và mọi lần xoá đều là xoá cả key.

Cách kiểm: cho hai lời gọi PUT cùng URL, lần đầu 5 MB, lần hai 900 MB. `head_object` sau đó trả 900 MB; xoá theo version rồi `head_object` lại thì object không còn.

</details>

**Câu 4.** Client PUT xong rồi mất mạng trước khi gọi confirm. Không có gì trong API biết chuyện đó. Thiết kế nào để object không thành rác vĩnh viễn?

<details>
<summary>Đáp án</summary>

Kết luận: bản ghi PENDING đã được ghi trước khi ký, nên nó là manh mối duy nhất. Một worker định kỳ quét các bản ghi PENDING quá hạn, gọi `head_object` xem object có thật, rồi mới quyết định xoá hay đánh dấu lỗi.

Thời hạn của worker phải dài hơn thời gian xác nhận tối đa, nếu không nó xoá object của một lời xác nhận đang trên đường tới.

Điều kiện để đúng: bản ghi được ghi trước khi ký. Nếu ký trước, object mồ côi không có hàng nào trỏ tới, và cách duy nhất tìm ra nó là liệt kê cả bucket rồi đối chiếu.

Cách kiểm: đếm số object trong bucket và số hàng READY theo cùng một mốc. Khoảng cách phải tiến về 0 chứ không chỉ dao động.

</details>

## Bước 7. Câu neo

> Presigned URL chỉ thực thi đúng những gì đã ký vào nó; thứ không ký chỉ là lời khai, không phải cam kết.

## Ghi chú nguồn

<details>
<summary>Ghi chú nguồn, đọc ngày 2026-10-29</summary>

- Presigned URL là bearer token, dùng lại được tới hạn, và S3 kiểm hạn tại thời điểm nhận request: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html — cũng là nguồn cho hạn tối đa 7 ngày với SigV4 và việc URL hết hạn khi credential hết hạn.
- Object cùng key bị thay thế khi PUT: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- Cấu trúc presigned URL, `X-Amz-Expires` tính bằng giây, canonical request dùng `UNSIGNED-PAYLOAD`, và ví dụ có chữ ký `aeeed9bb...`: https://docs.aws.amazon.com/AmazonS3/latest/developerguide/sigv4-query-string-auth.html — dùng làm test vector cho script ở bước 5.
- `HeadObject` trả `ContentLength`, `ContentType`, `VersionId`, `ETag`, checksum; trả 404 nếu có `s3:ListBucket` và 403 nếu không: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
- `Content-Length` nằm trong danh sách forbidden request header: https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header

Chưa kiểm trong bài này: giới hạn kích thước body của API Gateway; hành vi của S3 khi bucket không bật Versioning; giá và thời gian của quá trình quét nội dung. Con số 10.000 người, 5 MB, 50 kbit/s, 1.240 object và 10 MB trần body đều là giả định của kịch bản. Phần `head_object` trong script là mô phỏng bằng dict, không phải lời gọi S3.

</details>
