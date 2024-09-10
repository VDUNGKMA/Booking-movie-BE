// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require('dotenv');

dotenv.config();

// Middleware để xác thực JWT
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Kiểm tra xem request có chứa token trong header hay không
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Nếu không có token, trả về lỗi 401
        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm người dùng dựa trên ID trong token
        const currentUser = await User.findByPk(decoded.id);

        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token does no longer exist.'
            });
        }

        // Gắn thông tin người dùng vào request
        req.user = currentUser;
        next(); // Tiếp tục đến middleware hoặc route tiếp theo
    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token or token expired'
        });
    }
};


exports.restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // Kiểm tra nếu role_id của người dùng có nằm trong danh sách allowedRoles không
        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
