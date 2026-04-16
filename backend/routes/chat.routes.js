const express = require("express");
const router = express.Router();
const chatCtrl = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/history", protect, chatCtrl.getHistory);

module.exports = router;
