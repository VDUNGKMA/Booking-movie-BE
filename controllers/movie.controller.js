// controllers/movie.controller.js
const  Movie  = require('../models/movie');

// Thêm phim
exports.createMovie = async (req, res) => {
    try {
        const movie = await Movie.create(req.body);
        res.status(201).json({ status: 'success', data: movie });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Sửa phim
exports.updateMovie = async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại!' });
        }
        await movie.update(req.body);
        res.status(200).json({ status: 'success', data: movie });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xóa phim
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại!' });
        }
        await movie.destroy();
        res.status(204).json({ status: 'success' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.findAll();
        res.status(200).json({
            status: 'success',
            data: { movies }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
exports.getMovie = async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({
                status: 'fail',
                message: 'Phim không tồn tại'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { movie }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};