<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { esc, renderLinkedHtml, sanitizeSvg } from '../utils.js';
import store from '../store.js';

const props = defineProps({ lesson: { type: Object, required: true } });
const data = inject('data');
const progress = inject('progress');

const lesson = computed(() => props.lesson);
const lessonId = computed(() => (lesson.value ? String(lesson.value.id) : ''));
const lessonsAll = computed(() => (Array.isArray(data?.LESSONS) ? data.LESSONS : []));
const lessonIndex = computed(() => lessonsAll.value.findIndex((l) => l && String(l.id) === lessonId.value));
const totalLessons = computed(() => lessonsAll.value.length);
const lessonNo = computed(() => lessonIndex.value + 1);

// The stage intro belongs to the first bài of a chặng only: repeating it on every
// bài would make the reader skip past the same paragraph twelve times.
const isFirstOfStage = computed(() => {
  const idx = lessonIndex.value;
  if (idx <= 0) return true;
  const prev = lessonsAll.value[idx - 1];
  return !prev || prev.stage !== lesson.value?.stage;
});

const done = computed(() => Number((progress.value || {})[lessonId.value] || 0) >= 6);
function toggleDone() {
  const p = (progress.value || {})[lessonId.value] || 0;
  const newP = done.value ? Math.min(p, 5) : 6;
  progress.value = { ...progress.value, [lessonId.value]: newP };
  if (newP >= 6) store.markH5Completed(lessonId.value);
}

const emit = defineEmits(['open-lesson', 'close']);
function openNext() {
  const pos = lessonsAll.value.findIndex((l) => l && String(l.id) === lessonId.value);
  if (pos >= 0 && pos < lessonsAll.value.length - 1) emit('open-lesson', lessonsAll.value[pos + 1]);
  else if (pos >= 0) emit('close');
}
function openPrev() {
  const pos = lessonsAll.value.findIndex((l) => l && String(l.id) === lessonId.value);
  if (pos > 0) emit('open-lesson', lessonsAll.value[pos - 1]);
}

const SECTIONS = [
  { id: 'sec-1', num: '01', title: 'Bài toán' },
  { id: 'sec-2', num: '02', title: 'Cách làm ngây thơ' },
  { id: 'sec-3', num: '03', title: 'Mô hình & cơ chế' },
  { id: 'sec-4', num: '04', title: 'Nói 30/90 giây' },
  { id: 'sec-5', num: '05', title: 'CTO hỏi xoáy' },
  { id: 'sec-6', num: '06', title: 'Câu neo & đọc thêm' },
];

const TOC_IDS = SECTIONS.map((s) => s.id);

// The whole field, never a first paragraph or a first N items: the lesson is the
// unit of study, so truncating it silently dropped the part that answers the CTO.
function renderHtml(raw) {
  return renderLinkedHtml(raw, data?.LESSONS, lessonId.value);
}

const glossaryRows = computed(() => {
  const g = data?.LESSON_GLOSSARY;
  if (!g) return [];
  const entry = Array.isArray(g) ? g.find((e) => e && String(e.id) === lessonId.value) : g[lessonId.value];
  const rows = Array.isArray(entry) ? entry : (entry && Array.isArray(entry.rows) ? entry.rows : []);
  return rows.filter((r) => r);
});

const NL = String.fromCharCode(10);

const bridgeHtml = computed(() => {
  const b = String(lesson.value?.bridge || '');
  const paras = b.split(NL + NL).map((p) => p.trim()).filter(Boolean);
  const out = [];
  for (const p of paras) {
    if (p.startsWith('[')) {
      const sep = p.indexOf(']:');
      if (sep > 0) {
        const label = p.slice(1, sep);
        const rest = p.slice(sep + 2).trim();
        out.push('<p><strong>[' + esc(label) + ']:</strong> ' + renderHtml(esc(rest)) + '</p>');
        continue;
      }
    }
    out.push('<p>' + renderHtml(esc(p)) + '</p>');
  }
  return out.join('');
});

const askFirstList = computed(() => (Array.isArray(lesson.value?.askFirst) ? lesson.value.askFirst : []));

const predict = computed(() => (lesson.value && lesson.value.predict) || {});
const predictOpen = ref(false);

const timelineRows = computed(() => {
  const tl = Array.isArray(lesson.value?.timeline) ? lesson.value.timeline : [];
  return tl.filter((r) => Array.isArray(r) && r[0] != null).map((r) => ({ t: String(r[0]), v: String(r[1] || '') }));
});

// say90 is authored as labelled paragraphs ("[Nêu vấn đề (30s)]: ..."). Split on the
// blank line, pull the label out of the brackets, and render each đoạn on its own.
const say90Rows = computed(() => {
  const raw = String(lesson.value?.say90 || '');
  const parts = raw.split(NL + NL);
  const out = [];
  for (const part of parts) {
    const t = part.trim();
    if (!t) continue;
    if (t.startsWith('[')) {
      const sep = t.indexOf(']:');
      if (sep > 0) {
        out.push({ key: 'r' + out.length, label: t.slice(1, sep), content: t.slice(sep + 2).trim() });
        continue;
      }
    }
    out.push({ key: 'r' + out.length, label: '', content: t });
  }
  return out;
});

// Every diagram for this bài, in authored order. A missing id is skipped, never
// substituted with another bài's diagram.
const visualFigs = computed(() => {
  const l = lesson.value || {};
  const list = Array.isArray(l.visuals) ? l.visuals : [];
  const flows = Array.isArray(data?.FLOW_SVGS) ? data.FLOW_SVGS : [];
  const out = [];
  for (const v of list) {
    if (!v) continue;
    const id = typeof v === 'string' ? v : v.id;
    if (!id) continue;
    const f = flows.find((x) => x && x.id === id);
    if (!f || typeof f.svg !== 'string') continue;
    out.push({
      id,
      question: v && typeof v === 'object' && v.question ? String(v.question) : '',
      focus: v && typeof v === 'object' && v.focus ? String(v.focus) : '',
      caption: f.caption ? String(f.caption) : '',
      svg: f.svg,
    });
  }
  return out;
});

const analogy = computed(() => {
  const a = lesson.value?.analogy;
  return a && typeof a === 'object' ? a : null;
});
const analogyPairs = computed(() => (analogy.value && Array.isArray(analogy.value.pairs) ? analogy.value.pairs : []));

const QUESTIONS = computed(() => (Array.isArray(data?.QUESTIONS) ? data.QUESTIONS : []));
const qidChips = computed(() => {
  const qids = Array.isArray(lesson.value?.qids) ? lesson.value.qids : [];
  const chips = [];
  for (const qid of qids) {
    const qObj = QUESTIONS.value.find((x) => x && x.id === qid);
    chips.push({ qid, label: (qObj && qObj.topic ? qid + ' · ' + qObj.topic : qid).replace(/`/g, '') });
  }
  return chips;
});

const refDocs = computed(() => {
  const keys = Array.isArray(lesson.value?.refs) ? lesson.value.refs : [];
  const all = Array.isArray(data?.SOURCES) ? data.SOURCES : [];
  const out = [];
  for (const k of keys) {
    const s = all.find((x) => x && x.key === k);
    if (s) out.push(s);
  }
  return out;
});

const stripTicks = (s) => String(s == null ? '' : s).replace(/`/g, '');
const sayItList = computed(() => (Array.isArray(lesson.value?.sayIt) ? lesson.value.sayIt : []).map(stripTicks));
const buildsOnChips = computed(() => {
  const b = Array.isArray(lesson.value?.buildsOn) ? lesson.value.buildsOn : [];
  return b.map((id) => ({ id, label: 'Bài trước: ' + id }));
});

const attacksList = computed(() => (Array.isArray(lesson.value?.attacks) ? lesson.value.attacks : []));
const provenanceList = computed(() => (Array.isArray(lesson.value?.provenance)
  ? lesson.value.provenance.filter((p) => String(p || '').trim()).map((p) => String(p))
  : []));

const activeSec = ref('sec-1');
let io = null;
function goToSection(sid) {
  document.getElementById('hcp-' + sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function observeSects() {
  io?.disconnect();
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const sid = String(e.target.id || '').replace(/^hcp-/, '');
      if (e.isIntersecting) activeSec.value = sid;
    }
  }, { rootMargin: '-160px 0px -55% 0px', threshold: 0 });
  for (const s of TOC_IDS) {
    const el = document.getElementById('hcp-' + s);
    if (el) io.observe(el);
  }
}
onMounted(() => { nextTick(() => observeSects()); });
onBeforeUnmount(() => { io?.disconnect(); });
watch(lessonId, () => {
  activeSec.value = 'sec-1';
  openCode.value = false;
  openNaive.value = false;
  predictOpen.value = false;
  openQ.value = 0;
  nextTick(() => observeSects());
});

const openQ = ref(0);

// Code blocks are collapsed to a fixed height, never to a line count: a line
// limit has to guess where a statement ends, and every guess is wrong in some
// language (Python fields, SQL DDL, Vue SFC, bash). Height-clipping is purely
// visual — the full block stays in the DOM and one click reveals it.
const FOLD_LINES = 18;
const openCode = ref(false);
const openNaive = ref(false);
function codeLineCount(code) {
  const raw = String(code == null ? '' : code).replace(/\s+$/, '');
  return raw ? raw.split(NL).length : 0;
}
// A block folds only if it is long enough to need it. Short blocks must render
// with no clip and no fade: a fade without a button would hide the tail forever.
const codeFoldable = computed(() => codeLineCount(lesson.value?.code) > FOLD_LINES);
const naiveFoldable = computed(() => codeLineCount(lesson.value?.naiveCode) > FOLD_LINES);

// Render the whole block. Truncating by line count cut statements in half — a
// visible block ended on `FROM orders` or `return` with the rest hidden. Any
// line-count limit has to guess where a statement ends, and every guess is wrong
// in some language (Python fields, SQL DDL, Vue SFC, bash). So: no limit.
function codeHtml(code) {
  const lines = String(code == null ? '' : code).split(NL);
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const body = lines.map((l) => esc(l)).join(NL);
  return '<pre class="hcp-code"><code>' + body + '</code></pre>';
}
</script>

<template>
  <div class="hcp-lesson" v-if="lesson && lesson.id">
    <header class="hcp-lesson-header">
      <div class="hcp-lesson-header-in">
        <button type="button" class="hcp-back" aria-label="Về trang chủ" @click="emit('close')">← Về</button>
        <nav class="hcp-lesson-crumb" aria-label="Breadcrumb">Vở ôn · {{ lesson.stageTitle }} · Bài {{ lessonNo }} / {{ totalLessons }}</nav>
        <button type="button" class="hcp-btn hcp-done-btn" :class="{ done: done }" :aria-pressed="done" @click="toggleDone">{{ done ? 'Đã học' : 'Đánh dấu đã học' }}</button>
      </div>
    </header>

    <div class="hcp-lesson-shell">
      <div class="hcp-lesson-hero">
        <nav class="hcp-lesson-crumb-m" aria-hidden="true">Vở ôn · {{ lesson.stageTitle }} · Bài {{ lessonNo }} / {{ totalLessons }}</nav>
        <h1 class="hcp-lesson-title">{{ lesson.id }} · {{ lesson.title }}</h1>
        <div class="hcp-lesson-goal">
          <p class="hcp-lbl">Mục tiêu</p>
          <p class="hcp-goal">{{ lesson.goal }}</p>
        </div>
      </div>

      <div class="hcp-lesson-grid">
        <details class="hcp-toc">
          <summary class="hcp-toc-summary">Trong bài này</summary>
          <ol class="hcp-toc-list">
            <li v-for="s in SECTIONS" :key="s.id">
              <button type="button" class="hcp-toc-item" :class="{ active: activeSec === s.id }" @click="goToSection(s.id)">
                <span class="hcp-toc-num">{{ s.num }}</span>
                <span class="hcp-toc-title">{{ s.title }}</span>
              </button>
            </li>
          </ol>
        </details>

        <main class="hcp-lesson-main">
          <section id="hcp-sec-1" class="hcp-sec">
            <p class="hcp-sec-n">01</p>
            <h2 class="hcp-sec-h">Bài toán</h2>
            <div v-if="isFirstOfStage && lesson.stageIntro" class="hcp-prose hcp-stage-intro">
              <div v-html="renderHtml(lesson.stageIntro)"></div>
            </div>
            <div v-if="lesson.bridge" class="hcp-prose"><div v-html="bridgeHtml"></div></div>
            <p class="hcp-lbl">Sự cố</p>
            <div class="hcp-prose"><div v-html="renderHtml(lesson.incident || '')"></div></div>
            <ol v-if="askFirstList.length" class="hcp-asks">
              <li v-for="(a, i) in askFirstList" :key="i" v-html="renderHtml(esc(a))"></li>
            </ol>
            <div v-if="predict.q" class="hcp-predict">
              <p class="hcp-lbl">Dự đoán trước khi đọc</p>
              <div class="hcp-predict-q" v-html="renderHtml(predict.q)"></div>
              <template v-if="predict.a">
                <button type="button" class="hcp-btn hcp-reveal-btn" :aria-expanded="predictOpen" aria-controls="hcp-predict-a" @click="predictOpen = !predictOpen">Hiện đáp án</button>
                <div id="hcp-predict-a" class="hcp-predict-a" v-show="predictOpen" :hidden="!predictOpen" v-html="renderHtml(predict.a)"></div>
              </template>
            </div>
          </section>

          <section id="hcp-sec-2" class="hcp-sec">
            <p class="hcp-sec-n">02</p>
            <h2 class="hcp-sec-h">Cách làm ngây thơ</h2>
            <div class="hcp-prose"><div v-html="renderHtml(lesson.naive || '')"></div></div>
            <div class="hcp-fold" :class="{ 'is-open': !naiveFoldable || openNaive }">
              <div class="hcp-code" v-html="codeHtml(lesson.naiveCode)"></div>
              <div v-if="naiveFoldable && !openNaive" class="hcp-fold-fade" aria-hidden="true"></div>
            </div>
            <button v-if="naiveFoldable" type="button" class="hcp-fold-btn" :aria-expanded="openNaive" @click="openNaive = !openNaive">{{ openNaive ? 'Thu gọn' : 'Xem đủ ' + codeLineCount(lesson.naiveCode) + ' dòng' }}</button>
            <div class="hcp-callout-warn" v-if="lesson.naiveOut">
              <p class="hcp-callout-label">Kết quả thực tế</p>
              <div class="hcp-callout-body" v-html="renderHtml(lesson.naiveOut)"></div>
            </div>
            <table v-if="timelineRows.length" class="hcp-table hcp-timeline">
              <caption class="hcp-table-cap">Bảng 1 · Dòng thời gian</caption>
              <thead>
                <tr>
                  <th>Mốc</th>
                  <th>Việc</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in timelineRows" :key="i">
                  <td class="hcp-tl-m">{{ r.t }}</td>
                  <td class="hcp-tl-v">{{ r.v }}</td>
                </tr>
              </tbody>
            </table>
            <div class="hcp-root" v-if="lesson.rootCause">
              <p class="hcp-lbl">Nguyên nhân gốc</p>
              <div class="hcp-root-line" v-html="renderHtml(lesson.rootCause)"></div>
            </div>
          </section>

          <section id="hcp-sec-3" class="hcp-sec">
            <p class="hcp-sec-n">03</p>
            <h2 class="hcp-sec-h">Mô hình &amp; cơ chế</h2>
            <p v-if="lesson.concept" class="hcp-lbl">Bây giờ mới gọi tên khái niệm</p>
            <div v-if="lesson.concept" class="hcp-prose"><div v-html="renderHtml(lesson.concept)"></div></div>
            <table v-if="glossaryRows.length" class="hcp-table hcp-gloss">
              <caption class="hcp-table-cap">Bảng 2 · Thuật ngữ</caption>
              <thead>
                <tr>
                  <th>Khái niệm</th>
                  <th>Là gì</th>
                  <th>Không phải là gì</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(g, i) in glossaryRows" :key="i">
                  <td class="hcp-g-term">{{ g.term }}</td>
                  <td>{{ g.is }}</td>
                  <td>{{ g.not || '' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="lesson.mechanism" class="hcp-lbl">Cơ chế bên trong</p>
            <div v-if="lesson.mechanism" class="hcp-prose"><div v-html="renderHtml(lesson.mechanism)"></div></div>
            <figure v-for="f in visualFigs" :key="f.id" class="hcp-figure">
              <p v-if="f.question" class="hcp-figure-q">{{ f.question }}</p>
              <div class="hcp-figure-svg" v-html="sanitizeSvg(f.svg)"></div>
              <figcaption v-if="f.caption || f.focus" class="hcp-figure-cap">
                <span v-if="f.caption">{{ f.caption }}</span>
                <span v-if="f.focus" class="hcp-figure-focus">Nhìn vào: {{ f.focus }}</span>
              </figcaption>
            </figure>
            <div v-if="analogy" class="hcp-analogy">
              <p class="hcp-lbl">Ví von</p>
              <p v-if="analogy.source" class="hcp-analogy-source">Hình ảnh: {{ analogy.source }}</p>
              <table v-if="analogyPairs.length" class="hcp-table hcp-analogy-table">
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Trong bài</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in analogyPairs" :key="i">
                    <td>{{ p.from }}</td>
                    <td>{{ p.to }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="analogy.breaks" class="hcp-analogy-breaks">
                <p class="hcp-lbl">Chỗ ví von gãy</p>
                <div v-html="renderHtml(esc(analogy.breaks))"></div>
              </div>
              <div v-if="analogy.transfer" class="hcp-analogy-transfer">
                <p class="hcp-lbl">Chuyển sang ca khác</p>
                <div v-html="renderHtml(esc(analogy.transfer))"></div>
              </div>
            </div>
            <div class="hcp-fold" :class="{ 'is-open': !codeFoldable || openCode }">
              <div class="hcp-code" v-html="codeHtml(lesson.code)"></div>
              <div v-if="codeFoldable && !openCode" class="hcp-fold-fade" aria-hidden="true"></div>
            </div>
            <button v-if="codeFoldable" type="button" class="hcp-fold-btn" :aria-expanded="openCode" @click="openCode = !openCode">{{ openCode ? 'Thu gọn' : 'Xem đủ ' + codeLineCount(lesson.code) + ' dòng' }}</button>
            <div class="hcp-code-note" v-html="renderHtml(lesson.codeNote || '')"></div>
            <div class="hcp-fail" v-if="lesson.failureModes">
              <p class="hcp-lbl">Lỗi thường gặp</p>
              <div class="hcp-fail-list" v-html="renderHtml(lesson.failureModes)"></div>
            </div>
          </section>

          <section id="hcp-sec-4" class="hcp-sec">
            <p class="hcp-sec-n">04</p>
            <h2 class="hcp-sec-h">Nói 30/90 giây</h2>
            <div class="hcp-say">
              <p class="hcp-say-label">30 giây</p>
              <p class="hcp-say-body" v-html="renderHtml(esc(lesson.say30 || ''))"></p>
            </div>
            <div class="hcp-say90">
              <p class="hcp-say-label">90 giây</p>
              <div v-for="r in say90Rows" :key="r.key" class="hcp-say90-part">
                <p v-if="r.label" class="hcp-say90-label"><strong>{{ r.label }}</strong></p>
                <p class="hcp-say-body" v-html="renderHtml(esc(r.content))"></p>
              </div>
            </div>
            <ol v-if="sayItList.length" class="hcp-chips hcp-sayit">
              <li v-for="(s, i) in sayItList" :key="i" class="hcp-chip-item"><span class="hcp-chip">{{ s }}</span></li>
            </ol>
          </section>

          <section id="hcp-sec-5" class="hcp-sec">
            <p class="hcp-sec-n">05</p>
            <h2 class="hcp-sec-h">CTO hỏi xoáy</h2>
            <p v-if="attacksList.length" class="hcp-lbl">Interviewer sẽ đào tiếp</p>
            <div v-if="attacksList.length" class="hcp-qa">
              <div v-for="(a, i) in attacksList" :key="i" class="hcp-qa-item" :class="{ open: i === openQ }">
                <button type="button" class="hcp-qa-q" :aria-expanded="i === openQ" @click="openQ = (i === openQ ? -1 : i)">
                  <span class="hcp-qa-qtext" v-html="renderHtml(a.q)"></span>
                  <span class="hcp-qa-ico" aria-hidden="true">{{ i === openQ ? '⌄' : '›' }}</span>
                </button>
                <div class="hcp-qa-a" v-show="i === openQ" :hidden="i !== openQ">
                  <div class="hcp-prose"><div v-html="renderHtml(a.a)"></div></div>
                </div>
              </div>
            </div>
            <p v-if="attacksList.length" class="hcp-qa-cap">Bảng 3 · {{ attacksList.length }} câu CTO, mở câu 1</p>
            <div v-if="lesson.tradeoff" class="hcp-prose"><div v-html="renderHtml(lesson.tradeoff)"></div></div>
            <div v-if="lesson.alternatives" class="hcp-prose"><div v-html="renderHtml(lesson.alternatives)"></div></div>
            <p v-if="lesson.observe" class="hcp-observe">
              <span class="hcp-lbl">Quan sát trên Production</span>
              <span class="hcp-observe-text" v-html="renderHtml(lesson.observe)"></span>
            </p>
            <div v-if="qidChips.length" class="hcp-chips">
              <a v-for="c in qidChips" :key="c.qid" class="hcp-chip" :href="'#/drill?ids=' + encodeURIComponent(c.qid)">{{ c.label }}</a>
            </div>
          </section>

          <section id="hcp-sec-6" class="hcp-sec">
            <p class="hcp-sec-n">06</p>
            <h2 class="hcp-sec-h">Câu neo &amp; đọc thêm</h2>
            <div v-if="lesson.anchor" class="hcp-band">
              <p class="hcp-band-lbl">Câu neo</p>
              <p class="hcp-band-a" v-html="renderHtml(esc(lesson.anchor))"></p>
            </div>
            <div v-if="lesson.body" class="hcp-prose"><div v-html="renderHtml(lesson.body)"></div></div>
            <div v-if="buildsOnChips.length" class="hcp-chips">
              <span v-for="b in buildsOnChips" :key="b.id" class="hcp-chip">{{ b.label }}</span>
            </div>
            <div v-if="refDocs.length" class="hcp-refs">
              <p class="hcp-lbl">Tài liệu đọc</p>
              <div class="hcp-refs-list">
                <a v-for="d in refDocs" :key="d.key" :href="d.url" target="_blank" rel="noopener noreferrer">{{ d.name }}</a>
              </div>
            </div>
            <details v-if="provenanceList.length" class="hcp-body-more">
              <summary>Ghi chú nguồn</summary>
              <ul class="hcp-prov-list">
                <li v-for="(p, i) in provenanceList" :key="i">{{ p }}</li>
              </ul>
            </details>
          </section>

          <footer class="hcp-lesson-footer">
            <div class="hcp-footer-pos">
              <button v-if="lessonIndex > 0" type="button" class="hcp-prev" @click="openPrev">Bài trước</button>
            </div>
            <button type="button" class="hcp-btn hcp-btn-primary hcp-next-btn" @click="openNext">Bài tiếp theo</button>
            <p class="hcp-footer-line">Bài {{ lessonNo }} / {{ totalLessons }} · {{ lesson.stageTitle }}</p>
          </footer>
        </main>

        <aside class="hcp-rail">
          <p class="hcp-rail-label">Trong bài này</p>
          <ol class="hcp-rail-list">
            <li v-for="s in SECTIONS" :key="s.id">
              <button type="button" class="hcp-toc-item" :class="{ active: activeSec === s.id }" @click="goToSection(s.id)">
                <span class="hcp-toc-num">{{ s.num }}</span>
                <span class="hcp-toc-title">{{ s.title }}</span>
              </button>
            </li>
          </ol>
          <p class="hcp-rail-sep"></p>
          <button type="button" class="hcp-rail-nav" :disabled="lessonIndex <= 0" @click="openPrev">Bài trước</button>
          <button type="button" class="hcp-rail-nav" @click="openNext">Bài tiếp theo</button>
        </aside>
      </div>
    </div>
  </div>
  <div v-else class="hcp-error">Bài chưa có dữ liệu.</div>
</template>

<style scoped>
.hcp-lesson { padding-bottom: 24px; }
.hcp-lesson-header { position: sticky; top: 64px; z-index: 40; background: var(--surface); border-bottom: 1px solid var(--line); }
.hcp-lesson-header-in { max-width: 1024px; margin: 0 auto; min-height: 64px; padding: 0 16px; display: flex; align-items: center; gap: 12px; }
.hcp-back { border: none; background: none; color: var(--accent-ink); font-size: 15px; font-weight: 600; cursor: pointer; padding: 0; min-height: 44px; display: inline-flex; align-items: center; }
.hcp-lesson-crumb { flex: 1; min-width: 0; font-size: 15px; color: var(--fg-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hcp-done-btn { font-size: 13px; padding: 7px 12px; min-height: 36px; border-color: var(--ok); color: var(--ok); }
.hcp-done-btn.done { background: var(--ok); color: var(--surface); }
.hcp-done-btn.done:hover { background: var(--ok-fill); }
.hcp-lesson-shell { max-width: 1024px; margin: 0 auto; }
.hcp-lesson-hero { padding: 64px 0 0; }
.hcp-lesson-crumb-m { display: none; font-size: 13px; color: var(--fg-3); margin: 0 0 4px; }
.hcp-lesson-title { margin: 0; font-size: 48px; line-height: 1.15; font-weight: 600; color: var(--fg); }
.hcp-lesson-goal { margin: 24px 0 0; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; }
.hcp-lbl { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: var(--fg-3); }
.hcp-goal { margin: 0; font-size: 17px; line-height: 1.6; color: var(--fg); }
.hcp-lesson-grid { display: grid; grid-template-columns: minmax(0, 720px) minmax(0, 240px); column-gap: 64px; margin-top: 96px; align-items: start; }
.hcp-toc { display: none; }
.hcp-lesson-main { min-width: 0; }
.hcp-rail { position: sticky; top: 152px; align-self: start; display: flex; flex-direction: column; gap: 4px; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; }
.hcp-rail-label { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--fg-3); }
.hcp-rail-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.hcp-toc-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px 4px; border: none; border-left: 2px solid transparent; background: none; border-radius: 6px 6px 6px 0; cursor: pointer; text-align: left; font: inherit; }
.hcp-toc-item:hover { background: var(--sunken); }
.hcp-toc-item.active { background: var(--accent-soft); border-left-color: var(--accent); }
.hcp-toc-item.active .hcp-toc-num { color: var(--accent-ink); }
.hcp-toc-item.active .hcp-toc-title { color: var(--accent-ink); }
.hcp-toc-num { font-family: var(--mono); font-size: 13px; font-weight: 400; color: var(--fg-3); }
.hcp-toc-title { font-size: 15px; color: var(--fg); }
.hcp-rail-sep { height: 1px; background: var(--line); margin: 8px 0; }
.hcp-rail-nav { display: block; width: 100%; text-align: left; padding: 8px 0; border: none; border-bottom: 1px solid var(--line); background: none; font: inherit; font-size: 15px; color: var(--accent-ink); cursor: pointer; }
.hcp-rail-nav:last-child { border-bottom: none; }
.hcp-rail-nav:disabled { opacity: 0.45; cursor: not-allowed; }

.hcp-sec { scroll-margin-top: 152px; }
.hcp-sec-n { margin: 0; font-family: var(--mono); font-size: 13px; font-weight: 400; color: var(--fg-3); line-height: 18px; }
.hcp-sec-h { margin: 8px 0 0; font-size: 34px; line-height: 1.2; font-weight: 600; color: var(--fg); }
.hcp-sec + .hcp-sec { margin-top: 96px; }
.hcp-prose { margin: 24px 0 0; font-size: 17px; line-height: 1.65; color: var(--fg); max-width: 600px; }
.hcp-prose p { margin: 0 0 12px; }
.hcp-prose p:last-child { margin-bottom: 0; }
.hcp-prose ul, .hcp-prose ol { margin: 0 0 12px; padding-left: 22px; display: flex; flex-direction: column; gap: 8px; }
.hcp-prose li { line-height: 1.6; }
.hcp-prose strong { color: var(--fg); font-weight: 600; }
.hcp-prose code { font-family: var(--mono); font-size: 14px; background: var(--sunken); padding: 1px 4px; border-radius: 4px; white-space: pre-wrap; overflow-wrap: anywhere; }
.hcp-prose, .hcp-prose * { overflow-wrap: anywhere; }
.hcp-prose > :last-child { margin-bottom: 0; }
.hcp-stage-intro { padding: 16px; background: var(--sunken); border-radius: 8px; max-width: none; }

.hcp-asks { margin: 24px 0 0; padding-left: 22px; display: flex; flex-direction: column; gap: 10px; font-size: 17px; line-height: 1.6; color: var(--fg); max-width: 600px; }
.hcp-asks li { overflow-wrap: anywhere; }

.hcp-predict { margin: 24px 0 0; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; max-width: 720px; }
.hcp-predict-q { font-size: 17px; line-height: 1.65; color: var(--fg); margin: 0 0 12px; overflow-wrap: anywhere; }
.hcp-reveal-btn { padding: 8px 14px; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.hcp-reveal-btn:hover { border-color: var(--fg-3); }
.hcp-predict-a { margin: 12px 0 0; font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.hcp-predict-a[hidden] { display: none; }

.hcp-figure { margin: 32px 0 0; max-width: 100%; min-width: 0; }
.hcp-figure-q { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--fg-2); }
.hcp-figure-cap { margin: 8px 0 0; font-size: 15px; color: var(--fg-3); }
.hcp-figure-focus { display: block; margin-top: 2px; color: var(--fg-2); }
.hcp-figure-svg { overflow-x: auto; max-width: 100%; min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); padding: 8px; }
.hcp-figure-svg :deep(svg) { display: block; width: 100%; min-width: 560px; height: auto; }

.hcp-analogy { margin: 32px 0 0; padding: 16px; background: var(--sunken); border-radius: 8px; max-width: 720px; }
.hcp-analogy-source { margin: 0 0 12px; font-size: 17px; line-height: 1.6; color: var(--fg); }
.hcp-analogy-breaks, .hcp-analogy-transfer { margin-top: 16px; font-size: 16px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }

.hcp-table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; }
.hcp-table caption { font-size: 15px; color: var(--fg-3); margin-bottom: 8px; text-align: left; }
.hcp-table th { background: var(--sunken); font-weight: 600; color: var(--fg); }
.hcp-table td { color: var(--fg-2); line-height: 1.55; }
.hcp-table td:first-child { color: var(--fg); font-weight: 600; }
.hcp-table th, .hcp-table td { overflow-wrap: anywhere; }
.hcp-table .num { text-align: right; font-family: var(--mono); white-space: nowrap; }
.hcp-timeline { margin-top: 32px; }

.hcp-code { margin: 40px 0 0; padding: 16px; border-radius: 8px; background: var(--code-bg); color: var(--code-fg); font-family: var(--mono); font-size: 15px; line-height: 1.6; overflow-x: auto; }
.hcp-code-note { margin: 12px 0 0; font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.hcp-code-note code { white-space: pre-wrap; overflow-wrap: anywhere; }
.hcp-fold { position: relative; margin-top: 40px; }
.hcp-fold .hcp-code { margin-top: 0; }
.hcp-fold:not(.is-open) { max-height: 400px; overflow: hidden; }
.hcp-fold-fade { display: none; }
.hcp-fold:not(.is-open) .hcp-fold-fade { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: 88px; background: linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--code-bg)); pointer-events: none; border-radius: 0 0 8px 8px; }
.hcp-fold-btn { display: inline-flex; align-items: center; gap: 6px; margin: 12px 0 0; padding: 8px 14px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: var(--fg); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.hcp-fold-btn:hover { border-color: var(--fg-3); }
.hcp-fold-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.hcp-callout-warn { margin: 16px 0 0; padding: 12px 16px; border-radius: 8px; background: var(--warn-soft); border: 1px solid var(--line); }
.hcp-callout-label { margin: 0 0 4px; font-size: 13px; font-weight: 600; color: var(--warn); }
.hcp-callout-body { margin: 0; font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.hcp-root { margin-top: 32px; max-width: 720px; }
.hcp-root-line { font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.hcp-fail { margin-top: 24px; }
.hcp-fail-list { font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }

.hcp-say { margin: 32px 0 0; padding: 24px; border-radius: 8px; background: var(--sunken); max-width: 720px; }
.hcp-say90 { margin: 16px 0 0; padding: 24px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); max-width: 720px; }
.hcp-say-label { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--fg-3); }
.hcp-say-body { margin: 0; font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.hcp-say90-part + .hcp-say90-part { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
.hcp-say90-label { margin: 0 0 6px; font-size: 15px; color: var(--accent-ink); }

.hcp-qa { margin: 32px 0 0; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); overflow: hidden; max-width: 720px; }
.hcp-qa-item { border-bottom: 1px solid var(--line); }
.hcp-qa-item:last-child { border-bottom: none; }
.hcp-qa-q { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border: none; background: transparent; color: var(--fg); font: inherit; font-size: 17px; font-weight: 600; text-align: left; cursor: pointer; line-height: 1.5; }
.hcp-qa-ico { flex: none; font-family: var(--mono); color: var(--fg-3); font-size: 16px; }
.hcp-qa-a { padding: 12px 16px 14px; font-size: 17px; line-height: 1.65; color: var(--fg); border-top: 1px solid var(--line); }
.hcp-qa-a[hidden] { display: none; }
.hcp-qa-cap { margin: 12px 0 0; font-size: 15px; color: var(--fg-3); }

.hcp-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 32px; max-width: 720px; }
.hcp-chip { display: inline-flex; align-items: center; font-size: 13px; font-weight: 600; background: var(--sunken); color: var(--accent-ink); border: none; border-radius: 6px; padding: 6px 12px; }
.hcp-chip-item { display: inline-flex; }
.hcp-sayit { list-style: none; padding: 0; }

.hcp-observe { display: block; margin: 24px 0 0; max-width: 720px; font-size: 15px; line-height: 1.6; color: var(--fg-2); }
.hcp-observe-text { display: block; margin-top: 4px; }

.hcp-band { margin-top: 24px; padding: 24px; background: var(--ok-soft); border: 1px solid var(--line); border-left: 3px solid var(--ok); border-radius: 8px; max-width: 720px; }
.hcp-band-lbl { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--ok); }
.hcp-band-a { margin: 0; font-size: 22px; line-height: 1.35; font-weight: 600; color: var(--ok); overflow-wrap: anywhere; }

.hcp-refs { margin-top: 32px; max-width: 720px; }
.hcp-refs-list { display: flex; flex-direction: column; gap: 6px; }
.hcp-refs-list a { color: var(--accent-ink); font-size: 15px; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }

.hcp-body-more { margin-top: 48px; }
.hcp-body-more summary { cursor: pointer; font-size: 15px; font-weight: 600; color: var(--accent-ink); }
.hcp-prov-list { margin: 12px 0 0; padding-left: 22px; display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.6; color: var(--fg-2); }
.hcp-prov-list li { overflow-wrap: anywhere; }

.hcp-lesson-footer { margin-top: 96px; padding-top: 24px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.hcp-footer-pos { display: flex; }
.hcp-prev { border: 1px solid var(--line); background: var(--surface); color: var(--fg-2); border-radius: var(--r-sm); padding: 8px 14px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.hcp-footer-line { margin: 0; font-size: 13px; color: var(--fg-3); }

@media (max-width: 900px) {
  .hcp-lesson-grid { grid-template-columns: minmax(0, 1fr); margin-top: 32px; }
  .hcp-toc { display: block; }
  .hcp-rail { display: none; }
}
@media (max-width: 640px) {
  .hcp-lesson-hero { padding: 40px 0 0; }
  .hcp-lesson-title { font-size: 34px; }
  .hcp-sec-h { font-size: 22px; }
  .hcp-sec + .hcp-sec { margin-top: 32px; }
  .hcp-sec { padding-top: 24px; border-top: 1px solid var(--line); }
  .hcp-figure-svg :deep(svg) { min-width: 480px; }
}
@media (max-width: 720px) {
  .hcp-lesson { padding-bottom: 88px; }
  .hcp-lesson-footer { position: fixed; left: 0; right: 0; bottom: var(--nav-h, 69px); z-index: 40; margin: 0; padding: 10px 16px; background: var(--surface); border-top: 1px solid var(--line); }
  .hcp-lesson-footer .hcp-next-btn { width: 100%; min-width: 0; }
  .hcp-lesson-footer .hcp-footer-line { display: none; }
}
</style>
