"""Ba biến thể endpoint để đo chỗ nhường lượt: def, async def + sleep chặn, async def + await."""

import asyncio
import time

from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/def-sleep")
def def_sleep():
    # def: FastAPI đẩy hàm này sang nhóm luồng ngoài.
    time.sleep(0.2)
    return {"ok": True}


@app.get("/async-block")
async def async_block():
    # async def nhưng thân hàm gọi lệnh chặn: giữ event loop suốt 0,2 giây.
    time.sleep(0.2)
    return {"ok": True}


@app.get("/async-await")
async def async_await():
    # await trên I/O bất đồng bộ: nhường lượt cho loop trong 0,2 giây.
    await asyncio.sleep(0.2)
    return {"ok": True}
