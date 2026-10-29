"""Bắn N request đồng thời vào từng endpoint và đo thời gian tường.

Chạy: python bench.py
Server chạy ở tiến trình riêng (một worker uvicorn), client ở tiến trình này,
nên phép đo không bị chính client làm nhiễu.
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
import time
from pathlib import Path

import httpx

PORT = 8011
BASE = f"http://127.0.0.1:{PORT}"
HERE = Path(__file__).resolve().parent


async def wait_ready(client: httpx.AsyncClient) -> None:
    for _ in range(150):
        try:
            response = await client.get(f"{BASE}/health")
            if response.status_code == 200:
                return
        except httpx.TransportError:
            pass
        await asyncio.sleep(0.1)
    raise SystemExit("server không lên")


async def burst(client: httpx.AsyncClient, path: str, count: int) -> float:
    start = time.perf_counter()
    await asyncio.gather(*(client.get(f"{BASE}{path}") for _ in range(count)))
    return time.perf_counter() - start


async def main() -> None:
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app:app", "--port", str(PORT), "--log-level", "warning"],
        cwd=HERE,
    )
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            await wait_ready(client)
            cases = [
                ("/async-await", 10, "async def + await asyncio.sleep"),
                ("/def-sleep", 10, "def + time.sleep"),
                ("/async-block", 10, "async def + time.sleep"),
                ("/def-sleep", 60, "def + time.sleep"),
                ("/async-block", 60, "async def + time.sleep"),
            ]
            print(f"  {'endpoint':<16}{'request':>9}{'thời gian tường':>18}{'mỗi request':>14}  biến thể")
            for path, count, label in cases:
                wall = await burst(client, path, count)
                print(f"  {path:<16}{count:>9}{wall:>15.2f}s{wall / count:>13.2f}s  {label}")
    finally:
        server.terminate()
        server.wait(timeout=20)


if __name__ == "__main__":
    asyncio.run(main())
