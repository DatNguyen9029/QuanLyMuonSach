const express = require("express");
const router = express.Router();
const pubCtrl = require("../controllers/publisher.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.use(protect, adminOnly);

router.get("/", pubCtrl.getAll);
router.get("/:id", pubCtrl.getById);
router.post("/", pubCtrl.create);
router.put("/:id", pubCtrl.update);
router.delete("/:id", pubCtrl.delete);

module.exports = router;
