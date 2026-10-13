<script setup>
import { computed, inject } from 'vue';
import store from '../store.js';
import { dateISO } from '../utils.js';

const data = inject('data');
const LOGIC = data.LOGIC || {};
const LESSONS = Array.isArray(data.LESSONS) ? data.LESSONS : [];
const QUESTIONS = Array.isArray(data.QUESTIONS) ? data.QUESTIONS : [];
const QUIZ = Array.isArray(data.QUIZ) ? data.QUIZ : [];
const MOCK_SETS = data.MOCK_SETS && typeof data.MOCK_SETS === 'object' ? data.MOCK_SETS : {};
const doneSet = inject('doneSet');

const STAGE_COUNT = new Set(LESSONS.map((l) => l.stage)).size;
const P0_IDS = QUESTIONS.filter((q) => q && q.prio === 'P0').map((q) => String(q.id));
const MOCK_COUNT = Object.keys(MOCK_SETS).length;
const CASE_SECTIONS = Array.isArray(data.CASE_STUDY?.sections) ? data.CASE_STUDY.sections.length : 0;
const SOURCES = Array.isArray(data.SOURCES) ? data.SOURCES : [];

// Leitner state (đọc một lần; Home được remount mỗi lần vào route).
function loadLeitner() {
  try {
    const s = JSON.parse(localStorage.getItem(store.KEYS.leitner) || 'null');
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
  } catch {
    return {};
  }
}
const leitner = loadLeitner();
const todayISO = dateISO();
const dueP0 = (LOGIC.leitnerDueQids?.(P0_IDS, leitner, todayISO) || []).length;
// Đếm theo id P0 đã reveal trong DrillCard (bấm "Tôi đã nói xong, mở đáp án"), lưu ở hcp-spoken-p0-v1.
const spokenSet = new Set(store.getSpokenIds());
const spokenCount = P0_IDS.filter((id) => spokenSet.has(id)).length;

const summary = [
  `${LESSONS.length} bài`,
  `${STAGE_COUNT} chặng`,
  `${QUESTIONS.length} câu`,
  `${P0_IDS.length} câu P0`,
  `Quiz ${QUIZ.length} câu`,
  `Phỏng vấn thử ${MOCK_COUNT} bộ`,
].join(' · ');

const STUDY_PLANS = data.STUDY_PLANS && typeof data.STUDY_PLANS === 'object' ? data.STUDY_PLANS : {};
const planNames = Object.values(STUDY_PLANS)
  .map((p) => String(p?.label || '').split(' — ')[0].trim())
  .filter(Boolean);
const planDesc = planNames.length ? planNames.join(' · ') : 'Gói 6 giờ · Gói 2 ngày · Gói 3 ngày';

const ENTRIES = [
  { key: 'today', name: 'Ngày học', desc: planDesc, href: '#/today' },
  { key: 'drill', name: 'Ôn câu hỏi', desc: `${QUESTIONS.length} câu`, href: '#/drill' },
  { key: 'quiz', name: 'Quiz', desc: `Quiz ${QUIZ.length} câu`, href: '#/quiz' },
  { key: 'mock', name: 'Phỏng vấn thử', desc: `Phỏng vấn thử ${MOCK_COUNT} bộ`, href: '#/mock' },
];

// Bốn màn tra cứu: không nằm trong thanh 5 mục, mở từ đây hoặc từ chip "← Trang chủ" ở đầu trang.
const REFS = [
  { key: 'flashcard', name: 'Flashcard', desc: `${QUESTIONS.length} thẻ · luyện nhịp trả lời`, href: '#/flashcard' },
  { key: 'case', name: 'Case study', desc: `${CASE_SECTIONS} mục · một hệ thống đầu-cuối`, href: '#/case' },
  { key: 'sources', name: 'Nguồn tham khảo', desc: `${SOURCES.length} nguồn · 8 nhóm`, href: '#/sources' },
  { key: 'intro', name: 'Bắt đầu', desc: 'Cách dùng · lịch ôn · điểm yếu', href: '#/intro' },
];

// Bước tiếp theo: bài đầu chưa hoàn thành trong chặng thấp nhất còn dở.
const nextLesson = computed(() => {
  const unfinished = LESSONS.filter((l) => !doneSet.has(l.id));
  if (!unfinished.length) return null;
  const firstStage = Math.min(...unfinished.map((l) => Number(l.stage)));
  const inStage = unfinished.filter((l) => Number(l.stage) === firstStage);
  return inStage[0] || unfinished[0];
});
const askFirst = computed(() => (nextLesson.value && Array.isArray(nextLesson.value.askFirst)
  ? nextLesson.value.askFirst.slice(0, 3)
  : []));

// Lộ trình: toàn bộ bài, đánh dấu đã học và bài kế tiếp.
const roadmap = computed(() => LESSONS.map((l) => ({
  id: l.id,
  title: l.title,
  stage: l.stage,
  done: doneSet.has(l.id),
  next: !!nextLesson.value && nextLesson.value.id === l.id,
  href: '#/lesson/' + encodeURIComponent(String(l.id)),
})));

const emit = defineEmits(['open-lesson']);
function openLesson(l) {
  emit('open-lesson', l);
}
</script>

<template>
  <div class="hcp-home">
    <section class="hcp-head">
      <div class="hcp-head-title">
        <h1 class="hcp-title">Hôm nay</h1>
        <p class="hcp-summary">{{ summary }}</p>
      </div>
      <a class="hcp-search" href="#/drill">
        <span class="hcp-search-hint">Từ khóa, ví dụ: lambda, cors</span>
        <span class="hcp-search-chip" aria-hidden="true">/</span>
      </a>
    </section>

    <section class="hcp-stats">
      <div class="hcp-stat">
        <span class="hcp-stat-label">Thẻ đến hạn hôm nay</span>
        <span class="hcp-stat-value">{{ dueP0 }}</span>
        <span class="hcp-stat-sub">bộ P0 · {{ P0_IDS.length }} câu · 5 hộp</span>
      </div>
      <div class="hcp-stat">
        <span class="hcp-stat-label">Câu P0 đã nói thành tiếng</span>
        <span class="hcp-stat-value">{{ spokenCount }} / {{ P0_IDS.length }}</span>
      </div>
    </section>

    <section class="hcp-body">
      <div class="hcp-entries">
        <a v-for="e in ENTRIES" :key="e.key" class="hcp-entry" :href="e.href">
          <span class="hcp-entry-name">{{ e.name }}</span>
          <span class="hcp-entry-desc">{{ e.desc }}</span>
        </a>
      </div>

      <aside class="hcp-next" v-if="nextLesson" aria-label="Bước tiếp theo">
        <h3 class="hcp-next-title">Bước tiếp theo</h3>
        <ol class="hcp-next-list">
          <li v-for="(q, i) in askFirst" :key="i">{{ q }}</li>
        </ol>
        <button type="button" class="hcp-next-btn" @click="openLesson(nextLesson)">
          {{ nextLesson.id }} · {{ nextLesson.title }}
        </button>
      </aside>
    </section>

    <section class="hcp-refs" aria-label="Tài liệu tra cứu">
      <h3 class="hcp-roadmap-title">Tài liệu</h3>
      <div class="hcp-refs-list">
        <a v-for="r in REFS" :key="r.key" class="hcp-ref" :href="r.href">
          <span class="hcp-ref-name">{{ r.name }}</span>
          <span class="hcp-ref-desc">{{ r.desc }}</span>
        </a>
      </div>
    </section>

    <section class="hcp-roadmap" :aria-label="'Lộ trình ' + LESSONS.length + ' bài'">
      <h3 class="hcp-roadmap-title">Lộ trình {{ LESSONS.length }} bài</h3>
      <ol class="hcp-roadmap-list">
        <li v-for="r in roadmap" :key="r.id">
          <a
            class="hcp-roadmap-row"
            :class="{ 'is-next': r.next, 'is-done': r.done }"
            :href="r.href"
            :aria-current="r.next ? 'step' : undefined"
          >
            <span class="hcp-roadmap-id">{{ r.id }}</span>
            <span class="hcp-roadmap-name">{{ r.title }}</span>
            <span class="hcp-roadmap-mark">{{ r.done ? 'Đã học' : (r.next ? 'Tiếp theo' : '') }}</span>
          </a>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.hcp-home {
  padding: 40px 48px; display: flex; flex-direction: column; gap: 24px;
  font-family: var(--sans); color: var(--fg);
}
.hcp-head {
  display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap;
}
.hcp-head-title { flex: 1 1 360px; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.hcp-title { margin: 0; font-size: 40px; font-weight: 700; line-height: 1.15; color: var(--fg); }
.hcp-summary { margin: 0; font-size: 16px; color: var(--fg-2); }

.hcp-search {
  width: 300px; max-width: 100%; background: var(--sunken); border-radius: 8px; padding: 10px 14px;
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  font-size: 14px; color: var(--fg-2); text-decoration: none;
}
.hcp-search:hover { color: var(--fg); }
.hcp-search-chip {
  background: var(--sunken); border-radius: 999px; padding: 6px 12px;
  font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--fg-2);
}

.hcp-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.hcp-stat, .hcp-entry {
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 6px; min-width: 0;
}
.hcp-stat-label { font-size: 14px; color: var(--fg-2); }
.hcp-stat-value { font-family: var(--mono); font-size: 40px; font-weight: 700; line-height: 1.1; color: var(--fg); }
.hcp-stat-sub { font-size: 14px; color: var(--fg-2); }

.hcp-body { display: flex; gap: 24px; align-items: flex-start; }
.hcp-entries { flex: 1 1 auto; min-width: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.hcp-entry { gap: 8px; text-decoration: none; color: var(--fg); transition: border-color 0.15s; }
.hcp-entry:hover { border-color: var(--accent); }
.hcp-entry-name { font-size: 18px; font-weight: 700; color: var(--fg); }
.hcp-entry-desc { font-size: 14px; color: var(--fg-2); }

.hcp-next {
  width: 380px; flex: 0 0 380px; background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 12px;
}
.hcp-next-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--fg); }
.hcp-next-list {
  margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 12px;
  font-size: 16px; line-height: 1.5; color: var(--fg-2);
}
.hcp-next-btn {
  margin-top: 4px; align-self: flex-start; min-height: 44px; padding: 10px 14px;
  border: 1px solid var(--accent); border-radius: 8px; background: var(--accent); color: white;
  font-family: var(--sans); font-size: 14px; font-weight: 600; cursor: pointer;
}
.hcp-next-btn:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.hcp-refs {
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.hcp-refs-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.hcp-ref {
  display: flex; flex-direction: column; gap: 4px; min-height: 44px; padding: 12px 14px;
  border: 1px solid var(--line); border-radius: 8px; text-decoration: none; color: var(--fg);
  transition: border-color 0.15s;
}
.hcp-ref:hover { border-color: var(--accent); }
.hcp-ref:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.hcp-ref-name { font-size: 16px; font-weight: 600; color: var(--fg); }
.hcp-ref-desc { font-size: 13px; color: var(--fg-2); }

@media (max-width: 720px) {
  .hcp-refs-list { grid-template-columns: 1fr; }
}

.hcp-roadmap {
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.hcp-roadmap-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--fg); }
.hcp-roadmap-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.hcp-roadmap-row {
  display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 8px 12px;
  border-radius: 8px; text-decoration: none; color: var(--fg); font-size: 14px;
}
.hcp-roadmap-row:hover { background: var(--sunken); }
.hcp-roadmap-row.is-next { background: var(--accent-soft); color: var(--accent-ink); font-weight: 600; }
.hcp-roadmap-id { font-family: var(--mono); font-weight: 600; color: var(--accent-ink); min-width: 40px; }
.hcp-roadmap-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.hcp-roadmap-mark { font-size: 12px; color: var(--fg-3); white-space: nowrap; }
.hcp-roadmap-row.is-done .hcp-roadmap-mark { color: var(--ok); }
.hcp-roadmap-row:focus-visible, .hcp-next-btn:focus-visible, .hcp-entry:focus-visible, .hcp-search:focus-visible {
  outline: 3px solid var(--focus); outline-offset: 2px;
}

@media (max-width: 720px) {
  .hcp-home { padding: 20px; gap: 20px; }
  .hcp-title { font-size: 26px; }
  .hcp-search { width: 100%; }
  .hcp-stats { grid-template-columns: 1fr; }
  .hcp-body { flex-direction: column; }
  .hcp-entries { grid-template-columns: 1fr; width: 100%; }
  .hcp-next { width: 100%; flex: 0 0 auto; }
}
</style>
