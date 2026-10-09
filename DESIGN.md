# DESIGN.md — `hitechcloud-interview-prep.html`

Visual world record. Read alongside `CONTRACT.md` (which owns the data contract).
`local://lesson-ui-spec.md` holds the implementation-level values; this file holds the
reasoning, so the next person does not re-litigate it.

## What this is

A single self-contained HTML study tool for one person preparing for one specific job
interview (Fullstack Engineer, AWS/Python/VueJS, HiTechCloud). 134 questions with
answers, 23 lesson schematics, quiz, flashcards, mock interview, case study, study
plans, sources. Opened offline from disk, printed on paper, read for hours at a time.

Mode: **Operate + Read** — a reference instrument, not a landing page.
Dials: **VARIANCE 3 / MOTION 2 / DENSITY 7**.

## The world: "schematic manual"

The 23 lesson images are isometric technical schematics: matte shapes on an off-white
plate, one glowing blue rail showing data flow, and a strict semantic color legend —
blue = flow, green = allowed/success, amber = throttled/warning, red = denied/failure,
deep slate navy = structure, steel grey = neutral hardware.

The interface adopts that legend as its own palette. This is the whole idea, and it is
not decoration: the images and the chrome around them become one system, so an image
stops reading as a picture pasted into a document.

Consequences that follow from it:

- **One accent.** Blue is the only accent. Green/amber/red are *states*, not accents —
  they mark priority chips and the rail dots, never a background wash.
- **The rail is the structure.** The images' glowing rail becomes the vertical rail
  that runs down each lesson, with a colored dot per panel showing which phase of the
  teaching chain you are in. This replaced the old design's eight different tinted
  `border-left` panels, which is what made the page read as noisy rather than
  schematic.
- **Neutral panels.** Every panel is `--bg-soft` with a 1px `--line`. The single
  exception is the memory-anchor sentence, which gets `--ok-bg` because it is the one
  thing worth remembering.
- **The legend carries meaning, so it must not drift.** Adding a second accent, or
  tinting a panel for variety, breaks the correspondence the whole design rests on.

## Type

IBM Plex Sans (400–700, variable) + IBM Plex Mono (400/600), self-hosted as base64
woff2 subsets covering `latin` + `vietnamese`. Plex is a technical-documentation
typeface with a real Vietnamese subset — the content is Vietnamese with English
technical terms, so both scripts must be in the same face and neither may fall back to
a system default. Not Inter: Inter has no character here and is the LLM default.

Mono is reserved for things that are actually data or code: question ids, lesson ids,
code blocks, timers, counters, tabular numbers. It is never a "technical" costume.

## Reading

The content is ~217,000 px tall. It is read, not scanned. So: one left-aligned reading
column, `max-width: 880px` for lessons and a `72ch` measure inside panels, with the
deliberate asymmetric whitespace on the right. Code, tables, SVGs and figures may use
the full 880px.

## Constraints that override taste

1. **One file, offline.** No external fonts, no sibling assets, no network. Images and
   fonts are inlined as data URIs. This is a hard product promise, not a preference —
   it costs ~4.9 MB of HTML and that is the correct trade.
2. **Content is frozen.** No copy edits, no IA changes, no new sections, no renamed
   ids. `build.mjs` validates the DOM id set and `tests/smoke.cjs` validates the lesson
   graph; both must stay green.
3. **Nothing may become a landing page.** No hero, no marketing rhythm, no eyebrow
   labels, no section numbering.

## Anti-references

- The previous look: eight tinted `border-left` panels, `#a3341f`/`#8a5a00`/`#3d5a6c`
  phase colors that matched nothing, and body text running ~125 characters wide.
- Generic docs-site chrome: card grids, drop shadows on every block, gradient headers.
