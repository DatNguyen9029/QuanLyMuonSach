const Publisher = require("../models/Publisher.model");
const Book = require("../models/Book.model");
const {
  generateNextPublisherCode,
  normalizePublisherPayload,
} = require("../utils/publisher.util");

async function getBookCountForPublisher(publisher) {
  return Book.countDocuments({
    $or: [
      { nxb: publisher._id },
      {
        $and: [
          { $or: [{ nxb: null }, { nxb: { $exists: false } }] },
          { tenNXB: publisher.tenNXB },
        ],
      },
    ],
  });
}

async function syncLegacyPublishers() {
  const legacyNames = await Book.distinct("tenNXB", {
    $and: [
      { tenNXB: { $exists: true, $nin: ["", null] } },
      { $or: [{ nxb: null }, { nxb: { $exists: false } }] },
    ],
  });

  for (const legacyName of legacyNames.map((name) => name.trim()).filter(Boolean)) {
    let publisher = await Publisher.findOne({
      tenNXB: { $regex: `^${legacyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (!publisher) {
      publisher = await Publisher.create({
        maNXB: await generateNextPublisherCode(),
        tenNXB: legacyName,
        diaChi: "",
      });
    }

    await Book.updateMany(
      {
        tenNXB: legacyName,
        $or: [{ nxb: null }, { nxb: { $exists: false } }],
      },
      { nxb: publisher._id, tenNXB: publisher.tenNXB },
    );
  }
}

exports.getAll = async (req, res) => {
  try {
    await syncLegacyPublishers();
    const publishers = await Publisher.find().sort({ maNXB: 1 }).lean();
    const enrichedPublishers = await Promise.all(
      publishers.map(async (publisher) => ({
        ...publisher,
        booksCount: await getBookCountForPublisher(publisher),
      })),
    );

    res.json({ success: true, data: enrichedPublishers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const publisher = await Publisher.findById(req.params.id).lean();
    if (!publisher) {
      return res
        .status(404)
        .json({ success: false, message: "NXB không tồn tại." });
    }

    return res.json({
      success: true,
      data: {
        ...publisher,
        booksCount: await getBookCountForPublisher(publisher),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const normalized = normalizePublisherPayload(req.body);
    if (!normalized.tenNXB) {
      return res.status(400).json({
        success: false,
        message: "Tên nhà xuất bản là bắt buộc.",
      });
    }

    const maNXB = normalized.maNXB || (await generateNextPublisherCode());

    const duplicated = await Publisher.findOne({
      $or: [{ maNXB }, { tenNXB: normalized.tenNXB }],
    });
    if (duplicated) {
      return res.status(409).json({
        success: false,
        message: "Mã NXB hoặc tên NXB đã tồn tại.",
      });
    }

    const pub = await Publisher.create({ ...normalized, maNXB });
    res.status(201).json({ success: true, data: pub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const normalized = normalizePublisherPayload(req.body);
    if (!normalized.tenNXB || !normalized.maNXB) {
      return res.status(400).json({
        success: false,
        message: "Mã NXB và tên NXB là bắt buộc.",
      });
    }

    const duplicated = await Publisher.findOne({
      _id: { $ne: req.params.id },
      $or: [{ maNXB: normalized.maNXB }, { tenNXB: normalized.tenNXB }],
    });
    if (duplicated) {
      return res.status(409).json({
        success: false,
        message: "Mã NXB hoặc tên NXB đã tồn tại.",
      });
    }

    const currentPublisher = await Publisher.findById(req.params.id);
    if (!currentPublisher) {
      return res
        .status(404)
        .json({ success: false, message: "NXB không tồn tại." });
    }

    const pub = await Publisher.findByIdAndUpdate(req.params.id, normalized, {
      new: true,
      runValidators: true,
    });
    if (!pub)
      return res
        .status(404)
        .json({ success: false, message: "NXB không tồn tại." });

    // Đồng bộ tên NXB fallback cho các sách legacy hoặc sách đang dùng cùng publisher.
    await Book.updateMany(
      {
        $or: [
          { nxb: pub._id },
          {
            $and: [
              { $or: [{ nxb: null }, { nxb: { $exists: false } }] },
              { tenNXB: currentPublisher.tenNXB },
            ],
          },
        ],
      },
      { tenNXB: pub.tenNXB, nxb: pub._id },
    );

    res.json({ success: true, data: pub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const publisher = await Publisher.findById(req.params.id);
    if (!publisher) {
      return res
        .status(404)
        .json({ success: false, message: "NXB không tồn tại." });
    }

    const booksCount = await getBookCountForPublisher(publisher);
    if (booksCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Không thể xóa NXB đang được sách sử dụng.",
      });
    }

    await Publisher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa NXB." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
