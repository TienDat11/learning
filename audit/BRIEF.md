# AUDIT BRIEF — `hitechcloud-interview-prep.html`

Read this file completely before doing anything. It is the contract for every audit
agent working on this artifact.

---

## 1. What the artifact is

A single-file, fully offline interview-preparation web app for a **Fullstack Engineer
(AWS, Python, VueJS)** interview. It contains 131 interview questions, 22 lessons,
28 quiz items, 6 mock-interview sets, 3 study plans, a case study, SVG flow diagrams,
flashcards, localStorage progress, filters, dark mode and search.

The product infrastructure is **already good**. Do not propose rewriting the UI, the
router, the storage layer, or the data shape. The problem under investigation is
**content quality, pedagogy, technical accuracy and retention**.

---

## 2. Layout and source of truth — READ THIS TWICE

```
D:\research\
  hitechcloud-interview-prep.html   <- THE DELIVERABLE (generated, 1.86 MB, ~7070 lines)
  build.mjs                         <- generator: concatenates src/*.js in filename order
  assets/style.css                  <- CSS, inlined into the HTML by build.mjs
  assets/body.html                  <- static DOM, inlined into the HTML by build.mjs
  src/*.js                          <- SOURCE OF TRUTH for all content and app logic
  tests/smoke.cjs                   <- 79 behavioural assertions over LOGIC + data
  audit/                            <- audit findings from an earlier repair round
```

`node build.mjs` regenerates the deliverable from `src/` + `assets/`. The round-trip
HTML → src → HTML has been verified byte-exact. **`src/` is authoritative.**

### YOU ARE READ-ONLY. Do not edit, write, move or delete any file. Do not run
`build.mjs`. Report findings; the Lead performs every edit.

### Prefer reading `src/` over the HTML
The HTML is one giant concatenated bundle. Reading `src/` gives you the same content
with stable, small line numbers that the Lead can act on directly. Cite locations as
`src/<file>:<line>`.

### Source file map

| File | Contents |
|---|---|
| `src/00-meta.js` | SOURCES (72 doc links), GROUP_INTROS (group A–J) |
| `src/05-logic.js` | pure helpers: `resolvePick`, `quizScore`, filter logic |
| `src/10-q-a.js` | questions **A01–A18** — Python |
| `src/11-q-b.js` | questions **B01–B14** — JavaScript / TypeScript |
| `src/12-q-c.js` | questions **C01–C12** — Vue 3 |
| `src/13-q-d1.js` | questions **D01–D07** — HTTP / Web / API / security |
| `src/13-q-d2.js` | questions **D08–D14** — HTTP / Web / API / security |
| `src/14-q-e.js` | questions **E01–E12** — FastAPI / Django / backend |
| `src/15-q-f.js` | questions **F01–F12** — PostgreSQL |
| `src/16-q-g.js` | questions **G01–G17** — AWS |
| `src/17-q-h.js` | questions **H01–H12** — Docker / Linux / CI-CD |
| `src/18-q-i.js` | questions **I01–I08** — DSA / system design |
| `src/19-q-j.js` | questions **J01–J12** — project discussion / communication |
| `src/20-quiz.js` | QUIZ — 28 multiple-choice items |
| `src/30-mock.js` | MOCK_SETS — 6 mock interview sets |
| `src/35-lessons-aws.js` | LESSONS (AWS-related) |
| `src/36-lessons-py.js` | LESSONS (Python-related) |
| `src/37-lessons-vue.js` | LESSONS (Vue-related) |
| `src/38-lessons-link.js` | LESSONS (linking/design) + the 22-lesson backbone |
| `src/40-plans.js` | STUDY_PLANS |
| `src/50-case.js` | CASE_STUDY (14 sections) |
| `src/60-flows.js` | FLOW_SVGS (12 inline SVG diagrams) |
| `src/90-app.js` | app engine: render, filter, flashcard, quiz, mock, localStorage |

There are **22 lessons, ids L01–L22**. Find them with `grep -n "id: 'L" src/*.js`.

---

## 3. Question object shape

```js
{
  id: 'A04', group: 'A', topic: '...', prio: 'P0'|'P1'|'P2', level: 'L1'|'L2'|'L3',
  type: 'concept'|'predict'|'debug'|'situation'|'code',
  q: '...',                 // the interview question
  oral: '...',              // 30-60s spoken answer, plain text
  deep: '<p>...</p>',       // HTML, the deep explanation
  code: 'raw source' | null,
  expected: '...',          // required for predict/debug
  followups: [ { q, a } ],  // P0: exactly 3
  pitfalls: [ '...', '...' ],
  selfcheck: [ '...', '...', '...' ],   // exactly 3
  refs: ['py-datamodel'],   // keys from SOURCES
  // --- optional pedagogical chain (currently only on the 60 P0 questions) ---
  incident, askFirst: [], predict: {q,a}, naive, naiveCode, naiveOut,
  rootCause, tradeoff, alternatives, observe, attacks: [{q,a}],
  say30, say90, anchor
}
```

`deep` may only use `<p> <ul> <ol> <li> <strong> <em> <code> <br> <table> <thead>
<tbody> <tr> <th> <td>`. `code` is **raw text**, never HTML-escaped.

---

## 4. Environment you can actually run

- **Python 3.13.x** — verify with `python --version`. Runnable snippets can be executed.
- **Node.js v24.18.1** — runnable JS snippets can be executed.
- **Vue 3.5.x** is in `node_modules` (no bundler, but `@vue/reactivity` can be imported).
- **No PostgreSQL server, no Docker, no browser automation, no network installs.**
  PostgreSQL/Docker/Linux findings must be documentation-based — say so explicitly.
- `web_search` may return nothing (no API key in this environment). Use **`web_fetch`**
  to open specific documentation URLs directly. Every factual claim you make must be
  traceable to a URL you actually opened.

---

## 5. The standard the content is held to

### 5.1 Interview depth contract
For every important topic, the material must let a learner answer all of:

`WHAT?` · `WHY does it exist?` · `WHAT problem existed without it?` · `HOW does it work
internally?` · `WHAT breaks under concurrency / crash / timeout?` · `TRADE-OFF?` ·
`ALTERNATIVE, and when is it better?` · `PRODUCTION signal to debug it?` ·
`WHAT CHANGES if one assumption is altered?`

If any is missing, the topic is **not interview-complete**.

### 5.2 Causal teaching contract
An important lesson must not open with a definition dump. The learner should first
**feel the need** for the concept:

```
problem -> naive solution -> why it seemed reasonable -> failure (observable symptom)
-> root cause -> the pressure that forces a better design -> the concept appears
-> internal mechanism -> correct implementation -> new failure modes it creates
-> trade-off -> when NOT to use it -> production observability -> interview ladder
-> memory anchor
```

The learner should be able to answer an unseen follow-up by **reasoning**, not recall.

### 5.3 Accuracy policy
- Correctness beats completeness.
- Distinguish rigorously between: language guarantee · implementation detail ·
  CPython-specific behaviour · framework behaviour · deployment-server behaviour ·
  cloud-service behaviour · default configuration · configurable behaviour ·
  raisable quota · hard platform limit.
- Never infer one product's behaviour from another's by analogy.
- Primary documentation outranks blogs, forums, tutorials and your own memory.
- Be suspicious of `always`, `never`, `exactly`, `guaranteed`, `only`, `all`.

---

## 6. Claims to verify independently (do not take the brief's word)

An earlier repair round **refuted most of these**. Verify each yourself against the
current file and against primary documentation, then report CONFIRMED or REFUTED with
evidence. If REFUTED, say what the file actually says and why it is correct.

1. A05: a closure/comprehension snippet whose documented result is wrong; the file
   allegedly teaches that a comprehension avoids closure late binding because each
   iteration makes a new cell.
2. "tuple is immutable therefore hashable" / "only immutable objects can be hashable".
3. Where Python function default values are stored — the file allegedly says "in the
   function's code object".
4. Django allegedly taught as inherently WSGI/synchronous (modern Django supports ASGI).
5. `def` vs `async def` guidance allegedly outdated versus current FastAPI docs.
6. Lambda "when not to use" allegedly cites needing unusual system libraries.
7. Lambda retry semantics allegedly collapsed into one vague "async retries" rule.
8. Any absolute claim anywhere in the document (`always`, `never`, `only`, `all`,
   `exactly`, `guaranteed`, `must`, `không bao giờ`, `luôn luôn`, `duy nhất`).

---

## 7. Known-remaining gaps (verify the numbers, then deepen)

Measured on the current bundle — re-measure before quoting:

| Gap | Measured |
|---|---|
| `attacks` field | present on **0 / 131** questions (present on 22/22 lessons) |
| `say30` / `say90` | present on **0 / 131** questions |
| `incident`, `askFirst`, `predict`, `anchor` | present on the **60 P0** questions only; **0 of 71** P1/P2 questions |
| `naive`, `rootCause`, `tradeoff`, `alternatives`, `observe` | **0 / 131** questions |
| Quiz | 28 items, every `answer` index is `0` in the data; the app shuffles display order via `orderFor()` — verify whether the correct option is still identifiable (e.g. by length) after rendering |
| `selfcheck[0]` | 91/131 are confidence self-reports of the form "Tôi vẫn chưa giải thích được…" |

---

## 8. Output format — return exactly this

Return a single markdown report. No preamble. Structure:

```markdown
# <DOMAIN> AUDIT — <your agent name>

## Verdict on the brief's claims
| # | claim | verdict | evidence |
|---|---|---|---|

## Defects found
### <ID> — <one-line title>
- **Where:** src/<file>:<line>  (quote the current text, max 3 lines)
- **Severity:** P0 | P1 | P2
- **What is wrong:** ...
- **Why it matters in an interview:** ...
- **Correct version:** ... (write the replacement text you would ship, in Vietnamese)
- **Evidence:** <URL you opened> — <what it says>
- **Confidence:** certain | high | medium | UNVERIFIED

## Topics that are not interview-complete
| topic | id | what is missing (WHAT/WHY/WITHOUT/HOW/FAILURE/TRADE-OFF/ALT/SIGNAL/CHANGED) |

## Executed examples
| snippet | command | observed output | documented output | match? |

## What I could not verify
```

**Severity guide**
- `P0` — factually wrong, or so shallow that a senior interviewer would end the
  interview. A candidate repeating it would be embarrassed.
- `P1` — misleading, incomplete, or teaches a wrong mental model without being
  strictly false.
- `P2` — style, typo, redundancy, formatting.

## 9. Rules

1. **Read-only.** Never modify a file.
2. **Evidence or silence.** Every claim cites either an executed command's output or a
   documentation URL you opened with `web_fetch`. No "I believe", no "typically".
3. **Execute what is executable.** Python and Node snippets that claim an exact result
   must be run. Report actual output. Write throwaway scripts only under
   `D:\research\.scratch\` if you must, and say so.
4. **Do not rubber-stamp.** Another agent's finding is not evidence. If you disagree
   with the brief or with a sibling audit, say so and show why.
5. **Find real defects, not stylistic preferences.** A finding must change what a
   learner would say in an interview.
6. **Do not propose UI rewrites.** The product shell is out of scope.
7. Vietnamese prose, technical terms in English (`cold start`, `event loop`,
   `idempotency`, `MVCC`, `closure`, `late binding`, `backpressure`, …).
8. Be concise. Dense findings beat long essays. No filler.
