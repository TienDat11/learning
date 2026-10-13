# Gói dữ liệu thật cho agent Pencil — 4 màn còn thiếu

Sinh bằng script `tools/gen-pen-pack.mjs` đọc trực tiếp `src/*.js`. **Không sửa tay file này.**
Mọi chữ agent vẽ phải chép nguyên văn từ đây. Chữ không có trong đây thì không được vẽ.

File `.pen`: `C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen`
Token: chỉ dùng biến `hcp-*` đã có trong file. Font: `$hcp-font` (Be Vietnam Pro), `$hcp-mono` (JetBrains Mono).

## 0. Số liệu toàn site

| Đại lượng | Số | Nguồn |
|---|---|---|
| Câu hỏi | 147 | `QUESTIONS.length` |
| Câu P0 | 71 | `QUESTIONS.filter(prio==='P0')` |
| Bài học | 23 | `LESSONS.length` |
| Chặng | 5 | `new Set(LESSONS.stage)` |
| Quiz | 28 | `QUIZ.length` |
| Bộ phỏng vấn thử | 6 | `Object.keys(MOCK_SETS)` |
| Mục case study | 17 | `CASE_STUDY.sections.length` |
| Nguồn tham khảo | 122 | `SOURCES.length` |
| Sơ đồ | 13 | `FLOW_SVGS.length` |
| Thẻ flashcard | 147 | `QUESTIONS` sắp theo P0 rồi id |

Số câu mỗi nhóm (chip lọc / bảng nhóm):

| Nhóm | Tên nhóm | P0 | Tổng |
|---|---|---|---|
| A | Python sâu: data model, GIL và asyncio | 7 | 18 |
| B | JavaScript, event loop và TypeScript | 6 | 14 |
| C | VueJS: reactivity, component và state | 12 | 15 |
| D | Web nền tảng: HTTP, cache và bảo mật | 6 | 14 |
| E | Python web: FastAPI và Django/DRF | 6 | 12 |
| F | PostgreSQL: index, transaction và MVCC | 4 | 12 |
| G | AWS: Lambda, S3, SQS, RDS và DynamoDB | 17 | 29 |
| H | Container, CI/CD và vận hành | 5 | 13 |
| I | System design và kiến trúc ứng dụng web | 2 | 8 |
| J | Hành vi và giao tiếp trong công việc thực tế | 6 | 12 |

---

## 1. Case study xuyên suốt (`view-case`)

### Tiêu đề và mở bài (nguyên văn)

**DocuHub: ứng dụng quản lý tài liệu trên AWS**

DocuHub là ứng dụng quản lý tài liệu chạy đầu-cuối trên AWS. Frontend là SPA Vue 3 đóng gói bằng Vite, phục vụ từ S3 qua CloudFront; backend là FastAPI đóng gói bằng Docker, chạy trên ECS Fargate phía sau API Gateway; dữ liệu nằm ở RDS PostgreSQL có read replica; tệp nằm ở S3 và client tải thẳng lên bằng presigned URL nên API không bao giờ nâng byte tệp; xác thực bằng JWT qua authorizer của API Gateway và kiểm tra sở hữu ở tầng ứng dụng; việc nặng như trích xuất văn bản, tạo thumbnail và sinh bản tóm tắt đẩy vào SQS để worker xử lý ngoài luồng, dùng transactional outbox để không mất message. Mọi endpoint ghi chống trùng bằng Idempotency-Key, lỗi tạm retry theo exponential backoff rồi rơi vào DLQ. Pipeline GitHub Actions chạy test, build image đa tầng, đẩy ECR và triển khai ECS bằng task definition mới; CloudWatch thu thập log, metric, alarm và dashboard theo service. Bảy mục dưới đây đi từ kiến trúc tổng thể tới từng tình huống sự cố cụ thể: upload hỏng, request trùng, visibility timeout, worker chết giữa chừng, lệch dữ liệu với hàng đợi, truy cập chéo, truy vấn chậm, deploy sai, retry, chọn Lambda hay container, mức cô lập transaction, và CORS. Mỗi mục nêu failure mode, cơ chế, cách sửa và cái giá phải trả.

### 17 mục, đúng thứ tự này

| # | `h` (tiêu đề hiển thị) | `flow` | Có sơ đồ |
|---|---|---|---|
| 1 | Kiến trúc tổng thể | `flow-request-lifecycle` | có |
| 2 | Happy path: upload tài liệu | `flow-upload-presign` | có |
| 3 | Upload lỗi: quá lớn, sai loại, URL hết hạn | `flow-upload-presign` | có |
| 4 | Gửi request trùng: idempotency | `flow-idempotency` | có |
| 5 | Queue: visibility timeout | `flow-sqs-visibility` | có |
| 6 | Worker crash giữa chừng | `flow-queue-worker` | có |
| 7 | Lệch database và queue: transaction + outbox | `flow-db-transaction` | có |
| 8 | Truy cập tệp của người khác | `flow-auth-jwt` | có |
| 9 | Backend chậm: N+1, index, connection pool | `flow-request-lifecycle` | có |
| 10 | Deploy lỗi: CI/CD, rollback code và rollback DB | `flow-cicd-pipeline` | có |
| 11 | Retry và backoff, DLQ | `flow-failure-retry` | có |
| 12 | Lambda cold start hay container ECS | `flow-lambda-cold-start` | có |
| 13 | Transaction và mức cô lập trong PostgreSQL | `flow-db-transaction` | có |
| 14 | CORS và preflight giữa hai origin | `flow-cors-preflight` | có |
| 15 | Vì sao big tech bỏ VM để chạy container | — | không |
| 16 | Chuyển sang DynamoDB: được gì, mất gì | — | không |
| 17 | Cloud giải được gì, và khi nào người ta rời đi | — | không |

Cột trái màn này là danh sách 17 mục trên. Mục đang chọn là **mục 1 — Kiến trúc tổng thể**.

### Toàn văn mục 1 — Kiến trúc tổng thể (vẽ nguyên văn)

**Bối cảnh.** DocuHub là ứng dụng quản lý tài liệu: người dùng đăng nhập, tạo thư mục, tải lên PDF và DOCX, gán quyền theo vai trò, xem lịch sử phiên bản. Frontend là SPA Vue 3 do chính đội dự án viết, đóng gói bằng Vite; backend là FastAPI chạy trong container trên ECS Fargate; dữ liệu nằm ở RDS PostgreSQL; tệp nằm ở S3; việc trích xuất nội dung và tạo thumbnail chạy ngoài luồng qua SQS và worker.

**Failure mode điển hình.** Khi mọi thứ gắn với một request đồng bộ, hệ thống sập theo dây chuyền: một tệp 300 MB chặn luồng xử lý, một truy vấn N+1 giữ connection của PostgreSQL, và cả trang danh sách tài liệu của toàn bộ công ty ngừng hiển thị. Đồng thời, nếu frontend và API khác origin mà cấu hình CORS sai, mọi request đều chết ngay ở tầng trình duyệt trước khi tới server, và log phía server trống trơn. Đây là loại sự cố gây mất thời gian dò tìm nhất.

**Cơ chế vòng đời request.**

- Trình duyệt mở kết nối tới CloudFront, lớp CDN phục vụ bản build của SPA và các tệp tĩnh có content-hash trong tên.
- CloudFront chuyển tiếp đường dẫn `/api` tới API Gateway, nơi khai báo authorizer JWT và quota theo phương thức.
- API Gateway gọi service Python chạy trên ECS Fargate qua service discovery của Cloud Map.
- FastAPI xác thực token trong middleware, mượn một connection từ connection pool, chạy SQL, trả JSON rồi trả connection về pool.
- Phản hồi đi ngược lại cùng đường và được CloudFront cache lại nếu đúng cache-control.

**Cách sửa.** Tách bạch ba loại tải. Tệp nằm ở S3 và client đi thẳng lên S3 bằng presigned URL nên đường chính không mang byte. Việc nặng như render thumbnail, trích xuất văn bản, sinh bản tóm tắt đẩy vào SQS để worker gánh, với giới hạn số tác vụ đồng thời. Dữ liệu tra cứu nằm ở PostgreSQL có read replica cho các báo cáo chỉ đọc. Mọi request đo bằng middleware ghi thời gian theo route để tìm nút cổ chai khi p95 tăng.

**Tradeoff.** Kiến trúc phân tán thêm một chặng độ trễ và tăng số thành phần phải vận hành: CloudFront, API Gateway, ECS, RDS, S3, SQS, worker, tất cả đều có cấu hình riêng và đều có thể hỏng. Đổi lại hệ thống chịu lỗi tốt hơn, deploy được từng phần, và việc nặng không kéo sập đường chính. Nếu lưu lượng nhỏ và việc nặng không nhiều, chạy chung worker trong cùng một task ECS có thể rẻ hơn và ít vận hành hơn so với tách service riêng.

**Vì sao PostgreSQL mà không phải DynamoDB.** Ứng dụng này cần quan hệ nhiều-nhiều giữa tài liệu, người dùng và quyền truy cập, cần JOIN qua nhiều bảng và cần transaction gói cả bản ghi tài liệu cùng dòng outbox trong một lần ghi, nên RDS PostgreSQL là lựa chọn hợp lý. DynamoDB sẽ hợp hơn nếu mọi kiểu truy cập đã biết trước theo khoá và chỉ cần tra cứu một bảng: đặt partition key theo `owner_id` và sort key theo `created_at`, dùng Query đúng theo access pattern đó và dùng conditional write cho idempotency. Đổi lại DynamoDB không có JOIN, không có transaction nhiều bảng như PostgreSQL vì TransactWriteItems bị giới hạn số item và không trải rộng tuỳ ý, và mỗi access pattern mới đều phải thiết kế lại khoá hoặc thêm GSI, nên nó chỉ thắng khi đã biết chắc các câu truy vấn. Vì vậy nếu phần báo cáo và đếm sau này phình ra mà chỉ đọc, ta tách sang read replica trước; chỉ chuyển sang DynamoDB khi access pattern đã ổn định và cần scale ngang hơn là linh hoạt truy vấn.

Sơ đồ nhúng trong mục 1 (khung 16:9, chép nguyên nhãn):

Chú thích: Vòng đời của một HTTP request đi qua CloudFront, API Gateway, service FastAPI trên ECS Fargate và RDS, kèm đường response trả ngược về client trên cùng một keep-alive connection.

Nhãn trong sơ đồ, đúng thứ tự: Một HTTP request đi qua hệ thống · Browser · gọi API · CloudFront · TLS + cache · API Gateway · JWT authorizer · ECS Fargate · FastAPI · RDS · Postgres · response 200 + JSON, cùng connection keep-alive · DNS + TLS handshake chỉ xảy ra lần đầu; request sau dùng lại connection đã mở

### Toàn văn mục 2 — Happy path: upload tài liệu (chỉ để tham chiếu, không cần vẽ)

**Failure mode.** Nếu backend nhận toàn bộ tệp qua HTTP POST rồi chuyển tiếp sang S3, mỗi tệp 200 MB chiếm một connection của API và một phần băng thông khỏa nghẽn. Mười người upload đồng thời sẽ làm hàng đợi request dài dòng, một tệp hỏng giữa đường tiêu tốn hết băng thông mà không tạo ra gì, và API phải giữ file tạm trên ổ đĩa container vốn không giữ dữ liệu vĩnh viễn.

**Cơ chế presigned URL.**

- Client gọi `POST /api/documents/presign` kèm tên tệp, kích thước và MIME type.
- API kiểm tra MIME nằm trong allowlist, kiểm tra kích thước dưới trần, kiểm tra quota theo gói của người dùng, rồi sinh object key có tiền tố theo tenant để tránh đụng tên chéo.
- API trả về URL đã ký cho phép đúng phương thức `PUT`, có thời hạn 15 phút, kèm các header bắt buộc phải khớp.
- Browser đưa tệp thẳng lên S3 bằng thư viện HTTP của trình duyệt, có thanh tiến trình và hỗ trợ multipart upload nếu tệp rất lớn.
- Client gọi `POST /api/documents` với object key, kích thước và checksum; API ghi bản ghi vào PostgreSQL rồi đẩy job hậu xử lý vào hàng đợi.

**Vì sao phải tách bước cuối.** Bước ghi bản ghi mới là nơi ta kiểm tra sở hữu và cấp quyền đọc. Nếu chỉ tin vào lời client báo đã upload xong, kẻ xấu có thể khai một object key không tồn tại, hoặc của người khác, và tạo bản ghi chỗ trống trong hệ thống. Ta còn xác minh checksum do S3 trả về khớp với checksum client khai báo, để chặn tệp bị hỏng giữa đường.

**Tradeoff.** Ta mất khả năng theo dõi tiến trình tải phía server và phải tự dọn các object rác bằng job quét theo lịch. Đổi lại API không bao giờ chạm vào byte của tệp, nên chi phí băng thông và CPU của backend gần như bằng không, và nó co giãn được khi số người dùng tăng gấp mười lần chỉ bằng cách tăng hạn mức của S3.

---

## 2. Nguồn tham khảo (`view-sources`)

Mở bài nguyên văn: “Chỉ dẫn tài liệu chính thức. Ngày kiểm tra ghi kèm từng mục. Bài blog và diễn đàn không được dùng làm nguồn chính ở đây.”

Dòng ngày kiểm tra toàn bộ: “Ngày kiểm tra toàn bộ liên kết: 2026-10-01.”

Nhóm theo `SOURCES[].group`, tiêu đề nhóm lấy từ `GROUP_INTROS[g].title`. 122 mục trong 8 nhóm:

### Nhóm A — Python sâu: data model, GIL và asyncio (9 mục)

- [Python Data Model](https://docs.python.org/3/reference/datamodel.html) — `A · kiểm tra 2026-10-01`
- [Python Expressions](https://docs.python.org/3/reference/expressions.html) — `A · kiểm tra 2026-10-01`
- [Python Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) — `A · kiểm tra 2026-10-01`
- [asyncio — High-Level Coroutines and Tasks](https://docs.python.org/3/library/asyncio.html) — `A · kiểm tra 2026-10-01`
- [asyncio Task](https://docs.python.org/3/library/asyncio-task.html) — `A · kiểm tra 2026-10-01`
- [Python FAQ — Global Interpreter Lock](https://docs.python.org/3/faq/library.html#what-kinds-of-global-value-mutation-are-thread-safe) — `A · kiểm tra 2026-10-01`
- [Python typing](https://docs.python.org/3/library/typing.html) — `A · kiểm tra 2026-10-01`
- [venv — Virtual Environments](https://docs.python.org/3/library/venv.html) — `A · kiểm tra 2026-10-01`
- [unittest — Unit testing framework](https://docs.python.org/3/library/unittest.html) — `A · kiểm tra 2026-10-01`

### Nhóm B — JavaScript, event loop và TypeScript (10 mục)

- [MDN — JavaScript execution model (event loop)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) — `B · kiểm tra 2026-10-01`
- [MDN — Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) — `B · kiểm tra 2026-10-01`
- [MDN — Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) — `B · kiểm tra 2026-10-01`
- [MDN — this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) — `B · kiểm tra 2026-10-01`
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — `B · kiểm tra 2026-10-01`
- [MDN — Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) — `B · kiểm tra 2026-10-01`
- [MDN — Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) — `B · kiểm tra 2026-10-01`
- [MDN — HTTP headers reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers) — `B · kiểm tra 2026-10-01`
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — `B · kiểm tra 2026-10-01`
- [TypeScript — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — `B · kiểm tra 2026-10-01`

### Nhóm C — VueJS: reactivity, component và state (9 mục)

- [Vue — Reactivity API](https://vuejs.org/api/reactivity-core.html) — `C · kiểm tra 2026-10-01`
- [Vue — Computed API](https://vuejs.org/api/reactivity-core.html#computed) — `C · kiểm tra 2026-10-01`
- [Vue — Watchers](https://vuejs.org/guide/essentials/watchers.html) — `C · kiểm tra 2026-10-01`
- [Vue — Component Basics](https://vuejs.org/guide/essentials/component-basics.html) — `C · kiểm tra 2026-10-01`
- [Vue — Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle.html) — `C · kiểm tra 2026-10-01`
- [Vue — Composable Functions](https://vuejs.org/guide/reusability/composables.html) — `C · kiểm tra 2026-10-01`
- [Vue Router](https://vuejs.org/guide/scaling-up/routing.html) — `C · kiểm tra 2026-10-01`
- [Pinia — Core concepts (Defining a Store)](https://pinia.vuejs.org/core-concepts/) — `C · kiểm tra 2026-10-12`
- [Vue — Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html) — `C · kiểm tra 2026-10-01`

### Nhóm D — Web nền tảng: HTTP, cache và bảo mật (5 mục)

- [MDN — HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) — `D · kiểm tra 2026-10-01`
- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) — `D · kiểm tra 2026-10-01`
- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) — `D · kiểm tra 2026-10-01`
- [OWASP API Security Top 10](https://owasp.org/API-Security/) — `D · kiểm tra 2026-10-01`
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — `D · kiểm tra 2026-10-01`

### Nhóm E — Python web: FastAPI và Django/DRF (8 mục)

- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/) — `E · kiểm tra 2026-10-01`
- [FastAPI — Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) — `E · kiểm tra 2026-10-01`
- [FastAPI — Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) — `E · kiểm tra 2026-10-01`
- [FastAPI — Testing](https://fastapi.tiangolo.com/tutorial/testing/) — `E · kiểm tra 2026-10-01`
- [Django — QuerySet API](https://docs.djangoproject.com/en/stable/topics/db/queries/) — `E · kiểm tra 2026-10-01`
- [Django REST framework — Serializers](https://www.django-rest-framework.org/api-guide/serializers/) — `E · kiểm tra 2026-10-01`
- [Django REST framework — Permissions](https://www.django-rest-framework.org/api-guide/permissions/) — `E · kiểm tra 2026-10-01`
- [Django — Testing](https://docs.djangoproject.com/en/stable/topics/testing/) — `E · kiểm tra 2026-10-01`

### Nhóm F — PostgreSQL: index, transaction và MVCC (7 mục)

- [PostgreSQL — Indexes](https://www.postgresql.org/docs/current/indexes.html) — `F · kiểm tra 2026-10-01`
- [PostgreSQL — Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) — `F · kiểm tra 2026-10-01`
- [PostgreSQL — Concurrency Control (MVCC)](https://www.postgresql.org/docs/current/mvcc.html) — `F · kiểm tra 2026-10-01`
- [PostgreSQL — Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — `F · kiểm tra 2026-10-01`
- [PostgreSQL — Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — `F · kiểm tra 2026-10-01`
- [PostgreSQL — INSERT ... ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html) — `F · kiểm tra 2026-10-01`
- [PostgreSQL — LIMIT](https://www.postgresql.org/docs/current/queries-limit.html) — `F · kiểm tra 2026-10-01`

### Nhóm G — AWS: Lambda, S3, SQS, RDS và DynamoDB (68 mục)

- [Amazon Cognito — Understanding the ID token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html) — `G · kiểm tra 2026-10-12`
- [Amazon Cognito — Understanding the access token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html) — `G · kiểm tra 2026-10-12`
- [API Gateway — HTTP API JWT authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html) — `G · kiểm tra 2026-10-12`
- [AWS Lambda — Identity and access management](https://docs.aws.amazon.com/lambda/latest/dg/permissions.html) — `G · kiểm tra 2026-10-01`
- [AWS Lambda — Best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html) — `G · kiểm tra 2026-10-01`
- [AWS Lambda — Recursive loop detection](https://docs.aws.amazon.com/lambda/latest/dg/invocation-recursion.html) — `G · kiểm tra 2026-10-12`
- [AWS IAM — Policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html) — `G · kiểm tra 2026-10-01`
- [Amazon API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html) — `G · kiểm tra 2026-10-01`
- [Amazon S3 User Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) — `G · kiểm tra 2026-10-01`
- [Amazon S3 — Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) — `G · kiểm tra 2026-10-01`
- [Amazon RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html) — `G · kiểm tra 2026-10-01`
- [Amazon DynamoDB — Query](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html) — `G · kiểm tra 2026-10-01`
- [Amazon DynamoDB — Data modeling](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/data-modeling.html) — `G · kiểm tra 2026-10-01`
- [Amazon SQS — Visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/visibility-timeout.html) — `G · kiểm tra 2026-10-01`
- [Amazon SQS — Dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) — `G · kiểm tra 2026-10-01`
- [Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html) — `G · kiểm tra 2026-10-01`
- [Amazon CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html) — `G · kiểm tra 2026-10-01`
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/introduction.html) — `G · kiểm tra 2026-10-01`
- [Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html) — `G · kiểm tra 2026-10-01`
- [Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) — `G · kiểm tra 2026-10-01`
- [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html) — `G · kiểm tra 2026-10-01`
- [AWS Cost and Usage Report](https://docs.aws.amazon.com/cur/latest/userguide/introduction.html) — `G · kiểm tra 2026-10-01`
- [AWS Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html) — `G · kiểm tra 2026-10-12`
- [Amazon EC2 — Concepts](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html) — `G · kiểm tra 2026-10-12`
- [Amazon EC2 Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html) — `G · kiểm tra 2026-10-12`
- [Elastic Load Balancing — Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html) — `G · kiểm tra 2026-10-12`
- [Amazon Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html) — `G · kiểm tra 2026-10-12`
- [AWS Certificate Manager](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html) — `G · kiểm tra 2026-10-12`
- [AWS Certificate Manager — Supported Regions](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html#acm-regions) — `G · kiểm tra 2026-10-12`
- [Amazon Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html) — `G · kiểm tra 2026-10-12`
- [Amazon ElastiCache](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html) — `G · kiểm tra 2026-10-12`
- [Amazon ElastiCache — Caching strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html) — `G · kiểm tra 2026-10-12`
- [Amazon ElastiCache — Encryption in transit](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/in-transit-encryption.html) — `G · kiểm tra 2026-10-12`
- [Amazon ElastiCache — Public endpoints](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/connecting-public-endpoint.html) — `G · kiểm tra 2026-10-12`
- [Amazon ElastiCache — Accessing from a VPC](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/elasticache-vpc-accessing.html) — `G · kiểm tra 2026-10-12`
- [Amazon DynamoDB — DAX](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Protecting data with encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — CORS troubleshooting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors-troubleshooting.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Event message structure](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Event types and destinations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 API — PutBucketNotificationConfiguration](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketNotificationConfiguration.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Storage classes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Lifecycle configuration rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Glacier storage classes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Aborting incomplete multipart uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Delete markers](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeleteMarker.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Storage Lens metrics glossary](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage_lens_metrics_glossary.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Object lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) — `G · kiểm tra 2026-10-12`
- [Amazon S3 — Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html) — `G · kiểm tra 2026-10-12`
- [Amazon CloudFront — Restrict access to an S3 origin (OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html) — `G · kiểm tra 2026-10-12`
- [Amazon SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) — `G · kiểm tra 2026-10-12`
- [Amazon EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html) — `G · kiểm tra 2026-10-12`
- [AWS Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html) — `G · kiểm tra 2026-10-12`
- [AWS Key Management Service](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html) — `G · kiểm tra 2026-10-12`
- [CISA — UDP-Based Amplification Attacks (TA14-017A)](https://www.cisa.gov/ncas/alerts/ta14-017a) — `G · kiểm tra 2026-10-01`
- [RFC 2644 — Changing the Default for Directed Broadcasts in Routers](https://www.rfc-editor.org/rfc/rfc2644.html) — `G · kiểm tra 2026-10-01`
- [Cloudflare — The DDoS That Almost Broke the Internet (Spamhaus 2013)](https://blog.cloudflare.com/the-ddos-that-almost-broke-the-internet/) — `G · kiểm tra 2026-10-01`
- [Cloudflare — Technical Details Behind a 400 Gbps NTP Amplification DDoS Attack](https://blog.cloudflare.com/technical-details-behind-a-400gbps-ntp-amplification-ddos-attack/) — `G · kiểm tra 2026-10-01`
- [GitHub — DDoS Incident Report (memcached, 1.35 Tbps)](https://github.blog/news-insights/company-news/ddos-incident-report/) — `G · kiểm tra 2026-10-01`
- [AWS Shield — Threat Landscape Report Q1 2020 (2.3 Tbps CLDAP)](https://aws-shield-tlr.s3.amazonaws.com/2020-Q1_AWS_Shield_TLR.pdf) — `G · kiểm tra 2026-10-01`
- [Microsoft Azure — DDoS Protection attack trends 2021 Q3/Q4 (3.47 Tbps)](https://azure.microsoft.com/en-us/blog/azure-ddos-protection-2021-q3-and-q4-ddos-attack-trends/) — `G · kiểm tra 2026-10-01`
- [Google Cloud — Blocked largest Layer 7 DDoS attack at 46M rps](https://cloud.google.com/blog/products/identity-security/how-google-cloud-blocked-largest-layer-7-ddos-attack-at-46-million-rps) — `G · kiểm tra 2026-10-01`
- [Cloudflare — HTTP/2 Rapid Reset (CVE-2023-44487) technical breakdown](https://blog.cloudflare.com/technical-breakdown-http2-rapid-reset-ddos-attack/) — `G · kiểm tra 2026-10-01`
- [Cloudflare — Auto-mitigated a world-record 3.8 Tbps DDoS attack](https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/) — `G · kiểm tra 2026-10-01`
- [Cloudflare — DDoS Threat Report 2024 Q4 (5.6 Tbps UDP)](https://blog.cloudflare.com/ddos-threat-report-for-2024-q4/) — `G · kiểm tra 2026-10-01`

### Nhóm H — Container, CI/CD và vận hành (6 mục)

- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) — `H · kiểm tra 2026-10-01`
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/) — `H · kiểm tra 2026-10-01`
- [Docker Compose Specification](https://docs.docker.com/reference/compose-file/) — `H · kiểm tra 2026-10-01`
- [Docker — Security best practices](https://docs.docker.com/build/building/best-practices/) — `H · kiểm tra 2026-10-01`
- [GitHub Actions Documentation](https://docs.github.com/en/actions) — `H · kiểm tra 2026-10-01`
- [signal(7) — POSIX signals](https://man7.org/linux/man-pages/man7/signal.7.html) — `H · kiểm tra 2026-10-01`

---

## 3. Flashcard (`view-flashcard`)

Mở bài nguyên văn: “Đọc câu hỏi, trả lời miệng, rồi mới bật đáp án. Tự chấm: *biết* hoặc *yếu* — trạng thái lưu vào tiến độ.”

Dòng phím tắt nguyên văn: “Space hiện đáp án · ← → đổi câu · 1 biết · 2 yếu · / tìm kiếm” (mỗi phím là một `<kbd>`).

Năm nhãn nút, nguyên văn: “Hiện đáp án” · “← Câu trước” · “Câu sau →” · “Đã nắm” · “Cần ôn lại”.

Thẻ đầu tiên của bộ (147 thẻ, sắp P0 trước rồi theo id): `A01`.

Hàng meta trên thẻ, đúng thứ tự 6 chip: `A01` · `P0` · `A` · `L1` · So sánh danh tính và so sánh giá trị, is và == · trạng thái.

Mặt trước (câu hỏi), nguyên văn:

> is và == khác nhau thế nào trong Python, khi nào hai object khác nhau vẫn có cùng id, và vì sao không nên dùng is để so sánh chuỗi?

Mặt sau (đáp án) gồm các khối có nhãn, đúng thứ tự này, và chỉ hiện khi câu có dữ liệu:

1. `Trả lời miệng 30–60 giây` — đoạn văn.
2. `Giải thích sâu` — HTML.
3. `Kết quả đúng và nguyên nhân` — đoạn văn (khối có class `expected`).

Hàng meta trên thẻ còn có chip trạng thái, một trong bốn nhãn: `Chưa học` · `Đang ôn` · `Đã nắm` · `Yếu`.
Ô đếm tiến độ ghi `Câu <i>/<N>`. Nút đổi nhãn theo trạng thái: khi đáp án đang mở thì nút là `Ẩn đáp án`, khi đang đóng là `Hiện đáp án`.

Đoạn đầu mặt sau của thẻ A01, nguyên văn:

Dấu bằng kép so sánh giá trị, còn is so sánh danh tính, tức hai tên biến có trỏ tới cùng một object trong bộ nhớ hay không. Hàm id trả về địa chỉ của object nên is tương đương so id. Hai object tách biệt vẫn có thể bằng nhau, ví dụ hai list rỗng khác nhau thì bằng nhau theo giá trị. Ngược lại, object có thể cùng id do bộ đệm hóa, như small integer cache từ -5 tới 256 hay interning chuỗi. Khi định nghĩa eq, dấu bằng kép gọi eq còn is không gọi gì cả. Quy tắc thực hành: dùng == cho so sánh giá trị, chỉ dùng is với None, True, False.

---

## 4. Bắt đầu: cách dùng tài liệu này (`view-intro`)

Tiêu đề trang: “Bắt đầu: cách dùng tài liệu này”. Không có mở bài.

### 5 đề mục, đúng thứ tự

**Đề mục 1 — `Cách dùng`** (danh sách 5 gạch đầu dòng):

- **Một lượt ôn = một vòng.** Lọc theo nhóm, trả lời miệng trước khi mở đáp án, xong mới đọc phần giải thích sâu.
- Mỗi câu có bốn phần: trả lời miệng 30–60 giây, giải thích sâu, ví dụ code khi có (kèm kết quả đúng và nguyên nhân) và chuỗi hỏi đào sâu.
- Đánh dấu *Đã nắm* hoặc *Cần ôn lại* ngay dưới mỗi câu. Tiến độ lưu trong trình duyệt; bật “Chỉ hiện câu đánh dấu yếu” để ôn đúng chỗ đứng.
- Flashcard luyện nhịp trả lời nhanh, Quiz kiểm tra hiểu bằng trắc nghiệm, Mock interview luyện to nhỏ có đồng hồ đếm ngược.
- Case study là một hệ thống duy nhất, đi hết happy path rồi đi hết từng failure mode.

**Đề mục 2 — `Lịch ôn`** (một đoạn văn):

Mục “Lịch ôn” có ba kịch bản: Gói 6 giờ — dồn lực vào P0 của AWS, Vue và Python · Gói 2 ngày — ngày 1 nền tảng, ngày 2 AWS, ops và một bộ mock · Gói 3 ngày — hết nền tảng, đào sâu AWS và Vue, rồi full mock. Ít thời gian thì chạy kịch bản 6 giờ; có 2–3 ngày thì chạy kịch bản 2 ngày, phần còn lại dùng kịch bản 3 ngày để luyện sâu.

**Đề mục 3 — `Nói thẳng về điểm yếu`** (một khối `note`):

Nền tảng của bạn mạnh ở Django/DRF, FastAPI, React/TypeScript, PostgreSQL, Docker và CI/CD. Hai chỗ cần dựng lại: **AWS** — đường đi của một request qua API Gateway → Lambda/IAM → RDS hoặc DynamoDB → CloudWatch, và khi nào tách việc nặng sang SQS; **Vue 3** — reactivity, computed so với watch, composable, SFC, và cách trả lời khi được hỏi Vue so với React. Đừng né tránh chỗ này: trả lời thẳng “phần này tôi mới ôn sâu gần đây”, rồi nói rõ bạn đã học bằng cách nào và sẽ làm gì với nó trong dự án thật.

**Đề mục 4 — `Tài liệu này là gì và không là gì`** (một khối `note` chứa danh sách 3 gạch đầu dòng):

- Đây là bộ câu hỏi luyện tập do tôi tự soạn để ôn cho vị trí Fullstack Engineer, không phải bộ câu hỏi phỏng vấn thật của HiTechCloud. Tôi không có và không khẳng định có đề phỏng vấn hay quy trình tuyển dụng nội bộ của công ty.
- Ba lớp nội dung, đừng gộp chúng làm một. (a) Yêu cầu trong JD: Python tối thiểu 2 năm, thành thạo VueJS, TypeScript là điểm cộng, AWS Lambda/API Gateway/S3/RDS hoặc DynamoDB, Docker, phát hành tự động, theo dõi logs/metrics/chi phí và xử lý lỗi production. (b) Kiến thức nền tảng: Python, JavaScript/TypeScript, HTTP, SQL, Vue, FastAPI/Django — đúng với mọi công ty, không riêng gì đây. (c) Câu hỏi luyện tập trong tài liệu này: tôi viết để tự kiểm tra, có thể khác hẳn đề thật.
- Vì vậy: học để hiểu cơ chế, không học để đoán đề. Câu nào thuộc lớp (a) thì bám sát đúng chữ trong JD; câu nào thuộc lớp (b) thì trả lời bằng cơ chế và tradeoff; và nếu phỏng vấn hỏi thứ không có trong này thì cứ nói thẳng là mình chưa gặp, rồi phân tích từ nền tảng.

**Đề mục 5 — `Mười nhóm kiến thức`** (bảng 10 dòng, 4 cột `Nhóm` · `Vì sao phải biết` · `P0` · `Số câu`):

| Nhóm | Vì sao phải biết | P0 | Số câu |
|---|---|---|---|
| Python sâu: data model, GIL và asyncio | Đây là nền tảng nhất khi JD yêu cầu 2 năm Python. Phỏng vấn viên hỏi data model, closure, GIL và event loop để biết bạn viết Python ở mức hiểu cơ chế hay chỉ biết cú pháp. Biết rõ khi nào asyncio thắng thread, khi nào hỏng thì trả lời được cả phần lý thuyết lẫn phần code thực tế. | 7 | 18 |
| JavaScript, event loop và TypeScript | Lưu ý: nhóm này dùng tài liệu MDN và TypeScript Handbook vì đó là nguồn chính thức đáng tin cậy nhất cho ngôn ngữ, và JD nói TypeScript là một điểm cộng. Bạn cần chắc microtask và macrotask, scope closure, this binding và cách TypeScript thu hẹp kiểu, vì đây là phần hay bị hỏi khi ứng dụng chạy trong trình duyệt. | 6 | 14 |
| VueJS: reactivity, component và state | VueJS là một trong hai lỗ hổng lớn của bạn, vì vậy nhóm này được đẩy lên P0 nặng. JD nói rõ phải dùng VueJS thật sự, nên bạn cần hiểu cơ chế reactivity dựa trên Proxy, phân biệt ref và reactive, lifecycle hook, composable và cách tổ chức state bằng Pinia cùng router. | 12 | 15 |
| Web nền tảng: HTTP, cache và bảo mật | Backend và frontend đều đứng trên HTTP. Biết status code, header, Cache-Control, CORS, cookie và SameSite quyết định bạn có debug được lỗi thật hay chỉ đoán mò. Phần OWASP nối thẳng vào yêu cầu review code và xử lý sự cố trong JD, nên đây là chỗ dễ ghi điểm nếu bạn nói được ví dụ cụ thể. | 6 | 14 |
| Python web: FastAPI và Django/DRF | Đây là phần mạnh nhất của bạn nên phải nói chắc, không do dự. JD nhắc API Python chạy trong container hoặc serverless, nên hãy chuẩn bị dependency injection, background task, test, cùng queryset và serializer bên Django. Biết rõ phân biệt blocking I/O với async là chìa khóa khi deploy lên Lambda. | 6 | 12 |
| PostgreSQL: index, transaction và MVCC | RDS PostgreSQL là dịch vụ được JD nêu đích danh. Hầu hết lỗi hiệu năng và lỗi dữ liệu trong dự án thật đều nằm ở đây: thiếu index, hiểu sai transaction isolation, hoặc chạy lệnh UPDATE không kiểm soát. Biết đọc EXPLAIN là kỹ năng chứng minh kinh nghiệm thực chiến. | 4 | 12 |
| AWS: Lambda, S3, SQS, RDS và DynamoDB | AWS là lỗ hổng lớn thứ hai và là trọng tâm của JD. Nhóm này gần như toàn P0 vì đề thi gần như chắc chắn hỏi Lambda, S3, DynamoDB, SQS và cách phân quyền IAM. Mục tiêu là trả lời được cả phần thiết kế, phần vận hành lẫn phần chi phí, vì JD yêu cầu theo dõi cost và log của hệ thống mình sở hữu. | 17 | 29 |
| Container, CI/CD và vận hành | JD yêu cầu Docker và phát hành tự động, nên đây là phần nối liền giữa code và AWS. Hãy nắm multi-stage build, layer cache, image nhỏ, secret trong CI, và cách ứng dụng xử lý tín hiệu dừng. Đây cũng là nơi bạn dễ phô ra kinh nghiệm thật với Docker Compose cho môi trường local. | 5 | 13 |
| System design và kiến trúc ứng dụng web | Nhóm này luyện khả năng dựng hệ thống từ yêu cầu nghiệp vụ: chọn loại cơ sở dữ liệu, đặt hàng ranh giới dịch vụ, xử lý nhất quán và chịu tải. Đây là phần quyết định điểm số ở vòng cuối, và là nơi bạn gắn kiến thức AWS vào một bài toán thật thay vì trả lời rời rạc. | 2 | 8 |
| Hành vi và giao tiếp trong công việc thực tế | Nhóm này dùng tình huống gần với đời thật trong JD: đọc code cũ, review pull request, xử lý sự cố giữa đêm và trao đổi với bộ phận khác. Câu trả lời phải cho thấy cách bạn đưa ra quyết định dưới áp lực thời gian, vì đó là tiêu chí nhà tuyển dụng nhìn thấy nhiều nhất khi họ không biết bạn. | 6 | 12 |

---

## 5. Sơ đồ dùng trong case study và bài học

13 sơ đồ. Mỗi sơ đồ là SVG vector, tự đổi màu theo theme. Trong màn case study chỉ nhúng sơ đồ của mục đang chọn.

| `id` | Chú thích |
|---|---|
| `flow-request-lifecycle` | Vòng đời của một HTTP request đi qua CloudFront, API Gateway, service FastAPI trên ECS Fargate và RDS, kèm đường response trả ngược về client trên cùng một keep-alive connection. |
| `flow-cors-preflight` | Cơ chế CORS: trình duyệt gửi preflight OPTIONS cho request không đơn giản, nhận header Access-Control-Allow-Origin rồi mới gửi request thật và kiểm tra kết quả. |
| `flow-vue-reactivity` | Phản ứng của Vue 3: đọc thuộc tính qua Proxy sẽ track phụ thuộc, ghi giá trị sẽ trigger effect, effect chạy lại và vá DOM tối thiểu. |
| `flow-upload-presign` | Luồng upload tệp an toàn bằng presigned URL: API chỉ cấp quyền có thời hạn, client PUT thẳng lên S3, sau đó API mới ghi bản ghi vào cơ sở dữ liệu. |
| `flow-queue-worker` | Mô hình hàng đợi với worker: producer đẩy message vào SQS, worker poll và xử lý, xoá message sau khi thành công, hết hạn retry thì rơi vào DLQ. |
| `flow-sqs-visibility` | Visibility timeout của SQS: message bị ẩn khỏi các consumer khác ngay khi được đọc, hiện lại khi hết thời gian nếu chưa bị xoá. |
| `flow-auth-jwt` | Xác thực bằng JWT: API Gateway hoặc middleware kiểm tra chữ ký, hạn dùng và scope, rồi mới cấp quyền; token hỏng hoặc hết hạn trả về 401. |
| `flow-db-transaction` | Ranh giới transaction trong PostgreSQL: BEGIN rồi ghi nhiều bảng, cuối cùng COMMIT khi mọi câu lệnh thành công, nếu lỗi thì ROLLBACK trả cơ sở dữ liệu về trạng thái ban đầu. |
| `flow-idempotency` | Idempotency với khóa phía server: cùng một Idempotency-Key gửi lại sẽ trả về đúng response đã lưu thay vì thực thi tác vụ lần nữa. |
| `flow-lambda-cold-start` | Ba giai đoạn của một lần gọi Lambda khi phải khởi động lạnh: Init (khởi tạo runtime, import, biến global) chạy một lần cho mỗi môi trường thực thi, phần Handler chạy mỗi lần gọi. Môi trường ấm tái sử dụng thì bỏ qua Init. |
| `flow-cicd-pipeline` | Pipeline CI/CD điển hình: commit kích hoạt workflow, chạy test và lint, build image Docker, đẩy lên ECR, rồi triển khai lên ECS bằng task definition mới. |
| `flow-ddos-defense` | Phòng thủ DDoS phân tầng: lưu lượng volumetric bị hấp thụ ở mạng biên mà không phải trả thêm phí thuê bao, tầng WAF và giới hạn tốc độ chặn phần còn lại, còn người dùng thật đi qua khe hở xuống tầng tính toán và cơ sở dữ liệu đã có trần. |
| `flow-failure-retry` | Chiến lược retry với exponential backoff và jitter: lỗi tạm thì chờ tăng dần rồi thử lại, hết số lần cho phép thì đưa sang DLQ và phát cảnh báo. |

Nhãn từng sơ đồ (dùng khi vẽ lại):

- `flow-request-lifecycle`: Một HTTP request đi qua hệ thống · Browser · gọi API · CloudFront · TLS + cache · API Gateway · JWT authorizer · ECS Fargate · FastAPI · RDS · Postgres · response 200 + JSON, cùng connection keep-alive · DNS + TLS handshake chỉ xảy ra lần đầu; request sau dùng lại connection đã mở
- `flow-cors-preflight`: Preflight: OPTIONS /api/orders · Browser · API Gateway · + CORS · Handler · FastAPI · Trả header CORS · Access-Control-Allow-Origin: tên miền của frontend · Request thật: POST /api/orders · Browser · Kiểm tra origin · Ghi DB · 201 Created · Render UI · Vue cập nhật
- `flow-vue-reactivity`: Vue 3 reactivity: đọc thì track, ghi thì trigger · reactive() · state.count · Proxy get/set · ref > shallowRef · track (đọc) · effect ghi dep · trigger (ghi) · đánh dấu dirty · Effect chạy lại · patch DOM · Batching: nhiều ghi trong cùng tick chỉ render một lần ở microtask queue
- `flow-upload-presign`: Upload file: không đẩy bytes qua API · Vue client · chọn tệp · API ký URL · TTL 15 phút · S3 PUT · bytes thẳng · Ghi record · RDS · client PUT trực tiếp, không đi qua Lambda · Trả về object key, không trả credential cho client · API Gateway nên giới hạn body size khi dùng luồng này
- `flow-queue-worker`: Hàng đợi SQS và worker xử lý nền · Producer · FastAPI + outbox · SQS · standard queue · Worker poll · ReceiveMessage · Xử lý · ghi DB · DeleteMessage · ack · message trở lại hàng đợi sau visibility timeout · DLQ · maxReceive 3 · Poll dài (WaitTimeSeconds ~20s) giảm số lần trả rỗng và chi phí, không giảm cold start
- `flow-sqs-visibility`: Visibility timeout = thời gian message bị ẩn · ẩn khỏi hàng đợi · t = 0 đến t = 30s · Receive · consumer A · bắt đầu xử lý · hết 30s · DeleteMessage · nếu chưa xoá: message hiện lại, consumer khác có thể nhận · ack trong thời hạn
- `flow-auth-jwt`: Xác thực stateless bằng JWT · Login · POST /auth · Ký token · RS256, exp · Bearer token · Authorization · Verify · sig, exp, scope · 200 + dữ liệu · 401 · token sai hoặc hết hạn · Không lưu session ở server; đổi luật thì phải thêm blacklist token
- `flow-db-transaction`: ACID: transaction trong một transaction_id · BEGIN · UPDATE orders · UPDATE stock · INSERT audit · COMMIT · ROLLBACK · Không thấy dữ liệu chưa commit từ session khác · Nhưng reader khác có thể thấy snapshot cũ · Deadlock: hai transaction giữ khoá chéo thì PostgreSQL giết một bên
- `flow-idempotency`: Chống thanh toán trùng khi client retry · Client · UUID v4 · Tra khóa · UNIQUE key · Đã có key · trả response đã lưu · Chưa có key · thực thi rồi INSERT · 201 Created · Không có key thì retry vẫn tạo bản ghi trùng: idempotency chỉ có hiệu lực khi client giữ nguyên key
- `flow-lambda-cold-start`: Cold start: tải ảnh chứa + Init + Handler · Tải ảnh chứa · 1 lần / môi trường · Init · import, global scope, tạo client — 1 lần / môi trường · Handler · việc thật của request · t = 0 · hết request · Giảm Init: giảm import và công việc ở global scope, đặt thư viện nặng vào Layer, dùng Provisioned Concurrency cho đường quan trọng
- `flow-cicd-pipeline`: CI/CD: từ commit tới container chạy thật · Push code · trigger workflow · Lint + test · pytest, vitest · Build image · multi-stage · Push ECR · tag theo commit SHA · Deploy ECS · task definition mới · Health check · ALB + rollback · Tag theo git SHA để biết image nào đang chạy: xem ECS task definition hoặc image tag trong log khởi động
- `flow-ddos-defense`: Chặn ở đâu, tốn cái gì · BOTNET · vô số nguồn thật · gói rác chết tại đây · BIÊN · WAF · luật theo tổng · GIỚI HẠN · 429 / 503 · phán quyết thô ra biên · NGƯỜI THẬT · đi qua khe hở · Lambda · trần concurrency · Cơ sở dữ liệu · trần connection pool · trần để chậm, không sập
- `flow-failure-retry`: Retry: backoff luỹ thừa + jitter · Gọi dịch vụ · Lỗi 5xx · timeout · Chờ backoff · 1s, 2s, 4s · Còn số lần? · attempts &lt; 5 · thử lại · DLQ + cảnh báo · cần người xử lý · Chỉ retry lỗi tạm thời: lỗi 4xx do dữ liệu sai thì retry vô nghĩa

---

## 6. Nhãn được phép và bị cấm

Nhãn dùng được ở 4 màn mới (nguyên văn, đã đối chiếu `assets/body.html` + `src/90-app.js`):

- Case study: `Case study xuyên suốt` · mở bài “Ứng dụng quản lý tài liệu: Vue 3 · Python API · PostgreSQL · S3 · SQS worker · Docker/CI-CD. Đi hết happy path rồi đi hết từng failure mode.” · tiêu đề + mở bài ở trên · 17 nhãn mục.
- Nguồn: `Nguồn tham khảo` · mở bài ở trên · 8 tiêu đề nhóm · mỗi mục là tên nguồn kèm `<nhóm> · kiểm tra <ngày>`.
- Flashcard: `Flashcard` · mở bài · dòng phím tắt · 5 nhãn nút ở trên.
- Bắt đầu: `Bắt đầu: cách dùng tài liệu này` · 5 đề mục ở trên.
- Thanh điều hướng 5 mục, giống hệt các màn đã có: `Trang chủ` · `Ngày học` · `Ôn câu hỏi` · `Quiz` · `Phỏng vấn thử`.

Không có nguồn — không được vẽ: mọi chữ tự đặt, mọi số tự bịa, mọi tên tài liệu không nằm trong mục 2, mọi nhãn trạng thái không nằm trong danh sách trên.
