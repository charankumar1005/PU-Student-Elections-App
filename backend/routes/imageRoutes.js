// imageRoutes.js
const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const { verifyToken } = require('../middleware/auth');

// ✅ Secure Upload Route
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const newImage = new Image({
      filename: req.body.fileName,
      contentType: req.body.image.split(';')[0].split(':')[1],
      imageBase64: req.body.image,
      userId: req.user.userId // From verified token
    });

    const savedImage = await newImage.save();
    res.status(201).json({
      message: 'Image uploaded successfully',
      imageId: savedImage._id
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// ✅ User-Specific Image Retrieval
router.get('/my-images', verifyToken, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.user.userId });
    res.json(images);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching images',
      error: error.message
    });
  }
});

module.exports = router;