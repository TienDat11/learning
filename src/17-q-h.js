var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'H01',
group: 'H',
topic: 'Image và container',
prio: 'P0',
level: 'L1',
type: 'concept',
q: 'Hãy phân biệt Docker image và container, và giải thích vì sao xóa container không làm mất image?',
oral: 'Image là mẫu chỉ đọc gồm các layer xếp chồng, chứa hệ điều hành gọn nhẹ, thư viện và mã nguồn của bạn. Container là một tiến trình đang chạy được tạo ra từ image, cộng thêm một lớp đọc ghi mỏng bên trên. Khi bạn xóa container, bạn chỉ xóa lớp đọc ghi đó và tiến trình đi kèm, còn image gốc vẫn nằm trong bộ nhớ cục bộ. Nhờ vậy bạn có thể tạo lại container mới từ cùng một image bất cứ lúc nào, và nhiều container có thể cùng chạy từ một image mà không ảnh hưởng lẫn nhau.',
deep: '<p><strong>Image là gì:</strong> image là một gói <code>read-only</code> gồm nhiều <code>layer</code> xếp chồng theo cơ chế union filesystem. Mỗi layer là kết quả của một chỉ thị trong Dockerfile. Image có digest định danh duy nhất và không thay đổi sau khi build.</p><p><strong>Cơ chế hoạt động:</strong> khi chạy <code>docker run</code>, Docker tạo một <code>container</code> gồm image chỉ đọc cộng thêm một lớp đọc ghi mỏng trên cùng, cộng thêm namespace và cgroup riêng để cách ly tiến trình, mạng và tài nguyên. Mọi ghi file trong container đều đi vào lớp mỏng này.</p><p><strong>Vì sao cần tách hai khái niệm:</strong> tách image bất biến khỏi trạng thái chạy giúp triển khai nhất quán giữa máy dev, CI và production, đồng thời cho phép mở rộng ngang bằng cách tạo nhiều container từ cùng một image.</p><p><strong>Khi nào dùng và khi nào không:</strong> dùng image để đóng gói và phân phối phần mềm; dùng container để chạy và kiểm thử. Bạn không nên lưu dữ liệu quan trọng bên trong lớp đọc ghi của container vì nó mất khi xóa container, hãy dùng <code>volume</code> hoặc <code>bind mount</code>.</p><ul><li><strong>Tình huống cụ thể:</strong> build image <code>webapp:1.2</code> một lần, chạy ba container từ nó cho ba môi trường khác nhau bằng biến môi trường riêng.</li><li><strong>Lỗi phổ biến:</strong> nghĩ xóa container là xóa image; nghĩ sửa file trong container sẽ đổi image gốc.</li></ul>',
code: 'docker images\ndocker build -t webapp:1.2 .\ndocker run -d --name web-a -p 8080:8000 webapp:1.2\ndocker ps -a\ndocker rm web-a\ndocker images',
expected: null,
followups: [
{q: 'Layer trong image hoạt động thế nào khi hai image dùng chung base?', a: 'Các layer được định danh bằng digest và được dùng chung giữa các image. Khi hai image cùng dùng một base, Docker chỉ lưu base một lần và mỗi image chỉ thêm các layer riêng phía trên, giúp tiết kiệm đĩa và tăng tốc kéo image.'},
{q: 'Dữ liệu ghi trong container đi đâu khi xóa container?', a: 'Dữ liệu ghi vào lớp đọc ghi mỏng của container sẽ mất khi xóa container. Muốn giữ lại lâu dài, bạn phải gắn volume hoặc bind mount ra ngoài, hoặc đẩy dữ liệu lên cơ sở dữ liệu và object storage.'},
{q: 'Khi nào bạn dùng tag image và digest?', a: 'Tag giúp con người đọc phiên bản như 1.2 hay latest, còn digest là mã băm bất biến của nội dung image. Khi triển khai production, bạn nên chốt digest để bảo đảm đúng image đã kiểm thử, tránh việc tag bị ghi đè.'}
],
pitfalls: ['Nhầm lẫn xóa container với xóa image, rồi ngạc nhiên vì đĩa vẫn đầy do image còn lại', 'Lưu dữ liệu quan trọng trong container rồi mất khi recreate'],
selfcheck: ['Tôi vẫn chưa giải thích được union filesystem gộp các layer chỉ đọc thành một gốc rễ duy nhất thế nào', 'Tôi có thể giải thích bằng ví dụ một image dùng chung cho hai container chạy song song với biến môi trường khác nhau', 'Tôi có thể liệt kê image đang chiếm đĩa và dọn container đã dừng trên máy dev mà không xóa nhầm image production'],
refs: ['dockerfile-ref']
},
{
id: 'H02',
group: 'H',
topic: 'Dockerfile layer và build cache',
prio: 'P0',
level: 'L2',
type: 'predict',
q: 'Với Dockerfile dưới đây, khi bạn chỉ sửa mã nguồn mà không đổi requirements, Docker sẽ build lại từ layer nào và vì sao?',
oral: 'Docker build từng chỉ thị thành từng layer và lưu cache theo thứ tự. Layer nào không đổi thì dùng lại cache, layer đầu tiên có thay đổi và mọi layer sau nó phải build lại. Vì vậy thứ tự sao chép file quyết định tốc độ build. Bạn nên sao chép file phụ thuộc và cài đặt trước, sao chép mã nguồn hay đổi sau. Sửa mã nguồn mà không chạm tới requirements thì Docker dùng lại cache tới bước cài đặt, chỉ build lại từ bước sao chép mã nguồn trở đi.',
deep: '<p><strong>Đó là gì:</strong> mỗi chỉ thị <code>RUN</code>, <code>COPY</code>, <code>ADD</code> tạo một <code>layer</code> mới. Docker lưu kết quả từng layer làm <code>build cache</code> và dùng lại khi đầu vào của layer đó không đổi.</p><p><strong>Cơ chế hoạt động:</strong> Docker kiểm tra cache từ trên xuống dưới. Chỉ cần một layer đổi đầu vào như file sao chép khác checksum hoặc lệnh khác chữ, layer đó và toàn bộ layer phía sau bị vô hiệu cache và phải chạy lại, dù nội dung phía sau không đổi.</p><p><strong>Vì sao cần:</strong> sắp xếp Dockerfile đúng giúp build lại chỉ mất vài giây thay vì vài phút, rất quan trọng trong vòng lặp dev và pipeline CI nơi mỗi phút build đều tốn chi phí.</p><p><strong>Khi nào dùng và khi nào không:</strong> luôn đặt bước ít đổi như cài hệ điều hành và thư viện lên trước, bước hay đổi như sao chép mã nguồn xuống sau. Bạn không nên sao chép toàn bộ thư mục quá sớm vì một file log đổi cũng phá cache của bước cài đặt nặng.</p><ul><li><strong>Tình huống cụ thể:</strong> tách sao chép requirements và cài đặt trước, sao chép code sau, nên sửa code chỉ build lại hai layer cuối.</li><li><strong>Lỗi phổ biến:</strong> đặt COPY toàn bộ trước RUN cài đặt nên sửa một dòng code cũng cài lại mọi thư viện; quên <code>.dockerignore</code> khiến cache hỏng liên tục.</li></ul>',
code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD ["python", "app.py"]',
expected: 'Docker dùng lại cache từ FROM tới hết RUN cài đặt, và build lại từ COPY . . trở đi. Nguyên nhân là requirements.txt không đổi nên checksum đầu vào của các layer trên giữ nguyên, còn layer COPY . . thấy mã nguồn đổi nên hỏng cache, kéo theo CMD phía sau phải tạo lại.',
followups: [
{q: 'Vì sao thêm .dockerignore lại tăng tỉ lệ trúng cache?', a: 'Vì ngữ cảnh build gửi sang daemon gồm mọi file không bị loại trừ. Nếu không loại trừ thư mục log hay cache, checksum ngữ cảnh đổi liên tục và layer COPY bị coi là đổi dù mã nguồn không đổi. Loại trừ đúng giúp cache ổn định.'},
{q: 'Khi nào bạn dùng --no-cache hoặc build nhiều tầng để xử lý cache?', a: 'Bạn dùng --no-cache khi nghi cache cũ che lỗi như gói bị xóa khỏi kho. Bạn dùng nhiều tầng hoặc cache mount để giữ cache trình quản lý gói giữa các lần build mà không phình image cuối.'},
{q: 'Thứ tự nào tối ưu cho dự án Python và Node?', a: 'Bạn sao chép file khai báo phụ thuộc trước, cài đặt, rồi mới sao chép mã nguồn. Với Node bạn sao chép package lock trước rồi chạy cài đặt, với Python bạn sao chép requirements trước rồi cài, để sửa code không cài lại thư viện.'}
],
pitfalls: ['Sao chép toàn bộ mã nguồn ngay dòng đầu nên build lại luôn chậm', 'Nghĩ cache dựa trên thời gian file, trong khi Docker dựa trên nội dung và lệnh'],
selfcheck: ['Tôi vẫn chưa giải thích được Docker tính checksum cho lệnh COPY nhiều file và phân biệt cache miss do file nào', 'Tôi có thể giải thích bằng ví dụ sửa app.py mà không cài lại requirements nhờ tách layer', 'Tôi có thể sắp xếp lại một Dockerfile thực tế để build lại sau khi sửa code chỉ còn vài giây'],
refs: ['dockerfile-ref', 'docker-multi-stage']
},
{
id: 'H03',
group: 'H',
topic: 'Multi-stage build',
prio: 'P0',
level: 'L2',
type: 'concept',
q: 'Multi-stage build trong Dockerfile là gì và vì sao nó giúp image production nhỏ và an toàn hơn?',
oral: 'Multi-stage build cho phép bạn viết nhiều khối FROM trong một Dockerfile, khối đầu dùng image lớn để biên dịch và cài đặt, khối cuối chỉ sao chép sản phẩm cần chạy. Image cuối không chứa trình biên dịch, mã nguồn hay cache, nên nhỏ hơn nhiều, khởi động nhanh hơn và ít lỗ hổng hơn. Bạn vẫn chỉ cần một file Dockerfile duy nhất, không phải chia nhiều file hay sao chép thủ công giữa các bước.',
deep: '<p><strong>Đó là gì:</strong> <code>multi-stage</code> là kỹ thuật khai báo nhiều giai đoạn <code>FROM</code> trong cùng một Dockerfile, mỗi giai đoạn có tên riêng và chỉ giai đoạn cuối trở thành image xuất ra.</p><p><strong>Cơ chế hoạt động:</strong> giai đoạn builder dùng image đầy đủ công cụ để biên dịch, cài phụ thuộc và chạy kiểm thử. Lệnh <code>COPY --from=builder</code> chỉ lấy file thành phẩm như binary hay thư mục đã cài sang image runtime gọn nhẹ. Các layer trung gian không nằm trong image cuối.</p><p><strong>Vì sao cần:</strong> image nhỏ giúp kéo nhanh khi mở rộng, tốn ít đĩa và ít bề mặt tấn công vì không còn trình biên dịch, git hay khóa bí mật dùng lúc build.</p><p><strong>Khi nào dùng và khi nào không:</strong> dùng cho mọi image production cần biên dịch hoặc cài nhiều. Bạn không cần nhiều tầng cho script thuần túy không cần biên dịch, nhưng vẫn có thể dùng để tách bước kiểm thử khỏi runtime.</p><ul><li><strong>Tình huống cụ thể:</strong> builder dùng image đầy đủ để build frontend, runtime chỉ dùng image máy chủ tĩnh gọn nhẹ và sao chép thư mục build sang.</li><li><strong>Lỗi phổ biến:</strong> sao chép cả thư mục mã nguồn sang runtime; để khóa bí mật trong ARG và bị lộ ở layer trung gian.</li></ul>',
code: 'FROM python:3.12 AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --prefix=/pkg --no-cache-dir -r requirements.txt\nFROM python:3.12-slim\nWORKDIR /app\nCOPY --from=builder /pkg /usr/local\nCOPY app.py .\nCMD ["python", "app.py"]',
expected: null,
followups: [
{q: 'Multi-stage khác gì việc viết hai Dockerfile riêng?', a: 'Multi-stage giữ toàn bộ quy trình trong một file và một lần build, Docker tự quản lý layer trung gian. Hai file riêng buộc bạn tự build, gắn tag trung gian và sao chép thủ công, dễ lệch phiên bản và khó dùng cache trên CI.'},
{q: 'Làm sao tránh lộ secret trong giai đoạn build?', a: 'Bạn không nên truyền secret qua ARG vì nó nằm trong lịch sử image. Bạn nên dùng secret mount lúc build hoặc biến môi trường của CI, và bảo đảm giai đoạn cuối không sao chép file chứa secret.'},
{q: 'Khi nào image nhỏ lại quan trọng nhất?', a: 'Khi bạn mở rộng nhanh nhiều bản sao, triển khai lên môi trường băng thông hẹp, hoặc chạy serverless và edge tính tiền theo dung lượng. Image nhỏ giúp khởi động nhanh và giảm thời gian phục hồi sự cố.'}
],
pitfalls: ['Sao chép thừa mã nguồn và công cụ build sang image cuối nên image vẫn phình', 'Nhúng secret vào layer builder rồi nghĩ image cuối an toàn, trong khi lịch sử vẫn giữ'],
selfcheck: ['Tôi vẫn chưa giải thích được Docker có giữ lại layer trung gian trên đĩa build và dọn chúng thế nào', 'Tôi có thể giải thích bằng ví dụ builder cài phụ thuộc rồi chỉ sao chép gói sang image slim', 'Tôi có thể viết lại một Dockerfile một tầng thành hai tầng để giảm dung lượng image thực tế'],
refs: ['docker-multi-stage', 'dockerfile-ref']
},
{
id: 'H04',
group: 'H',
topic: 'Port, biến môi trường, volume, mạng và Compose',
prio: 'P1',
level: 'L2',
type: 'concept',
q: 'Hãy giải thích port mapping, biến môi trường, volume và network trong Docker Compose qua một ví dụ web và database.',
oral: 'Port mapping nối cổng máy host với cổng trong container để bạn truy cập từ ngoài. Biến môi trường truyền cấu hình như tên database mà không cần sửa code. Volume lưu dữ liệu ra ngoài vòng đời container nên database không mất khi recreate. Network nội bộ cho các service gọi nhau bằng tên service thay vì địa chỉ IP. Compose gom bốn thứ này vào một file duy nhất để chỉ cần một lệnh là dựng cả cụm.',
deep: '<p><strong>Đó là gì:</strong> <code>ports</code> ánh xạ cổng host tới cổng container, <code>environment</code> đưa cấu hình vào tiến trình, <code>volumes</code> gắn lưu trữ bền bỉ, <code>networks</code> tạo mạng ảo cho các container giao tiếp.</p><p><strong>Cơ chế hoạt động:</strong> Compose tạo một mạng mặc định cho project, mỗi service được phân giải DNS theo tên service. Yêu cầu tới cổng host được chuyển tiếp vào đúng container. Dữ liệu ghi vào volume nằm ngoài container nên tồn tại sau khi container bị xóa và tạo lại.</p><p><strong>Vì sao cần:</strong> bốn cơ chế này tách cấu hình, dữ liệu và mạng khỏi image bất biến, giúp cùng một image chạy được ở dev, kiểm thử và production chỉ bằng cách đổi file Compose hoặc biến môi trường.</p><p><strong>Khi nào dùng và khi nào không:</strong> dùng port mapping cho service cần gọi từ ngoài, dùng volume cho mọi dữ liệu cần giữ, dùng mạng riêng để chia tách frontend và backend. Bạn không nên mở cổng database ra host ở production hay lưu dữ liệu vào container.</p><ul><li><strong>Tình huống cụ thể:</strong> service web gọi database qua tên host cơ sở dữ liệu, mật khẩu lấy từ biến môi trường, dữ liệu nằm trên volume có tên.</li><li><strong>Lỗi phổ biến:</strong> nhầm thứ tự cổng host và cổng container; dùng bind mount mã nguồn ở production; quên đặt volume nên mất dữ liệu khi recreate.</li></ul>',
code: 'services:\n  web:\n    build: .\n    ports:\n      - "8080:8000"\n    environment:\n      - DB_HOST=db\n      - DB_NAME=appdb\n    depends_on:\n      - db\n  db:\n    image: postgres:16\n    environment:\n      - POSTGRES_DB=appdb\n      - POSTGRES_PASSWORD=secret123\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:',
expected: null,
followups: [
{q: 'depends_on có bảo đảm database sẵn sàng nhận kết nối không?', a: 'Không. depends_on chỉ bảo đảm thứ tự khởi động container, không chờ database sẵn sàng. Bạn cần thêm cơ chế chờ như vòng lặp kiểm tra cổng, healthcheck và logic thử lại trong ứng dụng.'},
{q: 'Khi nào dùng named volume thay vì bind mount?', a: 'Bạn dùng named volume cho dữ liệu production vì Docker quản lý, dễ sao lưu và di chuyển. Bạn dùng bind mount khi dev cần phản chiếu mã nguồn trực tiếp để sửa và chạy ngay.'}
],
pitfalls: ['Mở cổng database ra ngoài ở production rồi bị quét và tấn công', 'Lưu dữ liệu database trong container nên mất hết khi cập nhật image'],
selfcheck: ['Tôi vẫn chưa giải thích được Compose đặt tên mạng và volume theo project thế nào khi chạy nhiều project song song', 'Tôi có thể giải thích bằng ví dụ web gọi database qua tên service db trên mạng Compose mặc định', 'Tôi có thể dựng một cụm web và database bằng Compose với volume bền bỉ cho dữ liệu'],
refs: ['docker-compose']
},
{
id: 'H05',
group: 'H',
topic: 'Chạy non-root, secret và healthcheck',
prio: 'P1',
level: 'L2',
type: 'concept',
q: 'Vì sao bạn nên chạy container dưới user non-root, quản lý secret riêng và thêm healthcheck?',
oral: 'Mặc định tiến trình trong container thường chạy dưới quyền root, nên nếu kẻ tấn công thoát được ra ngoài thì hậu quả rất nặng. Tạo user riêng và chuyển sang USER non-root giúp giảm đặc quyền. Secret như mật khẩu không nên ghi cứng vào image hay biến môi trường dễ lộ, mà nên truyền lúc chạy qua file hoặc dịch vụ quản lý bí mật. Healthcheck giúp Docker và dàn dựng biết container còn sống thật hay chỉ còn tiến trình treo, từ đó tự khởi động lại đúng lúc.',
deep: '<p><strong>Đó là gì:</strong> <code>USER</code> hạ đặc quyền của tiến trình, quản lý <code>secret</code> tách dữ liệu nhạy cảm khỏi image, <code>HEALTHCHECK</code> là lệnh kiểm tra định kỳ xem ứng dụng còn phục vụ được không.</p><p><strong>Cơ chế hoạt động:</strong> chỉ thị <code>USER appuser</code> khiến mọi lệnh sau đó và tiến trình chính không còn quyền root. Secret được gắn lúc chạy dưới dạng file chỉ đọc hoặc biến từ kho bí mật. Healthcheck chạy lệnh như kiểm tra cổng dịch vụ, nếu thất bại quá số lần cho phép thì container bị đánh dấu không khỏe.</p><p><strong>Vì sao cần:</strong> ba biện pháp này giảm blast radius khi bị xâm nhập, tránh lộ mật khẩu trong lịch sử image và nhật ký, đồng thời giúp hệ thống tự phục hồi thay vì giữ container treo.</p><p><strong>Khi nào dùng và khi nào không:</strong> luôn dùng non-root và healthcheck cho production. Bạn không nên sao chép secret vào image, không ghi mật khẩu vào log, và không dùng healthcheck quá nặng gây quá tải ứng dụng.</p><ul><li><strong>Tình huống cụ thể:</strong> image Python tạo user ứng dụng, đổi quyền thư mục làm việc, chạy healthcheck kiểm tra cổng web.</li><li><strong>Lỗi phổ biến:</strong> tạo user nhưng quên đổi quyền file nên ứng dụng không ghi được log; kiểm tra healthcheck chỉ kiểm tra tiến trình còn sống chứ không kiểm tra kết nối database.</li></ul>',
code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nRUN useradd -m appuser && chown -R appuser:appuser /app\nUSER appuser\nEXPOSE 8000\nHEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD python -c "import socket; socket.create_connection((\\"127.0.0.1\\", 8000), timeout=2)"\nCMD ["python", "app.py"]',
expected: null,
followups: [
{q: 'Secret trong biến môi trường có an toàn không?', a: 'Không hoàn toàn. Biến môi trường dễ lộ qua trang quản trị, file dump tiến trình và nhật ký. Với dữ liệu thật sự nhạy cảm, bạn nên dùng file secret gắn lúc chạy hoặc dịch vụ quản lý bí mật có xoay vòng và phân quyền.'},
{q: 'Healthcheck trong Dockerfile khác gì kiểm tra của dàn dựng?', a: 'Healthcheck của Docker chỉ phản ánh trạng thái container trên một máy. Dàn dựng cần thêm kiểm tra mức service để điều phối lưu lượng, khởi động lại và lăn phiên bản. Bạn nên giữ hai lớp này nhất quán nhưng không thay thế nhau.'}
],
pitfalls: ['Chạy root ở production nên một lỗ hổng nhỏ thành chiếm quyền toàn bộ', 'Ghi cứng mật khẩu vào image rồi đẩy lên kho chung'],
selfcheck: ['Tôi vẫn chưa giải thích được sự khác nhau giữa quyền user trong container và quyền trên host khi dùng volume', 'Tôi có thể giải thích bằng ví dụ Dockerfile tạo user riêng và healthcheck cổng dịch vụ', 'Tôi có thể cấu hình lại một image đang chạy root thành non-root mà ứng dụng vẫn ghi được file cần thiết'],
refs: ['docker-security', 'dockerfile-ref']
},
{
id: 'H06',
group: 'H',
topic: 'Tín hiệu và graceful shutdown với PID 1',
prio: 'P0',
level: 'L3',
type: 'debug',
q: 'Container dưới đây dừng rất chậm và mất 10 giây mỗi lần deploy, dù ứng dụng đã bắt SIGTERM. Lỗi nằm ở đâu và sửa thế nào?',
oral: 'Vấn đề nằm ở tiến trình PID 1. Container này khởi động bằng shell bọc ngoài, shell là PID 1 và không chuyển tiếp SIGTERM cho ứng dụng Python bên trong, nên ứng dụng không bao giờ nhận được tín hiệu dừng. Sau thời gian chờ, Docker phải gửi SIGKILL để cưỡng bức dừng. Cách sửa là chạy ứng dụng trực tiếp dưới dạng exec form để nó thành PID 1, hoặc thêm tiến trình init nhỏ làm PID 1 để chuyển tiếp tín hiệu và gặt tiến trình con.',
deep: '<p><strong>Đó là gì:</strong> <code>PID 1</code> là tiến trình đầu tiên trong container và là nơi Docker gửi <code>SIGTERM</code> khi dừng. <code>Graceful shutdown</code> là quá trình ứng dụng nhận tín hiệu, ngừng nhận việc mới, hoàn thành việc đang làm rồi mới thoát.</p><p><strong>Cơ chế hoạt động:</strong> ở dạng shell form, Docker chạy <code>/bin/sh -c</code> làm PID 1 và ứng dụng chỉ là tiến trình con. Shell mặc định không chuyển tiếp SIGTERM, nên handler trong Python không bao giờ chạy. Ở dạng exec form, ứng dụng chính là PID 1 nên nhận trực tiếp tín hiệu. Một init nhẹ cũng có thể làm PID 1, chuyển tiếp tín hiệu và thu dọn tiến trình zombie.</p><p><strong>Vì sao cần:</strong> dừng êm tránh mất request đang xử lý, tránh kẹt deploy và tránh hỏng dữ liệu đang ghi dở. Với hàng đợi và worker, dừng êm còn tránh trùng lặp và mất tác vụ.</p><p><strong>Khi nào dùng và khi nào không:</strong> luôn dùng exec form cho CMD và ENTRYPOINT, thêm init khi ứng dụng sinh tiến trình con. Bạn không nên dùng shell form bọc ngoài ở production chỉ để tiện nối lệnh.</p><ul><li><strong>Tình huống cụ thể:</strong> thay CMD shell form bằng exec form, hoặc chạy với init để PID 1 chuyển tiếp SIGTERM.</li><li><strong>Lỗi phổ biến:</strong> nghĩ bắt SIGTERM trong code là đủ mà quên kiểm tra ai là PID 1; đặt thời gian dừng quá ngắn nên worker chưa kịp xong việc.</li></ul><p><strong>Nếu điều kiện thay đổi:</strong> nếu ứng dụng cần thời gian dọn dẹp lâu hơn như xả buffer hay đóng kết nối, bạn phải tăng thời gian chờ dừng song song với việc sửa PID 1. Ngược lại, với tác vụ nền幂等 có thể chạy lại, bạn có thể chấp nhận dừng nhanh hơn và để hàng đợi giao lại việc.</p>',
code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD python app.py',
expected: 'Container dừng chậm vì CMD ở dạng shell nên PID 1 là shell, không phải Python. Shell không chuyển tiếp SIGTERM nên handler trong app.py không chạy, Docker chờ hết timeout rồi gửi SIGKILL sau khoảng 10 giây. Sửa bằng CMD dạng exec ["python", "app.py"] để Python thành PID 1, hoặc thêm init làm PID 1 để chuyển tiếp tín hiệu.',
followups: [
{q: 'Exec form khác shell form ở điểm nào?', a: 'Exec form chạy trực tiếp binary thành PID 1 và nhận tín hiệu trực tiếp. Shell form chèn thêm lớp shell ở giữa, tín hiệu dừng ở shell và không tới ứng dụng. Vì vậy production nên dùng exec form cho cả ENTRYPOINT và CMD.'},
{q: 'Khi nào bạn cần thêm init như tini?', a: 'Khi ứng dụng sinh nhiều tiến trình con hoặc bạn chưa kiểm soát được PID 1. Init nhẹ sẽ chuyển tiếp tín hiệu, gặt tiến trình con đã kết thúc và tránh zombie, giúp shutdown sạch hơn.'},
{q: 'Nếu sửa PID 1 rồi mà deploy vẫn mất request thì kiểm tra gì tiếp?', a: 'Bạn kiểm tra handler SIGTERM có đóng cổng nhận việc mới, chờ request hiện tại xong và đặt timeout dừng đủ dài không. Bạn cũng kiểm tra dàn dựng có rút endpoint khỏi cân bằng tải trước khi gửi SIGTERM hay không.'}
],
pitfalls: ['Chỉ thêm handler SIGTERM mà không kiểm tra PID 1 nên tín hiệu không bao giờ tới', 'Đặt timeout dừng quá ngắn khiến worker bị giết giữa chừng và mất dữ liệu'],
selfcheck: ['Tôi vẫn chưa giải thích được init thu dọn tiến trình zombie bằng cơ chế chờ tiến trình con thế nào', 'Tôi có thể giải thích bằng ví dụ CMD shell form bị SIGTERM kẹt và CMD exec form dừng êm', 'Tôi có thể kiểm tra PID 1 trong một container thật và sửa Dockerfile để deploy không còn chờ đủ timeout'],
refs: ['signal-man', 'dockerfile-ref']
},
{
id: 'H07',
group: 'H',
topic: 'Pipeline CI/CD và quản lý artifact',
prio: 'P1',
level: 'L2',
type: 'concept',
q: 'Hãy thiết kế một pipeline lint, test, build rồi deploy cho ứng dụng Docker, kèm cách đánh phiên bản artifact.',
oral: 'Pipeline nên chia bốn chặng rõ ràng. Lint và định dạng chạy đầu để chặn lỗi rẻ nhất. Test đơn vị và tích hợp chạy tiếp trên môi trường sạch. Build image chỉ chạy khi test đã qua, gắn tag theo commit và số build để truy vết. Deploy lấy đúng image đã kiểm thử theo tag bất biến, triển khai từng phần và có kiểm tra sức khỏe sau deploy. Mỗi image và bản ghi pipeline đều lưu lại để khi lỗi bạn biết đúng bản nào đang chạy và quay lại được.',
deep: '<p><strong>Đó là gì:</strong> <code>pipeline</code> là chuỗi tự động gồm <code>lint</code>, <code>test</code>, <code>build</code> và <code>deploy</code>. <code>Artifact</code> là sản phẩm bất biến của pipeline, ở đây là Docker image kèm tag phiên bản.</p><p><strong>Cơ chế hoạt động:</strong> mỗi commit kích hoạt pipeline trên runner sạch. Lint chặn lỗi phong cách, test xác minh hành vi, build đóng gói image và đẩy lên kho, deploy kéo đúng tag đã qua kiểm thử ra môi trường mục tiêu. Tag gồm số phiên bản, mã commit ngắn và số build giúp truy vết từ production ngược về mã nguồn.</p><p><strong>Vì sao cần:</strong> pipeline chuẩn giúp mọi bản deploy đều đã qua cùng một cửa kiểm tra, tránh deploy bằng tay thiếu test và tránh nhầm lẫn image giữa các môi trường.</p><p><strong>Khi nào dùng và khi nào không:</strong> luôn chạy lint và test trước build, chỉ deploy artifact đã build một lần. Bạn không nên build lại image riêng cho từng môi trường hay deploy tag di động như latest cho production.</p><ul><li><strong>Tình huống cụ thể:</strong> pipeline dùng tag dạng 1.4.0 cộng mã commit, deploy staging tự động và deploy production cần phê duyệt tay.</li><li><strong>Lỗi phổ biến:</strong> deploy latest nên không biết bản nào đang chạy; build lại image ở bước deploy nên bản chạy khác bản đã test.</li></ul>',
code: 'name: service-pipeline\non:\n  push:\n    branches: [main]\njobs:\n  lint-test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: pip install -r requirements.txt\n      - run: ruff check .\n      - run: pytest -q\n  build-push:\n    needs: lint-test\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: docker build -t registry/app:1.4.0 .\n      - run: docker push registry/app:1.4.0',
expected: null,
followups: [
{q: 'Vì sao phải build một lần và deploy cùng image đó?', a: 'Vì build lại có thể kéo gói mới hoặc khác cache nên bản chạy khác bản đã test. Build một lần rồi quảng bá cùng tag bất biến giúp staging và production chạy đúng thứ đã kiểm thử.'},
{q: 'Bạn đặt secret và phê duyệt production thế nào?', a: 'Bạn lưu secret trong kho bí mật của CI theo môi trường, không ghi vào file pipeline. Bạn thêm bước phê duyệt tay, giới hạn ai được duyệt deploy production và ghi lại ai đã duyệt bản nào.'}
],
pitfalls: ['Deploy tag latest nên khi lỗi không biết quay về bản nào', 'Bỏ qua test ở nhánh nóng rồi deploy thẳng production'],
selfcheck: ['Tôi vẫn chưa giải thích được cách lưu provenance để chứng minh image production được build từ commit nào', 'Tôi có thể giải thích bằng ví dụ pipeline lint rồi test rồi mới build và đẩy tag theo commit', 'Tôi có thể dựng một pipeline tối thiểu chặn merge khi lint hoặc test đỏ'],
refs: ['gh-actions', 'docker-multi-stage']
},
{
id: 'H08',
group: 'H',
topic: 'Migration và rollback database',
prio: 'P1',
level: 'L3',
type: 'situation',
q: 'Bạn vừa deploy bản mới kèm migration xóa một cột, giờ cần rollback code gấp. Vì sao rollback code không đồng nghĩa rollback database, và bạn xử lý thế nào?',
oral: 'Rollback code chỉ đổi image ứng dụng về bản cũ, còn migration đã chạy trên database thì vẫn ở đó. Cột đã xóa không tự quay lại, và dữ liệu có thể đã mất nếu không sao lưu. Vì vậy bạn phải coi migration là thay đổi một chiều và luôn có kế hoạch riêng. Cách an toàn là viết migration tương thích ngược, tách bước mở rộng và thu hẹp, sao lưu trước khi chạy, và chuẩn bị sẵn migration đảo ngược đã kiểm thử thay vì mong database tự quay lại.',
deep: '<p><strong>Đó là gì:</strong> <code>migration</code> là thay đổi có trạng thái trên database, còn rollback code chỉ thay image ứng dụng. Hai lớp này tiến hóa độc lập nên không thể dùng một nút quay lại cho cả hai.</p><p><strong>Cơ chế hoạt động:</strong> khi migration xóa cột, lược đồ mới không còn chỗ chứa dữ liệu cũ. Bản code cũ vẫn truy vấn cột đó nên sẽ lỗi ngay sau rollback. Dữ liệu đã xóa chỉ phục hồi được từ sao lưu hoặc từ bước chuyển đổi đã chuẩn bị trước.</p><p><strong>Vì sao cần tách:</strong> database là trạng thái dùng chung của nhiều bản code, không thể thay thế nguyên tử như container. Mọi migration production đều phải tương thích với cả bản mới và bản cũ trong cửa sổ deploy.</p><p><strong>Khi nào dùng và khi nào không:</strong> luôn viết migration mở rộng trước như thêm cột cho phép rỗng, deploy code, rồi mới dọn dẹp sau. Bạn không nên deploy migration phá vỡ như xóa cột hay đổi kiểu cùng lúc với code dùng nó.</p><ul><li><strong>Tình huống cụ thể:</strong> thay vì xóa cột ngay, bạn ngừng ghi ở bản một, chuyển dữ liệu ở bản hai, rồi mới xóa ở bản ba khi không còn code nào đọc cột cũ.</li><li><strong>Lỗi phổ biến:</strong> nghĩ lăn image cũ là xong; chạy migration không sao lưu; không thử rollback trên staging.</li></ul><p><strong>Nếu điều kiện thay đổi:</strong> nếu bảng nhỏ và cho phép downtime, bạn có thể chọn migration dừng dịch vụ kèm sao lưu đầy đủ. Nếu bảng lớn và yêu cầu chạy liên tục, bạn phải dùng chiến lược nhiều bước, chạy nền theo mẻ và kiểm tra tương thích ngược kỹ hơn.</p>',
code: null,
expected: null,
followups: [
{q: 'Thế nào là migration tương thích ngược?', a: 'Là migration mà cả code cũ và code mới đều chạy được trong lúc chuyển đổi. Bạn chỉ thêm mới dạng cho phép rỗng, không xóa hay đổi nghĩa trường cũ, và dời bước dọn dẹp sang một deploy sau khi mọi bản cũ đã rút.'},
{q: 'Trước một migration nguy hiểm bạn chuẩn bị gì?', a: 'Bạn sao lưu có thể phục hồi đã kiểm thử, chạy thử trên bản sao production, ước lượng thời gian khóa bảng, chuẩn bị migration đảo ngược và kịch bản dừng deploy. Bạn cũng thông báo cửa sổ rủi ro cho bên liên quan.'}
],
pitfalls: ['Xóa cột và deploy code cùng lúc nên rollback code xong hệ thống vẫn lỗi vì thiếu cột', 'Chạy migration production lần đầu mà chưa thử phục hồi sao lưu'],
selfcheck: ['Tôi vẫn chưa giải thích được cách viết backfill theo mẻ cho bảng lớn mà không khóa bảng quá lâu', 'Tôi có thể giải thích bằng ví dụ tách thêm cột và xóa cột thành hai deploy riêng biệt', 'Tôi có thể lập checklist sao lưu và kiểm thử rollback cho một migration xóa trường thực tế'],
refs: ['gh-actions']
},
{
id: 'H09',
group: 'H',
topic: 'Linux tiến trình, cổng, log, biến môi trường và quyền',
prio: 'P2',
level: 'L1',
type: 'code',
q: 'Web trong container không trả lời, bạn chỉ có shell Linux trên host. Bạn dùng lệnh nào để tìm tiến trình, cổng, log, biến môi trường và quyền file?',
oral: 'Bạn đi theo thứ tự từ tiến trình tới mạng rồi tới log. Đầu tiên liệt kê tiến trình và mức CPU RAM để biết app còn sống không. Sau đó kiểm tra cổng đang nghe và thử gọi trực tiếp để tách lỗi mạng hay lỗi app. Rồi đọc log hệ thống và log container, kiểm tra biến môi trường và quyền file cấu hình. Mỗi lệnh cho bạn một mảnh ghép, ghép lại là ra nguyên nhân mà không cần đoán mò.',
deep: '<p><strong>Đó là gì:</strong> bộ lệnh <code>ps</code>, <code>ss</code>, <code>journalctl</code>, <code>docker logs</code>, <code>env</code> và <code>ls -l</code> giúp bạn quan sát tiến trình, cổng, nhật ký, cấu hình và quyền trên Linux.</p><p><strong>Cơ chế hoạt động:</strong> tiến trình treo thường lộ qua CPU, RAM hoặc trạng thái zombie. Cổng không nghe nghĩa là app chưa khởi động hoặc bind sai địa chỉ. Log cho biết lỗi khởi động và stack trace. Biến môi trường thiếu khiến app nối sai database. Quyền file sai khiến app không đọc được cấu hình hay chứng chỉ.</p><p><strong>Vì sao cần:</strong> đây là kỹ năng chẩn đoán nền tảng khi container và dàn dựng che mất chi tiết. Bạn càng thành thạo thì thời gian tìm nguyên nhân càng ngắn.</p><p><strong>Khi nào dùng và khi nào không:</strong> dùng lệnh chỉ đọc trước để quan sát, chỉ khởi động lại sau khi đã thu thập bằng chứng. Bạn không nên xóa log hay đổi quyền hàng loạt khi chưa hiểu nguyên nhân.</p><ul><li><strong>Tình huống cụ thể:</strong> kiểm tra tiến trình, cổng 8000, log 200 dòng cuối, rồi xem quyền file cấu hình.</li><li><strong>Lỗi phổ biến:</strong> app bind localhost trong container nên ngoài không gọi được; file chứng chỉ chỉ root đọc được trong khi app chạy non-root.</li></ul>',
code: 'ps aux --sort=-%cpu | head\nss -ltnp | grep 8000\ndocker ps\ndocker logs --tail 200 web\nprintenv | grep DB_\nls -l /etc/app/config.env',
expected: null,
followups: [
{q: 'Bạn phân biệt app chết và app còn sống nhưng không nghe cổng thế nào?', a: 'Bạn đối chiếu tiến trình còn không, cổng có LISTEN không và log nói gì. Tiến trình mất là app đã thoát, còn tiến trình sống mà không có cổng thường là kẹt khởi động, bind sai hoặc chờ phụ thuộc như database.'},
{q: 'Vì sao quyền file hay gây lỗi sau khi gắn volume?', a: 'Vì UID trong container có thể khác UID trên host. File host chỉ cho phép user khác đọc, trong khi app non-root trong container không có quyền. Bạn cần đồng bộ UID, đổi quyền hoặc dùng nhóm chung.'}
],
pitfalls: ['Nhầm bind localhost với bind mọi địa chỉ nên ngoài container không gọi được', 'Đổi quyền 777 cho qua chuyện thay vì sửa đúng user và nhóm'],
selfcheck: ['Tôi vẫn chưa giải thích được cách đọc trạng thái tiến trình zombie và tìm tiến trình cha của nó', 'Tôi có thể giải thích bằng ví dụ dùng ss và log để tách lỗi cổng và lỗi ứng dụng', 'Tôi có thể chẩn đoán một service không trả lời từ shell host mà không cần khởi động lại bừa'],
refs: ['signal-man']
},
{
id: 'H10',
group: 'H',
topic: 'Log, metric, trace và dấu hiệu sự cố',
prio: 'P1',
level: 'L3',
type: 'situation',
q: 'Sau deploy, tỉ lệ 5xx tăng, p99 latency vọt lên và RAM container tăng đều. Bạn dùng log, metric và trace thế nào để khoanh vùng?',
oral: 'Bạn bắt đầu từ metric để biết cái gì đổi và khi nào, đối chiếu thời điểm deploy với đường 5xx, latency và RAM. Sau đó lọc log lỗi theo request id để tìm stack trace và điểm hỏng chung. Rồi mở trace của request chậm để xem thời gian kẹt ở database, hàng đợi hay service ngoài. RAM tăng đều kèm thu gom rác kém gợi ý rò rỉ, còn latency chỉ tăng ở một endpoint gợi ý câu truy vấn chậm. Khi đã có giả thuyết, bạn kiểm tra thay đổi vừa deploy và thử giảm tải hoặc rollback có kiểm soát.',
deep: '<p><strong>Đó là gì:</strong> <code>log</code> ghi sự kiện rời rạc, <code>metric</code> là số liệu tổng hợp theo thời gian như 5xx và p99, <code>trace</code> nối các nhịp xử lý của một request qua nhiều service.</p><p><strong>Cơ chế hoạt động:</strong> metric cho bạn thấy triệu chứng và thời điểm bắt đầu. Log có request id giúp bạn từ một request lỗi lần ra stack trace và dữ liệu đầu vào. Trace phân rã latency theo từng nhịp nên bạn biết thời gian nằm ở database, cache hay lời gọi ngoài. Kết hợp ba nguồn giúp bạn đi từ tương quan tới nguyên nhân.</p><p><strong>Vì sao cần:</strong> chỉ nhìn một nguồn dễ đoán sai, ví dụ 5xx tăng có thể do database nghẽn, RAM cạn hay kết nối ra ngoài treo. Ba tín hiệu chéo nhau giúp loại trừ nhanh.</p><p><strong>Khi nào dùng và khi nào không:</strong> dùng dashboard tổng quan trước rồi mới đào sâu một request mẫu, không đọc log rời rạc ngay từ đầu. Bạn không nên bật log debug toàn hệ thống ở tải cao vì sẽ làm nghẽn thêm.</p><ul><li><strong>Tình huống cụ thể:</strong> so sánh đường deploy với 5xx, lọc log lỗi, mở trace chậm nhất để xem nhịp database phình to.</li><li><strong>Lỗi phổ biến:</strong> nhầm tương quan sau deploy thành nguyên nhân mà chưa loại trừ bão lưu lượng; thiếu request id nên không nối được log và trace.</li></ul><p><strong>Nếu điều kiện thay đổi:</strong> nếu RAM tăng theo bậc sau mỗi deploy thay vì tăng đều, nguyên nhân thường là cache cấu hình sai hoặc giữ kết nối cũ. Nếu latency tăng ở mọi endpoint cùng lúc, bạn nghi hạ tầng và mạng trước; nếu chỉ một endpoint, bạn nghi code và truy vấn của endpoint đó.</p>',
code: 'docker stats --no-stream\ndocker logs --tail 300 web | grep "ERROR"\nss -s\nfree -m',
expected: null,
followups: [
{q: 'Bạn phân biệt rò rỉ bộ nhớ với tải tăng thật thế nào?', a: 'Bạn xem RAM có tăng đều khi tải đã hạ và có quay về sau thu gom không. Rò rỉ thường tăng đơn điệu, kèm số đối tượng và thời gian thu gom tăng. Tải thật thì RAM lên xuống theo lưu lượng và trở lại khi hết cao điểm.'},
{q: 'Bạn phân biệt lỗi ứng dụng với cạn kết nối thế nào?', a: 'Bạn xem log có stack trace của code hay toàn lỗi timeout và hàng đợi đầy. Metric số kết nối database, hàng đợi và file mô tả mở giúp xác nhận. Trace kẹt ở nhịp chờ kết nối gợi ý cạn pool chứ không phải logic sai.'}
],
pitfalls: ['Kết luận deploy gây lỗi chỉ vì trùng thời gian mà chưa loại trừ lưu lượng và phụ thuộc ngoài', 'Thiếu request id nên log và trace không khớp nhau được'],
selfcheck: ['Tôi vẫn chưa giải thích được cách chọn ngưỡng cảnh báo p99 và tỉ lệ 5xx tránh báo động giả', 'Tôi có thể giải thích bằng ví dụ dùng trace chỉ ra nhịp database chiếm phần lớn p99', 'Tôi có thể khoanh vùng một đợt 5xx thực tế từ dashboard tới đúng log và trace mẫu'],
refs: ['docker-compose', 'signal-man']
},
{
id: 'H11',
group: 'H',
topic: 'Git merge, rebase, conflict, revert và reset theo tình huống',
prio: 'P2',
level: 'L2',
type: 'situation',
q: 'Khi nào bạn chọn merge, rebase, revert hay reset, và lệnh nào có nguy cơ mất dữ liệu cần cảnh báo?',
oral: 'Bạn chọn theo đã đẩy code hay chưa và mục tiêu là giữ lịch sử hay sửa sai an toàn. Merge giữ đầy đủ lịch sử phân nhánh, phù hợp nhánh tính năng đã chia sẻ. Rebase làm lịch sử thẳng và sạch nhưng chỉ dùng cho nhánh riêng chưa đẩy, vì viết lại lịch sử đã chia sẻ gây rắc rối cho cả nhóm. Revert tạo commit mới đảo ngược commit cũ nên an toàn cho nhánh chung. Reset di chuyển con trỏ nhánh và có thể xóa commit và thay đổi, nguy hiểm nhất khi dùng cờ cứng trên nhánh đã đẩy.',
deep: '<p><strong>Đó là gì:</strong> <code>merge</code> hợp nhất và giữ lịch sử phân nhánh, <code>rebase</code> viết lại commit lên nền mới, <code>revert</code> tạo commit đảo ngược, <code>reset</code> dời con trỏ nhánh về commit cũ.</p><p><strong>Cơ chế hoạt động:</strong> merge tạo commit hợp nhất nên lịch sử trung thực nhưng nhiều nhánh rẽ. Rebase sao chép từng commit sang nền mới nên lịch sử thẳng nhưng đổi mã commit. Revert không xóa gì mà thêm commit mới. Reset cứng xóa commit và thay đổi trong cây làm việc nên khó cứu nếu chưa sao lưu.</p><p><strong>Vì sao cần chọn đúng:</strong> chọn sai gây mất code của đồng nghiệp, lịch sử rối và khó quay lại khi release lỗi. Quy tắc vàng là nhánh đã chia sẻ thì chỉ thêm commit mới, không viết lại lịch sử.</p><p><strong>Khi nào dùng và khi nào không:</strong> dùng rebase cho nhánh cá nhân chưa đẩy, dùng merge cho nhánh đã chia sẻ, dùng revert để undo trên main đã đẩy, chỉ dùng reset cứng cho nhánh riêng và sau khi đã lưu bản sao. Bạn không bao giờ ép đẩy main hay nhánh release.</p><ul><li><strong>Tình huống cụ thể:</strong> nhánh tính năng riêng thì rebase lên main mới, nhánh main deploy lỗi thì revert, conflict thì giải quyết từng file rồi chạy lại test.</li><li><strong>Lỗi phổ biến:</strong> rebase nhánh chung rồi ép đẩy khiến đồng nghiệp mất commit; dùng reset cứng thay vì revert trên nhánh đã chia sẻ.</li></ul>',
code: null,
expected: null,
followups: [
{q: 'Giải conflict thế nào cho an toàn?', a: 'Bạn mở từng file conflict, hiểu cả hai phía thay vì chọn bừa một bên, giữ lại test liên quan, chạy lại lint và test rồi mới commit tiếp. Với rebase, bạn giải quyết từng commit một và dùng tiếp tục sau mỗi bước.'},
{q: 'Vì sao reset cứng nguy hiểm và cứu thế nào khi lỡ tay?', a: 'Vì reset cứng xóa commit khỏi nhánh và xóa thay đổi chưa commit. Bạn chỉ dùng khi chắc chắn có bản sao. Khi lỡ tay, bạn cần tìm lại mã commit qua nhật ký reflog nếu còn, nên quy tắc là sao lưu nhánh trước khi reset.'}
],
pitfalls: ['Rebase rồi ép đẩy nhánh chung làm đồng nghiệp mất commit', 'Dùng reset cứng trên nhánh đã đẩy thay vì revert an toàn'],
selfcheck: ['Tôi vẫn chưa giải thích được reflog giữ commit bị reset trong bao lâu và khi nào hết cứu được', 'Tôi có thể giải thích bằng ví dụ chọn revert cho main đã deploy lỗi và reset cho nhánh riêng', 'Tôi có thể xử lý một conflict merge thực tế mà không làm mất test của đồng nghiệp'],
refs: ['gh-actions']
},
{
id: 'H12',
group: 'H',
topic: 'Xử lý sự cố và cải tiến từ phản hồi người dùng',
prio: 'P2',
level: 'L3',
type: 'situation',
q: 'Khi hệ thống gặp sự cố production và sau đó nhận nhiều phản hồi người dùng, bạn xử trí sự cố và biến phản hồi thành cải tiến thế nào?',
oral: 'Khi sự cố xảy ra, bạn ưu tiên giảm thiệt hại trước rồi mới tìm nguyên nhân gốc. Bạn khoanh vùng ảnh hưởng, thông báo trạng thái rõ ràng, dùng cờ tính năng hoặc rollback có kiểm soát để trả lại dịch vụ. Song song đó bạn thu thập log, metric và trace theo mốc thời gian. Sau khi hệ thống ổn, bạn viết báo cáo sự cố gồm timeline, nguyên nhân gốc và hành động khắc phục. Với phản hồi người dùng, bạn gom nhóm theo vấn đề, chấm điểm theo mức độ và tần suất, làm bản sửa nhỏ nhất rồi đo lại.',
deep: '<p><strong>Đó là gì:</strong> <code>incident handling</code> là quy trình phát hiện, giảm thiệt hại, khắc phục và học sau sự cố. Vòng cải tiến từ phản hồi là thu thập, phân loại, ưu tiên, triển khai và đo lường lại.</p><p><strong>Cơ chế hoạt động:</strong> bạn phân mức độ nghiêm trọng để quyết định huy động ai và thông báo thế nào. Bạn dùng kênh trạng thái duy nhất để tránh thông tin nhiễu. Mọi hành động đều ghi mốc thời gian để dựng lại timeline. Sau sự cố, bạn truy nguyên nhân gốc bằng cách hỏi vì sao nhiều lần tới khi chạm quy trình, không dừng ở lỗi con người.</p><p><strong>Vì sao cần:</strong> xử lý thiếu kỷ luật dễ kéo dài downtime và mất niềm tin. Biến phản hồi thành backlog có ưu tiên giúp bạn sửa đúng đau nhất của người dùng thay vì chạy theo yêu cầu to nhất.</p><p><strong>Khi nào dùng và khi nào không:</strong> sự cố nghiêm trọng thì giảm thiệt hại trước, không mải debug sâu khi người dùng đang kẹt. Phản hồi thì ưu tiên theo bằng chứng và tần suất, không làm ngay mọi yêu cầu riêng lẻ.</p><ul><li><strong>Tình huống cụ thể:</strong> tắt tính năng lỗi bằng cờ, khôi phục dịch vụ, rồi viết báo cáo sự cố và biến ba phàn nàn lặp lại thành một cải tiến đo được.</li><li><strong>Lỗi phổ biến:</strong> đổ lỗi cá nhân thay vì sửa quy trình; sửa phản hồi theo cảm tính mà không đo lại sau triển khai.</li></ul><p><strong>Nếu điều kiện thay đổi:</strong> nếu sự cố lặp lại dù đã sửa triệu chứng, bạn phải nâng thành vấn đề kiến trúc như thiếu giới hạn tải hay thiếu dự phòng. Nếu phản hồi mâu thuẫn giữa hai nhóm người dùng, bạn phải phân khúc và thử nghiệm nhỏ thay vì áp một giải pháp cho tất cả.</p>',
code: null,
expected: null,
followups: [
{q: 'Báo cáo sự cố tốt gồm những gì?', a: 'Báo cáo gồm tóm tắt ảnh hưởng, timeline theo mốc thời gian, nguyên nhân gốc, hành động khắc phục ngay và hành động ngăn lặp lại có người chịu trách nhiệm và hạn xong. Báo cáo không đổ lỗi mà tập trung vào lỗ hổng quy trình.'},
{q: 'Bạn ưu tiên phản hồi người dùng thế nào khi nguồn lực có hạn?', a: 'Bạn gom phản hồi thành chủ đề, chấm theo tần suất, mức đau và số người ảnh hưởng, trừ đi chi phí làm. Bạn làm bản nhỏ nhất có thể đo được trước, rồi mở rộng khi số liệu cải thiện.'}
],
pitfalls: ['Mải tìm nguyên nhân gốc trong lúc downtime thay vì giảm thiệt hại trước', 'Làm theo phản hồi to nhất thay vì phản hồi lặp lại nhiều nhất'],
selfcheck: ['Tôi vẫn chưa giải thích được cách đặt mức độ sự cố và tiêu chí huy động theo từng mức', 'Tôi có thể giải thích bằng ví dụ dùng cờ tính năng để giảm thiệt hại rồi viết báo cáo sự cố', 'Tôi có thể biến một chùm phản hồi trùng lặp thành một cải tiến có số liệu đo sau triển khai'],
refs: ['gh-actions', 'docker-compose']
}
);
