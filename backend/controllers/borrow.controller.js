//eslint-disable-next-line no-unused-vars
const mongoose = require("mongoose");
const BorrowRecord = require("../models/BorrowRecord.model");
const Book = require("../models/Book.model");
const User = require("../models/User.model");
const Notification = require("../models/Notification.model");
const { getIO } = require("../socket");
const notifService = require("../services/notification.service");

const BORROW_STATUS = {
  PENDING: "ChoDuyet",
  BORROWING: "DangMuon",
  RETURNED: "DaTra",
  REJECTED: "TuChoi",
  LOST: "MatSach",
};

const MAX_BORROW_LIMIT = 3;
const FINE_PER_DAY = 10000;

const BORROW_POPULATE = [
  { path: "user", select: "hoTen email dienThoai role avatar" },
  {
    path: "book",
    select: "tenSach tacGia hinhAnh donGia soLuongTienTai tenNXB",
  },
];

function isAdmin(req) {
  return req.user?.role === "admin";
}

function isReader(req) {
  return req.user?.role === "user";
}

function normalizeDateOnly(d) {
  const date = new Date(d);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function calculateFine(record) {
  if (!record) return 0;

  if (record.trangThai === BORROW_STATUS.LOST) {
    return Number(record.book?.donGia || 0);
  }

  const dueDate = new Date(record.ngayHenTra);
  const compareDate = record.ngayTraThucTe
    ? new Date(record.ngayTraThucTe)
    : new Date();

  const diff = normalizeDateOnly(compareDate) - normalizeDateOnly(dueDate);
  if (diff <= 0) return 0;

  const overdueDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return overdueDays * FINE_PER_DAY;
}

function getOverdueDays(record) {
  if (!record) return 0;
  if (record.trangThai !== BORROW_STATUS.BORROWING) return 0;
  const diff =
    normalizeDateOnly(new Date()) - normalizeDateOnly(record.ngayHenTra);
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function toClientBorrow(record) {
  const obj =
    typeof record.toObject === "function" ? record.toObject() : record;
  const overdueDays = getOverdueDays(obj);
  const isOverdue =
    obj.trangThai === BORROW_STATUS.BORROWING && overdueDays > 0;

  return {
    ...obj,
    isOverdue,
    overdueDays,
    displayStatus: isOverdue ? "QuaHan" : obj.trangThai,
    tienPhatTamTinh:
      obj.trangThai === BORROW_STATUS.BORROWING
        ? calculateFine(obj)
        : obj.tienPhat || 0,
  };
}

function sanitizeItems(items = []) {
  const map = new Map();

  for (const item of items) {
    const bookId = String(item.bookId || "").trim();
    const quantity = Number(item.quantity || 0);
    if (!bookId || !Number.isInteger(quantity) || quantity <= 0) continue;
    map.set(bookId, (map.get(bookId) || 0) + quantity);
  }

  return [...map.entries()].map(([bookId, quantity]) => ({ bookId, quantity }));
}

/**
 * [USER] POST /api/borrows
 * Reader tạo phiếu mượn của chính họ.
 */
exports.createBorrowRequest = async (req, res) => {
  try {
    if (!isReader(req) && !isAdmin(req)) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền tạo phiếu mượn." });
    }

    const { bookId, ngayHenTra, ghiChu = "" } = req.body;
    const userId = req.user._id;

    if (!bookId || !ngayHenTra) {
      return res.status(400).json({
        success: false,
        message: "bookId và ngayHenTra là bắt buộc.",
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Sách không tồn tại." });
    }

    const activeCount = await BorrowRecord.countDocuments({
      user: userId,
      trangThai: { $in: [BORROW_STATUS.PENDING, BORROW_STATUS.BORROWING] },
    });

    if (activeCount >= MAX_BORROW_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Bạn đang có ${activeCount} sách chờ duyệt/đang mượn. Giới hạn tối đa là ${MAX_BORROW_LIMIT}.`,
      });
    }

    if (book.soLuongTienTai <= 0) {
      return res.status(400).json({
        success: false,
        message: "Sách hiện đã hết.",
      });
    }

    const record = await BorrowRecord.create({
      user: userId,
      book: bookId,
      ngayHenTra: new Date(ngayHenTra),
      trangThai: BORROW_STATUS.PENDING,
      ghiChu: String(ghiChu || "").trim(),
    });

    await record.populate(BORROW_POPULATE);

    // ─── Notify Admin: lưu DB + emit realtime ──────────────────────────
    try {
      const io = getIO();
      const admins = await User.find({ role: "admin" }).select("_id");
      const title = "Yêu cầu mượn sách mới";
      const message = `Người dùng ${req.user.hoTen || "không xác định"} vừa tạo yêu cầu mượn sách "${book.tenSach}".`;

      await Promise.all(
        admins.map((admin) =>
          notifService.createAndEmit(io, {
            userId: admin._id,
            title,
            message,
            type: "borrow_update",
            relatedId: record._id,
            relatedType: "borrow",
            data: {
              userId: req.user._id,
              borrowId: record._id,
              bookTitle: book.tenSach,
              userName: req.user.hoTen,
              trangThai: BORROW_STATUS.PENDING,
            },
          }),
        ),
      );
    } catch (err) {
      console.error("[Notification] Lỗi emit admin:", err);
    }
    // ─────────────────────────────────────────────────────────────────────

    return res
      .status(201)
      .json({ success: true, data: toClientBorrow(record) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [ADMIN] POST /api/borrows/admin
 * Tạo trực tiếp phiếu mượn cho bạn đọc.
 */
exports.createBorrowByAdmin = async (req, res) => {
  let createdRecords = [];
  let stockAdjusted = [];

  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Chỉ Admin mới được tạo phiếu mượn trực tiếp.",
      });
    }

    const { userId, ngayMuon, ngayHenTra, ghiChu = "", items = [] } = req.body;
    const groupedItems = sanitizeItems(items);

    if (!userId || !ngayMuon || !ngayHenTra || groupedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn đọc, ngày mượn, ngày hẹn trả và danh sách sách là bắt buộc.",
      });
    }

    const borrowDate = new Date(ngayMuon);
    const dueDate = new Date(ngayHenTra);

    if (Number.isNaN(borrowDate.getTime()) || Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày mượn hoặc ngày hẹn trả không hợp lệ.",
      });
    }

    if (dueDate < borrowDate) {
      return res.status(400).json({
        success: false,
        message: "Ngày hẹn trả phải lớn hơn hoặc bằng ngày mượn.",
      });
    }

    const reader = await User.findById(userId).select("role hoTen");
    if (!reader) {
      return res
        .status(404)
        .json({ success: false, message: "Bạn đọc không tồn tại." });
    }

    if (reader.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể tạo phiếu mượn cho tài khoản bạn đọc.",
      });
    }

    const totalQuantity = groupedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const activeCount = await BorrowRecord.countDocuments({
      user: userId,
      trangThai: { $in: [BORROW_STATUS.PENDING, BORROW_STATUS.BORROWING] },
    });

    if (activeCount + totalQuantity > MAX_BORROW_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Bạn đọc hiện có ${activeCount} sách chờ duyệt/đang mượn. Tối đa chỉ được ${MAX_BORROW_LIMIT} cuốn.`,
      });
    }

    const books = await Book.find({
      _id: { $in: groupedItems.map((i) => i.bookId) },
    }).select("tenSach soLuongTienTai");
    if (books.length !== groupedItems.length) {
      return res.status(404).json({
        success: false,
        message: "Có sách trong danh sách không tồn tại.",
      });
    }

    const bookMap = new Map(books.map((b) => [String(b._id), b]));
    for (const item of groupedItems) {
      const book = bookMap.get(item.bookId);
      if (!book || book.soLuongTienTai < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sách "${book?.tenSach || item.bookId}" không đủ số lượng tồn.`,
        });
      }
    }

    const payloads = groupedItems.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        user: userId,
        book: item.bookId,
        ngayMuon: borrowDate,
        ngayHenTra: dueDate,
        trangThai: BORROW_STATUS.BORROWING,
        ghiChu: String(ghiChu || "").trim(),
      })),
    );

    for (const item of groupedItems) {
      const updated = await Book.findOneAndUpdate(
        { _id: item.bookId, soLuongTienTai: { $gte: item.quantity } },
        { $inc: { soLuongTienTai: -item.quantity } },
        { new: true },
      );
      if (!updated) {
        // rollback stock đã trừ trước đó
        if (stockAdjusted.length > 0) {
          await Book.bulkWrite(
            stockAdjusted.map((x) => ({
              updateOne: {
                filter: { _id: x.bookId },
                update: { $inc: { soLuongTienTai: x.quantity } },
              },
            })),
          );
        }
        return res.status(400).json({
          success: false,
          message:
            "Một hoặc nhiều sách không còn đủ số lượng để tạo phiếu mượn.",
        });
      }
      stockAdjusted.push(item);
    }

    createdRecords = await BorrowRecord.insertMany(payloads);
    const populatedRecords = await BorrowRecord.find({
      _id: { $in: createdRecords.map((r) => r._id) },
    }).populate(BORROW_POPULATE);

    // ─── THÊM: Notify User ──────────────────────────────────────────────
    try {
      const io = getIO();
      await notifService.createAndEmit(io, {
        userId,
        title: "Phiếu mượn mới đã được tạo",
        message: `Bạn có ${populatedRecords.length} sách vừa được ghi nhận mượn.`,
        type: "borrow_update",
        relatedId: populatedRecords[0]?._id || null,
        relatedType: "borrow",
        data: {
          createdCount: populatedRecords.length,
          trangThai: BORROW_STATUS.BORROWING,
        },
      });
    } catch (err) {
      console.error("[Notification] Lỗi emit user:", err);
    }
    // ─────────────────────────────────────────────────────────────────────

    return res.status(201).json({
      success: true,
      data: populatedRecords.map(toClientBorrow),
      totalCreated: populatedRecords.length,
    });
  } catch (err) {
    if (createdRecords.length > 0) {
      await BorrowRecord.deleteMany({
        _id: { $in: createdRecords.map((r) => r._id) },
      });
    }
    if (stockAdjusted.length > 0) {
      await Book.bulkWrite(
        stockAdjusted.map((x) => ({
          updateOne: {
            filter: { _id: x.bookId },
            update: { $inc: { soLuongTienTai: x.quantity } },
          },
        })),
      );
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [ADMIN ONLY] PATCH /api/borrows/:id/status
 */
exports.updateBorrowStatus = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Chỉ Admin mới được thay đổi trạng thái phiếu mượn.",
      });
    }

    const { id } = req.params;
    const { trangThai, lyDoTuChoi = "" } = req.body;

    if (
      ![
        BORROW_STATUS.PENDING,
        BORROW_STATUS.BORROWING,
        BORROW_STATUS.RETURNED,
        BORROW_STATUS.REJECTED,
        BORROW_STATUS.LOST,
      ].includes(trangThai)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ." });
    }

    const record = await BorrowRecord.findById(id).populate("book");
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Phiếu mượn không tồn tại." });
    }

    const currentStatus = record.trangThai;

    if (currentStatus === trangThai) {
      await record.populate(BORROW_POPULATE);
      return res.json({ success: true, data: toClientBorrow(record) });
    }

    // [ROLE CHECK / BUSINESS RULE] chỉ cho phép duyệt khi đang chờ duyệt
    if (trangThai === BORROW_STATUS.BORROWING) {
      if (currentStatus !== BORROW_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể duyệt phiếu đang chờ duyệt.",
        });
      }

      const book = await Book.findById(record.book._id);
      if (!book || book.soLuongTienTai <= 0) {
        return res.status(400).json({
          success: false,
          message: "Sách đã hết, không thể duyệt mượn.",
        });
      }

      await Book.findByIdAndUpdate(record.book._id, {
        $inc: { soLuongTienTai: -1 },
      });

      record.lyDoTuChoi = "";
      record.ngayTraThucTe = null;
    }

    if (trangThai === BORROW_STATUS.REJECTED) {
      if (currentStatus !== BORROW_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể từ chối phiếu đang chờ duyệt.",
        });
      }
      record.lyDoTuChoi = String(lyDoTuChoi || "").trim();
    }

    if (trangThai === BORROW_STATUS.RETURNED) {
      if (currentStatus !== BORROW_STATUS.BORROWING) {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể trả sách đối với phiếu đang mượn.",
        });
      }

      record.ngayTraThucTe = new Date();
      record.tienPhat = calculateFine({
        ...record.toObject(),
        trangThai: BORROW_STATUS.RETURNED,
      });

      await Book.findByIdAndUpdate(record.book._id, {
        $inc: { soLuongTienTai: 1 },
      });

      record.lyDoTuChoi = "";
    }

    if (trangThai === BORROW_STATUS.LOST) {
      if (currentStatus !== BORROW_STATUS.BORROWING) {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể báo mất sách đối với phiếu đang mượn.",
        });
      }

      record.ngayTraThucTe = new Date();
      record.tienPhat = Number(record.book.donGia || 0);
      record.lyDoTuChoi = "";
    }

    record.trangThai = trangThai;
    await record.save();
    await record.populate(BORROW_POPULATE);

    // ─── THÊM: Notify User theo từng trường hợp ─────────────────────────
    try {
      const io = getIO();
      let notifTitle = "Cập nhật phiếu mượn";
      let notifMessage = `Trạng thái mới: ${record.trangThai}`;

      if (trangThai === BORROW_STATUS.BORROWING) {
        notifTitle = "Phiếu mượn được duyệt ✓";
        notifMessage = `Phiếu mượn sách "${record.book.tenSach}" của bạn đã được duyệt. Vui lòng đến thư viện lấy sách trước ngày ${formatDate(record.ngayHenTra)}.`;
      } else if (trangThai === BORROW_STATUS.REJECTED) {
        notifTitle = "Phiếu mượn bị từ chối";
        notifMessage = `Phiếu mượn sách "${record.book.tenSach}" đã bị từ chối. Lý do: ${record.lyDoTuChoi || "Không đủ điều kiện mượn sách."}`;
      } else if (trangThai === BORROW_STATUS.RETURNED) {
        notifTitle = "Xác nhận trả sách";
        notifMessage = `Sách "${record.book.tenSach}" đã được xác nhận trả${record.tienPhat > 0 ? `. Tiền phạt: ${record.tienPhat.toLocaleString("vi-VN")}đ` : ""}.`;
      } else if (trangThai === BORROW_STATUS.LOST) {
        notifTitle = "Thông báo mất sách";
        notifMessage = `Sách "${record.book.tenSach}" trong phiếu mượn của bạn đã được xác nhận là mất. Tiền phạt: ${record.tienPhat.toLocaleString("vi-VN")}đ. Vui lòng liên hệ thư viện.`;
      }

      await notifService.createAndEmit(io, {
        userId: record.user._id || record.user,
        title: notifTitle,
        message: notifMessage,
        type: "borrow_update",
        relatedId: record._id,
        relatedType: "borrow",
        data: {
          trangThai: record.trangThai,
          tienPhat: record.tienPhat,
          bookTitle: record.book.tenSach,
        },
      });
    } catch (err) {
      console.error("[Notification] Lỗi emit user:", err);
    }
    // ─────────────────────────────────────────────────────────────────────

    return res.json({ success: true, data: toClientBorrow(record) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [ADMIN ONLY] PATCH /api/borrows/:id/extend
 */
exports.extendBorrow = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Chỉ Admin mới được gia hạn phiếu mượn.",
      });
    }

    const { id } = req.params;
    const extendDays = Number(req.body.days);

    if (!Number.isInteger(extendDays) || extendDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số ngày gia hạn phải là số nguyên dương.",
      });
    }

    const record = await BorrowRecord.findById(id)
      .populate("user", "hoTen email")
      .populate("book", "tenSach tacGia hinhAnh donGia");

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Phiếu mượn không tồn tại." });
    }

    if (record.trangThai !== BORROW_STATUS.BORROWING) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể gia hạn phiếu đang mượn.",
      });
    }

    const dueDate = new Date(record.ngayHenTra);
    dueDate.setDate(dueDate.getDate() + extendDays);
    record.ngayHenTra = dueDate;

    await record.save();
    await record.populate(BORROW_POPULATE);

    return res.json({ success: true, data: toClientBorrow(record) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [USER/ADMIN] GET /api/borrows/:id
 */
exports.getBorrowDetail = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id)
      .populate("user", "hoTen email dienThoai role avatar")
      .populate("book", "tenSach donGia tacGia hinhAnh tenNXB");

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Phiếu mượn không tồn tại." });
    }

    const ownerId = String(record.user._id || record.user);
    const currentUserId = String(req.user._id);
    const admin = isAdmin(req);
    const owner = ownerId === currentUserId;

    // [ROLE CHECK] chỉ Admin hoặc chính chủ mới xem được
    if (!admin && !owner) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem phiếu mượn này.",
      });
    }

    return res.json({
      success: true,
      data: {
        ...toClientBorrow(record),
        finePreview: calculateFine(record),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [ADMIN] GET /api/borrows
 * [USER]  GET /api/borrows  -> chỉ trả về dữ liệu của chính họ
 */
exports.getAllBorrows = async (req, res) => {
  try {
    const {
      trangThai,
      status,
      userId,
      //eslint-disable-next-line no-unused-vars
      q = "",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    const selectedStatus = trangThai || status;

    if (selectedStatus) filter.trangThai = selectedStatus;

    if (!isAdmin(req)) {
      // [ROLE CHECK] Reader chỉ nhìn thấy dữ liệu của chính mình
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);

    let query = BorrowRecord.find(filter)
      .populate("user", "hoTen email dienThoai role avatar")
      .populate("book", "tenSach tacGia hinhAnh donGia soLuongTienTai tenNXB")
      .sort({ createdAt: -1 });

    const records = await query.skip((pageNum - 1) * limitNum).limit(limitNum);
    const total = await BorrowRecord.countDocuments(filter);
    const mapped = records.map(toClientBorrow);

    return res.json({
      success: true,
      data: mapped,
      total,
      page: pageNum,
      limit: limitNum,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [USER] GET /api/borrows/my
 */
exports.getMyBorrows = async (req, res) => {
  try {
    const records = await BorrowRecord.find({ user: req.user._id })
      .populate("user", "hoTen email dienThoai role avatar")
      .populate("book", "tenSach tacGia hinhAnh donGia soLuongTienTai tenNXB")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: records.map(toClientBorrow),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Helper function ────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
