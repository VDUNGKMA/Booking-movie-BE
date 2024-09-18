// // controllers/admin.controller.js
// const Movie = require('../models/movie');

// // Tạo phim mới
// exports.createMovie = async (req, res) => {
//     try {
//         const { title, description, duration, release_date } = req.body;

//         const newMovie = await Movie.create({
//             title,
//             description,
//             duration,
//             release_date
//         });

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 movie: newMovie
//             }
//         });
//     } catch (error) {
//         res.status(400).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };

// // Cập nhật phim
// exports.updateMovie = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { title, description, duration, release_date } = req.body;

//         const movie = await Movie.findByPk(id);
//         if (!movie) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Movie not found'
//             });
//         }

//         movie.title = title || movie.title;
//         movie.description = description || movie.description;
//         movie.duration = duration || movie.duration;
//         movie.release_date = release_date || movie.release_date;

//         await movie.save();

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 movie
//             }
//         });
//     } catch (error) {
//         res.status(400).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };

// // Xóa phim
// exports.deleteMovie = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const movie = await Movie.findByPk(id);
//         if (!movie) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Movie not found'
//             });
//         }

//         await movie.destroy();

//         res.status(204).json({
//             status: 'success',
//             data: null
//         });
//     } catch (error) {
//         res.status(400).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };
const User = require('../models/user');
const  Payment  = require('../models/Payment');

// controllers/admin.controller.js
const { cloudinary } = require('../config/cloudinary');

// exports.registerStaff = async (req, res) => {
//     try {
//         const { username, email, password, phone_number, role_id } = req.body;
//         console.log('Request body:', req.body);
//         console.log('Uploaded file:', req.file);
//         // Chỉ admin mới có thể đăng ký cho nhân viên hoặc admin
//         if (req.user.role_id !== 1) {
//             return res.status(403).json({
//                 status: 'fail',
//                 message: 'You do not have permission to create this user'
//             });
//         }
//         // Kiểm tra nếu email đã tồn tại
//         const existingUser = await User.findOne({ where: { email } });
//         if (existingUser) {
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'Email is already in use.'
//             });
//         }
//         console.log("check check1",existingUser)

//         // Chỉ cho phép tạo nhân viên (role_id = 2) hoặc admin (role_id = 1)
//         if (![1, 2].includes(role_id)) {
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'Invalid role. Only "admin" or "staff" roles are allowed.'
//             });
//         }

//         // Lấy URL của hình ảnh từ Cloudinary
//         // const image_url = req.file ? req.file.path : null;
//         const image_url = req.files['image'] ? req.files['image'][0].path : null;
//         // Tạo nhân viên mới với hình ảnh URL
//         const newUser = await User.create({
//             username,
//             email,
//             password,
//             phone_number,
//             role_id,
//             image: image_url,
//         });
//         console.log("check new user",newUser)
//         res.status(201).json({
//             status: 'success',
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
exports.registerStaff = async (req, res) => {
    try {
        const { username, email, password, phone_number, role_id } = req.body;
        const image_url = req.files['image'] ? req.files['image'][0].path : null;

        // Kiểm tra quyền hạn và email tồn tại
        if (req.user.role_id !== 1) {
            return res.status(403).json({ status: 'fail', message: 'You do not have permission to create this user' });
        }
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ status: 'fail', message: 'Email is already in use.' });
        }

        const newUser = await User.create({
            username,
            email,
            password,
            phone_number,
            role_id,
            image: image_url,
        });
        res.status(201).json({ status: 'success', data: { user: newUser } });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Controller lấy tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'phone_number', 'role_id','image']
        });

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
// controllers/admin.controller.js

// Controller lấy tất cả người dùng theo role_id
exports.getUsersByRole = async (req, res) => {
    try {
        const roleId = parseInt(req.query.role_id, 10);

        // Kiểm tra nếu role_id hợp lệ
        if (isNaN(roleId) || roleId <= 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid role_id'
            });
        }

        // Lấy người dùng theo role_id
        const users = await User.findAll({
            where: { role_id: roleId },
            attributes: ['id', 'username', 'email', 'phone_number', 'role_id','image']
        });

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Controller lấy một người dùng theo ID
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'phone_number', 'role_id', 'image']
        });

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
            status: 'error',
            message: error.message
        });
    }
};
// Controller cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, phone_number, role_id } = req.body;
        const image_url = req.files && req.files['image'] ? req.files['image'][0].path : null;

        // Chỉ admin mới có thể cập nhật role_id
        if (req.user.role_id !== 1) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to update this user'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Kiểm tra xem email có trùng với user khác không (ngoại trừ user hiện tại)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ status: 'fail', message: 'Email is already in use.' });
            }
        }

        // Cập nhật thông tin người dùng
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone_number = phone_number || user.phone_number;

        // Cập nhật hình ảnh nếu có
        if (image_url) {
            user.image = image_url;
        }

        // Cập nhật role_id nếu có (chỉ admin mới được cập nhật)
        if (role_id) {
            user.role_id = role_id;
        }

        await user.save();
        res.status(200).json({
            status: 'success',
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
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};


// Controller xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        await user.destroy();

        res.status(200).json({
            status: 'success'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Thống kê doanh thu
exports.getRevenue = async (req, res) => {
    try {
        const totalRevenue = await Payment.sum('amount');
        res.status(200).json({ status: 'success', data: { totalRevenue } });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};