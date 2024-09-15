// controllers/movie.controller.js
const Movie = require('../models/movie');
const { cloudinary } = require('../config/cloudinary');
// Thêm phim
// exports.createMovie = async (req, res) => {
//     try {
//         const movie = await Movie.create(req.body);
//         res.status(201).json({ status: 'success', data: movie });
//     } catch (error) {
//         res.status(400).json({ status: 'fail', message: error.message });
//     }
// };
// Controller để tạo phim và tải ảnh, video lên Cloudinary
exports.createMovie = async (req, res) => {
    try {
        const { title, description, release_date, duration, director, rating } = req.body;

        // Lấy URL của poster và trailer từ Cloudinary
        const poster_url = req.files['poster'] ? req.files['poster'][0].path : null;
        const trailer_url = req.files['trailer'] ? req.files['trailer'][0].path : null;

        // Tạo phim mới với poster và trailer URL
        const movie = await Movie.create({
            title,
            description,
            release_date,
            duration,
            director,
            rating,
            poster_url,
            trailer_url,
        });

        res.status(201).json({
            status: 'success',
            data: {
                movie,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
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
        const movie = await Movie.findByPk(req.query.id);
        if (!movie) {
            return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại!' });
        }
        await movie.destroy();
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
exports.getAllMovies = async (req, res) => {
    try {
        console.log("test1")
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