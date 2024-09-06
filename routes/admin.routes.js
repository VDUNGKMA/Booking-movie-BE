// routes/admin.routes.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createMovie, updateMovie, deleteMovie } = require('../controllers/admin.controller');
const router = express.Router();

// Route tạo phim (chỉ admin hoặc staff có thể truy cập)
router.post('/movie', protect, restrictTo('admin', 'staff'), createMovie);

// Route cập nhật phim (chỉ admin có thể truy cập)
router.patch('/movie/:id', protect, restrictTo('admin'), updateMovie);

// Route xóa phim (chỉ admin có thể truy cập)
router.delete('/movie/:id', protect, restrictTo('admin'), deleteMovie);

module.exports = router;
