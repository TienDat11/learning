// Batch HIJ — Docker/Linux/CI H04, H05, H07..H12; design I03..I08; behavioural J07..J12.
export default {
H04: {
incident: `<p>Một đội dùng Docker Compose cho môi trường phát triển. Ứng dụng đọc chuỗi kết nối database từ biến môi trường, nhưng biến đó chỉ được đặt trong <code>docker-compose.yml</code> ở máy của một người. Ba thành viên khác chạy lên và nhận lỗi kết nối. Ngoài ra, dữ liệu database biến mất sau mỗi lần chạy <code>down</code> vì không có volume, nên mỗi người phải tạo lại dữ liệu mẫu.</p>`,
askFirst: [
`Biến môi trường của một service đến từ những nguồn nào?`,
`Dữ liệu trong container mất khi nào?`,
`Làm sao để một service nói chuyện được với service khác trong Compose?`,
],
predict: {
q: `Hai service trong cùng một file Compose, service A gọi service B qua <code>localhost:5432</code>. Kết nối có thành công không?`,
a: `<p>Không. Mỗi service chạy trong không gian mạng riêng, nên <code>localhost</code> bên trong A trỏ tới chính A chứ không tới B. Compose tạo một mạng chung và đăng ký tên service như tên máy, nên A phải gọi <code>b:5432</code>. Đây là lỗi phổ biến nhất khi mới dùng Compose, và nó cũng giải thích một hiện tượng liên quan: khi chạy ứng dụng trực tiếp trên máy chủ thay vì trong container, <code>localhost</code> lại đúng — nên cùng một chuỗi kết nối có thể chạy được ở chế độ này và hỏng ở chế độ kia.</p>`,
},
anchor: `Mỗi container có không gian mạng riêng nên localhost luôn trỏ về chính nó; muốn gọi service khác phải dùng tên service trên mạng chung.`,
attacks: [
{ q: `Khi nào dùng volume, khi nào dùng bind mount?`, a: `Bind mount gắn một đường dẫn trên máy chủ vào container, nên thay đổi ở máy chủ hiện ra ngay trong container — phù hợp cho mã nguồn khi phát triển, vì bạn muốn sửa file và thấy kết quả ngay. Volume do Docker quản lý và nằm trong vùng lưu trữ của nó, phù hợp cho dữ liệu cần tồn tại qua các lần chạy — database, hàng đợi, tệp tải lên. Điểm cần nhớ là dữ liệu trong lớp ghi của container mất khi container bị xoá, nên bất cứ thứ gì bạn muốn giữ đều phải nằm trong volume hoặc bind mount.` },
{ q: `Làm sao quản lý cấu hình cho nhiều môi trường mà không lặp lại?`, a: `Tách cấu hình chung khỏi cấu hình theo môi trường. File Compose chính chứa những gì giống nhau ở mọi nơi, và các file phụ chỉ ghi đè phần khác biệt — cách này giữ cho mỗi file nhỏ và dễ đọc. Với giá trị nhạy cảm, dùng file biến môi trường không được đưa vào kho mã nguồn, và trong môi trường thật thì lấy từ kho secret của hạ tầng. Điều nên tránh là nhân bản toàn bộ file cho mỗi môi trường, vì chúng sẽ trôi khỏi nhau và không ai biết file nào là đúng.` },
],
},
H05: {
incident: `<p>Một container chạy ứng dụng bằng người dùng root. Một lỗ hổng trong thư viện xử lý ảnh cho phép thực thi mã, và kẻ tấn công có toàn quyền trong container, bao gồm khả năng ghi vào thư mục hệ thống và đọc các biến môi trường chứa khoá API. Ngoài ra, một service khác bị đánh dấu là đang chạy khoẻ trong khi thực tế tiến trình chính đã chết từ lâu nhưng một tiến trình con vẫn giữ container sống.</p>`,
askFirst: [
`Vì sao chạy bằng người dùng không phải root lại quan trọng?`,
`Healthcheck kiểm tra cái gì, và khác gì việc container còn chạy?`,
`Khoá API nên đến từ đâu?`,
],
predict: {
q: `Một container có tiến trình chính đã thoát nhưng một tiến trình con vẫn chạy nền. Docker báo trạng thái gì?`,
a: `<p>Nó vẫn báo container đang chạy, vì Docker theo dõi tiến trình có mã 1 trong container, không theo dõi toàn bộ cây tiến trình. Đây là lý do một healthcheck thật sự cần thiết: nó chủ động gọi vào ứng dụng để kiểm tra khả năng phục vụ, chứ không chỉ hỏi container còn tồn tại hay không. Điều này cũng liên quan tới việc dùng dạng exec cho lệnh khởi động, vì nếu dùng dạng shell thì tiến trình chính là shell và tín hiệu dừng không tới được ứng dụng.`,
},
anchor: `Docker chỉ theo dõi tiến trình số một, nên "container đang chạy" không có nghĩa ứng dụng đang phục vụ được — cần healthcheck thật.`,
attacks: [
{ q: `Healthcheck nên kiểm tra gì?`, a: `Nên kiểm tra khả năng phục vụ thật, ở mức đủ nhẹ để gọi thường xuyên. Với một API, một endpoint trả về nhanh và xác nhận rằng tiến trình còn xử lý được request là đủ. Cần cân nhắc có nên kiểm tra cả phụ thuộc: kiểm tra database trong healthcheck giúp phát hiện sớm nhưng cũng có thể làm toàn bộ container bị đánh dấu hỏng chỉ vì một phụ thuộc tạm thời, khiến hệ thống tự tấn công chính mình. Cách phổ biến là tách hai mức: một kiểm tra nhẹ cho vòng đời container, và một kiểm tra sâu hơn cho cảnh báo.` },
{ q: `Ngoài chạy non-root, còn gì cần làm để giảm thiệt hại khi bị chiếm container?`, a: `Bốn việc có giá trị cao. Một là dùng hệ thống tệp chỉ đọc ở nơi có thể, và chỉ mở ghi ở những thư mục thật sự cần. Hai là bỏ hết khả năng của tiến trình mà ứng dụng không dùng, vì mặc định nhiều khả năng vẫn được cấp. Ba là không gắn socket của Docker vào container ứng dụng, vì nó tương đương quyền root trên máy chủ. Bốn là dùng ảnh nền tối giản, vì ít gói hơn nghĩa là ít lỗ hổng hơn và ít công cụ hơn cho kẻ tấn công.` },
],
},
H07: {
incident: `<p>Pipeline triển khai build ảnh trong mỗi lần chạy và gắn thẻ <code>latest</code>. Một lần rollback khẩn cấp, đội chạy lại pipeline của phiên bản trước, nhưng pipeline đó build từ nhánh chính hiện tại nên tạo ra một ảnh khác với ảnh đã chạy hôm qua. Việc rollback không đưa hệ thống về trạng thái cũ. Ngoài ra, không ai biết chính xác commit nào đang chạy trên production.</p>`,
askFirst: [
`Vì sao gắn thẻ <code>latest</code> làm rollback không đáng tin?`,
`Artifact nên được tạo ở bước nào và dùng lại thế nào?`,
`Làm sao biết chính xác phiên bản nào đang chạy?`,
],
predict: {
q: `Một pipeline build ảnh rồi triển khai ngay trong cùng một lần chạy. Muốn rollback về phiên bản trước, bạn cần gì?`,
a: `<p>Bạn cần ảnh của phiên bản trước vẫn còn tồn tại và định danh được. Nếu ảnh chỉ có thẻ <code>latest</code>, nó đã bị ghi đè và bản cũ có thể đã bị xoá khỏi registry. Cách làm đúng là mỗi lần build tạo ra một artifact bất biến được định danh bằng mã commit, đẩy lên registry, và bước triển khai chỉ tham chiếu tới định danh đó. Khi đó rollback chỉ là triển khai lại một định danh đã có, không cần build lại gì, nên nó nhanh và cho đúng cùng một ảnh như lần trước.</p>`,
},
anchor: `Rollback chỉ đáng tin khi artifact là bất biến và được định danh — build lại từ mã nguồn là tạo ra một phiên bản mới chứ không phải quay về bản cũ.`,
attacks: [
{ q: `Build và deploy nên tách thành hai bước như thế nào?`, a: `Bước build tạo artifact một lần cho mỗi commit, đẩy lên registry, và không chạm tới môi trường nào. Bước deploy chỉ lấy một artifact đã tồn tại và đưa nó vào môi trường, không build gì cả. Lợi ích là artifact được kiểm thử ở staging chính là artifact chạy trên production, nên loại bỏ được cả một lớp khác biệt giữa hai môi trường. Nó cũng cho phép triển khai cùng một artifact cho nhiều môi trường và rollback bằng cách chọn một định danh cũ.` },
{ q: `Secret trong CI nên được xử lý thế nào?`, a: `Ưu tiên trao đổi danh tính tạm thời thay vì lưu khoá dài hạn: pipeline nhận một danh tính ngắn hạn từ nhà cung cấp CI và dùng nó để lấy quyền truy cập, nên không có khoá nào tồn tại lâu để bị đánh cắp. Nếu buộc phải dùng khoá dài hạn, phải đánh dấu là secret để hệ thống che trong log, giới hạn quyền tối thiểu, và xoay định kỳ. Điều tuyệt đối tránh là in secret ra log hoặc truyền nó qua tham số dòng lệnh, vì cả hai đều để lại dấu vết đọc được.` },
],
},
H08: {
incident: `<p>Một lần triển khai gồm hai bước: chạy migration đổi tên một cột, rồi triển khai mã mới. Migration chạy xong, nhưng bước triển khai mã thất bại. Trong khoảng 12 phút, phiên bản mã cũ vẫn đang chạy và truy vấn cột cũ, nên mọi request liên quan đều lỗi 500. Việc rollback migration cũng thất bại vì cột cũ đã bị xoá cùng dữ liệu.</p>`,
askFirst: [
`Vì sao migration và triển khai mã phải tương thích trong cả hai chiều?`,
`Thay đổi phá huỷ nên được chia thành những bước nào?`,
`Làm sao để rollback migration luôn thực hiện được?`,
],
predict: {
q: `Một migration xoá một cột đang được phiên bản mã cũ sử dụng. Nếu bạn triển khai mã mới thất bại và phải quay lại mã cũ, chuyện gì xảy ra?`,
a: `<p>Mã cũ lỗi ngay vì cột nó cần không còn tồn tại. Đây là lý do thay đổi phá huỷ phải được tách khỏi thay đổi mã, và tách theo thứ tự khiến cả hai phiên bản cùng chạy được trong giai đoạn chuyển tiếp. Quy trình ba bước thường dùng: trước tiên thêm cột mới và để mã ghi vào cả hai cột, sau khi mọi thứ ổn định thì chuyển sang chỉ đọc cột mới, và chỉ xoá cột cũ ở một lần triển khai riêng sau đó. Như vậy ở mọi thời điểm đều có thể quay lại phiên bản trước mà không mất dữ liệu.</p>`,
},
anchor: `Migration phá huỷ đi trước mã là tự tay lấy đi đường lùi, nên thay đổi schema phải được chia thành các bước mà cả hai phiên bản mã cùng chạy được.`,
attacks: [
{ q: `Làm sao chạy một migration lớn trên bảng hàng chục triệu dòng mà không khoá bảng?`, a: `Chia thành nhiều bước nhỏ và kiểm soát khoá ở từng bước. Thêm cột cho phép giá trị rỗng thường là thao tác nhẹ. Tạo chỉ mục nên chạy ở chế độ không khoá ghi, chấp nhận thời gian lâu hơn nhưng không chặn ghi. Thêm ràng buộc <code>NOT NULL</code> nên chia làm hai: thêm ràng buộc ở trạng thái không kiểm tra dữ liệu cũ, rồi kiểm tra và xác nhận trong một bước riêng. Với việc làm đầy dữ liệu, chia theo lô nhỏ để mỗi lô là một transaction ngắn, tránh một transaction khổng lồ giữ khoá lâu và làm phình bảng.` },
{ q: `Migration có nên nằm trong cùng pipeline với triển khai mã không?`, a: `Nên nằm trong pipeline nhưng phải là bước riêng, chạy trước, và phải đảm bảo chỉ một tiến trình chạy nó. Nếu nhiều bản sao ứng dụng cùng khởi động và cùng chạy migration, chúng sẽ tranh nhau và có thể áp dụng hai lần. Cần một cơ chế khoá để chỉ một tiến trình được chạy. Và migration phải tương thích ngược — nghĩa là sau khi chạy, cả phiên bản mã cũ đang chạy lẫn phiên bản mới sắp chạy đều phải hoạt động được, vì trong lúc triển khai luôn có một khoảng cả hai cùng tồn tại.` },
],
},
H09: {
incident: `<p>Một service trên máy chủ Linux đột nhiên không nhận kết nối. Kiểm tra cho thấy tiến trình vẫn chạy, nhưng cổng không phản hồi. Một kỹ sư kiểm tra bằng cách khởi động lại service, và sự cố quay lại sau hai giờ. Không ai đọc được log vì ứng dụng ghi vào một tệp trong thư mục của người dùng, và tệp đó không có quyền đọc cho nhóm vận hành.</p>`,
askFirst: [
`Làm sao kiểm tra một tiến trình có thật sự đang lắng nghe trên cổng không?`,
`Quyền trên tệp log ảnh hưởng gì tới việc xử lý sự cố?`,
`Dấu hiệu nào phân biệt hết file descriptor với cạn cổng?`,
],
predict: {
q: `Một tiến trình đang chạy nhưng không nhận kết nối trên cổng đã cấu hình. Bạn kiểm tra gì trước?`,
a: `<p>Kiểm tra xem tiến trình có thật sự đang lắng nghe trên cổng đó hay không, chứ không chỉ kiểm tra nó còn tồn tại. Tiến trình có thể đã khởi động nhưng thất bại ở bước mở cổng — vì cổng đã bị tiến trình khác chiếm, vì thiếu quyền mở cổng dưới 1024, hoặc vì nó đang lắng nghe trên một địa chỉ khác với địa chỉ bạn đang gọi tới. Trường hợp cuối là phổ biến và khó thấy: lắng nghe trên địa chỉ vòng lặp thì chỉ nhận được kết nối từ chính máy đó.`,
},
anchor: `"Tiến trình còn chạy" và "cổng đang phục vụ" là hai câu hỏi khác nhau, nên chẩn đoán phải kiểm tra trạng thái lắng nghe chứ không chỉ trạng thái tiến trình.`,
attacks: [
{ q: `Hết file descriptor gây ra triệu chứng gì?`, a: `Triệu chứng đặc trưng là service chạy bình thường một thời gian rồi bắt đầu từ chối kết nối mới hoặc không mở được tệp, trong khi tiến trình vẫn sống và CPU thấp. Nguyên nhân thường là rò rỉ: kết nối hoặc tệp không được đóng, nên số lượng tăng dần tới hạn mức của tiến trình. Điều cần phân biệt là hạn mức theo tiến trình khác với hạn mức toàn hệ thống, và cả hai đều có thể bị chạm. Cách chẩn đoán là đếm số file descriptor đang mở của tiến trình và so với hạn mức, rồi xem chúng thuộc loại nào để đoán chỗ rò rỉ.` },
{ q: `Vì sao quyền trên tệp log lại quan trọng trong xử lý sự cố?`, a: `Vì nếu người trực không đọc được log thì mọi chẩn đoán đều thành phỏng đoán, và thời gian khắc phục tăng lên bội phần. Quyền cần được đặt sao cho nhóm vận hành đọc được mà không cần quyền root, và ứng dụng chỉ có quyền ghi chứ không có quyền đọc toàn bộ. Một vấn đề liên quan là xoay vòng log: nếu log không được xoay, đĩa đầy và đó lại là một nguyên nhân sự cố khác. Và log nên được đẩy về một nơi tập trung, vì khi máy chủ hỏng thì log trên chính máy đó cũng mất theo.` },
],
},
H10: {
incident: `<p>Sau một sự cố kéo dài 90 phút, buổi rút kinh nghiệm cho thấy đội đã mất 25 phút đầu chỉ để xác định sự cố bắt đầu từ khi nào. Dashboard có 60 biểu đồ nhưng không có biểu đồ nào hiển thị tỉ lệ lỗi theo phiên bản triển khai, nên không ai liên hệ được sự cố với lần deploy 20 phút trước đó. Không có cảnh báo nào kêu vì ngưỡng được đặt theo giá trị trung bình, và giá trị trung bình vẫn nằm trong ngưỡng.</p>`,
askFirst: [
`Metric nào phát hiện sự cố sớm nhất?`,
`Vì sao ngưỡng theo giá trị trung bình lại bỏ sót?`,
`Thông tin nào cần có ngay khi mở dashboard?`,
],
predict: {
q: `Một sự cố ảnh hưởng tới 3% request nhưng rất nặng với nhóm người dùng đó. Chỉ số trung bình có phát hiện được không?`,
a: `<p>Không. Nếu 97% request vẫn nhanh và thành công, giá trị trung bình gần như không đổi, nên ngưỡng theo trung bình sẽ không kêu. Đây là lý do phải đặt cảnh báo theo phân vị cao — p95, p99 — và theo tỉ lệ lỗi, chứ không theo trung bình. Với trải nghiệm người dùng, điều đáng quan tâm không phải là người dùng trung bình mà là nhóm người dùng tệ nhất, vì một tỉ lệ nhỏ gặp lỗi vẫn là sự cố thật đối với họ và vẫn là vấn đề danh tiếng với doanh nghiệp.</p>`,
},
anchor: `Giá trị trung bình che mất nhóm người dùng chịu thiệt, nên cảnh báo phải dựa trên phân vị cao và tỉ lệ lỗi.`,
attacks: [
{ q: `Ba tín hiệu nào bạn muốn có ngay khi mở dashboard lúc có sự cố?`, a: `Thứ nhất, tỉ lệ lỗi và độ trễ theo phân vị cao, tách theo phiên bản đang chạy — vì tách theo phiên bản là cách nhanh nhất để biết có phải do deploy hay không. Thứ hai, độ trễ và tỉ lệ lỗi của từng phụ thuộc bên ngoài, vì phần lớn sự cố nằm ở đó chứ không nằm trong service. Thứ ba, các tài nguyên có giới hạn cứng: độ sâu hàng đợi, tuổi message cũ nhất, số kết nối đang dùng so với hạn mức. Ba nhóm này trả lời được câu hỏi "hỏng ở đâu" trong vài phút thay vì vài chục phút.` },
{ q: `Cảnh báo nên đặt thế nào để không bị bỏ qua?`, a: `Mỗi cảnh báo phải gắn với một hành động cụ thể, và nếu không có hành động nào thì nó không nên tồn tại. Cảnh báo nên dựa trên triệu chứng người dùng cảm nhận được — tỉ lệ lỗi, độ trễ — chứ không dựa trên nguyên nhân nội bộ như mức dùng CPU, vì CPU cao mà người dùng vẫn ổn thì không phải sự cố. Cần phân mức rõ ràng: mức đánh thức người trực chỉ dành cho sự cố ảnh hưởng người dùng, còn những thứ khác đi vào kênh thông tin thường. Và phải định kỳ rà lại để xoá những cảnh báo không bao giờ dẫn tới hành động, vì chúng làm mờ những cảnh báo thật.` },
],
},
H11: {
incident: `<p>Một nhánh tính năng bị lệch 60 commit so với nhánh chính. Dev chọn rebase để có lịch sử sạch, và trong quá trình xử lý 14 xung đột, một thay đổi của đồng nghiệp bị ghi đè và mất. Việc mất mát chỉ được phát hiện ba ngày sau trên production. Ngoài ra, cùng nhánh đó đã được đẩy lên máy chủ chung và hai người khác đang làm việc trên nó.</p>`,
askFirst: [
`Rebase thay đổi điều gì, và điều đó nguy hiểm ở đâu?`,
`Khi nào không được rebase một nhánh đã chia sẻ?`,
`Làm sao hoàn tác một thay đổi đã lên production?`,
],
predict: {
q: `Bạn rebase một nhánh đã được đẩy lên máy chủ chung và đồng nghiệp đã kéo về. Chuyện gì xảy ra với lịch sử của họ?`,
a: `<p>Lịch sử phân kỳ: các commit của nhánh đã bị viết lại thành commit mới với định danh khác, nên nhánh trên máy đồng nghiệp và nhánh trên máy chủ không còn chung tổ tiên ở đoạn đó. Khi họ kéo về, Git sẽ cố hợp nhất hai lịch sử và tạo ra xung đột hoặc nhân bản commit, và nếu họ vô tình đẩy lên thì lịch sử cũ quay trở lại. Đây là lý do quy tắc là: rebase chỉ dùng cho nhánh riêng chưa chia sẻ, còn nhánh đã chia sẻ thì dùng merge.`,
},
anchor: `Rebase viết lại lịch sử nên chỉ an toàn trên nhánh riêng — viết lại nhánh đã chia sẻ là làm hỏng lịch sử của người khác.`,
attacks: [
{ q: `Làm sao hoàn tác một thay đổi đã lên production?`, a: `Nếu thay đổi đã được chia sẻ, hoàn tác bằng cách tạo một commit mới đảo ngược nó, vì cách này không viết lại lịch sử nên an toàn cho mọi người. Chỉ dùng cách viết lại lịch sử khi commit chưa từng được đẩy đi. Một điểm thực tế quan trọng: nếu thay đổi đó kèm migration database, hoàn tác mã không hoàn tác được schema, nên cần một migration đảo ngược riêng hoặc một bước khôi phục dữ liệu. Đó là lý do các thay đổi phá huỷ cần được tách khỏi thay đổi mã.` },
{ q: `Làm sao giảm xung đột khi nhiều người cùng làm việc?`, a: `Bốn thói quen có tác động lớn nhất. Một là tích hợp thường xuyên — nhánh sống ngắn, vài ngày chứ không phải vài tuần. Hai là chia nhỏ thay đổi theo chiều dọc, mỗi thay đổi chạm ít tệp. Ba là tránh việc định dạng lại toàn bộ tệp trong cùng một thay đổi với thay đổi logic, vì nó làm mọi dòng thành xung đột. Bốn là thống nhất quy ước đặt tên và cấu trúc thư mục, vì xung đột nặng nhất thường đến từ việc di chuyển và đổi tên tệp.` },
],
},
H12: {
incident: `<p>Người dùng báo qua kênh hỗ trợ rằng nút xuất báo cáo "đôi khi không hoạt động". Phiếu được chuyển cho đội kỹ thuật, nhưng không có mã lỗi, không có thời điểm, không có trình duyệt, và không ai tái hiện được. Phiếu nằm đó hai tuần. Khi có người thử lại với tài khoản của chính người báo, lỗi tái hiện ngay: báo cáo vượt quá thời gian chờ khi có hơn 50.000 dòng.</p>`,
askFirst: [
`Thông tin nào còn thiếu để biến báo cáo này thành việc làm được?`,
`Vì sao lỗi không tái hiện được ở môi trường của đội?`,
`Sau khi sửa, làm sao biết sửa đúng và không lặp lại?`,
],
predict: {
q: `Một báo cáo lỗi chỉ nói "nút không hoạt động". Bước đầu tiên bạn làm là gì?`,
a: `<p>Biến nó thành một câu hỏi kiểm tra được: lỗi xảy ra với tài khoản nào, vào thời điểm nào, trên dữ liệu nào, và trình duyệt nào. Cách nhanh nhất thường là hỏi lại người báo một vài câu cụ thể, hoặc dùng chính tài khoản và dữ liệu của họ để tái hiện. Việc này quan trọng vì phần lớn thời gian của một sự cố nằm ở chỗ hiểu sai vấn đề, không nằm ở chỗ sửa. Và nếu hệ thống có định danh request trả về cho người dùng, bước này có thể rút ngắn từ ngày xuống còn phút.</p>`,
},
anchor: `Một báo cáo lỗi không tái hiện được không phải là vấn đề khó, mà là vấn đề chưa được mô tả đủ để trở thành câu hỏi kiểm tra được.`,
attacks: [
{ q: `Làm sao rút ngắn vòng lặp từ lúc người dùng báo tới lúc bạn hiểu vấn đề?`, a: `Bốn việc, theo thứ tự chi phí tăng dần. Một là hiển thị một mã tham chiếu cho mỗi lỗi và yêu cầu người dùng gửi kèm — mã này tra ra được log tương ứng. Hai là ghi lại các hành động gần nhất của phiên để tái dựng đường đi. Ba là có một cách để tái hiện với dữ liệu của chính người dùng trong môi trường an toàn, vì nhiều lỗi phụ thuộc vào hình dạng dữ liệu chứ không phụ thuộc vào code. Bốn là một kênh cho phép người dùng gửi ảnh chụp hoặc bản ghi màn hình, vì với lỗi giao diện thì một ảnh nói nhiều hơn một đoạn mô tả.` },
{ q: `Sau khi sửa xong, làm sao đóng vòng lặp cho đúng?`, a: `Ba bước. Một là xác nhận với chính người đã báo rằng vấn đề đã hết, trên đúng dữ liệu và tài khoản của họ — vì đó là người duy nhất biết chắc. Hai là thêm một kiểm tra tự động để lỗi đó không quay lại: một test, một ràng buộc, hoặc một cảnh báo. Ba là trả lời câu hỏi vì sao lỗi này không bị phát hiện sớm hơn, và sửa luôn khoảng trống đó nếu chi phí hợp lý. Điều nên tránh là đóng phiếu ngay sau khi deploy mà không xác nhận, vì nếu vấn đề vẫn còn thì người dùng sẽ mất niềm tin vào cả kênh báo cáo.` },
],
},
I03: {
incident: `<p>Một endpoint tổng hợp số liệu theo phòng ban nhận danh sách 80.000 bản ghi. Code cũ duyệt từng bản ghi rồi, với mỗi bản ghi, duyệt lại toàn bộ danh sách kết quả để tìm nhóm tương ứng. Endpoint mất 34 giây và tiêu tốn 100% một nhân CPU. Khi số bản ghi tăng gấp đôi, thời gian tăng gần gấp bốn.</p>`,
askFirst: [
`Vì sao thời gian tăng nhanh hơn số bản ghi?`,
`Cấu trúc dữ liệu nào làm phép tra cứu theo khoá trở nên rẻ?`,
`Khi nào nên để database làm việc gộp nhóm thay vì làm trong ứng dụng?`,
],
predict: {
q: `Với <code>n</code> bản ghi, nếu mỗi bản ghi phải duyệt lại toàn bộ danh sách kết quả để tìm nhóm thì độ phức tạp là bao nhiêu?`,
a: `<p>O(n²) trong trường hợp xấu nhất, vì với mỗi bản ghi bạn thực hiện một phép tìm kiếm tuyến tính trên danh sách kết quả — mà danh sách đó cũng có thể lớn tới <code>n</code> phần tử. Đó là lý do tăng gấp đôi dữ liệu làm thời gian tăng gần gấp bốn. Thay danh sách bằng một bảng băm khoá theo tên nhóm đưa phép tra cứu về trung bình O(1), nên toàn bộ vòng lặp còn O(n) và thời gian tăng tuyến tính theo dữ liệu.</p>`,
},
anchor: `Tìm kiếm tuyến tính trong một vòng lặp là O(n²) trá hình, và bảng băm là thứ biến nó về O(n).`,
attacks: [
{ q: `Khi nào nên để database gộp nhóm thay vì làm trong ứng dụng?`, a: `Khi dữ liệu lớn hơn mức bạn muốn truyền qua mạng, hoặc khi bạn chỉ cần kết quả tổng hợp chứ không cần từng bản ghi. Database có chỉ mục và có thể dùng nhiều nhân, và quan trọng hơn là nó không phải chuyển toàn bộ dữ liệu thô cho ứng dụng. Ngược lại, làm trong ứng dụng phù hợp khi logic gộp nhóm phức tạp, khi cần gọi dịch vụ ngoài cho từng nhóm, hoặc khi dữ liệu đã nằm sẵn trong bộ nhớ. Điểm cân nhắc thực tế là chi phí truyền: 80.000 bản ghi qua mạng có thể tốn nhiều thời gian hơn chính phép gộp.` },
{ q: `Bảng băm có nhược điểm gì trong trường hợp này?`, a: `Nó đổi thời gian lấy bộ nhớ: bạn cần giữ một khoá cho mỗi nhóm riêng biệt, nên nếu số nhóm xấp xỉ số bản ghi thì bộ nhớ tăng tuyến tính theo dữ liệu. Nó cũng không giữ thứ tự, nên nếu kết quả cần sắp xếp thì phải sắp thêm một bước. Và nếu khoá không băm được — ví dụ khoá là một cấu trúc phức tạp — bạn phải tự định nghĩa cách so sánh và băm. Với dữ liệu rất lớn, có thể cần cách tiếp cận chia để trị hoặc để database làm, thay vì gộp tất cả trong bộ nhớ.` },
],
},
I04: {
incident: `<p>Một hàm phân trang nhận chỉ số trang từ tham số truy vấn. Với trang bằng 0, nó trả về mảng rỗng. Với trang vượt quá số trang, nó trả về mảng rỗng, và component hiển thị vòng lặp vô hạn vì hiểu mảng rỗng là "còn dữ liệu". Ngoài ra, backend đánh số trang từ 1 còn hàm dùng chỉ số từ 0, nên trang đầu tiên của người dùng thực chất là trang thứ hai của dữ liệu.</p>`,
askFirst: [
`Quy ước đánh số trang khác nhau ở đâu?`,
`Giá trị nào là biên cần kiểm tra?`,
`Làm sao để lỗi biên không lan ra giao diện?`,
],
predict: {
q: `Với mảng 10 phần tử, <code>items.slice(20, 30)</code> trả về gì?`,
a: `<p>Nó trả về mảng rỗng, không ném lỗi. Đây là điểm quan trọng: chỉ số vượt độ dài không phải là lỗi ở JavaScript mà là một kết quả hợp lệ — mảng rỗng. Vì vậy code gọi hàm này phải phân biệt "không có dữ liệu ở trang này" với "đã hết dữ liệu", và đó là hai chuyện khác nhau. Nếu giao diện dùng mảng rỗng làm điều kiện dừng thì nó dừng quá sớm hoặc lặp mãi, tuỳ theo cách nó diễn giải. Cách chắc chắn là chuẩn hoá chỉ số ở một chỗ và trả về kèm thông tin còn dữ liệu hay không.</p>`,
},
anchor: `Chỉ số vượt biên trong JavaScript trả về rỗng chứ không báo lỗi, nên biên phải được chuẩn hoá ở một chỗ thay vì tin vào hành vi im lặng.`,
attacks: [
{ q: `Làm sao để hai bên thống nhất quy ước phân trang?`, a: `Chọn một quy ước và ghi rõ trong tài liệu API, rồi chuyển đổi ở đúng một chỗ — thường là lớp gọi API ở client. Điều nên tránh là để mỗi màn hình tự chuyển đổi, vì sẽ có chỗ làm đúng và chỗ làm sai. Một cách tốt hơn nữa là tránh hẳn việc đánh số trang và dùng con trỏ, vì khi đó không còn quy ước nào để lệch. Nếu buộc phải giữ số trang, hãy viết một test cho trường hợp trang đầu, trang cuối và trang vượt biên.` },
{ q: `Trả về tổng số trang hay con trỏ tới trang sau thì tốt hơn?`, a: `Tuỳ vào giao diện cần gì. Nếu người dùng cần nhảy tới trang bất kỳ thì phải trả tổng số, và điều đó đồng nghĩa với việc phải đếm toàn bộ dữ liệu khớp — một phép đếm có thể đắt trên bảng lớn. Nếu giao diện chỉ cần cuộn tiếp, trả về con trỏ tới trang sau là đủ, rẻ hơn nhiều vì không phải đếm, và cũng ổn định hơn khi dữ liệu đang thay đổi. Điểm cần lưu ý với con trỏ là phải trả kèm cờ cho biết còn dữ liệu hay không, vì nếu không client lại phải suy đoán từ một trang rỗng.` },
],
},
I05: {
incident: `<p>Một tính năng tìm kiếm so khớp tên khách hàng bằng phép so sánh chuỗi trực tiếp. Khách hàng tên có dấu khác nhau tuỳ theo thiết bị nhập, chữ hoa chữ thường không khớp, và khoảng trắng thừa ở đầu cuối làm phép so sánh thất bại. Kết quả là cùng một người có ba bản ghi khác nhau, và tìm kiếm bỏ sót.</p>`,
askFirst: [
`Chuẩn hoá chuỗi nên làm ở đâu và khi nào?`,
`Vì sao so sánh trực tiếp chuỗi lại mong manh?`,
`Nên lưu dạng gốc hay dạng đã chuẩn hoá?`,
],
predict: {
q: `Hai chuỗi <code>"Nguyễn An"</code> và <code>"Nguyen An"</code> so sánh bằng có bằng nhau không?`,
a: `<p>Không, chúng là hai chuỗi khác nhau ở mức mã điểm. Vấn đề sâu hơn là cùng một chữ cái có thể được biểu diễn bằng nhiều cách trong Unicode: một ký tự có dấu sẵn, hoặc một ký tự cơ bản cộng dấu tổ hợp. Hai cách này trông giống hệt nhau nhưng so sánh bằng lại khác nhau. Cách xử lý là chuẩn hoá Unicode về một dạng thống nhất trước khi so sánh, và với tìm kiếm không phân biệt dấu thì cần thêm một dạng đã bỏ dấu để tra cứu.</p>`,
},
anchor: `Cùng một chữ có thể có nhiều biểu diễn Unicode, nên so sánh chuỗi chỉ đáng tin sau khi đã chuẩn hoá về một dạng thống nhất.`,
attacks: [
{ q: `Nên lưu dạng gốc hay dạng đã chuẩn hoá?`, a: `Lưu cả hai, với mục đích khác nhau. Dạng gốc để hiển thị, vì đó là thứ người dùng đã nhập và bạn không nên sửa nó. Dạng chuẩn hoá để so khớp, tìm kiếm và đặt ràng buộc duy nhất, vì đó là dạng đã loại bỏ khác biệt không mang nghĩa. Cách này tốn thêm dung lượng nhưng tránh được cả hai lỗi thường gặp: hiển thị sai tên người dùng, và bỏ sót kết quả tìm kiếm. Cột chuẩn hoá cũng nên có chỉ mục, nếu không phép tìm kiếm sẽ phải quét toàn bảng.` },
{ q: `Ràng buộc duy nhất trên email nên áp dụng thế nào?`, a: `Trên dạng đã chuẩn hoá, và cần quyết định rõ có phân biệt chữ hoa chữ thường hay không. Trong thực tế phần lớn hệ thống coi email không phân biệt chữ hoa chữ thường ở phần tên miền và thường cả ở phần tên người dùng, nên lưu dạng chữ thường để tránh hai tài khoản cùng một địa chỉ. Cần cẩn thận với quy tắc của phần tên miền, vì về mặt kỹ thuật nó không phân biệt hoa thường. Và ràng buộc duy nhất phải nằm ở database chứ không chỉ ở tầng kiểm tra ứng dụng, vì chỉ database mới nguyên tử trước hai request đồng thời.` },
],
},
I06: {
incident: `<p>Một đội xây dựng lớp trừu tượng cho tầng lưu trữ với mục tiêu "sau này có thể đổi database". Sau sáu tháng, có 14 interface và 31 lớp cài đặt cho ba thực thể. Việc thêm một trường vào một bảng cần sửa bảy tệp. Chưa lần nào đội đổi database. Thời gian cho một tính năng nhỏ tăng từ nửa ngày lên ba ngày.</p>`,
askFirst: [
`Lớp trừu tượng này đang giải quyết vấn đề có thật hay vấn đề tưởng tượng?`,
`Nguyên tắc nào bị áp dụng quá mức?`,
`Làm sao đơn giản hoá mà không mất khả năng thay đổi sau này?`,
],
predict: {
q: `Một interface có đúng một lớp cài đặt và không có kế hoạch cụ thể nào cho lớp thứ hai. Nó mang lại lợi ích gì?`,
a: `<p>Rất ít, và nó có chi phí thật. Lợi ích duy nhất là cho phép thay thế trong test, nhưng điều đó thường đạt được bằng cách khác rẻ hơn. Chi phí là một tầng gián tiếp phải đọc qua mỗi lần tìm hiểu code, một chỗ nữa để định nghĩa kiểu, và một chỗ nữa phải sửa khi yêu cầu thay đổi. Nguyên tắc thực dụng là trừu tượng hoá khi có ít nhất hai cài đặt thật, hoặc khi đã thấy rõ sự thay đổi sắp tới — không trừu tượng hoá cho một tương lai có thể không bao giờ tới.</p>`,
},
anchor: `Trừu tượng hoá là một khoản vay: chỉ nên vay khi có nhu cầu thật, vì lãi phải trả ở mọi lần đọc và mọi lần sửa sau đó.`,
attacks: [
{ q: `Vậy làm sao cân bằng giữa đơn giản và chuẩn bị cho tương lai?`, a: `Bằng cách chuẩn bị ở những chỗ rẻ và trì hoãn ở những chỗ đắt. Những ranh giới rẻ là những ranh giới tự nhiên đã tồn tại: giữa HTTP và nghiệp vụ, giữa nghiệp vụ và truy cập dữ liệu, giữa ứng dụng và dịch vụ bên ngoài. Những ranh giới đắt là những lớp trừu tượng tự tạo quanh một thứ chưa có biến thể. Một quy tắc hữu ích là khi bạn cần thay đổi lần thứ ba ở cùng một chỗ, hãy trừu tượng hoá — vì lúc đó bạn đã có đủ thông tin để thiết kế đúng, thay vì đoán.` },
{ q: `DRY áp dụng sai thì biểu hiện thế nào?`, a: `Khi hai đoạn code trông giống nhau nhưng thay đổi vì những lý do khác nhau. Gộp chúng lại tạo ra một hàm có tham số điều khiển hành vi, và mỗi khi một trong hai bên cần đổi, bạn phải thêm một nhánh nữa. Dấu hiệu nhận biết là một hàm có nhiều cờ boolean hoặc nhiều nhánh if mà mỗi nhánh chỉ phục vụ một người gọi. Trùng lặp về hình thức nhưng khác nhau về lý do thay đổi thì không phải là trùng lặp cần loại bỏ — gộp chúng là tạo ra ghép nối sai.` },
],
},
I07: {
incident: `<p>Một endpoint xử lý đơn hàng trực tiếp gọi database, gọi dịch vụ thanh toán, gửi email và ghi log. Khi cần viết test cho quy tắc tính phí, đội phải dựng cả bốn phụ thuộc. Khi cần đổi nhà cung cấp thanh toán, họ phải sửa chính hàm xử lý. Và khi một trong bốn phụ thuộc chậm, toàn bộ endpoint chậm theo.</p>`,
askFirst: [
`Hàm này đang có mấy lý do để thay đổi?`,
`Ranh giới nào nên được tách ra trước?`,
`Tách ra có làm code phức tạp hơn không?`,
],
predict: {
q: `Một hàm vừa tính toán nghiệp vụ vừa gọi dịch vụ bên ngoài. Việc kiểm thử nó khó ở đâu?`,
a: `<p>Khó ở chỗ bạn không thể kiểm tra logic mà không kéo theo hệ thống bên ngoài. Muốn test nhanh và ổn định thì phải thay thế dịch vụ ngoài bằng một đối tượng giả, nhưng để làm được điều đó thì hàm phải nhận phụ thuộc từ bên ngoài thay vì tự tạo. Đây chính là giá trị thực dụng của việc tách ranh giới: nó không phải là kiến trúc cho đẹp, mà là điều kiện để logic thuần tuý trở thành thứ kiểm tra được mà không cần hạ tầng.</p>`,
},
anchor: `Tách phụ thuộc ra khỏi logic không phải để kiến trúc đẹp mà để logic thuần tuý trở thành thứ kiểm tra được.`,
attacks: [
{ q: `Tách lớp có làm code phức tạp hơn không?`, a: `Có, và cần thừa nhận điều đó. Bạn thêm tệp, thêm khai báo, và thêm một bước để lần theo luồng khi đọc code. Chi phí đó chỉ đáng trả khi nó mua được thứ cụ thể: logic kiểm tra được mà không cần hạ tầng, hoặc khả năng thay một phụ thuộc mà không sửa nghiệp vụ. Nếu một endpoint chỉ đọc dữ liệu và trả về, việc tách thành ba lớp là chi phí thuần tuý. Quy tắc thực dụng là tách khi có lý do thật — nhiều cài đặt, cần test logic mà không cần hạ tầng, hoặc phụ thuộc thay đổi độc lập với nghiệp vụ.` },
{ q: `Dependency injection có nhất thiết phải dùng framework không?`, a: `Không. Ở dạng đơn giản nhất, nó chỉ là việc truyền phụ thuộc vào qua tham số khởi tạo thay vì để đối tượng tự tạo ra chúng. Điều đó cho phép thay thế trong test bằng một đối tượng đơn giản, không cần thư viện nào. Framework chỉ giúp khi số lượng phụ thuộc và vòng đời trở nên phức tạp — khi bạn cần biết cái nào dùng chung, cái nào tạo mới cho mỗi request. Với những hệ thống nhỏ, tự truyền tham số rõ ràng hơn và dễ lần theo hơn là để framework tự giải quyết.` },
],
},
I08: {
incident: `<p>Một endpoint kiểm tra xem một mã giảm giá có hợp lệ không, và được gọi 4.000 lần mỗi phút. Code cũ đọc toàn bộ danh sách mã từ database rồi duyệt tuyến tính qua 60.000 phần tử cho mỗi lần kiểm tra. CPU của database ở mức 95% và endpoint mất 400 ms mỗi lần gọi, dù chỉ cần trả về đúng hoặc sai.</p>`,
askFirst: [
`Thao tác thực sự cần làm là gì?`,
`Cấu trúc dữ liệu nào phù hợp với thao tác đó?`,
`Nên giữ cấu trúc đó ở đâu?`,
],
predict: {
q: `Bạn cần kiểm tra sự tồn tại của một phần tử trong tập 60.000 phần tử, 4.000 lần mỗi phút. Bạn chọn cấu trúc nào?`,
a: `<p>Một bảng băm hoặc một tập hợp, vì thao tác cần làm là kiểm tra thành viên và cấu trúc đó cho phép tra cứu trung bình O(1). Một danh sách buộc phải duyệt tuần tự nên là O(n) cho mỗi lần kiểm tra, và với 60.000 phần tử nhân 4.000 lần mỗi phút thì đó là hàng trăm triệu phép so sánh mỗi phút cho một câu hỏi đúng-sai. Điểm cần cân nhắc thêm là cấu trúc đó nằm ở đâu: trong database với chỉ mục duy nhất, hay trong bộ nhớ của ứng dụng với thời hạn làm mới.</p>`,
},
anchor: `Chọn cấu trúc dữ liệu là chọn theo thao tác sẽ làm nhiều nhất, không theo thứ tự dữ liệu được tạo ra.`,
attacks: [
{ q: `Nên kiểm tra trong bộ nhớ hay trong database?`, a: `Phụ thuộc vào tần suất thay đổi và yêu cầu nhất quán. Nếu danh sách mã ít đổi và có thể chấp nhận một khoảng trễ nhỏ, giữ nó trong bộ nhớ ứng dụng với thời hạn làm mới định kỳ cho độ trễ rất thấp và giảm tải database. Nếu mã có thể bị thu hồi và việc dùng mã đã thu hồi là không chấp nhận được, phải kiểm tra ở database. Cách dung hoà thường dùng là kiểm tra nhanh trong bộ nhớ để loại phần lớn trường hợp, rồi xác nhận ở database cho những trường hợp đi qua.` },
{ q: `Nếu cần kiểm tra cả tiền tố của mã thì sao?`, a: `Khi đó thao tác không còn là kiểm tra thành viên thuần tuý mà là tìm theo tiền tố, và bảng băm không làm được việc đó. Cấu trúc phù hợp là cây tìm kiếm theo ký tự, hoặc đơn giản hơn là dùng chỉ mục trên cột mã với phép so khớp tiền tố trong database. Điểm cần chú ý là phép so khớp mẫu ở giữa chuỗi không dùng được chỉ mục thông thường, nên nếu mẫu tìm kiếm linh hoạt thì cần đến chỉ mục chuyên dụng cho văn bản. Đây là ví dụ cho thấy việc chọn cấu trúc phải xuất phát từ thao tác, và thao tác thay đổi thì cấu trúc phải đổi theo.` },
],
},
J07: {
incident: `<p>Trong một buổi phỏng vấn, ứng viên trình bày dự án tìm kiếm tài liệu của mình trong bốn phút bằng cách liệt kê công nghệ: dùng mô hình nhúng, dùng cơ sở dữ liệu vector, dùng tìm kiếm từ khoá, kết hợp hai kết quả. Người phỏng vấn hỏi "vì sao cần kết hợp hai cách thay vì chỉ dùng một". Ứng viên trả lời rằng cách kết hợp cho kết quả tốt hơn, nhưng không nêu được trường hợp nào thì cách này thắng cách kia, cũng không có số liệu nào.</p>`,
askFirst: [
`Điểm nào trong dự án là quyết định kỹ thuật, không phải lựa chọn công nghệ?`,
`Vì sao tìm kiếm từ khoá và tìm kiếm ngữ nghĩa thất bại ở những chỗ khác nhau?`,
`Số liệu nào chứng minh việc kết hợp là đúng?`,
],
predict: {
q: `Người phỏng vấn hỏi "vì sao bạn kết hợp hai phương pháp tìm kiếm". Câu trả lời nào mạnh hơn?`,
a: `<p>Câu trả lời mạnh nêu ra một trường hợp cụ thể mà một phương pháp thất bại và phương pháp kia cứu được, kèm số liệu. Ví dụ: người dùng tra cứu mã lỗi chính xác thì tìm kiếm từ khoá thắng vì tìm kiếm ngữ nghĩa làm mờ ký hiệu; còn khi người dùng diễn đạt bằng lời thông thường không trùng từ nào với tài liệu thì tìm kiếm ngữ nghĩa thắng. Câu trả lời yếu là "kết hợp cho kết quả tốt hơn" — nó không nói được cơ chế, không nói được khi nào, và không có gì để kiểm chứng.</p>`,
},
anchor: `Kể một dự án là kể những quyết định kèm lý do và đánh đổi, không phải kể danh sách công nghệ đã dùng.`,
attacks: [
{ q: `Nếu chưa đo được chỉ số chất lượng tìm kiếm thì trình bày thế nào?`, a: `Trung thực về việc chưa đo, và nói rõ bạn sẽ đo cái gì. Bạn có thể mô tả tập đánh giá nhỏ mà bạn tự dựng — vài chục câu hỏi kèm tài liệu đúng — và cách bạn so sánh hai phương pháp trên đó. Điều này vẫn mạnh hơn nhiều so với một khẳng định không có cơ sở, vì nó cho thấy bạn biết chất lượng phải được đo chứ không phải cảm nhận. Và nếu bạn có quan sát định tính — ví dụ nhận ra tìm kiếm ngữ nghĩa hay bỏ sót mã lỗi — hãy nêu nó như một giả thuyết kèm cách kiểm chứng.` },
{ q: `Người phỏng vấn hỏi "nếu làm lại, bạn đổi gì". Bạn trả lời thế nào?`, a: `Chọn một quyết định cụ thể và nói rõ bạn đổi vì lý do gì, kèm điều bạn đã học được. Ví dụ: đáng lẽ nên dựng tập đánh giá trước khi chọn cách kết hợp, vì không có nó thì mọi điều chỉnh trọng số đều là phỏng đoán. Hoặc: đáng lẽ nên tách phần tiền xử lý tài liệu thành một bước riêng có thể chạy lại, vì khi đổi cách chia đoạn thì phải xử lý lại toàn bộ. Câu trả lời tốt cho thấy bạn rút ra được nguyên tắc, không chỉ kể lại một hối tiếc.` },
],
},
J08: {
incident: `<p>Trong một buổi phỏng vấn thiết kế, ứng viên được hỏi nên chọn cơ sở dữ liệu quan hệ hay cơ sở dữ liệu khoá-giá trị cho một tính năng lưu lịch sử xem tài liệu. Ứng viên chọn khoá-giá trị vì "nhanh hơn và dễ mở rộng hơn". Khi được hỏi cần truy vấn "ai đã xem tài liệu này trong tuần qua" thì ứng viên không trả lời được, vì cấu trúc khoá đã chọn không hỗ trợ truy vấn đó.</p>`,
askFirst: [
`Truy vấn nào sẽ chạy thường xuyên nhất?`,
`Lựa chọn này làm truy vấn nào trở nên đắt?`,
`Nếu yêu cầu truy vấn thay đổi thì sao?`,
],
predict: {
q: `Bạn chọn khoá là cặp người dùng và tài liệu, giá trị là thời điểm xem gần nhất. Truy vấn "tất cả người dùng đã xem tài liệu X trong tuần qua" có hiệu quả không?`,
a: `<p>Không hiệu quả, và có thể phải quét toàn bộ bảng. Với khoá là người dùng, dữ liệu được phân tán theo người dùng, nên câu hỏi theo tài liệu không có đường tra cứu trực tiếp. Đây là điểm cốt lõi của cơ sở dữ liệu khoá-giá trị: bạn phải thiết kế khoá theo đúng câu hỏi sẽ hỏi, và một bảng chỉ phục vụ tốt một vài mẫu truy vấn. Nếu cần hỏi theo cả hai chiều, bạn phải ghi dữ liệu hai lần với hai khoá khác nhau, chấp nhận chi phí ghi và nguy cơ lệch dữ liệu.</p>`,
},
anchor: `Cơ sở dữ liệu khoá-giá trị buộc bạn chọn khoá theo câu hỏi sẽ hỏi, nên phải biết trước các mẫu truy vấn trước khi chọn nó.`,
attacks: [
{ q: `Vậy làm sao trình bày một quyết định công nghệ cho thuyết phục?`, a: `Nêu bốn phần theo thứ tự. Một là yêu cầu cụ thể: khối lượng, mẫu truy vấn, yêu cầu nhất quán, ngân sách độ trễ. Hai là các lựa chọn đã cân nhắc và tiêu chí loại. Ba là lựa chọn đã chọn kèm lý do gắn với yêu cầu ở phần một. Bốn là điều bạn phải chấp nhận — chi phí, giới hạn, và khi nào bạn sẽ phải đổi. Phần bốn là phần hay bị bỏ qua nhất và cũng là phần chứng minh bạn thật sự đã suy nghĩ chứ không chọn theo xu hướng.` },
{ q: `Nếu người phỏng vấn đổi một giả định — khối lượng tăng một trăm lần — bạn trả lời thế nào?`, a: `Chỉ ra phần nào của thiết kế chịu áp lực trước và cách xử lý theo thứ tự. Với khối lượng ghi tăng mạnh, thứ đầu tiên chịu áp lực thường là chỉ mục và chi phí ghi, nên cần xem lại số chỉ mục và cân nhắc ghi theo lô. Tiếp theo là tầng truy vấn, nơi có thể cần tách dữ liệu nóng khỏi dữ liệu lạnh hoặc thêm bản sao chỉ đọc. Cuối cùng mới là đổi công nghệ, vì đổi công nghệ là bước đắt nhất và thường không cần thiết. Trình bày theo thứ tự chi phí tăng dần cho thấy bạn tối ưu theo giá trị chứ không theo cảm hứng.` },
],
},
J09: {
incident: `<p>Cuối buổi phỏng vấn, người phỏng vấn hỏi ứng viên có câu hỏi gì. Ứng viên nói không có. Người phỏng vấn ghi chú rằng ứng viên có vẻ không quan tâm tới công việc. Ở một buổi khác, ứng viên hỏi về lương và số ngày nghỉ trong câu hỏi đầu tiên, trước khi hỏi bất cứ điều gì về công việc.</p>`,
askFirst: [
`Câu hỏi của ứng viên truyền đạt điều gì?`,
`Câu hỏi nào nên hỏi trước, câu nào để sau?`,
`Làm sao biết một câu trả lời có đáng tin không?`,
],
predict: {
q: `Ứng viên nói "không có câu hỏi nào". Người phỏng vấn có thể suy ra điều gì?`,
a: `<p>Ba cách diễn giải, và ứng viên không kiểm soát được cách nào sẽ được chọn. Có thể là ứng viên không quan tâm đủ để tìm hiểu trước. Có thể là ứng viên không chuẩn bị, điều này nói lên điều gì đó về cách làm việc. Có thể là ứng viên hiểu công việc chưa đủ sâu để biết cần hỏi gì, điều này lại chỉ ra mức độ tìm hiểu. Vì kết quả phụ thuộc vào suy đoán của người khác, việc chuẩn bị hai hoặc ba câu hỏi cụ thể là cách rẻ nhất để kiểm soát ấn tượng đó.</p>`,
},
anchor: `Câu hỏi bạn đặt ở cuối buổi phỏng vấn là bằng chứng cuối cùng về mức độ bạn đã tìm hiểu công việc.`,
attacks: [
{ q: `Ba câu hỏi nào bạn nên chuẩn bị?`, a: `Một câu về công việc thật: hai tuần đầu tiên trông như thế nào, và thành công được đo bằng gì. Một câu về đội và cách làm việc: quy trình review và triển khai ra sao, ai trực khi có sự cố. Một câu về phía hệ thống: phần nào của hệ thống đang gây khó chịu nhất cho đội. Ba câu này đều cho bạn thông tin thật để quyết định, và đều cho thấy bạn đang nghĩ về việc làm được việc chứ không chỉ được nhận.` },
{ q: `Khi nào thì hỏi về lương và phúc lợi?`, a: `Không phải câu đầu tiên, nhưng cũng không nên tránh. Nếu người phỏng vấn mở chủ đề, hãy trao đổi thẳng. Nếu không, hợp lý nhất là hỏi ở buổi cuối hoặc khi có trao đổi với bộ phận nhân sự, sau khi hai bên đã hiểu nhau về công việc. Điều nên tránh là để câu hỏi đầu tiên về lương, vì nó cho thấy động lực duy nhất là tiền — dù điều đó không sai, thứ tự vẫn truyền đạt thông tin. Và nếu bạn đã có một khoảng mong đợi, hãy chuẩn bị một con số cụ thể thay vì để mở.` },
],
},
J10: {
incident: `<p>Một ứng viên được yêu cầu trình bày một nhận xét code review đã đưa ra trong dự án trước. Ứng viên kể rằng đã comment "đoạn này viết khó hiểu, nên viết lại", và đồng nghiệp đã sửa theo. Khi được hỏi nhận xét đó giúp gì cho người nhận, ứng viên không trả lời được thêm.</p>`,
askFirst: [
`Nhận xét này giúp người nhận hiểu điều gì?`,
`Nhận xét nào là về code, nhận xét nào là về con người?`,
`Làm sao để một nhận xét dẫn tới thay đổi thật?`,
],
predict: {
q: `Hai nhận xét: "đoạn này khó hiểu, viết lại đi" và "hàm này làm ba việc nên khó test; tách phần tính giá ra riêng thì test được". Nhận xét nào hiệu quả hơn?`,
a: `<p>Nhận xét thứ hai, vì nó nêu vấn đề cụ thể, giải thích hậu quả, và gợi ý một hướng đi. Nhận xét thứ nhất chỉ nói lên cảm nhận của người viết, nên người nhận không biết phải sửa gì và cũng không học được gì cho lần sau. Một điểm nữa là nhận xét thứ nhất dễ bị đọc thành đánh giá về năng lực, còn nhận xét thứ hai nói về cấu trúc code. Cùng một mong muốn thay đổi, nhưng cách diễn đạt quyết định nó có dẫn tới thay đổi hay dẫn tới phòng thủ.</p>`,
},
anchor: `Một nhận xét review tốt nêu vấn đề cụ thể kèm hậu quả và một hướng sửa, chứ không nêu cảm nhận của người viết.`,
attacks: [
{ q: `Khi nào bạn nên chặn một thay đổi, khi nào chỉ nên góp ý?`, a: `Chặn khi có vấn đề đúng đắn hoặc an toàn: lỗi logic, thiếu kiểm tra đầu vào, rò rỉ dữ liệu, phá vỡ hợp đồng API, hoặc thiếu test cho một nhánh quan trọng. Góp ý không chặn khi đó là sở thích về phong cách, một cách viết khác tương đương, hoặc một cải tiến có thể làm sau. Nói rõ mức độ ngay trong nhận xét — "phải sửa" khác "cân nhắc" — để người nhận biết cái nào đang chặn việc merge. Việc gộp hai loại này lại là nguyên nhân phổ biến khiến review kéo dài vô ích.` },
{ q: `Làm sao review một thay đổi lớn mà không mất quá nhiều thời gian?`, a: `Bắt đầu bằng mô tả thay đổi để hiểu mục tiêu, rồi đọc theo thứ tự từ ngoài vào: hợp đồng, luồng dữ liệu, rồi chi tiết. Với thay đổi lớn, hãy hỏi tác giả chia nhỏ nếu có thể, vì một thay đổi 2.000 dòng sẽ không được review kỹ dù bạn dành bao nhiêu thời gian. Tập trung vào những chỗ khó sửa sau này: ranh giới, xử lý lỗi, tính idempotency, và những chỗ ảnh hưởng tới dữ liệu. Còn định dạng, đặt tên, và phong cách thì nên để công cụ tự động lo, không tiêu thời gian của con người.` },
],
},
J11: {
incident: `<p>Trong một buổi phỏng vấn, người phỏng vấn hỏi về cách xử lý tình huống mất kết nối tới một dịch vụ bên ngoài trong một hệ thống mà ứng viên chưa từng dùng. Ứng viên bắt đầu suy đoán và đưa ra một câu trả lời nghe có vẻ chắc chắn nhưng sai về cơ chế. Người phỏng vấn đào sâu hai lần và ứng viên tiếp tục bảo vệ câu trả lời ban đầu thay vì thừa nhận.</p>`,
askFirst: [
`Điều gì tệ hơn: không biết, hay khẳng định điều mình không biết?`,
`Làm sao thừa nhận mà không đánh mất đà của buổi phỏng vấn?`,
`Bạn có thể suy luận từ nguyên tắc chung như thế nào?`,
],
predict: {
q: `Bạn không biết câu trả lời cho một câu hỏi kỹ thuật. Cách xử lý nào tốt nhất?`,
a: `<p>Nói rõ bạn chưa gặp phần đó, rồi chuyển sang thứ bạn suy luận được từ nguyên tắc đã biết. Ví dụ: bạn chưa dùng dịch vụ cụ thể đó, nhưng bạn biết rằng mọi lời gọi ra ngoài đều có thể thất bại theo ba cách — chậm, lỗi tạm thời, hoặc lỗi vĩnh viễn — nên bạn sẽ đặt timeout, thử lại có giới hạn cho lỗi tạm thời, và một cơ chế ngắt mạch cho lỗi kéo dài. Cách này vừa trung thực vừa thể hiện được năng lực suy luận, và người phỏng vấn thường đánh giá cao hơn một câu trả lời thuộc lòng.</p>`,
},
anchor: `Người phỏng vấn kiểm tra cách bạn xử lý điều chưa biết, nên thừa nhận rồi suy luận từ nguyên tắc mạnh hơn bảo vệ một phỏng đoán.`,
attacks: [
{ q: `Làm sao thừa nhận thiếu kiến thức mà không làm mất đà?`, a: `Nói ngắn, rồi chuyển ngay sang phần bạn làm được. Ví dụ: "Phần cấu hình cụ thể của dịch vụ đó thì tôi chưa làm, nhưng nguyên tắc tôi sẽ áp dụng là..." Câu này thừa nhận trong một câu và không xin lỗi dài dòng. Điều nên tránh là vừa thừa nhận vừa tự hạ thấp bản thân, hoặc thừa nhận rồi im lặng. Và nếu bạn nhớ mang máng nhưng không chắc, hãy nói rõ mức độ chắc chắn thay vì trình bày như một sự thật.` },
{ q: `Có nên nói mình sẽ tra tài liệu không?`, a: `Có, và đó là câu trả lời trung thực cho nhiều tình huống thật. Điều quan trọng là nói kèm cách bạn sẽ kiểm chứng: tra tài liệu chính thức chứ không tra blog, và viết một thử nghiệm nhỏ để xác nhận hành vi trước khi dựa vào nó. Điều này cho thấy bạn phân biệt được giữa việc nhớ và việc biết cách tìm ra, và trong công việc thật thì kỹ năng thứ hai quan trọng hơn. Nhưng đừng dùng nó để trốn tránh mọi câu hỏi — với những nguyên tắc cơ bản của ngành thì nên trả lời được ngay.` },
],
},
J12: {
incident: `<p>Ứng viên được hỏi sẽ làm gì trong hai tuần đầu nếu được nhận, với điểm yếu đã thừa nhận là chưa có kinh nghiệm AWS và Vue. Ứng viên trả lời rằng sẽ học AWS và Vue. Khi được hỏi học cụ thể cái gì, theo thứ tự nào, và làm sao biết mình đã đủ, ứng viên không có câu trả lời.</p>`,
askFirst: [
`Hai tuần đầu nên tập trung vào cái gì?`,
`Làm sao biết mình đã học đủ để làm việc?`,
`Có nên học hết trước rồi mới làm không?`,
],
predict: {
q: `Một ứng viên nói "tôi sẽ học AWS trong hai tuần đầu". Câu trả lời này thiếu gì?`,
a: `<p>Thiếu ba thứ. Thiếu phạm vi: AWS có hàng trăm dịch vụ, nên cần nói rõ học những dịch vụ nào và vì sao — thường là những dịch vụ xuất hiện trong JD. Thiếu thứ tự: cái gì trước, cái gì sau, và dựa trên cái gì đã biết. Thiếu tiêu chí hoàn thành: làm sao biết đã đủ để tự làm một việc thật. Một câu trả lời mạnh có cả ba, và thường kèm một bước kiểm chứng cụ thể — ví dụ triển khai một endpoint nhỏ lên hạ tầng thật trong tuần đầu tiên.</p>`,
},
anchor: `Kế hoạch học có giá trị khi nêu được phạm vi, thứ tự và tiêu chí hoàn thành — nếu không thì đó chỉ là ý định.`,
attacks: [
{ q: `Hai tuần đầu bạn ưu tiên cái gì?`, a: `Ưu tiên hiểu hệ thống đang chạy và tạo ra giá trị nhỏ nhưng thật, song song với việc học. Cụ thể: đọc kiến trúc và luồng của một tính năng từ giao diện tới database; chạy được hệ thống ở máy cá nhân; và nhận một thay đổi nhỏ để đi hết vòng từ sửa code tới triển khai. Việc đi hết một vòng nhỏ dạy nhiều hơn đọc tài liệu, vì nó buộc bạn chạm vào công cụ thật, quy trình thật, và những chỗ chưa được ghi lại. Học công nghệ mới thì gắn với công việc cụ thể thay vì học tràn lan.` },
{ q: `Với điểm yếu là AWS, bạn sẽ học theo thứ tự nào?`, a: `Theo thứ tự mà hệ thống thật cần, không theo thứ tự tài liệu. Bắt đầu từ những thứ xuất hiện trong công việc hằng ngày: cách một hàm được triển khai và cách đọc log của nó, cách cấp quyền cho nó, và cách một bucket hay một hàng đợi được dùng. Sau đó mới tới phần vận hành: đọc metric, đặt cảnh báo, và hiểu chi phí của những gì mình tạo ra. Học theo thứ tự này cho phép bạn đóng góp từ tuần đầu thay vì học sáu tháng rồi mới làm được việc, và nó cũng đúng với cách JD mô tả công việc.` },
],
},
};
