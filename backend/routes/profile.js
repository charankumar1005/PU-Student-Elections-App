const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile } = require("../controllers/profileController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

// Get user profile by ID - protected route
router.get("/:id", verifyToken, getUserProfile);

// Update user profile - protected route, accepts file upload
router.put("/update", verifyToken, upload.single("image"), updateUserProfile);

module.exports = router;