<script setup>
import { ref, computed, inject, watch, onMounted, onBeforeUnmount } from 'vue';
import { renderLinkedHtml } from '../utils.js';
import * as leitner from '../leitner.js';

const data = inject('data');
const QS = (Array.isArray(data.QUESTIONS) ? data.QUESTIONS : []).filter((x) => x && typeof x === 'object');

// P0 first, then id ascending.
const deck = [...QS].sort((a, b) => {
  const ap = a.prio === 'P0' ? 0 : 1;
  const bp = b.prio === 'P0' ? 0 : 1;
  return ap - bp || String(a.id).localeCompare(String(b.id));
});

const kw = ref('');
const idx = ref(0);
const open = ref(false);
const tick = ref(0); // bumped after each rating so leitner-derived values recompute
const searchEl = ref(null);

const filtered = computed(() => {
  const k = kw.value.trim().toLowerCase();
  if (!k) return deck;
  return deck.filter(
    (x) =>
      String(x.q || '').toLowerCase().includes(k) ||
      String(x.topic || '').toLowerCase().includes(k),
  );
});
const cur = computed(() => filtered.value[idx.value] || null);
// say30 wins over oral when present.
const oral = computed(() => (cur.value && (cur.value.say30 || cur.value.oral)) || '');
const deep = computed(() =>
  cur.value && typeof cur.value.deep === 'string' ? renderLinkedHtml(cur.value.deep, data?.LESSONS) : '',
);

function statusOf(id) {
  void tick.value;
  const s = leitner.getState()[id];
  if (!s) return 'Chưa học';
  if (s.box === 5) return 'Đã nắm';
  if (s.box === 1) return 'Yếu';
  return 'Đang ôn';
}

watch(kw, () => {
  idx.value = 0;
});
watch(
  () => (cur.value ? cur.value.id : ''),
  () => {
    open.value = false;
  },
);

function prev() {
  if (idx.value > 0) idx.value -= 1;
}
function next() {
  if (idx.value < filtered.value.length - 1) idx.value += 1;
}
function toggle() {
  open.value = !open.value;
}
function grade(r) {
  if (!cur.value) return;
  leitner.rate(cur.value.id, r);
  tick.value += 1;
  next();
}

// Copied from Drill.vue: never steal keys while the user is typing.
function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
function onKey(e) {
  if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ') {
    if (!cur.value) return;
    e.preventDefault();
    toggle();
  } else if (e.key === 'ArrowLeft') {
    prev();
  } else if (e.key === 'ArrowRight') {
    next();
  } else if (e.key === '1') {
    grade(3);
  } else if (e.key === '2') {
    grade(1);
  } else if (e.key === '/') {
    e.preventDefault();
    if (searchEl.value) searchEl.value.focus();
  }
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="hcp-page">
    <header class="hcp-page-head">
      <h1 class="hcp-page-title">Flashcard</h1>
      <p class="hcp-page-lede">
        Đọc câu hỏi, trả lời miệng, rồi mới bật đáp án. Tự chấm: <em>biết</em> hoặc
        <em>yếu</em> — trạng thái lưu vào tiến độ.
      </p>
      <p class="keys">
        <span class="hcp-kbd">Space</span> hiện đáp án · <span class="hcp-kbd">←</span>
        <span class="hcp-kbd">→</span> đổi câu · <span class="hcp-kbd">1</span> biết ·
        <span class="hcp-kbd">2</span> yếu · <span class="hcp-kbd">/</span> tìm kiếm
      </p>
    </header>

    <div class="field">
      <label class="flabel" for="fc-q">Tìm kiếm</label>
      <input
        id="fc-q"
        ref="searchEl"
        v-model="kw"
        type="search"
        placeholder="Từ khóa trong câu hỏi hoặc chủ đề"
        autocomplete="off"
      />
    </div>

    <p v-if="!filtered.length" class="empty">Không có thẻ nào khớp tìm kiếm.</p>

    <section v-else-if="cur" class="card" aria-label="Thẻ flashcard">
      <div class="chips">
        <span class="hcp-chip">{{ cur.id }}</span>
        <span v-if="cur.prio" class="hcp-chip">{{ cur.prio }}</span>
        <span v-if="cur.group" class="hcp-chip">{{ cur.group }}</span>
        <span v-if="cur.level" class="hcp-chip">{{ cur.level }}</span>
        <span v-if="cur.topic" class="hcp-chip">{{ cur.topic }}</span>
        <span class="hcp-chip st">{{ statusOf(cur.id) }}</span>
      </div>

      <p class="front">{{ cur.q }}</p>

      <div class="reveal-row">
        <button type="button" class="btn primary" @click="toggle">
          {{ open ? 'Ẩn đáp án' : 'Hiện đáp án' }}
        </button>
        <span class="pos">Câu {{ idx + 1 }} / {{ filtered.length }}</span>
      </div>

      <div v-if="open" class="answer">
        <section v-if="oral" class="ablock">
          <h3 class="hcp-h3">Trả lời miệng 30–60 giây</h3>
          <p>{{ oral }}</p>
        </section>
        <section v-if="deep" class="ablock">
          <h3 class="hcp-h3">Giải thích sâu</h3>
          <div class="hcp-prose" v-html="deep"></div>
        </section>
        <section v-if="cur.expected" class="ablock warn">
          <h3 class="hcp-h3">Kết quả đúng và nguyên nhân</h3>
          <p>{{ cur.expected }}</p>
        </section>
      </div>

      <nav class="bottom" aria-label="Chấm điểm thẻ">
        <button type="button" class="btn" :disabled="idx === 0" @click="prev">← Câu trước</button>
        <button
          type="button"
          class="btn"
          :disabled="idx >= filtered.length - 1"
          @click="next"
        >
          Câu sau →
        </button>
        <button type="button" class="btn grasp" @click="grade(3)">Đã nắm</button>
        <button type="button" class="btn weak" @click="grade(1)">Cần ôn lại</button>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.flabel {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--fg-2);
}
input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: var(--r);
  border: 1px solid transparent;
  background: var(--sunken);
  color: var(--fg);
  font: inherit;
  font-size: 16px;
  box-sizing: border-box;
}
input:focus-visible {
  outline: none;
  box-shadow: var(--ring);
  border-color: var(--focus);
}
.keys {
  margin: 0;
  font-size: 14px;
  color: var(--fg-2);
}
.card {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.st {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.front {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.reveal-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pos {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--fg-2);
}
.answer {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.ablock {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.ablock > h3 {
  margin: 0;
}
.ablock > p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.ablock.warn {
  background: var(--warn-soft);
  border-radius: var(--r);
  padding: 12px 14px;
}
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 10px 18px;
  border-radius: var(--r);
  border: 1px solid var(--line-2);
  background: var(--surface);
  color: var(--fg);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--surface);
}
.bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bottom .btn {
  flex: 1 1 auto;
}
.btn.grasp {
  background: var(--ok-soft);
  border-color: transparent;
  color: var(--ok);
}
.btn.weak {
  background: var(--warn-soft);
  border-color: transparent;
  color: var(--warn);
}
.btn:focus-visible,
input:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}
.empty {
  margin: 0;
  padding: 20px;
  font-size: 16px;
  color: var(--fg-2);
  background: var(--sunken);
  border-radius: var(--r-card);
}
@media (max-width: 720px) {
  .card {
    padding: 16px;
  }
  .front {
    font-size: 20px;
  }
  .bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .bottom .btn {
    width: 100%;
  }
}
</style>
