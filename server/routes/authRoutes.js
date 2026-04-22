const express = require("express");
const { body } = require("express-validator");
const {
  sendEmailOtp,
  verifyEmailOtp,
  register,
  login,
  me,
  changePassword
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/chamberUpload");

const router = express.Router();

const signupFieldsValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name must contain letters only"),
  body("businessRegistrationNumber").trim().isLength({ min: 3, max: 80 }),
  body("chamberLocation").trim().isLength({ min: 3, max: 160 }),
  body("email").isEmail().normalizeEmail(),
  body("phone")
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Phone number must be exactly 10 digits")
];

router.post("/send-email-otp", upload.single("documentUpload"), signupFieldsValidation, sendEmailOtp);
router.post(
  "/verify-email-otp",
  [
    body("verificationId").trim().notEmpty(),
    body("emailOtp").trim().isLength({ min: 6, max: 6 })
  ],
  verifyEmailOtp
);

router.post(
  "/register",
  [
    ...signupFieldsValidation,
    body("verificationId").trim().notEmpty()
  ],
  register
);

router.post(
  "/login",
  [body("email").trim().notEmpty(), body("password").notEmpty()],
  login
);

router.get("/me", protect, me);
router.post(
  "/change-password",
  protect,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6, max: 64 })],
  changePassword
);

module.exports = router;

