const modules = import.meta.glob('./assets/diagrams/*.webp', { eager: true, query: '?inline', import: 'default' });
const MAP = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const m = path.match(/\/L(\d+)-d(\d+)\.webp$/);
    if (!m) return [path, url];
    const key = 'L' + m[1] + '-d' + m[2];
    return [key, url];
  })
);
export function diagramUrl(lessonId, d) {
  const key = 'L' + String(lessonId).replace(/^L/, '') + '-d' + d;
  return MAP[key] || MAP['L01-d1'];
}
