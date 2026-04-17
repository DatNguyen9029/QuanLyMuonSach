// backend/server.js
const http = require("http");
const mongoose = require("mongoose");
const config = require("./config");
const app = require("./app"); // Nhập app đã cấu hình từ app.js
const { seedAdminAccount } = require("./utils/seedAdmin.util");
const { initSocket } = require("./socket"); // Import socket module mới

// ─── App & HTTP Server ────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = initSocket(server, {
  jwtSecret: config.jwt?.secret || process.env.JWT_SECRET,
  clientUrl: config.app.clientUrl,
});

app.set("io", io); // Gắn io vào app để dùng trong controllers (backward compatible)

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
