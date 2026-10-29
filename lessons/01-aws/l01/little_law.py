# python 3 (standard library only), file: little_law.py, target: Windows 11
# Little's law for L01: concurrent calls L = rps * W.
# Defaults are the scenario's assumptions, not AWS defaults.
import argparse
import math


def concurrent_calls(rps: float, seconds_per_call: float) -> int:
    # round() guards float noise, e.g. 200 * 0.6 may print as 120.00000000000001
    return math.ceil(round(rps * seconds_per_call, 9))


def main() -> None:
    parser = argparse.ArgumentParser(description="Đếm environment và kết nối RDS theo Little's law")
    parser.add_argument("--rps", type=float, default=200, help="request mỗi giây")
    parser.add_argument("--wall", type=float, default=0.6, help="thời gian một lần gọi, tính bằng giây")
    parser.add_argument("--max-conn", type=int, default=40, help="max_connections của RDS")
    args = parser.parse_args()

    envs = concurrent_calls(args.rps, args.wall)
    waiting = max(0, envs - args.max_conn)

    print(f"Giả định: {args.rps:g} request/s, mỗi lần gọi {args.wall:g} s, RDS max_connections = {args.max_conn}")
    print(f"Environment cần (rps x W):              {envs}")
    print(f"Kết nối cần (mỗi environment ấm giữ 1): {envs}")
    print(f"Lần gọi không có kết nối:              {waiting}")
    if waiting:
        print("Vượt trần: mỗi environment ấm giữ một kết nối, nên tăng Lambda là tăng kết nối; lần gọi dư phải chờ hoặc lỗi.")
    elif envs == args.max_conn:
        print("Vừa khít trần: không còn chỗ cho kết nối vận hành hay lưu lượng tăng thêm.")
    else:
        print("Trong trần: còn chỗ dự phòng.")


if __name__ == "__main__":
    main()
