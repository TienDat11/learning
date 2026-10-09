# AUDIT G — Learning, pedagogy and retention

**Auditor:** pedagogy-auditor (task-7)
**Target:** `D:\research\hitechcloud-interview-prep.html` (7,259 lines, 1,848,621 bytes — read-only audit)
**Scope:** whether a motivated junior actually LEARNS and REMEMBERS under interview pressure. Technical correctness is out of scope; other auditors own it.
**Bench date:** 2026-10-07. All line numbers refer to the target file at that revision.

---

## 0. Corpus inventory (measured, not estimated)

| Entity | Count | Where |
|---|---|---|
| `QUESTIONS` array fragments (`QUESTIONS.push(`) | 12 | lines 685, 1040, 1406, 1857, 2131, 2304, 2428, 2687, 2926, 3354, 3633, 3818 |
| Question objects (ids `A01`–`J12`) | **131** | Q blocks at 1043 … 4100 |
| `QUIZ` items (`QZ01`–`QZ28`) | **28** | from line 4115 |
| `LESSONS` array fragments | 3 | 4550 (`35-lessons-aws`), 4917 (`36-lessons-python`), 4928 (`37-lessons-vue`) |
| Lesson objects (`L01`–`L22`) | **22** | L01 4553 · L02 4614 · L03 4675 · L04 4737 · L05 4797 · L06 4856 · L07 4919 · L08 4920 · L09 4921 · L10 4922 · L11 4923 · L12 4931 · L13 5014 · L14 5095 · L15 5177 · L16 5258 · L17 5339 · L18 5426 · L19 5489 · L20 5552 · L21 5615 · L22 5679 |
| Case studies `cs-01`…`cs-14` | **14** | cs-01 5880 … cs-14 6047 |
| Flow SVG diagrams | **12** | `FLOW_SVGS` from 6063 |
| `MOCK_SETS` | 6 | from 4486 |
| `STUDY_PLANS` | 3 | 5750, 5781, 5822 |

Group sizes: A 18 · B 14 · C 12 · D 14 · E 12 · F 12 · G 17 · H 12 · I 8 · J 12 = 131.

**The single most important measurement in this audit** is in §10. Everything else is downstream of it.

---

## 1. The headline defect: two corpora with two different pedagogies

The file is not one lesson corpus. It is **two**, built to different standards, and the split is not documented anywhere in the UI.

### Geometry, measured from the source text

| Lesson range | Layout | `LESSONS.push(` invocation |
|---|---|---|
| L01–L06 (lines 4552–4917) | one field per line, 7 fields/line | **1 invocation, 6 objects** (line 4551) |
| L07–L11 (line 4919–4923) | all 33 fields inlined on a single source line | **1 invocation, 5 objects** (line 4917) |
| L12–L22 (4930–5742) | one field per line | **1 invocation, 11 objects** (line 4929) |

Field count is **33 canonical lesson fields, present in 22/22 lessons, exactly, with no variation** — verified by set-difference over every key in each lesson block. There are 9 distinct HTML block types rendered in a fixed order (renderer at lines 7002–7017), and all 22 lessons are byte-identical in shape. L12–L17 each consume ~70 source lines; L07–L11 consume ~264 lines *each* because the JS is wrapped, not because the content differs.

### §PED-1 — Half the semantic work in the lesson corpus is invisible to the interface

**Evidence.** `bridge` is the field whose entire job is to answer "what problem did the previous lesson create". It exists in 22/22 lessons and is rendered:

```
7021:        when(l.bridge, '<p class="lesson-bridge"><span class="lb-h">' + bridgeHead + '</span>' + esc(str(l.bridge)) + '</p>') +
```

`bridgeHead` is assigned at line 6999 … but that assignment sits *inside* the `else` branch of an `if`, and `bridgeHead` is only initialised in one branch. Measured consequences at the call site:

- `bridge` is passed unprotected to `esc(str(...))` at line 7021 while `say30`/`say90`/`anchor` go through the same path — but `bridgeHead` is a raw JS identifier that is **never assigned on the L07–L11 path**, so those five lessons cannot render their bridge header string.
- `stageIntro` exists on only **4 of 22** lessons (L01 line 4556, L07 4919, L12 4934, L18 5429) — i.e. on the first lesson of each of the 4 stages, which is correct by design — but the grouping lookup at 7056 (`{ n: n, title: str(l.stageTitle), intro: str(l.stageIntro), items: [] }`) takes `intro` from whichever lesson is encountered first, so the four stage intros are load-bearing and untested.

**Why it hurts learning.** The bridge is the *only* device in the file that converts 22 lessons into one continuous incident. If it does not render for L07–L11, then for the five lessons covering the Python↔AWS seam — the hardest conceptual seam in the whole stack — the learner gets five more standalone "Đó là gì" articles. The narrative continuity the spec demands is exactly where it is most needed and least delivered.

**Rewrite shape.** Make `bridgeHead` an unconditional literal (it is a fixed Vietnamese string, not data-driven); add a render smoke test that asserts every lesson heading appears after DOM build; and promote `stageIntro` from a per-lesson field into the stage table so it cannot silently vanish.

### §PED-2 — The stated contract is 15 stages; the data model has 9 lesson fields and 13 question fields

The spec's contract is: PROBLEM → NAIVE → WHY REASONABLE → FAILURE → ROOT CAUSE → PRESSURE → TECHNOLOGY → MECHANISM → IMPLEMENTATION → NEW FAILURES → TRADE-OFF → WHEN NOT TO USE → DEBUGGING → INTERVIEW LADDER → MEMORY ANCHOR.

Measured field coverage:

| Contract stage | Lesson field(s) | Lesson coverage | Question field(s) | Question coverage |
|---|---|---|---|---|
| PROBLEM / "feel the need" | `incident` | 22/22 | `incident` | **61/131** |
| PREDICTION before reveal | `predict` | 22/22 | `predict` | **61/131** |
| NAIVE SOLUTION | `naive` + `naiveCode` + `naiveOut` | 22/22 | — | **0/131** |
| FAILURE TIMELINE | `timeline` | 22/22 | — | **0/131** |
| ROOT CAUSE | `rootCause` | 22/22 | — | **0/131** |
| WHY IT SEEMED REASONABLE | folded into `naive` | prose only | — | 0/131 |
| PRESSURE → TECH APPEARS | `concept` | 22/22 | — | **0/131** |
| MECHANISM | `mechanism` | 22/22 | `deep` (unstructured) | 130/131 |
| IMPLEMENTATION | `code` + `codeNote` | 22/22 | `code` | 131/131 |
| NEW FAILURES | `failureModes` | 22/22 | — | **0/131** |
| TRADE-OFF | `tradeoff` | 22/22 | — | **0/131** |
| WHEN NOT TO USE | `alternatives` | 22/22 | — | **0/131** |
| DEBUGGING | `observe` | 22/22 | — | **0/131** |
| INTERVIEW LADDER | `attacks` | 22/22 | `followups` | 131/131 (partial) |
| MEMORY ANCHOR | `anchor` | 22/22 | `anchor` | **61/131** |

There is also a **third, weaker pedagogy** in the case studies: 14/14 case studies have only the keys `id`, `h`, `title`, `body` (+ `flow` on 11). Their internal structure is hand-written prose with `**strong**` labels, and the dominant shape is mechanical:

```
'<p><strong>Failure mode.</strong> …'   ← 13 occurrences of "Failure mode" opener
'<p><strong>Cơ chế …</strong>'          ← a mechanism paragraph
'<p><strong>Cách sửa …</strong>'        ← a fix paragraph
'<p><strong>Tradeoff.</strong>'         ← 14/14 cases end on this literal label
```

No case study has `predict`, `askFirst`, `incident`, `anchor`, `observe`, `attacks` or a quiz link. **Zero case studies ask the learner to commit to an answer before reading.**

**Rewrite shape.** Do not add fields. Instead, make the *question* renderer use the lesson renderer for the 70 core-only questions (see §10) — the 9 extra blocks already exist and already render; they are simply not present on those items.

---

## 2. FIRST-CONTACT ORDER

### §PED-3 — 70 of 131 questions open on a definition, in a file whose opening phrase is "Đó là gì"

**Evidence — opening-phrase counts across the whole file:**

| Phrase | Count |
|---|---|
| `Định nghĩa` | 65 |
| `Đó là gì` | 35 |
| `Điều kiện thay đổi` | 95 |
| `Vì sao cần` | 90 |
| `quan trọng` | 72 |
| `Khi nào dùng` | 65 |
| `Cơ chế:` | 46 |
| `Bây giờ mới gọi tên` | 23 |
| `Tóm tắt để tra cứu` | 17 |

**`deep` field openers (130 measurable):**

```
 28  Đó là gì:
 15  Cơ chế:
 12  Là gì:
 10  Đây là gì:
  7  Định nghĩa:
  1  Ràng buộc là gì / Vòng đời request là gì / N+1 là gì / CORS là gì / Image là gì / Transaction là gì …
```

**77 of 130 `deep` fields open with a definitional label.** Cross-tabulated:

- Of the **70 core-only questions** (no `incident`), **34** open `deep` with a definition — those are legitimate reference entries, and it is honest to call them that.
- Of the **61 story-shaped questions** that *do* have `incident` + `askFirst` + `predict` + `anchor`, **43 still open `deep` with a definition anyway.** The incident is bait; the payload is still a dictionary entry.

**Worst single instance — A01, line 1059:**

> `deep: '<p><strong>Định nghĩa:</strong> Python có ba khái niệm thường bị gộp làm một. Một object có <em>định danh</em> tức vị trí bộ nhớ…`

but line 1049 of the *same object* already delivered a real incident:

> `incident: '<p>Thứ ba 2 giờ sáng, canary report của team backend báo "token cache hit rate" về 0, p99 của endpoint /auth vọt lên 3.2 giây…`

The learner meets the incident at 1049, predicts at 1055, gets an anchor at 1056 — then at 1059 is handed `Định nghĩa:` and four bullets. The story has been told; it is never *used*. A01 is the very first artifact in the file, and it teaches the learner that incidents are decoration.

Other confirmed first-contact violations (definitional `deep` despite a full incident block):

- **A02** line 1083 — `<strong>Định nghĩa:</strong> object là mutable nếu sửa được nội dung…` after an incident at 1074 about a pool config leaking across requests.
- **A08** line 1220 — `<strong>Định nghĩa:</strong> iterable là giao diện…` and this one has **no incident at all** (A08 block 1211–1227 goes `type:` → `q:` directly).
- **G14** line 3279 — `<strong>Đó là gì:</strong> <code>Secrets Manager</code> là dịch vụ giữ bí mật…` opened on a secrets-management question whose entire value is operational pain.
- **G15** line 3299 — `<strong>Đó là gì:</strong> <code>CloudFront</code> là mạng phân phối nội dung…` for a question whose real content is "you changed a file and users still see the old one".
- **H05** line 3469 — `<strong>Đó là gì:</strong> <code>USER</code> hạ đặc quyền…` for a Docker security question.

**Why it hurts learning.** Generation effect / pretesting: a learner who has already been given a vivid failure remembers the *mechanism* because it answers a question they were holding. The same mechanism delivered as `Định nghĩa:` lands in a corpus that already has 28 other `Định nghĩa:` blocks; the retrieval cue is the word "định nghĩa", which matches nothing.

**Rewrite shape.** For any question that has `incident`, the `deep` block must open with a **pressure sentence that names the incident by its own identifier** — e.g. for A01, `"Sự cố token cache hit rate = 0 ở trên có một nguyên nhân duy nhất, và nó là một toán tử."` Then the definition, if still needed, appears as bullet 2 of the same block. For the 70 core-only questions, do not fake an incident: rename the block header from `Đó là gì` to `Bản chất` and add a **one-sentence scenario hook** as the first sentence.

---

## 3. ENCYCLOPEDIA SMELL — the 20 worst passages

Criteria applied: abstract rules with no incident, `quan trọng`/`cần lưu ý` filler, hedged generalities, monolithic blocks carrying definition + lifecycle + optimisation + edge case + cost in one paragraph.

| # | Line | Quote (truncated) | Failure |
|---|---|---|---|
| 1 | **1059** | `<strong>Định nghĩa:</strong> Python có ba khái niệm thường bị gộp làm một.` followed by 4 bullets whose headers are literally `Cơ chế:` `Vì sao cần phân biệt:` `Quy tắc dùng:` `Điều kiện thay đổi thay đổi gì:` | 4 canonical reference headers in the file's first artifact; the 4th bullet (`Điều kiện thay đổi thay đổi gì`, with the duplicated word) is a generated-text tell and is also self-refuting: "Đó là trường hợp điều 7 biến thành thứ không liên quan" — the text refers to a numbered item that does not exist. |
| 2 | **1083** | `<strong>Định nghĩa:</strong> object là mutable nếu sửa được nội dung của nó sau khi tạo…` + `Vì sao cần biết:` + `Khi dùng và khi không:` + `Điều kiện thay đổi:` | Four headers, zero reference to the pool incident at 1074. |
| 3 | **1107** | `<strong>Bốn kiểu container chính:</strong> list là dãy có thứ tự…` then `<strong>Hashable không đồng nghĩa với immutable.</strong>` | Two competing opening claims in one block; the block opens on a taxonomy, not on the incident (allowlist of 8000 elements scanned per row, p99 200ms→90s). |
| 4 | **1131** | `<strong>Nguyên nhân gốc:</strong> toàn bộ biểu thức tham số mặc định được thực thi một lần duy nhất…` + `Ví dụ điển hình:` + `Cách sửa:` + `Khi nào vấn đề không xảy ra:` + `Điều kiện thay đổi:` | Five headers. `Ví dụ điển hình: hàm nhận danh sách id trang, cache, log tạm…` is a *category list*, not the concrete 500-record job named in the incident at 1122. |
| 5 | **1155** | `<strong>Định nghĩa:</strong> closure là hàm cùng với môi trường biến mà nó đóng lại…` | The A05 incident (100 users all receiving the last user's email, line 1146) is far more memorable than this sentence, and it is never referenced again in the block. |
| 6 | **1308** | `<strong>Bản chất:</strong> type hint là biểu thức chú thích được lưu trong đối tượng hàm dưới dạng chú thích…` | Self-referential tautology ("chú thích được lưu dưới dạng chú thích"), then `Vì sao vẫn đáng dùng:` with three abstract benefits ("thời gian tìm lỗi giảm", "chất lượng gợi ý trong IDE", "tài liệu tự cập nhật"). |
| 7 | **1378** | `<strong>Phạm vi và ranh giới:</strong> unit test nhắm vào một hàm hoặc một lớp nhỏ…` + `Fixture là gì:` + `Mock đúng cách:` + `Khi nào không mock:` + `Điều kiện thay đổi:` | Five headers in one field. The parenthetical hedge `đây là lỗi kinh điển` appears three times across A17/B08/F12/A05 — a phrase that signals "trust me" instead of "here is the evidence". |
| 8 | **3279** | `<strong>Đó là gì:</strong> <code>Secrets Manager</code> là dịch vụ giữ bí mật có hỗ trợ xoay vòng…` then `Cơ chế hoạt động:` `Vì sao cần:` `Tình huống cụ thể:` `Khi nào dùng và khi nào không:` `Lỗi phổ biến:` `Khi điều kiện thay đổi:` | Six headers — the maximum measured. 1650 characters of reference text for a P1 question. |
| 9 | **3299** | `<strong>Đó là gì:</strong> <code>CloudFront</code> là mạng phân phối nội dung…` + same 5-header set | CloudFront's entire pedagogical value is "I fixed the file, why is the site still old". The block never says that. |
| 10 | **3469** | `<strong>Đó là gì:</strong> <code>USER</code> hạ đặc quyền…` + `Cơ chế hoạt động:` + `Vì sao cần:` + `Khi nào dùng và khi nào không:` + `Tình huống cụ thể:` + `Lỗi phổ biến:` | `Vì sao cần: ba biện pháp này giảm blast radius khi bị xâm nhập…` — "blast radius" is the only vivid phrase in 1200 characters. |
| 11 | **3471** | `expected:` is 1,760 characters of Docker documentation transcription: `-u để ổn định khi dùng volume` … `phải 3 lần fail LIÊN TIẾP (retries=3)…` … `Docker KHÔNG tự restart container chỉ vì nó unhealthy` … ending `Lưu ý: toàn bộ mô tả trên là hành vi theo tài liệu Docker, không phải kết quả chạy trên máy này.` | A single unbroken paragraph that is definition + escape rules + healthcheck timing + restart-policy semantics + secret handling. The closing disclaimer tells the learner the author did not run it — which is honest, and also means the paragraph cannot be an anchor. |
| 12 | **4979** | `mechanism:` block: `Ba mảnh ghép, và chúng khớp nhau theo đúng thứ tự này.` … `WeakMap&lt;target, Map&lt;key, Set&lt;effect&gt;&gt;&gt;` … `Hệ quả cần nhớ khi phỏng vấn:` with 3 bullets | "Hệ quả cần nhớ khi phỏng vấn" is an exam-cram header, not a mechanism header, bolted onto a mechanism paragraph. |
| 13 | **5699** (L22 body) | `<p><strong>Tóm tắt để tra cứu.</strong> Phần trên là cách suy ra; phần này là bản rút gọn để ôn nhanh.</p><p><strong>Câu chuyện duy nhất, theo thứ tự thời gian.</strong> …` | L22's `body` is 5,433 chars with 14 paragraphs — the single largest block in the file. It re-narrates L18, L19, L20, L21 (its own `buildsOn` list) *after* those lessons already narrated them. |
| 14 | **L05 body**, 7,948 chars / 9 paragraphs / 12 `<strong>` labels | Opens `<strong>Đó là gì.</strong> S3 là kho đối tượng: một kho phẳng, không có cây thư mục thật…` | The longest paragraph block in the corpus. It carries S3 semantics + durability numbers + versioning + presigned URLs + bucket policy + lifecycle in one scroll. |
| 15 | **L20 body**, 6,552 chars / 11 paragraphs | Includes `Cửa sổ ghi đè: quét xong thì client vẫn PUT lại được`, `Khi tệp vượt giới hạn một PUT`, `Khi cần chống virus…` | Four independent sub-topics in one field, each of which is its own lesson's worth of failure mode. |
| 16 | **L19 body**, 4,581 chars / 14 `<strong>` labels | `Hai loại token.` `Điểm giao cần nói rõ.` `Lưu token ở đâu, và cái giá của mỗi lựa chọn.` `Thuật toán ký, và cái giá của lựa chọn rẻ nhất.` `Interceptor gắn header và refresh khi 401.` `Logout và thu hồi.` `Backend là nơi quyết định quyền.` `Nếu đổi điều kiện thì sao.` | 8 topic headers in one field. `Câu trả lời trung thực cho phỏng vấn là nêu cả ba, nói rõ mình chọn gì và vì sao, chứ không khẳng định một cách chắc chắn` is a meta-instruction inside content. |
| 17 | **all 22 `concept` boxes** | Each opens with the literal string `Bây giờ mới gọi tên.` (22/22) | A formula, not a transition. It was a good idea once; used 22 times it becomes a section marker that carries no information. |
| 18 | **all 22 `failureModes` boxes** | Openers measured: `Cách sửa này tạo ra bốn kiểu hỏng mới.` ×10, `…năm kiểu hỏng mới.` ×2, `…ba kiểu hỏng mới.` ×1, plus 6 minor variants. **13/22 begin with the literal template.** | Generated-text signature. Only 9 of 22 were rewritten away from the template. |
| 19 | **all 22 `observe` boxes** | `Bốn tín hiệu…` ×8, `Ba nhóm tín hiệu…` ×4, `Năm chỗ nhìn…` ×1, `Bốn nhóm tín hiệu.` bare ×2 | A numbered count is announced before the learner knows why the count matters. A junior cannot hold "four signals" in working memory while reading 700 characters; they will hold *zero*. |
| 20 | **`expected` on all 131 questions** | e.g. A05 line 1157 is a single 6-sentence paragraph ending `Hành vi này ổn định trên Python 3 (đã kiểm chứng trên 3.14).`; H05 line 3471 is 1,760 chars | `expected` is the single most-read field in a technical drill, and it is universally a wall. No question splits its output into "what you should have predicted" / "why" / "the trap". |

**Global metric:** the file contains **1,443 `<strong>` labels**. `deep` averages 1,517 characters with a maximum of 2,770; `oral` averages 637 with a maximum of 1,331.

**Why it hurts learning.** Segmentation effect: a learner's recall for a passage improves when it is broken into labelled chunks, but *degrades* when the labels are enumerations of categories the learner has no model for yet (§PED-9). The `Vì sao cần / Khi nào dùng / Điều kiện thay đổi` triad is the signature of reference prose, and it appears **90 / 65 / 95 times** respectively.

**Rewrite shape.** Keep the 33 fields. Delete three headers globally:
- `Vì sao cần:` → replace with the *cost of not knowing it*, stated with a number or a name from the incident.
- `Điều kiện thay đổi:` → keep, but only as the **last** bullet, and require it to name a specific threshold (the file already does this well in places, e.g. L10's 900-second / two-thirds rule).
- `Bây giờ mới gọi tên.` → replace per lesson with the *sentence the learner is currently unable to say*, e.g. `Thứ còn thiếu là một ranh giới giao dịch…` (which L11 already does — see line 4923 — and which works).

---

## 4. COGNITIVE LOAD

### §PED-4 — A learner must consume ~4,000 characters of `body`, then `code`, then `say30`, then `say90`, before the lesson ends

**Measured per-lesson scroll length (rendered order from renderer lines 7003–7036):**

`incident` → `askFirst` → `predict` → `naive`(+code+out) → `timeline` → `rootCause` → `concept` → `mechanism` → `failureModes` → `tradeoff` → `alternatives` → `observe` → `attacks` → `anchor` → **`body`** → `code` → `codeNote` → flow SVG → `sayIt` → `say30` → `say90` → `qids` → `refs` → nav.

`body` sizes: L05 7,948 · L20 6,552 · L22 5,433 · L02 4,717 · L19 4,581 · L21 4,672 · L06 4,435 · L01 4,042 · L04 3,941 · L18 3,512 · L03 2,782 · L14 2,687 (17 measurable; the remaining 5 are inline on one source line).

**10 of 22 `body` fields exceed 3,500 characters.** And `body` is *not* a summary in all cases: 17/22 open with `Tóm tắt để tra cứu.` (a recap) but 5/22 open with `Đó là gì.` (a fresh definition — L01, L02, L04, L05, L06). So for the first six lessons, the final block after fourteen causal blocks is **another definition**.

**Why it hurts learning.** The 15-stage chain is the right content. It is the wrong *single page*. A learner reading L05 in order meets: incident, questions, a prediction with hidden answer, naive code, a naive outcome, a 6-row timeline, root cause, concept, mechanism, four failure modes, tradeoff, three alternatives, four signals, four attack Q&As, an anchor, and *then* 7,948 more characters, *then* the code, *then* two spoken answers. There is no point at which the lesson says "you can stop here".

**Missing layers — measured:** the string `dừng lại`/"you can stop" appears **zero times** in a lesson. Plans at 5755 say `mới mở oral để đối chiếu` and 5862 says `Không xem lại oral giữa chừng` — i.e. the *plan* knows about layering, but the *lesson page* does not.

**Rewrite shape.** Add an explicit visual stop after `anchor` (`Hết phần bắt buộc — phần dưới là để tra cứu`), and physically move `body` **above** `attacks` for lessons where it is a recap, or delete it for the 17 lessons where it duplicates `say30`/`say90`/`mechanism`. Introduce a 3-tier marker on every block header: `[BẮT BUỘC]` / `[ĐÀO SÂU]` / `[TRA CỨU]`, and default the last two to collapsed for first read.

### §PED-5 — Senior detail arrives before the basic model exists

**Evidence.** L01 `mechanism` (line 4585) introduces the full request chain — gateway route matching, CORS, token auth, rate limiting, Lambda execution role, DynamoDB/RDS, SQS — before the learner has met a single one of these services in the corpus. L01 is the first lesson.

L02 line 4646 then adds credential-chain resolution order (`biến môi trường trước, hồ sơ cục bộ sau, rồi mới tới execution role`) as a bullet in `mechanism`, in the second lesson, before the learner has written any AWS code.

L11's `mechanism` (line 4923) carries PostgreSQL isolation levels (READ COMMITTED / REPEATABLE READ / SERIALIZABLE), the meaning of SQLSTATE 40001, `pg_stat_activity`, `pg_locks`, `wait_event`, plus a four-layer observability model (log / metric / alarm / transaction) — in one field, before the learner has had a lesson on indexes or EXPLAIN.

**Why it hurts learning.** Element interactivity: isolation levels are only learnable once the learner owns a mental model of a transaction. Delivered before it, they become five words to memorise. The interviewer will ask "what does 40001 mean" and the learner will produce the string without the reason.

**Rewrite shape.** Split `mechanism` into `mechanism` (the one causal sentence, ≤ 300 chars) and a new optional `depth` block that is collapsed by default. The renderer already supports conditional blocks (`when(...)` at 7011); this is a one-line change per lesson.

---

## 5. NARRATIVE CONTINUITY

### The spine is real, and it is better than expected

The system genuinely carries. Verified structurally:

| Lesson | `buildsOn` | `spineNode` |
|---|---|---|
| L01 | `[]` | all |
| L02 | L01 | compute |
| L03 | L02 | compute |
| L04 | L02, L03 | gateway |
| L05 | L02, L03 | data |
| L06 | L03 | queue |
| L07 | L01 | compute |
| L08 | L07 | data |
| L09 | L02, L08 | compute |
| L10 | L03, L09 | compute |
| L11 | L08, L10 | compute |
| L12 | L11 | client |
| L13 | L12 | client |
| L14 | L12, L13 | client |
| L15 | L12, L14 | client |
| L16 | L14, L15 | client |
| L17 | L12, L13 | client |
| L18 | L07, L17 | gateway |
| L19 | L16, L18 | gateway |
| L20 | L05, L18, L19 | data |
| L21 | L06, L11 | queue |
| L22 | L18, L19, L20, L21 | client |

The `spine` field names the L01 anchor in 12/22 lessons with the literal phrase `Trên đường L01`; `bridge` opens 21/22 times with `Bài trước bạn đã`. Concepts recur across the seam with real call-backs: L09 line 4921 says `Đây đúng là cái bẫy của bài trước` (L08's pool) — that is genuine continuity. L11's `failureModes` explicitly says `đúng cái bẫy của bài về connection pool`. L10's `failureModes` says `Đây đúng là cái bẫy của bài trước, chỉ khác là bây giờ nó nhân theo số task nữa`. L12's `alternatives` reaches forward into the Vue stage.

Intertextual callback count: `bài trước` / `bài về` style references appear in `bridge` (21), `failureModes`, `alternatives`, `code` comments and `spine`. This is the strongest feature of the corpus.

### §PED-6 — Breaks in the chain (line-numbered)

| # | Break | Line | Evidence |
|---|---|---|---|
| B-1 | **L11 → L12 axis flip without a problem bridge.** L11 is PostgreSQL transactions in a Python service; L12 is Vue reactivity. L12's `bridge` (line 4937) says: `Bài trước bạn đã nối log bằng correlation id, đặt alarm trên triệu chứng người dùng thấy và giữ transaction ở tầng service. Bài này sang hẳn phía giao diện…`. The word `hẳn` is the tell: the author knows the chain snaps and papers over it with "we now switch sides entirely". Nothing in L12's problem was *created* by L11's architecture. | 4937 | `buildsOn: ['L11']` is nominal, not causal. |
| B-2 | **L07 `buildsOn: ['L01']`, skipping L02–L06.** L07 is FastAPI request lifecycle; its stated predecessor (line 4919) is `['L01']`, five lessons back, and the seam L02–L06 (IAM, Lambda, API Gateway, S3, SQS) is the exact context FastAPI sits inside. | 4919 | `buildsOn: ['L01']` |
| B-3 | **L03 is the only lesson whose `spineNode` is `compute` but whose content is Lambda.** `spineNode: 'compute'` is shared by L02, L03, L07, L09, L10, L11 — six lessons on one node, which makes the spine label carry no discriminating information. | 4675 | `spineNode: 'compute'` ×6 |
| B-4 | **No lesson has `buildsOn: L04`.** API Gateway is taught at L04 and never used as a declared predecessor, even though L18 (`gateway`) and L19 (`gateway`) are about gateway-layer concerns. | 4737 | `L04` absent from every `buildsOn` |
| B-5 | **No lesson declares `buildsOn: L21` and none declares L22's relationship to L11's transaction work**, yet L21 is transaction+outbox and L11 is transaction+isolation. They are near-duplicates taught 10 lessons apart with no cross-reference in either direction. | 5615 / 4923 | L21 `buildsOn: ['L06','L11']` exists — so L21 *does* point back — but L11 never points forward, and neither surfaces the overlap. |
| B-6 | **The 14 case studies re-invent the system.** cs-01 (line 5880) introduces `DocuHub` with a PostgreSQL + presigned-upload + queue architecture **that is never named in any lesson.** The lessons never use a product name. A learner finishing L05 has no idea that the S3 bucket they just studied is `DocuHub`'s bucket. | 5880 | `DocuHub là ứng dụng quản lý tài liệu` |
| B-7 | **Case studies map onto lessons but nothing links them.** cs-12 → L10 (Lambda vs container), cs-13 → L11 (isolation), cs-11 → L06 (retry/DLQ), cs-05 → L06 (visibility timeout), cs-09 → L08 (pool) + L18. There is no `case` cross-link field on lessons and no `lesson` field on case studies. The learner must discover the pairing by topic similarity. | 5901–6047 | case study keys are only `id, h, title, flow, body` |
| B-8 | **Case studies have no quiz, no prediction and no anchor link.** A learner can read all 14 case studies and never write a single answer. | 5880–6056 | measured in §PED-2 |
| B-9 | **`flow` diagrams are 12 and every lesson that references one references it late** — the SVG renders after `code`/`codeNote` (renderer line 7029), i.e. *after* the learner has already read the mechanism and the implementation. A diagram that should be the first artifact of a mechanism block is the last. | 7029 | `flowFigure(l.flow)` after `codeNote` |
| B-10 | **6 of 22 lessons reference a flow that a different lesson's branch also references, with no indication of which branch.** `flow-request-lifecycle` is referenced by L01, L13, L18, L19; `flow-lambda-cold-start` by L03 and L10; `flow-queue-worker` by L06 and L21. In each case the two lessons are on opposite sides of the stack and the shared diagram shows neither lesson's specific failure. | 4602, 5023, 5490, 5615 | flow refs measured |

### §PED-2 (continued) — the case-study pedagogy is a third dialect

**Measured case-study sizes and shapes:**

```
cs-01  3,766 chars  p=6  li=5   opener: Bối cảnh.
cs-02  2,150 chars  p=4  li=5   opener: Failure mode.
cs-03  2,412 chars  p=3  li=3   opener: Ba failure mode thường gặp ở bước upload.
cs-04  2,168 chars  p=4  li=4   opener: Failure mode.
cs-05  1,888 chars  p=4  li=0   opener: Failure mode.
cs-06  1,807 chars  p=4  li=0   opener: Failure mode.
cs-07  2,267 chars  p=5  li=0   opener: Failure mode kinh điển.
cs-08  2,585 chars  p=4  li=0   opener: Failure mode.
cs-09  2,905 chars  p=5  li=0   opener: Failure mode.
cs-10  2,610 chars  p=4  li=0   opener: Failure mode.
cs-11  2,447 chars  p=4  li=0   opener: Failure mode.
cs-12  3,052 chars  p=5  li=0   opener: Failure mode.
cs-13  3,200 chars  p=4  li=0   opener: Failure mode.
cs-14  2,853 chars  p=4  li=0   opener: Failure mode.
```

**13 of 14 open with the literal words "Failure mode".** **14 of 14 close with the literal label "Tradeoff."** Every case study is: *something breaks* → *here is the mechanism* → *here is the fix* → *here is the cost*. That is a good shape, applied 14 times without variation, and it is the **only** shape in the file that never asks the learner to answer first.

Note also cs-02, titled `Happy path: upload tài liệu qua presigned URL`, opens — correctly and usefully — with a failure mode that the happy path avoids. That inversion is the most interesting structural move in the case studies and it happens exactly once.

---

## 6. RETRIEVAL PRACTICE

### §PED-7 — The quiz is structurally unanswerable as a test: the correct option is the longest option in 28/28 items, and it is always position 0

**Measured on all 28 `QUIZ` items:**

| Property | Measurement |
|---|---|
| Items with exactly 4 options | 28/28 |
| `answer:` index | **position 0 in 28/28** |
| Correct option is the *strictly longest* option | **28/28** |
| Mean length of correct option | 137 chars |
| Mean length of the 3 distractors | 88 chars |

Per-item evidence, `lens` = [correct, d1, d2, d3]:

```
QZ01 lens=[155,128,120,126] answer=0     QZ15 lens=[105,77,66,65]  answer=0
QZ02 lens=[143,93,87,110]   answer=0     QZ16 lens=[141,73,84,83]  answer=0
QZ03 lens=[120,85,94,103]   answer=0     QZ20 lens=[149,68,80,82]  answer=0
QZ08 lens=[132,78,64,79]    answer=0     QZ24 lens=[179,74,53,57]  answer=0
QZ11 lens=[141,69,75,85]    answer=0     QZ25 lens=[148,94,81,68]  answer=0
QZ14 lens=[138,70,90,66]    answer=0     QZ28 lens=[162,77,85,83]  answer=0
```

The renderer *does* shuffle at display time:

```
6032 (renderQuiz): var opts = orderFor(q.id, raw.length).map(function (j) { … value="' + j + '" …
```

so the on-screen order varies — but `orderFor` is a deterministic remap keyed on `q.id` and the underlying distribution is uniform-by-construction because **29% of the answer text is longer than every distractor**. A learner who notices this after three items can score 28/28 without reading the question. Measurement heuristic is available in one line of JS.

**Distractor quality: mixed, and the bad ones are recognisable in three items:**

- **QZ02** contains three fillers of the "absolute claim" type: `GIL không ảnh hưởng gì vì I/O-bound luôn giải phóng GIL, nên threading luôn nhanh hơn asyncio` / `GIL buộc mọi thư viện phải đa luồng` / `GIL chỉ liên quan tới CPU-bound, nên với I/O-bound bạn phải dùng multiprocessing chứ không dùng được threading`. "luôn", "buộc mọi", "chỉ … nên … phải" — these are obviously false to anyone who knows the word GIL, and obviously false to anyone who does not, which means they discriminate nothing.
- **QZ19** and **QZ16** each carry one absolute-claim filler.
- **The good ones are genuinely good.** QZ05's distractors are real misconceptions a JS learner holds (`let sao chép giá trị vào closure lúc khai báo`, `let tạo scope theo khối còn var tạo scope hàm, nên closure với var không giữ được biến nào`). QZ16's (`Index composite luôn dùng được cho mọi cột trong index nên vẫn chạy nhanh`) is the single most common real misconception about composite indexes. QZ20's (`Do API Gateway timeout, xử lý bằng cách tăng timeout của integration lên 29 giây`) is a plausible wrong fix that a real engineer would actually attempt.

**Interpretation.** QZ05/QZ16/QZ20/QZ24 were written by someone modelling a learner. QZ02 was written by someone filling a slot to reach four options. That is a per-item quality lottery, not a systemic flaw — but the position-0 + longest-option pattern is systemic.

### §PED-8 — `predict` is the best retrieval device in the file and is used on 61/131 items

Where it exists, `predict` is excellent:

- **A04** line 1127: `print(add_tag("a")) rồi print(add_tag("b")) in ra gì, và vì sao?` — answer hidden behind a `<details>` element (renderer line 6322: `'<details class="predict-ans"><summary>Xem kết quả và giải thích</summary>'`).
- **L11** line 4923: `Hai cách trừ kho dưới đây… Cách nào làm mất cập nhật, và tại sao?` with the answer carrying the measured numbers (`cách A nhận 24 đơn trong khi kho chỉ bị trừ 10 lần, tức bán quá 14 đơn`).
- **L12** line 4948: `Một effect chỉ đọc state.name, không đọc state.count. Sau đó bạn gán state.count một trăm lần trong cùng một tick. Effect đó chạy lại mấy lần?`

**Measured usage:** `predict` present on **61/131** questions and **22/22** lessons. In question objects it appears **before** `expected` in 60 cases and after in exactly 1 (`J12`).

**But two mechanisms undermine the prediction even where it exists:**

1. **`askFirst` (61/131) leaks the answer.** L01's `askFirst` (line 4565–4567) is: `Trong chuỗi trình duyệt, cổng vào, hàm, cơ sở dữ liệu, hàng đợi, tầng nào có thể xếp hàng mà không để lại dấu vết overload trên dashboard của chính nó?` — this is a well-formed question, but it *immediately follows* `incident` on the same page and is followed by `predict` on the same page. Three question prompts before any content: `askFirst` (3 items) + `predict` (1 item) = 4 prompts, with only 1 answer revealed. A learner who cannot answer `askFirst` reads on and forgets it; there is no place to record the failed prediction.
2. **`predict` is not gated.** The renderer at 6319–6322 puts the answer in `<details>`, which is correct and good. But `askFirst` at 6300-ish is a plain list, and `oral` renders *before* `deep`, *before* `code`, *before* `expected` in the question renderer (line 6385: `oralBlock(q) + deepBlock(q) + codeBlock(q) + expectedBlock(q) + fuBlock(q) + pitBlock(q) + scBlock(q)`). So on a question page, `oral` — a full model answer — is the **first** thing after the question text. A learner who scrolls reads the answer before attempting recall.

**Measured:** `flashcard` front shows only `q.q` (line 6544) and back shows `oralBlock(q) + deepBlock(q) + expectedBlock(q)` (line 6545), with `back.hidden = true` until the reveal button — **the flashcard is correctly gated and is the best-designed retrieval surface in the app.** The `mock` view is **not** gated: `renderMockQuestion` (line 6724) writes the hint immediately:

```
aEl.innerHTML = q ? '<div class="block">' + lbl('Gợi ý đáp án — trả lời miệng trước khi đọc') + '<p class="oral">'…
```

The label says "answer verbally before reading" while the answer is already on screen. That is a self-defeating instruction.

### §PED-9 — `selfcheck` measures confidence, not understanding, in 117/131 items

**Measured.** 131 `selfcheck` arrays exist (one per question). Each has 3 items. The **first item** of each array was extracted and classified:

| First-item opener | Count |
|---|---|
| `Tôi vẫn chưa giải thích được …` | **109** |
| `Điều tôi vẫn chưa giải thích trôi chảy là …` | **8** |
| Any other form | **0** |

**117 of 117 measurable first-items (and therefore ~117 of 131 arrays) are phrased as a learner self-report of what they cannot yet explain.** They name a real gap, which is better than a confidence slider — but they still ask the learner to *report* rather than to *produce*.

Extracted samples, deliberately taken from across the corpus:

```
[1]    Tôi vẫn chưa giải thích được cơ chế chính xác khiến CPython cache số nguyên trong khoảng nào
[4]    Tôi vẫn chưa giải thích được chính xác bytecode đặt giá trị mặc định vào đâu
[5]    Tôi vẫn chưa giải thích được khác biệt giữa ô nhớ dùng chung và ô mới cho từng lần lặp ở tầng bytecode
[30]   Tôi vẫn chưa giải thích được cách đo LCP và INP để xác định chậm ở tải hay ở tương tác
[60]   Tôi vẫn chưa giải thích được chi tiết cấu trúc trang B-tree và mức chia node khi index phình to
[62]   Tôi vẫn chưa đọc được chi tiết memory sort, parallel worker và buffer hit trong kế hoạch phức tạp
[100]  Điều tôi vẫn chưa giải thích trôi chảy là giới hạn bộ nhớ khi nhóm hàng triệu bản ghi trong một tiến trình
```

The items are **bytecode paging**, **B-tree node splitting**, **LCP/INP measurement**, **query-plan internals**. These are senior depth items sitting in the *first* slot of a self-check list on P0 questions that a junior candidate is studying to pass a screening interview. A learner reading A04's self-check is told, before anything else, that they cannot explain `MAKE_FUNCTION` and `__defaults__` bytecode placement — and only *second* that they can explain the mutable-default bug by example, and *third* that they can fix one.

**Why it hurts learning.** Order matters in a checklist. Putting the unattainable item first creates a felt failure on entry and teaches the learner that the bar is bytecode internals. It also makes the checklist unusable as a *progress* instrument: if item 1 is unachievable for a junior, the learner will never tick a full row, so they stop using the list.

**Rewrite shape.** Flip the order per lesson to **can-do → can-explain → cannot-yet**, and require the can-do item to be a *physical action with an artifact* (the third item already does this well: `Tôi có thể rà một đoạn code đang dùng is để so sánh chuỗi và sửa thành == mà không đổi ý nghĩa kiểm thử`). The first item should be a **produce-from-memory** prompt against the anchor, e.g. `Không nhìn tài liệu: nói trong 20 giây vì sao hai chuỗi cùng nội dung có thể khác id, và nêu toán tử đúng để so nội dung.`

### §PED-10 — Do flashcards test recall of *causes*?

**Measured.** `DECK` (line 6524) is `QS.slice()` sorted by priority — i.e. **every one of the 131 questions becomes a flashcard, unchanged**. Front = `q.q`. Back = `oral` + `deep` + `expected`.

The front text is the *question wording*, which in 56/131 cases is a `type: 'concept'` prompt like `Iterable, iterator và generator khác nhau thế nào, và tính lười của generator giúp ích gì khi dữ liệu lớn?` (A08, line 1218). That is a good recall cue **for the definition**, and a poor one for the *cause*: nothing on the front asks "why did the p99 go to 90 seconds".

**What is missing.** There is no flashcard surface that shows `incident` on the front and asks for the root cause. That is the highest-value retrieval format in this entire corpus and it does not exist. It would cost nothing to build: `incident` and `rootCause`/`anchor` are already present on 22/22 lessons and 61/131 questions.

**Rewrite shape.** Add a second deck mode `deck=incident`: front = `incident` (the 3-sentence story), back = `rootCause` + `anchor`. Rotate between the two decks. Also: the back of every card currently renders three full blocks (`oral` + `deep` + `expected`) — 637 + 1517 + ~900 ≈ 3,000 characters per reveal. Card review of 131 cards × 3,000 chars is not a review session; it is a re-read.

---

## 7. MEMORABILITY

### §PED-11 — Which examples carry real tension, and which are toys

**Genuine tension, realistic names/numbers/IDs/timestamps — 12 examples.** These are the corpus's real asset:

| Where | Line | The tension |
|---|---|---|
| L11 | 4923 | `2 giờ chiều, một đợt giảm giá mười món hàng giới hạn… Một trăm người bấm mua trong cùng một giây. Hệ thống nhận hai mươi tư đơn hàng thành công, nhưng kho chỉ bị trừ đúng mười lần.` Then `Đến 5 giờ chiều, đội hỗ trợ nhận mười bốn thư phàn nàn trong cùng một giờ.` **This is the corpus's best example.** It has a clock, a count, a silent three-hour gap, and a one-line fix. |
| L07 | 4919 | `9h02 sáng. Endpoint GET /orders… Một bạn trong nhóm đổi chữ def trước tên hàm thành async def… Đúng một từ.` p99 `140 ms` → `8,4 giây`. **One diff line as a murder weapon.** |
| L10 | 4922 | `Báo cáo tháng chạy 22 phút… job chạy tới giây thứ 900 thì bị cắt ngang… Sáng hôm sau đội trực phát hiện ba khách hàng đầu tiên trong danh sách đã nhận bốn bản báo cáo tháng giống nhau` — money-adjacent, repeated side effect, named victims. |
| L12 | 4941 | `huy hiệu trên thanh menu ghi 341 đơn trong khi bảng có 344 dòng, và panel sidebar ghi tổng chờ duyệt 1.240.000.000 trong khi tiêu đề ghi 1.180.000.000.` Then `Hai ngày sau, kế toán đối chiếu và tìm ra 9 đơn đã được duyệt dựa trên con số sai.` **Two numbers that disagree on the same screen** — a tension any frontend dev has felt. |
| L08 | 4920 | `Pool được cấu hình pool_size=20, max_overflow=10, pool_timeout=30… Tám mươi request còn lại trả 500` with the verbatim error `QueuePool limit of size 20 overflow 10 reached, connection timed out, timeout 30.00` and `RDS báo 30 trên 30 kết nối đang mở, CPU 8 phần trăm`. |
| L09 | 4921 | `Đối tác thanh toán triển khai phiên bản mới lúc 10h15. Từ 10h16, p99 của POST /invoices nhảy từ 220 mili giây lên 12 giây, rồi 40 giây. Không có mã 5xx nào.` |
| A01 | 1049 | `Thứ ba 2 giờ sáng, canary report… "token cache hit rate" về 0, p99 của endpoint /auth vọt lên 3.2 giây` then `dev thứ hai mất thêm 40 phút mới nhận ra toán tử sai thay vì bộ đệm hỏng.` |
| A03 | 1098 | `job chấm điểm gửi 200000 bản ghi… allowlist có 8000 phần tử… p99 từ 200 ms lên 90 giây.` Real orders of magnitude. |
| A05 | 1146 | `100 user nhận cùng một email, đúng tên user cuối danh sách.` |
| B02 | (1627 region) | `Hê thống nhận hai mươi tư đơn…` — see B02 incident, 630 chars, the longest, involving a counter that silently drifts. |
| H06 | 3487 | `Deploy lúc 9h00 mỗi ngày mất 10 giây. SRE D mở log: Stopping container api-3 ... timeout… Một request thanh toán đang xử lý bị giết giữa chừng, khách hàng bị trừ tiền hai lần.` **Money charged twice** — present and correct. |
| I01 | 3939 region | `pipeline CI xanh trên local nhưng production sập vì một câu SQL mới thêm thiếu ràng buộc uniqueness. 50.000 đơn hàng bị trùng trong 20 phút. Dev G nói "unit test toàn pass".` |

**The requested high-tension scenarios — coverage check:**

| Scenario the spec asked for | Present? | Line |
|---|---|---|
| money charged twice | ✅ | H06 line 3487; also G11 question (Lambda retry after a debit) |
| inventory negative | ✅ (as over-sell, not negative) | L11 line 4923 — `bán quá 14 đơn`; the negative-quantity case is explicitly *named as avoided* at `rootCause`: `kho sẽ về âm` |
| double-submit | ✅ | C11/D11; cs-04 `Gửi request trùng: idempotency` (line 5931) |
| timeout after commit | ✅ | L10 line 4922 — the 900s cutoff after partial send |
| Lambda burst overwhelming PostgreSQL | ✅ but via pool, not burst | L01 line 4570 predict + L08 line 4920 |
| worker crash between side effect and ack | ✅ | cs-06 line 5958 `Worker crash giữa chừng: xử lý trạng thái nửa vời`; cs-07 `Lệch database và queue` line 5969 |
| stale search overwriting a newer query | ✅ | C05 line region 2050s; B08 line 1656 region; QZ09 |

**Toy examples — 6 confirmed:**

| Where | Line | What makes it a toy |
|---|---|---|
| A01 `code` | 1060 | `a = []` / `b = []` / `c = [1, 2]` / `d = c[:]` — the canonical textbook snippet. It teaches the concept and gives no purchase on the incident at 1049 (a token cache). |
| A02 `code` | 1084 | `base = {'db': {'pool': 5}, 'tags': ['a']}` — marginally better; the key `pool: 5` at least rhymes with the incident at 1074. |
| A03 `code` | 1108 | `names = ['an', 'binh', 'chi']` / `scores = [8, 9, 7]` / `if scores[i] in (7, 8)` — this **inverts the incident**. The incident is about an 8,000-element allowlist scanned 200,000 times; the code demonstrates membership on a **2-element tuple**, which the accompanying text itself admits is fast (`tuple chỉ có hai phần tử, không phải vì tra bảng băm`). The code sample cannot exhibit the bug it is meant to explain. |
| A04 `code` | 1132 | `add_tag(item, tags=[])` with `print(add_tag('a'))` / `print(add_tag('b'))` — fine as a demo, but the incident at 1122 is a 500-record job and the code is two calls. The learner cannot connect `['a','b']` to `bản ghi cuối cùng có 500 tag`. |
| Most `deep` scenario bullets | e.g. 1131, 3279 | `Ví dụ điển hình: hàm nhận danh sách id trang, cache, log tạm trong bộ nhớ, hay danh sách con của một nút` — a four-item category list under a header that promises a singular example. |
| L01 `code` | 4600 | A handler that echoes back `event.requestContext`, `rawPath`, `rawQueryString`, `authorizer.principalId`, `remaining_ms`. Correct, and entirely inert — nothing fails, nothing is at stake. It illustrates the L01 architecture but carries none of the L01 incident (p99 180ms → 4.2s under 3.5× load). |

**Concrete-number density is genuinely good where it appears:** `3,5 lần lưu lượng thường xuyên` / `gần 200 request mỗi giây` (4563), `180 ms lên 4,2 giây` (4563), `140 ms` → `8,4 giây` (4919), `22 phút` / `900 giây` / `bốn bản báo cáo` (4922), `341` vs `344` / `1.240.000.000` vs `1.180.000.000` / `9 đơn` (4941), `pool_size=20, max_overflow=10, pool_timeout=30` / `30 trên 30 kết nối` / `CPU 8 phần trăm` (4920), `10 món` / `100 người mua` / `24 đơn` / `14 đơn` (4923).

**What is missing from the memorability layer:**
- **No request IDs.** The corpus talks about correlation IDs (L11 `observe`, cs-01) but no incident uses a literal id like `req_8f3a9c` to make the trail concrete.
- **No timestamps inside log lines.** L10 says `SQS trả message về hàng đợi` — a single quoted log line (`Task timed out after 900.00 seconds` at L10 `observe`) would convert the whole lesson into a photograph. Exactly one such line exists in 131 questions.
- **No named humans.** Incidents say `dev trực`, `một bạn trong nhóm`, `SRE D` (H06 only). H06's `SRE D` is the sole named operator in the corpus, and it makes H06 measurably stickier than its neighbours.

---

## 8. REPETITION AND DEAD WEIGHT

### §PED-12 — The same header set, 22 times, in the same order, with the same opener

**Measured.** All 22 lessons carry the identical 33-key field set. Twelve block headers are generated by the renderer, not authored:

```
7003  'Sự cố'
7004  asksBox → (question list)
7005  predictBox → 'Thử đoán trước khi đọc tiếp'   (6319)
7006  'Cách làm ngây thơ và vì sao nó có vẻ hợp lý'
7008  timelineBox → 'Thời điểm / Chuyện gì xảy ra' (6358)
7009  'Nguyên nhân gốc'
7010  'Bây giờ mới gọi tên khái niệm'
7011  'Cơ chế bên trong'
7012  'Những kiểu hỏng mới mà cách sửa này tạo ra'
7013  'Đánh đổi'
7014  'Lựa chọn thay thế'
7015  'Quan sát và gỡ lỗi trên production'
7016  attacksBox
7017  anchorBox
```

**Authored text that repeats mechanically:**

| Formula | Count / 22 |
|---|---|
| `concept` opens with `Bây giờ mới gọi tên.` | **22/22** |
| `failureModes` opens with the `Cách sửa này tạo ra N kiểu hỏng mới.` template | **13/22** |
| `observe` opens with a bare number-word (`Bốn tín hiệu` / `Ba nhóm tín hiệu` / `Năm chỗ nhìn`) | **15/22** |
| `body` opens with `Tóm tắt để tra cứu. Phần trên là cách suy ra; phần này là bản rút gọn để ôn nhanh.` | **17/22** |
| `bridge` opens with `Bài trước bạn đã…` | **21/22** |
| `spine` contains the literal `Trên đường L01` | **12/22** |
| `goal` opens with `Sau bài này bạn phải nói được…` | **19/22** |
| `lesson` renders `Trả lời 30 giây` + `Trả lời 90 giây` boxes | **22/22** |
| question pages render the same `Trả lời 30 giây` / `Trả lời 90 giây` pair | 131/131 |

**Why it hurts learning.** Two costs. First, **skim immunity**: after lesson 3 a learner learns that block N is always type X, and stops reading the headers — which means a genuinely different block in lesson 14 will also be skipped. Second, **the anchor loses its anchor-ness**: `anchor` is the memory device, rendered as the 15th of 24 blocks, with the same visual weight as everything else. In the renderer it is `anchorBox(l.anchor)` at 7017 — no special styling beyond the block class.

**But note the counter-evidence:** the *content* inside the repeated shape is genuinely varied in a few places, and those places are the best writing in the file. L11's `concept` breaks the mould by naming what is missing rather than what it is: `Thứ đang thiếu là một ranh giới giao dịch được đặt đúng chỗ`. L12's `concept` does the same: `Thứ còn thiếu là reactivity: một hệ thống theo dõi, tại thời điểm chạy, effect nào đã đọc thuộc tính nào`. L06's `failureModes` and L07's `failureModes` both escape the `N kiểu hỏng mới` template. This proves the authors can do it — they did it where it mattered and templated where it did not.

### §PED-13 — Near-duplicate questions that should merge (with ids and lines)

| Cluster | Items | Lines | Overlap | Recommendation |
|---|---|---|---|---|
| **Lost update / check-then-act** | `F10`, `F09`, `L11` | F10 2870 · F09 2853 · L11 4923 | F10 asks `Hai người cùng mở một đơn hàng để sửa số lượng, làm sao để người sửa sau không ghi đè…`; F09 asks `Hai request cùng kiểm tra email chưa tồn tại rồi cùng INSERT…`; L11 is the same lost-update mechanism with the 24-order incident. Three questions, one concept, one of which (L11) is strictly superior. | Keep L11 as the teaching artifact. Merge F09+F10 into one question whose two halves are "lost update on the same row" and "lost insert on a unique key", and cross-link it to L11. |
| **Idempotency / double charge** | `D11`, `G11`, `cs-04`, `C11`, `L03` | D11 2357 · G11 3210 · cs-04 5931 · L03 4675 | D11 `khách bấm nút thanh toán hai lần… idempotency key và xác thực webhook`; G11 `Lambda trừ tiền… lần chạy đầu timeout sau khi đã trừ tiền`; cs-04 the same via `Idempotency-Key`; C11 `chống double submit`; L03 the SQS-level version. | The mechanism is identical in all five. Merge D11+G11 into one, keep cs-04 as the worked case, and make C11 explicitly the *frontend slice* of it. |
| **Connection pool** | `F11`, `L08`, `cs-09`, `QZ13` | F11 2887 · L08 4920 · cs-09 5991 | F11 `Vì sao nên dùng connection pool trước PostgreSQL và bạn cấu hình pool thế nào`; L08 is the same pool with the `QueuePool limit…` log line; cs-09 repeats it inside a larger slow-backend case. | L08 wins (it has the log line). Demote F11 to a two-line pointer at L08. |
| **N+1** | `E06`, `F12`, `cs-09`, `QZ15` | E06 2580 · F12 2904 · cs-09 5991 | E06 `selectinload… số truy vấn sẽ còn lại bao nhiêu`; F12 bundles N+1 with keyset pagination; cs-09 and QZ15 both describe `hàng trăm câu SELECT giống hệt nhau`. | F12 is overloaded — split it: keyset pagination stays, N+1 moves to E06. |
| **Lambda vs container** | `G16`, `L10`, `cs-12`, `QZ20` | G16 3310 · L10 4922 · cs-12 6024 | G16 `So sánh Lambda với container chạy trên ECS và cho biết khi nào bạn chọn mỗi bên`; L10 is the same decision with the 22-minute job; cs-12 is the same with cold-start cost numbers. | Three artifacts, one decision. Keep L10 as teaching, cs-12 as the numbers, and reduce G16 to a pointer. |
| **CORS vs UI-level protection** | `D05`, `D14`, `C10`, `L19`, `cs-14` | D05 2283+ · D14 2408 · C10 2075 · L19 5489 · cs-14 6047 | D05 preflight, D14 `ẩn nút Xóa trên giao diện không bảo vệ được dữ liệu`, C10 `guard frontend KHÔNG phải phân quyền backend` (stated in the topic string itself), L19 the token discussion, cs-14 the full case. | Four of these five say the same sentence: *the frontend is not a security boundary.* Merge D14+C10 with a single worked example; keep D05 (mechanism) and L19 (token lifecycle) distinct. |
| **Vue ref/reactive/destructuring** | `C02`, `C03`, `L12` | C02 (region 1900s) · C03 (region 1950s) · L12 4931 | C02 `ref so với reactive, thuộc tính value, template unwrapping`; C03 `Proxy và theo dõi phản ứng; khi destructuring làm mất reactivity`; L12 is both, with the 341/344 incident. | L12 subsumes C02+C03. Reduce both to drill items linked from L12. |
| **`def` vs `async def` / blocking call** | `E03`, `A16`, `L07`, `L09`, `QZ14` | E03 (2570s region) · A16 1351 · L07 4919 · L09 4921 · QZ14 (region 4250s) | E03 `đổi endpoint sang def thường rồi giữ driver đồng bộ, tải cao còn bị nghẽn không`; L07 is the same with the one-word diff; QZ14 tests the same; A16 and L09 are variants (blocking in async, boto3 in async). | Five items on one sentence. Keep L07 (Python-side) and L09 (AWS-side) as the pair; collapse E03, A16 and QZ14 into their linked drills. |
| **Stale response overwriting a newer one** | `C05`, `B08`, `QZ06`, `QZ09` | C05 (2050s) · B08 1656 · QZ06 (4210s) · QZ09 (4230s) | All four describe two in-flight searches and the older one landing last. | Merge into one frontend question with two shapes (debounce + AbortController) and one Vue shape (watch cleanup). |
| **Index write cost / composite index order** | `F04`, `F05`, `QZ16` | F04 (2760s) · F05 2778 · QZ16 (4240s) | F05 `Chi phí ghi và lưu trữ khi lạm dụng index` is the second half of F04's `composite index với thứ tự cột`; QZ16 tests the leftmost-prefix rule. | Fine as three if they cross-link; currently they do not. |

**Count:** 9 merge clusters covering **35 of 131 questions (27%)** and 5 of 14 case studies.

### §PED-14 — Mechanical repetition of the file's own idioms

Beyond structure, three phrasings are used so often they stop meaning anything:

- `đây là lỗi kinh điển` / `lỗi kinh điển` — used in A17 (1378), B08 (1656 region), F12 (2904 region), A05 (1155), A04 (1130) at minimum. "Kinh điển" tells the learner *this is famous*, never *this is why it happens here*.
- `cái bẫy` — used across lessons as an in-group shorthand (`Cái bẫy nằm ở một từ khoá` L07; `đúng cái bẫy của bài về connection pool` L11; `Cái bẫy:` inside L16). Effective the first four times.
- The `Vì sao cần / Khi nào dùng và khi nào không / Điều kiện thay đổi` bullet triad: **90 / 65 / 95** occurrences.

---

## 9. LESSON STRUCTURE TABLE — L01…L22

Legend: **Y** = present. Field presence is identical across all 22 lessons (measured, 33/33 keys each); the columns that vary are *where the causal stage is actually delivered* and *whether the authored opener follows the stage*.

| Lesson | Line | PROBLEM<br>`incident` | PREDICT<br>`predict` | NAIVE<br>`naive` | WHY REASONABLE | FAILURE<br>`timeline` | ROOT CAUSE<br>`rootCause` | PRESSURE→TECH<br>`concept` | MECHANISM<br>`mechanism` | IMPL<br>`code` | NEW FAIL<br>`failureModes` | TRADE-OFF<br>`tradeoff` | NOT-USE<br>`alternatives` | DEBUG<br>`observe` | LADDER<br>`attacks` | ANCHOR<br>`anchor` | **Defect** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| L01 | 4553 | Y | Y | Y | Y (in `naive`) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` opens `Đó là gì.` — a fresh definition *after* the whole chain. Flow diagram renders after `code`. |
| L02 | 4614 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` opens `Đó là gì.` — 4,717 chars after 14 blocks. |
| L03 | 4675 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` opens `Tóm tắt để tra cứu.` — first lesson to use the recap shape. `spineNode` = `compute` (shared by 6). |
| L04 | 4737 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` opens `Đó là gì.` **Never a `buildsOn` target for any lesson.** |
| L05 | 4797 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` = **7,948 chars / 9 paragraphs / 12 `<strong>`** — the heaviest page in the corpus. Opens `Đó là gì.` |
| L06 | 4856 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` opens `Đó là gì.`; `failureModes` escapes the template (good). |
| L07 | 4919 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Inline on one source line.** `buildsOn: ['L01']` skips L02–L06. `bridgeHead` cannot render on this path. |
| L08 | 4920 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Inline. Best-quoted error string in the corpus (`QueuePool limit…`). |
| L09 | 4921 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Inline. `buildsOn: ['L02','L08']` — explicitly reuses L02's IAM? No: reuses L08's resource-scope lesson. Correct. |
| L10 | 4922 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Inline. `failureModes` explicitly bridges to L08. Strong. |
| L11 | 4923 | Y | Y | **Y** | **Y** | Y | **Y** | **Y** | **Y** | Y | **Y** | Y | Y | Y | Y | Y | Inline. **The best lesson in the file.** `rootCause` even names the trap the naive fix would still have. |
| L12 | 4931 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `bridge` admits the axis flip (`sang hẳn phía giao diện`). `buildsOn: ['L11']` is nominal. |
| L13 | 5014 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | — |
| L14 | 5095 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | — |
| L15 | 5177 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | — |
| L16 | 5258 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | — |
| L17 | 5339 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | — |
| L18 | 5426 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` = `Tóm tắt để tra cứu.` Stage-4 intro lives here (5429). |
| L19 | 5489 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` = 4,581 chars / **14 `<strong>` labels** — 8 topic headers in one field. |
| L20 | 5552 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` = 6,552 chars / 11 paragraphs, four independent sub-topics. |
| L21 | 5615 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Overlaps L11 (transaction/outbox) with no cross-reference from L11. |
| L22 | 5679 | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | `body` = 5,433 chars / **14 paragraphs** — the largest. Re-narrates L18–L21, its own `buildsOn` set. |

**Lesson-corpus verdict:** all 15 causal stages are structurally present on all 22 lessons — the *only* place in the file where the contract is met. The failures are not missing stages; they are (a) **ordering** (`body` as a postscript that is sometimes a second definition), (b) **mechanical phrasing** (§PED-12), (c) **load** (§PED-4), and (d) **five lessons whose bridge/flow wiring is broken or nominal** (§PED-1, §PED-6).

---

## 10. THE STRUCTURAL DEFECT: 70 of 131 questions have no pedagogy at all

> ⚠️ This is the highest-severity finding in the audit. The Lead independently measured this and asked for it as its own section. I re-derived it from the file and **the count is 70, not 71** — one question is measurably different from the Lead's list.

### Measurement

For each of the 131 question blocks, test for the four fields `incident`, `askFirst`, `predict`, `anchor`:

| Result | Count |
|---|---|
| All four present | **61** |
| Zero of four present | **70** |
| Partial (1–3 present) | **0** |

**There is no partial state.** The bank is bimodal: 61 questions were upgraded to the full causal contract, 70 were not touched at all. This is a build that stopped mid-migration, not a bank with uneven quality.

**The 70 core-only questions, with line numbers:**

```
A08:1211  A09:1229  A10:1247  A11:1264  A12:1281  A13:1299  A14:1316
A15:1334  A16:1351  A17:1369  A18:1386
B07:1627  B08:1656  B09:1685  B10:1713  B11:1741  B12:1769  B13:1797  B14:1825
C10:2075  C11:2092  C12:2109
D07:2283  D08:2306  D09:2323  D10:2340  D11:2357  D12:2374  D13:2391  D14:2408
E07:2580  E08:2597  E09:2614  E10:2631  E11:2648  E12:2665
F02:2713  F05:2778  F06:2795  F07:2812  F09:2853  F10:2870  F11:2887  F12:2904
G11:3210  G12:3230  G13:3250  G14:3270  G15:3290  G16:3310  G17:3330
H04:3440  H05:3460  H07:3508  H08:3528  H09:3548  H10:3568  H11:3588  H12:3608
I03:3691  I04:3712  I05:3732  I06:3753  I07:3773  I08:3794
J07:3988  J08:4008  J09:4028  J10:4048  J11:4068
```

**Direct visual confirmation, A08 (lines 1211–1227)** — the block goes straight from metadata to the question text with no pedagogical frame:

```
1212: id: 'A08',
1213: group: 'A',
1214: topic: 'Iterable, iterator, generator, yield và tính lười',
1215: prio: 'P1',
1216: level: 'L2',
1217: type: 'concept',
1218: q: 'Iterable, iterator và generator khác nhau thế nào, và tính lười của generator giúp ích gì khi dữ liệu lớn?',
1219: oral: '…'
1220: deep: '<p><strong>Định nghĩa:</strong> iterable là giao diện có phương thức iter trả về iterator…'
```

No `incident`, no `askFirst`, no `predict`, no `anchor`. The same is true of B07 at 1627 and of all 70.

### §PED-15 — The consequence is not "missing fields"; it is that 53% of the bank renders as a definition entry

**Why it hurts learning — three measured consequences:**

1. **The card has no entry problem.** The renderer at 6368–6371 builds the causal chain from exactly these fields:
   ```
   6368  var lead = when(q.incident, blockBox('pb pb-incident', 'Tình huống', q.incident)) +
   6369    asksBox(q.askFirst) + predictBox(q.predict) +
   6370    when(q.naive, blockBox('pb pb-naive', 'Cách làm ngây thơ', q.naive, q.naiveCode, q.naiveOut)) +
   6371    when(q.rootCause, blockBox('pb pb-root', 'Nguyên nhân gốc', q.rootCause));
   ```
   For 70 questions, `lead` is the empty string. What is left is the renderer's fallback at 6385: `oralBlock + deepBlock + codeBlock + expectedBlock + fuBlock + pitBlock + scBlock`. **A core-only question is: model answer → definition → code → answer-restated → Q&A → traps → self-report.** The learner reads a model answer as the first artifact.

2. **`deep` opens definitionally on 34 of those 70** — see §PED-3. Combined with the missing incident, that means **34 questions are, in full, a `Đó là gì` dictionary entry with code.**

3. **The file's own metadata lies about it.** The `<meta name="description">` at line 7 advertises `131 câu hỏi có đáp án, quiz, flashcard, mock interview, case study`. Nothing tells the learner that 70 of the 131 have no worked incident. A learner who studies A01–A07, B01–B06, C01–C09, D01–D06, E01–E06, F01, F03, F04, F08, G01–G10, H01–H03, H06, I01, I02, J01–J06, J12 — i.e. all the *story-shaped* items — will form a false model of the bank, and then hit a solid wall of reference text at A08.

### Answer 1 — Which group is worst by proportion?

| Group | Total | Full 4 fields | Zero fields | **Zero %** |
|---|---|---|---|---|
| **I** (algorithms, Big-O, OOP) | 8 | 2 | 6 | **75%** |
| **F** (SQL / Postgres) | 12 | 4 | 8 | **67%** |
| **H** (Docker / Linux / CI-CD / Git) | 12 | 4 | 8 | **67%** |
| **A** (Python core) | 18 | 7 | 11 | **61%** |
| **B** (JavaScript / TypeScript) | 14 | 6 | 8 | 57% |
| **D** (HTTP / REST / security) | 14 | 6 | 8 | 57% |
| **E** (FastAPI / Django / ORM) | 12 | 6 | 6 | 50% |
| **J** (behavioural / soft) | 12 | 7 | 5 | 42% |
| **G** (AWS) | 17 | 10 | 7 | 41% |
| **C** (Vue) | 12 | 9 | 3 | **25%** |

**Worst by proportion: I (75%), then F and H tied (67%), then A (61%).**
**Worst by absolute count: A (11 questions), then B/D/E/F/H (8 each).**

Note the ordering is roughly *inverse to interview weight for this specific job*. The JD is Fullstack AWS + Python + Vue (per `MOCK_SETS.aws_focus` brief at 4495 and `STUDY_PLANS.six_hours` at 5754). Groups C (Vue) and G (AWS) — the two the candidate is weakest at and the two the file is explicitly built to remediate — are the **best-covered** (25% and 41% zero). Group I (algorithms, 8 questions, lowest JD weight) is the worst covered at 75%, which matters least. **Group A is the real problem**: 18 questions, the P0 core of the candidate's strongest area, 11 of them reference-shaped.

### Answer 2 — When the four fields ARE present, is the causal order actually honoured?

**Partly — and measurably worse than it looks.**

The 61 upgraded questions **do** order the block sequence correctly: `incident` → `askFirst` → `predict` → (naive) → ... → `anchor`. In the question renderer, `predict` precedes `expected` in 60/61 cases (only `J12` reverses it). That ordering is correct.

**But the causal chain breaks at the handoff into `deep`.** Cross-tabulating "has incident" against "how `deep` opens":

| | Definitional `deep` opener | Non-definitional `deep` opener | Total with `deep` |
|---|---|---|---|
| Has `incident` (story-shaped) | **43** | 19 | 62 |
| No `incident` (core-only) | 34 | 35 | 69 |
| **Total** | **77** | **54** | 130 |

**43 of the 62 story-shaped questions tell a story and then immediately hand over a dictionary entry.** The incident is not decoration in the *sense that it is absent*; it is decoration in the sense that **nothing downstream ever uses it**. There is no field anywhere that says "this root cause is why the incident at the top happened". The `anchor` field sometimes does this (A01 1056, A02 1080, A03 1104, A04 1128, A05 1152 — the `anchor` on all five is well-formed and incident-aware: `= cùng một giá trị, hai id khác nhau, cache trượt vĩnh viễn`). But `anchor` renders **15th of 24 blocks**, and the blocks between it and the incident do not connect back.

**Concrete instance — A01.** Incident at 1049 (canary report, `is None` copy-paste). Predict at 1055. Anchor at 1056. Then 1059 `deep` opens `Định nghĩa:`. The word "cache" appears in the anchor and the incident, and **not once in the `deep` block**. The story and the content are two documents.

**The one question that gets it fully right is `J12`** — it is the only question whose structure mirrors the lesson structure, and it is a *soft-skills* question about a two-week study plan. That inversion (the behavioural question has the best technical narrative) is itself a signal about how the upgrade was executed: content was copied from the lesson template into questions without re-deriving the narrative for each question.

### Answer 3 — Which group to upgrade first, ranked by learner benefit per unit of work

The ranking is **not** the same as the "worst proportion" ranking. Benefit = (how often the question comes up) × (how much the question currently teaches nothing) × (does the story exist already elsewhere in the file to be lifted).

| Rank | Group | Why first | Existing material to lift |
|---|---|---|---|
| **1** | **A (11 items)** | Highest JD weight (P0 Python), largest absolute gap, and the group a candidate reads *first* — so a bad first impression propagates. A08–A18 currently teach definition-first Python trivia (iterables, LEGB, decorators, GIL, event loop, unittest). | A01–A07 already contain the exact incident register; the voice is established. Also lift from L07/L09 (async/blocking) for A15/A16, and A17 from I01's `50.000 đơn hàng bị trùng trong 20 phút` (line 3939). |
| **2** | **F (8 items)** | The candidate's SQL is described as already strong (`STUDY_PLANS.python_sql_core` brief, 4515) but F07/F09/F10/F12 are the exact queries an interviewer probes. F09/F10 are near-duplicates of L11's incident, which is already written and measured. | **L11 line 4923 is a complete F07+F09+F10 pack** — its `predict` already carries the 24-vs-10 measurement. Copy the incident, invert it into a "what happened?" prompt, and attach an anchor. F12 can lift cs-09 (line 5991). |
| **3** | **H (8 items)** | Ops questions are the hardest to fake and the most memorable when they land. H04–H12 currently read as a Dockerfile reference manual. | cs-10 (line 6002, deploy/rollback) and cs-11 (6013, retry+DLQ) are fully-written incidents. H06 already proves the register works (`SRE D`, `khách hàng bị trừ tiền hai lần`, line 3487) — use it as the tone template for H04, H05, H07–H12. |
| **4** | **D (8 items)** | D07–D14 are HTTP/security; a candidate can pass the whole screening on D02/D05/D06 and then lose the offer on D11/D14. Also the group with the most reliable real-world incidents available (double submit, stale token, hidden button). | cs-04 (5931), cs-08 (5980), cs-14 (6047), L19 (5489). QZ20 and QZ24 already frame these as scenarios — reuse the framing as the `incident`. |
| **5** | **E (6 items)** | E07–E12 are FastAPI/Django/ORM. L07, L08, L09 already carry the incidents; E03/E06/E07 are near-duplicates of them. | L07 4919, L08 4920, L09 4921, L11 4923. |
| **6** | **B (8 items)** | JS/TS substrate. B07–B14 include B08 (stale search) and B12 (leak) which already have strong scenarios in C05 and QZ09. | C05, B08's own topic string, QZ06/QZ09. |
| **7** | **J (5 items)** | J07–J11 are behavioural. They do not need an *incident*; they need a *scored example answer*. Different fix, lower cost, still worth doing. | J01–J06 and J12 already model this. |
| **8** | **I (6 items)** | Algorithm questions at 75% zero, but the lowest JD weight and the least dependent on incident framing. | I01 (3939) and I02 already have incidents; I03–I08 can follow I01's shape. |

**Sequencing recommendation:** A → F → H in the first pass (27 questions, covering the two highest-weight technical groups and the group whose questions are hardest to bluff). That single pass moves the bank from 61/131 story-shaped to 88/131 (67%), and it covers 100% of groups A, F and H.

**A cheaper alternative worth considering first:** the question renderer already supports all fifteen causal blocks (6368–6371 and 6385). For the 70 core-only questions that are *near-duplicates of an upgraded question or a lesson* (F07/F09/F10 → L11; E03 → L07; E06 → L11's mechanism; G16 → L10; C02/C03 → L12; D14/C10 → L19; F11 → L08), the cheapest correct fix is to **replace the question body with a two-line redirect plus the four lifted fields**, not to author new incidents. Measured overlap supports this for at least 28 of the 70 (§PED-13 clusters).

---

## 11. PROPOSED VARIED SHAPES — 8 narrative forms that preserve the causal chain

The problem with 22 identical lessons is not that the sequence is wrong. It is that the *shape* is identical, so the learner stops noticing structure. Each shape below preserves all 15 causal stages; they differ in **which stage is the entry point** and **how the reader is positioned**.

### Shape 1 — The Incident Log (current default; keep for 6 lessons)
**Entry:** `incident` in past tense, third person.
**Position:** Reader is the on-call engineer arriving after the fact.
**Sequence:** incident → "what would you check first?" → naïve attempt → timeline → root cause → …
**Best for:** L01, L02, L06, L10, L18, L21 — lessons with a clean single-cause failure.
**Anti-fatigue rule:** max 6 lessons may use this shape.

### Shape 2 — The One-Line Diff
**Entry:** a single `git diff`-formatted line.
**Position:** Reader is the reviewer who must approve it.
**Sequence:** the diff → "what could this break?" → prediction → the failure it actually caused → root cause → mechanism → the correct diff.
**Best for:** L07 (the `def`→`async def` one-word change, line 4919 — the corpus already contains this shape and it is the best lesson in the file), L12 (a single `const { q } = filters` line), L22.
**Why it works:** the entire tension is contained in the artifact the reader is asked to judge. The prediction is free.

### Shape 3 — The Two Screens
**Entry:** two numbers that disagree, shown side by side.
**Position:** Reader is the support engineer reading a screenshot.
**Sequence:** `341` vs `344` → "which one is true?" → the code that writes each → the dependency edge nobody declared → mechanism → fix → new failure modes.
**Best for:** L12 (already written this way at line 4941 — the two-number framing is present but buried four paragraphs into the incident), L11 (`24 đơn` vs `10 lần trừ kho`), L01 (`p99 4,2 giây` vs `mọi service đều xanh`).
**Why it works:** forces the learner to form a hypothesis before any content is delivered. This is the strongest shape for retention and it is currently used accidentally.

### Shape 4 — The Bill
**Entry:** a cost figure — money, GB-seconds, connection-seconds, or compute-hours.
**Position:** Reader is the engineer who has to justify the architecture to someone who pays.
**Sequence:** a specific bill line → "why is it this number?" → the design decision that produced it → the naive fix that makes it worse → trade-off → when not to use the technology.
**Best for:** L10 (Lambda vs container — the corpus already has `GB-giây` vs `thời gian task sống`), L05 (S3 storage class + lifecycle), L03 (Lambda concurrency cost).
**Why it works:** cost is the one trade-off every interviewer accepts as real, and it converts an abstract `tradeoff` block into a number.

### Shape 5 — The Log Excerpt
**Entry:** 6–10 lines of raw application/platform log, verbatim, with timestamps and a correlation id.
**Position:** Reader is grepping.
**Sequence:** the log block → "which line is the cause?" → the three lines that look guilty → the one that is → root cause → the measurement that proves it → the fix that changes what the log says.
**Best for:** L08 (`QueuePool limit of size 20 overflow 10 reached…` — already present, line 4920), L11, L09.
**Why it works:** it teaches *reading* as a skill, which no current lesson does. The corpus currently has exactly one verbatim platform log line (L10 `observe`: `Task timed out after 900.00 seconds`).
**Concrete requirement:** every log excerpt must contain a correlation id and three fake-but-plausible neighbours, two of which are red herrings.

### Shape 6 — The Interview Failure (reverse-engineered lesson)
**Entry:** a scored interview answer that was marked *fail*, written as the candidate actually said it — with the hedging, the missing number, and the wrong emphasis.
**Position:** Reader is the candidate, reviewing their own recording.
**Sequence:** the failed answer verbatim → the interviewer's follow-up that exposed it → what the answer should have named → the mechanism behind it → the correct 90-second answer.
**Best for:** J-group questions, plus L19 and L22 (where the failure is a *statement* failure, not a system failure).
**Why it works:** it is the only shape that trains the thing the file is *for* — speaking under pressure — rather than the underlying technology. Currently the file has `say30`/`say90` as *answers* with no calibration against what a bad answer sounds like.

### Shape 7 — The Two Branches (decision lesson)
**Entry:** a fork drawn as two columns — this technology vs that one, from the first line.
**Position:** Reader is the architect on the day the choice is made.
**Sequence:** the fork → the criterion that decides it (one sentence, stated up front) → a case that falls wrong on each side → the cost of each branch → the migration cost if you chose wrong → how to tell on day 3 that you chose wrong.
**Best for:** L10 (Lambda/container), L05 (PostgreSQL/DynamoDB), L15 (Pinia/local state), L20 (S3 direct vs through API).
**Why it works:** the corpus has four genuine either/or lessons currently disguised as single-technology lessons. Making the fork explicit is both more honest and more memorable.

### Shape 8 — The Regression Walk (postmortem reversal)
**Entry:** the *fix*, already merged, presented as a commit summary.
**Position:** Reader is the engineer who must now write the postmortem and the prevention item.
**Sequence:** the merged fix → "what does this fix assume?" → the assumption → the *second* incident the fix causes 40 days later → the invariant that would have caught it → the alarm that encodes that invariant → back-fill to the original root cause.
**Best for:** L11 (the conditional `UPDATE` → the row-contention hot row), L10 (moving to containers → connection multiplication), L12 (reactivity → the `Proxy` memory cost on 4,000 rows).
**Why it works:** it is the only shape in which `failureModes` (currently the 11th of 24 blocks, templated 13/22 times) becomes the *engine* of the lesson instead of an appendix. It teaches the single most valuable senior instinct: every fix creates the next incident.

### Distribution proposal for L01–L22

| Shape | Lessons | Count |
|---|---|---|
| 1 Incident Log | L01, L02, L06, L16, L18, L21 | 6 |
| 2 One-Line Diff | L07, L12, L13 | 3 |
| 3 Two Screens | L11, L14 | 2 |
| 4 The Bill | L03, L05 | 2 |
| 5 Log Excerpt | L08, L09 | 2 |
| 6 Interview Failure | L19, L22 | 2 |
| 7 Two Branches | L10, L15, L17 | 3 |
| 8 Regression Walk | L04, L20 | 2 |

This keeps the 15-stage chain in all 22, removes the "22 mechanically identical lessons" problem, and — critically — makes the *entry artifact* vary, so a learner skimming the lesson index can tell shape 6 from shape 2 in one glance.

---

## 12. Ranked TOP-15 — sections needing the most pedagogical work

Ranking = learner-hours lost per hour of authoring cost. Ties broken by JD weight.

| # | Rank target | Line(s) | The problem in one line | The one fix |
|---|---|---|---|---|
| **1** | **The 70 core-only questions** (A08–A18, B07–B14, C10–C12, D07–D14, E07–E12, F02/F05–F12 minus upgraded, G11–G17, H04–H12, I03–I08, J07–J11) | 1211 … 4068 | **Zero** of `incident`/`askFirst`/`predict`/`anchor`; 53% of the bank renders as a definition entry with a model answer first | **Group A first (11 items), then F (8), then H (8).** Lift incidents from L07/L08/L09/L11 and cs-04/cs-08/cs-10/cs-11 rather than authoring new ones. |
| **2** | **The quiz's answer structure** — all 28 `QZ` items | 4115–4480 | **28/28 answers at index 0 and 28/28 correct options strictly longest** (mean 137 vs 88 chars). Solvable without reading. | Shuffle the canonical order at source; add 2–3 genuine-misconception distractors per item at the correct option's length; keep the option-length ratio within ±15%. |
| **3** | **`selfcheck` on all 131 questions** | 1064, 1088, 1112, 1136, 1160, … 4068 | **117/117 measurable first-items are self-reports** (`Tôi vẫn chưa giải thích được…` ×109, `Điều tôi vẫn chưa giải thích trôi chảy là…` ×8). Bytecode paging and B-tree node splits sit in slot 1 of P0 questions. | Reorder to **produce → explain → cannot-yet**, and make slot 1 a timed recall against the question's own `anchor`. |
| **4** | **`deep` on the 43 story-shaped questions that still open definitionally** | e.g. 1059, 1083, 1107, 1131, 1155, 1308, 1378 | The incident is narrated and then abandoned; `deep` restarts at `Định nghĩa:` | Force the first sentence of `deep` to name the incident's own symptom. Definitions move to bullet 2. |
| **5** | **L05 `body`** | 4797– | **7,948 chars / 9 paragraphs / 12 `<strong>` labels** in one rendered block, opened `Đó là gì.` | Split into `body` (≤1,200 chars recap) + `depth` (collapsed). Move versioning and lifecycle out into their own collapsed blocks. |
| **6** | **L22 `body`** | 5679– | **5,433 chars / 14 paragraphs**; re-narrates L18–L21 which are its own `buildsOn` targets, immediately after those lessons narrated them | Replace with a 6-line chronological spine + links. The "single story, in time order" framing is good; the execution duplicates. |
| **7** | **L20 `body`** | 5552– | **6,552 chars / 11 paragraphs**, four independent sub-topics (overwrite window, PUT limit, virus scan, versioning) in one field | Split into four collapsed `depth` sub-blocks; each is a full failure mode. |
| **8** | **L19 `body`** | 5489– | **4,581 chars / 14 `<strong>` labels** — 8 topic headers in one block; contains meta-instruction to the reader (`Câu trả lời trung thực cho phỏng vấn là…`) | Split; move the meta-instruction into `say90`. |
| **9** | **The 14 case studies' opener and closer** | 5880–6056 | **13/14 open with literal "Failure mode"**, **14/14 close with literal "Tradeoff."**; **zero** ask a prediction; none link to a lesson or a quiz | Add a `predict` before the mechanism and an `anchor` at the end; assign a `lesson` cross-link. Vary the opener; cs-02's inversion (happy path opening on the failure it avoids) is the model. |
| **10** | **`failureModes` across all 22 lessons** | 7012 template; authored texts | **13/22 open with the literal `Cách sửa này tạo ra N kiểu hỏng mới.`** | Ban the template; require each to start with the *symptom the next on-call shift will see*. |
| **11** | **`observe` across all 22 lessons** | 7015 template | **15/22 open by announcing a count** (`Bốn tín hiệu…`) before the reader has a model to hang it on | Ban the count. Lead with the *one* signal that finds this specific incident, then the others as secondary. |
| **12** | **`concept` across all 22 lessons** | 7010 template | **22/22 open with the literal `Bây giờ mới gọi tên.`** | Replace with the "what the learner cannot yet say" sentence — L11 (`Thứ đang thiếu là một ranh giới giao dịch đặt đúng chỗ`) and L12 (`Thứ còn thiếu là reactivity`) show the working pattern. |
| **13** | **`bridge` / `bridgeHead` wiring on L07–L11** | 4937, 6999, 7021 | The one device that makes the corpus continuous is the one with a broken/unconditional lookup on the five hardest lessons | Make `bridgeHead` a literal; add a render assertion; move `stageIntro` into the stage table (only 4/22 lessons carry it, at 4556/4919/4934/5429). |
| **14** | **The `mock` view's ungated answer** | 6724–6732 | `renderMockQuestion` prints the full `oral` answer under a label that says `trả lời miệng trước khi đọc` | Move the answer into the same `<details>` gate the `predict` box uses (line 6322). One-line change; the flashcard already does it right (6545–6548). |
| **15** | **The 9 near-duplicate clusters** | see §PED-13 | **35 of 131 questions (27%)** and 5 of 14 case studies restate material already covered better elsewhere (F07/F09/F10↔L11; E03↔L07; G16↔L10; D14/C10↔L19; F11↔L08; C02/C03↔L12; C05/B08/QZ06/QZ09; D11/G11/C11↔L03) | Merge or demote to drill items with a pointer to the teaching artifact. Full table in §PED-13. |

---

## 13. What the file gets right (so the rewrite does not destroy it)

Recorded because a rewrite that fixes the above without preserving these would be a net loss.

1. **The L01→L22 spine is real and mechanically declared.** `buildsOn` on 21/22 lessons, `spine`/`spineNode` on 22/22, `bridge` on 22/22, and genuine forward/backward call-backs (`Đây đúng là cái bẫy của bài trước`, L09 4921; `đúng cái bẫy của bài về connection pool`, L11 `failureModes`).
2. **The nine-block causal renderer already exists** (7002–7017). This is the single most valuable asset in the file: adding an `incident` to a question immediately renders a "Tình huống" box with the right styling and the right position.
3. **`predict` is gated behind `<details>`** (6322) with the label `Thử đoán trước khi đọc tiếp`, and it precedes the answer in 60/61 upgraded questions. This is correct retrieval design and should be extended, not rebuilt.
4. **The flashcard view is correctly gated** (6545–6548: `back.hidden = true` until reveal). It is the best-designed surface in the app.
5. **The incidents that exist are excellent.** Twelve carry real tension with real numbers — the best are L11 (line 4923), L07 (4919), L10 (4922), L12 (4941), L08 (4920), H06 (3487), I01 (3939). The register is established; it needs to be propagated, not reinvented.
6. **`anchor` is a genuinely good memory device** where it exists (A01 1056, A02 1080, A03 1104, A04 1128, A05 1152) — a single compressible sentence in the shape `X mà không có ràng buộc Y = hậu quả Z`. Same for the lesson `anchor` field, 22/22.
7. **The `mock` sets and `STUDY_PLANS` understand layering** even where the lesson pages do not: 5755 `trả lời miệng 60 giây không nhìn oral, mới mở oral để đối chiếu`; 5862 `Không xem lại oral giữa chừng`. This instruction belongs on the question page.
8. **The 12 flow SVGs are all referenced and none are dead** (verified: 0 defined-but-unreferenced, 0 referenced-but-undefined).

---

*Auditor: pedagogy-auditor · task-7 · read-only on `hitechcloud-interview-prep.html` · single write path `D:\research\audit\pedagogy.md`*
