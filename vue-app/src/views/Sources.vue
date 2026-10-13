<script setup>
import { computed, inject } from 'vue';

const data = inject('data');
const SOURCES = Array.isArray(data.SOURCES) ? data.SOURCES : [];
const INTROS = data.GROUP_INTROS && typeof data.GROUP_INTROS === 'object' ? data.GROUP_INTROS : {};
const CHECKED = data.SOURCE_CHECKED || '';

const ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const groups = computed(() =>
  ORDER.filter((g) => SOURCES.some((s) => s && s.group === g)).map((g) => ({
    key: g,
    title: (INTROS[g] && INTROS[g].title) || ('Nhóm ' + g),
    items: SOURCES.filter((s) => s && s.group === g),
  })),
);
const total = computed(() => SOURCES.length);
</script>

<template>
  <div class="hcp-page">
    <div class="hcp-page-head">
      <h1 class="hcp-page-title">Nguồn tham khảo</h1>
      <p class="hcp-page-lede">Chỉ dẫn tài liệu chính thức. Ngày kiểm tra ghi kèm từng mục. Bài blog và diễn đàn không được dùng làm nguồn chính ở đây.</p>
      <p class="src-count">{{ total }} nguồn · {{ groups.length }} nhóm</p>
    </div>
    <div class="hcp-note"><p>Ngày kiểm tra toàn bộ liên kết: {{ CHECKED }}.</p></div>
    <section
      v-for="g in groups"
      :key="g.key"
      class="hcp-section"
      :aria-labelledby="'src-g-' + g.key"
    >
      <h2 :id="'src-g-' + g.key" class="src-h2">{{ g.title }}</h2>
      <ul class="src-list" :class="{ cols: g.key === 'G' }">
        <li v-for="s in g.items" :key="s.key || s.url" class="src-row">
          <a class="src-link" :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.name }}</a>
          <span class="src-meta">{{ s.group }} · kiểm tra {{ s.checked }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.src-count { margin: 0; font-size: 14px; color: var(--fg-3); font-family: var(--mono); }
.src-h2 { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; color: var(--fg); }
.src-list { list-style: none; margin: 0; padding: 0; }
.src-row {
  display: flex; justify-content: space-between; gap: 12px;
  align-items: baseline; flex-wrap: wrap;
  padding: 4px 0; min-width: 0;
}
.src-link {
  display: inline-flex; align-items: center; min-height: 44px;
  color: var(--accent-ink); text-decoration: underline; text-underline-offset: 3px;
  font-size: 15px; line-height: 1.55; min-width: 0; overflow-wrap: break-word;
}
.src-link:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.src-meta {
  flex-shrink: 0; font-size: 12px; color: var(--fg-3); font-family: var(--mono);
  white-space: nowrap; align-self: center;
}
@media (min-width: 1000px) {
  .src-list.cols { column-count: 2; column-gap: 32px; }
  .src-list.cols > li { break-inside: avoid; }
}
</style>
