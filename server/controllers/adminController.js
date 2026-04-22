const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendApprovalEmail } = require("../utils/email");
const ActivityLog = require("../models/ActivityLog");
const Inventory = require("../models/Inventory");
const Payment = require("../models/Payment");

const adminLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
  const token = generateToken({ role: "admin", email });
  return res.json({ token });
};

const listUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.json({ users });
};

const listPaymentRequests = async (req, res) => {
  const requests = await User.find({ isApproved: false, isRejected: false })
    .select("name email phone paymentId selectedPlan subscriptionStatus createdAt")
    .sort({ updatedAt: -1 });
  return res.json({ requests });
};

const dashboardSummary = async (req, res) => {
  const [totalUsers, totalChambers, recentLogs, pendingSignupRequests, paymentPendingUsers] = await Promise.all([
    User.countDocuments(),
    Inventory.distinct("storageLocation").then((locations) => locations.length),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10),
    User.countDocuments({ isApproved: false, isRejected: false }),
    User.countDocuments({
      isApproved: true,
      subscriptionStatus: { $in: ["inactive", "expired"] }
    })
  ]);

  return res.json({
    summary: {
      totalUsers,
      totalChambers,
      pendingSignupRequests,
      paymentPendingUsers
    },
    recentLogs
  });
};

const createUsername = async (name) => {
  const base = (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10) || "user";

  let username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  let exists = await User.exists({ username });
  while (exists) {
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await User.exists({ username });
  }
  return username;
};

const createTempPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  let result = "";
  for (let i = 0; i < 10; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const approveUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const username = user.username || (await createUsername(user.name));
  const tempPassword = createTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  user.isApproved = true;
  user.isRejected = false;
  user.username = username;
  user.password = hashedPassword;
  user.mustChangePassword = true;
  await user.save();
  await ActivityLog.create({
    action: "user_approved",
    message: `Admin approved ${user.name}`,
    actorRole: "admin",
    metadata: { userId: user._id.toString() }
  });

  try {
    await sendApprovalEmail(user.email, user.name, username, tempPassword);
    return res.json({ message: "User approved and credentials emailed" });
  } catch (error) {
    return res.json({
      message: "User approved, but email delivery failed. Share credentials manually.",
      credentials: {
        userId: username,
        password: tempPassword
      }
    });
  }
};

const rejectUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.isApproved = false;
  user.isRejected = true;
  await user.save();
  await ActivityLog.create({
    action: "user_rejected",
    message: `Admin rejected ${user.name}`,
    actorRole: "admin",
    metadata: { userId: user._id.toString() }
  });
  return res.json({ message: "User rejected" });
};

const paymentStatus = async (req, res) => {
  const users = await User.find()
    .select("name email subscriptionStatus selectedPlan isPaid subscriptionEndAt isApproved")
    .sort({ updatedAt: -1 });
  const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(20).populate("user", "name email");
  return res.json({ users, recentPayments });
};

module.exports = { adminLogin, listUsers, listPaymentRequests, dashboardSummary, approveUser, rejectUser, paymentStatus };

