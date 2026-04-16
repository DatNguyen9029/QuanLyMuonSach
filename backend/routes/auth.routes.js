// routes/auth.routes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { isGoogleAuthEnabled } = require("../config/passport");

const requireGoogleAuth = (req, res, next) => {
  if (isGoogleAuthEnabled) return next();
  return res.status(503).json({
    success: false,
    message:
      "Google OAuth hiện chưa được cấu hình trong backend/config/index.js.",
  });
};

router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);

// Bước 1: Redirect tới Google để xác thực
router.get(
  "/google",
  requireGoogleAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Bước 2: Google callback → tạo JWT → redirect về Vue SPA
router.get(
  "/google/callback",
  requireGoogleAuth,
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  authCtrl.googleCallback,
);

// Lấy thông tin user đang đăng nhập
router.get("/me", protect, authCtrl.getMe);

module.exports = router;
