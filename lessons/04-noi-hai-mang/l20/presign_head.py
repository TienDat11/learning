"""Mô phỏng hai nửa của một lần upload lên S3, không gọi AWS.

Nửa thứ nhất: tự tính một presigned URL SigV4 cho PUT, bằng credential giả.
Nửa thứ hai: mô phỏng head_object trên một dict, rồi quyết định READY hay không.

Phần head_object là MÔ PHỎNG bằng thư viện chuẩn, không phải lời gọi S3 thật.
Phần ký thì tính đúng theo công thức trong tài liệu S3; script tự đối chiếu với
ví dụ có sẵn trong tài liệu trước khi dùng.
"""

import hashlib
import hmac
import urllib.parse

# ---------------------------------------------------------------- SigV4

def uri_encode(text: str, encode_slash: bool = True) -> str:
    """Encode theo đúng luật của SigV4: chỉ giữ A-Z a-z 0-9 - . _ ~."""
    out = []
    for byte in text.encode("utf-8"):
        ch = chr(byte)
        if ch.isalnum() and byte < 128 or ch in "-._~":
            out.append(ch)
        elif ch == "/" and not encode_slash:
            out.append(ch)
        else:
            out.append("%%%02X" % byte)
    return "".join(out)


def hmac_sha256(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def signing_key(secret: str, date: str, region: str, service: str) -> bytes:
    k = hmac_sha256(("AWS4" + secret).encode("utf-8"), date)
    k = hmac_sha256(k, region)
    k = hmac_sha256(k, service)
    return hmac_sha256(k, "aws4_request")


def presign(method, host, path, region, access_key, secret, expires, when,
            extra_headers=None):
    """Trả về (url, các tham số X-Amz-*, canonical_request) của một presigned URL."""
    date = when[:8]
    scope = f"{date}/{region}/s3/aws4_request"
    headers = {"host": host}
    headers.update(extra_headers or {})
    signed_headers = ";".join(sorted(headers))

    params = {
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": f"{access_key}/{scope}",
        "X-Amz-Date": when,
        "X-Amz-Expires": str(expires),
        "X-Amz-SignedHeaders": signed_headers,
    }
    query = "&".join(
        f"{uri_encode(k)}={uri_encode(v)}" for k, v in sorted(params.items())
    )
    canonical_headers = "".join(f"{k}:{headers[k].strip()}\n" for k in sorted(headers))

    # Presigned URL không biết trước nội dung, nên payload hash là hằng số.
    canonical_request = "\n".join([
        method,
        path,
        query,
        canonical_headers,
        signed_headers,
        "UNSIGNED-PAYLOAD",
    ])
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256",
        when,
        scope,
        hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
    ])
    signature = hmac.new(
        signing_key(secret, date, region, "s3"),
        string_to_sign.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    url = f"https://{host}{path}?{query}&X-Amz-Signature={signature}"
    return url, params, signature, canonical_request


# Đối chiếu với ví dụ trong tài liệu S3 trước khi tin code của mình.
DOC_SIGNATURE = "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"
_, _, got, canonical = presign(
    "GET", "examplebucket.s3.amazonaws.com", "/test.txt", "us-east-1",
    "AKIAIOSFODNN7EXAMPLE", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    86400, "20130524T000000Z",
)
print("== Kiểm code ký với ví dụ trong tài liệu S3 ==")
print("chữ ký tính được:", got)
print("chữ ký tài liệu :", DOC_SIGNATURE)
print("khớp:", got == DOC_SIGNATURE)
print()

# ------------------------------------------------------- Presigned URL PUT

BUCKET = "htc-uploads"
REGION = "ap-southeast-1"
HOST = f"{BUCKET}.s3.{REGION}.amazonaws.com"

# Giả sử server đã tự sinh key này; client không chọn được nó.
KEY = "tenant-a/avatar/9f3c1d2e4b5a.png"
# Giả sử bản ghi upload khai 51.200 byte và image/png.
DECLARED_SIZE = 51_200
DECLARED_TYPE = "image/png"
# Giả sử URL sống 600 giây, ký lúc 10:04:12 UTC.
EXPIRES = 600
SIGNED_AT = "20261029T100412Z"

url, params, signature, _ = presign(
    "PUT", HOST, "/" + uri_encode(KEY, encode_slash=False), REGION,
    "AKIAFAKEFAKEFAKE0001", "fake-secret-khong-phai-credential-that",
    EXPIRES, SIGNED_AT, extra_headers={"content-type": DECLARED_TYPE},
)

print("== Presigned URL cho một lần PUT ==")
for name in ("X-Amz-Algorithm", "X-Amz-Credential", "X-Amz-Date",
             "X-Amz-Expires", "X-Amz-SignedHeaders"):
    print(f"{name:<20}{params[name]}")
print(f"{'X-Amz-Signature':<20}{signature}")
print(f"{'Header đã ký':<20}content-type: {DECLARED_TYPE}")
print("URL đầy đủ:")
print(url)
print()
print("Chú ý: trong URL không có kích thước. Không có tham số nào nói")
print(f"object phải nặng đúng {DECLARED_SIZE} byte.")
print()

# --------------------------------------- head_object, mô phỏng bằng dict

class NoSuchKey(Exception):
    """S3 trả 404 khi bạn có quyền ListBucket, 403 khi không có."""


class FakeS3:
    """Mô phỏng rất hẹp: chỉ head_object, chỉ đọc metadata."""

    def __init__(self, objects):
        self.objects = objects
        self.deleted = []

    def head_object(self, bucket, key):
        obj = self.objects.get(key)
        if obj is None:
            raise NoSuchKey(f"HEAD {bucket}/{key} -> 404")
        return dict(obj)

    def delete_version(self, key, version_id):
        self.deleted.append((key, version_id))
        self.objects.pop(key, None)


def confirm(record, store):
    """Đọc metadata thật rồi quyết định. Đây là chỗ API biết sự thật."""
    try:
        meta = store.head_object(BUCKET, record["key"])
    except NoSuchKey:
        return "KHONG-READY", "object chưa tồn tại: client chưa PUT hoặc PUT hỏng"

    if meta["ContentLength"] != record["declared_size"]:
        store.delete_version(record["key"], meta["VersionId"])
        return ("KHONG-READY",
                f"kích thước thật {meta['ContentLength']} byte "
                f"khác lời khai {record['declared_size']} byte; "
                f"đã xoá version {meta['VersionId']}")

    if meta["ContentType"] != record["declared_type"]:
        store.delete_version(record["key"], meta["VersionId"])
        return ("KHONG-READY",
                f"content-type thật {meta['ContentType']} khác lời khai "
                f"{record['declared_type']}; đã xoá version {meta['VersionId']}")

    return "READY", f"khớp {meta['ContentLength']} byte, {meta['ContentType']}"


record = {"key": KEY, "declared_size": DECLARED_SIZE, "declared_type": DECLARED_TYPE}

cases = [
    ("đúng như đã khai", {
        KEY: {"ContentLength": DECLARED_SIZE, "ContentType": "image/png",
              "VersionId": "v1", "ETag": '"a1b2c3"'},
    }),
    ("sai kích thước", {
        KEY: {"ContentLength": 943_718_400, "ContentType": "text/html",
              "VersionId": "v2", "ETag": '"d4e5f6"'},
    }),
    ("object chưa tồn tại", {}),
]

print("== Bước xác nhận: head_object rồi quyết định ==")
print(f"bản ghi khai: {DECLARED_SIZE} byte, {DECLARED_TYPE}")
print()
for label, objects in cases:
    store = FakeS3(objects)
    verdict, reason = confirm(record, store)
    print(f"tình huống: {label}")
    print(f"  quyết định: {verdict}")
    print(f"  lý do     : {reason}")
    print(f"  đã xoá    : {store.deleted if store.deleted else 'không xoá gì'}")
    print()
