<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { esc, renderLinkedHtml } from '../utils.js';
import store from '../store.js';
import { diagramUrl } from '../diagrams.js';

const props = defineProps({ lesson: { type: Object, required: true } });
const data = inject('data');
const progress = inject('progress');

const lesson = computed(() => props.lesson);
const lessonId = computed(() => (lesson.value ? String(lesson.value.id) : ''));
const lessonsAll = computed(() => (Array.isArray(data?.LESSONS) ? data.LESSONS : []));
const lessonIndex = computed(() => lessonsAll.value.findIndex((l) => l && String(l.id) === lessonId.value));
const totalLessons = computed(() => lessonsAll.value.length);
const lessonNo = computed(() => lessonIndex.value + 1);

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

const D2_SECTION = { L01: 2, L02: 2, L03: 2, L04: 2, L05: 2, L06: 3, L07: 3, L08: 2, L09: 5, L10: 3, L11: 5, L12: 2, L13: 3, L14: 3, L15: 3, L16: 3, L17: 3, L18: 5, L19: 3, L20: 5, L21: 3, L22: 3, L23: 3, L24: 2, L25: 2 };
const d2Section = computed(() => D2_SECTION[lessonId.value] || 0);
const d1Url = computed(() => diagramUrl(lessonId.value, 1));
const d2Url = computed(() => diagramUrl(lessonId.value, 2));

const SECTIONS = [
  { id: 'sec-1', num: '01', title: 'Vì sao' },
  { id: 'sec-2', num: '02', title: 'Cơ chế' },
  { id: 'sec-3', num: '03', title: 'Sự cố' },
  { id: 'sec-4', num: '04', title: 'Nói trong 30 giây' },
  { id: 'sec-5', num: '05', title: 'CTO hỏi xoáy' },
  { id: 'sec-6', num: '06', title: 'Câu neo' },
];

const TOC_IDS = SECTIONS.map((s) => s.id);

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

function renderHtml(raw) {
  return renderLinkedHtml(raw, data?.LESSONS, lessonId.value);
}

const mechanismProse = computed(() => {
  const mech = String(lesson.value?.mechanism || '');
  const open = mech.indexOf('<p>');
  const close = open >= 0 ? mech.indexOf('</p>', open) : -1;
  if (open >= 0 && close > open) return '<p>' + renderHtml(mech.slice(open + 3, close)) + '</p>';
  return mech ? '<p>' + renderHtml(mech) + '</p>' : '';
});

// §3 prose = đoạn mở của incident (spec: chỉ phần mở; phần còn lại vào timeline)
const incidentProse = computed(() => {
  const raw = String(lesson.value?.incident || '');
  const open = raw.indexOf('<p>');
  const close = open >= 0 ? raw.indexOf('</p>', open) : -1;
  if (open >= 0 && close > open) return '<p>' + renderHtml(raw.slice(open + 3, close)) + '</p>';
  return raw ? '<p>' + renderHtml(raw) + '</p>' : '';
});

// §5 prose = mệnh đề đánh đổi chính (spec: chỉ mệnh đề chính, không đổ cả khối trade-off)
const tradeoffProse = computed(() => {
  const raw = String(lesson.value?.tradeoff || '');
  const doc = new DOMParser().parseFromString('<div>' + raw + '</div>', 'text/html');
  const first = doc.querySelector('li') || doc.querySelector('p');
  if (!first) return raw ? '<p>' + renderHtml(raw) + '</p>' : '';
  const strong = first.querySelector('strong');
  if (strong) strong.remove();
  const text = (first.textContent || '').trim().replace(/^[:\s-]+/, '');
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return '<p>' + renderHtml(esc(sentences.slice(0, 2).join(' ').trim())) + '</p>';
});

const timelineRows = computed(() => {
  const tl = Array.isArray(lesson.value?.timeline) ? lesson.value.timeline : [];
  return tl.filter((r) => Array.isArray(r) && r[0] != null).map((r) => ({ t: String(r[0]), v: String(r[1] || '') }));
});

const rhythmRows = computed(() => {
  const l = lesson.value || {};
  const rows = [];
  if (l.say30) rows.push({ key: '__say30', label: '30 giây', content: String(l.say30), sec: '30s' });
  const parts = String(l.say90 || '').split(NL + NL);
  for (const p of parts) {
    if (!p.startsWith('[')) continue;
    const sep = p.indexOf(']:');
    if (sep < 0) continue;
    const label = p.slice(1, sep);
    const content = p.slice(sep + 2).trim();
    const lOpen = label.indexOf('(');
    const lClose = label.indexOf(')', lOpen);
    const sec = lOpen >= 0 && lClose > lOpen ? label.slice(lOpen, lClose + 1) : '';
    const cleanLabel = sec ? label.slice(0, lOpen) + label.slice(lClose + 1) : label;
    rows.push({ key: label, label: cleanLabel, content, sec });
  }
  return rows;
});

const altChips = computed(() => {
  const al = String(lesson.value?.alternatives || '');
  const doc = new DOMParser().parseFromString('<div>' + al + '</div>', 'text/html');
  const items = Array.from(doc.querySelectorAll('li'))
    .map((li) => (li.querySelector('strong')?.textContent || li.textContent || '').split(':')[0])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return items;
});

const QUESTIONS = computed(() => (Array.isArray(data?.QUESTIONS) ? data.QUESTIONS : []));
const qidChips = computed(() => {
  const qids = Array.isArray(lesson.value?.qids) ? lesson.value.qids : [];
  const chips = [];
  for (const qid of qids) {
    const qObj = QUESTIONS.value.find((x) => x && x.id === qid);
    chips.push({ qid, label: (qObj && qObj.topic ? qid + ' · ' + qObj.topic : qid).replace(/`/g, '') });
  }
  return chips.slice(0, 5);
});

const refDocs = computed(() => {
  const keys = Array.isArray(lesson.value?.refs) ? lesson.value.refs : [];
  const all = Array.isArray(data?.SOURCES) ? data.SOURCES : [];
  const out = [];
  for (const k of keys) {
    const s = all.find((x) => x && x.key === k);
    if (s) out.push(s);
  }
  return out.slice(0, 3);
});

const stripTicks = (s) => String(s == null ? '' : s).replace(/`/g, '');
const sayIt0 = computed(() => (Array.isArray(lesson.value?.sayIt) && lesson.value.sayIt.length ? stripTicks(lesson.value.sayIt[0]) : ''));
const sayItList = computed(() => (Array.isArray(lesson.value?.sayIt) ? lesson.value.sayIt : []).slice(0, 7).map(stripTicks));
const buildsOnChips = computed(() => {
  const b = Array.isArray(lesson.value?.buildsOn) ? lesson.value.buildsOn : [];
  return b.slice(0, 2).map((id) => ({ id, label: 'Bài trước: ' + id }));
});

const GLOSS_MARKER = 'Thuật nguyên cần biết';
const bodyRest = computed(() => {
  const html = renderHtml(String(lesson.value?.body || ''));
  const start = html.indexOf('<p><strong>' + GLOSS_MARKER);
  if (start < 0) return html;
  const ul = html.indexOf('<ul>', start);
  if (ul < 0) return html;
  const ulEnd = html.indexOf('</ul>', ul);
  const after = ulEnd >= 0 ? html.slice(ulEnd + 5) : '';
  return after;
});

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
watch(lessonId, () => { activeSec.value = 'sec-1'; nextTick(() => observeSects()); });

const openQ = ref(0);
const glossaryOpen = ref(true);
function toggleGlossary() { glossaryOpen.value = !glossaryOpen.value; }

function codeHtml(code, max) {
  const lines = String(code == null ? '' : code).split(NL);
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const extra = Math.max(0, lines.length - max);
  const body = lines.slice(0, max).map((l) => esc(l)).join(NL);
  const pre = '<pre class="hcp-code"><code>' + body + '</code></pre>';
  return extra > 0 ? pre + '<p class="hcp-code-more">+ ' + extra + ' dòng</p>' : pre;
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
            <h2 class="hcp-sec-h">Vì sao</h2>
            <div class="hcp-prose"><p v-html="bridgeHtml"></p></div>
            <p class="hcp-scroll-hint">Kéo ngang để xem đủ sơ đồ</p>
            <figure class="hcp-figure">
              <div class="hcp-figure-wrap">
                <img class="hcp-figure-img" :src="d1Url" :alt="'Hình 1 · ' + lessonId" />
              </div>
              <figcaption class="hcp-figure-cap">Hình 1</figcaption>
            </figure>
            <table class="hcp-table hcp-gloss">
              <caption class="hcp-table-cap">Bảng 1 · {{ glossaryRows[0] && glossaryRows[0].term }}</caption>
              <colgroup>
                <col style="width: 170px" />
                <col style="width: 300px" />
                <col style="width: 250px" />
              </colgroup>
              <thead>
                <tr>
                  <th>Khái niệm</th>
                  <th>Là gì</th>
                  <th>Không phải là gì</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in glossaryRows" :key="g.term">
                  <td class="hcp-g-term" data-label="Khái niệm">{{ g.term }}</td>
                  <td data-label="Là gì">{{ g.is }}</td>
                  <td data-label="Không phải là gì" v-if="g.not">{{ g.not }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="hcp-sec-2" class="hcp-sec">
            <p class="hcp-sec-n">02</p>
            <h2 class="hcp-sec-h">Cơ chế</h2>
            <div class="hcp-prose"><div v-html="mechanismProse"></div></div>
            <p class="hcp-scroll-hint">Kéo ngang để xem đủ sơ đồ</p>
            <figure class="hcp-figure">
              <div class="hcp-figure-wrap">
                <img class="hcp-figure-img" :src="d1Url" :alt="'Hình 1 · ' + lessonId" />
              </div>
              <figcaption class="hcp-figure-cap">Hình 1</figcaption>
            </figure>
            <figure v-if="d2Section === 2" class="hcp-figure">
              <div class="hcp-figure-wrap">
                <img class="hcp-figure-img" :src="d2Url" :alt="'Hình 2 · ' + lessonId" />
              </div>
              <figcaption class="hcp-figure-cap">Hình 2</figcaption>
            </figure>
            <div class="hcp-code" v-html="codeHtml(lesson.code, 24)"></div>
            <div class="hcp-code-note" v-html="renderHtml(lesson.codeNote || '')"></div>
          </section>

          <section id="hcp-sec-3" class="hcp-sec">
            <p class="hcp-sec-n">03</p>
            <h2 class="hcp-sec-h">Sự cố</h2>
            <div class="hcp-prose"><div v-html="incidentProse"></div></div>
            <div class="hcp-root">
              <p class="hcp-lbl">Nguyên nhân gốc</p>
              <div class="hcp-root-line" v-html="renderHtml(lesson.rootCause)"></div>
            </div>
            <table class="hcp-table hcp-timeline">
              <caption class="hcp-table-cap">Bảng 2 · Dòng thời gian</caption>
              <colgroup>
                <col style="width: 96px" />
                <col style="width: 624px" />
              </colgroup>
              <thead>
                <tr>
                  <th>Mốc</th>
                  <th>Việc</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in timelineRows" :key="i">
                  <td class="hcp-tl-m" data-label="Mốc">{{ r.t }}</td>
                  <td class="hcp-tl-v" data-label="Việc">{{ r.v }}</td>
                </tr>
              </tbody>
            </table>
            <div class="hcp-code-wrap" v-html="codeHtml(lesson.naiveCode, 14)"></div>
            <div class="hcp-callout-warn" v-if="lesson.naiveOut">
              <p class="hcp-callout-label">Kết quả thực tế</p>
              <div class="hcp-callout-body" v-html="renderHtml(lesson.naiveOut)"></div>
            </div>
            <div class="hcp-fail" v-if="lesson.failureModes">
              <p class="hcp-lbl">Lỗi thường gặp</p>
              <div class="hcp-fail-list" v-html="renderHtml(lesson.failureModes)"></div>
            </div>
            <figure v-if="d2Section === 3" class="hcp-figure">
              <div class="hcp-figure-wrap">
                <img class="hcp-figure-img" :src="d2Url" :alt="'Hình 2 · ' + lessonId" />
              </div>
              <figcaption class="hcp-figure-cap">Hình 2</figcaption>
            </figure>
          </section>

          <section id="hcp-sec-4" class="hcp-sec">
            <p class="hcp-sec-n">04</p>
            <h2 class="hcp-sec-h">Nói trong 30 giây</h2>
            <div class="hcp-say">
              <p class="hcp-say-label">30 giây</p>
              <p class="hcp-say-body" v-html="renderHtml(esc(lesson.say30))"></p>
            </div>
            <table class="hcp-table hcp-rhythm">
              <caption class="hcp-table-cap">Bảng 3 · Ba nhịp của câu trả lời 90 giây</caption>
              <colgroup>
                <col style="width: 120px" />
                <col style="width: 520px" />
                <col style="width: 80px" />
              </colgroup>
              <thead>
                <tr>
                  <th>Nhịp</th>
                  <th>Nội dung</th>
                  <th>Giây</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rhythmRows" :key="r.key">
                  <td>{{ r.label }}</td>
                  <td v-html="renderHtml(esc(r.content))"></td>
                  <td class="num">{{ r.sec }}</td>
                </tr>
              </tbody>
            </table>
            <ol class="hcp-chips">
              <li v-for="(s, i) in sayItList" :key="i" class="hcp-chip-item"><span class="hcp-chip">{{ s }}</span></li>
            </ol>
          </section>

          <section id="hcp-sec-5" class="hcp-sec">
            <p class="hcp-sec-n">05</p>
            <h2 class="hcp-sec-h">CTO hỏi xoáy</h2>
            <div class="hcp-prose"><div v-html="tradeoffProse"></div></div>
            <figure v-if="d2Section === 5" class="hcp-figure">
              <div class="hcp-figure-wrap">
                <img class="hcp-figure-img" :src="d2Url" :alt="'Hình 2 · ' + lessonId" />
              </div>
              <figcaption class="hcp-figure-cap">Hình 2</figcaption>
            </figure>
            <div class="hcp-qa">
              <div v-for="(a, i) in lesson.attacks" :key="i" class="hcp-qa-item" :class="{ open: i === openQ }">
                <button type="button" class="hcp-qa-q" :aria-expanded="i === openQ" @click="openQ = (i === openQ ? -1 : i)">
                  <span class="hcp-qa-qtext" v-html="renderHtml(a.q)"></span>
                  <span class="hcp-qa-ico" aria-hidden="true">{{ i === openQ ? '⌄' : '›' }}</span>
                </button>
                <div class="hcp-qa-a" v-show="i === openQ">
                  <div class="hcp-prose"><div v-html="renderHtml(a.a)"></div></div>
                </div>
              </div>
            </div>
            <p class="hcp-qa-cap">Bảng 4 · {{ lesson.attacks.length }} câu CTO, mở câu 1</p>
            <div class="hcp-chips">
              <span v-for="c in altChips" :key="c" class="hcp-chip">{{ c }}</span>
            </div>
            <p class="hcp-observe">
              <span class="hcp-lbl">Quan sát trên Production</span>
              <span class="hcp-observe-text" v-html="renderHtml(lesson.observe)"></span>
            </p>
            <div class="hcp-chips">
              <a v-for="c in qidChips" :key="c.qid" class="hcp-chip" :href="'#/drill?ids=' + encodeURIComponent(c.qid)">{{ c.label }}</a>
            </div>
          </section>

          <section id="hcp-sec-6" class="hcp-sec">
            <p class="hcp-sec-n">06</p>
            <h2 class="hcp-sec-h">Câu neo</h2>
            <div class="hcp-band">
              <p class="hcp-band-lbl">Câu neo</p>
              <p class="hcp-band-a" v-html="renderHtml(esc(lesson.anchor))"></p>
            </div>
            <div class="hcp-band-sub">
              <p class="hcp-lbl">Nói được trong một câu</p>
              <p class="hcp-say-it">{{ sayIt0 }}</p>
            </div>
            <div class="hcp-chips">
              <span v-for="b in buildsOnChips" :key="b.id" class="hcp-chip">{{ b.label }}</span>
            </div>
            <div class="hcp-refs">
              <p class="hcp-lbl">Tài liệu đọc</p>
              <div class="hcp-refs-list">
                <a v-for="d in refDocs" :key="d.key" :href="d.url" target="_blank" rel="noopener noreferrer">{{ d.name }}</a>
              </div>
            </div>
            <details class="hcp-body-more">
              <summary>Đọc thêm · Ứng dụng thực tế</summary>
              <div class="hcp-body-inner" v-html="bodyRest"></div>
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
          <p class="hcp-rail-gloss">Từ điển bài này ({{ glossaryRows.length }})</p>
          <details class="hcp-rail-gloss">
            <summary>Chi tiết</summary>
            <ul class="hcp-gloss-list">
              <li v-for="g in glossaryRows" :key="g.term" class="hcp-gloss-item">
                <p class="hcp-gloss-term">{{ g.term }}</p>
                <p v-if="g.is" class="hcp-gloss-def">{{ g.is }}</p>
                <p v-if="g.not" class="hcp-gloss-def not">{{ g.not }}</p>
              </li>
            </ul>
          </details>
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
.hcp-rail-gloss { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--accent-ink); }
.hcp-rail-gloss summary { cursor: pointer; }
.hcp-gloss-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.hcp-gloss-item { font-size: 14px; color: var(--fg-2); line-height: 1.5; }
.hcp-gloss-term { margin: 0; font-size: 14px; font-weight: 600; color: var(--fg); }
.hcp-gloss-def { margin: 0; font-size: 14px; color: var(--fg-2); line-height: 1.5; }
.hcp-gloss-def.not { color: var(--fg-3); }
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
.hcp-scroll-hint { display: none; margin: 8px 0 0; font-size: 13px; color: var(--fg-3); }

.hcp-figure { margin: 32px 0 0; }
.hcp-figure-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.hcp-figure-img { width: 720px; height: auto; display: block; max-width: none; }
.hcp-figure-cap { margin: 8px 0 0; font-size: 15px; color: var(--fg-3); }

.hcp-table { width: 100%; border-collapse: collapse; font-size: 15px; max-width: 720px; }
.hcp-table caption { font-size: 15px; color: var(--fg-3); margin-bottom: 8px; text-align: left; }
.hcp-table th { background: var(--sunken); font-weight: 600; color: var(--fg); }
.hcp-table td { color: var(--fg-2); line-height: 1.55; }
.hcp-table td:first-child { color: var(--fg); font-weight: 600; }
.hcp-table .num { text-align: right; font-family: var(--mono); white-space: nowrap; }

.hcp-code { margin: 40px 0 0; padding: 16px; border-radius: 8px; background: var(--code-bg); color: var(--code-fg); font-family: var(--mono); font-size: 15px; line-height: 1.6; overflow-x: auto; }
.hcp-code-more { margin: 8px 0 0; font-family: var(--mono); font-size: 13px; color: var(--fg-3); }
.hcp-code-note { margin: 12px 0 0; font-size: 17px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.hcp-code-note code { white-space: pre-wrap; overflow-wrap: anywhere; }
.hcp-code-wrap { margin-top: 40px; }

.hcp-callout-warn { margin: 16px 0 0; padding: 12px 16px; border-radius: 8px; background: var(--warn-soft); border: 1px solid var(--line); }
.hcp-callout-label { margin: 0 0 4px; font-size: 13px; font-weight: 600; color: var(--warn); }
.hcp-callout-body { margin: 0; font-size: 17px; line-height: 1.65; color: var(--fg); }
.hcp-fail { margin-top: 24px; }
.hcp-fail-list { font-size: 17px; line-height: 1.65; color: var(--fg); }

.hcp-say { margin: 32px 0 0; padding: 24px; border-radius: 8px; background: var(--sunken); }
.hcp-say-label { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--fg-3); }
.hcp-say-body { margin: 0; font-size: 17px; line-height: 1.65; color: var(--fg); }

.hcp-qa { margin: 32px 0 0; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); overflow: hidden; max-width: 720px; }
.hcp-qa-item { border-bottom: 1px solid var(--line); }
.hcp-qa-item:last-child { border-bottom: none; }
.hcp-qa-q { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border: none; background: transparent; color: var(--fg); font: inherit; font-size: 17px; font-weight: 600; text-align: left; cursor: pointer; line-height: 1.5; }
.hcp-qa-ico { flex: none; font-family: var(--mono); color: var(--fg-3); font-size: 16px; }
.hcp-qa-a { padding: 12px 16px 14px; font-size: 17px; line-height: 1.65; color: var(--fg); border-top: 1px solid var(--line); }
.hcp-qa-cap { margin: 12px 0 0; font-size: 15px; color: var(--fg-3); }

.hcp-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 32px; max-width: 720px; }
.hcp-chip { display: inline-flex; align-items: center; font-size: 13px; font-weight: 600; background: var(--sunken); color: var(--accent-ink); border: none; border-radius: 6px; padding: 6px 12px; }
.hcp-chip-item { display: inline-flex; }

.hcp-observe { display: block; margin: 24px 0 0; max-width: 720px; font-size: 15px; line-height: 1.6; color: var(--fg-2); }
.hcp-observe-text { display: block; margin-top: 4px; }

.hcp-band { margin-top: 24px; padding: 24px; background: var(--ok-soft); border: 1px solid var(--line); border-left: 3px solid var(--ok); border-radius: 8px; }
.hcp-band-lbl { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--ok); }
.hcp-band-a { margin: 0; font-size: 22px; line-height: 1.35; font-weight: 600; color: var(--ok); }
.hcp-band-sub { margin-top: 24px; }
.hcp-say-it { margin: 0; font-size: 17px; line-height: 1.65; font-weight: 600; color: var(--fg); }

.hcp-refs { margin-top: 32px; max-width: 720px; }
.hcp-refs-list { display: flex; flex-direction: column; gap: 6px; }
.hcp-refs-list a { color: var(--accent-ink); font-size: 15px; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }

.hcp-body-more { margin-top: 48px; }
.hcp-body-more summary { cursor: pointer; font-size: 15px; font-weight: 600; color: var(--accent-ink); }
.hcp-body-inner { margin-top: 12px; font-size: 17px; line-height: 1.65; color: var(--fg); }

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
  .hcp-figure-img { width: 720px; }
}
@media (max-width: 720px) {
  .hcp-lesson { padding-bottom: 88px; }
  .hcp-lesson-footer { position: fixed; left: 0; right: 0; bottom: var(--nav-h, 69px); z-index: 40; margin: 0; padding: 10px 16px; background: var(--surface); border-top: 1px solid var(--line); }
  .hcp-lesson-footer .hcp-next-btn { width: 100%; min-width: 0; }
  .hcp-lesson-footer .hcp-footer-line { display: none; }
}
</style>
