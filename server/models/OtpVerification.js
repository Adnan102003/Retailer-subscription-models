const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    businessRegistrationNumber: { type: String, required: true, trim: true, maxlength: 80 },
    chamberLocation: { type: String, required: true, trim: true, maxlength: 160 },
    documentUpload: { type: String, default: "" },
    emailOtp: { type: String, required: true },
    phoneOtp: { type: String, default: "" },
    emailOtpExpiresAt: { type: Date, required: true },
    phoneOtpExpiresAt: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
