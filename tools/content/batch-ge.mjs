// Batch GE — AWS G11..G17 and backend E07..E12.
export default {
G11: {
incident: `<p>Một hàm Lambda nhận event từ S3 và ghi một dòng vào bảng đối soát. Trong hai tuần, bảng có 1.847 dòng trùng. Log CloudWatch cho thấy mỗi event được xử lý hai lần trong khoảng 40% trường hợp, và một lần thì thành công ngay. Hàm không hề bị lỗi logic: lần thứ hai cũng trả về 200 và ghi thêm một dòng. Không có ai gọi lại thủ công.</p>`,
askFirst: [
`Với invocation bất đồng bộ, ai thử lại và thử lại mấy lần?`,
`Vì sao lần thử thứ hai không bị coi là lỗi?`,
`Ranh giới idempotency phải nằm ở đâu trong hàm này?`,
],
predict: {
q: `Một hàm Lambda được gọi bất đồng bộ và lần chạy đầu ném lỗi. Chuyện gì xảy ra tiếp theo?`,
a: `<p>Lambda thử lại tự động, mặc định hai lần, rồi nếu vẫn lỗi thì event được chuyển tới nơi xử lý lỗi — một DLQ hoặc một on-failure destination tuỳ cấu hình. Điều quan trọng là cả ba lần chạy đều nhận <em>cùng một event</em>, nên nếu lần đầu đã ghi xong dữ liệu rồi mới lỗi ở bước sau, lần thử thứ hai sẽ ghi lần nữa. Đây là lý do at-least-once phải được coi là mặc định, không phải ngoại lệ.</p>`,
},
anchor: `Lambda bất đồng bộ tự thử lại hai lần trên cùng một event, nên handler phải được viết như thể nó chắc chắn chạy hai lần.`,
attacks: [
{ q: `Nếu tôi đặt khóa idempotency trong bộ nhớ cấp module thì có chặn được không?`, a: `Chỉ trong phạm vi một execution environment, và đó không phải bảo đảm. Biến cấp module sống qua các lần gọi ấm, nhưng môi trường có thể bị thu hồi bất cứ lúc nào, và Lambda có thể chạy nhiều môi trường song song — hai lần thử có thể rơi vào hai môi trường khác nhau. Ngoài ra, cùng một môi trường có thể phục vụ nhiều event khác nhau, nên một tập hợp khoá trong bộ nhớ còn là rò rỉ bộ nhớ. Ranh giới idempotency phải nằm ở một kho lưu trữ dùng chung, thường là điều kiện ghi trên DynamoDB hoặc một ràng buộc duy nhất trong cơ sở dữ liệu quan hệ.` },
{ q: `Làm sao phân biệt retry do Lambda với người dùng thực sự gửi hai lần?`, a: `Bằng định danh nghiệp vụ chứ không bằng định danh hạ tầng. Nếu client sinh một khoá cho mỗi thao tác nghiệp vụ và giữ nguyên qua mọi lần thử, thì hai lần gửi đó là cùng một thao tác và phải bị chặn. Nếu người dùng thực sự muốn tạo hai bản ghi giống nhau, họ phải có hai thao tác khác nhau, tức hai khoá khác nhau. Điều không dùng được là các định danh do hạ tầng sinh ra như <code>MessageId</code> của SQS hay <code>requestId</code> của Lambda — chúng đổi theo mỗi lần giao hoặc mỗi lần chạy nên không nhận ra được sự trùng lặp.` },
],
},
G12: {
incident: `<p>Một hàm Lambda cần gọi RDS PostgreSQL nên được đặt trong VPC. Sau khi deploy, hàm timeout sau 30 giây ở mọi lần gọi, kể cả những lần chỉ đọc một dòng. Hàm không hề ném lỗi logic; nó chỉ treo cho tới khi hết thời gian. Cùng lúc, một dịch vụ khác trong cùng VPC gọi được RDS bình thường.</p>`,
askFirst: [
`Hàm trong VPC cần gì để ra được Internet?`,
`Security group kiểm soát cái gì, và khác gì network ACL?`,
`Vì sao hàm treo thay vì báo lỗi kết nối ngay?`,
],
predict: {
q: `Một Lambda nằm trong private subnet, không có NAT gateway, và gọi một API công khai trên Internet. Chuyện gì xảy ra?`,
a: `<p>Lời gọi treo cho tới khi hết timeout của hàm. Private subnet không có route ra Internet, nên gói tin đi ra không có đường về và kết nối chỉ đơn giản là không bao giờ hoàn tất — không có lỗi DNS, không có lỗi kết nối bị từ chối, chỉ có im lặng. Đây là khác biệt quan trọng: thiếu route cho ra kết quả treo, còn thiếu quyền security group thường cho kết quả timeout ở tầng TCP nhanh hơn nhiều. Muốn ra Internet từ private subnet phải có NAT gateway đặt ở public subnet, và route table của private subnet phải trỏ mặc định về NAT đó.</p>`,
},
anchor: `Thiếu route ra Internet cho kết quả treo tới hết timeout chứ không phải lỗi rõ ràng, nên triệu chứng "hàm treo" trong VPC thường là lỗi mạng chứ không phải lỗi code.`,
attacks: [
{ q: `Security group và network ACL khác nhau thế nào?`, a: `Security group hoạt động ở cấp tài nguyên — gắn vào ENI của hàm, instance, hay database — và là stateful: nếu bạn cho phép chiều vào thì chiều ra của kết nối đó tự động được phép. Network ACL hoạt động ở cấp subnet và là stateless: bạn phải khai báo cả chiều vào và chiều ra, và thứ tự rule quan trọng vì nó được đánh giá tuần tự. Thực tế là security group mới là thứ bạn chỉnh hằng ngày, còn network ACL thường để mặc định cho phép tất cả.` },
{ q: `Vì sao đặt hàm trong VPC lại làm cold start lâu hơn?`, a: `Vì hàm cần một elastic network interface trong subnet để có địa chỉ trong VPC, và việc gắn ENI nằm trong pha khởi tạo. AWS đã giảm đáng kể chi phí này so với trước đây, nhưng nó vẫn là một khoản cộng thêm vào cold start, và chỉ trả một lần cho mỗi execution environment vì ENI được tái dùng cùng môi trường. Nếu hàm không thực sự cần truy cập tài nguyên trong VPC thì đặt ngoài VPC vẫn rẻ hơn về độ trễ khởi tạo.` },
],
},
G13: {
incident: `<p>Sự cố kéo dài 40 phút. Người dùng báo "web chậm". Đội trực mở dashboard: CPU của service ở mức 8%, không có alarm nào kêu, log ứng dụng không có dòng ERROR nào. Sau 40 phút, nguyên nhân được tìm ra là một hàm downstream trả chậm gấp mười lần bình thường, nhưng không có metric nào phản ánh độ trễ của lời gọi đó, và log của hai service không liên kết được với nhau vì không có định danh chung.</p>`,
askFirst: [
`"Web chậm" thiếu thông tin gì để trở thành một giả thuyết kiểm tra được?`,
`Metric nào phát hiện được sự cố này sớm nhất?`,
`Làm sao nối một request qua nhiều service trong log?`,
],
predict: {
q: `Một service có CPU thấp, không lỗi, nhưng p99 tăng gấp mười. Bạn nhìn vào đâu trước?`,
a: `<p>Nhìn vào độ trễ của các phụ thuộc bên ngoài, không nhìn vào tài nguyên của chính service. CPU thấp kèm độ trễ cao là chữ ký của việc đang chờ ai đó — database, một API bên thứ ba, hoặc một hàng đợi. Vì vậy thứ tự hợp lý là: độ trễ và tỉ lệ lỗi của từng phụ thuộc, rồi số kết nối đang chờ, rồi độ sâu hàng đợi. Nếu service chỉ có metric CPU và bộ nhớ thì bạn đang mù trước loại sự cố phổ biến nhất, và đó là điều cần sửa trước khi sự cố lặp lại.</p>`,
},
anchor: `CPU thấp kèm độ trễ cao là chữ ký của việc đang chờ phụ thuộc, nên phải đo độ trễ phụ thuộc chứ không chỉ đo tài nguyên của chính mình.`,
attacks: [
{ q: `Metric, log và trace khác nhau ở đâu, và bạn dùng cái nào khi nào?`, a: `Metric là số liệu tổng hợp theo thời gian, rẻ và luôn bật, dùng để phát hiện rằng có chuyện bất thường và để dựng alarm. Log là sự kiện rời rạc kèm ngữ cảnh, đắt hơn, dùng để tìm hiểu chi tiết một trường hợp cụ thể. Trace là đường đi của một request qua nhiều service kèm thời gian từng chặng, dùng để trả lời "chậm ở đâu" khi có nhiều thành phần. Trình tự thực tế: alarm từ metric để biết có sự cố, trace để khoanh vùng chặng chậm, log để biết chính xác dòng code nào.` },
{ q: `Correlation ID nên được sinh ở đâu và truyền thế nào?`, a: `Sinh ở điểm vào đầu tiên — API Gateway, load balancer, hoặc service đầu tiên nhận request — rồi truyền xuyên suốt qua header, qua payload của message trong hàng đợi, và qua mọi lời gọi service tiếp theo. Mọi dòng log nên kèm định danh đó, và nó cũng nên được trả về cho client trong header phản hồi để người dùng báo lỗi kèm mã. Điểm hay bị bỏ sót là hàng đợi: nếu định danh không được đặt vào message thì consumer mất liên kết với request gốc, và đó chính là lúc bạn cần nó nhất.` },
],
},
G14: {
incident: `<p>Một service đọc mật khẩu database từ biến môi trường của hàm Lambda. Khi cần xoay mật khẩu, đội phải sửa cấu hình hàm và deploy lại, mất 20 phút và gây gián đoạn. Trong một lần xoay khẩn cấp vì nghi ngờ lộ, có 12 phút service không kết nối được database. Ngoài ra mật khẩu nằm trong lịch sử phiên bản của hàm, nên vẫn đọc được sau khi đã đổi.</p>`,
askFirst: [
`Biến môi trường của hàm khác gì một kho secret?`,
`Vì sao xoay secret lại gây gián đoạn?`,
`Làm sao để xoay mà không phải deploy lại?`,
],
predict: {
q: `Một hàm Lambda đọc secret từ Secrets Manager ở mỗi lần gọi. Điều gì xảy ra với độ trễ và với chi phí?`,
a: `<p>Độ trễ tăng thêm một lời gọi mạng cho mỗi lần gọi hàm, thường vài chục mili giây, và chi phí API tăng theo số lần gọi. Cách đúng là đọc một lần ở pha khởi tạo và cache trong biến cấp module, chấp nhận rằng môi trường ấm sẽ dùng giá trị cũ cho tới khi bị thu hồi. Điều đó đặt ra một đánh đổi thật: secret mới xoay sẽ không được nhận ngay ở mọi môi trường đang ấm. Cách xử lý là cache kèm thời hạn ngắn, hoặc bắt lỗi xác thực rồi đọc lại secret một lần trước khi bỏ cuộc.</p>`,
},
anchor: `Secret trong biến môi trường bị đóng băng vào phiên bản cấu hình, nên xoay nó đòi hỏi deploy lại — còn secret đọc lúc chạy thì phải trả giá bằng độ trễ và bộ nhớ cache.`,
attacks: [
{ q: `Secrets Manager và Parameter Store khác nhau thế nào, chọn cái nào?`, a: `Parameter Store là dịch vụ cấu hình đa dụng: lưu chuỗi, danh sách, và cả giá trị mã hoá; có bậc miễn phí và phù hợp cho cấu hình không nhạy cảm hoặc ít thay đổi. Secrets Manager sinh ra cho vòng đời secret: nó hỗ trợ xoay tự động theo lịch thông qua hàm Lambda, có tích hợp sẵn với một số dịch vụ database, và tính phí theo secret và theo lời gọi API. Quy tắc thực dụng: nếu bạn cần xoay tự động thì Secrets Manager; nếu chỉ cần lưu cấu hình và vài giá trị mã hoá thì Parameter Store rẻ hơn.` },
{ q: `Nếu secret bị lộ, ngoài việc xoay thì bạn còn phải làm gì?`, a: `Xoay chỉ đóng cửa sổ lộ trong tương lai; nó không xoá dấu vết. Cần làm thêm bốn việc: đọc log truy cập để biết secret đã bị dùng từ đâu và khi nào; thu hồi mọi phiên hoặc token đã phát hành dựa trên secret đó; kiểm tra xem secret có xuất hiện ở chỗ khác không — lịch sử commit, log, ảnh container, biến môi trường của những service khác; và thêm phát hiện tự động để secret không lọt vào log hoặc vào lịch sử phiên bản cấu hình lần nữa.` },
],
},
G15: {
incident: `<p>Một ứng dụng phục vụ ảnh qua CloudFront trỏ tới bucket S3. Sau khi thay ảnh đại diện của một khách hàng, ảnh cũ vẫn hiển thị trong nhiều giờ. Đội xử lý bằng cách invalidate toàn bộ phân phối mỗi lần có thay đổi, và hoá đơn tăng vì số lượng invalidation vượt hạn mức miễn phí, đồng thời mỗi lần invalidate làm toàn bộ cache bị xoá nên tỉ lệ cache hit giảm mạnh.</p>`,
askFirst: [
`Vì sao ảnh cũ vẫn hiển thị dù file trên S3 đã đổi?`,
`Invalidate toàn bộ có tác dụng phụ gì?`,
`Có cách nào để nội dung mới xuất hiện ngay mà không phải invalidate?`,
],
predict: {
q: `Một object trên S3 bị ghi đè bằng nội dung mới, nhưng cùng tên. CloudFront có tự phục vụ nội dung mới không?`,
a: `<p>Không, cho tới khi hết TTL của object đó trong cache, hoặc cho tới khi bạn invalidate đường dẫn. CloudFront đã cache bản cũ và không có lý do gì để kiểm tra lại S3 trước khi hết hạn. Cách tránh hẳn vấn đề là đặt tên object theo nội dung — thêm hash của file hoặc số phiên bản vào tên — rồi trỏ URL tới tên mới. Khi tên đổi thì đó là một object mới trong cache, nên nội dung mới xuất hiện ngay mà không cần invalidate gì cả.</p>`,
},
anchor: `Cache phục vụ theo khoá là đường dẫn, nên đổi nội dung mà giữ nguyên tên thì bắt buộc phải chờ hết TTL hoặc invalidate — đổi tên theo nội dung là cách xoá bỏ vấn đề.`,
attacks: [
{ q: `Khi nào invalidate là lựa chọn đúng?`, a: `Khi nội dung buộc phải giữ nguyên đường dẫn và cần cập nhật ngay — ví dụ trang chủ, tệp cấu hình cố định, hoặc một bản vá bảo mật cần phổ biến lập tức. Ngoài những trường hợp đó, invalidate nên là ngoại lệ vì hai lý do: nó xoá cache nên các request tiếp theo đều phải quay về nguồn, làm tăng tải lên S3 và độ trễ; và số lượng invalidation có thể tính phí. Với tài nguyên có tên nội dung như bundle JavaScript hay ảnh có hash, bạn gần như không bao giờ cần invalidate.` },
{ q: `Vì sao cần phân biệt TTL cho HTML và TTL cho tài nguyên tĩnh?`, a: `Vì hai loại có yêu cầu trái ngược nhau. Tài nguyên tĩnh có tên chứa hash nội dung thì có thể đặt TTL rất dài — một năm cũng được — vì tên đổi mỗi khi nội dung đổi, nên không bao giờ phục vụ bản cũ sai. HTML thì ngược lại: nó trỏ tới các tài nguyên đó, nên cần TTL ngắn hoặc phải xác thực lại, nếu không người dùng sẽ tiếp tục nhận HTML cũ trỏ tới những tệp không còn tồn tại. Nhầm hai loại này là nguyên nhân của cả hai kiểu sự cố: hoặc người dùng thấy bản cũ mãi, hoặc mỗi lần tải trang đều phải quay về nguồn.` },
],
},
G16: {
incident: `<p>Một đội chuyển một dịch vụ từ Lambda sang ECS vì hoá đơn Lambda tăng. Dịch vụ xử lý 40 request mỗi giây liên tục suốt ngày, mỗi request mất khoảng 900 ms và mở một kết nối tới PostgreSQL. Sau khi chuyển, hoá đơn giảm 35% và p99 giảm vì không còn cold start. Nhưng ở một dịch vụ khác — xử lý ảnh theo đợt, có lúc 0 request trong nhiều giờ — việc chuyển sang ECS lại làm chi phí tăng gấp ba.</p>`,
askFirst: [
`Đặc điểm tải nào quyết định chi phí của mỗi lựa chọn?`,
`Vấn đề kết nối database khác nhau thế nào giữa hai mô hình?`,
`Khi nào cold start thực sự là vấn đề nghiêm trọng?`,
],
predict: {
q: `Một dịch vụ có lưu lượng rất thấp và không đều, nhưng mỗi request cần 2 GB bộ nhớ và chạy 40 giây. Lambda hay ECS?`,
a: `<p>Lambda vẫn thường thắng, vì bạn chỉ trả tiền cho thời gian chạy thực tế và không phải giữ máy nhàn rỗi. Bộ nhớ lớn làm mỗi lần gọi đắt hơn, nhưng tần suất thấp nên tổng vẫn nhỏ. Thời gian 40 giây nằm thoải mái trong giới hạn của hàm. Điều cần kiểm tra là ba thứ khác: thời gian khởi tạo có vượt ngân sách độ trễ không, có cần kết nối thường trực tới database không, và công việc có cần chạy nền lâu hơn giới hạn của hàm không. Nếu cả ba đều ổn thì Lambda rẻ hơn và ít việc vận hành hơn.</p>`,
},
anchor: `Lambda thắng khi tải thưa và không đều vì bạn chỉ trả cho thời gian chạy; container thắng khi tải đều và cao vì bạn trả cho một mức công suất cố định nhưng dùng hết nó.`,
attacks: [
{ q: `Vấn đề kết nối database khác nhau thế nào giữa Lambda và ECS?`, a: `Container có số thực thể biết trước, nên số kết nối tới database bị chặn trên bởi số container nhân với kích thước pool — một con số bạn chọn được. Lambda thì số thực thể đồng thời thay đổi theo tải, có thể từ vài chục lên hàng nghìn, và mỗi môi trường mở kết nối riêng. Vì vậy Lambda dễ làm cạn hạn mức kết nối của database. Cách xử lý thường dùng là đặt một lớp gộp kết nối ở giữa, giới hạn concurrency của hàm, hoặc dùng API dữ liệu thay vì kết nối trực tiếp.` },
{ q: `Cold start có luôn là vấn đề cần loại bỏ?`, a: `Không. Nó chỉ là vấn đề khi ngân sách độ trễ của nghiệp vụ chặt và lưu lượng thưa — ví dụ một API tương tác có p99 mục tiêu 200 ms. Với một job chạy nền, một cold start thêm 800 ms là không đáng kể so với tổng thời gian xử lý. Và với lưu lượng cao liên tục, tỉ lệ cold start rất nhỏ vì môi trường được tái dùng. Cách đối phó cũng có thứ tự: trước hết giảm khối lượng khởi tạo và đưa dependency nặng ra khỏi đường nóng, rồi mới cân nhắc provisioned concurrency — vì nó là giải pháp trả tiền để giữ môi trường nhàn rỗi.` },
],
},
G17: {
incident: `<p>Một đội quản lý hạ tầng bằng cách bấm tay trên console. Trong một lần sửa security group để mở tạm một cổng cho việc gỡ lỗi, không ai ghi lại. Ba tháng sau, một cuộc kiểm tra bảo mật phát hiện cổng đó vẫn mở. Không ai biết ai đã mở, khi nào, và có thứ gì khác phụ thuộc vào nó không. Việc dựng lại môi trường staging từ đầu mất ba ngày.</p>`,
askFirst: [
`Giá trị thật của hạ tầng dưới dạng code là gì?`,
`Điều gì xảy ra khi ai đó sửa tay trên console?`,
`Làm sao đưa một hệ thống đang chạy vào quản lý bằng code mà không gây sự cố?`,
],
predict: {
q: `Một stack đã được triển khai bằng CloudFormation, sau đó ai đó sửa tay một security group trên console. Lần deploy tiếp theo sẽ làm gì?`,
a: `<p>Lần deploy tiếp theo sẽ phát hiện sự khác biệt và đưa tài nguyên trở về đúng như khai báo trong template — tức là hoàn tác thay đổi thủ công đó. Đây vừa là điểm mạnh vừa là cái bẫy. Điểm mạnh là nó chống trôi dạt cấu hình và biến template thành nguồn sự thật duy nhất. Cái bẫy là nếu ai đó sửa tay để xử lý sự cố khẩn cấp và quên đưa thay đổi vào template, sự cố sẽ tái phát ở lần deploy sau, và lúc đó sẽ rất khó hiểu vì "không ai đổi gì cả".</p>`,
},
anchor: `Hạ tầng dưới dạng code biến cấu hình thành thứ đọc được, so sánh được và hoàn tác được — nhưng chỉ khi mọi thay đổi đều đi qua nó.`,
attacks: [
{ q: `Làm sao đưa một hệ thống đang chạy vào quản lý bằng code mà không gây sự cố?`, a: `Theo từng phần, không làm một lần. Bắt đầu bằng việc import những tài nguyên ít rủi ro và ít thay đổi — bucket, hàng đợi, bảng — và xác nhận rằng template mô tả đúng trạng thái hiện có trước khi áp dụng. Sau đó mới tới những phần có thay đổi gây gián đoạn như database hay phân phối. Điều tối quan trọng là bật phát hiện trôi dạt cấu hình ngay từ đầu để biết chỗ nào đang lệch, và đóng băng quyền sửa tay trên console bằng chính sách IAM — nếu không, hai nguồn sự thật sẽ cùng tồn tại và không ai biết cái nào đúng.` },
{ q: `CloudFormation rollback có phải lúc nào cũng cứu được bạn?`, a: `Không. Rollback hoàn tác được những thay đổi nó đã thực hiện, nhưng có những thứ không hoàn tác được: một migration database đã chạy, một bucket đã bị xoá cùng dữ liệu, một hàng đợi đã mất message, hoặc một thay đổi đã lan ra ngoài stack. Ngoài ra nếu quá trình rollback cũng thất bại, stack có thể kẹt ở trạng thái cần can thiệp thủ công. Vì vậy các thay đổi phá huỷ cần được tách thành bước riêng, có xác nhận, và có phương án dự phòng dữ liệu trước khi chạy.` },
],
},
E07: {
incident: `<p>Một endpoint tạo đơn hàng thực hiện ba bước: ghi bảng <code>orders</code>, trừ tồn kho, và ghi một dòng vào bảng <code>audit_log</code>. Bước ba ném lỗi vì một cột mới chưa được migrate. Kết quả: đơn hàng đã tồn tại, tồn kho đã bị trừ, nhưng không có dấu vết kiểm toán. Người dùng nhận lỗi 500 và bấm gửi lại, tạo ra đơn thứ hai và trừ tồn kho lần nữa.</p>`,
askFirst: [
`Ba bước ghi này có nằm trong cùng một transaction không?`,
`Điều gì quyết định transaction được commit hay rollback trong một framework?`,
`Nếu bước thứ ba là một lời gọi ra dịch vụ ngoài thì sao?`,
],
predict: {
q: `Trong một transaction, bạn ghi hai bảng rồi ném exception ở tầng ứng dụng. Nếu không có khối bắt lỗi nào gọi rollback, chuyện gì xảy ra với dữ liệu?`,
a: `<p>Phụ thuộc vào việc session có bị đóng đúng cách hay không, và đây chính là chỗ dễ sai. Nếu session được đóng mà không commit, mặc định là rollback, nên dữ liệu không được ghi. Nhưng nếu có một lần commit nào đó ở giữa — ví dụ một repository tự commit sau mỗi lần ghi — thì phần đã commit vẫn còn, và bạn có trạng thái dở dang. Vì vậy quy tắc là ranh giới transaction phải nằm ở một chỗ duy nhất do tầng điều phối request quyết định, không phải ở tầng repository.</p>`,
},
anchor: `Ranh giới transaction phải nằm ở một chỗ duy nhất; để mỗi repository tự commit là tự tay tạo ra trạng thái dở dang không thể rollback.`,
attacks: [
{ q: `Nếu bước thứ ba là gọi một dịch vụ bên ngoài thì transaction còn cứu được không?`, a: `Không, và đây là giới hạn cơ bản cần nói rõ trong phỏng vấn. Transaction của database chỉ bao trùm những gì nằm trong cùng một kết nối tới cùng một database. Một lời gọi HTTP ra ngoài không nằm trong đó, nên bạn không thể nguyên tử hoá nó bằng transaction. Cách xử lý là biến lời gọi ngoài thành một bước có thể thử lại và có tính idempotent, hoặc dùng mẫu outbox: ghi ý định gọi vào cùng transaction, rồi một tiến trình riêng đọc bảng đó và thực hiện lời gọi, đảm bảo cuối cùng nó cũng chạy.` },
{ q: `Transaction dài có tác dụng phụ gì?`, a: `Ba tác dụng phụ thực tế. Một là giữ khoá lâu hơn, làm tăng khả năng tranh chấp và deadlock với các transaction khác. Hai là với MVCC, một transaction dài ngăn việc dọn các phiên bản dòng cũ, làm bảng và index phình ra — đó là lý do các transaction để mở vô thời hạn là vấn đề vận hành thật. Ba là nó tăng cửa sổ mà một lỗi ở bước cuối có thể làm mất toàn bộ công việc. Nguyên tắc là transaction nên ngắn: không gọi mạng, không chờ người dùng, không xử lý file bên trong nó.` },
],
},
E08: {
incident: `<p>Một API FastAPI chạy 4 worker uvicorn trên một máy 4 nhân. Khi tải tăng, độ trễ tăng nhưng CPU chỉ ở 45%. Đội tăng lên 16 worker, và tình hình tệ hơn: p99 tăng, và một số request bắt đầu timeout. Nguyên nhân được tìm ra là các worker tranh nhau một kết nối tới một dịch vụ bên ngoài có giới hạn, cộng thêm chi phí chuyển ngữ cảnh.</p>`,
askFirst: [
`ASGI và WSGI khác nhau ở điểm nào về mô hình thực thi?`,
`Vì sao tăng số worker không tăng thông lượng trong trường hợp này?`,
`Số worker phù hợp liên quan gì tới số nhân?`,
],
predict: {
q: `Một ứng dụng ASGI chạy một worker với một event loop. Nếu một request chạy tác vụ CPU mất 2 giây, các request khác ra sao?`,
a: `<p>Chúng phải chờ, vì event loop là một luồng. Đây là điểm khác biệt cốt lõi so với WSGI: WSGI dùng mô hình một luồng hoặc một tiến trình cho mỗi request, nên một request chậm chỉ chặn chính nó, đổi lại chi phí bộ nhớ cho mỗi request rất cao. ASGI đạt được số kết nối đồng thời lớn hơn nhiều với ít tài nguyên hơn, nhưng đòi hỏi mọi thứ chạy trong event loop phải không chặn. Vì vậy với ASGI, một dòng code blocking là lỗi nghiêm trọng hơn nhiều so với trong WSGI.</p>`,
},
anchor: `ASGI đổi chi phí bộ nhớ mỗi request lấy yêu cầu không được chặn event loop, nên tăng số worker không cứu được một event loop bị chặn.`,
attacks: [
{ q: `Vậy số worker nên đặt bao nhiêu?`, a: `Với tác vụ chờ I/O, một worker cho mỗi nhân là điểm khởi đầu hợp lý, và đôi khi ít hơn cũng đủ vì một event loop đã xử lý được rất nhiều kết nối đồng thời. Với tác vụ CPU-bound, số worker bằng số nhân là giới hạn trên có ích, vì thêm nữa chỉ tạo tranh chấp. Điều quan trọng hơn con số là kiểm tra nút thắt nằm ở đâu: nếu tăng worker mà thông lượng không tăng, nút thắt nằm ở tài nguyên chia sẻ phía sau — database, connection pool, hay một dịch vụ ngoài — chứ không ở số worker.` },
{ q: `Làm sao biết một tiến trình đang bị chặn ở đâu?`, a: `Ba cách thực dụng. Một là bật chế độ debug của uvicorn để nhận cảnh báo về handle chạy quá lâu — nó chỉ ra chỗ chặn kèm thời gian. Hai là dùng profiler hoặc lấy mẫu stack của tiến trình để xem thời gian nằm ở hàm nào. Ba là đọc trace của một request chậm và tìm chặng nào chiếm nhiều thời gian nhất; nếu chặng đó là một lời gọi đồng bộ trong khi các chặng khác đều nhanh, bạn đã tìm ra thủ phạm.` },
],
},
E09: {
incident: `<p>Một endpoint nhận upload rồi dùng <code>BackgroundTasks</code> để gửi email xác nhận và tạo thumbnail. Trong một lần deploy, tiến trình bị dừng để cập nhật phiên bản đúng lúc 40 tác vụ đang chạy. Toàn bộ 40 email không bao giờ được gửi và không có dấu vết nào cho biết chúng đã mất. Người dùng đã nhận phản hồi thành công nên không ai báo lỗi.</p>`,
askFirst: [
`Tác vụ nền trong tiến trình sống ở đâu, và mất khi nào?`,
`Vì sao người dùng vẫn nhận phản hồi thành công?`,
`Khi nào cần một hàng đợi bền thay vì tác vụ nền?`,
],
predict: {
q: `Một tác vụ được đưa vào <code>BackgroundTasks</code> của FastAPI. Nó chạy ở đâu và vào lúc nào so với response?`,
a: `<p>Nó chạy trong cùng tiến trình của ứng dụng, sau khi response đã được gửi đi. Vì vậy nó không chặn người dùng, nhưng cũng không có gì bảo vệ nó: nếu tiến trình chết, tác vụ biến mất không dấu vết; nếu tác vụ ném lỗi, không có cơ chế thử lại; và nếu có mười worker, tác vụ chạy trên worker đã nhận request đó. Đây là công cụ phù hợp cho việc không quan trọng — ghi log, tăng một bộ đếm — chứ không phù hợp cho việc phải chắc chắn xảy ra.</p>`,
},
anchor: `Tác vụ nền trong tiến trình không có nơi lưu trữ, nên nó mất cùng tiến trình và không có gì để thử lại — việc phải chắc chắn xảy ra thì cần hàng đợi bền.`,
attacks: [
{ q: `Làm sao quyết định việc gì được dùng tác vụ nền và việc gì phải qua hàng đợi?`, a: `Hỏi ba câu. Nếu việc đó mất đi thì có ai bị ảnh hưởng không — nếu có, cần hàng đợi. Nếu việc đó cần thử lại khi thất bại — nếu có, cần hàng đợi. Nếu việc đó chạy lâu hơn vài giây hoặc cần tài nguyên riêng — nếu có, cần hàng đợi. Ngược lại, việc không quan trọng, không cần thử lại và chạy nhanh thì tác vụ nền trong tiến trình là đủ và rẻ hơn nhiều vì không phải vận hành thêm hạ tầng.` },
{ q: `Đưa việc vào hàng đợi có phải chỉ cần thay một dòng code?`, a: `Không, và đây là chi phí thật mà nhiều người đánh giá thấp. Bạn phải xử lý việc gửi message có thể thất bại, nên cần một cách để không mất việc giữa lúc ghi database và lúc gửi message — thường là mẫu outbox. Bạn phải viết consumer với logic thử lại và dead-letter queue. Bạn phải đối mặt với việc message có thể được giao hai lần, nên consumer phải idempotent. Và bạn cần theo dõi độ sâu hàng đợi cùng tuổi của message để biết hệ thống đang tụt lại. Đổi lại, bạn có được sự bảo đảm mà tác vụ nền không thể cho.` },
],
},
E10: {
incident: `<p>Bộ test của một API FastAPI ghi vào database phát triển dùng chung. Một test kiểm tra rằng danh sách người dùng rỗng sau khi xoá, nhưng chạy cả bộ thì đỏ vì một test khác đã tạo người dùng trước đó. Đội xử lý bằng cách chạy tuần tự, khiến bộ test mất 14 phút. Sau đó một test khác vẫn đỏ trên CI nhưng xanh ở máy cá nhân, vì CI có dữ liệu khác.</p>`,
askFirst: [
`Test này phụ thuộc vào trạng thái nào ngoài chính nó?`,
`Làm sao cô lập dữ liệu giữa các test?`,
`Khi nào nên ghi đè dependency?`,
],
predict: {
q: `Bạn ghi đè dependency lấy phiên database bằng một phiên dùng database test. Điều gì xảy ra với dependency đó trong một request?`,
a: `<p>Bản ghi đè được dùng thay cho bản gốc, và nếu dependency đó được khai báo ở nhiều chỗ trong cùng request thì FastAPI vẫn chỉ gọi nó một lần và dùng lại cùng một giá trị — cơ chế cache theo request. Điều này quan trọng vì nó có nghĩa là mọi tầng trong request chia sẻ đúng một phiên, nên transaction hoạt động như trong production. Nếu bạn ghi đè bằng một hàm tạo phiên mới mỗi lần gọi, bạn vô tình phá vỡ tính chia sẻ đó và test sẽ không còn phản ánh hành vi thật.</p>`,
},
anchor: `Test chỉ đáng tin khi nó tự tạo và tự dọn trạng thái của mình — phụ thuộc vào dữ liệu có sẵn là biến test thành một quan sát về môi trường.`,
attacks: [
{ q: `Làm sao cô lập database giữa các test mà vẫn nhanh?`, a: `Ba cách phổ biến, đánh đổi khác nhau. Một là bọc mỗi test trong một transaction rồi rollback ở cuối — nhanh nhất, nhưng không kiểm tra được những hành vi phụ thuộc vào commit thật. Hai là tạo schema riêng cho mỗi test rồi xoá sau khi xong — cô lập tốt, chậm hơn. Ba là dùng container dùng một lần cho mỗi phiên chạy test, rồi dọn bảng giữa các test — gần với production nhất, chậm nhất. Nhiều đội kết hợp: container cho cả phiên, và rollback transaction cho phần lớn test, chỉ những test cần commit thật mới dùng cách dọn bảng.` },
{ q: `Test chạy nhanh nhưng không bắt được lỗi thật — vấn đề nằm ở đâu?`, a: `Thường ở chỗ mock quá nhiều. Nếu test mock cả tầng database, cả tầng gọi mạng, và cả tầng serialization thì nó chỉ còn kiểm tra rằng code gọi đúng các hàm mà bạn đã giả định — nó không kiểm tra hành vi. Dấu hiệu nhận biết là test vẫn xanh khi bạn đổi schema database, hoặc khi bạn đổi hình dạng response. Cách sửa không phải là viết thêm test mà là hạ ranh giới mock xuống: giữ mock ở hệ thống bên ngoài, còn database và tầng HTTP của chính ứng dụng thì để thật.` },
],
},
E11: {
incident: `<p>Một API DRF trả về trường <code>total_price</code> tính từ các dòng chi tiết. Serializer khai báo nó là <code>SerializerMethodField</code>, và phương thức đó duyệt quan hệ <code>items</code>. Với danh sách 500 đơn, endpoint mất 12 giây vì mỗi đơn phát sinh một truy vấn. Ngoài ra, khi validate đầu vào, serializer chấp nhận một trường mà client không nên được đặt, và dữ liệu đó được ghi thẳng vào model.</p>`,
askFirst: [
`Serializer đang làm hai việc gì cùng lúc?`,
`Vì sao trường tính toán lại gây ra truy vấn?`,
`Làm sao ngăn client đặt những trường không được phép?`,
],
predict: {
q: `Một DRF serializer có <code>fields = "__all__"</code> và model có trường <code>is_staff</code>. Chuyện gì xảy ra khi client gửi <code>is_staff: true</code>?`,
a: `<p>Giá trị đó được chấp nhận và ghi vào model, trừ khi bạn chặn bằng cách khác. Đây là lỗi gán trường hàng loạt kinh điển: <code>__all__</code> biến mọi trường của model thành trường client có thể đặt, kể cả những trường chỉ nên do server quyết định như vai trò, trạng thái, số dư hay cờ xác thực. Cách sửa là liệt kê tường minh các trường được phép, và với những trường chỉ đọc thì khai báo <code>read_only=True</code>. Quy tắc an toàn là danh sách cho phép, không bao giờ là danh sách loại trừ.</p>`,
},
anchor: `Serializer vừa là hàng rào kiểm tra đầu vào vừa là lớp trình bày đầu ra, nên một khai báo rộng ở đây vừa mở lỗ hổng gán trường vừa tạo truy vấn ẩn.`,
attacks: [
{ q: `DRF serializer và Pydantic model khác nhau ở điểm nào về triết lý?`, a: `Pydantic sinh ra cho việc kiểm tra và chuyển đổi dữ liệu: nó đọc annotation kiểu, ép kiểu theo quy tắc rõ ràng, và tách biệt hoàn toàn khỏi tầng lưu trữ. DRF serializer gắn chặt với ORM: nó có thể tạo và cập nhật instance, gọi <code>save()</code>, và các phương thức <code>create</code>/<code>update</code> là một phần của giao diện. Vì vậy DRF tiện hơn cho CRUD nhanh, nhưng cũng dễ trộn lẫn hai trách nhiệm — kiểm tra dữ liệu và thao tác lưu trữ — khiến việc tái sử dụng và kiểm thử khó hơn. Trong FastAPI, hai việc đó bị tách ra và thường rõ ràng hơn.` },
{ q: `Làm sao tránh N+1 trong serializer?`, a: `Xác định trước những quan hệ mà serializer sẽ chạm, rồi nạp chúng trong queryset bằng <code>select_related</code> cho quan hệ một-nhiều và <code>prefetch_related</code> cho quan hệ nhiều-nhiều hoặc đảo chiều. Với trường tính toán, cân nhắc tính ở tầng database bằng annotation thay vì duyệt quan hệ trong Python. Cách phát hiện là đếm số truy vấn trong test — nhiều đội đặt một ngưỡng và làm test đỏ khi vượt, vì đó là cách duy nhất để lỗi N+1 không quay lại sau này.` },
],
},
E12: {
incident: `<p>Một API DRF dùng viewset mặc định nên mọi endpoint đều yêu cầu đăng nhập, trừ một endpoint được đánh dấu cho phép truy cập công khai. Một dev thêm một action mới vào viewset và quên đặt lại quyền, nên action đó thừa hưởng quyền công khai và trả về danh sách toàn bộ người dùng cho bất kỳ ai. Ngoài ra, không có giới hạn tần suất nên một client gọi 40.000 lần trong một giờ.</p>`,
askFirst: [
`Quyền của một action mới được thừa hưởng từ đâu?`,
`Vì sao mặc định nên là từ chối chứ không phải cho phép?`,
`Throttle nên đặt theo cái gì?`,
],
predict: {
q: `Một viewset có <code>permission_classes = [IsAuthenticated]</code>, nhưng một action riêng khai báo <code>permission_classes = [AllowAny]</code>. Action đó có yêu cầu đăng nhập không?`,
a: `<p>Không. Khai báo ở mức action ghi đè hoàn toàn khai báo ở mức viewset, không phải bổ sung thêm. Đây là lý do các lỗi phân quyền kiểu này khó thấy khi đọc code: bạn nhìn thấy <code>IsAuthenticated</code> ở đầu lớp và tin rằng cả lớp được bảo vệ. Cách phòng ngừa là đặt mặc định ở cấu hình toàn cục là từ chối, rồi mỗi view phải chủ động mở — như vậy một khai báo thiếu sẽ dẫn tới chặn nhầm chứ không phải mở nhầm.</p>`,
},
anchor: `Quyền khai báo ở mức action ghi đè mức viewset, nên mặc định an toàn phải là từ chối và mỗi chỗ mở quyền là một quyết định tường minh.`,
attacks: [
{ q: `Throttle nên đặt theo cái gì, và nó có thay thế được xác thực không?`, a: `Throttle nên đặt theo danh tính khi có thể — theo người dùng đã đăng nhập — và theo địa chỉ nguồn khi ẩn danh. Với những endpoint đắt đỏ như gửi email hay tạo tài nguyên, nên có một hạn mức riêng chặt hơn hạn mức chung. Throttle không thay thế xác thực: nó chỉ giới hạn tần suất, không quyết định ai được làm gì. Và cần nhớ rằng nếu ứng dụng chạy sau một proxy, địa chỉ nguồn phải được đọc từ header đúng do proxy đặt, nếu không mọi request sẽ trông như đến từ cùng một địa chỉ.` },
{ q: `Nếu có nhiều worker chạy song song thì throttle còn chính xác không?`, a: `Không, nếu bộ đếm nằm trong bộ nhớ của từng tiến trình. Mỗi worker đếm riêng, nên hạn mức thực tế bằng hạn mức nhân với số worker — và với mười worker thì giới hạn của bạn lỏng hơn mười lần so với ý định. Cách đúng là dùng một kho đếm chia sẻ như Redis, với thao tác tăng và kiểm tra được thực hiện nguyên tử. Đánh đổi là thêm một phụ thuộc mạng vào đường nóng của mọi request, nên cần có phương án khi kho đếm đó không truy cập được: thường là cho qua kèm ghi log, thay vì chặn toàn bộ hệ thống.` },
],
},
};
