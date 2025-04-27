// const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { handleBase64Image } = require("../utils/fileHelper");
// In any file
// const User = require('models/User');
// In controllers/authController.js
// const User = require("./models/User");  // If models is a sibling directory
// const User = require(path.resolve(__dirname, '..', 'models', 'User'));
// Update this in controllers/authController.js
const path = require('path');
const User = require(path.resolve(__dirname, '..', 'models', 'User'));
const fs = require('fs');

// Register new user
const registerUser = async (req, res) => {
  console.log("Registration attempt received");
  
  try {
    const { fullName, email, studentId, department, phone, password } = req.body;
    
    // Get base64 image from request body if present
    const base64Image = req.body.image;
    
    // Validate required fields
    if (!fullName || !email || !studentId || !department || !phone || !password) {
      return res.status(400).json({ 
        message: "❌ All fields are required"
      });
    }
    
    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "❌ Invalid email format" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❌ Email already exists!" });
    }
    
    // Determine the profile image path
    let profileImage = null;
    if (req.file) {
      // Use the uploaded file path
      profileImage = req.file.path;
    } else if (base64Image) {
      // Process and save base64 image
      profileImage = handleBase64Image(base64Image);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      fullName,
      email,
      studentId,
      department,
      phone,
      password: hashedPassword,
      profileImage
    });
    
    // Save user to database
    await newUser.save();
    
    // Return success
    res.status(201).json({ 
      message: "✅ User registered successfully!",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        profileImage: newUser.profileImage
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "❌ Server error", 
      error: error.message
    });
  }
};

// User login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "❌ Email and password are required" });
    }
    
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "❌ Invalid email or password" });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    res.status(200).json({
      message: "✅ Login successful!",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser
};