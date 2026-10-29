# L11: Test thay client AWS bằng fake ở đúng chỗ

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ mở bằng "Bước 1. Đoán trước" về hai đường import khác nhau, trong khi người đọc chưa biết `dependency_overrides` là dict và key của nó là **function object**. Thiếu bước nền đó thì câu hỏi đoán trước không có gì để bám.
- **Thuật ngữ chưa giải thích:** `dependency_overrides`, `patch`, `namespace`, `fixture`, `teardown`, `monkeypatch`, `moto`, `LocalStack` xuất hiện lần đầu không kèm tiếng Việt trong ngoặc.
- **Thiếu ví von / ví dụ trực diện:** bản cũ không có sơ đồ chữ cho luồng "route khai Depends → FastAPI tra dict → gọi hàm thay thế"; không đặt "Cách tệ" (patch theo tên) cạnh "Cách tốt" (override đúng object) trong cùng một khối.
- **Câu quá dài / khô:** kiểu câu như "Patch theo tên chỉ thay giá trị trong namespace được patch; namespace mà route đọc là namespace của module nó import, không phải của test." — ba mệnh đề, hai lần "namespace", phải đọc lại.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Một suite có 60 test cho API đọc và ghi S3. Client được tạo ở cấp module bằng `boto3.client("s3")`. Mỗi lần chạy suite mất khoảng **14 phút**, vì mọi test đều gọi S3 thật.

Trên máy cá nhân mọi test xanh — vì có credential. Trên CI, nơi không có credential, **cả suite đỏ**. Người trực thêm một hàm mock rồi patch tên client trong module test. Route vẫn gọi S3 thật.

Điều tệ nhất: **test vẫn xanh sau khi patch sai**, vì không có assert nào kiểm tra fake đã được gọi. Suite chỉ đỏ khi mạng hỏng — đúng lúc không ai muốn debug. `(Các con số của kịch bản — cần kiểm tra lại trên hệ thống thật.)`

**Câu hỏi dự đoán:** patch một cái **tên** trong module test có tác động tới **object** mà route đang giữ không?

**Đáp án:** không. Route không tra tên lúc chạy. Nó đã giữ object từ lúc import.

Thuật ngữ dùng trong bài:

- `dependency_overrides` — bảng ánh xạ của FastAPI dùng để thay thế dependency thật bằng bản giả khi chạy test.
- `patch` — thay giá trị của một tên trong **một** namespace cụ thể.
- `namespace` — nơi Python tra tên; mỗi module có một namespace riêng.

### 2. Phép ví von đời thường & Sơ đồ chữ

`dependency_overrides` giống tủ đựng chìa khóa của tòa nhà. Tủ này **không ghi tên chủ phòng** — nó gắn chìa vào đúng **chiếc móc** mà lễ tân đã treo. Bạn muốn thay chìa phòng 101 thì phải thay đúng chiếc móc đó. Làm một chiếc móc mới giống hệt, ghi cũng chữ "101", rồi treo chìa giả lên — lễ tân vẫn ra chiếc móc cũ.

*Giới hạn của phép ví von:* móc treo là vật hữu hình nên dễ nhìn; `function object` thì vô hình, chỉ phân biệt được bằng `id()`.

```text
  route khai:  Depends(get_s3_client)
                     │
                     │  FastAPI ghi nhớ CHÍNH object hàm này
                     ↓
        ┌────────────────────────────────────┐
        │  app.dependency_overrides (dict)   │
        │  key = function object             │
        └───────────────┬────────────────────┘
                        │  mỗi request, tra bằng object
          ┌─────────────┴─────────────┐
          │ khớp                      │ không khớp
          ↓                           ↓
   gọi hàm thay thế (fake)      gọi hàm gốc
   → không ra mạng              → gọi AWS THẬT
          │                           │
          └─────────┬─────────────────┘
                    ↓
     assert fake.assert_called_once()  ← thiếu dòng này,
                                          test vẫn xanh dù đi nhầm nhánh
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Khai báo giữ object, không giữ tên.** Route khai `Depends(get_s3_client)`. FastAPI ghi nhớ **chính object hàm** đó trong danh sách dependency của route.
- **Bước 2 — Tra cứu lúc chạy bằng object.** Mỗi request, FastAPI tra `app.dependency_overrides` bằng object hàm. Có key khớp thì gọi hàm thay thế; không khớp thì gọi hàm gốc.
- **Bước 3 — Vì key là object nên đường import quan trọng.** Hai lần import cùng một hàm qua hai đường dẫn trỏ về **cùng** object thì khớp. Một hàm bọc lại, hoặc module bị nạp hai lần dưới hai tên, tạo object **khác** thì không khớp.
- **Bước 4 — Dọn sau mỗi test và chứng minh fake đã chạy.** Override còn trong dict sẽ ảnh hưởng test sau, nên phải gán lại dict rỗng trong `teardown`. Và phải `assert` fake đã được gọi — nếu không, một override sai vẫn cho suite xanh.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** tạo client ở cấp module rồi `patch` tên `s3` trong module test (hoặc trong module chứa route). Điều xảy ra: test vẫn mất vài giây mỗi lần, vẫn cần credential, vẫn ra mạng. Lý do hỏng: `patch` chỉ đổi giá trị trong **một namespace**; namespace mà route đọc là namespace của **module nó import**, không phải của test.
- **Cách tốt:** đưa client vào qua `Depends`, rồi trong test đặt `app.dependency_overrides[get_s3_client] = lambda: fake`. Kèm hai điều bắt buộc: `assert` fake đã được gọi, và `.clear()` trong `finally`. Lý do giải quyết được: key chính là object mà route đã giữ, nên không có chỗ nào để "trượt".
- **Kiểm chứng bằng code (chạy thật):** `lessons/02-python/L11-test-fake/` có `app.py` và `test_overrides.py` với ba test: một test override đúng chỗ, một test patch sai chỗ, một test kiểm override không rò giữa các test.

```
python -m venv .venv
.venv\Scripts\python -m pip install fastapi httpx pytest
python -m pytest -v
```

Output đã chạy:

```
test_overrides.py::test_dung_cho_thi_fake_duoc_goi PASSED                [ 33%]
test_overrides.py::test_patch_sai_cho_thi_fake_khong_duoc_goi PASSED     [ 66%]
test_overrides.py::test_override_khong_ro_giua_cac_test PASSED           [100%]

============================== warnings summary ===============================
.venv\Lib\site-packages\fastapi\testclient.py:1
  ...\fastapi\testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================== 3 passed, 1 warning in 0.74s =========================
```

Đọc ba tên test là đọc được toàn bộ bài: test thứ nhất chứng minh **override đúng chỗ thì fake được gọi**; test thứ hai chứng minh **patch sai chỗ thì fake không được gọi** — và nó pass nghĩa là ta *phát hiện* được cái sai đó, chứ không phải nó im lặng; test thứ ba chứng minh **override không rò** sang test sau.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** test nhanh, không cần mạng, không cần credential; kiểm được cả nhánh lỗi của AWS bằng cách cho fake ném ngoại lệ; suite chạy được trên CI.
- **Đánh đổi gì:** fake ở ranh giới dependency chỉ chứng minh **route nối đúng**, không chứng minh **câu lệnh AWS đúng**. Mỗi dependency mới là một dòng override mới trong test. Nếu fake không được assert là đã gọi, test xanh có thể chỉ là đang gọi AWS thật.
- **Khi nào KHÔNG nên dùng:** đừng dùng fake ở dependency khi cần kiểm **quyền IAM**, tên bucket hay cấu trúc key thật — những thứ đó chỉ hiện khi gọi dịch vụ thật hoặc dùng dịch vụ giả lập đủ chi tiết (`moto`, `LocalStack`). Đừng dùng nó cho luồng nhiều bước (tạo → đọc → xoá trên S3): fake sẽ phải giả lập quá nhiều hành vi. Và đừng bao giờ để override tồn tại giữa các test.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: Vì sao patch tên client trong module test không có tác dụng?

- **Trả lời mẫu (30–60 giây):** Vì route không tra **tên** lúc chạy; nó giữ **object** đã lấy từ namespace của module nó import. `patch` thay giá trị trong một namespace cụ thể, mà namespace route đọc không phải namespace của test. Patch chỉ hiệu quả khi trỏ đúng **nơi tên được dùng**, không phải nơi nó được định nghĩa. Dấu hiệu: test vẫn gọi mạng, vẫn cần credential, thời gian chạy không giảm.
- **Lỗi hay mắc khi trả lời:** nói "patch sai vì thiếu `autospec`". Cách nói đúng: nguyên nhân là **namespace**, không phải thiếu tham số của `patch`.

### Câu 2: Vì sao key của `dependency_overrides` phải là chính function object?

- **Trả lời mẫu (30–60 giây):** Vì dict tra theo **object**, không theo tên. Hai hàm cùng tên ở hai module là hai object khác nhau. Route ghi nhớ object hàm lúc khai báo, và mỗi request FastAPI tra dict bằng chính object đó. Import lại cùng một hàm qua đường dẫn khác vẫn trỏ về cùng object nếu module không bị nạp hai lần; bọc lại bằng hàm mới thì tạo object khác. Dấu hiệu kiểm chứng: in `id()` của hàm trong route và trong test; khác nhau là override sẽ không khớp.
- **Lỗi hay mắc khi trả lời:** nói "override theo tên hàm, trùng tên là được". Cách nói đúng: nêu key là object, và nêu cách kiểm bằng `id()`.

### Câu 3: Nếu fake không được gọi thì test có xanh không?

- **Trả lời mẫu (30–60 giây):** Có, nếu test không assert. Đó chính là lý do phải assert fake đã được gọi, không chỉ assert mã trạng thái. Override không khớp thì FastAPI gọi hàm gốc; ở môi trường có mạng và credential, kết quả vẫn đúng nên test xanh. Lỗi chỉ lộ ra ở nơi không có mạng hoặc không có quyền — tức là lộ ở CI, không lộ ở máy người viết. Cách kiểm chắc chắn: chạy suite với socket bị chặn; nếu test đỏ thì override chưa từng có tác dụng.
- **Lỗi hay mắc khi trả lời:** nói "test xanh nghĩa là fake đã chạy". Cách nói đúng: xanh chỉ chứng minh **kết quả** đúng, cần thêm assert để chứng minh **đường đi** đúng.

### Câu 4: Có nên để override tồn tại giữa các test không?

- **Trả lời mẫu (30–60 giây):** Không. Dict thuộc về **app**, và app là object cấp module dùng chung cho mọi test. Override còn lại sẽ làm test sau chạy với dependency giả mà không ai chủ ý. Chỉ an toàn nếu mỗi test tạo app riêng, hoặc fixture `teardown` gán lại dict rỗng. Dấu hiệu: chạy cả suite và chạy riêng từng test cho kết quả khác nhau, hoặc đổi thứ tự test thì kết quả đổi.
- **Lỗi hay mắc khi trả lời:** nói "mỗi test tự dọn là được" mà không nói dọn ở đâu. Cách nói đúng: dọn trong `finally` hoặc fixture `teardown`, để test fail giữa chừng vẫn dọn.

---
## Ghi chú nguồn

- https://fastapi.tiangolo.com/advanced/testing-dependencies/ — `app.dependency_overrides` là dict, key là hàm dependency gốc, value là hàm thay thế; đặt lại bằng dict rỗng.
- https://docs.python.org/3/library/unittest.mock.html — `patch` theo namespace và `assert_called_once_with`.
- https://docs.pytest.org/en/stable/how-to/fixtures.html — fixture và teardown.
- Đã kiểm trong bài này: chạy `python -m pytest -v` trong `lessons/02-python/L11-test-fake/`; khối output ba test PASSED và `3 passed, 1 warning in 0.74s` là output thật. Chưa kiểm: hành vi của `moto`/`LocalStack` với phiên bản SDK hiện tại; các con số 60 test, 14 phút là thông số kịch bản.
