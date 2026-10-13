import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

// Data payload injected at build time by build.mjs (src/*.js via vm → JSON → inline).
const DATA = window.__HCP_DATA || {};

// Fallback when running dev (build.mjs runs `vite preview` after post-processing).
if (!Object.keys(DATA).length) {
  console.warn('No __HCP_DATA — run `npm run build`');
}

const app = createApp(App, { data: DATA });

app.mount('#app');
