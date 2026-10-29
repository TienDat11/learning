"""Doc lai logs.jsonl va in duong di cua MOT don.

Chay: python trace_order.py            (mac dinh: corr-a1)
      python trace_order.py corr-b2
"""

import json
import sys
from collections import Counter

LOG_PATH = "logs.jsonl"


def load():
    with open(LOG_PATH, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def main() -> None:
    target = sys.argv[1] if len(sys.argv) > 1 else "corr-a1"
    rows = load()

    hits = sorted((r for r in rows if r.get("correlation_id") == target), key=lambda r: r["ts"])
    print("Tong so dong log: %d" % len(rows))
    print("Loc theo correlation_id = %s -> %d dong" % (target, len(hits)))
    print()
    print("Dong thoi gian cua don nay:")
    for r in hits:
        detail = []
        for key in ("order_id", "aws_request_id", "messageId", "error"):
            if key in r:
                detail.append("%s=%s" % (key, r[key]))
        print("  %s  %-13s %-20s %s" % (r["ts"], r["layer"], r["event"], " ".join(detail)))

    print()
    print("Neu chi co mot id he thong thi loc duoc bao nhieu dong:")
    for field in ("requestId", "aws_request_id", "messageId", "order_id"):
        found = Counter(r["layer"] for r in rows if field in r)
        total = sum(found.values())
        layers = ", ".join("%s=%d" % (k, v) for k, v in sorted(found.items()))
        print("  %-15s tong %2d dong, o cac tang: %s" % (field, total, layers))


if __name__ == "__main__":
    main()
