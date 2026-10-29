# L25 — Bảng quyết định chọn framework theo ba trục, cộng một ví dụ sinh OpenAPI.
# Chạy: ./.venv/Scripts/python.exe framework_axes.py
# Đây là bảng quyết định và một ví dụ sinh schema. KHÔNG phải benchmark.

import json
import sys
from dataclasses import dataclass

# ---------------------------------------------------------------- trục và cái giá


@dataclass(frozen=True)
class TraLoi:
    ten: str
    cho_gi: str          # trục 1: request chờ gì
    schema_tu: str       # trục 2: nguồn sự thật của schema
    co_san: tuple        # trục 3: thành phần muốn có sẵn
    so_request: int      # giả định, để minh hoạ cái giá vận hành


GIA = {
    "FastAPI": (
        "Routing, validate và OpenAPI có sẵn; đổi lại bạn tự dựng ORM, migration, "
        "admin và auth, và tự chọn driver bất đồng bộ đúng."
    ),
    "Django": (
        "ORM, migration, admin, auth có sẵn; đổi lại mọi thứ đi kèm một quan điểm, "
        "và bẻ quan điểm đó thường đắt hơn viết từ đầu."
    ),
    "Flask": (
        "Tự do tối đa, ghép thư viện theo ý; đổi lại bộ khung tự chế luôn thiếu "
        "người bảo trì và bạn tự chịu mọi ranh giới."
    ),
}


def chon(t: TraLoi) -> str:
    """Ba câu trả lời vào, một tên framework ra. Luật in ra kèm lý do."""
    if t.schema_tu == "type-hint" and t.cho_gi in ("io-mang", "io-db"):
        return "FastAPI"
    if {"admin", "orm", "migration", "auth"} & set(t.co_san) and t.schema_tu == "db-model":
        return "Django"
    if t.cho_gi == "cpu" and not t.co_san:
        return "Flask"
    if t.schema_tu == "type-hint":
        return "FastAPI"
    if t.schema_tu == "db-model":
        return "Django"
    return "Flask"


def in_bang(t: TraLoi) -> None:
    chon_roi = chon(t)
    print(f"--- Đầu vào mẫu: {t.ten} ---")
    print(f"  Trục 1 — request chờ gì:            {t.cho_gi}")
    print(f"  Trục 2 — schema lấy từ đâu:         {t.schema_tu}")
    print(f"  Trục 3 — thành phần muốn có sẵn:    {', '.join(t.co_san) if t.co_san else 'không có'}")
    print(f"  Giả sử có {t.so_request} request mỗi giây.")
    print(f"  => Chọn: {chon_roi}")
    print(f"  Cái giá: {GIA[chon_roi]}")
    if chon_roi == "FastAPI" and t.cho_gi == "cpu":
        print("  Cảnh báo: chờ CPU thì event loop không giúp gì; đẩy việc sang worker riêng.")
    if chon_roi != "FastAPI" and t.cho_gi == "io-mang":
        print("  Cảnh báo: phần lớn thời gian là chờ I/O; mô hình đồng bộ sẽ giữ luồng trong lúc chờ.")
    print()


MAU = [
    TraLoi(
        ten="API tra cứu cho mobile",
        cho_gi="io-mang",
        schema_tu="type-hint",
        co_san=(),
        so_request=120,
    ),
    TraLoi(
        ten="Bảng điều khiển nội bộ cho vận hành",
        cho_gi="io-db",
        schema_tu="db-model",
        co_san=("admin", "orm", "migration", "auth"),
        so_request=15,
    ),
    TraLoi(
        ten="Service nhỏ nén ảnh, hai endpoint",
        cho_gi="cpu",
        schema_tu="tu-chon",
        co_san=(),
        so_request=5,
    ),
]


def phan_bang_quyet_dinh() -> None:
    print("========== A. Bảng quyết định theo ba trục ==========")
    print("Số request mỗi giây chỉ là giả định của kịch bản.\n")
    for t in MAU:
        in_bang(t)


# ---------------------------------------------------------------- OpenAPI sinh từ type hint

def phan_openapi() -> None:
    print("========== B. OpenAPI sinh từ type hint ==========")
    try:
        import fastapi
        from fastapi import FastAPI, Query
        from pydantic import BaseModel
    except ImportError:
        print("Không import được fastapi trong môi trường này.")
        print("Chạy: uv venv --python <python3> .venv && uv pip install --python .venv/Scripts/python.exe fastapi")
        return

    class OrderOut(BaseModel):
        id: int
        code: str
        status: str
        total: float

    app = FastAPI(title="Đơn hàng")

    @app.get("/orders/{order_id}", response_model=OrderOut)
    def doc_don(
        order_id: int,
        tenant: str = Query(description="Mã tenant, bắt buộc theo hợp đồng"),
        chi_tiet: bool = False,
    ) -> OrderOut:
        return OrderOut(id=order_id, code=f"ORD-{order_id}", status="pending", total=10.0)

    spec = app.openapi()
    print(f"fastapi {fastapi.__version__}")
    print(f"Đường dẫn có trong hợp đồng: {sorted(spec['paths'].keys())}")
    tham_so = spec["paths"]["/orders/{order_id}"]["get"]["parameters"]
    print("Tham số của route, sinh từ chữ ký hàm:")
    for p in tham_so:
        print(f"  {p['name']:10s} in={p['in']:6s} required={p['required']} schema={json.dumps(p['schema'])}")
    print("Schema của response, sinh từ model Pydantic:")
    print(json.dumps(spec["components"]["schemas"]["OrderOut"], ensure_ascii=False, indent=2))
    print(f"Kiểu trả về khai báo trong type hint: {OrderOut.__name__}")
    print("Số dòng tài liệu phải viết tay: 0 (mọi thứ trên đây sinh từ khai báo type).")


if __name__ == "__main__":
    phan_bang_quyet_dinh()
    phan_openapi()
