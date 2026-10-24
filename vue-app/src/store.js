// ---------- localStorage ----------
// OLD keys (kept verbatim, read-only compat):
//   hcp-progress-v1   progress bar
//   hcp-theme-v1      'light' | 'dark'
//   hcp-lessons-v1    { [lessonId]: true }  done lessons
//   hcp-leitner-v1    { [qid]: { box, due } }
//   hcp-h5-progress-v1  { [lessonId]: { phase: 1..6, lastSeen: ISO } }
//   hcp-h5-completed-v1  [ lessonId, ... ]
//   hcp-spoken-p0-v1  [ qid, ... ]  id câu đã bấm "Tôi đã nói xong, mở đáp án" (chỉ ghi, không xoá)
// Old progress key never reused for new data (DESIGN.md).

const KEYS = {
  theme: 'hcp-theme-v1',
  lessons: 'hcp-lessons-v1',      // old done-set, read-only compat
  leitner: 'hcp-leitner-v1',
  h5progress: 'hcp-h5-progress-v1',
  h5completed: 'hcp-h5-completed-v1',
  spoken: 'hcp-spoken-p0-v1',
};

function getRaw(k) {
  try { return localStorage.getItem(k); } catch { return null; }
}
function setRaw(k, v) {
  try { localStorage.setItem(k, v); return true; } catch { return false; }
}

function loadObj(k, fallback) {
  const raw = getRaw(k);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function saveObj(k, v) {
  return setRaw(k, JSON.stringify(v));
}

export default {
  KEYS,
  getTheme() { return getRaw(KEYS.theme) === 'dark' ? 'dark' : 'light'; },
  hasTheme() {
    const v = getRaw(KEYS.theme);
    return v === 'dark' || v === 'light';
  },
  setTheme(t) { setRaw(KEYS.theme, t); },

  // reads old done-set if present, merges with new H5-completed
  getDoneSet() {
    const old = loadObj(KEYS.lessons, {});
    const newD = loadObj(KEYS.h5completed, []);
    const set = new Set();
    for (const k in old) if (old[k]) set.add(k);
    for (const id of newD) set.add(id);
    return set;
  },

  getH5Progress() { return loadObj(KEYS.h5progress, {}); },
  saveH5Progress(p) { return saveObj(KEYS.h5progress, p); },

  markH5Completed(id) {
    const arr = loadObj(KEYS.h5completed, []);
    if (!arr.includes(id)) arr.push(id);
    return saveObj(KEYS.h5completed, arr);
  },

  // id câu đã bấm "Tôi đã nói xong, mở đáp án" trong DrillCard (chỉ ghi, không xoá)
  getSpokenIds() {
    const arr = loadObj(KEYS.spoken, []);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x) : [];
  },
  markSpoken(id) {
    const key = String(id || '');
    if (!key) return false;
    const raw = loadObj(KEYS.spoken, []);
    const list = Array.isArray(raw) ? raw : [];
    if (!list.includes(key)) list.push(key);
    return saveObj(KEYS.spoken, list);
  },
};
