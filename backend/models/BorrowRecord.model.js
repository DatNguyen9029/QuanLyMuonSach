const mongoose = require("mongoose");

/**
 * BorrowRecord Schema - Phiếu mượn sách
 *
 * Luồng trạng thái:
 *   User tạo yêu cầu → 'ChoDuyet'
 *   Admin duyệt       → 'DangMuon'  (trừ soLuongTienTai -= 1)
 *   User trả sách     → 'DaTra'     (cộng soLuongTienTai += 1, tính phạt nếu trễ)
 *   Admin ghi nhận    → 'MatSach'   (tienPhat = donGia sách)
 */
const borrowRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    ngayMuon: {
      type: Date,
      default: Date.now,
    },
    ngayHenTra: {
      type: Date,
      required: true, // Admin/user đặt khi tạo phiếu
    },
    ngayTraThucTe: {
      type: Date, // Được cập nhật khi Admin đổi sang 'DaTra'
    },
    trangThai: {
      type: String,
      enum: ["ChoDuyet", "DangMuon", "DaTra", "MatSach"],
      default: "ChoDuyet",
    },
    tienPhat: {
      type: Number,
      default: 0, // VND
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);
