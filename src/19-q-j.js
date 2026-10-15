var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "J01",
  "group": "J",
  "topic": "Khung giới thiệu bản thân 60-90 giây",
  "prio": "P0",
  "level": "L1",
  "type": "situation",
  "incident": "<p>Vòng phỏng vấn cuối, 8h30 sáng, panel ba người. Khi được hỏi giới thiệu bản thân, bạn bắt đầu từ năm một đại học, liệt kê mọi khóa học và công cụ từng dùng. Phút thứ năm, người dẫn hỏi \"bây giờ chúng ta chỉ còn năm phút, bạn chọn kể điều gì quan trọng nhất?\" Bạn dừng lại giữa chừng, bỏ lỡ phần bằng chứng dự án RAG và phần khoảng trống AWS. Kết thúc buổi, một người panel ghi chú: \"vượt quá thời gian, thiếu trọng tâm.\"</p>",
  "askFirst": [
    "Đoạn nào trong 90 giây nên giữ bằng mọi giá khi bị cắt còn 30 giây? → Giải mã: giữ một con số và một câu nối với vị trí; bỏ dự án thứ hai và chi tiết hạ tầng (xem Bài L18).",
    "Nêu khoảng trống chủ động có rủi ro cao hơn để bị phát hiện giữa buổi không? → Giải mã: khoảng trống chủ động không giống giấu; nêu trước khi bị hỏi chuyển thế từ điểm yếu sang sở hữu (xem Bài L18)."
  ],
  "predict": {
    "q": "Bạn đoán panel sẽ nhớ gì sau khi nghe một lời giới thiệu kể lại CV theo trình tự thời gian thay vì theo vấn đề đã giải quyết?",
    "a": "<p>Họ nhớ ít nhất một chi tiết vì không có bằng chứng gắn với kết quả cụ thể. Khung hiệu quả là: 0-15 giây định vị, 15-45 giây hai bằng chứng có số, 45-70 giây hạ tầng và vận hành, 70-90 giây khoảng trống chủ động. Cắt còn 30 giây thì giữ một con số và một câu nối với vị trí, bỏ chi tiết dự án thứ hai và hạ tầng.</p>"
  },
  "anchor": "Kể CV theo trình tự thời gian mà không có khung tiêu chí = người nghe không có đủ ba câu trả lời trong đầu sau 90 giây.",
  "q": "Bạn hãy giới thiệu bản thân trong 60 đến 90 giây sao cho phù hợp với vị trí Fullstack Engineer?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Kể CV theo trình tự thời gian từ năm một đại học, liệt kê mọi khóa học và công cụ từng dùng; đến phút thứ năm mới nhận ra thời gian sắp hết.</p><p><strong>Vì sao hỏng:</strong> Vượt thời gian, thiếu trọng tâm, bỏ lỡ bằng chứng dự án RAG và phần khoảng trống AWS. Người nghe không có đủ ba câu trả lời trong đầu sau 90 giây nên không đánh giá được phù hợp hay không.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> sau 90 giây người phỏng vấn cần đủ ba câu trả lời: bạn từng làm gì, bạn giải quyết vấn đề gì, bạn có hợp với công việc không; kể theo CV không có khung tiêu chí nên người nghe không giữ nổi.</p><ul><li><strong>Bốn nhịp khung 90 giây:</strong> định vị, bằng chứng có số, hạ tầng, khoảng trống chủ động.</li><li><strong>Bằng chứng có số:</strong> nêu vấn đề đã giải quyết kèm kết quả cụ thể chứ không liệt kê công nghệ đã dùng.</li><li><strong>Khoảng trống chủ động:</strong> tự nêu điểm yếu trước và nối khoảng trống đó với việc team đang cần, giữ thế chủ động.</li></ul>",
  "oral": "Tôi làm backend Python và frontend JavaScript, tổng cộng khoảng năm năm. Phần API chủ yếu là Django và DRF, khi cần async và hiệu năng tôi chuyển sang FastAPI. Phần frontend tôi dùng React kèm TypeScript nên quen với state, hook và cách gọi API. Hạ tầng thì tôi đóng gói bằng Docker, tự viết pipeline build image, chạy migration và deploy, sau đó theo dõi log, metric và chi phí theo từng dịch vụ. Tôi cũng dựng một hệ thống RAG hybrid để tra cứu tài liệu nội bộ, kết hợp BM25 và vector trên pgvector, có reranking và bộ đánh giá. Tôi còn yếu ở trải nghiệm trực tiếp với AWS và với Vue, nên tôi đã dựng hạ tầng tương đương bằng Docker Compose để luyện trước. Tôi muốn vào đội để gia cố phần backend Python và hạ tầng, đồng thời lấp dần khoảng trống đó.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Khung 90 giây</strong>: bốn nhịp giới thiệu bản thân: định vị, bằng chứng, hạ tầng, khoảng trống chủ động.</li><li><strong>Bằng chứng có số</strong>: minh chứng gắn với kết quả cụ thể, không phải danh sách công nghệ.</li><li><strong>Khoảng trống chủ động</strong>: tự nêu điểm yếu trước và nối với nhu cầu của team.</li><li><strong>Screening so với technical round</strong>: hai vòng có độ sâu giới thiệu khác nhau.</li></ul><p><strong>Cấu trúc khung 90 giây:</strong></p><ol><li>0-15 giây: tên, số năm làm, stack chính, một câu định vị ngắn gọn về vai trò.</li><li>15-45 giây: hai bằng chứng cụ thể có hệ thống thật, nêu vấn đề đã giải quyết chứ không chỉ liệt kê công nghệ.</li><li>45-70 giây: hạ tầng và vận hành, Docker, pipeline, log, metric, chi phí.</li><li>70-90 giây: nói thẳng khoảng trống của bạn, rồi nối khoảng trống đó với việc team đang cần.</li></ol><p><strong>Vì sao khung này hiệu quả:</strong> sau 90 giây người phỏng vấn cần có đủ ba câu trả lời trong đầu: bạn từng làm gì, bạn giải quyết vấn đề gì, bạn có hợp với công việc không. Câu bốn, nói về khoảng trống một cách chủ động, giữ bạn ở thế chủ động thay vì bị hỏi thăm và lộ ra điểm yếu giữa buổi nói chuyện.</p><p><strong>Khi nào dùng và khi nào không dùng:</strong> ở vòng screening 20 phút bạn chỉ dùng 30 giây, ở vòng technical dài bạn dùng trọn 90 giây rồi để họ đào sâu từng ý. Nếu JD ghi rõ stack, bạn dồn thời gian vào phần trùng khớp nhất và cắt phần không liên quan. Nếu công ty chỉ cần người làm nhanh một module, bạn đổi trọng tâm từ kiến trúc sang tốc độ và độ ổn định.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn thể hiện ownership và trade-off trong quyết định thật (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Nếu buộc phải giới thiệu trong 30 giây thay vì 90 giây, bạn cắt phần nào?",
      "a": "Tôi cắt theo thứ tự: bỏ chi tiết dự án thứ hai, bỏ chi tiết hạ tầng, giữ lại một bằng chứng cụ thể nhất và câu nối với vị trí. Với 30 giây thì người nghe chỉ nhớ được một con số và một câu, nên tôi chọn bằng chứng có số liệu rõ như số lượng người dùng, số request mỗi ngày hoặc số lần deploy mỗi tuần, và kết bằng một câu về điều tôi muốn làm cùng team."
    },
    {
      "q": "Bạn tự nêu khoảng trống AWS và Vue ngay trong phần mở đầu có làm giảm cơ hội không?",
      "a": "Tôi nghĩ đây là rủi ro thấp hơn việc để họ phát hiện giữa buổi nói chuyện. Nếu tôi giấu và bị hỏi sâu ở phần kỹ thuật, tôi mất điểm về tính trung thực. Nếu tôi nói ngay, tôi kiểm soát được khung câu chuyện và kèm theo bằng chứng chuẩn bị, chẳng hạn hạ tầng tương đương dựng bằng Docker Compose và bài tập triển khai Lambda cùng API Gateway. Điều tôi tránh là nói khiêm tốn chung chung kiểu em còn học."
    },
    {
      "q": "Câu nào trong phần giới thiệu tạo ấn tượng nhất với bạn?",
      "a": "Câu nói về vận hành và chi phí. Hầu hết ứng viên dừng ở việc viết code, còn tôi hay kể việc sau khi code lên chạy thì theo dõi thế nào, phát hiện lỗi qua metric nào, và chi phí tăng lên do đâu. Câu đó cho thấy tôi hiểu sản phẩm là một hệ thống đang chạy chứ không phải một nhánh code còn chưa ai dùng."
    }
  ],
  "pitfalls": [
    "Kể lại CV theo thứ tự thời gian, không dẫn dắt người nghe vào điểm khớp với JD",
    "Dùng toàn tính từ quá mức, mỗi ý một mô tả dài khiến 90 giây chỉ đủ nói hai ý",
    "Giấu khoảng trống AWS và Vue, để bị hỏi thăm giữa chừng rồi trả lời lúng túng"
  ],
  "selfcheck": [
    "Tôi vẫn chưa chốt được câu mở đầu 10 giây sao cho khác biệt thay vì nghe chung chung như mọi ứng viên khác",
    "Tôi có thể kể lại trong 90 giây bằng ba bằng chứng cụ thể gắn với Django, FastAPI và pipeline Docker mà không đọc giấy",
    "Tôi có thể cắt còn 30 giây mà vẫn giữ được một con số và một câu nối với vị trí đang tuyển"
  ],
  "refs": [
    "mdn-http-overview",
    "aws-lambda-best"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> người nghe đủ ba câu trả lời trong 90 giây; khoảng trống được nói chủ động thay vì bị hỏi thăm giữa buổi; bằng chứng có số giữ trọng tâm đúng stack của vị trí.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> phải chuẩn bị số liệu và cắt phần không liên quan; vòng screening 20 phút chỉ dùng 30 giây nên phải có hai phiên riêng. (xem Bài L18).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở buổi phỏng vấn, ví dụ người phỏng vấn hỏi lại điều bạn đã bỏ qua hoặc ghi chú vượt thời gian thiếu trọng tâm.</li><li><strong>Cách kiểm chứng nhanh:</strong> tự ghi âm buổi mô phỏng và kiểm tra có đủ bốn nhịp trong 90 giây; nhờ đồng nghiệp kiểm tra ba câu trả lời còn trong đầu người nghe hay không. (xem Bài L18).</li></ul>"
},
{
  "id": "J02",
  "group": "J",
  "topic": "Feature end-to-end từ UI đến monitoring",
  "prio": "P0",
  "level": "L2",
  "type": "situation",
  "incident": "<p>Phỏng vấn vòng hai, bạn được hỏi \"kể một feature bạn đã làm đầy đủ\". Bạn kể phần UI: form lọc, bảng kết quả, trạng thái tải. Đến phần database, bạn nói \"có thêm index\" rồi dừng. Người phỏng vấn hỏi tiếp: \"index trên cột nào, thứ tự ra sao, bạn đã EXPLAIN chưa?\" Bạn không trả lời được. Sau đó bạn bị trượt vì thiếu bằng chứng về mắt xích dữ liệu từ UI xuống database và chi phí vận hành.</p>",
  "askFirst": [
    "Nếu chỉ kể được ba mắt xích trong năm (yêu cầu, hợp đồng dữ liệu, triển khai, quan sát, phản hồi), bạn chọn ba nào? → Giải mã: ba mắt xích chứng minh sở hữu vòng lặp là: triển khai (pipeline), quan sát (p95, 5xx), phản hồi (hành động khi alert) (xem Bài L22).",
    "Vì sao người phỏng vấn hỏi tiếp đúng mắt xích bạn dừng lại? → Giải mã: người phỏng vấn hỏi đúng mắt xích bạn dừng vì mắt xích đó chứng minh bạn vận hành thật hay chỉ viết code (xem Bài L18)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra khi kể feature thiếu mắt xích monitoring sau khi deploy?",
    "a": "<p>Người phỏng vấn hỏi đúng mắt xích đó: bạn đo p95 gì, theo dõi loại 5xx nào, chi phí truy vấn ra sao. Nếu thiếu, câu chuyện nghe như feature chỉ được viết code chứ chưa được vận hành. Kể đủ năm mắt xích chứng minh bạn sở hữu feature từ đầu đến cuối, không phải chỉ làm một đoạn.</p>"
  },
  "anchor": "Kể feature theo một đường đi dữ liệu mà không có tiêu chí quan sát = không chứng minh được mình đã vận hành chứ không chỉ viết code.",
  "q": "Hãy kể một feature bạn từng làm đầy đủ từ UI, API, database, deploy cho tới monitoring?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Kể feature chỉ phần UI: form lọc, bảng kết quả, trạng thái tải; tới phần database thì nói có thêm index rồi dừng.</p><p><strong>Vì sao hỏng:</strong> Người phỏng vấn hỏi tiếp index trên cột nào, thứ tự ra sao, đã EXPLAIN chưa, bạn không trả lời được. Câu chuyện thiếu bằng chứng vận hành nên nghe như chỉ viết code chứ chưa từng vận hành, trượt vì thiếu mắt xích dữ liệu.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> câu hỏi kiểm tra bạn có thực sự sở hữu feature từ đầu đến cuối hay chỉ làm một đoạn; thiếu mắt xích quan sát không chứng minh được đã vận hành chứ không chỉ viết code.</p><ul><li><strong>Năm mắt xích:</strong> yêu cầu, hợp đồng dữ liệu, triển khai, quan sát, phản hồi; kể đủ chứng minh sở hữu vòng lặp.</li><li><strong>Chỉ mục phải nêu được cột:</strong> EXPLAIN cho thấy truy vấn dùng đúng index, không đoán; đo lại sau khi tạo.</li><li><strong>Monitoring chủ động:</strong> theo dõi p95, 5xx, throughput và chi phí truy vấn theo ngày, kèm cảnh báo có runbook.</li></ul>",
  "oral": "Tôi từng làm chức năng lọc và xuất báo cáo doanh thu theo khoảng thời gian. Ở tầng UI tôi dựng form chọn khoảng ngày và bảng kết quả, xử lý trạng thái tải, lỗi và trường hợp rỗng riêng biệt, không để component gọi thẳng API. Ở tầng API tôi viết endpoint có phân trang, giới hạn khoảng thời gian tối đa và ghi log có request id để đối chiếu với log của tầng dưới. Ở tầng dữ liệu tôi thêm chỉ mục phù hợp với truy vấn lọc theo thời gian và trạng thái đơn, rồi đo bằng EXPLAIN trước khi lên production. Phần deploy đi qua pipeline: build image, chạy migration, canary nhỏ rồi mới tăng tải. Sau khi lên chạy tôi theo dõi độ trễ p95, tỉ lệ lỗi 5xx, số request và chi phí truy vấn theo ngày.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Feature</strong>: chức năng bạn sở hữu từ đầu đến cuối, không chỉ một phần.</li><li><strong>Năm mắt xích</strong>: yêu cầu, hợp đồng dữ liệu, triển khai, quan sát, phản hồi.</li><li><strong>Monitoring</strong>: theo dõi p95, 5xx, latency một cách chủ động chứ không chỉ \"nó chạy\".</li><li><strong>Index</strong>: cấu trúc tốc lên truy vấn; bạn phải nêu được cột nào.</li></ul><p><strong>Đây là gì:</strong> đây là câu hỏi kiểm tra bạn có thực sự sở hữu một feature từ đầu đến cuối hay chỉ làm một đoạn. Người phỏng vấn muốn nghe chuỗi liên kết giữa một quyết định ở UI với hậu quả ở database và chi phí vận hành.</p><p><strong>Cơ chế và lý do cần nó:</strong> một feature sống được vòng đời đi qua năm trạng thái: mô tả yêu cầu, hợp đồng dữ liệu, triển khai, quan sát và phản hồi. Nếu bạn kể thiếu một mắt xích, họ sẽ hỏi đúng mắt xích đó. Ví dụ nếu bạn chỉ nói có chỉ mục, câu hỏi tiếp sẽ là lấy cột nào, thứ tự cột ra sao và bạn đã đo EXPLAIN chưa.</p><p><strong>Khi nào dùng và khi nào không dùng:</strong> dùng mô tả theo đường đi của dữ liệu khi bạn cần chứng minh hiểu hệ thống, và dùng theo miền nghiệp vụ khi bạn không nhớ chi tiết kỹ thuật. Không nên kể một feature quá lớn trong 3 phút, và không nên chọn feature mà bạn chỉ tham gia một phần nhỏ. Nếu JD thiên về hạ tầng AWS, hãy chọn feature có đụng tới hàng đợi, lưu trữ hoặc triển khai tự động.</p><p><strong>Ví dụ cụ thể:</strong> nếu quyền truy cập khác nhau giữa khách hàng và nhân viên, hãy nói rõ bạn kiểm tra quyền ở tầng API chứ không phải ẩn nút ở UI, vì ẩn nút không phải bảo mật. Nếu xuất file lớn, hãy nói bạn đẩy job sang hàng đợi và trả về mã tác vụ, vì xử lý đồng bộ sẽ hết thời gian chờ của gateway.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn dựng feature từ UI xuống hạ tầng (xem Bài L18, L22).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn chọn chỉ mục cho truy vấn lọc theo khoảng thời gian và trạng thái như thế nào?",
      "a": "Tôi xuất phát từ câu SQL thật rồi xem EXPLAIN, không đoán. Với truy vấn lọc theo khoảng thời gian và một điều kiện trạng thái, tôi thường đặt cột thời gian trước vì nó có selectivity cao hơn, rồi cột trạng thái đứng sau. Nếu tỉ lệ trạng thái phân bố không đều, tôi cân nhắc partial index cho nhóm trạng thái phổ biến và loại bỏ những giá trị không ai lọc. Sau khi tạo index tôi đo lại cùng một câu truy vấn để so sánh số dòng đọc và thời gian thực tế."
    },
    {
      "q": "Monitoring sau khi deploy bạn cần những chỉ số nào và cảnh báo ở mức nào?",
      "a": "Tôi theo dõi tỉ lệ lỗi 5xx, độ trễ p95 và p99, throughput, và tỉ lệ lỗi 4xx để phân biệt lỗi máy chủ với lỗi phía người dùng. Tôi thêm metric nghiệp vụ như số tác vụ thất bại trong hàng đợi vì lỗi ở đó không hiện ra trên HTTP. Ngưỡng cảnh báo tôi đặt theo hành vi bình thường đã đo, ví dụ lỗi 5xx vượt 2 phần trăm trong 5 phút, và mọi cảnh báo phải có link tới dashboard và runbook để người trực xử lý được ngay."
    },
    {
      "q": "Nếu sau khi lên chạy truy vấn chậm hơn dự kiến, bạn xử lý theo thứ tự nào?",
      "a": "Tôi kiểm tra trước xem đây là lỗi code hay lỗi hạ tầng: xem log có lỗi không, đối chiếu độ trễ của database với độ trễ tổng, rồi kiểm tra traffic có đột biến không. Nếu tỉ lệ cache hit giảm thì tôi xem lại kích thước trang và TTL. Nếu lỗi nằm ở truy vấn, tôi mở EXPLAIN ANALYZE trên dữ liệu gần giống thực tế để xem estimate có lệch với thực tế không, thường là do index chưa được vacuum hoặc thiếu chỉ mục đúng cột. Nếu vẫn chưa rõ, tôi thêm log có thời lượng theo từng câu truy vấn thay vì đoán."
    }
  ],
  "pitfalls": [
    "Kể chỉ phần backend, bỏ mặt UI và monitoring nên nghe như chưa từng làm việc end-to-end",
    "Nhảy thẳng vào tên công nghệ mà không nói vấn đề gốc đã giải quyết",
    "Nói quá chi tiết một tính năng nhỏ khiến 3 phút trôi qua mà không có kết luận"
  ],
  "selfcheck": [
    "Tôi vẫn chưa chỉ ra được chỉ số nào trong bốn chỉ số cốt lõi thực sự phát hiện lỗi sớm nhất với hệ thống của tôi",
    "Tôi có thể kể lại feature báo cáo doanh thu theo đúng chuỗi UI, API, chỉ mục, pipeline và canary trong 3 phút",
    "Tôi có thể nhận ra ngay khi metric độ trễ tăng mà cảnh báo cũng tăng theo, và biết mở dashboard nào trước tiên"
  ],
  "refs": [
    "mdn-http-overview",
    "fastapi-tutorial",
    "dockerfile-ref"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> câu chuyện đủ năm mắt xích chứng minh sở hữu vòng lặp; index và EXPLAIN cho thấy quyết định dựa trên số liệu; canary nhỏ giảm rủi ro deploy.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> kể đủ năm mắt xích đòi 3 phút chuẩn bị; index thêm chi phí ghi và dung lượng; canary kéo dài thời gian triển khai. (xem Bài L22).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở buổi phỏng vấn, ví dụ người phỏng vấn hỏi đúng mắt xích bạn dừng lại và bạn không trả lời được.</li><li><strong>Cách kiểm chứng nhanh:</strong> tự kiểm tra có thể kể đủ năm mắt xích trong 3 phút; kiểm tra EXPLAIN có số dòng đọc thay đổi sau khi tạo index; kiểm tra p95 và 5xx có cảnh báo kèm runbook. (xem Bài L22).</li></ul>"
},
{
  "id": "J03",
  "group": "J",
  "topic": "Bảo vệ quyết định thiết kế bằng ownership và tradeoff",
  "prio": "P0",
  "level": "L3",
  "type": "situation",
  "incident": "<p>Trong buổi review, bạn đề xuất giữ truyQuery lọc theo múi giờ ở tầng database. Tech lead phản đối: \"cứ đưa về tầng ứng dụng cho dễ kiểm thử\". Bạn bảo vệ bằng câu \"theo tôi nhanh hơn\" mà không kèm số đo. Ba tiếng sau, cuộc họp kết thúc chưa ai chọn, feature trễ hai ngày. 200.000 yêu cầu xuất báo cáo bị chậm theo lịch, khách hàng phàn nàn qua hotline.</p>",
  "askFirst": [
    "Bạn cần phép đo nào để bảo vệ quyết định \"giữ ở database\" thay vì \"chuyển lên ứng dụng\"? → Giải mã: cần EXPLAIN, log độ trễ ở tải hiện tại và ước tính chi phí lưu trữ; không có số thì lập luận chỉ là ý kiến (xem Bài L20).",
    "Khi nào bạn nên nhường quyết định thay vì bảo vệ? → Giải mã: khi đối phương có dữ liệu bạn thiếu, hoặc quyết định ảnh hưởng hệ thống bạn không sở hữu; nhường không phải thua (xem Bài L18)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra khi bảo vệ quyết định thiết kế chỉ bằng cảm tính, không kèm tiêu chí đo được?",
    "a": "<p>Mọi phản biện đều hợp lý vì bạn không có dữ liệu để bênh mình. Quyết định trì hoãn, ai cũng tránh trách nhiệm. Cách đúng là nêu tiêu chí đo (độ trễ, chi phí, độ phức tạp), đưa ra phép đo cụ thể (EXPLAIN, log độ trễ, ước tính chi phí), nêu phương án đã cân nhắc và điều kiện khiến mình đổi ý.</p>"
  },
  "anchor": "Bảo vệ quyết định bằng cảm tính mà không có tiêu chí đo được = mọi phản biện hợp lý và quyết định không ai chịu trách nhiệm.",
  "q": "Khi bạn bảo vệ một quyết định thiết kế trước team, bạn trình bày ownership và tradeoff như thế nào?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Bảo vệ quyết định giữ truy vấn ở database bằng câu theo tôi nhanh hơn mà không kèm số đo; khi bị phản đối thì im lặng hoặc tranh luận cảm tính.</p><p><strong>Vì sao hỏng:</strong> Mọi phản biện đều hợp lý vì không có dữ liệu để bênh mình. Cuộc họp ba tiếng không ai chọn, feature trễ hai ngày, 200.000 yêu cầu xuất báo cáo bị chậm, khách hàng phàn nàn qua hotline.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> quyết định thiết kế chỉ được chấp nhận khi nêu được tiêu chí đo được gồm độ trễ, chi phí và độ phức tạp kèm phép đo cụ thể và điều kiện đổi ý; cảm tính không đủ bằng chứng nên ai cũng tránh trách nhiệm.</p><ul><li><strong>EXPLAIN và log độ trễ:</strong> cho thấy truy vấn dùng index nào, chi phí thực tế ở tải hiện tại, không phải đoán.</li><li><strong>Ownership rõ:</strong> nói rõ bạn chịu trách nhiệm phần nào và hậu quả gì nếu sai.</li><li><strong>Điều kiện đổi ý:</strong> nêu tải tăng gấp mười thì đo lại, độ trễ vượt ngưỡng thì chuyển sang tầng ứng dụng với bộ nhớ đệm.</li></ul>",
  "oral": "Tôi dùng bốn bước. Một, nói rõ tôi là người chịu trách nhiệm cho phần nào và tôi sẽ chịu hậu quả gì nếu sai. Hai, đưa ra lựa chọn của tôi kèm tiêu chí chọn, ví dụ độ trễ, chi phí, độ phức tạp vận hành. Ba, nói rõ tôi đã cân nhắc phương án nào khác và vì sao tôi loại. Bốn, mời phản biện và đề xuất cách kiểm chứng quyết định trong thời gian ngắn. Ví dụ một lần tôi chọn giữ truy vấn ở tầng database thay vì đưa sang tầng ứng dụng, vì dữ liệu chỉ vài triệu dòng và phần filter có điều kiện theo múi giờ. Tôi nói rõ nếu tải tăng gấp mười thì sẽ đo lại, và nếu độ trễ vượt ngưỡng thì sẽ chuyển sang chuyển tầng ứng dụng với bộ nhớ đệm. Như vậy tôi không bảo vệ lựa chọn của mình, tôi bảo vệ một tiêu chí đã nêu rõ.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Trade-off</strong>: mọi lựa chọn có cái giá; nêu giá trước khi chốt.</li><li><strong>Tiêu chí đo được</strong>: độ trễ, chi phí, độ phức tạp; không phải \"theo tôi\".</li><li><strong>Ownership</strong>: bạn là người nhận hậu quả nếu quyết định sai.</li><li><strong>EXPLAIN</strong>: kế hoạch database dùng để chạy truy vấn; đọc nó trước khi nói \"nhanh hơn\".</li></ul><p><strong>Đây là gì:</strong> đây là câu hỏi về kỹ năng kỹ thuật được bọc trong kỹ năng con người. Người phỏng vấn muốn biết bạn có đứng sau quyết định của mình hay chỉ trôi theo số đông, và bạn có chịu trách nhiệm khi nó sai không.</p><p><strong>Cơ chế của một lập luận tốt:</strong> quyết định thiết kế chỉ được chấp nhận khi có tiêu chí đo được. Nếu bạn nói giải pháp A nhanh hơn mà không có phép đo, mọi phản biện đều hợp lý. Bạn nên chuẩn bị sẵn phép đo: kết quả EXPLAIN, log độ trễ, ước tính chi phí lưu trữ, hoặc số giây thêm trong pipeline.</p><p><strong>Khi nào nên bảo vệ và khi nào nên nhường:</strong> hãy bảo vệ khi bạn có dữ liệu, khi khả năng sai là nhỏ và bạn đã nghĩ tới hậu quả. Hãy nhường khi đối phương có thông tin mà bạn thiếu, ví dụ áp lực deadline từ khách hàng hoặc ràng buộc vận hành mà bạn không nắm. Nhường một ý nhỏ để giữ quan hệ làm việc tốt hơn là giữ một ý đúng nhưng làm rạn nứt quan hệ.</p><p><strong>Thay đổi câu trả lời khi điều kiện đổi:</strong> nếu team nhỏ dưới năm người, bạn nên giảm số lựa chọn được trình bày và tăng phần phương án thực thi. Nếu hệ thống đã có hàng chục service và chuẩn bảo mật nghiêm, một lựa chọn tối ưu tốc độ có thể không đáng đổi thêm rủi ro vận hành. Nếu bạn chỉ mới vào team và chưa nắm bối cảnh, bạn nêu quan điểm rồi xin thêm dữ liệu, chứ không tranh luận.</p><p><strong>Lỗi thường gặp:</strong> biến cuộc tranh luận thành so sánh người, tranh cãi bằng chứng suông, hoặc lặp lại lập luận cũ khi đã có dữ liệu mới.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn dùng trade-off trong quyết định kiến trúc (xem Bài L18, L20).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn nói gì khi quyết định của mình cuối cùng vẫn sai và đã gây sự cố?",
      "a": "Tôi nói thẳng tôi đã sai ở chỗ nào và bổ sung dữ liệu nào đã lệch so với giả định ban đầu. Tôi không bào vệ bằng cách nói quyết định hợp lý với thông tin lúc đó, vì thông tin mới đã thay đổi bối cảnh. Sau đó tôi mô tả điều gì đã bị ảnh hưởng, thời gian khắc phục mất bao lâu và tôi thêm bước kiểm tra nào để lỗi loại đó không tái diễn. Kết thúc bằng việc nếu có quy trình review tốt hơn thì đã bắt được sai sót sớm hơn."
    },
    {
      "q": "Làm sao phân biệt bảo vệ quyết định với bám chặt vào cách làm cũ?",
      "a": "Tôi tự kiểm tra ba điều: lập luận của tôi có dựa trên dữ liệu đo được không, rủi ro tôi nêu ra có được đo sau khi triển khai không, và nếu phương án khác rẻ hơn thì tôi chấp nhận đổi vì lý do nào. Nếu tôi giữ một lựa chọn chỉ vì tôi đã viết nó, đó là bám chặt. Ngược lại, nếu tôi nêu được điều kiện khiến tôi đổi ý, thì tôi đang bảo vệ một tiêu chí chứ không bảo vệ ego."
    },
    {
      "q": "Bạn trình bày khác đi gì nếu quyết định ảnh hưởng trực tiếp tới khách hàng và dữ liệu thật?",
      "a": "Tôi tách bạch hai lớp: lớp kỹ thuật và lớp rủi ro vận hành. Với lớp kỹ thuật tôi trình bày tiêu chí và phép đo. Với lớp rủi ro tôi nói rõ dữ liệu nào bị tác động, có cần migration và rollback được không, và giai đoạn nào chỉ chạy cho một nhóm nhỏ trước. Khi có dữ liệu thật, tôi luôn kèm kế hoạch canary và câu hỏi ai là người duyệt trước khi mở rộng, thay vì chỉ tranh luận về hiệu năng."
    }
  ],
  "pitfalls": [
    "Bảo vệ quyết định bằng cảm tính, không kèm phép đo nào đo được",
    "Liệt kê nhiều phương án cùng lúc nên nghe như chưa từng phải chọn thứ gì",
    "Nhường bước quá sớm vì sợ gây khó chịu, rồi lặng lẽ làm ngược lại điều mình đề xuất"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết cách trình bày rõ tiêu chí ưu tiên khi phải cân đo giữa độ trễ, chi phí và độ phức tạp vận hành",
    "Tôi có thể kể lại một lần tôi đã đổi ý sau khi số liệu từ team đối tác cho thấy giả định của tôi sai",
    "Tôi có thể khoanh vùng điều kiện khiến mình sẽ đổi quyết định, thay vì giữ mình một cách mơ hồ"
  ],
  "refs": [
    "django-queries",
    "fastapi-tutorial"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> quyết định chốt trong buổi họp; ai cũng thấy tiêu chí và bằng chứng; có điều kiện đổi ý nên không biến thành bám chặt cách cũ.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> tốn thời gian chuẩn bị phép đo; nêu tiêu chí rõ ràng đôi khi bị phản đối nếu dữ liệu không đủ; phải chịu trách nhiệm khi quyết định sai. (xem Bài L20).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở buổi họp, ví dụ ai ghi nhận điều kiện đổi ý hoặc feature có trễ hai ngày không sau khi chốt.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra EXPLAIN có được chạy trước khi chốt; kiểm tra log độ trễ sau deploy có khớp ước tính không; kiểm tra ai chịu trách nhiệm khi quyết định sai. (xem Bài L20).</li></ul>"
},
{
  "id": "J04",
  "group": "J",
  "topic": "Điều tra bug production",
  "prio": "P0",
  "level": "L3",
  "type": "situation",
  "incident": "<p>3h12 sáng, dịch vụ xuất báo cáo đêm chậm dần. Cảnh báo p95 tăng từ 200ms lên 3s trong một giờ. 1.500 đơn cần xuất trước 6h bị trễ. Bạn mở dashboard: lỗi 5xx bằng không, throughput bình thường, nhưng số hàng trong bảng tạm tăng đều. Bạn hạ mức ưu tiên dịch vụ xuất để không chèn, rồi đọc log theo request id. Phần lấy dữ liệu vẫn 50ms; bước tổng hợp tăng dần vì câu truy vấn lấy toàn bộ lịch sử thay đổi trạng thái rồi lọc ở tầng ứng dụng.</p>",
  "askFirst": [
    "Tín hiệu nào trong dashboard khiến bạn loại giả thuyết \"hạ tầng sập\" trước khi đọc mã? → Giải mã: tỉ lệ 5xx phẳng trong khi p99 leo cho thấy lỗi ở tầng ứng dụng hoặc dữ liệu; 5xx vọt nhưng p99 thấp cho thấy gateway hoặc hạ tầng (xem Bài L10).",
    "Bạn làm gì trước khi đọc mã nguồn để biết lỗi nằm ở tầng nào? → Giải mã: xem timeline deploy, rồi tỉ lệ 5xx tách theo phiên bản, rồi mở một p99 trace xem thời gian kẹt ở đâu (xem Bài L13)."
  ],
  "predict": {
    "q": "Bạn đoán vì sao độ trễ tăng dần chứ không tăng đột ngột, và nguyên nhân gốc nằm ở đâu?",
    "a": "<p>Tăng dần vì dữ liệu tích tụ theo thời gian, không phải do một sự kiện điểm. Nếu p95 nhảy đột biến cùng lúc với deploy, nghĩ tới phiên bản mới. Nếu tăng dần mà lỗi bằng không, nghĩ tới bảng tăng kích thước: câu truy vấn lấy toàn bộ lịch sử rồi lọc ở ứng dụng. Sửa bằng cách đẩy điều kiện lọc xuống truy vấn, thêm chỉ mục đúng cột, rồi viết lịch dọn bảng và cảnh báo ngưỡng bản ghi.</p>"
  },
  "anchor": "Điều tra sự cố bằng đoán nguyên nhân mà không có ba nguồn metric, log và dữ liệu khớp nhau = chưa đủ bằng chứng để loại trừ tầng nào.",
  "q": "Kể một lỗi production bạn đã xử lý và mô tả cách bạn điều tra từ đầu đến cuối?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Nhảy thẳng vào giả thuyết nguyên nhân khi p95 tăng mà không có metric, log hoặc trace kèm; hoặc kể lại lỗi mà không nói mình đã làm gì để giảm thiểu.</p><p><strong>Vì sao hỏng:</strong> Không đủ bằng chứng để loại trừ tầng nào, chẩn đoán thành phỏng đoán. Nghe như chỉ biết sửa mã, không biết vận hành; 1.500 đơn xuất trước 6h bị trễ vì thời gian điều tra quá dài.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> sự cố được giảm thiểu trước và hiểu sau; độ trễ tăng dần chứ không đột ngột gợi dữ liệu tích tụ theo thời gian, không phải sự kiện điểm, nên giả thuyết đúng phải khớp hình dạng đường metric.</p><ul><li><strong>P95 tăng dần không lỗi:</strong> bảng tạm tăng kích thước, câu truy vấn lấy toàn bộ lịch sử thay đổi trạng thái rồi lọc ở tầng ứng dụng.</li><li><strong>Request ID nối log, metric, trace:</strong> xem thời gian kẹt ở hop nào, xác nhận dữ liệu tăng theo thời gian chạy.</li><li><strong>Sửa tận gốc:</strong> đẩy điều kiện lọc xuống truy vấn, thêm chỉ mục đúng cột, viết lịch dọn bảng và cảnh báo ngưỡng bản ghi.</li></ul>",
  "oral": "Có một lần dịch vụ xuất báo cáo chậm dần sau mỗi đợt ca đêm. Tôi bắt đầu bằng cách xem dashboard: độ trễ p95 tăng dần chứ không tăng đột ngột, tỉ lệ lỗi vẫn bằng không, nhưng số hàng trong bảng tạm tính toán tăng đều. Tôi hạ mức ưu tiên dịch vụ xuất nhưng không tắt, rồi đọc log theo request id để xem thời gian nằm ở đâu. Kết quả cho thấy phần lấy dữ liệu vẫn nhanh nhưng bước tổng hợp chậm dần. Tôi kiểm tra mã, thấy có một câu truy vấn lấy toàn bộ lịch sử thay đổi trạng thái rồi lọc ở tầng ứng dụng, dữ liệu tăng dần theo thời gian. Tôi sửa bằng cách đẩy điều kiện lọc xuống truy vấn, thêm chỉ mục đúng cột, rồi triển khai. Sau đó tôi viết lại thao tác dọn bảng tạm theo lịch và thêm cảnh báo khi số bản ghi vượt ngưỡng. Bài học là cứu vãi phải đi kèm nguyên nhân gốc và một cơ chế ngăn tái diễn.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Dashboard</strong>: một màn hình có metric quan trọng, không phải 60 biểu đồ.</li><li><strong>Tỉ lệ 5xx</strong>: phần trăm request lỗi; tín hiệu đầu tiên khi có chuyện.</li><li><strong>p99 latency</strong>: phân vị 99; bắt nhóm người dùng tệ nhất mà trung bình che mất.</li><li><strong>Request ID</strong>: sợi chỉ nối một log, một metric và một trace.</li></ul><p><strong>Đây là gì:</strong> đây là câu hỏi đo năng lực vận hành. Người phỏng vấn theo dõi bạn ưu tiên tín hiệu nào trước, bạn giảm thiểu tổn thất ra sao, và bạn có sửa tận gốc hay chỉ vá triệu chứng.</p><p><strong>Cơ chế điều tra:</strong> sự cố được giảm thiểu trước và hiểu sau. Giảm thiểu có thể là hạ tải, tắt tính năng lỗi, tăng tài nguyên tạm thời, hoặc tăng hàng đợi để hệ thống không sập. Hiểu thì dựa trên ba nguồn: metric để biết phạm vi, log có request id để lần theo chuỗi gọi, và dữ liệu để xác nhận giả thuyết. Ba loại tín hiệu này phải khớp nhau mới đủ tin cậy.</p><p><strong>Khi nào dùng và khi nào không dùng:</strong> dùng mô tả theo timeline khi cần chứng minh khả năng hành xử dưới áp lực, và dùng theo nguyên nhân gốc khi người nghe muốn hiểu kỹ thuật. Không kể quá nhiều chi tiết cấu hình, và không kể một lỗi mà bạn chỉ là người nghe. Nếu lỗi do bên thứ ba, bạn nói rõ bạn làm gì để cô lập và giảm thiểu, không cần chỉ tên công ty.</p><p><strong>Thay đổi khi điều kiện đổi:</strong> nếu lỗi xảy ra đúng một giờ mỗi ngày, nghi phạm lịch chạy hoặc bảo trì; nếu chỉ xảy ra với một nhóm người dùng, nghi phạn dữ liệu đầu vào đặc biệt; nếu độ trễ tăng theo thời gian, nghi phạm tích tụ dữ liệu. Nếu bạn đã có cảnh báo từ trước, câu chuyện bắt đầu bằng việc xác nhận cảnh báo đúng, điều này cho thấy giám sát đang hoạt động chứ không chỉ trưa trưng.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn tổ chức observability từ một màn hình (xem Bài L10, L12, L13).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn làm gì để biết lỗi nằm ở tầng nào trước khi đọc mã nguồn?",
      "a": "Tôi dựng đường đi của một request thật qua từng tầng rồi so sánh thời gian từng đoạn. Nếu tổng thời gian tăng nhưng thời gian từng tầng riêng lẻ không đổi, khả năng cao là tích tụ ở hàng đợi hoặc thời gian chờ kết nối. Nếu thời gian của một tầng tăng theo tỷ lệ với lưu lượng, tôi nghĩ tới tài nguyên bị nghẽn. Tôi cũng đối chiếu số liệu của một phiên bản khác hoặc một region khác để xác nhận lỗi không nằm ở hạ tầng dùng chung."
    },
    {
      "q": "Vì sao câu chuyện kết bằng bài học và cơ chế ngăn tái diễn lại tạo ấn tượng?",
      "a": "Vì một sự cố đã xử lý không chứng minh năng lực, mà sự cố đã được chặn lại lần sau mới chứng minh. Người phỏng vấn muốn biết bạn có học từ dữ liệu hay chỉ sửa cho xong. Cơ chế ngăn tái diễn có thể là test hồi quy, cảnh báo có ngưỡng, quy trình review bắt buộc, hay tài liệu vận hành. Khi tôi kể được cả ba phần, người nghe hiểu rằng tôi xử lý sự cố như một quy trình, không phải như một sự kiện lẻ."
    },
    {
      "q": "Nếu bạn không tìm ra nguyên nhân trong 30 phút đầu, bạn làm gì?",
      "a": "Tôi dừng việc đoán nguyên nhân và chuyển sang giảm thiểu, đồng thời ghi lại những giả thuyết đã loại trừ kèm bằng chứng. Tôi nâng mức cảnh báo, bật log chi tiết hơn ở tầng nghi phạm và chuẩn bị phương án rollback vì nhiều lần giải pháp tạm thời lại gây sự cố thứ hai. Tôi cũng báo cho người quản lý để có người ra quyết định về việc công bố hay giới hạn phạm vi, vì ở mức ảnh hưởng lớn thì tốc độ thông tin quan trọng hơn việc tìm ra tên nguyên nhân."
    }
  ],
  "pitfalls": [
    "Kể lại lỗi mà không nói mình đã làm gì giảm thiểu, nghe như chỉ biết sửa mã",
    "Nhảy thẳng vào giả thuyết nguyên nhân mà không có metric hay log đi kèm",
    "Khoe lỗi do người khác gây ra, mất điểm vì người nghe muốn nghe phần xử lý của bạn"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết cách phân biệt chính xác độ trễ do hàng đợi với độ trễ do kết nối mạng chỉ bằng số liệu thô",
    "Tôi có thể kể lại lỗi bảng tạm toán không dọn bằng timeline và chỉ ra bằng chứng nào dẫn tới giả thuyết đó",
    "Tôi có thể chuẩn bị sẵn thao tác giảm thiểu và lệnh rollback trước khi bắt đầu điều tra một sự cố mới"
  ],
  "refs": [
    "mdn-http-overview",
    "django-queries"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> giảm thiệt hại trước khi hiểu nguyên nhân; request ID giúp khoanh vùng nhanh; sửa tận gốc kèm lịch dọn ngăn tái diễn.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> thêm cảnh báo đòi dashboard đủ; đẩy lọc xuống database tăng chi phí truy vấn ngắn hạn; lịch dọn bảng cần người chịu trách nhiệm. (xem Bài L10, L13).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> p95 tăng dần mà 5xx bằng không; số hàng trong bảng tạm tăng đều; thời gian tổng hợp tăng theo thời gian chạy chứ không tăng đột ngột.</li><li><strong>Cách kiểm chứng nhanh:</strong> đọc log theo request id xem thời gian nằm ở tầng nào; kiểm tra số bản ghi bảng tạm so với ngưỡng; kiểm tra EXPLAIN có truy vấn lấy toàn bộ lịch sử không. (xem Bài L10, L13).</li></ul>"
},
{
  "id": "J05",
  "group": "J",
  "topic": "Chiến lược kiểm thử unit, integration và e2e",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "incident": "<p>Sáng thứ Hai, pipeline CI xanh trên local nhưng production sập vì một câu SQL mới thêm thiếu ràng buộc uniqueness. 50.000 đơn hàng bị trùng trong 20 phút. Dev G nói \"unit test toàn pass\". Bạn kiểm tra: mọi test tính tiền đều mock database, không test câu SQL thật. E2E chỉ có một luồng đăng nhập, chưa bao giờ chạm tới bảng đơn hàng. Cả hai tầng bảo vệ đều bị bypass bởi mock.</p>",
  "askFirst": [
    "Tầng test nào nên bắt lỗi \"thiếu ràng buộc uniqueness trên SQL\"? → Giải mã: integration test chạy migration hoặc SQL thật trên database test là tầng bắt lỗi; unit test với mock không (xem Bài L09).",
    "Vì sao mock database che mất lỗi cú pháp SQL và chỉ mục? → Giải mã: mock database không parse SQL; chỉ lưu và trả object Python nên lỗi cú pháp và chỉ mục thiếu không bao giờ lộ (xem Bài L18)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra khi viết E2E cho mọi trường hợp biên thay vì dồn unit test vào logic nghiệp vụ?",
    "a": "<p>Bộ test phình, mỗi lần chạy mất cả giờ, dev bỏ chạy local. Khi pipeline đỏ, không ai phân biệt được lỗi thuộc tầng nào. Cách đúng: dồn logic tính tiền, thuế, phân quyền vào unit test nhanh; dùng integration test với database thật trong container cho SQL, transaction, ràng buộc; E2E chỉ giữ vài luồng quan trọng như thanh toán.</p>"
  },
  "anchor": "Mock database ở tầng integration mà không có truy vấn thật = lỗi SQL và ràng buộc không bao giờ bị phát hiện trước production.",
  "q": "Chiến lược kiểm thử của bạn thế nào, khi nào viết unit, khi nào viết integration và khi nào viết e2e?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Mock database trong unit test rồi khẳng định câu SQL đúng; viết E2E cho mọi trường hợp biên thay vì dồn logic nghiệp vụ vào unit test.</p><p><strong>Vì sao hỏng:</strong> Mock không parse SQL nên lỗi cú pháp và chỉ mục thiếu không bao giờ lộ trước production, 50.000 đơn trùng trong 20 phút như scenario. E2E phình, pipeline chậm, đội bỏ chạy test, mất niềm tin vào cả bộ kiểm thử.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> mock thay thế thứ cần kiểm tra thì che mất lỗi thật; integration test cần database thật trong container để bắt lỗi SQL và ràng buộc, unit test chỉ cho logic cô lập, E2E chỉ giữ vài luồng quan trọng.</p><ul><li><strong>Mock đúng chỗ:</strong> phụ thuộc ngoài không kiểm soát được thì mock, nhưng repository và truy vấn SQL không mock.</li><li><strong>E2E ít:</strong> chỉ giữ vài luồng quan trọng như thanh toán, tạo đơn; trường hợp biên dồn vào unit và integration.</li><li><strong>Chi phí tăng theo tầng:</strong> unit nhanh chạy mỗi lần lưu, integration chậm hơn chạy trong container, E2E chậm nhất chạy trên môi trường giống thật.</li></ul>",
  "oral": "Tôi chia theo tốc độ và chi phí. Unit test nhanh nhất, chạy mỗi lần lưu code, nên tôi dồn logic nghiệp vụ vào đó, đặc biệt là các thuật toán tính tiền, thuế và phân quyền, vì đây là chỗ sai một chút là hậu quả lớn. Integration test dùng cho các mối ghép mà unit test không chạm tới: truy vấn Django, transaction, gọi service ngoài, và tương tác với hàng đợi. Ở đây tôi dùng database thật trong container thay vì mock, vì phần lỗi hay nằm ở câu SQL và ràng buộc. E2E chỉ giữ cho vài luồng quan trọng như đăng nhập, thanh toán và tạo đơn, chạy trên môi trường giống thật. Tôi không viết E2E cho từng trường hợp biên vì bộ test sẽ chậm, đội sẽ bỏ dùng, và test hỏng nhiều sẽ làm mất niềm tin vào cả bộ kiểm thử.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Unit test</strong>: kiểm thử một hàm cô lập; nhanh nhưng không bắt lỗi cú pháp SQL.</li><li><strong>Integration test</strong>: chạy các thành phần thật cùng nhau; bắt lỗi schema và index.</li><li><strong>E2E test</strong>: mô phỏng người dùng thật; chậm nhưng bắt trọn vòng lặp.</li><li><strong>Mock database</strong>: bản giả trong bộ nhớ; che lỗi cú pháp SQL và chỉ mục thật.</li></ul><p><strong>Đây là gì:</strong> kiểm thử là tầng bảo vệ rẻ nhất khi lỗi được phát hiện sớm. Ba loại test khác nhau về tốc độ, độ sâu thực tế và chi phí bảo trì, và nhiệm vụ là chọn đúng tầng cho từng loại rủi ro chứ không phải viết thật nhiều test.</p><p><strong>Cơ chế:</strong> unit test gọi trực tiếp hàm hoặc lớp với đầu vào đã biết và khẳng định đầu ra, nhanh vì không chạm hạ tầng. Integration test dựng môi trường thật tối thiểu, ví dụ database trong container, để kiểm tra SQL, ràng buộc, transaction và hành vi khi tối ưu hoặc cache bật. E2E chạy luồng thật qua nhiều dịch vụ nên chậm và dễ gãy vì lý do ngoài mã nguồn.</p><p><strong>Vì sao cần chiến lược:</strong> tổng thời gian chạy quyết định tần suất chạy. Nếu bộ test chậm, người ta bỏ chạy local, rồi lỗi chỉ lộ ra ở production. Nguyên tắc thực tế là phần lớn test nhanh, một phần nhỏ test sâu, và mọi test đều phải ổn định, không phụ thuộc thứ tự chạy.</p><p><strong>Khi nào không dùng:</strong> đừng mock cơ sở dữ liệu rồi khẳng định câu SQL, vì khi đó bạn chỉ chứng minh chuỗi ký tự bạn viết khớp với chuỗi bạn mong đợi. Cũng đừng để E2E chạy trên dữ liệu thật của khách hàng. Với logic phụ thuộc thời gian hoặc ngẫu nhiên, hãy tiêm đồng hồ và hàm sinh giả để kết quả tất định.</p><p><strong>Thay đổi khi điều kiện đổi:</strong> nếu nhóm phát triển nhanh và hạ tầng CI giới hạn, bạn đẩy tỉ lệ E2E xuống và tăng mock tại biên. Nếu hệ thống xử lý tiền, bạn tăng cả coverage ở tầng nghiệp vụ và thêm test hồi quy cho mọi lỗi từng xảy ra, bất kể lỗi đó thuộc loại nào.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn cấu trúc test ở từng tầng (xem Bài L09, L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Khi nào mock là lựa chọn đúng và khi nào mock che mất lỗi thật?",
      "a": "Mock hợp lý khi phụ thuộc là dịch vụ ngoài mà bạn không kiểm soát, hoặc khi bạn cần kiểm thử các nhánh lỗi như timeout và trả về dữ liệu bẩn. Mock nguy hiểm khi thứ bị thay thế chính là phần bạn cần kiểm tra, ví dụ repository hay truy vấn SQL. Quy tắc thực tế: càng gần trái tim hệ thống càng phải test với thật, càng xa biên càng dễ mock. Nếu bạn mock một hành vi mà chưa từng quan sát ở hệ thống thật, bạn có thể đang kiểm thử một hành vi không tồn tại."
    },
    {
      "q": "Bạn làm gì khi bộ test chạy chậm và bắt đầu bị bỏ qua?",
      "a": "Tôi đo trước: test nào chiếm phần lớn thời gian, thường là E2E và test chạm nhiều dịch vụ ngoài. Tôi tách bộ test thành các tầng để chạy song song trên CI, di chuyển phần chậm sang pipeline đêm, và cắt bớt case trùng lặp trong E2E. Song song tôi cấm thêm test E2E mới nếu chưa bù lại bằng test nhanh ở tầng dưới. Sau đó tôi đo lại thời gian và tỉ lệ test bị bỏ qua, vì cải tiến chỉ có giá trị nếu thói quen chạy test thay đổi theo."
    },
    {
      "q": "Bạn có dùng coverage làm tiêu chí không?",
      "a": "Tôi coi coverage là tín hiệu dò tìm chỗ chưa được kiểm thử, không phải mục tiêu cần đạt. Đặt ngưỡng cao chỉ khiến mọi người viết test vô nghĩa cho các dòng không quan trọng. Tôi dùng coverage để tìm các nhánh lỗi chưa có test, nhất là trong code xử lý tiền hoặc phân quyền, và dùng danh sách test bị xóa trong review để phát hiện độ phủ đang giảm dần theo thời gian."
    }
  ],
  "pitfalls": [
    "Viết E2E cho mọi trường hợp biên khiến bộ test chậm và bị bỏ qua",
    "Mock cơ sở dữ liệu rồi khẳng định câu SQL, nên lỗi cú pháp hay chỉ mục không bao giờ bị phát hiện",
    "Tin rằng test nhiều hơn luôn tốt hơn, quên rằng bộ test giòn có chi phí bảo trì và làm mất niềm tin"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết cách đo và loại bỏ test chậm nhất trong bộ của mình mà không làm hỏng độ phủ",
    "Tôi có thể chỉ ra vì sao test chuyển khoản phải chạy ở tầng nghiệp vụ trong khi test gửi email thì chấp nhận mock",
    "Tôi có thể khi thấy pipeline đỏ vì test gãy cụ thể, biết nó thuộc tầng nào và xử lý theo đúng thứ tự ưu tiên"
  ],
  "refs": [
    "fastapi-tutorial",
    "django-queries"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> lỗi SQL và ràng buộc bị bắt trước production; pipeline xanh phản ánh thật thay vì mock che; bộ test không phình gây bỏ chạy.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> integration với database thật trong container chậm hơn mock; E2E đòi môi trường giống thật khó bảo trì; phải cân bằng thời gian chạy pipeline. (xem Bài L09, L18).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> pipeline xanh trên local nhưng production sập vì SQL thiếu ràng buộc; bộ test chậm dần và bị bỏ chạy; nhiều test E2E cho các trường hợp biên ít giá trị.</li><li><strong>Cách kiểm chứng nhanh:</strong> kiểm tra integration test có chạy migration và SQL thật trong container không; kiểm tra tỉ lệ E2E so với unit và integration; kiểm tra số lần pipeline bị bỏ qua vì chậm. (xem Bài L09, L18).</li></ul>"
},
{
  "id": "J06",
  "group": "J",
  "topic": "Trả lời trung thực khi chưa rành AWS và Vue",
  "prio": "P0",
  "level": "L3",
  "type": "situation",
  "incident": "<p>Phỏng vấn kỹ thuật, người hỏi: \"bạn deploy lên AWS thế nào?\" Bạn trả lời chung chung: \"tôi quen Docker nên tương tự\". 10 phút sau, họ hỏi sâu về IAM và CloudWatch bạn không theo kịp. Cùng buổi, bạn nói \"tôi chưa rành Vue\". Panel hai người trao đổi: \"đúng là giấu điểm yếu\". Bạn mất điểm trung thực dù kinh nghiệm Docker thực chất.</p>",
  "askFirst": [
    "Bạn tách rõ phần kinh nghiệm thật và phần chuẩn bị tương đương bằng cấu trúc nào? → Giải mã: \"tôi dựng X local làm cùng việc, đây là khác biệt thật, đây là cách tôi đang lấp\" là cấu trúc chuẩn (xem Bài L18).",
    "Khi nào nên thừa nhận khoảng trống thay vì che? → Giải mã: khi khoảng trống là lõi công việc hằng ngày và bạn đã bắt đầu lấp; giấu thì task đầu tiên sẽ hỏng (xem Bài L18)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra khi giấu khoảng trống AWS và Vue rồi bị hỏi sâu giữa buổi nói chuyện?",
    "a": "<p>Bạn mất điểm trung thực vì họ phát hiện bạn giấu. Nếu thừa nhận ngay phần mở đầu, bạn kiểm soát được câu chuyện: nêu nền tảng chuyển đổi được (Docker, pipeline, quan sát), nói đã chuẩn bị (hạ tầng tương đương Docker Compose, viết lại bài toán React sang Vue), và cam kết một việc kiểm chứng trong tháng đầu.</p>"
  },
  "anchor": "Giấu khoảng trống mà không có cấu trúc thừa nhận rõ = bị phát hiện giữa buổi và mất điểm trung thực dù kinh nghiệm thật có giá trị.",
  "q": "Bạn chưa dùng AWS và VueJS sâu như yêu cầu công việc, bạn sẽ trả lời câu hỏi này như thế nào?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Nói quen Docker nên deploy AWS tương tự khi được hỏi; giấu khoảng trống Vue và không nói rõ cách đang lấp.</p><p><strong>Vì sao hỏng:</strong> Bị hỏi sâu IAM và CloudWatch không theo kịp, panel trao đổi rằng ứng viên giấu điểm yếu. Mất điểm trung thực dù kinh nghiệm Docker có thật, vì nói quen Docker không thay được sự khác biệt vận hành giữa Docker Compose và AWS.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> khoảng trống chỉ được kiểm soát khi được nói trước theo công thức bốn nhát: thừa nhận rõ, chỉ ra nền tảng liên quan đã có, mô tả cách đã chuẩn bị, cam kết một việc kiểm chứng được; giấu thì bị phát hiện giữa buổi và mất điểm.</p><ul><li><strong>Experience tương đương:</strong> Docker Compose dựng API, worker, PostgreSQL, Redis; ánh xạ hàng đợi thành message broker, gọi sự kiện thành webhook.</li><li><strong>Khoảng trống chủ động:</strong> nói thẳng cái chưa biết và cái đang làm để lấp, nối với nhu cầu team.</li><li><strong>Câu kiểm chứng trong tháng đầu:</strong> một việc cụ thể như dựng một endpoint trên AWS kèm log và cảnh báo chi phí.</li></ul>",
  "oral": "Tôi tách rõ phần nào là kinh nghiệm thật và phần nào là kiến thức kèm thực hành tương đương. Kinh nghiệm thật của tôi là Python, Django, FastAPI, Docker và pipeline triển khai tự động. Với AWS tôi chưa có tài khoản production nên tôi không tạo bất kỳ sự cố nào trong production, tôi đã dựng chuỗi tương đương bằng Docker Compose gồm API, worker, PostgreSQL và Redis, rồi học cách ánh xạ từng khái niệm: hàng đợi khác message broker, gọi theo sự kiện khác webhook. Với Vue tôi chưa dùng trong dự án thật, tôi viết lại các bài toán quen bằng React và Vue: khi state dùng chung, khi nên tính lại giá trị, và cách tách phần dùng lại thành composable. Kỹ năng chuyển đổi giữa các framework đó tôi đã làm nhiều với React và Angular. Tôi không định giấu khoảng trống, và tôi sẵn sàng làm bài tập mà đội giao trong tuần đầu để chứng minh bằng kết quả chứ không bằng lời hứa.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Experience tương đương</strong>: thứ bạn tự dựng để lấp khoảng trống (Docker Compose thay cho AWS, ví dụ).</li><li><strong>Khoảng trống chủ động</strong>: nói thẳng cái chưa biết và cái đang làm để lấp nó.</li><li><strong>Câu nối</strong>: câu liên hệ khoảng trống của bạn với nhu cầu team.</li><li><strong>Minh bạch</strong>: nói trước khi bị hỏi khác hẳn với bị phát hiện.</li></ul><p><strong>Nguyên tắc:</strong> trả lời câu hỏi về khoảng trống theo công thức bốn nhát: thừa nhận rõ, chỉ ra nền tảng liên quan đã có, mô tả cách đã chuẩn bị, và cam kết một việc kiểm chứng được. Bốn nhát này biến một câu trả lời phòng thủ thành một câu trả lời có kế hoạch.</p><p><strong>Cấu trúc câu trả lời:</strong></p><ol><li>Nói thẳng giới hạn: tôi chưa triển khai thật trên AWS, tôi không muốn tạo ấn tượng sai.</li><li>Nêu nền tảng chuyển đổi được: quy trình triển khai, container, hàng đợi, cấu hình theo môi trường, quan sát hệ thống.</li><li>Nói đã làm gì: dựng hệ thống tương đương, đọc tài liệu chính thức, viết bài tập có kiểm chứng.</li><li>Cam kết một việc cụ thể trong tháng đầu để chuyển kiến thức thành kinh nghiệm.</li></ol><p><strong>Ánh xạ khái niệm là phần quan trọng nhất:</strong> nhiều khái niệm AWS chỉ là tên gọi mới của thứ bạn đã dùng. Hàng đợi khác với broker là khác cách xử lý khi người nhận chết giữa chừng và khác ngữ nghĩa xác nhận. Container khác với Lambda là khác ranh giới trách nhiệm về việc vá lỗi hệ điều hành và đặt giới hạn tài nguyên. Nếu bạn nói được các ánh xạ này, câu trả lời của bạn có trọng lượng dù thiếu từ khóa thương hiệu.</p><p><strong>Thay đổi khi điều kiện đổi:</strong> nếu JD yêu cầu chứng chỉ hoặc số năm cụ thể với AWS, bạn nói rõ điều đó là điều kiện bắt buộc và hỏi lại xem team có sẵn sàng đào tạo không. Nếu team đang trong giai đoạn chuyển sang serverless và không có người hướng dẫn, rủi ro cao hơn nhiều so với một team có người biết AWS sẽ review code của bạn. Nếu vị trí có thể chấp nhận người mạnh backend nhưng yếu frontend, hãy nói rõ bạn nhận phần backend trước và cam kết lịch cụ thể cho phần frontend.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn định vị khi có khoảng trống (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn định lấp khoảng trống AWS bằng cách nào nếu được nhận?",
      "a": "Tôi dùng cơ chế học theo việc thật: ngày đầu đọc tài liệu chính thức và dựng một dịch vụ nhỏ chạy thật, ví dụ API Gateway nối Lambda đọc và ghi S3, rồi thêm CloudWatch log và cảnh báo chi phí. Sau đó tôi dùng chính dịch vụ đó để phục vụ một phần việc của team. Tôi ghi lại những chỗ khác với Docker mà tôi thật sự bị mắc, vì đó đúng là danh sách học có giá trị thay vì đọc hết mọi dịch vụ của AWS."
    },
    {
      "q": "Vì sao bạn tin bản thân chuyển đổi nhanh giữa các framework frontend?",
      "a": "Vì khung lớn gần như không đổi: component có props và state, dữ liệu đi qua một luồng một chiều, và luôn có câu hỏi ở đâu nên nguồn sự thật. Phần khác nhau nằm ở hệ sinh thái và cách quản lý vòng đời, mà đó là thứ tôi học bằng cách đọc và dựng một bài toán nhỏ, không phải thứ mất nhiều tháng. Trong các dự án trước tôi cũng từng chuyển giữa nhiều framework, nên kinh nghiệm đó là thật chứ không phải suông."
    },
    {
      "q": "Bạn có sẵn sàng làm bài test tay không, và bạn sẽ đề xuất bài gì?",
      "a": "Tôi sẵn sàng, và tôi sẽ tự đề xuất để chứng minh chủ động. Với backend tôi đề xuất viết một endpoint FastAPI kèm test, đóng gói bằng Dockerfile nhiều tầng, rồi triển khai lên một môi trường thật và theo dõi log. Với Vue tôi đề xuất dựng một màn hình danh sách có phân trang, tìm kiếm và xử lý trạng thái tải, kèm kiểm thử bằng Vitest. Bài như vậy nhỏ, kiểm chứng được và đúng vào việc team cần trong hai tuần đầu."
    }
  ],
  "pitfalls": [
    "Nói dài dòng thừa về việc chưa biết, biến thành biện minh thay vì chuyển sang phần có thể đóng góp",
    "Vờ thành thạo, dùng tên dịch vụ AWS một cách máy móc khi chưa hiểu giới hạn vận hành của nó",
    "Chỉ nói sẽ tự học mà không đưa ra một việc cụ thể có thể kiểm chứng trong tháng đầu"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết rõ giới hạn vận hành thực tế của Lambda về thời gian chạy, bộ nhớ và số request đồng thời",
    "Tôi có thể giải thích ba khái niệm AWS bằng hệ thống tương đương tôi đã dựng bằng Docker Compose",
    "Tôi có thể nêu tên một bài tập cụ thể kéo dài một buổi và tự chấm điểm bằng log thật"
  ],
  "refs": [
    "aws-lambda-best",
    "dockerfile-ref"
  ],
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p><ul><li><strong>Được gì:</strong> giữ độ tin cậy bằng nói trước; kinh nghiệm Docker được chuyển thành kiến thức AWS thay vì giấu; cam kết kiểm chứng được rõ.</li><li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> thừa nhận khoảng trống tạo áp lực học nhanh; phải chuẩn bị hạ tầng tương đương tốn thời gian; cam kết kiểm chứng làm mất điểm nếu không hoàn thành. (xem Bài L18, L22).</li></ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p><ul><li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở buổi phỏng vấn, ví dụ người phỏng vấn hỏi sâu AWS và Vue bạn không theo kịp.</li><li><strong>Cách kiểm chứng nhanh:</strong> tự kiểm tra có thể giải thích ba khái niệm AWS bằng hệ thống Docker Compose đã dựng; kiểm tra cam kết kiểm chứng trong tháng đầu có được hoàn thành bằng log thật không. (xem Bài L18, L22).</li></ul>"
},
{
  "id": "J07",
  "group": "J",
  "topic": "Giới thiệu dự án RAG hybrid",
  "prio": "P1",
  "level": "L3",
  "type": "concept",
  "incident": "<p>Trong một buổi phỏng vấn, ứng viên trình bày dự án tìm kiếm tài liệu của mình trong bốn phút bằng cách liệt kê công nghệ: dùng mô hình nhúng, dùng cơ sở dữ liệu vector, dùng tìm kiếm từ khoá, kết hợp hai kết quả. Người phỏng vấn hỏi \"vì sao cần kết hợp hai cách thay vì chỉ dùng một\". Ứng viên trả lời rằng cách kết hợp cho kết quả tốt hơn, nhưng không nêu được trường hợp nào thì cách này thắng cách kia, cũng không có số liệu nào.</p>",
  "askFirst": [
    "Điểm nào trong dự án là quyết định kỹ thuật, không phải lựa chọn công nghệ? → Giải mã: quyết định dùng hybrid search thay vì chỉ vector là quyết định kỹ thuật; chọn Postgres hay Pinecone là lựa chọn công nghệ (xem Bài L18).",
    "Vì sao tìm kiếm từ khoá và tìm kiếm ngữ nghĩa thất bại ở những chỗ khác nhau? → Giải mã: tìm từ khóa thất bại với diễn đạt khác (\"fastest car\" không khớp \"quickest vehicle\"); tìm ngữ nghĩa thất bại với thuật ngữ chính xác (\"error 503\"); hybrid phủ cả hai (xem Bài L18).",
    "Số liệu nào chứng minh việc kết hợp là đúng? → Giải mã: metric là chất lượng retrieval: bao nhiêu lần tài liệu đúng nằm trong top 5; đo trước và sau thay đổi hybrid (xem Bài L18)."
  ],
  "predict": {
    "q": "Người phỏng vấn hỏi \"vì sao bạn kết hợp hai phương pháp tìm kiếm\". Câu trả lời nào mạnh hơn?",
    "a": "<p>Câu trả lời mạnh nêu ra một trường hợp cụ thể mà một phương pháp thất bại và phương pháp kia cứu được, kèm số liệu. Ví dụ: người dùng tra cứu mã lỗi chính xác thì tìm kiếm từ khoá thắng vì tìm kiếm ngữ nghĩa làm mờ ký hiệu; còn khi người dùng diễn đạt bằng lời thông thường không trùng từ nào với tài liệu thì tìm kiếm ngữ nghĩa thắng. Câu trả lời yếu là \"kết hợp cho kết quả tốt hơn\" — nó không nói được cơ chế, không nói được khi nào, và không có gì để kiểm chứng.</p>"
  },
  "anchor": "Kể một dự án là kể những quyết định kèm lý do và đánh đổi, không phải kể danh sách công nghệ đã dùng.",
  "attacks": [
    {
      "q": "Nếu chưa đo được chỉ số chất lượng tìm kiếm thì trình bày thế nào?",
      "a": "Trung thực về việc chưa đo, và nói rõ bạn sẽ đo cái gì. Bạn có thể mô tả tập đánh giá nhỏ mà bạn tự dựng — vài chục câu hỏi kèm tài liệu đúng — và cách bạn so sánh hai phương pháp trên đó. Điều này vẫn mạnh hơn nhiều so với một khẳng định không có cơ sở, vì nó cho thấy bạn biết chất lượng phải được đo chứ không phải cảm nhận. Và nếu bạn có quan sát định tính — ví dụ nhận ra tìm kiếm ngữ nghĩa hay bỏ sót mã lỗi — hãy nêu nó như một giả thuyết kèm cách kiểm chứng."
    },
    {
      "q": "Người phỏng vấn hỏi \"nếu làm lại, bạn đổi gì\". Bạn trả lời thế nào?",
      "a": "Chọn một quyết định cụ thể và nói rõ bạn đổi vì lý do gì, kèm điều bạn đã học được. Ví dụ: đáng lẽ nên dựng tập đánh giá trước khi chọn cách kết hợp, vì không có nó thì mọi điều chỉnh trọng số đều là phỏng đoán. Hoặc: đáng lẽ nên tách phần tiền xử lý tài liệu thành một bước riêng có thể chạy lại, vì khi đổi cách chia đoạn thì phải xử lý lại toàn bộ. Câu trả lời tốt cho thấy bạn rút ra được nguyên tắc, không chỉ kể lại một hối tiếc."
    }
  ],
  "q": "Bạn hãy trình bày dự án tra cứu tài liệu dùng RAG hybrid mà bạn đã tự xây, hoạt động ra sao?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Kể dự án RAG bằng cách liệt kê công nghệ: mô hình nhúng, cơ sở dữ liệu vector, tìm kiếm từ khoá, kết hợp hai kết quả, rồi dừng.</p><p><strong>Vì sao hỏng:</strong> Người phỏng vấn hỏi vì sao cần kết hợp hai cách thay vì chỉ dùng một, bạn trả lời cách kết hợp cho kết quả tốt hơn nhưng không nêu được trường hợp nào thì cách này thắng cách kia, cũng không có số liệu nào để kiểm chứng.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> kể một dự án là kể những quyết định kèm lý do và đánh đổi, không phải kể danh sách công nghệ đã dùng; hiệu quả hybrid phụ thuộc đặc điểm câu hỏi thật, không phải luôn tốt hơn.</p><ul><li><strong>BM25 và vector bổ khuyết:</strong> BM25 bắt chính xác mã lỗi và tên riêng; vector bắt câu hỏi diễn đạt bằng lời khác hẳn tài liệu; mỗi loại hỏng ở chỗ kia bù được.</li><li><strong>Trọng số hợp nhất và rerank:</strong> hợp nhất hai danh sách bằng điểm có trọng số, bước rerank loại đoạn không liên quan trước khi đưa vào LLM.</li><li><strong>Đo chất lượng retrieval:</strong> bao nhiêu lần tài liệu đúng nằm trong top 5, đo trước và sau thay đổi hybrid.</li></ul>",
  "oral": "RAG hybrid của tôi kết hợp hai cách lấy ứng viên, vì mỗi cách hỏng ở một chỗ khác nhau. BM25 chấm theo từ khóa nên bắt chính xác mã lỗi và tên hợp đồng, còn vector trên pgvector bắt được câu hỏi diễn đạt bằng lời khác hẳn tài liệu. Hai danh sách được hợp nhất bằng điểm có trọng số, rồi một mô hình xếp hạng lại loại đoạn không liên quan trước khi đưa vào mô hình sinh câu trả lời. Luồng này chạy trong LangGraph để mỗi bước có trạng thái rõ và thử lại được, còn job cập nhật chỉ mục đi qua Redis Streams để không chặn request. Tôi đo chất lượng bằng bộ câu hỏi mẫu có đáp án, xem tài liệu đúng có lọt vào danh sách không và câu trả lời có bám ngữ cảnh không.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>RAG</strong>: Retrieval-Augmented Generation; tìm trong kho tri thức rồi đưa cho LLM.</li><li><strong>Hybrid search</strong>: kết hợp tìm kiếm từ khóa (BM25) và ngữ nghĩa (vector); mỗi loại bắt cái loại kia bỏ sót.</li><li><strong>Reranking</strong>: lần thứ hai sắp lại kết quả top theo độ liên quan.</li><li><strong>pgvector</strong>: extension Postgres lưu và tìm vector trong cùng database.</li></ul><p>Bạn kể dự án bằng cách liệt kê công nghệ: mô hình nhúng, vector database, tìm kiếm từ khóa, rồi hợp nhất kết quả. Panel hỏi vì sao cần kết hợp hai cách thay vì dùng một. Bạn đáp kết hợp tốt hơn rồi dừng. Không có trường hợp cụ thể, không có số liệu nào.</p><p>RAG hybrid lấy ứng viên từ hai nguồn rồi xếp hạng lại trước khi sinh. BM25 chấm theo tần suất và độ hiếm của từ nên bắt trúng mã lỗi và tên hợp đồng. Tìm kiếm vector chấm theo khoảng cách cosin nên bắt được câu diễn đạt khác hẳn tài liệu. Lớp hợp nhất trộn điểm hai danh sách, lớp xếp hạng lại chấm từng cặp câu hỏi và đoạn văn để loại đoạn lạc đề.</p><p>Từ khóa thắng ở mã chính xác mà vector làm mờ, còn vector thắng ở câu hỏi nói cùng ý bằng từ khác. Ví dụ người dùng gõ mã HĐ-2024-118 thì BM25 trúng ngay còn vector trượt, ngược lại câu hỏi chính sách hoàn tiền diễn đạt vòng vo thì vector cứu được. Bạn đo bằng tập câu hỏi có đáp án, xem tài liệu cần thiết có lọt vào danh sách không, câu trả lời có bịa ngoài ngữ cảnh không, kèm độ trễ và token ngữ cảnh.</p><ul><li><strong>Dùng khi:</strong> tập câu hỏi thật có cả tra mã chính xác lẫn hỏi bằng lời thường.</li><li><strong>Không dùng khi:</strong> người dùng chỉ tra mã kho hoặc chỉ hỏi chuyện nghĩa, vì lúc đó một nhánh cộng xếp hạng lại đã đủ gọn.</li></ul><p>Khi kho tài liệu phình gấp mười hoặc câu hỏi đổi hẳn sang dạng khác thì đáp án đổi: bạn chạy lại bộ đánh giá và chỉnh trọng số trộn, thậm chí bỏ một nhánh thay vì giữ hybrid mặc định.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn trình bày dự án có quyết định kỹ thuật rõ ràng (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Vì sao cần kết hợp BM25 với tìm kiếm vector mà không chỉ dùng một trong hai?",
      "a": "Vì đặc điểm thất bại của chúng gần như bổ sung cho nhau. BM25 hiểu rõ từ khóa chính xác như mã số và tên hợp đồng, những thứ mà tìm kiếm theo nghĩa hay trượt khi từ đó hiếm hoặc không xuất hiện trong câu hỏi. Ngược lại, tìm kiếm vector bắt được các đoạn dùng từ hoàn toàn khác nhưng nói cùng một ý. Khi hệ thống có cả hai loại câu hỏi, dùng riêng một cách sẽ bỏ sót một nhóm, và bộ câu hỏi thật sẽ chỉ ra nhóm nào đang thiếu. Câu trả lời không nên là hybrid luôn tốt hơn, mà là hybrid tốt hơn ở tập câu hỏi có cả hai dạng."
    },
    {
      "q": "Đo chất lượng hệ thống RAG của bạn bằng cách nào?",
      "a": "Tôi có một tập câu hỏi mẫu kèm đoạn tài liệu đúng, và tôi đo nhiều tầng thay vì chỉ nhìn câu trả lời cuối. Tầng một là chất lượng truy hồi: tài liệu cần thiết có nằm trong danh sách ứng viên không, và xếp hạng của nó có đúng không. Tầng hai là chất lượng câu trả lời: có đúng ý không, có bịa thêm thông tin không có trong ngữ cảnh không. Ngoài ra tôi đo độ trễ toàn tuyến và số lượng token ngữ cảnh, vì một hệ thống trả lời đúng nhưng quá chậm và tốn kém vẫn không dùng được. Sau mỗi lần đổi mô hình hoặc tham số, bộ đánh giá được chạy lại để phát hiện hồi quy."
    }
  ],
  "pitfalls": [
    "Kể dự án theo danh sách công nghệ mà không nói bài toán người dùng và cách đo kết quả",
    "Nói tìm kiếm hybrid luôn tốt hơn, quên rằng hiệu quả phụ thuộc đặc điểm câu hỏi thật",
    "Nhảy từ ý tưởng thẳng tới triển khai, bỏ qua việc đánh giá chất lượng truy hồi"
  ],
  "selfcheck": [
    "Tôi vẫn chưa nói được chính xác tại sao xếp hạng lại giảm được câu trả lời bịa nội dung ngoài ngữ cảnh",
    "Tôi có thể giải thích lỗi truy hồi bằng một ví dụ câu hỏi chứa mã hợp đồng mà chỉ dùng vector thì trượt",
    "Tôi có thể chạy lại bộ đánh giá trên cùng tập câu hỏi để so sánh hai cấu hình truy hồi trước khi đổi chính"
  ],
  "refs": [
    "django-queries",
    "aws-lambda-best"
  ],
  "say30": "RAG hybrid của tôi lấy ứng viên bằng hai đường: BM25 bắt chính xác mã lỗi và tên riêng, còn vector trên pgvector bắt câu hỏi diễn đạt khác hẳn tài liệu. Hai danh sách được hợp nhất bằng điểm có trọng số, rồi một bước rerank loại đoạn không liên quan trước khi đưa vào mô hình sinh câu trả lời. Chất lượng được đo bằng bộ câu hỏi có đáp án chuẩn.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Tìm từ khóa một mình bỏ sót câu hỏi diễn đạt bằng lời khác, còn tìm vector một mình thì trượt các mã lỗi và tên hợp đồng chính xác. Dự án của tôi là hệ thống tra cứu tài liệu cần cả hai kiểu truy vấn trong cùng một ô tìm kiếm.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Mỗi truy vấn chạy song song qua BM25 và qua vector trong pgvector. Hai danh sách ứng viên được hợp nhất bằng điểm có trọng số, sau đó một bước rerank sắp lại top và loại đoạn không liên quan trước khi đưa vào LLM. Luồng được tổ chức bằng LangGraph để mỗi bước có trạng thái rõ và thử lại được; job cập nhật chỉ mục đi qua hàng đợi để không chặn request.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Hai đường tìm kiếm và rerank làm tăng độ trễ và chi phí mỗi truy vấn, còn chỉ mục vector phải đồng bộ với tài liệu gốc. Giám sát: tỉ lệ tài liệu đúng nằm trong top 5 trên bộ câu hỏi chuẩn, độ trễ từng bước, và số truy vấn trả về rỗng (xem Bài L09, L21).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p>\n<ul>\n  <li><strong>Được gì:</strong> BM25 bắt mã lỗi và tên riêng, vector bắt diễn đạt khác; rerank giảm đoạn nhiễu đưa vào LLM; pgvector để dữ liệu vector nằm cùng Postgres, bớt một hệ thống phải vận hành.</li>\n  <li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> hai đường truy vấn và một bước rerank làm tăng độ trễ và chi phí; chỉ mục vector phải đồng bộ khi tài liệu đổi; trọng số hợp nhất cần đo lại khi dữ liệu đổi (xem Bài L21).</li>\n</ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p>\n<ul>\n  <li><strong>Phương án A — Chỉ vector search:</strong> hợp khi tài liệu ít mã định danh và câu hỏi đều diễn đạt tự do; đổi lại mất khả năng khớp chính xác mã lỗi.</li>\n  <li><strong>Phương án B — Vector database chuyên dụng thay pgvector:</strong> hợp khi số vector lớn cỡ hàng trăm triệu và cần lọc phức tạp; đổi lại thêm một hệ thống phải sao lưu và vận hành (xem Bài L09).</li>\n</ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p>\n<ul>\n  <li><strong>Tín hiệu trong Log / Metric:</strong> tỉ lệ truy vấn trả về tài liệu không liên quan tăng; độ trễ bước rerank chiếm phần lớn thời gian; chỉ mục vector có số dòng khác bảng tài liệu gốc.</li>\n  <li><strong>Cách kiểm chứng nhanh:</strong> chạy bộ câu hỏi chuẩn, đo tài liệu đúng nằm trong top 5 khi tắt từng đường tìm kiếm; so số dòng chỉ mục với bảng nguồn; gắn request id từ API xuống từng bước retrieval (xem Bài L10).</li>\n</ul>"
},
{
  "id": "J08",
  "group": "J",
  "topic": "Tradeoff giữa hai lựa chọn công nghệ",
  "prio": "P1",
  "level": "L2",
  "type": "situation",
  "incident": "<p>Trong một buổi phỏng vấn thiết kế, ứng viên được hỏi nên chọn cơ sở dữ liệu quan hệ hay cơ sở dữ liệu khoá-giá trị cho một tính năng lưu lịch sử xem tài liệu. Ứng viên chọn khoá-giá trị vì \"nhanh hơn và dễ mở rộng hơn\". Khi được hỏi cần truy vấn \"ai đã xem tài liệu này trong tuần qua\" thì ứng viên không trả lời được, vì cấu trúc khoá đã chọn không hỗ trợ truy vấn đó.</p>",
  "askFirst": [
    "Truy vấn nào sẽ chạy thường xuyên nhất? → Giải mã: truy vấn chạy hàng nghìn lần mỗi ngày và lọc theo đúng nhóm cột là truy vấn index xây cho nó (xem Bài L08).",
    "Lựa chọn này làm truy vấn nào trở nên đắt? → Giải mã: composite index (a, b) phục vụ truy vấn lọc a rồi b; truy vấn lọc b đơn lẻ không dùng được index đó (xem Bài L20).",
    "Nếu yêu cầu truy vấn thay đổi thì sao? → Giải mã: khi pattern truy vấn đổi, index có thể vô dụng; quyết định gắn với mix truy vấn đã đo, không phải vĩnh viễn (xem Bài L08)."
  ],
  "predict": {
    "q": "Bạn chọn khoá là cặp người dùng và tài liệu, giá trị là thời điểm xem gần nhất. Truy vấn \"tất cả người dùng đã xem tài liệu X trong tuần qua\" có hiệu quả không?",
    "a": "<p>Không hiệu quả, và có thể phải quét toàn bộ bảng. Với khoá là người dùng, dữ liệu được phân tán theo người dùng, nên câu hỏi theo tài liệu không có đường tra cứu trực tiếp. Đây là điểm cốt lõi của cơ sở dữ liệu khoá-giá trị: bạn phải thiết kế khoá theo đúng câu hỏi sẽ hỏi, và một bảng chỉ phục vụ tốt một vài mẫu truy vấn. Nếu cần hỏi theo cả hai chiều, bạn phải ghi dữ liệu hai lần với hai khoá khác nhau, chấp nhận chi phí ghi và nguy cơ lệch dữ liệu.</p>"
  },
  "anchor": "Cơ sở dữ liệu khoá-giá trị buộc bạn chọn khoá theo câu hỏi sẽ hỏi, nên phải biết trước các mẫu truy vấn trước khi chọn nó.",
  "attacks": [
    {
      "q": "Vậy làm sao trình bày một quyết định công nghệ cho thuyết phục?",
      "a": "Nêu bốn phần theo thứ tự.\nMột là yêu cầu cụ thể: khối lượng, mẫu truy vấn, yêu cầu nhất quán, ngân sách độ trễ.\nHai là các lựa chọn đã cân nhắc và tiêu chí loại.\nBa là lựa chọn đã chọn kèm lý do gắn với yêu cầu ở phần một.\nBốn là điều bạn phải chấp nhận — chi phí, giới hạn, và khi nào bạn sẽ phải đổi. Phần bốn là phần hay bị bỏ qua nhất và cũng là phần chứng minh bạn thật sự đã suy nghĩ chứ không chọn theo xu hướng."
    },
    {
      "q": "Nếu người phỏng vấn đổi một giả định — khối lượng tăng một trăm lần — bạn trả lời thế nào?",
      "a": "Chỉ ra phần nào của thiết kế chịu áp lực trước và cách xử lý theo thứ tự. Với khối lượng ghi tăng mạnh, thứ đầu tiên chịu áp lực thường là chỉ mục và chi phí ghi, nên cần xem lại số chỉ mục và cân nhắc ghi theo lô. Tiếp theo là tầng truy vấn, nơi có thể cần tách dữ liệu nóng khỏi dữ liệu lạnh hoặc thêm bản sao chỉ đọc. Cuối cùng mới là đổi công nghệ, vì đổi công nghệ là bước đắt nhất và thường không cần thiết. Trình bày theo thứ tự chi phí tăng dần cho thấy bạn tối ưu theo giá trị chứ không theo cảm hứng."
    }
  ],
  "q": "Hãy so sánh một lựa chọn bạn từng cân nhắc, ví dụ REST với GraphQL hoặc monolith với microservice, và nói rõ bạn chọn gì?",
  "naive": "<p><strong>Cách sai thường gặp:</strong> Chọn khoá-giá trị vì nhanh hơn và dễ mở rộng hơn mà không biết trước các mẫu truy vấn sẽ hỏi; hoặc chọn theo xu hướng công nghệ đang thịnh hành.</p><p><strong>Vì sao hỏng:</strong> Khi được hỏi ai đã xem tài liệu này trong tuần qua, bạn không trả lời được vì cấu trúc khoá đã chọn không hỗ trợ truy vấn đó, có thể phải quét toàn bộ bảng. Quyết định chọn theo cảm hứng không dựa trên mix truy vấn thật.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> cơ sở dữ liệu khoá-giá trị buộc bạn chọn khoá theo câu hỏi sẽ hỏi, nên phải biết trước các mẫu truy vấn; quyết định công nghệ bắt đầu từ mẫu truy vấn, không bắt đầu từ tên công nghệ.</p><ul><li><strong>Khoá theo câu hỏi:</strong> khoá là cặp người dùng và tài liệu thì truy vấn theo tài liệu không có đường tra cứu trực tiếp.</li><li><strong>Chi phí ghi và lệch dữ liệu:</strong> cần hỏi theo cả hai chiều phải ghi dữ liệu hai lần với hai khoá khác nhau, chấp nhận chi phí ghi và nguy cơ lệch.</li><li><strong>Thứ tự chi phí tăng dần:</strong> khối lượng ghi tăng mạnh thì xem lại chỉ mục trước, tách dữ liệu nóng lạnh sau, đổi công nghệ là bước đắt nhất.</li></ul>",
  "oral": "Tôi giữ monolith Django thay vì tách thành nhiều service, và lý do nằm ở đường đi của một request. Các module thường gọi nhau trong cùng một luồng người dùng, nên tách ra sẽ biến mỗi thao tác thành nhiều lời gọi mạng, mất giao dịch xuyên suốt và khó gỡ lỗi hơn. Tôi vẫn giữ một tiến trình nhưng tách sẵn ranh giới: mỗi module có bảng riêng, việc nặng chạy ở worker, và mọi giao tiếp ngoài đi qua hàng đợi. Với REST so với GraphQL, tôi chọn REST vì phần lớn API là vài chức năng CRUD. GraphQL chỉ đáng khi nhiều client cần tập trường khác nhau, còn không thì chi phí caching, giới hạn độ sâu truy vấn và giám sát lớn hơn lợi ích.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Index</strong>: cấu trúc tốc lên một kiểu truy vấn cụ thể; composite index theo đúng thứ tự cột.</li><li><strong>Query pattern</strong>: cột lọc, cột sắp xếp; index xây cho pattern này, không phải cho tất cả.</li><li><strong>Write amplification</strong>: mỗi index thêm làm chậm mỗi INSERT và UPDATE.</li><li><strong>Trade-off</strong>: tốc độ đọc so với tốc độ ghi so với dung lượng; nêu rõ tối ưu cái nào.</li></ul><p>Giữa buổi thiết kế, bạn chọn khoá-giá trị cho lịch sử xem tài liệu vì nhanh hơn và dễ mở rộng hơn. Panel hỏi tiếp ai đã xem tài liệu X trong tuần qua. Bạn cứng họng vì khoá đã chọn không trả lời được câu đó.</p><p>Quyết định công nghệ bắt đầu từ mẫu truy vấn, không bắt đầu từ tên công nghệ. Bạn nêu khối lượng, truy vấn nào chạy nhiều nhất, yêu cầu nhất quán, ngân sách độ trễ. Khoá-giá trị phục vụ tốt vài mẫu truy vấn đã biết trước, còn cơ sở dữ liệu quan hệ chịu được câu hỏi đột xuất kiểu lọc theo nhiều chiều.</p><p>Chọn theo truy vấn làm thiết kế trả lời được câu hỏi thật, còn chọn theo xu hướng làm bạn kẹt ngay câu hỏi thứ hai. Ví dụ bạn giữ monolith Django vì các module gọi nhau trong cùng một luồng người dùng, tách ra tạo thêm gọi mạng và mất giao dịch xuyên suốt. Với API bạn giữ REST vì phần lớn là CRUD, GraphQL chỉ đáng khi nhiều client cần tập trường khác nhau mà backend phải dựng endpoint chuyên biệt cho từng bên.</p><ul><li><strong>Dùng khi:</strong> bạn nêu được tiêu chí, phương án đã loại và cái giá phải trả.</li><li><strong>Không dùng khi:</strong> bạn chỉ có lý thuyết mở rộng mà không có dữ liệu tải thật.</li></ul><p>Khi khối lượng tăng gấp trăm lần thì đáp án đổi: phần chịu áp lực trước là chỉ mục và chi phí ghi, bạn tách đọc ghi và ghi hai chiều thay vì giữ một bảng duy nhất.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn quyết định trade-off database (xem Bài L08, L20).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn nói monolith nhưng vẫn chuẩn bị để tách, vậy ranh giới tách mà bạn chọn dựa vào đâu?",
      "a": "Tôi chọn ranh giới theo mức độ thay đổi độc lập và theo dữ liệu, không theo số module. Một phần được tách khi nó có chủ quyền dữ liệu rõ ràng, có chu kỳ phát hành riêng, và có nhu cầu mở rộng hoặc cô lập lỗi khác phần còn lại. Trước khi tách, tôi tách mã và dữ liệu ngay trong monolith: đặt ranh giới module, mỗi module tự truy cập bảng của mình, và mọi giao tiếp giữa module đi qua hàng đợi. Khi ranh giới đó đã chạy ổn định một thời gian, việc tách tiến trình mới là thay đổi kỹ thuật chứ không phải tái thiết kế. Nếu không làm bước trung gian đó, lần tách đầu tiên gần như luôn thất bại."
    },
    {
      "q": "Khi nào bạn sẽ khuyên đội chọn GraphQL thay vì REST?",
      "a": "Tôi khuyên khi có nhiều loại client khác nhau trên cùng một nguồn dữ liệu: web, mobile, và báo cáo, mỗi bên cần tập trường khác nhau và backend phải lặp lại nhiều endpoint chuyên biệt. Khi đó GraphQL loại bỏ phần dư thừa đó. Tôi không khuyên khi API chỉ phục vụ một client duy nhất, hoặc khi đội thiếu người giám sát chất lượng truy vấn, vì lúc đó chi phí cho giới hạn độ sâu, chống truy vấn quá nặng và kiểm soát cache sẽ lớn hơn lợi ích thu được."
    }
  ],
  "pitfalls": [
    "Chọn công nghệ vì đang thịnh hành, không nêu được tiêu chí nào dẫn tới lựa chọn",
    "Tranh luận bằng lý thuyết về khả năng mở rộng mà không có dữ liệu tải thật của hệ thống",
    "Đổi hướng kiến trúc giữa chừng dự án mà không nói rõ chi phí chuyển đổi và kế hoạch giai đoạn"
  ],
  "selfcheck": [
    "Tôi vẫn chưa nói được rõ điều kiện nào khiến monolith trở thành nút thắt thật sự trong dự án của tôi",
    "Tôi có thể giải thích vì sao REST hợp với đa số API CRUD bằng ví dụ endpoint báo cáo đã tốn nhiều vòng gọi thừa",
    "Tôi có thể đo được chi phí vận hành thêm của một lựa chọn trước khi áp dụng cho cả team"
  ],
  "refs": [
    "mdn-http-overview",
    "owasp-api-security"
  ],
  "say30": "Tôi chọn monolith cho sản phẩm hiện tại vì một request thường đi qua nhiều module trong cùng một luồng, tách service sẽ biến một thao tác thành nhiều lời gọi mạng và mất giao dịch xuyên suốt. Với REST và GraphQL, tôi chọn REST vì phần lớn API là CRUD; GraphQL chỉ đáng khi nhiều client cần tập trường khác nhau. Lựa chọn nào cũng phải nêu được điều nó làm đắt đi.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Khi chọn công nghệ, nỗi đau thường không nằm ở lựa chọn đúng hay sai mà ở chỗ không nói được cái giá đi kèm. Một quyết định như chọn khóa-giá trị cho lịch sử xem tài liệu sẽ trả lời tốt câu hỏi đọc theo khóa, nhưng khi bị hỏi ai đã xem tài liệu X thì không trả lời được.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Tôi viết quyết định theo chuỗi: thao tác nào chạy nhiều nhất, lựa chọn nào làm thao tác đó nhanh, và lựa chọn đó làm thao tác nào đắt đi. Với monolith so với microservice, tôi giữ một tiến trình nhưng tách sẵn ranh giới: mỗi module có bảng riêng, việc nặng chạy ở worker, giao tiếp ngoài đi qua hàng đợi. Với REST so với GraphQL, tôi tính cả chi phí caching và giới hạn độ sâu truy vấn.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Monolith dễ giao dịch và gỡ lỗi nhưng khó scale từng phần; ranh giới sẵn sàng giúp tách về sau nhưng tốn kỷ luật. Giám sát: số lần một thao tác nghiệp vụ gọi qua ba module trở lên, p95 theo endpoint, và số truy vấn chậm do chọn sai pattern truy cập (xem Bài L01, L18).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p>\n<ul>\n  <li><strong>Được gì:</strong> monolith giữ giao dịch xuyên module và đơn giản khi triển khai; REST với CRUD dễ cache, dễ hiểu, dễ kiểm thử bằng công cụ HTTP chuẩn.</li>\n  <li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> monolith khó scale riêng từng phần khi một module nóng; REST đôi khi trả thừa dữ liệu, còn GraphQL kéo theo caching phức tạp và cần giới hạn độ sâu truy vấn (xem Bài L18).</li>\n</ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p>\n<ul>\n  <li><strong>Phương án A — Tách microservice:</strong> khi một module có tải và nhịp phát hành khác hẳn phần còn lại và đội có năng lực vận hành; đổi lại mọi thao tác xuyên module thành lời gọi mạng có thể lỗi.</li>\n  <li><strong>Phương án B — GraphQL:</strong> khi web, mobile và đối tác cần các tập trường khác nhau từ cùng một dữ liệu; đổi lại phải đầu tư caching và kiểm soát truy vấn (xem Bài L18, L21).</li>\n</ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p>\n<ul>\n  <li><strong>Tín hiệu trong Log / Metric:</strong> một request sinh nhiều lời gọi nội bộ theo chuỗi; p95 của một endpoint tăng khi module khác nóng; truy vấn GraphQL có độ sâu bất thường.</li>\n  <li><strong>Cách kiểm chứng nhanh:</strong> đếm số lời gọi liên module cho một luồng nghiệp vụ; đặt giới hạn độ sâu và độ phức tạp cho truy vấn rồi thử truy vấn lồng; đối chiếu tỉ lệ cache hit của REST với các endpoint đọc nhiều (xem Bài L18).</li>\n</ul>"
},
{
  "naive": "<p><strong>Cách sai thường gặp:</strong> Nói không có câu hỏi nào khi người phỏng vấn hỏi cuối buổi; hoặc mở đầu bằng lương và ngày nghỉ trước khi hỏi về công việc.</p><p><strong>Vì sao hỏng:</strong> Không hỏi gì cho thấy không quan tâm đủ để tìm hiểu trước, người phỏng vấn ghi chú như vậy. Mở đầu bằng lương làm buổi phỏng vấn lệch sang hướng giao dịch thay vì hiểu công việc và đội.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> câu hỏi cuối buổi là bằng chứng cuối cùng về mức độ bạn đã tìm hiểu công việc; chuẩn bị hai ba câu cụ thể là cách rẻ nhất để kiểm soát ấn tượng đó, và thứ tự hỏi kỹ thuật trước văn hóa sau kể đúng câu chuyện bạn muốn kể.</p><ul><li><strong>Signal question:</strong> câu hỏi về trade-off trong review cho thấy bạn nghĩ theo hậu quả chứ không chỉ tính năng.</li><li><strong>Thứ tự câu hỏi:</strong> kỹ thuật liên quan rủi ro lớn nhất trước, văn hóa sau khi tech đã rõ.</li><li><strong>Kiểm tra độ tin bằng con số:</strong> hỏi p99 hiện tại là bao nhiêu; không trả lời được thì đáp mơ hồ chỉ là marketing.</li></ul>",
  "id": "J09",
  "group": "J",
  "topic": "Câu hỏi nên hỏi nhà tuyển dụng",
  "prio": "P1",
  "level": "L1",
  "type": "situation",
  "incident": "<p>Cuối buổi phỏng vấn, người phỏng vấn hỏi ứng viên có câu hỏi gì. Ứng viên nói không có. Người phỏng vấn ghi chú rằng ứng viên có vẻ không quan tâm tới công việc. Ở một buổi khác, ứng viên hỏi về lương và số ngày nghỉ trong câu hỏi đầu tiên, trước khi hỏi bất cứ điều gì về công việc.</p>",
  "askFirst": [
    "Câu hỏi của ứng viên truyền đạt điều gì? → Giải mã: câu hỏi về trade-off trong review cho thấy bạn nghĩ theo hậu quả chứ không chỉ tính năng (xem Bài L18).",
    "Câu hỏi nào nên hỏi trước, câu nào để sau? → Giải mã: hỏi kỹ thuật liên quan rủi ro lớn nhất của vị trí trước; câu hỏi văn hóa sau khi tech đã rõ (xem Bài L18).",
    "Làm sao biết một câu trả lời có đáng tin không? → Giải mã: hỏi một con số: \"p99 của các bạn bây giờ là bao nhiêu?\"; không trả lời được thì \"chúng tôi có monitoring tốt\" chỉ là marketing (xem Bài L18)."
  ],
  "predict": {
    "q": "Ứng viên nói \"không có câu hỏi nào\". Người phỏng vấn có thể suy ra điều gì?",
    "a": "<p>Ba cách diễn giải, và ứng viên không kiểm soát được cách nào sẽ được chọn. Có thể là ứng viên không quan tâm đủ để tìm hiểu trước. Có thể là ứng viên không chuẩn bị, điều này nói lên điều gì đó về cách làm việc. Có thể là ứng viên hiểu công việc chưa đủ sâu để biết cần hỏi gì, điều này lại chỉ ra mức độ tìm hiểu. Vì kết quả phụ thuộc vào suy đoán của người khác, việc chuẩn bị hai hoặc ba câu hỏi cụ thể là cách rẻ nhất để kiểm soát ấn tượng đó.</p>"
  },
  "anchor": "Câu hỏi bạn đặt ở cuối buổi phỏng vấn là bằng chứng cuối cùng về mức độ bạn đã tìm hiểu công việc.",
  "attacks": [
    {
      "q": "Ba câu hỏi nào bạn nên chuẩn bị?",
      "a": "Một câu về công việc thật: hai tuần đầu tiên trông như thế nào, và thành công được đo bằng gì. Một câu về đội và cách làm việc: quy trình review và triển khai ra sao, ai trực khi có sự cố. Một câu về phía hệ thống: phần nào của hệ thống đang gây khó chịu nhất cho đội. Ba câu này đều cho bạn thông tin thật để quyết định, và đều cho thấy bạn đang nghĩ về việc làm được việc chứ không chỉ được nhận."
    },
    {
      "q": "Khi nào thì hỏi về lương và phúc lợi?",
      "a": "Không phải câu đầu tiên, nhưng cũng không nên tránh. Nếu người phỏng vấn mở chủ đề, hãy trao đổi thẳng. Nếu không, hợp lý nhất là hỏi ở buổi cuối hoặc khi có trao đổi với bộ phận nhân sự, sau khi hai bên đã hiểu nhau về công việc. Điều nên tránh là để câu hỏi đầu tiên về lương, vì nó cho thấy động lực duy nhất là tiền — dù điều đó không sai, thứ tự vẫn truyền đạt thông tin. Và nếu bạn đã có một khoảng mong đợi, hãy chuẩn bị một con số cụ thể thay vì để mở."
    }
  ],
  "q": "Bạn sẽ hỏi những gì về khách hàng, sản phẩm, stack, onboarding và quy trình review khi phỏng vấn?",
  "oral": "Tôi hỏi bốn nhóm câu, mỗi nhóm chọn một đến hai câu, vì hỏi quá nhiều sẽ biến buổi phỏng vấn thành một bảng điền thông tin. Nhóm khách hàng và sản phẩm: đội đang phục vụ ai, và feature nào trong ba tháng tới tạo tác động lớn nhất. Nhóm stack và phiên bản: hệ thống chạy trên hạ tầng nào, có kế hoạch chuyển sang serverless không. Nhóm làm việc: vị trí này nghiêng về frontend hay backend, và khi nào tôi được giao phần việc đầu tiên. Nhóm quy trình: một feature đi từ lúc bắt đầu đến lúc lên chạy qua những bước nào và ai là người duyệt.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Signal question</strong>: câu hỏi cho thấy bạn quan tâm gì hơn CV.</li><li><strong>Thứ tự câu hỏi</strong>: kỹ thuật trước, văn hóa sau; nó kể câu chuyện bạn muốn kể.</li><li><strong>Cụ thể</strong>: \"P0 lúc 3 giờ sáng bạn xử lý ra sao\" tốt hơn \"team có giỏi ứng phó sự cố không\".</li><li><strong>Kiểm tra độ tin</strong>: một câu hỏi ngược kèm con số cho biết câu trả lời là thật hay đang bán hàng.</li></ul><p>Cuối buổi, panel hỏi bạn còn câu hỏi gì không. Bạn đáp không có gì. Một người ghi ứng viên có vẻ không quan tâm. Buổi khác, bạn mở đầu bằng lương và ngày nghỉ trước cả câu về công việc.</p><p>Câu hỏi cuối buổi là bằng chứng bạn đã tìm hiểu tới đâu. Bạn chuẩn bị ba câu gắn với việc thật: hai tuần đầu trông thế nào và thành công đo bằng gì, quy trình review và triển khai chạy ra sao, phần nào của hệ thống đang làm team khó chịu nhất. Mỗi câu cho bạn thông tin để quyết định, đồng thời cho thấy bạn nghĩ về làm được việc.</p><p>Hỏi về việc làm tạo ấn tượng quan tâm thật, còn hỏi chung chung hoặc chỉ hỏi quyền lợi tạo ấn tượng ngược. Ví dụ bạn hỏi đội phục vụ ai và feature ba tháng tới tác động lớn nhất là gì, hệ thống chạy trên dịch vụ nào và có kế hoạch chuyển serverless không, một feature đi từ lúc bắt đầu tới lúc lên chạy qua tay ai duyệt.</p><ul><li><strong>Dùng khi:</strong> bạn muốn sửa chỗ hiểu sai về công việc trước khi nhận.</li><li><strong>Không dùng khi:</strong> câu trả lời đã có trong mô tả công việc, vì hỏi lại lúc đó phí lượt hỏi quý giá.</li></ul><p>Khi trao đổi với nhân sự thay vì team kỹ thuật thì đáp án đổi: bạn chuyển sang hỏi bước tiếp theo, thời gian phản hồi và khung lương theo cấp bậc, thay vì xoáy vào kiến trúc.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn đọc mô hình vận hành thật của team (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn sẽ hỏi gì nếu biết chắc mình thiếu kinh nghiệm AWS của đội?",
      "a": "Tôi sẽ hỏi trong team có ai đã làm với dịch vụ mà tôi sẽ phụ trách không, khi nào có việc liên quan thật để tôi tham gia, và có quy ước review thế nào cho dịch vụ đó. Tôi cũng hỏi quy trình hạ tầng được mô tả bằng gì, là hạ tầng bằng mã hay thao tác tay, vì điều đó quyết định tốc độ tôi học. Tôi không hỏi có đào tạo không, vì câu đó nghe như đang chờ người khác sắp xếp cho mình, còn các câu trên cho tôi biết mình sẽ học theo cách nào ngay trong công việc thật. Câu hỏi tôi muốn nghe câu trả lời là quy trình review và triển khai chạy thế nào."
    },
    {
      "q": "Bạn có nên hỏi về lương và phúc lợi không, và hỏi vào lúc nào?",
      "a": "Tôi nghĩ nên hỏi, vì đây là thông tin hai bên cần biết, và hỏi sớm giúp cả hai bên tiết kiệm thời gian. Tôi đặt câu hỏi ở cuối buổi trao đổi, sau khi đã thống nhất về phần công việc, vì hỏi sớm dễ tạo cảm giác mục đích. Cách tôi hỏi là mở với khung mong muốn của mình rồi hỏi về cách đội xây dựng mức lương, ví dụ theo cấp bậc, kinh nghiệm và phạm vi trách nhiệm. Tôi cũng không né chủ đề bảo hiểm và ngày nghỉ, vì đó cũng là một phần của mức độ hợp tác dài hạn. Nếu phỏng vấn bên nhà tuyển dụng không phải người quyết định, tôi hỏi về bước tiếp theo và thời gian phản hồi."
    }
  ],
  "pitfalls": [
    "Hỏi cả chục câu khiến buổi phỏng vấn biến thành một bản điền thông tin",
    "Hỏi những gì đã đăng trong mô tả công việc, lãng phí lượt hỏi quý giá",
    "Hỏi chỉ về quyền lợi mà không hỏi gì về công việc và cách team vận hành"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết nên hỏi gì để tìm ra điểm bất khả thi tiềm ẩn trong cách họ triển khai hiện tại",
    "Tôi có thể chọn từ mỗi nhóm một câu có ngữ cảnh sau phần họ đã trình bày",
    "Tôi có thể nói rõ kỳ vọng 90 ngày của mình mà không hứa hẹn những gì chưa đo được"
  ],
  "refs": [
    "owasp-api-security",
    "mdn-http-overview"
  ],
  "say30": "Tôi hỏi bốn nhóm, mỗi nhóm một đến hai câu: khách hàng và sản phẩm, stack và hạ tầng, công việc đầu tiên của tôi, và quy trình từ ý tưởng tới lúc lên production. Câu hỏi nên cụ thể và có thể kiểm chứng bằng con số. Tôi để phần lương và phúc lợi cho sau khi đã nói được về công việc.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Câu hỏi cuối buổi là bằng chứng bạn đã nghe và đang tìm hiểu, và người phỏng vấn thường ghi nhận ứng viên không hỏi gì là không quan tâm. Nỗi đau thứ hai là mở đầu bằng lương và ngày nghỉ trước khi hỏi về công việc, khiến buổi phỏng vấn lệch sang hướng giao dịch.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Hỏi kỹ thuật trước, văn hóa sau. Câu hỏi nên gắn với rủi ro lớn nhất của vị trí, ví dụ: khi có sự cố lúc ba giờ sáng thì quy trình xử lý ra sao. Một câu hỏi ngược kèm con số giúp kiểm tra độ tin: hỏi p99 hiện tại là bao nhiêu, nếu không trả lời được thì câu trả lời cần được xem lại. Với quy trình review, hỏi một feature đi qua những bước nào và ai là người duyệt.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Hỏi nhiều quá biến buổi phỏng vấn thành biểu mẫu; hỏi quá ít bị coi là thụ động. Cách tự kiểm tra: sau buổi phỏng vấn, tôi ghi lại được ít nhất ba thông tin cụ thể về stack, quy trình và kỳ vọng ba tháng đầu (xem Bài L18).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p>\n<ul>\n  <li><strong>Được gì:</strong> câu hỏi cụ thể cho thấy bạn hiểu rủi ro vị trí; câu trả lời có số liệu giúp bạn đánh giá thật thay vì quảng cáo.</li>\n  <li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> câu hỏi kỹ thuật sâu có thể khiến người phỏng vấn mất thời gian; hỏi về lương quá sớm làm lệch ấn tượng về động cơ (xem Bài L18).</li>\n</ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p>\n<ul>\n  <li><strong>Phương án A — Hỏi theo bốn nhóm cố định:</strong> hợp khi buổi phỏng vấn ngắn và bạn cần bảo đảm phủ đủ; đổi lại kém linh hoạt với những gì người phỏng vấn vừa nói.</li>\n  <li><strong>Phương án B — Gửi câu hỏi bằng email trước buổi phỏng vấn:</strong> hợp khi công ty có quy trình rõ và bạn muốn người phỏng vấn chuẩn bị câu trả lời; đổi lại mất phản ứng tự nhiên trong buổi (xem Bài L18).</li>\n</ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p>\n<ul>\n  <li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm trong phản hồi sau buổi phỏng vấn, ví dụ người phỏng vấn nhắc lại đúng câu hỏi bạn đã đặt.</li>\n  <li><strong>Cách kiểm chứng nhanh:</strong> sau buổi, viết lại ba câu trả lời có số liệu và kiểm tra chúng có đủ cụ thể để đem ra so sánh giữa các công ty không; khi nhận được câu trả lời mơ hồ, hỏi lại một con số để xác nhận (xem Bài L18).</li>\n</ul>"
},
{
  "naive": "<p><strong>Cách sai thường gặp:</strong> Comment đoạn này viết khó hiểu, nên viết lại đi trong code review; hoặc phản biện để thắng thay vì kiểm chứng khi không đồng ý với góp ý.</p><p><strong>Vì sao hỏng:</strong> Nhận xét mơ hồ không nêu hậu quả cụ thể nên người nhận không biết phải sửa gì, đồng nghiệp sửa cho xong chuyện. Biến review thành tranh luận cá nhân kéo dài vô ích, cả đội ngừng góp ý vì sợ.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> một nhận xét tốt gồm ba phần: vấn đề cụ thể, hậu quả, và hướng sửa; nhận xét chỉ xong khi PR sau không còn vấn đề đó, không phải khi comment được gửi.</p><ul><li><strong>Phân loại chặn hay góp ý:</strong> phải sửa khác cân nhắc, nói rõ mức độ ngay trong nhận xét để người nhận biết cái nào đang chặn merge.</li><li><strong>Code so với con người:</strong> phân bổ này chạy mỗi request là về code; bạn luôn quên kiểm tra null là về thói quen, vượt ranh giới.</li><li><strong>Khống chế review lớn:</strong> hỏi tác giả chia nhỏ nếu có thể, tập trung chỗ khó sửa sau này; định dạng và đặt tên để công cụ tự động lo.</li></ul>",
  "id": "J10",
  "group": "J",
  "topic": "Trình bày kết quả code review",
  "prio": "P2",
  "level": "L2",
  "type": "concept",
  "incident": "<p>Một ứng viên được yêu cầu trình bày một nhận xét code review đã đưa ra trong dự án trước. Ứng viên kể rằng đã comment \"đoạn này viết khó hiểu, nên viết lại\", và đồng nghiệp đã sửa theo. Khi được hỏi nhận xét đó giúp gì cho người nhận, ứng viên không trả lời được thêm.</p>",
  "askFirst": [
    "Nhận xét này giúp người nhận hiểu điều gì? → Giải mã: nó cho biết hành vi cụ thể cần đổi, không phải cảm giác mơ hồ; nếu họ không nhại lại được thì chưa đủ cụ thể (xem Bài L18).",
    "Nhận xét nào là về code, nhận xét nào là về con người? → Giải mã: \"phân bổ này chạy mỗi request\" là về code; \"bạn luôn quên kiểm tra null\" là về thói quen, vượt ranh giới (xem Bài L18).",
    "Làm sao để một nhận xét dẫn tới thay đổi thật? → Giải mã: biết nó hiệu quả khi PR tiếp theo không còn vấn đề đó; vẫn còn thì nhận xét chưa tới (xem Bài L18)."
  ],
  "predict": {
    "q": "Hai nhận xét: \"đoạn này khó hiểu, viết lại đi\" và \"hàm này làm ba việc nên khó test; tách phần tính giá ra riêng thì test được\". Nhận xét nào hiệu quả hơn?",
    "a": "<p>Nhận xét thứ hai, vì nó nêu vấn đề cụ thể, giải thích hậu quả, và gợi ý một hướng đi. Nhận xét thứ nhất chỉ nói lên cảm nhận của người viết, nên người nhận không biết phải sửa gì và cũng không học được gì cho lần sau. Một điểm nữa là nhận xét thứ nhất dễ bị đọc thành đánh giá về năng lực, còn nhận xét thứ hai nói về cấu trúc code. Cùng một mong muốn thay đổi, nhưng cách diễn đạt quyết định nó có dẫn tới thay đổi hay dẫn tới phòng thủ.</p>"
  },
  "anchor": "Một nhận xét review tốt nêu vấn đề cụ thể kèm hậu quả và một hướng sửa, chứ không nêu cảm nhận của người viết.",
  "attacks": [
    {
      "q": "Khi nào bạn nên chặn một thay đổi, khi nào chỉ nên góp ý?",
      "a": "Chặn khi có vấn đề đúng đắn hoặc an toàn: lỗi logic, thiếu kiểm tra đầu vào, rò rỉ dữ liệu, phá vỡ hợp đồng API, hoặc thiếu test cho một nhánh quan trọng. Góp ý không chặn khi đó là sở thích về phong cách, một cách viết khác tương đương, hoặc một cải tiến có thể làm sau. Nói rõ mức độ ngay trong nhận xét — \"phải sửa\" khác \"cân nhắc\" — để người nhận biết cái nào đang chặn việc merge. Việc gộp hai loại này lại là nguyên nhân phổ biến khiến review kéo dài vô ích."
    },
    {
      "q": "Làm sao review một thay đổi lớn mà không mất quá nhiều thời gian?",
      "a": "Bắt đầu bằng mô tả thay đổi để hiểu mục tiêu, rồi đọc theo thứ tự từ ngoài vào: hợp đồng, luồng dữ liệu, rồi chi tiết. Với thay đổi lớn, hãy hỏi tác giả chia nhỏ nếu có thể, vì một thay đổi 2.000 dòng sẽ không được review kỹ dù bạn dành bao nhiêu thời gian. Tập trung vào những chỗ khó sửa sau này: ranh giới, xử lý lỗi, tính idempotency, và những chỗ ảnh hưởng tới dữ liệu. Còn định dạng, đặt tên, và phong cách thì nên để công cụ tự động lo, không tiêu thời gian của con người."
    }
  ],
  "q": "Bạn trình bày kết quả code review như thế nào, khi cả nhận lẫn khi góp ý cho người khác?",
  "oral": "Góp ý tốt phải nêu được vấn đề cụ thể, hậu quả và hướng sửa, chứ không chỉ nêu cảm nhận. Khi nhận góp ý, tôi tách làm hai nhóm: điểm tôi đồng ý thì sửa và nói rõ sửa trong thay đổi này hay thay đổi sau, kèm lý do; điểm tôi chưa đồng ý thì tôi không im lặng cũng không tranh luận, mà hỏi lại mình đang bỏ sót điều gì và đề xuất cách kiểm chứng bằng dữ liệu hoặc một thử nghiệm nhỏ. Khi góp ý cho người khác, tôi gắn mỗi ý với lý do và hậu quả cụ thể, ví dụ lỗi này gây truy vấn quét toàn bảng, lỗi này để lộ dữ liệu qua log. Tôi tránh góp ý về hình thức không ảnh hưởng chức năng, luôn góp ý trên code chứ không đánh giá con người, và sau khi thảo luận xong tôi tóm tắt lại thống nhất để tránh hiểu lầm.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Review</strong>: thời điểm có cấu trúc để xem xét thay đổi trước khi hợp nhất.</li><li><strong>Nhận xét có thể hành động</strong>: \"hàm này phân bổ array mới mỗi request\" là có thể hành động; \"nghe không ổn\" thì không.</li><li><strong>Code so với con người</strong>: \"hàm này khó đọc\" là về code; \"bạn viết tệ\" là về người.</li><li><strong>Kết quả</strong>: nhận xét không làm thay đổi vòng review tiếp theo là chưa làm xong việc.</li></ul><p>Bạn comment một dòng duy nhất: đoạn này viết khó hiểu, nên viết lại. Đồng nghiệp sửa cho xong chuyện. Panel hỏi tiếp nhận xét đó giúp người nhận hiểu thêm điều gì, bạn không trả lời được.</p><p>Một góp ý tốt gồm bốn mảnh: loại và mức độ chặn hay gợi ý, dòng liên quan, hậu quả cụ thể trên hệ thống thật, hướng sửa gợi ý. Review vừa lan truyền kiến thức vừa dễ gây xung đột nên mỗi ý phải gắn với code chứ không gắn với con người.</p><p>Góp ý nêu hậu quả làm người nhận học được thứ dùng lại lần sau, còn góp ý nêu cảm nhận chỉ làm người nhận phòng thủ. Ví dụ bạn viết hàm này quét toàn bảng vì thiếu điều kiện lọc, tách phần tính giá ra riêng thì test được, thay vì viết khó hiểu làm lại đi. Khi nhận góp ý bạn tách nhóm đồng ý và nhóm chưa đồng ý, nhóm sau hỏi lại mình bỏ sót gì và đề xuất cách kiểm chứng.</p><ul><li><strong>Dùng khi:</strong> bạn thấy lỗi logic, rò rỉ dữ liệu, phá hợp đồng API hoặc thiếu test ở nhánh quan trọng.</li><li><strong>Không dùng khi:</strong> đó chỉ là thói quen viết khác tương đương, vì chặn merge vì phong cách làm review kéo dài vô ích.</li></ul><p>Khi luồng review quá ba vòng thì đáp án đổi: bạn chuyển sang trao đổi trực tiếp rồi ghi kết luận lại vào comment để người đọc sau vẫn lần được.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn đưa và nhận review (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn phản ứng thế nào khi không đồng ý với góp ý trong review?",
      "a": "Tôi phản hồi trực tiếp trên dòng đó, nêu lý do và đề xuất cách kiểm chứng thay vì phản bác bằng uy tín. Ví dụ nếu tác giả nói nên thêm chỉ mục cho một cột gần như không ai lọc, tôi sẽ hỏi tần suất lọc thực tế và đề xuất kiểm tra bằng truy vấn thống kê trước khi thêm. Nếu sau đó dữ liệu cho thấy tôi sai, tôi đồng ý ngay và cảm ơn tác giả đã bắt lỗi. Điều tôi tránh tuyệt đối là im lặng rồi không sửa, vì người khác sẽ không bao giờ góp ý nữa. Khi bất đồng về kiến trúc, tôi chuyển sang trao đổi nói nhanh ngoài code để tránh kéo dài vòng comment."
    },
    {
      "q": "Bạn có làm gì để việc review không bị biến thành cuộc tranh luận cá nhân không?",
      "a": "Tôi quy ước trước với đội về ngôn từ và thứ tự ưu tiên: vấn đề chặn được nêu trước, mỗi nhận xét đi kèm hậu quả cụ thể, và không có nhận xét nào về cách viết quen thuộc nếu không ảnh hưởng bảo trì. Tôi cũng tách vai trò: người viết giải thích ý định trước khi đọc chi tiết, vì nhiều khi góp ý đi ngược với ý định đã được thống nhất. Khi thấy một luồng review kéo dài quá ba vòng, tôi đề nghị chuyển sang trao đổi trực tiếp và ghi kết luận trở lại vào nhận xét, để người khác đọc lại được. Nếu có lịch sử xung đột lặp lại với một người, tôi báo lại để trưởng nhóm can thiệp sớm."
    }
  ],
  "pitfalls": [
    "Góp ý mơ hồ kiểu làm lại đi mà không nêu hậu quả cụ thể",
    "Phản biện để thắng thay vì kiểm chứng, biến review thành tranh luận ý kiến",
    "Nhận góp ý nhưng im lặng không sửa, khiến cả đội ngừng góp ý"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết cách diễn đạt một nhận xét về bảo mật mà không nghe như cáo buộc cả nhóm",
    "Tôi có thể viết lại một góp ý kiểu chỉ ra lỗi thành góp ý nêu rõ loại, dòng, hậu quả và hướng sửa",
    "Tôi có thể tóm tắt thống nhất sau một vòng review dài để không ai hiểu lầm kết luận"
  ],
  "refs": [
    "mdn-http-overview",
    "fastapi-tutorial"
  ],
  "say30": "Góp ý tốt nêu vấn đề cụ thể, hậu quả và hướng sửa, không chỉ nêu cảm nhận. Khi nhận góp ý, tôi sửa điểm đồng ý và nói rõ sửa ở thay đổi này hay sau; điểm chưa đồng ý thì hỏi lại mình bỏ sót gì và đề xuất cách kiểm chứng bằng dữ liệu. Tôi tách nhận xét về code khỏi nhận xét về người.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Một comment như đoạn này viết khó hiểu, viết lại đi thì người nhận không biết phải đổi gì, và người viết không biết đã đủ chưa. Nỗi đau là nhận xét mơ hồ tạo ra vòng review thừa, hoặc tệ hơn là làm người nhận thấy bị đánh giá về con người.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Một nhận xét tốt có ba phần: vấn đề cụ thể, hậu quả, và hướng sửa. Ví dụ: vòng lặp này gọi truy vấn cho từng bản ghi, nên mỗi request sinh N truy vấn; gộp thành một truy vấn theo danh sách id. Khi nhận góp ý, tôi chia thành điểm đồng ý và điểm chưa đồng ý; điểm chưa đồng ý thì đề xuất thử nghiệm nhỏ thay vì tranh luận hay im lặng. Nhận xét chỉ xong khi PR sau không còn vấn đề đó.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Góp ý chi tiết tốn thời gian của người review; góp ý ngắn nhanh nhưng dễ mơ hồ. Giám sát: số vòng review trung bình cho một PR, số nhận xét lặp lại giữa các PR, và số lỗi cùng loại lặp lại sau khi đã góp ý (xem Bài L10, L18).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p>\n<ul>\n  <li><strong>Được gì:</strong> nhận xét cụ thể rút ngắn vòng review, người nhận biết chính xác phải đổi gì, và không gây căng thẳng cá nhân.</li>\n  <li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> người review tốn thời gian viết giải thích; nhận xét kỹ đôi khi bị coi là soi mói nếu không gắn với rủi ro thật (xem Bài L18).</li>\n</ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p>\n<ul>\n  <li><strong>Phương án A — Gọi trao đổi trực tiếp khi nhận xét phức tạp:</strong> hợp khi có nhiều cách sửa và cần thống nhất thiết kế; đổi lại mất dấu vết trong PR.</li>\n  <li><strong>Phương án B — Dùng checklist chung trong repo:</strong> hợp khi cùng một loại lỗi lặp lại; đổi lại cần duy trì checklist và tự động hóa bằng linter (xem Bài L10).</li>\n</ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p>\n<ul>\n  <li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở PR, ví dụ cùng một nhận xét xuất hiện ở nhiều PR, hoặc PR qua ba vòng review vẫn còn cùng một vấn đề.</li>\n  <li><strong>Cách kiểm chứng nhanh:</strong> đếm số vòng review của PR và số nhận xét được giải quyết bằng sửa code thay vì tranh luận; kiểm tra PR tiếp theo có còn lỗi đã góp ý không (xem Bài L10, L18).</li>\n</ul>"
},
{
  "naive": "<p><strong>Cách sai thường gặp:</strong> Đoán bừa một câu trả lời nghe có vẻ chắc chắn khi không biết; hoặc nói không biết rồi im lặng mất cả phần mình thực sự biết.</p><p><strong>Vì sao hỏng:</strong> Câu trả lời sai sẽ bị hỏi tiếp đúng chỗ sai đó, hai lần đào sâu mà tiếp tục bảo vệ phỏng đoán thì buổi mất điểm. Thừa nhận rồi im lặng bỏ lỡ cơ hội thể hiện năng lực suy luận từ nguyên tắc.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> người phỏng vấn kiểm tra cách bạn xử lý điều chưa biết, nên thừa nhận rồi suy luận từ nguyên tắc mạnh hơn bảo vệ một phỏng đoán; khoảng trống là cầu, không phải tường.</p><ul><li><strong>Hiệu chỉnh độ tự tin:</strong> nói tôi nghĩ thay vì nó là để giữ cửa mở, nêu mức độ chắc chắn thay vì trình bày phỏng đoán như sự thật.</li><li><strong>Suy luận từ nguyên tắc:</strong> nêu ràng buộc rồi suy ra từng bước, ví dụ mọi lời gọi ra ngoài thất bại theo ba cách là chậm, lỗi tạm thời, lỗi vĩnh viễn.</li><li><strong>Câu nối với phần biết:</strong> sau khi thừa nhận, nói cách sẽ kiểm chứng bằng tài liệu chính thức hoặc thử nghiệm nhỏ, rồi trả lời phần liên quan.</li></ul>",
  "id": "J11",
  "group": "J",
  "topic": "Xử lý khi không biết câu trả lời",
  "prio": "P2",
  "level": "L2",
  "type": "situation",
  "incident": "<p>Trong một buổi phỏng vấn, người phỏng vấn hỏi về cách xử lý tình huống mất kết nối tới một dịch vụ bên ngoài trong một hệ thống mà ứng viên chưa từng dùng. Ứng viên bắt đầu suy đoán và đưa ra một câu trả lời nghe có vẻ chắc chắn nhưng sai về cơ chế. Người phỏng vấn đào sâu hai lần và ứng viên tiếp tục bảo vệ câu trả lời ban đầu thay vì thừa nhận.</p>",
  "askFirst": [
    "Điều gì tệ hơn: không biết, hay khẳng định điều mình không biết? → Giải mã: khẳng định chắc chắn điều không biết tệ hơn vì đốt thời gian người phỏng vấn và vỡ khi họ biết bạn sai; thừa nhận là tín hiệu hiệu chỉnh độ tin (xem Bài L18).",
    "Làm sao thừa nhận mà không đánh mất đà của buổi phỏng vấn? → Giải mã: \"chưa làm với thứ đó, nhưng đây là cách tôi sẽ tìm ra\" rồi trả lời câu lân cận bạn biết; khoảng trống là cầu, không phải tường (xem Bài L18).",
    "Bạn có thể suy luận từ nguyên tắc chung như thế nào? → Giải mã: nêu ràng buộc rồi suy ra: \"nếu dữ liệu là X thì nút thắt là Y nên tôi kiểm tra Z trước\" — logic thấy được dù câu trả lời chưa (xem Bài L18)."
  ],
  "predict": {
    "q": "Bạn không biết câu trả lời cho một câu hỏi kỹ thuật. Cách xử lý nào tốt nhất?",
    "a": "<p>Nói rõ bạn chưa gặp phần đó, rồi chuyển sang thứ bạn suy luận được từ nguyên tắc đã biết. Ví dụ: bạn chưa dùng dịch vụ cụ thể đó, nhưng bạn biết rằng mọi lời gọi ra ngoài đều có thể thất bại theo ba cách — chậm, lỗi tạm thời, hoặc lỗi vĩnh viễn — nên bạn sẽ đặt timeout, thử lại có giới hạn cho lỗi tạm thời, và một cơ chế ngắt mạch cho lỗi kéo dài. Cách này vừa trung thực vừa thể hiện được năng lực suy luận, và người phỏng vấn thường đánh giá cao hơn một câu trả lời thuộc lòng.</p>"
  },
  "anchor": "Người phỏng vấn kiểm tra cách bạn xử lý điều chưa biết, nên thừa nhận rồi suy luận từ nguyên tắc mạnh hơn bảo vệ một phỏng đoán.",
  "attacks": [
    {
      "q": "Làm sao thừa nhận thiếu kiến thức mà không làm mất đà?",
      "a": "Nói ngắn, rồi chuyển ngay sang phần bạn làm được. Ví dụ: \"Phần cấu hình cụ thể của dịch vụ đó thì tôi chưa làm, nhưng nguyên tắc tôi sẽ áp dụng là...\" Câu này thừa nhận trong một câu và không xin lỗi dài dòng. Điều nên tránh là vừa thừa nhận vừa tự hạ thấp bản thân, hoặc thừa nhận rồi im lặng. Và nếu bạn nhớ mang máng nhưng không chắc, hãy nói rõ mức độ chắc chắn thay vì trình bày như một sự thật."
    },
    {
      "q": "Có nên nói mình sẽ tra tài liệu không?",
      "a": "Có, và đó là câu trả lời trung thực cho nhiều tình huống thật. Điều quan trọng là nói kèm cách bạn sẽ kiểm chứng: tra tài liệu chính thức chứ không tra blog, và viết một thử nghiệm nhỏ để xác nhận hành vi trước khi dựa vào nó. Điều này cho thấy bạn phân biệt được giữa việc nhớ và việc biết cách tìm ra, và trong công việc thật thì kỹ năng thứ hai quan trọng hơn. Nhưng đừng dùng nó để trốn tránh mọi câu hỏi — với những nguyên tắc cơ bản của ngành thì nên trả lời được ngay."
    }
  ],
  "q": "Trong phỏng vấn, khi bạn không biết câu trả lời bạn xử lý ra sao?",
  "oral": "Tôi không đoán bừa khi chưa biết, vì một câu trả lời sai sẽ bị hỏi tiếp đúng chỗ sai đó. Tôi nói thẳng phần nào chưa biết, rồi tách ra hai việc: phần tôi biết chắc để đi từ nguyên nhân gốc và rủi ro tôi nhận ra, và phần cần học thêm. Với phần chưa biết, tôi nói sẽ kiểm chứng bằng tài liệu chính thức hoặc một thử nghiệm nhỏ, và nói rõ mất bao lâu. Nếu câu hỏi nằm ngoài vai trò của tôi, tôi nói rõ phạm vi công việc của mình và chuyển sang phần liên quan đến phần tôi đã làm.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>First principles</strong>: bắt đầu từ điều bạn biết chắc và suy ra từng bước.</li><li><strong>Thừa nhận</strong>: nêu khoảng trống mà không đóng hội thoại; là bước chuyển, không phải đường chết.</li><li><strong>Hiệu chỉnh độ tự tin</strong>: nói \"tôi nghĩ\" thay vì \"nó là\" để giữ cửa mở.</li><li><strong>Cầu nối</strong>: sau khi thừa nhận, nói bạn sẽ tìm ra thế nào, rồi trả lời phần bạn biết.</li></ul><p>Panel hỏi cách xử lý mất kết nối tới một dịch vụ bạn chưa từng dùng. Bạn đoán một cơ chế nghe chắc chắn nhưng sai. Họ đào sâu hai lần, bạn tiếp tục bảo vệ câu đầu. Buổi đó mất điểm không phải vì thiếu kiến thức mà vì giữ một phỏng đoán.</p><p>Khuôn bốn bước giữ bạn trung thực mà vẫn thể hiện được năng lực. Bạn nhận giới hạn trong một câu. Bạn nêu phần biết chắc có gắn kinh nghiệm thật. Bạn suy luận từ nguyên lý và nói rõ đây là suy luận. Bạn cam kết cách kiểm chứng và thời gian cần.</p><p>Thừa nhận rồi suy luận làm panel đánh giá được tư duy, còn đoán bừa làm panel hỏi tiếp đúng chỗ sai. Ví dụ bạn chưa chạm dịch vụ đó nhưng biết mọi gọi ra ngoài hỏng theo ba kiểu là chậm, lỗi tạm thời, lỗi vĩnh viễn, nên đặt timeout, thử lại có giới hạn và ngắt mạch khi lỗi kéo dài. Bạn chốt bằng cách kiểm chứng qua tài liệu chính thức và một thử nghiệm nhỏ.</p><ul><li><strong>Dùng khi:</strong> câu hỏi nằm gần kinh nghiệm của bạn đủ để suy luận từ nguyên lý.</li><li><strong>Không dùng khi:</strong> câu hỏi hoàn toàn ngoài phạm vi, vì lúc đó nêu phạm vi thật và chuyển sang phần liên quan mạnh hơn suy luận mò.</li></ul><p>Khi bạn chỉ nhớ mang máng thì đáp án đổi: bạn nói rõ mức chắc chắn thay vì trình bày như sự thật, rồi mời panel cùng kiểm chứng giả thuyết đó.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn suy luận khi không có câu trả lời chuẩn (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Nếu câu hỏi nằm ngoài phạm vi công việc của bạn, bạn xử lý thế nào?",
      "a": "Tôi nói rõ phần đó nằm ngoài phần tôi đã làm, rồi chuyển sang phần có liên quan. Ví dụ với câu hỏi về cấu hình mạng nội bộ mà tôi không phụ trách, tôi sẽ nói phần đó do đội hạ tầng đảm nhiệm và tôi chỉ làm việc phía trên nó, rồi trả lời phần liên quan tới cách dịch vụ được gọi, cách xử lý lỗi kết nối và cách chẩn đoán bằng log. Nếu tôi có chút kiến thức nền, tôi nói rõ đó là kiến thức đọc chứ không phải trải nghiệm vận hành. Như vậy tôi vẫn cho thấy mình có nền để học nhanh mà không tạo ấn tượng giả."
    },
    {
      "q": "Bạn sẽ làm gì sau câu trả lời nói không biết đó, ngoài việc học?",
      "a": "Tôi ghi lại câu hỏi đó vào danh sách kiến thức cần lấp, kèm nguồn tài liệu và thời gian dự kiến. Sau đó tôi kiểm chứng bằng một việc nhỏ có kết quả quan sát được, ví dụ dựng một ví dụ nhỏ trên môi trường cục bộ hoặc đọc mã nguồn thay vì đọc tài liệu. Khi đã hiểu, tôi viết lại câu trả lời thành một đoạn ngắn có ví dụ, vì lúc đó tôi sẽ nhớ lâu hơn và dùng lại được. Nếu là lỗi tôi mắc trong phỏng vấn thật, tôi đưa nó vào danh sách câu hỏi để ôn lại trước vòng sau."
    }
  ],
  "pitfalls": [
    "Đoán bừa một câu trả lời nghe có vẻ hợp lý rồi bị hỏi tiếp tới mức lộ",
    "Nói không biết rồi dừng luôn, mất cả phần mình thực sự biết",
    "Xin phép hỏi lại để tránh trả lời, lạm dụng cách này với câu hỏi rõ ràng"
  ],
  "selfcheck": [
    "Tôi vẫn chưa biết đâu là ranh giới giữa nói không biết và nói chưa chắc trong lúc phỏng vấn",
    "Tôi có thể luyện câu trả lời cho một tình huống quen thuộc bằng cấu trúc bốn bước trong vòng ba mươi giây",
    "Tôi có thể ghi lại câu hỏi sau buổi phỏng vấn và kiểm chứng bằng một ví dụ chạy được"
  ],
  "refs": [
    "mdn-http-overview",
    "owasp-api-security"
  ],
  "say30": "Tôi không đoán bừa, vì một câu trả lời sai sẽ bị hỏi tiếp đúng chỗ sai đó. Tôi nói thẳng phần chưa biết, rồi tách phần tôi biết chắc để suy luận từ nguyên tắc và rủi ro tôi nhận ra. Với phần chưa biết, tôi nói cách sẽ kiểm chứng bằng tài liệu chính thức hoặc thử nghiệm nhỏ, kèm thời gian dự kiến.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Buổi phỏng vấn mất điểm thường không phải vì thiếu kiến thức mà vì khẳng định chắc chắn điều mình không biết. Người phỏng vấn đào sâu hai lần là đang kiểm tra xem bạn có tự sửa được không, và khi bạn tiếp tục bảo vệ đáp án sai thì họ có đủ dữ liệu để kết luận.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Ba bước. Một, nói rõ mình chưa làm với thứ đó, dùng ngôn từ có độ tin cậy như tôi nghĩa là, thay vì nó là. Hai, suy luận từ điều biết chắc: nêu ràng buộc rồi đi từng bước, ví dụ nếu mất kết nối tới dịch vụ thì cần phân biệt lỗi mạng với lỗi phía dịch vụ, rồi kiểm tra từng lớp. Ba, nêu cách tìm hiểu cụ thể và một câu nối với phần mình đã làm.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Thừa nhận nhanh giữ được đà buổi phỏng vấn nhưng có thể bị coi là thiếu chiều sâu nếu lặp lại quá nhiều lần. Cách tự kiểm tra: sau buổi, ghi lại câu hỏi nào mình chưa trả lời được và đã tìm hiểu xong chưa, để lần sau có câu trả lời thật (xem Bài L18).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p>\n<ul>\n  <li><strong>Được gì:</strong> thừa nhận có kiểm soát giữ độ tin cậy; suy luận từ nguyên tắc cho thấy cách nghĩ thay vì chỉ thuộc đáp án.</li>\n  <li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> mất vài giây im lặng để suy nghĩ; nếu suy luận sai mà không kiểm chứng thì vẫn bị hỏi tiếp (xem Bài L18).</li>\n</ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p>\n<ul>\n  <li><strong>Phương án A — Hỏi lại để làm rõ câu hỏi:</strong> hợp khi câu hỏi có nhiều cách hiểu; đổi lại tốn một lượt trao đổi.</li>\n  <li><strong>Phương án B — Vẽ sơ đồ hoặc viết giả mã ngay trên bảng:</strong> hợp khi bài toán có cấu trúc rõ; đổi lại tốn thời gian và cần người phỏng vấn đồng ý theo hướng đó (xem Bài L18).</li>\n</ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p>\n<ul>\n  <li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở buổi phỏng vấn, ví dụ người phỏng vấn đào sâu lặp lại cùng một điểm.</li>\n  <li><strong>Cách kiểm chứng nhanh:</strong> sau mỗi buổi, liệt kê câu hỏi chưa trả lời được và kiểm tra đã có tài liệu hoặc thử nghiệm cho từng câu chưa; khi được hỏi lại, thử trả lời theo cách đã suy luận để xem lập luận có đứng vững không (xem Bài L18).</li>\n</ul>"
},
{
  "naive": "<p><strong>Cách sai thường gặp:</strong> Hứa sẽ học AWS và Vue trong hai tuần đầu mà không nói học cụ thể cái gì, theo thứ tự nào, và làm sao biết đã đủ.</p><p><strong>Vì sao hỏng:</strong> Học hết trước rồi mới làm thì đến lúc có việc thật lại không biết học đã đủ hay chưa. Danh sách khóa học đã xem không kiểm chứng được; không có đầu ra cụ thể như PR được hợp nhất để đánh giá ngưỡng đóng góp.</p>",
  "rootCause": "<p><strong>Nguyên nhân gốc:</strong> kế hoạch học có giá trị khi nêu được phạm vi, thứ tự và tiêu chí hoàn thành; nếu không thì đó chỉ là ý định. Ngưỡng đủ là khi PR thứ hai được hợp nhất không cần review lại toàn bộ, không phải mốc lịch.</p><ul><li><strong>Gắn học với việc thật:</strong> đọc kiến trúc, chạy được hệ thống local, nhận một thay đổi nhỏ đi hết vòng từ sửa code tới triển khai.</li><li><strong>Thứ tự theo hệ thống cần:</strong> bắt đầu từ những dịch vụ xuất hiện trong công việc hằng ngày, không theo thứ tự tài liệu.</li><li><strong>PR tối thiểu hữu ích:</strong> thay đổi nhỏ nhất luyện đúng kỹ năng; báo cáo cuối tuần bằng link pull request cụ thể.</li></ul>",
  "id": "J12",
  "group": "J",
  "topic": "Kế hoạch hai tuần đầu học AWS và Vue",
  "prio": "P2",
  "level": "L1",
  "type": "situation",
  "incident": "<p>Ứng viên được hỏi sẽ làm gì trong hai tuần đầu nếu được nhận, với điểm yếu đã thừa nhận là chưa có kinh nghiệm AWS và Vue. Ứng viên trả lời rằng sẽ học AWS và Vue. Khi được hỏi học cụ thể cái gì, theo thứ tự nào, và làm sao biết mình đã đủ, ứng viên không có câu trả lời.</p>",
  "askFirst": [
    "Hai tuần đầu nên tập trung vào cái gì? → Giải mã: tuần một đọc codebase và gửi một PR nhỏ; mục tiêu là tìm ma sát thật, không phải học hết tool (xem Bài L18).",
    "Làm sao biết mình đã học đủ để làm việc? → Giải mã: khi PR thứ hai được hợp nhất không cần review lại toàn bộ bạn đã qua ngưỡng; đó là tín hiệu, không phải mốc lịch (xem Bài L18).",
    "Có nên học hết trước rồi mới làm không? → Giải mã: không; học dừng hữu ích khi không áp được vào task thật; hai tuần đầu nên kết thúc bằng thứ gì đó đã merge, không phải ghi chú (xem Bài L18)."
  ],
  "predict": {
    "q": "Một ứng viên nói \"tôi sẽ học AWS trong hai tuần đầu\". Câu trả lời này thiếu gì?",
    "a": "<p>Thiếu ba thứ. Thiếu phạm vi: AWS có hàng trăm dịch vụ, nên cần nói rõ học những dịch vụ nào và vì sao — thường là những dịch vụ xuất hiện trong JD. Thiếu thứ tự: cái gì trước, cái gì sau, và dựa trên cái gì đã biết. Thiếu tiêu chí hoàn thành: làm sao biết đã đủ để tự làm một việc thật. Một câu trả lời mạnh có cả ba, và thường kèm một bước kiểm chứng cụ thể — ví dụ triển khai một endpoint nhỏ lên hạ tầng thật trong tuần đầu tiên.</p>"
  },
  "anchor": "Kế hoạch học có giá trị khi nêu được phạm vi, thứ tự và tiêu chí hoàn thành — nếu không thì đó chỉ là ý định.",
  "attacks": [
    {
      "q": "Hai tuần đầu bạn ưu tiên cái gì?",
      "a": "Ưu tiên hiểu hệ thống đang chạy và tạo ra giá trị nhỏ nhưng thật, song song với việc học. Cụ thể: đọc kiến trúc và luồng của một tính năng từ giao diện tới database; chạy được hệ thống ở máy cá nhân; và nhận một thay đổi nhỏ để đi hết vòng từ sửa code tới triển khai. Việc đi hết một vòng nhỏ dạy nhiều hơn đọc tài liệu, vì nó buộc bạn chạm vào công cụ thật, quy trình thật, và những chỗ chưa được ghi lại. Học công nghệ mới thì gắn với công việc cụ thể thay vì học tràn lan."
    },
    {
      "q": "Với điểm yếu là AWS, bạn sẽ học theo thứ tự nào?",
      "a": "Theo thứ tự mà hệ thống thật cần, không theo thứ tự tài liệu. Bắt đầu từ những thứ xuất hiện trong công việc hằng ngày: cách một hàm được triển khai và cách đọc log của nó, cách cấp quyền cho nó, và cách một bucket hay một hàng đợi được dùng. Sau đó mới tới phần vận hành: đọc metric, đặt cảnh báo, và hiểu chi phí của những gì mình tạo ra. Học theo thứ tự này cho phép bạn đóng góp từ tuần đầu thay vì học sáu tháng rồi mới làm được việc, và nó cũng đúng với cách JD mô tả công việc."
    }
  ],
  "q": "Nếu được nhận, kế hoạch học AWS và Vue trong hai tuần đầu của bạn là gì?",
  "oral": "Tôi chia hai tuần thành các khối nối với việc thật trong dự án, và mục tiêu là cuối tuần có thứ chạy được chứ không chỉ có danh sách khóa học đã xem. Ngày đầu tôi dựng môi trường chạy được toàn bộ hệ thống ở local, đọc cấu hình hạ tầng và đi theo một feature từ giao diện tới cơ sở dữ liệu. Tuần đầu tôi làm một luồng nhỏ trên AWS: API Gateway gọi Lambda đọc và ghi một bucket S3, có log và cảnh báo, và tôi đặt cảnh báo ngân sách để không phát sinh chi phí bất ngờ. Song song, với Vue, tôi bắt đầu từ cầu nối với React: ref giống useState nhưng tự theo dõi khi đọc và ghi .value, còn computed giống useMemo mà không cần khai báo dependency. Tôi dựng lại một màn hình của dự án bằng component và composable, kèm test. Tuần hai tôi đưa luồng đó lên môi trường thật của công ty qua pipeline hiện có và nhờ một pull request nhỏ. Cuối hai tuần tôi có hai bằng chứng: một luồng chạy trên hạ tầng thật và một màn hình Vue được review.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Mục tiêu học</strong>: kỹ năng cụ thể nhắm đến trong tuần một, không phải \"nắm hệ thống\".</li><li><strong>Ngưỡng đóng góp</strong>: lúc PR của bạn được hợp nhất không cần review lại toàn bộ; đó là \"sẵn sàng\".</li><li><strong>PR tối thiểu hữu ích</strong>: thay đổi nhỏ nhất luyện đúng kỹ năng; lớn không hẳn tốt hơn.</li><li><strong>Đồng hành hoặc mentor</strong>: người bạn quan sát hai tuần đầu; không phải tùy chọn.</li></ul><p>Panel hỏi hai tuần đầu bạn làm gì với điểm yếu AWS và Vue đã thừa nhận. Bạn đáp sẽ học AWS và Vue. Họ hỏi tiếp học cái gì trước và làm sao biết đã đủ. Bạn không có câu trả lời.</p><p>Kế hoạch tốt gắn mỗi khối học với một việc thật có đầu ra kiểm chứng. Ngày đầu bạn chạy được hệ thống ở local, đọc cấu hình hạ tầng và lần một feature từ giao diện tới database. Tuần một bạn dựng luồng nhỏ API Gateway gọi Lambda đọc ghi S3 có log và cảnh báo, song song dựng lại một màn hình đang có bằng component và composable kèm test. Tuần hai bạn đưa luồng đó lên môi trường thật qua pipeline và mở pull request nhỏ.</p><p>Học gắn với việc thật làm bạn chạm công cụ và quy trình thật, còn học tràn lan làm bạn hết hai tuần mà chưa có gì chạy. Ví dụ cuối tuần một bạn có luồng chạy trên hạ tầng thật và màn hình Vue được review, cuối tuần hai bạn báo cáo bằng link pull request thay vì danh sách khóa học đã xem.</p><ul><li><strong>Dùng khi:</strong> bạn cần lấp khoảng trống mà vẫn tạo giá trị cho team ngay.</li><li><strong>Không dùng khi:</strong> bạn hứa học hết mọi dịch vụ trước khi làm, vì lúc đó bạn trượt tiến độ ngay tuần chờ tài khoản và quyền truy cập.</li></ul><p>Khi team đang kẹt một mảng thì đáp án đổi: bạn dồn sức cho mảng chặn tiến độ của nhiều người trước, giữ mảng còn lại ở mức chạm nhẹ thay vì chia đều.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cách bạn onboarding và xây niềm tin (xem Bài L18).</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Bạn ưu tiên học AWS hay Vue trước nếu chỉ chọn một trong hai?",
      "a": "Tôi ưu tiên phần mang lại giá trị cho đội ngay. Nếu đội đang cần giao diện nhanh thì tôi học Vue trước vì khoảng trống đó chặn tiến độ của nhiều người. Nếu hệ thống đang chuyển sang serverless mà không có ai chịu trách nhiệm hạ tầng, tôi học AWS trước dù cảm thấy chưa thoải mái. Tôi quyết định bằng cách hỏi ở tuần đầu xem đội đang bị chặn bởi cái gì, thay vì tự chọn theo cảm giác thoải mái của bản thân. Trong hai tuần tôi vẫn cố giữ lấy một chút cho phần còn lại để không bỏ rơi hoàn toàn. Kinh nghiệm của tôi cho thấy cả hai phần đều dùng chung nền tảng là hiểu luồng dữ liệu và cách quan sát hệ thống."
    },
    {
      "q": "Bạn sẽ báo cáo tiến độ học với team bằng cách nào?",
      "a": "Tôi dùng đầu ra cụ thể thay cho lời hứa. Cuối mỗi tuần tôi gửi ngắn: tôi đã dựng được luồng nào, nó chạy ở đâu, tôi gặp vướng gì và cần ai hỗ trợ. Tôi kèm link pull request để người review đọc trực tiếp thay vì đọc lời tóm tắt. Nếu có phần nào chưa hiểu, tôi nói rõ tôi đang ở đâu trong tài liệu chứ không ghi chung chung là đang học dần. Cách này giúp người hướng dẫn tiết kiệm thời gian hỏi tình hình và giúp tôi nhận được hướng dẫn đúng chỗ đang vướng."
    }
  ],
  "pitfalls": [
    "Hứa học hết một danh sách dài khóa học trong hai tuần, không có đầu ra kiểm chứng",
    "Bỏ qua bước mở pull request vì ngại, bỏ lỡ cơ hội học nhanh nhất từ review của đội",
    "Không tính thời gian chờ cấp tài khoản và quyền truy cập, rồi trượt tiến độ ngay tuần đầu"
  ],
  "selfcheck": [
    "Tôi vẫn chưa xác định được luồng nhỏ nào vừa đủ chứng minh năng lực mà không tốn quá một tuần",
    "Tôi có thể dựng một luồng API Gateway cùng Lambda đọc ghi S3 trong một buổi và tự kiểm tra bằng log",
    "Tôi có thể báo cáo cuối tuần bằng link pull request cụ thể thay vì bằng danh sách đã học"
  ],
  "refs": [
    "aws-lambda-best",
    "dockerfile-ref"
  ],
  "say30": "Tôi chia hai tuần thành các khối gắn với việc thật: ngày đầu dựng môi trường chạy được hệ thống ở local và đi theo một feature từ giao diện xuống cơ sở dữ liệu. Tuần đầu làm một luồng nhỏ trên AWS có log, cảnh báo và ngân sách. Với Vue, tôi bắt đầu từ phần giống React nhất rồi đến reactivity, và mục tiêu là cuối tuần có một PR nhỏ được hợp nhất.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Một kế hoạch chỉ là danh sách khóa học thì không ai kiểm chứng được sau hai tuần. Nỗi đau là học AWS và Vue theo kiểu xem hết rồi mới làm, đến lúc có việc thật lại không biết học đã đủ hay chưa.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Tuần đầu mục tiêu là tìm ma sát thật trong codebase: đọc cấu hình hạ tầng, đi theo một feature, gửi một PR nhỏ. Trên AWS, một luồng API Gateway gọi Lambda đọc ghi S3, có log và cảnh báo ngân sách để không phát sinh chi phí bất ngờ. Với Vue, bắt đầu từ ref và computed so với React hooks, rồi đến component và router, mỗi phần gắn vào một thay đổi trong dự án. Ngưỡng đủ là khi PR thứ hai được hợp nhất mà không cần review lại toàn bộ.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Học theo việc thật chậm hơn đọc tài liệu nhưng để lại thứ chạy được; PR nhỏ an toàn nhưng không chứng minh được năng lực thiết kế. Giám sát: số PR đã hợp nhất, số lần phải hỏi lại cùng một khái niệm, và thời gian từ lúc nhận task đến PR đầu tiên (xem Bài L01, L16, L22).",
  "tradeoff": "<p><strong>Đánh đổi thực tế (Trade-offs):</strong></p>\n<ul>\n  <li><strong>Được gì:</strong> học theo việc thật tạo ra sản phẩm kiểm chứng được; ngân sách và cảnh báo giữ chi phí AWS trong tầm kiểm soát; PR nhỏ giúp đội review nhanh.</li>\n  <li><strong>Mất gì (Chi phí / Độ phức tạp):</strong> tốc độ đầu tiên chậm hơn học lý thuyết; PR nhỏ không chứng minh được khả năng thiết kế hệ thống lớn (xem Bài L01, L22).</li>\n</ul>",
  "alternatives": "<p><strong>Khi nào chọn phương án thay thế?</strong></p>\n<ul>\n  <li><strong>Phương án A — Học chứng chỉ AWS trước khi đụng code:</strong> hợp khi đội yêu cầu chứng chỉ hoặc vị trí cần kiến thức tổng quan; đổi lại kiến thức không gắn vào hệ thống thật nên dễ quên.</li>\n  <li><strong>Phương án B — Ghép cặp với một người trong đội suốt hai tuần:</strong> hợp khi onboarding có mentor rõ; đổi lại tốn thời gian của người đó (xem Bài L16, L22).</li>\n</ul>",
  "observe": "<p><strong>Cách quan sát &amp; Bắt lỗi trên Production:</strong></p>\n<ul>\n  <li><strong>Tín hiệu trong Log / Metric:</strong> không có tín hiệu production; tín hiệu nằm ở tuần đầu, ví dụ PR bị trả về nhiều lần vì cùng một lỗi, hoặc chi phí AWS vượt ngân sách cảnh báo.</li>\n  <li><strong>Cách kiểm chứng nhanh:</strong> cuối tuần một, chạy lại luồng API Gateway, Lambda, S3 và xem log có đủ request id; kiểm tra cảnh báo ngân sách đã gắn email nhận; đếm số câu hỏi lặp lại về Vue và ghi lại thành checklist (xem Bài L01, L16).</li>\n</ul>"
}
);
