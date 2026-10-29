"""Ba test chung minh: override dung cho thi fake duoc goi, sai cho thi khong.

Chay: python -m pytest -q
"""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app import app, get_s3_client

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_overrides():
    # Dict thuoc ve app, dung chung cho moi test; phai don truoc va sau moi test.
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def test_dung_cho_thi_fake_duoc_goi():
    fake = MagicMock()
    fake.head_object.return_value = {"ContentLength": 12}
    # Key la chinh function object ma route da khai trong Depends.
    app.dependency_overrides[get_s3_client] = lambda: fake

    resp = client.get("/objects/a.txt")

    assert resp.status_code == 200
    assert resp.json() == {"key": "a.txt", "size": 12}
    # Bang chung fake that su duoc dung, khong chi la ma trang thai dung.
    fake.head_object.assert_called_once_with(Bucket="docs", Key="a.txt")


def test_patch_sai_cho_thi_fake_khong_duoc_goi():
    fake = MagicMock()
    fake.head_object.return_value = {"ContentLength": 12}

    # Sai: boc ham goc trong mot ham khac roi dung ham boc lam key.
    # Route giu object goc, nen key nay khong khop voi bat cu thu gi.
    def get_s3_client_wrapper():
        return fake

    app.dependency_overrides[get_s3_client_wrapper] = lambda: fake

    with pytest.raises(RuntimeError):
        client.get("/objects/a.txt")

    # Day la dieu quan trong: fake khong he duoc goi.
    assert fake.head_object.call_count == 0


def test_override_khong_ro_giua_cac_test():
    # Chay sau hai test tren; neu override chua duoc don thi route se dung fake cu.
    with pytest.raises(RuntimeError):
        client.get("/objects/b.txt")
    assert app.dependency_overrides == {}
