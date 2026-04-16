// backend/server.js
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const config = require("./config");
const app = require("./app"); // Nhập app đã cấu hình từ app.js
const { seedAdminAccount } = require("./utils/seedAdmin.util");

// ─── App & HTTP Server ────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.app.clientUrl,
    methods: ["GET", "POST"],
  },
});

app.set("io", io); // Gắn io vào app để dùng trong controllers

// ─── Socket.io Logic (Giữ nguyên 100% logic của bạn) ──────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // --- Chat: User/Admin nhắn tin ---
  socket.on("sendMessage", async (data) => {
    const ChatMessage = require("./models/ChatMessage.model");
    const Notification = require("./models/Notification.model");
    const msg = new ChatMessage({ sender: data.sender, message: data.message });
    const saved = await msg.save();
    io.emit("newMessage", saved);

    if (data.recipientUserId) {
      const userNotif = new Notification({
        user: data.recipientUserId,
        title: "Tin nhắn mới",
        message: `${data.senderName || "Admin"}: "${data.message.slice(0, 50)}..."`,
        type: "chat_new",
        relatedId: saved._id,
        relatedType: "chat",
        data: { senderId: data.sender },
      });
      await userNotif.save();
      io.to(`user_${data.recipientUserId}`).emit("newNotification", userNotif);
    } else {
      const adminNotif = new Notification({
        title: "Tin nhắn mới",
        message: `Người dùng ${data.sender} gửi: "${data.message.slice(0, 50)}..."`,
        type: "chat_new",
        relatedId: saved._id,
        relatedType: "chat",
        data: { senderId: data.sender },
      });
      await adminNotif.save();
      io.emit("adminNotification", adminNotif);
    }
  });

  socket.on("joinUserRoom", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket.io] User ${userId} joined room user_${userId}`);
  });

  socket.on("markNotificationRead", async (notificationId) => {
    try {
      const Notification = require("./models/Notification.model");
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true },
      );
      if (notification)
        socket.emit("notificationRead", { id: notification._id });
    } catch (err) {
      console.error("[Socket] Mark notification read error:", err.message);
    }
  });

  socket.on("markAllNotificationsRead", async (userId) => {
    try {
      const Notification = require("./models/Notification.model");
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true },
      );
      socket.emit("allNotificationsRead", {
        modifiedCount: result.modifiedCount,
      });
    } catch (err) {
      console.error("[Socket] Mark all notifications read error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ─── Connect MongoDB & Start Server ──────────────────────────────────────────
const PORT = config.app.port || 3000;
const MONGO_URI = config.db.uri;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[MongoDB] Connected successfully");
    return seedAdminAccount();
  })
  .then(() => {
    console.log("[Seed] Admin sample account is ready");
    server.listen(PORT, () => {
      console.log(`[Server] Happy Library running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[MongoDB] Connection failed:", err.message);
    process.exit(1);
  });
