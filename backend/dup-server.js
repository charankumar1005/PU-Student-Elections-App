const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();
const app = express();

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Middleware
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Image Schema
const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Image Upload Endpoint
app.post('/api/images', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const image = new Image({
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      user: req.user.id
    });

    await image.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: image._id,
        url: `${req.protocol}://${req.get('host')}/${image.path}`,
        ...image.toObject()
      }
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Get User Images
app.get('/api/images', auth, async (req, res) => {
  try {
    const images = await Image.find({ user: req.user.id })
      .sort('-createdAt')
      .select('filename path size mimetype createdAt');

    res.json(images.map(img => ({
      ...img.toObject(),
      url: `${req.protocol}://${req.get('host')}/${img.path}`
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Delete Image
app.delete('/api/images/:id', auth, async (req, res) => {
  try {
    const image = await Image.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!image) return res.status(404).json({ error: 'Image not found' });

    // Delete file from filesystem
    fs.unlink(image.path, (err) => {
      if (err) console.error('File deletion error:', err);
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting image' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
