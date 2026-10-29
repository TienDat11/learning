# L02: Ai được gọi Lambda, và Lambda được phép làm gì

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 liệt kê bảy bước cơ chế, trong đó bước 2 đã dùng `credential tạm` và `assumed-role ARN` trước khi bài nói credential tạm là gì và ai phát hành. Người đọc gặp một chuỗi `arn:aws:iam::111122223333:role/upload-api-role` ở Bước 3 mà chưa được giải thích ARN là gì.
- **Thuật ngữ chưa giải thích:** `execution role`, `resource-based policy`, `identity policy`, `principal`, `ARN`, `JWT authorizer`, `assumed-role`, `credential tạm`, `blast radius`, `SCP`, `permissions boundary`, `session policy`. Bước 5 còn thả thêm bốn từ cuối vào một câu ghi chú.
- **Thiếu ví von / ví dụ trực diện:** không có phép ví von nào cho ý "hai lớp kiểm tra ở hai thời điểm". Sơ đồ là `mermaid`, không đọc được ở nhiều nơi. Cách tệ và Cách tốt không nằm cạnh nhau trong bài.
- **Câu quá dài / khô:** câu "Hai lớp này không thay thế nhau vì chúng chạy ở hai thời điểm: lớp invoke chạy khi chưa có tiến trình, lớp role chạy sau khi code đã bắt đầu." gộp hai ý và một mệnh đề giải thích vào một dòng. Cụm `[INFERENCE]` và các ghi chú nội bộ cũng lẫn vào thân bài.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Giả sử endpoint `POST /files` của bạn chạy sau API Gateway có JWT authorizer (bộ kiểm token ở cửa vào). Người dùng đã đăng nhập, token còn hạn. Hàm ghi một file nhỏ lên S3.

Ba ngày trước mọi thứ bình thường. Sáng nay 100 phần trăm request nhận 500. Log của hàm có đúng một dòng: `AccessDenied` khi gọi `s3:PutObject`. Và principal (bên đứng tên trong lỗi) không phải người dùng nào cả — nó là `assumed-role/upload-api-role`.

Cùng lúc, một script nội bộ gọi thẳng hàm bằng SDK nhận 403 ngay ở bước invoke, trước khi hàm kịp chạy. Hai lỗi cùng là "không có quyền", nhưng xảy ra ở hai thời điểm khác nhau của cùng một request.

Đau ở đâu? Đau ở chỗ **một chữ 403 không cho bạn biết phải sửa cái gì**. Nếu bạn đoán sai lớp, bạn sửa đúng chỗ nhưng lỗi vẫn còn.

**Câu hỏi dự đoán:** Người dùng đã đăng nhập và token còn hạn, vậy vì sao hàm vẫn không ghi được lên S3?
**Đáp án:** vì request ghi S3 không do người dùng ký. Nó do hàm ký, bằng credential tạm của execution role (vai trò cấp quyền tạm cho hàm).

### 2. Phép ví von đời thường & Sơ đồ chữ

Một toà nhà có hai lớp cửa. Cửa ngoài có bảo vệ: ai được vào toà nhà? Cửa trong là tủ hồ sơ có khoá: vào rồi thì mở được tủ nào? Bảo vệ cho bạn vào không có nghĩa là chìa khoá tủ tự xuất hiện trong tay bạn.

*Giới hạn của phép ví von:* trong toà nhà thật, một người có thể mượn chìa của người khác; còn ở đây, mỗi hàm luôn hành động dưới đúng một role, không mượn được quyền của người gọi.

```text
Người dùng ──JWT──► API Gateway ──invoke──► Lambda ──boto3──► S3
                         │                     │                │
                   (1) ai được gọi hàm?   (2) hàm được làm gì? (3) tài nguyên
                   resource policy         execution role      có cho phép không?
                         │                     │                │
                    chặn TRƯỚC khi        chỉ có hiệu lực     từ chối thì trả
                    hàm chạy → 403,        SAU khi hàm chạy    AccessDenied trong
                    không có log hàm                           log của hàm
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Mọi lời gọi AWS đều phải được ký bởi một danh tính:** không có danh tính thì AWS không biết cho ai. Danh tính đó có thể là người dùng, một role, hoặc một dịch vụ.
- **Bước 2 — Lớp thứ nhất hỏi "ai được gọi hàm này":** đó là `resource policy` (chính sách gắn lên chính hàm). Nó chạy trước khi có tiến trình nào. Bị chặn ở đây thì không có log của hàm, và sửa quyền bên trong hàm không có tác dụng.
- **Bước 3 — Lớp thứ hai hỏi "hàm được chạm vào cái gì":** khi hàm chạy, Lambda đảm nhận `execution role` và phát credential tạm cho tiến trình. Mọi SDK trong code ký request bằng credential đó.
- **Bước 4 — Vì thế principal trong lỗi luôn là role, không phải người dùng:** người dùng ký request tới API Gateway. Hàm ký request tới S3. Hai chữ ký khác nhau, hai danh tính khác nhau.
- **Bước 5 — Dịch vụ đích kiểm hai thứ: action và resource:** `s3:PutObject` trên `arn:aws:s3:::uploads-staging/*` là một cặp. Thiếu một trong hai thì kết quả là `AccessDenied`. ARN (Amazon Resource Name) chỉ là tên đầy đủ của tài nguyên.
- **Bước 6 — Khi hai tài khoản khác nhau, cả hai phía đều phải cho phép:** chủ bucket phải cho phép trong bucket policy, và role của bạn phải cho phép trong identity policy. Một phía cho phép là chưa đủ.
- **Bước 7 — Vì thế quyền nên hẹp, và hẹp là một tính năng:** một action trên một ARN nghĩa là khi code gọi ra ngoài phạm vi, bạn nhận được một dòng lỗi rõ ràng thay vì một hành vi âm thầm thành công.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** thấy 403 thì gắn bộ quyền rộng nhất cho role để lỗi biến mất.

```bash
aws iam attach-role-policy \
  --role-name upload-api-role \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
# Không đọc dòng AccessDenied để biết action và resource nào bị từ chối.
```

Điều gì xảy ra: lỗi biến mất sau lần deploy kế tiếp. Nhưng role giờ đọc được mọi bucket, xoá được bảng, đọc được secret của hệ thống khác. Và vì không còn dòng `AccessDenied` nào, bạn mất luôn tín hiệu duy nhất từng cho biết code đang gọi ra ngoài phạm vi dự kiến.

Vì sao hỏng: bạn chữa triệu chứng. Lỗi biến mất, nhưng thứ gây lỗi — một chính sách không khớp tài nguyên thật — vẫn còn đó, chỉ là giờ nó không còn khả năng báo cho bạn biết.

- **Cách tốt:** đọc ba trường trong lỗi trước, rồi sửa đúng một dòng.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": ["arn:aws:s3:::uploads-staging/*"]
    }
  ]
}
```

Vì sao đúng: principal trong lỗi là role của bạn, action là `s3:PutObject`, resource là ARN của bucket prod. Ba trường đó chỉ thẳng vào dòng cần sửa. Bạn thêm đúng ARN mới, giữ nguyên phạm vi cũ. Lần sau code gọi `s3:DeleteObject`, bạn vẫn nhận được lỗi — đó là tính năng, không phải phiền toái.

- **Kiểm chứng bằng code (chạy thật):** chạy trong `lessons/01-aws/l02/`. Đây là mô hình bộ đánh giá policy ở mức tối thiểu, không phải bộ đánh giá thật của IAM: bộ thật còn xét SCP, permissions boundary, session policy, điều kiện và chủ sở hữu chéo tài khoản.

```bash
python iam_eval.py
```

```text
Principal trong mọi request dưới đây: arn:aws:iam::111122223333:role/upload-api-role
(Lambda đã đảm nhận role, nên boto3 ký bằng credential tạm của role.)

Execution role tối thiểu dùng cho tổ hợp 1 và 2:
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::uploads-staging/*"
      ]
    }
  ]
}

--------------------------------------------------------------------------
1. identity allow, không có deny ở đâu
  s3:PutObject     arn:aws:s3:::uploads-staging/bao-cao.csv
                   -> Allow: có Allow ở identity policy hoặc resource policy
  s3:DeleteObject  arn:aws:s3:::uploads-staging/bao-cao.csv
                   -> Deny: không policy nào allow, nên mặc định từ chối
--------------------------------------------------------------------------
2. identity allow, nhưng có explicit deny
  s3:PutObject     arn:aws:s3:::uploads-staging/bao-cao.csv
                   -> Deny: có explicit deny, thắng mọi allow
--------------------------------------------------------------------------
3. identity không allow, resource policy allow
  s3:PutObject     arn:aws:s3:::uploads-staging/bao-cao.csv
                   -> Allow: có Allow ở identity policy hoặc resource policy
--------------------------------------------------------------------------
4. không allow ở đâu cả
  s3:PutObject     arn:aws:s3:::uploads-prod/bao-cao.csv
                   -> Deny: không policy nào allow, nên mặc định từ chối
--------------------------------------------------------------------------

Tổ hợp 1 có hai request: cái đầu được phép, cái sau bị từ chối.
Đó là dấu hiệu role chỉ mở đúng một action, không mở cả họ s3:*.
```

Đọc output theo đúng thứ tự IAM dùng: deny tường minh thắng mọi allow; không có deny thì cần ít nhất một allow; không có allow nào thì từ chối. Dòng `s3:DeleteObject` bị từ chối **dù cùng bucket** là bằng chứng role tối thiểu đang hoạt động.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** một role cho mỗi hàm cho bạn phạm vi thiệt hại nhỏ và log đọc được ngay. Quyền theo ARN cụ thể buộc bạn nhìn lại phạm vi mỗi lần thêm tài nguyên.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** mỗi hàm mới là một bộ quyền mới phải viết và rà. Đổi tên bucket là phải sửa chính sách cùng lúc với code, nếu không sẽ có sự cố 403 đúng như bài này. Secret trong kho secret thì xoay được nhưng thêm một lời gọi mạng và một quyền nữa phải cấp.
- **Khi nào KHÔNG nên dùng:** đừng tách role theo từng hàm khi bạn đang ở giai đoạn thử nghiệm và chưa biết hình dạng hệ thống — lúc đó một role dùng chung cho môi trường dev là chấp nhận được. Đừng dùng quyền theo ARN cụ thể nếu code dựng đường dẫn động mà bạn không liệt kê được tập tiền tố; khi đó hãy phủ đúng tập đó, đừng phủ `*`.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Hai lớp quyền này kiểm tra hai hành động nào, và vì sao chúng không thay thế nhau?

- **Trả lời mẫu (30–60 giây):** Lớp invoke trả lời ai được gọi hàm, bằng resource policy gắn trên chính hàm. Lớp execution role trả lời hàm được gọi cái gì, sau khi hàm đã chạy. Một lớp cho qua không hàm ý lớp kia cho qua, vì chúng chạy ở hai thời điểm. Cách phân biệt nhanh: lỗi ở lớp invoke không kèm log của hàm; lỗi ở lớp role có `AccessDenied` trong log của hàm.
- **Lỗi hay mắc khi trả lời:** nói "đã qua API Gateway thì có quyền". Cách nói đúng: qua cửa xác thực chỉ chứng minh người dùng là ai.

### Câu 2: Cho tôi cách viết một execution role tối thiểu cho một thao tác ghi S3.

- **Trả lời mẫu (30–60 giây):** Một action cụ thể trên một ARN cụ thể. Tôi chọn `s3:PutObject` thay vì `s3:*`, và `arn:aws:s3:::ten-bucket/*` thay vì dấu sao cho mọi bucket. Nếu hàm cần ghi log thì thêm đúng quyền ghi log. Điều kiện là tôi phải biết chính xác bucket và tiền tố mà code dùng. Cách kiểm: gọi thử `s3:DeleteObject` phải nhận `AccessDenied` với đúng action đó.
- **Lỗi hay mắc khi trả lời:** quên rằng quyền `s3:PutObject` trên bucket ARN (không có `/*`) không cho ghi object. Cách nói đúng: object cần ARN có `/*`.

### Câu 3: Nếu người dùng đổi từ JWT sang đăng nhập bằng một nhà cung cấp khác thì phần quyền nào phải sửa?

- **Trả lời mẫu (30–60 giây):** Chỉ lớp xác thực ở cổng vào phải sửa. Execution role và các chính sách tài nguyên giữ nguyên, vì role gắn với hàm chứ không gắn với người dùng. Đổi cách chứng minh danh tính không đổi quyền của hàm. Ngoại lệ: nếu code đang đọc một trường riêng của token cũ để quyết định quyền ở tầng ứng dụng thì phải ánh xạ lại trường đó. Cách kiểm: request qua cổng vào thành công, hàm vẫn ghi đúng bucket, log không có `AccessDenied` mới.
- **Lỗi hay mắc khi trả lời:** nói phải cấp lại quyền S3 cho nhà cung cấp danh tính mới. Cách nói đúng: nhà cung cấp danh tính không bao giờ giữ quyền AWS của hàm.

### Câu 4: Có trường hợp nào role đúng mà vẫn không ghi được S3?

- **Trả lời mẫu (30–60 giây):** Có. Với bucket thuộc tài khoản khác, bucket policy cũng phải cho phép, nên role đúng vẫn nhận `AccessDenied`. Nếu bucket bật chặn truy cập công khai hoặc bắt buộc TLS, request không đúng điều kiện cũng bị chặn dù có quyền. Nếu code dựng ARN sai vùng hoặc sai tên thì quyền đúng vẫn không khớp tài nguyên. Cách kết luận: đối chiếu principal, action, resource trong lỗi với chính sách trước khi sửa bất cứ dòng nào.
- **Lỗi hay mắc khi trả lời:** sửa role ngay khi thấy 403. Cách nói đúng: kiểm tra resource trong lỗi trước — nếu nó khác ARN trong chính sách thì sửa ARN, không sửa action.

---
## Ghi chú nguồn

- Lambda — Identity and access management: https://docs.aws.amazon.com/lambda/latest/dg/lambda-permissions.html
- IAM — Policies và policy evaluation logic: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- IAM — Policy element reference (Effect, Action, Resource): https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
- S3 — Bucket policies và cross-account access: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html
- Lambda — Execution role: https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html

Các con số trong bài (ba ngày, 100 phần trăm request nhận 500, một dòng `AccessDenied`, ba bucket) là giả định để dựng kịch bản, không phải số đo hay mặc định của AWS. Khối output ở mục 4 là output thật của script `iam_eval.py`, ghi lại từ lần chạy trên máy; script không đổi.
