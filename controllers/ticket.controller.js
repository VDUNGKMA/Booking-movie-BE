// controllers/ticket.controller.js

const { Op } = require('sequelize');
const db = require('../models');
const QR = require('qrcode');
const Ticket = db.Ticket;
const User = db.User;
const Showtime = db.Showtime;
const Cinema = db.Cinema;
const Seat = db.Seat;
const Movie = db.Movie;
const Theater = db.Theater;
const QRCode = db.QRCode

// Helper function to calculate ticket price
const calculateTicketPrice = (showtime, seat) => {
    // Giá suất chiếu và giá ghế đã được lưu trong cơ sở dữ liệu
    const showtimePrice = parseFloat(showtime.price) || 0;
    const seatPrice = parseFloat(seat.price) || 0;
    return showtimePrice + seatPrice;
};

//tạo dữ liệu cho QR code
async function generateTicketInfo(ticketId) {
    const ticket = await Ticket.findByPk(ticketId, {
        include: [
            {
                model: Screening,
                include: [
                    {
                        model: Movie,
                        attributes: ['title']
                    },
                    {
                        model: Cinema,
                        attributes: ['name', 'location']
                    },
                    {
                        model: Theater,
                        attributes: ['name']
                    }
                ]
            },
            {
                model: Seat,
                attributes: ['seat_number']
            }
        ],
    });

    if (ticket) {
        return {
            movieName: ticket.Screening?.Movie?.title || 'N/A',
            theaterName: ticket.Screening?.Theater?.name || 'N/A',
            cinemaName: ticket.Screening?.Cinema?.name || 'N/A',
            location: ticket.Screening?.Cinema?.location || 'N/A',
            seatName: ticket.Seat?.seat_number || 'N/A' 
        };
    }
    // Thông báo khi không tìm thấy vé
    console.error(`Ticket with ID ${ticketId} not found.`);
    return null;
}

// **1. Tạo Vé Mới**
exports.createTicket = async (req, res) => {

    try {
        const { user_id, showtime_id, seat_id } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!user_id || !showtime_id || !seat_id) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin vé.' });
        }

        // Kiểm tra sự tồn tại của User, Showtime và Seat
        const user = await User.findByPk(user_id);
        const showtime = await Showtime.findByPk(showtime_id);
        const seat = await Seat.findByPk(seat_id);

        if (!user || !showtime || !seat) {
            return res.status(404).json({ status: 'fail', message: 'User, Showtime hoặc Seat không tồn tại.' });
        }

        // Kiểm tra xem suất chiếu có tồn tại không
        const screening = await Screening.findByPk(screening_id);
        if (!screening) {
            return res.status(404).json({
                status: 'fail',
                message: 'Suất chiếu không tồn tại'
            });
        }

        // Đặt vé
        const ticket = await Ticket.create({
            user_id: req.user.id,
            screening_id,
            seat_id,
            price,
            status: 'booked'
        });

        // Cập nhật trạng thái ghế
        seat.status = 'booked';
        await seat.save();

        // Tạo dữ liệu mã QR
        const ticketInfo = await generateTicketInfo(ticket.id);
        console.log('Ticket Info:', ticketInfo); // Kiểm tra giá trị


        // Tạo mã QR code dưới dạng base64
        QR.toDataURL(JSON.stringify(ticketInfo), async (err, url) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate QR code' });
            }

            // Lưu mã QR vào cơ sở dữ liệu (liên kết với bảng Tickets)
            const qrCode = await QRCode.create({
                code: url,          // Base64 của mã QR
                ticket_id: ticket.id  // Liên kết với vé đã đặt
            });

            // Trả về thông tin vé và mã QR
            res.status(201).json({
                status: 'success',
                data: {
                    ticket,
                    qrCode: qrCode.code  // Base64 mã QR trả về cho client
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};


exports.getCustomerTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            where: { user_id: req.user.id }
        });
        res.status(200).json({
            status: 'success',
            data: { tickets }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};

exports.getTicketByCustomer = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({

        // Kiểm tra xem ghế đã được đặt chưa
        const existingTicket = await Ticket.findOne({
            where: {
                showtime_id,
                seat_id,
                status: { [Op.not]: 'Cancelled' },
            },
        });

        if (existingTicket) {
            return res.status(400).json({ status: 'fail', message: 'Ghế này đã được đặt.' });
        }

        // Tính giá vé = giá ghế + giá suất chiếu
        const ticketPrice = calculateTicketPrice(showtime, seat);

        // Tạo vé
        const newTicket = await Ticket.create({
            user_id,
            showtime_id,
            seat_id,
            price: ticketPrice,
            status: 'Booked',
        });

        // Cập nhật trạng thái ghế nếu cần (ví dụ: chuyển sang 'booked')
        await seat.update({ status: 'booked' });

        res.status(201).json({ status: 'success', data: newTicket });
    } catch (error) {
        console.error('Error in createTicket:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi tạo vé.' });
    }
};

// **2. Lấy Danh Sách Vé Với Phân Trang, Sắp Xếp và Tìm Kiếm**
exports.getTickets = async (req, res) => {
    try {
        let { page, limit, sortField, sortOrder, search, userId, showtimeId } = req.query;

        // Thiết lập giá trị mặc định
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortField = sortField || 'createdAt';
        sortOrder = sortOrder ? sortOrder.toUpperCase() : 'DESC';
        search = search || '';
        userId = userId || null;
        showtimeId = showtimeId || null;

        const offset = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        const whereCondition = {};

        if (userId) {
            whereCondition.user_id = userId;
        }

        if (showtimeId) {
            whereCondition.showtime_id = showtimeId;
        }

        if (search) {
            whereCondition[Op.or] = [
                { '$user.userusername$': { [Op.like]: `%${search}%` } },
                { '$showtime.movie.title$': { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
            ];
        }

        // Tổng số vé thỏa điều kiện
        const totalTickets = await Ticket.count({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : {},
            include: [
                { model: User, as: 'user', attributes: ['userusername', 'email'] },
                { model: Showtime, as: 'showtime', attributes: ['start_time', 'end_time', 'price'], include: [{ model: db.Movie, as: 'movie', attributes: ['title'] }] },
                { model: Seat, as: 'seat', attributes: ['row', 'number', 'type'] },
            ],
        });

        // Lấy danh sách vé
        const tickets = await Ticket.findAll({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : {},
            include: [
                { model: User, as: 'user', attributes: ['username', 'email'] },
                { model: Showtime, as: 'showtime', attributes: ['start_time', 'end_time', 'price'], include: [{ model: db.Movie, as: 'movie', attributes: ['title'] }] },
                { model: Seat, as: 'seat', attributes: ['row', 'number', 'type'] },
            ],
            order: [[sortField, sortOrder]],
            limit: limit,
            offset: offset,
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalTickets,
                currentPage: page,
                totalPages: Math.ceil(totalTickets / limit),
                tickets,
            },
        });
    } catch (error) {
        console.error('Error in getTickets:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách vé.' });
    }
};



// **3. Lấy Một Vé Theo ID**
exports.getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                {
                    model: Showtime,
                    as: 'showtime',
                    attributes: ['id', 'start_time', 'end_time', 'price'],
                    include: [
                        { model: db.Movie, as: 'movie', attributes: ['id', 'title'] },
                        { model: db.Theater, as: 'theater', attributes: ['id', 'name', 'cinema_id'] },
                    ],
                },
                { model: Seat, as: 'seat', attributes: ['id', 'row', 'number', 'type'] },
            ],
        });

        if (!ticket) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy vé.' });
        }

        // Lấy thông tin rạp chiếu từ Theater
        const cinema = await Cinema.findByPk(ticket.showtime.theater.cinema_id, {
            attributes: ['id', 'name'],
        });

        res.status(200).json({ status: 'success', data: { ...ticket.toJSON(), cinema } });
    } catch (error) {
        console.error('Error in getTicketById:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy vé.' });
    }
};

// **4. Hủy Vé**
exports.cancelTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findByPk(ticketId, {
            include: [{ model: Seat, as: 'seat' }],
        });

        if (!ticket) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy vé.' });
        }

        if (ticket.status === 'Cancelled') {
            return res.status(400).json({ status: 'fail', message: 'Vé đã được hủy trước đó.' });
        }

        // Cập nhật trạng thái vé
        ticket.status = 'Cancelled';
        await ticket.save();

        // Cập nhật trạng thái ghế (trở lại 'available')
        await ticket.seat.update({ status: 'available' });

        res.status(200).json({ status: 'success', message: 'Hủy vé thành công.', data: ticket });
    } catch (error) {
        console.error('Error in cancelTicket:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi hủy vé.' });
    }
};
exports.createTicketApi = async (req, res) => {
    const { showtimeId, seatIds, paymentMethod, userId } = req.body;

    if (!showtimeId || !seatIds || !paymentMethod || !userId) {
        return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
    }

    try {
        await sequelize.transaction(async (t) => {
            // Kiểm tra tất cả ghế có còn trống không
            const seats = await Seat.findAll({
                where: {
                    id: seatIds,
                    showtime_id: showtimeId,
                    status: 'available'
                },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (seats.length !== seatIds.length) {
                throw new Error('Một hoặc nhiều ghế đã được đặt.');
            }

            // Cập nhật trạng thái ghế thành 'booked'
            await Seat.update(
                { status: 'booked' },
                {
                    where: {
                        id: seatIds
                    },
                    transaction: t
                }
            );

            // Tính tổng giá
            const totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0);

            // Tạo bản ghi Booking cho mỗi ghế
            const ticket = seatIds.map(seatId => ({
                user_id: userId,
                showtime_id: showtimeId,
                seat_id: seatId,
                status: 'confirmed',
                price: seats.find(seat => seat.id === seatId).price,
                payment_method: paymentMethod,
                payment_status: 'completed' // Hoặc 'pending' tùy thuộc vào phương thức thanh toán
            }));

            await Ticket.bulkCreate(ticket, { transaction: t });

            res.status(201).json({ status: 'success', message: 'Đặt vé thành công.', data: { totalPrice } });
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
    }
};

