const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const movieController = require('../controllers/movie.controller');
const screeningController = require('../controllers/screening.controller');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const userController = require('../controllers/user.controller');
const { getShowtimesCustomer } = require('../controllers/showtime.controller');
const { getSeatsByShowtimeApi } = require('../controllers/seat.controller');
const { createPayment, executePayment, cancelPayment } = require('../controllers/payment.controller');

// Chỉ khách hàng (role_id = 3) được truy cập các route này
router.get('/user/:id', protect, restrictTo(3), userController.getCustomerById);
// Thay đổi username 
router.post('/changeUsername/:userId', protect, restrictTo(3), userController.changeUsername);

// Thêm route cho việc đổi mật khẩu
router.post('/:userId/change-password', protect, restrictTo(3), userController.changePassword);
// Route liên quan đến Phim
router.get('/movies', movieController.getAllMovies);
router.get('/movies/:id', movieController.getMovieById);
router.get('/movies/:movieId/cinemas', movieController.getCinemasByMovie);
router.get('/movie/:movieId/showtimes', getShowtimesCustomer)
router.get('/movie/search', movieController.searchMoviesByTitle)
router.get('/currentMovies', movieController.getCurrentMovies);
router.get('/upComingMovies', movieController.getUpcomingMovies);
// Route liên quan đến Suất Chiếu
router.get('/showtimes/:showtimeId/seats', getSeatsByShowtimeApi)
// router.get('/screenings', protect, restrictTo(3), screeningController.getScreeningsByMovie);
// router.get('/screenings/:id', protect, restrictTo(3), screeningController.getScreening);
// Route để lấy danh sách rạp theo phim
router.post('/create-payment', protect, restrictTo(3), createPayment);

// Route để capture đơn hàng PayPal (return_url)
router.get('/payment/success', protect, restrictTo(3), executePayment);


// Route để hủy payment khi thanh toán bị hủy
router.get('/cancel-payment', protect, restrictTo(3), cancelPayment);

// Route liên quan đến Vé
router.post('/tickets', protect, restrictTo(3), ticketController.createTicketApi);
router.get('/users/:userId/booking-history', protect, restrictTo(3), ticketController.getBookingHistory);


module.exports = router;
