# Bảng kiểm thử — Đề 4: Chatbot FAQ & đặt lịch tư vấn (Bảng B)

- **Phiên bản:** 2.0 (giao diện mới: lịch sử trò chuyện bên trái, bảng Câu hỏi thường gặp / Đặt lịch bên phải) · **Ngày thử:** 09/11/2026 · **Người thử:** đội Vibe (thao tác được tự động hóa trên trình duyệt để lặp lại chính xác; ai cũng có thể thử lại bằng tay theo cột "Bước thử").
- **Môi trường:** Microsoft Edge (Chromium) — điện thoại 320×640 và 390×844, máy tính bảng 768×1024, máy tính 1024×768, 1280×800, 1366×768, 1440×900, 1536×864, 1920×1080; Node.js 24 cho kiểm thử logic.
- **Yêu cầu bảng B:** ≥ 3 ca (bình thường, nhập thiếu/sai, ca biên). Đội làm **16 ca**. Cột cuối ghi việc đã chạy lại trên giao diện 2.0.
- **Điều kiện ban đầu chung (trừ khi ghi khác):** mở trang lần đầu hoặc sau khi bấm "Đặt lại toàn bộ dữ liệu demo" ở trang Quản trị — chưa có lịch hẹn, chưa có cuộc trò chuyện.

| Mã | Loại ca | Điều kiện ban đầu | Bước thử | Kỳ vọng | Kết quả thực tế | Đạt? | Chạy lại ở v2.0 |
|---|---|---|---|---|---|---|---|
| TC01 | Bình thường | Màn hình Tư vấn | Gõ "Nên chọn tên miền .vn hay .com cho shop online?" → Enter | Trả lời đúng FAQ 02, diễn đạt tự nhiên, đúng 3 gợi ý | Dòng "Đã tìm trong bộ kiến thức · FAQ 02 · khớp …"; nhãn "Nguồn: FAQ 02 · Tên miền" + "AI mô phỏng"; nút "Xem câu trả lời gốc" mở câu gốc kèm lý do chọn; 3 gợi ý; câu trả lời dùng "shop của bạn" | Đạt | Có |
| TC02 | Bình thường (không dấu / gõ sai) | Màn hình Tư vấn | Gõ "ssl co mien phi khong", sau đó "domian la gi" | Hiểu đúng FAQ 05, FAQ 01 | Trả lời FAQ 05 và FAQ 01; phần câu trả lời gốc ghi đã tự sửa "domian → domain" | Đạt | Có |
| TC03 | Bình thường | Sau TC01 | Bấm câu gợi ý đầu tiên dưới câu trả lời; bấm 1 câu ở bảng "Câu hỏi thường gặp" bên phải | Trả lời câu được chọn + 3 gợi ý mới, không gợi ý lại câu vừa hỏi | Trả lời đúng; 3 gợi ý mới; dòng "Bạn chọn câu có sẵn · FAQ …". Rê chuột lên câu ở bảng phải → bong bóng xem trước nổi lên bên trái bảng. Kiểm thử logic: cả 10 FAQ đều đủ 3 gợi ý khác nhau | Đạt | Có |
| TC04 | Ngoài phạm vi | Màn hình Tư vấn | Gõ "Bên bạn có nhận thiết kế logo cho shop không?" | Không bịa câu trả lời; mời đặt lịch; ghi nhật ký | Khung "Ngoài bộ kiến thức" + nút "Đặt lịch tư vấn"; bấm nút → bảng phải chuyển sang tab "Đặt lịch tư vấn", ô nội dung điền sẵn câu hỏi, con trỏ ở ô Họ tên; trang Quản trị liệt kê câu này ở "Bot chưa trả lời được" | Đạt | Có |
| TC05 | Nhập sai / ca biên (chat) | Màn hình Tư vấn | (a) Gửi tin chỉ có dấu cách; (b) dán tin 400 ký tự | (a) Không gửi; (b) rút còn 300 ký tự | (a) Không có tin mới, ô nhập rung + nhắc "Bạn chưa nhập câu hỏi nào."; (b) tin hiển thị 300 ký tự + thông báo "đã được rút gọn" | Đạt | Có |
| TC06 | Nhập thiếu | Form đặt lịch đang mở (từ TC04) | Bấm "Xác nhận đặt lịch" ngay | Báo lỗi từng ô, không lưu | "Vui lòng nhập họ và tên", "Vui lòng nhập số điện thoại", "Vui lòng chọn giờ hẹn" dưới từng ô (viền đỏ) + thông báo tổng; con trỏ nhảy về ô Họ tên; trên điện thoại nút xác nhận bấm được trong tấm trượt; localStorage vẫn 0 lịch | Đạt | Có |
| TC07 | Nhập sai | Form đặt lịch đang mở | Họ tên "Lan123", SĐT "12345" → Xác nhận | Báo lỗi định dạng | "Họ tên chỉ gồm chữ cái và khoảng trắng…", "Số điện thoại chưa đúng định dạng Việt Nam (VD: 0912 345 678)" | Đạt | Có |
| TC08 | Ca biên (ngày) | Form đặt lịch đang mở | Xem hàng ô ngày; bấm ô Chủ nhật; gửi ngày hôm qua, ngày +20, Chủ nhật thẳng vào hàm lưu (`tests/run-tests.js`) | Chỉ có hôm nay → 14 ngày tới; Chủ nhật bị khóa; gửi ép vẫn bị chặn | 15 ô ngày ("Nay", T3, T4… kèm ngày); ô Chủ nhật bị gạch, khóa, đọc là "(nghỉ)", bấm không chọn được; ngày làm việc gần nhất được chọn sẵn; gửi ép → "Chủ nhật nhân viên nghỉ…", "Không thể đặt lịch cho ngày đã qua.", "Chỉ nhận lịch trong vòng 14 ngày tới." | Đạt | Có |
| TC09 | Ca biên (giờ) | Giả lập lúc 09:10 thứ Ba 10/11/2026 (`tests/run-tests.js`); trên giao diện: xem lưới giờ hôm nay | Khung trước 09:40 bị khóa (đặt trước ≥ 30 phút) | 08:00–09:30 trạng thái "đã qua", 10:00 còn trống; lúc 16:45 → "Hôm nay đã hết khung giờ trống". Giao diện: khung đã qua bị gạch, dòng "còn x/14 khung giờ trống" | Đạt | Có |
| TC10 | Ca biên (trùng lịch) | Đã có 1 lịch (sau TC11 bước 1) | Xem lại lưới giờ cùng ngày; gửi ép đúng khung đó vào hàm lưu | Khung đã đặt bị khóa; nếu ép vẫn không lưu trùng | Khung vừa đặt bị gạch và khóa ngay, đọc là "(đã có người đặt)"; gửi ép → "Khung giờ này đã có khách đặt…", vẫn chỉ 1 lịch trong localStorage | Đạt | Có |
| TC11 | Bình thường (quản trị) | Form đặt lịch đang mở | Đặt lịch hợp lệ (Nguyễn Thị Lan, 0912 345 678) → tải lại trang → tab Quản trị → "Đã xử lý" → "Xóa" → xác nhận | Lịch còn sau khi tải lại; đổi trạng thái; xóa khỏi danh sách và localStorage | Dòng tóm tắt "Thứ Hai, 09/11/2026 lúc …" trước khi gửi; thẻ "Đã ghi nhận lịch hẹn · Trạng thái: Chờ nhân viên gọi lại", SĐT che "0912 ••• 678"; sau tải lại lịch và lịch sử trò chuyện vẫn còn; thống kê 1 tổng/1 chờ; "Đã xử lý" → nút "Xóa lịch đã xử lý (1)" sáng; hộp xác nhận → xóa, danh sách trống | Đạt | Có |
| TC12 | Sự cố dữ liệu | Có dữ liệu bất kỳ | Ghi chuỗi hỏng vào `localStorage['vibe4.appointments.v1']` và `['vibe4.convos.v1']` → mở lại trang Quản trị | Không treo; báo lỗi; giữ bản lỗi để khôi phục | Trang chạy bình thường, thông báo "Dữ liệu lịch hẹn… bị lỗi định dạng nên đã được khởi tạo lại (bản lỗi đã được sao lưu)", có khóa `…corrupt.<thời gian>`; lịch sử trò chuyện hỏng tự khởi tạo lại | Đạt | Có |
| TC13 | Bình thường (khách hủy lịch) | Khách vừa đặt 1 lịch | Bấm "Lịch của bạn" ở thanh trái → "Hủy lịch hẹn" → xác nhận → sang Quản trị | Trạng thái "Khách đã hủy", khung giờ trống lại, quản trị thấy đúng | Lịch đổi "Khách đã hủy", hết nút hủy, khung giờ trống lại; quản trị hiện "Khách đã hủy"; khung chat ghi "Đã hủy lịch hẹn #…" | Đạt | Có |
| TC14 | Độ đúng nội dung (mock phù hợp đầu vào) | Màn hình Tư vấn | Hỏi "ten mien .com gia bao nhieu", "Shop mình có nhiều website thì nên chọn gói hosting nào?", "hoàn tiền mất bao lâu" | Câu đầu trả lời thẳng ý hỏi, số liệu khớp câu gốc | "Về chi phí… .com 320.000đ/năm"; thẻ gói gợi ý "Doanh Nghiệp" (hỏi bảng giá chung thì gợi ý "Khởi Nghiệp"); "Về hoàn tiền: hosting được hoàn trong 7 ngày đầu…" | Đạt | Có |
| TC15 | Bình thường (lịch sử trò chuyện) | Đã có 1 cuộc trò chuyện có đặt lịch | Bấm "Cuộc trò chuyện mới" → hỏi "Có email theo tên miền không?" → bấm cuộc cũ ở cột trái → tải lại trang | 2 mục lịch sử; mở lại đúng nội dung; tải lại vẫn còn | Màn chào hiện lại; cột trái có 2 mục nhóm "Hôm nay", cuộc cũ có nhãn "Đã đặt lịch"; bấm vào mở lại đủ tin nhắn và thẻ xác nhận; tải lại mở cuộc gần nhất | Đạt | Mới ở v2.0 |
| TC16 | Giao diện (nhiều cỡ màn hình) | — | Quét tự động mọi đoạn chữ đang hiển thị ở 5 độ rộng (320, 390, 768, 1024, 1280px) × 10 trạng thái (màn chào, trả lời có thẻ gói, ngoài phạm vi, form báo lỗi, form đã điền, thẻ xác nhận, lịch của bạn, bảng câu hỏi, giới thiệu, quản trị), cuộn từ đầu tới cuối; thêm 1366, 1440, 1536, 1920px | Không tràn ngang, không có chữ đè nhau hay tràn khung, thanh trên không bị bảng phải che | Không lỗi. Bộ quét được kiểm chứng: chạy trên bản ngay trước khi sửa, nó báo đúng lỗi nhãn "Hợp shop nhỏ" / "Hợp với bạn" đè lên tên gói ở 1280px | Đạt | Mới ở v2.0 |

## Kiểm thử tự động (bổ sung, không bắt buộc với bảng B)

| Bộ kiểm thử | Cách chạy | Kết quả ngày 09/11/2026 (v2.0) |
|---|---|---|
| Logic: bộ kiến thức, so khớp 70+ câu hỏi (có dấu, không dấu, gõ sai, câu gốc, nhãn chip), 14 câu theo ý con, 13 câu ngoài phạm vi, 3 gợi ý, ý định hội thoại, form đặt lịch, giờ VN, lưu trữ, hủy lịch, số liệu hiệu quả, dữ liệu hỏng, CSV | `node tests/run-tests.js` | **341/341 đạt** |
| Giao diện trên Edge (320 → 1920px): đủ luồng 5 tính năng, TC01–TC16 (trừ TC09), bố cục 3 cột / bảng nổi / tấm trượt, bong bóng xem trước, mắt linh vật nhìn theo con trỏ, chọn ngày và chuyển tab bằng phím mũi tên, không tràn ngang, không chữ đè, không emoji, không lỗi console, demo tự động | Kịch bản điều khiển trình duyệt (không kèm trong ZIP) | **73/73 đạt**, demo tự động 90 giây |

## Câu hỏi / lỗi đã từng sai và được sửa (kiểm tra hồi quy)

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
| v2.0 — màn 1024px: mở bảng đặt lịch | Lớp phủ mờ đè lên chính bảng đặt lịch | Bảng nằm trên lớp phủ; có kiểm tra tự động |
| v2.0 — màn 1280px: thanh trên cùng | Nút ẩn/hiện bảng bị bảng phải che | Thu gọn thanh trên; kiểm tra "thanh trên vừa khít" ở 6 độ rộng, bảng mở và đóng |
| v2.0 — thẻ gói ở 1280px | Nhãn "Hợp shop nhỏ" đè lên chữ "Gói Khởi Nghiệp" | Nhãn tự xuống dòng khi thiếu chỗ; bộ quét chữ đè ở 5 độ rộng × 10 trạng thái |
| v2.0 — điện thoại | Thanh trên chiếm 3 hàng; bảng phải mở sẵn khi tải trang | Thanh trên tối đa 2 hàng (cả ở 320px); bảng phải đóng sẵn, mở bằng 2 nút ở thanh nhập |
