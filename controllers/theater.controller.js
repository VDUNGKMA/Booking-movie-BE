// controllers/theater.controller.js

const db = require('../models');
const Theater = db.Theater;
const Cinema = db.Cinema;

// Tạo phòng chiếu mới cho một rạp
exports.createTheater = async (req, res) => {
    try {
        const { name, capacity } = req.body;
        const cinemaId = req.params.cinemaId;

        // Kiểm tra rạp chiếu phim tồn tại
        const cinema = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }

        // Tạo phòng chiếu mới
        const theater = await Theater.create({
            name,
            capacity,
            cinema_id: cinemaId,
        });

        res.status(201).json({ status: 'success', data: theater });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Cập nhật thông tin phòng chiếu
exports.updateTheater = async (req, res) => {
    try {
        const theaterId = req.params.id;
        const { name, capacity } = req.body;

        // Tìm phòng chiếu cần cập nhật
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Cập nhật thông tin
        await theater.update({ name, capacity });

        res.status(200).json({ status: 'success', data: theater });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Xóa phòng chiếu
exports.deleteTheater = async (req, res) => {
    try {
        const theaterId = req.params.id;

        // Tìm phòng chiếu cần xóa
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Xóa phòng chiếu
        await theater.destroy();

        res.status(200).json({ status: 'success', message: 'Xóa phòng chiếu thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Lấy danh sách phòng chiếu của một rạp
exports.getTheatersByCinema = async (req, res) => {
    try {
        const cinemaId = req.params.cinemaId;

        // Kiểm tra rạp chiếu phim tồn tại
        const cinema = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }

        // Lấy danh sách phòng chiếu
        const theaters = await Theater.findAll({
            where: { cinema_id: cinemaId },
        });

        res.status(200).json({ status: 'success', data: theaters });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};
