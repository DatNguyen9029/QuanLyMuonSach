const Publisher = require("../models/Publisher.model");

async function generateNextPublisherCode() {
  const publishers = await Publisher.find({ maNXB: /^NXB\d+$/ })
    .select("maNXB")
    .lean();

  const maxNumber = publishers.reduce((maxValue, publisher) => {
    const matched = publisher.maNXB?.match(/^NXB(\d+)$/);
    if (!matched) return maxValue;
    return Math.max(maxValue, Number(matched[1]));
  }, 0);

  return `NXB${String(maxNumber + 1).padStart(3, "0")}`;
}

function normalizePublisherPayload(payload = {}) {
  return {
    maNXB: payload.maNXB?.trim().toUpperCase() || "",
    tenNXB: payload.tenNXB?.trim() || "",
    diaChi: payload.diaChi?.trim() || "",
  };
}

module.exports = {
  generateNextPublisherCode,
  normalizePublisherPayload,
};
