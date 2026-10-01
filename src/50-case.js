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
  }
