var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
  "id": "G25",
  "group": "G",
  "topic": "Amazon S3: storage class, lifecycle và versioning khi hóa đơn tăng",
  "prio": "P1",
  "level": "L2",
  "type": "situation",
  "attacks": [
    {
      "q": "Bật versioning thì ảnh cũ có bị xóa không, sao lại tốn tiền?",
      "a": "Không bị xóa. Versioning giữ mọi phiên bản cũ. Mỗi phiên bản là một object đầy đủ chứ không phải phần khác biệt, nên bạn bị tính tiền cho từng bản. Nếu ảnh bị ghi đè liên tục thì số phiên bản cũ tăng theo số lần ghi đè, dù số ảnh hiện tại không đổi."
    },
    {
      "q": "Đã xóa ảnh rồi mà sao vẫn tốn tiền? Xóa rồi thì còn gì nữa?",
      "a": "Với bucket bật versioning, lệnh xóa thông thường không xóa dữ liệu thật. S3 thêm một delete marker làm phiên bản hiện tại, còn phiên bản thật vẫn nằm đó và vẫn được tính tiền. Delete marker vẫn tốn một lượng nhỏ, bằng độ dài tên key. Muốn giải phóng dung lượng thì phải xóa các phiên bản không hiện tại, bằng lifecycle rule hoặc xóa theo versionId."
    }
  ],
  "incident": "<p>Tình huống giả định: Đội bật versioning cho bucket lưu ảnh sản phẩm mà web Vue hiển thị. Một job đồng bộ chạy mỗi đêm và ghi đè file ảnh đã thu nhỏ mỗi khi ảnh gốc có thay đổi nhỏ. Số ảnh gốc không đổi, không ai upload thêm. Sáu tháng sau hóa đơn S3 gấp ba. Khi vào console, đội thấy mỗi ảnh có hàng chục phiên bản, không có lifecycle rule nào, và một số lần tải file lớn bị bỏ dở vẫn nằm trong bucket.</p>",
  "askFirst": [
    "Hóa đơn tăng do dung lượng lưu trữ (storage), do số request, hay do loại phí khác? Bạn xác định bằng dữ liệu nào trước khi sửa cấu hình? → Giải mã: Xác định theo từng mục trong báo cáo chi phí; versioning tăng storage, lifecycle tăng delete, transfer tăng request; đọc báo cáo trước khi đổi (Bài L05, Bài L20).",
    "Vì sao bật versioning không làm ảnh cũ biến mất, và ai chịu trách nhiệm dọn các phiên bản đó? → Giải mã: Xóa chỉ thêm dấu xóa, phiên bản cũ vẫn tính tiền; phải có lifecycle hết hạn phiên bản không hiện hành (Bài L05)."
  ],
  "predict": {
    "q": "Bạn đoán: bucket ảnh đã bật versioning và có một lifecycle rule Expiration 30 ngày trên prefix images/. Sau 30 ngày, ảnh cũ có biến mất khỏi bucket và hóa đơn có giảm không?",
    "a": "<p>Không. Với bucket bật versioning, Expiration chỉ thêm delete marker làm phiên bản hiện tại, còn các phiên bản thật vẫn nằm đó và vẫn được tính tiền. Hóa đơn không giảm cho đến khi có NoncurrentVersionExpiration xóa các phiên bản cũ.</p>"
  },
  "anchor": "Trong bucket có versioning, Expiration chỉ xử lý phiên bản hiện tại; phiên bản cũ được dọn bằng NoncurrentVersionExpiration hoặc xóa thủ công theo versionId.",
  "q": "Bucket ảnh bật versioning sáu tháng trước, số ảnh không đổi nhưng hóa đơn S3 tăng gấp ba. Bạn kiểm tra và xử lý thế nào, và cấu hình storage class, lifecycle rule, versioning nên đặt ra sao?",
  "oral": "Nguyên nhân nằm ở versioning. Số ảnh không đổi nhưng hóa đơn tăng gấp ba là vì mỗi lần job ghi đè file ảnh tạo ra một phiên bản mới, và mỗi phiên bản là một object đầy đủ bị tính tiền riêng. Xóa thường cũng không giải phóng dung lượng, vì S3 chỉ thêm delete marker mà phiên bản thật vẫn nằm đó. Tôi dùng S3 Storage Lens để đếm phiên bản không hiện tại, và S3 Inventory để xác nhận số lượng. Sửa thì thêm lifecycle rule: NoncurrentVersionExpiration xóa phiên bản cũ sau 30 ngày, ExpiredObjectDeleteMarker dọn delete marker, AbortIncompleteMultipartUpload hủy upload dở vì phần đã tải vẫn bị tính tiền.",
  "deep": "<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>S3</strong>: dịch vụ lưu object của AWS, tổ chức trong bucket. Giống một kho có nhiều ngăn, mỗi ngăn chứa một file.</li><li><strong>Storage class</strong>: các lớp lưu trữ khác nhau cho cùng một object, khác về giá lưu và thời gian lưu tối thiểu. Ví dụ: kệ nóng cạnh quầy (Standard) và kho lạnh phía sau (Glacier), kho lạnh rẻ hơn nhưng lấy hàng chậm hơn và có phí.</li><li><strong>Versioning</strong>: mỗi lần ghi đè một object tạo phiên bản mới có version ID, phiên bản cũ vẫn còn. Giống Git nhưng mỗi commit lưu cả file, không lưu phần khác biệt.</li><li><strong>Delete marker</strong>: đối tượng không có dữ liệu được thêm khi xóa thường. Object trông như đã xóa nhưng phiên bản thật vẫn nằm trong bucket.</li><li><strong>Noncurrent version</strong>: phiên bản đã bị ghi đè hoặc đã bị một delete marker đặt lên trên.</li><li><strong>Lifecycle rule</strong>: cấu hình để S3 tự chuyển lớp hoặc xóa object theo số ngày. Giống một cron job dọn thư mục tạm theo tuổi file.</li><li><strong>Multipart upload</strong>: chia file lớn thành nhiều phần tải song song. Nếu không hoàn tất hoặc không hủy, các phần vẫn nằm trong bucket và bị tính tiền.</li></ul><p><strong>Cơ chế cốt lõi</strong></p><ul><li>Bucket bật versioning: mỗi lần ghi đè tạo phiên bản mới, phiên bản cũ trở thành noncurrent. Mỗi phiên bản là toàn bộ object, không phải phần khác biệt, nên ba phiên bản thì bạn trả tiền cho ba object.</li><li>Lệnh xóa thường không xóa dữ liệu mà chỉ thêm delete marker. Delete marker chiếm một lượng nhỏ bằng độ dài tên key. Muốn xóa thật phải xóa theo version ID.</li><li>Expiration trong lifecycle với bucket có versioning chỉ tác động phiên bản hiện tại: nó thêm delete marker và để phiên bản cũ nguyên vẹn.</li><li>NoncurrentVersionExpiration xóa vĩnh viễn phiên bản cũ theo NoncurrentDays và NewerNoncurrentVersions. Số ngày được tính từ lúc phiên bản kế tiếp được tạo, làm tròn lên nửa đêm UTC. Xóa chỉ xảy ra khi cả hai điều kiện đều vượt ngưỡng.</li><li>Mỗi object chỉ chịu một hành động lifecycle mỗi ngày. Khi nhiều rule cùng khớp, xóa vĩnh viễn ưu tiên hơn chuyển lớp.</li></ul><p><strong>Số liệu storage class đã đọc trong tài liệu S3</strong></p><table><thead><tr><th>Lớp</th><th>Thời gian lưu tối thiểu</th><th>Kích thước tính tiền tối thiểu</th><th>Ghi chú</th></tr></thead><tbody><tr><td>Standard</td><td>Không có</td><td>Không có</td><td>Mặc định khi không chỉ định</td></tr><tr><td>Standard-IA</td><td>30 ngày</td><td>128 KB</td><td>Có phí truy xuất theo GB</td></tr><tr><td>Intelligent-Tiering</td><td>Không có</td><td>Không có</td><td>Không có phí truy xuất, có phí giám sát theo object</td></tr><tr><td>Glacier Instant Retrieval</td><td>90 ngày</td><td>128 KB</td><td>Có phí truy xuất theo GB, đọc được ngay</td></tr><tr><td>Glacier Flexible Retrieval</td><td>90 ngày</td><td>Không áp dụng; mỗi object thêm 40 KB metadata</td><td>Phải restore trước khi đọc, mất vài phút đến vài giờ</td></tr><tr><td>Glacier Deep Archive</td><td>180 ngày</td><td>Không áp dụng; mỗi object thêm 40 KB metadata</td><td>Phải restore trước khi đọc, thường trong vòng 12 giờ đến 48 giờ</td></tr></tbody></table><p>Intelligent-Tiering tự chuyển object sang Infrequent Access sau 30 ngày không truy cập và sang Archive Instant Access sau 90 ngày không truy cập.</p><p><strong>Multipart upload và AbortIncompleteMultipartUpload</strong></p><ul><li>Phần đã tải của upload dở vẫn tính tiền cho đến khi bạn hoàn tất hoặc hủy upload.</li><li>AbortIncompleteMultipartUpload với DaysAfterInitiation hủy upload chưa hoàn tất sau số ngày đã đặt.</li><li>Action này không dùng được trong rule có filter theo tag.</li></ul><p><strong>Chẩn đoán tình huống hóa đơn gấp ba</strong></p><ul><li>Kiểm tra số phiên bản không hiện tại và delete marker bằng S3 Storage Lens.</li><li>Dùng S3 Inventory để xác nhận có bao nhiêu phiên bản và object đang nằm ở lớp nào.</li><li>Kiểm tra upload dở bằng danh sách multipart upload đang tiến hành.</li></ul><p><strong>Sai lầm thường gặp</strong></p><ul><li>Nghĩ xóa object trong bucket có versioning là giải phóng dung lượng. Thực tế phiên bản cũ và delete marker vẫn được tính tiền.</li><li>Đặt Expiration rồi tưởng đã hết chi phí. Trong bucket có versioning, Expiration chỉ thêm delete marker; phải có NoncurrentVersionExpiration.</li><li>Chuyển object nhỏ sang Standard-IA hoặc Glacier Instant Retrieval vì tưởng tiết kiệm: hai lớp này tính tối thiểu 128 KB cho mỗi object.</li></ul><p><strong>Bài học nền tảng liên quan:</strong> Xem cơ chế thực tế tại Bài L05, Bài L20.</p>",
  "code": "{\n  \"Rules\": [\n    {\n      \"ID\": \"expire-noncurrent-images\",\n      \"Status\": \"Enabled\",\n      \"Filter\": { \"Prefix\": \"images/\" },\n      \"NoncurrentVersionExpiration\": {\n        \"NoncurrentDays\": 30,\n        \"NewerNoncurrentVersions\": 3\n      }\n    },\n    {\n      \"ID\": \"clean-expired-delete-markers\",\n      \"Status\": \"Enabled\",\n      \"Filter\": { \"Prefix\": \"images/\" },\n      \"Expiration\": { \"ExpiredObjectDeleteMarker\": true }\n    },\n    {\n      \"ID\": \"abort-stale-multipart-uploads\",\n      \"Status\": \"Enabled\",\n      \"Filter\": { \"Prefix\": \"\" },\n      \"AbortIncompleteMultipartUpload\": { \"DaysAfterInitiation\": 7 }\n    }\n  ]\n}",
  "expected": null,
  "followups": [
    {
      "q": "Chuyển phiên bản cũ sang Glacier Instant Retrieval có tiết kiệm không, và điều gì làm phát sinh thêm phí?",
      "a": "Lớp này được thiết kế cho dữ liệu ít đọc nhưng vẫn cần đọc ngay. Bạn phải tính ba thứ: thời gian lưu tối thiểu 90 ngày, kích thước tính tiền tối thiểu 128 KB cho mỗi object, và phí truy xuất theo GB mỗi lần đọc. Nếu xóa hoặc chuyển đi trước 90 ngày, bạn vẫn bị tính đủ phần còn thiếu. Ảnh resize bị đọc hằng ngày thì phí truy xuất có thể vượt phần lưu trữ tiết kiệm được. Chuyển object bằng lifecycle cũng có phí request, nên chỉ nên làm khi lượng object lớn và dữ liệu thật sự nằm yên."
    },
    {
      "q": "Bucket đã có lifecycle Expiration 30 ngày rồi mới bật versioning. Vì sao bạn phải thêm NoncurrentVersionExpiration?",
      "a": "Vì trong bucket có versioning, Expiration chỉ áp dụng cho phiên bản hiện tại và thay bằng delete marker, còn phiên bản cũ không bị đụng tới. Tài liệu S3 khuyến cáo rõ: nếu muốn giữ hành vi xóa vĩnh viễn như trước khi bật versioning, bạn phải thêm cấu hình noncurrent expiration. Nếu không thêm, số phiên bản cũ tăng mãi và tiền cũng tăng theo. NoncurrentDays được tính từ lúc phiên bản trở thành cũ, còn NewerNoncurrentVersions là số phiên bản mới hơn phải tồn tại trước khi phiên bản này bị xóa. Khi đặt NewerNoncurrentVersions thì rule phải có Filter, và xóa chỉ xảy ra khi cả hai điều kiện đều vượt ngưỡng."
    }
  ],
  "pitfalls": [
    "Nghĩ xóa object trong bucket có versioning là giải phóng dung lượng; thực tế phiên bản cũ và delete marker vẫn được tính tiền",
    "Đặt Expiration rồi tưởng hết chi phí; trong bucket có versioning, Expiration chỉ thêm delete marker, phiên bản cũ phải được xử lý bằng NoncurrentVersionExpiration",
    "Chuyển object nhỏ sang Standard-IA để tiết kiệm; lớp này tính tối thiểu 128 KB cho mỗi object và có thời gian lưu tối thiểu 30 ngày. Glacier Flexible Retrieval hay Deep Archive thì mỗi object thêm 40 KB metadata tính tiền",
    "Quên AbortIncompleteMultipartUpload; phần đã tải của upload dở vẫn bị tính tiền cho đến khi hoàn tất hoặc hủy"
  ],
  "selfcheck": [
    "Tôi vẫn chưa tính được cụ thể bucket ảnh đang chiếm bao nhiêu dung lượng cho phiên bản cũ, vì chưa đếm được số phiên bản không hiện tại và chưa biết chúng nằm ở lớp nào",
    "Tôi có thể giải thích bằng ví dụ: xóa một ảnh trong bucket có versioning chỉ thêm delete marker, còn phiên bản thật vẫn được tính tiền cho đến khi NoncurrentVersionExpiration xóa nó",
    "Tôi có thể viết lifecycle rule JSON gồm NoncurrentVersionExpiration có Filter, ExpiredObjectDeleteMarker và AbortIncompleteMultipartUpload cho bucket ảnh, và nói rõ hai action sau không dùng được trong rule có filter theo tag"
  ],
  "refs": [
    "aws-s3-storage-classes",
    "aws-s3-lifecycle",
    "aws-s3-versioning",
    "aws-cost",
    "aws-s3-lifecycle-rules",
    "aws-s3-glacier-classes",
    "aws-s3-mpu-abort",
    "aws-s3-delete-marker",
    "aws-s3-storage-lens"
  ],
  "tradeoff": "<p>Giữ versioning trên ảnh gốc cho phép khôi phục khi xóa nhầm hoặc ghi đè nhầm, đổi lại mỗi phiên bản cũ là một khoản chi phí lưu trữ. NoncurrentDays dài thì an toàn hơn nhưng tốn tiền hơn; ngắn thì tiết kiệm nhưng khó sửa lỗi kịp thời. Không bật versioning thì đơn giản và rẻ hơn, nhưng ghi đè hoặc xóa là mất hẳn dữ liệu.</p>",
  "alternatives": "<ul><li>Bucket riêng không bật versioning cho ảnh resize, vì dữ liệu này tái tạo được từ ảnh gốc; chỉ bật versioning cho ảnh gốc.</li><li>Dùng prefix khác nhau trong cùng bucket và cùng lifecycle rule, khi không muốn quản lý nhiều bucket.</li><li>Intelligent-Tiering khi không đoán được mẫu truy cập: không có phí truy xuất, nhưng có phí giám sát theo object.</li></ul>",
  "observe": "<p>Theo dõi số phiên bản không hiện tại và số delete marker bằng S3 Storage Lens, dung lượng theo lớp lưu trữ, và kết quả lifecycle bằng S3 Inventory. Tài liệu S3 khuyến nghị kiểm tra bằng LIST API hoặc S3 Inventory trước khi cập nhật, tắt hay xóa lifecycle rule, để xác nhận rule đã chuyển hoặc xóa đúng object.</p>",
  "say30": "Hóa đơn tăng do versioning. Mỗi lần job ghi đè ảnh tạo phiên bản mới, và mỗi phiên bản là một object đầy đủ bị tính tiền. Tôi đo bằng S3 Storage Lens và S3 Inventory, rồi thêm lifecycle rule: NoncurrentVersionExpiration xóa bản cũ, ExpiredObjectDeleteMarker dọn delete marker, AbortIncompleteMultipartUpload hủy upload dở.",
  "say90": "[Nhịp 1 — Chốt bản chất & Nỗi đau (20s)]: Đầu tiên tôi xác định hóa đơn tăng do đâu bằng S3 Storage Lens và S3 Inventory, vì số ảnh không đổi nên tôi nghi ngờ phiên bản cũ.\n\n[Nhịp 2 — Cơ chế bên dưới & Giải pháp chuẩn (45s)]: Versioning giữ mỗi phiên bản là một object đầy đủ, và xóa thường chỉ thêm delete marker, nên dung lượng không được giải phóng. Tôi sửa bằng lifecycle rule: NoncurrentVersionExpiration với NoncurrentDays và NewerNoncurrentVersions cùng Filter, ExpiredObjectDeleteMarker để dọn delete marker không còn phiên bản, và AbortIncompleteMultipartUpload để hủy upload nhiều phần bị bỏ dở.\n\n[Nhịp 3 — Đánh đổi thực tế & Chỉ số giám sát (25s)]: Ảnh resize là dữ liệu tái tạo được nên tôi tách sang bucket riêng không versioning. Chuyển sang Standard-IA hay Glacier Flexible Retrieval hoặc Deep Archive là bước sau, chỉ khi dữ liệu ít được đọc, vì các lớp này đều có thời gian lưu tối thiểu và phí truy xuất."
}
);
