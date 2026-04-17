const ChatMessage = require("../models/ChatMessage.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");

async function getAdminIds() {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  return admins.map((admin) => admin._id);
}

function extractId(userLike) {
  if (!userLike) return null;
  if (typeof userLike === "string") return userLike;
  if (userLike instanceof mongoose.Types.ObjectId) return userLike.toString();
  if (typeof userLike === "object" && userLike._id) {
    return userLike._id.toString();
  }
  return null;
}

function extractRole(userLike) {
  if (!userLike || typeof userLike !== "object") return null;
  return userLike.role || null;
}

function toMessageDTO(message) {
  const senderId = extractId(message.sender);
  const receiverId = extractId(message.receiver);

  return {
    _id: message._id,
    content: message.message,
    senderId,
    senderName: message.sender?.hoTen || "Người dùng",
    senderRole: extractRole(message.sender),
    receiverId,
    receiverName: message.receiver?.hoTen || null,
    receiverRole: extractRole(message.receiver),
    createdAt: message.createdAt || message.timestamp,
    timestamp: message.timestamp || message.createdAt,
  };
}

// GET /api/chat/history
// - User: lịch sử giữa user hiện tại và admin
// - Admin: truyền query readerId để lấy hội thoại theo từng độc giả
exports.getHistory = async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit || 200);
    const limit = Math.min(Math.max(limitRaw, 1), 500);
    const adminIds = await getAdminIds();

    let filter = {};

    if (req.user.role === "admin") {
      const { readerId } = req.query;

      if (readerId) {
        if (!mongoose.Types.ObjectId.isValid(readerId)) {
          return res.status(400).json({
            success: false,
            message: "readerId không hợp lệ.",
          });
        }

        const reader = await User.findOne({
          _id: readerId,
          role: "user",
        })
          .select("_id")
          .lean();

        if (!reader) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy độc giả.",
          });
        }

        filter = {
          $or: [
            { sender: reader._id, receiver: { $in: adminIds } },
            { sender: { $in: adminIds }, receiver: reader._id },
            // Backward compatibility cho bản ghi cũ chưa có receiver
            { sender: reader._id, receiver: null },
          ],
        };
      }
    } else {
      const userId = req.user._id;
      filter = {
        $or: [
          { sender: userId, receiver: { $in: adminIds } },
          { sender: { $in: adminIds }, receiver: userId },
          // Backward compatibility cho bản ghi cũ chưa có receiver
          { sender: userId, receiver: null },
        ],
      };
    }

    const messages = await ChatMessage.find(filter)
      .populate("sender", "hoTen avatar role")
      .populate("receiver", "hoTen avatar role")
      .sort({ createdAt: 1, timestamp: 1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: messages.map(toMessageDTO),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/chat/conversations
// - Admin: lấy danh sách độc giả có hội thoại gần đây
exports.getConversations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập danh sách hội thoại.",
      });
    }

    const adminIds = await getAdminIds();

    const messages = await ChatMessage.find({
      $or: [
        { sender: { $in: adminIds } },
        { receiver: { $in: adminIds } },
        { receiver: null }, // Dữ liệu cũ
      ],
    })
      .populate("sender", "hoTen avatar role")
      .populate("receiver", "hoTen avatar role")
      .sort({ createdAt: -1, timestamp: -1 })
      .limit(500)
      .lean();

    const conversations = new Map();

    for (const message of messages) {
      const senderRole = extractRole(message.sender);
      const receiverRole = extractRole(message.receiver);

      let reader = null;

      if (senderRole === "user") {
        reader = message.sender;
      } else if (receiverRole === "user") {
        reader = message.receiver;
      }

      if (!reader) continue;

      const readerId = extractId(reader);
      if (!readerId || conversations.has(readerId)) continue;

      conversations.set(readerId, {
        reader: {
          _id: readerId,
          hoTen: reader.hoTen || "Độc giả",
          avatar: reader.avatar || null,
        },
        lastMessage: message.message,
        lastMessageAt: message.createdAt || message.timestamp,
      });
    }

    return res.json({
      success: true,
      data: Array.from(conversations.values()),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
