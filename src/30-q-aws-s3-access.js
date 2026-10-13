var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'G23',
group: 'G',
topic: 'S3: Block Public Access, bucket policy vs IAM, Object Ownership, mã hóa SSE-S3/SSE-KMS và 403 vs 404',
prio: 'P0',
level: 'L2',
type: 'situation',
attacks: [
  { q: 'Đã bật mã hóa mặc định SSE-S3 rồi thì hóa đơn có còn bị đọc công khai không?', a: 'Có. SSE-S3 (mã hóa phía server bằng khóa do S3 quản lý) chỉ bảo vệ dữ liệu khi nằm trên đĩa. S3 tự giải mã khi trả dữ liệu cho bất kỳ request nào được phép đọc, nên mã hóa không chặn người có quyền. Ngăn lộ là việc của quyền truy cập: bật Block Public Access (BPA, bốn công tắc chặn truy cập công khai ở cấp bucket hoặc account, bucket là thùng chứa file trên S3), giữ bucket policy (chính sách gắn trên bucket, nói ai được làm gì) không cấp cho Principal (đối tượng được cấp quyền) "*" nghĩa là mọi người, và tắt ACL (danh sách quyền cũ gắn trên từng object) bằng Object Ownership (thiết lập quyền sở hữu object của bucket).' },
  { q: 'Sao không cấp IAM user cho người xem ảnh thay vì mở bucket?', a: 'Người xem ảnh không có tài khoản AWS nên không thể ký request bằng IAM (hệ thống phân quyền của AWS, gắn cho user hoặc role). Muốn cho người ngoài xem ảnh mà vẫn giữ bucket riêng, bạn đặt ảnh ở một bucket khác và cho CloudFront (mạng phân phối nội dung của AWS) đọc bằng OAC (origin access control, cơ chế để CloudFront ký request tới S3). Mở bucket công khai nhanh hơn nhưng mất kiểm soát, vì mọi file trong bucket đều thành công khai.' }
],
incident: '<p>Tình huống giả định: Dev làm trang sản phẩm, ảnh không hiện và trình duyệt nhận 403 (mã lỗi từ chối truy cập) khi tải ảnh từ bucket tên <code>hoadon-prod</code>. Bucket này có sẵn một bucket policy cũ cho mọi người đọc, tức Principal "*", do script cũ thêm vào. Block Public Access (BPA, bốn công tắc chặn truy cập công khai) đang chặn policy đó nên ảnh trả 403. Dev tắt cả bốn công tắc để ảnh hiện. Vài ngày sau, một người không đăng nhập tải được file PDF hóa đơn của khách.</p>',
askFirst: [
  'Tắt BPA (Block Public Access, bốn công tắc chặn công khai) có tự làm bucket công khai không, hay nó chỉ mở ra quyền đã nằm sẵn trong bucket policy và ACL (danh sách quyền cũ)?',
  'Nếu một object còn ACL công khai (danh sách quyền cũ gắn trên từng file), công tắc BPA nào chặn nó, và điều gì xảy ra khi bạn tắt công tắc đó?'
],
predict: { q: 'Bạn đoán: bucket chỉ có một bucket policy cấp quyền cho đúng IAM role (danh tính có quyền do AWS cấp) của backend và không có ACL công khai nào. Khi bật tắt cả bốn công tắc Block Public Access, người ẩn danh có đọc được file không?', a: '<p>Không. Policy chỉ cấp cho một principal cụ thể (đối tượng được cấp quyền), không có ký tự đại diện như "*", nên S3 không coi là công khai và người ẩn danh không có Allow nào. Tắt BPA không tạo thêm quyền, vì BPA chỉ là lớp chặn đè lên policy và ACL. Thứ làm lộ là một Allow cho "*" hoặc ACL công khai đã tồn tại, và lớp chặn chỉ có tác dụng khi BPA đang bật.</p>' },
anchor: 'Block Public Access (BPA) không sửa bucket policy hay ACL, nó chặn request công khai ở tầng trên. Tắt BPA nghĩa là mở lại mọi policy và ACL công khai đã nằm sẵn trong bucket.',
q: 'Dev tắt Block Public Access (BPA, bốn công tắc chặn công khai) để ảnh hiện trên trang web, rồi cả bucket hóa đơn bị lộ. Bạn giải thích S3 quyết định ai được đọc gì thế nào, và sửa cấu hình ra sao để ảnh vẫn hiện mà hóa đơn không lộ?',
oral: 'Tôi tách hai nguồn quyền. Bucket policy (chính sách gắn trên bucket, thùng chứa file trên S3) cấp quyền cho cả người ngoài, còn IAM policy (chính sách gắn trên user hoặc role) chỉ cho biết một danh tính nội bộ được làm gì. Policy có Principal "*" (mọi người) và không có Condition giới hạn thì S3 coi là công khai; nếu có Condition với giá trị cố định (ví dụ aws:SourceVpc) thì không. Block Public Access (BPA, bốn công tắc chặn công khai) đè lên tất cả, nên tắt BPA không tạo quyền mới mà chỉ mở lại policy và ACL (danh sách quyền cũ) đã có sẵn. Trong tình huống này, bucket policy cũ có "*" và BPA đang chặn nó. Sửa đúng là bật lại cả bốn công tắc BPA, xóa statement "*", và đặt ảnh ở bucket riêng phục vụ qua CloudFront (mạng phân phối nội dung của AWS) với OAC (origin access control). Về mã hóa, SSE-S3 (mã hóa mặc định bằng khóa do S3 quản lý) không chặn người có quyền đọc, còn SSE-KMS (mã hóa bằng khóa của KMS, dịch vụ quản lý khóa) buộc người đọc có kms:Decrypt và key policy cho phép. Cuối cùng, thiếu s3:ListBucket thì object không tồn tại cũng trả 403, nên 403 không cho biết object có hay không.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>S3 (Simple Storage Service)</strong>: dịch vụ lưu file của AWS. Ví dụ đời thường: kho file đám mây tính tiền theo dung lượng và lượt truy cập.</li><li><strong>Block Public Access (BPA)</strong>: bốn công tắc chặn truy cập công khai, đặt ở cấp account hoặc bucket. Giống cầu dao tổng: bật lên thì ổ cắm nào cũng không có điện, dù dây bên trong vẫn còn.</li><li><strong>Bucket policy</strong>: chính sách gắn trên bucket, nói ai được làm gì với bucket và object bên trong. Giống bảng phân quyền dán ở cửa kho.</li><li><strong>ACL (Access Control List)</strong>: danh sách quyền kiểu cũ gắn trên từng bucket hoặc object. Giống nhãn dán riêng trên từng hộp hàng, nên hiện nay nên tắt và dùng policy.</li><li><strong>SSE-KMS</strong>: mã hóa phía server bằng khóa trong KMS (dịch vụ quản lý khóa của AWS). Giống két sắt có chìa riêng, người có chìa mới mở được.</li></ul><p>Phân tích: bốn công tắc BPA là BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy và RestrictPublicBuckets. Theo tài liệu AWS, các công tắc này không sửa policy hay ACL đã có, nên khi tắt chúng, mọi quyền công khai cũ có hiệu lực trở lại. Đây là điểm dev không biết khi tắt BPA để sửa một lỗi hiển thị ảnh.</p><p>Khi nào cần đổi cách làm: nếu bucket chỉ chứa ảnh công khai, bạn tách bucket đó ra và giữ BPA bật cho bucket hóa đơn. Nếu bạn cần chia sẻ hóa đơn cho đối tác ngoài account, dùng bucket policy với Principal cố định và điều kiện rõ ràng, không dùng "*". Nếu chỉ cần một file trong thời gian ngắn, presigned URL (đường dẫn có chữ ký tạm thời) phù hợp hơn, xem G06.</p>',
code: `import boto3

s3 = boto3.client("s3")
BUCKET = "hoadon-prod"

# Bật lại cả bốn công tắc Block Public Access cho bucket hóa đơn.
s3.put_public_access_block(
    Bucket=BUCKET,
    PublicAccessBlockConfiguration={
        "BlockPublicAcls": True,
        "IgnorePublicAcls": True,
        "BlockPublicPolicy": True,
        "RestrictPublicBuckets": True,
    },
)

# Kiểm tra: S3 có coi bucket policy hiện tại là công khai không.
status = s3.get_bucket_policy_status(Bucket=BUCKET)
print(status["PolicyStatus"]["IsPublic"])`,
expected: null,
followups: [
  { q: 'Làm sao biết một bucket đang công khai thật, không đoán bằng cảm giác?', a: 'Bạn xem ba lớp. Một là trạng thái Block Public Access (BPA) của account và từng bucket. Hai là lệnh GetBucketPolicyStatus (hỏi S3 xem bucket policy có được coi là công khai không), trả về một cờ IsPublic. Ba là IAM Access Analyzer for S3 (công cụ quét bucket để tìm chỗ cho phép truy cập từ internet hoặc tài khoản khác). Với hóa đơn, kiểm tra thêm ACL (danh sách quyền cũ) của từng object, vì BPA không xóa ACL cũ khi bật, nó chỉ chặn chúng có hiệu lực.' },
  { q: 'Nếu cần cho người dùng cuối xem ảnh công khai thật, bạn làm thế nào mà không mở bucket hóa đơn?', a: 'Tách ảnh công khai sang một bucket riêng, không dùng chung với hóa đơn, và phân phối qua CloudFront (mạng phân phối nội dung của AWS) với OAC (origin access control). Bucket hóa đơn giữ BPA bật đủ bốn công tắc. Tách bucket giúp một policy sai ở bucket ảnh không kéo theo hóa đơn, và tài liệu nhạy cảm thêm sau này không tự thành công khai. CloudFront còn cache (lưu tạm) ảnh để phục vụ nhanh hơn, đổi lại phải xóa cache khi đổi ảnh.' },
  { q: 'Vì sao bạn chọn SSE-KMS cho hóa đơn thay vì SSE-S3, và khi đó cần cấu hình gì thêm?', a: 'SSE-KMS cho bạn quyền kiểm soát khóa: quyết định ai được dùng khóa bằng key policy (chính sách gắn trên khóa), thu hồi quyền bằng cách sửa key policy, và xem các lệnh Decrypt trong CloudTrail (nhật ký ghi lại lệnh gọi API). Cấu hình thêm gồm key policy cho đúng role đọc hóa đơn, kms:Decrypt trong IAM policy của role đó, và nếu chia sẻ với tài khoản khác thì dùng customer managed key (khóa do bạn tạo) thay vì AWS managed key. Bật S3 Bucket Key (khóa cấp cho cả bucket để giảm số lần gọi KMS, giúp giảm chi phí) và nếu policy có điều kiện s3:x-amz-server-side-encryption-aws-kms-key-id thì giá trị đó phải khớp KMS key ARN (địa chỉ duy nhất của khóa KMS) đang mã hóa object.' }
],
pitfalls: [
  'Tắt Block Public Access ở cấp account để sửa một bucket, khiến mọi bucket trong account, gồm cả bucket hóa đơn, mở lại các truy cập công khai đã có sẵn',
  'Thêm Principal "*" (mọi người) vào bucket policy để hết 403 nhanh, rồi tin rằng SSE-S3 đã bảo vệ dữ liệu; mã hóa không chặn người có quyền đọc',
  'Coi 404 là object không tồn tại và 403 là lỗi quyền, trong khi thiếu s3:ListBucket (quyền liệt kê nội dung bucket) cũng trả 403 cho cả object không tồn tại, nên 403 không cho biết object có hay không'
],
selfcheck: [
  'Tôi giải thích được vì sao policy gắn đúng một IAM role không bị coi là công khai: Principal là giá trị cố định, không có ký tự đại diện, dù cả hai đều là Allow và đều cấp quyền đọc',
  'Tôi có thể giải thích bằng ví dụ: tắt BPA chỉ mở lại bucket policy có Principal "*" đã nằm sẵn trong bucket hóa đơn, không tạo quyền mới',
  'Tôi có thể viết lệnh boto3 bật lại bốn công tắc BPA cho bucket hóa đơn và cấu hình OAC để CloudFront đọc bucket ảnh riêng'
],
refs: ['aws-s3-bpa', 'aws-s3-encryption', 'aws-kms', 'aws-iam', 'aws-s3'],
tradeoff: '<p>Mở bucket công khai là cách nhanh nhất để ảnh hiện, đổi lại mọi object trong bucket đều công khai, không kiểm soát được từng người, và rủi ro lộ tăng mỗi khi thêm file. Block Public Access (BPA) bật đủ bốn công tắc giữ kiểm soát tập trung, đổi lại bạn phải dùng CloudFront với OAC để phục vụ nội dung công khai và tách bucket ảnh khỏi bucket hóa đơn. SSE-KMS cho quyền kiểm soát khóa và nhật ký giải mã, đổi lại thêm chi phí request và công việc cấu hình key policy.</p>',
alternatives: '<ul><li>Bucket riêng cho ảnh công khai, phục vụ qua CloudFront với OAC (origin access control), giữ BPA bật cho bucket hóa đơn. Đây là lựa chọn nên dùng.</li><li>Website endpoint của S3 (địa chỉ web tĩnh do S3 cung cấp): mở công khai được, nhưng theo tài liệu AWS phải dùng như custom origin và không dùng được OAC, nên kém an toàn hơn.</li><li>Presigned URL (đường dẫn có chữ ký tạm thời) cho từng file: phù hợp khi người dùng chỉ cần một file trong thời gian ngắn, xem G06.</li></ul>',
observe: '<p>Theo dõi ba thứ. Một là trạng thái Block Public Access (BPA) của account và từng bucket, kiểm tra định kỳ. Hai là các lệnh thay đổi cấu hình như PutPublicAccessBlock (lệnh API bật BPA) và PutBucketPolicy, ghi lại qua CloudTrail (nhật ký lệnh gọi API) và đặt cảnh báo khi có thay đổi. Ba là số request bị 403 bất thường trên bucket hóa đơn. Có thể đặt cảnh báo bằng CloudWatch (dịch vụ đo lường và cảnh báo của AWS).</p>',
say30: 'Block Public Access (BPA, bốn công tắc chặn công khai) đè lên mọi policy và ACL (danh sách quyền cũ). Bucket policy có Principal "*" làm bucket công khai, nên tắt BPA là mở lại lỗ hổng cũ. Tôi không tắt BPA để sửa một bucket. Tôi cấp ảnh qua CloudFront (mạng phân phối nội dung) với OAC (origin access control), đặt ảnh ở bucket riêng, và giữ bucket hóa đơn bật đủ bốn công tắc BPA.',
say90: 'Khi dev tắt Block Public Access (BPA) để ảnh hiện, thực chất họ không tạo quyền công khai mới mà mở lại mọi policy và ACL (danh sách quyền cũ gắn trên object) đã nằm sẵn trong bucket. Bucket policy có Principal (đối tượng được cấp quyền) "*" là nguyên nhân. Tôi giải thích theo ba lớp. Lớp đầu là BPA: bốn công tắc, đặt ở cấp account hoặc bucket, chặn request công khai và đè lên policy. Lớp hai là quyền: bucket policy cấp cho ai, còn IAM policy (chính sách gắn trên user hoặc role) cấp cho danh tính nội bộ. Lớp ba là mã hóa: SSE-S3 là mặc định và không chặn người có quyền đọc; SSE-KMS yêu cầu thêm kms:Decrypt và key policy cho phép. Khi sửa, tôi bật lại cả bốn công tắc BPA cho bucket hóa đơn, xóa statement "*", kiểm tra trạng thái công khai bằng GetBucketPolicyStatus (lệnh hỏi S3 bucket policy có công khai không), và chuyển ảnh sang bucket riêng phục vụ qua CloudFront với OAC. Object Ownership (thiết lập quyền sở hữu object) mặc định là Bucket owner enforced cho bucket mới; với bucket cũ phải kiểm tra cài đặt này trước khi tin điều đó, rồi mới để ACL không còn ảnh hưởng quyền đọc. Về sau khi gặp 403, tôi nhớ rằng thiếu s3:ListBucket cũng trả 403 cho object không tồn tại, nên kiểm tra từng lớp thay vì đoán từ mã lỗi.'
}
);
