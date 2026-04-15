const ChatMessage = require("../models/ChatMessage.model");

// GET /api/chat/history - Lấy lịch sử chat (Admin xem all, User xem của mình)
exports.getHistory = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { sender: req.user._id };
    const messages = await ChatMessage.find(filter)
      .populate("sender", "hoTen avatar role")
      .sort({ timestamp: 1 })
      .limit(100);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
