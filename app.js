/**
 * ỨNG DỤNG NGÂN HÀNG DỄ BỊ TẤN CÔNG - Bản Trình Diễn Giáo Dục
 * Ứng dụng này chứa các lỗ hổng bảo mật được tạo ra cố ý cho mục đích trình diễn
 * KHÔNG bao giờ sử dụng mã này trong sản xuất!
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

  // Tạo bảng comments cho Stored XSS demo
  db.run(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      author TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Chèn comments mẫu (bao gồm cả stored XSS payload)
  db.run(`INSERT INTO comments (author, content) VALUES ('admin', 'Chào mừng đến với ngân hàng!')`);
  db.run(`INSERT INTO comments (author, content) VALUES ('customer1', 'Dịch vụ rất tốt!')`);
  db.run(`INSERT INTO comments (author, content) VALUES ('Nhất', '<img src=x onerror="alert(\'XSS từ Database!\')">')`);
  db.run(`INSERT INTO comments (author, content) VALUES ('attacker', '<svg onload="console.log(\'Stored XSS Executed\'); alert(\'Payload from DB executed\')">')`);
  db.run(`INSERT INTO comments (author, content) VALUES ('user123', '<iframe src="x" onerror="alert(\'XSS thành công\')">')`);
});

// DỄ BỊ TẤN CÔNG: SQL Injection tại điểm cuối đăng nhập
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // LỖ HỔNG: Nối chuỗi cho phép SQL injection
  // Kẻ tấn công có thể sử dụng: username = "' OR '1'='1" để bỏ qua xác thực
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  console.log('[DỄ BỊ TẤN CÔNG] Truy vấn:', query);

  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi cơ sở dữ liệu', details: err.message });
    }

    if (row) {
      // Người dùng đã xác thực - đặt cookie phiên (dễ bị tấn công XSS)
      res.cookie('session_user', row.username, { httpOnly: false }); // httpOnly: false làm nó dễ bị tấn công
      res.cookie('user_id', row.id, { httpOnly: false });
      return res.json({ 
        success: true, 
        message: `Welcome ${row.username}!`,
        user_id: row.id 
      });
    } else {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không hợp lệ' });
    }
  });
});

// DỄ BỊ TẤN CÔNG: Lỗ hổng XSS - phản ánh đầu vào người dùng mà không có xử lý
app.post('/send-notification', (req, res) => {
  const { message, recipient } = req.body;

  // LỖ HỔNG: Đầu vào người dùng được phản ánh trực tiếp mà không có xử lý
  // Kẻ tấn công có thể gửi: message = "<img src=x onerror='fetch(\"/steal-cookie\?c=\" + document.cookie)'>\"
  const notification = `
    <div class="notification">
      <p>Message from ${recipient}:</p>
      <div class="message-content">${message}</div>
    </div>
  `;

  console.log('[LỖ HỔNG XSS] Thông báo:', notification);

  res.json({ 
    success: true, 
    notification: notification,
    html: notification 
  });
});

// Điểm cuối để lấy thông tin tài khoản (chỉ khi đã xác thực)
app.get('/accounts', (req, res) => {
  const userId = parseInt(req.query.user_id);

  if (!userId) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  db.all(`SELECT * FROM accounts WHERE user_id = ${userId}`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ accounts: rows });
  });
});

// Điểm cuối để ghi lại cookie (cho mục đích trình diễn)
app.get('/check-cookies', (req, res) => {
  const cookies = req.headers.cookie || 'Không tìm thấy cookie';
  console.log('[DEBUG] Cookie được nhận:', cookies);
  res.json({ cookies: cookies });
});

// =============== XSS DEMO ENDPOINTS ===============

// LỖI HỔNG 1: REFLECTED XSS - Phản ánh đầu vào ngay lập tức
app.post('/reflected-xss', (req, res) => {
  const { message, sender } = req.body;
  // LỖ HỔNG: Phản ánh đầu vào trực tiếp mà không có xử lý
  const output = `<div>Tin nhắn từ ${sender}: ${message}</div>`;
  res.json({ html: output, message: 'Reflected XSS payload sẽ thực thi ngay lập tức' });
});

// LỖI HỔNG 2: STORED XSS - Lưu payload vào database
app.post('/comments', (req, res) => {
  const { author, content } = req.body;
  // LỖ HỔNG: Lưu đầu vào người dùng trực tiếp mà không có xử lý
  db.run(`INSERT INTO comments (author, content) VALUES (?, ?)`, [author, content], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Bình luận đã được lưu' });
  });
});

// Truy xuất comments (LỖ HỔNG: không escape HTML)
app.get('/comments', (req, res) => {
  db.all(`SELECT * FROM comments ORDER BY created_at DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // LỖ HỔNG: Trả về content chưa được xử lý - client sẽ render HTML trực tiếp
    res.json({ comments: rows });
  });
});

// LỖI HỔNG 3: DOM-BASED XSS - Lỗi ở JavaScript client side
app.post('/dom-input', (req, res) => {
  const { userInput } = req.body;
  // Endpoint chỉ trả JSON - lỗi nằm ở phía client khi sử dụng innerHTML
  res.json({ data: userInput });
});

// Phục vụ trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-vulnerable.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     ỨNG DỤNG NGÂN HÀNG DỄ BỊ TẤN CÔNG - Bản Trình Diễn Giáo Dục║
║                                                                ║
║  ⚠️  CẢNH BÁO: Ứng dụng này chứa các lỗ hổng cố ý            ║
║  ⚠️  CHỈ sử dụng cho MỤC ĐÍCH HỌC TẬP                        ║
║                                                                ║
║  Máy chủ chạy tại http://localhost:${PORT}                     ║
║                                                                ║
║  DỄ BỊ TẤN CÔNG BỞI:                                          ║
║  • SQL Injection (Bỏ qua đăng nhập)                           ║
║  • Cross-Site Scripting (XSS - Đánh cắp cookie)               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
