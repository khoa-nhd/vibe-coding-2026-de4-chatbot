/*!
 * booking.js — Đặt lịch tư vấn: kiểm tra dữ liệu, khung giờ, lưu danh sách lịch hẹn (localStorage)
 * Đề 4 · VIBE-CODING 2026 · Thuần logic, không dùng DOM → chạy được trên trình duyệt và trong Node.
 *
 * Quy ước thời gian: mọi phép tính theo GIỜ VIỆT NAM (GMT+7, không có giờ mùa hè), ngày dạng chuỗi "YYYY-MM-DD",
 * giờ dạng "HH:MM". Không dùng new Date("YYYY-MM-DD") vì trình duyệt hiểu chuỗi đó là giờ UTC.
 */
(function (root) {
  'use strict';
  var VC = (root.VC = root.VC || {});

  var CONFIG = {
    tzOffsetMinutes: 7 * 60,
    maxDaysAhead: 14,                                // nhận lịch từ hôm nay đến 14 ngày tới
    closedWeekdays: [0],                             // Chủ nhật nghỉ
    sessions: [['08:00', '11:30'], ['13:30', '17:00']], // ca làm việc (giờ VN)
    slotMinutes: 30,
    leadMinutes: 30,                                 // phải đặt trước ít nhất 30 phút
    capacityPerSlot: 1,                              // 1 nhân viên tư vấn / khung giờ
    nameMin: 2,
    nameMax: 50,
    noteMax: 200,
    unansweredMax: 50
  };
  var KEYS = { appts: 'vibe4.appointments.v1', unanswered: 'vibe4.unanswered.v1' };
  var WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  /* ---------------- Lưu trữ an toàn ---------------- */
  var store = (function () {
    var mem = {};
    var mode = 'memory';
    try {
      if (typeof root.localStorage !== 'undefined' && root.localStorage) {
        var probe = '__vibe4_probe__';
        root.localStorage.setItem(probe, '1');
        root.localStorage.removeItem(probe);
        mode = 'local';
      }
    } catch (e) {
      mode = 'memory'; // trình duyệt chặn lưu trữ (chế độ riêng tư, chính sách bảo mật…)
    }
    return {
      mode: function () { return mode; },
      useMemory: function () { mode = 'memory'; mem = {}; },
      get: function (key) {
        if (mode === 'local') {
          try { return root.localStorage.getItem(key); } catch (e) { return null; }
        }
        return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null;
      },
      set: function (key, value) { // có thể ném lỗi (bộ nhớ đầy) → nơi gọi tự xử lý
        if (mode === 'local') root.localStorage.setItem(key, value);
        else mem[key] = String(value);
      },
      remove: function (key) {
        if (mode === 'local') { try { root.localStorage.removeItem(key); } catch (e) { /* bỏ qua */ } }
        else delete mem[key];
      },
      keys: function () {
        if (mode === 'local') {
          var out = [];
          try { for (var i = 0; i < root.localStorage.length; i++) out.push(root.localStorage.key(i)); } catch (e) { /* bỏ qua */ }
          return out;
        }
        return Object.keys(mem);
      }
    };
  })();

  function readList(key, isValid) {
    var raw = store.get(key);
    if (raw == null || raw === '') return { list: [], corrupted: false };
    try {
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('not-array');
      var list = data.filter(isValid);
      return { list: list, corrupted: false, dropped: data.length - list.length };
    } catch (e) {
      // Dữ liệu hỏng: sao lưu bản lỗi rồi khởi tạo lại để ứng dụng không bị treo
      try { store.set(key + '.corrupt.' + Date.now(), raw); store.set(key, '[]'); } catch (e2) { /* bỏ qua */ }
      return { list: [], corrupted: true };
    }
  }
  function writeList(key, list) { store.set(key, JSON.stringify(list)); }

  /* ---------------- Thời gian (giờ Việt Nam) ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function vnParts(ms) {
    var t = new Date(ms + CONFIG.tzOffsetMinutes * 60000);
    return {
      date: t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()),
      minutes: t.getUTCHours() * 60 + t.getUTCMinutes()
    };
  }
  function vnNow(dateObj) { return vnParts(dateObj ? dateObj.getTime() : Date.now()); }
  function parseYMD(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var t = Date.UTC(y, mo - 1, d);
    var c = new Date(t);
    if (c.getUTCFullYear() !== y || c.getUTCMonth() !== mo - 1 || c.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d, t: t };
  }
  function weekday(s) { var p = parseYMD(s); return p ? new Date(p.t).getUTCDay() : -1; }
  function addDays(s, n) {
    var p = parseYMD(s);
    if (!p) return '';
    var c = new Date(p.t + n * 86400000);
    return c.getUTCFullYear() + '-' + pad(c.getUTCMonth() + 1) + '-' + pad(c.getUTCDate());
  }
  function diffDays(a, b) { return Math.round((parseYMD(b).t - parseYMD(a).t) / 86400000); }
  function toMin(hm) { var p = String(hm).split(':'); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function formatDate(s) {
    var p = parseYMD(s);
    if (!p) return String(s || '');
    return WEEKDAYS[weekday(s)] + ', ' + pad(p.d) + '/' + pad(p.m) + '/' + p.y;
  }
  function formatShortDate(s) { var p = parseYMD(s); return p ? pad(p.d) + '/' + pad(p.m) : String(s || ''); }
  function formatISO(iso) { // "HH:MM dd/mm/yyyy" theo giờ VN
    var ms = Date.parse(iso);
    if (isNaN(ms)) return '';
    var p = vnParts(ms);
    var d = parseYMD(p.date);
    return fromMin(p.minutes) + ' ' + pad(d.d) + '/' + pad(d.m) + '/' + d.y;
  }

  function slotTimes() {
    var out = [];
    CONFIG.sessions.forEach(function (ss) {
      for (var m = toMin(ss[0]); m + CONFIG.slotMinutes <= toMin(ss[1]); m += CONFIG.slotMinutes) out.push(fromMin(m));
    });
    return out;
  }
  function countAt(list, date, time) {
    var n = 0;
    (list || []).forEach(function (r) { if (r.date === date && r.time === time) n++; });
    return n;
  }
  function getSlots(date, list, now) {
    now = now || vnNow();
    return slotTimes().map(function (t) {
      var reason = null;
      if (date === now.date && toMin(t) < now.minutes + CONFIG.leadMinutes) reason = 'past';
      else if (countAt(list, date, t) >= CONFIG.capacityPerSlot) reason = 'booked';
      return { time: t, available: !reason, reason: reason };
    });
  }
  function isOpenDay(date) { return CONFIG.closedWeekdays.indexOf(weekday(date)) === -1; }
  function nextAvailableDate(list, now) {
    now = now || vnNow();
    for (var i = 0; i <= CONFIG.maxDaysAhead; i++) {
      var d = addDays(now.date, i);
      if (!isOpenDay(d)) continue;
      if (getSlots(d, list, now).some(function (s) { return s.available; })) return d;
    }
    return '';
  }

  /* ---------------- Kiểm tra dữ liệu nhập ---------------- */
  var NAME_RE = (function () {
    try { return new RegExp("^[\\p{L}\\p{M}]+(?:[ '.\\-][\\p{L}\\p{M}]+)*\\.?$", 'u'); }
    catch (e) { return /^[^0-9!@#$%^&*()_+=\[\]{};:"\\|,<>\/?~`]+$/; } // trình duyệt cũ không hỗ trợ \p{L}
  })();

  function validateName(raw) {
    var s = String(raw == null ? '' : raw);
    if (s.normalize) s = s.normalize('NFC');
    s = s.replace(/\s+/g, ' ').trim();
    if (!s) return { error: 'Vui lòng nhập họ và tên.' };
    if (s.length < CONFIG.nameMin || s.length > CONFIG.nameMax) return { error: 'Họ tên cần từ 2 đến 50 ký tự.' };
    if (!NAME_RE.test(s)) return { error: 'Họ tên chỉ gồm chữ cái và khoảng trắng (không chứa số hay ký hiệu).' };
    return { value: s };
  }

  function normalizePhone(raw) {
    var s = String(raw == null ? '' : raw).trim().replace(/[\s.\-()]/g, '');
    if (s.indexOf('+84') === 0) s = '0' + s.slice(3);
    else if (/^84\d{9,10}$/.test(s)) s = '0' + s.slice(2);
    return s;
  }
  function validatePhone(raw) {
    if (!String(raw == null ? '' : raw).trim()) return { error: 'Vui lòng nhập số điện thoại.' };
    var s = normalizePhone(raw);
    if (!/^\d+$/.test(s)) return { error: 'Số điện thoại chỉ gồm chữ số (được có dấu cách, dấu chấm hoặc +84).' };
    if (/^0[35789]\d{8}$/.test(s) || /^02\d{9}$/.test(s)) return { value: s };
    return { error: 'Số điện thoại chưa đúng định dạng Việt Nam (VD: 0912 345 678).' };
  }

  function validateDate(date, now, list) {
    now = now || vnNow();
    if (!date) return { error: 'Vui lòng chọn ngày hẹn.' };
    if (!parseYMD(date)) return { error: 'Ngày hẹn không hợp lệ.' };
    var d = diffDays(now.date, date);
    if (d < 0) return { error: 'Không thể đặt lịch cho ngày đã qua.' };
    if (d > CONFIG.maxDaysAhead) return { error: 'Chỉ nhận lịch trong vòng 14 ngày tới.' };
    if (!isOpenDay(date)) return { error: 'Chủ nhật nhân viên nghỉ, vui lòng chọn ngày khác.' };
    if (!getSlots(date, list, now).some(function (s) { return s.available; })) {
      return { error: d === 0 ? 'Hôm nay đã hết khung giờ trống, vui lòng chọn ngày khác.' : 'Ngày này đã kín lịch, vui lòng chọn ngày khác.' };
    }
    return { value: date };
  }

  function validateTime(date, time, now, list) {
    if (!time) return { error: 'Vui lòng chọn giờ hẹn.' };
    var slot = null;
    getSlots(date, list, now).forEach(function (s) { if (s.time === time) slot = s; });
    if (!slot) return { error: 'Giờ hẹn không nằm trong giờ làm việc.' };
    if (slot.reason === 'past') return { error: 'Khung giờ này đã qua (cần đặt trước ít nhất 30 phút), vui lòng chọn giờ khác.' };
    if (slot.reason === 'booked') return { error: 'Khung giờ này đã có khách đặt, vui lòng chọn giờ khác.' };
    return { value: time };
  }

  function validate(input, list, now) {
    input = input || {};
    list = list || [];
    now = now || vnNow();
    var errors = {};
    var value = {};
    var r = validateName(input.name);
    if (r.error) errors.name = r.error; else value.name = r.value;
    r = validatePhone(input.phone);
    if (r.error) errors.phone = r.error; else value.phone = r.value;
    r = validateDate(input.date, now, list);
    if (r.error) errors.date = r.error; else value.date = r.value;
    if (!errors.date) {
      r = validateTime(input.date, input.time, now, list);
      if (r.error) errors.time = r.error; else value.time = r.value;
    } else if (!input.time) {
      errors.time = 'Vui lòng chọn giờ hẹn.';
    }
    var note = String(input.note == null ? '' : input.note).replace(/\s+/g, ' ').trim();
    if (note.length > CONFIG.noteMax) errors.note = 'Nội dung tối đa 200 ký tự.'; else value.note = note;
    if (value.phone && value.date) {
      var dup = null;
      list.forEach(function (x) { if (x.phone === value.phone && x.date === value.date && x.status !== 'done') dup = x; });
      if (dup) errors.phone = 'Số này đã có lịch hẹn ' + formatShortDate(dup.date) + ' lúc ' + dup.time + ' đang chờ xử lý. Nhân viên sẽ liên hệ theo lịch đó.';
    }
    return { ok: Object.keys(errors).length === 0, errors: errors, value: value };
  }

  /* ---------------- Lịch hẹn ---------------- */
  function isValidAppt(r) {
    return !!r && typeof r === 'object' &&
      typeof r.id === 'string' && r.id.length > 0 &&
      typeof r.name === 'string' && r.name.length > 0 &&
      typeof r.phone === 'string' && /^\d{9,12}$/.test(r.phone) &&
      !!parseYMD(r.date) && /^\d{2}:\d{2}$/.test(String(r.time));
  }
  function makeId() {
    return 'lh' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function codeOf(rec) { return String(rec.id).slice(-6).toUpperCase(); }
  function sortAppts(list) {
    return list.slice().sort(function (a, b) {
      return a.date === b.date ? (a.time < b.time ? -1 : a.time > b.time ? 1 : 0) : (a.date < b.date ? -1 : 1);
    });
  }
  function loadAppointments() {
    var r = readList(KEYS.appts, isValidAppt);
    r.list = sortAppts(r.list);
    return r;
  }

  function add(input, opts) {
    opts = opts || {};
    var now = opts.now || vnNow();
    var loaded = loadAppointments(); // đọc lại ngay lúc lưu → bắt được trường hợp tab khác vừa đặt cùng khung giờ
    var v = validate(input, loaded.list, now);
    if (!v.ok) return v;
    var rec = {
      id: makeId(),
      name: v.value.name,
      phone: v.value.phone,
      date: v.value.date,
      time: v.value.time,
      note: v.value.note || '',
      source: opts.source || 'direct',
      sample: !!opts.sample,
      status: opts.status === 'done' ? 'done' : 'pending',
      createdAt: new Date().toISOString()
    };
    try {
      writeList(KEYS.appts, loaded.list.concat([rec]));
    } catch (e) {
      return { ok: false, errors: { _form: 'Không lưu được lịch hẹn (bộ nhớ trình duyệt đầy hoặc bị chặn). Vui lòng thử lại.' }, value: v.value };
    }
    var saved = loadAppointments().list.some(function (x) { return x.id === rec.id; }); // đọc lại để xác nhận đã lưu thật
    if (!saved) return { ok: false, errors: { _form: 'Không xác nhận được dữ liệu đã lưu. Vui lòng thử lại.' }, value: v.value };
    return { ok: true, record: rec, errors: {}, value: v.value };
  }

  function update(mutator) {
    var loaded = loadAppointments();
    var next = mutator(loaded.list.slice());
    writeList(KEYS.appts, next);
    return next;
  }
  function setStatus(id, status) {
    var found = false;
    update(function (list) {
      return list.map(function (r) {
        if (r.id !== id) return r;
        found = true;
        var copy = {};
        Object.keys(r).forEach(function (k) { copy[k] = r[k]; });
        copy.status = status === 'done' ? 'done' : 'pending';
        copy.updatedAt = new Date().toISOString();
        return copy;
      });
    });
    return found;
  }
  function remove(id) {
    var removed = 0;
    update(function (list) {
      return list.filter(function (r) { if (r.id === id) { removed++; return false; } return true; });
    });
    return removed;
  }
  function removeDone() {
    var removed = 0;
    update(function (list) {
      return list.filter(function (r) { if (r.status === 'done') { removed++; return false; } return true; });
    });
    return removed;
  }
  function getById(id) {
    var found = null;
    loadAppointments().list.forEach(function (r) { if (r.id === id) found = r; });
    return found;
  }

  var SAMPLE_PEOPLE = [
    { name: 'Trần Văn An', phone: '0900000101', note: 'Muốn chuyển website từ nhà cung cấp cũ sang (dữ liệu mẫu).', status: 'pending' },
    { name: 'Lê Thu Hà', phone: '0900000202', note: 'Hỏi về xuất hóa đơn VAT cho công ty (dữ liệu mẫu).', status: 'done' },
    { name: 'Phạm Quốc Bảo', phone: '0900000303', note: 'Tư vấn gói hosting cho shop mỹ phẩm (dữ liệu mẫu).', status: 'pending' }
  ];
  function seedSamples(now) {
    now = now || vnNow();
    var added = 0;
    var day = now.date;
    for (var i = 0; i < SAMPLE_PEOPLE.length; i++) {
      var p = SAMPLE_PEOPLE[i];
      var list = loadAppointments().list;
      var d = '';
      for (var k = 0; k <= CONFIG.maxDaysAhead && !d; k++) {
        var cand = addDays(day, k);
        if (isOpenDay(cand) && getSlots(cand, list, now).some(function (s) { return s.available; }) &&
            !list.some(function (x) { return x.phone === p.phone && x.date === cand; })) d = cand;
      }
      if (!d) break;
      var free = getSlots(d, list, now).filter(function (s) { return s.available; });
      var slot = free[Math.min(free.length - 1, 2 + i * 3)];
      var res = add({ name: p.name, phone: p.phone, date: d, time: slot.time, note: p.note }, { source: 'sample', sample: true, status: p.status, now: now });
      if (res.ok) added++;
      day = addDays(d, 1);
    }
    return added;
  }

  /* ---------------- Nhật ký câu hỏi bot chưa trả lời được ---------------- */
  function isValidLog(r) { return !!r && typeof r.text === 'string' && typeof r.at === 'string'; }
  function listUnanswered() { return readList(KEYS.unanswered, isValidLog).list; }
  function logUnanswered(text) {
    var t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!t) return false;
    var list = listUnanswered();
    list.unshift({ id: makeId(), text: t, at: new Date().toISOString() });
    try { writeList(KEYS.unanswered, list.slice(0, CONFIG.unansweredMax)); return true; } catch (e) { return false; }
  }
  function clearUnanswered() { store.remove(KEYS.unanswered); }

  function clearAll() {
    store.keys().forEach(function (k) { if (k && k.indexOf('vibe4.') === 0) store.remove(k); });
  }

  /* ---------------- Hiển thị & xuất dữ liệu ---------------- */
  function formatPhone(p) {
    p = String(p || '');
    if (p.length === 10) return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ' + p.slice(7);
    if (p.length === 11) return p.slice(0, 3) + ' ' + p.slice(3, 7) + ' ' + p.slice(7);
    return p;
  }
  function maskPhone(p) { // dùng "•••" thay cho "***" để không xung đột định dạng **đậm** trong khung chat
    p = String(p || '');
    return p.length >= 8 ? p.slice(0, 4) + ' ••• ' + p.slice(-3) : p;
  }
  var STATUS_LABEL = { pending: 'Chờ xử lý', done: 'Đã xử lý' };
  var SOURCE_LABEL = {
    'chat-fallback': 'Chatbot – câu hỏi ngoài bộ kiến thức',
    'chat-intent': 'Chatbot – khách yêu cầu gặp nhân viên',
    'chat-cta': 'Chatbot – sau khi xem câu trả lời',
    direct: 'Nút “Đặt lịch” trên đầu trang',
    sample: 'Dữ liệu mẫu (nút “Thêm dữ liệu mẫu”)'
  };
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // chặn chèn công thức khi mở bằng Excel
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function toCSV(list) {
    var head = ['Mã', 'Họ tên', 'Số điện thoại', 'Ngày', 'Giờ', 'Nội dung', 'Trạng thái', 'Nguồn', 'Dữ liệu mẫu', 'Tạo lúc (giờ VN)'];
    var rows = (list || []).map(function (r) {
      return [codeOf(r), r.name, r.phone, r.date, r.time, r.note, STATUS_LABEL[r.status] || r.status,
        SOURCE_LABEL[r.source] || r.source, r.sample ? 'Có' : 'Không', formatISO(r.createdAt)].map(csvCell).join(',');
    });
    return '\uFEFF' + [head.map(csvCell).join(',')].concat(rows).join('\r\n');
  }

  VC.booking = {
    CONFIG: CONFIG,
    KEYS: KEYS,
    store: store,
    storageMode: function () { return store.mode(); },
    vnNow: vnNow,
    parseYMD: parseYMD,
    weekday: weekday,
    addDays: addDays,
    diffDays: diffDays,
    toMin: toMin,
    fromMin: fromMin,
    formatDate: formatDate,
    formatShortDate: formatShortDate,
    formatISO: formatISO,
    slotTimes: slotTimes,
    getSlots: getSlots,
    isOpenDay: isOpenDay,
    nextAvailableDate: nextAvailableDate,
    validateName: validateName,
    validatePhone: validatePhone,
    normalizePhone: normalizePhone,
    validateDate: validateDate,
    validateTime: validateTime,
    validate: validate,
    loadAppointments: loadAppointments,
    add: add,
    setStatus: setStatus,
    remove: remove,
    removeDone: removeDone,
    getById: getById,
    seedSamples: seedSamples,
    codeOf: codeOf,
    listUnanswered: listUnanswered,
    logUnanswered: logUnanswered,
    clearUnanswered: clearUnanswered,
    clearAll: clearAll,
    formatPhone: formatPhone,
    maskPhone: maskPhone,
    toCSV: toCSV,
    STATUS_LABEL: STATUS_LABEL,
    SOURCE_LABEL: SOURCE_LABEL
  };
})(typeof window !== 'undefined' ? window : globalThis);
