/**
 * Tất cả các file chỉ cần require('../config') thay vì dùng process.env rải rác
 */

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
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
  },
};

module.exports = config;
