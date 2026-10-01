# CONTRACT — data files for `hitechcloud-interview-prep.html`

Binding contract. Every content agent MUST read this file completely before writing.

## Context

Target role: **Fullstack Engineer (AWS, Python, VueJS) at HiTechCloud**.
JD (read from https://hitechcloud.vn/careers/fullstack-engineer-aws-python-vuejs/):
- Develop end-to-end features for web apps deployed on AWS.
- Build APIs in Python, running in containers or serverless.
- Build UI with VueJS, integrate with AWS services.
- Configure AWS resources: storage, queues, databases, content delivery.
- Write tests, participate in code review.
- Track logs, metrics and cost of the systems you own.
- Handle incidents and improve features from user feedback.
- Requirements: 2+ years Python + a JS frontend framework; real AWS deployment
  experience; VueJS proficiency, TypeScript a plus; Lambda, API Gateway, S3, RDS or
  DynamoDB; Docker and automated release; self-driven learning.

Candidate: strong Django/DRF, Python/FastAPI, React/TypeScript, Spring Boot, Angular,
PostgreSQL, Docker, CI/CD, Flutter, and a hybrid RAG project. **AWS and Vue are the two
gaps.** Be honest about that; lean hardest on AWS and Vue depth.

Never claim these are real HiTechCloud questions. Never invent company process,
interview rounds, or pay figures. Never invent current AWS prices.

You write DATA FILES ONLY. Other agents own the HTML shell, CSS, app engine, quiz,
mock sets, meta and case study. Do not touch files you were not assigned.

## Question file shape

Every question file starts with exactly:

```js
var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
  { /* q1 */ },
  { /* q2 */ }
);
```

No `const QUESTIONS`. No IIFE. No `module.exports`.

## Question object — exact keys, no extras

```js
{
  id: 'A01',
  group: 'A',
  topic: 'Mutable default argument',
  prio: 'P0',
  level: 'L2',
  type: 'concept',
  q: 'Câu hỏi phỏng vấn thật, có đầu ra cụ thể.',
  oral: 'Đoạn trả lời miệng 30–60 giây.',
  deep: '<p>HTML giải thích sâu.</p>',
  code: 'raw python source',
  expected: 'Kết quả đúng + nguyên nhân',
  followups: [ { q: '...', a: '...' } ],
  pitfalls: [ 'hiểu nhầm 1', 'hiểu nhầm 2' ],
  selfcheck: [ 'a', 'b', 'c' ],
  refs: ['py-datamodel']
}
```

### Hard validation rules — build fails otherwise

| Field | Rule |
|---|---|
| `id` | unique across the whole project; use exactly your assigned ids |
| `q` | >= 12 chars, real interview question form |
| `oral` | >= 60 chars, aim 400–900. PLAIN TEXT, no HTML |
| `deep` | >= 220 chars, aim 700–1800. HTML allowed |
| `followups` | P0: **exactly 3** (the "chuỗi hỏi sâu 3 tầng"). Non-P0: 2 or 3 |
| `followups[i].a` | >= 40 chars, aim 150+. PLAIN TEXT |
| `pitfalls` | >= 2, none empty. PLAIN TEXT |
| `selfcheck` | **exactly 3**, in this order (below) |
| `code` | RAW source text or `null`. No HTML escaping, no `&lt;` |
| `expected` | REQUIRED for `type` `predict`/`debug`, >= 20 chars. PLAIN TEXT |
| `refs` | only keys from the source list below |

`selfcheck` order:
1. what you still cannot explain
2. what you can explain with an example
3. what you could do in a concrete situation

All three must be SPECIFIC to that question. Generic filler like "chưa hiểu" fails review.

### `deep` HTML — allowed tags only
`<p> <ul> <ol> <li> <strong> <em> <code> <br> <table> <thead> <tbody> <tr> <th> <td>`

Code inside `deep` must go in `<pre><code>` with the code text HTML-escaped
(`<`→`&lt;`, `>`→`&gt;`, `&`→`&amp;`). **Prefer the separate `code` field**, which takes
raw text — less escaping risk.

`deep` must NOT contain `<script`, `<img`, `onerror=`, `onload=`.

## `predict` / `debug` questions

Output-prediction and find-the-bug exercises.

- `q` shows code and asks what it prints, or what is broken and why.
- `expected` gives the exact correct behaviour AND the root cause.
- Do NOT rely on unspecified implementation details, hash randomisation, dict ordering
  before 3.7, or version-specific behaviour. If a version matters, say so in `expected`
  ("Từ Python 3.7 dict giữ thứ tự chèn; trước đó không").
- Exactly one unambiguous correct answer per question.
- Verify by careful reasoning. If unsure of the exact output, write a different question.
  A wrong answer key is a real defect.

## Language and tone

- Prose **Vietnamese** with a full diacritics. Technical terms stay English: GIL,
  closure, idempotency, EXPLAIN, presigned URL, race condition, visibility timeout.
- Address the reader as "bạn".
- Dense and concrete. No filler, no "trong bài này chúng ta sẽ", no motivational padding.

## The seven required angles per question

Every question must cover, across `deep` and `followups`:
1. What it is. 2. How it works. 3. Why it is needed. 4. When to use and when NOT to.
5. Code or a concrete situation. 6. Common mistakes and misunderstandings.
7. **How the answer changes if the conditions change.** Angle 7 is what separates L3
   from L2 — make it explicit in L3 questions.

## Levels and priorities

- L1 precise definition + short explanation.
- L2 mechanism + example + comparison.
- L3 edge cases, concurrency, failure modes, tradeoffs.

- P0 must know before the interview (~30% of your questions).
- P1 finish within 2–3 days. P2 if time remains.
- Groups G (AWS) and C (Vue) skew heavily P0 — they are the candidate's gaps.

## Source keys — `refs` may only use these

```
python:     py-datamodel, py-expressions, py-exceptions, py-asyncio, py-asyncio-task,
            py-faq-gil, py-typing, py-venv, py-unittest
javascript: mdn-execution-model, mdn-promise, mdn-closure, mdn-this, mdn-abortcontroller,
            mdn-cors, mdn-cookies, mdn-http-headers, ts-handbook, ts-narrowing
vue:        vue-reactivity, vue-computed, vue-watchers, vue-components, vue-lifecycle,
            vue-composables, vue-router, vue-pinia, vue-sfc
web:        mdn-http-overview, mdn-cache-control, mdn-csp, owasp-api-security, owasp-top10
pyweb:      fastapi-tutorial, fastapi-dependencies, fastapi-background, fastapi-testing,
            django-queries, django-serializers, django-permissions, django-testing
sql:        pg-indexes, pg-explain, pg-mvcc, pg-transactions, pg-constraints, pg-upsert, pg-limit
aws:        aws-lambda-permissions, aws-lambda-best, aws-iam, aws-api-gateway, aws-s3,
            aws-s3-presigned, aws-rds, aws-dynamodb-query, aws-dynamodb-model,
            aws-sqs-visibility, aws-sqs-dlq, aws-vpc, aws-cloudwatch, aws-secrets,
            aws-cloudfront, aws-ecs, aws-cfn, aws-cost
ops:        dockerfile-ref, docker-multi-stage, docker-compose, docker-security,
            gh-actions, signal-man
```

## Definition of done

1. Your assigned file exists at the exact path.
2. `node -e "new Function(require('fs').readFileSync('<file>','utf8'))"` exits 0.
   Run this on YOUR file only. Do not run the project build or another agent's file.
3. Object count matches the assignment exactly.
4. No placeholder, no TODO, no empty fields, no "trả lời mẫu".
