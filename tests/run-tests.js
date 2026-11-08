#!/usr/bin/env node
/*
 * Kiểm thử logic (không cần cài thư viện):   node tests/run-tests.js
 * Kiểm tra bộ kiến thức, so khớp câu hỏi (có dấu / không dấu / gõ sai), câu ngoài phạm vi,
 * gợi ý 3 câu hỏi, ý định hội thoại, kiểm tra form đặt lịch và lưu trữ.
 * Giao diện được kiểm thử thủ công theo docs/KIEM-THU.md.
 */
'use strict';
var path = require('path');
var ROOT = path.join(__dirname, '..');
['js/data.js', 'js/engine.js', 'js/booking.js'].forEach(function (f) { require(path.join(ROOT, f)); });

var VC = globalThis.VC;
var E = VC.engine;
var B = VC.booking;
B.store.useMemory(); // không đụng tới localStorage thật

var total = 0;
var failed = [];
function check(group, name, cond, detail) {
  total++;
  if (!cond) failed.push('[' + group + '] ' + name + (detail !== undefined ? '  → ' + detail : ''));
}
function bestId(q) { var r = E.analyze(q); return r.best ? r.best.faq.id : null; }
function describe(q) { var r = E.analyze(q); return (r.best ? r.best.faq.id : 'null') + ' (top=' + (r.top ? r.top.faq.id + ':' + r.top.score : '-') + ', hits=' + (r.top ? r.top.hits.join('|') : '') + ', oos=' + r.oos.join('|') + ')'; }

/* ---------------- 1. Bộ kiến thức ---------------- */
var ids = VC.FAQ.map(function (f) { return f.id; });
check('data', 'có đúng 10 FAQ (đề yêu cầu 08–10)', VC.FAQ.length === 10, VC.FAQ.length);
check('data', 'id không trùng', new Set(ids).size === ids.length);
VC.FAQ.forEach(function (f, i) {
  check('data', f.id + ': số thứ tự đúng', f.no === i + 1, f.no);
  check('data', f.id + ': có câu gốc', typeof f.answer === 'string' && f.answer.length > 40);
  check('data', f.id + ': có 2 bản diễn đạt', Array.isArray(f.natural) && f.natural.length === 2);
  check('data', f.id + ': có ≥ 3 ý chính', f.points.length >= 3);
  check('data', f.id + ': đúng 3 câu liên quan hợp lệ', f.related.length === 3 && f.related.every(function (r) { return ids.indexOf(r) > -1 && r !== f.id; }), f.related.join(','));
  check('data', f.id + ': có nhãn chip', !!f.chip);
});
check('data', 'POPULAR chứa đủ 10 id', VC.POPULAR.length === 10 && VC.POPULAR.every(function (r) { return ids.indexOf(r) > -1; }));

/* ---------------- 2. So khớp câu hỏi ---------------- */
var CASES = [
  ['Tên miền là gì?', 'ten-mien-va-hosting'],
  ['hosting la gi vay', 'ten-mien-va-hosting'],
  ['Tên miền và hosting khác nhau thế nào?', 'ten-mien-va-hosting'],
  ['phan biet domain voi hosting', 'ten-mien-va-hosting'],
  ['Muốn làm website bán hàng thì cần những gì?', 'ten-mien-va-hosting'],
  ['domian la gi', 'ten-mien-va-hosting'],                       // gõ sai: domian → domain

  ['Nên chọn tên miền .vn hay .com?', 'vn-hay-com'],
  ['nen dung duoi vn hay com', 'vn-hay-com'],
  ['Tên miền .com với .vn cái nào tốt hơn?', 'vn-hay-com'],
  ['shop nhỏ có nên mua tên miền quốc gia không', 'vn-hay-com'],

  ['Đăng ký tên miền .vn cần giấy tờ gì?', 'giay-to-vn'],
  ['dang ky ten mien vn can cccd khong', 'giay-to-vn'],
  ['Công ty đăng ký tên miền có cần mã số thuế không?', 'giay-to-vn'],
  ['thu tuc dang ky domain .vn', 'giay-to-vn'],

  ['Bảng giá hosting', 'chon-goi-hosting'],
  ['Shop nhỏ nên dùng gói hosting nào?', 'chon-goi-hosting'],
  ['hostng gia bao nhieu', 'chon-goi-hosting'],                  // gõ sai: hostng → hosting
  ['Ngân sách ít thì thuê hosting gói nào?', 'chon-goi-hosting'],

  ['Có SSL miễn phí không?', 'ssl-mien-phi'],
  ['ssl co mien phi khong', 'ssl-mien-phi'],
  ['Web bị trình duyệt báo không bảo mật', 'ssl-mien-phi'],
  ['làm sao để web có https', 'ssl-mien-phi'],

  ['Trỏ tên miền về hosting thế nào?', 'tro-ten-mien'],
  ['doi nameserver bao lau thi chay', 'tro-ten-mien'],
  ['Đã trỏ DNS mà web chưa vào được', 'tro-ten-mien'],
  ['tro domain mat bao lau', 'tro-ten-mien'],

  ['Có email theo tên miền không?', 'email-ten-mien'],
  ['tao email doanh nghiep', 'email-ten-mien'],
  ['muốn có mail lienhe@shop.vn', 'email-ten-mien'],
  ['cấu hình bản ghi MX', 'email-ten-mien'],
  ['emial ten mien', 'email-ten-mien'],                          // gõ sai: emial → email

  ['Có backup dữ liệu không?', 'sao-luu'],
  ['Lỡ xóa nhầm dữ liệu có khôi phục được không?', 'sao-luu'],
  ['sao luu website', 'sao-luu'],
  ['bakup hang ngay khong', 'sao-luu'],                          // gõ sai: bakup → backup

  ['Chuyển hosting từ nhà cung cấp khác sang được không?', 'chuyen-nha-cung-cap'],
  ['transfer ten mien', 'chuyen-nha-cung-cap'],
  ['mã EPP là gì', 'chuyen-nha-cung-cap'],
  ['chuyen website ve vibehost', 'chuyen-nha-cung-cap'],

  ['Thanh toán bằng cách nào?', 'thanh-toan-gia-han'],
  ['gia han ten mien', 'thanh-toan-gia-han'],
  ['co hoan tien khong', 'thanh-toan-gia-han'],
  ['thanh toan bang momo duoc khong', 'thanh-toan-gia-han'],
  ['het han hosting thi sao', 'thanh-toan-gia-han'],

  // Hồi quy — các câu từng bị trả lời SAI ở vòng thử khám phá (xem docs/MINH-CHUNG-AI.md, vòng 3)
  ['chuyển tên miền .vn sang được không', 'chuyen-nha-cung-cap'],   // trước: nhầm sang FAQ 2 (.vn hay .com)
  ['hoàn tiền mất bao lâu', 'thanh-toan-gia-han'],                  // trước: nhầm sang FAQ 6 (trỏ tên miền)
  ['giá tên miền .vn bao nhiêu', 'vn-hay-com'],
  ['tro domain mat bao lau', 'tro-ten-mien']
];
CASES.forEach(function (c) { check('match', '"' + c[0] + '" → ' + c[1], bestId(c[0]) === c[1], describe(c[0])); });
VC.FAQ.forEach(function (f) {
  check('match', 'câu hỏi gốc FAQ ' + f.no, bestId(f.question) === f.id, describe(f.question));
  check('match', 'nhãn chip FAQ ' + f.no, bestId(f.chip) === f.id, describe(f.chip));
});

/* ---------------- 3. Ngoài phạm vi → không bịa, mời đặt lịch ---------------- */
var OOS = [
  'Bên bạn có nhận thiết kế logo cho shop không?',
  'giá vé máy bay đi Đà Nẵng bao nhiêu',
  'website bị hack phải làm sao',
  'Xuất hóa đơn VAT cho công ty được không?',
  'thời tiết hôm nay thế nào',
  'asdfgh qwerty',
  'Bạn có bán điện thoại không?',
  'thiết kế website giá bao nhiêu',
  'chạy quảng cáo facebook có hiệu quả không',
  'Có giao hàng tận nơi không?',
  'email gửi đi bị vào spam',          // hồi quy: trước đây bị trả lời bằng FAQ 7 (tạo email) — cần kỹ thuật xử lý
  'web của mình load chậm quá',
  '???'
];
OOS.forEach(function (q) {
  var bot = VC.createBot();
  var res = bot.reply(q);
  check('oos', '"' + q + '" → fallback + nút đặt lịch',
    res && res.type === 'fallback' && res.actions.length === 1 && res.actions[0].type === 'booking',
    res ? res.type + ' ' + (res.faqId || '') + ' ' + describe(q) : 'null');
  check('oos', '"' + q + '" → vẫn có đúng 3 gợi ý', res && res.suggestions.length === 3, res && res.suggestions.length);
});
(function () {
  var bot = VC.createBot();
  var r1 = bot.reply('Bên bạn có nhận thiết kế logo cho shop không?');
  check('oos', 'ghi chú đặt lịch = câu hỏi của khách', r1.actions[0].note === 'Bên bạn có nhận thiết kế logo cho shop không?', r1.actions[0].note);
  var r2 = bot.reply('chạy quảng cáo facebook có hiệu quả không');
  check('oos', 'lần 2 liên tiếp → nhấn mạnh đặt lịch', /chuyên viên/.test(r2.paragraphs[0]) && /Đặt lịch ngay/.test(r2.actions[0].label), r2.paragraphs[0]);
  var r3 = bot.reply('Có SSL miễn phí không?');
  check('oos', 'trả lời được → reset chuỗi fallback', r3.type === 'answer' && bot.getState().fallbackStreak === 0);
})();

/* ---------------- 4. Gợi ý đúng 3 câu hỏi liên quan sau MỖI lượt ---------------- */
(function () {
  var bot = VC.createBot();
  VC.FAQ.forEach(function (f) {
    var res = bot.reply(f.question);
    var sIds = res.suggestions.map(function (s) { return s.id; });
    check('suggest', 'FAQ ' + f.no + ': đúng 3 gợi ý', sIds.length === 3, sIds.join(','));
    check('suggest', 'FAQ ' + f.no + ': không trùng nhau', new Set(sIds).size === sIds.length, sIds.join(','));
    check('suggest', 'FAQ ' + f.no + ': không gợi ý lại chính câu vừa hỏi', sIds.indexOf(f.id) === -1, sIds.join(','));
  });
  var after = bot.reply('Có SSL miễn phí không?');
  check('suggest', 'đã hỏi hết 10 câu vẫn đủ 3 gợi ý', after.suggestions.length === 3);
  var fresh = VC.createBot();
  var a = fresh.reply('Nên chọn tên miền .vn hay .com?');
  check('suggest', 'ưu tiên danh sách related khi chưa hỏi', a.suggestions.map(function (s) { return s.id; }).join(',') === VC.FAQ[1].related.join(','),
    a.suggestions.map(function (s) { return s.id; }).join(','));
  var g = fresh.reply('xin chào');
  check('suggest', 'sau lời chào có 3 gợi ý', g.suggestions.length === 3);
  var w = fresh.welcome();
  check('suggest', 'lời chào đầu có 3 gợi ý', w.suggestions.length === 3);
})();

/* ---------------- 5. AI mô phỏng: diễn đạt lại ---------------- */
(function () {
  var bot = VC.createBot();
  var r1 = bot.reply('Có SSL miễn phí không?');
  var r2 = bot.reply('ssl co mien phi khong');
  check('mock', 'trả lời được đánh dấu mock + có câu gốc', r1.mock === true && r1.original === VC.FAQ[4].answer.replace(/\{brand\}/g, 'VibeHost'));
  check('mock', 'hỏi lại → dùng bản diễn đạt khác', r1.paragraphs[1] !== r2.paragraphs[1] && r2.variant === 2, r1.variant + '/' + r2.variant);
  check('mock', 'hỏi lại → câu mở đầu báo diễn đạt lại', /cách khác/.test(r2.paragraphs[0]), r2.paragraphs[0]);
  var shop = VC.createBot();
  var s = shop.reply('Shop thời trang của mình nên dùng gói hosting nào?');
  check('mock', 'cá nhân hóa ngữ cảnh "shop"', /shop của bạn/.test(s.paragraphs[1]), s.paragraphs[1].slice(0, 80));
  var all = JSON.stringify([r1, r2, s, bot.welcome(), shop.reply('xin chào'), shop.reply('logo')]);
  check('mock', 'không còn placeholder {brand}/{target}/{bot}', !/\{(brand|target|bot)\}/.test(all));
  check('mock', 'gói hosting/khuyến nghị có nút đặt lịch (CTA)', s.actions.length === 1 && s.actions[0].type === 'booking');
})();
(function () { // hồi quy vòng 5: câu bị lặp "khách của shop của bạn"
  var bad = [];
  ['', 'Shop thời trang của mình', 'Công ty mình', 'Blog cá nhân của mình'].forEach(function (ctx) {
    var b = VC.createBot();
    if (ctx) b.reply(ctx);
    VC.FAQ.forEach(function (f) {
      [1, 2].forEach(function () {
        var r = b.reply(f.question);
        if (/của (shop|website|trang)[^.!?]{0,30} của bạn/.test(r.paragraphs.join(' '))) bad.push((ctx || 'mặc định') + ' / FAQ ' + f.no + ' / mẫu ' + r.variant);
      });
    });
  });
  check('mock', 'không lặp "của … của bạn" ở mọi ngữ cảnh và mọi mẫu câu', bad.length === 0, bad.join('; '));
})();

/* ---------------- 6. Ý định hội thoại ---------------- */
(function () {
  var bot = VC.createBot();
  check('intent', 'xin chào → greeting', bot.reply('xin chào').intent === 'greeting');
  check('intent', 'hi → greeting', bot.reply('hi').intent === 'greeting');
  check('intent', 'cảm ơn → thanks', bot.reply('cảm ơn nhiều nhé').intent === 'thanks');
  var bk = bot.reply('Tôi muốn đặt lịch tư vấn');
  check('intent', 'đặt lịch → mở form', bk.intent === 'booking' && bk.autoBooking === true);
  check('intent', 'gặp nhân viên → mở form', bot.reply('cho mình gặp nhân viên').intent === 'booking');
  check('intent', 'giờ làm việc', bot.reply('Chủ nhật có làm việc không?').intent === 'hours');
  check('intent', 'hỗ trợ 24/7 → giờ làm việc', bot.reply('có hỗ trợ 24/7 không').intent === 'hours');
  var menu = bot.reply('Xem 10 câu hỏi');
  check('intent', 'xem danh sách 10 câu', menu.type === 'menu' && menu.menu.length === 10);
  check('intent', 'bạn là ai → about', bot.reply('bạn là ai').intent === 'about');
  check('intent', 'tạm biệt → bye', bot.reply('tạm biệt').intent === 'bye');
  check('intent', 'chào + câu hỏi → ưu tiên trả lời FAQ', bot.reply('chào bạn, hosting là gì?').type === 'answer');
})();

/* ---------------- 7. Tin nhắn rỗng / quá dài ---------------- */
(function () {
  var bot = VC.createBot();
  check('input', 'tin rỗng → không trả lời', bot.reply('') === null);
  check('input', 'chỉ khoảng trắng → không trả lời', bot.reply('    \n  ') === null);
  var long = bot.reply('Tên miền là gì? ' + new Array(400).join('a'));
  check('input', '> 300 ký tự → cắt còn 300 & báo', long.truncated === true && long.query.length === 300);
  check('input', 'chọn chip → trả lời đúng FAQ theo id', bot.reply('Bất kỳ', { faqId: 'sao-luu' }).faqId === 'sao-luu');
})();

/* ---------------- 8. Form đặt lịch: kiểm tra dữ liệu ---------------- */
var NOW = { date: '2026-11-10', minutes: 9 * 60 + 10 }; // Thứ Ba 10/11/2026 lúc 09:10 (giờ VN)
(function () {
  check('time', 'giờ VN: 17:30 UTC ngày 08/11 = 00:30 ngày 09/11', JSON.stringify(B.vnNow(new Date(Date.UTC(2026, 10, 8, 17, 30)))) === JSON.stringify({ date: '2026-11-09', minutes: 30 }));
  check('time', 'thứ trong tuần 10/11/2026 = Thứ Ba', B.formatDate('2026-11-10') === 'Thứ Ba, 10/11/2026', B.formatDate('2026-11-10'));
  var slots = B.slotTimes();
  check('slot', '14 khung giờ/ngày (08:00–11:00, 13:30–16:30)', slots.length === 14 && slots[0] === '08:00' && slots[6] === '11:00' && slots[7] === '13:30' && slots[13] === '16:30', slots.join(' '));
  var today = B.getSlots('2026-11-10', [], NOW);
  check('slot', 'hôm nay 09:10 → 09:30 đã qua (cần trước 30 phút)', today[3].time === '09:30' && today[3].reason === 'past');
  check('slot', 'hôm nay 09:10 → 10:00 còn trống', today[4].time === '10:00' && today[4].available);

  check('date', 'ngày trống → lỗi', !!B.validateDate('', NOW, []).error);
  check('date', 'ngày đã qua → lỗi', /đã qua/.test(B.validateDate('2026-11-09', NOW, []).error || ''));
  check('date', 'Chủ nhật → lỗi', /Chủ nhật/.test(B.validateDate('2026-11-15', NOW, []).error || ''));
  check('date', '+14 ngày → hợp lệ', B.validateDate('2026-11-24', NOW, []).value === '2026-11-24');
  check('date', '+15 ngày → lỗi', /14 ngày/.test(B.validateDate('2026-11-25', NOW, []).error || ''));
  check('date', 'ngày không tồn tại 30/02 → lỗi', !!B.validateDate('2026-02-30', NOW, []).error);
  check('date', 'sai định dạng → lỗi', !!B.validateDate('10/11/2026', NOW, []).error);
  check('date', 'hôm nay sau 16:30 → hết khung giờ', /hết khung giờ/.test(B.validateDate('2026-11-10', { date: '2026-11-10', minutes: 16 * 60 + 45 }, []).error || ''));

  check('timefield', 'giờ trống → lỗi', !!B.validateTime('2026-11-11', '', NOW, []).error);
  check('timefield', 'giờ ngoài ca (12:00) → lỗi', !!B.validateTime('2026-11-11', '12:00', NOW, []).error);
  check('timefield', 'giờ đã qua hôm nay → lỗi', /đã qua/.test(B.validateTime('2026-11-10', '09:00', NOW, []).error || ''));
  var booked = [{ id: 'x1', name: 'Khách A', phone: '0900000999', date: '2026-11-11', time: '09:00', status: 'pending' }];
  check('timefield', 'khung giờ đã có người đặt → lỗi', /đã có khách/.test(B.validateTime('2026-11-11', '09:00', NOW, booked).error || ''));
  check('timefield', 'khung giờ trống → hợp lệ', B.validateTime('2026-11-11', '09:30', NOW, booked).value === '09:30');

  check('phone', '0912 345 678 → hợp lệ', B.validatePhone('0912 345 678').value === '0912345678');
  check('phone', '+84 912 345 678 → 0912345678', B.validatePhone('+84 912 345 678').value === '0912345678');
  check('phone', '84912345678 → 0912345678', B.validatePhone('84912345678').value === '0912345678');
  check('phone', '0912.345.678 → hợp lệ', B.validatePhone('0912.345.678').value === '0912345678');
  check('phone', 'máy bàn 028 3823 4567 → hợp lệ', B.validatePhone('028 3823 4567').value === '02838234567');
  check('phone', 'trống → lỗi', !!B.validatePhone('   ').error);
  check('phone', '12345 → lỗi', !!B.validatePhone('12345').error);
  check('phone', 'đầu số 01 cũ → lỗi', !!B.validatePhone('0112345678').error);
  check('phone', 'có chữ → lỗi', /chữ số/.test(B.validatePhone('0912a45678').error || ''));

  check('name', 'Nguyễn Thị Lan → hợp lệ', B.validateName('Nguyễn Thị Lan').value === 'Nguyễn Thị Lan');
  check('name', 'gom khoảng trắng thừa', B.validateName('  Nguyễn   Thị  Lan ').value === 'Nguyễn Thị Lan');
  check('name', 'chữ có dấu dạng tổ hợp (NFD) → hợp lệ', B.validateName('Nguyễn Văn A').value === 'Nguyễn Văn A', B.validateName('Nguyễn Văn A').value);
  check('name', 'trống → lỗi', !!B.validateName('').error);
  check('name', '1 ký tự → lỗi', !!B.validateName('A').error);
  check('name', 'có số → lỗi', !!B.validateName('Lan123').error);
  check('name', 'có ký hiệu → lỗi', !!B.validateName('<script>').error);
  check('name', '> 50 ký tự → lỗi', !!B.validateName(new Array(52).join('a')).error);

  var empty = B.validate({}, [], NOW);
  check('form', 'form trống → lỗi tên, SĐT, ngày, giờ', !empty.ok && empty.errors.name && empty.errors.phone && empty.errors.date && empty.errors.time, Object.keys(empty.errors).join(','));
  var good = B.validate({ name: 'Nguyễn Thị Lan', phone: '0912 345 678', date: '2026-11-11', time: '14:00', note: 'Tư vấn gói hosting' }, [], NOW);
  check('form', 'dữ liệu đúng → hợp lệ', good.ok, JSON.stringify(good.errors));
  var longNote = B.validate({ name: 'Nguyễn Thị Lan', phone: '0912345678', date: '2026-11-11', time: '14:00', note: new Array(202).join('x') }, [], NOW);
  check('form', 'nội dung > 200 ký tự → lỗi', !!longNote.errors.note);
  var dupList = [{ id: 'x2', name: 'Nguyễn Thị Lan', phone: '0912345678', date: '2026-11-11', time: '08:00', status: 'pending' }];
  var dup = B.validate({ name: 'Nguyễn Thị Lan', phone: '0912 345 678', date: '2026-11-11', time: '14:00' }, dupList, NOW);
  check('form', 'cùng SĐT đã có lịch chờ trong ngày → lỗi', /đã có lịch hẹn/.test(dup.errors.phone || ''), dup.errors.phone);
})();

/* ---------------- 9. Lưu trữ ---------------- */
(function () {
  B.clearAll();
  var r = B.add({ name: 'Nguyễn Thị Lan', phone: '0912345678', date: '2026-11-11', time: '14:00', note: 'Hỏi về logo' }, { now: NOW, source: 'chat-fallback' });
  check('store', 'lưu lịch hẹn hợp lệ', r.ok && r.record.status === 'pending' && r.record.source === 'chat-fallback', JSON.stringify(r.errors));
  check('store', 'đọc lại được 1 lịch hẹn', B.loadAppointments().list.length === 1);
  var clash = B.add({ name: 'Trần Văn B', phone: '0987654321', date: '2026-11-11', time: '14:00' }, { now: NOW });
  check('store', 'không cho đặt trùng khung giờ đã lưu', !clash.ok && !!clash.errors.time, JSON.stringify(clash.errors));
  var r2 = B.add({ name: 'Trần Văn B', phone: '0987654321', date: '2026-11-12', time: '08:30' }, { now: NOW });
  check('store', 'lịch thứ 2 hợp lệ', r2.ok);
  var sorted = B.loadAppointments().list;
  check('store', 'danh sách sắp theo ngày giờ', sorted[0].date === '2026-11-11' && sorted[1].date === '2026-11-12');
  check('store', 'đánh dấu đã xử lý', B.setStatus(r.record.id, 'done') && B.getById(r.record.id).status === 'done');
  check('store', 'xóa các lịch đã xử lý', B.removeDone() === 1 && B.loadAppointments().list.length === 1);
  check('store', 'xóa theo id', B.remove(r2.record.id) === 1 && B.loadAppointments().list.length === 0);

  B.store.set(B.KEYS.appts, '{day-khong-phai-json');
  var bad = B.loadAppointments();
  check('store', 'JSON hỏng → không crash, báo corrupted, khởi tạo lại', bad.corrupted === true && bad.list.length === 0);
  check('store', 'JSON hỏng → có bản sao lưu dữ liệu lỗi', B.store.keys().some(function (k) { return k.indexOf(B.KEYS.appts + '.corrupt.') === 0; }));
  check('store', 'sau khi khởi tạo lại vẫn lưu được', B.add({ name: 'Lê Văn C', phone: '0901234567', date: '2026-11-13', time: '10:00' }, { now: NOW }).ok);

  B.store.set(B.KEYS.appts, JSON.stringify([{ id: 'x' }, { id: 'a1', name: 'Lan', phone: '0912345678', date: '2026-11-11', time: '09:00', status: 'pending' }, { id: 'a2', name: 'Hack', phone: '<img>', date: '2026-11-11', time: '10:00' }]));
  var filtered = B.loadAppointments();
  check('store', 'bỏ qua bản ghi sai cấu trúc / bị sửa tay', filtered.list.length === 1 && filtered.dropped === 2, filtered.list.length + '/' + filtered.dropped);

  B.clearAll();
  for (var i = 0; i < 55; i++) B.logUnanswered('Câu hỏi số ' + i);
  var logs = B.listUnanswered();
  check('store', 'nhật ký câu chưa trả lời giữ tối đa 50, mới nhất trước', logs.length === 50 && logs[0].text === 'Câu hỏi số 54');
  check('store', 'không ghi nhật ký rỗng', B.logUnanswered('   ') === false);

  B.clearAll();
  check('store', 'tạo 3 lịch hẹn mẫu', B.seedSamples(NOW) === 3);
  var seeded = B.loadAppointments().list;
  check('store', 'dữ liệu mẫu được gắn nhãn sample + 1 lịch đã xử lý', seeded.every(function (x) { return x.sample; }) && seeded.filter(function (x) { return x.status === 'done'; }).length === 1);

  var csv = B.toCSV([{ id: 'lhabc123', name: 'Lan, "Bé"', phone: '0912345678', date: '2026-11-11', time: '09:00', note: '=HYPERLINK("http://x")', status: 'pending', source: 'direct', createdAt: '2026-11-08T13:00:00.000Z' }]);
  check('csv', 'có BOM UTF-8 cho Excel', csv.charCodeAt(0) === 0xFEFF);
  check('csv', 'escape dấu phẩy & nháy kép', csv.indexOf('"Lan, ""Bé"""') > -1);
  check('csv', 'chặn chèn công thức Excel', csv.indexOf('"\'=HYPERLINK') > -1);
  check('csv', 'giờ tạo theo giờ VN', csv.indexOf('20:00 08/11/2026') > -1);

  check('date', 'ngày trống gần nhất từ thứ Bảy 17:00 → thứ Hai', B.nextAvailableDate([], { date: '2026-11-14', minutes: 17 * 60 }) === '2026-11-16');
  check('date', 'ngày trống gần nhất hôm nay còn slot → hôm nay', B.nextAvailableDate([], NOW) === '2026-11-10');
  check('phone', 'che bớt SĐT khi hiển thị trong chat (không dùng "*" để tránh vỡ định dạng)', B.maskPhone('0912345678') === '0912 ••• 678');
  B.clearAll();
})();

/* ---------------- Kết quả ---------------- */
var passed = total - failed.length;
console.log('Kiểm thử logic — Chatbot FAQ & đặt lịch tư vấn (Đề 4)');
console.log('Đạt ' + passed + '/' + total + ' kiểm tra.');
if (failed.length) {
  console.log('\nChưa đạt (' + failed.length + '):');
  failed.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(1);
} else {
  console.log('Tất cả đều đạt ✓');
}
