// Leitner boxes for Drill cards. Pure helpers; the only side effect is localStorage.
// Shape: { [qid]: { box: 1..5, due: 'YYYY-MM-DD' } }. A never-rated question is unseen and counts as due.
// The schedule formula lives in LOGIC.leitnerGrade so HTML, Drill, Flashcard and Today share one.

export const KEY = 'hcp-leitner-v1';

function logic() {
  const L = window.__HCP_DATA?.LOGIC;
  if (!L || typeof L.leitnerGrade !== 'function') {
    throw new Error('leitner: LOGIC.leitnerGrade thiếu — __HCP_DATA chưa được inject');
  }
  return L;
}

let cache = null; // in-memory copy, so the session still works when localStorage is blocked or full

export function todayISO(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function load() {
  if (cache) return cache;
  let obj = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) obj = parsed;
  } catch (e) {
    obj = {};
  }
  cache = obj;
  return cache;
}

function save(state) {
  cache = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // blocked or full: the cache still holds the state for this session
  }
}

export function getState() {
  return { ...load() };
}

// r: 1 = can't explain -> box 1; 2 = explain with example -> box unchanged; 3 = real situation -> box + 1.
export function rate(qid, r, today = todayISO()) {
  const state = logic().leitnerGrade(getState(), qid, r, today);
  save(state);
  return state[qid];
}

export function reset() {
  cache = {};
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // blocked: the cleared cache is still authoritative for this session
  }
}

export function dueIds(allIds, today = todayISO()) {
  const state = load();
  return allIds.filter((id) => {
    const s = state[id];
    return !s || !s.due || s.due <= today;
  });
}

export function dueCount(allIds, today = todayISO()) {
  return dueIds(allIds, today).length;
}
