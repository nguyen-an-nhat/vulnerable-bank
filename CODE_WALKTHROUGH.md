# 📋 Hướng Dẫn Mã - Dễ Bị Tấn Công vs. An Toàn

Tài liệu này cung cấp so sánh từng cạnh của mã dễ bị tấn công và an toàn để hiển thị chính xác những gì đã được thay đổi.

---

## 🔴 Phần A: SQL Injection

### Lỗ Hổng

**Tệp:** `app.js` (dòng 45-60)

```javascript
// D\u1ec4 B\u1eca T\u1ea4N C\u00d4NG: SQL Injection
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // ❌ D\u1ec4 B\u1eca T\u1ea4N C\u00d4NG: Nối chuỗi cho phép SQL injection
  // Kẻ tấn công có thể sử dụng: username = "' OR '1'='1" để bỏ qua xác thực
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  console.log('[VULNERABLE] Query:', query);

  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (row) {
      // Người dùng đã xác thực - đặt cookie phiên (dễ bị tấn công XSS)
      res.cookie('session_user', row.username, { httpOnly: false }); // ← Dễ bị tấn công!
      res.cookie('user_id', row.id, { httpOnly: false });
      return res.json({ 
        success: true, 
        message: `Welcome ${row.username}!`,
        user_id: row.id 
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});
```

### Ví Dụ Tấn Công

```
Đầu vào tên người dùng: ' OR '1'='1
Đầu vào mật khẩu: bất kỳ

SQL được tạo:
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'bất kỳ'

Kết Quả: LUÔN ĐÚNG vì '1'='1' luôn đúng → Xác thực bị bỏ qua!
```

### Bản Sửa

**Tệp:** `app-secure.js` (dòng 35-60)

```javascript
// AN TO\u00c0N: Truy Vấn Tham Số Hóa
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // ✅ SỬA: Sử dụng truy vấn tham số hóa (chỗ đặt ?)
  // Điều này ngăn chặn SQL injection vì đầu vào từ người dùng được coi là dữ liệu, không phải mã SQL
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

  console.log('[SECURE] Using parameterized query with parameters:', username, '***');

  db.get(query, [username, password], (err, row) => {  // ← Tham số được truyền riêng biệt!
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (row) {
      // Người dùng đã xác thực
      res.cookie('session_user', row.username, { 
        httpOnly: true,      // Ngăn JavaScript truy cập cookie
        secure: true,        // Chỉ gửi qua HTTPS
        sameSite: 'strict'   // Bảo vệ CSRF
      });
      res.cookie('user_id', row.id, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'strict' 
      });
      return res.json({ 
        success: true, 
        message: `Welcome ${row.username}!`,
        user_id: row.id 
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});
```

### Những Gì Đã Thay Đổi

| Khía Cạnh | Dễ Bị Tấn Công | An Toàn |
|--------|-----------|--------|
| **Xây Dựng Truy Vấn** | Nối chuỗi: `` `... ${username} ...` `` | Tham Số Hóa: `... ? ...` với mảng `[username]` |
| **Truyền Tham Số** | Giá trị được nhúng trong chuỗi SQL | Truyền riêng biệt đến `db.get(query, [params])` |
| **Xử Lý Đầu Vào** | Đầu vào từ người dùng trở thành một phần của mã SQL | Đầu vào từ người dùng luôn được coi là dữ liệu |
| **Ký Tự Đặc Biệt** | Có thể phá vỡ cấu trúc SQL | Tự động được thoát bởi trình điều khiển |
| **Bảo Mật Cookie** | `httpOnly: false` (JavaScript có thể ăn cắp) | `httpOnly: true` (JavaScript không thể truy cập) |

---

## 🔴 Phần B: Cross-Site Scripting (XSS)

### Lỗ Hổng

**Tệp:** `app.js` (dòng 63-84)

```javascript
// D\u1ec4 B\u1eca T\u1ea4N C\u00d4NG: XSS - Đầu vào người dùng được phản ánh mà không cần xử lý
app.post('/send-notification', (req, res) => {
  const { message, recipient } = req.body;

  // ❌ LỖ H\u1ed4NG: Đầu vào từ người dùng được phản ánh trực tiếp không cần xử lý
  // Kẻ tấn công có thể gửi: message = "<img src=x onerror='fetch(\"/steal-cookie\?c=\" + document.cookie)'>"
  const notification = `
    <div class="notification">
      <p>Message from ${recipient}:</p>
      <div class="message-content">${message}</div>
    </div>
  `;

  console.log('[VULNERABLE XSS] Notification:', notification);

  res.json({ 
    success: true, 
    notification: notification,
    html: notification 
  });
});
```

### Ví Dụ Tấn Công

```
Người Nhận: admin
Tin Nhắn: <img src=x onerror="alert('Cookie: ' + document.cookie)">

HTML kết quả:
<div class="notification">
  <p>Message from admin:</p>
  <div class="message-content"><img src=x onerror="alert('Cookie: ' + document.cookie)"></div>
</div>

Kết Quả: Trình duyệt hiển thị thẻ <img>, hình ảnh không tải, thuộc tính onerror thực hiện JavaScript!
```

### Bản Sửa - Phần 1: Thoát HTML

**Tệp:** `app-secure.js` (dòng 63-113)

```javascript
// AN TO\u00c0N: Ngăn Chặn XSS thông qua thoát HTML
app.post('/send-notification', (req, res) => {
  const { message, recipient } = req.body;

  // ✅ SỬA: Hàm thoát HTML
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',      // ← Chuyển đổi < thành &lt; để nó không được giải thích là thẻ HTML
      '>': '&gt;',      // ← Chuyển đổi > thành &gt;
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Bây giờ đầu vào từ người dùng được thoát an toàn
  const escapedMessage = escapeHtml(message);
  const escapedRecipient = escapeHtml(recipient);

  const notification = `
    <div class="notification">
      <p>Message from ${escapedRecipient}:</p>
      <div class="message-content">${escapedMessage}</div>
    </div>
  `;

  console.log('[SECURE] XSS Prevention - HTML escaped notification');

  res.json({ 
    success: true, 
    notification: notification,
    html: notification 
  });
});
```

### Bản Sửa - Phần 2: HttpOnly Cookies

**Tệp:** `app-secure.js` (dòng 47-55)

```javascript
// ✅ AN TO\u00c0N - Cookie được bảo vệ khỏi XSS
res.cookie('session_user', row.username, { 
  httpOnly: true,      // ← JavaScript KH\u00d4NG THƯ\u01a0NG ĐỌC cookie này
  secure: true,        // ← Ch\u1ec9 g\u1eedi qua HTTPS
  sameSite: 'strict'   // ← Kh\u00f4ng thể g\u1eedi trong yêu cầu qu\u1ed1c t\u1ebf
});
```

### Những Gì Đã Thay Đổi

#### Thoát HTML:

| Ký Tự | Dễ Bị Tấn Công | An Toàn |
|-----------|-----------|--------|
| `<` | Hiển thị bắt đầu thẻ HTML | Hiển thị dưới dạng `&lt;` (văn bản) |
| `>` | Hiển thị kết thúc thẻ HTML | Hiển thị dưới dạng `&gt;` (văn bản) |
| `"` | Có thể phá vỡ thuộc tính | Hiển thị dưới dạng `&quot;` (văn bản) |
| `'` | Có thể phá vỡ thuộc tính | Hiển thị dưới dạng `&#039;` (văn bản) |
| `&` | Có thể phá vỡ thực thể | Hiển thị dưới dạng `&amp;` (văn bản) |

#### Cờ Cookie:

| Cờ | Dễ Bị Tấn Công | An Toàn |
|------|-----------|--------|
| `httpOnly` | `false` - JS có thể ăn cắp qua `document.cookie` | `true` - JS không thể truy cập |
| `secure` | Không được đặt - Gửi qua HTTP | `true` - Ch\u1ec9 g\u1eedi qua HTTPS |
| `sameSite` | Không được đặt - Có thể ở trong yêu cầu cross-site | `'strict'` - Ch\u1ec9 same-site |

---

## 📊 Ma Trận Tóm Tắt Tấn Công & Bản Sửa

### SQL Injection

```
LUỒNG TẤN CÔNG:
┌─────────────────────┐
│  Kẻ tấn công nhập:  │
│  ' OR '1'='1        │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Mã dễ bị tấn công xây dựng SQL:         │
│  "... WHERE username = '' OR '1'='1'"    │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Cơ sở dữ liệu đánh giá '1'='1' → ĐÚNG   │
│  Trả về tất cả người dùng (hoặc đầu tiên)│
└──────────┬───────────────────────────────┘
           │
           ▼
      ✅ TẤN CÔNG THÀNH CÔNG
      Admin xác thực mà không có mật khẩu


PHÒNG CHỰC:
┌──────────────────────────┐
│  Mã sử dụng:             │
│  "... WHERE username=?"  │
│  Tham số: [username]     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Trình điều khiển cơ sở dữ liệu:         │
│  • Giữ mã SQL riêng biệt                 │
│  • Coi đầu vào là dữ liệu thuần túy       │
│  • Tự động thoát các ký tự đặc biệt     │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Tìm username = "' OR '1'='1"             │
│  (khớp chuỗi theo nghĩa đen)              │
└──────────┬───────────────────────────────┘
           │
           ▼
    ❌ TẤN CÔNG THẤT BẠI
    Không có người dùng nào
```

### XSS

```
LUỒNG TẤN CÔNG:
┌──────────────────────────────────────────┐
│  Kẻ tấn công gửi tin nhắn:               │
│  <img src=x onerror="alert('XSS')">      │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Mã dễ bị tấn công xuất ra:              │
│  <div>${message}</div>                   │
│  Kết quả: Thẻ HTML đầy đủ được hiển thị │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Trình duyệt hiển thị HTML:              │
│  • Phân tích thẻ <img>                   │
│  • Cố tải hình từ "x"                    │
│  • Hình tải thất bại → onerror kích hoạt │
│  • Mã JavaScript thực hiện                │
└──────────┬───────────────────────────────┘
           │
           ▼
      ✅ TẤN CÔNG THÀNH CÔNG
      Tải XSS chạy trong trình duyệt


PHÒNG CHỨA:
┌──────────────────────────────────────────┐
│  Mã chạy escapeHtml(message):            │
│  < → &lt;   > → &gt;   " → &quot;        │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Xuất ra:                                │
│  &lt;img src=x onerror="alert('XSS')"&gt;│
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Trình duyệt hiển thị dưới dạng VĂN BẢN: │
│  "<img src=x onerror=..."                │
│  • Không được phân tích dưới dạng HTML   │
│  • Không có trình xử lý sự kiện thực hiện│
│  • Hiển thị dưới dạng văn bản theo nghĩa │
│    đen                                   │
└──────────┬───────────────────────────────┘
           │
           ▼
    ❌ TẤN CÔNG THẤT BẠI
    Không có thực hiện JavaScript
```

---
Sự Khác Biệt Chính Trong Mã

### Sự Khác Biệt 1: Xây Dựng Truy Vấn

```javascript
// ❌ DỄ BỊ TẤN CÔNG
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ AN TOÀN
const query = `SELECT * FROM users WHERE username = ?`;
db.get(query, [username], callback);
```

**Tại sao nó quan trọng:**
- Dễ bị tấn công: Đầu vào người dùng trở thành một phần của lệnh SQL
- An Toàn: Đầu vào người dùng được truyền dưới dạng tham số, trình điều khiển cơ sở dữ liệu xử lý thoát

### Sự Khác Biệt 2: Hiển Thị Kết Quả

```javascript
// ❌ DỄ BỊ TẤN CÔNG
const html = `<div>${userInput}</div>`;

// ✅ AN TOÀN
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
const html = `<div>${escapeHtml(userInput)}</div>`;
```

**Tại sao nó quan trọng:**
- Dễ bị tấn công: Đầu vào người dùng được hiển thị dưới dạng HTML (các thẻ được giải thích)
- An Toàn: Đầu vào người dùng được thoát HTML (hiển thị dưới dạng văn bản)

### Sự Khác Biệt 3: Bảo Mật Cookie

```javascript
// ❌ DỄ BỊ TẤN CÔNG
res.cookie('session', value, { httpOnly: false });

// ✅ AN TOÀN
res.cookie('session', value, { 
  httpOnly: true,  // JavaScript không thể đọc cái này
  secure: true,    // Chỉ qua HTTPS
  sameSite: 'strict' // Ngăn chặn CSRF
});
```

**Tại sao nó quan trọng:**
- Dễ bị tấn công: JavaScript có thể đọc `document.cookie` và ăn cắp phiên
- An Toàn: JavaScript không thể truy cập cookie, ngay cả khi XSS xảy raion
- Secure: JavaScript cannot access the cookie, even if XSS happens

---

## 💪 Testing Checklist

- [ ] SQL Injection payload works on vulnerable version
- [ ] SQL Injection payload fails on secure version
- [ ] XSS payload executes on vulnerable version
- [ ] XSS payload doesn't execute on secure version
- [ ] Understand WHERE the fix was applied in each file
- [ ] Can explain WHY each fix prevents the attack
- [ ] Read the official OWASP documentation

---

**Next:** Compare these files yourself by opening them in VS Code!
