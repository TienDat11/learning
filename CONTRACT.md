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

Optional keys (được phép, không bắt buộc, không phải "extras"): incident, askFirst, predict, anchor, attacks, tradeoff, alternatives, observe, say30, say90.

**Trạng thái hiện tại:** mười trường trên đã có mặt trên **cả 147 câu hỏi**, và `build.mjs`
nay bắt buộc chúng — thiếu một trường là build fail. Danh sách "optional" ở trên giữ lại
như ghi chú lịch sử về hình dạng object; đừng thêm câu mới mà bỏ trống chúng.

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

### Type `situation`

- `type: 'situation'` dùng cho câu hỏi tình huống (ví dụ G19, G20, G27, G28).
- `expected` có thể là `null`. G19, G20, G27 và G28 đều dùng `null`.
- Các trường còn lại theo hình dạng của object concept ở trên, gồm `attacks` hoặc `followups` và `selfcheck`.

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
| `incident`, `askFirst`, `predict`, `anchor`, `naive`, `rootCause`, `tradeoff`, `alternatives`, `observe`, `attacks`, `say30`, `say90` | REQUIRED on **every** question; missing or empty fails the build. `predict` needs both `.q` and `.a`; `attacks`/`askFirst` need at least one entry |

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
python:     py-asyncio, py-asyncio-task, py-datamodel, py-exceptions, py-expressions,
            py-faq-gil, py-typing, py-unittest, py-venv
javascript: mdn-abortcontroller, mdn-closure, mdn-cookies, mdn-cors, mdn-execution-model,
            mdn-http-headers, mdn-promise, mdn-this, ts-handbook, ts-narrowing
vue:        vue-components, vue-composables, vue-computed, vue-lifecycle, vue-pinia,
            vue-reactivity, vue-router, vue-sfc, vue-watchers
web:        mdn-cache-control, mdn-csp, mdn-http-overview, owasp-api-security, owasp-top10
pyweb:      django-permissions, django-queries, django-serializers, django-testing,
            fastapi-background, fastapi-dependencies, fastapi-testing, fastapi-tutorial
sql:        pg-constraints, pg-explain, pg-indexes, pg-limit, pg-mvcc, pg-transactions, pg-upsert
aws:        aws-acm, aws-acm-regions, aws-api-gateway, aws-apigw-jwt-authorizer, aws-autoscaling,
            aws-cfn, aws-cloudfront, aws-cloudfront-oac, aws-cloudwatch, aws-cognito,
            aws-cognito-access-token, aws-cognito-id-token, aws-cost, aws-cost-anomaly, aws-dax,
            aws-dynamodb-model, aws-dynamodb-query, aws-ec2, aws-ecs, aws-elasticache,
            aws-elasticache-public-endpoint, aws-elasticache-strategies, aws-elasticache-tls,
            aws-elasticache-vpc-access, aws-elb, aws-eventbridge, aws-iam, aws-kms,
            aws-lambda-best, aws-lambda-permissions, aws-lambda-recursion, aws-rds, aws-route53,
            aws-s3, aws-s3-bpa, aws-s3-cors, aws-s3-cors-troubleshoot, aws-s3-delete-marker,
            aws-s3-encryption, aws-s3-event-destinations, aws-s3-event-structure, aws-s3-events,
            aws-s3-glacier-classes, aws-s3-lifecycle, aws-s3-lifecycle-rules, aws-s3-mpu-abort,
            aws-s3-presigned, aws-s3-put-notification, aws-s3-storage-classes, aws-s3-storage-lens,
            aws-s3-versioning, aws-secrets, aws-sns, aws-sqs-dlq, aws-sqs-visibility,
            aws-step-functions, aws-vpc
ops:        dockerfile-ref, docker-multi-stage, docker-compose, docker-security, gh-actions,
            signal-man
ddos:       ddos-aws-shield-tlr, ddos-azure-trends, ddos-cf-3-8tbps, ddos-cf-q4-2024,
            ddos-cisa-ta14-017a, ddos-github, ddos-google-46m, ddos-ntp-400, ddos-rapid-reset,
            ddos-rfc2644, ddos-spamhaus
```

## Lesson contract — the only authoring shape for `LESSONS`

Every lesson file starts with exactly:

```js
var LESSONS = LESSONS || [];
LESSONS.push(
  { /* L01 */ },
  { /* L02 */ }
);
```

No `const LESSONS`. No IIFE. No `module.exports`. Order inside `LESSONS.push` is the
lesson order: `buildsOn` may only point at a lesson that appears earlier in that order,
and every lesson must reach `L01` through its `buildsOn` chain.

`LESSONS` holds L01–L25: `35-lessons-aws.js` (L01–L06), `36-lessons-py.js` (L07–L11),
`37-lessons-vue.js` (L12–L17), `38-lessons-link.js` (L18–L22),
`39-lessons-security.js` (L23), `41-lessons-deep.js` (L24–L25). Six stages, sized
6/5/6/5/1/2.

`build.mjs` gates every field in the table below. A missing field, a wrong count or an
over-length field fails the build, so a lesson is either fully shaped or the build is
red. "gate" means the build rejects it; "practice" means the build does not check it but
every current lesson complies and a lesson that skips it is thinner than its neighbours.

### Field-by-field

| Field | Kind | Gate |
|---|---|---|
| `id` | string | unique; `L\d\d`, because the glossary entry must carry the same id and `buildsOn` only accepts `/^L\d{2}$/` |
| `stage` | number | `Number.isInteger`, ≥ 1 (1–6 in the current book) |
| `stageTitle` | plain text | plain text when present; every lesson carries it |
| `stageIntro` | HTML | **not gated**. Practice: text on the first lesson of a stage only; every other lesson sets `stageIntro: undefined` |
| `title` | plain text | non-empty |
| `goal` | plain text | non-empty; starts with an observable verb (trace / tính / chọn / giải thích), never "hiểu" |
| `buildsOn` | `['L\d\d']` | every id exists, appears earlier in the array, never itself; may be empty only for the first lesson; the chain must reach `L01` |
| `qids` | `['A01']` | 3–6 entries; every id exists in `QUESTIONS` |
| `refs` | `['pg-explain']` | 1–4 entries; every key exists in `SOURCES` |
| `provenance` | `[string]` | plain text per line; no length gate; carries the assumed numbers and the limit of each source |
| `visuals` | `[{id, question, focus}]` | exactly 1 entry; exactly 2 for L05, L09, L24 — see below |
| `bridge` | plain text | ≥ 120 chars |
| `incident` | HTML | starts with `<p>`, ≤ 1800 chars |
| `askFirst` | `[string]` | exactly 3; each ≥ 12 chars plain text; none contains `Giải mã`, `Đáp án` or `→` |
| `predict` | `{q, a}` | `q` ≥ 12 chars; `a` ≥ 40 chars; `a` with tags stripped must not be a substring of `incident` with tags stripped |
| `naive` | HTML | ≥ 60 chars |
| `naiveCode` | plain text | ≥ 10 chars, raw snippet |
| `naiveOut` | HTML | ≥ 10 chars |
| `timeline` | `[[when, what]]` | 3–6 rows; each row exactly two non-empty strings; `when` is plain text |
| `rootCause` | HTML | ≥ 60 chars |
| `concept` | HTML | 120–250 chars, raw length including tags |
| `mechanism` | HTML | ≥ 60 chars, ≤ 3500 chars, contains `<ol>`, 3–5 `<li>` |
| `failureModes` | HTML | ≥ 60 chars, ≤ 2500 chars, 2–4 `<li>` |
| `tradeoff` | HTML | ≥ 60 chars, ≤ 2500 chars |
| `alternatives` | HTML | ≥ 60 chars, ≤ 2500 chars |
| `observe` | HTML | non-empty, ≥ 60 chars |
| `code` | raw string | raw source text, never HTML-escaped, never sanitised, no length gate |
| `codeNote` | HTML | no length gate |
| `body` | HTML | 600–2200 chars |
| `attacks` | `[{q, a}]` | exactly 4; each `q` ≥ 12 chars; each `a` ≥ 40 and ≤ 1600 chars |
| `anchor` | plain text | ≥ 10 chars, ≤ 180 chars |
| `say30` | plain text | 60–85 tokens |
| `say90` | plain text | 160–210 tokens; contains all three labels below |
| `sayIt` | `[string]` | 4–6 entries, plain text |
| `analogy` | object | L12 only — see below; any other lesson carrying it fails |

A token is one whitespace-separated chunk (`split(/\s+/)`), so punctuation attached to a
word does not create a second token. `say90` must contain, verbatim:
`[Nêu vấn đề (30s)]:`, `[Cơ chế (45s)]:`, `[Ranh giới (15s)]:`.

The count gates on `qids` (3–6) and `refs` (1–4) apply to every lesson, as do the
`visuals` gates: no legacy `spine`/`spineNode`/`flow` key may survive on a lesson, and
each visual id must resolve to exactly one `FLOW_SVGS` entry.

Two more gates run over the whole lesson object:

- Banned phrases anywhere in the JSON: `Xem Bài này`, `quen React`, `Giống useMemo`,
  `Giống Zustand`, `custom hook trong React`.
- No learner-facing field may contain the lesson's own id. This covers `title`, `goal`,
  `bridge`, `incident`, `askFirst`, `predict`, `naive`, `naiveCode`, `naiveOut`,
  `timeline`, `rootCause`, `concept`, `mechanism`, `failureModes`, `tradeoff`,
  `alternatives`, `observe`, `codeNote`, `body`, `attacks`, `anchor`, `say30`, `say90`,
  `sayIt`, `provenance`. Write "bài trước" or "bài này", never "L07 nói rằng…".

### Plain text vs HTML

Plain-text fields are rendered through `esc()`; a tag there reaches the reader as
literal text. The gate rejects any of `<code> <em> <strong> <b> <i> <br> <p> <ul> <ol>
<li> <span> <div> <pre> <small>` and any entity `&lt; &gt; &amp; &quot; &#39;`.

Plain text: `title`, `goal`, `stageTitle`, `bridge`, `anchor`, `say30`, `say90`,
`naiveCode`, every `askFirst[]`, `sayIt[]`, `provenance[]`, `timeline[][0]`.

HTML fields are rendered through the whitelist sanitiser. Allowed tags: `p`, `ul`, `ol`,
`li`, `strong`, `em`, `code`, `br`, `pre`, `table`, `thead`, `tbody`, `tr`, `th`, `td`,
`h3`, `h4`. Forbidden anywhere: `<script`, `<img`, `<iframe`, `<style`, an `on…=`
attribute, `javascript:`.

HTML: `incident`, `naive`, `naiveOut`, `rootCause`, `concept`, `mechanism`,
`failureModes`, `tradeoff`, `alternatives`, `observe`, `codeNote`, `body`, plus
`predict.q`, `predict.a`, `attacks[].q`, `attacks[].a`.

`code` is neither: it is a code sample, so markup inside it is legitimate content.

### Ba key đã bị xoá — không được thêm lại

`spine`, `spineNode` và `flow` đã bị xoá khỏi lesson schema; một lesson còn giữ chúng làm build fail (`legacy key "<k>" must be removed after migration`). Lý do: `spine` và `spineNode` lặp lại `bridge` bằng một giọng thứ hai và tự tạo một taxonomy nút bài học riêng mà không view nào khác đọc, nên cùng một ý bị viết hai lần rồi lệch nhau; `flow` được thay bằng `visuals` để một bài gắn được nhiều hơn một hình. `CASE_STUDY.sections[].flow` giữ nguyên và vẫn phải resolve trong `FLOW_SVGS`. Cùng đợt cutover, `src/07-lesson-images.js` và `LESSON_IMAGES` cùng quy định 23 ảnh đã bị xoá khỏi hợp đồng: `build.mjs` không còn export hay validate `LESSON_IMAGES`, không bài nào được tham chiếu ảnh, và file đó không được thêm nội dung mới.

### `visuals` — mỗi bài một hình, L05/L09/L24 hai hình

- `visuals` là array, đúng 1 phần tử; riêng L05, L09, L24 đúng 2.
- Mỗi phần tử là `{id, question, focus}`:
  - `id` resolve trong `FLOW_SVGS`; không lặp trong cùng một bài và không được dùng bởi
    hai bài khác nhau (một hình thuộc đúng một bài).
  - `question`: ≥ 20 ký tự, kết thúc bằng `?`, nêu đúng điều hình phải trả lời.
  - `focus`: chuỗi khác rỗng và phải xuất hiện **nguyên văn** trong text của SVG sau khi
    strip tags — đây là nhãn người đọc được bảo nhìn vào.
- Orphan gate: mọi phần tử của `FLOW_SVGS` phải được ít nhất một `visuals` hoặc một
  `CASE_STUDY.sections[].flow` dùng.
- `FLOW_SVGS` (`src/60-flows.js`) là nguồn hình duy nhất, mỗi phần tử `{id, caption, svg}`
  với SVG inline có `viewBox` và `role="img"`. Không bài nào được nhúng ảnh, base64 hay
  bản sao SVG thứ hai.

### `analogy` — chỉ L12

```js
analogy: {
  source: 'bảng tính',
  pairs: [ { from: 'ô đầu vào', to: 'reactive state' } ], // ≥ 3 dòng
  breaks: '…',   // ≥ 40 ký tự
  transfer: '…', // kết thúc bằng "?"
}
```

Gate: `source` khác rỗng; `pairs` ≥ 3 dòng, mỗi dòng `from`/`to` khác rỗng; `breaks`
≥ 40 ký tự; `transfer` kết thúc bằng `?`. Bài khác mang `analogy` là build fail.

`breaks` không phải phần trang trí: nó nêu đúng chỗ ánh xạ ngừng đúng. Thiếu nó thì
liên tưởng dạy một mô hình sai.

### `lesson-glossary.json` — dữ liệu đi kèm mỗi bài

`build.mjs` đọc `lesson-glossary.json` ở root, chèn thành `LESSON_GLOSSARY` và gate:
mỗi bài đã migrate có đúng một entry `id` dạng `L\d\d`, không trùng id; 3–8 dòng
`{term, is, not}` đều khác rỗng; không trùng `term` trong một bài; `not` sau khi strip
tags, lowercase và gộp whitespace không được trùng nguyên chuỗi với một `<li>` trong
`failureModes` của chính bài đó.

### Nguyên tắc soạn thảo

Thứ tự bắt buộc trong mỗi bài — mọi gate ở trên tồn tại để giữ thứ tự này:

1. **Ví dụ giải sẵn trước.** `incident` + `naive`/`naiveCode`/`naiveOut` cho thấy một
   thất bại cụ thể kèm đầu ra quan sát được, trước khi bất kỳ tên khái niệm nào xuất hiện.
2. **Câu hỏi tự giải thích tiếp theo.** `predict.q` bắt người đọc tự giải thích cơ chế;
   `predict.a` nằm sau nút reveal và không được in lại ở bất kỳ field nào khác.
3. **Câu đổi điều kiện sau cùng.** `attacks` và `body` đổi đúng một điều kiện rồi hỏi
   điều gì vỡ.

Kèm theo:

- Đáp án luôn nằm sau một control reveal (`<details>` hoặc nút "Hiện đáp án"); không
  đáp án nào hiện ra trước khi người đọc tự trả lời.
- Hình phải **giảm việc tìm quan hệ**, không trang trí. Nếu cùng thông tin đó đọc nhanh
  hơn bằng một câu, xoá hình. Mũi tên trang trí, legend rời và icon cloud là lỗi.
- Liên tưởng chỉ dùng khi có ánh xạ thật và điểm vỡ nêu rõ (`pairs` + `breaks`); không
  dùng ẩn dụ để trang trí.
- Một field một việc: `concept` gọi tên mô hình (120–250 ký tự), `mechanism` giải thích
  đầy đủ (3–5 bước), `body` chuyển sang tình huống mới. Không kể lại cơ chế trong
  `concept`, `body` hay `failureModes`.
- Số liệu kịch bản là giả định và phải được ghi là giả định ngay trong field dùng nó
  ("Giả sử …"); không trình bày như số đo hay mặc định của AWS, Vue hay PostgreSQL.

### Căn cứ soạn thảo — năm nguồn nghiên cứu

- Ví dụ giải sẵn và expertise reversal:
  https://mrbartonmaths.com/resourcesnew/8.%20Research/Explicit%20Instruction/The%20Expertise%20Reversal%20Effect.pdf
- Self-explanation: https://link.springer.com/article/10.1007/s10648-018-9434-x
- Liên tưởng phải chỉ ra điểm vỡ:
  http://osu-wams-blogs-uploads.s3.amazonaws.com/blogs.dir/548/files/2010/10/Glynn2008MakingScienceConceptsMeaningful.pdf
- Diagram chỉ hữu ích khi khớp mục tiêu:
  https://oli.cmu.edu/wp-content/uploads/2012/05/Davenport_2008_Framework_For_Designing_Relevant_Representations.pdf
- Retrieval practice:
  https://learninglab.psych.purdue.edu/downloads/2007/2007_Karpicke_Roediger_JEPLMC.pdf

Năm nguồn này là căn cứ cho các nguyên tắc soạn thảo ở trên. **Không trình bày chúng như
bằng chứng đã đo riêng cho Vue hay AWS**: không nguồn nào trong số này đo hiệu quả dạy
học của chính giáo trình này, và không được trích chúng để bảo chứng một khẳng định kỹ
thuật về Vue, AWS hay PostgreSQL.

## Definition of done

0. **Chain fields are mandatory.** Every question carries `incident`, `askFirst`,
   `predict`, `anchor`, `naive`, `rootCause`, `tradeoff`, `alternatives`, `observe`,
   `attacks`, `say30`, `say90`. Every lesson carries the full shape in "Lesson contract"
   above — all 33 keys, plus `stageIntro` where a stage opens and `analogy` on L12 —
   and `build.mjs` fails the build when one
   is missing, empty, over-length or wrong-shaped, so a half-filled object never reaches
   the reader.
1. Your assigned file exists at the exact path.
2. `node -e "new Function(require('fs').readFileSync('<file>','utf8'))"` exits 0.
   Run this on YOUR file only. Do not run the project build or another agent's file.
3. Object count matches the assignment exactly.
4. No placeholder, no TODO, no empty fields, no "trả lời mẫu".

## src/ file map (pinned — the build special-cases `00-meta.js`)

Bundle = every `src/*.js` concatenated in filename order (40 files today). Only
`00-meta.js` may contain http(s) URL literals; every other src file must be URL-free
(no fetch/XHR/WebSocket — the build rejects them). The build also requires
`assets/style.css`, `assets/fonts.css`, `assets/body.html` and, at root,
`lesson-glossary.json`.

| file | owner | must define |
|---|---|---|
| `00-bootstrap.js` | harness | empty containers; never remove |
| `00-meta.js` | meta agent | `SOURCES`, `SOURCE_CHECKED`, `GROUP_INTROS` |
| `05-logic.js` | app agent | `LOGIC` — names/semantics pinned by `tests/smoke.cjs` |
| `10-q-a.js` | question agent, group A | A01–A18 |
| `11-q-b.js` | question agent, group B | B01–B14 |
| `12-q-c.js` | question agent, group C | C01–C13 |
| `13-q-d1.js` | question agent, group D | D01–D07 |
| `13-q-d2.js` | question agent, group D | D08–D14 |
| `14-q-e.js` | question agent, group E | E01–E12 |
| `15-q-f.js` | question agent, group F | F01–F12 |
| `16-q-g.js` | question agent, group G | G01–G18 |
| `17-q-h.js` | question agent, group H | H01–H13 |
| `18-q-i.js` | question agent, group I | I01–I08 |
| `19-q-j.js` | question agent, group J | J01–J12 |
| `21-q-depth.js` | depth agent | no new objects; adds the rendered depth fields to existing ids after every group file has pushed |
| `22-q-jd.js` | meta agent | the JD-specific Vue questions `C14`, `C15` |
| `23-q-aws-ec2.js` | AWS deep-dive agent | `G19` |
| `24-q-aws-alb.js` | AWS deep-dive agent | `G20` |
| `25-q-aws-events.js` | AWS deep-dive agent | `G27` |
| `26-q-aws-sfn.js` | AWS deep-dive agent | `G28` |
| `27-q-aws-cognito.js` | AWS deep-dive agent | `G29` |
| `28-q-aws-dns.js` | AWS deep-dive agent | `G21` |
| `29-q-aws-cache.js` | AWS deep-dive agent | `G22` |
| `30-q-aws-s3-access.js` | AWS deep-dive agent | `G23` |
| `31-q-aws-spa.js` | AWS deep-dive agent | `G24` |
| `32-q-aws-s3-cost.js` | AWS deep-dive agent | `G25` |
| `33-q-aws-s3-events.js` | AWS deep-dive agent | `G26` |
| `35-lessons-aws.js` | lesson agent | `LESSONS` L01–L06 |
| `36-lessons-py.js` | lesson agent | L07–L11 |
| `37-lessons-vue.js` | lesson agent | L12–L17 |
| `38-lessons-link.js` | lesson agent | L18–L22 |
| `39-lessons-security.js` | lesson agent | L23 |
| `41-lessons-deep.js` | lesson agent | L24–L25 |
| `20-quiz.js` | quiz agent | `QUIZ` (25–30 items, several situational) |
| `30-mock.js` | mock agent | `MOCK_SETS` (≥5 sets) |
| `40-plans.js` | plan agent | `STUDY_PLANS` (exactly 3) |
| `50-case.js` | case agent | `CASE_STUDY` (≥12 sections; `sections[].flow` ids must exist in `FLOW_SVGS`) |
| `60-flows.js` | flow agent | `FLOW_SVGS` (≥10 entries, 35 today: `{id, caption, svg}`, inline SVG with `viewBox` and `role="img"`) |
| `90-app.js` | app agent | DOM engine; must no-op when `__BUILD_CHECK__` is truthy |

Lesson files are split by stage group, not by owner convenience: a lesson may only be
written into the file that owns its id range, and `LESSONS.push` order across the six
files must stay L01 → L25.

## Tài liệu cũ — không dùng để authoring

`pen-lesson-experience-prompt-2026-10-23.md`, `pen-lesson-redesign-prompt-2026-10-23.md`,
`pen-lesson-spec.md`, `pen-data-pack*.md` và `pen-design-prompt*.md` là tài liệu thiết kế
cũ (Pencil, ảnh WebP, số ảnh cố định, bố cục sáu section khác). Chúng chỉ còn giá trị
lịch sử: authoring mới theo đúng `CONTRACT.md` này. Nếu một prompt cũ mâu thuẫn với
contract, contract thắng — không sinh lại ảnh, không khôi phục schema cũ.
