# Bộ bài học AWS, Python, Vue để phỏng vấn

Hai mươi lăm bài, viết lại từ 25 bài trong app. Mỗi bài là một bài giảng độc lập, không phải bản tóm tắt: đọc từ đầu tới cuối là hiểu cơ chế, làm được phép tính, và trả lời được câu hỏi phỏng vấn cùng chủ đề.

## Đọc thế nào

Mỗi bài có đúng bảy bước, và thứ tự có việc:

| Bước | Việc bạn làm |
|---|---|
| 1. Đoán trước | Trả lời câu hỏi bằng con số trước khi đọc tiếp. Viết ra giấy. |
| 2. Điều bạn đã biết | Nối bài mới vào thứ bạn đã từng làm, để không phải học lại từ đầu. |
| 3. Một ví dụ có số | Cùng một phép tính, làm bằng tay. Đáp án của bước 1 nằm ở cuối bước này. |
| 4. Cơ chế, từng bước một | Chuỗi nhân quả, mỗi bước một ý. Đây là phần phỏng vấn hỏi. |
| 5. Thí nghiệm nhỏ | Chạy script trong thư mục bài, đổi tham số, xem con số đổi. |
| 6. Bốn câu luyện tập | Trả lời trước khi mở đáp án. Đáp án có ba phần: kết luận, điều kiện để đúng, cách kiểm. |
| 7. Câu neo | Một câu để nhớ. Nếu quên hết, nhớ câu này. |

Đừng bỏ bước 1. Đoán sai rồi đọc phần sửa sai là cách nhớ lâu nhất; đọc trước rồi thấy "à đúng rồi" thì không nhớ gì.

## Thứ tự đọc

Đọc theo số bài. Mỗi bài giả định bạn đã đọc bài trước đó.

### Chặng 1 — AWS nền tảng

| Bài | Trả lời được câu hỏi |
|---|---|
| [L01](01-aws/L01-request-qua-dich-vu.md) | Một request đi qua những dịch vụ nào; vì sao tăng Lambda làm nghẽn RDS; tính số kết nối thật |
| [L02](01-aws/L02-ai-duoc-goi-lambda.md) | Vì sao 403; identity policy khác resource policy thế nào; viết execution role tối thiểu |
| [L03](01-aws/L03-init-handler-retry.md) | Cold start là gì; ai thử lại trong từng kiểu gọi; vì sao phải idempotent |
| [L04](01-aws/L04-cors.md) | Vì sao curl trả 200 mà trình duyệt vẫn chặn; preflight kiểm cái gì |
| [L05](01-aws/L05-s3-presigned-dynamodb.md) | Presigned URL hoạt động thế nào; Query khác Scan ở đâu |
| [L06](01-aws/L06-sqs.md) | Vì sao thêm consumer không nhanh hơn; visibility timeout; dead-letter queue |

### Chặng 2 — Python gắn vào AWS

| Bài | Trả lời được câu hỏi |
|---|---|
| [L07](02-python/L07-fastapi-def-async.md) | Khi nào dùng `async def`; chuyện gì xảy ra khi gọi thư viện đồng bộ trong `async def` |
| [L08](02-python/L08-connection-pool.md) | Lambda cộng RDS hết kết nối; trần của một pool khác trần của hệ thống ở đâu |
| [L09](02-python/L09-retry.md) | Lỗi nào đáng retry; backoff và jitter; khi nào retry làm hại |
| [L10](02-python/L10-log-correlation.md) | Nối log một request qua nhiều dịch vụ; ba loại id khác nhau ở đâu |
| [L11](02-python/L11-test-fake.md) | Test service gọi AWS mà không gọi AWS; patch đúng chỗ |

### Chặng 3 — VueJS

| Bài | Trả lời được câu hỏi |
|---|---|
| [L12](03-vue/L12-reactivity.md) | `ref` khác `reactive` ở đâu; vì sao mất reactivity khi lấy thuộc tính ra biến rời |
| [L13](03-vue/L13-computed-watch.md) | `computed` khác `watch` ở đâu; chặn response cũ ghi đè kết quả mới |
| [L14](03-vue/L14-component.md) | Props và emit; `v-model` thật ra là gì; vì sao không dùng chỉ số làm `key` |
| [L15](03-vue/L15-state.md) | State đặt ở đâu; khi nào cần store toàn cục; vì sao store kiểu singleton rò state giữa các lần test |
| [L16](03-vue/L16-router.md) | Vì sao đổi tham số URL mà component không tạo lại; guard chạy theo thứ tự nào |
| [L17](03-vue/L17-form-submit.md) | Chặn double submit; idempotency key; bốn trạng thái của form |

### Chặng 4 — Nối hai mảng

| Bài | Trả lời được câu hỏi |
|---|---|
| [L18](04-noi-hai-mang/L18-hop-dong-api.md) | Hợp đồng API giữa Vue và FastAPI; mã nào cho tình huống nào; vì sao đổi tên trường làm vỡ client cũ |
| [L19](04-noi-hai-mang/L19-auth-hai-phia.md) | Token để ở đâu; bốn mươi request cùng 401 thì refresh mấy lần; vì sao token hợp lệ chưa phải request được phép |
| [L20](04-noi-hai-mang/L20-upload-s3.md) | Ký quyền ghi cho trình duyệt; vì sao phải `head_object` sau khi tải xong |
| [L21](04-noi-hai-mang/L21-outbox.md) | Ghi cơ sở dữ liệu và gửi message lệch nhau ở đâu; outbox vá được nhánh nào |
| [L22](04-noi-hai-mang/L22-deploy.md) | Vì sao `index.html` cũ trỏ vào tệp JS đã xoá; rollback đúng phải là gì |

### Chặng 5 — Phòng thủ

| Bài | Trả lời được câu hỏi |
|---|---|
| [L23](05-phong-thu/L23-ddos.md) | Tấn công từ chối dịch vụ ép cạn tài nguyên nào; chặn ở tầng nào là sớm nhất; cái giá của chặn sớm |

### Chặng 6 — Đào sâu dữ liệu và framework

| Bài | Trả lời được câu hỏi |
|---|---|
| [L24](06-dao-sau/L24-postgres.md) | Đọc `EXPLAIN (ANALYZE, BUFFERS)`; vì sao thêm index mà p99 không giảm; transaction thấy phiên bản dòng nào |
| [L25](06-dao-sau/L25-framework.md) | Chọn FastAPI, Django hay Flask theo ba trục; cái giá của từng lựa chọn |

## Ba nhãn trong bài

- **Giả sử** — con số của kịch bản, không phải số đo và không phải mặc định của dịch vụ nào. Đổi được, và nên đổi khi tự thử.
- **[INFERENCE]** — suy luận từ cơ chế đã biết, chưa có trang tài liệu xác nhận. Khi phỏng vấn, nói đây là suy luận.
- **[CHƯA KIỂM]** — phần chưa kiểm được trong phiên viết bài. Đừng trích như sự thật.

## Chạy ví dụ

Mỗi bài có thư mục con chứa script, ví dụ `lessons/01-aws/l01/little_law.py`. Chạy trong đúng thư mục đó.

Python: máy này không có `python` trong PATH, gọi bằng đường dẫn đầy đủ:

```
"C:/Users/ADMIN/AppData/Roaming/uv/python/cpython-3.14-windows-x86_64-none/python.exe" little_law.py --rps 200 --wall 0.6 --max-conn 40
```

JavaScript: máy này không có `bun`, dùng `node` và `npm`:

```
cd lessons/03-vue/l12
npm install @vue/reactivity
node reactivity-demo.mjs
```

Tương đương với bun: `bun add <pkg> && bun <file>`. Bài nào cần `fastapi`, `uvicorn`, `httpx` thì cài trong venv của thư mục bài, không cài vào Python hệ thống.

## Quan hệ với app

`src/` vẫn là 25 bài cũ mà app đang hiển thị. Thư mục `lessons/` là bản viết lại, nằm ngoài đường build, nên app không đổi. Muốn đưa vào app thì phải chuyển từng bài sang đúng schema trong `CONTRACT.md` và chạy lại `build.mjs`.
