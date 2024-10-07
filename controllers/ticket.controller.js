
// // controllers/ticket.controller.js

// const { Op } = require('sequelize');
// const db = require('../models');
// const Ticket = db.Ticket;
// const User = db.User;
// const Showtime = db.Showtime;
// const Cinema = db.Cinema;
// const Seat = db.Seat;

// // Helper function to calculate ticket price
// const calculateTicketPrice = (showtime, seat) => {
//     // Giá suất chiếu và giá ghế đã được lưu trong cơ sở dữ liệu
//     const showtimePrice = parseFloat(showtime.price) || 0;
//     const seatPrice = parseFloat(seat.price) || 0;
//     return showtimePrice + seatPrice;
// };

// // **1. Tạo Vé Mới**
// exports.createTicket = async (req, res) => {
//     try {
//         const { user_id, showtime_id, seat_id } = req.body;

//         // Kiểm tra các trường bắt buộc
//         if (!user_id || !showtime_id || !seat_id) {
//             return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin vé.' });
//         }

//         // Kiểm tra sự tồn tại của User, Showtime và Seat
//         const user = await User.findByPk(user_id);
//         const showtime = await Showtime.findByPk(showtime_id);
//         const seat = await Seat.findByPk(seat_id);

//         if (!user || !showtime || !seat) {
//             return res.status(404).json({ status: 'fail', message: 'User, Showtime hoặc Seat không tồn tại.' });
//         }

//         // Kiểm tra xem ghế đã được đặt chưa
//         const existingTicket = await Ticket.findOne({
//             where: {
//                 showtime_id,
//                 seat_id,
//                 status: { [Op.not]: 'Cancelled' },
//             },
//         });

//         if (existingTicket) {
//             return res.status(400).json({ status: 'fail', message: 'Ghế này đã được đặt.' });
//         }

//         // Tính giá vé = giá ghế + giá suất chiếu
//         const ticketPrice = calculateTicketPrice(showtime, seat);

//         // Tạo vé
//         const newTicket = await Ticket.create({
//             user_id,
//             showtime_id,
//             seat_id,
//             price: ticketPrice,
//             status: 'Booked',
//         });

//         // Cập nhật trạng thái ghế nếu cần (ví dụ: chuyển sang 'booked')
//         await seat.update({ status: 'booked' });

//         res.status(201).json({ status: 'success', data: newTicket });
//     } catch (error) {
//         console.error('Error in createTicket:', error);
//         res.status(500).json({ status: 'fail', message: 'Lỗi khi tạo vé.' });
//     }
// };

// // **2. Lấy Danh Sách Vé Với Phân Trang, Sắp Xếp và Tìm Kiếm**
// exports.getTickets = async (req, res) => {
//     try {
//         let { page, limit, sortField, sortOrder, search, userId, showtimeId } = req.query;

//         // Thiết lập giá trị mặc định
//         page = parseInt(page) || 1;
//         limit = parseInt(limit) || 10;
//         sortField = sortField || 'createdAt';
//         sortOrder = sortOrder ? sortOrder.toUpperCase() : 'DESC';
//         search = search || '';
//         userId = userId || null;
//         showtimeId = showtimeId || null;

//         const offset = (page - 1) * limit;

//         // Xây dựng điều kiện tìm kiếm
//         const whereCondition = {};

//         if (userId) {
//             whereCondition.user_id = userId;
//         }

//         if (showtimeId) {
//             whereCondition.showtime_id = showtimeId;
//         }

//         if (search) {
//             whereCondition[Op.or] = [
//                 { '$user.userusername$': { [Op.like]: `%${search}%` } },
//                 { '$showtime.movie.title$': { [Op.like]: `%${search}%` } },
//                 { status: { [Op.like]: `%${search}%` } },
//             ];
//         }

//         // Tổng số vé thỏa điều kiện
//         const totalTickets = await Ticket.count({
//             where: Object.keys(whereCondition).length > 0 ? whereCondition : {},
//             include: [
//                 { model: User, as: 'user', attributes: ['userusername', 'email'] },
//                 { model: Showtime, as: 'showtime', attributes: ['start_time', 'end_time', 'price'], include: [{ model: db.Movie, as: 'movie', attributes: ['title'] }] },
//                 { model: Seat, as: 'seat', attributes: ['row', 'number', 'type'] },
//             ],
//         });

//         // Lấy danh sách vé
//         const tickets = await Ticket.findAll({
//             where: Object.keys(whereCondition).length > 0 ? whereCondition : {},
//             include: [
//                 { model: User, as: 'user', attributes: ['username', 'email'] },
//                 { model: Showtime, as: 'showtime', attributes: ['start_time', 'end_time', 'price'], include: [{ model: db.Movie, as: 'movie', attributes: ['title'] }] },
//                 { model: Seat, as: 'seat', attributes: ['row', 'number', 'type'] },
//             ],
//             order: [[sortField, sortOrder]],
//             limit: limit,
//             offset: offset,
//         });

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 totalTickets,
//                 currentPage: page,
//                 totalPages: Math.ceil(totalTickets / limit),
//                 tickets,
//             },
//         });
//     } catch (error) {
//         console.error('Error in getTickets:', error);
//         res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách vé.' });
//     }
// };



// // **3. Lấy Một Vé Theo ID**
// exports.getTicketById = async (req, res) => {
//     try {
//         const { ticketId } = req.params;

//         const ticket = await Ticket.findByPk(ticketId, {
//             include: [
//                 { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
//                 {
//                     model: Showtime,
//                     as: 'showtime',
//                     attributes: ['id', 'start_time', 'end_time', 'price'],
//                     include: [
//                         { model: db.Movie, as: 'movie', attributes: ['id', 'title'] },
//                         { model: db.Theater, as: 'theater', attributes: ['id', 'name', 'cinema_id'] },
//                     ],
//                 },
//                 { model: Seat, as: 'seat', attributes: ['id', 'row', 'number', 'type'] },
//             ],
//         });

//         if (!ticket) {
//             return res.status(404).json({ status: 'fail', message: 'Không tìm thấy vé.' });
//         }

//         // Lấy thông tin rạp chiếu từ Theater
//         const cinema = await Cinema.findByPk(ticket.showtime.theater.cinema_id, {
//             attributes: ['id', 'name'],
//         });

//         res.status(200).json({ status: 'success', data: { ...ticket.toJSON(), cinema } });
//     } catch (error) {
//         console.error('Error in getTicketById:', error);
//         res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy vé.' });
//     }
// };

// // **4. Hủy Vé**
// exports.cancelTicket = async (req, res) => {
//     try {
//         const { ticketId } = req.params;

//         const ticket = await Ticket.findByPk(ticketId, {
//             include: [{ model: Seat, as: 'seat' }],
//         });

//         if (!ticket) {
//             return res.status(404).json({ status: 'fail', message: 'Không tìm thấy vé.' });
//         }

//         if (ticket.status === 'Cancelled') {
//             return res.status(400).json({ status: 'fail', message: 'Vé đã được hủy trước đó.' });
//         }

//         // Cập nhật trạng thái vé
//         ticket.status = 'Cancelled';
//         await ticket.save();

//         // Cập nhật trạng thái ghế (trở lại 'available')
//         await ticket.seat.update({ status: 'available' });

//         res.status(200).json({ status: 'success', message: 'Hủy vé thành công.', data: ticket });
//     } catch (error) {
//         console.error('Error in cancelTicket:', error);
//         res.status(500).json({ status: 'fail', message: 'Lỗi khi hủy vé.' });
//     }
// };

// exports.createTicketApi = async (req, res) => {
//     const { showtimeId, seatIds, paymentMethod, userId } = req.body;

//     if (!showtimeId || !seatIds || !paymentMethod || !userId) {
//         return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
//     }

//     try {
//         await sequelize.transaction(async (t) => {
//             // Lấy thông tin suất chiếu để lấy giá suất chiếu
//             const showtime = await Showtime.findOne({
//                 where: { id: showtimeId },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE, // Đảm bảo không thay đổi trong quá trình giao dịch
//             });

//             if (!showtime) {
//                 throw new Error('Suất chiếu không tồn tại.');
//             }

//             const showtimePrice = parseFloat(showtime.price);

//             // Kiểm tra tất cả ghế có còn trống không và thuộc về rạp của suất chiếu
//             const seats = await Seat.findAll({
//                 where: {
//                     id: seatIds,
//                     theater_id: showtime.theater_id, // Đảm bảo ghế thuộc về rạp của suất chiếu
//                     status: 'available'
//                 },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//             });

//             if (seats.length !== seatIds.length) {
//                 throw new Error('Một hoặc nhiều ghế đã được đặt hoặc không tồn tại.');
//             }

//             // Cập nhật trạng thái ghế thành 'booked'
//             await Seat.update(
//                 { status: 'booked' },
//                 {
//                     where: {
//                         id: seatIds
//                     },
//                     transaction: t
//                 }
//             );

//             // Tính tổng giá (giá suất chiếu + giá ghế cho mỗi ghế)
//             let totalPrice = 0;
//             const ticketData = seatIds.map(seatId => {
//                 const seat = seats.find(seat => seat.id === seatId);
//                 if (!seat) {
//                     throw new Error(`Ghế với ID ${seatId} không tồn tại hoặc đã được đặt.`);
//                 }

//                 const seatPrice = parseFloat(seat.price);
//                 const price = showtimePrice + seatPrice;
//                 totalPrice += price;

//                 return {
//                     user_id: userId,
//                     showtime_id: showtimeId,
//                     price: price, // Giá suất chiếu + giá ghế
//                     status: 'confirmed',
//                     payment_method: paymentMethod,
//                     payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed' // Ví dụ: PayPal là 'pending'
//                 };
//             });

//             // Tạo các bản ghi Ticket
//             const createdTickets = await Ticket.bulkCreate(ticketData, { transaction: t });

//             // Liên kết Tickets với Seats thông qua TicketSeats
//             for (let i = 0; i < createdTickets.length; i++) {
//                 await createdTickets[i].addSeat(seatIds[i], { transaction: t });
//             }

//             res.status(201).json({ status: 'success', message: 'Đặt vé thành công.', data: { totalPrice } });
//         });
//     } catch (error) {
//         console.error('Error creating booking:', error);
//         res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
//     }
// };


// controllers/ticket.controller.js



// **createTicketApi: Tạo Vé Mới**
// exports.createTicketApi = async (req, res) => {
//     const { showtimeId, seatIds, paymentMethod, userId } = req.body;

//     if (!showtimeId || !seatIds || !paymentMethod || !userId) {
//         return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
//     }

//     try {
//         await sequelize.transaction(async (t) => {
//             // Lấy thông tin suất chiếu để lấy giá suất chiếu
//             const showtime = await Showtime.findOne({
//                 where: { id: showtimeId },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE, // Đảm bảo không thay đổi trong quá trình giao dịch
//                 include: [{ model: db.Theater, as: 'theater' }], // Đảm bảo theater_id được lấy
//             });

//             if (!showtime) {
//                 throw new Error('Suất chiếu không tồn tại.');
//             }

//             const showtimePrice = parseFloat(showtime.price);

//             // Kiểm tra tất cả ghế có còn trống không và thuộc về rạp của suất chiếu
//             const seats = await Seat.findAll({
//                 where: {
//                     id: seatIds,
//                     theater_id: showtime.theater_id, // Đảm bảo ghế thuộc về rạp của suất chiếu
//                     status: 'available'
//                 },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//             });

//             if (seats.length !== seatIds.length) {
//                 throw new Error('Một hoặc nhiều ghế đã được đặt hoặc không tồn tại.');
//             }

//             // Cập nhật trạng thái ghế thành 'booked'
//             await Seat.update(
//                 { status: 'booked' },
//                 {
//                     where: {
//                         id: seatIds
//                     },
//                     transaction: t
//                 }
//             );

//             // Tính tổng giá (giá suất chiếu + giá ghế cho mỗi ghế)
//             let totalPrice = 0;
//             const ticketData = seatIds.map(seatId => {
//                 const seat = seats.find(seat => seat.id === seatId);
//                 if (!seat) {
//                     throw new Error(`Ghế với ID ${seatId} không tồn tại hoặc đã được đặt.`);
//                 }

//                 const seatPrice = parseFloat(seat.price);
//                 const price = showtimePrice + seatPrice;
//                 totalPrice += price;

//                 return {
//                     user_id: userId,
//                     showtime_id: showtimeId,
//                     price: price, // Giá suất chiếu + giá ghế
//                     status: 'confirmed',
//                     payment_method: paymentMethod,
//                     payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed' // Ví dụ: PayPal là 'pending'
//                 };
//             });

//             // Tạo các bản ghi Ticket
//             const createdTickets = await Ticket.bulkCreate(ticketData, { transaction: t });

//             // Liên kết Tickets với Seats thông qua TicketSeats
//             for (let i = 0; i < createdTickets.length; i++) {
//                 await createdTickets[i].addSeat(seatIds[i], { transaction: t });
//             }

//             res.status(201).json({ status: 'success', message: 'Đặt vé thành công.', data: {  totalPrice } });
//         });
//     } catch (error) {
//         console.error('Error creating booking:', error);
//         res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
//     }
// };
// exports.createTicketApi = async (req, res) => {
//     const { showtimeId, seatIds, paymentMethod, userId } = req.body;

//     if (!showtimeId || !seatIds || !paymentMethod || !userId) {
//         return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
//     }

//     try {
//         await sequelize.transaction(async (t) => {
//             // Lấy thông tin suất chiếu để lấy giá suất chiếu
//             const showtime = await Showtime.findOne({
//                 where: { id: showtimeId },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE, // Đảm bảo không thay đổi trong quá trình giao dịch
//                 include: [{ model: db.Theater, as: 'theater' }], // Đảm bảo theater_id được lấy
//             });
//             console.log("check show time", showtime.theater_id)
//             if (!showtime) {
//                 throw new Error('Suất chiếu không tồn tại.');
//             }

//             const showtimePrice = parseFloat(showtime.price);

//             // Kiểm tra tất cả ghế có còn trống không và thuộc về rạp của suất chiếu
//             const seats = await Seat.findAll({
//                 where: {
//                     id: seatIds,
//                     theater_id: showtime.theater_id, // Đảm bảo ghế thuộc về rạp của suất chiếu
//                     status: 'available'
//                 },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//             });
//     console.log("check seat", seats, seatIds)
//             if (seats.length !== seatIds.length) {
//                 throw new Error('Một hoặc nhiều ghế đã được đặt hoặc không tồn tại.');
//             }

//             // Cập nhật trạng thái ghế thành 'booked'
//             await Seat.update(
//                 { status: 'booked' },
//                 {
//                     where: {
//                         id: seatIds
//                     },
//                     transaction: t
//                 }
//             );

//             // Tính tổng giá (giá suất chiếu + giá ghế cho mỗi ghế)
//             let totalPrice = 0;
//             const ticketData = seatIds.map(seatId => {
//                 const seat = seats.find(seat => seat.id === seatId);
//                 if (!seat) {
//                     throw new Error(`Ghế với ID ${seatId} không tồn tại hoặc đã được đặt.`);
//                 }

//                 const seatPrice = parseFloat(seat.price);
//                 const price = showtimePrice + seatPrice;
//                 totalPrice += price;

//                 return {
//                     user_id: userId,
//                     showtime_id: showtimeId,
//                     price: price, // Giá suất chiếu + giá ghế
//                     status: 'confirmed',
//                     payment_method: paymentMethod,
//                     payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed' // Ví dụ: PayPal là 'pending'
//                 };
//             });

//             // Tạo các bản ghi Ticket
//             const createdTickets = await Ticket.bulkCreate(ticketData, { transaction: t });

//             // Liên kết Tickets với Seats thông qua TicketSeats
//             for (let i = 0; i < createdTickets.length; i++) {
//                 await createdTickets[i].addSeat(seatIds[i], { transaction: t });
//             }

//             // Lấy danh sách ticketId từ các vé đã tạo
//             const ticketIds = createdTickets.map(ticket => ticket.id);

//             // Trả về tổng giá và danh sách ticketId
//             res.status(201).json({
//                 status: 'success',
//                 message: 'Đặt vé thành công.',
//                 data: {
//                     totalPrice,
//                     ticketIds // Trả về danh sách ticketId
//                 }
//             });
//         });
//     } catch (error) {
//         console.error('Error creating booking:', error);
//         res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
//     }
// };
// controllers/ticket.controller.js

// exports.createTicketApi = async (req, res) => {
//     const { showtimeId, seatIds, paymentMethod, userId } = req.body;

//     if (!showtimeId || !seatIds || !paymentMethod || !userId) {
//         return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
//     }

//     try {
//         await sequelize.transaction(async (t) => {
//             // Lấy thông tin suất chiếu để lấy giá suất chiếu
//             const showtime = await Showtime.findOne({
//                 where: { id: showtimeId },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//                 include: [{ model: db.Theater, as: 'theater' }],
//             });

//             if (!showtime) {
//                 throw new Error('Suất chiếu không tồn tại.');
//             }

//             const showtimePrice = parseFloat(showtime.price);

//             // Kiểm tra tất cả ghế có còn trống không và thuộc về rạp của suất chiếu
//             const seats = await Seat.findAll({
//                 where: {
//                     id: seatIds,
//                     theater_id: showtime.theater_id,
//                     status: 'available',
//                 },
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//             });

//             console.log("check seat", seats, seatIds)

//             if (seats.length !== seatIds.length) {
//                 throw new Error('Một hoặc nhiều ghế đã được đặt hoặc không tồn tại.');
//             }

//             // Cập nhật trạng thái ghế thành 'reserved' và đặt thời gian giữ chỗ
//             await Seat.update(
//                 { status: 'reserved' },
//                 {
//                     where: {
//                         id: seatIds,
//                     },
//                     transaction: t,
//                 }
//             );

//             // Tính tổng giá
//             let totalPrice = 0;
//             const ticketData = seatIds.map(seatId => {
//                 const seat = seats.find(seat => seat.id === seatId);
//                 if (!seat) {
//                     throw new Error(`Ghế với ID ${seatId} không tồn tại hoặc đã được đặt.`);
//                 }

//                 const seatPrice = parseFloat(seat.price);
//                 const price = showtimePrice + seatPrice;
//                 totalPrice += price;

//                 return {
//                     user_id: userId,
//                     showtime_id: showtimeId,
//                     price: price,
//                     status: 'confirmed',
//                     payment_method: paymentMethod,
//                     payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed',
//                     reserved_at: paymentMethod === 'paypal' ? new Date() : null,
//                 };
//             });

//             // Tạo các bản ghi Ticket
//             const createdTickets = await Ticket.bulkCreate(ticketData, { transaction: t });

//             // Liên kết Tickets với Seats thông qua TicketSeats
//             for (let i = 0; i < createdTickets.length; i++) {
//                 await createdTickets[i].addSeat(seatIds[i], { transaction: t });
//             }

//             // Lấy danh sách ticketId từ các vé đã tạo
//             const ticketIds = createdTickets.map(ticket => ticket.id);

//             res.status(201).json({
//                 status: 'success',
//                 message: 'Đặt vé thành công.',
//                 data: {
//                     totalPrice,
//                     ticketIds,
//                 },
//             });
//         });
//     } catch (error) {
//         console.error('Error creating booking:', error);
//         res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
//     }
// };
// Helper function to check seat availability for a showtime
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

/**
 * Hàm tạo vé mới
 */
exports.createTicketApi = async (req, res) => {
    const { showtimeId, seatIds, paymentMethod, userId } = req.body;

    if (!showtimeId || !seatIds || !paymentMethod || !userId) {
        return res.status(400).json({ status: 'fail', message: 'Thiếu thông tin đặt vé.' });
    }

    try {
        await sequelize.transaction(async (t) => {
            // Lấy thông tin suất chiếu để lấy giá suất chiếu
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

            // Lấy tất cả ghế đã chọn
            const seats = await Seat.findAll({
                where: {
                    id: seatIds,
                    theater_id: showtime.theater_id,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            console.log("check seat", seats, seatIds);

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

            // Tính tổng giá (giá suất chiếu + giá ghế cho mỗi ghế)
            let totalPrice = 0;
            const ticketData = seatIds.map(seatId => {
                const seat = seats.find(seat => seat.id === seatId);
                if (!seat) {
                    throw new Error(`Ghế với ID ${seatId} không tồn tại.`);
                }

                const seatPrice = parseFloat(seat.price);
                const price = showtimePrice + seatPrice;
                totalPrice += price;

                return {
                    user_id: userId,
                    showtime_id: showtimeId,
                    price: price,
                    status: 'confirmed',
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed',
                    reserved_at: paymentMethod === 'paypal' ? new Date() : null,
                };
            });

            // Tạo các bản ghi Ticket
            const createdTickets = await Ticket.bulkCreate(ticketData, { transaction: t });

            // Liên kết Tickets với Seats thông qua TicketSeats
            for (let i = 0; i < createdTickets.length; i++) {
                await createdTickets[i].addSeat(seatIds[i], { transaction: t });
            }

            // Lấy danh sách ticketId từ các vé đã tạo
            const ticketIds = createdTickets.map(ticket => ticket.id);

            // Trả về tổng giá và danh sách ticketId
            res.status(201).json({
                status: 'success',
                message: 'Đặt vé thành công.',
                data: {
                    totalPrice,
                    ticketIds, // Trả về danh sách ticketId
                },
            });
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
    }
};
// controllers/ticket.controller.js

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
// GET /api/staff/ticket/scan
// exports.scanTicketByQRCode = async (req, res) => {
//     try {
//         const { qrData } = req.body; // QR code chứa mã ticket hoặc ID

//         const qrContent = JSON.parse(qrData); // Giả sử mã QR chứa JSON data
//         const { ticketId } = qrContent;

//         const ticket = await Ticket.findOne({
//             where: { id: ticketId },
//             include: [
//                 { model: User, as: 'UserData', attributes: ['username', 'email'] },
//                 {
//                     model: Showtime, as: 'showtime', attributes: ['start_time', 'end_time'],
//                     include: [
//                         { model: Movie, as: 'movie', attributes: ['title'] },
//                         {
//                             model: Theater, as: 'theater', attributes: ['name'],
//                             include: [{ model: Cinema, as: 'cinema', attributes: ['name'] }]
//                         }
//                     ]
//                 },
//                 { model: Seat, as: 'seats', attributes: ['row', 'number'] },
//             ],
//         });

//         if (!ticket) {
//             return res.status(404).json({ message: 'Ticket not found' });
//         }

//         res.status(200).json({ ticket });
//     } catch (error) {
//         console.error('Error scanning ticket:', error);
//         res.status(500).json({ message: 'Error scanning ticket' });
//     }
// };
// // PATCH /api/staff/ticket/validate/:ticketId
// exports.validateTicket = async (req, res) => {
//     try {
//         const { ticketId } = req.params;

//         const ticket = await Ticket.findOne({
//             where: { id: ticketId, status: 'confirmed', payment_status: 'completed' },
//         });

//         if (!ticket) {
//             return res.status(404).json({ message: 'Ticket is invalid or already used' });
//         }

//         // Cập nhật trạng thái vé là 'used'
//         ticket.status = 'used';
//         await ticket.save();

//         res.status(200).json({ message: 'Ticket is valid and confirmed', ticket });
//     } catch (error) {
//         console.error('Error validating ticket:', error);
//         res.status(500).json({ message: 'Error validating ticket' });
//     }
// };

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

exports.validateTicket = async (req, res) => {
    const { ticketId } = req.params;

    if (!ticketId) {
        return res.status(400).json({ message: 'Ticket ID is required' });
    }

    try {
        const ticket = await Ticket.findOne({
            where: { id: ticketId, status: 'confirmed', payment_status: 'completed' },
            include: [
                {
                    model: User,
                    as: 'UserData', // Sử dụng alias UserData
                    attributes: ['username', 'email'],
                },
                {
                    model: Showtime,
                    as: 'showtime', // Sử dụng alias showtime
                    attributes: ['start_time', 'end_time'],
                    include: [
                        {
                            model: Theater,
                            as: 'theater', // Sử dụng alias theater
                            attributes: ['name'],
                            include: [
                                {
                                    model: Cinema,
                                    as: 'cinema', // Sử dụng alias cinema
                                    attributes: ['name'],
                                },
                            ],
                        },
                    ],
                },
                {
                    model: Seat,
                    as: 'seats', // Sử dụng alias seats
                    attributes: ['row', 'number'],
                },
            ],
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Invalid or expired ticket' });
        }

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

