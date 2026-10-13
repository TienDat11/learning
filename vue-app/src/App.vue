<script setup>
import { ref, reactive, computed, watch, provide, onMounted, onBeforeUnmount } from 'vue';
import store from './store.js';
import Home from './views/Home.vue';
import Lesson from './views/Lesson.vue';
import Today from './views/Today.vue';
import Drill from './views/Drill.vue';
import Mock from './views/Mock.vue';
import Quiz from './views/Quiz.vue';

const APP_DATA = window.__HCP_DATA || {};
const LESSONS = Array.isArray(APP_DATA.LESSONS) ? APP_DATA.LESSONS : [];
const PHASE_DONE = 6; // phase 6 ("Xong") marks a lesson as completed

// ---------- hash router ----------
// route.path is the concrete path ('/', '/lesson/L01', '/mock/<key>', ...).
// Anything unrecognised resolves to Home ('/').
const SIMPLE_ROUTES = ['today', 'drill', 'mock', 'quiz'];

function decodeSegment(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function parseHash(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const cut = raw.indexOf('?');
  const pathPart = cut >= 0 ? raw.slice(0, cut) : raw;
  const query = cut >= 0 ? Object.fromEntries(new URLSearchParams(raw.slice(cut + 1))) : {};
  const segs = pathPart.split('/').filter(Boolean).map(decodeSegment);
  const [head, arg] = segs;

  if (!segs.length) return { path: '/', params: {}, query };
  if (segs.length === 1 && SIMPLE_ROUTES.includes(head)) return { path: `/${head}`, params: {}, query };
  if (head === 'lesson' && segs.length === 2) return { path: `/lesson/${arg}`, params: { id: arg }, query };
  if (head === 'mock' && segs.length === 2) return { path: `/mock/${arg}`, params: { setKey: arg }, query };
  return { path: '/', params: {}, query: {} };
}

const route = reactive(parseHash(window.location.hash));

function syncRoute() {
  Object.assign(route, parseHash(window.location.hash));
}

function navigate(hash) {
  window.location.hash = hash;
}

function openLesson(lesson) {
  navigate('#/lesson/' + encodeURIComponent(String(lesson.id)));
}

const view = computed(() => route.path.split('/')[1] || 'home');

const activeLesson = computed(() => {
  if (view.value !== 'lesson') return null;
  return LESSONS.find((l) => l && String(l.id) === route.params.id) || {};
});

// ---------- shared state ----------
const progress = ref(store.getH5Progress());
const doneSet = reactive(store.getDoneSet());
// Phase progress is authoritative for the lessons it tracks. The store never removes entries
// from the completed list, so a lesson unchecked back below phase 6 must not stay done.
for (const id of Object.keys(progress.value)) {
  if (Number(progress.value[id]) < PHASE_DONE) doneSet.delete(id);
}

// Keep doneSet in step with phase 6: check adds the lesson, uncheck removes it.
watch(progress, (p, old) => {
  store.saveH5Progress(p);
  for (const id of Object.keys(old || {})) {
    if (Number(old[id]) >= PHASE_DONE && Number(p[id] || 0) < PHASE_DONE) doneSet.delete(id);
  }
  for (const id of Object.keys(p)) {
    if (Number(p[id]) >= PHASE_DONE) doneSet.add(id);
  }
}, { deep: true });

provide('data', APP_DATA);
provide('doneSet', doneSet);
provide('progress', progress);
provide('route', route);

// ---------- theme ----------
const theme = ref(store.getTheme());

onMounted(() => {
  // sync native preference on first load only if user never chose
  if (!store.KEYS.theme) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.matches) theme.value = 'dark';
  }
  window.addEventListener('hashchange', syncRoute);
});
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncRoute);
});

watch(theme, (t) => {
  document.documentElement.setAttribute('data-theme', t);
  store.setTheme(t);
});

watch(() => route.path, () => window.scrollTo(0, 0));

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}
function doPrint() {
  window.print();
}

// Five nav items per .scratch/pen-spec-shell.md. `view` is the route view the item activates.
const NAV = [
  { view: 'home', label: 'Trang chủ', hash: '#/' },
  { view: 'today', label: 'Ngày học', hash: '#/today' },
  { view: 'drill', label: 'Ôn câu hỏi', hash: '#/drill' },
  { view: 'quiz', label: 'Quiz', hash: '#/quiz' },
  { view: 'mock', label: 'Phỏng vấn thử', hash: '#/mock' },
];
</script>

<template>
  <a class="skip-link" href="#hcp-main">Bỏ qua điều hướng, tới nội dung chính</a>

  <header class="hcp-app-header" role="banner">
    <div class="hcp-header-inner">
      <nav class="hcp-nav" aria-label="Các chế độ học">
        <button v-for="item in NAV" :key="item.view" type="button"
                :class="['hcp-nav-btn', { active: view === item.view }]"
                :aria-current="view === item.view ? 'page' : null"
                @click="navigate(item.hash)">
          {{ item.label }}
        </button>
      </nav>

      <div class="hcp-header-actions">
        <button type="button" class="hcp-btn hcp-btn-icon" @click="toggleTheme"
                :aria-pressed="theme === 'dark'" aria-label="Chế độ tối">
          <span v-if="theme === 'light'" aria-hidden="true">☾</span>
          <span v-else aria-hidden="true">☀</span>
        </button>
        <button type="button" class="hcp-btn hcp-btn-icon" @click="doPrint" aria-label="In tài liệu">
          <span aria-hidden="true">🖨</span>
        </button>
      </div>
    </div>
  </header>

  <main id="hcp-main" class="hcp-app" role="main" tabindex="-1">
    <Home v-if="view === 'home'" @open-lesson="openLesson" />
    <Lesson v-else-if="view === 'lesson'" :lesson="activeLesson"
            @open-lesson="openLesson" @close="navigate('#/')" />
    <Today v-else-if="view === 'today'" />
    <Drill v-else-if="view === 'drill'" />
    <Mock v-else-if="view === 'mock'" @navigate="navigate" />
    <Quiz v-else-if="view === 'quiz'" />
  </main>

  <footer class="hcp-footer" role="contentinfo">
    <p class="hcp-small">
      Bộ liệu do người học tự soạn để ôn cho vị trí Fullstack Engineer — không phải đề thật của HiTechCloud.
    </p>
  </footer>
</template>

<style scoped>
.skip-link {
  position: absolute; top: -40px; left: 0; background: var(--accent); color: var(--surface);
  padding: 6px 10px; z-index: 1000; transition: top 0.2s;
}
.skip-link:focus { top: 0; }
.hcp-app-header {
  position: sticky; top: 0; z-index: 50; height: 64px;
  background: var(--surface); border-bottom: 1px solid var(--line);
}
.hcp-header-inner {
  height: 100%; padding: 0 48px; display: flex; align-items: center; gap: 8px;
}
.hcp-nav { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.hcp-nav-btn {
  background: var(--surface); border: 0; border-radius: var(--r);
  padding: 8px 14px; font-size: 14px; font-weight: 600; color: var(--fg-2);
  cursor: pointer; white-space: nowrap; transition: color 0.15s, background 0.15s;
}
.hcp-nav-btn:hover { color: var(--accent-ink); }
.hcp-nav-btn.active { background: var(--accent-soft); color: var(--accent-ink); }
.hcp-header-actions { display: flex; gap: 6px; margin-left: auto; }
.hcp-btn { border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); cursor: pointer; }
.hcp-btn-icon { padding: 5px 8px; font-size: 16px; }
.hcp-btn-icon:hover { border-color: var(--accent); }
.hcp-app { max-width: 1100px; margin: 0 auto; padding: 16px; min-height: calc(100vh - 200px); }
.hcp-footer { text-align: center; padding: 16px; color: var(--fg-3); font-size: 12px; border-top: 1px solid var(--line); margin-top: 24px; }
@media (max-width: 720px) {
  .hcp-header-inner { padding: 0 16px; }
  .hcp-nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px;
    padding: 8px; background: var(--surface); border-top: 1px solid var(--line);
  }
  .hcp-nav-btn { padding: 8px 4px; text-align: center; white-space: normal; line-height: 1.3; }
  .hcp-app { padding-bottom: 104px; }
}
</style>
