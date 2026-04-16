const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/", protect, adminOnly, userCtrl.getAll);
router.post("/", protect, adminOnly, userCtrl.create);
router.put("/:id", protect, adminOnly, userCtrl.update);
router.delete("/:id", protect, adminOnly, userCtrl.delete);
router.put("/profile", protect, userCtrl.updateProfile);

module.exports = router;
