# L05: Cho trình duyệt tải thẳng lên S3 bằng URL ký sẵn, và đọc DynamoDB theo khoá

> **Trạng thái:** bản viết lại đủ bảy bước, nằm ngoài `src/`. Chưa nối vào app, chưa đo với người đọc thứ hai.
> **Số liệu:** mọi con số trong bài là giả định của kịch bản, được ghi "Giả sử" ở chỗ dùng. Không phải số đo từ hệ thống thật, không phải mặc định của AWS hay DynamoDB. Output trong Bước 5 là output thật của hai script chạy trên máy này.

**Tiên quyết:** biết một request HTTP có method và URL; biết tệp được gửi lên máy chủ dưới dạng body; biết một bảng dữ liệu có khoá.

## Bước 1. Đoán trước

Giả sử giao diện gửi một ảnh 8 MB tới một hàm, hàm đọc cả ảnh vào bộ nhớ rồi ghi lên S3. Giả sử hàm được cấp 512 MB bộ nhớ. Cùng lúc, màn hình "đơn hàng của tôi" đọc bảng đơn hàng bằng một lần quét toàn bảng rồi lọc theo mã người dùng; giả sử bảng có 200 000 bản ghi và mỗi người có khoảng 50 đơn.

Trước khi đọc tiếp, trả lời bốn câu:

1. Chữ ký trong URL ký sẵn do ai tạo, bằng quyền gì?
2. Trình duyệt có cầm credential AWS nào không?
3. Nếu URL có hạn 300 giây mà người dùng bấm tải ở giây thứ 320 thì nhận lỗi gì?
4. Để lấy 50 đơn của một người trong bảng 200 000 bản ghi thì nên đọc bằng cách nào, và đọc khoảng bao nhiêu bản ghi?

Viết đáp án ra giấy. Đáp án nằm ở cuối bước 3.

## Bước 2. Điều bạn đã biết

Bạn đã từng viết một endpoint nhận tệp: client gửi `multipart/form-data`, server đọc body, ghi ra đĩa hoặc ghi lên một kho. Byte của tệp đi qua tiến trình của bạn. Cách đó chạy tốt vì máy chủ của bạn có ổ đĩa và bộ nhớ rộng.

Bạn cũng đã từng viết một câu truy vấn có điều kiện: `SELECT * FROM orders WHERE user_id = 42`. Cơ sở dữ liệu quan hệ có chỉ mục trên `user_id`, nên nó đọc đúng phần cần.

Bài này giữ nguyên hai việc đó và thay từng khớp:

- Chỗ ghi tệp: thay hàm nhận byte bằng **URL ký sẵn** (presigned URL — một URL đã mang sẵn chữ ký, dùng được mà không cần credential).
- Chỗ đọc bản ghi: thay `WHERE` của cơ sở dữ liệu quan hệ bằng **khoá phân vùng** của DynamoDB.

Khác biệt cần nhớ: hàm không còn nhận byte, và cơ sở dữ liệu khoá-giá trị không tự tìm giúp bạn nếu bạn không đi qua khoá.

## Bước 3. Một ví dụ có số

Giả sử ảnh 8 MB, hàm 512 MB bộ nhớ, và mỗi lần tải lên mất khoảng 6 giây: khoảng 4 giây để byte đi từ trình duyệt tới hàm, khoảng 2 giây để hàm ghi lên S3. Byte đã đi qua mạng hai lần và nằm trong bộ nhớ của hàm một lần.

Giả sử chuyển sang URL ký sẵn. Hàm chỉ tính một chữ ký: vài phép băm trên một chuỗi vài trăm byte. Thời gian của hàm không còn phụ thuộc kích thước tệp, vì byte không đi qua hàm. Đường tải lên còn một chặng: trình duyệt tới S3.

Với DynamoDB, giả sử mỗi đơn hàng chiếm 1 KB và bảng có 200 000 bản ghi. Truy vấn theo khoá phân vùng đọc đúng 50 bản ghi của một người, tức 50 KB. Quét toàn bảng đọc cả 200 000 bản ghi, tức 200 000 KB, rồi mới lọc. Một đơn vị đọc bằng một khối 4 KB, và đọc cuối cùng tốn nửa đơn vị mỗi khối, nên 50 KB là khoảng 6,5 đơn vị đọc còn 200 000 KB là 25 000 đơn vị đọc.

Tỉ lệ: 200 000 ÷ 50 = 4000 lần. Con số này không phụ thuộc số đơn của một người; nó phụ thuộc kích thước bảng.

**Đáp án bước 1:** (1) hàm ký bằng quyền của execution role; (2) trình duyệt không cầm credential nào, chỉ cầm một URL; (3) bị từ chối truy cập vì chữ ký đã quá hạn; (4) Query theo khoá phân vùng, đọc khoảng 50 bản ghi.

## Bước 4. Cơ chế, từng bước một

```mermaid
flowchart LR
  A[Trình duyệt] -->|1. xin URL| B[Hàm: ký bằng execution role]
  B -->|2. URL có chữ ký| A
  A -->|3. PUT 8 MB| C[S3]
  A -->|4. báo khoá| B
  B -->|5. head_object xác nhận| C
```

1. **Hàm ký, không chuyển byte.** Hàm gọi API của S3 để tạo chữ ký cho đúng một method, đúng bucket, đúng khoá, kèm thời hạn. Chữ ký mang quyền của execution role tại thời điểm ký. Hàm không gửi dữ liệu nào tới S3 ở bước này; chi phí là một phép tính.
2. **URL mang đủ tham số để S3 tự kiểm lại.** Sáu tham số: `X-Amz-Algorithm` (phiên bản chữ ký, `AWS4-HMAC-SHA256`), `X-Amz-Credential` (access key cộng phạm vi ngày/vùng/dịch vụ), `X-Amz-Date`, `X-Amz-Expires` (số giây), `X-Amz-SignedHeaders` (danh sách header đã ký, tối thiểu `host`), và `X-Amz-Signature`. S3 nhận request, dựng lại chuỗi để ký từ chính URL, tính chữ ký bằng khoá bí mật của access key, rồi so với `X-Amz-Signature`. Ký bằng credential tạm thì có thêm tham số thứ bảy, `X-Amz-Security-Token`, mang session token đi kèm; với execution role của Lambda thì luôn có, thiếu là 403. Script `presign_sigv4.py` ở bước 5 dùng bộ kiểm thử của tài liệu AWS với access key dài hạn, nên output của nó không có tham số đó.
3. **Chữ ký trói ba thứ, nên URL không mở rộng được.** Method nằm trong chuỗi được ký, nên URL ký cho `PUT` không dùng được cho `GET`. Đường dẫn (bucket và khoá) nằm trong chuỗi được ký, nên đổi khoá là chữ ký sai. `X-Amz-Expires` nằm trong chuỗi được ký, nên không sửa được thời hạn. Đây là toàn bộ phạm vi thiệt hại nếu URL lộ ra.
4. **Hạn được kiểm tại thời điểm request, không phải lúc bắt đầu tải.** S3 kiểm hạn khi nhận request. Một lần tải bắt đầu trước mốc hạn vẫn chạy tiếp qua mốc đó; nhưng bấm sau mốc hạn thì bị từ chối, và nối lại giữa chừng sau mốc hạn cũng bị từ chối.
5. **Tải xong phải xác nhận, vì URL còn hạn không chứng minh tệp đã nằm đó.** Trình duyệt có thể đóng tab, mất mạng, hoặc gửi một tệp khác kích thước. Bước xác nhận là một lần `head_object` (lấy metadata, không lấy nội dung): đọc `ContentLength` và `ContentType` thật của object rồi so với cái đã ký. Chỉ khi khớp mới ghi metadata nghiệp vụ. Đây là chỗ duy nhất đánh dấu trạng thái "đã có tệp".
6. **Phía đọc: khoá quyết định lượng đọc.** Bảng DynamoDB có khoá phân vùng (partition key) và khoá sắp xếp (sort key). `Query` bắt buộc một giá trị khoá phân vùng, trả về các item trong khoá đó, và có thể thu hẹp tiếp bằng điều kiện trên khoá sắp xếp. `Scan` đọc mọi item của bảng hoặc chỉ mục.
7. **Điều kiện lọc chạy sau khi đã đọc.** `FilterExpression` lọc các item mà `Query` hoặc `Scan` đã đọc xong, trước khi trả về. Vì vậy lượng đọc tính tiền không đổi dù bạn lọc chặt hơn: chỉ số bản ghi trả về giảm. Đây là lý do thêm chỉ mục phụ không giúp gì cho một lần quét.

**Vì sao thiết kế khoá quan trọng hơn câu lệnh.** Nếu khoá phân vùng không phải là thứ bạn lọc theo, bạn không có đường đọc rẻ hơn để chuyển sang. Với bảng đơn hàng, đặt `pk = USER#<id>` và `sk = ORDER#<số>` biến câu hỏi "50 đơn của người này" thành một lần `Query` đúng một khoá.

## Bước 5. Thí nghiệm nhỏ

Hai script chỉ dùng thư viện chuẩn của Python 3, chạy trong thư mục `lessons/01-aws/l05/`. Không gọi AWS. Nếu lệnh `python` không có trong PATH, gọi bằng đường dẫn đầy đủ tới Python 3 trên máy bạn.

### Phần (a): tự tính chữ ký SigV4 cho URL ký sẵn

```
python presign_sigv4.py
```

Script dựng chuỗi để ký từ method, đường dẫn, các tham số đã sắp xếp, header `host`, và hằng `UNSIGNED-PAYLOAD`; băm SHA-256 chuỗi đó; rồi ký bằng chuỗi khoá phái sinh HMAC bốn tầng. Credential dùng ở đây là cặp ví dụ công khai in trong tài liệu AWS, nên so được với chữ ký tài liệu đã công bố.

Kết quả đã chạy trên máy này:

```
URL ký sẵn:
  https://examplebucket.s3.amazonaws.com/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request
  &X-Amz-Date=20130524T000000Z
  &X-Amz-Expires=86400
  &X-Amz-SignedHeaders=host
  &X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404

Chữ ký trong URL:       aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
Chữ ký tài liệu AWS in: aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
Khớp với tài liệu:      True
Chữ ký tính lại từ URL: aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
Khớp:                   True

Kịch bản: hàm ký PUT cho một khoá, hạn 300 giây.
  URL: https://examplebucket.s3.amazonaws.com/uploads/u-42/a1b2.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=d7c6d4e3fa311d19bb1357b9e56bcdcbeb9a2d8d7871c44e8775be38233f8095
  chữ ký tính lại (PUT): d7c6d4e3fa311d19bb1357b9e56bcdcbeb9a2d8d7871c44e8775be38233f8095
  khớp:                  True
  dùng URL đó cho GET:   False
  đổi khoá, giữ chữ ký:  False

Hạn của URL: 2013-05-24T00:05:00+00:00
  bấm tải lúc +200s (00:03:20Z): còn hạn = True
  bấm tải lúc +320s (00:05:20Z): còn hạn = False
```

Ba điều đọc được từ output này:

- Chữ ký script tính ra khớp đúng chữ ký tài liệu AWS đã công bố cho cùng input. Công thức đúng, không chỉ tự nhất quán.
- Dùng URL ký cho `PUT` để gửi `GET` thì chữ ký không khớp. Method bị trói trong chữ ký.
- Đổi khoá trong đường dẫn mà giữ chữ ký cũ thì không khớp. Khoá bị trói trong chữ ký.

### Phần (b): đếm bản ghi thật sự bị đọc

```
python query_vs_scan.py
```

Script dựng bảng 200 000 bản ghi trong bộ nhớ, giữ một chỉ mục theo khoá phân vùng giống cách DynamoDB băm khoá, rồi đếm số item thực sự đi qua cho từng thao tác.

Kết quả đã chạy trên máy này:

```
Bảng mô phỏng: 200000 bản ghi, 4000 người dùng × 50 đơn.

Cùng một câu hỏi nghiệp vụ: 50 đơn của người dùng 42.
  thao tác                  đã đọc    trả về   trang      KB đọc    đơn vị đọc
  Query theo pk                 50        50       1          50           6.5
  Scan + FilterExpression    200000        50     196      200000       25000.0
  Scan toàn bảng            200000    200000     196      200000       25000.0

Query đọc ít hơn Scan 4000 lần.
Thêm điều kiện lọc: đã đọc vẫn 200000 bản ghi, chỉ số bản ghi trả về giảm từ 200000 xuống 50.
Đơn vị đọc của Scan + lọc (25000) bằng đúng Scan không lọc (25000).

Bảng lớn gấp 10 lần: 2000000 bản ghi.

  thao tác                  đã đọc    trả về   trang      KB đọc    đơn vị đọc
  Query theo pk                 50        50       1          50           6.5
  Scan + FilterExpression   2000000        50    1954     2000000      250000.0

Query: 50 → 50 bản ghi đã đọc (không đổi).
Scan:  200000 → 2000000 bản ghi đã đọc (gấp 10).
```

**Tự thử:** giữ nguyên bảng, đổi câu hỏi thành "đơn có tổng tiền trên 400". Đó là điều kiện trên một thuộc tính không phải khoá. `Query` theo `pk` không trả lời được câu đó cho mọi người dùng, nên bạn phải quét — và lượng đọc lại bằng cả bảng.

## Bước 6. Bốn câu luyện tập

Trả lời trước khi mở đáp án.

**Câu 1.** Vì sao trình duyệt ghi được lên bucket mà không cần credential AWS nào?

<details>
<summary>Đáp án</summary>

Kết luận: vì quyền đã được chuyển vào chính URL dưới dạng chữ ký, và chữ ký mang quyền của execution role tại thời điểm ký. S3 kiểm chữ ký bằng khoá bí mật của access key ghi trong `X-Amz-Credential`, nên không cần trình duyệt biết khoá đó.

Điều kiện để đúng: hàm phải kiểm người dùng đang đăng nhập là ai trước khi ký, và khoá phải do server sinh chứ không lấy từ body client gửi. Nếu không, bất kỳ ai gọi được API ký cũng xin được URL cho khoá bất kỳ, và URL không bảo vệ gì cả.

Cách kiểm: sửa một ký tự trong đường dẫn của URL đã ký rồi gửi lại, thấy S3 từ chối vì chữ ký không khớp. Sau đó gọi API ký với mã người dùng của người khác, xem hàm có chặn không.

</details>

**Câu 2.** URL còn hạn 200 giây, vì sao vẫn phải gọi `head_object` sau khi tải xong?

<details>
<summary>Đáp án</summary>

Kết luận: vì URL còn hạn chỉ nói chữ ký chưa quá thời gian, không nói tệp đã tới. Trình duyệt có thể đóng tab, mất mạng, hoặc gửi một tệp khác kích thước và kiểu nội dung. Chỉ `head_object` mới trả về `ContentLength` và `ContentType` thật của object đang nằm trong bucket.

Điều kiện để đúng: bước xác nhận phải so với giá trị đã ký hoặc đã khai báo, và phải chịu được việc chạy hai lần cho cùng một khoá — client có thể báo hai lần. Cần một khoá chống lặp theo khoá object.

Cách kiểm: ký một URL, không tải gì, rồi gọi `head_object` cho khoá đó. Nếu object chưa tồn tại thì lần gọi trả lỗi không tìm thấy, chứng minh hạn của URL không đồng nghĩa có tệp.

</details>

**Câu 3.** Vì sao thêm `FilterExpression` không làm giảm lượng đọc tính tiền?

<details>
<summary>Đáp án</summary>

Kết luận: vì điều kiện lọc được áp sau khi dữ liệu đã đọc xong, trước khi trả kết quả về. Lượng đọc tính theo phần dữ liệu đã đi qua, nên lọc chặt hơn chỉ làm số bản ghi trả về nhỏ đi. Tài liệu DynamoDB nói rõ điều này: một `Query` tốn cùng lượng đọc dù có hay không có filter.

Điều kiện để đúng: muốn giảm lượng đọc thì phải giảm phần dữ liệu được đọc, nghĩa là điều kiện phải nằm trên khoá — khoá phân vùng trong `KeyConditionExpression`, hoặc khoá của một chỉ mục phụ mà truy vấn mới thực sự dùng.

Cách kiểm: chạy cùng một truy vấn với filter chặt hơn, đọc `ScannedCount` và `Count` trong response. `Count` giảm, `ScannedCount` không đổi. Trong thí nghiệm ở Bước 5, cột "đã đọc" giữ nguyên 200 000 còn cột "trả về" rơi từ 200 000 xuống 50.

</details>

**Câu 4.** Khi nào nên cho tệp đi qua hàm thay vì tải thẳng bằng URL ký sẵn?

<details>
<summary>Đáp án</summary>

Kết luận: khi bạn buộc phải kiểm tra hoặc biến đổi nội dung trước khi tệp vào bucket, và tệp đủ nhỏ để nằm trong trần bộ nhớ cùng thời gian chạy của hàm.

Điều kiện để đúng: quy định về loại tệp phải được thực thi trước khi object tồn tại. Đi tải thẳng thì hàm không thấy nội dung, nên việc kiểm tra phải chuyển sang một bước sau, chạy trên sự kiện của bucket — và trong khoảng giữa hai bước, tệp sai đã nằm trong bucket.

Cách kiểm: so độ trễ tải lên của hai cách với cùng một tệp, và so thời gian chạy trung bình của hàm. Đi qua hàm thì cả hai đều tăng theo kích thước tệp; tải thẳng thì cả hai phẳng.

</details>

## Bước 7. Câu neo

> Quyền ghi tạm thời nằm trong chính URL ký sẵn chứ không nằm trong tay trình duyệt, còn chi phí đọc DynamoDB nằm ở khoá phân vùng chứ không ở điều kiện lọc.

## Ghi chú nguồn

<details>
<summary>Ghi chú nguồn, đọc ngày 2026-10-29</summary>

- https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html — URL ký sẵn mang credential của principal đã tạo; S3 kiểm hạn tại thời điểm request, lần tải đã bắt đầu vẫn chạy tiếp qua mốc hạn, nối lại sau mốc hạn thì hỏng; URL hết hạn khi credential hết hạn.
- https://docs.aws.amazon.com/AmazonS3/latest/developerguide/sigv4-query-string-auth.html — sáu tham số `X-Amz-*`, canonical request dùng `UNSIGNED-PAYLOAD`, và test vector có chữ ký `aeeed9bb…f604d404` mà script ở Bước 5 tái tạo đúng.
- https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html — `HEAD` trả metadata mà không trả body, gồm `ContentLength`, `ContentType`, `ETag`; cần quyền `s3:GetObject`.
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html — `Query` cần một giá trị khoá phân vùng, có thể thu hẹp bằng khoá sắp xếp.
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.FilterExpression.html — filter áp sau khi `Query` xong, lượng đọc không đổi; giới hạn 1 MB áp trước khi lọc.
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html — `Scan` đọc mọi item, 1 MB mỗi trang, `ScannedCount` so với `Count`.
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/provisioned-capacity-mode.html — một đơn vị đọc bằng một lần đọc nhất quán mạnh hoặc hai lần đọc cuối cùng cho item tới 4 KB.

Chưa kiểm trong bài này: hành vi của `generate_presigned_url` trong SDK Python (script tự tính chữ ký chứ không gọi SDK); giới hạn hạn mức đọc theo khoá phân vùng; đơn giá và hạn mức cụ thể của S3 hay DynamoDB. Mọi con số kịch bản trong bài là giả định.

</details>
