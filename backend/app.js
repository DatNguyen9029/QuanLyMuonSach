// backend/app.js
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const config = require("./config");

// Import Passport Strategy Config
require("./config/passport"); //

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: config.app.clientUrl })); // Dùng cấu hình chuẩn của bạn
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //
app.use(passport.initialize());

// ─── Import Routes ───────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRoutes = require("./routes/borrow.routes");
const publisherRoutes = require("./routes/publisher.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const notificationRoutes = require("./routes/notification.routes"); // Đảm bảo có cả route này

// ─── API Routes ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Backend is running!"));
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", app: "Happy Library" }),
); //

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/publishers", publisherRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
//eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
