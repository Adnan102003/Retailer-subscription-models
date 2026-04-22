const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    businessRegistrationNumber: { type: String, required: true, trim: true, maxlength: 80 },
    chamberLocation: { type: String, required: true, trim: true, maxlength: 160 },
    documentUpload: { type: String, default: "" },
    username: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    isPaid: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: true },
    paymentId: { type: String, default: "" },
    selectedPlan: { type: String, default: "" },
    subscriptionStatus: { type: String, enum: ["inactive", "trial", "active", "expired"], default: "inactive" },
    subscriptionStartAt: { type: Date, default: null },
    subscriptionEndAt: { type: Date, default: null },
    trialUsed: { type: Boolean, default: false },
    trialUsedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

