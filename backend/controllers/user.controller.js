const User = require("../models/User.model");
const { hashPassword } = require("../utils/password.util");

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

// [ADMIN] Tạo user mới
exports.create = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      hoTen,
      dienThoai,
      ngaySinh,
      phai,
      diaChi,
      role = "user",
    } = req.body;

    if (!username || !email || !password || !hoTen) {
      return res.status(400).json({
        success: false,
        message: "username, email, password và hoTen là bắt buộc.",
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Tên đăng nhập hoặc email đã tồn tại.",
      });
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      hoTen: hoTen.trim(),
      dienThoai,
      ngaySinh,
      phai,
      diaChi,
      role,
    });

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// [ADMIN] Cập nhật user bất kỳ
exports.update = async (req, res) => {
  try {
    const {
      username,
      email,
      hoTen,
      dienThoai,
      ngaySinh,
      phai,
      diaChi,
      role,
      password,
      isBlacklisted,
      blacklistReason,
    } = req.body;

    const updateData = {
      username: username?.trim().toLowerCase(),
      email: email?.trim().toLowerCase(),
      hoTen,
      dienThoai,
      ngaySinh,
      phai,
      diaChi,
      role,
    };

    if (password) {
      updateData.passwordHash = hashPassword(password);
    }

    if (isBlacklisted === true) {
      updateData.isBlacklisted = true;
      updateData.blacklistedAt = new Date();
      updateData.blacklistedBy = req.user?._id || null;
      updateData.blacklistReason = String(blacklistReason || "")
        .trim()
        .slice(0, 500);
    } else if (isBlacklisted === false) {
      updateData.isBlacklisted = false;
      updateData.blacklistedAt = null;
      updateData.blacklistedBy = null;
      updateData.blacklistReason = "";
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-googleId");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại." });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// [ADMIN] Xóa user
exports.delete = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại." });
    }

    return res.json({ success: true, message: "Đã xóa người dùng." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// [USER] Cập nhật thông tin bản thân
const mongoose = require("mongoose");

exports.updateProfile = async (req, res) => {
  try {
    // Safety check & debug
    console.log(
      "[updateProfile] req.user._id:",
      req.user?._id,
      "type:",
      typeof req.user?._id,
    );
    if (
      !req.user ||
      !req.user._id ||
      !mongoose.Types.ObjectId.isValid(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID. Please login again.",
      });
    }

    const { hoTen, ngaySinh, phai, diaChi, dienThoai } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { hoTen, ngaySinh, phai, diaChi, dienThoai },
      { new: true, runValidators: true },
    ).select("-googleId");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[updateProfile error]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
