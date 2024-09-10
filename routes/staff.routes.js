const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const seatController = require('../controllers/seat.controller');
const screeningController = require('../controllers/screening.controller');
const cinemaController = require('../controllers/cinema.controller');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Chỉ nhân viên (role_id = 2) mới được truy cập

// Route liên quan đến Vé
router.get('/tickets/:id', protect, restrictTo(2), ticketController.getTicket);
router.put('/tickets/:id', protect, restrictTo(2), ticketController.updateTicketStatus);

// Route liên quan đến Ghế ngồi
router.put('/seats/:id', protect, restrictTo(2), seatController.updateSeatStatus);

// Route liên quan đến Suất chiếu
router.get('/screenings', protect, restrictTo(2), screeningController.getScreenings);

// Route liên quan đến Rạp chiếu phim
router.get('/cinemas', protect, restrictTo(2), cinemaController.getCinemas);

module.exports = router;
