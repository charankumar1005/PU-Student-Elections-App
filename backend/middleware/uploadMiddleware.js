const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const handleBase64Image = (base64Data) => {
  if (!base64Data) return null;
  
  try {
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const uploadPath = path.join(__dirname, '..', 'uploads', uniqueFilename);
    
    let imageData = base64Data;
    if (base64Data.includes('base64,')) {
      imageData = base64Data.split('base64,')[1];
    }
    
    fs.writeFileSync(uploadPath, Buffer.from(imageData, 'base64'));
    return `uploads/${uniqueFilename}`;
  } catch (error) {
    console.error("Base64 image processing error:", error);
    return null;
  }
};

module.exports = { upload, handleBase64Image };