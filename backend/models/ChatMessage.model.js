const mongoose = require("mongoose");

/**
 * ChatMessage Schema - Lưu lịch sử chat giữa User và Admin
 */
const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
