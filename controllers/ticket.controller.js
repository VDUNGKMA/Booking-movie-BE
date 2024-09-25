// controllers/staff.controller.js
const Ticket = require('../models/Ticket');
const Seat = require('../models/Seat');
const Screening = require('../models/Screening');
const Cinema = require('../models/Cinema');
const Movie = require('../models/movie');
const Theater = require('../models/Theater');
const QR = require('qrcode');
const QRCode = require('../models/QRCode');

exports.getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vé không tồn tại'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { ticket }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
// API Cập Nhật Trạng Thái Vé
exports.updateTicketStatus = async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vé không tồn tại'
            });
        }
        ticket.status = req.body.status; // Ví dụ: "booked", "confirmed", "canceled"
        await ticket.save();
        res.status(200).json({
            status: 'success',
            data: { ticket }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};

//đặt vé

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

exports.bookTicket = async (req, res) => {
    try {
        const { screening_id, seat_id, price } = req.body;

        // Kiểm tra xem ghế có khả dụng không
        const seat = await Seat.findByPk(seat_id);
        if (!seat || seat.status !== 'available') {
            return res.status(400).json({
                status: 'fail',
                message: 'Ghế không khả dụng'
            });
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
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });
        if (!ticket) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vé không tồn tại hoặc không thuộc về người dùng'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { ticket }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
