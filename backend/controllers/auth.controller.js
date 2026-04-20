/**
 * Auth Controller - Google OAuth & JWT (Happy Library)
 */

const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/User.model");
const { hashPassword, verifyPassword } = require("../utils/password.util");

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

exports.register = async (req, res) => {
  try {
    const { username, email, password, hoTen } = req.body;

    if (!username || !email || !password || !hoTen) {
      return res.status(400).json({
        success: false,
        message: "username, email, password và hoTen là bắt buộc.",
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Tên đăng nhập hoặc email đã tồn tại.",
      });
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      hoTen: hoTen.trim(),
      role: "user",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          hoTen: user.hoTen,
          role: user.role,
          avatar: user.avatar,
          isBlacklisted: user.isBlacklisted,
          blacklistReason: user.blacklistReason,
          blacklistedAt: user.blacklistedAt,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username?.trim().toLowerCase() || email?.trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Bạn cần cung cấp username hoặc email, cùng với password.",
      });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+passwordHash");

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: "Sai thông tin đăng nhập.",
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          hoTen: user.hoTen,
          role: user.role,
          avatar: user.avatar,
          isBlacklisted: user.isBlacklisted,
          blacklistReason: user.blacklistReason,
          blacklistedAt: user.blacklistedAt,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/google/callback - Callback sau khi Google OAuth thành công
// Passport đã xác thực xong → tạo JWT → redirect về VueJS SPA kèm token
// ─────────────────────────────────────────────────────────────────────────────
exports.googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user);
    // Redirect về Vue SPA với token trong query string
    // Frontend sẽ đọc và lưu vào localStorage/Pinia store
    const clientURL = config.app.clientUrl;
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

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/change-password - Đổi mật khẩu cho user đã đăng nhập
// ─────────────────────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Xác nhận mật khẩu mới không khớp.",
      });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại." });
    }

    // Tài khoản OAuth có thể chưa có mật khẩu local
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản này chưa có mật khẩu cục bộ để thay đổi.",
      });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng.",
      });
    }

    if (verifyPassword(newPassword, user.passwordHash)) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      });
    }

    user.passwordHash = hashPassword(newPassword);
    await user.save();

    return res.json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
