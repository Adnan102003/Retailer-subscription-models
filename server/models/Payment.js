const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    razorpaySignature: { type: String, required: true },
    status: { type: String, default: "captured" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

