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

// ─── Hằng số nghiệp vụ ────────────────────────────────────────────────────────
const MAX_BORROW_LIMIT = 3; // Số sách tối đa được mượn cùng lúc
const FINE_PER_DAY = 10000; // Tiền phạt mỗi ngày trễ: 10.000 VND

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

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN] PATCH /api/borrows/:id/status - Cập nhật trạng thái phiếu mượn
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBorrowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai } = req.body;

    const validStatuses = ["ChoDuyet", "DangMuon", "DaTra", "MatSach"];
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

    // ── Nghiệp vụ: Chuyển sang DaTra (Cộng lại số lượng + tính phạt) ─────
    if (trangThai === "DaTra" && trangThaiCu !== "DaTra") {
      record.ngayTraThucTe = new Date();

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
      // Không cộng lại soLuongTienTai vì sách bị mất
    }

    record.trangThai = trangThai;
    await record.save();

    // ── Emit Socket.io: Thông báo cập nhật tới VueJS frontend ─────────────
    const io = req.app.get("io");
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
    const { trangThai, userId, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (trangThai) filter.trangThai = trangThai;
    if (userId) filter.user = userId;

    const records = await BorrowRecord.find(filter)
      .populate("user", "hoTen email")
      .populate("book", "tenSach tacGia hinhAnh")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await BorrowRecord.countDocuments(filter);

    return res.json({
      success: true,
      data: records,
      total,
      page: Number(page),
      limit: Number(limit),
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
