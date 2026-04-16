/**
 * Cấu hình tĩnh cho toàn bộ backend.
 * Sử dụng .env cho các biến nhạy cảm, fallback về giá trị mặc định.
 */

require("dotenv").config();

const config = {
  app: {
    port: process.env.PORT || 3000,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  },
  db: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/happy_library",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "happy_library_dev_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  google: {
    // Bật Google OAuth bằng cách set GOOGLE_ENABLED=true trong .env
    // và điền GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET vào .env
    enabled: process.env.GOOGLE_ENABLED === "true" || false,
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/google/callback",
  },
};

module.exports = config;
