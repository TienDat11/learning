"""L18 - kiểm hợp đồng API giữa Vue và FastAPI bằng bốn lời gọi thật.

Chạy: python contract_check.py
Không cần server thật: TestClient gọi thẳng app trong cùng tiến trình, nên mã
và body in ra đúng như một client HTTP nhìn thấy.

Ba kết quả của cùng một route POST /orders:
  201  tạo mới thành công, kèm header Location
  409  SKU nằm trong danh sách chặn (xung đột nghiệp vụ)
  422  body sai hình dạng, do Pydantic chặn trước khi handler chạy
"""

import json
import warnings
from itertools import count

# TestClient của Starlette cảnh báo về httpx mỗi lần import; ẩn để output sạch.
warnings.filterwarnings("ignore", message=".*httpx.*")

from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

app = FastAPI()

BANNED_SKUS = {"banned-sku"}
_order_ids = count(1001)
_corr_ids = count(1)
_orders: dict[str, dict] = {}


def next_corr() -> str:
    return f"corr-{next(_corr_ids):04d}"


class CreateOrder(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    qty: int = Field(ge=1, le=999)


class OrderOut(BaseModel):
    id: str
    sku: str
    qty: int


class ApiError(Exception):
    """Lỗi nghiệp vụ mang sẵn mã HTTP. Nơi ném lỗi quyết định mã."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message


@app.exception_handler(ApiError)
async def on_api_error(request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "correlation_id": next_corr(),
        },
    )


@app.exception_handler(RequestValidationError)
async def on_invalid_body(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "code": "invalid_body",
            "message": "Body không đúng hình dạng; xem details.",
            "correlation_id": next_corr(),
            "details": [
                {"field": ".".join(str(part) for part in err["loc"]), "msg": err["msg"]}
                for err in exc.errors()
            ],
        },
    )


@app.post("/orders", status_code=status.HTTP_201_CREATED, response_model=OrderOut)
async def create_order(body: CreateOrder, response: Response):
    if body.sku in BANNED_SKUS:
        raise ApiError(409, "sku_blocked", f"SKU {body.sku} đang bị chặn")
    oid = f"ord-{next(_order_ids)}"
    order = {"id": oid, "sku": body.sku, "qty": body.qty}
    _orders[oid] = order
    response.headers["Location"] = f"/orders/{oid}"
    # Handler trả thừa một trường nội bộ; response_model là màng lọc chiều ra.
    return {**order, "internal_note": "chờ kế toán duyệt"}


@app.get("/orders/{order_id}", response_model=OrderOut)
async def read_order(order_id: str):
    if order_id not in _orders:
        raise ApiError(404, "order_not_found", f"Không có đơn {order_id}")
    return _orders[order_id]


client = TestClient(app)
results: list[tuple[str, int]] = []


def show(title: str, path: str, payload: dict) -> None:
    resp = client.post(path, json=payload)
    results.append((title, resp.status_code))
    print(f"=== {title} ===")
    print(f"POST {path}  gửi: {json.dumps(payload, ensure_ascii=False)}")
    print(f"<- {resp.status_code}")
    location = resp.headers.get("location")
    if location:
        print(f"Location: {location}")
    print(f"body: {json.dumps(resp.json(), ensure_ascii=False)}")
    print()


show("1. Tạo mới hợp lệ", "/orders", {"sku": "abc-1", "qty": 2})
show("2. SKU bị chặn", "/orders", {"sku": "banned-sku", "qty": 1})
show("3. Dữ liệu sai hình dạng", "/orders", {"sku": "abc-1", "qty": 0})
show("4. Client cũ gửi tên trường cũ", "/orders", {"sku": "abc-1", "quantity": 2})

print("=== Bảng mã, in từ chính các response ở trên ===")
for title, code in results:
    print(f"{code}  {title}")

print()
print("=== Dùng Location của đơn vừa tạo ===")
created = client.get("/orders/ord-1001")
print(f"GET /orders/ord-1001 -> {created.status_code}")
print(f"body: {json.dumps(created.json(), ensure_ascii=False)}")
