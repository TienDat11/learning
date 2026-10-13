<script setup>
import { computed, inject, ref, watch } from 'vue';
import { esc, sanitize, sanitizeSvg } from '../utils.js';
import store from '../store.js';

const props = defineProps({ lesson: { type: Object, required: true } });
const data = inject('data');

const lesson = computed(() => props.lesson);
const flowId = computed(() => (lesson.value ? String(lesson.value.flow || '') : ''));
const hasFlow = computed(() => !!lesson.value?.flow && flowId.value !== '');

// ---------- phase checklist (6 chặng H5) ----------
const PHASES = [
  { id: 1, label: '1. Kiểm tra trước khi bay', key: 'askFirst', field: 'askFirst', bodyKey: 'predict' },
  { id: 2, label: '2. Hệ thống (sơ đồ)', key: 'flow', field: 'flow', bodyKey: 'flow' },
  { id: 3, label: '3. Mô phỏng sự cố', key: 'incident', field: 'incident', bodyKey: 'incident' },
  { id: 4, label: '4. Phát biểu', key: 'say30', field: 'say30', bodyKey: 'say30' },
  { id: 5, label: '5. Hỏi-đáp CTO', key: 'attacks', field: 'attacks', bodyKey: 'attacks' },
  { id: 6, label: '6. Xong', key: null, field: null, bodyKey: null },
];

const progress = inject('progress');
const saved = store.getH5Progress();
const phaseState = ref({});
// Accordion mở/đóng (riêng với tiến độ phaseState): pha 1 mở, pha 2-5 đóng.
const openPhases = ref({ 1: true, 2: false, 3: false, 4: false, 5: false });
const glossaryOpen = ref(false);
function toggleOpen(id) { openPhases.value[id] = !openPhases.value[id]; }
function toggleGlossary() { glossaryOpen.value = !glossaryOpen.value; }

const lessonId = computed(() => lesson.value ? String(lesson.value.id) : '');
watch([lessonId, progress], () => {
  const p = (progress.value || {})[lessonId.value] || 0;
  for (const ph of PHASES) phaseState.value[ph.id] = p >= ph.id;
}, { immediate: true });
watch(lessonId, () => {
  openPhases.value = { 1: true, 2: false, 3: false, 4: false, 5: false };
  glossaryOpen.value = false;
});

function togglePhase(id) {
  const p = (progress.value || {})[lessonId.value] || 0;
  const checked = phaseState.value[id];
  const newP = checked ? Math.min(p, id - 1) : id;
  progress.value = { ...progress.value, [lessonId.value]: newP };
  phaseState.value[id] = newP >= id;
  if (id === 6) store.markH5Completed(lessonId.value);
}

function openNext() {
  const pos = data.LESSONS.findIndex((l) => l.id === lessonId.value);
  if (pos >= 0 && pos < data.LESSONS.length - 1) {
    emit('open-lesson', data.LESSONS[pos + 1]);
  } else if (pos >= 0) {
    emit('close');
  }
}

// ---------- CTA "Hoàn thành chặng này" ----------
// CTA không được nhảy bài khi chưa ghi tiến độ, và không được làm giảm tiến độ:
// nó luôn đánh dấu pha CHƯA xong sớm nhất, rồi mở pha kế tiếp. Khi cả 5 pha xong
// thì đánh dấu bài hoàn thành (pha 6); chỉ khi bài đã hoàn thành CTA mới điều hướng.
const allPhasesDone = computed(() => SECTION_PHASES.every((ph) => phaseState.value[ph.id]));

function primaryAction() {
  if (phaseState.value[6]) { openNext(); return; }
  const next = SECTION_PHASES.find((ph) => !phaseState.value[ph.id]);
  if (!next) { togglePhase(6); return; }
  togglePhase(next.id);
  if (next.id < 5) openPhases.value[next.id + 1] = true;
}

// ---------- phase render helpers ----------
function phaseContent(ph) {
  const l = lesson.value || {};
  if (!l.id) return '<p>Chưa có dữ liệu bài.</p>';

  switch (ph.id) {
    case 1: {
      const cues = Array.isArray(l.askFirst) ? l.askFirst : [];
      const predict = (l.predict && typeof l.predict === 'object') ? l.predict : null;
      let html = '<ul class="hcp-checklist">';
      for (let i = 0; i < cues.length; i++) {
        html += '<li class="hcp-checklist-item"><span class="hcp-num">Gợi nhớ ' + String(i + 1).padStart(2, '0') + ': </span><span class="hcp-prompt">' + esc(cues[i]) + '</span></li>';
      }
      html += '</ul>';
      if (predict && (predict.q || predict.a)) {
        html += '<div class="hcp-predict"><p class="hcp-predict-q"><strong>Dự đoán trước khi xem đáp án:</strong> ' + esc(predict.q) + '</p>';
        html += '<button type="button" class="hcp-btn hcp-btn-mini hcp-reveal-ans" data-show-answer>' + (predict.a ? 'Hiện đáp án' : 'Xem gợi ý') + '</button>';
        if (predict.a) html += '<p class="hcp-predict-a" hidden>' + sanitize(predict.a) + '</p>';
        html += '</div>';
      }
      return html;
    }
    case 2: {
      let html = '';
      if (hasFlow.value) {
        const flow = (data.FLOW_SVGS || []).find((f) => f.id === flowId.value);
        if (flow && typeof flow.svg === 'string') {
          html += '<div class="hcp-svg-wrap"><div class="hcp-svg-inner">' + sanitizeSvg(flow.svg) + '</div></div>';
        } else {
          console.warn('RESEARCH_GAP: sơ đồ không tìm thấy trong FLOW_SVGS, flow=' + flowId.value);
          html += '<div class="hcp-placeholder"><p class="hcp-placeholder-msg">Sơ đồ cho bài này đang được cập nhật.</p></div>';
        }
      }
      if (bodyRest.value) html += '<div class="hcp-notes">' + sanitize(bodyRest.value) + '</div>';
      return html || '<p class="hcp-empty">Chưa có dữ liệu.</p>';
    }
    case 3: {
      const html = [];
      if (l.incident) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Sự cố</h4><div class="hcp-body">' + sanitize(l.incident) + '</div></div>');
      if (Array.isArray(l.timeline) && l.timeline.length) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Dòng thời gian</h4><ul class="hcp-timeline">');
        for (const row of l.timeline) {
          html.push('<li><span class="hcp-time">' + esc(row[0]) + '</span> ' + esc(row[1]) + '</li>');
        }
        html.push('</ul></div>');
      }
      if (l.rootCause) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Nguyên nhân gốc</h4><div class="hcp-body">' + sanitize(l.rootCause) + '</div></div>');
      if (!html.length) html.push('<p class="hcp-empty">Chưa có dữ liệu mô phỏng sự cố.</p>');
      return html.join('');
    }
    case 4: {
      const html = [];
      if (l.say30) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Trả lời 30 giây</h4><p class="hcp-body hcp-voice">' + esc(l.say30) + '</p></div>');
      if (l.say90) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Trả lời 90 giây</h4><p class="hcp-body hcp-voice">' + esc(l.say90) + '</p></div>');
      if (Array.isArray(l.sayIt) && l.sayIt.length) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Phải nói được</h4><ul class="hcp-tight">');
        for (const s of l.sayIt) html.push('<li>' + esc(s) + '</li>');
        html.push('</ul></div>');
      }
      if (!html.length) html.push('<p class="hcp-empty">Chưa có dữ liệu phát biểu.</p>');
      return html.join('');
    }
    case 5: {
      const html = [];
      if (Array.isArray(l.attacks) && l.attacks.length) {
        html.push('<div class="hcp-cto">');
        for (let i = 0; i < l.attacks.length; i++) {
          const a = l.attacks[i];
          html.push('<div class="hcp-cto-item"><p class="hcp-cto-q"><strong>CTO hỏi: </strong>' + esc(a.q) + '</p>');
          html.push('<p class="hcp-cto-a">' + esc(a.a) + '</p></div>');
        }
        html.push('</div>');
      } else {
        html.push('<p class="hcp-empty">Chưa có dữ liệu hỏi-đáp. Bạn tự đặt câu hỏi CTO cho bài này.</p>');
      }
      return html.join('');
    }
    case 6:
      return '<div class="hcp-done"><p class="hcp-done-msg">Bài đã hoàn thành.</p></div>';
    default:
      return '<p>Chưa rõ chặng.</p>';
  }
}

// ---------- predict reveal (delegated on phase body) ----------
function onPhaseBodyClick(e) {
  const btn = e.target instanceof Element ? e.target.closest('[data-show-answer]') : null;
  if (!btn || !e.currentTarget.contains(btn)) return;
  const ans = btn.parentElement?.querySelector(':scope > .hcp-predict-a');
  if (!ans) return;
  ans.hidden = !ans.hidden;
  btn.textContent = ans.hidden ? 'Hiện đáp án' : 'Ẩn đáp án';
}

const emit = defineEmits(['open-lesson', 'close']);

// ---------- layout data (glossary from body, refs from SOURCES) ----------
const SECTION_PHASES = PHASES.filter((p) => p.id <= 5);

const glossary = computed(() => {
  const html = String(lesson.value?.body || '');
  const m = html.match(/<ul>([\s\S]*?)<\/ul>/i);
  if (!m || !html.includes('Thuật ngữ cần biết')) return [];
  const doc = new DOMParser().parseFromString('<ul>' + m[1] + '</ul>', 'text/html');
  return Array.from(doc.querySelectorAll('li'), (li) => {
    const term = (li.querySelector('strong')?.textContent || '').trim();
    const full = (li.textContent || '').trim();
    return { term, def: full.slice(term.length).replace(/^\s*:\s*/, '').trim() };
  }).filter((g) => g.term);
});

const bodyRest = computed(() =>
  String(lesson.value?.body || '').replace(/^\s*<p><strong>Thuật ngữ cần biết<\/strong><\/p>\s*<ul>[\s\S]*?<\/ul>/i, '')
);

const refDocs = computed(() => {
  const keys = Array.isArray(lesson.value?.refs) ? lesson.value.refs : [];
  const all = Array.isArray(data?.SOURCES) ? data.SOURCES : [];
  return keys.map((k) => all.find((s) => s.key === k)).filter(Boolean);
});
</script>

<template>
  <div class="hcp-lesson" v-if="lesson && lesson.id">
    <div class="hcp-lesson-header">
      <button type="button" class="hcp-back" @click="$emit('close')" aria-label="Về trang chủ">← Về</button>
      <div class="hcp-lesson-meta">
        <span class="hcp-lesson-id">{{ lesson.id }}</span>
        <span class="hcp-lesson-stage">{{ lesson.stageTitle }}</span>
      </div>
      <button type="button" class="hcp-done-btn" :aria-pressed="phaseState[6]"
              @click="togglePhase(6)" :class="{ done: phaseState[6] }">
        {{ phaseState[6] ? 'Đã học' : 'Đánh dấu đã học' }}
      </button>
    </div>

    <h1 class="hcp-lesson-title">{{ lesson.title }}</h1>
    <p class="hcp-lesson-goal">{{ lesson.goal }}</p>

    <div class="hcp-lesson-grid">
      <div class="hcp-lesson-main">
        <div class="hcp-rail">
          <div class="hcp-rail-segments" :class="{ finished: phaseState[6] }">
            <div class="hcp-rail-fill" :style="{ width: ((phaseState[6] ? 6 : 0) / 6) * 100 + '%' }"></div>
            <template v-for="ph in PHASES" :key="ph.id">
              <button type="button" class="hcp-rail-seg" :class="{ active: phaseState[ph.id], checked: phaseState[ph.id] }"
                      :aria-label="ph.label + (phaseState[ph.id] ? ' đã xong' : '')"
                      @click="togglePhase(ph.id)">
                <span class="hcp-rail-num">{{ ph.id }}</span>
              </button>
            </template>
          </div>
          <p class="hcp-rail-text">{{ phaseState[6] ? 'Bài đã hoàn thành' : 'Chặng ' + (Object.keys(phaseState).filter((k) => phaseState[+k]).length) + ' / 6' }}</p>
        </div>

        <div class="hcp-phases">
          <template v-for="ph in SECTION_PHASES" :key="ph.id">
            <section class="hcp-glossary-strip" v-if="ph.id === 2 && glossary.length">
              <h2 class="hcp-glossary-strip-h">
                <button type="button" class="hcp-accordion-head" @click="toggleGlossary" :aria-expanded="String(glossaryOpen)">
                  <span>Thuật ngữ cần biết · {{ glossary.length }}</span>
                  <svg class="hcp-chev" :class="{ open: glossaryOpen }" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </h2>
              <div class="hcp-glossary-list" v-show="glossaryOpen">
                <div class="hcp-glossary-item" v-for="g in glossary" :key="g.term">
                  <p class="hcp-glossary-term">{{ g.term }}</p>
                  <p class="hcp-glossary-def">{{ g.def }}</p>
                </div>
              </div>
            </section>
            <section class="hcp-phase" :class="{ done: phaseState[ph.id], open: openPhases[ph.id] }">
              <h2 class="hcp-phase-title">
                <button type="button" class="hcp-accordion-head hcp-phase-toggle" @click="toggleOpen(ph.id)" :aria-expanded="String(!!openPhases[ph.id])">
                  <span>{{ ph.label }}</span>
                  <svg class="hcp-chev" :class="{ open: openPhases[ph.id] }" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </h2>
              <div class="hcp-phase-body" v-show="openPhases[ph.id]" v-html="phaseContent(ph)" @click="onPhaseBodyClick"></div>
            </section>
          </template>
        </div>

        <div class="hcp-footer-actions">
          <button type="button" class="hcp-btn hcp-btn-primary hcp-next-btn" @click="primaryAction">
            {{ phaseState[6] ? 'Bài tiếp theo / Về danh sách' : (allPhasesDone ? 'Hoàn thành bài' : 'Hoàn thành chặng này') }}
          </button>
        </div>
      </div>

      <aside class="hcp-lesson-side">
        <section class="hcp-side-box" v-if="lesson.anchor">
          <h2 class="hcp-side-label">Câu neo</h2>
          <p class="hcp-side-text">{{ lesson.anchor }}</p>
        </section>
        <section class="hcp-side-box" v-if="refDocs.length">
          <h2 class="hcp-side-label">Tài liệu đọc</h2>
          <ul class="hcp-side-list">
            <li v-for="d in refDocs" :key="d.key">
              <a :href="d.url" target="_blank" rel="noopener noreferrer">{{ d.name }}</a>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
  <div v-else class="hcp-error">Bài chưa có dữ liệu.</div>
</template>

<style scoped>
.hcp-lesson { padding-bottom: 24px; }
.hcp-lesson-header {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;
}
.hcp-back { border: none; background: none; color: var(--accent-ink); font-size: 14px; cursor: pointer; padding: 0; min-height: 44px; display: inline-flex; align-items: center; }
.hcp-lesson-meta { flex: 1; }
.hcp-lesson-id { font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--accent-ink); }
.hcp-lesson-stage { font-size: 13px; color: var(--fg-3); margin-left: 8px; }
.hcp-lesson-title { margin: 4px 0 6px 0; font-size: 24px; line-height: 1.3; }
.hcp-lesson-goal { margin: 0 0 16px 0; font-size: 14px; color: var(--fg-2); line-height: 1.5; }
.hcp-done-btn { font-size: 13px; padding: 7px 12px; min-height: 36px; border-color: var(--ok); color: var(--ok); }
.hcp-done-btn.done { background: var(--ok); color: white; }
.hcp-done-btn.done:hover { background: var(--ok-fill); }
.hcp-rail {
  margin: 20px 0; position: sticky; top: 68px; z-index: 20;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card);
  padding: 8px 12px; backdrop-filter: blur(8px);
}
.hcp-rail-segments { display: flex; gap: 6px; position: relative; }
.hcp-rail-fill {
  position: absolute; top: 0; left: 0; height: 100%; background: var(--ok);
  transition: width 0.3s; border-radius: 4px;
}
.hcp-rail-seg {
  flex: 1; display: flex; align-items: center; justify-content: center;
  min-width: 40px; height: 32px; border-radius: var(--r-sm);
  border: 1px solid var(--line); background: var(--sunken); color: var(--fg-3);
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.hcp-rail-seg.active { border-color: var(--accent); color: var(--accent-ink); background: var(--accent-soft); }
.hcp-rail-seg.checked { border-color: var(--ok); color: var(--ok); background: var(--ok-soft); }
.hcp-rail-text { margin: 8px 0 0 0; font-size: 12px; color: var(--fg-3); text-align: right; }
.hcp-phases { display: flex; flex-direction: column; gap: 14px; }
.hcp-phase { border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); overflow: hidden; }
.hcp-phase.done { border-color: var(--ok); }
.hcp-phase-title { margin: 0; background: var(--sunken); }
.hcp-accordion-head {
  width: 100%; text-align: left; background: var(--sunken); border: none;
  padding: 12px 14px; font-size: 15px; font-weight: 600; color: var(--fg); cursor: pointer;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.hcp-back:focus-visible, .hcp-done-btn:focus-visible, .hcp-rail-seg:focus-visible, .hcp-next-btn:focus-visible { outline: none; box-shadow: var(--ring); }
.hcp-accordion-head:focus-visible { outline: none; box-shadow: var(--ring); }
.hcp-chev { flex: none; transition: transform 150ms ease; }
.hcp-chev.open { transform: rotate(90deg); }
.hcp-glossary-strip { border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); overflow: hidden; }
.hcp-glossary-strip-h { margin: 0; background: var(--sunken); font-size: 14px; }
.hcp-glossary-strip-h .hcp-accordion-head { font-size: 14px; color: var(--accent-ink); }
.hcp-glossary-list { padding: 8px 16px 16px 16px; }
.hcp-checklist { margin: 0; padding-left: 20px; }
.hcp-checklist-item { margin: 8px 0; }
.hcp-num { font-family: var(--mono); font-size: 12px; color: var(--accent-ink); margin-right: 6px; }
.hcp-prompt { color: var(--fg-2); }
.hcp-predict { margin-top: 14px; border: 1px solid var(--accent); border-radius: var(--r); background: var(--accent-soft); padding: 12px; }
.hcp-predict-q { margin: 0 0 8px 0; font-size: 14px; }
.hcp-predict-a { margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid var(--line); font-size: 14px; }
.hcp-reveal-ans { font-size: 13px; padding: 6px 10px; }
.hcp-placeholder { border: 1px dashed var(--fg-2); border-radius: var(--r-card); padding: 16px; text-align: center; }
.hcp-placeholder-msg { margin: 0; color: var(--fg-3); font-size: 14px; font-family: var(--mono); }
.hcp-notes { margin-top: 14px; }
.hcp-section { margin: 16px 0; }
.hcp-section-h { margin: 0 0 8px 0; font-size: 16px; color: var(--fg); border-bottom: 2px solid var(--line); padding-bottom: 4px; }
.hcp-body { font-size: 15px; line-height: 1.65; }
.hcp-voice { font-style: italic; color: var(--fg-2); }
.hcp-timeline { margin: 0; padding-left: 20px; }
.hcp-timeline li { margin: 6px 0; }
.hcp-time { font-family: var(--mono); font-weight: 600; color: var(--accent-ink); margin-right: 6px; }
.hcp-cto { display: flex; flex-direction: column; gap: 10px; }
.hcp-cto-item { border-top: 1px solid var(--line); padding-top: 8px; }
.hcp-cto-q { margin: 0 0 4px 0; font-size: 14px; color: var(--fg-2); }
.hcp-cto-a { margin: 0; font-size: 15px; line-height: 1.6; }
.hcp-empty { color: var(--fg-3); font-style: italic; }
.hcp-done { text-align: center; padding: 20px; border-top: 1px solid var(--line); }
.hcp-done-msg { margin: 0; font-size: 16px; font-weight: 600; color: var(--ok); }
.hcp-footer-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
.hcp-next-btn { min-width: 160px; justify-content: center; }
.hcp-error { padding: 20px; text-align: center; color: var(--err); }
.hcp-svg-wrap { margin: 14px 0; overflow: auto; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); padding: 8px; }
.hcp-glossary-item { display: grid; gap: 2px; padding: 8px 0; border-top: 1px solid var(--line); }
.hcp-glossary-item:first-of-type { border-top: none; padding-top: 0; }
.hcp-glossary-term { margin: 0; font-size: 14px; font-weight: 600; color: var(--fg); overflow-wrap: anywhere; }
.hcp-glossary-def { margin: 0; font-size: 14px; color: var(--fg-2); line-height: 1.5; overflow-wrap: anywhere; }
.hcp-side-box { padding: 16px; margin-bottom: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); }
.hcp-side-label { margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: var(--accent-ink); text-transform: uppercase; letter-spacing: 0.03em; }
.hcp-side-text { margin: 0; font-size: 14px; color: var(--fg); line-height: 1.5; overflow-wrap: anywhere; }
.hcp-side-list { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: 14px; }
.hcp-side-list a { overflow-wrap: anywhere; }
@media (max-width: 900px) {
  .hcp-lesson-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 720px) {
  /* Frame LVxjj: the primary action sits in a fixed bar above the 5-item bottom nav. */
  .hcp-lesson { padding-bottom: 72px; }
  .hcp-footer-actions {
    position: fixed; left: 0; right: 0; bottom: var(--nav-h, 60px); z-index: 40;
    margin: 0; padding: 12px 16px; background: var(--surface); border-top: 1px solid var(--line);
  }
  .hcp-next-btn { width: 100%; min-width: 0; height: 44px; }
}
</style>
