<script setup>
import { ref, computed, inject } from 'vue';
import { esc, renderLinkedHtml } from '../utils.js';

const data = inject('data');
const LOGIC = data.LOGIC;
const ALL = (Array.isArray(data.QUIZ) ? data.QUIZ : []).filter((x) => x && typeof x === 'object');
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const pool = ref(ALL);
const idx = ref(0);
const answers = ref({});
const finished = ref(false);

const cur = computed(() => pool.value[idx.value] || null);
const picked = computed(() => (cur.value ? answers.value[cur.value.id] : undefined));
const isLast = computed(() => idx.value >= pool.value.length - 1);
const answeredCount = computed(() => Object.keys(answers.value).length);
const pct = computed(() => (pool.value.length ? Math.round((answeredCount.value / pool.value.length) * 100) : 0));
const score = computed(() => LOGIC.quizScore(pool.value, answers.value));
const scorePct = computed(() => (score.value.total ? Math.round((score.value.correct / score.value.total) * 100) : 0));
const wrongItems = computed(() => {
  const ids = new Set(score.value.wrong);
  return pool.value.filter((q) => ids.has(q.id));
});

function startRound(list) {
  pool.value = list;
  idx.value = 0;
  answers.value = {};
  finished.value = false;
}

function pick(i) {
  const q = cur.value;
  if (!q || picked.value !== undefined) return;
  answers.value = { ...answers.value, [q.id]: i };
}

function next() {
  if (picked.value === undefined) return;
  if (isLast.value) finished.value = true;
  else idx.value += 1;
}

function optClass(i) {
  if (picked.value === undefined) return '';
  if (i === cur.value.answer) return 'right';
  if (i === picked.value) return 'wrong';
  return 'dim';
}
</script>

<template>
  <div class="quiz">
    <p v-if="!ALL.length" class="notice">Chưa có câu quiz nào.</p>

    <template v-else-if="!finished && cur">
      <h1 class="title">Quiz</h1>

      <div class="progress-block">
        <span class="count">Câu {{ idx + 1 }}/{{ pool.length }}</span>
        <div class="progress" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
          <div class="fill" :style="{ width: pct + '%' }"></div>
        </div>
      </div>

      <article class="card">
        <div class="chips">
          <span class="chip accent">Nhóm {{ cur.group }}</span>
          <span v-if="cur.situational" class="chip">Tình huống</span>
        </div>

        <h2 class="q">{{ cur.q }}</h2>

        <ul class="opts">
          <li v-for="(o, i) in cur.options" :key="i">
            <button type="button" class="opt" :class="optClass(i)" :disabled="picked !== undefined" @click="pick(i)">
              <span class="letter">{{ LETTERS[i] }}</span>
              <span class="opt-text">{{ o }}</span>
            </button>
          </li>
        </ul>

        <div v-if="picked !== undefined" class="fb">
          <p class="verdict" :class="picked === cur.answer ? 'ok' : 'bad'">{{ picked === cur.answer ? 'Đúng.' : 'Chưa đúng. Đáp án là ' + LETTERS[cur.answer] + '.' }}</p>
          <p class="explain"><strong>Giải thích:</strong> <span v-html="renderLinkedHtml(esc(cur.explain), data?.LESSONS)"></span></p>
        </div>

        <div class="actbar">
          <button type="button" class="btn primary" :disabled="picked === undefined" @click="next">
            {{ isLast ? 'Xem kết quả' : 'Câu tiếp' }}
          </button>
        </div>
      </article>
    </template>

    <section v-else class="sum">
      <h1 class="title">Kết quả</h1>

      <div class="stats">
        <div class="stat-box">
          <p class="stat">{{ score.correct }}/{{ score.total }} đúng ({{ scorePct }}%)</p>
        </div>
        <div class="stat-box">
          <p class="stat">Câu sai: {{ wrongItems.length }}</p>
        </div>
      </div>

      <div v-if="wrongItems.length" class="list-box">
        <ol class="wrong">
          <li v-for="w in wrongItems" :key="w.id">
            <p class="wgroup">Nhóm {{ w.group }}</p>
            <p class="wq">{{ w.q }}</p>
            <p class="wa">Đáp án: {{ LETTERS[w.answer] }}. {{ w.options[w.answer] }}</p>
            <p class="wexplain" v-html="renderLinkedHtml(esc(w.explain), data?.LESSONS)"></p>
          </li>
        </ol>
      </div>
      <p v-else class="ok-note">Làm đúng hết.</p>

      <div class="row">
        <button v-if="wrongItems.length" type="button" class="btn primary" @click="startRound(wrongItems.slice())">
          Làm lại câu sai ({{ wrongItems.length }})
        </button>
        <button type="button" class="btn" @click="startRound(ALL)">Làm lại từ đầu</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.quiz, .sum { display: grid; gap: 24px; box-sizing: border-box; width: 100%; max-width: 880px; min-width: 0; padding: 40px 48px; color: var(--fg); font-family: var(--sans); }
.notice { font-size: 14px; color: var(--fg-2); margin: 0; }
.title { font-size: 28px; font-weight: 700; line-height: 1.25; margin: 0; color: var(--fg); }
.count { font-size: 14px; font-weight: 600; color: var(--fg-2); }
.progress-block { display: grid; gap: 8px; }
.progress { height: 8px; background: var(--sunken); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.2s ease; }
.card { display: grid; gap: 16px; padding: 24px; min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { font-size: 14px; font-weight: 600; line-height: 1.2; padding: 6px 12px; border-radius: 999px; background: var(--sunken); color: var(--fg-2); }
.chip.accent { background: var(--accent-soft); color: var(--accent-ink); }
.q { font-size: 16px; font-weight: 600; line-height: 1.5; margin: 0; color: var(--fg); overflow-wrap: anywhere; }
.opts { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.opt {
  width: 100%; min-height: 44px; box-sizing: border-box; display: flex; gap: 12px; align-items: flex-start; text-align: left;
  padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r);
  background: var(--surface); color: var(--fg); font: inherit; font-size: 16px; line-height: 1.5; cursor: pointer;
}
.opt:hover:not(:disabled) { border-color: var(--accent); }
.opt:disabled { cursor: default; }
.opt:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.opt.right { border-color: var(--accent); background: var(--accent-soft); color: var(--fg); }
.opt.right .letter { background: var(--accent); color: var(--surface); }
.opt.wrong { border-color: var(--err); background: var(--err-soft); color: var(--fg); }
.opt.wrong .letter { background: var(--err); color: var(--surface); }
.opt.dim { color: var(--fg-3); }
.letter {
  width: 32px; height: 32px; flex: none; border-radius: 50%; box-sizing: border-box;
  display: grid; place-items: center; background: var(--sunken); color: var(--fg-2);
  font-family: var(--sans); font-size: 14px; font-weight: 700;
}
.opt-text { min-width: 0; overflow-wrap: anywhere; }
.fb { display: grid; gap: 6px; font-size: 16px; line-height: 1.6; }
.verdict { margin: 0; font-weight: 700; }
.verdict.ok { color: var(--ok); }
.verdict.bad { color: var(--err); }
.explain { margin: 0; color: var(--fg-2); overflow-wrap: anywhere; }
.actbar { display: flex; justify-content: flex-end; gap: 8px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
.stat-box { display: grid; gap: 10px; min-width: 0; padding: 20px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); }
.stat { margin: 0; font-size: 40px; font-weight: 700; line-height: 1.2; color: var(--fg); overflow-wrap: anywhere; }
.list-box { padding: 24px; min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); }
.wrong { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
.wrong li { display: grid; gap: 4px; min-width: 0; }
.wgroup { margin: 0; font-size: 14px; color: var(--fg-2); }
.wq { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.5; color: var(--fg); overflow-wrap: anywhere; }
.wa { margin: 0; font-size: 16px; line-height: 1.5; color: var(--fg); overflow-wrap: anywhere; }
.wexplain { margin: 0; font-size: 15px; line-height: 1.6; color: var(--fg-2); overflow-wrap: anywhere; }
.ok-note { font-size: 14px; color: var(--ok); margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: 12px; }
.btn {
  min-height: 44px; box-sizing: border-box; padding: 10px 18px; border-radius: var(--r); border: 1px solid var(--line-2);
  background: var(--surface); color: var(--fg); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

@media (max-width: 719px) {
  .quiz, .sum { gap: 16px; max-width: none; padding: 16px; }
  .title { font-size: 26px; }
  .card { padding: 24px; }
  .stat { font-size: 28px; }
  .list-box { padding: 16px; }
}
</style>
