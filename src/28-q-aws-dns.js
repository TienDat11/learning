var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "G21",
  "group": "G",
  "topic": "Route 53 + ACM + CloudFront: alias ở apex, chứng chỉ us-east-1, TLS kết thúc ở đâu",
  "prio": "P1",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "CNAME không được đặt ở apex (tên gốc của domain, như example.com) à? Vậy bản ghi www dùng CNAME có được không?",
      "a": "Được. CNAME không được tạo ở apex, nhưng www là subdomain (tên con) nên CNAME trỏ tới một tên khác vẫn hợp lệ. Khi trỏ apex tới CloudFront thì phải dùng alias. Alias là bản ghi riêng của Route 53, trả thẳng địa chỉ hiện tại của tài nguyên đích. CNAME chỉ trỏ sang một tên khác và cần thêm một lượt phân giải."
    },
    {
      "q": "Chứng chỉ ở ap-southeast-1 là đủ rồi, sao CloudFront không cho chọn?",
      "a": "Vì chứng chỉ ACM là tài nguyên theo Region. Tài liệu ACM ghi rằng để dùng chứng chỉ với CloudFront, bạn phải yêu cầu hoặc import chứng chỉ ở US East (N. Virginia), tức us-east-1. Chứng chỉ ở Singapore vẫn dùng được cho ALB cùng Region, nhưng nó không hiện ở bước chọn chứng chỉ của CloudFront. Cách xử lý là yêu cầu một chứng chỉ mới ở us-east-1 rồi gắn vào distribution."
    }
  ],
  "incident": "<p>Tình huống giả định: Đội frontend đưa một SPA lên CloudFront và đổi domain app.example.com sang đó. Sau khi đổi, phần lớn người dùng thấy bản mới, nhưng một nhóm vẫn thấy giao diện cũ hàng giờ.</p><p>Khi tạo HTTPS cho distribution, đội chỉ tìm thấy một chứng chỉ ở ap-southeast-1, nơi đang chạy ALB. Chứng chỉ đó không chọn được trong CloudFront.</p>",
  "askFirst": [
    "Vì sao chứng chỉ cho CloudFront phải ở us-east-1, còn chứng chỉ cho ALB lại phải cùng Region với ALB, và hai ràng buộc này khác nhau ở điểm nào? → Giải mã: CloudFront là dịch vụ toàn cầu, chứng chỉ đặt tại us-east-1; ALB sống trong Region cụ thể nên chứng chỉ cùng Region; mỗi dịch vụ có ràng buộc địa lý riêng (Bài L20, Bài L23).",
    "Khi đổi domain một SPA, bản cũ còn lại do DNS, cache của CloudFront hay cache của trình duyệt, và bạn kiểm tra theo thứ tự nào? → Giải mã: Cả ba tầng, kiểm theo thứ tự trình duyệt rồi CloudFront rồi DNS, vì mỗi tầng có TTL riêng (Bài L20)."
  ],
  "predict": {
    "q": "Bạn đoán: index.html được CloudFront cache 24 giờ vì không có cache policy và origin không gửi Cache-Control hay Expires. Bạn invalidate đường dẫn /index.html, và người dùng lập tức thấy bản mới. Đúng hay sai?",
    "a": "<p><strong>Sai.</strong> Invalidation chỉ xóa bản trong edge cache. Lần truy cập sau mới lấy từ origin.</p><p>Trình duyệt và proxy công ty vẫn có thể giữ bản cũ đến khi hết hạn của chúng. Cách chắc hơn là đặt tên file có hash cho JS và CSS, để mỗi lần build tạo tên mới. Còn index.html giữ thời gian cache ngắn.</p>"
  },
  "anchor": "Chứng chỉ dùng cho CloudFront phải nằm ở us-east-1 vì đó là ràng buộc của CloudFront; chứng chỉ dùng cho ALB phải cùng Region với ALB vì đó là ràng buộc của tài nguyên theo Region.",
  "q": "Bạn đưa một SPA lên CloudFront với domain riêng. Bạn cấu hình Route 53 và ACM như thế nào? Vì sao bản ghi ở apex (tên gốc, như example.com) phải dùng alias, và vì sao chứng chỉ cho CloudFront phải ở Region us-east-1?",
  "oral": "Tôi tách ba phần: DNS, chứng chỉ, và cache. Thứ nhất, Route 53 giữ hosted zone. Apex example.com không dùng được CNAME, nên tôi tạo alias A và AAAA trỏ tới distribution của CloudFront. Alias không cho đặt TTL, vì Route 53 tự quyết định giá trị này. Thứ hai, ACM cấp chứng chỉ bằng xác thực DNS. ACM đưa một CNAME xác thực, tôi thêm vào hosted zone, và ACM tự gia hạn chừng nào bản ghi đó còn. Thứ ba, Region: chứng chỉ cho CloudFront phải ở us-east-1, còn chứng chỉ cho ALB phải ở đúng Region của ALB. Với SPA đổi domain, bản cũ thường còn vì cache. Nếu không có cache policy và origin không gửi Cache-Control, CloudFront giữ 24 giờ, và trình duyệt cũng giữ. Vì vậy tôi đặt tên file có hash cho JS và CSS, giữ index.html có thời gian cache ngắn, rồi invalidate khi cần.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Route 53</strong>: dịch vụ DNS của AWS, phân giải tên domain thành địa chỉ IP. Giống danh bạ: tra tên ra số.</li><li><strong>Hosted zone</strong>: vùng chứa toàn bộ bản ghi DNS của một domain, giống một file zone trên BIND.</li><li><strong>Alias record</strong>: bản ghi riêng của Route 53 trỏ tới tài nguyên AWS và được phép đặt ở apex. Giống một biệt danh chỉ hiểu trong hệ thống AWS.</li><li><strong>TTL</strong>: số giây resolver nhớ kết quả. Giống hạn dùng ghi trên hộp sữa.</li><li><strong>ACM</strong>: dịch vụ cấp và tự gia hạn chứng chỉ TLS cho dịch vụ AWS. Giống tự cấu hình chứng chỉ cho Nginx, nhưng AWS lo phần gia hạn.</li><li><strong>CloudFront</strong>: CDN của AWS, giữ bản sao nội dung ở các edge. Giống Redis đặt trước Django, nhưng rải khắp thế giới.</li><li><strong>ALB</strong>: bộ cân bằng tải tầng ứng dụng, nhận HTTP và HTTPS rồi chia request tới các target. Giống nginx đứng trước nhiều container Docker.</li></ul><p><strong>Cơ chế.</strong> Ở apex, bạn tạo alias A và AAAA trỏ tới distribution. Khi có truy vấn khớp tên và loại bản ghi, Route 53 trả về địa chỉ tương ứng của tài nguyên đích.</p><p>Route 53 không cho tạo CNAME tại apex. Alias chỉ trỏ được tới các tài nguyên AWS được hỗ trợ, hoặc tới một bản ghi khác trong cùng hosted zone. Alias không tính phí truy vấn khi trỏ tới CloudFront hoặc tài nguyên AWS khác.</p><p><strong>Vì sao apex không dùng CNAME.</strong> Tên apex luôn có các bản ghi như NS và SOA. Chuẩn DNS không cho CNAME cùng tồn tại với các bản ghi khác ở một tên. Alias là phần mở rộng riêng của Route 53 để giải quyết chỗ này.</p><p><strong>Chứng chỉ.</strong> Với xác thực DNS, ACM đưa một CNAME xác thực. Bạn thêm nó vào hosted zone. Nếu ACM không xác thực được trong 72 giờ, trạng thái thành Validation timed out.</p><p>Để dùng với CloudFront, chứng chỉ phải được yêu cầu hoặc import ở us-east-1, và CloudFront phân phối chứng chỉ đó tới mọi vị trí của distribution. Chứng chỉ ACM là tài nguyên theo Region và không sao chép giữa các Region. Nhưng CNAME xác thực dùng được cho mọi Region, nên bạn có thể yêu cầu lại chứng chỉ ở Region khác mà không phải xác thực lần nữa, nếu bản ghi vẫn còn.</p><p>Với ALB, tài liệu ACM ghi rằng để dùng chứng chỉ với Elastic Load Balancing ở nhiều Region, bạn phải yêu cầu chứng chỉ ở từng Region đó. Tài liệu CloudFront có một ngoại lệ riêng: khi origin là load balancer và bạn cần HTTPS từ CloudFront tới origin, chứng chỉ có thể ở Region bất kỳ. Còn chứng chỉ gắn trên listener HTTPS của ALB thì vẫn phải nằm cùng Region với ALB.</p><p><strong>TLS kết thúc ở đâu.</strong> Trình duyệt mở HTTPS tới CloudFront, nên TLS kết thúc ở edge gần người dùng. Với origin là ALB, CloudFront mở một kết nối HTTPS riêng tới ALB. ALB dùng chứng chỉ trên HTTPS listener để kết thúc TLS và giải mã request trước khi gửi tới target.</p><p><strong>TTL và bản cũ.</strong> Đổi bản ghi DNS không xóa bản cũ khỏi resolver ngay, vì mỗi bản ghi còn TTL. Lớp cache của CloudFront mặc định giữ 24 giờ nếu bạn không dùng cache policy và origin không gửi Cache-Control hoặc Expires.</p><p>Invalidation chỉ xóa khỏi edge. Trình duyệt và proxy vẫn có thể giữ bản cũ. Đặt tên file có hash cho JS và CSS là cách giảm sự cố này, vì file đổi tên thì không dính cache cũ.</p><p><strong>Khi điều kiện đổi.</strong> Nếu domain nằm ở nhà cung cấp DNS khác, alias không dùng được vì alias chỉ có trong Route 53. Khi đó apex không có CNAME, nên bạn phải chuyển DNS về Route 53 hoặc dùng tính năng tương đương của nhà cung cấp, sau khi kiểm tra tài liệu của họ. Nếu origin đổi từ ALB sang bucket S3, chứng chỉ ALB không còn liên quan, nhưng chứng chỉ ở us-east-1 vẫn bắt buộc cho phía người dùng.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L20, Bài L23.</p>",
  "code": "import boto3\n\n# ✅ Cách làm chuẩn: ACM cho CloudFront bắt buộc phải yêu cầu ở us-east-1\nacm = boto3.client(\"acm\", region_name=\"us-east-1\")\ncert_arn = acm.request_certificate(\n    DomainName=\"example.com\",\n    SubjectAlternativeNames=[\"app.example.com\"],\n    ValidationMethod=\"DNS\",\n)[\"CertificateArn\"]\n\n# Alias A ở apex tới distribution, vì apex không dùng được CNAME\n# HostedZoneId bên dưới là hosted zone của example.com; trong AliasTarget, HostedZoneId của CloudFront luôn là Z2FDTNDATAQYW2\nroute53 = boto3.client(\"route53\")\nroute53.change_resource_record_sets(\n    HostedZoneId=\"Z_YOUR_HOSTED_ZONE\",\n    ChangeBatch={\"Changes\": [{\n        \"Action\": \"UPSERT\",\n        \"ResourceRecordSet\": {\n            \"Name\": \"example.com\",\n            \"Type\": \"A\",\n            \"AliasTarget\": {\n                \"HostedZoneId\": \"Z2FDTNDATAQYW2\",\n                \"DNSName\": \"d111111abcdef8.cloudfront.net\",\n                \"EvaluateTargetHealth\": False,\n            },\n        },\n    }]},\n)",
  "expected": null,
  "followups": [
    {
      "q": "Nếu domain đang dùng nhà cung cấp DNS khác thì sao?",
      "a": "Alias record chỉ tồn tại trong hosted zone của Route 53, nên không thể tạo alias ở nhà cung cấp khác. Khi đó apex không đặt được CNAME, và bạn có hai lựa chọn. Một là chuyển DNS của domain về Route 53 bằng cách đổi name server ở registrar. Hai là dùng tính năng tương đương của nhà cung cấp hiện tại, sau khi đọc tài liệu của họ. Xác thực ACM bằng DNS vẫn làm được, chỉ cần thêm CNAME xác thực bằng tay."
    },
    {
      "q": "Chứng chỉ ở us-east-1 đã có, nhưng ALB ở ap-southeast-1 vẫn cần HTTPS riêng thì làm sao?",
      "a": "Yêu cầu một chứng chỉ thứ hai ở ap-southeast-1 cho domain đó, vì chứng chỉ ACM là tài nguyên theo Region và không sao chép giữa các Region. CNAME xác thực có thể dùng lại ở Region khác, nên không phải xác thực lại nếu bản ghi xác thực vẫn còn trong hosted zone. Chứng chỉ ở us-east-1 không thay được chứng chỉ của ALB ở listener HTTPS. Chứng chỉ gắn trên listener HTTPS của ALB vẫn phải nằm cùng Region với ALB."
    },
    {
      "q": "Sau khi đổi, làm sao biết người dùng nào còn thấy bản cũ và vì sao bản cũ còn lâu?",
      "a": "Kiểm tra header Cache-Control và Age của index.html bằng curl -I ở hai thời điểm sau khi deploy, để xem CloudFront có còn trả bản cũ không. Access log của CloudFront ghi tên file, nên có thể thấy file nào còn được phục vụ. Nếu bản cũ vẫn còn sau khi edge đã đúng, nguyên nhân thường là cache của trình duyệt hoặc proxy, vì invalidation không xóa được các lớp đó. Vì vậy cần đặt thời gian cache ngắn cho index.html và dùng tên file có hash cho tài nguyên tĩnh."
    }
  ],
  "pitfalls": [
    "Tạo chứng chỉ ở Region gần người dùng như ap-southeast-1 rồi tưởng dùng được cho CloudFront; CloudFront chỉ nhận chứng chỉ ở us-east-1",
    "Đặt CNAME tại apex rồi gặp lỗi, vì apex phải dùng alias",
    "Đổi DNS xong vẫn thấy bản cũ rồi chỉ đổi TTL, bỏ qua cache của CloudFront và cache của trình duyệt"
  ],
  "selfcheck": [
    "Tôi chưa chắc khi nào CloudFront trả bản cũ từ edge và khi nào trình duyệt tự giữ bản cũ, khi cả hai đều có TTL hoặc max-age",
    "Tôi giải thích được bằng ví dụ vì sao example.com dùng alias được còn CNAME thì không, còn www thì CNAME vẫn hợp lệ",
    "Tôi có thể làm trong một buổi: yêu cầu chứng chỉ ở us-east-1 bằng ACM với xác thực DNS, tạo alias A và AAAA trỏ domain tới distribution, và kiểm tra chứng chỉ có bao phủ alternate domain name (tên miền thay thế) đó"
  ],
  "refs": [
    "aws-route53",
    "aws-acm",
    "aws-acm-regions",
    "aws-cloudfront",
    "aws-elb"
  ],
  "tradeoff": "<p>Alias ở apex tiện và không tính phí truy vấn tới CloudFront. Đổi lại, bạn bị gắn với Route 53 và không tự đặt được TTL.</p><p>Chứng chỉ theo Region làm tăng số lần yêu cầu và xác thực khi có nhiều Region. Đặt tên file có hash thêm một bước build, nhưng đổi lại giảm sự cố cache cũ hơn nhiều so với chỉ dựa vào invalidation.</p>",
  "alternatives": "<ul><li>Chuyển hướng apex sang www: vẫn cần bản ghi A hoặc AAAA (dạng alias) ở apex trỏ tới một máy chủ làm redirect, ví dụ S3 website endpoint hoặc CloudFront. Apex không dùng được CNAME, nên không tránh được bản ghi địa chỉ đó. www vẫn có thể dùng CNAME vì là subdomain.</li><li>Trỏ alias tới ALB thay vì CloudFront khi chỉ cần API và không cần cache ở edge.</li><li>Import chứng chỉ bên ngoài vào ACM: bạn phải tự theo dõi ngày hết hạn và gia hạn.</li></ul>",
  "observe": "<p>Theo dõi trạng thái chứng chỉ trong ACM (Issued, Pending validation, Validation timed out). Liệt kê bản ghi bằng lệnh list-resource-record-sets của AWS CLI.</p><p>Kiểm tra header của index.html bằng curl -I ở hai thời điểm sau khi deploy. Với CloudFront, access log ghi tên file, nên bạn biết file nào còn được phục vụ bản cũ.</p>",
  "say30": "Tôi dùng alias của Route 53 ở apex trỏ tới CloudFront, vì apex không dùng được CNAME. Chứng chỉ cho CloudFront phải ở us-east-1, còn chứng chỉ cho ALB phải cùng Region với ALB. Bản cũ còn lâu thường do cache của CloudFront và trình duyệt, không chỉ do DNS.",
  "say90": "Khi chuyển domain một SPA sang CloudFront, tôi yêu cầu chứng chỉ ACM ở us-east-1 và xác thực bằng CNAME trong hosted zone của Route 53. Ở apex, tôi dùng alias A và AAAA, vì apex không dùng được CNAME. Chứng chỉ ở ap-southeast-1 không dùng được cho CloudFront, vì CloudFront chỉ nhận chứng chỉ ở us-east-1. Chứng chỉ ở đó chỉ phục vụ ALB cùng Region. Với bản cũ, tôi đặt tên file có hash cho JS và CSS, giữ index.html có thời gian cache ngắn, rồi kiểm tra cache của CloudFront và trình duyệt trước khi kết luận."
}
);
