// routes/admin.routes.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    registerStaff,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUsersByRole,
    getTotalDailyRevenue,
    getTotalMonthlyRevenue,
    getTotalYearlyRevenue,
    getDailyRevenue,
    getMonthlyRevenue,
    getYearlyRevenue,
    getWeeklyRevenueByMovie,
    getRevenueByShowtime,
} = require('../controllers/admin.controller');
const movieController = require('../controllers/movie.controller');
const showtimeController = require('../controllers/showtime.controller')
const genreController = require('../controllers/genre.controller');
const theaterController = require('../controllers/theater.controller');
const seatController = require('../controllers/seat.controller');
const ticketController = require('../controllers/ticket.controller');
const cinemaController = require('../controllers/cinema.controller');
const seatCategoryController = require('../controllers/seatcategory.controller');
const userController = require('../controllers/user.controller')
const { upload } = require('../config/cloudinary'); // Import middleware upload từ cloudinary.js
const upload1 = require('../config/multer');  // import middleware upload tu multer
const router = express.Router();
 /*Phần upload ảnh người dùng đc upload trong thư mục dự án này 
 còn phần ảnh poster phim, video , ảnh rạp chiếu đc lưu trên cloudiary */
// Chỉ admin (role_id = 1) mới có quyền truy cập

// Quản lý người dùng
// Route để admin đăng ký nhân viên (staff) hoặc admin
router.post(
    '/register-staff',
    protect,
    restrictTo(1),
    upload1.fields([{ name: 'image', maxCount: 1 }]),
    upload1.afterUpload,  
    registerStaff
);

// Route để admin lấy danh sách tất cả người dùng
router.get('/users', protect, restrictTo(1), getAllUsers);

// Route để admin lấy danh sách người dùng theo vai trò
router.get('/users-by-role', protect, restrictTo(1), getUsersByRole);

// Route để admin lấy thông tin chi tiết của một người dùng theo ID
router.get('/users/:id', protect, restrictTo(1), getUserById);

// Route để admin cập nhật thông tin của một người dùng
router.put(
    '/users/:id',
    protect,
    restrictTo(1),
    upload1.fields([{ name: 'image', maxCount: 1 }]),
    upload1.afterUpload,  
    updateUser
);

// Route để admin xóa người dùng
router.delete('/users/:id', protect, restrictTo(1), deleteUser);
router.get('/get-users', userController.getUsers );
// Quản lý phim
// Route để tạo phim mới, bao gồm upload poster và trailer
router.post(
    '/movies',
    protect,
    restrictTo(1),
    upload.fields([
        { name: 'poster', maxCount: 1 },
        { name: 'trailer', maxCount: 1 },
    ]),
    movieController.createMovie
);

// Route để cập nhật phim, bao gồm upload poster và trailer nếu cần
router.put(
    '/movies/:id',
    protect,
    restrictTo(1),
    upload.fields([
        { name: 'poster', maxCount: 1 },
        { name: 'trailer', maxCount: 1 },
    ]),
    movieController.updateMovie
);

// Route để xóa phim
router.delete('/movies/:id', protect, restrictTo(1), movieController.deleteMovie);

// Route để lấy danh sách tất cả phim
router.get('/movies', movieController.getAllMovies);

// Quản lý thể loại phim
router.post('/genres', protect, restrictTo(1), genreController.createGenre);
router.put('/genres/:id', protect, restrictTo(1), genreController.updateGenre);
router.delete('/genres/:id', protect, restrictTo(1), genreController.deleteGenre);
router.get('/genres', genreController.getAllGenres);

// Quản lý suất chiếu
// 1. Lấy danh sách suất chiếu với phân trang, sắp xếp và tìm kiếm
router.get('/showtimes', showtimeController.getShowtimes);

// 2. Lấy một suất chiếu theo ID
router.get('/showtimes/:showtimeId', showtimeController.getShowtimeById);

// 3. Tạo mới một suất chiếu
router.post('/showtimes', protect, restrictTo(1), showtimeController.createShowtime);

// 4. Cập nhật một suất chiếu
router.put('/showtimes/:showtimeId', protect, restrictTo(1), showtimeController.updateShowtime);

// 5. Xóa một suất chiếu
router.delete('/showtimes/:showtimeId', protect, restrictTo(1), showtimeController.deleteShowtime);

// Quản lý phòng chiếu
router.post('/cinemas/:cinemaId/theaters', protect, restrictTo(1), theaterController.createTheater);
router.put('/theaters/:id', protect, restrictTo(1), theaterController.updateTheater);
router.delete('/theaters/:id', protect, restrictTo(1), theaterController.deleteTheater);
router.get(
    '/cinemas/:cinemaId/theaters',
    protect,
    restrictTo(1),
    theaterController.getTheatersByCinema
);
// Quản lý rạp chiếu phim
router.post('/cinemas', protect, restrictTo(1), upload.single('image'), cinemaController.createCinema);
router.put('/cinemas/:id', protect, restrictTo(1), upload.single('image'), cinemaController.updateCinema);
router.delete('/cinemas/:id', protect, restrictTo(1), cinemaController.deleteCinema);
router.get('/cinemas', cinemaController.getCinemas);

// Quản lý ghế ngồi
router.post('/theaters/:theaterId/seats', protect, restrictTo(1), seatController.createSeat);
router.put('/theaters/:theaterId/seats/:seatId', protect, restrictTo(1), seatController.updateSeat);
router.delete('/theaters/:theaterId/seats/:seatId', protect, restrictTo(1), seatController.deleteSeat);
// Route lấy danh sách ghế cho người dùng (tất cả ghế, không phân trang)
router.get('/theaters/:theaterId/seats', seatController.getSeatsByTheater);
// Route lấy danh sách ghế với phân trang cho quản trị viên
router.get('/theaters/:theaterId/seats/admin', seatController.getSeatsByTheaterAdmin);


// Lấy danh sách vé
// router.get('/tickets', ticketController.getTickets);
router.get('/tickets', ticketController.getTicketsForAdmin);
// Route để hủy vé
router.patch('/tickets/:ticketId/cancel', ticketController.cancelTicket);

// Quản lý danh mục ghế ngồi
// Thêm danh mục ghế ngồi
router.post('/seat-categories', protect, restrictTo(1), seatCategoryController.createSeatCategory);

// Sửa danh mục ghế ngồi
router.put('/seat-categories/:id', protect, restrictTo(1), seatCategoryController.updateSeatCategory);

// Xóa danh mục ghế ngồi
router.delete('/seat-categories/:id', protect, restrictTo(1), seatCategoryController.deleteSeatCategory);


// Route doanh thu theo ngày
router.get('/revenue/daily', getDailyRevenue);
// Route doanh thu theo tháng
router.get('/revenue/monthly', getMonthlyRevenue);

// Route doanh thu theo năm
router.get('/revenue/yearly', getYearlyRevenue);

router.get('/revenue/total/daily', getTotalDailyRevenue);

router.get('/revenue/total/monthly', getTotalMonthlyRevenue);

router.get('/revenue/total/yearly', getTotalYearlyRevenue);

router.get('/revenue/movies/weekly', getWeeklyRevenueByMovie);

router.get('/revenue/showtimes', getRevenueByShowtime);

module.exports = router;
