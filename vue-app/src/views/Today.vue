<script setup>
import { computed, ref } from 'vue';
import { dateISO, addDaysISO } from '../utils.js';
import store from '../store.js';

const QUESTIONS = window.__HCP_DATA?.QUESTIONS || [];
const LOGIC = window.__HCP_DATA?.LOGIC || {};
const LEITNER_KEY = store.KEYS.leitner;

const P0_IDS = computed(() => {
  const out = [];
  for (const q of QUESTIONS) {
    if (q && q.id && q.prio === 'P0') out.push(String(q.id));
  }
  return out;
});

// ---------- Ngày học: gói học từ STUDY_PLANS (data giữ nguyên) ----------
const PLAN_KEYS = ['six_hours', 'two_days', 'three_days'];
const PLANS = computed(() => {
  const all = window.__HCP_DATA?.STUDY_PLANS || {};
  return PLAN_KEYS.filter((k) => all[k] && Array.isArray(all[k].blocks)).map((k) => ({ key: k, ...all[k] }));
});
const activePlanKey = ref(PLAN_KEYS[0]);
const activePlan = computed(() => PLANS.value.find((p) => p.key === activePlanKey.value) || PLANS.value[0] || null);
function tabTitle(p) { return String(p.label || '').split(' — ')[0]; }
function pickLabel(pick) {
  return (pick || []).map((p) => {
    let s = p.limit + ' câu';
    if (p.prio) s += ' ' + p.prio;
    if (p.group) s += ' nhóm ' + p.group;
    if (p.level) s += ' ' + p.level;
    if (p.type) s += ' ' + p.type;
    return s;
  }).join(', ');
}

// ---------- Leitner ----------
const leitner = ref({});
const todayISO = ref(dateISO());
const todayQid = ref(null);
const todayOpen = ref(false);

// ---------- persistence (old key, read-only compat) ----------
function loadLeitner() {
  const raw = localStorage.getItem(LEITNER_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const clean = {};
      for (const k of Object.keys(s)) {
        const v = s[k];
        if (v && typeof v === 'object' && isFinite(v.box) && v.box >= 1 && v.box <= 5) {
          clean[k] = v;
        }
      }
      leitner.value = clean;
    }
  } catch {}
}
function saveLeitner() {
  localStorage.setItem(LEITNER_KEY, JSON.stringify(leitner.value));
}
loadLeitner();

function boxInfo(b) { return { box: b, due: addDaysISO(todayISO.value, b - 1) }; }

function countBox(n) {
  let c = 0;
  for (const qid of P0_IDS.value) if ((leitner.value[qid] || {}).box === n) c++;
  return c;
}
function pendingBox1() {
  let c = 0;
  for (const qid of P0_IDS.value) if (!leitner.value[qid] || (leitner.value[qid].box || 0) < 2) c++;
  return c;
}
function readyCount() {
  let c = 0;
  for (const qid of P0_IDS.value) if ((leitner.value[qid] || {}).box === 5) c++;
  return c;
}
function draw() {
  const due = LOGIC.leitnerDueQids?.(P0_IDS.value, leitner.value, todayISO.value) || [];
  if (!due.length) return null;
  return due[Math.floor(Math.random() * due.length)];
}
function drawToday() { todayQid.value = draw(); todayOpen.value = false; }
function toggleAnswer() { if (todayQid.value) todayOpen.value = !todayOpen.value; }
function grade(ok) {
  if (!todayQid.value) return;
  const state = {};
  state[todayQid.value] = LOGIC.leitnerGrade?.(leitner.value, todayQid.value, ok, todayISO.value);
  leitner.value = Object.assign({}, leitner.value, state);
  saveLeitner();
  drawToday();
}
function resetConfirm() {
  if (!confirm('Xóa toàn bộ tiến độ hộp Leitner hôm nay?')) return;
  localStorage.removeItem(LEITNER_KEY);
  leitner.value = {};
  drawToday();
}

const currentCard = computed(() => {
  if (!todayQid.value) return null;
  return (QUESTIONS || []).find((q) => q && q.id === todayQid.value) || null;
});
const answer = computed(() => {
  const q = currentCard.value;
  if (!q) return null;
  if (q.expected && q.expected.trim()) return { label: 'Kết quả đúng và nguyên nhân', text: q.expected, html: false };
  if (q.oral && q.oral.trim()) return { label: 'Trả lời miệng', text: q.oral, html: false };
  return null;
});
const activeBox = computed(() => {
  const q = currentCard.value;
  if (!q) return 1;
  const st = leitner.value[q.id];
  return (st && isFinite(st.box)) ? st.box : 1;
});
function renderAnswer() {
  const a = answer.value;
  if (!a) return '';
  return '<p><strong>' + a.label + '</strong></p><p>' + (a.html ? a.text : a.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')) + '</p>';
}
function boxColor(n) {
  if (n === activeBox.value) return 'now';
  return (n >= 3) ? 'done' : 'new';
}
</script>

<template>
  <div class="hcp-today">
    <h1 class="hcp-plan-title">Ngày học</h1>
    <p class="hcp-plan-lede" v-if="activePlan">{{ activePlan.label }}</p>
    <div class="hcp-plan-tabs" role="tablist">
      <button v-for="p in PLANS" :key="p.key" type="button" role="tab" class="hcp-plan-tab"
              :class="{ on: activePlanKey === p.key }" :aria-selected="activePlanKey === p.key"
              @click="activePlanKey = p.key">{{ tabTitle(p) }}</button>
    </div>
    <div class="hcp-plan-blocks" v-if="activePlan">
      <div v-for="(b, i) in activePlan.blocks" :key="activePlan.key + '-' + i" class="hcp-plan-block" :class="{ now: i === 0 }">
        <span class="hcp-plan-num">{{ i + 1 }}</span>
        <p class="hcp-plan-k">Làm gì</p>
        <p class="hcp-plan-v">{{ b.what }}</p>
        <template v-if="i === 0">
          <p class="hcp-plan-k">Làm thế nào</p>
          <p class="hcp-plan-v">{{ b.how }}</p>
          <p class="hcp-plan-k">Câu nào</p>
          <p class="hcp-plan-v">{{ pickLabel(b.pick) }}</p>
        </template>
      </div>
    </div>

    <div class="hcp-today-grid">
      <div class="hcp-today-statement">
        <p class="hcp-today-eyebrow">Phương pháp Leitner</p>
        <h2 class="hcp-today-title" id="hcp-today-h">Đúng thì lên hộp. Sai thì về hộp một.</h2>
        <p class="hcp-today-lede">Mỗi câu bắt đầu ở hộp một và được ôn thường xuyên nhất. Trả lời đúng, câu sang hộp kế tiếp và lâu hơn mới gặp lại. Trả lời sai, câu quay về hộp một.</p>
        <div class="hcp-today-note" id="hcp-today-note">
          Khoảng ôn 1 · 2 · 4 · 8 · 16 ngày là đề xuất chưa được kiểm chứng; cách tính và nguồn tham chiếu ghi trong DESIGN.md.
        </div>
      </div>

      <div class="hcp-today-boxes">
        <template v-for="n in 5" :key="n">
          <div class="hcp-today-box" :class="boxColor(n)"
               :style="{ borderLeftColor: n === activeBox ? 'var(--accent)' : '' }">
            <p class="hcp-today-box-label">Hộp {{ n }}</p>
            <p class="hcp-today-box-n">{{ countBox(n) }}</p>
            <p class="hcp-today-box-int">ôn mỗi {{ LOGIC.LEITNER_INTERVALS?.[n - 1] || '-' }} ngày</p>
            <p class="hcp-today-box-due" v-if="todayQid && (leitner[todayQid] || {}).box === n">đến hạn: {{ (leitner[todayQid] || {}).due }}</p>
          </div>
        </template>
      </div>
    </div>

    <div class="hcp-today-card" id="hcp-today-card">
      <div v-if="!todayQid" class="hcp-today-empty">
        <p class="hcp-today-empty-msg">Hôm nay không có thẻ đến hạn.</p>
        <p class="hcp-today-empty-sub">Còn {{ pendingBox1() }} thẻ hộp một cần ôn.</p>
      </div>
      <div v-else class="hcp-today-body">
        <div class="hcp-today-q">
          <span class="hcp-q-id">{{ currentCard.id }}</span>
          <p class="hcp-q-text">{{ currentCard.q }}</p>
        </div>
        <button type="button" class="hcp-btn hcp-btn-primary hcp-btn-full" id="hcp-today-open"
                @click="toggleAnswer" :aria-expanded="todayOpen">
          {{ todayOpen ? 'Thu đáp án' : 'Mở đáp án' }}
        </button>
        <div class="hcp-today-ans" id="hcp-today-ans" :hidden="!todayOpen" v-html="renderAnswer()"></div>
        <div class="hcp-today-grade" id="hcp-today-grade">
          <button type="button" class="hcp-btn hcp-btn-ok" id="hcp-today-ok" @click="grade(true)">Nhớ được</button>
          <button type="button" class="hcp-btn hcp-btn-err" id="hcp-today-no" @click="grade(false)">Chưa nhớ</button>
        </div>
      </div>
    </div>

    <div class="hcp-today-ready" id="hcp-today-ready">
      <span class="hcp-ready-h">Sẵn sàng</span>
      <span class="hcp-ready-count">{{ readyCount() }} / {{ P0_IDS.length }}</span>
      <span class="hcp-ready-note">(đề xuất, không phải điểm chuẩn)</span>
    </div>

    <div class="hcp-today-kbd" id="hcp-today-kbd">
      <p><kbd>Enter</kbd> rút thẻ · <kbd>Space</kbd> mở đáp án · <kbd>1</kbd> nhớ được · <kbd>2</kbd> chưa nhớ · <kbd>Esc</kbd> reset hộp</p>
    </div>

    <div class="hcp-today-actions">
      <button type="button" class="hcp-btn hcp-btn-ghost" id="hcp-today-reset" @click="resetConfirm">Xoá tiến độ hộp</button>
    </div>
  </div>
</template>

<style scoped>
.hcp-today { max-width: 1100px; margin: 0 auto; }
.hcp-today-grid {
  display: grid; grid-template-columns: 1fr 340px; gap: 16px; margin-bottom: 20px;
}
@media (max-width: 768px) {
  .hcp-today-grid { grid-template-columns: 1fr; }
}
.hcp-today-eyebrow { margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: var(--accent-ink); text-transform: uppercase; letter-spacing: 0.03em; }
.hcp-today-title { margin: 0 0 8px 0; font-size: 20px; color: var(--fg); }
.hcp-today-lede { margin: 0 0 10px 0; font-size: 14px; color: var(--fg-2); line-height: 1.5; }
.hcp-today-note { font-size: 12px; color: var(--fg-3); font-style: italic; border-top: 1px solid var(--line); padding-top: 8px; }
.hcp-today-boxes { display: flex; flex-direction: column; gap: 8px; }
.hcp-today-box {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card);
  padding: 10px 12px; transition: all 0.15s;
}
.hcp-today-box.new { border-left: 4px solid var(--neutral-fill); }
.hcp-today-box.done { border-left: 4px solid var(--ok); background: var(--ok-soft); }
.hcp-today-box.now { border-left: 4px solid var(--accent); border-color: var(--accent); background: var(--accent-soft); }
.hcp-today-box-label { margin: 0; font-size: 13px; color: var(--fg-2); }
.hcp-today-box-n { margin: 4px 0 2px 0; font-size: 24px; font-weight: 700; color: var(--fg); }
.hcp-today-box-int { margin: 0; font-size: 12px; color: var(--fg-3); }
.hcp-today-box-due { margin: 4px 0 0 0; font-size: 11px; color: var(--fg-3); font-family: var(--mono); }
.hcp-today-card { border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); margin-bottom: 14px; }
.hcp-today-empty { padding: 30px 20px; text-align: center; }
.hcp-today-empty-msg { margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: var(--fg); }
.hcp-today-empty-sub { margin: 0; font-size: 13px; color: var(--fg-3); }
.hcp-today-body { padding: 16px; }
.hcp-today-q { margin-bottom: 12px; }
.hcp-q-id { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--accent-ink); margin-right: 8px; }
.hcp-q-text { margin: 0; font-size: 16px; line-height: 1.5; color: var(--fg); }
.hcp-today-ans { margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid var(--line); font-size: 15px; line-height: 1.6; }
.hcp-today-grade { display: flex; gap: 10px; margin-top: 14px; }
.hcp-btn-full { width: 100%; justify-content: center; }
.hcp-today-ready { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--fg-2); margin-bottom: 10px; }
.hcp-ready-h { font-weight: 600; color: var(--fg); }
.hcp-ready-count { font-weight: 700; color: var(--accent-ink); }
.hcp-ready-note { font-size: 12px; color: var(--fg-3); font-style: italic; }
.hcp-today-kbd { font-size: 13px; color: var(--fg-3); margin-bottom: 10px; }
.hcp-today-kbd kbd {
  padding: 2px 6px; border: 1px solid var(--line); border-radius: 4px; background: var(--sunken);
  font-family: var(--mono); font-size: 11px; color: var(--fg-2); margin: 0 3px;
}
.hcp-today-actions { display: flex; justify-content: flex-end; }
.hcp-btn-ok { border-color: var(--ok); color: var(--ok); }
.hcp-btn-ok:hover { background: var(--ok); color: white; }
.hcp-btn-err { border-color: var(--err); color: var(--err); }
.hcp-btn-err:hover { background: var(--err); color: white; }
.hcp-plan-title { margin: 0 0 6px 0; font-size: 28px; font-weight: 700; color: var(--fg); }
.hcp-plan-lede { margin: 0 0 16px 0; font-size: 16px; color: var(--fg-2); line-height: 1.5; }
.hcp-plan-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.hcp-plan-tab {
  padding: 10px 16px; border: 1px solid var(--line-2); border-radius: var(--r); background: var(--surface);
  color: var(--fg-2); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
.hcp-plan-tab.on { background: var(--accent-soft); color: var(--accent-ink); border-color: var(--accent-soft); }
.hcp-plan-blocks { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.hcp-plan-block {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card);
  padding: 20px; display: flex; flex-direction: column; gap: 8px;
}
.hcp-plan-block.now { border: 2px solid var(--accent); padding: 24px; gap: 12px; }
.hcp-plan-num { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--fg-3); }
.hcp-plan-block.now .hcp-plan-num { color: var(--accent); }
.hcp-plan-k { margin: 0; font-size: 14px; font-weight: 700; color: var(--fg-2); }
.hcp-plan-v { margin: 0; font-size: 16px; line-height: 1.5; color: var(--fg); }
</style>
