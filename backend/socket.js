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

let _io = null;

/**
 * Khởi tạo Socket.io server (gọi 1 lần duy nhất khi start app)
 * @param {import('http').Server} httpServer
 * @param {Object} config - Config object với JWT secret
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer, config = {}) {
  const jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
  const clientUrl = config.clientUrl || process.env.CLIENT_URL || "http://localhost:5173";

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
