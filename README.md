# 🏦 Ngân Hàng Dễ Bị Tấn Công - Demo Lỗ Hổng Bảo Mật

Một bài thực hành giáo dục toàn diện về các lỗ hổng **SQL Injection** và **Cross-Site Scripting (XSS)**, cùng với các biện pháp sửa chữa.

## ⚠️ CẢNH BÁO

Dự án này chứa **các lỗ hổng bảo mật được tạo ra cố ý** cho mục đích học tập. **KHÔNG bao giờ sử dụng mã này trong sản xuất.** Điều này chỉ dành cho mục đích giáo dục và trình diễn để hiểu cách các cuộc tấn công này hoạt động và cách ngăn chặn chúng.

## 📋 Tổng Quan Dự Án

Bài thực hành này cung cấp:

1. **Phần A:** Một hệ thống đăng nhập dễ bị tâm công SQL Injection
2. **Phần B:** Một hệ thống thông báo dễ bị tấn công XSS
3. **Phần C:** Các phiên bản đã sửa chữa cho thấy cách khắc phục cả hai lỗ hổng

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu Tiên Quyết
- Node.js 14+ và npm

### Cài Đặt

```bash
# Di chuyển đến thư mục dự án
cd "Vurnurela Bank"

# Cài đặt các phụ thuộc
npm install
```

### Chạy Phiên Bản Dễ Bị Tấn Công

```bash
npm start
```

Truy cập `http://localhost:3000` trong trình duyệt của bạn.

### Chạy Phiên Bản An Toàn

```bash
npm run start-secure
```

Truy cập `http://localhost:3000` trong trình duyệt của bạn.

## 📚 Các Cuộc Tấn Công Được Trình Diễn

### Phần A: SQL Injection

**Loại Lỗ Hổng:** SQL Injection  
**Vị Trí:** Điểm cuối đăng nhập (`/login`)  
**Mức Độ Nghiêm Trọng:** Tới Hạn

#### Mã Đơn Giản Dễ Bị Tấn Công:

```javascript
// ❌ DỄ BỊ TẤN CÔNG - Nối chuỗi
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
db.get(query, (err, row) => { ... });
```

#### Cuộc Tấn Công:

Tên Người Dùng: `' OR '1'='1`  
Mật Khẩu: (bất kỳ giá trị nào)

#### Điều Gì Xảy Ra:

```sql
-- Truy vấn SQL kết quả:
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '(bất kỳ)'

-- '1'='1' luôn đúng, vì vậy trả về người dùng đầu tiên trong cơ sở dữ liệu (thường là admin)
```

#### Kết Quả:

Bạn bỏ qua màn hình đăng nhập và được xác thực là người dùng đầu tiên trong cơ sở dữ liệu.

---

### Phần B: Cross-Site Scripting (XSS)

**Loại Lỗ Hổng:** XSS Được Lưu Trữ/Phản Ánh  
**Vị Trí:** Điểm cuối thông báo (`/send-notification`)  
**Mức Độ Nghiêm Trọng:** Cao

#### Mã Đơn Giản Dễ Bị Tấn Công:

```javascript
// ❌ DỄ BỊ TẤN CÔNG - Đầu vào người dùng được phản ánh trực tiếp vào HTML
const notification = `
    <div class="notification">
        <p>Message from ${recipient}:</p>
        <div class="message-content">${message}</div>
    </div>
`;
```

#### Cuộc Tấn Công:

Trước Hậu Tố:
```html
<img src=x onerror="alert('Cookie: ' + document.cookie)">
```

#### Điều Gì Xảy Ra:

1. Trình duyệt hiển thị HTML với thẻ được tiêm của bạn
2. Thẻ `<img>` cố gắng tải ảnh từ "x" (không tồn tại)
3. Trình xử lý sự kiện `onerror` kích hoạt khi ảnh không tải được
4. Mã JavaScript thực hiện: `alert('Cookie: ' + document.cookie)`
5. Các cookie phiên của bạn được hiển thị (hoặc có thể được gửi đến máy chủ của kẻ tấn công)

#### Kết Quả:

Mã JavaScript tùy ý thực hiện trong trình duyệt với các quyền của bạn. Kẻ tấn công có thể:
- Ăn cắp cookie phiên
- Hướng bạn đến trang giả mạo
- Tìm kiếm theo yêu cầu của bạn
- Thu thập các nét gõ
- Thực hiện các hành động đăng nhập của bạn

---

## 🔧 Biện Pháp Bảo Mật

### Biện Pháp 1: Ngăn Chặn SQL Injection - Truy Vấn Tham Số Hóa

**Mã An Toàn:**

```javascript
// ✅ AN TOÀN - Truy vấn tham số hóa có chỗ đặt
const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
db.get(query, [username, password], (err, row) => { ... });
```

**Tại Sao Nó Hoạt Động:**

- Đầu vào người dùng được coi là **dữ liệu**, không phải mã SQL
- Các chỗ đặt `?` được thay thế bởi trình điều khiển cơ sở dữ liệu
- Cấu trúc SQL không thể được chỉnh sửa bởi đầu vào người dùng
- Các ký tự đặc biệt đầu tiên được thoát tự động bởi hệ thống cơ sở dữ liệu

### Biện Pháp 2: Ngăn Chặn XSS - Thoát HTML + Cookie HttpOnly

**Phần 1: Thoát HTML**

```javascript
// ✅ AN TOÀN - Thoát các ký tự đặc biệt HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

const escapedMessage = escapeHtml(message);
const notification = `
    <div class="notification">
        <p>Message from ${escapedRecipient}:</p>
        <div class="message-content">${escapedMessage}</div>
    </div>
`;
```

**Phần 2: HttpOnly Cookies**

```javascript
// ✅ AN TOÀN - Đặt cookie có các lỗ bảo vệ
res.cookie('session_user', username, {
    httpOnly: true,      // JavaScript không thể truy cập cookie này
    secure: true,        // Chỉ gửi qua HTTPS
    sameSite: 'strict'   // Không thể gửi trong yêu cầu cross-site
});
```

**Cách Nó Hoạt Động:**

- Các ký tự HTML được chuyển đổi thành thực thể trước khi xuất
- `<` trở thành `&lt;`, `>` trở thành `&gt;`, v.v...
- Trình duyệt hiển thị văn bản, không phải mã HTML
- Cờ `HttpOnly` ngăn JavaScript truy cập cookie ngay cả khi XSS thành công
- Ngay cả khi kẻ tấn công tiêm mã, họ không thể đọc `document.cookie`

---

## 📂 Cấu Trúc Dự Án

```
Vurnurela Bank/
├── app.js                      # Phiên bản dễ bị tấn công với SQL injection & XSS
├── app-secure.js              # Phiên bản an toàn đã sửa chữa
├── public/
│   ├── index-vulnerable.html  # Giao diện cho phiên bản dễ bị tấn công (với bản trình diễn tấn công)
│   └── index-secure.html      # Giao diện cho phiên bản an toàn (hiển thị các bản sửa)
├── package.json
└── README.md
```

---

## 🔑 Người Dùng Mẫu (để kiểm tra)

| Tên Người Dùng | Mật Khẩu |
|----------|----------|
| admin | password123 |
| customer1 | mypass456 |
| customer2 | secret789 |

---

## 🛡️ Các Thực Hành Bảo Mật Tốt Nhất

### Đối Với SQL Injection:
1. **Luôn sử dụng truy vấn tham số hóa** - Đây là biện pháp phòng chống chính
2. **Không bao giờ nối input từ người dùng vào chuỗi SQL**
3. **Sử dụng ORM** - Hầu hết các ORMs sử dụng truy vấn tham số hóa theo mặc định
4. **Xác thực đầu vào** - Xác thực trên máy chủ, không chỉ trên máy khách
5. **Nguyên tắc của đặc quyền tối thiểu** - Tài khoản cơ sở dữ liệu nên có quyền tối thiểu

### Đối Với XSS:
1. **Luôn thoát kết quả HTML** - Thoát tất cả dữ liệu được kiểm soát bởi người dùng trước khi hiển thị
2. **Sử dụng cookie HttpOnly** - Cookie không thể được truy cập bởi JavaScript
3. **Triển khai Chính Sách Bảo Mật Nội Dung (CSP)** - Hạn chế nơi có thể tải các tập lệnh
4. **Xác thực đầu vào trên máy chủ** - Không dựa vào xác thực phía máy khách
5. **Sử dụng tiêu đề bảo mật** - X-XSS-Protection, X-Content-Type-Options, v.v..
6. **Giữ cho khung công tác được cập nhật** - Các thư viện sửa chữa các vấn đề bảo mật thường xuyên

---

## 🎓 Tài Liệu Học Tập

### SQL Injection:
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PortSwigger: SQL Injection](https://portswigger.net/web-security/sql-injection)

### Cross-Site Scripting (XSS):
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [PortSwigger: XSS](https://portswigger.net/web-security/cross-site-scripting)

### OWASP Top 10:
- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)

---

## 🔬 So Sánh Mã

### So Sánh SQL Injection

**❌ Dễ Bị Tấn Công:**
```javascript
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

**✅ An Toàn:**
```javascript
const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
db.get(query, [username, password], callback);
```

### So Sánh XSS

**❌ Dễ Bị Tấn Công:**
```javascript
res.json({ notification: `<div>${message}</div>` });
```

**✅ An Toàn:**
```javascript
res.json({ notification: `<div>${escapeHtml(message)}</div>` });
```

---

## 📊 Luồng Bản Trình Diễn Tấn Công

### Luồng SQL Injection:

1. Mở phiên bản dễ bị tấn công (`npm start`)
2. Đi tới tab "Part A: SQL Injection"
3. Nhập tên người dùng: `' OR '1'='1`
4. Để trống mật khẩu hoặc nhập bất kỳ
5. Nhấp vào "Try SQL Injection Login"
6. Bạn sẽ đăng nhập thành công với người dùng đầu tiên trong cơ sở dữ liệu (admin)

### Luồng Tấn Công XSS:

1. Mở phiên bản dễ bị tấn công (`npm start`)
2. Đi tới tab "Part B: XSS Attack"
3. Nhấp vào "Set Sample Session Cookie"
4. Sao chép tải trọng XSS: `<img src=x onerror="alert('Cookie: ' + document.cookie)">`
5. Dán vào trường Tin Nhắn
6. Nhấp vào "Send XSS Payload"
7. Mã JavaScript được tiêm thực hiện và hiển thị các cookie của bạn

---

## 🚦 Kiểm Tra Trên Phiên Bản An Toàn

Để xác minh các bản sửa hoạt động:

### Kiểm Tra 1: Ngăn Chặn SQL Injection
1. Chạy `npm run start-secure`
2. Thử tải trọng SQL injection tương tự: `' OR '1'='1`
3. Kết Quả: **Đăng nhập thất bại an toàn** - tải trọng được coi như một tên người dùng theo nghĩa đen

### Kiểm Tra 2: Ngăn Chặn XSS
1. Chạy `npm run start-secure`
2. Thử tải trọng XSS tương tự: `<img src=x onerror="alert('XSS')">`
3. Kết Quả: **Tập lệnh không thực hiện** - HTML được thoát thành văn bản

---

## 📝 Những Điểm Chính

| Khái Niệm | Dễ Bị Tấn Công | An Toàn |
|---------|-----------|--------|
| **Truy Vấn SQL** | Nối chuỗi | Truy vấn tham số hóa |
| **Xuất Từ Người Dùng** | Phản ánh trực tiếp | Thoát HTML |
| **Cookie** | Có thể truy cập qua JS | Cờ HttpOnly + Secure |
| **Thành Công Tấn Công** | Mã SQL được thực hiện | Đầu vào được coi là dữ liệu |
| **Thành Công XSS** | JavaScript chạy | HTML được hiển thị dưới dạng văn bản |

---

## ⚖️ Sử Dụng Pháp Lý & Giáo Dục

Dự án này được cung cấp hoàn toàn cho mục đích giáo dục để giúp các nhà phát triển hiểu và ngăn chặn các lỗ hổng ứng dụng web phổ biến. Sử dụng các kỹ thuật này hoặc mã này chống lại các hệ thống mà không có sự cho phép rõ ràng là bất hợp pháp và không đạo đức.

**Công Khai Có Trách Nhiệm:** Nếu bạn tìm thấy một lỗ hổng thực sự trong ứng dụng web, hãy báo cáo nó có trách nhiệm cho chủ sở hữu ứng dụng thông qua quy trình báo cáo bảo mật của họ.

---

## 📞 Câu Hỏi hoặc Vấn Đề?

Đây là một công cụ giáo dục. Nếu bạn có câu hỏi về các lỗ hổng hoặc bản sửa chữa, hãy nghiên cứu các nhận xét mã và tài liệu HTML đi kèm.

---

## 📄 Giấy Phép

Dự án giáo dục này được cung cấp như là cho mục đích học tập.

---

**Được Tạo Cho:** Nhận Thức Bảo Mật & Giáo Dục Nhà Phát Triển  
**Cập Nhật Cuối Cùng:** 2 Tháng Tư, 2026
