const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const movieController = require('../controllers/movie.controller');
const screeningController = require('../controllers/screening.controller');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Chỉ khách hàng (role_id = 3) được truy cập các route này

// Route liên quan đến Phim
router.get('/movies', protect, restrictTo(3), movieController.getAllMovies);
router.get('/movies/:id', protect, restrictTo(3), movieController.getMovie);

// Route liên quan đến Suất Chiếu
router.get('/screenings', protect, restrictTo(3), screeningController.getScreeningsByMovie);
router.get('/screenings/:id', protect, restrictTo(3), screeningController.getScreening);

// Route liên quan đến Vé
router.post('/tickets', protect, restrictTo(3), ticketController.bookTicket);
router.get('/tickets/:id', protect, restrictTo(3), ticketController.getTicketByCustomer);
router.get('/tickets', protect, restrictTo(3), ticketController.getCustomerTickets);

module.exports = router;
