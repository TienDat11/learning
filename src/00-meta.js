var SOURCES = SOURCES || [];
var GROUP_INTROS = GROUP_INTROS || {};
var SOURCE_CHECKED = SOURCE_CHECKED || '2026-10-01';

SOURCES.push(
  { key: 'py-datamodel', name: 'Python Data Model', url: 'https://docs.python.org/3/reference/datamodel.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-expressions', name: 'Python Expressions', url: 'https://docs.python.org/3/reference/expressions.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-exceptions', name: 'Python Errors and Exceptions', url: 'https://docs.python.org/3/tutorial/errors.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-asyncio', name: 'asyncio — High-Level Coroutines and Tasks', url: 'https://docs.python.org/3/library/asyncio.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-asyncio-task', name: 'asyncio Task', url: 'https://docs.python.org/3/library/asyncio-task.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-faq-gil', name: 'Python FAQ — Global Interpreter Lock', url: 'https://docs.python.org/3/faq/library.html#what-kinds-of-global-value-mutation-are-thread-safe', checked: '2026-10-01', group: 'A' },
  { key: 'py-typing', name: 'Python typing', url: 'https://docs.python.org/3/library/typing.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-venv', name: 'venv — Virtual Environments', url: 'https://docs.python.org/3/library/venv.html', checked: '2026-10-01', group: 'A' },
  { key: 'py-unittest', name: 'unittest — Unit testing framework', url: 'https://docs.python.org/3/library/unittest.html', checked: '2026-10-01', group: 'A' },

  { key: 'mdn-execution-model', name: 'MDN — JavaScript execution model (event loop)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-promise', name: 'MDN — Promise', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-closure', name: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-this', name: 'MDN — this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-abortcontroller', name: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-cors', name: 'MDN — Cross-Origin Resource Sharing', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-cookies', name: 'MDN — Set-Cookie', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie', checked: '2026-10-01', group: 'B' },
  { key: 'mdn-http-headers', name: 'MDN — HTTP headers reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers', checked: '2026-10-01', group: 'B' },
  { key: 'ts-handbook', name: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', checked: '2026-10-01', group: 'B' },
  { key: 'ts-narrowing', name: 'TypeScript — Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html', checked: '2026-10-01', group: 'B' },

  { key: 'vue-reactivity', name: 'Vue — Reactivity API', url: 'https://vuejs.org/api/reactivity-core.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-computed', name: 'Vue — Computed API', url: 'https://vuejs.org/api/reactivity-core.html#computed', checked: '2026-10-01', group: 'C' },
  { key: 'vue-watchers', name: 'Vue — Watchers', url: 'https://vuejs.org/guide/essentials/watchers.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-components', name: 'Vue — Component Basics', url: 'https://vuejs.org/guide/essentials/components.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-lifecycle', name: 'Vue — Lifecycle Hooks', url: 'https://vuejs.org/api/composition-api-lifecycle.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-composables', name: 'Vue — Composable Functions', url: 'https://vuejs.org/guide/reusability/composables.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-router', name: 'Vue Router', url: 'https://vuejs.org/guide/scaling-up/routing.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-pinia', name: 'Pinia — State Management', url: 'https://vuejs.org/guide/scaling-up/state-management.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-sfc', name: 'Vue — Single-File Components', url: 'https://vuejs.org/guide/scaling-up/sfc.html', checked: '2026-10-01', group: 'C' },

  { key: 'mdn-http-overview', name: 'MDN — HTTP overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', checked: '2026-10-01', group: 'D' },
  { key: 'mdn-cache-control', name: 'MDN — Cache-Control', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control', checked: '2026-10-01', group: 'D' },
  { key: 'mdn-csp', name: 'MDN — Content Security Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy', checked: '2026-10-01', group: 'D' },
  { key: 'owasp-api-security', name: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/', checked: '2026-10-01', group: 'D' },
  { key: 'owasp-top10', name: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', checked: '2026-10-01', group: 'D' },

  { key: 'fastapi-tutorial', name: 'FastAPI Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', checked: '2026-10-01', group: 'E' },
  { key: 'fastapi-dependencies', name: 'FastAPI — Dependencies', url: 'https://fastapi.tiangolo.com/tutorial/dependencies/', checked: '2026-10-01', group: 'E' },
  { key: 'fastapi-background', name: 'FastAPI — Background Tasks', url: 'https://fastapi.tiangolo.com/tutorial/background-tasks/', checked: '2026-10-01', group: 'E' },
  { key: 'fastapi-testing', name: 'FastAPI — Testing', url: 'https://fastapi.tiangolo.com/tutorial/testing/', checked: '2026-10-01', group: 'E' },
  { key: 'django-queries', name: 'Django — QuerySet API', url: 'https://docs.djangoproject.com/en/stable/topics/db/queries/', checked: '2026-10-01', group: 'E' },
  { key: 'django-serializers', name: 'Django REST framework — Serializers', url: 'https://www.django-rest-framework.org/api-guide/serializers/', checked: '2026-10-01', group: 'E' },
  { key: 'django-permissions', name: 'Django REST framework — Permissions', url: 'https://www.django-rest-framework.org/api-guide/permissions/', checked: '2026-10-01', group: 'E' },
  { key: 'django-testing', name: 'Django — Testing', url: 'https://docs.djangoproject.com/en/stable/topics/testing/', checked: '2026-10-01', group: 'E' },

  { key: 'pg-indexes', name: 'PostgreSQL — Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html', checked: '2026-10-01', group: 'F' },
  { key: 'pg-explain', name: 'PostgreSQL — Using EXPLAIN', url: 'https://www.postgresql.org/docs/current/using-explain.html', checked: '2026-10-01', group: 'F' },
  { key: 'pg-mvcc', name: 'PostgreSQL — Concurrency Control (MVCC)', url: 'https://www.postgresql.org/docs/current/mvcc.html', checked: '2026-10-01', group: 'F' },
  { key: 'pg-transactions', name: 'PostgreSQL — Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html', checked: '2026-10-01', group: 'F' },
  { key: 'pg-constraints', name: 'PostgreSQL — Constraints', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html', checked: '2026-10-01', group: 'F' },
  { key: 'pg-upsert', name: 'PostgreSQL — INSERT ... ON CONFLICT', url: 'https://www.postgresql.org/docs/current/sql-insert.html', checked: '2026-10-01', group: 'F' },
  { key: 'pg-limit', name: 'PostgreSQL — LIMIT', url: 'https://www.postgresql.org/docs/current/queries-limit.html', checked: '2026-10-01', group: 'F' },

  { key: 'aws-lambda-permissions', name: 'AWS Lambda — Identity and access management', url: 'https://docs.aws.amazon.com/lambda/latest/dg/permissions.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-lambda-best', name: 'AWS Lambda — Best practices', url: 'https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-iam', name: 'AWS IAM — Policies', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-api-gateway', name: 'Amazon API Gateway', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-s3', name: 'Amazon S3 User Guide', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-s3-presigned', name: 'Amazon S3 — Presigned URLs', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-rds', name: 'Amazon RDS User Guide', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-dynamodb-query', name: 'Amazon DynamoDB — Query', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-dynamodb-model', name: 'Amazon DynamoDB — Data modeling', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/data-modeling.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-sqs-visibility', name: 'Amazon SQS — Visibility timeout', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/visibility-timeout.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-sqs-dlq', name: 'Amazon SQS — Dead-letter queues', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-vpc', name: 'Amazon VPC', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-cloudwatch', name: 'Amazon CloudWatch', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-secrets', name: 'AWS Secrets Manager', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/introduction.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-cloudfront', name: 'Amazon CloudFront', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-ecs', name: 'Amazon ECS', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-cfn', name: 'AWS CloudFormation', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html', checked: '2026-10-01', group: 'G' },
  { key: 'aws-cost', name: 'AWS Cost and Usage Report', url: 'https://docs.aws.amazon.com/cur/latest/userguide/introduction.html', checked: '2026-10-01', group: 'G' },

  { key: 'dockerfile-ref', name: 'Dockerfile reference', url: 'https://docs.docker.com/reference/dockerfile/', checked: '2026-10-01', group: 'H' },
  { key: 'docker-multi-stage', name: 'Multi-stage builds', url: 'https://docs.docker.com/build/building/multi-stage/', checked: '2026-10-01', group: 'H' },
  { key: 'docker-compose', name: 'Docker Compose Specification', url: 'https://docs.docker.com/reference/compose-file/', checked: '2026-10-01', group: 'H' },
  { key: 'docker-security', name: 'Docker — Security best practices', url: 'https://docs.docker.com/build/building/best-practices/', checked: '2026-10-01', group: 'H' },
  { key: 'gh-actions', name: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', checked: '2026-10-01', group: 'H' },
  { key: 'signal-man', name: 'signal(7) — POSIX signals', url: 'https://man7.org/linux/man-pages/man7/signal.7.html', checked: '2026-10-01', group: 'H' }
);

GROUP_INTROS.A = {
  title: 'Python sâu: data model, GIL và asyncio',
  why: 'Đây là nền tảng nhất khi JD yêu cầu 2 năm Python. Phỏng vấn viên hỏi data model, closure, GIL và event loop để biết bạn viết Python ở mức hiểu cơ chế hay chỉ biết cú pháp. Biết rõ khi nào asyncio thắng thread, khi nào hỏng thì trả lời được cả phần lý thuyết lẫn phần code thực tế.',
  p0: [
    'GIL và cạnh tranh luồng trong CPython',
    'async/await, task, event loop',
    'descriptor, property, __slots__',
    'mutable default argument',
    'exception chaining và custom exception'
  ]
};

GROUP_INTROS.B = {
  title: 'JavaScript, event loop và TypeScript',
  why: 'Lưu ý: nhóm này dùng tài liệu MDN và TypeScript Handbook vì đó là nguồn chính thức đáng tin cậy nhất cho ngôn ngữ, và JD nói TypeScript là một điểm cộng. Bạn cần chắc microtask và macrotask, scope closure, this binding và cách TypeScript thu hẹp kiểu, vì đây là phần hay bị hỏi khi ứng dụng chạy trong trình duyệt.',
  p0: [
    'microtask và macrotask, thứ tự chạy',
    'Promise chain và xử lý lỗi',
    'closure và scope',
    'this trong arrow function',
    'type narrowing trong TypeScript'
  ]
};

GROUP_INTROS.C = {
  title: 'VueJS: reactivity, component và state',
  why: 'VueJS là một trong hai lỗ hổng lớn của bạn, vì vậy nhóm này được đẩy lên P0 nặng. JD nói rõ phải dùng VueJS thật sự, nên bạn cần hiểu cơ chế reactivity dựa trên Proxy, phân biệt ref và reactive, lifecycle hook, composable và cách tổ chức state bằng Pinia cùng router.',
  p0: [
    'ref, reactive và cơ chế Proxy',
    'computed và watch, khi nào dùng cái nào',
    'Single-File Component và props/emits',
    'composable và dependency injection',
    'Pinia và Vue Router'
  ]
};

GROUP_INTROS.D = {
  title: 'Web nền tảng: HTTP, cache và bảo mật',
  why: 'Backend và frontend đều đứng trên HTTP. Biết status code, header, Cache-Control, CORS, cookie và SameSite quyết định bạn có debug được lỗi thật hay chỉ đoán mò. Phần OWASP nối thẳng vào yêu cầu review code và xử lý sự cố trong JD, nên đây là chỗ dễ ghi điểm nếu bạn nói được ví dụ cụ thể.',
  p0: [
    'HTTP methods, status code, header',
    'CORS preflight và SameSite cookie',
    'Cache-Control và CDN',
    'OWASP Top 10 và API Security',
    'Content Security Policy'
  ]
};

GROUP_INTROS.E = {
  title: 'Python web: FastAPI và Django/DRF',
  why: 'Đây là phần mạnh nhất của bạn nên phải nói chắc, không do dự. JD nhắc API Python chạy trong container hoặc serverless, nên hãy chuẩn bị dependency injection, background task, test, cùng queryset và serializer bên Django. Biết rõ phân biệt blocking I/O với async là chìa khóa khi deploy lên Lambda.',
  p0: [
    'FastAPI dependency injection',
    'async handler và blocking I/O',
    'background task và queue ngoài',
    'Django ORM, queryset và N+1',
    'DRF serializer và permission'
  ]
};

GROUP_INTROS.F = {
  title: 'PostgreSQL: index, transaction và MVCC',
  why: 'RDS PostgreSQL là dịch vụ được JD nêu đích danh. Hầu hết lỗi hiệu năng và lỗi dữ liệu trong dự án thật đều nằm ở đây: thiếu index, hiểu sai transaction isolation, hoặc chạy lệnh UPDATE không kiểm soát. Biết đọc EXPLAIN là kỹ năng chứng minh kinh nghiệm thực chiến.',
  p0: [
    'B-tree, index và EXPLAIN',
    'isolation level và race condition',
    'MVCC và transaction',
    'constraint, upsert',
    'phân trang với LIMIT và OFFSET'
  ]
};

GROUP_INTROS.G = {
  title: 'AWS: Lambda, S3, SQS, RDS và DynamoDB',
  why: 'AWS là lỗ hổng lớn thứ hai và là trọng tâm của JD. Nhóm này gần như toàn P0 vì đề thi gần như chắc chắn hỏi Lambda, S3, DynamoDB, SQS và cách phân quyền IAM. Mục tiêu là trả lời được cả phần thiết kế, phần vận hành lẫn phần chi phí, vì JD yêu cầu theo dõi cost và log của hệ thống mình sở hữu.',
  p0: [
    'Lambda: memory, timeout, cold start',
    'IAM least privilege và resource policy',
    'S3 lifecycle và presigned URL',
    'DynamoDB partition key và query pattern',
    'SQS visibility timeout, DLQ và CloudWatch alarm'
  ]
};

GROUP_INTROS.H = {
  title: 'Container, CI/CD và vận hành',
  why: 'JD yêu cầu Docker và phát hành tự động, nên đây là phần nối liền giữa code và AWS. Hãy nắm multi-stage build, layer cache, image nhỏ, secret trong CI, và cách ứng dụng xử lý tín hiệu dừng. Đây cũng là nơi bạn dễ phô ra kinh nghiệm thật với Docker Compose cho môi trường local.',
  p0: [
    'multi-stage build và image nhỏ',
    'Dockerfile layer cache',
    'Docker Compose cho môi trường local',
    'GitHub Actions và secret trong CI',
    'shutdown signal và graceful stop'
  ]
};

GROUP_INTROS.I = {
  title: 'System design và kiến trúc ứng dụng web',
  why: 'Nhóm này luyện khả năng dựng hệ thống từ yêu cầu nghiệp vụ: chọn loại cơ sở dữ liệu, đặt hàng ranh giới dịch vụ, xử lý nhất quán và chịu tải. Đây là phần quyết định điểm số ở vòng cuối, và là nơi bạn gắn kiến thức AWS vào một bài toán thật thay vì trả lời rời rạc.',
  p0: [
    'yêu cầu phi chức năng và ước lượng tải',
    'monolith hay service, ranh giới dịch vụ',
    'thiết kế schema và truy vấn chính',
    'idempotency và xử lý lỗi phân tán',
    'làm sao mở rộng và cân bằng tải'
  ]
};

GROUP_INTROS.J = {
  title: 'Hành vi và giao tiếp trong công việc thực tế',
  why: 'Nhóm này dùng tình huống gần với đời thật trong JD: đọc code cũ, review pull request, xử lý sự cố giữa đêm và trao đổi với bộ phận khác. Câu trả lời phải cho thấy cách bạn đưa ra quyết định dưới áp lực thời gian, vì đó là tiêu chí nhà tuyển dụng nhìn thấy nhiều nhất khi họ không biết bạn.',
  p0: [
    'review code và đưa nhận xét',
    'debug sự cố dưới áp lực',
    'đánh giá rủi ro trước khi lên production',
    'phối hợp với bộ phận khác',
    'viết tài liệu và chuẩn bị bàn giao'
  ]
};
