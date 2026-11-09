/*!
 * app.js — Giao diện v2: lịch sử trò chuyện (trái) · khung chat (giữa) · câu hỏi thường gặp / đặt lịch (phải) · quản trị · demo tự động
 * Đề 4 · VIBE-CODING 2026 · Bản demo vòng loại - Dữ liệu mô phỏng AI
 *
 * An toàn: mọi nội dung do người dùng nhập (kể cả dữ liệu đọc lại từ localStorage) chỉ được đưa vào trang
 * bằng textContent / setAttribute, hoặc qua md() đã escape HTML trước → chống chèn mã HTML/JS.
 */
(function () {
  'use strict';
  var VC = window.VC;
  var B = VC.booking;
  var BRAND = VC.BRAND;
  var TYPING_MS = 650;               // hiệu ứng "đang soạn" cho giống trải nghiệm chat
  var CONV_KEY = 'vibe4.convos.v1';  // lịch sử trò chuyện (localStorage, chỉ trên trình duyệt này)
  var UI_KEY = 'vibe4.ui.v1';        // ghi nhớ bảng phải đang mở hay đóng
  var MAX_CONVOS = 20;
  var MAX_MSGS = 60;

  /* ---------------- Tiện ích ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v; // CHỈ dùng cho chuỗi tin cậy: icon tĩnh hoặc kết quả md() đã escape
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function md(s) { // **đậm**, *nghiêng* — escape trước rồi mới định dạng
    return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  }
  function fill(s) { return String(s || '').replace(/\{brand\}/g, BRAND.name).replace(/\{bot\}/g, BRAND.botName); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function timeNow() { return B.fromMin(B.vnNow().minutes); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function mq(q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: function () {} }; }
  var finePointer = mq('(pointer: fine)').matches;
  var reduceMotion = mq('(prefers-reduced-motion: reduce)').matches;
  var mqWide = mq('(min-width: 1280px)');   // đủ chỗ cho 3 cột
  var mqPhone = mq('(max-width: 899px)');   // lịch sử thành ngăn kéo, bảng phải thành tấm trượt từ dưới
  var SHORT_DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  /* ---------------- Icon nét (SVG tĩnh, tin cậy) ---------------- */
  var P = {
    chat: '<path d="M5 6.5A2 2 0 0 1 7 4.5h10a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2h-6l-4 3.5V16H7a2 2 0 0 1-2-2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    cal: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    chart: '<path d="M5 19V11M12 19V5M19 19v-6"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
    server: '<rect x="4" y="4.5" width="16" height="6" rx="1.5"/><rect x="4" y="13.5" width="16" height="6" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    card: '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7 14.5h3"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    spark: '<path d="M12 3.5l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7z"/>',
    panelR: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M14.5 4.5v15"/>',
    phone: '<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    book: '<path d="M5 5.5A2 2 0 0 1 7 3.5h12v15H7a2 2 0 0 0-2 2z"/><path d="M5 20.5V5.5M9 8h6"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.8 7 9 4-1.2 7-4.7 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>',
    undo: '<path d="M9 6 4.5 10.5 9 15"/><path d="M5 10.5h8.5a5.5 5.5 0 0 1 0 11H11"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'
  };
  function icon(name, size, sw) {
    var s = size || 18;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || '') + '</svg>';
  }
  var CAT_ICON = { 'Kiến thức cơ bản': 'book', 'Tên miền': 'globe', 'Hosting': 'server', 'Bảo mật': 'lock', 'Kỹ thuật': 'route', 'Email': 'mail', 'Chuyển đổi': 'route', 'Thanh toán': 'card' };
  function hydrateIcons(root) {
    $all('[data-icon]', root).forEach(function (n) {
      var name = n.getAttribute('data-icon');
      var size = n.getAttribute('data-size') || (n.closest('.round, .orbbtn') ? 22 : 17);
      n.outerHTML = icon(name, size);
    });
  }

  // Linh vật quả cầu: đôi mắt nhìn theo con trỏ, thỉnh thoảng chớp mắt (tắt khi người dùng chọn giảm chuyển động)
  var MASCOT_SVG = '<svg class="mascot" viewBox="0 0 240 240" aria-hidden="true" focusable="false">' +
    '<defs><radialGradient id="mz-core" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#3b5bff"/><stop offset=".55" stop-color="#1630b8"/><stop offset=".85" stop-color="#0a1250"/><stop offset="1" stop-color="#05082a"/></radialGradient>' +
    '<linearGradient id="mz-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe9ff"/><stop offset=".4" stop-color="#7c8cff"/><stop offset=".75" stop-color="#c26bff"/><stop offset="1" stop-color="#58e1ff"/></linearGradient>' +
    '<radialGradient id="mz-spec" cx="32%" cy="22%" r="30%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="mz-sw" x1="0" x2="1"><stop offset="0" stop-color="#58e1ff" stop-opacity="0"/><stop offset=".5" stop-color="#9fd7ff"/><stop offset="1" stop-color="#c26bff" stop-opacity="0"/></linearGradient>' +
    '<filter id="mz-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><filter id="mz-soft"><feGaussianBlur stdDeviation="2"/></filter>' +
    '<clipPath id="mz-c"><circle cx="120" cy="120" r="96"/></clipPath></defs>' +
    '<circle cx="120" cy="120" r="104" fill="none" stroke="url(#mz-rim)" stroke-width="10" opacity=".35" filter="url(#mz-glow)"/>' +
    '<circle cx="120" cy="120" r="96" fill="url(#mz-core)"/>' +
    '<g clip-path="url(#mz-c)"><path class="swirl" d="M10 150 C 60 110, 100 190, 150 140 S 220 120, 236 150" fill="none" stroke="url(#mz-sw)" stroke-width="16" opacity=".45" filter="url(#mz-glow)"/>' +
    '<path d="M20 70 C 70 40, 140 90, 230 40" fill="none" stroke="#c26bff" stroke-width="22" opacity=".25" filter="url(#mz-glow)"/><ellipse cx="88" cy="62" rx="62" ry="40" fill="url(#mz-spec)"/></g>' +
    '<circle cx="120" cy="120" r="96" fill="none" stroke="url(#mz-rim)" stroke-width="2.4"/>' +
    '<g class="eyes"><g class="lids"><g filter="url(#mz-soft)" opacity=".9"><rect x="88" y="98" width="20" height="40" rx="10" fill="#cfe8ff"/><rect x="132" y="98" width="20" height="40" rx="10" fill="#cfe8ff"/></g>' +
    '<rect x="90" y="100" width="16" height="36" rx="8" fill="#fff"/><rect x="134" y="100" width="16" height="36" rx="8" fill="#fff"/></g></g></svg>';

  var dom = {};
  var bot = VC.createBot();
  var busy = false;
  var history = []; // tin nhắn của cuộc trò chuyện đang mở: { r: 'u', t, at } | { r: 'b', res, at }

  /* ---------------- Lưu nhiều cuộc trò chuyện (localStorage) ---------------- */
  var convos = [];   // đã lưu, mới nhất trước
  var current = null; // cuộc đang mở { id, title, createdAt, updatedAt, booked }
  var RES_FIELDS = ['type', 'faqId', 'faqNo', 'category', 'question', 'lead', 'focus', 'paragraphs', 'bullets', 'original', 'variant', 'matchedBy',
    'score', 'hits', 'corrections', 'actions', 'suggestions', 'menu', 'receipt', 'reason', 'intent'];
  function slimRes(res) { // chỉ giữ phần cần để vẽ lại tin nhắn → tiết kiệm dung lượng lưu trữ
    var out = {};
    RES_FIELDS.forEach(function (k) { if (res[k] !== undefined && res[k] !== null) out[k] = res[k]; });
    return out;
  }
  function newId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function newConvo() { var t = Date.now(); return { id: newId(), title: '', createdAt: t, updatedAt: t, booked: false, msgs: [], state: null }; }
  function titleOf(c) {
    if (c.title) return c.title;
    return c.booked ? 'Đặt lịch tư vấn' : 'Cuộc trò chuyện mới';
  }
  function loadConvos() {
    var raw = B.store.get(CONV_KEY);
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      if (!data || data.v !== 1 || !Array.isArray(data.items)) throw new Error('bad');
      return data.items.filter(function (c) {
        return c && typeof c.id === 'string' && Array.isArray(c.msgs) && c.msgs.length && typeof c.updatedAt === 'number';
      }).map(function (c) {
        c.title = typeof c.title === 'string' ? c.title.slice(0, 80) : '';
        c.booked = !!c.booked;
        return c;
      }).sort(function (a, b) { return b.updatedAt - a.updatedAt; }).slice(0, MAX_CONVOS);
    } catch (e) {
      B.store.remove(CONV_KEY);
      return [];
    }
  }
  function writeConvos() {
    var items = convos.slice(0, MAX_CONVOS);
    for (var tries = 0; tries < 4; tries++) {
      try { B.store.set(CONV_KEY, JSON.stringify({ v: 1, items: items })); return; } catch (e) {
        items = items.slice(0, Math.max(1, Math.floor(items.length / 2))); // đầy bộ nhớ → bỏ bớt cuộc cũ
      }
    }
  }
  function saveCurrent() {
    if (!current) return;
    current.msgs = history.slice(-MAX_MSGS);
    current.state = bot.getState();
    current.updatedAt = Date.now();
    if (!current.msgs.length) return; // cuộc trống thì chưa lưu vào lịch sử
    convos = convos.filter(function (c) { return c.id !== current.id; });
    convos.unshift(current);
    convos = convos.slice(0, MAX_CONVOS);
    writeConvos();
    renderHistory();
    renderConvTitle();
  }

  function renderConvTitle() {
    var t = current ? titleOf(current) : 'Cuộc trò chuyện mới';
    dom.convTitleText.textContent = t;
    dom.convTitle.title = t;
  }

  function dayLabel(ts, today) {
    var d = B.vnNow(new Date(ts)).date;
    if (d === today) return 'Hôm nay';
    if (d === B.addDays(today, -1)) return 'Hôm qua';
    return 'Trước đó';
  }
  function renderHistory() {
    var q = VC.normalize(dom.histSearch.value || '');
    var today = B.vnNow().date;
    var list = convos.filter(function (c) {
      if (!q) return true;
      var hay = titleOf(c) + ' ' + c.msgs.filter(function (m) { return m.r === 'u'; }).map(function (m) { return m.t; }).join(' ');
      return VC.normalize(hay).indexOf(q) > -1;
    });
    dom.histList.innerHTML = '';
    if (!list.length) {
      dom.histList.appendChild(el('p', { class: 'hist-empty', text: q ? 'Không thấy cuộc trò chuyện nào khớp.' : 'Chưa có cuộc trò chuyện nào. Hỏi một câu để bắt đầu.' }));
      return;
    }
    var lastGroup = null;
    list.forEach(function (c) {
      var g = dayLabel(c.updatedAt, today);
      if (g !== lastGroup) { dom.histList.appendChild(el('p', { class: 'lbl', text: g })); lastGroup = g; }
      var isCur = current && current.id === c.id;
      dom.histList.appendChild(el('button', {
        type: 'button', class: 'hi', 'data-id': c.id, 'aria-current': isCur ? 'true' : null, title: titleOf(c),
        html: icon('chat', 16) + '<span class="t">' + escapeHtml(titleOf(c)) + '</span>' + (c.booked ? '<em>Đã đặt lịch</em>' : '')
      }));
    });
  }

  function openConvo(id) {
    if (busy || Demo.running()) return;
    if (current && current.id === id) { closeSide(); return; }
    var c = convos.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    current = c;
    bot.setState(c.state);
    renderLog(c.msgs);
    renderHistory();
    renderConvTitle();
    closeSide();
    if (currentView() !== 'chat') location.hash = '#/chat';
  }

  function startNewChat(force) {
    if (busy && !force) return;
    if (!force && current && !history.length) { closeSide(); focusInput(); return; } // đang ở cuộc trống rồi
    bot.reset();
    current = newConvo();
    renderLog([]);
    renderHistory();
    renderConvTitle();
    closeSide();
    if (!force) focusInput();
  }

  /* ---------------- Khung chat ---------------- */
  function renderLog(msgs) {
    dom.log.innerHTML = '';
    history = [];
    if (!msgs.length) { showHero(); return; }
    msgs.forEach(function (m) {
      if (m && m.r === 'u' && typeof m.t === 'string') addUser(m.t, m.at, true);
      else if (m && m.r === 'b' && m.res && typeof m.res === 'object') addBot(m.res, m.at, true);
    });
    dom.log.scrollTop = dom.log.scrollHeight;
  }

  function showHero() {
    var w = bot.welcome();
    var chips = el('div', { class: 'chips' });
    (w.suggestions || []).forEach(function (s) { chips.appendChild(chip(s)); });
    chips.appendChild(el('button', { type: 'button', class: 'chip ghost spot', html: icon('list', 16) + '<span>Xem cả 10 câu</span>', onclick: function () { openPanel('faq', true); } }));
    var hero = el('div', { class: 'hero', id: 'hero' }, [
      el('div', { class: 'mascot-wrap', html: MASCOT_SVG }),
      el('p', { class: 'nm', text: BRAND.botName }),
      el('h2', { class: 'hello', text: 'Chào bạn! Shop của bạn cần hỗ trợ gì hôm nay?' }),
      el('p', { class: 'sub', text: 'Hỏi về tên miền, hosting, SSL, email… mình trả lời ngay từ 10 câu hỏi thường gặp. Câu nào ngoài phạm vi, mình giúp bạn đặt lịch để nhân viên gọi lại.' }),
      el('span', { class: 'live', html: '<span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>Sẵn sàng trả lời 24/7' }),
      chips
    ]);
    dom.log.appendChild(hero);
    Eyes.attach($('.mascot .eyes', hero), $('.mascot', hero));
  }
  function removeHero() {
    var h = $('#hero', dom.log);
    if (h) { h.remove(); Eyes.attach(null, null); }
  }

  function scrollToMessage(node) {
    var log = dom.log;
    if (!node) { log.scrollTop = log.scrollHeight; return; }
    // Câu trả lời dài: giữ câu hỏi của khách ở mép trên để đọc liền mạch; nếu không đủ chỗ thì neo đầu câu trả lời
    var prev = node.previousElementSibling;
    var anchor = prev && prev.classList.contains('mu') && node.offsetHeight + prev.offsetHeight + 40 <= log.clientHeight * 1.6 ? prev : node;
    var bottom = node.offsetTop + node.offsetHeight;
    if (bottom - anchor.offsetTop > log.clientHeight - 16) log.scrollTop = Math.max(0, anchor.offsetTop - 12);
    else log.scrollTop = log.scrollHeight;
  }

  function addUser(text, at, quiet) {
    at = at || timeNow();
    removeHero();
    var msg = el('div', { class: 'msg mu' }, [
      el('div', { class: 'u' }, [el('p', { text: text }), el('time', { text: at })])
    ]);
    dom.log.appendChild(msg);
    history.push({ r: 'u', t: text, at: at });
    if (current && !current.title) current.title = text.length > 60 ? text.slice(0, 57).trim() + '…' : text;
    if (!quiet) scrollToMessage(msg);
    return msg;
  }

  function chip(s, extraClass) {
    return el('button', {
      type: 'button',
      class: 'chip spot' + (extraClass ? ' ' + extraClass : ''),
      'data-faq': s.id || null,
      onclick: function () { send(s.text, s.id ? { faqId: s.id } : null); }
    }, [el('span', { text: s.text })]);
  }

  function receiptNode(rc) {
    function row(k, v, cls) { return el('div', null, [el('dt', { text: k }), el('dd', null, [el('span', { class: cls || null, text: v })])]); }
    return el('div', { class: 'receipt' }, [
      el('div', { class: 'receipt-head' }, [
        el('span', { class: 'receipt-icon', html: icon('check', 16, 2.4) }),
        el('div', null, [el('strong', { text: 'Đã ghi nhận lịch hẹn' }), el('span', { text: 'Trạng thái: Chờ nhân viên gọi lại' })])
      ]),
      el('dl', null, [row('Mã lịch hẹn', '#' + rc.code, 'code'), row('Ngày hẹn', rc.date), row('Giờ hẹn', rc.time + ' (giờ Việt Nam)'), row('Số điện thoại', rc.phone)]),
      el('p', { text: 'Nhân viên ' + BRAND.name + ' sẽ gọi lại đúng giờ hẹn. Bạn có thể xem lại hoặc hủy trong “Lịch hẹn của bạn”.' }),
      el('div', { class: 'acts' }, [el('button', { type: 'button', class: 'btng', html: icon('cal', 16) + '<span>Xem lịch hẹn của bạn</span>', onclick: function () { openMine(); } })])
    ]);
  }

  function packageCards(res) {
    var label = res.focus && res.focus.label ? res.focus.label : '';
    var best = /nhiều website/.test(label) ? 'doanh-nghiep' : /đông khách/.test(label) ? 'kinh-doanh' : 'khoi-nghiep';
    var badge = best === 'khoi-nghiep' ? 'Hợp shop nhỏ' : 'Hợp với bạn';
    return el('div', { class: 'pk', role: 'list', 'aria-label': 'Ba gói hosting (giá mẫu)' }, (VC.PACKAGES || []).map(function (p) {
      var isBest = p.id === best;
      return el('div', { class: 'pc spot' + (isBest ? ' best' : ''), role: 'listitem' }, [
        el('div', { class: 'pc-h' }, [el('small', { text: 'Gói ' + p.name }), isBest ? el('span', { class: 'badge', text: badge }) : null]),
        el('b', null, [p.price, el('span', { text: '/tháng' })]),
        el('p', { text: p.spec }),
        el('p', { text: p.fit })
      ]);
    }));
  }

  function whyText(res) {
    var why = res.matchedBy === 'chip'
      ? 'Bạn chọn câu hỏi có sẵn nên bot lấy thẳng FAQ ' + pad2(res.faqNo) + '.'
      : 'Bot chọn FAQ ' + pad2(res.faqNo) + ' vì khớp từ khóa: ' + (res.hits || []).join(', ') + ' (điểm ' + Number(res.score || 0).toFixed(1) +
        ', ngưỡng ' + VC.engine.ANSWER_THRESHOLD.toFixed(1) + ')' + (res.corrections && res.corrections.length ? '; tự sửa lỗi gõ: ' + res.corrections.join(', ') : '') + '.';
    var focusNote = res.focus ? ' Câu hỏi nhắc tới “' + res.focus.label + '” nên câu đầu trả lời thẳng ý đó.' : '';
    return why + focusNote + ' Phần diễn đạt phía trên do AI mô phỏng (mock) tạo từ câu gốc này, mẫu câu số ' + res.variant + '.';
  }

  function addBot(res, at, quiet) {
    at = at || timeNow();
    removeHero();
    var body = el('div', { class: 'body' });
    var host = body;
    var isAnswer = res.type === 'answer';

    if (isAnswer) {
      var traceText = res.matchedBy === 'chip'
        ? 'Bạn chọn câu có sẵn · FAQ ' + pad2(res.faqNo)
        : 'Đã tìm trong bộ kiến thức · FAQ ' + pad2(res.faqNo) + (res.hits && res.hits.length ? ' · khớp “' + res.hits.slice(0, 2).join('”, “') + '”' : '');
      body.appendChild(el('p', { class: 'trace', html: icon('spark', 14) + '<span>' + escapeHtml(traceText) + '</span>' }));
    }
    if (res.type === 'fallback') {
      host = el('div', { class: 'out' }, [el('span', { class: 'tag warn', html: icon('info', 13) + '<span>Ngoài bộ kiến thức</span>' })]);
      body.appendChild(host);
    }
    if (res.receipt) host.appendChild(receiptNode(res.receipt));
    if (res.lead) host.appendChild(el('p', { class: 'lead', html: md(res.lead) }));
    var paras = res.paragraphs || [];
    paras.forEach(function (p, i) {
      var cls = null;
      if (isAnswer && paras.length > 1 && i === 0) cls = 'repeat';
      else if (res.type === 'fallback' && i === 0 && !res.lead) cls = 'lead';
      host.appendChild(el('p', { class: cls, html: md(p) }));
    });
    var bullets = res.bullets || [];
    var withCards = isAnswer && res.faqId === 'chon-goi-hosting' && (VC.PACKAGES || []).length;
    if (withCards) { // thẻ gói đã thể hiện giá từng gói → bỏ các dòng liệt kê trùng
      bullets = bullets.filter(function (b) { return !(VC.PACKAGES || []).some(function (p) { return String(b).indexOf(p.name) === 0; }); });
    }
    if (withCards) host.appendChild(packageCards(res));
    if (bullets.length) {
      var ul = el('ul', { class: withCards ? 'points pk-note' : 'points' });
      bullets.forEach(function (b) { ul.appendChild(el('li', { html: md(b) })); });
      host.appendChild(ul);
    }
    if (res.menu && res.menu.length) {
      var menu = el('div', { class: 'menu' });
      res.menu.forEach(function (m) { menu.appendChild(chip(m)); });
      host.appendChild(menu);
    }

    var meta = el('div', { class: 'meta' });
    var origin = null;
    if (isAnswer) {
      meta.appendChild(el('span', { class: 'tag src', text: 'Nguồn: FAQ ' + pad2(res.faqNo) + ' · ' + res.category }));
      meta.appendChild(el('span', { class: 'tag ai', text: 'AI mô phỏng' }));
      if (res.original) {
        var oid = 'o' + Math.random().toString(36).slice(2, 8);
        origin = el('div', { class: 'origin', id: oid, hidden: true }, [el('p', { text: fill(res.original) }), el('small', { text: whyText(res) })]);
        var ob = el('button', { type: 'button', class: 'origin-btn', 'aria-expanded': 'false', 'aria-controls': oid, text: 'Xem câu trả lời gốc' });
        ob.addEventListener('click', function () {
          var open = origin.hidden;
          origin.hidden = !open;
          ob.setAttribute('aria-expanded', open ? 'true' : 'false');
          ob.textContent = open ? 'Ẩn câu trả lời gốc' : 'Xem câu trả lời gốc';
        });
        meta.appendChild(ob);
      }
    } else if (res.type === 'confirm') {
      meta.appendChild(el('span', { class: 'tag ok', text: 'Đã lưu vào localStorage' }));
    }
    meta.appendChild(el('time', { text: at }));

    if (res.actions && res.actions.length) {
      var acts = el('div', { class: 'acts' });
      res.actions.forEach(function (a) {
        if (a.type !== 'booking') return;
        acts.appendChild(el('button', {
          type: 'button',
          class: (a.source === 'chat-cta' ? 'btng' : 'btnc') + ' btn-book',
          html: icon('cal', 16) + '<span>' + escapeHtml(a.label) + '</span>',
          onclick: function () { openBooking({ note: a.note || '', source: a.source || 'direct' }); }
        }));
      });
      host.appendChild(acts);
    }
    body.appendChild(meta);
    if (origin) body.appendChild(origin);

    if (res.suggestions && res.suggestions.length) {
      var box = el('div', { class: 'sug' }, [
        el('p', { class: 'sug-label', text: res.type === 'fallback' ? 'Có thể bạn muốn hỏi:' : isAnswer ? 'Gợi ý câu hỏi liên quan:' : 'Câu hỏi thường gặp:' })
      ]);
      var row = el('div', { class: 'chips' });
      res.suggestions.forEach(function (s) { row.appendChild(chip(s)); });
      box.appendChild(row);
      body.appendChild(box);
    }

    var msg = el('div', { class: 'msg b' + (res.type === 'fallback' ? ' is-fallback' : ''), 'data-type': res.type }, [
      el('img', { class: 'av', src: 'assets/mascot.svg', width: 32, height: 32, alt: '' }),
      body
    ]);
    dom.log.appendChild(msg);
    history.push({ r: 'b', res: slimRes(res), at: at });
    if (!quiet) scrollToMessage(msg);
    return msg;
  }

  function showTyping() {
    var node = el('div', { class: 'msg b typing', 'aria-label': 'Trợ lý đang soạn câu trả lời' }, [
      el('img', { class: 'av', src: 'assets/mascot.svg', width: 32, height: 32, alt: '' }),
      el('div', { class: 'body' }, [el('span', { class: 'dot' }), el('span', { class: 'dot' }), el('span', { class: 'dot' })])
    ]);
    dom.log.appendChild(node);
    scrollToMessage(null);
    return node;
  }

  var hintTimer = null;
  function nudge(message) {
    dom.hint.textContent = message;
    dom.hint.classList.add('warn');
    dom.inputWrap.classList.remove('shake');
    void dom.inputWrap.offsetWidth; // chạy lại hiệu ứng rung
    dom.inputWrap.classList.add('shake');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { dom.hint.textContent = dom.hint.getAttribute('data-default'); dom.hint.classList.remove('warn'); }, 2800);
    dom.input.focus();
  }

  function updateCounter() {
    var n = dom.input.value.length;
    dom.counter.textContent = n + '/' + VC.engine.MAX_LEN;
    dom.counter.classList.toggle('warn', n >= VC.engine.MAX_LEN - 20);
    dom.inputWrap.classList.toggle('has-text', n > 0); // chỉ hiện bộ đếm khi đang gõ để không che chữ gợi ý
  }

  function setBusy(b) {
    dom.send.disabled = b;
    dom.composer.setAttribute('aria-busy', b ? 'true' : 'false');
    dom.inputWrap.classList.toggle('busy', b);
  }
  function focusInput() {
    if (finePointer && !Demo.running() && !anyDialogOpen() && currentView() === 'chat') { try { dom.input.focus(); } catch (e) { /* bỏ qua */ } }
  }

  function send(text, opts) {
    if (busy) return Promise.resolve(null); // chặn gửi lặp khi bot đang trả lời
    var clean = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!clean) { nudge('Bạn chưa nhập câu hỏi nào.'); return Promise.resolve(null); }
    var truncated = clean.length > VC.engine.MAX_LEN;
    if (truncated) clean = clean.slice(0, VC.engine.MAX_LEN);
    busy = true;
    setBusy(true);
    if (currentView() !== 'chat') location.hash = '#/chat';
    if (!isWide()) closePanel(true);
    closeSide();
    addUser(clean);
    dom.input.value = '';
    updateCounter();
    var typing = showTyping();
    return delay(TYPING_MS).then(function () {
      var res = bot.reply(clean, opts || null);
      typing.remove();
      if (!res) return null;
      if (res.type === 'answer') B.track({ type: 'answer', faqId: res.faqId });
      else if (res.type === 'fallback') B.track({ type: 'fallback' });
      else B.track({ type: 'other' });
      if (res.type === 'fallback' && res.reason !== 'empty') { B.logUnanswered(clean); refreshBadges(); }
      var node = addBot(res);
      saveCurrent();
      if (truncated) toast('Câu hỏi dài hơn ' + VC.engine.MAX_LEN + ' ký tự nên đã được rút gọn.', 'warn');
      if (res.autoBooking) openBooking({ source: 'chat-intent' });
      return node;
    }).catch(function (err) {
      typing.remove();
      if (window.console) console.error(err);
      addBot({ type: 'system', paragraphs: ['Xin lỗi, đã có lỗi khi xử lý câu hỏi. Bạn thử lại nhé.'], suggestions: bot.suggestFor(null) });
      return null;
    }).then(function (node) {
      busy = false;
      setBusy(false);
      var ae = document.activeElement;
      if (!ae || !dom.paneBook.contains(ae)) focusInput();
      return node;
    });
  }

  /* ---------------- Đôi mắt linh vật + vùng sáng theo chuột ---------------- */
  var Eyes = (function () {
    var eyes = null, svg = null, pt = null, raf = 0;
    function update() {
      raf = 0;
      if (!eyes || !svg || !pt) return;
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = pt.x - cx, dy = pt.y - cy;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.min(1, d / 280);
      eyes.style.transform = 'translate(' + (dx / d * 15 * k).toFixed(1) + 'px,' + (dy / d * 11 * k).toFixed(1) + 'px)';
    }
    function look(x, y) {
      if (reduceMotion || !eyes) return;
      pt = { x: x, y: y };
      if (!raf) raf = requestAnimationFrame(update);
    }
    return {
      attach: function (e, s) { eyes = e; svg = s; if (pt) look(pt.x, pt.y); },
      look: look
    };
  })();
  function onPointerMove(e) {
    Eyes.look(e.clientX, e.clientY);
    var t = e.target && e.target.closest ? e.target.closest('.spot') : null;
    if (t) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', Math.round(e.clientX - r.left) + 'px');
      t.style.setProperty('--my', Math.round(e.clientY - r.top) + 'px');
    }
  }
  function lookAtCaret() { // khi đang gõ, linh vật nhìn xuống ô nhập theo con chữ
    var r = dom.inputWrap.getBoundingClientRect();
    Eyes.look(r.left + 22 + Math.min(dom.input.value.length * 7.5, r.width - 70), r.top + r.height / 2);
  }

  /* ---------------- Cột phải: câu hỏi thường gặp / đặt lịch ---------------- */
  var panelTab = 'faq';
  var panelPrefWide = true; // trên màn hình rộng: người dùng muốn bảng mở hay đóng
  var lastPanelTrigger = null;
  function isWide() { return mqWide.matches; }
  function panelIsOpen() { return dom.app.getAttribute('data-panel-open') === 'true'; }
  function readUiPref() {
    try { var v = JSON.parse(B.store.get(UI_KEY) || '{}'); if (v && v.panel === false) panelPrefWide = false; } catch (e) { /* bỏ qua */ }
  }
  function writeUiPref() { try { B.store.set(UI_KEY, JSON.stringify({ panel: panelPrefWide })); } catch (e) { /* bỏ qua */ } }

  function syncScrim() {
    var overlay = (!isWide() && panelIsOpen() && currentView() === 'chat') || dom.app.classList.contains('side-open');
    dom.scrim.hidden = !overlay;
  }
  function setPanelOpen(open) {
    dom.app.setAttribute('data-panel-open', open ? 'true' : 'false');
    dom.panelBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) hidePop(true);
    syncScrim();
  }
  function selectTab(tab, focusTab) {
    panelTab = tab === 'book' ? 'book' : 'faq';
    [['faq', dom.tabFaq, dom.paneFaq], ['book', dom.tabBook, dom.paneBook]].forEach(function (t) {
      var on = t[0] === panelTab;
      t[1].setAttribute('aria-selected', on ? 'true' : 'false');
      t[1].tabIndex = on ? 0 : -1;
      t[2].hidden = !on;
    });
    hidePop(true);
    if (panelTab === 'book') { renderBookingPicker(); renderMine(); }
    if (focusTab) (panelTab === 'book' ? dom.tabBook : dom.tabFaq).focus();
  }
  function openPanel(tab, focusFirst) {
    if (currentView() !== 'chat') location.hash = '#/chat';
    lastPanelTrigger = document.activeElement;
    closeSide();
    selectTab(tab || panelTab);
    setPanelOpen(true);
    if (isWide()) { panelPrefWide = true; writeUiPref(); }
    if (focusFirst && !Demo.running()) {
      setTimeout(function () {
        var target = panelTab === 'faq' ? $('.opt', dom.faqList) || dom.faqSearch : dom.bkName;
        try { target.focus({ preventScroll: false }); } catch (e) { /* bỏ qua */ }
      }, 30);
    }
  }
  function closePanel(silent) {
    if (!panelIsOpen()) return;
    setPanelOpen(false);
    if (isWide() && !silent) { panelPrefWide = false; writeUiPref(); }
    if (!silent && lastPanelTrigger && document.body.contains(lastPanelTrigger) && !isWide()) {
      try { lastPanelTrigger.focus(); } catch (e) { /* bỏ qua */ }
    }
  }
  function togglePanel() { if (panelIsOpen()) closePanel(); else openPanel(panelTab, !isWide()); }
  function onLayoutChange() {
    setPanelOpen(isWide() ? panelPrefWide && currentView() === 'chat' : false);
    if (!mqPhone.matches) closeSide();
    dom.input.placeholder = mqPhone.matches ? 'Nhập câu hỏi của bạn…' : 'Hỏi bất cứ điều gì về tên miền, hosting…';
  }

  function openSide() { dom.app.classList.add('side-open'); dom.histBtn.setAttribute('aria-expanded', 'true'); syncScrim(); setTimeout(function () { dom.newChat.focus(); }, 30); }
  function closeSide() {
    if (!dom.app.classList.contains('side-open')) return;
    dom.app.classList.remove('side-open');
    dom.histBtn.setAttribute('aria-expanded', 'false');
    syncScrim();
  }

  /* --- danh sách câu hỏi thường gặp --- */
  function renderFaqList() {
    var q = VC.normalize(dom.faqSearch.value || '');
    var popular = (VC.POPULAR || []).slice(0, 3);
    var list = VC.FAQ.filter(function (f) {
      if (!q) return true;
      return VC.normalize(f.question + ' ' + f.chip + ' ' + f.category).indexOf(q) > -1 ||
        (f.keywords || []).some(function (k) { return k.indexOf(q) > -1; });
    });
    dom.faqList.innerHTML = '';
    if (!list.length) {
      dom.faqList.appendChild(el('p', { class: 'faq-empty', text: 'Không thấy câu phù hợp. Bạn cứ hỏi tự do ở ô chat, bot sẽ tìm giúp.' }));
      return;
    }
    list.forEach(function (f) {
      dom.faqList.appendChild(el('button', {
        type: 'button', class: 'opt spot', 'data-faq': f.id,
        html: '<span class="ci">' + icon(CAT_ICON[f.category] || 'chat', 16) + '</span>' +
          '<span class="t">' + escapeHtml(f.chip || f.question) + '<small>' + pad2(f.no) + ' · ' + escapeHtml(f.category) +
          (popular.indexOf(f.id) > -1 ? ' · <em>Hỏi nhiều</em>' : '') + '</small></span>' + icon('right', 15)
      }));
    });
  }
  function onFaqClick(e) {
    var b = e.target.closest ? e.target.closest('.opt') : null;
    if (!b) return;
    var f = VC.FAQ.filter(function (x) { return x.id === b.getAttribute('data-faq'); })[0];
    if (f) { hidePop(true); send(f.question, { faqId: f.id }); }
  }

  /* --- bong bóng xem trước câu trả lời khi rê chuột --- */
  var popFor = null, popTimer = null, popHideTimer = null;
  function preview(f) {
    var a = fill(f.answer).replace(/\s+/g, ' ');
    if (a.length <= 170) return a;
    var cut = a.slice(0, 170);
    return cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }
  function placePop(item) {
    var pr = dom.panel.getBoundingClientRect();
    var ir = item.getBoundingClientRect();
    var w = dom.pop.offsetWidth || 310;
    var h = dom.pop.offsetHeight || 140;
    var left = pr.left - w - 14;
    if (left < 8) return false; // không đủ chỗ bên trái (màn nhỏ) → không hiện
    var center = ir.top + ir.height / 2;
    var top = Math.min(Math.max(10, center - 34), window.innerHeight - h - 10);
    dom.pop.style.left = Math.round(left) + 'px';
    dom.pop.style.top = Math.round(top) + 'px';
    dom.pop.style.setProperty('--ay', Math.round(Math.min(Math.max(14, center - top - 6), h - 24)) + 'px');
    return true;
  }
  function showPop(item) {
    var f = VC.FAQ.filter(function (x) { return x.id === item.getAttribute('data-faq'); })[0];
    if (!f) return;
    clearTimeout(popHideTimer);
    if (popFor) popFor.removeAttribute('aria-describedby');
    popFor = item;
    dom.pop.innerHTML = '';
    dom.pop.appendChild(el('small', { text: 'FAQ ' + pad2(f.no) + ' · ' + f.category }));
    dom.pop.appendChild(el('b', { text: f.question }));
    dom.pop.appendChild(el('p', { text: preview(f) }));
    dom.pop.appendChild(el('span', { class: 'lk', html: 'Bấm để hỏi bot ' + icon('right', 14, 2) }));
    dom.pop.hidden = false;
    if (!placePop(item)) { dom.pop.hidden = true; popFor = null; return; }
    item.setAttribute('aria-describedby', 'faq-pop');
    requestAnimationFrame(function () { dom.pop.classList.add('show'); });
  }
  function hidePop(now) {
    clearTimeout(popTimer);
    if (popFor) popFor.removeAttribute('aria-describedby');
    popFor = null;
    dom.pop.classList.remove('show');
    clearTimeout(popHideTimer);
    if (now) dom.pop.hidden = true;
    else popHideTimer = setTimeout(function () { if (!popFor) dom.pop.hidden = true; }, 180);
  }
  function bindPop() {
    dom.faqList.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var item = e.target.closest ? e.target.closest('.opt') : null;
      if (!item || item === popFor) return;
      clearTimeout(popTimer);
      if (popFor) showPop(item); // đang mở thì đổi ngay sang câu mới
      else popTimer = setTimeout(function () { showPop(item); }, 140);
    });
    dom.faqList.addEventListener('pointerleave', function () { hidePop(false); });
    dom.faqList.addEventListener('focusin', function (e) {
      var item = e.target.closest ? e.target.closest('.opt') : null;
      if (item && isWide() && e.target.matches(':focus-visible')) showPop(item);
    });
    dom.faqList.addEventListener('focusout', function () { hidePop(false); });
    dom.paneFaq.addEventListener('scroll', function () { hidePop(true); }, { passive: true });
  }

  /* ---------------- Đặt lịch (trong cột phải) ---------------- */
  var bk = { date: '', time: '', source: 'direct' };
  var saving = false;
  var lastBookedId = null;
  var FIELDS = ['name', 'phone', 'date', 'time', 'note'];

  function fieldNode(k) { return { name: dom.bkName, phone: dom.bkPhone, date: dom.bkDays, time: dom.bkSlots, note: dom.bkNote }[k]; }
  function setFieldError(k, message) {
    var p = $('#err-' + k);
    var node = fieldNode(k);
    if (p) p.textContent = message || '';
    if (!node) return;
    if (k === 'date' || k === 'time') node.classList.toggle('invalid', !!message);
    else if (message) node.setAttribute('aria-invalid', 'true');
    else node.removeAttribute('aria-invalid');
  }
  function clearErrors() { FIELDS.forEach(function (k) { setFieldError(k, ''); }); dom.errForm.textContent = ''; }
  function focusGroup(group) {
    var b = $('[aria-checked="true"]:not(:disabled)', group) || $('button:not(:disabled)', group);
    if (b) b.focus();
  }
  function showErrors(errors) {
    var first = null;
    FIELDS.forEach(function (k) {
      setFieldError(k, errors[k] || '');
      if (errors[k] && !first) first = k;
    });
    dom.errForm.textContent = errors._form || (first ? 'Vui lòng kiểm tra lại các ô được đánh dấu đỏ.' : '');
    if (!first) return;
    try {
      if (first === 'date' || first === 'time') focusGroup(fieldNode(first));
      else fieldNode(first).focus();
    } catch (e) { /* bỏ qua */ }
  }
  function updateNoteCount() { dom.noteCount.textContent = dom.bkNote.value.length + '/' + B.CONFIG.noteMax; }

  function renderDays(list, now) {
    dom.bkDays.innerHTML = '';
    var selectedOk = false;
    for (var i = 0; i <= B.CONFIG.maxDaysAhead; i++) {
      var d = B.addDays(now.date, i);
      var reason = !B.isOpenDay(d) ? 'nghỉ' : B.getSlots(d, list, now).some(function (s) { return s.available; }) ? '' : (i === 0 ? 'hết giờ' : 'kín lịch');
      var on = d === bk.date && !reason;
      if (on) selectedOk = true;
      var label = (i === 0 ? 'Hôm nay, ' : i === 1 ? 'Ngày mai, ' : '') + B.formatDate(d) + (reason ? ' (' + reason + ')' : '');
      dom.bkDays.appendChild(el('button', {
        type: 'button', class: 'day', role: 'radio', 'data-date': d, 'aria-checked': on ? 'true' : 'false', 'aria-label': label, title: label,
        disabled: !!reason, tabindex: on ? '0' : '-1'
      }, [el('small', { text: i === 0 ? 'Nay' : SHORT_DAY[B.weekday(d)] }), d.slice(8, 10)]));
    }
    if (!selectedOk) bk.date = '';
    if (!$('[tabindex="0"]', dom.bkDays)) { var f = $('button:not(:disabled)', dom.bkDays); if (f) f.tabIndex = 0; }
  }
  function renderSlots(list, now) {
    dom.bkSlots.innerHTML = '';
    if (!bk.date) {
      bk.time = '';
      dom.slotHint.textContent = 'Chọn ngày trước để xem khung giờ trống.';
      return;
    }
    var slots = B.getSlots(bk.date, list, now);
    var free = 0, keep = false;
    slots.forEach(function (s) {
      if (s.available) free++;
      var on = s.time === bk.time && s.available;
      if (on) keep = true;
      var why = s.reason === 'past' ? 'đã qua' : s.reason === 'booked' ? 'đã có người đặt' : '';
      dom.bkSlots.appendChild(el('button', {
        type: 'button', class: 'slot', role: 'radio', 'data-time': s.time, 'aria-checked': on ? 'true' : 'false',
        'aria-label': s.time + (why ? ' (' + why + ')' : ''), title: why ? s.time + ': ' + why : null, disabled: !s.available, tabindex: on ? '0' : '-1', text: s.time
      }));
    });
    if (!keep) bk.time = '';
    if (!$('[tabindex="0"]', dom.bkSlots)) { var f = $('button:not(:disabled)', dom.bkSlots); if (f) f.tabIndex = 0; }
    dom.slotHint.textContent = B.formatDate(bk.date) + ': còn ' + free + '/' + slots.length + ' khung giờ trống (giờ Việt Nam).';
  }
  function renderSummary() {
    dom.bkSumText.textContent = bk.date && bk.time ? B.formatDate(bk.date) + ' lúc ' + bk.time
      : bk.date ? B.formatDate(bk.date) + ' · chọn giờ hẹn' : 'Chọn ngày và giờ hẹn';
  }
  function renderBookingPicker() {
    var now = B.vnNow();
    var list = B.loadAppointments().list;
    if (!bk.date) bk.date = B.nextAvailableDate(list, now) || '';
    renderDays(list, now);
    if (!bk.date) { bk.date = B.nextAvailableDate(list, now) || ''; renderDays(list, now); }
    renderSlots(list, now);
    renderSummary();
  }
  function pickInGroup(group, btn) {
    if (!btn || btn.disabled) return;
    if (group === dom.bkDays) { bk.date = btn.getAttribute('data-date'); setFieldError('date', ''); }
    else { bk.time = btn.getAttribute('data-time'); setFieldError('time', ''); }
    var focused = document.activeElement && group.contains(document.activeElement);
    renderBookingPicker();
    if (focused || group === dom.bkDays) {
      var sel = group === dom.bkDays ? '[data-date="' + bk.date + '"]' : '[data-time="' + bk.time + '"]';
      var nb = $(sel, group);
      if (nb && focused) nb.focus();
    }
  }
  function onGroupKey(group, e) {
    var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
    var btns = $all('button:not(:disabled)', group);
    if (!btns.length) return;
    e.preventDefault();
    var i = btns.indexOf(document.activeElement);
    var step = keys[e.key] || 0;
    if (group === dom.bkSlots && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) step *= 4; // lưới 4 cột
    var next = e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : Math.min(btns.length - 1, Math.max(0, (i < 0 ? 0 : i) + step));
    pickInGroup(group, btns[next]);
    var nb = $(group === dom.bkDays ? '[data-date="' + bk.date + '"]' : '[data-time="' + bk.time + '"]', group);
    if (nb) nb.focus();
  }

  function openBooking(opts) {
    opts = opts || {};
    bk.source = opts.source || 'direct';
    if (opts.note) { dom.bkNote.value = String(opts.note).slice(0, B.CONFIG.noteMax); updateNoteCount(); }
    clearErrors();
    saving = false;
    dom.bkSubmit.disabled = false;
    openPanel('book', false);
    if (!Demo.running()) {
      setTimeout(function () {
        var target = !dom.bkName.value ? dom.bkName : !dom.bkPhone.value ? dom.bkPhone : dom.bkSubmit;
        try { target.focus(); } catch (e) { /* bỏ qua */ }
      }, 40);
    }
    dom.paneBook.scrollTop = 0;
  }

  function onSubmitBooking(e) {
    e.preventDefault();
    if (saving) return; // chặn bấm lưu 2 lần
    saving = true;
    dom.bkSubmit.disabled = true;
    dom.bkSubmit.textContent = 'Đang lưu…';
    var res;
    try {
      res = B.add({ name: dom.bkName.value, phone: dom.bkPhone.value, date: bk.date, time: bk.time, note: dom.bkNote.value },
        { source: bk.source, mine: true });
    } catch (err) {
      if (window.console) console.error(err);
      res = { ok: false, errors: { _form: 'Đã có lỗi khi lưu lịch hẹn. Vui lòng thử lại.' } };
    }
    saving = false;
    dom.bkSubmit.disabled = false;
    dom.bkSubmit.textContent = 'Xác nhận đặt lịch';
    if (!res.ok) {
      if (res.errors.time || res.errors.date) renderBookingPicker(); // khung giờ có thể vừa bị tab khác đặt mất
      showErrors(res.errors);
      return;
    }
    var r = res.record;
    lastBookedId = r.id;
    dom.bkForm.reset();
    updateNoteCount();
    bk.time = '';
    bk.source = 'direct';
    clearErrors();
    renderBookingPicker();
    renderMine();
    refreshMine();
    refreshBadges();
    var msg = bot.systemMessage([]);
    msg.type = 'confirm';
    msg.receipt = { code: B.codeOf(r), date: B.formatDate(r.date), time: r.time, phone: B.maskPhone(r.phone) };
    msg.suggestions = [];
    if (current) current.booked = true;
    if (!isWide()) closePanel(true);
    addBot(msg);
    saveCurrent();
    toast('Đã ghi nhận lịch hẹn ' + r.time + ', ' + B.formatDate(r.date) + '.', 'success');
  }

  /* ---------------- Lịch hẹn của bạn (phía khách) ---------------- */
  function refreshMine() {
    var n = B.listMine().filter(function (r) { return r.status === 'pending'; }).length;
    dom.mineCount.textContent = n;
    dom.mineCount.hidden = n === 0;
  }
  function renderMine() {
    var list = B.listMine();
    dom.mineSection.hidden = !list.length;
    dom.mineList.innerHTML = '';
    list.forEach(function (r) {
      var meta = ['Mã #' + B.codeOf(r), B.maskPhone(r.phone)];
      dom.mineList.appendChild(el('li', { class: 'mi' + (r.status !== 'pending' ? ' closed' : ''), 'data-id': r.id }, [
        el('div', { class: 'r1' }, [el('b', { text: r.time + ' · ' + B.formatDate(r.date).replace(/\/\d{4}$/, '') }), el('span', { class: 'st ' + r.status, text: B.STATUS_LABEL[r.status] })]),
        el('div', { class: 'r2' }, meta.map(function (t) { return el('span', { text: t }); }).concat(r.note ? [el('span', { text: '“' + r.note + '”' })] : [])),
        r.status === 'pending' ? el('button', { type: 'button', class: 'btn sm danger-ghost', 'data-act': 'cancel', 'data-id': r.id, text: 'Hủy lịch hẹn' }) : null
      ]));
    });
  }
  function openMine() {
    if (!B.listMine().length) { toast('Bạn chưa có lịch hẹn nào trên trình duyệt này.', 'warn'); openBooking({ source: 'direct' }); return; }
    openPanel('book', false);
    renderMine();
    setTimeout(function () {
      dom.mineSection.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      var b = $('button', dom.mineList);
      if (b && !Demo.running()) b.focus({ preventScroll: true });
    }, 40);
  }
  function onMineClick(e) {
    var btn = e.target.closest ? e.target.closest('[data-act="cancel"]') : null;
    if (!btn) return;
    var rec = B.getById(btn.getAttribute('data-id'));
    if (!rec) { renderMine(); refreshMine(); return; }
    confirmDialog('Hủy lịch hẹn lúc ' + rec.time + ', ' + B.formatDate(rec.date) + '? Nhân viên sẽ không gọi lại cho lịch này.', 'Hủy lịch').then(function (ok) {
      if (!ok) return;
      var res = B.cancelMine(rec.id);
      if (!res.ok) { toast(res.error, 'warn'); renderMine(); return; }
      renderMine();
      refreshMine();
      refreshBadges();
      renderBookingPicker();
      if (currentView() === 'admin') renderAdmin();
      var m = bot.systemMessage(['Đã hủy lịch hẹn **#' + B.codeOf(rec) + '** (' + rec.time + ', ' + B.formatDate(rec.date) + '). Khi cần, bạn có thể đặt lại bất cứ lúc nào.']);
      m.suggestions = [];
      addBot(m);
      saveCurrent();
      toast('Đã hủy lịch hẹn #' + B.codeOf(rec) + '.', 'success');
    });
  }

  /* ---------------- Hộp thoại ---------------- */
  function showDialog(d) {
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); }
    else d.setAttribute('open', '');
  }
  function closeDialog(d) {
    if (typeof d.close === 'function') { if (d.open) d.close(); }
    else d.removeAttribute('open');
  }
  function anyDialogOpen() { return !!(dom.cDialog.open || dom.aboutDialog.open); }
  function confirmDialog(message, okLabel) {
    return new Promise(function (resolve) {
      if (typeof dom.cDialog.showModal !== 'function') { resolve(window.confirm(message)); return; }
      dom.cMsg.textContent = message;
      dom.cOk.textContent = okLabel || 'Xóa';
      dom.cDialog.returnValue = '';
      function onClose() {
        dom.cDialog.removeEventListener('close', onClose);
        resolve(dom.cDialog.returnValue === 'ok');
      }
      dom.cDialog.addEventListener('close', onClose);
      showDialog(dom.cDialog);
    });
  }
  function openAbout() { showDialog(dom.aboutDialog); }

  /* ---------------- Quản trị ---------------- */
  var admFilter = 'all';
  function isPending(r) { return r.status === 'pending'; }

  function refreshBadges(list) {
    list = list || B.loadAppointments().list;
    var pending = list.filter(isPending).length;
    dom.navCount.textContent = pending;
    dom.navCount.hidden = pending === 0;
    dom.navCount.setAttribute('aria-label', pending + ' lịch hẹn chờ xử lý');
  }

  function emptyState(totalCount) {
    return el('div', { class: 'empty' }, [
      el('p', { text: totalCount ? 'Không có lịch hẹn nào khớp bộ lọc hiện tại.' : 'Chưa có lịch hẹn nào.' }),
      totalCount ? null : el('p', { text: 'Hãy đặt thử từ màn hình Tư vấn, hoặc bấm “Thêm dữ liệu mẫu” để xem giao diện quản trị.' })
    ]);
  }

  function apptRow(r, now) {
    var closed = B.isClosed(r);
    var dayTag = r.date === now.date ? el('span', { class: 'tag tag-today', text: 'Hôm nay' })
      : r.date < now.date ? el('span', { class: 'tag sample', text: 'Đã qua ngày' }) : null;
    var actions = [];
    if (r.status === 'pending') {
      actions.push(el('button', { type: 'button', class: 'btn sm ok', 'data-act': 'toggle', 'data-id': r.id, html: icon('check', 15, 2.2) + '<span>Đã xử lý</span>' }));
    } else if (r.status === 'done') {
      actions.push(el('button', { type: 'button', class: 'btn sm ghost', 'data-act': 'toggle', 'data-id': r.id, html: icon('undo', 15, 2) + '<span>Hoàn tác</span>' }));
    }
    actions.push(el('button', { type: 'button', class: 'btn sm danger-ghost', 'data-act': 'delete', 'data-id': r.id, 'aria-label': 'Xóa lịch hẹn của ' + r.name, html: icon('trash', 15, 2) + '<span>Xóa</span>' }));
    return el('article', { class: 'tr appt' + (closed ? ' closed' : ''), 'data-id': r.id }, [
      el('div', { class: 'when' }, [el('b', { text: r.time }), el('small', { text: B.formatDate(r.date).replace(/\/\d{4}$/, '') + ' ' }), dayTag]),
      el('div', { class: 'who' }, [
        el('b', null, [el('span', { text: r.name }), r.sample ? el('span', { class: 'tag sample', text: 'Dữ liệu mẫu' }) : null]),
        el('a', { href: 'tel:' + r.phone, text: B.formatPhone(r.phone) })
      ]),
      el('div', { class: 'what' }, [
        r.note ? el('p', { text: '“' + r.note + '”' }) : el('p', { class: 'muted', text: 'Không ghi nội dung' }),
        el('small', null, [el('span', { text: B.SOURCE_LABEL[r.source] || 'Không rõ nguồn' }), el('span', { text: 'đặt lúc ' + (B.formatISO(r.createdAt) || '—') }), el('span', { text: '#' + B.codeOf(r) })])
      ]),
      el('div', { class: 'stc' }, [el('span', { class: 'st ' + r.status, text: B.STATUS_LABEL[r.status] })]),
      el('div', { class: 'ac' }, actions)
    ]);
  }

  function renderInsights() {
    var s = B.getStats();
    var asked = s.answered + s.fallback; // không tính chào hỏi, cảm ơn…
    dom.insQuestions.textContent = asked;
    dom.insAnswered.textContent = asked ? Math.round(s.answered / asked * 100) + '%' : '—';
    dom.insAnsweredSub.textContent = s.answered + ' câu từ bộ kiến thức';
    dom.insFallback.textContent = s.fallback;
    dom.insBookings.textContent = s.bookings;
    dom.insSince.textContent = asked ? 'đếm từ ' + B.formatISO(s.since) : 'chưa có câu hỏi';
    dom.insSince.title = 'Số liệu thật, đếm trên trình duyệt này (không tính câu chào hỏi, cảm ơn).';
    var byId = {};
    VC.FAQ.forEach(function (f) { byId[f.id] = f; });
    var entries = Object.keys(s.byFaq).map(function (id) { return { f: byId[id], n: s.byFaq[id] }; })
      .filter(function (e) { return e.f && e.n > 0; })
      .sort(function (a, b) { return (b.n - a.n) || (a.f.no - b.f.no); })
      .slice(0, 5);
    dom.insRank.innerHTML = '';
    if (!entries.length) { dom.insRank.appendChild(el('li', null, [el('span', { class: 'rank-empty', text: 'Chưa có dữ liệu. Hãy hỏi bot vài câu ở màn hình Tư vấn.' })])); return; }
    var max = entries[0].n;
    entries.forEach(function (e) {
      var label = e.f.chip || e.f.question;
      dom.insRank.appendChild(el('li', { title: label + ': ' + e.n + ' lượt hỏi', 'aria-label': label + ': ' + e.n + ' lượt hỏi' }, [
        el('span', { text: label }),
        el('b', { text: String(e.n) }),
        el('i', { 'aria-hidden': 'true', style: 'width:' + Math.max(4, Math.round(e.n / max * 100)) + '%' })
      ]));
    });
  }

  var corruptedNotified = false;
  function renderAdmin() {
    var loaded = B.loadAppointments();
    if (loaded.corrupted && !corruptedNotified) {
      corruptedNotified = true;
      toast('Dữ liệu lịch hẹn trong trình duyệt bị lỗi định dạng nên đã được khởi tạo lại (bản lỗi đã được sao lưu).', 'warn', 6000);
    }
    var list = loaded.list;
    var now = B.vnNow();
    var closedCount = list.filter(B.isClosed).length;
    var logs = B.listUnanswered();
    dom.stTotal.textContent = list.length;
    dom.stPending.textContent = list.filter(isPending).length;
    dom.stToday.textContent = list.filter(function (r) { return r.date === now.date && r.status !== 'cancelled'; }).length;
    dom.clearDone.disabled = closedCount === 0;
    dom.clearDoneCount.textContent = closedCount;

    var q = VC.normalize(dom.search.value);
    var qDigits = dom.search.value.replace(/\D/g, '');
    var shown = list.filter(function (r) {
      if (admFilter === 'pending' && !isPending(r)) return false;
      if (admFilter === 'done' && !B.isClosed(r)) return false;
      if (!q) return true;
      return VC.normalize(r.name).indexOf(q) > -1 || VC.normalize(r.note || '').indexOf(q) > -1 ||
        (qDigits.length >= 3 && r.phone.indexOf(qDigits) > -1);
    });
    dom.list.innerHTML = '';
    if (!shown.length) dom.list.appendChild(emptyState(list.length));
    else shown.forEach(function (r) { dom.list.appendChild(apptRow(r, now)); });

    dom.logList.innerHTML = '';
    dom.logCount.textContent = logs.length;
    if (!logs.length) dom.logList.appendChild(el('li', { class: 'muted-item', text: 'Chưa có câu hỏi nào bị bỏ lỡ.' }));
    else logs.slice(0, 20).forEach(function (l) { dom.logList.appendChild(el('li', null, [el('span', { text: l.text }), el('time', { text: B.formatISO(l.at) })])); });
    dom.clearLog.disabled = !logs.length;

    $all('[data-filter]', dom.viewAdmin).forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filter') === admFilter ? 'true' : 'false');
    });
    dom.storageNote.textContent = B.storageMode() === 'local'
      ? 'Dữ liệu lưu trên trình duyệt này (localStorage), không gửi đi đâu, thiết bị khác sẽ không thấy.'
      : 'Trình duyệt đang chặn localStorage: dữ liệu chỉ giữ tạm đến khi tải lại trang.';
    renderInsights();
    refreshBadges(list);
  }

  function onAdminListClick(e) {
    var btn = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var rec = B.getById(id);
    if (!rec) { renderAdmin(); return; }
    if (btn.getAttribute('data-act') === 'toggle') {
      var next = rec.status === 'done' ? 'pending' : 'done';
      B.setStatus(id, next);
      renderAdmin();
      refreshMine();
      toast(next === 'done' ? 'Đã đánh dấu “Đã xử lý” cho lịch của ' + rec.name + '.' : 'Đã chuyển lịch của ' + rec.name + ' về “Chờ xử lý”.', 'success');
    } else {
      confirmDialog('Xóa lịch hẹn của ' + rec.name + ' (' + rec.time + ', ' + B.formatDate(rec.date) + ')?' +
        (rec.status === 'pending' ? ' Lưu ý: lịch này CHƯA được xử lý.' : '') + ' Thao tác không thể hoàn tác.', 'Xóa lịch').then(function (ok) {
        if (!ok) return;
        B.remove(id);
        renderAdmin();
        refreshMine();
        toast('Đã xóa lịch hẹn của ' + rec.name + '.', 'success');
      });
    }
  }

  function exportCSV() {
    var list = B.loadAppointments().list;
    if (!list.length) { toast('Chưa có lịch hẹn để xuất.', 'warn'); return; }
    var blob = new Blob([B.toCSV(list)], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'lich-hen-' + BRAND.name.toLowerCase() + '-' + B.vnNow().date + '.csv' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast('Đã xuất ' + list.length + ' lịch hẹn ra file CSV.', 'success');
  }

  /* ---------------- Điều hướng ---------------- */
  function currentView() { return location.hash === '#/admin' ? 'admin' : 'chat'; }
  function route() {
    var view = currentView();
    dom.app.setAttribute('data-view', view);
    dom.viewChat.hidden = view !== 'chat';
    dom.viewAdmin.hidden = view !== 'admin';
    $all('[data-route]').forEach(function (a) {
      if (a.getAttribute('data-route') === view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = (view === 'admin' ? 'Quản trị lịch hẹn' : 'Chatbot tư vấn') + ' · ' + BRAND.name + ' — Đề 4 (bản demo vòng loại)';
    closeSide();
    hidePop(true);
    if (view === 'admin') { setPanelOpen(false); renderAdmin(); dom.viewAdmin.scrollTop = 0; }
    else { setPanelOpen(isWide() ? panelPrefWide : panelIsOpen()); scrollToMessage(null); }
    syncScrim();
  }

  /* ---------------- Thông báo nhanh ---------------- */
  var toastTimer = null;
  function toast(message, type, ms) {
    dom.toast.textContent = message;
    dom.toast.className = 'toast' + (type ? ' ' + type : '');
    dom.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.hidden = true; }, ms || 3200);
  }

  /* ---------------- Demo tự động 5 tính năng (thao tác trên chính giao diện thật, có con trỏ minh họa) ---------------- */
  var Demo = (function () {
    var running = false;
    var cancelled = false;
    function guard() { if (cancelled) throw new Error('demo-cancelled'); }
    function wait(ms) { return delay(ms).then(guard); }
    function placeOverlays() { // hộp thoại nằm ở "top layer" → chú thích và con trỏ phải nằm trong hộp thoại đang mở mới nhìn thấy
      var host = dom.cDialog.open ? dom.cDialog : document.body;
      if (dom.cap.parentNode !== host) host.appendChild(dom.cap);
      if (dom.cursor.parentNode !== host) host.appendChild(dom.cursor);
    }
    function caption(step, text) {
      placeOverlays();
      dom.capStep.textContent = step;
      dom.capText.textContent = text;
      var mr = document.querySelector('.main').getBoundingClientRect(); // canh giữa cột chat, không đè bảng phải
      dom.cap.style.left = Math.round(mr.left + mr.width / 2) + 'px';
      dom.cap.style.maxWidth = Math.round(mr.width - 24) + 'px';
      dom.cap.hidden = false;
    }
    function ring(node) {
      if (!node) return;
      node.classList.add('demo-focus');
      setTimeout(function () { node.classList.remove('demo-focus'); }, 1600);
    }
    function moveTo(node) {
      placeOverlays();
      var r = node.getBoundingClientRect();
      var x = Math.round(r.left + Math.min(r.width / 2, 120));
      var y = Math.round(r.top + r.height / 2);
      dom.cursor.style.transform = 'translate(' + (x - 5) + 'px,' + (y - 3) + 'px)';
      Eyes.look(x, y);
      return wait(560);
    }
    function click(node) {
      guard();
      if (!node) throw new Error('không tìm thấy nút cần bấm');
      ring(node);
      return moveTo(node).then(function () {
        dom.cursor.classList.remove('clicking');
        void dom.cursor.offsetWidth;
        dom.cursor.classList.add('clicking');
        return wait(160);
      }).then(function () { node.click(); });
    }
    function type(input, text, cps) {
      guard();
      return moveTo(input).then(function () {
        input.focus();
        input.value = '';
        var i = 0;
        return new Promise(function (resolve, reject) {
          (function step() {
            if (cancelled) { reject(new Error('demo-cancelled')); return; }
            if (i >= text.length) { resolve(); return; }
            input.value += text.charAt(i++);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(step, 1000 / (cps || 22));
          })();
        });
      });
    }
    function waitFor(fn, timeout) {
      var t0 = Date.now();
      return new Promise(function (resolve, reject) {
        (function poll() {
          if (cancelled) { reject(new Error('demo-cancelled')); return; }
          var v = fn();
          if (v) { resolve(v); return; }
          if (Date.now() - t0 > (timeout || 6000)) { reject(new Error('quá thời gian chờ')); return; }
          setTimeout(poll, 80);
        })();
      });
    }
    function lastBot() { var all = $all('.msg.b:not(.typing)', dom.log); return all[all.length - 1]; }
    async function ask(text) {
      await type(dom.input, text, 24);
      await wait(300);
      await click(dom.send);
      await waitFor(function () { return !busy; });
      await wait(250);
      return lastBot();
    }

    async function run() {
      if (running) return { ok: false, error: 'đang chạy' };
      running = true;
      cancelled = false;
      document.body.classList.add('demo-running');
      dom.demoBtn.disabled = true;
      var t0 = Date.now();
      try {
        [dom.cDialog, dom.aboutDialog].forEach(closeDialog);
        if (currentView() !== 'chat') { location.hash = '#/chat'; await wait(400); }
        startNewChat(true);
        if (isWide()) { selectTab('faq'); setPanelOpen(true); } else closePanel(true);
        dom.cursor.style.transform = 'translate(' + Math.round(window.innerWidth / 2) + 'px,' + Math.round(window.innerHeight * 0.62) + 'px)';
        dom.cursor.hidden = false;
        caption('Demo', 'Đề 4 · Chatbot FAQ & đặt lịch tư vấn: thao tác tự động trên giao diện thật');
        await wait(2800);

        caption('1/5', 'Bảng bên phải: 10 câu hỏi thường gặp. Rê chuột để xem trước câu trả lời');
        if (isWide()) {
          var item = $('.opt[data-faq="chon-goi-hosting"]', dom.faqList);
          await moveTo(item);
          showPop(item);
          ring(item);
          await wait(3200);
          hidePop(true);
          await click(item);
          await waitFor(function () { return !busy; });
          await wait(4800);
        }
        caption('1/5', 'Hoặc gõ câu hỏi tự do: bot tìm câu trả lời trong bộ kiến thức có sẵn');
        var m1 = await ask('Nên chọn tên miền .vn hay .com cho shop online?');
        await wait(4800);

        caption('2/5', 'AI diễn đạt lại cho tự nhiên (xem được câu gốc) + gợi ý 3 câu hỏi liên quan');
        await click($('.origin-btn', m1));
        scrollToMessage(m1);
        await wait(4600);
        var chips = $all('.sug .chip', m1);
        chips.forEach(function (c) { c.classList.add('demo-focus'); });
        await wait(1600);
        chips.forEach(function (c) { c.classList.remove('demo-focus'); });
        await click(chips[0]);
        await waitFor(function () { return !busy; });
        await wait(4400);
        caption('2/5', 'Câu trả lời bám đúng ý hỏi: gõ không dấu vẫn hiểu, luôn kèm 3 gợi ý mới');
        await ask('ten mien .com gia bao nhieu');
        await wait(4600);

        caption('3/5', 'Câu hỏi ngoài bộ kiến thức → không đoán mò, chủ động đề xuất đặt lịch với nhân viên');
        var m3 = await ask('Bên bạn có nhận thiết kế logo cho shop không?');
        await wait(4000);
        await click($('.btn-book', m3));
        await waitFor(function () { return panelIsOpen() && !dom.paneBook.hidden; });
        caption('4/5', 'Đặt lịch ngay bên phải: chọn ngày, chọn giờ, nhập tên và số điện thoại');
        await wait(2400);
        await click(dom.bkSubmit);
        caption('4/5', 'Gửi khi còn thiếu thông tin → báo lỗi ngay dưới từng ô, không lưu');
        await wait(3000);
        await type(dom.bkName, 'Nguyễn Thị Lan', 16);
        await type(dom.bkPhone, '0900 123 456', 12);
        await wait(300);
        caption('4/5', 'Ngày gợi ý sẵn là ngày làm việc gần nhất; giờ đã qua hoặc đã có người đặt bị khóa');
        var slot = $('.slot:not(:disabled)', dom.bkSlots);
        if (!slot) throw new Error('không còn khung giờ trống');
        await click(slot);
        await wait(2400);
        await click(dom.bkSubmit);
        await waitFor(function () { return lastBookedId && $('.receipt', dom.log); });
        caption('4/5', 'Đã ghi nhận: chatbot xác nhận mã lịch, giờ hẹn và trạng thái ngay trong khung chat');
        scrollToMessage(lastBot());
        await wait(4400);

        caption('5/5', 'Trang quản trị: xem danh sách lịch hẹn mới');
        await click($('.pillg [data-route="admin"]'));
        await wait(600);
        var sel = '.appt[data-id="' + lastBookedId + '"]';
        var row = await waitFor(function () { return $(sel, dom.list); });
        row.scrollIntoView({ block: 'center' });
        ring(row);
        await wait(3000);
        caption('5/5', 'Hiệu quả chatbot: tỉ lệ bot tự trả lời, số câu chuyển nhân viên, câu hỏi chưa trả lời được');
        var kp = $('.kpis', dom.viewAdmin);
        kp.scrollIntoView({ block: 'start' });
        ring(kp);
        ring(dom.logPanel);
        await wait(3600);
        row = $(sel, dom.list);
        row.scrollIntoView({ block: 'center' });
        caption('5/5', 'Nhân viên gọi lại xong → bấm “Đã xử lý”, sau đó xóa lịch đã xử lý');
        await wait(1000);
        await click($('[data-act="toggle"]', row));
        await wait(2200);
        row = $(sel, dom.list);
        await click($('[data-act="delete"]', row));
        await waitFor(function () { return dom.cDialog.open; });
        placeOverlays();
        await wait(1200);
        await click(dom.cOk);
        await waitFor(function () { return !dom.cDialog.open; });
        placeOverlays();
        caption('Xong', 'Hoàn tất 5/5 tính năng · Bản demo vòng loại - Dữ liệu mô phỏng AI');
        await wait(4200);
        return { ok: true, ms: Date.now() - t0 };
      } catch (err) {
        var m = err && err.message;
        if (m !== 'demo-cancelled') {
          if (window.console) console.error(err);
          toast('Demo dừng giữa chừng: ' + m, 'error');
        }
        return { ok: false, ms: Date.now() - t0, error: m };
      } finally {
        running = false;
        document.body.classList.remove('demo-running');
        dom.demoBtn.disabled = false;
        hidePop(true);
        [dom.cap, dom.cursor].forEach(function (n) { if (n.parentNode !== document.body) document.body.appendChild(n); n.hidden = true; });
      }
    }
    return {
      run: run,
      stop: function () { cancelled = true; },
      running: function () { return running; }
    };
  })();

  /* ---------------- Khởi tạo ---------------- */
  function cacheDom() {
    var ids = {
      app: 'app', side: 'side', histList: 'hist-list', histSearch: 'hist-search', newChat: 'btn-new-chat', histBtn: 'btn-hist',
      convTitle: 'conv-title', convTitleText: 'conv-title-text', panelBtn: 'btn-panel', scrim: 'scrim', pop: 'faq-pop',
      viewChat: 'view-chat', viewAdmin: 'view-admin', log: 'chat-log', composer: 'composer', input: 'msg-input', counter: 'msg-counter',
      send: 'send-btn', hint: 'composer-hint', inputWrap: 'composer-field', navCount: 'nav-admin-count', demoBtn: 'btn-demo', toast: 'toast',
      cap: 'demo-caption', capStep: 'cap-step', capText: 'cap-text', cursor: 'demo-cursor',
      panel: 'panel', tabFaq: 'tab-faq', tabBook: 'tab-book', paneFaq: 'pane-faq', paneBook: 'pane-book', faqList: 'faq-list', faqSearch: 'faq-search',
      bkForm: 'booking-form', bkName: 'bk-name', bkPhone: 'bk-phone', bkDays: 'bk-days', bkSlots: 'bk-slots', bkNote: 'bk-note',
      bkSubmit: 'bk-submit', bkSumText: 'bk-sum-text', noteCount: 'note-count', slotHint: 'slot-hint', errForm: 'err-form',
      mineSection: 'mine-section', mineList: 'mine-list', mineCount: 'mine-count',
      cDialog: 'confirm-dialog', cMsg: 'confirm-msg', cOk: 'confirm-ok', aboutDialog: 'about-dialog',
      stTotal: 'st-total', stPending: 'st-pending', stToday: 'st-today', search: 'adm-search', list: 'adm-list',
      clearDone: 'adm-clear-done', clearDoneCount: 'adm-clear-done-count', logPanel: 'adm-log-panel', logList: 'adm-unanswered',
      logCount: 'adm-unanswered-count', clearLog: 'adm-clear-log', storageNote: 'adm-storage-note',
      insQuestions: 'ins-questions', insAnswered: 'ins-answered', insAnsweredSub: 'ins-answered-sub', insFallback: 'ins-fallback',
      insBookings: 'ins-bookings', insSince: 'ins-since', insRank: 'ins-rank'
    };
    Object.keys(ids).forEach(function (k) { dom[k] = document.getElementById(ids[k]); });
  }

  function bindEvents() {
    dom.composer.addEventListener('submit', function (e) { e.preventDefault(); send(dom.input.value); });
    dom.input.addEventListener('input', function () { updateCounter(); lookAtCaret(); });
    dom.input.addEventListener('focus', lookAtCaret);
    document.addEventListener('pointermove', onPointerMove, { passive: true });

    dom.newChat.addEventListener('click', function () { startNewChat(false); });
    dom.histSearch.addEventListener('input', renderHistory);
    dom.histList.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('.hi') : null; if (b) openConvo(b.getAttribute('data-id')); });
    dom.histBtn.setAttribute('aria-expanded', 'false');
    dom.histBtn.setAttribute('aria-controls', 'side');
    dom.histBtn.addEventListener('click', openSide);
    $('#side-close').addEventListener('click', closeSide);
    $('#help-book').addEventListener('click', function () { openBooking({ source: 'direct' }); });
    $('#help-mine').addEventListener('click', openMine);
    dom.scrim.addEventListener('click', function () { closeSide(); if (!isWide()) closePanel(); });

    dom.panelBtn.addEventListener('click', togglePanel);
    $('#panel-close').addEventListener('click', function () { closePanel(); });
    $('#dock-faq').addEventListener('click', function () { if (isWide() && panelIsOpen() && panelTab === 'faq') { dom.faqSearch.focus(); return; } openPanel('faq', true); });
    $('#dock-book').addEventListener('click', function () { openBooking({ source: 'direct' }); });
    $('#faq-free').addEventListener('click', function () { if (!isWide()) closePanel(true); dom.input.focus(); });
    dom.faqSearch.addEventListener('input', function () { hidePop(true); renderFaqList(); });
    dom.faqList.addEventListener('click', onFaqClick);
    bindPop();
    [dom.tabFaq, dom.tabBook].forEach(function (t) {
      t.addEventListener('click', function () { selectTab(t === dom.tabBook ? 'book' : 'faq'); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          var to = e.key === 'Home' ? 'faq' : e.key === 'End' ? 'book' : (panelTab === 'faq' ? 'book' : 'faq');
          selectTab(to, true);
        }
      });
    });

    dom.bkForm.addEventListener('submit', onSubmitBooking);
    [dom.bkDays, dom.bkSlots].forEach(function (g) {
      g.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('button') : null; if (b) pickInGroup(g, b); });
      g.addEventListener('keydown', function (e) { onGroupKey(g, e); });
    });
    dom.bkName.addEventListener('input', function () { setFieldError('name', ''); });
    dom.bkPhone.addEventListener('input', function () { setFieldError('phone', ''); });
    dom.bkNote.addEventListener('input', function () { updateNoteCount(); setFieldError('note', ''); });
    dom.mineList.addEventListener('click', onMineClick);

    $('#btn-about').addEventListener('click', openAbout);
    $('#about-demo').addEventListener('click', function () { closeDialog(dom.aboutDialog); Demo.run(); });
    dom.demoBtn.addEventListener('click', function () { Demo.run(); });
    $('#cap-stop').addEventListener('click', function () { Demo.stop(); });
    $all('[data-close]', dom.aboutDialog).forEach(function (b) { b.addEventListener('click', function () { closeDialog(dom.aboutDialog); }); });
    dom.aboutDialog.addEventListener('click', function (e) { if (e.target === dom.aboutDialog) closeDialog(dom.aboutDialog); }); // bấm ra ngoài để đóng

    dom.search.addEventListener('input', renderAdmin);
    $all('[data-filter]', dom.viewAdmin).forEach(function (b) {
      b.addEventListener('click', function () { admFilter = b.getAttribute('data-filter'); renderAdmin(); });
    });
    dom.list.addEventListener('click', onAdminListClick);
    dom.clearDone.addEventListener('click', function () {
      var n = B.loadAppointments().list.filter(B.isClosed).length;
      if (!n) return;
      confirmDialog('Xóa ' + n + ' lịch hẹn đã xử lý xong (đã gọi lại hoặc khách đã hủy)? Thao tác không thể hoàn tác.', 'Xóa ' + n + ' lịch').then(function (ok) {
        if (!ok) return;
        var k = B.removeDone();
        renderAdmin();
        refreshMine();
        toast('Đã xóa ' + k + ' lịch hẹn đã xử lý.', 'success');
      });
    });
    $('#adm-export').addEventListener('click', exportCSV);
    $('#adm-seed').addEventListener('click', function () {
      var n = B.seedSamples();
      renderAdmin();
      toast(n ? 'Đã thêm ' + n + ' lịch hẹn mẫu (gắn nhãn “Dữ liệu mẫu”).' : 'Không còn khung giờ trống để thêm dữ liệu mẫu.', n ? 'success' : 'warn');
    });
    dom.clearLog.addEventListener('click', function () {
      confirmDialog('Xóa nhật ký câu hỏi bot chưa trả lời được?', 'Xóa nhật ký').then(function (ok) {
        if (!ok) return;
        B.clearUnanswered();
        renderAdmin();
        toast('Đã xóa nhật ký.', 'success');
      });
    });
    $('#adm-reset').addEventListener('click', function () {
      confirmDialog('Đặt lại TOÀN BỘ dữ liệu demo (lịch hẹn, nhật ký, số liệu, lịch sử trò chuyện) trên trình duyệt này?', 'Đặt lại').then(function (ok) {
        if (!ok) return;
        B.clearAll();
        convos = [];
        startNewChat(true);
        bk.date = ''; bk.time = '';
        renderAdmin();
        refreshMine();
        renderMine();
        toast('Đã đặt lại dữ liệu demo.', 'success');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || anyDialogOpen()) return;
      if (dom.app.classList.contains('side-open')) { closeSide(); dom.histBtn.focus(); }
      else if (panelIsOpen() && !isWide()) closePanel();
      else hidePop(true);
    });
    window.addEventListener('hashchange', route);
    window.addEventListener('resize', function () { hidePop(true); });
    if (mqWide.addEventListener) { mqWide.addEventListener('change', onLayoutChange); mqPhone.addEventListener('change', onLayoutChange); }
    window.addEventListener('storage', function (e) { // đồng bộ khi khách đặt lịch ở tab khác
      if (e.key && e.key.indexOf('vibe4.') !== 0) return;
      if (e.key === CONV_KEY || !e.key) {
        convos = loadConvos();
        renderHistory();
      }
      refreshBadges();
      refreshMine();
      if (currentView() === 'admin') renderAdmin();
      if (!dom.paneBook.hidden) { renderBookingPicker(); renderMine(); }
    });
  }

  function init() {
    cacheDom();
    hydrateIcons(document);
    $('#side-close').innerHTML = icon('x', 16);
    dom.hint.setAttribute('data-default', dom.hint.textContent);
    readUiPref();
    renderFaqList();
    bindEvents();
    if (B.storageMode() !== 'local') $('#storage-warning').hidden = false;
    var loaded = B.loadAppointments();
    if (loaded.corrupted) {
      corruptedNotified = true;
      toast('Dữ liệu lịch hẹn trong trình duyệt bị lỗi định dạng nên đã được khởi tạo lại (bản lỗi đã được sao lưu).', 'warn', 6000);
    }
    updateCounter();
    updateNoteCount();
    convos = loadConvos();
    if (convos.length) { // mở lại cuộc trò chuyện gần nhất
      current = convos[0];
      bot.setState(current.state);
      renderLog(current.msgs);
    } else {
      current = newConvo();
      renderLog([]);
    }
    renderHistory();
    renderConvTitle();
    selectTab('faq');
    onLayoutChange(); // màn nhỏ: bảng phải đóng sẵn, chỉ nổi lên khi bấm
    route();
    refreshBadges(loaded.list);
    refreshMine();
    // Móc nhỏ phục vụ kiểm thử tự động (E2E) — không ảnh hưởng người dùng
    window.VCApp = {
      demo: Demo,
      send: send,
      openBooking: openBooking,
      openMine: openMine,
      openAbout: openAbout,
      openPanel: openPanel,
      closePanel: closePanel,
      newChat: function () { startNewChat(true); },
      resetChat: function () { startNewChat(true); },
      renderAdmin: renderAdmin,
      convos: function () { return convos.slice(); },
      currentId: function () { return current && current.id; },
      lastBookedId: function () { return lastBookedId; },
      isBusy: function () { return busy; }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
