// cron/reservationCleanup.js

const cron = require('node-cron');
// const { Ticket, Seat } = require('../models');
const db = require('../models');
const Ticket = db.Ticket;
const Seat = db.Seat;
const { Op } = require('sequelize');

/**
 * Hàm giải phóng các vé hết hạn và cập nhật trạng thái ghế
 */
async function releaseExpiredReservations() {
    console.log('Running reservation cleanup job...');

    // Xác định thời gian hết hạn (ví dụ: 15 phút trước)
    const expirationTime = new Date(Date.now() - 15 * 60 * 1000); // 15 phút

    try {
        // Tìm các vé có trạng thái 'pending' và đã được đặt trước hơn 15 phút
        const expiredTickets = await Ticket.findAll({
            where: {
                payment_status: 'pending',
                reserved_at: { [Op.lte]: expirationTime },
            },
            include: [{
                model: Seat,
                as: 'seats', // Sử dụng alias đã định nghĩa trong model
            }],
        });

        for (const ticket of expiredTickets) {
            const seats = ticket.seats; // Sử dụng alias 'seats'
            const seatIds = seats.map(seat => seat.id);

            // Cập nhật trạng thái ghế thành 'available'
            await Seat.update(
                { status: 'available' },
                {
                    where: { id: seatIds },
                }
            );

            // Cập nhật trạng thái vé thành 'cancelled'
            ticket.payment_status = 'cancelled';
            await ticket.save();

            console.log(`Released seats for ticket ID: ${ticket.id}`);
        }
    } catch (error) {
        console.error('Error releasing expired reservations:', error.message);
    }
}

// Đặt cron job chạy mỗi phút
cron.schedule('* * * * *', () => {
    releaseExpiredReservations();
});
