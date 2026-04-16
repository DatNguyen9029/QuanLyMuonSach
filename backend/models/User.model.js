const mongoose = require("mongoose");

/**
 * User Schema
 * Dùng chung cho cả Độc giả (role: 'user') và Nhân viên/Admin (role: 'admin')
 * Hỗ trợ đăng nhập qua Google OAuth (googleId) hoặc local
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    googleId: {
      type: String,
      sparse: true, // Cho phép null nhưng unique nếu có giá trị
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    hoTen: { type: String, required: true, trim: true },
    ngaySinh: { type: Date },
    phai: { type: String, enum: ["Nam", "Nữ", "Khác"] },
    diaChi: { type: String, trim: true },
    dienThoai: { type: String, trim: true },
    avatar: { type: String }, // URL ảnh từ Google
    passwordHash: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
