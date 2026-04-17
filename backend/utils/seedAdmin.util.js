const User = require("../models/User.model");
const { hashPassword } = require("./password.util");

async function seedAdminAccount() {
  const adminPayload = {
    username: "admin",
    email: "admin@123",
    hoTen: "Administrator",
    role: "admin",
    passwordHash: hashPassword("admin@123"),
  };

  await User.findOneAndUpdate(
    { username: adminPayload.username },
    adminPayload,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

module.exports = {
  seedAdminAccount,
};
