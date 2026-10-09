# CONSOLIDATED CONTENT AUDIT — `hitechcloud-interview-prep.html`

Vòng audit này chạy 8 nhánh kiểm tra độc lập trên `src/` (nguồn chân lý), cộng với kiểm chứng render/consistency do Lead tự chạy. Báo cáo này là bản hợp nhất: mọi defect đã được **kiểm lại tại chỗ**, các claim sai của chính auditor bị **bác bỏ và ghi rõ**, và mỗi defect được gắn **file sở hữu thật** để sửa.

Điểm quan trọng nhất trước khi sửa: **lớp `src/21-q-depth.js` ghi đè field của 60 câu P0.** Sửa `predict`/`tradeoff`/`alternatives`/`observe`/`say30`/`say90` ở file nhóm sẽ bị nuốt im lặng. Xem §4.

---

## 1. Tóm tắt điều hành

| Mức | Số lượng | Bản chất |
|---|---|---|
| **P0** | 3 | Trả lời sai hoặc nội dung hiển thị hỏng — người học lặp lại sẽ mất điểm phỏng vấn |
| **P1** | 12 | Sai lệch kiến thức, mâu thuẫn nội bộ, hoặc số liệu không khớp thực tế |
| **P2** | 22 | Chữ nghĩa, số liệu, thứ tự, trùng lặp |
| **Bác bỏ** | 8 | Claim của auditor không đứng được — **không sửa theo** |

Ba defect P0 phải sửa trước khi build lại. Hai trong ba là **mâu thuẫn nội bộ trong cùng một câu hỏi**, tức bank tự phản bác chính nó.

---

## 2. P0 — phải sửa trước khi build

### P0-1 — `QZ07`: đáp án đúng đang là phát biểu sai
- **Ở đâu:** `src/20-quiz.js` (item `QZ07`, `answer: 0`)
- **Sai gì:** option 0 viết *"ref bọc giá trị trong object .value nên destructuring không mất reactivity"* và được đánh dấu là đáp án đúng. Destructure một `ref` **luôn mất reactivity** (phải dùng `toRefs`). Đây đúng là anti-pattern mà chính item này dạy phải tránh. `explain` lặp lại cùng lỗi.
- **Vì sao quan trọng:** người học thuộc đáp án này sẽ nói sai trước một interviewer Vue.
- **Sửa:** hoán vị text của option 0 và option 3 (giữ `answer: 0`, giữ quy ước "đáp án đúng ở index 0" mà renderer dựa vào), rồi viết lại `explain`.
  - option 0 mới: *"Cả hai đều theo dõi qua Proxy và đều mất reactivity khi destructure; khác biệt nằm ở cú pháp khai báo và cách template mở gói."*
  - option 3 mới (làm distractor): *"ref bọc giá trị trong object .value nên destructuring không mất reactivity, còn reactive dùng Proxy nên phải giữ nguyên đường dẫn."*
  - `explain` mới: *"Destructure chỉ sao chép giá trị tại thời điểm đó, không giữ liên kết — với `ref` phải dùng `toRefs`, với `reactive` phải giữ nguyên đường dẫn truy cập. `ref` có `.value` và template tự unwrap; `reactive` chỉ nhận object và theo dõi theo đường dẫn."*
- **Bằng chứng:** `src/90-app.js:534` — `domOf.indexOf(Number(q.answer))`: `answer` là index vào mảng `options` gốc, không phải thứ tự hiển thị. Hai auditor độc lập cùng xác nhận.
- **Độ tin cậy:** certain

### P0-2 — `B05`: field `expected` mâu thuẫn với `predict.a` của chính nó
- **Ở đâu:** `src/11-q-b.js` (câu `B05`, field `expected`)
- **Sai gì:** `expected` khẳng định *"lỗi này cũng cho `{}` khi `JSON.stringify` vì message không xuất hiện khi duyệt key"*. Chạy thật trên Node v24.21.0: `JSON.stringify(e)` → `{"name":"HttpError","status":404}`. `this.name` và `this.status` là own enumerable nên **có** serialize; chỉ `message` là non-enumerable.
- **Mâu thuẫn nội bộ:** `predict.a` của **cùng câu B05** viết đúng: `` `{"name":"HttpError","status":404}` ``. Hai field trong một câu dạy hai kết quả khác nhau.
- **Sửa:** trong `expected`, thay đoạn sai bằng: *"Vì vậy `Object.keys(e)` chỉ trả về `[ 'name', 'status' ]`; `JSON.stringify(e)` cho `{"name":"HttpError","status":404}` — `message` mất vì non-enumerable, còn `name`/`status` do constructor tự gán nên vẫn còn. Muốn serialize được cả message thì phải tự thêm `toJSON()`."*
- **Bằng chứng:** chạy Node thật, hai auditor độc lập cùng ra một kết quả.
- **Độ tin cậy:** certain

### P0-3 — 82 thẻ HTML thô hiển thị nguyên văn cho người đọc, ở 18 câu
- **Ở đâu:** 18 câu, các field render qua `esc()` (không phải qua `sanitize()`):
  - `askFirst[]` — **18 entry thuộc 13 câu**: A09, A10 (×2), A11, A15 (×3), B07, B09, B10 (×2), B13, C12 (`askFirst[1]`), F02 (×2), F06, F12, H07
  - `followups[].a` — 3 entry: A03 (`[2]`), F05 (`[1]`), F07 (`[0]`)
  - `say90` — 1 câu: C07 (double-escaped)
  - `expected` — 1 câu: F04
- **Sai gì:** các field này đi qua `LOGIC.esc` (`src/05-logic.js:40`) nên `<code>` thành `&lt;code&gt;` và người đọc **nhìn thấy nguyên chữ `<code>`** trong câu hỏi. Tổng **82 thẻ** xuất hiện trong view questions. Riêng C07 nặng hơn: nguồn ghi `<code>&lt;KeepAlive&gt;</code>`, mà `esc` escape `&` **trước** (dòng 43) nên render ra `<code>&lt;KeepAlive&gt;</code>` — sai hai tầng.
- **Vì sao quan trọng:** đây là field người học đọc để tự kiểm tra và để luyện trả lời 90 giây; thẻ thô nằm giữa câu làm hỏng cả trải nghiệm đọc và độ tin của tài liệu.
- **Sửa:** bỏ thẻ, giữ nguyên chữ. `<code>except:</code>` → `except:`; `<code>Promise.all</code>` → `Promise.all`. Với C07 `say90` (`src/21-q-depth.js:277`): `&lt;KeepAlive&gt;` → `<KeepAlive>` **dạng chữ thuần** (viết `KeepAlive` hoặc `component KeepAlive`).
- **Bằng chứng:** hai phương pháp độc lập cùng hội tụ về 82 — (a) đếm thẻ trong HTML render ra từ app: 84 thẻ, trừ 2 thẻ của `C10.code` (false positive, xem §8), còn **82**; (b) quét regex trên dữ liệu: 19 câu có HTML trong field plain-text, trừ C10 còn **18 câu**. Hai con số khớp nhau sau khi loại C10.
- **Độ tin cậy:** certain
- **Lưu ý phạm vi:** `deep`, `predict`, `attacks`, `tradeoff`, `alternatives`, `observe`, `incident` render qua `sanitize()` nên **được phép** có HTML. 134/134 câu có HTML trong `deep` và đều hiển thị đúng. Không đụng tới các field đó.

---

## 3. P1 — sai kiến thức / mâu thuẫn nội bộ

| ID | Ở đâu | Sai gì | Sửa |
|---|---|---|---|
| **P1-1** | `src/14-q-e.js:258` (`E11` `attacks[1].a`) | Đảo hai hàm: *"select_related cho quan hệ một-nhiều và prefetch_related cho quan hệ nhiều-nhiều hoặc đảo chiều"*. Thực tế ngược lại: `select_related` cho FK/OneToOne **hướng tới** (JOIN); `prefetch_related` cho FK **đảo chiều** và nhiều-nhiều. Chạy thật: `select_related('orders')` trên reverse FK → `FieldError`. Đây là chỗ **duy nhất** trong bank nhắc `select_related`, và `src/15-q-f.js:268` cho cùng bài toán N+1 lại viết đúng → bank tự mâu thuẫn. | *"…bằng `select_related` cho FK/OneToOne hướng tới (JOIN một truy vấn) và `prefetch_related` cho FK đảo chiều một-nhiều và nhiều-nhiều (truy vấn thứ hai rồi ghép trong Python)."* |
| **P1-2** | `src/13-q-d1.js:75` (`D03` `expected`) | Khẳng định FastAPI *"không kiểm tra Content-Type, nên cùng request text/plain đó vào FastAPI vẫn parse ra JSON bình thường"*. Chạy thật FastAPI 0.142.2 + Pydantic 2.13.5: body `text/plain` → **422** `model_attributes_type`; không có Content-Type → 422. Chỉ endpoint tự nhận `Request` rồi gọi `await request.json()` mới bỏ qua. | Đảo kết luận: FastAPI **có** kiểm tra Content-Type — chỉ gọi `request.json()` khi main type `application` và subtype `json`/`+json`; ngược lại đưa bytes thô vào validation → 422. |
| **P1-3** | `src/16-q-g.js` (`G02`) | `expected` là đáp án cho một policy JSON có `input-bucket`/`output-bucket` **không tồn tại ở đâu trong câu này lẫn toàn dataset**; `q` hỏi về IAM user/role/policy + execution role, và `predict` của nó đã có đáp án riêng. Câu cũng **thiếu hẳn key `code`**. | Viết policy đó thành `code` của G02 và giữ phần phân tích, **hoặc** đặt `expected: null` + `code: null` (hợp lệ vì G02 là `concept`; G01/G05/G10/G15/G16/G18 đã dùng `null`). |
| **P1-4** | `src/16-q-g.js` (`G11`) + `src/20-quiz.js` (`QZ22`) | Hai file dạy **ngược nhau** về định danh SQS. G11: *"MessageId của SQS hay requestId của Lambda — chúng đổi theo mỗi lần giao"* → sai: `MessageId` **ổn định** suốt vòng đời message (chính vì vậy mới nhận ra được lần giao lặp); thứ đổi mỗi lần nhận là **receipt handle**. QZ22 `explain`: *"dựa vào message_id hoặc receipt handle phái sinh khóa duy nhất"* → receipt handle đổi mỗi lần nhận nên khoá phái sinh từ nó hỏng ngay khi message bị giao lại, đúng cái failure mode item này dạy phải tránh. | G11: *"…MessageId khác nhau giữa hai lần **gửi** khác nhau nên không nhận ra được hai lần gửi của cùng một thao tác nghiệp vụ, receipt handle đổi mỗi lần **nhận**, và requestId của Lambda đổi mỗi lần chạy."* QZ22: *"…dựa vào message_id (ổn định cho một message) hoặc một event id do phía gửi sinh ra; **không** dùng receipt handle vì nó đổi mỗi lần nhận."* |
| **P1-5** | `src/00-meta.js:184` (`GROUP_INTROS['I']`) | Panel giới thiệu nhóm I viết *"System design và kiến trúc ứng dụng web"* với `why` về ước lượng tải, ranh giới dịch vụ, tính nhất quán, mở rộng — trong khi 8 câu I01–I08 là DSA/OOP/SOLID/DI, và nav ghi *"I — DSA & thiết kế phần mềm"*. `p0` của intro liệt kê *"yêu cầu phi chức năng và ước lượng tải"*, *"monolith hay service, ranh giới dịch vụ"* — không có câu nào trong nhóm I. | Viết lại `title`/`why`/`p0` của nhóm I theo đúng 8 câu hỏi DSA & thiết kế phần mềm. |
| **P1-6** | `src/40-plans.js` | Nhiều pick có `limit` **lớn hơn** số câu khớp thật, nên số câu trong prose không khớp thứ được chọn. Ví dụ: *"3 câu L3 nhóm H"* nhưng cả bank chỉ có **1** câu H/L3. `resolvePick` lặng lẽ trả về ít hơn `limit`. | Hạ `limit` về đúng số có sẵn, hoặc sửa prose cho khớp. |
| **P1-7** | `src/40-plans.js` (`three_days`) | 72 slot chọn nhưng chỉ ra **48 câu duy nhất** — dedup theo `id` nuốt 24 slot. Block 6 chọn G/P0, C/P0, A/P0, D/P0 mỗi thứ 3 câu → **0 câu mới**, toàn bộ là câu đã xuất hiện ở block trước. | Thiết kế lại `pick` của `three_days` theo phần bù (bỏ những gì block trước đã lấy), hoặc ghi rõ trong prose rằng các block dùng chung câu. |
| **P1-8** | `src/30-mock.js:55` | Label *"Full mock 30 câu"* nhưng resolve ra **31** câu duy nhất (không mất slot vì dedup). Số người dùng nhìn thấy sai 1. | Đổi label thành *"Full mock 31 câu"* hoặc hạ `limit` để ra đúng 30. |
| **P1-9** | `src/50-case.js:85` (case `cs-05`) | *"bật heartbeat để gia hạn khi tác vụ kéo dài bất thường"* — **SQS không có heartbeat**. Cơ chế đúng là gọi `ChangeMessageVisibility` để gia hạn lease. | *"…và gọi `ChangeMessageVisibility` để gia hạn thời gian ẩn khi tác vụ kéo dài bất thường."* |
| **P1-10** | `src/14-q-e.js:285` (`E12` `expected`) | *"user is_staff nhận **200**"* — DRF trả **204** cho `destroy` thành công. Chạy thật Django 6.1.2 + DRF 3.18.3 → 204. Cùng câu ghi đúng 403 cho user thường và 403 cho ẩn danh. | Đổi 200 → 204. |
| **P1-11** | `src/13-q-d1.js:175` (`D07` `expected`) | Hai lỗi: (a) nói *"mô phỏng lại hai hook trên SQLite vì DRF không cài được offline"* — sai, DRF 3.18.3 có sẵn trong venv, và `E12.expected` nói đã chạy DRF thật; (b) ghi *"chưa xác thực -> 401"* — với DRF mặc định là **403** (SessionAuthentication đứng trước, `NotAuthenticated` bị hạ xuống 403 khi không có `auth_header`). `E12` chạy thật cũng ra 403 → D07 mâu thuẫn với E12. | Chạy lại bằng DRF thật rồi ghi kết quả; sửa 401 → 403 và nêu rõ điều kiện (401 chỉ đúng khi authenticator đầu tiên có `WWW-Authenticate`). |
| **P1-12** | `src/21-q-depth.js` (A07 `predict`) + `src/10-q-a.js` (A07 `code`) | `predict` dùng snippet **riêng** không có `functools.wraps` và `def parse(s, strict)` tham số vị trí → đáp án `wrapper`, `x` đúng cho snippet đó. Nhưng field `code` của cùng câu lại có `@functools.wraps` và `def parse(raw, *, strict=True)` → `parse.__name__` là `'parse'` và `parse(" x ", False)` ném `TypeError` (strict là keyword-only). Hai ví dụ hành xử khác nhau trong cùng một câu. | Đồng bộ: hoặc bỏ `@functools.wraps` khỏi `code`, hoặc sửa `predict` thành `parse` + `TypeError`. |

---

## 4. Lớp ghi đè `src/21-q-depth.js` — đọc trước khi sửa bất cứ field nào

`src/21-q-depth.js` (334.745 byte, 818 dòng) khai `var DEPTH = {...}` rồi tự merge vào `QUESTIONS` theo `id`:

```js
for (var k in fields) { if (...) q[k] = fields[k]; }   // GHI ĐÈ, không kiểm tra trùng
if (missing.length) throw new Error('21-q-depth.js: unknown question ids: ' + missing.join(', '));
```

- Phủ **60 câu P0**: A01–A07, B01–B06, C01–C09, D01–D06, E01–E06, F01/F03/F04/F08, G01–G10, H01/H02/H03/H06, I01/I02, J01–J06.
- Field do lớp này cấp, **chỉ sáu field này**: `predict`, `tradeoff`, `alternatives`, `observe`, `say30`, `say90`.
- Mọi field khác (`expected`, `attacks`, `followups`, `code`, `oral`, `askFirst`, `incident`, `anchor`, `pitfalls`, `selfcheck`) thuộc file nhóm.

**Hệ quả thực tế:** sửa `say90` của C07 hay `predict` của G07/G10/G12 ở file nhóm sẽ **không có tác dụng** — giá trị trong `21-q-depth.js` ghi đè. Bảng định tuyến cho các defect ở trên:

| Defect | Field | Sửa ở file |
|---|---|---|
| P0-3 (C07 `say90`) | `say90` | `src/21-q-depth.js:277` |
| P2 E06 `say90` trùng câu | `say90` | `src/21-q-depth.js:511` |
| P2 G07 / G10 / G12 `predict.a` | `predict` | `src/21-q-depth.js` |
| P1-12 A07 `predict` | `predict` | `src/21-q-depth.js` |
| P1-12 A07 `code` | `code` | `src/10-q-a.js` |
| P2 C03 `predict` snippet | `predict` | `src/21-q-depth.js` |
| P0-2 B05 `expected` | `expected` | `src/11-q-b.js` |
| P0-3 `askFirst`/`followups`/`expected` | — | file nhóm tương ứng |
| P1-1 E11 `attacks` | `attacks` | `src/14-q-e.js:258` |

**Lưu ý:** `21-q-depth.js` và `00-bootstrap.js` **không có** trong bảng file map của `audit/BRIEF.md`. Xem §6.

---

## 5. P2 — chữ nghĩa, số liệu, thứ tự

**Số liệu / mô tả sai:**
- `A16` (`src/10-q-a.js`): *"threadpool mặc định … với anyio là 40 token"* — sai. asyncio mặc định `min(32, os.cpu_count() + 4)`.
- `A12`: chuỗi lỗi dataclass không khớp thực tế — đúng phải là `mutable default <class 'list'> for field 'items' is not allowed: use default_factory`.
- `QZ02` (`src/20-quiz.js`): typo *"phát thành GIL"* → *"nhả GIL"*.
- `G07` `predict.a`: *"max_connections đang ở mặc định … khoảng một trăm request đầu qua được"* — RDS PostgreSQL tính trần theo bộ nhớ instance: `LEAST(DBInstanceClassMemory/9531392, 5000)`.
- `G12` `predict.a`: *"thiếu quyền security group thường cho kết quả timeout ở tầng TCP nhanh hơn nhiều"* — SG không có rule allow thì drop im lặng, client vẫn treo tới hết timeout. Khác nhau ở **bằng chứng** (flow log ghi REJECT vs không có bản ghi), không ở độ trễ. Thêm nữa `incident` là Lambda gọi **RDS trong cùng VPC** nhưng `q`/`predict`/`anchor`/`expected` đều lấy nguyên nhân là thiếu route NAT ra Internet — triệu chứng không suy ra được từ nguyên nhân được dạy.
- `G13` `expected`: *"in ra ba dòng JSON"* nhưng code chỉ in **hai** dòng trên mọi nhánh.
- `G14` `expected`: khẳng định *"hàm vẫn chạy đúng nhưng mật khẩu lộ trần"*, trong khi `code` gọi `psycopg2.connect(host=…, password=…)` **thiếu `user`/`dbname`** → libpq lấy mặc định theo OS user và kết nối hỏng với `role … does not exist`.
- `G18` `attacks[0].a`: *"chi phí truyền dữ liệu ra internet qua NAT gateway không có metric riêng"* — NAT Gateway **có** `BytesOutToDestination`; DynamoDB **có** `ConsumedReadCapacityUnits`. Đúng phần "không nằm trên dashboard mặc định", sai phần "không có metric". `followups[1].a`: *"mỗi tag đều có chi phí lưu"* — AWS **không** tính phí tag; ràng buộc thật là hạn mức 50 tag/tài nguyên.
- `G06` `expected`: *"đặt key thành `avatars/<id>/../../<id-khac>/profile.jpg` và ghi đè tệp của người khác"* — key S3 là không gian phẳng, `..` **không** được phân giải. Rủi ro thật chỉ là key do client chọn thì trỏ được bất kỳ đâu trong bucket.
- `H02` `attacks[1].a`: liệt kê *"thay đổi quyền **hoặc dấu thời gian** của tệp"* là nguyên nhân vô hiệu cache `COPY` — mâu thuẫn với chính `pitfalls[1]` của câu này và với tài liệu Docker (mtime **không** nằm trong checksum của `ADD`/`COPY`).
- `H07` `expected`: danh sách 5 lỗi **thiếu** lỗi ghim môi trường — workflow không có `actions/setup-python` nên pip/pytest chạy trên interpreter mặc định của runner.
- `H10` `expected`: *"MEM USAGE tính cả page cache"* — `docker stats` hiển thị `memory.current − inactive_file` (cgroup v2), tức **đã trừ** cache không hoạt động.
- `H13` `code` + `oral`: workflow không chạy lại được khi ECR bật immutability (re-run cùng commit → `docker push` fail vì tag đã tồn tại); danh sách quyền IAM quá hẹp — chỉ `ecr:PutImage` không push được, cần thêm `BatchCheckLayerAvailability`, `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`, và `DescribeImages` cho bước cuối.
- `D09` `expected`: *"FastAPI/pydantic trả 422 kèm cấu trúc này"* — thân 422 mặc định là `{"detail": [{"type","loc","msg","input"}]}`, top-level key duy nhất là `detail`. Vỏ `{"error": {…}}` trong `code` phải tự đăng ký handler cho `RequestValidationError`.
- `D10` `expected`: liệt kê *"bốn điểm"* nhưng bỏ lỗi thứ năm trong chính `code` — `const result = { ok: false }` là state mutable module-scope, nên sau một lần charge thành công, lần gọi khác thất bại cả 5 lần vẫn trả `ok === true`.
- `cs-05` (`src/50-case.js:86`): *"xử lý **nhất quán** dưới 40 giây"* → typo, phải là *"xử lý **trung bình** dưới 40 giây"*.
- `cs-05` vs `flow-queue-worker`: case nói *"giới hạn 3 lần nhận lại trước khi chuyển sang DLQ"*, flow nói 5. Một trong hai sai.
- `cs-02`: mô tả checksum/ETag quá đơn giản so với hành vi thật.
- `cs-10` (`src/50-case.js`): *"rollback code an toàn; rollback lược đồ dùng migration đảo chiều"* — nên tách rõ ba tầng: code, lược đồ, dữ liệu.
- `CASE_STUDY.pitch` (`src/50-case.js:7`): *"**Bảy mục** dưới đây…"* rồi liệt kê 12 mục; `CASE_STUDY.sections` thực tế có **17** mục.

**Sơ đồ SVG (`src/60-flows.js`):**
- `flow-cors-preflight`: hàng "Request thật: POST /api/orders" thiếu thành phần phía server, chỉ có `Access-Control-Allow-Origin` — không thể hiện được điểm mấu chốt là preflight đi trước rồi request thật mới chạy.
- `flow-sqs-visibility`: nhãn `DeleteMessage` đặt **sau** mốc 30s, nhưng xoá message phải xảy ra **trong** thời hạn visibility.
- `flow-cicd-pipeline`: không có node migration.

**Thứ tự file và trùng lặp:**
- `src/16-q-g.js`: `G18` nằm **giữa G10 và G11** (index 10) — dấu vết merge. Không vô hại: `resolvePick` lấy câu theo **thứ tự mảng**, nên vị trí này đổi tập câu mà `aws_focus`/`p0_blitz` chọn.
- `src/21-q-depth.js:511` (`E06` `say90`): một đoạn dài lặp **hai lần** trong cùng field (*"…và nó không lộ trên production qua độ trễ vì độ trễ phụ thuộc cả vào tải. Cách đúng là đếm truy vấn và khẳng định con số đó trong test — với Django là assertNumQueries…"*). Lỗi copy-paste.

---

## 6. Phát hiện hệ thống — vì sao các lỗi này lọt qua build

### 6.1 `build.mjs` kiểm tra độ dài nhưng không kiểm tra "plain text" trên field của câu hỏi
`build.mjs` **có** gate nội dung, và nó bắt được nhiều thứ: enum `group/prio/level/type`, độ dài `oral`/`deep`/`followups`/`pitfalls`, `expected` bắt buộc cho `predict`/`debug` (dòng 157), `code` không được chứa entity HTML (dòng 161), `deep` không được có `<script`/`<img`/handler.

Nhưng nó **không** kiểm tra plain text cho các field render qua `esc()`: `askFirst`, `followups[].a`, `say30`, `say90`, `anchor`, `expected`, `oral`, `q`. Đó là lý do 82 thẻ thô đi qua build sạch. Trớ trêu: cùng file **có** luật đó cho lesson — dòng 349 `bridge must be plain text (no < or >)`, dòng 361 `spine must be plain text`. Luật đã tồn tại, chỉ chưa áp cho câu hỏi.

**Đề xuất thêm vào `build.mjs`** (ngay sau vòng lặp question, cạnh dòng 173):

```js
const PLAIN_Q = ['oral', 'expected', 'say30', 'say90', 'anchor', 'q', 'topic', 'code'];
const TAG_RE = /<\/?(code|em|strong|b|i|br|p|ul|ol|li|span|div|pre|small)\b[^>]*>/i;
for (const f of PLAIN_Q) {
  if (q[f] == null) continue;
  if (TAG_RE.test(q[f])) err(`${q.id}: ${f} must be plain text (found HTML tag)`);
  if (/&(lt|gt|amp|quot|#39);/i.test(q[f])) err(`${q.id}: ${f} must be plain text, not HTML-escaped (found entity)`);
}
for (const [i, s] of (q.askFirst || []).entries()) {
  if (TAG_RE.test(s)) err(`${q.id}: askFirst[${i}] must be plain text (found HTML tag)`);
}
for (const [i, o] of (q.followups || []).entries()) {
  if (o && o.a && TAG_RE.test(o.a)) err(`${q.id}: followups[${i}].a must be plain text`);
}
```

### 6.2 Các gate còn thiếu
- **Không có kiểm tra nhất quán chéo field.** Ba defect P0/P1 ở trên là mâu thuẫn *giữa hai field của cùng một câu* (`B05.expected` vs `B05.predict.a`; `A07.predict` vs `A07.code`; `G02.expected` vs `G02.q`). Một luật "nếu có cả `expected` và `predict.a` thì cả hai phải nhắc cùng một kết quả" sẽ bắt được B05. Với G02: `expected` nhắc định danh không xuất hiện trong `q`/`topic`/`code`.
- **Không có kiểm tra ngữ nghĩa đáp án quiz.** Dòng 198 chỉ kiểm tra `answer` nằm trong khoảng. QZ07 lọt qua dù đáp án sai.
- **Không có kiểm tra `limit` của pick so với số câu khớp.** `resolveSet` (dòng 215–220) tính `matched` rồi lặng lẽ `slice(0, lim)` — nếu `lim > matched.length` thì không ai báo. Thêm: `if (typeof s.limit === 'number' && s.limit > matched.length) err(...)`.
- **Không có kiểm tra số trong label so với số resolve ra.** `full_mock` "30 câu" vs 31 lọt qua. Có thể bắt bằng regex `/(\d+)\s*câu/` trên `set.label` rồi so với `ids.length`.
- **Không có kiểm tra `GROUP_INTROS[g]` khớp với nội dung nhóm** (P1-5 lọt qua).
- **Không có kiểm tra thứ tự id trong file** (G18 nằm sai chỗ).

### 6.3 `audit/BRIEF.md` đã cũ
- Bảng file map (§2) **thiếu** `src/21-q-depth.js` và `src/00-bootstrap.js`. Đây là file lớn nhất trong `src/` và là lớp ghi đè P0 — thiếu nó thì mọi hướng dẫn sửa field đều có thể sai chỗ.
- §1 nói **131 câu hỏi**; thực tế **134**. Nói `CASE_STUDY` **14 sections**; thực tế **17**.
- §7 "Known-remaining gaps" nay đã sai gần hết: `attacks` **0/131** → nay có trên toàn bộ 134 câu; `say30`/`say90` **0/131** → nay có trên 60 câu P0; `naive`/`rootCause`/`tradeoff`/`alternatives`/`observe` **0/131** → nay có trên 60 câu P0.
- §3 ghi *"`deep` may only use …"* — cần nói rõ luôn: `predict`, `attacks`, `tradeoff`, `alternatives`, `observe`, `incident` cũng qua `sanitize()`, còn `oral`/`expected`/`say30`/`say90`/`anchor`/`askFirst`/`followups`/`pitfalls`/`selfcheck` là **plain text**.
- §7 nêu câu hỏi mở về quiz — đã trả lời ở §7 dưới đây.

---

## 7. Trả lời câu hỏi mở của BRIEF §7 về quiz

BRIEF hỏi: *sau khi `orderFor()` xáo thứ tự hiển thị, đáp án đúng còn nhận ra được không (ví dụ bằng độ dài)?*

Đã chạy lại đúng thuật toán `seedFrom`/`orderFor` của `src/90-app.js:464-479` trên cả 28 item:

- Cả 28 item đều có `answer: 0` trong dữ liệu.
- Vị trí **hiển thị** của đáp án đúng (1-based): vị trí 1 → **10** item, vị trí 2 → 7, vị trí 3 → 4, vị trí 4 → 7.
- ⇒ **luôn chọn phương án đầu tiên được 10/28 = 36%**, so với mức đoán mò 25%. LCG yếu để lại thiên lệch vị trí 1.
- Đáp án đúng là phương án **dài nhất** trong **7/28** item (25%) — độ dài **không** phải là dấu hiệu đáng tin.

**Kết luận:** đáp án không lộ hoàn toàn, nhưng có sàn 36% khi đoán theo vị trí. Với một quiz tự đánh giá, nên xáo bằng seed tốt hơn (ví dụ trộn theo `id` + một hằng số, hoặc dùng Fisher–Yates với PRNG chất lượng hơn) để phân bố về quanh 25%. Đây là P2.

---

## 8. Claim của auditor đã bị BÁC BỎ — không sửa theo

Đây là phần bắt buộc: một finding không được rubber-stamp. Tám claim dưới đây **sai**, nếu sửa theo sẽ làm hỏng nội dung đúng.

| # | Claim | Thực tế |
|---|---|---|
| 1 | `C08` blocker: *"Vue 3 KHÔNG có hook beforeCreate — beforeCreate/afterCreate đã bị xóa từ Vue 3.0"* | **Sai.** Vue 3 **vẫn** hỗ trợ `beforeCreate`/`created` trong Options API (chỉ Composition API không có `onBeforeCreate`/`onCreated`). `afterCreate` thậm chí không phải tên hook của Vue. Hơn nữa `oral` viết *"chạy từ setup rồi beforeCreate đến mounted"* — đúng thứ tự Vue 3, vì `setup()` chạy **trước** `beforeCreate`. Chỉ còn một ghi chú phong cách: câu trả lời trộn tên hook Options API với `setup`, nên khi trả lời về Composition API thì dùng `onMounted`/`onUnmounted`. |
| 2 | `G10` `predict.a`: *"340 hoá đơn"* là số bịa, CONTRACT cấm bịa chi tiết cụ thể | **Sai.** Con số này được thiết lập trong chính bài học: `src/38-lessons-link.js:214` (`naiveOut`) và `:239` (`say30`) đều nói *"340 hoá đơn bị gửi hai lần"*, và `G10.predict.a` ghi rõ *"Trong bài học của tài liệu, hệ quả là 340 hoá đơn…"*. Nhất quán và có nguồn nội bộ, không phải bịa. |
| 3 | `G02`/`G06`/`G13`: placeholder `<key>`, `<id>`, `<tên hàm>` trong `expected` sẽ bị browser nuốt | **Sai.** `expected` render qua `esc()`, và `LOGIC.esc` (`src/05-logic.js:43-47`) escape `<`/`>` nên hiển thị đúng nguyên chữ. Auditor nhóm H kiểm độc lập `H04` (`<tên_thư_mục>_default`) và `H09` (`-p <pid>`) cũng ra kết luận an toàn. Chỉ nên đổi sang `{key}` cho nhất quán, không phải defect. |
| 4 | `C10`: `code` chứa HTML tag → vi phạm plain text | **Sai.** `<div>admin</div>` nằm **trong chuỗi template JS** của ví dụ vue-router (`component: { template: '<div>admin</div>' }`). Đó là nội dung code hợp lệ. |
| 5 | `QZ07`: đáp án đúng phải là **option 1** | **Sai.** Option 1 nói *"ref chỉ dùng được cho kiểu nguyên thuỷ còn reactive dùng cho object, hai cách tương đương về reactivity"* — `ref` dùng được cho cả object, và hai cách không tương đương. Option 3 là lựa chọn tốt nhất trong bốn (xem P0-1). Sửa theo option 1 sẽ thay một đáp án sai bằng một đáp án sai khác. |
| 6 | `cs-14` CORS: nghi vấn vi phạm | **Sai** (đã kiểm ở vòng trước). |
| 7 | `H13` `expected: null` là defect | **Sai.** CONTRACT chỉ bắt buộc `expected` cho `predict`/`debug`; `H13` là `situation` và `code` của nó là file cấu hình, không có output tất định. |
| 8 | `H05` `HEALTHCHECK` escaping | **Chưa kết luận được** — không có Docker daemon. Không tính là defect. Dù kết quả nào cũng nên đổi sang nháy đơn: `python -c "import socket; socket.create_connection(('127.0.0.1', 8000), timeout=2)"`. |

**Ghi chú về chất lượng audit:** ba auditor khác nhau đã tạo ra false positive theo cùng một kiểu — **đọc một field rồi kết luận về một field khác**, hoặc **áp luật của field này cho field kia**. Đây là lý do mọi claim ở §2–§5 đều đã được kiểm lại tại chỗ trước khi ghi vào báo cáo.

---

## 9. Phạm vi đã kiểm và độ tin cậy

| Nhóm | Verdict | Ghi chú |
|---|---|---|
| A (Python) | dùng được sau khi sửa | 18 code snippet chạy thật, output khớp; A07 mâu thuẫn predict/code |
| B (JS/TS) | dùng được sau khi sửa | 13 snippet chạy trên Node; B05 là blocker duy nhất |
| C (Vue 3) | dùng được | chỉ C03 (snippet) + C08 (ghi chú phong cách); C08 "blocker" đã bác bỏ |
| D (HTTP/API/security) | dùng được sau khi sửa | chạy thật FastAPI 0.142.2 + Pydantic 2.13.5 + Django 6.1.2 + DRF 3.18.3 |
| E (FastAPI/Django) | dùng được sau khi sửa | E11 đảo hai hàm là lỗi nặng nhất |
| F (PostgreSQL) | sạch | không tìm thấy lỗi kiến thức; chỉ có F04/F05/F07 dính P0-3 |
| G (AWS) | dùng được sau khi sửa | 18 câu; G02 + cặp G11/QZ22 |
| H (Docker/Linux/CI) | dùng được | không blocker; 5 lỗi minor |
| I (DSA) | nội dung ổn | intro panel sai (P1-5) |
| J (dự án/giao tiếp) | ổn | không có fact bịa; chỉ lệch giữa nav và intro |
| quiz (28) | 1 đáp án sai | QZ07; phần còn lại đúng |
| case study (17 mục) | dùng được sau khi sửa | cs-05 heartbeat, cs-05 typo, cs-02, cs-10, pitch |
| render/consistency | 3 P0 | do Lead tự chạy |

**Chưa kiểm chứng được (không dùng làm defect):**
- `H05` HEALTHCHECK escaping — cần Docker daemon.
- `H07` PEP 668 `externally-managed-environment` trên `ubuntu-latest` — cần runner.
- `H10` tên hàm `calculateMemUsageUnixNoCache` — ký ức mã nguồn `docker/cli`, không có docker CLI trên máy.
- `H13` hành vi re-push của ECR immutability — cần AWS account.
- `G15` hạn mức invalidation của CloudFront — tài liệu đã tự hedge đúng cách, không phải defect.
- `s3:MaxObjectSize` — `web_search` chết (401) nên không đối chiếu được nguồn ngoài.
- `G04`/`G08` field `code` — chỉ kiểm gián tiếp qua `expected`/`followups`.

---

## 10. Thứ tự thi hành đề xuất

1. **Sửa 3 P0** — QZ07 (đổi đáp án + explain), B05 (`expected`), 82 thẻ thô ở 18 câu. Đây là những thứ người học đọc và lặp lại.
2. **Sửa 2 P1 kiến thức** — E11 (đảo `select_related`/`prefetch_related`), D03 (FastAPI Content-Type). Cả hai làm người học trả lời sai.
3. **Sửa mâu thuẫn nội bộ** — G11 vs QZ22 (SQS), D07 vs E12 (401/403), A07 predict vs code.
4. **Sửa số liệu plan/mock** — `three_days` dedup, `full_mock` 30→31, `limit` vượt pool, `GROUP_INTROS['I']`.
5. **Sửa P2** theo bảng §5.
6. **Thêm gate vào `build.mjs`** (§6.1) rồi chạy `node build.mjs` + `node tests/smoke.cjs` — nếu gate mới báo lỗi thì đó chính là danh sách việc còn lại.
7. **Cập nhật `audit/BRIEF.md`** (§6.3) — thêm `21-q-depth.js`/`00-bootstrap.js` vào file map, sửa 131→134 và 14→17 mục, viết lại §7.

**Cảnh báo khi thi hành:** sau mỗi lần sửa field thuộc sáu field của lớp depth, phải sửa ở `src/21-q-depth.js`, không phải file nhóm — nếu không thay đổi sẽ bị ghi đè và tưởng như "sửa không có tác dụng".
