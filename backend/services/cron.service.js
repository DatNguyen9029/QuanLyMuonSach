/**
 * Cron Service - Happy Library
 * ─────────────────────────────
 * Chạy background job mỗi ngày lúc 08:00 AM (timezone VN: Asia/Ho_Chi_Minh).
 * Quét BorrowRecord đang ở trạng thái 'DangMuon' và:
 *   - Sắp đến hạn (còn <= 1 ngày): gửi thông báo WARNING
 *   - Đã quá hạn:                  gửi thông báo ERROR (overdue)
 *
 * CÀI ĐẶT: npm install node-cron
 *
 * CÁCH DÙNG trong server.js / app.js:
 *   const { startCronJobs } = require('./services/cron.service');
 *   startCronJobs(io); // truyền io instance vào
 */

const cron = require("node-cron");
const BorrowRecord = require("../models/BorrowRecord.model"); // Điều chỉnh path
const Notification = require("../models/Notification.model");
const notifService = require("./notification.service");
const NOTIFICATION_RETENTION_DAYS = 180;

/**
 * Khởi động tất cả cron jobs.
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
function startCronJobs(io) {
  // ── Cron expression: "0 8 * * *" = chạy lúc 08:00 mỗi ngày ──────────────
  // Để test nhanh, thay bằng "* * * * *" (mỗi phút) rồi đổi lại sau
  cron.schedule("0 8 * * *", () => checkDueDateReminders(io), {
    timezone: "Asia/Ho_Chi_Minh", // Quan trọng: đặt timezone VN
  });

  cron.schedule("20 3 * * *", cleanupOldNotifications, {
    timezone: "Asia/Ho_Chi_Minh",
  });

  console.log(
    "[Cron] Đã đăng ký job nhắc hạn trả sách — chạy lúc 08:00 AM (VN)",
  );
  console.log(
    `[Cron] Đã đăng ký job dọn thông báo cũ — chạy lúc 03:20 AM (VN), giữ ${NOTIFICATION_RETENTION_DAYS} ngày`,
  );
}

/**
 * Logic kiểm tra phiếu mượn sắp hết hạn và quá hạn.
 * @param {import('socket.io').Server} io
 */
async function checkDueDateReminders(io) {
  console.log(
    `[Cron] Bắt đầu kiểm tra hạn trả sách — ${new Date().toISOString()}`,
  );

  try {
    const now = new Date();

    // Lấy tất cả phiếu đang mượn, populate user và book để lấy tên
    const activeBorrows = await BorrowRecord.find({ trangThai: "DangMuon" })
      .populate("user", "_id name email")
      .populate("book", "tenSach");

    if (activeBorrows.length === 0) {
      console.log("[Cron] Không có phiếu mượn nào đang hoạt động.");
      return;
    }

    let remindedCount = 0;
    let overdueCount = 0;

    for (const borrow of activeBorrows) {
      // Bỏ qua nếu thiếu dữ liệu (phòng trường hợp populate lỗi)
      if (!borrow.user || !borrow.book) continue;

      const dueDate = new Date(borrow.ngayHenTra);
      const diffMs = dueDate - now;
      const diffDays = diffMs / (1000 * 60 * 60 * 24); // Số ngày còn lại (có thể âm)

      if (diffDays < 0) {
        // ── Đã QUÁ HẠN ────────────────────────────────────────────────────
        const overdueDays = Math.ceil(Math.abs(diffDays)); // Số ngày trễ

        await notifService.createAndEmit(io, {
          userId: borrow.user._id,
          title: "⚠️ Sách đã quá hạn trả",
          message: `Sách "${borrow.book.tenSach}" đã quá hạn ${overdueDays} ngày (hạn trả: ${formatDate(dueDate)}). Vui lòng trả sách ngay để tránh bị phạt.`,
          type: "error", // type 'error' → hiển thị màu đỏ trên frontend
          relatedId: borrow._id,
          relatedType: "borrow",
          data: {
            borrowId: borrow._id,
            bookTitle: borrow.book.tenSach,
            ngayHenTra: dueDate,
            overdueDays,
          },
        });

        overdueCount++;
      } else if (diffDays <= 1) {
        // ── SẮP ĐẾN HẠN (còn <= 1 ngày) ──────────────────────────────────
        await notifService.createAndEmit(io, {
          userId: borrow.user._id,
          title: "🔔 Sắp đến hạn trả sách",
          message: `Sách "${borrow.book.tenSach}" sẽ đến hạn trả vào ngày ${formatDate(dueDate)}. Vui lòng trả sách đúng hạn.`,
          type: "warning", // type 'warning' → hiển thị màu vàng trên frontend
          relatedId: borrow._id,
          relatedType: "borrow",
          data: {
            borrowId: borrow._id,
            bookTitle: borrow.book.tenSach,
            ngayHenTra: dueDate,
            hoursLeft: Math.ceil(diffMs / (1000 * 60 * 60)),
          },
        });

        remindedCount++;
      }
      // diffDays > 1: chưa đến hạn, không làm gì
    }

    console.log(
      `[Cron] Hoàn thành — Nhắc sắp hạn: ${remindedCount}, Quá hạn: ${overdueCount}`,
    );
  } catch (err) {
    console.error("[Cron] Lỗi khi chạy job nhắc hạn trả sách:", err);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────
function formatDate(date) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Chạy thủ công (dùng để test hoặc trigger từ admin panel)
 * Gọi: POST /api/admin/cron/run-due-check (nếu bạn muốn có route test)
 */
async function runDueDateCheckManually(io) {
  return checkDueDateReminders(io);
}

async function cleanupOldNotifications() {
  try {
    const threshold = new Date(
      Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const result = await Notification.deleteMany({
      createdAt: { $lt: threshold },
    });
    console.log(
      `[Cron] Dọn thông báo cũ hoàn tất — đã xóa ${result.deletedCount} bản ghi`,
    );
  } catch (err) {
    console.error("[Cron] Lỗi dọn thông báo cũ:", err);
  }
}

module.exports = {
  startCronJobs,
  runDueDateCheckManually,
  cleanupOldNotifications,
};
