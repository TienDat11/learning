"""Mô phỏng ba cách một message lệch khỏi hàng đã commit.

Cơ sở dữ liệu: sqlite3 trong bộ nhớ của thư viện chuẩn. Đây KHÔNG phải
PostgreSQL, nên transaction ở đây đơn giản hơn thật: một tiến trình, một
kết nối, không có hai phiên tranh nhau. Hàng đợi: một list trong bộ nhớ,
KHÔNG phải SQS, nên không có visibility timeout và không có receipt handle.

Cái giữ lại được từ mô phỏng: thứ tự hai bước, và chỗ một bước thành công
còn bước kia thất bại.
"""

import sqlite3

SENT = []  # hàng đợi giả


def new_db():
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE orders (id TEXT PRIMARY KEY, amount INTEGER)")
    con.execute("""
        CREATE TABLE outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            sent INTEGER NOT NULL DEFAULT 0
        )
    """)
    return con


def count(con, sql, args=()):
    return con.execute(sql, args).fetchone()[0]


def report(name, con, queue):
    """Đếm trên dữ liệu thật của kịch bản, không dán số tay."""
    rows = [r[0] for r in con.execute("SELECT id FROM orders")]
    sent = [m["order_id"] for m in queue]

    lost = sum(1 for r in rows if r not in sent)

    dup = 0
    for r in rows:
        dup += max(0, sent.count(r) - 1)

    ghost = sum(1 for m in sent if m not in rows)

    print(f"  hàng đã commit : {len(rows)}")
    print(f"  message đã gửi : {len(sent)}")
    print(f"  số mất         : {lost}   (hàng có, message không có)")
    print(f"  số trùng       : {dup}   (message thừa cho cùng một hàng)")
    print(f"  số ma          : {ghost}   (message không có hàng nào)")
    return {"name": name, "sent": len(sent), "lost": lost,
            "dup": dup, "ghost": ghost}


def put(con, order_id, amount):
    con.execute("INSERT INTO orders (id, amount) VALUES (?, ?)", (order_id, amount))


results = []

print("== Kịch bản 1: commit xong, gửi message thì lỗi ==")
SENT.clear()
con = new_db()
put(con, "order-1", 250_000)
con.commit()                       # dữ liệu đã nằm chắc trong cơ sở dữ liệu
try:
    raise ConnectionError("hàng đợi không phản hồi")
except ConnectionError as exc:
    print(f"  gửi thất bại: {exc}")
# Không có gì thử lại: bước gửi đã nằm ngoài transaction.
results.append(report("1. commit ok, gửi lỗi", con, SENT))
print()

print("== Kịch bản 2: gửi message xong, commit thì lỗi ==")
SENT.clear()
con = new_db()
SENT.append({"order_id": "order-2", "amount": 250_000})   # gửi trước
put(con, "order-2", 250_000)
con.rollback()                     # transaction hỏng, hàng không tồn tại
print("  commit thất bại, đã rollback")
results.append(report("2. gửi ok, commit lỗi", con, SENT))
print()

print("== Kịch bản 3: outbox, relay gửi xong rồi chết trước khi đánh dấu ==")
SENT.clear()
con = new_db()
with con:                          # một transaction: hàng nghiệp vụ + hàng outbox
    put(con, "order-3", 250_000)
    con.execute(
        "INSERT INTO outbox (order_id, payload) VALUES (?, ?)",
        ("order-3", '{"order_id": "order-3"}'),
    )
print(f"  sau commit: {count(con, 'SELECT COUNT(*) FROM orders')} hàng, "
      f"{count(con, 'SELECT COUNT(*) FROM outbox')} hàng outbox, "
      f"{count(con, 'SELECT COUNT(*) FROM outbox WHERE sent = 1')} đã đánh dấu")

for run in (1, 2):
    pending = con.execute(
        "SELECT id, order_id FROM outbox WHERE sent = 0 ORDER BY id"
    ).fetchall()
    print(f"  relay lần {run}: thấy {len(pending)} hàng chưa gửi")
    for row_id, order_id in pending:
        SENT.append({"order_id": order_id, "amount": 250_000})
        print(f"    gửi message cho {order_id}")
        if run == 1:
            print("    tiến trình chết trước khi kịp đánh dấu sent = 1")
            break
        con.execute("UPDATE outbox SET sent = 1 WHERE id = ?", (row_id,))
        con.commit()
        print("    đánh dấu sent = 1")

results.append(report("3. outbox, relay chết giữa chừng", con, SENT))
print()

# Cùng kịch bản 3, nhưng consumer ghi khoá chống trùng trong cùng transaction.
con.execute("CREATE TABLE processed (message_id TEXT PRIMARY KEY)")
invoices = 0
for msg in SENT:
    key = f"{msg['order_id']}:invoice"
    try:
        with con:
            con.execute("INSERT INTO processed (message_id) VALUES (?)", (key,))
            invoices += 1
    except sqlite3.IntegrityError:
        print(f"  bỏ qua message trùng {key}")
print(f"  hoá đơn thực tế sau khi consumer idempotent: {invoices} "
      f"trong khi đã gửi {len(SENT)} message")
print()

print("== Tổng hợp ==")
print(f"{'kịch bản':<34}{'gửi':>5}{'mất':>6}{'trùng':>7}{'ma':>5}")
for r in results:
    print(f"{r['name']:<34}{r['sent']:>5}{r['lost']:>6}{r['dup']:>7}{r['ghost']:>5}")
