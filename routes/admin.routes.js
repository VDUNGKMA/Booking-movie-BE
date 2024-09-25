// routes/admin.routes.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    registerStaff,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getRevenue,
    getUsersByRole,
} = require('../controllers/admin.controller');
const movieController = require('../controllers/movie.controller');
const showtimeController = require('../controllers/showtime.controller')
const genreController = require('../controllers/genre.controller');
const screeningController = require('../controllers/screening.controller');
const theaterController = require('../controllers/theater.controller');
const seatController = require('../controllers/seat.controller');
const ticketController = require('../controllers/ticket.controller');
const paymentController = require('../controllers/payment.controller');
const cinemaController = require('../controllers/cinema.controller');
const seatCategoryController = require('../controllers/seatcategory.controller');
const userController = require('../controllers/user.controller')
const { upload } = require('../config/cloudinary'); // Import middleware upload từ cloudinary.js

const router = express.Router();

// Chỉ admin (role_id = 1) mới có quyền truy cập

// Quản lý người dùng
// Route để admin đăng ký nhân viên (staff) hoặc admin
router.post(
    '/register-staff',
    protect,
    restrictTo(1),
    upload.fields([{ name: 'image', maxCount: 1 }]),
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
    upload.fields([{ name: 'image', maxCount: 1 }]),
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
// router.post('/screenings', protect, restrictTo(1), screeningController.createScreening);
// router.put('/screenings/:id', protect, restrictTo(1), screeningController.updateScreening);
// router.delete('/screenings/:id', protect, restrictTo(1), screeningController.deleteScreening);
// // Route lấy danh sách suất chiếu với phân trang
// router.get('/theaters/:theaterId/showtimes', showtimeController.getShowtimes);

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
router.patch('/theaters/:theaterId/seats/:seatId/status', seatController.updateSeatStatus);
// Thêm route để lấy danh sách ghế theo suất chiếu
router.get('/:showtimeId/seats', seatController.getSeatsByShowtime);
// Quản lý vé
// router.get('/tickets', protect, restrictTo(1), ticketController.getTickets);
router.post('/tickets', ticketController.createTicket);

// Lấy danh sách vé
router.get('/tickets', ticketController.getTickets);

// Lấy một vé theo ID
router.get('/tickets/:ticketId', ticketController.getTicketById);

// Hủy vé
router.patch('/:ticketId/cancel', ticketController.cancelTicket);
// Quản lý hóa đơn
router.get('/payments', protect, restrictTo(1), paymentController.getPayments);

// Thống kê doanh thu
router.get('/revenue', protect, restrictTo(1), getRevenue);

// Quản lý danh mục ghế ngồi
// Thêm danh mục ghế ngồi
router.post('/seat-categories', protect, restrictTo(1), seatCategoryController.createSeatCategory);

// Sửa danh mục ghế ngồi
router.put('/seat-categories/:id', protect, restrictTo(1), seatCategoryController.updateSeatCategory);

// Xóa danh mục ghế ngồi
router.delete('/seat-categories/:id', protect, restrictTo(1), seatCategoryController.deleteSeatCategory);

module.exports = router;
