"""Đếm số bản ghi thật sự bị đọc khi Query so với Scan trên cùng một bảng.

Chạy: python query_vs_scan.py
Đây là mô phỏng cơ chế bằng thư viện chuẩn, không phải DynamoDB thật:
Query đi qua một chỉ mục khoá phân vùng như DynamoDB băm khoá, Scan đi qua toàn bộ.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

ITEM_KB = 1  # Giả sử mỗi đơn hàng chiếm 1 KB.
PAGE_KB = 1024  # Một trang đọc của DynamoDB tối đa 1 MB.
USERS = 4000
ORDERS_PER_USER = 50


@dataclass
class ReadResult:
    name: str
    scanned: int
    returned: int
    pages: int

    @property
    def kb_read(self) -> int:
        return self.scanned * ITEM_KB

    @property
    def read_units(self) -> float:
        """Một đơn vị đọc = một khối 4 KB; đọc cuối cùng tốn nửa đơn vị mỗi khối."""
        blocks = math.ceil(self.kb_read / 4)
        return blocks / 2


def build_table(users: int, orders_per_user: int) -> tuple[list[dict], dict[str, list[dict]]]:
    items: list[dict] = []
    by_partition: dict[str, list[dict]] = {}
    for user in range(users):
        pk = f"USER#{user:05d}"
        partition = by_partition.setdefault(pk, [])
        for number in range(orders_per_user):
            item = {
                "pk": pk,
                "sk": f"ORDER#{number:04d}",
                "userId": user,
                "total": (user * 7 + number) % 500,
            }
            items.append(item)
            partition.append(item)
    return items, by_partition


def query(by_partition: dict[str, list[dict]], pk: str) -> ReadResult:
    """Đi qua khoá phân vùng: chỉ đụng tới phần của một người dùng."""
    partition = by_partition[pk]
    returned = [item for item in partition if item["total"] >= 0]
    pages = math.ceil(len(partition) * ITEM_KB / PAGE_KB) or 1
    return ReadResult("Query theo pk", len(partition), len(returned), pages)


def scan(items: list[dict], user_id: int | None = None) -> ReadResult:
    """Đi qua toàn bảng theo từng trang 1 MB; lọc sau khi đã đọc xong."""
    scanned = 0
    returned = 0
    pages = 0
    start = 0
    while start < len(items):
        page_items = []
        page_kb = 0
        while start < len(items) and page_kb + ITEM_KB <= PAGE_KB:
            page_items.append(items[start])
            page_kb += ITEM_KB
            start += 1
        pages += 1
        scanned += len(page_items)
        if user_id is None:
            returned += len(page_items)
        else:
            returned += sum(1 for item in page_items if item["userId"] == user_id)
    label = "Scan toàn bảng" if user_id is None else "Scan + FilterExpression"
    return ReadResult(label, scanned, returned, pages)


def report(title: str, results: list[ReadResult]) -> None:
    print(title)
    print(f"  {'thao tác':<22}{'đã đọc':>10}{'trả về':>10}{'trang':>8}{'KB đọc':>12}{'đơn vị đọc':>14}")
    for result in results:
        print(
            f"  {result.name:<22}{result.scanned:>10}{result.returned:>10}"
            f"{result.pages:>8}{result.kb_read:>12}{result.read_units:>14.1f}"
        )
    print()


def main() -> None:
    items, by_partition = build_table(USERS, ORDERS_PER_USER)
    target_pk = "USER#00042"
    target_user = 42

    print(f"Bảng mô phỏng: {len(items)} bản ghi, {USERS} người dùng × {ORDERS_PER_USER} đơn.")
    print()

    results = [
        query(by_partition, target_pk),
        scan(items, target_user),
        scan(items),
    ]
    report("Cùng một câu hỏi nghiệp vụ: 50 đơn của người dùng 42.", results)

    q, s_filter, s_all = results
    print(f"Query đọc ít hơn Scan {s_all.scanned / q.scanned:.0f} lần.")
    print(
        f"Thêm điều kiện lọc: đã đọc vẫn {s_filter.scanned} bản ghi, "
        f"chỉ số bản ghi trả về giảm từ {s_all.returned} xuống {s_filter.returned}."
    )
    print(
        f"Đơn vị đọc của Scan + lọc ({s_filter.read_units:.0f}) bằng đúng Scan không lọc "
        f"({s_all.read_units:.0f})."
    )
    print()

    big_items, big_by_partition = build_table(USERS * 10, ORDERS_PER_USER)
    print(f"Bảng lớn gấp 10 lần: {len(big_items)} bản ghi.")
    big = [query(big_by_partition, target_pk), scan(big_items, target_user)]
    report("", big)
    print(f"Query: {q.scanned} → {big[0].scanned} bản ghi đã đọc (không đổi).")
    print(f"Scan:  {s_filter.scanned} → {big[1].scanned} bản ghi đã đọc (gấp 10).")


if __name__ == "__main__":
    main()
