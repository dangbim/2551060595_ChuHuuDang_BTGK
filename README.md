# Dịch vụ hỗ trợ · CampusMind (Standalone)

Thư mục này chứa **phần Dịch vụ** của dự án `homework-main` được tách thành một
trang độc lập, gồm đầy đủ HTML – CSS – JavaScript và **không phụ thuộc** vào
`js/app.js`, `js/data.js`, `js/ai-engine.js` hay `css/styles.css` của dự án gốc.

## Cấu trúc

```text
services-standalone/
├── index.html          # Trang Dịch vụ + modal AI Navigator + modal Đặt lịch
├── css/
│   └── services.css    # Design tokens, status pill, card, chip, modal, toast
├── js/
│   ├── data.js         # 12 dịch vụ (tách từ CAMPUS_DATA.services)
│   └── services.js     # Render, tìm kiếm, lọc, sắp xếp, AI quiz, đặt lịch
└── README.md
```

## Cách chạy

Cách 1: mở trực tiếp `index.html` bằng trình duyệt.

Cách 2 (khuyến nghị): chạy một static server tại thư mục gốc dự án rồi truy cập
`http://localhost:8000/services-standalone/`.

```powershell
# Chạy tại thư mục homework-main
python -m http.server 8000
# hoặc
npx serve .
```

## Chức năng

- Hiển thị 12 dịch vụ theo danh mục, badge trạng thái và chuyên viên phụ trách.
- Tìm kiếm theo tên / mô tả / chuyên viên, có highlight từ khóa.
- Lọc theo danh mục ở sidebar hoặc chip lọc nhanh; số lượng danh mục được tính
  tự động từ dữ liệu (không hard-code).
- Sắp xếp: Phổ biến (dịch vụ nổi bật trước), Mới nhất, Thời lượng ngắn nhất.
- Trạng thái rỗng khi không có kết quả, kèm nút "Xóa bộ lọc".
- AI Navigator: khảo sát 4 câu hỏi, gợi ý dịch vụ phù hợp (logic tách từ
  `js/ai-engine.js`), có thể đặt lịch ngay theo gợi ý.
- Modal đặt lịch: chọn ngày/khung giờ, kiểm tra ngày hợp lệ, hiển thị toast xác
  nhận. Dịch vụ đang tạm ngưng sẽ bị vô hiệu hóa nút đặt lịch.
- Hỗ trợ bàn phím: đóng modal bằng `Esc`, click nền để đóng, focus được khôi
  phục sau khi đóng.

## Ghi chú

- Trang dùng **Tailwind CSS CDN**, **Lucide Icons** và **Google Fonts**, nên cần
  Internet khi mở lần đầu. Nếu cần chạy hoàn toàn offline, hãy build Tailwind
  thành file CSS tĩnh và tải font/icon về cục bộ.
- Link "Về CampusMind" trỏ tới `../index.html`, vì thư mục này nằm trong dự án
  gốc. Khi copy thư mục ra ngoài, hãy sửa link này cho phù hợp.
- Dữ liệu đặt lịch chỉ mô phỏng ở phía client (toast xác nhận), chưa kết nối API.
