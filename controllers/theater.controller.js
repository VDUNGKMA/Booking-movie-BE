// controllers/theater.controller.js
const Theater  = require('../models/Theater');

// Thêm phòng chiếu
exports.createTheater = async (req, res) => {
    try {
        const theater = await Theater.create(req.body);
        res.status(201).json({ status: 'success', data: theater });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Sửa phòng chiếu
exports.updateTheater = async (req, res) => {
    try {
        const theater = await Theater.findByPk(req.params.id);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }
        await theater.update(req.body);
        res.status(200).json({ status: 'success', data: theater });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xóa phòng chiếu
exports.deleteTheater = async (req, res) => {
    try {
        const theater = await Theater.findByPk(req.params.id);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }
        await theater.destroy();
        res.status(204).json({ status: 'success' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
