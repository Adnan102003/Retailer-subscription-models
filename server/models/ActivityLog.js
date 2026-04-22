const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    actorRole: { type: String, enum: ["system", "admin", "user"], default: "system" },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
