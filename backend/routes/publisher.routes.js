const express = require("express");
const router = express.Router();
const pubCtrl = require("../controllers/publisher.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/", pubCtrl.getAll);
router.post("/", protect, adminOnly, pubCtrl.create);
router.put("/:id", protect, adminOnly, pubCtrl.update);
router.delete("/:id", protect, adminOnly, pubCtrl.delete);

module.exports = router;
