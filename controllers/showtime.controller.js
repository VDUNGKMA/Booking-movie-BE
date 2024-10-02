

// controllers/showtime.controller.js

const { Op } = require('sequelize');
const db = require('../models');
const Showtime = db.Showtime;
const Theater = db.Theater;
const Movie = db.Movie;
const Cinema = db.Cinema;
// **1. Lấy Danh Sách Suất Chiếu với Phân Trang, Sắp Xếp và Tìm Kiếm**
exports.getShowtimes = async (req, res) => {
    try {
        let { page, limit, sortField, sortOrder, search, theaterId, minPrice, maxPrice } = req.query;

        // Thiết lập giá trị mặc định
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortField = sortField || 'start_time';
        sortOrder = sortOrder ? sortOrder.toUpperCase() : 'ASC';
        search = search || '';
        theaterId = theaterId || null;
        minPrice = minPrice || null;
        maxPrice = maxPrice || null;

        const offset = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        const whereCondition = {};

        if (theaterId) {
            whereCondition.theater_id = theaterId;
        }

        if (search) {
            whereCondition[Op.or] = [
                { '$movie.title$': { [Op.like]: `%${search}%` } },
                { '$theater.name$': { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
            ];
        }

        if (minPrice !== null || maxPrice !== null) {
            whereCondition.price = {};
            if (minPrice !== null) {
                whereCondition.price[Op.gte] = parseFloat(minPrice);
            }
            if (maxPrice !== null) {
                whereCondition.price[Op.lte] = parseFloat(maxPrice);
            }
        }

        // Tổng số suất chiếu thỏa điều kiện
        const totalShowtimes = await Showtime.count({
            where: search || theaterId || minPrice || maxPrice ? whereCondition : {},
            include: [
                { model: Movie, as: 'movie', attributes: ['title'] },
                { model: Theater, as: 'theater', attributes: ['name'] }
            ]
        });

        // Lấy danh sách suất chiếu
        const showtimes = await Showtime.findAll({
            where: search || theaterId || minPrice || maxPrice ? whereCondition : { theater_id: theaterId },
            include: [
                { model: Movie, as: 'movie', attributes: ['title'] },
                { model: Theater, as: 'theater', attributes: ['name'] }
            ],
            order: [[sortField, sortOrder]],
            limit: limit,
            offset: offset
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalShowtimes,
                currentPage: page,
                totalPages: Math.ceil(totalShowtimes / limit),
                showtimes
            }
        });
    } catch (error) {
        console.error('Error in getShowtimes:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách suất chiếu.' });
    }
};

// **2. Lấy Một Suất Chiếu Theo ID**
exports.getShowtimeById = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        const showtime = await Showtime.findByPk(showtimeId, {
            include: [
                { model: Movie, as: 'movie', attributes: ['title'] },
                { model: Theater, as: 'theater', attributes: ['name'] }
            ]
        });

        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy suất chiếu.' });
        }

        res.status(200).json({ status: 'success', data: showtime });
    } catch (error) {
        console.error('Error in getShowtimeById:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy suất chiếu.' });
    }
};

// **3. Tạo Một Suất Chiếu Mới**
exports.createShowtime = async (req, res) => {
    try {
        const { theater_id, movie_id, start_time, end_time, status, price } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!theater_id || !movie_id || !start_time || !end_time || price === undefined) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin, bao gồm giá.' });
        }

        // Kiểm tra giá
        if (isNaN(price) || Number(price) < 0) {
            return res.status(400).json({ status: 'fail', message: 'Giá phải là một số dương.' });
        }

        // Kiểm tra sự tồn tại của phòng chiếu và phim
        const theater = await Theater.findByPk(theater_id);
        const movie = await Movie.findByPk(movie_id);

        if (!theater || !movie) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu hoặc phim không tồn tại.' });
        }

        // Kiểm tra thời gian bắt đầu phải trước thời gian kết thúc
        if (new Date(start_time) >= new Date(end_time)) {
            return res.status(400).json({ status: 'fail', message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' });
        }

        const newShowtime = await Showtime.create({
            theater_id,
            movie_id,
            start_time,
            end_time,
            status: status || 'Scheduled',
            price
        });

        res.status(201).json({ status: 'success', data: newShowtime });
    } catch (error) {
        console.error('Error in createShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi tạo suất chiếu.' });
    }
};

// **4. Cập Nhật Một Suất Chiếu**
exports.updateShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const { theater_id, movie_id, start_time, end_time, status, price } = req.body;

        const showtime = await Showtime.findByPk(showtimeId);
        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy suất chiếu.' });
        }

        // Nếu cập nhật theater hoặc movie, kiểm tra sự tồn tại
        if (theater_id) {
            const theater = await Theater.findByPk(theater_id);
            if (!theater) {
                return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại.' });
            }
        }

        if (movie_id) {
            const movie = await Movie.findByPk(movie_id);
            if (!movie) {
                return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại.' });
            }
        }

        // Nếu cập nhật thời gian, kiểm tra tính hợp lệ
        if (start_time && end_time) {
            if (new Date(start_time) >= new Date(end_time)) {
                return res.status(400).json({ status: 'fail', message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' });
            }
        } else if (start_time && showtime.end_time) {
            if (new Date(start_time) >= new Date(showtime.end_time)) {
                return res.status(400).json({ status: 'fail', message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' });
            }
        } else if (end_time && showtime.start_time) {
            if (new Date(showtime.start_time) >= new Date(end_time)) {
                return res.status(400).json({ status: 'fail', message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
            }
        }

        // Nếu cập nhật giá, kiểm tra tính hợp lệ
        if (price !== undefined) {
            if (isNaN(price) || Number(price) < 0) {
                return res.status(400).json({ status: 'fail', message: 'Giá phải là một số dương.' });
            }
        }

        // Cập nhật suất chiếu
        await showtime.update({
            theater_id: theater_id || showtime.theater_id,
            movie_id: movie_id || showtime.movie_id,
            start_time: start_time || showtime.start_time,
            end_time: end_time || showtime.end_time,
            status: status || showtime.status,
            price: price !== undefined ? price : showtime.price
        });

        res.status(200).json({ status: 'success', data: showtime });
    } catch (error) {
        console.error('Error in updateShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi cập nhật suất chiếu.' });
    }
};

// **5. Xóa Một Suất Chiếu**
exports.deleteShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        const showtime = await Showtime.findByPk(showtimeId);
        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy suất chiếu.' });
        }

        await showtime.destroy();

        res.status(200).json({ status: 'success', message: 'Xóa suất chiếu thành công.' });
    } catch (error) {
        console.error('Error in deleteShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi xóa suất chiếu.' });
    }
};

// const dayjs = require('dayjs');
// const utc = require('dayjs/plugin/utc');
// const timezone = require('dayjs/plugin/timezone');
// // Kích hoạt các plugin
// dayjs.extend(utc);
// dayjs.extend(timezone);
// exports.getShowtimesCustomer = async (req, res) => {
//     const movieId = req.params.movieId;
//     const date = req.query.date; // Có thể lọc theo ngày

//     try {
//         const whereClause = {};
//         if (date) {
//             const startOfDay = new Date(`${date}T00:00:00`);
//             const endOfDay = new Date(`${date}T23:59:59`);
//             whereClause.start_time = {
//                 [Op.between]: [startOfDay, endOfDay]
//             };
//         }

//         const showtimes = await Showtime.findAll({
//             where: {
//                 movie_id: movieId,
//                 ...whereClause
//             },
//             include: [
//                 {
//                     model: Theater,
//                     as: 'theater',
//                     include: [
//                         {
//                             model: Cinema,
//                             as: 'cinema'
//                         }
//                     ]
//                 },
//                 {
//                     model: Movie,
//                     as: 'movie',
//                     attributes: ['title'] // Lấy thêm thông tin tiêu đề phim nếu cần
//                 }
//             ]
//         });
//         // Chuyển đổi thời gian từ UTC sang múi giờ 'Asia/Ho_Chi_Minh'
//         const convertedShowtimes = showtimes.map(showtime => ({
//             ...showtime.toJSON(),
//             start_time: dayjs(showtime.start_time).tz('Asia/Ho_Chi_Minh').format(),
//             end_time: dayjs(showtime.end_time).tz('Asia/Ho_Chi_Minh').format()
//         }));
//         res.json(convertedShowtimes);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi server' });
//     }
// };
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
// Kích hoạt các plugin
dayjs.extend(utc);
dayjs.extend(timezone);

exports.getShowtimesCustomer = async (req, res) => {
    const movieId = req.params.movieId;
    const date = req.query.date; // Có thể lọc theo ngày

    try {
        // Lấy thời gian hiện tại theo múi giờ 'Asia/Ho_Chi_Minh'
        const currentTime = dayjs().tz('Asia/Ho_Chi_Minh').toDate();

        const whereClause = {
            movie_id: movieId,
            end_time: { // Thêm điều kiện end_time > current time
                [Op.gt]: currentTime
            }
        };

        if (date) {
            const startOfDay = dayjs(date).startOf('day').toDate(); // Bắt đầu ngày
            const endOfDay = dayjs(date).endOf('day').toDate(); // Kết thúc ngày
            whereClause.start_time = {
                [Op.between]: [startOfDay, endOfDay]
            };
        }

        const showtimes = await Showtime.findAll({
            where: whereClause,
            include: [
                {
                    model: Theater,
                    as: 'theater',
                    include: [
                        {
                            model: db.Cinema, // Đảm bảo model Cinema được định nghĩa và liên kết đúng
                            as: 'cinema'
                        }
                    ]
                },
                {
                    model: Movie,
                    as: 'movie',
                    attributes: ['title'] // Lấy thêm thông tin tiêu đề phim nếu cần
                }
            ],
            order: [['start_time', 'ASC']] // Sắp xếp theo thời gian bắt đầu tăng dần
        });

        // Chuyển đổi thời gian từ UTC sang múi giờ 'Asia/Ho_Chi_Minh'
        const convertedShowtimes = showtimes.map(showtime => ({
            ...showtime.toJSON(),
            start_time: dayjs(showtime.start_time).tz('Asia/Ho_Chi_Minh').format(),
            end_time: dayjs(showtime.end_time).tz('Asia/Ho_Chi_Minh').format()
        }));

        res.json(convertedShowtimes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};