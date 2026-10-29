"""Mo phong tran connection cua MOT pool, va phep cong tran toan he thong.

Chay: python pool_sim.py

Khong goi AWS, khong can thu vien ngoai. Day la mo phong co che, khong phai
SQLAlchemy hay RDS that. No chi mo hinh ba thu ma bai hoc noi toi:
  - mot pool co tran = pool_size + max_overflow;
  - connection tra ve pool van chiem mot slot phia database;
  - NullPool mo connection moi cho moi lan muon va dong khi tra.

Dong ho la dong ho ao: thoi gian chi tang theo su kien, nen ket qua lap lai
y nguyen moi lan chay.
"""

import argparse
import heapq


class QueuePoolSim:
    """Pool kieu QueuePool: giu connection nha roi, co tran cung."""

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.in_use = 0        # connection dang duoc muon
        self.idle = 0          # connection nam trong pool, van mo phia database
        self.opened = 0        # so lan that su mo connection moi
        self.peak_db = 0       # dinh cua so connection phia database

    @property
    def db_connections(self) -> int:
        return self.in_use + self.idle

    def acquire(self) -> bool:
        if self.in_use < self.capacity:
            self.in_use += 1
            if self.idle > 0:
                self.idle -= 1       # dung lai connection cu trong pool
            else:
                self.opened += 1     # chua co san thi mo moi
            self.peak_db = max(self.peak_db, self.db_connections)
            return True
        return False

    def release(self) -> None:
        self.in_use -= 1
        self.idle += 1               # tra ve pool, khong dong


class NullPoolSim:
    """NullPool: khong giu connection nao; muon thi mo, tra thi dong."""

    def __init__(self):
        self.in_use = 0
        self.opened = 0
        self.peak_db = 0

    def acquire(self) -> bool:
        self.in_use += 1
        self.opened += 1
        self.peak_db = max(self.peak_db, self.in_use)
        return True

    def release(self) -> None:
        self.in_use -= 1             # dong that su


def simulate(pool, arrivals, hold, poll=0.05):
    """Chay mo phong. Request khong lay duoc connection thi thu lai sau `poll`."""
    events = [(t, seq, "arrive") for seq, t in enumerate(arrivals)]
    heapq.heapify(events)

    done = 0
    blocked = set()      # request tung phai cho
    retries = 0          # so lan thu lai
    guard = 0
    while events:
        guard += 1
        if guard > 2_000_000:
            raise RuntimeError("mo phong khong ket thuc")
        t, seq, kind = heapq.heappop(events)
        if kind == "done":
            done += 1
            pool.release()
        elif pool.acquire():
            heapq.heappush(events, (t + hold, seq, "done"))
        else:
            blocked.add(seq)
            retries += 1
            heapq.heappush(events, (t + poll, seq, "retry"))
    return done, len(blocked), retries


def ceiling(envs: int, pool_size: int, max_overflow: int) -> int:
    """Tran toan he thong = so environment x (pool_size + max_overflow)."""
    return envs * (pool_size + max_overflow)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--requests", type=int, default=40, help="so request trong mot environment")
    ap.add_argument("--gap", type=float, default=0.02, help="giay giua hai request")
    ap.add_argument("--hold", type=float, default=0.5, help="giay giu mot connection")
    ap.add_argument("--pool-size", type=int, default=5)
    ap.add_argument("--max-overflow", type=int, default=0)
    ap.add_argument("--max-conn", type=int, default=100, help="max_connections cua RDS")
    ap.add_argument("--envs", type=int, default=150)
    args = ap.parse_args()

    arrivals = [i * args.gap for i in range(args.requests)]
    cap = args.pool_size + args.max_overflow

    print("== Mot environment: %d request, cach nhau %.2fs, giu connection %.2fs =="
          % (args.requests, args.gap, args.hold))
    print("Tran cua pool nay: pool_size %d + max_overflow %d = %d connection"
          % (args.pool_size, args.max_overflow, cap))

    qp = QueuePoolSim(cap)
    done_qp, blocked_qp, retries_qp = simulate(qp, arrivals, args.hold)
    print()
    print("QueuePool (giu connection nha roi):")
    print("  request xong:                %d" % done_qp)
    print("  request phai cho:            %d" % blocked_qp)
    print("  so lan thu lai:              %d" % retries_qp)
    print("  connection mo moi (ca run):  %d" % qp.opened)
    print("  dinh connection phia DB:     %d" % qp.peak_db)

    np = NullPoolSim()
    done_np, blocked_np, retries_np = simulate(np, arrivals, args.hold)
    print()
    print("NullPool (mo moi lan muon, dong khi tra):")
    print("  request xong:                %d" % done_np)
    print("  request phai cho:            %d" % blocked_np)
    print("  so lan thu lai:              %d" % retries_np)
    print("  connection mo moi (ca run):  %d" % np.opened)
    print("  dinh connection phia DB:     %d" % np.peak_db)

    print()
    print("== Tran toan he thong: %d environment, max_connections = %d =="
          % (args.envs, args.max_conn))
    print("%-46s %10s %14s" % ("cau hinh", "tran", "so voi tran"))
    rows = [
        ("A: pool_size=5, max_overflow=0", ceiling(args.envs, 5, 0)),
        ("B: pool_size=1, max_overflow=0", ceiling(args.envs, 1, 0)),
        ("C: NullPool, burst %d cung luc" % args.envs, args.envs),
        ("D: reserved 18 env, pool_size=5", ceiling(18, 5, 0)),
    ]
    for name, total in rows:
        over = total - args.max_conn
        print("%-46s %10d %14s" % (name, total, ("vuot %d" % over) if over > 0 else "khong vuot"))


if __name__ == "__main__":
    main()
