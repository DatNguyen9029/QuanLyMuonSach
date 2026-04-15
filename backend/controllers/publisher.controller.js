const Publisher = require("../models/Publisher.model");

exports.getAll = async (req, res) => {
  try {
    const publishers = await Publisher.find().sort({ tenNXB: 1 });
    res.json({ success: true, data: publishers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const pub = await Publisher.create(req.body);
    res.status(201).json({ success: true, data: pub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const pub = await Publisher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!pub)
      return res
        .status(404)
        .json({ success: false, message: "NXB không tồn tại." });
    res.json({ success: true, data: pub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Publisher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa NXB." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
