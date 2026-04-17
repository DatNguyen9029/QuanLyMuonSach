/**
 * Notification Service - Happy Library
 * ─────────────────────────────────────
 * Service trung tâm để tạo notification trong DB và emit Socket.io.
 * Tất cả controller (borrow, cron...) đều gọi qua service này thay vì
 * tự tạo Notification riêng — đảm bảo nhất quán và không miss event.
 *
 * CÁCH DÙNG:
 *   const notifService = require('./notification.service');
 *   await notifService.createAndEmit(io, { user, title, message, type, ... });
 */

const Notification = require("../models/Notification.model");

/**
 * Tạo một notification record trong DB và emit Socket.io đến đúng đối tượng.
 *
 * @param {import('socket.io').Server} io - Socket.io server instance
 * @param {Object} payload
 * @param {string|ObjectId} payload.userId     - ID của user nhận thông báo
 * @param {string}          payload.title      - Tiêu đề thông báo
 * @param {string}          payload.message    - Nội dung thông báo
 * @param {string}          payload.type       - Loại: 'info'|'success'|'warning'|'error'|'borrow_update'|'chat_new'
 * @param {string|ObjectId} [payload.relatedId]   - ID tài liệu liên quan (borrowId, chatId...)
 * @param {string}          [payload.relatedType] - 'borrow' | 'chat'
 * @param {Object}          [payload.data]        - Metadata tuỳ chọn
 * @param {string}          [payload.targetRoom]  - Nếu truyền vào sẽ emit đến room này thay vì tự tính
 * @returns {Promise<import('../models/Notification.model').default>}
 */
async function createAndEmit(io, payload) {
  const {
    userId,
    title,
    message,
    type = "info",
    relatedId,
    relatedType,
    data = {},
    targetRoom, // override room nếu cần (ví dụ emit tới 'admin')
  } = payload;

  // 1. Tạo record trong MongoDB
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    ...(relatedId && { relatedId }),
    ...(relatedType && { relatedType }),
    data,
  });

  // 2. Xác định room để emit
  //    - Nếu targetRoom được truyền vào (ví dụ 'admin') → dùng luôn
  //    - Ngược lại → emit đến room riêng của user: `user_${userId}`
  const room = targetRoom || `user_${userId}`;

  // 3. Emit Socket.io nếu io được cấp (tránh lỗi khi test không có socket)
  if (io) {
    io.to(room).emit("notification:new", {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}

/**
 * Helper: emit đến admin room (khi user thực hiện hành động cần báo admin)
 * Tạo notification với userId = adminPlaceholderId (nếu cần lưu cho admin)
 * hoặc chỉ emit không lưu (tuỳ nghiệp vụ).
 *
 * Trong Happy Library, admin nhận thông báo qua room 'admin' nhưng
 * Notification record vẫn được lưu để admin xem lại lịch sử.
 *
 * @param {import('socket.io').Server} io
 * @param {Object} payload - Giống createAndEmit nhưng không cần userId nếu chỉ emit
 */
async function notifyAdmin(io, payload) {
  return createAndEmit(io, {
    ...payload,
    targetRoom: "admin",
  });
}

module.exports = { createAndEmit, notifyAdmin };
