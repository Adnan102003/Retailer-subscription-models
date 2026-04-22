const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemName: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, trim: true, maxlength: 80, default: "General" },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true, maxlength: 20, default: "MT" },
    storageLocation: { type: String, trim: true, maxlength: 120, default: "Main Facility" },
    temperatureZone: { type: String, trim: true, maxlength: 50, default: "0 to 4 C" },
    rentPerUnit: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "released"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
