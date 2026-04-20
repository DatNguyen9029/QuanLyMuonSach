/**
 * Notification Model - Happy Library
 * Lưu trữ thông báo real-time + lịch sử cho user
 * Types: 'borrow_update', 'chat_new', 'overdue_warning', 'system'
 */

const mongoose = require("mongoose");
const NOTIFICATION_TTL_DAYS = 180;

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: [
        "info",
        "success",
        "warning",
        "error",
        "borrow_update",
        "chat_new",
      ],
      default: "info",
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // borrowId, chatMessageId
      sparse: true, // Cho phép null values
    },
    relatedType: {
      type: String, // 'borrow', 'chat'
      enum: ["borrow", "chat"],
      sparse: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: {
      // Metadata linh hoạt
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: () =>
        new Date(
          Date.now() + NOTIFICATION_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      index: true,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
