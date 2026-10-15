var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "G23",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Dev tắt cả bốn công tắc Block Public Access để ảnh hiện, hoặc thêm Principal \"*\" vào bucket policy cho nhanh. Họ tin rằng vì đã bật SSE-S3 nên hóa đơn vẫn được bảo vệ.</p><p><strong>Vì sao hỏng:</strong> Tắt BPA không tạo quyền mới mà mở lại mọi policy và ACL công khai đã nằm sẵn trong bucket. SSE-S3 giải mã cho mọi request được phép đọc, nên mã hóa không chặn người có quyền và không bảo vệ hóa đơn khỏi bị lộ.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> Quyền đọc của S3 là kết quả của nhiều lớp cùng lúc, và BPA chỉ là lớp chặn đè lên bucket policy và ACL chứ không phải nguồn quyền (Bài L05, Bài L20).</p><ul><li><strong>Nguồn quyền:</strong> Bucket policy cấp cho ai, còn IAM policy cấp cho danh tính nội bộ; Principal \"*\" không có Condition giới hạn thì S3 coi là công khai.</li><li><strong>Lớp chặn:</strong> BPA có bốn công tắc đè lên mọi policy và ACL; tắt công tắc chỉ mở lại quyền đã có, không tạo quyền mới, và tắt ở cấp account ảnh hưởng mọi bucket.</li><li><strong>Mã hóa:</strong> SSE-S3 giải mã tự động cho mọi request được phép, còn SSE-KMS buộc người đọc có kms:Decrypt và key policy cho phép.</li></ul>",
  "group": "G",
  "topic": "S3: Block Public Access, bucket policy vs IAM, Object Ownership, mã hóa SSE-S3/SSE-KMS và 403 vs 404",
  "prio": "P0",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "Đã bật mã hóa mặc định SSE-S3 rồi thì hóa đơn có còn bị đọc công khai không?",
      "a": "Có. SSE-S3 chỉ bảo vệ dữ liệu khi nằm trên đĩa. S3 tự giải mã khi trả dữ liệu cho bất kỳ request nào được phép đọc, nên mã hóa không chặn người có quyền. Ngăn lộ là việc của quyền truy cập: bật Block Public Access, không để bucket policy cấp cho Principal \"*\", và tắt ACL bằng Object Ownership."
    },
    {
      "q": "Sao không cấp IAM user cho người xem ảnh thay vì mở bucket?",
      "a": "Người xem ảnh thường không có tài khoản AWS nên không thể ký request bằng IAM. Muốn cho người ngoài xem ảnh mà vẫn giữ bucket riêng, đặt ảnh ở bucket khác và cho CloudFront đọc bằng OAC, giống Nginx chỉ cho đúng một upstream vào và chặn phần còn lại. Mở bucket công khai nhanh hơn nhưng mất kiểm soát, vì mọi file trong bucket đều thành công khai."
    }
  ],
  "incident": "<p><strong>Tình huống giả định:</strong> dev làm trang sản phẩm, ảnh không hiện và trình duyệt nhận 403 khi tải ảnh từ bucket <code>hoadon-prod</code>.</p><p><strong>Nguyên nhân:</strong> bucket có sẵn một bucket policy cũ cho mọi người đọc, tức Principal \"*\", do script cũ thêm vào. BPA đang chặn policy đó nên ảnh trả 403.</p><p><strong>Hậu quả:</strong> dev tắt cả bốn công tắc để ảnh hiện. Vài ngày sau, một người không đăng nhập tải được file PDF hóa đơn của khách.</p>",
  "askFirst": [
    "Tắt BPA có tự làm bucket công khai không, hay nó chỉ mở ra quyền đã nằm sẵn trong bucket policy và ACL? → Giải mã: Chỉ mở ra quyền đã nằm sẵn; BPA là lớp rào, tắt BPA không thêm quyền mới (Bài L05, Bài L20).",
    "Nếu một object còn ACL công khai, công tắc BPA nào chặn nó, và điều gì xảy ra khi bạn tắt công tắc đó? → Giải mã: Công tắc ACL của BPA chặn; tắt công tắc thì ACL công khai đó mở lại, bucket lộ ngay (Bài L05)."
  ],
  "predict": {
    "q": "Bạn đoán: bucket chỉ có một bucket policy cấp quyền cho đúng IAM role của backend và không có ACL công khai nào. Khi bật tắt cả bốn công tắc Block Public Access, người ẩn danh có đọc được file không?",
    "a": "<p><strong>Không.</strong> Policy chỉ cấp cho một principal cụ thể, không có ký tự đại diện như \"*\", nên S3 không coi là công khai và người ẩn danh không có Allow nào.</p><p><strong>Tắt BPA không tạo thêm quyền.</strong> BPA chỉ là lớp chặn đè lên policy và ACL. Thứ làm lộ là một Allow cho \"*\" hoặc ACL công khai đã tồn tại, và lớp chặn chỉ có tác dụng khi BPA đang bật.</p>"
  },
  "anchor": "Block Public Access (BPA) không sửa bucket policy hay ACL, nó chặn request công khai ở tầng trên. Tắt BPA nghĩa là mở lại mọi policy và ACL công khai đã nằm sẵn trong bucket.",
  "q": "Dev tắt Block Public Access để ảnh hiện trên trang web, rồi cả bucket hóa đơn bị lộ. Bạn giải thích S3 quyết định ai được đọc gì thế nào, và sửa cấu hình ra sao để ảnh vẫn hiện mà hóa đơn không lộ?",
  "oral": "Tôi tách hai nguồn quyền. Bucket policy cấp quyền cho cả người ngoài, còn IAM policy chỉ cho biết một danh tính nội bộ được làm gì. Policy có Principal \"*\" và không có Condition giới hạn thì S3 coi là công khai; có Condition cố định như aws:SourceVpc thì không. Block Public Access đè lên tất cả, nên tắt BPA không tạo quyền mới mà chỉ mở lại policy và ACL có sẵn. Trong tình huống này, bucket policy cũ có \"*\" và BPA đang chặn nó. Sửa đúng là bật lại cả bốn công tắc, xóa statement \"*\", và đưa ảnh sang bucket riêng phục vụ qua CloudFront với OAC. Về mã hóa, SSE-S3 không chặn người có quyền đọc, còn SSE-KMS buộc người đọc có kms:Decrypt và key policy cho phép. Cuối cùng, thiếu s3:ListBucket thì object không tồn tại cũng trả 403.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>S3 (Simple Storage Service)</strong>: kho file đám mây của AWS, tính tiền theo dung lượng và lượt truy cập.</li><li><strong>Block Public Access (BPA)</strong>: bốn công tắc chặn truy cập công khai, đặt ở cấp account hoặc bucket. Giống cầu dao tổng: bật lên thì ổ nào cũng mất điện, dây bên trong vẫn còn.</li><li><strong>Bucket policy</strong>: chính sách gắn trên bucket, nói ai được làm gì với bucket và object bên trong. Giống bảng phân quyền dán ở cửa kho, tương tự allow/deny của Nginx.</li><li><strong>ACL</strong>: danh sách quyền kiểu cũ gắn trên từng object. Giống nhãn dán riêng trên từng hộp hàng, nên hiện nay nên tắt và dùng policy.</li><li><strong>OAC (origin access control)</strong>: cho phép đúng một CloudFront distribution đọc bucket, còn mọi nguồn khác bị từ chối. Giống Nginx chỉ cho đúng một upstream được gọi vào.</li></ul><p><strong>Tắt BPA không tạo quyền.</strong> BPA chỉ là lớp chặn đè lên policy và ACL. Nếu một policy có Principal \"*\" đã tồn tại, tắt BPA sẽ mở lại nó.</p><p><strong>Mã hóa không phải kiểm soát truy cập.</strong> SSE-S3 là mặc định, S3 tự giải mã cho bất kỳ request nào có quyền. SSE-KMS thêm lớp key policy và kms:Decrypt, nên người đọc phải có quyền trên cả khóa.</p><p><strong>403 và 404.</strong> Thiếu s3:ListBucket thì object không tồn tại cũng trả 403, nên không dùng 403 để suy ra object có hay không.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L20.</p>",
  "code": "import boto3\n\ns3 = boto3.client(\"s3\")\nBUCKET = \"hoadon-prod\"\n\n# ✅ Cách làm chuẩn: bật lại cả bốn công tắc Block Public Access cho bucket hóa đơn.\ns3.put_public_access_block(\n    Bucket=BUCKET,\n    PublicAccessBlockConfiguration={\n        \"BlockPublicAcls\": True,\n        \"IgnorePublicAcls\": True,\n        \"BlockPublicPolicy\": True,\n        \"RestrictPublicBuckets\": True,\n    },\n)\n\n# Kiểm tra: S3 có coi bucket policy hiện tại là công khai không.\nstatus = s3.get_bucket_policy_status(Bucket=BUCKET)\nprint(status[\"PolicyStatus\"][\"IsPublic\"])",
  "expected": null,
  "followups": [
    {
      "q": "Làm sao biết một bucket đang công khai thật, không đoán bằng cảm giác?",
      "a": "Bạn kiểm tra ba lớp. Lớp một là trạng thái Block Public Access của account và từng bucket. Lớp hai là lệnh GetBucketPolicyStatus, trả về cờ IsPublic. Lớp ba là IAM Access Analyzer for S3. Với hóa đơn, kiểm tra thêm ACL của từng object, vì BPA không xóa ACL cũ khi bật, nó chỉ chặn chúng có hiệu lực."
    },
    {
      "q": "Nếu cần cho người dùng cuối xem ảnh công khai thật, bạn làm thế nào mà không mở bucket hóa đơn?",
      "a": "Tách ảnh công khai sang bucket riêng và phân phối qua CloudFront với OAC. Bucket hóa đơn giữ BPA bật đủ bốn công tắc. Tách bucket để một policy sai ở bucket ảnh không kéo theo hóa đơn, và tài liệu nhạy cảm thêm sau này không tự thành công khai. CloudFront còn cache ảnh cho nhanh, đổi lại phải xóa cache khi đổi ảnh."
    },
    {
      "q": "Vì sao bạn chọn SSE-KMS cho hóa đơn thay vì SSE-S3, và khi đó cần cấu hình gì thêm?",
      "a": "SSE-KMS cho bạn quyền kiểm soát khóa: quyết định ai dùng khóa qua key policy, thu hồi quyền bằng cách sửa key policy, và xem lệnh Decrypt trong CloudTrail. Cấu hình thêm gồm key policy cho đúng role đọc hóa đơn, kms:Decrypt trong IAM policy của role đó, và customer managed key nếu chia sẻ với tài khoản khác. Bật S3 Bucket Key, và nếu policy có điều kiện s3:x-amz-server-side-encryption-aws-kms-key-id thì giá trị phải khớp KMS key ARN đang mã hóa object."
    }
  ],
  "pitfalls": [
    "Tắt Block Public Access ở cấp account để sửa một bucket, khiến mọi bucket trong account, gồm cả bucket hóa đơn, mở lại các truy cập công khai đã có sẵn",
    "Thêm Principal \"*\" vào bucket policy để hết 403 nhanh, rồi tin rằng SSE-S3 đã bảo vệ dữ liệu; mã hóa không chặn người có quyền đọc",
    "Coi 404 là object không tồn tại và 403 là lỗi quyền, trong khi thiếu s3:ListBucket cũng trả 403 cho cả object không tồn tại, nên 403 không cho biết object có hay không"
  ],
  "selfcheck": [
    "Tôi giải thích được vì sao policy gắn đúng một IAM role không bị coi là công khai: Principal là giá trị cố định, không có ký tự đại diện như \"*\"",
    "Tôi giải thích được bằng ví dụ: tắt BPA chỉ mở lại bucket policy có Principal \"*\" đã nằm sẵn trong bucket hóa đơn, không tạo quyền mới",
    "Tôi viết được lệnh boto3 bật lại bốn công tắc BPA cho bucket hóa đơn, và cấu hình OAC để CloudFront đọc bucket ảnh riêng"
  ],
  "refs": [
    "aws-s3-bpa",
    "aws-s3-encryption",
    "aws-kms",
    "aws-iam",
    "aws-s3"
  ],
  "tradeoff": "<p>Ba lựa chọn đổi tốc độ lấy mức kiểm soát.</p><ul><li><strong>Mở bucket công khai:</strong> Nhanh nhất để ảnh hiện, nhưng mọi object đều công khai và rủi ro lộ tăng mỗi khi thêm file.</li><li><strong>Giữ BPA bật:</strong> Kiểm soát tập trung, đổi lại phải dùng CloudFront với OAC và tách bucket ảnh khỏi bucket hóa đơn.</li><li><strong>SSE-KMS:</strong> Quyền kiểm soát khóa và nhật ký giải mã, đổi lại thêm chi phí request và việc cấu hình key policy.</li></ul>",
  "alternatives": "<ul><li><strong>Bucket riêng cho ảnh công khai</strong>, phục vụ qua CloudFront với OAC, và giữ BPA bật cho bucket hóa đơn. Đây là lựa chọn nên dùng.</li><li><strong>Website endpoint của S3</strong>: mở công khai được, nhưng phải dùng như custom origin và không dùng được OAC, nên kém an toàn hơn.</li><li><strong>Presigned URL</strong> cho từng file: hợp khi người dùng chỉ cần một file trong thời gian ngắn, xem G06.</li></ul>",
  "observe": "<p>Theo dõi trạng thái quyền truy cập và thay đổi cấu hình.</p><ul><li><strong>Trạng thái BPA:</strong> Của account và từng bucket, kiểm tra định kỳ.</li><li><strong>Thay đổi cấu hình:</strong> Các lệnh như PutPublicAccessBlock và PutBucketPolicy được ghi qua CloudTrail; đặt cảnh báo khi có thay đổi.</li><li><strong>Số request 403 bất thường:</strong> Trên bucket hóa đơn, đặt cảnh báo bằng CloudWatch.</li></ul>",
  "say30": "Block Public Access đè lên mọi policy và ACL, còn bucket policy có Principal \"*\" thì làm bucket công khai. Tắt BPA để sửa một bucket chỉ mở lại lỗ hổng cũ. Tôi cấp ảnh qua CloudFront với OAC, đặt ảnh ở bucket riêng, và giữ bucket hóa đơn bật đủ bốn công tắc BPA.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Khi dev tắt Block Public Access (BPA) để ảnh hiện, họ không tạo quyền công khai mới mà chỉ mở lại policy và ACL đã nằm sẵn trong bucket. Tôi giải thích theo ba lớp.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Lớp đầu là BPA: bốn công tắc, đặt ở cấp account hoặc bucket, chặn truy cập công khai và đè lên mọi policy. Lớp hai là quyền: bucket policy cấp cho ai, còn IAM policy cấp cho danh tính nội bộ.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Lớp ba là mã hóa: SSE-S3 là mặc định và không chặn người có quyền đọc, còn SSE-KMS yêu cầu thêm kms:Decrypt cùng key policy. Khi sửa, tôi bật lại cả bốn công tắc BPA cho bucket hóa đơn, xóa statement có Principal \"*\", kiểm tra bằng GetBucketPolicyStatus, bật Object Ownership để tắt ACL, và đưa ảnh sang bucket riêng phục vụ qua CloudFront với OAC.\n(xem Bài L05 và Bài L20)"
}
);
