const crypto = require("crypto");

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, KEY_LENGTH)
    .toString("hex");

  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash || !passwordHash.includes(":")) return false;

  const [salt, storedKey] = passwordHash.split(":");
  const derivedKey = crypto
    .scryptSync(password, salt, KEY_LENGTH)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(derivedKey, "hex"),
    Buffer.from(storedKey, "hex"),
  );
}

module.exports = {
  hashPassword,
  verifyPassword,
};
