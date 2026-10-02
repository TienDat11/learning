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

    var FLOW_BY_ID = {};
    FLOWS.forEach(function (f) { if (f && f.id) FLOW_BY_ID[f.id] = f; });
    var SRC_BY_KEY = {};
    SRC.forEach(function (s) { if (s && s.key) SRC_BY_KEY[s.key] = s; });
    var Q_BY_ID = {};
    QS.forEach(function (q) { if (q && q.id) Q_BY_ID[q.id] = q; });
    var LESSON_BY_ID = {};
    LESSONSARR.forEach(function (l) { if (l && l.id) LESSON_BY_ID[l.id] = l; });
    // The L01 backbone: every later bài hangs off exactly one of these nodes.
    var LESSON_NODES = [['client', 'Trình duyệt'], ['gateway', 'API Gateway'], ['compute', 'Lambda / code'], ['data', 'DB / S3'], ['queue', 'SQS / worker']];
    var shortLessonTitle = function (t) {
      t = str(t);
      if (t.length <= 40) return t;
      var cut = t.slice(0, 40);
      var sp = cut.lastIndexOf(' ');
      if (sp > 20) cut = cut.slice(0, sp);
      return cut + '…';
    };

    var VIEWS = ['learn', 'intro', 'questions', 'flashcard', 'quiz', 'mock', 'plan', 'case', 'sources'];
    var PR = { P0: 0, P1: 1, P2: 2 };
    var STATUSES = [
      { v: 'new', t: 'Chưa học' },
      { v: 'learning', t: 'Đang ôn' },
      { v: 'known', t: 'Đã nắm' },
      { v: 'weak', t: 'Yếu' },
    ];

    // HTML that is allowed through (deep, case body, svg) still gets script and
    // inline-handler tags cut out — data files are content, not trusted markup.
    var sanitize = function (html) {
      return str(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<script[\s\S]*?>/gi, '')
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
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

    // ---- small HTML builders ----
    var chip = function (text, cls) {
      return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + esc(str(text)) + '</span>';
    };
    var prioChip = function (p) {
      var c = p === 'P0' ? 'p0' : p === 'P1' ? 'p1' : p === 'P2' ? 'p2' : '';
      return chip(p || '—', c);
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

    // ---- questions view ----
    var qCard = function (q) {
      return '<article class="card" data-id="' + esc(str(q.id)) + '">' +
        '<div class="qhead"><span class="qid">' + esc(str(q.id)) + '</span><span class="chips">' +
        prioChip(q.prio) + chip(q.group) + chip(q.level) + chip(q.type, 't') + chip(q.topic) +
        '</span></div>' +
        '<p class="qtext">' + esc(str(q.q)) + '</p>' +
        '<details class="ans"><summary>Xem đáp án, ví dụ và chuỗi hỏi đào sâu</summary><div class="ans-body">' +
        oralBlock(q) + deepBlock(q) + codeBlock(q) + expectedBlock(q) + fuBlock(q) + pitBlock(q) + scBlock(q) +
        '</div></details>' +
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
      if (f.status) p.push('trạng thái ' + f.status);
      if (f.weakOnly) p.push('chỉ câu đánh dấu yếu');
      return p.length
        ? 'Đang lọc: ' + p.join(' · ') + '. Bấm “Xoá lọc” để bỏ hết.'
        : 'Không có bộ lọc nào đang bật — đang hiện toàn bộ câu hỏi.';
    };

    var renderQuestions = function () {
      var f = readFilters();
      var list = LOGIC.filterQuestions(QS, f);
      var listEl = $('q-list');
      if (listEl) listEl.innerHTML = list.map(qCard).join('');
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
        progress = {};
        renderProgress();
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
          chip(q.topic) + chip(statusOf(q.id));
      }
      if (front) front.textContent = str(q.q);
      if (back) back.innerHTML = oralBlock(q) + deepBlock(q) + expectedBlock(q);
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
    var renderQuiz = function () {
      var list = $('quiz-list');
      if (list) {
        list.innerHTML = QUIZSET.map(function (q, i) {
          q = obj(q) || {};
          var opts = arr(q.options).map(function (o, j) {
            return '<label class="opt"><input type="radio" name="qz-' + esc(str(q.id)) + '" value="' + j + '">' +
              esc(str(o)) + '</label>';
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
          if (labels[q.answer]) labels[q.answer].classList.add('correct');
          if (chosen != null && chosen !== q.answer && labels[chosen]) labels[chosen].classList.add('wrong');
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
      var q = mockState.qs[mockState.i];
      var qEl = $('mock-question');
      var aEl = $('mock-answer');
      var next = $('mock-next');
      if (qEl) qEl.textContent = (mockState.i + 1) + '. ' + str(q && q.q);
      if (aEl) {
        aEl.innerHTML = q
          ? '<div class="block">' + lbl('Gợi ý đáp án — trả lời miệng trước khi đọc') +
            '<p class="oral">' + esc(str(q.oral)) + '</p></div>'
          : '';
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
      body.innerHTML = when(ck, '<div class="note">Ngày kiểm tra toàn bộ liên kết: ' + esc(ck) + '.</div>') +
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
        return '<tr><td><strong>' + esc(str(i.title || g)) + '</strong></td><td>' + esc(str(i.why)) +
          '</td><td>' + arr(i.p0).length + '</td><td>' + total + '</td></tr>';
      }).join('');
      body.innerHTML =
        '<h3 class="sub">Cách dùng</h3>' +
        '<ul class="tight">' +
        '<li><strong>Một lượt ôn = một vòng.</strong> Lọc theo nhóm, trả lời miệng trước khi mở đáp án, xong mới đọc phần giải thích sâu.</li>' +
        '<li>Mỗi câu có bốn phần: trả lời miệng 30–60 giây, giải thích sâu, ví dụ code (kèm kết quả đúng và nguyên nhân) và chuỗi hỏi đào sâu 3 tầng.</li>' +
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

    // ---- learning path (lessons) ----
    // BFS over buildsOn parent edges from every lesson back to the L01 anchor.
    // Computed ONCE per renderLearn pass (id -> ordered path of ids), never per card.
    var buildChainMap = function () {
      var map = {};
      LESSONSARR.forEach(function (raw) {
        var l = obj(raw);
        if (!l || !l.id) return;
        var id = str(l.id);
        var queue = [[id]];
        var seen = {};
        seen[id] = true;
        while (queue.length) {
          var path = queue.shift();
          var last = path[path.length - 1];
          if (last === 'L01') { map[id] = path; return; }
          var node = obj(LESSON_BY_ID[last]);
          arr(node && node.buildsOn).forEach(function (dep) {
            var d = str(dep);
            if (seen[d] || !obj(LESSON_BY_ID[d])) return;
            seen[d] = true;
            queue.push(path.concat([d]));
          });
        }
        // no path found — leave undefined; never invent edges
      });
      return map;
    };

    var lessonCard = function (l, idx, chainMap) {
      l = obj(l) || {};
      chainMap = obj(chainMap) || {};
      if (typeof idx !== 'number' || idx < 0) {
        idx = 0;
        for (var k = 0; k < LESSONSARR.length; k++) {
          var cand = obj(LESSONSARR[k]);
          if (cand && cand.id === l.id) { idx = k; break; }
        }
      }
      var total = LESSONSARR.length || 22;
      var say = arr(l.sayIt).map(function (s) { return '<li>' + esc(str(s)) + '</li>'; }).join('');
      var qbtns = arr(l.qids).map(function (id) {
        var q = obj(Q_BY_ID[str(id)]);
        return '<button type="button" class="btn" data-qid="' + esc(str(id)) + '">' + esc(str(id)) +
          (q ? ' · ' + esc(str(q.topic)) : '') + '</button>';
      }).join(' ');
      var refs = arr(l.refs).map(str).join(' · ');
      var bridgeHead = idx === 0 ? 'Bắt đầu từ đây' : 'Nối tiếp bài trước';
      var builds = arr(l.buildsOn).map(function (id) {
        var t = obj(LESSON_BY_ID[str(id)]);
        var label = t ? shortLessonTitle(t.title) : '';
        return '<button type="button" class="lesson-link" data-lesson="' + esc(str(id)) + '">' + esc(str(id)) +
          (label ? ' · ' + esc(label) : '') + '</button>';
      }).join(' ');
      var prev = LESSONSARR[idx - 1] ? obj(LESSONSARR[idx - 1]) : null;
      var next = LESSONSARR[idx + 1] ? obj(LESSONSARR[idx + 1]) : null;
      var navBtns = (prev && prev.id
        ? '<button type="button" class="btn lesson-link" data-lesson="' + esc(str(prev.id)) + '">← Bài trước: ' + esc(str(prev.id)) + '</button>'
        : '') +
        (next && next.id
        ? '<button type="button" class="btn lesson-link" data-lesson="' + esc(str(next.id)) + '">Bài sau: ' + esc(str(next.id)) + ' →</button>'
        : '');
      var node = str(l.spineNode);
      var isAll = node === 'all';
      var pathItems = LESSON_NODES.map(function (n) {
        var on = isAll || node === n[0];
        return '<li class="spine-node' + (on ? ' is-on' : '') + '"' + (on ? ' aria-current="true"' : '') + '>' +
          esc(n[1]) + (on ? '<span class="sr-only"> (bài này)</span>' : '') + '</li>';
      }).join('');
      var chain = chainMap[str(l.id)];
      var chainHtml = (str(l.id) !== 'L01' && arr(chain).length)
        ? '<div class="spine-chain"><span class="lb-h">Đường về L01</span>' +
          arr(chain).map(function (cid) {
            return '<button type="button" class="lesson-link" data-lesson="' + esc(str(cid)) + '">' + esc(str(cid)) + '</button>';
          }).join('<span class="chain-sep">→</span>') + '</div>'
        : '';
      var spineHtml = '<div class="lesson-spine"><div class="lb-h">Sợi chỉ từ L01</div>' +
        '<ol class="spine-path">' + pathItems + '</ol>' +
        when(l.spine, '<p class="spine-say">' + esc(str(l.spine)) + '</p>') +
        chainHtml + '</div>';
      return '<article class="lesson" id="lesson-' + esc(str(l.id)) + '" data-lesson="' + esc(str(l.id)) + '">' +
        '<div class="lesson-head"><span class="lesson-idx">Bài ' + (idx + 1) + '/' + total + '</span>' +
        '<span class="lesson-id">' + esc(str(l.id)) + '</span></div>' +
        when(l.bridge, '<p class="lesson-bridge"><span class="lb-h">' + bridgeHead + '</span>' + esc(str(l.bridge)) + '</p>') +
        spineHtml +
        '<h4 class="lesson-h">' + esc(str(l.title)) + '</h4>' +
        '<p class="lesson-goal">' + esc(str(l.goal)) + '</p>' +
        '<div class="deep">' + sanitize(l.body) + '</div>' +
        when(l.code, '<pre><code>' + esc(str(l.code)) + '</code></pre>') +
        when(l.codeNote, '<p class="small">' + esc(str(l.codeNote)) + '</p>') +
        flowFigure(l.flow) +
        when(say, '<div class="sayit"><div class="sc-h">Bạn phải nói được</div><ul class="tight">' + say + '</ul></div>') +
        when(builds, '<div class="lesson-builds"><span class="lb-h">Dùng lại</span>' + builds + '</div>') +
        when(qbtns, '<p class="lesson-qids">Luyện ngay: ' + qbtns + '</p>') +
        when(refs, '<span class="status-note">Nguồn: ' + esc(refs) + '</span>') +
        when(navBtns, '<div class="lesson-nav">' + navBtns + '</div>') +
        '</article>';
    };

    var renderLearn = function () {
      var body = $('learn-body');
      if (!body) return;
      if (!LESSONSARR.length) {
        body.innerHTML = '<p class="stat-line">Chưa có bài học.</p>';
        return;
      }
      var pos = {};
      LESSONSARR.forEach(function (raw, i) {
        var ll = obj(raw);
        if (ll && ll.id) pos[str(ll.id)] = i;
      });
      var byStage = {};
      LESSONSARR.forEach(function (raw) {
        var l = obj(raw) || {};
        var n = Number(l.stage) || 0;
        if (!byStage[n]) byStage[n] = { n: n, title: str(l.stageTitle), intro: str(l.stageIntro), items: [] };
        byStage[n].items.push(l);
      });
      var order = Object.keys(byStage).map(Number).sort(function (a, b) { return a - b; });
      var chains = buildChainMap();
      // Most frequent spineNode among a stage's lessons; ties -> first in LESSON_NODES order; 'all' ignored.
      var dominantNode = function (items) {
        var counts = {};
        items.forEach(function (l) {
          var n = str(l.spineNode);
          if (!n || n === 'all') return;
          counts[n] = (counts[n] || 0) + 1;
        });
        var best = '';
        var bestN = 0;
        LESSON_NODES.forEach(function (nd) {
          var c = counts[nd[0]] || 0;
          if (c > bestN) { bestN = c; best = nd[1]; }
        });
        return best;
      };
      // Whole-path attention map: one row per backbone node, origin first. Single pass
      // over LESSONSARR into per-node id lists; buttons reuse the delegated handler.
      var byNode = {};
      LESSON_NODES.forEach(function (nd) { byNode[nd[0]] = []; });
      var originIds = [];
      LESSONSARR.forEach(function (raw) {
        var l = obj(raw) || {};
        var id = str(l.id);
        if (!id) return;
        var n = str(l.spineNode);
        if (n === 'all') { originIds.push(id); return; }
        if (byNode[n]) byNode[n].push(id);
      });
      var mapBtn = function (id) {
        return '<button type="button" class="lesson-link" data-lesson="' + esc(id) + '">' + esc(id) + '</button>';
      };
      var spineMap = '<div class="spine-map"><div class="lb-h">Bản đồ sợi chỉ L01</div>' +
        '<p class="spine-map-note">Bài 1 dựng cả đường đi một request; hai mươi mốt bài sau mỗi bài bám vào đúng một khớp của đường đó, và mọi bài đều có đường quay về L01. Bấm một mã để nhảy tới bài.</p>' +
        '<ol class="spine-map-list">' +
        '<li class="sm-row sm-origin"><span class="sm-node">L01 · cả đường đi</span><span class="sm-links">' +
        originIds.map(mapBtn).join('') + '</span><span class="sm-count">' + originIds.length + ' bài</span></li>' +
        LESSON_NODES.map(function (nd) {
          var ids = arr(byNode[nd[0]]);
          return '<li class="sm-row"><span class="sm-node">' + esc(nd[1]) + '</span><span class="sm-links">' +
            ids.map(mapBtn).join('') +
            when(!ids.length, '<span class="sm-none">chưa có bài</span>') +
            '</span><span class="sm-count">' + ids.length + ' bài</span></li>';
        }).join('') + '</ol></div>';
      var thread = '<div class="lesson-thread"><div class="lb-h">Đường dây ' + LESSONSARR.length + ' bài</div>' +
        order.map(function (n) {
          var st = byStage[n];
          var dom = dominantNode(st.items);
          return '<div class="thread-stage"><span class="thread-stage-t">Chặng ' + esc(str(st.n)) + '</span>' +
            st.items.map(function (l) {
              return '<button type="button" class="lesson-link" data-lesson="' + esc(str(l.id)) + '">' + esc(str(l.id)) + '</button>';
            }).join('') +
            when(dom, '<span class="thread-stage-n">' + esc(dom) + '</span>') + '</div>';
        }).join('') + '</div>';
      body.innerHTML = spineMap + thread + order.map(function (n) {
        var st = byStage[n];
        // lesson data may already open the title with "Chặng N — "; number shows once
        var title = st.title.replace(/^\s*Chặng\s*\d+\s*[—–:.\-]?\s*/i, '');
        return '<h3 class="sub learn-stage">Chặng ' + esc(st.n + '. ' + title) + '</h3>' +
          when(st.intro, '<div class="deep">' + sanitize(st.intro) + '</div>') +
          st.items.map(function (l) { return lessonCard(l, pos[str(l.id)], chains); }).join('');
      }).join('');
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
    };

    var wireLearn = function () {
      on($('learn-body'), 'click', function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        var qbtn = t.closest('[data-qid]');
        if (qbtn) { jumpToQuestion(qbtn.getAttribute('data-qid')); return; }
        var lbtn = t.closest('button[data-lesson]');
        if (lbtn) jumpToLesson(lbtn.getAttribute('data-lesson'));
      });
    };

    // ---- theme, sidebar, print ----
    var applyTheme = function (t) {
      doc.documentElement.setAttribute('data-theme', t);
      var btn = $('theme-btn');
      if (btn) {
        btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
        btn.textContent = t === 'dark' ? '☀️ Chế độ sáng' : '🌙 Chế độ tối';
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
    };

    var renderCounts = function () {
      var counts = {
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

    var init = function () {
      navBtns = doc.querySelectorAll('#nav-list [data-view]');
      for (var i = 0; i < navBtns.length; i++) {
        (function (btn) {
          on(btn, 'click', function () { showView(btn.getAttribute('data-view')); });
        })(navBtns[i]);
      }
      wireChrome();
      wireQuestions();
      wireProgress();
      wireFlash();
      wireQuiz();
      wireMock();
      wireLearn();
      renderCounts();
      renderLearn();
      renderIntro();
      renderPlans();
      renderCase();
      renderSources();
      renderQuestions();
      renderProgress();
      renderFlash(0);
      renderQuiz();
      showView(str(window.location && window.location.hash).replace(/^#/, '') || 'learn');
    };

    init();
  })();
}
