var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "F01",
  "group": "F",
  "topic": "Ràng buộc PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK",
  "prio": "P0",
  "level": "L1",
  "type": "concept",
  "attacks": [
    {
      "q": "Ràng buộc khoá ngoại có làm chậm ghi không, và bạn có nên bỏ nó vì hiệu năng?",
      "a": "Có chi phí thật nhưng nhỏ, và bạn không nên bỏ. Mỗi lần ghi hay xoá, PostgreSQL kiểm tra giá trị ở bảng được tham chiếu — giống Django ORM ngầm chạy một SELECT trước khi lưu. Bỏ ràng buộc nghĩa là chấp nhận dữ liệu mồ côi, và mọi truy vấn nối bảng phải tự xử lý trường hợp không tìm thấy, trách nhiệm rải khắp codebase. Nếu thực sự cần bỏ qua kiểm tra khi nạp dữ liệu lớn, hãy làm ở phạm vi hẹp, có bước xác minh lại rồi bật lại — chứ không bỏ vĩnh viễn."
    },
    {
      "q": "Ràng buộc duy nhất và chỉ mục duy nhất khác nhau thế nào?",
      "a": "Ràng buộc là quy tắc về tính đúng đắn, còn chỉ mục duy nhất là cấu trúc vật lý thực thi quy tắc đó. PostgreSQL thực thi ràng buộc duy nhất bằng một chỉ mục duy nhất, nên hai khái niệm gắn với nhau. Điểm khác biệt quan trọng: chỉ mục duy nhất có thể tạo có điều kiện, biểu diễn được quy tắc mà ràng buộc thông thường không làm được — ví dụ chỉ cho phép một bản ghi đang hoạt động trên mỗi tổ hợp khoá. Và giá trị rỗng được coi là khác nhau, nên nhiều dòng có cùng tổ hợp chứa rỗng vẫn thoả ràng buộc duy nhất."
    }
  ],
  "incident": "<p><strong>Tình huống:</strong> 10 giờ 20, đội hỗ trợ xóa một tài khoản khách hàng trong trang quản trị và request treo 40 giây rồi trả 504.</p><p><strong>Nguyên nhân:</strong> bảng <code>orders</code> có mười triệu dòng, cột <code>user_id</code> có FOREIGN KEY sang <code>users</code> nhưng không có index. Mỗi lần xóa, PostgreSQL phải quét toàn bộ <code>orders</code> để kiểm tra còn dòng con nào tham chiếu.</p><p><strong>Hệ quả:</strong> mọi thao tác khác trên <code>orders</code> chờ theo và hàng đợi kết nối đầy dần — giống một endpoint FastAPI giữ khóa quá lâu khiến toàn bộ worker xếp hàng.</p>",
  "askFirst": [
    "Điều gì xảy ra với bảng orders khi xóa một dòng users? → Giải mã: RESTRICT chặn xóa, CASCADE xóa dây chuyền dòng con; chọn hành vi theo sở hữu, không chọn theo mặc định.",
    "Vì sao cột khóa ngoài ở bảng con lại cần index riêng? → Giải mã: PostgreSQL không tự tạo index cho FOREIGN KEY; không có index, xóa dòng cha phải quét toàn bộ bảng con (Bài L08, Bài L05)."
  ],
  "predict": {
    "q": "Bạn đoán DELETE trên users chậm vì node nào trong kế hoạch?",
    "a": "<p><strong>Bạn đoán đúng:</strong> kế hoạch có một node Seq Scan trên <code>orders</code> để kiểm tra tham chiếu khóa ngoài, chạy trên cả mười triệu dòng.</p><p><strong>Sau khi tạo index</strong> trên <code>orders(user_id)</code>, node đó thành Index Scan chỉ đọc các dòng con của user cần xóa, nên thời gian rơi từ hàng chục giây xuống mili giây.</p>"
  },
  "anchor": "FOREIGN KEY mà không có index trên cột ở bảng con = mỗi lần xóa hay cập nhật dòng cha phải quét toàn bộ bảng con.",
  "q": "Khi nào bạn dùng PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL và CHECK trong PostgreSQL, và mỗi loại ngăn lỗi dữ liệu nào?",
  "oral": "Ràng buộc là tuyến phòng thủ cuối cùng ở tầng database, không phải ở code ứng dụng. PRIMARY KEY định danh duy nhất mỗi dòng, tự động UNIQUE và NOT NULL, thường là id kiểu bigint generated always as identity. FOREIGN KEY giữ toàn vẹn tham chiếu, ví dụ orders.user_id phải tồn tại trong users.id, ngăn dòng mồ côi. UNIQUE ngăn trùng lặp như email đăng nhập. NOT NULL ép buộc trường bắt buộc như created_at. CHECK ép buộc quy tắc miền giá trị như price lớn hơn 0 hay status thuộc tập hợp cho phép. Trên production bạn đặt hết ở tầng database, vì validate ở backend có thể bị bỏ qua bởi race condition, job thủ công hay một service khác cùng ghi.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>PRIMARY KEY</strong>: khoá định danh từng dòng, ngầm UNIQUE + NOT NULL, tự tạo index B-tree; giống số căn cước của một người.</li><li><strong>FOREIGN KEY</strong>: ràng buộc khoá ngoại, ép giá trị ở bảng con phải tồn tại ở bảng cha, chặn dòng mồ côi; giống số điện thoại khách hàng phải khớp khách hàng thật.</li><li><strong>UNIQUE</strong>: ràng buộc chống trùng, nhưng PostgreSQL coi nhiều NULL là khác nhau; giống cột email đăng nhập không được lặp.</li><li><strong>CHECK</strong>: ràng buộc miền giá trị chạy ngay khi ghi, chặn số âm hay trạng thái lạ; giống ô nhập chỉ nhận giá trị hợp lệ.</li></ul><p><strong>Tình huống:</strong> bạn xóa một user trong trang quản trị và request treo 40 giây rồi trả 504. Bảng orders có mười triệu dòng, cột user_id có FOREIGN KEY nhưng thiếu index. Mỗi lần xóa dòng cha, PostgreSQL quét toàn bộ bảng con để tìm dòng tham chiếu.</p><p><strong>Ràng buộc là quy tắc ép buộc ở tầng database,</strong> độc lập với code ứng dụng. PRIMARY KEY tạo index B-tree duy nhất và ngầm NOT NULL. FOREIGN KEY kiểm tra giá trị tồn tại ở bảng cha khi ghi và khi xóa dòng cha. UNIQUE chặn trùng lặp. NOT NULL chặn thiếu giá trị. CHECK chặn giá trị ngoài miền cho phép.</p><p><strong>Ràng buộc khác index:</strong> FOREIGN KEY chặn dòng mồ côi ngay khi ghi, còn index trên cột khóa ngoài giúp lần kiểm tra đó nhanh. Một cái giữ đúng dữ liệu, một cái giữ nhanh truy vấn. Thiếu cái thứ hai, cái thứ nhất thành nút thắt.</p><p><strong>Ví dụ:</strong> bảng users có <code>email text NOT NULL UNIQUE</code> và bảng orders có <code>user_id ... REFERENCES users(id) ON DELETE RESTRICT</code> kèm <code>CHECK (amount &gt; 0)</code>. Email trống bị chặn. Đơn ghi user_id không tồn tại bị chặn. Xóa user còn đơn bị chặn thay vì xóa dây chuyền.</p><ul><li>Dùng khi: PRIMARY KEY cho mọi bảng, FOREIGN KEY cho quan hệ thật, UNIQUE cho định danh đăng nhập, CHECK cho miền giá trị hẹp.</li><li>Không dùng khi: ON DELETE CASCADE cho quan hệ không sở hữu, CHECK cho quy tắc đổi theo thời gian nên nằm ở code.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng UNIQUE chặn luôn NULL trong khi PostgreSQL vẫn cho nhiều dòng NULL. Khi bảng con phình tới hàng chục triệu dòng thì đáp án đổi: bạn giữ nguyên ràng buộc nhưng bổ sung index cho cột khóa ngoài và chuyển xóa cứng sang xóa mềm.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L08.</p>",
  "code": "CREATE TABLE users (\n  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- ✅ Cách làm chuẩn: PK tự sinh, ngầm UNIQUE + NOT NULL\n  email text NOT NULL UNIQUE, -- ✅ Đăng nhập: cấm thiếu, cấm trùng\n  created_at timestamptz NOT NULL DEFAULT now()\n);\nCREATE TABLE orders (\n  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  user_id bigint NOT NULL REFERENCES users (id) ON DELETE RESTRICT, -- ✅ FK chặn dòng mồ côi; nhớ tạo index riêng cho user_id\n  amount numeric NOT NULL CHECK (amount > 0), -- ✅ Miền giá trị: cấm số không dương\n  status text NOT NULL CHECK (status IN ('new', 'paid', 'cancelled'))\n);",
  "expected": "Kết quả: 2 câu lệnh CREATE TABLE tạo 2 bảng và tất cả ràng buộc được đăng ký ngay khi tạo bảng. Phân tích: PRIMARY KEY trên id bigint sinh index B-tree duy nhất kèm NOT NULL ngầm định, nên bảng không thể có hai dòng id bằng nhau. GENERATED ALWAYS AS IDENTITY tự cấp giá trị tuần tự và từ chối INSERT ghi tay vào cột id, khác serial ở chỗ nó là cột identity chuẩn SQL. email text NOT NULL UNIQUE vừa cấm thiếu vừa cấm trùng, nhưng vì có NOT NULL nên lỗi NULL không lọt qua như trường hợp UNIQUE không kèm NOT NULL. orders.user_id có FOREIGN KEY sang users(id) với ON DELETE RESTRICT nên mọi insert đòi users chứa id tương ứng, còn xóa một user còn đơn sẽ bị chặn bằng lỗi vi phạm khóa ngoại chứ không xóa dây chuyền. CHECK amount > 0 và CHECK status IN (...) chạy trên từng dòng khi insert và update, nên amount bằng 0 hay status lạ đều bị từ chối tại database. Điểm cần nhớ: cột FOREIGN KEY không tự có index, xóa một dòng users sẽ buộc PostgreSQL quét toàn bộ orders để kiểm tra tham chiếu, nên phải tự tạo index trên orders(user_id) cho bảng con lớn.",
  "followups": [
    {
      "q": "UNIQUE trong PostgreSQL xử lý NULL thế nào và vì sao nhiều dòng NULL vẫn insert được?",
      "a": "PostgreSQL coi hai NULL là không phân biệt được nên UNIQUE cho phép nhiều dòng NULL cùng tồn tại. Cơ chế: phép kiểm tra duy nhất chỉ so sánh giá trị thật, NULL không tham gia so sánh. Nếu bạn muốn chỉ một dòng thiếu giá trị thì thêm NOT NULL hoặc dùng unique index với điều kiện WHERE — đây là điểm hay bị hỏi và hay gây lỗi email trống trùng nhau."
    },
    {
      "q": "ON DELETE CASCADE, RESTRICT và SET NULL khác nhau ra sao, khi nào dùng mỗi loại?",
      "a": "Ba hành vi khi xóa dòng cha. RESTRICT chặn xóa còn dòng con tham chiếu, an toàn nhất cho dữ liệu nghiệp vụ. CASCADE xóa dây chuyền dòng con, chỉ dùng khi dòng con thật sự thuộc sở hữu của cha như order_items của order. SET NULL giữ dòng con nhưng cắt liên kết, dùng khi quan hệ không bắt buộc như người phụ trách đã nghỉ việc."
    },
    {
      "q": "Vì sao vẫn cần ràng buộc ở database dù đã validate ở backend?",
      "a": "Vì validate ở backend có thể bị bỏ qua bởi race condition, job thủ công, script migration hay một service khác cùng ghi database. Ràng buộc database là kiểm tra nguyên tử ngay tại thời điểm ghi nên chặn mọi đường ghi sai. Thực tế: validate sớm ở backend để báo lỗi đẹp — giống middleware FastAPI kiểm tra request — còn ràng buộc database là lưới an toàn cuối cùng."
    }
  ],
  "pitfalls": [
    "Tưởng UNIQUE cũng chặn NULL trong khi PostgreSQL vẫn cho nhiều NULL.",
    "Dùng ON DELETE CASCADE cho mọi quan hệ rồi mất dữ liệu dây chuyền khi xóa nhầm."
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được vì sao xóa một user trong bảng cha lại chậm khi cột user_id ở bảng con thiếu index.",
    "Tôi giải thích được từng loại ràng buộc bằng ví dụ bảng users và orders có email UNIQUE và amount lớn hơn 0.",
    "Tôi có thể thiết kế bảng đơn hàng mới với khóa chính, khóa ngoài, UNIQUE và CHECK sao cho dữ liệu sai bị chặn ngay khi insert."
  ],
  "refs": [
    "pg-constraints"
  ]
},
{
  "id": "F02",
  "group": "F",
  "topic": "JOIN kết hợp GROUP BY và HAVING lọc nhóm",
  "prio": "P1",
  "level": "L2",
  "type": "code",
  "incident": "<p><strong>Tình huống:</strong> một báo cáo doanh thu theo khách hàng chạy đúng trên dữ liệu thử nhưng thiếu mất 40 khách hàng trên dữ liệu thật.</p><p><strong>Nguyên nhân:</strong> truy vấn dùng <code>JOIN</code> giữa bảng khách hàng và bảng đơn hàng, rồi lọc bằng điều kiện trên bảng đơn hàng trong mệnh đề <code>WHERE</code>. Những khách hàng chưa từng đặt đơn biến mất khỏi báo cáo, dù yêu cầu nghiệp vụ là phải hiện họ với giá trị 0.</p><p><strong>Bài học:</strong> điều kiện lọc trên bảng bên phải đặt trong <code>WHERE</code> sẽ âm thầm biến <code>LEFT JOIN</code> thành <code>INNER JOIN</code> — giống việc bạn <code>filter()</code> sau <code>leftJoin</code> trong SQLAlchemy rồi tự hỏi vì sao mất dòng.</p>",
  "askFirst": [
    "JOIN và LEFT JOIN khác nhau ở đâu khi một bên không có dòng khớp? → Giải mã: INNER bỏ dòng không khớp; LEFT giữ dòng bảng trái, cột bên phải thành NULL; muốn giữ hết thì LEFT kèm điều kiện nằm trong ON.",
    "Điều kiện lọc đặt trong WHERE khác gì đặt trong ON? → Giải mã: ON quyết định cách ghép, WHERE lọc sau ghép; điều kiện bảng phải trong WHERE biến LEFT JOIN thành INNER (bản chất ở Bài L05).",
    "Vì sao báo cáo không báo lỗi mà chỉ thiếu dòng? → Giải mã: SQL không sai cú pháp, chỉ sai ý nghĩa; dòng NULL bị WHERE loại im lặng, kiểm bằng so số dòng nguồn với kết quả."
  ],
  "predict": {
    "q": "Với <code>LEFT JOIN</code> và một điều kiện trên bảng bên phải đặt trong <code>WHERE</code>, những dòng không khớp sẽ ra sao?",
    "a": "<p><strong>Chúng bị loại bỏ,</strong> và phép <code>LEFT JOIN</code> trở nên tương đương <code>INNER JOIN</code>.</p><p><strong>Cơ chế:</strong> với dòng không khớp, mọi cột của bảng bên phải nhận giá trị <code>NULL</code>; điều kiện trong <code>WHERE</code> so sánh với <code>NULL</code> cho kết quả <code>UNKNOWN</code>, mà <code>WHERE</code> chỉ giữ những dòng có kết quả đúng. Muốn giữ chúng thì điều kiện phải nằm trong mệnh đề <code>ON</code>, vì <code>ON</code> quyết định cách ghép chứ không lọc kết quả cuối cùng.</p>"
  },
  "anchor": "Điều kiện trên bảng bên phải đặt trong WHERE sẽ âm thầm biến LEFT JOIN thành INNER JOIN và làm mất đúng những dòng bạn muốn giữ.",
  "attacks": [
    {
      "q": "HAVING khác WHERE ở đâu?",
      "a": "WHERE lọc từng dòng trước khi nhóm, còn HAVING lọc sau khi đã nhóm và tính toán tổng hợp. Cơ chế: WHERE chạy trước GROUP BY nên chỉ thấy được cột gốc, HAVING chạy sau nên dùng được COUNT, SUM, AVG của nhóm. Thực tế: nên đẩy càng nhiều điều kiện lọc dòng vào WHERE càng tốt vì nó giảm số dòng phải nhóm; để điều kiện lọc dòng trong HAVING là làm việc nặng trước rồi mới loại bỏ."
    },
    {
      "q": "Làm sao phát hiện một JOIN đang làm mất dòng ngoài ý muốn?",
      "a": "Đếm ở hai mức: số dòng của bảng gốc và số dòng của kết quả. Nếu kết quả ít hơn bảng gốc trong khi yêu cầu nghiệp vụ là giữ tất cả, đó là dấu hiệu. Với những báo cáo quan trọng, nên có một test so sánh tổng số tiền hoặc tổng số bản ghi giữa truy vấn và dữ liệu nguồn — chênh lệch là lỗi, giống snapshot test trong React. Một cách khác là chạy cùng truy vấn với LEFT JOIN và đếm số dòng có giá trị NULL ở bảng bên phải, để biết có bao nhiêu dòng không khớp."
    }
  ],
  "q": "Bạn viết truy vấn JOIN nhiều bảng rồi GROUP BY và HAVING thế nào để lọc theo nhóm mà không lọc sai từng dòng?",
  "oral": "Bản chất: WHERE lọc dòng trước khi gom nhóm, HAVING lọc nhóm sau khi đã tổng hợp, nên điều kiện trên COUNT hay SUM bắt buộc phải nằm trong HAVING. Cơ chế: bạn dùng JOIN để ghép dòng từ nhiều bảng theo khóa, ví dụ orders JOIN users trên user_id; GROUP BY gom các dòng cùng khóa thành một nhóm; hàm tổng hợp như COUNT hay SUM tính trên nhóm. Thực tế: lỗi phổ biến là đưa điều kiện tổng hợp vào WHERE nên báo lỗi, hoặc quên GROUP BY đầy đủ nên kết quả phình ra — với PostgreSQL bạn nên GROUP BY theo khóa chính rồi JOIN thêm thông tin hiển thị để câu lệnh gọn và đúng.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>INNER JOIN và LEFT JOIN</strong>: INNER giữ dòng khớp hai bảng; LEFT giữ hết dòng bảng trái, dòng không khớp nhận NULL; giống ghép danh sách khách với đơn hàng, khách chưa có đơn vẫn hiện.</li><li><strong>WHERE và HAVING</strong>: WHERE lọc từng dòng trước khi nhóm; HAVING lọc nhóm sau khi đã tính COUNT, SUM; giống lọc người rồi mới chia tổ, so với lọc tổ sau khi đã chia.</li><li><strong>GROUP BY</strong>: gom các dòng cùng khoá thành từng nhóm để tính tổng hợp; giống gom đơn theo khách hàng để cộng tiền.</li></ul><p><strong>Tình huống:</strong> báo cáo doanh thu thiếu 40 khách hàng mà không báo một lỗi nào. Truy vấn JOIN khách hàng với đơn hàng rồi ghi điều kiện lên bảng đơn hàng trong WHERE. Mọi khách chưa đặt đơn biến mất khỏi kết quả.</p><p><strong>Thứ tự logic của truy vấn:</strong> JOIN ghép dòng hai bảng theo điều kiện ON. WHERE lọc dòng đã ghép. GROUP BY gom dòng thành nhóm. Hàm tổng hợp tính một giá trị cho mỗi nhóm. HAVING lọc nhóm sau khi tổng hợp xong.</p><p><strong>WHERE khác HAVING:</strong> WHERE lọc từng dòng trước khi gom nhóm, còn HAVING lọc nhóm sau khi đã tính tổng hợp. Điều kiện ngày tạo đặt ở WHERE. Điều kiện có ít nhất hai đơn đặt ở HAVING.</p><p><strong>Ví dụ:</strong> liệt kê user từ 2026-01-01 kèm số đơn đã thanh toán: <code>LEFT JOIN orders ON user_id = id AND status = 'paid'</code> rồi <code>GROUP BY id</code> và <code>HAVING COUNT(id) &gt;= 2</code>. Điều kiện paid nằm trong ON nên khách chưa có đơn vẫn còn nhóm. Nếu bạn chuyển nó xuống WHERE, LEFT JOIN hóa thành INNER JOIN.</p><ul><li>Dùng khi: INNER JOIN cho dòng khớp hai bên, LEFT JOIN giữ bên trái, HAVING cho ngưỡng trên COUNT hay SUM.</li><li>Không dùng khi: SELECT DISTINCT để chữa JOIN nhân dòng, đưa COUNT vào WHERE.</li></ul><p><strong>Lỗi hay gặp:</strong> JOIN bảng một-nhiều rồi SUM trực tiếp nên tổng phình gấp nhiều lần. Khi bảng con phình to thì đáp án đổi: bạn tổng hợp trước trong CTE rồi mới JOIN để tránh nhân dòng — giống việc bạn tổng hợp trong subquery Django ORM thay vì JOIN trực tiếp.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L08.</p>",
  "code": "SELECT u.id, u.email, COUNT(o.id) AS order_count, SUM(o.amount) AS total_amount\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid' -- ✅ Điều kiện bảng phải nằm trong ON, không phải WHERE\nWHERE u.created_at >= '2026-01-01' -- ✅ Lọc dòng gốc: chạy trước GROUP BY\nGROUP BY u.id, u.email\nHAVING COUNT(o.id) >= 2 -- ✅ Lọc nhóm: dùng được hàm tổng hợp\nORDER BY total_amount DESC;",
  "expected": "Kết quả: mỗi dòng là một user tạo từ 2026-01-01 trở đi có ít nhất 2 đơn đã thanh toán, gồm u.id, u.email, order_count và total_amount, sắp giảm dần theo total_amount. Phân tích: thứ tự logic là FROM, JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. LEFT JOIN giữ user chưa có đơn nhưng điều kiện o.status = 'paid' nằm trong ON chứ không phải WHERE, nên user không có đơn vẫn còn nhóm với COUNT(o.id) bằng 0 và SUM(o.amount) bằng NULL; nếu chuyển điều kiện đó xuống WHERE thì LEFT JOIN bị hóa thành INNER JOIN và user chưa có đơn biến mất. WHERE lọc theo u.created_at chạy trước khi gom nhóm nên chỉ thấy được cột gốc, HAVING COUNT(o.id) >= 2 chạy sau khi gom nhóm nên dùng được hàm tổng hợp; đưa COUNT vào WHERE sẽ báo lỗi aggregate functions are not allowed in WHERE. GROUP BY u.id, u.email hợp lệ vì u.id là khóa chính của users nên functional dependency cho phép chọn u.email mà không cần gom thêm cột. Cạm bẫy: nếu JOIN thêm bảng chi tiết một-nhiều vào đây thì SUM(o.amount) bị nhân lên theo số dòng con, phải tổng hợp trong CTE trước rồi mới JOIN.",
  "followups": [
    {
      "q": "WHERE và HAVING khác nhau ở điểm nào trong truy vấn có GROUP BY?",
      "a": "WHERE chạy trước GROUP BY nên chỉ lọc được dòng đơn lẻ và cột gốc, không dùng được hàm tổng hợp. HAVING chạy sau GROUP BY nên lọc được theo COUNT, SUM hay AVG của nhóm. Thực tế: điều kiện ngày tạo đặt ở WHERE, điều kiện khách có ít nhất hai đơn đặt ở HAVING — nhầm chỗ là báo lỗi hoặc kết quả sai."
    },
    {
      "q": "Vì sao SUM sau JOIN đôi khi ra số lớn gấp nhiều lần và cách sửa ra sao?",
      "a": "Vì JOIN với bảng chi tiết nhân mỗi dòng cha thành nhiều dòng con nên SUM cộng lặp cùng một giá trị. Cách sửa là tổng hợp bảng con trước trong subquery hoặc CTE rồi mới JOIN, hoặc COUNT DISTINCT khóa chính của bảng cần đếm. Luôn kiểm tra số dòng sau JOIN trước khi tin con số tổng."
    }
  ],
  "pitfalls": [
    "Đưa điều kiện tổng hợp như COUNT lớn hơn 5 vào WHERE rồi báo lỗi mà không hiểu thứ tự thực thi.",
    "JOIN bảng một-nhiều rồi SUM trực tiếp nên tổng phình gấp nhiều lần mà vẫn báo cáo."
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được khi nào nên tổng hợp trước trong CTE rồi mới JOIN để tránh nhân dòng.",
    "Tôi giải thích được thứ tự WHERE rồi GROUP BY rồi HAVING bằng ví dụ lọc khách có ít nhất hai đơn đã thanh toán.",
    "Tôi có thể viết báo cáo tổng tiền theo khách hàng dùng LEFT JOIN kèm GROUP BY và HAVING mà không làm mất khách chưa có đơn."
  ],
  "refs": [
    "pg-constraints",
    "pg-explain"
  ]
},
{
  "id": "F03",
  "group": "F",
  "topic": "NULL và logic ba giá trị trong so sánh",
  "prio": "P0",
  "level": "L2",
  "type": "predict",
  "attacks": [
    {
      "q": "Vì sao <code>COUNT(*)</code> và <code>COUNT(cột)</code> cho hai con số khác nhau trên cùng một bảng?",
      "a": "COUNT(*) đếm mọi dòng, còn COUNT(cột) chỉ đếm dòng mà cột đó không rỗng — chênh lệch chính là số dòng chứa NULL. Cơ chế: họ COUNT bỏ qua NULL nên cùng một bảng cho hai con số, và không có lỗi nào được ném ra để cảnh báo. Thực tế: dùng dạng đếm mọi dòng khi bạn muốn biết số bản ghi, dùng dạng đếm theo cột chỉ khi thật sự muốn biết số dòng có giá trị, và đặt tên cột kết quả rõ ý định để người đọc báo cáo không hiểu nhầm."
    },
    {
      "q": "Làm sao tránh được cả lớp lỗi liên quan tới giá trị rỗng trong một hệ thống lớn?",
      "a": "Cách tránh là quyết định ở tầng lược đồ, không ở tầng truy vấn. Cơ chế: với mỗi cột, chọn rõ nó có được phép rỗng hay không, và nếu không thì đặt ràng buộc cùng giá trị mặc định — như vậy mọi truy vấn sau đó không phải xử lý trường hợp rỗng nữa. Thực tế: với những cột mà rỗng mang nghĩa nghiệp vụ, hãy dùng một giá trị biểu diễn tường minh thay vì rỗng, vì giá trị tường minh so sánh được bằng phép so sánh thường — đây là quyết định rẻ khi làm sớm và rất đắt khi phải sửa sau."
    }
  ],
  "incident": "<p><strong>Tình huống:</strong> 9 giờ sáng, kế toán đối soát và thấy báo cáo \"đơn chưa hủy\" thiếu 1.200 đơn so với hệ thống cũ.</p><p><strong>Nguyên nhân:</strong> truy vấn lọc <code>WHERE status &lt;&gt; 'cancelled'</code> trên bảng <code>orders</code> mười nghìn dòng, trong đó 1.200 dòng có <code>status</code> là NULL vì đơn tạo trước khi cột này được thêm. So sánh với NULL cho UNKNOWN, WHERE loại những dòng đó mà không báo lỗi.</p><p><strong>Hệ quả:</strong> con số trên báo cáo nhỏ hơn thực tế, đội phải chạy lại toàn bộ kỳ đối soát và giải thích chênh lệch với ban kiểm soát — giống bug off-by-one trong React state khiến UI hiện sai mà không báo lỗi.</p>",
  "askFirst": [
    "Điều kiện \"khác cancelled\" có bao gồm dòng status NULL không? → Giải mã: Không; khác NULL cho UNKNOWN, WHERE chỉ giữ TRUE nên dòng NULL bị loại, muốn giữ thì thêm OR bằng NULL (Bài L05).",
    "Vì sao WHERE loại dòng NULL thay vì giữ lại? → Giải mã: WHERE định nghĩa là giữ dòng cho TRUE; UNKNOWN không phải TRUE nên bị loại, cơ chế ba giá trị chứ không phải bug."
  ],
  "predict": {
    "q": "Bạn đoán truy vấn trả về những dòng nào với ba dòng có status lần lượt là done, cancelled, NULL?",
    "a": "<p><strong>Chỉ dòng <code>status = 'done'</code>.</strong> Dòng NULL cho biểu thức <code>NULL &lt;&gt; 'cancelled'</code> giá trị UNKNOWN, và WHERE chỉ giữ dòng cho TRUE nên loại cả FALSE lẫn UNKNOWN.</p><p><strong>Muốn giữ dòng NULL</strong> phải thêm <code>OR status IS NULL</code> hoặc dùng <code>IS DISTINCT FROM</code>.</p>"
  },
  "anchor": "Phép so sánh với NULL mà không có IS NULL = dòng NULL thành UNKNOWN và bị WHERE loại khỏi kết quả.",
  "q": "Đoạn truy vấn lọc status khác cancelled này trả về những dòng nào khi có NULL, và vì sao dòng NULL biến mất?",
  "oral": "Bản chất: dòng có status NULL bị loại khỏi kết quả dù trực giác nghĩ khác cancelled thì bao gồm cả thiếu giá trị. Cơ chế: PostgreSQL dùng logic ba giá trị TRUE, FALSE, UNKNOWN — mọi so sánh bằng hay khác với NULL đều cho UNKNOWN chứ không phải TRUE, và mệnh đề WHERE chỉ giữ dòng cho TRUE nên dòng UNKNOWN bị loại. Thực tế: muốn giữ dòng NULL bạn viết rõ OR status IS NULL hoặc dùng IS DISTINCT FROM — đây là bẫy phỏng vấn kinh điển và cũng là lỗi thực tế làm báo cáo thiếu dữ liệu.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>NULL</strong>: nghĩa là chưa biết, không phải rỗng hay số 0; giống ô trống trên phiếu khảo sát, không cùng nghĩa với 0.</li><li><strong>Logic ba giá trị</strong>: kết quả đúng, sai hoặc chưa biết; mọi so sánh với NULL ra chưa biết chứ không ra đúng hay sai.</li><li><strong>WHERE</strong>: chỉ giữ dòng có điều kiện cho đúng; dòng cho chưa biết bị loại lặng lẽ, đúng kiểu báo cáo thiếu dòng không báo lỗi.</li></ul><p><strong>Tình huống:</strong> bảng jobs chỉ trả về một dòng cho truy vấn lọc khác cancelled, dù bạn nhìn thấy ba dòng. Dòng status NULL biến mất lặng lẽ, đúng kiểu lỗi làm báo cáo thiếu dòng mà không ai nhận ra.</p><p><strong>NULL nghĩa là chưa biết,</strong> không phải rỗng hay số 0. Mọi so sánh bằng hay khác với NULL cho UNKNOWN. WHERE chỉ giữ dòng cho TRUE nên loại luôn UNKNOWN. Phủ định không tự kéo dòng thiếu giá trị vào.</p><p><strong>IS NULL khác dấu khác:</strong> <code>IS NULL</code> hỏi thẳng cột có thiếu giá trị không và luôn trả TRUE hoặc FALSE, còn dấu khác <code>&lt;&gt;</code> so sánh giá trị nên trả UNKNOWN khi gặp NULL. Một cái trả lời được câu hỏi về thiếu giá trị, một cái không.</p><p><strong>Khi muốn giữ dòng NULL,</strong> bạn viết <code>WHERE status &lt;&gt; 'cancelled' OR status IS NULL</code> hoặc dùng <code>IS DISTINCT FROM</code>, toán tử coi hai NULL bằng nhau và không bao giờ trả UNKNOWN. Với NOT IN, một NULL trong danh sách làm mọi dòng thành UNKNOWN nên kết quả rỗng toàn bộ, lúc đó bạn chuyển sang NOT EXISTS.</p><ul><li>Dùng khi: IS NULL cho kiểm tra thiếu giá trị, IS DISTINCT FROM cho so sánh thay đổi gồm cả NULL, COUNT(cột) khi cần đếm dòng có giá trị.</li><li>Không dùng khi: NOT IN với subquery có thể chứa NULL, COUNT(cột) khi bạn muốn đếm mọi dòng.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng khác một giá trị thì tự bao gồm NULL. Khi cột cho phép NULL vì lý do nghiệp vụ thì đáp án đổi: bạn thêm NOT NULL cộng giá trị mặc định cho cột mới, hoặc tách trạng thái chưa biết thành một giá trị tường minh.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L08.</p>",
  "code": "CREATE TABLE jobs (id int PRIMARY KEY, status text); -- ✅ status cho phép NULL: thiếu giá trị là hợp lệ\nINSERT INTO jobs VALUES (1, 'done'), (2, 'cancelled'), (3, NULL);\nSELECT id FROM jobs WHERE status <> 'cancelled'; -- ✅ Trả về id 1; dòng id 3 (NULL) cho UNKNOWN nên bị WHERE loại",
  "expected": "Chỉ trả về dòng id bằng 1. Dòng id bằng 3 có status NULL cho biểu thức NULL khác cancelled giá trị UNKNOWN nên WHERE loại bỏ. Áp dụng cho mọi phiên bản PostgreSQL hiện hành vì đây là hành vi chuẩn của logic ba giá trị. Muốn lấy cả dòng NULL phải thêm OR status IS NULL.",
  "followups": [
    {
      "q": "NOT IN với danh sách chứa NULL vì sao có thể trả về rỗng hoàn toàn?",
      "a": "Vì NOT IN được diễn giải thành chuỗi AND các điều kiện khác từng giá trị, chỉ cần một NULL là cả biểu thức thành UNKNOWN với mọi dòng không khớp tuyệt đối. Kết quả là không dòng nào đạt TRUE nên tập rỗng. Thực tế: cách tránh là loại NULL khỏi danh sách hoặc dùng NOT EXISTS thay cho NOT IN."
    },
    {
      "q": "IS DISTINCT FROM khác dấu bằng thường ở điểm nào?",
      "a": "IS DISTINCT FROM coi hai NULL là bằng nhau và NULL khác giá trị thường là khác nhau, nên nó luôn trả về TRUE hoặc FALSE chứ không bao giờ UNKNOWN. Cơ chế: nó trả lời được câu hỏi so sánh thay đổi gồm cả trường hợp từ có giá trị thành thiếu giá trị. Thực tế: dấu bằng thường giữ ngữ nghĩa chưa biết nên trả UNKNOWN khi gặp NULL — dùng IS DISTINCT FROM khi bạn cần kết quả chắc chắn TRUE hoặc FALSE."
    },
    {
      "q": "COUNT sao, COUNT cột và COUNT DISTINCT xử lý NULL khác nhau ra sao?",
      "a": "COUNT sao đếm mọi dòng kể cả dòng có NULL. COUNT theo cột bỏ qua NULL nên con số nhỏ hơn khi cột thiếu giá trị. COUNT DISTINCT cũng bỏ NULL rồi mới loại trùng. Thực tế: báo cáo số lượng đơn theo cột hủy phải chọn đúng dạng COUNT kẻo thiếu dữ liệu mà không ai báo lỗi."
    }
  ],
  "pitfalls": [
    "Tưởng khác một giá trị thì tự động bao gồm NULL trong khi WHERE loại mọi UNKNOWN.",
    "Dùng NOT IN với subquery có NULL rồi ngạc nhiên khi kết quả rỗng toàn bộ."
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được mọi trường hợp UNKNOWN lan truyền qua AND OR NOT mà không cần bảng chân trị.",
    "Tôi giải thích được vì sao status khác cancelled loại dòng NULL bằng ví dụ bảng jobs ba dòng.",
    "Tôi có thể sửa một báo cáo thiếu dòng NULL bằng cách thêm điều kiện IS NULL hoặc chuyển sang IS DISTINCT FROM."
  ],
  "refs": [
    "pg-constraints"
  ]
},
{
  "id": "F04",
  "group": "F",
  "topic": "Index B-tree và composite index với thứ tự cột",
  "prio": "P0",
  "level": "L2",
  "type": "concept",
  "attacks": [
    {
      "q": "Vì sao chỉ mục tổ hợp lại phụ thuộc thứ tự cột?",
      "a": "Chỉ mục tổ hợp lưu theo thứ tự từ điển của cột trái trước. Cơ chế: truy vấn lọc đúng cột đầu tiên đọc được dải lá liên tục, nên nhanh. Điều kiện chỉ cột thứ hai — ví dụ status = 'paid' khi index là (created_at, status) — thì các giá trị nằm rải rác, nên database phải quét toàn bộ index hoặc tuần tự. Vì vậy thứ tự cột nên theo cách truy vấn: cột lọc bằng đứng trước, cột sắp xếp/phụ thuộc đứng sau. Một chỉ mục tổ hợp đúng thứ tự thường thay thế được nhiều chỉ mục đơn, giảm chi phí ghi. Thực tế: tránh tạo một chỉ mục cho mỗi mẫu truy vấn; chọn chỉ mục phục vụ mẫu quan trọng nhất — chạy nhiều nhất hoặc có ngân sách độ trễ nghiêm ngặt nhất — và chấp nhận các mẫu khác chậm hơn. Chi phí ghi và dung lượng tăng theo số chỉ mục, và đến một lúc nào đó việc ghi chậm đi ảnh hưởng tới toàn hệ thống nhiều hơn lợi ích."
    },
    {
      "q": "Nếu truy vấn lọc theo cột thứ hai và sắp xếp theo cột thứ ba thì sao?",
      "a": "Nếu truy vấn lọc theo cột thứ hai và sắp xếp theo cột thứ ba, bạn cần một chỉ mục có thứ tự khớp mẫu. Cơ chế: ví dụ index trên (status, created_at DESC) phục vụ truy vấn lọc status = 'paid' rồi ORDER BY created_at DESC. Nếu truy vấn không thể phục vụ bằng một chỉ mục, chọn chỉ mục phục vụ mẫu quan trọng nhất — chạy nhiều nhất hoặc có ngân sách độ trễ nghiêm ngặt nhất — và chấp nhận những mẫu khác. Thực tế: tránh chỉ mục cho mỗi mẫu truy vấn; chi phí ghi/dung lượng tăng theo số chỉ mục, và quá nhiều chỉ mục làm chậm toàn hệ thống."
    }
  ],
  "incident": "<p><strong>Tình huống:</strong> màn hình danh sách đơn lọc <code>status = 'paid'</code> và sắp theo <code>created_at DESC</code> chạm p99 ba giây trên bảng orders mười triệu dòng.</p><p><strong>Nguyên nhân:</strong> đội đã tạo index nhưng theo thứ tự <code>(created_at, status)</code>, nên điều kiện lọc theo <code>status</code> chỉ là cột thứ hai. Planner quét gần hết index cho mỗi trang. Càng nhiều dòng được thêm mỗi ngày, trang đầu tiên càng chậm.</p><p><strong>Hệ quả:</strong> sau khi tạo lại index theo <code>(status, created_at DESC)</code>, p99 về dưới 50 mili giây.</p>",
  "askFirst": [
    "Thứ tự cột trong composite index quyết định điều gì? → Giải mã: Chỉ mẫu truy vấn khớp cột đầu (và các cột tiếp theo) được dùng; lọc cột thứ hai rời cột đầu thì planner khó đi index (Bài L08, Bài L21).",
    "Vì sao lọc theo cột thứ hai của index lại kém hiệu quả? → Giải mã: Index sắp theo cột đầu, các giá trị cột đầu khác nhau rải khắp cây nên lọc cột thứ hai phải chạm gần hết index."
  ],
  "predict": {
    "q": "Bạn đoán EXPLAIN cho thấy gì trước và sau khi đổi thứ tự cột index?",
    "a": "<p><strong>Trước</strong> là Seq Scan hoặc Index Scan quét gần hết index <code>(created_at, status)</code> rồi lọc <code>status</code> sau.</p><p><strong>Sau</strong> là Index Scan trên <code>(status, created_at DESC)</code> chỉ đọc dải lá của các dòng <code>paid</code>, và <code>ORDER BY created_at DESC</code> đọc trực tiếp theo thứ tự index nên không cần node Sort.</p>"
  },
  "anchor": "Composite index đặt cột lọc chọn lọc ở vị trí thứ hai = planner phải quét gần hết index thay vì đọc một dải hẹp.",
  "q": "Index B-tree trong PostgreSQL hoạt động thế nào và thứ tự cột trong composite index quyết định điều gì?",
  "oral": "Bản chất: B-tree là cây cân bằng giữ khóa đã sắp xếp kèm trỏ tới dòng trong heap, nên tìm bằng, tìm khoảng và sắp xếp theo index rất nhanh thay vì quét toàn bảng. Composite index trên hai cột ví dụ status và created_at hoạt động như từ điển sắp theo cột đầu rồi tới cột sau, nên truy vấn lọc đúng cột đầu dùng tốt, lọc chỉ cột sau thì kém. Cơ chế: cột đứng trước quyết định dải lá cần đọc, cột đứng sau chỉ có thứ tự trong từng nhóm. Thực tế: đặt cột có tính lọc cao và xuất hiện trong nhiều truy vấn lên trước, cột chỉ dùng sắp xếp hay lọc phụ đặt sau. Kiểm tra bằng EXPLAIN xem truy vấn dùng Index Scan hay Seq Scan.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Index B-tree</strong>: bản sao các giá trị khoá đã sắp xếp kèm trỏ về dòng trong bảng, tra nhanh bằng cách đi cây; giống mục lục sách có thể tìm ngay trang 120.</li><li><strong>Composite index</strong>: index nhiều cột, sắp theo cột đầu trước rồi tới cột sau; giống từ điển sắp theo tên rồi tên đệm, tra thuận chiều mới nhanh.</li><li><strong>Seq Scan và Index Scan</strong>: quét toàn bộ bảng so với đi index rồi đọc đúng dòng; trình lập kế hoạch chọn con đường rẻ hơn theo thống kê.</li></ul><p><strong>Tình huống:</strong> trang danh sách đơn lọc paid sắp theo ngày tạo chạm p99 ba giây trên mười triệu dòng, dù đội đã tạo index. Index đặt theo thứ tự <code>(created_at, status)</code> nên điều kiện lọc status nằm ở cột thứ hai. Planner quét gần hết index cho mỗi trang.</p><p><strong>Cấu trúc index:</strong> B-tree giữ bản sao khóa đã sắp xếp kèm trỏ về dòng trong bảng. Tra cứu bằng khóa khoanh một dải lá liên tục. Đọc theo đúng chiều index trả luôn thứ tự sắp xếp. Index tổ hợp sắp như từ điển theo cột trái trước.</p><p><strong>Thứ tự cột quyết định:</strong> cột đứng trước quyết định dải lá cần đọc, còn cột đứng sau chỉ có thứ tự trong từng nhóm của cột trước. Lọc đúng cột đầu là đọc một dải hẹp. Lọc chỉ cột sau là quét gần hết cây.</p><p><strong>Ví dụ:</strong> tạo lại index theo <code>(status, created_at DESC)</code> cho truy vấn lọc <code>status = 'paid'</code> kèm <code>ORDER BY created_at DESC LIMIT 50</code>. Planner đọc đúng dải paid rồi lấy 50 dòng đầu, không cần node Sort. Bạn xác nhận bằng EXPLAIN: Index Scan thay Seq Scan.</p><ul><li>Dùng khi: cột điều kiện bằng đứng trước, cột khoảng và sắp xếp đứng sau, partial index cho giá trị hiếm.</li><li>Không dùng khi: index cột đơn lẻ ít phân biệt mà planner vẫn quét bảng, composite cho mẫu truy vấn chưa ai chạy.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng thứ tự cột không quan trọng. Khi truy vấn quan trọng đổi mẫu lọc thì đáp án đổi: bạn đổi thứ tự cột theo truy vấn nóng nhất hoặc tách thành index riêng, rồi đo lại bằng EXPLAIN thay vì đoán.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L08, Bài L21.</p>",
  "code": "CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC); -- ✅ Composite index: lọc status trước, sắp created_at sau\nSELECT id, amount FROM orders\nWHERE status = 'paid' AND created_at >= '2026-09-01'\nORDER BY created_at DESC\nLIMIT 50; -- ✅ Index Scan trên idx_orders_status_created, đọc dải paid, trả 50 dòng đầu, không cần Sort",
  "expected": "Kết quả: CREATE INDEX tạo index B-tree composite trên (status, created_at DESC) và SELECT trả tối đa 50 dòng thỏa status bằng paid và created_at từ 2026-09-01, sắp giảm dần theo created_at. Phân tích: composite index sắp theo cột trái trước rồi mới tới cột phải, giống từ điển sắp theo họ rồi tên, nên điều kiện status = 'paid' cho một vùng lá liên tục và trong vùng đó created_at đã có thứ tự DESC nên ORDER BY created_at DESC đọc trực tiếp, không cần node Sort. Kế hoạch mong đợi là Index Scan hoặc Index Only Scan trên idx_orders_status_created với LIMIT cắt sớm sau 50 dòng; nếu chỉ lọc theo created_at mà không có status thì phải quét gần hết index nên planner dễ chọn Seq Scan. Cảnh báo cần đọc đúng: trong EXPLAIN con số rows là ước tính từ thống kê, còn rows trong EXPLAIN ANALYZE là số dòng thật mỗi node; khi hai con số lệch nhiều lần thì thống kê cũ hoặc điều kiện tương quan và lúc đó kế hoạch thật có thể khác hẳn kế hoạch mong đợi. Cạm bẫy: tính chọn lọc không nằm ở số giá trị phân biệt của cột mà ở tỉ lệ dòng khớp. Tài liệu PostgreSQL nói ngưỡng nằm ở chỗ giá trị phổ biến chiếm hơn vài phần trăm số dòng của bảng. Cụ thể trên bảng orders mười triệu dòng: nếu status = \"paid\" khớp 2% (hai trăm nghìn dòng) thì index vẫn thắng; nhưng nếu giá trị \"paid\" chiếm 40% (bốn triệu dòng) thì planner chọn Seq Scan là đúng chứ không phải lỗi. Con số quyết định là số dòng khớp và số trang heap phải chạm, không phải số giá trị có trong cột.",
  "followups": [
    {
      "q": "Khi nào composite index dùng được chỉ với cột thứ hai và khi nào thì không?",
      "a": "Planner có thể dùng skip scan hoặc toàn bộ index trong vài phiên bản mới cho trường hợp đặc biệt, nhưng nhìn chung lọc chỉ cột thứ hai phải quét gần như toàn bộ index nên kém. Nếu mẫu truy vấn lọc độc lập từng cột thì nên tạo hai index đơn hoặc đổi thứ tự cột theo truy vấn quan trọng nhất. Luôn kiểm chứng bằng EXPLAIN thay vì đoán."
    },
    {
      "q": "Vì sao cột ít giá trị phân biệt như boolean thường không được planner chọn?",
      "a": "Vì index chỉ loại được ít dòng mà vẫn phải đọc heap cho phần lớn bảng nên chi phí gần bằng quét bảng. Planner ước tính chi phí IO và chọn Seq Scan rẻ hơn. Ngoại lệ là partial index chỉ cho giá trị hiếm, ví dụ chỉ index đơn chưa thanh toán thì rất hiệu quả."
    },
    {
      "q": "Index giúp ORDER BY và LIMIT thế nào?",
      "a": "Nếu thứ tự ORDER BY trùng thứ tự index thì database đọc lá theo đúng thứ tự và dừng sớm khi gặp LIMIT, không cần bước sort. Ví dụ index theo created_at giảm dần phục vụ ORDER BY created_at DESC LIMIT 50 rất tốt. Ngược chiều sắp xếp hoặc hàm biến đổi cột sẽ phá vỡ lợi ích này."
    }
  ],
  "pitfalls": [
    "Tưởng thứ tự cột trong composite index không quan trọng nên truy vấn lọc cột sau vẫn nhanh.",
    "Tạo index cho một cột rồi ngạc nhiên khi planner vẫn quét toàn bảng — mà không kiểm tra tỉ lệ dòng khớp thực tế của giá trị đó."
  ],
  "selfcheck": [
    "Tôi vẫn chưa giải thích được chi tiết cấu trúc trang B-tree và mức chia node khi index phình to.",
    "Tôi giải thích được vì sao index theo status rồi created_at phục vụ tốt truy vấn lọc paid theo tháng bằng ví dụ bảng orders.",
    "Tôi có thể chọn thứ tự cột composite index cho một màn hình danh sách lọc theo trạng thái và sắp xếp theo ngày tạo."
  ],
  "refs": [
    "pg-indexes"
  ]
},
{
  "id": "F05",
  "group": "F",
  "topic": "Chi phí ghi và lưu trữ khi lạm dụng index",
  "prio": "P1",
  "level": "L3",
  "type": "concept",
  "incident": "<p><strong>Tình huống:</strong> một bảng <code>events</code> có 14 chỉ mục, được thêm dần qua hai năm để đáp ứng từng truy vấn chậm.</p><p><strong>Hệ quả:</strong> tốc độ ghi giảm từ 8.000 dòng mỗi giây xuống 1.100, và dung lượng bảng tăng từ 40 GB lên 190 GB.</p><p><strong>Điểm đáng chú ý:</strong> một dev đề xuất thêm ba chỉ mục nữa để tăng tốc báo cáo — mỗi chỉ mục mới cứu một báo cáo và làm mọi lần ghi chậm thêm một chút.</p>",
  "askFirst": [
    "Mỗi chỉ mục phải trả giá ở đâu? → Giải mã: Mỗi index là B-tree riêng cập nhật đồng bộ trong transaction ghi, cộng dung lượng và RAM; chi phí nhân với số index (Bài L08).",
    "Vì sao thêm chỉ mục làm dung lượng tăng mạnh hơn dự kiến? → Giải mã: Index giữ copy khóa kèm trỏ, không dùng chung heap; hàng chục index trên bảng lớn cộng dồn lên vài chục phần trăm dung lượng bảng.",
    "Làm sao biết một chỉ mục không ai dùng? → Giải mã: Xác suất 0 trong thống kê dùng index của PostgreSQL là không có truy vấn nào chọn; đối chiếu với truy vấn thật rồi xóa trên staging, đo lại EXPLAIN trước (Bài L21)."
  ],
  "predict": {
    "q": "Một bảng có ba chỉ mục. Một câu <code>INSERT</code> một dòng phải cập nhật bao nhiêu cấu trúc?",
    "a": "<p><strong>Bốn cấu trúc:</strong> bản thân bảng cộng ba chỉ mục.</p><p><strong>Cơ chế:</strong> mỗi chỉ mục là một cây B-tree riêng phải được chèn khoá mới vào đúng vị trí, và việc chèn có thể gây tách trang khi trang đầy. Chi phí ghi tăng theo số chỉ mục, và với tải ghi cao thì đó là chi phí lớn nhất.</p><p><strong>Lưu ý:</strong> mỗi lần cập nhật một cột nằm trong chỉ mục còn phải xoá và chèn lại khoá — nên cập nhật cũng đắt như chèn.</p>"
  },
  "anchor": "Mỗi chỉ mục là một cấu trúc phải cập nhật ở mọi lần ghi, nên chỉ mục là đánh đổi giữa tốc độ đọc và chi phí ghi cùng dung lượng.",
  "attacks": [
    {
      "q": "Làm sao tìm ra những chỉ mục không ai dùng?",
      "a": "Bạn truy vấn thống kê của PostgreSQL để tìm những chỉ mục có số lần quét bằng không trong một khoảng thời gian đủ dài — vài tuần hoặc một tháng, để bắt được cả những truy vấn theo mùa. Cơ chế: đối chiếu thêm với thống kê của bảng để biết tỉ lệ quét tuần tự và số lần cập nhật. Thực tế: cần cẩn thận với hai trường hợp — chỉ mục phục vụ ràng buộc duy nhất không thể xoá dù không được quét, và chỉ mục dùng cho truy vấn chạy mỗi quý một lần."
    },
    {
      "q": "Chỉ mục tổ hợp có thể thay nhiều chỉ mục đơn không?",
      "a": "Có, và đây là cách giảm số chỉ mục hiệu quả nhất. Cơ chế: một chỉ mục tổ hợp trên ba cột có thể phục vụ các truy vấn lọc theo cột đầu, theo hai cột đầu, và theo cả ba — nhờ quy tắc tiền tố trái. Vì vậy một chỉ mục tổ hợp đúng thứ tự thường thay được hai hoặc ba chỉ mục đơn. Thực tế: kiểm tra thứ tự cột — cột được lọc bằng điều kiện bằng nên đứng trước, cột dùng cho khoảng hoặc sắp xếp nên đứng sau."
    }
  ],
  "q": "Vì sao càng nhiều index thì ghi càng chậm và tốn lưu trữ, và bạn quyết định giữ hay xóa một index thế nào?",
  "oral": "Bản chất: mỗi index là một cấu trúc dữ liệu phải cập nhật đồng bộ khi bạn insert update delete, nên một bảng có năm index thì một lần ghi phải sửa năm nơi cộng thêm kiểm tra UNIQUE. Cơ chế: index cũng chiếm dung lượng đĩa và RAM, làm VACUUM và sao lưu chậm hơn, index chết còn khiến planner chọn sai. Thực tế: bạn quyết định bằng số liệu — bật thống kê dùng index, tìm index không ai dùng, đo tỉ lệ đọc ghi của bảng, rồi xóa thử ở môi trường staging và quan sát EXPLAIN của truy vấn quan trọng. Bảng ghi nhiều đọc ít thì ít index, bảng đọc nhiều thì chấp nhận thêm index.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Chi phí ghi có index</strong>: mỗi index là một cây B-tree riêng phải cập nhật đồng bộ trong cùng một transaction, nên ghi càng nhiều index càng chậm.</li><li><strong>Index không ai dùng</strong>: index không được kế hoạch truy vấn nào chọn, chỉ tốn chỗ và làm chậm ghi; nhận diện bằng pg_stat_user_indexes.</li><li><strong>Tỉ lệ đọc và ghi</strong>: khối lượng đọc so với ghi quyết định nên giữ bao nhiêu index; hệ thống ghi nhiều như events thường chịu nhiều index hơn hệ đọc báo cáo.</li></ul><p><strong>Tình huống:</strong> bảng events ghi 8.000 dòng mỗi giây lúc mới ra mắt, hai năm và 14 index sau chỉ còn 1.100. Dung lượng phình từ 40 GB lên 190 GB. Mỗi index mới cứu một báo cáo và làm mọi lần ghi chậm thêm một chút.</p><p><strong>Cơ chế:</strong> mỗi index là một cây B-tree riêng phải cập nhật đồng bộ trong cùng transaction ghi. Một INSERT thành một lần sửa heap cộng một lần sửa cho mỗi index. UPDATE cột nằm trong index ghi thêm tuple chết chờ VACUUM. Dung lượng và WAL phình theo số cây.</p><p><strong>Đánh đổi:</strong> index giữ truy vấn đọc nóng sống sót, còn mỗi index mới đánh thuế lên mọi lần ghi sau đó. Hệ đọc nhiều trả thuế rẻ. Hệ ghi nhiều trả thuế đắt.</p><p><strong>Cách rà soát:</strong> bạn dùng <code>pg_stat_user_indexes</code> xem cột <code>idx_scan</code>: index bằng 0 trong nhiều tuần là ứng viên xóa. Một composite đúng tiền tố trái thay được nhiều index đơn. Partial index chỉ cho đơn chưa thanh toán nhỏ hơn nhiều và ít phải cập nhật.</p><ul><li>Dùng khi: giữ index phục vụ truy vấn nóng, ràng buộc UNIQUE, cột khóa ngoài, truy vấn theo mùa đã biết lịch.</li><li>Không dùng khi: index trùng tiền tố trái của composite khác, index đơn lẻ không ai quét, index cho báo cáo chạy một lần.</li></ul><p><strong>Lỗi hay gặp:</strong> xóa index theo cảm tính làm báo cáo quan trọng chậm đột ngột. Khi workload đổi từ ghi nhiều sang đọc nhiều, hoặc ngược lại sau một đợt tăng trưởng, thì đáp án đổi: bạn đo lại tỉ lệ đọc ghi rồi mới giữ hay xóa, và thử xóa ở staging kèm quan sát EXPLAIN của truy vấn quan trọng trước.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L08, Bài L21.</p>",
  "code": "SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read\nFROM pg_stat_user_indexes -- ✅ View thống kê tích lũy kể từ lần reset gần nhất\nWHERE schemaname = 'public'\nORDER BY idx_scan ASC; -- ✅ idx_scan = 0 trong nhiều tuần: ứng viên xóa",
  "expected": "Kết quả: trả về một dòng cho mỗi index thuộc schema public, gồm schemaname, relname, indexrelname, idx_scan và idx_tup_read, sắp tăng dần theo idx_scan nên các index ít được dùng nhất nằm trên cùng. Phân tích: pg_stat_user_indexes là view thống kê tích lũy từ lúc cụm khởi động hoặc lần reset gần nhất, không phải toàn bộ lịch sử; idx_scan bằng 0 nghĩa là từ đó tới nay chưa truy vấn nào dùng index này, idx_tup_read là số entry index đã đọc. Bảng này chỉ là công cụ nghi ngờ chứ không phải bằng chứng xóa: index phục vụ ràng buộc UNIQUE, khóa ngoài, hoặc truy vấn chạy theo mùa như báo cáo cuối tháng có thể có idx_scan bằng 0 mà vẫn phải giữ, và thống kê có thể đã bị reset sau restart nên con số 0 chưa đủ kết luận. Vì sao nhiều index làm ghi chậm: mỗi INSERT, UPDATE, DELETE phải cập nhật mọi index liên quan trong cùng transaction nên write amplification tăng theo số index, update cột được index còn tạo dead tuple trong cả heap lẫn index chờ VACUUM, và index dư thừa còn chiếm dung lượng đĩa lẫn cache. Quy trình an toàn là đối chiếu pg_stat_user_tables xem tỉ lệ seq scan và n_tup_upd, kiểm tra truy vấn nóng, rồi thử bỏ index trên staging trước khi bỏ ở production.",
  "followups": [
    {
      "q": "Bạn tìm index thừa và index không ai dùng bằng cách nào?",
      "a": "Bạn truy vấn pg_stat_user_indexes xem idx_scan bằng 0 trong thời gian dài, kết hợp pg_stat_user_tables xem tỉ lệ seq scan và n_tup_upd. Cơ chế: index trùng tiền tố trái của composite index khác thường là thừa. Thực tế: luôn đối chiếu với truy vấn quan trọng trước khi xóa vì thống kê có thể reset sau khởi động lại."
    },
    {
      "q": "Partial index và covering index giảm chi phí thế nào?",
      "a": "Partial index chỉ index tập con như đơn chưa thanh toán nên nhỏ hơn nhiều và ít phải cập nhật hơn. Cơ chế: covering index kèm INCLUDE không tự động cho index-only scan — nó chỉ có lợi khi phần lớn trang heap đã được đánh dấu all-visible trong visibility map, vì trang chưa được đánh dấu thì PostgreSQL vẫn phải ghé heap để kiểm tra khả kiến. Ngược lại INCLUDE làm index to hơn vì cột payload được nhân bản vào index, nên chỉ nên thêm khi bảng ít đổi và truy vấn thật sự đọc được từ index. Thực tế: lợi ích của partial index là chắc chắn, còn lợi ích của INCLUDE là có điều kiện và phải đo bằng EXPLAIN với ANALYZE, BUFFERS để xem node có phải Index Only Scan và heap fetch có bằng 0 không."
    }
  ],
  "pitfalls": [
    "Tưởng index miễn phí nên tạo cho mọi cột rồi hệ thống ghi chậm dần mà không rõ nguyên nhân.",
    "Xóa index theo cảm tính mà không kiểm tra truy vấn quan trọng nên báo cáo quan trọng chậm đột ngột."
  ],
  "selfcheck": [
    "Tôi vẫn chưa ước lượng được định lượng một index làm chậm ghi bao nhiêu phần trăm trên workload cụ thể.",
    "Tôi giải thích được vì sao năm index làm một lần insert thành nhiều lần sửa bằng ví dụ bảng orders ghi nhiều.",
    "Tôi có thể rà soát pg_stat_user_indexes rồi đề xuất giữ hay xóa một index cho bảng ghi nhiều."
  ],
  "refs": [
    "pg-indexes",
    "pg-mvcc"
  ]
},
{
  "id": "F06",
  "group": "F",
  "topic": "Đọc EXPLAIN và phân biệt estimate với actual",
  "prio": "P1",
  "level": "L2",
  "type": "situation",
  "incident": "<p><strong>Tình huống:</strong> một truy vấn báo cáo chạy 40 giây.</p><p><strong>Sai lầm:</strong> dev chạy <code>EXPLAIN</code> và thấy kế hoạch dùng chỉ mục với chi phí ước tính thấp, nên kết luận truy vấn đã tối ưu và đi tìm nguyên nhân ở chỗ khác.</p><p><strong>Thực tế:</strong> kế hoạch đó ước tính 1.200 dòng nhưng trả về 900.000 dòng, và thời gian thật nằm ở bước sắp xếp kết quả lớn đó.</p>",
  "askFirst": [
    "EXPLAIN và EXPLAIN ANALYZE khác nhau ở đâu? → Giải mã: EXPLAIN chỉ in kế hoạch dự tính kèm ước tính; ANALYZE chạy thật rồi in thêm số dòng và thời gian thật từng bước (Bài L08).",
    "Vì sao ước tính có thể lệch xa thực tế? → Giải mã: Ước tính dựa thống kê phân bố giá trị; thống kê cũ thì số dòng lệch hàng chục lần, sửa bằng phân tích lại bảng.",
    "Nhìn vào đâu để biết bước nào thực sự tốn thời gian? → Giải mã: Nhìn thời gian thật từng bước trong ANALYZE và con số dòng ước tính so với dòng thật, không nhìn chi phí tĩnh của kế hoạch (Bài L21)."
  ],
  "predict": {
    "q": "Kế hoạch hiển thị <code>rows=1200</code> ở một nút, nhưng khi chạy thật thì <code>actual rows=900000</code>. Bạn nghi ngờ nguyên nhân gì?",
    "a": "<p><strong>Thống kê của bảng đã cũ hoặc không đủ mịn.</strong> Bộ ước lượng dựa trên thống kê phân bố giá trị để đoán số dòng khớp, nên nếu dữ liệu thay đổi nhiều mà thống kê chưa được cập nhật, con số ước tính sẽ sai xa.</p><p><strong>Nguyên nhân thứ hai là tương quan giữa các cột:</strong> bộ ước lượng giả định các điều kiện độc lập với nhau, nên khi hai cột có tương quan mạnh — ví dụ thành phố và mã bưu chính — nó nhân các tỉ lệ và ra một con số nhỏ hơn thực tế rất nhiều.</p><p><strong>Cách xử lý:</strong> cập nhật thống kê, tăng độ chi tiết thống kê cho cột quan trọng, hoặc dùng thống kê mở rộng cho nhóm cột có tương quan.</p>"
  },
  "anchor": "EXPLAIN cho biết kế hoạch dự kiến còn EXPLAIN ANALYZE cho biết kế hoạch thật kèm thời gian từng bước — và khoảng cách giữa ước tính với thực tế chính là manh mối chẩn đoán.",
  "attacks": [
    {
      "q": "Bạn đọc EXPLAIN ANALYZE theo thứ tự nào?",
      "a": "Đọc từ nút trong cùng ra ngoài, vì đó là thứ tự thực thi. Cơ chế: với mỗi nút, so sánh số dòng ước tính với số dòng thật — lệch lớn là dấu hiệu thống kê sai. Nhìn thời gian thật của từng nút để biết chỗ nào tốn, nhưng nhớ rằng thời gian của nút cha đã bao gồm các nút con. Thực tế: tìm những nút có số vòng lặp lớn, vì một nút rẻ chạy 900.000 lần vẫn là nút đắt nhất; và chú ý các nút đọc từ đĩa thay vì từ bộ nhớ, vì chúng thường chỉ ra rằng kế hoạch đang phải đọc nhiều hơn dự kiến."
    },
    {
      "q": "Khi nào thì quét tuần tự lại là lựa chọn đúng?",
      "a": "Khi điều kiện lọc khớp một tỉ lệ lớn số dòng. Cơ chế: nếu một truy vấn cần 40% số dòng của bảng, đọc tuần tự theo thứ tự vật lý rẻ hơn nhiều so với việc nhảy qua lại giữa chỉ mục và bảng. Quét tuần tự cũng đúng khi bảng nhỏ, khi cần đọc gần hết các cột, hoặc khi thống kê cho thấy chỉ mục sẽ không thu hẹp được gì. Thực tế: thấy quét tuần tự trong kế hoạch không tự động là lỗi — cần so với tỉ lệ dòng thật sự khớp."
    }
  ],
  "q": "Một truy vấn chạy chậm dù đã có index, bạn dùng EXPLAIN và EXPLAIN ANALYZE thế nào để biết planner ước tính sai ở đâu?",
  "oral": "Bản chất: EXPLAIN in kế hoạch mà planner dự định, EXPLAIN ANALYZE thực thi thật rồi in thêm số dòng thật và thời gian thật từng node. Cơ chế: bạn so estimate rows với actual rows — nếu lệch hàng chục lần thì thống kê đã cũ, bạn chạy ANALYZE bảng đó rồi đọc lại. Nếu thấy Seq Scan trong khi mong Index Scan thì kiểm tra điều kiện có hàm bọc cột, kiểu dữ liệu lệch hay tính chọn lọc quá thấp; nếu thấy Nested Loop với bảng ngoài lớn thì có thể thiếu index phía trong. Thực tế: bạn sửa theo số liệu chứ không đoán, và nhớ EXPLAIN ANALYZE thật sự chạy truy vấn nên với lệnh ghi phải bọc transaction rồi rollback.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>EXPLAIN</strong>: in kế hoạch lập trình viên dự định chạy kèm số dòng và chi phí ước tính, không thực thi thật.</li><li><strong>EXPLAIN ANALYZE</strong>: thực thi truy vấn thật rồi in thêm số dòng và thời gian thật của từng bước; giống chấm điểm bài sau khi làm xong.</li><li><strong>Ước tính và thực tế lệch</strong>: lập trình viên dựa trên thống kê phân bố giá trị, thống kê cũ thì ước tính lệch xa, sửa bằng lệnh phân tích lại bảng.</li></ul><p><strong>Tình huống:</strong> dev nhìn con số chi phí thấp trong EXPLAIN rồi kết luận truy vấn đã tối ưu. Thực tế node đó ước tính 1.200 dòng nhưng trả về 900.000 dòng. Thời gian thật nằm ở bước sắp xếp mà không ai nhìn tới.</p><p><strong>Cơ chế:</strong> planner dùng thống kê phân bố giá trị để ước tính số dòng và chi phí mỗi node. EXPLAIN in kế hoạch dự định. EXPLAIN ANALYZE thực thi thật rồi in thêm số dòng thật và thời gian thật từng node.</p><p><strong>Estimate khác actual:</strong> estimate là phỏng đoán từ thống kê có thể cũ, còn actual là sự thật đo được. Khoảng cách giữa hai con số chính là manh mối chẩn đoán. Lệch hàng chục lần là thống kê sai.</p><p><strong>Cách đọc:</strong> bạn đọc từ node trong cùng ra ngoài, so estimate với actual ở từng node. Node lệch lớn kèm vòng lặp cao là nút thắt. Chạy ANALYZE cho bảng rồi đọc lại. Với lệnh ghi, bạn bọc transaction rồi rollback để EXPLAIN ANALYZE không sửa dữ liệu thật.</p><ul><li>Dùng khi: EXPLAIN ANALYZE kèm BUFFERS cho SELECT chậm, EXPLAIN thuần để xem kế hoạch lệnh ghi.</li><li>Không dùng khi: ANALYZE trực tiếp lên INSERT UPDATE DELETE ở production, tối ưu node cha mà bỏ qua node con tốn thời gian.</li></ul><p><strong>Lỗi hay gặp:</strong> nhầm estimate thành kết quả thật nên sửa sai chỗ. Khi bảng nhỏ hoặc truy vấn lấy phần lớn bảng thì đáp án đổi: Seq Scan là lựa chọn đúng vì đọc tuần tự rẻ hơn nhảy ngẫu nhiên giữa index và heap.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L08, Bài L21.</p>",
  "code": "EXPLAIN (ANALYZE, BUFFERS) -- ✅ ANALYZE: chạy thật và đo thời gian; BUFFERS: đếm trang đọc từ đĩa\nSELECT u.email, SUM(o.amount)\nFROM users u JOIN orders o ON o.user_id = u.id\nWHERE o.status = 'paid'\nGROUP BY u.email; -- ✅ So estimate rows với actual rows ở từng node; lệch hàng chục lần = thống kê cũ",
  "expected": "Kết quả: không trả về tập kết quả nghiệp vụ mà trả về cây kế hoạch thực thi kèm thời gian và buffer cho truy vấn tổng amount theo email của các đơn paid. Phân tích: hình dạng kế hoạch mong đợi là node gốc Aggregate trên một phép nối giữa users và orders; nếu orders có index trên (status, user_id) hoặc lọc được ít dòng thì planner thường chọn Hash Join với node con Index Scan hoặc Bitmap Heap Scan trên orders lọc status = 'paid', còn nếu bảng nhỏ hoặc lọc mất tính chọn lọc thì chọn Nested Loop với Seq Scan trên bảng ngoài và Index Scan trên bảng trong. Điểm quan trọng nhất khi đọc: EXPLAIN chỉ in rows và cost là ước tính từ pg_statistic và cost model, còn EXPLAIN ANALYZE in thêm actual rows và actual time là số thật; phải so hai cột đó ở từng node, chênh lệch hàng chục lần nghĩa là thống kê cũ hoặc ước tính tương quan sai nên chạy ANALYZE bảng liên quan rồi đọc lại. BUFFERS cho biết node nào đọc nhiều shared block, qua đó phân biệt chậm do IO thật hay do kế hoạch lặp quá nhiều lần như Nested Loop chạy hàng triệu vòng. Cạm bẫy: EXPLAIN ANALYZE thật sự thực thi câu lệnh nên với INSERT, UPDATE, DELETE ở production phải bọc BEGIN rồi ROLLBACK, còn muốn xem kế hoạch mà không chạy thì dùng EXPLAIN trần.",
  "followups": [
    {
      "q": "Estimate rows lệch actual rows hàng chục lần thì bạn làm gì đầu tiên?",
      "a": "Bạn chạy ANALYZE bảng liên quan để cập nhật thống kê rồi đọc lại kế hoạch. Cơ chế: nếu vẫn lệch do dữ liệu phân bố lệch hoặc điều kiện tương quan thì xem xét tăng statistics target cho cột đó hoặc viết lại điều kiện rõ ràng hơn. Thực tế: chỉ can thiệp sâu như hint hay sửa cấu trúc khi thống kê mới vẫn cho kế hoạch tệ."
    },
    {
      "q": "Seq Scan có phải lúc nào cũng xấu và Index Scan lúc nào cũng tốt?",
      "a": "Không, bảng nhỏ hoặc truy vấn lấy phần lớn bảng thì Seq Scan rẻ hơn vì đọc tuần tự ít IO ngẫu nhiên. Cơ chế: Index Scan tốt khi lọc ít dòng có tính chọn lọc cao. Thực tế: dấu hiệu xấu là Seq Scan trên bảng lớn với điều kiện lọc mạnh, hoặc Index Scan kèm hàng triệu lần lặp trong Nested Loop."
    }
  ],
  "pitfalls": [
    "Nhầm con số estimate thành kết quả thật nên sửa sai chỗ trong khi actual mới là sự thật.",
    "Chạy EXPLAIN ANALYZE lên lệnh ghi ở production làm dữ liệu thay đổi thật vì quên bọc rollback."
  ],
  "selfcheck": [
    "Tôi vẫn chưa đọc được chi tiết memory sort, parallel worker và buffer hit trong kế hoạch phức tạp.",
    "Tôi giải thích được cách so estimate với actual bằng ví dụ truy vấn JOIN users và orders có GROUP BY.",
    "Tôi có thể xử lý một báo cáo chậm bằng cách đọc EXPLAIN, chạy ANALYZE và kiểm tra điều kiện mất index."
  ],
  "refs": [
    "pg-explain"
  ]
},
{
  "id": "F07",
  "group": "F",
  "topic": "ACID và các mức isolation trong PostgreSQL",
  "prio": "P2",
  "level": "L2",
  "type": "concept",
  "incident": "<p><strong>Tình huống:</strong> hai transaction chạy đồng thời. Transaction A đọc số dư, kiểm tra thấy đủ tiền, rồi trừ tiền. Transaction B cũng đọc số dư trước khi A commit, cũng thấy đủ tiền, và cũng trừ.</p><p><strong>Hệ quả:</strong> kết quả số dư âm, dù mỗi transaction riêng lẻ đều đúng.</p><p><strong>Bối cảnh:</strong> cả hai đều chạy ở mức READ COMMITTED, mức mặc định — giống hai request FastAPI đồng thời đọc cùng dòng rồi ghi đè nhau.</p>",
  "askFirst": [
    "READ COMMITTED bảo đảm điều gì, và không bảo đảm điều gì? → Giải mã: Bảo đảm mỗi câu lệnh chỉ thấy thay đổi đã cam kết; không bảo đảm hai lần đọc cùng transaction thấy cùng thế giới (Bài L05).",
    "Vì sao hai transaction không thấy thay đổi của nhau? → Giải mã: Mỗi giao dịch đọc trên snapshot riêng do MVCC tạo; thay đổi chưa cam kết của bên kia chưa có mặt trong snapshot của bạn.",
    "Mức isolation nào ngăn được tình huống này? → Giải mã: SERIALIZABLE bắt buộc các giao dịch chạy như tuần tự; nhưng phải kèm bắt lỗi và thử lại, không phải chỉ đổi mức (Bài L22)."
  ],
  "predict": {
    "q": "Ở mức READ COMMITTED, transaction A đọc một dòng, transaction B cập nhật và commit dòng đó, rồi A đọc lại dòng đó. A thấy giá trị nào?",
    "a": "<p><strong>A thấy giá trị mới của B.</strong> Ở READ COMMITTED, mỗi câu lệnh trong transaction nhìn thấy một ảnh chụp mới nhất đã commit tại thời điểm câu lệnh bắt đầu — nên cùng một transaction có thể thấy hai giá trị khác nhau ở hai lần đọc.</p><p><strong>Đây là hiện tượng đọc không lặp lại được.</strong> Điều này cũng giải thích hành vi của câu <code>UPDATE</code> trong mức này: nếu một dòng đã bị transaction khác cập nhật và commit trong lúc câu lệnh đang chờ khoá, PostgreSQL đọc lại phiên bản mới và đánh giá lại điều kiện <code>WHERE</code> trên phiên bản đó.</p>"
  },
  "anchor": "READ COMMITTED chỉ hứa mỗi câu lệnh thấy dữ liệu đã commit, không hứa hai câu lệnh trong cùng transaction thấy cùng một thế giới.",
  "attacks": [
    {
      "q": "PostgreSQL triển khai REPEATABLE READ như thế nào?",
      "a": "Bằng snapshot isolation: transaction nhận một ảnh chụp cố định tại thời điểm bắt đầu, và mọi câu lệnh trong transaction đều đọc từ ảnh chụp đó. Cơ chế: hệ quả quan trọng là phantom read không xảy ra ở mức này trong PostgreSQL — điều khác với bảng chuẩn SQL, nơi REPEATABLE READ vẫn cho phép phantom. Thực tế: đánh đổi là nếu hai transaction cùng cập nhật một dòng, một trong hai sẽ nhận lỗi serialization failure và phải thử lại — đó là cơ chế phát hiện xung đột chứ không phải lỗi cần tránh bằng mọi giá."
    },
    {
      "q": "Mức SERIALIZABLE có làm chậm mọi thứ không?",
      "a": "Nó thêm chi phí theo dõi phụ thuộc giữa các transaction, nhưng trong PostgreSQL nó dùng snapshot isolation cộng với kiểm tra xung đột, chứ không dùng khoá trên toàn bảng. Cơ chế: chi phí thật nằm ở chỗ khác — một số transaction sẽ bị từ chối và phải thử lại, nên ứng dụng bắt buộc phải có vòng thử lại cho lỗi serialization. Thực tế: với khối lượng ghi lớn và tranh chấp cao, tỉ lệ phải thử lại tăng và đó là chi phí cần đo; với nghiệp vụ cần đúng tuyệt đối — số dư, tồn kho, đặt chỗ — mức này thường đáng giá."
    }
  ],
  "q": "ACID gồm những tính chất nào và các mức isolation trong PostgreSQL đánh đổi điều gì?",
  "oral": "Bản chất: ACID gồm Atomicity là mọi bước trong transaction hoặc thành công hết hoặc rollback hết, Consistency là dữ liệu chuyển từ trạng thái hợp lệ này sang trạng thái hợp lệ khác theo ràng buộc, Isolation là transaction đồng thời không thấy trạng thái dở dang của nhau, Durability là đã commit thì không mất dù mất điện nhờ WAL. Cơ chế: PostgreSQL có Read Committed thấy dữ liệu đã commit ở mỗi câu lệnh, Repeatable Read giữ snapshot cho cả transaction, Serializable giả lập chạy tuần tự và báo lỗi khi có phụ thuộc nguy hiểm. Thực tế: mức càng cao càng ít anomaly nhưng càng dễ lỗi retry và chậm hơn — chọn mức thấp nhất mà nghiệp vụ chấp nhận được.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>ACID</strong>: bốn tính chất giao dịch: hoặc xong hết hoặc huỷ hết, dữ liệu luôn hợp lệ, giao dịch không thấy trạng thái dở của nhau, đã commit thì giữ được; giống máy rút tiền: giao dịch hoặc vào tiền hoặc không, không vào nửa chừng.</li><li><strong>READ COMMITTED</strong>: mức cách ly mặc định, mỗi câu lệnh lấy lại hình chụp mới nên thấy thay đổi đã commit của bên khác ngay, nhưng không chặn đọc lại sau rồi ghi đè.</li><li><strong>MVCC</strong>: nhiều phiên bản dòng tồn tại cùng lúc, mỗi giao dịch đọc trên hình chụp riêng; giống đọc bản ghi sổ bằng mực phai dần thay vì xoá sửa.</li></ul><p><strong>Tình huống:</strong> hai transaction cùng trừ tiền một tài khoản và cùng thấy số dư đủ. Mỗi cái chạy riêng đều đúng. Cộng lại số dư âm. Cả hai chạy ở READ COMMITTED, mức mặc định mà đội chưa từng đổi.</p><p><strong>Cơ chế MVCC:</strong> PostgreSQL giữ nhiều phiên bản dòng bằng MVCC. READ COMMITTED lấy snapshot mới cho mỗi câu lệnh nên hai lần đọc trong một transaction thấy hai thế giới khác nhau. REPEATABLE READ giữ một snapshot cho cả transaction nên đọc lặp ổn định. SERIALIZABLE theo dõi phụ thuộc đọc ghi rồi abort transaction có vòng nguy hiểm.</p><p><strong>PostgreSQL mạnh hơn chuẩn SQL:</strong> REPEATABLE READ của PostgreSQL chặn luôn phantom read nhờ snapshot isolation, còn chuẩn SQL chỉ yêu cầu chặn non-repeatable read ở mức này. Một cái là cài đặt thực tế mạnh hơn, một cái là yêu cầu tối thiểu trên giấy. Bạn phỏng vấn bằng hành vi PostgreSQL, không phải bảng chuẩn SQL.</p><p><strong>Ví dụ chuyển tiền kèm kiểm tra số dư:</strong> ở READ COMMITTED bạn khóa dòng bằng SELECT FOR UPDATE trước khi trừ. Ở SERIALIZABLE bạn để database abort rồi retry khi gặp lỗi 40001. Giữ transaction ngắn để snapshot không chặn VACUUM.</p><ul><li>Dùng khi: READ COMMITTED cho thao tác đơn, REPEATABLE READ cho báo cáo cần ảnh chụp ổn định, SERIALIZABLE cho logic tồn kho tranh chấp cao kèm retry.</li><li>Không dùng khi: nâng mức isolation thay cho khóa dòng đúng chỗ, giữ transaction mở lâu để giữ snapshot.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng mức cao hơn thì dữ liệu tự đúng mà quên code vẫn phải retry. Khi tỉ lệ tranh chấp tăng từ hiếm lên dày đặc thì đáp án đổi: bạn chuyển sang khóa dòng tường minh và thu ngắn transaction thay vì chỉ nâng mức isolation.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L22.</p>",
  "code": null,
  "expected": null,
  "followups": [
    {
      "q": "Dirty read, non-repeatable read và phantom read khác nhau ra sao?",
      "a": "Dirty read là đọc dữ liệu chưa commit có thể bị rollback, PostgreSQL không cho mức này xảy ra. Non-repeatable read là đọc lại cùng dòng mà giá trị đã đổi vì transaction khác commit xen giữa. Phantom read là truy vấn lại cùng điều kiện mà tập dòng tăng hoặc giảm. Cơ chế: Read Committed cho phép cả non-repeatable read lẫn phantom read vì mỗi câu lệnh lấy một snapshot mới. Repeatable Read của PostgreSQL loại bỏ cả hai — nó dùng snapshot isolation nên mạnh hơn mức tối thiểu mà chuẩn SQL yêu cầu, chứ không chỉ giảm nhẹ như bảng của chuẩn SQL. Thực tế: cái nó chưa chặn là các bất thường tuần tự hoá rộng hơn như ghi đè lẫn nhau trên cùng dòng, và lúc đó nó trả lỗi could not serialize access due to concurrent update với mã 40001; Serializable mới là mức ngăn được cả các bất thường đó."
    },
    {
      "q": "Khi nào bạn chọn Serializable và phải viết code thế nào?",
      "a": "Bạn chọn khi logic tiền, tồn kho hay đặt chỗ không chịu được race dù đã khóa cẩn thận. Cơ chế: code phải bắt lỗi serialization failure với mã 40001 rồi retry toàn bộ transaction với backoff, giữ transaction ngắn và chỉ chạm dữ liệu cần thiết. Thực tế: nếu tỉ lệ retry quá cao thì quay về khóa tường minh thay vì Serializable mọi nơi."
    }
  ],
  "pitfalls": [
    "Tưởng mức isolation cao hơn thì dữ liệu tự đúng mà quên code vẫn phải retry khi bị abort.",
    "Giữ transaction mở lâu để giữ snapshot ổn định rồi gây bloat và chặn VACUUM."
  ],
  "selfcheck": [
    "Tôi vẫn chưa phân biệt được mọi trường hợp serialization anomaly ngoài ví dụ đếm tiền điển hình.",
    "Tôi giải thích được bốn tính chất ACID và ba mức isolation bằng ví dụ chuyển tiền và báo cáo tồn kho.",
    "Tôi có thể chọn mức isolation cho một API trừ tồn kho và thêm logic retry khi gặp lỗi 40001."
  ],
  "refs": [
    "pg-transactions",
    "pg-mvcc"
  ]
},
{
  "id": "F08",
  "group": "F",
  "topic": "Khóa dòng và deadlock giữa hai transaction",
  "prio": "P0",
  "level": "L3",
  "type": "debug",
  "attacks": [
    {
      "q": "Deadlock khác khoá chờ bình thường ở đâu, và vì sao cơ sở dữ liệu phải chọn một bên để huỷ?",
      "a": "Khoá chờ bình thường sẽ tự giải quyết khi bên giữ khoá hoàn tất. Deadlock là vòng chờ khép kín: mỗi bên giữ một khoá mà bên kia đang cần, nên không bên nào có thể tiến tiếp và tình trạng sẽ kéo dài vô hạn. Cơ sở dữ liệu phát hiện vòng này và huỷ một giao dịch để phá vòng, vì nếu không thì cả hai treo mãi. Vì vậy deadlock không phải lỗi cần loại bỏ hoàn toàn mà là tình huống phải chịu được: ứng dụng phải bắt lỗi và thử lại giao dịch bị huỷ."
    },
    {
      "q": "Cách phòng deadlock hiệu quả nhất trong thực tế là gì?",
      "a": "Là làm cho mọi giao dịch truy cập tài nguyên theo cùng một thứ tự. Nếu mọi chỗ đều khoá bảng A trước rồi mới tới B, vòng chờ khép kín không thể hình thành. Điều này thường đạt được bằng cách sắp xếp các thao tác cập nhật theo khoá chính trước khi thực thi, ví dụ luôn xử lý theo thứ tự định danh tăng dần. Biện pháp thứ hai là giữ giao dịch ngắn để giảm cửa sổ tranh chấp. Và biện pháp thứ ba là bắt lỗi deadlock ở tầng ứng dụng và thử lại, vì dù có phòng thế nào thì deadlock vẫn có thể xảy ra khi hệ thống phức tạp."
    }
  ],
  "incident": "<p><strong>Tình huống:</strong> 2 giờ sáng, API chuyển tiền trả 500 kèm deadlock detected vài lần mỗi phút.</p><p><strong>Cơ chế:</strong> transaction A khóa dòng 1 rồi xin dòng 2. Transaction B khóa dòng 2 rồi xin dòng 1. Mỗi lần chạy riêng đều đúng, chạy cùng nhau là một bên bị hủy.</p><p><strong>Điểm mấu chốt:</strong> UPDATE giữ khóa dòng tới lúc commit. Hai transaction xin cùng tập khóa theo thứ tự ngược nhau tạo vòng chờ khép kín. Không bên nào tiến được. Bộ phát hiện deadlock quét đồ thị chờ rồi abort một bên để phá vòng.</p>",
  "askFirst": [
    "Vì sao hai transaction này chờ nhau mãi thay vì lần lượt? → Giải mã: Mỗi bên đã giữ một khóa rồi xin cái kia giữ, tạo vòng chờ khép kín; không ai hủy nên không ai tiến, đó là deadlock (Bài L22).",
    "Thứ tự lấy khóa ảnh hưởng gì tới deadlock? → Giải mã: Lấy khóa theo thứ tự ngược nhau mới tạo vòng chờ; mọi transaction tuân cùng một thứ tự cố định thì không thể deadlock (Bài L05)."
  ],
  "predict": {
    "q": "Bạn đoán điều gì xảy ra nếu cả hai transaction đều SELECT FOR UPDATE theo ORDER BY id trước khi cập nhật?",
    "a": "<p><strong>Cả hai cùng xin khóa theo thứ tự id tăng dần</strong> nên bên sau chờ bên trước thay vì chờ chéo nhau. Vòng chờ biến mất, chỉ còn chờ đợi tuần tự và không còn <code>deadlock detected</code>. Điều kiện là mọi đường code chạm cùng tập dòng đều tuân thủ một thứ tự duy nhất.</p>"
  },
  "anchor": "Hai transaction lấy cùng tập dòng theo thứ tự ngược nhau mà không có ORDER BY thống nhất = vòng chờ chéo và deadlock detected.",
  "q": "Hai transaction cùng cập nhật hai dòng users theo thứ tự ngược nhau rồi treo đến khi một bên báo deadlock, lỗi nằm ở đâu và sửa thế nào?",
  "oral": "Bản chất: lỗi nằm ở thứ tự lấy khóa ngược nhau — transaction A khóa dòng 1 rồi xin dòng 2, transaction B khóa dòng 2 rồi xin dòng 1 nên cả hai chờ nhau mãi. Cơ chế: PostgreSQL phát hiện vòng chờ rồi abort một bên với deadlock detected. Thực tế: sửa gốc là ép mọi transaction cập nhật nhiều dòng theo cùng một thứ tự, ví dụ ORDER BY id, hoặc gộp thành một câu lệnh duy nhất, hoặc giảm thời gian giữ khóa bằng cách commit sớm. Ở tầng ứng dụng bạn bắt lỗi deadlock rồi retry an toàn vì bên bị abort chưa để lại thay đổi nào đã commit.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Khoá dòng</strong>: khi cập nhật một dòng, giao dịch giữ khoá độc quyền tới khi cam kết; người khác cập nhật dòng đó phải đứng đợi, giống giữ bút duy nhất ký hồ sơ.</li><li><strong>Deadlock</strong>: hai giao dịch mỗi người giữ một tài nguyên rồi cùng chờ tài nguyên của người kia, vòng chờ khép kín; như hai xe chạy ngược trong ngõ hẹp không ai nhường.</li><li><strong>Phát hiện deadlock</strong>: database phát hiện vòng chờ rồi huỷ một giao dịch kèm thông báo deadlock; phía ứng dụng phải bắt lỗi và thử lại thay vì coi là hỏng.</li></ul><p><strong>Tình huống:</strong> hai giờ sáng, API chuyển tiền trả 500 kèm deadlock detected vài lần mỗi phút. Transaction A khóa dòng 1 rồi xin dòng 2. Transaction B khóa dòng 2 rồi xin dòng 1. Mỗi lần chạy riêng đều đúng, chạy cùng nhau là một bên bị hủy.</p><p><strong>Cơ chế:</strong> UPDATE giữ khóa dòng tới lúc commit. Hai transaction xin cùng tập khóa theo thứ tự ngược nhau tạo vòng chờ khép kín. Không bên nào tiến được. Bộ phát hiện deadlock quét đồ thị chờ rồi abort một bên để phá vòng.</p><p><strong>Chờ khóa thường tự hết khi bên giữ khóa commit, còn deadlock không bao giờ tự hết vì mỗi bên giữ đúng thứ khóa bên kia cần. Một cái là xếp hàng, một cái là kẹt cứng. Database phải hủy một bên.</p><p><strong>Cách sửa gốc:</strong> mọi đường code chạm cùng tập dòng đều khóa theo một thứ tự: <code>SELECT ... FOR UPDATE ORDER BY id</code> rồi cập nhật cùng thứ tự. Gọi API bên ngoài trước, mở transaction cập nhật nhanh gọn sau. Bên bị abort retry an toàn vì chưa commit gì.</p><ul><li>Dùng khi: ORDER BY id thống nhất mọi nơi, gộp nhiều UPDATE thành một câu lệnh, transaction ngắn.</li><li>Không dùng khi: giữ khóa qua gọi mạng hay chờ user nhập, cập nhật hàng loạt không thứ tự, chỉ retry mà không sửa thứ tự khóa.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng deadlock là lỗi ngẫu nhiên của database. Khi tải đồng thời tăng gấp mười thì đáp án đổi: thứ tự khóa từng đủ tốt bắt đầu kẹt, bạn tách hàng nóng ra khỏi transaction chung hoặc gộp ghi thành batch theo thứ tự id duy nhất.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L22.</p>",
  "code": "SELECT * FROM users WHERE id IN (1, 2) ORDER BY id FOR UPDATE; -- ✅ Khóa dòng theo thứ tự id duy nhất, ngăn deadlock\nUPDATE users SET balance = balance - 100 WHERE id = 1;\nUPDATE users SET balance = balance + 100 WHERE id = 2;",
  "expected": "Kết quả: lỗi gốc là hai transaction khóa hai dòng theo thứ tự ngược nhau nên tạo vòng chờ. PostgreSQL báo deadlock detected và abort một transaction, transaction còn lại tiếp tục. Sửa đúng là mọi nơi đều SELECT FOR UPDATE theo ORDER BY id rồi cập nhật cùng thứ tự, giữ transaction ngắn và retry bên bị abort. Hành vi này đúng cho mọi phiên bản PostgreSQL hiện hành vì cơ chế khóa dòng và phát hiện deadlock là chuẩn.",
  "followups": [
    {
      "q": "SELECT FOR UPDATE và thứ tự ORDER BY ngăn deadlock thế nào?",
      "a": "SELECT FOR UPDATE lấy khóa ngay khi đọc nên cả hai transaction cùng xin khóa theo thứ tự id tăng dần, bên sau chờ bên trước thay vì chờ chéo nhau. Cơ chế: vòng chờ không còn nên deadlock biến mất, chỉ còn chờ đợi tuần tự. Thực tế: điều kiện là mọi đường code chạm cùng tập bảng đều tuân thủ một thứ tự duy nhất."
    },
    {
      "q": "Vì sao không nên giữ transaction mở qua gọi API bên ngoài?",
      "a": "Vì khóa dòng bị giữ suốt thời gian chờ mạng nên mọi transaction khác phải xếp hàng, throughput sụt mạnh và xác suất deadlock tăng theo thời gian giữ khóa. Cơ chế: cách đúng là gọi API trước, tính toán xong rồi mới mở transaction cập nhật nhanh gọn. Thực tế: transaction database chỉ nên bao phần đọc ghi cần nguyên tử."
    },
    {
      "q": "Khi retry sau deadlock cần chú ý gì để không ghi trùng?",
      "a": "Bạn chỉ retry khi toàn bộ transaction bị abort và chưa commit, tốt nhất retry cả khối từ BEGIN. Cơ chế: nếu transaction đã gửi email hay gọi API ngoài thì phải làm bước đó idempotent hoặc tách ra ngoài transaction. Thực tế: đặt giới hạn số lần retry kèm backoff để tránh bão retry khi điểm nóng quá tải."
    }
  ],
  "pitfalls": [
    "Tưởng deadlock là lỗi ngẫu nhiên của database nên chỉ retry mà không sửa thứ tự khóa.",
    "Giữ transaction mở qua xử lý chậm làm deadlock xuất hiện dày đặc khi tải tăng."
  ],
  "selfcheck": [
    "Tôi vẫn chưa đọc được deadlock detector log để vẽ chính xác đồ thị chờ của ba transaction trở lên.",
    "Tôi giải thích được vòng chờ A khóa 1 chờ 2 còn B khóa 2 chờ 1 bằng ví dụ chuyển tiền giữa hai user.",
    "Tôi có thể sửa một API chuyển tiền hay bị deadlock bằng cách ép ORDER BY id và thu ngắn transaction."
  ],
  "refs": [
    "pg-transactions",
    "pg-mvcc"
  ]
},
{
  "id": "F09",
  "group": "F",
  "topic": "Race check-then-insert và upsert an toàn",
  "prio": "P1",
  "level": "L3",
  "type": "predict",
  "incident": "<p><strong>Tình huống:</strong> một endpoint đăng ký kiểm tra email rồi mới chèn. Hai request cùng email tới trong cùng một mili giây.</p><p><strong>Cơ chế:</strong> cả hai đều kiểm tra và đều thấy email chưa tồn tại, cả hai đều chèn thành công — giống hai request FastAPI đồng thời gọi SELECT rồi INSERT mà không có ràng buộc.</p><p><strong>Hệ quả:</strong> giờ có hai tài khoản cùng email và không có lỗi nào được ghi lại.</p>",
  "askFirst": [
    "Vì sao kiểm tra rồi chèn lại không an toàn? → Giải mã: SELECT rồi INSERT là hai câu lệnh rời, có khe hở cho request thứ hai chen vào; cả hai cùng thấy trống rồi cùng chèn (Bài L22).",
    "Ràng buộc nào ở tầng database ngăn được việc này? → Giải mã: UNIQUE trên email; một bên ghi thành công, bên kia lỗi trùng rồi bắt và xử lý, đó là lưới an toàn cuối (Bài L05).",
    "Làm sao chèn an toàn mà không cần khoá bảng? → Giải mã: UPSERT kèm câu điều kiện chạy nguyên tử trong một bước, hoặc ghi có điều kiện ở store hỗ trợ (Bài L21)."
  ],
  "predict": {
    "q": "Hai transaction cùng chạy <code>SELECT</code> kiểm tra rồi <code>INSERT</code> cùng một giá trị duy nhất. Chuyện gì xảy ra nếu cột có ràng buộc duy nhất?",
    "a": "<p><strong>Một transaction chèn thành công, transaction còn lại nhận lỗi vi phạm ràng buộc duy nhất.</strong> Đây là hành vi mong muốn: ràng buộc ở tầng database là thứ duy nhất thực sự nguyên tử trước hai request đồng thời, vì nó được thực thi bên trong database chứ không phải trong logic ứng dụng.</p><p><strong>Ứng dụng phải bắt lỗi đó</strong> và chuyển thành phản hồi phù hợp — thường là 409 Conflict — thay vì để nó thành lỗi 500. Nếu không có ràng buộc duy nhất thì cả hai đều thành công và bạn có dữ liệu trùng.</p>"
  },
  "anchor": "Kiểm tra rồi ghi là hai thao tác riêng biệt, nên chỉ ràng buộc ở tầng database mới thực sự nguyên tử dưới concurrency.",
  "attacks": [
    {
      "q": "Làm sao chèn hoặc cập nhật trong một thao tác duy nhất?",
      "a": "Dùng câu lệnh upsert của PostgreSQL: INSERT ... ON CONFLICT (cột) DO UPDATE SET .... Nó thực hiện việc chèn và xử lý xung đột trong một câu lệnh nguyên tử, nên không có cửa sổ giữa kiểm tra và ghi. Biến thể DO NOTHING phù hợp khi bạn chỉ muốn bỏ qua nếu đã tồn tại. ON CONFLICT cần một chỉ mục duy nhất hoặc ràng buộc duy nhất trên đúng cột bạn chỉ định, nếu không nó sẽ báo lỗi. Thực tế: trong môi trường có tranh chấp cao, upsert vẫn có thể phải chờ khoá nhưng sẽ không tạo dữ liệu trùng."
    },
    {
      "q": "Nếu tôi dùng khoá ở tầng ứng dụng thì có đủ không?",
      "a": "Chỉ khi mọi đường ghi đều đi qua đúng một tiến trình và khoá đó thực sự bao quanh cả bước kiểm tra lẫn bước ghi. Cơ chế: với nhiều worker hoặc nhiều máy, khoá trong bộ nhớ của một tiến trình không nhìn thấy khoá của tiến trình khác, nên hai request vào hai worker vẫn chèn trùng. Khoá phân tán có thể dùng được nhưng thêm một phụ thuộc và một điểm hỏng mới. Thực tế: ràng buộc ở database rẻ hơn, luôn đúng, và không cần hạ tầng thêm."
    }
  ],
  "q": "Hai request cùng kiểm tra email chưa tồn tại rồi cùng INSERT, chuyện gì xảy ra nếu chỉ có SELECT kiểm tra mà không có UNIQUE và upsert?",
  "oral": "Bản chất: nếu không có UNIQUE thì cả hai SELECT đều thấy trống rồi cùng INSERT thành công, kết quả là hai user trùng email mà không ai báo lỗi. Cơ chế: nếu có UNIQUE thì một bên thành công, bên kia lỗi unique violation và code phải xử lý. Thực tế: cách đúng là đặt UNIQUE ở database rồi dùng INSERT ON CONFLICT DO NOTHING hoặc DO UPDATE để biến race thành hành vi xác định. Bạn không bao giờ tin kiểm tra SELECT rồi INSERT là nguyên tử vì giữa hai câu lệnh luôn có khe hở cho request khác chen vào.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Race condition</strong>: kết quả phụ thuộc vào trình tự chưa biết của các thao tác chạy song song; hai lệnh riêng rẽ luôn có khe hở để bên thứ hai chen vào.</li><li><strong>UNIQUE constraint</strong>: ràng buộc duy nhất ở tầng database là lưới an toàn cuối, một bên ghi thành công, bên kia gặp lỗi trùng.</li><li><strong>Upsert</strong>: lệnh chèn kèm cập nhật nếu đã tồn tại, chạy nguyên tử trong một bước; giống cập nhật hoặc tạo mới, không bao giờ để hai người chèn cùng lúc.</li></ul><p><strong>Tình huống:</strong> hai request đăng ký cùng email tới trong một mili giây. Cả hai kiểm tra rồi cùng thấy trống. Cả hai chèn thành công. Giờ có hai tài khoản cùng email và không một dòng log lỗi nào.</p><p><strong>Cơ chế:</strong> SELECT rồi INSERT là hai câu lệnh rời rạc với một khe hở ở giữa. Ở READ COMMITTED mỗi câu lệnh thấy snapshot riêng nên cả hai cùng thấy email trống. Không có UNIQUE thì cả hai lần ghi đều hợp lệ. Có UNIQUE thì lần ghi sau bị chặn nguyên tử ở tầng index.</p><p><strong>Kiểm tra ở code ứng dụng chỉ đúng khi chạy tuần tự, còn ràng buộc UNIQUE đúng cả khi chạy đồng thời. Một cái là lời hứa của một tiến trình, một cái là bảo đảm của database. Race chỉ nể cái thứ hai.</p><p><strong>Cách đúng:</strong> bạn đặt UNIQUE ở database rồi dùng <code>INSERT ... ON CONFLICT (email) DO NOTHING</code> để giữ lần ghi đầu, hoặc <code>DO UPDATE</code> để đồng bộ từ <code>EXCLUDED</code>. Cột arbiter phải khớp đúng UNIQUE, nếu sai arbiter thì PostgreSQL báo lỗi không có ràng buộc nào khớp chứ không âm thầm bỏ qua xung đột.</p><ul><li>Dùng khi: UNIQUE cộng upsert cho tài nguyên cần duy nhất, retry sau timeout, import idempotent.</li><li>Không dùng khi: khóa bảng hay sleep để chữa race, upsert cho logic nhiều bước cần kiểm tra nghiệp vụ phức tạp.</li></ul><p><strong>Lỗi hay gặp:</strong> tạo upsert nhưng quên UNIQUE tương ứng. Khi logic vượt quá một dòng, ví dụ trừ quota rồi mới tạo đơn, thì đáp án đổi: bạn chuyển sang advisory lock hoặc hàng đợi tuần tự thay vì upsert đơn lẻ.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L22.</p>",
  "code": "INSERT INTO users (email, name) VALUES ('a@example.com', 'An')\nON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name; -- ✅ Upsert nguyên tử: cần UNIQUE trên email làm arbiter",
  "expected": "Không có UNIQUE thì cả hai request đều insert thành công và tạo hai dòng trùng email. Có UNIQUE dạng plain INSERT thì một bên thành công một bên nhận lỗi unique violation. Với câu lệnh upsert trên thì một bên insert, bên còn lại chuyển thành update ngay trong cùng câu lệnh nên không lỗi và không trùng. Hành vi này đúng cho các phiên bản PostgreSQL hỗ trợ ON CONFLICT.",
  "followups": [
    {
      "q": "ON CONFLICT DO NOTHING và DO UPDATE khác nhau khi nào?",
      "a": "DO NOTHING bỏ qua xung đột và giữ dòng cũ, phù hợp import idempotent hay giữ lần ghi đầu. DO UPDATE ghi đè hoặc cộng dồn từ EXCLUDED, phù hợp đồng bộ profile hay tăng bộ đếm. Cơ chế: DO UPDATE bắt buộc có conflict_target là cột hoặc ràng buộc UNIQUE, và không hỗ trợ exclusion constraint; còn DO NOTHING thì conflict_target là tùy chọn."
    },
    {
      "q": "Vì sao retry sau timeout dễ tạo trùng và upsert cứu được?",
      "a": "Vì client không biết request đầu đã commit hay chưa nên gửi lại lần hai, check-then-insert sẽ tạo dòng thứ hai. Cơ chế: upsert với cùng khóa UNIQUE biến lần gửi lại thành cập nhật hoặc bỏ qua nên an toàn khi thử lại. Thực tế: đây là nền tảng của API idempotent khi kết hợp khóa idempotency từ client."
    }
  ],
  "pitfalls": [
    "Tưởng SELECT kiểm tra rồi INSERT là đủ an toàn trong khi khe race luôn tồn tại giữa hai câu lệnh.",
    "Tạo upsert nhưng quên UNIQUE tương ứng nên câu lệnh không khớp arbiter và báo lỗi thay vì xử lý xung đột."
  ],
  "selfcheck": [
    "Tôi vẫn chưa phân biệt được mọi biến thể arbiter ON CONFLICT với partial index và nhiều cột.",
    "Tôi giải thích được race hai request đăng ký cùng email bằng ví dụ SELECT rồi INSERT và cách UNIQUE chặn lại.",
    "Tôi có thể chuyển một API đăng ký hay bị trùng thành UNIQUE cộng INSERT ON CONFLICT an toàn khi retry."
  ],
  "refs": [
    "pg-upsert",
    "pg-constraints",
    "pg-transactions"
  ]
},
{
  "id": "F10",
  "group": "F",
  "topic": "Lost update và optimistic so với pessimistic locking",
  "prio": "P1",
  "level": "L3",
  "type": "situation",
  "incident": "<p><strong>Tình huống:</strong> một bộ đếm lượt xem được cập nhật bằng cách đọc giá trị hiện tại, cộng một, rồi ghi lại.</p><p><strong>Hệ quả:</strong> với 300 lượt xem mỗi giây, con số cuối ngày thấp hơn số lượt thật khoảng 18%. Không có lỗi nào trong log; chỉ có một số lần cập nhật bị mất.</p><p><strong>Song song:</strong> một quy trình chỉnh sửa hồ sơ bị mất thay đổi khi hai nhân viên sửa cùng lúc — giống hai người dùng React form đồng thời submit cùng một state cũ.</p>",
  "askFirst": [
    "Hai thao tác nào đang chồng lên nhau? → Giải mã: Đọc giá trị rồi tính ghi đè lên chính giá trị vừa đọc; hai phiên bản cũ cùng ghi, bên sau nuốt bên trước (Bài L22).",
    "Khoá bi quan và lạc quan khác nhau ở đâu? → Giải mã: Bi quan khoá dòng ngay khi mở, người khác chờ; lạc quan ghi kèm điều kiện phiên bản, người sau phát hiện đổi và xử lý (Bài L05).",
    "Cách nào rẻ hơn cho trường hợp này? → Giải mã: Khi tranh chấp hiếm, lạc quan rẻ vì không giữ khoá; tranh chấp dày thì bi quan hoặc gộp ghi thành batch (Bài L21)."
  ],
  "predict": {
    "q": "Hai transaction cùng đọc <code>count = 10</code>, mỗi cái ghi <code>count = 11</code>. Kết quả cuối là bao nhiêu?",
    "a": "<p><strong>Kết quả là 11, không phải 12.</strong> Đây là lost update kinh điển: cả hai đọc cùng một giá trị cũ, cả hai tính ra cùng một giá trị mới, và lần ghi sau ghi đè lần ghi trước nên một thay đổi biến mất hoàn toàn. Không có lỗi nào được ném ra vì cả hai câu lệnh đều hợp lệ.</p><p><strong>Cách sửa rẻ nhất là để database tự tính:</strong> <code>UPDATE t SET count = count + 1 WHERE id = ?</code> — phép cộng được thực hiện bên trong database trên phiên bản mới nhất của dòng, nên không có cửa sổ nào để mất.</p>"
  },
  "anchor": "Đọc rồi ghi là hai bước, nên giữa chúng luôn có cửa sổ để thay đổi của người khác biến mất — để database tự tính là cách xoá bỏ cửa sổ đó.",
  "attacks": [
    {
      "q": "Khoá lạc quan và khoá bi quan chọn theo tiêu chí nào?",
      "a": "Theo tần suất xung đột và thời gian giữ khoá. Cơ chế: khoá lạc quan — đọc kèm số phiên bản, ghi với điều kiện phiên bản chưa đổi — phù hợp khi xung đột hiếm, vì không giữ khoá nào và không chặn ai. Khoá bi quan — SELECT ... FOR UPDATE — phù hợp khi xung đột thường xuyên hoặc khi thao tác cần nhiều bước đọc ghi liên tiếp, vì nó đảm bảo không ai xen vào giữa. Thực tế: đánh đổi của khoá bi quan là nó giữ tài nguyên và có thể gây deadlock nếu thứ tự khoá không nhất quán."
    },
    {
      "q": "Cách rẻ nhất để tăng một bộ đếm là gì?",
      "a": "Để database làm phép tính trong câu lệnh, như SET count = count + 1. Cơ chế: nếu bộ đếm có tranh chấp rất cao trên cùng một dòng, cách tiếp theo là gộp nhiều lần tăng ở tầng ứng dụng rồi ghi một lần theo lô — chấp nhận mất một ít độ chính xác tức thời để đổi lấy thông lượng. Với bộ đếm không cần chính xác tuyệt đối, có thể dùng phép tăng nguyên tử ở một kho lưu trữ khoá-giá trị, hoặc ghi sự kiện rồi tổng hợp định kỳ. Thực tế: điều không nên làm là đọc rồi ghi trong ứng dụng."
    }
  ],
  "q": "Hai người cùng mở một đơn hàng để sửa số lượng, làm sao để người sửa sau không ghi đè mất thay đổi của người sửa trước?",
  "oral": "Bản chất: đây là lost update — cả hai đọc cùng phiên bản cũ rồi ghi đè nhau, thay đổi của người đầu biến mất. Cơ chế: bạn có hai hướng. Pessimistic locking là SELECT FOR UPDATE để khóa dòng ngay khi mở sửa, người sau phải chờ, phù hợp tranh chấp cao và thao tác ngắn. Optimistic locking là thêm cột version, khi update kiểm tra version vẫn như lúc đọc, nếu khác thì báo xung đột và yêu cầu tải lại, phù hợp tranh chấp thấp và form mở lâu. Thực tế: với form web mở lâu thì optimistic thân thiện hơn vì không giữ kết nối và khóa trong lúc user suy nghĩ.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Lost update</strong>: hai bên đọc cùng phiên bản cũ rồi ghi đè nhau, thay đổi của người đi trước biến mất; giống hai người in cùng tờ phiếu, ghi tay rồi nộp, phiếu sau làm mất chữ của phiếu trước.</li><li><strong>Pessimistic locking</strong>: khoá dòng ngay khi mở sửa, người khác chờ tới khi giao; an toàn nhưng chiếm dây chuyền, giống giữ số máy điện thoại trong khi nghe.</li><li><strong>Optimistic locking</strong>: ghi kèm điều kiện số phiên bản, bên tới sau phát hiện số phiên bản đổi và xử lý; giống ghi lên bản thảo, nộp mà bản in đã đổi thì phải gộp lại.</li></ul><p><strong>Tình huống:</strong> cuối ngày, bộ đếm lượt xem thiếu 18 phần trăm dù không có lỗi nào trong log. Hai nhân viên sửa cùng một hồ sơ và thay đổi của người đầu lặng lẽ biến mất. Mọi câu lệnh chạy riêng đều đúng.</p><p><strong>Cơ chế MVCC:</strong> hai transaction cùng đọc một phiên bản cũ. Mỗi bên tính giá trị mới từ bản cũ rồi ghi đè nhau. Lần ghi sau nuốt lần ghi trước. Không có lỗi vì cả hai câu lệnh đều hợp lệ.</p><p><strong>Pessimistic khác optimistic:</strong> pessimistic giữ khóa dòng từ lúc đọc tới lúc commit nên người sau phải chờ, còn optimistic không giữ gì mà kiểm tra version lúc ghi nên người sau nhận xung đột tường minh. Một cái chặn bằng chờ đợi, một cái chặn bằng phát hiện. Form web mở lâu hợp với cái thứ hai.</p><p><strong>Với bộ đếm bạn để database tự tính:</strong> <code>UPDATE t SET count = count + 1</code>. Với form sửa đơn bạn thêm cột version: đọc <code>version = 3</code>, ghi <code>SET quantity = 5, version = 4 WHERE id = 10 AND version = 3</code>. Affected rows bằng 0 là có người đổi trước, bạn báo tải lại thay vì ghi đè.</p><ul><li>Dùng khi: pessimistic cho hàng nóng tranh chấp cao và transaction ngắn, optimistic cho form mở lâu và API mobile hay mất mạng.</li><li>Không dùng khi: giữ SELECT FOR UPDATE trong lúc chờ user nhập, thêm cột version mà quên kiểm tra affected rows.</li></ul><p><strong>Lỗi hay gặp:</strong> mang giá trị cũ từ client lên ghi đè mà không kèm điều kiện phiên bản. Khi tranh chấp trên cùng dòng tăng từ vài phần trăm lên hàng chục phần trăm thì đáp án đổi: optimistic retry liên tục tốn hơn chờ khóa, bạn chuyển sang pessimistic hoặc gộp ghi thành batch.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L22.</p>",
  "code": "SELECT id, quantity, version FROM orders WHERE id = 10; -- ✅ Đọc dòng kèm version hiện tại\nUPDATE orders SET quantity = 5, version = version + 1\nWHERE id = 10 AND version = 3; -- ✅ Optimistic lock: chỉ ghi khi version chưa đổi; 0 rows = có người đổi trước",
  "expected": "Kết quả: SELECT đọc được dòng id bằng 10 với quantity và version hiện tại, ví dụ version bằng 3; UPDATE chỉ tác động đúng một dòng khi version vẫn là 3 và đặt quantity bằng 5 cùng version bằng 4, còn nếu ai đó đã commit trước làm version thành 4 thì câu UPDATE khớp 0 dòng. Phân tích: đây là optimistic locking, không transaction nào giữ khóa trong lúc người dùng sửa form. Hai transaction cùng đọc version bằng 3 dưới MVCC; transaction A chạy UPDATE trước, PostgreSQL khóa dòng đó, ghi phiên bản mới version bằng 4 và commit. Khi transaction B chạy UPDATE với WHERE id = 10 AND version = 3, điều kiện version không còn khớp phiên bản mới nhất nên câu lệnh khớp 0 dòng, tức không có ghi đè và lost update bị chặn ở tầng dữ liệu. Ứng dụng phải kiểm tra số dòng bị ảnh hưởng: bằng 0 nghĩa là xung đột, cần trả lỗi 409 và cho người dùng tải lại, quên kiểm tra thì xung đột bị nuốt lặng lẽ. Cách còn lại là pessimistic với SELECT ... FOR UPDATE, khóa dòng ngay khi mở sửa và người sau phải chờ, hợp với tranh chấp cao và thao tác ngắn nhưng tuyệt đối không giữ khóa trong lúc chờ người dùng nhập liệu. Lưu ý phép toán nguyên tử như SET quantity = quantity - 1 không cần cả hai cách vì database tính trên giá trị mới nhất dưới khóa dòng ngắn, chỉ khi client gửi giá trị tuyệt đối mới sinh lost update.",
  "followups": [
    {
      "q": "Bạn phát hiện lost update trong code hiện tại bằng dấu hiệu nào?",
      "a": "Bạn tìm mẫu đọc rồi ghi không có kiểm tra version hay khóa, hoặc UPDATE chỉ theo id mà không kèm điều kiện phiên bản. Cơ chế: triệu chứng là khiếu nại dữ liệu bị quay lại giá trị cũ và log cho thấy hai UPDATE cùng id cách nhau vài giây. Thực tế: cách xác nhận là tái hiện hai transaction song song rồi thấy thay đổi đầu biến mất."
    },
    {
      "q": "Khi nào một UPDATE đơn lẻ không cần optimistic hay pessimistic?",
      "a": "Khi phép toán là nguyên tử trên giá trị hiện tại như SET balance bằng balance trừ 100 hay quantity bằng quantity cộng 1, vì database tính trên dòng mới nhất dưới khóa dòng ngắn. Cơ chế: lúc này không có chuyện đọc cũ ghi đè vì không mang giá trị cũ từ client lên. Thực tế: chỉ khi client gửi giá trị tuyệt đối đã đọc từ trước mới cần bảo vệ."
    }
  ],
  "pitfalls": [
    "Giữ SELECT FOR UPDATE trong lúc chờ user nhập form nên kết nối treo và deadlock tăng.",
    "Thêm cột version nhưng quên kiểm tra affected rows nên xung đột vẫn bị nuốt lặng lẽ."
  ],
  "selfcheck": [
    "Tôi vẫn chưa tính được ngưỡng tranh chấp bao nhiêu phần trăm thì nên đổi từ optimistic sang pessimistic.",
    "Tôi giải thích được lost update hai người sửa cùng đơn bằng ví dụ UPDATE kèm version bằng 3.",
    "Tôi có thể thêm optimistic locking cho một API sửa đơn gồm cột version và kiểm tra affected rows."
  ],
  "refs": [
    "pg-transactions",
    "pg-mvcc"
  ]
},
{
  "id": "F11",
  "group": "F",
  "topic": "Batch cập nhật số dư và lost update quy mô lớn",
  "prio": "P1",
  "level": "L3",
  "type": "situation",
  "incident": "<p><strong>Tình huống:</strong> một batch chuyển tiền cho 12.000 người chạy thành công về mặt kỹ thuật. Nhưng 340 bản ghi có số dư âm, điều không được phép xảy ra.</p><p><strong>Cơ chế:</strong> mỗi giao dịch riêng lẻ đều kiểm tra số dư, nhưng việc kiểm tra dùng giá trị đã đọc từ đầu batch.</p><p><strong>Hệ quả:</strong> đến khi batch xử lý tới người thứ 9.000 thì số dư gốc đã lỗi thời nghiêm trọng.</p>",
  "askFirst": [
    "Batch đọc số dư lúc nào và ghi lúc nào? → Giải mã: Đọc một snapshot lúc bắt đầu, ghi hàng nghìn dòng lúc kết thúc; mọi thứ thay đổi giữa chừng đều bị ghi đè (Bài L22).",
    "Vì sao kiểm tra số dư trong ứng dụng không đủ? → Giải mã: Kiểm tra dùng giá trị đọc từ đầu batch, không phải giá trị hiện tại; đủ để đọc, thiếu để chặn ghi sai, phải khoá dòng khi tới lượt (Bài L05).",
    "Có nên khoá toàn bộ batch không? → Giải mã: Không; khoá lớn làm giao dịch trực tuyến chờ lâu, nên theo từng dòng hoặc nhỏ, hoặc đẩy qua hàng đợi tuần tự (Bài L21)."
  ],
  "predict": {
    "q": "Một batch đọc tất cả số dư đầu giờ, xử lý 12.000 giao dịch, rồi mới ghi. Trong giờ đó có 200 giao dịch khác thay đổi số dư. Điều gì xảy ra?",
    "a": "<p><strong>Batch sẽ ghi đè lên 200 thay đổi đó</strong> — đây là lost update ở quy mô lớn. Nó thậm chí không báo lỗi vì mỗi câu lệnh đều hợp lệ.</p><p><strong>Nếu dùng <code>SELECT ... FOR UPDATE</code> ngay từ đầu</strong> thì 12.000 dòng bị khoá suốt giờ và mọi giao dịch khác bị chặn.</p><p><strong>Cách đúng</strong> là đọc và khoá từng dòng ngay trước khi xử lý, hoặc dùng một câu lệnh duy nhất có điều kiện nghiệp vụ bên trong database — như <code>UPDATE accounts SET balance = balance - X WHERE id = ? AND balance >= X</code> — để việc kiểm tra và ghi là nguyên tử trên giá trị hiện tại.</p>"
  },
  "anchor": "Snapshot đầu batch chỉ đúng tại thời điểm đọc; để kiểm tra số dư đúng, điều kiện phải được đánh giá trên giá trị hiện tại ngay lúc ghi.",
  "attacks": [
    {
      "q": "Vì sao khoá toàn bộ batch trước lại là sai lầm?",
      "a": "Vì nó biến một batch thành một transaction khổng lồ. Cơ chế: mọi thay đổi đều chờ commit cuối cùng, nên 200 giao dịch trực tuyến khác bị chặn suốt giờ, dễ hết timeout kết nối và dễ sinh deadlock với các giao dịch ngắn. Thực tế: batch đúng là chia nhỏ — mỗi dòng hoặc mỗi nhóm nhỏ được đọc, khoá, xử lý, commit riêng, để khoá chỉ sống trong mili giây chứ không phải cả giờ."
    },
    {
      "q": "Làm sao để điều kiện nghiệp vụ thành một phần của câu lệnh?",
      "a": "Đặt điều kiện vào mệnh đề WHERE của UPDATE. Cơ chế: câu lệnh chỉ trừ tiền khi số dư hiện tại đủ, và database kiểm tra điều đó trên phiên bản mới nhất của dòng ngay tại thời điểm ghi, nên không thể bị race. Thực tế: ứng dụng đọc số dòng bị ảnh hưởng; bằng 0 nghĩa là thiếu tiền, ghi nhận lỗi riêng cho người đó thay vì ghi đè số dư."
    }
  ],
  "q": "Batch chuyển tiền 12.000 người đọc số dư đầu giờ rồi ghi, vì sao có tài khoản âm và sửa thế nào?",
  "oral": "Bản chất: batch đọc số dư đầu giờ rồi ghi cuối giờ, trong khi 200 giao dịch khác đã đổi số dư giữa chừng, nên các bản ghi bị ghi đè thành âm — đây là lost update ở quy mô lớn. Cơ chế: đừng giữ snapshot đầu giờ. Mỗi dòng được đọc, khoá, xử lý, commit riêng hoặc theo nhóm nhỏ, để khoá chỉ sống trong mili giây. Hoặc đặt luôn điều kiện nghiệp vụ vào WHERE của UPDATE để database tự kiểm tra trên giá trị hiện tại. Thực tế: batch đúng là nhiều transaction nhỏ, không phải một transaction khổng lồ khoá 12.000 dòng suốt một giờ.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Lost update quy mô lớn</strong>: một batch ghi đè hàng nghìn dòng đọc từ một hình chụp cũ, mỗi dòng nuốt thay đổi của hệ thống trực tuyến chạy xen giữa chừng.</li><li><strong>Transaction riêng theo dòng</strong>: đọc, khoá, xử lý, cam kết từng dòng một hoặc nhóm nhỏ, làm khoá chỉ sống trong khoảnh khắc; giống tính toán lại số dư khi đến lượt mình thay khi có mặt, không giữ số cũ cả buổi.</li><li><strong>Hàng đợi tuần tự</strong>: đưa việc ghi số dư vào hàng đợi xử lý theo thứ tự, tách tải trực tuyến khỏi tải batch; giống hợp nhất mọi bút toán qua một cửa sổ kế toán.</li></ul><p><strong>Tình huống:</strong> batch chuyển tiền 12.000 người chạy \"thành công\" nhưng 340 bản ghi có số dư âm. Mỗi giao dịch đều kiểm tra, nhưng bằng giá trị đọc từ đầu batch. Đến dòng thứ 9.000, số dư gốc đã lỗi thời nghiêm trọng.</p><p><strong>Cơ chế:</strong> snapshot đầu giờ không còn đúng giữa chừng. 200 giao dịch trực tuyến thay đổi số dư trong lúc batch chạy. Batch ghi đè lên tất cả mà không báo lỗi.</p><p><strong>Khoá cả batch trước là sai lầm:</strong> 12.000 dòng bị khoá suốt giờ, giao dịch trực tuyến bị chặn, timeout kết nối tăng và deadlock tăng theo. Đường đúng nằm giữa hai cực: nhiều transaction nhỏ.</p><p><strong>Cách đúng:</strong> chia batch thành từng nhóm nhỏ, mỗi nhóm đọc, khoá, xử lý rồi commit. Hoặc đặt điều kiện vào <code>WHERE ... AND balance >= X</code> để database tự từ chối khi không đủ tiền, rồi ứng dụng đọc affected rows. Xử lý lỗi riêng cho từng người, không rollback cả batch.</p><ul><li>Dùng khi: batch theo nhóm nhỏ commit liên tục, UPDATE có điều kiện nghiệp vụ, retry riêng nhóm lỗi.</li><li>Không dùng khi: đọc toàn bộ đầu giờ rồi ghi cuối giờ, FOR UPDATE toàn bảng trước khi xử lý, giữ một transaction cho cả batch.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng batch phải nằm trong một transaction để \"an toàn\". Khi tải trực tuyến tăng cao thì đáp án đổi: bạn chuyển batch sang hàng đợi và xử lý từng tin nhắn với khoá dòng riêng, để giao dịch trực tuyến luôn được ưu tiên.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L21, Bài L22.</p>",
  "code": "UPDATE accounts\nSET balance = balance - 250000\nWHERE id = 88 AND balance >= 250000; -- ✅ Điều kiện nghiệp vụ nằm trong SQL; 0 rows = thiếu tiền, không ghi đè",
  "expected": "Kết quả: câu UPDATE chỉ trừ 250.000 khỏi tài khoản id bằng 88 khi số dư hiện tại vẫn đủ, nếu không đủ thì khớp 0 dòng và không thay đổi gì. Phân tích: điều kiện balance >= 250000 được đánh giá trên phiên bản mới nhất của dòng dưới khóa ghi ngắn, nên kể cả có 200 giao dịch khác chen vào thì số dư không bao giờ xuống âm qua đường này. Ứng dụng phải đọc số dòng bị ảnh hưởng: bằng 1 là thành công, bằng 0 là thiếu tiền và cần ghi nhận lỗi riêng cho người đó thay vì ghi đè. Khác với mẫu đọc đầu batch rồi ghi cuối batch, mẫu này không có snapshot cũ nào để ghi đè lên.",
  "followups": [
    {
      "q": "Batch lớn nên commit theo nhóm hay từng dòng?",
      "a": "Nhóm nhỏ vài trăm dòng là điểm cân bằng thường gặp, để khoá ngắn và phần lỗi không kéo theo cả batch. Cơ chế: commit liên tục giải phóng snapshot để VACUUM dọn dead tuple, còn một transaction khổng lồ tích tụ dead tuple và gây bloat. Thực tế: nhóm theo khoảng id để khi lỗi chỉ retry đúng đoạn đó."
    },
    {
      "q": "Vì sao batch chạy chậm lại càng nguy hiểm cho nghiệp vụ?",
      "a": "Vì snapshot của nó càng cũ so với dữ liệu thật nên xác suất ghi đè thay đổi của người khác càng cao. Cơ chế: batch chậm thường do thiếu index trên điều kiện lọc, hoặc do logic nặng chạy trong ứng dụng giữa các lần đọc ghi. Thực tế: đo thời gian từng nhóm và giữ mỗi transaction dưới vài giây, không phải vài phút."
    }
  ],
  "pitfalls": [
    "Đọc toàn bộ số dư đầu batch rồi ghi cuối batch, ghi đè mọi thay đổi giữa chừng mà không báo lỗi.",
    "Khoá 12.000 dòng bằng FOR UPDATE trước khi xử lý làm nghẽn giao dịch trực tuyến và tăng deadlock."
  ],
  "selfcheck": [
    "Tôi vẫn chưa ước lượng được kích thước nhóm tối ưu cho một batch cụ thể mà không đo thực tế.",
    "Tôi giải thích được vì sao kiểm tra số dư ở ứng dụng bằng snapshot đầu batch bị ghi đè bằng ví dụ 200 giao dịch chen vào.",
    "Tôi có thể viết UPDATE có điều kiện nghiệp vụ trong WHERE và xử lý affected rows bằng 0."
  ],
  "refs": [
    "pg-transactions",
    "pg-mvcc"
  ]
},
{
  "id": "F12",
  "group": "F",
  "topic": "Phân trang offset so với keyset và xử lý N cộng 1",
  "prio": "P2",
  "level": "L3",
  "type": "debug",
  "incident": "<p><strong>Tình huống:</strong> trang 400 của endpoint danh sách mất 8 giây cho đúng 20 dòng. Truy vấn cũ dùng <code>OFFSET 40000 LIMIT 20</code>.</p><p><strong>Thêm vấn đề thứ hai:</strong> mỗi dòng cần tên tác giả, nên code gọi thêm một truy vấn cho từng dòng. Một trang 20 dòng sinh ra 20 truy vấn phụ.</p><p><strong>Hệ quả:</strong> độ trễ vừa tăng theo độ sâu trang, vừa nhân thêm theo số dòng hiển thị.</p>",
  "askFirst": [
    "Vì sao OFFSET lớn lại chậm? → Giải mã: Database phải đếm qua mọi dòng bị bỏ rồi mới trả 20 dòng cuối; chi phí tăng tuyến tính theo độ sâu trang (Bài L21).",
    "Keyset phân trang khác gì về mặt truy vấn? → Giải mã: Lấy giá trị mốc của dòng cuối, lọc bằng so với mốc kèm ORDER BY và LIMIT; chi phí không đổi theo độ sâu (Bài L21).",
    "Làm sao lấy dữ liệu liên quan mà không sinh N cộng 1? → Giải mã: Tránh vòng lặp truy vấn theo từng dòng, dùng JOIN hoặc gom nhiều khóa vào một truy vấn (Bài L22)."
  ],
  "predict": {
    "q": "<code>SELECT ... ORDER BY created_at DESC OFFSET 40000 LIMIT 20</code> phải làm gì trước khi trả về 20 dòng?",
    "a": "<p><strong>Nó phải sinh ra rồi bỏ đi 40.000 dòng đầu tiên.</strong> Database không nhảy thẳng tới dòng thứ 40.001 trong kết quả đã sắp xếp, nên nó đọc và đếm qua toàn bộ phần bị bỏ.</p><p><strong>Chi phí tăng theo độ sâu trang,</strong> không theo số dòng trả về. Đó là lý do trang 400 chậm hơn trang 1 hàng trăm lần dù cùng trả 20 dòng.</p><p><strong>Keyset tránh được điều này</strong> bằng cách lọc theo giá trị của dòng cuối trang trước, nên database nhảy thẳng tới đúng vị trí trong chỉ mục.</p>"
  },
  "anchor": "OFFSET trả giá theo độ sâu trang vì phải đếm qua mọi dòng bị bỏ, còn keyset trả giá theo số dòng lấy ra vì nó lọc bằng giá trị thay vì đếm bằng vị trí.",
  "attacks": [
    {
      "q": "Keyset phân trang có nhược điểm gì?",
      "a": "<p><strong>Không nhảy được tới trang bất kỳ.</strong> Bạn chỉ đi tuần tự tiến hoặc lùi, nên giao diện kiểu tới trang 47 không làm được.</p><p><strong>Khóa sắp xếp phải duy nhất và ổn định.</strong> Nếu sắp theo cột có nhiều giá trị trùng mà không có cột phụ như id, trang sau sẽ lặp hoặc sót dòng.</p><p><strong>Bộ lọc phải giữ nguyên giữa các lần lật trang,</strong> vì keyset dựa vào giá trị của dòng cuối chứ không dựa vào vị trí cố định.</p>"
    },
    {
      "q": "Làm sao lấy dữ liệu liên quan cho cả trang mà không sinh N cộng 1?",
      "a": "<p><strong>Cách 1: JOIN ở tầng database</strong> để lấy tên tác giả trong cùng một truy vấn.</p><p><strong>Cách 2: một truy vấn batch</strong> lấy tất cả tác giả theo danh sách user_id của trang, dùng <code>WHERE id IN (...)</code> rồi ghép lại ở code. Cách này thường gọn hơn khi quan hệ phức tạp.</p><p><strong>Thực tế:</strong> bật log truy vấn và đếm số query mỗi request. Nếu thấy số query tăng theo số dòng trả về thì bạn đang dính N cộng 1.</p>"
    }
  ],
  "q": "Danh sách đơn hàng dùng OFFSET càng về trang sau càng chậm và hay trùng hoặc thiếu khi có đơn mới, bạn sửa thành keyset thế nào và xử lý N cộng 1 ra sao?",
  "oral": "Bản chất: OFFSET bắt database đọc rồi bỏ qua hàng nghìn dòng đầu mỗi lần, nên trang càng sau càng chậm. Cơ chế: khi có đơn mới chen vào, một dòng có thể hiện ở hai trang hoặc biến mất. Keyset lấy mốc created_at và id của dòng cuối trang trước rồi dùng WHERE nhỏ hơn mốc, kèm ORDER BY và LIMIT tương ứng, nên mỗi trang chỉ đọc đúng số dòng cần và tốc độ ổn định. Thực tế: N cộng 1 là vòng lặp gọi một query cho mỗi đơn để lấy tên khách, bạn sửa bằng một JOIN hoặc một query batch theo danh sách id.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Offset pagination</strong>: đếm qua và bỏ từng dòng, chi phí tăng theo độ sâu trang; như lần trang sách, trang sau phải đọc lại các trang trước.</li><li><strong>Keyset pagination</strong>: lấy giá trị mốc của dòng cuối và lọc theo mốc, cơ chế ổn định khi có dòng mới xen giữa; như nhớ đọc tới trang nào rồi mở tiếp từ đó.</li><li><strong>N cộng 1</strong>: chạy một truy vấn chính rồi thêm N truy vấn con theo từng dòng; sửa bằng JOIN hoặc ghép nhiều khóa vào một câu, tránh vòng lặp hỏi database.</li></ul><p><strong>Tình huống:</strong> trang 400 mất tám giây cho đúng 20 dòng. Truy vấn OFFSET 40000 đọc rồi vứt 40.000 dòng đầu mỗi lần. Thêm đơn mới xen vào thì cùng một dòng hiện ở hai trang, hoặc biến mất khỏi cả hai.</p><p><strong>Cơ chế OFFSET:</strong> database đếm qua mọi dòng bị bỏ, nên chi phí tăng theo độ sâu trang. <strong>Cơ chế keyset:</strong> lọc theo giá trị mốc của dòng cuối, database nhảy thẳng tới vị trí trong index. Chi phí mỗi trang gần như hằng số.</p><p><strong>Hai cách trả giá khác nhau:</strong> OFFSET trả theo số dòng bị bỏ, còn keyset trả theo số dòng lấy ra. Một cái đắt dần theo trang, một cái ổn định mọi trang. Feed vô hạn hợp với cái thứ hai.</p><p><strong>Cách sửa:</strong> dùng mốc kép để chống trùng, <code>WHERE (created_at, id) &lt; (mốc, id_mốc) ORDER BY created_at DESC, id DESC LIMIT 20</code>, với index composite đúng thứ tự đó. Phần N cộng 1 thì gộp thành một JOIN hoặc một truy vấn WHERE IN theo danh sách user_id.</p><ul><li>Dùng khi: feed hoặc danh sách rất dài, dữ liệu thêm liên tục, chỉ cần lật tuần tự.</li><li>Không dùng khi: giao diện cần nhảy tới trang bất kỳ, danh sách nhỏ mà OFFSET vẫn nhanh.</li></ul><p><strong>Lỗi hay gặp:</strong> tưởng thiếu index nên thêm index mà không đổi cách phân trang. Khi người dùng cần nhảy trang thì đáp án đổi: bạn giữ OFFSET cho trang đầu và đếm gần đúng cho phần sâu, thay vì ép keyset.</p><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L21, Bài L22.</p>",
  "code": "SELECT id, created_at, amount FROM orders\nWHERE (created_at, id) < ('2026-09-20 10:00:00+00', 5000) -- ✅ Mốc kép: created_at kèm id để không trùng\nORDER BY created_at DESC, id DESC -- ✅ Thứ tự toàn phần, khớp với index composite\nLIMIT 20;",
  "expected": "Trang OFFSET sâu chậm vì database phải đọc và bỏ qua mọi dòng trước đó, đồng thời dòng mới chen vào làm trang bị trùng hoặc thiếu. Câu keyset trên đúng vì dùng mốc created_at kèm id trên index có thứ tự nên chỉ đọc 20 dòng tiếp theo, ổn định trước ghi mới và dùng được Index Scan. N cộng 1 trong màn hình này phải gộp thành một JOIN hoặc một query batch theo danh sách user_id. Hành vi đúng cho mọi phiên bản PostgreSQL hiện hành vì đây là hệ quả của LIMIT OFFSET và sắp xếp ổn định.",
  "followups": [
    {
      "q": "Vì sao keyset cần cột tie-breaker như id bên cạnh created_at?",
      "a": "Nhiều dòng có thể cùng created_at, nên chỉ so ngày không đủ để xác định vị trí dừng và trang sau có thể lặp hoặc sót dòng. Cơ chế: cặp created_at và id tạo thứ tự toàn phần ổn định, điều kiện so sánh tuple hoạt động đúng với ORDER BY tương ứng. Thực tế: index composite theo đúng thứ tự đó giúp truy vấn dùng Index Scan hiệu quả."
    },
    {
      "q": "Bạn phát hiện và sửa N cộng 1 trong API danh sách ra sao?",
      "a": "Bạn bật log truy vấn và thấy 1 cộng N query giống nhau chỉ khác id. Cơ chế: cách sửa là JOIN bảng liên quan trong một query, hoặc gom id rồi SELECT một lần với WHERE IN và map lại ở code. Thực tế: với ORM hãy dùng eager loading cho quan hệ hiển thị ở danh sách, và kiểm tra lại số query sau khi sửa."
    }
  ],
  "pitfalls": [
    "Dùng OFFSET cho feed lớn rồi trang sau chậm dần mà tưởng là thiếu index.",
    "Query tên khách trong vòng lặp mỗi đơn nên API trả 50 đơn thành 51 query mà không hay."
  ],
  "selfcheck": [
    "Tôi vẫn chưa thiết kế được keyset cho sort động nhiều cột kèm lọc phức tạp mà vẫn dùng index tốt.",
    "Tôi giải thích được vì sao OFFSET trang 1000 chậm và trùng thiếu bằng ví dụ danh sách orders có đơn mới chen vào.",
    "Tôi có thể chuyển một API danh sách sang keyset theo created_at và id rồi gộp query N cộng 1 thành một JOIN."
  ],
  "refs": [
    "pg-limit",
    "pg-explain",
    "pg-indexes"
  ]
}
);
