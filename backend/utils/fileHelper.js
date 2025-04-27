const fs = require('fs');
const path = require('path');

// Handle base64 image conversion and saving
const handleBase64Image = (base64Data) => {
  // Check if the request includes base64 image data
  if (!base64Data) return null;
  
  try {
    // Create a unique filename
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const uploadPath = path.join(__dirname, '..', 'uploads', uniqueFilename);
    
    // Extract the actual base64 content if it's a data URL
    let imageData = base64Data;
    if (base64Data.includes('base64,')) {
      imageData = base64Data.split('base64,')[1];
    }
    
    // Write the file to disk
    fs.writeFileSync(uploadPath, Buffer.from(imageData, 'base64'));
    
    // Return the relative path to the file
    return `uploads/${uniqueFilename}`;
  } catch (error) {
    console.error("Base64 image processing error:", error);
    return null;
  }
};

module.exports = { handleBase64Image };