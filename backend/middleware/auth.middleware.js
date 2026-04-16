/**
 * Middleware xác thực JWT
 * Gắn req.user nếu token hợp lệ
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const config = require("../config");

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Bạn chưa đăng nhập." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.id).select("-googleId -passwordHash");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Tài khoản không tồn tại." });
    }

    req.user = user;
    next();
    //eslint-disable-next-line no-unused-vars
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

// Middleware kiểm tra role Admin
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({
    success: false,
    message: "Chỉ Admin mới có quyền thực hiện thao tác này.",
  });
};
