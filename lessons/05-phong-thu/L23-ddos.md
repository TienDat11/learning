# L23: DDoS — bất đối xứng tài nguyên và tầng chặn sớm nhất

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ mở đầu bằng con số trần từng tầng (10 Gbps, 10.000 request/giây, 1.000 concurrency) trước khi giải thích vì sao phải đi tìm trần. Người đọc chưa biết "trần" để làm gì thì mọi phép chia chỉ là số học.
- **Nhảy bước:** phần cơ chế nhảy thẳng vào `scope-down statement`, `count all`, cửa sổ 60/120/300/600 giây mà chưa nói bộ đếm của WAF đếm theo *một đối tượng gom* — chính chi tiết đó mới giải thích vì sao botnet chia nhỏ đi qua được.
- **Thuật ngữ chưa giải thích:** `rate limiting`, `token bucket`, `WAF`, `ASN`, `TLS fingerprint`, `reserved concurrency`, `scope-down`, `volumetric / protocol / application`, `NAT`, `cache key`.
- **Thiếu ví von / ví dụ trực diện:** bản cũ nói "bất đối xứng là đơn vị đo" như một khẩu hiệu, không có hình ảnh nào cho thấy request rác chen vào cùng một hàng đợi với request thật. Sơ đồ Mermaid chỉ liệt kê tầng, không chỉ chỗ nghẽn.
- **Câu quá dài / khô:** "Lớp ứng dụng làm cạn CPU, hàng đợi và kết nối cơ sở dữ liệu bằng những request HTTP hoàn toàn hợp lệ" — ba tài nguyên trong một câu, không câu nào nói *vì sao* chúng cạn cùng lúc.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử ba giờ sáng thứ Bảy. Endpoint tra cứu sản phẩm công khai đang phục vụ 90 request mỗi giây. Bốn phút sau, con số là 14.000 request mỗi giây.

Dashboard vẫn xanh. Hàm trả 200. p99 mỗi hàm dưới 120 ms. Không dịch vụ nào báo lỗi.

Nhưng tỉ lệ người thật hoàn tất được một lần tìm kiếm rơi từ 99% xuống 4%.

Log cổng vào cho thấy 96% request đến từ khoảng 40.000 địa chỉ IP, mỗi địa chỉ gửi đúng một request mỗi ba giây. Luật `rate limiting` (giới hạn số request cho phép trong một khoảng thời gian) đang đặt 1.000 request mỗi 5 phút cho mỗi IP. Không IP nào chạm ngưỡng, nên số 429 gần như bằng không.

**Câu hỏi dự đoán:** tài nguyên nào đã cạn, khi mọi hàm vẫn trả 200?

**Đáp án:** không phải CPU của từng hàm. Cái cạn là tài nguyên *dùng chung phía sau* — hàng đợi và số kết nối tới cơ sở dữ liệu. Request thật xếp sau hàng nghìn request rác trong cùng một hàng.

(Mọi con số trong bài là giả định của kịch bản — cần kiểm tra lại trên hệ thống thật.)

### 2. Phép ví von đời thường & Sơ đồ chữ

Một tòa nhà chỉ có **một thang máy**. Kẻ xấu không cần chen vào thang máy. Chúng chỉ cần xếp hàng liên tục, để cư dân thật không tới lượt.

*Giới hạn của phép ví von:* hàng người thật thì đếm được và nhìn mặt được, còn ở đây mỗi request rác trông y hệt request thật.

```text
Người thật ─┐
            ├→ [Biên: cache] → [WAF: đếm] → [Cổng vào] → [Hàm] → [Bể kết nối] → [DB]
Request rác ┘        │                │
                     │                └ mỗi IP đều dưới ngưỡng → không chặn ai
                     └ chuỗi ngẫu nhiên → cache miss → mọi request đi tiếp
                                                        ↑
                                              chỗ nghẽn thật: bể kết nối
```

Đọc sơ đồ từ trái sang phải: mỗi mũi tên là một lần tài nguyên bị chạm, mỗi khớp là một chỗ có thể dừng lưu lượng.

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Đo ba đường cong:** bit mỗi giây, gói mỗi giây cùng số kết nối nửa mở, và request mỗi giây trên một route đắt. Ba đường này nói tấn công đang đánh vào lớp nào.
- **Bước 2 — Hấp thụ ở biên:** `WAF - Web Application Firewall` (tường lửa ứng dụng web chặn ở rìa mạng) và CloudFront đứng trước origin. Điều kiện để có ích là `cache key` (khóa dùng để tra bản cache) ổn định — chuỗi truy vấn ngẫu nhiên phá đúng điều kiện đó.
- **Bước 3 — Đếm theo tổng:** mỗi bộ đếm gắn với một đối tượng gom. Mặc định đối tượng đó là IP, nên 40.000 IP chia nhỏ thì không bộ đếm nào thấy gì.
- **Bước 4 — Đặt trần ở tầng trong:** `token bucket` (thuật toán xô thẻ bài: cho phép nổ lưu lượng ngắn hạn nhưng giữ tốc độ trung bình) ở cổng vào, `reserved concurrency` (số đơn vị đồng thời giữ riêng cho một hàm) ở Lambda, trần kết nối ở cơ sở dữ liệu. Trần đúng là trần của tầng thấp nhất.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** nâng trần từng tầng và đi tìm IP để chặn. Nâng trần chỉ dời điểm sập xuống tầng dưới, nơi trần cứng hơn. Tìm IP thì không có IP nào để tìm, vì có 40.000 IP.
- **Cách tốt:** chặn theo *tổng* ở biên (đếm toàn bộ request khớp một phạm vi), đồng thời đặt trần cứng ở tầng dữ liệu. Cách này giải quyết tận gốc vì nó đo đúng thứ đang thiếu — tài nguyên dùng chung.
- **Kiểm chứng bằng code (chạy thật):** script chỉ dùng thư viện chuẩn, không gọi AWS, không có lưu lượng thật. Đây là **mô phỏng** trần theo tầng và một bộ đếm cửa sổ cố định.

```text
cd lessons/05-phong-thu/l23
python ddos_budget.py
```

Kết quả chạy trên máy này:

```text
MÔ PHỎNG bằng thư viện chuẩn. Không gọi AWS, không có lưu lượng thật.

=== Tham số giả định (mọi con số dưới đây là giả định của kịch bản) ===
  Edge        : 10 Gbps, mỗi request 12 KB
  Gateway     : 10,000 request/giây (hạn mức ổn định)
  Lambda      : trần 1,000 concurrency, p99 0.12 s, 10 request/giây mỗi đơn vị
  DB          : 200 kết nối, một truy vấn 50 ms
  Người thật  : 300 người sau một NAT chung, mỗi người 0.5 request/giây
  Tấn công    : 40,000 IP, mỗi IP 1 request mỗi 3 giây
  Quy tắc     : 1,000 request mỗi IP mỗi cửa sổ 60 giây

=== Trần request mỗi giây của từng tầng ===
  Edge (băng thông)            101,725   (bit/giây chia cho byte mỗi request)
  Gateway (hạn mức)             10,000   (hạn mức ổn định của tài khoản)
  Lambda (concurrency/p99)       8,333   (trần concurrency chia p99)
  Lambda (lượt gọi)             10,000   (10 request/giây mỗi đơn vị)
  DB (kết nối/truy vấn)          4,000   (trần kết nối chia thời gian một truy vấn)
  => trần thật của hệ thống: 4,000 request/giây, ở tầng DB (kết nối/truy vấn)
  => tầng nào vượt trần thật trước thì tầng đó quyết định, không phải tầng to nhất

=== Đếm theo IP, cửa sổ cố định ===
  Ngưỡng 1,000 request mỗi IP mỗi 60 giây; 300 người thật dùng chung một IP NAT.

  Kết quả:
  cửa sổ    thật gửi  thật qua  thật bị chặn  tấn công gửi  tấn công lọt  tấn công bị chặn
  0            9,000     1,000         8,000       800,000       800,000                 0
  1            9,000     1,000         8,000       800,000       800,000                 0
  2            9,000     1,000         8,000       800,000       800,000                 0
  Tổng người thật bị chặn : 24,000 / 27,000 (88.9%)
  Tổng tấn công lọt       : 2,400,000 / 2,400,000 (100.0%)
  Người thật bị chặn lần đầu ở giây thứ 6

=== Nâng ngưỡng để cứu NAT ===
  Ngưỡng 10,000 request mỗi IP mỗi 60 giây.

  Kết quả:
  cửa sổ    thật gửi  thật qua  thật bị chặn  tấn công gửi  tấn công lọt  tấn công bị chặn
  0            9,000     9,000             0       800,000       800,000                 0
  1            9,000     9,000             0       800,000       800,000                 0
  2            9,000     9,000             0       800,000       800,000                 0
  Tổng người thật bị chặn : 0 / 27,000 (0.0%)
  Tổng tấn công lọt       : 2,400,000 / 2,400,000 (100.0%)

=== Đổi kiểu gom: đếm toàn bộ request khớp một phạm vi ===
  Ngưỡng 5,000 request mỗi 60 giây, không chia theo IP.

  Kết quả:
  cửa sổ    thật gửi  thật qua  thật bị chặn  tấn công gửi  tấn công lọt  tấn công bị chặn
  0            9,000       150         8,850       800,000         4,850           795,150
  1            9,000       150         8,850       800,000         4,850           795,150
  2            9,000       150         8,850       800,000         4,850           795,150
  Tổng người thật bị chặn : 26,550 / 27,000 (98.3%)
  Tổng tấn công lọt       : 14,550 / 2,400,000 (0.6%)
  Người thật bị chặn lần đầu ở giây thứ 1

=== Biên cửa sổ cố định ===
  Ngưỡng 1,000 request mỗi cửa sổ 60 giây, một IP.
  Gửi 1,000 request ở giây 59 của cửa sổ 1: qua.
  Gửi 1,000 request ở giây 60 (cửa sổ 2): qua.
  => trong 2 giây, một IP đẩy được 2,000 request, gấp đôi ngưỡng.
  Bộ đếm bị xoá theo mốc thời gian, không theo tốc độ.

=== Đọc kết quả ===
  Chặn theo IP: người thật mất 88.9% request, tấn công lọt 100.0% request.
  Cái mất nằm ở phía người thật, cái được nằm ở phía kẻ tấn công.
  Chặn sớm chỉ rẻ khi tầng chặn còn phân biệt được hai phía.
```

Ba điều đáng đọc trong kết quả:

- **Trần thật là 4.000**, ở tầng cơ sở dữ liệu — không phải 10.000 ở cổng vào. Đặt cảnh báo ở 10.000 là đặt sai chỗ.
- **Chặn theo IP:** người thật mất 88,9% request, tấn công lọt 100%. Cái mất nằm ở phía người thật.
- **Đếm toàn bộ:** tấn công lọt còn 0,6%, nhưng người thật bị chặn 98,3% ngay từ giây đầu. Đó là cái giá của chặn sớm: đúng chỗ, nhưng mù.

**Tự thử:** đổi `REAL_USER_RPS` từ 0,5 xuống 0,1 rồi chạy lại. Tỉ lệ người thật bị chặn giảm bao nhiêu, và vì sao ngưỡng 1.000 vẫn chặn gần một nửa?

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** tầng trong còn sống cho người thật. Sập toàn phần biến thành từ chối có kiểm soát. Hóa đơn nằm trong một khoảng biết trước.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** biên nhìn ít ngữ cảnh nên chặn nhầm. Mọi lớp phán quyết tính tiền theo request hoặc theo GB log, cộng thêm độ trễ, và tạo ra một hệ thống phải có người chỉnh ngưỡng.
- **Khi nào KHÔNG nên dùng:** dịch vụ nội bộ ít người dùng — chỉ cần trần và cảnh báo. Khi chưa có đường nền theo giờ — mọi ngưỡng chỉ là số đoán. Khi lưu lượng hợp lệ đã sát trần — việc cần làm là giảm chi phí mỗi request trước. Và với client không chạy JavaScript, đừng chọn hành động thử thách.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Cuộc tấn công trong sự cố khai thác bất đối xứng nào, và vì sao nhìn 5xx hay nhìn IP đều không thấy nó?

- **Trả lời mẫu (30–60 giây):** Đó là bất đối xứng tầng ứng dụng cộng bất đối xứng số lượng nguồn. Mỗi request hợp lệ nhưng buộc tôi chạy một truy vấn không cache được và giữ một kết nối cơ sở dữ liệu. Nhìn 5xx không thấy vì hàm vẫn trả 200; cái sụp là tỉ lệ hoàn tất nghiệp vụ. Nhìn IP cũng không thấy vì 40.000 nguồn, mỗi nguồn một request mỗi ba giây.
- **Lỗi hay mắc khi trả lời:** nói "bị DDoS nên quá tải" rồi dừng. Cách nói đúng: gọi tên tài nguyên chia sẻ cụ thể là hàng đợi và bể kết nối.

### Câu 2: Với endpoint tra cứu không cache được, bạn đặt chặn ở đâu trước và cấu hình gì ở từng tầng?

- **Trả lời mẫu (30–60 giây):** Tôi đi từ ngoài vào. Trước tiên là cache key: chỉ đưa tham số hợp lệ vào khóa, việc này không chặn ai. Sau đó WAF đếm tổng kèm `scope-down` (thu hẹp phạm vi request mà luật áp dụng) trên đúng route đắt. Rồi cổng vào throttle và trả 429 theo từng method. Cuối cùng là reserved concurrency cho hàm đắt và trần kết nối cơ sở dữ liệu.
- **Lỗi hay mắc khi trả lời:** kể tên dịch vụ mà không nói ngưỡng lấy từ đâu. Cách nói đúng: ngưỡng lấy từ trần tầng thấp nhất, và nêu dấu hiệu kiểm chứng — số 429 tăng ở route đắt trong khi tỉ lệ hoàn tất của người thật không giảm.

### Câu 3: Nếu kẻ tấn công dùng cookie hợp lệ, `TLS fingerprint` (dấu vân tay của phiên bắt tay TLS) giống Chrome thật và mỗi IP chỉ gửi một request mỗi phút, luật nào còn tác dụng?

- **Trả lời mẫu (30–60 giây):** Luật theo IP và theo dấu vân tay mất tác dụng. Còn tác dụng là bộ đếm đếm toàn bộ request khớp phạm vi, trần concurrency, trần kết nối và hạn mức theo khóa API. Nhưng chúng sẽ chặn cả người thật, nên mục tiêu đổi từ chặn sang giữ hệ thống sống. Tôi thêm gom theo `ASN` (mã nhà mạng sở hữu dải IP) và đọc phễu nghiệp vụ.
- **Lỗi hay mắc khi trả lời:** khẳng định có cách tách bot hoàn hảo. Cách nói đúng: bot chạy trình duyệt thật không tách được tuyệt đối, nên chấp nhận một phần người thật bị thử thách.

### Câu 4: Vì sao không thể đẩy hết phán quyết ra biên, và cái giá cụ thể của việc chặn sớm là gì?

- **Trả lời mẫu (30–60 giây):** Biên nhìn ít ngữ cảnh hơn tầng trong. Nó không biết người dùng đã đăng nhập hay đang trả gói nào, cũng không biết route này đắt gấp trăm lần route kia. Cái giá của chặn sớm là chặn nhầm, tiền request, tiền log và công chỉnh ngưỡng. `NAT` (cơ chế nhiều máy dùng chung một địa chỉ IP ra internet) làm chặn nhầm phổ biến hơn.
- **Lỗi hay mắc khi trả lời:** nói "chặn ở biên là rẻ nhất" mà bỏ qua chặn nhầm. Cách nói đúng: nêu cả hai phía, rồi nói cách chọn — so thiệt hại mỗi phút ngừng phục vụ với chi phí phòng thủ cộng rủi ro chặn nhầm.

---
## Ghi chú nguồn

- https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html — rate-based rule gom request theo tiêu chí, đếm trong cửa sổ đánh giá, nhận scope-down statement.
- https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based-aggregation-options.html — mặc định gom theo địa chỉ IP nguồn; có ASN, forwarded IP, custom keys; kiểu đếm toàn bộ yêu cầu scope-down.
- https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based-high-level-settings.html — cửa sổ nhận 60, 120, 300, 600 giây, mặc định 300; ngưỡng thấp nhất là 10; ngưỡng được áp gần đúng.
- https://docs.aws.amazon.com/waf/latest/developerguide/ddos-standard-summary.html — Shield Standard bật sẵn, không tính thêm phí; CloudFront, Route 53, Global Accelerator được bảo vệ đầy đủ hơn.
- Script `lessons/05-phong-thu/l23/ddos_budget.py`: chạy thật trong phiên này, output ở Phần 2 mục 4 là kết quả của lần chạy đó.

Chưa kiểm trong bài: hạn mức throttle cụ thể của API Gateway và trần concurrency mặc định của tài khoản Lambda; giá của WAF và Shield Advanced; hành vi chính xác của cửa sổ trượt so với cửa sổ cố định trong WAF.
