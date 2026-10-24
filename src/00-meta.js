var SOURCES = SOURCES || [];
var GROUP_INTROS = GROUP_INTROS || {};
var SOURCE_CHECKED = SOURCE_CHECKED || '2026-10-12';

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
  { key: 'vue-components', name: 'Vue — Component Basics', url: 'https://vuejs.org/guide/essentials/component-basics.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-lifecycle', name: 'Vue — Lifecycle Hooks', url: 'https://vuejs.org/api/composition-api-lifecycle.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-composables', name: 'Vue — Composable Functions', url: 'https://vuejs.org/guide/reusability/composables.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-router', name: 'Vue Router', url: 'https://vuejs.org/guide/scaling-up/routing.html', checked: '2026-10-01', group: 'C' },
  { key: 'vue-pinia', name: 'Pinia — Core concepts (Defining a Store)', url: 'https://pinia.vuejs.org/core-concepts/', checked: '2026-10-12', group: 'C' },
  { key: 'vue-sfc', name: 'Vue — Single-File Components', url: 'https://vuejs.org/guide/scaling-up/sfc.html', checked: '2026-10-01', group: 'C' },

  { key: 'mdn-http-overview', name: 'MDN — HTTP overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', checked: '2026-10-01', group: 'D' },
  { key: 'mdn-cache-control', name: 'MDN — Cache-Control', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control', checked: '2026-10-01', group: 'D' },
  { key: 'mdn-csp', name: 'MDN — Content Security Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy', checked: '2026-10-01', group: 'D' },
  { key: 'owasp-api-security', name: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/', checked: '2026-10-01', group: 'D' },
  { key: 'aws-cognito-id-token', name: 'Amazon Cognito — Understanding the ID token', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-cognito-access-token', name: 'Amazon Cognito — Understanding the access token', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-apigw-jwt-authorizer', name: 'API Gateway — HTTP API JWT authorizers', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html', checked: '2026-10-12', group: 'G' },
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
  { key: 'aws-lambda-recursion', name: 'AWS Lambda — Recursive loop detection', url: 'https://docs.aws.amazon.com/lambda/latest/dg/invocation-recursion.html', checked: '2026-10-12', group: 'G' },
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
  { key: 'aws-cost-anomaly', name: 'AWS Cost Anomaly Detection', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-ec2', name: 'Amazon EC2 — Concepts', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-autoscaling', name: 'Amazon EC2 Auto Scaling', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-elb', name: 'Elastic Load Balancing — Application Load Balancer', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-route53', name: 'Amazon Route 53', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-acm', name: 'AWS Certificate Manager', url: 'https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-acm-regions', name: 'AWS Certificate Manager — Supported Regions', url: 'https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html#acm-regions', checked: '2026-10-12', group: 'G' },
  { key: 'aws-cognito', name: 'Amazon Cognito', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-elasticache', name: 'Amazon ElastiCache', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-elasticache-strategies', name: 'Amazon ElastiCache — Caching strategies', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-elasticache-tls', name: 'Amazon ElastiCache — Encryption in transit', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/in-transit-encryption.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-elasticache-public-endpoint', name: 'Amazon ElastiCache — Public endpoints', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/connecting-public-endpoint.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-elasticache-vpc-access', name: 'Amazon ElastiCache — Accessing from a VPC', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/elasticache-vpc-accessing.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-dax', name: 'Amazon DynamoDB — DAX', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-bpa', name: 'Amazon S3 — Block Public Access', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-encryption', name: 'Amazon S3 — Protecting data with encryption', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-cors', name: 'Amazon S3 — CORS', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-cors-troubleshoot', name: 'Amazon S3 — CORS troubleshooting', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors-troubleshooting.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-events', name: 'Amazon S3 — Event Notifications', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-event-structure', name: 'Amazon S3 — Event message structure', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-event-destinations', name: 'Amazon S3 — Event types and destinations', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-put-notification', name: 'Amazon S3 API — PutBucketNotificationConfiguration', url: 'https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketNotificationConfiguration.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-storage-classes', name: 'Amazon S3 — Storage classes', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-lifecycle-rules', name: 'Amazon S3 — Lifecycle configuration rules', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-glacier-classes', name: 'Amazon S3 — Glacier storage classes', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-mpu-abort', name: 'Amazon S3 — Aborting incomplete multipart uploads', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-delete-marker', name: 'Amazon S3 — Delete markers', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeleteMarker.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-storage-lens', name: 'Amazon S3 — Storage Lens metrics glossary', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage_lens_metrics_glossary.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-lifecycle', name: 'Amazon S3 — Object lifecycle', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-s3-versioning', name: 'Amazon S3 — Versioning', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-cloudfront-oac', name: 'Amazon CloudFront — Restrict access to an S3 origin (OAC)', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-sns', name: 'Amazon SNS', url: 'https://docs.aws.amazon.com/sns/latest/dg/welcome.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-eventbridge', name: 'Amazon EventBridge', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-step-functions', name: 'AWS Step Functions', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html', checked: '2026-10-12', group: 'G' },
  { key: 'aws-kms', name: 'AWS Key Management Service', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/overview.html', checked: '2026-10-12', group: 'G' },
  { key: 'ddos-cisa-ta14-017a', name: 'CISA — UDP-Based Amplification Attacks (TA14-017A)', url: 'https://www.cisa.gov/ncas/alerts/ta14-017a', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-rfc2644', name: 'RFC 2644 — Changing the Default for Directed Broadcasts in Routers', url: 'https://www.rfc-editor.org/rfc/rfc2644.html', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-spamhaus', name: 'Cloudflare — The DDoS That Almost Broke the Internet (Spamhaus 2013)', url: 'https://blog.cloudflare.com/the-ddos-that-almost-broke-the-internet/', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-ntp-400', name: 'Cloudflare — Technical Details Behind a 400 Gbps NTP Amplification DDoS Attack', url: 'https://blog.cloudflare.com/technical-details-behind-a-400gbps-ntp-amplification-ddos-attack/', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-github', name: 'GitHub — DDoS Incident Report (memcached, 1.35 Tbps)', url: 'https://github.blog/news-insights/company-news/ddos-incident-report/', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-aws-shield-tlr', name: 'AWS Shield — Threat Landscape Report Q1 2020 (2.3 Tbps CLDAP)', url: 'https://aws-shield-tlr.s3.amazonaws.com/2020-Q1_AWS_Shield_TLR.pdf', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-azure-trends', name: 'Microsoft Azure — DDoS Protection attack trends 2021 Q3/Q4 (3.47 Tbps)', url: 'https://azure.microsoft.com/en-us/blog/azure-ddos-protection-2021-q3-and-q4-ddos-attack-trends/', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-google-46m', name: 'Google Cloud — Blocked largest Layer 7 DDoS attack at 46M rps', url: 'https://cloud.google.com/blog/products/identity-security/how-google-cloud-blocked-largest-layer-7-ddos-attack-at-46-million-rps', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-rapid-reset', name: 'Cloudflare — HTTP/2 Rapid Reset (CVE-2023-44487) technical breakdown', url: 'https://blog.cloudflare.com/technical-breakdown-http2-rapid-reset-ddos-attack/', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-cf-3-8tbps', name: 'Cloudflare — Auto-mitigated a world-record 3.8 Tbps DDoS attack', url: 'https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/', checked: '2026-10-01', group: 'G' },
  { key: 'ddos-cf-q4-2024', name: 'Cloudflare — DDoS Threat Report 2024 Q4 (5.6 Tbps UDP)', url: 'https://blog.cloudflare.com/ddos-threat-report-for-2024-q4/', checked: '2026-10-01', group: 'G' },

  { key: 'dockerfile-ref', name: 'Dockerfile reference', url: 'https://docs.docker.com/reference/dockerfile/', checked: '2026-10-01', group: 'H' },
  { key: 'docker-multi-stage', name: 'Multi-stage builds', url: 'https://docs.docker.com/build/building/multi-stage/', checked: '2026-10-01', group: 'H' },
  { key: 'docker-compose', name: 'Docker Compose Specification', url: 'https://docs.docker.com/reference/compose-file/', checked: '2026-10-01', group: 'H' },
  { key: 'docker-security', name: 'Docker — Security best practices', url: 'https://docs.docker.com/build/building/best-practices/', checked: '2026-10-01', group: 'H' },
  { key: 'gh-actions', name: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', checked: '2026-10-01', group: 'H' },
  { key: 'signal-man', name: 'signal(7) — POSIX signals', url: 'https://man7.org/linux/man-pages/man7/signal.7.html', checked: '2026-10-01', group: 'H' },
  { key: 'flask-docs', name: 'Flask Documentation', url: 'https://flask.palletsprojects.com/en/stable/', checked: '2026-10-24', group: 'E' },
  { key: 'werkzeug-docs', name: 'Werkzeug Documentation', url: 'https://werkzeug.palletsprojects.com/', checked: '2026-10-24', group: 'E' },
  { key: 'pep3333', name: 'PEP 3333 — WSGI', url: 'https://peps.python.org/pep-3333/', checked: '2026-10-24', group: 'E' },
  { key: 'asgi-spec', name: 'ASGI Specification', url: 'https://asgi.readthedocs.io/en/latest/specs/main.html', checked: '2026-10-24', group: 'E' },
  { key: 'starlette-docs', name: 'Starlette Documentation', url: 'https://www.starlette.io/', checked: '2026-10-24', group: 'E' },
  { key: 'django-request', name: 'Django — Request and response objects', url: 'https://docs.djangoproject.com/en/stable/ref/request-response/', checked: '2026-10-24', group: 'E' },
  { key: 'django-migrations', name: 'Django — Migrations', url: 'https://docs.djangoproject.com/en/stable/topics/migrations/', checked: '2026-10-24', group: 'E' },
  { key: 'sqlalchemy-pool', name: 'SQLAlchemy — Connection Pooling', url: 'https://docs.sqlalchemy.org/en/20/core/pooling.html', checked: '2026-10-24', group: 'F' },
  { key: 'pg-perf', name: 'PostgreSQL — Performance Tips', url: 'https://www.postgresql.org/docs/current/performance-tips.html', checked: '2026-10-24', group: 'F' }
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
  title: 'DSA và thiết kế phần mềm',
  why: 'Nhóm này kiểm tra nền tảng kỹ thuật chung: chọn cấu trúc dữ liệu đúng cho từng tác vụ API, đọc độ phức tạp, xử lý chuỗi và phân trang đúng biên, rồi nâng lên tầng thiết kế với SOLID, DRY, tách trách nhiệm và tiêm phụ thuộc. Đây là phần chứng minh bạn viết code có chủ đích chứ không chỉ chạy được.',
  p0: [
    'chọn cấu trúc dữ liệu theo tác vụ (array, hash map, set, stack, queue)',
    'độ phức tạp thời gian và bộ nhớ, khử trùng lặp và đếm tần suất',
    'logic phân trang và kiểm tra biên với slice',
    'SOLID, DRY, KISS và rủi ro over-engineering',
    'separation of concerns và dependency injection'
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
