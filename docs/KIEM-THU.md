# Bảng kiểm thử — Đề 4: Chatbot FAQ & đặt lịch tư vấn (Bảng B)

- **Phiên bản:** 1.2 · **Ngày thử:** 08/11/2026 · **Người thử:** đội Vibe (thao tác được tự động hóa trên trình duyệt để lặp lại chính xác; ai cũng có thể thử lại bằng tay theo cột "Bước thử").
- **Môi trường:** Microsoft Edge (Chromium) — điện thoại 390×844 và 320×640, máy tính 1366×900; Node.js 24 cho kiểm thử logic.
- **Yêu cầu bảng B:** ≥ 3 ca (bình thường, nhập thiếu/sai, ca biên). Đội làm **14 ca**. Cột cuối ghi việc đã chạy lại sau lần sửa gần nhất (phiên bản 1.2).
- **Điều kiện ban đầu chung (trừ khi ghi khác):** mở trang lần đầu hoặc sau khi bấm "Đặt lại toàn bộ dữ liệu demo" ở trang Quản trị — chưa có lịch hẹn, chưa có cuộc trò chuyện.

| Mã | Loại ca | Điều kiện ban đầu | Bước thử | Kỳ vọng | Kết quả thực tế | Đạt? | Chạy lại ở v1.2 |
|---|---|---|---|---|---|---|---|
| TC01 | Bình thường | Màn hình Tư vấn | Gõ "Nên chọn tên miền .vn hay .com cho shop online?" → Enter | Trả lời đúng FAQ 02, diễn đạt tự nhiên, đúng 3 gợi ý | Nhãn "Nguồn: FAQ 02 · Tên miền" + "AI mô phỏng"; nút "Xem câu trả lời gốc"; 3 gợi ý; câu trả lời dùng "shop của bạn" | Đạt | Có |
| TC02 | Bình thường (không dấu / gõ sai) | Màn hình Tư vấn | Gõ "ssl co mien phi khong", sau đó "domian la gi" | Hiểu đúng FAQ 05, FAQ 01 | Trả lời FAQ 05 và FAQ 01; phần câu trả lời gốc ghi đã tự sửa "domian → domain" | Đạt | Có |
| TC03 | Bình thường | Sau TC01 | Bấm câu gợi ý đầu tiên dưới câu trả lời | Trả lời câu được chọn + 3 gợi ý mới, không gợi ý lại câu vừa hỏi | Trả lời đúng; 3 gợi ý mới. Kiểm thử logic: cả 10 FAQ đều đủ 3 gợi ý khác nhau, kể cả khi đã hỏi hết 10 câu | Đạt | Có |
| TC04 | Ngoài phạm vi | Màn hình Tư vấn | Gõ "Bên bạn có nhận thiết kế logo cho shop không?" | Không bịa câu trả lời; mời đặt lịch; ghi nhật ký | Nhãn "Ngoài bộ kiến thức", nút "Đặt lịch tư vấn"; bấm nút → form điền sẵn câu hỏi; trang Quản trị liệt kê câu này ở "Câu hỏi bot chưa trả lời được" | Đạt | Có |
| TC05 | Nhập sai / ca biên (chat) | Màn hình Tư vấn | (a) Gửi tin chỉ có dấu cách; (b) dán tin 400 ký tự | (a) Không gửi; (b) rút còn 300 ký tự | (a) Không có tin mới, ô nhập rung + nhắc "Bạn chưa nhập câu hỏi nào."; (b) tin hiển thị 300 ký tự + thông báo "đã được rút gọn" | Đạt | Có |
| TC06 | Nhập thiếu | Form đặt lịch đang mở (từ TC04) | Bấm "Xác nhận đặt lịch" ngay | Báo lỗi từng ô, không lưu | Báo "Vui lòng nhập họ và tên", "Vui lòng nhập số điện thoại", "Vui lòng chọn giờ hẹn" dưới từng ô + thông báo tổng; nút xác nhận vẫn nhìn thấy trên điện thoại; localStorage vẫn 0 lịch | Đạt | Có |
| TC07 | Nhập sai | Form đặt lịch đang mở | Họ tên "Lan123", SĐT "12345" → Xác nhận | Báo lỗi định dạng | "Họ tên chỉ gồm chữ cái và khoảng trắng…", "Số điện thoại chưa đúng định dạng Việt Nam (VD: 0912 345 678)" | Đạt | Có |
| TC08 | Ca biên (ngày) | Form đặt lịch đang mở | Mở danh sách ngày; ép chọn Chủ nhật, ngày hôm qua, ngày +20 bằng script | Chỉ có hôm nay → 14 ngày tới; Chủ nhật bị khóa; ép chọn vẫn bị chặn | Danh sách 15 ngày ("Hôm nay", "Ngày mai", "Thứ Ba, 10/11"…), Chủ nhật ghi "· nghỉ" và bị khóa; ép chọn → "Chủ nhật nhân viên nghỉ…", "Không thể đặt lịch cho ngày đã qua.", "Chỉ nhận lịch trong vòng 14 ngày tới." | Đạt | Có |
| TC09 | Ca biên (giờ) | Giả lập lúc 09:10 thứ Ba 10/11/2026 (`tests/run-tests.js`) | Xem khung giờ hôm nay | Khung trước 09:40 bị khóa (đặt trước ≥ 30 phút) | 08:00–09:30 trạng thái "đã qua", 10:00 còn trống; lúc 16:45 → "Hôm nay đã hết khung giờ trống" | Đạt | Có |
| TC10 | Ca biên (trùng lịch) | Đã có 1 lịch (sau TC11 bước 1) | Mở form lần 2 cùng ngày, ép chọn đúng khung đó bằng script → Xác nhận | Khung đã đặt bị khóa; nếu ép vẫn không lưu trùng | Khung hiện "· đã có lịch" và bị khóa; ép chọn → "Khung giờ này đã có khách đặt…", vẫn chỉ 1 lịch trong localStorage | Đạt | Có |
| TC11 | Bình thường (quản trị) | Form đặt lịch đang mở | Đặt lịch hợp lệ (Nguyễn Thị Lan, 0912 345 678) → tải lại trang → tab Quản trị → "Đã xử lý" → "Xóa" → xác nhận | Lịch còn sau khi tải lại; đổi trạng thái; xóa khỏi danh sách và localStorage | Thẻ "Đã ghi nhận lịch hẹn · Chờ nhân viên gọi lại", SĐT che "0912 ••• 678"; sau tải lại lịch và cả cuộc trò chuyện vẫn còn; thống kê 1 tổng/1 chờ; "Đã xử lý" → nút "Xóa lịch đã xử lý (1)" sáng; hộp xác nhận → xóa, danh sách trống | Đạt | Có |
| TC12 | Sự cố dữ liệu | Có dữ liệu bất kỳ | Ghi chuỗi hỏng `{day-khong-phai-json` vào `localStorage['vibe4.appointments.v1']` → mở lại trang Quản trị | Không treo; báo lỗi; giữ bản lỗi để khôi phục | Trang chạy bình thường, thông báo "Dữ liệu lịch hẹn… bị lỗi định dạng nên đã được khởi tạo lại (bản lỗi đã được sao lưu)", có khóa `…corrupt.<thời gian>` | Đạt | Có |
| TC13 | Bình thường (khách hủy lịch) | Khách vừa đặt 1 lịch | Bấm "Lịch hẹn của bạn" → "Hủy lịch hẹn" → xác nhận → sang Quản trị | Trạng thái "Khách đã hủy", khung giờ trống lại, quản trị thấy đúng | Lịch đổi "Khách đã hủy", hết nút hủy, khung giờ trống lại; quản trị hiện "Khách đã hủy" (được gom vào "Xóa lịch đã xử lý"); khung chat ghi "Đã hủy lịch hẹn #…" | Đạt | Mới thêm ở v1.2 |
| TC14 | Độ đúng nội dung (mock phù hợp đầu vào) | Màn hình Tư vấn | Hỏi "ten mien .com gia bao nhieu", "đã trỏ dns mà web vẫn chưa vào được", "hoàn tiền mất bao lâu" | Câu đầu trả lời thẳng ý hỏi, số liệu khớp câu gốc | "Về chi phí… .com 320.000đ/năm"; "Nếu đã trỏ mà chưa vào được: chờ tối đa 24–48 giờ…"; "Về hoàn tiền: hosting được hoàn trong 7 ngày đầu…" | Đạt | Mới thêm ở v1.2 |

## Kiểm thử tự động (bổ sung, không bắt buộc với bảng B)

| Bộ kiểm thử | Cách chạy | Kết quả ngày 08/11/2026 (v1.2) |
|---|---|---|
| Logic: bộ kiến thức, so khớp 70+ câu hỏi (có dấu, không dấu, gõ sai, câu gốc, nhãn chip), 14 câu theo ý con, 13 câu ngoài phạm vi, 3 gợi ý, ý định hội thoại, form đặt lịch, giờ VN, lưu trữ, hủy lịch, số liệu hiệu quả, dữ liệu hỏng, CSV | `node tests/run-tests.js` | **341/341 đạt** |
| Giao diện trên Edge (điện thoại 390px, 320px, máy tính): đủ luồng 5 tính năng, TC01–TC14 (trừ TC09), không tràn ngang, không emoji, không lỗi console, khôi phục cuộc trò chuyện, demo tự động | Kịch bản điều khiển trình duyệt (không kèm trong ZIP) | **60/60 đạt**, demo tự động 81 giây |

## Câu hỏi đã từng bị trả lời sai và được sửa (kiểm tra hồi quy)

| Câu hỏi / hiện tượng | Trước khi sửa | Sau khi sửa |
|---|---|---|
| "chuyển tên miền .vn sang được không" | Nhầm sang FAQ 02 (.vn hay .com) | FAQ 09, câu đầu nói quy trình VNNIC |
| "hoàn tiền mất bao lâu" | Nhầm sang FAQ 06 (trỏ tên miền) | FAQ 10, câu đầu nói chính sách hoàn tiền |
| "email gửi đi bị vào spam" | Trả lời FAQ 07 (tạo email) — không đúng vấn đề | Chuyển sang đặt lịch với kỹ thuật |
| "có hỗ trợ 24/7 không" | Không hiểu | Trả lời giờ làm việc + bot 24/7 |
| "tên miền .com giá bao nhiêu" | Tác dụng phụ của lần sửa trước: chuyển sang đặt lịch | FAQ 02, câu đầu nói giá |
| "bảo mật dữ liệu khách hàng thế nào" | Nhầm FAQ 08 (sao lưu) vì bỏ dấu "bảo mật dữ liệu" chứa "mất dữ liệu" | FAQ 05 (bảo mật, SSL) |
| "gia hạn tên miền .vn" (hai FAQ hòa điểm) | Phụ thuộc thứ tự FAQ | Ưu tiên FAQ khớp nhiều chữ hơn → FAQ 10 |
| Hỏi giá nhưng nhận cả đoạn so sánh chung | Mock không bám ý hỏi | Câu trọng tâm "Về chi phí…" đặt lên đầu |
| Số điện thoại trong tin xác nhận | Hiển thị lỗi "0912 678*" | Hiển thị "0912 ••• 678" |
| Thông báo sau khi đặt lịch | "Đặt lịch thành công" (dễ hiểu là đã duyệt) | "Đã ghi nhận · Chờ nhân viên gọi lại" + xem lại/hủy |
