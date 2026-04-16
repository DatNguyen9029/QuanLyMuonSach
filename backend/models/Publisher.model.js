const mongoose = require("mongoose");

/**
 * Publisher (Nhà Xuất Bản) Schema
 */
const publisherSchema = new mongoose.Schema(
  {
    maNXB: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    tenNXB: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    diaChi: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Publisher", publisherSchema);
