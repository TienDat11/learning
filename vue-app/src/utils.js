// ---------- escaping / html-safe ----------
// Plain-text fields (oral, expected, say30, askFirst, attacks.a, sayIt, bridge, spine)
// are escaped; HTML fields (body, deep, incident, naive, rootCause, concept...) pass
// through a whitelist sanitizer only. Never render plain text as HTML.

export function esc(x) {
  const s = (x == null || typeof x === 'object') ? '' : String(x);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Whitelist: only tags the old renderer trusted (DESIGN.md).
const ALLOWED = new Set([
  'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'br',
  'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'h3', 'h4',
]);
const TAG_RE = /<\/?[a-z][a-z0-9]*\b[^>]*>/gi;
const ATTR_RE = /\s[a-z][a-z0-9-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi;

export function sanitize(html) {
  if (typeof html !== 'string') return '';
  return html.replace(TAG_RE, (tag) => {
    const tagOnly = tag.split(' ')[0];
    if (!tagOnly.startsWith('<')) return '';
    const name = tagOnly.slice(1, tagOnly.length).split(/[\/>]/)[0].toLowerCase();
    if (!ALLOWED.has(name)) return '';
    // block script/style/event-handler attributes
    const clean = tagOnly.replace(ATTR_RE, (a) => {
      const k = a.trim().split('=')[0].toLowerCase();
      if (k.startsWith('on') || k === 'srcset' || k === 'href' && a.toLowerCase().includes('javascript:')) return '';
      return a;
    });
    return clean;
  }).replace(/<\/script>/gi, '<\\/script>');
}

// Auto-link "Bài L01..L23" occurrences in HTML after sanitizing: current lesson becomes
// <strong>, others become clickable lesson links.
export function renderLinkedHtml(raw, lessons = [], currentLessonId = '') {
  const clean = sanitize(raw);
  const all = Array.isArray(lessons) ? lessons : [];
  return clean.replace(/(?:Bài\s+|bài\s+)?\b(L(?:0[1-9]|1[0-9]|2[0-3]))\b/g, (match, lid) => {
    if (lid === currentLessonId) return '<strong>' + match + '</strong>';
    const target = all.find((x) => x && x.id === lid);
    const tip = target ? esc(target.id + ' — ' + target.title) : lid;
    return '<a class="hcp-lesson-link" href="#/lesson/' + lid + '" title="' + tip + '">' + match + (target ? ' (' + esc(target.title) + ')' : '') + '</a>';
  });
}

// FLOW_SVGS diagrams are repo-authored SVG markup, not user input. The whitelist above
// drops every SVG element (svg/g/rect/path/text), which rendered all 12 diagrams blank.
// Keep the same guarantee as the original renderer: cut scripts, inline handlers, javascript: URLs.
export function sanitizeSvg(svg) {
  if (typeof svg !== 'string') return '';
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[\s\S]*?>/gi, '')
    .replace(/[\s/]on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
    .replace(/<(iframe|object|embed|foreignObject)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(iframe|object|embed|foreignObject)\b[^>]*>/gi, '')
    .replace(/[\s/](?:xlink:)?href\s*=\s*(?:"\s*data:[^"]*"|'\s*data:[^']*'|\s*data:[^\s>]*)/gi, ' ')
    .replace(/javascript:/gi, '');
}

// ---------- labels ----------
// Question `type` values are English keys in the data; render them in Vietnamese.
// Keep this the single source for both the Vue app and any other renderer.
export const TYPE_LABELS = {
  concept: 'Khái niệm',
  predict: 'Dự đoán',
  debug: 'Gỡ lỗi',
  situation: 'Tình huống',
  code: 'Viết code',
};
export function typeLabel(t) {
  const k = typeof t === 'string' ? t.trim() : '';
  return TYPE_LABELS[k] || k;
}

// ---------- date ----------
export function dateISO(d = new Date()) {
  const m = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  return `${d.getUTCFullYear()}-${String(m).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
}
export function addDaysISO(iso, n) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return dateISO(d);
}
