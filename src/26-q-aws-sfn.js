var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "G28",
  "group": "G",
  "topic": "Step Functions: Standard hay Express, Retry/Catch theo state và khi nào là quá tay",
  "prio": "P1",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "Standard đã exactly-once rồi, sao vẫn cần idempotency?",
      "a": "Standard chỉ exactly-once khi bạn không khai báo Retry. Tài liệu AWS nói rõ điều này trong ASL, ngôn ngữ mô tả state machine. Khi một state được thử lại, tác vụ bên trong có thể đã chạy xong một lần rồi mới báo lỗi, nên lần thử lại ghi thêm một lần. Vì vậy bước trừ tiền vẫn cần khóa idempotency, ví dụ mã đơn gửi kèm mỗi lời gọi thanh toán, dù bạn dùng Standard."
    },
    {
      "q": "Express rẻ hơn nhiều, vì sao không dùng Express cho cả quy trình thanh toán?",
      "a": "Express không sai vì rẻ, mà vì nó không đủ cho thanh toán. Express chỉ chạy tối đa năm phút. Chế độ bất đồng bộ đảm bảo at-least-once, còn chế độ đồng bộ là at-most-once. Express không hỗ trợ .sync và .waitForTaskToken, nên không chờ được một tác vụ dài hay phản hồi từ bên thứ ba bằng task token. Nó cũng không tự lưu lịch sử, bạn phải bật CloudWatch Logs. Với thanh toán cần chờ xác nhận và biết chính xác bước nào đang dở, Express thiếu cả thời gian lẫn khả năng quan sát."
    }
  ],
  "incident": "<p>Tình huống giả định: Luồng đặt hàng gồm trừ tiền, giữ hàng và gửi mail, chạy bằng ba hàm Lambda gọi nhau trực tiếp.</p><p><strong>Lỗi xảy ra</strong> khi Lambda gửi mail hết thời gian chờ, sau khi khách đã bị trừ tiền và hàng đã được giữ. Lambda gọi nó chỉ ghi log lỗi rồi kết thúc, không ai được báo.</p><p><strong>Hai ngày sau</strong> khách gọi tổng đài hỏi vì sao chưa có email xác nhận. Đội mới biết đơn nằm kẹt giữa chừng, với tiền đã trừ và tồn kho đã giữ.</p>",
  "askFirst": [
    "Vì sao chuỗi Lambda gọi Lambda làm đơn bị kẹt mà không ai biết? → Giải mã: Lỗi giữa chừng không có ai ghi trạng thái, không có bước bồi hoàn; Step Functions Standard lưu từng bước nên đơn không kẹt âm thầm (Bài L21, Bài L22).",
    "Khi nào Standard đáng tiền hơn Express cho luồng thanh toán? → Giải mã: Standard khi cần biết bước nào đang dở, có Retry và Catch, chạy tối đa một năm; Express tối đa năm phút, không lưu lịch sử, chỉ hợp đoạn ngắn chạy lại được (Bài L22)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra nếu bước gửi mail có Retry với MaxAttempts bằng 3 nhưng không có Catch, và mail vẫn lỗi ở lần thử thứ tư?",
    "a": "<p><strong>Sau ba lần thử lại</strong>, lỗi trở thành lỗi cuối và execution chuyển sang trạng thái thất bại. MaxAttempts chỉ đếm số lần thử lại, nên tổng cộng có bốn lần chạy kể cả lần đầu.</p><p><strong>Vì không có Catch</strong>, không state nào xử lý lỗi nên execution dừng. Đơn đã trừ tiền và giữ hàng nhưng không có bước bồi hoàn. Trạng thái nằm lại để điều tra, và ExecutionsFailed tăng lên trong CloudWatch nếu bạn đã đặt alarm.</p>"
  },
  "anchor": "Retry chỉ thử lại đúng các lỗi trong ErrorEquals; khi hết số lần thử mà không có Catch, execution thất bại và không tự bồi hoàn bước nào đã chạy.",
  "q": "Quy trình thanh toán, giữ hàng rồi gửi mail xác nhận bị kẹt giữa chừng mà không ai biết. Bạn chọn Step Functions Standard hay Express, hay tự nối Lambda gọi Lambda hoặc chuỗi SQS, và khi nào Step Functions là quá tay?",
  "oral": "Với thanh toán, tôi chọn Step Functions Standard, vì bước trừ tiền không an toàn khi chạy trùng và cần biết bước nào đang dở. Standard chạy tối đa một năm, mỗi bước chạy đúng một lần, trừ khi khai báo Retry, và lưu lịch sử từng bước tới 90 ngày. Express chạy tối đa năm phút và không tự lưu lịch sử, nên chỉ hợp các đoạn ngắn chạy lại được an toàn. Tôi đặt TimeoutSeconds và Catch ở các bước gọi dịch vụ ngoài, để không treo và có bước hoàn tiền khi giữ hàng lỗi. Bước gửi mail có thể Retry nhiều hơn, nhưng cần khóa idempotency để không gửi hai email. Tôi cũng không dùng Step Functions cho mọi việc: hai bước đơn giản thì một hàm Lambda và một hàng đợi SQS có DLQ là đủ.",
  "deep": "<p><strong>Thuật ngữ cần biết:</strong></p><ul><li><strong>Step Functions</strong>: dịch vụ điều phối của AWS để chạy một quy trình nhiều bước theo đúng thứ tự, ví dụ đặt hàng gồm trừ tiền, giữ hàng rồi gửi mail. Dịch vụ ghi nhớ đang ở bước nào.</li><li><strong>State</strong>: một bước trong quy trình, ví dụ bước trừ tiền. Mỗi state được ghi lại là đã chạy xong, đang dở hay lỗi.</li><li><strong>Lambda</strong>: dịch vụ chạy một đoạn code khi có sự kiện, bạn không phải thuê máy chủ và chỉ trả tiền theo số lần chạy. Ví dụ: hàm gửi mail chạy mỗi khi có đơn mới.</li><li><strong>Exactly-once và at-least-once</strong>: exactly-once nghĩa là mỗi bước chạy đúng một lần; at-least-once nghĩa là chạy ít nhất một lần, nên có thể chạy trùng. Ví dụ: trừ tiền chạy trùng thì khách bị trừ hai lần.</li><li><strong>Retry và Catch</strong>: Retry là thử lại bước khi lỗi thoáng qua; Catch là bắt lỗi còn lại và chuyển sang bước khác, ví dụ hoàn tiền. Giống như gọi lại khi máy bận, rồi báo quản lý nếu vẫn không được.</li><li><strong>Idempotency</strong>: thao tác chạy nhiều lần vẫn cho kết quả như chạy một lần. Ví dụ: gửi kèm mã đơn để hệ thống nhận ra lần trùng và bỏ qua.</li><li><strong>CloudWatch</strong>: dịch vụ đo đạc và ghi nhật ký của AWS; bạn đặt alarm để được báo khi số lỗi tăng.</li><li><strong>SQS và DLQ</strong>: SQS là nơi xếp hàng tin nhắn chờ xử lý; DLQ chứa tin nhắn lỗi quá số lần cho phép, để xem sau.</li></ul><p><strong>Standard và Express</strong> khác nhau ở thời lượng, cách đảm bảo và lịch sử. Standard hợp quy trình dài, chờ người hoặc bên thứ ba, và cần biết bước nào đang dở. Express hợp khối lượng lớn, chạy ngắn, và chấp nhận tự lo log.</p><p><strong>Bẫy lớn nhất</strong> nằm ở Retry: khai báo Retry trên bước không idempotent thì bước đó có thể chạy lại, và tiền bị trừ thêm lần nữa.</p><ul><li>Bước trừ tiền: không Retry mù quáng, dùng khóa idempotency.</li><li>Bước giữ hàng: Retry có backoff, Catch chuyển sang hoàn tiền.</li><li>Bước gửi mail: Retry có giới hạn, khóa chống gửi trùng theo mã đơn.</li></ul><p>Lỗi không được bắt sẽ làm execution Failed và tăng ExecutionsFailed. Bước treo thì cần TimeoutSeconds, nếu không nó có thể chờ rất lâu.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L21, Bài L22.</p>",
  "code": "{\n  \"StartAt\": \"ChargePayment\",\n  \"States\": {\n    \"ChargePayment\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": { \"FunctionName\": \"charge-payment\", \"Payload.$\": \"$\" },\n      \"TimeoutSeconds\": 30,\n      \"ResultPath\": \"$.payment\",\n      \"Catch\": [ { \"ErrorEquals\": [\"States.ALL\"], \"ResultPath\": \"$.error\", \"Next\": \"AlertOps\" } ],\n      \"Next\": \"ReserveStock\"\n    },\n    \"ReserveStock\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": { \"FunctionName\": \"reserve-stock\", \"Payload.$\": \"$\" },\n      \"TimeoutSeconds\": 30,\n      \"Retry\": [ { \"ErrorEquals\": [\"Lambda.ServiceException\", \"Lambda.TooManyRequestsException\"], \"IntervalSeconds\": 2, \"MaxAttempts\": 3, \"BackoffRate\": 2.0 } ],\n      \"Catch\": [ { \"ErrorEquals\": [\"States.ALL\"], \"ResultPath\": \"$.error\", \"Next\": \"RefundPayment\" } ],\n      \"Next\": \"SendConfirmationEmail\"\n    },\n    \"SendConfirmationEmail\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": { \"FunctionName\": \"send-confirmation-email\", \"Payload.$\": \"$\" },\n      \"TimeoutSeconds\": 60,\n      \"Retry\": [ { \"ErrorEquals\": [\"Lambda.ServiceException\", \"States.Timeout\", \"Sandbox.Timedout\"], \"IntervalSeconds\": 5, \"MaxAttempts\": 5, \"BackoffRate\": 2.0, \"MaxDelaySeconds\": 60, \"JitterStrategy\": \"FULL\" } ],\n      \"Catch\": [ { \"ErrorEquals\": [\"States.ALL\"], \"ResultPath\": \"$.error\", \"Next\": \"AlertOps\" } ],\n      \"End\": true\n    },\n    \"RefundPayment\": { \"Type\": \"Task\", \"Resource\": \"arn:aws:states:::lambda:invoke\", \"Parameters\": { \"FunctionName\": \"refund-payment\", \"Payload.$\": \"$\" }, \"Next\": \"OrderFailed\" },\n    \"AlertOps\": { \"Type\": \"Task\", \"Resource\": \"arn:aws:states:::sns:publish\", \"Parameters\": { \"TopicArn\": \"arn:aws:sns:ap-southeast-1:123456789012:order-alerts\", \"Message.$\": \"States.JsonToString($.error)\" }, \"Next\": \"OrderFailed\" },\n    \"OrderFailed\": { \"Type\": \"Fail\" }\n  }\n}",
  "expected": null,
  "followups": [
    {
      "q": "Vì sao bước trừ tiền không nên được Retry mù quáng, kể cả khi dùng Standard?",
      "a": "Standard chỉ exactly-once khi bạn không khai báo Retry. Khi có Retry, một lần gọi trừ tiền có thể đã thành công phía hệ thống thanh toán dù state báo lỗi, và lần thử lại sẽ trừ thêm lần nữa. Cách làm đúng là gửi cùng một khóa idempotency ở mọi lần thử, với điều kiện hệ thống thanh toán hỗ trợ khóa đó, để lần trùng được nhận ra và không trừ hai lần."
    },
    {
      "q": "Khi nào nên đưa Express vào bên trong Standard?",
      "a": "Khi một đoạn quy trình chạy dưới năm phút, chạy lại được an toàn và số lần chạy lớn, ví dụ gửi mail hoặc cập nhật một bản ghi đọc được, thì có thể nằm trong một Express con do Standard cha gọi. Tài liệu AWS gợi ý kiểu lồng này để giảm chi phí, vì Express tính theo số lần chạy, thời lượng và bộ nhớ thay vì số lần chuyển trạng thái. Điều kiện là bước trong Express con không cần .sync hay .waitForTaskToken, vì Express không hỗ trợ hai mẫu đó, và bạn chấp nhận rằng lịch sử của Express con chỉ có trong CloudWatch Logs."
    },
    {
      "q": "Nếu email đã gửi xong nhưng bước đánh dấu hoàn tất không kịp ghi thì sao, và Step Functions giúp được gì?",
      "a": "Đây là trường hợp việc đã làm xong nhưng trạng thái bị thiếu. Standard lưu trạng thái giữa các state, nên bạn thấy đơn đang dừng ở đâu và biết bước nào cần làm lại. Nhưng Step Functions không biết email đã đi hay chưa, vì nó không nhìn vào hệ thống gửi mail. Vì vậy bạn cần khóa chống gửi trùng theo mã đơn, và bước đánh dấu phải chạy lại được. Nếu cần chờ xác nhận từ bên ngoài, dùng mẫu chờ token: .waitForTaskToken cho state dừng lại chờ một mã tạm được gửi về, kèm TimeoutSeconds để token không bao giờ quay lại làm execution treo tới giới hạn một năm của Standard. Chỉ đặt HeartbeatSeconds khi worker bên ngoài có gửi heartbeat."
    }
  ],
  "pitfalls": [
    "Coi Standard là an toàn tuyệt đối rồi quên rằng khai báo Retry làm một bước không idempotent có thể chạy lại.",
    "Chọn Express cho thanh toán vì rẻ và nhanh, rồi mới biết nó không có .waitForTaskToken, không tự lưu lịch sử và bị giới hạn năm phút.",
    "Không đặt TimeoutSeconds và không có Catch: bước treo có thể chờ tới giới hạn mặc định 99.999.999 giây, còn lỗi không được bắt làm execution Failed và tăng ExecutionsFailed, nên phải đặt alarm trên metric đó"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được vì sao Standard được gọi là exactly-once mà vẫn có thể chạy lại một bước khi khai báo Retry, và ranh giới đó nằm ở lần thử thứ mấy.",
    "Tôi có thể giải thích bằng ví dụ luồng đơn hàng: trừ tiền thành công, giữ hàng lỗi, và Catch chuyển sang hoàn tiền thay vì để đơn dở dang.",
    "Tôi có thể viết định nghĩa Standard cho luồng thanh toán có Retry, Catch, TimeoutSeconds và đặt alarm trên ExecutionsFailed cho nó."
  ],
  "tradeoff": "<p><strong>Chi phí:</strong> Standard tính tiền theo số lần chuyển trạng thái, và mỗi lần Retry cũng là một chuyển trạng thái, nên Retry dày đặc làm hóa đơn tăng. Express rẻ hơn ở khối lượng lớn.</p><p><strong>Đổi lại</strong> khi chọn Express: mất .sync và .waitForTaskToken, lịch sử không do dịch vụ lưu, và giới hạn năm phút.</p><p>Mỗi state machine cũng là thêm một IAM role, một định nghĩa và một chỗ để kiểm thử.</p>",
  "alternatives": "<ul><li>Lambda gọi Lambda: đơn giản nhất, nhưng lỗi giữa chừng phải tự ghi trạng thái và tự bồi hoàn. Đây chính là chỗ đơn kẹt mà không ai biết.</li><li>Chuỗi SQS: mỗi bước là một hàng đợi có DLQ cho lỗi, chi tiết ở G10, nhưng không có một nơi để xem toàn bộ luồng đang ở bước nào.</li><li>Express lồng trong Standard: giữ phần idempotent trong Express con, phần thanh toán trong Standard cha, theo gợi ý tối ưu chi phí của tài liệu AWS.</li></ul>",
  "observe": "<p>Đặt alarm trên ExecutionsFailed, ExecutionsTimedOut và ExecutionsAborted của state machine — ba metric CloudWatch đếm số lần chạy lỗi, hết giờ, bị hủy, được phát theo ARN của state machine.</p><p>Với execution đang mở quá lâu, xem danh sách execution đang Running bằng ListExecutions hoặc console và kiểm tra state nào đang dở. Lưu ý ExecutionsStarted được phát hai lần cho mỗi execution, nên đừng dùng nó để đếm đơn.</p><p>Tài liệu cũng nêu bạn có thể lắng nghe sự kiện TIMED_OUT của Standard qua EventBridge để kích hoạt xử lý.</p>",
  "say30": "Với thanh toán tôi dùng Step Functions Standard, vì Express chỉ chạy tối đa năm phút và không tự lưu lịch sử. Các bước gọi dịch vụ ngoài có TimeoutSeconds để không treo, và có Catch để chạy bước bồi hoàn. Bước trừ tiền không có Retry vì không idempotent. Tôi không nối Lambda gọi Lambda vì đơn sẽ kẹt mà không ai biết.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Với thanh toán tôi chọn Step Functions Standard, vì bước trừ tiền không idempotent và đội cần biết bước nào đang dở. Standard đảm bảo mỗi bước chạy đúng một lần, trừ khi khai báo Retry, và lưu lịch sử theo từng bước.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Vẫn phải có khóa idempotency, ví dụ gửi kèm mã đơn, vì Retry có thể làm bước chạy lại. Bước gọi dịch vụ ngoài có Catch để chạy bước bồi hoàn như hoàn tiền khi giữ hàng thất bại, và có TimeoutSeconds để không chờ mãi.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Bước gửi mail có thể thử lại nhiều hơn, nhưng vẫn cần khóa chống gửi trùng vì email đã gửi không thu lại được. Tôi đặt alarm trên ExecutionsFailed và ExecutionsTimedOut để biết ngay khi đơn kẹt. Tôi không dùng Step Functions cho mọi việc: hai bước đơn giản thì một hàm Lambda và một hàng đợi SQS có DLQ là đủ.",
  "refs": [
    "aws-step-functions",
    "aws-lambda-best",
    "aws-sqs-dlq",
    "aws-cloudwatch"
  ]
}
);
