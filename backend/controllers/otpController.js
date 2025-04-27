// const sendOTP = require('../utils/mailer');
// const { Otp } = require('../models/Otp'); // Create Otp model

// let otpStore = new Map();

// const sendOTPHandler = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const expiresAt = Date.now() + 300000; // 5 minutes

//     // Store in memory with automatic cleanup
//     otpStore.set(email, { otp, expiresAt });
    
//     // Schedule cleanup
//     setTimeout(() => otpStore.delete(email), 300000);

//     await sendOTP(email, otp);
//     res.json({ message: 'OTP sent successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// const verifyOTPHandler = (req, res) => {
//   const { email, otp } = req.body;
//   const storedData = otpStore.get(email);

//   if (!storedData || storedData.otp !== parseInt(otp)) {
//     return res.status(400).json({ error: 'Invalid OTP' });
//   }

//   if (Date.now() > storedData.expiresAt) {
//     otpStore.delete(email);
//     return res.status(400).json({ error: 'OTP expired' });
//   }

//   otpStore.delete(email);
//   res.json({ message: 'OTP verified successfully' });
// };

// module.exports = {
//   sendOTP: sendOTPHandler,
//   verifyOTP: verifyOTPHandler
// };
const sendOTP = require("../utils/mailer");

// Store for OTPs with expiration
let otpStore = {};

// Send OTP to email
const sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store OTP with creation timestamp and expiration (5 minutes)
    otpStore[email] = {
      code: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
    
    console.log(`OTP for ${email}: ${otp}`); // For development only, remove in production
    
    const result = await sendOTP(email, otp);
    
    if (result.success) {
      res.json({ 
        message: "OTP sent successfully",
        expiresIn: "5 minutes"
      });
    } else {
      res.status(500).json({ error: result.message || "Failed to send OTP" });
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Verify OTP
const verifyOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }
    
    const otpData = otpStore[email];
    
    if (!otpData) {
      return res.status(400).json({ error: "No OTP was sent to this email or it has expired" });
    }
    
    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ error: "OTP has expired, please request a new one" });
    }
    
    // Check if OTP matches
    if (otpData.code.toString() !== otp.toString()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    
    // OTP is valid, remove it from store
    delete otpStore[email];
    
    return res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  sendOtpToEmail,
  verifyOtp
};