const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");

const hasActiveSubscription = (user) => {
  if (!user.subscriptionEndAt) return false;
  const isExpired = user.subscriptionEndAt < new Date();
  return !isExpired && ["active", "trial"].includes(user.subscriptionStatus);
};

const enforceAccess = (req, res) => {
  if (!req.user.isApproved) {
    res.status(403).json({ message: "Account is not approved by admin yet" });
    return false;
  }
  if (!hasActiveSubscription(req.user)) {
    res.status(403).json({ message: "Subscription inactive or expired. Please purchase a plan." });
    return false;
  }
  return true;
};

const getMyInventory = async (req, res) => {
  try {
    if (!enforceAccess(req, res)) return;
    const items = await Inventory.find({ user: req.user._id }).sort({ updatedAt: -1 });
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

const getMyInventorySummary = async (req, res) => {
  try {
    if (!enforceAccess(req, res)) return;
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const [summary] = await Inventory.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          activeItems: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalQuantity: { $sum: "$quantity" },
          estimatedMonthlyRent: { $sum: { $multiply: ["$quantity", "$rentPerUnit"] } }
        }
      }
    ]);

    return res.json({
      summary: {
        totalItems: summary?.totalItems || 0,
        activeItems: summary?.activeItems || 0,
        totalQuantity: summary?.totalQuantity || 0,
        estimatedMonthlyRent: summary?.estimatedMonthlyRent || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch inventory summary" });
  }
};

const createInventoryItem = async (req, res) => {
  if (!enforceAccess(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const item = await Inventory.create({
      user: req.user._id,
      itemName: req.body.itemName,
      category: req.body.category,
      quantity: Number(req.body.quantity),
      unit: req.body.unit,
      storageLocation: req.body.storageLocation,
      temperatureZone: req.body.temperatureZone,
      rentPerUnit: Number(req.body.rentPerUnit),
      status: req.body.status || "active"
    });

    return res.status(201).json({ message: "Inventory item created", item });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create inventory item" });
  }
};

const updateInventoryItem = async (req, res) => {
  if (!enforceAccess(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const item = await Inventory.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const updatableFields = [
      "itemName",
      "category",
      "quantity",
      "unit",
      "storageLocation",
      "temperatureZone",
      "rentPerUnit",
      "status"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = field === "quantity" || field === "rentPerUnit" ? Number(req.body[field]) : req.body[field];
      }
    });

    await item.save();
    return res.json({ message: "Inventory item updated", item });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update inventory item" });
  }
};

const getAdminInventorySummary = async (req, res) => {
  try {
    const [summary] = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          activeItems: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalQuantity: { $sum: "$quantity" },
          projectedMonthlyRent: { $sum: { $multiply: ["$quantity", "$rentPerUnit"] } }
        }
      }
    ]);

    return res.json({
      summary: {
        totalItems: summary?.totalItems || 0,
        activeItems: summary?.activeItems || 0,
        totalQuantity: summary?.totalQuantity || 0,
        projectedMonthlyRent: summary?.projectedMonthlyRent || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admin inventory summary" });
  }
};

module.exports = {
  getMyInventory,
  getMyInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  getAdminInventorySummary
};
