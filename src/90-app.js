/* 90-app.js — browser DOM engine for the single-file study page.
   Data globals (QUESTIONS, QUIZ, MOCK_SETS, STUDY_PLANS, CASE_STUDY, SOURCES,
   GROUP_INTROS, SOURCE_CHECKED, FLOW_SVGS) and LOGIC come from earlier src files.
   Under __BUILD_CHECK__ the build evaluates this file in a DOM-less sandbox:
   touch nothing. */
if (typeof __BUILD_CHECK__ === 'undefined' || !__BUILD_CHECK__) {
  (function () {
    'use strict';

    var doc = document;
    var $ = function (id) { return doc.getElementById(id); };
    var arr = function (v) { return Array.isArray(v) ? v : []; };
    var obj = function (v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : null; };
    var str = function (v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); };
    var esc = LOGIC.esc;
    var when = function (c, h) { return c ? h : ''; };
    var on = function (el, ev, fn) { if (el) el.addEventListener(ev, fn); };

    // ---- data (coerced — never assume another file shipped the right type) ----
    var QS = arr(typeof QUESTIONS === 'undefined' ? [] : QUESTIONS);
    var QUIZSET = arr(typeof QUIZ === 'undefined' ? [] : QUIZ);
    var MOCKS = obj(typeof MOCK_SETS === 'undefined' ? null : MOCK_SETS) || {};
    var PLANS = obj(typeof STUDY_PLANS === 'undefined' ? null : STUDY_PLANS) || {};
    var CASE = obj(typeof CASE_STUDY === 'undefined' ? null : CASE_STUDY) || {};
    var SRC = arr(typeof SOURCES === 'undefined' ? [] : SOURCES);
    var GI = obj(typeof GROUP_INTROS === 'undefined' ? null : GROUP_INTROS) || {};
    var FLOWS = arr(typeof FLOW_SVGS === 'undefined' ? [] : FLOW_SVGS);
    var CHECKED = typeof SOURCE_CHECKED === 'undefined' ? '' : SOURCE_CHECKED;
    var LESSONSARR = arr(typeof LESSONS === 'undefined' ? [] : LESSONS);
    var GLOSSARY = (typeof LESSON_GLOSSARY === 'undefined' || !LESSON_GLOSSARY) ? null : LESSON_GLOSSARY;
    var FLOW_BY_ID = {};
    FLOWS.forEach(function (f) { if (f && f.id) FLOW_BY_ID[f.id] = f; });
    var SRC_BY_KEY = {};
    SRC.forEach(function (s) { if (s && s.key) SRC_BY_KEY[s.key] = s; });
    var Q_BY_ID = {};
    QS.forEach(function (q) { if (q && q.id) Q_BY_ID[q.id] = q; });
    var LESSON_BY_ID = {};
    var LESSON_POS = {};
    LESSONSARR.forEach(function (l, i) { if (l && l.id) { LESSON_BY_ID[l.id] = l; LESSON_POS[l.id] = i; } });
    var shortLessonTitle = function (t) {
      t = str(t);
      if (t.length <= 40) return t;
      var cut = t.slice(0, 40);
      var sp = cut.lastIndexOf(' ');
      if (sp > 20) cut = cut.slice(0, sp);
      return cut + '…';
    };

    var VIEWS = ['today', 'learn', 'intro', 'questions', 'flashcard', 'quiz', 'mock', 'plan', 'case', 'sources'];
    var PR = { P0: 0, P1: 1, P2: 2 };
    var STATUSES = [
      { v: 'new', t: 'Chưa học' },
      { v: 'learning', t: 'Đang ôn' },
      { v: 'known', t: 'Đã nắm' },
      { v: 'weak', t: 'Yếu' },
    ];

    var statusLabel = function (v) {
      for (var i = 0; i < STATUSES.length; i++) { if (STATUSES[i].v === v) return STATUSES[i].t; }
      return str(v);
    };

    // HTML that is allowed through (deep, case body, svg) still gets script and
    // inline-handler tags cut out — data files are content, not trusted markup.
    var sanitize = function (html) {
      return str(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<script[\s\S]*?>/gi, '')
        .replace(/[\s\/]on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
        .replace(/javascript:/gi, '');
    };

    // ---- storage: localStorage, memory fallback ----
    var mem = {};
    var store = {
      get: function (k) {
        try { var v = localStorage.getItem(k); if (v != null) return v; } catch (e) { /* blocked */ }
        return mem[k] == null ? null : mem[k];
      },
      set: function (k, v) {
        mem[k] = v;
        try { localStorage.setItem(k, v); } catch (e) { /* keep in memory only */ }
      },
      del: function (k) {
        delete mem[k];
        try { localStorage.removeItem(k); } catch (e) { /* nothing persisted */ }
      },
    };

    var PROGRESS_KEY = 'hcp-progress-v1';
    var THEME_KEY = 'hcp-theme-v1';
    var LESSON_KEY = 'hcp-lessons-v1';
    var lessonsDone = (function () {
      var out = {};
      try {
        var raw = JSON.parse(store.get(LESSON_KEY) || '[]');
        if (Array.isArray(raw)) raw.forEach(function (id) { if (typeof id === 'string') out[id] = true; });
      } catch (e) { /* corrupt payload — start clean */ }
      return out;
    })();
    var saveLessons = function () { store.set(LESSON_KEY, JSON.stringify(Object.keys(lessonsDone))); };

    // ---- code blocks: wrap each <pre> once and add a copy button ----
    var copyText = function (text, btn) {
      var done = function (ok) {
        btn.textContent = ok ? 'Đã chép' : 'Chưa chép được';
        setTimeout(function () { btn.textContent = 'Chép'; }, 1600);
      };
      var fallback = function () {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
        doc.body.removeChild(ta);
        done(ok);
      };
      if (window.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    };
    var decorate = function (root) {
      if (!root || !root.querySelectorAll) return;
      var pres = root.querySelectorAll('pre');
      for (var i = 0; i < pres.length; i++) {
        var pre = pres[i];
        if (pre.parentNode.classList && pre.parentNode.classList.contains('pre-wrap')) continue;
        var wrap = doc.createElement('div');
        wrap.className = 'pre-wrap';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.textContent = 'Chép';
        btn.setAttribute('aria-label', 'Chép đoạn code');
        wrap.appendChild(btn);
      }
    };
    on(doc, 'click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('.copy-btn');
      if (!b) return;
      var pre = b.parentNode && b.parentNode.querySelector('pre');
      copyText(pre ? pre.textContent : '', b);
    });

    var loadProgress = function () {
      var out = {};
      var raw = store.get(PROGRESS_KEY);
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (obj(parsed)) {
            for (var k in parsed) {
              for (var i = 0; i < STATUSES.length; i++) {
                if (STATUSES[i].v === parsed[k] && k) { out[k] = parsed[k]; break; }
              }
            }
          }
        } catch (e) { /* corrupt payload — start clean */ }
      }
      return out;
    };
    var progress = loadProgress();
    var saveProgress = function () { store.set(PROGRESS_KEY, JSON.stringify(progress)); };
    var statusOf = function (id) { return progress[id] || 'new'; };

    // Cue indices are bounded by the lesson's own askFirst list, never a fixed count.
    var cueCap = function (id) { return arr((obj(LESSON_BY_ID[str(id)]) || {}).askFirst).length; };

    // ---- small HTML builders ----
    var chip = function (text, cls) {
      return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + esc(str(text)) + '</span>';
    };
    var prioChip = function (p) {
      var c = p === 'P0' ? 'p0' : p === 'P1' ? 'p1' : p === 'P2' ? 'p2' : '';
      return chip(p || '—', c);
    };

    // Vietnamese labels for question types; an unmapped value is shown as-is.
    var TYPE_LABELS = { concept: 'Khái niệm', predict: 'Dự đoán', debug: 'Gỡ lỗi', situation: 'Tình huống', code: 'Viết code' };
    var typeLabel = function (t) {
      return Object.prototype.hasOwnProperty.call(TYPE_LABELS, t) ? TYPE_LABELS[t] : str(t);
    };
    var lbl = function (t) { return '<div class="lbl">' + esc(t) + '</div>'; };

    var oralBlock = function (q) {
      return when(q.oral, '<div class="block">' + lbl('Trả lời miệng 30–60 giây') +
        '<p class="oral">' + esc(str(q.oral)) + '</p></div>');
    };
    var deepBlock = function (q) {
      return when(q.deep, '<div class="block">' + lbl('Giải thích sâu') +
        '<div class="deep">' + sanitize(q.deep) + '</div></div>');
    };
    var codeBlock = function (q) {
      return when(q.code, '<div class="block">' + lbl('Ví dụ code') +
        '<pre><code>' + esc(str(q.code)) + '</code></pre></div>');
    };
    var expectedBlock = function (q) {
      return when(q.expected, '<div class="block expected">' + lbl('Kết quả đúng và nguyên nhân') +
        '<p>' + esc(str(q.expected)) + '</p></div>');
    };
    var fuBlock = function (q) {
      var list = arr(q.followups);
      if (!list.length) return '';
      return '<div class="block">' + lbl('Chuỗi hỏi đào sâu') + list.map(function (f, i) {
        f = obj(f) || {};
        return '<div class="fu"><p class="fq">Tầng ' + (i + 1) + ' — ' + esc(str(f.q)) + '</p>' +
          '<p class="fa">' + esc(str(f.a)) + '</p></div>';
      }).join('') + '</div>';
    };
    var pitBlock = function (q) {
      var list = arr(q.pitfalls);
      if (!list.length) return '';
      return '<div class="block">' + lbl('Hiểu nhầm thường gặp') + '<div class="mis"><ul>' +
        list.map(function (p) { return '<li>' + esc(str(p)) + '</li>'; }).join('') +
        '</ul></div></div>';
    };
    var scBlock = function (q) {
      var list = arr(q.selfcheck);
      if (!list.length) return '';
      return '<div class="selfcheck"><div class="sc-h">Tự đánh giá</div><ol>' +
        list.map(function (s) { return '<li>' + esc(str(s)) + '</li>'; }).join('') +
        '</ol></div>';
    };
    var markBtns = function (id) {
      var cur = statusOf(id);
      return STATUSES.map(function (s) {
        return '<button type="button" class="btn" data-mark="' + s.v + '" aria-pressed="' +
          (cur === s.v ? 'true' : 'false') + '">' + esc(s.t) + '</button>';
      }).join('');
    };
    var refsNote = function (q) {
      var refs = arr(q.refs);
      if (!refs.length) return '';
      return '<span class="status-note">Nguồn: ' + esc(refs.join(' · ')) + '</span>';
    };

    // ---- pedagogical blocks (lessons + questions) ----
    // A block is { h, body } or { h, body, code, out }. `code` is raw text; `out` is
    // authored as HTML (the contract types `naiveOut` as an HTML string), so it goes
    // through sanitize() like `body` — escaping it showed literal `</code>` to the reader.
    var blockBox = function (cls, h, body, code, out) {
      var inner = sanitize(str(body));
      if (!inner && !code) return '';
      return '<div class="' + cls + '">' +
        when(h, '<div class="pb-h">' + esc(str(h)) + '</div>') +
        when(inner, '<div class="deep">' + inner + '</div>') +
        when(code, '<pre><code>' + esc(str(code)) + '</code></pre>') +
        when(out, '<div class="pb-out"><span class="pb-out-h">Quan sát được</span>' + sanitize(str(out)) + '</div>') +
        '</div>';
    };
    var predictBox = function (p) {
      p = obj(p) || {};
      if (!str(p.q).trim()) return '';
      // The prompt stays visible so the learner commits to an answer; only the
      // answer is hidden. Hiding both together would remove the retrieval step.
      return '<div class="predict"><div class="pb-h">Thử đoán trước khi đọc tiếp</div>' +
        '<p class="predict-q">' + sanitize(str(p.q)) + '</p>' +
        (str(p.a).trim()
          ? '<details class="predict-ans"><summary>Xem kết quả và giải thích</summary>' +
            '<div class="ans-body">' + sanitize(str(p.a)) + '</div></details>'
          : '') +
        '</div>';
    };
    var asksBox = function (list) {
      list = arr(list).filter(function (s) { return str(s).trim().length > 0; });
      if (!list.length) return '';
      return '<div class="asks"><div class="pb-h">Tự hỏi trước khi đọc phần giải thích</div><ol>' +
        list.map(function (s) { return '<li>' + esc(str(s)) + '</li>'; }).join('') + '</ol></div>';
    };
    var attacksBox = function (list) {
      list = arr(list).filter(function (a) {
        a = obj(a) || {};
        return str(a.q).trim().length > 0 || str(a.a).trim().length > 0;
      });
      if (!list.length) return '';
      return '<div class="attacks"><div class="pb-h">Interviewer sẽ đào tiếp</div>' +
        list.map(function (a) {
          a = obj(a) || {};
          return '<div class="atk"><p class="fq">' + sanitize(str(a.q)) + '</p>' +
            '<p class="fa">' + sanitize(str(a.a)) + '</p></div>';
        }).join('') + '</div>';
    };
    var spokenBox = function (t, cls, text) {
      if (!str(text).trim()) return '';
      return '<div class="spoken ' + cls + '"><div class="pb-h">' + esc(t) + '</div>' +
        '<p>' + esc(str(text)) + '</p></div>';
    };
    var anchorBox = function (text) {
      if (!str(text).trim()) return '';
      return '<p class="anchor"><span class="pb-h">Câu neo</span>' + esc(str(text)) + '</p>';
    };
    var timelineBox = function (rows) {
      rows = arr(rows).filter(function (r) { return Array.isArray(r) && r.length >= 2; });
      if (!rows.length) return '';
      return '<table class="timeline"><thead><tr><th>Thời điểm</th><th>Chuyện gì xảy ra</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td class="tl-when">' + esc(str(r[0])) + '</td><td>' + sanitize(str(r[1])) + '</td></tr>';
        }).join('') + '</tbody></table>';
    };

    // ---- questions view ----
    var qCard = function (q) {
      // New pedagogical fields are optional; when present they lead, the classic
      // answer blocks follow. Old questions render exactly as before.
      var lead = when(q.incident, blockBox('pb pb-incident', 'Tình huống', q.incident)) +
        asksBox(q.askFirst) + predictBox(q.predict) +
        when(q.naive, blockBox('pb pb-naive', 'Cách làm ngây thơ', q.naive, q.naiveCode, q.naiveOut)) +
        when(q.rootCause, blockBox('pb pb-root', 'Nguyên nhân gốc', q.rootCause));
      var tail = when(q.tradeoff, blockBox('pb pb-tradeoff', 'Đánh đổi', q.tradeoff)) +
        when(q.alternatives, blockBox('pb pb-alt', 'Lựa chọn thay thế', q.alternatives)) +
        when(q.observe, blockBox('pb pb-observe', 'Quan sát trên production', q.observe)) +
        attacksBox(q.attacks) + anchorBox(q.anchor) +
        spokenBox('Trả lời 30 giây', 'spoken-30', q.say30) +
        spokenBox('Trả lời 90 giây', 'spoken-90', q.say90);
      return '<article class="card" data-id="' + esc(str(q.id)) + '">' +
        '<div class="qhead"><span class="qid">' + esc(str(q.id)) + '</span><span class="chips">' +
        prioChip(q.prio) + chip(q.group) + chip(q.level) + chip(typeLabel(q.type), 't') + chip(q.topic) +
        '</span></div>' +
        '<p class="qtext">' + esc(str(q.q)) + '</p>' +
        lead +
        '<details class="ans"><summary>Xem đáp án, ví dụ và chuỗi hỏi đào sâu</summary><div class="ans-body">' +
        oralBlock(q) + deepBlock(q) + codeBlock(q) + expectedBlock(q) + fuBlock(q) + pitBlock(q) + scBlock(q) +
        '</div></details>' +
        tail +
        '<div class="qfoot"><div class="mark-btns">' + markBtns(q.id) + '</div>' + refsNote(q) + '</div>' +
        '</article>';
    };

    var readFilters = function () {
      return {
        q: str($('search') && $('search').value).trim(),
        prio: str($('f-prio') && $('f-prio').value),
        level: str($('f-level') && $('f-level').value),
        group: str($('f-group') && $('f-group').value),
        status: str($('f-status') && $('f-status').value),
        weakOnly: !!(($('weak-only') || {}).checked),
        statusMap: progress,
      };
    };
    var describeFilters = function (f) {
      var p = [];
      if (f.q) p.push('từ khoá “' + f.q + '”');
      if (f.prio) p.push('ưu tiên ' + f.prio);
      if (f.level) p.push('độ sâu ' + f.level);
      if (f.group) p.push('nhóm ' + f.group);
      if (f.status) p.push('trạng thái ' + statusLabel(f.status));
      if (f.weakOnly) p.push('chỉ câu đánh dấu yếu');
      return p.length
        ? 'Đang lọc: ' + p.join(' · ') + '. Bấm “Xoá lọc” để bỏ hết.'
        : 'Không có bộ lọc nào đang bật — đang hiện toàn bộ câu hỏi.';
    };

    var renderQuestions = function () {
      var f = readFilters();
      var list = LOGIC.filterQuestions(QS, f);
      var listEl = $('q-list');
      if (listEl) { listEl.innerHTML = list.map(qCard).join(''); decorate(listEl); }
      var empty = $('q-empty');
      if (empty) empty.hidden = list.length > 0;
      var count = $('q-count');
      if (count) count.textContent = 'Hiện ' + list.length + ' / ' + QS.length + ' câu hỏi.';
      var stat = $('stat-line');
      if (stat) stat.textContent = describeFilters(f);
    };

    var renderProgress = function () {
      var c = { new: 0, learning: 0, known: 0, weak: 0 };
      QS.forEach(function (q) { if (q && q.id) c[statusOf(q.id)]++; });
      var done = c.known + c.learning + c.weak;
      var pct = QS.length ? Math.round((done / QS.length) * 100) : 0;
      var bar = $('progress-bar');
      if (bar) {
        bar.setAttribute('aria-valuenow', String(pct));
        var fill = bar.firstElementChild;
        if (fill) fill.style.width = pct + '%';
      }
      var text = $('progress-text');
      if (text) {
        text.textContent = done
          ? 'Đã đánh dấu ' + done + '/' + QS.length + ' câu (' + pct + '%) · đã nắm ' + c.known +
            ' · đang ôn ' + c.learning + ' · cần ôn lại ' + c.weak + '.'
          : 'Chưa có tiến độ — đánh dấu từng câu để lưu lại trạng thái học.';
      }
    };

    var syncCardMarks = function (card) {
      var id = card.getAttribute('data-id');
      var btns = card.querySelectorAll('[data-mark]');
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-mark') === statusOf(id) ? 'true' : 'false');
      }
    };

    var filtersActive = function () {
      var f = readFilters();
      return !!(f.q || f.prio || f.level || f.group || f.status || f.weakOnly);
    };

    var wireQuestions = function () {
      on($('q-list'), 'click', function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        var btn = t.closest('[data-mark]');
        if (!btn) return;
        var card = btn.closest('[data-id]');
        if (!card) return;
        var id = card.getAttribute('data-id');
        var v = btn.getAttribute('data-mark');
        // clicking the current status again clears it back to "new"
        progress[id] = statusOf(id) === v ? 'new' : v;
        saveProgress();
        syncCardMarks(card);
        renderProgress();
        if (filtersActive()) renderQuestions();
        if ($('fc-front') && fcIndex != null && DECK[fcIndex] && DECK[fcIndex].id === id) renderFlash(fcIndex);
      });

      on($('toggle-all'), 'click', function () {
        var list = $('q-list');
        if (!list) return;
        var open = this.getAttribute('aria-pressed') !== 'true';
        var dets = list.querySelectorAll('details.ans');
        for (var i = 0; i < dets.length; i++) dets[i].open = open;
        this.setAttribute('aria-pressed', open ? 'true' : 'false');
        this.textContent = open ? 'Thu gọn tất cả đáp án' : 'Mở tất cả đáp án';
      });
      on($('search'), 'input', renderQuestions);
      ['f-prio', 'f-level', 'f-group', 'f-status', 'weak-only'].forEach(function (id) {
        on($(id), 'change', function () {
          var p0 = $('f-prio');
          var btn = $('only-p0');
          if (p0 && btn) btn.setAttribute('aria-pressed', p0.value === 'P0' ? 'true' : 'false');
          renderQuestions();
        });
      });
      // the search field lives in a form: Enter must not reload the page
      on($('filter-form'), 'submit', function (ev) { ev.preventDefault(); renderQuestions(); });

      on($('only-p0'), 'click', function () {
        var sel = $('f-prio');
        if (!sel) return;
        var on_ = this.getAttribute('aria-pressed') !== 'true';
        this.setAttribute('aria-pressed', on_ ? 'true' : 'false');
        sel.value = on_ ? 'P0' : '';
        renderQuestions();
      });

      on($('clear-filters'), 'click', function () {
        var s = $('search'); if (s) s.value = '';
        ['f-prio', 'f-level', 'f-group', 'f-status'].forEach(function (id) { if ($(id)) $(id).value = ''; });
        var w = $('weak-only'); if (w) w.checked = false;
        var p0 = $('only-p0'); if (p0) p0.setAttribute('aria-pressed', 'false');
        renderQuestions();
      });
    };

    // ---- progress controls ----
    var wireProgress = function () {
      on($('reset-btn'), 'click', function () {
        if (!window.confirm('Xoá toàn bộ tiến độ học đã lưu trên trình duyệt này?')) return;
        store.del(PROGRESS_KEY);
        store.del(LESSON_KEY);
        progress = {};
        lessonsDone = {};
        renderProgress();
        renderLearn();
        renderQuestions();
        renderFlash(fcIndex || 0);
      });
    };

    // ---- flashcard ----
    var DECK = QS.slice().sort(function (a, b) {
      var pa = PR[a && a.prio] == null ? 9 : PR[a.prio];
      var pb = PR[b && b.prio] == null ? 9 : PR[b.prio];
      return pa - pb || str(a && a.id).localeCompare(str(b && b.id));
    });
    var fcIndex = 0;
    var fcRevealed = false;

    var renderFlash = function (idx) {
      var q = DECK[idx];
      var back = $('fc-back'), front = $('fc-front'), meta = $('fc-progress'), count = $('fc-count');
      var reveal = $('fc-reveal'), know = $('fc-know'), weak = $('fc-weak');
      if (!q) {
        if (front) front.textContent = 'Chưa có câu hỏi nào.';
        return;
      }
      if (meta) {
        meta.innerHTML = chip(q.id, 't') + prioChip(q.prio) + chip(q.group) + chip(q.level) +
          chip(q.topic) + chip(statusLabel(statusOf(q.id)));
      }
      if (front) front.textContent = str(q.q);
      if (back) { back.innerHTML = oralBlock(q) + deepBlock(q) + expectedBlock(q); decorate(back); }
      if (count) count.textContent = 'Câu ' + (idx + 1) + ' / ' + DECK.length;
      fcRevealed = false;
      if (back) back.hidden = true;
      if (reveal) { reveal.setAttribute('aria-expanded', 'false'); reveal.textContent = 'Hiện đáp án'; }
      if (know) know.setAttribute('aria-pressed', statusOf(q.id) === 'known' ? 'true' : 'false');
      if (weak) weak.setAttribute('aria-pressed', statusOf(q.id) === 'weak' ? 'true' : 'false');
    };

    var flashMark = function (v) {
      var q = DECK[fcIndex];
      if (!q) return;
      progress[q.id] = statusOf(q.id) === v ? 'new' : v;
      saveProgress();
      renderProgress();
      renderFlash(fcIndex);
      if (filtersActive()) renderQuestions();
    };

    var wireFlash = function () {
      on($('fc-reveal'), 'click', function () {
        var back = $('fc-back');
        if (!back) return;
        fcRevealed = !fcRevealed;
        back.hidden = !fcRevealed;
        this.setAttribute('aria-expanded', fcRevealed ? 'true' : 'false');
        this.textContent = fcRevealed ? 'Ẩn đáp án' : 'Hiện đáp án';
      });
      on($('fc-prev'), 'click', function () {
        if (!DECK.length) return;
        fcIndex = (fcIndex - 1 + DECK.length) % DECK.length;
        renderFlash(fcIndex);
      });
      on($('fc-next'), 'click', function () {
        if (!DECK.length) return;
        fcIndex = (fcIndex + 1) % DECK.length;
        renderFlash(fcIndex);
      });
      on($('fc-know'), 'click', function () { flashMark('known'); });
      on($('fc-weak'), 'click', function () { flashMark('weak'); });
    };

    // ---- quiz ----
    // Options are stored in the data with the correct answer first, so rendering them in
    // array order let a learner score 28/28 by always picking the top option. Shuffle
    // deterministically per question id: the order is stable across reloads (the page is
    // offline and must look the same on every open) but the answer is not always first.
    var seedFrom = function (s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    };
    var orderFor = function (id, n) {
      var order = [];
      for (var i = 0; i < n; i++) order.push(i);
      var seed = seedFrom(str(id)) || 1;
      for (var k = n - 1; k > 0; k--) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        var j = seed % (k + 1);
        var t = order[k]; order[k] = order[j]; order[j] = t;
      }
      return order;
    };
    var renderQuiz = function () {
      var list = $('quiz-list');
      if (list) {
        list.innerHTML = QUIZSET.map(function (q, i) {
          q = obj(q) || {};
          var raw = arr(q.options);
          var opts = orderFor(q.id, raw.length).map(function (j) {
            return '<label class="opt"><input type="radio" name="qz-' + esc(str(q.id)) + '" value="' + j + '">' +
              esc(str(raw[j])) + '</label>';
          }).join('');
          return '<div class="quiz-item" data-quiz="' + esc(str(q.id)) + '">' +
            '<p class="qq">' + (i + 1) + '. ' + esc(str(q.q)) + '</p>' + opts +
            '<div class="quiz-exp" hidden></div></div>';
        }).join('');
      }
      var count = $('quiz-count');
      if (count) {
        count.textContent = QUIZSET.length + ' câu · ' +
          QUIZSET.filter(function (q) { return obj(q) && q.situational; }).length + ' câu tình huống.';
      }
    };

    var wireQuiz = function () {
      on($('quiz-submit'), 'click', function () {
        var answers = {};
        var picked = doc.querySelectorAll('#quiz-list input[type="radio"]:checked');
        for (var i = 0; i < picked.length; i++) {
          var name = str(picked[i].getAttribute('name')).replace(/^qz-/, '');
          answers[name] = Number(picked[i].value);
        }
        var s = LOGIC.quizScore(QUIZSET, answers) || {};
        var total = typeof s.total === 'number' ? s.total : QUIZSET.length;
        var correct = typeof s.correct === 'number' ? s.correct : 0;

        var byGroup = {};
        QUIZSET.forEach(function (q) {
          if (q && q.group) byGroup[q.group] = (byGroup[q.group] || 0) + 1;
        });
        var perGroup = s.perGroup || {};
        var groupText = Object.keys(byGroup).sort().map(function (g) {
          var ok = typeof perGroup[g] === 'number' ? perGroup[g] : 0;
          return g + ': ' + ok + '/' + byGroup[g];
        }).join(' · ');

        var items = doc.querySelectorAll('#quiz-list [data-quiz]');
        for (var k = 0; k < items.length; k++) {
          var item = items[k];
          var id = item.getAttribute('data-quiz');
          var q = null;
          for (var j = 0; j < QUIZSET.length; j++) if (QUIZSET[j] && QUIZSET[j].id === id) { q = QUIZSET[j]; break; }
          if (!q) continue;
          var labels = item.querySelectorAll('.opt');
          var chosen = answers[id];
          var domOf = orderFor(q.id, arr(q.options).length);
          var correctPos = domOf.indexOf(Number(q.answer));
          var chosenPos = domOf.indexOf(chosen);
          if (correctPos >= 0 && labels[correctPos]) labels[correctPos].classList.add('correct');
          if (chosen != null && chosen !== q.answer && chosenPos >= 0 && labels[chosenPos]) labels[chosenPos].classList.add('wrong');
          var exp = item.querySelector('.quiz-exp');
          if (exp) {
            exp.hidden = false;
            exp.textContent = (chosen === q.answer ? '✓ Đúng. ' : '✗ Sai. ') + str(q.explain);
          }
        }

        var out = $('quiz-result');
        if (out) {
          var wrong = arr(s.wrong);
          out.innerHTML = '<div class="note"><strong>Đúng ' + correct + '/' + total + '</strong> (' +
            (total ? Math.round((correct / total) * 100) : 0) + '%). Nhóm — ' + esc(groupText) + '.</div>' +
            (wrong.length
              ? '<div class="note">Còn sai: ' + esc(wrong.join(', ')) +
                '. Mở lại các câu đó trong mục “Câu hỏi &amp; đáp án” và đánh dấu lại trạng thái.</div>'
              : '<div class="note">Không sai câu nào. Chuyển sang mock interview để luyện trả lời to nhỏ.</div>');
        }
      });

      on($('quiz-reset'), 'click', function () {
        var out = $('quiz-result');
        if (out) out.textContent = '';
        renderQuiz();
      });
    };

    // ---- mock interview ----
    var mockState = null;
    var mockTimer = null;

    var fmtClock = function (s) {
      s = s < 0 ? 0 : s;
      var m = Math.floor(s / 60);
      var r = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    };

    var stopMockTimer = function () {
      if (mockTimer != null) { clearInterval(mockTimer); mockTimer = null; }
    };

    var endMock = function () {
      if (!mockState) return;
      stopMockTimer();
      var timer = $('mock-timer');
      if (timer) { timer.textContent = '00:00'; timer.classList.remove('warn'); }
      var next = $('mock-next');
      if (next) next.disabled = true;
      var res = $('mock-result');
      if (res) {
        var used = mockState.total - mockState.left;
        res.textContent = 'Hết phiên: ' + mockState.qs.length + ' câu trong ' +
          fmtClock(used) + '. Mở lại đáp án ở các câu sai, rồi đánh dấu lại trạng thái học.';
      }
      mockState.done = true;
    };

    var renderMockQuestion = function () {
      var q = obj(mockState.qs[mockState.i]);
      var qEl = $('mock-question');
      var aEl = $('mock-answer');
      var next = $('mock-next');
      if (qEl) qEl.textContent = (mockState.i + 1) + '. ' + str(q && q.q);
      if (aEl) {
        // The answer is collapsed behind a disclosure. Printing `oral` straight into the
        // panel put the model answer on screen under a label that told the learner to
        // answer out loud first — the retrieval step the mock exists for never happened.
        // The reveal also carries `attacks`, so a mock question drills the follow-ups a
        // real interviewer asks next instead of stopping at the 30-second answer.
        var body = '';
        if (q) {
          if (str(q.oral)) {
            body += '<div class="block">' + lbl('Trả lời miệng 30–60 giây') +
              '<p class="oral">' + esc(str(q.oral)) + '</p></div>';
          }
          body += anchorBox(q.anchor) + attacksBox(q.attacks);
        }
        aEl.innerHTML = body
          ? '<details class="mock-reveal"><summary>Đã trả lời xong — mở gợi ý và các câu hỏi đào tiếp</summary>' +
            '<div class="mock-reveal-body">' + body + '</div></details>'
          : '<p class="small">Câu này chưa có gợi ý đáp án. Trả lời theo khung: vấn đề → cách làm đầu tiên → ' +
            'chỗ hỏng → nguyên nhân gốc → đánh đổi → khi nào không dùng.</p>';
      }
      if (next) next.disabled = mockState.i >= mockState.qs.length - 1;
    };

    var startMock = function () {
      var sel = $('mock-topic');
      var keys = Object.keys(MOCKS);
      var set = obj(MOCKS[sel && sel.value ? sel.value : keys[0]]);
      var res = $('mock-result');
      if (!set) {
        if (res) res.textContent = 'Chưa có bộ câu hỏi mock nào trong tài liệu.';
        return;
      }
      var qs = [];
      arr(set.pick).forEach(function (spec) {
        arr(LOGIC.resolvePick(spec, QS)).forEach(function (q) {
          if (q && q.id && !qs.some(function (x) { return x.id === q.id; })) qs.push(q);
        });
      });
      if (!qs.length) {
        if (res) res.textContent = 'Không tìm được câu hỏi nào cho chủ đề này.';
        return;
      }
      var mins = Number(($('mock-minutes') || {}).value);
      mins = isFinite(mins) && mins >= 1 ? Math.min(120, Math.round(mins)) : 20;
      stopMockTimer();
      mockState = { qs: qs, i: 0, left: mins * 60, total: mins * 60, done: false };
      var panel = $('mock-panel');
      if (panel) panel.hidden = false;
      var timer = $('mock-timer');
      if (timer) { timer.textContent = fmtClock(mockState.left); timer.classList.remove('warn'); }
      if (res) res.textContent = str(set.brief);
      renderMockQuestion();
      mockTimer = setInterval(function () {
        if (!mockState || mockState.done) { stopMockTimer(); return; }
        mockState.left--;
        var t = $('mock-timer');
        if (t) {
          t.textContent = fmtClock(mockState.left);
          t.classList.toggle('warn', mockState.left <= 60);
        }
        if (mockState.left <= 0) endMock();
      }, 1000);
    };

    var wireMock = function () {
      var sel = $('mock-topic');
      if (sel) {
        sel.innerHTML = Object.keys(MOCKS).map(function (k) {
          return '<option value="' + esc(k) + '">' + esc(str((MOCKS[k] || {}).label || k)) + '</option>';
        }).join('');
      }
      on($('mock-start'), 'click', startMock);
      on($('mock-next'), 'click', function () {
        if (!mockState || mockState.done) return;
        if (mockState.i >= mockState.qs.length - 1) { endMock(); return; }
        mockState.i++;
        renderMockQuestion();
      });
    };

    // ---- study plans ----
    var pickIds = function (specs) {
      var ids = [];
      arr(specs).forEach(function (spec) {
        arr(LOGIC.resolvePick(spec, QS)).forEach(function (q) {
          if (q && q.id && ids.indexOf(q.id) < 0) ids.push(q.id);
        });
      });
      return ids;
    };

    var renderPlans = function () {
      var body = $('plan-body');
      if (!body) return;
      var keys = Object.keys(PLANS);
      if (!keys.length) { body.innerHTML = '<p class="stat-line">Chưa có lịch ôn.</p>'; return; }
      body.innerHTML = keys.map(function (k) {
        var plan = obj(PLANS[k]) || {};
        var blocks = arr(plan.blocks).map(function (b, i) {
          b = obj(b) || {};
          var ids = pickIds(b.pick);
          return '<div class="block">' + lbl('Khối ' + (i + 1) + ' — ' + str(b.what)) +
            '<p>' + esc(str(b.how)) + '</p>' +
            '<p class="small">Câu hỏi gợi ý (' + ids.length + '):</p><ul class="tight">' +
            ids.map(function (id) {
              var q = Q_BY_ID[id];
              return '<li>' + esc(id) + ' · ' + esc(str(q && q.topic)) + '</li>';
            }).join('') + '</ul></div>';
        }).join('');
        return '<div class="case-sec"><h3>' + esc(str(plan.label || k)) + '</h3>' + blocks + '</div>';
      }).join('');
    };

    // ---- case study ----
    var flowFigure = function (id) {
      var f = obj(FLOW_BY_ID[id]);
      if (!f) return '';
      return '<figure class="svg-wrap">' + sanitize(f.svg) +
        '<figcaption>' + esc(str(f.caption)) + '</figcaption></figure>';
    };

    // Glossary rows for one bài. LESSON_GLOSSARY arrives either as [{ id, rows }]
    // or as { id: rows }; both shapes are accepted so the renderer never blanks.
    var glossaryRows = function (id) {
      var g = GLOSSARY;
      if (!g) return [];
      var entry;
      if (Array.isArray(g)) {
        for (var i = 0; i < g.length; i++) {
          if (g[i] && str(g[i].id) === str(id)) { entry = g[i]; break; }
        }
      } else {
        entry = g[str(id)];
      }
      var rows = Array.isArray(entry) ? entry : (entry && Array.isArray(entry.rows) ? entry.rows : []);
      return arr(rows).filter(function (r) { return r; });
    };
    var glossaryBox = function (id) {
      var rows = glossaryRows(id);
      if (!rows.length) return '';
      return '<div class="block"><div class="pb-h">Thuật ngữ</div>' +
        '<table class="gloss"><thead><tr><th>Khái niệm</th><th>Là gì</th><th>Không phải là gì</th></tr></thead><tbody>' +
        rows.map(function (r) {
          r = obj(r) || {};
          return '<tr><td>' + esc(str(r.term)) + '</td><td>' + esc(str(r.is)) +
            '</td><td>' + esc(str(r.not)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    };

    // Every diagram for one bài, in authored order.
    // A missing id is skipped — never substitute another bài's diagram.
    var lessonVisuals = function (l) {
      l = obj(l) || {};
      var list = arr(l.visuals);
      return arr(list).map(function (v) {
        var item = typeof v === 'string' ? { id: v } : (obj(v) || {});
        var id = str(item.id);
        if (!id || !obj(FLOW_BY_ID[id])) return '';
        return when(str(item.question), '<p class="figure-q">' + esc(str(item.question)) + '</p>') +
          flowFigure(id) +
          when(str(item.focus), '<p class="figure-focus">Nhìn vào: ' + esc(str(item.focus)) + '</p>');
      }).join('');
    };

    var renderCase = function () {
      var body = $('case-body');
      if (!body) return;
      var head = '<div class="note"><p><strong>' + esc(str(CASE.title)) + '</strong></p><p>' +
        esc(str(CASE.pitch)) + '</p></div>';
      body.innerHTML = head + arr(CASE.sections).map(function (s) {
        s = obj(s) || {};
        return '<div class="case-sec"><h3>' + esc(str(s.h || s.id)) + '</h3>' +
          '<div class="deep">' + sanitize(s.body) + '</div>' + flowFigure(s.flow) + '</div>';
      }).join('');
      decorate(body);
    };

    // ---- sources ----
    var checkedText = function () {
      if (typeof CHECKED === 'string') return CHECKED;
      if (Array.isArray(CHECKED)) return CHECKED.join(' · ');
      var o = obj(CHECKED);
      if (!o) return '';
      return Object.keys(o).map(function (k) { return k + ': ' + str(o[k]); }).join(' · ');
    };
    var groupTitle = function (g) {
      var gi = obj(GI[g]);
      return gi && gi.title ? gi.title : 'Nhóm ' + g;
    };

    var renderSources = function () {
      var body = $('sources-body');
      if (!body) return;
      var groups = {};
      SRC.forEach(function (s) {
        if (s) { var g = s.group || '*'; (groups[g] = groups[g] || []).push(s); }
      });
      var ck = checkedText();
      body.innerHTML = when(ck, '<div class="note">Ngày kiểm tra ghi kèm từng mục; lần rà gần nhất: ' + esc(ck) + '.</div>') +
        Object.keys(groups).sort().map(function (g) {
          return '<div class="src-group"><h3>' + esc(groupTitle(g)) + '</h3><ul class="src-list">' +
            groups[g].map(function (s) {
              return '<li><a href="' + esc(str(s.url)) + '" target="_blank" rel="noopener noreferrer">' +
                esc(str(s.name)) + '</a> <span class="meta">' + esc(g) + ' · kiểm tra ' +
                esc(str(s.checked)) + '</span></li>';
            }).join('') + '</ul></div>';
        }).join('');
    };

    // ---- intro guide ----
    var renderIntro = function () {
      var body = $('intro-body');
      if (!body) return;
      var planLabels = Object.keys(PLANS).map(function (k) { return str((PLANS[k] || {}).label || k); });
      var rows = Object.keys(GI).sort().map(function (g) {
        var i = obj(GI[g]) || {};
        var total = QS.filter(function (q) { return q && q.group === g; }).length;
        var p0 = QS.filter(function (q) { return q && q.group === g && q.prio === 'P0'; }).length;
        return '<tr><td><strong>' + esc(str(i.title || g)) + '</strong></td><td>' + esc(str(i.why)) +
          '</td><td>' + p0 + '</td><td>' + total + '</td></tr>';
      }).join('');
      body.innerHTML =
        '<h3 class="sub">Cách dùng</h3>' +
        '<ul class="tight">' +
        '<li><strong>Một lượt ôn = một vòng.</strong> Lọc theo nhóm, trả lời miệng trước khi mở đáp án, xong mới đọc phần giải thích sâu.</li>' +
        '<li>Mỗi câu có bốn phần: trả lời miệng 30–60 giây, giải thích sâu, ví dụ code khi có (kèm kết quả đúng và nguyên nhân) và chuỗi hỏi đào sâu.</li>' +
        '<li>Đánh dấu <em>Đã nắm</em> hoặc <em>Cần ôn lại</em> ngay dưới mỗi câu. Tiến độ lưu trong trình duyệt; bật “Chỉ hiện câu đánh dấu yếu” để ôn đúng chỗ đứng.</li>' +
        '<li>Flashcard luyện nhịp trả lời nhanh, Quiz kiểm tra hiểu bằng trắc nghiệm, Mock interview luyện to nhỏ có đồng hồ đếm ngược.</li>' +
        '<li>Case study là một hệ thống duy nhất, đi hết happy path rồi đi hết từng failure mode.</li>' +
        '</ul>' +
        '<h3 class="sub">Lịch ôn</h3>' +
        '<p>Mục “Lịch ôn” có ba kịch bản: ' + esc(planLabels.join(' · ')) +
        '. Ít thời gian thì chạy kịch bản 6 giờ; có 2–3 ngày thì chạy kịch bản 2 ngày, phần còn lại dùng kịch bản 3 ngày để luyện sâu.</p>' +
        '<h3 class="sub">Nói thẳng về điểm yếu</h3>' +
        '<div class="note">Nền tảng của bạn mạnh ở Django/DRF, FastAPI, React/TypeScript, PostgreSQL, Docker và CI/CD. ' +
        'Hai chỗ cần dựng lại: <strong>AWS</strong> — đường đi của một request qua API Gateway → Lambda/IAM → RDS hoặc DynamoDB → CloudWatch, và khi nào tách việc nặng sang SQS; ' +
        '<strong>Vue 3</strong> — reactivity, computed so với watch, composable, SFC, và cách trả lời khi được hỏi Vue so với React. ' +
        'Đừng né tránh chỗ này: trả lời thẳng “phần này tôi mới ôn sâu gần đây”, rồi nói rõ bạn đã học bằng cách nào và sẽ làm gì với nó trong dự án thật.</div>' +
        '<h3 class="sub">Tài liệu này là gì và không là gì</h3>' +
        '<div class="note"><ul class="tight">' +
        '<li>Đây là bộ câu hỏi luyện tập do tôi tự soạn để ôn cho vị trí Fullstack Engineer, không phải bộ câu hỏi phỏng vấn thật của HiTechCloud. Tôi không có và không khẳng định có đề phỏng vấn hay quy trình tuyển dụng nội bộ của công ty.</li>' +
        '<li>Ba lớp nội dung, đừng gộp chúng làm một. (a) Yêu cầu trong JD: Python tối thiểu 2 năm, thành thạo VueJS, TypeScript là điểm cộng, AWS Lambda/API Gateway/S3/RDS hoặc DynamoDB, Docker, phát hành tự động, theo dõi logs/metrics/chi phí và xử lý lỗi production. (b) Kiến thức nền tảng: Python, JavaScript/TypeScript, HTTP, SQL, Vue, FastAPI/Django — đúng với mọi công ty, không riêng gì đây. (c) Câu hỏi luyện tập trong tài liệu này: tôi viết để tự kiểm tra, có thể khác hẳn đề thật.</li>' +
        '<li>Vì vậy: học để hiểu cơ chế, không học để đoán đề. Câu nào thuộc lớp (a) thì bám sát đúng chữ trong JD; câu nào thuộc lớp (b) thì trả lời bằng cơ chế và tradeoff; và nếu phỏng vấn hỏi thứ không có trong này thì cứ nói thẳng là mình chưa gặp, rồi phân tích từ nền tảng.</li>' +
        '</ul></div>' +
        when(rows, '<h3 class="sub">Mười nhóm kiến thức</h3>' +
          '<table><thead><tr><th>Nhóm</th><th>Vì sao phải biết</th><th>P0</th><th>Số câu</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>');
    };

    // ---- "Hôm nay": Leitner boxes over the P0 deck ----
    // Two new keys, kept apart from hcp-progress-v1 / hcp-lessons-v1:
    // hcp-leitner-v1 = { [qid]: { box, due } }, hcp-recall-v1 = { [lessonId]: [cueIndex] }.
    var LEITNER_KEY = 'hcp-leitner-v1';
    var RECALL_KEY = 'hcp-recall-v1';
    var P0_IDS = (function () {
      var out = [];
      for (var i = 0; i < QS.length; i++) {
        var q = obj(QS[i]);
        if (q && q.id && q.prio === 'P0') out.push(str(q.id));
      }
      return out;
    })();
    var leitner = LOGIC.leitnerLoad(store.get(LEITNER_KEY));
    var saveLeitner = function () { store.set(LEITNER_KEY, LOGIC.leitnerDump(leitner)); };
    var recall = (function () {
      var out = {};
      try {
        var parsed = obj(JSON.parse(store.get(RECALL_KEY) || '{}'));
        if (parsed) {
          for (var k in parsed) {
            if (Array.isArray(parsed[k])) out[k] = parsed[k].map(Number).filter(function (v) { return v >= 0 && v < cueCap(k); });
          }
        }
      } catch (e) { /* corrupt payload — start clean */ }
      return out;
    })();
    var saveRecall = function () { store.set(RECALL_KEY, JSON.stringify(recall)); };
    var todayISO = function () { return LOGIC.dateISO(new Date()); };
    var todayQid = null;
    var todayOpen = false;

    var answerOf = function (q) {
      // Never author an answer: take whatever the question already carries.
      if (str(q.expected).trim()) return { label: 'Kết quả đúng và nguyên nhân', text: str(q.expected), html: false };
      if (str(q.oral).trim()) return { label: 'Trả lời miệng', text: str(q.oral), html: false };
      return null;
    };

    var renderTodayBoxes = function (counts, activeBox) {
      var html = '';
      for (var i = 0; i < 5; i++) {
        var n = i + 1;
        html += '<div class="today-box' + (n === activeBox ? ' is-now' : '') + '">' +
          '<p class="today-box-label">Hộp ' + n + '</p>' +
          '<p class="today-box-n">' + counts[i] + '</p>' +
          '<p class="today-box-int">ôn mỗi ' + LOGIC.LEITNER_INTERVALS[i] + ' ngày</p>' +
          '</div>';
      }
      return html;
    };

    var renderToday = function () {
      var deck = $('today-deck');
      if (deck) deck.textContent = 'Bộ P0 · ' + P0_IDS.length + ' câu';
      var today = todayISO();
      var counts = LOGIC.leitnerCounts(P0_IDS, leitner);
      var due = LOGIC.leitnerDueQids(P0_IDS, leitner, today);
      // One card is always on the table when something is due: the design's bottom
      // card is the resting state, not a button-press result.
      if (!todayQid && due.length) {
        todayQid = LOGIC.leitnerPick(P0_IDS, leitner, today);
        todayOpen = false;
      }
      var activeBox = 0;
      if (todayQid && Q_BY_ID[todayQid]) activeBox = LOGIC.leitnerBox(leitner, todayQid);
      else if (due.length) activeBox = LOGIC.leitnerBox(leitner, due[0]);
      var boxes = $('today-boxes');
      if (boxes) boxes.innerHTML = renderTodayBoxes(counts, activeBox);

      var q = todayQid ? obj(Q_BY_ID[todayQid]) : null;
      var card = $('today-card');
      var eyebrow = $('today-card-eyebrow');
      var question = $('today-card-q');
      var ans = $('today-card-ans');
      var openBtn = $('today-open');
      var grade = $('today-grade');

      if (!q) {
        if (card) card.classList.add('is-empty');
        if (eyebrow) eyebrow.textContent = 'Còn ' + counts[0] + ' câu ở hộp 1';
        if (question) question.textContent = due.length
          ? 'Bấm Enter hoặc nút bên dưới để rút một thẻ đến hạn.'
          : 'Hôm nay không có thẻ đến hạn.';
        if (ans) { ans.hidden = true; ans.innerHTML = ''; }
        if (openBtn) { openBtn.hidden = false; openBtn.disabled = !due.length; openBtn.textContent = 'Rút thẻ'; openBtn.setAttribute('aria-expanded', 'false'); }
        if (grade) grade.hidden = true;
      } else {
        if (card) card.classList.remove('is-empty');
        var box = LOGIC.leitnerBox(leitner, str(q.id));
        if (eyebrow) eyebrow.textContent = 'Rút từ hộp ' + box + ' · ' + str(q.id) + ' · ' + str(q.prio);
        if (question) question.textContent = str(q.q);
        var answer = answerOf(q);
        if (ans) {
          ans.hidden = !todayOpen;
          if (todayOpen && answer) {
            ans.innerHTML = '<div class="lbl">' + esc(answer.label) + '</div><p>' + esc(answer.text) + '</p>';
          } else if (todayOpen) {
            ans.innerHTML = '<div class="lbl">Đáp án</div><p>Câu này chưa có đáp án mẫu.</p>';
          } else {
            ans.innerHTML = '';
          }
        }
        if (openBtn) {
          openBtn.hidden = false;
          openBtn.disabled = false;
          openBtn.textContent = todayOpen ? 'Thu đáp án' : 'Mở đáp án';
          openBtn.setAttribute('aria-expanded', todayOpen ? 'true' : 'false');
        }
        if (grade) grade.hidden = !todayOpen;

      }

      var ready = $('today-ready');
      if (ready) {
        ready.textContent = 'Ngưỡng “Sẵn sàng” (đề xuất, chưa chốt): ' + counts[4] + ' / ' + P0_IDS.length +
          ' câu P0 đã ở hộp 5. Số này là tỉ lệ câu đã lên hộp cao nhất, không phải điều kiện bắt buộc để đi phỏng vấn.';
      }
      var note = $('today-note');
      if (note) {
        note.textContent = 'Khoảng ôn 1 · 2 · 4 · 8 · 16 ngày là đề xuất, chưa có nguồn kiểm chứng và không phải lịch chuẩn của phương pháp Leitner.';
      }
    };

    var drawToday = function () {
      todayQid = LOGIC.leitnerPick(P0_IDS, leitner, todayISO());
      todayOpen = false;
      renderToday();
    };

    var gradeToday = function (ok) {
      if (!todayQid) return;
      leitner = LOGIC.leitnerGrade(leitner, todayQid, ok, todayISO());
      saveLeitner();
      drawToday();
    };

    var wireToday = function () {
      on($('today-open'), 'click', function () {
        if (!todayQid) { drawToday(); return; }
        todayOpen = !todayOpen;
        renderToday();
      });
      on($('today-ok'), 'click', function () { gradeToday(true); });
      on($('today-no'), 'click', function () { gradeToday(false); });
      on($('today-reset'), 'click', function () {
        if (!window.confirm('Đặt lại tiến độ Leitner? Toàn bộ trạng thái hộp và bộ đếm gợi nhớ sẽ bị xoá.')) return;
        store.del(LEITNER_KEY);
        store.del(RECALL_KEY);
        leitner = {};
        recall = {};
        todayQid = null;
        todayOpen = false;
        renderToday();
        renderLearn();
      });
    };

    // ---- lessons: one Cornell sheet per lesson ----
    var recallCount = function (id) {
      var list = arr(recall[str(id)]);
      var n = 0;
      for (var k = 0; k < list.length; k++) { if (list[k] >= 0 && list[k] < cueCap(id)) n++; }
      return n;
    };
    var recallDone = function (id, i) {
      var list = arr(recall[str(id)]);
      for (var k = 0; k < list.length; k++) { if (list[k] === i) return true; }
      return false;
    };
    var toggleRecall = function (id, i) {
      var key = str(id);
      var list = arr(recall[key]).slice();
      var at = list.indexOf(i);
      if (at >= 0) list.splice(at, 1); else list.push(i);
      list.sort(function (a, b) { return a - b; });
      recall[key] = list;
      saveRecall();
    };

    var cueColumn = function (l, id) {
      var cues = arr(l.askFirst);
      var html = cues.map(function (t, i) {
        var n = (i + 1 < 10 ? '0' : '') + (i + 1);
        var done = recallDone(id, i);
        return '<div class="cue"><div class="cue-head"><span class="cue-no">' + n + '</span>' +
          '<p class="cue-text">' + esc(str(t)) + '</p></div>' +
          '<button type="button" class="cue-btn" data-recall="' + esc(id) + '" data-recall-i="' + i + '" aria-pressed="' +
          (done ? 'true' : 'false') + '" aria-label="Gợi nhớ ' + n + ': ' + (done ? 'đã trả lời' : 'chưa trả lời') + '">' +
          (done ? 'Đã trả lời' : 'Trả lời miệng') + '</button></div>';
      }).join('');
      return '<div class="cornell-cue"><p class="cue-label">Gợi nhớ</p>' + html + '</div>';
    };

    var notesColumn = function (l, id) {
      var cueTotal = arr(l.askFirst).length;
      var p = obj(l.predict) || {};
      var predictHtml = str(p.q).trim()
        ? '<div class="predict-card"><p class="predict-label">Dự đoán trước khi đọc</p>' +
          '<p class="predict-q">' + sanitize(str(p.q)) + '</p>' +
          when(str(p.a).trim(),
            '<button type="button" class="btn" data-predict="' + esc(id) + '" aria-pressed="false" aria-expanded="false">Hiện đáp án</button>' +
            '<div class="predict-a" id="predict-a-' + esc(id) + '" hidden><p>' + sanitize(str(p.a)) + '</p></div>') +
          '</div>'
        : '';
      var covered = '<div class="covered" id="covered-' + esc(id) + '">' +
        '<p class="covered-title">Ghi chú đang được che</p>' +
        '<p class="covered-hint">Trả lời các câu gợi nhớ bên trái trước. Nhớ rồi mới đọc</p>' +
        '<button type="button" class="btn btn-primary" data-notes="' + esc(id) + '" aria-pressed="false">Mở ghi chú</button></div>';

      var say = arr(l.sayIt).map(function (s) { return '<li>' + esc(str(s)) + '</li>'; }).join('');
      var qbtns = arr(l.qids).map(function (qid) {
        var q = obj(Q_BY_ID[str(qid)]);
        return '<button type="button" class="btn" data-qid="' + esc(str(qid)) + '">' + esc(str(qid)) +
          (q ? ' · ' + esc(str(q.topic)) : '') + '</button>';
      }).join(' ');
      var refs = arr(l.refs).map(str).join(' · ');
      var builds = arr(l.buildsOn).map(function (bid) {
        var t = obj(LESSON_BY_ID[str(bid)]);
        var label = t ? shortLessonTitle(t.title) : '';
        return '<button type="button" class="lesson-link" data-lesson="' + esc(str(bid)) + '">' + esc(str(bid)) +
          (label ? ' · ' + esc(label) : '') + '</button>';
      }).join(' ');
      var prev = LESSONSARR[LESSON_POS[str(id)] - 1] ? obj(LESSONSARR[LESSON_POS[str(id)] - 1]) : null;
      var next = LESSONSARR[LESSON_POS[str(id)] + 1] ? obj(LESSONSARR[LESSON_POS[str(id)] + 1]) : null;
      var navBtns = (prev && prev.id
        ? '<button type="button" class="btn lesson-link" data-lesson="' + esc(str(prev.id)) + '">← Bài trước: ' + esc(str(prev.id)) + '</button>'
        : '') +
        (next && next.id
        ? '<button type="button" class="btn lesson-link" data-lesson="' + esc(str(next.id)) + '">Bài sau: ' + esc(str(next.id)) + ' →</button>'
        : '');
      // The rail keeps the causal teaching chain. askFirst lives in the cue column and
      // predict in its own card, so neither is repeated here.
      var rail = '';
      rail += when(l.incident, blockBox('pb pb-incident', 'Sự cố', l.incident));
      rail += when(l.naive, blockBox('pb pb-naive', 'Cách làm ngây thơ và vì sao nó có vẻ hợp lý',
        l.naive, l.naiveCode, l.naiveOut));
      rail += timelineBox(l.timeline);
      rail += when(l.rootCause, blockBox('pb pb-root', 'Nguyên nhân gốc', l.rootCause));
      rail += when(l.concept, blockBox('pb pb-concept', 'Bây giờ mới gọi tên khái niệm', l.concept));
      rail += glossaryBox(id);
      rail += when(l.mechanism, blockBox('pb pb-mech', 'Cơ chế bên trong', l.mechanism));
      rail += lessonVisuals(l);
      rail += when(l.failureModes, blockBox('pb pb-fail', 'Những kiểu hỏng mới mà cách sửa này tạo ra', l.failureModes));
      rail += when(l.tradeoff, blockBox('pb pb-tradeoff', 'Đánh đổi', l.tradeoff));
      rail += when(l.alternatives, blockBox('pb pb-alt', 'Lựa chọn thay thế', l.alternatives));
      rail += when(l.observe, blockBox('pb pb-observe', 'Quan sát và gỡ lỗi trên production', l.observe));
      rail += attacksBox(l.attacks);
      rail = '<div class="lesson-rail">' + rail + '</div>';

      var body = '<div class="notes-body" id="notes-' + esc(id) + '" hidden>' +
        rail +
        when(l.body, '<div class="deep">' + sanitize(l.body) + '</div>') +
        when(l.code, '<pre><code>' + esc(str(l.code)) + '</code></pre>') +
        when(l.codeNote, '<p class="small">' + sanitize(str(l.codeNote)) + '</p>') +
        when(say, '<div class="sayit"><div class="sc-h">Bạn phải nói được</div><ul class="tight">' + say + '</ul></div>') +
        spokenBox('Trả lời 30 giây', 'spoken-30', l.say30) +
        spokenBox('Trả lời 90 giây', 'spoken-90', l.say90) +
        when(builds, '<div class="lesson-builds"><span class="lb-h">Dùng lại</span>' + builds + '</div>') +
        when(qbtns, '<p class="lesson-qids">Luyện ngay: ' + qbtns + '</p>') +
        when(refs, '<span class="status-note">Nguồn: ' + esc(refs) + '</span>') +
        provBox(l.provenance) +
        when(navBtns, '<div class="lesson-nav">' + navBtns + '</div>') +
        '</div>';

      return '<div class="cornell-notes">' +
        '<div class="notes-head"><p class="notes-label">Ghi chú</p>' +
        '<button type="button" class="btn notes-toggle" data-notes="' + esc(id) + '" aria-pressed="false" hidden>Che ghi chú</button>' +
        '<p class="recall-state" id="recall-' + esc(id) + '" aria-live="polite">' + recallCount(id) + ' / ' + cueTotal + ' gợi nhớ đã trả lời</p></div>' +
        predictHtml + covered + body + '</div>';
    };

    var provBox = function (list) {
      list = arr(list).filter(function (s) { return str(s).trim().length > 0; });
      if (!list.length) return '';
      return '<div class="provenance"><div class="pb-h">Ghi chú nguồn</div><ul class="tight">' +
        list.map(function (s) { return '<li>' + esc(str(s)) + '</li>'; }).join('') + '</ul></div>';
    };
    var lessonCard = function (l) {
      l = obj(l) || {};
      var id = str(l.id);
      var idx = LESSON_POS[id] == null ? 0 : LESSON_POS[id];
      var total = LESSONSARR.length;
      var stageName = str(l.stageTitle);
      return '<article class="lesson" id="lesson-' + esc(id) + '" data-lesson="' + esc(id) + '">' +
        '<div class="lesson-head"><div class="lesson-head-main">' +
        '<p class="lesson-crumb">Vở ôn · ' + esc(stageName) + ' · Bài ' + (idx + 1) + '/' + total + '</p>' +
        '<h3 class="lesson-h">' + esc(id) + ' · ' + esc(str(l.title)) + '</h3>' +
        '<p class="lesson-goal">' + esc(str(l.goal)) + '</p>' +
        '</div>' +
        '<button type="button" class="btn lesson-done" data-lesson-done="' + esc(id) + '" aria-pressed="' +
        (lessonsDone[id] ? 'true' : 'false') + '">' + (lessonsDone[id] ? '✓ Đã học' : 'Đánh dấu đã học') + '</button></div>' +
        when(l.bridge, '<p class="lesson-bridge"><span class="lb-h">Nối tiếp bài trước</span>' + esc(str(l.bridge)) + '</p>') +
        '<div class="cornell">' + cueColumn(l, id) + notesColumn(l, id) + '</div>' +
        when(l.anchor, '<div class="lesson-anchor"><p class="anchor-label">Tóm tắt · Câu neo</p>' +
          '<p class="anchor">' + esc(str(l.anchor)) + '</p></div>') +
        '</article>';
    };

    var renderLearn = function () {
      var body = $('learn-body');
      if (!body) return;
      if (!LESSONSARR.length) {
        body.innerHTML = '<p class="stat-line">Chưa có bài học.</p>';
        return;
      }
      var byStage = {};
      LESSONSARR.forEach(function (raw) {
        var l = obj(raw) || {};
        var n = Number(l.stage) || 0;
        if (!byStage[n]) byStage[n] = { n: n, title: str(l.stageTitle), intro: str(l.stageIntro), items: [] };
        byStage[n].items.push(l);
      });
      var order = Object.keys(byStage).map(Number).sort(function (a, b) { return a - b; });
      body.innerHTML = order.map(function (n) {
        var st = byStage[n];
        // The stage label is the string the data carries — never shortened.
        return '<h3 class="sub learn-stage">' + esc(st.title) + '</h3>' +
          when(st.intro, '<div class="deep">' + sanitize(st.intro) + '</div>') +
          st.items.map(function (l) { return lessonCard(l); }).join('');
      }).join('');
      decorate(body);
      renderLessonBar(currentLessonId());
    };

    // ---- lesson position bar: 23 segments, done = green, current = indigo ----
    var posBar = null, posId = null, posT = null, posN = null, posBarEl = null;
    var currentLessonId = function () {
      for (var k = 0; k < LESSONSARR.length; k++) {
        var l = obj(LESSONSARR[k]);
        if (l && l.id && !lessonsDone[str(l.id)]) return str(l.id);
      }
      var first = obj(LESSONSARR[0]);
      return first ? str(first.id) : '';
    };
    var renderLessonBar = function (id) {
      if (!posBar) posBar = $('lesson-pos');
      if (!posId) posId = $('lp-id');
      if (!posT) posT = $('lp-t');
      if (!posN) posN = $('lp-n');
      if (!posBarEl) posBarEl = $('lp-bar');
      if (!posBar) return;
      var idx = LESSON_POS[str(id)] == null ? -1 : LESSON_POS[str(id)];
      if (idx < 0) return;
      var l = obj(LESSONSARR[idx]) || {};
      if (posId) posId.textContent = 'Vở ôn · ' + str(l.stageTitle);
      if (posT) posT.textContent = shortLessonTitle(l.title);
      if (posN) posN.textContent = (idx + 1) + ' / ' + LESSONSARR.length;
      if (posBarEl) {
        var segs = LESSONSARR.map(function (raw, i) {
          var ll = obj(raw) || {};
          var cls = i === idx ? ' is-now' : (lessonsDone[str(ll.id)] ? ' is-done' : '');
          return '<i class="seg' + cls + '" aria-hidden="true"></i>';
        }).join('');
        posBarEl.innerHTML = segs;
        posBarEl.setAttribute('aria-valuenow', String(Math.round((idx + 1) / LESSONSARR.length * 100)));
      }
      posBar.removeAttribute('hidden');
    };

    var jumpToQuestion = function (id) {
      showView('questions');
      var box = $('search');
      if (box) box.value = id;
      renderQuestions();
      var card = doc.querySelector('#q-list .card[data-id="' + id + '"]');
      if (!card) {
        // hidden by an active filter — drop the search term once, then look again
        if (!box) return;
        box.value = '';
        renderQuestions();
        card = doc.querySelector('#q-list .card[data-id="' + id + '"]');
        if (!card) return;
      }
      card.scrollIntoView({ block: 'start' });
      card.classList.add('flash-hi');
      setTimeout(function () { card.classList.remove('flash-hi'); }, 1600);
    };

    var jumpToLesson = function (id) {
      showView('learn');
      var card = doc.querySelector('#lesson-' + id);
      if (!card) return;
      card.scrollIntoView({ block: 'start' });
      card.classList.add('flash-hi');
      setTimeout(function () { card.classList.remove('flash-hi'); }, 1600);
      renderLessonBar(id);
    };

    var toggleLessonDone = function (btn) {
      var id = btn.getAttribute('data-lesson-done');
      if (lessonsDone[id]) delete lessonsDone[id]; else lessonsDone[id] = true;
      saveLessons();
      btn.setAttribute('aria-pressed', lessonsDone[id] ? 'true' : 'false');
      btn.textContent = lessonsDone[id] ? '✓ Đã học' : 'Đánh dấu đã học';
      renderLessonBar(id);
    };

    var togglePredict = function (btn) {
      var id = btn.getAttribute('data-predict');
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-pressed', open ? 'true' : 'false');
      btn.textContent = open ? 'Ẩn đáp án' : 'Hiện đáp án';
      var panel = $('predict-a-' + id);
      if (panel) panel.hidden = !open;
    };

    var toggleNotes = function (btn) {
      var id = btn.getAttribute('data-notes');
      var open = btn.getAttribute('aria-pressed') !== 'true';
      var panel = $('notes-' + id);
      if (panel) panel.hidden = !open;
      var covered = $('covered-' + id);
      if (covered) covered.hidden = open;
      var btns = doc.querySelectorAll('[data-notes="' + id + '"]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var isHead = b.classList && b.classList.contains('notes-toggle');
        b.setAttribute('aria-pressed', open ? 'true' : 'false');
        if (isHead) {
          b.hidden = !open;
          b.textContent = 'Che ghi chú';
        } else {
          b.textContent = open ? 'Che ghi chú' : 'Mở ghi chú';
        }
      }
      if (open && panel) decorate(panel);
    };

    var wireLearn = function () {
      on($('learn-body'), 'click', function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        var dbtn = t.closest('[data-lesson-done]');
        if (dbtn) { toggleLessonDone(dbtn); return; }
        var rbtn = t.closest('[data-recall]');
        if (rbtn) {
          var rid = rbtn.getAttribute('data-recall');
          var ri = Number(rbtn.getAttribute('data-recall-i'));
          toggleRecall(rid, ri);
          var done = recallDone(rid, ri);
          rbtn.setAttribute('aria-pressed', done ? 'true' : 'false');
          rbtn.textContent = done ? 'Đã trả lời' : 'Trả lời miệng';
          rbtn.setAttribute('aria-label', 'Gợi nhớ ' + (ri + 1 < 10 ? '0' : '') + (ri + 1) + ': ' + (done ? 'đã trả lời' : 'chưa trả lời'));
          var state = $('recall-' + rid);
          var ll = obj(LESSON_BY_ID[rid]) || {};
          if (state) state.textContent = recallCount(rid) + ' / ' + arr(ll.askFirst).length + ' gợi nhớ đã trả lời';
          return;
        }
        var pbtn = t.closest('[data-predict]');
        if (pbtn) { togglePredict(pbtn); return; }
        var nbtn = t.closest('[data-notes]');
        if (nbtn) { toggleNotes(nbtn); return; }
        var qbtn = t.closest('[data-qid]');
        if (qbtn) { jumpToQuestion(qbtn.getAttribute('data-qid')); return; }
        var lbtn = t.closest('button[data-lesson]');
        if (lbtn) jumpToLesson(lbtn.getAttribute('data-lesson'));
      });
    };

    var lessonPosRefresh = null;
    var wireLessonPos = function () {
      if (typeof IntersectionObserver === 'undefined') return;
      var body = $('learn-body');
      if (!body || !body.querySelectorAll) return;
      var cards = body.querySelectorAll('.lesson');
      var pick = function () {
        // Observer callbacks fire only on threshold crossings, so entry.boundingClientRect
        // is stale by the time we choose. Read live geometry instead: the current lesson
        // is the last one whose top has scrolled up to the sticky bar.
        var sec = $('view-learn');
        if (!sec || !sec.classList || !sec.classList.contains('active')) return;
        var best = null;
        for (var c = 0; c < cards.length; c++) {
          if (cards[c].getBoundingClientRect().top <= 56) best = cards[c];
        }
        renderLessonBar(best && best.getAttribute ? best.getAttribute('data-lesson') : currentLessonId());
      };
      var ob = new IntersectionObserver(pick, { rootMargin: '-56px 0px -70% 0px' });
      for (var c = 0; c < cards.length; c++) ob.observe(cards[c]);
      lessonPosRefresh = pick;
      pick();
    };

    // ---- theme, sidebar, print ----
    var applyTheme = function (t) {
      doc.documentElement.setAttribute('data-theme', t);
      var btn = $('theme-btn');
      if (btn) {
        btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
        btn.textContent = t === 'dark' ? 'Chế độ sáng' : 'Chế độ tối';
      }
    };

    var wireChrome = function () {
      var saved = store.get(THEME_KEY);
      var prefersDark = false;
      try {
        prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      } catch (e) { /* no matchMedia */ }
      applyTheme(saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light'));
      on($('theme-btn'), 'click', function () {
        var next = doc.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        store.set(THEME_KEY, next);
        applyTheme(next);
      });
      on($('print-btn'), 'click', function () { window.print(); });
      on($('side-toggle'), 'click', function () {
        var side = doc.querySelector('.side');
        if (!side) return;
        this.setAttribute('aria-expanded', side.classList.toggle('collapsed') ? 'false' : 'true');
      });
    };

    // ---- view switching ----
    var navBtns = [];
    var showView = function (v) {
      if (VIEWS.indexOf(v) < 0) v = 'questions';
      VIEWS.forEach(function (x) {
        var sec = $('view-' + x);
        if (sec) sec.classList.toggle('active', x === v);
      });
      for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].setAttribute('aria-current', navBtns[i].getAttribute('data-view') === v ? 'true' : 'false');
      }
      if (lessonPosRefresh) {
        if (v === 'learn') {
          lessonPosRefresh();
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(lessonPosRefresh);
        } else if (posBar) {
          posBar.setAttribute('hidden', '');
        }
      }
    };

    var renderCounts = function () {
      var counts = {
        today: P0_IDS.length,
        intro: QS.filter(function (q) { return q && q.prio === 'P0'; }).length,
        learn: LESSONSARR.length,
        questions: QS.length,
        flashcard: DECK.length,
        quiz: QUIZSET.length,
        mock: Object.keys(MOCKS).length,
        plan: Object.keys(PLANS).length,
        case: arr(CASE.sections).length,
        sources: SRC.length,
      };
      var nodes = doc.querySelectorAll('[data-count-for]');
      for (var i = 0; i < nodes.length; i++) {
        var k = nodes[i].getAttribute('data-count-for');
        nodes[i].textContent = counts[k] == null ? '' : String(counts[k]);
      }
    };

    var wireKeys = function () {
      on(doc, 'keydown', function (ev) {
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        var t = ev.target || {};
        var tag = t.tagName || '';
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || !!t.isContentEditable;
        if (!typing && ev.key === '/') {
          var s = $('search');
          if (s) { ev.preventDefault(); showView('questions'); s.focus(); }
          return;
        }
        var tv = $('view-today');
        if (tv && tv.classList && tv.classList.contains('active') && !typing) {
          if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
          if (ev.key === 'Enter') { ev.preventDefault(); drawToday(); return; }
          if (ev.key === ' ' || ev.key === 'Spacebar') {
            ev.preventDefault();
            if (!todayQid) { drawToday(); return; }
            todayOpen = !todayOpen;
            renderToday();
            return;
          }
          if (ev.key === '1') { if (todayOpen) gradeToday(true); return; }
          if (ev.key === '2') { if (todayOpen) gradeToday(false); return; }
          return;
        }
        var fv = $('view-flashcard');
        if (typing || !fv || !fv.classList.contains('active')) return;
        if (ev.key === ' ') {
          if (/^(BUTTON|A)$/.test(tag)) return;
          ev.preventDefault();
          $('fc-reveal').click();
        } else if (ev.key === 'ArrowRight') { $('fc-next').click(); }
        else if (ev.key === 'ArrowLeft') { $('fc-prev').click(); }
        else if (ev.key === '1') { $('fc-know').click(); }
        else if (ev.key === '2') { $('fc-weak').click(); }
      });
    };

    var init = function () {
      var sideEl = doc.querySelector('.side');
      if (sideEl && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) sideEl.classList.add('collapsed');
      navBtns = doc.querySelectorAll('#nav-list [data-view]');
      for (var i = 0; i < navBtns.length; i++) {
        (function (btn) {
          on(btn, 'click', function () { showView(btn.getAttribute('data-view')); });
        })(navBtns[i]);
      }
      wireChrome();
      wireKeys();
      wireQuestions();
      wireProgress();
      wireFlash();
      wireQuiz();
      wireMock();
      wireToday();
      wireLearn();
      renderCounts();
      renderToday();
      renderLearn();
      wireLessonPos();
      renderIntro();
      renderPlans();
      renderCase();
      renderSources();
      renderQuestions();
      renderProgress();
      renderFlash(0);
      renderQuiz();
      var hash = str(window.location && window.location.hash).replace(/^#/, '');
      showView(VIEWS.indexOf(hash) >= 0 ? hash : 'today');
    };

    init();
  })();
}
