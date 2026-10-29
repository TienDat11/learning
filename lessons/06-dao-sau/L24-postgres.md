# L24: PostgreSQL — planner, index, transaction và cái giá của ORM

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ vào ngay `pg_class`, `pg_statistic`, `seq_page_cost` ở bước cơ chế, nhưng chưa nói vì sao planner phải *ước lượng* thay vì biết chắc. Thiếu ý đó thì mọi hằng số chi phí là công thức vô nghĩa.
- **Nhảy bước:** phần composite index nói "ràng buộc trên cột bên phải vẫn được kiểm trong index nhưng không thu hẹp phần index phải đọc" mà không có ví dụ số đứng cạnh, nên người đọc dễ hiểu thành "hai index giống nhau".
- **Thuật ngữ chưa giải thích:** `EXPLAIN (ANALYZE, BUFFERS)`, `Seq Scan`, `Index Scan`, `Bitmap Heap Scan`, `selectivity`, `composite index`, `keyset pagination`, `MVCC`, `snapshot`, `xmin/xmax`, `isolation level`, `bulk load`.
- **Thiếu ví von / ví dụ trực diện:** bản cũ mô tả MVCC bằng `xmin` và `xmax` trước khi cho một hình ảnh nào về "nhiều phiên bản của cùng một dòng cùng tồn tại".
- **Câu quá dài / khô:** "Mỗi index là một B-tree phải cập nhật trong cùng transaction với lệnh ghi, cộng dung lượng và thời gian VACUUM" — ba hệ quả trong một câu, không câu nào được giải thích riêng.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Giả sử bảng `orders` có 4,2 triệu dòng. Endpoint danh sách đơn lọc theo `status` đang ở p99 1,8 giây.

Đội thêm một B-tree trên `status`. Deploy. p99 không đổi một mili giây.

Đúng tuần đó hệ thống import 600 nghìn đơn cũ, và một job báo cáo giữ transaction mở 40 phút.

Trên production, `EXPLAIN (ANALYZE, BUFFERS)` (lệnh chạy thật câu SQL và in kế hoạch thực thi kèm số trang bộ nhớ đã đọc) in ở nút scan `rows=3900000` nhưng `actual rows=380000`. Kế hoạch là `Seq Scan` (quét tuần tự toàn bộ các trang của bảng). Sau ba ngày, `idx_scan` của index mới vẫn bằng 0.

**Câu hỏi dự đoán:** thêm index đúng cột, đúng kiểu, mà không có tác dụng — vậy cái gì đã quyết định kế hoạch?

**Đáp án:** *con số ước lượng* của planner, và con số đó lấy từ thống kê. Thống kê cũ thì index đúng cũng không được mở.

(Mọi con số trong bài là giả định của kịch bản — cần kiểm tra lại trên hệ thống thật. Riêng output ở mục 4 là lần chạy thật trên PGlite.)

### 2. Phép ví von đời thường & Sơ đồ chữ

Planner là **người đi chợ có một cuốn sổ ghi giá**. Sổ cũ thì nó chọn sai quầy — và mua thêm một chiếc xe đẩy không giúp gì.

*Giới hạn của phép ví von:* giá ngoài chợ tự đổi liên tục, còn ở đây chính bạn là người quyết định khi nào cập nhật sổ.

```text
Câu SQL
   ↓
[Parse và rewrite] → cây truy vấn
   ↓
[Planner] ← pg_class (số trang) + pg_statistic (selectivity)
   ↓ chọn theo chi phí ước lượng
   ├→ Seq Scan            (phần lớn bảng khớp)
   └→ Index Scan / Bitmap Heap Scan (ít dòng khớp)
   ↓
[Executor] → shared_buffers → (trượt) → đĩa    ← BUFFERS đếm chỗ này
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ, mỗi bước 1 ý)

- **Bước 1 — Ước lượng:** planner lấy số trang và số dòng từ `pg_class`, lấy `selectivity` (độ chọn lọc: tỷ lệ dòng thỏa điều kiện trên tổng số dòng) từ `pg_statistic`, rồi nhân ra số dòng dự kiến.
- **Bước 2 — So chi phí:** chi phí cộng theo các hằng số `seq_page_cost`, `random_page_cost`, `cpu_tuple_cost`. Đường nào rẻ hơn theo *ước lượng* thì được chọn.
- **Bước 3 — Đọc cây kế hoạch:** `rows=N` là ước lượng, `actual rows=M` là số đo. Nút lệch nhiều lần là nút bị thống kê sai.
- **Bước 4 — Sửa đúng chỗ:** chạy `ANALYZE` trước, rồi mới tạo index nếu vẫn cần. Index không sửa được ước lượng.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** thêm index trước, đọc `EXPLAIN` không có `ANALYZE`, rồi đổ lỗi cho ORM. Cả ba đều sửa đầu ra thay vì sửa đầu vào.
- **Cách tốt:** đọc `EXPLAIN (ANALYZE, BUFFERS)`, tìm nút lệch, chạy `ANALYZE`, rồi mới tạo `composite index` (chỉ mục ghép trên nhiều cột theo thứ tự cố định) đúng thứ tự.
- **Vì sao cách tốt giải quyết tận gốc:** nó sửa đúng con số mà planner dùng để ra quyết định.

Về thứ tự cột, giữ đúng chi tiết dễ nói sai: đảo index thành `(created_at, status)` thì điều kiện `status` **vẫn được kiểm trong index**, nhưng không thu hẹp phạm vi trang index phải quét — nên đọc nhiều buffer hơn.

**Kiểm chứng bằng code (chạy thật):** script dùng PGlite — PostgreSQL biên dịch sang WASM, nên planner, MVCC và `BUFFERS` đều là của PostgreSQL. Đây là mô phỏng cơ chế trên dữ liệu giả, không phải benchmark.

```text
cd lessons/06-dao-sau/l24
npm install @electric-sql/pglite
node explain_demo.mjs
```

Kết quả của lần chạy đã kiểm chứng trên PostgreSQL 18.6 (PGlite 0.5.13):

```text
========== 0. Phiên bản PostgreSQL đang chạy ==========
PostgreSQL 18.6 (PGlite 0.5.13) on wasm32-unknown-emscripten, compiled by emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 6.0.5 (1db513782be24469589d7cb8a1f1834e9a33f271), 32-bit
Số kết nối đang mở (pg_stat_activity): 1

========== 1. Bảng orders, 50.000 dòng giả ==========
[{"status":"cancelled","n":200},{"status":"done","n":19920},{"status":"pending","n":29880}]
Kích thước heap sau khi nạp: 3014656 byte

========== 2. Trước khi có index: lọc 200 dòng cancelled trong 50.000 ==========

--- Q_cancel — chưa có index nào ---
Limit  (cost=998.40..998.45 rows=20 width=17) (actual time=6.209..6.274 rows=20.00 loops=1)
  Buffers: shared hit=368
  ->  Sort  (cost=998.40..998.91 rows=203 width=17) (actual time=6.200..6.218 rows=20.00 loops=1)
        Sort Key: created_at DESC
        Sort Method: top-N heapsort  Memory: 19kB
        Buffers: shared hit=368
        ->  Seq Scan on orders  (cost=0.00..993.00 rows=203 width=17) (actual time=0.115..5.721 rows=200.00 loops=1)
              Filter: (status = 'cancelled'::text)
              Rows Removed by Filter: 49800
              Buffers: shared hit=368
Planning:
  Buffers: shared hit=22
Planning Time: 0.302 ms
Execution Time: 6.411 ms
>> nút trên cùng: Limit
>> ước lượng 20 dòng, thực tế 20 dòng, 6.274 ms

========== 3. Thêm composite index (status, created_at DESC) rồi ANALYZE ==========

--- Q_cancel — sau composite index ---
Limit  (cost=0.29..57.08 rows=20 width=17) (actual time=0.218..0.319 rows=20.00 loops=1)
  Buffers: shared hit=20 read=2
  ->  Index Scan using idx_orders_status_created on orders  (cost=0.29..590.93 rows=208 width=17) (actual time=0.215..0.260 rows=20.00 loops=1)
        Index Cond: (status = 'cancelled'::text)
        Index Searches: 1
        Buffers: shared hit=20 read=2
Planning:
  Buffers: shared hit=16 read=1
Planning Time: 0.340 ms
Execution Time: 0.452 ms
>> nút trên cùng: Limit
>> ước lượng 20 dòng, thực tế 20 dòng, 0.319 ms

========== 4. Bulk load đổi phân bố, KHÔNG chạy ANALYZE ==========
[{"status":"cancelled","n":200},{"status":"done","n":49320},{"status":"pending","n":480}]

--- Q_pending — thống kê vẫn là bản của bước 3 ---
Limit  (cost=0.42..4.54 rows=50 width=18) (actual time=0.072..0.677 rows=50.00 loops=1)
  Buffers: shared hit=42 read=11 dirtied=10
  ->  Index Scan using idx_orders_status_created on orders  (cost=0.42..3911.64 rows=47469 width=18) (actual time=0.069..0.615 rows=50.00 loops=1)
        Index Cond: (status = 'pending'::text)
        Index Searches: 1
        Buffers: shared hit=42 read=11 dirtied=10
Planning Time: 0.278 ms
Execution Time: 0.749 ms
>> nút trên cùng: Limit
>> ước lượng 50 dòng, thực tế 50 dòng, 0.677 ms
[{"indexrelname":"idx_orders_status_created","idx_scan":1},{"indexrelname":"orders_pkey","idx_scan":0}]

========== 5. Chạy ANALYZE, đúng câu SQL đó chạy lại ==========

--- Q_pending — sau ANALYZE ---
Limit  (cost=0.41..74.20 rows=50 width=17) (actual time=0.023..0.154 rows=50.00 loops=1)
  Buffers: shared hit=40
  ->  Index Scan using idx_orders_status_created on orders  (cost=0.41..723.51 rows=490 width=17) (actual time=0.020..0.109 rows=50.00 loops=1)
        Index Cond: (status = 'pending'::text)
        Index Searches: 1
        Buffers: shared hit=40
Planning:
  Buffers: shared hit=28
Planning Time: 0.372 ms
Execution Time: 0.555 ms
>> nút trên cùng: Limit
>> ước lượng 50 dòng, thực tế 50 dòng, 0.154 ms
[{"indexrelname":"idx_orders_status_created","idx_scan":1},{"indexrelname":"orders_pkey","idx_scan":0}]

========== 6. Thứ tự cột: điều kiện bằng trước, điều kiện khoảng sau ==========
Số dòng khớp: 29

--- Q_order với index (created_at, status) — khoảng đứng trước ---
Bitmap Heap Scan on orders  (cost=202.42..302.55 rows=30 width=9) (actual time=1.335..1.385 rows=29.00 loops=1)
  Recheck Cond: ((created_at >= '2026-01-20 00:00:00'::timestamp without time zone) AND (created_at < '2026-01-25 00:00:00'::timestamp without time zone) AND (status = 'cancelled'::text))
  Heap Blocks: exact=29
  Buffers: shared hit=38 read=30
  ->  Bitmap Index Scan on idx_orders_created_status  (cost=0.00..202.41 rows=30 width=0) (actual time=1.299..1.300 rows=29.00 loops=1)
        Index Cond: ((created_at >= '2026-01-20 00:00:00'::timestamp without time zone) AND (created_at < '2026-01-25 00:00:00'::timestamp without time zone) AND (status = 'cancelled'::text))
        Index Searches: 1
        Buffers: shared hit=9 read=30
Planning:
  Buffers: shared hit=35 read=1
Planning Time: 0.361 ms
Execution Time: 1.431 ms
>> nút trên cùng: Bitmap Heap Scan on orders
>> ước lượng 30 dòng, thực tế 29 dòng, 1.385 ms

--- Q_order với index (status, created_at) — điều kiện bằng đứng trước ---
Index Scan using idx_orders_status_created on orders  (cost=0.29..69.49 rows=31 width=9) (actual time=0.055..0.114 rows=29.00 loops=1)
  Index Cond: ((status = 'cancelled'::text) AND (created_at >= '2026-01-20 00:00:00'::timestamp without time zone) AND (created_at < '2026-01-25 00:00:00'::timestamp without time zone))
  Index Searches: 1
  Buffers: shared hit=29 read=2
Planning:
  Buffers: shared hit=33 read=1
Planning Time: 0.611 ms
Execution Time: 0.173 ms
>> nút trên cùng: Index Scan using idx_orders_status_created on orders
>> ước lượng 31 dòng, thực tế 29 dòng, 0.114 ms

========== 7. Truy vấn composite index (status, created_at) KHÔNG phục vụ ==========

--- Q_range — thiếu cột đầu status ---
Index Scan using idx_orders_status_created on orders  (cost=0.29..241.88 rows=120 width=9) (actual time=0.142..0.393 rows=120.00 loops=1)
  Index Cond: ((created_at >= '2026-01-20 00:00:00'::timestamp without time zone) AND (created_at < '2026-01-20 02:00:00'::timestamp without time zone))
  Index Searches: 5
  Buffers: shared hit=11 read=6
Planning Time: 0.274 ms
Execution Time: 0.522 ms
>> nút trên cùng: Index Scan using idx_orders_status_created on orders
>> ước lượng 120 dòng, thực tế 120 dòng, 0.393 ms

--- Q_sort — sắp xếp theo created_at, không lọc status ---
Limit  (cost=2414.48..2414.53 rows=20 width=12) (actual time=46.452..46.469 rows=20.00 loops=1)
  Buffers: shared hit=584
  ->  Sort  (cost=2414.48..2539.48 rows=50000 width=12) (actual time=46.448..46.455 rows=20.00 loops=1)
        Sort Key: created_at DESC
        Sort Method: top-N heapsort  Memory: 18kB
        Buffers: shared hit=584
        ->  Seq Scan on orders  (cost=0.00..1084.00 rows=50000 width=12) (actual time=0.034..23.589 rows=50000.00 loops=1)
              Buffers: shared hit=584
Planning Time: 0.255 ms
Execution Time: 46.764 ms
>> nút trên cùng: Limit
>> ước lượng 20 dòng, thực tế 20 dòng, 46.469 ms

--- Q_range — sau khi thêm index riêng trên created_at ---
Index Scan using idx_orders_status_created on orders  (cost=0.29..245.15 rows=123 width=9) (actual time=0.047..0.131 rows=120.00 loops=1)
  Index Cond: ((created_at >= '2026-01-20 00:00:00'::timestamp without time zone) AND (created_at < '2026-01-20 02:00:00'::timestamp without time zone))
  Index Searches: 5
  Buffers: shared hit=15
Planning:
  Buffers: shared hit=30 read=1
Planning Time: 0.375 ms
Execution Time: 0.193 ms
>> nút trên cùng: Index Scan using idx_orders_status_created on orders
>> ước lượng 123 dòng, thực tế 120 dòng, 0.131 ms

========== 8. MVCC: snapshot quyết định transaction thấy phiên bản dòng nào ==========
Snapshot S0 lấy trước khi INSERT: 761:761:
id=1 xmin=755 xmax=0 — nhìn thấy trong S0: true
id=50001 xmin=761 xmax=0 — nhìn thấy trong S0: false
Sau UPDATE: id=1 xmin=762 xmax=0 — phiên bản mới nhìn thấy trong S0: false
Số bản ghi còn hiện ra khi đọc bảng: 50001

========== 9. Phiên bản cũ vẫn chiếm chỗ cho tới khi VACUUM ==========
Sau khi nạp:            3014656 byte
Sau UPDATE 29.400 dòng: 4784128 byte
Sau VACUUM FULL:        3014656 byte
Số kết nối trong pg_stat_activity: 1 — không dựng được hai transaction đồng thời.
```

Đọc kết quả theo ba chỗ:

- **Số trang, không phải số mili giây.** `Buffers` là thứ ổn định giữa các lần chạy: 368 trang khi chưa có index, 22 trang khi có composite index. `cost` và `actual time` đổi theo mỗi lần chạy.
- **Ước lượng 47.469 so với 480 dòng thật.** Đó là thống kê cũ. Sau `ANALYZE`, cùng câu đó ước lượng 490 — sát 480 nhưng không bằng.
- **Thứ tự cột, đo bằng buffer.** Bản `(created_at, status)` đọc 68 trang (`shared hit=38 read=30`, 1,431 ms); bản `(status, created_at)` đọc 31 trang (`shared hit=29 read=2`, 0,173 ms). Cùng dữ liệu, cùng câu SQL.

Giới hạn của lần chạy: PGlite chỉ có một kết nối, nên phần write conflict giữa hai transaction đồng thời không dựng được ở đây. Bài trình bày phần đó bằng tài liệu, không bằng hai session thật.

**Tự thử:** đổi `LIMIT 20` thành `LIMIT 5000` rồi chạy lại. Kế hoạch còn là Index Scan không, và `Buffers` tăng lên bao nhiêu?

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** index giảm số trang phải đọc cho truy vấn chọn lọc. Thống kê chi tiết cho ước lượng sát hơn. Isolation cao cho dữ liệu đọc được ít bất ngờ.
- **Đánh đổi gì (chi phí / độ trễ / độ phức tạp):** mỗi index là một B-tree phải cập nhật trong cùng transaction với lệnh ghi, cộng dung lượng và thời gian VACUUM. `ANALYZE` lâu hơn. Mức isolation cao sinh lỗi serialization nên mọi caller phải retry đúng cách.
- **Khi nào KHÔNG nên dùng:** bảng chỉ vài nghìn dòng — Seq Scan đọc hết trong vài mili giây. Truy vấn đọc phần lớn bảng — ghé heap từng dòng còn đắt hơn đọc tuần tự. Cột bị bọc trong hàm hoặc so khớp mờ — B-tree trên cột đó không dùng được. Và bảng ghi liên tục: đếm số index trước khi thêm cái thứ tư.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Nếu tôi thêm index cho mọi cột trong WHERE thì sao?

- **Trả lời mẫu (30–60 giây):** Bạn đang đổi độ trễ đọc lấy độ trễ ghi và dung lượng. Mỗi index là một B-tree phải cập nhật trong cùng transaction với lệnh ghi, nên bảng tám index khiến mỗi INSERT chạm tám cấu trúc. Trên bảng ghi nhiều, đó là cách nhanh nhất để biến hệ thống ổn thành nghẽn ở tầng ghi. Tôi bắt đầu từ câu chậm đã đo rồi mới thêm index.
- **Lỗi hay mắc khi trả lời:** chỉ nói "index làm chậm ghi" mà không nêu dấu hiệu kiểm chứng. Cách nói đúng: thêm rằng `idx_scan` của index mới phải tăng trong khi thời gian ghi không đổi.

### Câu 2: Index đúng cột rồi mà vẫn chậm, bạn làm gì tiếp?

- **Trả lời mẫu (30–60 giây):** Tôi đọc kế hoạch trước, không thêm index thứ hai. Bước một là `EXPLAIN (ANALYZE, BUFFERS)` và tìm nút có `rows` dự kiến lệch khỏi `actual rows`. Lệch nghĩa là thống kê sai, và sửa bằng `ANALYZE` cùng statistics target chứ không bằng index. Nếu ước lượng đã đúng mà vẫn chậm, tôi xem `BUFFERS` để biết đang chờ I/O hay chờ khóa.
- **Lỗi hay mắc khi trả lời:** nhảy thẳng vào kết luận thiếu index composite. Cách nói đúng: nêu điều kiện kết luận — index có `idx_scan` bằng 0 trong khi kế hoạch vẫn là Seq Scan.

### Câu 3: Với `WHERE status = ? AND created_at >= ? AND created_at < ?`, vì sao `(status, created_at)` rẻ hơn `(created_at, status)`?

- **Trả lời mẫu (30–60 giây):** Vì index nhiều cột chỉ thu hẹp phần phải quét khi điều kiện bằng nằm trên cột trái nhất. Đặt `status` trước thì `created_at` thành cột khoảng ngay sau cột bằng, nên cả hai điều kiện cùng thu hẹp lát cắt index. Đặt `created_at` trước thì điều kiện khoảng đứng đầu, còn `status` chỉ được kiểm trong index. Đo được bằng `Buffers`: 68 trang so với 31 trang.
- **Lỗi hay mắc khi trả lời:** nói "index `(created_at, status)` không dùng được `status`". Sai: `status` vẫn được kiểm trong index, chỉ là không thu hẹp phạm vi trang index phải quét.

### Câu 4: Hai transaction cùng đọc một dòng rồi cùng ghi. Điều gì quyết định transaction thứ hai thấy gì?

- **Trả lời mẫu (30–60 giây):** `snapshot` (mốc các transaction đã commit tại thời điểm bắt đầu) quyết định nó thấy phiên bản dòng nào. `UPDATE` không sửa dòng cũ mà ghi phiên bản mới với `xmin` mới, và đánh dấu phiên bản cũ bằng `xmax`. Isolation cao hơn không xoá race condition; nó đổi lỗi âm thầm ghi đè thành lỗi serialization bắt buộc retry. Đó là lý do phải có đường retry trước khi nâng mức isolation.
- **Lỗi hay mắc khi trả lời:** nói "dùng REPEATABLE READ là hết race condition". Cách nói đúng: mức đó chỉ cố định cái bạn thấy, không ngăn hai transaction cùng đọc rồi cùng ghi.

---
## Ghi chú nguồn

- https://www.postgresql.org/docs/18/using-explain.html — kế hoạch là cây nút; Seq Scan tính bằng số trang nhân `seq_page_cost` cộng số dòng nhân `cpu_tuple_cost`; Bitmap Heap Scan gom vị trí dòng rồi sắp theo thứ tự trang; `rows` là số dòng phát ra.
- https://www.postgresql.org/docs/18/indexes-multicolumn.html — luật "equality constraints on leading columns, plus any inequality constraints on the first column that does not have an equality constraint"; ràng buộc trên cột bên phải được kiểm trong index nhưng không nhất thiết thu hẹp phần index phải đọc; mô tả skip scan.
- Script `lessons/06-dao-sau/l24/explain_demo.mjs` và output ở Phần 2 mục 4: lần chạy thật trên PGlite 0.5.13, PostgreSQL 18.6 wasm32.

Chưa kiểm trong bài: hành vi `idx_scan` trên PostgreSQL thật (trên PGlite giá trị này không ổn định giữa các lần chạy); lỗi serialization giữa hai session thật; trang tài liệu MVCC và isolation của PostgreSQL 18.
