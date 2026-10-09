# INTEGRATION REPORT — hitechcloud-interview-prep.html

**Target:** `D:\research\hitechcloud-interview-prep.html`
**Backup (pre-edit):** `D:\research\.scratch\hitechcloud-interview-prep.backup.html` (1,848,621 bytes)
**Date:** 2026-10-07

---

## 1. HEADLINE: the commissioning brief was largely wrong about the file

The brief asserted a specific list of defects and told me to verify them independently.
I did. **Most did not exist.** The file had already been repaired against an earlier draft.

| Asserted defect | Verdict | Evidence |
|---|---|---|
| A05 claims a comprehension result becomes `[0,1,2]` and does not | **FALSE** | File says `[2,2,2]` for both loop and comprehension. Executed: `[2,2,2] / [2,2,2] / [0,1,2]`. Not a defect. |
| File teaches comprehension cells avoid late binding | **FALSE — file teaches the opposite** | Line 1155 flags the wrong teaching as an error. Correct. |
| "tuple immutable ⇒ hashable" / "only immutable can hash" | **FALSE — file refutes it** | Line 1107 opens with a bolded correction. Executed: mutable instances DO hash by `id`; `__eq__` without `__hash__` → `None`. |
| Defaults stored "in the function's code object" | **FALSE — file says `MAKE_FUNCTION`/`__defaults__`** | `add_tag.__defaults__` → `([],)`; `co_consts` → `(None,)`. Both halves true. |
| Django taught as inherently WSGI/sync | **FALSE** | Lines 2605/2606 correctly split Django 3.0 ASGI from 3.1 async views. |
| `def` vs `async def` recommendations outdated | **FALSE** | Line 2497 correct, including the 40-token anyio limiter. |
| Lambda "when not to use" = unusual libraries | **FALSE — file explicitly disclaims it** | Line 4722: "không phải lý do loại Lambda — container image xử lý được". |
| Lambda retry uses one vague "async retries" rule | **FALSE — file separates all three modes** | Line 4708 names the confusion, then splits sync / async / event source mapping. |

**What follows is what was actually wrong**, found by eight independent read-only audits
plus my own execution harness.

---

## 2. DEFECTS FOUND AND FIXED (24 edits, all verified)

### Python (7)
| id | location | defect |
|---|---|---|
| PY-1 / PY-1b | I02 (3679, 3687) | **A P0 card rendered a false complexity statement.** Markup split the class: `<code>O(n)</code> bình phương` displays as "O(n) bình phương". Also an unclosed paren. Normalised to `O(n^2)` — the form the file already uses at 4444. |
| PY-11 | A10 (1256) | **`__exit__` contract stated backwards** in the primary teaching sentence of a P1 cleanup card. Proven: `return True` → suppressed; `return False`/`None` → propagated. |
| PY-2 | A04 (1131) | `co_consts == (None,)` presented as a general law. It is a special case: `def k(x=[]): "doc"` → `('doc', None)`. |
| PY-3 | A04 (1131) | `__kwdefaults__` condition **inverted** ("không có mặc định") plus a false version gate. |
| PY-9 / PY-6 | A05, A03 | Cited "đã kiểm chứng trên 3.14" — a version the reader cannot run. Behaviour reproduces on 3.13.12. |
| PY-4 | A14 (1325) | Free-threaded claim lacked discoverable handles. Added `python3.13t`, `--disable-gil`, `PYTHON_GIL=0`, `-X gil=0`, `sys._is_gil_enabled()`. |
| PY-5, PY-7, PY-8 | A05, A11, A08 | Depth gaps: bytecode proof (`STORE_NAME`/`STORE_FAST`), class-attribute ↔ `__defaults__` as one mechanism, silent generator exhaustion + PEP 479. |

### AWS (3)
| id | location | defect |
|---|---|---|
| AWS-1 | QZ20 (4367) | **The file contradicted itself on a hard limit.** Line 4789 correctly calls 29 s a ceiling; the quiz distractor offered "raise the integration timeout to 29 s" as the fix. REST API integration timeout is 29 s maximum and not raisable. Distractor replaced; `answer: 0` untouched. |
| AWS-2 | (5662) | "`maxReceiveCount` mặc định là 10" — **fabricated default.** AWS docs: no default; a standard queue has no DLQ until you configure a redrive policy. Contradicted the file's own `maxReceiveCount: 5` at line 3340. |
| AWS-3 | (4722) | 15-minute ceiling stated flatly. AWS docs: 900 s default, **5,400 s (90 min)** for Lambda Managed Instances on async/ESM paths (except MQ and DocumentDB). |

### Frontend (4)
| id | location | defect |
|---|---|---|
| FE-1 | B/C02 (1895–1896) | Anchor and predict said a missed `.value` "ra NaN". **Wrong twice:** with `const` it throws `TypeError: Assignment to constant variable`; with `let` it yields `undefined`, and NaN appears one step later. |
| FE-2 | L12 (4948) | **Taught a false mechanism.** Claimed `effect()` batches same-tick writes into one run. Measured on Vue 3.5.43: 100 same-tick writes → **99 runs**; 100 array pushes → **100 runs**; `watch()` → **1 run** after `nextTick`. Batching belongs to `watch`/render effects, not bare `effect()`. The file contradicted itself — L13 had it right. |
| FE-3 | C05 (1971) | The P0 question about the `da`→`danang` race never explained **why reactivity cannot fix it**. Measured: unguarded final state = `{"q":"da"}` (stale write is a valid write; `trigger` fires as designed). Added the mechanism and where the guard must sit. |
| FE-4 | B08 (1666–1667) | Snippet read a module-level `controller` from inside `setTimeout`, so the signal was not the one created for that invocation — `AbortError` could never fire. Rewritten to a per-invocation `AbortController`. |

### Database / web / DevOps (4)
| id | location | defect |
|---|---|---|
| DW-1 | L11 (4923) | **Internal arithmetic contradiction.** Timeline said 30 requests all read `qty = 10`, then concluded 24 orders. Added a third timeline entry explaining the 6-request gap honestly. |
| DW-2 | F04 (2772, 2774) | Index selectivity asserted with no numbers. Rewritten with the 10M-row arithmetic: 2% match → index wins; 40% → Seq Scan is correct. |
| DW-3 | F05 (2790) | Covering index wrong in two directions. INCLUDE is **conditional** (needs visibility-map all-visible bits) and makes the index **bigger**, never smaller. |
| DW-4 | F07 (2824) | PostgreSQL's Repeatable Read downgraded to "giảm non-repeatable read" — that is the SQL-standard table. PG implements it as snapshot isolation and eliminates phantoms outright. |

### Product (3)
| id | location | defect |
|---|---|---|
| FLOW cs-03 | 5918 | Missing `flow` field → rendered **without a diagram**. Wired to `flow-upload-presign`. |
| FLOW cs-07 | 5969 | Same. Wired to `flow-db-transaction`. |
| FLOW cs-09 | 5991 | Same. Wired to `flow-request-lifecycle`. |

---

## 3. WHAT I DID **NOT** CHANGE, AND WHY

### 3.1 `attacks` is absent from 0 of 131 questions — left as-is, deliberately
Verified: `attacks` present in **22/22 lessons**, **0/131 questions**. The adversarial
auditor ranked this its #1 finding. I did **not** backfill it, because a correct backfill
is 200–300 authored passages that must be fact-checked against the same docs as everything
else — inventing them at the end of a session would violate the accuracy policy this
document is being held to. Recorded here as the top remaining gap.

### 3.2 71 questions lack `incident`/`askFirst`/`predict`/`anchor` — left as-is
Measured directly: **60 full / 71 zero / 0 partial.** The bank is bimodal — a migration
that stopped mid-build. Critically: **0 of them are P0.** The split is 50 P1 + 21 P2.
All 60 P0 questions have the full causal block. The adversarial auditor initially filed
this as critical, then self-corrected to major and withdrew it from the P0 shortlist —
I reproduce their corrected numbers here.

### 3.3 Other verified-correct content left untouched
- `is`/`==`, small-int cache, interning; shallow vs deep copy; LEGB; decorators;
  generator laziness; class-level mutables; `dataclass(frozen=True)`; `Protocol`;
  GIL write-up; asyncio task/cancel; multiprocessing.
- FastAPI: middleware order (`['mw2-in','mw-in','dep','endpoint','mw-out','mw2-out']`),
  yield-dependency caching (1× per request), Pydantic v2 lax/strict, the `assert`-vs-`-O`
  trap under both `-O` and `-OO`, 401/403/IDOR/CSRF, BackgroundTasks semantics.
- PostgreSQL: F08 deadlock/lock-ordering, F09 upsert-as-race-fix, F10 lost-update,
  L11's READ COMMITTED re-evaluation of `WHERE` against the newest row version.
- 22/22 lessons carry all 33 canonical fields; 0 dead flow refs; 0 dangling `refs`/`qids`/`buildsOn`.

### 3.4 Not fixed, recorded as known-remaining
- **Quiz is solvable without reading:** 28/28 answers at index 0; 28/28 correct options
  are the longest. `orderFor()` shuffles display only.
- **`selfcheck` measures confidence, not knowledge:** 117/117 first items are self-reports.
- **Mock view self-defeats:** `renderMockQuestion` (6723) prints the full `oral` answer
  under a label that says "trả lời miệng trước khi đọc".
- **`bridgeHead`** assigned conditionally at 6999, used at 7021 — L07–L11 cannot render
  their bridge header.
- `--warn` is a dead CSS token; `--fg-faint` fails AA on the light theme (4.31–4.49).
- Full detail in `audit/pedagogy.md`, `audit/adversarial.md`, `audit/ui.md`.

---

## 4. EXECUTION LEDGER

**Environment actually used** (read from the installed distribution, not assumed):
Python 3.13.12 · FastAPI 0.142.2 · Pydantic 2.13.5 · pydantic-core 2.46.5 · Starlette 1.7.0 ·
anyio 4.15.1 · httpx 0.28.1 · Django 6.1.2 · DRF 3.18.3 · SQLAlchemy 2.1.3 ·
Node v24.18.1 · Vue 3.5.43. The versions the document cites match the installed set exactly.

**Every runnable snippet was executed.** 148 code blocks extracted; 38 ran standalone and
**all 38 matched their documented `expected`**. The other 110 are fragments needing a
server, package, or DOM (FastAPI routes, boto3, psycopg2, `.vue` SFCs) — each classified
as `skip`, never as a pass.

**Targeted proofs run for the fixes:**
- Closure late binding: `[2,2,2] / [2,2,2] / [0,1,2]`
- `__defaults__` / `co_consts` / `__kwdefaults__` on 3.13.12
- `__exit__`: `True`→suppressed, `False`/`None`→propagated
- Vue `effect()` vs `watch()` batching: 99 / 100 vs 1
- Vue `ref` bare arithmetic: `const`→TypeError, `let`→undefined
- `da`/`danang` race: unguarded→`{"q":"da"}`, guarded→`{"q":"danang"}`
- A17 unittest: `Ran 4 tests … OK`
- GIL build probe: `Py_GIL_DISABLED=False`, `sys._is_gil_enabled()=True`

**Authoritative sources fetched directly** (`web_search` has no API key in this session —
every URL below was opened with `web_fetch`, none are search snippets):
- docs.aws.amazon.com — Lambda quotas, async error handling & retries, concurrency,
  API Gateway quotas, S3 presigned URLs, SQS visibility timeout, SQS DLQ
- postgresql.org/docs/current — transaction-iso (RR = snapshot isolation, phantom
  "not possible"), indexes-index-only-scans (visibility map, INCLUDE bloat),
  indexes-partial ("more than a few percent"), errcodes-appendix (40001)
- developer.mozilla.org — CORS, Cache-Control, ETag, Set-Cookie, Promise
- docs.python.org — hmac.compare_digest
- fastapi.tiangolo.com/async, /dependencies-with-yield; docs.djangoproject.com/topics/async

---

## 5. VALIDATION ON THE FINAL FILE

| Check | Result |
|---|---|
| JS parse (whole bundle in a VM context) | **0 errors** |
| HTML tag balance | html/head/body/style/section all 1:1 |
| Script element closed | ends `…</script></body></html>` |
| Raw `</script` inside the bundle | **false** |
| Loads in a real browser | **yes** — Chrome, title renders |
| Data counts | 131 q / 22 L / 72 src / 28 quiz / 12 flows — **unchanged** |
| Dangling `refs` / `qids` / `buildsOn` / `flow` | **0** |
| Duplicate ids | **0** |
| Case-study diagrams | **14 / 14** (was 11 / 14) |
| `meta description` "131 câu hỏi" | **true** (131) |
| LOGIC behavioural smoke test | **22 / 22 pass** |
| Adversarial re-probe on edited file | 13 / 15 (the 2 misses were probe typos; both phrases verified present) |
| Bytes (on disk) | 1,848,621 → 1,860,791 |

**`bytes` in the JSON integrity files counts JS string characters, not disk bytes** —
the on-disk size is larger because Vietnamese text is multi-byte UTF-8. Both numbers are
correct for what they measure; the table row above uses `Get-Item` length.
**Two self-inflicted breakages, caught and fixed:** my first two edits inserted raw single
quotes (`'doc'`, `'paid'`, `{'z': {}}`) into JS fields delimited by single quotes, breaking
the parse. Detected by running the parser after every edit, corrected to `&quot;`. This is
the exact hazard `audit/ui.md` §4.2 flags for future rewrites.

---

## 6. HONEST LIMITS

- **PostgreSQL behaviour was not executed.** No server on this machine, port 5432 closed,
  no psycopg, no `pip` in the venv. All PG claims are verified against postgresql.org docs
  only. The DW-1/DW-2/DW-3/DW-4 fixes are textual and doc-backed, not runtime-proven.
- **Docker, GitHub Actions and Linux tooling were not executed** (no docker binary, no
  runner). Findings there are documentation-based.
- **No browser CORS/cookie execution.** Session has no browser automation.
- **Pinia and TypeScript are absent** from `node_modules`, so Pinia singleton claims and
  all `tsc` claims are recorded as *unverifiable*, not as passes.
- **L07's exact wall-clock figures** (1.55 / 0.64 / 41.77 s) are machine-specific. The
  auditor verified the *model* exactly, not those constants.
- **`execFileSync`/Node child-process output capture** worked here; where a snippet timed
  out (B12, a deliberate event-loop hang) it is reported as such, not as a failure.
- **The `attacks` backfill and the 71-field backfill were not performed** — see §3.1/§3.2.
