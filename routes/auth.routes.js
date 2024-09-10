// routes/auth.routes.js
const express = require('express');
// const { register, login } = require('../controllers/auth.controller');
const { registerCustomer, login } = require('../controllers/auth.controller');
const { forgotPassword, resetPassword } = require('../controllers/auth.controller');

const router = express.Router();

// router.post('/register', register);
// router.post('/login', login);
// Route khách hàng tự đăng ký (role_id sẽ mặc định là 3 - customer)
router.post('/register-customer', registerCustomer);

// Route đăng nhập cho người dùng
router.post('/login', login);

// Route để gửi email yêu cầu đặt lại mật khẩu
router.post('/forgotPassword', forgotPassword);

// Route để đặt lại mật khẩu bằng token
router.patch('/resetPassword/:token', resetPassword);
module.exports = router;
