# Minh chứng dùng AI để xây dựng sản phẩm — Đội Vibe · Đề 4

**Công cụ:** Claude Code (trợ lý lập trình AI). **Cách làm:** đội giao yêu cầu và chốt quyết định; AI đọc đề, viết mã, **tự chạy thử, phát hiện lỗi, đề xuất và sửa**; đội duyệt kết quả. Dưới đây là 5 đoạn chọn lọc, theo trình tự *mục tiêu → yêu cầu cho AI → vấn đề phát hiện khi thử → yêu cầu sửa → kết quả kiểm tra lại*. Mọi con số là kết quả chạy thật trong phiên làm việc ngày 08/11/2026.

**① Hiểu đề trước khi code.**
Yêu cầu: *"hãy đọc kỹ trong file đề và research kỹ trên mạng về cuộc thi này, lên plan… để oneshot project"*. AI đọc 5 file PDF (dạng ảnh, phải cắt thành 32 đoạn để đọc) và website BTC (đề 4, tiêu chí bảng B, mẫu README). **Phát hiện:** hồ sơ đội đang "Chưa gửi duyệt" trong khi cổng nộp ghi *chỉ đội đã xác thực mới lưu được bài*; BTC bắt buộc ghi *"Bản demo vòng loại - Dữ liệu mô phỏng AI"* nếu dùng mock; không tìm thấy bảng giá chính thức của nhà tài trợ. **Quyết định của đội:** mock minh bạch (bảng B vẫn đạt tối đa), doanh nghiệp giả định "VibeHost" với dữ liệu mẫu, HTML/JS thuần chạy offline, deploy GitHub Pages.

**② Dựng lõi + tự viết bài kiểm tra.**
Yêu cầu (theo kế hoạch đội đã duyệt): dựng đủ 5 tính năng, tách phần logic để kiểm tra được, mỗi vòng phải chạy thử rồi mới sửa. AI viết bộ kiến thức 10 FAQ, bộ so khớp tiếng Việt (bỏ dấu, sửa lỗi gõ), mock diễn đạt + 3 gợi ý, logic đặt lịch theo giờ Việt Nam, và `tests/run-tests.js`. Kết quả lần đầu: **268/268 đạt** — nhưng đây là bài kiểm tra do chính AI viết, có thể quá "dễ", nên bước tiếp theo là thử bằng câu hỏi kiểu khách thật.

**③ Thử 40 câu hỏi tự nhiên → phát hiện bot trả lời SAI.**
Vấn đề: 3 câu bị trả lời nhầm chủ đề — *"chuyển tên miền .vn sang được không"* → FAQ ".vn hay .com"; *"hoàn tiền mất bao lâu"* → FAQ "trỏ tên miền" (cụm "mất bao lâu" được điểm quá cao); *"email gửi đi bị vào spam"* → FAQ "tạo email" (không đúng vấn đề); và *"có hỗ trợ 24/7 không"* thì bot không hiểu. Yêu cầu sửa: chỉnh trọng số (bỏ từ khóa mô tả "tên miền .vn" khỏi FAQ 2, hạ điểm cụm "mất bao lâu"), thêm dấu hiệu ngoài phạm vi "spam" để chuyển sang đặt lịch, thêm ý định "24/7". Kiểm tra lại: **cả 4 câu đúng**, thêm 9 kiểm tra hồi quy → **277/277 đạt**.

**④ Chạy thử trên trình duyệt thật (điện thoại 390px + máy tính).**
AI viết kịch bản điều khiển Edge để bấm, gõ, đặt lịch, xóa lịch như người dùng. Vấn đề phát hiện: tin xác nhận hiển thị số điện thoại thành **"0912 678\*"** thay vì che bớt — vì chuỗi "\*\*\*" xung đột với định dạng in đậm của khung chat. Sửa: đổi ký tự che thành "•••" và thêm kiểm tra. Kết quả: **43/43 kiểm tra giao diện đạt**, 0 lỗi console.

**⑤ Soát ảnh chụp giao diện điện thoại.**
Vấn đề: câu bị lặp *"khách của shop của bạn"*; ô chọn ngày của trình duyệt hiện **"11/09/2026"** (kiểu Mỹ) dễ hiểu nhầm là 11 tháng 9; nút "Xác nhận đặt lịch" bị khuất dưới đáy form; chú thích demo che thông báo. Sửa: viết lại mẫu câu + thêm kiểm tra tự động chống lặp "của … của bạn" cho mọi ngữ cảnh; đổi sang danh sách ngày có thứ ("Ngày mai (09/11)", Chủ nhật ghi "nghỉ"); form trượt lên từ đáy, nút luôn hiện; dời chú thích. Kiểm tra lại: **278/278** kiểm tra logic, **47/47** kiểm tra giao diện, demo tự động 5 tính năng chạy **79 giây**.

**Bài học:** AI viết mã nhanh nhưng vẫn mắc lỗi khó thấy (chấm điểm từ khóa, định dạng hiển thị, ngữ pháp); chỉ lộ ra khi **thử bằng dữ liệu thật và xem giao diện thật**. Vì vậy mỗi lần sửa đều kèm kiểm tra hồi quy để lỗi không quay lại. Ảnh giao diện sau khi sửa: `docs/screenshots/`.
