var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'G27',
group: 'G',
topic: 'SNS, SQS, EventBridge: fan-out và chọn dịch vụ khi đơn hàng tạo xong',
prio: 'P0',
level: 'L2',
type: 'situation',
attacks: [
  { q: 'Nếu đã có SNS fan-out thì SQS còn cần thiết không, sao không gắn thẳng Lambda vào topic?', a: 'Cần, vì SQS là lớp đệm giữ tin cho đến khi bên nhận kéo về xử lý. Lambda đăng ký trực tiếp vào SNS thì việc thử lại do delivery policy của SNS quyết định, và hết lượt thử mà không có DLQ thì tin bị bỏ. Với SQS, tin nằm trong hàng đợi, consumer chậm chỉ làm đầy queue của chính nó. Mail, kho và analytics chạy với tốc độ và tỷ lệ lỗi khác nhau, nên mỗi bên một queue riêng là lựa chọn an toàn hơn.' },
  { q: 'Filter policy có thay thế được EventBridge rule không?', a: 'Chỉ một phần. Filter policy của SNS so khớp thuộc tính của tin hoặc nội dung body với điều kiện đã đặt, và không có policy thì nhận mọi tin. EventBridge rule khớp theo event pattern trên source, detail-type và các trường trong detail của sự kiện, rồi gửi tới tối đa năm target. Nếu chỉ chia một topic cho vài bên thì filter policy đủ. Nếu nguồn sự kiện nhiều, đích đa dạng, hoặc cần lưu trữ và phát lại sự kiện cũ, EventBridge phù hợp hơn.' }
],
incident: '<p>Tình huống giả định: Service tạo đơn gọi tuần tự ba hàm trong cùng một request: gửi mail, trừ kho, ghi analytics.</p><p><strong>Một buổi tối</strong> dịch vụ mail chậm, mỗi lần gọi mất hơn 30 giây. Request tạo đơn hết thời gian chờ dù đơn đã được ghi vào database, nên người dùng bấm đặt lại.</p><p><strong>Kết quả</strong> là hệ thống tạo hai đơn, kho bị trừ hai lần và analytics đếm đôi. Đội chỉ biết nguyên nhân khi đối chiếu log của cả ba bước.</p>',
askFirst: [
  'Khi một bên nhận lỗi, ai giữ tin và ai thử lại: SNS, SQS hay EventBridge?',
  'Vì sao handler đơn hàng không nên gọi trực tiếp ba dịch vụ phụ trong cùng request?'
],
predict: { q: 'Bạn đoán: queue analytics bị cấu hình quyền sai nên consumer không đọc được queue, tin nằm lại không được xử lý. Email và cập nhật kho có bị ảnh hưởng không, và bạn phát hiện sự cố bằng gì?', a: '<p><strong>Không.</strong> Mỗi bên có queue riêng, nên queue analytics tồn đọng không làm chậm queue mail hay queue kho. Hai bên vẫn nhận và xử lý tin của mình, thứ bị ảnh hưởng chỉ là dữ liệu analytics.</p><p><strong>Cách phát hiện sớm</strong> là đặt alarm trên CloudWatch với chỉ số ApproximateNumberOfMessagesVisible, tức số tin đang chờ trong queue đó. Nếu queue đã gắn DLQ thì đặt thêm alarm trên DLQ.</p>' },
anchor: 'Mỗi bên tiêu thụ một queue riêng nghĩa là một bên chậm hoặc lỗi chỉ làm tồn đọng queue của chính nó, không kéo các bên khác theo.',
q: 'Đơn hàng vừa tạo xong cần gửi mail, cập nhật kho và ghi analytics. Bạn dùng SNS, SQS hay EventBridge, và vì sao chọn cách đó thay vì cách còn lại?',
oral: 'SNS đẩy một tin tới nhiều bên, SQS giữ tin cho một bên kéo về xử lý, còn EventBridge định tuyến tin theo nội dung sự kiện. Với đơn hàng vừa tạo, tôi publish một sự kiện OrderCreated lên một SNS topic rồi đăng ký ba SQS queue cho mail, kho và analytics. Đây là fan-out, và mỗi queue có tốc độ và retry riêng, nên mail chậm không làm chậm kho, còn analytics lỗi không làm mất email. Bên kho vẫn phải xử lý lặp vẫn an toàn, vì SQS standard có thể giao trùng. Tôi chọn EventBridge khi nguồn sự kiện nhiều, cần lọc sâu theo nội dung, đi tới nhiều loại đích, hoặc cần lưu trữ để phát lại. Điều tôi tránh là gọi tuần tự ba dịch vụ trong một request tạo đơn, vì khi mail lỗi thì luồng đặt hàng cũng lỗi theo.',
deep: '<p><strong>Thuật ngữ cần biết:</strong></p><ul><li><strong>SNS (Amazon Simple Notification Service)</strong>: dịch vụ thông báo kiểu đẩy. Bạn gửi một tin vào topic và SNS đẩy bản sao tới mọi bên đăng ký. Ví dụ đời thường: loa phát thanh của tòa nhà, nói một lần là mọi phòng nghe.</li><li><strong>SQS (Amazon Simple Queue Service)</strong>: hàng đợi tin nhắn, tin nằm chờ tới khi một bên kéo về xử lý xong rồi xóa. Ví dụ đời thường: quầy làm thủ tục, khách xếp hàng và nhân viên gọi từng người.</li><li><strong>EventBridge (Amazon EventBridge)</strong>: bus sự kiện, trung tâm nhận sự kiện rồi gửi tới đích theo rule khớp mẫu sự kiện. Ví dụ đời thường: bưu điện phân loại thư theo địa chỉ và loại thư.</li><li><strong>Fan-out</strong>: một tin gửi đi, nhiều nơi nhận, mỗi nơi nhận một bản sao. Ví dụ đời thường: thông báo họp gửi vào nhóm chat, ai cũng thấy.</li><li><strong>DLQ (dead-letter queue)</strong>: nơi chứa tin đã thử lại nhiều lần vẫn lỗi, để người xem sau. Ví dụ đời thường: hộp thư không giao được của bưu điện.</li><li><strong>Idempotent</strong>: xử lý cùng một yêu cầu nhiều lần vẫn cho kết quả như chỉ làm một lần. Ví dụ đời thường: bấm thanh toán hai lần nhưng chỉ bị trừ tiền một lần.</li></ul><p><strong>Fan-out trong đơn hàng</strong> nghĩa là handler publish một sự kiện OrderCreated lên SNS topic, rồi SNS đẩy bản sao vào ba SQS queue. Mỗi queue là một bên nhận độc lập, có consumer, retry và DLQ riêng.</p><ul><li>Queue mail: gửi email xác nhận.</li><li>Queue kho: trừ tồn theo order_id.</li><li>Queue analytics: ghi số liệu.</li></ul><p><strong>Vì sao phải xử lý lặp vẫn an toàn?</strong> SQS standard có thể giao trùng cùng một message. Bên kho nên ghi nhận order_id bằng một thao tác có điều kiện trước khi trừ tồn, để lần giao thứ hai bị bỏ qua.</p>',
code: `import json
import boto3

sns = boto3.client("sns")
ORDER_TOPIC_ARN = "arn:aws:sns:ap-southeast-1:123456789012:order-created"

# ✅ Cách làm chuẩn: publish một lần lên topic, SNS tự đẩy bản sao cho từng queue đã đăng ký
def publish_order_created(order):
    sns.publish(
        TopicArn=ORDER_TOPIC_ARN,
        Message=json.dumps({"order_id": order["id"], "total": order["total"]}),
        MessageAttributes={
            "event_type": {"DataType": "String", "StringValue": "order.created"},
        },
    )

# Filter policy đặt trên subscription của queue kho:
# {"event_type": ["order.created"]}`,
expected: null,
followups: [
  { q: 'Khi nào SNS fan-out là đủ, và khi nào phải thêm EventBridge vào kiến trúc?', a: 'SNS cộng SQS là đủ khi chỉ có một nguồn, số bên nhận ít và cố định, và mỗi bên chỉ cần lọc theo vài thuộc tính đơn giản. Khi nguồn sự kiện tăng, sự kiện đa dạng cần định tuyến theo nội dung chi tiết, hoặc cần lưu trữ và phát lại để dựng lại trạng thái, EventBridge trở nên cần thiết. Hai dịch vụ không loại trừ nhau: một rule của EventBridge có thể có đích là một SNS topic hoặc một SQS queue, nên bạn vẫn giữ hàng đợi riêng cho từng bên ở cuối luồng.' },
  { q: 'Nếu analytics chậm và queue của nó đầy, ảnh hưởng gì tới email và cập nhật kho?', a: 'Không ảnh hưởng trực tiếp, vì mỗi bên có queue riêng và nơi phát tin không chờ bên nào. Queue analytics sẽ tồn đọng và số tin chờ tăng. Nếu đã gắn redrive thì tin vượt quá số lần nhận sẽ vào DLQ để xem xét. Việc cần làm là đặt alarm trên số tin nhìn thấy được của queue analytics, và kiểm tra bên xử lý có đủ nhanh không. Email và kho vẫn chạy bình thường trong lúc đó.' },
  { q: 'Làm sao đảm bảo kho chỉ bị trừ một lần khi SQS giao trùng message OrderCreated?', a: 'Bên xử lý kho phải xử lý lặp vẫn an toàn: dùng order_id làm khóa và ghi nhận nó bằng một thao tác nguyên tử, tức là không bị chia nhỏ, trước khi trừ tồn. Ví dụ là ghi có điều kiện vào DynamoDB hoặc ràng buộc unique trong database. Lần giao thứ hai gặp điều kiện không thỏa thì bỏ qua thay vì trừ thêm. Trùng lặp là chuyện bình thường của queue standard, không phải lỗi hiếm. Cách làm chi tiết và giới hạn của bộ nhớ trong Lambda đã nói ở G11, không lặp lại ở đây.' }
],
pitfalls: [
  'Coi SNS là hàng đợi có lưu trữ rồi bỏ queue trung gian; SNS chỉ thử lại trong giới hạn delivery policy rồi bỏ tin nếu không có DLQ',
  'Gọi tuần tự mail, kho và analytics trong cùng request tạo đơn, khiến một dịch vụ phụ lỗi làm hỏng luồng đặt hàng chính',
  'Rule có target tạo ra chính sự kiện khớp pattern của rule đó sẽ tự kích hoạt lặp vô hạn; cách sửa là pattern chỉ khớp trạng thái cần sửa'
],
selfcheck: [
  'Tôi vẫn chưa giải thích được vì sao SNS thử lại tới SQS 100.015 lần trong 23 ngày mà vẫn cần một queue riêng cho từng bên',
  'Tôi có thể giải thích bằng ví dụ queue analytics tồn đọng nhưng email và kho vẫn được xử lý vì mỗi bên có queue riêng',
  'Tôi có thể viết đoạn publish sự kiện OrderCreated kèm MessageAttributes và filter policy cho queue kho trong một buổi làm việc'
],
refs: ['aws-sns', 'aws-eventbridge', 'aws-sqs-visibility', 'aws-sqs-dlq'],
tradeoff: '<p><strong>SNS cộng SQS</strong> phù hợp fan-out đơn giản: mỗi bên có queue, retry và DLQ riêng. Đổi lại, mỗi bên mới là thêm queue và đăng ký để quản lý.</p><p><strong>EventBridge</strong> định tuyến tập trung theo event pattern. Muốn phát lại sự kiện cũ thì tạo archive trên bus rồi replay từ archive đó. Đổi lại, bạn phải hiểu pattern, quota và retry của bus.</p><p>Muốn tới SQS FIFO thì đi qua EventBridge, vì SNS topic chuẩn không gửi trực tiếp vào queue FIFO. Dù chọn cách nào, SQS standard có thể giao trùng và không đảm bảo thứ tự tuyệt đối, nên bên nhận phải xử lý lặp vẫn an toàn như đã nói ở G11.</p>',
alternatives: '<ul><li>Một SQS queue với một bên xử lý: gọn nhất khi chỉ có một bên.</li><li>Step Functions khi mail phải xong trước khi trừ kho, vì đó là chuỗi phụ thuộc chứ không phải fan-out.</li><li>EventBridge Pipes khi chỉ cần nối điểm với điểm.</li></ul>',
observe: '<p>Theo dõi ba chỗ: số tin đang chờ trong từng queue của bên nhận, metric ApproximateNumberOfMessagesVisible của DLQ để biết có tin bị bỏ, và log của handler có cùng order_id để đối chiếu giữa các bên.</p><p>Theo tài liệu SNS về dead-letter queue, đặt alarm trên ApproximateNumberOfMessagesVisible của DLQ với ngưỡng 1 hoặc giá trị phù hợp với lưu lượng DLQ. DLQ chỉ có khi đã gắn vào đăng ký.</p>',
say30: 'SNS đẩy một tin tới nhiều queue SQS, mỗi queue là một bên nhận có retry và DLQ riêng. EventBridge định tuyến theo mẫu sự kiện, hợp khi có nhiều nguồn hoặc cần lọc sâu và phát lại. Với đơn hàng, tôi chọn SNS với ba queue vì ba việc độc lập, và không gọi tuần tự ba dịch vụ trong request tạo đơn.',
say90: 'Khi đơn hàng tạo xong, tôi publish một sự kiện OrderCreated lên SNS topic và đăng ký ba SQS queue cho mail, kho và analytics. Ba việc này độc lập, mỗi bên có tốc độ, lỗi và retry riêng, nên mail chậm không làm chậm kho, và analytics lỗi không làm mất email. Filter policy đảm bảo mỗi queue chỉ nhận đúng loại tin. Tôi không gọi tuần tự ba dịch vụ trong request tạo đơn, vì khi một dịch vụ phụ lỗi thì người dùng thấy lỗi dù đơn đã ghi. Tôi chuyển sang EventBridge khi nguồn sự kiện nhiều, cần lọc sâu, định tuyến tới nhiều loại đích, hoặc cần phát lại. Bên kho vẫn phải xử lý lặp vẫn an toàn vì SQS standard có thể giao trùng, phần này đã nói ở G11.'
}
);
