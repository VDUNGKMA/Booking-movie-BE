// controllers/movieController.js

const db = require('../models');
const Movie = db.Movie;
const Genre = db.Genre;

const { cloudinary } = require('../config/cloudinary');

// Controller để tạo phim và tải ảnh, video lên Cloudinary
exports.createMovie = async (req, res) => {
    try {
        const { title, description, release_date, duration, director, rating } = req.body;

        // Lấy URL của poster và trailer từ Cloudinary
        const poster_url = req.files['poster'] ? req.files['poster'][0].path : null;
        const trailer_url = req.files['trailer'] ? req.files['trailer'][0].path : null;

        // Lấy public_id của poster và trailer từ Cloudinary
        const poster_public_id = req.files['poster'] ? req.files['poster'][0].filename : null;
        const trailer_public_id = req.files['trailer'] ? req.files['trailer'][0].filename : null;

        // Tạo phim mới
        const movie = await Movie.create({
            title,
            description,
            release_date,
            duration,
            director,
            rating,
            poster_url,
            trailer_url,
            poster_public_id,
            trailer_public_id,
        });

        // Nhận danh sách thể loại từ req.body
        let genreIds = req.body.genres;
        console.log("chek id",genreIds)
        if (typeof genreIds === 'string') {
            genreIds = JSON.parse(genreIds);
        }

        // Gắn thể loại cho phim
        if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
            const genres = await Genre.findAll({
                where: { id: genreIds },
            });
            console.log("check genres",genres)
            // Kiểm tra xem tất cả các thể loại có tồn tại không
            if (genres.length !== genreIds.length) {
                return res.status(400).json({ status: 'fail', message: 'One or more genres not found' });
            }

            await movie.addGenres(genres);
        }

        res.status(201).json({
            status: 'success',
            data: {
                movie,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Internal Server Error' });
    }
};

// Cập nhật thông tin phim
exports.updateMovie = async (req, res) => {
    try {
        const movieId = req.params.id;

        // Tìm phim cần cập nhật
        const movie = await Movie.findByPk(movieId);

        if (!movie) {
            return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại' });
        }

        // Cập nhật các thuộc tính của phim
        const {
            title,
            description,
            release_date,
            duration,
            director,
            rating,
        } = req.body;

        // Lấy URL và public_id của poster và trailer từ Cloudinary (nếu có file mới)
        let poster_url = movie.poster_url;
        let trailer_url = movie.trailer_url;
        let poster_public_id = movie.poster_public_id;
        let trailer_public_id = movie.trailer_public_id;

        if (req.files && req.files['poster']) {
            // Xóa poster cũ trên Cloudinary nếu có
            if (poster_public_id) {
                await cloudinary.uploader.destroy(poster_public_id, { resource_type: 'image' });
            }

            // Lấy thông tin poster mới
            poster_url = req.files['poster'][0].path;
            poster_public_id = req.files['poster'][0].filename;
        }

        if (req.files && req.files['trailer']) {
            // Xóa trailer cũ trên Cloudinary nếu có
            if (trailer_public_id) {
                await cloudinary.uploader.destroy(trailer_public_id, { resource_type: 'video' });
            }

            // Lấy thông tin trailer mới
            trailer_url = req.files['trailer'][0].path;
            trailer_public_id = req.files['trailer'][0].filename;
        }

        // Cập nhật thông tin phim
        await movie.update({
            title,
            description,
            release_date,
            duration,
            director,
            rating,
            poster_url,
            trailer_url,
            poster_public_id,
            trailer_public_id,
        });

        // Xử lý cập nhật danh sách thể loại (genres)
        let genreIds = req.body.genres;

        if (typeof genreIds === 'string') {
            genreIds = JSON.parse(genreIds);
        }

        // Kiểm tra nếu genres là một mảng
        if (genreIds && Array.isArray(genreIds)) {
            // Tìm các thể loại tương ứng
            const genres = await Genre.findAll({
                where: { id: genreIds },
            });

            // Kiểm tra xem tất cả các genreIds có tồn tại không
            if (genres.length !== genreIds.length) {
                return res.status(400).json({ status: 'fail', message: 'Một hoặc nhiều thể loại không tồn tại' });
            }

            // Cập nhật quan hệ giữa phim và thể loại
            await movie.setGenres(genres);
        }

        // Lấy thông tin phim cập nhật cùng với các thể loại
        const updatedMovie = await Movie.findByPk(movieId, {
            include: [
                {
                    model: Genre,
                    as: 'genres',
                    attributes: ['id', 'genre_name'],
                    through: { attributes: [] },
                },
            ],
        });

        res.status(200).json({ status: 'success', data: updatedMovie });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Xóa phim
exports.deleteMovie = async (req, res) => {
    try {
        const movieId = req.params.id;
        const movie = await Movie.findByPk(movieId);

        if (!movie) {
            return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại!' });
        }
        // await movie.setGenres([]); // Loại bỏ tất cả các thể loại liên kết với phim
        // Xóa poster và trailer trên Cloudinary nếu có
        if (movie.poster_public_id) {
            await cloudinary.uploader.destroy(movie.poster_public_id, { resource_type: 'image' });
        }
        if (movie.trailer_public_id) {
            await cloudinary.uploader.destroy(movie.trailer_public_id, { resource_type: 'video' });
        }

        await movie.destroy();

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: error.message });
    }
};

// Lấy danh sách tất cả phim
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.findAll({
            include: [
                {
                    model: Genre,
                    as: 'genres', // Phải khớp với alias trong model
                    attributes: ['id', 'genre_name'],
                    through: { attributes: [] },
                },
            ],
        });

        res.status(200).json({
            status: 'success',
            data: { movies },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'fail',
            message: error.message,
        });
    }
};

// Lấy thông tin phim theo ID
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id, {
            include: [
                {
                    model: Genre,
                    as: 'genres',
                    attributes: ['id', 'genre_name'],
                    through: { attributes: [] },
                },
            ],
        });

        if (!movie) {
            return res.status(404).json({ status: 'fail', message: 'Phim không tồn tại' });
        }

        res.status(200).json({ status: 'success', data: movie });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};
