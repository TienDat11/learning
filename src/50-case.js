/* CASE_STUDY — hệ thống quản lý tài liệu đầu-cuối trên AWS.
   Mỗi section mang id (bắt buộc, unique), h (tiêu đề hiển thị) và title (nhãn đầy đủ),
   body là HTML chỉ dùng <p> <ul> <ol> <li> <strong> <em> <code> <br>, và flow trỏ tới
   một id trong FLOW_SVGS. */
var CASE_STUDY = CASE_STUDY || {};
CASE_STUDY.title = 'DocuHub: ứng dụng quản lý tài liệu trên AWS';
CASE_STUDY.pitch = 'DocuHub là ứng dụng quản lý tài liệu chạy đầu-cuối trên AWS. Frontend là SPA Vue 3 đóng gói bằng Vite, phục vụ từ S3 qua CloudFront; backend là FastAPI đóng gói bằng Docker, chạy trên ECS Fargate phía sau API Gateway; dữ liệu nằm ở RDS PostgreSQL có read replica; tệp nằm ở S3 và client tải thẳng lên bằng presigned URL nên API không bao giờ nâng byte tệp; xác thực bằng JWT qua authorizer của API Gateway và kiểm tra sở hữu ở tầng ứng dụng; việc nặng như trích xuất văn bản, tạo thumbnail và sinh bản tóm tắt đẩy vào SQS để worker xử lý ngoài luồng, dùng transactional outbox để không mất message. Mọi endpoint ghi chống trùng bằng Idempotency-Key, lỗi tạm retry theo exponential backoff rồi rơi vào DLQ. Pipeline GitHub Actions chạy test, build image đa tầng, đẩy ECR và triển khai ECS bằng task definition mới; CloudWatch thu thập log, metric, alarm và dashboard theo service. Bảy mục dưới đây đi từ kiến trúc tổng thể tới từng tình huống sự cố cụ thể: upload hỏng, request trùng, visibility timeout, worker chết giữa chừng, lệch dữ liệu với hàng đợi, truy cập chéo, truy vấn chậm, deploy sai, retry, chọn Lambda hay container, mức cô lập transaction, và CORS. Mỗi mục nêu failure mode, cơ chế, cách sửa và cái giá phải trả.'
CASE_STUDY.sections = [
  {
    id: 'cs-01',
    h: 'Kiến trúc tổng thể',
    title: 'Kiến trúc tổng thể của ứng dụng quản lý tài liệu',
    flow: 'flow-request-lifecycle',
    body:
      '<p><strong>Bối cảnh.</strong> DocuHub là ứng dụng quản lý tài liệu: người dùng đăng nhập, tạo thư mục, tải lên PDF và DOCX, gán quyền theo vai trò, xem lịch sử phiên bản. Frontend là SPA Vue 3 do chính đội dự án viết, đóng gói bằng Vite; backend là FastAPI chạy trong container trên ECS Fargate; dữ liệu nằm ở RDS PostgreSQL; tệp nằm ở S3; việc trích xuất nội dung và tạo thumbnail chạy ngoài luồng qua SQS và worker.</p>' +
      '<p><strong>Failure mode điển hình.</strong> Khi mọi thứ gắn với một request đồng bộ, hệ thống sập theo dây chuyền: một tệp 300 MB chặn luồng xử lý, một truy vấn N+1 giữ connection của PostgreSQL, và cả trang danh sách tài liệu của toàn bộ công ty ngừng hiển thị. Đồng thời, nếu frontend và API khác origin mà cấu hình CORS sai, mọi request đều chết ngay ở tầng trình duyệt trước khi tới server, và log phía server trống trơn. Đây là loại sự cố gây mất thời gian dò tìm nhất.</p>' +
      '<p><strong>Cơ chế vòng đời request.</strong></p><ol>' +
      '<li>Trình duyệt mở kết nối tới CloudFront, lớp CDN phục vụ bản build của SPA và các tệp tĩnh có content-hash trong tên.</li>' +
      '<li>CloudFront chuyển tiếp đường dẫn <code>/api</code> tới API Gateway, nơi khai báo authorizer JWT và quota theo phương thức.</li>' +
      '<li>API Gateway gọi service Python chạy trên ECS Fargate qua service discovery của Cloud Map.</li>' +
      '<li>FastAPI xác thực token trong middleware, mượn một connection từ connection pool, chạy SQL, trả JSON rồi trả connection về pool.</li>' +
      '<li>Phản hồi đi ngược lại cùng đường và được CloudFront cache lại nếu đúng cache-control.</li>' +
      '</ol>' +
      '<p><strong>Cách sửa.</strong> Tách bạch ba loại tải. Tệp nằm ở S3 và client đi thẳng lên S3 bằng presigned URL nên đường chính không mang byte. Việc nặng như render thumbnail, trích xuất văn bản, sinh bản tóm tắt đẩy vào SQS để worker gánh, với giới hạn số tác vụ đồng thời. Dữ liệu tra cứu nằm ở PostgreSQL có read replica cho các báo cáo chỉ đọc. Mọi request đo bằng middleware ghi thời gian theo route để tìm nút cổ chai khi p95 tăng.</p>' +
      '<p><strong>Tradeoff.</strong> Kiến trúc phân tán thêm một chặng độ trễ và tăng số thành phần phải vận hành: CloudFront, API Gateway, ECS, RDS, S3, SQS, worker, tất cả đều có cấu hình riêng và đều có thể hỏng. Đổi lại hệ thống chịu lỗi tốt hơn, deploy được từng phần, và việc nặng không kéo sập đường chính. Nếu lưu lượng nhỏ và việc nặng không nhiều, chạy chung worker trong cùng một task ECS có thể rẻ hơn và ít vận hành hơn so với tách service riêng.</p>'
  },
  {
    id: 'cs-02',
    h: 'Happy path: upload tài liệu',
    title: 'Happy path: upload tài liệu qua presigned URL',
    flow: 'flow-upload-presign',
    body:
      '<p><strong>Failure mode.</strong> Nếu backend nhận toàn bộ tệp qua HTTP POST rồi chuyển tiếp sang S3, mỗi tệp 200 MB chiếm một connection của API và một phần băng thông khỏa nghẽn. Mười người upload đồng thời sẽ làm hàng đợi request dài dòng, một tệp hỏng giữa đường tiêu tốn hết băng thông mà không tạo ra gì, và API phải giữ file tạm trên ổ đĩa container vốn không giữ dữ liệu vĩnh viễn.</p>' +
      '<p><strong>Cơ chế presigned URL.</strong></p><ol>' +
      '<li>Client gọi <code>POST /api/documents/presign</code> kèm tên tệp, kích thước và MIME type.</li>' +
      '<li>API kiểm tra MIME nằm trong allowlist, kiểm tra kích thước dưới trần, kiểm tra quota theo gói của người dùng, rồi sinh object key có tiền tố theo tenant để tránh đụng tên chéo.</li>' +
      '<li>API trả về URL đã ký cho phép đúng phương thức <code>PUT</code>, có thời hạn 15 phút, kèm các header bắt buộc phải khớp.</li>' +
      '<li>Browser đưa tệp thẳng lên S3 bằng thư viện HTTP của trình duyệt, có thanh tiến trình và hỗ trợ multipart upload nếu tệp rất lớn.</li>' +
      '<li>Client gọi <code>POST /api/documents</code> với object key, kích thước và checksum; API ghi bản ghi vào PostgreSQL rồi đẩy job hậu xử lý vào hàng đợi.</li>' +
      '</ol>' +
      '<p><strong>Vì sao phải tách bước cuối.</strong> Bước ghi bản ghi mới là nơi ta kiểm tra sở hữu và cấp quyền đọc. Nếu chỉ tin vào lời client báo đã upload xong, kẻ xấu có thể khai một object key không tồn tại, hoặc của người khác, và tạo bản ghi chỗ trống trong hệ thống. Ta còn xác minh checksum do S3 trả về khớp với checksum client khai báo, để chặn tệp bị hỏng giữa đường.</p>' +
      '<p><strong>Tradeoff.</strong> Ta mất khả năng theo dõi tiến trình tải phía server và phải tự dọn các object rác bằng job quét theo lịch. Đổi lại API không bao giờ chạm vào byte của tệp, nên chi phí băng thông và CPU của backend gần như bằng không, và nó co giãn được khi số người dùng tăng gấp mười lần chỉ bằng cách tăng hạn mức của S3.</p>'
  },
  {
    id: 'cs-03',
    h: 'Upload lỗi: quá lớn, sai loại, URL hết hạn',
    title: 'Upload lỗi: tệp quá lớn, sai loại tệp, presigned URL hết hạn',
    body:
      '<p><strong>Ba failure mode thường gặp ở bước upload.</strong></p><ul>' +
      '<li><strong>Tệp quá lớn.</strong> Client chỉ kiểm tra kích thước sau khi đã tải hết, còn S3 chặn ở mức dung lượng của bucket. Người dùng tưởng treo mạng trong khi đã tốn hết băng thông và không có gì được lưu.</li>' +
      '<li><strong>Sai loại tệp.</strong> Chỉ kiểm tra phần mở rội là không đủ, vì tên tệp nằm hoàn toàn trong tay client. Một tệp thực thi được đổi tên thành <code>.pdf</code> vẫn lọt nếu không kiểm tra nội dung, và sau đó được tải xuống rồi mở bởi trình duyệt là một đường tấn công.</li>' +
      '<li><strong>Presigned URL hết hạn.</strong> Người dùng chọn tệp lớn, tab bị treo hoặc mất mạng, quay lại thì URL đã quá 15 phút và nhận lỗi <code>403</code> với mã <code>ExpiredToken</code>, không hiểu phải làm gì.</li>' +
      '</ul>' +
      '<p><strong>Cơ chế và cách sửa.</strong> Với kích thước, ta chốt trần ở cả hai đầu: <code>Content-Length</code> phía API trước khi cấp URL, và giới hạn ghi của bucket ở phía S3, vì client hoàn toàn có thể nói dối. Với loại tệp, ta kiểm tra cả allowlist phần mở rội lẫn chữ ký magic number ở vài byte đầu, và bắt buộc header <code>Content-Type</code> khớp với loại đã đăng ký trong lúc presign. Với URL hết hạn, client tự xin URL mới khi nhận đúng mã lỗi hết hạn, thay vì bắt người dùng upload lại từ đầu; đồng thời URL cũ bị vô hiệu hoá để không dùng lại được.</p>' +
      '<p><strong>Tradeoff.</strong> Kiểm tra magic number cần worker đọc vài byte đầu tệp, tức thêm một vòng xử lý bất đồng bộ và một trạng thái chờ cho tài liệu mới. Ngưỡng chặt cũng phải cân với trải nghiệm: chặn mọi tệp trên 20 MB khiến người dùng hợp đồng thất vọng. Ta đặt trần 100 MB cho gói miễn phí, 2 GB cho gói trả phí, và trả về thông báo lỗi tiếng Việt nêu rõ giới hạn thay vì trả mã HTTP trần.</p>'
  },
  {
    id: 'cs-04',
    h: 'Gửi request trùng: idempotency',
    title: 'Gửi request trùng lặp: xử lý bằng Idempotency-Key',
    flow: 'flow-idempotency',
    body:
      '<p><strong>Failure mode.</strong> Người dùng bấm nút nhiều lần vì mạng chậm, hoặc một lớp retry tự động của thư viện HTTP gửi lại <code>POST /api/documents</code> sau khi request đầu đã tới server nhưng phản hồi bị mất. Nếu API không chống trùng, hệ thống tạo nhiều bản ghi trỏ cùng một object key, nhiều job trích xuất trùng nội dung, và người dùng phải tự dọn. Với thao tác gửi thông báo hay phát hành hoá đơn, trùng lặp còn tạo thiệt hại thật chứ không chỉ là dữ liệu rác.</p>' +
      '<p><strong>Cơ chế idempotency.</strong></p><ol>' +
      '<li>Client sinh một khóa ngẫu nhiên dạng UUID cho mỗi thao tác, giữ nguyên qua mọi lần thử lại, và gửi kèm header <code>Idempotency-Key</code>.</li>' +
      '<li>API mở transaction và chèn khóa đó vào bảng <code>idempotency_key</code>, với ràng buộc unique trên cặp khóa và mã người dùng.</li>' +
      '<li>Nếu chèn thành công, API thực thi tác vụ, lưu lại mã trạng thái và body kết quả, rồi commit cùng lúc với dữ liệu nghiệp vụ.</li>' +
      '<li>Nếu chèn gặp khóa trùng, nghĩa là request đã xử lý hoặc đang chạy, API đọc lại response đã lưu và trả về mà không thực thi lần nữa.</li>' +
      '</ol>' +
      '<p><strong>Tranh chấp phải xử lý.</strong> Hai request song song cùng khóa sẽ cùng lao vào ràng buộc unique; chỉ một cái thắng, cái còn lại bắt lỗi unique và đi vào nhánh đọc response đã lưu. Nhánh đọc phải chịu một khoảng chờ ngắn vì response có thể chưa được commit, nếu không sẽ trả <code>409</code> và buộc client phải tự thử lại. Một chi tiết quan trọng: phải so sánh hash của body để chắc chắn cùng khóa không bị dùng cho hai payload khác nhau, nếu không sẽ trả nhầm kết quả.</p>' +
      '<p><strong>Tradeoff.</strong> Bảng idempotency phình theo số request nên cần dọn theo tuổi, chẳng hạn giữ 24 giờ cho giao dịch tài chính và 7 ngày cho việc đơn giản. Chỉ nên bật cho endpoint ghi quan trọng như tạo tài liệu, đổi email, cấp quyền; bật cho mọi endpoint chỉ tốn thêm một câu lệnh insert mà không mua lại điều gì.</p>'
  },
  {
    id: 'cs-05',
    h: 'Queue: visibility timeout',
    title: 'Hàng đợi gửi và nhận lỗi: visibility timeout',
    flow: 'flow-sqs-visibility',
    body:
      '<p><strong>Failure mode.</strong> Worker xử lý message quá lâu so với thời gian ẩn của message, hoặc worker chết giữa chừng. Message bị tái phát trong khi tác vụ chưa xong, và tài liệu mãi mãi kẹt ở trạng thái đang xử lý vì không ai quét lại. Chiều ngược lại, nếu thời gian ẩn quá dài, một message lỗi được phát lại liên tục và che mất message mới đến sau.</p>' +
      '<p><strong>Cơ chế visibility timeout.</strong> Khi worker nhận message, SQS không xoá nó, chỉ đánh dấu ẩn đúng khoảng thời gian đã cấu hình. Chỉ khi worker gọi <code>DeleteMessage</code> thì message biến mất hẳn. Nếu worker chưa kịp, hết thời gian thì message tự hiện lại và một consumer khác nhận lại từ đầu. Vì vậy mô hình này là <strong>at-least-once</strong>, không phải exactly-once, và mọi thiết kế phía dưới phải giả định message có thể đến nhiều lần.</p>' +
      '<p><strong>Cách sửa.</strong> Đặt thời gian ẩn theo p95 của thời gian xử lý cộng biên an toàn, và bật heartbeat để gia hạn khi tác vụ kéo dài bất thường. Quan trọng hơn, mọi bước trong worker phải idempotent: cập nhật trạng thái bằng <code>upsert</code> theo khoá tài liệu, tạo thumbnail với khoá phiên bản để lần chạy thứ hai không sinh bản trùng, và dùng câu lệnh chống chèn trùng. Đồng thời tách loại lỗi: lỗi dữ liệu thì đưa thẳng sang DLQ chứ đừng retry vô hạn, vì retry không sửa được một file hỏng.</p>' +
      '<p><strong>Tradeoff.</strong> Thời gian ẩn ngắn đẩy việc nặng sang DLQ sớm nhưng tăng tải; thời gian ẩn dài che lỗi và làm thời gian phục hồi sau sự cố dài hơn. Ta đặt 60 giây cho job thumbnail vì xử lý nhất quán dưới 40 giây, và giới hạn 3 lần nhận lại trước khi chuyển sang DLQ.</p>'
  },
  {
    id: 'cs-06',
    h: 'Worker crash giữa chừng',
    title: 'Worker crash giữa chừng: xử lý trạng thái nửa vời',
    flow: 'flow-queue-worker',
    body:
      '<p><strong>Failure mode.</strong> Worker đang tạo PDF từ một tài liệu lớn thì bị hết bộ nhớ và bị hệ điều hành kill giữa lúc ghi file tạm. Message đang xử lý biến mất khỏi hàng đợi trong mắt các consumer khác, và tài liệu kẹt vĩnh viễn ở trạng thái đang xử lý vì không có gì quét lại. Người dùng nhìn thấy vòng quay xoay vô tận mà không ai sửa.</p>' +
      '<p><strong>Cơ chế.</strong> Worker chạy trong ECS với giới hạn bộ nhớ cứng và có thể bị dừng bất kỳ lúc nào, kể cả giữa luồng khi đang deploy phiên bản mới. Với Lambda thì cắt ngang dữ dội hơn: timeout cứng của hàm chấm dứt lời gọi giữa chừng, mọi biến cục bộ mất, và message trở lại hàng đợi. Ba nguyên nhân chết phổ biến nhất là hết bộ nhớ, bị deploy dừng container, và hết thời gian.</p>' +
      '<p><strong>Cách sửa.</strong> Trước hết, mọi thao tác phải an toàn khi chạy lại: chia việc thành các bước nhỏ và ghi trạng thái vào PostgreSQL sau mỗi bước, dùng khoá tạo duy nhất để mỗi bước chỉ có tác dụng đúng một lần. Thứ hai, thêm công việc quét định kỳ: tìm tài liệu quá 15 phút ở trạng thái đang xử lý thì đưa trở lại hàng đợi với số lần thử tăng dần, kèm cảnh báo khi vượt ngưỡng. Thứ ba, cấu hình ECS để task cũ chỉ dừng sau khi task mới đã sẵn sàng, tránh cắt ngang giữa luồng.</p>' +
      '<p><strong>Tradeoff.</strong> Job quét định kỳ tốn một lần quét bảng mỗi phút, nhưng nhờ index theo trạng thái và thời điểm cập nhật, chi phí gần như không đáng kể so với việc phải dò thủ công mỗi lần có tài liệu kẹt. Đổi lại ta mất trạng thái tuyệt đối về tiến độ và phải chấp nhận khả năng một bước chạy lại hai lần, nên thiết kế phải chịu được điều đó ngay từ đầu.</p>'
  },
  {
    id: 'cs-07',
    h: 'Lệch database và queue: transaction + outbox',
    title: 'Lệch dữ liệu giữa database và hàng đợi: transaction cùng outbox',
    body:
      '<p><strong>Failure mode kinh điển.</strong> Tài liệu được ghi vào PostgreSQL thành công, nhưng lệnh gửi message vào SQS thất bại vì mạng lăn cùng lúc. Kết quả là tài liệu tồn tại mà không có thumbnail, không có nội dung trích xuất, và không có dấu vết nào cho biết cần xử lý lại. Chiều ngược lại, message đã vào hàng đợi nhưng transaction sau đó bị rollback, worker xử lý một tài liệu không tồn tại và báo lỗi vô nghĩa suốt ba lần trước khi rơi vào DLQ.</p>' +
      '<p><strong>Vì sao không dùng transaction phân tán.</strong> PostgreSQL không thể commit cùng lúc với SQS trong cùng một transaction. Đây đúng là bài toán hai phase commit giữa hai hệ thống không cùng công nghệ, và nó không có lời giải an toàn khi một bên không tham gia hoặc tham gia muộn.</p>' +
      '<p><strong>Cơ chế transactional outbox.</strong> Ta ghi bản ghi tài liệu và một dòng outbox trong <strong>cùng một transaction</strong> của PostgreSQL, nên khi transaction commit thì cả hai cùng tồn tại, không thể có một mà thiếu một. Một tiến trình riêng đọc bảng outbox theo lô, gửi message vào SQS, rồi đánh dấu đã gửi. Nếu tiến trình chết giữa chừng, dòng outbox vẫn còn và lần chạy sau sẽ gửi lại. Trùng lặp chấp nhận được vì worker đã thiết kế idempotent ở mục trước.</p>' +
      '<p><strong>Cách sửa chi tiết.</strong> Bảng outbox cần index theo trạng thái và thời điểm tạo để việc đọc theo lô không quét toàn bảng, một cột khoá để hai tiến trình không cùng gửi một dòng, và một job dọn xoá dòng đã gửi sau vài ngày để bảng không phình vô hạn. Ta cũng hạn số lần gửi lại và cảnh báo nếu một dòng già quá 5 phút vẫn chưa đi được, vì đó thường là dấu hiệu SQS hoặc khoá quyền đang hỏng.</p>' +
      '<p><strong>Tradeoff.</strong> Outbox thêm một bảng, một tiến trình và một khoảng độ trễ nhỏ. Đổi lại toàn bộ sự không nhất quán giữa cơ sở dữ liệu và hàng đợi biến mất, và việc tái chế tạo cơ sở dữ liệu từ bản sao lưu không còn để lọt message. Với hệ thống không cần mức tin cậy đó, chẳng hạn một hàng đợi báo cáo có thể mất vài bản ghi, gửi thẳng SQS rồi chấp nhận rủi ro là hợp lý hơn và ít vận hành hơn.</p>'
  },
  {
    id: 'cs-08',
    h: 'Truy cập tệp của người khác',
    title: 'Người dùng truy cập tệp của người khác: kiểm tra sở hữu và presigned URL ngắn hạn',
    flow: 'flow-auth-jwt',
    body:
      '<p><strong>Failure mode.</strong> Người dùng đoán hoặc sao chép được một object key của tài liệu người khác rồi gọi thẳng vào API. Nếu API chỉ kiểm tra token còn hợp lệ mà không kiểm tra quan hệ sở hữu, bất kỳ tài khoản nào cũng đọc được toàn bộ kho tài liệu của công ty. Biến thể tinh vi hơn là ta dựng sẵn đường dẫn tải rồi đưa thẳng cho client: người khác chỉ cần sao chép là dùng được, và quyền bị vô hiệu hoá hoàn toàn sau khi đổi mật khẩu hay thu hồi thiết bị.</p>' +
      '<p><strong>Cơ chế và ranh giới của nó.</strong> Authorizer JWT ở API Gateway chỉ trả lời câu hỏi thân xác là ai, không trả lời được câu hỏi được phép làm gì với tài liệu cụ thể, vì danh sách quyền thay đổi liên tục mà token sống vài chục phút. Vì vậy quyền đọc phải kiểm tra ở tầng ứng dụng. Object key có tiền tố theo tenant giúp dễ dọn và dễ ghi log, nhưng tiền tố không phải là phép ủy quyền: biết một key không có nghĩa được phép đọc, và ngược lại, cấu hình sai quyền ở tầng policy của bucket có thể mở đường đi vòng qua toàn bộ kiểm tra ở tầng API.</p>' +
      '<p><strong>Cách sửa.</strong> Trước khi sinh bất kỳ URL tải nào, API phải truy vấn tài liệu cùng bảng quyền trong một câu lệnh và kiểm tra người gọi là chủ sở hữu, thành viên được chia sẻ, hay có vai trò quản trị trong đúng phạm vi thư mục. Nếu không đủ quyền, ta trả về mã <code>404</code> chứ không phải <code>403</code>, vì <code>403</code> tiết lộ rằng tài liệu tồn tại và biến trang danh sách thành công cụ dò tài liệu của cả công ty. Chỉ sau khi kiểm tra mới sinh presigned URL với thời hạn 60 giây, đúng phương thức <code>GET</code>, gắn đúng một object key, và kèm header buộc tải xuống thay vì mở trình duyệt. Mọi lần cấp URL đều ghi log gồm mã người gọi, mã tài liệu và thời điểm, vì đây là bằng chứng duy nhất khi có tranh chấp quyền.</p>' +
      '<p><strong>Tradeoff.</strong> Thời hạn 60 giây buộc client phải xin lại URL khi người dùng tải tệp lớn, thêm một vòng gọi nữa vào thao tác đã chậm. Kiểm tra quyền ở mọi lần đọc cũng tốn thêm một truy vấn trên đúng đường nóng, nên ta cache quyền trong bộ nhớ với thời hạn ngắn và xoá cache theo sự kiện khi quyền thay đổi; nếu không làm được thì nên chấp nhận truy vấn thay vì đánh đổi tính đúng đắn của việc thu hồi quyền. Phương án rẻ hơn là dùng CloudFront có signed URL ở rìa, nhưng khi đó quyền phải được dàn trải xuống tầng CDN và việc thu hồi trở nên chậm hơn.</p>'
  },
  {
    id: 'cs-09',
    h: 'Backend chậm: N+1, index, connection pool',
    title: 'Backend chậm: truy vấn N+1, thiếu index và connection pool cấu hình sai',
    body:
      '<p><strong>Failure mode.</strong> Trang danh sách tài liệu từng chạy dưới 200 ms rồi bỗng lên vài giây sau khi số tài liệu vượt ngưỡng. Máy chủ không báo lỗi, CPU không chạm trần, nhưng độ trễ p95 tăng gấp mười lần và số task đang chờ connection dồn lên. Nguyên nhân gần như luôn là ba thứ này cùng lúc: mỗi dòng kết quả lại phát ra thêm một câu truy vấn, câu truy vấn đó không có index đi kèm, và pool bị cạn nên mọi request xếp hàng chờ.</p>' +
      '<p><strong>Cơ chế N+1.</strong> Với cấu hình nạp lười mặc định của lớp ánh xạ quan hệ, một vòng lặp duyệt 50 tài liệu sẽ phát ra 50 câu lấy tên người tạo và 50 câu đếm số phiên bản. Mỗi câu là một vòng gọi mạng tới PostgreSQL khoảng một phần mười mili giây, nhưng chúng nối tiếp nhau nên toàn trang lên hơn một giây. Có một biến thể còn tệ hơn: lỗi này gần như vô hại khi bảng còn trống và chỉ lộ ra đúng lúc hệ thống bắt đầu có người dùng thật, tức là đúng lúc mà nó gây hại.</p>' +
      '<p><strong>Index và connection pool.</strong> Truy vấn danh sách lọc theo chủ sở hữu và sắp xếp theo thời điểm cập nhật; nếu chỉ có index trên cột khoá chính thì PostgreSQL phải quét tuần tự toàn bảng rồi sắp xếp tại bộ nhớ, tốn hơn nhiều khi bảng vượt vài trăm nghìn dòng. Về pool, kích thước phải bằng tổng số task chạy đồng thời trên tất cả service, không phải bằng số task của một service: đặt quá nhỏ thì request xếp hàng chờ connection, đặt quá lớn thì các task còn lại không còn connection và database từ chối kết nối mới, biểu hiện là lỗi kết nối hàng loạt dù CPU vẫn rảnh.</p>' +
      '<p><strong>Cách sửa.</strong> Bước một, đo trước khi sửa: bật log truy vấn chậm trên một môi trường thử, rồi chạy <code>EXPLAIN ANALYZE</code> trên câu lệnh thật để xem có dòng nào đọc tuần tự và ước lượng sai lệch ra sao. Bước hai, gom các câu truy vấn N+1 thành một câu nối bảng hoặc một câu lấy dữ liệu liên quan, và nạp trước quan hệ thay vì để vòng lặp tự kích hoạt. Bước ba, thêm index phủ đúng thứ tự lọc và sắp xếp, chạy lại EXPLAIN để xác nhận kế hoạch thực thi đã đổi. Bước bốn, đặt <code>statement_timeout</code> cho mọi câu lệnh để một truy vấn quá đà bị cắt thay vì giữ connection cả phút, và theo dõi độ dài hàng đợi chờ pool cùng tỉ lệ timeout.</p>' +
      '<p><strong>Tradeoff.</strong> Mỗi index đều làm ghi chậm hơn và tốn bộ nhớ của database, nên thêm index cho mọi cột có trong điều kiện lọc là cách nhanh nhất để làm chậm hệ thống. Một câu nối bảng lớn lại có thể nặng hơn hai câu riêng khi dữ liệu phân bố lệch, vì bảng cha nhân với bảng con rồi mới lọc. Giải pháp bọc thêm một tầng cache kết quả truy vấn giúp giảm tải rõ rệt nhưng phải chấp nhận dữ liệu cũ trong thời gian ngắn, nên chỉ dùng cho trang đọc và phải có đường xoá cache khi có bản ghi mới.</p>'
  },
  {
    id: 'cs-10',
    h: 'Deploy lỗi: CI/CD, rollback code và rollback DB',
    title: 'Deploy lỗi: quy trình CI/CD, khi nào rollback code và khi nào rollback cơ sở dữ liệu',
    flow: 'flow-cicd-pipeline',
    body:
      '<p><strong>Failure mode.</strong> Bản phát hành 2.3 thêm một cột bắt buộc vào bảng tài liệu. Pipeline chạy migration trước rồi mới triển khai code, code mới chạy lỗi vì thiếu cột, đội vận hành rollback ứng dụng về 2.2, và ngay lập tức 2.2 gọi câu lệnh có nhắc tới cột vừa bị xoá nên hệ thống sập hoàn toàn. Chiều ngược lại cũng xảy ra: code mới đã lên nhưng migration chưa kịp chạy, ứng dụng lập tức lỗi cột không tồn tại ngay từ phút đầu tiên.</p>' +
      '<p><strong>Cơ chế phát sinh lỗi.</strong> Rollback code gần như luôn an toàn và mất vài giây, còn rollback cơ sở dữ liệu thì phục hồi một bản sao lưu có nghĩa là xoá mọi thay đổi phát sinh sau thời điểm sao lưu, tức là xoá cả tài liệu người dùng vừa tải lên trong lúc sự cố. Vì vậy coi rollback dữ liệu là một nút bấm cứu hệ thống là cách hiểu sai nguy hiểm nhất trong vận hành. Nguyên nhân sâu hơn nằm ở việc bản phát hành gộp cả thay đổi lược đồ lẫn thay đổi hành vi, khiến hai phía không còn tương thích theo bất kỳ chiều nào.</p>' +
      '<p><strong>Cách sửa theo nguyên tắc mở rộng rồi thu dọn.</strong> Mỗi thay đổi cột chia làm hai bản phát hành: bản đầu chỉ thêm cột cho phép giá trị rỗng mà không dùng đến, sau đó bản sau mới bắt đầu ghi và đọc cột mới. Việc xoá cột hoặc đổi tên cột phải để tới bản phát hành kế tiếp nữa, khi không còn phiên bản nào trên sân đọc tới nó. Trong pipeline, đặt trạng thái chờ sau bước migration để mã trạng thái đã được xác nhận trước khi đổi phiên bản, chạy kiểm thử trên bản migration đã áp dụng chứ không chỉ trên cơ sở dữ liệu rỗng, rồi triển khai dạng canary cho một phần nhỏ lưu lượng và tự động lùi nếu tỉ lệ lỗi vượt ngưỡng trong vài phút đầu. Mọi thay đổi lược đồ phải viết theo hướng chỉ tiến, không ghi kiểu cột theo thứ tự không đảo ngược được, để luôn có đường đi tiếp thay vì đường lui.</p>' +
      '<p><strong>Tradeoff.</strong> Cách làm này kéo dài vòng đời một thay đổi lược đồ từ một lần phát hành thành hai hoặc ba, và buộc phải giữ hai cùng một lúc trong giai đoạn trung gian. Người mới vào dự án thường thấy nó rườm rà và sẽ tối ưu bằng cách gộp lại, nên quy trình này cần được viết thành quy tắc bắt buộc trong lợi ích kèm nhãn hợp đồng và cổng kiểm tra trong pipeline, chứ không chỉ nằm trong tài liệu. Đổi lại mọi lần phát hành đều quay lui được trong vài phút mà không mất dữ liệu, đây là thứ quyết định tốc độ khắc phục khi có sự cố lúc nửa đêm.</p>'
  },
  {
    id: 'cs-11',
    h: 'Retry và backoff, DLQ',
    title: 'Retry sai cách và hàng đợi chết: exponential backoff, jitter và DLQ',
    flow: 'flow-failure-retry',
    body:
      '<p><strong>Failure mode.</strong> Worker gặp một lỗi mạng ngắn quãng rồi thử lại ngay lập tức, mỗi worker đều làm đúng như vậy. Kết quả là hiệu ứng đàn bầy: khi dịch vụ phía sau vừa hồi phục, hàng trăm worker cùng lao vào trong cùng một khoảng thời gian, làm nó gãy lần nữa, rồi lại đồng loạt thử lại. Chiều ngược lại, một lỗi không bao giờ tự khỏi như tệp hỏng hay payload sai định dạng lại bị thử lại mãi, giữ chỗ số tác vụ đồng thời và che mất mọi message hợp lệ đến sau.</p>' +
      '<p><strong>Cơ chế.</strong> Retry chỉ có ích với lỗi tạm thời: quá thời gian chờ, kết nối bị đặt lại, dịch vụ trả mã ra tạm thời, hạn mức bị vượt. Với lỗi vĩnh như dữ liệu không hợp lệ hay thiếu quyền, thử lại chỉ tốn thêm tài nguyên mà không bao giờ cho kết quả khác. Nguyên nhân kỹ thuật của hiệu ứng đàn bầy là tính đồng bộ: nếu mọi client cùng nhận cùng một tín hiệu lỗi và cùng chờ đúng một khoảng thời gian, chúng sẽ cùng quay lại đúng một thời điểm, đúng lúc tài nguyên vừa được giải phóng. Chính vì vậy khoảng chờ phải được rút ngẫu nhiên chứ không cố định.</p>' +
      '<p><strong>Cách sửa.</strong> Chỉ thử lại lỗi tạm, và mỗi lần chờ gấp đôi khoảng chờ trước rồi cộng thêm một phần ngẫu nhiên để các worker tách ra khỏi nhau. Luôn đặt thời hạn cho từng lời gọi ra ngoài, vì một lời gọi treo sẽ giữ khoá và giữ connection lâu hơn cả việc thử lại. Khi số lần thử vượt ngưỡng, chuyển message sang hàng đợi chết thay vì tiếp tục vứt đi, và đi kèm một quy trình có người trực: cảnh báo khi độ sâu hàng đợi chết tăng, công cụ xem toàn bộ message đang nằm đó kèm lý do thất bại, và một thao tác phát lại sau khi đã sửa nguyên nhân gốc. Quan trọng không kém, mọi bước trong lần thử phải an toàn khi chạy lại, vì retry chính là cách bảo đảm thao tác sẽ xảy ra nhiều lần hơn một lần.</p>' +
      '<p><strong>Tradeoff.</strong> Retry làm thời gian phục hồi sau sự cố dài hơn, và nếu không giới hạn số lần thì nó che mất lỗi thật bằng một đống thông báo lỗi giống hệt nhau. Phần ngẫu nhiên làm khó lập trình và khó lặp lại sự cố, đổi lại hệ thống thực sự chịu được tải đột biến. Hàng đợi chết chỉ có giá trị nếu có người nhìn; nếu không có cảnh báo, nó biến từ cơ chế cứu hệ thống thành nơi chôn lỗi vĩnh viễn mà không ai biết có bao nhiêu thứ đang nằm trong đó.</p>'
  },
  {
    id: 'cs-12',
    h: 'Lambda cold start hay container ECS',
    title: 'Chọn Lambda hay container ECS: chi phí cold start với đúng khối lượng công việc này',
    flow: 'flow-lambda-cold-start',
    body:
      '<p><strong>Failure mode.</strong> Người dùng mở ứng dụng sau một khoảng im lặng vài phút thì thấy thanh chờ đứng yên gần hai giây ở lần bấm đầu tiên, trong khi các lần bấm sau nhanh bình thường. Biểu hiện này chỉ xuất hiện ở khoảng 20% phiên đầu tiên sau mỗi đợt, đủ để khiến người dùng tưởng ứng dụng lỗi. Trên môi trường thử, ảnh chứa dài gần một gigabyte và thư viện nặng được nạp ở phần đầu hàm khiến thời gian khởi tạo tính cả gần năm giây.</p>' +
      '<p><strong>Cơ chế khởi động lạnh.</strong> Một lần gọi hàm phải đi qua ba giai đoạn: tải ảnh chứa về môi trường thực thi, khởi tạo môi trường chạy, rồi chạy phần khởi tạo người dùng như nối kết nối, đọc cấu hình và nạp thư viện. Ba giai đoạn đầu diễn ra mỗi lần không có môi trường nào được tái sử dụng, và cả ba đều nằm ngoài thời gian mà mã nghiệp vụ chạy. Bộ nhớ được cấp cũng quyết định tốc độ CPU, nên một hàm cấp phát nhiều bộ nhớ nhưng chạy việc nhẹ vẫn khởi tạo nhanh hơn một hàm cấp phát ít bộ nhớ.</p>' +
      '<p><strong>So sánh với container.</strong> Container chạy trên cụm hậu cần kéo ảnh về node và khởi động tiến trình, nên lần đầu mỗi node cũng có độ trễ, nhưng ngay sau đó nó giữ mọi kết nối mở sẵn và không mất trạng thái giữa các request. Quan trọng hơn, ta kiểm soát được chu kỳ đời của tiến trình: cấu hình để task mới báo khoẻ trước khi dừng task cũ, cấu hình số bản sao tối thiểu, và có thể giữ một task luôn sẵn sàng. Đổi lại phải tự lo phần mở rộng, cập nhật bản vá hệ điều hành, và giám sát.</p>' +
      '<p><strong>Cách sửa và cách chọn.</strong> Với phần đường dẫn ngắn và đột biến, ta cắt ảnh cho gọn, bỏ các thư viện không dùng ở đường này, chuyển phần nạp nặng sang nạp khi thật sự cần để phần khởi tạo chỉ làm việc tối thiểu, và dùng bộ nhớ tối thiểu để đổi lấy CPU cao hơn cho phần tính. Sau đó bật cấu hình giữ môi trường ấm, hoặc dành sẵn số lần gọi đồng thời nếu độ trễ vài trăm mili giây là điều kiện bắt buộc, và hẹn một lệnh gọi đều đặn vào đúng đường dẫn đó để giữ ấm. Với phần việc nặng và lưu lượng đều như xử lý hậu kỳ tài liệu, container trên cụm hậu cần là lựa chọn rõ ràng, vì thời gian chạy dài và xử lý tệp nặng không phù hợp với mô hình trả về nhanh của hàm.</p>' +
      '<p><strong>Tradeoff.</strong> Số lần gọi dành sẵn trả tiền cho cả khoảng thời gian không ai dùng, nên với lưu lượng thấp và không đều, chi phí vượt hẳn lợi ích. Ngược lại, dùng container cho một luồng thưa thớt buộc phải trả tiền cho cả node tối thiểu và chịu độ trễ khởi động lạnh của chính container. Quyết định nên dựa trên số liệu đo được ở chính khối lượng công việc này, tức phân bố thời gian khởi tạo lạnh so với thời gian xử lý, chứ không dựa trên ấn tượng chung về dịch vụ nào nhanh hơn.</p>'
  },
  {
    id: 'cs-13',
    h: 'Transaction và mức cô lập trong PostgreSQL',
    title: 'Transaction và mức cô lập trong PostgreSQL: mất dữ liệu cập nhật, đọc lệch và khoá chết',
    flow: 'flow-db-transaction',
    body:
      '<p><strong>Failure mode.</strong> Hai người cùng mở một tài liệu để sửa. Người thứ nhất đổi tên và lưu. Người thứ hai, vẫn nhìn thấy tên cũ trên màn hình từ lúc tải trang, đổi phần nội dung và lưu. Kết quả là thay đổi của người thứ nhất biến mất mà không có dấu vết, và cả hai đều tin là đã lưu thành công. Một biến thể khác xảy ra trong báo cáo: người đọc thấy trạng thái tài liệu mới nhưng số phiên bản vẫn là số cũ, vì hai truy vấn chạy ở hai thời điểm khác nhau giữa lúc transaction ghi đang dở.</p>' +
      '<p><strong>Cơ chế cô lập.</strong> PostgreSQL mặc định ở mức đọc đã cam kết: mỗi câu lệnh chạy trên một ảnh chụp nhất quán tại thời điểm câu lệnh bắt đầu, nên không đọc được dữ liệu chưa commit và không đọc phải sạch, nhưng hai câu lệnh trong cùng một transaction vẫn có thể nhìn thấy hai trạng thái khác nhau. Mức cô lập lặp lại giữ ảnh chụp đó cho cả transaction nên truy vấn lặp lại cho kết quả giống nhau. Mức mạnh nhất bắt buộc hai transaction chạy song song phải cho kết quả như khi chạy tuần tự, và nó phát hiện mâu thuẫn bằng cách huỷ một trong hai bên bằng mã lỗi phát hiện xung đột. Song song cơ chế này, khoá ghi được giữ tới khi hết transaction, nên hai transaction cùng đụng hai dòng theo hai thứ tự khác nhau sẽ chờ vòng và chết khoá.</p>' +
      '<p><strong>Cách sửa.</strong> Giữ transaction ngắn nhất có thể, tuyệt đối không mở transaction rồi gọi ra dịch vụ khác bên trong, vì khoá sẽ bị giữ trong suốt thời gian chờ mạng và một connection bị giữ lâu làm cả hệ thống nghẽn. Với thao tác sửa tài liệu, dùng một cột đếm phiên bản và đặt điều kiện cập nhật là phiên bản phải bằng giá trị vừa đọc; nếu không có dòng nào được cập nhật nghĩa là có người đã sửa trước, và ta trả thông báo xung đột để người dùng nạp lại thay vì âm thầm ghi đè. Khi cần chốt một con số chính xác, dùng khoá tường minh trên dòng cần sửa trước khi tính toán, với nguyên tắc mọi transaction khoá theo cùng một thứ tự để không bao giờ chết khoá. Thao tác chèn khi đã tồn tại nên dùng câu lệnh chèn cập nhật tại chỗ dựa trên ràng buộc duy nhất sẵn có, tránh cảnh báo tranh chấp rồi lại ghi đè. Cuối cùng, mọi lỗi phát hiện xung đột hay chết khoá đều phải được thử lại có backoff, vì đây là tín hiệu bình thường của hệ thống nhiều người dùng chứ không phải lỗi cần báo động.</p>' +
      '<p><strong>Tradeoff.</strong> Mức cô lập cao bảo đảm tính đúng đắn tuyệt đối nhưng đổi lại là nhiều lần bị huỷ hơn, tức nhiều lần phải thử lại và nhiều lần người dùng phải chờ thêm. Khoá tường minh cho kết quả chính xác thì tuần tự hoá công việc trên những dòng cùng tranh đấu, tức giảm tốc độ xử lý khi nhiều người cùng sửa cùng một tài liệu. Cột đếm phiên bản là cách rẻ nhất để phát hiện mất dữ liệu cập nhật nhưng đòi hỏi mọi đường ghi đều tuân thủ, nên một đường ghi cũ quên cập nhật cột này sẽ lặng lẽ phá vỡ cơ chế. Mức đọc đã cam kết mặc định là lựa chọn hợp lý; chỉ nâng lên mức cao hơn khi đã đo được rằng báo cáo thực sự cần ảnh chụp nhất quán suốt transaction.</p>'
  },
  {
    id: 'cs-14',
    h: 'CORS và preflight giữa hai origin',
    title: 'CORS và preflight khi frontend gọi API khác origin: lỗi ở tầng trình duyệt',
    flow: 'flow-cors-preflight',
    body:
      '<p><strong>Failure mode.</strong> Ứng dụng chạy trên một miền và gọi API ở miền khác thì mọi thao tác ghi báo lỗi trong bảng điều khiển của trình duyệt, trong khi biểu lỗi vẫn hiện mã trạng thái thành công. Log phía máy chủ trống trơn vì request chưa bao giờ tới nơi, và người kỹ sưng mất hàng giờ đi tìm lỗi ở trong mã nguồn vốn không hề sai. Ngược lại có trường hợp nguy hiểm hơn nhiều: sau khi sửa bằng cách cho phép mọi origin kèm thông tin đăng nhập, mọi trang bất kỳ trên mạng đều có thể gọi vào API bằng phiên của người đang đăng nhập.</p>' +
      '<p><strong>Cơ chế kiểm tra tiền điều kiện.</strong> Trước khi gửi thao tác ghi, trình duyệt gửi một yêu cầu thăm dò kèm tiêu đề nguồn và tiêu đề cho biết phương thức sắp dùng. Yêu cầu thăm dò này phát sinh khi thao tác không còn là dạng đơn giản nữa, tức dùng phương thức ghi xoá, hoặc kèm tiêu đề tuỳ chỉnh như phần tử xác thực, hoặc dùng kiểu nội dung không phải ba kiểu văn bản cơ bản. Máy chủ phải trả về đúng các tiêu đề cho phép nguồn, phương thức, và tiêu đề được hỏi, cùng thời gian cho phép lưu lại. Điểm hay gây nhầm là kết quả thăm dò được lưu lại: sau khi sửa cấu hình, mọi phiên trình duyệt vẫn dùng kết quả cũ trong suốt thời gian lưu, nên người sửa cấu hình tưởng là không có tác dụng và bắt đầu sửa nhầm chỗ khác.</p>' +
      '<p><strong>Cách sửa.</strong> Chỉ khai báo đúng những nguồn tin cậy, tuyệt đối không dùng ký tự đại diện kèm thông tin đăng nhập, vì cấu hình đó bị từ chối ở mức trình duyệt và nếu còn thông tin đăng nhập thì đường dẫn đó không hợp lệ về mặt thiết kế. Nguồn phải khớp chính xác kể cả cổng, và nếu có nhiều môi trường thì khai báo danh sách tường minh thay vì để mẫu rộng. Chỉ cho phép những tiêu đề mà ứng dụng thật sự gửi, và xử lý yêu cầu thăm dò tại tầng cổng vào hoặc bằng một lớp trung gian, không cho nó chạm xuống cơ sở dữ liệu. Đặt thời gian lưu đủ dài để giảm số lần thăm dò nhưng không quá dài để việc sửa cấu hình có hiệu lực kịp. Quan trọng là phải kiểm thử bằng chính trình duyệt thật và trước request, ghi rõ trong tài liệu nguồn nào được phép.</p>' +
      '<p><strong>Tradeoff.</strong> Cấu hình chặt chẽ an toàn hơn nhưng dễ vỡ khi thêm một môi trường mới, và thường phải deploy lại cấu hình chỉ để thêm một tên miền vào danh sách. Cấu hình rộng dễ vận hành hơn nhưng mở bề mặt tấn công và thường bị trình duyệt chặn khi dùng kèm thông tin đăng nhập. Cách triệt để nhất là đưa API về cùng nguồn với ứng dụng qua một lớp định tuyến hoặc cổng cạnh, lúc đó trình duyệt không cần thăm dò nữa và toàn bộ vấn đề biến mất, đổi lại ta phải chịu thêm một chặng và bỏ được khả năng tách tên miền độc lập giữa phần giao diện và phần API.</p>'
  }
];
