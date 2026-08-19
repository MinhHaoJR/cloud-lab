// ===== server/models/Student.js =====
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'MSSV là bắt buộc'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    }
  },
  {
    timestamps: true,
    collection: 'students'
  }
);

module.exports = mongoose.model('Student', studentSchema);