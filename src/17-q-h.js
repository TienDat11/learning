var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "H01",
  "group": "H",
  "topic": "Image và container",
  "prio": "P0",
  "level": "L1",
  "type": "concept",
  "attacks": [
    {
      "q": "Image và container khác nhau thế nào, và vì sao điều đó quan trọng khi gỡ lỗi?",
      "a": "Image là bản mẫu chỉ đọc gồm các layer hệ thống tệp cùng metadata; container là một real instance đang chạy được tạo từ image, có thêm một writable layer riêng trên top. Điều này quan trọng khi gỡ lỗi vì mọi thay đổi bạn làm bên trong container đang chạy chỉ nằm ở writable layer đó và mất khi container bị xóa — nên nếu bạn sửa file trong container để thử nghiệm rồi khởi động lại, thay đổi biến mất. Hệ quả thực tế là không bao giờ được sửa trực tiếp trong container đang chạy để khắc phục sự cố; mọi thay đổi phải được commit vào image mới và deploy lại, nếu không lần sau sự cố sẽ tái diễn và không ai biết vì sao bản sửa đã mất."
    },
    {
      "q": "Vì sao cùng một image chạy tốt trên máy bạn nhưng lỗi trên máy chủ?",
      "a": "Vì image chỉ đóng gói file system và config của nó, không đóng gói kernel của host. Container dùng chung kernel của host, nên khác biệt về phiên bản kernel, architecture CPU, hoặc các kernel feature được enable sẽ tạo ra khác biệt hành vi. Ngoài ra những gì bạn mount từ ngoài vào — environment variables, volume, network config — không nằm trong image, nên thiếu hoặc khác chúng cũng gây lỗi. Cách chẩn đoán là so sánh ba nhóm này giữa hai môi trường, thay vì tìm lỗi trong code vì code là phần giống nhau."
    }
  ],
  "incident": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li>Image: bản mẫu chỉ đọc, gồm các layer file system</li><li>Container: instance chạy từ image, có writable layer riêng</li><li>Layer store: nơi Docker lưu các layer dùng chung</li></ul><p><strong>Scenario:</strong> 23h40 thứ Ba, bạn xóa container <code>web-a</code> trên máy local để chạy lại. Ba đồng nghiệp khác vẫn trỏ vào cùng image và giả định container còn đó. Mười phút sau, đồng nghiệp báo dashboard trống vì container của anh chưa restart được. Log chỉ hiện một dòng: <code>No such container: web-a</code>. Bạn cố xóa image bằng <code>docker rmi</code> thì nhận conflict.</p>",
  "askFirst": [
    "Vì sao người khác bị ảnh hưởng khi bạn xóa container của mình? → Giải mã: Cùng một image chạy thành nhiều instance (container) với environment khác nhau. Xóa instance chỉ bỏ writable layer; image còn nguyên trong layer store nên mọi người vẫn dùng được, chỉ phải tạo lại container của mình (xem Bài L03).",
    "Xóa container khác gì xóa image? → Giải mã: Xóa container chỉ bỏ writable layer và metadata. Image nằm trong layer store dùng chung nên không mất. Muốn mất image phải chạy docker rmi, và lệnh đó bị chặn khi còn container tham chiếu (xem Bài L22)."
  ],
  "predict": {
    "q": "Bạn đoán kết quả của docker rmi webapp:1.2 khi còn container tham chiếu image đó?",
    "a": "<p>Docker báo conflict vì layer chỉ đọc của image nằm trong layer store dùng chung. Xóa container chỉ bỏ writable layer và metadata, còn image giữ nguyên trong layer store. <code>docker rmi</code> bị chặn khi còn container tham chiếu, kể cả container đã dừng.</p>"
  },
  "anchor": "Container là writable layer trên image bất biến mà không có constraint giữ layer store = xóa container chỉ mất state, không mất image.",
  "q": "Hãy phân biệt Docker image và container, và giải thích vì sao xóa container không làm mất image?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Nghĩ container là bản sao độc lập của image nên xóa container thì image cũng mất, và muốn dữ liệu bền thì ghi thẳng vào hệ thống tệp của container.</p><p><strong>Vì sao hỏng:</strong> Xóa container chỉ bỏ writable layer, còn image nằm trong layer store dùng chung giữa mọi container. Dữ liệu ghi trong writable layer mất cùng lúc với container, nên đồng nghiệp dùng cùng image vẫn chạy được sau khi tạo lại container của mình.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> image và container là hai đối tượng lưu trữ khác lớp: image là bộ layer chỉ đọc dùng chung, container chỉ là một writable layer mỏng kèm namespace và cgroup riêng.</p><ul><li><strong>Layer store dùng chung:</strong> các layer chỉ đọc nằm ngoài writable layer nên docker rm không chạm tới; docker rmi mới xóa và bị conflict khi còn container tham chiếu, kể cả container đã dừng.</li><li><strong>Writable layer riêng:</strong> mọi ghi file khi chạy nằm ở đây và mất khi xóa container, nên dữ liệu muốn tồn tại qua vòng đời phải mount volume hoặc đẩy ra database.</li></ul>",
  "oral": "Image là sample chỉ đọc gồm các layer xếp chồng, chứa OS gọn nhẹ, libraries và code của bạn. Container là một process đang chạy được tạo ra từ image, cộng thêm một writable layer mỏng bên trên. Khi bạn xóa container, bạn chỉ xóa writable layer đó và process đi kèm, còn image gốc vẫn nằm trong local storage. Nhờ vậy bạn có thể tạo lại container mới từ cùng một image bất cứ lúc nào, và nhiều container có thể cùng chạy từ một image mà không ảnh hưởng lẫn nhau.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Image</strong>: tập layer chỉ đọc tạo khi build</li><li><strong>Container</strong>: process chạy với writable layer + namespace/cgroup riêng</li><li><strong>Writable layer</strong>: nơi lưu mọi ghi file khi chạy</li><li><strong>Layer store</strong>: nơi lưu các layer chỉ đọc dùng chung</li></ul><p><strong>Trước container:</strong> mỗi microservice chạy trên một VM: khởi động mất vài phút, patch kernel thủ công, muốn scale thêm replica là chờ hạ tầng. Khi một team chạy hàng chục replica cùng host, mô hình đó không theo kịp. Container đóng gói bộ tệp và chạy song song trên kernel cùng host.</p><p><strong>Cơ chế:</strong> Image là tập layer chỉ đọc tạo khi build; khi chạy, Docker đặt một writable layer mỏng trên top kèm namespace và cgroup riêng. Mọi ghi file khi chạy nằm ở writable layer này. Xóa container bằng <code>docker rm</code> chỉ xóa writable layer đó và metadata, các layer image nằm trong layer store dùng chung nên vẫn còn trừ khi <code>docker rmi</code> xóa hẳn.</p><p><strong>Thói quen sai:</strong> sửa file trực tiếp trong container rồi kỳ vọng nó tồn tại; chính cơ chế đó khiến recreate xóa mất sửa đổi. Muốn dữ liệu tồn tại qua vòng đời container, phải mount volume hoặc đẩy ra database và object storage. Ví dụ, build <code>webapp:1.2</code> một lần, chạy <code>web-a</code> và <code>web-b</code> với environment variables khác nhau.</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: xóa container không mất image vì image nằm trong layer store dùng chung; dữ liệu trong container không hứa tồn tại nên phải mount volume; cùng một image chạy được nhiều container song song. Lỗi phổ biến là team tưởng mất dữ liệu do image.</p><p><strong>Bài học nền tảng liên quan:</strong> Cơ chế vận hành container dài hạn trên ECS và EC2 (xem Bài L03, L16) và artifact bất biến khi deploy (xem Bài L22, L23) giải thích tại sao mọi thay đổi chỉ tồn tại ở writable layer và mất khi recreate.</p>",
  "code": "docker images\ndocker build -t webapp:1.2 .\ndocker run -d --name web-a -p 8080:8000 webapp:1.2\ndocker ps -a\ndocker rm web-a\ndocker images",
  "expected": "Lần docker images đầu liệt kê các image đang có sẵn (có thể rỗng); sau docker build -t webapp:1.2 thì lần docker images cuối phải có thêm một dòng với REPOSITORY webapp, TAG 1.2, kèm IMAGE ID 12 ký tự và SIZE. docker run -d in ra container ID đầy đủ 64 ký tự rồi trả quyền ngay vì chạy nền, docker ps -a hiện web-a ở trạng thái Up ... với cột PORTS là 0.0.0.0:8080->8000/tcp. Điểm dễ sai nằm ở docker rm web-a: trên container ĐANG CHẠY lệnh này lỗi với thông báo You cannot remove a running container, hãy Stop the container before attempting removal or force remove, nên chuỗi lệnh như đề bài chưa xóa được gì; muốn xóa phải docker stop web-a rồi docker rm web-a, hoặc docker rm -f. Phân tích: docker rm chỉ xóa writable layer và metadata của container, còn các layer chỉ đọc của image nằm trong layer store dùng chung giữa mọi container và chỉ bị xóa bởi docker rmi; chính docker rmi cũng từ chối khi còn container tham chiếu image (kể cả container đã dừng), báo lỗi conflict vì image đang bị container tham chiếu. Đó là lý do xóa container không làm mất image, và cũng là lý do dữ liệu ghi trong container biến mất cùng writable layer đó. Lệnh chứng minh: docker images --digests và docker rmi webapp:1.2 (khi container còn tồn tại sẽ báo conflict).",
  "followups": [
    {
      "q": "Layer trong image hoạt động thế nào khi hai image dùng chung base?",
      "a": "Các layer được định danh bằng digest và được dùng chung giữa các image. Khi hai image cùng dùng một base, Docker chỉ lưu base một lần và mỗi image chỉ thêm các layer riêng phía trên, giúp tiết kiệm disk và tăng tốc pull image."
    },
    {
      "q": "Dữ liệu ghi trong container đi đâu khi xóa container?",
      "a": "Dữ liệu ghi vào writable layer của container sẽ mất khi xóa container. Muốn giữ lại lâu dài, bạn phải mount volume hoặc bind mount ra ngoài, hoặc đẩy dữ liệu lên database và object storage."
    },
    {
      "q": "Khi nào bạn dùng tag image và digest?",
      "a": "Tag giúp con người đọc version như 1.2 hay latest, còn digest là mã băm bất biến của nội dung image. Khi triển khai production, bạn nên chốt digest để bảo đảm đúng image đã kiểm thử, tránh việc tag bị ghi đè."
    }
  ],
  "pitfalls": [
    "Nhầm lẫn xóa container với xóa image, rồi ngạc nhiên vì disk vẫn đầy do image còn lại",
    "Lưu dữ liệu quan trọng trong container rồi mất khi recreate"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được union filesystem gộp các layer chỉ đọc thành một root duy nhất thế nào",
    "Tôi có thể giải thích bằng ví dụ một image dùng chung cho hai container chạy song song với environment variables khác nhau",
    "Tôi có thể liệt kê image đang chiếm disk và dọn container đã dừng trên máy dev mà không xóa nhầm image production"
  ],
  "refs": [
    "dockerfile-ref"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> chạy nhiều container từ cùng một image không ảnh hưởng lẫn nhau; tạo lại container mới từ image bất kỳ lúc nào.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> dữ liệu trong container không hứa tồn tại qua recreate; muốn bền phải mount volume hoặc đẩy ra database.</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log hiện No such container khi đồng nghiệp gọi service; dashboard trống vì container chưa restart được; docker rmi báo conflict khi còn container tham chiếu.</li><li><strong>Cách kiểm chứng nhanh:</strong> chạy docker ps -a để thấy container đã dừng; chạy docker images để xác nhận image còn trong layer store; kiểm tra dữ liệu còn không sau khi xóa container. (xem Bài L03, L22).</li></ul>"
},
{
  "id": "H02",
  "group": "H",
  "topic": "Dockerfile layer và build cache",
  "prio": "P0",
  "level": "L2",
  "type": "predict",
  "attacks": [
    {
      "q": "Vì sao đổi thứ tự các lệnh trong Dockerfile lại ảnh hưởng lớn tới thời gian build?",
      "a": "Vì mỗi lệnh tạo một layer, và build cache được dùng lại theo prefix: khi một layer thay đổi, mọi layer sau nó đều phải build lại. Nếu bạn copy toàn bộ source code rồi mới cài dependencies, thì mỗi lần sửa một dòng code, layer copy đổi và toàn bộ bước cài dependencies chạy lại từ đầu — có thể mất nhiều phút. Đảo lại, copy file dependencies trước, cài dependencies, rồi mới copy source code, thì bước cài dependencies chỉ chạy lại khi danh sách dependencies thật sự đổi."
    },
    {
      "q": "Build cache bị invalidate ngoài ý muốn vì những nguyên nhân nào?",
      "a": "Bốn nguyên nhân phổ biến. Một là file trong build context bị thay đổi khi bạn dùng COPY toàn bộ context (ví dụ COPY . .), như file log hoặc thư mục cache không được loại trừ bằng .dockerignore; nếu chỉ COPY từng file cụ thể thì file không copy vào không ảnh hưởng tới cache của layer đó. Hai là lệnh cài dependencies không pin version, nên mỗi lần chạy có thể lấy version mới và tạo ra layer khác. Ba là dùng base image theo tag động, nên khi base image được cập nhật thì layer đầu tiên đổi và mọi thứ sau đó build lại. Bốn là thay đổi quyền (mode) của file, vì quyền là metadata nằm trong checksum của COPY; còn chỉ đổi mtime thì không làm invalidate cache."
    }
  ],
  "incident": "<p><strong>Scenario:</strong> Sáng thứ Tư, pipeline CI build mất 14 phút thay vì 2 phút trước đó. Dev A báo chỉ đổi một dòng trong <code>app.py</code>, không đổi <code>requirements.txt</code>. Đồng nghiệp B xem log: toàn bộ bước <code>pip install</code> chạy lại từ đầu. 40 dev trong team bị kẹt chờ release đến 15h.</p>",
  "askFirst": [
    "Docker sẽ build lại từ layer nào khi chỉ có app.py đổi? → Giải mã: Docker so checksum input từng layer theo thứ tự; layer không đổi dùng cache, layer đầu tiên đổi và mọi layer sau đó build lại. app.py đổi làm layer COPY . . đổi nên chỉ các layer phía dưới chạy lại (xem Bài L10).",
    "Vì sao thứ tự COPY và RUN trong Dockerfile quyết định tốc độ build? → Giải mã: Mỗi lệnh là một layer, build cache dùng theo prefix. COPY source trước rồi install dependencies khiến mọi sửa code phá cache cả bước install. Đảo: dependencies trước, source sau, sửa code không install lại (xem Bài L10)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra khi bỏ requirements.txt vào cùng layer với COPY source code?",
    "a": "<p>Mọi lần sửa code đều phá cache của layer chứa source code và kéo theo bước <code>pip install</code> phía sau, vì input của layer đó đổi. Cách đúng là tách <code>COPY requirements.txt</code> và <code>RUN pip install</code> lên trước, đặt <code>COPY . .</code> xuống sau, để sửa code chỉ build lại hai layer cuối.</p>"
  },
  "anchor": "Build cache so checksum input từng layer mà không có layer tách bước ít đổi = một dòng code đổi cũng install lại mọi thư viện.",
  "q": "Với Dockerfile dưới đây, khi bạn chỉ sửa source code mà không đổi requirements, Docker sẽ build lại từ layer nào và vì sao?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Sửa một dòng code mà build chậm thì đổ lỗi Docker build chậm chung chung, hoặc thêm .dockerignore rồi kỳ vọng cache không bị ảnh hưởng. Cách khác là chấp nhận mọi lần sửa code phải chạy lại toàn bộ bước pip install.</p><p><strong>Vì sao hỏng:</strong> Build cache so checksum input theo prefix, nên layer COPY source đổi là mọi layer phía sau, bao gồm pip install, chạy lại từ đầu. .dockerignore không loại được source code thật nên không cứu được layer COPY.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> Docker lưu build cache theo từng layer và chỉ dùng lại khi input của layer giữ nguyên; layer nào đổi, layer đó và mọi layer phía sau phải chạy lại theo quy tắc prefix.</p><ul><li><strong>Layer gộp dependencies và source:</strong> khi requirements.txt và source code cùng một layer, sửa một dòng code phá checksum cả bước pip install.</li><li><strong>Context đổi không do code:</strong> file log hay thư mục cache trong build context làm checksum context đổi, cache miss dù source không đổi.</li><li><strong>Base image tag động:</strong> base đổi thì layer đầu đổi, kéo toàn bộ chain build lại từ đầu.</li></ul>",
  "oral": "Docker build từng instruction thành từng layer và lưu cache theo thứ tự. Layer nào không đổi thì dùng lại cache, layer đầu tiên có thay đổi và mọi layer sau nó phải build lại. Vì vậy thứ tự copy file quyết định tốc độ build. Bạn nên copy dependencies và cài đặt trước, copy source code hay đổi sau. Sửa source code mà không chạm tới requirements thì Docker dùng lại cache tới bước cài đặt, chỉ build lại từ bước copy source code trở đi.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Build cache</strong>: bộ cache theo layer, so checksum input</li><li><strong>Prefix rule</strong>: layer đổi, mọi layer sau cũng phải build lại</li><li><strong>.dockerignore</strong>: loại file không cần gửi sang daemon</li></ul><p><strong>Trước container:</strong> build nhiều service trên cùng server dùng script và Makefile, cache nằm ngoài hệ quản trị nên khi dependencies đổi không rõ step nào invalidate. Container đưa build vào từng layer chỉ đọc, Docker lưu cache theo thứ tự layer: layer nào đổi, layer đó và mọi layer phía sau phải chạy lại.</p><p><strong>Áp lực từ CI:</strong> Mỗi lần merge, <code>pip install</code> chạy lại vì <code>requirements.txt</code> và source code cùng layer. Sửa một dòng <code>app.py</code> cũng kéo theo install lại mọi thư viện. Cách hiện đại là đổi thứ tự instruction: <code>COPY requirements.txt</code>, <code>RUN pip install</code>, rồi <code>COPY . .</code>. Khi file dependencies không đổi, bước install hit cache; khi đổi, chỉ install lại theo danh sách mới.</p><p><strong>Công cụ debug:</strong> Hôm nay dùng <code>docker build --progress=plain</code> để xem layer nào chạy lại, <code>.dockerignore</code> để log và cache không làm đổi checksum context, và BuildKit cache mount để giữ dependencies giữa các lần build. Chỗ còn sai là Dockerfile đặt <code>COPY . .</code> trước khi install dependencies, khiến cache bị invalidate mỗi lần dev sửa code.</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: build cache so input theo layer và theo prefix; thứ tự COPY quyết định tốc độ; tách file dependencies trước, source code sau là quy tắc tối ưu. Lỗi phổ biến nhất là không tách layer, làm CI chờ lại toàn bộ bước install.</p><p><strong>Bài học nền tảng liên quan:</strong> Pipeline build và promote artifact bất biến (xem Bài L10, L17, L22) giải thích vì sao sửa code không nên kéo theo install lại dependencies và artifact cần định danh bằng commit SHA.</p>",
  "code": "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD [\"python\", \"app.py\"]",
  "expected": "Docker dùng lại cache từ FROM tới hết RUN install, và build lại từ COPY . . trở đi. Nguyên nhân là requirements.txt không đổi nên checksum input của các layer trên giữ nguyên, còn layer COPY . . thấy source code đổi nên hỏng cache, kéo theo CMD phía sau phải tạo lại.",
  "followups": [
    {
      "q": "Vì sao thêm .dockerignore lại tăng tỉ lệ hit cache?",
      "a": "Vì build context gửi sang daemon gồm mọi file không bị loại trừ. Nếu không loại trừ thư mục log hay cache, checksum context đổi liên tục và layer COPY bị coi là đổi dù source code không đổi. Loại trừ đúng giúp cache ổn định."
    },
    {
      "q": "Khi nào bạn dùng --no-cache hoặc build nhiều tầng để xử lý cache?",
      "a": "Bạn dùng --no-cache khi nghi cache cũ che lỗi như package bị xóa khỏi repo. Bạn dùng multi-stage hoặc cache mount để giữ cache của package manager giữa các lần build mà không phình image cuối."
    },
    {
      "q": "Thứ tự nào tối ưu cho dự án Python và Node?",
      "a": "Bạn copy dependencies trước, install, rồi mới copy source code. Với Node bạn copy package-lock.json trước rồi chạy install, với Python bạn copy requirements trước rồi install, để sửa code không install lại dependencies."
    }
  ],
  "pitfalls": [
    "Copy toàn bộ source code ngay dòng đầu nên build lại luôn chậm",
    "Nghĩ cache dựa trên mtime của file, trong khi Docker dựa trên nội dung và instruction"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được Docker tính checksum cho instruction COPY nhiều file và phân biệt cache miss do file nào",
    "Tôi có thể giải thích bằng ví dụ sửa app.py mà không install lại requirements nhờ tách layer",
    "Tôi có thể sắp xếp lại một Dockerfile thực tế để build lại sau khi sửa code chỉ còn vài giây"
  ],
  "refs": [
    "dockerfile-ref",
    "docker-multi-stage"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> tách dependencies khỏi source khiến sửa code không install lại thư viện; pipeline build nhanh, 40 dev không kẹt chờ release.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> Dockerfile dài thêm lệnh; phải duy trì .dockerignore đúng; pin version dependencies để cache ổn định.</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> pipeline CI build mất 14 phút thay vì 2 phút; toàn bộ bước pip install chạy lại từ đầu khi chỉ đổi một dòng code; dev bị kẹt chờ release.</li><li><strong>Cách kiểm chứng nhanh:</strong> xem log CI layer nào cache miss; so checksum input của layer COPY với layer RUN install; thử sửa một dòng và đo lại thời gian build. (xem Bài L10).</li></ul>"
},
{
  "id": "H03",
  "group": "H",
  "topic": "Multi-stage build",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Multi-stage build có làm thời gian build lâu hơn không?",
      "a": "Có thể lâu hơn, vì bạn thêm các bước build ở stage đầu, nhưng thời gian đó thường được trả lại ở những lần sau nhờ cache, và bù lại bằng thời gian pull và startup nhanh hơn ở mọi lần chạy. Điều quan trọng hơn là chất lượng của kết quả: image nhỏ hơn nghĩa là ít packages hơn, nên ít vulnerabilities hơn và ít attack surface hơn. Với hệ thống deploy thường xuyên, việc tối ưu theo thời gian pull và startup thường đáng giá hơn thời gian build, vì build chạy một lần còn pull chạy ở mọi replica."
    },
    {
      "q": "Có trường hợp nào multi-stage không giúp ích gì?",
      "a": "Có. Nếu ngôn ngữ hoặc tool không tạo ra phần dependencies chỉ dùng lúc build — ví dụ một ứng dụng chỉ gồm các files text và một script runner — thì multi-stage không giúp ích gì vì image cuối không nhỏ hơn. Trường hợp khác là khi bạn cần giữ tool để debug trong container, lúc đó image lớn hơn là có chủ đích."
    }
  ],
  "incident": "<p><strong>Scenario:</strong> 1h30 đêm Chủ Nhật, cảnh báo Chi phí cloud tăng gấp ba. Dev C kiểm tra: image production <code>api:2.4</code> nặng 1.9 GB vì Dockerfile một stage kéo theo C compiler, <code>git</code> và <code>gcc</code>. Mỗi lần scale-out thêm replica phải pull 1.9 GB, mất 6 phút restart sau crash. Team Ops chờ 20 phút để khôi phục toàn bộ dịch vụ thanh toán.</p>",
  "askFirst": [
    "Làm sao giữ image production nhỏ mà vẫn compile được code? → Giải mã: Dùng hai stage: stage đầu compile và install dependencies, stage cuối (slim) chỉ COPY --from artifact. Compiler và git không bao giờ lọt vào image production (xem Bài L16).",
    "Vì sao stage builder chứa compiler không nên đưa vào image cuối? → Giải mã: Compiler, git, pip cache chỉ cần lúc build, không cần lúc chạy. Đưa vào image cuối làm scale-out pull thừa dung lượng, attack surface phình, security audit phát hiện nhiều vulnerabilities hơn (xem Bài L02)."
  ],
  "predict": {
    "q": "Bạn đoán stage builder chiếm phần dung lượng nào của image cuối nếu không dùng multi-stage?",
    "a": "<p>Tất cả: compiler, git, gcc, pip cache và build source đều nằm trong layer chỉ đọc của image xuất ra. Multi-stage chỉ <code>COPY --from=builder</code> artifact sang runtime image slim, nên các layer trung gian không xuất hiện trong image cuối.</p>"
  },
  "anchor": "Image build một stage mà không có stage tách artifact = compiler và git nằm trong image production, kéo dài thời gian scale-out và phình attack surface.",
  "q": "Multi-stage build trong Dockerfile là gì và vì sao nó giúp image production nhỏ và an toàn hơn?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Viết Dockerfile một stage với compiler, git và gcc rồi ship nguyên image 1.9 GB lên production vì build đơn giản; hoặc build xong nhưng không tách build tool khỏi image cuối.</p><p><strong>Vì sao hỏng:</strong> Compiler và git chỉ cần lúc build, không cần lúc chạy. Nhét vào image production làm mỗi lần scale-out phải pull 1.9 GB, restart mất sáu phút, chi phí cloud tăng gấp ba.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> mỗi FROM tạo một stage, và image cuối chỉ chứa layer của stage cuối cùng; không tách stage thì build tool và artifact build nằm cùng trong image xuất ra.</p><ul><li><strong>Stage duy nhất giữ hết:</strong> compiler, git, pip cache nằm trong layer chỉ đọc của image nên mọi replica đều pull phần thừa.</li><li><strong>COPY --from thay thế:</strong> stage builder chỉ xuất artifact sang stage runtime slim, các layer trung gian không xuất hiện trong image cuối.</li></ul>",
  "oral": "Multi-stage build cho phép bạn viết nhiều khối FROM trong một Dockerfile, khối đầu dùng image lớn để compile và install, khối cuối chỉ copy artifact cần chạy. Image cuối không chứa compiler, source code hay cache, nên nhỏ hơn nhiều, startup nhanh hơn và ít vulnerabilities hơn. Bạn vẫn chỉ cần một file Dockerfile duy nhất, không phải chia nhiều file hay copy thủ công giữa các bước.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Stage</strong>: khối FROM riêng trong Dockerfile</li><li><strong>Artifact</strong>: sản phẩm cần chạy, không phải tool build</li><li><strong>COPY --from</strong>: lấy nội dung từ stage trước</li></ul><p><strong>Trước multi-stage:</strong> Dockerfile một stage đưa cả compiler, git, compiler cache và build source vào image production. Scale-out pull toàn bộ dung lượng đó, và mỗi package thừa là một attack surface. Áp lực là chi phí bandwidth, thời gian restart sau crash, và security audit phình theo image.</p><p><strong>Cơ chế:</strong> Multi-stage cho phép nhiều <code>FROM</code> trong một Dockerfile. Stage builder dùng image đầy đủ để compile và install dependencies; stage runtime chỉ nhận artifact qua <code>COPY --from=builder</code>, nên các layer trung gian không xuất hiện trong image đẩy lên registry. Ví dụ: <code>FROM python:3.12 AS builder</code> chạy <code>pip install --prefix=/pkg</code>, rồi <code>FROM python:3.12-slim</code> và <code>COPY --from=builder /pkg /usr/local</code>.</p><p><strong>Khi nào dùng:</strong> Multi-stage đặc biệt hữu ích khi: (1) build C/C++/Go cần compiler nhưng runtime không cần; (2) install dependencies bằng pip/npm nhưng muốn giữ image slim; (3) cần copy config từ environment-specific stage. Trường hợp không hữu ích: ứng dụng thuần Python không compile, hoặc cần giữ tool để debug.</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: multi-stage tách build và runtime; chỉ stage cuối thành image xuất ra; COPY --from lấy artifact từ stage trước. Lỗi phổ biến là COPY quá nhiều từ builder (cả source lẫn cache) làm image vẫn phình.</p><p><strong>Bài học nền tảng liên quan:</strong> Chọn công cụ chạy (ECS Fargate, Lambda container, EC2) ảnh hưởng trực tiếp đến kích thước image (xem Bài L03, L04, L16) và quy trình security audit (xem Bài L02).</p>",
  "code": "FROM python:3.12 AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --prefix=/pkg --no-cache-dir -r requirements.txt\nFROM python:3.12-slim\nWORKDIR /app\nCOPY --from=builder /pkg /usr/local\nCOPY app.py .\nCMD [\"python\", \"app.py\"]",
  "expected": "Kết quả build: chỉ stage CUỐI trở thành image xuất ra, nên image cuối gồm base python:3.12-slim cộng các layer do WORKDIR, COPY --from=builder /pkg /usr/local và COPY app.py ., không có layer nào của stage builder (image python:3.12 đầy đủ, pip, wheel, pip cache và requirements.txt đều bị bỏ lại). Phân tích: COPY --from=builder chỉ copy nội dung thư mục /pkg; pip install --prefix=/pkg đặt packages vào /pkg/lib/python3.12/site-packages và scripts vào /pkg/bin, khi đổ vào /usr/local thì thành /usr/local/lib/python3.12/site-packages và /usr/local/bin, đúng vị trí mà interpreter của image chính thức tìm kiếm (image python chính thức cài Python dưới /usr/local), nên import chạy được mà không install lại. Nhờ vậy image cuối nhỏ hơn nhiều so với image đầy đủ (…",
  "followups": [
    {
      "q": "Multi-stage khác gì việc viết hai Dockerfile riêng?",
      "a": "Multi-stage giữ toàn bộ pipeline trong một file và một lần build, Docker tự quản lý layer trung gian. Hai file riêng buộc bạn tự build, tag intermediate và copy thủ công, dễ lệch version và khó dùng cache trên CI."
    },
    {
      "q": "Làm sao tránh lộ secret trong giai đoạn build?",
      "a": "Bạn không nên truyền secret qua ARG vì nó nằm trong image history. Bạn nên dùng secret mount lúc build hoặc environment variables của CI, và bảo đảm stage cuối không copy file chứa secret."
    },
    {
      "q": "Khi nào image nhỏ lại quan trọng nhất?",
      "a": "Khi bạn scale out nhanh nhiều replica, deploy lên môi trường bandwidth hẹp, hoặc chạy serverless và edge tính tiền theo dung lượng. Image nhỏ giúp startup nhanh và giảm thời gian phục hồi sự cố."
    }
  ],
  "pitfalls": [
    "Copy thừa source code và build tools sang image cuối nên image vẫn phình",
    "Nhúng secret vào layer builder rồi nghĩ image cuối an toàn, trong khi history vẫn giữ"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được Docker có giữ lại layer trung gian trên disk build và dọn chúng thế nào",
    "Tôi có thể giải thích bằng ví dụ builder install dependencies rồi chỉ copy packages sang image slim",
    "Tôi có thể viết lại một Dockerfile một stage thành hai stage để giảm dung lượng image thực tế"
  ],
  "refs": [
    "docker-multi-stage",
    "dockerfile-ref"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> image production nhỏ, pull và restart nhanh; chi phí cloud giảm khi scale-out; ít vulnerabilities hơn vì ít packages hơn.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> Dockerfile dài hơn với nhiều khối FROM; phải giữ artifact copy giữa các stage; build lâu hơn một chút ở stage đầu.</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> cảnh báo chi phí cloud tăng gấp ba; mỗi lần scale-out phải pull 1.9 GB mất 6 phút; restart sau crash kéo dài 20 phút để khôi phục.</li><li><strong>Cách kiểm chứng nhanh:</strong> chạy docker images để xem dung lượng image production; kiểm tra compiler và git có nằm trong image không; thử pull image trên mạng hẹp và đo thời gian. (xem Bài L16, L02).</li></ul>"
},
{
  "id": "H04",
  "group": "H",
  "topic": "Port, biến môi trường, volume, mạng và Compose",
  "prio": "P1",
  "level": "L2",
  "type": "concept",
  "incident": "<p><strong>Scenario:</strong> Một đội dùng Docker Compose cho môi trường development. Ứng dụng đọc connection string của database từ environment variable, nhưng variable đó chỉ được đặt trong <code>docker-compose.yml</code> ở máy của một người. Ba thành viên khác chạy lên và nhận lỗi kết nối. Ngoài ra, dữ liệu database biến mất sau mỗi lần chạy <code>down</code> vì không có volume, nên mỗi người phải tạo lại dữ liệu mẫu.</p>",
  "askFirst": [
    "Environment variables của một service đến từ những nguồn nào? → Giải mã: Environment variables đến từ ba nguồn: shell trước khi chạy, file compose (environment:), và secret mount. Mỗi nguồn có mức độ tin cậy khác nhau; production nên dùng secret management service (xem Bài L02).",
    "Dữ liệu trong container mất khi nào? → Giải mã: Dữ liệu ghi vào writable layer của container mất khi container bị xóa hoặc recreate. Muốn tồn tại qua vòng đời phải mount volume hoặc push ra database và object storage (xem Bài L05).",
    "Làm sao để một service nói chuyện được với service khác trong Compose? → Giải mã: Compose tạo một network chung, đăng ký tên service như hostname. Service A gọi service B bằng tên b:5432, không phải localhost (xem Bài L12)."
  ],
  "predict": {
    "q": "Hai service trong cùng một file Compose, service A gọi service B qua <code>localhost:5432</code>. Kết nối có thành công không?",
    "a": "<p>Không. Mỗi service chạy trong network namespace riêng, nên <code>localhost</code> bên trong A trỏ tới chính A chứ không tới B. Compose tạo một network chung và đăng ký tên service như hostname, nên A phải gọi <code>b:5432</code>. Đây là lỗi phổ biến nhất khi mới dùng Compose, và nó cũng giải thích một hiện tượng liên quan: khi chạy ứng dụng trực tiếp trên máy host thay vì trong container, <code>localhost</code> lại đúng — nên cùng một connection string có thể chạy được ở chế độ này và hỏng ở chế độ kia.</p>"
  },
  "anchor": "Mỗi container có network namespace riêng nên localhost luôn trỏ về chính nó; muốn gọi service khác phải dùng tên service trên network chung.",
  "attacks": [
    {
      "q": "Khi nào dùng volume, khi nào dùng bind mount?",
      "a": "Bind mount gắn một đường dẫn trên host vào container, nên thay đổi ở host hiện ra ngay trong container — phù hợp cho source code khi development, vì bạn muốn sửa file và thấy kết quả ngay. Volume do Docker quản lý và nằm trong storage của nó, phù hợp cho dữ liệu cần tồn tại qua các lần chạy — database, queue, upload files. Điểm cần nhớ là dữ liệu trong writable layer của container mất khi container bị xóa, nên bất cứ thứ gì bạn muốn giữ đều phải nằm trong volume hoặc bind mount."
    },
    {
      "q": "Làm sao quản lý cấu hình cho nhiều môi trường mà không lặp lại?",
      "a": "Tách cấu hình chung khỏi cấu hình theo môi trường. File Compose chính chứa những gì giống nhau ở mọi nơi, và các file phụ chỉ ghi đè phần khác. Cách hay là dùng <code>docker-compose.override.yml</code> cho dev-specific, và file environment (.env) cho secrets. Trong production, bạn dùng stack hoặc Kubernetes ConfigMap/Secret thay vì file Compose."
    }
  ],
  "q": "Hãy giải thích port mapping, biến môi trường, volume và network trong Docker Compose qua một ví dụ web và database.",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Dùng nguyên connection string localhost:5432 từ máy dev trong container; hoặc lưu dữ liệu database trong writable layer vì tiện và không khai báo volume.</p><p><strong>Vì sao hỏng:</strong> Mỗi service trong Compose chạy trong network namespace riêng nên localhost trỏ về chính nó, phải gọi database bằng tên service db mới tới được. Dữ liệu trong writable layer mất khi recreate; chỉ named volume mới giữ lại qua các lần chạy.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> Compose tạo một network theo project và đăng ký tên service làm hostname; dữ liệu chỉ bền qua vòng đời container khi nằm trong named volume do Docker quản lý, không phải trong writable layer.</p><ul><li><strong>Network namespace:</strong> localhost trong container A không bao giờ là container B; DNS nội bộ của Docker phân giải tên service thành IP container.</li><li><strong>Writable layer:</strong> dữ liệu ghi trong container mất khi xóa; named volume sống độc lập và chỉ mất khi xóa kèm flag volume.</li><li><strong>depends_on không chờ ready:</strong> chỉ đảm bảo thứ tự khởi động, database chưa nhận kết nối vẫn được báo là đã up.</li></ul>",
  "oral": "Port mapping nối cổng máy host với cổng trong container để bạn truy cập từ ngoài. Environment variables truyền config như tên database mà không cần sửa code. Volume lưu dữ liệu ra ngoài vòng đời container nên database không mất khi recreate. Network nội bộ cho các service gọi nhau bằng tên service thay vì IP. Compose gom bốn thứ này vào một file duy nhất để chỉ cần một lệnh là dựng cả stack.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Network namespace</strong>: không gian mạng riêng của container</li><li><strong>Port mapping</strong>: publish cổng host → container</li><li><strong>Named volume</strong>: dữ liệu do Docker quản lý</li><li><strong>depends_on</strong>: thứ tự khởi động, không chờ ready</li></ul><p><strong>Trước Compose:</strong> chạy một stack web và database nghĩa là nhớ IP, sửa connection string tay trên từng môi trường và cầu mong dữ liệu database sống qua recreate. Khi microservice chia nhỏ, <code>localhost</code> trong container không còn chỉ về host, nên team kẹt với connection string đúng trên máy dev nhưng sai trong container.</p><p><strong>Compose gom bốn cơ chế:</strong> mạng project đăng ký tên service như hostname, service khác gọi bằng tên thay vì IP; port mapping nối cổng host và container theo cặp; environment variables truyền config vào process; volume đặt dữ liệu ngoài vòng đời container. Cùng một image chạy được ở dev và production chỉ bằng cách đổi file Compose hoặc environment variables.</p><p><strong>Chỗ vẫn còn sai:</strong> <code>depends_on</code> chỉ bảo đảm thứ tự khởi động container, không chờ database sẵn sàng. Bạn cần thêm cơ chế chờ như vòng lặp kiểm tra port, healthcheck và retry logic trong ứng dụng. Ngoài ra, nếu không mount volume cho database, dữ liệu mất khi <code>docker compose down</code> (trừ khi dùng <code>down -v</code>).</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: Compose tạo network cho project, DNS nội bộ (127.0.0.11) phân giải tên service; port mapping chỉ publish khi có <code>ports:</code>; volume named do Docker quản lý, bind mount gắn host path. Lỗi phổ biến là dùng <code>localhost</code> thay vì tên service, hoặc quên volume cho database.</p><p><strong>Bài học nền tảng liên quan:</strong> Mạng VPC, bảo mật và endpoint chạy trên AWS (xem Bài L04, L12, L19, L21, L23).</p>",
  "code": "services:\n  web:\n    build: .\n    ports:\n      - \"8080:8000\"\n    environment:\n      - DB_HOST=db\n      - DB_NAME=appdb\n    depends_on:\n      - db\n  db:\n    image: postgres:16\n    environment:\n      - POSTGRES_DB=appdb\n      - POSTGRES_PASSWORD=secret123\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:",
  "expected": "Kết quả: docker compose up tạo network bridge tên <tên_thư_mục>_default, tạo named volume <tên_thư_mục>_pgdata, pull postgres:16, build image web rồi khởi động container db trước và web sau theo depends_on; docker compose ps hiện web với PORTS 0.0.0.0:8080->8000/tcp còn db KHÔNG có cột PORTS.\nPhân tích: web nối tới database qua DNS nội bộ của Docker (127.0.0.11) bằng đúng tên service, nên DB_HOST=db phân giải thành IP container db ở port 5432 trong network project; db không publish port nào nên từ host không kết nối được, đúng nguyên tắc không expose database ra ngoài.\nVolume pgdata gắn vào /var/lib/postgresql/data nên dữ liệu nằm ngoài vòng đời container: docker compose down rồi up lại vẫn còn dữ liệu, chỉ docker compose down -v mới xóa volume.\nHai lỗ hổng cần chỉ ra: (1) không có volume cho database nên dữ liệu mất khi recreate; (2) không có healthcheck hoặc wait mechanism nên web có thể khởi động trước db sẵn sàng.</p>",
  "followups": [
    {
      "q": "depends_on có bảo đảm database sẵn sàng nhận kết nối không?",
      "a": "Không. depends_on chỉ bảo đảm thứ tự khởi động container, không chờ database ready. Bạn cần thêm cơ chế chờ như vòng lặp kiểm tra port, healthcheck và retry logic trong ứng dụng."
    },
    {
      "q": "Khi nào dùng named volume thay vì bind mount?",
      "a": "Bạn dùng named volume cho dữ liệu production vì Docker quản lý, dễ backup và move. Bạn dùng bind mount khi dev cần mirror source code trực tiếp để sửa và chạy ngay."
    }
  ],
  "pitfalls": [
    "Mở port database ra ngoài ở production rồi bị scan và attack",
    "Lưu dữ liệu database trong container nên mất hết khi cập nhật image"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được Compose đặt tên network và volume theo project thế nào khi chạy nhiều project song song",
    "Tôi có thể giải thích bằng ví dụ web gọi database qua tên service db trên network Compose mặc định",
    "Tôi có thể dựng một stack web và database bằng Compose với volume bền bỉ cho dữ liệu"
  ],
  "refs": [
    "docker-compose"
  ],
  "say30": "Docker Compose gom bốn cơ chế vào một file. Port mapping mở cổng host để gọi vào container. Biến môi trường truyền cấu hình không ghi cứng vào image. Volume đặt dữ liệu ra ngoài writable layer nên không mất khi recreate. Network của Compose đăng ký tên service làm hostname, nên service này gọi service kia bằng tên, không dùng localhost.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Compose không phải bộ công cụ chạy nhiều container, nó là hợp đồng môi trường: khai báo một lần, mọi dev chạy cùng một mạng, cùng cổng, cùng biến cấu hình, cùng dữ liệu. Nỗi đau cũ là connection string đúng trên máy này mà sai trên máy kia, dữ liệu mất sau mỗi lần down.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Compose tạo một network theo project, đăng ký tên từng service làm hostname. Port mapping 8080:8000 publish cổng host vào cổng container, chỉ dùng khi thật sự cần truy cập từ ngoài. Biến môi trường đặt trong environment của service hoặc file .env, không nhét vào image. Dữ liệu database gắn named volume để Docker quản lý nơi lưu, recreate không mất. depends_on chỉ đảm bảo thứ tự khởi động, không chờ ready, nên ứng dụng phải tự retry hoặc chờ healthcheck.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Volume bền nhưng khó dọn khi đổi schema; biến môi trường tiện nhưng lộ nếu log in ra. Giám sát: kiểm tra các service thấy nhau bằng tên trên network, kiểm tra dữ liệu sống qua docker compose down không kèm volume flag, kiểm tra cổng chỉ mở khi cần. (xem Bài L05, L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> một file duy nhất khai báo mạng, cổng, biến môi trường và volume; mọi developer chạy cùng một stack; dữ liệu database bền qua recreate nhờ named volume.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> volume giữ dữ liệu lâu nên đổi schema hoặc đổi công nghệ đòi kế hoạch dọn; biến môi trường trong file plaintext bị lộ nếu log in ra; network riêng của Compose khiến service gọi localhost bị hiểu nhầm là chính nó chứ không phải service khác. (xem Bài L05, L18).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Chạy database ở ngoài (host hoặc dịch vụ quản lý):</strong> hợp khi database cần sống độc lập, được backup tự động và dùng chung nhiều ứng dụng; đổi lại dev phải tự quản lý hai tiến trình.</li><li><strong>Phương án B — Kubernetes Helm Chart:</strong> hợp khi đã qua giai đoạn một máy dev, cần nhiều môi trường và chạy trên cluster; chi phí phức tạp tăng gấp bội so với một file Compose. (xem Bài L21, L23).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log kết nối database thất bại với host là localhost thay vì tên service; dung lượng volume tăng đều mà container được recreate thường xuyên; cổng publish bị chặn khiến client ngoài gọi không vào.</li><li><strong>Cách kiểm chứng nhanh:</strong> chạy docker compose ps để xem trạng thái từng service; vào shell container rồi gọi dịch vụ khác bằng tên service trên network; kiểm tra dữ liệu còn không sau khi chạy down không kèm volume flag. (xem Bài L05, L22).</li></ul>"
},
{
  "id": "H05",
  "group": "H",
  "topic": "Chạy non-root, secret và healthcheck",
  "prio": "P1",
  "level": "L2",
  "type": "concept",
  "incident": "<p><strong>Scenario:</strong> Một container chạy ứng dụng bằng user root. Một vulnerability trong thư viện xử lý ảnh cho phép thực thi code, và attacker có toàn quyền trong container, bao gồm khả năng ghi vào thư mục hệ thống và đọc các environment variables chứa API key. Ngoài ra, một service khác bị đánh dấu là đang chạy khoẻ trong khi thực tế tiến trình chính đã chết từ lâu nhưng một tiến trình con vẫn giữ container sống.</p>",
  "askFirst": [
    "Vì sao chạy bằng user non-root lại quan trọng? → Giải mã: Chạy non-root hạn chế thiệt hại khi vulnerability trong thư viện bị khai thác: attacker không tự nâng quyền lên root, không ghi hệ thống tệp, không đọc secret nếu không được cấp (xem Bài L02).",
    "Healthcheck kiểm tra cái gì, và khác gì việc container còn chạy? → Giải mã: Healthcheck chủ động gọi endpoint thật; chỉ khi probe fail thì orchestration đánh dấu unhealthy và rút khỏi load balancer. Docker standalone không tự restart vì healthcheck fail (xem Bài L14).",
    "API key nên đến từ đâu? → Giải mã: API key không nên ghi cứng vào image hay environment variables (dễ lộ qua log, process dump). Cách an toàn là secret management service hoặc secret file gắn lúc chạy, có rotation (xem Bài L14)."
  ],
  "predict": {
    "q": "Một container có PID 1 là shell hoặc supervisor vẫn sống, còn tiến trình worker con đã chết hoặc treo. Docker báo trạng thái gì, và khi nào container thật sự dừng?",
    "a": "<p>Docker vẫn báo container đang chạy, vì nó chỉ theo dõi PID 1, không theo dõi cây tiến trình con. Khi PID 1 thoát thì ngược lại: kernel gửi SIGKILL tới mọi tiến trình còn lại trong PID namespace và container dừng. Đây là lý do một healthcheck thật sự cần thiết: nó chủ động gọi vào ứng dụng để kiểm tra khả năng phục vụ, chứ không chỉ hỏi container còn tồn tại hay không. Điều này cũng liên quan tới việc dùng dạng exec cho lệnh khởi động, vì nếu dùng dạng shell thì tiến trình chính là shell và tín hiệu dừng không tới được ứng dụng.</p>"
  },
  "anchor": "Docker chỉ theo dõi tiến trình số một, nên \"container đang chạy\" không có nghĩa ứng dụng đang serve được — cần healthcheck thật.",
  "attacks": [
    {
      "q": "Healthcheck nên kiểm tra gì?",
      "a": "Nên kiểm tra khả năng phục vụ thật, ở mức đủ nhẹ để gọi thường xuyên. Với một API, một endpoint trả về nhanh và xác nhận rằng tiến trình còn xử lý được request là đủ. Cần cân nhắc có nên kiểm tra cả dependencies: kiểm tra database trong healthcheck giúp phát hiện sớm nhưng cũng có thể làm toàn bộ container bị đánh dấu hỏng chỉ vì một dependency tạm thời, khiến hệ thống tự attack chính mình. Cách phổ biến là tách hai mức: một kiểm tra nhẹ cho vòng đời container, và một kiểm tra sâu hơn cho alert."
    },
    {
      "q": "Ngoài chạy non-root, còn gì cần làm để giảm thiệt hại khi bị chiếm container?",
      "a": "Bốn việc có giá trị cao. Một là dùng read-only file system ở nơi có thể, và chỉ mở ghi ở những thư mục thật sự cần. Hai là limit memory và CPU bằng cgroup để ngăn resource exhaustion. Ba là audit image định kỳ tìm vulnerabilities. Bốn là use minimal base image (alpine, slim) để giảm attack surface. Kết hợp non-root, read-only, và limited resources, bạn giảm được rủi ro khi một container bị compromise."
    }
  ],
  "q": "Vì sao bạn nên chạy container dưới user non-root, quản lý secret riêng và thêm healthcheck?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Chấp nhận container chạy root vì đơn giản, ghi API key thẳng vào environment variable, rồi coi container còn chạy là dịch vụ đang khỏe.</p><p><strong>Vì sao hỏng:</strong> User root biến một vulnerability trong thư viện thành privilege escalation toàn container và đọc được secret trong biến môi trường. Docker chỉ theo dõi PID 1 nên worker chết mà container vẫn báo Up, service treo không được phát hiện.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> container chạy với quyền của user khai trong Dockerfile, và Docker chỉ giám sát PID 1 chứ không giám sát cây tiến trình con; secret trong image hoặc biến môi trường lộ qua log và process dump.</p><ul><li><strong>Privilege escalation:</strong> user root trong container cho attacker toàn quyền ghi hệ thống tệp khi một library bị khai thác.</li><li><strong>PID 1 theo dõi hạn chế:</strong> tiến trình con chết mà PID 1 sống thì Docker không đánh dấu unhealthy, cần healthcheck gọi endpoint thật để orchestrator thay instance.</li><li><strong>Secret trong layer hoặc env:</strong> ghi vào image push registry chung thì lộ; secret file gắn lúc chạy hoặc secret management service an toàn hơn.</li></ul>",
  "oral": "Mặc định process trong container thường chạy dưới quyền root, nên nếu attacker thoát được ra ngoài thì hậu quả rất nặng. Tạo user riêng và chuyển sang USER non-root giúp giảm privilege. Secret như mật khẩu không nên ghi cứng vào image hay environment variables dễ lộ, mà nên truyền lúc chạy qua file hoặc secret management service. Healthcheck giúp orchestration như Swarm hay Kubernetes biết container còn serve thật hay chỉ còn process treo, để rút khỏi load balancer hoặc restart. Docker standalone không tự restart chỉ vì healthcheck chuyển sang unhealthy.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Privilege escalation</strong>: nâng quyền khi có lỗ hổng</li><li><strong>Read-only rootfs</strong>: ngăn ghi vào hệ thống tệp</li><li><strong>Healthcheck</strong>: probe chủ động khả năng phục vụ</li><li><strong>Liveness/Readiness/Startup probe</strong>: ba loại probe trong Kubernetes</li></ul><p><strong>Vấn đề root:</strong> Container mặc định chạy root, nên một vulnerability trong thư viện xử lý ảnh thành privilege escalation toàn bộ container, và attacker đọc ngay environment variables chứa API key. Thói quen cũ là chấp nhận root vì đơn giản.</p><p><strong>Đáp án ba lớp:</strong> <code>USER appuser</code> trong Dockerfile hạ privilege; secret gắn lúc chạy dưới dạng file chỉ đọc hoặc từ secret management service, không ghi cứng vào image; <code>HEALTHCHECK</code> định kỳ xác nhận ứng dụng còn serve thật. Docker chỉ theo dõi PID 1: nếu process con chết hoặc treo trong khi PID 1 vẫn sống, container vẫn báo running. Ngược lại, khi PID 1 thoát, kernel dừng toàn bộ process trong namespace.</p><p><strong>Healthcheck thực tế:</strong> Lần kiểm tra đầu chạy sau một <code>interval</code> (không phải ngay khi container chạy), sau đó mỗi interval. Dùng <code>start_period</code> để cho ứng dụng thời gian khởi động trước khi đánh dấu unhealthy. Với API, gọi endpoint /healthz trả 200 là đủ; không nên check database trong healthcheck của container vì sẽ cascade failure. Trong Kubernetes, liveness probe gọi /healthz, readiness probe gọi /ready (có thể check dependency), và startup probe cho ứng dụng khởi động chậm.</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: USER trong Dockerfile hạ privilege; secret không ghi vào image (nằm trong history); healthcheck check thực tế serve, không chỉ process tồn tại. Lỗi phổ biến là chạy root, ghi secret vào environment variables, và healthcheck quá sâu (check database) làm cascade failure.</p><p><strong>Bài học nền tảng liên quan:</strong> Quản lý bí mật, IAM role và execution (xem Bài L02, L04, L14, L20).</p>",
  "code": "FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nRUN useradd -m appuser && chown -R appuser:appuser /app\nUSER appuser\nEXPOSE 8000\nHEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD python -c \"import socket; socket.create_connection((\\\"127.0.0.1\\\", 8000), timeout=2)\"\nCMD [\"python\", \"app.py\"]",
  "expected": "Kết quả: image có thêm user appuser; tiến trình chính (CMD dạng exec) chạy dưới appuser chứ không phải root, nên docker exec web id trả về uid khác 0 (useradd -m cấp UID tự động, thường 1000 trên base slim, nhưng nên chốt bằng -u để ổn định khi dùng volume); /app thuộc appuser:appuser vì chown chạy trước USER, tức vẫn do root thực hiện. EXPOSE 8000 chỉ là metadata tài liệu chứ không tự mở port, phải docker run -p 8080:8000 mới truy cập được từ host; EXPOSE chỉ ảnh hưởng tới docker run -P ánh xạ port ngẫu nhiên. Phân tích healthcheck: chỉ thị ở dạng shell form nên Docker chạy nó qua /bin/sh -c, và cặp nháy kép bọc code Python phải được escape trong Dockerfile; thực chất lệnh chạy python -c tạo một kết nối TCP tới 127.0.0.1:8000 với timeout 2 giây, …",
  "followups": [
    {
      "q": "Secret trong environment variables có an toàn không?",
      "a": "Không hoàn toàn. Environment variables dễ lộ qua admin interface, process dump file và log. Với dữ liệu thật sự nhạy cảm, bạn nên dùng secret file gắn lúc chạy hoặc secret management service có rotation và phân quyền."
    },
    {
      "q": "Healthcheck trong Dockerfile khác gì kiểm tra của orchestration?",
      "a": "Healthcheck của Docker chỉ phản ánh trạng thái container trên một máy. Orchestration cần thêm kiểm tra mức service để điều phối traffic, restart và roll version. Bạn nên giữ hai lớp này nhất quán nhưng không thay thế nhau."
    }
  ],
  "pitfalls": [
    "Chạy root ở production nên một vulnerability nhỏ thành chiếm quyền toàn bộ",
    "Ghi cứng mật khẩu vào image rồi push lên registry chung"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được sự khác nhau giữa quyền user trong container và quyền trên host khi dùng volume",
    "Tôi có thể giải thích bằng ví dụ Dockerfile tạo user riêng và healthcheck port service",
    "Tôi có thể cấu hình lại một image đang chạy root thành non-root mà ứng dụng vẫn ghi được file cần thiết"
  ],
  "refs": [
    "docker-security",
    "dockerfile-ref"
  ],
  "say30": "Container mặc định chạy user root nên một lỗ hổng trong thư viện thành quyền toàn bộ container. Bạn chạy USER appuser trong Dockerfile, gắn secret dạng file chỉ đọc lúc chạy thay vì ghi cứng vào image, và bật HEALTHCHECK gọi endpoint thật. Orchestrator theo dõi kết quả probe để biết service còn phục vụ được, không chỉ nhìn process còn sống.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Root trong container nghĩa là attacker thoát được qua một library bị khai thác thì cầm luôn toàn bộ host và đọc ngay environment variables chứa API key. Healthcheck thì bị hiểu nhầm: container còn chạy không có nghĩa service còn phục vụ, process treo vẫn có mã process, port vẫn mở.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Ba lớp an toàn. Một, USER appuser trong Dockerfile hạ privilege, kèm read-only rootfs khi muốn chặt hơn. Hai, secret gắn lúc chạy dưới dạng file chỉ đọc hoặc từ secret management service, không ghi cứng vào layer image vì image bị push lên registry chung. Ba, HEALTHCHECK gọi endpoint thật theo chu kỳ; Kubernetes có ba probe riêng: liveness, readiness, startup.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Non-root làm tăng ma sát build vì mỗi thư viện phải cho user đọc được; healthcheck gọi endpoint thật thì tốn request và cần endpoint rẻ. Giám sát: số lần probe fail liên tiếp, log quyền file secret, và kích thước image để phát hiện secret bị nhét vào layer. (xem Bài L02, L05).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> non-root chặn privilege escalation; secret dạng file chỉ đọc không lộ trong log process; healthcheck tách trạng thái sống của process khỏi khả năng phục vụ, orchestrator tự thay instance treo.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> non-root đòi kiểm tra quyền thư viện và thư mục; secret management thêm một tầng dịch vụ; healthcheck gọi endpoint thật tốn request và phải chọn path đủ rẻ. (xem Bài L02, L23).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Giữ root nhưng thêm AppArmor hoặc seccomp:</strong> hợp khi legacy app không sửa được user; đổi lại phải tự quản lý profile cho mỗi service.</li><li><strong>Phương án B — Sidecar kiểm tra thay vì healthcheck endpoint thật:</strong> hợp khi endpoint quá đắt; đổi lại mất thông tin khả năng phục vụ thật. (xem Bài L03, L23).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log báo permission denied khi user không đọc được thư viện; số lần probe fail liên tiếp; container bị restart nhiều lần trong giờ; image mới push có kích thước lớn bất thường.</li><li><strong>Cách kiểm chứng nhanh:</strong> chạy docker exec với user của container rồi kiểm tra đọc thư mục; kiểm tra image đã nhét secret bằng cách scan layer; giả lập probe fail và xem orchestrator có thay instance. (xem Bài L02, L23).</li></ul>"
},
{
  "id": "H06",
  "group": "H",
  "topic": "Tín hiệu và graceful shutdown với PID 1",
  "prio": "P0",
  "level": "L3",
  "type": "debug",
  "attacks": [
    {
      "q": "Vì sao dạng shell cho lệnh khởi động lại làm hỏng việc dừng êm?",
      "a": "Vì khi đó tiến trình có mã một trong container là shell, không phải ứng dụng. Tín hiệu dừng được gửi tới tiến trình một, tức là shell, và shell không forward tín hiệu đó cho process con. Ứng dụng không bao giờ nhận được yêu cầu dừng, nên nó không có cơ hội hoàn tất request đang xử lý, đóng connection, hay ghi nốt dữ liệu đang buffered. Sau thời gian chờ, hệ thống gửi tín hiệu buộc dừng và ứng dụng bị cắt giữa chừng. Dạng exec thay thế shell bằng chính ứng dụng, nên tín hiệu tới đúng nơi cần tới."
    },
    {
      "q": "Nếu ứng dụng cần dọn dẹp lâu hơn thời gian chờ mặc định thì sao?",
      "a": "Phải tăng thời gian chờ trước khi buộc dừng, và đồng thời làm cho việc dọn dẹp nhanh hơn. Hai việc này không thay thế nhau: tăng timeout cho đủ thời gian, nhưng cũng tối ưu cleanup để không cần timeout quá dài. Trong Kubernetes, bạn có terminationGracePeriodSeconds (mặc định 30s), và process có SIGTERM handler phải hoàn tất trong thời gian đó. Nếu không, kernel gửi SIGKILL và dữ liệu có thể mất."
    }
  ],
  "incident": "<p><strong>Scenario:</strong> Deploy lúc 9h00 mỗi ngày mất 10 giây. SRE D mở log: <code>Stopping container api-3 ... timeout</code>, rồi Docker gửi <code>SIGKILL</code>. Ứng dụng đã cài handler <code>SIGTERM</code> nhưng log không thấy handler chạy. Một request thanh toán đang xử lý bị giết giữa chừng, khách hàng bị trừ tiền hai lần.</p>",
  "askFirst": [
    "Vì sao handler SIGTERM đã cài mà tín hiệu vẫn không tới được ứng dụng? → Giải mã: Handler SIGTERM chỉ chạy nếu ứng dụng là PID 1 (exec form) hoặc có init forward tín hiệu. Dạng shell form khiến /bin/sh -c giữ PID 1, SIGTERM dừng ở shell, không tới Python (xem Bài L07).",
    "Tiến trình nào là PID 1 trong container này? → Giải mã: PID 1 là tiến trình Docker chạy trước tiên: shell form là /bin/sh -c, exec form là ứng dụng. Kiểm tra bằng docker exec và xem /proc/1/comm (xem Bài L16)."
  ],
  "predict": {
    "q": "Bạn đoán ai là PID 1 khi dùng CMD shell form (CMD python app.py) và ai nhận SIGTERM?",
    "a": "<p>Docker chạy <code>/bin/sh -c</code> làm PID 1, ứng dụng Python chỉ là process con. Shell giữ PID 1 nên SIGTERM dừng ở shell và không tới Python; handler trong Python không bao giờ chạy. Vì hành vi phụ thuộc shell và cách viết, exec form là cách chắc chắn. Sau timeout Docker gửi SIGKILL, request đang xử lý bị mất.</p>"
  },
  "anchor": "Container khởi động bằng shell form mà không có exec form hay init = SIGTERM kẹt ở PID 1 shell và ứng dụng bị SIGKILL giữa chừng.",
  "q": "Container dưới đây dừng rất chậm và mất 10 giây mỗi lần deploy, dù ứng dụng đã bắt SIGTERM. Lỗi nằm ở đâu và sửa thế nào?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Cài handler SIGTERM trong ứng dụng rồi kết luận container sẽ dừng êm, trong khi Dockerfile viết CMD shell form. Cách khác là tăng timeout dừng mà không sửa PID 1.</p><p><strong>Vì sao hỏng:</strong> Shell form đặt /bin/sh -c làm PID 1, SIGTERM dừng ở shell và không tới Python, handler không chạy. Docker chờ đủ timeout rồi gửi SIGKILL, request đang xử lý bị giết giữa chừng.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> Docker chỉ gửi tín hiệu tới PID 1 trong PID namespace; dạng shell chèn thêm lớp /bin/sh -c không forward tín hiệu cho process con, nên handler trong ứng dụng không bao giờ nhận.</p><ul><li><strong>Shell form giữ PID 1:</strong> CMD dạng shell chạy /bin/sh -c làm tiến trình chính, SIGTERM không tới ứng dụng mà dừng ở shell.</li><li><strong>Exec form hoặc init:</strong> CMD dạng exec đặt ứng dụng làm PID 1 nhận tín hiệu trực tiếp; init như tini forward tín hiệu và gặt zombie khi ứng dụng sinh nhiều process con.</li><li><strong>Timeout trước SIGKILL:</strong> handler chưa kịp hoàn tất request và ghi dữ liệu thì kernel gửi SIGKILL, dữ liệu có thể mất.</li></ul>",
  "oral": "Vấn đề nằm ở PID 1. Container này khởi động bằng shell bọc ngoài; khi shell giữ PID 1, SIGTERM dừng ở shell và không tới Python, nên ứng dụng không có cơ hội hoàn tất việc đang làm. Sau thời gian chờ, Docker gửi SIGKILL để cưỡng bức dừng. Cách sửa là chạy ứng dụng trực tiếp dưới dạng exec form để nó thành PID 1, hoặc thêm tiến trình init nhỏ làm PID 1 để forward tín hiệu và reap process con.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>PID 1</strong>: tiến trình gốc trong PID namespace</li><li><strong>Exec form</strong>: CMD trực tiếp binary, không qua shell</li><li><strong>Init (tini, s6)</strong>: forward tín hiệu, gặt zombie</li><li><strong>terminationGracePeriodSeconds</strong>: thời gian cho SIGTERM trước SIGKILL</li></ul><p><strong>Nhận biết:</strong> Mỗi deploy mất 10 giây chờ timeout, log chỉ hiện <code>Stopping container ... timeout</code> rồi <code>SIGKILL</code>. Ứng dụng đã cài handler SIGTERM nhưng handler không bao giờ chạy.</p><p><strong>Cơ chế:</strong> Container trước có init system ngoài kernel lo forward tín hiệu và reap zombie; container thì khác, Docker chỉ gửi tín hiệu tới PID 1. Ở dạng shell, Docker chạy <code>/bin/sh -c</code>; khi shell giữ PID 1, SIGTERM dừng ở shell và không tới Python. Kiểm tra <code>/proc/1/cmdline</code> để xem tiến trình nào đang là PID 1 trước khi kết luận.</p><p><strong>Sửa:</strong> bằng exec form <code>CMD [\"python\", \"app.py\"]</code> để Python thành PID 1, hoặc thêm init như tini để forward tín hiệu và reap zombie. Graceful shutdown là ngừng nhận việc mới, hoàn tất việc đang làm, đóng connection, và commit dữ liệu. Bạn cần đặt timeout dừng đủ dài (thường 30-60s) để process có thời gian hoàn tất, và nếu vượt quá thì SIGKILL cắt giữa chừng.</p><p><strong>Trong Kubernetes:</strong> terminationGracePeriodSeconds mặc định 30s. Process phải: (1) ngừng nhận traffic mới (readiness probe fail); (2) hoàn tất request hiện tại; (3) đóng connection; (4) commit dữ liệu. Nếu vượt 30s, kernel gửi SIGKILL. Bạn có thể tăng terminationGracePeriodSeconds nhưng không nên quá 60s vì sẽ kéo dài rolling update.</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: shell form làm shell thành PID 1 và SIGTERM kẹt; exec form làm ứng dụng thành PID 1; init như tini forward tín hiệu và reap zombie. Lỗi phổ biến là dùng shell form mà không biết, hoặc đặt timeout quá ngắn làm process bị SIGKILL giữa chừng.</p><p><strong>Bài học nền tảng liên quan:</strong> Xử lý request lifecycle trong FastAPI và vòng đời container (xem Bài L07, L08, L11, L16).</p>",
  "code": "FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD python app.py",
  "expected": "Container dừng chậm vì CMD ở dạng shell không bảo đảm Python là PID 1. Docker chạy /bin/sh -c; nếu shell giữ PID 1, SIGTERM dừng ở shell và không tới Python, Docker chờ hết timeout rồi gửi SIGKILL. Sửa bằng CMD dạng exec [\"python\", \"app.py\"] để Python thành PID 1, hoặc thêm init làm PID 1 để forward tín hiệu và reap zombie.",
  "followups": [
    {
      "q": "Exec form khác shell form ở điểm nào?",
      "a": "Exec form chạy trực tiếp binary thành PID 1 và nhận tín hiệu trực tiếp. Shell form chèn thêm lớp shell ở giữa, tín hiệu dừng ở shell và không tới ứng dụng. Vì vậy production nên dùng exec form cho cả ENTRYPOINT và CMD."
    },
    {
      "q": "Khi nào bạn cần thêm init như tini?",
      "a": "Khi ứng dụng sinh nhiều process con hoặc bạn chưa kiểm soát được PID 1. Init nhẹ sẽ forward tín hiệu, reap process con đã kết thúc và tránh zombie, giúp shutdown sạch hơn."
    },
    {
      "q": "Nếu sửa PID 1 rồi mà deploy vẫn mất request thì kiểm tra gì tiếp?",
      "a": "Bạn kiểm tra handler SIGTERM có đóng port nhận việc mới, chờ request hiện tại xong và đặt timeout dừng đủ dài không. Bạn cũng kiểm tra orchestration có rút endpoint khỏi load balancer trước khi gửi SIGTERM hay không."
    }
  ],
  "pitfalls": [
    "Chỉ thêm handler SIGTERM mà không kiểm tra PID 1 nên tín hiệu không bao giờ tới",
    "Đặt timeout dừng quá ngắn khiến worker bị giết giữa chừng và mất dữ liệu"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được init thu dọn process zombie bằng cơ chế wait process con thế nào",
    "Tôi có thể giải thích bằng ví dụ CMD shell form bị SIGTERM kẹt và CMD exec form dừng êm",
    "Tôi có thể kiểm tra PID 1 trong một container thật và sửa Dockerfile để deploy không còn chờ đủ timeout"
  ],
  "refs": [
    "signal-man",
    "dockerfile-ref"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> deploy dừng đúng thời gian không chờ hết timeout; request đang xử lý được hoàn tất trước khi tiến trình tắt; zombie process được gặt.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> exec form mất tiện ích shell như pipeline và biến môi trường; thêm init làm tăng một tiến trình trong container. (xem Bài L07, L16).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log hiện Stopping container timeout rồi SIGKILL mỗi lần deploy; thời gian deploy dài cố định; request bị xử lý dở bị giết giữa chừng.</li><li><strong>Cách kiểm chứng nhanh:</strong> xem /proc/1/comm trong container để xác định PID 1; thay CMD shell form bằng exec form rồi đo lại thời gian dừng; giả lập request dài và kiểm tra handler có chạy hay không. (xem Bài L07, L16).</li></ul>"
},
{
  "id": "H07",
  "group": "H",
  "topic": "Pipeline CI/CD và quản lý artifact",
  "prio": "P1",
  "level": "L2",
  "type": "concept",
  "incident": "<p><strong>Scenario:</strong> Pipeline deploy build image trong mỗi lần chạy và gắn thẻ <code>latest</code>. Một lần rollback khẩn cấp, team chạy lại pipeline của version trước, nhưng pipeline đó build từ nhánh chính hiện tại nên tạo ra một image khác với image đã chạy hôm qua. Việc rollback không đưa hệ thống về trạng thái cũ. Ngoài ra, không ai biết chính xác commit nào đang chạy trên production.</p>",
  "askFirst": [
    "Vì sao gắn thẻ latest làm rollback không đáng tin? → Giải mã: Tag latest bị ghi đè mỗi lần push, không còn điểm neo để quay về. Tag theo commit SHA (bất biến) thì rollback chỉ là deploy lại đúng digest đã biết (xem Bài L22).",
    "Artifact nên được tạo ở bước nào và dùng lại thế nào? → Giải mã: Artifact tạo ở bước build, đẩy lên registry; bước deploy chỉ tham chiếu tag hoặc digest. Không build lại ở deploy để staging và production chạy đúng bản đã kiểm thử (xem Bài L10).",
    "Làm sao biết chính xác version nào đang chạy? → Giải mã: Ghi lại digest sha256 mà registry trả về sau push; hệ thống deploy lưu digest đang chạy. Kiểm tra image nào chạy từ commit nào bằng digest (xem Bài L17)."
  ],
  "predict": {
    "q": "Một pipeline build image rồi deploy ngay trong cùng một lần chạy. Muốn rollback về version trước, bạn cần gì?",
    "a": "<p>Bạn cần image của version trước vẫn còn tồn tại và định danh được. Nếu image chỉ có thẻ <code>latest</code>, nó đã bị ghi đè và bản cũ có thể đã bị xóa khỏi registry. Cách làm đúng là mỗi lần build tạo ra một artifact bất biến được định danh bằng commit hash, đẩy lên registry, và bước deploy chỉ tham chiếu tới định danh đó. Khi đó rollback chỉ là deploy lại một định danh đã có, không cần build lại gì, nên nó nhanh và cho đúng cùng một image như lần trước.</p>"
  },
  "anchor": "Rollback chỉ đáng tin khi artifact là bất biến và được định danh — build lại từ source là tạo ra một version mới chứ không phải quay về bản cũ.",
  "attacks": [
    {
      "q": "Build và deploy nên tách thành hai bước như thế nào?",
      "a": "Bước build tạo artifact một lần cho mỗi commit, đẩy lên registry, và không chạm tới môi trường nào. Bước deploy chỉ lấy một artifact đã tồn tại và đưa nó vào môi trường, không build gì cả. Lợi ích là artifact được kiểm thử ở staging chính là artifact chạy trên production, nên loại bỏ được cả một lớp khác biệt giữa hai môi trường. Nó cũng cho phép deploy cùng một artifact cho nhiều môi trường và rollback bằng cách chọn một định danh cũ."
    },
    {
      "q": "Secret trong CI nên được xử lý thế nào?",
      "a": "Ưu tiên trao đổi danh tính tạm thời thay vì lưu khóa dài hạn: pipeline nhận một danh tính ngắn hạn từ nhà cung cấp CI và dùng nó để lấy quyền truy cập, nên không có khóa nào tồn tại lâu để bị đánh cắp. Thứ hai, secret nên được phân quyền theo môi trường: pipeline dev không nên có quyền deploy production. Thứ ba, audit log mọi lần dùng secret để truy vết ai đã làm gì."
    }
  ],
  "q": "Hãy thiết kế một pipeline lint, test, build rồi deploy cho ứng dụng Docker, kèm cách đánh version artifact.",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Gắn tag latest cho mọi build và deploy theo tag latest; rollback bằng cách chạy lại pipeline để build lại image từ source hiện tại.</p><p><strong>Vì sao hỏng:</strong> Tag latest bị ghi đè mỗi lần push nên không còn điểm neo để quay về. Build lại từ source hiện tại tạo ra image khác với image đã chạy hôm qua, nên rollback không đưa hệ thống về trạng thái cũ.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> artifact phải là bất biến và được định danh để bước deploy chỉ tham chiếu, không build; tag mutable phá đúng tính bất biến đó và xóa mất provenance từ commit đến image.</p><ul><li><strong>Tag latest ghi đè:</strong> mỗi push ghi đè tag cũ nên không thể quay về đúng digest đã kiểm thử ở staging.</li><li><strong>Build và deploy tách:</strong> build một lần theo commit SHA và push registry bật immutability; deploy và rollback cùng trỏ digest, không build lại.</li><li><strong>Secret trong pipeline:</strong> dùng danh tính tạm thời thay access key dài hạn, phân quyền theo môi trường và audit log mọi lần dùng.</li></ul>",
  "oral": "Pipeline nên chia bốn chặng rõ ràng. Lint và format chạy đầu để chặn lỗi rẻ nhất. Test đơn vị và tích hợp chạy tiếp trên môi trường sạch. Build image chỉ chạy khi test đã qua, gắn tag theo commit và build number để trace. Deploy lấy đúng image đã kiểm thử theo tag bất biến, deploy từng phần và có health check sau deploy. Mỗi image và log pipeline đều lưu lại để khi lỗi bạn biết đúng bản nào đang chạy và quay lại được.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Artifact bất biến</strong>: build một lần, định danh bằng commit SHA</li><li><strong>Image tag immutability</strong>: tag không bị ghi đè</li><li><strong>Staging</strong>: môi trường kiểm thử trước production</li><li><strong>Provenance</strong>: truy vết image build từ commit nào</li></ul><p><strong>Trước CI:</strong> release là dev kéo tar lên FTP rồi SSH chạy lệnh, không ai biết chính xác build nào đang chạy. Khi microservice tăng và deploy liên tục, việc build lại từ source hiện tại khiến tag <code>latest</code> bị ghi đè và rollback thành việc đoán.</p><p><strong>Áp lực là traceability.</strong> Pipeline chia bốn chặng: <code>lint</code>, <code>test</code>, <code>build</code>, <code>deploy</code>. Lint chặn lỗi rẻ nhất; test xác minh hành vi; build đóng gói image và push lên registry; deploy chỉ lấy đúng image đã kiểm thử. Mỗi image được định danh bằng commit hash; trên ECR bật image tag immutability, tag theo commit SHA không bị ghi đè, và deploy trỏ vào digest <code>sha256:...</code> mà registry trả về.</p><p><strong>Chỗ vẫn còn sai:</strong> pipeline không có <code>docker login</code> nên <code>docker push</code> thất bại; hoặc không bật image tag immutability nên tag bị ghi đè; hoặc build lại image ở mỗi step thay vì build một lần và dùng lại. Bạn cần: (1) login vào registry; (2) bật immutability; (3) build một artifact, deploy nhiều lần.</p><p><strong>Versioning tốt:</strong> tag theo commit SHA (chính xác, bất biến) + build number (dễ đọc) + timestamp (truy vết thời gian). Ví dụ: <code>app:abc1234-142-20261014T0930</code>. Trong GitHub Actions, bạn có thể dùng <code>GITHUB_SHA</code> (commit) và <code>GITHUB_RUN_ID</code> (build number). Khi deploy, orchestration giữ digest của image đang chạy, rollback chỉ đổi lại digest cũ.</p><p><strong>Interview checklist:</strong> người phỏng vấn cần nói được: pipeline 4 chặng lint/test/build/deploy; build một lần, deploy nhiều lần; tag bất biến theo commit; rollback bằng digest. Lỗi phổ biến là build lại ở mỗi step, không login registry, hoặc dùng tag latest.</p><p><strong>Bài học nền tảng liên quan:</strong> CI/CD và promote artifact bất biến (xem Bài L10, L17, L22, L23).</p>",
  "code": "name: service-pipeline\non:\n  push:\n    branches: [main]\njobs:\n  lint-test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: pip install -r requirements.txt\n      - run: ruff check .\n      - run: pytest -q\n  build-push:\n    needs: lint-test\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: docker build -t registry/app:1.4.0 .\n      - run: docker push registry/app:1.4.0",
  "expected": "Kết quả: chỉ push lên nhánh main mới kích hoạt pipeline, còn PR, push nhánh khác và push tag đều không chạy, nên PR không được kiểm tra trước khi merge.\nHai job chạy trên hai runner ubuntu-latest SẠCH và TÁCH BIỆT, không chia sẻ filesystem; build-push có needs: lint-test nên chỉ chạy khi lint-test thành công, còn nếu ruff check hoặc pytest trả exit code khác 0 thì job lint-test đỏ và build-push bị bỏ qua (skipped), không image nào được đẩy.\nArtifact của pipeline là image Docker registry/app:1.4.0 trong registry, cộng với log và metadata của run; digest sha256 của image mới là định danh bất biến để truy vết.\nCác lỗ hổng thực tế cần chỉ ra, mỗi cái một dòng riêng:\nLỗ hổng thứ nhất: không có bước docker login nên docker push lên registry riêng sẽ thất bại…",
  "followups": [
    {
      "q": "Vì sao phải build một lần và deploy cùng image đó?",
      "a": "Vì build lại có thể kéo package mới hoặc khác cache nên bản chạy khác bản đã test. Build một lần rồi promotion cùng tag bất biến giúp staging và production chạy đúng thứ đã kiểm thử."
    },
    {
      "q": "Bạn đặt secret và phê duyệt production thế nào?",
      "a": "Bạn lưu secret trong secret vault của CI theo môi trường, không ghi vào file pipeline. Bạn thêm bước phê duyệt tay, giới hạn ai được duyệt deploy production và ghi lại ai đã duyệt bản nào."
    }
  ],
  "pitfalls": [
    "Deploy tag latest nên khi lỗi không biết quay về bản nào",
    "Bỏ qua test ở nhánh nóng rồi deploy thẳng production"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được cách lưu provenance để chứng minh image production được build từ commit nào",
    "Tôi có thể giải thích bằng ví dụ pipeline lint rồi test rồi mới build và push tag theo commit",
    "Tôi có thể dựng một pipeline tối thiểu chặn merge khi lint hoặc test đỏ"
  ],
  "refs": [
    "gh-actions",
    "docker-multi-stage"
  ],
  "say30": "Pipeline chuẩn chia bốn chặng: lint, test, build, deploy. Lint chặn lỗi rẻ nhất, test xác minh hành vi, build đóng gói image và đẩy lên registry, deploy chỉ tham chiếu tag đã build. Tag theo commit SHA không dùng latest, bật immutability trên registry để tag không bị ghi đè. Rollback là deploy lại đúng tag cũ, không build lại.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Release thủ công bằng tar và SSH nghĩa là không ai biết build nào đang chạy. Khi tag latest bị ghi đè mỗi lần push, rollback thành đoán mò. Áp lực thật là traceability: phải nói được chính xác image nào, build từ commit nào, đang chạy trên production.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Pipeline bốn chặng chạy theo thứ tự. Lint chạy đầu vì rẻ nhất. Test chạy trên môi trường sạch. Build đóng gói image và push lên registry với tag là commit SHA. Deploy tham chiếu đúng tag đó, không build lại từ source. Bật image tag immutability trên registry để tag không bị ghi đè. Staging là môi trường chạy lại cùng pipeline trước khi lên production.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Bốn chặng làm pipeline chậm thêm vài phút; immutability đòi registry hỗ trợ và tag dài. Giám sát: mỗi deploy ghi lại tag và commit SHA; kiểm tra staging và production chạy cùng artifact; số lần build thất bại theo chặng. (xem Bài L06, L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> artifact bất biến build một lần dùng lại; rollback là chỉ định lại tag cũ; provenance rõ ràng từ commit đến image; deploy staging và production dùng cùng artifact nên không lệch.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> pipeline dài thêm vài phút; registry phải bật immutability; tag commit SHA dài và không đọc được như v1.2. (xem Bài L06, L22).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Build lại từ source mỗi lần deploy:</strong> hợp khi repo thay đổi liên tục và deploy theo nhánh; đổi lại mất artifact bất biến và rollback phải build lại.</li><li><strong>Phương án B — Semantic versioning kèm tag latest:</strong> hợp khi khách hàng bên ngoài kéo image theo tên; đổi lại latest vẫn bị ghi đè nên không dùng làm điểm rollback. (xem Bài L05, L23).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log deploy không có tag cụ thể; nhiều instance chạy các tag khác nhau; số lần rollback thủ công tăng; staging và production lệch hành vi vì artifact khác.</li><li><strong>Cách kiểm chứng nhanh:</strong> tra digest image đang chạy bằng docker images kèm flag digest; đối chiếu tag với commit SHA trong CI log; thử rollback bằng cách deploy lại tag cũ và quan sát thời gian. (xem Bài L06, L22).</li></ul>"
},
{
  "id": "H08",
  "group": "H",
  "topic": "Migration và rollback database",
  "prio": "P1",
  "level": "L3",
  "type": "situation",
  "incident": "<p>Tình huống giả định: Một lần triển khai gồm hai bước: chạy migration đổi tên một cột, rồi triển khai mã mới. Migration chạy xong, nhưng bước triển khai mã thất bại. Trong khoảng 12 phút, phiên bản mã cũ vẫn đang chạy và truy vấn cột cũ, nên mọi request liên quan đều lỗi 500. Việc rollback migration cũng thất bại vì cột cũ đã bị xoá cùng dữ liệu.</p>",
  "askFirst": [
    "Vì sao migration và triển khai mã phải tương thích trong cả hai chiều? → Giải mã: Migration chạy một chiều, rollback code không đảo được; cột đã xóa mất dữ liệu nếu không có backup. Thiết kế migration để cả code cũ và code mới cùng chạy được trong lúc chuyển đổi (xem Bài L18).",
    "Thay đổi phá huỷ nên được chia thành những bước nào? → Giải mã: Tách ba bước: (1) thêm cột nullable, (2) backfill theo mẻ và ghi vào cả hai cột, (3) chuyển mã đọc sang cột mới rồi xóa cột cũ ở lần deploy riêng. Mỗi bước là một lần deploy (xem Bài L17).",
    "Làm sao để rollback migration luôn thực hiện được? → Giải mã: Luôn có migration đảo ngược đã thử trên bản sao production; sao lưu có thể phục hồi và kiểm thử trước; chuẩn bị kịch bản dừng deploy nếu migration quá chậm (xem Bài L20)."
  ],
  "predict": {
    "q": "Một migration xóa một cột đang được phiên bản mã cũ sử dụng. Nếu bạn triển khai mã mới thất bại và phải quay lại mã cũ, chuyện gì xảy ra?",
    "a": "<p>Mã cũ lỗi ngay vì cột nó cần đã không còn. Đây là lý do thay đổi phá huỷ phải tách khỏi thay đổi mã, và tách theo thứ tự để hai phiên bản cùng chạy được.</p><p>Quy trình ba bước là mở rộng, chuyển đổi, thu hẹp. Trước tiên thêm cột mới và để mã ghi vào cả hai cột. Khi ổn định, chuyển mã đọc sang cột mới. Chỉ xóa cột cũ ở một lần deploy riêng, sau khi mọi bản cũ đã rút. Như vậy ở mọi thời điểm đều có thể quay lại mà không mất dữ liệu.</p>"
  },
  "anchor": "Migration phá huỷ đi trước mã là tự tay lấy đi đường lùi, nên thay đổi schema phải được chia thành các bước mà cả hai phiên bản mã cùng chạy được.",
  "attacks": [
    {
      "q": "Làm sao chạy một migration lớn trên bảng hàng chục triệu dòng mà không khóa bảng?",
      "a": "Chia thành nhiều bước nhỏ và kiểm soát khóa ở từng bước. Thêm cột nullable là thao tác nhẹ trên Postgres. Tạo chỉ mục bằng CREATE INDEX CONCURRENTLY để không chặn ghi, đổi lại là chậm hơn. Thêm ràng buộc NOT NULL thì làm hai bước: thêm CHECK (cột IS NOT NULL) NOT VALID, rồi chạy VALIDATE CONSTRAINT riêng. Backfill dữ liệu nên chạy theo lô nhỏ, mỗi lô là một transaction ngắn, để không giữ khóa lâu và không làm phình bảng."
    },
    {
      "q": "Migration có nên nằm trong cùng pipeline với triển khai mã không?",
      "a": "Nên nằm trong pipeline, nhưng là một bước riêng chạy trước deploy, và chỉ một tiến trình được chạy nó. Nếu nhiều replica FastAPI hay Django cùng khởi động và cùng migrate, chúng sẽ tranh nhau và có thể áp dụng hai lần. Bạn cần khóa, ví dụ pg_advisory_lock, hoặc để một job riêng chạy migration. Và migration phải tương thích ngược, vì trong lúc rolling deploy luôn có một khoảng cả bản cũ lẫn bản mới cùng phục vụ."
    }
  ],
  "q": "Bạn vừa deploy bản mới kèm migration xóa một cột, giờ cần rollback code gấp. Vì sao rollback code không đồng nghĩa rollback database, và bạn xử lý thế nào?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Viết migration xóa cột rồi deploy code cùng một bước, tưởng rollback code sẽ tự khôi phục database; hoặc chạy migration phá huỷ không có bản rollback đã thử trước.</p><p><strong>Vì sao hỏng:</strong> Migration chạy một chiều không tự đảo. Rollback code quay về image cũ mà cột đã xóa, mọi request của code cũ lỗi 500 trong 12 phút như scenario; cột cũ không tự quay lại.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> code và schema có vòng đời khác nhau, migration tool chạy SQL theo thứ tự không có cơ chế tự đảo, nên thay đổi phá huỷ phải chia thành các bước mà cả hai phiên bản code cùng chạy được.</p><ul><li><strong>Expand-contract:</strong> thêm cột nullable trước, backfill theo mẻ ghi cả hai cột, xóa cột cũ ở lần deploy riêng sau khi mọi bản cũ đã rút.</li><li><strong>Migration đảo ngược:</strong> luôn có bản rollback đã thử trên bản sao production kèm sao lưu có thể phục hồi, để có đường lui thật.</li></ul>",
  "oral": "Rollback code chỉ đưa image ứng dụng về bản cũ, còn migration đã chạy trên database vẫn ở đó. Cột đã xóa không tự quay lại, và dữ liệu có thể mất nếu không có backup. Vì vậy migration phải được coi là thay đổi một chiều. Cách an toàn là viết migration tương thích ngược, tách bước mở rộng và thu hẹp, backup và kiểm thử trước khi chạy, rồi chuẩn bị migration đảo ngược đã thử trên bản sao production.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Migration</strong>: tập lệnh SQL thay đổi schema (thêm, sửa, xóa cột, thêm index) chạy tự động theo pipeline; một chiều, không tự đảo.</li><li><strong>Rollback code</strong>: quay lại image ứng dụng bản cũ; không đảo migration đã chạy.</li><li><strong>Expand-contract</strong>: tách thay đổi phá huỷ thành hai bước: thêm cột nullable, chuyển mã đọc sang cột mới rồi xóa cột cũ ở deploy riêng.</li><li><strong>CREATE INDEX CONCURRENTLY</strong>: tạo chỉ mục không khóa bảng ghi trong PostgreSQL.</li></ul><p><strong>Lịch sử ngắn gọn.</strong> Trước migration tool, DBA chạy SQL tay và rollback bằng cách khôi phục bản backup. Khi continuous deployment xuất hiện, migration phải chạy tự động trước code, và việc xóa cột trong cùng một lần deploy làm rollback code không còn đủ.</p><p><strong>Cơ chế.</strong> Migration là thay đổi có trạng thái trên database, còn rollback code chỉ đổi image ứng dụng. Hai lớp này tiến hóa độc lập nên không có chung một nút quay lại. Bạn tách thay đổi phá huỷ thành expand: thêm cột nullable, backfill theo mẻ, ghi cả hai cột; rồi contract: chuyển mã đọc sang cột mới, và xóa cột cũ ở lần deploy riêng.</p><p><strong>Chỗ hay sai.</strong> Team chạy migration xóa cột cùng lúc với deploy code, hoặc không có migration đảo ngược đã thử trên backup. Khi lỗi, rollback code vẫn chạy được nếu cột cũ còn; nếu cột đã xóa, chỉ cứu được từ backup.</p><p><strong>Điều cần nói được.</strong> Rollback code không xóa migration. Thay đổi phá huỷ phải chia thành bước mở rộng và thu hẹp để hai phiên bản cùng chạy. Migration nguy hiểm cần backup đã kiểm thử và migration đảo ngược, như downgrade của Alembic hoặc reverse của Django.</p><p><strong>Bài học nền tảng liên quan:</strong> Cơ chế migration và rollback an toàn (xem Bài L17, L18, L20).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Thế nào là migration tương thích ngược?",
      "a": "Là migration mà cả code cũ và code mới đều chạy được trong lúc chuyển đổi. Bạn chỉ thêm mới dạng cho phép rỗng, không xóa hay đổi nghĩa trường cũ, và dời bước dọn dẹp sang một deploy sau khi mọi bản cũ đã rút."
    },
    {
      "q": "Trước một migration nguy hiểm bạn chuẩn bị gì?",
      "a": "Bạn sao lưu có thể phục hồi đã kiểm thử, chạy thử trên bản sao production, ước lượng thời gian khóa bảng, chuẩn bị migration đảo ngược và kịch bản dừng deploy. Bạn cũng thông báo cửa sổ rủi ro cho bên liên quan."
    }
  ],
  "pitfalls": [
    "Xóa cột và deploy code cùng lúc nên rollback code xong hệ thống vẫn lỗi vì thiếu cột",
    "Chạy migration production lần đầu mà chưa thử phục hồi sao lưu"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được cách viết backfill theo mẻ cho bảng lớn mà không khóa bảng quá lâu",
    "Tôi có thể giải thích bằng ví dụ tách thêm cột và xóa cột thành hai deploy riêng biệt",
    "Tôi có thể lập checklist sao lưu và kiểm thử rollback cho một migration xóa trường thực tế"
  ],
  "refs": [
    "gh-actions"
  ],
  "say30": "Migration chạy một chiều trên database và không tự đảo khi bạn rollback code. Cột đã xóa không tự quay lại và dữ liệu có thể mất nếu migration ghi đè. Bạn tách thay đổi phá hủy thành ba bước expand contract: thêm cột nullable, backfill theo mẻ và ghi cả hai cột, sau đó xóa cột cũ ở lần deploy riêng. Luôn có bản rollback migration đã thử trên bản sao production.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Deploy bản mới kèm migration xóa cột rồi lỗi, rollback code quay lại image cũ nhưng database vẫn còn cột đã xóa. Code cũ cần cột đó nên hệ thống tiếp tục hỏng. Nỗi đau là code và schema có vòng đời khác nhau, rollback code không bao giờ đảo migration.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Migration tool chạy SQL theo thứ tự và không có cơ chế tự đảo. Cách làm chuẩn là mô hình expand contract: bước một thêm cột mới để null, bước hai chuyển code đọc và ghi vào cả hai cột, backfill theo mẻ, bước ba xóa cột cũ ở lần deploy riêng. Tạo index thì dùng CREATE INDEX CONCURRENTLY để không khóa bảng ghi. Mọi migration phá hủy phải kèm bản rollback đã thử trên bản sao production.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Expand contract đòi hai lần deploy và thời gian code ghi vào hai cột; backfill theo mẻ làm chậm tiến trình. Giám sát: tiến độ backfill theo bảng, thời gian lock trên từng migration, và kiểm tra sao lưu có thể phục hồi trước khi chạy migration production. (xem Bài L08, L10).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> code và schema luôn tương thích trong cả hai chiều; rollback code không bao giờ gãy do thiếu cột; backfill theo mẻ không khóa toàn bảng; migration đảo ngược luôn khả thi vì đã thử trên bản sao.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> hai lần deploy cho một thay đổi; thời gian tồn tại code ghi vào hai cột; backfill chiếm thời gian và CPU trên production. (xem Bài L08, L22).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Chỉ dùng thêm cột, không xóa (additive only):</strong> hợp khi schema đổi chậm và bảng không lớn; đổi lại cột cũ tích lũy và code phải đọc hai nơi.</li><li><strong>Phương án B — Chạy migration ngoài giờ cao điểm kèm snapshot sao lưu đầy đủ:</strong> hợp khi không thể giãn hai lần deploy; đổi lại rủi ro cao hơn vì không có đường lui mềm, chỉ còn khôi phục từ backup. (xem Bài L05, L08).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log báo cột không tồn tại sau rollback code; thời gian lock bảng trong migration; tiến độ backfill tăng không đều; sai lệch dữ liệu giữa cột cũ và cột mới.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra code cũ chạy được trên schema mới và ngược lại; chạy migration rồi rollback migration trên bản sao production; so sánh dữ liệu hai cột sau backfill hoàn tất. (xem Bài L08, L22).</li></ul>"
},
{
  "id": "H09",
  "group": "H",
  "topic": "Linux tiến trình, cổng, log, biến môi trường và quyền",
  "prio": "P2",
  "level": "L1",
  "type": "code",
  "incident": "<p>Tình huống giả định: Một service trên máy chủ Linux đột nhiên không nhận kết nối. Kiểm tra cho thấy tiến trình vẫn chạy, nhưng cổng không phản hồi. Một kỹ sư kiểm tra bằng cách khởi động lại service, và sự cố quay lại sau hai giờ. Không ai đọc được log vì ứng dụng ghi vào một tệp trong thư mục của người dùng, và tệp đó không có quyền đọc cho nhóm vận hành.</p>",
  "askFirst": [
    "Làm sao kiểm tra một tiến trình có thật sự đang lắng nghe trên cổng không? → Giải mã: Tiến trình còn sống không có nghĩa cổng đang phục vụ. Kiểm tra bằng ss -ltnp; nếu bind 127.0.0.1 thì chỉ nhận kết nối từ chính máy đó (xem Bài L12).",
    "Quyền trên tệp log ảnh hưởng gì tới việc xử lý sự cố? → Giải mã: Nhóm vận hành không đọc được log thì mọi chẩn đoán thành phỏng đoán. Quyền đọc cho nhóm ops là chuẩn; dùng chown/perm hợp lý, không chmod 777 (xem Bài L07).",
    "Dấu hiệu nào phân biệt hết file descriptor với cạn cổng? → Giải mã: Hết fd: service chạy bình thường một thời gian rồi từ chối kết nối mới, CPU thấp. Cạn port: không mở được port mới. Kiểm tra bằng ls /proc/pid/fd và so với hạn mức (xem Bài L11)."
  ],
  "predict": {
    "q": "Một tiến trình đang chạy nhưng không nhận kết nối trên cổng đã cấu hình. Bạn kiểm tra gì trước?",
    "a": "<p>Kiểm tra tiến trình có thật sự đang lắng nghe trên cổng đó không, chứ không chỉ kiểm tra nó còn tồn tại. Tiến trình có thể khởi động xong nhưng thất bại khi mở cổng, vì cổng đã bị tiến trình khác chiếm, thiếu quyền mở cổng dưới 1024, hoặc đang nghe trên địa chỉ khác với địa chỉ bạn gọi tới.</p><p>Trường hợp cuối phổ biến và khó thấy. Nếu app bind 127.0.0.1 thì chỉ nhận kết nối từ chính máy đó. Một app FastAPI chạy trong Docker phải bind 0.0.0.0, ví dụ uvicorn --host 0.0.0.0, mới nhận được request từ bên ngoài container.</p>"
  },
  "anchor": "“Tiến trình còn chạy” và “cổng đang phục vụ” là hai câu hỏi khác nhau, nên chẩn đoán phải kiểm tra trạng thái lắng nghe, không chỉ trạng thái tiến trình.",
  "attacks": [
    {
      "q": "Hết file descriptor gây ra triệu chứng gì?",
      "a": "Triệu chứng đặc trưng là service chạy bình thường một thời gian, rồi bắt đầu từ chối kết nối mới hoặc không mở được tệp, trong khi tiến trình vẫn sống và CPU thấp. Nguyên nhân thường là rò rỉ: kết nối hoặc tệp không được đóng, nên số descriptor tăng dần tới hạn mức. Cần phân biệt hạn mức theo tiến trình với hạn mức toàn hệ thống, vì cả hai đều có thể bị chạm. Chẩn đoán bằng cách đếm descriptor đang mở của tiến trình, so với hạn mức, rồi xem chúng là socket hay file để đoán chỗ rò rỉ."
    },
    {
      "q": "Vì sao quyền trên tệp log lại quan trọng trong xử lý sự cố?",
      "a": "Nếu người trực không đọc được log, mọi chẩn đoán thành phỏng đoán và thời gian khắc phục tăng mạnh. Quyền nên cho nhóm vận hành đọc được mà không cần root, còn ứng dụng chỉ cần quyền ghi. Liên quan là xoay vòng log: nếu log không được xoay, đĩa đầy và thành một sự cố khác. Log cũng nên đẩy về nơi tập trung, vì khi máy hỏng thì log trên chính máy đó mất theo."
    }
  ],
  "q": "Web trong container không trả lời, bạn chỉ có shell Linux trên host. Bạn dùng lệnh nào để tìm tiến trình, cổng, log, biến môi trường và quyền file?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Service không trả lời thì restart ngay để kiểm tra; hoặc chỉ xem tiến trình còn sống không rồi kết luận service khỏe.</p><p><strong>Vì sao hỏng:</strong> Restart xóa bằng chứng lỗi cần quan sát. Tiến trình còn sống không có nghĩa cổng đang phục vụ: app có thể bind 127.0.0.1 nên request từ ngoài bị connection refused, và quyền file log thiếu đọc cho nhóm vận hành khiến chẩn đoán thành phỏng đoán.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> trong container, tiến trình còn sống và cổng đang phục vụ là hai câu hỏi khác nhau; chẩn đoán đúng phải kiểm tra trạng thái LISTEN, địa chỉ bind, quyền file log và hạn mức file descriptor.</p><ul><li><strong>Socket LISTEN:</strong> ss -ltnp cho biết socket TCP đang nghe trên địa chỉ nào; bind loopback thì request từ bên ngoài vào không được.</li><li><strong>Quyền log:</strong> file log không có quyền đọc cho nhóm vận hành thì mọi chẩn đoán thành phỏng đoán, thời gian khắc phục tăng mạnh.</li><li><strong>File descriptor:</strong> kết nối hoặc tệp không được đóng làm fd tăng dần tới hạn mức, service từ chối kết nối mới trong khi CPU thấp.</li></ul>",
  "oral": "Bạn đi từ tiến trình tới mạng, rồi tới log và cấu hình. Đầu tiên xem tiến trình còn sống không và đang tốn bao nhiêu CPU, RAM. Sau đó kiểm tra cổng nào đang nghe và trên địa chỉ nào, rồi thử gọi trực tiếp để tách lỗi mạng với lỗi ứng dụng. Cuối cùng đọc log, kiểm tra biến môi trường và quyền file cấu hình. Đừng khởi động lại trước khi đọc log, vì restart có thể xóa trạng thái lỗi mà bạn cần quan sát.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Process</strong>: instance chương trình đang chạy; kiểm tra bằng ps, top, pidstat.</li><li><strong>Port listening</strong>: socket TCP ở trạng thái LISTEN; kiểm tra bằng ss -ltnp, netstat.</li><li><strong>File descriptor</strong>: số mô tả mở (socket, file, pipe) của một process; có hạn mức theo tiến trình và toàn hệ thống.</li><li><strong>Environment variable</strong>: biến cấu hình truyền vào process; kiểm tra bằng printenv, docker inspect.</li></ul><p><strong>Trước container.</strong> Sysadmin bare-metal dùng ps, netstat, journal và file log riêng lẻ. Khi service chạy trong namespace, việc tiến trình còn sống không đủ để kết luận service khỏe.</p><p><strong>Chuỗi chẩn đoán.</strong> Đi từ tiến trình tới mạng rồi tới cấu hình. Nếu có từ hai bước trở lên:</p><ul><li><code>ps aux</code> xem app còn sống và tốn bao nhiêu tài nguyên.</li><li><code>ss -ltnp</code> cho biết tiến trình nào LISTEN trên cổng nào và bind ở địa chỉ nào.</li><li><code>docker logs</code> và <code>journalctl</code> đọc lỗi khởi động.</li><li><code>printenv</code> kiểm tra biến cấu hình; <code>ls -l</code> kiểm tra quyền đọc file.</li></ul><p>Nếu <code>ss -ltnp | grep 8000</code> hiện <code>127.0.0.1:8000</code>, app chỉ nghe loopback và ngoài container không gọi được.</p><p><strong>Chỗ hay sai.</strong> Team thấy CPU thấp rồi kết luận app ổn, trong khi tiến trình sống nhưng bind sai địa chỉ hoặc thiếu <code>DB_HOST</code>. Hoặc UID trong container khác UID trên host khiến file log không đọc được, và người trực kết luận sai quyền vì không nhìn GID.</p><p><strong>Điều cần nói được.</strong> Tiến trình chạy không đồng nghĩa service phục vụ. Phải kiểm tra LISTEN trên đúng địa chỉ. Đọc log và biến môi trường trong container bằng <code>docker exec</code>, không chỉ trên host. Quyền file gắn với UID/GID khi mount volume.</p><p><strong>Bài học nền tảng liên quan:</strong> Debug và log (xem Bài L07, L11, L12).</p>",
  "code": "# ✅ Cách làm chuẩn: liệt kê tiến trình tốn CPU nhất tại thời điểm này\nps aux --sort=-%cpu | head\n# ✅ Cách làm chuẩn: xác nhận app thật sự nghe cổng 8000, và trên địa chỉ nào\nss -ltnp | grep 8000\ndocker ps\ndocker logs --tail 200 web\n# Lưu ý: printenv chỉ in biến của shell hiện tại, không phải của container\nprintenv | grep DB_\nls -l /etc/app/config.env",
  "expected": "Mỗi lệnh dưới đây trả về một mảnh chẩn đoán khác nhau; ghép lại là đủ để tách lỗi mạng, lỗi app và lỗi cấu hình mà không cần restart bừa.\nps aux --sort=-%cpu | head: in 9 tiến trình tốn CPU nhất kèm cột trạng thái. %CPU của ps là trung bình suốt vòng đời nên che các đỉnh ngắn, muốn xem tức thời dùng top -o %CPU hoặc pidstat. Tiến trình trạng thái Z là zombie, không chiếm CPU RAM, chỉ bị tiến trình cha thu dọn; tìm cha bằng ps -o ppid= -p <pid>.\nss -ltnp | grep 8000: liệt kê socket TCP ở trạng thái LISTEN, kèm tiến trình giữ cổng (cần root hoặc cùng user). Nếu dòng hiện 127.0.0.1:8000 thì app chỉ bind loopback, gọi từ ngoài sẽ bị connection refused; phải bind 0.0.0.0. Nếu grep không ra dòng nào thì không có gì nghe cổng 8000, app chưa khởi động hoặc nghe cổng khác.\ndocker ps: chỉ hiện container đang chạy, kèm cột PORTS dạng 0.0.0.0:8080->8000/tcp và STATUS dạng Up 5 minutes (healthy). Nếu container vắng mặt, chạy docker ps -a để xem Exited và mã thoát.\ndocker logs --tail 200 web: lấy 200 dòng cuối của stdout/stderr tiến trình chính, đúng chỗ thường có stack trace. Log chỉ tồn tại theo vòng đời container, docker rm là mất; log ghi vào file trong container sẽ không hiện ở đây.\nprintenv | grep DB_: in biến môi trường của chính shell đang gõ, không phải của container. Muốn xem bên trong container dùng docker exec web printenv | grep DB_ hoặc docker inspect --format '{{.Config.Env}}' web. Thiếu DB_HOST là nguyên nhân kinh điển khiến app nối sai database.\nls -l /etc/app/config.env: in quyền, chủ sở hữu, nhóm, kích thước và thời gian sửa. Dạng -rw-r----- với chủ là user khác sẽ khiến app non-root báo Permission denied; đây là hệ quả của lệch UID/GID khi mount volume.\nLệnh chốt: ss -ltnp 'sport = :8000' lọc đúng cổng 8000 (chính xác hơn grep vì grep 8000 cũng khớp 18000 hay 80001), rồi curl -sv tới cổng 8000 trên localhost để thấy kết nối thành công hay bị từ chối.",
  "followups": [
    {
      "q": "Bạn phân biệt app chết và app còn sống nhưng không nghe cổng thế nào?",
      "a": "Bạn đối chiếu tiến trình còn không, cổng có LISTEN không và log nói gì. Tiến trình mất là app đã thoát, còn tiến trình sống mà không có cổng thường là kẹt khởi động, bind sai hoặc chờ phụ thuộc như database."
    },
    {
      "q": "Vì sao quyền file hay gây lỗi sau khi gắn volume?",
      "a": "Vì UID trong container có thể khác UID trên host. File host chỉ cho phép user khác đọc, trong khi app non-root trong container không có quyền. Bạn cần đồng bộ UID, đổi quyền hoặc dùng nhóm chung."
    }
  ],
  "pitfalls": [
    "Nhầm bind localhost với bind mọi địa chỉ nên ngoài container không gọi được",
    "Đổi quyền 777 cho qua chuyện thay vì sửa đúng user và nhóm"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được cách đọc trạng thái tiến trình zombie và tìm tiến trình cha của nó",
    "Tôi có thể giải thích bằng ví dụ dùng ss và log để tách lỗi cổng và lỗi ứng dụng",
    "Tôi có thể chẩn đoán một service không trả lời từ shell host mà không cần khởi động lại bừa"
  ],
  "refs": [
    "signal-man"
  ],
  "say30": "Bạn đi theo một chuỗi cố định: tiến trình, cổng, log, cấu hình. Đầu tiên ps và top xem tiến trình còn sống không và tiêu CPU RAM ra sao. Sau đó ss -ltnp xem cổng nào đang nghe và trên địa chỉ nào, thử gọi trực tiếp để tách lỗi mạng với lỗi ứng dụng. Cuối cùng đọc log, kiểm tra biến môi trường và quyền file. Đừng khởi động lại trước khi đọc log vì restart xóa trạng thái lỗi.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Trên host trần, ps và netstat đủ để chẩn đoán. Bên trong container, tiến trình còn sống không có nghĩa service khỏe, namespace che một phần trạng thái host, và lỗi mạng lẫn lỗi ứng dụng trông y hệt nhau nếu không tách lớp. Nỗi đau là restart xóa bằng chứng trước khi bạn kịp đọc.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Chuỗi bốn bước. Một, ps và top kiểm tra tiến trình còn sống, CPU, RAM. Hai, ss -ltnp hoặc netstat xem socket TCP đang LISTEN, trên địa chỉ nào; nếu bind localhost thì không bên nào ngoài gọi được. Ba, đọc log và biến môi trường bằng printenv, docker inspect. Bốn, kiểm tra quyền file bằng ls -l và id; nếu nhóm vận hành không đọc được log thì mọi chẩn đoán thành phỏng đoán.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: ss -ltnp không cho thấy tiến trình nào giữ socket nếu thiếu root; file descriptor hết khác cạn cổng vì fd là giới hạn tổng mở. Giám sát: số fd mở theo tiến trình, trạng thái LISTEN theo cổng, log kết nối bị từ chối theo địa chỉ bind. (xem Bài L03, L10).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> chuỗi cố định giảm thời gian chẩn đoán; tách lớp mạng và lớp ứng dụng rõ ràng; đọc log trước khi restart giữ bằng chứng.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> mỗi bước cần quyền đọc đúng tầng; ss không root chỉ cho số liệu thô; kiểm tra fd đòi hiểu cả giới hạn tiến trình và hệ thống. (xem Bài L03, L10).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Dùng journalctl hoặc docker logs thay vì đọc file trực tiếp:</strong> hợp khi log nằm trong log journal của host; đổi lại mất context quyền file.</li><li><strong>Phương án B — Thêm endpoint chẩn đoán riêng trong ứng dụng:</strong> hợp khi cần tự động hóa; đổi lại tốn công duy trì và chỉ đo được phần ứng dụng. (xem Bài L10, L23).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> log báo connection refused với cùng host; số fd mở chạm giới hạn; socket không ở trạng thái LISTEN nhưng tiến trình còn sống; quyền file cấu hình không đủ đọc.</li><li><strong>Cách kiểm chứng nhanh:</strong> so kết quả ss -ltnp với cổng khai báo trong config; kiểm tra ulimit -n; chạy curl tới địa chỉ bind thật; đối chiếu quyền file với user của tiến trình. (xem Bài L03, L10).</li></ul>"
},
{
  "id": "H10",
  "group": "H",
  "topic": "Log, metric, trace và dấu hiệu sự cố",
  "prio": "P1",
  "level": "L3",
  "type": "situation",
  "incident": "<p>Tình huống giả định: Sau một sự cố kéo dài 90 phút, buổi rút kinh nghiệm cho thấy đội đã mất 25 phút đầu chỉ để xác định sự cố bắt đầu từ khi nào. Dashboard có 60 biểu đồ nhưng không có biểu đồ nào hiển thị tỉ lệ lỗi theo phiên bản triển khai, nên không ai liên hệ được sự cố với lần deploy 20 phút trước đó. Không có cảnh báo nào kêu vì ngưỡng được đặt theo giá trị trung bình, và giá trị trung bình vẫn nằm trong ngưỡng.</p>",
  "askFirst": [
    "Metric nào phát hiện sự cố sớm nhất? → Giải mã: Tỉ lệ lỗi (5xx) và p99 latency phát hiện sớm nhất; trung bình che mất nhóm người dùng chịu thiệt. Cảnh báo theo p95/p99 và 5xx tách theo phiên bản triển khai (xem Bài L10).",
    "Vì sao ngưỡng theo giá trị trung bình lại bỏ sót? → Giải mã: 97% request nhanh thì trung bình chỉ nhích, ngưỡng không bao giờ kêu. Cần cảnh báo theo phân vị cao (p95, p99) và tỉ lệ lỗi, tách theo phiên bản (xem Bài L10).",
    "Thông tin nào cần có ngay khi mở dashboard? → Giải mã: Tỷ lệ lỗi, p99 latency theo phiên bản triển khai, và độ trễ từng phụ thuộc bên ngoài. Cho biết sự cố liên quan deploy hay phụ thuộc (xem Bài L13)."
  ],
  "predict": {
    "q": "Một sự cố ảnh hưởng tới 3% request nhưng rất nặng với nhóm người dùng đó. Chỉ số trung bình có phát hiện được không?",
    "a": "<p>Không. Nếu 97% request vẫn nhanh và thành công, giá trị trung bình chỉ nhích lên chút, nên ngưỡng theo trung bình có thể không bao giờ kêu, trong khi 3% request kia đã chậm hoặc lỗi.</p><p>Vì vậy cảnh báo phải đặt theo phân vị cao như p95, p99 và theo tỉ lệ lỗi. Với người dùng, điều đáng quan tâm là nhóm tệ nhất, vì một tỉ lệ nhỏ lỗi vẫn là sự cố thật đối với họ.</p>"
  },
  "anchor": "Giá trị trung bình che mất nhóm người dùng chịu thiệt, nên cảnh báo phải dựa trên phân vị cao và tỉ lệ lỗi.",
  "attacks": [
    {
      "q": "Ba tín hiệu nào bạn muốn có ngay khi mở dashboard lúc có sự cố?",
      "a": "Có ba nhóm tín hiệu. Thứ nhất là tỉ lệ lỗi và latency ở phân vị cao, tách theo phiên bản đang chạy, vì tách theo phiên bản là cách nhanh nhất để biết có phải do deploy hay không. Thứ hai là latency và tỉ lệ lỗi của từng phụ thuộc bên ngoài, vì phần lớn sự cố nằm ở đó chứ không nằm trong service. Thứ ba là các tài nguyên có giới hạn cứng: độ sâu hàng đợi, tuổi message cũ nhất, và số kết nối đang dùng so với pool. Ba nhóm này giúp trả lời hỏng ở đâu trong vài phút."
    },
    {
      "q": "Cảnh báo nên đặt thế nào để không bị bỏ qua?",
      "a": "Mỗi cảnh báo phải gắn với một hành động cụ thể; nếu không có hành động nào thì không nên tồn tại. Cảnh báo nên dựa trên triệu chứng người dùng cảm nhận, như tỉ lệ lỗi và latency, chứ không dựa trên nguyên nhân nội bộ như CPU cao. CPU cao mà người dùng vẫn ổn thì không phải sự cố. Cần phân mức: chỉ sự cố ảnh hưởng người dùng mới đánh thức người trực, phần còn lại đi vào kênh thông tin thường. Định kỳ rà lại để xóa cảnh báo không bao giờ dẫn tới hành động, vì chúng làm mờ cảnh báo thật."
    }
  ],
  "q": "Sau deploy, tỉ lệ 5xx tăng, p99 latency vọt lên và RAM container tăng đều. Bạn dùng log, metric và trace thế nào để khoanh vùng?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Đặt ngưỡng cảnh báo theo CPU và RAM trung bình; xây dashboard 60 biểu đồ nhưng không biểu đồ nào tách theo phiên bản triển khai.</p><p><strong>Vì sao hỏng:</strong> 97% request nhanh làm trung bình chỉ nhích nên ngưỡng không bao giờ kêu, sự cố phát hiện qua điện thoại khách hàng. Không tách theo phiên bản nên không ai liên hệ được sự cố với lần deploy gần nhất.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> cảnh báo phải dựa trên triệu chứng người dùng là tỉ lệ 5xx và phân vị cao p95 p99 tách theo phiên bản, không dựa trên nguyên nhân nội bộ hay giá trị trung bình che mất nhóm request tệ nhất.</p><ul><li><strong>Phân vị thay trung bình:</strong> p99 bắt nhóm người dùng chịu thiệt mà giá trị trung bình che mất.</li><li><strong>Request ID xuyên suốt:</strong> log, metric và trace phải cùng một định danh để nối một request chậm qua nhiều tầng.</li><li><strong>Rollback có kiểm soát:</strong> giảm tải hoặc rollback xác nhận giả thuyết deploy gây lỗi thay vì kết luận vì trùng thời gian.</li></ul>",
  "oral": "Bạn bắt đầu từ metric để biết cái gì đổi và đổi khi nào. Đối chiếu mốc deploy với đường 5xx, p99 và RAM, rồi xem nhóm endpoint hay instance nào bị ảnh hưởng. Sau đó lọc log lỗi theo request id để tìm stack trace và điểm hỏng chung. Mở trace của một request chậm để xem thời gian kẹt ở database, hàng đợi hay service ngoài. RAM tăng đều và không giảm sau khi tải hạ là gợi ý rò rỉ bộ nhớ; latency chỉ tăng ở một endpoint thì nghi câu truy vấn chậm. Khi có giả thuyết, kiểm tra thay đổi vừa deploy, rồi giảm tải hoặc rollback có kiểm soát để xác nhận.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Log</strong>: sự kiện rời rạc, có correlation ID (request ID) để nối các tầng.</li><li><strong>Metric</strong>: số tổng hợp theo thời gian (p99, 5xx, RAM); cảnh báo theo phân vị cao, không theo trung bình.</li><li><strong>Trace</strong>: nối các nhịp xử lý của một request qua nhiều service; tìm latency kẹt ở đâu.</li><li><strong>Request ID</strong>: định danh duy nhất của một request, gắn vào log, metric, trace để đối chiếu.</li></ul><p><strong>Trước observability.</strong> Sự cố được phát hiện qua điện thoại và ticket. Dashboard theo dõi CPU và RAM trung bình, nên phần nhỏ request hỏng vẫn nằm trong ngưỡng. Khi số microservice tăng, giá trị trung bình che mất nhóm người dùng tệ nhất, và không ai nối được sự cố với lần deploy.</p><p><strong>Ba nguồn bổ sung nhau.</strong> <code>log</code> ghi sự kiện rời rạc; <code>metric</code> là số tổng hợp theo thời gian; <code>trace</code> nối các nhịp xử lý của một request qua nhiều service. Metric cho triệu chứng và mốc thời gian, log theo request id cho stack trace, còn trace cho biết latency nằm ở nhịp nào.</p><p><strong>Chỗ hay sai.</strong> Kết luận deploy gây lỗi chỉ vì trùng thời gian, chưa loại trừ lưu lượng tăng hay phụ thuộc ngoài. Hoặc thiếu request id nên log và trace không nối được. Hoặc cảnh báo vẫn đặt theo trung bình thay vì phân vị cao và tỉ lệ lỗi.</p><p><strong>Điều cần nói được.</strong> Dùng metric để thấy triệu chứng, log để tìm nguyên nhân cụ thể, trace để tìm nhịp chậm. Lỗi phổ biến là thiếu request id, khiến ba nguồn không ghép lại được.</p><p><strong>Bài học nền tảng liên quan:</strong> Monitoring, log và correlation ID (xem Bài L10, L12, L13).</p>",
  "code": "# ✅ Cách làm chuẩn: xem CPU, RAM, mạng và I/O của từng container trong một ảnh chụp\ndocker stats --no-stream\n# ✅ Cách làm chuẩn: lọc lỗi trong 300 dòng log gần nhất, đọc kỹ ngữ cảnh quanh lỗi\ndocker logs --tail 300 web | grep \"ERROR\"\nss -s\nfree -m",
  "expected": "Bốn lệnh này cho bạn ba nhóm bằng chứng khác nhau: tài nguyên của container, bằng chứng trong log, và trạng thái socket của host.\ndocker stats --no-stream: in một ảnh chụp rồi thoát (không stream), các cột gồm CONTAINER ID, NAME, CPU %, MEM USAGE / LIMIT, MEM %, NET I/O, BLOCK I/O, PIDS. Trên Linux CLI, MEM USAGE đã trừ phần cache không hoạt động, còn LIMIT bằng tổng RAM host nếu container không đặt trần bộ nhớ. Vì vậy RAM tăng đều có thể chỉ là cache tăng, chưa chắc là rò rỉ.\ndocker logs --tail 300 web | grep ERROR: lọc lỗi trong 300 dòng log gần nhất. grep mặc định phân biệt hoa thường nên bỏ sót error hoặc level=error, và chỉ giữ dòng khớp nên stack trace nhiều dòng mất ngữ cảnh; dùng grep -i -A 20 hoặc --since 10m.\nss -s: in bảng tổng hợp socket theo trạng thái (estab, timewait, orphaned...). Dấu hiệu số timewait phình to là rò rỉ kết nối hoặc cạn pool.\nfree -m: in bộ nhớ theo MiB gồm total, used, free, shared, buff/cache, available. Phải nhìn available mới thấy khoảng trống thật, vì used không tính phần cache thu hồi được. Lưu ý ss -s và free -m chạy trên host nếu không qua docker exec; trần bộ nhớ của container nằm ở cgroup (memory.max ở cgroup v2, memory.limit_in_bytes ở v1).\nCách khoanh vùng: đối chiếu mốc 5xx và p99 nhảy bậc với thời điểm deploy, nhưng loại trừ lưu lượng tăng và phụ thuộc ngoài trước khi kết tội deploy. RAM tăng đơn điệu, không về sau khi tải hạ và sau một chu kỳ thu gom rác, là dấu hiệu rò rỉ. Python hiếm khi trả RSS về OS nên phải so RSS sau khi ép gc, không chỉ nhìn RSS tăng. Trace một request chậm phân rã thời gian theo từng nhịp để biết p99 nằm ở database, cache hay lời gọi ngoài.\nLệnh chốt: docker logs --since 10m web | grep -c 500 để đếm lỗi trong cửa sổ sau deploy, dùng kèm docker stats --no-stream lấy ảnh chụp tức thời.",
  "followups": [
    {
      "q": "Bạn phân biệt rò rỉ bộ nhớ với tải tăng thật thế nào?",
      "a": "Bạn xem RAM có tăng đều khi tải đã hạ và có quay về sau thu gom không. Rò rỉ thường tăng đơn điệu, kèm số đối tượng và thời gian thu gom tăng. Tải thật thì RAM lên xuống theo lưu lượng và trở lại khi hết cao điểm."
    },
    {
      "q": "Bạn phân biệt lỗi ứng dụng với cạn kết nối thế nào?",
      "a": "Bạn xem log có stack trace của code hay toàn lỗi timeout và hàng đợi đầy. Metric số kết nối database, hàng đợi và file mô tả mở giúp xác nhận. Trace kẹt ở nhịp chờ kết nối gợi ý cạn pool chứ không phải logic sai."
    }
  ],
  "pitfalls": [
    "Kết luận deploy gây lỗi chỉ vì trùng thời gian mà chưa loại trừ lưu lượng và phụ thuộc ngoài",
    "Thiếu request id nên log và trace không khớp nhau được"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được cách chọn ngưỡng cảnh báo p99 và tỉ lệ 5xx tránh báo động giả",
    "Tôi có thể giải thích bằng ví dụ dùng trace chỉ ra nhịp database chiếm phần lớn p99",
    "Tôi có thể khoanh vùng một đợt 5xx thực tế từ dashboard tới đúng log và trace mẫu"
  ],
  "refs": [
    "docker-compose",
    "signal-man"
  ],
  "say30": "Sau deploy, bạn bắt đầu từ metric: đối chiếu mốc deploy với đường 5xx, p99, RAM. Sau đó lọc log lỗi theo request id để tìm stack trace và điểm hỏng chung. Mở trace của một request chậm để xem thời gian kẹt ở database, hàng đợi hay service ngoài. RAM tăng đều không giảm là gợi ý rò bộ nhớ. Khi có giả thuyết, kiểm tra thay đổi vừa deploy rồi giảm tải hoặc rollback có kiểm soát.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Dashboard theo CPU và RAM trung bình thì phần nhỏ request hỏng nằm ngay trong ngưỡng, không ai được báo. Sự cố phát hiện qua điện thoại khách hàng chứ không qua cảnh báo. Nỗi đau là khi nhiều microservice, trung bình che mất nhóm người dùng tệ nhất và không có request id để nối log và trace.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Log là sự kiện rời rạc có correlation ID. Metric là số tổng hợp theo thời gian, cảnh báo theo phân vị cao như p99, 5xx chứ không theo trung bình. Trace nối các nhịp xử lý của một request qua nhiều service để tìm latency kẹt ở đâu. Ba thứ này phải có cùng request id để đối chiếu. Cảnh báo theo 5xx và p99 là cách phát hiện sớm nhất vì trung bình không bao giờ kêu khi chỉ một nhóm hỏng.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Trace đầy đủ tốn chi phí lưu trữ và mẫu hóa; cảnh báo p99 đòi lịch sử phân vị chứ không phải số. Giám sát: tỉ lệ 5xx theo phiên bản deploy, p99 theo endpoint, RAM container so với thời điểm khởi động. (xem Bài L06, L10).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> cảnh báo theo phân vị bắt được sự cố nhóm nhỏ; request id nối log, metric, trace thành một chuỗi; rollback có kiểm soát xác nhận giả thuyết.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> trace tốn chi phí lưu trữ theo mẫu; correlation ID đòi kỷ luật gắn vào mọi tầng; p99 đòi giữ lịch sử phân vị không phải con số hiện tại. (xem Bài L06, L10).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Chỉ dùng log và metric, không trace:</strong> hợp khi số service ít; đổi lại không biết latency kẹt ở hop nào khi đa service.</li><li><strong>Phương án B — Dùng APM thương mại thay vì tự dựng:</strong> hợp khi cần dashboard và cảnh báo nhanh; đổi lại chi phí theo request và phụ thuộc vendor. (xem Bài L01, L10).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> 5xx tăng đúng thời điểm deploy; p99 tăng mà trung bình không đổi; RAM tăng đều không giảm sau khi tải hạ; log lỗi không có request id để nối.</li><li><strong>Cách kiểm chứng nhanh:</strong> lọc log theo request id của một request chậm; mở trace và đọc thời gian từng hop; kiểm tra thay đổi deploy gần nhất; giả lập tải và so p99 trước sau. (xem Bài L06, L10).</li></ul>"
},
{
  "id": "H11",
  "group": "H",
  "topic": "Git merge, rebase, conflict, revert và reset theo tình huống",
  "prio": "P2",
  "level": "L2",
  "type": "situation",
  "incident": "<p>Tình huống giả định: Một nhánh tính năng bị lệch 60 commit so với nhánh chính. Dev chọn rebase để có lịch sử sạch, và trong quá trình xử lý 14 xung đột, một thay đổi của đồng nghiệp bị ghi đè và mất. Việc mất mát chỉ được phát hiện ba ngày sau trên production. Ngoài ra, cùng nhánh đó đã được đẩy lên máy chủ chung và hai người khác đang làm việc trên nó.</p>",
  "askFirst": [
    "Rebase thay đổi điều gì, và điều đó nguy hiểm ở đâu? → Giải mã: Rebase viết lại lịch sử (mã commit đổi), chỉ an toàn trên nhánh riêng chưa đẩy. Rebase nhánh đã chia sẻ khiến lịch sử đồng nghiệp phân kỳ (xem Bài L17).",
    "Khi nào không được rebase một nhánh đã chia sẻ? → Giải mã: Nhánh đã push lên máy chủ chung và có người khác pull vào không được rebase; dùng merge hoặc revert (xem Bài L22).",
    "Làm sao hoàn tác một thay đổi đã lên production? → Giải mã: Revert tạo commit mới đảo ngược thay đổi, không viết lại lịch sử nên an toàn cho cả nhóm. Revert migration database cần migration đảo ngược riêng (xem Bài L17)."
  ],
  "predict": {
    "q": "Bạn rebase một nhánh đã được đẩy lên máy chủ chung và đồng nghiệp đã kéo về. Chuyện gì xảy ra với lịch sử của họ?",
    "a": "<p>Lịch sử phân kỳ. Các commit đã được viết lại thành commit mới với mã khác, nên nhánh trên máy đồng nghiệp và nhánh trên máy chủ không còn chung tổ tiên ở đoạn đó.</p><p>Khi họ pull, Git phải hợp nhất hai lịch sử và có thể tạo xung đột hoặc commit bị nhân đôi. Nếu họ vô tình push, lịch sử cũ quay trở lại. Đó là lý do quy tắc là: rebase chỉ dùng cho nhánh riêng chưa chia sẻ, còn nhánh đã chia sẻ thì dùng merge.</p>"
  },
  "anchor": "Rebase viết lại lịch sử nên chỉ an toàn trên nhánh riêng — viết lại nhánh đã chia sẻ là làm hỏng lịch sử của người khác.",
  "attacks": [
    {
      "q": "Làm sao hoàn tác một thay đổi đã lên production?",
      "a": "Nếu thay đổi đã được chia sẻ, bạn hoàn tác bằng revert: tạo commit mới đảo ngược thay đổi. Cách này không viết lại lịch sử nên an toàn cho cả nhóm. Chỉ viết lại lịch sử khi commit chưa từng được đẩy đi. Nếu thay đổi kèm migration database, revert mã không đảo được schema hay dữ liệu. Bạn cần migration đảo ngược riêng hoặc bước khôi phục dữ liệu, và đó là lý do thay đổi phá huỷ nên tách khỏi thay đổi mã."
    },
    {
      "q": "Làm sao giảm xung đột khi nhiều người cùng làm việc?",
      "a": "Có bốn thói quen tác động lớn nhất. Một là tích hợp thường xuyên, nhánh sống vài ngày chứ không phải vài tuần. Hai là chia nhỏ thay đổi theo chiều dọc, mỗi thay đổi chạm ít tệp. Ba là đừng format lại cả tệp trong cùng thay đổi logic, vì mọi dòng sẽ thành xung đột. Bốn là thống nhất quy ước đặt tên và cấu trúc thư mục, vì xung đột nặng nhất thường đến từ việc di chuyển và đổi tên tệp."
    }
  ],
  "q": "Khi nào bạn chọn merge, rebase, revert hay reset, và lệnh nào có nguy cơ mất dữ liệu cần cảnh báo?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Rebase nhánh đã push lên máy chủ chung để lịch sử sạch rồi force push; hoặc dùng reset --hard trên nhánh chung để bỏ commit sai.</p><p><strong>Vì sao hỏng:</strong> Rebase viết lại mã commit, lịch sử của đồng nghiệp phân kỳ và thay đổi của họ có thể bị ghi đè, mất mát chỉ phát hiện ba ngày sau trên production. Reset --hard mất luôn thay đổi trong working tree không có backup.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> rebase và reset --hard đều viết lại lịch sử nên chỉ an toàn với commit chưa từng chia sẻ; thay đổi đã lên production cần revert tạo commit mới đảo ngược, không viết lại lịch sử.</p><ul><li><strong>Mã commit đổi:</strong> rebase sao chép từng commit lên nền mới với mã khác, nhánh local của đồng nghiệp không còn chung tổ tiên ở đoạn đó.</li><li><strong>Revert thay reset:</strong> tạo commit đảo ngược, an toàn cho nhánh chung đã đẩy; revert không đảo được migration database cần migration đảo ngược riêng.</li><li><strong>Reflog cứu vãn:</strong> ghi mọi thay đổi HEAD, cứu commit bị reset trong thời gian lưu nên quy tắc là sao lưu nhánh trước khi reset.</li></ul>",
  "oral": "Bạn chọn theo hai câu hỏi: commit đã đẩy lên chưa, và bạn cần giữ lịch sử hay sửa sai an toàn. Merge giữ đầy đủ lịch sử phân nhánh, phù hợp nhánh tính năng đã chia sẻ. Rebase làm lịch sử thẳng và sạch, nhưng chỉ dùng cho nhánh riêng chưa đẩy, vì viết lại lịch sử đã chia sẻ gây rắc rối cho cả nhóm. Revert tạo commit đảo ngược nên an toàn cho nhánh chung. Reset di chuyển con trỏ nhánh và có thể xóa commit cùng thay đổi, nguy hiểm nhất khi dùng --hard trên nhánh đã đẩy. Trước khi rebase hay reset, tạo một nhánh sao lưu để luôn có đường lui.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Rebase</strong>: sao chép từng commit lên nền mới; lịch sử thẳng nhưng mã commit đổi. Chỉ an toàn trên nhánh riêng chưa chia sẻ.</li><li><strong>Revert</strong>: tạo commit mới đảo ngược thay đổi; an toàn cho nhánh chung đã đẩy.</li><li><strong>Reset</strong>: di chuyển con trỏ nhánh; dạng --hard xóa luôn thay đổi trong working tree.</li><li><strong>Reflog</strong>: nhật ký Git ghi mọi thay đổi HEAD; cứu commit bị reset trong một thời gian.</li></ul><p><strong>Trước Git.</strong> Team dùng SVN hoặc CVS với nhánh trung tâm, hợp nhất là một bước, và việc viết lại lịch sử gần như không tồn tại. Khi Git ra đời, rebase cho phép gọt nhánh rẽ thành dòng thẳng, nhưng cũng mở ra nguy cơ ghi đè thay đổi của người khác.</p><p><strong>Bốn lệnh.</strong></p><ul><li><code>merge</code> tạo commit hợp nhất và giữ nguyên lịch sử rẽ nhánh.</li><li><code>rebase</code> sao chép từng commit lên nền mới, lịch sử thẳng nhưng mã commit đổi.</li><li><code>revert</code> thêm commit đảo ngược thay vì xóa.</li><li><code>reset</code> di chuyển con trỏ nhánh; dạng <code>--hard</code> còn xóa luôn thay đổi trong working tree.</li></ul><p><strong>Quy tắc.</strong> Nhánh riêng thì rebase lên main mới. Nhánh đã chia sẻ chỉ dùng merge. Main deploy lỗi thì revert. Reset cứng chỉ dùng trên nhánh cá nhân sau khi đã có bản sao.</p><p><strong>Chỗ hay sai.</strong> Rebase rồi ép đẩy nhánh chung làm đồng nghiệp mất commit. Hoặc dùng reset cứng trên nhánh đã đẩy thay vì revert.</p><p><strong>Điều cần nói được.</strong> Merge giữ lịch sử phân nhánh; rebase chỉ an toàn trên nhánh riêng; revert an toàn trên nhánh chia sẻ; reset cứng nguy hiểm nhất. Khi lỡ tay, git reflog giữ vết các vị trí HEAD trước đó, thường khoảng 30 đến 90 ngày tùy cấu hình, nên bạn còn cơ hội tìm lại commit.</p><p><strong>Bài học nền tảng liên quan:</strong> Quy trình release và promotion (xem Bài L17, L22).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Giải conflict thế nào cho an toàn?",
      "a": "Bạn mở từng file conflict, hiểu cả hai phía thay vì chọn bừa một bên, giữ lại test liên quan, chạy lại lint và test rồi mới commit tiếp. Với rebase, bạn giải quyết từng commit một và dùng tiếp tục sau mỗi bước."
    },
    {
      "q": "Vì sao reset cứng nguy hiểm và cứu thế nào khi lỡ tay?",
      "a": "Vì reset cứng xóa commit khỏi nhánh và xóa thay đổi chưa commit. Bạn chỉ dùng khi chắc chắn có bản sao. Khi lỡ tay, bạn cần tìm lại mã commit qua nhật ký reflog nếu còn, nên quy tắc là sao lưu nhánh trước khi reset."
    }
  ],
  "pitfalls": [
    "Rebase rồi ép đẩy nhánh chung làm đồng nghiệp mất commit",
    "Dùng reset cứng trên nhánh đã đẩy thay vì revert an toàn"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được reflog giữ commit bị reset trong bao lâu và khi nào hết cứu được",
    "Tôi có thể giải thích bằng ví dụ chọn revert cho main đã deploy lỗi và reset cho nhánh riêng",
    "Tôi có thể xử lý một conflict merge thực tế mà không làm mất test của đồng nghiệp"
  ],
  "refs": [
    "gh-actions"
  ],
  "say30": "Hai câu hỏi quyết định: commit đã đẩy lên chưa, và bạn cần giữ lịch sử hay sửa sai an toàn. Merge giữ lịch sử phân nhánh, hợp nhánh tính năng đã chia sẻ. Rebase làm lịch sử thẳng nhưng chỉ dùng cho nhánh riêng chưa đẩy, vì viết lại lịch sử đã chia sẻ gây rắc rối cho cả nhóm. Revert tạo commit đảo ngược nên an toàn cho nhánh chung. Reset dạng --hard nguy hiểm nhất khi dùng trên nhánh đã đẩy. Trước khi rebase hay reset, tạo nhánh sao lưu.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Rebase và reset là hai lệnh viết lại lịch sử, và đó chính là mối nguy. Nhánh đã push cho đồng nghiệp pull vào mà bạn rebase rồi force push, lịch sử của họ bị phá và commit họ dựa vào biến mất. Nỗi đau lớn nhất là mất commit chung mà không ai kịp cảnh báo.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Merge tạo commit hợp nhất, giữ đầy đủ phân nhánh, an toàn cho mọi nhánh. Rebase sao chép từng commit lên nền mới, lịch sử thẳng nhưng mã commit đổi, chỉ an toàn trên nhánh riêng chưa chia sẻ. Revert tạo commit mới đảo ngược thay đổi, an toàn cho nhánh chung đã đẩy. Reset di chuyển con trỏ nhánh; --hard xóa luôn thay đổi trong working tree. Reflog cứu commit bị reset trong thời gian lưu.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Merge làm lịch sử dài và rối; rebase đòi kỷ luật không force push nhánh chung. Giám sát: kiểm tra commit đã push trước khi rebase; luôn tạo nhánh sao lưu trước reset; theo dõi reflog sau sự cố. (xem Bài L06, L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> merge giữ lịch sử an toàn; rebase làm lịch sử sạch và dễ đọc; revert cho đường lui không viết lại; reflog cứu khi reset sai.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> merge tạo nhiều commit hợp nhất; rebase đòi kiểm tra commit đã push chưa; reset --hard mất thay đổi trong working tree không có backup. (xem Bài L06, L22).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Luôn dùng merge, không rebase:</strong> hợp với team lớn thiếu kỷ luật; đổi lại lịch sử dài và khó đọc.</li><li><strong>Phương án B — Dùng git worktree để so hai nhánh trước khi hợp nhất:</strong> hợp khi cần kiểm tra xung đột trước; đổi lại không thay thế quy tắc rebase an toàn. (xem Bài L21, L22).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> đồng nghiệp báo commit mất sau force push; nhánh chung có commit trùng nội dung nhưng mã khác; số lần conflict tăng bất thường.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra reflog trước khi reset; so mã commit giữa nhánh local và remote; chạy git log --graph trên nhánh chung để phát hiện commit viết lại. (xem Bài L06, L22).</li></ul>"
},
{
  "id": "H12",
  "group": "H",
  "topic": "Xử lý sự cố và cải tiến từ phản hồi người dùng",
  "prio": "P2",
  "level": "L3",
  "type": "situation",
  "incident": "<p>Tình huống giả định: Người dùng báo qua kênh hỗ trợ rằng nút xuất báo cáo \"đôi khi không hoạt động\". Phiếu được chuyển cho đội kỹ thuật, nhưng không có mã lỗi, không có thời điểm, không có trình duyệt, và không ai tái hiện được. Phiếu nằm đó hai tuần. Khi có người thử lại với tài khoản của chính người báo, lỗi tái hiện ngay: báo cáo vượt quá thời gian chờ khi có hơn 50.000 dòng.</p>",
  "askFirst": [
    "Thông tin nào còn thiếu để biến báo cáo này thành việc làm được? → Giải mã: Mã lỗi, thời điểm, trình duyệt, dữ liệu. Biến báo cáo thành câu hỏi kiểm tra được bằng cách hỏi người báo vài câu cụ thể hoặc tái hiện bằng đúng tài khoản (xem Bài L17).",
    "Vì sao lỗi không tái hiện được ở môi trường của đội? → Giải mã: Lỗi phụ thuộc hình dạng dữ liệu hoặc phiên bản; môi trường dev có dữ liệu mẫu khác production. Dùng đúng tài khoản và dữ liệu của người báo trong môi trường an toàn (xem Bài L20).",
    "Sau khi sửa, làm sao biết sửa đúng và không lặp lại? → Giải mã: Ghi lại bản sửa nhỏ nhất có thể đo; đo lại chỉ số sau triển khai; nếu lỗi lặp lại, nâng thành vấn đề kiến trúc (xem Bài L22)."
  ],
  "predict": {
    "q": "Một báo cáo lỗi chỉ nói \"nút không hoạt động\". Bước đầu tiên bạn làm là gì?",
    "a": "<p>Biến nó thành câu hỏi kiểm tra được: lỗi xảy ra với tài khoản nào, lúc nào, trên dữ liệu nào, và trình duyệt nào. Cách nhanh nhất là hỏi người báo vài câu cụ thể, hoặc tái hiện bằng đúng tài khoản và dữ liệu của họ.</p><p>Phần lớn thời gian của một sự cố nằm ở chỗ hiểu sai vấn đề, không nằm ở chỗ sửa. Nếu backend trả về một request ID trong header như X-Request-ID, người báo chỉ cần gửi ID đó là bạn tra được log ngay.</p>"
  },
  "anchor": "Một báo cáo lỗi không tái hiện được không phải là vấn đề khó, mà là vấn đề chưa được mô tả đủ để trở thành câu hỏi kiểm tra được.",
  "attacks": [
    {
      "q": "Làm sao rút ngắn vòng lặp từ lúc người dùng báo tới lúc bạn hiểu vấn đề?",
      "a": "Bạn rút ngắn vòng lặp bằng cách thu đủ bằng chứng ngay từ lần báo đầu tiên. Có bốn việc, xếp theo chi phí tăng dần. Một là trả về một mã tham chiếu cho mỗi lỗi và yêu cầu người dùng gửi kèm, mã này tra ra được log tương ứng. Hai là ghi lại các hành động gần nhất của phiên để tái dựng đường đi. Ba là tái hiện với dữ liệu của chính người dùng trong môi trường an toàn, vì nhiều lỗi phụ thuộc vào hình dạng dữ liệu hơn là vào code. Bốn là cho phép gửi ảnh chụp hoặc bản ghi màn hình, vì với lỗi giao diện một ảnh nói rõ hơn cả đoạn mô tả."
    },
    {
      "q": "Sau khi sửa xong, làm sao đóng vòng lặp cho đúng?",
      "a": "Đóng vòng lặp không chỉ là deploy xong. Bạn xác nhận với chính người đã báo, trên đúng tài khoản và dữ liệu của họ, vì đó là người biết chắc lỗi đã hết. Bạn thêm một kiểm tra tự động để lỗi không quay lại, như test, ràng buộc hoặc cảnh báo. Cuối cùng trả lời vì sao lỗi không bị bắt sớm hơn và sửa khoảng trống đó nếu chi phí hợp lý. Điều cần tránh là đóng phiếu ngay sau deploy mà chưa xác nhận, vì nếu lỗi còn thì người dùng sẽ mất niềm tin vào kênh báo cáo."
    }
  ],
  "q": "Khi hệ thống gặp sự cố production và sau đó nhận nhiều phản hồi người dùng, bạn xử trí sự cố và biến phản hồi thành cải tiến thế nào?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Khi sự cố production, ngồi tìm nguyên nhân gốc trong lúc hệ thống vẫn chết; với phản hồi người dùng, làm theo phiếu to tiếng nhất thay vì phiếu lặp lại nhiều nhất.</p><p><strong>Vì sao hỏng:</strong> Thời gian giảm thiệt hại kéo dài trong khi downtime tiếp tục gây thiệt hại doanh thu. Phản hồi to tiếng nhất chưa chắc là phản hồi ảnh hưởng nhiều người nhất, nên nguồn lực bị lãng phí vào việc ít tác dụng nhất.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> sự cố có timeline cố định gồm bắt đầu, phát hiện, giảm thiệt hại, khắc phục và học bài; phản hồi phải được gom thành chủ đề và chấm điểm theo tần suất cùng mức ảnh hưởng trước khi sửa, không phải sửa theo cảm tính.</p><ul><li><strong>Giảm thiệt hại trước:</strong> dùng cờ tính năng hoặc rollback có kiểm soát trả lại dịch vụ, tìm nguyên nhân gốc sau khi hệ thống ổn.</li><li><strong>Gom phản hồi thành vấn đề:</strong> chấm theo tần suất, mức đau và số người ảnh hưởng trừ chi phí làm; làm bản sửa nhỏ nhất có thể đo rồi đo lại.</li><li><strong>Blameless post-mortem:</strong> báo cáo tập trung vào lỗ hổng quy trình kèm hành động có người chịu trách nhiệm, không đổ lỗi cá nhân.</li></ul>",
  "oral": "Khi sự cố xảy ra, ưu tiên là giảm thiệt hại trước, còn nguyên nhân gốc tìm sau. Bạn khoanh vùng ảnh hưởng, báo trạng thái rõ ràng, rồi dùng cờ tính năng hoặc rollback có kiểm soát để trả lại dịch vụ. Trong lúc đó thu thập log, metric và trace theo mốc thời gian để dựng lại chuỗi sự kiện. Khi hệ thống ổn, viết báo cáo sự cố gồm timeline, nguyên nhân gốc và hành động khắc phục, không đổ lỗi cho cá nhân. Với phản hồi người dùng, gom các phản hồi trùng nhau thành một vấn đề, chấm điểm theo tần suất và mức ảnh hưởng, làm bản sửa nhỏ nhất rồi đo lại. Đừng làm theo phản hồi to tiếng nhất.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Timeline</strong>: mốc thời gian chính xác của sự cố: bắt đầu, phát hiện, giảm thiệt hại, khắc phục, học bài.</li><li><strong>Blameless post-mortem</strong>: báo cáo tập trung vào lỗ hổng quy trình, không đổ lỗi cá nhân.</li><li><strong>Feature flag</strong>: công tắc bật/tắt tính năng để giảm thiệt hại nhanh khi sự cố.</li><li><strong>Rollback</strong>: quay lại phiên bản cũ; nhanh hơn sửa trực tiếp trên production.</li></ul><p><strong>Trước SRE.</strong> Sự cố được xử lý qua điện thoại với người trực. Phản hồi người dùng nằm trong email và không ai đo lại sau khi sửa. Khi downtime ảnh hưởng doanh thu, áp lực là giảm thiệt hại trước, rồi mới tìm nguyên nhân.</p><p><strong>Vòng xử lý sự cố.</strong> Gồm phát hiện, giảm thiệt hại, khắc phục và học sau sự cố. Bạn khoanh vùng ảnh hưởng, thông báo trạng thái rõ ràng, dùng cờ tính năng hoặc rollback có kiểm soát, song song thu thập log, metric và trace theo mốc thời gian.</p><p><strong>Phản hồi người dùng.</strong> Gom các phản hồi trùng nhau thành một vấn đề, chấm điểm theo tần suất và mức đau, rồi làm bản sửa nhỏ nhất và đo lại. Khi lỗi lặp lại sau khi chỉ sửa triệu chứng, nâng nó thành vấn đề kiến trúc.</p><p><strong>Điều cần nói được.</strong> Ưu tiên giảm thiệt hại trước, ghi timeline, viết báo cáo sự cố không đổ lỗi. Phản hồi người dùng phải gom nhóm và đo được sau khi sửa. Lỗi phổ biến là mải tìm nguyên nhân gốc trong lúc downtime, hoặc chạy theo phản hồi to nhất thay vì phản hồi lặp lại nhiều nhất.</p><p><strong>Bài học nền tảng liên quan:</strong> Post-mortem và học từ sự cố (xem Bài L17, L20, L22).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Báo cáo sự cố tốt gồm những gì?",
      "a": "Báo cáo gồm tóm tắt ảnh hưởng, timeline theo mốc thời gian, nguyên nhân gốc, hành động khắc phục ngay và hành động ngăn lặp lại có người chịu trách nhiệm và hạn xong. Báo cáo không đổ lỗi mà tập trung vào lỗ hổng quy trình."
    },
    {
      "q": "Bạn ưu tiên phản hồi người dùng thế nào khi nguồn lực có hạn?",
      "a": "Bạn gom phản hồi thành chủ đề, chấm theo tần suất, mức đau và số người ảnh hưởng, trừ đi chi phí làm. Bạn làm bản nhỏ nhất có thể đo được trước, rồi mở rộng khi số liệu cải thiện."
    }
  ],
  "pitfalls": [
    "Mải tìm nguyên nhân gốc trong lúc downtime thay vì giảm thiệt hại trước",
    "Làm theo phản hồi to nhất thay vì phản hồi lặp lại nhiều nhất"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được cách đặt mức độ sự cố và tiêu chí huy động theo từng mức",
    "Tôi có thể giải thích bằng ví dụ dùng cờ tính năng để giảm thiệt hại rồi viết báo cáo sự cố",
    "Tôi có thể biến một chùm phản hồi trùng lặp thành một cải tiến có số liệu đo sau triển khai"
  ],
  "refs": [
    "gh-actions",
    "docker-compose"
  ],
  "say30": "Khi sự cố production, ưu tiên là giảm thiệt hại trước, tìm nguyên nhân gốc sau. Bạn khoanh vùng ảnh hưởng, báo trạng thái rõ ràng, dùng cờ tính năng hoặc rollback có kiểm soát để trả lại dịch vụ. Trong lúc đó thu thập log, metric, trace theo mốc thời gian. Khi hệ thống ổn, viết báo cáo không đổ lỗi cá nhân. Phản hồi người dùng gom thành vấn đề, chấm điểm theo tần suất và mức ảnh hưởng, làm bản sửa nhỏ nhất rồi đo lại.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Khi downtime ảnh hưởng doanh thu, áp lực là giảm thiệt hại ngay, nhưng thói quen cũ là ngồi tìm nguyên nhân gốc trong lúc hệ thống vẫn chết. Nỗi đau thứ hai là phản hồi người dùng nằm rải trong email, không ai đo lại sau khi sửa, nên cùng một lỗi lặp lại nhiều lần.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Vòng xử sự cố có timeline gồm: bắt đầu, phát hiện, giảm thiệt hại, khắc phục, học bài. Blameless post-mortem tập trung vào lỗ hổng quy trình, không đổ lỗi cá nhân. Feature flag là công tắc bật tắt tính năng để giảm thiệt hại nhanh khi sự cố nằm ở tính năng mới. Rollback có kiểm soát nhanh hơn sửa trực tiếp trên production. Với phản hồi người dùng, gom phản hồi trùng thành một vấn đề, chấm điểm theo tần suất và mức ảnh hưởng, làm bản sửa nhỏ nhất có thể đo, đo lại chỉ số sau triển khai.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Rollback nhanh đòi cờ tính năng và quy trình deploy được đảo ngược; post-mortem tốn thời gian đội. Giám sát: thời gian từ phát hiện đến giảm thiệt hại, số sự cố lặp lại theo cùng nguyên nhân, tỉ lệ phản hồi được đo lại. (xem Bài L06, L10).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> timeline giữ thứ tự ưu tiên đúng; rollback có kiểm soát nhanh hơn sửa nóng; post-mortem blameless giữ đội dám nói thật; đo lại phản hồi chặn lỗi lặp.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> cờ tính năng thêm bề mặt cấu hình; post-mortem tốn thời gian sau sự cố; đo lại đòi chỉ số đã có sẵn. (xem Bài L06, L10).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Sửa trực tiếp trên production thay vì rollback:</strong> hợp khi lỗi nhỏ và rollback mất nhiều thời gian hơn sửa; đổi lại rủi ro cao hơn vì sửa không có kiểm thử.</li><li><strong>Phương án B — Dùng feature flag cho mọi tính năng mới:</strong> hợp khi muốn tắt được mọi tính năng bất cứ lúc nào; đổi lại thêm bề mặt cấu hình và chi phí vận hành. (xem Bài L21, L22).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> thời gian từ phát hiện đến giảm thiệt hại kéo dài; cùng nguyên nhân xuất hiện trong nhiều sự cố; phản hồi trùng lặp không được gom; chỉ số sau sửa không đổi hoặc tệ hơn.</li><li><strong>Cách kiểm chứng nhanh:</strong> so timeline thực tế với timeline mục tiêu; kiểm tra post-mortem có không có hành động đo lường được; đếm số phản hồi lặp lại trong ba tháng. (xem Bài L06, L10).</li></ul>"
},
{
  "id": "H13",
  "group": "H",
  "topic": "Deploy AWS từ CI: OIDC, ECR, tag bất biến, rollback",
  "prio": "P0",
  "level": "L2",
  "type": "situation",
  "incident": "<p>Tình huống giả định: 14h30, pipeline deploy lên production fail vì vai trò triển khai không có <code>ecr:PutImage</code>. Bạn bật lại và thấy vai trò đó còn đang dùng một access key dài hạn được dán vào một comment trong repo cách đây hai năm — key đó hiện nằm trong nhật ký của một nhánh tính năng bị xóa. Nếu key bị đánh cắp hôm qua, kẻ tấn công dùng được quyền của vai trò đó tới ECR, và key không có ngày hết hạn để tự vô hiệu.</p>",
  "askFirst": [
    "OIDC thay access key dài hạn như thế nào và điều kiện nào gắn kèm? → Giải mã: GitHub Actions xin id-token: write, gọi configure-aws-credentials với role-to-assume; AWS kiểm tra JWT qua trust policy (gắn điều kiện theo repo, branch) rồi cấp temporary credentials sống khoảng 1 giờ (xem Bài L14).",
    "Vì sao tag latest lại phá rollback? → Giải mã: Tag latest bị ghi đè mỗi lần push, không còn điểm neo để quay về. Tag bất biến theo commit SHA thì rollback chỉ là deploy lại đúng digest (xem Bài L22).",
    "Khi nào không nên dùng OIDC? → Giải mã: Khi bạn kiểm soát runner (tự dựng) hoặc cần debug thủ công, có thể dùng access key tạm thời. Quy tắc vẫn là khóa ngắn hạn và điều kiện chặt (xem Bài L02)."
  ],
  "predict": {
    "q": "CI đẩy image lên ECR báo lỗi trust policy dù cấu hình có vẻ đúng. Bạn đoán nguyên nhân ở đâu?",
    "a": "<p>Đây là lỗi điều kiện, không phải lỗi mật khẩu. Trust policy so sánh claim trong JWT với điều kiện bạn đặt: nhánh push không nằm trong danh sách, tên repo sai, hoặc OIDC provider ARN trỏ nhầm tài khoản.</p><p>Thiếu <code>ecr:PutImage</code> thì lỗi khác: bước lấy session tạm vẫn thành công, nhưng bước push bị từ chối. Đọc đúng bước báo lỗi giúp phân biệt hai trường hợp.</p>"
  },
  "anchor": "OIDC khóa mỗi phiên CI vào repo và nhánh bằng JWT ngắn hạn = không còn khóa dài hạn để lộ; tag bất biến theo commit SHA = rollback luôn biết ảnh nào là bản tốt.",
  "attacks": [
    {
      "q": "Vì sao không dùng lại access key dài hạn dù nó đơn giản?",
      "a": "Vì đơn giản chưa đủ an toàn. Access key dài hạn không có ngày hết hạn, nên khi bị đánh cắp nó dùng được cho tới khi bạn vô hiệu hóa. Với key tĩnh, CloudTrail khó cho biết lần gọi nào đến từ commit nào. OIDC đảo ngược điều đó: GitHub Actions phát hành JWT ngắn hạn, AWS đổi lấy temporary credentials sống khoảng một giờ, và trust policy gắn điều kiện theo repository, branch hoặc sự kiện. Xoay key cũ không cần ngừng dịch vụ: tạo key mới, cập nhật ứng dụng, vô hiệu hóa key cũ, theo dõi, rồi mới xóa."
    },
    {
      "q": "Làm sao rollback khi deploy thất bại?",
      "a": "Bạn gắn tag theo commit SHA trên repo ECR đã bật image tag immutability, và production trỏ vào digest sha256 mà ECR trả về. Rollback khi đó chỉ là deploy lại đúng digest đã biết là tốt, không build lại. Tag latest bị ghi đè mỗi lần push, nên dùng latest đồng nghĩa mất điểm neo để quay về."
    },
    {
      "q": "Khi triển khai nhiều môi trường hay nhiều tài khoản AWS, OIDC phức tạp thế nào?",
      "a": "Phức tạp hơn một chút, nhưng nguyên tắc không đổi. Bạn tách vai trò theo môi trường và tài khoản, mỗi vai trò có trust policy chỉ cho đúng nhánh cần thiết, và mỗi môi trường có ECR repo riêng. Khi cross-account, vai trò CI ở tài khoản nguồn gọi sts:AssumeRole vào vai trò triển khai ở tài khoản đích. Trust policy của vai trò đích phải liệt kê ARN của vai trò CI, còn vai trò CI phải có quyền sts:AssumeRole tới ARN đó. Nguyên tắc vẫn là ít đặc quyền nhất và điều kiện nhánh chặt."
    }
  ],
  "q": "Khi bạn triển khai AWS từ CI bằng GitHub Actions, làm sao dùng OIDC thay access key dài hạn, đẩy image lên ECR, tag bất biến theo commit SHA, và rollback an toàn?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Dán access key dài hạn của vai triển khai vào biến môi trường CI hoặc comment trong repo; deploy theo tag latest vì quen dùng.</p><p><strong>Vì sao hỏng:</strong> Key không có ngày hết hạn nên bị lộ trong nhật ký nhánh bị xóa vẫn dùng được tới khi ai đó vô hiệu hóa. Tag latest bị ghi đè nên rollback không có điểm neo, không biết chính xác commit nào đang chạy trên production.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> access key dài hạn không gắn với pipeline cụ thể và không tự hết hạn; OIDC dùng JWT ngắn hạn kèm trust policy theo repo và branch, tạm credentials sống khoảng một giờ nên lộ cũng không kịp dùng.</p><ul><li><strong>JWT ngắn hạn:</strong> GitHub Actions phát hành, AWS kiểm tra qua OIDC provider rồi cấp temporary credentials, không có khóa tĩnh tồn tại lâu.</li><li><strong>Trust policy điều kiện:</strong> gắn quyền theo repository và branch, nhánh không đúng danh sách không assume được vai.</li><li><strong>Tag bất biến theo commit SHA:</strong> bật immutability trên ECR, production trỏ digest sha256, rollback là deploy lại digest cũ đã biết là tốt.</li></ul>",
  "oral": "Deploy AWS từ CI không nên dùng access key dài hạn, vì key lộ ra thì có hiệu lực tới khi ai đó vô hiệu hóa nó. Cách đúng là OIDC: GitHub Actions phát hành một JWT ngắn hạn, AWS kiểm tra JWT qua IAM OIDC provider rồi cấp temporary credentials, thường sống khoảng một giờ. Trust policy của vai trò giới hạn theo repository và branch, nên chỉ đúng pipeline đó mới đảm nhận được vai trò. Job build khai báo id-token: write, gọi configure-aws-credentials với role-to-assume và aws-region, đăng nhập ECR bằng session tạm, rồi build và push image gắn tag theo commit SHA. Muốn tag bất biến, bật image tag immutability trên repo ECR, vì mặc định tag vẫn bị ghi đè. Sau khi push, ghi lại digest sha256 mà ECR trả về; production trỏ vào digest đó, không trỏ vào latest, nên rollback là deploy lại digest cũ. Khi deploy lỗi, kiểm tra điều kiện repo và branch trong trust policy, quyền ecr:PutImage của vai trò, và OIDC provider ARN. Nếu CI không hỗ trợ OIDC, vẫn phải tìm cơ chế cấp credentials ngắn hạn chứ không quay lại access key dài hạn.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>OIDC</strong>: OpenID Connect; GitHub Actions phát hành JWT ngắn hạn, AWS kiểm tra chữ ký rồi cấp temporary credentials.</li><li><strong>Access key dài hạn</strong>: khóa IAM không có ngày hết hạn; bị lộ thì dùng tới khi vô hiệu hóa.</li><li><strong>Tag bất biến</strong>: bật image tag immutability trên ECR; tag không bị ghi đè, digest định danh nội dung.</li><li><strong>Rollback</strong>: deploy lại đúng digest đã biết là tốt; không build lại từ source.</li></ul><p><strong>Trước OIDC.</strong> CI giữ access key dài hạn trong biến môi trường. Key lộ thì vẫn có hiệu lực tới khi ai đó vô hiệu hóa nó. Khi pipeline chạy trên runner của bên thứ ba và nhiều team cùng truy cập AWS, thói quen đó không còn an toàn.</p><p><strong>Cơ chế hôm nay.</strong> GitHub Actions phát hành JWT. IAM OIDC provider kiểm tra chữ ký, còn trust policy của vai trò cho phép sts:AssumeRoleWithWebIdentity kèm điều kiện repo và branch. AWS cấp temporary credentials có thời hạn; pipeline dùng chúng để đăng nhập ECR và push image.</p><p><strong>Tag và digest.</strong> Tag theo commit SHA chỉ bất biến khi repo ECR bật image tag immutability. Sau khi push, pipeline ghi lại digest sha256:... mà ECR trả về, và production chỉ trỏ vào digest đó.</p><p><strong>Chỗ hay sai.</strong></p><ul><li>Tin tag latest cho phép rollback, trong khi latest luôn bị ghi đè nên không còn điểm neo để quay về.</li><li>Cấu hình OIDC quá rộng cho mọi nhánh, khiến nhánh độc hại cũng đẩy được image lên ECR.</li></ul><p><strong>Điều cần nói được.</strong> OIDC thay access key dài hạn bằng session tạm. ECR bật image tag immutability. Production trỏ digest, không trỏ latest.</p><p><strong>Bài học nền tảng liên quan:</strong> CI/CD, OIDC và ECR (xem Bài L10, L14, L17, L22, L23).</p>",
  "code": "name: deploy\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    permissions:\n      # ✅ Cách làm chuẩn: cho job xin OIDC token, không cần access key dài hạn\n      id-token: write\n      contents: read\n    steps:\n      - uses: actions/checkout@v4\n      - uses: aws-actions/configure-aws-credentials@v4\n        with:\n          role-to-assume: arn:aws:iam::ACCOUNT:role/gh-actions-ecr\n          role-session-name: github-actions\n          aws-region: REGION\n      - name: Login to Amazon ECR\n        run: aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGION.amazonaws.com\n      - name: Build and push\n        run: |\n          # ✅ Cách làm chuẩn: tag theo commit SHA, repo ECR đã bật image tag immutability\n          docker build -t ACCOUNT.dkr.ecr.REGION.amazonaws.com/app:${{ github.sha }} .\n          docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/app:${{ github.sha }}\n      - name: Record digest\n        run: aws ecr describe-images --repository-name app --image-ids imageTag=${{ github.sha }} --query \"imageDetails[0].imageDigest\" --output text",
  "expected": null,
  "followups": [
    {
      "q": "Khi pipeline fail vì trust policy không khớp, bạn đọc lỗi ở đâu?",
      "a": "Bạn đọc CloudTrail của vai trò triển khai và tìm sự kiện AssumeRoleWithWebIdentity bị từ chối; thông báo thường nêu điều kiện repo hay branch không khớp. Bạn không đoán, vì cùng một pipeline có thể fail ở nhiều bước khác nhau."
    },
    {
      "q": "Image đã đẩy lên ECR rồi, sao rollback vẫn không chạy được?",
      "a": "Thường vì bước rollback không được phép AssumeRole vào vai trò triển khai, hoặc vì nó trỏ vào một tag mutable thay vì digest. Cần cho bước rollback quyền AssumeRole vào đúng vai trò với thời hạn đủ dài, và luôn trỏ bằng digest sha256."
    },
    {
      "q": "Làm sao biết image production là bản nào đã build từ commit nào?",
      "a": "Bạn ghi lại commit SHA và digest sha256 mà ECR trả về sau khi push. Digest định danh đúng nội dung image nên không đổi, và hệ thống deploy lưu digest đang chạy. Nhờ vậy không cần tag latest, và mỗi lần rollback biết chính xác ảnh nào đã chạy."
    }
  ],
  "pitfalls": [
    "Tin tag latest có thể rollback, trong khi latest luôn bị ghi đè nên không còn điểm neo để quay về",
    "Cấu hình OIDC quá rộng cho mọi nhánh nên một nhánh độc hại cũng có quyền đẩy image lên ECR",
    "Cho vai trò triển khai toàn bộ phép ecr:* thay vì chỉ các phép thật sự cần thiết"
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được JWT OIDC của GitHub chứa những claim nào và AWS kiểm tra chúng ra sao trong trust policy",
    "Tôi có thể giải thích bằng ví dụ một workflow build image tag theo commit SHA rồi đẩy lên ECR bằng session tạm",
    "Tôi có thể chuyển một pipeline đang dùng access key dài hạn sang OIDC + vai trò triển khai theo nhánh"
  ],
  "refs": [
    "gh-actions",
    "docker-security"
  ],
  "say30": "Deploy AWS từ CI không nên dùng access key dài hạn vì key lộ thì có hiệu lực tới khi ai đó vô hiệu hóa nó. Cách đúng là OIDC: GitHub Actions phát hành JWT ngắn hạn, AWS kiểm tra JWT qua IAM OIDC provider rồi cấp temporary credentials sống khoảng một giờ. Build và push image lên ECR gắn tag theo commit SHA, bật immutability. Rollback là deploy lại đúng digest đã biết là tốt, không build lại.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Access key dài hạn nằm trong biến môi trường CI nghĩa là key lộ ra thì dùng được tới khi vô hiệu hóa, không có hạn và không gắn với pipeline. Khi nhiều team chạy pipeline trên runner bên thứ ba, thói quen đó không còn an toàn. Nỗi đau là một key lộ là toàn bộ quyền IAM đi theo.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: OIDC thay access key bằng JWT ngắn hạn: GitHub Actions phát hành JWT, IAM kiểm tra chữ ký qua OIDC provider rồi cấp temporary credentials sống khoảng một giờ. Trust policy của vai trò giới hạn theo repository và branch, nên chỉ đúng pipeline đó mới đảm nhận được vai. Job build khai báo id-token: write, gọi configure-aws-credentials với role-to-assume và aws-region, đăng nhập ECR bằng session tạm, build và push image gắn tag theo commit SHA. Bật image tag immutability trên ECR để tag không bị ghi đè. Rollback là deploy lại đúng digest đã biết là tốt, không build lại từ source.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: OIDC thêm cấu hình trust policy và provider; scope quá rộng thì một nhánh độc hại cũng cầm quyền push ECR. Giám sát: audit IAM usage theo vai, kiểm tra trust policy chỉ mở cho đúng repo và branch, đối chiếu tag đang chạy với digest. (xem Bài L01, L02).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> JWT sống khoảng một giờ nên lộ cũng không kịp dùng; trust policy gắn quyền với đúng repo và branch; tag bất biến cho điểm rollback rõ; digest truy vết được.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> thêm cấu hình OIDC provider và trust policy; debug thủ công khó hơn vì không có key cố định; scope quyền phải thu hẹp theo đúng pipeline. (xem Bài L01, L02).</li></ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p><ul><li><strong>Phương án A — Access key tạm thời qua instance profile cho runner tự dựng:</strong> hợp khi bạn kiểm soát runner; đổi lại vẫn có key nằm trên đĩa runner.</li><li><strong>Phương án B — Giới hạn OIDC bằng path prefix và action cụ thể trong trust policy:</strong> hợp khi muốn thu hẹp hơn nữa; đổi lại cấu hình phức tạp hơn. (xem Bài L01, L23).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> audit IAM hiện vai được assume từ repo không trong danh sách; log ECR hiện tag bị ghi đè; digest image đang chạy không khớp với deploy log; quyền ecr quá rộng trên vai deploy.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra trust policy chỉ mở đúng repo và branch; đối chiếu digest image trên production với digest trong CI log; thử rollback bằng digest cũ và quan sát thời gian. (xem Bài L01, L02).</li></ul>"
}
);
