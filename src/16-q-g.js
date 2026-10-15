var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "G01",
  "group": "G",
  "topic": "Region và Availability Zone, mô hình trách nhiệm chung",
  "prio": "P0",
  "level": "L1",
  "type": "concept",
  "attacks": [
    {
      "q": "Vì sao triển khai trong một Availability Zone là chưa đủ để chịu lỗi?",
      "a": "Một AZ vẫn nằm trong cùng một Region, nên sự cố cấp vùng như mất điện diện rộng, đứt cáp quang hay thiên tai sẽ làm hỏng mọi AZ cùng lúc. Các dịch vụ toàn cầu hoặc thành phần chỉ tồn tại ở cấp Region cũng là điểm hỏng duy nhất, dù bạn có nhiều AZ. Muốn chịu được sự cố cấp vùng thì phải có hiện diện ở nhiều Region, và khi đó bạn phải giải quyết đồng bộ dữ liệu cùng mức mất dữ liệu chấp nhận được."
    },
    {
      "q": "Trong mô hình trách nhiệm chung, phần nào là của nhà cung cấp và phần nào là của bạn?",
      "a": "AWS chịu trách nhiệm hạ tầng vật lý, mạng, máy chủ và tính sẵn sàng của dịch vụ nền tảng. Bạn chịu trách nhiệm cho những gì bạn cấu hình và đặt lên trên: IAM, mã hóa, sao lưu, security group và cách dữ liệu được xử lý. Ranh giới này dịch chuyển theo mức độ quản lý của dịch vụ, nhưng bạn không bao giờ hết trách nhiệm về dữ liệu và danh tính. Hiểu sai ranh giới này là nguyên nhân của phần lớn sự cố bảo mật trên đám mây, ví dụ bucket S3 bị mở public vì tin rằng AWS đã chặn sẵn."
    }
  ],
  "incident": "<p>Tình huống giả định: web production ở Region Singapore chạy <strong>hai EC2 cùng một Availability Zone</strong>. Đêm đó AZ mất điện, cả hai instance tắt cùng lúc và web sập 40 phút dù kiến trúc được cho là đã dự phòng.</p><p>Không có instance nào ở AZ thứ hai nên ALB không có target khỏe để chuyển lưu lượng sang. Đội vận hành chỉ phát hiện khi kiểm tra kỹ rằng hai máy “dự phòng” nằm chung một trung tâm dữ liệu.</p>",
  "askFirst": [
    "Hai máy chủ trong cùng một Availability Zone có phải dự phòng thật không? → Giải mã: Không; cùng AZ thì nguồn điện và mạng cùng hỏng, hai máy tắt cùng lúc, đó vẫn là một điểm hỏng duy nhất (Bài L01).",
    "Phần nào của mô hình trách nhiệm chung thuộc về phía bạn? → Giải mã: AWS chịu hạ tầng; bạn chịu dữ liệu, IAM, mã hóa, security group và sao lưu — phần trên đám mây (Bài L22)."
  ],
  "predict": {
    "q": "Bạn đoán web thay đổi thế nào nếu hai EC2 nằm ở hai AZ khác nhau trong cùng Region?",
    "a": "<p><strong>Một AZ mất điện thì instance ở AZ còn lại vẫn phục vụ.</strong> ALB ngừng gửi lưu lượng tới target không khỏe và chuyển sang AZ kia, không cần đổi Region.</p><p>Hệ thống chỉ mất một phần năng lực trong lúc health check phát hiện lỗi, không sập toàn bộ.</p>"
  },
  "anchor": "Dự phòng đa máy mà không trải qua nhiều Availability Zone = một sự cố nguồn điện hạ cả hai máy cùng lúc.",
  "q": "Hãy phân biệt Region với Availability Zone và cho biết phía khách hàng chịu trách nhiệm gì trong mô hình trách nhiệm chung?",
  "oral": "Region là một khu vực địa lý độc lập, còn Availability Zone là một hoặc nhiều trung tâm dữ liệu có nguồn điện và mạng riêng nằm trong Region đó. Khác biệt quan trọng là sự cố điện hay cháy nổ thường chỉ ảnh hưởng một AZ, còn sự cố địa lý diện rộng mới ảnh hưởng cả Region. Vì vậy bạn chọn Region gần người dùng để giảm độ trễ và đáp ứng yêu cầu lưu trữ trong lãnh thổ, rồi rải tài nguyên qua nhiều AZ để một AZ sập không kéo cả hệ thống xuống. Trong mô hình trách nhiệm chung, AWS lo bảo mật hạ tầng như phần cứng và lớp ảo hóa, còn bạn lo bảo mật trong đám mây gồm dữ liệu, IAM và cấu hình. Thực tế, bạn phải tự bật mã hóa, sao lưu và khóa quyền truy cập, vì AWS không làm thay bạn.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Region</strong>: vùng địa lý lớn và độc lập của AWS, ví dụ Singapore, gồm nhiều AZ; giống một tỉnh có nhiều toà nhà tách biệt.</li><li><strong>Availability Zone (AZ)</strong>: một hoặc nhiều trung tâm dữ liệu độc lập về điện và mạng trong một Region; giống hai phòng máy đặt ở hai toà nhà khác nhau.</li><li><strong>Mô hình trách nhiệm chung</strong>: AWS lo hạ tầng vật lý, bạn lo dữ liệu, quyền truy cập và cấu hình; giống Docker, nền tảng lo host còn bạn lo image và biến môi trường.</li><li><strong>Điểm hỏng duy nhất</strong> (single point of failure): thành phần mà nếu hỏng thì cả hệ thống sập; hai máy cùng một AZ là một điểm như vậy.</li><li><strong>Multi-AZ</strong>: đặt tài nguyên ở ít nhất hai AZ để một AZ sập thì bản còn lại vẫn phục vụ.</li></ul><p><strong>Region và AZ</strong> là hai cấp cô lập khác nhau. Region là khu vực địa lý độc lập gồm nhiều AZ. Mỗi AZ là một hoặc nhiều trung tâm dữ liệu có nguồn điện và mạng riêng, nối với nhau bằng mạng nội vùng tốc độ cao.</p><p><strong>Vì sao phải rải qua nhiều AZ.</strong> Một AZ có thể mất điện, cháy hoặc gặp sự cố mạng trong khi các AZ khác vẫn chạy. ALB chỉ chuyển lưu lượng tới target khỏe, nên hai EC2 ở hai AZ khác nhau giúp hệ thống sống sót khi một AZ sập.</p><p><strong>Mô hình trách nhiệm chung</strong> chia ranh giới rõ ràng. AWS chịu trách nhiệm bảo mật của đám mây: trung tâm dữ liệu, phần cứng, mạng vật lý và lớp ảo hóa. Bạn chịu trách nhiệm bảo mật trong đám mây: dữ liệu trên S3 hay RDS, phân quyền IAM, cấu hình security group và bản vá hệ điều hành trên EC2.</p><p><strong>Giới hạn của một AZ.</strong> Sự cố cấp Region như mất điện diện rộng hoặc lỗi điều khiển của dịch vụ toàn cầu vẫn làm hỏng mọi AZ cùng lúc. Chỉ khi triển khai nhiều Region bạn mới chịu được sự cố địa lý, và khi đó phải giải quyết sao chép dữ liệu cùng mức mất mát chấp nhận được.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L01, Bài L22.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Vì sao triển khai ở hai AZ trong cùng Region rẻ và đơn giản hơn hai Region?",
      "a": "Hai AZ được nối bằng mạng nội vùng độ trễ thấp nên sao chép dữ liệu nhanh và ít tốn chi phí truyền tải. Hai Region thì đi qua đường truyền xa với độ trễ cao, phát sinh phí truyền dữ liệu ra ngoài và bạn phải tự xử lý xung đột ghi, thứ tự sự kiện cùng chuyển đổi dự phòng giữa hai cụm độc lập. Vì vậy bạn bắt đầu bằng multi-AZ và chỉ lên multi-Region khi yêu cầu chịu thảm họa cấp vùng địa lý."
    },
    {
      "q": "Khách hàng chịu trách nhiệm cụ thể những gì trong mô hình trách nhiệm chung?",
      "a": "Bạn chịu trách nhiệm cho dữ liệu gồm phân loại, mã hóa và sao lưu, cho danh tính gồm ai được truy cập tài nguyên nào qua IAM, và cho cấu hình mạng như security group cùng bản vá hệ điều hành trên EC2. AWS chỉ lo phần cứng, trung tâm dữ liệu và lớp ảo hóa bên dưới. Nếu bạn mở bucket S3 ra công khai nhầm hay commit access key lên Git, đó là lỗi cấu hình phía bạn, không phải lỗi hạ tầng."
    },
    {
      "q": "Khi nào bạn chấp nhận chạy single AZ dù biết rủi ro?",
      "a": "Bạn chấp nhận single AZ cho môi trường dev, bài kiểm thử ngắn hạn hoặc job batch có thể chạy lại, nơi gián đoạn vài giờ không gây thiệt hại. Điều kiện là dữ liệu quan trọng vẫn được sao lưu sang nơi khác và cả đội hiểu rõ rủi ro. Với production có người dùng thật, bạn luôn dùng multi-AZ vì chênh lệch chi phí nhỏ hơn nhiều so với thiệt hại khi sập."
    }
  ],
  "pitfalls": [
    "Nhầm Region với AZ nên đặt hai EC2 trong cùng một AZ rồi tưởng đã an toàn",
    "Nghĩ rằng dùng dịch vụ đám mây thì AWS lo luôn cấu hình quyền và rò rỉ dữ liệu"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được ALB chọn target và chuyển lưu lượng sang AZ còn lại theo cơ chế health check nào",
    "Tôi có thể giải thích bằng ví dụ web chạy hai EC2 ở hai AZ, một AZ mất điện thì AZ còn lại gánh tải",
    "Tôi có thể chọn Region và thiết kế multi-AZ cho một web production nhỏ có yêu cầu lưu dữ liệu trong khu vực"
  ],
  "refs": [
    "aws-vpc",
    "aws-cfn"
  ]
},
{
  "id": "G02",
  "group": "G",
  "topic": "IAM user, role, policy và execution role",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Nếu execution role có quyền <code>s3:*</code> thì có vấn đề gì, khi mọi thứ vẫn chạy?",
      "a": "Nó vẫn chạy, nhưng bạn biến một lỗ hổng nhỏ thành lỗ hổng lớn. Nếu Lambda bị chiếm qua lỗ hổng trong thư viện, kẻ tấn công có toàn quyền s3:* trên mọi bucket tài khoản truy cập được, gồm đọc, ghi và xóa dữ liệu của mọi khách hàng. Quyền tối thiểu giới hạn thiệt hại đó: role chỉ đọc đúng bucket và prefix nó cần. Cách làm đúng là bắt đầu từ không có quyền rồi thêm dần theo nhu cầu thật."
    },
    {
      "q": "Một Lambda báo AccessDenied. Bạn kiểm tra theo thứ tự nào?",
      "a": "Bốn bước, từ khả năng cao nhất. Một, xác định danh tính thật sự đang gọi: với Lambda gọi S3 thì đó là execution role, không phải người gọi Lambda. Hai, đọc đầy đủ thông báo lỗi vì nó thường nêu action và resource bị từ chối; thiếu s3:ListBucket trên ARN của bucket là nguyên nhân phổ biến. Ba, kiểm tra cả policy gắn vào role lẫn resource policy của bucket, vì một trong hai có thể đang chặn. Bốn, kiểm tra rào cản ngang như permissions boundary, SCP của Organizations và điều kiện trong policy."
    }
  ],
  "incident": "<p>Tình huống giả định: 15 giờ 40, Lambda xử lý ảnh được gắn execution role có quyền <code>s3:*</code> trên mọi bucket vì đội \"cần chạy cho kịp demo\".</p><p>Một lỗi ghép prefix khiến job dọn ảnh cũ gọi <code>DeleteObject</code> trên bucket báo cáo thay vì bucket ảnh. <strong>Không có lỗi quyền nào xuất hiện</strong>, vì role được phép làm việc đó, và 3.000 file báo cáo biến mất.</p><p>Khôi phục từ bản sao lưu mất bốn tiếng, và đội báo cáo không xuất được số cuối ngày.</p>",
  "askFirst": [
    "Vì sao quyền rộng lại làm sự cố này thành thảm họa? → Giải mã: Execution role giữ quyền thì mọi thứ chạy trong Lambda đều có quyền đó; lộ secret là lộ luôn sức mạnh, nên giới hạn tối thiểu (Bài L02).",
    "Execution role khác IAM user ở điểm nào? → Giải mã: Role không có secret cố định, các dịch vụ đảm nhận qua AssumeRole rồi nhận chứng chỉ tạm tự hết hạn; user có mật khẩu hay key không xoay vòng tự động (Bài L02)."
  ],
  "predict": {
    "q": "Bạn đoán Lambda xử lý ảnh cần execution role với quyền gì?",
    "a": "<p><strong>Chỉ ba nhóm quyền:</strong> <code>s3:GetObject</code> trên bucket đầu vào, <code>s3:PutObject</code> trên bucket đầu ra, và ba action ghi log CloudWatch.</p><p>Mọi action khác bị từ chối ngầm theo mặc định deny. Lỗi ghép prefix khi đó chỉ gây AccessDenied, không xóa được dữ liệu của đội khác.</p>"
  },
  "anchor": "Execution role cấp quyền rộng hơn nhu cầu = một lỗi ghép khóa trong mã biến thành mất dữ liệu thật.",
  "q": "Hãy phân biệt IAM user, IAM role và policy, rồi giải thích execution role của Lambda hoạt động thế nào theo nguyên tắc least privilege?",
  "oral": "Khác biệt cốt lõi là IAM user giữ khóa truy cập dài hạn, còn IAM role chỉ cấp chứng chỉ tạm thời qua STS. Role không có khóa cố định: ai đó hoặc dịch vụ nào đó đảm nhận role để nhận chứng chỉ ngắn hạn. Policy là tài liệu JSON mô tả action nào được làm trên resource nào, và bạn gắn policy vào user hoặc role. Lambda không chạy bằng quyền của người gọi mà bằng execution role gắn vào chính Lambda đó; mọi lệnh gọi S3 hay DynamoDB của Lambda đều dùng quyền đó. Thực tế, bạn chỉ cấp đúng action trên đúng resource, ví dụ chỉ GetItem trên một bảng DynamoDB, và nhớ rằng không có Allow rõ ràng thì mặc định là từ chối.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>IAM</strong> (Identity and Access Management): dịch vụ phân quyền của AWS, quyết định ai được làm gì; giống bảng phân quyền user trong Django admin.</li><li><strong>IAM user</strong>: danh tính cố định cho một người hoặc ứng dụng, có access key dài hạn; giống tài khoản database dùng chung mà phải tự đổi mật khẩu.</li><li><strong>IAM role</strong>: danh tính không có khóa cố định, được đảm nhận tạm thời để lấy chứng chỉ ngắn hạn; giống quyền sudo tạm thời khi bạn cần.</li><li><strong>Policy</strong>: tài liệu JSON liệt kê action được phép trên resource cụ thể; giống một bảng ACL viết bằng JSON.</li><li><strong>Execution role</strong>: role mà Lambda mượn khi chạy để gọi dịch vụ khác; giống tài khoản Postgres mà ứng dụng Django dùng để kết nối.</li><li><strong>Least privilege</strong>: chỉ cấp đúng quyền cần thiết, bắt đầu từ rỗng; giống chỉ cấp SELECT trên một bảng thay vì quyền superuser.</li></ul><p><strong>Job dọn ảnh cũ chạy đúng quyền được cấp.</strong> Lỗi ghép prefix đẩy lệnh xóa sang bucket báo cáo, và không có rào nào chặn lại vì role có quyền trên mọi bucket.</p><p><strong>Trước đây</strong>, ứng dụng chạy trên server và giữ access key dài hạn trong mã, biến môi trường hoặc file cấu hình. Lộ một lần là lộ mãi, và đổi khóa phải deploy lại nên dần không ai xoay khóa.</p><p><strong>Lambda bỏ khóa đó đi.</strong> Lambda không tự giữ chứng chỉ; nền tảng gắn execution role và cấp chứng chỉ tạm thời tự hết hạn, xoay vòng tự động. Không có gì để lộ trong mã hay biến môi trường.</p><p><strong>Cơ chế đánh giá.</strong> IAM role được đảm nhận qua <code>sts:AssumeRole</code>. Policy liệt kê action trên resource; không có Allow rõ ràng thì bị từ chối ngầm, và Deny luôn thắng Allow. Least privilege nghĩa là bắt đầu từ rỗng rồi thêm dần theo log truy cập thật.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L02, Bài L22.</p>",
  "expected": "Policy JSON này KHÔNG tự chạy và không in ra gì — đây là tài liệu quyền hạn, hành vi của nó là kết quả đánh giá policy khi có request, theo tài liệu AWS IAM.\nPhân tích: đây là policy gắn vào danh tính của execution role của Lambda.\nVới một request cụ thể của hàm: s3:GetObject trên arn:aws:s3:::input-bucket/<key> bất kỳ được ALLOW; s3:PutObject trên arn:aws:s3:::output-bucket/<key> được ALLOW; ba hành động logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents được ALLOW.\nMọi hành động khác (ví dụ s3:DeleteObject hay dynamodb:PutItem) không có statement nào nhắc tới nên bị từ chối NGẦM theo luật mặc định deny — policy chỉ mở đúng những gì nó liệt kê.\nHai cái bẫy phải nhớ, mỗi cái một dòng riêng:\nBẫy thứ nhất: Resource arn:aws:s3:::input-bucket/* là địa chỉ ở cấp từng object trong bucket, nên s3:ListBucket sẽ bị từ chối vì ListBucket đòi địa chỉ cấp cả bucket là arn:aws:s3:::input-bucket (không có /*) — lỗi kinh điển khi viết policy S3.\nBẫy thứ hai: Resource arn:aws:logs:*:*:* dùng ký tự đại diện * cho cả region lẫn account nên rộng hơn nguyên tắc chỉ cấp quyền tối thiểu, đúng ra phải thu về log group của chính hàm.\nNếu bất kỳ policy nào khác gắn vào cùng role có một Effect: Deny khớp request đó thì request bị từ chối bất kể các Allow này — câu từ chối tường minh (explicit deny) luôn thắng.\nCuối cùng, policy chỉ có tác dụng khi role có trust policy cho phép lambda.amazonaws.com assume role và role đó được gắn làm execution role của hàm.",
  "followups": [
    {
      "q": "Vì sao service nên dùng role thay vì nhúng access key của user vào mã nguồn?",
      "a": "Access key của user tồn tại lâu dài, nên một khi lộ ra ngoài kẻ xấu dùng được mãi cho tới khi bạn phát hiện và xoay vòng. Chứng chỉ STS từ role tự hết hạn và nền tảng tự xoay vòng, nên không có gì để lộ trong repo hay file cấu hình. Role còn cho phép thu hồi quyền tập trung bằng cách sửa policy một chỗ, thay vì đi tìm mọi nơi đang nhúng khóa. Quy tắc chuẩn: không bao giờ nhúng access key dài hạn vào mã hay file cấu hình."
    },
    {
      "q": "Policy đánh giá quyền thế nào khi có cả Allow và Deny?",
      "a": "Mặc định mọi action bị từ chối, và Allow chỉ mở ra từng quyền cụ thể. Nếu có bất kỳ statement Deny nào khớp request, request bị từ chối bất kể có bao nhiêu Allow khác. Nhờ vậy bạn dùng Deny để chặn thao tác nguy hiểm như xóa bucket hay sửa bucket policy, ngay cả khi ai đó vô tình cấp quyền rộng ở chỗ khác. Khi gỡ lỗi AccessDenied, bạn kiểm tra Deny trước rồi mới xem đã có Allow phù hợp chưa."
    },
    {
      "q": "Bạn thu hẹp một execution role đang có quyền rộng ra sao mà không làm sập production?",
      "a": "Bạn bật CloudTrail data events hoặc IAM Access Analyzer để quan sát action thật Lambda gọi trong vài ngày, rồi viết policy mới chỉ gồm action và resource đã quan sát. Triển khai ở môi trường staging trước, chạy lại toàn bộ luồng chính gồm cả nhánh lỗi để chắc không thiếu quyền. Cuối cùng áp lên production vào giờ thấp điểm và giữ sẵn bản policy cũ để rollback nếu có AccessDenied bất thường."
    }
  ],
  "pitfalls": [
    "Gắn quyền quản trị đầy đủ cho execution role để chạy nhanh rồi quên thu hẹp khi lên production",
    "Nhầm quyền của người gọi với quyền của Lambda, tưởng người gọi có quyền thì Lambda tự có quyền"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được cơ chế AssumeRole cấp chứng chỉ STS tạm thời và xoay vòng thế nào",
    "Tôi có thể giải thích bằng ví dụ Lambda xử lý ảnh chỉ đọc một bucket và ghi một bucket theo policy mẫu",
    "Tôi có thể viết policy least privilege cho một Lambda mới và rà soát quyền dư thừa của Lambda cũ"
  ],
  "refs": [
    "aws-iam",
    "aws-lambda-permissions"
  ]
},
{
  "id": "G03",
  "group": "G",
  "topic": "Lambda handler, event, context, cold start và giới hạn",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Handler của bạn ném lỗi ở dòng đầu tiên. Với invocation bất đồng bộ, khách hàng có biết không?",
      "a": "Không. Với invocation bất đồng bộ, bên gọi chỉ nhận xác nhận rằng event đã vào hàng đợi nội bộ của Lambda, không nhận kết quả xử lý. Lỗi chỉ đi vào CloudWatch Logs và metric Errors, và nếu bạn cấu hình thì vào on-failure destination hoặc DLQ. Hệ quả là một Lambda async lỗi 100% vẫn trông như thành công từ phía người gọi. Thực tế, bạn phải đặt alarm trên metric Errors và độ sâu DLQ, nếu không sự cố chỉ lộ ra khi người dùng cuối phàn nàn."
    },
    {
      "q": "Vì sao đặt client ở cấp module lại có thể gây lỗi khó tìm?",
      "a": "Lỗi này nằm ở việc tái dùng môi trường. Client được tạo ở pha khởi tạo, và kết nối bên dưới có thể đã bị phía server đóng trong lúc môi trường nằm chờ. Lần gọi đầu trên môi trường tái dùng thất bại vì kết nối đã chết, lần gọi sau thì thành công, nên triệu chứng là lỗi thoáng qua và không tái hiện được. Cách xử lý là bắt lỗi kết nối và dựng lại client khi cần, không phải dựng client mới ở mọi lần gọi vì sẽ mất lợi ích tái dùng."
    }
  ],
  "incident": "<p>Tình huống giả định: 8 giờ sáng, chiến dịch thông báo đẩy 100 người dùng vào cùng lúc. Mỗi môi trường lạnh phải tạo mới, và <strong>handler mở kết nối database và nạp cấu hình ngay trong handler</strong> nên cộng thêm 2,5 giây trước khi xử lý.</p><p>p99 của API nhảy từ 300 mili giây lên 4,2 giây và một số request bị client timeout rồi gửi lại. Timeout 900 giây khiến các môi trường treo vẫn giữ suất concurrency, nên các Lambda khác trong tài khoản bị tiết chế.</p>",
  "askFirst": [
    "Vì sao mỗi môi trường chạy mới lại chậm hơn lần gọi ấm? → Giải mã: Environment mới phải tải gói, khởi runtime, kết nối dịch vụ — toàn bộ bước chuẩn bị; gọi ấm dùng lại chính môi trường đó (Bài L03).",
    "Timeout đặt quá dài gây hại gì ngoài việc chờ lâu? → Giải mã: Một execution treo ăn suất concurrency đến hết giờ, khiến số lệnh chạy sau bị đẩy vào hàng đợi nội bộ; đặt theo thời gian thật cộng biên nhỏ (Bài L03)."
  ],
  "predict": {
    "q": "Bạn đoán p99 thay đổi thế nào nếu chuyển khởi tạo nặng ra ngoài handler?",
    "a": "<p><strong>Khởi tạo ngoài handler chỉ chạy một lần</strong> khi môi trường được dựng, nên các lần gọi ấm dùng lại kết nối và cấu hình đã nạp.</p><p>Cold start vẫn còn, nhưng phần khởi tạo nặng không lặp lại ở mọi request, nên p99 giảm mạnh và số môi trường lạnh trong đợt bùng nổ tốn ít thời gian hơn.</p>"
  },
  "anchor": "Khởi tạo nặng đặt trong handler mà không có reserved concurrency = mỗi đợt bùng nổ trả giá cold start trên từng request.",
  "q": "Hãy giải thích Lambda handler nhận event và context thế nào, cùng với cold start, concurrency, timeout và retry ảnh hưởng ra sao đến thiết kế hàm?",
  "oral": "Event là dữ liệu kích hoạt, còn context là thông tin môi trường chạy, và Lambda truyền cả hai vào handler. Event thay đổi theo nguồn gọi: với API Gateway nó chứa httpMethod, path và body, còn với SQS nó chứa danh sách Records. Context cho bạn tên function, bộ nhớ và get_remaining_time_in_millis để dừng sớm trước khi timeout. Cơ chế quan trọng là cold start: khi chưa có môi trường sẵn, Lambda phải tải mã và khởi tạo runtime, nên bạn giữ gói triển khai gọn và đặt kết nối nặng ngoài handler. Thực tế, bạn đặt timeout vừa đủ, rồi thiết kế concurrency và retry để Lambda chịu được gọi trùng mà không sinh dữ liệu trùng.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Handler</strong>: hàm Python mà Lambda gọi mỗi lần kích hoạt; giống view trong Django nhận request rồi trả response.</li><li><strong>Event</strong>: dữ liệu kích hoạt Lambda, dạng dict; giống request.body hoặc payload của một API.</li><li><strong>Context</strong>: object chứa thông tin môi trường chạy như thời gian còn lại; giống request.META cho biết bối cảnh gọi.</li><li><strong>Cold start</strong>: lần gọi đầu phải dựng môi trường chạy mới nên chậm; giống khởi động Gunicorn worker mới khi chưa có worker nào sẵn sàng.</li><li><strong>Timeout</strong>: thời gian tối đa Lambda được chạy trước khi bị ngắt; giống timeout của requests trong Python.</li><li><strong>Concurrency</strong>: số việc chạy cùng lúc; giống số worker của Gunicorn quyết định bao nhiêu request xử lý song song.</li><li><strong>Reserved concurrency</strong>: suất riêng giữ cho một Lambda để Lambda khác không chiếm hết.</li></ul><p><strong>Chiến dịch làm lộ điểm yếu.</strong> Trăm người dùng gọi cùng lúc, mỗi môi trường mới trả thêm 2,5 giây khởi tạo, p99 nhảy từ 300 ms lên 4,2 giây. Timeout 900 giây khiến môi trường treo giữ suất concurrency và bóp các Lambda khác trong tài khoản.</p><p><strong>Vòng đời môi trường.</strong> Lambda tái dùng một execution environment cho nhiều lần gọi ấm, nên code ngoài handler chạy một lần. Khi chưa có môi trường sẵn sàng, Lambda phải tải mã, khởi tạo runtime rồi mới gọi handler; đó là cold start, và bạn không kiểm soát được thời điểm nó xảy ra.</p><p><strong>Cách giảm chi phí cold start.</strong> Đặt kết nối database và tải cấu hình ngoài handler để chỉ trả giá một lần cho mỗi môi trường. Gói triển khai nên gọn, vì Lambda tải toàn bộ gói khi khởi tạo.</p><p><strong>Timeout và concurrency.</strong> Đặt timeout theo thời gian xử lý thật cộng biên nhỏ, không dùng làm nơi che lỗi treo. Với nhiều Lambda trong cùng tài khoản, reserved concurrency giữ suất riêng cho Lambda quan trọng, còn trần thấp cho Lambda dễ bùng nổ.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L03, Bài L08.</p>",
  "code": "import json\n\n# ✅ Cách làm chuẩn: khởi tạo client nặng ở cấp module để các lần gọi ấm dùng lại\n_heavy_client = None\n\ndef _get_client():\n    global _heavy_client\n    if _heavy_client is None:\n        _heavy_client = build_client()\n    return _heavy_client\n\ndef handler(event, context):\n    # Kiểm tra thời gian còn lại để trả 503 có chủ đích, không bị cắt ngang giữa chừng\n    ms_left = context.get_remaining_time_in_millis()\n    if ms_left < 5000:\n        return {\"statusCode\": 503, \"body\": json.dumps({\"retry\": True})}\n    client = _get_client()\n    # event.get trả None nếu thiếu key, nên cần kiểm tra order_id trước khi gọi client.process\n    order_id = event.get(\"order_id\")\n    result = client.process(order_id)\n    return {\"statusCode\": 200, \"body\": json.dumps(result)}",
  "expected": "Handler không in ra gì; kết quả quan sát được là giá trị trả về của handler, theo tài liệu AWS Lambda (build_client và client.process là hàm minh họa).\nPhân tích: chữ ký handler(event, context) là contract cố định. Lambda truyền event là dict mô tả lần kích hoạt (với API Gateway proxy là dict có httpMethod, path, headers, body; với SQS là dict có Records là list), còn context là object môi trường chạy.\ncontext.get_remaining_time_in_millis() trả về số mili giây còn lại trước khi Lambda hết timeout, nên if ms_left < 5000 chủ động trả 503 kèm cờ retry thay vì bị cắt ngang giữa chừng.\nevent.get(\"order_id\") trả None nếu thiếu key chứ không ném KeyError. Đây là cố ý, nhưng nghĩa là client.process(None) vẫn được gọi nếu bên gọi không truyền order_id.\n_heavy_client khai báo ở cấp module và chỉ khởi tạo một lần: execution environment được tái dùng cho lần gọi ấm nên client nặng dùng lại được, còn cold start phải trả giá khởi tạo. Không được coi state trong bộ nhớ là bền vững, vì môi trường có thể bị thu hồi bất kỳ lúc nào.\nContract lỗi: nếu handler raise exception, invocation bị đánh dấu thất bại. Với gọi bất đồng bộ, Lambda tự retry theo cấu hình rồi mới đẩy event sang on-failure destination hoặc DLQ; với gọi đồng bộ, lỗi trả thẳng cho bên gọi.\nGiá trị trả về là dict dạng API Gateway proxy (statusCode và body), nên body phải là string, và json.dumps làm việc đó.",
  "followups": [
    {
      "q": "Vì sao khởi tạo nặng nên đặt ngoài handler thay vì trong handler?",
      "a": "Mã ngoài handler chỉ chạy một lần khi môi trường được dựng, còn mã trong handler chạy lại ở mọi lần gọi. Đặt kết nối database hay tải mô hình ra ngoài giúp các lần gọi ấm tái dùng và phản hồi nhanh hơn nhiều. Kết hợp biến global có kiểm tra None, lần đầu mới khởi tạo còn các lần sau dùng lại. Lưu ý môi trường có thể bị thu hồi bất cứ lúc nào, nên bạn không coi trạng thái trong bộ nhớ là bền."
    },
    {
      "q": "Timeout đặt quá dài gây hại gì ngoài việc chờ lâu?",
      "a": "Timeout dài khiến Lambda treo chiếm concurrency tới khi hết giờ, vừa tốn chi phí vừa có thể làm cạn suất của các Lambda khác. Với nguồn gọi async, timeout dài còn làm chậm vòng retry vì lần thử lại chỉ bắt đầu sau khi lần trước thất bại hẳn. Bạn đặt timeout theo thời gian xử lý thực tế cộng một biên nhỏ, và dùng get_remaining_time_in_millis để dừng sớm có kiểm soát."
    },
    {
      "q": "Concurrency của một Lambda ảnh hưởng tới các Lambda khác trong cùng tài khoản ra sao?",
      "a": "Mặc định mọi Lambda trong một Region chia chung hạn mức concurrency của tài khoản, nên một Lambda bị gọi ồ ạt có thể chiếm hết suất và bóp nghẹt các Lambda khác. Bạn đặt reserved concurrency cho Lambda quan trọng để luôn giữ suất riêng, và đặt reserved concurrency với trần thấp cho Lambda dễ bùng nổ để nó không lan sang phần còn lại. Khi thiết kế nhiều Lambda, bạn phân bổ suất như phân bổ ngân sách thay vì để mặc định."
    }
  ],
  "pitfalls": [
    "Khởi tạo kết nối và tải dữ liệu nặng trong handler khiến mọi lần gọi đều chậm",
    "Đặt timeout rất dài để che lỗi treo, gây tốn chi phí và cạn concurrency khi sự cố"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được vòng đời execution environment từ khởi tạo đến thu hồi và khi nào cold start xảy ra",
    "Tôi có thể giải thích bằng ví dụ chuyển khởi tạo ra ngoài handler và đọc thời gian còn lại từ context",
    "Tôi có thể chọn timeout và reserved concurrency hợp lý cho một Lambda xử lý đơn hàng mới dựa trên thời gian xử lý đo được"
  ],
  "refs": [
    "aws-lambda-best",
    "aws-lambda-permissions"
  ]
},
{
  "id": "G04",
  "group": "G",
  "topic": "Phân biệt quyền gọi Lambda và quyền của Lambda",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Vì sao phải tách quyền gọi Lambda khỏi quyền của Lambda?",
      "a": "Vì chúng trả lời hai câu hỏi khác nhau và có hai chủ thể khác nhau. Quyền gọi Lambda nằm trong resource-based policy gắn trên tài nguyên Lambda và trả lời \"ai được phép InvokeFunction\" — thường là API Gateway, một Lambda khác, hoặc một tài khoản. Quyền của Lambda nằm trong execution role và trả lời \"Lambda này được phép làm gì với dịch vụ khác\". Trộn hai thứ là lỗi thiết kế phổ biến: cấp cho người gọi quyền của Lambda, hoặc ngược lại. Hệ quả là hoặc người gọi có thừa quyền, hoặc Lambda không gọi được dịch vụ dù người gọi có quyền."
    },
    {
      "q": "Một tài khoản khác trong cùng tổ chức muốn gọi Lambda của bạn. Bạn cấu hình gì?",
      "a": "Hai việc ở hai phía. Phía bạn, thêm một resource-based policy trên Lambda cho phép principal của tài khoản kia InvokeFunction, và giới hạn Resource vào đúng ARN của Lambda đó chứ không phải wildcard. Phía họ, thêm một identity-based policy trên role của họ cho phép hành động lambda:InvokeFunction trên cùng ARN. Cả hai đều cần vì một bên cấp quyền ở phía tài nguyên, một bên ở phía danh tính. Nếu họ gọi từ một Lambda của họ, nên dùng điều kiện giới hạn đúng ARN nguồn thay vì cấp cho cả account — cách này thu hẹp phạm vi và tránh việc mọi Lambda trong account kia đều gọi được."
    }
  ],
  "incident": "<p><strong>Không có log = chưa chạy.</strong> 11 giờ 05, endpoint thanh toán mới lên production, mọi request trả 500. Đội mở CloudWatch Logs của Lambda và không thấy một dòng thực thi nào: Lambda chưa chạy lần nào.</p><p><strong>Thiếu quyền gọi trước, thiếu execution role sau.</strong> Route mới chưa có resource-based policy cho phép API Gateway gọi Lambda, request bị từ chối ngay ở lớp gọi. Sau khi bổ sung quyền, endpoint chạy được nhưng sập khi ghi đơn vì execution role thiếu quyền trên bảng đơn hàng của RDS — lần này log có rõ <code>AccessDenied</code>.</p>",
  "askFirst": [
    "Không có log thực thi nói lên điều gì về lớp quyền bị thiếu? → Giải mã: Log dừng ngay bước gọi là thiếu quyền của bên gọi (bổn phận gọi và chính sách nguồn); có log thì mới là việc của execution role (Bài L02).",
    "Vì sao hai lớp quyền này phải cấu hình độc lập? → Giải mã: Bổn phận gọi trả lời ai được phép gọi, execution role trả lời Lambda làm gì khi chạy; mỗi lớp là cơ chế kiểm tra riêng, sửa đúng lớp mới hết (Bài L02)."
  ],
  "predict": {
    "q": "Bạn đoán sự khác biệt giữa hai lỗi trên nằm ở đâu?",
    "a": "<p><strong>Lỗi gọi nằm trước runtime, lỗi execution nằm sau.</strong> Thiếu quyền gọi xảy ra trước khi môi trường Lambda khởi tạo: Lambda chưa chạy nên không có log, không tốn lần invoke nào. Thiếu quyền của Lambda xảy ra sau khi Lambda đã chạy: log dừng đúng thao tác gọi dịch vụ, kèm tên hành động và tài nguyên bị từ chối.</p>"
  },
  "anchor": "Resource-based policy thiếu principal mà chỉ mở execution role = request bị chặn ngoài cửa và Lambda không bao giờ chạy.",
  "q": "Hãy phân biệt quyền được phép gọi một Lambda với quyền mà Lambda có để truy cập tài nguyên, và cho biết thiếu mỗi loại thì lỗi hiện ra thế nào?",
  "oral": "Nguyên nhân nằm ở chỗ đây là hai lớp quyền ngược chiều và bạn phải cấu hình cả hai. Quyền gọi Lambda trả lời ai được phép kích hoạt Lambda, ví dụ API Gateway hay một Lambda khác có gọi được không, và nó do resource-based policy gắn trên Lambda quyết định. Quyền của Lambda trả lời Lambda được làm gì sau khi đã chạy, ví dụ đọc RDS hay ghi S3, và nó do execution role quyết định. Cơ chế phân tách theo thời điểm kiểm tra: thiếu quyền gọi thì request bị từ chối trước khi runtime khởi tạo, Lambda chưa chạy và không sinh log; thiếu quyền của Lambda thì Lambda chạy được nhưng sập đúng thao tác chạm tài nguyên, log ghi rõ hành động và tài nguyên bị từ chối. Bẫy cần tránh: cấp execution role mạnh rồi tưởng quyền gọi tự có — API Gateway vẫn báo AccessDenied dù Lambda đủ quyền bên trong.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Resource-based policy</strong>: chính sách gắn trên Lambda quy định ai được quyền gọi Lambda; giống danh sách IP được phép vào endpoint Django.</li><li><strong>Execution role</strong>: quyền Lambda mượn để gọi dịch vụ khác; giống tài khoản Postgres mà Django dùng để kết nối RDS.</li><li><strong>API Gateway</strong>: nhận request HTTP rồi chuyển cho Lambda; giống Nginx đứng trước Gunicorn.</li><li><strong>Principal</strong>: bên được phép thực hiện hành động, một dịch vụ hoặc một account; giống user đang đăng nhập trong request.</li><li><strong>ARN</strong> (Amazon Resource Name): định danh duy nhất của tài nguyên AWS; giống URL trỏ tới object cụ thể.</li><li><strong>AccessDenied</strong>: lỗi từ AWS khi thiếu quyền; giống 403 Forbidden của Django.</li></ul><p><strong>Không log = chưa chạy.</strong> Endpoint thanh toán mới trả lỗi cấm truy cập, CloudWatch Logs trống vì Lambda chưa chạy lần nào. Route thiếu chính sách cho phép API Gateway gọi Lambda nên request bị chặn ở ngoài.</p><p><strong>Hai lớp, hai thời điểm kiểm tra.</strong> Trước Lambda, API là tiến trình chạy trong mạng của bạn: \"ai được gọi\" và \"tiến trình được làm gì\" là một chuyện, quyết bằng firewall và user trên server. Lambda tách thành hai lớp chính sách độc lập. Resource-based policy trả lời \"cái gì được kích hoạt Lambda này\", kiểm tra trước khi runtime sinh ra, thường kèm điều kiện giới hạn ARN nguồn để chống bị lạm dụng; thiếu thì bên gọi nhận lỗi cấm mà không tốn một lần chạy. Execution role trả lời \"Lambda được làm gì với dịch vụ khác\", kiểm tra khi Lambda chạm S3 hay RDS; thiếu thì log dừng đúng thao tác.</p><p><strong>Cách sửa đúng lớp.</strong> Gặp lỗi cấm, hỏi ngay: có log thực thi không? Không thì sửa resource-based policy; có thì sửa execution role. Không mở bừa cả hai lớp.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L02, Bài L03.</p>",
  "code": "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Effect\": \"Allow\",\n      \"Principal\": {\"Service\": \"apigateway.amazonaws.com\"},\n      \"Action\": \"lambda:InvokeFunction\",\n      \"Resource\": \"arn:aws:lambda:*:*:function:pay-handler\",\n      \"Condition\": {\"ArnLike\": {\"AWS:SourceArn\": \"arn:aws:execute-api:*:*:*/*/*/*\"}}\n    }\n  ]\n}",
  "expected": "Đây là resource-based policy gắn trên chính Lambda, không in ra gì; kết quả là quyết định cho phép/từ chối khi có request gọi Lambda. Phân tích: Principal là service apigateway.amazonaws.com, Action là lambda:InvokeFunction, Resource là arn:aws:lambda:*:*:function:pay-handler — nghĩa là API Gateway ở bất kỳ account nào (ARN để wildcard account) được gọi Lambda pay-handler ở mọi region. Condition ArnLike trên AWS:SourceArn giới hạn thêm: chỉ nhận lời gọi xuất phát từ một execute-api ARN khớp arn:aws:execute-api:*:*:*/*/*/*. Điều kiện này chống confused deputy — ngăn service principal khác mạo danh tên apigateway.amazonaws.com; AWS:SourceArn là condition key toàn cục dùng được với mọi service principal. Bẫy: wildcard ở cả region, account và API id nghĩa là bất kỳ REST API nào trong bất kỳ account nào cũng lọt qua; least privilege thật phải ghi đúng account id và API id, ví dụ arn:aws:execute-api:ap-southeast-1:123456789012:abc123/*/*/*. Nhớ phân biệt hai lớp: policy này chỉ mở cửa cho người gọi; sau khi Lambda chạy, mọi truy cập tài nguyên bên trong vẫn do execution role quyết định. Thiếu policy này, API Gateway bị từ chối ngay và Lambda không chạy nên không có log — khác hẳn lỗi thiếu quyền của execution role, khi đó Lambda đã chạy và log dừng đúng thao tác bị từ chối.",
  "followups": [
    {
      "q": "Làm sao bạn chẩn đoán nhanh một lỗi cấm là do thiếu quyền gọi hay thiếu quyền của Lambda?",
      "a": "Bạn nhìn vào nơi lỗi xuất hiện và log đi kèm. Thiếu quyền gọi thì bên gọi nhận AccessDenied ngay, Lambda chưa chạy nên không có log thực thi nào. Thiếu quyền của Lambda thì Lambda đã chạy, log dừng đúng thao tác gọi dịch vụ, nêu rõ hành động và tài nguyên bị từ chối. Phân biệt được hai dấu hiệu này giúp sửa đúng lớp thay vì mở quyền bừa cả hai."
    },
    {
      "q": "Vì sao không nên mở quyền gọi cho mọi nguồn rồi kiểm tra trong mã?",
      "a": "Kiểm tra trong mã chỉ chạy sau khi Lambda khởi tạo và tốn chi phí, còn resource-based policy chặn ngay từ ngoài, miễn phí và an toàn hơn. Mã kiểm tra dễ bị sót nhánh, log lộ thông tin nhạy cảm hoặc bị vượt qua khi có lỗi logic. Resource-based policy do nền tảng thực thi nên đồng nhất và rà soát tập trung được. Bạn dùng mã kiểm tra nghiệp vụ, việc ai được gọi Lambda thì để policy lo."
    },
    {
      "q": "Khi cho một Lambda khác gọi Lambda này, bạn cấu hình hai lớp quyền thế nào?",
      "a": "Bạn thêm quyền gọi trên Lambda đích với điều kiện giới hạn đúng ARN của Lambda nguồn, đồng thời gắn cho Lambda nguồn một identity-based policy cho phép lambda:InvokeFunction trên đúng ARN đích. Lambda đích giữ execution role riêng cho việc của nó, không chia sẻ role với Lambda nguồn. Cách này giữ mỗi Lambda đúng quyền tối thiểu và đường gọi nào cũng tường minh."
    }
  ],
  "pitfalls": [
    "Cấp execution role mạnh rồi tưởng quyền gọi tự có, khiến API Gateway báo AccessDenied dù Lambda đủ quyền bên trong",
    "Mở quyền gọi cho mọi nguồn cho nhanh rồi quên thu hẹp khi lên production"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được thứ tự kiểm tra quyền gọi trước rồi mới tới kiểm tra execution role khi Lambda chạm tài nguyên",
    "Tôi có thể giải thích bằng ví dụ API Gateway được gọi Lambda thanh toán nhưng Lambda vẫn cần execution role riêng để ghi bảng đơn hàng của RDS",
    "Tôi có thể chẩn đoán một lỗi AccessDenied thực tế là thiếu quyền gọi hay thiếu quyền của Lambda và sửa đúng lớp"
  ],
  "refs": [
    "aws-lambda-permissions",
    "aws-iam"
  ]
},
{
  "id": "G05",
  "group": "G",
  "topic": "API Gateway: route, CORS, xác thực và throttling",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "API Gateway trả 502. Bạn phân biệt nguyên nhân thế nào?",
      "a": "502 nghĩa là gateway nhận được phản hồi không hợp lệ từ phía sau, nên nguyên nhân nằm ở định dạng phản hồi chứ không ở logic nghiệp vụ. Với Lambda proxy, nguyên nhân phổ biến nhất là thân phản hồi không đúng cấu trúc mà gateway mong đợi — thiếu trường mã trạng thái, hoặc thân không phải chuỗi. Nguyên nhân thứ hai là Lambda ném lỗi chưa được bắt, gateway nhận phản hồi sai định dạng. Nguyên nhân thứ ba là vượt thời gian chờ tích hợp, nhưng trường hợp đó thường cho 504. Cách phân biệt nhanh là đọc CloudWatch Logs của Lambda trước, vì 502 hầu như luôn tương ứng một lần chạy Lambda thất bại hoặc trả về sai định dạng."
    },
    {
      "q": "Vì sao CORS ở API Gateway lại hay gây lỗi khó hiểu?",
      "a": "Vì CORS là cơ chế của trình duyệt, nên khi nó chặn thì lỗi hiện ở phía client chứ không ở phía server — log của API có thể cho thấy request đã thành công. Với request không đơn giản, trình duyệt gửi một request OPTIONS kiểm tra trước; nếu không được trả lời đúng thì request thật không bao giờ được gửi. Điểm dễ sai là cấu hình CORS phải áp cho cả request kiểm tra lẫn phản hồi thật, và khi dùng xác thực thì không được dùng nguồn đại diện. CORS không phải cơ chế xác thực — nó chỉ quyết định trình duyệt có cho đọc phản hồi, còn client khác vẫn gọi thẳng API được."
    }
  ],
  "incident": "<p><strong>Curl 200 mà trình duyệt chết.</strong> Frontend Vue triển khai sang tên miền riêng, người dùng không đăng nhập được dù API vẫn khỏe. Gọi bằng curl từ máy dev trả 200, trình duyệt báo lỗi CORS và không gửi request thật nào.</p><p><strong>OPTIONS bị 403.</strong> Request tiền điều kiện tới API Gateway bị trả 403 vì tên miền mới chưa có trong cấu hình CORS. Sự cố kéo 40 phút tới khi thêm tên miền vào cấu hình của route.</p>",
  "askFirst": [
    "Vì sao curl chạy được mà trình duyệt lại chặn? → Giải mã: CORS là chính sách của trình duyệt, không phải của máy chủ; curl không phải trình duyệt nên không áp, còn trình duyệt chặn đọc phản hồi cross-origin thiếu tiêu đề (Bài L04).",
    "Request tiền điều kiện được xử lý ở tầng nào? → Giải mã: Ở gateway, không phải handler: OPTIONS tới trước, gateway tự trả theo cấu hình CORS của route, chưa chạm code (Bài L04)."
  ],
  "predict": {
    "q": "Bạn đoán Lambda có nhận được request nào trong lúc lỗi CORS không?",
    "a": "<p><strong>Không nhận được request nào.</strong> Trình duyệt gửi OPTIONS tới API Gateway trước, gateway trả 403 vì không khớp cấu hình CORS, trình duyệt dừng luôn nên request thật không bao giờ gửi. Vì vậy log Lambda trống và mọi chỉnh sửa trong mã Lambda đều vô ích.</p>"
  },
  "anchor": "Route thiếu cấu hình CORS cho tên miền gọi = trình duyệt dừng ở preflight và Lambda không nhận request nào.",
  "q": "Hãy giải thích API Gateway định tuyến request, xử lý CORS, xác thực và throttling thế nào trước khi request chạm tới Lambda?",
  "oral": "API Gateway khác Nginx tự dựng ở chỗ nó gom cả bốn việc — định tuyến, CORS, xác thực, giới hạn tốc độ — vào một lớp quản lý. Thứ tự request đi qua: route khớp phương thức và đường dẫn trước, rồi xác thực token hoặc khóa API, rồi throttling theo giới hạn bạn đặt, cuối cùng mới tới Lambda; mỗi bước từ chối là không tốn một lần chạy Lambda nào. Với trình duyệt, gateway tự trả request OPTIONS tiền điều kiện kèm đúng header cho phép, nên cấu hình thiếu là trình duyệt chặn ngay dù Lambda vẫn khỏe. Bẫy cần tránh: lỗi CORS không phải lỗi code trong Lambda, sửa ở cấu hình CORS của route chứ không phải trong handler; và khi Lambda chạm concurrency limit, gọi đồng bộ bị trả 429 ngay còn gọi bất đồng bộ thì event vào hàng đợi nội bộ để nền tảng thử lại.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>API Gateway</strong>: nhận request HTTP rồi chuyển Lambda; giống Nginx trước Gunicorn trong Django.</li><li><strong>Route</strong>: ghép phương thức và đường dẫn như GET /orders với một tích hợp; giống urls.py của Django.</li><li><strong>CORS</strong> (Cross-Origin Resource Sharing): trình duyệt chỉ cho gọi API khác tên miền khi server cho phép; giống django-cors-headers.</li><li><strong>Preflight</strong>: request OPTIONS gửi trước để hỏi server cho phép gì; giống bước kiểm tra quyền trước khi gửi form.</li><li><strong>Token</strong> (JWT): chuỗi có chữ ký chứng nhận người dùng; giống session cookie nhưng tự mang thông tin.</li><li><strong>Throttling</strong>: giới hạn số request mỗi giây; giống DRF throttle_classes.</li></ul><p><strong>Curl 200 mà trình duyệt chết.</strong> Frontend Vue sang tên miền riêng thì trang đăng nhập đóng băng: trình duyệt báo lỗi CORS, curl vẫn trả 200. Request tiền điều kiện bị từ chối vì tên miền mới chưa có trong cấu hình, request thật không rời trình duyệt, log Lambda trống.</p><p><strong>Từ tự vá từng khối thành một lớp.</strong> Trước API Gateway, bạn tự dựng reverse proxy rồi cấu hình Nginx cho từng việc: CORS, xác thực, giới hạn tốc độ; mỗi thứ một khối riêng phải vá, giám sát, mở rộng. Gateway gom cả bốn vào một lớp: bảng route khớp phương thức và đường dẫn, xác thực token hoặc khóa API chạy trước khi tích hợp, throttling chặn request vượt ngưỡng, và gateway tự trả request OPTIONS cho trình duyệt.</p><p><strong>Thứ tự và bẫy.</strong> Route khớp trước, xác thực, throttling, rồi mới Lambda. Lỗi CORS sửa ở cấu hình route, không phải handler. Lambda hết suất: gọi đồng bộ bị 429, gọi bất đồng bộ thì event vào hàng đợi nội bộ và nền tảng thử lại theo backoff. Đặt gateway làm vành đai ngoài, concurrency làm vành đai trong.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L04, Bài L23.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Request tiền điều kiện CORS là gì và vì sao thiếu nó trình duyệt chặn ngay?",
      "a": "Trước khi gửi request có thay đổi dữ liệu sang tên miền khác, trình duyệt gửi request OPTIONS hỏi server cho phép phương thức và header nào. Gateway phải trả đúng các header cho phép khớp tên miền, phương thức và header mà ứng dụng dùng. Thiếu hoặc sai, trình duyệt không gửi request thật và báo lỗi CORS dù server vẫn khỏe. Lỗi CORS luôn sửa ở cấu hình gateway và header phản hồi, không phải logic Lambda."
    },
    {
      "q": "Bạn chọn giữa kiểm tra token có sẵn và Lambda kiểm tra tùy chỉnh khi nào?",
      "a": "Bạn dùng cơ chế kiểm tra token có sẵn khi hệ thống phát hành token theo chuẩn mở và bạn chỉ cần xác thực chữ ký cùng phạm vi quyền. Bạn viết Lambda kiểm tra tùy chỉnh khi cần logic đặc thù như tra phiên trong database, kiểm tra danh sách thu hồi hoặc hỗ trợ nhiều loại chứng chỉ cùng lúc. Lambda tùy chỉnh linh hoạt hơn nhưng tốn một lần chạy cho mỗi request nên bạn giữ nó nhẹ và có bộ nhớ đệm."
    },
    {
      "q": "Throttling ở gateway khác gì với giới hạn concurrency của Lambda?",
      "a": "Throttling ở API Gateway chặn ngay từ ngoài bằng phản hồi yêu cầu chậm lại, còn giới hạn concurrency quyết định bao nhiêu môi trường Lambda chạy song song phía sau. Gateway hết hạn mức thì request bị từ chối nhanh và rẻ. Chạm concurrency limit của Lambda: gọi đồng bộ được trả 429 TooManyRequestsException ngay; gọi bất đồng bộ thì event vẫn được chấp nhận và đưa vào hàng đợi nội bộ, nền tảng chạy lại theo backoff khi có chỗ trống, nhưng event hết tuổi tối đa — mặc định sáu giờ — mà chưa chạy được thì chuyển sang on-failure destination hoặc bỏ. Bạn phối hợp hai lớp: gateway là vành đai đầu, concurrency là vành đai cuối bảo vệ tài nguyên."
    }
  ],
  "pitfalls": [
    "Cấu hình CORS thiếu header nên trình duyệt chặn dù gọi trực tiếp vẫn chạy tốt",
    "Đặt throttling quá thấp khiến người dùng thật bị từ chối hàng loạt vào giờ cao điểm"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được trình tự route rồi xác thực rồi throttling trước khi gọi Lambda",
    "Tôi có thể giải thích bằng ví dụ ứng dụng Vue gọi API qua gateway với kiểm tra token và giới hạn tốc độ",
    "Tôi có thể cấu hình route, CORS và throttling cho một API mới trước một Lambda có sẵn"
  ],
  "refs": [
    "aws-api-gateway"
  ]
},
{
  "id": "G06",
  "group": "G",
  "topic": "S3, private bucket, presigned URL và kiểm tra upload",
  "prio": "P0",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "Presigned URL có bảo vệ được việc người dùng tải lên nội dung độc hại không?",
      "a": "Không. Presigned URL chỉ là chữ ký cho phép thực hiện đúng một hành động trên đúng một key trong một khoảng thời gian. Nó không kiểm tra nội dung, không giới hạn kích thước thật, và không ngăn tải lên tệp có định dạng khác khai báo. Mọi kiểm tra nội dung phải nằm sau đó: xác minh kích thước và loại bằng cách đọc phần đầu tệp, quét virus, và chỉ công bố tệp sau khi kiểm tra xong. Không phục vụ tệp trực tiếp từ bucket nhận tải; để nó ở trạng thái chờ và chuyển sang bucket công bố sau khi qua kiểm tra."
    },
    {
      "q": "Làm sao giới hạn kích thước tệp khi dùng presigned URL?",
      "a": "Với presigned POST, bạn khai báo dải kích thước cho phép trong chính sách được ký nên S3 từ chối nếu vượt. Với presigned PUT, không có điều kiện content-length-range nên không có giới hạn min–max nào được ký vào URL; kích thước chỉ kiểm tra được sau khi tải lên bằng HEAD hoặc metadata, hoặc bạn đổi sang presigned POST với content-length-range khi cần chặn ngay ở tầng S3."
    }
  ],
  "incident": "<p><strong>SignatureDoesNotMatch dù URL còn hạn.</strong> Người dùng không tải được ảnh đại diện, trình duyệt nhận 403 dù URL còn 4 phút mới hết hạn. Client PUT không kèm header <code>Content-Type</code> khớp giá trị đã dùng lúc ký, nên chữ ký không khớp.</p><p><strong>1,8 GB vào ô ảnh đại diện.</strong> Cùng ngày, một tài khoản khác tải lên file 1,8 GB vì presigned PUT không giới hạn kích thước, làm hỏng luồng xử lý phía sau. Cả hai lỗi đều không phải do bucket bị mở công khai.</p>",
  "askFirst": [
    "Vì sao URL còn hạn mà S3 vẫn trả 403? → Giải mã: Chữ ký được gắn chính sách hẹp; thay đổi chính sách bucket hoặc chính sách quyền khiến chính sách ký không còn hợp lệ, hết hạn là lý do khác (Bài L05).",
    "Presigned URL chặn được gì và không chặn được gì? → Giải mã: Chặn ai gọi, đường dẫn, phương thức, thời hạn; không chặn nội dung byte tải lên — kiểm tra nội dung là bước riêng sau, kích hoạt bởi sự kiện (Bài L20)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra nếu phần mở rộng file lấy thẳng từ tham số client gửi lên?",
    "a": "<p><strong>Khả năng ghi đè chéo user.</strong> Client có thể gửi <code>ext = ../../user-khac/profile.jpg</code> và ghi đè file của người khác trong bucket. Cách an toàn là allowlist content type rồi tự suy ra phần mở rộng, đồng thời nhúng định danh người dùng vào key lúc ký.</p>"
  },
  "anchor": "Presigned URL ký theo ContentType mà client không gửi đúng header = S3 trả SignatureDoesNotMatch dù URL còn hạn.",
  "q": "Bạn cần cho người dùng tải ảnh đại diện lên S3 mà không mở bucket ra công khai. Hãy đề xuất thiết kế dùng presigned URL và kiểm tra file tải lên?",
  "oral": "Thiết kế này tách ba việc: ký URL, tải thẳng, kiểm tra nội dung. Backend xác thực người dùng rồi ký một presigned URL hiệu lực ngắn, chỉ cho phép đúng một thao tác PUT lên đúng key của người đó; trình duyệt tải file thẳng lên S3 nên server không chạm byte nào. Vì presigned URL chỉ kiểm tra chữ ký chứ không kiểm tra nội dung, bạn allowlist content type ngay ở bước cấp URL chứ không đợi tới lúc xác nhận. Sau khi tải xong, sự kiện ObjectCreated kích hoạt Lambda kiểm tra loại file, kích thước và quét nội dung; file không đạt thì xóa hoặc cách ly ngay. Cần nói rõ hai bước là hai việc: soi vài byte đầu chỉ là bằng chứng sơ bộ về định dạng, tệp ở trạng thái SCANNING chứ chưa READY, chỉ khi bước quét nội dung bất đồng bộ đạt thì mới READY và được phục vụ. Điểm dễ sót: phép soi phải khớp đúng loại đã khai lúc cấp URL chứ không chỉ thuộc danh sách cho phép, và bạn ghim version đã quét — bật versioning rồi lưu VersionId, vì URL ký dùng lại được nên client vẫn ghi đè sau khi quét nếu không ghim.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Presigned URL</strong>: đường dẫn có chữ ký tạm thời cho phép một thao tác trên S3 trong thời gian ngắn; giống link tải file có token tạm trong Django.</li><li><strong>S3</strong> (Simple Storage Service): dịch vụ lưu file của AWS; giống thư mục media của Django nhưng đặt trên đám mây.</li><li><strong>Bucket</strong>: thùng chứa file trên S3, có quyền riêng; giống một thư mục gốc lớn chứa media.</li><li><strong>Content-Type</strong>: header khai báo loại file như image/jpeg; giống trường content_type khi upload file trong Django.</li><li><strong>SignatureDoesNotMatch</strong>: lỗi S3 báo chữ ký không khớp; giống CSRF token sai, request bị từ chối.</li><li><strong>Allowlist</strong>: danh sách giá trị được phép; giống choices của một field trong Django.</li><li><strong>Magic number</strong>: vài byte đầu của file nhận dạng định dạng thật; giống kiểm tra nội dung thay vì tin đuôi file.</li></ul><p><strong>403 dù URL còn hạn.</strong> Người dùng tải ảnh đại diện nhận 403: client không gửi đúng header nội dung đã dùng lúc ký nên chữ ký không khớp. Cùng ngày, một tài khoản nhồi file nặng bất thường vào ô ảnh vì đường tải lên không ràng buộc kích thước. Cả hai không phải do bucket mở công khai.</p><p><strong>Từ server gánh byte sang S3 nhận thẳng.</strong> Trước presigned URL, tải file nghĩa là client đẩy byte qua server của bạn rồi server ghi storage; server gánh băng thông, bộ nhớ và cả mã độc từ phía người tải. Presigned URL đảo chiều: backend giữ bucket riêng tư, xác thực xong cấp đường dẫn có chữ ký cho đúng một thao tác trên đúng một key trong vài phút; trình duyệt tải thẳng lên S3, server không chạm byte nào. Lỗi 403 sửa ở phía client, không phải mở bucket ra.</p><p><strong>URL ký mở cửa, kiểm tra nội dung là chốt an toàn.</strong> Chỉ URL ký không chứng minh byte tải lên hợp lệ. Kiểm tra là bước riêng sau: sự kiện ObjectCreated kích hoạt Lambda đọc phần đầu file, đối chiếu loại và kích thước thật; đạt thì chuyển sang nơi công bố, không đạt thì cách ly.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L20.</p>",
  "code": "import boto3\n\ns3 = boto3.client(\"s3\")\nBUCKET = \"avatars-private\"\n\n# ❌ Cách làm sai phổ biến: lấy phần mở rộng từ client → attacker ghi đè chéo user bằng path traversal\nALLOWED = {\"image/jpeg\": \"jpg\", \"image/png\": \"png\", \"image/webp\": \"webp\"}\nMAX_BYTES = 5 * 1024 * 1024\n\ndef make_upload_url(user_id, content_type):\n    # ✅ Cách làm chuẩn: allowlist content type, tự suy ra đuôi, ghim user_id vào key\n    if content_type not in ALLOWED:\n        raise ValueError(\"content type không được phép\")\n    key = \"avatars/%s/profile.%s\" % (user_id, ALLOWED[content_type])\n    return s3.generate_presigned_url(\n        \"put_object\",\n        Params={\n            \"Bucket\": BUCKET,\n            \"Key\": key,\n            \"ContentType\": content_type,   # ✅ client PHẢI gửi đúng header này, nếu không S3 trả 403\n        },\n        ExpiresIn=300,\n    )\n\n# ✅ Sau khi upload xong, backend xác nhận lại bằng HEAD trước khi ghi DB:\ndef confirm_upload(user_id, content_type):\n    key = \"avatars/%s/profile.%s\" % (user_id, ALLOWED[content_type])\n    head = s3.head_object(Bucket=BUCKET, Key=key)\n    if head[\"ContentLength\"] > MAX_BYTES:\n        s3.delete_object(Bucket=BUCKET, Key=key)\n        raise ValueError(\"file quá lớn\")\n    # ContentType trong signature là ràng buộc có thật, nhưng nội dung bên trong chưa được kiểm tra.\n    # Muốn chặn cả nội dung giả mạo: đọc vài byte đầu kiểm tra magic number, hoặc đẩy qua hàng đợi quét.\n    return key",
  "expected": "Hai chi tiết quyết định tính đúng đắn. Thứ nhất, phần mở rộng tệp KHÔNG được lấy từ client — nếu nối thẳng ext do client gửi vào key, họ đặt key thành avatars/<id>/../../<id-khac>/profile.jpg và ghi đè tệp của người khác. Cách an toàn là allowlist content type rồi tự suy ra phần mở rộng. Thứ hai, ContentType trong Params trở thành một phần của chữ ký, nên client BẮT BUỘC gửi đúng header Content-Type khi PUT; nếu không, S3 trả 403 SignatureDoesNotMatch — lỗi rất hay gặp khi tích hợp. Ràng buộc đó chặn được việc đổi loại tệp sau khi ký, nhưng KHÔNG chặn nội dung giả mạo: một tệp .jpg có thể chứa bất cứ thứ gì, nên vẫn phải kiểm tra magic number hoặc đẩy qua hàng đợi. Vì presigned PUT không giới hạn được kích thước, bạn HEAD lại sau khi tải xong để xác nhận, xóa nếu vượt ngưỡng.",
  "followups": [
    {
      "q": "Vì sao presigned URL không thay thế được bước kiểm tra nội dung file?",
      "a": "Presigned URL chỉ chứng minh người cầm URL được phép ghi đúng đường dẫn trong thời gian ngắn; S3 vẫn chấp nhận mọi byte client gửi lên. Kẻ xấu có thể tải lên mã độc với phần mở rộng giả dạng ảnh. Bạn luôn chạy Lambda kiểm tra sau khi tải xong để đọc nội dung thật, đối chiếu loại và kích thước, rồi mới đánh dấu file hợp lệ. URL ký là cửa cho vào, kiểm tra nội dung là chốt an toàn cuối cùng."
    },
    {
      "q": "Bạn ngăn người dùng ghi đè file của nhau thế nào khi ký URL?",
      "a": "Bạn nhúng định danh người dùng vào key khi ký, mỗi người chỉ được ghi đúng thư mục mang tên mình, và giới hạn thao tác chỉ là ghi đúng một key cụ thể chứ không phải cả tiền tố. Backend kiểm tra quyền sở hữu trước khi ký nên người này không bao giờ nhận được URL trỏ sang đường dẫn của người khác. Khi phục vụ file, bạn cũng ký URL tải xuống theo đúng đường dẫn sở hữu thay vì mở đọc công khai cả bucket."
    },
    {
      "q": "Khi tải lên thất bại giữa chừng, bạn thiết kế phía client và server ra sao?",
      "a": "Phía client, khi URL hết hạn hay mạng lỗi thì xin cấp URL mới thay vì thử lại URL cũ, và hiển thị trạng thái rõ ràng để người dùng không bấm tải trùng. Phía server dùng sự kiện ObjectCreated làm mốc duy nhất đánh dấu thành công, các lần tải dở không để lại trạng thái rác trong database. Bạn đặt quy tắc vòng đời tự xóa file chưa qua kiểm tra sau một thời gian để bucket không đầy dần vì các lần tải hỏng."
    }
  ],
  "pitfalls": [
    "Mở bucket cho ghi công khai hoặc ký URL cho cả tiền tố chung khiến người này ghi đè file người khác",
    "Tin phần mở rộng file mà bỏ qua bước kiểm tra nội dung thật sau khi tải lên"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được S3 kiểm tra chữ ký và thời hạn của presigned URL ở bước nào của request",
    "Tôi có thể giải thích bằng ví dụ backend ký URL tải ảnh đại diện cho đúng đường dẫn của từng người dùng",
    "Tôi có thể triển khai luồng xin URL, tải trực tiếp và kiểm tra file sau tải cho một tính năng ảnh đại diện"
  ],
  "refs": [
    "aws-s3",
    "aws-s3-presigned"
  ]
},
{
  "id": "G07",
  "group": "G",
  "topic": "RDS PostgreSQL: kết nối, sao lưu và mạng",
  "prio": "P0",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "Vì sao không nên đặt RDS PostgreSQL trong subnet công khai?",
      "a": "Subnet công khai nghĩa là có đường ra vào từ Internet, biến RDS thành mục tiêu bị dò tìm trực tiếp và mở rộng bề mặt tấn công sang mọi lỗ hổng chưa vá của Postgres. Cách đúng: đặt RDS trong private subnet, security group chỉ cho phép port 5432 từ security group của ứng dụng. Truy cập từ máy cá nhân để debug thì qua bastion hay VPN, không mở cổng ra Internet."
    },
    {
      "q": "Sao lưu tự động có đủ để bảo vệ dữ liệu không?",
      "a": "Chưa đủ, vì sao lưu và khả năng phục hồi là hai chuyện khác nhau. Automated backup kèm PITR giúp quay về một thời điểm quá khứ, nhưng bạn chỉ biết phục hồi được khi đã diễn tập. Bạn phải kiểm tra định kỳ bằng cách khôi phục và đối chiếu dữ liệu; quy trình sao lưu chưa từng thử thì chưa coi như có. Đồng thời ghi rõ mục tiêu RPO (dữ liệu có thể mất) và RTO (thời gian phục hồi), rồi đối chiếu cấu hình hiện tại có đáp ứng hai con số đó không."
    }
  ],
  "incident": "<p>Tình huống giả định: 14 giờ 10, API bắt đầu trả 500 hàng loạt với thông điệp <code>too many clients already</code> (PostgreSQL báo đã hết chỗ kết nối). Lưu lượng mới gấp ba ngày thường nên Lambda tạo thêm nhiều môi trường chạy, mỗi môi trường giữ một kết nối riêng tới RDS PostgreSQL. Số kết nối đang mở tăng cùng đường với số môi trường chạy và vượt giới hạn kết nối của instance. Các request sau đó bị từ chối ngay ở bước mở kết nối, còn CPU của RDS vẫn thấp nên việc tăng kích cỡ máy không giải quyết được.</p>",
  "askFirst": [
    "Vì sao số kết nối tăng theo độ song song chứ không theo số request? → Giải mã: Mỗi container Lambda giữ kết nối riêng; concurrency gấp mười lần thì kết nối gấp mười, request nhiều không bằng nếu container ít (Bài L08).",
    "Thêm máy to hơn có sửa được lỗi này không? → Giải mã: Không; vấn đề là nhân số container, không phải kích thước, nên cần proxy kết nối đứng giữa Lambda và RDS (Bài L08)."
  ],
  "predict": {
    "q": "Bạn đoán dấu hiệu nào trong CloudWatch xác nhận chẩn đoán này?",
    "a": "<p>Đường <code>DatabaseConnections</code> của RDS tăng song song với số môi trường chạy Lambda đồng thời và chạm trần, trong khi CPU và IO của instance còn dư. Hai đường tăng cùng nhau là bằng chứng, còn CPU thấp cho thấy nút thắt nằm ở số kết nối chứ không phải năng lực tính toán.</p>"
  },
  "anchor": "Lambda mở kết nối riêng cho mỗi execution environment mà không có RDS Proxy = số kết nối bùng nổ theo độ song song và chạm max_connections của RDS.",
  "q": "Một web dùng Lambda và RDS PostgreSQL hay bị cạn kết nối khi lưu lượng tăng. Bạn chẩn đoán và khắc phục thế nào, gồm sao lưu và cấu hình mạng?",
  "oral": "Nút thắt nằm ở số kết nối, không phải CPU: Lambda tạo thêm execution environment theo lưu lượng, mỗi environment giữ một kết nối psycopg2 riêng tới RDS, nên tổng kết nối tăng theo độ song song và chạm max_connections của instance. Khác với Gunicorn hay Uvicorn chạy số worker cố định nên số kết nối tính trước được, Lambda mỗi độ song song thêm một kết nối, và các environment ấm còn giữ kết nối thêm một lúc sau khi lưu lượng tụt. Bạn chẩn đoán bằng cách so đường DatabaseConnections của RDS với ConcurrentExecutions của Lambda: hai đường tăng cùng nhau và chạm trần là dấu hiệu đúng bệnh. Khắc phục chuẩn: đặt RDS Proxy, tức pgbouncer của AWS, giữa Lambda và RDS để hàng trăm execution environment chia sẻ một pool kết nối nhỏ. Về mạng, RDS nằm trong private subnet, security group chỉ mở port 5432 cho security group của ứng dụng, không bao giờ mở ra Internet. Về sao lưu, bật automated backup kèm PITR và snapshot trước mỗi lần thay đổi lớn, rồi diễn tập khôi phục định kỳ.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>RDS</strong>: PostgreSQL quản lý của AWS, AWS lo máy chủ và vá; giống Postgres trên VPS nhưng có người vận hành hộ.</li><li><strong>PostgreSQL</strong>: engine bạn đã dùng với Django; RDS chạy đúng engine này.</li><li><strong>Connection pool</strong>: pool kết nối mở sẵn dùng chung; giống psycopg2 pool hay CONN_MAX_AGE trong Django.</li><li><strong>RDS Proxy</strong>: pooler của AWS đặt giữa Lambda và RDS; giống pgbouncer đứng trước Postgres.</li><li><strong>max_connections</strong>: giới hạn kết nối đồng thời của instance; giống giới hạn client của một Postgres.</li><li><strong>Security group</strong>: tường lửa gắn vào tài nguyên, quyết định ai vào cổng nào; giống allow-list IP trong firewall.</li><li><strong>Automated backup và snapshot</strong>: sao lưu định kỳ kèm WAL cho point-in-time recovery; giống pg_dump kèm WAL archive.</li></ul><p><strong>Triệu chứng không khớp nguyên nhân.</strong> API trả 500 hàng loạt với too many clients already trong khi CPU của RDS vẫn thấp, nên tăng size instance không giải quyết được gì. Lưu lượng gấp ba ngày thường, Lambda mở thêm execution environment, mỗi environment giữ một kết nối riêng, tổng kết nối chạm max_connections.</p><p><strong>Sai khác server truyền thống.</strong> Gunicorn hay Uvicorn giữ số worker cố định nên số kết nối tính trước được. Lambda đảo bài toán: tổng kết nối tăng theo độ song song, không theo số request, và chạm trần nhanh hơn hẳn; khi lưu lượng tụt, environment ấm vẫn giữ kết nối thêm một lúc.</p><p><strong>Chẩn đoán và khắc phục.</strong> So đường DatabaseConnections của RDS với ConcurrentExecutions của Lambda; khi chạm trần, request bị từ chối ngay ở bước mở kết nối. Đặt RDS Proxy giữa Lambda và RDS để hàng trăm environment chia sẻ một pool nhỏ. Giữ RDS trong private subnet, security group chỉ mở port 5432 cho security group của ứng dụng; debug từ máy cá nhân qua bastion hay VPN. Bật automated backup kèm PITR, snapshot trước thay đổi lớn, diễn tập khôi phục định kỳ vì sao lưu chưa từng thử lại không phải kế hoạch.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L08.</p>",
  "code": "# ❌ Cách làm sai phổ biến: mỗi execution environment giữ một kết nối psycopg2 riêng tới RDS.\n# Tổng kết nối tăng theo độ song song, chạm max_connections khi lưu lượng cao.\n_conn = None\n\ndef get_conn():\n    global _conn\n    if _conn is None or _conn.closed:\n        _conn = psycopg2.connect(\n            host=DB_HOST, dbname=\"appdb\", user=DB_USER,\n            password=DB_PASS, connect_timeout=5,\n        )\n    return _conn\n\ndef handler(event, context):\n    conn = get_conn()\n    with conn.cursor() as cur:\n        cur.execute(\"SELECT id, name FROM users WHERE id = %s\", (event[\"user_id\"],))\n        row = cur.fetchone()\n    conn.commit()\n    return {\"user\": row}\n\n# ✅ Cách làm chuẩn: trỏ DB_HOST về RDS Proxy (pgbouncer của AWS) đặt trong cùng VPC.\n# Hàng trăm execution environment chia sẻ một pool kết nối nhỏ, mã phía Lambda giữ nguyên.\n# Mỗi environment vẫn tái dùng kết nối ấm, nhưng kết nối thật tới RDS được gộp chung\n# nên không còn bùng nổ theo độ song song.",
  "expected": "Snippet không in ra gì; hành vi quan sát được: mỗi execution environment giữ đúng một kết nối psycopg2 và tái dùng cho các lần gọi ấm. Phân tích: _conn khai báo ở cấp module nên môi trường ấm không bắt tay lại, đúng về mặt tránh chi phí connect. Nhưng số execution environment tỉ lệ với concurrency, tổng kết nối tới RDS bằng số environment đang sống, tăng theo lưu lượng chứ không theo số request, chạm max_connections thì kết nối mới bị từ chối bằng lỗi too many clients already. Bẫy phụ: nếu RDS cắt kết nối idle mà client chưa biết, lần execute kế tiếp ném InterfaceError hay OperationalError, và mã này không có retry nên cả invocation thất bại. Chi tiết dễ bỏ qua: psycopg2 mở transaction ngầm khi execute, nên conn.commit() ở đây là bắt buộc; thiếu nó thì transaction kèm lock treo trên server tới khi connection đóng. Cách làm chuẩn: trỏ kết nối về RDS Proxy để hàng trăm environment chia sẻ một pool nhỏ, giữ RDS trong private subnet với security group chỉ mở port 5432 từ security group của ứng dụng, và bật automated backup kèm PITR, snapshot trước mỗi lần migrate.",
  "followups": [
    {
      "q": "Vì sao Lambda làm cạn kết nối RDS nhanh hơn server truyền thống?",
      "a": "Server như Gunicorn chạy số worker cố định nên số kết nối cố định và tính trước được. Lambda mở thêm execution environment theo lưu lượng, mỗi environment giữ kết nối riêng, nên tổng kết nối tăng theo độ song song. Khi lưu lượng tụt, các environment ấm vẫn giữ kết nối thêm một lúc trước khi bị thu hồi, đỉnh kết nối tụt chậm hơn đỉnh request. Vì vậy kiến trúc Lambda tới RDS cần RDS Proxy hay pgbouncer ngay từ đầu, không đợi chạm trần mới thêm."
    },
    {
      "q": "Bạn cấu hình mạng cho RDS thế nào để vừa an toàn vừa cho Lambda truy cập được?",
      "a": "Đặt RDS trong private subnet, không có đường ra Internet. Security group của RDS chỉ cho phép port 5432 từ security group của ứng dụng. Lambda đặt VPC cùng mạng để gọi thẳng, hoặc trỏ kết nối về RDS Proxy nằm trong VPC đó. Không bao giờ mở 0.0.0.0/0; quản trị từ máy cá nhân đi qua bastion hay VPN có xác thực mạnh. Rà security group định kỳ, xóa rule không còn dùng."
    },
    {
      "q": "Bạn thiết kế sao lưu và khôi phục cho RDS ra sao?",
      "a": "Bật automated backup hằng ngày với retention period theo yêu cầu nghiệp vụ, kèm WAL để khôi phục point-in-time. Trước mỗi migrate hay thay đổi lớn, chụp snapshot thủ công làm mốc quay lại. Diễn tập khôi phục sang instance mới định kỳ, đo thời gian khôi phục thật, vì bản sao lưu chưa từng thử thì chưa coi như có. Với production quan trọng, bật Multi-AZ để standby sẵn sàng khi Zone chính gặp sự cố."
    }
  ],
  "pitfalls": [
    "Mở kết nối psycopg2 mới cho mỗi lần gọi mà không tái dùng ở environment ấm, tổng kết nối bùng nổ theo độ song song",
    "Mở port 5432 của RDS ra Internet hay cho 0.0.0.0/0 vì tiện debug rồi quên đóng"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được RDS Proxy xếp hàng và chia sẻ pool kết nối cho hàng trăm execution environment thế nào",
    "Tôi có thể giải thích bằng ví dụ 200 execution environment chạm max_connections 100 của RDS",
    "Tôi có thể đặt RDS Proxy, security group và lịch sao lưu cho một web Lambda + RDS mới"
  ],
  "refs": [
    "aws-rds",
    "aws-vpc"
  ]
},
{
  "id": "G08",
  "group": "G",
  "topic": "DynamoDB key, access pattern, Query và Scan",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Vì sao Scan lại nguy hiểm trong production?",
      "a": "Scan nguy hiểm vì chi phí đọc tính trên toàn bộ dữ liệu bảng, không phải số dòng trả về. Scan mười item trong bảng trăm triệu item vẫn phải đọc hết trăm triệu item và tiêu sạch read capacity. Bẫy nặng hơn: Scan chiếm read capacity của cả bảng, nên Query chạy đúng thiết kế cũng chậm hay bị throttle theo. Quy tắc: Scan chỉ dùng cho job batch có giới hạn tốc độ hoặc bảng nhỏ; trong đường người dùng, một Scan là dấu hiệu key hay index chưa được thiết kế theo truy vấn."
    },
    {
      "q": "Bạn thiết kế key thế nào cho một truy vấn cần lọc theo hai trường?",
      "a": "Nguyên tắc: chọn key theo truy vấn, không theo cách dữ liệu được tạo ra. Chọn partition key là trường phân tán cao và được hỏi trong hầu hết truy vấn, đặt trường còn lại làm sort key; sort key cho phép lọc theo khoảng và sắp xếp ngay trong phân vùng. Nếu cả hai trường đều phải làm điều kiện chính độc lập, bạn ghi dữ liệu hai lần theo hai key khác nhau hoặc thêm một GSI, và mỗi lựa chọn là chi phí thật: dung lượng ghi thêm, độ trễ đồng bộ. Điểm cần nêu trong phỏng vấn: đánh đổi cụ thể đó, không trả lời chung chung."
    }
  ],
  "incident": "<p>Tình huống giả định: Trang lịch sử đơn hàng của khách hàng mất 4 giây mỗi lần tải dù mỗi khách chỉ có vài chục đơn. Đoạn mã dùng Scan toàn bảng <code>orders</code> rồi lọc theo <code>customer_id</code> ở phía ứng dụng, nên mỗi lần xem lịch sử phải đọc hết hàng trăm nghìn item. Dung lượng đọc tiêu thụ tăng vọt và các truy vấn khác cũng chậm theo vì cùng chia sẻ năng lực của bảng. Đổi sang Query theo partition key <code>customer_id</code> và sort key <code>created_at</code> đưa thời gian tải về dưới 100 mili giây.</p>",
  "askFirst": [
    "Vì sao bộ lọc sau Scan không làm Scan rẻ đi? → Giải mã: Scan đã đọc mọi phân vùng rồi mới lọc; lọc chỉ giảm số dòng trả về, không giảm công đọc toàn bảng (Bài L05).",
    "Thiết kế key bắt đầu từ đâu? → Giải mã: Từ mẫu truy vấn thật: partition key là trường truy vấn nhiều nhất, sort key là thứ tự nội bộ; GSI chỉ cho mẫu truy vấn mới (Bài L05)."
  ],
  "predict": {
    "q": "Bạn đoán chi phí đọc thay đổi thế nào khi chuyển từ Scan sang Query?",
    "a": "<p>Scan đọc mọi item trong bảng nên chi phí tính trên toàn bộ dữ liệu, bất kể chỉ trả về vài chục dòng sau khi lọc. Query đi thẳng tới phân vùng chứa <code>customer_id</code> và chỉ đọc dải sort key cần thiết, nên chi phí tỉ lệ với số dòng trả về chứ không với kích thước bảng.</p>"
  },
  "anchor": "Scan toàn bảng rồi lọc theo customer_id ở ứng dụng = mỗi lần xem lịch sử đọc hết bảng và làm chậm mọi truy vấn khác.",
  "q": "Hãy giải thích partition key và sort key trong DynamoDB, và vì sao Query theo key hiệu quả hơn Scan toàn bảng rất nhiều?",
  "oral": "DynamoDB khác RDS ở chỗ nó là bộ key-value phân tán, bạn phải thiết kế key theo truy vấn từ đầu chứ không xây index sau như PostgreSQL. Partition key băm item ra các phân vùng vật lý, item cùng partition key nằm chung và sắp theo sort key nếu có; Query đi thẳng vào phân vùng đích nên chi phí đọc tỉ lệ với số item trả về, còn Scan phải duyệt mọi phân vùng, chi phí theo kích thước toàn bảng và chiếm read capacity của các Query khác đang chạy. Thiết kế bảng vì vậy bắt đầu từ danh sách truy vấn thật, ví dụ bảng orders dùng partition customer_id kèm sort created_at. Mọi luồng chính dùng Query; Scan chỉ cho job batch có giới hạn tốc độ hoặc xuất dữ liệu; mẫu truy vấn theo trường mới thì thêm GSI, không đổi key gốc.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>DynamoDB</strong>: NoSQL key-value quản lý của AWS; giống Postgres nhưng bạn phải thiết kế key theo truy vấn từ đầu.</li><li><strong>Partition key</strong>: khóa băm chọn phân vùng lưu item; giống cột bạn dùng để shard dữ liệu.</li><li><strong>Sort key</strong>: xếp các item trong cùng partition key; giống ORDER BY cố định của một index.</li><li><strong>Query</strong>: đọc theo partition key, lọc thêm trên sort key; giống filter(customer_id=...) có index trong Django.</li><li><strong>Scan</strong>: duyệt toàn bộ bảng rồi lọc; giống queryset không index, quét hết bảng.</li><li><strong>GSI</strong>: index phụ toàn cục, cho phép Query theo một cặp key khác; giống cột db_index thêm sau, có chi phí ghi riêng.</li><li><strong>Hot partition</strong>: phân vùng nhận quá nhiều lưu lượng nên bị throttle dù bảng còn dự phòng; giống một hàng Postgres bị lock liên tục.</li></ul><p><strong>Triệu chứng: lịch sử đơn hàng mất 4 giây.</strong> Ứng dụng Scan toàn bảng orders rồi lọc customer_id phía client, mỗi lần xem lịch sử phải đọc hàng trăm nghìn item, read capacity tăng vọt và mọi Query khác trong bảng chậm theo. Đổi sang Query theo partition customer_id và sort created_at đưa tải về dưới 100 mili giây.</p><p><strong>Sai khác PostgreSQL.</strong> Với Postgres, index là cấu trúc phụ, thêm được sau, trả giá bằng không gian và độ phức tạp khi ghi. DynamoDB chọn cách khác: index chính là cấu trúc dữ liệu, partition key và sort key quyết định mọi truy vấn nhanh, nên thiết kế bắt đầu từ danh sách truy vấn thật, không bắt đầu từ thực thể.</p><p><strong>Chi phí đọc khác nhau ở đâu.</strong> Query đi thẳng vào phân vùng đích, chỉ đọc dải sort key cần, chi phí tỉ lệ với số item trả về. Scan duyệt mọi phân vùng, chi phí theo kích thước toàn bảng và chiếm read capacity của các Query đang chạy. Mẫu truy vấn theo trường mới là lúc thêm GSI; mỗi GSI là bảng phụ phải đồng bộ ghi, nên chỉ tạo GSI phục vụ truy vấn thật.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05.</p>",
  "code": "import boto3\n\nddb = boto3.client(\"dynamodb\")\n\n# ✅ Cách làm chuẩn: Query đi thẳng vào phân vùng customer_id, chi phí đọc tỉ lệ\n# với số item trả về chứ không phải kích thước bảng.\n# LƯU Ý: BETWEEN chỉ hợp lệ trên sort key, nên created_at phải là sort key String.\nresp = ddb.query(\n    TableName=\"orders\",\n    KeyConditionExpression=\"customer_id = :c AND created_at BETWEEN :a AND :b\",\n    ExpressionAttributeValues={\n        \":c\": {\"S\": \"cust-42\"},\n        \":a\": {\"S\": \"2026-01-01\"},\n        \":b\": {\"S\": \"2026-10-01\"},\n    },\n    Limit=20,\n)\n# Bẫy: Limit là số item được ĐÁNH GIÁ tối đa, không phải số item trả về.\n# Nếu response có LastEvaluatedKey, phải gọi tiếp với ExclusiveStartKey.",
  "expected": "Query không in ra gì; kết quả là response DynamoDB chứa Items khớp điều kiện. Phân tích: KeyConditionExpression chỉ hợp lệ khi key schema của bảng là partition customer_id kèm sort created_at. Partition key bắt buộc so bằng, không được BETWEEN hay begins_with; chỉ điều kiện trên sort key mới dùng được BETWEEN, và BETWEEN bao gồm cả hai đầu mút. Nếu bảng chỉ có partition key, điều kiện thứ hai khiến DynamoDB ném ValidationException vì created_at không nằm trong key schema. Query đi thẳng vào phân vùng đích, chi phí đọc tỉ lệ với số item đọc, nên rẻ hơn Scan rất nhiều lần trên bảng lớn. Bẫy Limit=20: Limit là số item được đánh giá tối đa, response có thể ít hơn 20 item dù còn dữ liệu; khi còn item, response kèm LastEvaluatedKey và bạn phải gọi tiếp với ExclusiveStartKey cho tới hết. ExpressionAttributeValues dùng typed value của low-level client, nên created_at phải là sort key kiểu String; nếu sort key là Number thì phải gửi {\"N\": ...}, gửi chuỗi ISO sẽ bị ValidationException.",
  "followups": [
    {
      "q": "Vì sao bộ lọc của Scan không làm cho Scan rẻ đi?",
      "a": "Bộ lọc chỉ loại kết quả trả về cho bạn, DynamoDB vẫn phải đọc toàn bộ dữ liệu từ đĩa để xét từng item. Chi phí và read capacity tính trên lượng dữ liệu đã đọc, không tính trên kết quả sau lọc, nên Scan kèm lọc trên bảng lớn vẫn chậm và tốn như Scan thường, chỉ khác là trả về ít item hơn qua mạng. Khi cần lọc thường xuyên theo một thuộc tính, đổi thiết kế: đưa thuộc tính đó vào key hoặc thêm GSI để biến thành Query."
    },
    {
      "q": "Khi nào bạn thêm GSI thay vì đổi key của bảng gốc?",
      "a": "Bạn thêm GSI khi xuất hiện mẫu truy vấn mới mà key gốc không phục vụ, ví dụ bảng gốc phân theo customer_id nhưng giờ cần phân theo status. Đổi key gốc nghĩa là viết lại toàn bộ dữ liệu và sửa mọi Query cũ, rất rủi ro. GSI cho phép Query theo key khác mà không động bảng gốc; cái giá là dung lượng ghi thêm và độ trễ đồng bộ nhỏ. Chỉ tạo GSI phục vụ truy vấn thật, vì mỗi GSI đều tốn chi phí ghi riêng."
    },
    {
      "q": "Hot partition là gì và bạn xử lý thế nào?",
      "a": "Hot partition là một giá trị partition key nhận quá nhiều lưu lượng, ví dụ mọi request cùng ghi vào phân vùng của một khách hàng lớn. Mỗi phân vùng có hạn thông lượng riêng, cạn là request bị throttle dù bảng còn dự phòng. Bạn xử lý bằng cách thêm hậu tố ngẫu nhiên vào key nóng để rải ghi ra nhiều phân vùng, rồi đọc gộp nhiều phân vùng khi cần. Với key đọc nóng, thêm cache phía trước như ElastiCache để giảm tải trực tiếp cho bảng."
    }
  ],
  "pitfalls": [
    "Dùng Scan cho API phục vụ người dùng khiến càng nhiều dữ liệu càng chậm và càng tốn",
    "Chọn partition key ít giá trị distinct tạo điểm nóng khiến request bị siết vì cạn dung lượng còn trống"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được DynamoDB băm partition key và phân phối item ra các phân vùng vật lý thế nào",
    "Tôi có thể giải thích bằng ví dụ bảng đơn hàng Query theo khách hàng và khoảng thời gian thay vì Scan",
    "Tôi có thể chọn partition key và sort key cho một bảng mới từ danh sách mẫu truy vấn của ứng dụng"
  ],
  "refs": [
    "aws-dynamodb-model",
    "aws-dynamodb-query"
  ]
},
{
  "id": "G09",
  "group": "G",
  "topic": "DynamoDB conditional write và optimistic concurrency",
  "prio": "P0",
  "level": "L3",
  "type": "code",
  "attacks": [
    {
      "q": "Vì sao conditional write lại an toàn hơn đọc rồi ghi trong DynamoDB?",
      "a": "Điều kiện ghi được đánh giá nguyên tử bên trong DynamoDB, trên đúng phiên bản item tại thời điểm ghi. Hai request cùng ghi một item, DynamoDB xử lý tuần tự và một bên nhận ConditionalCheckFailedException, không có khe nào để cả hai cùng thấy trạng thái cũ. Đọc rồi ghi là hai lời gọi riêng biệt, giữa chúng luôn có khe cho request khác thay đổi dữ liệu, cả hai quyết định trên thông tin đã lỗi thời. Đây đúng nguyên tắc như ràng buộc UNIQUE trong Postgres: chỉ tầng lưu trữ mới nguyên tử trước hai request đồng thời."
    },
    {
      "q": "Nếu điều kiện ghi thất bại, ứng dụng nên làm gì?",
      "a": "Phân biệt hai loại thất bại. Thất bại vì thao tác đã tồn tại, ví dụ cùng key idempotency, là thành công về mặt nghiệp vụ, nên trả lại kết quả của lần trước chứ không báo lỗi. Thất bại vì xung đột version khi cập nhật là tín hiệu có người khác vừa sửa, bạn đọc lại rồi thử lại với version mới, hoặc báo người dùng dữ liệu đã đổi. Không được thử lại mù quáng trong vòng lặp: khi tranh chấp cao, retry vô hạn tạo vòng lặp thất bại liên tục và làm nặng thêm tình hình."
    }
  ],
  "incident": "<p>Tình huống giả định: Đợt flash sale lúc 20 giờ, 100 người cùng mua món hàng còn 40 chiếc nhưng hệ thống bán được 63 chiếc. Hai Lambda đọc cùng số tồn kho rồi ghi đè lẫn nhau, bản ghi sau xóa mất bản ghi trước mà không có lỗi nào. Kho chỉ còn 0 nhưng đơn hàng đã ghi nhận 63, phải hủy 23 đơn và đền bù khách. Nguyên nhân là thao tác ghi không kèm điều kiện kiểm tra giá trị đã đọc và số tồn còn đủ.</p>",
  "askFirst": [
    "Vì sao hai Lambda cùng đọc một số tồn kho rồi cùng ghi lại không báo lỗi? → Giải mã: Đọc rồi ghi là hai bước, có khe hở; cả hai cùng đọc giá trị cũ rồi cùng ghi, bên sau che bên trước mà không lỗi (Bài L05).",
    "Điều kiện gì phải nằm chung trong một bước ghi? → Giải mã: Kiểm điều kiện và cập nhật phải là một lệnh atomic với câu điều kiện, tránh đọc-then-ghi; bước ghi có điều kiện là chốt cuối (Bài L21)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra khi hai Lambda cùng đọc version 5 rồi cùng ghi với điều kiện version = 5?",
    "a": "<p>DynamoDB xử lý tuần tự nên chỉ Lambda tới trước ghi thành công và nâng version lên 6. Lambda tới sau thấy dữ liệu hiện tại đã là 6 nên điều kiện sai, bị từ chối với <code>ConditionalCheckFailedException</code> và không sửa item. Nó phải đọc lại version mới rồi quyết định thử lại, nên không có ghi đè im lặng.</p>"
  },
  "anchor": "Đọc tồn kho rồi ghi riêng mà không có ConditionExpression = hai writer cùng thắng và bán quá số hàng thật.",
  "q": "Hãy viết một thao tác trừ tồn kho trong DynamoDB an toàn khi nhiều Lambda cùng chạy, dùng conditional write để chống ghi đè lẫn nhau?",
  "oral": "Sai là ghi đè im lặng: hai Lambda đọc cùng tồn kho rồi ghi đè lên nhau, bản sau xóa mất bản trước và không có lỗi nào. Cách chống là conditional write, mỗi lần update_item kèm ConditionExpression kiểm tra version và số tồn đúng như lúc đọc. DynamoDB đánh giá điều kiện và ghi trong một bước nguyên tử, không có khe cho writer khác chen giữa kiểm tra và ghi; writer tới trước ghi và nâng version, writer sau nhận ConditionalCheckFailedException, đọc lại version mới rồi quyết định thử lại. Mẫu này là optimistic concurrency, không khóa khi đọc, chỉ kiểm tra lúc ghi, giống version field trong Django. Với tồn kho, ConditionExpression phải gộp cả stock >= số trừ để không bao giờ bán âm; lần nào không đủ hàng thì dừng, không thử lại. Retry phải giới hạn số lần kèm backoff có jitter, và khi xung đột liên tục thì tuần tự hóa bằng SQS thay vì đua thử lại.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Conditional write</strong>: update_item chỉ ghi khi ConditionExpression đúng; giống UPDATE ... WHERE version = 5 trong SQL.</li><li><strong>ConditionExpression</strong>: biểu thức điều kiện gửi kèm lệnh ghi của DynamoDB; giống WHERE của câu UPDATE.</li><li><strong>Optimistic concurrency</strong>: không khóa khi đọc, kiểm tra version lúc ghi; giống version field của Django làm optimistic lock.</li><li><strong>Version</strong>: số tăng khi ghi, dùng phát hiện item đã đổi; giống trường version của optimistic lock trong ORM.</li><li><strong>ConditionalCheckFailedException</strong>: lỗi khi điều kiện ghi sai; giống IntegrityError, xử lý bằng cách đọc lại rồi thử lại.</li><li><strong>Backoff và jitter</strong>: chờ giữa các lần thử tăng dần kèm ngẫu nhiên; giống exponential backoff khi gọi API ngoài.</li></ul><p><strong>Sự cố: flash sale bán 63 trong khi kho còn 40.</strong> Hai đơn cùng đọc tồn kho rồi cùng ghi, bản sau đè mất bản trước, không lỗi nào xuất hiện, đội phải hủy 23 đơn và đền bù khách. Nguyên nhân: bước ghi không kèm điều kiện kiểm tra giá trị đã đọc và số tồn còn đủ.</p><p><strong>Sai của đọc rồi ghi.</strong> Mô hình đọc, xử lý, ghi lại chỉ an toàn khi một tiến trình nắm toàn bộ trạng thái. Nhiều Lambda chạy song song trên cùng item không có khóa chung, giữa bước đọc và bước ghi luôn có khe cho một writer khác chen vào.</p><p><strong>Conditional write đóng khe đó.</strong> update_item kèm ConditionExpression đánh giá điều kiện và ghi trong một bước nguyên tử. Writer tới trước nâng version, writer sau nhận ConditionalCheckFailedException rồi đọc lại. Retry hợp khi xung đột hiếm, kèm giới hạn số lần và backoff có jitter; xung đột liên tục là dấu hiệu phải tuần tự hóa bằng SQS, mỗi worker vẫn giữ bước ghi có điều kiện làm chốt an toàn cuối cùng.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L21.</p>",
  "code": "import boto3\nfrom botocore.exceptions import ClientError\n\nddb = boto3.client(\"dynamodb\")\n\ndef decrement_stock(product_id, qty, version):\n    # ✅ Cách làm chuẩn: kiểm tra và ghi trong MỘT bước nguyên tử.\n    # version = :v phát hiện writer khác chen giữa đọc và ghi;\n    # stock >= :q đảm bảo không bao giờ trừ âm tồn kho.\n    try:\n        ddb.update_item(\n            TableName=\"products\",\n            Key={\"product_id\": {\"S\": product_id}},\n            UpdateExpression=\"SET stock = stock - :q, version = version + :one\",\n            ConditionExpression=\"version = :v AND stock >= :q\",\n            ExpressionAttributeValues={\n                \":q\": {\"N\": str(qty)},\n                \":v\": {\"N\": str(version)},\n                \":one\": {\"N\": \"1\"},\n            },\n        )\n        return True\n    except ClientError as e:\n        if e.response[\"Error\"][\"Code\"] == \"ConditionalCheckFailedException\":\n            # Xung đột version: đọc lại version mới rồi thử lại,\n            # giới hạn số lần và dùng backoff có jitter.\n            return False\n        raise",
  "expected": "Hàm trả True khi ghi thành công, False khi điều kiện sai, không in ra gì. Lưu ý: một ghi có điều kiện thất bại vẫn bị tính write capacity. Phân tích: update_item với ConditionExpression kiểm tra version và trừ stock trong một bước nguyên tử, không có khe cho writer khác chen giữa kiểm tra và ghi. Hai Lambda cùng đọc version 5: Lambda tới trước ghi thành công, version thành 6; Lambda tới sau gửi version = 5, thấy hiện tại là 6 nên điều kiện sai, DynamoDB không sửa item và trả ConditionalCheckFailedException. Với boto3 client low-level, lỗi nổi lên dạng ClientError và bạn đọc e.response[\"Error\"][\"Code\"]; với boto3 resource thì bắt ddb.exceptions.ConditionalCheckFailedException trực tiếp. Retry: đây là lỗi nghiệp vụ chứ không phải lỗi tạm thời, botocore không tự retry, nên việc đọc lại version rồi thử lại là trách nhiệm của bạn, phải giới hạn số lần kèm backoff có jitter. Bẫy: nếu không gộp stock >= :q vào cùng biểu thức thì có thể bán âm, và kiểm tra phía mã ứng dụng không thay thế được điều kiện phía DynamoDB. Cuối cùng, version phải đến từ một lần GetItem hay Query trước đó; hàm này không tự đọc.",
  "followups": [
    {
      "q": "Chuyện gì xảy ra khi hai Lambda cùng đọc version 5 và cùng ghi, ai thắng?",
      "a": "Cả hai cùng gửi điều kiện version = 5, nhưng DynamoDB xử lý tuần tự nên Lambda tới trước ghi thành công và nâng version lên 6. Lambda tới sau thấy version hiện tại là 6, điều kiện sai, nhận ConditionalCheckFailedException và item không bị sửa. Lambda thua phải đọc lại version mới cùng tồn kho mới rồi quyết định thử lại. Không có hai bản ghi cùng thắng, không mất cập nhật nào im lặng."
    },
    {
      "q": "Vì sao phải gộp kiểm tra tồn kho không âm vào cùng điều kiện ghi?",
      "a": "Nếu kiểm tra tồn kho phía mã rồi ghi riêng, khe giữa đọc và ghi đủ cho một Lambda khác chen vào, tồn kho thành âm. Gộp stock >= :q vào cùng ConditionExpression thì kiểm tra và trừ chạy nguyên tử trong một bước; Lambda nào tới khi không đủ hàng thì bị từ chối ngay và trả hết hàng, không bán lỗ. Đây là điểm mà kiểm tra phía mã không bao giờ thay thế được điều kiện phía DynamoDB."
    },
    {
      "q": "Khi xung đột xảy ra liên tục, bạn đổi chiến lược thế nào thay vì thử lại mãi?",
      "a": "Retry hợp khi xung đột hiếm; xung đột liên tục nghĩa là nhiều nguồn đang đua một tài nguyên, bạn nên tuần tự hóa bằng SQS. Đẩy các yêu cầu trừ kho vào hàng đợi, cho một nhóm nhỏ worker xử lý lần lượt, mỗi yêu cầu vẫn giữ bước ghi có điều kiện làm chốt an toàn cuối cùng. Cách này biến đua song song thành hàng có thứ tự, giảm hẳn tỷ lệ retry thất bại. Nếu một đơn chạm nhiều item liên quan, bọc vào DynamoDB transaction để cùng thành công hoặc cùng hủy."
    }
  ],
  "pitfalls": [
    "Đọc rồi ghi không kèm điều kiện khiến bản ghi sau lặng lẽ xóa mất bản ghi trước",
    "Thử lại vô hạn khi xung đột mà không giới hạn số lần và không lùi dần giữa các lần thử"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được DynamoDB thực hiện kiểm tra điều kiện và ghi nguyên tử trong một bước thế nào",
    "Tôi có thể giải thích bằng ví dụ hai đơn hàng cùng trừ tồn kho và một bên bị từ chối do sai version",
    "Tôi có thể viết thao tác trừ tồn kho có điều kiện kèm thử lại giới hạn cho một hàm Lambda thật"
  ],
  "refs": [
    "aws-dynamodb-model",
    "aws-dynamodb-query"
  ]
},
{
  "id": "G10",
  "group": "G",
  "topic": "SQS visibility timeout, giao trùng và DLQ",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Vì sao tăng visibility timeout lên rất dài lại là ý tồi?",
      "a": "Vì nó đánh đổi khả năng chịu lỗi lấy sự yên tâm. Visibility timeout là khoảng thời gian message bị ẩn khỏi các consumer khác; nếu worker xử lý xong sớm thì không sao, nhưng nếu worker chết, message chỉ được giao lại sau khi hết khoảng đó. Đặt nó dài nghĩa là mỗi lần worker chết, message bị treo lâu trước khi có người xử lý lại, nên tuổi của message tăng và hàng đợi tụt lại. Cách đúng là đặt timeout theo thời gian xử lý thực tế cộng biên, và với công việc dài thì gia hạn timeout trong lúc đang xử lý thay vì đặt một con số khổng lồ từ đầu."
    },
    {
      "q": "Làm sao phát hiện hệ thống đang tụt lại trước khi người dùng nhận ra?",
      "a": "Bằng hai chỉ số cùng nhau. Chỉ số thứ nhất là tuổi của message cũ nhất đang chờ — nếu nó tăng đều, tốc độ xử lý đang thấp hơn tốc độ đến, và đó là dấu hiệu sớm nhất. Chỉ số thứ hai là độ sâu hàng đợi; nó tăng theo nhịp và có thể dao động, nên đọc một mình dễ gây nhiễu, nhưng đọc cùng tuổi message thì rất rõ. Cần đặt cảnh báo trên tuổi message chứ không chỉ trên độ sâu, vì độ sâu có thể ổn định trong khi tuổi tăng — nghĩa là có một message kẹt đang chặn tiến độ."
    }
  ],
  "incident": "<p>Tình huống giả định: Đêm 23 giờ, worker xử lý đơn hàng bị thu hồi giữa chừng vì hết bộ nhớ và visibility timeout đặt 30 giây trong khi xử lý trung bình mất 90 giây. Message hiện lại khi worker còn đang chạy, worker khác nhận và xử lý song song cùng đơn, nên khách bị gửi hai email xác nhận. Queue age tăng liên tục và đội thấy cùng một <code>order_id</code> xuất hiện nhiều lần trong log. Phải xóa thủ công các email trùng và điều chỉnh lại thời gian ẩn.</p>",
  "askFirst": [
    "Vì sao cùng một message lại tới tay hai worker? → Giải mã: Hết thời gian hiển ẩn mà worker chưa xác nhận, hàng đợi cho là chưa nhận, giao lại; giao ít nhất một lần là thiết kế, không phải lỗi (Bài L06).",
    "DLQ giải quyết được phần nào của sự cố này? → Giải mã: DLQ giữ tin lỗi quá ngưỡng để không chặn dòng chính; không tự xử lý, phải có người đọc và xử lý (Bài L06, Bài L21)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra nếu visibility timeout ngắn hơn thời gian xử lý?",
    "a": "<p>Message hết hạn ẩn khi worker vẫn đang chạy, hiện lại và bị worker khác nhận tiếp. Hai worker cùng xử lý một message, cùng ghi kết quả và mỗi bên xóa message của mình, gây trùng dữ liệu và log rối. Cách sửa là đặt thời gian ẩn dài hơn thời gian xử lý thực tế cộng biên an toàn, hoặc gia hạn dần khi xử lý lâu.</p>"
  },
  "anchor": "Visibility timeout ngắn hơn thời gian xử lý = message hiện lại giữa lúc đang chạy và bị hai worker xử lý cùng lúc.",
  "q": "Hãy giải thích visibility timeout của SQS, vì sao SQS có thể giao một message nhiều lần, và dead-letter queue dùng để làm gì?",
  "oral": "Khi một worker nhận message từ hàng đợi, message đó tạm ẩn đi trong khoảng visibility timeout để worker khác không nhận trùng, worker xử lý xong thì xóa message khỏi hàng đợi. Nếu worker sập hoặc xử lý quá lâu mà chưa xóa, hết thời gian ẩn thì message hiện lại để worker khác nhận và xử lý tiếp, đây chính là cơ chế đảm bảo không mất việc. Cũng vì cơ chế này mà SQS chỉ đảm bảo giao ít nhất một lần chứ không phải đúng một lần, message hoàn toàn có thể tới tay bạn hai lần khi lần đầu xử lý xong nhưng chưa kịp xóa. Dead-letter queue là một hàng đợi phụ hứng các message thất bại quá số lần cho phép, giúp bạn cách ly message độc khỏi dòng chính để phân tích và xử lý riêng thay vì để nó kẹt mãi trong vòng lặp.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Worker</strong>: tiến trình nền lấy message từ hàng đợi rồi xử lý; giống Celery worker chạy lặp trong Django.</li><li><strong>SQS</strong>: dịch vụ hàng đợi quản lý sẵn của AWS, không cần tự dựng broker; giống RabbitMQ nhưng do AWS vận hành.</li><li><strong>Visibility timeout</strong>: khoảng thời gian message bị ẩn sau khi được nhận.</li><li><strong>At-least-once</strong>: đảm bảo giao ít nhất một lần, nên có thể giao trùng; handler phải xử lý được khi nhận lần hai.</li><li><strong>Dead-letter queue (DLQ)</strong>: hàng đợi phụ nhận message thất bại quá số lần cho phép.</li><li><strong>Queue age</strong>: tuổi của message cũ nhất còn trong hàng đợi; tăng đều là dấu hiệu worker không kịp xử lý.</li></ul><p>Cùng một mã đơn hiện nhiều lần trong log, khách nhận hai email xác nhận: worker bị thu hồi giữa chừng, trong khi thời gian ẩn đặt ngắn hơn thời gian xử lý thật, message hiện lại khi worker còn đang chạy, worker khác nhận và xử lý song song.</p><p>Hàng đợi kiểu cổ là danh sách đọc theo thứ tự, message tồn tại trong đó cho tới khi được xóa. <code>SQS</code> thêm một lớp trạng thái: khi worker nhận message, message chuyển vào chế độ ẩn trong khoảng <code>visibility timeout</code>, vẫn nằm trong hàng đợi nhưng không ai khác thấy. Worker sập thì hết giờ ẩn, message hiện lại, đó là lý do SQS cam kết giao ít nhất một lần chứ không đúng một lần. Cùng một message bị giao hai lần không phải lỗi, mà là hệ quả của thiết kế.</p><p>Đặt thời gian ẩn dài hơn thời gian xử lý cộng biên an toàn, hoặc gia hạn dần khi xử lý dài. Message lỗi quá ngưỡng nhận được chuyển sang <code>dead-letter queue</code> để cách ly khỏi dòng chính; cảnh báo trên độ sâu hàng đợi chết để xử lý sớm, không để đọng.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L06, Bài L21.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Vì sao thời gian ẩn ngắn hơn thời gian xử lý gây ra xử lý trùng liên tục?",
      "a": "Worker mới nhận được một nửa thì message hết hạn ẩn và hiện lại, worker khác tưởng việc chưa ai làm nên nhận tiếp và xử lý song song cùng một message. Cả hai worker cùng ghi kết quả gây trùng dữ liệu, và mỗi worker xóa message của mình khiến việc theo dõi rất rối. Bạn đặt thời gian ẩn dài hơn thời gian xử lý thực tế cộng biên an toàn, hoặc gia hạn dần trong lúc xử lý các message dài. Quy tắc là message chỉ được hiện lại khi worker thật sự đã sập chứ không phải vì xử lý hơi lâu."
    },
    {
      "q": "Bạn cấu hình và vận hành dead-letter queue thế nào cho hiệu quả?",
      "a": "Bạn đặt ngưỡng số lần nhận tối đa đã vừa phải, dù cho các lỗi thoáng qua tự khỏi sau vài lần thử nhưng không để message độc quay vòng quá lâu. Bạn gắn cảnh báo mỗi khi có message mới rơi vào hàng đợi chết để xử lý sớm thay vì để đọng lại. Định kỳ bạn xem nội dung message chết để phân loại lỗi mã hay lỗi dữ liệu, sửa gốc rồi mới cho chạy lại có kiểm soát. Hàng đợi chết là nơi chẩn đoán chứ không phải thùng rác bỏ quên."
    },
    {
      "q": "Khi nào bạn chuyển sang hàng đợi đảm bảo thứ tự thay vì hàng đợi tiêu chuẩn?",
      "a": "Bạn chuyển khi các sự kiện của cùng một đối tượng bắt buộc phải xử lý đúng thứ tự, ví dụ tạo đơn phải trước hủy đơn. Hàng đợi có thứ tự gom các message cùng nhóm lại để xử lý lần lượt và loại trùng trong cửa sổ ngắn, đổi lại thông lượng thấp hơn và cấu hình phức tạp hơn. Nếu các message độc lập nhau thì hàng đợi tiêu chuẩn với xử lý song song vừa rẻ vừa nhanh hơn nhiều. Bạn chỉ trả giá cho thứ tự khi nghiệp vụ thật sự cần."
    }
  ],
  "pitfalls": [
    "Đặt visibility timeout ngắn hơn thời gian xử lý khiến cùng một message bị xử lý trùng liên tục",
    "Không cấu hình dead-letter queue nên message lỗi quay vòng mãi và làm tắc dòng chính"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được message chuyển sang hàng đợi chết sau đúng bao nhiêu lần nhận thất bại theo cấu hình",
    "Tôi có thể giải thích bằng ví dụ worker sập giữa chừng khiến message hiện lại cho worker khác làm tiếp",
    "Tôi có thể cấu hình visibility timeout và dead-letter queue cho một hàng đợi đơn hàng mới"
  ],
  "refs": [
    "aws-sqs-visibility",
    "aws-sqs-dlq"
  ]
},
{
  "id": "G18",
  "group": "G",
  "topic": "Chi phí AWS: hóa đơn, tag, budget và cảnh báo bất thường",
  "prio": "P0",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "Vì sao hóa đơn AWS tháng sau cao hơn nhiều dù metric tháng trước vẫn bình thường?",
      "a": "Vì chi phí AWS lag, và vì một số chi phí không hiển thị trên metric chính. Ví dụ chi phí truyền dữ liệu ra internet qua NAT gateway không có metric riêng dễ thấy; một lần Scan toàn bảng DynamoDB tốn nhiều đơn vị RCUs nhưng metric chính chỉ hiện số request; log giữ lâu thì tính phí lưu nhưng không làm spike metric. Vì vậy bạn cần rà soát chi phí theo service mỗi tháng chứ không chỉ tin vào dashboard metric giờ."
    },
    {
      "q": "Gắn tag thủ công bằng tay có đủ để phân nhóm chi phí?",
      "a": "Không đủ, vì ai cũng có thể quên hoặc xóa tag, và tag thủ công không ngăn được tài nguyên không có tag (resource orphan). Cách bền là gắn tag tự động qua IaC hoặc tag policy, đặt quy tắc bắt buộc tag env/project trên mọi tài nguyên mới tạo. Nếu một tài nguyên không có tag bắt buộc thì nó vẫn chạy được nhưng bị tính vào \"không gán cho ai\" trong báo cáo, và bạn biết ngay phải xử lý."
    }
  ],
  "incident": "<p>Tình huống giả định: Một dự án lên production mà chưa ai bật cost tag hay budget. Sau ba tuần, hóa đơn bất ngờ tăng gấp ba. Chi tiết cho thấy một hàm Lambda bị gọi lại liên tục do một lỗi retry không có giới hạn, sinh ra hàng triệu lần gọi thêm; ngoài ra CloudWatch Logs không được đặt retention nên log group mặc định lưu vô thời hạn (Never Expire) và tốn phí lưu mỗi tháng. Trước đó, team không bao giờ thấy con số vì không có tag nhóm chi phí theo project và không có cảnh báo nào.</p>",
  "askFirst": [
    "\"Chi phí đo được\" khác gì \"chi phí tính tiền\"? → Giải mã: Đo được là mẫu dùng; tính tiền là mẫu nhân đơn giá cộng phí chuyển dữ liệu; hoá đơn khớp khi hiểu từng lớp (Bài L01, Bài L20).",
    "Vì sao alarm chi phí real-time là không đáng tin? → Giải mã: Hóa đơn có độ trễ, đo theo chu kỳ; đặt alarm trên metric hành vi thay vì số tiền, tín hiệu sớm hơn (Bài L01)."
  ],
  "predict": {
    "q": "Bạn đoán chi phí thay đổi thế nào nếu Lambda bị gọi lại liên tục do một lỗi retry không giới hạn?",
    "a": "<p>Số lần gọi Lambda tăng nhanh, thậm chí không ngừng, nếu mỗi lần retry sinh thêm sự kiện trigger mới — ví dụ SQS không xóa message, hoặc invoke bất đồng bộ tự retry — nên chi phí Lambda tăng vọt chứ không tăng tuyến tính. Mỗi retry không chỉ tốn thời gian chạy mà còn có thể sinh thêm log, thêm request đi qua API Gateway, và thêm chi phí truyền dữ liệu. Cách phát hiện sớm là alarm trên số lần gọi Lambda so với số request người dùng: nếu hai đường này tách nhau, có retry storm. Chữa gốc là làm idempotent, giảm retry, hoặc chặn ở nguồn gọi.</p>"
  },
  "anchor": "Chi phí AWS lag so với metric, nên cảnh báo phải dựa vào metric realtime còn budget dùng để chốt tiền — alarm chi phí real-time là không đáng tin.",
  "q": "Một dự án mới lên AWS mà chưa ai theo dõi chi phí. Bạn triển khai quy trình đọc hóa đơn, gắn tag, budget và cảnh báo chi phí bất thường như thế nào, dùng Cost Explorer, AWS Budgets và CUR ra sao?",
  "oral": "Chi phí AWS chia làm hai lớp: những gì nền tảng đo được — số request Lambda, GB đọc DynamoDB — và những gì họ thực sự tính tiền, là các mẫu đo đó nhân với giá, cộng thêm thuế và các phí ẩn như truyền dữ liệu qua NAT gateway. Muốn biết service nào, môi trường nào tiêu tiền thì gắn cost allocation tag ngay từ đầu, ví dụ env, project, team, rồi bật tag ở mức account; chỉ tag nào đã bật mới hiện trong Cost Explorer. Để phát hiện bất thường, dùng AWS Budgets kèm cảnh báo khi vượt ngân sách, bật thêm Daily cost anomaly detection, nhưng nhớ dữ liệu chi phí AWS trễ so với hành vi, và độ trễ phụ thuộc loại dữ liệu cùng thời điểm tổng hợp, nên alarm chi phí real-time không đáng tin — hãy đặt alarm trên CloudWatch metric hành vi realtime như số request, số GB, số dòng log. Các lỗ hổng chi phí thường gặp: NAT gateway tính phí truyền dữ liệu, retry storm nhân số lần gọi Lambda, DynamoDB Scan đọc cả bảng, CloudWatch Logs giữ log quá lâu. Dùng Cost Explorer cho câu hỏi nhanh, dùng CUR khi cần phân tích sâu hoặc xuất cho tài chính.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Chi phí đo được và tính tiền</strong>: nền tảng đo mẫu dùng như số lần gọi, GB đọc; tính tiền là mẫu đo nhân đơn giá, thêm phí chuyển dữ liệu và thuế; hoá đơn chỉ khớp khi hiểu từng lớp mẫu đo.</li><li><strong>Cost allocation tag</strong>: nhãn nhóm chi phí gắn qua IaC, phải bật ở mức tài khoản mới hiện trong báo cáo; như dán nhãn phòng ban lên hoá đơn điện, gắn nhãn trước khi đọc.</li><li><strong>Budget và cảnh báo bất thường</strong>: ngưỡng chi tiêu đặt trước kèm cảnh báo phần trăm, so với mức thường để phát hiện tăng bất thường; như đặt trần tiền điện kèm báo động khi vượt, thay chờ hoá đơn cuối tháng.</li></ul><p>Hóa đơn production phình gấp ba chỉ sau ba tuần mà không ai hay trước đó: một hàm bị thử lại không có giới hạn sinh lượng gọi lớn bất thường, log không đặt thời gian giữ nên lưu vô thời hạn, trong khi dự án không có tag nhóm chi phí và không có cảnh báo nào.</p><p>Chi phí đo được và chi phí tính tiền là hai thứ khác nhau. Nền tảng đo theo mẫu — số lần gọi, số GB đọc, số byte truyền — rồi nhân với giá, cộng phí truyền dữ liệu ra ngoài. Khi tài khoản AWS còn nhỏ, nhìn bảng tổng kết cuối tháng là đủ; khi số đó lớn, cần lớp phân tích thật.</p><p>Ba lớp dùng thường xuyên: <code>Cost Explorer</code> cho thấy dịch vụ và môi trường nào tiêu tiền theo tag; <code>AWS Budgets</code> chốt ngân sách theo kỳ và cảnh báo khi vượt; <code>Cost and Usage Report</code> ghi chi tiết từng dòng ra S3 để đào sâu theo tài nguyên. Cả ba đều tổng hợp theo chu kỳ, không thời gian thực, nên alarm chi phí bắn muộn. Thay vào đó bạn đặt alarm trên metric hành vi: số lần gọi Lambda so với số request người dùng, nếu hai đường tách nhau là có vòng lặp thử lại. Tag phải gắn tự động qua IaC và bật ở mức tài khoản thành cost allocation tag; tag chưa bật thì không hiện trong báo cáo.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L01, Bài L20.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Tại sao chi phí AWS lag, và vì sao alarm chi phí theo thời gian thực là không đáng tin?",
      "a": "Dữ liệu chi phí được tổng hợp định kỳ (theo giờ cho Cost Explorer, theo kỳ cho hóa đơn) chứ không phải thời gian thực, nên luôn trễ so với hành vi; độ trễ cụ thể phụ thuộc loại dữ liệu và thời điểm tổng hợp. Alarm trên dữ liệu chi phí có thể bắn quá muộn (khi hóa đơn đã cập nhật) hoặc báo sai khi dữ liệu chưa đầy đủ. Vì vậy bạn đặt alarm trên metric hành vi realtime — số request, số GB, số dòng log — còn chi phí chỉ dùng để chốt lại vào cuối ngày qua AWS Budgets và Cost Explorer."
    },
    {
      "q": "Bạn gắn cost allocation tag thế nào cho đủ dùng mà không làm rối cấu hình?",
      "a": "Chỉ gắn những tag cần thiết cho chi phí và báo cáo, ví dụ env, project, team; không gắn mọi metadata nội bộ vì mỗi tag đều có chi phí lưu và làm khó quản trị. Gắn tự động qua IaC hoặc tag policy để không ai bỏ sót, sau đó bật tag ở mức account thành cost allocation tag để Cost Explorer nhóm và lọc. Một tag chưa được bật thì vẫn ghi trên tài nguyên nhưng không hiện trong báo cáo chi phí."
    },
    {
      "q": "Chi phí tăng vọt giữa đêm. Bạn kiểm tra theo thứ tự nào để tìm thủ phạm nhanh?",
      "a": "Bước một là nhìn metric realtime trong CloudWatch: số request Lambda, số GB đọc DynamoDB, số dòng log ghi — nếu một cái bất thường thì đã khoanh vùng. Bước hai là Cost Explorer lọc theo service và tag để thấy tài nguyên nào tiêu tiền. Bước ba là CUR cho chi tiết nếu cần điều tra sâu. Nếu không có tag, bước hai không phân nhóm được và bạn quay về CUR lọc theo tài nguyên."
    }
  ],
  "pitfalls": [
    "Tin alarm chi phí realtime thay vì metric hành vi, vì chi phí AWS luôn lag và có thể báo sai khi dữ liệu chưa cập nhật",
    "Gắn tag mà không bật cost allocation tag ở mức account, nên tag vô dụng trong Cost Explorer",
    "Chỉ dựa vào dashboard metric mà không rà soát chi phí theo service định kỳ, nên bỏ sót NAT gateway, Scan, log retention"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được chi phí AWS lag bao lâu và vì sao báo cáo chi phí không thể dùng để cảnh báo real-time",
    "Tôi có thể giải thích bằng ví dụ một dự án không tag bị chi phí gộp chung, không biết service nào tiêu tiền",
    "Tôi có thể bật cost allocation tag, AWS Budgets và cảnh báo trên CloudWatch metric cho một web Lambda + RDS mới"
  ],
  "refs": [
    "aws-cost",
    "aws-cloudwatch"
  ],
  "say30": "CloudFront không phải một máy chủ mà là mạng CDN có các điểm hiện diện khắp nơi, đứng gần người dùng thay vì để ai cũng phải về máy chủ gốc. Khi có request, điểm gần nhất kiểm tra xem đã có bản sao chưa, nếu có và còn hạn thì trả ngay, nếu chưa thì về gốc lấy một lần rồi giữ lại. Bạn bật cache cho nội dung ít đổi, tắt cache cho nội dung đổi theo từng người dùng.",
  "say90": "Nhịp một: một request từ user ở một thành phố khác không về máy chủ gốc trực tiếp, mà đi qua điểm biên gần nhất của CDN. Điểm biên giữ bản sao của nội dung, trả ngay nếu có và còn hạn, chỉ về gốc lấy khi chưa có hay đã hết hạn. Nỗi đau thật là ai cũng tưởng CDN chỉ là cache, trong khi nó còn là tầng mạng có chính sách riêng: TTL, invalidation, và cách xử lý request khi gốc xuống.\n\nNhịp hai: khi bật cache, nội dung ít đổi như ảnh hay tệp tĩnh hay trang công khai được giữ ở điểm biên, vừa nhanh vừa giảm tải cho gốc. Với nội dung đổi theo từng người dùng hay dữ liệu thời gian thực, phải tắt cache hay để TTL rất ngắn, nếu không sẽ phục vụ nhầm dữ liệu cũ. Invalidation là lệnh xóa chủ động bản cache, có phí khi vượt ngưỡng miễn phí mỗi tháng, nên chỉ dùng khi nội dung buộc giữ nguyên đường dẫn và cần cập nhật ngay. Cách tránh phải invalidate là đặt tên object theo nội dung với hash hay số phiên bản.\n\nNhịp ba: đánh đổi là cache mua độ trễ và tải gốc rẻ hơn, nhưng trả giá bằng cửa sổ nội dung cũ khi TTL chưa hết; giám sát bằng tỉ lệ cache hit, số lần invalidation mỗi tháng so với ngưỡng miễn phí, và thời gian từ lúc gốc đổi tới khi điểm biên trả bản mới (xem Bài L20 và Bài L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> điểm biên trả ngay không về gốc, giảm độ trễ cho user xa; tải gốc giảm mạnh, chi phí gốc rẻ hơn; tỉ lệ cache hit cao khi nội dung ít đổi.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> nội dung mới phải chờ TTL hết hay phải invalidate, có phí khi vượt ngưỡng; cache nhầm nội dung cá nhân là lộ dữ liệu người này cho người khác; gốc đổi mà tên giữ nguyên thì cache cũ không tự biết (xem Bài L20).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> đặt tên object theo nội dung với hash hay số phiên bản, loại bỏ hoàn toàn nhu cầu invalidate cho tài nguyên tĩnh; chi phí là pipeline deploy phải sinh tên có hash.</li><li><strong>Phương án B:</strong> tắt cache hoàn toàn cho nội dung cá nhân, chỉ cache nội dung công khai; hợp khi không thể tách nội dung cá nhân khỏi nội dung công khai (xem Bài L20).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> tỉ lệ cache hit tụt mạnh; số lần invalidation vượt ngưỡng miễn phí; thời gian từ lúc gốc đổi tới khi điểm biên trả bản mới kéo dài; header phản hồi cá nhân bị đánh dấu là cache công khai.</li><li><strong>Cách kiểm chứng nhanh:</strong> so tên file trên CDN với gốc, xác nhận có hash; kiểm tra TTL của HTML và tài nguyên tĩnh; kiểm tra header của phản hồi cá nhân có bị cache công khai không (xem Bài L20).</li></ul>"
},
{
  "id": "G11",
  "group": "G",
  "topic": "Lambda retry và idempotency",
  "prio": "P1",
  "level": "L3",
  "type": "predict",
  "incident": "<p>Tình huống giả định: Một hàm Lambda nhận event từ S3 và ghi một dòng vào bảng đối soát. Trong hai tuần, bảng có 1.847 dòng trùng. Log CloudWatch cho thấy mỗi event được xử lý hai lần trong khoảng 40% trường hợp, và một lần thì thành công ngay. Hàm không hề bị lỗi logic: lần thứ hai cũng trả về 200 và ghi thêm một dòng. Không có ai gọi lại thủ công.</p>",
  "askFirst": [
    "Với invocation bất đồng bộ, ai thử lại và thử lại mấy lần? → Giải mã: Nền tảng Lambda giữ sự kiện và tự chạy lại theo hàm số lùi; không phải client gửi lại (Bài L03, Bài L21).",
    "Vì sao lần thử thứ hai không bị coi là lỗi? → Giải mã: Lần đầu timeout hay lỗi, nền tảng coi sự kiện chưa được xử lý; lần hai đọc lại trạng thái và trừ tiếp nếu không có mốc nhận diện đã xử lý (Bài L21).",
    "Ranh giới idempotency phải nằm ở đâu trong hàm này? → Giải mã: Ở bước ghi: mỗi sự kiện mang mã duy nhất, bước ghi có điều kiện nguyên tử, lần sau gặp điều kiện sai thì trả kết quả đã có (Bài L21)."
  ],
  "predict": {
    "q": "Một hàm Lambda được gọi bất đồng bộ và lần chạy đầu ném lỗi. Chuyện gì xảy tiếp theo?",
    "a": "<p>Lambda thử lại tự động theo cấu hình, mặc định hai lần, rồi nếu vẫn lỗi thì event được chuyển tới nơi xử lý lỗi — một DLQ hoặc một on-failure destination tuỳ cấu hình. Điều quan trọng là mọi lần chạy đều nhận <em>cùng một event</em>, nên nếu lần đầu đã ghi xong dữ liệu rồi mới lỗi ở bước sau, lần thử thứ hai sẽ ghi lần nữa. Đây là lý do at-least-once phải được coi là mặc định, không phải ngoại lệ. Bên gọi đồng bộ mới là thứ gửi lại event; với invocation bất đồng bộ, việc thử lại do chính nền tảng Lambda thực hiện.</p>"
  },
  "anchor": "Lambda bất đồng bộ tự thử lại (mặc định hai lần) trên cùng một event, nên handler phải được viết như thể nó có thể chạy nhiều lần.",
  "attacks": [
    {
      "q": "Nếu tôi đặt khóa idempotency trong bộ nhớ cấp module thì có chặn được không?",
      "a": "Chỉ trong phạm vi một execution environment, và đó không phải bảo đảm. Biến cấp module sống qua các lần gọi ấm, nhưng môi trường có thể bị thu hồi bất cứ lúc nào, và Lambda có thể chạy nhiều môi trường song song — hai lần thử có thể rơi vào hai môi trường khác nhau. Ngoài ra, cùng một môi trường có thể phục vụ nhiều event khác nhau, nên một tập hợp khoá trong bộ nhớ còn là rò rỉ bộ nhớ. Ranh giới idempotency phải nằm ở một kho lưu trữ dùng chung, thường là điều kiện ghi trên DynamoDB hoặc một ràng buộc duy nhất trong cơ sở dữ liệu quan hệ."
    },
    {
      "q": "Làm sao phân biệt retry do Lambda với người dùng thực sự gửi hai lần?",
      "a": "Bằng định danh nghiệp vụ chứ không bằng định danh hạ tầng. Nếu client sinh một khoá cho mỗi thao tác nghiệp vụ và giữ nguyên qua mọi lần thử, thì hai lần gửi đó là cùng một thao tác và phải bị chặn. Nếu người dùng thực sự muốn tạo hai bản ghi giống nhau, họ phải có hai thao tác khác nhau, tức hai khoá khác nhau. Định danh hạ tầng không thay được khoá nghiệp vụ. MessageId của SQS được gán khi SendMessage và giữ nguyên khi SQS giao lại cùng một message, nên nó chỉ giúp nhận ra việc giao lặp của chính hạ tầng. Với standard queue, producer gửi lại cùng một thao tác nghiệp vụ là một message mới với MessageId mới, nên MessageId không nhận ra được trùng lặp đó; FIFO queue có thể bỏ lần gửi trùng trong cửa sổ 5 phút nhờ MessageDeduplicationId, nhưng vẫn không thay được khoá idempotency nghiệp vụ. requestId của Lambda cũng vậy: với gọi bất đồng bộ, nó định danh một event, nên các lần retry của cùng event giữ nguyên requestId, nhưng client gọi lại là một event mới với requestId mới. Receipt handle thì đổi theo mỗi lần nhận, nên không bao giờ dùng làm khoá được."
    }
  ],
  "q": "Một hàm Lambda trừ tiền được gọi bất đồng bộ và cấu hình retry 2 lần, nhưng lần chạy đầu timeout sau khi đã trừ tiền. Kết quả cuối cùng là gì và vì sao retry gây ra trùng lặp?",
  "oral": "Kết quả là khách hàng bị trừ tiền hai lần, vì retry không biết lần chạy trước đã làm tới đâu. Với invocation bất đồng bộ, khi lần chạy đầu lỗi hoặc timeout, nền tảng Lambda giữ lại sự kiện và tự chạy lại cùng một event, không phải bên gọi gửi lại; lần chạy thứ hai đọc lại số dư và trừ tiếp mà không hề biết lần đầu đã trừ rồi. Vấn đề gốc là hàm không có tính idempotency, tức gọi lại cùng một yêu cầu không cho cùng một kết quả. Cách sửa là mỗi yêu cầu mang một mã duy nhất, hàm kiểm tra mã này trong bảng ghi nhận trước khi trừ tiền, thấy mã đã xử lý thì trả lại kết quả cũ thay vì trừ tiếp. Nhờ vậy retry bao nhiêu lần cũng an toàn, lần đầu thực hiện thật còn các lần sau chỉ trả lại kết quả đã có.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Invocation bất đồng bộ</strong>: client gửi sự kiện và đi luôn, nền tảng nhận việc rồi tự chạy; giống gửi thư, không đứng đợi bên nhận mở.</li><li><strong>Retry của nền tảng</strong>: khi sự kiện bất đồng bộ chạy lỗi hoặc hết giờ, nền tảng giữ sự kiện và chạy lại theo hàm số lùi; không phải bên gọi gửi lại.</li><li><strong>Idempotency</strong>: xử lý lặp vẫn an toàn, chạy nhiều lần cùng đầu vào vẫn giữ đúng trạng thái; giống nút bấm, bấm ba lần vẫn một lần tính tiền.</li><li><strong>At-least-once</strong>: giao ít nhất một lần, có thể giao trùng; người dùng phải thiết kế để lần thứ hai bỏ qua thay vì làm lại.</li></ul><p>Bảng đối soát dư dòng trùng kéo dài mà mã không hề sai logic: cùng một sự kiện bất đồng bộ bị xử lý nhiều lần, lần sau cũng trả thành công và ghi thêm, vì không có mốc nào phân biệt đã xử lý chưa.</p><p>Mô hình \"gọi rồi tin kết quả\" của HTTP đồng bộ là retry do client quyết định, client chịu trách nhiệm không gọi lại khi không chắc. Khi sự kiện chạy trên nền tảng serverless, thứ đó đổi chiều: nền tảng cam kết giao ít nhất một lần, nghĩa là handler phải được viết như thể nó có thể chạy nhiều lần với cùng một event, và retry là việc của nền tảng chứ không phải của bên gọi. Khi sự kiện có nguồn từ hàng đợi, message hiện lại khi worker sập cũng tạo ra lần xử lý thứ hai.</p><p>Chữa từ gốc: mỗi yêu cầu mang một mã duy nhất, bước ghi dùng điều kiện nguyên tử — ví dụ ghi có điều kiện lên khóa giao dịch. Lần đầu được ghi, mọi lần sau gặp điều kiện sai thì trả lại kết quả đã có thay vì làm lại. Mã đó cũng phải truyền xuyên qua mọi bước, để cả chuỗi nhiều bước chỉ xử lý đúng một lần.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L03, Bài L21.</p>",
  "code": "# ❌ Cách làm sai phổ biến: trừ tiền trước, không ghi nhận mã giao dịch\n# Nếu lần chạy đầu timeout sau bước trừ tiền, lần thử lại sẽ trừ thêm một lần nữa.\nimport boto3\nddb = boto3.client(\"dynamodb\")\n\ndef handler_naive(event, context):\n    charge_customer(event[\"customer_id\"], event[\"amount\"])\n    return {\"ok\": True}\n\n# ✅ Cách làm chuẩn: ghi có điều kiện mã giao dịch trước khi trừ tiền\ndef handler(event, context):\n    tx = event[\"tx_id\"]\n    amount = event[\"amount\"]\n    try:\n        ddb.put_item(\n            TableName=\"ledger\",\n            Item={\"tx_id\": {\"S\": tx}, \"amount\": {\"N\": str(amount)}},\n            ConditionExpression=\"attribute_not_exists(tx_id)\",\n        )\n    except ddb.exceptions.ConditionalCheckFailedException:\n        return {\"ok\": True, \"tx_id\": tx, \"duplicate\": True}\n    charge_customer(event[\"customer_id\"], amount)\n    return {\"ok\": True, \"tx_id\": tx}",
  "expected": "Với handler_naive: khách bị trừ tiền hai lần. Lần chạy đầu trừ thành công nhưng timeout trước khi trả kết quả; với invocation bất đồng bộ, nền tảng Lambda giữ sự kiện và tự chạy lại cùng event, lần chạy thứ hai trừ tiếp mà không biết lần đầu đã trừ. Không có mốc nào để phân biệt \"đã xử lý\" với \"chưa xử lý\". Với handler: conditional write lên tx_id là hàng rào nguyên tử — lần chạy đầu ghi được và trừ tiền, mọi lần retry sau đó gặp ConditionalCheckFailedException, thoát ra bằng nhánh duplicate và KHÔNG trừ tiền lần nữa. Retry bao nhiêu lần kết quả vẫn là một lần trừ.",
  "followups": [
    {
      "q": "Vì sao kiểm tra trùng trong bộ nhớ của Lambda không đủ?",
      "a": "Mỗi lần retry có thể rơi vào một môi trường chạy hoàn toàn khác, nên trạng thái trong bộ nhớ của lần chạy trước không tồn tại ở lần chạy sau. Ngay cả cùng môi trường, nó có thể bị thu hồi bất cứ lúc nào khiến dữ liệu trong bộ nhớ mất sạch. Vì vậy mốc kiểm tra trùng phải nằm trong kho bền vững như DynamoDB với ghi có điều kiện, nơi mọi môi trường chạy đều nhìn thấy cùng một sự thật. Bộ nhớ chỉ dùng làm đệm tăng tốc, không bao giờ là nguồn chân lý cho idempotency."
    },
    {
      "q": "Khi thao tác gồm nhiều bước, bạn lan truyền idempotency thế nào?",
      "a": "Bạn sinh một mã giao dịch duy nhất ở điểm vào và truyền nó qua mọi bước tiếp theo, mỗi bước kiểm tra mã trước khi thực hiện tác dụng phụ của mình. Bước nào thấy mã đã xử lý thì bỏ qua và trả kết quả cũ. Với luồng qua hàng đợi, bạn đặt mã vào thuộc tính message để mọi worker đều thấy. Cách này biến cả chuỗi nhiều bước thành một đơn vị idempotent duy nhất thay vì mỗi bước tự lo riêng lẻ."
    }
  ],
  "pitfalls": [
    "Tưởng nền tảng tự loại trùng khi retry nên không làm idempotency trong mã",
    "Lưu cờ đã xử lý trong bộ nhớ môi trường chạy thay vì trong kho bền vững nên retry sang môi trường khác vẫn trùng"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được retry của gọi bất đồng bộ khác gì với message hiện lại của hàng đợi khi worker sập",
    "Tôi có thể giải thích bằng ví dụ hàm trừ tiền bị retry và trừ hai lần vì thiếu ghi nhận mã giao dịch",
    "Tôi có thể thêm kiểm tra idempotency bằng conditional write cho một hàm trừ tiền hiện có"
  ],
  "refs": [
    "aws-lambda-best",
    "aws-sqs-visibility"
  ],
  "say30": "Lambda bất đồng bộ tự thử lại với cùng một event khi lần chạy đầu lỗi hay timeout, nên handler phải được viết như thể nó có thể chạy nhiều lần. Ranh giới idempotency phải nằm ở bước ghi: mỗi sự kiện mang mã duy nhất, bước ghi có điều kiện nguyên tử, lần sau gặp điều kiện sai thì trả kết quả đã có thay vì làm lại. Khóa kiểm trùng trong bộ nhớ của Lambda không đủ vì môi trường chạy có thể bị thu hồi bất cứ lúc nào.",
  "say90": "Nhịp một: bảng đối soát dư dòng trùng trong hai tuần, mỗi sự kiện bị xử lý hai lần trong khoảng bốn mươi phần trăm trường hợp, và không có ai gọi lại thủ công. Hàm không bị lỗi logic, lần thứ hai cũng trả về hai trăm và ghi thêm một dòng. Nỗi đau thật là ai cũng tưởng nền tảng tự loại trùng, trong khi at-least-once là mặc định, không phải ngoại lệ.\n\nNhịp hai: với invocation bất đồng bộ, khi lần chạy đầu lỗi hay timeout, nền tảng giữ sự kiện và tự chạy lại cùng event, không phải bên gọi gửi lại. Mọi lần chạy đều nhận cùng một event, nên nếu lần đầu đã ghi xong dữ liệu rồi mới lỗi ở bước sau, lần thứ hai sẽ ghi lần nữa. Cách sửa là mỗi yêu cầu mang một mã giao dịch duy nhất sinh ở điểm vào, bước ghi dùng điều kiện nguyên tử, ví dụ ghi có điều kiện rằng mã chưa tồn tại; mọi lần retry sau gặp lỗi và trả kết quả đã có. Với luồng qua hàng đợi, đặt mã vào thuộc tính message để mọi worker đều thấy.\n\nNhịp ba: đánh đổi là khóa idempotency trong bộ nhớ cấp module chỉ chặn được một môi trường chạy, và hai lần thử có thể rơi vào hai môi trường khác nhau; khóa phải nằm trong kho bền vững dùng chung như DynamoDB với ghi có điều kiện hoặc ràng buộc duy nhất trong database quan hệ. Giám sát bằng số dòng trùng theo thời gian và tỉ lệ lỗi điều kiện trong log (xem Bài L21 và Bài L02).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> ghi có điều kiện nguyên tử, mọi lần retry sau không làm lại tác dụng phụ; mã giao dịch duy nhất lan truyền qua mọi bước biến cả chuỗi nhiều bước thành một đơn vị idempotent.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> phải sinh và truyền mã ở điểm vào qua mọi tầng, thêm một phụ thuộc vào kho lưu trữ bền vững; khóa bộ nhớ trong Lambda không đủ vì môi trường chạy có thể bị thu hồi bất cứ lúc nào (xem Bài L21).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> FIFO queue với MessageDeduplicationId, nền tảng tự loại trùng trong cửa sổ năm phút — hợp khi toàn bộ luồng đi qua hàng đợi FIFO; chi phí là FIFO chậm hơn standard và có giới hạn cửa sổ.</li><li><strong>Phương án B:</strong> ràng buộc duy nhất trong database quan hệ thay vì DynamoDB, hợp khi data model đã ở quan hệ; chi phí là phải thêm cột khóa nghiệp vụ (xem Bài L21).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> số dòng trùng trong bảng đối soát tăng dần theo thời gian; log CloudWatch cho thấy cùng một sự kiện được xử lý hai lần; tỉ lệ lỗi điều kiện ghi có điều kiện phản ánh mật độ retry thật.</li><li><strong>Cách kiểm chứng nhanh:</strong> chạy cùng sự kiện hai lần liên tiếp, đếm số dòng kết quả; kiểm tra có bước ghi có điều kiện với mã giao dịch duy nhất hay không (xem Bài L21).</li></ul>"
},
{
  "id": "G12",
  "group": "G",
  "topic": "VPC, subnet, security group, public và private subnet",
  "prio": "P1",
  "level": "L2",
  "type": "debug",
  "incident": "<p>Tình huống giả định: Một hàm Lambda cần gọi RDS PostgreSQL nên được đặt trong VPC. Sau khi deploy, hàm timeout sau 30 giây ở mọi lần gọi, kể cả những lần chỉ đọc một dòng. Hàm không hề ném lỗi logic; nó chỉ treo cho tới khi hết thời gian. Cùng lúc, một dịch vụ khác trong cùng VPC gọi được RDS bình thường.</p>",
  "askFirst": [
    "Lambda trong VPC cần gì để ra được Internet? → Giải mã: NAT gateway trong subnet public, route trỏ tới NAT trong bảng route của subnet private; mở security group không tạo đường đi (Bài L01, Bài L06).",
    "Security group kiểm soát cái gì, và khác gì network ACL? → Giải mã: Security group kiểm soát theo cổng, IP, hướng; ACL kiểm soát theo IP và cổng nhưng không theo stateful; mỗi tầng chặn một cách (Bài L01).",
    "Vì sao Lambda treo thay vì báo lỗi kết nối ngay? → Giải mã: Khi route thiếu, kết nối không bao giờ hoàn tất, request chờ tới timeout; khác với từ chối kết nối báo ngay (Bài L06)."
  ],
  "predict": {
    "q": "Một Lambda nằm trong private subnet, không có NAT gateway, và gọi một API công khai trên Internet. Chuyện gì xảy ra?",
    "a": "<p>Lời gọi treo cho tới khi hết timeout của hàm. Private subnet không có route ra Internet, nên gói tin đi ra không có đường về và kết nối chỉ đơn giản là không bao giờ hoàn tất — không có lỗi DNS, không có lỗi kết nối bị từ chối, chỉ có im lặng. Đây là khác biệt quan trọng: thiếu route cho ra kết quả treo. Muốn ra Internet từ private subnet phải có NAT gateway đặt ở public subnet, và route table của private subnet phải trỏ mặc định về NAT đó.</p>"
  },
  "anchor": "Thiếu route ra Internet cho kết quả treo tới hết timeout chứ không phải lỗi rõ ràng, nên triệu chứng \"Lambda treo\" trong VPC thường là lỗi mạng chứ không phải lỗi code.",
  "attacks": [
    {
      "q": "Security group và network ACL khác nhau thế nào?",
      "a": "Security group hoạt động ở cấp tài nguyên — gắn vào ENI của hàm, instance, hay database — và là stateful: nếu bạn cho phép chiều vào thì chiều ra của kết nối đó tự động được phép. Network ACL hoạt động ở cấp subnet và là stateless: bạn phải khai báo cả chiều vào và chiều ra, và thứ tự rule quan trọng vì nó được đánh giá tuần tự. Thực tế là security group mới là thứ bạn chỉnh hằng ngày, còn network ACL thường để mặc định cho phép tất cả."
    },
    {
      "q": "Vì sao đặt hàm trong VPC lại làm cold start lâu hơn?",
      "a": "Vì hàm cần một elastic network interface trong subnet để có địa chỉ trong VPC, và việc gắn ENI nằm trong pha khởi tạo. AWS đã cải tiến mạng VPC năm 2019 để giảm mạnh thời gian gắn ENI (ví dụ minh họa của AWS: từ khoảng 14,8 giây xuống 933 mili giây), nhưng nó vẫn là một khoản cộng thêm vào cold start, và chỉ trả một lần cho mỗi execution environment vì ENI được tái dùng cùng môi trường. Nếu hàm không thực sự cần truy cập tài nguyên trong VPC thì đặt ngoài VPC vẫn rẻ hơn về độ trễ khởi tạo."
    }
  ],
  "q": "Một Lambda trong subnet private không ra được internet để gọi API bên thứ ba, dù security group đã mở outbound 0.0.0.0/0. Lỗi nằm ở đâu và bạn sửa thế nào?",
  "oral": "Lỗi nằm ở định tuyến chứ không phải security group, vì security group chỉ là tường lửa còn đường đi do bảng route quyết định. Subnet private không có đường trực tiếp ra internet, mở outbound bao nhiêu cũng không tạo ra đường đi. Cách sửa chuẩn là đặt một NAT gateway ở subnet public rồi thêm route từ subnet private trỏ ra NAT, lưu lượng của Lambda đi qua NAT để ra ngoài với địa chỉ công cộng của NAT. Bạn tuyệt đối không sửa bằng cách chuyển Lambda sang subnet public hay gán địa chỉ công cộng cho tài nguyên trong private. Sau khi sửa, bạn kiểm tra lại bảng route và thử gọi API để xác nhận, đồng thời rà soát security group ở mức tối thiểu cần thiết.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>VPC</strong>: không gian mạng cô lập của bạn; giống một mạng LAN riêng trong datacenter.</li><li><strong>Subnet</strong>: một dải IP con trong VPC, thuộc một Availability Zone; giống một VLAN.</li><li><strong>Public subnet / private subnet</strong>: subnet có hoặc không có route trực tiếp ra Internet; giống máy có IP công cộng và máy chỉ ở mạng nội bộ.</li><li><strong>Route table</strong>: quy định gói tin đi đâu; giống bảng route trên router văn phòng.</li><li><strong>Security group</strong>: tường lửa gắn vào tài nguyên, kiểm soát chiều vào và ra; giống iptables cho từng máy.</li><li><strong>NAT gateway</strong>: cho tài nguyên trong private subnet ra Internet mà không nhận kết nối từ ngoài vào; giống NAT ở router nhà bạn.</li><li><strong>ENI</strong>: giao diện mạng gắn vào hàm hoặc máy; giống card mạng vật lý.</li><li><strong>VPC endpoint</strong>: lối riêng tới dịch vụ AWS như S3, SQS, DynamoDB mà không đi qua Internet.</li></ul><p>Hàm chuyển vào mạng riêng thì treo tới hết giờ ở mọi lần gọi rồi timeout, kể cả câu đọc một dòng. Nó không ném lỗi logic nào, chỉ im lặng chờ hết thời gian trong khi service khác cùng mạng vẫn gọi cơ sở dữ liệu bình thường.</p><p>Trước VPC, \"mở cổng ra ngoài\" nghĩa là chạy trên EC2 có IP công cộng, và câu hỏi duy nhất là firewall cho phép gì. VPC tách ba khái niệm ra: <code>subnet</code> quyết định gói tin đi đâu qua bảng route, <code>security group</code> quyết định chiều nào được qua, <code>NAT gateway</code> cho lối ra internet mà không cần IP công cộng cho từng resource. Lambda trong private muốn ra internet phải có route trong bảng trỏ tới NAT trong public, và route đó không sinh ra theo mặc định. Mở outbound trong security group không tạo đường đi. Khi route thiếu, kết nối không bao giờ hoàn tất, triệu chứng là treo cho tới timeout chứ không phải lỗi DNS hay từ chối kết nối.</p><p>Endpoint riêng là lối tắt tới dịch vụ AWS không qua internet, dành cho S3, SQS, DynamoDB. NAT chỉ cần khi gọi ra internet công cộng thật.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L01, Bài L06.</p>",
  "code": null,
  "expected": "Lambda timeout khi gọi API ngoài vì subnet private không có đường ra internet, security group mở outbound không tạo ra đường đi. Nguyên nhân gốc là thiếu route từ subnet private tới NAT gateway ở subnet public, sửa bằng cách thêm route đó thay vì mở thêm quyền hay chuyển sang public.",
  "followups": [
    {
      "q": "Vì sao không sửa bằng cách chuyển Lambda sang subnet public?",
      "a": "Chuyển sang public đồng nghĩa tài nguyên của bạn phơi bày gần internet hơn và đi ngược nguyên tắc đặt logic nội bộ trong vùng riêng tư. Subnet public còn đòi hỏi quản lý địa chỉ công cộng và quy tắc vào ra chặt chẽ hơn, một cấu hình sai là thành lỗ hổng. Đường sửa đúng là giữ Lambda trong private và tạo lối ra có kiểm soát qua NAT, vừa thông vừa an toàn. Public chỉ dành cho những thứ buộc phải nhận traffic trực tiếp từ internet như cân bằng tải."
    },
    {
      "q": "Endpoint riêng trong VPC khác gì NAT và khi nào bạn dùng nó?",
      "a": "Endpoint riêng tạo đường đi thẳng từ VPC tới dịch vụ cùng nhà cung cấp mà không qua internet công cộng, nên nhanh hơn và không tốn phí truyền qua NAT. Bạn dùng endpoint cho các gọi tới lưu trữ, hàng đợi và cơ sở dữ liệu cùng nhà cung cấp khi Lambda đã nằm trong VPC. NAT vẫn cần cho các gọi ra internet công cộng thật sự như API bên thứ ba. Kết hợp cả hai giúp bạn vừa rẻ vừa giảm bề mặt tấn công."
    }
  ],
  "pitfalls": [
    "Nhầm security group với định tuyến nên mở quyền ngày càng rộng mà traffic vẫn không thông",
    "Chuyển tài nguyên sang subnet public cho nhanh rồi quên chuyển lại khi lên production"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được bảng route của subnet private trỏ sang NAT ở subnet public theo từng bước",
    "Tôi có thể giải thích bằng ví dụ Lambda trong private timeout khi gọi API ngoài dù outbound đã mở",
    "Tôi có thể kiểm tra bảng route và security group để chẩn đoán một Lambda mất mạng ra ngoài"
  ],
  "refs": [
    "aws-vpc"
  ],
  "say30": "Lambda trong private subnet không ra được Internet không phải lỗi code hay security group, mà là lỗi định tuyến: private subnet không có route ra Internet, mở outbound bao nhiêu cũng không tạo ra đường đi, gói tin treo cho tới hết timeout. Cách sửa chuẩn là đặt NAT gateway ở subnet public rồi thêm route từ subnet private trỏ ra NAT. Security group là tường lửa, route table mới là thứ quyết định đường đi.",
  "say90": "Nhịp một: Lambda trong VPC gọi API công khai, timeout sau ba mươi giây ở mọi lần gọi, kể cả chỉ đọc một dòng. Security group đã mở outbound cho mọi nơi, nhưng hàm vẫn treo. Triệu chứng \"treo\" chứ không phải \"lỗi kết nối bị từ chối\" là chữ ký của thiếu route: gói tin đi ra không có đường về, kết nối không bao giờ hoàn tất, request chờ cho tới hết thời gian.\n\nNhịp hai: VPC chia thành subnet public và private. Subnet public có route trực tiếp ra Internet, subnet private không. Security group kiểm soát chiều vào và ra theo cổng và IP, nhưng không tạo đường đi; route table mới quyết định gói tin đi đâu. Cách sửa chuẩn là đặt NAT gateway ở subnet public, thêm route từ subnet private trỏ ra NAT, lưu lượng Lambda đi qua NAT với địa chỉ công cộng của NAT. Không sửa bằng cách chuyển Lambda sang subnet public vì tài nguyên nội bộ phơi bày gần Internet hơn và đi ngược nguyên tắc.\n\nNhịp ba: đánh đổi là NAT gateway là điểm trung tâm có chi phí và giới hạn băng thông, nên với tải lớn phải cân nhắc NAT instance hay NAT theo AZ; giám sát bằng số kết nối treo theo thời gian và log của NAT gateway (xem Bài L01 và Bài L06).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> NAT gateway giữ Lambda trong private subnet, tài nguyên nội bộ không phơi bày gần Internet; đường đi rõ ràng, kiểm soát được ở route table.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> NAT là điểm trung tâm, có chi phí theo GB và giới hạn băng thông; Lambda trong VPC có cold start lâu hơn do phải gắn elastic network interface; không có NAT thì mọi gọi ra Internet treo im lặng (xem Bài L06).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> VPC endpoint riêng cho dịch vụ cùng nhà cung cấp — thẳng, nhanh, không qua Internet công cộng, không tốn phí NAT; hợp khi Lambda chỉ gọi dịch vụ nội bộ của nhà cung cấp như S3 hay SQS.</li><li><strong>Phương án B:</strong> đặt Lambda ngoài VPC khi không cần truy cập tài nguyên trong VPC, rẻ hơn về độ trễ khởi tạo; chỉ dùng khi thực sự không có phụ thuộc nội bộ (xem Bài L01).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> Lambda timeout sau trọn thời gian tối đa chứ không phải báo lỗi kết nối ngay; log không có lỗi DNS hay kết nối bị từ chối, chỉ có im lặng; CPU thấp mà độ trễ cao.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra route table của subnet private, xác nhận có route mặc định trỏ tới NAT gateway; thử gọi API từ Lambda trong private, so với cùng gọi từ subnet public (xem Bài L06).</li></ul>"
},
{
  "id": "G13",
  "group": "G",
  "topic": "CloudWatch logs, metrics, alarms và correlation ID",
  "prio": "P1",
  "level": "L2",
  "type": "concept",
  "incident": "<p>Tình huống giả định: Người dùng báo \"web chậm\" suốt 40 phút. Đội trực mở dashboard thì thấy CPU của service chỉ 8%, không alarm nào kêu, và log không có dòng ERROR nào. <strong>Nguyên nhân thật</strong> là một dịch vụ phụ thuộc trả chậm gấp mười lần bình thường, nhưng không có metric nào đo độ trễ của lời gọi đó.</p><p><strong>Hệ quả</strong> là log của hai service không nối được với nhau vì không có định danh chung, nên mất 40 phút mới tìm ra.</p>",
  "askFirst": [
    "\"Web chậm\" thiếu thông tin gì để trở thành một giả thuyết kiểm tra được? → Giải mã: Thiếu vị trí: service nào, bước nào, thời gian nào; biến thành câu đo được bằng metric và log có correlation ID (Bài L10).",
    "Metric nào phát hiện được sự cố này sớm nhất? → Giải mã: Độ trễ của phụ thuộc (database, queue); CPU thấp mà chậm thì metric phụ thuộc là đáp án (Bài L10).",
    "Làm sao nối một request qua nhiều service trong log? → Giải mã: Correlation ID duy nhất chạy xuyên qua, dán vào log mỗi service, một mã lọc thấy toàn bộ hành trình (Bài L10, Bài L04)."
  ],
  "predict": {
    "q": "Một service có CPU thấp, không lỗi, nhưng p99 tăng gấp mười. Bạn nhìn vào đâu trước?",
    "a": "<p>Nhìn vào độ trễ của các phụ thuộc trước, không nhìn vào tài nguyên của chính service. CPU thấp kèm độ trễ cao là dấu hiệu service đang chờ một phụ thuộc như database, API bên thứ ba hoặc hàng đợi. Thứ tự kiểm tra hợp lý là độ trễ và tỉ lệ lỗi của từng phụ thuộc, rồi số kết nối đang chờ, rồi độ sâu hàng đợi. Nếu service chỉ có metric CPU và bộ nhớ thì bạn đang mù trước loại sự cố phổ biến nhất, nên hãy thêm metric độ trễ phụ thuộc trước khi sự cố lặp lại.</p>"
  },
  "anchor": "CPU thấp kèm độ trễ cao là dấu hiệu đang chờ phụ thuộc, nên phải đo độ trễ của phụ thuộc chứ không chỉ đo tài nguyên của chính mình.",
  "attacks": [
    {
      "q": "Metric, log và trace khác nhau ở đâu, và bạn dùng cái nào khi nào?",
      "a": "Metric là số liệu tổng hợp theo thời gian, rẻ và luôn bật, dùng để biết có chuyện bất thường. Log là sự kiện kèm ngữ cảnh, dùng để xem chi tiết một trường hợp. Trace cho thấy request mất bao lâu ở từng chặng. Trình tự thực tế là alarm từ metric báo sự cố, trace khoanh vùng chặng chậm, rồi log chỉ ra đúng dòng code. Bẫy hay gặp là chỉ có log mà không có alarm, nên sự cố xảy ra mà không ai biết cho tới khi khách phàn nàn."
    },
    {
      "q": "Correlation ID nên được sinh ở đâu và truyền thế nào?",
      "a": "Sinh ở điểm vào đầu tiên, tức API Gateway, load balancer hoặc service nhận request đầu tiên. Mã này được truyền qua header, qua payload của message trong hàng đợi và qua mọi lời gọi service tiếp theo. Nó cũng nên được trả về client trong header phản hồi để người dùng báo lỗi kèm mã. Bẫy hay gặp là hàng đợi: nếu định danh không nằm trong message, consumer mất liên kết với request gốc đúng lúc cần nó nhất."
    }
  ],
  "q": "Bạn dùng CloudWatch logs, metrics và alarms thế nào, và vì sao cần correlation ID để truy vết một request qua nhiều service?",
  "oral": "Logs, metrics và alarms làm ba việc khác nhau, và chúng bổ sung cho nhau chứ không thay thế nhau. Logs cho biết chuyện gì đã xảy ra ở từng dòng mã. Metrics cho biết hệ thống khỏe hay yếu qua các con số theo thời gian. Alarm là người gác tự động báo khi metric vượt ngưỡng, vì có log mà không có alarm thì sự cố xảy ra bạn vẫn không biết. Khi một request đi qua API Gateway, Lambda, hàng đợi rồi database, mỗi tầng ghi log riêng nên không ghép được nếu thiếu định danh chung. Correlation ID là mã duy nhất sinh ở điểm vào rồi truyền qua mọi tầng, nhờ vậy lọc đúng một mã là thấy toàn bộ hành trình request trong vài giây.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Log</strong>: dòng sự kiện đã xảy ra, trả lời chuyện gì, tại dòng mã nào; giống camera từng khoảnh khắc.</li><li><strong>Metric</strong>: số đo theo thời gian như độ trễ, số lỗi, độ sâu hàng đợi, đặt ngưỡng báo động tự động; giống đo áp suất động cơ xe, báo trước khi hỏng.</li><li><strong>Correlation ID</strong>: mã duy nhất chạy xuyên suốt một request qua mọi dịch vụ, dán vào log và context; như số kiện theo dõi xuyên các bưu cục, ghép hành trình từ nhiều log rời.</li></ul><p><strong>Web chậm kéo dài mà dashboard vẫn xanh.</strong> CPU của service ở mức thấp, không alarm nào kêu, và log của hai service không ghép được vì thiếu định danh chung. Đây là kiểu sự cố mà ba lớp quan sát phải cùng nhau trả lời.</p><p><strong>Trước microservice, mọi thứ nằm trong một tiến trình.</strong> Đọc một file log là thấy toàn bộ sự kiện. Khi tách thành nhiều service, mỗi service ghi log riêng và không có gì bắt chúng kể cùng một câu chuyện. Ba lớp quan sát ra đời để vá khoảng trống này.</p><ul><li><strong>Logs</strong>: từng sự kiện chi tiết, dùng để tìm dòng mã lỗi sau khi biết có chuyện.</li><li><strong>Metrics</strong>: con số tổng hợp theo thời gian, dùng để dựng <code>alarm</code> và phát hiện bất thường sớm.</li><li><strong>Correlation ID</strong>: mã sinh ở điểm vào và truyền qua mọi tầng, để ghép log của nhiều service thành một hành trình.</li></ul><p><strong>Thiếu một lớp là mù một kiểu sự cố.</strong> Thiếu correlation ID thì log không ghép được. Thiếu metric độ trễ của phụ thuộc thì bạn không thấy kiểu sự cố phổ biến nhất là CPU thấp mà chậm. Đủ cả ba, một mã lọc là thấy hành trình request.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L10, Bài L04.</p>",
  "code": "import json, uuid\n\ndef handler(event, context):\n    # ✅ Cách làm chuẩn: lấy correlation ID từ event nếu có, không thì sinh mới\n    corr = event.get(\"correlation_id\") or uuid.uuid4().hex[:12]\n    # In một dòng JSON để CloudWatch Logs lọc được theo từng trường\n    print(json.dumps({\"correlation_id\": corr, \"step\": \"start\", \"order\": event.get(\"order_id\")}))\n    try:\n        result = process_order(event)\n        # Ghi dòng thành công để đối chiếu với dòng lỗi\n        print(json.dumps({\"correlation_id\": corr, \"step\": \"ok\"}))\n        return {\"correlation_id\": corr, \"result\": result}\n    except Exception as e:\n        # Ghi dòng lỗi kèm mã truy vết, rồi raise lại để Lambda đánh dấu lần gọi thất bại\n        print(json.dumps({\"correlation_id\": corr, \"step\": \"error\", \"err\": str(e)}))\n        raise",
  "expected": "Handler in ra ba dòng JSON gồm start, ok hoặc error, rồi trả về dict chứa correlation_id. Đây là mô tả theo tài liệu AWS Lambda và CloudWatch Logs, còn process_order chỉ là hàm nghiệp vụ minh họa. Print trong Lambda được runtime ghi vào CloudWatch Logs, vào log group /aws/lambda/<tên-function> với log stream theo từng execution environment, nên mỗi dòng JSON thành một log event truy vấn được. correlation_id lấy từ event nếu có, ngược lại sinh mới bằng uuid.uuid4().hex[:12]. Mọi tầng ghi cùng mã này thì chỉ cần một câu lọc là dựng lại hành trình qua API Gateway, Lambda, SQS và database. Bẫy: handler nhận correlation_id từ bên ngoài mà không kiểm tra định dạng hay độ dài, nên kẻ gọi có thể nhét mã trùng hoặc ký tự điều khiển vào log, gọi là log injection. Production phải validate bằng allowlist ký tự và giới hạn độ dài. Nhánh except ghi dòng error kèm str(e) rồi raise lại, và chính việc raise lại mới làm lần gọi bị đánh dấu thất bại. Từ đó metric Errors tăng, và với gọi bất đồng bộ Lambda retry rồi mới đẩy sang DLQ. Nếu nuốt exception, log vẫn có dòng error nhưng metric Errors im lặng và alarm không kêu. Cặp đúng là metric Errors, hoặc metric filter đếm dòng khớp { $.step = \"error\" } để phát hiện, còn correlation_id dùng để truy vết chi tiết. Lưu ý except Exception không bắt BaseException như SystemExit hay KeyboardInterrupt, và việc runtime cắt Lambda khi hết timeout cũng không đi qua nhánh này.",
  "followups": [
    {
      "q": "Bạn đặt alarm thế nào để vừa báo sớm vừa không gây nhiễu?",
      "a": "Bạn chỉ đặt alarm cho tín hiệu ảnh hưởng người dùng, như tỷ lệ lỗi, độ trễ cao và hàng đợi tồn đọng. Mỗi alarm có ngưỡng lấy từ hành vi bình thường đã quan sát, và thời gian đánh giá đủ dài để các gai thoáng qua không làm kêu. Bẫy là đặt quá nhiều alarm khiến đội quen tay bỏ qua cả cảnh báo thật, nên bạn rà soát định kỳ các alarm hay kêu oan để chỉnh ngưỡng hoặc xóa đi."
    },
    {
      "q": "Khi log quá lớn gây tốn kém, bạn cắt giảm thế nào mà vẫn gỡ được sự cố?",
      "a": "Bạn cắt ở log thành công, còn log lỗi giữ đầy đủ kèm mã truy vết. Log thành công chỉ giữ một dòng tóm tắt cho mỗi request, và bạn bật lấy mẫu chi tiết cho một phần nhỏ request thành công để vẫn đo được hành vi bình thường. Bạn đặt thời gian lưu ngắn cho log chi tiết và dài hơn cho log tóm tắt cùng metric tổng hợp, nên khi sự cố xảy ra vẫn đủ dữ liệu để truy vết."
    }
  ],
  "pitfalls": [
    "Ghi log mà không kèm correlation ID, nên khi sự cố phải mò giữa hàng nghìn dòng không liên quan",
    "Đặt quá nhiều alarm gây nhiễu, đội quen tay bỏ qua cả cảnh báo thật"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được alarm đánh giá metric theo cửa sổ thời gian và kích hoạt thông báo thế nào",
    "Tôi có thể lọc một correlation ID để thấy request đi qua gateway, Lambda và hàng đợi",
    "Tôi có thể thêm correlation ID vào một API nhiều tầng và đặt alarm tỷ lệ lỗi cho nó"
  ],
  "refs": [
    "aws-cloudwatch"
  ],
  "say30": "Log cho biết chuyện gì đã xảy ra ở từng dòng mã, metric cho biết hệ thống khỏe hay yếu qua con số theo thời gian, alarm là người gác tự động báo khi metric vượt ngưỡng. Có log mà không có alarm thì sự cố xảy ra bạn vẫn không biết cho tới khi khách phàn nàn. Correlation ID là mã duy nhất sinh ở điểm vào rồi truyền qua mọi tầng, nhờ đó lọc đúng một mã là thấy toàn bộ hành trình request trong vài giây.",
  "say90": "Nhịp một: người dùng báo web chậm suốt bốn mươi phút, dashboard mở ra thì CPU chỉ tám phần trăm, không có alarm nào kêu, log không có dòng lỗi nào. Nguyên nhân thật là một dịch vụ phụ thuộc trả chậm gấp mười lần bình thường, nhưng không có metric nào đo độ trễ của lời gọi đó, và log của hai service không nối được với nhau vì thiếu định danh chung.\n\nNhịp hai: CPU thấp kèm độ trễ cao là dấu hiệu service đang chờ một phụ thuộc, không phải tài nguyên của chính nó. Thứ tự kiểm tra hợp lý là độ trễ và tỉ lệ lỗi của từng phụ thuộc trước, rồi số kết nối đang chờ, rồi độ sâu hàng đợi. Correlation ID sinh ở điểm vào đầu tiên, truyền qua header, qua payload của message trong hàng đợi, qua mọi lời gọi service tiếp theo, và trả về client trong header phản hồi để người dùng báo lỗi kèm mã. Bẫy hay gặp là hàng đợi: nếu định danh không nằm trong message, consumer mất liên kết với request gốc đúng lúc cần nó nhất.\n\nNhịp ba: đánh đổi là đặt quá nhiều alarm khiến đội quen tay bỏ qua cả cảnh báo thật, nên phải rà soát định kỳ; giám sát bằng thời gian phát hiện so với thời gian sự cố bắt đầu, con số đó đo giá trị của hệ thống quan sát (xem Bài L10 và Bài L04).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> alarm từ metric báo sự cố sớm, trace khoanh vùng chặng chậm, log chỉ ra đúng dòng code, ba lớp bổ sung chứ không thay thế nhau; correlation ID cho phép dựng lại toàn bộ hành trình request chỉ bằng một mã.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> log chi tiết tốn chi phí lưu trữ, phải cắt log thành công và giữ log lỗi đầy đủ; quá nhiều alarm gây nhiễu, đội quen tay bỏ qua cảnh báo thật; hàng đợi không truyền correlation ID thì consumer mất liên kết (xem Bài L10).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> dùng service monitoring tích hợp sẵn khi hệ thống nhỏ, chấp nhận ít custom metric hơn; rẻ nhất cho giai đoạn đầu.</li><li><strong>Phương án B:</strong> thêm metric độ trễ phụ thuộc trước khi sự cố lặp lại, đặc biệt khi CPU thấp mà p99 tăng — đây là loại sự cố mà chỉ có CPU và bộ nhớ thì bạn đang mù (xem Bài L10).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> p99 tăng gấp mười trong khi CPU vẫn thấp, không có alarm nào kêu; log không có dòng lỗi; sự cố chỉ được phát hiện khi khách phàn nàn.</li><li><strong>Cách kiểm chứng nhanh:</strong> lọc một correlation ID trong log, xác nhận thấy request đi qua mọi tầng hay chỉ một phần; kiểm tra có alarm cho độ trễ phụ thuộc hay không (xem Bài L10).</li></ul>"
},
{
  "id": "G14",
  "group": "G",
  "topic": "Secrets Manager và Parameter Store",
  "prio": "P1",
  "level": "L2",
  "type": "predict",
  "incident": "<p>Tình huống giả định: Một service đọc mật khẩu database từ biến môi trường của hàm Lambda. Khi cần xoay mật khẩu, đội phải sửa cấu hình hàm và deploy lại, mất 20 phút và gây gián đoạn. Trong một lần xoay khẩn cấp vì nghi ngờ lộ, có 12 phút service không kết nối được database. Ngoài ra mật khẩu nằm trong lịch sử phiên bản của hàm, nên vẫn đọc được sau khi đã đổi.</p>",
  "askFirst": [
    "Biến môi trường của hàm khác gì một kho secret? → Giải mã: Biến môi trường là giá trị cố định gắn khi deploy, không xoay tự động; kho secret xoay bản, giá trị mới không cần deploy lại (Bài L02, Bài L03).",
    "Vì sao xoay secret lại gây gián đoạn? → Giải mã: Kết nối hiện có vẫn dùng bản cũ; không có cửa sổ đồng chạy thì bản cũ hết hạn là đứt (Bài L02).",
    "Làm sao để xoay mà không phải deploy lại? → Giải mã: Hàm giữ tên tham chiếu, lấy giá trị lúc chạy bằng quyền execution role, đệm ngắn thời hạn; Parameter Store cùng nguyên tắc, rẻ hơn cho cấu hình không cần xoay (Bài L02)."
  ],
  "predict": {
    "q": "Một hàm Lambda đọc secret từ Secrets Manager ở mỗi lần gọi. Điều gì xảy ra với độ trễ và với chi phí?",
    "a": "<p>Độ trễ tăng thêm một lời gọi mạng cho mỗi lần gọi hàm, thường vài chục mili giây, và chi phí API tăng theo số lần gọi. Cách đúng là đọc một lần ở pha khởi tạo và cache trong biến cấp module, chấp nhận rằng môi trường ấm sẽ dùng giá trị cũ cho tới khi bị thu hồi. Điều đó đặt ra một đánh đổi thật: secret mới xoay sẽ không được nhận ngay ở mọi môi trường đang ấm. Cách xử lý là cache kèm thời hạn ngắn, hoặc bắt lỗi xác thực rồi đọc lại secret một lần trước khi bỏ cuộc.</p>"
  },
  "anchor": "Secret trong biến môi trường bị đóng băng vào phiên bản cấu hình, nên xoay nó đòi hỏi deploy lại — còn secret đọc lúc chạy thì phải trả giá bằng độ trễ và bộ nhớ cache.",
  "attacks": [
    {
      "q": "Secrets Manager và Parameter Store khác nhau thế nào, chọn cái nào?",
      "a": "Parameter Store là dịch vụ cấu hình đa dụng: lưu chuỗi, danh sách, và cả giá trị mã hoá; và phù hợp cho cấu hình không nhạy cảm hoặc ít thay đổi. Secrets Manager sinh ra cho vòng đời secret: nó hỗ trợ xoay tự động theo lịch thông qua hàm Lambda, có tích hợp sẵn với một số dịch vụ database, và tính phí theo secret và theo lời gọi API. Quy tắc thực dụng: nếu bạn cần xoay tự động thì Secrets Manager; nếu chỉ cần lưu cấu hình và vài giá trị mã hoá thì Parameter Store rẻ hơn."
    },
    {
      "q": "Nếu secret bị lộ, ngoài việc xoay thì bạn còn phải làm gì?",
      "a": "Xoay chỉ đóng cửa sổ lộ trong tương lai; nó không xoá dấu vết. Cần làm thêm bốn việc: đọc log truy cập để biết secret đã bị dùng từ đâu và khi nào; thu hồi mọi phiên hoặc token đã phát hành dựa trên secret đó; kiểm tra xem secret có xuất hiện ở chỗ khác không — lịch sử commit, log, ảnh container, biến môi trường của những service khác; và thêm phát hiện tự động để secret không lọt vào log hoặc vào lịch sử phiên bản cấu hình lần nữa."
    }
  ],
  "q": "Đoạn mã Lambda dưới đây đọc mật khẩu database trực tiếp từ biến môi trường ở mỗi lần gọi. Điều gì không ổn về bảo mật và vận hành, và bạn sửa thế nào?",
  "oral": "Vấn đề là mật khẩu nằm trần trong biến môi trường, ai xem được cấu hình hàm là thấy, lại còn lộ trong ảnh chụp màn hình và bản sao cấu hình. Mỗi lần đổi mật khẩu bạn phải sửa cấu hình và triển khai lại toàn bộ hàm, gây gián đoạn và dễ quên chỗ. Cách sửa là chuyển bí mật ra dịch vụ quản lý chuyên dụng như Secrets Manager của AWS, hàm chỉ giữ tên tham chiếu và lấy giá trị lúc chạy bằng quyền của execution role. Với mật khẩu database cần xoay vòng, bạn dùng dịch vụ có xoay tự động để mật khẩu đổi định kỳ mà mã không phải sửa gì. Bạn cũng đệm giá trị trong môi trường ấm để không gọi lấy bí mật ở mọi request, vừa nhanh vừa tránh bị giới hạn tốc độ.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Secrets Manager</strong>: dịch vụ lưu và xoay bí mật của AWS; giống vault nội bộ có lịch đổi mật khẩu tự động.</li><li><strong>Biến môi trường</strong>: cặp khóa-giá trị gắn vào hàm lúc deploy; giống file .env nhưng nằm trong cấu hình hạ tầng.</li><li><strong>Rotation</strong>: đổi bí mật định kỳ hoặc khi nghi lộ; giống đổi mật khẩu database định kỳ.</li><li><strong>Execution role</strong>: quyền IAM mà hàm dùng để gọi dịch vụ khác; giống tài khoản service của ứng dụng.</li><li><strong>Cache trong môi trường ấm</strong>: giữ giá trị trong biến module giữa các lần gọi; giống biến global trong worker Celery.</li></ul><p>Mỗi lần xoay mật khẩu database bạn phải sửa cấu hình hàm rồi triển khai lại, có giai đoạn service đứt kết nối. Mật khẩu nằm trần trong biến môi trường nên vẫn đọc được từ lịch sử phiên bản dù đã đổi.</p><p>Trước Secrets Manager, bí mật sống trong file .env trên máy, trong biến môi trường của container, hoặc được người trực nhớ và bàn tay đổi. Mỗi lần lộ, quy trình là đổi mật khẩu, deploy lại mọi thứ, cầu cho không thiếu chỗ nào. Khi bí mật là <code>env var</code> của Lambda, nó bị đóng băng vào phiên bản cấu hình và lộ trong lịch sử deploy. <code>Secrets Manager</code> tách vòng đời bí mật khỏi vòng đời triển khai: dịch vụ giữ bí mật, lịch xoay sinh bản mới và cho bản cũ một cửa sổ thời gian để kết nối hiện có thoát an toàn, không phải deploy lại. Hàm chỉ giữ tên tham chiếu và lấy giá trị lúc chạy bằng quyền của execution role; đệm trong môi trường ấm kèm thời hạn ngắn để không gọi bí mật ở mọi request. <code>Parameter Store</code> cùng đóng vai tương tự cho cấu hình thường ít đổi, rẻ hơn; rẻ hơn và đủ cho cấu hình không cần xoay tự động.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L02, Bài L03.</p>",
  "code": "import os, psycopg2\n\ndef handler(event, context):\n    conn = psycopg2.connect(host=os.environ[\"DB_HOST\"], password=os.environ[\"DB_PASSWORD\"])\n    with conn.cursor() as cur:\n        cur.execute(\"SELECT 1\")\n        return {\"ok\": cur.fetchone()[0] == 1}",
  "expected": "Hàm vẫn chạy đúng nhưng mật khẩu lộ trần trong cấu hình và không xoay vòng được. Nguyên nhân gốc là bí mật bị nhúng vào biến môi trường thay vì lấy lúc chạy từ dịch vụ quản lý bằng execution role, nên đổi mật khẩu phải triển khai lại hàm và mọi bản sao cấu hình đều thành nơi lộ bí mật.",
  "followups": [
    {
      "q": "Bạn chọn giữa Secrets Manager và Parameter Store khi nào?",
      "a": "Bạn chọn Secrets Manager khi bí mật cần xoay vòng tự động như mật khẩu database, vì nó lo toàn bộ vòng đời sinh mới và chuyển tiếp mà mã không phải đổi. Bạn chọn Parameter Store cho cấu hình thường và bí mật ít đổi như cờ tính năng hay endpoint nội bộ, vì cách dùng đơn giản và chi phí thấp hơn. Với cả hai, bạn vẫn đệm giá trị trong môi trường ấm và chỉ cho execution role quyền đọc đúng tham số cần thiết. Quy tắc là xoay tự động thì Secrets Manager, còn lại Parameter Store là đủ."
    },
    {
      "q": "Bạn đệm bí mật trong Lambda thế nào mà vẫn nhận được bản xoay mới?",
      "a": "Bạn lưu giá trị bí mật trong biến toàn cục kèm thời điểm lấy, các lần gọi ấm dùng lại mà không gọi dịch vụ nữa. Bạn đặt thời gian sống cho đệm ngắn hơn chu kỳ xoay, hết hạn thì lần gọi tiếp theo lấy bản mới một lần rồi đệm tiếp. Khi xoay mật khẩu database, bạn giữ cửa sổ cả hai phiên bản cùng có hiệu lực để các đệm cũ không đứt đột ngột. Cách này vừa giảm độ trễ và số lần gọi, vừa bảo đảm bản mới lan ra toàn hệ thống trong thời gian có kiểm soát."
    }
  ],
  "pitfalls": [
    "Nhúng mật khẩu vào mã nguồn hay biến môi trường rồi đẩy lên kho chung và ảnh chụp cấu hình",
    "Gọi lấy bí mật ở mọi request gây chậm, tốn kém và dễ bị giới hạn tốc độ"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được vòng xoay mật khẩu tự động chuyển tiếp giữa bản cũ và bản mới thế nào",
    "Tôi có thể giải thích bằng ví dụ hàm đọc mật khẩu trần từ biến môi trường và cách chuyển sang dịch vụ quản lý",
    "Tôi có thể chuyển một hàm đang dùng mật khẩu cứng sang lấy bí mật lúc chạy kèm bộ đệm"
  ],
  "refs": [
    "aws-secrets"
  ],
  "say30": "Mật khẩu nằm trong biến môi trường bị đóng băng vào phiên bản cấu hình, nên xoay nó đòi deploy lại và gây gián đoạn. Cách đúng là chuyển bí mật ra dịch vụ quản lý chuyên dụng, hàm chỉ giữ tên tham chiếu và lấy giá trị lúc chạy bằng quyền của execution role. Với mật khẩu database cần xoay vòng, dùng dịch vụ có xoay tự động. Đệm giá trị trong môi trường ấm kèm thời hạn ngắn để không gọi lấy bí mật ở mọi request mà vẫn nhận được bản mới.",
  "say90": "Nhịp một: một service đọc mật khẩu database từ biến môi trường của hàm. Khi cần xoay mật khẩu, đội phải sửa cấu hình hàm và deploy lại, mất hai mươi phút và gây gián đoạn. Một lần xoay khẩn cấp vì nghi ngờ lộ, có mười hai phút service không kết nối được database. Ngoài ra mật khẩu nằm trong lịch sử phiên bản của hàm, nên vẫn đọc được sau khi đã đổi.\n\nNhịp hai: cách sửa là chuyển bí mật ra dịch vụ quản lý chuyên dụng, hàm chỉ giữ tên tham chiếu và lấy giá trị lúc chạy bằng quyền của execution role. Với mật khẩu database cần xoay vòng, dùng dịch vụ có xoay tự động, mật khẩu đổi định kỳ mà mã không phải sửa gì. Đệm giá trị trong môi trường ấm kèm thời hạn ngắn, các lần gọi ấm dùng lại mà không gọi dịch vụ, hết hạn thì lấy bản mới một lần rồi đệm tiếp. Với mật khẩu database, giữ cửa sổ cả hai phiên bản cùng có hiệu lực để các đệm cũ không đứt đột ngột.\n\nNhịp ba: đánh đổi là gọi lấy bí mật ở mọi request thì tốn độ trễ và chi phí API, dễ bị giới hạn tốc độ; giám sát bằng thời gian không kết nối được database khi xoay và số lần gọi API của dịch vụ quản lý bí mật theo thời gian (xem Bài L02 và Bài L03).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> xoay bí mật không cần deploy lại, gián đoạn giảm từ vài chục phút xuống gần như zero; lịch sử cấu hình không còn chứa bí mật trần.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> mỗi lần gọi thêm một lời mạng vài chục mili giây nếu không đệm; secret mới xoay không nhận ngay ở mọi môi trường ấm, phải chờ hết hạn đệm; dịch vụ quản lý bí mật thêm chi phí theo secret và theo lời gọi API (xem Bài L02).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> Parameter Store cho cấu hình không nhạy cảm hoặc ít thay đổi, rẻ hơn vì không có lịch xoay; hợp với cờ tính năng hay endpoint nội bộ.</li><li><strong>Phương án B:</strong> giữ bí mật trong biến môi trường khi mật khẩu không cần xoay và không lộ — chấp nhận deploy lại mỗi lần đổi; chỉ nên là ngoại lệ tạm thời, không phải thiết kế dài hạn (xem Bài L03).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> thời gian không kết nối được database kéo dài khi xoay mật khẩu; số lần gọi API của dịch vụ quản lý bí mật tăng bất thường, dấu hiệu không đệm hoặc đệm hết hạn liên tục; bí mật xuất hiện trong log hay lịch sử cấu hình.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra log có bí mật hay tham chiếu; đo thời gian từ lúc xoay tới lúc service kết nối lại; kiểm tra đệm có thời hạn và thời hạn có ngắn hơn chu kỳ xoay không (xem Bài L02).</li></ul>"
},
{
  "id": "G15",
  "group": "G",
  "topic": "CloudFront, caching và invalidation",
  "prio": "P1",
  "level": "L2",
  "type": "concept",
  "incident": "<p>Tình huống giả định: Ứng dụng phục vụ ảnh qua CloudFront trỏ tới bucket S3. Sau khi thay ảnh đại diện của một khách hàng, người dùng vẫn thấy ảnh cũ trong nhiều giờ. Đội xử lý bằng cách xóa toàn bộ cache mỗi lần có thay đổi. <strong>Hệ quả</strong> là hóa đơn tăng vì số lần invalidation vượt mức 1.000 đường dẫn miễn phí mỗi tháng, và mỗi lần xóa khiến tỉ lệ cache hit tụt mạnh.</p>",
  "askFirst": [
    "Vì sao ảnh cũ vẫn hiển thị dù file trên S3 đã đổi? → Giải mã: TTL của cache chưa hết, điểm biên vẫn trả bản sao cũ; nội dung đổi không tự xoá cache (Bài L20, Bài L22).",
    "Invalidate toàn bộ có tác dụng phụ gì? → Giải mã: Tỉ lệ trúng cache tụt, số request về gốc tăng, vượt ngưỡng miễn phí là có phí (Bài L20).",
    "Có cách nào để nội dung mới xuất hiện ngay mà không phải invalidate? → Giải mã: Mỗi deploy sinh đường dẫn mới chưa từng cache, hash trong tên file; invalidate chỉ cho trang chủ và bản vá (Bài L20)."
  ],
  "predict": {
    "q": "Một object trên S3 bị ghi đè bằng nội dung mới, nhưng giữ nguyên tên. CloudFront có tự phục vụ nội dung mới không?",
    "a": "<p>Không, cho tới khi hết TTL của object trong cache hoặc khi bạn invalidate đường dẫn đó. CloudFront đã giữ bản cũ và không kiểm tra lại S3 trước khi hết hạn. Cách tránh hẳn vấn đề là đặt tên object theo nội dung, tức thêm hash của file hoặc số phiên bản vào tên, rồi trỏ URL tới tên mới. Khi tên đổi, đó là một object chưa từng có trong cache, nên nội dung mới xuất hiện ngay mà không cần invalidate.</p>"
  },
  "anchor": "Cache khóa theo đường dẫn, nên đổi nội dung mà giữ nguyên tên thì bắt buộc phải chờ hết TTL hoặc invalidate. Đổi tên theo nội dung là cách xóa bỏ vấn đề.",
  "attacks": [
    {
      "q": "Khi nào invalidate là lựa chọn đúng?",
      "a": "Khi nội dung buộc phải giữ nguyên đường dẫn và cần cập nhật ngay, ví dụ trang chủ, tệp cấu hình cố định hoặc bản vá bảo mật cần phổ biến lập tức. Ngoài các trường hợp đó, invalidate nên là ngoại lệ vì hai lý do. Thứ nhất, nó xóa cache nên mọi request sau đó đều quay về nguồn, làm tăng tải lên S3 và độ trễ. Thứ hai, số lượng invalidation có thể tính phí. Với tài nguyên có tên theo nội dung như bundle JavaScript hay ảnh có hash, bạn gần như không bao giờ cần invalidate."
    },
    {
      "q": "Vì sao cần phân biệt TTL cho HTML và TTL cho tài nguyên tĩnh?",
      "a": "Vì hai loại có yêu cầu trái ngược nhau. Tài nguyên tĩnh có tên chứa hash nội dung thì đặt TTL rất dài, một năm cũng được, vì tên đổi mỗi khi nội dung đổi nên không bao giờ phục vụ nhầm bản cũ. HTML thì ngược lại: nó trỏ tới các tài nguyên đó, nên cần TTL ngắn hoặc phải xác thực lại. Nếu không, người dùng sẽ tiếp tục nhận HTML cũ trỏ tới những tệp không còn tồn tại. Nhầm hai loại này gây ra cả hai kiểu sự cố: người dùng thấy bản cũ mãi, hoặc mỗi lần tải trang đều phải quay về nguồn."
    }
  ],
  "q": "Hãy giải thích CloudFront phân phối nội dung thế nào, khi nào bạn bật cache và khi nào phải chủ động xóa cache?",
  "oral": "CloudFront là mạng phân phối nội dung có các điểm hiện diện khắp nơi, đứng gần người dùng thay vì để ai cũng phải về máy chủ gốc. Khi có request, điểm gần nhất kiểm tra xem đã có bản sao chưa. Nếu có và còn hạn thì trả ngay, nhanh và giảm tải cho máy chủ gốc. Nếu chưa có hoặc đã hết hạn, điểm đó về gốc lấy một lần rồi giữ lại cho các request sau. Bạn bật cache cho nội dung ít đổi như ảnh, file tĩnh và trang công khai để vừa nhanh vừa rẻ. Với nội dung đổi theo từng người dùng hay dữ liệu thời gian thực, bạn tắt cache hoặc để cache rất ngắn để không phục vụ nhầm dữ liệu cũ. Khi file tĩnh đổi trước hạn, bạn phải chủ động xóa cache để các điểm hiện diện lấy bản mới.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>CloudFront và điểm biên</strong>: mạng CDN giữ bản sao nội dung ở các điểm gần người dùng; request hỏi điểm gần nhất trước khi về máy gốc, giống trạm hàng xóm bán trước, hết thì về nhà máy.</li><li><strong>TTL của cache</strong>: thời gian bản sao được coi là mới; hết hạn thì điểm biên về máy gốc lấy bản mới, nội dung đổi nhưng TTL chưa hết thì người dùng vẫn thấy bản cũ.</li><li><strong>Invalidation</strong>: lệnh xoá chủ động bản cache, có phí khi vượt ngưỡng miễn phí mỗi tháng; như gọi hàng xóm mang về trả kho, trả phí, nên dùng cho trang chủ hay bản vá, không dùng cho mọi lần deploy.</li></ul><p><strong>Ảnh đại diện mới đã thay xong mà ảnh cũ vẫn hiện suốt nhiều giờ.</strong> Đội chữa bằng cách xóa toàn bộ cache mỗi lần đổi file. Hệ quả là tỉ lệ trúng cache tụt mạnh và số lần xóa nhanh chóng vượt ngưỡng phát sinh phí mỗi tháng.</p><p><strong>Trước CDN, mọi người dùng đều phải về máy chủ gốc.</strong> Thay đổi hiện ra ngay, nhưng tải dồn hết lên gốc. Khi CDN ra đời, cái giá phải trả là bài toán \"tên nào đang ở cache, nội dung nào còn hạn\", và CloudFront là dịch vụ CDN của AWS giải quyết bài toán đó. <code>CloudFront</code> đặt các điểm biên gần người dùng, mỗi điểm giữ một bản sao.</p><ul><li><strong>Khóa cache</strong>: điểm biên so đường dẫn và một phần header với bản đã giữ. Trúng và còn hạn thì trả ngay.</li><li><strong>Trượt</strong>: điểm biên về gốc lấy một lần rồi giữ theo TTL.</li><li><strong>Invalidation</strong>: xóa cache chủ động, dùng cho trường hợp khẩn.</li></ul><p><strong>Cách loại hẳn vấn đề là đặt tên file theo nội dung.</strong> Mỗi lần triển khai sinh đường dẫn mới chưa từng được cache, nên người dùng nhận bản mới ngay. Invalidation chỉ là ngoại lệ, dùng cho trang chủ, bản vá bảo mật cần phổ biến ngay, hoặc tài nguyên giữ tên cố định. Phần xử lý phía sau biên, nếu cần chọn giữa Lambda và ECS, xem so sánh ở G16.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L20, Bài L22.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Vì sao đặt tên file theo phiên bản tốt hơn xóa cache thủ công?",
      "a": "Mỗi lần triển khai sinh một tên file mới chứa mã phiên bản, nên đường dẫn mới chưa từng được cache và người dùng tự động nhận bản mới mà không cần lệnh xóa nào. Cách này loại bỏ cửa sổ người dùng thấy bản cũ trong lúc lệnh xóa đang lan, và không phát sinh phí xóa. Bạn chỉ dùng lệnh xóa cho trường hợp khẩn như gỡ nội dung sai. Luồng triển khai thường ngày chỉ cần tên file theo phiên bản, đây là thói quen chuẩn của pipeline frontend hiện đại."
    },
    {
      "q": "Bạn tránh phục vụ nhầm dữ liệu cá nhân từ cache thế nào?",
      "a": "Bạn tách khóa cache giữa nội dung công khai và nội dung cá nhân, và không bao giờ cache phản hồi chứa thông tin riêng của từng người dùng. Với API cần đăng nhập, bạn tắt cache hoặc đưa mã người dùng vào khóa để mỗi người chỉ thấy phần của mình. Bạn cũng kiểm tra header mà gốc trả về, để chắc phản hồi cá nhân không bị đánh dấu là cache công khai. Quy tắc là thà không cache còn hơn cache nhầm dữ liệu của người này cho người khác."
    }
  ],
  "pitfalls": [
    "Cache phản hồi có dữ liệu cá nhân khiến người này thấy dữ liệu của người khác",
    "Đổi file tĩnh mà quên xóa cache khiến người dùng mãi thấy bản cũ dù gốc đã mới"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được khóa cache gộp đường dẫn và header để quyết định trúng hay trượt thế nào",
    "Tôi có thể giải thích bằng ví dụ đổi ảnh sản phẩm và phải xóa cache đúng đường dẫn đó",
    "Tôi có thể cấu hình cache cho file tĩnh và tắt cache cho API cá nhân của một web thật"
  ],
  "refs": [
    "aws-cloudfront",
    "aws-s3"
  ],
  "say30": "CloudFront giữ bản sao nội dung ở điểm biên gần người dùng, nhưng cache khóa theo đường dẫn, nên đổi nội dung mà giữ nguyên tên thì bắt buộc phải chờ hết TTL hoặc invalidate. Cách tránh hẳn vấn đề là đặt tên object theo nội dung, thêm hash hay số phiên bản vào tên, rồi trỏ URL tới tên mới. Khi tên đổi, đó là object chưa từng có trong cache, nội dung mới xuất hiện ngay mà không cần invalidate, không phát sinh phí xóa.",
  "say90": "Nhịp một: ứng dụng phục vụ ảnh qua CDN trỏ tới bucket lưu trữ. Sau khi thay ảnh đại diện, người dùng vẫn thấy ảnh cũ trong nhiều giờ. Đội xử lý bằng cách xóa toàn bộ cache mỗi lần có thay đổi, hóa đơn tăng vì số lần xóa vượt mức miễn phí, và mỗi lần xóa khiến tỉ lệ cache hit tụt mạnh. Nỗi đau thật là đội không hiểu cache khóa theo đường dẫn, nên đổi nội dung giữ nguyên tên không tự xóa cache.\n\nNhịp hai: cách đúng là đặt tên object theo nội dung, thêm hash của file hay số phiên bản vào tên, rồi trỏ URL tới tên mới. Khi tên đổi, đó là một object chưa từng có trong cache, nội dung mới xuất hiện ngay mà không cần lệnh xóa nào, không phát sinh phí. Invalidate chỉ nên dùng cho trường hợp nội dung buộc phải giữ nguyên đường dẫn và cần cập nhật ngay, ví dụ trang chủ hay tệp cấu hình cố định hay bản vá bảo mật. Với tài nguyên có tên theo nội dung như bundle JavaScript hay ảnh có hash, gần như không bao giờ cần invalidate.\n\nNhịp ba: đánh đổi là hai loại nội dung có yêu cầu trái ngược nhau: tài nguyên tĩnh có tên theo nội dung thì đặt TTL rất dài, HTML thì cần TTL ngắn vì nó trỏ tới các tài nguyên đó; giám sát bằng tỉ lệ cache hit và số lần invalidation theo thời gian (xem Bài L20 và Bài L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> đặt tên theo nội dung loại bỏ hoàn toàn cửa sổ người dùng thấy bản cũ, không phát sinh phí invalidate, tỉ lệ cache hit ổn định.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> pipeline deploy phải sinh tên có hash, thêm bước vào build; invalidate toàn bộ vẫn là ngoại lệ và có phí khi vượt ngưỡng miễn phí; HTML với TTL dài thì người dùng nhận bản cũ trỏ tới tệp không còn tồn tại (xem Bài L20).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> invalidate đường dẫn cụ thể khi nội dung buộc giữ nguyên tên và cần cập nhật ngay, ví dụ trang chủ hay bản vá bảo mật; chi phí là xóa cache làm mọi request sau quay về nguồn và có phí khi vượt ngưỡng.</li><li><strong>Phương án B:</strong> tắt cache hoàn toàn cho nội dung cá nhân, chỉ cache nội dung công khai; hợp khi nội dung đổi theo từng người dùng, không cache là an toàn nhất (xem Bài L20).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> tỉ lệ cache hit tụt mạnh sau mỗi lần invalidate; người dùng báo thấy bản cũ nhiều giờ sau deploy; hóa đơn CDN tăng do vượt mức miễn phí.</li><li><strong>Cách kiểm chứng nhanh:</strong> so tên file trên CDN với tên trong bucket, xác nhận có hash hay không; kiểm tra TTL của HTML và tài nguyên tĩnh; theo dõi số invalidation mỗi tháng so với ngưỡng miễn phí (xem Bài L20).</li></ul>"
},
{
  "id": "G16",
  "group": "G",
  "topic": "Lambda và container ECS: chọn theo workload",
  "prio": "P1",
  "level": "L2",
  "type": "concept",
  "incident": "<p>Tình huống giả định: Một đội chuyển dịch vụ từ Lambda sang ECS vì hóa đơn Lambda tăng. Dịch vụ xử lý khoảng 40 request mỗi giây suốt ngày, mỗi request mất khoảng 900 ms và mở một kết nối tới PostgreSQL. <strong>Kết quả</strong> là hóa đơn giảm 35% và p99 cũng giảm vì không còn cold start. Nhưng ở một dịch vụ khác, xử lý ảnh theo đợt và có lúc không có request nào trong nhiều giờ, việc chuyển sang ECS lại làm chi phí tăng gấp ba.</p>",
  "askFirst": [
    "Đặc điểm tải nào quyết định chi phí của mỗi lựa chọn? → Giải mã: Tải đều cao thì container rẻ vì trả thời gian cố định; tải đợt thì Lambda rẻ vì không trả khi không có việc (Bài L03, Bài L08).",
    "Vấn đề kết nối database khác nhau thế nào giữa hai mô hình? → Giải mã: Lambda: mỗi container giữ kết nối, nhân theo concurrency; container: pool ổn định, không nhân; RDS Proxy giải quyết bên Lambda (Bài L08).",
    "Khi nào cold start thực sự là vấn đề nghiêm trọng? → Giải mã: Khi p99 bị giới hạn chặt và mọi request đều lần đầu; tải đều thì container không có cold start (Bài L03)."
  ],
  "predict": {
    "q": "Một dịch vụ có lưu lượng rất thấp và không đều, nhưng mỗi request cần 2 GB bộ nhớ và chạy 40 giây. Lambda hay ECS?",
    "a": "<p>Lambda thường thắng, vì bạn chỉ trả tiền cho thời gian chạy thực tế và không phải giữ máy nhàn rỗi. Bộ nhớ lớn làm mỗi lần gọi đắt hơn, nhưng tần suất thấp nên tổng chi phí vẫn nhỏ. Thời gian 40 giây nằm trong giới hạn của Lambda. Ba điều cần kiểm tra là thời gian khởi tạo có vượt ngân sách độ trễ không, có cần kết nối database thường trực không, và công việc có cần chạy lâu hơn giới hạn của Lambda không. Nếu cả ba đều ổn thì Lambda rẻ hơn và ít việc vận hành hơn.</p>"
  },
  "anchor": "Lambda thắng khi tải thưa và không đều vì bạn chỉ trả cho thời gian chạy. Container thắng khi tải đều và cao vì bạn trả cho một công suất cố định nhưng dùng hết nó.",
  "attacks": [
    {
      "q": "Vấn đề kết nối database khác nhau thế nào giữa Lambda và ECS?",
      "a": "Container có số thực thể biết trước, nên số kết nối tới database bị chặn trên bởi số container nhân với kích thước connection pool, và con số này do bạn chọn. Lambda thì số thực thể đồng thời thay đổi theo tải, có thể từ vài chục lên hàng nghìn, và mỗi môi trường mở kết nối riêng. Vì vậy Lambda dễ làm cạn hạn mức kết nối của database. Cách xử lý thường dùng là đặt một lớp gộp kết nối ở giữa như RDS Proxy, giới hạn concurrency của Lambda, hoặc dùng API dữ liệu thay vì kết nối trực tiếp."
    },
    {
      "q": "Cold start có luôn là vấn đề cần loại bỏ?",
      "a": "Không. Nó chỉ là vấn đề khi ngân sách độ trễ của nghiệp vụ chặt và lưu lượng thưa, ví dụ một API tương tác có p99 mục tiêu 200 ms. Với một job chạy nền, một cold start thêm 800 ms là không đáng kể so với tổng thời gian xử lý. Với lưu lượng cao liên tục, tỉ lệ cold start rất nhỏ vì môi trường được tái dùng. Cách đối phó cũng có thứ tự: trước hết giảm khối lượng khởi tạo và đưa dependency nặng ra khỏi đường nóng, rồi mới cân nhắc provisioned concurrency, vì đó là giải pháp trả tiền để giữ môi trường sẵn sàng."
    }
  ],
  "q": "Hãy so sánh Lambda với container chạy trên ECS, và cho biết khi nào bạn chọn mỗi bên cho một workload cụ thể?",
  "oral": "Lambda hợp với tác vụ ngắn, chạy theo sự kiện và lưu lượng thất thường, vì bạn không quản lý máy chủ và chỉ trả cho thời gian chạy thật. Lambda giống một worker được dựng lên cho từng request rồi tắt đi. Container trên ECS hợp với tiến trình chạy liên tục, tác vụ dài hàng giờ, và ứng dụng cần kiểm soát môi trường sâu như kết nối bám dính hay bộ nhớ lớn. Điểm quyết định không phải công nghệ nào mới hơn, mà là hình dạng workload: thời gian chạy, trạng thái và lưu lượng. Nhiều hệ thống thật dùng cả hai, ví dụ API thất thường chạy Lambda còn worker nền chạy dài trên ECS. Khi workload đổi hình dạng, bạn chuyển bên chứ không cố ép một bên làm việc của bên kia.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Lambda</strong>: chạy code theo sự kiện, trả tiền theo thời gian chạy thật; như gọi thợ mỗi khi có việc, không trả lương khi ngồi chờ.</li><li><strong>Container trên ECS</strong>: container chạy liên tục, trả tiền theo thời gian chạy; như thuê mặt bằng cố định dù ít khách, hợp việc đều đặn và dài.</li><li><strong>Cold start</strong>: lần chạy đầu trên môi trường mới, nền tảng dựng environment, tải gói, khởi runtime; độ trễ chỉ ở lần đầu, nên tải đều cao thì chạy trên container, tải đợt thì Lambda rẻ hơn.</li></ul><p><strong>Một service chuyển từ Lambda sang container và hóa đơn giảm.</strong> p99 cũng giảm vì hết cold start, bởi tải của nó đều đặn và cao suốt ngày. Service khác xử lý ảnh theo đợt, có lúc không có request nào trong nhiều giờ. Chuyển nó sang container lại khiến chi phí tăng hẳn.</p><p><strong>Mô hình cũ là trả tiền cho máy đang bật, dù có việc hay không.</strong> <code>Lambda</code> đảo ngược bài toán: bạn trả theo lần gọi và thời gian chạy, không giữ gì ở chế độ chờ. Khi tải thưa và không đều, mô hình này thắng. <code>ECS</code> là cách chạy container được chuẩn hóa: bạn đóng gói ứng dụng, đặt số lượng tác vụ muốn chạy, và trả cho công suất đã đặt dù tải có lên hay không. Khi tải đều và cao, trả cho công suất giữ sẵn rẻ hơn trả theo lần gọi.</p><ul><li><strong>Lambda</strong>: có trần thời gian cho mỗi lần gọi và không giữ trạng thái giữa các lần gọi.</li><li><strong>ECS</strong>: container chạy bao lâu tùy bạn và có thể giữ trạng thái suốt vòng đời.</li></ul><p><strong>Hai mô hình này thường đi cùng nhau.</strong> API thất thường chạy trên Lambda, còn job dài lấy việc từ hàng đợi và chạy trên container.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L03, Bài L08.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Dấu hiệu nào cho thấy bạn đang ép sai workload vào Lambda?",
      "a": "Dấu hiệu rõ nhất là Lambda thường xuyên chạy sát timeout, và bạn chỉ còn cách tăng giới hạn thay vì xử lý nhanh hơn. Tiếp theo là chi phí tăng vọt vì Lambda chạy lâu với bộ nhớ lớn, trong khi container luôn bật lại rẻ hơn. Các triệu chứng khác gồm retry hỗn loạn vì tác vụ dài bị cắt giữa chừng, và mã đầy logic chia nhỏ tạm bợ. Khi thấy ba dấu hiệu này, bạn tách tác vụ dài sang container thay vì tiếp tục vá Lambda."
    },
    {
      "q": "Khi nào bạn chạy cả hai trong cùng một hệ thống?",
      "a": "Bạn chạy cả hai khi hệ thống có nhiều hình dạng workload khác nhau, ví dụ API thất thường nhận request bằng Lambda rồi đẩy job nặng vào hàng đợi cho container ECS xử lý. Lambda lo phần co giãn nhanh ở cửa, còn container lo phần chạy bền ở phía sau, và hai bên giao tiếp qua hàng đợi và sự kiện. Mỗi bên làm đúng việc mình giỏi thay vì ép một bên gánh cả hai. Điều kiện là bạn vẽ ranh giới rõ theo thời gian chạy và trạng thái, không để logic nhảy qua lại tùy tiện."
    }
  ],
  "pitfalls": [
    "Chọn công nghệ theo sở thích thay vì theo thời gian chạy, trạng thái và hình dạng lưu lượng",
    "Nhồi tác vụ dài vào Lambda rồi vá bằng cách tăng timeout thay vì chuyển sang container"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được mô hình trả tiền theo lần gọi của Lambda khác gì trả tiền giữ tài nguyên của container",
    "Tôi có thể giải thích bằng ví dụ API thất thường chạy Lambda còn job encode hàng giờ chạy ECS",
    "Tôi có thể đề xuất Lambda hay ECS cho một workload mới dựa trên thời gian chạy và lưu lượng của nó"
  ],
  "refs": [
    "aws-ecs",
    "aws-lambda-best"
  ],
  "say30": "Lambda hợp với tác vụ ngắn, chạy theo sự kiện và lưu lượng thất thường, vì bạn không quản lý máy chủ và chỉ trả cho thời gian chạy thật. Container trên ECS hợp với tiến trình chạy liên tục, tác vụ dài và ứng dụng cần kiểm soát môi trường sâu như kết nối bám dính hay bộ nhớ lớn. Điểm quyết định không phải công nghệ nào mới hơn, mà là hình dạng workload: thời gian chạy, trạng thái và lưu lượng.",
  "say90": "Nhịp một: một đội chuyển dịch vụ từ Lambda sang container vì hóa đơn tăng. Dịch vụ xử lý bốn mươi request mỗi giây suốt ngày, mỗi request mất chín trăm mili giây và mở kết nối tới database. Kết quả là hóa đơn giảm ba mươi lăm phần trăm và p99 cũng giảm vì không còn cold start. Nhưng ở dịch vụ khác, xử lý ảnh theo đợt và có lúc không có request nào trong nhiều giờ, việc chuyển sang container lại làm chi phí tăng gấp ba. Chọn sai hình dạng là trả giá cả hai chiều.\n\nNhịp hai: Lambda chỉ trả tiền cho thời gian chạy thực tế và không phải giữ máy nhàn rỗi, nên tải thưa và không đều là lợi thế của nó. Container trả tiền theo thời gian chạy liên tục, hợp khi tải đều và cao vì bạn trả một công suất cố định nhưng dùng hết nó. Với Lambda, số thực thể đồng thời thay đổi theo tải, mỗi môi trường mở kết nối database riêng, nên dễ làm cạn hạn mức kết nối; container có số thực thể biết trước, pool ổn định không nhân theo tải. Cold start chỉ là vấn đề thật khi ngân sách độ trễ chặt và lưu lượng thưa, với job nền thì thêm tám trăm mili giây không đáng kể.\n\nNhịp ba: đánh đổi là Lambda chạy lâu với bộ nhớ lớn thì chi phí tăng vọt, container cho tải thưa thì trả gấp ba; giám sát bằng thời gian chạy trung bình, tỉ lệ cold start, số kết nối database và chi phí theo tuần (xem Bài L03 và Bài L08).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> Lambda cho tải thưa: không trả tiền khi không có việc, khởi tạo nhanh khi lưu lượng bật lên; container cho tải đều cao: không có cold start, kết nối database ổn định, bộ nhớ lớn hơn.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> Lambda: tác vụ dài sát timeout, bộ nhớ lớn làm chi phí tăng vọt, kết nối database nhân theo concurrency; container: tải thưa thì trả gấp ba, phải quản lý máy chủ và pool kết nối (xem Bài L08).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> chạy cả hai trong cùng hệ thống: Lambda nhận request ở cửa, đẩy job nặng vào hàng đợi cho container xử lý; mỗi bên làm đúng việc mình giỏi, ranh giới theo thời gian chạy và trạng thái.</li><li><strong>Phương án B:</strong> dùng RDS Proxy cho Lambda khi kết nối database là vấn đề, giới hạn concurrency hoặc dùng API dữ liệu thay vì kết nối trực tiếp; không phải chuyển sang container ngay (xem Bài L08).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> Lambda thường xuyên chạy sát timeout; chi phí Lambda tăng vọt với bộ nhớ lớn; cold start chiếm tỉ lệ cao ở p99; số kết nối database của Lambda vượt hạn mức.</li><li><strong>Cách kiểm chứng nhanh:</strong> so thời gian chạy trung bình và tỉ lệ cold start của Lambda với chi phí container chạy cùng tải; kiểm tra số kết nối database đang mở và giới hạn (xem Bài L08).</li></ul>"
},
{
  "id": "G17",
  "group": "G",
  "topic": "IaC và CloudFormation: giá trị, quy trình, rollback",
  "prio": "P1",
  "level": "L2",
  "type": "situation",
  "incident": "<p>Tình huống giả định: Một đội quản lý hạ tầng bằng cách bấm tay trên console. Trong một lần sửa security group để mở tạm một cổng cho việc gỡ lỗi, không ai ghi lại. Ba tháng sau, kiểm tra bảo mật phát hiện cổng đó vẫn mở. <strong>Hệ quả</strong> là không ai biết ai đã mở, khi nào, và có thứ gì khác phụ thuộc vào nó không. Dựng lại môi trường staging từ đầu mất ba ngày.</p>",
  "askFirst": [
    "Giá trị thật của hạ tầng dưới dạng code là gì? → Giải mã: Mô tả trạng thái mong muốn, nền tảng so với thực tế rồi tạo sửa xóa theo chênh lệch; mã được version nên review được (Bài L22).",
    "Điều gì xảy ra khi ai đó sửa tay trên console? → Giải mã: Lệch môi trường không ai hay, không ai dựng lại được; mỗi lần so với code là phát hiện chệch, phải đưa mọi thay đổi qua code (Bài L22).",
    "Làm sao đưa một hệ thống đang chạy vào quản lý bằng code mà không gây sự cố? → Giải mã: Dùng lệnh xuất hiện trạng thái hiện tại thành code làm điểm khởi đầu, sau đó mọi thay đổi chỉ qua code (Bài L22)."
  ],
  "predict": {
    "q": "Một stack đã được triển khai bằng CloudFormation, sau đó ai đó sửa tay một security group trên console. Lần cập nhật stack tiếp theo có đưa thay đổi đó về như khai báo không?",
    "a": "<p>Không tự động. <strong>CloudFormation so sánh template mới với template cũ</strong>, không so với trạng thái thật trên console. Nếu template không đổi property đó thì thay đổi tay vẫn còn nguyên sau khi deploy. Muốn biết có lệch hay không, bạn chạy lệnh detect-stack-drift rồi xem describe-stack-resource-drifts để thấy từng tài nguyên lệch ở đâu.</p><p><strong>Nếu bạn sửa đúng property đó trong template</strong> sang giá trị khác, bản cập nhật sẽ ghi giá trị khai báo đè lên chỉnh sửa tay. Đây vừa là điểm mạnh vừa là bẫy: khi mọi người quen sửa tay, lệch cấu hình tích tụ và stack không báo gì cho tới khi có người chạy drift detection.</p>"
  },
  "anchor": "IaC biến cấu hình thành thứ đọc được, so sánh được và hoàn tác được, nhưng chỉ khi mọi thay đổi đều đi qua nó.",
  "attacks": [
    {
      "q": "Làm sao đưa một hệ thống đang chạy vào quản lý bằng code mà không gây sự cố?",
      "a": "Làm theo từng phần, không làm một lần. Bạn bắt đầu bằng việc import những tài nguyên ít rủi ro và ít thay đổi như bucket, hàng đợi hay bảng, rồi xác nhận template mô tả đúng trạng thái hiện có trước khi áp dụng. Sau đó mới tới các phần có thay đổi gây gián đoạn, như database hay phân phối. Quan trọng nhất là bật phát hiện trôi dạt cấu hình ngay từ đầu để biết chỗ nào đang lệch. Đồng thời đóng quyền sửa tay trên console bằng chính sách IAM, vì nếu không thì hai nguồn sự thật cùng tồn tại và không ai biết cái nào đúng."
    },
    {
      "q": "CloudFormation rollback có phải lúc nào cũng cứu được bạn?",
      "a": "Không. Rollback hoàn tác được những thay đổi nó đã thực hiện, nhưng có những việc không hoàn tác được: một migration database đã chạy, một bucket đã bị xoá cùng dữ liệu, một hàng đợi đã mất message, hoặc một thay đổi đã lan ra ngoài stack. Nếu chính quá trình rollback thất bại, stack có thể kẹt ở trạng thái cần can thiệp thủ công. Vì vậy các thay đổi phá huỷ phải tách thành bước riêng, có xác nhận, và có phương án sao lưu dữ liệu trước khi chạy."
    }
  ],
  "q": "Một đội đang cấu hình AWS bằng tay trên bảng điều khiển và hay gặp sự cố lệch môi trường. Bạn thuyết phục họ dùng IaC với CloudFormation thế nào, gồm quy trình và rollback?",
  "oral": "Vấn đề của cấu hình tay là không ai biết môi trường đang có gì. Dev chạy được nhưng production sập vì thiếu một quyền mà ai đó quên mở. IaC biến hạ tầng thành mã có version như mã ứng dụng. Mọi thay đổi đi qua review, và ai cũng xem được lịch sử ai đổi gì, khi nào. Quy trình chuẩn là viết template khai báo tài nguyên, review như review mã, rồi triển khai thử ở môi trường kiểm thử trước khi áp lên production từng bước có kiểm tra. Khi triển khai lỗi, CloudFormation tự rollback về trạng thái ổn định trước đó, thay vì để môi trường kẹt nửa chừng. Nhờ vậy môi trường nào cũng dựng lại giống hệt nhau từ cùng một mã.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>IaC</strong>: viết tắt của Infrastructure as Code, tức hạ tầng khai báo bằng mã; giống migration của Django nhưng cho hạ tầng.</li><li><strong>CloudFormation</strong>: dịch vụ IaC của AWS, đọc template để tạo và cập nhật tài nguyên; giống docker-compose cho hạ tầng AWS.</li><li><strong>Template</strong>: file khai báo trạng thái mong muốn của tài nguyên; giống models.py nhưng cho hạ tầng.</li><li><strong>Stack</strong>: nhóm tài nguyên được tạo và quản lý cùng nhau từ một template; giống một app Django được migrate như một khối.</li><li><strong>Drift</strong>: trạng thái thật lệch khỏi template, thường do sửa tay; giống code đã sửa trên server mà không commit.</li><li><strong>Rollback</strong>: quay về trạng thái ổn định trước khi lỗi; giống git revert nhưng áp dụng cho hạ tầng.</li><li><strong>Security group</strong>: tường lửa gắn vào tài nguyên, kiểm soát cổng và nguồn được vào ra; giống iptables cho từng máy.</li></ul><p><strong>Cổng mở tạm để gỡ lỗi nằm suốt nhiều tháng.</strong> Không ai hay biết cho tới đợt kiểm tra bảo mật. Không ai biết ai mở, khi nào, và thứ gì đang phụ thuộc vào nó. Dựng lại môi trường kiểm thử từ đầu mất nhiều ngày.</p><p><strong>Trước IaC, hạ tầng nằm trong đầu người trực.</strong> Ai biết thì biết, và mỗi lần môi trường sập đội mất nhiều tuần để dựng lại từ console. Thiếu tài liệu chưa phải vấn đề lớn nhất. Vấn đề thật là không có thứ gì để so sánh: không biết hiện trạng lệch bao xa, và không ai chịu trách nhiệm cho trạng thái đó.</p><p><strong>IaC biến trạng thái thành mã.</strong> Mã có thể so diff, chạy test và version. <code>CloudFormation</code> là cách AWS hiện thực điều đó: bạn khai báo trạng thái mong muốn, nền tảng so với thực tế rồi tạo, sửa hoặc xóa theo đúng chênh lệch. Mỗi lần triển khai sinh bản xem trước thay đổi, và khi lỗi thì <code>rollback</code> tự động về mốc ổn định trước đó.</p><p><strong>Mã được version thì review được.</strong> Còn bấm tay biến mỗi môi trường thành một bản duy nhất không ai dựng lại được. IaC chỉ đúng khi mọi thay đổi đều đi qua nó.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L22.</p>",
  "code": "AWSTemplateFormatVersion: \"2010-09-09\"\nDescription: Order queue stack\nResources:\n  OrderQueue:\n    Type: AWS::SQS::Queue\n    Properties:\n      # Thời gian khóa message khi consumer đang xử lý, phải lớn hơn thời gian xử lý thực tế\n      VisibilityTimeout: 60\n      # ✅ Cách làm chuẩn: message lỗi quá 5 lần sẽ chuyển sang DLQ thay vì quay lại hàng đợi mãi\n      RedrivePolicy:\n        deadLetterTargetArn: !GetAtt OrderDLQ.Arn\n        maxReceiveCount: 5\n  OrderDLQ:\n    Type: AWS::SQS::Queue\n    Properties:\n      # Đặt tên cố định, nhưng đổi tên về sau sẽ thay thế tài nguyên\n      QueueName: orders-dlq\n",
  "expected": "Hành vi là CloudFormation tạo hai hàng đợi SQS, theo tài liệu CloudFormation. Phân tích: OrderQueue có RedrivePolicy trỏ tới deadLetterTargetArn: !GetAtt OrderDLQ.Arn. Phép GetAtt tạo phụ thuộc ngầm, nên CloudFormation tạo OrderDLQ trước rồi mới tới OrderQueue, và gán ARN thật vào RedrivePolicy. maxReceiveCount: 5 nghĩa là message nhận thất bại quá 5 lần mà chưa bị xoá sẽ chuyển sang DLQ. VisibilityTimeout: 60 phải lớn hơn thời gian xử lý thực tế của consumer, nếu không message hiện lại giữa lúc đang xử lý và bị giao trùng. QueueName: orders-dlq là thuộc tính thay thế tài nguyên khi đổi: sửa nó về sau nghĩa là CloudFormation tạo hàng đợi mới thay vì sửa tại chỗ, và tên hàng đợi phải duy nhất trong account và region. Rollback: khi tạo stack thất bại, CloudFormation rollback và xoá các tài nguyên nó đã tạo. Khi update thất bại, stack chuyển sang UPDATE_ROLLBACK_IN_PROGRESS rồi UPDATE_ROLLBACK_COMPLETE: tài nguyên thêm mới trong lần update đó bị xoá, tài nguyên bị sửa được khôi phục về giá trị của template trước, tài nguyên bị xoá được tạo lại nếu có thể. Điểm phải nhớ là rollback không phải viên đạn bạc. Nếu một tài nguyên không thể khôi phục trạng thái cũ, ví dụ đổi tên bảng DynamoDB hoặc xoá dữ liệu, stack kẹt ở UPDATE_ROLLBACK_FAILED và phải xử lý tay bằng ContinueUpdateRollback. Với hàng đợi, xoá rồi tạo lại sẽ làm mất message đang chờ, nên production phải tách stack và áp thay đổi có kiểm soát. Mọi tài nguyên tạo bằng template mà sau đó bị sửa tay sẽ tạo drift, khiến lần triển khai sau ghi đè hoặc lỗi.",
  "followups": [
    {
      "q": "Vì sao vừa dùng IaC vừa sửa tay là thói quen nguy hiểm nhất?",
      "a": "Sửa tay khiến thực tế lệch khỏi mẫu mà không ai ghi lại, lần triển khai IaC tiếp theo hoặc ghi đè mất chỗ sửa tay gây sập, hoặc bị kẹt vì thực tế không còn như mẫu tưởng. Đội rơi vào vòng nghi ngờ lẫn nhau vì không biết đâu mới là sự thật. Quy tắc là mọi thay đổi bền vững đều đi qua mã, thao tác tay chỉ cho thử nghiệm dùng một lần. Nếu buộc phải sửa tay lúc cháy, bạn phải cập nhật ngược vào mẫu ngay sau sự cố."
    },
    {
      "q": "Bạn chia stack thế nào khi hệ thống lớn dần?",
      "a": "Bạn tách theo ranh giới dịch vụ và vòng đời thay đổi, ví dụ mạng riêng một stack ít đổi, còn hàng đợi và Lambda riêng một stack đổi thường xuyên. Stack nhỏ giúp triển khai nhanh, lỗi một chỗ không chặn cả hệ thống và rollback gọn trong phạm vi hẹp. Bạn xuất các giá trị cần chia sẻ giữa các stack qua tham chiếu tường minh thay vì ghi cứng. Khi tách, bạn giữ mỗi stack đủ nhỏ để một người hiểu hết trong một buổi."
    }
  ],
  "pitfalls": [
    "Vừa dùng IaC vừa sửa tay khiến mẫu và thực tế lệch nhau rồi lần triển khai sau ghi đè gây sập",
    "Nhồi mọi môi trường và mọi dịch vụ vào một mẫu khổng lồ khiến triển khai chậm và rollback rủi ro"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được CloudFormation so sánh mẫu với thực tế và rollback từng bước thế nào",
    "Tôi có thể giải thích bằng ví dụ thêm hàng đợi kèm DLQ qua mẫu và rollback tự động khi lỗi",
    "Tôi có thể viết một mẫu CloudFormation cho hàng đợi và Lambda của một dịch vụ nhỏ"
  ],
  "refs": [
    "aws-cfn"
  ],
  "say30": "IaC biến cấu hình hạ tầng thành mã có version, mọi thay đổi đi qua review và có lịch sử ai đổi gì khi nào. CloudFormation so sánh template mới với template cũ để tạo sửa xóa theo chênh lệch, nhưng không so với trạng thái thật trên console, nên sửa tay không được ghi lại và tích tụ thành drift. Rollback hoàn tác được thay đổi nó đã thực hiện, nhưng không hoàn tác được migration database đã chạy hay bucket đã bị xóa.",
  "say90": "Nhịp một: một đội quản lý hạ tầng bằng cách bấm tay trên console. Lần sửa security group để mở tạm một cổng cho gỡ lỗi, không ai ghi lại. Ba tháng sau, kiểm tra bảo mật phát hiện cổng đó vẫn mở. Không ai biết ai đã mở, khi nào, và có thứ gì khác phụ thuộc vào nó. Dựng lại môi trường staging từ đầu mất ba ngày. Nỗi đau thật là không có mã nào mô tả trạng thái hiện tại.\n\nNhịp hai: IaC biến hạ tầng thành mã có version, mọi thay đổi đi qua review. Quy trình chuẩn là viết template khai báo tài nguyên, review như review mã, triển khai thử ở môi trường kiểm thử, rồi áp lên production từng bước có kiểm tra. Khi triển khai lỗi, CloudFormation tự rollback về trạng thái ổn định trước đó. Để đưa hệ thống đang chạy vào quản lý, dùng lệnh xuất hiện trạng thái thành code làm điểm khởi đầu, bắt đầu bằng tài nguyên ít rủi ro, xác nhận template đúng trước khi áp dụng, rồi bật phát hiện drift ngay từ đầu.\n\nNhịp ba: đánh đổi là CloudFormation so template với template, không so với trạng thái thật, nên sửa tay tích tụ thành drift không được ghi; rollback không hoàn tác được thay đổi phá hủy như migration hay xóa bucket; giám sát bằng phát hiện drift định kỳ và số tài nguyên lệch so với template (xem Bài L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> mọi thay đổi có lịch sử, review được, rollback được; môi trường nào cũng dựng lại giống hệt nhau từ cùng một mã; drift được phát hiện định kỳ.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> template so với template chứ không so với trạng thái thật, sửa tay tích tụ thành drift; rollback không hoàn tác được thay đổi phá hủy; IaC vừa sửa tay là hai nguồn sự thật cùng tồn tại, không ai biết cái nào đúng (xem Bài L22).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A:</strong> Terraform hay Pulumi khi cần đa cloud hay template phức tạp hơn CloudFormation; chi phí là thêm một công cụ và quy trình riêng.</li><li><strong>Phương án B:</strong> giữ CloudFormation nhưng tách stack theo ranh giới dịch vụ và vòng đời thay đổi, stack nhỏ giúp triển khai nhanh, lỗi một chổ không chặn cả hệ thống, rollback gọn trong phạm vi hẹp (xem Bài L22).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> phát hiện drift cho biết tài nguyên lệch khỏi template; thời gian dựng lại môi trường từ đầu tăng; lỗi triển khai không rollback được, stack kẹt ở trạng thái cần can thiệp thủ công.</li><li><strong>Cách kiểm chứng nhanh:</strong> chạy phát hiện drift, xem từng tài nguyên lệch ở đâu; kiểm tra có chính sách IAM đóng quyền sửa tay trên console hay không; xác nhận template mô tả đúng trạng thái hiện có (xem Bài L22).</li></ul>"
}
);
