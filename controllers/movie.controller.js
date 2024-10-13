// controllers/movieController.js

const db = require('../models');
const Movie = db.Movie;
const Genre = db.Genre;
const Showtime = db.Showtime
const Cinema = db.Cinema;
const Theater = db.Theater
const { cloudinary } = require('../config/cloudinary');
const { Op } = require('sequelize');
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
exports.getCinemasByMovie = async (req, res) => {
    const { movieId } = req.params;

    try {
        // Tìm tất cả các suất chiếu cho phim này
        const showtimes = await Showtime.findAll({
            where: { movie_id: movieId },
            include: [
                {
                    model: Theater,
                    as: 'theater',
                    include: [
                        {
                            model: Cinema,
                            as: 'cinema'
                        }
                    ]
                }
            ]
        });

        // Tổ chức dữ liệu theo rạp
        const cinemasMap = {};

        showtimes.forEach((showtime) => {
            const cinema = showtime.theater.cinema;
            if (!cinemasMap[cinema.id]) {
                cinemasMap[cinema.id] = {
                    id: cinema.id,
                    name: cinema.name,
                    location: cinema.location,
                    theaters: {}
                };
            }

            const theater = showtime.theater;
            if (!cinemasMap[cinema.id].theaters[theater.id]) {
                cinemasMap[cinema.id].theaters[theater.id] = {
                    id: theater.id,
                    name: theater.name,
                    capacity: theater.capacity,
                    showtimes: []
                };
            }

            cinemasMap[cinema.id].theaters[theater.id].showtimes.push({
                id: showtime.id,
                start_time: showtime.start_time,
                end_time: showtime.end_time,
                price: showtime.price,
                status: showtime.status
            });
        });

        // Chuyển đổi map thành mảng
        const cinemas = Object.values(cinemasMap).map((cinema) => ({
            id: cinema.id,
            name: cinema.name,
            location: cinema.location,
            theaters: Object.values(cinema.theaters)
        }));

        res.status(200).json({ status: 'success', data: cinemas });
    } catch (error) {
        console.error('Error fetching cinemas by movie:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách rạp cho phim.' });
    }
};
// exports.getCinemasByMovieApi = async (req, res) => {
//     const { movieId } = req.params;
//     const { date } = req.query;

//     if (!movieId) {
//         return res.status(400).json({ status: 'fail', message: 'Thiếu movieId.' });
//     }

//     // Nếu không có ngày được cung cấp, mặc định là hôm nay
//     const selectedDate = date ? new Date(date) : new Date();

//     try {
//         // Tìm tất cả các suất chiếu cho phim này vào ngày đã chọn
//         const showtimes = await Showtime.findAll({
//             where: {
//                 movie_id: movieId,
//                 start_time: {
//                     [Op.between]: [
//                         new Date(selectedDate.setHours(0, 0, 0, 0)),
//                         new Date(selectedDate.setHours(23, 59, 59, 999))
//                     ]
//                 }
//             },
//             include: [{
//                 model: Theater,
//                 as: 'theater',
//                 include: [{
//                     model: Cinema,
//                     as: 'Cinema'
//                 }]
//             }],
//             order: [['start_time', 'ASC']]
//         });

//         if (showtimes.length === 0) {
//             return res.status(200).json({ status: 'success', data: [] });
//         }

//         // Tổ chức dữ liệu theo rạp
//         const cinemasMap = {};

//         showtimes.forEach((showtime) => {
//             const cinema = showtime.theater.Cinema;
//             if (!cinemasMap[cinema.id]) {
//                 cinemasMap[cinema.id] = {
//                     id: cinema.id,
//                     name: cinema.name,
//                     location: cinema.location,
//                     theaters: {}
//                 };
//             }

//             const theater = showtime.theater;
//             if (!cinemasMap[cinema.id].theaters[theater.id]) {
//                 cinemasMap[cinema.id].theaters[theater.id] = {
//                     id: theater.id,
//                     name: theater.name,
//                     capacity: theater.capacity,
//                     showtimes: []
//                 };
//             }

//             cinemasMap[cinema.id].theaters[theater.id].showtimes.push({
//                 id: showtime.id,
//                 start_time: showtime.start_time,
//                 end_time: showtime.end_time,
//                 price: showtime.price,
//                 status: showtime.status
//             });
//         });

//         // Chuyển đổi map thành mảng với cấu trúc phù hợp frontend
//         const cinemas = Object.values(cinemasMap).map((cinema) => ({
//             id: cinema.id,
//             name: cinema.name,
//             location: cinema.location,
//             theaters: Object.values(cinema.theaters).map((theater) => ({
//                 id: theater.id,
//                 name: theater.name,
//                 capacity: theater.capacity,
//                 showtimes: theater.showtimes
//             }))
//         }));

//         res.status(200).json({ status: 'success', data: cinemas });
//     } catch (error) {
//         console.error('Error fetching cinemas by movie:', error);
//         res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách rạp cho phim.' });
//     }
// };
// Hàm tìm kiếm phim chỉ theo tên
exports.searchMoviesByTitle = async (req, res) => {
    try {
        // Lấy từ khóa tìm kiếm từ query string
        const { title } = req.query;
        console.log("check titile", title)
        // Kiểm tra xem từ khóa có tồn tại
        if (!title) {
            return res.status(400).json({ message: 'Please provide a valid search term (at least 1 character).' });
        }

        // Tìm kiếm phim theo tên với điều kiện LIKE
        const movies = await Movie.findAll({
            where: {
                title: {
                    [Op.like]: `%${title}%`  // Tìm kiếm theo tên phim gần đúng
                }
            }
        });

        // Trả về kết quả nếu tìm thấy phim
        if (movies.length > 0) {
            return res.status(200).json(movies);
        } else {
            return res.status(404).json({ message: 'No movies found' });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getCurrentMovies = async (req, res) => {
    try {
        const today = new Date();

        const movies = await Movie.findAll({
            include: [
                {
                    model: Genre,
                    as: 'genres', // Phải khớp với alias trong model
                    attributes: ['id', 'genre_name'],
                    through: { attributes: [] },
                },
            ],
            where: {
                release_date: { [Op.lte]: today },  // Ngày phát hành đã qua
            }
        });

        // Lọc phim đang chiếu dựa trên release_date và duration
        const currentMovies = movies.filter(movie => {
            const realeaseDate = new Date(movie.release_date);
            // endDate.setDate(endDate.getDate()); // Tính end_date bằng cách cộng duration vào release_date
            return realeaseDate <= today; // Chỉ chọn các phim có end_date sau ngày hiện tại
        });

        if (currentMovies.length > 0) {
            return res.status(200).json(currentMovies);
        } else {
            return res.status(404).json({ message: 'No current movies found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

//hàm lấy phim sắp chiếu
exports.getUpcomingMovies = async (req, res) => {
    try {
        const today = new Date();

        const movies = await Movie.findAll({
            where: {
                release_date: { [Op.gt]: today }  // Ngày phát hành trong tương lai
            }
        });

        if (movies.length > 0) {
            return res.status(200).json(movies);
        } else {
            return res.status(404).json({ message: 'No upcoming movies found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
// exports.searchMovieShowtimes = async (req, res) => {
//     try {
//         const { movieTitle, date } = req.query;

//         // Tìm kiếm phim theo tiêu đề không phân biệt chữ hoa chữ thường
//         const movie = await Movie.findOne({
//             where: {
//                 title: {
//                     [Op.like]: `%${movieTitle}%` 
//                 }
//             },
//             attributes: ['id', 'title']
//         });

//         if (!movie) {
//             return res.status(404).json({ message: 'Movie not found' });
//         }

//         // Truy vấn suất chiếu cho phim theo ngày đã chọn
//         const showtimes = await Showtime.findAll({
//             where: {
//                 movie_id: movie.id,
//                 start_time: {
//                     [Op.between]: [
//                         new Date(date).setHours(0, 0, 0, 0),
//                         new Date(date).setHours(23, 59, 59, 999)
//                     ]
//                 }
//             },
//             attributes: ['id', 'start_time', 'end_time'],
//             include: [
//                 {
//                     model: Theater,
//                     as: 'theater',
//                     attributes: ['id', 'name'],
//                     include: [
//                         {
//                             model: Cinema,
//                             as: 'cinema',
//                             attributes: ['id', 'name']
//                         }
//                     ]
//                 }
//             ]
//         });

//         res.json({
//             movieId: movie.id,
//             title: movie.title,
//             showtimes: showtimes.map(showtime => ({
//                 showtimeId: showtime.id,
//                 startTime: showtime.start_time,
//                 endTime: showtime.end_time,
//                 theater: {
//                     id: showtime.theater.id,
//                     name: showtime.theater.name,
//                     cinema: {
//                         id: showtime.theater.cinema.id,
//                         name: showtime.theater.cinema.name
//                     }
//                 }
//             }))
//         });
//     } catch (error) {
//         console.error('Error searching movie showtimes:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };
exports.searchMovieShowtimes = async (req, res) => {
    try {
        const { movieTitle, date } = req.query;

        // Tìm tất cả các phim có tiêu đề khớp với từ khóa
        const movies = await Movie.findAll({
            where: {
                title: {
                    [Op.like]: `%${movieTitle}%` // Sử dụng LIKE thay vì ILIKE
                }
            },
            attributes: ['id', 'title']
        });

        if (!movies.length) {
            return res.status(404).json({ message: 'No movies found' });
        }

        // Tạo một mảng chứa tất cả các suất chiếu cho từng phim
        const showtimesData = await Promise.all(
            movies.map(async (movie) => {
                const showtimes = await Showtime.findAll({
                    where: {
                        movie_id: movie.id,
                        start_time: {
                            [Op.between]: [
                                new Date(date).setHours(0, 0, 0, 0),
                                new Date(date).setHours(23, 59, 59, 999)
                            ]
                        }
                    },
                    attributes: ['id', 'start_time', 'end_time'],
                    include: [
                        {
                            model: Theater,
                            as: 'theater',
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: Cinema,
                                    as: 'cinema',
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ]
                });

                return {
                    movieId: movie.id,
                    title: movie.title,
                    showtimes: showtimes.map(showtime => ({
                        showtimeId: showtime.id,
                        startTime: showtime.start_time,
                        endTime: showtime.end_time,
                        theater: {
                            id: showtime.theater.id,
                            name: showtime.theater.name,
                            cinema: {
                                id: showtime.theater.cinema.id,
                                name: showtime.theater.cinema.name
                            }
                        }
                    }))
                };
            })
        );

        res.json(showtimesData);
    } catch (error) {
        console.error('Error searching movie showtimes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};