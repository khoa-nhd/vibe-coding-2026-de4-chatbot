/*!
 * app.js — Giao diện: khung chat, form đặt lịch, trang quản trị, demo tự động 5 tính năng
 * Đề 4 · VIBE-CODING 2026 · Bản demo vòng loại - Dữ liệu mô phỏng AI
 *
 * An toàn: mọi nội dung do người dùng nhập chỉ được đưa vào trang bằng textContent / setAttribute
 * (không dùng innerHTML với dữ liệu người dùng) → chống chèn mã HTML/JS.
 */
(function () {
  'use strict';
  var VC = window.VC;
  var B = VC.booking;
  var BRAND = VC.BRAND;
  var TYPING_MS = 650; // hiệu ứng "đang soạn" cho giống trải nghiệm chat

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
        else if (k === 'html') node.innerHTML = v; // CHỈ dùng cho chuỗi tin cậy: icon tĩnh, nội dung bộ kiến thức đã escape
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
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function timeNow() { return B.fromMin(B.vnNow().minutes); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var finePointer = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);

  var ICONS = {
    bot: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="4" y="7" width="16" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9.5" cy="13" r="1.6" fill="currentColor"/><circle cx="14.5" cy="13" r="1.6" fill="currentColor"/><path d="M12 3.5V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 6 4.5 10.5 9 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10.5h8.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor"/></svg>'
  };

  var dom = {};
  var bot = VC.createBot();
  var busy = false;

  /* ---------------- Khung chat ---------------- */
  function scrollToMessage(node) {
    var log = dom.log;
    if (!node) { log.scrollTop = log.scrollHeight; return; }
    // Câu trả lời dài: giữ câu hỏi của khách ở mép trên để đọc liền mạch; nếu không đủ chỗ thì neo đầu câu trả lời
    var prev = node.previousElementSibling;
    var anchor = prev && prev.classList.contains('user') && node.offsetHeight + prev.offsetHeight + 40 <= log.clientHeight * 1.6 ? prev : node;
    var bottom = node.offsetTop + node.offsetHeight;
    if (bottom - anchor.offsetTop > log.clientHeight - 16) log.scrollTop = Math.max(0, anchor.offsetTop - 12);
    else log.scrollTop = log.scrollHeight;
  }

  function addUser(text) {
    var msg = el('div', { class: 'msg user' }, [
      el('div', { class: 'bubble' }, [el('p', { text: text }), el('time', { class: 'msg-time', text: timeNow() })])
    ]);
    dom.log.appendChild(msg);
    scrollToMessage(msg);
    return msg;
  }

  function chip(s, extraClass) {
    return el('button', {
      type: 'button',
      class: 'chip' + (extraClass ? ' ' + extraClass : ''),
      'data-faq': s.id || null,
      text: s.text,
      onclick: function () { send(s.text, s.id ? { faqId: s.id } : null); }
    });
  }

  function addBot(res) {
    var bubble = el('div', { class: 'bubble' });
    (res.paragraphs || []).forEach(function (p) { bubble.appendChild(el('p', { html: md(p) })); });
    if (res.bullets && res.bullets.length) {
      var ul = el('ul', { class: 'points' });
      res.bullets.forEach(function (b) { ul.appendChild(el('li', { html: md(b) })); });
      bubble.appendChild(ul);
    }
    if (res.closing) bubble.appendChild(el('p', { class: 'closing', html: md(res.closing) }));
    if (res.menu && res.menu.length) {
      var menu = el('div', { class: 'menu' });
      res.menu.forEach(function (m) { menu.appendChild(chip(m, 'chip-menu')); });
      bubble.appendChild(menu);
    }

    var meta = el('div', { class: 'msg-meta' });
    if (res.type === 'answer') {
      meta.appendChild(el('span', { class: 'tag tag-src', text: 'Nguồn: FAQ ' + pad2(res.faqNo) + ' · ' + res.category }));
      meta.appendChild(el('span', { class: 'tag tag-ai', text: 'AI mô phỏng' }));
    } else if (res.type === 'fallback') {
      meta.appendChild(el('span', { class: 'tag tag-warn', text: 'Ngoài bộ kiến thức' }));
    } else if (res.type === 'confirm') {
      meta.appendChild(el('span', { class: 'tag tag-ok', text: 'Đã lưu vào localStorage' }));
    }
    meta.appendChild(el('time', { class: 'msg-time', text: timeNow() }));
    bubble.appendChild(meta);

    if (res.type === 'answer' && res.original) {
      var why = res.matchedBy === 'chip'
        ? 'Bạn chọn câu hỏi có sẵn nên bot lấy thẳng FAQ ' + pad2(res.faqNo) + '.'
        : 'Bot chọn FAQ ' + pad2(res.faqNo) + ' vì khớp từ khóa: ' + (res.hits || []).join(', ') + ' (điểm ' + Number(res.score).toFixed(1) +
          ', ngưỡng ' + VC.engine.ANSWER_THRESHOLD.toFixed(1) + ')' + (res.corrections && res.corrections.length ? '; tự sửa lỗi gõ: ' + res.corrections.join(', ') : '') + '.';
      bubble.appendChild(el('details', { class: 'origin' }, [
        el('summary', { text: 'Xem câu trả lời gốc trong bộ kiến thức' }),
        el('p', { class: 'origin-text', text: res.original }),
        el('p', { class: 'origin-note', text: why + ' Phần diễn đạt phía trên do AI mô phỏng (mock) tạo từ câu gốc này — mẫu câu số ' + res.variant + '.' })
      ]));
    }

    if (res.actions && res.actions.length) {
      var acts = el('div', { class: 'msg-actions' });
      res.actions.forEach(function (a) {
        if (a.type !== 'booking') return;
        acts.appendChild(el('button', {
          type: 'button',
          class: 'btn primary btn-book',
          html: ICONS.cal + '<span>' + escapeHtml(a.label) + '</span>',
          onclick: function () { openBooking({ note: a.note || '', source: a.source || 'direct' }); }
        }));
      });
      bubble.appendChild(acts);
    }

    if ((res.suggestions && res.suggestions.length) || res.showMenuLink) {
      var box = el('div', { class: 'suggest' }, [
        el('p', { class: 'suggest-label', text: res.type === 'fallback' ? 'Có thể bạn muốn hỏi:' : res.type === 'answer' ? 'Gợi ý câu hỏi liên quan:' : 'Câu hỏi thường gặp:' })
      ]);
      var row = el('div', { class: 'chips' });
      (res.suggestions || []).forEach(function (s) { row.appendChild(chip(s)); });
      if (res.showMenuLink) {
        row.appendChild(el('button', {
          type: 'button', class: 'chip chip-ghost', html: ICONS.list + '<span>Xem 10 câu hỏi</span>',
          onclick: function () { send('Xem 10 câu hỏi'); }
        }));
      }
      box.appendChild(row);
      bubble.appendChild(box);
    }

    var msg = el('div', { class: 'msg bot' + (res.type === 'fallback' ? ' is-fallback' : ''), 'data-type': res.type }, [
      el('div', { class: 'avatar', html: ICONS.bot }),
      bubble
    ]);
    dom.log.appendChild(msg);
    scrollToMessage(msg);
    return msg;
  }

  function showTyping() {
    var node = el('div', { class: 'msg bot typing', 'aria-label': 'Trợ lý đang soạn câu trả lời' }, [
      el('div', { class: 'avatar', html: ICONS.bot }),
      el('div', { class: 'bubble' }, [el('span', { class: 'dot' }), el('span', { class: 'dot' }), el('span', { class: 'dot' })])
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
    addUser(clean);
    dom.input.value = '';
    updateCounter();
    var typing = showTyping();
    return delay(TYPING_MS).then(function () {
      var res = bot.reply(clean, opts || null);
      typing.remove();
      if (!res) return null;
      if (res.type === 'fallback' && res.reason !== 'empty') { B.logUnanswered(clean); refreshBadges(); }
      var node = addBot(res);
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
      if (finePointer && !Demo.running() && !anyDialogOpen()) dom.input.focus();
      return node;
    });
  }

  function resetChat() {
    bot.reset();
    dom.log.innerHTML = '';
    addBot(bot.welcome());
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
  function anyDialogOpen() { return !!(dom.bkDialog.open || dom.cDialog.open); }

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

  /* ---------------- Đặt lịch ---------------- */
  var bookingSource = 'direct';
  var saving = false;
  var lastBookedId = null;
  var FIELDS = ['name', 'phone', 'date', 'time', 'note'];

  function fieldInput(k) {
    return { name: dom.bkName, phone: dom.bkPhone, date: dom.bkDate, time: dom.bkTime, note: dom.bkNote }[k];
  }
  function setFieldError(k, message) {
    var p = $('#err-' + k);
    var input = fieldInput(k);
    if (p) p.textContent = message || '';
    if (input) { if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function clearErrors() {
    FIELDS.forEach(function (k) { setFieldError(k, ''); });
    dom.errForm.textContent = '';
  }
  function showErrors(errors) {
    var first = null;
    FIELDS.forEach(function (k) {
      setFieldError(k, errors[k] || '');
      if (errors[k] && !first) first = fieldInput(k);
    });
    dom.errForm.textContent = errors._form || (first ? 'Vui lòng kiểm tra lại các ô được đánh dấu đỏ.' : '');
    if (first) { try { (first.disabled ? dom.bkDate : first).focus(); } catch (e) { /* bỏ qua */ } }
  }

  function updateNoteCount() {
    var n = dom.bkNote.value.length;
    dom.noteCount.textContent = n + '/' + B.CONFIG.noteMax;
  }

  function refreshSlots(showDateError) {
    var now = B.vnNow();
    var list = B.loadAppointments().list;
    var date = dom.bkDate.value;
    var prev = dom.bkTime.value;
    var dv = B.validateDate(date, now, list);
    dom.bkTime.innerHTML = '';
    if (dv.error) {
      dom.bkTime.appendChild(el('option', { value: '', text: 'Chọn ngày hợp lệ trước' }));
      dom.bkTime.disabled = true;
      dom.slotHint.textContent = '';
      if (showDateError && date) setFieldError('date', dv.error);
      return;
    }
    setFieldError('date', '');
    dom.bkTime.disabled = false;
    dom.bkTime.appendChild(el('option', { value: '', text: '— Chọn giờ —' }));
    var free = 0;
    var slots = B.getSlots(date, list, now);
    slots.forEach(function (s) {
      var label = s.time + (s.reason === 'past' ? ' · đã qua' : s.reason === 'booked' ? ' · đã có lịch' : '');
      dom.bkTime.appendChild(el('option', { value: s.time, text: label, disabled: !s.available }));
      if (s.available) free++;
    });
    if (prev && slots.some(function (s) { return s.time === prev && s.available; })) dom.bkTime.value = prev;
    dom.slotHint.textContent = B.formatDate(date) + ' · còn ' + free + '/' + slots.length + ' khung giờ trống (giờ Việt Nam).';
  }

  // Danh sách ngày dạng "Thứ Tư, 11/11" — tránh ô chọn ngày của trình duyệt hiển thị theo kiểu Mỹ (11/09 dễ hiểu nhầm thành 11 tháng 9)
  function fillDateOptions(list, now) {
    dom.bkDate.innerHTML = '';
    dom.bkDate.appendChild(el('option', { value: '', text: '— Chọn ngày —' }));
    for (var i = 0; i <= B.CONFIG.maxDaysAhead; i++) {
      var d = B.addDays(now.date, i);
      var short = B.formatShortDate(d);
      var label = i === 0 ? 'Hôm nay (' + short + ')' : i === 1 ? 'Ngày mai (' + short + ')' : B.formatDate(d).replace(/\/\d{4}$/, '');
      var reason = !B.isOpenDay(d) ? 'nghỉ' : B.getSlots(d, list, now).some(function (s) { return s.available; }) ? '' : (i === 0 ? 'hết giờ' : 'kín lịch');
      dom.bkDate.appendChild(el('option', { value: d, text: label + (reason ? ' · ' + reason : ''), disabled: !!reason }));
    }
  }

  function openBooking(opts) {
    opts = opts || {};
    bookingSource = opts.source || 'direct';
    dom.bkForm.reset();
    clearErrors();
    var now = B.vnNow();
    var list = B.loadAppointments().list;
    fillDateOptions(list, now);
    dom.bkDate.value = B.nextAvailableDate(list, now) || '';
    dom.bkNote.value = String(opts.note || '').slice(0, B.CONFIG.noteMax);
    updateNoteCount();
    refreshSlots(false);
    saving = false;
    dom.bkSubmit.disabled = false;
    showDialog(dom.bkDialog);
    setTimeout(function () { try { dom.bkName.focus(); } catch (e) { /* bỏ qua */ } }, 40);
  }

  function onSubmitBooking(e) {
    e.preventDefault();
    if (saving) return; // chặn bấm lưu 2 lần
    saving = true;
    dom.bkSubmit.disabled = true;
    dom.bkSubmit.textContent = 'Đang lưu…';
    var res;
    try {
      res = B.add({
        name: dom.bkName.value,
        phone: dom.bkPhone.value,
        date: dom.bkDate.value,
        time: dom.bkTime.value,
        note: dom.bkNote.value
      }, { source: bookingSource });
    } catch (err) {
      if (window.console) console.error(err);
      res = { ok: false, errors: { _form: 'Đã có lỗi khi lưu lịch hẹn. Vui lòng thử lại.' } };
    }
    saving = false;
    dom.bkSubmit.disabled = false;
    dom.bkSubmit.textContent = 'Xác nhận đặt lịch';
    if (!res.ok) {
      showErrors(res.errors);
      if (res.errors.time) refreshSlots(false); // khung giờ có thể vừa bị tab khác đặt mất
      return;
    }
    lastBookedId = res.record.id;
    closeDialog(dom.bkDialog);
    var r = res.record;
    var msg = bot.systemMessage([
      '✅ **Đặt lịch thành công!** Mã lịch hẹn **#' + B.codeOf(r) + '**.',
      'Thời gian: **' + B.formatDate(r.date) + ' lúc ' + r.time + '** (giờ Việt Nam).',
      'Nhân viên {brand} sẽ gọi số **' + B.maskPhone(r.phone) + '** đúng giờ hẹn. Trong lúc chờ, bạn cứ hỏi tiếp mình nhé!'
    ]);
    msg.type = 'confirm';
    addBot(msg);
    toast('Đã lưu lịch hẹn ' + r.time + ', ' + B.formatDate(r.date) + '.', 'success');
    refreshBadges();
    if (currentView() === 'admin') renderAdmin();
  }

  /* ---------------- Quản trị ---------------- */
  var admFilter = 'all';
  function isPending(r) { return r.status !== 'done'; }

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
      totalCount ? null : el('p', { class: 'muted', text: 'Hãy đặt thử từ màn hình Tư vấn, hoặc bấm “Thêm dữ liệu mẫu” để xem giao diện quản trị.' })
    ]);
  }

  function apptCard(r, now) {
    var done = r.status === 'done';
    var dayTag = r.date === now.date ? el('span', { class: 'tag tag-today', text: 'Hôm nay' })
      : r.date < now.date ? el('span', { class: 'tag tag-past', text: 'Đã qua ngày hẹn' }) : null;
    return el('article', { class: 'appt' + (done ? ' done' : ''), 'data-id': r.id }, [
      el('div', { class: 'appt-when' }, [el('b', { text: r.time }), el('span', { text: B.formatDate(r.date) }), dayTag]),
      el('div', { class: 'appt-body' }, [
        el('h3', null, [el('span', { text: r.name }), r.sample ? el('span', { class: 'tag tag-sample', text: 'Dữ liệu mẫu' }) : null]),
        el('a', { class: 'appt-phone', href: 'tel:' + r.phone, text: B.formatPhone(r.phone) }),
        r.note ? el('p', { class: 'appt-note', text: '“' + r.note + '”' }) : null,
        el('p', { class: 'appt-meta', text: (B.SOURCE_LABEL[r.source] || 'Không rõ nguồn') + ' · Đặt lúc ' + (B.formatISO(r.createdAt) || '—') + ' · Mã #' + B.codeOf(r) })
      ]),
      el('div', { class: 'appt-actions' }, [
        el('span', { class: 'status ' + (done ? 'done' : 'pending'), text: B.STATUS_LABEL[done ? 'done' : 'pending'] }),
        el('button', {
          type: 'button', class: 'btn small ' + (done ? 'ghost' : 'success'), 'data-act': 'toggle', 'data-id': r.id,
          html: (done ? ICONS.undo : ICONS.check) + '<span>' + (done ? 'Chưa xử lý' : 'Đã xử lý') + '</span>'
        }),
        el('button', { type: 'button', class: 'btn small danger-ghost', 'data-act': 'delete', 'data-id': r.id, html: ICONS.trash + '<span>Xóa</span>' })
      ])
    ]);
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
    var pending = list.filter(isPending).length;
    var done = list.length - pending;
    var logs = B.listUnanswered();
    dom.stTotal.textContent = list.length;
    dom.stPending.textContent = pending;
    dom.stToday.textContent = list.filter(function (r) { return r.date === now.date; }).length;
    dom.stUnanswered.textContent = logs.length;
    dom.clearDone.disabled = done === 0;
    dom.clearDoneCount.textContent = done;

    var q = VC.normalize(dom.search.value);
    var qDigits = dom.search.value.replace(/\D/g, '');
    var shown = list.filter(function (r) {
      if (admFilter === 'pending' && !isPending(r)) return false;
      if (admFilter === 'done' && isPending(r)) return false;
      if (!q) return true;
      return VC.normalize(r.name).indexOf(q) > -1 || VC.normalize(r.note || '').indexOf(q) > -1 ||
        (qDigits.length >= 3 && r.phone.indexOf(qDigits) > -1);
    });
    dom.list.innerHTML = '';
    if (!shown.length) dom.list.appendChild(emptyState(list.length));
    else shown.forEach(function (r) { dom.list.appendChild(apptCard(r, now)); });

    dom.logList.innerHTML = '';
    dom.logCount.textContent = logs.length;
    if (!logs.length) dom.logList.appendChild(el('li', { class: 'muted-item', text: 'Chưa có câu hỏi nào bị bỏ lỡ.' }));
    else logs.slice(0, 20).forEach(function (l) { dom.logList.appendChild(el('li', null, [el('span', { text: l.text }), el('time', { text: B.formatISO(l.at) })])); });
    dom.clearLog.disabled = !logs.length;

    $all('[data-filter]', dom.viewAdmin).forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filter') === admFilter ? 'true' : 'false');
    });
    dom.storageNote.textContent = B.storageMode() === 'local'
      ? 'Dữ liệu lưu trên trình duyệt này (localStorage) — không gửi đi đâu, thiết bị khác sẽ không thấy.'
      : 'Trình duyệt đang chặn localStorage: dữ liệu chỉ giữ tạm đến khi tải lại trang.';
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
      toast(next === 'done' ? 'Đã đánh dấu “Đã xử lý” cho lịch của ' + rec.name + '.' : 'Đã chuyển lịch của ' + rec.name + ' về “Chờ xử lý”.', 'success');
    } else {
      confirmDialog('Xóa lịch hẹn của ' + rec.name + ' (' + rec.time + ', ' + B.formatDate(rec.date) + ')?' +
        (rec.status !== 'done' ? ' Lưu ý: lịch này CHƯA được xử lý.' : '') + ' Thao tác không thể hoàn tác.', 'Xóa lịch').then(function (ok) {
        if (!ok) return;
        B.remove(id);
        renderAdmin();
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
    dom.viewChat.hidden = view !== 'chat';
    dom.viewAdmin.hidden = view !== 'admin';
    $all('[data-route]').forEach(function (a) {
      if (a.getAttribute('data-route') === view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = (view === 'admin' ? 'Quản trị lịch hẹn' : 'Chatbot tư vấn') + ' · ' + BRAND.name + ' — Đề 4 (bản demo vòng loại)';
    if (view === 'admin') renderAdmin();
    else scrollToMessage(null);
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

  /* ---------------- Demo tự động 5 tính năng (thao tác trên chính giao diện thật) ---------------- */
  var Demo = (function () {
    var running = false;
    var cancelled = false;
    function guard() { if (cancelled) throw new Error('demo-cancelled'); }
    function wait(ms) { return delay(ms).then(guard); }
    function placeCaption() {
      var host = dom.cDialog.open ? dom.cDialog : dom.bkDialog.open ? dom.bkDialog : document.body;
      if (dom.cap.parentNode !== host) host.appendChild(dom.cap);
    }
    function caption(step, text) {
      placeCaption();
      dom.capStep.textContent = step;
      dom.capText.textContent = text;
      dom.cap.hidden = false;
    }
    function ring(node) {
      if (!node) return;
      node.classList.add('demo-focus');
      setTimeout(function () { node.classList.remove('demo-focus'); }, 1600);
    }
    function click(node) {
      guard();
      if (!node) throw new Error('không tìm thấy nút cần bấm');
      ring(node);
      return wait(600).then(function () { node.click(); });
    }
    function type(input, text, cps) {
      guard();
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
    function lastBot() { var all = $all('.msg.bot:not(.typing)', dom.log); return all[all.length - 1]; }
    async function ask(text) {
      await type(dom.input, text, 24);
      await wait(350);
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
        closeDialog(dom.bkDialog);
        closeDialog(dom.cDialog);
        if (currentView() !== 'chat') { location.hash = '#/chat'; await wait(400); }
        resetChat();
        caption('Demo', 'Đề 4 · Chatbot FAQ & đặt lịch tư vấn — demo tự động trên giao diện thật');
        await wait(3000);

        caption('1/5', 'Khung chat trả lời câu hỏi thường gặp từ bộ kiến thức có sẵn (10 câu)');
        var m1 = await ask('Nên chọn tên miền .vn hay .com cho shop online?');
        await wait(5500);

        caption('2/5', 'AI diễn đạt lại cho tự nhiên (xem được câu gốc) + gợi ý 3 câu hỏi liên quan');
        var det = $('details.origin', m1);
        ring(det);
        await wait(700);
        det.open = true;
        scrollToMessage(m1);
        await wait(5000);
        var chips = $all('.suggest .chip', m1);
        chips.forEach(function (c) { c.classList.add('demo-focus'); });
        await wait(1800);
        chips.forEach(function (c) { c.classList.remove('demo-focus'); });
        await click(chips[0]);
        await waitFor(function () { return !busy; });
        await wait(5000);
        caption('2/5', 'Gõ không dấu vẫn hiểu — mỗi câu trả lời luôn kèm 3 gợi ý mới');
        await ask('ssl co mien phi khong');
        await wait(5000);

        caption('3/5', 'Câu hỏi ngoài bộ kiến thức → không đoán mò, chủ động đề xuất đặt lịch với nhân viên');
        var m3 = await ask('Bên bạn có nhận thiết kế logo cho shop không?');
        await wait(4500);
        await click($('.btn-book', m3));
        await waitFor(function () { return dom.bkDialog.open; });
        caption('4/5', 'Form đặt lịch: chọn ngày/giờ, nhập tên + số điện thoại → lưu localStorage');
        await wait(2500);
        await click(dom.bkSubmit);
        caption('4/5', 'Gửi khi còn thiếu thông tin → báo lỗi ngay dưới từng ô, không lưu');
        await wait(3200);
        await type(dom.bkName, 'Nguyễn Thị Lan', 16);
        await type(dom.bkPhone, '0900 123 456', 12);
        await wait(500);
        var opt = Array.prototype.filter.call(dom.bkTime.options, function (o) { return o.value && !o.disabled; })[0];
        if (!opt) throw new Error('không còn khung giờ trống');
        ring(dom.bkTime);
        await wait(700);
        dom.bkTime.value = opt.value;
        dom.bkTime.dispatchEvent(new Event('change', { bubbles: true }));
        setFieldError('time', '');
        caption('4/5', 'Ngày gợi ý sẵn là ngày làm việc gần nhất; giờ đã qua hoặc đã có người đặt bị khóa');
        await wait(3000);
        await click(dom.bkSubmit);
        await waitFor(function () { return !dom.bkDialog.open; });
        caption('4/5', 'Đã lưu lịch hẹn — chatbot xác nhận ngay trong khung chat');
        await wait(4500);

        caption('5/5', 'Trang quản trị: xem danh sách lịch hẹn và câu hỏi bot chưa trả lời được');
        location.hash = '#/admin';
        await wait(600);
        var sel = '.appt[data-id="' + lastBookedId + '"]';
        var card = await waitFor(function () { return $(sel, dom.list); });
        card.scrollIntoView({ block: 'center' });
        ring(card);
        await wait(3500);
        dom.logPanel.scrollIntoView({ block: 'center' });
        ring(dom.logPanel);
        await wait(3000);
        card = $(sel, dom.list);
        card.scrollIntoView({ block: 'center' });
        caption('5/5', 'Nhân viên gọi lại xong → bấm “Đã xử lý”, sau đó xóa lịch đã xử lý');
        await wait(1200);
        await click($('[data-act="toggle"]', card));
        await wait(2500);
        card = $(sel, dom.list);
        await click($('[data-act="delete"]', card));
        await waitFor(function () { return dom.cDialog.open; });
        placeCaption();
        await wait(1600);
        await click(dom.cOk);
        await waitFor(function () { return !dom.cDialog.open; });
        caption('✓', 'Hoàn tất 5/5 tính năng · Bản demo vòng loại - Dữ liệu mô phỏng AI');
        await wait(4500);
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
        if (dom.cap.parentNode !== document.body) document.body.appendChild(dom.cap);
        dom.cap.hidden = true;
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
    dom.viewChat = $('#view-chat');
    dom.viewAdmin = $('#view-admin');
    dom.log = $('#chat-log');
    dom.composer = $('#composer');
    dom.input = $('#msg-input');
    dom.inputWrap = $('#composer .composer-field');
    dom.counter = $('#msg-counter');
    dom.send = $('#send-btn');
    dom.hint = $('#composer-hint');
    dom.topics = $('#topic-list');
    dom.navCount = $('#nav-admin-count');
    dom.demoBtn = $('#btn-demo');
    dom.toast = $('#toast');
    dom.cap = $('#demo-caption');
    dom.capStep = $('#cap-step');
    dom.capText = $('#cap-text');
    dom.bkDialog = $('#booking-dialog');
    dom.bkForm = $('#booking-form');
    dom.bkName = $('#bk-name');
    dom.bkPhone = $('#bk-phone');
    dom.bkDate = $('#bk-date');
    dom.bkTime = $('#bk-time');
    dom.bkNote = $('#bk-note');
    dom.bkSubmit = $('#bk-submit');
    dom.noteCount = $('#note-count');
    dom.slotHint = $('#slot-hint');
    dom.errForm = $('#err-form');
    dom.cDialog = $('#confirm-dialog');
    dom.cMsg = $('#confirm-msg');
    dom.cOk = $('#confirm-ok');
    dom.stTotal = $('#st-total');
    dom.stPending = $('#st-pending');
    dom.stToday = $('#st-today');
    dom.stUnanswered = $('#st-unanswered');
    dom.search = $('#adm-search');
    dom.list = $('#adm-list');
    dom.clearDone = $('#adm-clear-done');
    dom.clearDoneCount = $('#adm-clear-done-count');
    dom.logPanel = $('#adm-log-panel');
    dom.logList = $('#adm-unanswered');
    dom.logCount = $('#adm-unanswered-count');
    dom.clearLog = $('#adm-clear-log');
    dom.storageNote = $('#adm-storage-note');
  }

  function bindEvents() {
    dom.composer.addEventListener('submit', function (e) { e.preventDefault(); send(dom.input.value); });
    dom.input.addEventListener('input', updateCounter);
    $('#btn-new-chat').addEventListener('click', function () { if (!busy) resetChat(); });
    $('#btn-book-top').addEventListener('click', function () { openBooking({ source: 'direct' }); });
    $('#sidebar-book').addEventListener('click', function () { openBooking({ source: 'direct' }); });
    dom.demoBtn.addEventListener('click', function () { Demo.run(); });
    $('#cap-stop').addEventListener('click', function () { Demo.stop(); });

    dom.bkForm.addEventListener('submit', onSubmitBooking);
    dom.bkDate.addEventListener('change', function () { refreshSlots(true); });
    dom.bkTime.addEventListener('change', function () { setFieldError('time', ''); });
    dom.bkName.addEventListener('input', function () { setFieldError('name', ''); });
    dom.bkPhone.addEventListener('input', function () { setFieldError('phone', ''); });
    dom.bkNote.addEventListener('input', function () { updateNoteCount(); setFieldError('note', ''); });
    $all('[data-close]', dom.bkDialog).forEach(function (b) { b.addEventListener('click', function () { closeDialog(dom.bkDialog); }); });
    dom.bkDialog.addEventListener('click', function (e) { if (e.target === dom.bkDialog && !Demo.running()) closeDialog(dom.bkDialog); });
    dom.bkDialog.addEventListener('close', function () { saving = false; dom.bkSubmit.disabled = false; });

    dom.search.addEventListener('input', renderAdmin);
    $all('[data-filter]', dom.viewAdmin).forEach(function (b) {
      b.addEventListener('click', function () { admFilter = b.getAttribute('data-filter'); renderAdmin(); });
    });
    dom.list.addEventListener('click', onAdminListClick);
    dom.clearDone.addEventListener('click', function () {
      var n = B.loadAppointments().list.filter(function (r) { return r.status === 'done'; }).length;
      if (!n) return;
      confirmDialog('Xóa ' + n + ' lịch hẹn đã xử lý? Thao tác không thể hoàn tác.', 'Xóa ' + n + ' lịch').then(function (ok) {
        if (!ok) return;
        var k = B.removeDone();
        renderAdmin();
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
      confirmDialog('Đặt lại TOÀN BỘ dữ liệu demo (lịch hẹn + nhật ký) trên trình duyệt này?', 'Đặt lại').then(function (ok) {
        if (!ok) return;
        B.clearAll();
        resetChat();
        renderAdmin();
        toast('Đã đặt lại dữ liệu demo.', 'success');
      });
    });

    window.addEventListener('hashchange', route);
    window.addEventListener('storage', function (e) { // đồng bộ khi khách đặt lịch ở tab khác
      if (e.key && e.key.indexOf('vibe4.') !== 0) return;
      refreshBadges();
      if (currentView() === 'admin') renderAdmin();
      if (dom.bkDialog.open) refreshSlots(false);
    });
  }

  function init() {
    cacheDom();
    $all('[data-brand]').forEach(function (n) { n.textContent = BRAND.name; });
    $all('[data-hours]').forEach(function (n) { n.textContent = BRAND.hoursText; });
    dom.hint.setAttribute('data-default', dom.hint.textContent);
    VC.FAQ.forEach(function (f) {
      dom.topics.appendChild(el('li', null, [
        el('button', { type: 'button', 'data-faq': f.id, onclick: function () { send(f.question, { faqId: f.id }); } }, [
          el('span', { class: 'topic-no', text: String(f.no) }),
          el('span', { text: f.question })
        ])
      ]));
    });
    bindEvents();
    if (B.storageMode() !== 'local') $('#storage-warning').hidden = false;
    var loaded = B.loadAppointments();
    if (loaded.corrupted) {
      corruptedNotified = true;
      toast('Dữ liệu lịch hẹn trong trình duyệt bị lỗi định dạng nên đã được khởi tạo lại (bản lỗi đã được sao lưu).', 'warn', 6000);
    }
    updateCounter();
    resetChat();
    route();
    refreshBadges(loaded.list);
    // Móc nhỏ phục vụ kiểm thử tự động (E2E) — không ảnh hưởng người dùng
    window.VCApp = {
      demo: Demo,
      send: send,
      openBooking: openBooking,
      resetChat: resetChat,
      renderAdmin: renderAdmin,
      lastBookedId: function () { return lastBookedId; },
      isBusy: function () { return busy; }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
