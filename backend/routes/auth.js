// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require('../models/User'); // Adjust based on folder structure


// const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// // User Registration Route
// router.post("/register", async (req, res) => {
//   try {
//     const { fullName, email, studentId, department, phone, password } = req.body;

//     const userExists = await User.findOne({ email });
//     if (userExists) return res.status(400).json({ message: "❌ Email already in use" });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ fullName, email, studentId, department, phone, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: "🎉 User registered successfully!" });
//   } catch (error) {
//     console.error("❌ Registration Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// // User Login Route with JWT
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "❌ Invalid email or password" });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(400).json({ message: "❌ Invalid email or password" });

//     const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

//     res.status(200).json({ message: "✅ Login successful!", token, userId: user._id });
//   } catch (error) {
//     console.error("❌ Login Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { upload } = require("../middleware/upload");

// Register route - accepts file upload
router.post("/register", upload.single("image"), registerUser);

// Login route
router.post("/login", loginUser);

module.exports = router;