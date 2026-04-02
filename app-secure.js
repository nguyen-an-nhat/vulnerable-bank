/**
 * ỨNG DỤNG NGÂN HÀNG AN TOÀN - Phiên Bản Vá Lỗi
 * Ứng dụng này sửa chữa các lỗ hổng SQL Injection và XSS
 */

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Các hàm hỗ trợ
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Thiết lập cơ sở dữ liệu
const db = new sqlite3.Database(':memory:');

// Khởi tạo cơ sở dữ liệu
db.serialize(() => {
  // Tạo bảng người dùng
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      password TEXT
    )
  `);

  // Chèn người dùng mẫu
  db.run(`INSERT INTO users (username, password) VALUES ('admin', 'password123')`);
  db.run(`INSERT INTO users (username, password) VALUES ('customer1', 'mypass456')`);
  db.run(`INSERT INTO users (username, password) VALUES ('customer2', 'secret789')`);

  // Tạo bảng tài khoản
  db.run(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      account_type TEXT,
      balance REAL
    )
  `);

  // Chèn tài khoản mẫu
  db.run(`INSERT INTO accounts (user_id, account_type, balance) VALUES (1, 'Checking', 5000.00)`);
  db.run(`INSERT INTO accounts (user_id, account_type, balance) VALUES (1, 'Savings', 10000.00)`);
  db.run(`INSERT INTO accounts (user_id, account_type, balance) VALUES (2, 'Checking', 2500.00)`);
  db.run(`INSERT INTO accounts (user_id, account_type, balance) VALUES (3, 'Savings', 15000.00)`);

  // Tạo bảng comments cho Stored XSS demo (an toàn)
  db.run(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      author TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Chèn comments mẫu
  db.run(`INSERT INTO comments (author, content) VALUES ('admin', 'Chào mừng đến với ngân hàng!')`);
  db.run(`INSERT INTO comments (author, content) VALUES ('customer1', 'Dịch vụ rất tốt!')`);
});

// ĐÃ SỬA: Truy vấn được tham số hóa ngăn chặn SQL Injection
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // SỬA: Sử dụng truy vấn được tham số hóa (? là các chỗ dùng cộng dấu)
  // Điều này ngăn chặn SQL injection vì đầu vào người dùng được xử lý như dữ liệu, không phải mã SQL
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

  console.log('[AN TOÀN] Sử dụng truy vấn được tham số hóa với các tham số:', username, '***');

  db.get(query, [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi cơ sở dữ liệu', details: err.message });
    }

    if (row) {
      // Người dùng đã xác thực
      res.cookie('session_user', row.username, { 
        httpOnly: true,      // Ngăn chặn JavaScript truy cập cookie
        secure: true,        // Chỉ được gửi qua HTTPS
        sameSite: 'strict'   // Bảo vệ CSRF
      });
      res.cookie('user_id', row.id, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'strict' 
      });
      return res.json({ 
        success: true, 
        message: `Chào mừng ${row.username}!`,
        user_id: row.id 
      });
    } else {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không hợp lệ' });
    }
  });
});

// ĐÃ SỬA: Phòng chống XSS thông qua vệ sinh HTML
app.post('/send-notification', (req, res) => {
  const { message, recipient } = req.body;

  // SỬA: Hàm thoát HTML
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Bây giờ đầu vào người dùng được thoát an toàn
  const escapedMessage = escapeHtml(message);
  const escapedRecipient = escapeHtml(recipient);

  const notification = `
    <div class="notification">
      <p>Tin nhắn từ ${escapedRecipient}:</p>
      <div class="message-content">${escapedMessage}</div>
    </div>
  `;

  console.log('[AN TOÀN] Phòng chống XSS - thông báo được thoát HTML');

  res.json({ 
    success: true, 
    notification: notification,
    html: notification 
  });
});

// Điểm cuối để lấy thông tin tài khoản (với truy vấn được sửa)
app.get('/accounts', (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  // SỬA: Sử dụng truy vấn được tham số hóa
  db.all(`SELECT * FROM accounts WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ accounts: rows });
  });
});

// Điểm cuối để ghi lại cookie
app.get('/check-cookies', (req, res) => {
  const cookies = req.headers.cookie || 'Không tìm thấy cookie';
  console.log('[DEBUG] Cookie được nhận:', cookies);
  res.json({ cookies: cookies });
});

// =============== XSS DEMO ENDPOINTS (AN TOÀN) ===============

// ĐÃ SỬA 1: REFLECTED XSS - Thoát HTML
app.post('/reflected-xss', (req, res) => {
  const { message, sender } = req.body;
  
  // SỬA: Hàm thoát HTML
  function escapeHtml(text) {
    if (!text) return '';
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
  const escapedSender = escapeHtml(sender);
  const output = `<div>Tin nhắn từ ${escapedSender}: ${escapedMessage}</div>`;
  res.json({ html: output, message: 'Payload được thoát - không thực thi' });
});

// ĐÃ SỬA 2: STORED XSS - Thoát HTML trước khi lưu/lấy
app.post('/comments', (req, res) => {
  const { author, content } = req.body;
  
  // SỬA: Tham số hóa truy vấn và xác thực
  db.run(`INSERT INTO comments (author, content) VALUES (?, ?)`, [author, content], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Bình luận đã được lưu (được thoát HTML khi hiển thị)' });
  });
});

// Truy xuất comments (ĐÃ SỬA: Thoát HTML trước khi gửi)
app.get('/comments', (req, res) => {
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
  
  db.all(`SELECT * FROM comments ORDER BY created_at DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // SỬA: Thoát HTML cho mỗi bình luận
    const safeComments = rows.map(row => ({
      ...row,
      author: escapeHtml(row.author),
      content: escapeHtml(row.content)
    }));
    
    res.json({ comments: safeComments });
  });
});

// ĐÃ SỬA 3: DOM-BASED XSS - Client sẽ được hướng dẫn thoát HTML
app.post('/dom-input', (req, res) => {
  const { userInput } = req.body;
  // SỬA: Trả về flag an toàn - client phải xử lý
  res.json({ data: userInput, safe: true, hint: 'Sử dụng textContent thay vì innerHTML' });
});

// Phục vụ trang chủ an toàn
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-secure.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║      ỨNG DỤNG NGÂN HÀNG AN TOÀN - Phiên Bản Vá Lỗi            ║
║                                                                ║
║  ✅ Các sửa lỗi bảo mật được áp dụng:                         ║
║  • Truy vấn được tham số hóa (Phòng chống SQL Injection)        ║
║  • Vệ sinh HTML (Phòng chống XSS)                              ║
║  • Cookie HttpOnly (Giảm thiểu XSS)                            ║
║  • Các cờ cookie an toàn                                      ║
║                                                                ║
║  Máy chủ chạy tại http://localhost:${PORT}                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
