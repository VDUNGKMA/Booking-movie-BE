
const { Op } = require('sequelize');
const db = require('../models');
const Ticket = db.Ticket;
const User = db.User;
const Showtime = db.Showtime;
const Cinema = db.Cinema;
const Seat = db.Seat;
const Theater = db.Theater;
const Payment = db.Payment;
const Movie = db.Movie
const QRCode = db.QRCode
// Import sequelize từ db
const sequelize = db.sequelize;

// Helper function to calculate ticket price
const calculateTicketPrice = (showtime, seat) => {
    // Giá suất chiếu và giá ghế đã được lưu trong cơ sở dữ liệu
    const showtimePrice = parseFloat(showtime.price) || 0;
    const seatPrice = parseFloat(seat.price) || 0;
    return showtimePrice + seatPrice;
};
const isSeatAvailable = async (showtimeId, seatId) => {
    const ticket = await Ticket.findOne({
        where: {
            showtime_id: showtimeId,
            payment_status: { [Op.in]: ['pending', 'completed'] }, // Chỉ xét các vé đang đặt hoặc đã thanh toán
        },
        include: [
            {
                model: Seat,
                as: 'seats',
                where: { id: seatId },
                attributes: ['id'],
                through: { attributes: [] },
            },
        ],
    });

    return !ticket; // Nếu không tìm thấy vé nào liên kết với ghế và suất chiếu, ghế có sẵn
};



exports.createTicketApi = async (req, res) => {
    const { showtimeId, seatIds, paymentMethod, userId } = req.body;

    if (!showtimeId || !seatIds || !paymentMethod || !userId) {
        return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
    }

    try {
        await sequelize.transaction(async (t) => {
            // Lấy thông tin suất chiếu và giá
            const showtime = await Showtime.findOne({
                where: { id: showtimeId },
                transaction: t,
                lock: t.LOCK.UPDATE,
                include: [{ model: db.Theater, as: 'theater' }],
            });

            if (!showtime) {
                throw new Error('Suất chiếu không tồn tại.');
            }

            const showtimePrice = parseFloat(showtime.price);

            // Lấy thông tin ghế và kiểm tra xem ghế có hợp lệ
            const seats = await Seat.findAll({
                where: {
                    id: seatIds,
                    theater_id: showtime.theater_id,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            if (seats.length !== seatIds.length) {
                throw new Error('Một hoặc nhiều ghế không tồn tại hoặc không thuộc về rạp của suất chiếu.');
            }

            // Kiểm tra xem ghế đã được đặt cho suất chiếu này chưa
            for (const seatId of seatIds) {
                const isAvailable = await isSeatAvailable(showtimeId, seatId);
                if (!isAvailable) {
                    throw new Error(`Ghế với ID ${seatId} đã được đặt cho suất chiếu này.`);
                }
            }

            // Tính tổng giá vé
            const totalPrice = seats.reduce((total, seat) => total + showtimePrice + parseFloat(seat.price), 0);

            // Tạo một vé duy nhất cho tất cả các ghế
            const createdTicket = await Ticket.create({
                user_id: userId,
                showtime_id: showtimeId,
                price: totalPrice,
                status: 'confirmed',
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed',
                reserved_at: paymentMethod === 'paypal' ? new Date() : null,
            }, { transaction: t });

            if (!createdTicket || !createdTicket.id) {
                throw new Error('Không thể tạo vé. Vui lòng thử lại sau.');
            }

            // Liên kết tất cả các ghế với vé vừa tạo thông qua bảng TicketSeats
            await createdTicket.addSeats(seatIds, { transaction: t });

            // Trả về tổng giá và thông tin vé đã tạo
            res.status(201).json({
                status: 'success',
                message: 'Đặt vé thành công.',
                data: {
                    totalPrice,
                    ticketId: createdTicket.id, // Trả về ID của vé duy nhất
                },
            });
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
    }
};

exports.getTicketsForAdmin = async (req, res) => {
    try {
        // Lấy các tham số từ query
        let { page, limit, sortField, sortOrder, search } = req.query;

        // Thiết lập giá trị mặc định nếu không có tham số
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortField = sortField || 'createdAt';
        sortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';
        search = search ? search.trim() : '';

        const offset = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        let whereCondition = {};

        if (search) {
            // Kiểm tra nếu search là số
            const numericSearch = parseInt(search);
            const isNumeric = !isNaN(numericSearch);

            whereCondition = {
                [Op.or]: [
                    { '$UserData.username$': { [Op.like]: `%${search}%` } },
                    { '$showtime.movie.title$': { [Op.like]: `%${search}%` } },
                    { '$seats.row$': { [Op.like]: `%${search}%` } },
                    // Sử dụng Op.eq cho seats.number nếu search là số
                    ...(isNumeric ? [{ '$seats.number$': numericSearch }] : []),
                    { status: { [Op.like]: `%${search}%` } },
                ],
            };
        }

        // Sử dụng findAndCountAll để thực hiện count và findAll trong một truy vấn duy nhất
        const { count: totalTickets, rows: tickets } = await Ticket.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'UserData', // Sử dụng alias 'UserData'
                    attributes: ['id', 'username', 'email'], // Chọn các trường cần thiết
                    required: true, // Đảm bảo INNER JOIN
                },
                {
                    model: Showtime,
                    as: 'showtime',
                    attributes: ['id', 'start_time', 'end_time'],
                    include: [
                        {
                            model: db.Movie, // Giả sử có model Movie
                            as: 'movie',
                            attributes: ['id', 'title'],
                            required: true, // Đảm bảo INNER JOIN
                        },
                    ],
                    required: true, // Đảm bảo INNER JOIN
                },
                {
                    model: Seat,
                    as: 'seats',
                    attributes: ['id', 'row', 'number', 'type', 'price'],
                    required: true, // Đảm bảo INNER JOIN
                    through: {
                        attributes: [], // Loại bỏ các trường trong bảng trung gian
                    },
                },
            ],
            distinct: true, // Đảm bảo đếm đúng số vé khi có nhiều mối quan hệ
            order: [[sortField, sortOrder]],
            limit: limit,
            offset: offset,
            subQuery: false, // Thêm thuộc tính này
        });

        // Định dạng dữ liệu trả về
        const formattedTickets = tickets.map(ticket => ({
            id: ticket.id,
            user: {
                id: ticket.UserData.id,
                username: ticket.UserData.username,
                email: ticket.UserData.email,
            },
            movie: {
                id: ticket.showtime.movie.id,
                title: ticket.showtime.movie.title,
            },
            showtime: {
                id: ticket.showtime.id,
                start_time: ticket.showtime.start_time,
                end_time: ticket.showtime.end_time,
            },
            seats: ticket.seats.map(seat => ({
                id: seat.id,
                row: seat.row,
                number: seat.number,
                type: seat.type,
                price: seat.price,
            })),
            price: ticket.price,
            status: ticket.status,
            payment_method: ticket.payment_method,
            payment_status: ticket.payment_status,
            reserved_at: ticket.reserved_at,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
        }));

        res.status(200).json({
            status: 'success',
            data: {
                tickets: formattedTickets,
                totalTickets,
                currentPage: page,
                totalPages: Math.ceil(totalTickets / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching tickets for admin:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách vé.' });
    }
};

exports.cancelTicket = async (req, res) => {
    const { ticketId } = req.params;

    try {
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                {
                    model: Showtime,
                    as: 'showtime',
                    include: [
                        {
                            model: Cinema,
                            as: 'cinema',
                        },
                        {
                            model: db.Movie,
                            as: 'movie',
                        },
                    ],
                },
                {
                    model: Seat,
                    as: 'seats',
                },
                {
                    model: User,
                    as: 'user',
                },
            ],
        });

        if (!ticket) {
            return res.status(404).json({ status: 'fail', message: 'Vé không tồn tại.' });
        }

        if (ticket.status === 'cancelled') {
            return res.status(400).json({ status: 'fail', message: 'Vé đã bị hủy trước đó.' });
        }

        // Cập nhật trạng thái vé
        ticket.status = 'cancelled';
        await ticket.save();

        res.status(200).json({ status: 'success', message: 'Hủy vé thành công.' });
    } catch (error) {
        console.error('Error cancelling ticket:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi hủy vé.' });
    }
};


exports.scanTicket = async (req, res) => {
    const { qrData } = req.body;

    if (!qrData) {
        return res.status(400).json({ message: 'QR data is missing' });
    }

    try {
        const parsedData = JSON.parse(qrData);
        const { ticketId } = parsedData;

        if (!ticketId) {
            return res.status(400).json({ message: 'Invalid QR data format' });
        }

        const ticket = await Ticket.findOne({
            where: { id: ticketId },
            include: [
                {
                    model: User,
                    as: 'UserData',
                    attributes: ['username', 'email'],
                },
                {
                    model: Showtime,
                    as: 'showtime',
                    attributes: ['start_time', 'end_time'],
                    include: [
                        {
                            model: Movie,
                            as: 'movie', // Thêm alias movie để lấy title của phim
                            attributes: ['title'],
                        },
                        {
                            model: Theater,
                            as: 'theater',
                            attributes: ['name'],
                            include: [
                                {
                                    model: Cinema,
                                    as: 'cinema',
                                    attributes: ['name'],
                                },
                            ],
                        },
                    ],
                },
                {
                    model: Seat,
                    as: 'seats',
                    attributes: ['row', 'number'],
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['amount', 'status', 'payment_method'],
                },
            ],
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Chuẩn bị dữ liệu để trả về từ API
        const response = {
            ticketId: ticket.id,
            user: ticket.UserData,
            bookingTime: ticket.reserved_at,
            movie: ticket.showtime.movie.title, // Lấy title của phim từ showtime.movie
            cinema: ticket.showtime.theater.cinema.name,
            theater: ticket.showtime.theater.name,
            seats: ticket.seats.map(seat => `${seat.row}-${seat.number}`).join(', '),
            price: ticket.price,
            startTime: ticket.showtime.start_time,
            endTime: ticket.showtime.end_time,
            paymentStatus: ticket.payment.status,
        };

        res.status(200).json({
            message: 'Scan successful',
            data: response,
        });
    } catch (error) {
        console.error('Error in scanTicket:', error);
        res.status(500).json({ message: 'Failed to scan QR code', error: error.message });
    }
};

// exports.validateTicket = async (req, res) => {
//     const { ticketId } = req.params;

//     if (!ticketId) {
//         return res.status(400).json({ message: 'Ticket ID is required' });
//     }

//     try {
//         const ticket = await Ticket.findOne({
//             where: { id: ticketId, status: 'confirmed', payment_status: 'completed' },
//             include: [
//                 {
//                     model: User,
//                     as: 'UserData', // Sử dụng alias UserData
//                     attributes: ['username', 'email'],
//                 },
//                 {
//                     model: Showtime,
//                     as: 'showtime', // Sử dụng alias showtime
//                     attributes: ['start_time', 'end_time'],
//                     include: [
//                         {
//                             model: Theater,
//                             as: 'theater', // Sử dụng alias theater
//                             attributes: ['name'],
//                             include: [
//                                 {
//                                     model: Cinema,
//                                     as: 'cinema', // Sử dụng alias cinema
//                                     attributes: ['name'],
//                                 },
//                             ],
//                         },
//                     ],
//                 },
//                 {
//                     model: Seat,
//                     as: 'seats', // Sử dụng alias seats
//                     attributes: ['row', 'number'],
//                 },
//             ],
//         });

//         if (!ticket) {
//             return res.status(404).json({ message: 'Invalid or expired ticket' });
//         }

//         res.status(200).json({
//             message: 'Ticket validated successfully',
//             data: {
//                 ticketId: ticket.id,
//                 user: ticket.UserData,
//                 showtime: ticket.showtime,
//                 theater: ticket.showtime.theater,
//                 cinema: ticket.showtime.theater.cinema,
//                 seats: ticket.seats.map(seat => `${seat.row}-${seat.number}`).join(', '),
//                 price: ticket.price,
//             },
//         });
//     } catch (error) {
//         console.error('Error in validateTicket:', error);
//         res.status(500).json({ message: 'Failed to validate ticket', error: error.message });
//     }
// };

exports.validateTicket = async (req, res) => {
    const { ticketId } = req.params;

    if (!ticketId) {
        return res.status(400).json({ message: 'Ticket ID is required' });
    }

    try {
        const ticket = await Ticket.findOne({
            where: { id: ticketId },
            include: [
                {
                    model: User,
                    as: 'UserData', // Alias UserData
                    attributes: ['username', 'email'],
                },
                {
                    model: Showtime,
                    as: 'showtime', // Alias showtime
                    attributes: ['start_time', 'end_time'],
                    include: [
                        {
                            model: Theater,
                            as: 'theater', // Alias theater
                            attributes: ['name'],
                            include: [
                                {
                                    model: Cinema,
                                    as: 'cinema', // Alias cinema
                                    attributes: ['name'],
                                },
                            ],
                        },
                    ],
                },
                {
                    model: Seat,
                    as: 'seats', // Alias seats
                    attributes: ['row', 'number'],
                },
            ],
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Invalid or expired ticket' });
        }

        // Kiểm tra nếu vé đã được sử dụng hoặc quá hạn
        const currentTime = new Date();
        if (ticket.status === 'used') {
            return res.status(400).json({ message: 'This ticket has already been used' });
        } else if (ticket.showtime.end_time < currentTime) {
            return res.status(400).json({ message: 'This ticket is expired' });
        }

        // Đánh dấu vé đã sử dụng nếu chưa dùng
        ticket.status = 'used';
        await ticket.save();

        res.status(200).json({
            message: 'Ticket validated successfully',
            data: {
                ticketId: ticket.id,
                user: ticket.UserData,
                showtime: ticket.showtime,
                theater: ticket.showtime.theater,
                cinema: ticket.showtime.theater.cinema,
                seats: ticket.seats.map(seat => `${seat.row}-${seat.number}`).join(', '),
                price: ticket.price,
            },
        });
    } catch (error) {
        console.error('Error in validateTicket:', error);
        res.status(500).json({ message: 'Failed to validate ticket', error: error.message });
    }
};
exports.getBookingHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const bookings = await Ticket.findAll({
            where: {
                user_id: userId,
                payment_status: 'completed'
            },
            attributes: ['id', 'price', 'createdAt'],
            order: [['reserved_at', 'DESC']],
            include: [
                {
                    model: QRCode,
                    attributes: ['code'] // Include QR code
                },
                {
                    model: Showtime,
                    as: 'showtime', // Use the alias specified in your model association
                    attributes: ['start_time', 'end_time'],
                    include: [
                        {
                            model: Movie,
                            as: 'movie',
                            attributes: ['title']
                        },
                        {
                            model: Theater,
                            as: 'theater',
                            attributes: ['name'],
                            include: {
                                model: Cinema,
                                as: 'cinema',
                                attributes: ['name']
                            }
                        }
                    ]
                },
                {
                    model: Seat,
                    as: 'seats', // Alias seats
                    attributes: ['row', 'number'],
                },
            ]
        });

        const bookingHistory = bookings.map(booking => ({
            ticketId: booking.id,
            price: booking.price,
            bookingDate: booking.createdAt,
            qrCode: booking.QRCode?.code || null, // Handle potential null QR code
            movie: booking.showtime.movie.title,
            cinema: booking.showtime.theater.cinema.name,
            theater: booking.showtime.theater.name,
            startTime: booking.showtime.start_time,
            endTime: booking.showtime.end_time,
            seats: booking.seats.map(seat => `${seat.row}-${seat.number}`).join(', '),

        }));

        res.status(200).json({
            message: 'Booking history retrieved successfully',
            data: bookingHistory
        });
    } catch (error) {
        console.error('Error retrieving booking history:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};