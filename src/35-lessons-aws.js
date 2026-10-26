var LESSONS = LESSONS || [];
LESSONS.push(
{
  "provenance": [
    "Mọi con số trong sự cố, dự đoán, kết quả quan sát và dòng thời gian (60 và 200 request mỗi giây, 600 ms và 200 ms mỗi lần gọi, max_connections = 40, p99 180 ms và 4,2 giây, 12 và 380 lần gọi đồng thời, tỉ lệ 3 phần trăm) là giả định để dựng kịch bản, không phải số đo và không phải giá trị mặc định của AWS.",
    "Hành vi Multi-AZ (standby đồng bộ ở AZ khác, failover đổi bản ghi DNS sang standby, phải mở lại kết nối, thời gian thường 60–120 giây, standby không phục vụ đọc) đối chiếu Amazon RDS User Guide, key aws-rds.",
    "Mỗi request đồng thời cần một execution environment, công thức concurrency bằng số request mỗi giây nhân thời gian một lần gọi, reserved concurrency dùng để tránh làm quá tải tài nguyên downstream, khuyến nghị khởi tạo kết nối ngoài handler, và việc Lambda xoá kết nối rảnh: đối chiếu AWS Lambda best practices và trang scaling, key aws-lambda-best.",
    "RDS Proxy gom và xếp hàng kết nối, từ chối bớt kết nối khi vượt hạn mức, giữ kết nối ứng dụng khi chuyển sang standby, và ghim session với câu lệnh lớn hơn 16 KB: đối chiếu key aws-rds. Bài không khẳng định Proxy là cơ chế failover.",
    "Ranh giới trách nhiệm chung được trình bày ở mức mô hình, không trích một con số hay cam kết SLA cụ thể."
  ],
  "id": "L01",
  "stage": 1,
  "stageTitle": "Chặng 1 — AWS nền tảng",
  "stageIntro": "<p>AWS không phải là một môn hoàn toàn mới. Về bản chất, nó là việc đặt những thứ bạn đã biết, gồm HTTP, cơ sở dữ liệu, hàng đợi và container, lên một hạ tầng do AWS vận hành. Sáu bài này dựng một hệ thống upload hoàn chỉnh theo đúng thứ tự bạn sẽ được hỏi trong phỏng vấn.</p><p>Đọc theo thứ tự, vì mỗi bài giả định bạn đã nắm bài trước.</p>",
  "title": "Một request đi qua những dịch vụ nào, và vì sao tăng Lambda làm nghẽn RDS",
  "goal": "Sau bài này bạn phải trace được một request từ trình duyệt qua API Gateway, Lambda tới RDS và nhánh SQS, chỉ ra khớp nào đang xếp hàng khi p99 tăng mà dashboard vẫn xanh, và tính được số kết nối thật mở tới RDS khi lưu lượng tăng.",
  "bridge": "Bạn đã từng dựng một API chạy trên một máy: một tiến trình nhận request, mở vài kết nối tới PostgreSQL đặt cùng máy đó. Bài này giữ nguyên chuỗi ấy và thay từng khớp bằng một dịch vụ AWS, để bạn thấy khớp nào AWS vận hành hộ và khớp nào bạn vẫn phải tự đặt trần.",
  "buildsOn": [],
  "incident": "<p>Kịch bản giả định, không phải số đo từ hệ thống thật. Một endpoint đăng ký upload chạy sau API Gateway: mỗi request gọi một hàm Lambda, hàm ghi một dòng vào RDS PostgreSQL rồi trả về. Ngày thường endpoint nhận khoảng 60 request mỗi giây, p99 quanh 180 ms, số lần gọi chạy đồng thời khoảng 12.</p><p>Chiều thứ Ba, đội chạy thử tải cho đợt sale: khoảng 200 request mỗi giây trong bốn phút. Sau phút thứ tư, p99 của endpoint lên 4,2 giây và một phần request bị treo cho tới khi API Gateway trả 504.</p><p>Điều làm đội bối rối là không dịch vụ nào tự báo quá tải. Lambda vẫn trả 200 cho phần lớn request, thời gian chạy trung bình của hàm vẫn khoảng 600 ms, CPU của RDS khoảng 35 phần trăm. Chỉ hai con số đổi: p99 của endpoint, và số lần gọi chạy đồng thời, từ 12 lên 380.</p>",
  "askFirst": [
    "Trong chuỗi trình duyệt, API Gateway, Lambda, RDS và SQS, khớp nào có thể đang xếp hàng chờ mà không hề đổi màu trên dashboard của chính nó?",
    "Phần nào của chuỗi này do AWS vận hành, phần nào bạn vẫn phải tự cấu hình, và ranh giới đó nằm ở thao tác cụ thể nào?",
    "Một Availability Zone mất điện thì phần nào của chuỗi vẫn chạy, phần nào dừng, và client đang giữ kết nối cũ sẽ thấy gì?"
  ],
  "predict": {
    "q": "Kịch bản giả định: endpoint nhận 200 request mỗi giây, mỗi lần gọi Lambda mất 600 ms nếu không phải chờ kết nối, code mở một kết nối cho mỗi environment rồi giữ lại, và RDS đặt max_connections = 40. Hỏi: (a) nếu mọi lần gọi đều lấy được kết nối ngay thì cần bao nhiêu environment, (b) với trần 40 kết nối thì bao nhiêu lần gọi đồng thời không có kết nối, (c) nếu đặt thêm RDS Proxy giữ tối đa 20 kết nối thật thì con số nào đổi và con số nào không, (d) nếu thời gian mỗi lần gọi giảm còn 200 ms thì cần bao nhiêu environment?",
    "a": "<p><strong>Kết luận: (a) 120 environment, (b) 80 lần gọi phải chờ, (c) RDS chỉ còn thấy tối đa 20 kết nối nhưng số environment vẫn là 120, (d) 40 environment, vừa khít trần.</strong></p><ul><li><strong>(a)</strong> Concurrency bằng số request mỗi giây nhân thời gian một lần gọi: 200 × 0,6 = 120 environment.</li><li><strong>(b)</strong> 120 environment đòi 120 kết nối trong khi trần là 40, nên 80 lần gọi đồng thời không lấy được kết nối và phải chờ hoặc nhận lỗi. Khi chờ, thời gian mỗi lần gọi tăng, mà tăng thì lại cần thêm environment, nên con số thật còn cao hơn 120 — đây là vòng lặp tự đẩy mình lên, không phải một phép nhân yên tĩnh.</li><li><strong>(c)</strong> Proxy giữ tối đa 20 kết nối thật tới RDS, nên phía cơ sở dữ liệu không còn bị từ chối kết nối; nhưng 120 client vẫn phải chia nhau 20 kết nối, nên chúng xếp hàng ở proxy. Năng lực của instance không tăng, chỉ chỗ xếp hàng đổi từ RDS sang proxy.</li><li><strong>(d)</strong> 200 × 0,2 = 40 environment, đúng bằng trần 40 kết nối. Đây là chỗ nguy hiểm nhất vì vừa khít: chỉ cần lưu lượng nhích lên hoặc một truy vấn chậm đi là chạm trần ngay.</li></ul><p>Nhánh phụ: nếu code mở kết nối bên trong handler thay vì ngoài handler thì mỗi lần gọi mở một kết nối mới, số kết nối trong một giây bằng số lần gọi, và không có tham số pool nào cứu được.</p>"
  },
  "naive": "<p>Phản xạ quen tay: p99 tăng thì thêm năng lực cho tầng đang nhìn thấy trên biểu đồ. Lambda vẫn trả 200 và mỗi lần gọi chỉ khoảng 600 ms, nên kết luận \"tầng tính toán còn khoẻ, chỉ thiếu concurrency\" nghe rất hợp lý. Nhưng nếu chỗ nghẽn là một tài nguyên có trần cố định ở cuối chuỗi, thêm environment chỉ đưa thêm client vào cùng một hàng đợi.</p><p>Đoạn dưới đây đúng là thứ đội đã chạy: nâng trần concurrency của hàm, không đọc chỉ số kết nối của RDS trước đó.</p>",
  "naiveCode": "# Kịch bản giả định: p99 tăng trong khi dashboard Lambda vẫn xanh.\n# Phản xạ: nâng trần concurrency của hàm.\naws lambda put-function-concurrency \\\n  --function-name upload-register \\\n  --reserved-concurrent-executions 400\n\n# Không bước nào đọc số kết nối đang dùng của RDS.\n# RDS trong kịch bản này đặt max_connections = 40.\n# 400 environment có thể cùng đòi kết nối từ một cửa chỉ mở 40 chỗ.",
  "naiveOut": "<p>Sau khi nâng trần lên 400, số lần gọi chạy đồng thời nhảy từ 12 lên 380 trong hai phút, p99 tăng thêm chứ không giảm, và tỉ lệ 504 tăng. Log ứng dụng bắt đầu có dòng <code>FATAL: sorry, too many clients already</code> ở khoảng 3 phần trăm số lần gọi. Dashboard của Lambda vẫn không có lỗi, vì lỗi xảy ra ở phía cơ sở dữ liệu chứ không ở phía hàm.</p>",
  "timeline": [
    [
      "H+0",
      "Bắt đầu thử tải 200 request mỗi giây, hơn ba lần ngày thường"
    ],
    [
      "H+4p",
      "p99 lên 4,2 giây, một phần request nhận 504"
    ],
    [
      "H+6p",
      "Lambda, API Gateway và RDS đều không báo quá tải trên dashboard"
    ],
    [
      "H+9p",
      "Đội nâng trần concurrency của hàm từ 50 lên 400"
    ],
    [
      "H+11p",
      "Số lần gọi chạy đồng thời lên 380, p99 và tỉ lệ 504 cùng tăng"
    ],
    [
      "H+25p",
      "Đọc chỉ số kết nối của RDS mới thấy trần max_connections đã bị chạm"
    ]
  ],
  "rootCause": "<p><strong>Chuỗi nhân quả của đúng sự cố này.</strong></p><ul><li>200 request mỗi giây nhân 0,6 giây mỗi lần gọi ra 120 lần gọi đồng thời, tức Lambda cần khoảng 120 environment.</li><li>Code mở kết nối ngoài handler nên mỗi environment còn ấm giữ một kết nối tới RDS; 120 environment đòi 120 kết nối.</li><li>RDS trong kịch bản đặt max_connections = 40, nên 80 kết nối không được cấp; các lần gọi đó chờ hoặc nhận lỗi.</li><li>Chờ làm mỗi lần gọi lâu hơn, lâu hơn làm số lần gọi đồng thời cao hơn, nên concurrency leo từ 120 lên 380 dù lưu lượng không đổi.</li><li>p99 của endpoint tăng theo thời gian chờ, còn từng lần gọi vẫn chạy nhanh nên biểu đồ của Lambda không đổi màu — đây là lý do sự cố vô hình trên dashboard.</li><li>Nâng trần concurrency chỉ thêm client vào cùng một cửa hẹp, nên p99 tăng thêm chứ không giảm.</li></ul><p>Con số 40 và 0,6 giây là giả định; quan hệ thì không: số kết nối tới RDS tỉ lệ với số environment còn ấm, không tỉ lệ với tham số concurrency bạn cấu hình.</p>",
  "concept": "<p>Serverless chỉ tự co giãn ở tầng không giữ trạng thái: mỗi environment Lambda là một client riêng, nên tăng số environment là tăng số kết nối cùng đòi vào một trần cố định ở cuối chuỗi.</p>",
  "mechanism": "<p>Bốn khớp và một trần, theo đúng thứ tự một request đi qua.</p><ol><li><strong>Cửa vào — API Gateway.</strong> Trình duyệt gọi HTTPS tới API Gateway; gateway khớp route, xác thực token, áp hạn mức rồi mới gọi Lambda. Phần AWS vận hành là máy chủ, mạng và lớp ảo hoá; phần bạn cấu hình là route, authorizer, quyền IAM của hàm, mã hoá và sao lưu dữ liệu. Request bị từ chối ở đây không tốn lần chạy Lambda nào.</li><li><strong>Region và Availability Zone.</strong> Region là vùng địa lý; trong mỗi Region có nhiều Availability Zone, mỗi AZ là một hoặc nhiều trung tâm dữ liệu độc lập về điện và mạng. API Gateway, Lambda và SQS do AWS vận hành trên nhiều AZ trong Region, nên mất một AZ không cần bạn cấu hình gì thêm. RDS thì khác: một instance nằm trong một subnet, và subnet chỉ thuộc đúng một AZ.</li><li><strong>Multi-AZ chuyển sang standby bằng DNS.</strong> Với Multi-AZ DB instance, RDS duy trì một standby đồng bộ ở AZ khác. Khi primary hỏng, RDS tự chuyển sang standby: cơ chế failover chính là việc RDS đổi bản ghi DNS của endpoint trỏ sang standby, thời gian thường 60–120 giây. Vì vậy kết nối đang mở tới địa chỉ cũ không dùng tiếp được mà phải mở lại, và tiến trình cache DNS lâu sẽ còn trỏ vào chỗ cũ. Standby không phục vụ đọc.</li><li><strong>Thực thi — environment của Lambda.</strong> Mỗi request đồng thời cần một environment riêng, và environment được tái dùng cho lần gọi sau nên client cùng kết nối khởi tạo ngoài handler được giữ lại; Lambda xoá kết nối rảnh, nên code phải mở lại được. Số environment cần thiết bằng số request mỗi giây nhân thời gian một lần gọi. Việc nặng như tạo thumbnail hay gửi mail được đẩy sang SQS để worker xử lý ngoài đường trả lời.</li><li><strong>Trần cuối chuỗi — RDS.</strong> RDS PostgreSQL chỉ phục vụ tối đa số kết nối bằng tham số max_connections; vượt trần thì kết nối mới bị từ chối hoặc phải chờ. Vì mỗi environment còn ấm có thể giữ một kết nối, số kết nối tỉ lệ với lưu lượng chứ không tỉ lệ với tham số pool bạn viết trong code. RDS Proxy là tùy chọn đứng trước RDS: nó giữ một bể kết nối thật, xếp hàng hoặc từ chối bớt kết nối phía client, và có thể giữ kết nối của ứng dụng khi RDS chuyển sang standby — nhưng nó không tạo standby và không phải cơ chế failover; việc chuyển AZ vẫn do Multi-AZ làm.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp, mỗi mục kèm thứ phản chứng nó.</p><ul><li><strong>\"Serverless tự co giãn mọi tầng.\"</strong> Nghe hợp lý vì Lambda bật thêm environment trong vài giây và dashboard của hàm luôn xanh. Điều đúng: chỉ tầng không giữ trạng thái co giãn theo request, còn RDS có trần kết nối cố định và mỗi environment còn ấm có thể giữ một kết nối. Phản chứng: log ứng dụng có <code>FATAL: sorry, too many clients already</code> đúng lúc số lần gọi đồng thời cao nhất, trong khi biểu đồ lỗi của hàm vẫn trống.</li><li><strong>\"RDS Proxy là cơ chế failover.\"</strong> Nghe hợp lý vì tài liệu nói proxy giúp ứng dụng bền hơn khi cơ sở dữ liệu gặp sự cố và giữ được kết nối của ứng dụng. Điều đúng: Multi-AZ mới là thứ chuyển sang standby bằng cách đổi bản ghi DNS, còn proxy chỉ là tùy chọn đứng trước để gom và xếp hàng kết nối. Phản chứng: một RDS Single-AZ đặt sau proxy vẫn ngừng phục vụ khi AZ của nó mất điện, vì proxy chỉ nối tới đúng instance đó.</li><li><strong>\"Failover xong thì kết nối cũ dùng tiếp.\"</strong> Nghe hợp lý vì tên endpoint không đổi nên tưởng địa chỉ cũng không đổi. Điều đúng: bản ghi DNS trỏ sang standby nên địa chỉ phía sau đổi, kết nối đang mở phải mở lại, và tiến trình cache DNS sẽ còn gọi vào địa chỉ cũ. Phản chứng: sau failover, log ứng dụng dồn dập lỗi kết nối cho tới khi tiến trình khởi động lại hoặc hết hạn cache DNS.</li></ul>",
  "tradeoff": "<p><strong>Cái được và cái mất của từng lựa chọn.</strong></p><ul><li><strong>Lambda cộng API Gateway:</strong> được trả theo mức dùng và không phải vá hệ điều hành; mất quyền kiểm soát số kết nối phía sau, vì mỗi request đồng thời là một environment riêng nên số kết nối downstream tỉ lệ với lưu lượng chứ không tỉ lệ với tham số pool trong code.</li><li><strong>RDS Proxy:</strong> được một bể kết nối thật ổn định và hàng đợi phía client thay vì để RDS từ chối kết nối; mất thêm một khớp phải cấu hình và theo dõi, thêm chi phí, và khi vượt hạn mức thì chính proxy từ chối kết nối của ứng dụng. Với PostgreSQL, câu lệnh lớn hơn 16 KB làm proxy ghim session vào một kết nối, nên khả năng chia sẻ giảm.</li><li><strong>Multi-AZ:</strong> được chuyển sang standby tự động khi primary hỏng; mất vì ghi đồng bộ sang AZ khác làm độ trễ ghi và commit tăng, và standby không phục vụ đọc nên đây không phải cách mở rộng đọc.</li><li><strong>Reserved Concurrency:</strong> được một trần chắc chắn để không đè bẹp tài nguyên downstream; mất phần concurrency dư của tài khoản và bị throttle ngay khi chạm trần.</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án khác.</strong></p><ul><li><strong>Không cần quan hệ và transaction:</strong> DynamoDB bỏ hẳn khái niệm trần kết nối, đổi lại phải thiết kế khoá và chấp nhận trả theo request đọc ghi.</li><li><strong>Lưu lượng vừa và ổn định:</strong> đặt Reserved Concurrency thấp hơn số kết nối RDS còn chỗ là đủ, không cần thêm proxy; cái mất là request vượt trần bị throttle ngay ở Lambda.</li><li><strong>Lưu lượng phẳng 24/7:</strong> container dài hạn giữ một pool dùng chung nên số kết nối điều khiển được bằng tham số pool, đổi lại bạn phải tự vá hệ điều hành và tự lo co giãn.</li><li><strong>Đọc nhiều hơn ghi:</strong> read replica phục vụ đọc, còn standby của Multi-AZ thì không; đừng chọn Multi-AZ với ý định mở rộng đọc.</li></ul>",
  "observe": "<p><strong>Đọc gì trên production để biết đang nghẽn ở khớp nào.</strong></p><ul><li><strong>CloudWatch:</strong> số lần gọi chạy đồng thời của hàm, số kết nối đang dùng của RDS đặt cạnh max_connections, và p99 theo endpoint. Ba đường này lệch nhau là dấu hiệu trần nằm ở cuối chuỗi.</li><li><strong>Log của API Gateway:</strong> đếm 429 và 504 riêng. 429 là bị chặn ngay ở cổng, 504 là đã vào trong và chờ quá lâu.</li><li><strong>Log ứng dụng:</strong> lỗi không lấy được kết nối, thời gian chờ kết nối, và lỗi kết nối dồn dập ngay sau một sự kiện failover.</li><li><strong>RDS event log:</strong> sự kiện failover kèm lý do và thời điểm, để tách sự cố hạ tầng khỏi sự cố do chính bạn đổi cấu hình.</li><li><strong>CloudTrail:</strong> ai đã đổi trần concurrency hay cấu hình proxy, lúc nào.</li></ul>",
  "attacks": [
    {
      "q": "Vì sao mỗi environment Lambda có thể giữ một kết nối riêng, trong khi trên một máy chủ thì nhiều request dùng chung một pool?",
      "a": "<p><strong>Kết luận: vì environment là một đơn vị cô lập được tái dùng, không phải một request.</strong> Mỗi environment là một tiến trình riêng, nên client và kết nối khởi tạo ngoài handler sống tiếp qua các lần gọi sau và không chia sẻ socket với environment khác. Trên một máy chủ, một tiến trình phục vụ nhiều request nên chỉ cần một pool chung, và tham số pool mới là trần. Điều kiện để câu trên đúng: kết nối được mở ngoài handler; nếu mở trong handler thì mỗi lần gọi mở một kết nối mới và tình hình tệ hơn. Dấu hiệu kiểm chứng: in pid hoặc id kết nối trong log, thấy giá trị giữ nguyên giữa hai lần gọi liên tiếp trên cùng environment, và số kết nối của RDS tăng theo số lần gọi đồng thời chứ không theo lưu lượng trung bình.</p>"
    },
    {
      "q": "Cho tôi một cách đặt trần để việc tăng Lambda không đè bẹp RDS.",
      "a": "<p><strong>Kết luận: đặt trần ở phía Lambda hoặc đặt một khớp gom kết nối, và cả hai đều phải nhỏ hơn số kết nối RDS thật sự còn chỗ.</strong> Cách một là Reserved Concurrency thấp hơn max_connections trừ phần dành cho vận hành, để Lambda tự throttle trước khi RDS phải từ chối. Cách hai là RDS Proxy giữ một bể kết nối thật và xếp hàng phần vượt. Điều kiện: bạn phải biết max_connections của instance đang chạy và số kết nối các thành phần khác đang chiếm. Dấu hiệu kiểm chứng: khi lưu lượng vượt trần, biểu đồ lỗi chuyển từ lỗi kết nối của RDS sang throttle của Lambda hoặc độ trễ xếp hàng ở proxy, và số kết nối của RDS phẳng thay vì chạm trần.</p>"
    },
    {
      "q": "Nếu AZ chứa primary mất điện đúng lúc 380 environment đang giữ kết nối thì client thấy gì?",
      "a": "<p><strong>Kết luận: Multi-AZ chuyển sang standby, bản ghi DNS đổi, và mọi kết nối đang mở đều chết rồi phải mở lại.</strong> Thời gian failover thường 60–120 giây, lâu hơn nếu có transaction lớn hoặc quá trình phục hồi dài. Trong khoảng đó client nhận lỗi kết nối; sau đó client phải phân giải lại tên miền, nên tiến trình cache DNS lâu sẽ còn gọi vào địa chỉ cũ lâu hơn nữa. Nếu không có proxy, mỗi environment tự mở lại kết nối, và 380 environment mở lại cùng lúc lại đụng trần kết nối. Nếu có proxy, kết nối từ ứng dụng tới proxy có thể được giữ và proxy nối lại tới standby. Điều kiện: RDS phải ở chế độ Multi-AZ; Single-AZ thì không có standby để chuyển. Dấu hiệu kiểm chứng: RDS event log có sự kiện failover kèm lý do, và log ứng dụng có một cụm lỗi kết nối đúng khoảng thời gian đó.</p>"
    },
    {
      "q": "Đặt RDS Proxy rồi thì còn trường hợp nào vẫn nghẽn?",
      "a": "<p><strong>Kết luận: còn, vì proxy chỉ giải bài toán số kết nối, không thêm CPU, IO hay năng lực truy vấn cho instance.</strong> Nếu nút thắt là truy vấn thiếu index hoặc IO của ổ đĩa thì đặt proxy chỉ làm hàng đợi dài hơn và p99 vẫn cao. Proxy cũng từ chối kết nối của ứng dụng khi vượt hạn mức, nên ứng dụng vẫn phải xử lý lỗi đó; với PostgreSQL, câu lệnh lớn hơn 16 KB làm proxy ghim session nên khả năng chia sẻ giảm. Và proxy không phải cơ chế failover: nếu target là một instance Single-AZ thì mất AZ đó vẫn là mất. Điều kiện để proxy có ích: số kết nối đúng là nút thắt, không phải CPU, IO hay bản thân truy vấn. Dấu hiệu kiểm chứng: sau khi đặt proxy, số kết nối của RDS phẳng nhưng CPU hoặc độ trễ đọc vẫn cao, tức nút thắt đã chuyển sang chỗ khác.</p>"
    }
  ],
  "anchor": "Lambda co giãn theo số request đồng thời, RDS co giãn theo cấu hình instance, nên thêm Lambda khi trần kết nối đã chạm chỉ làm hàng đợi dài hơn.",
  "say30": "Tôi đọc kiến trúc serverless bằng cách đi theo một request: trình duyệt vào API Gateway, gateway gọi Lambda, Lambda ghi RDS, việc nặng đẩy sang SQS cho worker. Chỗ dễ sai là giả định mọi tầng cùng co giãn. Lambda tạo thêm environment theo request đồng thời và mỗi environment có thể giữ một kết nối riêng, còn RDS có trần kết nối cố định. Vì vậy tăng Lambda khi trần đó đã chạm chỉ làm hàng đợi dài thêm và p99 tăng.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: endpoint nhận 200 request mỗi giây, p99 từ 180 ms lên 4,2 giây. Không dịch vụ nào tự báo quá tải: hàm vẫn trả 200, CPU của RDS khoảng 35 phần trăm. Thứ duy nhất đổi là số lần gọi đồng thời, từ 12 lên 380, nên câu hỏi đúng là khớp nào đang xếp hàng.\n\n[Cơ chế (45s)]: Lambda cấp một environment cho mỗi request đồng thời, nên concurrency bằng số request mỗi giây nhân thời gian một lần gọi. Environment được tái dùng, và kết nối mở ngoài handler sống tiếp, nghĩa là mỗi environment còn ấm giữ một kết nối riêng tới RDS. RDS PostgreSQL chỉ phục vụ tới max_connections, trong kịch bản này là 40. Vượt trần thì kết nối mới bị từ chối hoặc phải chờ; chờ làm mỗi lần gọi lâu hơn, lâu hơn lại cần thêm environment, thành vòng lặp tự đẩy mình lên.\n\n[Ranh giới (15s)]: Multi-AZ là RDS đổi bản ghi DNS sang standby ở AZ khác, kết nối đang mở phải mở lại và standby không phục vụ đọc. RDS Proxy là tùy chọn gom kết nối, không phải cơ chế failover, và không thêm năng lực cho instance.",
  "body": "<p><strong>Chuyển sang một hệ thống khác cùng hình dạng.</strong> Giả sử bạn làm endpoint nhận ảnh chứng từ: mỗi ảnh phải được tạo thumbnail, ghi metadata và gửi mail xác nhận. Đi theo chuỗi vừa đọc, bạn đặt ba câu hỏi trước khi chọn dịch vụ. Tầng nào không giữ trạng thái giữa hai request nên để nó tự co giãn? Tầng nào có trần cố định nên phải đặt trần từ phía gọi tới? Việc nào không cần xong trước khi trả lời người dùng nên đẩy ra sau?</p><p>Trả lời theo ba câu đó thường ra một thiết kế khác hẳn thói quen: ảnh đi thẳng lên S3 bằng URL có chữ ký thay vì chui qua hàm, metadata ghi vào nơi không có trần kết nối, còn thumbnail và mail vào hàng đợi cho worker. Điểm cần giữ là bạn chỉ đặt trần ở đúng một chỗ, chỗ cuối chuỗi, và mọi tầng phía trước đều biết trần đó.</p><p><strong>Trong phỏng vấn.</strong> Người phỏng vấn thường đổi một điều kiện rồi xem bạn có tính lại không: nếu lưu lượng chỉ 20 request mỗi giây, hoặc nếu mỗi lần gọi còn 200 ms thay vì 600 ms, số environment và số kết nối đổi thế nào? Bạn trả lời bằng phép nhân và nói rõ giả định, không bằng cảm giác. Câu tiếp theo hay gặp là: nếu tôi trả tiền cho instance to hơn thì sao? Trần kết nối có tăng theo cấu hình instance, nhưng số kết nối bạn cần vẫn do lưu lượng quyết định, nên phải tính cả hai đầu.</p><p><strong>Giới hạn của bài này.</strong> Mọi con số ở đây là giả định của một kịch bản, không phải ngưỡng mặc định của AWS. Trước khi áp vào hệ thống thật, đọc max_connections của instance đang chạy và số kết nối các thành phần khác đang chiếm.</p>",
  "code": "import os\n\nimport psycopg\n\nDSN = os.environ[\"DATABASE_URL\"]\n\n# Một kết nối cho mỗi environment: mở ở lần gọi đầu, dùng lại cho các lần sau.\n_conn = None\n\n\ndef get_conn():\n    global _conn\n    if _conn is None or _conn.closed:\n        _conn = psycopg.connect(DSN, connect_timeout=3)\n    return _conn\n\n\ndef handler(event, context):\n    conn = get_conn()\n    with conn.cursor() as cur:\n        cur.execute(\n            \"INSERT INTO uploads (id, tenant_id) VALUES (%s, %s)\",\n            (event[\"id\"], event[\"tenant_id\"]),\n        )\n    conn.commit()\n    return {\"statusCode\": 201}",
  "codeNote": "<p><strong>Ba dòng làm thay đổi trạng thái.</strong> <code>_conn = psycopg.connect(...)</code> mở một kết nối thật rồi gán vào biến cấp module, nên kết nối này thuộc về environment chứ không thuộc về request. <code>cur.execute(...)</code> gửi câu INSERT và mở một transaction. <code>conn.commit()</code> làm thay đổi đó bền vững; bỏ dòng này thì transaction bị huỷ khi kết nối đóng.</p><p><strong>Câu hỏi tự giải thích:</strong> nếu chuyển <code>_conn = psycopg.connect(...)</code> vào trong <code>handler</code>, với 120 request đồng thời thì RDS nhận bao nhiêu kết nối mỗi giây, và vì sao con số đó do lưu lượng quyết định chứ không do tham số pool?</p>",
  "visuals": [
    {
      "id": "flow-serverless-request",
      "question": "Một request đi qua những dịch vụ nào, và vì sao tăng số Lambda lại làm nghẽn ở RDS?",
      "focus": "RDS"
    }
  ],
  "sayIt": [
    "Chuỗi cần đọc: trình duyệt, API Gateway, Lambda, RDS, và nhánh SQS cho việc không cần xong trước khi trả lời.",
    "Khớp có thể xếp hàng mà không đổi màu dashboard là khớp Lambda đi vào RDS.",
    "Concurrency bằng số request mỗi giây nhân thời gian một lần gọi; nhân tiếp với một kết nối cho mỗi environment là ra số kết nối thật.",
    "Failover của Multi-AZ là RDS đổi bản ghi DNS sang standby; kết nối đang mở phải mở lại, standby không phục vụ đọc.",
    "RDS Proxy là tùy chọn gom và xếp hàng kết nối; nó không tạo standby nên không phải cơ chế failover."
  ],
  "qids": [
    "G01",
    "G12",
    "G05",
    "G11",
    "G13"
  ],
  "refs": [
    "aws-rds",
    "aws-lambda-best",
    "aws-vpc"
  ]
},
{
  "provenance": [
    "Các con số trong sự cố, dự đoán, kết quả quan sát và dòng thời gian (ba ngày, 100 phần trăm request nhận 500, một dòng AccessDenied, ba bucket) là giả định để dựng kịch bản, không phải số đo hay mặc định của AWS.",
    "Hai lớp quyền (resource-based policy quyết định ai được invoke, execution role quyết định hàm gọi được tài nguyên nào) và khuyến nghị dùng quyền hẹp nhất: đối chiếu AWS Lambda — Identity and access management (aws-lambda-permissions) và AWS IAM — Policies (aws-iam).",
    "Định dạng dòng AccessDenied (principal là assumed-role ARN, kèm action và resource) là hành vi thường thấy của IAM khi từ chối; bài không khẳng định nguyên văn chuỗi lỗi của mọi SDK.",
    "Bài không khẳng định thứ tự đánh giá cụ thể giữa identity policy và bucket policy cho mọi tổ hợp; chỉ khẳng định cả hai phía đều phải cho phép khi chủ sở hữu khác nhau."
  ],
  "id": "L02",
  "stage": 1,
  "stageTitle": "Chặng 1 — AWS nền tảng",
  "title": "Ai được gọi Lambda, và Lambda được phép làm gì",
  "goal": "Sau bài này bạn phải trace được một lỗi 403 thành hai nhánh riêng, đọc dòng AccessDenied để chỉ ra principal và action bị từ chối, và viết được một execution role chỉ mở đúng một thao tác trên đúng một tài nguyên.",
  "bridge": "Bài trước bạn đã đặt tên cho khớp giữa Lambda và cơ sở dữ liệu. Bài này trả lời câu hỏi đứng trước mọi khớp đó: ai được phép gọi hàm, và khi hàm đã chạy thì nó được phép chạm vào những gì.",
  "buildsOn": [
    "L01"
  ],
  "incident": "<p>Kịch bản giả định. Một endpoint <code>POST /files</code> chạy sau API Gateway có JWT authorizer; người dùng đã đăng nhập và token còn hạn. Hàm Lambda nhận event rồi gọi S3 <code>PutObject</code> để ghi một file nhỏ vào bucket <code>uploads-staging</code>.</p><p>Ba ngày trước mọi thứ chạy bình thường. Sáng nay, 100 phần trăm request nhận 500; log API Gateway ghi lỗi bắt nguồn từ hàm, còn log của hàm có đúng một dòng: <code>AccessDenied</code> khi gọi <code>s3:PutObject</code>, và principal trong dòng đó là <code>assumed-role/upload-api-role</code>, không phải người dùng nào cả. Một endpoint khác chỉ đọc cơ sở dữ liệu vẫn chạy bình thường.</p><p>Cùng lúc, một script nội bộ gọi thẳng hàm bằng SDK từ một máy khác nhận 403 ngay ở bước invoke, trước khi hàm kịp chạy và trước khi có bất kỳ dòng log nào của hàm. Hai lỗi cùng là 403, cùng nhắc tới IAM, nhưng xảy ra ở hai chỗ khác nhau trong chuỗi.</p>",
  "askFirst": [
    "Hai lỗi 403 trong sự cố xảy ra ở hai thời điểm nào của chuỗi, và mỗi lỗi do chính sách nào quyết định?",
    "Vì sao người dùng đã đăng nhập và token còn hạn vẫn không đủ để hàm ghi được lên S3?",
    "Dòng AccessDenied cần chứa những thông tin nào để bạn biết phải sửa chính sách ở đâu?"
  ],
  "predict": {
    "q": "Kịch bản giả định: execution role của hàm hiện chỉ có <code>s3:PutObject</code> trên <code>arn:aws:s3:::uploads-staging/*</code>. Bạn thêm một nhánh ghi vào bucket <code>uploads-prod</code> bằng đúng client boto3 đó. Hỏi: (a) lần ghi vào prod trả gì và principal trong lỗi là ai, (b) nếu thay vì sửa resource bạn cấp <code>s3:*</code> trên <code>*</code> thì được gì và mất gì, (c) nếu bạn cấp thêm quyền S3 cho người dùng đang gọi API thì có hết lỗi không, (d) nếu hàm này được một hàm khác gọi thì phải sửa chính sách nào?",
    "a": "<p><strong>Kết luận: (a) AccessDenied với principal là assumed-role, (b) hết lỗi nhưng mất khả năng phân biệt hành động, (c) không hết, vì người dùng không phải bên ký request tới S3, (d) phải sửa lớp invoke, không phải execution role.</strong></p><ul><li><strong>(a)</strong> Request do S3 từ chối; dòng lỗi ghi principal là role mà Lambda đang đảm nhận, action <code>s3:PutObject</code>, resource là ARN của bucket prod. Người dùng không xuất hiện trong dòng đó vì họ không ký request này.</li><li><strong>(b)</strong> Được: lỗi biến mất ngay. Mất: role ghi và xoá được mọi bucket của tài khoản, nên một lỗi trong code có thể xoá dữ liệu thật, và log mất khả năng cho biết hành động nào là hành động dự kiến.</li><li><strong>(c)</strong> Không. Quyền của người dùng chỉ ảnh hưởng bước gọi API và bước invoke; khi hàm chạy, mọi lời gọi AWS được ký bằng credential tạm của role. Thêm quyền S3 cho người dùng không đổi được credential mà boto3 đang dùng.</li><li><strong>(d)</strong> Lớp invoke: hàm gọi phải được phép gọi hàm đích, tức resource-based policy trên hàm đích hoặc một quyền tương ứng trên role của hàm gọi. Sửa execution role của hàm đích không làm lời gọi invoke đi qua được.</li></ul>"
  },
  "naive": "<p>Phản xạ quen tay khi thấy 403: gắn cho role bộ quyền rộng nhất để hết lỗi, rồi đi tiếp. Nó nghe hợp lý vì lỗi biến mất trong vài giây, dashboard xanh trở lại, và không ai phải đọc dòng AccessDenied. Cái giá chỉ hiện ra sau, khi role đó đã có quyền xoá bucket và đọc secret của hệ thống khác.</p><p>Đoạn dưới đây là đúng thứ hay được chạy trong tình huống đó.</p>",
  "naiveCode": "# Kịch bản giả định: hàm bị AccessDenied khi gọi s3:PutObject.\n# Phản xạ: gắn policy rộng nhất cho execution role.\naws iam attach-role-policy \\\n  --role-name upload-api-role \\\n  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\n\n# Không đọc dòng AccessDenied để biết action và resource nào bị từ chối.\n# Không kiểm tra role còn chạm được những gì sau khi gắn.",
  "naiveOut": "<p>Lỗi 403 biến mất ngay sau lần deploy kế tiếp. Nhưng role giờ đọc được mọi bucket của tài khoản, xoá được bảng và đọc được secret của những hệ thống khác. Tệ hơn: vì không còn dòng AccessDenied nào, nhóm mất luôn tín hiệu duy nhất từng cho biết code đang gọi ra ngoài phạm vi dự kiến.</p>",
  "timeline": [
    [
      "H-3 ngày",
      "Bucket được đổi tên, role vẫn trỏ ARN cũ"
    ],
    [
      "H+0",
      "100 phần trăm request nhận 500, log hàm có một dòng AccessDenied"
    ],
    [
      "H+15p",
      "Script nội bộ gọi thẳng hàm nhận 403 trước khi hàm chạy"
    ],
    [
      "H+20p",
      "Đội gắn AdministratorAccess cho role để hết lỗi"
    ],
    [
      "H+2 ngày",
      "Rà soát quyền mới thấy role chạm được cả bucket không liên quan"
    ]
  ],
  "rootCause": "<p><strong>Chuỗi nhân quả của đúng sự cố này.</strong></p><ul><li>Bucket được đổi tên nhưng execution role vẫn chỉ cho phép ARN cũ, nên quyền ghi không còn khớp tài nguyên thật.</li><li>Request đi qua API Gateway thành công vì lớp xác thực chỉ kiểm tra người dùng, không kiểm tra quyền của hàm.</li><li>Lambda chạy bình thường, rồi boto3 ký lời gọi bằng credential tạm của role; S3 từ chối vì identity policy không cho phép ARN mới.</li><li>Lỗi hiện ở log của hàm dưới dạng AccessDenied, còn người dùng chỉ thấy 500 — hai tầng khác nhau nên thông báo khác nhau.</li><li>Lỗi thứ hai nằm ở lớp khác: lời gọi invoke bị từ chối trước khi hàm chạy, nên không có log của hàm; sửa execution role không bao giờ chữa được lỗi này.</li></ul>",
  "concept": "<p>Hai chính sách trả lời hai câu khác nhau: resource policy trả lời ai được gọi hàm, execution role trả lời hàm được gọi cái gì, và chúng không thay thế nhau.</p>",
  "mechanism": "<p>Hai lớp kiểm tra, theo đúng thứ tự một request đi qua.</p><ol><li><strong>Lớp invoke — resource policy trên hàm.</strong> Trước khi hàm chạy, AWS kiểm tra ai được gọi nó: API Gateway, một hàm khác, một tài khoản khác. Đây là chính sách gắn trên chính hàm. JWT authorizer chỉ chứng minh người dùng là ai; nó không cấp quyền gọi hàm và không cấp quyền cho hàm.</li><li><strong>Lớp thực thi — execution role.</strong> Khi hàm chạy, Lambda đảm nhận role đã cấu hình và cấp credential tạm cho tiến trình. Mọi SDK trong code ký request bằng credential đó, nên principal trong mọi lỗi quyền đều là role, không phải người dùng.</li><li><strong>Lời gọi ra dịch vụ khác.</strong> Boto3 ký request tới S3 hoặc DynamoDB; dịch vụ đích đánh giá quyền của role trên đúng action và đúng ARN. Với tài nguyên thuộc chủ khác, cả phía gọi và phía tài nguyên đều phải cho phép. Bị từ chối thì lỗi trả về dòng AccessDenied kèm principal, action và resource.</li><li><strong>Thu hẹp quyền.</strong> Một role cho một hàm, action cụ thể thay vì dấu sao, ARN cụ thể thay vì mọi bucket. Secret đọc từ kho secret bằng một quyền riêng, không nhúng vào biến môi trường, vì biến môi trường ai đọc được cấu hình hàm là thấy.</li><li><strong>Ranh giới mà IAM không làm hộ.</strong> IAM không biết người dùng nào sở hữu bản ghi nào. Quyền của role chỉ nói hàm chạm được bảng; việc chỉ trả dữ liệu của đúng người gọi vẫn là một câu lệnh có điều kiện trong code.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"Qua JWT và API Gateway là có quyền ghi S3.\"</strong> Nghe hợp lý vì request đã qua xác thực và tới được code. Điều đúng: hai hành động khác nhau được kiểm ở hai chỗ khác nhau — một bên là ai được invoke, một bên là hàm được gọi cái gì. Phản chứng: dòng AccessDenied ghi principal là <code>assumed-role/upload-api-role</code>, không có tên người dùng nào trong đó.</li><li><strong>\"403 thì sửa execution role.\"</strong> Nghe hợp lý vì phần lớn lỗi quyền gặp phải đúng là do role thiếu quyền. Điều đúng: nếu 403 trả về trước khi hàm chạy và không có log của hàm thì lỗi nằm ở lớp invoke, sửa role không tác dụng. Phản chứng: cùng một thời điểm, endpoint qua API Gateway chạy được còn lời gọi trực tiếp bị chặn ngay.</li><li><strong>\"Cấp quyền rộng cho nhanh, sau này thu hẹp.\"</strong> Nghe hợp lý vì thời gian deploy ngắn và lỗi biến mất. Điều đúng: quyền rộng làm mất chính tín hiệu dùng để phát hiện code gọi sai chỗ, và không ai quay lại thu hẹp. Phản chứng: sau khi gắn quyền rộng, log không còn dòng AccessDenied nào, kể cả khi code gọi nhầm sang bucket của hệ thống khác.</li></ul>",
  "tradeoff": "<p><strong>Cái được và cái mất.</strong></p><ul><li><strong>Một role cho mỗi hàm:</strong> được blast radius nhỏ và log đọc được ngay; mất thời gian khai báo, vì mỗi hàm mới là một bộ quyền mới phải viết và rà.</li><li><strong>Một role dùng chung cho cả hệ thống:</strong> được khai báo một lần, deploy nhanh; mất khả năng biết hàm nào gọi cái gì, vì mọi lỗi đều mang cùng một principal.</li><li><strong>Quyền theo ARN cụ thể:</strong> được giới hạn đúng tài nguyên; mất tính linh hoạt, vì thêm bucket hay đổi tên là phải sửa chính sách cùng lúc với code.</li><li><strong>Secret trong kho secret so với biến môi trường:</strong> kho secret có quyền riêng, xoay được, nhưng thêm một lời gọi mạng và một quyền nữa phải cấp; biến môi trường đơn giản nhưng ai xem được cấu hình hàm là thấy giá trị.</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn cách khác.</strong></p><ul><li><strong>Client upload thẳng lên S3:</strong> cấp một URL có chữ ký ngắn hạn thay vì cấp quyền ghi S3 cho role của hàm; role chỉ cần quyền ký, không cần quyền ghi.</li><li><strong>Nhiều hàm cùng đọc một tài nguyên:</strong> vẫn nên một role cho mỗi hàm, nhưng đặt chính sách dùng chung ở tầng tổ chức để không phải chép tay từng bản.</li><li><strong>Cần giới hạn theo môi trường:</strong> thêm điều kiện trong chính sách theo tag hoặc theo tiền tố ARN, thay vì tạo thêm role.</li><li><strong>Tài khoản khác gọi hàm:</strong> bắt buộc dùng resource-based policy trên hàm đích; role của bên gọi không thay thế được chính sách đó.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết quyền bị từ chối ở lớp nào.</strong></p><ul><li><strong>Log của hàm:</strong> dòng AccessDenied kèm principal, action, resource — ba trường này chỉ ra chính sách nào cần sửa.</li><li><strong>CloudTrail:</strong> sự kiện gọi API bị từ chối, kèm danh tính đã dùng; đây là nơi duy nhất thấy được lời gọi bị chặn trước khi hàm chạy.</li><li><strong>Log API Gateway:</strong> mã 403 so với 500 để tách lỗi ở cổng khỏi lỗi bên trong hàm.</li><li><strong>Công cụ phân tích quyền của IAM:</strong> liệt kê quyền thực tế một role đang có, để phát hiện quyền rộng còn sót sau khi sửa.</li></ul>",
  "attacks": [
    {
      "q": "Hai lớp quyền này kiểm tra hai hành động nào, và vì sao chúng không thay thế nhau?",
      "a": "<p><strong>Kết luận: lớp invoke trả lời ai được gọi hàm, lớp execution role trả lời hàm được gọi cái gì; một lớp cho qua không hàm ý lớp kia cho qua.</strong> Lớp invoke chạy trước khi có tiến trình nào, nên bị chặn ở đó thì không có log của hàm. Lớp role chỉ có hiệu lực sau khi hàm đã chạy, và nó áp cho mọi lời gọi AWS mà code thực hiện. Điều kiện để phân biệt: nhìn xem lỗi có kèm log của hàm hay không. Dấu hiệu kiểm chứng: một lời gọi trực tiếp bị 403 mà không có dòng log nào của hàm là lỗi lớp invoke; lỗi có AccessDenied trong log hàm là lỗi lớp role.</p>"
    },
    {
      "q": "Cho tôi cách viết một execution role tối thiểu cho một thao tác ghi S3.",
      "a": "<p><strong>Kết luận: một action cụ thể trên một ARN cụ thể, cộng quyền ghi log nếu hàm cần ghi log.</strong> Chọn <code>s3:PutObject</code> thay vì <code>s3:*</code>, và ARN dạng <code>arn:aws:s3:::ten-bucket/*</code> thay vì dấu sao cho mọi bucket. Điều kiện: bạn biết chính xác bucket và tiền tố mà code dùng; nếu code dựng đường dẫn động thì ARN phải phủ đúng tập tiền tố đó. Dấu hiệu kiểm chứng: gọi thử một thao tác ngoài phạm vi, ví dụ <code>s3:DeleteObject</code>, phải nhận AccessDenied với đúng action đó.</p>"
    },
    {
      "q": "Nếu người dùng đổi từ JWT sang đăng nhập bằng một nhà cung cấp khác thì phần quyền nào phải sửa?",
      "a": "<p><strong>Kết luận: chỉ lớp xác thực ở cổng vào phải sửa; execution role và các chính sách tài nguyên giữ nguyên.</strong> Vì role được gắn với hàm chứ không gắn với người dùng, đổi cách chứng minh danh tính không đổi quyền của hàm. Điều kiện: claim dùng để quyết định quyền ở tầng ứng dụng phải được ánh xạ lại, nếu code đang đọc một trường riêng của token cũ. Dấu hiệu kiểm chứng: sau khi đổi, request đi qua cổng vào thành công, hàm vẫn ghi được đúng bucket, và log không xuất hiện AccessDenied mới.</p>"
    },
    {
      "q": "Có trường hợp nào role đúng mà vẫn không ghi được S3?",
      "a": "<p><strong>Kết luận: có, khi phía tài nguyên từ chối hoặc khi request đi sai đường.</strong> Với bucket thuộc tài khoản khác, chính sách của bucket cũng phải cho phép, nên role đúng vẫn nhận AccessDenied. Nếu bucket bật chặn truy cập công khai hoặc bật chính sách bắt buộc TLS, request không đúng điều kiện cũng bị chặn dù quyền có. Ngoài ra, nếu code dựng ARN sai — sai vùng hoặc sai tên — thì quyền đúng vẫn không khớp tài nguyên. Điều kiện để kết luận role là thủ phạm: principal trong lỗi đúng là role của hàm, action đúng là action bạn định gọi, và resource đúng là tài nguyên bạn định chạm. Dấu hiệu kiểm chứng: đối chiếu ba trường đó với chính sách trước khi sửa bất cứ dòng nào.</p>"
    }
  ],
  "anchor": "Qua cửa xác thực chỉ chứng minh người dùng là ai; quyền ghi S3 do execution role quyết định, và role đó chỉ nên mở đúng một action trên đúng một ARN.",
  "say30": "Tôi tách quyền IAM thành hai lớp. Lớp thứ nhất là resource policy trên hàm: ai được gọi hàm này, kiểm tra trước khi code chạy. Lớp thứ hai là execution role: khi hàm đã chạy, boto3 ký mọi lời gọi bằng credential tạm của role đó. Vì vậy đăng nhập thành công và qua API Gateway không có nghĩa là hàm ghi được S3. Khi gặp 403, tôi đọc principal, action và resource trong dòng AccessDenied trước khi sửa bất cứ chính sách nào.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: endpoint sau API Gateway có JWT authorizer, người dùng đã đăng nhập, vậy mà 100 phần trăm request nhận 500 vì hàm không ghi được S3. Cùng lúc một script gọi thẳng hàm nhận 403 trước khi hàm chạy. Hai lỗi cùng là 403, nhưng một cái xảy ra trước khi có tiến trình nào và một cái xảy ra sau khi code đã chạy.\n\n[Cơ chế (45s)]: Lớp invoke kiểm tra ai được gọi hàm, bằng chính sách gắn trên chính hàm; authorizer chỉ chứng minh danh tính người dùng, không cấp quyền cho hàm. Khi hàm chạy, Lambda đảm nhận execution role và cấp credential tạm, nên mọi lời gọi boto3 được ký bằng credential đó và principal trong lỗi luôn là role. Dịch vụ đích đánh giá đúng action trên đúng ARN; thiếu một trong hai thì trả AccessDenied kèm ba trường principal, action, resource.\n\n[Ranh giới (15s)]: Quyền hẹp là thứ giữ tín hiệu phát hiện code gọi sai chỗ, nên tôi không gắn quyền rộng để hết lỗi. Và IAM không biết bản ghi nào thuộc người dùng nào; việc lọc theo chủ sở hữu vẫn phải nằm trong câu lệnh.",
  "body": "<p><strong>Chuyển sang tình huống khác cùng hình dạng.</strong> Giả sử bạn làm endpoint xuất báo cáo: hàm đọc bảng, ghi file CSV lên S3, rồi đẩy một message vào hàng đợi. Ba tài nguyên, ba quyền khác nhau, và cả ba đều nằm sau một execution role. Trước khi viết code, bạn liệt kê đúng ba action cần dùng và ba ARN tương ứng; đó là toàn bộ chính sách. Nếu một ngày ai đó thêm bước gửi mail, chính sách phải đổi cùng lúc với code, và chính việc phải sửa đó là dấu hiệu tốt: nó buộc bạn nhìn lại phạm vi.</p><p><strong>Cách đọc một lỗi quyền trong ba mươi giây.</strong> Đầu tiên xác định lỗi có log của hàm hay không, để biết nó ở lớp invoke hay lớp role. Sau đó đọc principal: nếu là assumed-role thì thủ phạm là role, không phải người dùng. Cuối cùng so action và resource trong lỗi với chính sách; lệch ở đâu thì sửa ở đó, không sửa chỗ khác.</p><p><strong>Trong phỏng vấn.</strong> Câu hỏi hay gặp là: nếu tôi cấp quyền cho người dùng thì hàm có ghi được S3 không? Câu trả lời là không, và giải thích được vì sao là điểm cộng: quyền của người dùng dừng ở bước gọi API, còn bước ghi do role ký. Câu tiếp theo thường là: vậy làm sao giới hạn để người dùng A không đọc file của người dùng B? Lúc đó câu trả lời phải chuyển sang tầng ứng dụng, vì IAM không có khái niệm chủ sở hữu bản ghi.</p>",
  "code": "import json\nimport os\n\nimport boto3\n\nBUCKET = os.environ[\"UPLOAD_BUCKET\"]\n\n# Client tạo ngoài handler: credential tạm của execution role được tái dùng.\n_s3 = boto3.client(\"s3\")\n\n\ndef handler(event, context):\n    key = event[\"key\"]\n    _s3.put_object(\n        Bucket=BUCKET,\n        Key=key,\n        Body=b\"hello\",\n        ContentType=\"text/plain\",\n    )\n    return {\"statusCode\": 201, \"body\": json.dumps({\"key\": key})}",
  "codeNote": "<p><strong>Hai dòng làm thay đổi trạng thái.</strong> <code>_s3.put_object(...)</code> là lời gọi duy nhất đi ra AWS, được ký bằng credential tạm của execution role, nên principal trong mọi lỗi quyền là role chứ không phải người dùng. <code>Bucket=BUCKET</code> đọc từ biến môi trường, nên cùng gói code chạy được ở nhiều môi trường mà không phải sửa chính sách theo tên bucket viết cứng.</p><p><strong>Câu hỏi tự giải thích:</strong> nếu chạy đúng đoạn code này dưới một role chỉ có <code>s3:GetObject</code>, dòng AccessDenied sẽ ghi principal nào, action nào, và nó xuất hiện trong log của dịch vụ nào?</p>",
  "visuals": [
    {
      "id": "flow-iam-two-layers",
      "question": "Hai lớp quyền kiểm tra hai hành động nào, và vì sao qua API Gateway không đủ để Lambda ghi được S3?",
      "focus": "Execution role"
    }
  ],
  "sayIt": [
    "Hai lớp quyền trả lời hai câu khác nhau, và lớp invoke chạy trước khi có tiến trình nào.",
    "Principal trong lỗi quyền luôn là role, vì boto3 ký bằng credential tạm của role.",
    "AccessDenied đọc theo ba trường: principal, action, resource; lệch ở đâu sửa ở đó.",
    "Quyền rộng làm mất chính tín hiệu phát hiện code gọi sai chỗ.",
    "IAM không biết chủ sở hữu bản ghi, nên lọc theo người dùng vẫn là việc của câu lệnh."
  ],
  "qids": ["G02","G04","E05"],
  "refs": [
    "aws-iam",
    "aws-lambda-permissions",
    "aws-secrets"
  ]
},
{
  "provenance": [
    "Các con số trong sự cố, dự đoán, kết quả quan sát và dòng thời gian (timeout 3 giây, xử lý thật 5 giây, 4 MB, ba lần thử, 40 request mỗi giây) là giả định để dựng kịch bản, không phải số đo hay giá trị mặc định của AWS.",
    "Hành vi retry: gọi trực tiếp thì Lambda không tự thử lại, bên gọi quyết định; gọi bất đồng bộ thì Lambda thử thêm hai lần và có thể cấu hình dead-letter queue; event source mapping đọc stream thì thử lại cả batch và chặn shard, đọc queue thì visibility timeout và redrive policy quyết định. Đối chiếu AWS Lambda — Understanding retry behavior (aws-lambda-best) và AWS Lambda — Identity and access management (aws-lambda-permissions).",
    "Mỗi request đồng thời cần một execution environment, Init chạy một lần cho mỗi environment và Invoke chạy mỗi lần gọi, reserved concurrency dùng để tránh quá tải tài nguyên downstream: đối chiếu AWS Lambda best practices và trang scaling, key aws-lambda-best.",
    "Bài không khẳng định thời gian cold start cụ thể, vì con số đó phụ thuộc runtime, kích thước gói và cấu hình."
  ],
  "id": "L03",
  "stage": 1,
  "stageTitle": "Chặng 1 — AWS nền tảng",
  "title": "Một lần gọi Lambda đi qua Init, handler và retry như thế nào",
  "goal": "Sau bài này bạn phải trace được một invocation qua ba pha Init, Invoke và tái sử dụng environment, chỉ ra ai chịu trách nhiệm thử lại trong từng kiểu gọi đồng bộ, bất đồng bộ và event source mapping, và giải thích được vì sao retry buộc code phải idempotent.",
  "bridge": "Bài trước bạn đã tách hai lớp quyền và thấy lỗi quyền xuất hiện ở hai thời điểm khác nhau. Bài này đi vào bên trong lớp thực thi: một lần gọi hàm thực sự chạy những gì, phần nào chạy một lần cho mỗi environment, phần nào chạy mỗi lần gọi, và khi lỗi thì ai thử lại.",
  "buildsOn": [
    "L02"
  ],
  "incident": "<p>Kịch bản giả định. Một hàm xử lý ảnh được gọi bất đồng bộ từ sự kiện upload của S3. Hàm cấu hình timeout 3 giây; với ảnh 4 MB, phần tải ảnh, tạo ba kích thước và ghi lại mất khoảng 5 giây, nên lần chạy nào cũng bị dừng ở giây thứ ba.</p><p>Trong hai giờ, khoảng 900 ảnh được tải lên. Khách hàng nhận ba email xác nhận cho mỗi ảnh, và bảng thống kê đếm số ảnh đã xử lý cao gấp ba lần số ảnh thật. Log của hàm cho thấy mỗi ảnh có ba lần chạy, mỗi lần dừng ở đúng 3 giây với thông báo hết thời gian.</p><p>Điều làm đội bối rối là không ai bấm thử lại: phía tải ảnh chỉ gửi một sự kiện cho mỗi file. Và khi chuyển sang gọi hàm qua API Gateway để thử, họ chỉ thấy một lỗi trả về, không thấy ba lần chạy.</p>",
  "askFirst": [
    "Vì sao cùng một sự kiện lại sinh ra ba lần chạy, trong khi phía gửi chỉ gửi một lần?",
    "Trong ba kiểu gọi đồng bộ, bất đồng bộ và qua event source mapping, ai là bên quyết định có thử lại hay không?",
    "Nếu lần chạy đã gửi email trước khi bị dừng, code cần thay đổi gì để lần thử lại không gửi thêm lần nữa?"
  ],
  "predict": {
    "q": "Kịch bản giả định: hàm có timeout 3 giây, mỗi lần chạy thật mất 5 giây, và email được gửi ở giây thứ hai. Hỏi: (a) với một lần gọi bất đồng bộ, hàm được thử bao nhiêu lần, (b) khách nhận bao nhiêu email cho một ảnh, (c) nếu đổi sang gọi đồng bộ qua API Gateway thì ai thử lại và client thấy gì, (d) nếu đổi sang event source mapping đọc từ SQS thì điều gì quyết định số lần thử?",
    "a": "<p><strong>Kết luận: (a) ba lần, (b) ba email, (c) không ai thử lại tự động, client nhận lỗi, (d) visibility timeout và redrive policy của hàng đợi quyết định.</strong></p><ul><li><strong>(a)</strong> Gọi bất đồng bộ thì Lambda thử lại hai lần sau lần đầu, tổng ba lần thử; hết số lần thì sự kiện bị bỏ hoặc vào dead-letter queue nếu đã cấu hình.</li><li><strong>(b)</strong> Email gửi ở giây thứ hai, tức trước khi timeout ở giây thứ ba, nên mỗi lần thử đều gửi được một email: ba email cho một ảnh. Nếu email gửi ở giây thứ tư thì không lần nào gửi được và khách nhận không email nào — cùng một lỗi, hai kết quả trái ngược, tuỳ vị trí lời gọi trong thân hàm.</li><li><strong>(c)</strong> Với gọi đồng bộ, Lambda không tự thử lại; API Gateway chuyển lỗi về cho client, và client hoặc người dùng quyết định có gửi lại hay không. Vì vậy thử bằng API Gateway chỉ thấy một lỗi, không thấy ba lần chạy.</li><li><strong>(d)</strong> Với event source mapping đọc từ hàng đợi, thời gian message bị ẩn do visibility timeout quyết định khoảng cách giữa hai lần thử, còn redrive policy với số lần nhận tối đa quyết định khi nào message sang dead-letter queue. Với nguồn stream thì Lambda thử lại cả batch và chặn shard cho tới khi hết lỗi hoặc dữ liệu hết hạn lưu trữ.</li></ul>"
  },
  "naive": "<p>Phản xạ quen tay: thấy hết thời gian thì tăng timeout, thấy ba lần chạy thì đi tìm chỗ gọi ba lần. Cả hai đều nghe hợp lý, vì timeout đúng là nguyên nhân trực tiếp của lần chạy bị dừng, và ba lần chạy đúng là ba lần chạy. Nhưng tăng timeout chỉ đổi chỗ hỏng, còn ba lần chạy là hành vi có chủ đích của kiểu gọi bất đồng bộ.</p><p>Đoạn dưới đây là đúng thứ hay được sửa trong tình huống đó: nới timeout, không đụng tới tính lặp lại của tác dụng phụ.</p>",
  "naiveCode": "# Kịch bản giả định: hàm hết thời gian ở giây thứ ba, khách nhận ba email.\n# Phản xạ: nới timeout cho đủ 5 giây.\naws lambda update-function-configuration \\\n  --function-name make-thumbnails \\\n  --timeout 10\n\n# Không sửa chỗ gửi email, nên lần sau hàm chậm hơn 10 giây\n# thì mỗi ảnh lại sinh thêm ba email, và bảng thống kê lại đếm gấp ba.",
  "naiveOut": "<p>Với ảnh nhỏ, lỗi biến mất và số email đúng. Ba tuần sau, một lô ảnh lớn hơn làm mỗi lần chạy vượt 10 giây, và hiện tượng cũ quay lại: ba lần chạy cho mỗi ảnh, ba email, bảng thống kê lệch. Lần này đội còn khó tìm hơn, vì timeout đã bị coi là đã sửa xong.</p>",
  "timeline": [
    [
      "H+0",
      "Bắt đầu nhận lô ảnh 4 MB gọi bất đồng bộ, timeout đặt 3 giây"
    ],
    [
      "H+3s",
      "Lần chạy đầu bị dừng vì hết thời gian, sau khi đã gửi email"
    ],
    [
      "H+3s",
      "Lambda xếp lần thử thứ hai, rồi thử thứ ba, cùng dừng ở 3 giây"
    ],
    [
      "H+2h",
      "Khách báo nhận ba email cho mỗi ảnh, bảng thống kê đếm gấp ba"
    ],
    [
      "H+3h",
      "Thử bằng API Gateway chỉ thấy một lỗi, không thấy ba lần chạy"
    ],
    [
      "H+5h",
      "Đội nới timeout lên 10 giây, hiện tượng lặp lại ở lô ảnh lớn hơn"
    ]
  ],
  "rootCause": "<p><strong>Chuỗi nhân quả của đúng sự cố này.</strong></p><ul><li>Kiểu gọi bất đồng bộ khiến Lambda tự thử lại hai lần sau lần đầu, nên một sự kiện thành ba lần chạy.</li><li>Mỗi lần chạy đều dừng ở timeout 3 giây vì công việc thật cần khoảng 5 giây, nên không lần nào hoàn tất và không lần nào bị coi là thành công.</li><li>Email được gửi ở giây thứ hai, trước điểm dừng, nên mỗi lần chạy để lại một tác dụng phụ đã xảy ra rồi.</li><li>Code không có khoá chống lặp, nên lần thử sau không biết lần trước đã làm gì và làm lại từ đầu.</li><li>Gọi đồng bộ không có retry tự động, nên thử bằng API Gateway không tái hiện được sự cố — đây là lý do hiện tượng trông như không giải thích được.</li></ul>",
  "concept": "<p>Init chạy một lần cho mỗi environment, handler chạy mỗi lần gọi, và ai thử lại phụ thuộc kiểu gọi: đồng bộ thì bên gọi, bất đồng bộ thì Lambda thử thêm hai lần, event source thì hàng đợi quyết định.</p>",
  "mechanism": "<p>Ba pha và bốn chỗ quyết định, theo đúng thứ tự một lần gọi đi qua.</p><ol><li><strong>Init — chạy một lần cho mỗi environment.</strong> Lambda tạo environment, nạp runtime, import module và chạy phần code nằm ngoài handler. Mọi thứ khởi tạo ở đây được giữ lại cho các lần gọi sau, nên client SDK và kết nối nên đặt ở đây. Environment đã chạy xong được giữ lại và gọi là warm; lần gọi trên environment warm bỏ qua toàn bộ Init.</li><li><strong>Invoke — chạy mỗi lần gọi.</strong> Handler nhận event và context, chạy tới khi trả về hoặc tới khi chạm timeout. Mỗi request đồng thời cần một environment riêng, nên concurrency bằng số request mỗi giây nhân thời gian một lần gọi. Reserved concurrency đặt trần để hàm không đè bẹp tài nguyên phía sau; provisioned concurrency giữ sẵn environment để bớt pha Init.</li><li><strong>Timeout — cắt giữa chừng, không phải hoàn tác.</strong> Hết thời gian thì lần chạy bị dừng, nhưng những gì đã ghi ra ngoài vẫn còn: email đã gửi, bản ghi đã tạo. Timeout không phải rollback.</li><li><strong>Retry — bốn chỗ khác nhau.</strong> Gọi trực tiếp thì Lambda không tự thử lại và bên gọi quyết định. Gọi bất đồng bộ thì Lambda thử thêm hai lần, hết lượt thì bỏ hoặc vào dead-letter queue. Event source mapping đọc queue thì visibility timeout quyết định khoảng cách giữa hai lần thử và redrive policy quyết định khi nào message sang dead-letter queue. Event source đọc stream thì thử lại cả batch và chặn shard cho tới khi hết lỗi hoặc dữ liệu hết hạn.</li><li><strong>Idempotency — hệ quả bắt buộc.</strong> Vì mọi đường retry đều có thể giao cùng một sự kiện nhiều lần, code phải kiểm tra đã xử lý chưa trước khi làm tác dụng phụ, bằng một khoá ghi có điều kiện.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"Environment warm vẫn chạy lại Init.\"</strong> Nghe hợp lý vì mỗi lần gọi đều thấy log dòng đầu tiên của module. Điều đúng: Init chạy một lần cho mỗi environment, còn dòng log của handler mới chạy mỗi lần gọi. Phản chứng: đặt một biến đếm ở cấp module, in ra trong handler, và thấy giá trị tăng dần qua các lần gọi liên tiếp trên cùng environment thay vì reset về một.</li><li><strong>\"Lambda luôn tự thử lại khi lỗi.\"</strong> Nghe hợp lý vì đa số sự cố gặp phải đều qua đường bất đồng bộ, nơi quả thật có thử lại. Điều đúng: gọi đồng bộ không có retry tự động, bên gọi quyết định. Phản chứng: gọi hàm qua API Gateway khi hàm lỗi, thấy đúng một lần chạy trong log dù client có gửi lại hay không.</li><li><strong>\"Có retry thì không cần idempotent.\"</strong> Nghe hợp lý vì retry được thiết kế để làm request thành công. Điều đúng: retry làm request thành công về mặt kỹ thuật, nhưng tác dụng phụ đã xảy ra ở lần trước vẫn còn. Phản chứng: bảng thống kê đếm số ảnh đã xử lý cao gấp ba lần số ảnh thật, trong khi mỗi lần chạy đều trả về lỗi timeout.</li></ul>",
  "tradeoff": "<p><strong>Cái được và cái mất.</strong></p><ul><li><strong>Provisioned concurrency:</strong> được bỏ pha Init khỏi đường trả lời và độ trễ ổn định; mất tiền cho environment giữ sẵn kể cả khi không có request, và vẫn có thể gặp pha khởi tạo khi environment bị đặt lại.</li><li><strong>Reserved concurrency:</strong> được trần chắc chắn để không đè bẹp tài nguyên phía sau; mất phần concurrency dư của tài khoản và bị throttle ngay khi chạm trần.</li><li><strong>Retry tự động của kiểu bất đồng bộ:</strong> được sự kiện không mất khi lỗi tạm; mất tính đơn nhất, vì cùng một sự kiện có thể chạy nhiều lần nên mọi tác dụng phụ phải chịu được lặp.</li><li><strong>Timeout dài:</strong> được các lần chạy chậm có cơ hội xong; mất khả năng phát hiện sớm một hàm đang chậm dần, vì mỗi request giữ một environment lâu hơn và chi phí tăng theo thời gian chạy.</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn cách khác.</strong></p><ul><li><strong>Công việc dài hơn trần thời gian của hàm:</strong> chuyển sang một dịch vụ điều phối từng bước thay vì kéo dài timeout, để tiến trình có trạng thái và chạy lại được từng bước.</li><li><strong>Cần thứ tự và một lần xử lý cho mỗi nhóm:</strong> dùng hàng đợi có khoá theo nhóm thay vì gọi bất đồng bộ trực tiếp.</li><li><strong>Cần phản hồi tức thì cho người dùng:</strong> trả lời ngay ở đường đồng bộ và đẩy phần chậm sang hàng đợi, thay vì để người dùng chờ hết thời gian.</li><li><strong>Lưu lượng phẳng và cần giữ kết nối lâu:</strong> dùng container dài hạn, nơi pha khởi tạo chỉ xảy ra khi deploy.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết hàm đang lỗi ở pha nào.</strong></p><ul><li><strong>Log của hàm:</strong> mỗi lần chạy có mã request riêng; cùng một sự kiện xuất hiện nhiều mã là dấu hiệu retry, không phải nhiều sự kiện.</li><li><strong>Chỉ số thời gian chạy:</strong> phân biệt thời gian chờ khởi tạo với thời gian handler, để biết độ trễ đến từ pha Init hay từ công việc thật.</li><li><strong>Số lần gọi đồng thời và số lần bị throttle:</strong> cho biết hàm đang chạm trần concurrency hay đang bị tài nguyên phía sau làm chậm.</li><li><strong>Dead-letter queue và số lần nhận message:</strong> nơi duy nhất thấy được sự kiện đã thử hết lượt, thay vì chỉ thấy lỗi rời rạc trong log.</li></ul>",
  "attacks": [
    {
      "q": "Init và handler khác nhau ở điểm nào, và vì sao đặt sai chỗ một dòng code lại làm chậm cả hàm?",
      "a": "<p><strong>Kết luận: Init chạy một lần cho mỗi environment, handler chạy mỗi lần gọi, nên code trong Init trả giá một lần còn code trong handler trả giá mỗi request.</strong> Client SDK, kết nối và đọc cấu hình nên nằm ở Init; việc của từng event nằm trong handler. Điều kiện: environment phải được tái dùng; nếu lưu lượng tăng làm Lambda mở thêm environment thì mỗi environment mới trả giá Init một lần nữa. Dấu hiệu kiểm chứng: so độ trễ lần gọi đầu tiên sau deploy với các lần sau, và so hai bản code đặt cùng một lời gọi mạng ở hai vị trí.</p>"
    },
    {
      "q": "Với ba kiểu gọi, ai thử lại và thử bao nhiêu lần?",
      "a": "<p><strong>Kết luận: gọi trực tiếp thì bên gọi, bất đồng bộ thì Lambda thử thêm hai lần, event source mapping thì cấu hình của nguồn quyết định.</strong> Gọi trực tiếp: Lambda không tự thử lại, lỗi trả về cho bên gọi và bên gọi chọn cách xử lý. Bất đồng bộ: hai lần thử thêm, sau đó bỏ hoặc vào dead-letter queue nếu đã cấu hình. Event source đọc queue: visibility timeout quyết định khoảng cách giữa hai lần, redrive policy với số lần nhận tối đa quyết định khi nào sang dead-letter queue. Event source đọc stream: thử lại cả batch và chặn shard tới khi hết lỗi hoặc dữ liệu hết hạn. Dấu hiệu kiểm chứng: đếm số lần chạy cho cùng một mã sự kiện trong log, và đọc số lần nhận message trên hàng đợi.</p>"
    },
    {
      "q": "Nếu hàm chậm dần vì dữ liệu lớn lên thì nên tăng timeout hay đổi kiến trúc?",
      "a": "<p><strong>Kết luận: tăng timeout chỉ mua thời gian; khi thời gian xử lý phụ thuộc kích thước dữ liệu thì phải đổi cách chia việc.</strong> Tăng timeout làm mỗi request giữ environment lâu hơn, chi phí tăng theo thời gian chạy, và khi vượt trần cấu hình thì sự cố quay lại đúng hình dạng cũ. Điều kiện để tăng timeout là hợp lý: thời gian xử lý có trần rõ ràng và trần đó thấp hơn giới hạn của hàm. Dấu hiệu kiểm chứng: vẽ thời gian chạy theo kích thước đầu vào; nếu là đường dốc đều thì đó là vấn đề thiết kế, không phải vấn đề cấu hình.</p>"
    },
    {
      "q": "Retry có cứu được lỗi do chính dữ liệu đầu vào sai không?",
      "a": "<p><strong>Kết luận: không, và tệ hơn là nó biến một lỗi thành ba lỗi.</strong> Lỗi do dữ liệu sai sẽ lặp lại y hệt ở mọi lần thử, nên số lần chạy tăng mà không lần nào thành công, đồng thời mọi tác dụng phụ đã xảy ra trước điểm lỗi cũng nhân lên. Điều kiện để retry có ích: lỗi là tạm thời và lần sau có thể khác. Dấu hiệu kiểm chứng: nếu ba lần chạy cho cùng một sự kiện đều dừng ở cùng một dòng với cùng thông báo, đó là lỗi dữ liệu và phải sửa đầu vào hoặc loại sự kiện đó ra khỏi đường retry.</p>"
    }
  ],
  "anchor": "Init chạy một lần cho mỗi environment còn handler chạy mỗi lần gọi, nên ai thử lại và thử bao nhiêu lần là câu hỏi về kiểu gọi, không phải về code.",
  "say30": "Một lần gọi Lambda có ba pha: Init nạp runtime và chạy code ngoài handler, chạy một lần cho mỗi environment; Invoke chạy handler mỗi lần gọi; và environment warm được giữ lại nên lần sau bỏ qua Init. Khi lỗi, ai thử lại tuỳ kiểu gọi: đồng bộ thì bên gọi, bất đồng bộ thì Lambda thử thêm hai lần, event source thì hàng đợi quyết định. Vì vậy code phải idempotent.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: một hàm xử lý ảnh có timeout 3 giây nhưng cần 5 giây, được gọi bất đồng bộ từ sự kiện upload. Khách nhận ba email cho mỗi ảnh và bảng thống kê đếm gấp ba, trong khi phía gửi chỉ gửi một sự kiện cho mỗi file. Thử lại bằng API Gateway thì chỉ thấy một lỗi, không thấy ba lần chạy.\n\n[Cơ chế (45s)]: Init chạy một lần cho mỗi environment và environment warm bỏ qua nó, còn handler chạy mỗi lần gọi; mỗi request đồng thời cần một environment riêng. Timeout cắt lần chạy giữa chừng nhưng không hoàn tác những gì đã ghi ra ngoài. Retry phụ thuộc kiểu gọi: gọi trực tiếp thì bên gọi quyết định, bất đồng bộ thì Lambda thử thêm hai lần rồi bỏ hoặc vào dead-letter queue, event source đọc queue thì visibility timeout và redrive policy quyết định.\n\n[Ranh giới (15s)]: Retry chỉ cứu lỗi tạm thời; lỗi do dữ liệu sai sẽ lặp y hệt ba lần và nhân tác dụng phụ lên ba. Vì vậy tôi không nới timeout để che lỗi, mà đặt khoá chống lặp trước mọi tác dụng phụ.",
  "body": "<p><strong>Chuyển sang tình huống khác cùng hình dạng.</strong> Giả sử bạn làm worker gửi hoá đơn: đọc một message, tạo file, gửi mail, cập nhật trạng thái. Cùng một message có thể tới hai lần vì nhiều lý do khác nhau, và mỗi lý do đến từ một tầng khác nhau. Cách làm bền vững là đặt một khoá duy nhất cho mỗi đơn ở đầu worker: ghi khoá trước, làm việc sau, và nếu khoá đã tồn tại thì thoát ngay. Khi đó số lần chạy không còn quan trọng, chỉ trạng thái cuối cùng quan trọng.</p><p><strong>Cách đọc một sự cố lặp.</strong> Trước tiên đếm số lần chạy cho cùng một mã sự kiện. Nếu nhiều lần, xác định ai đã thử lại bằng cách so ba kiểu gọi. Sau đó tìm tác dụng phụ nằm trước điểm lỗi, vì đó là phần đã xảy ra rồi và không thể rút lại. Cuối cùng mới sửa: hoặc làm tác dụng phụ idempotent, hoặc chuyển nó ra sau bước kiểm tra khoá.</p><p><strong>Trong phỏng vấn.</strong> Câu hỏi hay gặp: làm sao biết hàm đang chạy lần đầu hay lần thử lại? Câu trả lời tốt không dựa vào việc đếm số lần gọi, mà dựa vào một khoá do chính code ghi, vì số lần gọi là thông tin của nền tảng còn khoá là thông tin của nghiệp vụ. Câu tiếp theo thường là: nếu khoá ghi xong mà bước sau lỗi thì sao? Lúc đó câu trả lời phải nói rõ trạng thái trung gian và cách chạy tiếp, thay vì giả định mọi thứ thành công cùng lúc.</p>",
  "code": "import json\nimport os\n\nimport boto3\nfrom botocore.exceptions import ClientError\n\nTABLE = os.environ[\"IDEMPOTENCY_TABLE\"]\n_ddb = boto3.client(\"dynamodb\")\n\n\ndef handler(event, context):\n    key = event[\"s3\"][\"object\"][\"key\"]\n    try:\n        _ddb.put_item(\n            TableName=TABLE,\n            Item={\"pk\": {\"S\": key}, \"status\": {\"S\": \"running\"}},\n            ConditionExpression=\"attribute_not_exists(pk)\",\n        )\n    except ClientError as err:\n        if err.response[\"Error\"][\"Code\"] == \"ConditionalCheckFailedException\":\n            return {\"statusCode\": 200, \"body\": json.dumps({\"skipped\": key})}\n        raise\n\n    make_thumbnails(key)\n    send_email(key)\n    return {\"statusCode\": 201, \"body\": json.dumps({\"key\": key})}",
  "codeNote": "<p><strong>Hai dòng làm thay đổi trạng thái.</strong> <code>_ddb.put_item(..., ConditionExpression=\"attribute_not_exists(pk)\")</code> là bước ghi có điều kiện: nó chỉ thành công khi khoá chưa tồn tại, nên lần chạy thứ hai nhận <code>ConditionalCheckFailedException</code> và thoát trước khi gửi mail. <code>make_thumbnails(key)</code> và <code>send_email(key)</code> là các tác dụng phụ, và chúng chỉ chạy sau khi khoá đã được giữ.</p><p><strong>Câu hỏi tự giải thích:</strong> nếu lần chạy đầu ghi khoá xong rồi bị timeout ở <code>send_email</code>, lần thử thứ hai sẽ làm gì, và người dùng nhận được kết quả nào — đây là hành vi bạn muốn hay phải sửa thêm?</p>",
  "visuals": [
    {
      "id": "flow-lambda-cold-start",
      "question": "Pha nào chạy một lần cho mỗi environment và pha nào chạy mỗi lần gọi, và vì sao lần gọi trên environment warm rẻ hơn?",
      "focus": "Init"
    }
  ],
  "sayIt": [
    "Ba pha: Init, Invoke, và tái sử dụng environment warm.",
    "Timeout cắt lần chạy chứ không hoàn tác tác dụng phụ đã xảy ra.",
    "Ai thử lại là câu hỏi về kiểu gọi, không phải về code của bạn.",
    "Bất đồng bộ thử thêm hai lần, event source đọc queue thì visibility timeout và redrive policy quyết định.",
    "Khoá chống lặp phải ghi trước tác dụng phụ, không phải sau."
  ],
  "qids": [
    "G03",
    "G11",
    "G12"
  ],
  "refs": [
    "aws-lambda-best",
    "aws-lambda-permissions"
  ]
},
{
  "provenance": [
    "Các con số trong sự cố và dự đoán (ba ngày, 100% request thử bằng curl, hai request cho một lần gọi, max-age 600 giây) là giả định để dựng kịch bản, không phải số đo của hệ thống thật hay giá trị mặc định của AWS.",
    "Mô hình CORS (origin gồm scheme, host, port; request không đơn giản phải qua preflight OPTIONS; response thật phải mang Access-Control-Allow-Origin lần nữa; credentials không đi cùng wildcard; trình duyệt chặn việc đọc response chứ không chặn request đã tới server) theo đặc tả Fetch và tài liệu MDN về CORS; bài không khẳng định con số giới hạn nào của trình duyệt.",
    "Với API Gateway, header CORS phải có trên cả response preflight do gateway tạo và response thật do integration trả về; bài không khẳng định cấu hình mặc định cụ thể nào, vì nó phụ thuộc kiểu integration.",
    "Bài không khẳng định thời gian cache preflight của từng trình duyệt, vì đó là giá trị trình duyệt tự chọn trong giới hạn cho phép.",
    "Ngân hàng câu hỏi chỉ có hai câu bàn trực tiếp về CORS (G05, G15), nên câu luyện thứ ba của bài (E12) luyện phần giới hạn tần suất ở tầng gateway, không luyện cơ chế CORS; nó được giữ vì hành vi của gateway nằm trong phạm vi bài, và người học không nên đọc nó như một câu hỏi CORS."
  ],
  "id": "L04",
  "stage": 1,
  "stageTitle": "Chặng 1 — AWS nền tảng",
  "title": "Vì sao curl trả 200 mà trình duyệt vẫn chặn request",
  "goal": "Sau bài này bạn phải chỉ ra được, từ một dòng lỗi CORS trong console, header nào thiếu ở lượt kiểm tra nào, và giải thích được vì sao server trả 200 mà trình duyệt vẫn không cho đọc response.",
  "bridge": "Bài trước bạn đã thấy lỗi có thể nằm ở lớp thực thi. Bài này đứng trước cả hàm: trình duyệt, nơi một request có thể bị chặn dù server đã trả lời thành công.",
  "buildsOn": [
    "L01"
  ],
  "incident": "<p>Kịch bản giả định. Giao diện chạy ở <code>app.example.com</code>, API ở <code>api.example.com</code>. Khi thử bằng curl, lệnh <code>POST /files</code> kèm header <code>x-tenant-id</code> trả về 201 với đúng JSON mong đợi, trong ba ngày liền, 100% số lần thử.</p><p>Trong trình duyệt, cùng request đó không bao giờ tới được handler. Console hiện: <em>blocked by CORS policy: Request header field x-tenant-id is not allowed in preflight response</em>. Mở tab Network thì thấy một request OPTIONS trả 200, và request POST thật không được gửi đi.</p><p>Sau khi thêm tên header đó vào cấu hình, lỗi đổi thành: <em>No Access-Control-Allow-Origin header is present on the requested resource</em>. Lần này POST đã tới server, server trả 201, và console vẫn báo lỗi.</p>",
  "askFirst": [
    "Vì sao curl thấy 201 còn trình duyệt lại không thấy gì, dù cùng một URL và cùng một header?",
    "Trình duyệt kiểm tra hai lượt hay một lượt, và mỗi lượt đọc header nào?",
    "Nếu response thật trả 500 mà thiếu header CORS thì lập trình viên phía giao diện nhìn thấy gì?"
  ],
  "predict": {
    "q": "Kịch bản giả định: giao diện ở <code>app.example.com</code> gọi <code>GET /me</code> trên host <code>api.example.com</code> kèm header <code>Authorization</code>. Hỏi: (a) trình duyệt gửi mấy request tới API, (b) request nào mang header <code>Authorization</code>, (c) nếu response thật trả 200 nhưng thiếu <code>Access-Control-Allow-Origin</code> thì code phía giao diện nhận được gì, (d) nếu chuyển sang dùng cookie đăng nhập kèm <code>credentials</code> thì <code>Access-Control-Allow-Origin: *</code> còn dùng được không?",
    "a": "<p><strong>Kết luận: (a) hai request, (b) chỉ request GET thật, (c) nhận lỗi chứ không nhận body, (d) không dùng được wildcard.</strong></p><ul><li><strong>(a)</strong> <code>Authorization</code> không thuộc nhóm header đơn giản, nên request không đơn giản và trình duyệt phải hỏi trước bằng một request OPTIONS, rồi mới gửi request thật: tổng hai request cho một lần gọi.</li><li><strong>(b)</strong> Request OPTIONS chỉ mang <code>Origin</code>, <code>Access-Control-Request-Method</code> và <code>Access-Control-Request-Headers</code>. Header <code>Authorization</code> chỉ đi trên request GET thật, sau khi lượt hỏi trước được chấp nhận.</li><li><strong>(c)</strong> Trình duyệt nhận 200 và có body, nhưng vì response thiếu <code>Access-Control-Allow-Origin</code> nên nó không cho code đọc body; phía giao diện nhận một lỗi mạng, <code>fetch</code> bị reject và không có status lẫn body. Đây là lý do cùng một lỗi mà log server ghi 200.</li><li><strong>(d)</strong> Với <code>credentials</code>, wildcard không được chấp nhận: <code>Access-Control-Allow-Origin</code> phải là đúng origin của giao diện, kèm <code>Access-Control-Allow-Credentials: true</code>, và server phải trả thêm <code>Vary: Origin</code> để cache không trả nhầm header cho origin khác.</li></ul>"
  },
  "naive": "<p>Phản xạ quen tay: server trả 201, curl thấy 201, vậy lỗi nằm ở phía giao diện hoặc ở mạng. Nghe hợp lý vì bằng chứng duy nhất nhìn thấy được là một dòng chữ đỏ trong console, và mọi thứ khác đều xanh.</p><p>Cách xử lý theo phản xạ đó thường là thêm một middleware bật CORS cho tất cả, rồi tin rằng xong.</p>",
  "naiveCode": "# Kịch bản giả định: console báo thiếu header CORS, curl thấy 201.\n# Phản xạ: bật CORS rộng nhất có thể ở tầng ứng dụng.\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"*\"],\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)\n\n# Không kiểm tra xem response lỗi 4xx/5xx có đi qua middleware này không,\n# và không kiểm tra request có kèm cookie hay không.",
  "naiveOut": "<p>Đường thành công hết lỗi, nên triệu chứng biến mất. Hai chỗ còn lại: khi handler trả 4xx hoặc 5xx qua một đường khác, response đó không đi qua middleware nên lại thiếu header và lập trình viên phía giao diện lại chỉ thấy lỗi mạng trống rỗng; và khi bật cookie đăng nhập, wildcard bị từ chối nên request đăng nhập hỏng đúng lúc mọi thứ trông đã ổn.</p>",
  "timeline": [
    [
      "T+0",
      "curl POST kèm x-tenant-id trả 201, đội kết luận API ổn"
    ],
    [
      "T+0",
      "Trình duyệt gửi OPTIONS, nhận 200 nhưng thiếu tên header trong Access-Control-Allow-Headers"
    ],
    [
      "T+0",
      "Trình duyệt dừng, không gửi POST, console báo lỗi preflight"
    ],
    [
      "T+1 ngày",
      "Thêm tên header vào cấu hình, lỗi đổi sang thiếu Access-Control-Allow-Origin"
    ],
    [
      "T+1 ngày",
      "POST tới server và trả 201, nhưng trình duyệt không cho đọc body"
    ],
    [
      "T+2 ngày",
      "Thêm header cho cả response thật, đường thành công hết lỗi"
    ]
  ],
  "rootCause": "<p><strong>Chuỗi nhân quả của đúng sự cố này.</strong></p><ul><li>Hai URL khác origin vì khác host, nên trình duyệt coi đây là request cross-origin và áp luật CORS.</li><li>Header <code>x-tenant-id</code> làm request không còn đơn giản, nên trình duyệt phải hỏi trước bằng OPTIONS.</li><li>Response OPTIONS không liệt kê tên header đó trong <code>Access-Control-Allow-Headers</code>, nên lượt hỏi trước thất bại và request thật không được gửi.</li><li>Sau khi sửa, response thật vẫn thiếu <code>Access-Control-Allow-Origin</code> vì header chỉ được thêm cho response do gateway tạo, không thêm cho response do integration trả về.</li><li>curl không thực thi CORS, không có origin và không hỏi trước, nên nó luôn thấy 201 — đây là lý do bằng chứng bằng curl không phủ định được lỗi.</li></ul>",
  "concept": "<p>CORS là luật của trình duyệt chứ không phải của server: trình duyệt hỏi trước khi request không đơn giản, rồi kiểm tra lại header trên response thật, và chặn việc đọc response chứ không chặn request đã tới server.</p>",
  "mechanism": "<p>Bốn bước trình duyệt đi qua, theo đúng thứ tự.</p><ol><li><strong>Xác định origin.</strong> Origin là bộ ba scheme, host và port. Khác một trong ba là cross-origin, kể cả khi cùng tên miền gốc mà khác cổng. Trang ở <code>app.example.com</code> gọi <code>api.example.com</code> là cross-origin.</li><li><strong>Phân loại request.</strong> Request đơn giản chỉ dùng phương thức đơn giản, content type đơn giản và không có header tuỳ biến; loại này đi thẳng. Thêm <code>Authorization</code> hay <code>x-tenant-id</code> là thành không đơn giản, và trình duyệt phải hỏi trước.</li><li><strong>Lượt hỏi trước.</strong> Trình duyệt gửi OPTIONS kèm <code>Origin</code>, <code>Access-Control-Request-Method</code> và <code>Access-Control-Request-Headers</code>. Server phải trả <code>Access-Control-Allow-Origin</code> khớp origin, <code>Access-Control-Allow-Methods</code> chứa phương thức, và <code>Access-Control-Allow-Headers</code> chứa đúng các tên header được hỏi; thiếu một mục là dừng, request thật không được gửi.</li><li><strong>Lượt thật và kiểm tra lần hai.</strong> Request thật vẫn được gửi tới server, và response của nó phải mang <code>Access-Control-Allow-Origin</code> một lần nữa. Nếu thiếu, trình duyệt chặn việc đọc response: server đã chạy xong, đã ghi dữ liệu, mà code phía giao diện nhận lỗi. Response lỗi 4xx hay 5xx cũng cần header này, nếu không lập trình viên không đọc được nội dung lỗi.</li><li><strong>Credentials là trường hợp riêng.</strong> Khi request mang cookie hoặc chứng chỉ, wildcard bị từ chối: phải trả đúng origin, kèm <code>Access-Control-Allow-Credentials: true</code> và <code>Vary: Origin</code> để cache không trả nhầm header của origin khác.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"curl trả 200 nghĩa là CORS ổn.\"</strong> Nghe hợp lý vì curl nhận đúng body, đúng status, thậm chí đúng cả JSON. Điều đúng: curl không phải trình duyệt, nó không có origin, không hỏi trước và không kiểm tra header CORS. Phản chứng: gửi một request OPTIONS kèm header <code>Origin</code> đúng giá trị origin của giao diện rồi đọc các header trả về; nếu thiếu <code>Access-Control-Allow-Origin</code> thì trình duyệt sẽ chặn dù curl vẫn thấy 200.</li><li><strong>\"Bật CORS ở gateway là xong.\"</strong> Nghe hợp lý vì gateway là chỗ cấu hình tập trung và OPTIONS đã xanh. Điều đúng: cấu hình đó chỉ thêm header cho response do gateway tự tạo; response do integration trả về phải tự mang header, nếu không thì lượt hỏi trước xanh mà lượt thật vẫn bị chặn. Phản chứng: OPTIONS trả 200 có header, còn POST trả 201 không có header.</li><li><strong>\"Dùng wildcard là an toàn cho mọi trường hợp.\"</strong> Nghe hợp lý vì wildcard làm mọi đường thành công hết lỗi. Điều đúng: với credentials, wildcard bị từ chối, nên request mang cookie bị chặn ngay cả khi không có lỗi nào khác. Phản chứng: console báo wildcard không hợp lệ khi credentials được bật, và cookie không có trong request.</li></ul>",
  "tradeoff": "<p><strong>Cái được và cái mất.</strong></p><ul><li><strong>Wildcard:</strong> được cấu hình một lần cho mọi origin; mất khả năng dùng credentials và mất việc giới hạn ai được đọc response.</li><li><strong>Danh sách origin cụ thể:</strong> được kiểm soát chặt và dùng được credentials; mất công bảo trì khi thêm môi trường, và bắt buộc phải có <code>Vary: Origin</code> để cache không trộn header.</li><li><strong>Đưa API về cùng origin qua CloudFront:</strong> được loại bỏ hoàn toàn preflight và giảm một lượt đi về; mất tính độc lập triển khai giữa giao diện và API.</li><li><strong>Max-age dài cho preflight:</strong> được giảm số lượt OPTIONS; mất tốc độ khi phải thêm header mới, vì trình duyệt còn dùng kết quả cũ tới khi hết hạn.</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn cách khác.</strong></p><ul><li><strong>Không muốn cấu hình CORS ở mọi tầng:</strong> phục vụ giao diện và API dưới cùng một origin, khi đó trình duyệt không áp luật cross-origin nữa.</li><li><strong>Cần giấu token khỏi trình duyệt:</strong> dùng một lớp trung gian phía server giữ phiên, thay vì để trình duyệt gọi thẳng API bằng credential.</li><li><strong>Chỉ cần cho môi trường phát triển:</strong> dùng proxy của công cụ dev để mọi request đi qua cùng origin cục bộ, thay vì mở CORS trên môi trường thật.</li><li><strong>Cần chia sẻ dữ liệu công khai:</strong> phát hành qua đường đọc công khai có kiểm soát, thay vì mở API nội bộ cho mọi origin.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết thiếu header ở lượt nào.</strong></p><ul><li><strong>Dòng lỗi trong console:</strong> câu chữ khác nhau cho từng trường hợp — thiếu tên header ở preflight, thiếu allow-origin ở response thật, wildcard không hợp lệ với credentials. Đọc đúng câu là biết sửa ở đâu.</li><li><strong>Tab Network:</strong> nếu chỉ có OPTIONS mà không có request thật, lỗi nằm ở lượt hỏi trước; nếu có request thật với status 200 mà console vẫn đỏ, lỗi nằm ở header của response thật.</li><li><strong>Header trả về:</strong> kiểm tra <code>Access-Control-Allow-Origin</code>, <code>Access-Control-Allow-Headers</code>, <code>Vary</code> trên cả hai lượt, kể cả trên response 4xx và 5xx.</li><li><strong>Log của gateway và của hàm:</strong> nếu request thật đã tới handler mà trình duyệt vẫn báo lỗi, thì lỗi thuần tuý ở header, không phải ở xác thực hay ở nghiệp vụ.</li></ul>",
  "attacks": [
    {
      "q": "CORS kiểm tra cái gì, và nó chặn ở đâu trong đường đi của request?",
      "a": "<p><strong>Kết luận: CORS kiểm tra quyền đọc response của một origin khác, và nó chặn ở phía trình duyệt sau khi request đã tới server.</strong> Trình duyệt so origin của trang với header <code>Access-Control-Allow-Origin</code> của response; nếu không khớp, nó không giao response cho code. Điều kiện: chỉ trình duyệt mới thực thi luật này, và chỉ với request cross-origin; request cùng origin không đi qua bước kiểm tra. Dấu hiệu kiểm chứng: log server có bản ghi request và trả 200, trong khi <code>fetch</code> phía giao diện bị reject không có body.</p>"
    },
    {
      "q": "Console báo \"Request header field x-tenant-id is not allowed in preflight response\" thì sửa ở đâu?",
      "a": "<p><strong>Kết luận: sửa ở response của lượt OPTIONS, không phải ở request hay ở handler.</strong> Phải thêm tên header đó vào <code>Access-Control-Allow-Headers</code> của response preflight, và header đó phải được trả trên mọi đường, kể cả khi gateway trả lỗi xác thực. Điều kiện: nếu gateway có cấu hình CORS riêng thì kiểm tra cả hai nơi, vì nơi nào trả lời OPTIONS trước sẽ quyết định. Dấu hiệu kiểm chứng: gửi OPTIONS kèm <code>Origin</code> và <code>Access-Control-Request-Headers: x-tenant-id</code>, đọc header trả về, rồi tải lại trang và xem request thật đã được gửi chưa.</p>"
    },
    {
      "q": "Nếu chuyển từ token trong header sang cookie đăng nhập thì cấu hình CORS phải đổi những gì?",
      "a": "<p><strong>Kết luận: bỏ wildcard, trả đúng origin, bật <code>Access-Control-Allow-Credentials</code> và thêm <code>Vary: Origin</code>.</strong> Với credentials, <code>Access-Control-Allow-Origin</code> phải là đúng origin của trang, không được là dấu hoa thị; phía giao diện cũng phải khai báo gửi kèm cookie. Điều kiện: cookie phải đúng thuộc tính miền và đường dẫn, nếu không thì CORS xanh mà vẫn không có cookie. Dấu hiệu kiểm chứng: xem request thật có header <code>Cookie</code> không, và đọc lỗi console nếu wildcard vẫn còn.</p>"
    },
    {
      "q": "CORS có thay được xác thực và phân quyền phía server không?",
      "a": "<p><strong>Kết luận: không, CORS chỉ bảo vệ người dùng khỏi việc trang khác đọc trộm response, server vẫn phải tự kiểm tra quyền.</strong> Bất kỳ client nào không phải trình duyệt đều bỏ qua CORS hoàn toàn, nên dữ liệu vẫn tới được nếu server không chặn. Điều kiện: CORS chỉ có tác dụng với request do trình duyệt gửi và chỉ với việc đọc response. Dấu hiệu kiểm chứng: gọi cùng endpoint bằng một công cụ dòng lệnh với origin bị cấm và thấy dữ liệu vẫn trả về, trong khi trình duyệt ở origin đó bị chặn.</p>"
    }
  ],
  "anchor": "CORS là luật của trình duyệt, không phải của server: request vẫn tới nơi và vẫn ghi dữ liệu, chỉ có việc đọc response là bị chặn.",
  "say30": "Kịch bản giả định: giao diện và API khác origin, curl thấy 201 nhưng trình duyệt báo lỗi CORS. Nguyên nhân: trình duyệt hỏi trước bằng OPTIONS khi request không đơn giản, rồi kiểm tra lại Access-Control-Allow-Origin trên response thật. Server trả 200 mà thiếu header thì trình duyệt vẫn chặn việc đọc response, và curl không thực thi luật đó nên không tái hiện được.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: giao diện ở một host, API ở host khác. curl gọi POST kèm header x-tenant-id thấy 201 trong ba ngày liền, còn trình duyệt không gửi được request nào. Sau khi thêm tên header, lỗi đổi sang thiếu Access-Control-Allow-Origin: POST đã tới server, trả 201, mà phía giao diện vẫn nhận lỗi.\n\n[Cơ chế (45s)]: Trình duyệt xác định origin bằng scheme, host và port; khác một phần là cross-origin. Header tuỳ biến làm request không đơn giản, nên nó gửi OPTIONS kèm Access-Control-Request-Headers và đòi response liệt kê đúng các tên đó. Lượt thật vẫn được gửi và response phải mang Access-Control-Allow-Origin lần nữa, kể cả khi là 4xx hay 5xx. Với cookie thì wildcard bị từ chối, phải trả đúng origin kèm Allow-Credentials và Vary: Origin.\n\n[Ranh giới (15s)]: CORS không phải cơ chế xác thực: client không phải trình duyệt bỏ qua nó hoàn toàn, nên server vẫn phải tự kiểm tra quyền. Vì vậy tôi sửa header ở đúng lượt bị thiếu, không nới wildcard để che lỗi.",
  "body": "<p><strong>Chuyển sang tình huống khác cùng hình dạng.</strong> Giả sử bạn nối một trang quản trị tới API nội bộ và nhận báo cáo: \"bấm nút lưu thì quay mãi, không có thông báo gì\". Trước khi đọc code, hãy mở tab Network. Nếu thấy một OPTIONS đỏ và không có request thật, vấn đề nằm ở lượt hỏi trước. Nếu thấy request thật với status 200 mà giao diện vẫn không hiện gì, vấn đề nằm ở header của response. Hai kết luận này dẫn tới hai chỗ sửa khác nhau, và việc phân biệt chúng nhanh hơn nhiều so với đọc code.</p><p><strong>Vì sao lỗi 5xx cũng cần header.</strong> Khi handler trả 500, response đó cũng phải mang header CORS thì trình duyệt mới cho code đọc nội dung lỗi. Nếu thiếu, lập trình viên phía giao diện chỉ thấy một lỗi mạng trống rỗng và mất luôn thông điệp chẩn đoán — sự cố thật bị che bởi sự cố cấu hình.</p><p><strong>Trong phỏng vấn.</strong> Câu hỏi hay gặp: CORS khác xác thực ở đâu? Câu trả lời tốt nói rõ CORS do trình duyệt thực thi, nhằm bảo vệ người dùng, và không thay được việc server kiểm tra quyền. Câu tiếp theo thường là: vì sao curl không tái hiện được lỗi? Vì curl không có origin và không hỏi trước. Trả lời được hai câu này là đã chứng minh hiểu đúng tầng, không chỉ biết thêm header.</p>",
  "code": "import json\nimport os\n\n# ALLOWED chưa có host, nên tách scheme và path khỏi header Origin trước khi so.\nALLOWED = {\n    \"app.example.com\",\n    \"localhost:5173\",\n}\n\n\ndef cors_headers(event):\n    raw_origin = event.get(\"headers\", {}).get(\"origin\", \"\")\n    # origin ở đây là host sau khi tách scheme, đúng dạng để so với ALLOWED.\n    origin = raw_origin.split(\"://\", 1)[-1].split(\"/\", 1)[0].lower()\n    if origin not in ALLOWED:\n        return {\"Vary\": \"Origin\"}\n    return {\n        \"Access-Control-Allow-Origin\": raw_origin,\n        \"Access-Control-Allow-Methods\": \"GET,POST,OPTIONS\",\n        \"Access-Control-Allow-Headers\": \"content-type,authorization,x-tenant-id\",\n        \"Access-Control-Allow-Credentials\": \"true\",\n        \"Vary\": \"Origin\",\n    }\n\n\ndef handler(event, context):\n    headers = cors_headers(event)\n    if event[\"requestContext\"][\"http\"][\"method\"] == \"OPTIONS\":\n        return {\"statusCode\": 204, \"headers\": headers, \"body\": \"\"}\n    return {\"statusCode\": 201, \"headers\": headers, \"body\": json.dumps({\"ok\": True})}",
  "codeNote": "<p><strong>Hai chỗ làm thay đổi kết quả.</strong> <code>if origin not in ALLOWED</code> là dòng quyết định: origin lạ không nhận được <code>Access-Control-Allow-Origin</code>, nên trình duyệt chặn, còn client khác thì vẫn gọi được — đúng ranh giới của CORS. <code>headers</code> được gắn vào cả nhánh OPTIONS lẫn nhánh trả dữ liệu, nên lượt hỏi trước và lượt thật không còn lệch nhau.</p><p><strong>Câu hỏi tự giải thích:</strong> nếu handler ném lỗi trước khi tới <code>return</code>, response lỗi đó có mang <code>headers</code> này không, và phía giao diện sẽ thấy gì — bạn cần thêm gì để response lỗi cũng có header?</p>",
  "visuals": [
    {
      "id": "flow-cors-preflight",
      "question": "Hai lượt kiểm tra đọc header nào, và vì sao thiếu header ở lượt thứ hai vẫn làm request thất bại dù server đã trả 200?",
      "focus": "Browser"
    }
  ],
  "sayIt": [
    "Origin là scheme, host và port; khác một phần là cross-origin.",
    "Header tuỳ biến biến request thành không đơn giản, và kéo theo một lượt OPTIONS.",
    "Response thật phải mang Access-Control-Allow-Origin một lần nữa, kể cả khi là 4xx hay 5xx.",
    "Credentials thì không đi cùng wildcard, và cần Vary: Origin.",
    "CORS bảo vệ người dùng ở trình duyệt, không phải cơ chế phân quyền của server."
  ],
  "qids": ["G05","G15","E12"],
  "refs": [
    "aws-api-gateway",
    "aws-cloudfront"
  ]
},
{
  "provenance": [
    "Các con số trong sự cố và dự đoán (tệp 8 MB, 200 000 bản ghi, 50 đơn mỗi người dùng, URL hết hạn sau 300 giây, 512 MB bộ nhớ) là giả định để dựng kịch bản, không phải số đo của hệ thống thật hay giá trị mặc định của AWS.",
    "URL ký sẵn mang quyền của người ký trong một thời hạn giới hạn và chỉ cho đúng thao tác, đúng bucket và đúng khoá đã ký; người nhận URL không cần credential AWS. Đối chiếu Amazon S3 — Sharing objects with presigned URLs (aws-s3).",
    "DynamoDB: Query đọc theo khoá phân vùng và khoá sắp xếp, Scan đọc toàn bảng; điều kiện lọc được áp sau khi dữ liệu đã được đọc nên không làm giảm lượng đọc. Đối chiếu Amazon DynamoDB — Query (aws-dynamodb-query) và phần thiết kế khoá trong DynamoDB data modeling (aws-dynamodb-model).",
    "Bài không khẳng định đơn giá hay hạn mức cụ thể của dịch vụ, vì các con số đó thay đổi theo vùng và theo thời điểm."
  ],
  "id": "L05",
  "stage": 1,
  "stageTitle": "Chặng 1 — AWS nền tảng",
  "title": "Cho trình duyệt tải thẳng lên S3 bằng URL ký sẵn, và đọc DynamoDB theo khoá",
  "goal": "Sau bài này bạn phải chọn được giữa cho tệp đi xuyên qua hàm và cho trình duyệt tải thẳng bằng URL ký sẵn, rồi viết được một truy vấn DynamoDB đi qua khoá phân vùng thay vì quét toàn bảng.",
  "bridge": "Bốn bài trước đã đi hết một request: quyền, thực thi và lớp trình duyệt. Bài này ghép chúng vào đường tải tệp, nơi dữ liệu lớn không nên đi xuyên qua hàm, và vào đường đọc dữ liệu, nơi cách đặt khoá quyết định chi phí.",
  "buildsOn": [
    "L02",
    "L03"
  ],
  "incident": "<p>Kịch bản giả định. Giao diện gửi ảnh 8 MB dưới dạng multipart tới một hàm sau API Gateway. Hàm được cấp 512 MB bộ nhớ, đọc toàn bộ tệp vào bộ nhớ, rồi ghi lên S3. Với ảnh lớn, hàm hết thời gian và trả lỗi; với ảnh nhỏ, độ trễ trung bình khoảng 6 giây.</p><p>Cùng lúc đó, màn hình \"đơn hàng của tôi\" đọc bảng đơn hàng bằng một lần quét toàn bảng, rồi lọc theo mã người dùng ở phía ứng dụng. Bảng có khoảng 200 000 bản ghi; mỗi lần mở màn hình, lượng đọc tính tiền tương đương đọc cả bảng, dù người dùng chỉ cần khoảng 50 đơn của mình.</p><p>Đội thử tăng bộ nhớ cho hàm và thêm chỉ mục phụ, nhưng chi phí đọc vẫn tăng theo số bản ghi chứ không theo số đơn của một người.</p>",
  "askFirst": [
    "Ai đang thực sự ghi tệp lên S3, và quyền ghi nằm ở đâu trong đường đi đó?",
    "Điều gì quyết định số bản ghi mà DynamoDB phải đọc cho một truy vấn?",
    "Nếu URL ký sẵn lộ ra ngoài thì thiệt hại tối đa là gì, và cái gì giới hạn nó?"
  ],
  "predict": {
    "q": "Kịch bản giả định: hàm ký một URL cho phép ghi một khoá duy nhất, hết hạn sau 300 giây, rồi trả URL đó cho trình duyệt. Người dùng bấm tải lên ở giây thứ 200 và mất 90 giây để tải xong. Hỏi: (a) chữ ký do ai tạo và bằng quyền gì, (b) trình duyệt có cầm credential AWS nào không, (c) nếu người dùng bấm ở giây thứ 320 thì nhận lỗi gì, (d) để lấy 50 đơn của một người trong bảng 200 000 bản ghi thì nên đọc bằng cách nào và đọc khoảng bao nhiêu bản ghi?",
    "a": "<p><strong>Kết luận: (a) do hàm ký bằng quyền của execution role, (b) không cầm credential nào, (c) lỗi truy cập bị từ chối vì chữ ký hết hạn, (d) Query theo khoá phân vùng, đọc đúng phần của người đó.</strong></p><ul><li><strong>(a)</strong> Hàm gọi API của S3 để tạo chữ ký bằng credential tạm của execution role. Chữ ký ràng buộc thao tác, bucket, khoá và thời hạn; quyền thực thi vẫn là quyền của role.</li><li><strong>(b)</strong> Trình duyệt chỉ nhận một URL đã có chữ ký trong query string, không có access key. Vì vậy không cần nhúng credential vào giao diện, và cũng không thể dùng URL đó cho khoá khác.</li><li><strong>(c)</strong> Hết hạn tính theo thời điểm chữ ký được tạo, không theo thời điểm bắt đầu tải. Bấm ở giây thứ 320 là sau mốc 300 giây, nên yêu cầu bị từ chối với lỗi truy cập; nếu chữ ký còn hạn mà tải dài hơn hạn thì phần đã gửi vẫn có thể hoàn tất.</li><li><strong>(d)</strong> Dùng Query với khoá phân vùng là mã người dùng: chỉ phần dữ liệu của người đó được đọc, khoảng 50 bản ghi cộng phần đọc thừa của một trang kết quả. Nếu lọc sau khi quét, toàn bộ bảng vẫn bị đọc rồi mới bị loại.</li></ul>"
  },
  "naive": "<p>Phản xạ quen tay: tệp thì cho đi qua hàm cho dễ kiểm soát, còn đọc dữ liệu thì quét rồi lọc, vì viết như vậy nhanh và không phải nghĩ trước về khoá. Cả hai đều nghe hợp lý: đi qua hàm thì kiểm tra được mọi thứ ở một chỗ, còn lọc ở phía ứng dụng thì không phải sửa cấu trúc bảng.</p><p>Đoạn dưới đây là đúng thứ hay được viết trong tình huống đó.</p>",
  "naiveCode": "# Kịch bản giả định: tệp 8 MB đi qua hàm, màn hình đơn hàng quét cả bảng.\n@app.post(\"/upload\")\nasync def upload(file: UploadFile):\n    data = await file.read()  # toàn bộ tệp nằm trong bộ nhớ của hàm\n    s3.put_object(Bucket=BUCKET, Key=file.filename, Body=data)\n\n# Và phía đọc:\nitems = table.scan()[\"Items\"]\nmine = [i for i in items if i[\"userId\"] == user_id]  # lọc sau khi đã đọc hết",
  "naiveOut": "<p>Với tệp lớn, hàm hết thời gian hoặc hết bộ nhớ, và độ trễ tăng theo kích thước tệp vì dữ liệu phải đi qua hai chặng. Với màn hình đơn hàng, mỗi lần mở vẫn đọc cả bảng: chi phí tăng theo số bản ghi chứ không theo số đơn của người dùng, và màn hình chậm dần đều khi dữ liệu lớn lên — trong khi thêm chỉ mục phụ không giúp gì cho một lần quét.</p>",
  "timeline": [
    [
      "T+0",
      "Giao diện gửi tệp 8 MB qua API Gateway tới hàm"
    ],
    [
      "T+0",
      "Hàm đọc cả tệp vào bộ nhớ rồi ghi lên S3, độ trễ khoảng 6 giây"
    ],
    [
      "T+1 ngày",
      "Ảnh lớn hơn làm hàm hết thời gian, người dùng thấy lỗi khi tải lên"
    ],
    [
      "T+2 ngày",
      "Chuyển sang URL ký sẵn, trình duyệt ghi thẳng lên S3, hàm chỉ ký"
    ],
    [
      "T+2 ngày",
      "Đổi màn hình đơn hàng sang Query theo khoá phân vùng"
    ],
    [
      "T+3 ngày",
      "Lượng đọc tính tiền giảm từ cả bảng xuống phần của một người dùng"
    ]
  ],
  "rootCause": "<p><strong>Chuỗi nhân quả của đúng sự cố này.</strong></p><ul><li>Tệp đi xuyên qua hàm nên dữ liệu phải nằm trong bộ nhớ và trong thời gian chạy của hàm, hai thứ đều có trần.</li><li>Độ trễ của đường tải lên bằng thời gian tải lên cộng thời gian hàm ghi, nên tăng theo kích thước tệp hai lần.</li><li>Việc đọc dùng quét toàn bảng, nên lượng đọc tính tiền không phụ thuộc số bản ghi cần trả về mà phụ thuộc kích thước bảng.</li><li>Điều kiện lọc được áp sau khi dữ liệu đã đọc, nên lọc không làm giảm lượng đọc — đây là lý do thêm chỉ mục phụ không cải thiện được gì.</li><li>Thiết kế khoá không có khoá phân vùng theo người dùng, nên không có đường đọc rẻ hơn để chuyển sang.</li></ul>",
  "concept": "<p>URL ký sẵn đặt quyền hạn vào chính đường dẫn trong một thời hạn, còn DynamoDB chỉ rẻ khi truy vấn đi qua khoá phân vùng — điều kiện lọc chỉ chạy sau khi dữ liệu đã được đọc.</p>",
  "mechanism": "<p>Hai đường riêng biệt: ghi tệp và đọc bản ghi.</p><ol><li><strong>Hàm ký thay vì chuyển dữ liệu.</strong> Hàm gọi API của S3 để tạo chữ ký cho đúng một thao tác, đúng bucket, đúng khoá, kèm thời hạn. Quyền trong chữ ký là quyền của execution role tại thời điểm ký, và chữ ký không mở rộng được sang khoá khác.</li><li><strong>Trình duyệt ghi trực tiếp.</strong> Trình duyệt gửi tệp lên S3 bằng chính URL đó, không cần credential AWS. Hàm không còn giữ dữ liệu trong bộ nhớ và không còn bị tính thời gian theo kích thước tệp; đổi lại, hàm không thấy nội dung tệp nên muốn kiểm tra thì phải làm sau, bằng một sự kiện từ S3.</li><li><strong>Xác nhận sau khi ghi xong.</strong> Sau khi tải lên, client báo lại khoá cho API để ghi metadata vào cơ sở dữ liệu, hoặc để hệ thống nghe sự kiện của bucket và tự ghi. Bước này là nơi trạng thái nghiệp vụ được cập nhật, nên nó phải chịu được việc được gọi hai lần.</li><li><strong>Khoá quyết định chi phí đọc.</strong> Với DynamoDB, Query đi theo khoá phân vùng và đọc đúng phần dữ liệu nằm dưới khoá đó; Scan đi qua toàn bảng. Điều kiện lọc được áp sau khi đọc, nên nó chỉ giảm số bản ghi trả về chứ không giảm lượng đọc tính tiền.</li><li><strong>Hệ quả khi thiết kế khoá.</strong> Khoá phân vùng nên là thứ mọi truy vấn đều biết trước; một khoá bị dồn quá nhiều bản ghi sẽ thành điểm nóng, còn một bảng không có khoá đúng sẽ luôn phải quét. Sửa khoá về sau khó hơn nhiều so với sửa chỉ mục.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"URL ký sẵn là công khai.\"</strong> Nghe hợp lý vì URL không có mật khẩu và ai có nó cũng dùng được. Điều đúng: URL chỉ cho đúng thao tác trên đúng khoá và hết hạn theo thời gian đã ký, nên thiệt hại bị chặn trong phạm vi đó. Phản chứng: đổi khoá trong URL đã ký rồi gửi lại, và thấy yêu cầu bị từ chối.</li><li><strong>\"Quét bảng cũng nhanh vì bảng còn nhỏ.\"</strong> Nghe hợp lý vì ở môi trường phát triển, quét vài nghìn bản ghi trả về gần như tức thì. Điều đúng: lượng đọc tính tiền tăng theo kích thước bảng, nên chi phí tăng dù độ trễ còn chấp nhận được. Phản chứng: so lượng đọc tính tiền của một lần quét ở hai kích thước bảng khác nhau, cùng một truy vấn nghiệp vụ.</li><li><strong>\"Thêm điều kiện lọc là giảm chi phí.\"</strong> Nghe hợp lý vì kết quả trả về ít hơn hẳn. Điều đúng: lọc chạy sau khi đọc, nên lượng đọc không đổi. Phản chứng: thêm điều kiện lọc chặt hơn và thấy số bản ghi trả về giảm còn lượng đọc tính tiền giữ nguyên.</li></ul>",
  "tradeoff": "<p><strong>Cái được và cái mất.</strong></p><ul><li><strong>Tải thẳng bằng URL ký sẵn:</strong> được độ trễ và bộ nhớ của hàm không còn phụ thuộc kích thước tệp; mất khả năng kiểm tra nội dung trước khi tệp vào bucket, và phải thêm một bước xác nhận.</li><li><strong>Đi qua hàm:</strong> được kiểm tra, đổi tên và ghi metadata trong cùng một giao dịch; mất trần về kích thước và độ trễ, và tốn thời gian chạy cho việc chỉ là chuyển tiếp byte.</li><li><strong>Query theo khoá:</strong> được lượng đọc tỉ lệ với dữ liệu cần, và độ trễ ổn định khi bảng lớn; mất tính linh hoạt, vì mọi truy vấn mới phải khớp thiết kế khoá hoặc phải thêm chỉ mục phụ.</li><li><strong>Thời hạn ký dài:</strong> được ít lỗi hết hạn khi mạng chậm; mất phạm vi thiệt hại, vì một URL bị lộ dùng được lâu hơn.</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn cách khác.</strong></p><ul><li><strong>Tệp nhỏ và cần kiểm tra ngay:</strong> cho đi qua hàm để chặn loại tệp sai trước khi vào bucket, chấp nhận trần kích thước.</li><li><strong>Tải nhiều phần cho tệp rất lớn:</strong> chia thành nhiều phần và ký từng phần, thay vì một URL cho cả tệp.</li><li><strong>Truy vấn linh hoạt theo nhiều tiêu chí:</strong> dùng một kho dữ liệu có chỉ mục theo cột, thay vì cố thêm nhiều chỉ mục phụ vào bảng khoá-giá trị.</li><li><strong>Dữ liệu phân tích, không phải giao dịch:</strong> đẩy sang kho phân tích chuyên đọc theo lô, thay vì quét bảng giao dịch.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết chi phí đọc đến từ đâu.</strong></p><ul><li><strong>Lượng đọc tính tiền của từng truy vấn:</strong> so với số bản ghi thực sự trả về; chênh lệch lớn là dấu hiệu đang quét hoặc lọc sau khi đọc.</li><li><strong>Chỉ số bị chặn do vượt hạn mức:</strong> xuất hiện khi một khoá phân vùng bị dồn quá nhiều, khác với chậm đều do bảng lớn.</li><li><strong>Kích thước và thời gian chạy của hàm tải lên:</strong> nếu cả hai tăng theo kích thước tệp thì tệp đang đi xuyên qua hàm.</li><li><strong>Log truy cập của bucket:</strong> cho biết lần ghi thật sự đến từ trình duyệt hay từ hàm, và có bao nhiêu lần ghi cho một tệp.</li></ul>",
  "attacks": [
    {
      "q": "Vì sao URL ký sẵn an toàn hơn việc nhúng credential vào giao diện?",
      "a": "<p><strong>Kết luận: vì quyền bị giới hạn trong một thao tác, một khoá và một thời hạn, thay vì quyền của cả một danh tính.</strong> Chữ ký ràng buộc đúng thao tác, đúng bucket, đúng khoá và thời điểm hết hạn; người giữ URL không gọi được thao tác khác và không đọc được khoá khác. Điều kiện: thời hạn phải ngắn và hàm ký phải kiểm tra người dùng trước khi ký, nếu không thì bất kỳ ai gọi được API ký cũng xin được URL. Dấu hiệu kiểm chứng: sửa khoá trong URL đã ký và thấy yêu cầu bị từ chối; chờ quá thời hạn và thấy bị từ chối.</p>"
    },
    {
      "q": "Khi nào nên cho tệp đi qua hàm, khi nào cho đi thẳng lên S3?",
      "a": "<p><strong>Kết luận: đi thẳng khi tệp lớn và không cần kiểm tra trước, đi qua hàm khi phải chặn loại tệp hoặc biến đổi ngay trong cùng bước.</strong> Đi qua hàm khiến độ trễ và bộ nhớ phụ thuộc kích thước tệp, và mọi tệp đều tốn thời gian chạy của hàm. Đi thẳng thì hàm chỉ ký, còn việc kiểm tra nội dung chuyển sang một bước sau, chạy trên sự kiện của bucket. Điều kiện: nếu quy định bắt buộc không cho tệp sai vào bucket, phải có bước chặn ở phía nhận sự kiện. Dấu hiệu kiểm chứng: so độ trễ tải lên của hai cách với cùng một tệp, và so thời gian chạy trung bình của hàm.</p>"
    },
    {
      "q": "Vì sao thêm điều kiện lọc không làm giảm chi phí đọc DynamoDB?",
      "a": "<p><strong>Kết luận: vì điều kiện lọc được áp sau khi dữ liệu đã đọc, nên lượng đọc tính tiền vẫn theo phần dữ liệu đã đi qua.</strong> Muốn giảm chi phí thì phải giảm phần dữ liệu được đọc, nghĩa là truy vấn phải đi qua khoá phân vùng hoặc qua một chỉ mục có khoá phù hợp. Điều kiện: chỉ mục phụ giúp được khi truy vấn mới dùng đúng khoá của chỉ mục đó, không phải khi vẫn quét. Dấu hiệu kiểm chứng: thêm điều kiện lọc chặt hơn, thấy số bản ghi trả về giảm mà lượng đọc tính tiền không đổi.</p>"
    },
    {
      "q": "Nếu một khoá phân vùng bị dồn quá nhiều bản ghi thì biểu hiện ra sao?",
      "a": "<p><strong>Kết luận: biểu hiện là các yêu cầu bị chặn hoặc chậm không đều, dù tổng lưu lượng còn thấp.</strong> Một khoá nhận quá nhiều lưu lượng sẽ chạm hạn mức của chính khoá đó, trong khi các khoá khác vẫn rảnh, nên chỉ số tổng không phản ánh đúng. Điều kiện: hiện tượng chỉ xuất hiện khi lưu lượng tập trung vào một khoá, thường là khoá có giá trị ít biến thiên. Dấu hiệu kiểm chứng: xem chỉ số bị chặn theo khoá, hoặc thử phân tán khoá và thấy hiện tượng giảm.</p>"
    }
  ],
  "anchor": "Quyền ghi tạm thời nên nằm trong chính URL ký sẵn, còn chi phí đọc DynamoDB nằm ở khoá phân vùng chứ không ở điều kiện lọc.",
  "say30": "URL ký sẵn đặt quyền hạn vào chính đường dẫn trong một thời hạn: hàm ký bằng quyền của execution role, trình duyệt ghi thẳng lên S3 mà không cầm credential nào, nên độ trễ và bộ nhớ của hàm không còn phụ thuộc kích thước tệp. Với DynamoDB, chi phí đọc phụ thuộc khoá phân vùng: Query đọc đúng phần cần, còn Scan đọc cả bảng rồi mới lọc, nên điều kiện lọc không làm giảm tiền.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: giao diện gửi ảnh 8 MB qua API Gateway tới một hàm, hàm đọc cả tệp vào bộ nhớ rồi ghi lên S3, và ảnh lớn làm hàm hết thời gian. Cùng lúc, màn hình đơn hàng quét bảng 200 000 bản ghi rồi lọc theo mã người dùng, nên chi phí đọc tăng theo kích thước bảng dù mỗi người chỉ cần khoảng 50 đơn.\n\n[Cơ chế (45s)]: Hàm gọi API của S3 để ký cho đúng một thao tác, đúng khoá và một thời hạn; chữ ký mang quyền của execution role nhưng không mở rộng sang khoá khác, nên trình duyệt ghi trực tiếp mà không cần credential. Hàm sau đó chỉ nhận xác nhận để ghi metadata. Với DynamoDB, Query đi theo khoá phân vùng còn Scan đi qua cả bảng; điều kiện lọc áp sau khi đọc nên chỉ giảm số bản ghi trả về.\n\n[Ranh giới (15s)]: URL ký sẵn không kiểm tra nội dung tệp, nên nếu quy định bắt buộc chặn loại tệp sai thì phải có bước kiểm tra sau khi tệp vào bucket. Tôi cũng không nới thời hạn ký, vì thời hạn chính là phạm vi thiệt hại.",
  "body": "<p><strong>Chuyển sang tình huống khác cùng hình dạng.</strong> Giả sử bạn làm phần xuất báo cáo: người dùng bấm xuất, hệ thống tạo một tệp lớn rồi trả về cho họ tải xuống. Cùng một nguyên tắc áp dụng ngược chiều: hàm chỉ ký một URL cho phép đọc đúng một khoá, còn dữ liệu đi thẳng từ kho lưu trữ tới trình duyệt. Hàm không giữ tệp trong bộ nhớ, và thời gian chạy của hàm không còn tỉ lệ với kích thước báo cáo.</p><p><strong>Vì sao phải có bước xác nhận.</strong> Khi tệp đi thẳng lên kho, hệ thống chỉ biết khoá chứ không biết tệp đã tới chưa. Bước xác nhận — do client báo lại hoặc do nghe sự kiện của bucket — là nơi duy nhất đánh dấu trạng thái nghiệp vụ. Vì cả hai đường đều có thể gửi hai lần, bước này cần khoá chống lặp giống như mọi tác dụng phụ khác.</p><p><strong>Trong phỏng vấn.</strong> Câu hỏi hay gặp: làm sao cho trình duyệt tải tệp lên S3 mà không lộ credential? Câu trả lời tốt nói rõ quyền nằm trong chữ ký và bị giới hạn theo thao tác, khoá và thời hạn. Câu tiếp theo thường là: nếu người dùng gửi hai lần thì sao? Lúc đó cần nói về khoá duy nhất cho mỗi lần tải lên và về việc ghi metadata phải chịu được lặp, thay vì tin rằng mỗi lần bấm là một tệp mới.</p>",
  "code": "import json\nimport os\n\nimport boto3\n\n_s3 = boto3.client(\"s3\")\n_table = boto3.resource(\"dynamodb\").Table(os.environ[\"ORDERS_TABLE\"])\n\n\ndef sign_upload(event, context):\n    body = json.loads(event[\"body\"])\n    key = f\"uploads/{body['userId']}/{body['uploadId']}\"\n    url = _s3.generate_presigned_url(\n        ClientMethod=\"put_object\",\n        Params={\n            \"Bucket\": os.environ[\"UPLOAD_BUCKET\"],\n            \"Key\": key,\n            \"ContentType\": body[\"contentType\"],\n        },\n        ExpiresIn=300,\n    )\n    return {\"statusCode\": 200, \"body\": json.dumps({\"url\": url, \"key\": key})}\n\n\ndef list_orders(user_id):\n    return _table.query(\n        KeyConditionExpression=\"pk = :pk\",\n        ExpressionAttributeValues={\":pk\": f\"USER#{user_id}\"},\n    )[\"Items\"]",
  "codeNote": "<p><strong>Ba dòng quyết định hành vi.</strong> <code>generate_presigned_url(...)</code> không gửi dữ liệu nào tới S3; nó chỉ ký bằng credential tạm của execution role, nên chi phí ở đây là một phép tính chứ không phải một lần tải lên. <code>Key=f\"uploads/{...}/{...}\"</code> là chỗ duy nhất chữ ký bị ràng buộc vào một khoá, nên URL không dùng được cho tệp khác. <code>KeyConditionExpression=\"pk = :pk\"</code> là chỗ truy vấn đi qua khoá phân vùng thay vì quét.</p><p><strong>Câu hỏi tự giải thích:</strong> nếu <code>body['userId']</code> do client gửi lên và hàm không kiểm tra người dùng đang đăng nhập là ai, thì URL ký sẵn đang bảo vệ cái gì và không bảo vệ cái gì?</p>",
  "visuals": [
    {
      "id": "flow-upload-presign",
      "question": "Ai ký, ai ghi tệp, và vì sao quyền không nằm trong tay trình duyệt?",
      "focus": "Vue client"
    },
    {
      "id": "flow-dynamodb-access",
      "question": "Truy vấn đi qua khoá phân vùng hay đi qua toàn bảng, và điều kiện lọc nằm ở bước nào?",
      "focus": "Filter"
    }
  ],
  "sayIt": [
    "Hàm ký chứ không chuyển byte: chữ ký mang quyền, không phải trình duyệt.",
    "Chữ ký bị ràng buộc vào một thao tác, một khoá và một thời hạn.",
    "Tệp đi thẳng lên kho thì cần một bước xác nhận để đánh dấu trạng thái.",
    "Query đi theo khoá phân vùng, Scan đi qua cả bảng.",
    "Điều kiện lọc chạy sau khi đọc, nên nó không làm giảm chi phí đọc."
  ],
  "qids": ["G06","G08","G09"],
  "refs": [
    "aws-s3",
    "aws-dynamodb-query",
    "aws-dynamodb-model"
  ]
},
{
  "provenance": [
    "Các con số trong sự cố và dự đoán (12 000 message tồn, 6 consumer, lô 10 message, 40 giây mỗi message, visibility timeout 30 giây, 8000 giây để xử lý hết) là giả định để dựng kịch bản, không phải số đo của hệ thống thật hay giá trị mặc định của AWS.",
    "Hành vi của hàng đợi: message bị ẩn trong khoảng visibility timeout sau khi một consumer nhận, xử lý xong thì bị xoá, không xoá thì hiện lại cho consumer khác; redrive policy với số lần nhận tối đa đưa message sang dead-letter queue. Đối chiếu Amazon SQS — Visibility timeout (aws-sqs-visibility) và AWS Lambda best practices cho phần xử lý ít nhất một lần và tính idempotent (aws-lambda-best).",
    "Bài không khẳng định hạn mức hay đơn giá cụ thể của SQS, và không khẳng định thời gian chờ tối đa của long polling như một mặc định bắt buộc, vì các giá trị đó cấu hình được."
  ],
  "id": "L06",
  "stage": 1,
  "stageTitle": "Chặng 1 — AWS nền tảng",
  "title": "Vì sao thêm consumer không làm hàng đợi nhanh hơn",
  "goal": "Sau bài này bạn phải tính được số message một cụm consumer xử lý được trong một giây, chỉ ra vì sao visibility timeout ngắn hơn thời gian xử lý lại gây xử lý trùng, và chọn được chỗ đặt dead-letter queue.",
  "bridge": "Bài trước bạn đã thấy chi phí đọc dữ liệu phụ thuộc cách đặt khoá. Bài này đi vào phần việc chạy nền: hàng đợi, nơi một message có thể được giao cho hai consumer và không có gì tự sửa điều đó.",
  "buildsOn": [
    "L03",
    "L05"
  ],
  "incident": "<p>Kịch bản giả định. Một hàng đợi có 12 000 message tồn sau một đợt nhập dữ liệu. Hệ thống có 2 consumer, mỗi lần nhận tối đa 10 message và xử lý lần lượt từng message, mỗi message mất khoảng 40 giây. Visibility timeout đặt 30 giây.</p><p>Đội tăng lên 6 consumer và thấy backlog gần như không giảm. Đồng thời số email xác nhận gửi đi cao hơn số message thật khoảng một phần ba, và log có những message được hai consumer khác nhau xử lý cách nhau khoảng 30 giây.</p><p>Việc tăng consumer không sai, nhưng không giải quyết được phần lớn thời gian nằm ở đâu, và nó làm hiện tượng trùng lặp rõ hơn vì có thêm consumer sẵn sàng nhận lại message vừa hiện ra.</p>",
  "askFirst": [
    "Trong một giây, hệ thống hiện tại xử lý được bao nhiêu message, và con số đó phụ thuộc vào những đại lượng nào?",
    "Vì sao cùng một message lại được hai consumer xử lý, và điều gì cho phép chuyện đó xảy ra?",
    "Khi một consumer chết giữa chừng, message quay lại sau bao lâu và ai chịu trách nhiệm?"
  ],
  "predict": {
    "q": "Kịch bản giả định: 6 consumer, mỗi lần nhận tối đa 10 message, mỗi message mất 40 giây, visibility timeout 30 giây. Hỏi: (a) số message xử lý được trong một giây là bao nhiêu, (b) có message nào bị xử lý hai lần không, (c) nếu nâng visibility timeout lên 120 giây thì đổi lại cái gì, (d) nếu một consumer chết ngay sau khi nhận message thì message quay lại sau bao lâu?",
    "a": "<p><strong>Kết luận: (a) khoảng 1,5 message mỗi giây, (b) có, (c) hết trùng nhưng message của consumer chết lâu được giao lại hơn, (d) sau khoảng 30 giây theo cấu hình hiện tại.</strong></p><ul><li><strong>(a)</strong> Mỗi consumer xử lý 10 message trong 40 giây, tức 0,25 message mỗi giây; sáu consumer cho khoảng 1,5 message mỗi giây. Với 12 000 message thì cần khoảng 8000 giây, tức hơn hai giờ, và tăng consumer là cách duy nhất tăng con số này nếu thời gian mỗi message không đổi.</li><li><strong>(b)</strong> Có: visibility timeout 30 giây ngắn hơn 40 giây cần để xử lý, nên message hiện lại khi consumer đầu còn đang làm, và consumer khác nhận được nó. Đây là nguồn của phần email thừa.</li><li><strong>(c)</strong> Nâng lên 120 giây thì message không hiện lại giữa chừng nên hết trùng; đổi lại, nếu consumer chết thì message bị treo tới 120 giây mới được giao lại, nên phải đánh đổi giữa trùng lặp và độ trễ phục hồi.</li><li><strong>(d)</strong> Message quay lại khi hết visibility timeout, tức khoảng 30 giây sau lúc nhận, không phải ngay khi consumer chết — vì hàng đợi không biết consumer đã chết, nó chỉ biết chưa nhận được xác nhận xoá.</li></ul>"
  },
  "naive": "<p>Phản xạ quen tay: backlog không giảm thì thêm consumer, và thấy message bị xử lý hai lần thì xoá message ngay khi nhận cho chắc. Cả hai đều nghe hợp lý: nhiều người làm thì nhanh hơn, và xoá sớm thì không còn message nào bị giao lại.</p><p>Đoạn dưới đây là đúng thứ hay được sửa trong tình huống đó.</p>",
  "naiveCode": "# Kịch bản giả định: backlog không giảm, message bị xử lý hai lần.\n# Phản xạ: xoá message ngay sau khi nhận, để không ai nhận lại nữa.\nmsgs = sqs.receive_message(QueueUrl=QUEUE, MaxNumberOfMessages=10)[\"Messages\"]\nfor m in msgs:\n    sqs.delete_message(QueueUrl=QUEUE, ReceiptHandle=m[\"ReceiptHandle\"])\n    process(m[\"Body\"])  # nếu process lỗi thì message đã biến mất\n\n# Và tăng consumer từ 2 lên 6, giữ nguyên visibility timeout 30 giây.",
  "naiveOut": "<p>Số message trùng giảm, nhưng mọi message mà bước xử lý thất bại đều mất khỏi hàng đợi, nên không còn đường thử lại và dead-letter queue cũng không nhận được gì. Backlog vẫn giảm với tốc độ như cũ, vì thời gian mỗi message không đổi: thêm consumer chỉ tăng số việc song song, không làm mỗi việc nhanh hơn.</p>",
  "timeline": [
    [
      "T+0",
      "12 000 message tồn, 2 consumer, lô 10 message, 40 giây mỗi message"
    ],
    [
      "T+0",
      "Visibility timeout 30 giây ngắn hơn thời gian xử lý, message hiện lại giữa chừng"
    ],
    [
      "T+20 phút",
      "Đội tăng lên 6 consumer, backlog gần như không giảm"
    ],
    [
      "T+20 phút",
      "Số email xác nhận cao hơn số message thật khoảng một phần ba"
    ],
    [
      "T+1 giờ",
      "Log cho thấy cùng một message được hai consumer xử lý cách nhau khoảng 30 giây"
    ],
    [
      "T+2 giờ",
      "Nâng visibility timeout và thêm khoá chống lặp, số email khớp lại"
    ]
  ],
  "rootCause": "<p><strong>Chuỗi nhân quả của đúng sự cố này.</strong></p><ul><li>Mỗi consumer xử lý lần lượt từng message trong lô, nên số việc song song bị chặn bởi số consumer chứ không phải bởi số message trong lô.</li><li>Thời gian mỗi message khoảng 40 giây là phần lớn chi phí, nên tăng consumer chỉ tăng tuyến tính và không sửa được nguyên nhân.</li><li>Visibility timeout 30 giây ngắn hơn 40 giây, nên message hiện lại trước khi lần xử lý đầu kết thúc.</li><li>Consumer thứ hai nhận message đã hiện lại và làm lại từ đầu, tạo ra tác dụng phụ thứ hai — email thừa.</li><li>Code không có khoá chống lặp, nên lần xử lý thứ hai không biết lần đầu đã gửi email.</li></ul>",
  "concept": "<p>Visibility timeout là khoảng thời gian message bị ẩn sau khi một consumer nhận; ngắn hơn thời gian xử lý thì message hiện lại và bị giao cho consumer khác, nên giao ít nhất một lần là mặc định.</p>",
  "mechanism": "<p>Năm bước của một vòng giao và xác nhận.</p><ol><li><strong>Consumer hỏi hàng đợi.</strong> Consumer gọi API nhận message theo lô; hàng đợi trả về các message đang rảnh. Cách này là consumer chủ động hỏi, không phải hàng đợi đẩy, nên số việc song song bằng số consumer nhân số message mỗi lô đang được xử lý cùng lúc.</li><li><strong>Message bị ẩn, không bị xoá.</strong> Ngay khi trả về, message được ẩn trong khoảng visibility timeout. Trong khoảng đó không consumer nào khác nhận được nó, nhưng nó vẫn nằm trong hàng đợi.</li><li><strong>Xoá chỉ sau khi xong việc.</strong> Xử lý thành công thì consumer gọi xoá bằng mã nhận. Nếu không xoá, hết visibility timeout thì message hiện lại và được giao cho consumer khác, có thể trong khi consumer đầu vẫn đang chạy.</li><li><strong>Đếm số lần nhận và chuyển sang dead-letter queue.</strong> Mỗi lần giao lại làm số lần nhận tăng; redrive policy đặt số lần nhận tối đa, quá ngưỡng đó thì message được chuyển sang dead-letter queue thay vì quay vòng mãi.</li><li><strong>Thông lượng và tính lặp là hai bài toán khác nhau.</strong> Thông lượng xấp xỉ số consumer nhân số message xử lý song song chia thời gian mỗi message, nên muốn nhanh hơn thì hoặc thêm consumer, hoặc giảm thời gian mỗi message. Tính lặp được xử lý bằng visibility timeout dài hơn thời gian xử lý, cộng với khoá chống lặp trong code — vì hàng đợi chỉ hứa giao ít nhất một lần.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"Thêm consumer là hàng đợi nhanh hơn, kể cả khi đã thêm nhiều.\"</strong> Nghe hợp lý vì lần tăng đầu tiên có hiệu quả rõ. Điều đúng: thông lượng tỉ lệ với số consumer nhưng cũng tỉ lệ nghịch với thời gian mỗi message, nên nếu phần lớn thời gian nằm trong một lời gọi chậm thì thêm consumer chỉ nhân chi phí. Phản chứng: đo số message xử lý mỗi giây ở 2 và 6 consumer, thấy tăng đúng ba lần, rồi đo thời gian mỗi message và thấy nó không đổi.</li><li><strong>\"Message trong hàng đợi là message chưa ai nhận.\"</strong> Nghe hợp lý vì hàng đợi là nơi chứa việc còn tồn. Điều đúng: message đang được xử lý vẫn nằm trong hàng đợi, chỉ bị ẩn tạm, nên số message nhìn thấy không phải số việc còn phải làm. Phản chứng: khi một consumer đang xử lý, message vẫn hiện trong danh sách message của hàng đợi nhưng không nhận được.</li><li><strong>\"Xoá message sớm thì tránh được xử lý trùng.\"</strong> Nghe hợp lý vì message không còn thì không ai nhận lại. Điều đúng: xoá sớm biến lỗi tạm thời thành mất việc, và dead-letter queue không bao giờ nhận được message hỏng. Phản chứng: cho bước xử lý ném lỗi sau khi đã xoá, thấy message không quay lại và cũng không có bản ghi nào trong dead-letter queue.</li></ul>",
  "tradeoff": "<p><strong>Cái được và cái mất.</strong></p><ul><li><strong>Visibility timeout dài:</strong> được hết xử lý trùng khi thời gian xử lý ổn định; mất tốc độ phục hồi, vì message của consumer chết bị treo lâu hơn.</li><li><strong>Lô lớn:</strong> được ít lời gọi hơn cho mỗi message; mất thời gian ẩn cả lô, vì một message lỗi có thể làm cả lô phải làm lại.</li><li><strong>Nhiều consumer:</strong> được thông lượng cao hơn; mất tính thứ tự và làm hiện tượng trùng lặp rõ hơn nếu visibility timeout chưa đủ dài.</li><li><strong>Gia hạn visibility trong khi xử lý:</strong> được message dài không bị giao lại; mất sự đơn giản, vì phải quản lý vòng gia hạn và dừng nó đúng lúc.</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn cách khác.</strong></p><ul><li><strong>Việc chạy lâu hơn một lần xử lý hợp lý:</strong> chia thành nhiều bước có trạng thái thay vì gia hạn visibility liên tục.</li><li><strong>Cần đúng thứ tự:</strong> dùng hàng đợi có bảo đảm thứ tự theo nhóm, chấp nhận thông lượng thấp hơn.</li><li><strong>Cần giao đúng một lần cho mỗi khoá:</strong> thêm khoá chống lặp ở tầng lưu trữ thay vì trông vào hàng đợi.</li><li><strong>Việc nhẹ, khối lượng lớn:</strong> xử lý theo lô lớn hơn với ít consumer hơn, để giảm số lời gọi và chi phí.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết đang trùng hay đang chậm.</strong></p><ul><li><strong>Số message nhìn thấy và số message đang được xử lý:</strong> hai con số này khác nhau; nếu số đang xử lý gần bằng số consumer nhân lô thì hệ thống đang bão hoà.</li><li><strong>Số lần nhận của từng message:</strong> lớn hơn một là dấu hiệu visibility timeout ngắn hơn thời gian xử lý, hoặc bước xử lý thất bại.</li><li><strong>Độ sâu dead-letter queue:</strong> nơi duy nhất thấy những message đã thử hết lượt; nếu nó luôn rỗng trong khi có lỗi, có thể message đang bị xoá quá sớm.</li><li><strong>Thời gian mỗi message:</strong> đo riêng phần xử lý và phần chờ; nếu phần chờ lớn thì thêm consumer không giúp gì.</li></ul>",
  "attacks": [
    {
      "q": "Visibility timeout hoạt động thế nào, và vì sao nó là nguồn của xử lý trùng?",
      "a": "<p><strong>Kết luận: message bị ẩn trong khoảng visibility timeout sau khi một consumer nhận, và nếu consumer chưa xoá khi hết khoảng đó thì message hiện lại cho người khác.</strong> Hàng đợi không biết consumer còn sống hay đã chết, nó chỉ biết đã nhận được xác nhận xoá hay chưa. Điều kiện: trùng xảy ra khi thời gian xử lý dài hơn visibility timeout, hoặc khi consumer chết giữa chừng. Dấu hiệu kiểm chứng: xem số lần nhận của message, và so thời gian xử lý trung bình với giá trị visibility timeout đang cấu hình.</p>"
    },
    {
      "q": "Backlog không giảm thì nên thêm consumer hay giảm thời gian mỗi message?",
      "a": "<p><strong>Kết luận: đo trước, vì hai cách sửa hai nguyên nhân khác nhau.</strong> Thông lượng xấp xỉ số consumer nhân số message xử lý song song chia thời gian mỗi message; nếu thời gian mỗi message bị chi phối bởi một lời gọi chậm bên ngoài thì thêm consumer chỉ nhân số lời gọi chậm đó. Điều kiện: thêm consumer có ích khi phần lớn thời gian là chờ I/O độc lập và tài nguyên phía sau còn dư. Dấu hiệu kiểm chứng: tăng gấp ba số consumer và thấy thông lượng tăng gần gấp ba thì nút thắt là số consumer; nếu không tăng thì nút thắt nằm trong từng message hoặc ở tài nguyên phía sau.</p>"
    },
    {
      "q": "Nếu xử lý một message cần thời gian dài hơn mọi giá trị visibility timeout hợp lý thì làm gì?",
      "a": "<p><strong>Kết luận: chia việc thành nhiều bước có trạng thái, thay vì kéo dài một lần xử lý.</strong> Gia hạn visibility liên tục trong lúc xử lý là cách chữa cháy, nhưng nó phụ thuộc vào việc vòng gia hạn còn sống, nên consumer chết là mất luôn cả hai. Điều kiện: chia bước chỉ hiệu quả khi mỗi bước tự nó chịu được việc chạy lại. Dấu hiệu kiểm chứng: nếu một message có thời gian xử lý biến thiên rất rộng, đó là dấu hiệu việc đang bị gộp quá nhiều vào một bước.</p>"
    },
    {
      "q": "Hàng đợi có bảo đảm mỗi message chỉ được xử lý một lần không?",
      "a": "<p><strong>Kết luận: không, mô hình mặc định là giao ít nhất một lần, nên code phải chịu được lặp.</strong> Vì message có thể hiện lại sau visibility timeout và consumer có thể chết sau khi đã làm xong việc nhưng trước khi xoá, mọi tác dụng phụ đều có thể xảy ra hai lần. Điều kiện: chỉ những hàng đợi có bảo đảm thứ tự và khử trùng theo nhóm mới giảm được khả năng này, và vẫn không loại bỏ hoàn toàn. Dấu hiệu kiểm chứng: đếm số lần một tác dụng phụ được thực hiện cho cùng một message, so với số message thật đã gửi vào hàng đợi.</p>"
    }
  ],
  "anchor": "Hàng đợi chỉ hứa giao ít nhất một lần, nên visibility timeout phải dài hơn thời gian xử lý và mọi tác dụng phụ phải chịu được lặp.",
  "say30": "Message bị ẩn trong khoảng visibility timeout sau khi một consumer nhận, và chỉ bị xoá khi consumer xác nhận xong việc. Nếu visibility timeout ngắn hơn thời gian xử lý thì message hiện lại và bị giao cho consumer khác, nên cùng một việc chạy hai lần. Thêm consumer chỉ tăng số việc song song, không làm mỗi việc nhanh hơn, nên backlog chỉ giảm theo số consumer và thời gian mỗi message.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: 12 000 message tồn, 2 consumer, lô 10 message, mỗi message 40 giây, visibility timeout 30 giây. Đội tăng lên 6 consumer mà backlog gần như không giảm, đồng thời số email xác nhận cao hơn số message thật khoảng một phần ba, với những message được hai consumer xử lý cách nhau khoảng 30 giây.\n\n[Cơ chế (45s)]: Consumer chủ động nhận theo lô; message vừa trả về bị ẩn trong khoảng visibility timeout và chỉ bị xoá khi có xác nhận. Vì 30 giây ngắn hơn 40 giây cần để xử lý, message hiện lại khi consumer đầu còn đang làm, và consumer khác nhận được nó. Thông lượng xấp xỉ số consumer nhân số message xử lý song song chia thời gian mỗi message, nên sáu consumer cho khoảng 1,5 message mỗi giây, cần hơn hai giờ cho 12 000 message. Redrive policy đặt số lần nhận tối đa rồi chuyển sang dead-letter queue.\n\n[Ranh giới (15s)]: Hàng đợi không hứa đúng một lần, nên code vẫn phải có khoá chống lặp; và tôi không xoá message trước khi xử lý, vì làm vậy biến lỗi tạm thời thành mất việc.",
  "body": "<p><strong>Chuyển sang tình huống khác cùng hình dạng.</strong> Giả sử bạn làm phần gửi thông báo: một message vào hàng đợi, một worker soạn nội dung, gọi dịch vụ gửi, rồi xoá message. Cùng một message có thể tới hai lần vì nhiều lý do, và mỗi lý do đến từ một tầng khác nhau: visibility timeout ngắn, consumer chết sau khi gửi nhưng trước khi xoá, hoặc hàng đợi giao lại sau một lần lỗi mạng. Cách làm bền vững là đặt khoá theo nội dung message ở đầu worker, và chỉ gọi dịch vụ gửi khi khoá chưa tồn tại.</p><p><strong>Cách đọc một hàng đợi đang tắc.</strong> Trước tiên so số message đang được xử lý với số consumer nhân kích thước lô: nếu gần bằng nhau thì hệ thống đang bão hoà và thêm consumer là có ích. Sau đó đo thời gian mỗi message; nếu phần lớn là chờ một lời gọi bên ngoài thì nút thắt nằm ở đó, và thêm consumer chỉ nhân số lời gọi chậm. Cuối cùng xem số lần nhận: lớn hơn một là dấu hiệu visibility timeout chưa đủ dài.</p><p><strong>Trong phỏng vấn.</strong> Câu hỏi hay gặp: làm sao để mỗi message chỉ được xử lý một lần? Câu trả lời tốt nói rõ điều đó không đạt được bằng cấu hình hàng đợi, mà bằng khoá chống lặp trong code; cấu hình chỉ giảm khả năng xảy ra. Câu tiếp theo thường là: consumer chết giữa chừng thì sao? Message quay lại sau khi hết visibility timeout, và đó là lý do phải chọn giữa trùng lặp và tốc độ phục hồi.</p>",
  "code": "import json\nimport os\nimport time\n\nimport boto3\n\nsqs = boto3.client(\"sqs\")\nQUEUE = os.environ[\"QUEUE_URL\"]\nVISIBILITY = 120\n\n\ndef main():\n    while True:\n        resp = sqs.receive_message(\n            QueueUrl=QUEUE,\n            MaxNumberOfMessages=10,\n            WaitTimeSeconds=20,\n            VisibilityTimeout=VISIBILITY,\n        )\n        for m in resp.get(\"Messages\", []):\n            if already_done(m[\"MessageId\"]):\n                sqs.delete_message(QueueUrl=QUEUE, ReceiptHandle=m[\"ReceiptHandle\"])\n                continue\n            process(json.loads(m[\"Body\"]))\n            mark_done(m[\"MessageId\"])\n            sqs.delete_message(QueueUrl=QUEUE, ReceiptHandle=m[\"ReceiptHandle\"])",
  "codeNote": "<p><strong>Ba dòng quyết định hành vi.</strong> <code>VisibilityTimeout=VISIBILITY</code> là chỗ đặt khoảng ẩn dài hơn thời gian xử lý thực tế, nên message không hiện lại giữa chừng. <code>mark_done(...)</code> ghi khoá chống lặp trước khi xoá, nên nếu lần chạy sau nhận lại cùng message thì <code>already_done</code> chặn tác dụng phụ. <code>sqs.delete_message(...)</code> chỉ chạy sau khi xử lý xong; nếu xoá trước thì message mất khi <code>process</code> lỗi.</p><p><strong>Câu hỏi tự giải thích:</strong> nếu <code>process</code> chạy 200 giây, dài hơn cả <code>VISIBILITY</code>, thì message sẽ bị giao lại lúc nào, và cần thêm gì để tránh việc đó?</p>",
  "visuals": [
    {
      "id": "flow-sqs-visibility",
      "question": "Message bị ẩn ở bước nào, và điều gì xảy ra khi hết khoảng ẩn mà chưa có xác nhận xoá?",
      "focus": "Visibility timeout"
    }
  ],
  "sayIt": [
    "Message được ẩn chứ không bị xoá khi một consumer nhận.",
    "Visibility timeout ngắn hơn thời gian xử lý là nguồn của xử lý trùng.",
    "Thông lượng bằng số consumer nhân số message song song chia thời gian mỗi message.",
    "Redrive policy đặt số lần nhận tối đa rồi chuyển sang dead-letter queue.",
    "Giao ít nhất một lần là mặc định, nên khoá chống lặp nằm ở code chứ không ở hàng đợi."
  ],
  "qids": ["G10","G11","E09"],
  "refs": [
    "aws-sqs-visibility",
    "aws-lambda-best"
  ]
},
);
