"""Mô phỏng hàng đợi: visibility timeout, giao trùng, và trần thông lượng.

Chạy: python visibility.py
Đây là mô phỏng cơ chế bằng thư viện chuẩn, không phải SQS thật.
Đồng hồ chạy theo từng giây rời rạc, mỗi consumer xử lý lần lượt từng message.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass


@dataclass
class Msg:
    mid: int
    state: str = "ready"  # ready | invisible | done
    deliveries: int = 0
    completions: int = 0


def simulate(
    consumers: int = 6,
    batch: int = 10,
    proc: int = 40,
    vis: int = 30,
    total: int = 12_000,
    downstream: int | None = None,
    horizon: int = 400_000,
) -> dict:
    """Trả về số liệu của một lần chạy.

    consumers  : số consumer cùng chạy
    batch      : số message nhận tối đa mỗi lần hỏi hàng đợi
    proc       : số giây xử lý một message
    vis        : visibility timeout, tính bằng giây
    downstream : số suất xử lý song song của tài nguyên phía sau (None = không giới hạn)
    """
    msgs = [Msg(i) for i in range(total)]
    ready = deque(range(total))
    expiring: deque[tuple[int, int]] = deque()
    pending = [deque() for _ in range(consumers)]
    busy: list[tuple[int, int] | None] = [None] * consumers
    slots = 0
    done = 0
    deliveries = 0
    duplicate_deliveries = 0
    duplicate_completions = 0
    t = 0

    while done < total and t <= horizon:
        while expiring and expiring[0][0] <= t:
            _, mid = expiring.popleft()
            msg = msgs[mid]
            if msg.state == "invisible":
                msg.state = "ready"
                ready.append(mid)

        for c in range(consumers):
            work = busy[c]
            if work is None or work[1] > t:
                continue
            mid = work[0]
            busy[c] = None
            if downstream is not None:
                slots -= 1
            msg = msgs[mid]
            msg.completions += 1
            if msg.completions > 1:
                duplicate_completions += 1
            if msg.state != "done":
                msg.state = "done"
                done += 1

        for c in range(consumers):
            if busy[c] is not None:
                continue
            # Giữ ống đầy: sau mỗi message xong, nhận thêm cho đủ lô.
            want = batch - len(pending[c])
            while want > 0 and ready:
                mid = ready.popleft()
                msg = msgs[mid]
                if msg.state != "ready":
                    continue
                msg.state = "invisible"
                msg.deliveries += 1
                deliveries += 1
                if msg.deliveries > 1:
                    duplicate_deliveries += 1
                expiring.append((t + vis, mid))
                pending[c].append(mid)
                want -= 1
            if not pending[c]:
                continue
            if downstream is not None and slots >= downstream:
                continue
            mid = pending[c].popleft()
            busy[c] = (mid, t + proc)
            if downstream is not None:
                slots += 1

        t += 1

    return {
        "consumers": consumers,
        "vis": vis,
        "downstream": downstream,
        "deliveries": deliveries,
        "duplicate_deliveries": duplicate_deliveries,
        "duplicate_completions": duplicate_completions,
        "seconds": t,
        "drained": done >= total,
        "throughput": done / t if t else 0.0,
    }


def show(results: list[dict]) -> None:
    print(f"  {'consumer':>9}{'vis':>6}{'trần sau':>10}{'lần giao':>11}{'giao trùng':>12}"
          f"{'xử lý lại':>11}{'giây':>9}{'msg/giây':>11}")
    for r in results:
        cap = "-" if r["downstream"] is None else str(r["downstream"])
        print(f"  {r['consumers']:>9}{r['vis']:>6}{cap:>10}{r['deliveries']:>11}"
              f"{r['duplicate_deliveries']:>12}{r['duplicate_completions']:>11}"
              f"{r['seconds']:>9}{r['throughput']:>11.3f}")


def main() -> None:
    print("Kịch bản: 12 000 message, lô 10, mỗi message 40 giây xử lý.")
    print()
    results = [
        simulate(consumers=2, vis=30),
        simulate(consumers=6, vis=30),
        simulate(consumers=6, vis=600),
        simulate(consumers=12, vis=30),
        simulate(consumers=12, vis=30, downstream=6),
    ]
    show(results)
    print()

    base, six, long_vis, twelve, capped = results
    print(f"2 → 6 consumer: thông lượng {base['throughput']:.3f} → {six['throughput']:.3f} msg/giây "
          f"(gấp {six['throughput'] / base['throughput']:.1f}).")
    print(f"6 → 12 consumer: thông lượng {six['throughput']:.3f} → {twelve['throughput']:.3f} msg/giây "
          f"(gấp {twelve['throughput'] / six['throughput']:.1f}), "
          f"giao trùng {six['duplicate_deliveries']} → {twelve['duplicate_deliveries']}.")
    print(f"12 consumer nhưng tài nguyên sau chỉ 6 suất: {capped['throughput']:.3f} msg/giây, "
          f"giao trùng {capped['duplicate_deliveries']}.")
    print(f"vis 30 → 600 giây, vẫn 6 consumer: giao trùng "
          f"{six['duplicate_deliveries']} → {long_vis['duplicate_deliveries']}.")
    print()
    print("Công thức: consumer × lô ÷ thời gian một lô = consumer ÷ thời gian một message.")
    for consumers in (2, 6, 12):
        print(f"  {consumers:>2} consumer ÷ 40 giây = {consumers / 40:.3f} msg/giây")
    print(f"  trần phía sau 6 suất ÷ 40 giây = {6 / 40:.3f} msg/giây")


if __name__ == "__main__":
    main()
