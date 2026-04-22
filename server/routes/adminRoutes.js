const express = require("express");
const { body } = require("express-validator");
const { adminProtect } = require("../middleware/authMiddleware");
const {
  adminLogin,
  listUsers,
  listPaymentRequests,
  dashboardSummary,
  approveUser,
  rejectUser,
  paymentStatus
} = require("../controllers/adminController");

const router = express.Router();

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  adminLogin
);
router.get("/summary", adminProtect, dashboardSummary);
router.get("/users", adminProtect, listUsers);
router.get("/payment-requests", adminProtect, listPaymentRequests);
router.get("/payment-status", adminProtect, paymentStatus);
router.patch("/users/:id/approve", adminProtect, approveUser);
router.patch("/users/:id/reject", adminProtect, rejectUser);

module.exports = router;

