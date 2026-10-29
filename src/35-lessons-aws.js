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
  "incident": "<p><strong>Không có thứ này thì đau ở đâu?</strong> Kịch bản giả định, không phải số đo. Một endpoint đăng ký upload chạy sau API Gateway: mỗi request gọi một hàm Lambda, hàm ghi một dòng vào RDS PostgreSQL rồi trả về.</p><p>Ngày thường 60 request mỗi giây, p99 (phân vị 99 — chậm hơn 99 phần trăm số request còn lại) quanh 180 ms, khoảng 12 lần gọi chạy đồng thời.</p><p>Chiều thứ Ba, đội chạy thử tải 200 request mỗi giây trong bốn phút. Sau phút thứ tư, p99 lên 4,2 giây và một phần request bị treo tới khi API Gateway trả 504 (gateway chờ quá lâu).</p><p>Không dịch vụ nào tự báo quá tải: Lambda vẫn trả 200, mỗi lần gọi vẫn khoảng 600 ms, CPU của RDS khoảng 35 phần trăm. Chỉ hai con số đổi: p99, và số lần gọi chạy đồng thời từ 12 lên 380.</p><p><strong>Câu hỏi dự đoán:</strong> khớp nào đang xếp hàng mà dashboard của chính nó vẫn xanh? <strong>Đáp án:</strong> khớp Lambda đi vào RDS — cái chờ nằm ở việc xin một kết nối.</p>",
  "askFirst": [
    "Trong chuỗi trình duyệt, API Gateway, Lambda, RDS và SQS, khớp nào có thể đang xếp hàng chờ mà không hề đổi màu trên dashboard của chính nó?",
    "Phần nào của chuỗi này do AWS vận hành, phần nào bạn vẫn phải tự cấu hình, và ranh giới đó nằm ở thao tác cụ thể nào?",
    "Một Availability Zone mất điện thì phần nào của chuỗi vẫn chạy, phần nào dừng, và client đang giữ kết nối cũ sẽ thấy gì?"
  ],
  "predict": {
    "q": "Kịch bản giả định: endpoint nhận 200 request mỗi giây, mỗi lần gọi Lambda mất 600 ms nếu không phải chờ kết nối, code mở một kết nối cho mỗi environment rồi giữ lại, và RDS đặt max_connections = 40. Hỏi: (a) nếu mọi lần gọi đều lấy được kết nối ngay thì cần bao nhiêu environment, (b) với trần 40 kết nối thì bao nhiêu lần gọi đồng thời không có kết nối, (c) nếu đặt thêm RDS Proxy giữ tối đa 20 kết nối thật thì con số nào đổi và con số nào không, (d) nếu thời gian mỗi lần gọi giảm còn 200 ms thì cần bao nhiêu environment?",
    "a": "<p><strong>Kết luận: (a) 120 environment, (b) 80 lần gọi phải chờ, (c) RDS chỉ còn thấy tối đa 20 kết nối nhưng số environment vẫn là 120, (d) 40 environment, vừa khít trần.</strong></p><ul><li><strong>(a)</strong> Concurrency bằng số request mỗi giây nhân thời gian một lần gọi: 200 × 0,6 = 120 environment.</li><li><strong>(b)</strong> 120 environment đòi 120 kết nối trong khi trần là 40, nên 80 lần gọi đồng thời không lấy được kết nối và phải chờ hoặc nhận lỗi. Khi chờ, thời gian mỗi lần gọi tăng, mà tăng thì lại cần thêm environment, nên con số thật còn cao hơn 120 — đây là vòng lặp tự đẩy mình lên, không phải một phép nhân yên tĩnh.</li><li><strong>(c)</strong> Proxy giữ tối đa 20 kết nối thật tới RDS, nên phía cơ sở dữ liệu không còn bị từ chối kết nối; nhưng 120 client vẫn phải chia nhau 20 kết nối, nên chúng xếp hàng ở proxy. Năng lực của instance không tăng, chỉ chỗ xếp hàng đổi từ RDS sang proxy.</li><li><strong>(d)</strong> 200 × 0,2 = 40 environment, đúng bằng trần 40 kết nối. Đây là chỗ nguy hiểm nhất vì vừa khít: chỉ cần lưu lượng nhích lên hoặc một truy vấn chậm đi là chạm trần ngay.</li></ul><p>Nhánh phụ: nếu code mở kết nối bên trong handler thay vì ngoài handler thì mỗi lần gọi mở một kết nối mới, số kết nối trong một giây bằng số lần gọi, và không có tham số pool nào cứu được.</p>"
  },
  "naive": "<p><strong>Cách tệ (làm theo phản xạ):</strong> thấy p99 tăng thì nâng trần concurrency (số lần gọi chạy cùng một lúc) của hàm, vì Lambda là tầng duy nhất nhìn thấy trên biểu đồ.</p><p>Cách này nghe hợp lý: hàm vẫn trả 200, mỗi lần gọi chỉ 600 ms, nên kết luận tầng tính toán còn khoẻ và chỉ thiếu concurrency rất dễ tin.</p><p>Nhưng nếu chỗ nghẽn là một tài nguyên có trần cố định ở cuối chuỗi, thêm environment (môi trường chạy riêng của một lần gọi) chỉ đưa thêm client vào cùng một hàng đợi.</p>",
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
  "rootCause": "<p><strong>Chuỗi nhân quả, mỗi dòng một ý.</strong></p><ul><li>200 request mỗi giây nhân 0,6 giây mỗi lần gọi ra 120 lần gọi đồng thời.</li><li>Code mở kết nối ngoài handler, nên mỗi environment còn ấm giữ một kết nối riêng.</li><li>RDS đặt max_connections = 40, nên 80 kết nối không được cấp.</li><li>Các lần gọi đó phải chờ, và chờ làm mỗi lần gọi lâu hơn.</li><li>Lâu hơn làm concurrency cao hơn, nên con số leo từ 120 lên 380 dù lưu lượng không đổi.</li><li>p99 tăng theo thời gian chờ, còn từng lần gọi vẫn nhanh nên biểu đồ của Lambda không đổi màu.</li></ul>",
  "concept": "<p>Serverless chỉ tự co giãn ở tầng không giữ trạng thái: mỗi environment Lambda là một client riêng, nên tăng số environment là tăng số kết nối cùng đòi vào một trần cố định ở cuối chuỗi.</p>",
  "mechanism": "<p><strong>Ví von đời thường:</strong> một bãi đỗ xe 40 chỗ trước toà nhà. Lambda là dòng khách đến liên tục, mỗi khách giữ một chỗ cho tới khi rời đi. RDS là bãi đỗ. Mở thêm cửa cho khách vào không làm bãi rộng ra; khách vẫn xếp hàng ngoài cổng.</p><p><em>Giới hạn của phép ví von:</em> xe giữ chỗ mãi mãi, còn kết nối thật có thể bị đóng khi rảnh quá lâu.</p><pre><code>Trình duyệt\n   │ HTTPS\n   ▼\nAPI Gateway                    ← AWS vận hành máy chủ; bạn cấu hình route, quyền\n   │\n   ▼\nLambda ×120 environment        ← mỗi environment còn ấm giữ 1 kết nối\n   │  120 kết nối cùng đòi một lúc\n   ▼\nRDS PostgreSQL  max_connections = 40   ◄── TRẦN: chỉ 40 chỗ\n   │\n   └─ 80 lần gọi phải chờ ở đây → p99 tăng, dashboard vẫn xanh</code></pre><ol><li><strong>Bước 1 — Một request chiếm một suất trong một khoảng thời gian:</strong> suất đó được nhả khi request xong. Đó là toàn bộ ý của chữ concurrency.</li><li><strong>Bước 2 — Số suất đang bận bằng tốc độ đến nhân thời gian phục vụ:</strong> 200 request mỗi giây nhân 0,6 giây ra 120 request đang chiếm suất. Đây chỉ là phép đếm.</li><li><strong>Bước 3 — Lambda cấp một execution environment cho mỗi suất, và environment được tái dùng:</strong> kết nối mở ngoài handler thuộc về environment, nên nó sống tiếp và 120 environment có thể giữ 120 kết nối.</li><li><strong>Bước 4 — Trần kết nối là con số cố định, nên phải đặt trần ở phía gọi:</strong> reserved concurrency thấp hơn max_connections để Lambda từ chối trước, hoặc RDS Proxy gom và xếp hàng kết nối. Chờ làm mọi thứ tệ hơn, nên trần phải nằm ở đầu chuỗi.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp, mỗi mục kèm thứ phản chứng nó.</p><ul><li><strong>\"Serverless tự co giãn mọi tầng.\"</strong> Nghe hợp lý vì Lambda bật thêm environment trong vài giây và dashboard của hàm luôn xanh. Điều đúng: chỉ tầng không giữ trạng thái co giãn theo request, còn RDS có trần kết nối cố định và mỗi environment còn ấm có thể giữ một kết nối. Phản chứng: log ứng dụng có <code>FATAL: sorry, too many clients already</code> đúng lúc số lần gọi đồng thời cao nhất, trong khi biểu đồ lỗi của hàm vẫn trống.</li><li><strong>\"RDS Proxy là cơ chế failover.\"</strong> Nghe hợp lý vì tài liệu nói proxy giúp ứng dụng bền hơn khi cơ sở dữ liệu gặp sự cố và giữ được kết nối của ứng dụng. Điều đúng: Multi-AZ mới là thứ chuyển sang standby bằng cách đổi bản ghi DNS, còn proxy chỉ là tùy chọn đứng trước để gom và xếp hàng kết nối. Phản chứng: một RDS Single-AZ đặt sau proxy vẫn ngừng phục vụ khi AZ của nó mất điện, vì proxy chỉ nối tới đúng instance đó.</li><li><strong>\"Failover xong thì kết nối cũ dùng tiếp.\"</strong> Nghe hợp lý vì tên endpoint không đổi nên tưởng địa chỉ cũng không đổi. Điều đúng: bản ghi DNS trỏ sang standby nên địa chỉ phía sau đổi, kết nối đang mở phải mở lại, và tiến trình cache DNS sẽ còn gọi vào địa chỉ cũ. Phản chứng: sau failover, log ứng dụng dồn dập lỗi kết nối cho tới khi tiến trình khởi động lại hoặc hết hạn cache DNS.</li></ul>",
  "tradeoff": "<p><strong>Được gì:</strong> Lambda cộng API Gateway trả tiền theo mức dùng và không phải vá hệ điều hành; Multi-AZ cho một bản dự phòng ở Availability Zone (trung tâm dữ liệu độc lập về điện và mạng) khác.</p><p><strong>Mất gì:</strong> mỗi environment là một client riêng, nên số kết nối downstream tỉ lệ với lưu lượng chứ không tỉ lệ với tham số pool trong code. RDS Proxy thêm một khớp phải cấu hình, theo dõi và có phí; khi vượt hạn mức thì chính proxy từ chối kết nối. Reserved concurrency thấp thì request vượt trần bị throttle ngay. Multi-AZ thêm độ trễ ghi vì phải đồng bộ sang standby, và standby không phục vụ đọc.</p><p><strong>Rủi ro:</strong> đặt trần bằng đúng max_connections thì không còn chỗ cho vận hành, migration hay client khác.</p><p><strong>Vì sao vẫn đáng:</strong> bạn đổi một lỗi khó đọc ở cuối chuỗi thành một tín hiệu rõ ở đầu chuỗi — throttle thay vì lỗi quá nhiều client của cơ sở dữ liệu.</p>",
  "alternatives": "<p><strong>Khi nào KHÔNG nên dùng.</strong></p><ul><li>Đừng đặt RDS Proxy khi nút thắt là truy vấn thiếu index hoặc IO của ổ đĩa: proxy chỉ làm hàng đợi dài hơn.</li><li>Đừng chọn Multi-AZ với ý định mở rộng đọc; muốn đọc nhiều hơn thì dùng read replica.</li><li>Đừng đặt reserved concurrency bằng đúng max_connections; luôn chừa chỗ cho vận hành.</li><li>Nếu lưu lượng phẳng 24/7, container dài hạn giữ một pool dùng chung điều khiển được số kết nối bằng tham số pool, đổi lại bạn phải tự vá hệ điều hành.</li></ul>",
  "observe": "<p><strong>Đọc gì trên production để biết đang nghẽn ở khớp nào.</strong></p><ul><li><strong>CloudWatch:</strong> số lần gọi chạy đồng thời của hàm, số kết nối đang dùng của RDS đặt cạnh max_connections, và p99 theo endpoint. Ba đường này lệch nhau là dấu hiệu trần nằm ở cuối chuỗi.</li><li><strong>Log của API Gateway:</strong> đếm 429 và 504 riêng. 429 là bị chặn ngay ở cổng, 504 là đã vào trong và chờ quá lâu.</li><li><strong>Log ứng dụng:</strong> lỗi không lấy được kết nối, thời gian chờ kết nối, và lỗi kết nối dồn dập ngay sau một sự kiện failover.</li><li><strong>RDS event log:</strong> sự kiện failover kèm lý do và thời điểm, để tách sự cố hạ tầng khỏi sự cố do chính bạn đổi cấu hình.</li><li><strong>CloudTrail:</strong> ai đã đổi trần concurrency hay cấu hình proxy, lúc nào.</li></ul>",
  "attacks": [
    {
      "q": "Vì sao mỗi environment Lambda có thể giữ một kết nối riêng, trong khi trên một máy chủ thì nhiều request dùng chung một pool?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Environment là một tiến trình được tái dùng, không phải một request. Kết nối mở ngoài handler thuộc về tiến trình đó, nên nó sống qua các lần gọi và không chia sẻ socket với environment khác. Trên một máy chủ, một tiến trình phục vụ nhiều request nên chỉ cần một pool chung, và tham số pool mới là trần. Vì vậy trên Lambda, trần kết nối do lưu lượng quyết định, không do code quyết định.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói Lambda có connection pool mà không nói pool đó thuộc về một environment. Cách nói đúng: mỗi environment giữ tối đa một kết nối, nên số kết nối bằng số environment còn ấm.</p>"
    },
    {
      "q": "Cho tôi một cách đặt trần để việc tăng Lambda không đè bẹp RDS.",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Tôi đặt trần ở phía gọi, không ở phía cơ sở dữ liệu. Cách một là reserved concurrency thấp hơn số kết nối còn chỗ, để Lambda throttle trước khi RDS phải từ chối. Cách hai là RDS Proxy giữ một bể kết nối thật và xếp hàng phần vượt. Cả hai đều cần một dữ kiện: max_connections thật và số kết nối các thành phần khác đang chiếm. Khi lưu lượng vượt trần, tôi muốn thấy throttle ở Lambda chứ không phải lỗi kết nối ở RDS.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> đặt reserved concurrency bằng đúng max_connections. Cách nói đúng: luôn trừ phần dành cho vận hành, migration và các client khác.</p>"
    },
    {
      "q": "Nếu AZ chứa primary mất điện đúng lúc 380 environment đang giữ kết nối thì client thấy gì?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Multi-AZ chuyển sang standby, RDS đổi bản ghi DNS sang instance mới, và mọi kết nối đang mở đều chết. Failover thường mất 60–120 giây. Trong khoảng đó client nhận lỗi kết nối; sau đó client phải phân giải lại tên miền, nên tiến trình cache DNS lâu sẽ còn gọi địa chỉ cũ. Nếu không có proxy, hàng trăm environment cùng mở lại kết nối và có thể đụng trần lần nữa. Nếu có proxy, kết nối từ ứng dụng tới proxy có thể được giữ và proxy nối lại tới standby.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói RDS Proxy lo failover. Cách nói đúng: Multi-AZ mới là thứ có standby để chuyển; proxy chỉ giữ kết nối phía ứng dụng.</p>"
    },
    {
      "q": "Đặt RDS Proxy rồi thì còn trường hợp nào vẫn nghẽn?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Còn, vì proxy chỉ giải bài toán số kết nối. Nó không thêm CPU, IO hay năng lực truy vấn cho instance. Nếu nút thắt là truy vấn thiếu index thì proxy chỉ làm hàng đợi dài hơn và p99 vẫn cao. Proxy cũng từ chối kết nối của ứng dụng khi vượt hạn mức, nên code vẫn phải xử lý lỗi đó. Với PostgreSQL, câu lệnh lớn hơn 16 KB làm proxy ghim session vào một kết nối, nên khả năng chia sẻ giảm.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> coi proxy là vạn năng. Cách nói đúng: sau khi đặt proxy, nếu số kết nối phẳng mà CPU hoặc độ trễ đọc vẫn cao thì nút thắt đã chuyển chỗ.</p>"
    }
  ],
  "anchor": "Lambda co giãn theo số request đồng thời, RDS co giãn theo cấu hình instance, nên thêm Lambda khi trần kết nối đã chạm chỉ làm hàng đợi dài hơn.",
  "say30": "Tôi đọc kiến trúc serverless bằng cách đi theo một request: trình duyệt vào API Gateway, gateway gọi Lambda, Lambda ghi RDS, việc nặng đẩy sang SQS cho worker. Chỗ dễ sai là giả định mọi tầng cùng co giãn. Lambda tạo thêm environment theo request đồng thời và mỗi environment có thể giữ một kết nối riêng, còn RDS có trần kết nối cố định. Vì vậy tăng Lambda khi trần đó đã chạm chỉ làm hàng đợi dài thêm và p99 tăng.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: endpoint nhận 200 request mỗi giây, p99 từ 180 ms lên 4,2 giây. Không dịch vụ nào tự báo quá tải: hàm vẫn trả 200, CPU của RDS khoảng 35 phần trăm. Thứ duy nhất đổi là số lần gọi đồng thời, từ 12 lên 380, nên câu hỏi đúng là khớp nào đang xếp hàng.\n\n[Cơ chế (45s)]: Lambda cấp một environment cho mỗi request đồng thời, nên concurrency bằng số request mỗi giây nhân thời gian một lần gọi. Environment được tái dùng, và kết nối mở ngoài handler sống tiếp, nghĩa là mỗi environment còn ấm giữ một kết nối riêng tới RDS. RDS PostgreSQL chỉ phục vụ tới max_connections, trong kịch bản này là 40. Vượt trần thì kết nối mới bị từ chối hoặc phải chờ; chờ làm mỗi lần gọi lâu hơn, lâu hơn lại cần thêm environment, thành vòng lặp tự đẩy mình lên.\n\n[Ranh giới (15s)]: Multi-AZ là RDS đổi bản ghi DNS sang standby ở AZ khác, kết nối đang mở phải mở lại và standby không phục vụ đọc. RDS Proxy là tùy chọn gom kết nối, không phải cơ chế failover, và không thêm năng lực cho instance.",
  "body": "<p><strong>Chuyển sang một hệ thống khác cùng hình dạng.</strong> Giả sử bạn làm endpoint nhận ảnh chứng từ. Mỗi ảnh phải được tạo thumbnail, ghi metadata và gửi mail xác nhận.</p><p>Trước khi chọn dịch vụ, hỏi ba câu. Tầng nào không giữ trạng thái giữa hai request nên để nó tự co giãn? Tầng nào có trần cố định nên phải đặt trần từ phía gọi tới? Việc nào không cần xong trước khi trả lời người dùng nên đẩy ra sau?</p><p>Trả lời theo ba câu đó thường ra một thiết kế khác thói quen. Ảnh đi thẳng lên S3 bằng URL có chữ ký thay vì chui qua hàm. Metadata ghi vào nơi không có trần kết nối. Thumbnail và mail vào hàng đợi cho worker.</p><p><strong>Cách đọc một sự cố p99.</strong> Đầu tiên so ba đường trên cùng một trục thời gian: số lần gọi đồng thời, số kết nối đang dùng so với trần, và p99 theo endpoint. Ba đường lệch nhau là dấu hiệu trần nằm ở cuối chuỗi.</p><p>Sau đó tách 429 khỏi 504 trong log của cổng vào. 429 là bị chặn ngay ở cổng. 504 là đã vào trong và chờ quá lâu. Hai mã này chỉ hai chỗ khác nhau, và cách sửa cũng khác nhau.</p><p>Cuối cùng đọc log ứng dụng để tìm lỗi không lấy được kết nối và thời gian chờ kết nối. Nếu có, đừng nâng trần concurrency; hãy đặt trần thấp hơn.</p>",
  "code": "import os\n\nimport psycopg\n\nDSN = os.environ[\"DATABASE_URL\"]\n\n# Một kết nối cho mỗi environment: mở ở lần gọi đầu, dùng lại cho các lần sau.\n_conn = None\n\n\ndef get_conn():\n    global _conn\n    if _conn is None or _conn.closed:\n        _conn = psycopg.connect(DSN, connect_timeout=3)\n    return _conn\n\n\ndef handler(event, context):\n    conn = get_conn()\n    with conn.cursor() as cur:\n        cur.execute(\n            \"INSERT INTO uploads (id, tenant_id) VALUES (%s, %s)\",\n            (event[\"id\"], event[\"tenant_id\"]),\n        )\n    conn.commit()\n    return {\"statusCode\": 201}",
  "codeNote": "<p><strong>Cách tệ:</strong> nâng trần concurrency mà không đọc số kết nối của RDS — thêm client vào cùng một hàng đợi. <strong>Cách tốt:</strong> đọc max_connections trước, rồi đặt reserved concurrency thấp hơn số chỗ còn lại để Lambda từ chối trước khi RDS phải từ chối.</p><p><code>_conn = psycopg.connect(...)</code> nằm ngoài handler nên kết nối thuộc về environment, không thuộc về request. <code>conn.commit()</code> làm thay đổi bền vững; bỏ dòng đó thì transaction bị huỷ khi kết nối đóng.</p>",
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
  "incident": "<p><strong>Không có thứ này thì đau ở đâu?</strong> Kịch bản giả định. Endpoint POST /files chạy sau API Gateway có JWT authorizer (bộ kiểm token ở cửa vào); người dùng đã đăng nhập và token còn hạn. Hàm Lambda gọi S3 PutObject để ghi một file nhỏ.</p><p>Ba ngày trước mọi thứ bình thường. Sáng nay 100 phần trăm request nhận 500. Log của hàm có đúng một dòng: AccessDenied khi gọi s3:PutObject, và principal (bên đứng tên trong lỗi) là assumed-role/upload-api-role, không phải người dùng nào.</p><p>Cùng lúc, một script nội bộ gọi thẳng hàm bằng SDK nhận 403 ngay ở bước invoke, trước khi hàm kịp chạy. Một endpoint khác chỉ đọc cơ sở dữ liệu vẫn chạy bình thường.</p><p><strong>Câu hỏi dự đoán:</strong> người dùng đã đăng nhập, vậy vì sao hàm vẫn không ghi được S3? <strong>Đáp án:</strong> request ghi S3 không do người dùng ký. Nó do hàm ký, bằng credential tạm của execution role (vai trò cấp quyền tạm cho hàm).</p>",
  "askFirst": [
    "Hai lỗi 403 trong sự cố xảy ra ở hai thời điểm nào của chuỗi, và mỗi lỗi do chính sách nào quyết định?",
    "Vì sao người dùng đã đăng nhập và token còn hạn vẫn không đủ để hàm ghi được lên S3?",
    "Dòng AccessDenied cần chứa những thông tin nào để bạn biết phải sửa chính sách ở đâu?"
  ],
  "predict": {
    "q": "Kịch bản giả định: execution role của hàm hiện chỉ có <code>s3:PutObject</code> trên <code>arn:aws:s3:::uploads-staging/*</code>. Bạn thêm một nhánh ghi vào bucket <code>uploads-prod</code> bằng đúng client boto3 đó. Hỏi: (a) lần ghi vào prod trả gì và principal trong lỗi là ai, (b) nếu thay vì sửa resource bạn cấp <code>s3:*</code> trên <code>*</code> thì được gì và mất gì, (c) nếu bạn cấp thêm quyền S3 cho người dùng đang gọi API thì có hết lỗi không, (d) nếu hàm này được một hàm khác gọi thì phải sửa chính sách nào?",
    "a": "<p><strong>Kết luận: (a) AccessDenied với principal là assumed-role, (b) hết lỗi nhưng mất khả năng phân biệt hành động, (c) không hết, vì người dùng không phải bên ký request tới S3, (d) phải sửa lớp invoke, không phải execution role.</strong></p><ul><li><strong>(a)</strong> Request do S3 từ chối; dòng lỗi ghi principal là role mà Lambda đang đảm nhận, action <code>s3:PutObject</code>, resource là ARN của bucket prod. Người dùng không xuất hiện trong dòng đó vì họ không ký request này.</li><li><strong>(b)</strong> Được: lỗi biến mất ngay. Mất: role ghi và xoá được mọi bucket của tài khoản, nên một lỗi trong code có thể xoá dữ liệu thật, và log mất khả năng cho biết hành động nào là hành động dự kiến.</li><li><strong>(c)</strong> Không. Quyền của người dùng chỉ ảnh hưởng bước gọi API và bước invoke; khi hàm chạy, mọi lời gọi AWS được ký bằng credential tạm của role. Thêm quyền S3 cho người dùng không đổi được credential mà boto3 đang dùng.</li><li><strong>(d)</strong> Lớp invoke: hàm gọi phải được phép gọi hàm đích, tức resource-based policy trên hàm đích hoặc một quyền tương ứng trên role của hàm gọi. Sửa execution role của hàm đích không làm lời gọi invoke đi qua được.</li></ul>"
  },
  "naive": "<p><strong>Cách tệ (làm theo phản xạ):</strong> thấy 403 thì gắn cho role bộ quyền rộng nhất để lỗi biến mất, rồi đi tiếp.</p><p>Cách này nghe hợp lý vì lỗi biến mất trong vài giây, dashboard xanh trở lại, và không ai phải đọc dòng AccessDenied.</p><p>Cái giá chỉ hiện ra sau: role đó đã có quyền xoá bucket và đọc secret của hệ thống khác, còn tín hiệu duy nhất từng báo code gọi ra ngoài phạm vi thì không còn nữa.</p>",
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
  "rootCause": "<p><strong>Chuỗi nhân quả, mỗi dòng một ý.</strong></p><ul><li>Bucket được đổi tên, nhưng execution role vẫn chỉ cho phép ARN cũ.</li><li>Request qua API Gateway vẫn thành công, vì lớp xác thực chỉ kiểm người dùng.</li><li>Lambda chạy bình thường, rồi boto3 ký lời gọi bằng credential tạm của role.</li><li>S3 từ chối vì identity policy không cho phép ARN mới.</li><li>Lỗi hiện trong log của hàm, còn người dùng chỉ thấy 500 — hai tầng nên hai thông báo.</li><li>Lỗi thứ hai nằm ở lớp invoke, xảy ra trước khi hàm chạy nên không có log của hàm.</li></ul>",
  "concept": "<p>Hai chính sách trả lời hai câu khác nhau: resource policy trả lời ai được gọi hàm, execution role trả lời hàm được gọi cái gì, và chúng không thay thế nhau.</p>",
  "mechanism": "<p><strong>Ví von đời thường:</strong> một toà nhà có hai lớp cửa. Cửa ngoài có bảo vệ: ai được vào toà nhà? Cửa trong là tủ hồ sơ có khoá: vào rồi thì mở được tủ nào? Bảo vệ cho bạn vào không có nghĩa là chìa khoá tủ tự xuất hiện trong tay bạn.</p><p><em>Giới hạn của phép ví von:</em> ngoài đời một người có thể mượn chìa của người khác; ở đây mỗi hàm luôn hành động dưới đúng một role.</p><pre><code>Người dùng ──JWT──► API Gateway ──invoke──► Lambda ──boto3──► S3\n                         │                     │                │\n                   (1) ai được gọi hàm?   (2) hàm được làm gì? (3) tài nguyên\n                   resource policy         execution role      có cho phép không?\n                         │                     │                │\n                    chặn TRƯỚC khi        chỉ có hiệu lực     từ chối thì trả\n                    hàm chạy → 403,        SAU khi hàm chạy    AccessDenied trong\n                    không có log hàm                           log của hàm</code></pre><ol><li><strong>Bước 1 — Mọi lời gọi AWS phải được ký bởi một danh tính:</strong> không có danh tính thì AWS không biết cho ai. Danh tính có thể là người dùng, một role, hoặc một dịch vụ.</li><li><strong>Bước 2 — Lớp thứ nhất hỏi ai được gọi hàm này:</strong> đó là resource policy gắn trên chính hàm, chạy trước khi có tiến trình nào. Bị chặn ở đây thì không có log của hàm, và sửa quyền bên trong hàm không có tác dụng.</li><li><strong>Bước 3 — Lớp thứ hai hỏi hàm được chạm vào cái gì:</strong> khi hàm chạy, Lambda đảm nhận execution role và phát credential tạm. Mọi SDK trong code ký request bằng credential đó, nên principal trong lỗi luôn là role.</li><li><strong>Bước 4 — Dịch vụ đích kiểm hai thứ, action và resource, nên quyền phải hẹp:</strong> s3:PutObject trên đúng ARN của bucket là một cặp; thiếu một nửa thì trả AccessDenied. Quyền hẹp biến lần gọi sai thành một dòng lỗi rõ ràng thay vì một hành vi âm thầm thành công.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"Qua JWT và API Gateway là có quyền ghi S3.\"</strong> Nghe hợp lý vì request đã qua xác thực và tới được code. Điều đúng: hai hành động khác nhau được kiểm ở hai chỗ khác nhau — một bên là ai được invoke, một bên là hàm được gọi cái gì. Phản chứng: dòng AccessDenied ghi principal là <code>assumed-role/upload-api-role</code>, không có tên người dùng nào trong đó.</li><li><strong>\"403 thì sửa execution role.\"</strong> Nghe hợp lý vì phần lớn lỗi quyền gặp phải đúng là do role thiếu quyền. Điều đúng: nếu 403 trả về trước khi hàm chạy và không có log của hàm thì lỗi nằm ở lớp invoke, sửa role không tác dụng. Phản chứng: cùng một thời điểm, endpoint qua API Gateway chạy được còn lời gọi trực tiếp bị chặn ngay.</li><li><strong>\"Cấp quyền rộng cho nhanh, sau này thu hẹp.\"</strong> Nghe hợp lý vì thời gian deploy ngắn và lỗi biến mất. Điều đúng: quyền rộng làm mất chính tín hiệu dùng để phát hiện code gọi sai chỗ, và không ai quay lại thu hẹp. Phản chứng: sau khi gắn quyền rộng, log không còn dòng AccessDenied nào, kể cả khi code gọi nhầm sang bucket của hệ thống khác.</li></ul>",
  "tradeoff": "<p><strong>Được gì:</strong> một role cho mỗi hàm cho phạm vi thiệt hại nhỏ và log đọc được ngay. Quyền theo ARN cụ thể buộc bạn nhìn lại phạm vi mỗi lần thêm tài nguyên.</p><p><strong>Mất gì:</strong> mỗi hàm mới là một bộ quyền mới phải viết và rà. Đổi tên bucket là phải sửa chính sách cùng lúc với code. Secret trong kho secret thì xoay được nhưng thêm một lời gọi mạng và một quyền nữa phải cấp.</p><p><strong>Rủi ro:</strong> một role dùng chung cho cả hệ thống làm mọi lỗi mang cùng một principal, nên log không còn cho biết hàm nào gọi cái gì.</p><p><strong>Vì sao vẫn đáng:</strong> khi sự cố xảy ra lúc 2 giờ sáng, dòng AccessDenied với đúng ba trường là thứ duy nhất giúp bạn sửa trong một phút thay vì một giờ.</p>",
  "alternatives": "<p><strong>Khi nào KHÔNG nên dùng.</strong></p><ul><li>Đừng tách role theo từng hàm khi hệ thống còn đang thử nghiệm và chưa rõ hình dạng; lúc đó một role cho môi trường dev là chấp nhận được.</li><li>Đừng dùng quyền theo ARN cụ thể nếu code dựng đường dẫn động mà bạn không liệt kê được tập tiền tố; khi đó phủ đúng tập đó, đừng phủ dấu sao.</li><li>Đừng cấp quyền ghi S3 cho role của hàm nếu client có thể tải thẳng bằng URL ký sẵn; role chỉ cần quyền ký.</li><li>Đừng dựa vào IAM để lọc dữ liệu theo người dùng; việc đó vẫn là một điều kiện trong câu truy vấn.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết quyền bị từ chối ở lớp nào.</strong></p><ul><li><strong>Log của hàm:</strong> dòng AccessDenied kèm principal, action, resource — ba trường này chỉ ra chính sách nào cần sửa.</li><li><strong>CloudTrail:</strong> sự kiện gọi API bị từ chối, kèm danh tính đã dùng; đây là nơi duy nhất thấy được lời gọi bị chặn trước khi hàm chạy.</li><li><strong>Log API Gateway:</strong> mã 403 so với 500 để tách lỗi ở cổng khỏi lỗi bên trong hàm.</li><li><strong>Công cụ phân tích quyền của IAM:</strong> liệt kê quyền thực tế một role đang có, để phát hiện quyền rộng còn sót sau khi sửa.</li></ul>",
  "attacks": [
    {
      "q": "Hai lớp quyền này kiểm tra hai hành động nào, và vì sao chúng không thay thế nhau?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Lớp invoke trả lời ai được gọi hàm, bằng resource policy gắn trên chính hàm. Lớp execution role trả lời hàm được gọi cái gì, sau khi hàm đã chạy. Một lớp cho qua không hàm ý lớp kia cho qua, vì chúng chạy ở hai thời điểm. Cách phân biệt nhanh: lỗi ở lớp invoke không kèm log của hàm; lỗi ở lớp role có AccessDenied trong log của hàm.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói đã qua API Gateway thì có quyền. Cách nói đúng: qua cửa xác thực chỉ chứng minh người dùng là ai.</p>"
    },
    {
      "q": "Cho tôi cách viết một execution role tối thiểu cho một thao tác ghi S3.",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Một action cụ thể trên một ARN cụ thể. Tôi chọn s3:PutObject thay vì s3:*, và ARN dạng ten-bucket với đuôi gạch chéo sao thay vì dấu sao cho mọi bucket. Nếu hàm cần ghi log thì thêm đúng quyền ghi log. Điều kiện là tôi phải biết chính xác bucket và tiền tố mà code dùng. Cách kiểm: gọi thử s3:DeleteObject phải nhận AccessDenied với đúng action đó.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> quên rằng quyền trên ARN của bucket không cho ghi object. Cách nói đúng: object cần ARN có đuôi gạch chéo sao.</p>"
    },
    {
      "q": "Nếu người dùng đổi từ JWT sang đăng nhập bằng một nhà cung cấp khác thì phần quyền nào phải sửa?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Chỉ lớp xác thực ở cổng vào phải sửa. Execution role và các chính sách tài nguyên giữ nguyên, vì role gắn với hàm chứ không gắn với người dùng. Đổi cách chứng minh danh tính không đổi quyền của hàm. Ngoại lệ: nếu code đang đọc một trường riêng của token cũ để quyết định quyền ở tầng ứng dụng thì phải ánh xạ lại trường đó. Cách kiểm: request qua cổng vào thành công, hàm vẫn ghi đúng bucket, log không có AccessDenied mới.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói phải cấp lại quyền S3 cho nhà cung cấp danh tính mới. Cách nói đúng: nhà cung cấp danh tính không giữ quyền AWS của hàm.</p>"
    },
    {
      "q": "Có trường hợp nào role đúng mà vẫn không ghi được S3?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Có. Với bucket thuộc tài khoản khác, bucket policy cũng phải cho phép, nên role đúng vẫn nhận AccessDenied. Nếu bucket bật chặn truy cập công khai hoặc bắt buộc TLS, request không đúng điều kiện cũng bị chặn dù có quyền. Nếu code dựng ARN sai vùng hoặc sai tên thì quyền đúng vẫn không khớp tài nguyên. Cách kết luận: đối chiếu principal, action, resource trong lỗi với chính sách trước khi sửa bất cứ dòng nào.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> sửa role ngay khi thấy 403. Cách nói đúng: kiểm tra resource trong lỗi trước — khác ARN trong chính sách thì sửa ARN.</p>"
    }
  ],
  "anchor": "Qua cửa xác thực chỉ chứng minh người dùng là ai; quyền ghi S3 do execution role quyết định, và role đó chỉ nên mở đúng một action trên đúng một ARN.",
  "say30": "Tôi tách quyền IAM thành hai lớp. Lớp thứ nhất là resource policy trên hàm: ai được gọi hàm này, kiểm tra trước khi code chạy. Lớp thứ hai là execution role: khi hàm đã chạy, boto3 ký mọi lời gọi bằng credential tạm của role đó. Vì vậy đăng nhập thành công và qua API Gateway không có nghĩa là hàm ghi được S3. Khi gặp 403, tôi đọc principal, action và resource trong dòng AccessDenied trước khi sửa bất cứ chính sách nào.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: endpoint sau API Gateway có JWT authorizer, người dùng đã đăng nhập, vậy mà 100 phần trăm request nhận 500 vì hàm không ghi được S3. Cùng lúc một script gọi thẳng hàm nhận 403 trước khi hàm chạy. Hai lỗi cùng là 403, nhưng một cái xảy ra trước khi có tiến trình nào và một cái xảy ra sau khi code đã chạy.\n\n[Cơ chế (45s)]: Lớp invoke kiểm tra ai được gọi hàm, bằng chính sách gắn trên chính hàm; authorizer chỉ chứng minh danh tính người dùng, không cấp quyền cho hàm. Khi hàm chạy, Lambda đảm nhận execution role và cấp credential tạm, nên mọi lời gọi boto3 được ký bằng credential đó và principal trong lỗi luôn là role. Dịch vụ đích đánh giá đúng action trên đúng ARN; thiếu một trong hai thì trả AccessDenied kèm ba trường principal, action, resource.\n\n[Ranh giới (15s)]: Quyền hẹp là thứ giữ tín hiệu phát hiện code gọi sai chỗ, nên tôi không gắn quyền rộng để hết lỗi. Và IAM không biết bản ghi nào thuộc người dùng nào; việc lọc theo chủ sở hữu vẫn phải nằm trong câu lệnh.",
  "body": "<p><strong>Chuyển sang tình huống khác cùng hình dạng.</strong> Giả sử bạn làm endpoint xuất báo cáo: hàm đọc một bảng, ghi file CSV lên S3, rồi đẩy một message vào hàng đợi.</p><p>Ba tài nguyên, ba quyền khác nhau, và cả ba đều nằm sau một execution role. Trước khi viết code, bạn liệt kê đúng ba action cần dùng và ba ARN tương ứng. Đó là toàn bộ chính sách.</p><p>Nếu một ngày ai đó thêm bước gửi mail, chính sách phải đổi cùng lúc với code. Chính việc phải sửa đó là dấu hiệu tốt: nó buộc bạn nhìn lại phạm vi.</p><p><strong>Cách đọc một lỗi quyền trong ba mươi giây.</strong> Đầu tiên xác định lỗi có kèm log của hàm hay không, để biết nó ở lớp invoke hay lớp role.</p><p>Sau đó đọc principal: nếu là assumed-role thì thủ phạm là role, không phải người dùng. Cuối cùng so action và resource trong lỗi với nội dung chính sách.</p><p>Nếu resource trong lỗi khác ARN trong chính sách thì sửa ARN, đừng sửa action. Nếu action trong lỗi không có trong chính sách thì thêm đúng action đó, đừng thêm cả họ.</p>",
  "code": "import json\nimport os\n\nimport boto3\n\nBUCKET = os.environ[\"UPLOAD_BUCKET\"]\n\n# Client tạo ngoài handler: credential tạm của execution role được tái dùng.\n_s3 = boto3.client(\"s3\")\n\n\ndef handler(event, context):\n    key = event[\"key\"]\n    _s3.put_object(\n        Bucket=BUCKET,\n        Key=key,\n        Body=b\"hello\",\n        ContentType=\"text/plain\",\n    )\n    return {\"statusCode\": 201, \"body\": json.dumps({\"key\": key})}",
  "codeNote": "<p><strong>Cách tệ:</strong> gắn AdministratorAccess để hết 403 — lỗi biến mất, phạm vi thiệt hại mở rộng, và mất luôn tín hiệu AccessDenied. <strong>Cách tốt:</strong> đọc principal, action, resource trong dòng lỗi rồi thêm đúng ARN còn thiếu, giữ nguyên phạm vi cũ.</p><p>Trong đoạn code trên, boto3 không tự biết bạn là ai: nó dùng credential mà Lambda đã phát cho tiến trình. Vì vậy mọi thay đổi quyền phải làm ở execution role, không phải ở chỗ gọi API.</p>",
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
  "incident": "<p><strong>Không có thứ này thì đau ở đâu?</strong> Kịch bản giả định. Một hàm xử lý ảnh tạo ba kích thước và gửi một email xác nhận. Với ảnh 4 MB, một lần chạy mất khoảng 5 giây, nhưng timeout (giới hạn thời gian chạy) đặt 3 giây.</p><p>Email được gửi ở giây thứ hai. Hàm bị dừng ở giây thứ ba. Hàm được gọi bất đồng bộ từ sự kiện upload của S3, nên Lambda tự thử lại hai lần nữa.</p><p>Kết quả: khách nhận ba email cho một tấm ảnh, và không kích thước nào được tạo xong. Không lỗi nào hiện trên dashboard, vì mỗi lần chạy đều chạy đúng 3 giây rồi bị dừng.</p><p><strong>Câu hỏi dự đoán:</strong> cùng lỗi timeout đó, nếu hàm được gọi đồng bộ qua API Gateway thì ai thử lại? <strong>Đáp án:</strong> không ai tự động; API Gateway trả lỗi về cho client và client quyết định.</p>",
  "askFirst": [
    "Vì sao cùng một sự kiện lại sinh ra ba lần chạy, trong khi phía gửi chỉ gửi một lần?",
    "Trong ba kiểu gọi đồng bộ, bất đồng bộ và qua event source mapping, ai là bên quyết định có thử lại hay không?",
    "Nếu lần chạy đã gửi email trước khi bị dừng, code cần thay đổi gì để lần thử lại không gửi thêm lần nữa?"
  ],
  "predict": {
    "q": "Kịch bản giả định: hàm có timeout 3 giây, mỗi lần chạy thật mất 5 giây, và email được gửi ở giây thứ hai. Hỏi: (a) với một lần gọi bất đồng bộ, hàm được thử bao nhiêu lần, (b) khách nhận bao nhiêu email cho một ảnh, (c) nếu đổi sang gọi đồng bộ qua API Gateway thì ai thử lại và client thấy gì, (d) nếu đổi sang event source mapping đọc từ SQS thì điều gì quyết định số lần thử?",
    "a": "<p><strong>Kết luận: (a) ba lần, (b) ba email, (c) không ai thử lại tự động, client nhận lỗi, (d) visibility timeout và redrive policy của hàng đợi quyết định.</strong></p><ul><li><strong>(a)</strong> Gọi bất đồng bộ thì Lambda thử lại hai lần sau lần đầu, tổng ba lần thử; hết số lần thì sự kiện bị bỏ hoặc vào dead-letter queue nếu đã cấu hình.</li><li><strong>(b)</strong> Email gửi ở giây thứ hai, tức trước khi timeout ở giây thứ ba, nên mỗi lần thử đều gửi được một email: ba email cho một ảnh. Nếu email gửi ở giây thứ tư thì không lần nào gửi được và khách nhận không email nào — cùng một lỗi, hai kết quả trái ngược, tuỳ vị trí lời gọi trong thân hàm.</li><li><strong>(c)</strong> Với gọi đồng bộ, Lambda không tự thử lại; API Gateway chuyển lỗi về cho client, và client hoặc người dùng quyết định có gửi lại hay không. Vì vậy thử bằng API Gateway chỉ thấy một lỗi, không thấy ba lần chạy.</li><li><strong>(d)</strong> Với event source mapping đọc từ hàng đợi, thời gian message bị ẩn do visibility timeout quyết định khoảng cách giữa hai lần thử, còn redrive policy với số lần nhận tối đa quyết định khi nào message sang dead-letter queue. Với nguồn stream thì Lambda thử lại cả batch và chặn shard cho tới khi hết lỗi hoặc dữ liệu hết hạn lưu trữ.</li></ul>"
  },
  "naive": "<p><strong>Cách tệ (làm theo phản xạ):</strong> viết handler theo thứ tự tự nhiên — gửi email trước, làm việc nặng sau — và tin rằng mỗi sự kiện chỉ chạy một lần.</p><p>Cách này nghe hợp lý vì code đọc rất xuôi: xác nhận cho khách trước, rồi mới xử lý ảnh. Ai cũng viết như vậy khi nghĩ theo luồng nghiệp vụ.</p><p>Nhưng tác dụng phụ nằm trước phần dễ bị dừng, và không có gì chặn lần chạy thứ hai. Retry không biết bạn đã gửi mail; nó chỉ biết lần trước thất bại.</p>",
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
  "rootCause": "<p><strong>Chuỗi nhân quả, mỗi dòng một ý.</strong></p><ul><li>Việc thật cần 5 giây nhưng timeout chỉ 3 giây, nên lần chạy nào cũng bị dừng.</li><li>Email nằm ở giây thứ hai, tức trước điểm dừng, nên lần nào cũng gửi được một cái.</li><li>Gọi bất đồng bộ thì Lambda thử lại hai lần nữa, nên tổng ba lần chạy.</li><li>Handler chạy lại từ đầu mỗi lần, nên tác dụng phụ xảy ra ba lần.</li><li>Không có khoá chống lặp, nên không lần chạy nào biết lần trước đã làm gì.</li><li>Dashboard không đổi màu vì mỗi lần chạy đều kết thúc đúng theo cấu hình.</li></ul>",
  "concept": "<p>Init chạy một lần cho mỗi environment, handler chạy mỗi lần gọi, và ai thử lại phụ thuộc kiểu gọi: đồng bộ thì bên gọi, bất đồng bộ thì Lambda thử thêm hai lần, event source thì hàng đợi quyết định.</p>",
  "mechanism": "<p><strong>Ví von đời thường:</strong> một quán cà phê có máy pha. Sáng mở cửa, nhân viên bật máy và làm nóng một lần cho cả ngày. Mỗi ly khách gọi là một lần bấm nút. Ly bị đổ thì pha ly mới, máy không khởi động lại.</p><p><em>Giới hạn của phép ví von:</em> quán mở cả ngày, còn environment Lambda có thể bị thu hồi sau vài phút rảnh và lần sau phải bật máy lại.</p><pre><code>Environment LẠNH (cold start)          Environment ẤM (warm)\n┌──────────────────────────────┐       ┌──────────────────────────┐\n│ INIT: nạp code, mở kết nối   │       │ (bỏ qua Init)            │\n├──────────────────────────────┤       ├──────────────────────────┤\n│ INVOKE: chạy handler         │       │ INVOKE: chạy handler     │\n└──────────────────────────────┘       └──────────────────────────┘\n\nMột sự kiện lỗi, gọi bất đồng bộ:\n  lần 1 ─timeout 3s─► chờ ~1 phút ─► lần 2 ─timeout─► chờ ~2 phút ─► lần 3\n    ▲ email ở giây 2      ▲ email lần 2        ▲ email lần 3\n    └──────── 3 email, 0 kích thước ảnh nào xong ────────┘</code></pre><ol><li><strong>Bước 1 — Có hai pha, không phải một:</strong> Init chạy code ngoài handler như nạp thư viện và mở kết nối. Invoke chạy thân handler cho đúng một sự kiện.</li><li><strong>Bước 2 — Init chạy một lần cho mỗi environment, không phải mỗi request:</strong> environment được tái dùng, nên lần gọi thứ hai bỏ qua Init. Lần gọi đầu trên environment mới là cold start (lần khởi động đầu tiên phải tạo mới môi trường).</li><li><strong>Bước 3 — Timeout dừng tiến trình, không hoàn tác:</strong> những gì đã ghi ra ngoài như email hay dòng trong database vẫn còn. Không có rollback.</li><li><strong>Bước 4 — Ai thử lại là do kiểu gọi quyết định, nên khoá chống lặp phải nằm trong code:</strong> gọi bất đồng bộ thì Lambda thử lại hai lần; gọi đồng bộ thì không ai thử lại. Vì vậy idempotency (tính chất xử lý một lần hay nhiều lần vẫn ra đúng một kết quả) là việc của nghiệp vụ, và khoá phải được ghi trước tác dụng phụ.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"Environment warm vẫn chạy lại Init.\"</strong> Nghe hợp lý vì mỗi lần gọi đều thấy log dòng đầu tiên của module. Điều đúng: Init chạy một lần cho mỗi environment, còn dòng log của handler mới chạy mỗi lần gọi. Phản chứng: đặt một biến đếm ở cấp module, in ra trong handler, và thấy giá trị tăng dần qua các lần gọi liên tiếp trên cùng environment thay vì reset về một.</li><li><strong>\"Lambda luôn tự thử lại khi lỗi.\"</strong> Nghe hợp lý vì đa số sự cố gặp phải đều qua đường bất đồng bộ, nơi quả thật có thử lại. Điều đúng: gọi đồng bộ không có retry tự động, bên gọi quyết định. Phản chứng: gọi hàm qua API Gateway khi hàm lỗi, thấy đúng một lần chạy trong log dù client có gửi lại hay không.</li><li><strong>\"Có retry thì không cần idempotent.\"</strong> Nghe hợp lý vì retry được thiết kế để làm request thành công. Điều đúng: retry làm request thành công về mặt kỹ thuật, nhưng tác dụng phụ đã xảy ra ở lần trước vẫn còn. Phản chứng: bảng thống kê đếm số ảnh đã xử lý cao gấp ba lần số ảnh thật, trong khi mỗi lần chạy đều trả về lỗi timeout.</li></ul>",
  "tradeoff": "<p><strong>Được gì:</strong> tách Init ra ngoài handler cho bạn tái dùng kết nối và giảm thời gian mỗi lần gọi. Idempotency cho bạn chịu được retry mà không nhân đôi tác dụng phụ.</p><p><strong>Mất gì:</strong> mỗi cold start là một lần trả giá về độ trễ, và bạn không điều khiển được lúc environment bị thu hồi. Khoá idempotency cần một nơi lưu bền và một thao tác ghi nguyên tử, tức thêm một lời gọi mạng cho mỗi sự kiện.</p><p><strong>Rủi ro:</strong> đặt timeout dài để tránh retry thì tốn tiền và giữ environment lâu hơn; đặt quá ngắn thì mọi sự kiện đều thất bại và nhân tác dụng phụ.</p><p><strong>Vì sao vẫn đáng:</strong> số lần chạy là thông tin của nền tảng, còn số lần tác dụng phụ là thông tin của bạn. Chỉ có khoá trong code mới biến vế thứ hai thành con số bạn kiểm soát.</p>",
  "alternatives": "<p><strong>Khi nào KHÔNG nên dùng.</strong></p><ul><li>Đừng thêm khoá idempotency cho hàm chỉ đọc dữ liệu và trả về; chạy lại không đổi gì thì không cần khoá.</li><li>Đừng thử lại lỗi do dữ liệu đầu vào sai: ba lần chạy sẽ hỏng giống hệt nhau, chỉ nhân ba tác dụng phụ.</li><li>Đừng dùng khoá theo nội dung nếu nội dung có thể đổi giữa hai lần gửi hợp lệ khác nhau; hãy dùng mã message do nguồn sinh.</li><li>Đừng kéo dài timeout để che một việc quá nặng; hãy đẩy việc đó ra hàng đợi cho worker.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết hàm đang lỗi ở pha nào.</strong></p><ul><li><strong>Log của hàm:</strong> mỗi lần chạy có mã request riêng; cùng một sự kiện xuất hiện nhiều mã là dấu hiệu retry, không phải nhiều sự kiện.</li><li><strong>Chỉ số thời gian chạy:</strong> phân biệt thời gian chờ khởi tạo với thời gian handler, để biết độ trễ đến từ pha Init hay từ công việc thật.</li><li><strong>Số lần gọi đồng thời và số lần bị throttle:</strong> cho biết hàm đang chạm trần concurrency hay đang bị tài nguyên phía sau làm chậm.</li><li><strong>Dead-letter queue và số lần nhận message:</strong> nơi duy nhất thấy được sự kiện đã thử hết lượt, thay vì chỉ thấy lỗi rời rạc trong log.</li></ul>",
  "attacks": [
    {
      "q": "Init và handler khác nhau ở điểm nào, và vì sao điều đó quan trọng?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Init chạy code bên ngoài handler, một lần cho mỗi environment. Handler chạy mỗi lần gọi, cho đúng một sự kiện. Điều đó quan trọng vì mọi thứ bạn mở ở Init — kết nối, client, bảng cấu hình — được tái dùng, còn mọi thứ mở trong handler thì trả giá mỗi lần. Lần gọi đầu trên environment mới là cold start, gồm cả thời gian tạo môi trường.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói Init chạy một lần cho mỗi request. Cách nói đúng: một lần cho mỗi environment, và environment được tái dùng cho nhiều request.</p>"
    },
    {
      "q": "Một lời gọi bất đồng bộ thất bại thì Lambda làm gì?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Lambda thử lại hai lần nữa, cách lần trước khoảng 1 phút rồi 2 phút, nên tổng cộng ba lần chạy. Hết lượt thì sự kiện bị bỏ, hoặc vào dead-letter queue nếu đã cấu hình. Mỗi lần thử chạy lại từ đầu handler, nên tác dụng phụ có thể xảy ra nhiều lần. Vì vậy code phải idempotent, không phải vì Lambda thích gọi lại mà vì nó không biết bạn đã làm gì.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói Lambda thử lại vô hạn. Cách nói đúng: hai lần thử lại, rồi bỏ hoặc vào hàng đợi lỗi.</p>"
    },
    {
      "q": "Đổi sang đọc từ SQS bằng event source mapping thì điều gì quyết định số lần thử?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Hàng đợi quyết định, không phải Lambda. Visibility timeout (khoảng thời gian ẩn message khỏi các worker khác khi đang xử lý) quyết định bao lâu thì message hiện lại. Redrive policy với maxReceiveCount quyết định sau bao nhiêu lần nhận thì message sang Dead-Letter Queue (hàng đợi chứa message lỗi nhiều lần). Nếu hàm lỗi, message không bị xoá nên quay lại sau đúng khoảng ẩn. Vì vậy tôi đặt visibility timeout dài hơn thời gian xử lý thực tế.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói Lambda retry ba lần cho mọi kiểu gọi. Cách nói đúng: ba lần chỉ đúng cho gọi bất đồng bộ; hàng đợi và stream có luật riêng.</p>"
    },
    {
      "q": "Làm sao phân biệt lỗi tạm thời và lỗi vĩnh viễn, và cách xử lý khác nhau thế nào?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Lỗi tạm thời là lỗi mà lần sau có thể khác: timeout mạng, dịch vụ đích đang bận, bị giới hạn tần suất. Lỗi vĩnh viễn là lỗi mà lần sau y hệt: thiếu trường, sai định dạng, ảnh hỏng. Cách phân biệt thực dụng là đọc thông báo lỗi và xem ba lần chạy có dừng ở cùng một dòng không. Với lỗi vĩnh viễn, thử lại chỉ nhân tác dụng phụ, nên tôi đẩy thẳng vào hàng đợi lỗi để người xử lý.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> tăng số lần retry khi gặp lỗi dữ liệu. Cách nói đúng: retry chỉ có ích khi nguyên nhân có thể biến mất giữa hai lần thử.</p>"
    }
  ],
  "anchor": "Init chạy một lần cho mỗi environment còn handler chạy mỗi lần gọi, nên ai thử lại và thử bao nhiêu lần là câu hỏi về kiểu gọi, không phải về code.",
  "say30": "Một lần gọi Lambda có ba pha: Init nạp runtime và chạy code ngoài handler, chạy một lần cho mỗi environment; Invoke chạy handler mỗi lần gọi; và environment warm được giữ lại nên lần sau bỏ qua Init. Khi lỗi, ai thử lại tuỳ kiểu gọi: đồng bộ thì bên gọi, bất đồng bộ thì Lambda thử thêm hai lần, event source thì hàng đợi quyết định. Vì vậy code phải idempotent.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: một hàm xử lý ảnh có timeout 3 giây nhưng cần 5 giây, được gọi bất đồng bộ từ sự kiện upload. Khách nhận ba email cho mỗi ảnh và bảng thống kê đếm gấp ba, trong khi phía gửi chỉ gửi một sự kiện cho mỗi file. Thử lại bằng API Gateway thì chỉ thấy một lỗi, không thấy ba lần chạy.\n\n[Cơ chế (45s)]: Init chạy một lần cho mỗi environment và environment warm bỏ qua nó, còn handler chạy mỗi lần gọi; mỗi request đồng thời cần một environment riêng. Timeout cắt lần chạy giữa chừng nhưng không hoàn tác những gì đã ghi ra ngoài. Retry phụ thuộc kiểu gọi: gọi trực tiếp thì bên gọi quyết định, bất đồng bộ thì Lambda thử thêm hai lần rồi bỏ hoặc vào dead-letter queue, event source đọc queue thì visibility timeout và redrive policy quyết định.\n\n[Ranh giới (15s)]: Retry chỉ cứu lỗi tạm thời; lỗi do dữ liệu sai sẽ lặp y hệt ba lần và nhân tác dụng phụ lên ba. Vì vậy tôi không nới timeout để che lỗi, mà đặt khoá chống lặp trước mọi tác dụng phụ.",
  "body": "<p><strong>Chuyển sang một hệ thống khác cùng hình dạng.</strong> Giả sử bạn làm pipeline nhập hoá đơn: mỗi file PDF phải được đọc, ghi ba bảng, rồi phát một sự kiện cho hệ thống kế toán.</p><p>Câu hỏi đầu tiên không phải viết code thế nào, mà là: nếu hàm này chạy hai lần cho cùng một file, điều gì sẽ sai? Câu trả lời thường là sự kiện kế toán bị phát hai lần, và con số trên báo cáo bị nhân đôi.</p><p>Vì vậy bạn đặt mã file làm khoá, ghi khoá trước khi phát sự kiện, và đặt timeout theo thời gian của file lớn nhất đã biết.</p><p><strong>Ba con số cần biết trước khi chọn timeout.</strong> Thời gian xử lý của file lớn nhất. Thời gian của một lần gọi dịch vụ ngoài. Và thời gian chờ tối đa mà người dùng còn chịu được.</p><p>Nếu file lớn nhất cần 40 giây, đặt timeout 3 giây là tự tạo ra ba lần chạy cho mọi file. Đặt 60 giây thì mỗi lần chạy có cơ hội xong, và retry chỉ xảy ra khi thật sự có lỗi.</p><p>Cuối cùng, tách việc nặng ra khỏi đường đồng bộ: đẩy file vào hàng đợi, để worker làm, và trả lời người dùng ngay. Như vậy timeout của hàm không còn là ràng buộc của trải nghiệm người dùng.</p>",
  "code": "import json\nimport os\n\nimport boto3\nfrom botocore.exceptions import ClientError\n\nTABLE = os.environ[\"IDEMPOTENCY_TABLE\"]\n_ddb = boto3.client(\"dynamodb\")\n\n\ndef handler(event, context):\n    key = event[\"s3\"][\"object\"][\"key\"]\n    try:\n        _ddb.put_item(\n            TableName=TABLE,\n            Item={\"pk\": {\"S\": key}, \"status\": {\"S\": \"running\"}},\n            ConditionExpression=\"attribute_not_exists(pk)\",\n        )\n    except ClientError as err:\n        if err.response[\"Error\"][\"Code\"] == \"ConditionalCheckFailedException\":\n            return {\"statusCode\": 200, \"body\": json.dumps({\"skipped\": key})}\n        raise\n\n    make_thumbnails(key)\n    send_email(key)\n    return {\"statusCode\": 201, \"body\": json.dumps({\"key\": key})}",
  "codeNote": "<p><strong>Cách tệ:</strong> để tác dụng phụ ở giữa handler, không có khoá, và tin rằng mỗi sự kiện chạy một lần. <strong>Cách tốt:</strong> ghi khoá trước, kiểm khoá ở đầu handler, đặt tác dụng phụ sau khi việc chính xong.</p><p>Điểm cần thấy trong đoạn code trên: <code>_ddb.put_item</code> dùng <code>ConditionExpression</code> là <code>attribute_not_exists(pk)</code> — điều kiện được kiểm và ghi trong cùng một lần, nên hai lần chạy song song không cùng vượt qua cửa. Và khoá phải ghi trước, vì ghi sau thì một lần chạy bị dừng ở giữa vẫn để lại tác dụng phụ mà không có khoá.</p>",
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
  "incident": "<p><strong>Không có thứ này thì đau ở đâu?</strong> Kịch bản giả định. Giao diện chạy ở app.example.com, API ở api.example.com. Trang gọi fetch tới API kèm header Authorization.</p><p>Thử bằng curl trên máy: 201, body JSON đúng như mong đợi, ba ngày liền 100 phần trăm số lần thử.</p><p>Trên trình duyệt thì nút bấm không làm gì. Console hiện một dòng đỏ. Tab Network cho thấy request đã đi, server đã trả 201, và trình duyệt vẫn nói không đọc được.</p><p><strong>Câu hỏi dự đoán:</strong> server trả 200 kèm body đầy đủ nhưng thiếu header Access-Control-Allow-Origin thì code giao diện nhận gì? <strong>Đáp án:</strong> fetch bị reject, không có status và không có body; code thấy một lỗi mạng dù server đã trả 200.</p>",
  "askFirst": [
    "Vì sao curl thấy 201 còn trình duyệt lại không thấy gì, dù cùng một URL và cùng một header?",
    "Trình duyệt kiểm tra hai lượt hay một lượt, và mỗi lượt đọc header nào?",
    "Nếu response thật trả 500 mà thiếu header CORS thì lập trình viên phía giao diện nhìn thấy gì?"
  ],
  "predict": {
    "q": "Kịch bản giả định: giao diện ở <code>app.example.com</code> gọi <code>GET /me</code> trên host <code>api.example.com</code> kèm header <code>Authorization</code>. Hỏi: (a) trình duyệt gửi mấy request tới API, (b) request nào mang header <code>Authorization</code>, (c) nếu response thật trả 200 nhưng thiếu <code>Access-Control-Allow-Origin</code> thì code phía giao diện nhận được gì, (d) nếu chuyển sang dùng cookie đăng nhập kèm <code>credentials</code> thì <code>Access-Control-Allow-Origin: *</code> còn dùng được không?",
    "a": "<p><strong>Kết luận: (a) hai request, (b) chỉ request GET thật, (c) nhận lỗi chứ không nhận body, (d) không dùng được wildcard.</strong></p><ul><li><strong>(a)</strong> <code>Authorization</code> không thuộc nhóm header đơn giản, nên request không đơn giản và trình duyệt phải hỏi trước bằng một request OPTIONS, rồi mới gửi request thật: tổng hai request cho một lần gọi.</li><li><strong>(b)</strong> Request OPTIONS chỉ mang <code>Origin</code>, <code>Access-Control-Request-Method</code> và <code>Access-Control-Request-Headers</code>. Header <code>Authorization</code> chỉ đi trên request GET thật, sau khi lượt hỏi trước được chấp nhận.</li><li><strong>(c)</strong> Trình duyệt nhận 200 và có body, nhưng vì response thiếu <code>Access-Control-Allow-Origin</code> nên nó không cho code đọc body; phía giao diện nhận một lỗi mạng, <code>fetch</code> bị reject và không có status lẫn body. Đây là lý do cùng một lỗi mà log server ghi 200.</li><li><strong>(d)</strong> Với <code>credentials</code>, wildcard không được chấp nhận: <code>Access-Control-Allow-Origin</code> phải là đúng origin của giao diện, kèm <code>Access-Control-Allow-Credentials: true</code>, và server phải trả thêm <code>Vary: Origin</code> để cache không trả nhầm header cho origin khác.</li></ul>"
  },
  "naive": "<p><strong>Cách tệ (làm theo phản xạ):</strong> bật CORS cho route OPTIONS ở gateway rồi tin rằng đã xong, vì preflight đã qua.</p><p>Cách này nghe hợp lý vì lỗi đầu tiên bạn thấy trong console đúng là lỗi preflight, và sửa nó thì thông báo đổi sang một lỗi khác.</p><p>Nhưng response thật do hàm trả vẫn thiếu header, nên trình duyệt chặn ở bước đọc. Bạn chỉ sửa một trong hai response, mà trình duyệt kiểm cả hai.</p>",
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
  "rootCause": "<p><strong>Chuỗi nhân quả, mỗi dòng một ý.</strong></p><ul><li>Trang và API khác origin, nên mặc định trình duyệt không cho trang đọc response.</li><li>Request mang header Authorization nên thuộc nhóm không đơn giản, và trình duyệt gửi preflight trước.</li><li>Preflight được trả lời đúng, nên request thật được gửi đi.</li><li>Server xử lý xong và trả 201, nhưng response thật thiếu header CORS.</li><li>Trình duyệt chặn bước đọc, nên code không nhận được status lẫn body.</li><li>curl không có origin và không kiểm header, nên nó luôn thấy 201 và không bao giờ thấy lỗi này.</li></ul>",
  "concept": "<p>CORS là luật của trình duyệt chứ không phải của server: trình duyệt hỏi trước khi request không đơn giản, rồi kiểm tra lại header trên response thật, và chặn việc đọc response chứ không chặn request đã tới server.</p>",
  "mechanism": "<p><strong>Ví von đời thường:</strong> bạn nhờ một người bạn qua văn phòng bên cạnh lấy hồ sơ. Văn phòng đưa hồ sơ cho người bạn, vì họ không có lý do từ chối. Nhưng người bạn chỉ được phép đưa cho bạn nếu văn phòng ghi rõ tên bạn trong giấy uỷ quyền.</p><p><em>Giới hạn của phép ví von:</em> người bạn trong ví dụ suy xét; trình duyệt chỉ so chuỗi ký tự theo một luật cố định.</p><pre><code>Trang ở origin A: app.example.com\nAPI  ở origin B: api.example.com\n\n1) PREFLIGHT (hỏi trước, chỉ khi cần)\n   trình duyệt ─OPTIONS /files─► server B\n                Origin: app.example.com\n                Access-Control-Request-Method: POST\n   trình duyệt ◄─204 + Access-Control-Allow-Origin─ server B\n                  (thiếu header này thì DỪNG, không gửi request thật)\n\n2) REQUEST THẬT\n   trình duyệt ─POST /files─► server B ─► 201 + Access-Control-Allow-Origin\n   trình duyệt: header có khớp origin không?\n        ├─ khớp   → cho JavaScript đọc body\n        └─ không  → CHẶN việc đọc; fetch reject; server vẫn ghi log 201</code></pre><ol><li><strong>Bước 1 — origin là ba thứ cộng lại:</strong> scheme, host và port. app.example.com và api.example.com là hai origin khác nhau dù cùng tên miền gốc.</li><li><strong>Bước 2 — Mặc định trình duyệt không cho trang này đọc response từ origin khác:</strong> đây là luật bảo vệ người dùng, để một trang lạ không đọc dữ liệu của bạn từ API mà trình duyệt đang giữ cookie.</li><li><strong>Bước 3 — Server nới luật bằng header, nhưng chỉ trình duyệt thi hành:</strong> Access-Control-Allow-Origin nói origin nào được đọc. Đó là lời khai của server, không phải lệnh chặn, nên curl không bị ảnh hưởng.</li><li><strong>Bước 4 — Preflight và request thật là hai response, có thể do hai nơi sinh ra:</strong> với API Gateway, preflight có thể do gateway tạo còn response thật do hàm trả. Cả hai đều cần header, kể cả nhánh lỗi, nếu không giao diện không đọc được thông báo lỗi.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"curl trả 200 nghĩa là CORS ổn.\"</strong> Nghe hợp lý vì curl nhận đúng body, đúng status, thậm chí đúng cả JSON. Điều đúng: curl không phải trình duyệt, nó không có origin, không hỏi trước và không kiểm tra header CORS. Phản chứng: gửi một request OPTIONS kèm header <code>Origin</code> đúng giá trị origin của giao diện rồi đọc các header trả về; nếu thiếu <code>Access-Control-Allow-Origin</code> thì trình duyệt sẽ chặn dù curl vẫn thấy 200.</li><li><strong>\"Bật CORS ở gateway là xong.\"</strong> Nghe hợp lý vì gateway là chỗ cấu hình tập trung và OPTIONS đã xanh. Điều đúng: cấu hình đó chỉ thêm header cho response do gateway tự tạo; response do integration trả về phải tự mang header, nếu không thì lượt hỏi trước xanh mà lượt thật vẫn bị chặn. Phản chứng: OPTIONS trả 200 có header, còn POST trả 201 không có header.</li><li><strong>\"Dùng wildcard là an toàn cho mọi trường hợp.\"</strong> Nghe hợp lý vì wildcard làm mọi đường thành công hết lỗi. Điều đúng: với credentials, wildcard bị từ chối, nên request mang cookie bị chặn ngay cả khi không có lỗi nào khác. Phản chứng: console báo wildcard không hợp lệ khi credentials được bật, và cookie không có trong request.</li></ul>",
  "tradeoff": "<p><strong>Được gì:</strong> giao diện ở một origin gọi được API ở origin khác, mà vẫn giữ lá chắn mặc định cho những trang không được phép.</p><p><strong>Mất gì:</strong> preflight là thêm một vòng khứ hồi cho mỗi request không đơn giản, trừ khi dùng Access-Control-Max-Age để cache. Khai báo header ở hai nơi là hai chỗ có thể lệch nhau. Dùng dấu sao thì đơn giản nhưng không dùng được với credential.</p><p><strong>Rủi ro:</strong> mở cho mọi origin thì bất kỳ trang nào cũng đọc được response của API, đúng thứ CORS sinh ra để ngăn.</p><p><strong>Vì sao vẫn đáng:</strong> đây là cơ chế duy nhất khiến trình duyệt không cho trang lạ đọc dữ liệu người dùng. Không có nó, mọi API công khai đều bị đọc chéo.</p>",
  "alternatives": "<p><strong>Khi nào KHÔNG nên dùng.</strong></p><ul><li>Đừng mở CORS cho mọi origin nếu API có dữ liệu người dùng; hãy echo đúng origin trong danh sách cho phép và thêm Vary: Origin.</li><li>Đừng dựa vào CORS để bảo vệ API khỏi người gọi không phải trình duyệt; nó không làm được việc đó.</li><li>Đừng thêm CORS khi giao diện và API cùng một origin; trình duyệt không kiểm tra gì trong trường hợp đó.</li><li>Đừng đặt Max-Age quá dài khi danh sách origin còn thay đổi; trình duyệt sẽ dùng kết quả preflight cũ.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết thiếu header ở lượt nào.</strong></p><ul><li><strong>Dòng lỗi trong console:</strong> câu chữ khác nhau cho từng trường hợp — thiếu tên header ở preflight, thiếu allow-origin ở response thật, wildcard không hợp lệ với credentials. Đọc đúng câu là biết sửa ở đâu.</li><li><strong>Tab Network:</strong> nếu chỉ có OPTIONS mà không có request thật, lỗi nằm ở lượt hỏi trước; nếu có request thật với status 200 mà console vẫn đỏ, lỗi nằm ở header của response thật.</li><li><strong>Header trả về:</strong> kiểm tra <code>Access-Control-Allow-Origin</code>, <code>Access-Control-Allow-Headers</code>, <code>Vary</code> trên cả hai lượt, kể cả trên response 4xx và 5xx.</li><li><strong>Log của gateway và của hàm:</strong> nếu request thật đã tới handler mà trình duyệt vẫn báo lỗi, thì lỗi thuần tuý ở header, không phải ở xác thực hay ở nghiệp vụ.</li></ul>",
  "attacks": [
    {
      "q": "Vì sao curl trả 200 mà trình duyệt vẫn báo lỗi?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Vì CORS là luật do trình duyệt thi hành, không phải do server. curl không có origin, không gửi preflight và không kiểm header, nên nó thấy đúng những byte server gửi. Trình duyệt thì kiểm Access-Control-Allow-Origin trước khi cho JavaScript đọc body. Thiếu header đó, nó chặn bước đọc dù server đã trả 200 và đã ghi log 200.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói server chặn request. Cách nói đúng: request đã tới và đã được xử lý; chỗ bị chặn là bước đọc response.</p>"
    },
    {
      "q": "Khi nào trình duyệt gửi preflight, và nó hỏi những gì?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Khi request không thuộc nhóm đơn giản: method khác GET, POST, HEAD, hoặc có header lạ như Authorization, hoặc content type lạ. Preflight là một request OPTIONS mang Origin, Access-Control-Request-Method và Access-Control-Request-Headers. Server trả lời bằng các header Access-Control-Allow. Chỉ khi câu trả lời khớp thì trình duyệt mới gửi request thật. Max-Age giữ kết quả trong cache để khỏi hỏi lại mỗi lần.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói preflight mang token xác thực. Cách nói đúng: preflight chỉ mô tả request sắp gửi, không mang credential của ứng dụng.</p>"
    },
    {
      "q": "API dùng cookie thì có dùng được Access-Control-Allow-Origin với dấu sao không?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Không. Khi request mang credential, Access-Control-Allow-Origin phải là đúng origin của trang, không được là dấu sao. Ngoài ra phải có Access-Control-Allow-Credentials đặt true, và phía fetch phải đặt credentials là include. Dấu sao chỉ hợp lệ khi không có credential. Vì vậy tôi echo lại origin sau khi kiểm nó nằm trong danh sách cho phép, và thêm Vary: Origin để cache không trộn response của hai origin.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> chỉ sửa Allow-Origin mà quên Allow-Credentials. Cách nói đúng: thiếu một trong hai thì trình duyệt vẫn chặn.</p>"
    },
    {
      "q": "Sửa CORS ở đâu khi API chạy sau API Gateway?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Ở cả hai chỗ sinh response. Response preflight có thể do gateway tạo, response thật do hàm trả. Nếu chỉ bật CORS cho route OPTIONS thì preflight qua mà request thật vẫn bị chặn. Cách tôi làm là để một hàm duy nhất sinh header rồi dùng cho mọi nhánh, kể cả nhánh lỗi. Kiểm chứng bằng cách gọi thử một request lỗi và xem response lỗi có header không.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> quên nhánh lỗi. Cách nói đúng: response 4xx và 5xx cũng cần header, nếu không giao diện không đọc được thông báo lỗi.</p>"
    }
  ],
  "anchor": "CORS là luật của trình duyệt, không phải của server: request vẫn tới nơi và vẫn ghi dữ liệu, chỉ có việc đọc response là bị chặn.",
  "say30": "Kịch bản giả định: giao diện và API khác origin, curl thấy 201 nhưng trình duyệt báo lỗi CORS. Nguyên nhân: trình duyệt hỏi trước bằng OPTIONS khi request không đơn giản, rồi kiểm tra lại Access-Control-Allow-Origin trên response thật. Server trả 200 mà thiếu header thì trình duyệt vẫn chặn việc đọc response, và curl không thực thi luật đó nên không tái hiện được.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: giao diện ở một host, API ở host khác. curl gọi POST kèm header x-tenant-id thấy 201 trong ba ngày liền, còn trình duyệt không gửi được request nào. Sau khi thêm tên header, lỗi đổi sang thiếu Access-Control-Allow-Origin: POST đã tới server, trả 201, mà phía giao diện vẫn nhận lỗi.\n\n[Cơ chế (45s)]: Trình duyệt xác định origin bằng scheme, host và port; khác một phần là cross-origin. Header tuỳ biến làm request không đơn giản, nên nó gửi OPTIONS kèm Access-Control-Request-Headers và đòi response liệt kê đúng các tên đó. Lượt thật vẫn được gửi và response phải mang Access-Control-Allow-Origin lần nữa, kể cả khi là 4xx hay 5xx. Với cookie thì wildcard bị từ chối, phải trả đúng origin kèm Allow-Credentials và Vary: Origin.\n\n[Ranh giới (15s)]: CORS không phải cơ chế xác thực: client không phải trình duyệt bỏ qua nó hoàn toàn, nên server vẫn phải tự kiểm tra quyền. Vì vậy tôi sửa header ở đúng lượt bị thiếu, không nới wildcard để che lỗi.",
  "body": "<p><strong>Chuyển sang một hệ thống khác cùng hình dạng.</strong> Giả sử bạn tách giao diện và API sang hai tên miền: app cho người dùng, api cho dịch vụ. Mọi thứ chạy tốt trên máy bạn vì cả hai cùng cổng localhost, tức cùng origin.</p><p>Ngày deploy, giao diện gọi API và không nhận được gì. Đây là lúc CORS xuất hiện, và nó xuất hiện đúng lúc bạn ít muốn gỡ lỗi nhất.</p><p><strong>Cách kiểm nhanh trong ba bước.</strong> Mở tab Network, xem có request OPTIONS trước request thật không. Nếu có, đọc header của response OPTIONS trước. Sau đó đọc header của response thật.</p><p>Hai response phải cùng khai báo origin. Nếu một trong hai thiếu, bạn đã tìm ra chỗ sửa mà không cần đọc code.</p><p>Một chi tiết hay bị bỏ qua: khi có cookie, header phải là đúng origin chứ không phải dấu sao, và phải có Access-Control-Allow-Credentials. Nếu dùng dấu sao, trình duyệt chặn dù mọi thứ khác đúng.</p><p>Và luôn nhớ: nếu curl trả 200 mà trình duyệt báo lỗi, thủ phạm không phải server. Đừng sửa server trước khi đọc header.</p>",
  "code": "import json\nimport os\n\n# ALLOWED chưa có host, nên tách scheme và path khỏi header Origin trước khi so.\nALLOWED = {\n    \"app.example.com\",\n    \"localhost:5173\",\n}\n\n\ndef cors_headers(event):\n    raw_origin = event.get(\"headers\", {}).get(\"origin\", \"\")\n    # origin ở đây là host sau khi tách scheme, đúng dạng để so với ALLOWED.\n    origin = raw_origin.split(\"://\", 1)[-1].split(\"/\", 1)[0].lower()\n    if origin not in ALLOWED:\n        return {\"Vary\": \"Origin\"}\n    return {\n        \"Access-Control-Allow-Origin\": raw_origin,\n        \"Access-Control-Allow-Methods\": \"GET,POST,OPTIONS\",\n        \"Access-Control-Allow-Headers\": \"content-type,authorization,x-tenant-id\",\n        \"Access-Control-Allow-Credentials\": \"true\",\n        \"Vary\": \"Origin\",\n    }\n\n\ndef handler(event, context):\n    headers = cors_headers(event)\n    if event[\"requestContext\"][\"http\"][\"method\"] == \"OPTIONS\":\n        return {\"statusCode\": 204, \"headers\": headers, \"body\": \"\"}\n    return {\"statusCode\": 201, \"headers\": headers, \"body\": json.dumps({\"ok\": True})}",
  "codeNote": "<p><strong>Cách tệ:</strong> chỉ bật CORS cho preflight ở gateway, để hàm trả response thật không có header — preflight qua mà bước đọc vẫn bị chặn. <strong>Cách tốt:</strong> một hàm duy nhất sinh header và dùng cho mọi nhánh, echo đúng origin, thêm Vary: Origin.</p><p>Trong đoạn code trên, <code>cors_headers</code> trả về đúng một header <code>Vary: Origin</code> khi origin lạ — không có <code>Access-Control-Allow-Origin</code> nào được gửi, nên trình duyệt vẫn chặn. Điểm dễ sai là quên nhánh lỗi: response 4xx và 5xx cũng cần header, nếu không giao diện không đọc được thông báo lỗi.</p>",
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
  "incident": "<p><strong>Không có thứ này thì đau ở đâu?</strong> Kịch bản giả định. Người dùng chọn một ảnh 8 MB. Giao diện gửi ảnh tới hàm Lambda, hàm đọc cả 8 MB vào bộ nhớ rồi ghi lên S3. Hàm được cấp 512 MB bộ nhớ.</p><p>Byte của ảnh đi qua mạng hai lần và nằm trong bộ nhớ của hàm một lần. Mỗi lần tải mất khoảng 6 giây, và con số đó tỉ lệ với kích thước ảnh: 16 MB là 12 giây, 32 MB có thể vượt giới hạn thời gian chạy.</p><p>Song song đó, màn hình đơn hàng của tôi quét toàn bảng đơn hàng rồi lọc theo mã người dùng. Bảng có 200 000 bản ghi, mỗi người khoảng 50 đơn. Trang mất vài giây, và hoá đơn đọc tăng theo kích thước bảng chứ không theo số đơn của người đó.</p><p><strong>Câu hỏi dự đoán:</strong> trình duyệt có cầm credential AWS nào để tải ảnh lên S3 không? <strong>Đáp án:</strong> không. Nó chỉ cầm một URL có chữ ký và hạn dùng; quyền nằm trong chữ ký.</p>",
  "askFirst": [
    "Ai đang thực sự ghi tệp lên S3, và quyền ghi nằm ở đâu trong đường đi đó?",
    "Điều gì quyết định số bản ghi mà DynamoDB phải đọc cho một truy vấn?",
    "Nếu URL ký sẵn lộ ra ngoài thì thiệt hại tối đa là gì, và cái gì giới hạn nó?"
  ],
  "predict": {
    "q": "Kịch bản giả định: hàm ký một URL cho phép ghi một khoá duy nhất, hết hạn sau 300 giây, rồi trả URL đó cho trình duyệt. Người dùng bấm tải lên ở giây thứ 200 và mất 90 giây để tải xong. Hỏi: (a) chữ ký do ai tạo và bằng quyền gì, (b) trình duyệt có cầm credential AWS nào không, (c) nếu người dùng bấm ở giây thứ 320 thì nhận lỗi gì, (d) để lấy 50 đơn của một người trong bảng 200 000 bản ghi thì nên đọc bằng cách nào và đọc khoảng bao nhiêu bản ghi?",
    "a": "<p><strong>Kết luận: (a) do hàm ký bằng quyền của execution role, (b) không cầm credential nào, (c) lỗi truy cập bị từ chối vì chữ ký hết hạn, (d) Query theo khoá phân vùng, đọc đúng phần của người đó.</strong></p><ul><li><strong>(a)</strong> Hàm gọi API của S3 để tạo chữ ký bằng credential tạm của execution role. Chữ ký ràng buộc thao tác, bucket, khoá và thời hạn; quyền thực thi vẫn là quyền của role.</li><li><strong>(b)</strong> Trình duyệt chỉ nhận một URL đã có chữ ký trong query string, không có access key. Vì vậy không cần nhúng credential vào giao diện, và cũng không thể dùng URL đó cho khoá khác.</li><li><strong>(c)</strong> Hết hạn tính theo thời điểm chữ ký được tạo, không theo thời điểm bắt đầu tải. Bấm ở giây thứ 320 là sau mốc 300 giây, nên yêu cầu bị từ chối với lỗi truy cập; nếu chữ ký còn hạn mà tải dài hơn hạn thì phần đã gửi vẫn có thể hoàn tất.</li><li><strong>(d)</strong> Dùng Query với khoá phân vùng là mã người dùng: chỉ phần dữ liệu của người đó được đọc, khoảng 50 bản ghi cộng phần đọc thừa của một trang kết quả. Nếu lọc sau khi quét, toàn bộ bảng vẫn bị đọc rồi mới bị loại.</li></ul>"
  },
  "naive": "<p><strong>Cách tệ (làm theo phản xạ):</strong> cho byte đi qua hàm vì đó là đường ngắn nhất về mặt code, và đọc bảng bằng cách quét rồi lọc vì đó là cách viết quen tay nhất.</p><p>Cách này nghe hợp lý vì cả hai đều chạy đúng khi dữ liệu còn nhỏ: ảnh vài trăm KB, bảng vài nghìn dòng, mọi thứ đều nhanh.</p><p>Nhưng thời gian và bộ nhớ của hàm tỉ lệ với kích thước tệp, còn hoá đơn đọc tỉ lệ với kích thước bảng. Cả hai đều hỏng theo cùng một kiểu: đắt lên khi dữ liệu lớn, không phải khi lưu lượng tăng.</p>",
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
  "rootCause": "<p><strong>Chuỗi nhân quả, mỗi dòng một ý.</strong></p><ul><li>Cấp quyền ghi S3 là một quyết định, không phải một khối byte, nên không cần chuyển dữ liệu để trao quyền.</li><li>Đi qua hàm thì byte phải qua mạng hai lần và nằm trong RAM một lần.</li><li>Bộ nhớ và thời gian chạy của hàm có trần, nên tệp lớn làm hàm hết bộ nhớ hoặc hết giờ.</li><li>Bảng khoá-giá trị chỉ đọc rẻ khi đi đúng qua khoá phân vùng.</li><li>Quét toàn bảng đọc mọi item, nên lượng đọc tỉ lệ với kích thước bảng.</li><li>Điều kiện lọc chạy sau khi đã đọc, nên lọc chặt hơn không làm giảm lượng đọc tính tiền.</li></ul>",
  "concept": "<p>URL ký sẵn đặt quyền hạn vào chính đường dẫn trong một thời hạn, còn DynamoDB chỉ rẻ khi truy vấn đi qua khoá phân vùng — điều kiện lọc chỉ chạy sau khi dữ liệu đã được đọc.</p>",
  "mechanism": "<p><strong>Ví von đời thường:</strong> hàm của bạn là lễ tân của một toà nhà. Thay vì tự khiêng từng thùng hàng vào kho, lễ tân viết một giấy giới thiệu: đúng một cửa kho, đúng một loại việc, và có hạn 5 phút. Ai cầm giấy đó cũng vào được cửa đó, trong hạn đó.</p><p><em>Giới hạn của phép ví von:</em> giấy thật chỉ một người cầm, còn URL thì ai có cũng dùng được, nên hạn ngắn và phạm vi hẹp là hai thứ bảo vệ duy nhất.</p><pre><code>CÁCH TỆ — byte đi qua hàm\n  Trình duyệt ─8 MB─► Lambda (512 MB) ─8 MB─► S3\n                       ▲ 2 lần qua mạng, 1 lần trong RAM\n                       ▲ thời gian tỉ lệ với kích thước ảnh\n\nCÁCH TỐT — hàm chỉ ký\n  1. Trình duyệt ─xin URL─► Lambda ─ký bằng execution role─► (không gửi byte)\n  2. Trình duyệt ◄─URL hạn 300 giây─ Lambda\n  3. Trình duyệt ─PUT 8 MB─────────────────────────────► S3\n  4. Trình duyệt ─báo xong─► Lambda ─head_object─► S3 (xác nhận có tệp thật)\n\nĐỌC DYNAMODB — khoá quyết định lượng đọc\n  Query  pk = USER#42  ─► đọc 50 item  (1 trang)\n  Scan   toàn bảng     ─► đọc 200 000 item (196 trang 1 MB) ─► lọc còn 50\n                                              ▲ trả tiền cho 200 000</code></pre><ol><li><strong>Bước 1 — Chữ ký là một phép tính trên nội dung request:</strong> hàm lấy method, đường dẫn và vài tham số, băm tất cả với một khoá bí mật. Ai có khoá đó mới tính lại được đúng chuỗi kết quả.</li><li><strong>Bước 2 — Vì chữ ký trói nội dung, nó trói luôn phạm vi:</strong> method nằm trong phần được ký nên URL ký cho PUT không dùng được cho GET; đường dẫn nằm trong đó nên đổi khoá là sai chữ ký; hạn cũng nằm trong đó nên không sửa được.</li><li><strong>Bước 3 — Presigned URL mang quyền tạm thời, nên phải xác nhận sau khi tải</strong> (đường dẫn có chữ ký số và hạn dùng để tải trực tiếp lên S3). Hết hạn không chứng minh tệp đã nằm đó, nên hàm gọi head_object để đọc kích thước và content type thật rồi so với cái đã ký.</li><li><strong>Bước 4 — Phía đọc, partition key quyết định dữ liệu nằm ở đâu</strong> (khóa phân vùng quyết định dữ liệu nằm ở phân vùng vật lý nào). Query bắt buộc đúng một giá trị khoá phân vùng; Scan đọc mọi item; FilterExpression lọc sau khi đã đọc nên không làm giảm lượng đọc tính tiền.</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"URL ký sẵn là công khai.\"</strong> Nghe hợp lý vì URL không có mật khẩu và ai có nó cũng dùng được. Điều đúng: URL chỉ cho đúng thao tác trên đúng khoá và hết hạn theo thời gian đã ký, nên thiệt hại bị chặn trong phạm vi đó. Phản chứng: đổi khoá trong URL đã ký rồi gửi lại, và thấy yêu cầu bị từ chối.</li><li><strong>\"Quét bảng cũng nhanh vì bảng còn nhỏ.\"</strong> Nghe hợp lý vì ở môi trường phát triển, quét vài nghìn bản ghi trả về gần như tức thì. Điều đúng: lượng đọc tính tiền tăng theo kích thước bảng, nên chi phí tăng dù độ trễ còn chấp nhận được. Phản chứng: so lượng đọc tính tiền của một lần quét ở hai kích thước bảng khác nhau, cùng một truy vấn nghiệp vụ.</li><li><strong>\"Thêm điều kiện lọc là giảm chi phí.\"</strong> Nghe hợp lý vì kết quả trả về ít hơn hẳn. Điều đúng: lọc chạy sau khi đọc, nên lượng đọc không đổi. Phản chứng: thêm điều kiện lọc chặt hơn và thấy số bản ghi trả về giảm còn lượng đọc tính tiền giữ nguyên.</li></ul>",
  "tradeoff": "<p><strong>Được gì:</strong> hàm không còn là đường đi của dữ liệu nên thời gian chạy phẳng theo kích thước tệp. Query theo khoá cho lượng đọc tỉ lệ với kết quả, không tỉ lệ với bảng.</p><p><strong>Mất gì:</strong> URL ký sẵn là một chuỗi mang quyền, ai có nó thì dùng được, nên phải đặt hạn ngắn và phạm vi hẹp. Bạn cần thêm bước xác nhận sau khi tải. Phía DynamoDB, thiết kế khoá là quyết định một chiều: đổi khoá sau khi có dữ liệu là một cuộc di trú.</p><p><strong>Rủi ro:</strong> đặt hạn quá dài cho tiện thì hạn không còn là giới hạn thiệt hại; quên bước xác nhận thì bạn có bản ghi trỏ tới object không tồn tại.</p><p><strong>Vì sao vẫn đáng:</strong> bạn bỏ được một tầng tính toán khỏi đường đi của mọi byte, và đổi một phép quét thành một phép tra cứu. Cả hai đều là cải thiện tuyến tính theo dữ liệu, không phải tối ưu vặt.</p>",
  "alternatives": "<p><strong>Khi nào KHÔNG nên dùng.</strong></p><ul><li>Đừng dùng URL ký sẵn khi bạn buộc phải kiểm tra hoặc biến đổi nội dung trước khi tệp vào bucket; đi thẳng thì tệp sai đã nằm trong bucket trước khi bước kiểm tra chạy.</li><li>Đừng đặt hạn quá dài cho tiện; hạn chính là toàn bộ phạm vi thiệt hại nếu URL lộ.</li><li>Đừng dùng DynamoDB cho câu hỏi không đi qua khoá, ví dụ mọi đơn trên một số tiền; lúc đó bạn phải quét và một cơ sở dữ liệu quan hệ có index sẽ rẻ hơn.</li><li>Đừng thêm chỉ mục phụ với hy vọng làm Scan nhanh hơn; chỉ mục chỉ giúp khi câu hỏi đi qua khoá của chính nó.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết chi phí đọc đến từ đâu.</strong></p><ul><li><strong>Lượng đọc tính tiền của từng truy vấn:</strong> so với số bản ghi thực sự trả về; chênh lệch lớn là dấu hiệu đang quét hoặc lọc sau khi đọc.</li><li><strong>Chỉ số bị chặn do vượt hạn mức:</strong> xuất hiện khi một khoá phân vùng bị dồn quá nhiều, khác với chậm đều do bảng lớn.</li><li><strong>Kích thước và thời gian chạy của hàm tải lên:</strong> nếu cả hai tăng theo kích thước tệp thì tệp đang đi xuyên qua hàm.</li><li><strong>Log truy cập của bucket:</strong> cho biết lần ghi thật sự đến từ trình duyệt hay từ hàm, và có bao nhiêu lần ghi cho một tệp.</li></ul>",
  "attacks": [
    {
      "q": "Chữ ký trong presigned URL do ai tạo, bằng quyền gì, và nó bảo vệ được gì?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Hàm của tôi tạo, bằng credential tạm của execution role. Chữ ký trói method, đường dẫn và thời hạn, nên URL ký cho PUT không dùng được cho GET, đổi khoá là sai chữ ký, và không sửa được hạn. Vì vậy nếu URL lộ, phạm vi thiệt hại đúng bằng một thao tác trên một khoá trong một khoảng thời gian. Trình duyệt không cầm credential nào cả.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói URL ký sẵn là URL công khai. Cách nói đúng: nó là URL mang quyền có hạn, mạnh đúng bằng role đã ký nó.</p>"
    },
    {
      "q": "Người dùng bấm tải ở giây thứ 320 với URL hạn 300 giây thì sao? Nếu họ bắt đầu tải ở giây 290?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Bấm ở giây 320 thì bị từ chối, vì S3 kiểm hạn tại thời điểm nhận request. Bắt đầu ở giây 290 thì lần tải đó vẫn chạy tiếp qua mốc 300, vì hạn đã được kiểm lúc bắt đầu. Nhưng nếu mạng đứt và họ nối lại sau mốc hạn thì phần nối lại bị từ chối. Đó là lý do tôi đặt hạn đủ rộng cho một lần tải thực tế, chứ không đặt sát.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói hết hạn là tệp bị xoá. Cách nói đúng: hết hạn chỉ làm URL vô giá trị; object đã ghi vẫn còn.</p>"
    },
    {
      "q": "Tải xong rồi, vì sao vẫn cần một bước xác nhận?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Vì URL còn hạn không chứng minh tệp đã nằm đó. Trình duyệt có thể đóng tab, mất mạng giữa chừng, hoặc gửi một tệp khác kích thước. Tôi gọi head_object để đọc kích thước và content type thật, so với cái đã ký, rồi mới ghi metadata nghiệp vụ. Đây là chỗ duy nhất đánh dấu trạng thái đã có tệp. Không có bước này, bạn có bản ghi trỏ tới object không tồn tại.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> tin sự kiện ObjectCreated của bucket là đủ. Cách nói đúng: sự kiện đó nói có object, không nói object đúng như bạn ký.</p>"
    },
    {
      "q": "Vì sao thêm FilterExpression không làm giảm hoá đơn đọc DynamoDB?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Vì filter chạy sau khi dữ liệu đã được đọc. Scan vẫn đọc hết các trang 1 MB rồi mới bỏ những item không khớp, nên lượng đọc tính tiền không đổi; chỉ số item trả về giảm. Muốn giảm thật thì phải đổi đường đọc: đưa tiêu chí lọc vào khoá phân vùng hoặc khoá sắp xếp, hoặc tạo chỉ mục phụ có khoá đúng câu hỏi đó.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói thêm index là hết chậm. Cách nói đúng: chỉ mục chỉ giúp khi câu hỏi đi qua khoá của chỉ mục đó.</p>"
    }
  ],
  "anchor": "Quyền ghi tạm thời nên nằm trong chính URL ký sẵn, còn chi phí đọc DynamoDB nằm ở khoá phân vùng chứ không ở điều kiện lọc.",
  "say30": "URL ký sẵn đặt quyền hạn vào chính đường dẫn trong một thời hạn: hàm ký bằng quyền của execution role, trình duyệt ghi thẳng lên S3 mà không cầm credential nào, nên độ trễ và bộ nhớ của hàm không còn phụ thuộc kích thước tệp. Với DynamoDB, chi phí đọc phụ thuộc khoá phân vùng: Query đọc đúng phần cần, còn Scan đọc cả bảng rồi mới lọc, nên điều kiện lọc không làm giảm tiền.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: giao diện gửi ảnh 8 MB qua API Gateway tới một hàm, hàm đọc cả tệp vào bộ nhớ rồi ghi lên S3, và ảnh lớn làm hàm hết thời gian. Cùng lúc, màn hình đơn hàng quét bảng 200 000 bản ghi rồi lọc theo mã người dùng, nên chi phí đọc tăng theo kích thước bảng dù mỗi người chỉ cần khoảng 50 đơn.\n\n[Cơ chế (45s)]: Hàm gọi API của S3 để ký cho đúng một thao tác, đúng khoá và một thời hạn; chữ ký mang quyền của execution role nhưng không mở rộng sang khoá khác, nên trình duyệt ghi trực tiếp mà không cần credential. Hàm sau đó chỉ nhận xác nhận để ghi metadata. Với DynamoDB, Query đi theo khoá phân vùng còn Scan đi qua cả bảng; điều kiện lọc áp sau khi đọc nên chỉ giảm số bản ghi trả về.\n\n[Ranh giới (15s)]: URL ký sẵn không kiểm tra nội dung tệp, nên nếu quy định bắt buộc chặn loại tệp sai thì phải có bước kiểm tra sau khi tệp vào bucket. Tôi cũng không nới thời hạn ký, vì thời hạn chính là phạm vi thiệt hại.",
  "body": "<p><strong>Chuyển sang một hệ thống khác cùng hình dạng.</strong> Giả sử bạn làm cổng nộp hồ sơ: người dùng tải lên ba tệp PDF, rồi xem lại danh sách hồ sơ đã nộp của mình.</p><p>Việc tải lên và việc xem lại là hai bài toán khác nhau, và chúng cần hai cách đọc khác nhau. Đừng dùng chung một cách.</p><p>Với việc tải lên, câu hỏi là: ai cấp quyền, trong bao lâu, cho đúng một tệp nào? Hàm ký một URL cho mỗi tệp, hạn vài phút, rồi xác nhận bằng head_object sau khi người dùng báo xong.</p><p>Với việc xem lại, câu hỏi là: khoá phân vùng có đúng là thứ tôi lọc theo không? Nếu người dùng chỉ xem hồ sơ của mình thì đặt khoá phân vùng là mã người dùng, và mỗi lần mở trang là một lần Query.</p><p><strong>Dấu hiệu bạn đang thiết kế khoá sai.</strong> Nếu mọi màn hình đều phải quét rồi lọc, khoá của bạn không khớp câu hỏi. Nếu bạn phải thêm chỉ mục phụ cho từng màn hình, đó là dấu hiệu thứ hai.</p><p>Sửa lúc này rẻ hơn nhiều so với sau khi có dữ liệu thật, vì đổi khoá nghĩa là ghi lại toàn bộ bảng.</p>",
  "code": "import json\nimport os\n\nimport boto3\n\n_s3 = boto3.client(\"s3\")\n_table = boto3.resource(\"dynamodb\").Table(os.environ[\"ORDERS_TABLE\"])\n\n\ndef sign_upload(event, context):\n    body = json.loads(event[\"body\"])\n    key = f\"uploads/{body['userId']}/{body['uploadId']}\"\n    url = _s3.generate_presigned_url(\n        ClientMethod=\"put_object\",\n        Params={\n            \"Bucket\": os.environ[\"UPLOAD_BUCKET\"],\n            \"Key\": key,\n            \"ContentType\": body[\"contentType\"],\n        },\n        ExpiresIn=300,\n    )\n    return {\"statusCode\": 200, \"body\": json.dumps({\"url\": url, \"key\": key})}\n\n\ndef list_orders(user_id):\n    return _table.query(\n        KeyConditionExpression=\"pk = :pk\",\n        ExpressionAttributeValues={\":pk\": f\"USER#{user_id}\"},\n    )[\"Items\"]",
  "codeNote": "<p><strong>Cách tệ:</strong> nhận byte trong hàm rồi ghi lên S3, và đọc bảng bằng scan rồi lọc. <strong>Cách tốt:</strong> hàm chỉ ký URL, và câu hỏi nghiệp vụ đi đúng qua khoá phân vùng.</p><p>Điểm cần thấy: <code>generate_presigned_url</code> chỉ tính chữ ký, không gửi dữ liệu nào. Còn <code>KeyConditionExpression</code> là điều kiện trên khoá nên được đẩy xuống tầng lưu trữ, khác hẳn <code>FilterExpression</code> vốn chạy sau khi đã đọc xong.</p>",
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
  "incident": "<p><strong>Không có thứ này thì đau ở đâu?</strong> Kịch bản giả định. Sau một đợt nhập dữ liệu, hàng đợi còn 12 000 message tồn. Có 6 consumer (tiến trình lấy việc ra làm), mỗi lần nhận tối đa 10 message, xử lý lần lượt, mỗi message khoảng 40 giây.</p><p>Visibility timeout (khoảng thời gian ẩn message khỏi các worker khác khi đang xử lý) đặt 30 giây.</p><p>Ba ngày sau, khách phàn nàn nhận hai email xác nhận cho cùng một đơn. Backlog gần như không giảm, dù đội đã tăng số consumer từ 6 lên 12.</p><p><strong>Câu hỏi dự đoán:</strong> message đã được consumer nhận, vậy nó còn nằm trong hàng đợi không? <strong>Đáp án:</strong> còn. Nó chỉ bị ẩn tạm; hết khoảng ẩn mà chưa xoá thì nó hiện lại cho consumer khác.</p>",
  "askFirst": [
    "Trong một giây, hệ thống hiện tại xử lý được bao nhiêu message, và con số đó phụ thuộc vào những đại lượng nào?",
    "Vì sao cùng một message lại được hai consumer xử lý, và điều gì cho phép chuyện đó xảy ra?",
    "Khi một consumer chết giữa chừng, message quay lại sau bao lâu và ai chịu trách nhiệm?"
  ],
  "predict": {
    "q": "Kịch bản giả định: 6 consumer, mỗi lần nhận tối đa 10 message, mỗi message mất 40 giây, visibility timeout 30 giây. Hỏi: (a) số message xử lý được trong một giây là bao nhiêu, (b) có message nào bị xử lý hai lần không, (c) nếu nâng visibility timeout lên 120 giây thì đổi lại cái gì, (d) nếu một consumer chết ngay sau khi nhận message thì message quay lại sau bao lâu?",
    "a": "<p><strong>Kết luận: (a) khoảng 1,5 message mỗi giây, (b) có, (c) hết trùng nhưng message của consumer chết lâu được giao lại hơn, (d) sau khoảng 30 giây theo cấu hình hiện tại.</strong></p><ul><li><strong>(a)</strong> Mỗi consumer xử lý 10 message trong 40 giây, tức 0,25 message mỗi giây; sáu consumer cho khoảng 1,5 message mỗi giây. Với 12 000 message thì cần khoảng 8000 giây, tức hơn hai giờ, và tăng consumer là cách duy nhất tăng con số này nếu thời gian mỗi message không đổi.</li><li><strong>(b)</strong> Có: visibility timeout 30 giây ngắn hơn 40 giây cần để xử lý, nên message hiện lại khi consumer đầu còn đang làm, và consumer khác nhận được nó. Đây là nguồn của phần email thừa.</li><li><strong>(c)</strong> Nâng lên 120 giây thì message không hiện lại giữa chừng nên hết trùng; đổi lại, nếu consumer chết thì message bị treo tới 120 giây mới được giao lại, nên phải đánh đổi giữa trùng lặp và độ trễ phục hồi.</li><li><strong>(d)</strong> Message quay lại khi hết visibility timeout, tức khoảng 30 giây sau lúc nhận, không phải ngay khi consumer chết — vì hàng đợi không biết consumer đã chết, nó chỉ biết chưa nhận được xác nhận xoá.</li></ul>"
  },
  "naive": "<p><strong>Cách tệ (làm theo phản xạ):</strong> thấy backlog không giảm thì thêm consumer, và để visibility timeout ở mức mặc định vì nó chạy được ở môi trường thử.</p><p>Cách này nghe hợp lý vì thêm consumer là thao tác một dòng, và số liệu thử nghiệm nhỏ cho thấy thông lượng tăng thật.</p><p>Nhưng khi tài nguyên phía sau đã kín, thêm consumer chỉ tăng số người rảnh — và mỗi người rảnh là một chỗ nữa có thể nhặt lại message đang bay. Backlog đứng yên, giao trùng tăng.</p>",
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
  "rootCause": "<p><strong>Chuỗi nhân quả, mỗi dòng một ý.</strong></p><ul><li>Thông lượng bằng số consumer chia thời gian một message, nên 6 consumer với 40 giây ra 0,15 message mỗi giây.</li><li>12 000 message chia 0,15 ra 80 000 giây, khoảng 22 giờ.</li><li>Visibility timeout 30 giây ngắn hơn 40 giây xử lý, nên message hiện lại trước khi được xoá.</li><li>Với lô 10, message cuối lô chỉ xong ở giây 400, nên khoảng ẩn phải phủ cả lô.</li><li>Consumer khác nhận lại message đang bay và làm lại từ đầu, nên tác dụng phụ xảy ra hai lần.</li><li>Tài nguyên phía sau chỉ nhận 6 việc song song, nên thêm consumer không tăng thông lượng.</li></ul>",
  "concept": "<p>Visibility timeout là khoảng thời gian message bị ẩn sau khi một consumer nhận; ngắn hơn thời gian xử lý thì message hiện lại và bị giao cho consumer khác, nên giao ít nhất một lần là mặc định.</p>",
  "mechanism": "<p><strong>Ví von đời thường:</strong> một quầy phát việc ở hội chợ. Bạn rút một xấp phiếu, mỗi phiếu là một việc. Quầy đánh dấu xấp đó là đang có người làm trong 30 giây. Sau 30 giây mà chưa trả phiếu kèm dấu xong, quầy coi như bạn bỏ đi và đưa phiếu cho người khác làm lại từ đầu.</p><p><em>Giới hạn của phép ví von:</em> quầy thật biết bạn còn đứng đó; hàng đợi chỉ biết đã nhận được lệnh xoá hay chưa.</p><pre><code>Hàng đợi:  [m1][m2][m3] ................ [m12000]\n\nConsumer 1 nhận lô 10  →  10 message bị ẨN 30 giây\n  giây 0    : bắt đầu m1\n  giây 30   : m1 hết hạn ẩn, CHƯA xoá  →  hiện lại\n  giây 40   : m1 mới xong ở consumer 1\n  giây 31   : consumer 2 (đang rảnh) nhận lại m1  ←  GIAO TRÙNG\n\nThông lượng = số consumer ÷ thời gian một message\n   6 ÷ 40 giây = 0,15 message/giây\n   12 000 ÷ 0,15 = 80 000 giây ≈ 22 giờ\n\nTrần phía sau: chỉ 6 suất xử lý song song\n   thêm consumer  →  thông lượng ĐỨNG YÊN, giao trùng TĂNG</code></pre><ol><li><strong>Bước 1 — Consumer hỏi, hàng đợi không đẩy:</strong> số việc đang làm cùng lúc bằng số consumer, không bằng số message trong hàng đợi.</li><li><strong>Bước 2 — Nhận message là ẩn nó, không phải xoá nó:</strong> message vẫn nằm trong hàng đợi nhưng không ai khác nhận được trong khoảng visibility timeout. Hết khoảng đó mà chưa xoá thì nó hiện lại.</li><li><strong>Bước 3 — Xoá phải dùng receipt handle của lần giao hiện tại:</strong> mỗi lần giao cấp một mã khác nhau, nên dùng mã cũ để xoá là xoá sai lần giao và message vẫn quay lại.</li><li><strong>Bước 4 — Thông lượng bằng số consumer chia thời gian một message, và tác dụng phụ phải chịu lặp:</strong> kích thước lô không đổi thông lượng, chỉ đổi số message bị ẩn cùng lúc. Vì mô hình là giao ít nhất một lần, mọi tác dụng phụ cần khoá chống lặp, và message hỏng nhiều lần phải có Dead-Letter Queue (hàng đợi chứa các message xử lý lỗi nhiều lần).</li></ol>",
  "failureModes": "<p>Ba niềm tin sai hay gặp.</p><ul><li><strong>\"Thêm consumer là hàng đợi nhanh hơn, kể cả khi đã thêm nhiều.\"</strong> Nghe hợp lý vì lần tăng đầu tiên có hiệu quả rõ. Điều đúng: thông lượng tỉ lệ với số consumer nhưng cũng tỉ lệ nghịch với thời gian mỗi message, nên nếu phần lớn thời gian nằm trong một lời gọi chậm thì thêm consumer chỉ nhân chi phí. Phản chứng: đo số message xử lý mỗi giây ở 2 và 6 consumer, thấy tăng đúng ba lần, rồi đo thời gian mỗi message và thấy nó không đổi.</li><li><strong>\"Message trong hàng đợi là message chưa ai nhận.\"</strong> Nghe hợp lý vì hàng đợi là nơi chứa việc còn tồn. Điều đúng: message đang được xử lý vẫn nằm trong hàng đợi, chỉ bị ẩn tạm, nên số message nhìn thấy không phải số việc còn phải làm. Phản chứng: khi một consumer đang xử lý, message vẫn hiện trong danh sách message của hàng đợi nhưng không nhận được.</li><li><strong>\"Xoá message sớm thì tránh được xử lý trùng.\"</strong> Nghe hợp lý vì message không còn thì không ai nhận lại. Điều đúng: xoá sớm biến lỗi tạm thời thành mất việc, và dead-letter queue không bao giờ nhận được message hỏng. Phản chứng: cho bước xử lý ném lỗi sau khi đã xoá, thấy message không quay lại và cũng không có bản ghi nào trong dead-letter queue.</li></ul>",
  "tradeoff": "<p><strong>Được gì:</strong> hàng đợi tách việc chậm ra khỏi đường trả lời người dùng, và cho bạn thử lại tự động khi worker chết. Consumer hỏng không làm mất việc.</p><p><strong>Mất gì:</strong> mọi tác dụng phụ phải idempotent, tức thêm một nơi lưu khoá và một lời gọi mạng cho mỗi message. Visibility timeout dài thì phục hồi chậm, ngắn thì giao trùng.</p><p><strong>Rủi ro:</strong> thêm consumer khi tài nguyên phía sau đã kín chỉ tăng giao trùng. Dead-Letter Queue không có người xem thì chỉ là nơi chôn việc.</p><p><strong>Vì sao vẫn đáng:</strong> không có hàng đợi, một worker chết là mất việc. Có hàng đợi, việc chỉ bị làm lại — và làm lại là bài toán bạn giải được bằng một khoá.</p>",
  "alternatives": "<p><strong>Khi nào KHÔNG nên dùng.</strong></p><ul><li>Đừng dùng hàng đợi khi người dùng đang chờ kết quả ngay; thêm một khớp chỉ làm chậm.</li><li>Đừng dùng hàng đợi khi thứ tự tuyệt đối là bắt buộc và bạn không kiểm soát được khoá phân vùng của hàng đợi FIFO.</li><li>Đừng dùng hàng đợi để thay việc tối ưu: nếu mỗi message mất 40 giây vì một truy vấn thiếu index, sửa truy vấn rẻ hơn nhân bản consumer.</li><li>Đừng đặt visibility timeout ngắn để phục hồi nhanh nếu thời gian xử lý cả lô dài; bạn đổi phục hồi nhanh lấy giao trùng.</li></ul>",
  "observe": "<p><strong>Đọc gì để biết đang trùng hay đang chậm.</strong></p><ul><li><strong>Số message nhìn thấy và số message đang được xử lý:</strong> hai con số này khác nhau; nếu số đang xử lý gần bằng số consumer nhân lô thì hệ thống đang bão hoà.</li><li><strong>Số lần nhận của từng message:</strong> lớn hơn một là dấu hiệu visibility timeout ngắn hơn thời gian xử lý, hoặc bước xử lý thất bại.</li><li><strong>Độ sâu dead-letter queue:</strong> nơi duy nhất thấy những message đã thử hết lượt; nếu nó luôn rỗng trong khi có lỗi, có thể message đang bị xoá quá sớm.</li><li><strong>Thời gian mỗi message:</strong> đo riêng phần xử lý và phần chờ; nếu phần chờ lớn thì thêm consumer không giúp gì.</li></ul>",
  "attacks": [
    {
      "q": "Vì sao message đã được nhận vẫn có thể bị xử lý hai lần?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Vì nhận message chỉ là ẩn nó, không phải xoá nó. Hết visibility timeout mà chưa có lệnh xoá thì message hiện lại cho consumer khác. Có hai nguồn trùng độc lập: khoảng ẩn ngắn hơn thời gian xử lý, và consumer chết sau khi đã làm xong nhưng trước khi kịp xoá. Cả hai đều nằm ngoài tầm kiểm soát của code, nên mô hình là giao ít nhất một lần. Vì vậy mọi tác dụng phụ phải idempotent.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói xoá message là xong. Cách nói đúng: xoá bằng receipt handle của lần giao hiện tại, và khoá chống lặp phải ghi trước tác dụng phụ.</p>"
    },
    {
      "q": "Thêm consumer có làm hàng đợi nhanh hơn không?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Chỉ khi tài nguyên phía sau còn suất trống. Thông lượng xấp xỉ số consumer chia thời gian một message, nên 6 consumer với 40 giây cho 0,15 message mỗi giây. Nhưng nếu mỗi message gọi một dịch vụ chỉ nhận 6 việc song song thì thông lượng bị chặn ở đúng 0,15, dù bạn có 60 consumer. Lúc đó thêm consumer chỉ tăng giao trùng. Cách biết: nhân đôi consumer rồi đo lại thông lượng.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> nói thêm consumer là tăng thông lượng tuyến tính mà không nêu điều kiện. Cách nói đúng: tuyến tính cho tới trần của tài nguyên phía sau.</p>"
    },
    {
      "q": "Visibility timeout nên đặt bao nhiêu?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Dài hơn thời gian xử lý cả lô, cộng một biên an toàn. Với lô 10 và 40 giây mỗi message, cả lô mất khoảng 400 giây, nên tôi đặt 600 giây chứ không phải 30. Nếu đặt ngắn hơn, message cuối lô hiện lại rất lâu trước khi được xoá, và bạn nhận giao trùng. Cái giá của khoảng ẩn dài là message của một consumer chết bị treo lâu hơn trước khi được giao lại.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> đặt theo thời gian của một message. Cách nói đúng: theo thời gian của cả lô, vì cả lô bị ẩn cùng lúc.</p>"
    },
    {
      "q": "Message luôn lỗi thì xử lý thế nào?",
      "a": "<p><strong>Trả lời mẫu (30–60 giây):</strong> Tôi cấu hình redrive policy với maxReceiveCount, để sau một số lần nhận thì message sang Dead-Letter Queue. Không có bước này, message lỗi quay vòng mãi và không ai thấy nó. Đồng thời tôi phân biệt lỗi tạm thời và lỗi vĩnh viễn: lỗi dữ liệu sai thì thử lại chỉ nhân tác dụng phụ, nên đẩy thẳng vào hàng đợi lỗi. Hàng đợi lỗi cần người xem và cần cảnh báo, nếu không nó chỉ là nơi chôn việc.</p><p><strong>Lỗi hay mắc khi trả lời:</strong> coi hàng đợi lỗi là giải pháp khử trùng. Cách nói đúng: nó chặn vòng lặp vô hạn; khử trùng là việc của khoá idempotency trong code.</p>"
    }
  ],
  "anchor": "Hàng đợi chỉ hứa giao ít nhất một lần, nên visibility timeout phải dài hơn thời gian xử lý và mọi tác dụng phụ phải chịu được lặp.",
  "say30": "Message bị ẩn trong khoảng visibility timeout sau khi một consumer nhận, và chỉ bị xoá khi consumer xác nhận xong việc. Nếu visibility timeout ngắn hơn thời gian xử lý thì message hiện lại và bị giao cho consumer khác, nên cùng một việc chạy hai lần. Thêm consumer chỉ tăng số việc song song, không làm mỗi việc nhanh hơn, nên backlog chỉ giảm theo số consumer và thời gian mỗi message.",
  "say90": "[Nêu vấn đề (30s)]: Kịch bản giả định: 12 000 message tồn, 2 consumer, lô 10 message, mỗi message 40 giây, visibility timeout 30 giây. Đội tăng lên 6 consumer mà backlog gần như không giảm, đồng thời số email xác nhận cao hơn số message thật khoảng một phần ba, với những message được hai consumer xử lý cách nhau khoảng 30 giây.\n\n[Cơ chế (45s)]: Consumer chủ động nhận theo lô; message vừa trả về bị ẩn trong khoảng visibility timeout và chỉ bị xoá khi có xác nhận. Vì 30 giây ngắn hơn 40 giây cần để xử lý, message hiện lại khi consumer đầu còn đang làm, và consumer khác nhận được nó. Thông lượng xấp xỉ số consumer nhân số message xử lý song song chia thời gian mỗi message, nên sáu consumer cho khoảng 1,5 message mỗi giây, cần hơn hai giờ cho 12 000 message. Redrive policy đặt số lần nhận tối đa rồi chuyển sang dead-letter queue.\n\n[Ranh giới (15s)]: Hàng đợi không hứa đúng một lần, nên code vẫn phải có khoá chống lặp; và tôi không xoá message trước khi xử lý, vì làm vậy biến lỗi tạm thời thành mất việc.",
  "body": "<p><strong>Chuyển sang một hệ thống khác cùng hình dạng.</strong> Giả sử bạn làm pipeline gửi hoá đơn qua email vào cuối ngày. Mỗi hoá đơn cần một file PDF, một dòng trong bảng công nợ, và một email.</p><p>Đây là chỗ hàng đợi có giá trị nhất: người dùng không chờ, và một lần lỗi mạng không được làm mất hoá đơn.</p><p>Nhưng cũng là chỗ dễ gửi trùng nhất. Câu hỏi đầu tiên không phải chọn hàng đợi nào, mà là: nếu message này được xử lý hai lần, khách có nhận hai email không?</p><p><strong>Ba tham số cần chốt trước khi chạy.</strong> Visibility timeout, tính từ thời gian xử lý cả lô cộng biên. MaxReceiveCount, tức bao nhiêu lần thì đẩy sang hàng đợi lỗi. Và số consumer, tính từ số suất thật của tài nguyên phía sau.</p><p>Nếu bạn chốt số consumer trước khi biết trần phía sau, bạn sẽ tăng nó khi backlog không giảm, và chỉ nhận thêm giao trùng.</p><p>Cuối cùng, đặt cảnh báo khi hàng đợi lỗi có message. Một hàng đợi lỗi không ai xem là một cách im lặng để mất việc.</p>",
  "code": "import json\nimport os\nimport time\n\nimport boto3\n\nsqs = boto3.client(\"sqs\")\nQUEUE = os.environ[\"QUEUE_URL\"]\nVISIBILITY = 120\n\n\ndef main():\n    while True:\n        resp = sqs.receive_message(\n            QueueUrl=QUEUE,\n            MaxNumberOfMessages=10,\n            WaitTimeSeconds=20,\n            VisibilityTimeout=VISIBILITY,\n        )\n        for m in resp.get(\"Messages\", []):\n            if already_done(m[\"MessageId\"]):\n                sqs.delete_message(QueueUrl=QUEUE, ReceiptHandle=m[\"ReceiptHandle\"])\n                continue\n            process(json.loads(m[\"Body\"]))\n            mark_done(m[\"MessageId\"])\n            sqs.delete_message(QueueUrl=QUEUE, ReceiptHandle=m[\"ReceiptHandle\"])",
  "codeNote": "<p><strong>Cách tệ:</strong> tăng consumer khi backlog không giảm, để visibility timeout ngắn hơn thời gian xử lý cả lô, và gửi email ở đầu hàm. <strong>Cách tốt:</strong> đặt khoảng ẩn phủ cả lô cộng biên an toàn, ghi khoá chống lặp trước tác dụng phụ, và chỉ thêm consumer khi tài nguyên phía sau còn suất.</p><p>Điểm cần thấy: <code>already_done(message_id)</code> kiểm khoá trước, <code>process(...)</code> là việc chính, <code>mark_done(message_id)</code> ghi khoá sau khi việc chính xong, và <code>delete_message</code> chỉ chạy sau đó. Xoá sớm để giảm giao trùng là đánh đổi sai: message mất mà việc chưa làm.</p>",
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
