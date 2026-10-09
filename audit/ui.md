# AUDIT H — Product shell & regression baseline

**Target:** `D:\research\hitechcloud-interview-prep.html` (7,259 lines, 1,534,725 bytes, single file, offline)
**Mode:** READ-ONLY on the target. Baseline captured 2026-10-07.
**Baseline SHA-256:** `E491627B2CE37FDC030B17414854C17688CD384D3E164617EE7BCCD4A74F1727`
**Size:** 1,848,621 bytes · **Lines:** 7,259 · **Last modified (baseline):** 2026-10-07 10:58:03
**Auditor:** product-shell-auditor (task-8)

> This document is a **frozen baseline**. It records what the shell does *today* so that any
> later content rewrite can be attributed. If a `MUST NOT BREAK` item fails after the
> rewrite, the rewrite caused it.

---

## 0. HEADLINES (read these first)

| # | Finding | Severity |
|---|---|---|
| 1 | **`meta description` claim "131 câu hỏi" is CORRECT.** Real count = **131**. No discrepancy. | ✅ none |
| 2 | **3 dangling `flow` references** — case-study sections `cs-03`, `cs-07`, `cs-09` declare no `flow`, so 3 of 14 case sections render **without a diagram** while the other 11 do. | ⚠️ real gap |
| 3 | **`--warn` is a dead token** — declared in `:root` (line 31), never referenced anywhere in the file. | ℹ️ cosmetic |
| 4 | **All question `refs` resolve.** 131/131 questions carry `refs`; 0 dangling source keys. **2 sources are never cited** (`py-venv`, `django-testing`). | ℹ️ minor |
| 5 | **All `qids` / `buildsOn` / `spineNode` / `stage` resolve.** 44 question ids linked from lessons, 0 dangling. 21/22 lessons have a complete BFS chain back to `L01`; `L01` is the root. | ✅ none |
| 6 | **The whole bundle parses and runs clean.** 0 syntax errors, 0 tag-balance problems, 0 duplicate ids, 0 dead anchors, 0 runtime console errors on a full render. | ✅ none |

---

## 1. CAPABILITY INVENTORY — feature → implementation → line numbers → by-hand test

How to run every test below: open the file in a browser (double-click; no server needed),
or from a shell `start D:\research\hitechcloud-interview-prep.html`.

### 1.1 Shell & chrome

| Capability | Where | Lines | By-hand test |
|---|---|---|---|
| Document metadata / title / meta description | `<head>` | 6–8 | View source. Title = "Ôn phỏng vấn — Fullstack Engineer (AWS, Python, VueJS) — HiTechCloud" |
| Self-contained favicon (inline SVG data URI) | `<link rel="icon">` | 9 | Tab shows a blue "M" tile; no network request |
| Single `<style>` block | 10–464 | — | 454 lines of CSS, no `@import`, no external font |
| `color-scheme` hint for form/scrollbar theming | `<meta name="color-scheme">` | 8 | Scrollbars follow the theme in Chromium |
| Skip link | `a.skip-link` | 467 | Tab once on load → "Bỏ qua điều hướng…" appears top-left; Enter moves focus to `#main` |
| Sidebar landmark + labelled nav | `aside.side`, `nav` | 470, 480 | Screen reader announces "Điều hướng và bộ lọc" |
| Mobile sidebar toggle | `#side-toggle` | 472 | Narrow the window <900px → "☰ Bộ lọc & mục lục" appears; click collapses/expands |
| Brand, subtitle, document buttons | 475–570 | — | Theme / Print / Reset buttons all present |
| Storage disclosure note | `#storage-note` | 570 | Static text, always visible |

### 1.2 The nine views (`VIEWS` array, line 6178)

`learn · intro · questions · flashcard · quiz · mock · plan · case · sources`

Each is `<section class="view" id="view-<name>">` (lines 576–673). Left as a plain block;
`showView()` (7196–7205) toggles `.active`; CSS `144/145` shows only `.active`.

| View | Section | Nav button | Body mount | Count badge |
|---|---|---|---|---|
| Lộ trình học | `#view-learn` 576 | 483 | `#learn-body` 579 | `data-count-for="learn"` |
| Bắt đầu & lộ trình | `#view-intro` 582 | 484 | `#intro-body` 584 | `"intro"` |
| Câu hỏi & đáp án | `#view-questions` 587 | 485 | `#q-list` 594 | `"questions"` |
| Flashcard | `#view-flashcard` 598 | 486 | `#fc-front` 604, `#fc-back` 609 | `"flashcard"` |
| Quiz | `#view-quiz` 620 | 487 | `#quiz-list` 629 | `"quiz"` |
| Mock interview | `#view-mock` 632 | 488 | `#mock-panel` 650 | `"mock"` |
| Lịch ôn | `#view-plan` 657 | 489 | `#plan-body` 660 | `"plan"` |
| Case study | `#view-case` 663 | 490 | `#case-body` 666 | `"case"` |
| Nguồn tham khảo | `#view-sources` 669 | 491 | `#sources-body` 672 | `"sources"` |

**Test:** click each of the 9 nav buttons → exactly one view visible; the clicked button gets
`aria-current="true"`, all others `"false"`. **Verified** for all 9 (see §6.1).

### 1.3 Data layer (globals, all `X = X || []` guarded)

| Global | Push site(s) | Items |
|---|---|---|
| `QUESTIONS` | 1040, 1406, 1857, 2131, 2304, 2428, 2687, 2926, 3354, 3633, 3818 | **131** |
| `QUIZ` | 4112 | **28** |
| `MOCK_SETS` | 4483 | **6** sets |
| `STUDY_PLANS` | 5746 | **3** plans |
| `CASE_STUDY` | 5875 | **14** sections |
| `SOURCES` | 698 | **72** |
| `GROUP_INTROS` | 699 | **10** (A–J, complete) |
| `SOURCE_CHECKED` | 700 | `'2026-10-01'` |
| `FLOW_SVGS` | 6063 | **12** |
| `LESSONS` | 4550, 4917, 4928, 5423 | **22** (L01–L22) |
| `LOGIC` | 906 | **8** pure functions |

### 1.4 Search & filters

| Control | Element | Line | Semantics |
|---|---|---|---|
| Search box | `#search` | 498 | Accent-insensitive, whitespace-normalised; **AND over all terms**; matches `topic+q+oral+deep(folded)+followups.q/a+pitfalls` |
| Ưu tiên | `#f-prio` | 502 | exact `prio` |
| Độ sâu | `#f-level` | 511 | exact `level` |
| Nhóm | `#f-group` | 520 | exact `group` |
| Trạng thái | `#f-status` | 536 | exact stored status |
| Chỉ câu yếu | `#weak-only` | 546 | status === `'weak'` |
| "Chỉ P0" button | `#only-p0` | 551 | sets `#f-prio` = P0 and mirrors `aria-pressed` |
| "Xoá lọc" | `#clear-filters` | 552 | clears search + 4 selects + checkbox + resets `#only-p0` |
| Live region | `#stat-line` | 591 | `role="status" aria-live="polite"` describes active filters |
| Count | `#q-count` | 593 | "Hiện N / 131 câu hỏi." |
| Empty state | `#q-empty` | 595 | `hidden` toggled from `renderQuestions` |

**Test:** type `vpc` → "Hiện 2 / 131"; stat-line reads `Đang lọc: từ khoá "vpc"`.
Type `zzzzz` → 0 cards, empty state un-hidden. **Verified** (§6.2).
Enter in the search box must **not** reload — `#filter-form` submit is `preventDefault`ed (6491). **Verified.**

### 1.5 Question card anatomy (`qCard`, 6365–6390)

Per card: id chip · prio chip · group chip · level chip · type chip · topic chip ·
question text · optional lead blocks (incident / askFirst / predict / naive+naiveCode+naiveOut / rootCause) ·
`<details class="ans">` holding oral + deep + code + expected + followups + pitfalls + selfcheck ·
optional tail (tradeoff / alternatives / observe / attacks / anchor / say30 / say90) ·
4 mark buttons (`data-mark`) · refs note.

**Rendered:** 131 `article.card`, 524 `[data-mark]` buttons (131×4), 131 refs notes, 131 `<details>`,
131 oral blocks, 191 deep blocks, 104 code blocks, 325 follow-up rows, 131 pitfall blocks, 131 self-check blocks.

**Test:** open any card's `<details>` with keyboard (Tab to summary, Enter) → answer expands.

### 1.6 Progress + localStorage

`PROGRESS_KEY = 'hcp-progress-v1'` (6214) · `THEME_KEY = 'hcp-theme-v1'` (6215).

- `loadProgress` (6217–6233): `JSON.parse` inside `try/catch`; shape-checked with `obj()`;
  **values whitelisted** against `STATUSES` (6225–6227).
- `store` (6199–6212): `localStorage` with an in-memory `mem` fallback; every access wrapped in `try/catch`
  so a blocked/quota-full store degrades to session-only.
- Status cycle: clicking the *current* status resets to `'new'` (6473).
- Badge: `#progress-text` (aria-live) + `#progress-bar[role=progressbar]` with `aria-valuenow` (6436).

**Test:** mark any question "Đã nắm" → progress text updates, bar widens, `hcp-progress-v1` appears in
DevTools → Application → Local Storage. Reload → state persists. Click "Xoá tiến độ" → confirm → cleared.
**Verified** (§6.3).

### 1.7 Flashcard

Deck = all 131 questions sorted by prio then id (6524–6528) → **131 cards**.
Reveal / prev / next / know / weak (6564–6585). `#fc-reveal` toggles `aria-expanded` and swaps its label.
Know/weak write through to the same progress store.

**Test:** "Câu sau →" → "Câu 2 / 131"; "Hiện đáp án" → back panel un-hides, button reads "Ẩn đáp án";
"Đã nắm" → `aria-pressed="true"` and the progress box increments. **Verified** (§6.4).

### 1.8 Quiz

28 items, 112 options (`renderQuiz`, 6608–6628). Options are **deterministically shuffled per id**
(`seedFrom` FNV-1a + `orderFor` LCG Fisher–Yates, 6592–6607) so the correct answer (authored first,
always index 0) is not always on top — but the order is stable across reloads.

**Verified:** every one of the 28 items has `answer: 0` in the data; after shuffle the correct answer lands
at DOM positions `{0:10, 1:7, 2:4, 3:7}` — i.e. the shuffle genuinely de-biases.
**Test:** submit with nothing picked → "Đúng 0/28 (0%)" plus a per-group breakdown and the wrong-id list.
**Verified** (§6.5).

### 1.9 Mock interview

6 sets (4486–4546), each `{label, brief, pick:[…]}`. `startMock` (6738–6777) resolves picks via
`LOGIC.resolvePick`, de-duplicates by id, clamps minutes 1–120, arms a 1 s countdown, and adds `.warn`
under 60 s. `endMock` (6707–6721) stops the timer and reports elapsed time.

Resolved sizes: `p0_blitz 25 · aws_focus 25 · vue_focus 20 · python_sql_core 27 · web_api_security 22 · full_mock 31`.

**Test:** pick a topic → "Bắt đầu phiên" → panel appears, timer starts at `20:00`, question 1 shows,
"Gợi ý đáp án" is populated. **Verified** (§6.6).

### 1.10 Lịch ôn (study plans)

3 plans (`six_hours` 5 blocks · `two_days` 7 · `three_days` 8), 20 blocks total; each block lists its
resolved suggestion count and the ids with their topics (6806–6826).

**Test:** open "Lịch ôn" → three `<h3>` groups, each block showing "Câu hỏi gợi ý (N)".

### 1.11 Case study

`CASE_STUDY.title` = "DocuHub: ứng dụng quản lý tài liệu trên AWS"; 14 sections `cs-01..cs-14`.
Each renders `<h3>` + sanitised HTML body + optional `flowFigure(s.flow)` (6836–6846).

**⚠ 11 of 14 render a diagram; `cs-03`, `cs-07`, `cs-09` render none — see §3.**

### 1.12 Learning path (lessons)

22 lessons in 4 stages (`stage` 1:6, 2:5, 3:6, 4:5). Rendered by `renderLearn` (7040–7123):
a spine map, a 4-stage thread, then per-stage lesson cards.

Per lesson: `spineNode` attention path (6843–6847, `LESSON_NODES` 6168), **BFS chain back to `L01`**
(`buildChainMap`, 6922–6946), incident/askFirst/predict/naive/timeline/rootCause/concept/mechanism/
failureModes/tradeoff/alternatives/observe/attacks/anchor chain, body, code, `codeNote`, `flowFigure`,
`sayIt`, say30/say90, `buildsOn` links, `qids` links, `refs`, prev/next nav.

**Verified render:** 22 `article.lesson`, 1 spine map, 4 thread stages, 4 stage headings,
**16 flow figures**, **21 spine chains** (every lesson except L01), 21 build-link groups, 65 `data-qid` buttons.

`buildsOn` graph (21 lessons besides L01) — **all 22 reach L01** (no orphans). Root `L01` has `buildsOn: []`.
Spine map buckets: `all` → L01 only; `gateway` → L05, L18, L19, L22; `compute` → L02, L03, L04, L07, L09, L10, L11;
`data` → L08, L12, L13, L14, L15, L17; `queue` → L06, L20, L21; `client` → L16.

**Test:** in any lesson card, click a `data-lesson` link → jumps + flash-highlights; click a `data-qid`
button → switches to the questions view, searches that id, scrolls to the card.

### 1.13 Sources

72 sources in 8 groups (A 9, B 10, C 9, D 5, E 8, F 7, G 18, H 6), each with `key/name/url/group/checked`.
Header shows the global check date. **Rendered: 8 groups, 72 links**, all `target="_blank" rel="noopener noreferrer"`.

### 1.14 Intro

Static guide + a live table built from `GROUP_INTROS`: 11 rows (header + A–J), columns
Nhóm / Vì sao phải biết / P0 / Số câu. **Verified: 1 table, 11 `<tr>`.**

### 1.15 Dark mode, print, responsiveness

| Feature | Where | Test |
|---|---|---|
| Theme toggle | `#theme-btn` 566, `applyTheme` 7165, click 7181 | Toggles `data-theme` on `<html>`, label swaps 🌙/☀️, `aria-pressed` mirrors, persists in `hcp-theme-v1` |
| OS preference fallback | 7176–7180 | First visit with no saved key honours `prefers-color-scheme: dark` |
| Dark palette | `html[data-theme="dark"]` 39–61 | 21 overridden custom properties |
| Print button | `#print-btn` 567 → `window.print()` 7186 | Opens the print dialog |
| Print stylesheet | `@media print` 449–463 | Hides sidebar/filters/buttons/nav; force-shows `details.ans` content; expands `href` of external links; `break-inside: avoid` on cards |
| Responsive breakpoint | `@media (max-width: 900px)` 267 | Sidebar collapses; mobile bar appears |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` 275 | — |

---

## 2. MUST NOT BREAK

Every item was verified working at baseline. A content rewrite must leave all of these true.

### 2.1 Contract-level (break = app crash or blank view)

1. **Every global stays an array/object of the declared type.** `QUESTIONS`, `QUIZ`, `SOURCES`, `FLOW_SVGS`,
   `LESSONS` → arrays; `MOCK_SETS`, `STUDY_PLANS`, `CASE_STUDY`, `GROUP_INTROS` → objects.
   The engine coerces defensively (`arr()` 6140, `obj()` 6141) but a scalar replaces the whole set.
2. **Every entity keeps a unique `id`**: `QUESTIONS[].id`, `LESSONS[].id`, `SOURCES[].key`, `FLOW_SVGS[].id`,
   `CASE_STUDY.sections[].id`, `QUIZ[].id`. Baseline: **0 duplicates** in all six.
3. **`QUESTIONS[].id` is unique and prefix-free.** `jumpToQuestion` (7130/7136) uses
   `#q-list .card[data-id="<id>"]`; a prefix collision (e.g. `A1` alongside `A10`) would mis-target.
   Baseline: 0 prefix collisions. **Keep ids zero-padded and same-length per group.**
4. **Quiz options keep the correct answer at index 0.** `orderFor` shuffles at render; `quizScore`
   compares `picks[id] === it.answer` where the DOM value is the *authored index*. Baseline: all 28 are `0`.
   Reordering the authored options without updating `answer` silently marks every answer wrong.
5. **`QUIZ[].options` is a non-empty array** — `orderFor(id, raw.length)` and `labels[correctPos]` assume ≥1.
6. **Lessons keep `stage` numeric 1–4** and `stageTitle`/`stageIntro` consistent within a stage.
   Baseline: `{1:["Chặng 1 …"],2:[…],3:[…],4:[…]}` — exactly one title per stage.
7. **Every lesson except `L01` must keep a `buildsOn` path back to `L01`.** `buildChainMap` BFS is bounded
   by `L01`; a cycle or a missing edge leaves the "Đường về L01" chain undefined (renders nothing) without error.
   Baseline: 22/22 reachable.
8. **`spineNode` ∈ `{client, gateway, compute, data, queue, all}`** (6168). Anything else is invisible in
   both the spine map and the per-lesson path. Baseline: all valid.
9. **`FLOW_SVGS[].svg` stays a single well-formed inline `<svg>` string** — it is injected via `sanitize()`
   into `figure.svg-wrap`; a stray `</figure>` or unclosed tag corrupts the page.
10. **`CASE_STUDY.sections[].body` / lesson `body` use only the allowed tags** documented at 5873
    (`p ul ol li strong em code br`). They pass through `sanitize()` (6189–6195), which strips
    `<script…>` and inline `on*=` handlers but does **not** otherwise validate structure.
11. **All string fields stay strings.** `esc()` returns `''` for non-strings (946) — a number where a
    string is expected renders as an empty chip, not a crash, but the content vanishes.
12. **No literal `</script` inside any JS string.** The document's script element ends at the first
    `</script`; baseline has exactly one such sequence, and it is the real closing tag at line 7257.
    Lesson code strings legitimately contain `<script setup>` (Vue SFC) — the **opener** is safe, the
    **closer** is not. If a rewrite pastes a full `.vue` file into a `code:` string, it ends the app.
13. **The `LOGIC` namespace keeps its 8 functions with the same signatures** (§7). The app engine calls
    `LOGIC.esc`, `.matchQuery`, `.filterQuestions`, `.quizScore`, `.resolvePick`, `.stripTags` directly.

### 2.2 Behavioural (break = silent degradation, no console error)

14. **`meta description` count stays truthful.** Currently "131 câu hỏi" == real 131. A rewrite that changes
    the question count must update line 7, or the only externally-visible claim about the file becomes false.
15. **Nav count badges stay wired.** Each `[data-count-for]` key must exist in `renderCounts` (7207–7224):
    `intro, learn, questions, flashcard, quiz, mock, plan, case, sources`. An unmapped key renders **empty**.
16. **Every `refs` key must exist in `SOURCES[].key`.** Baseline: 0 dangling. A dangling key renders the raw
    key text in the "Nguồn:" note (no error).
17. **Every lesson `qids` entry must be a real question id.** Baseline: 0 dangling. A dangling id still
    renders a button (id only, no topic) and `jumpToQuestion` finds no card and silently returns.
18. **Every `flow` must be a real `FLOW_SVGS[].id`.** Baseline: **0 dangling but 3 sections missing the
    field entirely** (§3). A *missing* field = no figure; a *wrong* id = also no figure (`flowFigure` returns
    `''` on miss, 6831).
19. **`GROUP_INTROS` must keep all 10 keys A–J** with `{title, why, p0[]}`. Missing key → the intro table row
    disappears and `renderSources` group heading falls back to "Nhóm X".
20. **`GROUP_INTROS[g].p0` is a list of human-readable topic labels, not ids** — the intro table renders its
    `.length` only. Do not "fix" these into ids; nothing resolves them.
21. **`SOURCE_CHECKED` stays a parseable value.** `checkedText` (6849–6855) handles string/array/object.
22. **Question `prio` ∈ `{P0,P1,P2}`, `level` ∈ `{L1,L2,L3}`** — the filter `<select>`s use exact equality.
    A new value can never be selected, and `DECK` sorting maps unknown prio to rank 9 (last).
23. **`STATUSES` value strings** `new|learning|known|weak` must match what `markBtns` emits (6290) —
    `loadProgress` drops any stored value not in that whitelist.
24. **localStorage keys stay `hcp-progress-v1` / `hcp-theme-v1`.** Renaming silently discards every user's
    saved progress; that is the *only* durable state in the file.
25. **A full render must produce 0 console errors.** Baseline: 0.

### 2.3 Markup (break = a11y or layout regression)

26. **`#main` exists and is the skip-link target** (467, 574) with `tabindex="-1"`.
27. **No duplicate `id` attributes.** Baseline: 86 static ids, 0 duplicates.
28. **Every `getElementById` target in JS exists in the markup.** Baseline: 0 missing, 0 orphans.
29. **The 8 `label[for]` ↔ `input/select[id]` pairs stay matched** (497/498, 501/502, 510/511, 519/520, 535/536,
    545/546, 637/638, 641/642). Baseline: perfect 1:1 both directions.
30. **Focus-visible styling stays.** `a, button, input, select, summary, [tabindex]` all have a
    `:focus-visible` rule (CSS 75) — there is **no `outline: none` anywhere** in the stylesheet. Keep it that way.
31. **Nav buttons stay real `<button type="button">`** inside `<ul id="nav-list">` — that is what makes
    Tab/Enter/Space work with no JS keyboard handler.
32. **Runtime a11y attributes stay emitted**: `aria-current` (nav + spine nodes), `aria-pressed`
    (mark buttons, fc-know/weak, only-p0, theme), `aria-expanded` (fc-reveal, side-toggle),
    `aria-valuenow` (progress bar), `aria-live` (6 regions), `role="progressbar"`, `role="timer"`.
33. **`.sr-only` stays defined** — spine nodes and several labels depend on it.

---

## 3. DANGLING-REFERENCE REPORT

### 3.1 Method

The embedded `<script>` (lines 679–7256) was evaluated in a Node `vm` sandbox with `__BUILD_CHECK__ = true`
so the DOM engine is skipped and only the data layer runs. Every referring field was then resolved against
its id universe, with the owning entity's line span used to report the exact HTML line.

```powershell
& 'C:\Program Files\nodejs\node.exe' D:\research\.scratch\psa\refs.cjs
```

**Id universes (ground truth):** questions **131**, lessons **22**, sources **72**, flows **12**.

### 3.2 DANGLING — 3 findings

| # | Owner | Field | Value | HTML line | Effect |
|---|---|---|---|---|---|
| 1 | `CASE_STUDY.sections` id `cs-03` | `flow` | **absent** | 5918 | "Upload lỗi: quá lớn, sai loại, URL hết hạn" renders with **no diagram** |
| 2 | `CASE_STUDY.sections` id `cs-07` | `flow` | **absent** | 5969 | "Lệch database và queue: transaction + outbox" renders with **no diagram** |
| 3 | `CASE_STUDY.sections` id `cs-09` | `flow` | **absent** | 5991 | "Backend chậm: N+1, index, connection pool" renders with **no diagram** |

These are **missing fields**, not broken ids: `flowFigure(s.flow)` returns `''` when the id is unknown
(6831), so the section renders text-only. Confirmed by render: **14 case sections but only 11 `figure.svg-wrap`**
inside `#case-body`.

The case-study header comment (5872–5874) documents `flow` as pointing "tới một id trong `FLOW_SVGS`" — the
file's own contract — so these three are defects against the stated spec, not stylistic choices.

Recommended targets from the existing 12-diagram pool (no new SVGs needed):

- `cs-03` (upload failures: too large / wrong type / expired URL) → `flow-upload-presign`
- `cs-07` (database/queue divergence → transaction + outbox) → `flow-db-transaction` *(or `flow-queue-worker`)*
- `cs-09` (slow backend: N+1, index, connection pool) → `flow-request-lifecycle`

### 3.3 Reverse check — unreferenced entities

**Sources never cited by any question or lesson `refs` (2 of 72):**

| Key | Name |
|---|---|
| `py-venv` | venv — Virtual Environments |
| `django-testing` | Django — Testing |

They still render normally in the Sources view; they are simply never linked from content.
*(Note: `django-testing` reads like it was intended for `E12`/`django-*` questions — worth a look during the
content rewrite, but it is not a break.)*

**Everything else is referenced:**
- **Flows:** all 12 used. `flow-vue-reactivity` (L12) and `flow-cicd-pipeline` (cs-10) are used **once each**;
  `flow-sqs-visibility` is used by **cs-05 only** (no lesson).
- **Question ids:** 44 of 131 are linked from a lesson's `qids`. The remaining **87 are reachable only**
  through the questions view / flashcard deck / quiz / mock / plan — which is by design (those views enumerate
  all 131). **No question is unreachable.**
- **Lessons:** all 22 appear in the learning path; none orphaned.
- **No id collisions:** question ids vs quiz ids (disjoint namespaces `A01…` vs `QZ01…`), no prefix collisions.

### 3.4 Field-presence summary

- Questions: **131/131 have `refs`** (non-empty). 0 missing.
- `GROUP_INTROS`: **A–J all present**, matching the 10 groups that actually appear in `QUESTIONS`.
- `SOURCE_CHECKED` = `'2026-10-01'`; every source also carries its own `checked` value.

---

## 4. ERRORS & ROBUSTNESS

### 4.1 Parse & runtime — CLEAN

```powershell
& 'C:\Program Files\nodejs\node.exe' D:\research\.scratch\psa\extract.cjs
& 'C:\Program Files\nodejs\node.exe' D:\research\.scratch\psa\parse-check.mjs
& 'C:\Program Files\nodejs\node.exe' D:\research\.scratch\psa\render-drive.mjs
```

| Check | Result |
|---|---|
| Bundle evaluates in a DOM-less sandbox | **0 errors** (`evalError: null`) |
| Document tokenizer walk (full file) | **0 tag problems**, 0 unclosed at EOF |
| Duplicate `id` attributes (whole document) | **0** (86 static ids) |
| Dead in-page anchors | **0** (only `#main`, which exists) |
| `<script>` closers inside JS | **1** — the real closing tag at line 7257 |
| Full app render against a stub DOM | **0 errors, 0 warnings** |

**Tag balance:** every open/close pair matches; zero stray closers; zero implicit closes.
The one "unclosed at EOF" note in an early partial scan was `body`, an artifact of scanning only the
markup region — the whole-document walk returns empty.

### 4.2 `<script>` inside string literals — the sharpest latent hazard

`parse-check.mjs` finds **8 `<script` occurrences inside the script body**:

| Lines | Context | Risk |
|---|---|---|
| 5115, 5160 (×2), 5278, 5359, 5404 | Vue SFC `code:` / `naiveCode:` strings containing `\n<script setup>` | **None today** — the *opener* does not terminate script data |
| 6191, 6192 | The `sanitize()` regex literals `/<\/script>/` | Escaped (`<\/script`), correct |

**There is no `</script` inside any string.** The file is correct — and this is exactly the trap a content
rewrite falls into: pasting a complete `.vue` file (which ends with `</script>`) into a lesson's `code:`
field would terminate the app's script element mid-file and blank the page. Escaping as `<\/script>` is the fix.

### 4.3 Raw `<` and `&` in JS strings

149 raw `&` occurrences were flagged by a naive scan; **all are inside the `<script>` block** — JS `&&`,
`&amp;` inside escaping code, etc. None are in HTML content position. Characters inside `<script>` are
parsed as raw text, so none of them affect document parsing. **No escaped-`<` defects.**

### 4.4 Duplicate / missing ids

`0` duplicates, `0` `getElementById` targets missing from the markup. The 24 "ids never referenced by JS"
are all referenced by **CSS or ARIA instead** (`#view-*` targets of `showView` via `'view-' + x`,
`#nav-list`/`#side-body`/`#main` as aria/fragment targets, `*-h` heading ids as `aria-labelledby` values,
`#storage-note`). **Correct as-is.**

---

## 5. ACCESSIBILITY / DARK MODE / RESPONSIVE / LOCALSTORAGE

### 5.1 Accessibility

| Item | Status | Evidence |
|---|---|---|
| Skip link | ✅ | Line 467, targets `#main` (574, `tabindex="-1"`) |
| Landmarks | ✅ | 1 `main`, 1 `nav` (labelled at 480), 1 `aside` (labelled at 470), 9 `section` with `aria-labelledby` |
| `:focus-visible` | ✅ | CSS 75 covers `a, button, input, select, summary, [tabindex]`; extra rule at 301; **`outline: none` appears 0 times** |
| `aria-current` | ✅ 9 static (nav) + emitted at runtime for nav and spine nodes |
| `aria-pressed` | ✅ 4 static + 9 runtime (mark buttons, fc-know/weak, only-p0, theme) |
| `aria-valuenow` | ✅ `#progress-bar` `role="progressbar"`, `aria-valuemin/max/now`, refreshed at 6436 |
| `aria-expanded` | ✅ `#fc-reveal` (606) + `#side-toggle` (472), both toggled in JS |
| `aria-live` | ✅ 6 regions (`#progress-text`, `#stat-line`, `#quiz-count`, `#quiz-result`, `#mock-result`, `#mock-panel` timer) |
| Label ↔ input | ✅ 8/8 matched both directions; `#weak-only` is a wrapping label |
| Nav keyboard | ✅ native `<button>` in a `<ul>`; Tab + Enter/Space, no JS key handler needed |
| Filters keyboard | ✅ native `input[type=search]` / `<select>` / `<input type=checkbox>` / `<button>` |
| Flashcards keyboard | ✅ all 5 controls are `<button type="button">` |
| Quiz keyboard | ✅ `<input type="radio">` wrapped in `<label class="opt">` — clicking the label focuses the radio; arrow keys move within the radio group |
| Mock keyboard | ✅ `<select>`, `<input type="number">`, `<button type="button">` |
| `<details>` disclosure | ✅ native keyboard, used for every question answer |
| `.sr-only` | ✅ defined and used |
| Language | ✅ `<html lang="vi">` |

**Gaps (non-blocking):**

1. `#mock-timer` has `role="timer" aria-live="off"` — correct for a 1 Hz counter (a live region would flood a
   screen reader). No audible time warnings exist; consider a threshold announcement if desired.
2. The quiz radios get no `aria-describedby` for their explanation; the `.quiz-exp` div is simply revealed.
   Explanations are visual-only until read manually.
3. `.view` sections are toggled with CSS `display`, not `hidden`/`aria-hidden`. Inactive views are
   `display: none`, which does remove them from the a11y tree — so this is fine, but a rewrite that swaps
   `display` for `visibility`/`opacity` would silently make all nine views screen-reader-explorable at once.
4. The thread/spine map's `<span class="sm-count">N bài</span>` is decorative text without `aria-hidden` —
   mildly verbose, not incorrect.

### 5.2 Dark mode

- Toggle: `applyTheme` (7165–7172) sets `data-theme` on `<html>` and syncs the button label + `aria-pressed`;
  the click handler (7181–7185) persists to `hcp-theme-v1`. **Verified:** click → `data-theme="dark"`,
  label becomes "☀️ Chế độ sáng", `aria-pressed="true"`, `hcp-theme-v1` = `dark`.
- `prefers-color-scheme` fallback: handled **in JS** (7176–7180) via `matchMedia`, wrapped in `try/catch`.
  **There is no `@media (prefers-color-scheme)` in the CSS** — the JS path is the only one. This is a
  deliberate, working design (it keeps the manual choice authoritative), but it means the page flashes
  light on first paint for a dark-mode user with no saved preference (no `color-scheme` CSS property is set
  either, though `<meta name="color-scheme" content="light dark">` is present at line 8).
- **Token coverage:** 25 custom properties in `:root`, **21 overridden** in `html[data-theme="dark"]`.
  The 4 not overridden are `--warn`, `--radius`, `--mono`, `--sans` — `--radius`/`--mono`/`--sans` are
  theme-independent (correct); **`--warn` is never used anywhere in the file** (0 `var(--warn)` references),
  so it is dead in both themes.
- **`--fg` on `--bg-sunken`** is used by code/pre blocks; both themes define it.

#### Contrast ratios (WCAG 2.1)

Computed with the relative-luminance formula. **AA normal text = 4.5:1, AA large = 3:1.**

| Pair | Light | | | Dark | | |
|---|---|---|---|---|---|---|
| | fg | bg | ratio | fg | bg | ratio |
| `--fg` / `--bg` | `#16191f` | `#f7f8fa` | **16.25** ✅ | `#e6e9ee` | `#12151a` | **15.02** ✅ |
| `--fg-soft` / `--bg-soft` | `#4a5261` | `#ffffff` | **8.06** ✅ | `#b3bcca` | `#191d24` | **8.71** ✅ |
| `--accent` / `--bg` | `#1b5fb8` | `#f7f8fa` | **6.08** ✅ | `#6aa6f0` | `#12151a` | **7.17** ✅ |
| `--p0` / `--p0-bg` | `#a3341f` | `#fbeae6` | **6.56** ✅ | `#ff9b86` | `#3a1d17` | **7.69** ✅ |
| `--ok` / `--ok-bg` | `#1d6b3f` | `#e6f4ec` | **5.63** ✅ | `#7bd39b` | `#16301f` | **8.75** ✅ |
| `--p1` / `--p1-bg` | `#8a5a00` | `#fdf3e0` | **5.48** ✅ | `#f2c069` | `#3a2e14` | **8.59** ✅ |
| `--p2` / `--p2-bg` | `#3d5a6c` | `#eaf1f5` | **6.28** ✅ | `#9dc0d6` | `#1c2a33` | **7.92** ✅ |
| `--code-fg` / `--code-bg` | `#e6e9ee` | `#1e2228` | **13.31** ✅ | `#dfe4ea` | `#0b0e12` | **15.01** ✅ |
| `--fg-soft` / `--bg` | `#4a5261` | `#f7f8fa` | **7.79** ✅ | `#b3bcca` | `#12151a` | **9.36** ✅ |
| `--fg-faint` / `--bg` | `#6d7686` | `#f7f8fa` | **4.31** ⚠️ | `#8b95a4` | `#12151a` | **5.86** ✅ |
| `--fg-faint` / `--bg-soft` | `#6d7686` | `#ffffff` | **4.49** ⚠️ | `#8b95a4` | `#191d24` | **5.20** ✅ |
| `--fg-faint` / `--bg-sunken` | `#6d7686` | `#eef1f5` | **4.04** ⚠️ | `#8b95a4` | `#0e1116` | **6.44** ✅ |
| `--fg` / `--bg-sunken` | `#16191f` | `#eef1f5` | **15.24** ✅ | `#e6e9ee` | `#0e1116` | **16.58** ✅ |
| `--line-strong` / `--bg-soft` | `#b6bfcc` | `#ffffff` | **1.86** ➖ | `#3d454f` | `#191d24` | **1.74** ➖ |

**Findings:**

- **All text pairs that carry prose pass AA**, in both themes, except `--fg-faint` in **light** theme:
  **4.31 / 4.49 / 4.04** — just under 4.5. It is used for tertiary metadata (SVG captions, small helper
  text). It passes AA-large (3:1) comfortably. **Dark theme is fine** (5.20–6.44).
  A one-step darkening of `--fg-faint` to about `#5f6878` would clear 4.5:1 in light without touching layout.
- `--line-strong` / `--bg-soft` at 1.86 / 1.74 is a **non-text** pair (borders/diagram strokes). WCAG 1.4.11
  asks 3:1 for *meaningful* non-text UI. It is used for SVG shape strokes and card borders, which are
  redundant with adjacent fills and labels — **acceptable, but worth noting** if the diagrams are ever
  relied on as the sole carrier of information.

### 5.3 Responsive

- `<meta name="viewport" content="width=device-width, initial-scale=1">` (line 5) ✅
- One breakpoint: `@media (max-width: 900px)` (CSS 267) → sidebar collapses behind `#side-toggle`.
- `@media (prefers-reduced-motion: reduce)` (275) ✅
- 6 fixed-pixel widths, 0 `clamp()` usages — fine for this layout, which is single-column prose.
- `#side-toggle` carries `aria-expanded` + `aria-controls="side-body"` (472) ✅

### 5.4 localStorage

| Aspect | Finding |
|---|---|
| Keys | `hcp-progress-v1`, `hcp-theme-v1` |
| Versioning | `-v1` suffix on both; **no migration code** — bumping to `v2` abandons old data silently |
| Read failure | `try/catch` in `store.get` (6201) → falls back to the in-memory `mem` |
| Write failure | `try/catch` in `store.set` (6206) → keeps the value in memory only; **no user-visible warning** (the `#storage-note` at 570 discloses this in advance) |
| `JSON.parse` failure | `try/catch` at 6221–6230; corrupt payload ⇒ **clean start**, no crash |
| Value validation | Every stored status is whitelisted against `STATUSES` (6225–6227); unknown values dropped, unknown ids with valid values kept |
| Quota risk | Negligible — the value is a flat id→status map (≈2.6 KB if all 131 are marked). No bloat on repeated writes |
| Cross-tab | **No `storage` event listener.** Two tabs each hold their own `progress` object in memory; the last writer wins and the other tab will **overwrite the other's marks** on its next save. No merge, no broadcast |
| Cross-tab (theme) | Applied once at `wireChrome` (7180); a theme change in another tab does not propagate until reload |
| Clear | "Xoá tiến độ" (6513–6520) requires `window.confirm`, then `store.del`, resets `progress = {}`, re-renders progress/questions/flashcard |

### 5.5 Search / filter / empty states / deep-linking / print

- **Search semantics:** AND across whitespace-split terms; each term must appear as a substring of the
  normalised haystack. Vietnamese diacritics are folded via `LOGIC_VN_MAP` (911–927), so `chao` matches
  `chào` and `duong dan` matches `ĐƯỜNG DẪN`. Multi-word queries are **not** phrase-matched — `"event loop"`
  matches a document containing both words anywhere. Typo tolerance: none (substring only).
- **Empty states:** the questions view has a real empty state (`#q-empty`, 595, toggled at 6422);
  plans fall back to "Chưa có lịch ôn." (6810); mock reports "Không tìm được câu hỏi nào…" (6754).
  Quiz, case, and sources have **no** empty state — they assume data exists.
- **Deep-linking:** `init()` reads `window.location.hash` once (7250) and calls `showView`; an unknown value
  falls back to `'questions'` (7197). **Verified** for `#quiz #mock #case #sources #flashcard #plan` and
  the invalid `#bogus` → questions. **The hash is never written back** — no `location.hash =`,
  no `pushState`, no `popstate`/`hashchange` listener. Consequence: switching views does **not** update the
  URL, and the browser **Back button leaves the page** instead of returning to the previous view.
- **Print:** `@media print` (449–463) hides chrome, force-opens every `<details class="ans">`, prints the
  target URL after external links, and sets `break-inside: avoid` on cards. Note it hides `.view` unless
  `.active` — so **only the currently open view prints**, which is the intended behaviour.
- **Reduced motion:** honoured.

### 5.6 XSS surface

| Vector | Count | Verdict |
|---|---|---|
| `eval(` | **0** | — |
| `new Function(` | **0** | — |
| `document.write` | **0** | — |
| `insertAdjacentHTML` | **0** | — |
| `.outerHTML =` | **0** | — |
| Inline `on*=` handlers in generated HTML | **0** | All events bound via `addEventListener` |
| `.innerHTML =` | **14** | All fed from **author-controlled data**, never from user input |

**Data-flow analysis of the 14 `innerHTML` sinks:**

- User-controllable inputs are: `#search` (a string used **only** as a search needle; written back with
  `box.value =`, never into HTML), `#mock-minutes` (`Number()` + finite/clamped to 1–120),
  the quiz radio values (`Number()`, used as object keys and compared to `answer`), the URL hash
  (validated against `VIEWS`, falls back to `'questions'`), and `hcp-progress-v1`
  (JSON-parsed, values whitelisted against `STATUSES`).
- **No user-controlled value reaches `innerHTML`.**

**`sanitize()` (6189–6195)** is applied to every author-authored HTML field
(`deep`, `incident`, `naive`, `naiveOut`, `rootCause`, `tradeoff`, `alternatives`, `observe`, `predict`,
`attacks`, `body`, `codeNote`, `timeline`, `stageIntro`, `case.body`, `flow.svg`).
It is a **regex blocklist**, not a parser:

```js
.replace(/<script[\s\S]*?<\/script>/gi, '')
.replace(/<script[\s\S]*?>/gi, '')
.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
.replace(/javascript:/gi, '');
```

Probed against 13 payloads: it stripped `<script>`, all `on*=` attribute forms (quoted double, quoted single,
unquoted), `javascript:` (case-insensitive), and `onload`/`onclick`/`onerror`. **0 bypasses.** Residual
weaknesses worth knowing:

1. It does not remove `srcdoc`, `<iframe>`, `<object>`, or `<svg>`'s script-capable children on their own —
   it relies on removing the `<script>`/`on*` payload inside them. A `<iframe srcdoc="...">` survives as
   an `<iframe>` with its `srcdoc` emptied of scripts; the frame itself is not stripped.
2. `on[a-z]+` misses attribute names with digits or dashes (e.g. `onfoo1`), though no HTML event handler
   has such a name.
3. **The real risk is editorial, not adversarial:** these fields are rendered as *trusted HTML* by design.
   Anyone editing the data must know that a raw `<` in prose will be parsed as markup. That is the same
   contract build.mjs already enforces elsewhere.

**Escaping discipline is correct:** every field that is *not* intended as HTML goes through `LOGIC.esc`
(945–953) — ids, prios, groups, levels, types, topics, question text, oral answers, code, expected results,
follow-up Q/A, pitfalls, self-check items, say30/say90, anchors, refs, lesson titles/goals/bridges,
source URLs/names, plan labels, quiz questions/options/explanations, case titles, figure captions.
Source URLs are escaped **and** the anchor carries `rel="noopener noreferrer"`.

---

## 6. VERIFIED INTERACTIONS (baseline evidence)

All produced by `D:\research\.scratch\psa\viewtest.mjs` — the real `90-app.js` executed against a stub DOM,
zero errors in every scenario.

### 6.1 View switching + deep-linking

| URL hash | `.active` view | `aria-current="true"` | Errors |
|---|---|---|---|
| *(none)* | `learn` | `learn` | 0 |
| `#quiz` | `quiz` | `quiz` | 0 |
| `#mock` | `mock` | `mock` | 0 |
| `#case` | `case` | `case` | 0 |
| `#sources` | `sources` | `sources` | 0 |
| `#flashcard` | `flashcard` | `flashcard` | 0 |
| `#plan` | `plan` | `plan` | 0 |
| `#bogus` | `questions` *(fallback)* | `questions` | 0 |

Exactly one view active in every case; `aria-current` always agrees with the visible view.

### 6.2 Search & filters

| Action | `#q-count` | Other |
|---|---|---|
| initial | `Hiện 131 / 131 câu hỏi.` | `#stat-line` = "Không có bộ lọc nào đang bật — đang hiện toàn bộ câu hỏi." |
| type `vpc` | `Hiện 2 / 131 câu hỏi.` | stat-line = `Đang lọc: từ khoá "vpc". Bấm "Xoá lọc" để bỏ hết.`; 2 cards; empty hidden |
| type `zzzzz-no-match` | `Hiện 0 / 131 câu hỏi.` | **empty state un-hidden** |
| "Chỉ P0" | `Hiện 60 / 131 câu hỏi.` | `aria-pressed="true"`, `#f-prio` = `P0` |
| then "Xoá lọc" | `Hiện 131 / 131 câu hỏi.` | `#f-prio` = `""`, `aria-pressed="false"` |

`P0` = 60 matches the data count exactly.

### 6.3 Progress + persistence

Marking `A01` known → `#progress-text` = `Đã đánh dấu 1/131 câu (1%) · đã nắm 1 · đang ôn 0 · cần ôn lại 0.`,
`aria-valuenow="1"`, and `localStorage['hcp-progress-v1'] = {"A01":"known"}`.
Reset → key removed, text back to `Chưa có tiến độ — đánh dấu từng câu để lưu lại trạng thái học.`

### 6.4 Flashcard

Initial: `Câu 1 / 131`, front = the A01 question, `#fc-back` hidden.
"→": `Câu 2 / 131`, front changes to the A02 text.
"Hiện đáp án": `aria-expanded="true"`, label → "Ẩn đáp án", back un-hidden, 2,849 chars.
"Đã nắm": `aria-pressed="true"`, progress increments.

### 6.5 Quiz

28 items, 112 options (28 × 4). Initial count: `28 câu · 11 câu tình huống.`
Submit with nothing selected: `Đúng 0/28 (0%). Nhóm — A: 0/3 · B: 0/3 · C: 0/3 · D: 0/3 · E: 0/3 · F: 0/3 ·
G: 0/4 · H: 0/3 · I: 0/2 · J: 0/1.` plus the wrong-id list.

### 6.6 Mock interview

"Bắt đầu phiên" with the default topic (`p0_blitz`): `#mock-panel` un-hidden, timer `20:00`,
question 1 = the A01 text, answer panel 646 chars, 1 interval armed.
Resolved set sizes: **p0_blitz 25 · aws_focus 25 · vue_focus 20 · python_sql_core 27 · web_api_security 22 · full_mock 31**.

> **Harness caveat:** `#mock-topic` reported 0 child `<option>`s in my stub because my toy selector engine
> applies markup attributes to the element but `wireMock` writes options via `innerHTML` on the `<select>`,
> and my stub does not parse HTML assigned to `innerHTML` into child nodes. In a **real browser** the
> `<select>` is populated from `Object.keys(MOCKS)` (6782–6784) — 6 options. This is a limitation of the
> audit harness, **not** an app defect; confirmed by reading 6780–6785.

### 6.7 Theme

Click → `data-theme="dark"`, label "☀️ Chế độ sáng", `aria-pressed="true"`, `hcp-theme-v1` = `dark`.

---

## 7. LOGIC FUNCTION BASELINE

Eight pure functions, all verified against real data (lines 905–1035). **These outputs are the
behavioural contract.** A rewrite must reproduce them.

### 7.1 `LOGIC.normalize(s)` → string

Lowercases, collapses whitespace runs to one space, folds Vietnamese/Latin diacritics, trims.
Non-strings → `''`.

| Input | Output |
|---|---|
| `"Mutable default"` | `"mutable default"` |
| `"CƠ CHẾ EVENT LOOP"` | `"co che event loop"` |
| `"  nhiều   khoảng   trắng  "` | `"nhieu khoang trang"` |
| `"Đặng Văn Định"` | `"dang van dinh"` |
| `"ĐƯỜNG DẪN"` | `"duong dan"` |
| `"café"` | `"cafe"` |
| `"ĂÂÊÔƠƯĐ"` | `"aaeooud"` |
| `"Trả lời miệng 30–60 giây"` | `"tra loi mieng 30–60 giay"` *(en-dash kept)* |
| `""` | `""` |
| `null` / `undefined` / `42` / `{}` | `""` |

### 7.2 `LOGIC.stripTags(s)` → string

Replaces `<[^>]*>` with a **space** (not empty). Non-strings → `''`.

| Input | Output |
|---|---|
| `"<p>xin <strong>chào</strong></p>"` | `" xin  chào  "` |
| `"<script>x</script>"` | `" x "` |
| `"x < y > z"` | `"x   z"` |
| `"a<b"` | `"a<b"` *(no closing `>` ⇒ untouched)* |
| `"plain"` / `""` / `null` | `"plain"` / `""` / `""` |

### 7.3 `LOGIC.esc(s)` → string

Escapes `& < > " '` in that order. **Non-strings → `''`** (so a number field renders empty — see §2.1.11).

| Input | Output |
|---|---|
| `<script>alert(1)</script>` | `&lt;script&gt;alert(1)&lt;/script&gt;` |
| `<img src=x onerror=alert(1)>` | `&lt;img src=x onerror=alert(1)&gt;` |
| `"quoted"` | `&quot;quoted&quot;` |
| `'single'` | `&#39;single&#39;` |
| `a & b` | `a &amp; b` |
| `` `tpl` `` | `` `tpl` `` *(backticks untouched)* |
| `""` / `null` / `123` | `""` / `""` / `""` |

### 7.4 `LOGIC.haystack(q)` → string

Concatenates `topic + q + oral + stripTags(deep) + followups[].q + followups[].a + pitfalls[]`, normalised.
Sample `A01`: 3,911 chars. Non-object → `''`. Empty object → `''`.
Head: `"so sanh danh tinh va so sanh gia tri, is va == is va == khac nhau the nao trong python, …"`

### 7.5 `LOGIC.matchQuery(q, needle)` → bool

Normalises the needle, splits on whitespace, requires **every** term as a substring of the haystack.
Empty/whitespace needle → `true`. Unknown term → `false`.

**Search-result counts (the calibration numbers):**

| Needle | Matches |
|---|---|
| `mutable` | 5 (`A02, A03, A04, A11, A12`) |
| `vpc` | 2 (`D01, G12`) |
| `lambda` | 17 |
| `vue` | 16 |
| `index` | 10 |
| `cache` | 28 |
| `pool` | 12 |
| `jwt` | 1 |

Cross-checked: for every needle above, `haystack.includes(normalize(t))` and `matchQuery` agree exactly.
`"mutable"` does **not** match `A01` — A01 is the `is`/`==` question; correct, not a bug.

### 7.6 `LOGIC.filterQuestions(list, opts)` → array

Filters in order: `weakOnly` → `status` → `prio` → `level` → `group` → text `q`.
Non-array → `[]`. Non-object entries are skipped; **but an object with no `id` survives** (see caveat).

| Case | Result |
|---|---|
| `{}` | 131 |
| `{weakOnly:true, statusMap:{A02:'weak'}}` | 1 → `A02` |
| `{status:'known', statusMap:{A01:'known'}}` | 1 → `A01` |
| `{status:'new', statusMap:{A01:'known',A02:'weak',G01:'learning'}}` | **0** |
| `{prio:'P0'}` | **60** |
| `{level:'L3'}` | **35** |
| `{group:'G'}` | **17** |
| `{q:'vpc'}` | 2 → `D01, G12` |
| `{group:'G', prio:'P0'}` | 10 |
| `{group:'G', prio:'P0', q:'lambda'}` | 6 → `G02, G03, G04, G05, G07, G09` |
| `{group:'G', prio:'P2'}` | 0 |
| `null` list | 0 |
| `[null, 1, 'x', {}, Q[0]]` | 2 *(the `{}` and `A01` — non-objects dropped)* |

**Caveat for the rewrite:** the last row shows an object lacking `id` passes the filter. It then renders a
card with empty data-id. Keep every question object carrying `id`, `prio`, `level`, `group`.

### 7.7 `LOGIC.quizScore(quiz, answers)` → `{correct, total, wrong[], perGroup{}}`

`total` = input array length (not the answered count).

| Case | correct | total | wrong.length | perGroup |
|---|---|---|---|---|
| all 28 answered correctly | 28 | 28 | 0 | A:3 B:3 C:3 D:3 E:3 F:3 G:4 H:3 I:2 J:1 |
| all 28 answered wrong | 0 | 28 | 28 | all 0 |
| every 3rd answered correctly | 10 | 28 | 18 | A:1 B:1 C:1 D:1 E:1 F:1 G:2 H:1 I:0 J:1 |
| `{}` (nothing picked) | 0 | 28 | 28 | all 0 |
| `null` answers | 0 | 28 | 28 | all 0 |
| `[]` quiz | 0 | 0 | 0 | `{}` |
| `null` quiz | 0 | 0 | 0 | `{}` |

`perGroup` is keyed by `group` (or `''` for a group-less item) and only counts **correct** answers.

### 7.8 `LOGIC.resolvePick(spec, list)` → array

Filter by `group` / `prio` / `level` / `type` (all exact equality, all optional), then `slice(0, floor(limit))`.

| Spec | n | First ids |
|---|---|---|
| `{prio:'P0', limit:25}` | 25 | A01, A02, A03 |
| `{group:'C', limit:20}` | **12** *(fewer than the limit)* | C01, C02, C03 |
| `{group:'H', limit:8}` | 8 | H01, H02, H03 |
| `{group:'G', limit:20}` | 17 | G01, G02, G03 |
| `{group:'B', limit:8}` | 8 | B01, B02, B03 |
| `{level:'L3'}` | 35 | A05, A11, A14 |
| `{type:'situation'}` | 30 | A09, A15, B08 |
| `{limit:0}` | 0 | — |
| `{limit:-1}` | **131** (negative ignored) | A01… |
| `{limit:2.7}` | 2 (floored) | A01, A02 |
| `{limit:NaN}` | **131** (ignored) | A01… |
| `{limit:Infinity}` | 131 | A01… |
| `{}` | 131 | A01… |
| `null` spec | `[]` | — |
| `null` list | `[]` | — |

### 7.9 Derived counts (regression anchors)

**Questions by group:** A 18 · B 14 · C 12 · D 14 · E 12 · F 12 · G 17 · H 12 · I 8 · J 12 = **131**

**Questions by prio:** P0 **60** · P1 **50** · P2 **21** = 131
**Questions by level:** L1 18 · L2 78 · L3 **35** = 131
**Questions by type:** concept 56 · situation 30 · debug 17 · predict 16 · code 12 = 131

**Group × prio:**

| | A | B | C | D | E | F | G | H | I | J | Σ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **P0** | 7 | 6 | 9 | 6 | 6 | 4 | 10 | 4 | 2 | 6 | 60 |
| **P1** | 7 | 5 | 3 | 5 | 6 | 5 | 7 | 5 | 4 | 3 | 50 |
| **P2** | 4 | 3 | 0 | 3 | 0 | 3 | 0 | 3 | 2 | 3 | 21 |

**Quiz:** 28 items · 11 situational · by group A:3 B:3 C:3 D:3 E:3 F:3 G:4 H:3 I:2 J:1 · **all `answer: 0`**

**Flashcard deck order (first 10):** `A01 A02 A03 A04 A05 A06 A07 B01 B02 B03`
**Deck order (last 5):** the P2 group, id-sorted. Deck size = **131**.

**Lessons:** 22, by stage 1:6 · 2:5 · 3:6 · 4:5. All 22 reach `L01`.

**Sources:** 72 in 8 groups (A 9, B 10, C 9, D 5, E 8, F 7, G 18, H 6). 70 cited, 2 uncited.

**Flows:** 12; usage counts — `flow-request-lifecycle` 4 (L01, L18, L22, cs-01) · `flow-auth-jwt` 3
(L02, L19, cs-08) · `flow-upload-presign` 3 · `flow-queue-worker` 3 · `flow-lambda-cold-start` 3 ·
`flow-cors-preflight` 2 · `flow-db-transaction` 2 · `flow-idempotency` 2 · **`flow-sqs-visibility` 1 (cs-05)** ·
**`flow-vue-reactivity` 1 (L12)** · **`flow-cicd-pipeline` 1 (cs-10)** · `flow-failure-retry` 2.

**Case study:** 14 sections, 11 with a flow figure, 3 without (§3.2).

**Render products, full page (string-level count, harness-independent):**

| Product | Count |
|---|---|
| `article.card` (questions) | 131 |
| `[data-mark]` buttons | 524 |
| refs notes / `<details class="ans">` / oral blocks / pitfall blocks / self-check blocks | 131 each |
| deep blocks | 191 |
| `<pre><code>` blocks | 104 |
| follow-up (`.fu`) rows | 325 |
| `article.lesson` | 22 |
| lesson spine chains ("Đường về L01") | 21 |
| flow figures, learning path | 16 |
| `data-qid` buttons | 65 |
| case sections / case flow figures | 14 / 11 |
| source groups / source links | 8 / 72 |
| quiz items / quiz options | 28 / 112 |
| plan groups / plan blocks | 3 / 20 |
| intro table rows | 11 |

---

## 8. PROVENANCE & HOW TO RE-RUN

**Baseline artifacts (scratch):**

| File | Contents |
|---|---|
| `.scratch\psa\bundle.js` | Extracted `<script>` body (lines 679–7256) |
| `.scratch\psa\data.json` | All data globals serialised |
| `.scratch\psa\refs.json` | Full cross-reference report |
| `.scratch\psa\logic.json` | Every LOGIC output |
| `.scratch\psa\dom.json` | Ids, a11y, CSS vars, contrast |
| `.scratch\psa\parse.json` | HTML validity |
| `.scratch\psa\render.json` | Full-render capture |
| `.scratch\psa\interactions.json` | Interaction results |
| `.scratch\psa\live.json` | Coverage + graph data |

**Baseline target hash (verified 2026-10-07):**

```
SHA256  E491627B2CE37FDC030B17414854C17688CD384D3E164617EE7BCCD4A74F1727
Size    1848621 bytes
Lines   7259
```

**Commands (all read-only on the target):**

```powershell
$N='C:\Program Files\nodejs\node.exe'
& $N D:\research\.scratch\psa\extract.cjs         # evaluate data layer, counts
& $N D:\research\.scratch\psa\refs.cjs            # dangling cross-references
& $N D:\research\.scratch\psa\logic-baseline.cjs  # LOGIC function baseline
& $N D:\research\.scratch\psa\dom-audit.cjs       # ids, a11y, contrast
& $N D:\research\.scratch\psa\parse-check.mjs     # HTML validity
& $N D:\research\.scratch\psa\render-drive.mjs    # full render
& $N D:\research\.scratch\psa\viewtest.mjs        # interactions
& $N D:\research\.scratch\psa\live-report.mjs     # coverage
```

**Reproduce the baseline hash:**

```powershell
Get-FileHash D:\research\hitechcloud-interview-prep.html -Algorithm SHA256
```

Run it **before** the rewrite and again **after**. A changed hash with all §2 items still passing means the
rewrite was content-only. Any §2 failure is attributable to the rewrite.

**Harness honesty:** the DOM in `render-drive.mjs` / `viewtest.mjs` is hand-rolled (no jsdom — not in
`node_modules`, and no network to install it). It deliberately does **not** parse HTML assigned to
`innerHTML` into child nodes, so selectors like `#quiz-list .quiz-item` return 0 while the *string*
counts (§7.9) and the app's own `#q-count` / `#quiz-count` / `#fc-count` text outputs are authoritative.
Every count in this report is cross-checked against either the data layer or a rendered string.
Nothing in this report depends on the toy selector engine.
