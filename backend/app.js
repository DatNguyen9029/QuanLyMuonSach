const express = require("express");
const cors = require("cors");

const app = express();

// ─── Import Routes ───────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRoutes = require("./routes/borrow.routes");
const publisherRoutes = require("./routes/publisher.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const notificationRoutes = require("./routes/notification.routes"); // NEW: Notification routes

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/publishers", publisherRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;
