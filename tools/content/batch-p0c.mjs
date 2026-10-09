// Batch P0-C — `attacks` for the last P0 questions: PostgreSQL F01, F03, F04, F08;
// AWS G01; Docker H01, H02, H03, H06; design I01, I02; behavioural J01..J06.
export default {
F01: {
attacks: [
{ q: `Ràng buộc khoá ngoại có làm chậm ghi không, và bạn có nên bỏ nó vì hiệu năng?`, a: `Nó thêm một phép kiểm tra trên bảng được tham chiếu ở mỗi lần ghi hoặc xoá, nên có chi phí thật, nhưng chi phí đó thường nhỏ so với việc phải tự duy trì tính toàn vẹn trong ứng dụng. Bỏ ràng buộc nghĩa là bạn chấp nhận dữ liệu mồ côi, và khi đó mọi truy vấn nối bảng phải tự xử lý trường hợp không tìm thấy — một trách nhiệm rải khắp codebase thay vì nằm ở một chỗ. Điều đáng nói trong phỏng vấn là nếu bạn thực sự cần bỏ qua kiểm tra vì lý do nạp dữ liệu lớn, hãy làm ở phạm vi hẹp và có bước xác minh lại, chứ không bỏ vĩnh viễn.` },
{ q: `Ràng buộc duy nhất và chỉ mục duy nhất khác nhau thế nào?`, a: `Ràng buộc duy nhất là một quy tắc về tính đúng đắn, còn chỉ mục duy nhất là cấu trúc vật lý thực thi quy tắc đó. Trong thực tế PostgreSQL tạo một chỉ mục duy nhất để thực thi ràng buộc, nên hai khái niệm gắn với nhau. Điểm khác biệt có ý nghĩa là chỉ mục duy nhất có thể được tạo có điều kiện — chỉ áp dụng cho một tập dòng con — nên bạn biểu diễn được những quy tắc mà ràng buộc duy nhất thông thường không làm được, ví dụ chỉ cho phép một bản ghi đang hoạt động trên mỗi tổ hợp khoá. Và cần nhớ rằng giá trị rỗng được coi là khác nhau, nên nhiều dòng có cùng tổ hợp chứa rỗng vẫn thoả ràng buộc duy nhất.` },
],
},
F03: {
attacks: [
{ q: `Vì sao <code>COUNT(*)</code> bỏ qua dòng có giá trị rỗng còn <code>COUNT(cột)</code> cũng bỏ qua?`, a: `<code>COUNT(*)</code> đếm số dòng, không quan tâm giá trị. <code>COUNT(cột)</code> đếm số dòng mà cột đó không rỗng, nên nó bỏ qua những dòng có giá trị rỗng. Đây là nguồn sai số rất phổ biến trong báo cáo: cùng một bảng, hai cách đếm cho hai con số khác nhau, và không có lỗi nào được ném ra để cảnh báo. Quy tắc là dùng dạng đếm mọi dòng khi bạn muốn biết số bản ghi, và dùng dạng đếm theo cột chỉ khi bạn thực sự muốn biết số dòng có giá trị — và khi đó nên ghi rõ ý định trong tên cột kết quả để người đọc báo cáo không hiểu nhầm.` },
{ q: `Làm sao tránh được cả lớp lỗi liên quan tới giá trị rỗng trong một hệ thống lớn?`, a: `Bằng cách quyết định ở tầng lược đồ, không ở tầng truy vấn. Với mỗi cột, chọn rõ nó có được phép rỗng hay không, và nếu không thì đặt ràng buộc cùng giá trị mặc định — như vậy mọi truy vấn sau đó không phải xử lý trường hợp rỗng nữa. Với những cột mà rỗng mang nghĩa nghiệp vụ, hãy cân nhắc dùng một giá trị biểu diễn tường minh thay vì rỗng, vì giá trị tường minh so sánh được bằng phép so sánh thường. Đây là loại quyết định rẻ khi làm sớm và rất đắt khi phải sửa sau, vì lúc đó đã có dữ liệu và đã có truy vấn phụ thuộc vào hành vi cũ.` },
],
},
F04: {
attacks: [
{ q: `Vì sao chỉ mục tổ hợp lại phụ thuộc thứ tự cột?`, a: `Vì chỉ mục được lưu theo thứ tự từ điển của tổ hợp cột, nên nó chỉ thu hẹp được phạm vi tìm kiếm khi bạn ràng buộc được cột đứng trước. Nếu bạn chỉ có điều kiện trên cột thứ hai, các giá trị của cột đó nằm rải rác khắp chỉ mục nên không có khoảng nào để tìm — và cơ sở dữ liệu sẽ chọn quét tuần tự. Vì vậy thứ tự cột nên đặt theo cách truy vấn: cột dùng điều kiện bằng đứng trước, cột dùng khoảng hoặc sắp xếp đứng sau. Và một chỉ mục tổ hợp đúng thứ tự thường thay thế được nhiều chỉ mục đơn, nên đây cũng là cách giảm số chỉ mục và giảm chi phí ghi.` },
{ q: `Nếu truy vấn lọc theo cột thứ hai và sắp xếp theo cột thứ ba thì sao?`, a: `Bạn cần một chỉ mục có thứ tự khớp với mẫu truy vấn đó, thường là đặt cột lọc bằng lên trước rồi tới cột sắp xếp. Nếu truy vấn có nhiều mẫu khác nhau không thể phục vụ bằng một chỉ mục, thì phải chọn chỉ mục phục vụ mẫu quan trọng nhất — thường là mẫu chạy nhiều nhất hoặc mẫu có ngân sách độ trễ chặt nhất — và chấp nhận những mẫu còn lại chậm hơn. Điều nên tránh là thêm một chỉ mục cho mỗi mẫu truy vấn, vì chi phí ghi và dung lượng tăng theo số chỉ mục, và đến một lúc nào đó việc ghi chậm đi ảnh hưởng tới toàn hệ thống nhiều hơn lợi ích mà các chỉ mục mang lại.` },
],
},
F08: {
attacks: [
{ q: `Deadlock khác khoá chờ bình thường ở đâu, và vì sao cơ sở dữ liệu phải chọn một bên để huỷ?`, a: `Khoá chờ bình thường sẽ tự giải quyết khi bên giữ khoá hoàn tất. Deadlock là vòng chờ khép kín: mỗi bên giữ một khoá mà bên kia đang cần, nên không bên nào có thể tiến tiếp và tình trạng sẽ kéo dài vô hạn. Cơ sở dữ liệu phát hiện vòng này và huỷ một giao dịch để phá vòng, vì nếu không thì cả hai treo mãi. Vì vậy deadlock không phải lỗi cần loại bỏ hoàn toàn mà là tình huống phải chịu được: ứng dụng phải bắt lỗi và thử lại giao dịch bị huỷ.` },
{ q: `Cách phòng deadlock hiệu quả nhất trong thực tế là gì?`, a: `Là làm cho mọi giao dịch truy cập tài nguyên theo cùng một thứ tự. Nếu mọi chỗ đều khoá bảng A trước rồi mới tới B, vòng chờ khép kín không thể hình thành. Điều này thường đạt được bằng cách sắp xếp các thao tác cập nhật theo khoá chính trước khi thực thi, ví dụ luôn xử lý theo thứ tự định danh tăng dần. Biện pháp thứ hai là giữ giao dịch ngắn để giảm cửa sổ tranh chấp. Và biện pháp thứ ba là bắt lỗi deadlock ở tầng ứng dụng và thử lại, vì dù có phòng thế nào thì deadlock vẫn có thể xảy ra khi hệ thống phức tạp.` },
],
},
G01: {
attacks: [
{ q: `Vì sao triển khai một vùng sẵn sàng là chưa đủ để chịu lỗi?`, a: `Vì một vùng sẵn sàng vẫn nằm trong cùng một vùng địa lý, và các sự cố ảnh hưởng tới cả vùng địa lý — mất điện diện rộng, lỗi cáp quang, hoặc thiên tai — sẽ làm hỏng mọi vùng sẵn sàng cùng lúc. Ngoài ra có những dịch vụ toàn cầu hoặc những thành phần chỉ tồn tại ở cấp vùng địa lý, nên phụ thuộc vào chúng vẫn là điểm hỏng duy nhất. Muốn chịu được sự cố cấp vùng thì phải có hiện diện ở nhiều vùng địa lý, và điều đó kéo theo bài toán đồng bộ dữ liệu cùng quyết định về việc chấp nhận mất mát dữ liệu tới mức nào.` },
{ q: `Trong mô hình trách nhiệm chung, phần nào là của nhà cung cấp và phần nào là của bạn?`, a: `Nhà cung cấp chịu trách nhiệm về hạ tầng vật lý, mạng, máy chủ, và tính sẵn sàng của các dịch vụ nền tảng. Bạn chịu trách nhiệm về những gì bạn cấu hình và những gì bạn đặt lên trên: quyền truy cập, mã hoá, sao lưu, phân quyền, mã nguồn, và cách dữ liệu của bạn được xử lý. Ranh giới này dịch chuyển theo mức độ trừu tượng của dịch vụ — càng dùng dịch vụ được quản lý cao thì nhà cung cấp càng làm nhiều, nhưng bạn không bao giờ hết trách nhiệm về dữ liệu, danh tính và cấu hình. Hiểu sai ranh giới này là nguyên nhân của phần lớn sự cố bảo mật trên nền tảng đám mây.` },
],
},
H01: {
attacks: [
{ q: `Image và container khác nhau thế nào, và vì sao điều đó quan trọng khi gỡ lỗi?`, a: `Image là bản mẫu chỉ đọc gồm các lớp hệ thống tệp cùng metadata; container là một thực thể đang chạy được tạo từ image, có thêm một lớp ghi riêng. Điều này quan trọng khi gỡ lỗi vì mọi thay đổi bạn làm bên trong container đang chạy chỉ nằm ở lớp ghi đó và mất khi container bị xoá — nên nếu bạn sửa file trong container để thử nghiệm rồi khởi động lại, thay đổi biến mất. Hệ quả thực tế là không bao giờ được sửa trực tiếp trong container đang chạy để khắc phục sự cố; mọi thay đổi phải đi vào image và được triển khai lại, nếu không lần sau sự cố sẽ tái diễn và không ai biết vì sao bản sửa đã mất.` },
{ q: `Vì sao cùng một image chạy tốt trên máy bạn nhưng lỗi trên máy chủ?`, a: `Vì image chỉ đóng gói hệ thống tệp và cấu hình của nó, không đóng gói nhân hệ điều hành. Container dùng chung nhân của máy chủ, nên khác biệt về phiên bản nhân, kiến trúc CPU, hoặc các tính năng nhân được bật sẽ tạo ra khác biệt hành vi. Ngoài ra những gì bạn gắn từ ngoài vào — biến môi trường, volume, cấu hình mạng — không nằm trong image, nên thiếu hoặc khác chúng cũng gây lỗi. Cách chẩn đoán là so sánh ba nhóm này giữa hai môi trường, thay vì tìm lỗi trong mã nguồn vì mã nguồn là phần giống nhau.` },
],
},
H02: {
attacks: [
{ q: `Vì sao đổi thứ tự các lệnh trong Dockerfile lại ảnh hưởng lớn tới thời gian build?`, a: `Vì mỗi lệnh tạo một lớp, và bộ đệm được dùng lại theo tiền tố: khi một lớp thay đổi, mọi lớp sau nó đều phải dựng lại. Nếu bạn sao chép toàn bộ mã nguồn rồi mới cài phụ thuộc, thì mỗi lần sửa một dòng mã, lớp sao chép đổi và toàn bộ bước cài phụ thuộc chạy lại từ đầu — có thể mất nhiều phút. Đảo lại, sao chép tệp khai báo phụ thuộc trước, cài phụ thuộc, rồi mới sao chép mã nguồn, thì bước cài phụ thuộc chỉ chạy lại khi danh sách phụ thuộc thật sự đổi.` },
{ q: `Bộ đệm build bị vô hiệu ngoài ý muốn vì những nguyên nhân nào?`, a: `Bốn nguyên nhân phổ biến. Một là tệp bị thay đổi nằm trong ngữ cảnh build, kể cả những tệp bạn không dùng tới — ví dụ tệp log hoặc thư mục phụ thuộc không được loại trừ. Hai là lệnh cài đặt phụ thuộc không ghim phiên bản, nên mỗi lần chạy có thể lấy phiên bản mới và tạo ra lớp khác. Ba là dùng ảnh nền theo thẻ động, nên khi ảnh nền được cập nhật thì lớp đầu tiên đổi và mọi thứ sau đó dựng lại. Bốn là thay đổi quyền hoặc dấu thời gian của tệp, vì nội dung có thể giống nhau nhưng metadata khác.` },
],
},
H03: {
attacks: [
{ q: `Multi-stage build có làm thời gian build lâu hơn không?`, a: `Có thể lâu hơn, vì bạn thêm các bước dựng ở giai đoạn đầu, nhưng thời gian đó thường được trả lại ở những lần sau nhờ bộ đệm, và bù lại bằng thời gian tải và khởi động nhanh hơn ở mọi lần chạy. Điều quan trọng hơn là chất lượng của kết quả: image nhỏ hơn nghĩa là ít gói hơn, nên ít lỗ hổng hơn và ít công cụ hơn cho kẻ tấn công. Với hệ thống triển khai thường xuyên, việc tối ưu theo thời gian tải và khởi động thường đáng giá hơn thời gian build, vì build chạy một lần còn tải chạy ở mọi bản sao.` },
{ q: `Có trường hợp nào multi-stage không giúp ích gì?`, a: `Có. Nếu ngôn ngữ hoặc công cụ không tạo ra phần phụ thuộc chỉ dùng lúc build — ví dụ một ứng dụng chỉ gồm các tệp văn bản và một máy chủ đã có sẵn trong ảnh nền — thì giai đoạn dựng thêm không loại bỏ được gì. Nó cũng ít giá trị khi ảnh nền đã rất tối giản và mọi gói cài đặt đều cần thiết lúc chạy. Điểm cần nói rõ là multi-stage là một kỹ thuật để loại bỏ thứ không cần thiết, nên nó chỉ có giá trị khi thực sự tồn tại thứ như vậy — còn thêm nó như một thói quen thì chỉ làm tệp cấu hình dài hơn.` },
],
},
H06: {
attacks: [
{ q: `Vì sao dạng shell cho lệnh khởi động lại làm hỏng việc dừng êm?`, a: `Vì khi đó tiến trình có mã một trong container là shell, không phải ứng dụng. Tín hiệu dừng được gửi tới tiến trình một, tức là shell, và shell không chuyển tiếp tín hiệu đó cho tiến trình con. Ứng dụng không bao giờ nhận được yêu cầu dừng, nên nó không có cơ hội hoàn tất yêu cầu đang xử lý, đóng kết nối, hay ghi nốt dữ liệu đang đệm. Sau khoảng thời gian chờ, hệ thống gửi tín hiệu buộc dừng và ứng dụng bị cắt giữa chừng. Dạng exec thay thế shell bằng chính ứng dụng, nên tín hiệu tới đúng nơi cần tới.` },
{ q: `Nếu ứng dụng cần dọn dẹp lâu hơn thời gian chờ mặc định thì sao?`, a: `Phải tăng thời gian chờ trước khi buộc dừng, và đồng thời làm cho việc dọn dẹp nhanh hơn. Hai việc này đi cùng nhau: tăng thời gian chờ mà không xử lý việc dọn dẹp thì chỉ kéo dài thời gian triển khai. Cách làm đúng là khi nhận tín hiệu dừng, ứng dụng lập tức ngừng nhận yêu cầu mới, báo cho bộ cân bằng tải biết để nó ngừng gửi vào, rồi chờ các yêu cầu đang xử lý hoàn tất trong một giới hạn thời gian. Cần đặt giới hạn đó nhỏ hơn thời gian chờ của hệ thống, để ứng dụng tự thoát trước khi bị buộc dừng.` },
],
},
I01: {
attacks: [
{ q: `Vì sao tra cứu trong bảng băm được coi là O(1) khi vẫn có va chạm?`, a: `Vì đó là độ phức tạp trung bình, không phải trường hợp xấu nhất. Với một hàm băm phân bố đều và hệ số tải được kiểm soát, số phần tử trung bình trong mỗi ô là một hằng số, nên số phép so sánh trung bình cũng là hằng số. Trường hợp xấu nhất là O(n) khi mọi khoá va chạm vào cùng một ô. Điều quan trọng trong phỏng vấn là nói rõ giả định: kết quả O(1) phụ thuộc vào hàm băm tốt và vào việc bảng được giãn nở khi đầy — nếu không kiểm soát hệ số tải, chi phí tăng và tính chất đó mất.` },
{ q: `Bạn chọn ngăn xếp hay hàng đợi cho bài toán duyệt theo chiều rộng và chiều sâu?`, a: `Duyệt theo chiều sâu dùng ngăn xếp, vì bạn muốn xử lý nút vừa thêm vào trước — vào sau ra trước. Duyệt theo chiều rộng dùng hàng đợi, vì bạn muốn xử lý theo thứ tự phát hiện — vào trước ra trước, nhờ đó mọi nút ở một mức được xử lý trước khi sang mức sau. Điểm đáng nói thêm là duyệt theo chiều sâu viết bằng đệ quy cũng dùng ngăn xếp, chỉ là ngăn xếp của lời gọi hàm, nên với dữ liệu sâu có thể tràn ngăn xếp — và khi đó phải chuyển sang ngăn xếp tường minh.` },
],
},
I02: {
attacks: [
{ q: `Khử trùng lặp bằng tập hợp có nhược điểm gì?`, a: `Nó không giữ thứ tự, nên nếu bạn cần giữ thứ tự xuất hiện đầu tiên thì kết quả sai. Và nó đòi hỏi các phần tử phải băm được, nên với object hoặc cấu trúc lồng nhau thì không dùng trực tiếp được. Ngoài ra nó chỉ trả lời câu hỏi đã xuất hiện hay chưa, không cho biết xuất hiện bao nhiêu lần. Cách làm đúng cho khử trùng lặp giữ thứ tự là duyệt tuần tự, giữ một tập hợp các giá trị đã thấy, và thêm vào kết quả nếu chưa có — cách này vẫn là O(n) nhưng bảo toàn thứ tự.` },
{ q: `Đếm tần suất có thể sai ở đâu khi dữ liệu tới từ nhiều nguồn?`, a: `Ở ba chỗ. Một là khoá chưa được chuẩn hoá, nên cùng một giá trị có nhiều biểu diễn và bị đếm thành nhiều nhóm — chữ hoa chữ thường, khoảng trắng thừa, hoặc khác biệt Unicode. Hai là dữ liệu bị cắt cụt ở ranh giới lô, nếu bạn đếm riêng từng lô rồi cộng lại thì đúng, nhưng nếu bạn khử trùng lặp trong từng lô rồi cộng thì sai. Ba là giá trị rỗng, vì nó thường bị bỏ qua một cách âm thầm và làm tổng số đếm nhỏ hơn số bản ghi. Cả ba đều là lỗi im lặng, nên cần kiểm tra tổng số đếm khớp với số bản ghi đầu vào.` },
],
},
J01: {
attacks: [
{ q: `Nếu tôi yêu cầu bạn giới thiệu trong 30 giây thay vì 90, bạn bỏ phần nào?`, a: `Bỏ phần lịch sử và bỏ phần liệt kê công nghệ, giữ lại ba thứ: hiện tại bạn làm gì và ở vai trò nào, một thành tựu cụ thể có kết quả đo được, và lý do bạn quan tâm tới vị trí này. Phần bị bỏ không phải là phần kém quan trọng mà là phần có thể xuất hiện sau, khi người phỏng vấn hỏi tới. Điều cần tránh là cố nhồi mọi thứ vào 30 giây rồi nói nhanh — người nghe sẽ không giữ được gì. Nói ít hơn nhưng rõ ràng luôn tốt hơn nói nhiều mà không ai nhớ.` },
{ q: `Vì sao phần "tôi muốn ứng tuyển vì..." lại quan trọng hơn nhiều người nghĩ?`, a: `Vì nó biến một bản liệt kê lý lịch thành một lập luận có chủ đích. Người phỏng vấn đã đọc lý lịch trước khi gặp bạn, nên phần giới thiệu không cần nhắc lại nội dung đó — giá trị của nó nằm ở chỗ cho thấy bạn hiểu vị trí này cần gì và bạn khớp ở đâu. Điều này đặc biệt quan trọng khi bạn có điểm yếu đã biết, vì đó là cơ hội để chủ động nêu bạn đang bù đắp thế nào thay vì để người phỏng vấn phát hiện và tự suy diễn.` },
],
},
J02: {
attacks: [
{ q: `Vì sao kể một tính năng end-to-end lại mạnh hơn kể nhiều tính năng rời rạc?`, a: `Vì nó chứng minh bạn hiểu hệ thống chứ không chỉ hiểu phần việc của mình. Khi kể từ giao diện tới cơ sở dữ liệu, bạn buộc phải nói tới hợp đồng giữa các tầng, tới việc xử lý lỗi, và tới chỗ nào dễ hỏng — đó chính là những thứ phân biệt người làm được việc với người chỉ viết được hàm. Nhiều tính năng rời rạc thì người nghe không dựng được hình dung nào về năng lực của bạn. Một tính năng được kể sâu, kèm số liệu và một sự cố đã gặp, để lại ấn tượng mạnh hơn nhiều.` },
{ q: `Nếu tính năng đó không có số liệu cải thiện thì kể thế nào?`, a: `Kể bằng cấu trúc và bằng những gì bạn đã phải quyết định. Bạn có thể mô tả luồng dữ liệu, nêu hai lựa chọn thiết kế và lý do chọn một, rồi nói rõ điều bạn phải chấp nhận. Nếu có số liệu định tính — ví dụ số lỗi hỗ trợ giảm, hoặc thời gian triển khai ngắn lại — hãy nêu và nói rõ đó là quan sát chứ không phải phép đo có kiểm soát. Trung thực về việc chưa đo được vẫn tốt hơn nhiều so với bịa ra một con số, vì người phỏng vấn có kinh nghiệm sẽ đào và phát hiện ngay.` },
],
},
J03: {
attacks: [
{ q: `Nếu người phỏng vấn nói thiết kế của bạn sai thì bạn phản ứng thế nào?`, a: `Trước hết hỏi lại để hiểu họ đang giả định điều gì khác — thường thì họ đang thay đổi một ràng buộc mà bạn chưa biết. Sau đó đánh giá thẳng: nếu giả định mới hợp lý thì nói rõ thiết kế sẽ đổi thế nào và phần nào giữ nguyên. Nếu bạn vẫn cho là mình đúng, hãy nêu lý do gắn với yêu cầu cụ thể chứ không phải với sở thích, và nói rõ điều gì sẽ khiến bạn đổi ý. Điều tuyệt đối tránh là vừa bảo vệ quan điểm vừa không đưa ra được tiêu chí nào để phân xử — đó là dấu hiệu bạn đang bảo vệ cái tôi chứ không bảo vệ thiết kế.` },
{ q: `Làm sao chứng minh bạn thực sự sở hữu quyết định đó, không chỉ làm theo chỉ đạo?`, a: `Bằng cách kể cả phần bạn đã cân nhắc và loại bỏ. Nếu bạn nói "tôi chọn cách này vì cách kia sẽ gây ra vấn đề X trong điều kiện Y", người nghe biết bạn đã tự đánh giá. Bạn cũng nên nói được điều gì bạn phải chấp nhận và ai đã phải đồng ý với đánh đổi đó — điều này cho thấy bạn làm việc trong một hệ thống có người khác, chứ không chỉ một mình. Và nếu quyết định đó về sau hoá ra sai, hãy kể cả phần đó: người phỏng vấn đánh giá cao việc bạn nhận ra và sửa, hơn là một câu chuyện thành công không tì vết.` },
],
},
J04: {
attacks: [
{ q: `Bạn sẽ làm gì trong mười phút đầu tiên của một sự cố production?`, a: `Mười phút đầu nên dành cho việc giới hạn thiệt hại và thu thập thông tin, không dành cho việc tìm nguyên nhân. Cụ thể: xác nhận phạm vi ảnh hưởng — bao nhiêu người dùng, chức năng nào; kiểm tra xem có thay đổi nào vừa được triển khai không, vì đó là nguyên nhân phổ biến nhất và cũng là thứ dễ hoàn tác nhất; và thông báo cho những người liên quan để họ không cùng lúc thao tác trên hệ thống. Chỉ sau khi đã có biện pháp giảm thiệt hại hoặc xác nhận không có, mới chuyển sang tìm nguyên nhân gốc.` },
{ q: `Nếu sự cố không tái hiện được thì bạn làm gì?`, a: `Chuyển từ tái hiện sang quan sát: tìm dấu vết trong log, số liệu, và lịch sử triển khai quanh thời điểm đó, để khoanh vùng điều kiện nào có thể đã gây ra. Nếu vẫn không rõ, hãy thêm khả năng quan sát ở đúng chỗ nghi ngờ rồi chờ — và nói rõ với người liên quan rằng bạn đang làm vậy, thay vì im lặng. Điều quan trọng là đừng đóng sự cố chỉ vì nó không tái hiện; hãy ghi lại giả thuyết, để lại một chỉ số hoặc cảnh báo, và coi đó là việc còn mở.` },
],
},
J05: {
attacks: [
{ q: `Nếu thời gian có hạn, bạn cắt tầng test nào trước?`, a: `Cắt những test kiểm tra thứ đã được đảm bảo bởi công cụ hoặc bởi kiểu dữ liệu — định dạng, đặt tên, cấu trúc — vì đó là việc của bộ kiểm tra tĩnh. Giữ lại test cho những chỗ mà lỗi gây thiệt hại thật: tính toán tiền, ràng buộc dữ liệu, phân quyền, và các luồng ghi nhiều bước. Với tầng tích hợp, giữ ít test nhưng chọn đúng luồng quan trọng thay vì dàn trải. Điều nên tránh là cắt theo tỉ lệ đều ở mọi tầng, vì làm vậy bạn mất chính những test bắt được lỗi nghiêm trọng trong khi vẫn giữ những test chỉ kiểm tra hình thức.` },
{ q: `Làm sao biết bộ test của bạn thực sự có giá trị?`, a: `Bằng cách xem nó bắt được gì trong thực tế. Một cách đo đơn giản là theo dõi những lỗi lọt ra production và hỏi với mỗi lỗi: có test nào đáng lẽ phải bắt được không. Nếu câu trả lời thường là có, thì vấn đề nằm ở việc thiếu test chứ không ở việc test vô dụng. Nếu câu trả lời thường là không, hãy xem loại lỗi đó có thể kiểm tra được không — nếu có thì bổ sung, nếu không thì cần cải thiện khả năng quan sát thay vì viết thêm test. Độ phủ dòng không trả lời được câu hỏi này, vì nó đo phần mã được chạy chứ không đo phần hành vi được kiểm tra.` },
],
},
J06: {
attacks: [
{ q: `Bạn thừa nhận chưa có kinh nghiệm AWS. Người phỏng vấn hỏi tiếp: vậy bạn biết gì về AWS?`, a: `Nêu chính xác ranh giới hiểu biết của bạn, rồi cho thấy bạn hiểu các nguyên tắc chuyển được. Ví dụ: bạn chưa vận hành hàm trên nền tảng đó trong production, nhưng bạn hiểu mô hình thực thi không lưu trạng thái, hiểu rằng mọi lời gọi ra ngoài đều có thể thất bại, và hiểu rằng tài nguyên dùng chung cần được giới hạn. Rồi nêu một việc cụ thể bạn đã làm chứng minh điều đó — một hệ thống bạn từng vận hành, một sự cố bạn từng xử lý. Cách trả lời này mạnh hơn nhiều so với việc nói chung chung là sẽ học nhanh, vì nó cho thấy khoảng trống của bạn có biên rõ ràng.` },
{ q: `Nếu bạn nói mình sẽ học nhanh, làm sao chứng minh?`, a: `Bằng một ví dụ đã xảy ra, có mốc thời gian. Kể một công nghệ bạn từng chưa biết và đã đủ dùng trong một khoảng thời gian cụ thể, kèm việc bạn đã làm được gì sau đó — không phải "tôi học nhanh" mà là "tôi chưa biết X, sau hai tuần tôi đã triển khai được Y". Chi tiết quan trọng là nêu cách bạn học: đọc tài liệu chính thức, dựng một thứ nhỏ chạy được, rồi mở rộng dần. Và nên nói rõ bạn sẽ kiểm chứng hiểu biết của mình bằng cách nào, ví dụ dựng một endpoint nhỏ trên hạ tầng thật trong tuần đầu.` },
],
},
};
