
const User = require('../models/user');
const Payment = require('../models/Payment');
const { sequelize } = require('../models'); // Hoặc đường dẫn tương ứng đến file models
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const Ticket = db.Ticket;
const Showtime = db.Showtime;
const Theater = db.Theater;
const Cinema = db.Cinema;
const Movie = db.Movie;
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
// controllers/admin.controller.js
const { cloudinary } = require('../config/cloudinary');


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
            attributes: ['id', 'username', 'email', 'phone_number', 'role_id', 'image']
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
            attributes: ['id', 'username', 'email', 'phone_number', 'role_id', 'image']
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
// const { startOfDay, endOfDay,
//     startOfMonth, endOfMonth,
//     startOfYear, endOfYear } = require('date-fns');


// exports.getDailyRevenue = async (req, res) => {
//     try {
//         const { date } = req.query;  // Nhận date từ frontend
//         const revenues = await Ticket.findAll({
//             attributes: [
//                 [fn('SUM', col('Ticket.price')), 'dailyRevenue']  // Thêm Ticket trước cột price
//             ],
//             include: [{
//                 model: Showtime,
//                 as: 'showtime',
//                 attributes: []
//             }],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed',
//                 createdAt: {
//                     [Op.between]: [startOfDay(new Date(date)), endOfDay(new Date(date))]
//                 }
//             }
//         });

//         res.json(revenues);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

// exports.getMonthlyRevenue = async (req, res) => {
//     try {
//         const { month, year } = req.query; // Pass the month and year from frontend
//         const revenues = await Ticket.findAll({
//             attributes: [
//                 [fn('SUM', col('Ticket.price')), 'monthlyRevenue']
//             ],
//             include: [{
//                 model: Showtime,
//                 as: 'showtime',
//                 attributes: []
//             }],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed',
//                 createdAt: {
//                     [Op.between]: [startOfMonth(new Date(year, month - 1)), endOfMonth(new Date(year, month - 1))]
//                 }
//             }
//         });

//         res.json(revenues);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };
// exports.getYearlyRevenue = async (req, res) => {
//     try {
//         const { year } = req.query;  // Pass the year from the frontend
//         const revenues = await Ticket.findAll({
//             attributes: [
//                 [fn('SUM', col('Ticket.price')), 'yearlyRevenue']
//             ],
//             include: [{
//                 model: Showtime,
//                 as: 'showtime',
//                 attributes: []
//             }],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed',
//                 createdAt: {
//                     [Op.between]: [startOfYear(new Date(year)), endOfYear(new Date(year))]
//                 }
//             }
//         });

//         res.json(revenues);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };
// exports.getTransactions = async (req, res) => {
//     try {
//         const { page, limit } = req.query;  // Pagination parameters
//         const transactions = await Ticket.findAndCountAll({
//             attributes: ['id', 'price', 'createdAt', 'status'], // Bỏ user.name, thêm thông qua include
//             include: [
//                 {
//                     model: User,  // Bao gồm User trong kết quả
//                     as: 'UserData', // Phải khớp với alias trong define
//                     attributes: ['username'], // Lấy ra username của User
//                 },
//                 {
//                     model: Showtime,
//                     as: 'showtime',
//                     attributes: [] // Không lấy cột từ Showtime
//                 }
//             ],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed'
//             },
//             limit: parseInt(limit, 10) || 10,
//             offset: (page - 1) * (limit || 10),
//             order: [['createdAt', 'DESC']]
//         });

//         // Trả về danh sách transactions cùng với tổng số record
//         res.json({
//             totalRecords: transactions.count,
//             transactions: transactions.rows
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

// const { startOfDay, endOfDay } = require('date-fns');

// exports.getDailyRevenueByCinema = async (req, res) => {
//     try {
//         const { date, cinema_id } = req.query;  // Nhận ngày và cinema_id từ frontend

//         const revenues = await Ticket.findAll({
//             attributes: [
//                 [fn('SUM', col('Ticket.price')), 'dailyRevenue']
//             ],
//             include: [{
//                 model: Showtime,
//                 as: 'showtime',
//                 attributes: [],
//                 include: [{
//                     model: Theater,
//                     as: 'theater',
//                     attributes: [],
//                     where: {
//                         cinema_id // Lọc theo rạp cụ thể
//                     }
//                 }]
//             }],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed',
//                 createdAt: {
//                     [Op.between]: [startOfDay(new Date(date)), endOfDay(new Date(date))]
//                 }
//             },
//             // Chuyển sang INNER JOIN
//             required: true,  // Chỉ lấy các bản ghi có tồn tại ở tất cả các bảng
//         });

//         console.log("check res revenues", revenues);
//         res.json(revenues);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };


// const { startOfMonth, endOfMonth } = require('date-fns');

// exports.getMonthlyRevenueByCinema = async (req, res) => {
//     try {
//         const { month, year, cinema_id } = req.query;  // Nhận tháng, năm và cinema_id từ frontend
//         const revenues = await Ticket.findAll({
//             attributes: [
//                 [fn('SUM', col('Ticket.price')), 'monthlyRevenue']
//             ],
//             include: [{
//                 model: Showtime,
//                 as: 'showtime',
//                 attributes: [],
//                 include: [{
//                     model: Theater,
//                     as: 'theater',
//                     attributes: [],
//                     where: {
//                         cinema_id // Lọc theo rạp cụ thể
//                     }
//                 }]
//             }],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed',
//                 createdAt: {
//                     [Op.between]: [startOfMonth(new Date(year, month - 1)), endOfMonth(new Date(year, month - 1))]
//                 }
//             }
//         });

//         res.json(revenues);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };
// const { startOfYear, endOfYear } = require('date-fns');

// exports.getYearlyRevenueByCinema = async (req, res) => {
//     try {
//         const { year, cinema_id } = req.query;  // Nhận năm và cinema_id từ frontend
//         const revenues = await Ticket.findAll({
//             attributes: [
//                 [fn('SUM', col('Ticket.price')), 'yearlyRevenue']
//             ],
//             include: [{
//                 model: Showtime,
//                 as: 'showtime',
//                 attributes: [],
//                 include: [{
//                     model: Theater,
//                     as: 'theater',
//                     attributes: [],
//                     where: {
//                         cinema_id // Lọc theo rạp cụ thể
//                     }
//                 }]
//             }],
//             where: {
//                 status: 'confirmed',
//                 payment_status: 'completed',
//                 createdAt: {
//                     [Op.between]: [startOfYear(new Date(year)), endOfYear(new Date(year))]
//                 }
//             }
//         });

//         res.json(revenues);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };
// exports.getTotalDailyRevenue = async (req, res) => {
//     try {
//         const { date } = req.query;

//         const startOfDay = new Date(date);
//         const endOfDay = new Date(date);
//         endOfDay.setHours(23, 59, 59, 999);

//         const totalRevenue = await Ticket.sum('price', {
//             where: {
//                 reserved_at: {
//                     [Op.between]: [startOfDay, endOfDay]
//                 },
//                 payment_status: 'completed'
//             }
//         });

//         res.status(200).json({
//             date,
//             total_revenue: totalRevenue
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch daily revenue.' });
//     }
// };
// exports.getTotalMonthlyRevenue = async (req, res) => {
//     try {
//         const { month, year } = req.query;

//         const startOfMonth = new Date(`${year}-${month}-01`);
//         const endOfMonth = new Date(startOfMonth);
//         endOfMonth.setMonth(endOfMonth.getMonth() + 1);
//         endOfMonth.setDate(0); // Lấy ngày cuối cùng của tháng

//         const totalRevenue = await Ticket.sum('price', {
//             where: {
//                 reserved_at: {
//                     [Op.between]: [startOfMonth, endOfMonth]
//                 },
//                 payment_status: 'completed'
//             }
//         });

//         res.status(200).json({
//             month,
//             year,
//             total_revenue: totalRevenue
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch monthly revenue.' });
//     }
// };
// exports.getTotalYearlyRevenue = async (req, res) => {
//     try {
//         const { year } = req.query;

//         const startOfYear = new Date(`${year}-01-01`);
//         const endOfYear = new Date(`${year}-12-31`);

//         const totalRevenue = await Ticket.sum('price', {
//             where: {
//                 reserved_at: {
//                     [Op.between]: [startOfYear, endOfYear]
//                 },
//                 payment_status: 'completed'
//             }
//         });

//         res.status(200).json({
//             year,
//             total_revenue: totalRevenue
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch yearly revenue.' });
//     }
// };

// API doanh thu theo ngày cho từng rạp chiếu phim
exports.getDailyRevenue = async (req, res) => {
    try {
        const { cinemaId, date } = req.query;

        const revenues = await Ticket.findAll({
            attributes: [
                [sequelize.col('showtime.theater.cinema.name'), 'cinemaName'],
                [sequelize.col('showtime.theater.name'), 'theaterName'],
                [fn('SUM', col('Ticket.price')), 'totalRevenue'] // Thêm bí danh 'Ticket' cho cột price
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Theater,
                    as: 'theater',
                    attributes: [],
                    include: [{
                        model: Cinema,
                        as: 'cinema',
                        attributes: []
                    }]
                }]
            }],
            where: {
                status: 'confirmed',
                payment_status: 'completed',
                [Op.and]: [ // Sử dụng Op.and để liên kết điều kiện
                    sequelize.where(sequelize.fn('DATE', sequelize.col('Ticket.createdAt')), '=', date), // Sử dụng cột createdAt của Ticket
                    { '$showtime.theater.cinema.id$': cinemaId } // Điều kiện cho cinemaId
                ]
            },
            group: ['showtime.theater.cinema.name', 'showtime.theater.name'],
            order: [[fn('SUM', col('Ticket.price')), 'DESC']] // Thêm bí danh 'Ticket' cho cột price trong order
        });

        res.json(revenues);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const { cinemaId, month, year } = req.query;

        const revenues = await Ticket.findAll({
            attributes: [
                [sequelize.col('showtime.theater.cinema.name'), 'cinemaName'],
                [sequelize.col('showtime.theater.name'), 'theaterName'],
                [fn('SUM', col('Ticket.price')), 'totalRevenue']
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Theater,
                    as: 'theater',
                    attributes: [],
                    include: [{
                        model: Cinema,
                        as: 'cinema',
                        attributes: []
                    }]
                }]
            }],
            where: {
                status: 'confirmed',
                payment_status: 'completed',
                [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('Ticket.createdAt')), '=', month),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Ticket.createdAt')), '=', year),
                    { '$showtime.theater.cinema.id$': cinemaId }
                ]
            },
            group: ['showtime.theater.cinema.name', 'showtime.theater.name'],
            order: [[fn('SUM', col('Ticket.price')), 'DESC']]
        });

        res.json(revenues);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getYearlyRevenue = async (req, res) => {
    try {
        const { cinemaId, year } = req.query;

        const revenues = await Ticket.findAll({
            attributes: [
                [sequelize.col('showtime.theater.cinema.name'), 'cinemaName'],
                [sequelize.col('showtime.theater.name'), 'theaterName'],
                [fn('SUM', col('Ticket.price')), 'totalRevenue']
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Theater,
                    as: 'theater',
                    attributes: [],
                    include: [{
                        model: Cinema,
                        as: 'cinema',
                        attributes: []
                    }]
                }]
            }],
            where: {
                status: 'confirmed',
                payment_status: 'completed',
                [Op.and]: [
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Ticket.createdAt')), '=', year),
                    { '$showtime.theater.cinema.id$': cinemaId }
                ]
            },
            group: ['showtime.theater.cinema.name', 'showtime.theater.name'],
            order: [[fn('SUM', col('Ticket.price')), 'DESC']]
        });

        res.json(revenues);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getTotalDailyRevenue = async (req, res) => {
    try {
        const { date } = req.query; // Format: 'YYYY-MM-DD'

        const totalRevenue = await Ticket.findAll({
            attributes: [
                [fn('SUM', col('Ticket.price')), 'totalRevenue']
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Theater,
                    as: 'theater',
                    attributes: [],
                    include: [{
                        model: Cinema,
                        as: 'cinema',
                        attributes: []
                    }]
                }]
            }],
            where: {
                status: 'confirmed',
                payment_status: 'completed',
                [Op.and]: [
                    sequelize.where(sequelize.fn('DATE', sequelize.col('Ticket.createdAt')), '=', date)
                ]
            }
        });

        res.json(totalRevenue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getTotalMonthlyRevenue = async (req, res) => {
    try {
        const { month, year } = req.query;

        const totalRevenue = await Ticket.findAll({
            attributes: [
                [fn('SUM', col('Ticket.price')), 'totalRevenue']
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Theater,
                    as: 'theater',
                    attributes: [],
                    include: [{
                        model: Cinema,
                        as: 'cinema',
                        attributes: []
                    }]
                }]
            }],
            where: {
                status: 'confirmed',
                payment_status: 'completed',
                [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('Ticket.createdAt')), '=', month),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Ticket.createdAt')), '=', year)
                ]
            }
        });

        res.json(totalRevenue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getTotalYearlyRevenue = async (req, res) => {
    try {
        const { year } = req.query;

        const totalRevenue = await Ticket.findAll({
            attributes: [
                [fn('SUM', col('Ticket.price')), 'totalRevenue']
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Theater,
                    as: 'theater',
                    attributes: [],
                    include: [{
                        model: Cinema,
                        as: 'cinema',
                        attributes: []
                    }]
                }]
            }],
            where: {
                status: 'confirmed',
                payment_status: 'completed',
                [Op.and]: [
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Ticket.createdAt')), '=', year)
                ]
            }
        });

        res.json(totalRevenue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getWeeklyRevenueByMovie = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = {
            status: 'confirmed',
            payment_status: 'completed',
        };

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [startDate, endDate]
            };
        }

        const revenues = await Ticket.findAll({
            attributes: [
                [fn('SUM', col('Ticket.price')), 'totalRevenue'], // Tổng doanh thu
                [fn('COUNT', col('Ticket.id')), 'totalTickets'], // Tổng số vé
                [fn('COUNT', fn('DISTINCT', col('showtime.id'))), 'totalShowtimes'], // Tổng suất chiếu
                [fn('WEEK', col('Ticket.createdAt')), 'week'], // Tuần
                [col('showtime.movie.title'), 'movieTitle'] // Tên phim
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: [],
                include: [{
                    model: Movie,
                    as: 'movie',
                    attributes: []
                }]
            }],
            where: whereClause,
            group: ['week', 'showtime.movie.title'], // Nhóm theo tuần và tên phim
            order: [[fn('SUM', col('Ticket.price')), 'DESC']] // Sắp xếp theo tổng doanh thu
        });

        res.json(revenues);
    } catch (error) {
        console.error('Error fetching weekly movie revenue:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// API doanh thu theo suất chiếu
exports.getRevenueByShowtime = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = {
            status: 'confirmed',
            payment_status: 'completed',
        };

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [startDate, endDate]
            };
        }

        const revenues = await Ticket.findAll({
            attributes: [
                [fn('SUM', col('Ticket.price')), 'totalRevenue'], // Tổng doanh thu
                [fn('COUNT', col('Ticket.id')), 'totalTickets'], // Tổng số vé bán ra
                [col('showtime.start_time'), 'startTime'], // Thời gian bắt đầu của suất chiếu
                [col('showtime.end_time'), 'endTime'] // Thời gian kết thúc của suất chiếu
            ],
            include: [{
                model: Showtime,
                as: 'showtime',
                attributes: []
            }],
            where: whereClause,
            group: ['showtime.start_time', 'showtime.end_time'], // Nhóm theo thời gian suất chiếu
            order: [[fn('SUM', col('Ticket.price')), 'DESC']] // Sắp xếp theo doanh thu từ cao đến thấp
        });

        res.json(revenues);
    } catch (error) {
        console.error('Error fetching revenue by showtime:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};