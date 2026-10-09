// Batch FD — web/security D07..D14 and PostgreSQL F02, F05..F07, F09..F12.
export default {
D07: {
incident: `<p>Một API trả về chi tiết hoá đơn theo đường dẫn <code>/api/invoices/1042</code>. Endpoint yêu cầu đăng nhập, và mọi người dùng đã đăng nhập đều gọi được. Một người dùng đổi số cuối thành 1043 và đọc được hoá đơn của khách hàng khác, gồm cả tên, địa chỉ và số tiền. Không có lỗi nào trong log vì request hoàn toàn hợp lệ về mặt xác thực.</p>`,
askFirst: [
`Xác thực đã trả lời câu hỏi gì, và còn thiếu câu hỏi nào?`,
`Kiểm tra quyền nên dựa trên vai trò hay trên quan hệ với tài nguyên?`,
`Vì sao log không có gì bất thường?`,
],
predict: {
q: `Một endpoint có kiểm tra <code>user.role == "admin"</code> trước khi trả về tài nguyên. Người dùng có vai trò <code>user</code> nhưng là chủ sở hữu tài nguyên đó có truy cập được không?`,
a: `<p>Không, và đây là kiểu sai theo hướng ngược lại: chặn nhầm người có quyền hợp lệ. Kiểm tra vai trò trả lời "người này thuộc nhóm nào", nhưng câu hỏi thật của phần lớn endpoint là "người này có quan hệ gì với tài nguyên cụ thể này". Hai câu hỏi khác nhau và cần hai lớp kiểm tra khác nhau: vai trò quyết định được làm loại hành động gì, còn quan hệ sở hữu quyết định được chạm vào bản ghi nào. Thiếu lớp thứ hai chính là lỗi tham chiếu đối tượng trực tiếp.</p>`,
},
anchor: `Xác thực trả lời "bạn là ai", phân quyền trả lời "bạn được chạm vào bản ghi nào" — thiếu vế thứ hai là lỗ hổng đọc dữ liệu người khác.`,
attacks: [
{ q: `Kiểm tra quyền nên đặt ở đâu trong luồng request?`, a: `Ở một chỗ mà mọi đường vào đều phải đi qua, và gắn với truy vấn chứ không gắn với kiểm tra sau truy vấn. Cách chắc chắn nhất là lọc ngay trong câu truy vấn — thêm điều kiện chủ sở hữu vào <code>WHERE</code> — để không tồn tại đường nào lấy được bản ghi mà không qua bộ lọc. Kiểm tra sau khi đã đọc bản ghi là cách dễ quên ở một nhánh mới. Nếu có nhiều endpoint cùng quy tắc, hãy đặt nó ở tầng truy cập dữ liệu hoặc một dependency dùng chung, để một endpoint mới không thể vô tình bỏ qua.` },
{ q: `RBAC và kiểm tra sở hữu có thay thế được nhau không?`, a: `Không, chúng trả lời hai câu hỏi khác nhau và phần lớn hệ thống cần cả hai. RBAC trả lời "vai trò này được làm hành động gì" — ví dụ chỉ kế toán mới được duyệt chi. Kiểm tra sở hữu trả lời "bản ghi này có thuộc phạm vi của người này không" — ví dụ nhân viên chỉ xem được đơn của khách hàng mình phụ trách. Một hệ thống chỉ có RBAC sẽ cho mọi nhân viên xem đơn của mọi khách hàng; một hệ thống chỉ có kiểm tra sở hữu sẽ cho chủ sở hữu làm những việc mà nghiệp vụ không cho phép.` },
],
},
D08: {
incident: `<p>Một ứng dụng dùng JWT làm access token với thời hạn 24 giờ để tránh việc người dùng phải đăng nhập lại. Một nhân viên nghỉ việc, tài khoản bị vô hiệu hoá, nhưng token của họ vẫn dùng được tới 23 giờ sau đó. Đội giảm thời hạn xuống 15 phút và thêm refresh token, nhưng giờ họ không có cách nào thu hồi refresh token khi người dùng bị khoá.</p>`,
askFirst: [
`Vì sao JWT không thu hồi được?`,
`Đánh đổi giữa thời hạn ngắn và số lần làm mới là gì?`,
`Refresh token nên được lưu ở đâu?`,
],
predict: {
q: `Một JWT đã phát hành với thời hạn 1 giờ. Bạn xoá người dùng khỏi database. Token đó còn dùng được không?`,
a: `<p>Còn, cho tới khi hết hạn. JWT là một khẳng định tự chứa: server kiểm tra chữ ký và thời hạn, không truy vấn database để hỏi xem người dùng còn tồn tại hay không. Đó chính là ưu điểm của nó — không cần tra cứu — và cũng chính là nhược điểm — không thu hồi được. Muốn thu hồi được thì phải thêm một bước tra cứu trạng thái, và khi đó bạn đã đánh đổi mất phần lợi ích chính của JWT.</p>`,
},
anchor: `JWT tự chứa nên không thu hồi được — muốn thu hồi thì phải thêm tra cứu trạng thái, và khi đó bạn trả lại đúng chi phí mà JWT được chọn để tránh.`,
attacks: [
{ q: `Vậy làm sao thu hồi được quyền truy cập ngay lập tức?`, a: `Có ba cách, đánh đổi khác nhau. Một là giữ thời hạn access token rất ngắn — vài phút — để cửa sổ thu hồi hẹp, chấp nhận nhiều lần làm mới hơn. Hai là duy trì một danh sách thu hồi và kiểm tra nó ở mỗi request, đổi lại mất tính phi trạng thái và thêm một phép tra cứu vào đường nóng. Ba là dùng phiên phía server với định danh phiên trong cookie, và xoá phiên khi cần thu hồi — đơn giản nhất nếu bạn không cần chia sẻ danh tính qua nhiều hệ thống độc lập.` },
{ q: `Refresh token nên lưu ở đâu phía client?`, a: `Trong cookie <code>HttpOnly</code>, <code>Secure</code>, và <code>SameSite</code> phù hợp, vì JavaScript không đọc được nên một lỗ hổng XSS không lấy được nó. Lưu trong bộ nhớ cục bộ thì tiện nhưng mọi script trên trang đều đọc được, và đó là lý do phổ biến nhất khiến token bị đánh cắp. Điều cần thêm là cơ chế xoay refresh token mỗi lần dùng và phát hiện dùng lại: nếu một refresh token đã dùng lại xuất hiện lần thứ hai, đó là dấu hiệu bị đánh cắp, và nên thu hồi cả chuỗi.` },
],
},
D09: {
incident: `<p>Ba endpoint trong cùng một API trả lỗi theo ba định dạng khác nhau: một cái trả chuỗi thuần, một cái trả <code>{"error": "..."}</code>, một cái trả mảng lỗi của framework. Client phải viết ba nhánh xử lý. Ngoài ra, tài liệu OpenAPI hiển thị sai kiểu của một trường vì nó được khai báo là chuỗi nhưng thực tế trả về số, và điều đó chỉ lộ ra khi một đối tác tích hợp bị lỗi.</p>`,
askFirst: [
`Vì sao định dạng lỗi thống nhất lại quan trọng với client?`,
`OpenAPI được sinh từ đâu, và khi nào nó nói dối?`,
`Kiểm tra đầu vào nên trả về mã trạng thái nào?`,
],
predict: {
q: `Client gửi một trường có kiểu sai, ví dụ số cho một trường khai báo chuỗi. API nên trả về mã nào?`,
a: `<p>Về mặt ngữ nghĩa, đây là lỗi thực thể chứ không phải lỗi cú pháp: cú pháp JSON đúng nhưng nội dung không thoả schema, nên mã phù hợp là 422. Nhiều API trả 400 cho mọi lỗi đầu vào, điều đó chấp nhận được nhưng kém chính xác. Điều quan trọng hơn mã là tính nhất quán: cùng một loại lỗi phải luôn trả cùng một mã và cùng một cấu trúc thân, để client xử lý bằng một nhánh duy nhất. Cấu trúc nên có ít nhất một mã lỗi máy đọc được, một thông điệp cho người đọc, và đường dẫn tới trường gây lỗi.</p>`,
},
anchor: `Định dạng lỗi là một phần của hợp đồng API, nên ba định dạng cho cùng một loại lỗi nghĩa là ba lần client phải đoán.`,
attacks: [
{ q: `Làm sao giữ OpenAPI khớp với thực tế?`, a: `Sinh nó từ chính kiểu dữ liệu mà code dùng, chứ không viết tay. Trong FastAPI, khai báo <code>response_model</code> cho mỗi endpoint để framework vừa lọc dữ liệu trả về vừa sinh tài liệu đúng. Thêm một test so sánh response thật với schema đã sinh — nhiều thư viện làm được việc này — để tài liệu sai làm test đỏ. Và với những trường hợp không biểu diễn được bằng kiểu, hãy ghi rõ trong mô tả endpoint thay vì để người đọc tự suy đoán.` },
{ q: `Có nên trả về chi tiết lỗi kiểm tra cho client không?`, a: `Có, nhưng chỉ chi tiết về hình dạng dữ liệu, không chi tiết về hệ thống. Nói "trường <code>email</code> không đúng định dạng" là hữu ích và an toàn. Nói "truy vấn thất bại tại cột <code>users.email_verified_at</code> vì ràng buộc duy nhất" là rò rỉ cấu trúc database cho người ngoài. Nguyên tắc là thông điệp cho client mô tả <em>cái gì sai với dữ liệu bạn gửi</em>, còn chi tiết nội bộ đi vào log phía server kèm định danh để tra cứu.` },
],
},
D10: {
incident: `<p>Một service gọi API đối tác để tra cứu địa chỉ. Đối tác bắt đầu trả lỗi 503 trong khoảng 90 giây. Vì code có retry ba lần ngay lập tức, mỗi request của người dùng tạo thêm ba lời gọi, và trong hai phút service gửi 60.000 request tới một hệ thống đang quá tải. Đối tác chặn địa chỉ IP của công ty trong 30 phút, và giờ ngay cả những request lẽ ra thành công cũng hỏng.</p>`,
askFirst: [
`Vì sao retry ngay lập tức làm tình hình tệ hơn?`,
`Backoff và jitter giải quyết vấn đề gì khác nhau?`,
`Timeout nên đặt bao nhiêu, và dựa trên cái gì?`,
],
predict: {
q: `Một nghìn client cùng gặp lỗi tại cùng một thời điểm và cùng retry sau đúng 1 giây. Chuyện gì xảy ra với hệ thống phía sau?`,
a: `<p>Nó bị dội một đợt một nghìn request cùng lúc, đúng bằng đợt vừa làm nó quá tải. Đây là hiệu ứng đồng bộ: retry có backoff nhưng không có jitter vẫn tạo ra các đợt tấn công đồng loạt theo chu kỳ. Jitter — thêm một khoảng ngẫu nhiên vào thời gian chờ — làm lệch pha các client, biến một đợt dội thành một dòng request trải đều. Đó là lý do jitter không phải chi tiết làm đẹp mà là điều kiện để backoff thực sự hoạt động.</p>`,
},
anchor: `Retry không có backoff và jitter biến một sự cố ngắn thành một đợt tấn công đồng loạt vào hệ thống đang yếu.`,
attacks: [
{ q: `Timeout nên đặt bao nhiêu?`, a: `Dựa trên ngân sách độ trễ của nghiệp vụ, không dựa trên cảm giác. Nếu endpoint có mục tiêu p99 là 800 ms và nó gọi ba phụ thuộc, mỗi phụ thuộc không nên chiếm quá một phần ngân sách đó. Một cách làm thực dụng là đặt timeout theo phân vị cao của phụ thuộc đó cộng biên, ví dụ p99 nhân 1,5, và điều chỉnh khi có số liệu thật. Điều cần tránh là để timeout mặc định vô hạn, vì khi đó một phụ thuộc treo sẽ giữ tài nguyên của bạn cho tới khi tầng trên cắt — và tầng trên thường cắt muộn hơn nhiều.` },
{ q: `Circuit breaker khác retry ở đâu?`, a: `Retry giả định rằng lỗi là tạm thời và thử lại sẽ thành công. Circuit breaker giả định ngược lại: sau một số lỗi liên tiếp, nó ngừng gọi hẳn trong một khoảng, để hệ thống phía sau có thời gian hồi phục và để bạn không tiêu tốn tài nguyên vào những lời gọi gần như chắc chắn thất bại. Hai cơ chế bổ sung cho nhau: retry cho lỗi thoáng qua, circuit breaker cho sự cố kéo dài. Thiếu circuit breaker là lý do phổ biến khiến một phụ thuộc hỏng kéo sập cả hệ thống gọi nó.` },
],
},
D11: {
incident: `<p>Một cổng thanh toán gọi webhook tới hệ thống của bạn mỗi khi giao dịch đổi trạng thái. Trong một đợt đối tác gặp sự cố mạng, cùng một webhook được gửi lại 14 lần trong 20 phút. Hệ thống xử lý cả 14 lần và cộng tiền vào số dư 14 lần. Ngoài ra, endpoint webhook không kiểm tra chữ ký, nên bất kỳ ai biết đường dẫn cũng gửi được một thông báo giả.</p>`,
askFirst: [
`Vì sao webhook gần như luôn được gửi lại nhiều lần?`,
`Làm sao phân biệt hai lần gửi của cùng một sự kiện với hai sự kiện thật?`,
`Xác thực webhook dựa trên gì?`,
],
predict: {
q: `Bạn nhận một webhook và ghi kết quả vào database, sau đó trả về 500 vì một lỗi tạm thời ở bước ghi log. Đối tác sẽ làm gì?`,
a: `<p>Nó gửi lại webhook đó, vì phản hồi không phải mã thành công nghĩa là bạn chưa xử lý xong. Lần gửi thứ hai đến khi kết quả đã được ghi từ lần đầu, nên nếu handler không có ranh giới idempotency, hiệu ứng sẽ được áp dụng hai lần. Đây là lý do thứ tự đúng là: xác thực chữ ký, kiểm tra và ghi kết quả trong một thao tác nguyên tử theo định danh sự kiện, rồi mới trả về thành công — và mọi việc phụ như ghi log phải được đặt sau hoặc được bọc để không làm hỏng phản hồi.</p>`,
},
anchor: `Webhook là giao vận at-least-once, nên bên nhận phải tự chống trùng theo định danh sự kiện chứ không thể giả định mỗi sự kiện chỉ đến một lần.`,
attacks: [
{ q: `Xác thực webhook nên dựa trên gì?`, a: `Trên một chữ ký HMAC tính từ thân request bằng một khoá bí mật chia sẻ, kèm dấu thời gian để chống phát lại. So sánh chữ ký phải dùng phép so sánh có thời gian không đổi để tránh rò rỉ thông tin qua thời gian phản hồi. Điều không dùng được là một token tĩnh trong header: nó không ràng buộc với nội dung nên ai đọc được một request là phát lại được bất kỳ nội dung nào. Và nên từ chối những request có dấu thời gian lệch quá một khoảng, thường là vài phút.` },
{ q: `Idempotency key cho API của chính bạn khác gì chống trùng webhook?`, a: `Cơ chế giống nhau, nhưng nguồn gốc khoá khác nhau. Với API của bạn, client sinh khoá và gửi trong header cho mỗi thao tác nghiệp vụ; server lưu khoá kèm kết quả và trả lại chính kết quả đó cho mọi lần gửi lặp. Với webhook, khoá do bên gửi đặt trong thân sự kiện — thường là định danh sự kiện — và bạn dùng nó để chống trùng. Trong cả hai trường hợp, điều kiện then chốt là việc kiểm tra và việc ghi phải nguyên tử, nếu không hai request đồng thời vẫn cùng vượt qua được bước kiểm tra.` },
],
},
D12: {
incident: `<p>Một endpoint danh sách sản phẩm trả về 200 KB JSON mỗi lần gọi. Trình duyệt tải lại toàn bộ dữ liệu mỗi lần người dùng quay lại trang, dù dữ liệu chỉ đổi vài lần mỗi ngày. Sau khi thêm <code>Cache-Control: max-age=3600</code>, người dùng phàn nàn rằng giá cũ vẫn hiển thị sau khi quản trị viên cập nhật, và không có cách nào buộc làm mới ngoài việc chờ hết một giờ.</p>`,
askFirst: [
`Cái gì quyết định một response có được cache hay không?`,
`Làm sao để client kiểm tra dữ liệu có đổi không mà không tải lại toàn bộ?`,
`Làm sao vừa cache được vừa cập nhật được ngay khi cần?`,
],
predict: {
q: `Client gửi <code>If-None-Match</code> với một ETag khớp với phiên bản hiện tại của tài nguyên. Server trả về gì?`,
a: `<p>Server trả về 304 Not Modified với thân rỗng. Đây là điểm quan trọng về hiệu quả: client vẫn thực hiện một vòng request, nhưng tiết kiệm được toàn bộ phần thân — với response 200 KB thì đó là phần lớn chi phí. Cơ chế này cho phép bạn đặt thời hạn cache ngắn mà không lo phục vụ dữ liệu cũ, vì mỗi lần dùng lại client đều hỏi server xem có gì mới. Điều cần chú ý là 304 không có thân, nên client phải dùng bản đã lưu chứ không được ghi đè bằng rỗng.</p>`,
},
anchor: `ETag biến việc kiểm tra "có gì mới không" thành một vòng request rẻ, cho phép cache ngắn hạn mà vẫn phục vụ được dữ liệu mới.`,
attacks: [
{ q: `Rate limiting nên đặt theo cái gì, và trả về mã nào?`, a: `Theo danh tính khi có thể — người dùng, khoá API — và theo địa chỉ nguồn khi ẩn danh. Mã trả về khi vượt hạn mức là 429, kèm header <code>Retry-After</code> để client biết khi nào thử lại. Nên có nhiều hạn mức chồng nhau: một hạn mức chung cho toàn bộ API, và những hạn mức chặt hơn cho các endpoint đắt đỏ như gửi email, tạo tài nguyên, hay tìm kiếm phức tạp. Điều cần tránh là chỉ có một hạn mức duy nhất, vì khi đó một endpoint nặng có thể tiêu hết quota của cả ứng dụng.` },
{ q: `Làm sao buộc làm mới cache ngay khi dữ liệu đổi?`, a: `Dùng tên phiên bản trong đường dẫn hoặc tham số — thêm một số phiên bản hoặc hash nội dung vào URL — để khi dữ liệu đổi thì đó là một URL khác, và cache cũ không còn được dùng. Với dữ liệu không thể đổi tên, dùng ETag kèm thời hạn ngắn: client sẽ kiểm tra lại mỗi lần và nhận 304 nếu chưa đổi, nên chi phí gần như bằng không. Với cache ở tầng CDN, có thể xoá theo đường dẫn khi dữ liệu đổi. Điều không nên làm là đặt thời hạn dài rồi dựa vào việc xoá cache thủ công — đó là cách chắc chắn sẽ có lúc ai đó quên.` },
],
},
D13: {
incident: `<p>Một endpoint tìm kiếm nối chuỗi trực tiếp vào câu SQL. Một người dùng nhập một chuỗi có dấu nháy đơn và nhận về toàn bộ bảng người dùng kèm mật khẩu đã băm. Cùng tuần đó, một trang hiển thị tên khách hàng không escape nội dung, nên một khách hàng đặt tên có thẻ script và script đó chạy trong trình duyệt của nhân viên hỗ trợ. Ngoài ra, log của service ghi cả header Authorization và số thẻ.</p>`,
askFirst: [
`Vì sao tham số hoá lại ngăn được SQL injection?`,
`Escape ở đầu ra khác gì kiểm tra ở đầu vào?`,
`Dữ liệu nhạy cảm cần được xử lý thế nào trước khi ghi log?`,
],
predict: {
q: `Một truy vấn dùng tham số hoá <code>WHERE name = $1</code> với giá trị <code>O'Brien</code>. Chuyện gì xảy ra?`,
a: `<p>Nó tìm đúng người tên <code>O'Brien</code> và không có lỗi cú pháp. Đây là điểm cốt lõi: tham số hoá không phải là escape ký tự, mà là gửi câu lệnh và dữ liệu qua hai kênh riêng biệt. Server phân tích cú pháp câu lệnh trước, khi giá trị còn chưa được biết, nên dữ liệu không bao giờ được hiểu như mã. Vì vậy không có chuỗi đầu vào nào có thể thay đổi cấu trúc truy vấn — khác hẳn với việc nối chuỗi rồi tự escape, nơi chỉ cần một trường hợp biên bị bỏ sót là đủ.</p>`,
},
anchor: `Tham số hoá tách câu lệnh khỏi dữ liệu ở tầng giao thức, nên không có chuỗi đầu vào nào thay đổi được cấu trúc truy vấn.`,
attacks: [
{ q: `Vì sao escape ở đầu vào là cách tiếp cận sai?`, a: `Vì bạn phải escape đúng cho mọi ngữ cảnh mà dữ liệu sẽ đi qua — SQL, HTML, thuộc tính HTML, URL, JavaScript nhúng, header — và mỗi ngữ cảnh có quy tắc riêng. Escape một lần ở đầu vào không biết trước dữ liệu sẽ được dùng ở đâu, nên gần như chắc chắn sai ở ít nhất một chỗ. Ngoài ra, escape làm hỏng dữ liệu gốc: tên người dùng lưu dạng đã escape sẽ hiển thị sai ở chỗ khác. Nguyên tắc đúng là lưu dữ liệu thô, và escape ở đúng ngữ cảnh tại thời điểm hiển thị.` },
{ q: `Log nhạy cảm gây hại như thế nào?`, a: `Log thường được đọc bởi nhiều người hơn dữ liệu gốc, được lưu lâu hơn, và được sao chép sang hệ thống khác mà không có cùng mức kiểm soát truy cập. Một token ghi vào log có thể bị dùng để mạo danh trong nhiều giờ. Một số thẻ ghi vào log có thể đưa hệ thống vào phạm vi tuân thủ mà bạn không lường trước. Cách xử lý là có một danh sách các trường luôn bị che ở tầng ghi log — không phải dựa vào việc từng lập trình viên nhớ — và định kỳ rà lại xem log có chứa gì ngoài dự kiến.` },
],
},
D14: {
incident: `<p>Một ứng dụng ẩn nút xoá với người dùng không phải quản trị viên, và chặn route quản trị ở tầng router. Một người dùng mở công cụ phát triển, gọi trực tiếp API xoá với định danh của một bản ghi bất kỳ, và xoá thành công. Việc ẩn nút và chặn route không hề ảnh hưởng tới API.</p>`,
askFirst: [
`Tầng giao diện bảo vệ được gì?`,
`Vì sao "không hiển thị nút" không phải là biện pháp kiểm soát?`,
`Kiểm tra quyền phải nằm ở đâu để có hiệu lực?`,
],
predict: {
q: `Một API xoá tài nguyên yêu cầu đăng nhập nhưng không kiểm tra vai trò. Nếu giao diện ẩn nút xoá với người dùng thường, API có an toàn không?`,
a: `<p>Không. Giao diện chạy trên máy của người dùng, dưới sự kiểm soát của người dùng. Họ có thể đọc mã nguồn, mở công cụ phát triển, hoặc gọi API bằng bất kỳ công cụ nào khác. Ẩn nút chỉ là một quy ước về trải nghiệm, không phải một hàng rào kỹ thuật. Bất kỳ biện pháp kiểm soát nào chỉ tồn tại ở phía client đều có thể bị vô hiệu hoá bởi chính người dùng mà nó định hạn chế — nên quyền phải được kiểm tra ở server cho từng request.</p>`,
},
anchor: `Mọi thứ chạy trên máy người dùng đều nằm dưới sự kiểm soát của người dùng, nên kiểm soát quyền chỉ có hiệu lực khi nằm ở server.`,
attacks: [
{ q: `Vậy lớp giao diện có giá trị gì trong bảo mật?`, a: `Giá trị về trải nghiệm và về giảm bề mặt rò rỉ, không phải về ngăn chặn. Ẩn chức năng giúp người dùng không bấm nhầm vào việc họ không được phép làm, và tránh cho họ thấy những lỗi 403 khó hiểu. Ở một số trường hợp, việc không tải bundle của khu vực quản trị giúp giảm lượng thông tin về cấu trúc hệ thống mà người ngoài quan sát được. Nhưng phải nói rõ: đây là lớp phòng ngừa thừa. Nếu API không kiểm tra thì lớp giao diện không cứu được gì.` },
{ q: `Làm sao kiểm tra rằng API thực sự được bảo vệ?`, a: `Bằng test tự động chạy với danh tính của từng vai trò và cố tình gọi những hành động không được phép, kỳ vọng nhận 403 chứ không phải 200. Quan trọng là phải kiểm tra cả trường hợp chéo: người dùng A cố truy cập tài nguyên của người dùng B, vì đó là lỗi tham chiếu đối tượng trực tiếp và không thể phát hiện bằng cách chỉ kiểm tra vai trò. Một cách làm hiệu quả là sinh test cho mọi cặp endpoint và vai trò, để một endpoint mới thêm vào mà thiếu kiểm tra quyền sẽ làm test đỏ ngay.` },
],
},
F02: {
incident: `<p>Một báo cáo doanh thu theo khách hàng chạy đúng trên dữ liệu thử nhưng thiếu mất 40 khách hàng trên dữ liệu thật. Truy vấn dùng <code>JOIN</code> giữa bảng khách hàng và bảng đơn hàng, rồi lọc bằng điều kiện trên bảng đơn hàng trong mệnh đề <code>WHERE</code>. Những khách hàng chưa từng đặt đơn biến mất khỏi báo cáo, dù yêu cầu nghiệp vụ là phải hiện họ với giá trị 0.</p>`,
askFirst: [
`<code>JOIN</code> và <code>LEFT JOIN</code> khác nhau ở đâu khi một bên không có dòng khớp?`,
`Điều kiện lọc đặt trong <code>WHERE</code> khác gì đặt trong <code>ON</code>?`,
`Vì sao báo cáo không báo lỗi mà chỉ thiếu dòng?`,
],
predict: {
q: `Với <code>LEFT JOIN</code> và một điều kiện trên bảng bên phải đặt trong <code>WHERE</code>, những dòng không khớp sẽ ra sao?`,
a: `<p>Chúng bị loại bỏ, và phép <code>LEFT JOIN</code> trở nên tương đương <code>INNER JOIN</code>. Lý do là với dòng không khớp, mọi cột của bảng bên phải nhận giá trị <code>NULL</code>; điều kiện trong <code>WHERE</code> so sánh với <code>NULL</code> cho kết quả <code>UNKNOWN</code>, mà <code>WHERE</code> chỉ giữ những dòng có kết quả đúng. Muốn giữ chúng thì điều kiện phải nằm trong mệnh đề <code>ON</code>, vì <code>ON</code> quyết định cách ghép chứ không lọc kết quả cuối cùng.</p>`,
},
anchor: `Điều kiện trên bảng bên phải đặt trong WHERE sẽ âm thầm biến LEFT JOIN thành INNER JOIN và làm mất đúng những dòng bạn muốn giữ.`,
attacks: [
{ q: `HAVING khác WHERE ở đâu?`, a: `<code>WHERE</code> lọc từng dòng trước khi nhóm, còn <code>HAVING</code> lọc sau khi đã nhóm và tính toán tổng hợp. Vì vậy điều kiện trên kết quả của <code>COUNT</code>, <code>SUM</code> hay <code>AVG</code> bắt buộc phải nằm trong <code>HAVING</code>. Về hiệu năng, nên đẩy càng nhiều điều kiện lọc dòng vào <code>WHERE</code> càng tốt, vì nó làm giảm số dòng phải nhóm; để điều kiện lọc dòng trong <code>HAVING</code> là làm việc nặng trước rồi mới loại bỏ.` },
{ q: `Làm sao phát hiện một JOIN đang làm mất dòng ngoài ý muốn?`, a: `Đếm ở hai mức: số dòng của bảng gốc và số dòng của kết quả. Nếu kết quả ít hơn bảng gốc trong khi yêu cầu nghiệp vụ là giữ tất cả, đó là dấu hiệu. Với những báo cáo quan trọng, nên có một test so sánh tổng số tiền hoặc tổng số bản ghi giữa truy vấn và dữ liệu nguồn — chênh lệch là lỗi. Một cách khác là chạy cùng truy vấn với <code>LEFT JOIN</code> và đếm số dòng có giá trị <code>NULL</code> ở bảng bên phải, để biết có bao nhiêu dòng không khớp.` },
],
},
F05: {
incident: `<p>Một bảng <code>events</code> có 14 chỉ mục, được thêm dần qua hai năm để đáp ứng từng truy vấn chậm. Tốc độ ghi giảm từ 8.000 dòng mỗi giây xuống 1.100, và dung lượng bảng tăng từ 40 GB lên 190 GB. Một dev đề xuất thêm ba chỉ mục nữa để tăng tốc báo cáo.</p>`,
askFirst: [
`Mỗi chỉ mục phải trả giá ở đâu?`,
`Vì sao thêm chỉ mục làm dung lượng tăng mạnh hơn dự kiến?`,
`Làm sao biết một chỉ mục không ai dùng?`,
],
predict: {
q: `Một bảng có ba chỉ mục. Một câu <code>INSERT</code> một dòng phải cập nhật bao nhiêu cấu trúc?`,
a: `<p>Bốn: bản thân bảng cộng ba chỉ mục. Mỗi chỉ mục là một cấu trúc B-tree riêng phải được chèn khoá mới vào đúng vị trí, và việc chèn có thể gây tách trang khi trang đầy. Vì vậy chi phí ghi tăng theo số chỉ mục, và với tải ghi cao thì đó là chi phí lớn nhất. Ngoài ra, mỗi lần cập nhật một cột nằm trong chỉ mục còn phải xoá và chèn lại khoá — nên cập nhật cũng đắt như chèn.</p>`,
},
anchor: `Mỗi chỉ mục là một cấu trúc phải cập nhật ở mọi lần ghi, nên chỉ mục là đánh đổi giữa tốc độ đọc và chi phí ghi cùng dung lượng.`,
attacks: [
{ q: `Làm sao tìm ra những chỉ mục không ai dùng?`, a: `Truy vấn thống kê của PostgreSQL để tìm những chỉ mục có số lần quét bằng không trong một khoảng thời gian đủ dài — vài tuần hoặc một tháng, để bắt được cả những truy vấn theo mùa. Đối chiếu thêm với thống kê của bảng để biết tỉ lệ quét tuần tự và số lần cập nhật. Cần cẩn thận với hai trường hợp: chỉ mục phục vụ ràng buộc duy nhất không thể xoá dù không được quét, và chỉ mục dùng cho truy vấn chạy mỗi quý một lần.` },
{ q: `Chỉ mục tổ hợp có thể thay nhiều chỉ mục đơn không?`, a: `Có, và đây là cách giảm số chỉ mục hiệu quả nhất. Một chỉ mục tổ hợp trên ba cột có thể phục vụ các truy vấn lọc theo cột đầu, theo hai cột đầu, và theo cả ba — nhờ quy tắc tiền tố trái. Vì vậy một chỉ mục tổ hợp đúng thứ tự thường thay được hai hoặc ba chỉ mục đơn. Điều cần kiểm tra là thứ tự cột: cột được lọc bằng điều kiện bằng nên đứng trước, cột dùng cho khoảng hoặc sắp xếp nên đứng sau.` },
],
},
F06: {
incident: `<p>Một truy vấn báo cáo chạy 40 giây. Dev chạy <code>EXPLAIN</code> và thấy kế hoạch dùng chỉ mục với chi phí ước tính thấp, nên kết luận truy vấn đã tối ưu và đi tìm nguyên nhân ở chỗ khác. Thực tế kế hoạch đó ước tính 1.200 dòng nhưng trả về 900.000 dòng, và thời gian thật nằm ở bước sắp xếp kết quả lớn đó.</p>`,
askFirst: [
`<code>EXPLAIN</code> và <code>EXPLAIN ANALYZE</code> khác nhau ở đâu?`,
`Vì sao ước tính có thể lệch xa thực tế?`,
`Nhìn vào đâu để biết bước nào thực sự tốn thời gian?`,
],
predict: {
q: `Kế hoạch hiển thị <code>rows=1200</code> ở một nút, nhưng khi chạy thật thì <code>actual rows=900000</code>. Bạn nghi ngờ nguyên nhân gì?`,
a: `<p>Thống kê của bảng đã cũ hoặc không đủ mịn. Bộ ước lượng dựa trên thống kê phân bố giá trị để đoán số dòng khớp, nên nếu dữ liệu thay đổi nhiều mà thống kê chưa được cập nhật, con số ước tính sẽ sai xa. Nguyên nhân thứ hai là tương quan giữa các cột: bộ ước lượng giả định các điều kiện độc lập với nhau, nên khi hai cột có tương quan mạnh — ví dụ thành phố và mã bưu chính — nó nhân các tỉ lệ và ra một con số nhỏ hơn thực tế rất nhiều. Cách xử lý là cập nhật thống kê, tăng độ chi tiết thống kê cho cột quan trọng, hoặc dùng thống kê mở rộng cho nhóm cột có tương quan.</p>`,
},
anchor: `EXPLAIN cho biết kế hoạch dự kiến còn EXPLAIN ANALYZE cho biết kế hoạch thật kèm thời gian từng bước — và khoảng cách giữa ước tính với thực tế chính là manh mối chẩn đoán.`,
attacks: [
{ q: `Bạn đọc EXPLAIN ANALYZE theo thứ tự nào?`, a: `Đọc từ nút trong cùng ra ngoài, vì đó là thứ tự thực thi. Với mỗi nút, so sánh số dòng ước tính với số dòng thật — lệch lớn là dấu hiệu thống kê sai. Nhìn thời gian thật của từng nút để biết chỗ nào tốn, nhưng nhớ rằng thời gian của nút cha đã bao gồm các nút con. Tìm những nút có số vòng lặp lớn, vì một nút rẻ chạy 900.000 lần vẫn là nút đắt nhất. Và chú ý các nút đọc từ đĩa thay vì từ bộ nhớ, vì chúng thường chỉ ra rằng kế hoạch đang phải đọc nhiều hơn dự kiến.` },
{ q: `Khi nào thì quét tuần tự lại là lựa chọn đúng?`, a: `Khi điều kiện lọc khớp một tỉ lệ lớn số dòng. Nếu một truy vấn cần 40% số dòng của bảng, đọc tuần tự theo thứ tự vật lý rẻ hơn nhiều so với việc nhảy qua lại giữa chỉ mục và bảng. Quét tuần tự cũng đúng khi bảng nhỏ, khi cần đọc gần hết các cột, hoặc khi thống kê cho thấy chỉ mục sẽ không thu hẹp được gì. Vì vậy thấy quét tuần tự trong kế hoạch không tự động là lỗi — cần so với tỉ lệ dòng thật sự khớp.` },
],
},
F07: {
incident: `<p>Hai transaction chạy đồng thời. Transaction A đọc số dư, kiểm tra thấy đủ tiền, rồi trừ tiền. Transaction B cũng đọc số dư trước khi A commit, cũng thấy đủ tiền, và cũng trừ. Kết quả số dư âm, dù mỗi transaction riêng lẻ đều đúng. Cả hai đều chạy ở mức READ COMMITTED, mức mặc định.</p>`,
askFirst: [
`READ COMMITTED bảo đảm điều gì, và không bảo đảm điều gì?`,
`Vì sao hai transaction không thấy thay đổi của nhau?`,
`Mức isolation nào ngăn được tình huống này?`,
],
predict: {
q: `Ở mức READ COMMITTED, transaction A đọc một dòng, transaction B cập nhật và commit dòng đó, rồi A đọc lại dòng đó. A thấy giá trị nào?`,
a: `<p>A thấy giá trị mới của B. Ở READ COMMITTED, mỗi câu lệnh trong transaction nhìn thấy một ảnh chụp mới nhất đã commit tại thời điểm câu lệnh bắt đầu — nên cùng một transaction có thể thấy hai giá trị khác nhau ở hai lần đọc. Đây là hiện tượng đọc không lặp lại được. Điều này cũng giải thích hành vi của câu <code>UPDATE</code> trong mức này: nếu một dòng đã bị transaction khác cập nhật và commit trong lúc câu lệnh đang chờ khoá, PostgreSQL đọc lại phiên bản mới và đánh giá lại điều kiện <code>WHERE</code> trên phiên bản đó.</p>`,
},
anchor: `READ COMMITTED chỉ hứa mỗi câu lệnh thấy dữ liệu đã commit, không hứa hai câu lệnh trong cùng transaction thấy cùng một thế giới.`,
attacks: [
{ q: `PostgreSQL triển khai REPEATABLE READ như thế nào?`, a: `Bằng snapshot isolation: transaction nhận một ảnh chụp cố định tại thời điểm bắt đầu, và mọi câu lệnh trong transaction đều đọc từ ảnh chụp đó. Hệ quả quan trọng là phantom read không xảy ra ở mức này trong PostgreSQL — điều khác với bảng chuẩn SQL, nơi REPEATABLE READ vẫn cho phép phantom. Đánh đổi là nếu hai transaction cùng cập nhật một dòng, một trong hai sẽ nhận lỗi serialization failure và phải thử lại; đó là cơ chế phát hiện xung đột chứ không phải lỗi cần tránh bằng mọi giá.` },
{ q: `Mức SERIALIZABLE có làm chậm mọi thứ không?`, a: `Nó thêm chi phí theo dõi phụ thuộc giữa các transaction, nhưng trong PostgreSQL nó dùng snapshot isolation cộng với kiểm tra xung đột, chứ không dùng khoá trên toàn bảng. Chi phí thật nằm ở chỗ khác: một số transaction sẽ bị từ chối và phải thử lại, nên ứng dụng bắt buộc phải có vòng thử lại cho lỗi serialization. Với khối lượng ghi lớn và tranh chấp cao, tỉ lệ phải thử lại tăng và đó là chi phí cần đo. Với nghiệp vụ cần đúng tuyệt đối — số dư, tồn kho, đặt chỗ — mức này thường đáng giá.` },
],
},
F09: {
incident: `<p>Một endpoint đăng ký dùng mã như sau: kiểm tra xem email đã tồn tại chưa, nếu chưa thì chèn. Hai request đăng ký cùng email tới trong cùng một mili giây. Cả hai đều kiểm tra và đều thấy email chưa tồn tại, cả hai đều chèn thành công, và giờ có hai tài khoản cùng email. Không có lỗi nào được ghi lại.</p>`,
askFirst: [
`Vì sao kiểm tra rồi chèn lại không an toàn?`,
`Ràng buộc nào ở tầng database ngăn được việc này?`,
`Làm sao chèn an toàn mà không cần khoá bảng?`,
],
predict: {
q: `Hai transaction cùng chạy <code>SELECT</code> kiểm tra rồi <code>INSERT</code> cùng một giá trị duy nhất. Chuyện gì xảy ra nếu cột có ràng buộc duy nhất?`,
a: `<p>Một transaction chèn thành công, transaction còn lại nhận lỗi vi phạm ràng buộc duy nhất. Đây là hành vi mong muốn: ràng buộc ở tầng database là thứ duy nhất thực sự nguyên tử trước hai request đồng thời, vì nó được thực thi bên trong database chứ không phải trong logic ứng dụng. Ứng dụng phải bắt lỗi đó và chuyển thành phản hồi phù hợp — thường là 409 Conflict — thay vì để nó thành lỗi 500. Nếu không có ràng buộc duy nhất thì cả hai đều thành công và bạn có dữ liệu trùng.</p>`,
},
anchor: `Kiểm tra rồi ghi là hai thao tác riêng biệt, nên chỉ ràng buộc ở tầng database mới thực sự nguyên tử dưới concurrency.`,
attacks: [
{ q: `Làm sao chèn hoặc cập nhật trong một thao tác duy nhất?`, a: `Dùng câu lệnh upsert của PostgreSQL: <code>INSERT ... ON CONFLICT (cột) DO UPDATE SET ...</code>. Nó thực hiện việc chèn và xử lý xung đột trong một câu lệnh nguyên tử, nên không có cửa sổ giữa kiểm tra và ghi. Biến thể <code>DO NOTHING</code> phù hợp khi bạn chỉ muốn bỏ qua nếu đã tồn tại. Một điểm cần lưu ý là <code>ON CONFLICT</code> cần một chỉ mục duy nhất hoặc ràng buộc duy nhất trên đúng cột bạn chỉ định, nếu không nó sẽ báo lỗi. Và trong môi trường có tranh chấp cao, upsert vẫn có thể phải chờ khoá nhưng sẽ không tạo dữ liệu trùng.` },
{ q: `Nếu tôi dùng khoá ở tầng ứng dụng thì có đủ không?`, a: `Chỉ khi mọi đường ghi đều đi qua đúng một tiến trình và khoá đó thực sự bao quanh cả bước kiểm tra lẫn bước ghi. Với nhiều worker hoặc nhiều máy, khoá trong bộ nhớ của một tiến trình không nhìn thấy khoá của tiến trình khác, nên hai request vào hai worker vẫn chèn trùng. Khoá phân tán có thể dùng được nhưng thêm một phụ thuộc và một điểm hỏng mới. Ràng buộc ở database rẻ hơn, luôn đúng, và không cần hạ tầng thêm.` },
],
},
F10: {
incident: `<p>Một bộ đếm lượt xem được cập nhật bằng cách đọc giá trị hiện tại, cộng một, rồi ghi lại. Với 300 lượt xem mỗi giây, con số cuối ngày thấp hơn số lượt thật khoảng 18%. Không có lỗi nào trong log; chỉ có một số lần cập nhật bị mất. Cùng lúc, một quy trình chỉnh sửa hồ sơ bị mất thay đổi khi hai nhân viên sửa cùng lúc.</p>`,
askFirst: [
`Hai thao tác nào đang chồng lên nhau?`,
`Khoá bi quan và lạc quan khác nhau ở đâu?`,
`Cách nào rẻ hơn cho trường hợp này?`,
],
predict: {
q: `Hai transaction cùng đọc <code>count = 10</code>, mỗi cái ghi <code>count = 11</code>. Kết quả cuối là bao nhiêu?`,
a: `<p>Kết quả là 11, không phải 12. Đây là lost update kinh điển: cả hai đọc cùng một giá trị cũ, cả hai tính ra cùng một giá trị mới, và lần ghi sau ghi đè lần ghi trước nên một thay đổi biến mất hoàn toàn. Không có lỗi nào được ném ra vì cả hai câu lệnh đều hợp lệ. Cách sửa rẻ nhất là để database tự tính: <code>UPDATE t SET count = count + 1 WHERE id = ?</code> — phép cộng được thực hiện bên trong database trên phiên bản mới nhất của dòng, nên không có cửa sổ nào để mất.</p>`,
},
anchor: `Đọc rồi ghi là hai bước, nên giữa chúng luôn có cửa sổ để thay đổi của người khác biến mất — để database tự tính là cách xoá bỏ cửa sổ đó.`,
attacks: [
{ q: `Khoá lạc quan và khoá bi quan chọn theo tiêu chí nào?`, a: `Theo tần suất xung đột và thời gian giữ khoá. Khoá lạc quan — đọc kèm số phiên bản, ghi với điều kiện phiên bản chưa đổi — phù hợp khi xung đột hiếm, vì không giữ khoá nào và không chặn ai. Khoá bi quan — <code>SELECT ... FOR UPDATE</code> — phù hợp khi xung đột thường xuyên hoặc khi thao tác cần nhiều bước đọc ghi liên tiếp, vì nó đảm bảo không ai xen vào giữa. Đánh đổi của khoá bi quan là nó giữ tài nguyên và có thể gây deadlock nếu thứ tự khoá không nhất quán.` },
{ q: `Cách rẻ nhất để tăng một bộ đếm là gì?`, a: `Để database làm phép tính trong câu lệnh, như <code>SET count = count + 1</code>. Nếu bộ đếm có tranh chấp rất cao trên cùng một dòng, cách tiếp theo là gộp nhiều lần tăng ở tầng ứng dụng rồi ghi một lần theo lô — chấp nhận mất một ít độ chính xác tức thời để đổi lấy thông lượng. Với bộ đếm không cần chính xác tuyệt đối, có thể dùng phép tăng nguyên tử ở một kho lưu trữ khoá-giá trị, hoặc ghi sự kiện rồi tổng hợp định kỳ. Điều không nên làm là đọc rồi ghi trong ứng dụng.` },
],
},
F11: {
incident: `<p>Một ứng dụng chạy 12 worker, mỗi worker mở pool 20 kết nối. Database cho phép 100 kết nối đồng thời. Khi tải tăng, các worker liên tục gặp lỗi không tạo được kết nối, và những request đã có kết nối thì chậm đi vì database phải chia CPU cho quá nhiều phiên. Tổng số kết nối đang mở là 240, vượt hạn mức 100.</p>`,
askFirst: [
`Tổng số kết nối được tính từ đâu?`,
`Vì sao nhiều kết nối hơn lại làm mọi thứ chậm hơn?`,
`Kích thước pool nên chọn theo tiêu chí gì?`,
],
predict: {
q: `Một pool có 20 kết nối và 100 request đồng thời cùng cần database. Điều gì xảy ra với 80 request còn lại?`,
a: `<p>Chúng xếp hàng chờ trong pool. Đây không phải lỗi mà là cơ chế bảo vệ: giới hạn số kết nối đồng thời nghĩa là database chỉ phải phục vụ 20 request cùng lúc, nên mỗi request có nhiều tài nguyên hơn và độ trễ trung bình thường tốt hơn so với việc mở 100 kết nối. Điều cần theo dõi là thời gian chờ trong hàng: nếu nó tăng liên tục, đó là dấu hiệu pool quá nhỏ hoặc truy vấn quá chậm. Và cần đặt một thời gian chờ tối đa, vì chờ vô hạn sẽ biến một sự cố database thành sự cố treo toàn hệ thống.</p>`,
},
anchor: `Số kết nối tối đa của database là ngân sách chia cho mọi tiến trình, nên pool phải được tính từ hạn mức chung chứ không chọn theo từng worker.`,
attacks: [
{ q: `Vì sao thêm kết nối không làm database nhanh hơn?`, a: `Vì mỗi kết nối là một phiên có chi phí bộ nhớ và chi phí chuyển ngữ cảnh, và database chỉ có một số nhân hữu hạn. Khi số phiên vượt số nhân, thời gian được chia nhỏ hơn và mỗi truy vấn chạy chậm hơn, nên thông lượng tổng giảm. Ngoài ra nhiều phiên cùng tranh khoá và tranh bộ đệm, làm tăng khả năng chờ nhau. Điểm tối ưu thường nằm quanh số nhân, và thêm kết nối chỉ hữu ích khi phần lớn thời gian của truy vấn là chờ I/O chứ không phải tính toán.` },
{ q: `Khi nào cần một lớp gộp kết nối ở giữa?`, a: `Khi số thực thể ứng dụng thay đổi linh hoạt và lớn — điển hình là hàm serverless, nơi số môi trường đồng thời có thể nhảy từ vài chục lên hàng nghìn. Một lớp gộp ở giữa giữ một số kết nối cố định tới database và chia sẻ chúng cho nhiều client, nên hạn mức kết nối không còn phụ thuộc vào số thực thể. Đánh đổi là thêm một thành phần phải vận hành, thêm một chặng mạng vào đường nóng, và cần hiểu rõ hành vi của nó khi có transaction — vì gộp kết nối và transaction dài vốn không hợp nhau.` },
],
},
F12: {
incident: `<p>Một endpoint danh sách chuyển từ phân trang theo offset sang keyset sau khi trang 400 mất 8 giây. Truy vấn cũ dùng <code>OFFSET 40000 LIMIT 20</code>. Ngoài ra, khi hiển thị danh sách, mỗi dòng cần tên tác giả nên code gọi thêm một truy vấn cho mỗi dòng, tạo ra 20 truy vấn phụ cho một trang.</p>`,
askFirst: [
`Vì sao <code>OFFSET</code> lớn lại chậm?`,
`Keyset phân trang khác gì về mặt truy vấn?`,
`Làm sao lấy dữ liệu liên quan mà không sinh N+1?`,
],
predict: {
q: `<code>SELECT ... ORDER BY created_at DESC OFFSET 40000 LIMIT 20</code> phải làm gì trước khi trả về 20 dòng?`,
a: `<p>Nó phải sinh ra và bỏ đi 40.000 dòng đầu tiên. Database không có cách nào nhảy trực tiếp tới vị trí thứ 40.001 trong kết quả đã sắp xếp, nên nó đọc và đếm qua toàn bộ phần bị bỏ. Chi phí tăng theo độ sâu của trang, không theo số dòng trả về — đó là lý do trang 400 chậm hơn trang 1 hàng trăm lần dù cùng trả 20 dòng. Keyset tránh điều này bằng cách lọc theo giá trị của dòng cuối trang trước, nên database nhảy thẳng tới đúng vị trí trong chỉ mục.</p>`,
},
anchor: `OFFSET trả giá theo độ sâu trang vì phải đếm qua mọi dòng bị bỏ, còn keyset trả giá theo số dòng lấy ra vì nó lọc bằng giá trị thay vì đếm bằng vị trí.`,
attacks: [
{ q: `Keyset phân trang có nhược điểm gì?`, a: `Ba nhược điểm thật. Một là không nhảy được tới trang bất kỳ — bạn chỉ đi tuần tự tiến hoặc lùi, nên giao diện kiểu "tới trang 47" không làm được. Hai là khoá sắp xếp phải duy nhất và ổn định; nếu sắp theo một cột có nhiều giá trị trùng, bạn phải thêm cột phụ để phá vỡ thế bằng, nếu không sẽ bỏ sót hoặc lặp dòng. Ba là bộ lọc phải được giữ nguyên giữa các lần lật trang, vì keyset dựa vào giá trị của dòng cuối chứ không dựa vào một vị trí cố định.` },
{ q: `Làm sao lấy dữ liệu liên quan cho cả trang mà không sinh N+1?`, a: `Hai cách chính. Một là gộp ở tầng database bằng <code>JOIN</code> hoặc bằng một truy vấn thứ hai lấy tất cả bản ghi liên quan theo danh sách định danh của trang — cách sau thường tốt hơn vì tránh nhân bản dòng. Hai là để ORM làm việc đó bằng cách nạp trước quan hệ, dùng <code>selectinload</code> trong SQLAlchemy hoặc <code>prefetch_related</code> trong Django. Điểm chung là số truy vấn phải là hằng số, không phụ thuộc số dòng trong trang. Cách kiểm chứng là đếm số truy vấn trong test và đặt ngưỡng để test đỏ khi vượt.` },
],
},
};
