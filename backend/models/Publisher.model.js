const mongoose = require("mongoose");

/**
 * Publisher (Nhà Xuất Bản) Schema
 */
const publisherSchema = new mongoose.Schema(
  {
    tenNXB: { type: String, required: true, trim: true },
    diaChi: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Publisher", publisherSchema);
