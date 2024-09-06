// controllers/admin.controller.js
const Movie = require('../models/movie');

// Tạo phim mới
exports.createMovie = async (req, res) => {
    try {
        const { title, description, duration, release_date } = req.body;

        const newMovie = await Movie.create({
            title,
            description,
            duration,
            release_date
        });

        res.status(201).json({
            status: 'success',
            data: {
                movie: newMovie
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Cập nhật phim
exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, duration, release_date } = req.body;

        const movie = await Movie.findByPk(id);
        if (!movie) {
            return res.status(404).json({
                status: 'fail',
                message: 'Movie not found'
            });
        }

        movie.title = title || movie.title;
        movie.description = description || movie.description;
        movie.duration = duration || movie.duration;
        movie.release_date = release_date || movie.release_date;

        await movie.save();

        res.status(200).json({
            status: 'success',
            data: {
                movie
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Xóa phim
exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;

        const movie = await Movie.findByPk(id);
        if (!movie) {
            return res.status(404).json({
                status: 'fail',
                message: 'Movie not found'
            });
        }

        await movie.destroy();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};
