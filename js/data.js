/*!
 * data.js — Bộ kiến thức cho Chatbot FAQ & đặt lịch tư vấn (Đề 4 · VIBE-CODING 2026)
 *
 * DỮ LIỆU MẪU do đội tự xây dựng (theo gợi ý của BTC: chủ đề hosting/domain).
 * "VibeHost" là doanh nghiệp GIẢ ĐỊNH. Giá, thông số gói và chính sách trong file này
 * là dữ liệu minh họa, KHÔNG phải thông tin của nhà tài trợ hay của bất kỳ công ty có thật nào.
 *
 * Quy ước chuỗi hiển thị:  {brand} = tên thương hiệu, {target} = "shop của bạn"/"website của bạn"...
 *                          **đậm**, *nghiêng* (chỉ dùng cho nội dung tin cậy trong file này).
 * Quy ước từ khóa: viết KHÔNG DẤU, chữ thường. Cụm nhiều từ được so khớp nguyên cụm.
 */
(function (root) {
  'use strict';
  var VC = (root.VC = root.VC || {});

  VC.BRAND = {
    name: 'VibeHost',
    botName: 'Trợ lý VibeHost',
    tagline: 'Tên miền & hosting cho shop nhỏ',
    hoursText: 'Thứ 2 – Thứ 7 · 08:00–11:30 và 13:30–17:00 (giờ Việt Nam, GMT+7). Chủ nhật nghỉ.'
  };

  VC.FAQ = [
    {
      id: 'ten-mien-va-hosting',
      no: 1,
      category: 'Kiến thức cơ bản',
      question: 'Tên miền là gì và khác hosting thế nào?',
      chip: 'Tên miền khác hosting thế nào?',
      keywords: [
        'ten mien la gi', 'domain la gi', 'hosting la gi', 'host la gi', 'ten mien va hosting', 'hosting va ten mien',
        'domain va hosting', 'hosting va domain', 'khac hosting', 'khac ten mien', 'khac nhau', 'khac gi', 'phan biet',
        'khai niem', 'lam website can', 'lam web can', 'can nhung gi', 'can gi de co website', 'bat dau lam website',
        'domain', 'hosting'
      ],
      answer:
        'Tên miền (domain) là địa chỉ để khách gõ vào trình duyệt, ví dụ tenshop.vn. Hosting là máy chủ lưu trữ mã nguồn, ' +
        'hình ảnh và dữ liệu của website. Một website hoạt động cần cả hai: tên miền được trỏ về hosting đang chứa website.',
      natural: [
        'Bạn cứ hình dung thế này nhé: **tên miền** giống như *địa chỉ nhà* (ví dụ tenshop.vn) để khách tìm đến, còn **hosting** ' +
          'là *ngôi nhà* — nơi {target} cất toàn bộ hình ảnh, sản phẩm và dữ liệu. Có địa chỉ mà không có nhà thì khách đến nơi ' +
          'chẳng thấy gì; có nhà mà thiếu địa chỉ thì khách không tìm được. Vì vậy website cần cả hai, và tên miền phải được trỏ về hosting.',
        'Nói ngắn gọn: tên miền là cái tên khách gõ trên trình duyệt, còn hosting là nơi {target} thực sự “sống”. Tên miền gia hạn ' +
          'theo năm, hosting thuê theo tháng hoặc năm; kết nối hai thứ với nhau là website hiển thị được ngay.'
      ],
      points: [
        'Tên miền: địa chỉ truy cập, gia hạn theo năm (VD: tenshop.vn).',
        'Hosting: nơi lưu mã nguồn, hình ảnh, dữ liệu; thuê theo tháng/năm.',
        'Website chạy được khi tên miền được trỏ về hosting.'
      ],
      related: ['vn-hay-com', 'chon-goi-hosting', 'tro-ten-mien']
    },
    {
      id: 'vn-hay-com',
      no: 2,
      category: 'Tên miền',
      question: 'Nên chọn tên miền .vn hay .com?',
      chip: 'Nên chọn .vn hay .com?',
      keywords: [
        'vn hay com', 'com hay vn', 'vn voi com', 'com voi vn', 'vn va com', 'com va vn', 'vn khac com', 'com khac vn',
        'nen chon ten mien', 'chon ten mien', 'chon duoi', 'duoi ten mien', 'duoi nao', 'duoi vn', 'duoi com',
        'ten mien quoc gia', 'ten mien quoc te', 'loai ten mien', 'ten mien nao tot', 'vn', 'com', 'net'
      ],
      answer:
        'Tên miền .vn là tên miền quốc gia Việt Nam do VNNIC quản lý, phù hợp khi khách hàng chủ yếu ở Việt Nam và tạo cảm giác tin cậy ' +
        'với người dùng trong nước. Tên miền .com là tên miền quốc tế phổ biến, phí thường thấp hơn. Nên đăng ký cả hai để bảo vệ thương hiệu. ' +
        'Giá mẫu: .vn 650.000đ năm đầu (gia hạn 480.000đ/năm), .com 320.000đ/năm, chưa gồm VAT.',
      natural: [
        'Nếu {target} chủ yếu phục vụ khách ở Việt Nam, **.vn** là lựa chọn rất đáng cân nhắc: đây là tên miền quốc gia do VNNIC quản lý, ' +
          'nhìn vào là biết thương hiệu Việt. **.com** thì quốc tế, quen thuộc và thường rẻ hơn. Cách an toàn mà nhiều shop chọn là ' +
          '*giữ cả hai* để không ai “chiếm” mất tên thương hiệu của bạn.',
        'Không có đuôi nào “tốt hơn tuyệt đối” đâu ạ. Bán hàng trong nước thì ưu tiên **.vn**; hướng ra quốc tế hoặc muốn chi phí thấp thì ' +
          'chọn **.com**. Nếu ngân sách cho phép, bạn đăng ký cả hai rồi trỏ chung về một website.'
      ],
      points: [
        '.vn: tên miền quốc gia (VNNIC quản lý), hợp với khách trong nước — giá mẫu 650.000đ năm đầu.',
        '.com: tên miền quốc tế, phổ biến — giá mẫu 320.000đ/năm.',
        'Mẹo: đăng ký cả hai để bảo vệ thương hiệu.'
      ],
      related: ['giay-to-vn', 'thanh-toan-gia-han', 'ten-mien-va-hosting']
    },
    {
      id: 'giay-to-vn',
      no: 3,
      category: 'Tên miền',
      question: 'Đăng ký tên miền .vn cần giấy tờ, thông tin gì?',
      chip: 'Đăng ký .vn cần giấy tờ gì?',
      keywords: [
        'giay to', 'thu tuc', 'ho so', 'cccd', 'can cuoc', 'cmnd', 'chung minh nhan dan', 'dinh danh', 'xac thuc thong tin',
        'ma so thue', 'mst', 'dang ky ten mien vn', 'dang ky mien vn', 'dang ky domain vn', 'dang ky vn', 'dang ky ten mien',
        'can gi de dang ky', 'thong tin dang ky', 'dieu kien dang ky', 'ca nhan dang ky', 'cong ty dang ky', 'nghi dinh 147',
        'chu the', 'dung ten', 'dung ten mien'
      ],
      answer:
        'Theo quy định hiện hành (Nghị định 147/2024/NĐ-CP, hiệu lực từ 25/12/2024), thông tin đăng ký tên miền .vn phải chính xác và khớp ' +
        'với giấy tờ nhận diện chủ thể. Cá nhân cung cấp họ tên, ngày sinh, số căn cước/CCCD, địa chỉ, email, số điện thoại; tổ chức cung cấp ' +
        'tên tổ chức, mã số thuế, địa chỉ và người đại diện. Thông tin không chính xác hoặc không xác định được chủ thể có thể khiến tên miền ' +
        'bị tạm ngừng hoặc thu hồi.',
      natural: [
        'Thủ tục đơn giản hơn bạn nghĩ! Nếu đứng tên **cá nhân**, bạn chuẩn bị họ tên, ngày sinh, **số căn cước/CCCD**, địa chỉ, email và ' +
          'số điện thoại. Nếu đứng tên **công ty**, cần tên công ty, **mã số thuế**, địa chỉ và người đại diện. Quan trọng nhất là thông tin ' +
          'phải *chính xác, khớp giấy tờ* — theo Nghị định 147/2024/NĐ-CP, khai sai có thể khiến tên miền bị tạm ngừng hoặc thu hồi.',
        'Bạn chỉ cần thông tin nhận diện đúng với giấy tờ: cá nhân dùng căn cước/CCCD, doanh nghiệp dùng mã số thuế và thông tin người đại diện. ' +
          'Nhân viên sẽ đối chiếu trước khi nộp hồ sơ, giúp {target} tránh rủi ro bị khóa tên miền về sau.'
      ],
      points: [
        'Cá nhân: họ tên, ngày sinh, số căn cước/CCCD, địa chỉ, email, số điện thoại.',
        'Tổ chức: tên tổ chức, mã số thuế, địa chỉ, người đại diện.',
        'Khai sai hoặc không xác định được chủ thể → có thể bị tạm ngừng/thu hồi (Nghị định 147/2024/NĐ-CP).'
      ],
      related: ['vn-hay-com', 'thanh-toan-gia-han', 'chuyen-nha-cung-cap']
    },
    {
      id: 'chon-goi-hosting',
      no: 4,
      category: 'Hosting',
      question: 'Bảng giá hosting và shop nhỏ nên chọn gói nào?',
      chip: 'Bảng giá hosting, chọn gói nào?',
      keywords: [
        'bang gia', 'gia hosting', 'hosting gia', 'gia host', 'goi hosting', 'goi host', 'chon goi', 'goi nao', 'nen dung goi',
        'nen chon goi', 'thue hosting', 'mua hosting', 'thue host', 'mua host', 're nhat', 'gia re', 'ngan sach', 'dung luong',
        'bang thong', 'goi khoi nghiep', 'goi kinh doanh', 'goi doanh nghiep', 'luot truy cap', 'nang cap goi', 'nang cap hosting',
        'hosting nao', 'host nao', 'gia', 'bao nhieu', 'chi phi', 'bao nhieu tien'
      ],
      answer:
        '{brand} có 3 gói hosting (giá mẫu, thanh toán theo năm, chưa gồm VAT): Khởi Nghiệp 39.000đ/tháng (2 GB SSD, 50 GB băng thông, ' +
        '1 website, 3 email); Kinh Doanh 79.000đ/tháng (6 GB SSD NVMe, 200 GB băng thông, 3 website, 10 email); Doanh Nghiệp 159.000đ/tháng ' +
        '(20 GB SSD NVMe, băng thông không giới hạn theo chính sách sử dụng hợp lý, 10 website, 30 email). Shop nhỏ dưới khoảng 10.000 lượt ' +
        'truy cập/tháng có thể bắt đầu với gói Khởi Nghiệp và nâng cấp khi cần.',
      natural: [
        'Với {target} mới bắt đầu (dưới khoảng 10.000 lượt truy cập mỗi tháng), gói **Khởi Nghiệp – 39.000đ/tháng** là đủ dùng và tiết kiệm. ' +
          'Khi bắt đầu chạy quảng cáo, đăng nhiều sản phẩm hoặc làm thêm website thứ hai, bạn chuyển lên **Kinh Doanh – 79.000đ/tháng** cho ' +
          'nhanh và rộng hơn. Gói **Doanh Nghiệp – 159.000đ/tháng** dành cho lượng truy cập lớn hoặc nhiều website. Nâng cấp lúc nào cũng được, ' +
          'không mất dữ liệu.',
        'Mình tóm tắt 3 gói (giá mẫu) để bạn dễ so sánh nhé — cứ chọn theo lượng khách truy cập và số website định chạy. Phần lớn shop nhỏ ' +
          'bắt đầu từ gói Khởi Nghiệp rồi nâng cấp sau khi đơn hàng tăng.'
      ],
      points: [
        'Khởi Nghiệp – 39.000đ/tháng: 2 GB SSD · 50 GB băng thông · 1 website · 3 email.',
        'Kinh Doanh – 79.000đ/tháng: 6 GB SSD NVMe · 200 GB băng thông · 3 website · 10 email.',
        'Doanh Nghiệp – 159.000đ/tháng: 20 GB SSD NVMe · băng thông không giới hạn (sử dụng hợp lý) · 10 website · 30 email.',
        'Giá mẫu, thanh toán theo năm, chưa gồm VAT.'
      ],
      cta: true,
      related: ['ssl-mien-phi', 'sao-luu', 'thanh-toan-gia-han']
    },
    {
      id: 'ssl-mien-phi',
      no: 5,
      category: 'Bảo mật',
      question: 'Hosting có kèm chứng chỉ SSL (HTTPS) miễn phí không?',
      chip: 'Có SSL (HTTPS) miễn phí không?',
      keywords: [
        'ssl', 'https', 'chung chi', 'chung chi bao mat', 'khoa xanh', 'o khoa', 'khong an toan', 'khong bao mat', 'ma hoa',
        'lets encrypt', 'let s encrypt', 'letsencrypt', 'encrypt', 'ssl mien phi', 'mien phi ssl', 'bao mat website', 'mien phi'
      ],
      answer:
        'Có. Tất cả gói hosting của {brand} kèm chứng chỉ SSL miễn phí của Let’s Encrypt và được tự động gia hạn. SSL mã hóa dữ liệu giữa ' +
        'trình duyệt và website (địa chỉ bắt đầu bằng https://); nếu thiếu SSL, trình duyệt sẽ cảnh báo “Không bảo mật”, khiến khách ngại ' +
        'nhập thông tin đặt hàng.',
      natural: [
        'Có nhé! Mọi gói hosting đều được tặng **SSL miễn phí (Let’s Encrypt)** và hệ thống *tự gia hạn* nên bạn không phải nhớ. Nhờ SSL, ' +
          '{target} chạy bằng **https://** với biểu tượng ổ khóa, dữ liệu khách nhập (tên, địa chỉ, số điện thoại) được mã hóa. Thiếu SSL, ' +
          'trình duyệt sẽ gắn nhãn “Không bảo mật” — khách dễ bỏ đi lắm.',
        'Bạn yên tâm, SSL đã có sẵn trong gói và miễn phí. Hệ thống tự cài và tự gia hạn chứng chỉ Let’s Encrypt cho tên miền của bạn ' +
          'ngay khi tên miền trỏ đúng về hosting.'
      ],
      points: [
        'SSL Let’s Encrypt miễn phí ở mọi gói, tự động gia hạn.',
        'Website chạy https:// có biểu tượng ổ khóa, dữ liệu được mã hóa.',
        'Không có SSL: trình duyệt cảnh báo “Không bảo mật”.'
      ],
      related: ['tro-ten-mien', 'chon-goi-hosting', 'sao-luu']
    },
    {
      id: 'tro-ten-mien',
      no: 6,
      category: 'Kỹ thuật',
      question: 'Trỏ tên miền về hosting thế nào và bao lâu thì chạy?',
      chip: 'Trỏ tên miền bao lâu thì chạy?',
      keywords: [
        'tro ten mien', 'tro domain', 'tro mien', 'tro ve hosting', 'tro ve host', 'tro dns', 'dns', 'nameserver', 'name server',
        'ban ghi a', 'a record', 'record', 'ket noi ten mien', 'ket noi domain', 'mat bao lau', 'bao lau thi chay', 'bao lau moi chay',
        'cap nhat dns', 'chua vao duoc', 'chua truy cap duoc', 'chua hien', 'chua chay', 'propagation', 'cau hinh ten mien', 'cau hinh dns',
        'doi nameserver', 'bao lau'
      ],
      answer:
        'Có hai cách: đổi nameserver của tên miền sang nameserver mà {brand} gửi trong email kích hoạt hosting, hoặc giữ nameserver cũ và tạo ' +
        'bản ghi A trỏ về địa chỉ IP của hosting. Thay đổi DNS thường có hiệu lực sau vài phút đến vài giờ, nhưng có thể mất tối đa 24–48 giờ ' +
        'để cập nhật trên toàn cầu.',
      natural: [
        'Cách dễ nhất là **đổi nameserver** của tên miền sang nameserver mà {brand} gửi trong email kích hoạt hosting — phần cấu hình còn lại ' +
          'hệ thống làm giúp bạn. Nếu muốn giữ DNS ở nơi cũ, bạn chỉ cần tạo **bản ghi A** trỏ về IP của hosting. Thường *vài phút đến vài giờ* ' +
          'là {target} lên, nhưng đôi khi phải chờ **tối đa 24–48 giờ** để DNS cập nhật trên toàn cầu — đó là chuyện bình thường nhé.',
        'Bạn có thể đổi nameserver (khuyên dùng) hoặc tạo bản ghi A. Sau khi đổi, hãy kiên nhẫn chờ DNS cập nhật: nhanh thì vài phút, ' +
          'chậm thì có thể đến 24–48 giờ tùy nhà mạng.'
      ],
      points: [
        'Cách 1 (khuyên dùng): đổi nameserver theo email kích hoạt hosting.',
        'Cách 2: giữ DNS cũ, tạo bản ghi A trỏ về IP hosting.',
        'Hiệu lực: vài phút – vài giờ, tối đa 24–48 giờ (DNS propagation).'
      ],
      related: ['ssl-mien-phi', 'email-ten-mien', 'ten-mien-va-hosting']
    },
    {
      id: 'email-ten-mien',
      no: 7,
      category: 'Email',
      question: 'Có tạo được email theo tên miền (VD: lienhe@tenshop.vn) không?',
      chip: 'Có email theo tên miền không?',
      keywords: [
        'email', 'e mail', 'mail', 'hop thu', 'email theo ten mien', 'email ten mien', 'mail ten mien', 'email doanh nghiep',
        'mail doanh nghiep', 'email rieng', 'email cong ty', 'mail cong ty', 'mx', 'ban ghi mx', 'gmail', 'outlook', 'webmail',
        'gui mail', 'nhan mail', 'gui thu', 'nhan thu', 'lienhe'
      ],
      answer:
        'Có. Mỗi gói hosting kèm hộp thư theo tên miền riêng: Khởi Nghiệp 3, Kinh Doanh 10, Doanh Nghiệp 30 hộp thư (dữ liệu mẫu). Bạn tạo ' +
        'hộp thư trong trang quản lý hosting, dùng qua webmail hoặc cài vào Outlook/điện thoại; tên miền cần có bản ghi MX trỏ về máy chủ email.',
      natural: [
        'Được chứ! Email dạng **lienhe@tenshop.vn** giúp {target} trông chuyên nghiệp hơn hẳn so với Gmail cá nhân. Gói Khởi Nghiệp có sẵn ' +
          '**3 hộp thư**, Kinh Doanh **10**, Doanh Nghiệp **30** (dữ liệu mẫu). Bạn tạo hộp thư trong trang quản lý, đọc qua webmail hoặc cài ' +
          'vào Outlook, điện thoại; chỉ cần tên miền có **bản ghi MX** đúng là gửi nhận bình thường.',
        'Có ạ. Email theo tên miền đã nằm sẵn trong gói hosting, bạn tự tạo hộp thư chỉ trong vài phút. Nếu trỏ nameserver về {brand}, ' +
          'bản ghi MX sẽ được cấu hình tự động.'
      ],
      points: [
        'Số hộp thư (mẫu): Khởi Nghiệp 3 · Kinh Doanh 10 · Doanh Nghiệp 30.',
        'Dùng qua webmail, Outlook hoặc ứng dụng email trên điện thoại.',
        'Cần bản ghi MX đúng để gửi/nhận thư.'
      ],
      related: ['tro-ten-mien', 'chon-goi-hosting', 'ten-mien-va-hosting']
    },
    {
      id: 'sao-luu',
      no: 8,
      category: 'Bảo mật',
      question: 'Dữ liệu website có được sao lưu (backup) và khôi phục không?',
      chip: 'Có sao lưu dữ liệu không?',
      keywords: [
        'sao luu', 'backup', 'back up', 'khoi phuc', 'restore', 'phuc hoi', 'mat du lieu', 'mat het du lieu', 'xoa nham',
        'lo xoa', 'du phong', 'ban sao', 'luu du lieu', 'an toan du lieu', 'bi mat du lieu', 'quay lai ban cu'
      ],
      answer:
        'Có. {brand} tự động sao lưu theo gói (chính sách mẫu): Khởi Nghiệp sao lưu hằng tuần, giữ 4 bản; Kinh Doanh và Doanh Nghiệp sao lưu ' +
        'hằng ngày, giữ 7 và 14 bản. Bạn có thể tự khôi phục trong trang quản lý hoặc nhờ kỹ thuật hỗ trợ. Nên tự tải thêm một bản sao lưu ' +
        'về máy trước mỗi lần thay đổi lớn.',
      natural: [
        'Có, dữ liệu {target} được **sao lưu tự động**: gói Khởi Nghiệp *hằng tuần* (giữ 4 bản), Kinh Doanh và Doanh Nghiệp *hằng ngày* ' +
          '(giữ 7 và 14 bản) — đây là chính sách mẫu. Lỡ xóa nhầm hay cập nhật hỏng, bạn bấm khôi phục về bản gần nhất trong trang quản lý, ' +
          'hoặc nhờ kỹ thuật làm giúp. Mẹo nhỏ: trước khi sửa lớn, tự tải thêm một bản về máy cho chắc.',
        'Bạn yên tâm, hệ thống có sao lưu tự động theo từng gói và khôi phục được khi cần. Gói càng cao thì sao lưu càng thường xuyên ' +
          'và giữ càng nhiều bản.'
      ],
      points: [
        'Khởi Nghiệp: sao lưu hằng tuần, giữ 4 bản.',
        'Kinh Doanh: hằng ngày, giữ 7 bản · Doanh Nghiệp: hằng ngày, giữ 14 bản.',
        'Tự khôi phục trong trang quản lý hoặc nhờ kỹ thuật hỗ trợ (chính sách mẫu).'
      ],
      related: ['chon-goi-hosting', 'chuyen-nha-cung-cap', 'ssl-mien-phi']
    },
    {
      id: 'chuyen-nha-cung-cap',
      no: 9,
      category: 'Chuyển đổi',
      question: 'Có chuyển được website, tên miền từ nhà cung cấp khác sang không?',
      chip: 'Chuyển từ nơi khác sang được không?',
      keywords: [
        'chuyen hosting', 'chuyen host', 'chuyen ten mien', 'chuyen domain', 'chuyen website', 'chuyen web', 'chuyen du lieu',
        'chuyen nha cung cap', 'doi nha cung cap', 'nha cung cap khac', 'nha cung cap cu', 'ben khac', 'noi khac', 'tu noi khac',
        'chuyen ve', 'chuyen sang', 'transfer', 'migrate', 'di chuyen', 'ma epp', 'epp', 'auth code', 'ma chuyen', 'ma xac nhan chuyen',
        'chuyen'
      ],
      answer:
        'Có. Kỹ thuật {brand} hỗ trợ chuyển dữ liệu website miễn phí (dữ liệu mẫu). Với tên miền quốc tế như .com, bạn cần mã chuyển ' +
        '(EPP/Auth code) từ nhà cung cấp cũ; theo chính sách ICANN hiện hành, tên miền vừa đăng ký hoặc vừa chuyển trong vòng 60 ngày thường ' +
        'chưa chuyển được. Tên miền .vn chuyển nhà đăng ký theo quy trình của VNNIC và cần chủ thể tên miền xác nhận.',
      natural: [
        'Hoàn toàn được! Phần **website** thì kỹ thuật bên mình *chuyển giúp miễn phí* (dữ liệu mẫu), {target} gần như không bị gián đoạn. ' +
          'Với **tên miền .com**, bạn xin nhà cung cấp cũ **mã chuyển (EPP/Auth code)** — lưu ý tên miền vừa đăng ký hoặc vừa chuyển trong ' +
          'vòng **60 ngày** thường chưa chuyển được theo chính sách ICANN hiện hành. Với **.vn**, việc đổi nhà đăng ký làm theo quy trình ' +
          'của VNNIC và cần chủ tên miền xác nhận.',
        'Được ạ. Bạn chuẩn bị quyền truy cập hosting cũ và mã chuyển tên miền, phần còn lại kỹ thuật sẽ hướng dẫn từng bước để ' +
          '{target} chuyển sang an toàn.'
      ],
      points: [
        'Website: hỗ trợ chuyển dữ liệu miễn phí (dữ liệu mẫu).',
        '.com: cần mã EPP/Auth code; thường chưa chuyển được trong 60 ngày sau khi đăng ký/chuyển (chính sách ICANN).',
        '.vn: đổi nhà đăng ký theo quy trình VNNIC, chủ tên miền xác nhận.'
      ],
      related: ['tro-ten-mien', 'sao-luu', 'giay-to-vn']
    },
    {
      id: 'thanh-toan-gia-han',
      no: 10,
      category: 'Thanh toán',
      question: 'Thanh toán, gia hạn và hoàn tiền thế nào?',
      chip: 'Thanh toán, gia hạn, hoàn tiền?',
      keywords: [
        'thanh toan', 'tra tien', 'chuyen khoan', 'vi dien tu', 'momo', 'zalopay', 'vnpay', 'quet ma', 'qr', 'the ngan hang',
        'the tin dung', 'gia han', 'het han', 'qua han', 'nhac gia han', 'hoan tien', 'tra lai tien', 'lay lai tien', 'refund',
        'huy dich vu', 'tien coc', 'dong tien'
      ],
      answer:
        'Bạn có thể thanh toán bằng chuyển khoản ngân hàng, quét mã QR hoặc ví điện tử (dữ liệu mẫu). Hệ thống nhắc gia hạn qua email/SMS ' +
        'trước 30, 15 và 7 ngày; dịch vụ quá hạn sẽ bị tạm ngưng, nên gia hạn sớm để tránh gián đoạn hoặc mất tên miền. Hosting được hoàn tiền ' +
        'trong 7 ngày đầu nếu chưa hài lòng (chính sách mẫu); tên miền không hoàn tiền sau khi đăng ký thành công.',
      natural: [
        'Thanh toán rất linh hoạt: **chuyển khoản, quét QR hoặc ví điện tử** (dữ liệu mẫu). Bạn không lo quên gia hạn vì hệ thống nhắc qua ' +
          'email/SMS **trước 30, 15 và 7 ngày** — nhưng đừng để quá hạn nhé, dịch vụ sẽ bị tạm ngưng và nếu để quá lâu, tên miền có thể bị ' +
          'thu hồi rồi người khác đăng ký mất. Về hoàn tiền: hosting được **hoàn trong 7 ngày đầu** nếu chưa hài lòng; riêng **tên miền không ' +
          'hoàn tiền** sau khi đăng ký thành công (chính sách mẫu).',
        'Bạn chọn hình thức thanh toán thuận tiện nhất, hệ thống sẽ nhắc gia hạn trước 30/15/7 ngày. Hosting có cam kết hoàn tiền 7 ngày đầu ' +
          '(mẫu), còn tên miền thì không hoàn sau khi đã đăng ký.'
      ],
      points: [
        'Thanh toán: chuyển khoản, quét QR, ví điện tử (dữ liệu mẫu).',
        'Nhắc gia hạn trước 30 / 15 / 7 ngày; quá hạn dịch vụ bị tạm ngưng.',
        'Hoàn tiền hosting trong 7 ngày đầu; tên miền không hoàn sau khi đăng ký (chính sách mẫu).'
      ],
      cta: true,
      related: ['chon-goi-hosting', 'vn-hay-com', 'chuyen-nha-cung-cap']
    }
  ];

  /* Thứ tự "phổ biến" dùng khi cần lấp đủ 3 gợi ý */
  VC.POPULAR = [
    'vn-hay-com', 'chon-goi-hosting', 'ssl-mien-phi', 'tro-ten-mien', 'email-ten-mien',
    'ten-mien-va-hosting', 'giay-to-vn', 'sao-luu', 'chuyen-nha-cung-cap', 'thanh-toan-gia-han'
  ];

  /* Ý định hội thoại phụ (không tính vào bộ 10 FAQ) — cụm từ không dấu */
  VC.INTENTS = {
    booking: [
      'dat lich', 'hen lich', 'dat hen', 'lich hen', 'gap nhan vien', 'gap tu van vien', 'noi chuyen voi nhan vien', 'tu van truc tiep',
      'nhan vien tu van', 'nhan vien goi', 'goi lai cho', 'goi dien cho', 'lien he nhan vien', 'gap nguoi that', 'nguoi that', 'tu van vien'
    ],
    hours: [
      'gio lam viec', 'thoi gian lam viec', 'lam viec luc', 'lam viec vao', 'lam viec khong', 'co lam viec', 'mo cua', 'chu nhat co',
      'luc nao co nhan vien', 'may gio co nhan vien', 'nhan vien lam viec', '24 7', 'ho tro 24', 'truc 24'
    ],
    about: [
      'ban la ai', 'ban la bot', 'ban la nguoi', 'ban la may', 'la chatbot', 'chatbot nay', 'robot', 'ban lam duoc gi', 'giup duoc gi',
      'ho tro duoc gi', 'tro ly ao', 'ban biet gi'
    ],
    list: [
      'tat ca cau hoi', 'danh sach cau hoi', 'xem 10 cau hoi', '10 cau hoi', 'cau hoi thuong gap', 'faq', 'menu', 'cac chu de',
      'hoi duoc gi', 'hoi gi duoc'
    ],
    thanks: ['cam on', 'thanks', 'thank you', 'thank', 'tks', 'thx', 'cam ta'],
    bye: ['tam biet', 'bye', 'goodbye', 'hen gap lai', 'chao tam biet'],
    greeting: ['xin chao', 'chao', 'hello', 'hi', 'helo', 'alo', 'hey', 'chao ban', 'chao shop', 'chao ad', 'chao admin']
  };

  /* Tín hiệu NGOÀI PHẠM VI bộ kiến thức: có các cụm này mà không khớp mạnh với FAQ nào → không trả lời, mời đặt lịch */
  VC.OUT_OF_SCOPE = [
    'thiet ke logo', 'logo', 'thiet ke website', 'thiet ke web', 'thiet ke giao dien', 'thiet ke banner', 'lam app', 'ung dung di dong',
    'quang cao', 'chay ads', 'facebook ads', 'google ads', 've may bay', 'dat ve', 'khach san', 'tuyen dung', 'viec lam', 'xin viec',
    'hoa don vat', 'xuat hoa don', 'hoa don do', 'bi hack', 'hacker', 'virus', 'ma doc', 'thoi tiet', 'ban dien thoai',
    'mua dien thoai', 'sua dien thoai', 'laptop', 'vay von', 'giao hang', 'ship hang', 'van chuyen', 'cong no', 'hop dong dai ly',
    'dai ly', 'gia si', 'spam', 'vao spam', 'thu rac'
  ];

  /* Từ khóa quá chung: chỉ cộng điểm thấp, không tự đủ ngưỡng trả lời */
  VC.GENERIC = [
    'gia', 'bao nhieu', 'bao nhieu tien', 'chi phi', 'mien phi', 'bao lau', 'mat bao lau', 'chuyen', 'domain', 'hosting',
    'com', 'net', 'record'
  ];
})(typeof window !== 'undefined' ? window : globalThis);
