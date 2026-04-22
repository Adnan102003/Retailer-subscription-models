const User = require("../models/User");
const Payment = require("../models/Payment");
const { getRazorpay, verifySignature } = require("../utils/razorpay");
const ActivityLog = require("../models/ActivityLog");
const { markSubscriptionExpired } = require("../utils/subscription");

const SUBSCRIPTION_PLANS = {
  trial: { name: "Free Trial", amount: 0, durationDays: 3, paid: false },
  monthly: { name: "Monthly Plan", amount: 49900, durationDays: 30, paid: true },
  yearly: { name: "Yearly Plan", amount: 499900, durationDays: 365, paid: true }
};

const applySubscription = (user, planId) => {
  const plan = SUBSCRIPTION_PLANS[planId];
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  user.selectedPlan = planId;
  user.subscriptionStartAt = startAt;
  user.subscriptionEndAt = endAt;
  user.subscriptionStatus = plan.paid ? "active" : "trial";
  user.isPaid = plan.paid;
  if (!plan.paid) {
    user.trialUsed = true;
    user.trialUsedAt = startAt;
  }
  return plan;
};

const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { planId } = req.body;
    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }
    if (!selectedPlan.paid) return res.status(400).json({ message: "Selected plan does not require payment" });

    const options = {
      amount: selectedPlan.amount,
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      receipt: `rcpt_${user._id}_${planId}_${Date.now()}`
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      planId,
      planName: selectedPlan.name
    });
  } catch (error) {
    console.error("createOrder error:", error.message);
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to create order"
        : error.message || "Failed to create order";
    return res.status(500).json({ message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({ message: "Missing payment details" });
    }
    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const valid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const appliedPlan = applySubscription(user, planId);
    user.paymentId = razorpay_payment_id;
    user.isPaid = true;
    await user.save();

    await Payment.create({
      user: user._id,
      planId,
      planName: appliedPlan.name,
      amount: selectedPlan.amount,
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "captured"
    });
    await ActivityLog.create({
      action: "payment_success",
      message: `${user.name} completed ${appliedPlan.name}`,
      actorRole: "user",
      actorId: user._id,
      metadata: { paymentId: razorpay_payment_id }
    });

    return res.json({
      message: "Payment verified successfully",
      user: {
        selectedPlan: user.selectedPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartAt: user.subscriptionStartAt,
        subscriptionEndAt: user.subscriptionEndAt,
        isPaid: user.isPaid,
        paymentId: user.paymentId,
        trialUsed: user.trialUsed
      }
    });
  } catch (error) {
    console.error("verifyPayment error:", error.message);
    const message =
      process.env.NODE_ENV === "production"
        ? "Payment verification failed"
        : error.message || "Payment verification failed";
    return res.status(500).json({ message });
  }
};

const activateFreeTrial = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (markSubscriptionExpired(user)) {
      await user.save();
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Account is not approved by admin yet" });
    }
    if (["active", "trial"].includes(user.subscriptionStatus) && user.subscriptionEndAt && new Date(user.subscriptionEndAt) > new Date()) {
      return res.status(400).json({ message: "An active subscription already exists on this account" });
    }
    if (user.trialUsed) {
      return res.status(400).json({ message: "Free trial can be used only once per account" });
    }

    const appliedPlan = applySubscription(user, "trial");
    user.paymentId = "";
    await user.save();

    await ActivityLog.create({
      action: "trial_activated",
      message: `${user.name} activated ${appliedPlan.name}`,
      actorRole: "user",
      actorId: user._id,
      metadata: { planId: "trial" }
    });

    return res.json({
      message: "Free trial activated for 3 days",
      user: {
        selectedPlan: user.selectedPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartAt: user.subscriptionStartAt,
        subscriptionEndAt: user.subscriptionEndAt,
        isPaid: user.isPaid,
        trialUsed: user.trialUsed
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to activate free trial" });
  }
};

module.exports = { createOrder, verifyPayment, activateFreeTrial, SUBSCRIPTION_PLANS };

