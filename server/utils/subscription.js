const isSubscriptionExpired = (user) => {
  if (!user?.subscriptionEndAt) return false;
  return new Date(user.subscriptionEndAt) <= new Date();
};

const markSubscriptionExpired = (user) => {
  if (!user) return false;
  if (!isSubscriptionExpired(user)) return false;
  if (user.subscriptionStatus === "expired") return false;

  user.subscriptionStatus = "expired";
  user.isPaid = false;
  return true;
};

module.exports = { isSubscriptionExpired, markSubscriptionExpired };
