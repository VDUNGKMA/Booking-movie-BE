// controllers/cinema.controller.js
const Cinema  = require('../models/Cinema');

// Thêm rạp chiếu phim
exports.createCinema = async (req, res) => {
    try {
        const cinema = await Cinema.create(req.body);
        res.status(201).json({ status: 'success', data: cinema });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Sửa rạp chiếu phim
exports.updateCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findByPk(req.params.id);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }
        await cinema.update(req.body);
        res.status(200).json({ status: 'success', data: cinema });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xóa rạp chiếu phim
exports.deleteCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findByPk(req.params.id);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }
        await cinema.destroy();
        res.status(204).json({ status: 'success' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Lấy danh sách rạp chiếu phim
exports.getCinemas = async (req, res) => {
    try {
        const cinemas = await Cinema.findAll();
        res.status(200).json({ status: 'success', data: cinemas });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
