const express = require("express");
const router = express.Router();
const chatCtrl = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/history", protect, chatCtrl.getHistory);
router.get("/conversations", protect, chatCtrl.getConversations);

module.exports = router;
