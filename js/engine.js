/*!
 * engine.js — Bộ máy hỏi–đáp + "AI mô phỏng" (mock) cho Chatbot FAQ (Đề 4 · VIBE-CODING 2026)
 *
 * Bản demo vòng loại - Dữ liệu mô phỏng AI:
 *  - Câu trả lời LẤY TỪ bộ kiến thức (data.js) bằng so khớp từ khóa; bot KHÔNG tự bịa thông tin mới.
 *  - "AI diễn đạt lại" là MOCK theo quy tắc: chọn mẫu câu tự nhiên soạn sẵn cho từng FAQ (xoay vòng khi hỏi lại),
 *    thêm câu mở/kết, cá nhân hóa theo ngữ cảnh khách nhắc tới (shop / công ty / blog).
 *  - Gợi ý đúng 3 câu hỏi liên quan sau mỗi lượt: related → cùng nhóm → phổ biến (ưu tiên câu chưa hỏi).
 *  - Điểm khớp thấp hơn ngưỡng (hoặc có tín hiệu ngoài phạm vi) → không trả lời, chủ động mời đặt lịch.
 *
 * Thuần logic, không dùng DOM → chạy được trên trình duyệt và trong Node (tests/run-tests.js).
 */
(function (root) {
  'use strict';
  var VC = (root.VC = root.VC || {});

  var ANSWER_THRESHOLD = 2.0; // điểm tối thiểu để trả lời
  var STRONG_THRESHOLD = 3.0; // điểm tối thiểu khi câu hỏi có tín hiệu ngoài phạm vi
  var MAX_LEN = 300;          // độ dài tối đa một tin nhắn

  function toSet(arr) {
    var s = {};
    arr.forEach(function (x) { if (x) s[x] = true; });
    return { has: function (k) { return s[k] === true; } };
  }

  // Từ dừng (đã bỏ dấu): không dùng để chấm điểm từ đơn / sửa chính tả. Cụm từ vẫn được so khớp nguyên cụm.
  var STOPWORDS = toSet((
    'a ah ad ak ban minh toi tui em anh chi oi nhe nha nhi vay the thi la gi co khong ko k kg hong duoc dc cho cua voi va ' +
    'hay hoac ma nao sao nhu de can muon hoi xin vui long giup dum gium lam biet khi neu o tai ve tu den tren duoi trong ngoai ' +
    'nay do kia day nhung cac mot nen phai se da dang roi chua van con cung rat qua lai ra vao len xuong bi boi vi ha ne u uh ' +
    'ok okay vang'
  ).split(' '));

  // Chỉ sửa lỗi gõ (khoảng cách 1 ký tự) về các từ kỹ thuật này — tránh "sửa nhầm" từ tiếng Việt.
  var FUZZY_TARGETS = [
    'domain', 'hosting', 'nameserver', 'server', 'backup', 'restore', 'transfer', 'migrate', 'gmail', 'outlook', 'webmail',
    'email', 'encrypt', 'letsencrypt', 'https', 'propagation', 'record', 'refund', 'website', 'momo', 'zalopay', 'vnpay'
  ];

  var TARGETS = [
    { keys: ['shop', 'cua hang', 'ban hang', 'ban online', 'thoi trang', 'my pham', 'quan ao', 'tiem', 'store'], text: 'shop của bạn' },
    { keys: ['cong ty', 'doanh nghiep', 'van phong', 'startup'], text: 'website doanh nghiệp của bạn' },
    { keys: ['blog', 'ca nhan', 'portfolio'], text: 'trang cá nhân của bạn' }
  ];
  var DEFAULT_TARGET = 'website của bạn';

  var OPENERS = ['Dạ, mình trả lời ngay nhé!', 'Câu hỏi rất hay ạ.', 'Mình giải thích ngắn gọn thế này:', 'Vâng, bạn tham khảo nhé:'];
  var REPEAT_OPENER = 'Mình nói lại theo cách khác cho dễ hình dung nhé:';
  var CLOSERS = [
    'Bạn muốn tìm hiểu thêm phần nào? Chọn một gợi ý bên dưới nhé.',
    'Nếu cần tư vấn kỹ cho trường hợp riêng của bạn, cứ bấm “Đặt lịch tư vấn” nha.',
    'Còn thắc mắc gì, bạn cứ hỏi tiếp mình nhé!'
  ];

  /* ---------------- Chuẩn hóa tiếng Việt ---------------- */
  function normalize(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh, dấu mũ, móc...
      .replace(/đ/g, 'd')          // "đ" không tách được bằng NFD
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
  function tokenize(text) {
    var n = normalize(text);
    return n ? n.split(' ') : [];
  }

  /* Khoảng cách Damerau–Levenshtein (bản OSA) — chỉ cần biết có ≤ 1 hay không */
  function osa(a, b) {
    var m = a.length, n = b.length, i, j;
    if (Math.abs(m - n) > 1) return 2;
    var d = [];
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[m][n];
  }

  function containsPhrase(tokens, phraseTokens) {
    var n = phraseTokens.length;
    for (var i = 0; i + n <= tokens.length; i++) {
      var ok = true;
      for (var j = 0; j < n; j++) { if (tokens[i + j] !== phraseTokens[j]) { ok = false; break; } }
      if (ok) return true;
    }
    return false;
  }
  function hasAnyPhrase(tokens, phrases) {
    for (var i = 0; i < phrases.length; i++) {
      if (containsPhrase(tokens, tokenize(phrases[i]))) return true;
    }
    return false;
  }

  /* ---------------- Chỉ mục từ khóa ---------------- */
  var INDEX = null;
  function buildIndex() {
    var faqs = VC.FAQ || [];
    var generic = toSet((VC.GENERIC || []).map(normalize));
    var df = {};
    var vocab = {};
    var byId = {};
    var entries = faqs.map(function (f) {
      byId[f.id] = f;
      var seen = {};
      var kws = [];
      (f.keywords || []).forEach(function (k) {
        var n = normalize(k);
        if (!n || seen[n]) return;
        seen[n] = true;
        var toks = n.split(' ');
        kws.push({ text: n, tokens: toks, generic: generic.has(n) });
        toks.forEach(function (t) { vocab[t] = true; });
      });
      kws.forEach(function (k) { if (k.tokens.length === 1) df[k.text] = (df[k.text] || 0) + 1; });
      kws.sort(function (a, b) { return b.tokens.length - a.tokens.length; }); // cụm dài xét trước
      return { faq: f, kws: kws };
    });
    INDEX = { entries: entries, df: df, vocab: toSet(Object.keys(vocab)), byId: byId, count: faqs.length };
    return INDEX;
  }
  function index() { return INDEX || buildIndex(); }

  function weightOf(kw) {
    if (kw.generic) return 0.6;
    var n = kw.tokens.length;
    if (n >= 2) return Math.min(3.5, 2 + 0.5 * (n - 2));
    var d = index().df[kw.text] || 1;
    return d === 1 ? 2.0 : d === 2 ? 1.5 : 1.0;
  }

  function correctTokens(tokens) {
    var idx = index();
    var corrections = [];
    var out = tokens.map(function (t) {
      if (t.length < 4 || idx.vocab.has(t) || STOPWORDS.has(t) || /^\d+$/.test(t)) return t;
      for (var i = 0; i < FUZZY_TARGETS.length; i++) {
        var v = FUZZY_TARGETS[i];
        if (v.charAt(0) !== t.charAt(0) || Math.abs(v.length - t.length) > 1) continue;
        if (osa(t, v) <= 1) { corrections.push(t + '→' + v); return v; }
      }
      return t;
    });
    return { tokens: out, corrections: corrections };
  }

  /* Phân tích câu hỏi: chấm điểm từng FAQ, phát hiện tín hiệu ngoài phạm vi */
  function analyze(text) {
    var idx = index();
    var normalized = normalize(text);
    var cor = correctTokens(normalized ? normalized.split(' ') : []);
    var tokens = cor.tokens;
    var ranked = idx.entries.map(function (e) {
      var covered = [];
      var score = 0;
      var hits = [];
      e.kws.forEach(function (kw) {
        var n = kw.tokens.length;
        if (n === 1 && STOPWORDS.has(kw.text)) return;
        for (var i = 0; i + n <= tokens.length; i++) {
          var j, ok = true;
          for (j = 0; j < n; j++) { if (tokens[i + j] !== kw.tokens[j]) { ok = false; break; } }
          if (!ok) continue;
          var fresh = false;
          for (j = 0; j < n; j++) { if (!covered[i + j]) { fresh = true; break; } }
          if (!fresh) continue; // đã nằm trong một cụm dài hơn → không cộng trùng
          for (j = 0; j < n; j++) { covered[i + j] = true; }
          score += weightOf(kw);
          hits.push(kw.text);
          break; // mỗi từ khóa chỉ tính một lần
        }
      });
      return { faq: e.faq, score: Math.round(score * 100) / 100, hits: hits };
    });
    ranked.sort(function (a, b) { return b.score - a.score; }); // sort ổn định: hòa điểm giữ thứ tự FAQ
    var oos = (VC.OUT_OF_SCOPE || []).filter(function (p) { return containsPhrase(tokens, tokenize(p)); });
    var top = ranked[0] || null;
    var threshold = oos.length ? STRONG_THRESHOLD : ANSWER_THRESHOLD;
    return {
      normalized: normalized,
      tokens: tokens,
      corrections: cor.corrections,
      ranked: ranked,
      top: top,
      best: top && top.score >= threshold ? top : null,
      oos: oos,
      threshold: threshold
    };
  }

  function detectTarget(tokens) {
    for (var i = 0; i < TARGETS.length; i++) {
      if (hasAnyPhrase(tokens, TARGETS[i].keys)) return TARGETS[i].text;
    }
    return null;
  }

  function isGreeting(tokens) {
    if (!tokens.length || tokens.length > 6) return false;
    var g = (VC.INTENTS && VC.INTENTS.greeting) || [];
    for (var i = 0; i < g.length; i++) {
      var p = tokenize(g[i]);
      var ok = p.length <= tokens.length;
      for (var j = 0; ok && j < p.length; j++) { if (tokens[j] !== p[j]) ok = false; }
      if (ok) return true;
    }
    return false;
  }

  /* ---------------- Bot (giữ ngữ cảnh một cuộc trò chuyện) ---------------- */
  function createBot() {
    var state;
    function reset() {
      state = { turn: 0, asked: {}, counts: {}, target: null, fallbackStreak: 0 };
    }
    reset();

    function fill(s) {
      var brand = (VC.BRAND && VC.BRAND.name) || 'VibeHost';
      var bot = (VC.BRAND && VC.BRAND.botName) || 'Trợ lý';
      return String(s)
        .replace(/\{brand\}/g, brand)
        .replace(/\{bot\}/g, bot)
        .replace(/\{target\}/g, state.target || DEFAULT_TARGET);
    }

    function suggestFor(currentId, ranked) {
      var idx = index();
      var out = [];
      function add(id) {
        if (!id || id === currentId || out.length >= 3 || out.indexOf(id) > -1 || !idx.byId[id]) return;
        out.push(id);
      }
      var cur = currentId ? idx.byId[currentId] : null;
      (ranked || []).forEach(add);
      if (cur) cur.related.forEach(function (id) { if (!state.asked[id]) add(id); });
      if (cur) (VC.FAQ || []).forEach(function (f) { if (f.category === cur.category && !state.asked[f.id]) add(f.id); });
      (VC.POPULAR || []).forEach(function (id) { if (!state.asked[id]) add(id); });
      if (cur) cur.related.forEach(add);
      (VC.POPULAR || []).forEach(add);
      return out.map(function (id) { return { id: id, text: idx.byId[id].chip || idx.byId[id].question }; });
    }

    function answerFaq(faq, info, matchedBy) {
      var count = state.counts[faq.id] || 0;
      var variant = faq.natural[count % faq.natural.length];
      var opener = count > 0 ? REPEAT_OPENER : OPENERS[state.turn % OPENERS.length];
      var closer = CLOSERS[state.turn % CLOSERS.length];
      state.counts[faq.id] = count + 1;
      state.asked[faq.id] = true;
      state.fallbackStreak = 0;
      return {
        type: 'answer',
        mock: true,
        faqId: faq.id,
        faqNo: faq.no,
        category: faq.category,
        question: faq.question,
        paragraphs: [fill(opener), fill(variant)],
        bullets: faq.points.map(fill),
        closing: fill(closer),
        original: fill(faq.answer),
        variant: (count % faq.natural.length) + 1,
        matchedBy: matchedBy,
        score: info ? info.score : null,
        hits: info ? info.hits : [],
        corrections: info ? info.corrections : [],
        actions: faq.cta ? [{ type: 'booking', label: 'Đặt lịch tư vấn', note: 'Cần tư vấn: ' + faq.question, source: 'chat-cta' }] : [],
        suggestions: suggestFor(faq.id)
      };
    }

    function fallback(text, info) {
      state.fallbackStreak += 1;
      var hasTokens = info.tokens.length > 0;
      var partial = hasTokens && !info.oos.length && info.top && info.top.score > 0;
      var reason = !hasTokens ? 'empty' : partial ? 'partial' : info.oos.length ? 'out-of-scope' : 'no-match';
      var paragraphs;
      if (!hasTokens) {
        paragraphs = ['Mình chưa hiểu tin nhắn này 😅', 'Bạn thử hỏi về tên miền, hosting, SSL, email… hoặc **đặt lịch tư vấn** để gặp nhân viên nhé.'];
      } else if (partial) {
        paragraphs = [
          'Mình chưa tìm thấy câu trả lời thật chắc chắn cho câu này trong bộ kiến thức, nên không muốn trả lời đoán mò.',
          'Có phải bạn muốn hỏi một trong các câu bên dưới? Nếu không, bạn **đặt lịch tư vấn** để nhân viên {brand} gọi lại hỗ trợ trực tiếp nhé.'
        ];
      } else {
        paragraphs = [
          'Xin lỗi, câu hỏi này nằm ngoài bộ kiến thức của mình nên mình chưa trả lời chính xác được.',
          'Bạn **đặt lịch tư vấn** nhé — nhân viên {brand} sẽ gọi lại hỗ trợ trực tiếp cho bạn!'
        ];
      }
      if (state.fallbackStreak >= 2) paragraphs.unshift('Có vẻ câu hỏi của bạn cần chuyên viên hỗ trợ.');
      var ranked = info.ranked.filter(function (r) { return r.score > 0; }).map(function (r) { return r.faq.id; });
      return {
        type: 'fallback',
        reason: reason,
        paragraphs: paragraphs.map(fill),
        actions: [{
          type: 'booking',
          label: state.fallbackStreak >= 2 ? 'Đặt lịch ngay – nhân viên gọi lại' : 'Đặt lịch tư vấn',
          note: String(text).slice(0, 200),
          source: 'chat-fallback'
        }],
        suggestions: suggestFor(null, ranked),
        top: info.top ? { id: info.top.faq.id, score: info.top.score } : null,
        oos: info.oos
      };
    }

    function intentReply(name) {
      var B = VC.BRAND || {};
      var base = { type: 'intent', intent: name, suggestions: suggestFor(null) };
      var p;
      switch (name) {
        case 'booking':
          base.paragraphs = [fill('Được ạ! Mình mở form đặt lịch để bạn chọn ngày giờ nhé. Nhân viên {brand} sẽ gọi lại đúng giờ hẹn.')];
          base.autoBooking = true;
          base.actions = [{ type: 'booking', label: 'Mở form đặt lịch', note: '', source: 'chat-intent' }];
          return base;
        case 'hours':
          base.paragraphs = [fill('Nhân viên tư vấn của {brand} làm việc ' + (B.hoursText || '') + ' Còn mình — trợ lý ảo — trả lời 24/7.'),
            'Bạn muốn đặt lịch để nhân viên gọi lại đúng giờ không?'];
          base.actions = [{ type: 'booking', label: 'Đặt lịch tư vấn', note: '', source: 'chat-intent' }];
          return base;
        case 'about':
          base.paragraphs = [fill('Mình là **{bot}** — trợ lý ảo trong bản demo vòng loại. Mình trả lời 10 câu hỏi thường gặp từ bộ kiến thức mẫu; ' +
            'phần diễn đạt là **AI mô phỏng** (không gọi AI thật). Câu nào ngoài phạm vi, mình sẽ mời bạn đặt lịch với nhân viên.')];
          return base;
        case 'list':
          base.type = 'menu';
          base.paragraphs = ['Đây là **10 câu hỏi** mình trả lời được (bộ kiến thức mẫu). Bạn chọn một câu nhé:'];
          base.menu = (VC.FAQ || []).map(function (f) { return { id: f.id, text: f.no + '. ' + f.question }; });
          base.suggestions = [];
          return base;
        case 'thanks':
          base.paragraphs = ['Rất vui được hỗ trợ bạn! Cần gì thêm bạn cứ hỏi, hoặc đặt lịch để nhân viên tư vấn kỹ hơn nhé.'];
          return base;
        case 'bye':
          base.paragraphs = [fill('Cảm ơn bạn đã ghé {brand}! Chúc bạn một ngày thật nhiều đơn hàng. Khi cần, mình luôn ở đây 24/7 nhé.')];
          return base;
        default: // greeting
          p = 'Chào bạn 👋 Mình là **{bot}**. Bạn cần hỏi gì về tên miền, hosting, SSL hay email theo tên miền? Chọn nhanh một câu bên dưới cũng được nhé.';
          base.paragraphs = [fill(p)];
          base.intent = 'greeting';
          return base;
      }
    }

    function reply(rawText, opts) {
      opts = opts || {};
      var text = String(rawText == null ? '' : rawText).replace(/\s+/g, ' ').trim();
      if (!text) return null; // giao diện không gửi tin rỗng
      var truncated = false;
      if (text.length > MAX_LEN) { text = text.slice(0, MAX_LEN); truncated = true; }
      var tokens = tokenize(text);
      var target = detectTarget(tokens);
      if (target) state.target = target;

      var res;
      var idx = index();
      if (opts.faqId && idx.byId[opts.faqId]) {
        res = answerFaq(idx.byId[opts.faqId], null, 'chip');
      } else {
        var info = analyze(text);
        var I = VC.INTENTS || {};
        if (hasAnyPhrase(info.tokens, I.booking || [])) {
          state.fallbackStreak = 0;
          res = intentReply('booking');
        } else if (info.best) {
          res = answerFaq(info.best.faq, { score: info.best.score, hits: info.best.hits, corrections: info.corrections }, 'keywords');
        } else if (hasAnyPhrase(info.tokens, I.hours || [])) {
          res = intentReply('hours');
        } else if (hasAnyPhrase(info.tokens, I.list || [])) {
          res = intentReply('list');
        } else if (hasAnyPhrase(info.tokens, I.about || [])) {
          res = intentReply('about');
        } else if (hasAnyPhrase(info.tokens, I.thanks || [])) {
          res = intentReply('thanks');
        } else if (hasAnyPhrase(info.tokens, I.bye || [])) {
          res = intentReply('bye');
        } else if (isGreeting(info.tokens)) {
          res = intentReply('greeting');
        } else {
          res = fallback(text, info);
        }
        res.analysis = { score: info.top ? info.top.score : 0, threshold: info.threshold, oos: info.oos, corrections: info.corrections };
      }
      if (res.type !== 'fallback') state.fallbackStreak = 0;
      state.turn += 1;
      res.query = text;
      res.truncated = truncated;
      return res;
    }

    function welcome() {
      return {
        type: 'welcome',
        paragraphs: [
          fill('Xin chào 👋 Mình là **{bot}** — trợ lý tư vấn tự động 24/7 của {brand}.'),
          'Mình trả lời ngay **10 câu hỏi thường gặp** về tên miền, hosting, SSL, email, thanh toán… Câu nào ngoài phạm vi, mình sẽ giúp bạn **đặt lịch** để nhân viên gọi lại tư vấn trực tiếp.'
        ],
        suggestions: suggestFor(null),
        showMenuLink: true
      };
    }

    function systemMessage(paragraphs) {
      return { type: 'system', paragraphs: paragraphs.map(fill), suggestions: suggestFor(null) };
    }

    return {
      reply: reply,
      welcome: welcome,
      reset: reset,
      suggestFor: suggestFor,
      systemMessage: systemMessage,
      getState: function () { return state; }
    };
  }

  VC.normalize = normalize;
  VC.engine = {
    normalize: normalize,
    tokenize: tokenize,
    analyze: analyze,
    osa: osa,
    createBot: createBot,
    rebuildIndex: buildIndex,
    ANSWER_THRESHOLD: ANSWER_THRESHOLD,
    STRONG_THRESHOLD: STRONG_THRESHOLD,
    MAX_LEN: MAX_LEN
  };
  VC.createBot = createBot;
})(typeof window !== 'undefined' ? window : globalThis);
