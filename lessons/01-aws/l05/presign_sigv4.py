"""Tính chữ ký SigV4 cho một URL ký sẵn của S3, rồi tự kiểm lại chữ ký.

Chạy: python presign_sigv4.py
Không gọi AWS. Credential dưới đây là cặp ví dụ công khai in trong tài liệu AWS,
nên kết quả so được với con số tài liệu đã công bố.
"""

from __future__ import annotations

import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta, timezone

ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
REGION = "us-east-1"
SERVICE = "s3"
ALGORITHM = "AWS4-HMAC-SHA256"
BUCKET = "examplebucket"
EXPECTED_FROM_DOCS = "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"


def uri_encode(value: str, encode_slash: bool = True) -> str:
    """Encode kiểu AWS: giữ A-Z a-z 0-9 - _ . ~, dấu cách thành %20, hex viết hoa."""
    safe = "-_.~" if encode_slash else "-_.~/"
    return urllib.parse.quote(value, safe=safe, encoding="utf-8")


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def hmac_sha256(key: bytes, text: str) -> bytes:
    return hmac.new(key, text.encode("utf-8"), hashlib.sha256).digest()


def signing_key(secret_key: str, date_stamp: str, region: str, service: str) -> bytes:
    key = hmac_sha256(("AWS4" + secret_key).encode("utf-8"), date_stamp)
    key = hmac_sha256(key, region)
    key = hmac_sha256(key, service)
    return hmac_sha256(key, "aws4_request")


def presign(
    method: str,
    key: str,
    expires: int,
    now: datetime,
    access_key: str = ACCESS_KEY,
    secret_key: str = SECRET_KEY,
    region: str = REGION,
    bucket: str = BUCKET,
) -> str:
    """Trả về URL ký sẵn cho đúng một method, đúng một khoá, trong `expires` giây."""
    host = f"{bucket}.s3.amazonaws.com"
    date_stamp = now.strftime("%Y%m%d")
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    scope = f"{date_stamp}/{region}/{SERVICE}/aws4_request"

    params = {
        "X-Amz-Algorithm": ALGORITHM,
        "X-Amz-Credential": f"{access_key}/{scope}",
        "X-Amz-Date": amz_date,
        "X-Amz-Expires": str(expires),
        "X-Amz-SignedHeaders": "host",
    }
    canonical_query = "&".join(
        f"{uri_encode(name)}={uri_encode(value)}" for name, value in sorted(params.items())
    )
    canonical_uri = "/" + uri_encode(key, encode_slash=False)
    canonical_request = "\n".join(
        [
            method,
            canonical_uri,
            canonical_query,
            f"host:{host}\n",
            "host",
            "UNSIGNED-PAYLOAD",
        ]
    )
    string_to_sign = "\n".join(
        [ALGORITHM, amz_date, scope, sha256_hex(canonical_request)]
    )
    signature = hmac.new(
        signing_key(secret_key, date_stamp, region, SERVICE),
        string_to_sign.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return f"https://{host}{canonical_uri}?{canonical_query}&X-Amz-Signature={signature}"


def verify(url: str, method: str = "GET", secret_key: str = SECRET_KEY) -> tuple[str, bool]:
    """Tính lại chữ ký chỉ từ những gì có trong URL, như S3 sẽ làm."""
    parts = urllib.parse.urlsplit(url)
    raw = urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
    params = {name: value for name, value in raw if name != "X-Amz-Signature"}
    signature_in_url = dict(raw)["X-Amz-Signature"]

    access_key, date_stamp, region, service, terminator = params["X-Amz-Credential"].split("/")
    amz_date = params["X-Amz-Date"]
    scope = f"{date_stamp}/{region}/{service}/{terminator}"

    canonical_query = "&".join(
        f"{uri_encode(name)}={uri_encode(value)}" for name, value in sorted(params.items())
    )
    canonical_request = "\n".join(
        [
            method,
            parts.path,
            canonical_query,
            f"host:{parts.netloc}\n",
            params["X-Amz-SignedHeaders"],
            "UNSIGNED-PAYLOAD",
        ]
    )
    string_to_sign = "\n".join([ALGORITHM, amz_date, scope, sha256_hex(canonical_request)])
    recomputed = hmac.new(
        signing_key(secret_key, date_stamp, region, service),
        string_to_sign.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return recomputed, hmac.compare_digest(recomputed, signature_in_url)


def expires_at(url: str) -> datetime:
    parts = urllib.parse.urlsplit(url)
    params = dict(urllib.parse.parse_qsl(parts.query))
    signed_at = datetime.strptime(params["X-Amz-Date"], "%Y%m%dT%H%M%SZ").replace(
        tzinfo=timezone.utc
    )
    return signed_at + timedelta(seconds=int(params["X-Amz-Expires"]))


def main() -> None:
    # Phần 1: kiểm công thức bằng test vector đã công bố trong tài liệu AWS.
    signed_at = datetime(2013, 5, 24, 0, 0, 0, tzinfo=timezone.utc)
    url = presign("GET", "test.txt", 86400, signed_at)

    print("URL ký sẵn:")
    for chunk in url.replace("&", "\n&").splitlines():
        print("  " + chunk)

    print()
    print("Chữ ký trong URL:      ", url.rsplit("=", 1)[1])
    print("Chữ ký tài liệu AWS in:", EXPECTED_FROM_DOCS)
    print("Khớp với tài liệu:     ", url.rsplit("=", 1)[1] == EXPECTED_FROM_DOCS)

    recomputed, ok = verify(url)
    print("Chữ ký tính lại từ URL:", recomputed)
    print("Khớp:                  ", ok)

    # Phần 2: cùng công thức, áp cho kịch bản của bài: một lần PUT, 300 giây.
    print()
    print("Kịch bản: hàm ký PUT cho một khoá, hạn 300 giây.")
    scenario = presign("PUT", "uploads/u-42/a1b2.jpg", 300, signed_at)
    print("  URL:", scenario)

    recomputed_put, ok_put = verify(scenario, method="PUT")
    print("  chữ ký tính lại (PUT):", recomputed_put)
    print("  khớp:                 ", ok_put)

    _, ok_get = verify(scenario, method="GET")
    print("  dùng URL đó cho GET:  ", ok_get)

    tampered = scenario.replace("/uploads/u-42/a1b2.jpg?", "/uploads/u-42/other.jpg?")
    _, ok_tampered = verify(tampered, method="PUT")
    print("  đổi khoá, giữ chữ ký: ", ok_tampered)

    deadline = expires_at(scenario)
    print()
    print("Hạn của URL:", deadline.isoformat())
    for offset in (200, 320):
        moment = signed_at + timedelta(seconds=offset)
        print(
            f"  bấm tải lúc +{offset}s ({moment.strftime('%H:%M:%S')}Z): "
            f"còn hạn = {moment < deadline}"
        )


if __name__ == "__main__":
    main()
