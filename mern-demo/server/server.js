// ===== server/server.js =====
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Student = require('./models/Student');

const app = express();

// ==================== CẤU HÌNH CORS (CÂU 58) ====================
// Đọc Domain Frontend được phép từ biến môi trường CLIENT_URL
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, '')); // bỏ dấu "/" cuối nếu có

app.use(cors({
  origin: function (origin, callback) {
    // Không có origin (curl, Postman) hoặc origin nằm trong danh sách: cho phép
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // origin lạ: không trả header CORS, trình duyệt sẽ chặn
    }
  },
  credentials: true
}));

app.use(express.json());

// ==================== ROUTES CƠ BẢN ====================

app.get('/', (req, res) => {
  res.json({
    message: 'MERN Backend API - Buổi 2',
    endpoints: {
      hello: 'GET /api/hello',
      list: 'GET /api/students',
      create: 'POST /api/students',
      update: 'PUT /api/students/:id',
      remove: 'DELETE /api/students/:id'
    }
  });
});

app.get('/api/hello', (req, res) => {
  res.json({
    success: true,
    message: 'Backend Node.js + Express đang hoạt động!',
    database: mongoose.connection.readyState === 1
      ? 'Đã kết nối MongoDB Atlas'
      : 'Chưa kết nối',
    time: new Date().toISOString()
  });
});

// Readiness: a running HTTP server alone does not prove database connectivity.
app.get(['/health', '/api/health'], (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'UP' : 'DOWN',
    database: connected ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.use('/api/students', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Chưa kết nối cơ sở dữ liệu. Vui lòng thử lại.' });
  }
  next();
});

// ============ CÂU 36: LẤY DANH SÁCH SINH VIÊN ============
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CÂU 37: THÊM SINH VIÊN ============
app.post('/api/students', async (req, res) => {
  try {
    const { studentId, name, email } = req.body;

    if (!studentId || !name || !email) {
      return res.status(400).json({ error: 'Thiếu studentId, name hoặc email' });
    }

    const student = await Student.create({ studentId, name, email });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `MSSV ${req.body.studentId} đã tồn tại` });
    }
    res.status(400).json({ error: err.message });
  }
});

// ============ CÂU 38: CẬP NHẬT SINH VIÊN ============
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const updated = await Student.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ CÂU 39: XÓA SINH VIÊN ============
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const deleted = await Student.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    res.json({ message: 'Đã xóa sinh viên', deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== KẾT NỐI DB & KHỞI ĐỘNG ====================
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error('Thiếu MONGODB_URI: cấu hình biến này trên Render Backend.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ Đã kết nối MongoDB Atlas thành công');
    console.log(`   Database: ${mongoose.connection.name}`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Kết nối MongoDB thất bại:', err.message);
    process.exit(1);
  });
