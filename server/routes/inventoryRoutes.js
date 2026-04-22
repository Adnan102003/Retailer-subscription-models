const express = require("express");
const { body } = require("express-validator");
const { protect, adminProtect } = require("../middleware/authMiddleware");
const {
  getMyInventory,
  getMyInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  getAdminInventorySummary
} = require("../controllers/inventoryController");

const router = express.Router();

const inventoryValidation = [
  body("itemName").optional().isString().trim().isLength({ min: 2, max: 120 }),
  body("category").optional().isString().trim().isLength({ min: 2, max: 80 }),
  body("quantity").optional().isFloat({ min: 0 }),
  body("unit").optional().isString().trim().isLength({ min: 1, max: 20 }),
  body("storageLocation").optional().isString().trim().isLength({ min: 2, max: 120 }),
  body("temperatureZone").optional().isString().trim().isLength({ min: 2, max: 50 }),
  body("rentPerUnit").optional().isFloat({ min: 0 }),
  body("status").optional().isIn(["active", "released"])
];

router.get("/me", protect, getMyInventory);
router.get("/summary", protect, getMyInventorySummary);
router.post(
  "/",
  protect,
  [
    body("itemName").isString().trim().isLength({ min: 2, max: 120 }),
    body("quantity").isFloat({ min: 0 }),
    body("rentPerUnit").isFloat({ min: 0 }),
    ...inventoryValidation
  ],
  createInventoryItem
);
router.patch("/:id", protect, inventoryValidation, updateInventoryItem);

router.get("/admin/summary", adminProtect, getAdminInventorySummary);

module.exports = router;
