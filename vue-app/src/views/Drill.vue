<script setup>
import { ref, computed, inject, watch, onMounted, onBeforeUnmount } from 'vue';
import DrillCard from '../components/DrillCard.vue';
import store from '../store.js';
import * as leitner from '../leitner.js';

const data = inject('data');
const route = inject('route');
const LOGIC = data.LOGIC;
const QS = (Array.isArray(data.QUESTIONS) ? data.QUESTIONS : []).filter((x) => x && typeof x === 'object');
const INTROS = data.GROUP_INTROS && typeof data.GROUP_INTROS === 'object' ? data.GROUP_INTROS : {};
const byId = new Map(QS.map((q) => [q.id, q]));

const uniq = (arr) => [...new Set(arr.filter((x) => typeof x === 'string' && x))].sort();
const groupOpts = uniq(QS.map((q) => q.group)).map((g) => ({
  key: g,
  label: g + ' · ' + (INTROS[g] && INTROS[g].title ? INTROS[g].title : 'Nhóm ' + g),
  n: QS.filter((q) => q.group === g).length,
}));
const prioOpts = uniq(QS.map((q) => q.prio));
const levelOpts = uniq(QS.map((q) => q.level));

// Filter state is seeded from the route (#/drill?ids=&group=&prio=) and kept locally afterwards.
const ids = ref(null);
const group = ref('');
const prio = ref('');
const level = ref('');
const q = ref('');
const dueOnly = ref(false);
const idx = ref(0);
const revealed = ref(false);
const tick = ref(0); // bumped after each rating so leitner-derived values recompute

function seed() {
  const qy = (route && route.query) || {};
  const raw = typeof qy.ids === 'string' ? qy.ids : '';
  const list = raw.split(',').map((s) => s.trim()).filter((s) => byId.has(s));
  ids.value = list.length ? list : null;
  group.value = typeof qy.group === 'string' && groupOpts.some((g) => g.key === qy.group) ? qy.group : '';
  prio.value = typeof qy.prio === 'string' ? qy.prio : '';
  level.value = '';
  q.value = '';
  dueOnly.value = false;
  idx.value = 0;
}
seed();
watch(() => route && route.query, seed, { deep: true });

const pool = computed(() => (ids.value ? ids.value.map((id) => byId.get(id)) : QS));
const filtered = computed(() =>
  LOGIC.filterQuestions(pool.value, { group: group.value, prio: prio.value, level: level.value, q: q.value })
);
const dueTotal = computed(() => {
  void tick.value;
  return leitner.dueCount(filtered.value.map((x) => x.id));
});
const list = computed(() => {
  void tick.value;
  if (!dueOnly.value) return filtered.value;
  const due = new Set(leitner.dueIds(filtered.value.map((x) => x.id)));
  return filtered.value.filter((x) => due.has(x.id));
});
const cur = computed(() => list.value[idx.value] || null);
const ratedText = computed(() => {
  void tick.value;
  if (!cur.value) return '';
  const s = leitner.getState()[cur.value.id];
  return s ? 'Đã lưu: hộp ' + s.box + ', ôn lại ' + s.due : '';
});

watch([group, prio, level, q, dueOnly, ids], () => { idx.value = 0; });
watch(() => (cur.value ? cur.value.id : ''), () => { revealed.value = false; });

function clearIds() {
  ids.value = null;
  idx.value = 0;
}
function prev() {
  if (idx.value > 0) idx.value -= 1;
}
function next() {
  if (idx.value < list.value.length - 1) idx.value += 1;
}
function reveal(id) {
  if (!cur.value) return;
  revealed.value = true;
  store.markSpoken(id || cur.value.id);
}
function rateCur(r) {
  if (!cur.value) return;
  leitner.rate(cur.value.id, r);
  tick.value += 1;
}

// Keyboard: space reveals; 1/2/3 rate once revealed; arrows move. Typing in fields is never intercepted.
function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
function onKey(e) {
  if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ') {
    if (!revealed.value && cur.value) {
      e.preventDefault();
      reveal();
    }
  } else if (e.key === '1' || e.key === '2' || e.key === '3') {
    if (revealed.value && cur.value) {
      e.preventDefault();
      rateCur(Number(e.key));
    }
  } else if (e.key === 'ArrowLeft') {
    prev();
  } else if (e.key === 'ArrowRight') {
    next();
  }
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="drill">
    <aside class="rail">
      <div class="field">
        <label class="flabel" for="dr-q">Tìm</label>
        <input id="dr-q" v-model="q" type="search" placeholder="Từ khóa, ví dụ: lambda, cors" autocomplete="off" />
      </div>
      <div class="field">
        <span class="flabel" id="dr-g-l">Nhóm</span>
        <div class="opts" role="group" aria-labelledby="dr-g-l">
          <button type="button" class="opt" :class="{ on: group === '' }" :aria-pressed="group === ''" @click="group = ''">Tất cả nhóm</button>
          <button v-for="g in groupOpts" :key="g.key" type="button" class="opt" :class="{ on: group === g.key }" :aria-pressed="group === g.key" @click="group = g.key">{{ g.label }} ({{ g.n }})</button>
        </div>
      </div>
      <div class="field">
        <span class="flabel" id="dr-p-l">Ưu tiên</span>
        <div class="chips" role="group" aria-labelledby="dr-p-l">
          <button type="button" class="chip-btn" :class="{ on: prio === '' }" :aria-pressed="prio === ''" @click="prio = ''">Tất cả</button>
          <button v-for="p in prioOpts" :key="p" type="button" class="chip-btn" :class="{ on: prio === p }" :aria-pressed="prio === p" @click="prio = p">{{ p }}</button>
        </div>
      </div>
      <div class="field">
        <span class="flabel" id="dr-l-l">Mức</span>
        <div class="chips" role="group" aria-labelledby="dr-l-l">
          <button type="button" class="chip-btn" :class="{ on: level === '' }" :aria-pressed="level === ''" @click="level = ''">Tất cả</button>
          <button v-for="l in levelOpts" :key="l" type="button" class="chip-btn" :class="{ on: level === l }" :aria-pressed="level === l" @click="level = l">{{ l }}</button>
        </div>
      </div>
      <button type="button" class="toggle" :class="{ on: dueOnly }" :aria-pressed="dueOnly" @click="dueOnly = !dueOnly">
        Chỉ thẻ đến hạn hôm nay ({{ dueTotal }})
      </button>
      <p v-if="ids" class="mode">
        Đang ôn {{ ids.length }} câu theo danh sách.
        <button type="button" class="link" @click="clearIds">Xem tất cả</button>
      </p>
      <p class="count">{{ list.length }} thẻ</p>
    </aside>

    <section class="main">
      <h1 class="drill-title">Ôn câu hỏi</h1>
      <h2 v-if="group && INTROS[group]" class="gtitle">{{ INTROS[group].title }}</h2>
      <p v-if="!list.length" class="empty">
        {{ dueOnly ? 'Hôm nay không có thẻ nào đến hạn trong bộ lọc này.' : 'Không có thẻ nào khớp bộ lọc.' }}
      </p>

      <template v-else-if="cur">
        <nav class="nav-top" aria-label="Điều hướng thẻ">
          <button type="button" class="btn" :disabled="idx === 0" @click="prev">← Trước</button>
          <span class="pos">{{ idx + 1 }}/{{ list.length }}</span>
          <button type="button" class="btn primary" :disabled="idx >= list.length - 1" @click="next">Sau →</button>
        </nav>

        <DrillCard
          :key="cur.id"
          :q="cur"
          :revealed="revealed"
          :rating-labels="[]"
          :rated-info="ratedText"
          @reveal="reveal"
          @rate="rateCur"
        />
      </template>
    </section>
  </div>
</template>

<style scoped>
.drill { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; min-width: 0; color: var(--fg); font-family: var(--sans); }
.rail { display: grid; gap: 16px; align-content: start; min-width: 0; }
.field { display: grid; gap: 6px; min-width: 0; }
.flabel { margin: 0; font-size: 14px; font-weight: 700; color: var(--fg-2); }
input {
  width: 100%; min-height: 44px; padding: 10px 12px; border-radius: var(--r);
  border: 1px solid transparent; background: var(--sunken); color: var(--fg); font: inherit; font-size: 16px;
}
input:focus-visible { outline: none; box-shadow: var(--ring); border-color: var(--focus); }
.opts {
  display: grid; gap: 4px; padding: 8px; background: var(--surface);
  border: 1px solid var(--line); border-radius: var(--r-card);
}
.opt {
  min-height: 44px; padding: 8px 10px; border: 0; border-radius: var(--r); background: transparent;
  color: var(--fg-2); font: inherit; font-size: 14px; text-align: left; cursor: pointer;
}
.opt.on { background: var(--accent-soft); color: var(--accent-ink); font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-btn {
  min-height: 44px; padding: 6px 12px; border: 0; border-radius: 999px; background: var(--sunken);
  color: var(--fg-2); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
.chip-btn.on { background: var(--accent-soft); color: var(--accent-ink); }
.toggle {
  min-height: 44px; padding: 8px 12px; border-radius: var(--r); text-align: left;
  border: 1px solid var(--line-2); background: var(--surface); color: var(--fg); font: inherit; font-size: 14px; cursor: pointer;
}
.toggle.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-ink); font-weight: 600; }
.mode, .count { margin: 0; font-size: 14px; color: var(--fg-2); }
.link {
  min-height: 44px; padding: 0 4px; border: 0; background: transparent;
  color: var(--accent-ink); font: inherit; font-size: 14px; text-decoration: underline; cursor: pointer;
}
.opt:focus-visible, .chip-btn:focus-visible, .toggle:focus-visible, .link:focus-visible, .btn:focus-visible { outline: none; box-shadow: var(--ring); }
.main { display: grid; gap: 16px; min-width: 0; }
.drill-title { margin: 0; font-size: 30px; font-weight: 700; line-height: 1.2; }
.gtitle { margin: 0; font-size: 26px; font-weight: 700; line-height: 1.3; }
.empty { margin: 0; padding: 20px; font-size: 16px; color: var(--fg-2); background: var(--sunken); border-radius: var(--r-card); }
.nav-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pos { font-family: var(--mono); font-size: 14px; color: var(--fg-2); }
.btn {
  min-height: 44px; min-width: 44px; padding: 10px 18px; border-radius: var(--r);
  border: 1px solid var(--line-2); background: var(--surface); color: var(--fg); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--surface); }

@media (min-width: 720px) {
  .drill { grid-template-columns: 260px minmax(0, 1fr); align-items: start; gap: 24px; max-width: 1080px; }
  .rail { position: sticky; top: 12px; }
  .gtitle { font-size: 28px; }
}
@media (max-width: 719px) {
  .opts {
    display: flex; flex-wrap: nowrap; gap: 8px; padding: 0 0 4px;
    background: transparent; border: 0; border-radius: 0;
    overflow-x: auto; scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch; scrollbar-width: thin;
  }
  .opt {
    flex: 0 0 auto; min-height: 44px; scroll-snap-align: start;
    padding: 8px 14px; border-radius: 999px;
    background: var(--sunken); color: var(--fg-2); white-space: nowrap;
  }
  .opt.on { background: var(--accent-soft); color: var(--accent-ink); }
}
</style>
