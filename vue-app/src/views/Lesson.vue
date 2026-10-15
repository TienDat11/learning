<script setup>
import { computed, inject, ref, watch } from 'vue';
import { esc, sanitize, renderLinkedHtml, sanitizeSvg } from '../utils.js';
import store from '../store.js';

const props = defineProps({ lesson: { type: Object, required: true } });
const data = inject('data');

const lesson = computed(() => props.lesson);
const flowId = computed(() => (lesson.value ? String(lesson.value.flow || '') : ''));
const hasFlow = computed(() => !!lesson.value?.flow && flowId.value !== '');

// ---------- phase checklist (6 chặng H5) ----------
const PHASES = [
  { id: 1, label: '1. Giải mã từ gốc: Bản chất, Cơ chế hoạt động & Điểm tối ưu vào Khung', key: 'flow', field: 'flow', bodyKey: 'flow' },
  { id: 2, label: '2. Câu hỏi định hướng & Tự kiểm tra sau khi hiểu cơ chế', key: 'askFirst', field: 'askFirst', bodyKey: 'predict' },
  { id: 3, label: '3. Tình huống sự cố, Cách làm sai & Nguyên nhân gốc', key: 'incident', field: 'incident', bodyKey: 'incident' },
  { id: 4, label: '4. Cách trả lời miệng (30 giây & 90 giây)', key: 'say30', field: 'say30', bodyKey: 'say30' },
  { id: 5, label: '5. Đánh đổi (Trade-off), Phương án khác & Hỏi xoáy CTO', key: 'attacks', field: 'attacks', bodyKey: 'attacks' },
  { id: 6, label: '6. Hoàn thành', key: null, field: null, bodyKey: null },
];

const progress = inject('progress');
const saved = store.getH5Progress();
const phaseState = ref({});
// Mặc định mở toàn bộ các phần và bảng thuật ngữ để người học đọc hiểu liền mạch từ trên xuống dưới.
const openPhases = ref({ 1: true, 2: true, 3: true, 4: true, 5: true });
const glossaryOpen = ref(true);
function toggleOpen(id) { openPhases.value[id] = !openPhases.value[id]; }
function toggleGlossary() { glossaryOpen.value = !glossaryOpen.value; }

const lessonId = computed(() => lesson.value ? String(lesson.value.id) : '');
watch([lessonId, progress], () => {
  const p = (progress.value || {})[lessonId.value] || 0;
  for (const ph of PHASES) phaseState.value[ph.id] = p >= ph.id;
}, { immediate: true });
watch(lessonId, () => {
  openPhases.value = { 1: true, 2: true, 3: true, 4: true, 5: true };
  glossaryOpen.value = true;
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

// ---------- helper: sanitize + auto-link "Bài L01..L23" to clickable lesson links ----------
function renderHtml(raw) {
  return renderLinkedHtml(raw, data?.LESSONS, lessonId.value);
}

// ---------- phase render helpers ----------
function phaseContent(ph) {
  const l = lesson.value || {};
  if (!l.id) return '<p>Chưa có dữ liệu bài.</p>';
  const qs = Array.isArray(data?.QUESTIONS) ? data.QUESTIONS : [];

  switch (ph.id) {
    case 1: {
      const html = [];
      if (l.bridge) {
        const depLabel = Array.isArray(l.buildsOn) && l.buildsOn.length ? ' (' + esc(l.buildsOn.join(', ')) + ')' : '';
        const bridgeParas = String(l.bridge).split('\n\n');
        let bridgeHtml;
        if (bridgeParas.length > 1) {
          bridgeHtml = '<ul class="hcp-bridge-list hcp-body hcp-bridge">';
          for (const para of bridgeParas) {
            const m = para.match(/^\[([^\]]+)\]:\s*/);
            if (m) {
              bridgeHtml += '<li><strong>[' + esc(m[1]) + ']:</strong> ' + renderHtml(esc(para.slice(m[0].length))) + '</li>';
            } else {
              bridgeHtml += '<li>' + renderHtml(esc(para)) + '</li>';
            }
          }
          bridgeHtml += '</ul>';
        } else {
          bridgeHtml = '<p class="hcp-body hcp-bridge">' + renderHtml(esc(l.bridge)) + '</p>';
        }
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Bức tranh kết nối từ kiến thức cũ' + depLabel + '</h4>' + bridgeHtml + '</div>');
      }
      if (l.concept) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Bản chất từ gốc: Cái này là gì & Sinh ra để giải quyết nỗi đau nào?</h4><div class="hcp-body">' + renderHtml(l.concept) + '</div></div>');
      }
      if (l.mechanism) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Cơ chế hoạt động bên dưới & Điểm cần tối ưu vào Khung (Core / Lifecycle / Pattern)</h4><div class="hcp-body">' + renderHtml(l.mechanism) + '</div></div>');
      }
      if (hasFlow.value) {
        const flow = (data.FLOW_SVGS || []).find((f) => f.id === flowId.value);
        if (flow && typeof flow.svg === 'string') {
          html.push('<div class="hcp-section"><h4 class="hcp-section-h">Sơ đồ luồng kiến trúc</h4><div class="hcp-svg-wrap"><div class="hcp-svg-inner">' + sanitizeSvg(flow.svg) + '</div>' + (flow.caption ? '<p class="hcp-svg-cap">' + esc(flow.caption) + '</p>' : '') + '</div></div>');
        }
      }
      if (bodyRest.value) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Use-case thực chiến & Công thức suy luận khi bị hỏi xoáy</h4><div class="hcp-notes hcp-body">' + renderHtml(bodyRest.value) + '</div></div>');
      }
      if (l.code) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Mẫu code chuẩn theo Pattern của Framework</h4><pre class="hcp-code"><code>' + esc(l.code) + '</code></pre>' + (l.codeNote ? '<div class="hcp-body hcp-code-note">' + renderHtml(l.codeNote) + '</div>' : '') + '</div>');
      }
      return html.join('') || '<p class="hcp-empty">Chưa có dữ liệu.</p>';
    }
    case 2: {
      const cues = Array.isArray(l.askFirst) ? l.askFirst : [];
      const predict = (l.predict && typeof l.predict === 'object') ? l.predict : null;
      let html = '';
      if (cues.length) {
        html += '<div class="hcp-section"><h4 class="hcp-section-h">Tự hỏi trước khi trả lời</h4><ol class="hcp-checklist">';
        for (let i = 0; i < cues.length; i++) {
          const cue = cues[i];
          const sepIdx = cue.indexOf(' → Giải mã: ');
          if (sepIdx >= 0) {
            const q = cue.slice(0, sepIdx);
            const ans = cue.slice(sepIdx + 13);
            html += '<li class="hcp-checklist-item"><span class="hcp-prompt">' + esc(q) + '</span><div class="hcp-cue-answer">' + renderHtml(esc(ans)) + '</div></li>';
          } else {
            html += '<li class="hcp-checklist-item"><span class="hcp-prompt">' + esc(cue) + '</span></li>';
          }
        }
        html += '</ol></div>';
      }
      if (predict && (predict.q || predict.a)) {
        html += '<div class="hcp-section"><h4 class="hcp-section-h">Đoán trước</h4>';
        html += '<div class="hcp-predict"><div class="hcp-predict-q hcp-body">' + renderHtml(predict.q) + '</div>';
        html += '<button type="button" class="hcp-btn hcp-reveal-ans" data-show-answer>' + (predict.a ? 'Mở đáp án' : 'Xem gợi ý') + '</button>';
        if (predict.a) html += '<div class="hcp-predict-a hcp-body" hidden>' + renderHtml(predict.a) + '</div>';
        html += '</div></div>';
      }
      return html || '<p class="hcp-empty">Chưa có dữ liệu.</p>';
    }
    case 3: {
      const html = [];
      if (l.incident) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Sự cố thực tế</h4><div class="hcp-body">' + renderHtml(l.incident) + '</div></div>');
      if (Array.isArray(l.timeline) && l.timeline.length) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Dòng thời gian</h4><ul class="hcp-timeline">');
        for (const row of l.timeline) {
          html.push('<li><span class="hcp-time">' + esc(row[0]) + '</span><span class="hcp-tl-text">' + esc(row[1]) + '</span></li>');
        }
        html.push('</ul></div>');
      }
      if (l.naive || l.naiveCode || l.naiveOut) {
        let block = '<div class="hcp-section"><h4 class="hcp-section-h">Cách sửa sai phổ biến (Ngây thơ)</h4>';
        if (l.naive) block += '<div class="hcp-body">' + renderHtml(l.naive) + '</div>';
        if (l.naiveCode) block += '<pre class="hcp-code"><code>' + esc(l.naiveCode) + '</code></pre>';
        if (l.naiveOut) block += '<div class="hcp-callout-warn"><p class="hcp-callout-label">Kết quả thực tế</p><div class="hcp-callout-body hcp-body">' + renderHtml(l.naiveOut) + '</div></div>';
        block += '</div>';
        html.push(block);
      }
      if (l.rootCause) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Nguyên nhân gốc</h4><div class="hcp-body">' + renderHtml(l.rootCause) + '</div></div>');
      if (l.failureModes) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Lỗi thường gặp</h4><div class="hcp-body">' + renderHtml(l.failureModes) + '</div></div>');
      if (!html.length) html.push('<p class="hcp-empty">Chưa có dữ liệu mô phỏng sự cố.</p>');
      return html.join('');
    }
    case 4: {
      const html = [];
      if (l.say30) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Trả lời 30 giây</h4><div class="hcp-say-box"><p class="hcp-body hcp-voice">' + esc(l.say30) + '</p></div></div>');
      if (l.say90) {
        const parts = l.say90.split('\n\n');
        let say90Html = '';
        for (const part of parts) {
          const m = part.match(/^(\[Nhịp [^\]]+\]:)\s*/);
          if (m) {
            say90Html += '<p class="hcp-body hcp-voice"><strong>' + esc(m[1]) + '</strong> ' + renderHtml(esc(part.slice(m[0].length))) + '</p>';
          } else {
            say90Html += '<p class="hcp-body hcp-voice">' + renderHtml(esc(part)) + '</p>';
          }
        }
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Trả lời 90 giây</h4><div class="hcp-say-box">' + say90Html + '</div></div>');
      }
      if (Array.isArray(l.sayIt) && l.sayIt.length) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Những điểm phải nói được</h4><ol class="hcp-tight">');
        for (const s of l.sayIt) html.push('<li>' + esc(s) + '</li>');
        html.push('</ol></div>');
      }
      if (!html.length) html.push('<p class="hcp-empty">Chưa có dữ liệu phát biểu.</p>');
      return html.join('');
    }
    case 5: {
      const html = [];
      if (l.tradeoff) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Đánh đổi (Trade-off)</h4><div class="hcp-body">' + renderHtml(l.tradeoff) + '</div></div>');
      if (l.alternatives) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Phương án khác</h4><div class="hcp-body">' + renderHtml(l.alternatives) + '</div></div>');
      if (l.observe) html.push('<div class="hcp-section"><h4 class="hcp-section-h">Quan sát được gì trên Production</h4><div class="hcp-body">' + renderHtml(l.observe) + '</div></div>');
      if (Array.isArray(l.attacks) && l.attacks.length) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Câu hỏi CTO</h4><div class="hcp-cto">');
        for (let i = 0; i < l.attacks.length; i++) {
          const a = l.attacks[i];
          const open = i === 0;
          html.push(
            '<div class="hcp-cto-item' + (open ? ' is-open' : '') + '">' +
            '<button type="button" class="hcp-cto-head" data-cto-toggle aria-expanded="' + String(open) + '">' +
            '<span class="hcp-cto-q">' + renderHtml(a.q) + '</span>' +
            '<span class="hcp-cto-icon" aria-hidden="true">' + (open ? '⌄' : '›') + '</span>' +
            '</button>' +
            '<div class="hcp-cto-a hcp-body"' + (open ? '' : ' hidden') + '>' + renderHtml(a.a) + '</div>' +
            '</div>'
          );
        }
        html.push('</div></div>');
      }
      if (Array.isArray(l.qids) && l.qids.length) {
        html.push('<div class="hcp-section"><h4 class="hcp-section-h">Câu hỏi liên quan</h4><div class="hcp-qchips">');
        for (const qid of l.qids) {
          const qObj = qs.find((x) => x && x.id === qid);
          const label = qObj && qObj.topic ? qid + ' · ' + qObj.topic : qid;
          html.push('<a class="hcp-qchip" href="#/drill?ids=' + encodeURIComponent(qid) + '">' + esc(label) + '</a>');
        }
        html.push('</div></div>');
      }
      if (!html.length) {
        html.push('<p class="hcp-empty">Chưa có dữ liệu hỏi-đáp.</p>');
      }
      return html.join('');
    }
    case 6:
      return '<div class="hcp-done"><p class="hcp-done-msg">Bài đã hoàn thành.</p></div>';
    default:
      return '<p>Chưa rõ chặng.</p>';
  }
}

// ---------- predict reveal & CTO accordion (delegated on phase body) ----------
function onPhaseBodyClick(e) {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  const btn = target.closest('[data-show-answer]');
  if (btn && e.currentTarget.contains(btn)) {
    const ans = btn.parentElement?.querySelector(':scope > .hcp-predict-a');
    if (!ans) return;
    ans.hidden = !ans.hidden;
    btn.textContent = ans.hidden ? 'Mở đáp án' : 'Ẩn đáp án';
    return;
  }
  const ctoBtn = target.closest('[data-cto-toggle]');
  if (ctoBtn && e.currentTarget.contains(ctoBtn)) {
    const item = ctoBtn.parentElement;
    const ans = item?.querySelector(':scope > .hcp-cto-a');
    const icon = ctoBtn.querySelector('.hcp-cto-icon');
    if (!ans || !item) return;
    ans.hidden = !ans.hidden;
    item.classList.toggle('is-open', !ans.hidden);
    ctoBtn.setAttribute('aria-expanded', String(!ans.hidden));
    if (icon) icon.textContent = ans.hidden ? '›' : '⌄';
  }
}

const emit = defineEmits(['open-lesson', 'close']);

// ---------- layout data (glossary from body, refs from SOURCES) ----------
const SECTION_PHASES = PHASES.filter((p) => p.id <= 5);

const glossary = computed(() => {
  const html = String(lesson.value?.body || '');
  const m = html.match(/<p><strong>Thuật ngữ cần biết[^<]*<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
  if (!m) return [];
  const doc = new DOMParser().parseFromString('<ul>' + m[1] + '</ul>', 'text/html');
  return Array.from(doc.querySelectorAll('li'), (li) => {
    const rawTerm = (li.querySelector('strong')?.textContent || '').trim();
    const term = rawTerm.replace(/\s*[:—-]\s*$/, '').trim();
    const full = (li.textContent || '').trim();
    return { term, def: full.slice(rawTerm.length).replace(/^\s*[:—-]\s*/, '').trim() };
  }).filter((g) => g.term);
});

const bodyRest = computed(() =>
  String(lesson.value?.body || '').replace(/<p><strong>Thuật ngữ cần biết[^<]*<\/strong><\/p>\s*<ul>[\s\S]*?<\/ul>/ig, '')
);

const prereqLessons = computed(() => {
  const deps = Array.isArray(lesson.value?.buildsOn) ? lesson.value.buildsOn : [];
  const all = Array.isArray(data?.LESSONS) ? data.LESSONS : [];
  return deps.map((id) => all.find((x) => x && x.id === id)).filter(Boolean);
});

const followUpLessons = computed(() => {
  const curId = lessonId.value;
  const all = Array.isArray(data?.LESSONS) ? data.LESSONS : [];
  return all.filter((x) => x && Array.isArray(x.buildsOn) && x.buildsOn.includes(curId));
});

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
            <section class="hcp-glossary-strip" v-if="ph.id === 1 && (glossary.length || prereqLessons.length || followUpLessons.length)">
              <h2 class="hcp-glossary-strip-h">
                <button type="button" class="hcp-accordion-head" @click="toggleGlossary" :aria-expanded="String(glossaryOpen)">
                  <span>Từ điển thuật ngữ bài này ({{ glossary.length }}) & Bản đồ bài học liên quan</span>
                  <svg class="hcp-chev" :class="{ open: glossaryOpen }" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </h2>
              <div class="hcp-glossary-list" v-show="glossaryOpen">
                <div class="hcp-roadmap-links" v-if="prereqLessons.length || followUpLessons.length">
                  <div v-if="prereqLessons.length" class="hcp-roadmap-group">
                    <span class="hcp-roadmap-label">Kiến thức nền đã học ở trước:</span>
                    <a v-for="pl in prereqLessons" :key="pl.id" class="hcp-qchip" :href="'#/lesson/' + pl.id">{{ pl.id }} · {{ pl.title }}</a>
                  </div>
                  <div v-if="followUpLessons.length" class="hcp-roadmap-group">
                    <span class="hcp-roadmap-label">Các bài phía sau sẽ mổ xẻ sâu hơn từ bài này:</span>
                    <a v-for="fl in followUpLessons" :key="fl.id" class="hcp-qchip" :href="'#/lesson/' + fl.id">{{ fl.id }} · {{ fl.title }}</a>
                  </div>
                </div>
                <div class="hcp-glossary-item" v-for="g in glossary" :key="g.term">
                  <p class="hcp-glossary-term">{{ g.term }}</p>
                  <p class="hcp-glossary-def" v-html="renderHtml(esc(g.def))"></p>
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
  padding: 16px 20px; font-size: 15px; font-weight: 600; color: var(--fg); cursor: pointer;
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
/* Nội dung chặng do phaseContent() sinh ra rồi chèn bằng v-html, nên không mang
   attribute scope của component. Mọi rule cho nó phải đi qua :deep(), nếu không
   selector biên dịch thành .hcp-x[data-v-hash] và không bao giờ khớp.
   Padding 20px lấy từ design.pen frame "Nội dung pha 1" = [0, 20, 20, 20]. */
.hcp-phase-body { padding: 4px 20px 20px; }
.hcp-phase-body :deep(.hcp-checklist) { margin: 0; padding-left: 20px; display: grid; gap: 10px; }
.hcp-phase-body :deep(.hcp-checklist-item) { margin: 0; line-height: 1.6; color: var(--fg); }
.hcp-phase-body :deep(.hcp-prompt) { color: var(--fg); font-size: 15px; }
.hcp-phase-body :deep(.hcp-predict) { display: grid; gap: 12px; }
.hcp-phase-body :deep(.hcp-predict-q) { margin: 0; font-size: 15px; line-height: 1.65; }
.hcp-phase-body :deep(.hcp-predict-a) { margin: 0; padding: 14px; border-radius: var(--r); background: var(--sunken); border: 1px solid var(--line); font-size: 15px; line-height: 1.65; }
.hcp-phase-body :deep(.hcp-reveal-ans) { width: 100%; justify-content: center; font-size: 14px; font-weight: 600; min-height: 44px; }
.hcp-phase-body :deep(.hcp-placeholder) { border: 1px dashed var(--fg-2); border-radius: var(--r-card); padding: 16px; text-align: center; }
.hcp-phase-body :deep(.hcp-placeholder-msg) { margin: 0; color: var(--fg-3); font-size: 14px; font-family: var(--mono); }
.hcp-phase-body :deep(.hcp-notes) { margin-top: 4px; }
.hcp-phase-body :deep(.hcp-section) { margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid var(--line); }
.hcp-phase-body :deep(.hcp-section:first-child) { margin-top: 12px; padding-top: 0; border-top: none; }
.hcp-phase-body :deep(.hcp-section-h) { margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: var(--fg-2); }
.hcp-phase-body :deep(.hcp-body) { font-size: 15px; line-height: 1.68; color: var(--fg); }
.hcp-phase-body :deep(.hcp-body p) { margin: 0 0 10px 0; }
.hcp-phase-body :deep(.hcp-body p:last-child) { margin-bottom: 0; }
.hcp-phase-body :deep(.hcp-body ul), .hcp-phase-body :deep(.hcp-body ol) { margin: 6px 0 10px 0; padding-left: 20px; display: grid; gap: 6px; }
.hcp-phase-body :deep(.hcp-bridge) { color: var(--fg-2); background: var(--sunken); padding: 12px 14px; border-radius: var(--r); }
.hcp-phase-body :deep(.hcp-bridge-list) { margin: 0; padding: 12px 14px; background: var(--sunken); color: var(--fg-2); border-radius: var(--r); list-style: none; display: grid; gap: 10px; }
.hcp-phase-body :deep(.hcp-bridge-list li) { margin: 0; }
.hcp-phase-body :deep(.hcp-code) { margin: 10px 0; padding: 14px 16px; border-radius: var(--r); background: var(--code-bg); color: var(--code-fg); font-family: var(--mono); font-size: 13.5px; line-height: 1.55; overflow-x: auto; }
.hcp-phase-body :deep(.hcp-code-note) { margin-top: 8px; color: var(--fg-2); }
.hcp-phase-body :deep(.hcp-callout-warn) { margin-top: 10px; padding: 12px 16px; border-radius: var(--r); background: var(--warn-soft, var(--sunken)); border: 1px solid var(--line); }
.hcp-phase-body :deep(.hcp-callout-label) { margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: var(--warn, var(--accent-ink)); }
.hcp-phase-body :deep(.hcp-callout-body) { margin: 0; font-size: 14px; line-height: 1.6; color: var(--fg); }
.hcp-phase-body :deep(.hcp-say-box) { padding: 14px 16px; border-radius: var(--r); background: var(--sunken); border: 1px solid var(--line); }
.hcp-phase-body :deep(.hcp-voice) { margin: 0 0 12px 0; color: var(--fg); }
.hcp-phase-body :deep(.hcp-voice:last-child) { margin-bottom: 0; }
.hcp-phase-body :deep(.hcp-cue-answer) { margin-top: 6px; padding: 8px 12px; border-radius: var(--r); background: var(--sunken); font-size: 14px; line-height: 1.6; color: var(--fg-2); }
.hcp-phase-body :deep(.hcp-cue-answer strong) { color: var(--fg); }
.hcp-phase-body :deep(.hcp-timeline) { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.hcp-phase-body :deep(.hcp-timeline) li { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 12px; align-items: baseline; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14.5px; line-height: 1.55; }
.hcp-phase-body :deep(.hcp-timeline) li:last-child { border-bottom: none; }
.hcp-phase-body :deep(.hcp-tight) { margin: 0; padding-left: 20px; display: grid; gap: 10px; font-size: 15px; line-height: 1.65; }
.hcp-phase-body :deep(.hcp-time) { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--accent-ink); }
.hcp-phase-body :deep(.hcp-cto) { display: flex; flex-direction: column; gap: 10px; }
.hcp-phase-body :deep(.hcp-cto-item) { border: 1px solid var(--line); border-radius: var(--r); background: var(--sunken); overflow: hidden; }
.hcp-phase-body :deep(.hcp-cto-head) { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border: none; background: transparent; color: var(--fg); font: inherit; font-size: 15px; font-weight: 600; text-align: left; cursor: pointer; line-height: 1.5; }
.hcp-phase-body :deep(.hcp-cto-icon) { flex: none; font-family: var(--mono); color: var(--fg-3); font-size: 16px; }
.hcp-phase-body :deep(.hcp-cto-a) { padding: 0 16px 14px 16px; font-size: 15px; line-height: 1.65; color: var(--fg); border-top: 1px solid var(--line); padding-top: 12px; }
.hcp-phase-body :deep(.hcp-qchips) { display: flex; flex-wrap: wrap; gap: 8px; }
.hcp-phase-body :deep(.hcp-qchip) { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-ink); font-size: 13.5px; font-weight: 600; text-decoration: none; }
.hcp-phase-body :deep(.hcp-qchip:hover) { text-decoration: underline; }
.hcp-phase-body :deep(.hcp-empty) { color: var(--fg-3); font-style: italic; }
.hcp-phase-body :deep(.hcp-done) { text-align: center; padding: 20px; border-top: 1px solid var(--line); }
.hcp-phase-body :deep(.hcp-done-msg) { margin: 0; font-size: 16px; font-weight: 600; color: var(--ok); }
.hcp-footer-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
.hcp-next-btn { min-width: 160px; justify-content: center; }
.hcp-error { padding: 20px; text-align: center; color: var(--err); }
.hcp-phase-body :deep(.hcp-svg-wrap) { margin: 8px 0 0 0; overflow: auto; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); padding: 12px; }
.hcp-phase-body :deep(.hcp-svg-inner) svg { width: 100%; max-width: 720px; height: auto; display: block; margin: 0 auto; }
.hcp-phase-body :deep(.hcp-svg-cap) { margin: 8px 0 0 0; font-size: 13px; color: var(--fg-3); text-align: center; }
.hcp-phase-body :deep(.hcp-lesson-link) { color: var(--accent-ink); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
.hcp-roadmap-links { display: grid; gap: 10px; padding-bottom: 12px; margin-bottom: 10px; border-bottom: 1px dashed var(--line-2); }
.hcp-roadmap-group { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.hcp-roadmap-label { font-size: 13px; font-weight: 600; color: var(--fg-2); margin-right: 4px; }
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
