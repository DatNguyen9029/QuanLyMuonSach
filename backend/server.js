/**
 * Happy Library - Main Server Entry Point
 * Stack: Node.js + Express + MongoDB + Socket.io + Passport (Google OAuth) + JWT
 */

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const { Server } = require("socket.io");
const config = require("./config");
const { seedAdminAccount } = require("./utils/seedAdmin.util");

// ─── Import Routes ───────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRoutes = require("./routes/borrow.routes");
const publisherRoutes = require("./routes/publisher.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");

// ─── Import Passport Strategy Config ─────────────────────────────────────────
require("./config/passport");

// ─── App & HTTP Server ────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.app.clientUrl,
    methods: ["GET", "POST"],
  },
});

// Gắn io vào app để dùng trong controllers (emit events)
app.set("io", io);

// ─── Socket.io Event Handlers ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // --- Chat: User/Admin nhắn tin ---
  // Frontend emit: socket.emit('sendMessage', { sender, message })
  socket.on("sendMessage", (data) => {
    const ChatMessage = require("./models/ChatMessage.model");
    const msg = new ChatMessage({
      sender: data.sender,
      message: data.message,
    });
    msg.save().then((saved) => {
      // Broadcast tới toàn bộ client (kể cả admin dashboard)
      io.emit("newMessage", saved);
    });
  });

  // --- Join room theo userId để nhận thông báo cá nhân ---
  socket.on("joinUserRoom", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket.io] User ${userId} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: config.app.clientUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/publishers", publisherRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", app: "Happy Library" }),
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal Server Error" });
});

// ─── Connect MongoDB & Start Server ──────────────────────────────────────────
const PORT = config.app.port;
const MONGO_URI = config.db.uri;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[MongoDB] Connected successfully");
    return seedAdminAccount();
  })
  .then(() => {
    console.log("[Seed] Admin sample account is ready: admin / admin@123");
    server.listen(PORT, () => {
      console.log(`[Server] Happy Library running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[MongoDB] Connection failed:", err.message);
    process.exit(1);
  });
