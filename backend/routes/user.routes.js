const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/", protect, adminOnly, userCtrl.getAll);
router.put("/profile", protect, userCtrl.updateProfile);

module.exports = router;
