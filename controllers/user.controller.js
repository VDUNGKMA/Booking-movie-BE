// controllers/user.controller.js
const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // Thêm dòng này để sử dụng toán tử Sequelize

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
exports.changePassword = async (req, res) => {
    try {
        const { userId } = req.params; // Lấy userId từ token hoặc session
        const { currentPassword, newPassword } = req.body;

        // Lấy thông tin người dùng
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Kiểm tra mật khẩu hiện tại có khớp không
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                status: 'fail',
                message: 'Current password is incorrect'
            });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Cập nhật mật khẩu mới
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
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
// **1. Lấy Danh Sách Người Dùng Với Phân Trang, Sắp Xếp và Tìm Kiếm**
exports.getUsers = async (req, res) => {
    try {
        let { page, limit, sortField, sortOrder, search } = req.query;

        // Thiết lập giá trị mặc định
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortField = sortField || 'createdAt';
        sortOrder = sortOrder ? sortOrder.toUpperCase() : 'DESC';
        search = search || '';

        const offset = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        const whereCondition = {};

        if (search) {
            whereCondition[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { role_id: { [Op.like]: `%${search}%` } },
            ];
        }

        // Tổng số người dùng thỏa điều kiện
        const totalUsers = await User.count({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : {},
        });

        // Lấy danh sách người dùng
        const users = await User.findAll({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : {},
            order: [[sortField, sortOrder]],
            limit: limit,
            offset: offset,
            attributes: ['id', 'username', 'email', 'role_id', 'createdAt', 'updatedAt'],
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                users,
            },
        });
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách người dùng.' });
    }
};
// Thay đổi username của người dùng
exports.changeUsername = async (req, res) => {
    try {
        const { userId } = req.params; // Lấy userId từ token hoặc session
        const { newUsername } = req.body;

        // Kiểm tra username mới có rỗng không
        if (!newUsername) {
            return res.status(400).json({
                status: 'fail',
                message: 'New username is required'
            });
        }

        // Lấy thông tin người dùng
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Cập nhật username mới
        user.username = newUsername;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Username updated successfully',
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
// Logout người dùng
exports.logout = async (req, res) => {
    try {
        // Xoá token từ session hoặc cookies nếu sử dụng
        res.clearCookie('jwt'); // Nếu bạn lưu token trong cookies
        req.session = null; // Xoá session nếu sử dụng session-based auth
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: 'Error logging out'
        });
    }
};
