/**
 * Notification Routes - Happy Library
 * REST API + Socket integration cho thông báo
 */

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

// ─── PROTECTED ROUTES (req.user required) ────────────────────────────────────
router.use(authMiddleware.protect);

// GET /api/notifications - Danh sách thông báo user (phân trang)
router.get("/", notificationController.getUserNotifications);

// GET /api/notifications/unread-count - Số thông báo chưa đọc
router.get("/unread-count", notificationController.getUnreadCount);

// PATCH /api/notifications/:id/read - Đánh dấu đọc 1 thông báo
router.patch("/:id/read", notificationController.markAsRead);

// PATCH /api/notifications/read-all - Đánh dấu đọc tất cả
router.patch("/read-all", notificationController.markAllAsRead);

// ─── ADMIN ONLY ──────────────────────────────────────────────────────────────
router.use(authMiddleware.adminOnly);

// DELETE /api/notifications/:id - Admin xóa thông báo
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
