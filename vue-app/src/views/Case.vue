<script setup>
import { computed, inject, ref } from 'vue';
import { renderLinkedHtml, sanitizeSvg } from '../utils.js';

const data = inject('data');
const cs = (data && data.CASE_STUDY && typeof data.CASE_STUDY === 'object') ? data.CASE_STUDY : {};
const flows = Array.isArray(data && data.FLOW_SVGS) ? data.FLOW_SVGS : [];
const sections = computed(() => (Array.isArray(cs.sections) ? cs.sections.filter((s) => s && typeof s === 'object') : []));

const idx = ref(0);
const cur = computed(() => sections.value.length ? sections.value[Math.min(idx.value, sections.value.length - 1)] : null);
const flow = computed(() => {
  if (!cur.value || typeof cur.value.flow !== 'string' || !cur.value.flow) return null;
  const f = flows.find((x) => x && x.id === cur.value.flow);
  return f && typeof f.svg === 'string' ? f : null;
});

function select(i) {
  idx.value = i;
}
</script>

<template>
  <div class="hcp-page case">
    <div class="hcp-page-head">
      <h1 class="hcp-page-title">Case study xuyên suốt</h1>
      <p v-if="cs.lede" class="hcp-page-lede">{{ cs.lede }}</p>
    </div>

    <div class="case-grid">
      <nav class="case-nav" aria-label="Danh sách mục case study">
        <button
          v-for="(s, i) in sections"
          :key="s.id || i"
          type="button"
          class="case-item"
          :class="{ on: i === idx }"
          :aria-current="i === idx ? 'true' : undefined"
          @click="select(i)"
        >{{ s.h }}</button>
      </nav>

      <section v-if="cur" class="case-main" :aria-label="cur.h">
        <h2 class="case-title">{{ cs.title }}</h2>
        <p v-if="cs.pitch" class="case-pitch">{{ cs.pitch }}</p>
        <h3 class="hcp-h3">{{ cur.h }}</h3>
        <div class="hcp-prose" v-html="renderLinkedHtml(cur.body, data?.LESSONS)"></div>
        <figure v-if="flow" class="case-fig">
          <div class="case-fig-svg" v-html="sanitizeSvg(flow.svg)"></div>
          <figcaption v-if="flow.caption" class="case-cap">{{ flow.caption }}</figcaption>
        </figure>
      </section>
      <p v-else class="hcp-note">Chưa có dữ liệu case study.</p>
    </div>
  </div>
</template>

<style scoped>
.case { min-width: 0; }
.case-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  min-width: 0;
  align-items: start;
}
.case-nav {
  display: grid;
  gap: 4px;
  min-width: 0;
  align-content: start;
}
.case-item {
  min-height: 44px;
  padding: 8px 12px;
  border: 0;
  border-radius: var(--r);
  background: var(--surface);
  color: var(--fg-2);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.case-item.on {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: 600;
}
.case-item:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}
.case-main {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.case-main :deep(a.hcp-lesson-link) { color: var(--accent-ink); text-decoration: underline; }
.case-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--fg);
  overflow-wrap: anywhere;
}
.case-pitch {
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  color: var(--fg-2);
  overflow-wrap: anywhere;
}
.case-fig {
  margin: 4px 0 0;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: 8px;
  overflow: auto;
}
.case-fig-svg { min-width: 0; }
.case-fig-svg svg {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
}
.case-cap {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--fg-3);
  overflow-wrap: anywhere;
}
@media (min-width: 901px) {
  .case-grid { grid-template-columns: 340px minmax(0, 1fr); }
  .case-nav { position: sticky; top: 12px; }
}
@media (max-width: 720px) {
  .case-grid { gap: 16px; }
  .case-title { font-size: 24px; }
}
</style>
