// controllers/user.controller.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Lấy thông tin người dùng hiện tại
exports.getCustomerById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Cập nhật thông tin người dùng
exports.updateMe = async (req, res) => {
    try {
        const { username, email, password, phone_number } = req.body;

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Cập nhật các thông tin người dùng
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = await bcrypt.hash(password, 10); // Mã hóa mật khẩu mới
        if (phone_number) user.phone_number = phone_number;

        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Xóa tài khoản người dùng hiện tại
exports.deleteMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        await user.destroy();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
