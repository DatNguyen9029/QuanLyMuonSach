/**
 * Notification Controller - Happy Library
 * Quản lý thông báo cá nhân của user (CRUD + stats)
 */

const mongoose = require("mongoose");
const Notification = require("../models/Notification.model");
const User = require("../models/User.model");

const MAX_LIMIT = 50;

function parseLimit(rawLimit) {
  const limit = Number(rawLimit) || 10;
  return Math.min(MAX_LIMIT, Math.max(1, limit));
}

function encodeCursor(notification) {
  if (!notification?.createdAt || !notification?._id) return null;
  return `${new Date(notification.createdAt).getTime()}_${String(notification._id)}`;
}

function decodeCursor(rawCursor) {
  if (!rawCursor || typeof rawCursor !== "string") return null;
  const [ts, id] = rawCursor.split("_");
  const timeMs = Number(ts);
  if (!Number.isFinite(timeMs) || !id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return { createdAt: new Date(timeMs), _id: new mongoose.Types.ObjectId(id) };
}

async function getCachedUnreadCount(userId) {
  const user = await User.findById(userId).select("unreadNotificationCount");
  if (!user) return 0;
  if (
    user.unreadNotificationCount === undefined ||
    user.unreadNotificationCount === null
  ) {
    const recount = await Notification.countDocuments({ user: userId, read: false });
    await User.findByIdAndUpdate(userId, { unreadNotificationCount: recount });
    return recount;
  }

  const cached = Number(user.unreadNotificationCount || 0);

  if (Number.isFinite(cached) && cached >= 0) {
    return cached;
  }

  const recount = await Notification.countDocuments({ user: userId, read: false });
  await User.findByIdAndUpdate(userId, { unreadNotificationCount: recount });
  return recount;
}

// ─────────────────────────────────────────────────────────────────────────────
// [USER/ADMIN] GET /api/notifications - Lấy danh sách thông báo (phân trang)
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { read = null, cursor = null, page = 1 } = req.query;
    const limit = parseLimit(req.query.limit); // read: null=all, true=read, false=unread

    const filter = { user: userId };
    if (read !== null) filter.read = read === "true";

    const decodedCursor = decodeCursor(cursor);
    if (cursor && !decodedCursor) {
      return res.status(400).json({
        success: false,
        message: "Cursor không hợp lệ.",
      });
    }

    if (decodedCursor) {
      filter.$or = [
        { createdAt: { $lt: decodedCursor.createdAt } },
        {
          createdAt: decodedCursor.createdAt,
          _id: { $lt: decodedCursor._id },
        },
      ];
    }

    const docs = await Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const notifications = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore
      ? encodeCursor(notifications[notifications.length - 1])
      : null;
    const unreadCount = await getCachedUnreadCount(userId);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit,
        total: null,
        totalPages: null,
        hasMore,
        nextCursor,
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
    const count = await getCachedUnreadCount(userId);

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

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Thông báo không tồn tại hoặc không thuộc về bạn.",
      });
    }

    if (!notification.read) {
      notification.read = true;
      await notification.save();

      await User.findByIdAndUpdate(userId, {
        $inc: { unreadNotificationCount: -1 },
      });
      await User.updateOne(
        { _id: userId, unreadNotificationCount: { $lt: 0 } },
        { unreadNotificationCount: 0 },
      );
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

    await User.findByIdAndUpdate(userId, { unreadNotificationCount: 0 });

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
    const existing = await Notification.findById(id).lean();
    if (existing) {
      await Notification.findByIdAndDelete(id);
      if (!existing.read && existing.user) {
        await User.findByIdAndUpdate(existing.user, {
          $inc: { unreadNotificationCount: -1 },
        });
        await User.updateOne(
          { _id: existing.user, unreadNotificationCount: { $lt: 0 } },
          { unreadNotificationCount: 0 },
        );
      }
    }

    return res.json({
      success: true,
      message: "Đã xóa thông báo.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
