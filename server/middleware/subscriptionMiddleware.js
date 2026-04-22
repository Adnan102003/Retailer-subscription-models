const { markSubscriptionExpired } = require("../utils/subscription");

const hasActiveSubscription = (user) => {
  if (!user || !user.subscriptionEndAt) return false;
  if (!["active", "trial"].includes(user.subscriptionStatus)) return false;
  return new Date(user.subscriptionEndAt) > new Date();
};

const ensureActiveSubscription = async (req, res, next) => {
  if (!req.user?.isApproved) {
    return res.status(403).json({ message: "Account is not approved by admin yet" });
  }

  if (markSubscriptionExpired(req.user)) {
    await req.user.save();
  }

  if (!hasActiveSubscription(req.user)) {
    return res.status(403).json({ message: "Subscription inactive or expired. Please purchase a plan." });
  }

  return next();
};

module.exports = { ensureActiveSubscription, hasActiveSubscription };
