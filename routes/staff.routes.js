const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const seatController = require('../controllers/seat.controller');
// const screeningController = require('../controllers/screening.controller');
const cinemaController = require('../controllers/cinema.controller');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getTheatersByShowtime, getTheaters, getTheaterStatus, getTheatersByCinemaByStaff } = require('../controllers/theater.controller');
const { getShowtimesByTheaterAndDateByStaff } = require('../controllers/showtime.controller');

// Chỉ nhân viên (role_id = 2) mới được truy cập

// Route liên quan đến Vé
//router.get('/tickets/:id', protect, restrictTo(2), ticketController.getTicket);
//router.put('/tickets/:id', protect, restrictTo(2), ticketController.updateTicketStatus);

// Route liên quan đến Ghế ngồi
// router.put('/seats/:id', protect, restrictTo(2), seatController.updateSeatStatus);

// Route liên quan đến Suất chiếu
// router.get('/screenings', protect, restrictTo(2), screeningController.getScreenings);

// Route liên quan đến Rạp chiếu phim
router.get('/cinemas', protect, restrictTo(2), cinemaController.getCinemas);
router.get('/theaters/showtime/:showtimeId', getTheatersByShowtime);
router.get('/theaters', getTheatersByCinemaByStaff);
router.get('/theaters/:theaterId/showtimes/:showtimeId/seats', seatController.getTheaterSeatsByShowtime);
router.get('/theaters/:theaterId/showtimes/:showtimeId/status', getTheaterStatus);
router.get('/theaters/:theaterId/showtimes', getShowtimesByTheaterAndDateByStaff);
router.post('/ticket/scan', ticketController.scanTicket);
router.patch('/ticket/validate/:ticketId', ticketController.validateTicket);



module.exports = router;
