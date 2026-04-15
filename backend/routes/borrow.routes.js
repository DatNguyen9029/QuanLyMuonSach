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

module.exports = borrowRouter;

// ─── routes/publisher.routes.js ──────────────────────────────────────────────
const publisherExpress = require("express");
const publisherRouter = publisherExpress.Router();
const pubCtrl = require("../controllers/publisher.controller");
const {
  protect: pProtect,
  adminOnly: pAdminOnly,
} = require("../middleware/auth.middleware");

publisherRouter.get("/", pubCtrl.getAll);
publisherRouter.post("/", pProtect, pAdminOnly, pubCtrl.create);
publisherRouter.put("/:id", pProtect, pAdminOnly, pubCtrl.update);
publisherRouter.delete("/:id", pProtect, pAdminOnly, pubCtrl.delete);

module.exports = publisherRouter;
