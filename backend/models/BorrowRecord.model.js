const mongoose = require("mongoose");

const BORROW_STATUS = Object.freeze({
  PENDING: "ChoDuyet",
  BORROWING: "DangMuon",
  RETURNED: "DaTra",
  REJECTED: "TuChoi",
  LOST: "MatSach",
});

/**
 * BorrowRecord Schema - Phiếu mượn sách
 * - user: người mượn (Reader)
 * - book: sách được mượn
 * - trangThai: trạng thái nghiệp vụ lưu trong DB
 */
const borrowRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    ngayMuon: {
      type: Date,
      default: Date.now,
    },
    ngayHenTra: {
      type: Date,
      required: true,
      index: true,
    },
    ngayTraThucTe: {
      type: Date,
      default: null,
    },
    trangThai: {
      type: String,
      enum: Object.values(BORROW_STATUS),
      default: BORROW_STATUS.PENDING,
      index: true,
    },
    tienPhat: {
      type: Number,
      default: 0,
      min: 0,
    },
    daDenBu: {
      type: Boolean,
      default: false,
    },
    ngayDenBu: {
      type: Date,
      default: null,
    },
    lyDoTuChoi: {
      type: String,
      trim: true,
      default: "",
    },
    ghiChu: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

borrowRecordSchema.index({ user: 1, trangThai: 1, createdAt: -1 });
borrowRecordSchema.index({ book: 1, trangThai: 1, createdAt: -1 });

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);
module.exports.BORROW_STATUS = BORROW_STATUS;
