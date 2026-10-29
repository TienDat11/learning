# L07: Một request đi qua FastAPI — `def`, `async def`, và chỗ thật sự nhường lượt

## Phần 1. Review bản cũ — Những chỗ gây khó hiểu

- **Nhảy bước:** bản cũ mở bằng "Bước 1. Đoán trước" với bốn câu hỏi, nhưng người đọc chưa biết `event loop` là gì. "Bước 3" đi ngay vào phép tính `10 × 0,2 = 2,0 giây` mà chưa nói vì sao một lệnh chặn lại giữ được cả loop.
- **Thuật ngữ chưa giải thích:** `event loop`, `nhóm luồng ngoài` (threadpool), `blocking I/O`, `GIL`, `p99`, `response model`, `422` xuất hiện lần đầu mà không có tiếng Việt trong ngoặc.
- **Thiếu ví von / ví dụ trực diện:** bản cũ dùng sơ đồ mermaid thay cho sơ đồ chữ; không có khối nào đặt "Cách tệ" cạnh "Cách tốt" để so; "Bước 5" chỉ có bảng số, người đọc phải tự rút ra kết luận.
- **Câu quá dài / khô:** ví dụ câu nhồi ba mệnh đề — "Cái giá là nhóm luồng có trần: khi mọi suất bị giữ bởi request đang chờ, request mới xếp hàng dù loop rảnh." Cùng ý đó viết lại thành ba câu ngắn.

---

## Phần 2. Bài học viết lại

### 1. Không có thứ này thì đau ở đâu? (Vấn đề thực tế)

Một dịch vụ tài liệu có endpoint xuất báo cáo. Nó gọi một API nội bộ bằng `requests.get` và khai báo bằng `def`. p99 là 140 ms. Ổn.

Một buổi review, cả nhóm đổi mọi endpoint sang `async def` cho "đồng bộ phong cách". Thân hàm giữ nguyên. Chỉ từ khoá đổi.

Sau deploy, ba con số xuất hiện cùng lúc:

- p99 của endpoint báo cáo: **3,8 giây**.
- p99 của `/health` — endpoint chỉ trả một dict tĩnh: **1,1 giây**.
- CPU container: **4 phần trăm**. Log không có một exception nào.

Ba con số này chọi nhau. Độ trễ tăng gần ba chục lần. Máy thì rảnh. Không có lỗi để grep. Load balancer bắt đầu trả 504 vì health check quá hạn. `(Các con số của kịch bản — cần kiểm tra lại trên hệ thống thật.)`

**Câu hỏi dự đoán:** nếu tiến trình không tính toán gì, nó đang chờ cái gì trong 3,8 giây đó? Và vì sao `/health`, endpoint không gọi ra ngoài, lại chậm theo?

**Đáp án:** nó đang chờ mạng. Và `/health` chậm theo vì cả hai endpoint dùng chung một thứ: `event loop` (vòng lặp đơn luồng điều phối các tác vụ chờ).

Bốn thuật ngữ sẽ dùng suốt bài, giải thích ngay tại đây:

- `event loop` — vòng lặp chạy trên **một** luồng, lần lượt chuyển qua các tác vụ đang chờ.
- `blocking I/O` — thao tác vào/ra làm đứng luồng hiện tại cho tới khi xong.
- `threadpool` — nhóm các luồng phụ dựng sẵn để chạy hàm đồng bộ.
- `GIL - Global Interpreter Lock` — khóa toàn cục của CPython chỉ cho một luồng chạy bytecode Python tại một thời điểm.

### 2. Phép ví von đời thường & Sơ đồ chữ

Hãy nghĩ tới một quầy thu ngân duy nhất trong siêu thị nhỏ. Quầy đó là `event loop`. Khách nào chỉ cần trả tiền thì quầy xử lý liền. Khách nào phải chờ lấy hàng trong kho thì được phát số và đứng sang bên, quầy quay sang khách kế tiếp. Góc chờ đó, có đúng 40 ghế, là `threadpool`.

Khác biệt sinh tử: nếu người thu ngân **tự đi vào kho lấy hàng**, cả hàng người phía sau đứng im. Đó chính là gọi hàm đồng bộ bên trong `async def`.

*Giới hạn của phép ví von:* người thu ngân thật sự rời quầy; `event loop` thì không đi đâu cả, nó chỉ ngừng đọc request mới.

```text
  client
    │  (nhiều request cùng lúc)
    ↓
┌───────────────────────────────────────────────┐
│  uvicorn: 1 worker = 1 luồng = 1 event loop   │
│                                               │
│  middleware → routing → dependency → handler  │
│                                    │          │
│              ┌─────────────────────┴───────┐  │
│              │                             │  │
│         async def                       def │  │
│              │                             │  │
│      await I/O bất đồng bộ          ┌───────▼────────┐
│              │                      │  threadpool    │
│              ↓                      │  40 suất       │
│      trả quyền cho loop             │  (hết suất →   │
│      → nhận request khác            │   xếp hàng)    │
│                                     └────────────────┘
│  CHỖ CHẶN: gọi requests.get / time.sleep trong async def
│            → loop đứng, mọi request khác đứng theo
└───────────────────────────────────────────────┘
```

### 3. Giải thích từ nguyên lý cơ bản (từng bước nhỏ)

- **Bước 1 — Một worker chỉ có một luồng chạy Python.** uvicorn đọc request từ socket rồi đưa vào chuỗi xử lý. Thêm worker là thêm **tiến trình**, mỗi tiến trình có loop riêng. Vì `GIL` chỉ cho một luồng chạy bytecode tại một thời điểm, "chạy song song" ở đây nghĩa là chờ song song, không phải tính song song.
- **Bước 2 — `await` là chỗ duy nhất nhường lượt.** Khi tác vụ `await` một thứ thật sự bất đồng bộ, nó trả quyền cho loop và loop chuyển sang tác vụ khác. `time.sleep(0.2)` không phải điểm nhường: nó giữ luồng đúng 0,2 giây.
- **Bước 3 — Hàm `def` được đẩy sang `threadpool`.** Tài liệu FastAPI nói rõ: hàm `def` "được chạy trong một nhóm luồng ngoài rồi được await, thay vì được gọi trực tiếp". Vì vậy lệnh chặn trong `def` chỉ chiếm **một suất**, không chiếm loop. Trần mặc định là **40 suất**, theo `CapacityLimiter` của AnyIO; Starlette gọi `anyio.to_thread.run_sync` mà không truyền limiter riêng.
- **Bước 4 — Dependency chạy trước, kiểm body chạy sau.** Mỗi dependency cũng phân nhánh theo từ khoá như handler. Quan trọng: `solve_dependencies` của FastAPI chạy **trước** `request_body_to_args`. Nghĩa là một request sai định dạng vẫn đã chạy xong dependency (mở session, ghi log) rồi mới nhận 422. Thân handler thì **không** chạy.

### 4. So sánh "Cách tệ" và "Cách tốt" (kèm thí nghiệm chạy thật)

- **Cách tệ:** `async def` rồi gọi `requests.get` hoặc `time.sleep` bên trong. Điều xảy ra: request đầu giữ loop suốt thời gian chờ; chín request sau đã tới nhưng loop không đọc được. Chúng nối tiếp: `10 × 0,2 = 2,0 giây`. Lý do hỏng: `async def` chỉ **mở quyền** dùng `await`; nó không biến lời gọi đồng bộ thành không chặn.
- **Cách tốt:** hai lựa chọn, chọn theo thư viện. Có bản bất đồng bộ (`httpx.AsyncClient`) thì `async def` + `await`. Chỉ có thư viện đồng bộ (`requests`, `boto3`, `psycopg2`) thì khai báo `def` và để FastAPI đẩy sang threadpool. Lý do: mỗi request chỉ giữ một suất trong 40 suất, loop vẫn đọc được request mới.
- **Kiểm chứng bằng code (chạy thật):** `app.py` có bốn endpoint: `/health`, `/def-sleep` (`def` + `time.sleep(0.2)`), `/async-block` (`async def` + `time.sleep(0.2)`), `/async-await` (`async def` + `await asyncio.sleep(0.2)`). `bench.py` chạy uvicorn ở tiến trình riêng (một worker), bắn N request đồng thời bằng `httpx.AsyncClient` + `asyncio.gather`, đo bằng `time.perf_counter`.

```
python bench.py
```

Kết quả đo trên máy này (Python 3.14.3, fastapi 0.162.0, uvicorn 0.54.0, httpx 0.28.1):

```
  endpoint          request   thời gian tường   mỗi request  biến thể
  /async-await           10           0.31s         0.03s  async def + await asyncio.sleep
  /def-sleep             10           0.33s         0.03s  def + time.sleep
  /async-block           10           2.08s         0.21s  async def + time.sleep
  /def-sleep             60           1.16s         0.02s  def + time.sleep
  /async-block           60          12.40s         0.21s  async def + time.sleep
```

Đọc bảng theo **bậc**, đừng đọc theo phần lẻ:

- 10 request vào `/async-await` xong trong 0,31 giây, không phải 2 giây. Mười lần chờ chồng lên nhau.
- Cùng một thân hàm, khác từ khoá: `/async-block` mất 2,08 giây, `/def-sleep` mất 0,33 giây.
- `/async-block` với 60 request mất 12,40 giây và **không có trần mềm**; nó chỉ dài ra.
- Dòng `/def-sleep` 60 request **không tái lập được**: ba lần chạy cho 1,16 / 1,26 / 1,18 giây, có lần trước đó 0,64 giây. Đừng suy số suất từ thời gian. Muốn biết trần, in `anyio.to_thread.current_default_thread_limiter().total_tokens` **bên trong** một event loop; gọi ngoài loop thì AnyIO ném `NoEventLoopError`. Trên máy này nó in ra `40`.

### 5. Trade-off (Đánh đổi) và Khi nào KHÔNG nên dùng

- **Được gì:** `async def` + thư viện bất đồng bộ cho mật độ chờ cao trên ít tiến trình, RAM thấp vì không cần một luồng cho mỗi request đang chờ.
- **Đánh đổi gì:** một lời gọi đồng bộ lọt vào chuỗi là p99 của **cả worker** đứng, và lỗi này không hiện trong log. Phía `def` thì an toàn nhưng trần thông lượng là `số suất ÷ thời gian chờ`. Cả hai đều không cứu được việc tính toán nặng, vì `GIL`.
- **Khi nào KHÔNG nên dùng:** đừng đổi sang `async def` chỉ vì "nghe hiện đại" khi trong hàm còn `requests`, `boto3` hay `psycopg2`. Đừng dùng `def` cho endpoint gọi ba dịch vụ độc lập nếu cả ba đều có bản bất đồng bộ. Đừng đặt lệnh chặn trong middleware: middleware chạy cho **mọi** route, kể cả `/health`.

---

## Phần 3. Câu hỏi phỏng vấn thường gặp (kèm trả lời mẫu 30–60 giây)

### Câu 1: `requests.get(timeout=5)` đã có timeout rồi, sao vẫn làm sập cả worker?

- **Trả lời mẫu (30–60 giây):** Timeout chỉ đặt trần cho **một lần chặn**, nó không biến lời gọi đồng bộ thành điểm nhường lượt. Trong suốt 5 giây đó luồng vẫn bị giữ, và nếu handler là `async def` thì luồng bị giữ chính là loop. Với 5 giây mỗi lần, một worker chỉ phục vụ khoảng 0,2 request mỗi giây trên đường đó; sáu request cùng vào là request thứ sáu chờ khoảng 30 giây. Dấu hiệu: p99 tăng theo bội số của timeout, và `/health` chậm cùng lúc. Hạ timeout xuống 1 giây làm p99 giảm nhưng lỗi vẫn còn.
- **Lỗi hay mắc khi trả lời:** nói "timeout sẽ nhường cho request khác". Sai: `timeout` chỉ đổi "chặn mãi" thành "chặn tối đa N giây". Cách nói đúng là nêu rõ nó giới hạn **thời gian**, không tạo **điểm nhường lượt**.

### Câu 2: Chuyển toàn bộ route sang `def` cho an toàn thì có gì sai?

- **Trả lời mẫu (30–60 giây):** `def` an toàn với thư viện đồng bộ, nhưng nó đổi chỗ nghẽn chứ không xoá nghẽn. Mỗi request đang chờ giữ một suất trong `threadpool`, trần mặc định 40 suất. Khi mọi suất bị giữ bởi request đang chờ dịch vụ chậm, request mới xếp hàng **dù loop rảnh**. Nghĩa là trần thông lượng bằng `số suất ÷ thời gian chờ`, và nó hiện ra dưới dạng độ trễ tăng theo bậc. Với endpoint gọi nhiều dịch vụ độc lập, `def` còn cộng dồn thời gian chờ thay vì chồng chúng lên nhau.
- **Lỗi hay mắc khi trả lời:** nói "`def` chạy song song nên không bao giờ nghẽn". Sai: có trần 40 suất. Cách nói đúng: nêu trần, nêu công thức thông lượng, và nêu dấu hiệu "độ trễ tăng theo bậc, số request đang xử lý dừng đúng ở trần".

### Câu 3: Nếu handler gọi ba dịch vụ độc lập, `async def` thay đổi con số thế nào?

- **Trả lời mẫu (30–60 giây):** Bản `def` cộng thời gian: ba lời gọi 300 ms là 900 ms giữ một suất threadpool, nên trần khoảng 44 request mỗi giây với 40 suất. Bản `async def` với `httpx.AsyncClient` chồng ba lời gọi lên nhau, còn khoảng 300 ms mỗi request, và trong lúc chờ mạng loop phục vụ request khác. Điều kiện để đổi được: cả ba lời gọi đều có bản bất đồng bộ, và không có bước đọc file hay mã hoá đồng bộ nào chen giữa. Nếu một dịch vụ chỉ có client đồng bộ, đặt lời gọi đó trong một hàm `def` riêng.
- **Lỗi hay mắc khi trả lời:** nói "async nhanh hơn 3 lần" mà không nêu điều kiện. Con số 300 ms và 40 suất là giả định của ví dụ. Cách nói đúng: nêu cơ chế chồng lấn, rồi nêu điều kiện và rủi ro khi một lời gọi còn đồng bộ.

### Câu 4: Bật chế độ debug của `asyncio` có bắt được mọi lệnh chặn không?

- **Trả lời mẫu (30–60 giây):** Không bắt được mọi trường hợp. Chế độ debug log cảnh báo "slow callback" khi một callback giữ loop quá lâu, nên nó chỉ thấy những lần chặn **đủ dài** so với ngưỡng. Một lệnh chặn 20 ms lặp lại nghìn lần có thể không sinh cảnh báo nào nhưng vẫn làm p99 xấu. Vì vậy tôi dùng nó như tín hiệu đầu tiên, rồi `py-spy dump --pid <pid>` để thấy luồng đang đứng trong socket hay trong `time.sleep`. Cuối cùng vẫn phải đọc code tìm lời gọi đồng bộ.
- **Lỗi hay mắc khi trả lời:** nói "bật debug là thấy hết". Sai: nó phụ thuộc ngưỡng và chỉ bắt được cái đang chạy lúc lấy mẫu. Cách nói đúng: nêu giới hạn ngưỡng, rồi nêu công cụ bổ sung.

---
## Ghi chú nguồn

- https://fastapi.tiangolo.com/async/ — hàm khai báo `def` "được chạy trong một nhóm luồng ngoài rồi được await, thay vì được gọi trực tiếp (vì nó sẽ chặn server)"; điều tương tự áp cho dependency khai báo `def`.
- https://fastapi.tiangolo.com/tutorial/dependencies/ — thứ tự giải dependency so với kiểm body.
- Đã kiểm trong bài này: trần threadpool là 40, đọc bằng `anyio.to_thread.current_default_thread_limiter().total_tokens` trong venv của bài (anyio 4.15.1, starlette 1.10.0, fastapi 0.162.0); `run_in_threadpool` trong `starlette/concurrency.py` gọi `anyio.to_thread.run_sync` không truyền limiter riêng.
- Chưa kiểm: chi tiết bên trong `asyncio.gather`; hành vi response model với dữ liệu lớn; mọi con số trong sự cố ở phần mở bài là giả định của kịch bản.
