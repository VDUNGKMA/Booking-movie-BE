

const { Op } = require('sequelize');
const db = require('../models');
const { Ticket, Seat } = db;

async function releaseExpiredReservations() {
    console.log('Running reservation cleanup job...');

    // Xác định thời gian hết hạn (ví dụ: 5 phút trước)
    const expirationTime = new Date(Date.now() - 1 * 60 * 1000); // 5 phút

    try {
        // Tìm các vé có trạng thái 'pending' và đã được đặt trước hơn 5 phút
        const expiredTickets = await Ticket.findAll({
            where: {
                payment_status: 'pending',
                reserved_at: { [Op.lte]: expirationTime },
            },
            include: [
                {
                    model: Seat,
                    as: 'seats', // Sử dụng alias đã định nghĩa trong model
                },
            ],
        });

        for (const ticket of expiredTickets) {
            // Cập nhật trạng thái vé thành 'cancelled'
            ticket.payment_status = 'failed';
            await ticket.save();

            console.log(`Cancelled ticket ID: ${ticket.id}`);
        }

        console.log('Reservation cleanup job completed.');
    } catch (error) {
        console.error('Error releasing expired reservations:', error);
    }
}

module.exports = releaseExpiredReservations;
