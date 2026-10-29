// L24 — Đọc cây EXPLAIN, chọn composite index, và snapshot của MVCC.
// Chạy: node explain_demo.mjs
// PGlite là PostgreSQL biên dịch sang WASM: planner, MVCC, BUFFERS đều là của PostgreSQL.
// Đây là mô phỏng cơ chế trên dữ liệu giả, không phải benchmark.

import { PGlite } from '@electric-sql/pglite';

const db = await PGlite.create();
const q = async (sql) => (await db.query(sql)).rows;
const exec = (sql) => db.exec(sql);

async function explain(sql) {
  const rows = (await db.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`)).rows;
  return rows.map((r) => r['QUERY PLAN']).join('\n');
}

function line1(text) {
  const first = text.split('\n')[0];
  const est = /rows=(\d+) width=/.exec(first);
  const act = /actual time=[\d.]+\.\.([\d.]+) rows=([\d.]+)/.exec(first);
  return {
    node: first.split('  (cost=')[0].trim(),
    est: est ? Number(est[1]) : null,
    actual: act ? Number(act[2]) : null,
    ms: act ? act[1] : null,
  };
}

function show(title, text) {
  console.log(`\n--- ${title} ---`);
  console.log(text);
  const s = line1(text);
  console.log(`>> nút trên cùng: ${s.node}`);
  console.log(`>> ước lượng ${s.est} dòng, thực tế ${s.actual} dòng, ${s.ms} ms`);
}

const hr = (t) => console.log(`\n\n========== ${t} ==========`);

// ---------------------------------------------------------------- 0
hr('0. Phiên bản PostgreSQL đang chạy');
console.log((await q('SELECT version() AS v'))[0].v);
console.log(`Số kết nối đang mở (pg_stat_activity): ${(await q('SELECT count(*) AS n FROM pg_stat_activity'))[0].n}`);

// ---------------------------------------------------------------- 1
hr('1. Bảng orders, 50.000 dòng giả');
await exec(`
CREATE TABLE orders (
  id          int PRIMARY KEY,
  customer_id int NOT NULL,
  status      text NOT NULL,
  created_at  timestamp NOT NULL,
  total       numeric(10,2) NOT NULL
);
INSERT INTO orders (id, customer_id, status, created_at, total)
SELECT g,
       (g * 7919) % 5000,
       CASE WHEN g % 250 = 0 THEN 'cancelled'
            WHEN g <= 30000    THEN 'pending'
            ELSE 'done' END,
       timestamp '2026-01-01 00:00:00' + (g || ' minutes')::interval,
       (g % 900 + 10)::numeric
FROM generate_series(1, 50000) g;
ANALYZE orders;
`);
console.log(JSON.stringify(await q(`SELECT status, count(*) AS n FROM orders GROUP BY status ORDER BY status`)));
const sizeAfterInsert = (await q(`SELECT pg_relation_size('orders') AS b`))[0].b;
console.log(`Kích thước heap sau khi nạp: ${sizeAfterInsert} byte`);

// ---------------------------------------------------------------- 2
hr('2. Trước khi có index: lọc 200 dòng cancelled trong 50.000');
const QCANCEL = `SELECT id, total, created_at FROM orders WHERE status = 'cancelled' ORDER BY created_at DESC LIMIT 20`;
show('Q_cancel — chưa có index nào', await explain(QCANCEL));

// ---------------------------------------------------------------- 3
hr('3. Thêm composite index (status, created_at DESC) rồi ANALYZE');
await exec(`CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);`);
await exec(`ANALYZE orders;`);
show('Q_cancel — sau composite index', await explain(QCANCEL));

// ---------------------------------------------------------------- 4
hr('4. Bulk load đổi phân bố, KHÔNG chạy ANALYZE');
const pendingBefore = Number((await q(`SELECT count(*) AS n FROM orders WHERE status = 'pending'`))[0].n);
await exec(`UPDATE orders SET status = 'done' WHERE status = 'pending' AND id % 60 <> 0;`);
const pendingAfterUpdate = Number((await q(`SELECT count(*) AS n FROM orders WHERE status = 'pending'`))[0].n);
// số dòng UPDATE thật sự đổi, đếm trước và sau — không hardcode
const updatedRows = pendingBefore - pendingAfterUpdate;
console.log(JSON.stringify(await q(`SELECT status, count(*) AS n FROM orders GROUP BY status ORDER BY status`)));
const QPENDING = `SELECT id, status, created_at FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50`;
show('Q_pending — thống kê vẫn là bản của bước 3', await explain(QPENDING));
console.log(JSON.stringify(await q(`SELECT indexrelname, idx_scan FROM pg_stat_user_indexes ORDER BY indexrelname`)));

// ---------------------------------------------------------------- 5
hr('5. Chạy ANALYZE, đúng câu SQL đó chạy lại');
await exec(`ANALYZE orders;`);
show('Q_pending — sau ANALYZE', await explain(QPENDING));
console.log(JSON.stringify(await q(`SELECT indexrelname, idx_scan FROM pg_stat_user_indexes ORDER BY indexrelname`)));

// ---------------------------------------------------------------- 6
hr('6. Thứ tự cột: điều kiện bằng trước, điều kiện khoảng sau');
const QORDER = `SELECT id, total FROM orders
WHERE status = 'cancelled'
  AND created_at >= timestamp '2026-01-20'
  AND created_at <  timestamp '2026-01-25'`;
console.log(`Số dòng khớp: ${(await q(`SELECT count(*) AS n FROM orders WHERE status = 'cancelled' AND created_at >= timestamp '2026-01-20' AND created_at < timestamp '2026-01-25'`))[0].n}`);

await exec(`DROP INDEX idx_orders_status_created;
            CREATE INDEX idx_orders_created_status ON orders (created_at, status);
            ANALYZE orders;`);
show('Q_order với index (created_at, status) — khoảng đứng trước', await explain(QORDER));

await exec(`DROP INDEX idx_orders_created_status;
            CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
            ANALYZE orders;`);
show('Q_order với index (status, created_at) — điều kiện bằng đứng trước', await explain(QORDER));

// ---------------------------------------------------------------- 7
hr('7. Truy vấn composite index (status, created_at) KHÔNG phục vụ');
const QRANGE = `SELECT id, total FROM orders
WHERE created_at >= timestamp '2026-01-20 00:00'
  AND created_at <  timestamp '2026-01-20 02:00'`;
show('Q_range — thiếu cột đầu status', await explain(QRANGE));

const QSORT = `SELECT id FROM orders ORDER BY created_at DESC LIMIT 20`;
show('Q_sort — sắp xếp theo created_at, không lọc status', await explain(QSORT));

await exec(`CREATE INDEX idx_orders_created ON orders (created_at); ANALYZE orders;`);
show('Q_range — sau khi thêm index riêng trên created_at', await explain(QRANGE));
await exec(`DROP INDEX idx_orders_created; ANALYZE orders;`);

// ---------------------------------------------------------------- 8
hr('8. MVCC: snapshot quyết định transaction thấy phiên bản dòng nào');
const S0 = (await q(`SELECT pg_current_snapshot()::text AS s`))[0].s;
console.log(`Snapshot S0 lấy trước khi INSERT: ${S0}`);
await exec(`INSERT INTO orders (id, customer_id, status, created_at, total)
            VALUES (50001, 1, 'pending', timestamp '2026-02-10 00:00:00', 99);`);
const rows = await q(`SELECT id, xmin::text AS xmin, xmax::text AS xmax FROM orders WHERE id IN (1, 50001) ORDER BY id`);
for (const r of rows) {
  const vis = (await q(`SELECT pg_visible_in_snapshot('${r.xmin}'::xid8, '${S0}'::pg_snapshot) AS vis`))[0].vis;
  console.log(`id=${r.id} xmin=${r.xmin} xmax=${r.xmax} — nhìn thấy trong S0: ${vis}`);
}

await exec(`UPDATE orders SET total = 111 WHERE id = 1;`);
const after = (await q(`SELECT id, xmin::text AS xmin, xmax::text AS xmax FROM orders WHERE id = 1`))[0];
const visAfter = (await q(`SELECT pg_visible_in_snapshot('${after.xmin}'::xid8, '${S0}'::pg_snapshot) AS vis`))[0].vis;
console.log(`Sau UPDATE: id=1 xmin=${after.xmin} xmax=${after.xmax} — phiên bản mới nhìn thấy trong S0: ${visAfter}`);
console.log(`Số bản ghi còn hiện ra khi đọc bảng: ${(await q(`SELECT count(*) AS n FROM orders`))[0].n}`);

// ---------------------------------------------------------------- 9
hr('9. Phiên bản cũ vẫn chiếm chỗ cho tới khi VACUUM');
const sizeAfterUpdate = (await q(`SELECT pg_relation_size('orders') AS b`))[0].b;
const updateLabel = `Sau UPDATE ${String(updatedRows).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} dòng:`;
console.log(`Sau khi nạp:            ${sizeAfterInsert} byte`);
console.log(`${updateLabel.padEnd(24)}${sizeAfterUpdate} byte`);
await exec(`VACUUM FULL orders;`);
const sizeAfterVacuum = (await q(`SELECT pg_relation_size('orders') AS b`))[0].b;
console.log(`Sau VACUUM FULL:        ${sizeAfterVacuum} byte`);
console.log(`Số kết nối trong pg_stat_activity: ${(await q('SELECT count(*) AS n FROM pg_stat_activity'))[0].n} — không dựng được hai transaction đồng thời.`);
