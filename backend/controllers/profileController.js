const User = require("../models/User");

// Get user profile by ID
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "❌ User not found!" });
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    console.log("🔹 Incoming Profile Update Request");
   console.log("📝 Request Body:", req.body);
    console.log("📷 Uploaded File:", req.file ? req.file.path : "No file uploaded");
    console.log("👤 User ID from Token:", req.user?.id);

    const { fullName, studentId, department, phone } = req.body;

    // Build update object with only provided fields
    const updateObj = {};
    if (fullName) updateObj.fullName = fullName;
    if (studentId) updateObj.studentId = studentId;
    if (department) updateObj.department = department;
    if (phone) updateObj.phone = phone;

    // Add profile image if uploaded
    if (req.file) {
      updateObj.profileImage = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateObj,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      console.log("❌ User not found!");
      return res.status(404).json({ message: "❌ User not found!" });
    }

    console.log("✅ Profile Updated Successfully:", updatedUser);

    res.json({ 
      message: "✅ Profile updated successfully!", 
      user: updatedUser 
    });

  } catch (error) {
    console.error("🔥 Profile update error:", error);
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};