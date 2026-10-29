"""So sanh backoff khong jitter va co jitter khi 200 client cung gap loi.

Chay: python jitter_sim.py

Mo phong, khong goi mang. Moi client that bai cung mot luc (t=0). Server "chet"
toi giay thu 2, sau do chi nhan 50 request moi giay. Client thu lai toi 4 lan,
backoff = base * 2^k.

Dung random.Random(seed) nen ket qua lap lai y nguyen moi lan chay.
"""

import heapq
import random

CLIENTS = 200
BASE = 0.5          # giay
MAX_ATTEMPTS = 5    # 1 lan dau + 4 lan thu lai
DOWN_UNTIL = 2.0    # server chua phuc vu duoc truoc moc nay
CAPACITY = 50       # request duoc nhan trong mot giay sau khi server song lai
SEED = 7


def run(use_jitter: bool):
    rnd = random.Random(SEED)
    events = [(0.0, i, 0) for i in range(CLIENTS)]
    heapq.heapify(events)

    sent_times = []          # thoi diem moi request toi server
    accepted_per_second = {}
    ok = 0
    retry_times = []

    while events:
        t, client, attempt = heapq.heappop(events)
        sent_times.append(t)
        if attempt > 0:
            retry_times.append(t)

        if t < DOWN_UNTIL:
            failed = True
        else:
            sec = int(t)
            used = accepted_per_second.get(sec, 0)
            if used < CAPACITY:
                accepted_per_second[sec] = used + 1
                failed = False
            else:
                failed = True

        if not failed:
            ok += 1
            continue
        if attempt + 1 >= MAX_ATTEMPTS:
            continue

        delay = BASE * (2 ** attempt)
        if use_jitter:
            delay = rnd.uniform(0.0, delay)
        heapq.heappush(events, (t + delay, client, attempt + 1))

    return sent_times, retry_times, ok


def peak_per_window(times, width=0.1):
    """So request lon nhat roi vao cung mot cua so `width` giay."""
    times = sorted(times)
    best = 0
    j = 0
    for i in range(len(times)):
        while times[i] - times[j] > width:
            j += 1
        best = max(best, i - j + 1)
    return best


def main() -> None:
    print("Mo phong: %d client cung loi tai t=0; server song lai sau %.1fs,"
          % (CLIENTS, DOWN_UNTIL))
    print("nhan toi da %d request/giay; backoff %.1fs * 2^k; toi da %d lan gui moi client."
          % (CAPACITY, BASE, MAX_ATTEMPTS))
    print()

    for label, use_jitter in (("khong jitter", False), ("co jitter (full jitter)", True)):
        sent, retries, ok = run(use_jitter)
        print("%-26s tong gui: %5d | dinh 100ms khi thu lai: %4d | xong: %3d/200"
              % (label, len(sent), peak_per_window(retries), ok))
        print("%-26s dinh 100ms tinh ca lan dau: %4d" % ("", peak_per_window(sent)))


if __name__ == "__main__":
    main()
