# 🚀 Hướng Dẫn Bắt Đầu Nhanh - Bản Trình Diễn Ngân Hàng Dễ Bị Tấn Công

## Cài Đặt & Thiết Lập (5 phút)

### Bước 1: Cài Đặt Phụ Thuộc

```bash
cd "Vurnurela Bank"
npm install
```

Điều này cài đặt:
- **express** - Khung web
- **sqlite3** - Cơ sở dữ liệu trong bộ nhớ
- **body-parser** - Phân tích các phần thân yêu cầu

### Bước 2: Chạy Phiên Bản Dễ Bị Tấn Công

```bash
npm start
```

Bạn sẽ thấy:
```
╔════════════════════════════════════════════════════════════════╗
║        VULNERABLE BANK APP - Educational Demo                 ║
║                                                                ║
║  ⚠️  WARNING: This app contains intentional vulnerabilities   ║
║  ⚠️  This is for LEARNING PURPOSES ONLY                       ║
║                                                                ║
║  Server running on http://localhost:3000                       ║
║                                                                ║
║  VULNERABLE TO:                                                ║
║  • SQL Injection (Login bypass)                                ║
║  • Cross-Site Scripting (XSS - Cookie stealing)                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

Mở trình duyệt của bạn và truy cập: **http://localhost:3000**

---

## 🎯 Phần A: Bản Trình Diễn SQL Injection

### Tải Trọng Tấn Công
```
Tên Người Dùng: ' OR '1'='1
Mật Khẩu: (bất kỳ)
```

### Từng Bước:

1. Trong tab "Part A: SQL Injection"
2. Trong trường **Tên Người Dùng**, nhập: `' OR '1'='1`
3. Trong trường **Mật Khẩu**, nhập: `password` (bất kỳ giá trị)
4. Nhấp vào **"Try SQL Injection Login"**

### Kết Quả Dự Kiến:
✅ **Xác Thực Thành Công!**  
Bạn sẽ thấy: `Welcome admin!`

### Những Gì Đã Xảy Ra:

Mã dễ bị tấn công đã tạo truy vấn này:
```sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'password'
```

Vì `'1'='1'` **luôn đúng**, truy vấn trả về người dùng và xác thực thành công!

---

## 🎯 Phần B: Bản Trình Diễn XSS

### Bước 1: Đặt Cookie Phiên Mẫu

Nhấp vào nút **"Set Sample Session Cookie"**  
Bạn sẽ thấy: ✅ Sample session cookies set!

### Bước 2: Thực Hiện Tải Trọng XSS

Tải trọng sử dụng:
```html
<img src=x onerror="alert('Cookie: ' + document.cookie)">
```

Các Bước:
1. Trong tab "Part B: XSS Attack"
2. **Tên Người Nhận:** nhập `admin`
3. **Tải Trọng Tin Nhắn:** Dán tải trọng ở trên
4. Nhấp vào **"Send XSS Payload"**

### Kết Quả Dự Kiến:
✅ **JavaScript Được Thực Hiện!**  
Một hộp cảnh báo sẽ xuất hiện hiển thị các cookie của bạn.

### Những Gì Đã Xảy Ra:

Tải trọng của bạn được hiển thị dưới dạng HTML:
```html
<div class="notification">
  <p>Message from admin:</p>
  <div class="message-content"><img src=x onerror="alert('Cookie: ' + document.cookie)"></div>
</div>
```

Trình duyệt thực hiện thuộc tính `onerror`, đó là mã JavaScript!

---

## 🔐 Phần C: Kiểm Tra Phiên Bản An Toàn

### Chạy Phiên Bản Được Sửa Chữa

```bash
npm run start-secure
```

Bạn sẽ thấy:
```
╔════════════════════════════════════════════════════════════════╗
║           SECURE BANK APP - Patched Version                    ║
║                                                                ║
║  ✅ Security fixes applied:                                    ║
║  • Parameterized queries (SQL Injection prevention)             ║
║  • HTML escaping (XSS prevention)                               ║
║  • HttpOnly cookies (XSS mitigation)                            ║
║  • Secure cookie flags                                          ║
║                                                                ║
║  Server running on http://localhost:3000                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Kiểm Tra 1: Thử SQL Injection Trên Phiên Bản An Toàn

1. Sử dụng tải trọng: `' OR '1'='1`
2. **Kết Quả:** ❌ **Đăng Nhập Thất Bại** - Tải trọng được coi như một tên người dùng theo nghĩa đen
3. **Tại Sao:** Truy vấn tham số hóa giữ mã SQL và đầu vào từ người dùng riêng biệt

### Kiểm Tra 2: Thử XSS Trên Phiên Bản An Toàn

1. Sử dụng tải trọng: `<img src=x onerror="alert('XSS')">`
2. **Kết Quả:** ❌ **Tập Lệnh Không Thực Hiện** - HTML được thoát thành văn bản
3. **Tại Sao:** Các ký tự HTML đặc biệt được chuyển đổi thành thực thể (`<` → `&lt;`)

---

## 📊 Bảng So Sánh

| Khía Cạnh | Dễ Bị Tấn Công | An Toàn |
|--------|-----------|--------|
| **Truy Vấn SQL** | `SELECT * FROM users WHERE username = '${username}'` | `SELECT * FROM users WHERE username = ?` + `[username]` |
| **Kết Quả Tấn Công** | ✅ Bỏ qua đăng nhập | ❌ Đăng nhập thất bại an toàn |
| **Xuất HTML** | Đầu vào người dùng được hiển thị như-là | Đầu vào người dùng được thoát HTML |
| **Kết Quả XSS** | ✅ JavaScript thực hiện | ❌ Mã được hiển thị dưới dạng văn bản |
| **Cookie** | JavaScript có thể đọc `document.cookie` | HttpOnly ngăn chặn truy cập |

---

## 🔬 Kiểm Tra Mã

### Mã SQL Injection Dễ Bị Tấn Công

Tệp: `app.js` (dòng 45-60)

```javascript
// D\u1ec4 B\u1eca T\u1ea4N C\u00d4NG: Nối chuỗi cho phép SQL injection
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

db.get(query, (err, row) => {
  if (row) {
    res.json({ success: true, message: `Welcome ${row.username}!` });
  }
});
```

### Mã XSS Dễ Bị Tấn Công

Tệp: `app.js` (dòng 88-102)

```javascript
// LỖ HỔNG: Đầu vào từ người dùng được phản ánh trực tiếp mà không cần xử lý
const notification = `
  <div class="notification">
    <p>Message from ${recipient}:</p>
    <div class="message-content">${message}</div>
  </div>
`;
```

---

## 💡 Bài Học Bảo Mật Chính

### Tại Sao SQL Injection Hoạt Động (Dễ Bị Tấn Công):
- Đầu vào từ người dùng được nối trực tiếp vào chuỗi SQL
- Công cụ cơ sở dữ liệu không thể phân biệt giữa mã SQL và dữ liệu
- Các ký tự đặc biệt như `'` có thể phá vỡ cấu trúc truy vấn
- Kẻ tấn công có thể tiêm điều kiện SQL mới

### Tại Sao Truy Vấn Tham Số Hóa Ngăn Chặn Nó (An Toàn):
- Các chỗ đặt `?` được tách biệt khỏi mã SQL
- Đầu vào người dùng được cung cấp như tham số, không phải văn bản SQL
- Trình điều khiển cơ sở dữ liệu thoát tất cả các ký tự đặc biệt
- Đầu vào luôn được coi là dữ liệu, không bao giờ là mã

### Tại Sao XSS Hoạt Động (Dễ Bị Tấn Công):
- Đầu vào từ người dùng được chèn trực tiếp vào HTML
- Trình duyệt giải thích các thẻ HTML và các thuộc tính
- Mã JavaScript trong `onerror`, `onclick`, v.v. thực hiện
- Kẻ tấn công có thể tiêm trình xử lý sự kiện

### Tại Sao Thoát HTML Ngăn Chặn Nó (An Toàn):
- Các ký tự HTML đặc biệt được chuyển đổi thành thực thể
- `<` → `&lt;`, `>` → `&gt;`, v.v..
- Trình duyệt hiển thị các ký tự này dưới dạng văn bản, không phải HTML
- Trình xử lý sự kiện không thể được tạo

---

## 🚨 Gỡ Lỗi: Nếu Các Cuộc Tấn Công Không Hoạt Động

### SQL Injection Không Hoạt Động?

**Kiểm Tra:**
1. Đảm bảo bạn đang sử dụng **phiên bản dễ bị tấn công** (`npm start`)
2. Tải trọng chính xác là: `' OR '1'='1` (có các dấu ngoặc kép)
3. Trường mật khẩu có thể để trống hoặc bất kỳ giá trị
4. Kiểm tra công cụ phát triển bộ sưu tập để tìm lỗi (F12)

**Nếu vẫn thất bại:**
```bash
# Dừng máy chủ (Ctrl+C)
# Khởi động lại nó
npm start
```

### XSS Không Hoạt Động?

**Kiểm Tra:**
1. Đảm bảo bạn đang sử dụng **phiên bản dễ bị tấn công** (`npm start`)
2. Xác minh tải trọng: `<img src=x onerror="alert('Cookie: ' + document.cookie)">`
3. Đảm bảo nhấp vào "Set Sample Session Cookie" trước
4. Kiểm tra xem JavaScript có được bật trong trình duyệt không
5. Kiểm tra công cụ phát triển bộ sưu tập để tìm lỗi (F12)

**Nếu vẫn thất bại:**
```bash
# Stop server and clear browser cache
# Restart server
npm start
# Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)
```

---

## 📝 Console Output

When you run an attack, the vulnerable app logs it:

**SQL Injection:**
```
[VULNERABLE] Query: SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'x'
```

**XSS:**
```
[VULNERABLE XSS] Notification: <div class="notification">...
```

These logs show exactly what's happening! Great for learning.

---

## 🔑 Important File Locations

| File | Purpose |
|------|---------|
| `app.js` | Vulnerable app with SQL injection & XSS |
| `app-secure.js` | Patched secure version |
| `public/index-vulnerable.html` | UI with attack demonstrations |
| `public/index-secure.html` | UI showing security fixes |
| `package.json` | Dependencies and npm scripts |
| `README.md` | Full documentation |

---

## 🎓 Next Steps for Learning

### 1. **Understand the Code**
   - Open `app.js` and read the vulnerable code
   - Compare with `app-secure.js` to see the fixes
   - Find the comments marked `❌ VULNERABLE` and `✅ SECURE`

### 2. **Try Variations**
   - SQL Injection: Try `admin' --` or `' OR 'x'='x`
   - XSS: Try `<script>alert('XSS')</script>` or `<svg onload="alert('XSS')">`

### 3. **Explore the Secure Version**
   - Run the secure version and verify attacks fail
   - Try to find the HTML escaping function
   - See the parameterized query syntax

### 4. **Read the Official Resources**
   - OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
   - OWASP XSS: https://owasp.org/www-community/attacks/xss/

---

## ⚠️ Stopping the Server

To stop the server, press: **Ctrl+C**

This works in both Terminal and VS Code integrated terminal.

---

## 🎯 Common Questions

**Q: Why does the vulnerable version work at all?**
A: Because it uses string concatenation instead of prepared statements, allowing SQL injection and HTML injection attacks.

**Q: Is this real-world code?**
A: No, but real vulnerabilities exist in production code when developers:
- Concatenate strings into SQL queries
- Don't escape HTML output
- Don't use secure cookie flags

**Q: Can I use this code in production?**
A: **NO!** This is educational only. Always use the secure patterns shown in `app-secure.js`.

**Q: How do I report real vulnerabilities?**
A: Use responsible disclosure - report to the organization's security team, not publicly.

---

**Ready to start?** Run `npm install && npm start` and visit http://localhost:3000!
