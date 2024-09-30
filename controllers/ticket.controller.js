
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

const { Op } = require('sequelize');
const db = require('../models');
const Ticket = db.Ticket;
const User = db.User;
const Showtime = db.Showtime;
const Cinema = db.Cinema;
const Seat = db.Seat;

// Import sequelize từ db
const sequelize = db.sequelize;

// Helper function to calculate ticket price
const calculateTicketPrice = (showtime, seat) => {
    // Giá suất chiếu và giá ghế đã được lưu trong cơ sở dữ liệu
    const showtimePrice = parseFloat(showtime.price) || 0;
    const seatPrice = parseFloat(seat.price) || 0;
    return showtimePrice + seatPrice;
};

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
                lock: t.LOCK.UPDATE, // Đảm bảo không thay đổi trong quá trình giao dịch
                include: [{ model: db.Theater, as: 'theater' }], // Đảm bảo theater_id được lấy
            });

            if (!showtime) {
                throw new Error('Suất chiếu không tồn tại.');
            }

            const showtimePrice = parseFloat(showtime.price);

            // Kiểm tra tất cả ghế có còn trống không và thuộc về rạp của suất chiếu
            const seats = await Seat.findAll({
                where: {
                    id: seatIds,
                    theater_id: showtime.theater_id, // Đảm bảo ghế thuộc về rạp của suất chiếu
                    status: 'available'
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
// console.log("check seat", seats)
            if (seats.length !== seatIds.length) {
                throw new Error('Một hoặc nhiều ghế đã được đặt hoặc không tồn tại.');
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

            // Tính tổng giá (giá suất chiếu + giá ghế cho mỗi ghế)
            let totalPrice = 0;
            const ticketData = seatIds.map(seatId => {
                const seat = seats.find(seat => seat.id === seatId);
                if (!seat) {
                    throw new Error(`Ghế với ID ${seatId} không tồn tại hoặc đã được đặt.`);
                }

                const seatPrice = parseFloat(seat.price);
                const price = showtimePrice + seatPrice;
                totalPrice += price;

                return {
                    user_id: userId,
                    showtime_id: showtimeId,
                    price: price, // Giá suất chiếu + giá ghế
                    status: 'confirmed',
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'paypal' ? 'pending' : 'completed' // Ví dụ: PayPal là 'pending'
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
                    ticketIds // Trả về danh sách ticketId
                }
            });
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ status: 'fail', message: error.message || 'Lỗi khi đặt vé.' });
    }
};

