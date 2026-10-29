# L08: 150 environment Lambda warm mở bao nhiêu connection tới RDS

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ đi từ "Bước 1. Đoán trước" sang "Bước 3. Một ví dụ có số" mà chưa giải thích connection được **mượn và trả** thế nào. Người đọc chưa biết `pool_size` là gì đã phải nhân 150 × 5.
- **Thuật ngữ chưa giải thích:** `connection pool`, `pool_size`, `max_overflow`, `NullPool`, `reserved concurrency`, `multiplexing`, `pinning` xuất hiện lần đầu không kèm tiếng Việt trong ngoặc.
- **Thiếu ví von / ví dụ trực diễn:** bản cũ không có sơ đồ chữ cho luồng "client → pool → database"; không đặt "Cách tệ" cạnh "Cách tốt" trong cùng một khối, người đọc phải tự ghép hai phần cách xa nhau.
- **Câu quá dài / khô:** kiểu câu như "Số connection phía database bằng tổng connection đang mở của mọi environment; nó tăng theo số environment, không theo số request đang xử lý." — hai mệnh đề tương phản gộp trong một câu.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

(Các con số của kịch bản là giả định — cần kiểm tra lại trên hệ thống thật.)

Một API đọc sản phẩm chạy trên Lambda. Engine SQLAlchemy được tạo ở cấp module với `pool_size=5`. RDS PostgreSQL đặt `max_connections=100`. `(Cả hai con số là thông số của kịch bản, không phải mặc định của SQLAlchemy hay RDS.)`

Một chiến dịch email đẩy 150 request đồng thời. Lambda bật khoảng 150 environment. Mỗi environment mở tối đa 5 connection.

Kết quả: log xuất hiện `FATAL: sorry, too many clients already`. Tỉ lệ 500 tăng vài phút rồi **tự hết** khi tải giảm. CPU của RDS chỉ 12 phần trăm suốt sự cố.

**Câu hỏi dự đoán:** mỗi environment mở tối đa 5 connection — vậy con số nào mới là trần của **cả hệ thống**? Và vì sao RDS báo hết client trong khi CPU chỉ 12 phần trăm?

**Đáp án:** trần của cả hệ thống là **phép nhân**, không phải `pool_size`. 150 × 5 = 750, gấp 7,5 lần trần 100. Tài nguyên bị cạn là **slot connection**, không phải CPU.

Thuật ngữ dùng trong bài:

- `connection pool` — hồ giữ sẵn các kết nối database để dùng lại.
- `pool_size` — số kết nối giữ thường trực trong hồ.
- `max_overflow` — số kết nối được mở vượt thêm tạm thời khi hồ đầy.
- `NullPool` — chế độ không giữ kết nối nào: mượn thì mở, trả thì đóng.
- `reserved concurrency` — trần số environment Lambda chạy đồng thời.

### 2. Phép ví von đời thường & Sơ đồ chữ

Mỗi environment Lambda giống một quầy cho thuê xe đạp riêng. Quầy nào cũng giữ sẵn 5 chiếc trong sân (`pool_size=5`), và mỗi chiếc đang dựng ở sân là một chiếc **đã lấy khỏi kho**. Bãi đỗ chung của thành phố chỉ có 100 chỗ. Bạn mở 150 quầy, mỗi quầy dựng 5 xe: 750 xe đòi chỗ.

*Giới hạn của phép ví von:* xe đạp không tốn gì khi dựng im; connection thì vẫn chiếm một tiến trình bên trong PostgreSQL.

```text
   150 environment Lambda (container warm)
   ┌──────┐ ┌──────┐ ┌──────┐        ┌──────┐
   │ pool │ │ pool │ │ pool │  ...   │ pool │    mỗi pool giữ 5
   │  5   │ │  5   │ │  5   │        │  5   │
   └──┬───┘ └──┬───┘ └──┬───┘        └──┬───┘
      │        │        │               │
      └────────┴────────┴───────┬───────┘
                                ↓  750 connection đòi vào
                    ┌───────────────────────┐
                    │  RDS PostgreSQL       │
                    │  max_connections=100  │  ← CHỖ NGHẼN
                    │  CPU 12%              │
                    └───────────────────────┘
                        ↓
              FATAL: sorry, too many clients already
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Pool là trần của một tiến trình.** Trên một máy chủ, một pool `pool_size=5` đúng là trần 5 cho cả ứng dụng. Trên Lambda, mỗi environment là một tiến trình riêng, tạo engine riêng, nên có pool riêng.
- **Bước 2 — Mượn rồi trả, nhưng không đóng.** Handler mượn một connection, dùng xong trả về pool. Connection nằm lại trong pool, nên **vẫn chiếm một slot** phía database. Container warm giữ pool đó qua nhiều lần gọi.
- **Bước 3 — Số connection đi theo số environment.** Tổng connection phía database bằng tổng connection đang mở của mọi environment. Nó tăng theo **số environment**, không theo số request đang xử lý.
- **Bước 4 — Proxy gom ở giữa, không nâng trần.** Có RDS Proxy thì client mở connection tới Proxy, Proxy ghép chúng vào một pool backend nhỏ ở mức **transaction**. Database thấy ít connection hơn. Nhưng `max_connections` của database **không đổi**, và CPU/IO của database cũng không tăng thêm.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** đọc `pool_size=5` như trần toàn hệ thống. Điều xảy ra: mỗi environment nhân thêm 5 connection, tổng 750 so với trần 100. Lỗi hiện theo từng đợt burst rồi tự hết khi container bị thu hồi — nên rất dễ bị chẩn đoán sai là "lỗi mạng tạm thời".
- **Cách tốt:** tính bằng phép nhân rồi chặn từ ba phía. Đặt `reserved concurrency` để chặn số environment. Dùng `NullPool` để container nhàn rỗi không giữ connection. Trỏ `DATABASE_URL` vào endpoint RDS Proxy để gom connection phía sau. Lý do: cả ba cùng tác động vào **cùng một con số** là số connection thực mở.
- **Kiểm chứng bằng code (chạy thật):** mô phỏng trong `lessons/02-python/L08-connection-pool/pool_sim.py`.

```
python pool_sim.py
```

Output đã chạy:

```
== Mot environment: 40 request, cach nhau 0.02s, giu connection 0.50s ==
Tran cua pool nay: pool_size 5 + max_overflow 0 = 5 connection

QueuePool (giu connection nha roi):
  request xong:                40
  request phai cho:            35
  so lan thu lai:              1126
  connection mo moi (ca run):  5
  dinh connection phia DB:     5

NullPool (mo moi lan muon, dong khi tra):
  request xong:                40
  request phai cho:            0
  so lan thu lai:              0
  connection mo moi (ca run):  40
  dinh connection phia DB:     25

== Tran toan he thong: 150 environment, max_connections = 100 ==
cau hinh                                             tran    so voi tran
A: pool_size=5, max_overflow=0                        750       vuot 650
B: pool_size=1, max_overflow=0                        150        vuot 50
C: NullPool, burst 150 cung luc                       150        vuot 50
D: reserved 18 env, pool_size=5                        90     khong vuot
```

Đọc bảng theo hai ý:

- Hạ `pool_size` từ 5 xuống 1 chỉ đưa 750 về 150 — **vẫn vượt** trần 100. Lỗi thưa hơn, không hết.
- `NullPool` bỏ connection nhàn rỗi nhưng burst 150 request vẫn cần 150 connection cùng lúc. Đỉnh vẫn vượt trần.
- Chỉ dòng D xuống dưới trần: chặn **số environment** (18 × 5 = 90).

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** `reserved concurrency` cho trần connection tính được trước. `NullPool` không giữ connection nhàn rỗi. Proxy gom connection và sống sót qua failover tốt hơn kết nối trực tiếp.
- **Đánh đổi gì:** request vượt `reserved concurrency` nhận 429 và phải chờ, nên client phải có backoff. `NullPool` bắt tay TCP và TLS mỗi lần mượn, thêm độ trễ từng request. Proxy thêm một hop mạng, thêm phí, và **mất khả năng ghép** khi phiên bị ghim.
- **Khi nào KHÔNG nên dùng:** đừng thêm Proxy cho dịch vụ nội bộ lưu lượng thấp khi `số environment × connection mỗi environment` đã an toàn dưới trần — bạn trả thêm một hop mạng mà không được gì. Đừng dùng `NullPool` cho endpoint có burst lớn: nó chỉ bỏ phần nhàn rỗi, không chặn đỉnh. Đừng nâng `max_connections` của PostgreSQL như cách chữa: mỗi connection là một tiến trình riêng, bộ nhớ và chi phí chuyển ngữ cảnh tăng theo.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Tăng `max_connections` của PostgreSQL từ 100 lên 1000 có giải quyết xong không?

- **Trả lời mẫu (30–60 giây):** Không. Nó dời trần chứ không xoá phép nhân. PostgreSQL phục vụ mỗi connection bằng một tiến trình riêng, nên bộ nhớ và chi phí chuyển ngữ cảnh tăng theo số connection. Với 150 environment và `pool_size=5` ta có 750; tải tăng tiếp là vượt 1000, vì số connection đi theo số environment chứ không theo cấu hình database. Dấu hiệu sau khi nâng trần: lỗi thưa hơn nhưng latency tăng và CPU database cao hơn ở cùng mức tải.
- **Lỗi hay mắc khi trả lời:** nói "nâng trần là hết lỗi". Cách nói đúng: nêu phép nhân là nguyên nhân, nêu chi phí mỗi connection là một tiến trình, rồi nêu dấu hiệu để kiểm chứng.

### Câu 2: Đặt `poolclass=NullPool` là xong bài toán Lambda với RDS phải không?

- **Trả lời mẫu (30–60 giây):** Chưa. `NullPool` chỉ bỏ phần connection **nhàn rỗi**, không chặn **đỉnh**. Mỗi lần mượn mở một connection mới và đóng khi trả, nên số connection phía database bằng số request đang chạy. 300 request cùng lúc vẫn mở 300 connection và vượt trần 100. Thêm vào đó mỗi request trả chi phí bắt tay TCP và TLS. Dấu hiệu: biểu đồ connection có đỉnh nhọn đúng lúc burst và đáy bằng 0 khi rảnh; nếu đỉnh vượt trần thì chưa đủ.
- **Lỗi hay mắc khi trả lời:** nói "NullPool nên không còn connection nào". Sai: nó vẫn mở connection, chỉ không **giữ**. Cách nói đúng: phân biệt rõ "connection nhàn rỗi" và "connection đang dùng".

### Câu 3: Nếu số environment luôn thấp, có cần Proxy không?

- **Trả lời mẫu (30–60 giây):** Không nhất thiết. Điều kiện quyết định là tích `số environment × connection mỗi environment` phải luôn dưới trần, **kể cả khi có job nền**. Ví dụ `reserved concurrency` 20 với `pool_size` 1 cho trần 20, an toàn với database 100. Nhưng thêm một job batch mở 30 connection là phép cộng vượt trần. Vì vậy tôi luôn cộng connection của **mọi nguồn** — API, job, môi trường khác — rồi so với trần; nếu tổng sát trần thì mới thêm Proxy.
- **Lỗi hay mắc khi trả lời:** chỉ tính API rồi kết luận an toàn. Cách nói đúng: nêu nguyên tắc "cộng mọi nguồn" và nêu ví dụ job batch phá phép tính.

### Câu 4: RDS Proxy có bảo đảm mọi connection đều được ghép không?

- **Trả lời mẫu (30–60 giây):** Không. Proxy chỉ ghép được khi connection **không mang trạng thái phiên riêng**. Proxy trả connection về pool sau khi transaction kết thúc; nếu phiên còn trạng thái riêng thì connection đó bị **ghim** cho một client. Các lệnh gây ghim: `SET` ở cấp phiên thay vì `SET LOCAL`, bảng tạm, `PREPARE` cấp phiên, `LISTEN`. Dấu hiệu kiểm chứng: so số connection backend với số connection client; hai số tiến sát nhau là lợi ích ghép đã mất.
- **Lỗi hay mắc khi trả lời:** nói "có Proxy là connection tự gom hết". Cách nói đúng: nêu cơ chế transaction-level, nêu danh sách lệnh gây ghim, nêu chỉ số để kiểm.

---
## Ghi chú nguồn

- https://docs.sqlalchemy.org/en/20/core/pooling.html — `QueuePool`, `NullPool`, `pool_size`, `max_overflow`.
- https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html — ghép connection ở mức transaction và cơ chế ghim phiên.
- https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html — `reserved concurrency`.
- Đã kiểm trong bài này: chạy `pool_sim.py` trong `lessons/02-python/L08-connection-pool/`; bảng "trần toàn hệ thống" ở trên là output thật của script. Chưa kiểm: hành vi của Proxy khi failover; các con số 150 environment, `pool_size` 5, `max_connections` 100 là thông số kịch bản.
