/**
 * Notification Controller - Happy Library
 * Quản lý thông báo cá nhân của user (CRUD + stats)
 */

const Notification = require("../models/Notification.model");

// ─────────────────────────────────────────────────────────────────────────────
// [USER/ADMIN] GET /api/notifications - Lấy danh sách thông báo (phân trang)
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, read = null } = req.query; // read: null=all, true=read, false=unread

    const filter = { user: userId };
    if (read !== null) filter.read = read === "true";

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false,
    });

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: { unreadCount },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [USER/ADMIN] GET /api/notifications/unread-count - Số thông báo chưa đọc
// ─────────────────────────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [USER/ADMIN] PATCH /api/notifications/:id/read - Đánh dấu đọc 1 thông báo
// ─────────────────────────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Thông báo không tồn tại hoặc không thuộc về bạn.",
      });
    }

    return res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [USER/ADMIN] PATCH /api/notifications/read-all - Đánh dấu đọc tất cả
// ─────────────────────────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true },
    );

    return res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} thông báo đã được đánh dấu đọc.`,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ADMIN ONLY] DELETE /api/notifications/:id - Xóa thông báo (admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ admin mới có quyền xóa.",
    });
  }

  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Đã xóa thông báo.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
