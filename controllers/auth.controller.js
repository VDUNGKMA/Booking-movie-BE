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

// // Đăng ký
// exports.register = async (req, res) => {
//     try {
//         const { username, email, password, phone_number } = req.body;

//         // Kiểm tra nếu username hoặc email đã tồn tại
//         const existingUser = await User.findOne({ where: { email } });
//         if (existingUser) {
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'Email is already in use.'
//             });
//         }

//         // Tạo người dùng mới
//         const newUser = await User.create({
//             username,
//             email,
//             password,
//             phone_number
//         });

//         const token = createToken(newUser);
//         res.status(201).json({
//             status: 'success',
//             token,
//             data: {
//                 user: newUser
//             }
//         });
//     } catch (error) {
//         res.status(400).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };

// Đăng nhập
// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Kiểm tra nếu người dùng tồn tại
//         const user = await User.findOne({ where: { email } });

//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({
//                 status: 'fail',
//                 message: 'Incorrect email or password'
//             });
//         }

//         const token = createToken(user);
//         res.status(200).json({
//             status: 'success',
//             token,
//             data: {
//                 user
//             }
//         });
//     } catch (error) {
//         res.status(400).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };
// controllers/auth.controller.js
exports.registerCustomer = async (req, res) => {
    try {
        const { username, email, password, phone_number } = req.body;

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
            role_id: roleId  // Lưu role_id thay vì role_name
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
                    role_id: user.role_id
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

// Gửi yêu cầu đặt lại mật khẩu
// exports.forgotPassword = async (req, res) => {
//     let user;
//     try {
//         const { email } = req.body;
//         user = await User.findOne({ where: { email } });
//         // Kiểm tra xem email có tồn tại không
//         if (!user) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Email không tồn tại.'
//             });
//         }

//         // Tạo token ngẫu nhiên
//         const resetToken = crypto.randomBytes(32).toString('hex');

       
//         user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//         user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 
//         // Kiểm tra log quá trình lưu dữ liệu
//         console.log('Hashed Token:', user.resetPasswordToken);
//         console.log('Token Expiry:', user.resetPasswordExpires);

//         await user.save();

//         // Tạo URL đặt lại mật khẩu và gửi qua email
//         const resetURL = `${req.protocol}://${req.get('host')}/api/auth/resetPassword/${resetToken}`;
//         const message = `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào liên kết sau để đặt lại mật khẩu của bạn: \n\n${resetURL}`;

//         await sendEmail({
//             email: user.email,
//             subject: 'Yêu cầu đặt lại mật khẩu',
//             message,
//         });

//         res.status(200).json({
//             status: 'success',
//             message: 'Token đã được gửi tới email của bạn.'
//         });
//     } catch (err) {
//         console.error('Error sending email:', err);  // In lỗi chi tiết ra console
//         // Nếu có lỗi, xóa token và thời gian hết hạn trong database
//         if (user) {
//             user.resetPasswordToken = null;
//             user.resetPasswordExpires = null;
//             await user.save();
//         }

//         res.status(500).json({
//             status: 'fail',
//             message: 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.'
//         });
//     }
// };

// // Đặt lại mật khẩu bằng token
// exports.resetPassword = async (req, res) => {
//     try {
//         // Mã hóa token từ URL để khớp với token đã lưu trong cơ sở dữ liệu
//         const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

//         // Tìm người dùng với token hợp lệ và chưa hết hạn
//         const user = await User.findOne({
//             where: {
//                 resetPasswordToken: hashedToken,
//                 resetPasswordExpires: { [Op.gt]: Date.now() },
//             }
//         });

//         if (!user) {
//             console.log('Token không hợp lệ hoặc đã hết hạn');
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'Token không hợp lệ hoặc đã hết hạn.'
//             });
//         }

//         // Cập nhật mật khẩu
//         user.password = await bcrypt.hash(req.body.password, 12);
//         user.resetPasswordToken = null;
//         user.resetPasswordExpires = null;

//         await user.save();

//         res.status(200).json({
//             status: 'success',
//             message: 'Mật khẩu đã được đặt lại thành công.'
//         });
//     } catch (error) {
//         console.error('Lỗi khi đặt lại mật khẩu:', error);  // Log chi tiết lỗi ra console
//         res.status(500).json({
//             status: 'error',
//             message: 'Có lỗi xảy ra khi đặt lại mật khẩu.'
//         });
//     }
// };
// controllers/auth.controller.js
// exports.forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         // Find user by email
//         const user = await User.findOne({ where: { email } });

//         if (!user) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Email không tồn tại.'
//             });
//         }

//         // Generate 6-digit OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();

//         // Set OTP expiry time to 2 minutes from now
//         const otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes in milliseconds

//         // Save OTP and expiry to the user's record in the database
//         user.otp = otp;
//         user.otpExpires = otpExpires;
//         await user.save();

//         // Send OTP via email
//         const message = `Your OTP code is ${otp}. It will expire in 2 minutes.`;

//         await sendEmail({
//             email: user.email,
//             subject: 'Your OTP Code for Password Reset',
//             message
//         });

//         res.status(200).json({
//             status: 'success',
//             message: 'OTP đã được gửi đến email của bạn.'
//         });

//     } catch (error) {
//         console.error('Error in forgotPassword:', error);

//         res.status(500).json({
//             status: 'fail',
//             message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
//         });
//     }
// };

// exports.forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;
//         const user = await User.findOne({ where: { email } });

//         if (!user) {
//             return res.status(404).json({ status: 'fail', message: 'Email không tồn tại.' });
//         }

//         // Tạo mã OTP ngẫu nhiên 6 số
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         console.log('Session before setting:', req.session);

//         // Lưu mã OTP vào session
//         req.session.otp = otp;
//         req.session.email = email;
//         console.log('Session after setting:', req.session);
//         console.log('hi',req.session.otp)
//         // Gửi OTP qua email
//         const message = `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 2 phút.`;

//         await sendEmail({
//             email: user.email,
//             subject: 'Mã OTP xác thực',
//             message,
//         });

//         res.status(200).json({ status: 'success', message: 'OTP đã được gửi qua email của bạn.' });
//     } catch (error) {
//         console.error('Error sending OTP:', error);
//         res.status(500).json({ status: 'fail', message: 'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại sau.' });
//     }
// };
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

// exports.verifyOTP = async (req, res) => {
//     try {
//         const { email, otp } = req.body;
// console.log("email",email,otp);
//         // Find user by email
//         const user = await User.findOne({ where: { email } });
// console.log("check user", user);
//         if (!user) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Email không tồn tại.'
//             });
//         }

//         // Check if OTP is valid and not expired
//         if (user.otp !== otp || user.otpExpires < Date.now()) {
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'OTP không hợp lệ hoặc đã hết hạn.'
//             });
//         }

//         // Clear OTP fields
//         user.otp = null;
//         user.otpExpires = null;
//         await user.save();

//         res.status(200).json({
//             status: 'success',
//             message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.',
//         });

//     } catch (error) {
//         console.error('Error in verifyOTP:', error);

//         res.status(500).json({
//             status: 'fail',
//             message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
//         });
//     }
// };
// exports.verifyOTP = async (req, res) => {
//     try {
//         const { otp } = req.body;
//         console.log("otp",otp)
//         console.log("Session OTP:", req.session.otp);
//         console.log("Provided OTP:", req.session.email);

//         // Kiểm tra mã OTP trong session
//         if (req.session.otp !== otp) {
//             return res.status(400).json({ status: 'fail', message: 'OTP không chính xác hoặc đã hết hạn.' });
//         }

//         // Xóa OTP khỏi session sau khi xác thực thành công
//         req.session.otp = null;

//         res.status(200).json({ status: 'success', message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.' });
//     } catch (error) {
//         console.error('Error verifying OTP:', error);
//         res.status(500).json({ status: 'fail', message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
//     }
// };

// controllers/auth.controller.js
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log("check email,new",email, newPassword)
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
