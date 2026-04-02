# 🏦 NGÂN HÀNG DỄ BỊ TẤN CÔNG - Tóm Tắt Dự Án Hoàn Chỉnh

## Những Gì Được Tạo

Một bài thực hành giáo dục toàn diện về các lỗ hổng **SQL Injection** và **XSS** trong ứng dụng web Node.js/Express, bao gồm các cuộc tấn công hoạt động và các bản vá bảo mật.

---

## 📦 Tệp Được Tạo

### Tệp Ứng Dụng
- **`app.js`** - Ứng dụng ngân hàng dễ bị tấn công với các lỗ hổng SQL Injection và XSS
- **`app-secure.js`** - Phiên bản an toàn đã sửa chữa với tất cả các bản sửa
- **`package.json`** - Phụ thuộc dự án và các tập lệnh npm
- **`public/index-vulnerable.html`** - Giao diện tương tác để khai thác lỗ hổng
- **`public/index-secure.html`** - Giao diện tương tác hiển thị các bản sửa bảo mật

### Tệp Tài Liệu
- **`README.md`** - Tài liệu dự án hoàn chỉnh
- **`QUICKSTART.md`** - Hướng dẫn thiết lập và tấn công trong 5 phút
- **`CODE_WALKTHROUGH.md`** - So sánh mã từng cạnh
- **`SETUP.md`** - Tệp này

---

## 🚀 Bắt Đầu Nhanh (Sao Chép & Dán)

```bash
# Điều hướng đến dự án
cd "Vurnurela Bank"

# Cài đặt phụ thuộc
npm install

# Chạy phiên bản dễ bị tấn công
npm start
# Mở trên http://localhost:3000

# Ở một thiết bị đầu cuối khác, chạy phiên bản an toàn (tùy chọn)
npm run start-secure
# Cũng mở trên http://localhost:3000
```

---

## 🎯 Phần A: Bản Trình Diễn SQL Injection

### Cách Nó Hoạt Động:
1. Mở http://localhost:3000 (phiên bản dễ bị tấn công)
2. Đi tới tab **"Part A: SQL Injection"**
3. **Tên Người Dùng:** `' OR '1'='1`
4. **Mật Khẩu:** (bất kỳ giá trị)
5. Nhấp vào **"Try SQL Injection Login"**
6. ✅ **Bạn đăng nhập thành công mà không biết mật khẩu!**

### Tại Sao Nó Hoạt Động:
Mã dễ bị tấn công sử dụng nối chuỗi:
```javascript
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

Với tải trọng của bạn, SQL trở thành:
```sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '(bất kỳ)'
```

Điều kiện `'1'='1'` luôn đúng, bỏ qua xác thực!

### Bản Sửa (app-secure.js):
```javascript
const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
db.get(query, [username, password], callback);  // ← Tham số được truyền riêng biệt!
```

Đầu vào của người dùng hiện được coi là **dữ liệu**, không phải mã SQL.

---

## 🎯 Phần B: Bản Trình Diễn XSS

### Cách Nó Hoạt Động:
1. Mở http://localhost:3000 (phiên bản dễ bị tấn công)
2. Đi tới tab **"Part B: XSS Attack"**
3. Nhấp vào **"Set Sample Session Cookie"**
4. **Người Nhận:** `admin`
5. **Tin Nhắn:** `<img src=x onerror="alert('Cookie: ' + document.cookie)">`
6. Nhấp vào **"Send XSS Payload"**
7. ✅ **JavaScript thực hiện và hiển thị các cookie của bạn!**

### Tại Sao Nó Hoạt Động:
Mã dễ bị tấn công phản ánh đầu vào của người dùng trực tiếp vào HTML:
```javascript
const notification = `
  <div class="notification">
    <p>Message from ${recipient}:</p>
    <div class="message-content">${message}</div>
  </div>
`;
```

Tải trọng của bạn trở thành HTML thực tế mà trình duyệt thực hiện:
```html
<img src=x onerror="alert('Cookie: ' + document.cookie)">
```

Thuộc tính `onerror` chứa JavaScript chạy khi ảnh không tải!

### Bản Sửa (app-secure.js):
**Phần 1 - Thoát HTML:**
```javascript
function escapeHtml(text) {
  const map = {
    '<': '&lt;',   // ← Ngăn chặn giải thích thẻ HTML
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '&': '&amp;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
const escapedMessage = escapeHtml(message);  // HTML hiện được an toàn
```

**Phần 2 - HttpOnly Cookies:**
```javascript
res.cookie('session_user', username, { 
  httpOnly: true,      // ← JavaScript không thể đọc cookie này
  secure: true,
  sameSite: 'strict'
});
```

---

## 📊 So Sánh Lỗ Hổng vs Bản Sửa

| Khía Cạnh | Dễ Bị Tấn Công | An Toàn |
|--------|-----------|--------|
| **Truy Vấn SQL** | Nối chuỗi | Truy vấn tham số hóa |
| **Trình Điều Khiển Cơ Sở Dữ Liệu** | Thực hiện input từ người dùng dưới dạng SQL | Coi input là dữ liệu thuần túy |
| **Xuất HTML** | Hiển thị trực tiếp | Thoát HTML thành văn bản |
| **Cookie** | `httpOnly: false` (JS có thể ăn cắp) | `httpOnly: true` (JS không thể truy cập) |
| **SQL Injection** | ✅ Bỏ qua đăng nhập | ❌ Thất bại an toàn (không có người dùng) |
| **Tấn Công XSS** | ✅ JavaScript thực hiện | ❌ Mã được hiển thị dưới dạng văn bản |
| **Bảo Mật** | Không có | Bảo vệ từng lớp |

---

## 📂 Cấu Trúc Dự Án

```
Vurnurela Bank/
├── app.js                          # Ứng dụng dễ bị tấn công (SQL injection + XSS)
├── app-secure.js                   # Ứng dụng an toàn (các bản sửa đã áp dụng)
├── package.json                    # Phụ thuộc
├── README.md                       # Tài liệu đầy đủ
├── QUICKSTART.md                   # Bắt đầu nhanh trong 5 phút
├── CODE_WALKTHROUGH.md             # So sánh mã
├── SETUP.md                        # Tệp này
└── public/
    ├── index-vulnerable.html       # Giao diện dễ bị tấn công
    └── index-secure.html           # Giao diện an toàn
```

---

## 🔧 Chi Tiết Kỹ Thuật

### Công Nghệ Được Sử Dụng
- **Node.js** - Thời gian chạy JavaScript
- **Express.js** - Khung web (4.18.2)
- **SQLite3** - Cơ sở dữ liệu trong bộ nhớ
- **Vanilla HTML/CSS/JavaScript** - Giao diện người dùng

### Người Dùng Mẫu Cơ Sở Dữ Liệu
```
Tên Người Dùng: admin
Mật Khẩu: password123

Tên Người Dùng: customer1
Mật Khẩu: mypass456

Tên Người Dùng: customer2
Mật Khẩu: secret789
```

### Điểm Cuối API

| Điểm Cuối | Phương Pháp | Dễ Bị Tấn Công? |
|----------|--------|-------------|
| `/login` | POST | Có (SQL Injection) |
| `/send-notification` | POST | Có (XSS) |
| `/accounts` | GET | SQL Injection |
| `/check-cookies` | GET | Không |
| `/` | GET | Phục Vụ HTML |

---

## 🎓 Mục Tiêu Học Tập

Sau bản trình diễn này, bạn sẽ hiểu:

### SQL Injection:
- ✅ Cách nối SQL cho phép tiêm mã
- ✅ Tại sao truy vấn tham số hóa ngăn chặn nó
- ✅ Cách triển khai bản sửa chữa trong Node.js
- ✅ Tại sao đây là biện pháp phòng chống chính

### XSS (Cross-Site Scripting):
- ✅ Cách HTML chưa thoát cho phép tiêm JavaScript
- ✅ Tại sao thoát HTML ngăn chặn nó
- ✅ Cách cookie HttpOnly giảm thiểu thiệt hại từ XSS
- ✅ Bối cảnh bảo mật của trình duyệt và giới hạn

### Mã Hóa An Toàn:
- ✅ Nguyên tắc bảo vệ từng lớp (bảo vệ nhiều tầng)
- ✅ Xác thực đầu vào vs. mã hóa đầu ra
- ✅ Các cờ cookie được bảo mật
- ✅ Tại sao thư viện và khung công tác quan trọng

---

## 📚 Những Điểm Chính

### Đối Với SQL Injection:
1. **Không bao giờ nối input từ người dùng vào chuỗi SQL**
2. **Luôn sử dụng truy vấn tham số hóa** - Đây không phải là thương lượng
3. **Hầu hết ORMs xử lý công việc này tự động** - Sử dụng chúng khi có thể
4. **Xác thực phía máy chủ** - Kiểm tra phía máy khách là không đủ

### Đối Với XSS:
1. **Luôn thoát kết quả HTML** - Chuyển đổi `<>"`'& thành thực thể
2. **Sử dụng cookie HttpOnly** - Ngăn JavaScript từ việc cắp phiên
3. **Đặt Tiêu đề Bảo mật** - CSP, X-XSS-Protection, v.v..
4. **Chính Sách Bảo Mật Nội Dung (CSP)** - Hạn chế nơi có thể tải tập lệnh

### Bảo Mật Chung:
1. **Bảo vệ từng lớp** - Sử dụng nhiều tầng bảo mật
2. **Nguyên tắc của đặc quyền tối thiểu** - Quyền tối thiểu
3. **Cập nhật thường xuyên** - Giữ cho khung công tác và phụ thuộc hiện tại
4. **Nhận thức bảo mật** - Đào tạo là cần thiết

---

## 🧪 Hướng Dẫn Kiểm Tra

### Kiểm Tra Ngăn Chặn SQL Injection
```bash
# Chạy phiên bản an toàn
npm run start-secure

# Cố gắng đăng nhập với: ' OR '1'='1
# Kết Quả: ❌ Đăng nhập thất bại (input được coi như tên người dùng theo nghĩa đen)
# Lý Do: Truy vấn tham số hóa giữ SQL và dữ liệu riêng biệt
```

### Kiểm Tra Ngăn Chặn XSS
```bash
# Chạy phiên bản an toàn
npm run start-secure

# Thử tải trọng XSS: <img src=x onerror="alert('XSS')">
# Kết Quả: ❌ JavaScript không thực hiện
# Lý Do: HTML được thoát thành &lt;img src=x onerror=...&gt;
```

---

## 🔍 Khám Phá Mã

### Tệp Chính Cần Xem Xét:

**Mã Dễ Bị Tấn Công:**
- `app.js` - Dòng 45-60 (SQL Injection trong /login)
- `app.js` - Dòng 88-102 (XSS trong /send-notification)

**Mã An Toàn:**
- `app-secure.js` - Dòng 35-60 (Fixed /login với truy vấn tham số hóa)
- `app-secure.js` - Dòng 63-113 (Fixed /send-notification với thoát HTML)

**Giao Diện:**
- `public/index-vulnerable.html` - Bản trình diễn tấn công tương tác
- `public/index-secure.html` - Bản trình diễn sửa chữa bảo mật

---

## 🆘 Khắc Phục Sự Cố

### Cổng Đã Được Sử Dụng
```bash
# Tìm những gì trên cổng 3000
lsof -i :3000

# Giết quá trình nếu cần
kill -9 <PID>

# Hoặc sử dụng một cổng khác (chỉnh sửa app.js)
```

### npm install Thất Bại
```bash
# Xóa bộ nhớ cache npm
npm cache clean --force

# Cài đặt lại
npm install
```

### Các Cuộc Tấn Công Không Hoạt Động
1. Đảm bảo bạn đang chạy phiên bản dễ bị tấn công (`npm start`, không phải `npm run start-secure`)
2. Làm mới trình duyệt (Cmd+Shift+R / Ctrl+Shift+R)
3. Kiểm tra công cụ phát triển bộ sưu tập (F12)
4. Xác minh định dạng tải trọng chính xác (sao chép từ tài liệu)

---

## 📖 Đọc Thêm

### Tài Nguyên OWASP:
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Web Security PortSwigger:
- [SQL Injection](https://portswigger.net/web-security/sql-injection)
- [Cross-Site Scripting](https://portswigger.net/web-security/cross-site-scripting)

### Hướng Dẫn Bảo Mật:
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [CWE-79: Cross-site Scripting](https://cwe.mitre.org/data/definitions/79.html)

---

## ✅ Danh Sách Kiểm Tra: Những Gì Bạn Đã Học

- [ ] Hiểu cách SQL injection hoạt động
- [ ] Khai thác thành công đăng nhập dễ bị tấn công
- [ ] Hiểu cách truy vấn tham số hóa ngăn chặn SQL injection
- [ ] Khai thác XSS để trích xuất cookie
- [ ] Hiểu cách thoát HTML ngăn chặn XSS
- [ ] Tìm hiểu về các cờ cookie HttpOnly
- [ ] So sánh mã dễ bị tấn công vs. an toàn
- [ ] Thiết lập và chạy cả hai phiên bản
- [ ] Đọc các tài nguyên bảo mật chính thức

---

## 📝 Ghi Chú Cho Giảng Viên/Người Hỗ Trợ

### Phân Bổ Thời Gian Lớp:
- **Thiết Lập (5 phút):** npm install và bắt đầu
- **SQL Injection (10 phút):** Giải thích, trình diễn, để học sinh thử
- **XSS (10 phút):** Giải thích, trình diễn, để học sinh thử
- **Sửa Chữa (10 phút):** Hiển thị so sánh mã, giải thích lý do tại sao chúng hoạt động
- **Thảo Luận (5 phút):** Ví dụ thực tế, công khai có trách nhiệm

### Các Hoạt Động Thực Hành:
1. Học sinh thực hiện các cuộc tấn công chính họ
2. Thử các biến thể khác nhau của tải trọng
3. So sánh mã dễ bị tấn công vs. an toàn từng cạnh
4. Thảo luận về lý do tại sao mỗi bản sửa chữa quan trọng

### Đánh Giá:
- Học sinh có thể giải thích cách SQL injection hoạt động?
- Họ có thể xác định mã dễ bị tấn công?
- Họ có hiểu TẠI SAO truy vấn tham số hóa hoạt động?
- Họ có thể áp dụng các mẫu này cho mã của riêng họ?

---

## 🔐 Tuyên Bố Bảo Mật

**Mã này chỉ dành cho GỐC GIÁO DỤC.** Sử dụng các kỹ thuật này chống lại các hệ thống mà không có sự cho phép rõ ràng là:
- ❌ Bất Hợp Pháp (Luật Gian Lận Và Lạm Dụng Máy Tính, luật tương tự)
- ❌ Không Đạo Đức
- ❌ Có Hại Cho Sự Nghiệp Của Bạn

**Nếu bạn tìm thấy một lỗ hổng thực sự:** Sử dụng công khai có trách nhiệm thông qua chương trình bảo mật/trương bug-bounty của tổ chức.

---

## 🎯 Bước Tiếp Theo

1. **Chạy phiên bản dễ bị tấn công** và khai thác cả hai lỗ hổng
2. **Đọc mã** trong app.js và app-secure.js
3. **Hiểu các bản sửa chữa** bằng cách so sánh từng cạnh
4. **Nghiên cứu** các tài nguyên OWASP chính thức
5. **Áp dụng cho mã của bạn** - Xem Xét các dự án của bạn cho các lỗ hổng tương tự

---

**Sẵn Sàng Bắt Đầu?**

```bash
cd "Vurnurela Bank"
npm install
npm start
# Truy cập http://localhost:3000
```

Thích Học Mã An Toàn! 🎓🔒
