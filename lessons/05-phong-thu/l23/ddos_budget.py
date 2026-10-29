#!/usr/bin/env python3
"""Mô phỏng trần request mỗi giây theo tầng, và một quy tắc đếm theo IP
trong cửa sổ cố định, trên lưu lượng có người thật đi sau một NAT chung.

ĐÂY LÀ MÔ PHỎNG, không gọi AWS. Mọi con số đầu vào là giả định của kịch bản
và được in ra trước khi tính, để kết quả đọc được cùng tham số sinh ra nó.
"""

from __future__ import annotations

KB = 1024
MB = 1024 * KB

# --- Giả định tầng, in ra ở đầu chương trình -------------------------------
EDGE_BITS_PER_SECOND = 10_000_000_000   # Giả sử CloudFront nhận 10 Gbps
AVG_REQUEST_BYTES = 12 * KB             # Giả sử mỗi request 12 KB

GATEWAY_STEADY_RPS = 10_000             # Giả sử hạn mức ổn định của cổng vào
LAMBDA_CONCURRENCY = 1_000              # Giả sử trần concurrency của tài khoản
LAMBDA_P99_SECONDS = 0.12               # Giả sử p99 một lần gọi
LAMBDA_RPS_PER_UNIT = 10                # Giả sử 10 request/giây mỗi đơn vị

DB_MAX_CONNECTIONS = 200                # Giả sử trần kết nối cơ sở dữ liệu
DB_QUERY_SECONDS = 0.05                 # Giả sử một truy vấn mất 50 ms

# --- Giả định lưu lượng cho phần mô phỏng đếm theo IP ----------------------
REAL_USERS = 300                        # Giả sử 300 người thật sau một NAT
REAL_USER_RPS = 0.5                     # Giả sử mỗi người 0,5 request/giây, tức 1 request mỗi 2 giây
ATTACK_IPS = 40_000                     # Giả sử 40.000 địa chỉ tấn công
ATTACK_SECONDS_PER_REQUEST = 3          # Giả sử mỗi IP 1 request mỗi 3 giây
WINDOW_SECONDS = 60                     # Giả sử cửa sổ cố định 60 giây
DURATION_SECONDS = 180                  # Giả sử chạy 3 cửa sổ
IP_LIMIT = 1_000                        # Giả sử ngưỡng 1.000 request mỗi cửa sổ mỗi IP
COUNT_ALL_LIMIT = 5_000                 # Giả sử ngưỡng 5.000 request mỗi cửa sổ, đếm tổng


def ceilings() -> list[tuple[str, float, str]]:
    edge_rps = EDGE_BITS_PER_SECOND / 8 / AVG_REQUEST_BYTES
    lambda_by_time = LAMBDA_CONCURRENCY / LAMBDA_P99_SECONDS
    lambda_by_invoke = LAMBDA_RPS_PER_UNIT * LAMBDA_CONCURRENCY
    db_rps = DB_MAX_CONNECTIONS / DB_QUERY_SECONDS
    return [
        ("Edge (băng thông)", edge_rps, "bit/giây chia cho byte mỗi request"),
        ("Gateway (hạn mức)", float(GATEWAY_STEADY_RPS), "hạn mức ổn định của tài khoản"),
        ("Lambda (concurrency/p99)", lambda_by_time, "trần concurrency chia p99"),
        ("Lambda (lượt gọi)", lambda_by_invoke, "10 request/giây mỗi đơn vị"),
        ("DB (kết nối/truy vấn)", db_rps, "trần kết nối chia thời gian một truy vấn"),
    ]


def simulate(limit: int, *, count_all: bool) -> dict:
    """Đếm theo cửa sổ cố định. Trả về thống kê từng cửa sổ và tổng."""
    windows: list[dict] = []
    totals = {
        "real_sent": 0, "real_pass": 0, "real_block": 0,
        "atk_sent": 0, "atk_pass": 0, "atk_block": 0,
        "real_first_block_second": None,
    }

    per_ip = [0] * (ATTACK_IPS + 1)   # chỉ số 0 là IP của NAT chung
    total_counter = 0
    # số giây giữa hai request của cùng một người, suy ra từ REAL_USER_RPS
    period = max(1, round(1 / REAL_USER_RPS))

    for w in range(DURATION_SECONDS // WINDOW_SECONDS):
        per_ip = [0] * (ATTACK_IPS + 1)
        total_counter = 0
        win = {
            "index": w, "real_sent": 0, "real_pass": 0,
            "atk_sent": 0, "atk_pass": 0, "atk_block": 0,
        }
        for t in range(w * WINDOW_SECONDS, (w + 1) * WINDOW_SECONDS):
            # người thật: mỗi người gửi 1 request mỗi `period` giây, lệch pha theo chỉ số
            for u in range(REAL_USERS):
                if (t + u) % period != 0:
                    continue
                win["real_sent"] += 1
                totals["real_sent"] += 1
                if count_all:
                    total_counter += 1
                    if total_counter <= limit:
                        win["real_pass"] += 1
                        totals["real_pass"] += 1
                        continue
                    totals["real_block"] += 1
                    if totals["real_first_block_second"] is None:
                        totals["real_first_block_second"] = t
                    continue
                if per_ip[0] < limit:
                    per_ip[0] += 1
                    win["real_pass"] += 1
                    totals["real_pass"] += 1
                else:
                    totals["real_block"] += 1
                    if totals["real_first_block_second"] is None:
                        totals["real_first_block_second"] = t
            # tấn công: IP ip gửi khi (t + ip) chia hết cho 3
            offset = (-t) % ATTACK_SECONDS_PER_REQUEST
            for ip in range(1, ATTACK_IPS + 1):
                if ip % ATTACK_SECONDS_PER_REQUEST != offset:
                    continue
                win["atk_sent"] += 1
                totals["atk_sent"] += 1
                if count_all:
                    total_counter += 1
                    if total_counter <= limit:
                        win["atk_pass"] += 1
                        totals["atk_pass"] += 1
                    else:
                        win["atk_block"] += 1
                        totals["atk_block"] += 1
                    continue
                if per_ip[ip] < limit:
                    per_ip[ip] += 1
                    win["atk_pass"] += 1
                    totals["atk_pass"] += 1
                else:
                    win["atk_block"] += 1
                    totals["atk_block"] += 1
        windows.append(win)
    return {"windows": windows, "totals": totals}


def pct(part: int, whole: int) -> str:
    return f"{100 * part / whole:.1f}%" if whole else "0.0%"


def print_params() -> None:
    print("=== Tham số giả định (mọi con số dưới đây là giả định của kịch bản) ===")
    print(f"  Edge        : {EDGE_BITS_PER_SECOND / 1e9:.0f} Gbps, mỗi request {AVG_REQUEST_BYTES // KB} KB")
    print(f"  Gateway     : {GATEWAY_STEADY_RPS:,} request/giây (hạn mức ổn định)")
    print(f"  Lambda      : trần {LAMBDA_CONCURRENCY:,} concurrency, p99 {LAMBDA_P99_SECONDS} s, "
          f"{LAMBDA_RPS_PER_UNIT} request/giây mỗi đơn vị")
    print(f"  DB          : {DB_MAX_CONNECTIONS} kết nối, một truy vấn {DB_QUERY_SECONDS * 1000:.0f} ms")
    print(f"  Người thật  : {REAL_USERS} người sau một NAT chung, mỗi người {REAL_USER_RPS} request/giây")
    print(f"  Tấn công    : {ATTACK_IPS:,} IP, mỗi IP 1 request mỗi {ATTACK_SECONDS_PER_REQUEST} giây")
    print(f"  Quy tắc     : {IP_LIMIT:,} request mỗi IP mỗi cửa sổ {WINDOW_SECONDS} giây")


def print_ceilings() -> None:
    print("\n=== Trần request mỗi giây của từng tầng ===")
    rows = ceilings()
    for name, value, why in rows:
        print(f"  {name:<26}{value:>10,.0f}   ({why})")
    binding = min(rows, key=lambda r: r[1])
    print(f"  => trần thật của hệ thống: {binding[1]:,.0f} request/giây, ở tầng {binding[0]}")
    print(f"  => tầng nào vượt trần thật trước thì tầng đó quyết định, không phải tầng to nhất")


def print_windows(result: dict, title: str) -> None:
    print(f"\n  {title}")
    head = f"  {'cửa sổ':<8}{'thật gửi':>10}{'thật qua':>10}{'thật bị chặn':>14}{'tấn công gửi':>14}{'tấn công lọt':>14}{'tấn công bị chặn':>18}"
    print(head)
    for w in result["windows"]:
        print(f"  {w['index']:<8}{w['real_sent']:>10,}{w['real_pass']:>10,}"
              f"{w['real_sent'] - w['real_pass']:>14,}{w['atk_sent']:>14,}"
              f"{w['atk_pass']:>14,}{w['atk_block']:>18,}")
    t = result["totals"]
    print(f"  Tổng người thật bị chặn : {t['real_block']:,} / {t['real_sent']:,} "
          f"({pct(t['real_block'], t['real_sent'])})")
    print(f"  Tổng tấn công lọt       : {t['atk_pass']:,} / {t['atk_sent']:,} "
          f"({pct(t['atk_pass'], t['atk_sent'])})")
    if t["real_first_block_second"] is not None:
        print(f"  Người thật bị chặn lần đầu ở giây thứ {t['real_first_block_second']}")


def boundary_demo() -> None:
    print("\n=== Biên cửa sổ cố định ===")
    limit = IP_LIMIT
    print(f"  Ngưỡng {limit:,} request mỗi cửa sổ {WINDOW_SECONDS} giây, một IP.")
    print(f"  Gửi {limit:,} request ở giây 59 của cửa sổ 1: qua.")
    print(f"  Gửi {limit:,} request ở giây 60 (cửa sổ 2): qua.")
    print(f"  => trong 2 giây, một IP đẩy được {2 * limit:,} request, gấp đôi ngưỡng.")
    print("  Bộ đếm bị xoá theo mốc thời gian, không theo tốc độ.")


def main() -> None:
    print("MÔ PHỎNG bằng thư viện chuẩn. Không gọi AWS, không có lưu lượng thật.\n")
    print_params()
    print_ceilings()

    print("\n=== Đếm theo IP, cửa sổ cố định ===")
    print(f"  Ngưỡng {IP_LIMIT:,} request mỗi IP mỗi {WINDOW_SECONDS} giây; "
          f"{REAL_USERS} người thật dùng chung một IP NAT.")
    res = simulate(IP_LIMIT, count_all=False)
    print_windows(res, "Kết quả:")

    print("\n=== Nâng ngưỡng để cứu NAT ===")
    print(f"  Ngưỡng {10 * IP_LIMIT:,} request mỗi IP mỗi {WINDOW_SECONDS} giây.")
    res2 = simulate(10 * IP_LIMIT, count_all=False)
    print_windows(res2, "Kết quả:")

    print("\n=== Đổi kiểu gom: đếm toàn bộ request khớp một phạm vi ===")
    print(f"  Ngưỡng {COUNT_ALL_LIMIT:,} request mỗi {WINDOW_SECONDS} giây, không chia theo IP.")
    res3 = simulate(COUNT_ALL_LIMIT, count_all=True)
    print_windows(res3, "Kết quả:")

    boundary_demo()

    print("\n=== Đọc kết quả ===")
    t = res["totals"]
    print(f"  Chặn theo IP: người thật mất {pct(t['real_block'], t['real_sent'])} request, "
          f"tấn công lọt {pct(t['atk_pass'], t['atk_sent'])} request.")
    print("  Cái mất nằm ở phía người thật, cái được nằm ở phía kẻ tấn công.")
    print("  Chặn sớm chỉ rẻ khi tầng chặn còn phân biệt được hai phía.")


if __name__ == "__main__":
    main()
