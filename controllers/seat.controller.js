// controllers/seat.controller.js
const Seat  = require('../models/Seat');

// Thêm ghế ngồi
exports.createSeat = async (req, res) => {
    try {
        const seat = await Seat.create(req.body);
        res.status(201).json({ status: 'success', data: seat });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Sửa ghế ngồi
exports.updateSeat = async (req, res) => {
    try {
        const seat = await Seat.findByPk(req.params.id);
        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }
        await seat.update(req.body);
        res.status(200).json({ status: 'success', data: seat });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xóa ghế ngồi
exports.deleteSeat = async (req, res) => {
    try {
        const seat = await Seat.findByPk(req.params.id);
        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }
        await seat.destroy();
        res.status(204).json({ status: 'success' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
exports.updateSeatStatus = async (req, res) => {
    try {
        const seat = await Seat.findByPk(req.params.id);
        if (!seat) {
            return res.status(404).json({
                status: 'fail',
                message: 'Ghế không tồn tại'
            });
        }
        seat.status = req.body.status; // Ví dụ: "available", "reserved", "booked"
        await seat.save();
        res.status(200).json({
            status: 'success',
            data: { seat }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
