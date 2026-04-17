/**
 * Book Controller - CRUD sách + Tìm kiếm (Happy Library)
 * Hỗ trợ tìm kiếm theo tên sách / tác giả (Voice Search ở frontend → text → API này)
 */

const Book = require("../models/Book.model");
const Publisher = require("../models/Publisher.model");
const { generateNextPublisherCode } = require("../utils/publisher.util");
const { generateNextBookCode } = require("../utils/book.util");

async function ensureBookCodes() {
  const booksWithoutCode = await Book.find({
    $or: [{ maSach: { $exists: false } }, { maSach: "" }, { maSach: null }],
  })
    .select("_id")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  for (const book of booksWithoutCode) {
    const maSach = await generateNextBookCode();
    await Book.findByIdAndUpdate(book._id, { maSach });
  }
}

async function resolvePublisherFields(payload = {}) {
  const tenNXB = typeof payload.tenNXB === "string" ? payload.tenNXB.trim() : "";
  const publisherId = payload.nxb || null;

  if (publisherId) {
    const publisher = await Publisher.findById(publisherId);
    if (!publisher) {
      throw new Error("Nhà xuất bản không tồn tại.");
    }

    return {
      ...payload,
      nxb: publisher._id,
      tenNXB: publisher.tenNXB,
    };
  }

  if (!tenNXB) {
    return {
      ...payload,
      nxb: null,
      tenNXB: "",
    };
  }

  let publisher = await Publisher.findOne({
    tenNXB: { $regex: `^${tenNXB.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });

  if (!publisher) {
    publisher = await Publisher.create({
      maNXB: await generateNextPublisherCode(),
      tenNXB,
      diaChi: "",
    });
  }

  return {
    ...payload,
    nxb: publisher._id,
    tenNXB: publisher.tenNXB,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// [PUBLIC] GET /api/books - Lấy danh sách sách + Tìm kiếm
// Query params: ?q=<từ khóa>&page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────
exports.getBooks = async (req, res) => {
  try {
    await ensureBookCodes();
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
    await ensureBookCodes();
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
    const bookPayload = await resolvePublisherFields(req.body);
    const book = await Book.create({
      ...bookPayload,
      maSach: await generateNextBookCode(),
    });
    await book.populate("nxb", "maNXB tenNXB diaChi");
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
    const currentBook = await Book.findById(req.params.id);
    if (!currentBook)
      return res
        .status(404)
        .json({ success: false, message: "Sách không tồn tại." });

    const bookPayload = await resolvePublisherFields(req.body);
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      {
        ...bookPayload,
        // Mã sách là định danh hệ thống, không cho sửa thủ công.
        maSach: currentBook.maSach || (await generateNextBookCode()),
      },
      {
        new: true, // Trả về document đã cập nhật
        runValidators: true,
      },
    ).populate("nxb", "maNXB tenNXB diaChi");
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
