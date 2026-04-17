/**
 * Socket.io Setup - Happy Library
 * ────────────────────────────────
 * Khởi tạo Socket.io, xử lý authentication, và phân luồng room:
 *   - Admin  → tham gia room 'admin'
 *   - User   → tham gia room 'user_{userId}'
 *
 * CÁCH DÙNG trong app.js / server.js:
 *   const { initSocket, getIO } = require('./socket');
 *   const io = initSocket(httpServer);
 *   // Sau đó ở bất kỳ controller nào:
 *   const { getIO } = require('./socket');
 *   const io = getIO();
 *   io.to('admin').emit('notification:new', payload);
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User.model");
const ChatMessage = require("./models/ChatMessage.model");
const notifService = require("./services/notification.service");
const mongoose = require("mongoose");

let _io = null;

function normalizeMessage(message) {
  return {
    _id: message._id,
    content: message.message,
    senderId: message.sender?._id?.toString() || message.sender?.toString?.(),
    senderName: message.sender?.hoTen || "Người dùng",
    senderRole: message.sender?.role || null,
    receiverId:
      message.receiver?._id?.toString() ||
      message.receiver?.toString?.() ||
      null,
    receiverName: message.receiver?.hoTen || null,
    receiverRole: message.receiver?.role || null,
    createdAt: message.createdAt || message.timestamp,
    timestamp: message.timestamp || message.createdAt,
  };
}

async function getAdminUsers() {
  return User.find({ role: "admin" }).select("_id hoTen role").lean();
}

async function loadHistoryForSocket(socket, payload = {}) {
  const limitRaw = Number(payload.limit || 200);
  const limit = Math.min(Math.max(limitRaw, 1), 500);
  const currentUser = socket.user;
  const adminUsers = await getAdminUsers();
  const adminIds = adminUsers.map((admin) => admin._id);

  let filter;

  if (currentUser.role === "admin") {
    const readerId = payload.readerId;

    if (!readerId || !mongoose.Types.ObjectId.isValid(readerId)) {
      return [];
    }

    const reader = await User.findOne({
      _id: readerId,
      role: "user",
    })
      .select("_id")
      .lean();

    if (!reader) return [];

    filter = {
      $or: [
        { sender: reader._id, receiver: { $in: adminIds } },
        { sender: { $in: adminIds }, receiver: reader._id },
        { sender: reader._id, receiver: null }, // Dữ liệu cũ
      ],
    };
  } else {
    filter = {
      $or: [
        { sender: currentUser._id, receiver: { $in: adminIds } },
        { sender: { $in: adminIds }, receiver: currentUser._id },
        { sender: currentUser._id, receiver: null }, // Dữ liệu cũ
      ],
    };
  }

  const history = await ChatMessage.find(filter)
    .populate("sender", "hoTen avatar role")
    .populate("receiver", "hoTen avatar role")
    .sort({ createdAt: 1, timestamp: 1 })
    .limit(limit)
    .lean();

  return history.map(normalizeMessage);
}

/**
 * Khởi tạo Socket.io server (gọi 1 lần duy nhất khi start app)
 * @param {import('http').Server} httpServer
 * @param {Object} config - Config object với JWT secret
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer, config = {}) {
  const jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
  const clientUrl =
    config.clientUrl || process.env.CLIENT_URL || "http://localhost:5173";

  _io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Middleware xác thực JWT trước khi cho kết nối ──────────────────────────
  _io.use(async (socket, next) => {
    try {
      // Client gửi token qua auth: { token: '...' } khi connect
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select("_id role hoTen");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Gắn thông tin user vào socket để dùng ở events sau
      socket.user = {
        _id: user._id.toString(),
        role: user.role,
        name: user.hoTen || "User",
      };

      next();
    } catch (err) {
      next(new Error("Authentication error: " + err.message));
    }
  });

  // ── Xử lý kết nối ──────────────────────────────────────────────────────────
  _io.on("connection", (socket) => {
    const { _id: userId, role } = socket.user;

    // Phân luồng room theo role
    if (role === "admin") {
      // Admin vào room 'admin' ĐỂ nhận mọi thông báo từ user
      socket.join("admin");
      // Đồng thời vào room user riêng để nhận notification theo userId lưu trong DB
      socket.join(`user_${userId}`);
      console.log(`[Socket] Admin ${userId} joined room: admin`);
    } else {
      // User thường vào room riêng của họ
      socket.join(`user_${userId}`);
      console.log(`[Socket] User ${userId} joined room: user_${userId}`);
    }

    // ── Client thông báo đã đọc 1 notification (optional real-time sync) ──
    socket.on("notification:markRead", (notificationId) => {
      // Chỉ cần emit lại cho chính user đó nếu họ mở nhiều tab
      socket
        .to(`user_${userId}`)
        .emit("notification:markedRead", notificationId);
    });

    // ── Load lịch sử chat ────────────────────────────────────────────────────
    socket.on("chat:load", async (payload = {}) => {
      try {
        const history = await loadHistoryForSocket(socket, payload);
        socket.emit("chat_history", history);
      } catch {
        socket.emit("chat_error", {
          message: "Không thể tải lịch sử chat.",
        });
      }
    });

    // ── Gửi tin nhắn ─────────────────────────────────────────────────────────
    socket.on("send_message", async (payload = {}) => {
      try {
        const content = String(payload.content || "").trim();
        if (!content) return;

        let receiver = null;

        if (role === "admin") {
          const receiverId = payload.receiverId;
          if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return socket.emit("chat_error", {
              message: "Admin cần chọn độc giả trước khi gửi tin.",
            });
          }

          receiver = await User.findOne({
            _id: receiverId,
            role: "user",
          })
            .select("_id hoTen role")
            .lean();

          if (!receiver) {
            return socket.emit("chat_error", {
              message: "Độc giả không tồn tại hoặc không hợp lệ.",
            });
          }
        } else {
          // User chỉ được nhắn cho admin
          const requestedReceiverId = payload.receiverId;

          if (requestedReceiverId) {
            if (!mongoose.Types.ObjectId.isValid(requestedReceiverId)) {
              return socket.emit("chat_error", {
                message: "Người nhận không hợp lệ.",
              });
            }

            receiver = await User.findOne({
              _id: requestedReceiverId,
              role: "admin",
            })
              .select("_id hoTen role")
              .lean();
          }

          if (!receiver) {
            receiver = await User.findOne({ role: "admin" })
              .select("_id hoTen role")
              .lean();
          }

          if (!receiver) {
            return socket.emit("chat_error", {
              message: "Hiện chưa có admin trực để nhận tin nhắn.",
            });
          }
        }

        const created = await ChatMessage.create({
          sender: userId,
          receiver: receiver._id,
          message: content,
          timestamp: new Date(),
        });

        await created.populate([
          { path: "sender", select: "hoTen avatar role" },
          { path: "receiver", select: "hoTen avatar role" },
        ]);

        const outMessage = normalizeMessage(created.toObject());

        if (role === "admin") {
          _io
            .to(`user_${receiver._id.toString()}`)
            .emit("new_message", outMessage);
          _io.to("admin").emit("new_message", outMessage);

          await notifService.createAndEmit(_io, {
            userId: receiver._id,
            title: "Tin nhắn hỗ trợ",
            message: `${socket.user.name}: ${content}`,
            type: "chat_new",
            relatedId: created._id,
            relatedType: "chat",
          });
        } else {
          _io.to("admin").emit("new_message", outMessage);
          _io.to(`user_${userId}`).emit("new_message", outMessage);

          const admins = await getAdminUsers();
          await Promise.allSettled(
            admins.map((admin) =>
              notifService.createAndEmit(_io, {
                userId: admin._id,
                title: "Tin nhắn mới từ độc giả",
                message: `${socket.user.name}: ${content}`,
                type: "chat_new",
                relatedId: created._id,
                relatedType: "chat",
              }),
            ),
          );
        }
      } catch {
        socket.emit("chat_error", { message: "Không thể gửi tin nhắn." });
      }
    });

    // ── Typing indicator ─────────────────────────────────────────────────────
    socket.on("typing", async (payload = {}) => {
      try {
        if (role === "admin") {
          const receiverId = payload.receiverId;
          if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId))
            return;

          const reader = await User.findOne({
            _id: receiverId,
            role: "user",
          })
            .select("_id")
            .lean();

          if (!reader) return;

          _io.to(`user_${reader._id.toString()}`).emit("typing", {
            senderId: userId,
            senderRole: "admin",
            receiverId: reader._id.toString(),
          });

          return;
        }

        // User chỉ emit typing cho room admin
        _io.to("admin").emit("typing", {
          senderId: userId,
          senderRole: "user",
          readerId: userId,
        });
      } catch {
        // Ignore typing errors silently
      }
    });

    // User khi vào hệ thống thì tự load lịch sử với admin
    if (role === "user") {
      loadHistoryForSocket(socket)
        .then((history) => socket.emit("chat_history", history))
        .catch(() => {});
    }

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User ${userId} disconnected: ${reason}`);
    });
  });

  console.log("[Socket.io] Server initialized");
  return _io;
}

/**
 * Lấy io instance từ bất kỳ đâu trong ứng dụng
 * @returns {import('socket.io').Server}
 */
function getIO() {
  if (!_io) {
    throw new Error(
      "Socket.io has not been initialized. Call initSocket() first.",
    );
  }
  return _io;
}

module.exports = { initSocket, getIO };
