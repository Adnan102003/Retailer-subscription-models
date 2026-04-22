const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");
const ActivityLog = require("../models/ActivityLog");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail, hasSmtpConfig } = require("../utils/email");
const { markSubscriptionExpired } = require("../utils/subscription");

const OTP_TTL_MS = 10 * 60 * 1000;

const createOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;
const createTempPassword = () => `tmp_${Math.random().toString(36).slice(2, 12)}`;
const safeDeleteFile = (filePath) => {
  if (!filePath) return;
  const absolutePath = path.join(__dirname, "..", filePath.replace(/^\/+/, ""));
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
};

const logActivity = async (action, message, metadata = {}) => {
  await ActivityLog.create({ action, message, actorRole: "system", metadata });
};

const sendEmailOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeDeleteFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, businessRegistrationNumber, chamberLocation } = req.body;
    const documentUpload = req.file ? `/uploads/${req.file.filename}` : "";
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (documentUpload) safeDeleteFile(documentUpload);
      return res.status(400).json({ message: "Email already registered" });
    }

    const now = new Date();
    const existingOtpRecord = await OtpVerification.findOne({ email: normalizedEmail });
    const canReuseExistingOtp =
      existingOtpRecord &&
      !existingOtpRecord.emailVerified &&
      existingOtpRecord.emailOtp &&
      existingOtpRecord.emailOtpExpiresAt &&
      existingOtpRecord.emailOtpExpiresAt > now;

    const emailOtp = canReuseExistingOtp ? existingOtpRecord.emailOtp : createOtp();
    const expiresAt = canReuseExistingOtp ? existingOtpRecord.emailOtpExpiresAt : new Date(Date.now() + OTP_TTL_MS);
    const previousDocumentUpload = existingOtpRecord?.documentUpload || "";

    if (!hasSmtpConfig) {
      if (documentUpload) safeDeleteFile(documentUpload);
      return res.status(500).json({ message: "SMTP is not configured. OTP cannot be sent to email." });
    }

    const otpRecord = await OtpVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name,
        email: normalizedEmail,
        phone,
        businessRegistrationNumber,
        chamberLocation,
        documentUpload: documentUpload || existingOtpRecord?.documentUpload || "",
        emailOtp,
        phoneOtp: "",
        emailOtpExpiresAt: expiresAt,
        phoneOtpExpiresAt: null,
        emailVerified: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (documentUpload && previousDocumentUpload && previousDocumentUpload !== documentUpload) {
      safeDeleteFile(previousDocumentUpload);
    }
    await sendOtpEmail(normalizedEmail, name, emailOtp);
    return res.json({
      verificationId: otpRecord._id,
      message: "OTP successfully sent to your mail ID"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to send email OTP" });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { verificationId, emailOtp } = req.body;
    if (!mongoose.Types.ObjectId.isValid(verificationId)) {
      return res.status(400).json({ message: "Invalid verification session. Please resend OTP." });
    }
    const otpRecord = await OtpVerification.findById(verificationId);
    if (!otpRecord) {
      return res.status(404).json({ message: "Verification session not found" });
    }

    const now = new Date();
    if (otpRecord.emailOtpExpiresAt < now) {
      return res.status(400).json({ message: "Email OTP expired. Please request a new OTP." });
    }
    if (otpRecord.emailOtp !== String(emailOtp)) {
      return res.status(400).json({ message: "Invalid email OTP. Please enter the latest OTP sent to your email." });
    }

    await OtpVerification.updateOne({ _id: otpRecord._id }, { $set: { emailVerified: true } });
    return res.json({ message: "Email OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify email OTP" });
  }
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      businessRegistrationNumber,
      chamberLocation,
      verificationId
    } = req.body;
    const normalizedEmail = email.toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(verificationId)) {
      return res.status(400).json({ message: "Invalid verification session. Please verify OTP again." });
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already registered. Please login." });
    }

    const otpRecord = await OtpVerification.findById(verificationId);
    if (!otpRecord || otpRecord.email !== normalizedEmail) {
      return res.status(400).json({ message: "Verification is invalid. Please verify OTP again." });
    }
    if (!otpRecord.emailVerified) {
      return res.status(400).json({ message: "Email OTP verification is required." });
    }

    const hashed = await bcrypt.hash(createTempPassword(), 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      businessRegistrationNumber,
      chamberLocation,
      documentUpload: otpRecord.documentUpload || "",
      password: hashed,
      isPaid: false,
      isApproved: false,
      isRejected: false,
      emailVerified: true,
      phoneVerified: false,
      mustChangePassword: true
    });
    await OtpVerification.deleteOne({ _id: otpRecord._id });
    await logActivity("signup_request", `New signup request from ${user.name}`, { userId: user._id.toString() });

    return res.status(201).json({
      message: "Signup request submitted. Wait for admin approval.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessRegistrationNumber: user.businessRegistrationNumber,
        chamberLocation: user.chamberLocation,
        documentUpload: user.documentUpload,
        isPaid: user.isPaid,
        isApproved: user.isApproved,
        mustChangePassword: user.mustChangePassword,
        subscriptionStatus: user.subscriptionStatus,
        trialUsed: user.trialUsed,
        subscriptionEndAt: user.subscriptionEndAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken({ role: "admin", email });
      return res.json({ token, role: "admin" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: email.trim() }]
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isRejected) {
      return res.status(403).json({ message: "Account rejected by admin" });
    }
    if (!user.isApproved) {
      return res.status(403).json({ message: "Account pending admin approval" });
    }

    if (markSubscriptionExpired(user)) {
      await user.save();
    }

    const token = generateToken({ id: user._id.toString(), role: "user" });
    return res.json({
      token,
      role: "user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        businessRegistrationNumber: user.businessRegistrationNumber,
        chamberLocation: user.chamberLocation,
        documentUpload: user.documentUpload,
        isPaid: user.isPaid,
        isApproved: user.isApproved,
        mustChangePassword: user.mustChangePassword,
        selectedPlan: user.selectedPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndAt: user.subscriptionEndAt,
        trialUsed: user.trialUsed
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const me = async (req, res) => {
  if (markSubscriptionExpired(req.user)) {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { subscriptionStatus: "expired", isPaid: false } }
    );
  }
  const user = await User.findById(req.user._id).select("-password");
  return res.json({ user });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Valid current and new password are required" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    await logActivity("password_changed", `${user.name} changed account password`, { userId: user._id.toString() });
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change password" });
  }
};

module.exports = { sendEmailOtp, verifyEmailOtp, register, login, me, changePassword };

