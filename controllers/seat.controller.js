// controllers/seat.controller.js

const db = require('../models');
const Seat = db.Seat;
const Theater = db.Theater;
const Showtime = db.Showtime;
const Ticket = db.Ticket;
const { Op } = require('sequelize'); // Thêm dòng này để sử dụng toán tử Sequelize
// Định nghĩa mức giá cho mỗi loại ghế
const seatPrices = {
    'Normal': 100000, // 100,000 VND
    'VIP': 200000,    // 200,000 VND
    'Couple': 150000  // 150,000 VND
};

// Thêm ghế ngồi
exports.createSeat = async (req, res) => {
    try {
        const { theaterId } = req.params; // theaterId từ route parameter
        const { row, number, type } = req.body;

        // Kiểm tra đầy đủ thông tin
        if (!theaterId || !row || !number || !type) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin ghế (theaterId, row, number, type).' });
        }

        // Kiểm tra xem loại ghế có hợp lệ không
        if (!seatPrices.hasOwnProperty(type)) {
            return res.status(400).json({ status: 'fail', message: 'Loại ghế không hợp lệ!' });
        }

        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Kiểm tra xem ghế đã tồn tại trong cùng phòng chiếu chưa (row và number duy nhất)
        const existingSeat = await Seat.findOne({
            where: {
                theater_id: theaterId,
                row,
                number
            }
        });

        if (existingSeat) {
            return res.status(200).json({ status: 'fail', message: 'Ghế này đã tồn tại trong phòng chiếu!' });
        }
        console.log("check seat", row, number, type)
        // Thêm ghế mới vào cơ sở dữ liệu với mức giá dựa trên loại ghế
        const seat = await Seat.create({
            theater_id: theaterId,
            row,
            number,
            type,
            // Loại bỏ trường 'status'
            price: seatPrices[type] // Gán mức giá dựa trên loại ghế
        });

        console.log("Giá trị ghế mới:", seat);

        res.status(201).json({ status: 'success', data: seat });
    } catch (error) {
        console.error('Error in createSeat:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi thêm ghế ngồi.' });
    }
};
// Sửa ghế ngồi
exports.updateSeat = async (req, res) => {
    try {
        const { theaterId, seatId } = req.params;
        const { row, number, type } = req.body;

        // Kiểm tra đầy đủ thông tin
        if (!theaterId || !seatId || !row || !number || !type) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin ghế (theaterId, seatId, row, number, type).' });
        }

        // Kiểm tra xem loại ghế có hợp lệ không
        if (!seatPrices.hasOwnProperty(type)) {
            return res.status(400).json({ status: 'fail', message: 'Loại ghế không hợp lệ!' });
        }

        // Tìm ghế cần cập nhật
        const seat = await Seat.findOne({
            where: {
                id: seatId,
                theater_id: theaterId
            }
        });

        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }

        // Kiểm tra xem ghế mới có trùng với ghế khác không
        const existingSeat = await Seat.findOne({
            where: {
                theater_id: theaterId,
                row,
                number,
                id: { [Op.ne]: seatId } // Sử dụng Op từ 'sequelize'
            }
        });

        if (existingSeat) {
            return res.status(200).json({ status: 'fail', message: 'Ghế này đã tồn tại trong phòng chiếu!' });
        }

        // Cập nhật thông tin ghế với mức giá mới
        await seat.update({
            row,
            number,
            type,
            price: seatPrices[type] // Cập nhật mức giá dựa trên loại ghế
            // Loại bỏ cập nhật trường 'status'
        });

        console.log("Giá trị ghế sau khi cập nhật:", seat);

        res.status(200).json({ status: 'success', data: seat });
    } catch (error) {
        console.error('Error in updateSeat:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi sửa ghế ngồi.' });
    }
};
// Xóa ghế ngồi
exports.deleteSeat = async (req, res) => {
    try {
        const { theaterId, seatId } = req.params;

        // Kiểm tra xem ghế có tồn tại không
        const seat = await Seat.findOne({
            where: {
                id: seatId,
                theater_id: theaterId
            },
            include: [{
                model: Ticket,
                as: 'tickets',
                where: {
                    payment_status: { [Op.in]: ['pending', 'completed'] } // Kiểm tra nếu ghế đang được đặt cho bất kỳ suất chiếu nào
                },
                required: false
            }]
        });

        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }

        // Kiểm tra nếu ghế đang được đặt cho bất kỳ suất chiếu nào
        if (seat.tickets && seat.tickets.length > 0) {
            return res.status(400).json({ status: 'fail', message: 'Ghế đang được đặt cho một hoặc nhiều suất chiếu khác!' });
        }

        // Xóa ghế
        await seat.destroy();

        console.log(`Ghế ngồi với ID ${seatId} đã được xóa.`);

        res.status(204).json({ status: 'success' }); // No Content
    } catch (error) {
        console.error('Error in deleteSeat:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi xóa ghế ngồi.' });
    }
};
// Lấy danh sách ghế theo phòng chiếu
exports.getSeatsByTheater = async (req, res) => {
    try {
        const { theaterId } = req.params;
        // Kiểm tra theaterId hợp lệ
        if (!theaterId) {
            return res.status(400).json({ status: 'fail', message: 'Tham số theaterId không hợp lệ!' });
        }
        console.log("theaterID", theaterId)
        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        console.log("theater ", theater)
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Lấy danh sách ghế
        const seats = await Seat.findAll({
            where: {
                theater_id: theaterId
            },
            order: [['row', 'ASC'], ['number', 'ASC']] // Sắp xếp theo hàng và số ghế
        });
        console.log(`Đã lấy ${seats.length} ghế cho phòng chiếu ID ${theaterId}.`);

        res.status(200).json({ status: 'success', data: { seats } });
    } catch (error) {
        console.error('Error in getSeatsByTheater:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế ngồi.' });
    }
};
// Lấy danh sách ghế theo suất chiếu
exports.getSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        // Kiểm tra xem suất chiếu có tồn tại không
        const showtime = await Showtime.findByPk(showtimeId);
        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Suất chiếu không tồn tại!' });
        }

        // Lấy danh sách ghế đã được đặt cho suất chiếu này
        const bookedTickets = await Ticket.findAll({
            where: {
                showtime_id: showtimeId,
                payment_status: { [Op.in]: ['pending', 'completed'] }, // Chỉ lấy các vé đang trong trạng thái đặt hoặc đã thanh toán
            },
            include: [{
                model: Seat,
                as: 'seats',
                attributes: ['id'],
                through: { attributes: [] }, // Loại bỏ các thuộc tính từ bảng trung gian
            }],
        });

        // Tạo một tập hợp các `seat_id` đã được đặt
        const bookedSeatIds = new Set();
        bookedTickets.forEach(ticket => {
            ticket.seats.forEach(seat => {
                bookedSeatIds.add(seat.id);
            });
        });

        // Lấy danh sách tất cả ghế trong phòng chiếu của suất chiếu này
        const seats = await Seat.findAll({
            where: {
                theater_id: showtime.theater_id,
            },
            attributes: ['id', 'row', 'number', 'type', 'price'],
        });

        // Thêm thông tin về trạng thái ghế
        const seatsWithStatus = seats.map(seat => ({
            id: seat.id,
            row: seat.row,
            number: seat.number,
            type: seat.type,
            price: seat.price,
            status: bookedSeatIds.has(seat.id) ? 'booked' : 'available',
        }));

        res.status(200).json({ status: 'success', data: { seats: seatsWithStatus } });
    } catch (error) {
        console.error('Error in getSeatsByShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế theo suất chiếu.' });
    }
};
exports.getSeatsByTheaterAdmin = async (req, res) => {
    try {
        const { theaterId } = req.params;

        // Kiểm tra theaterId hợp lệ
        if (!theaterId) {
            return res.status(400).json({ status: 'fail', message: 'Tham số theaterId không hợp lệ!' });
        }

        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Lấy các tham số phân trang từ query
        let { page, limit, sortField, sortOrder, search } = req.query;

        page = parseInt(page) || 1; // Trang hiện tại, mặc định là 1
        limit = parseInt(limit) || 10; // Số ghế trên mỗi trang, mặc định là 10
        sortField = sortField || 'id'; // Trường sắp xếp, mặc định là 'id'
        sortOrder = sortOrder || 'ASC'; // Thứ tự sắp xếp, mặc định là 'ASC'
        search = search || ''; // Tìm kiếm, mặc định là rỗng

        const offset = (page - 1) * limit;

        // Tính tổng số ghế (có thể thêm điều kiện tìm kiếm)
        const totalSeats = await Seat.count({
            where: {
                theater_id: theaterId,
                [Op.or]: [
                    { row: { [Op.like]: `%${search}%` } },
                    { number: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } },
                ],
            },
        });

        // Lấy danh sách ghế với phân trang và sắp xếp
        const seats = await Seat.findAll({
            where: {
                theater_id: theaterId,
                [Op.or]: [
                    { row: { [Op.like]: `%${search}%` } },
                    { number: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } },
                ],
            },
            order: [[sortField, sortOrder]],
            limit: limit,
            offset: offset,
            attributes: ['id', 'row', 'number', 'type', 'price'],
            // Loại bỏ trường 'status' khỏi attributes
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalSeats,
                currentPage: page,
                totalPages: Math.ceil(totalSeats / limit),
                seats,
            },
        });
    } catch (error) {
        console.error('Error in getSeatsByTheaterAdmin:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế ngồi.' });
    }
};
// Lấy danh sách ghế theo suất chiếu
exports.getSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        // Kiểm tra xem suất chiếu có tồn tại không
        const showtime = await Showtime.findByPk(showtimeId);
        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Suất chiếu không tồn tại!' });
        }

        // Lấy danh sách ghế đã được đặt cho suất chiếu này
        const bookedTickets = await Ticket.findAll({
            where: {
                showtime_id: showtimeId,
                payment_status: { [Op.in]: ['pending', 'completed'] }, // Chỉ lấy các vé đang trong trạng thái đặt hoặc đã thanh toán
            },
            include: [{
                model: Seat,
                as: 'seats',
                attributes: ['id'],
                through: { attributes: [] }, // Loại bỏ các thuộc tính từ bảng trung gian
            }],
        });

        // Tạo một tập hợp các `seat_id` đã được đặt
        const bookedSeatIds = new Set();
        bookedTickets.forEach(ticket => {
            ticket.seats.forEach(seat => {
                bookedSeatIds.add(seat.id);
            });
        });

        // Lấy danh sách tất cả ghế trong phòng chiếu của suất chiếu này
        const seats = await Seat.findAll({
            where: {
                theater_id: showtime.theater_id,
            },
            attributes: ['id', 'row', 'number', 'type', 'price'],
        });

        // Thêm thông tin về trạng thái ghế
        const seatsWithStatus = seats.map(seat => ({
            id: seat.id,
            row: seat.row,
            number: seat.number,
            type: seat.type,
            price: seat.price,
            status: bookedSeatIds.has(seat.id) ? 'booked' : 'available',
        }));

        res.status(200).json({ status: 'success', data: { seats: seatsWithStatus } });
    } catch (error) {
        console.error('Error in getSeatsByShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế theo suất chiếu.' });
    }
};
exports.getSeatsByShowtimeApi = async (req, res) => {
    const { showtimeId } = req.params;
    console.log("check showtimeid", showtimeId);
    try {
        // Lấy thông tin suất chiếu
        const showtime = await Showtime.findByPk(showtimeId);

        if (!showtime) {
            return res.status(404).json({
                status: 'error',
                message: 'Suất chiếu không tồn tại',
            });
        }

        // Lấy tất cả ghế trong phòng chiếu của suất chiếu
        const seats = await Seat.findAll({
            where: { theater_id: showtime.theater_id },
            attributes: ['id', 'row', 'number', 'type', 'price'], // Thêm các thuộc tính cần thiết
        });

        // Lấy danh sách ghế đã được đặt cho suất chiếu này
        const bookedTickets = await Ticket.findAll({
            where: {
                showtime_id: showtimeId,
                payment_status: { [Op.in]: ['pending', 'completed'] }, // Chỉ lấy các vé đang trong trạng thái đặt hoặc đã thanh toán
            },
            include: [
                {
                    model: Seat,
                    as: 'seats',
                    attributes: ['id'],
                    through: { attributes: [] }, // Loại bỏ các thuộc tính từ bảng trung gian
                },
            ],
        });

        // Tạo một tập hợp các `seat_id` đã được đặt
        const bookedSeatIds = new Set();
        bookedTickets.forEach(ticket => {
            ticket.seats.forEach(seat => {
                bookedSeatIds.add(seat.id);
            });
        });

        // Gắn trạng thái cho ghế
        const seatsWithStatus = seats.map(seat => {
            return {
                ...seat.toJSON(),
                status: bookedSeatIds.has(seat.id) ? 'booked' : 'available',
            };
        });

        res.json({
            status: 'success',
            data: { seats: seatsWithStatus },
        });
    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách ghế',
        });
    }
};
// exports.getSeatsByShowtimeApi = async (req, res) => {
//     const { showtimeId } = req.params;
//     console.log("check showtimeid", showtimeId);
//     try {
//         // Lấy thông tin suất chiếu
//         const showtime = await Showtime.findByPk(showtimeId);

//         if (!showtime) {
//             return res.status(404).json({
//                 status: 'error',
//                 message: 'Suất chiếu không tồn tại',
//             });
//         }

//         // Lấy tất cả ghế trong phòng chiếu của suất chiếu
//         const seats = await Seat.findAll({
//             where: { theater_id: showtime.theater_id },
//         });

//         // Lấy danh sách ghế đã được đặt cho suất chiếu này
//         const bookedTickets = await Ticket.findAll({
//             where: {
//                 showtime_id: showtimeId,
//                 payment_status: { [Op.in]: ['pending', 'completed'] }, // Chỉ lấy các vé đang trong trạng thái đặt hoặc đã thanh toán
//             },
//             include: [
//                 {
//                     model: Seat,
//                     as: 'seats',
//                     attributes: ['id'],
//                     through: { attributes: [] }, // Loại bỏ các thuộc tính từ bảng trung gian
//                 },
//             ],
//         });

//         // Tạo một tập hợp các `seat_id` đã được đặt
//         const bookedSeatIds = new Set();
//         bookedTickets.forEach(ticket => {
//             ticket.seats.forEach(seat => {
//                 bookedSeatIds.add(seat.id);
//             });
//         });

//         // Gắn trạng thái cho ghế
//         const seatsWithStatus = seats.map(seat => {
//             return {
//                 ...seat.toJSON(),
//                 status: bookedSeatIds.has(seat.id) ? 'booked' : 'available',
//             };
//         });

//         res.json({
//             status: 'success',
//             data: { seats: seatsWithStatus },
//         });
//     } catch (error) {
//         console.error('Error fetching seats:', error);
//         res.status(500).json({
//             status: 'error',
//             message: 'Lỗi khi lấy danh sách ghế',
//         });
//     }
// };
// exports.getSeatsByShowtimeByStaff = async (req, res) => {
//     const { theaterId, showtimeId } = req.params;

//     try {
//         const theater = await Theater.findOne({
//             where: { id: theaterId },
//             include: [
//                 {
//                     model: Seat,
//                     as: 'seats',
//                     attributes: ['id', 'row', 'number'],
//                     include: [
//                         {
//                             model: Ticket,
//                             as: 'tickets',
//                             where: { showtime_id: showtimeId, status: 'confirmed' },
//                             required: false, // Lấy tất cả ghế, kể cả ghế chưa đặt
//                         }
//                     ]
//                 }
//             ]
//         });

//         const seats = theater.seats.map(seat => ({
//             seatId: seat.id,
//             row: seat.row,
//             number: seat.number,
//             isBooked: seat.tickets.length > 0, // Nếu có vé đặt, ghế đã đặt
//         }));

//         res.json({
//             theaterId: theater.id,
//             theaterName: theater.name,
//             seats: seats,
//         });
//     } catch (error) {
//         console.error('Error fetching seats by showtime:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };
// Controller - Lấy sơ đồ ghế ngồi của phòng chiếu theo suất chiếu
// exports.getTheaterSeatsByShowtime = async (req, res) => {
//     try {
//         const { theaterId, showtimeId } = req.params;

//         const seats = await Seat.findAll({
//             where: { theater_id: theaterId },
//             attributes: ['id', 'row', 'number'],
//             include: [
//                 {
//                     model: Ticket,
//                     as: 'tickets',
//                     attributes: ['id'],
//                     where: {
//                         showtime_id: showtimeId,
//                         status: 'confirmed',
//                     },
//                     required: false,
//                 },
//             ],
//         });

//         const seatData = seats.map((seat) => ({
//             seatId: seat.id,
//             row: seat.row,
//             number: seat.number,
//             isBooked: seat.tickets.length > 0,
//         }));

//         res.json(seatData);
//     } catch (error) {
//         console.error('Error fetching theater seats:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };
exports.getTheaterSeatsByShowtime = async (req, res) => {
    try {
        const { theaterId, showtimeId } = req.params;

        const seats = await Seat.findAll({
            where: { theater_id: theaterId },
            attributes: ['id', 'row', 'number'],
            include: [
                {
                    model: Ticket,
                    as: 'tickets',
                    attributes: ['id', 'status'],
                    where: {
                        showtime_id: showtimeId,
                        status: ['confirmed', 'used'],  // Include both 'confirmed' and 'used' statuses
                    },
                    required: false,
                },
            ],
        });

        const seatData = seats.map((seat) => {
            let isUsed = false;
            let isBooked = false;

            if (seat.tickets.length > 0) {
                // Check if any ticket has 'used' status
                const usedTicket = seat.tickets.find(ticket => ticket.status === 'used');
                isUsed = usedTicket ? true : false;
                isBooked = true;
            }

            return {
                seatId: seat.id,
                row: seat.row,
                number: seat.number,
                isBooked: isBooked,
                isUsed: isUsed,  // Add the 'isUsed' flag to the seat data
            };
        });

        res.json(seatData);
    } catch (error) {
        console.error('Error fetching theater seats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller - Kiểm tra trạng thái phòng chiếu
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