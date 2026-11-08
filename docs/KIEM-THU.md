# Bảng kiểm thử — Đề 4: Chatbot FAQ & đặt lịch tư vấn (Bảng B)

- **Ngày thử:** 08/11/2026 · **Người thử:** đội Vibe (thao tác được tự động hóa trên trình duyệt để lặp lại chính xác) · **Bản:** source trong ZIP.
- **Môi trường:** Microsoft Edge (Chromium) — cỡ điện thoại 390×844 và máy tính 1366×900; Node.js 24 cho kiểm thử logic.
- **Yêu cầu bảng B:** ≥ 3 ca (bình thường, nhập thiếu/sai, ca biên). Đội làm **12 ca** dưới đây. Ai cũng có thể thử lại bằng tay theo cột "Bước thử".

| Mã ca | Loại ca | Tính năng | Bước thử | Kỳ vọng | Kết quả thực tế | Đạt? |
|---|---|---|---|---|---|---|
| TC01 | Bình thường | F1, F2 | Gõ "Nên chọn tên miền .vn hay .com cho shop online?" → Enter | Trả lời đúng FAQ 02, diễn đạt tự nhiên, đúng 3 gợi ý | Trả lời FAQ 02 với nhãn "Nguồn: FAQ 02 · Tên miền" + "AI mô phỏng"; nút "Xem câu trả lời gốc"; 3 gợi ý; câu trả lời dùng "shop của bạn" | Đạt |
| TC02 | Bình thường (không dấu / gõ sai) | F1 | Gõ "ssl co mien phi khong", sau đó "domian la gi" | Hiểu đúng FAQ 05, FAQ 01 | Trả lời FAQ 05 và FAQ 01; phần "Xem câu trả lời gốc" ghi đã tự sửa "domian → domain" | Đạt |
| TC03 | Bình thường | F2 | Bấm câu gợi ý đầu tiên dưới câu trả lời | Trả lời câu được chọn + 3 gợi ý mới, không gợi ý lại câu vừa hỏi | Trả lời đúng; 3 gợi ý mới. Kiểm thử logic: cả 10 FAQ đều đủ 3 gợi ý khác nhau, kể cả khi đã hỏi hết 10 câu | Đạt |
| TC04 | Ngoài phạm vi | F3 | Gõ "Bên bạn có nhận thiết kế logo cho shop không?" | Không bịa câu trả lời; mời đặt lịch; ghi nhật ký | Nhãn "Ngoài bộ kiến thức", nút "Đặt lịch tư vấn"; bấm nút → form điền sẵn câu hỏi; trang Quản trị liệt kê câu này ở mục "Câu hỏi bot chưa trả lời được" | Đạt |
| TC05 | Nhập sai / ca biên (chat) | F1 | (a) Gửi tin chỉ có dấu cách; (b) dán tin 400 ký tự | (a) Không gửi; (b) rút còn 300 ký tự | (a) Không có tin mới, ô nhập rung + nhắc "Bạn chưa nhập câu hỏi nào."; (b) tin hiển thị 300 ký tự + thông báo "đã được rút gọn" | Đạt |
| TC06 | Nhập thiếu | F4 | Mở form đặt lịch → bấm "Xác nhận đặt lịch" ngay | Báo lỗi từng ô, không lưu | Báo "Vui lòng nhập họ và tên", "Vui lòng nhập số điện thoại", "Vui lòng chọn giờ hẹn" ngay dưới ô + thông báo tổng; localStorage vẫn 0 lịch | Đạt |
| TC07 | Nhập sai | F4 | Họ tên "Lan123", SĐT "12345" → Xác nhận | Báo lỗi định dạng | "Họ tên chỉ gồm chữ cái và khoảng trắng…", "Số điện thoại chưa đúng định dạng Việt Nam (VD: 0912 345 678)" | Đạt |
| TC08 | Ca biên (ngày) | F4 | Mở danh sách ngày; ép chọn Chủ nhật, ngày hôm qua, ngày +20 bằng script | Chỉ có hôm nay → 14 ngày tới; Chủ nhật bị khóa; ép chọn vẫn bị chặn | Danh sách 15 ngày ("Hôm nay", "Ngày mai", "Thứ Ba, 10/11"…), Chủ nhật ghi "· nghỉ" và bị khóa; ép chọn → "Chủ nhật nhân viên nghỉ…", "Không thể đặt lịch cho ngày đã qua.", "Chỉ nhận lịch trong vòng 14 ngày tới." | Đạt |
| TC09 | Ca biên (giờ) | F4 | Giả lập lúc 09:10 thứ Ba 10/11/2026, xem khung giờ hôm nay (`tests/run-tests.js`) | Khung trước 09:40 bị khóa (đặt trước ≥ 30 phút) | 08:00–09:30 trạng thái "đã qua", 10:00 còn trống; lúc 16:45 → "Hôm nay đã hết khung giờ trống" | Đạt |
| TC10 | Ca biên (trùng lịch) | F4 | Đặt 1 lịch; mở form lần 2 cùng ngày, ép chọn đúng khung đó bằng script → Xác nhận | Khung đã đặt bị khóa; nếu ép vẫn không lưu trùng | Khung hiện "· đã có lịch" và bị khóa; ép chọn → "Khung giờ này đã có khách đặt…", vẫn chỉ 1 lịch trong localStorage | Đạt |
| TC11 | Bình thường (quản trị) | F4, F5 | Đặt lịch hợp lệ (Nguyễn Thị Lan, 0912 345 678) → tải lại trang → tab Quản trị → "Đã xử lý" → "Xóa" → xác nhận | Lịch còn sau khi tải lại; đổi trạng thái; xóa khỏi danh sách và localStorage | Bot xác nhận "Đặt lịch thành công", SĐT che "0912 ••• 678"; sau tải lại vẫn còn; thống kê 1 tổng/1 chờ; "Đã xử lý" → nút "Xóa lịch đã xử lý (1)" sáng; hộp xác nhận → xóa, danh sách trống | Đạt |
| TC12 | Sự cố dữ liệu | F5 | Ghi chuỗi hỏng `{day-khong-phai-json` vào `localStorage['vibe4.appointments.v1']` → mở lại trang Quản trị | Không treo; báo lỗi; giữ bản lỗi để khôi phục | Trang chạy bình thường, thông báo "Dữ liệu lịch hẹn… bị lỗi định dạng nên đã được khởi tạo lại (bản lỗi đã được sao lưu)", có khóa `…corrupt.<thời gian>` | Đạt |

## Kiểm thử tự động (bổ sung, không bắt buộc với bảng B)

| Bộ kiểm thử | Cách chạy | Kết quả ngày 08/11/2026 |
|---|---|---|
| Logic: bộ kiến thức, so khớp 68 câu hỏi (có dấu, không dấu, gõ sai, câu gốc, nhãn chip), 13 câu ngoài phạm vi, 3 gợi ý, ý định hội thoại, form đặt lịch, giờ VN, lưu trữ, dữ liệu hỏng, CSV | `node tests/run-tests.js` | **278/278 đạt** |
| Giao diện trên Edge (điện thoại 390px + máy tính): đủ luồng 5 tính năng, các ca TC01–TC12 (trừ TC09), không tràn ngang, không lỗi console, demo tự động | Kịch bản điều khiển trình duyệt (không kèm trong ZIP) | **47/47 đạt**, demo tự động 79 giây |

## Câu hỏi đã từng bị trả lời sai và được sửa (kiểm tra hồi quy)

| Câu hỏi | Trước khi sửa | Sau khi sửa |
|---|---|---|
| "chuyển tên miền .vn sang được không" | Nhầm sang FAQ 02 (.vn hay .com) | FAQ 09 (chuyển nhà cung cấp) |
| "hoàn tiền mất bao lâu" | Nhầm sang FAQ 06 (trỏ tên miền) | FAQ 10 (thanh toán, hoàn tiền) |
| "email gửi đi bị vào spam" | Trả lời FAQ 07 (tạo email) — không đúng vấn đề | Chuyển sang đặt lịch với kỹ thuật |
| "có hỗ trợ 24/7 không" | Không hiểu | Trả lời giờ làm việc + bot 24/7 |
| Số điện thoại trong tin xác nhận | Hiển thị lỗi "0912 678*" | Hiển thị "0912 ••• 678" |
