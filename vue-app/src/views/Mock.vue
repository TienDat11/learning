<script setup>
import { ref, computed, inject, watch, onBeforeUnmount } from 'vue';

const LIMIT = 90;
const emit = defineEmits(['navigate']);
const data = inject('data');
const route = inject('route');
const LOGIC = data.LOGIC;
const QS = Array.isArray(data.QUESTIONS) ? data.QUESTIONS : [];
const SETS = data.MOCK_SETS && typeof data.MOCK_SETS === 'object' ? data.MOCK_SETS : {};

// Same resolution as the old engine (src/90-app.js): specs in order, first hit wins, dedupe by id.
function resolveQuestions(set) {
  const out = [];
  const seen = new Set();
  (Array.isArray(set.pick) ? set.pick : []).forEach((spec) => {
    (LOGIC.resolvePick(spec, QS) || []).forEach((q) => {
      if (q && q.id && !seen.has(q.id)) {
        seen.add(q.id);
        out.push(q);
      }
    });
  });
  return out;
}

const setKey = computed(() => {
  const p = (route && route.params) || {};
  return String(p.setKey || p.key || p.set || Object.values(p)[0] || '');
});
const activeSet = computed(() => (Object.prototype.hasOwnProperty.call(SETS, setKey.value) ? SETS[setKey.value] : null));
const unknownKey = computed(() => !!setKey.value && !activeSet.value);
const setList = computed(() =>
  Object.keys(SETS).map((key) => ({
    key,
    label: SETS[key].label,
    brief: SETS[key].brief,
    count: resolveQuestions(SETS[key]).length,
  }))
);

const session = ref([]);
const idx = ref(0);
const left = ref(LIMIT);
const revealed = ref(false);
const finished = ref(false);
const grades = ref({});
let timer = null;

const cur = computed(() => session.value[idx.value] || null);
const total = computed(() => session.value.length);
const fus = computed(() => (Array.isArray(cur.value && cur.value.followups) ? cur.value.followups : []).filter((f) => f && typeof f === 'object'));
const mmss = computed(() => Math.floor(left.value / 60) + ':' + String(left.value % 60).padStart(2, '0'));
const ringPct = computed(() => Math.max(0, Math.min(100, (left.value / LIMIT) * 100)));
const ringStyle = computed(() => ({
  background: 'conic-gradient(' + (left.value <= 10 ? 'var(--warn-fill)' : 'var(--accent)') + ' ' + ringPct.value + '%, var(--sunken) 0)',
}));
const progress = computed(() => (total.value ? Math.round((idx.value / total.value) * 100) : 0));
const okCount = computed(() => session.value.filter((q) => grades.value[q.id] === 'ok').length);
const weakIds = computed(() => session.value.filter((q) => grades.value[q.id] === 'weak').map((q) => q.id));

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
function startTimer() {
  stopTimer();
  left.value = LIMIT;
  timer = setInterval(() => {
    if (left.value > 0) left.value -= 1;
    if (left.value <= 0) stopTimer();
  }, 1000);
}

function build() {
  stopTimer();
  session.value = activeSet.value ? resolveQuestions(activeSet.value) : [];
  idx.value = 0;
  revealed.value = false;
  finished.value = false;
  grades.value = {};
  if (session.value.length) startTimer();
  else left.value = LIMIT;
}

watch(activeSet, build, { immediate: true });
onBeforeUnmount(stopTimer);

function reveal() {
  revealed.value = true;
  stopTimer();
}

function grade(g) {
  const q = cur.value;
  if (!q) return;
  grades.value = { ...grades.value, [q.id]: g };
  if (idx.value < total.value - 1) {
    idx.value += 1;
    revealed.value = false;
    startTimer();
  } else {
    finished.value = true;
    stopTimer();
  }
}
</script>

<template>
  <div class="mock">
    <template v-if="!activeSet">
      <h1 class="title">Mock interview</h1>
      <p v-if="unknownKey" class="notice">Không có bộ "{{ setKey }}". Chọn một bộ bên dưới.</p>
      <p class="intro">Mỗi câu 90 giây. Trả lời miệng trước, rồi mở đáp án và tự chấm Đạt hoặc Chưa đạt.</p>
      <ul class="sets">
        <li v-for="s in setList" :key="s.key" class="set">
          <h2 class="set-title">{{ s.label }}</h2>
          <p class="brief">{{ s.brief }}</p>
          <div class="set-foot">
            <span class="chip">{{ s.count }} câu</span>
            <button type="button" class="btn primary" :disabled="!s.count" @click="emit('navigate', '#/mock/' + s.key)">Bắt đầu</button>
          </div>
        </li>
      </ul>
    </template>

    <template v-else>
      <header class="head">
        <button type="button" class="btn back" @click="emit('navigate', '#/mock')">← Danh sách bộ</button>
        <h1 class="title">{{ activeSet.label }}</h1>
        <span v-if="total && !finished && cur" class="count">Câu {{ idx + 1 }}/{{ total }}</span>
        <div v-if="total && !finished && cur" class="clock" :class="{ low: left <= 10 }" :style="ringStyle">
          <div class="clock-face">
            <span class="timer" role="timer" :aria-label="'Còn ' + mmss">{{ mmss }}</span>
          </div>
        </div>
      </header>

      <p v-if="!total" class="notice">Bộ này chưa khớp câu hỏi nào.</p>

      <template v-else-if="!finished && cur">
        <div class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
          <div class="fill" :style="{ width: progress + '%' }"></div>
        </div>

        <article class="card">
          <div class="chip-row">
            <span class="chip accent">{{ cur.topic }}</span>
          </div>
          <p class="question">{{ cur.q }}</p>
          <pre v-if="cur.code" class="code"><code>{{ cur.code }}</code></pre>

          <template v-if="revealed">
            <section class="block">
              <h3 class="label">Trả lời miệng</h3>
              <p class="pre">{{ cur.oral }}</p>
            </section>
            <section v-if="fus.length" class="block">
              <h3 class="label">Hỏi sâu</h3>
              <ol class="fu">
                <li v-for="(f, i) in fus" :key="i" class="fu-item">
                  <p class="fu-q">{{ f.q }}</p>
                  <p class="pre">{{ f.a }}</p>
                </li>
              </ol>
            </section>
          </template>
        </article>

        <nav class="actbar">
          <button v-if="!revealed" type="button" class="btn primary" @click="reveal">
            {{ left > 0 ? 'Xem đáp án' : 'Hết giờ, xem đáp án' }}
          </button>
          <template v-else>
            <button type="button" class="btn weak" @click="grade('weak')">Chưa đạt</button>
            <button type="button" class="btn primary" @click="grade('ok')">Đạt</button>
          </template>
        </nav>
      </template>

      <section v-else class="sum">
        <h2 class="title">Xong bộ</h2>
        <div class="sum-grid">
          <div class="stat">
            <p class="stat-num">Đạt {{ okCount }}/{{ total }}</p>
          </div>
          <div class="stat">
            <p v-if="weakIds.length" class="weak">Cần ôn lại: {{ weakIds.join(', ') }}</p>
            <p v-else class="ok-note">Không có câu chưa đạt.</p>
          </div>
        </div>
        <div class="row">
          <button v-if="weakIds.length" type="button" class="btn primary" @click="emit('navigate', '#/drill?ids=' + weakIds.join(','))">
            Ôn {{ weakIds.length }} câu chưa đạt
          </button>
          <button type="button" class="btn outline" @click="build">Làm lại bộ này</button>
          <button type="button" class="btn outline" @click="emit('navigate', '#/mock')">Chọn bộ khác</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.mock { display: grid; gap: 24px; width: 100%; max-width: 1344px; min-width: 0; padding: 40px 48px; color: var(--fg); font-family: var(--sans); box-sizing: border-box; }
.title { font-size: 28px; font-weight: 700; margin: 0; line-height: 1.3; min-width: 0; overflow-wrap: anywhere; }
.intro, .brief, .meta, .notice { font-size: 16px; color: var(--fg-2); margin: 0; }
.notice { color: var(--warn); }
.sets { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; grid-template-columns: 1fr; }
.set { display: grid; gap: 12px; padding: 20px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); align-content: start; min-width: 0; }
.set-title { font-size: 18px; font-weight: 700; margin: 0; overflow-wrap: anywhere; }
.set-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: var(--sunken); color: var(--fg-2); font-size: 14px; font-weight: 600; white-space: nowrap; }
.chip.accent { background: var(--accent-soft); color: var(--accent-ink); }
.chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
.head { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; min-width: 0; }
.head .title { flex: 1 1 240px; }
.count { font-family: var(--mono); font-size: 16px; font-weight: 600; color: var(--fg-2); white-space: nowrap; }
.clock { position: relative; width: 136px; height: 136px; flex: 0 0 auto; border-radius: 50%; padding: 6px; background: var(--accent); }
.clock.low { background: var(--warn-fill); }
.clock-face { width: 100%; height: 100%; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; }
.timer { font-family: var(--mono); font-size: 28px; font-weight: 700; color: var(--fg); font-variant-numeric: tabular-nums; }
.clock.low .timer { color: var(--warn); }
.progress { height: 6px; background: var(--sunken); border-radius: 3px; overflow: hidden; }
.fill { height: 100%; background: var(--accent); transition: width var(--ease); }
.card { display: grid; gap: 16px; padding: 24px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); min-width: 0; }
.question { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere; }
.block { display: grid; gap: 8px; min-width: 0; }
.label { margin: 0; font-size: 14px; font-weight: 700; color: var(--fg-2); }
.pre { margin: 0; white-space: pre-line; font-size: 16px; line-height: 1.65; color: var(--fg); overflow-wrap: anywhere; }
.code { margin: 0; padding: 12px; background: var(--code-bg); color: var(--code-fg); font-family: var(--mono); font-size: 14px; line-height: 1.5; border-radius: var(--r); overflow-x: auto; max-width: 100%; }
.fu { margin: 0; padding-left: 20px; display: grid; gap: 12px; }
.fu-item { display: grid; gap: 4px; min-width: 0; }
.fu-q { margin: 0; font-size: 16px; color: var(--fg-2); font-weight: 600; }
.sum { display: grid; gap: 24px; min-width: 0; }
.sum-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
.stat { display: grid; gap: 10px; padding: 20px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); min-width: 0; }
.stat-num { margin: 0; font-family: var(--mono); font-size: 40px; font-weight: 700; line-height: 1.2; }
.weak { margin: 0; font-size: 18px; font-weight: 600; color: var(--fg); overflow-wrap: anywhere; }
.ok-note { margin: 0; font-size: 18px; font-weight: 600; color: var(--ok); }
.row { display: flex; flex-wrap: wrap; gap: 12px; }
.actbar { display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
.btn { min-height: 44px; padding: 10px 18px; border-radius: var(--r); border: 1px solid var(--line-2); background: var(--surface); color: var(--fg); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.btn.outline { background: var(--surface); border-color: var(--line-2); color: var(--fg); }
.btn.back { align-self: flex-start; }
.btn.weak { background: var(--surface); border-color: var(--line-2); color: var(--fg); min-width: 160px; }
.btn.primary:not(:disabled) { min-width: 160px; }
.btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

@media (min-width: 720px) {
  .sets { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sum-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 719px) {
  .mock { padding: 16px 16px 96px; gap: 16px; }
  .title { font-size: 22px; }
  .head { gap: 12px; }
  .head .title { flex-basis: 100%; order: 2; }
  .head .btn.back { order: 1; }
  .head .count { order: 1; margin-left: auto; }
  .clock { order: 3; margin: 0 auto; }
  .card { padding: 20px; }
  .stat-num { font-size: 32px; }
  .actbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; padding: 12px 16px; background: var(--surface); border-top: 1px solid var(--line); flex-wrap: nowrap; justify-content: stretch; }
  .actbar .btn { flex: 1; min-width: 0; }
  .btn.primary:not(:disabled), .btn.weak { min-width: 0; }
}
</style>
