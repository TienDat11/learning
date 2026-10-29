# L01: Một request đi qua những dịch vụ nào, và vì sao tăng Lambda làm nghẽn RDS

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** Bước 3 đi thẳng vào phép nhân `200 × 0,6 = 120` mà chưa nói vì sao concurrency lại bằng số request mỗi giây nhân thời gian một lần gọi. Người đọc phải tự tin vào công thức trước khi hiểu nó đến từ đâu. Bước 4 mục 5 lại đưa `reserved concurrency` và `RDS Proxy` như hai lời giải có sẵn, trong khi bài chưa nói `connection pool` (hồ giữ sẵn kết nối để dùng lại) là gì.
- **Thuật ngữ chưa giải thích:** `concurrency`, `execution environment`, `connection pool`, `reserved concurrency`, `throttle`, `RDS Proxy`, `Multi-AZ`, `standby`, `failover`, `Availability Zone`, `p99`, `504`. Trong đó `p99` và `throttle` xuất hiện mà không có một dòng tiếng Việt nào bên cạnh.
- **Thiếu ví von / ví dụ trực diện:** bài không có một phép ví von đời thường nào. Sơ đồ duy nhất là khối `mermaid`, thứ không hiển thị ở nhiều trình đọc markdown và không in ra giấy được. Cách tệ và Cách tốt không được đặt cạnh nhau; cách tệ chỉ tồn tại trong `naiveCode` của app.
- **Câu quá dài / khô:** đoạn "Multi-AZ DB instance có một standby đồng bộ ở AZ khác, và standby không phục vụ đọc. Khi failover, RDS đổi bản ghi DNS sang standby. Thời gian thường 60–120 giây, và kết nối đang mở phải mở lại." nhồi bốn ý trong ba câu liền nhau, không ý nào được đứng riêng để người đọc kịp tiêu hoá. Ngoài ra các ghi chú nội bộ kiểu `[INFERENCE: chưa đọc trang giá RDS Proxy]` lẫn vào thân bài, làm người học tưởng đó là nội dung cần nhớ.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử bạn có một endpoint đăng ký upload. Trình duyệt gọi nó, nó ghi một dòng vào PostgreSQL rồi trả về. Ngày thường 60 request mỗi giây, mọi thứ êm.

Hôm sale, lưu lượng lên 200 request mỗi giây trong bốn phút. Bạn nhìn dashboard: Lambda vẫn trả 200, thời gian chạy mỗi lần gọi vẫn 600 ms, CPU của RDS vẫn 35 phần trăm. Không có gì đỏ.

Nhưng người dùng thấy p99 (phân vị 99 — chậm hơn 99 phần trăm số request còn lại) từ 180 ms nhảy lên 4,2 giây. Một phần request bị treo tới khi API Gateway trả 504 (mã lỗi "gateway chờ quá lâu").

Đau ở đâu? Đau ở chỗ **không có dịch vụ nào tự nhận mình là nút thắt**. Mỗi dịch vụ chỉ nhìn thấy phần việc của nó. Khi bạn không biết request đang xếp hàng ở khớp nào, bạn sẽ đi nâng cấp đúng cái không phải nguyên nhân.

**Câu hỏi dự đoán:** Trong chuỗi trình duyệt, API Gateway, Lambda, RDS, khớp nào có thể đang xếp hàng mà không đổi màu trên dashboard của chính nó?
**Đáp án:** khớp Lambda đi vào RDS. Lambda không thấy mình chờ, vì nó chỉ đo thời gian code chạy. RDS không thấy mình quá tải, vì CPU còn thấp. Cái chờ nằm ở giữa: xin một kết nối.

### 2. Phép ví von đời thường & Sơ đồ chữ

Hãy nghĩ tới một bãi đỗ xe 40 chỗ trước một toà nhà. Lambda là dòng khách đến liên tục. Mỗi khách lái một xe, và **giữ chỗ cho tới khi rời đi**. RDS là bãi đỗ: nó chỉ có 40 vạch kẻ.

Khi khách đông gấp ba, bạn không làm bãi rộng ra bằng cách mở thêm cửa cho khách vào. Khách vẫn phải xếp hàng ngoài cổng, và hàng càng dài thì người đến sau càng lâu được phục vụ.

*Giới hạn của phép ví von:* xe trong ví dụ giữ chỗ mãi mãi, còn kết nối thật có thể bị đóng khi rảnh quá lâu; lúc đó con số kết nối tụt xuống và bài toán nhẹ đi tạm thời.

```text
Trình duyệt
   │  HTTPS
   ▼
API Gateway                    ← AWS vận hành máy chủ; bạn cấu hình route, quyền
   │
   ▼
Lambda  ×120 environment       ← mỗi environment còn ấm giữ 1 kết nối riêng
   │
   │  120 kết nối cùng đòi một lúc
   ▼
RDS PostgreSQL  max_connections = 40    ◄── TRẦN: chỉ 40 chỗ
   │
   └─ 80 lần gọi phải chờ ở đây
      → p99 tăng, dashboard của Lambda và RDS vẫn xanh
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Một request chiếm một chỗ trong một khoảng thời gian:** khi một request đang được xử lý, nó chiếm một suất. Suất đó được nhả khi request xong. Đây là toàn bộ ý của chữ `concurrency` (số lần gọi chạy cùng một lúc).
- **Bước 2 — Số suất đang bận bằng tốc độ đến nhân thời gian phục vụ:** nếu mỗi giây có 200 request và mỗi request chiếm suất 0,6 giây, thì tại một thời điểm trung bình có 200 × 0,6 = 120 request đang chiếm suất. Không cần công thức lạ: đó chỉ là phép đếm.
- **Bước 3 — Lambda cấp một `execution environment` cho mỗi suất:** environment (môi trường chạy riêng của một lần gọi Lambda) là một tiến trình nhỏ, mỗi lúc chỉ phục vụ một request. Cần 120 suất thì Lambda tạo khoảng 120 environment.
- **Bước 4 — Environment được tái dùng, nên những gì bạn mở bên ngoài handler sẽ sống tiếp:** kết nối mở ở ngoài `handler` thuộc về environment, không thuộc về request. Request xong, kết nối vẫn còn. Vì vậy 120 environment có thể giữ 120 kết nối cùng lúc.
- **Bước 5 — Trần kết nối là con số cố định ở cuối chuỗi:** `max_connections` của RDS không tự nới theo lưu lượng. Nó đổi khi bạn đổi tham số hoặc đổi cỡ instance. Trong kịch bản này nó là 40 (con số giả định của kịch bản — cần kiểm tra lại trên hệ thống thật).
- **Bước 6 — Vượt trần thì phải chờ, và chờ làm mọi thứ tệ hơn:** 120 environment đòi 120 kết nối, chỉ 40 được cấp, 80 lần gọi phải chờ. Chờ làm mỗi lần gọi lâu hơn. Lâu hơn thì concurrency lại cao hơn. Đây là vòng tự đẩy mình lên, không phải một phép nhân yên tĩnh.
- **Bước 7 — Có hai cách đặt trần, cả hai đều có giá:** đặt trần ở Lambda bằng `reserved concurrency` (số environment tối đa dành riêng cho hàm), hoặc đặt một khớp gom kết nối là RDS Proxy. Cách một để Lambda tự từ chối bớt request. Cách hai để proxy xếp hàng phần vượt.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** thấy p99 tăng thì nâng trần concurrency của hàm, vì Lambda là tầng duy nhất đang được nhìn.

```bash
# Kịch bản giả định: p99 tăng trong khi dashboard Lambda vẫn xanh.
aws lambda put-function-concurrency \
  --function-name upload-register \
  --reserved-concurrent-executions 400
# Không bước nào đọc số kết nối đang dùng của RDS.
```

Điều gì xảy ra: số lần gọi đồng thời nhảy từ 12 lên 380 trong hai phút, p99 tăng thêm, tỉ lệ 504 tăng, log có `FATAL: sorry, too many clients already` ở khoảng 3 phần trăm số lần gọi. Dashboard của Lambda vẫn sạch, vì lỗi xảy ra ở phía cơ sở dữ liệu.

Vì sao hỏng: bạn vừa mở thêm cửa cho khách vào một bãi đỗ vẫn 40 chỗ. Thêm environment là thêm client cùng đòi một tài nguyên có trần.

- **Cách tốt:** đặt trần ở phía gọi, nhỏ hơn số kết nối thật còn chỗ, để Lambda từ chối trước khi RDS phải từ chối.

```bash
# Đọc trần thật trước, rồi mới chọn số.
aws rds describe-db-instances \
  --db-instance-identifier upload-db \
  --query 'DBInstances[0].DBInstanceClass'

# Chừa chỗ cho vận hành và cho lưu lượng tăng: đặt trần thấp hơn max_connections.
aws lambda put-function-concurrency \
  --function-name upload-register \
  --reserved-concurrent-executions 30
```

Vì sao đúng: request vượt trần bị chặn ngay ở cổng vào của Lambda. RDS không bao giờ thấy quá 30 kết nối từ hàm này. Bạn đổi một lỗi khó đọc ở cuối chuỗi thành một tín hiệu rõ ở đầu chuỗi: throttle.

- **Kiểm chứng bằng code (chạy thật):** chạy trong `lessons/01-aws/l01/`.

```bash
python little_law.py --rps 200 --wall 0.6 --max-conn 40
```

Kết quả (output thật của script này, ghi lại từ lần chạy trên máy):

```text
Giả định: 200 request/s, mỗi lần gọi 0.6 s, RDS max_connections = 40
Environment cần (rps x W):              120
Kết nối cần (mỗi environment ấm giữ 1): 120
Lần gọi không có kết nối:              80
Vượt trần: mỗi environment ấm giữ một kết nối, nên tăng Lambda là tăng kết nối; lần gọi dư phải chờ hoặc lỗi.
```

Đổi thời gian mỗi lần gọi xuống 0,2 giây:

```bash
python little_law.py --rps 200 --wall 0.2 --max-conn 40
```

```text
Giả định: 200 request/s, mỗi lần gọi 0.2 s, RDS max_connections = 40
Environment cần (rps x W):              40
Kết nối cần (mỗi environment ấm giữ 1): 40
Lần gọi không có kết nối:              0
Vừa khít trần: không còn chỗ cho kết nối vận hành hay lưu lượng tăng thêm.
```

Hai lần chạy cho thấy điều quan trọng: cùng 200 request mỗi giây, chỉ cần giảm thời gian xử lý từ 0,6 xuống 0,2 giây là số environment rơi từ 120 xuống 40. Làm code nhanh hơn cũng là một cách giảm áp lực lên trần, không chỉ có nâng cấp database.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** Lambda cộng API Gateway cho bạn trả tiền theo mức dùng và không phải vá hệ điều hành. Multi-AZ cho bạn một bản dự phòng ở Availability Zone (AZ — trung tâm dữ liệu độc lập về điện và mạng) khác.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** mỗi environment là một client riêng, nên số kết nối downstream tỉ lệ với lưu lượng chứ không tỉ lệ với tham số pool trong code. RDS Proxy thêm một khớp phải cấu hình, theo dõi, và có phí; khi vượt hạn mức thì chính proxy từ chối kết nối. Reserved concurrency thấp thì request vượt trần bị throttle ngay. Multi-AZ có thêm độ trễ ghi vì phải đồng bộ sang standby, và standby không phục vụ đọc.
- **Khi nào KHÔNG nên dùng:** đừng đặt RDS Proxy khi nút thắt là truy vấn thiếu index hoặc IO của ổ đĩa — proxy chỉ làm hàng đợi dài hơn. Đừng chọn Multi-AZ với ý định mở rộng đọc; muốn đọc nhiều hơn thì dùng read replica. Đừng đặt reserved concurrency bằng đúng `max_connections`; luôn chừa chỗ cho vận hành.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao mỗi environment Lambda có thể giữ một kết nối riêng, còn trên một máy chủ thì nhiều request dùng chung một pool?

- **Trả lời mẫu (30–60 giây):** Environment là một tiến trình được tái dùng, không phải một request. Kết nối mở ngoài handler thuộc về tiến trình đó, nên nó sống qua các lần gọi và không chia sẻ socket với environment khác. Trên một máy chủ, một tiến trình phục vụ nhiều request nên chỉ cần một pool chung, và tham số pool mới là trần. Vì vậy trên Lambda, trần kết nối do lưu lượng quyết định, không do code quyết định.
- **Lỗi hay mắc khi trả lời:** nói "Lambda có connection pool" mà không nói pool đó thuộc về một environment. Cách nói đúng: mỗi environment giữ tối đa một kết nối, và số kết nối bằng số environment còn ấm.

### Câu 2: Cho tôi một cách đặt trần để việc tăng Lambda không đè bẹp RDS.

- **Trả lời mẫu (30–60 giây):** Tôi đặt trần ở phía gọi, không ở phía database. Cách một là reserved concurrency thấp hơn số kết nối còn chỗ, để Lambda throttle trước khi RDS phải từ chối. Cách hai là RDS Proxy giữ một bể kết nối thật và xếp hàng phần vượt. Cả hai đều cần một dữ kiện: `max_connections` thật và số kết nối các thành phần khác đang chiếm. Khi lưu lượng vượt trần, tôi muốn thấy throttle ở Lambda chứ không phải lỗi kết nối ở RDS.
- **Lỗi hay mắc khi trả lời:** đặt reserved concurrency bằng đúng `max_connections`. Cách nói đúng: luôn trừ phần dành cho vận hành, migration và các client khác.

### Câu 3: Nếu AZ chứa primary mất điện đúng lúc 380 environment đang giữ kết nối thì client thấy gì?

- **Trả lời mẫu (30–60 giây):** Multi-AZ chuyển sang standby, RDS đổi bản ghi DNS sang instance mới, và mọi kết nối đang mở đều chết. Failover thường mất 60–120 giây. Trong khoảng đó client nhận lỗi kết nối; sau đó client phải phân giải lại tên miền, nên tiến trình cache DNS lâu sẽ còn gọi địa chỉ cũ. Nếu không có proxy, hàng trăm environment cùng mở lại kết nối và có thể đụng trần lần nữa. Nếu có proxy, kết nối từ ứng dụng tới proxy có thể được giữ và proxy nối lại tới standby.
- **Lỗi hay mắc khi trả lời:** nói "RDS Proxy lo failover". Cách nói đúng: Multi-AZ mới là thứ có standby để chuyển; proxy chỉ giữ kết nối phía ứng dụng.

### Câu 4: Đặt RDS Proxy rồi thì còn trường hợp nào vẫn nghẽn?

- **Trả lời mẫu (30–60 giây):** Còn, vì proxy chỉ giải bài toán số kết nối. Nó không thêm CPU, IO hay năng lực truy vấn cho instance. Nếu nút thắt là truy vấn thiếu index thì proxy chỉ làm hàng đợi dài hơn và p99 vẫn cao. Proxy cũng từ chối kết nối của ứng dụng khi vượt hạn mức, nên code vẫn phải xử lý lỗi đó. Với PostgreSQL, câu lệnh lớn hơn 16 KB làm proxy ghim session vào một kết nối, nên khả năng chia sẻ giảm.
- **Lỗi hay mắc khi trả lời:** coi proxy là vạn năng. Cách nói đúng: kiểm tra lại biểu đồ sau khi đặt proxy — nếu số kết nối phẳng mà CPU hoặc độ trễ đọc vẫn cao thì nút thắt đã chuyển chỗ.

---
## Ghi chú nguồn

- Concurrency và công thức: https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html
- Reserved concurrency và throttle: https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html
- Vòng đời environment, khởi tạo ngoài handler, tái dùng: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html
- Lambda với RDS, khuyến nghị dùng proxy: https://docs.aws.amazon.com/lambda/latest/dg/services-rds.html
- RDS Proxy: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html
- Multi-AZ DB instance, standby không phục vụ đọc: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html
- Failover, 60–120 giây, đổi DNS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html

Mọi con số trong bài (200 request mỗi giây, 600 ms, `max_connections = 40`, p99 180 ms và 4,2 giây, 12 và 380 lần gọi đồng thời, 3 phần trăm) là giả định của kịch bản, không phải số đo và không phải mặc định của AWS. Riêng các khối output ở mục 4 là output thật của script `little_law.py`, script không đổi so với lần chạy đã ghi lại.
