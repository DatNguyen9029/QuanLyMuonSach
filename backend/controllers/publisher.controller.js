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
  // 1. Lấy danh sách NXB chưa sync
  const legacyNamesRaw = await Book.distinct("tenNXB", {
    tenNXB: { $exists: true, $nin: ["", null] },
    $or: [{ nxb: null }, { nxb: { $exists: false } }],
  });

  const legacyNames = [
    ...new Set(legacyNamesRaw.map((n) => n?.trim()).filter(Boolean)),
  ];

  if (legacyNames.length === 0) return;

  console.log(`[Sync] ${legacyNames.length} NXB cần đồng bộ`);

  // 2. Escape regex an toàn
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 3. Tìm tất cả publisher đã tồn tại (1 query duy nhất)
  const regexQueries = legacyNames.map((name) => ({
    tenNXB: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  }));

  const existingPublishers = await Publisher.find({
    $or: regexQueries,
  }).lean();

  // Map để lookup nhanh (lowercase)
  const publisherMap = new Map(
    existingPublishers.map((p) => [p.tenNXB.toLowerCase(), p]),
  );

  const bulkInsertOps = [];
  const bulkUpdateBooksOps = [];

  for (const name of legacyNames) {
    const key = name.toLowerCase();
    let publisher = publisherMap.get(key);

    // 4. Nếu chưa tồn tại → chuẩn bị insert
    if (!publisher) {
      const nextCode = await generateNextPublisherCode();

      const newPublisher = {
        maNXB: nextCode,
        tenNXB: name,
        diaChi: "",
      };

      bulkInsertOps.push({
        insertOne: { document: newPublisher },
      });

      // Tạm thời push vào map để tránh duplicate trong cùng batch
      publisherMap.set(key, newPublisher);
    }
  }

  // 5. Insert hàng loạt (nếu có)
  if (bulkInsertOps.length > 0) {
    const insertResult = await Publisher.bulkWrite(bulkInsertOps);

    console.log(`[Sync] Đã tạo ${insertResult.insertedCount} NXB mới`);

    // Reload lại publisher để có _id
    const allPublishers = await Publisher.find({
      $or: regexQueries,
    }).lean();

    allPublishers.forEach((p) => {
      publisherMap.set(p.tenNXB.toLowerCase(), p);
    });
  }

  // 6. Chuẩn bị update Books (bulk)
  for (const name of legacyNames) {
    const publisher = publisherMap.get(name.toLowerCase());
    if (!publisher) continue;

    bulkUpdateBooksOps.push({
      updateMany: {
        filter: {
          tenNXB: name,
          $or: [{ nxb: null }, { nxb: { $exists: false } }],
        },
        update: {
          nxb: publisher._id,
          tenNXB: publisher.tenNXB,
        },
      },
    });
  }

  // 7. Update hàng loạt
  if (bulkUpdateBooksOps.length > 0) {
    const updateResult = await Book.bulkWrite(bulkUpdateBooksOps);

    console.log(`[Sync] Updated ${updateResult.modifiedCount} books`);
  }

  console.log("[Sync] Hoàn tất");
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
