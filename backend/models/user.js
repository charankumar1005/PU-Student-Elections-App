
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, unique: true, required: true, index: true },
        studentId: { type: String, required: true },
        department: { type: String, required: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        profileImage: { type: String }, // Path to the uploaded image
        isAdmin: { type: Boolean, default: false ,index: true }, // Add isAdmin field
    },
    { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);



