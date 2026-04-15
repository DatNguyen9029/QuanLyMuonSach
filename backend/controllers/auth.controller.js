/**
 * Auth Controller - Google OAuth & JWT (Happy Library)
 */

const jwt = require("jsonwebtoken");

/**
 * Hàm tạo JWT token cho user
 * @param {Object} user - Mongoose User document
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/google/callback - Callback sau khi Google OAuth thành công
// Passport đã xác thực xong → tạo JWT → redirect về VueJS SPA kèm token
// ─────────────────────────────────────────────────────────────────────────────
exports.googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user);
    // Redirect về Vue SPA với token trong query string
    // Frontend sẽ đọc và lưu vào localStorage/Pinia store
    const clientURL = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientURL}/auth/callback?token=${token}`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me - Lấy thông tin user hiện tại từ JWT
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = (req, res) => {
  res.json({ success: true, data: req.user });
};
