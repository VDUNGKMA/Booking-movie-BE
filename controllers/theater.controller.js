// controllers/theater.controller.js

const db = require('../models');
const Theater = db.Theater;
const Cinema = db.Cinema;
const Seat = require('../models/Seat');
const Showtime = require('../models/Showtime');
const Ticket = require('../models/Ticket');
const { Op } = require('sequelize');
// Tạo phòng chiếu mới cho một rạp
exports.createTheater = async (req, res) => {
    try {
        const { name, capacity } = req.body;
        const cinemaId = req.params.cinemaId;

        // Kiểm tra rạp chiếu phim tồn tại
        const cinema = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }

        // Tạo phòng chiếu mới
        const theater = await Theater.create({
            name,
            capacity,
            cinema_id: cinemaId,
        });

        res.status(201).json({ status: 'success', data: theater });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Cập nhật thông tin phòng chiếu
exports.updateTheater = async (req, res) => {
    try {
        const theaterId = req.params.id;
        const { name, capacity } = req.body;

        // Tìm phòng chiếu cần cập nhật
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Cập nhật thông tin
        await theater.update({ name, capacity });

        res.status(200).json({ status: 'success', data: theater });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Xóa phòng chiếu
exports.deleteTheater = async (req, res) => {
    try {
        const theaterId = req.params.id;

        // Tìm phòng chiếu cần xóa
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Xóa phòng chiếu
        await theater.destroy();

        res.status(200).json({ status: 'success', message: 'Xóa phòng chiếu thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};

// Lấy danh sách phòng chiếu của một rạp staff
exports.getTheatersByCinema = async (req, res) => {
    try {
        const cinemaId = req.params.cinemaId;

        // Kiểm tra rạp chiếu phim tồn tại
        const cinema = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }

        // Lấy danh sách phòng chiếu
        const theaters = await Theater.findAll({
            where: { cinema_id: cinemaId },
        });

        res.status(200).json({ status: 'success', data: theaters });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'fail', message: 'Lỗi máy chủ nội bộ' });
    }
};
// Controller - Lấy sơ đồ ghế ngồi của phòng chiếu theo suất chiếu staff
exports.getTheatersByCinemaByStaff = async (req, res) => {
    try {
        const { cinemaId } = req.query;

        const theaters = await Theater.findAll({
            where: { cinema_id: cinemaId },
            attributes: ['id', 'name', 'capacity'],
        });

        res.json(theaters);
    } catch (error) {
        console.error('Error fetching theaters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTheatersByShowtime = async (req, res) => {
    const { showtimeId } = req.params;

    try {
        // Lấy thông tin suất chiếu
        const showtime = await Showtime.findByPk(showtimeId, {
            include: [
                {
                    model: Theater,
                    as: 'theater', // Lấy thông tin phòng chiếu
                    include: [
                        {
                            model: Seat,
                            as: 'seats', // Lấy ghế trực tiếp từ phòng chiếu
                            attributes: ['id', 'row', 'number'],
                            include: [
                                {
                                    model: Ticket,
                                    as: 'tickets',
                                    attributes: ['id'], // Không thêm điều kiện về showtime_id để lấy tất cả ghế
                                    required: false // Bao gồm cả những ghế chưa có vé
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        const theater = showtime.theater;
        const seats = theater.seats || []; // Kiểm tra nếu seats không tồn tại, gán mảng rỗng

        const totalSeats = seats.length;
        const bookedSeats = seats.filter(seat => seat.tickets && seat.tickets.length > 0).length; // Ghế đã đặt là ghế có vé
        const availableSeats = totalSeats - bookedSeats; // Ghế còn lại là ghế chưa có vé

        const response = {
            theaterId: theater.id,
            theaterName: theater.name,
            showtimeId: showtime.id,
            startTime: showtime.start_time,
            endTime: showtime.end_time,
            totalSeats: totalSeats,
            bookedSeats: bookedSeats,
            availableSeats: availableSeats,
            seats: seats
                .map(seat => ({
                    row: seat.row,
                    number: seat.number,
                    seatId: seat.id,
                    isBooked: seat.tickets && seat.tickets.length > 0
                })),
            isFull: availableSeats === 0
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching theater information:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
//  - Kiểm tra trạng thái phòng chiếu Staff
exports.getTheaterStatus = async (req, res) => {
    try {
        const { theaterId, showtimeId } = req.params;

        const seats = await Seat.findAll({
            where: { theater_id: theaterId },
            attributes: ['id'],
            include: [
                {
                    model: Ticket,
                    as: 'tickets',
                    attributes: ['id'],
                    where: {
                        showtime_id: showtimeId,
                        status: 'confirmed',
                    },
                    required: false,
                },
            ],
        });

        const totalSeats = seats.length;
        const bookedSeats = seats.filter(seat => seat.tickets.length > 0).length;
        const isFull = totalSeats === bookedSeats;

        res.json({
            theaterId,
            totalSeats,
            bookedSeats,
            availableSeats: totalSeats - bookedSeats,
            isFull,
        });
    } catch (error) {
        console.error('Error fetching theater status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// // Lấy danh sách các phòng chiếu, bao gồm tên và số lượng ghế.
// exports.getTheaters = async (req, res) => {
//     try {
//         const theaters = await Theater.findAll({
//             include: [
//                 {
//                     model: Seat,
//                     as: 'seats',
//                     attributes: ['id', 'row', 'number'], // Lấy số ghế
//                 }
//             ]
//         });

//         const formattedTheaters = theaters.map(theater => {
//             return {
//                 theaterId: theater.id,
//                 theaterName: theater.name,
//                 totalSeats: theater.seats.length,
//                 isFull: theater.seats.every(seat => seat.isBooked), // Kiểm tra nếu tất cả ghế đã đặt
//             };
//         });

//         res.json(formattedTheaters);
//     } catch (error) {
//         console.error('Error fetching theaters:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

// exports.getTheaterStatus = async (req, res) => {
//     try {
//         const { theaterId } = req.params;

//         // Lấy thông tin phòng chiếu và danh sách ghế
//         const theater = await Theater.findByPk(theaterId, {
//             include: [{
//                 model: Seat,
//                 as: 'seats',
//                 attributes: ['id', 'row', 'number']
//             }]
//         });

//         if (!theater) {
//             return res.status(404).json({ message: 'Theater not found' });
//         }

//         // Kiểm tra trạng thái của phòng (đã đầy hay còn chỗ)
//         const seats = theater.seats || [];
//         const isFull = seats.length > 0 && seats.every(seat => seat.isBooked);

//         res.json({
//             theaterId: theater.id,
//             theaterName: theater.name,
//             totalSeats: seats.length,
//             isFull,
//             seats: seats.map(seat => ({
//                 seatId: seat.id,
//                 row: seat.row,
//                 number: seat.number,
//                 isBooked: seat.isBooked || false  // Giả sử có trường isBooked
//             }))
//         });
//     } catch (error) {
//         console.error('Error fetching theater status:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };
