#!/usr/bin/env python3
"""Mô phỏng cơ chế deploy tĩnh bằng thư viện chuẩn.

Không gọi AWS. "Bucket" là một thư mục trên đĩa; 404 là tệp không tồn tại.
Ba thứ được mô phỏng:
  1. Hai chính sách cache cho hai loại tệp.
  2. Deploy có xoá tệp cũ (--delete) so với deploy giữ tệp cũ.
  3. Rollback bằng cách đổi con trỏ `current`, so với build lại từ commit cũ.
"""

from __future__ import annotations

import hashlib
import re
import shutil
import tempfile
from pathlib import Path

POLICY_ASSET = "public, max-age=31536000, immutable"
POLICY_INDEX = "no-cache"
POLICY_UNIFORM = "public, max-age=86400"

SOURCES = {
    "v1": {
        "app.js": "console.log('v1');",
        "style.css": "body{color:#111}",
    },
    "v2": {
        "app.js": "console.log('v2');\nconsole.log('tinh nang moi');",
        "style.css": "body{color:#222}",
    },
}


def short_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:8]


def build(version: str, dep_version: str = "ui@1.4.0") -> dict[str, str]:
    """Trả về mapping đường dẫn tương đối -> nội dung, giống đầu ra một bundler."""
    files: dict[str, str] = {}
    tags: list[str] = []
    for name, body in SOURCES[version].items():
        body = f"/* bundled with {dep_version} */\n{body}"
        stem, ext = name.rsplit(".", 1)
        hashed = f"assets/{stem}.{short_hash(body)}.{ext}"
        files[hashed] = body
        if ext == "js":
            tags.append(f'<script src="/{hashed}"></script>')
        else:
            tags.append(f'<link rel="stylesheet" href="/{hashed}">')
    files["index.html"] = (
        "<!doctype html>\n" + "\n".join(tags) + f"\n<!-- build {version} -->\n"
    )
    return files


def cache_control_for(path: str, two_policies: bool) -> str:
    if not two_policies:
        return POLICY_UNIFORM
    return POLICY_INDEX if path.endswith("index.html") else POLICY_ASSET


def refs_of(index_html: str) -> list[str]:
    return re.findall(r'(?:src|href)="/([^"]+)"', index_html)


class Site:
    """Một bucket: assets dùng chung, mỗi release một index.html, một con trỏ."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.assets = root / "assets"
        self.releases = root / "releases"
        self.assets.mkdir(parents=True)
        self.releases.mkdir(parents=True)

    def deploy(self, version: str, *, delete_extras: bool) -> None:
        files = build(version)
        for rel, body in files.items():
            if rel == "index.html":
                continue
            target = self.root / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")
        release = self.releases / version
        release.mkdir(parents=True, exist_ok=True)
        (release / "index.html").write_text(files["index.html"], encoding="utf-8")
        (self.root / "current").write_text(version, encoding="utf-8")
        if delete_extras:
            keep = {rel for rel in files if rel != "index.html"}
            for path in sorted(self.assets.iterdir()):
                if f"assets/{path.name}" not in keep:
                    path.unlink()

    def current_version(self) -> str:
        return (self.root / "current").read_text(encoding="utf-8").strip()

    def rollback(self, version: str) -> None:
        (self.root / "current").write_text(version, encoding="utf-8")

    def fetch(self, path: str) -> tuple[int, str]:
        path = path.lstrip("/")
        if path in ("", "index.html"):
            return self._read(self.releases / self.current_version() / "index.html")
        return self._read(self.root / path)

    @staticmethod
    def _read(path: Path) -> tuple[int, str]:
        if path.is_file():
            return 200, path.read_text(encoding="utf-8")
        return 404, ""


def line(label: str, value: str) -> None:
    print(f"  {label:<44}{value}")


def report_client(site: Site, cached_index: str, note: str) -> None:
    print(f"  {note}")
    refs = refs_of(cached_index)
    worst = 200
    for ref in refs:
        status, _ = site.fetch(ref)
        worst = max(worst, status)
        line(f"GET /{ref}", f"{status}")
    if worst >= 400:
        print("  => màn hình trắng: index đang dùng trỏ tới tệp không còn")
    else:
        print("  => trang lên: mọi tệp index trỏ tới đều còn")


def case_a(root: Path) -> None:
    print("\n=== A. Một chính sách cache 24h cho mọi tệp, deploy có --delete ===")
    site = Site(root / "a")
    site.deploy("v1", delete_extras=False)
    client_index = site.fetch("index.html")[1]
    line("index.html của v1 đã tải về máy khách", "có")
    print(f"  Cache-Control của index.html và assets: {POLICY_UNIFORM}")
    print("  Máy khách giữ index đó 24 giờ và không hỏi lại.")
    print("\n  22:04 deploy v2, sync --delete:")
    site.deploy("v2", delete_extras=True)
    print(f"  assets còn lại: {sorted(p.name for p in site.assets.iterdir())}")
    print("\n  Máy khách mở lại trang bằng index đã lưu:")
    report_client(site, client_index, "index trong máy khách vẫn là bản v1")


def case_b(root: Path) -> None:
    print("\n=== B. Hai chính sách cache, deploy không xoá tệp cũ ===")
    site = Site(root / "b")
    site.deploy("v1", delete_extras=False)
    stale_index = site.fetch("index.html")[1]
    print(f"  Cache-Control index.html: {cache_control_for('index.html', True)}")
    print(f"  Cache-Control assets:     {cache_control_for('assets/x.js', True)}")
    print("\n  Deploy v2: đẩy assets trước, rồi mới đẩy index.html.")
    site.deploy("v2", delete_extras=False)
    print(f"  assets còn lại: {sorted(p.name for p in site.assets.iterdir())}")
    fresh = site.fetch("index.html")
    line("GET /index.html sau deploy", f"{fresh[0]}")
    report_client(site, fresh[1], "Máy khách mới: index vừa tải")
    report_client(site, stale_index, "Máy khách còn cầm index v1 (tab mở từ trước)")


def case_c(root: Path) -> None:
    print("\n=== C. Rollback: đổi con trỏ về release cũ ===")
    site = Site(root / "c")
    site.deploy("v1", delete_extras=False)
    v1_index = site.fetch("index.html")[1]
    site.deploy("v2", delete_extras=False)
    line("con trỏ current trước rollback", site.current_version())
    broken = site.fetch("index.html")
    print("\n  Bản v2 có lỗi. Rollback bằng một lần ghi con trỏ:")
    site.rollback("v1")
    line("con trỏ current sau rollback", site.current_version())
    line("số bước build lại", "0")
    line("số tệp phải chép", "0 (assets của v1 vẫn nằm trên bucket)")
    fresh = site.fetch("index.html")
    report_client(site, fresh[1], "Máy khách tải index sau rollback")
    report_client(site, v1_index, "Máy khách còn cầm index v1 từ trước")
    print("\n  So sánh: revert commit rồi build lại, không giữ artifact.")
    rebuilt = build("v1", dep_version="ui@1.5.0")
    print("  Giả sử giữa hai lần build, thư viện ui lên 1.4.0 -> 1.5.0.")
    print(f"  index v1 gốc trỏ tới : {refs_of(v1_index)}")
    print(f"  index build lại      : {refs_of(rebuilt['index.html'])}")
    print(f"  hai đường dẫn trùng nhau: {refs_of(v1_index) == refs_of(rebuilt['index.html'])}")
    print(f"  (bản v2 đang phục vụ trước rollback: {broken[0]}, dài {len(broken[1])} byte)")


def main() -> None:
    print("Mô phỏng deploy tĩnh. Không gọi AWS: bucket là thư mục trên đĩa.")
    print("Giả sử: build v1 và v2 mỗi bản gồm index.html + 2 tệp có hash trong tên.")
    workdir = Path(tempfile.mkdtemp(prefix="deploy-sim-"))
    try:
        v1, v2 = build("v1"), build("v2")
        print("\n=== Bản build ===")
        for name, files in (("v1", v1), ("v2", v2)):
            for rel in sorted(files):
                if rel != "index.html":
                    print(f"  {name}  {rel}")
        case_a(workdir)
        case_b(workdir)
        case_c(workdir)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    main()
