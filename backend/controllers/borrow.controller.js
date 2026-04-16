/**
 * Borrow Controller - Nghiệp vụ Mượn/Trả Sách (Happy Library)
 *
 * Các nghiệp vụ quan trọng:
 *  1. Giới hạn mượn tối đa 3 cuốn (ChoDuyet + DangMuon)
 *  2. Trừ soLuongTienTai khi ChoDuyet → DangMuon
 *  3. Cộng soLuongTienTai khi → DaTra
 *  4. Tự động tính tiền phạt (trễ hạn / mất sách)
 *  5. Emit Socket.io để VueJS cập nhật UI real-time
 */

const BorrowRecord = require("../models/BorrowRecord.model");
const Book = require("../models/Book.model");
const User = require("../models/User.model");
const Notification = require("../models/Notification.model");

// ─── Hằng số nghiệp vụ ────────────────────────────────────────────────────────
const MAX_BORROW_LIMIT = 3; // Số sách tối đa được mượn cùng lúc
const FINE_PER_DAY = 10000; // Tiền phạt mỗi ngày trễ: 10.000 VND

const BORROW_POPULATE = [
  { path: "user", select: "hoTen email dienThoai" },
  { path: "book", select: "tenSach tacGia hinhAnh donGia soLuongTienTai" },
];

/**
 * Hàm tiện ích: Tính tiền phạt cho một BorrowRecord
 *
 * Logic:
 *  - Nếu trạng thái 'MatSach' → phạt = donGia sách (giá trị tham chiếu)
 *  - Nếu ngày trả thực tế (hoặc hôm nay) > ngayHenTra → phạt theo số ngày trễ
 *  - Còn lại → 0 đồng
 *
 * @param {Object} record  - BorrowRecord document (đã populate book)
 * @returns {number} tiền phạt (VND)
 */
function tinhTienPhat(record) {
  // ── Trường hợp 1: Mất sách ───────────────────────────────────────────────
  if (record.trangThai === "MatSach") {
    return record.book.donGia; // Phạt đúng bằng giá sách
  }

  // ── Trường hợp 2: Kiểm tra trễ hạn ──────────────────────────────────────
  // Dùng ngày trả thực tế nếu đã trả, còn không dùng ngày hôm nay để tính "tạm tính"
  const ngayKiemTra = record.ngayTraThucTe
    ? new Date(record.ngayTraThucTe)
    : new Date();

  const ngayHenTra = new Date(record.ngayHenTra);

  // So sánh chỉ theo ngày (bỏ giờ/phút/giây để tránh sai lệch)
  const msKiemTra = Date.UTC(
    ngayKiemTra.getFullYear(),
    ngayKiemTra.getMonth(),
    ngayKiemTra.getDate(),
  );
  const msHenTra = Date.UTC(
    ngayHenTra.getFullYear(),
    ngayHenTra.getMonth(),
    ngayHenTra.getDate(),
  );

  const msDiff = msKiemTra - msHenTra;

  if (msDiff > 0) {
    // Tính số ngày trễ (làm tròn lên để không bỏ sót ngày lẻ)
    const soNgayTre = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    return soNgayTre * FINE_PER_DAY; // 10.000 VND × số ngày trễ
  }

  return 0; // Không phạt
}

function gopSachTrung(items = []) {
  const grouped = new Map();

  for (const item of items) {
    const bookId = item.bookId?.trim();
    const quantity = Number(item.quantity || 0);

    if (!bookId || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    grouped.set(bookId, (grouped.get(bookId) || 0) + quantity);
  }

  return Array.from(grouped.entries()).map(([bookId, quantity]) => ({
    bookId,
    quantity,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// [USER] POST /api/borrows - Tạo yêu cầu mượn sách
// ─────────────────────────────────────────────────────────────────────────────
exports.createBorrowRequest = async (req, res) => {
  try {
    const { bookId, ngayHenTra } = req.body;
    const userId = req.user._id;

    // ── Kiểm tra 1: Giới hạn số sách đang mượn ───────────────────────────
    const soSachDangMuon = await BorrowRecord.countDocuments({
      user: userId,
      trangThai: { $in: ["ChoDuyet", "DangMuon"] },
    });

    if (soSachDangMuon >= MAX_BORROW_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Bạn đang mượn ${soSachDangMuon} cuốn. Giới hạn tối đa là ${MAX_BORROW_LIMIT} cuốn cùng lúc.`,
      });
    }

    // ── Kiểm tra 2: Sách có tồn tại không ───────────────────────────────
    const book = await Book.findById(bookId);
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Sách không tồn tại." });
    }

    // ── Kiểm tra 3: Sách có sẵn để mượn không ───────────────────────────
    // (soLuongTienTai chỉ trừ khi Admin duyệt, nhưng nên cảnh báo sớm)
    if (book.soLuongTienTai <= 0) {
      return res.status(400).json({
        success: false,
        message: "Sách hiện đã hết, vui lòng thử lại sau.",
      });
    }

    // ── Tạo BorrowRecord ─────────────────────────────────────────────────
    const record = await BorrowRecord.create({
      user: userId,
      book: bookId,
      ngayHenTra: new Date(ngayHenTra),
      trangThai: "ChoDuyet",
    });
    await record.populate(BORROW_POPULATE);

    // ── NEW: Notification khi tạo yêu cầu mượn (cho admin) ───────────────
    const io = req.app.get("io");

    const adminNotif = new Notification({
      title: `Yêu cầu mượn sách mới`,
      message: `Người dùng ${req.user.hoTen} vừa tạo yêu cầu mượn sách.`,
      type: "borrow_update",
      relatedId: record._id,
      relatedType: "borrow",
      data: {
        userId: req.user._id,
        userName: req.user.hoTen,
        borrowId: record._id,
      },
    });
    await adminNotif.save();

    // Emit broadcast cho admin
    io.emit("adminNotification", adminNotif);

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] POST /api/borrows/admin - Tạo phiếu mượn trực tiếp cho bạn đọc
// ─────────────────────────────────────────────────────────────────────────────
exports.createBorrowByAdmin = async (req, res) => {
  let createdRecords = [];
  let stockAdjustedItems = [];

  try {
    const { userId, ngayMuon, ngayHenTra, ghiChu = "", items = [] } = req.body;
    const groupedItems = gopSachTrung(items);

    if (!userId || !ngayMuon || !ngayHenTra || groupedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bạn đọc, ngày mượn, ngày hẹn trả và danh sách sách là bắt buộc.",
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

    const reader = await User.findById(userId).select("hoTen role");
    if (!reader) {
      return res.status(404).json({
        success: false,
        message: "Bạn đọc không tồn tại.",
      });
    }

    if (reader.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể tạo phiếu mượn cho tài khoản bạn đọc.",
      });
    }

    const tongSoLuong = groupedItems.reduce((sum, item) => sum + item.quantity, 0);
    const dangMuon = await BorrowRecord.countDocuments({
      user: userId,
      trangThai: { $in: ["ChoDuyet", "DangMuon"] },
    });

    if (dangMuon + tongSoLuong > MAX_BORROW_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Bạn đọc hiện đã có ${dangMuon} sách đang mượn/chờ duyệt. Tối đa chỉ được ${MAX_BORROW_LIMIT} cuốn cùng lúc.`,
      });
    }

    const bookIds = groupedItems.map((item) => item.bookId);
    const books = await Book.find({ _id: { $in: bookIds } }).select(
      "tenSach soLuongTienTai",
    );

    if (books.length !== bookIds.length) {
      return res.status(404).json({
        success: false,
        message: "Có sách trong danh sách không tồn tại.",
      });
    }

    const bookMap = new Map(books.map((book) => [String(book._id), book]));
    for (const item of groupedItems) {
      const book = bookMap.get(item.bookId);
      if (!book || book.soLuongTienTai < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sách "${book?.tenSach || "không xác định"}" không đủ số lượng tồn.`,
        });
      }
    }

    const payloads = groupedItems.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        user: userId,
        book: item.bookId,
        ngayMuon: borrowDate,
        ngayHenTra: dueDate,
        trangThai: "DangMuon",
        ghiChu: String(ghiChu || "").trim(),
      })),
    );

    for (const item of groupedItems) {
      const updatedBook = await Book.findOneAndUpdate(
        {
          _id: item.bookId,
          soLuongTienTai: { $gte: item.quantity },
        },
        { $inc: { soLuongTienTai: -item.quantity } },
        { new: true },
      );

      if (!updatedBook) {
        if (stockAdjustedItems.length > 0) {
          await Book.bulkWrite(
            stockAdjustedItems.map((adjustedItem) => ({
              updateOne: {
                filter: { _id: adjustedItem.bookId },
                update: { $inc: { soLuongTienTai: adjustedItem.quantity } },
              },
            })),
          );
        }

        return res.status(400).json({
          success: false,
          message: "Một hoặc nhiều sách không còn đủ số lượng để tạo phiếu mượn.",
        });
      }

      stockAdjustedItems.push(item);
    }

    createdRecords = await BorrowRecord.insertMany(payloads);

    const populatedRecords = await BorrowRecord.find({
      _id: { $in: createdRecords.map((record) => record._id) },
    })
      .populate(BORROW_POPULATE)
      .sort({ createdAt: -1 });

    const io = req.app.get("io");
    const userNotif = new Notification({
      user: userId,
      title: "Phiếu mượn mới đã được tạo",
      message: `Bạn có ${populatedRecords.length} sách vừa được ghi nhận mượn.`,
      type: "borrow_update",
      relatedId: populatedRecords[0]?._id || null,
      relatedType: "borrow",
      data: { createdCount: populatedRecords.length, trangThai: "DangMuon" },
    });
    await userNotif.save();
    io.to(`user_${userId}`).emit("newNotification", userNotif);
    io.emit("adminBorrowUpdated", {
      recordIds: populatedRecords.map((record) => record._id),
      trangThai: "DangMuon",
    });

    return res.status(201).json({
      success: true,
      data: populatedRecords,
      totalCreated: populatedRecords.length,
    });
  } catch (err) {
    if (createdRecords.length > 0) {
      await BorrowRecord.deleteMany({
        _id: { $in: createdRecords.map((record) => record._id) },
      });
    }

    if (stockAdjustedItems.length > 0) {
      await Book.bulkWrite(
        stockAdjustedItems.map((item) => ({
          updateOne: {
            filter: { _id: item.bookId },
            update: { $inc: { soLuongTienTai: item.quantity } },
          },
        })),
      );
    }

    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] PATCH /api/borrows/:id/status - Cập nhật trạng thái phiếu mượn
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBorrowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai, lyDoTuChoi } = req.body;

    const validStatuses = [
      "ChoDuyet",
      "DangMuon",
      "DaTra",
      "MatSach",
      "TuChoi",
    ];
    if (!validStatuses.includes(trangThai)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ." });
    }

    // Populate book để tính tiền phạt và cập nhật số lượng
    const record = await BorrowRecord.findById(id).populate("book");
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Phiếu mượn không tồn tại." });
    }

    const trangThaiCu = record.trangThai;

    // ── Nghiệp vụ: ChoDuyet → DangMuon (Trừ số lượng sách) ───────────────
    if (trangThaiCu === "ChoDuyet" && trangThai === "DangMuon") {
      const book = await Book.findById(record.book._id);
      if (book.soLuongTienTai <= 0) {
        return res.status(400).json({
          success: false,
          message: "Sách đã hết, không thể duyệt mượn.",
        });
      }
      // Trừ 1 đơn vị tồn kho
      await Book.findByIdAndUpdate(record.book._id, {
        $inc: { soLuongTienTai: -1 },
      });
    }

    // ── Nghiệp vụ: Từ chối phiếu đang chờ duyệt ─────────────────────────────
    if (trangThai === "TuChoi") {
      if (trangThaiCu !== "ChoDuyet") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể từ chối phiếu đang chờ duyệt.",
        });
      }

      record.lyDoTuChoi = lyDoTuChoi?.trim() || "";
    }

    // ── Nghiệp vụ: Chuyển sang DaTra (Cộng lại số lượng + tính phạt) ─────
    if (trangThai === "DaTra" && trangThaiCu !== "DaTra") {
      record.ngayTraThucTe = new Date();
      record.lyDoTuChoi = "";

      // Cộng lại 1 đơn vị tồn kho (chỉ cộng nếu đang ở trạng thái DangMuon)
      if (trangThaiCu === "DangMuon") {
        await Book.findByIdAndUpdate(record.book._id, {
          $inc: { soLuongTienTai: 1 },
        });
      }

      // Tính tiền phạt trễ hạn
      record.tienPhat = tinhTienPhat({
        ...record.toObject(),
        trangThai: "DaTra",
      });
    }

    // ── Nghiệp vụ: Chuyển sang MatSach (Phạt = giá sách, không cộng lại) ─
    if (trangThai === "MatSach" && trangThaiCu !== "MatSach") {
      record.tienPhat = record.book.donGia;
      record.lyDoTuChoi = "";
      // Không cộng lại soLuongTienTai vì sách bị mất
    }

    if (trangThai === "DangMuon") {
      record.lyDoTuChoi = "";
    }

    record.trangThai = trangThai;
    await record.save();
    await record.populate(BORROW_POPULATE);

    // ── NEW: Tạo & Emit Notification ─────────────────────────────────────
    const io = req.app.get("io");

    // Notification cho user
    const userNotif = new Notification({
      user: record.user,
      title: `Phiếu mượn ${record._id.slice(-6).toUpperCase()} đã được cập nhật`,
      message: `Trạng thái: ${trangThai}. ${record.tienPhat > 0 ? `Phạt: ${record.tienPhat.toLocaleString()}đ` : ""}`,
      type: "borrow_update",
      relatedId: record._id,
      relatedType: "borrow",
      data: { trangThai, tienPhat: record.tienPhat },
    });
    await userNotif.save();

    // Emit tới user room
    io.to(`user_${record.user}`).emit("newNotification", userNotif);

    // Notification cho admin (nếu không phải admin thực hiện)
    if (req.user.role !== "admin") {
      const adminNotif = new Notification({
        user: null, // Broadcast cho tất cả admin sau
        title: `Phiếu mượn mới được cập nhật`,
        message: `Phiếu ${record._id.slice(-6).toUpperCase()}: ${trangThai}`,
        type: "borrow_update",
        relatedId: record._id,
        relatedType: "borrow",
        data: { trangThai },
      });
      await adminNotif.save();

      // Emit broadcast cho admin
      io.emit("adminNotification", adminNotif);
    }

    // ── Emit Socket.io: Thông báo cập nhật UI (legacy) ───────────────────
    // Emit tới room cá nhân của user để cập nhật UI không cần reload
    io.to(`user_${record.user}`).emit("borrowStatusUpdated", {
      recordId: record._id,
      trangThai: record.trangThai,
      tienPhat: record.tienPhat,
    });
    // Emit broadcast cho Admin dashboard
    io.emit("adminBorrowUpdated", {
      recordId: record._id,
      trangThai: record.trangThai,
    });

    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] PATCH /api/borrows/:id/extend - Gia hạn phiếu mượn
// ─────────────────────────────────────────────────────────────────────────────
exports.extendBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    const extendDays = Number(days);

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

    if (record.trangThai !== "DangMuon") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể gia hạn phiếu đang mượn.",
      });
    }

    const ngayHenTra = new Date(record.ngayHenTra);
    ngayHenTra.setDate(ngayHenTra.getDate() + extendDays);
    record.ngayHenTra = ngayHenTra;
    await record.save();

    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [USER/ADMIN] GET /api/borrows/:id - Chi tiết phiếu mượn (có tính phạt tạm tính)
// ─────────────────────────────────────────────────────────────────────────────
exports.getBorrowDetail = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id)
      .populate("user", "hoTen email dienThoai")
      .populate("book", "tenSach donGia tacGia hinhAnh");

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Phiếu mượn không tồn tại." });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = String(record.user._id) === String(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem phiếu mượn này.",
      });
    }

    // Tính tiền phạt tạm tính (nếu đang mượn mà quá hạn)
    const tienPhatTamTinh = tinhTienPhat(record);

    return res.json({
      success: true,
      data: {
        ...record.toObject(),
        tienPhatTamTinh, // Dùng cho UI hiển thị cảnh báo, chưa lưu DB
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] GET /api/borrows - Lấy danh sách tất cả phiếu mượn (có filter)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllBorrows = async (req, res) => {
  try {
    const { trangThai, status, userId, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (trangThai || status) filter.trangThai = trangThai || status;
    if (userId) filter.user = userId;

    const records = await BorrowRecord.find(filter)
      .populate("user", "hoTen email dienThoai")
      .populate("book", "tenSach tacGia hinhAnh donGia soLuongTienTai")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await BorrowRecord.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / Number(limit || 10)));

    return res.json({
      success: true,
      data: records,
      total,
      page: Number(page),
      limit: Number(limit),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [USER] GET /api/borrows/my - Lịch sử mượn sách của user hiện tại
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyBorrows = async (req, res) => {
  try {
    const records = await BorrowRecord.find({ user: req.user._id })
      .populate("book", "tenSach tacGia hinhAnh donGia")
      .sort({ createdAt: -1 });

    // Tính tiền phạt tạm tính cho từng record
    const enriched = records.map((r) => ({
      ...r.toObject(),
      tienPhatTamTinh: tinhTienPhat(r),
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
