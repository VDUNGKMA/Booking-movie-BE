// routes/admin.routes.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    registerStaff,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getRevenue
} = require('../controllers/admin.controller');
const movieController = require('../controllers/movie.controller');
const genreController = require('../controllers/genre.controller');
const screeningController = require('../controllers/screening.controller');
const theaterController = require('../controllers/theater.controller');
const seatController = require('../controllers/seat.controller');
const ticketController = require('../controllers/ticket.controller');
const paymentController = require('../controllers/payment.controller');
const cinemaController = require('../controllers/cinema.controller');
const seatCategoryController = require('../controllers/seatcategory.controller');
const { upload } = require('../config/cloudinary'); // Import middleware upload từ cloudinary.js

// const { createMovie, updateMovie, deleteMovie } = require('../controllers/admin.controller');
const router = express.Router();

// Chỉ admin (role_id = 1) mới có quyền truy cập
//Quản lý người dùng
// Route để admin đăng ký nhân viên (staff) hoặc admin
router.post('/register-staff', protect, restrictTo(1), registerStaff);
// Route để admin lấy danh sách tất cả người dùng
router.get('/users', protect, restrictTo(1), getAllUsers);

// Route để admin lấy thông tin chi tiết của một người dùng theo ID
router.get('/users/:id', protect, restrictTo(1), getUserById);
// Route để admin cập nhật thông tin của một người dùng
router.put('/users/:id', protect, restrictTo(1), updateUser);
// Route để admin xóa người dùng
router.delete('/users/:id', protect, restrictTo(1), deleteUser);


// Quản lý phim
// router.post('/movies', protect, restrictTo(1), movieController.createMovie);
// Route để tải lên poster và video trailer khi tạo phim
router.post('/movies', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'trailer', maxCount: 1 }]), movieController.createMovie);
router.put('/movies/:id', protect, restrictTo(1), movieController.updateMovie);
router.delete('/movie', protect, restrictTo(1), movieController.deleteMovie);
router.get('/get-all-movies', movieController.getAllMovies);

// Quản lý thể loại phim
router.post('/genres', protect, restrictTo(1), genreController.createGenre);
router.put('/genres/:id', protect, restrictTo(1), genreController.updateGenre);
router.delete('/genres/:id', protect, restrictTo(1), genreController.deleteGenre);

// Quản lý suất chiếu
router.post('/screenings', protect, restrictTo(1), screeningController.createScreening);
router.put('/screenings/:id', protect, restrictTo(1), screeningController.updateScreening);
router.delete('/screenings/:id', protect, restrictTo(1), screeningController.deleteScreening);

// Quản lý phòng chiếu
router.post('/theaters', protect, restrictTo(1), theaterController.createTheater);
router.put('/theaters/:id', protect, restrictTo(1), theaterController.updateTheater);
router.delete('/theaters/:id', protect, restrictTo(1), theaterController.deleteTheater);

// Quản lý rạp chiếu phim
router.post('/cinemas', protect, restrictTo(1), cinemaController.createCinema);
router.put('/cinemas/:id', protect, restrictTo(1), cinemaController.updateCinema);
router.delete('/cinemas/:id', protect, restrictTo(1), cinemaController.deleteCinema);
router.get('/cinemas', protect, restrictTo(1), cinemaController.getCinemas);

// Quản lý ghế ngồi
router.post('/seats', protect, restrictTo(1), seatController.createSeat);
router.put('/seats/:id', protect, restrictTo(1), seatController.updateSeat);
router.delete('/seats/:id', protect, restrictTo(1), seatController.deleteSeat);

// Quản lý vé
// router.get('/tickets', protect, restrictTo(1), ticketController.getTickets);

// Quản lý hóa đơn
router.get('/payments', protect, restrictTo(1), paymentController.getPayments);

// Thống kê doanh thu
router.get('/revenue', protect, restrictTo(1), getRevenue);

// Thêm danh mục ghế ngồi
router.post('/seat-categories', protect, restrictTo(1), seatCategoryController.createSeatCategory);

// Sửa danh mục ghế ngồi
router.put('/seat-categories/:id', protect, restrictTo(1), seatCategoryController.updateSeatCategory);

// Xóa danh mục ghế ngồi
router.delete('/seat-categories/:id', protect, restrictTo(1), seatCategoryController.deleteSeatCategory);

module.exports = router;
