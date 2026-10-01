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

