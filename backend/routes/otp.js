const express = require("express");
const router = express.Router();
const { sendOtpToEmail, verifyOtp } = require("../controllers/otpController");

// Send OTP route
router.post("/send", sendOtpToEmail);

// Verify OTP route
router.post("/verify", verifyOtp);

module.exports = router;