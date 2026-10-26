var LOGIC = LOGIC || {};

// Pure helpers used by the app engine. Everything here coerces instead of assuming:
// data files come from many authors and may hold any shape.

var LOGIC_VN_MAP = (function () {
  var groups = [
    ['aàáảãạăằắẳẵặâầấẩẫậ', 'a'],
    ['eèéẻẽẹêềếểễệ', 'e'],
    ['iìíỉĩị', 'i'],
    ['oòóỏõọôồốổỗộơờớởỡợ', 'o'],
    ['uùúủũụưừứửữự', 'u'],
    ['yỳýỷỹỵ', 'y'],
    ['dđ', 'd']
  ];
  var map = {};
  for (var g = 0; g < groups.length; g++) {
    var chars = groups[g][0];
    for (var i = 0; i < chars.length; i++) map[chars.charAt(i)] = groups[g][1];
  }
  return map;
})();

LOGIC.normalize = function (s) {
  if (typeof s !== 'string') return '';
  var out = s.toLowerCase().replace(/\s+/g, ' ');
  var map = LOGIC_VN_MAP;
  for (var i = 0; i < out.length; i++) {
    var c = out.charAt(i);
    var base = map[c];
    if (base) out = out.slice(0, i) + base + out.slice(i + 1);
  }
  return out.trim();
};

LOGIC.stripTags = function (s) {
  return typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ') : '';
};

LOGIC.esc = function (s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

LOGIC.haystack = function (q) {
  if (!q || typeof q !== 'object') return '';
  var parts = [q.topic, q.q, q.oral, LOGIC.stripTags(q.deep)];
  var fu = Array.isArray(q.followups) ? q.followups : [];
  for (var i = 0; i < fu.length; i++) {
    if (fu[i] && typeof fu[i] === 'object') parts.push(fu[i].q, fu[i].a);
  }
  var pf = Array.isArray(q.pitfalls) ? q.pitfalls : [];
  for (var j = 0; j < pf.length; j++) parts.push(pf[j]);
  return LOGIC.normalize(parts.join(' '));
};

LOGIC.matchQuery = function (q, needle) {
  var terms = LOGIC.normalize(needle).split(' ').filter(Boolean);
  if (!terms.length) return true;
  var hay = LOGIC.haystack(q);
  for (var i = 0; i < terms.length; i++) {
    if (hay.indexOf(terms[i]) === -1) return false;
  }
  return true;
};

LOGIC.filterQuestions = function (list, opts) {
  var items = Array.isArray(list) ? list : [];
  var o = opts && typeof opts === 'object' ? opts : {};
  var statusMap = o.statusMap && typeof o.statusMap === 'object' ? o.statusMap : null;
  var needle = typeof o.q === 'string' ? o.q : '';
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    var status = statusMap ? statusMap[it.id] : undefined;
    if (o.weakOnly && status !== 'weak') continue;
    if (o.status && status !== o.status) continue;
    if (o.prio && it.prio !== o.prio) continue;
    if (o.level && it.level !== o.level) continue;
    if (o.group && it.group !== o.group) continue;
    if (needle && !LOGIC.matchQuery(it, needle)) continue;
    out.push(it);
  }
  return out;
};

LOGIC.quizScore = function (quiz, answers) {
  var items = Array.isArray(quiz) ? quiz : [];
  var picks = answers && typeof answers === 'object' ? answers : {};
  var wrong = [];
  var perGroup = {};
  var correct = 0;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    var g = typeof it.group === 'string' ? it.group : '';
    if (typeof perGroup[g] !== 'number') perGroup[g] = 0;
    if (picks[it.id] === it.answer) {
      correct++;
      perGroup[g]++;
    } else {
      wrong.push(it.id);
    }
  }
  return { correct: correct, total: items.length, wrong: wrong, perGroup: perGroup };
};

LOGIC.resolvePick = function (spec, list) {
  var items = Array.isArray(list) ? list : [];
  var s = spec && typeof spec === 'object' ? spec : {};
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    if (s.group && it.group !== s.group) continue;
    if (s.prio && it.prio !== s.prio) continue;
    if (s.level && it.level !== s.level) continue;
    if (s.type && it.type !== s.type) continue;
    out.push(it);
  }
  var lim = s.limit;
  if (typeof lim === 'number' && isFinite(lim) && lim >= 0) out = out.slice(0, Math.floor(lim));
  return out;
};

// ============================================================================
// Leitner spaced-repetition engine (pure, no DOM)
// ============================================================================
LOGIC.LEITNER_INTERVALS = [1, 2, 4, 8, 16];  // số ngày cho các hộp 1..5

LOGIC.dateISO = function (d) {
  return '' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
};

LOGIC.addDaysISO = function (iso, n) {
  var d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return '' + d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
};

LOGIC.leitnerLoad = function (raw) {
  var out = {};
  try {
    var data = JSON.parse(raw || '');
  } catch (e) { return out; }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return out;
  var re = /^\d{4}-\d{2}-\d{2}$/;
  for (var k in data) {
    if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
    var v = data[k];
    if (typeof v !== 'object' || v === null) continue;
    var box = v.box;
    if (!isFinite(box) || Math.floor(box) !== box || box < 1 || box > 5) continue;
    var due = v.due;
    if (typeof due !== 'string' || !re.test(due)) continue;
    out[k] = { box: box, due: due };
  }
  return out;
};

LOGIC.leitnerDump = function (state) {
  var out = {};
  var re = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return JSON.stringify(out);
  for (var k in state) {
    if (!Object.prototype.hasOwnProperty.call(state, k)) continue;
    var v = state[k];
    if (typeof v !== 'object' || v === null) continue;
    var box = v.box;
    if (!isFinite(box) || Math.floor(box) !== box || box < 1 || box > 5) continue;
    if (typeof v.due === 'string' && re.test(v.due)) out[k] = { box: box, due: v.due };
  }
  return JSON.stringify(out);
};

LOGIC.leitnerBox = function (state, qid) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return 1;
  var v = state[qid];
  if (!v || typeof v !== 'object' || Array.isArray(v)) return 1;
  var box = v.box;
  if (!isFinite(box) || Math.floor(box) !== box || box < 1 || box > 5) return 1;
  return box;
};

LOGIC.leitnerCounts = function (ids, state) {
  var counts = [0, 0, 0, 0, 0];
  var a = Array.isArray(ids) ? ids : [];
  for (var i = 0; i < a.length; i++) {
    counts[LOGIC.leitnerBox(state, a[i]) - 1]++;
  }
  return counts;
};

LOGIC.leitnerDueQids = function (ids, state, todayISO) {
  var a = Array.isArray(ids) ? ids : [];
  var byBox = [[], [], [], [], []];
  for (var i = 0; i < a.length; i++) {
    var qid = a[i];
    var box = LOGIC.leitnerBox(state, qid);
    var entry = state && typeof state === 'object' && !Array.isArray(state) ? state[qid] : null;
    var due = (entry && typeof entry === 'object') ? entry.due : null;
    if ((due === null ? todayISO : due) <= todayISO) byBox[box - 1].push(qid);
  }
  for (var b = 0; b < 5; b++) {
    if (byBox[b].length) return byBox[b];
  }
  return [];
};

LOGIC.leitnerPick = function (ids, state, todayISO, rnd) {
  rnd = typeof rnd === 'function' ? rnd : Math.random;
  var list = LOGIC.leitnerDueQids(ids, state, todayISO);
  if (list.length === 0) return null;
  return list[Math.floor(rnd() * list.length)];
};

// result: boolean (true = nhớ, false = chưa nhớ) hoặc 1/2/3.
//   1 hoặc false -> về hộp 1, đến hạn ngay hôm nay.
//   2            -> giữ nguyên hộp, đến hạn sau interval của hộp hiện tại.
//   3 hoặc true  -> lên một hộp (tối đa 5), đến hạn sau interval của hộp mới.
// Trả về toàn bộ state mới; không sửa state truyền vào.
LOGIC.leitnerGrade = function (state, qid, result, todayISO) {
  var out = {};
  if (state && typeof state === 'object' && !Array.isArray(state)) {
    for (var k in state) if (Object.prototype.hasOwnProperty.call(state, k)) out[k] = state[k];
  }
  var box = LOGIC.leitnerBox(state, qid);
  if (result === 2) {
    out[qid] = { box: box, due: LOGIC.addDaysISO(todayISO, LOGIC.LEITNER_INTERVALS[box - 1]) };
  } else if (result === true || result === 3) {
    box = Math.min(box + 1, 5);
    out[qid] = { box: box, due: LOGIC.addDaysISO(todayISO, LOGIC.LEITNER_INTERVALS[box - 1]) };
  } else {
    out[qid] = { box: 1, due: todayISO };
  }
  return out;
};

