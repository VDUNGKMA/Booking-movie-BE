// controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const crypto = require('crypto');
const User = require('../models/user');  // Mô hình người dùng (thay đổi tên nếu cần)
const sendEmail = require('../utils/sendEmail');  // Hàm gửi email (được tạo ở bước tiếp theo)
const { Op } = require('sequelize');  // Thêm Op từ Sequelize
const redisClient = require('../config/redisClient'); // Import Redis client
dotenv.config();

// Tạo JWT
const createToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.registerCustomer = async (req, res) => {
    try {
        const { username, email, password, phone_number, image } = req.body;

        // Kiểm tra nếu email đã tồn tại
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email is already in use.'
            });
        }

        // Mặc định role_id là 3 (customer)
        const roleId = 3;

        // Tạo người dùng mới với role_id là "customer"
        const newUser = await User.create({
            username,
            email,
            password,
            phone_number,
            role_id: roleId,  // Lưu role_id thay vì role_name
            image
        });

        // Tạo JWT token
        const token = createToken(newUser);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
        console.log("check user:", newUser)
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};
// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra nếu người dùng tồn tại
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        // Tạo JWT token
        const token = createToken(user);

        // Trả về token và thông tin người dùng
        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    phone_number: user.phone_number,
                    role_id: user.role_id,
                    image: user.image
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};



exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Email không tồn tại.'
            });
        }

        // Tạo mã OTP ngẫu nhiên 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu OTP vào Redis với thời gian hết hạn là 2 phút (120 giây)
        await redisClient.setEx(`otp:${email}`, 120, otp);

        // Gửi OTP qua email
        const message = `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 2 phút.`;

        await sendEmail({
            email: user.email,
            subject: 'Mã OTP xác thực',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'OTP đã được gửi tới email của bạn.'
        });
    } catch (err) {
        console.error('Error sending OTP:', err);

        res.status(500).json({
            status: 'fail',
            message: 'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại sau.'
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Kiểm tra mã OTP từ Redis
        const storedOtp = await redisClient.get(`otp:${email}`);

        if (!storedOtp) {
            return res.status(400).json({
                status: 'fail',
                message: 'OTP đã hết hạn hoặc không tồn tại.'
            });
        }

        // So sánh OTP
        if (storedOtp !== otp) {
            return res.status(400).json({
                status: 'fail',
                message: 'OTP không chính xác.'
            });
        }

        // Xóa OTP khỏi Redis sau khi xác thực thành công
        await redisClient.del(`otp:${email}`);

        res.status(200).json({
            status: 'success',
            message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.',
        });
    } catch (error) {
        console.error('Error in verifyOTP:', error);

        res.status(500).json({
            status: 'fail',
            message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log("check email,new", email, newPassword)
        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Email không tồn tại.'
            });
        }

        // Hash the new password and update it in the database
        user.password = await bcrypt.hash(newPassword, 12);

        // Save the updated user details
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Mật khẩu đã được đặt lại thành công.'
        });

    } catch (error) {
        console.error('Error in resetPassword:', error);

        res.status(500).json({
            status: 'fail',
            message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
};

// // Xử lý logic tìm kiếm hoặc tạo người dùng từ Google profile
// exports.googleAuthHandler = async (accessToken, refreshToken, profile, done) => {
//     try {
//         // Tìm người dùng với Google ID
//         let user = await User.findOne({ where: { googleId: profile.id } });

//         // Nếu không tồn tại, tạo người dùng mới
//         if (!user) {
//             user = await User.create({
//                 googleId: profile.id,
//                 username: profile.displayName,
//                 email: profile.emails[0].value,
//                 image: profile.photos[0].value,
//             });
//         }
//         done(null, user);
//     } catch (error) {
//         done(error, null);
//     }
// };

// // Xử lý callback sau khi Google xác thực thành công
// exports.googleCallback = async (req, res) => {
//     try {
//         const { clientId } = req.body;

//         // Kiểm tra client ID từ request với client ID trong biến môi trường
//         if (clientId !== process.env.GOOGLE_CLIENT_ID) {
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'Invalid client ID',
//             });
//         }
//         const token = createToken(req.user);
//         res.status(200).json({
//             status: 'success',
//             token,
//             data: {
//                 user: req.user,
//             },
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 'fail',
//             message: 'Authentication failed.',
//             error: error.message,
//         });
//     }
// };

// // Deserialize người dùng dựa trên ID
// exports.deserializeUser = async (id, done) => {
//     try {
//         const user = await User.findByPk(id);
//         done(null, user);
//     } catch (error) {
//         done(error, null);
//     }
// };
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Google Login API
exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload; // Google ID, email, name, and picture

        // Find or create user
        let user = await User.findOne({ where: { googleId: sub } });
        if (!user) {
            user = await User.create({
                googleId: sub,
                email,
                username: name,
                image: picture,
                role_id: 3 // Default to customer role
            });
        }

        // Create a JWT token for your app
        const appToken = createToken(user);

        res.status(200).json({
            status: 'success',
            token: appToken,
            data: { user }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({
            status: 'fail',
            message: 'Google authentication failed',
        });
    }
};