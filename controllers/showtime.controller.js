// controllers/showtime.controller.js

const db = require('../models');
const Showtime = db.Showtime;
const Theater = db.Theater;
const Movie = db.Movie;
const { Op } = require('sequelize');

// Lấy danh sách các suất chiếu với phân trang
exports.getShowtimes = async (req, res) => {
    try {
        const { theaterId } = req.params;
        let { page, limit, sortField, sortOrder, search } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortField = sortField || 'start_time';
        sortOrder = sortOrder ? sortOrder.toUpperCase() : 'ASC';
        search = search || '';

        const offset = (page - 1) * limit;

        const totalShowtimes = await Showtime.count({
            where: {
                theater_id: theaterId,
                [Op.or]: [
                    { '$movie.title$': { [Op.like]: `%${search}%` } },
                    { '$theater.name$': { [Op.like]: `%${search}%` } }
                ]
            },
            include: [
                { model: Movie, as: 'movie', attributes: ['title'] },
                { model: Theater, as: 'theater', attributes: ['name'] }
            ]
        });

        const showtimes = await Showtime.findAll({
            where: {
                theater_id: theaterId,
                [Op.or]: [
                    { '$movie.title$': { [Op.like]: `%${search}%` } },
                    { '$theater.name$': { [Op.like]: `%${search}%` } }
                ]
            },
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
exports.getShowtimesByTheater = async (req, res) => {
    try {
        const { theaterId } = req.params;
        let { page, limit, sortField, sortOrder, search } = req.query;

        // Thiết lập giá trị mặc định
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortField = sortField || 'start_time';
        sortOrder = sortOrder ? sortOrder.toUpperCase() : 'ASC';
        search = search || '';

        const offset = (page - 1) * limit;

        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy phòng chiếu.' });
        }

        // Tạo điều kiện tìm kiếm
        const whereCondition = {
            theater_id: theaterId,
            [Op.or]: [
                { '$movie.title$': { [Op.like]: `%${search}%` } },
                { '$theater.name$': { [Op.like]: `%${search}%` } }
            ]
        };

        // Tổng số suất chiếu
        const totalShowtimes = await Showtime.count({
            where: search ? whereCondition : { theater_id: theaterId },
            include: [
                { model: Movie, as: 'movie', attributes: ['title'] },
                { model: Theater, as: 'theater', attributes: ['name'] }
            ]
        });

        // Lấy danh sách suất chiếu
        const showtimes = await Showtime.findAll({
            where: search ? whereCondition : { theater_id: theaterId },
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
        console.error('Error in getShowtimesByTheater:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách suất chiếu.' });
    }
};
// Lấy chi tiết một suất chiếu
exports.getShowtimeById = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        const showtime = await Showtime.findByPk(showtimeId, {
            include: [
                { model: Movie, as: 'movie' },
                { model: Theater, as: 'theater' }
            ]
        });
console.log("check showtime", showtime)
        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy suất chiếu.' });
        }

        res.status(200).json({ status: 'success', data: showtime });
    } catch (error) {
        console.error('Error in getShowtimeById:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy chi tiết suất chiếu.' });
    }
};

// Tạo mới một suất chiếu
exports.createShowtime = async (req, res) => {
    try {
        const { theater_id, movie_id, start_time, end_time, status } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!theater_id || !movie_id || !start_time || !end_time) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin.' });
        }

        // Kiểm tra xem phòng chiếu và phim có tồn tại không
        const theater = await Theater.findByPk(theater_id);
        const movie = await Movie.findByPk(movie_id);

        if (!theater || !movie) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu hoặc phim không tồn tại.' });
        }

        const newShowtime = await Showtime.create({
            theater_id,
            movie_id,
            start_time,
            end_time,
            status: status || 'Scheduled'
        });

        res.status(201).json({ status: 'success', data: newShowtime });
    } catch (error) {
        console.error('Error in createShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi tạo suất chiếu.' });
    }
};

// Cập nhật một suất chiếu
exports.updateShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const { theater_id, movie_id, start_time, end_time, status } = req.body;

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

        await showtime.update({
            theater_id: theater_id || showtime.theater_id,
            movie_id: movie_id || showtime.movie_id,
            start_time: start_time || showtime.start_time,
            end_time: end_time || showtime.end_time,
            status: status || showtime.status
        });

        res.status(200).json({ status: 'success', data: showtime });
    } catch (error) {
        console.error('Error in updateShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi cập nhật suất chiếu.' });
    }
};

// Xóa một suất chiếu
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
