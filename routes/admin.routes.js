// routes/admin.routes.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    registerStaff,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/admin.controller');
// const { createMovie, updateMovie, deleteMovie } = require('../controllers/admin.controller');
const router = express.Router();

// Route để admin đăng ký nhân viên (staff) hoặc admin
// Chỉ admin (role_id = 1) mới có quyền truy cập
router.post('/register-staff', protect, restrictTo(1), registerStaff);

// Route để admin lấy danh sách tất cả người dùng
router.get('/users', protect, restrictTo(1), getAllUsers);

// Route để admin lấy thông tin chi tiết của một người dùng theo ID
router.get('/users/:id', protect, restrictTo(1), getUserById);

// Route để admin cập nhật thông tin của một người dùng
router.put('/users/:id', protect, restrictTo(1), updateUser);

// Route để admin xóa người dùng
router.delete('/users/:id', protect, restrictTo(1), deleteUser);
// Route tạo phim (chỉ admin hoặc staff có thể truy cập)
// router.post('/movie', protect, restrictTo('admin', 'staff'), createMovie);

// Route cập nhật phim (chỉ admin có thể truy cập)
// router.patch('/movie/:id', protect, restrictTo('admin'), updateMovie);

// Route xóa phim (chỉ admin có thể truy cập)
// router.delete('/movie/:id', protect, restrictTo('admin'), deleteMovie);

module.exports = router;
