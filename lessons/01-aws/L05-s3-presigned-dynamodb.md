# L05: Cho trình duyệt tải thẳng lên S3 bằng URL ký sẵn, và đọc DynamoDB theo khoá

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 mục 2 dồn sáu tham số `X-Amz-*` vào một câu dài, và dùng `SigV4`, `canonical request`, `UNSIGNED-PAYLOAD` trước khi bài nói chữ ký được tính từ cái gì. Người đọc chưa biết "ký" nghĩa là gì đã phải nhớ tên sáu tham số.
- **Thuật ngữ chưa giải thích:** `SigV4`, `canonical request`, `UNSIGNED-PAYLOAD`, `credential`, `access key`, `session token`, `sort key`, `FilterExpression`, `read capacity unit`, `head_object`, `partition key`. Hai từ cuối được dùng ở Bước 4 mục 5 mà không có dòng giải thích tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** không có phép ví von nào cho ý "URL mang quyền tạm thời". Sơ đồ là `mermaid flowchart`, không đọc được ở nhiều nơi. Hai nửa bài (tải lên và đọc xuống) không có sơ đồ chữ riêng, nên người đọc phải tự ghép.
- **Câu quá dài / khô:** câu "S3 nhận request, dựng lại chuỗi để ký từ chính URL, tính chữ ký bằng khoá bí mật của access key, rồi so với `X-Amz-Signature`." gộp bốn bước vào một dòng — đúng bốn bước mà người đọc cần tách ra để hiểu cơ chế.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử người dùng chọn một ảnh 8 MB trên điện thoại. Giao diện gửi ảnh tới hàm Lambda của bạn. Hàm đọc cả 8 MB vào bộ nhớ rồi ghi lên S3. Hàm được cấp 512 MB bộ nhớ.

Byte của ảnh đi qua mạng hai lần: một lần từ điện thoại tới hàm, một lần từ hàm tới S3. Nó nằm trong bộ nhớ của hàm một lần. Thời gian mỗi lần tải lên khoảng 6 giây, và con số đó **tỉ lệ với kích thước ảnh** — ảnh 16 MB là 12 giây, ảnh 32 MB có thể vượt giới hạn thời gian chạy.

Song song đó, màn hình "đơn hàng của tôi" quét toàn bảng đơn hàng rồi lọc theo mã người dùng. Bảng có 200 000 bản ghi, mỗi người khoảng 50 đơn. Trang mất vài giây và hoá đơn đọc tăng theo kích thước bảng, không theo số đơn của người đó.

Đau ở đâu? Đau ở chỗ **bạn đang dùng một đường dây chung cho hai việc khác nhau**: chuyển byte, và cấp quyền. Cả hai đều không cần đi qua code của bạn.

**Câu hỏi dự đoán:** Trình duyệt có cầm credential AWS nào để tải ảnh lên S3 không?
**Đáp án:** không. Nó chỉ cầm một URL có chữ ký và hạn dùng. Quyền nằm trong chữ ký, không nằm trong tay trình duyệt.

### 2. Phép ví von đời thường & Sơ đồ chữ

Hàm của bạn là lễ tân của một toà nhà. Thay vì tự khiêng từng thùng hàng vào kho, lễ tân viết một giấy giới thiệu: đúng một cửa kho, đúng một loại việc (giao hàng, không phải lấy hàng), và có hạn 5 phút. Ai cầm giấy đó cũng vào được cửa đó, trong hạn đó. Hết hạn thì giấy vô giá trị.

*Giới hạn của phép ví von:* giấy thật thì chỉ một người cầm; URL thì ai có cũng dùng được, nên hạn ngắn và phạm vi hẹp là hai thứ bảo vệ duy nhất.

```text
CÁCH TỆ — byte đi qua hàm
  Trình duyệt ──8 MB──► Lambda (512 MB) ──8 MB──► S3
                          ▲ 2 lần qua mạng, 1 lần trong RAM
                          ▲ thời gian tỉ lệ với kích thước ảnh

CÁCH TỐT — hàm chỉ ký
  1. Trình duyệt ──xin URL──► Lambda ──ký bằng execution role──► (không gửi byte nào)
  2. Trình duyệt ◄──URL hạn 300 giây── Lambda
  3. Trình duyệt ──PUT 8 MB──────────────────────────────────► S3
  4. Trình duyệt ──báo đã xong──► Lambda ──head_object──► S3 (xác nhận thật sự có tệp)

ĐỌC DYNAMODB — khoá quyết định lượng đọc
  Query  pk = USER#42  ──► đọc 50 item  (1 trang)
  Scan   toàn bảng     ──► đọc 200 000 item (196 trang 1 MB) ──► lọc còn 50
                                              ▲ trả tiền cho 200 000
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Cấp quyền không cần chuyển dữ liệu:** quyền ghi S3 là một quyết định, không phải một khối byte. Bạn có thể trao quyền bằng một chuỗi ký tự thay vì bằng cách tự tay ghi tệp.
- **Bước 2 — Chữ ký là một phép tính trên nội dung request:** hàm lấy method, đường dẫn, vài tham số, băm tất cả lại với một khoá bí mật. Kết quả là một chuỗi hex. Ai có khoá bí mật mới tính lại được đúng chuỗi đó.
- **Bước 3 — Vì chữ ký trói nội dung, nó trói luôn phạm vi:** method nằm trong phần được ký, nên URL ký cho `PUT` không dùng được cho `GET`. Đường dẫn nằm trong đó, nên đổi khoá là chữ ký sai. Hạn `X-Amz-Expires` cũng nằm trong đó, nên không sửa được thời hạn.
- **Bước 4 — `presigned URL` là URL mang sẵn chữ ký đó:** (đường dẫn có chữ ký số và hạn dùng để tải trực tiếp lên S3). Hàm tạo nó bằng quyền của execution role, nên URL chỉ mạnh bằng role — không hơn.
- **Bước 5 — S3 kiểm hạn tại thời điểm nhận request:** một lần tải đã bắt đầu trước mốc hạn vẫn chạy tiếp qua mốc đó. Nhưng bấm sau mốc hạn thì bị từ chối, và nối lại giữa chừng sau mốc hạn cũng bị từ chối.
- **Bước 6 — Tải xong phải xác nhận:** URL còn hạn không chứng minh tệp đã nằm đó. Trình duyệt có thể đóng tab hoặc mất mạng. Hàm gọi `head_object` (lấy metadata, không lấy nội dung) để đọc kích thước và content type thật, rồi so với cái đã ký.
- **Bước 7 — Phía đọc, `partition key` quyết định dữ liệu nằm ở đâu:** (khóa phân vùng quyết định dữ liệu nằm ở phân vùng vật lý nào). `Query` bắt buộc đúng một giá trị khoá phân vùng. `Scan` đọc mọi item. `FilterExpression` lọc **sau khi đã đọc**, nên lọc chặt hơn không làm giảm lượng đọc tính tiền.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** cho byte đi qua hàm, và đọc bảng bằng cách quét rồi lọc.

```python
def handler(event, context):
    body = event["body"]                      # 8 MB nằm trong RAM của hàm
    s3.put_object(Bucket="uploads", Key=event["key"], Body=body)
    return {"ok": True}

def my_orders(user_id):
    items = table.scan()["Items"]             # đọc cả 200 000 bản ghi
    return [i for i in items if i["user_id"] == user_id]
```

Điều gì xảy ra: thời gian và bộ nhớ của hàm tỉ lệ với kích thước tệp, nên một ảnh lớn làm hàm hết bộ nhớ hoặc hết thời gian. Với bảng, mỗi lần mở trang là một lần đọc toàn bảng; bảng lớn gấp 10 thì hoá đơn gấp 10, dù người dùng vẫn chỉ xem 50 đơn.

Vì sao hỏng: bạn đặt tầng tính toán vào giữa đường đi của dữ liệu, và đặt điều kiện lọc vào chỗ muộn nhất có thể.

- **Cách tốt:** hàm chỉ ký, và câu hỏi nghiệp vụ đi đúng qua khoá.

```python
def handler(event, context):
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "uploads", "Key": event["key"],
                "ContentType": event["content_type"]},
        ExpiresIn=300,                        # 300 giây, đủ cho một lần tải
    )
    return {"url": url}

def my_orders(user_id):
    resp = table.query(
        KeyConditionExpression="pk = :pk",
        ExpressionAttributeValues={":pk": f"USER#{user_id}"},
    )
    return resp["Items"]                      # đọc đúng 50 item
```

Vì sao đúng: byte không đi qua hàm, nên thời gian của hàm không còn phụ thuộc kích thước tệp. Câu hỏi "50 đơn của người này" trở thành một lần `Query` đúng một khoá, nên lượng đọc tỉ lệ với số đơn của người đó, không tỉ lệ với kích thước bảng.

- **Kiểm chứng bằng code (chạy thật):** hai script trong `lessons/01-aws/l05/`, chỉ dùng thư viện chuẩn, không gọi AWS.

Phần (a) — tự tính chữ ký SigV4 cho URL ký sẵn:

```bash
python presign_sigv4.py
```

```text
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

Ba điều đọc được từ output này. Chữ ký script tính khớp đúng chữ ký mà tài liệu AWS đã công bố cho cùng input, nên công thức đúng chứ không chỉ tự nhất quán. Dùng URL ký cho `PUT` để gửi `GET` thì chữ ký không khớp — method bị trói. Đổi khoá mà giữ chữ ký cũ cũng không khớp — đường dẫn bị trói.

Phần (b) — đếm bản ghi thật sự bị đọc:

```bash
python query_vs_scan.py
```

```text
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

Dòng cuối là toàn bộ bài học: bảng lớn gấp 10 thì `Scan` đắt gấp 10, còn `Query` không đổi. Lọc bằng `FilterExpression` không cứu được `Scan` — số đơn vị đọc vẫn 25 000.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** hàm không còn là đường đi của dữ liệu, nên thời gian chạy phẳng theo kích thước tệp. `Query` theo khoá cho lượng đọc tỉ lệ với kết quả, không tỉ lệ với bảng.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** URL ký sẵn là một chuỗi mang quyền — ai có nó thì dùng được, nên phải đặt hạn ngắn và phạm vi hẹp. Bạn cần thêm bước xác nhận sau khi tải. Phía DynamoDB, thiết kế khoá là quyết định một chiều: đổi khoá sau khi có dữ liệu là một cuộc di trú. `Query` cũng chỉ trả lời được câu hỏi đi qua khoá.
- **Khi nào KHÔNG nên dùng:** đừng dùng URL ký sẵn khi bạn buộc phải kiểm tra hoặc biến đổi nội dung **trước khi** tệp vào bucket — đi thẳng thì hàm không thấy nội dung, việc kiểm tra phải chuyển sang một bước sau, và trong khoảng giữa hai bước tệp sai đã nằm trong bucket. Đừng đặt hạn quá dài "cho tiện" — hạn chính là toàn bộ phạm vi thiệt hại nếu URL lộ. Và đừng dùng DynamoDB cho câu hỏi không đi qua khoá (ví dụ "mọi đơn trên 400"); lúc đó bạn phải quét, và một cơ sở dữ liệu quan hệ có index sẽ rẻ hơn.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Chữ ký trong presigned URL do ai tạo, bằng quyền gì, và nó bảo vệ được gì?

- **Trả lời mẫu (30–60 giây):** Hàm của tôi tạo, bằng credential tạm của execution role. Chữ ký trói method, đường dẫn và thời hạn, nên URL ký cho `PUT` không dùng được cho `GET`, đổi khoá là sai chữ ký, và không sửa được hạn. Vì vậy nếu URL lộ, phạm vi thiệt hại đúng bằng một thao tác trên một khoá trong một khoảng thời gian. Trình duyệt không cầm credential nào cả.
- **Lỗi hay mắc khi trả lời:** nói URL ký sẵn là "public URL". Cách nói đúng: nó là URL mang quyền có hạn, mạnh đúng bằng role đã ký nó.

### Câu 2: Người dùng bấm tải ở giây thứ 320 với URL hạn 300 giây thì sao? Nếu họ bắt đầu tải ở giây 290?

- **Trả lời mẫu (30–60 giây):** Bấm ở giây 320 thì bị từ chối, vì S3 kiểm hạn tại thời điểm nhận request. Bắt đầu ở giây 290 thì lần tải đó vẫn chạy tiếp qua mốc 300, vì hạn đã được kiểm lúc bắt đầu. Nhưng nếu mạng đứt và họ nối lại sau mốc hạn thì phần nối lại bị từ chối. Đó là lý do tôi đặt hạn đủ rộng cho một lần tải thực tế, chứ không đặt sát.
- **Lỗi hay mắc khi trả lời:** nói "hết hạn là tệp bị xoá". Cách nói đúng: hết hạn chỉ làm URL vô giá trị; object đã ghi vẫn còn.

### Câu 3: Tải xong rồi, vì sao vẫn cần một bước xác nhận?

- **Trả lời mẫu (30–60 giây):** Vì URL còn hạn không chứng minh tệp đã nằm đó. Trình duyệt có thể đóng tab, mất mạng giữa chừng, hoặc gửi một tệp khác kích thước. Tôi gọi `head_object` để đọc kích thước và content type thật, so với cái đã ký, rồi mới ghi metadata nghiệp vụ. Đây là chỗ duy nhất đánh dấu trạng thái "đã có tệp". Không có bước này, bạn có những bản ghi trỏ tới object không tồn tại.
- **Lỗi hay mắc khi trả lời:** tin vào sự kiện `ObjectCreated` của bucket là đủ. Cách nói đúng: sự kiện đó nói có object, không nói object đúng như bạn ký.

### Câu 4: Vì sao thêm `FilterExpression` không làm giảm hoá đơn đọc DynamoDB?

- **Trả lời mẫu (30–60 giây):** Vì filter chạy sau khi dữ liệu đã được đọc. `Scan` vẫn đọc hết các trang 1 MB rồi mới bỏ những item không khớp, nên lượng đọc tính tiền không đổi; chỉ số item trả về giảm. Trong thí nghiệm của tôi, `Scan` có lọc và không lọc đều 25 000 đơn vị đọc. Muốn giảm thật thì phải đổi đường đọc: đưa tiêu chí lọc vào khoá phân vùng hoặc khoá sắp xếp, hoặc tạo một chỉ mục phụ có khoá đúng câu hỏi đó.
- **Lỗi hay mắc khi trả lời:** nói "thêm index là hết chậm". Cách nói đúng: chỉ mục chỉ giúp khi câu hỏi đi qua khoá của chỉ mục đó.

---
## Ghi chú nguồn

- S3 — Presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- S3 — SigV4 query string authentication (sáu tham số `X-Amz-*`, test vector): https://docs.aws.amazon.com/AmazonS3/latest/developerguide/sigv4-query-string-auth.html
- S3 — `HeadObject`: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
- DynamoDB — `Query`: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
- DynamoDB — `FilterExpression` áp sau khi đọc: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.FilterExpression.html
- DynamoDB — `Scan`: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html
- DynamoDB — Đơn vị đọc (1 RCU = 1 lần đọc 4 KB nhất quán mạnh): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/provisioned-capacity-mode.html

Mọi con số trong bài (ảnh 8 MB, hàm 512 MB, 6 giây, bảng 200 000 bản ghi, 50 đơn mỗi người, hạn 300 giây) là giả định của kịch bản — cần kiểm tra lại trên hệ thống thật. Hai khối output ở mục 4 là output thật của `presign_sigv4.py` và `query_vs_scan.py`, ghi lại từ lần chạy trên máy; script không đổi. Chưa kiểm trong bài: hành vi của `generate_presigned_url` trong SDK Python (script tự tính chữ ký), và hạn mức đọc theo khoá phân vùng.
