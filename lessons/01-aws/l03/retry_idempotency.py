# python 3 (standard library only), file: retry_idempotency.py, target: Windows 11
# Mô phỏng: ba lần giao cùng một message cho handler có tác dụng phụ ở giây thứ 2,
# trong khi timeout ở giây thứ 3. Đếm số dòng (email) bị ghi trùng.
# Đây là mô phỏng cơ chế retry, không phải Lambda thật.
TIMEOUT_SECONDS = 3.0
SIDE_EFFECT_AT = 2.0
WORK_FINISH_AT = 5.0
DELIVERIES = 3  # Lambda thử một lần, rồi thử thêm hai lần


def run_without_key(message_id, rows):
    """Handler không có khoá: mỗi lần giao đều chạy lại từ đầu."""
    if SIDE_EFFECT_AT < TIMEOUT_SECONDS:
        rows.append(message_id)  # email đã gửi trước khi bị dừng
    return "dừng ở timeout %.1fs, việc thật cần %.1fs" % (TIMEOUT_SECONDS, WORK_FINISH_AT)


def run_with_key(message_id, rows, ledger):
    """Handler có khoá idempotency: giữ khoá trước, làm việc sau."""
    if message_id in ledger:
        return "bỏ qua: khoá đã tồn tại"
    ledger[message_id] = "running"
    if SIDE_EFFECT_AT < TIMEOUT_SECONDS:
        rows.append(message_id)
    return "dừng ở timeout %.1fs sau khi đã giữ khoá" % TIMEOUT_SECONDS


def report(title, rows, message_id):
    duplicates = len(rows) - len(set(rows))
    print(title)
    print("  Số lần handler được gọi:      %d" % DELIVERIES)
    print("  Số dòng đã ghi:               %d" % len(rows))
    print("  Số dòng trùng (cùng message): %d" % duplicates)
    print("  Số message duy nhất:          %d" % len(set(rows)))
    print()


def main():
    message_id = "anh-001.jpg"
    print("Giả định: một message %r, %d lần giao, timeout %.0fs, việc thật %.0fs,"
          % (message_id, DELIVERIES, TIMEOUT_SECONDS, WORK_FINISH_AT))
    print("tác dụng phụ (gửi email) xảy ra ở giây thứ %.0f." % SIDE_EFFECT_AT)
    print()

    rows = []
    for attempt in range(1, DELIVERIES + 1):
        note = run_without_key(message_id, rows)
        print("  Lần %d: %s" % (attempt, note))
    print()
    report("Không có khoá idempotency:", rows, message_id)

    rows = []
    ledger = {}
    for attempt in range(1, DELIVERIES + 1):
        note = run_with_key(message_id, rows, ledger)
        print("  Lần %d: %s" % (attempt, note))
    print()
    report("Có khoá idempotency (ghi khoá trước tác dụng phụ):", rows, message_id)

    print("Đọc ra: số lần handler chạy không đổi (vẫn %d), chỉ số tác dụng phụ đổi từ %d xuống 1."
          % (DELIVERIES, DELIVERIES))


if __name__ == "__main__":
    main()
