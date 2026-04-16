// ─── routes/borrow.routes.js ──────────────────────────────────────────────────
const express = require("express");
const borrowRouter = express.Router();
const borrowCtrl = require("../controllers/borrow.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

borrowRouter.get("/my", protect, borrowCtrl.getMyBorrows); // User: lịch sử của mình
borrowRouter.post("/", protect, borrowCtrl.createBorrowRequest); // User: tạo yêu cầu mượn
borrowRouter.get("/", protect, adminOnly, borrowCtrl.getAllBorrows); // Admin: xem tất cả
borrowRouter.get("/:id", protect, borrowCtrl.getBorrowDetail); // User/Admin: chi tiết
borrowRouter.patch(
  "/:id/status",
  protect,
  adminOnly,
  borrowCtrl.updateBorrowStatus,
); // Admin: đổi trạng thái
borrowRouter.patch("/:id/extend", protect, adminOnly, borrowCtrl.extendBorrow);

module.exports = borrowRouter;
