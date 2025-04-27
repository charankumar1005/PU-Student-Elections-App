const multer = require("multer");

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "❌ File is too large. Maximum size is 5MB." });
    }
    return res.status(400).json({ message: `❌ Multer error: ${err.message}` });
  }
  
  res.status(500).json({ message: "❌ Server error", error: err.message });
};

module.exports = { errorHandler };