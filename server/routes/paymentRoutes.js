const express = require("express");
const { createOrder, verifyPayment, activateFreeTrial } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/activate-trial", protect, activateFreeTrial);

module.exports = router;

