<script setup>
import { ref, computed, watch } from 'vue';
import { sanitize, typeLabel } from '../utils.js';

// Presentational card. The parent owns the reveal flag and the keyboard; this component owns
// per-item toggles (follow-up answers, attack answers) and the say30/say90 tab.
const props = defineProps({
  q: { type: Object, required: true },
  revealed: { type: Boolean, default: false },
  ratingLabels: { type: Array, required: true },
  ratedInfo: { type: String, default: '' },
});
const emit = defineEmits(['reveal', 'rate']);

const DEFAULT_LABELS = ['Chưa giải thích được', 'Giải thích được bằng ví dụ', 'Làm được trong tình huống thật'];

const lists = computed(() => ({
  askFirst: Array.isArray(props.q.askFirst) ? props.q.askFirst : [],
  followups: (Array.isArray(props.q.followups) ? props.q.followups : []).filter((f) => f && typeof f === 'object'),
  pitfalls: Array.isArray(props.q.pitfalls) ? props.q.pitfalls : [],
  attacks: (Array.isArray(props.q.attacks) ? props.q.attacks : []).filter((a) => a && typeof a === 'object'),
  selfcheck: Array.isArray(props.q.selfcheck) ? props.q.selfcheck : [],
}));

const hasSay30 = computed(() => !!props.q.say30);
const hasSay90 = computed(() => !!props.q.say90);
const tab = ref('say30');
const openFu = ref({});
const openAtk = ref({});

// Reset per-question state when the card changes.
watch(() => props.q.id, () => {
  tab.value = hasSay30.value || !hasSay90.value ? 'say30' : 'say90';
  openFu.value = {};
  openAtk.value = {};
}, { immediate: true });

const labels = computed(() => [0, 1, 2].map((i) => {
  const s = lists.value.selfcheck[i];
  return typeof s === 'string' && s.trim() ? s : props.ratingLabels[i] || DEFAULT_LABELS[i];
}));

const predict = computed(() => (props.q.predict && typeof props.q.predict === 'object' ? props.q.predict : null));
const sanitized = (html) => sanitize(typeof html === 'string' ? html : '');
</script>

<template>
  <article class="card" :aria-label="'Câu ' + q.id">
    <header class="head">
      <span class="id">{{ q.id }}</span>
      <span class="chip">{{ q.prio }}</span>
      <span class="chip">{{ q.level }}</span>
      <span v-if="q.type" class="chip">{{ typeLabel(q.type) }}</span>
    </header>
    <h2 class="topic">{{ q.topic }}</h2>
    <p class="question">{{ q.q }}</p>

    <pre v-if="q.code" class="code"><code>{{ q.code }}</code></pre>

    <section v-if="q.incident" class="block">
      <h3 class="label">Tình huống</h3>
      <div class="html" v-html="sanitized(q.incident)"></div>
    </section>

    <section v-if="lists.askFirst.length" class="block">
      <h3 class="label">Tự hỏi trước khi trả lời</h3>
      <ul class="plain">
        <li v-for="(a, i) in lists.askFirst" :key="i">{{ a }}</li>
      </ul>
    </section>

    <section v-if="predict" class="block">
      <h3 class="label">Đoán trước</h3>
      <div class="html" v-html="sanitized(predict.q)"></div>
      <template v-if="revealed">
        <div class="html answer" v-html="sanitized(predict.a)"></div>
      </template>
    </section>

    <div v-if="!revealed" class="reveal-row">
      <button type="button" class="btn" @click="emit('reveal', props.q.id)">Tôi đã nói xong, mở đáp án</button>
    </div>

    <template v-else>
      <section v-if="q.oral || hasSay30 || hasSay90" class="block">
        <h3 class="label">Trả lời miệng</h3>
        <div v-if="hasSay30 || hasSay90" class="tabs" role="tablist">
          <button v-if="hasSay30" type="button" role="tab" class="tab" :class="{ on: tab === 'say30' }" :aria-selected="tab === 'say30'" @click="tab = 'say30'">30 giây</button>
          <button v-if="hasSay90" type="button" role="tab" class="tab" :class="{ on: tab === 'say90' }" :aria-selected="tab === 'say90'" @click="tab = 'say90'">90 giây</button>
        </div>
        <p v-if="tab === 'say30' && hasSay30" class="plain-text">{{ q.say30 }}</p>
        <p v-else-if="tab === 'say90' && hasSay90" class="plain-text">{{ q.say90 }}</p>
        <p v-else class="plain-text">{{ q.oral }}</p>
      </section>

      <section v-if="q.deep" class="block">
        <h3 class="label">Đi sâu</h3>
        <div class="html" v-html="sanitized(q.deep)"></div>
      </section>

      <section v-if="q.expected" class="block">
        <h3 class="label">Kết quả mong đợi</h3>
        <p class="plain-text pre">{{ q.expected }}</p>
      </section>

      <section v-if="lists.followups.length" class="block">
        <h3 class="label">Chuỗi hỏi sâu 3 tầng</h3>
        <ol class="fu">
          <li v-for="(f, i) in lists.followups" :key="i" class="fu-item">
            <p class="fu-q">{{ f.q }}</p>
            <button v-if="!openFu[i]" type="button" class="btn small" @click="openFu = { ...openFu, [i]: true }">Hiện đáp án</button>
            <p v-else class="plain-text pre">{{ f.a }}</p>
          </li>
        </ol>
      </section>

      <section v-if="lists.pitfalls.length" class="block">
        <h3 class="label">Lỗi hay gặp</h3>
        <ul class="plain">
          <li v-for="(p, i) in lists.pitfalls" :key="i">{{ p }}</li>
        </ul>
      </section>

      <section v-if="q.tradeoff" class="block">
        <h3 class="label">Đánh đổi</h3>
        <div class="html" v-html="sanitized(q.tradeoff)"></div>
      </section>
      <section v-if="q.alternatives" class="block">
        <h3 class="label">Phương án khác</h3>
        <div class="html" v-html="sanitized(q.alternatives)"></div>
      </section>
      <section v-if="q.observe" class="block">
        <h3 class="label">Quan sát trên production</h3>
        <div class="html" v-html="sanitized(q.observe)"></div>
      </section>

      <section v-if="lists.attacks.length" class="block">
        <h3 class="label">Câu hỏi phản biện</h3>
        <ul class="atk">
          <li v-for="(a, i) in lists.attacks" :key="i" class="atk-item">
            <p class="fu-q">{{ a.q }}</p>
            <button v-if="!openAtk[i]" type="button" class="btn small" @click="openAtk = { ...openAtk, [i]: true }">Hiện đáp án</button>
            <p v-else class="plain-text pre">{{ a.a }}</p>
          </li>
        </ul>
      </section>

      <section class="rate">
        <h3 class="label">Tự chấm</h3>
        <div class="rate-row">
          <button v-for="(lbl, i) in labels" :key="i" type="button" class="btn rate-btn" @click="emit('rate', i + 1)">
            <span class="kbd">{{ i + 1 }}</span> {{ lbl }}
          </button>
        </div>
        <p v-if="ratedInfo" class="saved" role="status">{{ ratedInfo }}</p>
      </section>
    </template>
  </article>
</template>

<style scoped>
.card {
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 24px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
  min-width: 0; color: var(--fg); font-family: var(--sans); overflow-wrap: anywhere;
}
.head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.id {
  padding: 6px 12px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-ink);
  font-family: var(--mono); font-size: 14px; font-weight: 600;
}
.chip { padding: 6px 12px; border-radius: 999px; background: var(--sunken); color: var(--fg-2); font-size: 14px; font-weight: 600; }
.topic { margin: 0; font-size: 14px; font-weight: 600; color: var(--fg-3); }
.question { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.5; }
.block { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; min-width: 0; }
.label { margin: 0; font-size: 14px; font-weight: 700; color: var(--fg-2); }
.plain { margin: 0; padding-left: 20px; display: grid; gap: 4px; font-size: 16px; }
.plain-text { margin: 0; font-size: 16px; line-height: 1.65; }
.pre { white-space: pre-line; }
.html { font-size: 16px; line-height: 1.65; overflow-wrap: anywhere; }
.html :deep(p) { margin: 0 0 8px; }
.html :deep(pre), .code { margin: 0; padding: 12px; background: var(--code-bg); color: var(--code-fg); font-family: var(--mono); font-size: 14px; line-height: 1.5; border-radius: var(--r); overflow-x: auto; }
.html :deep(code) { font-family: var(--mono); font-size: 0.92em; }
.answer { padding: 12px; background: var(--sunken); border-radius: var(--r); }
.code { white-space: pre; }
.tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.tab { min-height: 44px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line-2); background: var(--surface); color: var(--fg-2); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.tab.on { border-color: var(--accent); color: var(--accent-ink); background: var(--accent-soft); }
.fu, .atk { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
.fu { padding-left: 20px; list-style: decimal; }
.fu-item { display: grid; gap: 8px; padding: 12px 14px; background: var(--sunken); border-radius: var(--r); }
.atk-item { display: grid; gap: 6px; }
.fu-q { margin: 0; font-weight: 600; }
.reveal-row { display: flex; }
.rate-row { display: grid; gap: 8px; }
.rate-btn { display: flex; width: 100%; gap: 12px; align-items: center; justify-content: flex-start; text-align: left; font-size: 16px; line-height: 1.5; color: var(--fg-2); }
.kbd {
  display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 999px;
  border: 1px solid var(--line-2); font-family: var(--mono); font-size: 14px; font-weight: 700; color: var(--fg);
}
.rate .saved { margin: 0; font-size: 14px; color: var(--ok); }
.btn { min-height: 44px; padding: 10px 18px; border-radius: var(--r); border: 1px solid var(--line-2); background: var(--surface); color: var(--fg); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn.small { align-self: flex-start; }
.btn:focus-visible { outline: none; box-shadow: var(--ring); }
</style>
