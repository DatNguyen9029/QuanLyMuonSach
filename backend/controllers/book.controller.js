/**
 * Book Controller - CRUD sách + Tìm kiếm (Happy Library)
 * Hỗ trợ tìm kiếm theo tên sách / tác giả (Voice Search ở frontend → text → API này)
 */

const Book = require("../models/Book.model");

// ─────────────────────────────────────────────────────────────────────────────
// [PUBLIC] GET /api/books - Lấy danh sách sách + Tìm kiếm
// Query params: ?q=<từ khóa>&page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────
exports.getBooks = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    const filter = {};

    // Tìm kiếm theo tên sách HOẶC tác giả (case-insensitive)
    // Frontend Voice Search chuyển giọng nói → text → truyền vào param `q`
    if (q && q.trim()) {
      filter.$or = [
        { tenSach: { $regex: q.trim(), $options: "i" } },
        { tacGia: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const books = await Book.find(filter)
      .populate("nxb", "tenNXB")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Book.countDocuments(filter);

    return res.json({
      success: true,
      data: books,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [PUBLIC] GET /api/books/:id - Chi tiết sách
// ─────────────────────────────────────────────────────────────────────────────
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "nxb",
      "tenNXB diaChi",
    );
    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Sách không tồn tại." });
    return res.json({ success: true, data: book });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] POST /api/books - Thêm sách mới
// ─────────────────────────────────────────────────────────────────────────────
exports.createBook = async (req, res) => {
  try {
    const {
      tenSach,
      donGia,
      soLuongTienTai,
      namXuatBan,
      nxb,
      tacGia,
      hinhAnh,
    } = req.body;
    const book = await Book.create({
      tenSach,
      donGia,
      soLuongTienTai,
      namXuatBan,
      nxb,
      tacGia,
      hinhAnh,
    });
    return res.status(201).json({ success: true, data: book });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] PUT /api/books/:id - Cập nhật thông tin sách
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Trả về document đã cập nhật
      runValidators: true,
    }).populate("nxb", "tenNXB");

    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Sách không tồn tại." });
    return res.json({ success: true, data: book });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] DELETE /api/books/:id - Xóa sách
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Sách không tồn tại." });
    return res.json({ success: true, message: "Đã xóa sách thành công." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
