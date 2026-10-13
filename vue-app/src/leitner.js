// Leitner boxes for Drill cards. Pure helpers; the only side effect is localStorage.
// Shape: { [qid]: { box: 1..5, due: 'YYYY-MM-DD' } }. A never-rated question is unseen and counts as due.

export const KEY = 'hcp-leitner-v1';
export const CAP_DUE = '2026-10-19';       // day before the interview; nothing is scheduled past it

function _leitnerIntervals() {
  return window.__HCP_DATA?.LOGIC?.LEITNER_INTERVALS || [1, 2, 4, 8, 16];
}
let cache = null; // in-memory copy, so the session still works when localStorage is blocked or full

export function todayISO(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return todayISO(new Date(y, m - 1, d + n));
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
  const state = getState();
  const prev = state[qid] ? Number(state[qid].box) : NaN;
  let box = prev >= 1 && prev <= 5 ? prev : 1;
  if (r === 1) box = 1;
  else if (r === 3) box = Math.min(5, box + 1);
  let due = addDays(today, _leitnerIntervals()[box - 1]);
  if (due > CAP_DUE) due = CAP_DUE;
  state[qid] = { box, due };
  save(state);
  return state[qid];
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
