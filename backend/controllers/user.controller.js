const User = require("../models/User.model");

// [ADMIN] Lấy danh sách users
exports.getAll = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter)
      .select("-googleId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [USER] Cập nhật thông tin bản thân
exports.updateProfile = async (req, res) => {
  try {
    const { hoTen, ngaySinh, phai, diaChi, dienThoai } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { hoTen, ngaySinh, phai, diaChi, dienThoai },
      { new: true, runValidators: true },
    ).select("-googleId");
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
