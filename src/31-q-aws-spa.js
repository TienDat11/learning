var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "G24",
  "group": "G",
  "topic": "Host Vue SPA trên S3 + CloudFront với OAC: bucket private, deep link ra 403 và bản cũ sau deploy",
  "prio": "P0",
  "level": "L2",
  "type": "debug",
  "attacks": [
    {
      "q": "Sao không mở bucket public cho nhanh, khỏi phải cấu hình OAC?",
      "a": "Đừng mở public, vì CloudFront có OAC để đọc bucket riêng tư. Mở public là lộ mọi file build ra ngoài và mất kiểm soát từ CloudFront. Cách đúng: bật Block Public Access, viết bucket policy cho principal cloudfront.amazonaws.com kèm điều kiện AWS:SourceArn trỏ đúng ARN distribution, rồi dùng OAC. Bucket vẫn private, CloudFront là cổng duy nhất đọc dữ liệu."
    },
    {
      "q": "Đặt Cache-Control no-cache cho index.html thì có cần invalidation sau deploy không?",
      "a": "Không bắt buộc, nếu cache policy đúng. Với cache policy CachingDisabled (Minimum TTL = 0), CloudFront tôn trọng no-cache từ origin, nên bản mới lộ ra ngay khi index.html gửi no-cache. Với CachingOptimized (Minimum TTL 1 giây), CloudFront giữ tối thiểu 1 giây dù có no-cache, nhưng bản cũ chỉ tồn tại ngắn. Invalidation là bước bổ sung, không phải điều kiện để bản mới ra."
    }
  ],
  "incident": "<p>Tình huống giả định: Một Vue SPA được build ra thư mục dist gồm index.html và các file JavaScript, CSS có hash trong tên. Các file nằm trong một bucket S3 đã chặn public access, còn CloudFront đứng trước bucket qua OAC. Người dùng mở trang chủ thì ổn, nhưng nhấn F5 ở /orders/42 thì nhận 403 AccessDenied. Sau một lần deploy, nhiều người vẫn thấy giao diện cũ dù file trong bucket đã được thay mới.</p>",
  "askFirst": [
    "Vì sao trang chủ chạy được nhưng /orders/42 ra 403 khi bucket vẫn private? → Giải mã: S3 không có object cho đường dẫn con, role OAC thiếu quyền liệt kê; 403 không suy ra object có hay không (Bài L19, Bài L20).",
    "Vì sao deploy xong vẫn có người thấy bản cũ, và bản cũ đang nằm ở những tầng nào? → Giải mã: Bản cũ ở CloudFront nếu TTL index.html dương, và ở trình duyệt nếu nhận bản đã cache; hash asset tự hết, index.html phải cấu hình ngắn (Bài L20).",
    "Vì sao file JavaScript có hash trong tên không cần xóa cache, còn index.html thì phải cấu hình cache thế nào? → Giải mã: Hash đổi mỗi deploy nên bản cache cũ không khớp; index.html không đổi tên, cấu hình TTL ngắn để không giữ bản cũ (Bài L20)."
  ],
  "predict": {
    "q": "Bạn bật custom error response đổi 403 thành /index.html với mã 200, rồi một file /assets/app.9f3c.js thật sự bị thiếu trên bucket. Trình duyệt tải file đó thì điều gì xảy ra, và lỗi nào bị che đi?",
    "a": "CloudFront nhận 403 từ S3 cho file đó, và quy tắc áp dụng cho mọi 403 nên nó trả nội dung index.html với mã 200. Trình duyệt nhận HTML thay cho JavaScript, script không chạy, trang trắng hoặc báo lỗi khó hiểu. Mã 200 làm lỗi thiếu file trông như thành công, nên log không cho thấy nguyên nhân thật. Cần phân biệt được đường dẫn có đuôi file với đường dẫn không có đuôi, và đó là lý do CloudFront Function hợp hơn custom error response cho bài toán này."
  },
  "anchor": "SPA cần index.html trả cho đường dẫn sâu, còn index.html phải có cache ngắn hoặc no-cache để bản mới lộ ra ngay; hai lỗi này cùng biểu hiện là sai trang nhưng nguyên nhân khác nhau.",
  "q": "Bạn host Vue SPA trên S3 và CloudFront với bucket private. Vì sao F5 ở /orders/42 ra 403 AccessDenied, và sau deploy vì sao người dùng vẫn thấy bản cũ? Bạn sửa thế nào mà bucket vẫn private?",
  "oral": "Vue SPA build rồi đưa lên bucket S3 private. CloudFront đứng trước và đọc bucket qua OAC. Bucket policy cho principal cloudfront.amazonaws.com kèm AWS:SourceArn trỏ đúng distribution, nên không cần mở public. F5 ở /orders/42 ra 403 vì đường dẫn đó không có object trên S3, và role OAC thiếu quyền s3:ListBucket nên S3 trả 403 thay vì 404. Tôi sửa bằng default root object cho đường dẫn gốc /, và xử lý đường dẫn sâu bằng custom error response đổi 403 thành /index.html với mã 200, hoặc dùng CloudFront Function. Về cache, index.html gửi no-cache để luôn hỏi lại origin, file có hash trong tên gửi max-age=31536000, immutable để cache một năm. Sau deploy tôi kiểm tra header bằng curl -I; invalidate /index.html chỉ là bước tùy chọn, không bắt buộc.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>CloudFront</strong>: CDN của AWS, giữ bản sao nội dung ở các edge location. Giống Nginx đứng trước app Django, chỉ khác là nó nằm rải khắp thế giới.</li><li><strong>S3</strong>: dịch vụ lưu object của AWS, mỗi bucket là kho chứa. Giống thư mục media của Django nhưng đặt trên cloud.</li><li><strong>OAC</strong>: cơ chế CloudFront ký request khi đọc S3, cho phép chỉ CloudFront (không phải ai khác) đọc bucket. Giống việc service API nội bộ dùng credential riêng để truy cập database, không phải public.</li><li><strong>SPA</strong>: single page application, toàn bộ giao diện chạy trên trình duyệt. Giống app React nhưng chỉ có một trang HTML duy nhất được tải lần đầu, các thay đổi sau đó xử lý bởi JavaScript phía client.</li></ul><p><strong>Cơ chế.</strong> CloudFront lấy object từ S3 theo request. Nếu object không tồn tại, S3 trả 404 khi requester có quyền s3:ListBucket trên bucket, còn 403 khi thiếu quyền đó. Index.html phải dùng Cache-Control: no-cache (hoặc Minimum TTL = 0 trong cache policy) để trình duyệt luôn gửi request tới origin mỗi lần tải trang sâu. File có hash trong tên dùng Cache-Control: max-age=31536000, immutable để trình duyệt cache một năm, chỉ tải lại khi deploy đổi tên hash.</p><p><strong>Nguyên nhân.</strong> F5 ở /orders/42 trả 403 vì đường dẫn đó không có object thực sự trên S3, và role OAC chỉ có s3:GetObject, thiếu s3:ListBucket. Sau deploy, bản cũ vẫn tồn tại ở điểm biên nếu Cache-Control: max-age lớn hơn 0 hoặc nếu origin gửi max-age cho index.html.</p><p>Mặc định 24 giờ nếu không có cache policy và origin không gửi Cache-Control. Khi trình duyệt gửi yêu cầu tới điểm biên, nó có thể nhận bản đã cache cũ trong khoảng thời gian đó.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L19, Bài L20.</p>",
  "code": "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"AllowCloudFrontServicePrincipalReadOnly\",\n      \"Effect\": \"Allow\",\n      \"Principal\": {\n        \"Service\": \"cloudfront.amazonaws.com\"\n      },\n      \"Action\": \"s3:GetObject\",\n      \"Resource\": \"arn:aws:s3:::spa-bucket-example/*\",\n      \"Condition\": {\n        \"StringEquals\": {\n          \"AWS:SourceArn\": \"arn:aws:cloudfront::111122223333:distribution/E2EXAMPLE12345\"\n        }\n      }\n    }\n  ]\n}",
  "expected": "Một SPA Vue trên S3 private qua CloudFront cần bốn thứ: bucket chặn public access và CloudFront đọc bằng OAC, bucket policy có AWS:SourceArn trỏ đúng distribution; default root object là index.html không có dấu / đầu; đường dẫn sâu như /orders/42 được trả index.html qua custom error response hoặc CloudFront Function; index.html gửi Cache-Control no-cache còn file hash gửi max-age dài kèm immutable, sau deploy có thể invalidate /index.html như bước tùy chọn. Nguyên nhân của 403 là /orders/42 không tồn tại như object trên S3 và role thiếu s3:ListBucket nên S3 trả 403 thay 404. Bản cũ sau deploy phải được chẩn đoán theo cache policy và header thật. Nếu Minimum TTL lớn hơn 0 hoặc origin gửi max-age, CloudFront giữ bản cũ theo các giá trị đó; trình duyệt mới nhận index.html mới khi cache hết hạn.",
  "followups": [
    {
      "q": "Nếu chỉ cấu hình default root object mà không xử lý 403, F5 ở /orders/42 còn lỗi không và vì sao?",
      "a": "Vẫn lỗi. Default root object chỉ trả index.html khi người dùng gọi đúng đường dẫn gốc /, tài liệu AWS ghi rõ nó không áp dụng cho thư mục con. Đường dẫn /orders/42 không phải gốc nên CloudFront gửi yêu cầu tới S3 như bình thường, S3 không tìm thấy object và trả 403 vì role không có s3:ListBucket. Muốn F5 ở đường dẫn sâu hoạt động, bạn phải thêm cơ chế xử lý riêng như custom error response hoặc CloudFront Function."
    },
    {
      "q": "Custom error response đổi 403 thành 200 có rủi ro gì, và khi nào bạn chuyển sang CloudFront Function?",
      "a": "Rủi ro lớn nhất là nó che mọi 403 từ S3, kể cả 403 thật do OAC bị cấu hình sai hoặc do thiếu quyền. Người dùng thấy trang index.html thay vì một lỗi rõ ràng, đội vận hành khó phát hiện sự cố. Bạn chuyển sang CloudFront Function khi cần phân biệt đường dẫn có đuôi file với route của SPA: hàm chạy ở sự kiện viewer request, kiểm tra đường dẫn và chỉ đổi những yêu cầu không phải file tĩnh sang /index.html. Cách này giữ nguyên 403 thật từ S3. Đổi lại bạn phải viết và kiểm thử logic đó."
    },
    {
      "q": "Nếu index.html cũng được cache một năm như file có hash thì chuyện gì xảy ra sau deploy?",
      "a": "Người dùng đã có index.html cũ sẽ tiếp tục tải bundle cũ, vì HTML cũ trỏ tới tên file cũ. Nếu bản deploy trước đã xóa các bundle cũ khỏi bucket, trình duyệt tải file không còn tồn tại và trang trắng. Người dùng mới cũng có thể nhận HTML cũ từ điểm biên. Đó là lý do index.html phải dùng no-cache hoặc cache rất ngắn, còn file có hash mới dùng max-age dài kèm immutable. Sau deploy, invalidate /index.html chỉ là bước tùy chọn; với no-cache và Minimum TTL 0, CloudFront tôn trọng header nên bản mới không bị giữ ở điểm biên."
    }
  ],
  "pitfalls": [
    "Đặt cache một năm cho index.html, file vào cố định của SPA, khiến người dùng giữ mãi HTML cũ trỏ tới bundle cũ đã bị xóa",
    "Mở public bucket để sửa 403 nhanh, làm mất lớp kiểm soát của CloudFront và lộ toàn bộ file build",
    "Ghi default root object là /index.html có dấu / đầu, có thể khiến CloudFront trả 403 AccessDenied dù file có tồn tại"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được vì sao S3 trả 403 chứ không trả 404 khi /orders/42 không có object thật và role OAC chỉ có s3:GetObject",
    "Tôi có thể giải thích bằng ví dụ index.html gửi no-cache còn main.3fa9.js gửi immutable, và vì sao invalidate /index.html sau deploy chỉ là bước tùy chọn",
    "Tôi có thể viết bucket policy cho distribution CloudFront mới dùng OAC và cấu hình default root object, custom error response cho một Vue SPA thật"
  ],
  "refs": [
    "aws-cloudfront-oac",
    "aws-cloudfront",
    "aws-s3",
    "aws-s3-bpa",
    "vue-router",
    "mdn-cache-control"
  ],
  "tradeoff": "<p>Custom error response là cách nhanh nhất, cấu hình ngay trong distribution, nhưng che mọi 403 thật. CloudFront Function kiểm soát chính xác hơn và giữ nguyên lỗi thật, đổi lại bạn có thêm một đoạn code cần kiểm thử và giới hạn riêng về tài nguyên của hàm. Về cache, no-cache cho index.html tốn một lượt hỏi gốc mỗi lần, đổi lại người dùng luôn thấy bản mới; cache dài hơn tiết kiệm nhưng làm bản cũ lâu hơn.</p>",
  "alternatives": "<ul><li>Bật static website hosting của S3 và trỏ CloudFront vào endpoint đó: cần bucket công khai và không dùng được OAC, nên không hợp với bucket private.</li><li>Dùng dịch vụ host tĩnh có sẵn tính năng rewrite cho SPA: gọn hơn nếu bạn không cần kiểm soát cấu trúc CloudFront, nhưng phụ thuộc vào nền tảng đó.</li><li>Đặt API lên một đường dẫn riêng như /api/* trong cùng distribution: tách được request động khỏi file tĩnh, để cache và fallback không áp nhầm vào API.</li></ul>",
  "observe": "<p>Theo dõi tỷ lệ 403 ở phía CloudFront và log truy cập, để thấy đường dẫn nào trả 403 và có phải là route của SPA hay không. Dùng curl -I để xem header Cache-Control thật của index.html và của một file hash, xác nhận no-cache và max-age immutable đúng như đã đặt. Sau invalidation, nhớ rằng lỗi có thể được cache: mặc định 10 giây, và nếu đặt Error Caching Minimum TTL = 0 cho S3 origin đã bật cache thì vẫn tối thiểu 1 giây, nên kiểm tra lại sau vài giây thay vì kết luận ngay.</p>",
  "say30": "Vue SPA trên S3 private qua CloudFront và OAC. F5 ở /orders/42 ra 403 vì đường dẫn đó không có object trên S3 và role thiếu ListBucket nên S3 trả 403 thay vì 404. Tôi đặt default root object là index.html cho đường dẫn gốc, còn /orders/42 được xử lý bằng custom error response (đổi 403 thành /index.html với mã 200) hoặc CloudFront Function. Index.html gửi no-cache để luôn hỏi lại origin, file có hash gửi max-age=31536000, immutable, và tôi kiểm tra header bằng curl -I sau deploy.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Tôi host Vue SPA bằng S3 private phía sau CloudFront, đọc qua OAC với bucket policy có AWS:SourceArn trỏ đúng distribution, và giữ Block Public Access bật. F5 ở /orders/42 ra 403 vì Vue Router định nghĩa route đó, còn S3 không có object tương ứng và trả 403 do thiếu quyền s3:ListBucket.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Tôi cấu hình default root object cho đường dẫn gốc /, và xử lý đường dẫn sâu bằng custom error response hoặc CloudFront Function, tùy việc có cần giữ nguyên 403 thật hay không. Về cache, index.html gửi no-cache, file có hash gửi max-age=31536000, immutable.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Sau mỗi deploy tôi kiểm tra header bằng curl -I; invalidate /index.html chỉ là bước tùy chọn, vì nó là điểm vào cố định không đổi tên được. Lỗi có thể được cache vài giây nên kiểm tra lại sau khi sửa.\n(xem Bài L19 và Bài L20)"
}
);
