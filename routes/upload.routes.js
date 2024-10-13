// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const upload1 = require('../config/multer'); // Import cấu hình multer
const { uploadImage } = require('../controllers/upload.controller'); // Import controller

// Route tải ảnh lên
router.post('/image', upload1.single('image'), uploadImage);

module.exports = router;
