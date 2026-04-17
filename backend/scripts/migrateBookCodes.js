require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config");
const Book = require("../models/Book.model");
const { generateNextBookCode } = require("../utils/book.util");

async function migrateBookCodes() {
  await mongoose.connect(config.db.uri);
  console.log("[Migration] Connected MongoDB");

  const booksWithoutCode = await Book.find({
    $or: [{ maSach: { $exists: false } }, { maSach: "" }, { maSach: null }],
  })
    .select("_id tenSach")
    .sort({ createdAt: 1, _id: 1 });

  if (!booksWithoutCode.length) {
    console.log("[Migration] No book needs maSach backfill");
    return;
  }

  for (const book of booksWithoutCode) {
    const maSach = await generateNextBookCode();
    await Book.findByIdAndUpdate(book._id, { maSach });
    console.log(`[Migration] ${book.tenSach || book._id} -> ${maSach}`);
  }

  console.log(`[Migration] Done. Updated ${booksWithoutCode.length} books.`);
}

migrateBookCodes()
  .catch((error) => {
    console.error("[Migration] Failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log("[Migration] MongoDB connection closed");
  });
