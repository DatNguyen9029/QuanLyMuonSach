const Book = require("../models/Book.model");

async function generateNextBookCode() {
  const books = await Book.find({ maSach: /^A\d+$/ }).select("maSach").lean();

  const maxNumber = books.reduce((maxValue, book) => {
    const matched = book.maSach?.match(/^A(\d+)$/);
    if (!matched) return maxValue;
    return Math.max(maxValue, Number(matched[1]));
  }, 0);

  return `A${String(maxNumber + 1).padStart(3, "0")}`;
}

module.exports = {
  generateNextBookCode,
};
