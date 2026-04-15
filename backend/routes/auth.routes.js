// routes/auth.routes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

// Bước 1: Redirect tới Google để xác thực
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Bước 2: Google callback → tạo JWT → redirect về Vue SPA
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  authCtrl.googleCallback,
);

// Lấy thông tin user đang đăng nhập
router.get("/me", protect, authCtrl.getMe);

module.exports = router;
