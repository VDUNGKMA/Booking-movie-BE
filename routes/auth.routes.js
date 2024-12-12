// routes/auth.routes.js
const express = require('express');
// const { register, login } = require('../controllers/auth.controller');
const { registerCustomer, login, googleCallback, googleLogin } = require('../controllers/auth.controller');
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/auth.controller');

const router = express.Router();


// Route khách hàng tự đăng ký (role_id sẽ mặc định là 3 - customer)
router.post('/register-customer', registerCustomer);

// Route đăng nhập cho người dùng
router.post('/login', login);

// Route để gửi email yêu cầu đặt lại mật khẩu
router.post('/forgotPassword', forgotPassword);

router.post('/verifyOTP', verifyOTP);

// Route để đặt lại mật khẩu bằng token
router.post('/resetPassword', resetPassword);

router.post('/google-login', googleLogin);
module.exports = router;
