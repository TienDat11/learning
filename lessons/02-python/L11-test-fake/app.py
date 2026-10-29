"""App FastAPI nho: route doc S3 qua mot dependency.

Client that o day KHONG goi AWS. No ném loi ngay khi bi goi, de bat ky test nao
lo ra ngoai fake deu do ngay tai cho, thay vi am tham goi mang.
"""

from fastapi import Depends, FastAPI

app = FastAPI()

BUCKET = "docs"


class RealS3Client:
    """Cho trong cua boto3.client("s3"): khong goi mang, chi bao "day la client that"."""

    def head_object(self, Bucket: str, Key: str):
        raise RuntimeError("goi client that: khong duoc phep trong test")


def get_s3_client():
    return RealS3Client()


@app.get("/objects/{key}")
def read_object(key: str, client=Depends(get_s3_client)):
    meta = client.head_object(Bucket=BUCKET, Key=key)
    return {"key": key, "size": meta["ContentLength"]}
