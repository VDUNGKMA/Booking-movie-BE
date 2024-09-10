// controllers/genre.controller.js
const  Genre  = require('../models/Genre');

// Thêm thể loại phim
exports.createGenre = async (req, res) => {
    try {
        const genre = await Genre.create(req.body);
        res.status(201).json({ status: 'success', data: genre });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Sửa thể loại phim
exports.updateGenre = async (req, res) => {
    try {
        const genre = await Genre.findByPk(req.params.id);
        if (!genre) {
            return res.status(404).json({ status: 'fail', message: 'Thể loại phim không tồn tại!' });
        }
        await genre.update(req.body);
        res.status(200).json({ status: 'success', data: genre });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xóa thể loại phim
exports.deleteGenre = async (req, res) => {
    try {
        const genre = await Genre.findByPk(req.params.id);
        if (!genre) {
            return res.status(404).json({ status: 'fail', message: 'Thể loại phim không tồn tại!' });
        }
        await genre.destroy();
        res.status(204).json({ status: 'success' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
