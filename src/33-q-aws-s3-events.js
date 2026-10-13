var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'G26',
group: 'G',
topic: 'S3 event notification và CORS: upload từ Vue, at-least-once và vòng lặp vô hạn',
prio: 'P1',
level: 'L2',
type: 'situation',
attacks: [
  { q: 'Lỗi CORS đã sửa rồi, sao vẫn cần ExposeHeaders ETag?', a: 'Upload thành công không có nghĩa là code Vue đọc được mọi header của phản hồi. Trình duyệt chỉ cho JavaScript đọc các header mặc định an toàn, còn header khác phải được liệt kê trong ExposeHeaders (danh sách header mà JavaScript trong trình duyệt được phép đọc). ETag (mã định danh nội dung của object, thường dùng để đối chiếu sau khi upload) là header app hay cần. Nếu thiếu, response.headers.get("ETag") trả về null mà không có lỗi CORS nào hiện ra. Theo tài liệu S3, ExposeHeaders là cơ chế để ứng dụng trong trình duyệt truy cập header tương ứng. Theo đặc tả Fetch, trình duyệt mặc định chỉ cho JavaScript đọc Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified và Pragma; ETag không nằm trong danh sách này nên phải khai báo trong ExposeHeaders.' },
  { q: 'Thêm filter prefix uploads/ là đủ rồi, cần gì bucket thứ hai?', a: 'Filter prefix đủ trong đa số trường hợp, và tài liệu S3 nêu đúng hai cách tránh vòng lặp: dùng hai bucket, hoặc chỉ áp trigger cho tiền tố dùng cho object đến. Filter chỉ an toàn khi mọi nơi ghi thumbnail đều nằm ngoài tiền tố đó, và không ai về sau đặt thumbnail vào uploads/. Hai bucket an toàn hơn về cấu trúc, đổi lại phải quản lý thêm quyền và đường dẫn. Lớp phòng thủ thứ hai là kiểm tra key trong handler và bỏ qua key không thuộc uploads/. Lambda có phát hiện vòng lặp đệ quy (với hàm dùng SDK đủ mới; không phát hiện nếu DynamoDB nằm trong vòng lặp), nhưng chỉ dừng sau khoảng 16 lần gọi trong một chuỗi, nên không nên dựa vào nó để kiểm soát chi phí.' }
],
incident: '<p>Tình huống giả định: Trang Vue chạy ở app.example.vn (qua HTTPS) gọi PUT thẳng tới bucket ảnh bằng presigned URL. Trình duyệt chặn vì bucket chưa có CORS. Đội thêm cấu hình CORS cho PUT, upload chạy được. Nhưng bucket đã có event notification ObjectCreated gọi Lambda cho mọi object, không có filter prefix. Lambda tạo thumbnail rồi ghi vào cùng bucket, mỗi thumbnail lại kích hoạt Lambda thêm một lượt. Sau vài giờ số lần gọi tăng vọt và hóa đơn Lambda tăng mạnh.</p>',
askFirst: [
  'Lỗi CORS xuất hiện ở bước nào của trình duyệt, và bạn kiểm tra những mục nào của bucket trước?',
  'Thumbnail ghi về cùng bucket thì điều gì xảy ra mỗi lần ghi, và cách nào chặn vòng lặp mà không phụ thuộc vào Lambda tự dừng?'
],
predict: { q: 'Bạn đoán: trigger có filter prefix uploads/, thumbnail ghi vào thumbs/ có kích hoạt lại Lambda không? Nếu code sau này ghi thumbnail vào uploads/thumbs/ thì sao?', a: '<p>Không kích hoạt lại. Filter prefix khớp theo key, thumbs/ không bắt đầu bằng uploads/ nên S3 không gửi event. Nhưng nếu thumbnail ghi vào uploads/thumbs/ thì key vẫn bắt đầu bằng uploads/, filter khớp và vòng lặp quay lại. Dấu hiệu là số lần gọi Lambda tăng liên tục và log lặp lại cùng một key gốc với tiền tố lồng nhau. Cách kiểm chứng là in key trong log của handler và đối chiếu.</p>' },
anchor: 'Filter theo prefix chỉ an toàn khi nơi ghi ra nằm ngoài prefix đầu vào. Nếu không, vòng lặp vẫn quay lại dù trigger đã có điều kiện.',
q: 'Upload ảnh từ Vue lên bucket S3 bằng presigned PUT bị lỗi CORS. Sau khi sửa, Lambda tạo thumbnail ghi lại vào cùng bucket và hóa đơn tăng vọt. Bạn xử lý lỗi CORS và phòng vòng lặp như thế nào?',
oral: 'Khi upload từ Vue lên S3 (kho lưu object của AWS) bằng presigned PUT (URL có chữ ký cho phép ghi tạm thời) bị lỗi CORS (cơ chế trình duyệt chặn gọi sang origin khác nếu server không cho phép), tôi kiểm rule CORS của bucket trước. AllowedOrigins phải khớp đúng scheme, host và port của trang Vue. AllowedMethods phải có PUT. AllowedHeaders phải có Content-Type nếu trình duyệt gửi header đó. ExposeHeaders phải có ETag để code đọc được. Trình duyệt gửi preflight (yêu cầu OPTIONS dò trước) khi có PUT, nên thiếu một mục là lỗi ngay ở bước này. Sau khi sửa, tôi xem event notification ObjectCreated. Sự kiện này được giao ít nhất một lần, có thể trùng và không đảm bảo đúng thứ tự, nên handler phải idempotent (xử lý lặp vẫn an toàn). Nếu cần so thứ tự thì dùng sequencer (chuỗi hex, chỉ so được trên cùng một key). Vòng lặp là vấn đề thứ ba: Lambda (hàm code chạy theo sự kiện) ghi thumbnail vào cùng bucket mà trigger không có filter, nên mỗi thumbnail lại gọi Lambda. Tôi giới hạn trigger bằng prefix uploads/, ghi thumbnail sang thumbs/, và kiểm key trong handler. Lambda có phát hiện vòng lặp đệ quy nhưng chỉ dừng sau khoảng 16 lần, nên tôi vẫn đặt alarm và đặt concurrency về 0 để chặn ngay nếu cần.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>S3 (Amazon Simple Storage Service, kho lưu object của AWS)</strong>: lưu file theo key trong bucket (thùng chứa). Ví dụ đời thường: tủ hồ sơ có nhiều ngăn, mỗi hồ sơ có nhãn riêng.</li><li><strong>Event notification (thông báo sự kiện của S3)</strong>: S3 gửi tin khi có thao tác như ObjectCreated tới Lambda, SQS, SNS hoặc EventBridge. Ví dụ đời thường: chuông cửa kêu khi có người bấm, nhưng người bấm có thể bấm nhiều lần.</li><li><strong>CORS (Cross-Origin Resource Sharing, chia sẻ tài nguyên giữa các origin)</strong>: trình duyệt chặn JavaScript gọi sang origin khác nếu server không cho phép. Ví dụ so với Django: giống cấu hình django-cors-headers, chỉ khác là cấu hình nằm ở bucket chứ không nằm trong app.</li><li><strong>Presigned PUT (URL có chữ ký để ghi tạm thời)</strong>: link cho phép ghi một object trong thời gian giới hạn mà không cần thông tin đăng nhập AWS. Đây chỉ là khái niệm; cách ký đã thuộc G06 nên không lặp lại.</li><li><strong>Sequencer (chuỗi thứ tự)</strong>: chuỗi hex trong event, so được thứ tự các sự kiện trên cùng một key. Ví dụ: như số phiên bản của một hồ sơ, chỉ so trong hồ sơ đó.</li><li><strong>Vòng lặp đệ quy (recursive loop)</strong>: Lambda ghi lại vào nguồn đã kích hoạt nó, tạo chuỗi gọi không dứt. Ví dụ đời thường: container Docker tự restart liên tục vì chính nó gây lỗi, mỗi lần đều tốn tài nguyên.</li><li><strong>Reserved concurrency (trần số lần chạy đồng thời của một hàm)</strong>: đặt bằng 0 thì mọi lần gọi bị chặn.</li><li><strong>Idempotent (xử lý lặp vẫn an toàn)</strong>: xử lý cùng một tin nhiều lần cho kết quả như một lần. Ví dụ: upsert trong Postgres theo cùng khóa.</li></ul><p><strong>Cơ chế.</strong> S3 gửi event ObjectCreated tới đích đã cấu hình. Đích có thể là Lambda, SQS Standard, SNS Standard hoặc EventBridge; SQS FIFO và SNS FIFO không dùng trực tiếp làm đích được (muốn tới SQS FIFO thì đi qua EventBridge). Mỗi event là JSON có key, size, eTag, versionId (nếu bật versioning) và sequencer. Key bị URL-encode, ví dụ dấu cách thành dấu cộng. Tài liệu S3 ghi event được giao ít nhất một lần, thường trong vài giây nhưng đôi khi lâu hơn một phút, không đảm bảo đúng thứ tự, và thỉnh thoảng trùng do cơ chế thử lại.</p><p><strong>CORS.</strong> Với PUT từ trình duyệt, trình duyệt gửi OPTIONS trước để hỏi. S3 dùng rule đầu tiên khớp, với ba điều kiện: Origin phải thuộc AllowedOrigins, method trong Access-Control-Request-Method phải thuộc AllowedMethods, và các header trong Access-Control-Request-Headers phải thuộc AllowedHeaders. Lỗi 403 "This CORS request is not allowed" nghĩa là một trong ba điều kiện không khớp. Lỗi "CORS is not enabled for this bucket" nghĩa là bucket chưa có cấu hình. ExposeHeaders quyết định JavaScript đọc được header nào của response. Thiếu nó thì header trả về null mà không báo lỗi.</p><p><strong>Vòng lặp.</strong> Tài liệu S3 cảnh báo: nếu thông báo ghi lại chính bucket kích hoạt nó thì có thể tạo vòng lặp. Lambda phát hiện một số vòng lặp có S3, SQS, SNS, EventBridge custom bus và các hàm Lambda gọi nhau, rồi dừng khoảng 16 lần trong một chuỗi gọi. Tính năng này bật mặc định, nhưng hàm phải dùng SDK đủ mới, ví dụ boto3 từ 1.24.46. Nếu DynamoDB nằm trong vòng lặp thì không được phát hiện. Các lần chạy trước khi dừng vẫn tính tiền, nên đây là lớp phòng thủ chứ không thay thế thiết kế.</p><p><strong>Khi nào dùng và khi nào không.</strong> Event notification phù hợp với phản ứng đơn giản khi có object mới. Không nên đặt việc nặng hoặc bước phụ thuộc thứ tự vào handler mà thiếu idempotency. Không nên ghi về prefix đã kích hoạt trigger.</p><p><strong>Cách làm khi có sự cố.</strong> Đặt reserved concurrency của hàm bằng 0 để chặn mọi lần gọi, tắt hoặc sửa trigger, rồi mới sửa code ghi ngược lại bucket.</p>',
code: `import boto3
from urllib.parse import unquote_plus

BUCKET = "app-uploads-prod"
s3 = boto3.client("s3", region_name="ap-southeast-1")

# 1. CORS: cho trang Vue PUT bằng presigned URL
s3.put_bucket_cors(
    Bucket=BUCKET,
    CORSConfiguration={
        "CORSRules": [
            {
                "AllowedOrigins": ["https://<origin-trang-vue>"],  # ví dụ app.example.vn, khớp đúng scheme, host, port
                "AllowedMethods": ["PUT"],
                "AllowedHeaders": ["Content-Type"],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3000,
            }
        ]
    },
)

# 2. Cho S3 quyền gọi Lambda (thiếu bước này, lệnh cấu hình notification bị từ chối)
lam = boto3.client("lambda", region_name="ap-southeast-1")
lam.add_permission(
    FunctionName="make-thumb",
    StatementId="s3-uploads-invoke",
    Action="lambda:InvokeFunction",
    Principal="s3.amazonaws.com",
    SourceArn=f"arn:aws:s3:::{BUCKET}",
    SourceAccount="123456789012",
)

# 3. Event notification: chỉ kích hoạt cho tiền tố uploads/
# Lệnh này THAY THẾ toàn bộ cấu hình notification cũ của bucket
s3.put_bucket_notification_configuration(
    Bucket=BUCKET,
    NotificationConfiguration={
        "LambdaFunctionConfigurations": [
            {
                "Id": "thumb-on-upload",
                "LambdaFunctionArn": "arn:aws:lambda:ap-southeast-1:123456789012:function:make-thumb",
                "Events": ["s3:ObjectCreated:*"],
                "Filter": {
                    "Key": {"FilterRules": [{"Name": "prefix", "Value": "uploads/"}]}
                },
            }
        ]
    },
)

# 4. Handler: lớp phòng thủ thứ hai, bỏ qua key ngoài uploads/
def handler(event, context):
    for rec in event["Records"]:
        key = unquote_plus(rec["s3"]["object"]["key"])  # S3 gửi key URL-encode (dấu cách thành +), giải mã trước khi dùng
        if not key.startswith("uploads/"):
            continue
        thumb_key = "thumbs/" + key[len("uploads/"):]
        # tải object gốc, tạo thumbnail, ghi vào thumb_key trong cùng bucket
`,
expected: null,
followups: [
  { q: 'Nếu chuyển thumbnail sang bucket thứ hai thì phía Vue và quyền của Lambda thay đổi thế nào?', a: 'Phía Vue hầu như không đổi, vì Vue chỉ upload vào bucket upload rồi đọc ảnh qua URL đã cấu hình. Lambda cần quyền đọc bucket upload và quyền ghi bucket thumbnail trong vai trò IAM (bộ quyền của Lambda). Nên tách hai statement và giới hạn resource cụ thể cho từng bucket. Đổi lại, bạn phải theo dõi thêm một bucket và trả thêm chi phí lưu trữ. Với thumbnail có thể tái tạo từ ảnh gốc, cách hai bucket loại bỏ hoàn toàn khả năng kích hoạt lại, nên nhiều đội chọn cách này.' },
  { q: 'Nếu cần đảm bảo không tạo thumbnail trùng khi event được giao hai lần, bạn làm gì trong handler?', a: 'Dùng key của object, kèm versionId nếu bucket bật versioning, làm khóa idempotent. Ghi nhận khóa đó bằng một thao tác nguyên tử trước khi tạo thumbnail, ví dụ ghi có điều kiện vào DynamoDB hoặc ràng buộc unique trong Postgres. Nếu khóa đã tồn tại thì bỏ qua. Sequencer chỉ có ý nghĩa khi so trên cùng một key, nên không dùng nó để so giữa các object khác nhau. Ghi đè thumbnail bằng cùng nội dung thì an toàn, nhưng ghi thêm bản sao trên mỗi lần giao trùng sẽ làm tốn chi phí.' },
  { q: 'Làm sao biết vòng lặp đang chạy trước khi hóa đơn tăng nhiều?', a: 'Đặt alarm CloudWatch trên số lần gọi (invocations) của Lambda và trên metric RecursiveInvocationsDropped, metric này đếm số lần Lambda đã chặn vì vòng lặp đệ quy. Thêm billing alarm (cảnh báo theo ngưỡng chi phí). AWS Cost Anomaly Detection cũng có thể bắt bất thường, nhưng nó dựa trên dữ liệu Cost Explorer nên có thể mất tới 24 giờ mới phát hiện, vì vậy không đủ nhanh để làm lớp chặn đầu tiên. Khi cảnh báo nổ, hành động đầu tiên là đặt reserved concurrency về 0 để chặn mọi lần gọi, sau đó mới sửa trigger và code.' }
],
pitfalls: [
  'Nghĩ lỗi CORS là do code Vue, trong khi thực tế thiếu AllowedOrigins, AllowedMethods hoặc AllowedHeaders trên bucket (thiếu ExposeHeaders không gây lỗi CORS, chỉ khiến JavaScript không đọc được header đó)',
  'Coi event ObjectCreated là đúng một lần và đúng thứ tự, nên handler không idempotent và so thứ tự bằng thời gian nhận thay vì sequencer',
  'Thêm filter prefix nhưng vẫn ghi thumbnail vào tiền tố khớp filter, hoặc tin rằng Lambda tự chặn vòng lặp nên không đặt alarm'
],
selfcheck: [
  'Tôi vẫn chưa giải thích được vì sao PUT cần preflight OPTIONS còn GET đơn giản thì không, và thiếu ExposeHeaders ETag thì lỗi biểu hiện ra sao trong code Vue',
  'Tôi có thể giải thích bằng ví dụ: thumbnail ghi vào thumbs/ không khớp filter uploads/ nên không kích hoạt lại, còn ghi vào uploads/thumbs/ thì vòng lặp quay lại',
  'Tôi có thể viết cấu hình put_bucket_cors có ExposeHeaders ETag và trigger có filter prefix uploads/ trong một buổi, rồi đặt alarm trên RecursiveInvocationsDropped'
],
refs: ['aws-s3-events', 'aws-s3-cors', 'aws-s3', 'aws-lambda-best', 'aws-lambda-permissions', 'aws-eventbridge', 'aws-lambda-recursion', 'aws-s3-event-structure', 'aws-s3-event-destinations', 'aws-s3-put-notification', 'aws-s3-cors-troubleshoot', 'aws-cost-anomaly'],
tradeoff: '<p>Filter theo prefix trên event notification rẻ và đơn giản, nhưng chỉ an toàn khi mọi thứ ghi ra nằm ngoài prefix đầu vào, nên phải kỷ luật đặt tên key. Hai bucket loại bỏ rủi ro vòng lặp về mặt cấu trúc, đổi lại thêm bucket, quyền IAM và chi phí quản lý. AllowedOrigins bằng "*" dễ test nhưng mở cho mọi trang gọi bucket, nên chỉ dùng khi thật sự cần.</p>',
alternatives: '<ul><li>EventBridge với rule lọc theo bucket và prefix, khi cần nhiều đích hoặc phát lại sự kiện. Vẫn phải tránh vòng lặp như trên.</li><li>Tạo thumbnail ngay trong API Python khi upload xong, khi số ảnh ít. Cách này tránh hẳn vòng lặp, đổi lại API chịu thêm tải và thời gian chờ.</li><li>Step Functions khi thumbnail là chuỗi bước cần thử lại có kiểm soát.</li></ul>',
observe: '<p>Theo dõi số lần gọi (invocations) và thời lượng của Lambda trên CloudWatch, cùng metric RecursiveInvocationsDropped để biết Lambda đã chặn vòng lặp. Thêm billing alarm cho chi phí. Trong log của handler, in key và request ID để đối chiếu từng lượt gọi.</p>',
say30: 'Upload từ Vue lỗi CORS thì tôi kiểm rule của bucket: origin, PUT, Content-Type và ExposeHeaders ETag. Event ObjectCreated được giao ít nhất một lần và có thể trùng, nên handler phải idempotent. Vòng lặp xảy ra khi Lambda ghi thumbnail vào prefix đầu vào. Tôi đặt filter uploads/, ghi sang thumbs/, và đặt alarm.',
say90: 'Khi upload từ Vue lỗi CORS, tôi kiểm rule của bucket trước: AllowedOrigins khớp đúng origin của trang, AllowedMethods có PUT, AllowedHeaders có Content-Type, và ExposeHeaders có ETag để code đọc được. Sau khi sửa, tôi coi event ObjectCreated là giao ít nhất một lần, có thể trùng và không đúng thứ tự, nên handler phải idempotent và dùng sequencer chỉ khi so trên cùng một key. Vòng lặp là lỗi thiết kế: thumbnail ghi vào cùng prefix kích hoạt lại chính Lambda. Tôi sửa bằng filter prefix uploads/, ghi thumbnail sang thumbs/, kiểm key trong handler, và đặt alarm cùng reserved concurrency về 0 làm nút cắt khẩn cấp. Lambda có phát hiện vòng lặp, nhưng nó chỉ dừng sau khoảng 16 lần nên không thay thế được thiết kế đúng.'
}
);
