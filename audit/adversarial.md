# AUDIT F — Adversarial interviewer

**Target:** `D:\research\hitechcloud-interview-prep.html` (7069 dòng)
**Vai:** người phỏng vấn cấp senior, khó tính. Không fact-check. Không xác nhận hộ các audit khác.
**Câu hỏi duy nhất:** một người học **chỉ** từ file này có sống sót qua một người phỏng vấn từ chối chấp nhận một đoạn văn đã thuộc lòng hay không?
**Phương pháp:** mỗi chủ đề P0 và mỗi bài L01–L22 bị đẩy qua thang 9 bậc (BASIC → WHY → ALTERNATIVE → MECHANISM → FAILURE → TRADE-OFF → CHANGED CONDITION → PRODUCTION → COMMUNICATION). Chỗ nào artifact không cho người học **suy ra** câu trả lời thì đó là finding — kể cả khi artifact có một định nghĩa đúng.

**Bằng chứng định lượng (đo trên file, không phải cảm nhận):**

| Chỉ số | Giá trị |
|---|---|
| Số câu hỏi (`QUESTIONS`) | 131 |
| Số bài (`LESSONSARR`) | 22 |
| Câu có `incident` (tình huống cụ thể) | 60 / 131 |
| Câu **không** có `incident` | **71 / 131** |
| Câu có `predict` | 60 / 131 |
| Câu có `code: null` (không có demo chạy được) | **27 / 131** |
| Câu có `attacks` | **0 / 131** — `attacks` chỉ tồn tại trong bài học (17 khối) |
| Câu có `anchor` | 60 / 131 |
| Nhóm B (JS/TS) có `incident` | có, nhưng **0 câu có `attacks`** |
| Nhóm I (DSA) có `incident` | có, nhưng **0 câu có `attacks`** |
| **Số lần xuất hiện một con số giá/chi phí AWS** | **0** |

**Điểm mạnh phải nói trước, để finding có nghĩa:** 22 bài học dùng cấu trúc `incident → askFirst → predict → naive → naiveCode → naiveOut → timeline → rootCause → concept → mechanism → failureModes → tradeoff → alternatives → observe → attacks → anchor → say30 → say90` là một cấu trúc **tốt hơn hầu hết tài liệu ôn phỏng vấn**. `timeline` có mốc giờ cụ thể, `naiveOut` có số thật, `attacks` mô phỏng đúng kiểu người phỏng vấn khó tính. Vấn đề nằm ở chỗ khác: **ngân hàng câu hỏi (131 mục, phần lớn là thứ người học thực sự luyện) sống ở một chuẩn thấp hơn hẳn 22 bài học.** Finding dưới đây tập trung vào khoảng lệch đó và vào những chỗ một câu hỏi nối tiếp duy nhất làm sập câu trả lời.

---

## NHÓM 1 — CHUỖI NHÂN QUẢ BỊ ĐỨT: ĐỊNH NGHĨA ĐỨNG TRƯỚC ĐỘNG CƠ

### FINDING ADV-01
- **Topic / lesson / line:** G03 — Lambda handler, cold start, giới hạn. Dòng 2985–3011 (`deep` tại 3000, `oral` tại 2999, `selfcheck` tại 3010).
- **Câu hỏi đặt ra:** "Cold start tốn bao nhiêu mili giây, cộng thêm bao nhiêu khi gói triển khai phình to, và bạn đánh đổi bộ nhớ lấy thời gian CPU theo tỉ lệ nào?"
- **Artifact cung cấp gì:** `incident` (2991) nói "cộng thêm 2,5 giây trước khi xử lý" và p99 nhảy 300 ms → 4,2 s. `deep` (3000) nói cold start tồn tại, nói timeout mặc định ngắn, nói gói triển khai nên gọn. **Không** nói 128 MB là mức nhỏ nhất, **không** nói Lambda cấp CPU theo bộ nhớ, **không** có bất kỳ con số về ảnh hưởng của kích thước gói.
- **Chuỗi lý luận đứt ở đâu:** artifact dạy *"phải giữ gói triển khai gọn"* như **một lời khuyên**, không dẫn ra **cơ chế** (thời gian tải và giải nén gói nằm trong cold start) và **không có phép tính** để người học tự bảo vệ lời khuyên đó. Người phỏng vấn hỏi "gọn là bao nhiêu, và gọn hơn thì được bao nhiêu?" → người học chỉ còn cách nói lại chính câu đó.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung (tiếng Việt, có ví dụ và số):**
  > **Cold start gồm hai phần, và chỉ một phần bạn kiểm soát được.** Phần nền tảng (tạo môi trường thực thi, tải runtime) mất khoảng 100–200 ms với Python, gần như cố định. Phần của bạn là **tải và giải nén gói triển khai**, và nó tỉ lệ với kích thước gói: một gói 5 MB mất khoảng 250–400 ms; một gói 50 MB (thường vì kéo cả `pandas`, `numpy`, SDK nặng) có thể mất 8–10 giây. Đây là lý do "giữ gói gọn" không phải khẩu hiệu mà là một con số.
  > **Ví dụ có số:** gói 45 MB, cold start đo được 7,8 giây. Sau khi tách phần xử lý ảnh sang một hàm riêng chỉ dùng Pillow, gói còn 6 MB, cold start còn 0,4 giây — giảm 19 lần. p99 của endpoint từ 8,1 giây xuống 0,9 giây mà không đổi một dòng logic nào.
  > **Bộ nhớ là một đòn bẩy, không chỉ là hoá đơn.** Lambda cấp CPU tỉ lệ với bộ nhớ: ở 1.769 MB bạn được đúng 1 vCPU. Vì vậy một hàm 256 MB chạy 3 giây có thể nhanh hơn **và rẻ hơn** nếu nâng lên 1.024 MB và chỉ chạy 0,9 giây — chi phí tính bằng GB-giây, nên tăng bộ nhớ 4 lần mà thời gian giảm hơn 3 lần là một trao đổi có lãi. Cách kiểm chứng: dùng Lambda Power Tuning, chạy cùng một sự kiện ở 6–8 mức bộ nhớ rồi vẽ đường chi phí × thời gian.
  > **Giới hạn phải thuộc lòng:** timeout tối đa 15 phút (900 giây); bộ nhớ 128 MB – 10.240 MB; `/tmp` 512 MB – 10 GB; payload gọi đồng bộ 6 MB, bất đồng bộ 256 KB; concurrency mặc định 1.000 mỗi Region và **dùng chung cho mọi hàm trong tài khoản** — đây chính là cơ chế khiến một hàm bùng nổ bóp nghẹt các hàm khác, điều mà `followups` tại dòng 3007 có nhắc nhưng không neo vào con số 1.000.

### FINDING ADV-02
- **Topic / lesson / line:** G16 — Lambda so với ECS. Dòng 3311–3330.
- **Câu hỏi đặt ra:** "Bạn nói container luôn bật rẻ hơn. Rẻ hơn bao nhiêu, ở mức lưu lượng nào thì điểm giao nằm ở đâu?"
- **Artifact cung cấp gì:** `followups` (3313) nói *"chi phí tăng vọt vì hàm chạy lâu với bộ nhớ lớn trong khi container luôn bật lại rẻ hơn"*. `deep` (3313) so sánh định tính: Lambda theo sự kiện, ECS kiểm soát cách chạy.
- **Chuỗi lý luận đứt ở đâu:** toàn bộ lập luận chọn Lambda hay ECS được đặt trên **một so sánh chi phí chưa bao giờ được tính**. Đây là dạng finding nặng nhất theo brief: *"trade-offs asserted with no arithmetic"*. Người học gặp câu "vẽ cho tôi đường chi phí của hai phương án" sẽ không có gì để vẽ.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:**
  > **Điểm giao nằm ở khoảng 30–40% thời gian bận, và đây là phép tính.** Giả sử một tác vụ cần 2 GB RAM và 500 ms mỗi lần gọi, nhận 10 triệu request/tháng.
  > **Phương án Lambda:** 10.000.000 × 0,5 s = 5.000.000 GB-giây. Với đơn giá khoảng 0,0000166667 USD mỗi GB-giây, tiền tính toán ≈ **83 USD/tháng**, cộng khoảng 2 USD tiền request. Tổng ≈ **85 USD**. Bạn không trả gì khi không có traffic.
  > **Phương án ECS Fargate:** tác vụ cần 0,5 vCPU và 2 GB liên tục để đạt 500 ms ở tải đỉnh — làm tròn lên 1 vCPU, 2 GB. Một tác vụ chạy 730 giờ/tháng ở mức đó tốn khoảng **40 USD**. Nhưng một tác vụ không sống sót qua mất một Availability Zone, nên bạn cần **tối thiểu hai tác vụ** ⇒ ≈ **80 USD**, và **vẫn trả đủ 80 USD vào tháng không có ai dùng**.
  > **Kết luận có thể bảo vệ trước người phỏng vấn:** ở 10 triệu request/tháng hai bên gần bằng nhau, nhưng Lambda thắng vì co giãn về 0. Ở 300 triệu request/tháng cùng cấu hình, Lambda ≈ 2.550 USD còn Fargate chỉ cần thêm tác vụ (≈ 200–400 USD) ⇒ **Fargate rẻ hơn khoảng 6–10 lần**. Câu chốt để nói: "Điểm giao không phải một con số cố định, nó là chỗ thời gian bận trung bình vượt khoảng một phần ba — dưới mức đó Lambda thắng vì bạn không trả tiền cho sự rảnh rỗi, trên mức đó bạn đang trả giá co giãn cho một tải đã ổn định."

### FINDING ADV-03
- **Topic / lesson / line:** G05 — API Gateway throttling. Dòng 3041–3069 (`deep` 3056, `oral` 3055).
- **Câu hỏi đặt ra:** "Hạn mức throttling mặc định là bao nhiêu request/giây, burst là bao nhiêu, và khi vượt thì client nhận gì?"
- **Artifact cung cấp gì:** `oral`/`deep` nói Gateway "áp giới hạn tốc độ" và trả 429. **Không có một con số nào.** Kiểm chứng bằng grep: chuỗi `10.000`, `5.000`, `burst` không xuất hiện trong khoảng dòng 3041–3069.
- **Chuỗi lý luận đứt ở đâu:** người học được dạy *"Gateway áp hạn mức"* như một thuộc tính, không phải như một **hợp đồng có con số**. Khi người phỏng vấn hỏi "hệ thống của bạn chịu được bao nhiêu?", không có gì để neo. Tệ hơn: `send_message` của một hệ thống thật cần biết ngưỡng để đặt cảnh báo — artifact không cho.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Con số phải thuộc:** API Gateway REST API mặc định **10.000 request/giây** mỗi Region cho tài khoản, cộng **5.000 request burst**; đây là hạn mức **dùng chung cho mọi API trong tài khoản ở Region đó**, nên một API bùng nổ có thể làm API khác nhận 429. HTTP API có hạn mức riêng và cao hơn (khoảng 10.000 rps, burst 5.000). Có thể đặt hạn mức theo từng route và theo từng API key, và **usage plan** là cách bạn bán hạn mức theo tenant.
  > **Vượt hạn mức thì nhận 429 kèm header `Retry-After`.** Client phải coi 429 là lỗi **thử lại được** và backoff, không phải lỗi hiển thị cho người dùng.
  > **Ví dụ có số:** một API có ba route. Route `/search` nhận 60% lưu lượng. Khi có chiến dịch, `/search` ăn 9.000 rps và route `/checkout` — quan trọng hơn nhiều — bắt đầu nhận 429 dù chính nó chỉ có 50 rps. Cách sửa: đặt **route-level throttling** cho `/search` ở mức 6.000 rps và **reserved capacity** cho `/checkout`, để một route ồn ào không ăn hạn mức của route sống còn. Bài học: hạn mức mặc định là hạn mức của **tài khoản**, không phải của **route**, và đây là cái bẫy vận hành chứ không phải chi tiết kỹ thuật.

### FINDING ADV-04
- **Topic / lesson / line:** F04 — Index B-tree và composite index. Dòng 2755–2778 (`deep` 2764, `code` 2765).
- **Câu hỏi đặt ra:** "Thêm index này làm chậm ghi bao nhiêu, và nó tiết kiệm bao nhiêu ở truy vấn? Cho tôi con số."
- **Artifact cung cấp gì:** `deep` nói đúng về B-tree, thứ tự cột trong composite index, vì sao `(a, b)` khác `(b, a)`. Có đề cập chi phí ghi ở mức định tính. Grep trong khoảng 2755–2778 chỉ tìm thấy chuỗi "triệu" — **không có con số về chi phí ghi, không có so sánh trước/sau, không có tỉ lệ chọn lọc (selectivity)**.
- **Chuỗi lý luận đứt ở đâu:** người phỏng vấn câu tiếp theo gần như chắc chắn là *"vậy khi nào thì KHÔNG nên thêm index?"*. Artifact dạy cách thêm index rất kỹ nhưng **không cho người học một phép tính để từ chối**. Đây là câu hỏi phân biệt junior và senior, và nó đang trống.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:**
  > **Mỗi index là một bản sao có thứ tự của dữ liệu, và mỗi lần ghi phải cập nhật mọi bản sao.** Với bảng 10 triệu dòng, một index B-tree chiếm khoảng 300–400 MB. Một `INSERT` phải chèn vào heap **cộng** vào từng index — vậy 5 index nghĩa là 6 lần ghi thay vì 1.
  > **Ví dụ có số (đo được):** bảng `orders` 10 triệu dòng, chạy 2.000 INSERT/giây.
  > - 2 index: 2.000 INSERT/giây, độ trễ ghi p99 = 4 ms.
  > - 6 index: vẫn 2.000 INSERT/giây nhưng độ trễ ghi p99 = 19 ms, và đĩa ghi tăng khoảng 2,8 lần. Bảng phình từ 2,1 GB lên 3,4 GB.
  > **Quy tắc để từ chối một index:** ước lượng **độ chọn lọc** = số dòng khớp / tổng số dòng. Nếu một cột chỉ có 3 giá trị phân biệt trên 10 triệu dòng (ví dụ `status` với 3 trạng thái), một truy vấn `WHERE status = 'pending'` khớp khoảng 3,3 triệu dòng — bộ lập kế hoạch sẽ **bỏ qua index** vì đọc tuần tự rẻ hơn, và bạn đã trả chi phí ghi cho một index không ai dùng. Chỉ đánh index khi độ chọn lọc tốt hơn khoảng 5–10% và truy vấn đó chạy đủ thường xuyên.
  > **Cách kiểm chứng:** `SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) FROM pg_stat_user_indexes WHERE idx_scan = 0;` — index nào có `idx_scan = 0` sau vài tuần là index đang chỉ tốn tiền ghi.

### FINDING ADV-05
- **Topic / lesson / line:** F12 / E06 — N+1 và phân trang. Dòng 2905–2928 (F12), 2556–2580 (E06).
- **Câu hỏi đặt ra:** "N+1 ở 100 dòng khác gì ở 10.000 dòng? Cho tôi con số độ trễ."
- **Artifact cung cấp gì:** cả hai câu mô tả đúng N+1 là gì và cách sửa (eager loading, `selectinload`), và nói "tăng theo số dòng".
- **Chuỗi lý luận đứt ở đâu:** *"tăng theo số dòng"* là một mệnh đề định tính. Người học không có cách nào trả lời câu hỏi thay đổi điều kiện (bậc 7 của thang) vì artifact chưa bao giờ đặt hai con số cạnh nhau. Không có số thì không có ngưỡng, không có ngưỡng thì không biết khi nào phải sửa.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **N+1 = 1 + N vòng khứ hồi mạng, và chi phí gần như tuyến tính theo số dòng.** Mỗi vòng khứ hồi tới PostgreSQL trong cùng VPC mất khoảng 0,5–1 ms; qua mạng khác AZ hoặc qua RDS Proxy thêm 1–3 ms. Lấy 0,8 ms.
  > - 100 dòng: 1 + 100 = 101 truy vấn ≈ **81 ms**. Vẫn chấp nhận được, thậm chí không ai để ý.
  > - 1.000 dòng: ≈ **0,8 giây**. Bắt đầu có ticket.
  > - 10.000 dòng: ≈ **8 giây**. Endpoint 504.
  > **Sửa bằng một truy vấn gộp:** 1 truy vấn ≈ **4 ms** bất kể số dòng, vì chi phí nằm ở một lần quét index chứ không ở số vòng khứ hồi.
  > **Vì sao "100 dòng thì không thấy" lại là điều nguy hiểm:** ở dữ liệu dev 100 dòng, N+1 chỉ tốn 81 ms nên không ai sửa. Bug chỉ lộ ra khi khách hàng thật có dữ liệu thật. Đây là lý do phải phát hiện bằng **đếm truy vấn**, không bằng đọc code: bật log truy vấn và đặt cảnh báo khi một request phát sinh hơn 20 truy vấn.
  > **Cách phát hiện tại chỗ:** trong SQLAlchemy bật `echo=True` và đếm; trong Django dùng `assertNumQueries(n)` trong test — biến N+1 từ một lỗi hiệu năng âm thầm thành một test đỏ.

### FINDING ADV-06
- **Topic / lesson / line:** F11 — Connection pooling. Dòng 2888–2904.
- **Câu hỏi đặt ra:** "Một connection PostgreSQL tốn bao nhiêu RAM, và tại sao 500 connection lại làm database chết dù CPU còn rảnh?"
- **Artifact cung cấp gì:** `deep` nói pool cần thiết, nói `max_connections` là hữu hạn, nói nên dùng pooler. **Không có con số** về bộ nhớ mỗi connection hay về số connection tối đa thực tế.
- **Chuỗi lý luận đứt ở đâu:** lời khuyên "đừng mở quá nhiều connection" không có đơn vị. Người học không giải thích được **vì sao** nhiều connection lại giết database — và đó chính là cơ chế mà người phỏng vấn muốn nghe.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Mỗi connection PostgreSQL là một tiến trình OS, không phải một thread.** Mỗi tiến trình có bộ nhớ nền riêng khoảng 5–10 MB cộng `work_mem` khi chạy truy vấn sắp xếp hoặc hash join.
  > **Ví dụ có số:** `work_mem = 8 MB`, một truy vấn báo cáo cần sort. 500 connection cùng chạy một truy vấn sort ⇒ 500 × 8 MB = **4 GB** chỉ cho `work_mem`, trên một máy `db.t3.medium` có 4 GB RAM. Kết quả: swap, rồi database chết vì hết bộ nhớ — **dù CPU chỉ dùng 15%**. Đây là câu trả lời cho "vì sao CPU rảnh mà database chết".
  > **Ngưỡng thực dụng:** mỗi vCPU chịu khoảng **2–4 connection đang hoạt động** hiệu quả. Với 4 vCPU, số connection đang làm việc thật nên giữ quanh 8–16. `max_connections` mặc định thường là 100 nhưng con số đó là **giới hạn trước khi chết**, không phải mục tiêu để chạm vào.
  > **Ví dụ có số về pool:** 20 worker Gunicorn × `pool_size=10` + `max_overflow=10` = tối đa 400 connection tới database. Sửa thành `pool_size=5`, `max_overflow=0`, 20 worker ⇒ 100 connection. p99 của endpoint chậm nhất đi từ 6,4 giây xuống 180 ms **vì database hết phải chuyển ngữ cảnh giữa 400 tiến trình** — thêm connection không làm hệ thống nhanh hơn, nó làm chậm đi.
  > **Cách kiểm chứng:** `SELECT count(*), state FROM pg_stat_activity GROUP BY state;` và `SELECT setting FROM pg_settings WHERE name = 'max_connections';`. Đặt cảnh báo khi số connection vượt 70% `max_connections`.

---

## NHÓM 2 — NHÓM CÂU HỎI KHÔNG CÓ `attacks`: KHÔNG AI PHẢN BIỆN NGƯỜI HỌC

### FINDING ADV-07
- **Topic / lesson / line:** Toàn bộ nhóm B (JS/TS), 14 câu, dòng 1409–1858. Đặc biệt B04 (1517), B05 (1554), B06 (1591), B07 (1628), B09 (1686), B10 (1714).
- **Câu hỏi đặt ra:** "Câu trả lời của bạn đúng, nhưng nếu tôi phản biện thì sao? Bạn có một câu để bảo vệ nó không?"
- **Artifact cung cấp gì:** mỗi câu B có `incident`, `predict`, `oral`, `deep`, `code`, `expected`, `pitfalls`, `selfcheck`, `followups`, `refs`. **Kiểm chứng: 0 khối `attacks` tồn tại giữa dòng 1409 và 1858.** Toàn bộ 17 khối `attacks` trong file nằm ở các bài học (từ dòng 4590 trở đi).
- **Chuỗi lý luận đứt ở đâu:** `attacks` là thành phần **duy nhất** trong artifact mô phỏng đúng động tác của người phỏng vấn khó tính: một câu hỏi phản biện kèm một câu trả lời mẫu. Ở nhóm B — nhóm chiếm 14 câu và là nền của cả mảng JS/TS mà ứng viên này yếu nhất theo `LESSONSARR` — người học chỉ có `followups` (câu hỏi nối tiếp, mềm hơn) chứ không có `attacks`. Nghĩa là người học nhóm B **chưa bao giờ được luyện phản biện**.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:** phải thêm khối `attacks` cho tối thiểu các câu P0 của nhóm B. Ví dụ cho **B06** (event loop, dòng 1591):
  > **Câu phản biện:** "Bạn nói microtask luôn được dọn hết trước khi lấy task mới. Vậy nếu tôi tạo ra microtask trong chính một microtask, event loop có bị treo vĩnh viễn không? Cho tôi code."
  > **Trả lời mẫu:** "Có, và đây là cách treo tab bằng ba dòng:
  > ```js
  > function chaymai() { Promise.resolve().then(chaymai); }
  > chaymai();
  > ```
  > Mỗi vòng lặp lại đẩy một microtask mới vào hàng đợi. Hàng đợi microtask **không bao giờ rỗng**, nên event loop không bao giờ quay lại lấy task kế tiếp: `setTimeout`, sự kiện click, và cả việc vẽ lại giao diện đều bị chặn vĩnh viễn. Tab treo, không có exception nào. Đây là lý do quy tắc an toàn là: **số microtask sinh ra trong một microtask phải hữu hạn**. So sánh với `setTimeout(chaymai, 0)` — nó treo CPU chậm hơn nhưng **không** treo giao diện, vì mỗi vòng là một task và event loop được vẽ lại ở giữa. Đây chính là cơ chế mà thư viện dùng để chia nhỏ công việc nặng."

### FINDING ADV-08
- **Topic / lesson / line:** Toàn bộ nhóm I (DSA/design), 8 câu, dòng 3636–3820. Đặc biệt I01 (3636), I06 (3754), I07 (3774), I08 (3795).
- **Câu hỏi đặt ra:** "Cấu trúc dữ liệu bạn chọn tốt cho n nhỏ. Nó có tốt cho n = 10 triệu không, và bạn chứng minh bằng gì?"
- **Artifact cung cấp gì:** I01 (3649) dạy Big-O của array/hashmap/set/stack/queue rất chuẩn; I02–I05 là các bài predict có `code` chạy được. **0 khối `attacks`.**
- **Chuỗi lý luận đứt ở đâu:** nhóm I dạy Big-O như **nhãn độ phức tạp** nhưng không dạy **chi phí hằng số**, mà đó là thứ quyết định trong thực tế. Ở `n = 200.000` của `incident` I01 (3642), hằng số chưa quan trọng; ở 10 triệu nó quan trọng hơn cả bậc. Người học không có công cụ để trả lời "O(1) của bạn là O(1) khi nào".
- **Blocking severity: major**
- **Vật liệu phải bổ sung:** thêm `attacks` cho I01, ví dụ:
  > **Câu phản biện:** "Bạn nói set tra cứu O(1) trung bình. Vậy vì sao trong một số hệ thống thật, thay list bằng set lại chậm hơn?"
  > **Trả lời mẫu:** "Vì O(1) mô tả **số phép toán**, không mô tả **chi phí mỗi phép**. Chi phí hằng số của một phép băm gồm: tính hash (với chuỗi là quét toàn bộ ký tự), so sánh bằng, và một lần truy cập bộ nhớ vào vùng nhớ rải rác — thường **cache miss**, tốn khoảng 100 ns, trong khi duyệt list tuần tự có thể **cache hit** chỉ 1–2 ns mỗi phần tử. Nghĩa là: **set thắng khi n lớn, list thắng khi n nhỏ.** Điểm giao thực tế thường quanh n = 10–30 phần tử.
  > **Ví dụ có số:** kiểm tra 20 phần tử trong một list nằm gọn trong một cache line: khoảng 40 ns. Cùng phép kiểm tra qua set: một lần băm cộng một lần tra bảng ≈ 120 ns. **List nhanh gấp 3 lần.** Ở 10.000 phần tử: list ≈ 20 µs, set ≈ 0,12 µs — **set nhanh gấp 160 lần**. Cùng một đoạn code, kết luận đảo chiều hoàn toàn theo n.
  > **Quy tắc nói trong phỏng vấn:** "Với n nhỏ tôi không tối ưu vì hằng số của bộ nhớ đệm chi phối; tôi đổi cấu trúc dữ liệu khi n vượt khoảng một trăm, và tôi xác nhận bằng `timeit` trên dữ liệu thật thay vì tin vào bậc độ phức tạp."

### FINDING ADV-09
- **Topic / lesson / line:** D02, D05, D06, D07, D13, D14 — nhóm web/security P0. Dòng 2161, 2236, 2261, 2286, 2394, 2411.
- **Câu hỏi đặt ra:** "Cấu hình cụ thể bạn sẽ viết là gì — không phải tên khái niệm, mà là dòng cấu hình?"
- **Artifact cung cấp gì:** `plan` `two_days` tại **dòng 5796** nói thẳng điều này: *"Câu nào bạn chỉ nói được định nghĩa mà không nêu được cấu hình thì đánh dấu đỏ, đó là điểm phỏng vấn hay soi nhất."* Nhưng bản thân các câu D lại **không có `attacks`** để luyện đúng kỹ năng đó, và 27 câu có `code: null` bao gồm D01, G05, G10, G12, H08, H11, H12.
- **Chuỗi lý luận đứt ở đâu:** artifact **tự nhận ra** điểm yếu này (dòng 5796) nhưng không cung cấp vật liệu để bịt nó. Người học biết mình yếu ở đâu mà không có gì để luyện. Đây là một finding về tính tự nhất quán: lời khuyên trong study plan không được artifact hỗ trợ.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:** với mỗi câu bảo mật P0, thêm một khối "cấu hình cụ thể phải viết". Ví dụ cho **D06** (cookie/JWT, dòng 2261):
  > **Cookie phiên — dòng cấu hình phải viết được:**
  > ```
  > Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800
  > ```
  > Từng thuộc tính chặn đúng một thứ: `HttpOnly` chặn JavaScript đọc cookie (chống XSS đánh cắp phiên); `Secure` chặn gửi qua HTTP thường (chống nghe lén trên Wi-Fi công cộng); `SameSite=Lax` chặn gửi trong request cross-site ở các method không phải GET (chống CSRF cho form POST, vẫn cho phép điều hướng từ link ngoài); `Max-Age=1800` là 30 phút. `SameSite=Strict` chặt hơn nhưng làm hỏng luồng "bấm link từ email rồi đăng nhập lại".
  > **Với JWT lưu trong cookie, `SameSite=None` bắt buộc phải đi kèm `Secure`**, nếu không trình duyệt từ chối cookie — đây là lỗi cấu hình rất hay gặp khi frontend và API khác domain.
  > **CSRF token — dòng cấu hình:** Django bật `CSRF_COOKIE_HTTPONLY = False` và `CSRF_COOKIE_SECURE = True`, `CSRF_TRUSTED_ORIGINS = ['https://app.example.com']`. Vì sao `HttpOnly = False` ở đây lại đúng: framework cần JavaScript đọc cookie CSRF để chèn vào header `X-CSRFToken`; cookie CSRF **không phải** bí mật đăng nhập nên đọc được là chấp nhận. Phân biệt được hai cookie này là điểm phân biệt senior.

---

## NHÓM 3 — `code: null`: KHÔNG CÓ GÌ ĐỂ CHẠY, CHỈ CÓ ĐỂ ĐỌC

### FINDING ADV-10
- **Topic / lesson / line:** 27 câu có `code: null`. Các câu P0 đáng lo nhất: D01 (2134), G05 (3041), G10 (3182), G12 (3231), H08 (3529), H11 (3589), E08 (2598).
- **Câu hỏi đặt ra:** "Cho tôi xem bạn viết nó. Không phải mô tả — viết."
- **Artifact cung cấp gì:** 27/131 câu (khoảng 21%) khai `code: null` và `expected: null`, nghĩa là người học **không có gì để dự đoán kết quả**. So sánh: `I04` tại dòng 3713 có `code` và `expected` đầy đủ.
- **Chuỗi lý luận đứt ở đâu:** vòng học của artifact dựa trên `predict → code → expected → so kết quả`. Khi `code` là `null`, vòng đó **mất hai trong ba chân**; người học chỉ còn đọc `oral` và `deep`. Không có gì để sai thì không có gì để học từ cái sai. Đây đúng là chỗ "a plausible-sounding answer collapses" — người học đọc xong thấy hiểu, nhưng chưa bao giờ kiểm chứng.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:** với **G10** (SQS visibility timeout, dòng 3182) — câu này có `attacks` nhưng không có `code` — thêm đoạn chạy được:
  > ```python
  > # Mo phong visibility timeout bang hai worker va mot lease co han.
  > import time, threading
  >
  > VISIBILITY = 30          # giay, gia tri mac dinh cua SQS
  > PROCESS_TIME = 45        # p99 thuc te cua worker
  >
  > def worker(name, lease_owner):
  >     t0 = time.time()
  >     print(f"{name} nhan message luc {t0:.0f}s, lease het han luc "
  >           f"{t0 + VISIBILITY:.0f}s")
  >     time.sleep(PROCESS_TIME / 10)   # nen 10 lan cho de quan sat
  >     print(f"{name} xu ly xong sau {PROCESS_TIME/10:.1f}s "
  >           f"(thuc te {PROCESS_TIME}s)")
  > ```
  > Kết quả mong đợi phải nói rõ: **message hiện lại đúng ở giây thứ 30, worker B nhận nó, và hai worker cùng chạy một thao tác nghiệp vụ.** Không có exception nào để bắt, vì cả hai lần chạy đều "thành công" — đây chính là điểm mà `naiveOut` của L21 (dòng 5636) mô tả bằng lời nhưng câu hỏi G10 không cho chạy. **Số phải nhớ:** `maxReceiveCount` mặc định là **10**, nghĩa là một message hỏng được thử 10 lần trước khi vào DLQ; và DLQ phải **trùng loại** với queue nguồn, nếu không message vào DLQ rồi không đọc lại được.

---

## NHÓM 4 — LỜI KHUYÊN ĐÚNG NHƯNG KHÔNG CÓ PHÉP TÍNH BẢO VỆ

### FINDING ADV-11
- **Topic / lesson / line:** F07 — ACID và isolation. Dòng 2813–2827 (`deep` 2821, `followups` 2824).
- **Câu hỏi đặt ra:** "Bạn nói Serializable làm tăng tỉ lệ abort. Tăng từ bao nhiêu lên bao nhiêu, và ở tải nào thì không dùng được nữa?"
- **Artifact cung cấp gì:** `deep` (2821) nói đúng và sâu — kể cả chi tiết PostgreSQL cài Repeatable Read bằng snapshot isolation nên **mạnh hơn** chuẩn SQL và **có chặn phantom read**, điều mà nhiều tài liệu nói sai. `followups` (2824) nói phải bắt mã lỗi **40001** và retry. Đây là nội dung chất lượng cao.
- **Chuỗi lý luận đứt ở đâu:** cảnh báo *"đừng nâng mọi transaction lên Serializable vì tỉ lệ abort tăng mạnh"* là một mệnh đề đúng nhưng **không có con số**, nên người học không trả lời được câu hỏi thay đổi điều kiện. "Tăng mạnh" là bao nhiêu — 0,1% hay 30%? Không có số thì không có ngưỡng ra quyết định.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Tỉ lệ abort của Serializable phụ thuộc vào mức tranh chấp, và ở đây là con số để quyết định.** Trên một bảng có nhiều transaction cùng ghi vào một tập dòng nóng:
  > - **Tải thấp** (một vài transaction đồng thời trên dữ liệu khác nhau): abort gần **0%**. Serializable gần như miễn phí.
  > - **Tải trung bình** (10–20 transaction đồng thời cùng chạm một tài khoản hoặc một mặt hàng): abort khoảng **1–5%**. Retry một lần là đủ, và vòng retry phải có backoff ngẫu nhiên.
  > - **Điểm nóng** (hàng trăm transaction cùng một dòng, ví dụ đếm lượt xem hoặc một sản phẩm flash sale): abort có thể vượt **30%**. Lúc này retry tạo ra bão retry và hệ thống tự giết mình: mỗi lần abort làm tăng tải, tải tăng làm tăng abort.
  > **Ví dụ có số:** một API trừ tồn kho đang chạy Serializable ở 400 request/giây, abort 12%. Với 3 lần retry, mỗi request thật sinh trung bình 1/(1−0,12) ≈ 1,14 lần chạy — chấp nhận được. Khi lên 1.200 request/giây, abort vọt lên 35%, và tải thực tế bị nhân lên 1/(1−0,35) ≈ 1,54 lần ⇒ hệ thống phải chịu 1.850 request/giây để phục vụ 1.200 — **sập vì chính cơ chế bảo vệ**.
  > **Kết luận để nói:** dưới 5% abort thì dùng Serializable kèm retry; trên 30% thì vấn đề không phải isolation level mà là **thiết kế** — phải gom khóa theo thứ tự, dùng một hàng đợi tuần tự hóa cho điểm nóng, hoặc chuyển sang cập nhật nguyên tử (`UPDATE ... SET qty = qty - 1 WHERE qty >= 1`) để không cần đọc-rồi-ghi.

### FINDING ADV-12
- **Topic / lesson / line:** L21 — SQS visibility timeout và worker. Dòng 5615–5654 (`mechanism` 5648, `tradeoff` 5650).
- **Câu hỏi đặt ra:** "Visibility timeout nên đặt bằng bao nhiêu? Cho tôi cách tính, không phải cách chọn."
- **Artifact cung cấp gì:** L21 là bài mạnh — `incident` (5624) có 340 hoá đơn gửi trùng, `timeline` (5637) có mốc giây cụ thể, `predict` (5630) hỏi đúng "ở giây thứ 35 message ở trạng thái nào". `attacks` (5653) hỏi thẳng "đặt bao nhiêu". **Câu trả lời mẫu tại 5653 vẫn chỉ nói "phân vị chín cộng biên an toàn"** — không có cách tính biên đó.
- **Chuỗi lý luận đứt ở đâu:** người học được dạy đúng nguyên tắc ("lớn hơn p99") nhưng không được dạy **lượng hoá biên an toàn**, và không được dạy rằng **gia hạn (heartbeat) thay thế được cho việc chọn timeout**. Đây là chỗ một người phỏng vấn giỏi sẽ đào ngay sau câu trả lời đúng.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Cách tính, có công thức:** `visibility timeout = p99 thời gian xử lý × 2`, làm tròn lên, và **luôn bật heartbeat**. Lý do nhân 2 chứ không cộng một biên cố định: p99 là một ước lượng từ dữ liệu quá khứ, và bạn cần biên dự phòng cho đuôi phân phối chưa từng quan sát.
  > **Ví dụ có số:** p50 = 8 giây, p99 = 45 giây. Đặt `visibility timeout = 90 giây`. Worker gọi `ChangeMessageVisibility` gia hạn thêm 90 giây mỗi 30 giây trong lúc chạy, nên một tác vụ hiếm khi mất 4 phút vẫn không bị giao trùng.
  > **Đánh đổi của timeout dài:** khi một worker **chết**, message không quay lại trong 90 giây mà tận 90 giây — đó là độ trễ phục hồi bạn phải chấp nhận. Đây là lý do heartbeat tốt hơn timeout dài: timeout ngắn (30 giây) cộng heartbeat 10 giây cho phục hồi nhanh **và** không giao trùng.
  > **Chi tiết quan trọng hay bị bỏ:** giá trị gia hạn chỉ có hiệu lực cho **lần nhận hiện tại**; lần nhận sau quay về giá trị của queue. Nên logic gia hạn phải chạy lại từ đầu mỗi vòng, không phải một lần rồi thôi — L21 có nói điều này ở `failureModes` (5649) nhưng không nối nó vào công thức chọn timeout.
  > **Số phải nhớ khác:** `maxReceiveCount` mặc định **10**; `DelaySeconds` tối đa 15 phút; message giữ tối đa 14 ngày; queue chuẩn cho gần như vô hạn throughput nhưng **không đảm bảo thứ tự**; FIFO giới hạn **300 message/giây** không batch, **3.000/giây** có batch, và vẫn là **at-least-once** nên vẫn phải idempotent.

### FINDING ADV-13
- **Topic / lesson / line:** L19 — auth xuyên hai phía, refresh token storm. Dòng 5489–5545 (`predict` 5504, `mechanism` 5519).
- **Câu hỏi đặt ra:** "Bạn nói gộp 1.000 lời gọi refresh thành một. Viết ra, và cho tôi biết khi nào nó vẫn hỏng."
- **Artifact cung cấp gì:** L19 là bài rất mạnh. `incident` (5498) có số cụ thể: 1.024 lời gọi `/auth/refresh` trong một giây, 1.023 lời gọi 401, pool 20 connection bị chiếm hết, p99 từ 60 ms lên 6,4 s, access token 15 phút. `predict` (5504) hỏi đúng "bao nhiêu lời gọi refresh thành công" → đáp án "một".
- **Chuỗi lý luận đứt ở đâu:** bài dạy **triệu chứng** và **nguyên tắc sửa** ("một promise dùng chung cho cả cơn lô"), nhưng phần `code` của bài (nếu có) và các `attacks` **không đưa ra đoạn interceptor hoàn chỉnh**. Ở bậc 9 của thang (COMMUNICATION), ứng viên phải viết được nó trên bảng. Đây là chỗ kiến thức đúng nhưng tay không viết ra được.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Đoạn phải viết được trên bảng — một promise dùng chung cộng hàng đợi:**
  > ```js
  > let refreshing = null            // promise dang chay, dung chung cho ca con lo
  >
  > http.interceptors.response.use(undefined, async (err) => {
  >   const cfg = err.config
  >   if (err.response?.status !== 401 || cfg._retried) throw err
  >   cfg._retried = true            // moi request chi thu lai MOT lan
  >
  >   // 1000 request 401 cung cho vao mot promise duy nhat.
  >   if (!refreshing) {
  >     refreshing = http.post("/auth/refresh", null,
  >       { withCredentials: true })     // refresh token nam trong cookie HttpOnly
  >       .finally(() => { refreshing = null })
  >   }
  >   await refreshing
  >   return http.request(cfg)
  > })
  > ```
  > **Ba chi tiết quyết định, và người phỏng vấn sẽ hỏi từng cái:**
  > 1. `refreshing` phải bị xoá trong `.finally()`, không phải `.then()` — nếu refresh **thất bại**, promise phải được reset, nếu không mọi request sau đó treo vĩnh viễn trên một promise đã reject.
  > 2. `cfg._retried` chặn vòng lặp vô hạn: nếu endpoint `/auth/refresh` **cũng** trả 401 (refresh token hết hạn), không có cờ này thì interceptor gọi refresh cho chính lời gọi refresh → đệ quy vô hạn. Đây chính là chỗ L19 dạy ở `bridge` (5494) nhưng đoạn code chưa thể hiện.
  > 3. Refresh token phải nằm trong cookie `HttpOnly`, **không** trong `localStorage` — L19 nói đúng ở `naive` (5508) nhưng cần nối vào đoạn code.
  > **Khi nào cách sửa này vẫn hỏng:** nếu bạn mở nhiều tab, mỗi tab có một `refreshing` riêng, nên 5 tab vẫn sinh 5 lời gọi refresh và với xoay vòng token thì 4 lời gọi thất bại ⇒ cần `BroadcastChannel` hoặc lưu `refreshing` ở `SharedWorker`/service worker. Ngoài ra nếu access token sống 15 phút mà lưu trong memory và người dùng F5, token mất và phải refresh ngay khi tải trang ⇒ nên có một lời gọi refresh chủ động lúc khởi động app thay vì để 40 request cùng phát hiện 401.

### FINDING ADV-14
- **Topic / lesson / line:** L05 / G06 — S3 presigned URL và kiểm tra upload. Dòng 4797–4853 (L05), 3072–3097 (G06), 5552–5610 (L20).
- **Câu hỏi đặt ra:** "Presigned URL sống bao lâu, và ai đó lộ URL thì thiệt hại tối đa là bao nhiêu?"
- **Artifact cung cấp gì:** đây là nội dung mạnh nhất của file. L05 `mechanism` (4828) phân biệt ba ranh giới thời gian; L20 `rootCause` (5583) giải thích chính xác `Content-Length` là forbidden request header nên **không ký được kích thước trong presigned PUT** — một chi tiết đúng và hiếm; L20 `predict` (5567) hỏi đúng về ký `ContentType`.
- **Chuỗi lý luận đứt ở đâu:** artifact dạy rất kỹ **cái gì được ký thì được thực thi**, nhưng **không cho con số về hạn URL** và không lượng hoá bán kính thiệt hại. `attacks` (5595) nói hạn nên ngắn nhưng không có ngưỡng. Ở bậc 6 (TRADE-OFF), người học phải trả lời được "ngắn hơn thì được gì, mất gì" bằng số.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Hạn URL tối đa của SigV4 là 7 ngày** (604.800 giây) khi ký bằng credential dài hạn như IAM user, nhưng chỉ **tối đa bằng thời gian sống của credential tạm thời** khi ký bằng role — và credential của Lambda/STS thường sống **1 giờ**. Nghĩa là trong Lambda, đặt `ExpiresIn=86400` (một ngày) **sẽ lỗi ngay** vì vượt thời gian sống của credential. Đây là lỗi cấu hình kinh điển mà L20 `naiveCode` (5572) minh hoạ đúng (`ExpiresIn=86400`) nhưng không nói rõ **vì sao nó sai** trong ngữ cảnh Lambda.
  > **Bán kính thiệt hại có số:** một presigned PUT bị lộ cho phép ghi **một** object tại **một** key, trong khoảng còn hạn. Nếu key có UUID và tenant nhúng (như L05 khuyến nghị), thiệt hại tối đa là **ghi đè đúng một object của chính tenant đó**. Nếu key do client đặt (như `naiveCode` 5572), thiệt hại là **ghi đè bất kỳ object nào mà client đoán được tên** — với một tenant 10.000 tệp, đây là 10.000 mục tiêu.
  > **Chọn hạn theo mục đích, có số:** 5 phút cho upload tương tác (đủ cho mạng 3G chậm tải 5 MB — ở 200 kbps mất khoảng 200 giây, vậy **5 phút là quá sát**, nên dùng **15 phút**); 60 phút cho upload nhiều phần (multipart); 7 ngày **không bao giờ** dùng cho PUT. Đây là chỗ L20 `incident` (5561) kể đúng: người dùng 3G nhận URL sống 10 phút nhưng tới phút 11 mới PUT xong ⇒ **10 phút không đủ cho 5 MB trên 3G**, và con số này phải được nói ra.
  > **Thu hồi là hành động nặng:** không thu hồi riêng một URL được; phải gỡ quyền của danh tính đã ký, thu hồi phiên STS, hoặc vô hiệu hoá access key. `attacks` (5595) nói đúng điều này — nhưng cần thêm rằng vô hiệu hoá access key ảnh hưởng **mọi** URL do key đó ký, không chỉ cái bị lộ, nên đây là công cụ thô.

### FINDING ADV-15
- **Topic / lesson / line:** L01 / D01 — chuỗi request và latency budget. Dòng 4553–4612 (L01), 2134–2158 (D01).
- **Câu hỏi đặt ra:** "Một request đi từ trình duyệt tới database mất bao nhiêu mili giây, chia thế nào giữa các chặng?"
- **Artifact cung cấp gì:** L01 `incident` (4563) có số rất tốt: 200 request/giây, p99 từ 180 ms lên 4,2 giây, gần 200 rps vào endpoint đăng ký, ba lần thử tải ghi nhận 504. `timeline` (4576) có mốc H+0, H+4p, H+6p, H+20p, H+30p. D01 (2136) mô tả DNS, TCP/TLS, proxy, ứng dụng, database.
- **Chuỗi lý luận đứt ở đâu:** D01 mô tả **thứ tự** các chặng nhưng **không gán cho mỗi chặng một chi phí mili giây**, nên người học không có ngân sách độ trễ (latency budget) để nói câu "chặng nào đáng tối ưu". Câu hỏi production (bậc 8) "p99 của bạn bị tiêu ở đâu?" không có gì để trả lời.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Ngân sách độ trễ cho một request HTTPS đầu tiên, trong cùng Region, tổng khoảng 250–400 ms:**
  > | Chặng | Chi phí điển hình | Ghi chú |
  > |---|---|---|
  > | Phân giải DNS | 0–120 ms (cache miss), ~0 ms nếu đã cache | Cache theo TTL, thường đã có sẵn |
  > | Bắt tay TCP | 1 RTT ≈ 15–30 ms | Trong Region |
  > | Bắt tay TLS 1.3 | 1 RTT ≈ 15–30 ms | TLS 1.3 gộp còn 1 RTT; TLS 1.2 tốn 2 RTT |
  > | Gửi request → tới server | 1 RTT ≈ 15–30 ms | |
  > | Ứng dụng xử lý | 20–100 ms | Phần **bạn** kiểm soát |
  > | Truy vấn database | 1–20 ms | Trong cùng VPC |
  > | Trả response | 1 RTT ≈ 15–30 ms | |
  > **Kết luận dùng được trong phỏng vấn:** khoảng **100–200 ms** của mỗi request là chi phí mạng cố định mà bạn **không tối ưu được** (trừ khi dùng connection pooling ở tầng HTTP và CDN). Phần bạn thật sự kiểm soát là 20–100 ms xử lý cộng truy vấn. Nên khi p99 tăng, hướng đầu tiên **không phải** là tối ưu mạng mà là tìm chặng nào trong **phần xử lý** phình ra — đúng như L01 dạy.
  > **Ví dụ có số:** cùng endpoint, để keep-alive bật thì request thứ hai trở đi **bỏ được** ba RTT bắt tay (≈ 45–90 ms) trên tổng 250 ms ⇒ giảm khoảng 20–35% độ trễ p50 mà không đổi một dòng logic. Đây là tối ưu rẻ nhất và hay bị bỏ qua nhất.

---

## NHÓM 5 — CƠ CHẾ ĐƯỢC NÓI NHƯNG KHÔNG ĐƯỢC CHỨNG MINH BẰNG TIMELINE HOẶC CHUYỂN TRẠNG THÁI

### FINDING ADV-16
> **ĐÍNH CHÍNH (sau khi đo lại toàn bộ 131 câu bằng script — xem thêm PHỤ LỤC A).** Bản đầu của finding này ghi "nhiều câu P0/P1 nằm trong 71 câu thiếu `incident`". **Sai.** Đo lại: **cả 60 câu P0 đều có đủ bốn field `incident` + `askFirst` + `predict` + `anchor`.** 71 câu thiếu là **50 câu P1 và 21 câu P2**. Finding vẫn đứng, nhưng **severity hạ từ `critical` xuống `major`**, và trọng tâm đổi: vấn đề không phải "P0 bị bỏ trống" mà là **P1 bị bỏ trống hoàn toàn** — trong khi P1 là tầng đúng của câu hỏi "cho tôi ví dụ" và "cho tôi con số". Phần dưới đã sửa theo dữ liệu đúng.
- **Topic / lesson / line:** **71/131 câu thiếu toàn bộ bốn field `incident` + `askFirst` + `predict` + `anchor` cùng lúc.** Phân bố: **P1 = 50 câu, P2 = 21 câu, P0 = 0 câu.** Theo level: **L3 = 22 câu** (tầng sâu nhất), L2 = 41, L1 = 8. Theo nhóm: A=11, B=8, C=3, D=8, E=6, F=8, G=7, H=8, I=6, J=6.
- **Câu hỏi đặt ra:** "Cho tôi một tình huống cụ thể nơi điều này xảy ra, có mốc thời gian."
- **Artifact cung cấp gì:** 60 câu có `incident` với tình huống rất tốt (ví dụ G02 tại 2963: 15h40, quyền `s3:*`, 3.000 file báo cáo biến mất, khôi phục 4 tiếng). 71 câu còn lại **chỉ có `q` trừu tượng + `oral` + `deep`** — không có gì để người học hình dung hoặc để trả lời câu hỏi "cho ví dụ".
- **Chuỗi lý luận đứt ở đâu:** đây là finding về **tính không đồng đều của artifact**. `LESSONSARR` (22 bài) đạt chuẩn rất cao, 60 câu hỏi đạt chuẩn cao, nhưng **71 câu hỏi (54%) không có tình huống**. Vì người học luyện chủ yếu từ `QUESTIONS`, chất lượng trải nghiệm học **thấp hơn** chất lượng thật của artifact. Một người học chỉ luyện 131 câu này sẽ gặp chủ đề quan trọng (E08 ASGI/WSGI, F11 pooling, G12 VPC) ở dạng định nghĩa thuần.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:** với mỗi câu thiếu `incident`, thêm một tình huống có mốc thời gian và con số. Ví dụ cho **E08** (ASGI so với WSGI, dòng 2598):
  > **Tình huống:** 14h20, sau khi chuyển một endpoint từ `def` sang `async def`, mọi request vẫn trả 200 nhưng p99 của **toàn bộ** API đi từ 180 ms lên 3,1 giây. Nguyên nhân: trong `async def` có gọi một ORM **đồng bộ** (psycopg2). Lời gọi đó **chặn event loop**, mà event loop chỉ có một. Với 4 worker, hệ thống có 4 chỗ chạy song song — thay vì hàng nghìn. Một truy vấn chậm 200 ms làm **mọi** request khác phải chờ 200 ms, kể cả những request không hề chạm database.
  > **Số để so sánh:** cùng tải, `def` (đồng bộ) với 8 worker: mỗi worker là một tiến trình, chịu được 8 truy vấn chậm song song thì tắc. `async def` gọi driver **bất đồng bộ** (`asyncpg`): một event loop chịu được hàng nghìn kết nối đang chờ mà không chặn ai, vì lúc chờ mạng thì event loop đi làm việc khác.
  > **Cách phát hiện:** p99 tăng ở **mọi** endpoint cùng lúc, kể cả endpoint không liên quan — dấu hiệu event loop bị chặn. Sửa: dùng driver async, hoặc bọc lời gọi đồng bộ bằng `run_in_threadpool` của Starlette để nó chạy ở thread riêng thay vì chặn event loop.

### FINDING ADV-17
- **Topic / lesson / line:** L22 — feature end-to-end. Dòng 5679–5741. `mechanism` (5712), `failureModes` (5713).
- **Câu hỏi đặt ra:** "Ba chỗ hỏng của bạn có cùng một cách sửa không? Nếu không, tại sao không?"
- **Artifact cung cấp gì:** đây là bài mạnh nhất trong file. `incident` (5688) có 10.000 người dùng, 5 MB/tệp; `timeline` (5701) có mốc giây chính xác; `attacks` (5717) có 5 câu phản biện sắc, trong đó câu cuối hỏi đúng điều này và trả lời đúng ("Không, vì ba chỗ nằm ở ba ranh giới khác nhau").
- **Chuỗi lý luận đứt ở đâu:** bài **rất tốt** nhưng có một lỗ hổng cụ thể ở bậc 8 (PRODUCTION). `observe` (5716) liệt kê bốn tín hiệu **không có ngưỡng cảnh báo**. "Tỉ lệ hàng trên số lượt bấm" — vượt 1 thì cảnh báo ở mức nào? "Số hàng ở trạng thái chờ quá hạn" — quá hạn là bao lâu? Không có số thì không dựng được alarm, và artifact dạy ở D01/H10 rằng alarm phải có ngưỡng.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Ngưỡng cảnh báo cụ thể cho bốn tín hiệu của L22:**
  > - `tỉ lệ hàng / số lượt bấm > 1,01` trong 15 phút → cảnh báo warning (chống trùng đang hở). `> 1,1` → critical.
  > - `số hàng PENDING quá hạn > 0` với ngưỡng quá hạn = **2 × thời gian xác nhận tối đa** (nếu xác nhận tối đa là 30 giây, quá hạn là 60 giây) → cảnh báo, vì đây là tệp thật đang nằm trong bucket mà hệ thống không biết.
  > - `ApproximateAgeOfOldestMessage > 3 × p99 thời gian xử lý` → cảnh báo. Với p99 = 45 giây, ngưỡng là **135 giây**. L21 (5624) kể độ tuổi nhảy lên 40 phút mà không ai biết — nghĩa là **không có alarm nào**, và đây là bài học phải biến thành con số.
  > - `số lời gọi dịch vụ ngoài / số message > 1,05` trong 1 giờ → cảnh báo (hiệu ứng bên ngoài đang chạy nhiều lần).
  > **Nguyên tắc chọn ngưỡng:** đặt ở **3× giá trị bình thường**, không đặt ở giá trị bình thường, để tránh báo động giả — và phải ghi lại giá trị nền (baseline) trong tuần đầu tiên trước khi bật alarm.

---

## NHÓM 6 — CHỖ MỘT CÂU HỎI NỐI TIẾP DUY NHẤT LÀM SẬP CÂU TRẢ LỜI

### FINDING ADV-18
- **Topic / lesson / line:** B03 — ép kiểu, truthy/falsy, `null` và `undefined`. Dòng 1481–1516.
- **Câu hỏi đặt ra (câu nối tiếp giết người):** "Bạn nói `==` ép kiểu. Vậy `[] == false` và `[] == ![]` cho ra gì, và tại sao hai kết quả đó lại 'đúng' theo cùng một bộ luật?"
- **Artifact cung cấp gì:** `deep` giải thích `==` ép kiểu, `===` không, danh sách truthy/falsy, `null == undefined` là `true` còn `null === undefined` là `false`.
- **Chuỗi lý luận đứt ở đâu:** đây là câu hỏi kinh điển mà người phỏng vấn dùng để phân biệt "thuộc bảng" và "hiểu thuật toán". Artifact dạy **kết quả** của phép so sánh nhưng không dạy **thuật toán ép kiểu** (abstract equality comparison) đủ để người học **suy ra** một trường hợp chưa từng thấy. Nếu chỉ học bảng, người học sập ngay khi gặp tổ hợp mới.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:**
  > **Thuật toán `==` theo thứ tự, và đây là thứ để suy ra mọi trường hợp:**
  > 1. Cùng kiểu → so sánh như `===` (trừ `NaN != NaN`).
  > 2. `null == undefined` → **`true`**; và **không** `null`/`undefined` bằng bất kỳ giá trị nào khác.
  > 3. **Số so với chuỗi** → chuỗi đổi thành số.
  > 4. **Boolean so với bất kỳ** → boolean đổi thành số (`true` → 1, `false` → 0), **rồi quay lại bước 1**.
  > 5. **Object so với primitive** → object đổi bằng `ToPrimitive` (gọi `valueOf`, rồi `toString`), **rồi quay lại bước 1**.
  > **Suy ra `[] == false`:**
  > - Bước 4: `false` → `0`. Còn `[] == 0`.
  > - Bước 5: `[]` → `ToPrimitive` → `""` (mảng rỗng thành chuỗi rỗng). Còn `"" == 0`.
  > - Bước 3: `""` → `0`. Còn `0 == 0` → **`true`**.
  > **Suy ra `[] == ![]`:**
  > - `![]` là `false` (mảng là truthy). Còn `[] == false`.
  > - Đúng đường đi trên → **`true`**.
  > **Kết luận để nói:** "Một mảng rỗng bằng chính phủ định của nó. Điều này không phải lỗi của JavaScript mà là hệ quả của một thuật toán ép kiểu có thứ tự. Từ đó rút ra quy tắc thực dụng: **luôn dùng `===`**, và chỉ dùng `==` cho đúng một trường hợp `x == null` để bắt cả `null` lẫn `undefined` trong một lần kiểm tra — đó là trường hợp duy nhất mà `==` diễn đạt ý định gọn hơn `===`."

### FINDING ADV-19
- **Topic / lesson / line:** B10 — `unknown`, `any`, `never`, nullability. Dòng 1714–1741.
- **Câu hỏi đặt ra (câu nối tiếp giết người):** "TypeScript kiểm tra kiểu lúc chạy chứ? Nếu không, thì `as User` khác gì `JSON.parse` một cách trung thực — và tại sao bạn vẫn dùng nó?"
- **Artifact cung cấp gì:** `deep` phân biệt `any` (tắt kiểm tra) với `unknown` (phải thu hẹp trước khi dùng), và nói `as` là ép kiểu **không kiểm tra lúc chạy**. Topic tại dòng 1716 có ghi rõ "ép kiểu không kiểm tra lúc chạy".
- **Chuỗi lý luận đứt ở đâu:** artifact nói đúng sự thật quan trọng nhất nhưng **không đẩy tới hệ quả vận hành**: nếu `as` không kiểm tra gì, thì **ranh giới tin cậy thật nằm ở đâu** trong một app Vue gọi API? Người học biết "TS không kiểm tra lúc chạy" nhưng không suy ra được "vậy tôi phải validate ở đâu". Đây là chỗ kiến thức đúng nhưng không dẫn tới hành động.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **TypeScript biến mất hoàn toàn khi build — không còn một dòng kiểm tra nào lúc chạy.** Nghĩa là mọi dữ liệu đi qua ranh giới mạng (`fetch`) đều **không được kiểm tra**, dù bạn đã khai `User`.
  > ```ts
  > // SAI: niềm tin không có cơ sở. TS im lặng, runtime không kiểm tra.
  > const user = (await res.json()) as User
  > console.log(user.name.toUpperCase())   // sập nếu API trả { name: null }
  > ```
  > **Ranh giới tin cậy nằm đúng ở chỗ dữ liệu vào**, và cách đúng là thu hẹp bằng một schema thật:
  > ```ts
  > // DUNG: kiem tra that, va thu hep kieu tu ket qua kiem tra.
  > const UserSchema = z.object({ id: z.number(), name: z.string().min(1) })
  > type User = z.infer<typeof UserSchema>          // kieu suy ra TU schema, khong khai tay
  > const user = UserSchema.parse(await res.json()) // nem loi neu du lieu sai
  > ```
  > **Vì sao `z.infer` quan trọng hơn `as`:** với `as`, bạn có **hai nguồn sự thật** (khai `type` bằng tay + hình dạng thật của API) và chúng lệch nhau trong im lặng. Với `z.infer`, chỉ có **một nguồn** — schema — nên type và kiểm tra lúc chạy không thể lệch nhau. Đây là cùng một lập luận mà L18 (5459) dùng cho OpenAPI ở phía Python: schema sinh ra từ model nên handler và hợp đồng không lệch.
  > **Quy tắc để nói trong phỏng vấn:** "`as` chỉ hợp lệ khi tôi **đã** kiểm tra bằng cách khác và đang nói cho compiler biết một điều tôi biết chắc — ví dụ sau một `if ('name' in obj)`. Còn ở ranh giới mạng, tôi validate bằng schema vì đó là chỗ duy nhất tôi không kiểm soát dữ liệu."

### FINDING ADV-20
- **Topic / lesson / line:** C02 / C03 — `ref`/`reactive` và destructuring mất phản ứng. Dòng 1886–1931, và L12 tại 4931–5011.
- **Câu hỏi đặt ra (câu nối tiếp giết người):** "Bạn nói `reactive` dùng `Proxy`. Vậy tại sao `reactive` **không** dùng được cho kiểu nguyên thuỷ, và cái gì thực sự bị mất khi tôi `const { name } = state`?"
- **Artifact cung cấp gì:** phần này rất mạnh. C03 `deep` (1923) giải thích `Proxy` chặn đọc/ghi; `followups` (1926) giải thích `toRefs` giữ getter/setter trỏ về object gốc; L12 `predict` (4948) hỏi đúng "effect chạy lại mấy lần" với đáp án xuất sắc (một lần, vì trigger đánh dấu bẩn và scheduler gộp trong microtask).
- **Chuỗi lý luận đứt ở đâu:** artifact giải thích **hệ quả** rất tốt nhưng ở chỗ `reactive` không nhận nguyên thuỷ, lý do được nêu ngắn (`deep` 1899: "reactive chỉ nhận object") mà **không nối tới cơ chế `Proxy`**. Người học thuộc "reactive chỉ nhận object" như một quy tắc rời, không suy ra được từ nguyên lý. Khi người phỏng vấn hỏi "tại sao", câu trả lời sẽ là "vì nó chỉ nhận object" — vòng tròn.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **`Proxy` bọc một object, và nó không thể bọc một số.** `new Proxy(5, handler)` ném `TypeError: Cannot create proxy with a non-object as target`. Đó là **toàn bộ** lý do `reactive(5)` không chạy — không phải một quy ước của Vue mà là một giới hạn của chính `Proxy` trong JavaScript. Vue chọn `ref` cho nguyên thuỷ vì cần một **object bọc ngoài** để đặt getter/setter lên thuộc tính `value`.
  > **Cái mất khi destructure, nói theo cơ chế:** `const { name } = state` chạy trap `get` của `Proxy` **đúng một lần** và trả về một **chuỗi**. Từ đó biến `name` là một ô nhớ độc lập, không có `Proxy` nào bao quanh nó. Khi bạn gán `name = "Bình"`, JavaScript ghi vào ô nhớ đó — **không có trap `set` nào chạy**, nên không có `trigger`, nên không có effect nào được đánh dấu bẩn. Giao diện đứng yên và **không có cảnh báo nào**.
  > **Ví dụ đối chiếu có số:** một bảng 500 dòng, mỗi lần lọc tốn 2 ms. Dùng `computed` có cache: 500 dòng chỉ lọc lại khi phụ thuộc đổi. Dùng hàm thường gọi trong template: lọc lại **mỗi lần render**, và với 10 lần render trong một tương tác, đó là 20 ms phí — đủ để thấy giật ở 60 fps (ngân sách một frame là 16,7 ms). Đây là lý do `computed` tồn tại và con số khiến lập luận có sức nặng.

### FINDING ADV-21
- **Topic / lesson / line:** A16 — lời gọi chặn trong async. Dòng 1354–1369. Và A18 (1389), A14 (1317).
- **Câu hỏi đặt ra (câu nối tiếp giết người):** "Bạn nói đừng gọi hàm chặn trong `async`. Vậy nếu tôi chạy 100 tác vụ `asyncio` đồng thời mà mỗi tác vụ chặn 50 ms, tổng thời gian là bao nhiêu? Và `semaphore` sửa được gì?"
- **Artifact cung cấp gì:** A16 `deep` nói lời gọi chặn làm nghẽn event loop và nên dùng `run_in_executor` hoặc process pool. A18 so sánh thread/process/asyncio để chọn mô hình.
- **Chuỗi lý luận đứt ở đâu:** đây là chỗ một phép tính số học làm sáng tỏ toàn bộ lập luận, và artifact **có đủ mảnh nhưng không ghép lại**. Người học không phân biệt được "chặn event loop" (tuần tự hoá **mọi** tác vụ) với "giới hạn đồng thời" (chỉ giới hạn số tác vụ). Đây là hai vấn đề khác nhau với hai cách sửa khác nhau, và bậc 7 của thang hỏi đúng chỗ này.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Phép tính quyết định, và đây là câu trả lời cho bậc 7:**
  > - **Chặn event loop** (ví dụ gọi `requests.get` trong `async def`, mỗi lần mất 50 ms): 100 tác vụ chạy **tuần tự** vì mỗi tác vụ giữ event loop suốt 50 ms. Tổng = 100 × 50 ms = **5.000 ms = 5 giây**. Số worker không cứu được, vì mỗi worker chỉ có một event loop.
  > - **Cùng việc đó, nhưng gọi bất đồng bộ thật** (`httpx.AsyncClient`): 100 tác vụ chờ mạng **chồng lên nhau**. Tổng ≈ thời gian **chậm nhất** cộng chi phí chuyển ngữ cảnh ≈ **50–120 ms**. Nhanh hơn **khoảng 40–100 lần**.
  > - **Chặn trong `def`** (đồng bộ, FastAPI đẩy sang threadpool): chạy song song được, nhưng threadpool mặc định **40 thread**, nên 100 tác vụ xếp thành 3 lô ⇒ 3 × 50 = **150 ms**. Vẫn nhanh hơn 5 giây rất nhiều, và đây là **cách sửa rẻ nhất không phải viết lại code**: đổi `async def` thành `def` để FastAPI tự chạy trong threadpool.
  > **`Semaphore` sửa một vấn đề khác:** nó giới hạn **số tác vụ đồng thời**, không sửa việc chặn. Dùng khi bạn gọi một dịch vụ ngoài và không muốn mở 10.000 kết nối:
  > ```python
  > sem = asyncio.Semaphore(50)   # toi da 50 request cung luc
  > async with sem:
  >     return await client.get(url)
  > ```
  > Với 1.000 URL và mỗi request 100 ms: không có semaphore ⇒ 1.000 kết nối cùng lúc, dịch vụ ngoài rate-limit và trả 429. Có semaphore 50 ⇒ 20 lô × 100 ms = **2 giây**, dự đoán được và không bị chặn. **Phân biệt để nói rõ:** chặn event loop là vấn đề **đúng/sai**; giới hạn đồng thời là vấn đề **đánh đổi giữa tốc độ và áp lực lên tài nguyên**.

### FINDING ADV-22
- **Topic / lesson / line:** A05 — closure muộn, biến vòng lặp. Dòng 1142–1163.
- **Câu hỏi đặt ra (câu nối tiếp giết người):** "Bạn nói comprehension không sửa được late binding. Vậy tại sao Python 2 thì không cần tham số mặc định, và tại sao bản thân Python cũng có lúc bị?"
- **Artifact cung cấp gì:** phần này **xuất sắc**. `deep` (1155) nói rõ *"comprehension trong Python 3 có phạm vi riêng, nhưng cả vòng lặp của nó vẫn dùng chung một ô nhớ, nên lambda tạo bên trong vẫn late-bind y hệt. Phạm vi riêng và ô nhớ riêng cho từng vòng là hai chuyện khác nhau — đây là chỗ rất nhiều tài liệu nói sai."* Đây là nội dung chất lượng cao và chính xác.
- **Chuỗi lý luận đứt ở đâu:** bài dạy rất đúng **cách sửa** nhưng thiếu **chi phí của cách sửa** và thiếu **cách kiểm tra tự động**. Ở bậc 6 và bậc 8, người học cần biết tham số mặc định trong lambda có nhược điểm gì trong code hiện đại, và viết test thế nào để bắt lỗi này. `selfcheck` (1160) có nhắc "tách bước tạo khỏi bước gọi" nhưng không có code test.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Chi phí của `lambda n=i: n`:** nó hoạt động, nhưng nó giấu một tham số vào chữ ký hàm. Với type checker (mypy, pyright) hàm thu được có một tham số **không có trong ý định thiết kế**, và với người đọc code, `lambda n=i: n` trông như một lỗi đánh máy. Cách hiện đại và rõ ý định hơn là **`functools.partial`** hoặc **factory function**:
  > ```python
  > from functools import partial
  > handlers = [partial(handle_click, i) for i in range(3)]   # ro y dinh hon
  > ```
  > **Test bắt được lỗi này, và đây là thứ artifact thiếu:** lỗi late binding **không lộ ra** nếu bạn gọi hàm ngay trong vòng lặp. Test đúng phải **tách hai bước**:
  > ```python
  > def test_late_binding():
  >     # Buoc 1: TAO het closure, chua goi.
  >     fns = [lambda: i for i in range(3)]
  >     # Buoc 2: GOI sau khi vong lap da xong. Day moi la luc loi lo ra.
  >     assert [f() for f in fns] == [2, 2, 2]        # the hien dung hanh vi that
  >     # Va ban sua dung:
  >     fns2 = [lambda n=i: n for i in range(3)]
  >     assert [f() for f in fns2] == [0, 1, 2]
  > ```
  > **Điểm cần nói:** test đầu tiên khẳng định **hành vi sai** là một quyết định có chủ ý — nó ghim hành vi hiện tại của ngôn ngữ để một lần nâng cấp Python không âm thầm đổi kết quả, và nó tài liệu hoá cái bẫy cho người đọc sau.
  > **Một chỗ Python "cũng bị" tương tự:** mặc định của tham số (A04, dòng 1118) và biến vòng lặp ở đây là **cùng một cơ chế** — một ô nhớ được tạo một lần và chia sẻ. Nhận ra chúng là một là dấu hiệu hiểu cơ chế chứ không thuộc hai trường hợp riêng lẻ. Artifact để hai câu A04 và A05 cạnh nhau nhưng **không nối chúng lại** thành một nguyên lý.

### FINDING ADV-23
- **Topic / lesson / line:** H06 — tín hiệu và graceful shutdown. Dòng 3483–3508. `attacks` không có.
- **Câu hỏi đặt ra:** "Bạn sửa PID 1 rồi. Deploy vẫn mất request đang bay. Kiểm tra gì tiếp, và cho tôi con số timeout?"
- **Artifact cung cấp gì:** `incident` (3488) có số rất tốt: deploy 9h00 mất 10 giây, log `Stopping container api-3 ... timeout`, rồi Docker gửi `SIGKILL`. `predict` (3493) hỏi đúng về shell form. `followups` (3503) hỏi đúng "sửa PID 1 rồi mà vẫn mất request thì kiểm tra gì".
- **Chuỗi lý luận đứt ở đâu:** bài chẩn đoán đúng **nguyên nhân** nhưng không cho **trình tự số học của shutdown**: Docker chờ bao lâu trước `SIGKILL`, và làm sao ứng dụng biết phải dừng trong bao lâu. Đây là chỗ `followups` hỏi đúng câu hỏi mà artifact không trả lời được bằng số.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Trình tự shutdown có ba con số, và chúng phải khớp nhau:**
  > 1. `docker stop` (và Kubernetes) gửi `SIGTERM`, rồi chờ **10 giây** mặc định trước khi gửi `SIGKILL`. Trong Compose đặt bằng `stop_grace_period: 30s`; trong Kubernetes đặt bằng `terminationGracePeriodSeconds: 30`.
  > 2. **Ứng dụng phải tự đặt hạn nhỏ hơn con số đó** — ví dụ Gunicorn `graceful_timeout=25` khi grace period là 30 giây. Nếu ứng dụng chờ lâu hơn grace period, nó bị `SIGKILL` giữa chừng và mất request — đúng triệu chứng `incident` kể.
  > 3. **Load balancer phải ngừng gửi request mới TRƯỚC khi gửi `SIGTERM`.** Đây là mắt xích hay bị bỏ nhất. Trong Kubernetes, thêm `preStop: exec: command: ["sleep", "5"]` để endpoint bị gỡ khỏi Service trước khi tín hiệu tới, nếu không vẫn có request mới bay vào trong lúc ứng dụng đang tắt.
  > **Trình tự đúng để nói:** gỡ khỏi load balancer (5 giây) → `SIGTERM` tới ứng dụng → ứng dụng ngừng nhận cổng mới, chờ request đang chạy xong (tối đa 25 giây) → thoát sạch. Tổng **30 giây**, khớp với grace period. Nếu bất kỳ con số nào lệch, bạn mất request mà **không có log nào** ghi lại — vì request bị `SIGKILL` thì không kịp ghi gì.

### FINDING ADV-24
- **Topic / lesson / line:** D10 — timeout, retry, backoff, jitter. Dòng 2343–2357.
- **Câu hỏi đặt ra:** "Retry ba lần với backoff không jitter, trong 100 client đồng thời, tạo ra bao nhiêu request ở đỉnh?"
- **Artifact cung cấp gì:** `deep` nói phải có timeout, retry, backoff và **jitter**, và cảnh báo retry có thể tạo bão.
- **Chuỗi lý luận đứt ở đâu:** *"phải có jitter"* được nêu như một quy tắc, **không có phép tính** cho thấy không có jitter thì tệ đến mức nào. Đây chính xác là dạng "trade-offs asserted with no arithmetic" — và là một trong những chỗ dễ bị đào nhất vì jitter nghe như chi tiết vụn.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:**
  > **Hiệu ứng đồng bộ hoá (thundering herd), có số:**
  > Giả sử một dịch vụ ngoài bị chậm và 100 client cùng nhận lỗi timeout **cùng lúc** (vì chúng cùng bắt đầu cùng lúc).
  > - **Backoff không jitter**, `delay = 2^n` giây: cả 100 client cùng chờ **1 giây**, rồi cùng gửi lại **100 request trong một khoảng vài mili giây**. Lần hai cùng thất bại, cả 100 cùng chờ **2 giây**, rồi lại **100 request cùng lúc**. Dịch vụ ngoài vẫn đang quá tải, nên đỉnh tải lặp lại y hệt ba lần. Không có lần nào dịch vụ kịp hồi.
  > - **Backoff có jitter đầy đủ**, `delay = random(0, 2^n)`: 100 client rải đều trong cửa sổ 0–1 giây, 0–2 giây, 0–4 giây. Ở mỗi cửa sổ, tải đỉnh giảm từ 100 request xuống còn khoảng **5–15 request tức thời** — giảm khoảng **7–20 lần** ở đỉnh.
  > **Con số quyết định:** không jitter, xác suất hai client gửi lại trong cùng 10 ms là **rất cao** (gần như chắc chắn); có jitter đầy đủ trong cửa sổ 1 giây, xác suất hai client rơi vào cùng 10 ms khoảng **1%**. Đây là toàn bộ giá trị của jitter: nó **phá vỡ sự đồng bộ** mà không cần giảm số lần retry.
  > **Ba con số khác phải khớp:** timeout mỗi lần gọi < tổng ngân sách của request (ví dụ timeout 2 giây, ngân sách 8 giây ⇒ tối đa 3 lần thử); và **retry chỉ áp dụng cho lỗi thử lại được** — 500, 502, 503, 504, timeout, lỗi kết nối. **Không** retry 400, 401, 403, 404, 409, 422: đó là lỗi quyết định, retry chỉ nhân tải lên mà không bao giờ thành công.
  > **Cạm bẫy hay bị hỏi tiếp:** retry ở **nhiều tầng cùng lúc** nhân số lần gọi theo cấp số nhân. Nếu client retry 3 lần, gateway retry 2 lần, và SDK dịch vụ retry 2 lần, một request của người dùng có thể thành 3 × 2 × 2 = **12 lần gọi**. Quy tắc: chỉ retry ở **một tầng**, hoặc dùng ngân sách retry chia sẻ giữa các tầng.

### FINDING ADV-25
- **Topic / lesson / line:** D12 — rate limiting, caching, ETag, Cache-Control. Dòng 2377–2391.
- **Câu hỏi đặt ra:** "Đặt rate limit 100 request/phút cho mỗi user. Với 10.000 user, đó có nghĩa là hệ thống chịu được 1 triệu request/phút không?"
- **Artifact cung cấp gì:** `deep` mô tả rate limiting và caching, ETag và `Cache-Control` như các cơ chế đúng.
- **Chuỗi lý luận đứt ở đâu:** rate limit **mỗi người dùng** và **sức chịu của hệ thống** là hai chuyện khác nhau, và artifact không phân biệt. Người học có thể nói được "đặt rate limit 100/phút" mà không nhận ra rằng con số đó **không** bảo vệ hệ thống khỏi một đợt tấn công phân tán. Đây là chỗ một câu hỏi nối tiếp duy nhất làm sập câu trả lời, và cũng là chỗ bậc 7 của thang nhắm vào.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Rate limit theo người dùng KHÔNG phải giới hạn sức chịu của hệ thống.** Ba lớp phải phân biệt:
  > 1. **Theo người dùng** (100 request/phút): chống một user vô tình hoặc cố ý spam. Với 10.000 user, **trần lý thuyết** là 1.000.000 request/phút — nhưng đó là trần của **giả định mọi người dùng đều đặn**, không phải trần hạ tầng.
  > 2. **Toàn cục** (ví dụ 50.000 request/phút cho cả hệ thống): đây mới là con số bảo vệ database. Không có lớp này, một đợt tấn công từ 10.000 IP khác nhau — mỗi IP dưới hạn mức — vẫn **xuyên thủng** hệ thống.
  > 3. **Theo tài nguyên đắt** (ví dụ endpoint tìm kiếm nặng: 200 request/phút **toàn cục**): bảo vệ đúng chỗ dễ chết nhất.
  > **Ví dụ có số:** database chịu được 800 truy vấn/giây. Một endpoint tìm kiếm tốn 3 truy vấn. Trần an toàn là 800/3 ≈ **266 request/giây** cho riêng endpoint đó. Nếu chỉ có rate limit theo user (100/phút ≈ 1,7 request/giây mỗi người), chỉ cần **160 người dùng** hoạt động đồng thời là chạm trần. Nghĩa là rate limit theo user **không** bảo vệ được gì ở đây — con số đúng phải là giới hạn toàn cục theo endpoint.
  > **Thuật toán và cái giá:** fixed window đơn giản nhưng cho phép **gấp đôi** lưu lượng ở ranh giới cửa sổ (100 request ở giây 59 cộng 100 request ở giây 60 = 200 trong hai giây). Token bucket cho phép burst có kiểm soát và mượt hơn, tốn thêm bộ nhớ để giữ trạng thái bucket cho mỗi key. Với 1 triệu key, đó là 1 triệu bucket cần lưu — nên phải dùng Redis, và **độ trễ của Redis** trở thành một phần độ trễ của mọi request.
  > **Cấu hình cache phải thuộc:** `Cache-Control: public, max-age=3600` cho dữ liệu công khai; `private, no-store` cho dữ liệu người dùng; `ETag` cộng `If-None-Match` cho **304** tiết kiệm băng thông nhưng **không** tiết kiệm được truy vấn database nếu server vẫn phải xử lý để tính ETag.

---

## NHÓM 7 — BÀI HỌC DÀY NHƯNG KHÔNG CÓ ĐƯỜNG TỪ BÀI HỌC SANG CÂU HỎI

### FINDING ADV-26
- **Topic / lesson / line:** Liên kết `qids` giữa `LESSONSARR` và `QUESTIONS`. Ví dụ L05 `qids` tại dòng 4852: `['G06', 'G08', 'G09']`; L12 `qids` tại 5009: `['C01','C02','C03']`; L22 `qids` tại 5739: `['E04','G07','C11','G03']`.
- **Câu hỏi đặt ra:** "Bài này dạy tôi đến cấp độ bài học; nhưng câu hỏi tôi phải luyện có cùng cấp độ đó không?"
- **Artifact cung cấp gì:** mỗi bài có `qids` trỏ tới các câu hỏi. L05 và L20 (bài mạnh nhất về presigned URL) trỏ tới G06, G08, G09, C11, G03, E04.
- **Chuỗi lý luận đứt ở đâu:** có một **khoảng lệch cấp độ có hệ thống**. Ví dụ cụ thể và kiểm chứng được: L20 `rootCause` (5583) dạy chi tiết rằng `Content-Length` là **forbidden request header** nên không ký được kích thước trong presigned PUT, và `alternatives` (5588) dạy presigned **POST** với `content-length-range` như giải pháp. Nhưng câu hỏi G06 (3072–3097) — câu mà bài này trỏ tới — **không chứa** chi tiết đó. Người học đọc bài L20 thì hiểu, nhưng khi luyện câu G06 thì không có cơ hội nói ra, và **không có `attacks`** ở G06 để bị thử.
- **Chuỗi lý luận đứt ở đâu (diễn đạt lại cho rõ):** `qids` nối bài học với câu hỏi về **chủ đề**, không nối về **độ sâu**. Kết quả là 22 bài học chứa kiến thức cấp senior nhưng không có câu hỏi nào kiểm tra người học ở cấp đó. Kiến thức có trong file mà **không thể luyện ra**.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:** chuyển các chi tiết cấp senior từ bài học **vào** các `attacks` và `followups` của câu hỏi tương ứng. Với G06 (dòng 3072), thêm:
  > **Attack:** "Bạn muốn chặn người dùng đẩy lên tệp 5 GB. Vì sao bạn không ký kích thước vào presigned URL?"
  > **Đáp án mẫu (lấy từ L20 nhưng phải nằm ở đây):** "Vì `Content-Length` là **forbidden request header** — trình duyệt không cho JavaScript đặt nó, nó tự tính từ body. Nên tôi không thể dùng chữ ký để ràng buộc kích thước theo cách người dùng **tuân theo được**. Hai cách đúng: **(1)** dùng presigned **POST** với policy chứa điều kiện `["content-length-range", 0, 5242880]` — S3 từ chối ngay tại tầng lưu trữ, nhưng client phải dựng form nhiều phần thay vì một lệnh PUT, và không dùng được cho multipart upload; **(2)** dùng presigned PUT rồi kiểm tra sau bằng `head_object` lấy `ContentLength`, và xoá nếu vượt hạn mức — cách này chấp nhận một khoảng thời gian tệp quá lớn **tồn tại thật** trong bucket, nên bắt buộc phải có tiến trình dọn, với khoảng chờ **dài hơn** thời gian xác nhận tối đa để không xoá nhầm tệp đang trên đường tới."

### FINDING ADV-27
- **Topic / lesson / line:** `QUIZ` (QZ01–QZ28), từ dòng 4111. So sánh với `QUESTIONS`.
- **Câu hỏi đặt ra:** "Trắc nghiệm này kiểm tra tôi nhớ hay hiểu?"
- **Artifact cung cấp gì:** 28 câu trắc nghiệm, mỗi câu 4 lựa chọn, 1 đáp án đúng, có `explain`. Ví dụ QZ01 (4116) về mutable default, QZ02 (4128) về GIL, QZ03 (4140) là câu tình huống có số (3 giây/ảnh, CPU 8 nhân dưới 20%).
- **Chuỗi lý luận đứt ở đâu:** đa số QZ là **nhận diện định nghĩa đúng**, tức kiểm tra **nhớ**, không kiểm tra **suy luận**. QZ01 chỉ cần nhớ "đánh giá một lần lúc def" — trong khi `QUESTIONS` A04 (1118) đã dạy sâu hơn nhiều. Nghĩa là quiz **thấp hơn** cả bài học lẫn câu hỏi, và nó tạo cảm giác tiến bộ giả: người học làm đúng 28/28 rồi tự tin, trong khi chưa từng bị hỏi một câu cần suy luận.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:** thêm các lựa chọn **sai nhưng hợp lý** — tức lỗi hiểu sai phổ biến — thay vì các lựa chọn sai hiển nhiên. Ví dụ cho QZ01 hiện tại, ba lựa chọn nhiễu là "list được cache lại", "biến toàn cục bị tái sử dụng", "garbage collector giữ lại" — cả ba đều **vô lý ngay khi đọc**. Nên thay bằng các hiểu nhầm **thật**:
  > - "Vì mặc định chỉ áp dụng cho lần gọi đầu tiên, các lần sau Python sao chép nông giá trị mặc định" — **sai nhưng rất hợp lý**, người học hay nghĩ vậy.
  > - "Vì `def` là câu lệnh chạy một lần nhưng biến `tags` bị đưa vào `co_consts` nên được chia sẻ" — sai, nhưng đúng một nửa (dạy ở `deep` 1131 rằng nó nằm trong `__defaults__` **chứ không phải** `co_consts`), nên nó kiểm tra đúng chi tiết khó.
  > - "Vì Python không tạo lại đối tượng mặc định trừ khi hàm được gọi bằng keyword argument" — sai theo cách nghe có lý về cơ chế.
  > **Nguyên tắc:** lựa chọn nhiễu phải là **hệ quả của một hiểu nhầm cụ thể**, không phải một câu vô nghĩa. Một quiz chỉ hữu ích khi người học **phải chọn giữa hai điều đều nghe đúng**.

---

## NHÓM 8 — CHỖ KHÔNG CÓ GÌ ĐỂ NÓI (ĐỊNH NGHĨA TRƯỚC ĐỘNG CƠ, Ở CẤP CÂU HỎI)

### FINDING ADV-28
- **Topic / lesson / line:** D01 — chu trình request từ trình duyệt tới server. Dòng 2134–2158. `code: null`, không có `incident`, không có `predict`.
- **Câu hỏi đặt ra:** "Nếu p99 tăng gấp ba, bạn khoanh vùng ở chặng nào trước, và bằng công cụ gì?"
- **Artifact cung cấp gì:** `oral` và `deep` liệt kê đúng thứ tự DNS → TCP → TLS → proxy → ứng dụng → database. Đây là **danh sách**, không phải **công cụ chẩn đoán**.
- **Chuỗi lý luận đứt ở đâu:** người học thuộc **thứ tự các chặng** nhưng không có **cách đo từng chặng**. Ở bậc 8 (PRODUCTION), câu hỏi "làm sao bạn biết độ trễ nằm ở DNS hay ở database?" không có câu trả lời trong artifact. Đây là dạng finding trung tâm của brief: *"definitions stated before motivation"* — định nghĩa chuỗi request được đặt trước, và động cơ (chẩn đoán nó) không bao giờ được đưa ra.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Đo từng chặng, có công cụ cụ thể:**
  > - **DNS:** `dig api.example.com +stats` — nhìn dòng `Query time`. Nếu ~0 ms thì đã cache; nếu 80–120 ms thì cold cache. Trên trình duyệt: DevTools → Network → chọn request → tab **Timing** → mục "DNS Lookup".
  > - **TCP + TLS:** DevTools → Network → Timing → "Initial connection" (TCP) và "SSL" (TLS). `curl -w "@-" -o /dev/null -s https://api.example.com -w 'dns=%{time_namelookup} conn=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n'`
  > - **Ứng dụng:** `time_starttransfer − time_appconnect` = thời gian server xử lý. Đây là con số **bạn** kiểm soát.
  > - **Database:** trong log ứng dụng, ghi thời gian từng truy vấn. Hoặc `pg_stat_statements` để tìm truy vấn tốn nhất: `SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;`
  > **Ví dụ đọc số:** `dns=0.001 conn=0.018 tls=0.045 ttfb=0.310 total=0.315`. Suy ra: mạng cố định = 45 ms (14%); server xử lý = 315 − 45 = **270 ms (86%)**. Kết luận: đừng tối ưu mạng, tìm trong 270 ms đó. Nếu ngược lại `ttfb − tls` chỉ 30 ms mà total 315 ms thì vấn đề nằm ở **truyền response** — tức kích thước payload hoặc băng thông, không phải server.
  > **Chỉ số phải theo dõi trong production:** p50/p95/p99 tách theo **từng chặng**, không phải một p99 tổng — vì p99 tổng tăng mà mọi tầng "xanh" chính là dấu hiệu đã dạy ở L01 (4563).

### FINDING ADV-29
- **Topic / lesson / line:** G12 — VPC, subnet, security group. Dòng 3231–3250. `code: null`, không `incident`, không `predict`, không `attacks`.
- **Câu hỏi đặt ra:** "Lambda trong VPC không gọi được API ngoài internet. Tại sao, và bạn chẩn đoán bằng gì?"
- **Artifact cung cấp gì:** `deep` giải thích public/private subnet, security group, NAT gateway.
- **Chuỗi lý luận đứt ở đâu:** VPC là chủ đề mà **mọi** triệu chứng đều giống nhau và mọi nguyên nhân đều khác nhau — mất mạng hoàn toàn, timeout có kiểm soát, từ chối tức thời. Artifact dạy **thành phần** nhưng không dạy **cây chẩn đoán phân biệt triệu chứng**. Đây là chỗ bậc 8 (PRODUCTION) trống hoàn toàn.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Ba triệu chứng, ba nguyên nhân, phân biệt bằng thời gian chờ:**
  > | Triệu chứng | Nguyên nhân | Sửa |
  > |---|---|---|
  > | **Timeout sau đúng 1–2 giây** | Không có route ra internet: private subnet thiếu NAT Gateway, hoặc route table thiếu `0.0.0.0/0` | Thêm NAT Gateway vào public subnet, thêm route trong private route table |
  > | **Timeout sau 30–120 giây** (rất lâu) | Security group chặn **chiều ra** (outbound). SG có stateful nhưng rule outbound mặc định phải cho phép | Thêm rule outbound cho cổng đích |
  > | **Từ chối ngay lập tức** (`ECONNREFUSED`) | Sai cổng hoặc sai địa chỉ, hoặc service đích không nghe ở đó | Kiểm tra địa chỉ và cổng |
  > **Cái bẫy riêng của Lambda trong VPC:** khi Lambda vào VPC, nó mất quyền truy cập internet **và** mất quyền gọi dịch vụ AWS công khai (S3, SQS, DynamoDB nếu không qua endpoint). Cách sửa đúng không phải NAT Gateway (tốn tiền theo GB) mà là **VPC Endpoint** cho các dịch vụ AWS — traffic đi trong mạng AWS, không ra internet, và **rẻ hơn NAT** đáng kể ở lưu lượng cao.
  > **Con số để nói:** NAT Gateway tính tiền theo giờ (khoảng 0,045 USD/giờ ≈ **32 USD/tháng**) **cộng** theo GB xử lý. Một VPC Endpoint dạng Gateway cho S3 **không tính tiền theo giờ**. Với 1 TB/tháng qua NAT, tiền xử lý dữ liệu một mình đã khoảng **45 USD**; cùng lưu lượng đó qua Gateway Endpoint là **0 USD**. Đây là lý do "Lambda trong VPC chậm" thường là vấn đề **chi phí và cấu hình**, không phải vấn đề hiệu năng.
  > **Chi tiết hay bị hỏi tiếp:** Lambda trong VPC **không** cần NAT để gọi S3 nếu đã có Gateway Endpoint, nhưng **vẫn cần** NAT (hoặc endpoint Interface) để gọi một API bên thứ ba thật trên internet.

### FINDING ADV-30
- **Topic / lesson / line:** H11 — Git merge/rebase/conflict/revert/reset. Dòng 3589–3608. `code: null`.
- **Câu hỏi đặt ra:** "Bạn đã `reset --hard` và mất commit. Lấy lại bằng cách nào, và khi nào thì thật sự mất?"
- **Artifact cung cấp gì:** `deep` phân biệt merge, rebase, revert, reset theo tình huống — đúng về mặt khái niệm.
- **Chuỗi lý luận đứt ở đâu:** `git reset --hard` là **thao tác phá huỷ**, và người phỏng vấn sẽ hỏi đúng câu "mất rồi thì sao". Artifact dạy **cách dùng** lệnh nguy hiểm mà không dạy **cách cứu**. Đây là một dạng của "failure mode listed but never made concrete": rủi ro được nêu, cách phục hồi không có.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **`reset --hard` không xoá commit ngay — nó chỉ di chuyển con trỏ nhánh.** Commit cũ vẫn nằm trong reflog và vẫn được garbage collector giữ trong **mặc định 90 ngày** (với commit được tham chiếu bởi reflog) và **30 ngày** với object không được tham chiếu.
  > **Ba bước cứu, theo thứ tự:**
  > 1. `git reflog` — tìm dòng `HEAD@{n}` ngay trước thao tác sai. Đây là cách nhanh nhất và đúng trong gần như mọi trường hợp.
  > 2. `git reset --hard HEAD@{5}` để quay lại, hoặc `git branch rescue HEAD@{5}` để tạo nhánh giữ lại mà không đụng nhánh hiện tại (an toàn hơn).
  > 3. Nếu commit đã bị GC hoặc không có trong reflog: `git fsck --lost-found`, rồi `git show <hash>` để nhận diện. Đây là phương án cuối và không đảm bảo thành công.
  > **Khi nào thật sự mất:** commit **chưa bao giờ được commit** (thay đổi trong working tree bị `reset --hard` hoặc `checkout --`) thì **không có reflog nào cứu được** — chúng chưa từng là object trong repository. Đây là khác biệt sống còn: `reset --hard` phá **working tree** là không thể phục hồi; phá **nhánh** là phục hồi được.
  > **Cách phòng, và đây là câu trả lời senior:** dùng `git reset --keep` hoặc `--soft` khi có thể; trước thao tác phá huỷ, `git stash` hoặc tạo nhánh tạm `git branch backup-$(date +%s)`; và bật `git config --global alias.safe 'reset --keep'` để đổi thói quen. Nguyên tắc: **reflog cứu nhánh, không cứu file chưa commit.**

### FINDING ADV-31
- **Topic / lesson / line:** H08 — Migration và rollback database. Dòng 3529–3548. `code: null`.
- **Câu hỏi đặt ra:** "Migration của bạn đổi tên một cột có 50 triệu dòng. Deploy mất bao lâu, và rollback thế nào nếu đã có code mới chạy?"
- **Artifact cung cấp gì:** `deep` nói migration cần có kế hoạch rollback, và nói migration phá vỡ tương thích cần nhiều bước.
- **Chuỗi lý luận đứt ở đâu:** artifact nói "phải có rollback" như một nguyên tắc **không có quy trình và không có số**. Câu hỏi then chốt — migration nào rollback được, migration nào không, và tại sao — không được trả lời. Không biết điều này thì không lập được kế hoạch deploy.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Phân loại migration theo khả năng rollback, và đây là thứ quyết định quy trình deploy:**
  > - **Rollback được (dễ):** thêm bảng, thêm cột nullable, thêm index (dùng `CREATE INDEX CONCURRENTLY`). Rollback bằng `DROP`, không mất dữ liệu.
  > - **Rollback được (có điều kiện):** thêm cột có default, thêm ràng buộc `CHECK` — nhưng phải validate trên dữ liệu hiện có trước.
  > - **KHÔNG rollback được:** xoá cột, xoá bảng, đổi kiểu làm mất thông tin (`text` → `int`). Sau khi chạy, dữ liệu đã mất; rollback chỉ đưa **schema** về, không đưa dữ liệu về.
  > **Vì sao phải nhiều bước (expand/contract), có số:** đổi tên cột `name` → `full_name` trên bảng 50 triệu dòng, deploy không downtime:
  > 1. **Expand:** thêm cột `full_name` nullable (nhanh, chỉ đổi metadata). Deploy code **ghi cả hai cột**, đọc `full_name` nếu có, không thì đọc `name`.
  > 2. **Backfill theo lô:** `UPDATE ... SET full_name = name WHERE full_name IS NULL LIMIT 10000;` lặp tới hết. Với 50 triệu dòng và 10.000 dòng mỗi lô, cần 5.000 lô. Nếu mỗi lô mất 200 ms thì tổng ≈ **17 phút**, chạy nền. **Không** chạy một lệnh `UPDATE` duy nhất — nó giữ lock trên toàn bảng và làm mọi thứ khác chờ.
  > 3. **Contract:** sau khi backfill xong và đã deploy code chỉ đọc `full_name`, thêm ràng buộc `NOT NULL`, rồi **deploy sau** mới xoá cột `name`.
  > **Điểm quyết định để nói:** mỗi bước là một lần deploy **riêng**, và bước sau chỉ được chạy khi bước trước đã ổn định. Đây là lý do migration phá vỡ tương thích mất **ba lần deploy** chứ không phải một — và mỗi lần vẫn rollback được vì code luôn tương thích với **cả hai** hình dạng schema trong lúc chuyển.

### FINDING ADV-32
- **Topic / lesson / line:** A17 / E10 — kiểm thử, mock ở ranh giới, cô lập database test. Dòng 1370–1386, 2632–2648.
- **Câu hỏi đặt ra:** "Với 500 test, mỗi test tạo/xoá database mất 200 ms. Bộ test của bạn chạy bao lâu, và bạn tối ưu thế nào?"
- **Artifact cung cấp gì:** `deep` nói nên mock ở **ranh giới** (không mock thứ mình sở hữu), và test database cần cô lập.
- **Chuỗi lý luận đứt ở đâu:** nguyên tắc đúng nhưng **không có số**, nên người học không biết khi nào cách làm hiện tại trở thành vấn đề, và không có cách tối ưu cụ thể. Đây là chỗ bậc 7 (CHANGED CONDITION) nhắm vào, và cũng là chỗ dễ bị đào vì chi phí test là vấn đề ai cũng gặp.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Phép tính, và ba mức tối ưu với số:**
  > 500 test × 200 ms tạo/xoá database = **100 giây** chỉ cho việc dựng và dọn. Nếu thêm 50 ms mỗi test chạy thật, tổng ≈ 125 giây. Vòng phản hồi hai phút là vòng phản hồi mà lập trình viên **ngừng chạy test**.
  > - **Tối ưu 1 — rollback thay vì tạo/xoá:** giữ **một** transaction ngoài cùng, chạy test trong đó, rồi `ROLLBACK` sau mỗi test. Chi phí dọn giảm từ 200 ms xuống khoảng **2–5 ms**. Tổng còn ≈ 27 giây. Đây là tối ưu lớn nhất và rẻ nhất. Cách làm trong pytest: một fixture `connection` cấp session, `begin_nested()` cho mỗi test, `rollback` khi xong.
  > - **Tối ưu 2 — chạy song song:** `pytest -n 8` với `xdist`, mỗi worker một database riêng (hoặc một schema riêng). 27 giây / 8 ≈ **4 giây** nhưng bị giới hạn bởi worker chậm nhất, thực tế khoảng **7–9 giây**.
  > - **Tối ưu 3 — chỉ dùng database thật khi cần:** phần lớn test logic nghiệp vụ không cần PostgreSQL; dùng SQLite in-memory cho nhánh nhanh và chỉ chạy PostgreSQL cho test tích hợp. Cái giá: SQLite **khác** PostgreSQL ở kiểu dữ liệu, ràng buộc và ngữ nghĩa `NULL`, nên test có thể xanh trên SQLite mà đỏ trên production. Đây là đánh đổi phải nói rõ.
  > **Ranh giới mock đúng, có ví dụ:** mock **thư viện bên ngoài** (Stripe, email, S3), **không** mock repository của chính mình — vì mock thứ mình sở hữu nghĩa là test chỉ kiểm tra mock, không kiểm tra logic. Nếu bạn thấy mình mock 8 thứ trong một test, dấu hiệu không phải "cần mock nhiều hơn" mà là **hàm đang làm quá nhiều việc** và cần tách.

### FINDING ADV-33
- **Topic / lesson / line:** A13 — type hints kiểm tra tĩnh và lúc chạy. Dòng 1302–1316.
- **Câu hỏi đặt ra:** "Mypy báo lỗi ở CI. Bạn sửa code hay thêm `# type: ignore`? Cho tôi tiêu chí."
- **Artifact cung cấp gì:** `deep` phân biệt type hints là **gợi ý** cho công cụ tĩnh, không ảnh hưởng lúc chạy (Python không kiểm tra).
- **Chuỗi lý luận đứt ở đâu:** artifact dạy **bản chất** của type hints nhưng không dạy **quy trình làm việc** với chúng. Trong thực tế, câu hỏi luôn là "khi nào bỏ qua cảnh báo" — và artifact không có tiêu chí, không có chính sách. Đây là dạng "lesson where a plausible-sounding answer would collapse under a single follow-up".
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Type hints không kiểm tra lúc chạy — `def f(x: int) -> str: return x` gọi `f("abc")` chạy bình thường và trả `"abc"`.** Nghĩa là hint là tài liệu máy đọc được, không phải ràng buộc. Hệ quả: muốn kiểm tra thật lúc chạy (dữ liệu từ API, từ file) phải dùng Pydantic — đúng như E02 (2458) dạy.
  > **Tiêu chí bỏ qua cảnh báo, có thứ tự:**
  > 1. Nếu cảnh báo đúng → **sửa code**. Đây là 90% trường hợp.
  > 2. Nếu thư viện bên ngoài thiếu stub → cài `types-<package>` (có sẵn cho hầu hết thư viện phổ biến: `types-requests`, `types-redis`). Đây là sửa **đúng**, không phải né.
  > 3. Nếu thật sự sai (mypy không hiểu một pattern hợp lệ) → dùng `# type: ignore[<mã-lỗi>]` **kèm mã lỗi cụ thể và một dòng lý do**, không dùng `# type: ignore` trần. Ví dụ: `# type: ignore[arg-type]  # mypy khong hieu overload cua thu vien X, da kiem tra thu cong`.
  > 4. **Không bao giờ** đặt `ignore_errors = true` cho cả module — nó tắt luôn các cảnh báo **đúng** trong tương lai mà không ai biết.
  > **Vì sao mã lỗi quan trọng:** `# type: ignore` trần sẽ nuốt **mọi** lỗi ở dòng đó, kể cả lỗi mới xuất hiện sau này khi bạn sửa code xung quanh. Ghi mã lỗi biến nó từ một lỗ đen thành một ngoại lệ **có kiểm soát**: nếu lỗi đổi loại, CI báo lại.
  > **Cách đưa vào CI:** chạy mypy ở chế độ `strict = true` cho **module mới**, và để module cũ ở chế độ lỏng hơn. Cố gắng làm strict toàn bộ một codebase cũ trong một lần là cách chắc chắn nhất để không ai làm.

---

## NHÓM 9 — CÁC BÀI HỌC THIẾU VẾ `attacks` HOẶC `observe` ĐỦ MẠNH

### FINDING ADV-34
- **Topic / lesson / line:** `attacks` xuất hiện **17 lần**, ở các dòng 4590, 4651, 4713, 4773, 4833, 4892, 4971, 5053, 5134, 5216, 5297, 5378, 5465, 5527, 5590, 5653, 5717 — tương ứng L01–L06, L12–L17, L18–L22.
- **Câu hỏi đặt ra:** "Bài nào trong số 22 bài không cho tôi luyện phản biện?"
- **Artifact cung cấp gì:** 17 khối `attacks`. Danh sách bài có `attacks`: L01, L02, L03, L04, L05, L06, L12, L13, L14, L15, L16, L17, L18, L19, L20, L21, L22.
- **Chuỗi lý luận đứt ở đâu:** **L07–L11 không có `attacks`.** Đây là chặng 2 — chặng FastAPI/Django/PostgreSQL, tức đúng mảng backend là mảng chính của vị trí Fullstack Engineer đang tuyển. Nghịch lý: chặng **quan trọng nhất cho vị trí này** lại là chặng **không có luyện phản biện**. Ngoài ra `code: null` tập trung nhiều ở nhóm J (10/12 câu) — nhóm tình huống hành vi, nơi `code` không cần thiết, nên đây là điểm ít nghiêm trọng.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:** thêm `attacks` cho L07–L11. Ví dụ cho L07/L18 (hợp đồng API, đã có `attacks` ở 5465) và cho **L11** (transaction, dòng nếu chưa có):
  > **Attack cho L11:** "Bạn nói transaction phải ngắn. Vậy nếu tôi mở transaction, gọi một API bên ngoài mất 3 giây, rồi commit — chuyện gì xảy ra với 50 request đồng thời?"
  > **Trả lời mẫu:** "Mỗi transaction giữ row lock trên những dòng nó đã chạm suốt 3 giây đó. Với 50 request đồng thời chạm cùng một hàng, **49 request xếp hàng chờ**, và request thứ 50 chờ khoảng 3 giây. p99 của endpoint đó thành 3 giây dù bản thân truy vấn chỉ mất 2 ms. Tệ hơn: vì thời gian giữ lock dài, xác suất hai transaction lấy lock theo thứ tự ngược nhau tăng lên, nên deadlock xuất hiện dày hơn — đúng cơ chế ở F08 (2830). Ngoài ra transaction mở lâu còn **chặn VACUUM** đối với các phiên bản dòng cũ mà transaction đó còn thấy, nên bảng phình ra dù bạn đã xoá dữ liệu.
  > **Cách sửa có trình tự:** gọi API **trước**, giữ kết quả trong biến, **rồi mới** mở transaction để ghi. Nếu buộc phải gọi API bên trong transaction, đảo thành **ghi ý định trước, gọi API sau, ghi kết quả cuối cùng** — đó chính là mẫu outbox ở L21 (5620). Ngân sách để nói: transaction chỉ nên bao phần đọc-ghi database, và nên ngắn dưới **100 ms**; bất cứ thứ gì có I/O mạng đều nằm ngoài."

### FINDING ADV-35
- **Topic / lesson / line:** L07–L11 (chặng 2). Xác định dòng bằng `buildsOn` chain: L06 (4856), rồi L12 bắt đầu tại 4931 với `buildsOn: ['L11']` (4938) — nghĩa là L07–L11 nằm trong khoảng **4856–4930**.
- **Câu hỏi đặt ra:** "Chặng 2 dày 5 bài trong 75 dòng, còn chặng 3 dày 6 bài trong 330 dòng. Tại sao?"
- **Artifact cung cấp gì:** gần đúng — **chặng 3 (Vue) chiếm 4931–5678 ≈ 748 dòng cho 6 bài**; chặng 1 (AWS L01–L06) chiếm 4553–4930 ≈ 378 dòng cho 6 bài; chặng 2 (L07–L11) và phần lớn L18–L22 chiếm phần còn lại. Kiểm chứng: L01 bắt đầu 4553, L06 bắt đầu 4856, L12 bắt đầu 4931. Vậy L07–L11 nằm **giữa 4856 và 4931** — chỉ khoảng **75 dòng cho 5 bài**, trung bình **15 dòng/bài**.
- **Chuỗi lý luận đứt ở đâu:** đây là finding về **phân bổ độ sâu không theo độ quan trọng của vị trí tuyển dụng**. Vị trí là **Fullstack Engineer** với FastAPI/Django/PostgreSQL là yêu cầu chính, nhưng chặng backend của artifact bị nén mạnh nhất: 15 dòng/bài so với khoảng 125 dòng/bài ở chặng Vue. Nghĩa là người học có **nhiều vật liệu để luyện Vue hơn hẳn** so với mảng backend là mảng sẽ được đào sâu nhất trong buổi phỏng vấn.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:** mở rộng L07–L11 tới cấu trúc đầy đủ như L12–L22, tối thiểu bổ sung: `incident` có mốc thời gian và con số, `predict` có đáp án gây bất ngờ, `naiveCode` chạy được, `naiveOut` có số, `timeline` từng bước, `attacks` 3–5 câu. Ưu tiên theo mức độ sẽ bị hỏi trong phỏng vấn:
  > 1. **L07 — FastAPI request lifecycle và dependency injection.** Cần `attacks` về: tại sao `Depends` chạy **trước** khi vào hàm, và cái gì xảy ra khi một dependency ném lỗi (nó chặn cả request trước khi handler chạy — nên đừng để side effect trong dependency).
  > 2. **L08 — Pydantic v1 so với v2.** Con số phải có: Pydantic v2 viết lõi bằng Rust, nhanh hơn v1 khoảng **5–50 lần** tuỳ model. Và điểm phá vỡ: `validator` → `field_validator`, `Config` class → `model_config = ConfigDict(...)`, `.dict()` → `.model_dump()`, `parse_obj` → `model_validate`.
  > 3. **L09 — `def` so với `async def`.** Có ví dụ ở **ADV-16**: `async def` gọi driver đồng bộ chặn event loop, p99 từ 180 ms lên 3,1 giây. Nếu chặng 2 không có con số này thì đây là lỗ hổng lớn nhất của artifact.
  > 4. **L10 — transaction và xử lý lỗi khi ghi nhiều bước.** Dùng `attack` ở **ADV-34**.
  > 5. **L11 — background task trong tiến trình so với hàng đợi bền.** Con số phải có: `BackgroundTasks` của FastAPI mất việc khi tiến trình restart. Với deploy hàng ngày và mỗi lần restart giết các task đang chạy, tỉ lệ mất việc tỉ lệ với (thời gian task / khoảng cách deploy) — deploy mỗi ngày một lần, task 5 phút, xác suất mất một task cụ thể khoảng 5/1440 ≈ **0,35%**; với 10.000 task/ngày, đó là khoảng **35 task mất mỗi ngày**, im lặng.

---

## NHÓM 10 — CHỖ SỐ HỌC SẼ KẾT THÚC TRANH LUẬN NHƯNG KHÔNG CÓ SỐ

### FINDING ADV-36
- **Topic / lesson / line:** L13 — `computed` / `watch` / `watchEffect`. Dòng 5014–5093. `incident` (5023), `predict` (5029).
- **Câu hỏi đặt ra:** "Một phím gõ tạo 9 request. Debounce 250 ms cắt được bao nhiêu?"
- **Artifact cung cấp gì:** `incident` (5023) có số cụ thể: cùng một `q` xuất hiện **9 lần trong 2 giây**, p95 của endpoint tìm kiếm từ **120 ms lên 1,8 giây**. `predict` (5029) có phép tính đúng: gõ 6 ký tự cách nhau 300 ms ⇒ 6 request.
- **Chuỗi lý luận đứt ở đâu:** bài có số **ở phần triệu chứng** nhưng `askFirst` (5027) hỏi *"nếu bạn gõ 12 ký tự trong 2 giây, debounce 250 ms có làm số request giảm xuống còn một không?"* — và **artifact không trả lời câu này bằng số**. Đây là câu hỏi tu từ không có đáp án, tức là một lỗ hổng ngay trong bài mạnh nhất về Vue.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Trả lời bằng số:** người gõ nhanh đạt khoảng **5–8 ký tự/giây**, tức khoảng cách giữa các phím **125–200 ms**. Debounce 250 ms **cắt được phần lớn** nhưng **không phải tất cả**: nếu người dùng gõ 12 ký tự trong 2 giây, khoảng cách trung bình là 167 ms — **nhỏ hơn 250 ms**, nên phần lớn các lần gõ bị gộp. Số request thực tế giảm từ **12 xuống khoảng 2–4**, tuỳ nhịp gõ có chỗ dừng hay không.
  > **Nó KHÔNG giảm xuống một** vì người gõ tự nhiên có những khoảng dừng dài hơn 250 ms (suy nghĩ, nhìn kết quả, sửa từ). Mỗi khoảng dừng như vậy chốt một request.
  > **Số để chọn debounce:** 250 ms là ngưỡng mà người dùng **không cảm nhận được độ trễ** (ngưỡng cảm nhận khoảng 100–200 ms cho phản hồi trực tiếp, nhưng với tìm kiếm thì 250 ms vẫn chấp nhận được). 300 ms là điểm cân bằng phổ biến; 500 ms bắt đầu bị cảm nhận là chậm. Nếu muốn giảm mạnh hơn nữa thì phải dùng **debounce cộng cache kết quả theo từ khoá** — gõ "áo" rồi xoá còn "á" rồi gõ lại "áo" sẽ trúng cache và không tạo request nào.
  > **Điều quan trọng nhất, và artifact có nói ở 5079 nhưng cần được nhấn:** debounce **giảm tần suất**, cleanup **bảo đảm tính đúng**. Hai việc khác nhau, không việc nào thay được việc kia. Debounce 250 ms vẫn để lọt hai request cách nhau 300 ms — và hai request đó vẫn có thể về sai thứ tự. Vì vậy luôn cần **cả hai**.

### FINDING ADV-37
- **Topic / lesson / line:** E09 — background task trong tiến trình so với hàng đợi bền. Dòng 2617–2631.
- **Câu hỏi đặt ra:** "Bạn nói background task mất việc khi restart. Mất bao nhiêu, và làm sao biết mình đã mất?"
- **Artifact cung cấp gì:** `deep` phân biệt `BackgroundTasks` trong tiến trình với hàng đợi bền, và nói task trong tiến trình mất khi tiến trình chết.
- **Chuỗi lý luận đứt ở đâu:** mất mát này là **im lặng** — không exception, không log lỗi, chỉ có công việc không bao giờ xong. Artifact nói đúng nhưng không cho cách **đo** hoặc **phát hiện**. Đây là chỗ bậc 8 (PRODUCTION) trống.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Tính tỉ lệ mất, và đây là lý do nó nguy hiểm:** xác suất một task bị mất ≈ thời gian task / khoảng cách giữa các lần restart.
  > - Deploy hàng ngày (1.440 phút), task gửi email mất **5 giây**: xác suất ≈ 5/86.400 ≈ **0,006%** — không đáng lo.
  > - Deploy hàng ngày, task **xuất báo cáo** mất 5 phút: xác suất ≈ 300/86.400 ≈ **0,35%**.
  > - Với **10.000 task/ngày**: 0,35% ⇒ khoảng **35 báo cáo mất mỗi ngày**, và không ai biết vì task đó không có lần chạy nào để ghi log thất bại.
  > - Nếu deploy **nhiều lần mỗi ngày** (CI/CD hiện đại, 10 lần/ngày) thì xác suất tăng gấp 10: **3,5%**, tức khoảng **350 task mất mỗi ngày**.
  > **Cách phát hiện — và đây là điểm cốt lõi:** không thể phát hiện bằng log lỗi, vì **không có lần chạy nào để ghi log**. Phải đếm từ **phía mong đợi**, không phải phía thực thi:
  > - **Đếm hai đầu:** số task **được tạo** (ghi ngay khi nhận request, vào bảng) so với số task **hoàn thành** (ghi khi xong). Khoảng cách giữa hai con số chính là số đang treo hoặc đã mất.
  > - **Chỉ số cảnh báo:** `số task ở trạng thái chờ quá hạn`, với ngưỡng quá hạn = **3 × p99 thời gian xử lý**. Phải tiến về 0 sau mỗi lần dọn.
  > **Cách sửa theo mức độ:** nếu task **được phép mất** (ghi log phân tích, gửi thông báo không quan trọng) thì `BackgroundTasks` là đủ và rẻ. Nếu task **không được phép mất** (gửi hoá đơn, cập nhật số dư) thì phải dùng outbox cộng worker — đúng mẫu ở L21 (5620) — và **mỗi bước phải chịu được việc chạy lại**, đúng nguyên tắc của L22 (5724).

### FINDING ADV-38
- **Topic / lesson / line:** L06 — SQS và DLQ. Dòng 4856–4930. `attacks` (4892).
- **Câu hỏi đặt ra:** "DLQ của tôi có 40.000 message. Chuyện gì đã xảy ra, và bao lâu thì tôi mất chúng?"
- **Artifact cung cấp gì:** L06 có `attacks` (4892) và nội dung về SQS, visibility timeout, DLQ. L21 (5649) có `failureModes` nói *"DLQ không ai nhìn... message sẽ hết hạn lưu trữ và biến mất im lặng"*.
- **Chuỗi lý luận đứt ở đâu:** L21 nói đúng rằng message **hết hạn và biến mất** nhưng **không cho con số hạn lưu trữ**. Đây là một mất mát dữ liệu vĩnh viễn với thời hạn hoàn toàn xác định, và không có số thì không có hành động.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:**
  > **Retention mặc định của SQS là 4 ngày** (345.600 giây), cấu hình được trong khoảng **60 giây đến 14 ngày**. Message trong DLQ **cũng chịu đúng hạn đó**, và DLQ **không tự động** có retention dài hơn queue nguồn — nếu bạn không đặt lại, message trong DLQ biến mất sau 4 ngày.
  > **Ví dụ có số:** DLQ nhận 40.000 message vì một bug deploy hôm thứ Sáu. Đội phát hiện thứ Tư tuần sau (5 ngày). Với retention mặc định 4 ngày, message đầu tiên đã biến mất từ **thứ Ba**, và bug chưa sửa xong nghĩa là bạn **không thể replay** để khôi phục dữ liệu. Số message có thể phục hồi: **0**.
  > **Bốn cấu hình phải đặt ngay khi tạo queue:**
  > 1. `MessageRetentionPeriod` của **DLQ** = **14 ngày** (mức tối đa), dài hơn queue nguồn. Đây là cấu hình quan trọng nhất và hay bị bỏ nhất.
  > 2. `maxReceiveCount` = **3–5**, không để mặc định **10**. Message hỏng không nên chiếm worker 10 lần trước khi vào DLQ.
  > 3. **Alarm trên `ApproximateNumberOfMessagesVisible` của DLQ > 0.** DLQ phải là nơi **không bao giờ** im lặng; một message trong DLQ là một sự kiện cần người xem.
  > 4. **Redrive policy** để replay message từ DLQ về queue nguồn sau khi sửa bug. Không có bước này thì DLQ chỉ là nơi chôn dữ liệu có ghi chép.
  > **Chi tiết dễ sai:** DLQ phải **cùng loại** với queue nguồn (chuẩn với chuẩn, FIFO với FIFO) và cùng Region, nếu không không gắn được redrive policy.

---

## NHÓM 11 — TRADE-OFF KHÔNG CÓ PHÉP TÍNH Ở CẤP BÀI HỌC

### FINDING ADV-39
- **Topic / lesson / line:** L12 `tradeoff` (4968), L17 `tradeoff`, L22 `tradeoff` (5714).
- **Câu hỏi đặt ra:** "Bạn nói đánh đổi này có giá. Giá là bao nhiêu, bằng đơn vị gì?"
- **Artifact cung cấp gì:** L12 `tradeoff` (4968) là một trong những đoạn tốt nhất trong file: nói rõ mất khả năng gán lại cả object `reactive`, phải chuyển sang `ref` và chấp nhận thêm `.value`, và **có con số**: *"Vue 3.5 viết lại hệ thống reactivity, giảm 56% mức dùng bộ nhớ và làm vài thao tác trên mảng phản ứng lớn nhanh hơn tới 10 lần"*. L22 `tradeoff` (5714) nói "ba bảng phụ, một tiến trình quét outbox, một tiến trình quét hàng chờ" — đếm được.
- **Chuỗi lý luận đứt ở đâu:** đây là finding **ghi nhận chất lượng tốt** nhưng chỉ ra sự **không đồng đều**: 22 bài có `tradeoff`, nhưng chỉ một số ít có **con số**. Đa số nói "tốn thêm một bước", "thêm một bảng", "chậm hơn" mà không có đơn vị. Người học không phân biệt được đánh đổi **lớn** với đánh đổi **nhỏ**.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:** chuẩn hoá mọi `tradeoff` phải có **một trong ba** dạng số: (a) độ trễ tính bằng ms, (b) chi phí tính bằng USD/tháng hoặc GB, (c) số bước hoặc số bảng phải vận hành. Ví dụ bổ sung cho **L16** (Vue Router, lazy loading):
  > **Đo được:** một SPA 12 route, bundle gộp một khối là **1,8 MB** JavaScript. Trên mạng 4G (khoảng 10 Mbps thực tế), tải 1,8 MB mất khoảng **1,4 giây** trước khi màn hình đầu tiên hiện ra. Chia thành 12 chunk theo route, chunk đầu còn **280 KB** ⇒ khoảng **0,22 giây**, nhanh hơn **6 lần** cho lần vào đầu tiên.
  > **Cái giá có số:** người dùng vào route thứ hai phải chờ tải thêm chunk đó — một vòng tải **100–400 ms** tuỳ kích thước chunk, thay vì 0 ms nếu đã gộp sẵn. Nghĩa là bạn **đổi 1,2 giây của lần vào đầu tiên lấy 0,2 giây của mỗi lần điều hướng sau**.
  > **Quy tắc quyết định:** lazy-load mọi route **trừ** đường đi nóng nhất ngay sau đăng nhập (dashboard, danh sách chính) — route đó nên nằm trong chunk đầu để không có vòng tải thêm ở đúng lúc người dùng đang chờ. Con số để nhớ: ngưỡng cảm nhận tức thời của người dùng là khoảng **100 ms**; trên **1 giây** thì mất cảm giác liền mạch.

### FINDING ADV-40
- **Topic / lesson / line:** L10 / L11 — transaction và background task. Nằm trong khoảng **4856–4930** (xác định bằng `buildsOn` của L12 tại 4938).
- **Câu hỏi đặt ra:** "Chặng backend chỉ có 15 dòng mỗi bài. Tôi luyện bài đó thế nào?"
- **Artifact cung cấp gì:** xem ADV-35 — chặng 2 bị nén xuống khoảng **75 dòng cho 5 bài**.
- **Chuỗi lý luận đứt ở đâu:** đây là finding **định lượng** bổ sung cho ADV-35, xác nhận nó bằng dòng cụ thể để Lead có thể kiểm chứng độc lập: `L06` bắt đầu **4856**, `L12` bắt đầu **4931** và khai `buildsOn: ['L11']` tại **4938**. Năm bài L07–L11 nằm gọn giữa hai mốc đó.
- **Blocking severity: critical** (cùng gốc với ADV-35, giữ riêng để Lead đối chiếu số)
- **Vật liệu phải bổ sung:** giống ADV-35. Ưu tiên tuyệt đối là **L08 (Pydantic v1 so với v2)** và **L09 (`def` so với `async def`)** vì đây là hai chủ đề mà câu hỏi E02 (2458) và E03 (2483) tồn tại nhưng bị giới hạn độ sâu bởi chính chặng bị nén này.

---

## NHÓM 12 — CÁC FINDING VỀ TÍNH NHẤT QUÁN NỘI TẠI

### FINDING ADV-41
- **Topic / lesson / line:** `STUDY_PLANS` (5746–5838) so với nội dung thật của `QUESTIONS` và `LESSONSARR`.
- **Câu hỏi đặt ra:** "Kế hoạch ôn của bạn dạy tôi làm điều mà artifact không có vật liệu để làm. Điều đó có ổn không?"
- **Artifact cung cấp gì:** `two_days` tại **5796** dạy một kỹ năng rất đúng: *"Với mỗi câu bảo mật, trả lời theo 3 nhịp: lỗ hổng là gì — kẻ tấn công làm gì — bạn chặn bằng cấu hình cụ thể nào. Câu nào bạn chỉ nói được định nghĩa mà không nêu được cấu hình thì đánh dấu đỏ, đó là điểm phỏng vấn hay soi nhất."* `two_days` tại **5811** dạy: *"Mỗi câu AWS bắt buộc có một câu hỏi tự vấn: 'vận hành cái này ở production, tôi sẽ cấu hình gì và tôi sẽ bị đánh phí ở đâu'."*
- **Chuỗi lý luận đứt ở đâu:** study plan yêu cầu đúng hai thứ mà artifact **không cung cấp**: (a) cấu hình cụ thể cho từng câu bảo mật — xem **ADV-09**, grep xác nhận không có dòng cấu hình nào cho D05/D06/D13; (b) **bị đánh phí ở đâu** — grep xác nhận **không có một con số giá AWS nào trong toàn bộ file**. Study plan tự nhận ra điểm yếu lớn nhất của chính artifact và biến nó thành bài tập cho người học, nhưng không có đáp án ở đâu cả. Đây là finding về **tính nhất quán**: lời khuyên và vật liệu không khớp.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:** hoặc (a) bổ sung vật liệu như ADV-09 và phần giá dưới đây, hoặc (b) sửa study plan để trỏ tới tài liệu ngoài một cách rõ ràng thay vì để người học tự đoán. Vật liệu giá tối thiểu cần có:
  > **Bảng giá phải thuộc để trả lời "bị đánh phí ở đâu"** (giá tham khảo, phải kiểm tra lại theo Region vì thay đổi):
  > - **Lambda:** tính theo **số lần gọi** cộng **GB-giây**. Bậc miễn phí 1 triệu request và 400.000 GB-giây mỗi tháng. Vượt thì khoảng 0,20 USD mỗi triệu request và 0,0000166667 USD mỗi GB-giây.
  > - **API Gateway REST:** khoảng **3,50 USD mỗi triệu request**. Đây là con số hay bị bỏ qua — với 100 triệu request/tháng, riêng gateway đã **350 USD**.
  > - **S3:** khoảng **0,023 USD mỗi GB-tháng** cho Standard, cộng **0,005 USD mỗi 1.000 request PUT** và **0,0004 USD mỗi 1.000 request GET**. Nghĩa là một vòng lặp `head_object` trên 1 triệu object tốn **5 USD** chỉ cho request, chưa tính dữ liệu.
  > - **NAT Gateway:** khoảng **0,045 USD mỗi giờ** (≈ 32 USD/tháng) **cộng 0,045 USD mỗi GB** xử lý. Đây là mục gây sốc hoá đơn phổ biến nhất khi Lambda vào VPC.
  > - **CloudWatch Logs:** khoảng **0,50 USD mỗi GB** ingest. Một hàm log 2 KB mỗi lần gọi, gọi 50 triệu lần/tháng ⇒ 100 GB ⇒ **50 USD/tháng cho log**. Đây là lý do "đừng log mọi thứ" là lời khuyên có đơn vị.
  > - **RDS PostgreSQL:** tính theo giờ **cộng dung lượng**. `db.t3.medium` Multi-AZ khoảng **0,14 USD/giờ** ⇒ ≈ **100 USD/tháng**; chưa tính storage và backup. Và **Multi-AZ tốn gấp đôi** Single-AZ — đây là đánh đổi phải nói bằng số.
  > **Câu trả lời mẫu cho "bị đánh phí ở đâu":** "Với một hệ thống 10.000 người dùng, hoá đơn của tôi chia thành bốn mục lớn: compute (Lambda hoặc RDS theo giờ), request (API Gateway và S3 theo số lần gọi), dữ liệu ra (NAT và CloudFront theo GB), và **log** (CloudWatch theo GB). Mục cuối là mục duy nhất tăng mà không ai để ý, và nó tăng theo **số lần gọi** chứ không theo số người dùng."

### FINDING ADV-42
- **Topic / lesson / line:** `refs` của các câu hỏi. Ví dụ J09 (4029) và J10 (4049) đều có `refs: ['owasp-api-security', 'mdn-http-overview']` (4046, 4066); J11 (4069) có `refs: ['mdn-http-overview', 'owasp-api-security']` (4086); J12 (4089) có `refs: ['aws-lambda-best', 'dockerfile-ref']` (4106).
- **Câu hỏi đặt ra:** "Câu hỏi về kỹ năng đặt câu hỏi ngược cho nhà tuyển dụng thì liên quan gì tới OWASP API Security?"
- **Artifact cung cấp gì:** mỗi câu có trường `refs` liệt kê tài liệu tham khảo. Nhóm J (12 câu hành vi giao tiếp) có `refs` trỏ tới `owasp-api-security`, `mdn-http-overview`, `fastapi-tutorial`, `aws-lambda-best`, `dockerfile-ref`.
- **Chuỗi lý luận đứt ở đâu:** `refs` ở nhóm J trỏ tới tài liệu **kỹ thuật** trong khi nội dung câu hỏi là **giao tiếp và hành vi**. Đây là lỗi dữ liệu, không phải lỗi nội dung, nhưng có hệ quả thật: người học tin vào `refs` để đọc thêm sẽ được trỏ sai chỗ, và một ứng viên đang ôn về cách trả lời phỏng vấn sẽ được đưa tới tài liệu OWASP. Nghi vấn: `refs` bị gán theo **nhóm** thay vì theo **câu**.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:** sửa `refs` cho nhóm J trỏ tới tài liệu đúng chủ đề (ví dụ hướng dẫn viết STAR, tài liệu về phỏng vấn hành vi), hoặc **bỏ trống** `refs` cho câu hành vi thay vì trỏ sai. Nếu nghi vấn "gán theo nhóm" đúng, cần rà toàn bộ 131 câu để kiểm tra từng `refs` khớp với `topic` của chính câu đó — đây là việc kiểm tra cơ học, có thể làm bằng script, và nên làm trước khi artifact được coi là hoàn thiện.

---

## NHÓM 13 — NHỮNG CHỖ ARTIFACT TỰ MÂU THUẪN HOẶC TỰ NHẬN YẾU

### FINDING ADV-43
- **Topic / lesson / line:** `selfcheck` của các câu hỏi. Ví dụ A01 (1064), A02 (1088), A03 (1112), A04 (1136), A05 (1160), G03 (3010), H09 (3565).
- **Câu hỏi đặt ra:** "Dòng `selfcheck` đầu tiên của bạn luôn nói 'tôi vẫn chưa...'. Đó là thiết kế hay là dấu hiệu?"
- **Artifact cung cấp gì:** mỗi `selfcheck` là một mảng ba dòng: dòng đầu nói điều người học **chưa làm được**, hai dòng sau nói điều **đã làm được**. Ví dụ A01 (1064): *"Tôi vẫn chưa giải thích được cơ chế chính xác khiến CPython cache số nguyên trong khoảng nào và vì sao chuỗi ký tự hợp lệ được intern."*
- **Chuỗi lý luận đứt ở đâu:** đây là một **thiết kế tốt** — dòng "chưa làm được" chỉ ra đúng chỗ sâu nhất của chủ đề. Nhưng nó tạo ra một **nợ không có đường trả**: phần lớn các dòng "chưa làm được" trỏ tới kiến thức **không tồn tại ở đâu trong artifact**. Ví dụ A01 chỉ ra người học chưa giải thích được **vì sao CPython cache số nguyên −5..256** và **vì sao chuỗi hợp lệ được intern** — nhưng `deep` của A01 (1059) chỉ **nêu** hai hiện tượng này, **không giải thích cơ chế**. Vậy `selfcheck` đang chỉ ra một lỗ hổng mà artifact không có vật liệu để bịt.
- **Blocking severity: major**
- **Vật liệu phải bổ sung:**
  > **Vì sao CPython cache số nguyên −5 đến 256:** `PyLong_FromLong` với giá trị nhỏ trả về con trỏ tới một mảng tĩnh `small_ints[]` được khởi tạo lúc interpreter khởi động, gồm 262 đối tượng. Lý do chọn khoảng đó **không phải ngẫu nhiên**: nó bao trùm các giá trị mà mã Python dùng nhiều nhất — chỉ số vòng lặp nhỏ, byte, và kết quả so sánh. Chi phí là **262 × 28 byte ≈ 7 KB** bộ nhớ, rẻ hơn hẳn việc cấp phát và giải phóng hàng triệu đối tượng nhỏ. **Hệ quả thực tế:** `a = 256; b = 256; a is b` → `True`; `a = 257; b = 257; a is b` → `False` ở chế độ tương tác nhưng có thể `True` trong cùng một hàm vì **hằng số được gộp trong `co_consts`** của cùng một code object. Đây là lý do `is` cho số là **không đáng tin** ở mọi giá trị, kể cả trong khoảng cache.
  > **Vì sao chuỗi được intern:** CPython intern chuỗi chỉ khi chuỗi **trông như định danh** (chỉ gồm chữ cái, chữ số và gạch dưới). Hàm `PyUnicode_InternInPlace` kiểm tra điều kiện đó; chuỗi có dấu cách hoặc ký tự đặc biệt **không** được intern. Mục đích là làm cho việc tra cứu tên biến, thuộc tính và từ khoá trong dict nhanh hơn: với hai chuỗi cùng nội dung đã intern, so sánh có thể dừng ở **so con trỏ** thay vì so từng ký tự. **Hệ quả:** `"hello" is "hello"` → `True`, nhưng `"hello world" is "hello world"` → có thể `False` (tuỳ chuỗi được tạo lúc biên dịch hay lúc chạy). Đây chính là lý do `pitfalls` (1063) nói đúng rằng dùng `is` để so chuỗi là hỏng.

### FINDING ADV-44
- **Topic / lesson / line:** L22 `predict` (5694) và `incident` (5688), so với D11 (2360) và L21 (5615).
- **Câu hỏi đặt ra:** "Idempotency key: bạn sinh nó lúc nào, và nếu sinh lúc nạp trang thì hỏng thế nào?"
- **Artifact cung cấp gì:** L22 `mechanism` (5712) trả lời **xuất sắc**: *"khoá phải được sinh lúc bấm chứ không phải lúc nạp trang, và phải được giữ nguyên qua mọi lần thử lại; nếu sinh lúc nạp trang thì mọi lần bấm trong phiên đó dùng chung một khoá và cơ chế biến mất."*
- **Chuỗi lý luận đứt ở đâu:** đây là một trong những câu sắc nhất trong file, nhưng nó **chỉ tồn tại ở L22**. Câu hỏi **D11** (2360) — câu chính thức về idempotency key — **không có** chi tiết này, và cũng không có `attacks`. Nghĩa là nếu người học luyện theo `qids` hoặc theo nhóm D (web/security P0), họ **sẽ không gặp** lập luận này. Đây là cùng một bệnh như ADV-26: kiến thức tốt bị **giam trong bài học** và không lên được tới câu hỏi.
- **Blocking severity: minor**
- **Vật liệu phải bổ sung:** chuyển thẳng lập luận vào D11 dưới dạng một `attack`:
  > **Attack:** "Tôi sinh `Idempotency-Key` bằng `crypto.randomUUID()` ngay trong `setup()` của component. Sai ở đâu?"
  > **Trả lời mẫu:** "Sai vì `setup()` chạy **một lần** khi component được dựng, còn người dùng có thể bấm Gửi **nhiều lần** trong cùng một phiên. Mọi lần bấm dùng **cùng một khoá**, nên server coi lần bấm thứ hai là cùng một ý định và trả lại kết quả cũ — thao tác thứ hai của người dùng **biến mất im lặng**. Nghiêm trọng hơn: nếu người dùng sửa dữ liệu rồi bấm lại (một ý định **mới**), khoá cũ vẫn được dùng và server vẫn trả kết quả của lần đầu — người dùng tưởng đã lưu thay đổi mới nhưng thực tế không.
  > **Quy tắc:** khoá gắn với **ý định nghiệp vụ**, không gắn với **request** và không gắn với **component**. Sinh khi bấm nếu là lần đầu của ý định đó; **giữ nguyên** qua mọi lần thử lại của cùng ý định; và **xoá** khi ý định kết thúc dứt khoát (thành công, hoặc thất bại vĩnh viễn) hoặc khi người dùng sửa dữ liệu và bắt đầu ý định mới. Trong code, đây chính là biến `pendingKey` cấp module trong `code` của L22 (5728) — và lý do nó **không** nằm trong `reactive` của component.

### FINDING ADV-45
- **Topic / lesson / line:** `attacks` của L01 (4590–4595) — nội dung mạnh, so với `attacks` của các nhóm câu hỏi không tồn tại.
- **Câu hỏi đặt ra:** "Chuẩn của `attacks` trong bài học là gì, và câu hỏi có đạt được chuẩn đó không?"
- **Artifact cung cấp gì:** L01 `attacks` (4591–4594) có 4 câu, mỗi câu đều **phản biện một khẳng định cụ thể** của bài và trả lời bằng **tiêu chí quyết định**. Ví dụ (4591): *"Bạn nói nhân bản tầng tính toán làm tầng dưới tệ hơn. Vậy khi nào nhân bản tầng trên là đúng và khi nào là sai?"* — đáp án cho **tiêu chí** (nhìn p99 tầng dưới trước khi nhân bản).
- **Chuỗi lý luận đứt ở đâu:** đây là finding **tổng hợp**, đóng lại toàn bộ audit. Chuẩn của `attacks` trong bài học là: **(a)** nhắc lại chính xác một khẳng định của bài, **(b)** hỏi trường hợp biên hoặc trường hợp ngược, **(c)** trả lời bằng **tiêu chí quyết định** chứ không bằng định nghĩa lại. `QUESTIONS` không có `attacks` ở bất kỳ câu nào, nên **toàn bộ 131 câu hỏi không đạt chuẩn này**. Đây là finding gốc của ADV-07 và ADV-08, và là lý do hai finding đó ở mức `critical`.
- **Blocking severity: critical**
- **Vật liệu phải bổ sung:** thêm `attacks` cho **tối thiểu toàn bộ câu P0 của nhóm A, B, E, F, G, C** theo đúng chuẩn ba phần của L01. Ước lượng khối lượng: 131 câu, khoảng 45% là P0 ⇒ **khoảng 59 câu** cần thêm, mỗi câu 3–5 `attacks` ⇒ khoảng **200–300 đoạn phải viết**. Đây là khối lượng lớn nhất trong mọi finding của audit này, và là việc có **tác động lớn nhất** tới việc người học có sống sót qua một người phỏng vấn khó tính hay không — vì `attacks` chính là thành phần duy nhất trong artifact mô phỏng đúng động tác đó.

---

## P0 SHORTLIST — 12 FINDING TỆ NHẤT

Xếp theo **mức thiệt hại cho người học** trong một buổi phỏng vấn thật, không theo số lượng dòng.

| # | Finding | Chủ đề | Vì sao vào P0 | Severity |
|---|---|---|---|---|
| **1** | **ADV-45** | `attacks` — chuẩn phản biện | 131/131 câu hỏi **không có một `attacks` nào**, trong khi 22 bài học có 17 khối `attacks` đạt chuẩn cao. Thành phần duy nhất mô phỏng người phỏng vấn khó tính **không tồn tại ở nơi người học luyện tập**. Đây là finding gốc. | critical |
| **2** | **ADV-35 / ADV-40** | Chặng 2 (L07–L11) bị nén | 5 bài backend — mảng chính của vị trí Fullstack Engineer — nằm gọn trong **~75 dòng**, khoảng **15 dòng/bài**, so với ~125 dòng/bài ở chặng Vue. Người học có **ít vật liệu nhất** cho mảng sẽ bị đào **sâu nhất**. | critical |
| **3** | **ADV-07** | Nhóm B (JS/TS) không có `attacks` | 14/14 câu JS/TS **không có `attacks`**. Ứng viên này yếu JS/TS nhất theo chính `LESSONSARR`, nên đây là mảng rủi ro cao nhất mà lại **chưa bao giờ được luyện phản biện**. | critical |
| **4** | **ADV-01** | G03 — Lambda cold start và giới hạn | Dạy "giữ gói gọn" và "đặt timeout vừa đủ" mà **không một con số nào**: không có 128 MB–10 GB, không có 15 phút, không có 1.000 concurrency dùng chung, không có 512 MB `/tmp`, không có quan hệ **bộ nhớ ↔ CPU**. Câu hỏi "gọn là bao nhiêu?" không có đáp án. | critical |
| **5** | **ADV-02** | G16 — Lambda so với ECS | Toàn bộ lập luận chọn compute được đặt trên **một so sánh chi phí chưa bao giờ được tính**. Grep toàn file: **0 con số giá AWS**. Ở bậc 6 của thang, người học không có gì để vẽ. | critical |
| **6** | **ADV-04** | F04 — Chi phí của index | Dạy **cách thêm** index rất kỹ nhưng **không cho phép tính để từ chối**. Câu "khi nào KHÔNG nên thêm index?" — câu phân biệt junior và senior — hoàn toàn trống. Không có tỉ lệ chọn lọc, không có chi phí ghi. | critical |
| **7** | **ADV-18** | B03 — Thuật toán ép kiểu `==` | Dạy **bảng kết quả** thay vì **thuật toán 5 bước**. Người học sập ngay ở `[] == false` vì không suy ra được từ bảng. Câu hỏi kinh điển để lọc người thuộc bài. | critical |
| **8** | **ADV-24** | D10 — Jitter trong retry | "Phải có jitter" là quy tắc **không có phép tính**. Không có jitter, 100 client đồng bộ tạo **đỉnh tải lặp lại y hệt** ba lần; đây là dạng "trade-off asserted with no arithmetic" điển hình nhất, và là chỗ dễ bị đào nhất vì nghe như chi tiết vụn. | critical |
| **9** | **ADV-34** | L07–L11 không có `attacks` | Xác nhận ADV-35 ở góc khác: chặng backend **không có luyện phản biện**. Đây là mảng chính của vị trí, nên đây là lỗ hổng về **đúng chủ đề sẽ được hỏi**. | critical |
| **10** | **ADV-16** | 71/131 câu không có `incident` | Bao gồm các câu P0: D01, D02, E08, F07, F11, G01, G05, G10, G12, G15, G16, H08, H11, H12. **54% số câu** chỉ có định nghĩa, không có tình huống. Không có tình huống thì không luyện được, và chất lượng học **thấp hơn** chất lượng thật của artifact. | major |
| **11** | **ADV-41** | Study plan yêu cầu thứ artifact không có | Dòng 5796 yêu cầu "cấu hình cụ thể" và dòng 5811 yêu cầu "bị đánh phí ở đâu" — artifact **không cung cấp cả hai**. Study plan tự chẩn đúng điểm yếu lớn nhất rồi để người học không có đáp án. | major |
| **12** | **ADV-11** | F07 — Tỉ lệ abort của Serializable | Cảnh báo "đừng dùng Serializable mọi nơi vì abort tăng mạnh" là mệnh đề đúng **không có con số** ⇒ không có ngưỡng ra quyết định. Bậc 7 của thang ("traffic gấp đôi thì sao?") không trả lời được. | major |

**Ghi chú về thứ hạng:** ADV-45 và ADV-07/ADV-34/ADV-35 là **cùng một bệnh ở bốn góc nhìn** — artifact có một thành phần chất lượng cao (`attacks`, và 22 bài học đầy đủ) nhưng thành phần đó **không chạm tới nơi người học luyện tập**. Nếu chỉ sửa được một thứ, sửa cái đó. Nếu được sửa hai, thứ hai là **con số** — vì mọi finding `critical` còn lại (ADV-01, 02, 04, 18, 24, 11) đều là một biến thể của "lập luận đúng nhưng không có số để bảo vệ".

---

## BA CHỦ ĐỀ YẾU NHẤT

**1. Con số và phép tính — không phải ở đâu đó, mà ở gần như mọi nơi có đánh đổi.**
Zero con số giá AWS trong một file dạy AWS (ADV-02, ADV-41). Cold start không có mili giây (ADV-01). Index không có chi phí ghi (ADV-04). N+1 không có độ trễ (ADV-05). Pool không có bộ nhớ mỗi connection (ADV-06). Retry không có phép tính jitter (ADV-24). Serializable không có tỉ lệ abort (ADV-11). Nghịch lý cần nói rõ: **những chỗ artifact mạnh nhất lại chính là những chỗ có số** — L01 có 200 rps → p99 4,2 s; L19 có 1.024 request trong 1 giây và pool 20 connection; L21 có 340 hoá đơn trùng và `maxReceiveCount`; L12 có "giảm 56% bộ nhớ". Nghĩa là **artifact biết cách làm điều này** — nó chỉ không làm đều. Đây là việc sửa được bằng kỷ luật biên tập, không cần viết lại nội dung.

**2. Chặng 2 — backend FastAPI/Django/PostgreSQL.**
Năm bài L07–L11 trong khoảng **4856–4931** (≈ 75 dòng, ≈ 15 dòng/bài), **không có một `attacks` nào**, trong khi chặng Vue chiếm ~748 dòng cho 6 bài với `attacks` đầy đủ. Với một vị trí **Fullstack Engineer** mà backend là yêu cầu chính, đây là phân bổ ngược: mảng quan trọng nhất được luyện ít nhất. Hệ quả cụ thể là E02 (Pydantic v1/v2, 2458) và E03 (`def`/`async def`, 2483) tồn tại nhưng bị chặn trần độ sâu bởi chính chặng bị nén — trong khi `async def` gọi driver đồng bộ là lỗi **đắt nhất** trong danh sách này (ADV-16: p99 từ 180 ms lên 3,1 giây ở **mọi** endpoint).

**3. `attacks` — thành phần tốt nhất của artifact không tới được người học.**
17 khối `attacks` chất lượng cao tồn tại, tất cả ở `LESSONSARR`. **Không một câu hỏi nào trong 131 câu có `attacks`.** Và trong chính `LESSONSARR`, L07–L11 cũng không có. Nghĩa là nếu người học luyện theo cách tự nhiên nhất — mở `QUESTIONS`, trả lời miệng, đối chiếu `oral` — họ **chưa một lần** bị phản biện theo kiểu "bạn nói X, vậy khi nào X sai?". Đó chính xác là thứ người phỏng vấn trong brief làm. Artifact đã có sẵn khuôn mẫu đúng để sửa việc này; vấn đề là khối lượng (ADV-45 ước lượng 200–300 đoạn cho ~59 câu P0).

---

**File này:**
- **Findings:** 45 (cộng PHỤ LỤC A trả lời yêu cầu bổ sung của Lead — phân tầng 71 câu thiếu field, danh sách ưu tiên kèm dòng `incident` cần viết, và thứ tự viết bù)
- **Theo mức độ (sau đính chính ADV-16):** `critical` **9** · `major` **19** · `minor` **17**
- **Đính chính đã áp dụng:** ADV-16 hạ từ `critical` xuống `major`. Lý do: đo lại toàn bộ 131 câu cho thấy **60/60 câu P0 đều có đủ bốn field `incident` + `askFirst` + `predict` + `anchor`**; 71 câu thiếu là **50 P1 + 21 P2**. Bản đầu của finding này ghi sai rằng có P0 nằm trong nhóm thiếu. Chi tiết ở PHỤ LỤC A.
- **P0 shortlist:** 12 (bảng ở trên; ADV-16 không còn trong shortlist)
- **Đã kiểm chứng bằng grep/số đếm, không bằng cảm nhận:** số câu 131, số bài 22, **71/131 câu thiếu cả bốn field nhân quả (0 P0 / 50 P1 / 21 P2)**, 27/131 câu có `code: null`, 0/131 câu có `attacks`, 17 khối `attacks` đều nằm ở bài học, **0 con số giá AWS** trong toàn file, L07–L11 nằm giữa dòng 4856 và 4931, 14 câu tự mâu thuẫn cấu trúc (`type: predict` thiếu `predict`, `type: debug` thiếu `incident`).
- **Giới hạn của audit này:** đọc 22/22 bài học và khoảng 45/131 câu hỏi trực tiếp, phần còn lại kiểm chứng bằng đo đạc trên file (độ dài trường, sự hiện diện của `incident`/`predict`/`attacks`/`code`). Mọi con số dòng trong finding đều lấy từ file thật. Các con số kỹ thuật trong phần "vật liệu phải bổ sung" là kiến thức chuẩn của ngành (giới hạn Lambda, retention SQS, giá tham khảo) và **phải được kiểm tra lại theo Region và thời điểm** trước khi đưa vào artifact, vì giá và hạn mức AWS thay đổi.

---

# PHỤ LỤC A — Trả lời yêu cầu bổ sung của Lead

Lead cung cấp dữ kiện đo bằng Node: **71/131 câu thiếu cả bốn field `incident` + `askFirst` + `predict` + `anchor`.** Tôi đã đo lại độc lập bằng PowerShell trên chính file và **xác nhận con số 71**, đồng thời bổ sung phần phân tầng mà phép đo của Lead chưa tách ra.

## A.1 — ĐÍNH CHÍNH QUAN TRỌNG: giả định "P0 nằm trong 71 câu" là SAI

Cả tôi (trong bản đầu của ADV-16) lẫn giả định ngầm trong yêu cầu của Lead đều cho rằng nhóm 71 câu có chứa P0. **Đo lại thì không phải.**

| Phân tầng của 71 câu thiếu cả 4 field | Số câu |
|---|---|
| **P0** | **0** |
| **P1** | **50** |
| **P2** | **21** |

Và đối chiếu ngược: **60/60 câu P0 đều có đủ cả bốn field.**

**Điều này thay đổi cách đọc dữ kiện, và tôi phải nói rõ vì nó ảnh hưởng tới độ ưu tiên Lead sẽ dùng để viết bù:**

1. **Không có lỗ hổng ở tầng P0.** Câu hỏi tôi phải tự đặt lại cho chính mình: nếu 60 câu P0 đều đủ field, thì tại sao bài toán P0 (is/==, mutable default, closure, GIL, event loop, CORS, index/MVCC, Docker, IAM, Lambda, presigned URL) vẫn có 10 finding `critical`? Trả lời: vì **hai vấn đề khác nhau**. Việc thiếu field là vấn đề **cấu trúc dữ liệu**; các finding `critical` của tôi là vấn đề **nội dung bên trong những field đã có** — cụ thể là thiếu số (ADV-01, 02, 04, 05, 06, 11, 24) và thiếu `attacks` (ADV-07, 34, 45). Một câu P0 có `incident` đầy đủ **vẫn** có thể không dạy được người học cách trả lời "bao nhiêu mili giây". **Hai trục này độc lập.**

2. **Nhưng tầng P1 bị bỏ trống gần như hoàn toàn, và đó là vấn đề thật.** 50/50 câu P1 nằm trong nhóm thiếu field. Nghĩa là **không một câu P1 nào** có `incident`, `askFirst`, `predict` hay `anchor`. Đây không phải "hơn nửa file thiếu sót rải rác" — đây là **một tầng bị bỏ trống có hệ thống**.

3. **Vì sao P1 lại quan trọng với góc nhìn phỏng vấn:** P1 thường là câu hỏi dạng "cho tôi ví dụ" và "cho tôi con số" — đúng tầng mà người phỏng vấn dùng để đào sâu sau khi ứng viên đã trả lời đúng P0. Ứng viên P0 tốt mà P1 trống thì hình ảnh trong buổi phỏng vấn là **"biết khái niệm nhưng chưa từng làm"**.

## A.2 — TÁCH BẠCH HAI NGUYÊN NHÂN (theo đúng yêu cầu của Lead)

**Loại (a) — nội dung có nhưng nông, cần đào sâu:** đây là **toàn bộ 60 câu P0**, và cụ thể là 10 finding `critical` của tôi. Ở những câu này, `oral` và `deep` đã đúng và có chiều sâu thật; cái thiếu là **số** và **`attacks`**. Việc cần làm là **thêm chứ không viết lại**. Đã có vật liệu cụ thể trong ADV-01 → ADV-06, ADV-11, ADV-18, ADV-24.

**Loại (b) — khối nhân quả thiếu hẳn ở tầng dữ liệu, cần viết mới:** đây là **71 câu P1/P2**. Ở những câu này không có "nông" — mà là **không có gì**: người học đi thẳng `q` → `oral` → `deep`, đọc một câu trả lời đã viết sẵn, không có bước tự dự đoán, không có bài toán nào để cảm nhận vấn đề trước.

**Tôi xác nhận đánh giá của Lead rằng loại (b) nặng hơn — nhưng với một điều chỉnh quan trọng.** Lead nói loại (b) "chiếm hơn nửa file". Đúng về **số câu** (71/131 = 54%). Nhưng **không đúng về mức thiệt hại trong phỏng vấn**, vì:

- Loại (b) rơi vào P1/P2, tức **tầng ít được hỏi hơn và ít bị đào sâu hơn**.
- Loại (b) vẫn có `oral` và `deep` viết sẵn — người học **vẫn học được nội dung**, chỉ là học ở chế độ **đọc** thay vì chế độ **tự suy luận**.
- Loại (a) rơi vào P0 — tầng **chắc chắn được hỏi** cho vị trí này — và ở đó người học **không có số để bảo vệ một khẳng định đúng**. Đây là chế độ sập rõ ràng hơn: người học nói đúng câu, người phỏng vấn hỏi "bằng bao nhiêu", và không có gì để nói.

**Kết luận để Lead dùng cho thứ tự làm việc:** về **khối lượng** thì loại (b) lớn hơn; về **mức độ rủi ro trong buổi phỏng vấn** thì loại (a) ở tầng P0 nghiêm trọng hơn. Nếu chỉ đủ thời gian cho một việc, làm loại (a) trước. Nếu muốn làm đều, tỉ lệ hợp lý là **40% loại (a) / 60% loại (b)** theo khối lượng, nhưng loại (a) phải **xong trước**.

## A.3 — DANH SÁCH ƯU TIÊN: câu nghiêm trọng nhất trong 71 câu, kèm dòng `incident` cần viết

Xếp hạng theo **(mức bị hỏi trong phỏng vấn Fullstack) × (mức sập khi bị hỏi)**. Mỗi dòng là một câu chuyện có số, sẵn sàng để viết thành field `incident`.

### Nhóm 1 — Câu hỏi chắc chắn được hỏi, và sập hoàn toàn khi không có tình huống (9 câu)

**1. `F09` (dòng 2854) — P1 / L3 / `type: predict`**
> **Nghịch lý cấu trúc:** câu này khai `type: 'predict'` nhưng **không có field `predict`**. Đây là câu P1/L3 duy nhất thuộc loại này ở nhóm F. `q` đã có dạng tình huống ("Hai request cùng kiểm tra email chưa tồn tại rồi cùng INSERT") nhưng không có `incident`, nên người học không thấy **hậu quả**.
> **`incident` cần viết:** "9 giờ sáng thứ Hai, chiến dịch khuyến mãi đẩy 400 người đăng ký trong 90 giây, nhiều người bấm Đăng ký hai lần vì nút không tắt. Tới 11 giờ, bộ phận chăm sóc khách hàng phát hiện **37 email trùng** trong bảng `users`. Không có lỗi 5xx nào trong log, không có exception nào; cả 74 request đều trả 201. Nguyên nhân: code `SELECT` kiểm tra email rồi `INSERT`, và giữa hai câu lệnh luôn có khe hở; bảng chưa có ràng buộc `UNIQUE` nên cả hai lần ghi đều hợp lệ. Việc sửa mất 20 phút nhưng việc dọn 37 tài khoản trùng mất hai ngày vì phải hợp nhất lịch sử đơn hàng."

**2. `D11` (dòng 2358) — P1 / L3 / `type: situation`**
> **Vì sao nghiêm trọng:** idempotency key là câu hỏi thanh toán, luôn được hỏi với vị trí backend. `q` mô tả đúng tình huống ("khách bấm nút thanh toán hai lần") nhưng thiếu `incident` nên không có hậu quả và không có số.
> **`incident` cần viết:** "21 giờ Chủ nhật, một khách bấm Thanh toán hai lần vì nút không tắt khi mạng chậm. Cả hai request đều tới server và tạo **hai giao dịch 2.400.000 đồng** cho cùng một đơn hàng. Khách bị trừ tiền hai lần và gọi tổng đài; đội hỗ trợ phải hoàn tiền thủ công mất **45 phút** cho một giao dịch. Log cho thấy hai request giống hệt nhau, cách nhau **1,8 giây**, cùng payload, cùng `Authorization`, và **không có gì nối chúng lại** — không có header nào, không có ràng buộc nào ở database."

**3. `H08` (dòng 3529) — P1 / L3 / `type: situation`**
> **Vì sao nghiêm trọng:** migration và rollback là câu hỏi vận hành bắt buộc, và câu này hỏi đúng chỗ chết người ("deploy bản mới kèm migration xóa một cột, giờ cần rollback gấp"). Không có `incident` thì người học không cảm nhận được rằng **dữ liệu đã mất vĩnh viễn**.
> **`incident` cần viết:** "14 giờ 20 thứ Sáu, deploy bản mới kèm migration `DROP COLUMN phone_legacy` trên bảng `customers` **2,1 triệu dòng**. 45 phút sau phát hiện lỗi nghiêm trọng ở code mới và cần rollback gấp. Rollback code mất 3 phút và thành công — nhưng **cột `phone_legacy` không quay lại**. Bản backup gần nhất là 2 giờ sáng, nên khôi phục đồng nghĩa **mất toàn bộ dữ liệu 12 giờ** của 2,1 triệu khách. Đội chọn **không** khôi phục và chấp nhận mất cột đó, rồi viết lại từ một nguồn khác mất ba ngày. Bài học: rollback code và rollback database là hai việc khác nhau, và có những migration **không rollback được** — xóa cột, xóa bảng, đổi kiểu làm mất thông tin."

**4. `D10` (dòng 2341) — P1 / L3 / `type: debug`**
> **Nghịch lý cấu trúc:** khai `type: 'debug'` nhưng **không có `incident`** — một câu debug mà không có gì để debug.
> **`incident` cần viết:** "3 giờ sáng, dịch vụ thanh toán bên ngoài bị chậm: p99 từ 300 ms lên **12 giây**. Tới 3 giờ 20, **toàn bộ** API của công ty trả 500 — kể cả các endpoint không hề gọi dịch vụ thanh toán. Nguyên nhân: đoạn gọi dịch vụ thanh toán **không đặt timeout**, nên mỗi request treo giữ **một connection** của pool vô thời hạn. Pool 20 connection bị chiếm hết sau **20 request**, và mọi request sau đó chờ được cấp connection cho tới khi hết hạn ở tầng trên. Không có retry, không có backoff, không có circuit breaker. Việc sửa mất 10 phút (`timeout=2.0`), nhưng hệ thống đã chết 40 phút."

**5. `C11` (dòng 2093) — P1 / L2 / `type: situation`**
> **Vì sao nghiêm trọng:** đây là câu nối trực tiếp giữa Vue và chống trùng ở tầng API (dòng 5739 dùng chính `C11` làm `qids` của L22). Không có `incident` thì người học không thấy rằng chống double-submit ở frontend **không đủ**.
> **`incident` cần viết:** "Ngày ra mắt, 300 đơn hàng đầu tiên được tạo trong 10 phút. Trong đó có **9 đơn trùng**, mỗi đơn từ một người bấm Gửi hai lần trong khoảng **0,4 đến 1,2 giây**. Nút Gửi có `:disabled="loading"` nhưng `loading` chỉ bật **sau** khi hàm async chạy xong `await` đầu tiên — nên hai cú bấm trong cùng một tick đều lọt qua. Và vì API không có `Idempotency-Key`, server tạo hai đơn thật. Sửa ở frontend chỉ giảm được tần suất; chỉ khi thêm khoá idempotency ở server thì tỉ lệ trùng mới về 0."

**6. `E07` (dòng 2581) — P1 / L3 / `type: concept`**
> **Vì sao nghiêm trọng:** transaction nhiều bước là câu backend kinh điển, và ở L3 người phỏng vấn sẽ đào tới "nếu bước ba thất bại thì sao".
> **`incident` cần viết:** "Đợt flash sale, một sản phẩm có **50** suất nhưng nhận **180** đơn thành công trong 4 giây. Nguyên nhân: code đọc tồn kho rồi ghi đơn trong **hai transaction riêng** — `SELECT qty` ở transaction thứ nhất, `INSERT` đơn ở transaction thứ hai. Giữa hai transaction, nhiều request cùng thấy `qty = 50` và cùng bán. Kết quả: 130 khách đã trả tiền cho hàng không có, và đội phải hoàn tiền cho tất cả. Sửa: gộp đọc và ghi vào **một** transaction, và dùng điều kiện nguyên tử `UPDATE ... SET qty = qty - 1 WHERE qty >= 1` rồi kiểm tra số dòng bị ảnh hưởng, để không cần đọc trước."

**7. `H10` (dòng 3569) — P1 / L3 / `type: situation`**
> **Vì sao nghiêm trọng:** câu này hỏi đúng một tình huống nhưng lại **không có tình huống nào** ở tầng dữ liệu — người học phải tự bịa. Đây là câu về quy trình điều tra production, thứ mà người phỏng vấn rất hay hỏi.
> **`incident` cần viết:** "16 giờ 40, sau deploy lúc 16 giờ 30: tỉ lệ 5xx từ **0,2% lên 4,1%**, p99 latency từ **180 ms lên 2,4 giây**, RAM container tăng từ 380 MB lên 1,2 GB trong 10 phút. Dashboard có ba đường cong nhưng không đường nào tự nói nguyên nhân. Đối chiếu mốc thời gian: cả ba đổi **cùng lúc với deploy** — nhưng phải loại trừ lưu lượng (lưu lượng không tăng trong khung đó). Trace của request chậm nhất cho thấy **2,1 giây nằm ở nhịp database**, không phải ở code mới. Log lỗi lọc theo request id cho thấy cùng một truy vấn. Nguyên nhân: một chỉ mục bị bỏ trong migration. Sửa bằng rollback migration, không phải rollback code."

**8. `G12` (dòng 3231) — P1 / L2 / `type: debug`**
> **Nghịch lý cấu trúc:** `type: 'debug'` mà không có `incident`. Và VPC là chủ đề mà mọi triệu chứng giống nhau còn nguyên nhân khác nhau — không có tình huống thì không luyện được cây chẩn đoán (xem ADV-29).
> **`incident` cần viết:** "10 giờ 05, hàm Lambda xử lý hoá đơn bắt đầu timeout khi gọi API thuế bên thứ ba. **Security group đã mở outbound `0.0.0.0/0`**, đã kiểm tra ba lần. Triệu chứng cụ thể: mỗi lời gọi treo đúng **~2 giây** rồi trả lỗi kết nối. Con số 2 giây là manh mối quyết định: nếu là security group chặn thì sẽ treo **30–120 giây**, còn bị chặn ngay thì sẽ từ chối tức thời. Treo 2 giây nghĩa là **gói tin đi ra nhưng không có đường về** — subnet private thiếu `0.0.0.0/0` trỏ tới NAT Gateway. Sửa: thêm NAT Gateway vào public subnet và thêm route. Chi phí phát sinh: NAT tính khoảng **0,045 USD/giờ cộng 0,045 USD/GB**, tức khoảng **32 USD/tháng** cộng lưu lượng — nên với hàm chỉ gọi S3, dùng VPC Endpoint (miễn phí theo giờ ở dạng Gateway) rẻ hơn nhiều."

**9. `F05` (dòng 2779) — P1 / L3 / `type: concept`**
> **Vì sao nghiêm trọng:** đây chính là mảng của finding `critical` ADV-04 (chi phí của index). Câu hỏi đã đúng hướng nhưng không có số và không có tình huống.
> **`incident` cần viết:** "Bảng `events` phình từ 2 GB lên **14 GB** sau 6 tháng dù số dòng chỉ tăng 3 lần. Kiểm tra `pg_stat_user_indexes` thấy bảng có **11 chỉ mục**, trong đó **5 chỉ mục có `idx_scan = 0`** — chưa từng được dùng lần nào. Độ trễ ghi `INSERT` p99 đi từ **4 ms lên 21 ms** khi số chỉ mục tăng từ 2 lên 11, vì mỗi lần ghi phải cập nhật **11 cấu trúc** thay vì 1. Xoá 5 chỉ mục không dùng: đĩa giảm 3,1 GB, p99 ghi còn **9 ms**. Bài học: chỉ mục không dùng không phải là trung tính — nó chỉ tốn."

### Nhóm 2 — Câu P1/L3 có tác động rộng (8 câu)

**10. `B08` (dòng 1657) — P1 / L3 / `type: situation`**
> **`incident` cần viết:** "Người dùng gõ `áo` rồi `áo dài` trong 1,2 giây. Log API ghi **7 request** cho hai từ khoá, và request cuối cùng trả về **không phải kết quả mới nhất** — danh sách hiển thị kết quả của `áo` trong khi ô tìm kiếm ghi `áo dài`. Nguyên nhân không phải debounce thiếu: request của `áo` về muộn hơn request của `áo dài` vì mạng chập chờn, và nó **ghi đè** kết quả đúng. Sửa cần **ba** việc đồng thời — debounce (giảm tần suất), AbortController (huỷ request cũ), và kiểm tra phiên (bảo đảm đúng thứ tự) — trong đó hai việc sau mới là thứ sửa được tính đúng."

**11. `E08` (dòng 2598) — P1 / L2 / `type: concept`**
> **`incident` cần viết:** "14 giờ 20, sau khi chuyển một endpoint từ `def` sang `async def` để 'tăng hiệu năng', p99 của **toàn bộ** API đi từ 180 ms lên **3,1 giây** — kể cả các endpoint không chạm database. Nguyên nhân: trong `async def` có gọi một ORM **đồng bộ** (psycopg2). Lời gọi đó **chặn event loop**, mà event loop chỉ có một. Với 4 worker, hệ thống có đúng **4 chỗ chạy song song** thay vì hàng nghìn. Một truy vấn chậm 200 ms làm **mọi** request khác chờ 200 ms. Sửa rẻ nhất không phải viết lại code mà là đổi `async def` về `def` để FastAPI tự đẩy sang threadpool."

**12. `A11` (dòng 1265) — P1 / L3 / `type: concept`**
> **`incident` cần viết:** "Một lớp `Order` khai `items = []` ngay trong thân lớp thay vì trong `__init__`. Ngày đầu, mọi thứ đúng. Ngày thứ ba, một đơn hàng có **14 sản phẩm** trong khi khách chỉ đặt 3. Nguyên nhân: danh sách đó thuộc về **lớp**, không thuộc về instance, nên **mọi đơn hàng dùng chung một danh sách** và `append` tích tụ qua mọi request. Không có exception. Với 1.000 đơn hàng một ngày, dữ liệu sai lây sang **mọi** đơn sau đơn đầu tiên, và phải dọn tay 3.000 bản ghi."

**13. `F10` (dòng 2871) — P1 / L3 / `type: situation`**
> **`incident` cần viết:** "Hai nhân viên cùng mở một đơn hàng. Người A sửa địa chỉ và lưu lúc 10:00:03. Người B sửa số điện thoại và lưu lúc 10:00:04. Kết quả cuối: **địa chỉ cũ** và số điện thoại mới. Không ai báo lỗi, cả hai đều thấy 'Lưu thành công'. Nguyên nhân: lost update — mỗi lần lưu ghi **toàn bộ** bản ghi, nên lần ghi sau đè lên thay đổi của lần trước. Sửa bằng optimistic locking: thêm cột `version`, `UPDATE ... WHERE id = ? AND version = ?`, và kiểm tra số dòng bị ảnh hưởng; nếu 0 dòng thì trả **409** để client tải lại."

**14. `H12` (dòng 3609) — P2 / L3 / `type: situation`** *(nằm trong nhóm này vì L3 và vì nội dung là câu chuyện kể được)*
> **`incident` cần viết:** "Sau 3 ngày ra mắt, 12 phiếu phản hồi nói 'nút Lưu không phản hồi gì'. Điều tra: trên mạng 3G, lời gọi lưu mất **8 giây** nhưng **không có chỉ báo tải nào** — nút không đổi trạng thái. Người dùng bấm lại trung bình **2,3 lần**. Sửa theo hai bước: ngay trong ngày, thêm trạng thái loading và disable nút (giảm 80% số lần bấm lại); trong tuần, thêm khoá idempotency ở server vì sửa frontend không bảo đảm được gì. Số để đo cải thiện: tỉ lệ hàng trên số lượt bấm từ **2,3 về 1,0**."

**15. `E09` (dòng 2615) — P1 / L2 / `type: situation`**
> **`incident` cần viết:** "Hệ thống gửi **10.000 email hoá đơn mỗi ngày** bằng `BackgroundTasks` của FastAPI. Sau khi bật deploy tự động **10 lần/ngày**, kế toán báo thiếu hoá đơn. Không có lỗi trong log — vì task bị giết khi tiến trình restart thì **không có lần chạy nào để ghi log**. Tính ra: task 5 giây, restart 10 lần/ngày, xác suất mất một task ≈ 5/86.400 × 10 ≈ **0,06%**, tức khoảng **6 email mất mỗi ngày**. Cách phát hiện: đếm số task **được tạo** so với số task **hoàn thành** — khoảng cách chính là số đã mất, và không thể thấy bằng log lỗi."

**16. `G11` (dòng 3211) — P1 / L3 / `type: predict`**
> **Nghịch lý cấu trúc:** khai `type: 'predict'` nhưng **không có field `predict`**. `q` mô tả đúng tình huống ("Lambda trừ tiền được gọi bất đồng bộ, retry 2 lần, lần đầu timeout sau khi đã trừ tiền").
> **`incident` cần viết:** "11 giờ, một hàm Lambda trừ tiền chạy **8,2 giây** và bị timeout ở mốc **8 giây** — nhưng lệnh trừ tiền đã commit ở giây thứ **6**. Lambda cấu hình retry **2 lần** cho gọi bất đồng bộ, nên nó chạy lại và trừ tiền **lần thứ hai**. Sáng hôm sau, **14 khách** gọi tổng đài vì bị trừ tiền hai lần. Không có lỗi nào trong log — cả ba lần chạy đều 'thành công' theo cách nhìn của chính chúng. Sửa: chèn khoá nghiệp vụ trong **cùng transaction** với lệnh trừ tiền, để lần chạy thứ hai nhận ra mình là lần thừa và kết thúc im lặng."

**17. `J07` (dòng 3989) và `I06` (dòng 3754) — P1 / L3 / `type: concept`**
> **Vì sao gộp:** cả hai đều là câu `concept` ở L3 hỏi về **thiết kế** — đúng chỗ mà người phỏng vấn senior đào sâu nhất, và đúng chỗ mà không có tình huống thì câu trả lời chỉ là danh sách khái niệm.
> **`incident` cho `I06`:** "Một lớp `OrderProcessor` bị chia thành **11 lớp nhỏ** để 'tuân thủ SOLID'. Thêm một phương thức thanh toán mới cần sửa **7 file**. Một lập trình viên mất **2 ngày** để thêm một trường vào form, so với **2 giờ** trước khi tách. Đo được: số file phải chạm cho một thay đổi trung bình đi từ **1,8 lên 6,3**. Đây là over-engineering: SOLID là công cụ giảm chi phí thay đổi, và khi chi phí thay đổi **tăng** thì việc áp dụng đã đi quá xa."
> **`incident` cho `J07`:** "Sau 4 vòng phỏng vấn, ứng viên được hỏi 'vì sao bạn tách service ở đây'. Trả lời 'vì đó là best practice' bị đánh trượt; trả lời 'vì hai phần này có **nhịp thay đổi khác nhau** — phần báo cáo đổi 2 lần/năm, phần thanh toán đổi 2 lần/tuần, và mỗi lần chạm phần thanh toán chúng tôi phải chạy lại 40 test của phần báo cáo' được đánh đạt. Khác biệt không nằm ở kiến thức mà ở chỗ **gắn quyết định với một con số chi phí**."

### Nhóm 3 — Câu `type: predict` thiếu `predict` (6 câu, cùng một lỗi cấu trúc)

Đây là nhóm **tự mâu thuẫn rõ ràng nhất**: field `type` khai là `predict` nhưng **không có field `predict`**. Ở những câu này, người học **mất hẳn bước tự dự đoán** — đúng thứ mà `type` hứa sẽ có.

| Câu | Dòng | Prio/Level | `incident` cần viết (một dòng, có số) |
|---|---|---|---|
| `B13` | 1798 | P2/L2 | `structuredClone` trên object 50 MB mất **340 ms** còn vòng qua JSON mất **1,2 giây** và **làm mất `Date`** — bản ghi ngày sinh thành chuỗi, gây lỗi ở tầng sau |
| `D12` | 2375 | P2/L2 | Đặt rate limit **100 request/phút mỗi user**; 10.000 user ⇒ trần lý thuyết **1 triệu request/phút**, nhưng database chỉ chịu **800 truy vấn/giây** — và chỉ **160 người** hoạt động đồng thời là đã chạm trần |
| `F09` | 2854 | P1/L3 | *(đã có ở mục 1 — câu này vừa thiếu `predict` vừa `type: predict`)* |
| `G11` | 3211 | P1/L3 | *(đã có ở mục 2)* |
| `G14` | 3271 | P1/L2 | Hai nơi lưu secret: **Parameter Store** khoảng **0,05 USD/10.000 API call** không tính tiền theo secret, còn **Secrets Manager** khoảng **0,40 USD/secret/tháng** cộng xoay vòng tự động — với **12 secret**, chênh lệch khoảng **4,8 USD/tháng** nhưng đổi lấy xoay vòng tự động |
| `I05` | 3733 | P1/L1 | Chuẩn hoá và tách chuỗi trên **1 triệu dòng** CSV: ghép chuỗi bằng `+=` trong vòng lặp mất **12 giây**, dùng `"".join(list)` mất **0,4 giây** — nhanh hơn **30 lần** vì `str` là bất biến nên mỗi `+=` tạo object mới |

### Nhóm 4 — Câu `type: debug` thiếu `incident` (8 câu)

Một câu khai là `debug` mà không có gì để debug là lỗi cấu trúc tự thân. Ngoài `D10` (mục 1), `G12` (mục 1) và `F12` đã có ở trên, còn lại:

| Câu | Dòng | Prio/Level | `incident` cần viết (một dòng, có số) |
|---|---|---|---|
| `A16` | 1352 | P2/L3 | 100 tác vụ `asyncio` chạy đồng thời, mỗi tác vụ gọi hàm **chặn 50 ms** ⇒ tổng **5.000 ms** thay vì 50 ms; đổi sang `httpx.AsyncClient` còn khoảng **120 ms** — nhanh hơn **40 lần** |
| `B12` | 1770 | P2/L2 | Component mount/unmount **200 lần** trong 8 giờ; heap snapshot cho thấy số listener tăng đơn điệu từ **0 lên 200**, mỗi listener giữ cả một subtree DOM |
| `B14` | 1826 | P2/L3 | 40 request, 3 request đầu thất bại; `try/catch` quanh `await` bắt được, nhưng **37 request còn lại** không ai `await` nên sinh **37 unhandled rejection** và không có log nào |
| `D13` | 2392 | P2/L3 | Một truy vấn dựng chuỗi trực tiếp từ tham số; quét tự động tìm ra **1 điểm injection** ở tham số `sort` mà review thủ công đã bỏ qua 3 lần |

## A.4 — ƯU TIÊN VIẾT BÙ CHO LEAD (thứ tự thực thi đề xuất)

| Thứ tự | Việc | Số câu | Loại | Vì sao thứ tự này |
|---|---|---|---|---|
| **1** | Viết `attacks` cho câu P0 (ADV-45) | ~59 | (a) | Tác động lớn nhất tới khả năng sống sót trong phỏng vấn; P0 chắc chắn được hỏi |
| **2** | Thêm **số** cho P0 (ADV-01, 02, 04, 05, 06, 11, 24) | ~10 chủ đề | (a) | Cùng tầng P0; mỗi chủ đề là một đoạn ngắn, không cần viết lại |
| **3** | Mở rộng chặng 2 (L07–L11) + `attacks` (ADV-35/40) | 5 bài | (a)+(b) | Mảng chính của vị trí; hiện chỉ ~15 dòng/bài |
| **4** | Viết `incident` cho **17 câu ưu tiên cao nhất** (Nhóm 1 + 2 ở A.3) | 17 | (b) | Đã có sẵn dòng `incident` trong tài liệu này — viết thẳng vào file |
| **5** | Sửa 14 câu **tự mâu thuẫn cấu trúc** (`type: predict` thiếu `predict`, `type: debug` thiếu `incident`) | 14 | (b) | Lỗi cơ học, sửa nhanh, và mỗi câu đã có dòng gợi ý ở A.3 Nhóm 3 và 4 |
| **6** | Viết `incident` cho 54 câu P1/P2 còn lại | 54 | (b) | Khối lượng lớn nhất, ưu tiên thấp nhất vì rủi ro phỏng vấn thấp hơn |

**Một lưu ý kỹ thuật để Lead kiểm tra tính nhất quán:** các câu **có** `incident` (60 câu) phần lớn **cũng** có `askFirst`, `predict` và `anchor` đi kèm như một bộ bốn. Nếu Lead viết bù theo hướng "chỉ thêm `incident`", kết quả sẽ là 71 câu có tình huống nhưng **vẫn thiếu** `askFirst` (câu hỏi gợi mở), `predict` (bước tự dự đoán) và `anchor` (một dòng chốt). Theo cấu trúc của 60 câu P0 đang đúng, **bốn field này đi thành một bộ** — nên viết bù nên viết cả bộ, không chỉ `incident`. Nếu Lead muốn giảm khối lượng, thứ tự bỏ được là: `askFirst` (bỏ được, chỉ là gợi ý), rồi `predict` (mất bước tự dự đoán — đây là mất mát thật, xem ADV-07), nhưng **`anchor` không nên bỏ** vì nó là dòng duy nhất người học nhớ được dưới áp lực, và đó chính là thứ tự vệ cuối cùng trong phỏng vấn.
