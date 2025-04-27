const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { upload } = require('../middleware/uploadMiddleware');

// Wrong:
// const authController = require('./controllers/authController');

// Correct:
// const authController = require('../controllers/authController');
router.post('/register', upload.single('image'), register);
router.post('/login', login);

module.exports = router;