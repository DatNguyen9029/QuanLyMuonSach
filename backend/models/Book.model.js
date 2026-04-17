const mongoose = require("mongoose");

/**
 * Book Schema
 * - nxb: Reference tới Publisher theo thiết kế CSDL
 * - tenNXB: Fallback legacy để tương thích dữ liệu cũ và hiển thị nhanh
 * - soLuongTienTai: Số lượng sách hiện còn (tăng/giảm theo BorrowRecord)
 * - donGia: Dùng để tính tiền phạt khi mất sách
 */
const bookSchema = new mongoose.Schema(
  {
    maSach: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    tenSach: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index để tăng tốc tìm kiếm theo tên
    },
    donGia: {
      type: Number,
      required: true,
      min: 0,
    },
    soLuongTienTai: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    namXuatBan: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear(),
    },
    tenNXB: {
      type: String,
      trim: true,
      default: "",
    },
    nxb: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publisher",
      default: null,
    },
    tacGia: {
      type: String,
      trim: true,
      index: true, // Index để tăng tốc tìm kiếm theo tác giả
    },
    hinhAnh: {
      type: String, // URL hoặc base64
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Book", bookSchema);
