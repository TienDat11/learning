# L22: Deploy — vì sao index.html cũ trỏ vào tệp JS đã xoá, và rollback đúng phải là gì

> **Trạng thái:** bản viết lại theo phong cách "vấn đề trước, cơ chế sau". Output ở mục 4 là output thật của script trong `l22/`.
> **Số liệu:** mọi con số là giả định của kịch bản, ghi rõ "giả sử" ở chỗ dùng.

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 4 vào thẳng bảy bước cơ chế, trong đó bước 1 nói "tên có hash là một lời hứa" mà chưa giải thích hash được tính từ đâu và vì sao nó khiến tệp bất biến.
- **Thuật ngữ chưa giải thích:** `cache invalidation`, `blue-green / rolling deploy`, `OAC`, `Block Public Access`, `Minimum TTL`, `ETag`, `immutable`, `artifact` xuất hiện lần đầu không kèm ngoặc tiếng Việt.
- **Thiếu ví von / ví dụ trực diện:** quan hệ giữa `index.html` cũ và tệp JS bị xoá chỉ có một sơ đồ mermaid; không có sơ đồ chữ cho thấy hai loại tệp có hai chính sách cache.
- **Câu quá dài / khô:** "Sau khi xoá, tên `app.8083771c.js` vẫn được nhắc tới trong những bản `index.html` đang nằm trong máy người dùng, nhưng tên đó không còn trỏ tới gì" — câu ghép dài, hai mệnh đề đối lập.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Giả sử 22 giờ đội bạn deploy bản 2.0. Bản build gồm một `index.html` và vài tệp JS, CSS có hash trong tên.

Bucket đặt đúng một chính sách cache 24 giờ cho mọi tệp. 22 giờ 04, pipeline chạy `aws s3 sync dist/ s3://... --delete`, và tệp JS của bản 1.9 bị xoá ngay.

Một người đã mở trang lúc 21 giờ, để tab đó, rồi 22 giờ 10 mở lại.

Câu hỏi dự đoán: trình duyệt của người đó lấy `index.html` từ đâu? Đáp án: từ bộ nhớ đệm của chính nó, vì tệp bị gắn `max-age=86400` như mọi tệp khác.

Nó đọc hai đường dẫn trong bản cũ, xin hai tệp đã bị xoá, nhận `404`, và thấy trang trắng. Sáng hôm sau khoảng 8% người dùng báo lỗi.

### 2. Phép ví von đời thường & Sơ đồ chữ

`index.html` giống tấm bản đồ giấy phát ở cửa công viên: nó ghi tên các con đường. Tệp JS có hash giống con đường đã đặt tên cố định — sửa đường thì đặt tên mới, không đổi tên cũ.

Giới hạn của phép ví von: bản đồ giấy không tự cập nhật, còn `index.html` cập nhật được — nhưng chỉ khi trình duyệt chịu hỏi lại.

```text
index.html (không hash, phải no-cache)
        │  trỏ tới
        ▼
assets/app.8083771c.js (có hash, cache 1 năm)
        │
        ▼
   ┌──────────┐   có trong cache   ┌─────┐
   │CloudFront│───────────────────►│ 200 │
   └──────────┘                    └─────┘
        │ không có, hỏi bucket
        ▼
   S3: tệp đã bị --delete xoá ──► 404 ──► trang trắng
```

Chỗ chặn nằm ở nhánh cuối: `--delete` phá lời hứa của tên có hash, vì tên vẫn bất biến nhưng đích đến không còn.

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Hash đến từ nội dung:** nội dung đổi thì tên đổi, nên một tên đã phát hành không bao giờ mang nội dung khác. Vì vậy tệp loại này cache được một năm.
- **Bước 2 — `index.html` không có hash:** nó là tệp duy nhất tên cố định mà nội dung đổi mỗi lần deploy. Cache nó là cache một tấm bản đồ cũ.
- **Bước 3 — `no-cache` không phải "không lưu":** nó nghĩa là trước khi dùng bản đã lưu, trình duyệt phải hỏi lại. Chưa đổi thì nhận `304` và không tải lại byte nào.
- **Bước 4 — Rollback cần artifact cũ còn nguyên:** tệp của bản cũ phải còn trên bucket và bản build cũ phải được lưu kèm một con trỏ. Có hai thứ đó thì rollback là ghi lại con trỏ.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** một chính sách cache cho mọi tệp, `sync --delete`, bucket public. Hỏng ở ba điểm: index cũ trỏ tới JS đã xoá, bản cũ biến mất nên không rollback được, và ai biết tên bucket cũng đọc thẳng được.
- **Cách tốt:** asset `max-age=31536000, immutable` và không bao giờ xoá; `index.html` `no-cache`; đẩy asset trước, index sau cùng; bucket private + OAC; lưu `releases/$VERSION/index.html`.

**Kiểm chứng bằng code (chạy thật):**

```
cd lessons/04-noi-hai-mang/l22
python deploy_sim.py
```

```
=== B. Hai chính sách cache, deploy không xoá tệp cũ ===
  Cache-Control index.html: no-cache
  Cache-Control assets:     public, max-age=31536000, immutable
  assets còn lại: ['app.5b636b61.js', 'app.84329dc9.js', 'style.0705158f.css', 'style.da21991e.css']
  Máy khách mới: index vừa tải
  GET /assets/app.84329dc9.js                 200
  => trang lên: mọi tệp index trỏ tới đều còn
  Máy khách còn cầm index v1 (tab mở từ trước)
  GET /assets/app.5b636b61.js                 200
  => trang lên: mọi tệp index trỏ tới đều còn

=== C. Rollback: đổi con trỏ về release cũ ===
  con trỏ current sau rollback                v1
  số bước build lại                           0
  số tệp phải chép                            0 (assets của v1 vẫn nằm trên bucket)
```

Dòng "máy khách còn cầm index v1" là dòng quan trọng nhất: đó chính là thứ `--delete` phá mất. Khối C cho thấy rollback đúng là 0 bước build, vì asset của bản cũ vẫn còn. Script cũng in phần so sánh: build lại cùng một commit sau khi thư viện `ui` lên bản nhỏ cho ra hash khác hẳn — tức là bạn vừa phát hành một artifact chưa ai chạy thử.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** người dùng đang mở tab không nhận màn hình trắng; rollback là thao tác vài giây thay vì một cuộc dựng lại có thể thất bại đúng lúc cần nhất; bucket đóng nên mọi request đều qua CloudFront.
- **Đánh đổi gì:** mỗi bản build để lại một bộ tệp phải giữ và một chính sách dọn phải viết đúng; hai chính sách cache là hai chỗ cấu hình sai; thêm bước `cache invalidation` (vô hiệu hóa bộ nhớ đệm cũ trên CloudFront) sau mỗi lần promote; migration phải chia nhiều lần chạy.
- **Khi nào KHÔNG nên dùng:** trang thử nghiệm không có người dùng thật, hoặc hệ thống nội bộ vài người dùng — ở đó thứ tự đẩy và hai chính sách cache không đáng bận tâm. Cũng đừng dùng `blue-green / rolling deploy` (triển khai cuốn chiếu) cho một trang tĩnh chỉ có một bản: nó chỉ thêm bước mà không đổi kết quả.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao `index.html` phải `no-cache` còn `app.5b636b61.js` thì cache được một năm?

- **Trả lời mẫu (30–60 giây):** Hai tệp khác nhau ở chỗ tên có gắn với nội dung hay không. Tên có hash thì nội dung đổi là tên đổi, nên cache một năm là an toàn. `index.html` giữ nguyên tên qua mọi lần deploy trong khi nội dung đổi, nên nếu cache thì trình duyệt dùng bản đồ cũ và trỏ tới tệp đã xoá. `no-cache` vẫn cho lưu bản, chỉ bắt hỏi lại trước khi dùng.
- **Lỗi hay mắc khi trả lời:** nói "`no-cache` là không được cache". Cách nói đúng: `no-store` mới là không lưu; `no-cache` là phải hỏi lại.

### Câu 2: Pipeline đã đặt `no-cache` cho `index.html` mà người dùng vẫn thấy bản cũ. Kể hai chỗ ghi đè được header đó.

- **Trả lời mẫu (30–60 giây):** Thứ nhất, header là metadata đi kèm object tại thời điểm ghi, nên một lần đẩy tay bằng console hoặc một script khác ghi lại object mà không kèm header là mất nó. Thứ hai, nếu Minimum TTL của cache behavior lớn hơn 0 thì CloudFront dùng Minimum TTL kể cả khi origin gửi `no-cache`. Còn một chỗ thứ ba: service worker hoặc proxy của công ty giữ bản riêng.
- **Lỗi hay mắc khi trả lời:** nói "invalidate `/*` là xong". Cách nói đúng: invalidate không chạm tới bộ nhớ đệm của trình duyệt.

### Câu 3: Vì sao rollback bằng "revert commit rồi cho pipeline chạy lại" không tương đương với "trỏ con trỏ về artifact cũ"?

- **Trả lời mẫu (30–60 giây):** Revert rồi build lại tạo ra một artifact mới, không phải artifact đã chạy tuần trước. Build phụ thuộc registry và phiên bản thư viện tại thời điểm chạy, nên cùng một commit có thể ra byte khác, hash khác, hành vi khác. Trong mô phỏng, chỉ cần thư viện `ui` lên một bản nhỏ là hai đường dẫn trùng nhau bằng `False`. Trỏ con trỏ thì đưa lên đúng bộ byte đã phục vụ khách hàng.
- **Lỗi hay mắc khi trả lời:** nói "mã nguồn giống nhau thì bản build giống nhau". Cách nói đúng: bản build là hàm của mã nguồn **và** môi trường build.

### Câu 4: Deploy đúng thứ tự, cache đúng chính sách, vẫn còn đường nào khiến người dùng thấy trắng trang?

- **Trả lời mẫu (30–60 giây):** Còn. Thứ tự đúng chỉ bảo vệ trường hợp index và asset cùng một bản. Ba đường còn lại: invalidate không chạy hoặc chạy sai đường dẫn nên biên vẫn trả index cũ; một bước dọn định kỳ xoá asset theo tuổi; pipeline đẩy song song thay vì tuần tự nên index lên trước asset. Cả ba đều cho ra cùng một triệu chứng: `index.html` có tuổi lớn hơn thời điểm asset của nó bị xoá.
- **Lỗi hay mắc khi trả lời:** nói "đã no-cache thì không còn cách nào hỏng". Cách nói đúng: `no-cache` chỉ giải quyết tầng trình duyệt, không giải quyết tầng biên và tầng dọn dẹp.

---
## Ghi chú nguồn

- https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html — `Cache-Control` là system metadata; muốn sửa phải copy hoặc ghi lại object.
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html — `max-age` quyết định thời gian CloudFront giữ object; Minimum TTL lớn hơn 0 đè được `no-cache`.
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html#ExpirationDownloadDist — bảng đối chiếu header của origin với Minimum/Default/Maximum TTL.
