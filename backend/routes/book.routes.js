const express = require("express");
const router = express.Router();
const bookCtrl = require("../controllers/book.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/", bookCtrl.getBooks); // Public - có filter ?q=
router.get("/:id", bookCtrl.getBookById); // Public
router.post("/", protect, adminOnly, bookCtrl.createBook); // Admin only
router.put("/:id", protect, adminOnly, bookCtrl.updateBook); // Admin only
router.delete("/:id", protect, adminOnly, bookCtrl.deleteBook); // Admin only

module.exports = router;
