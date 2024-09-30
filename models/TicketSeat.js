// models/TicketSeats.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketSeats = sequelize.define('TicketSeats', {
    ticket_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Tickets', // Tên model cho Ticket
            key: 'id',
        },
        allowNull: false,
    },
    seat_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Seats', // Tên model cho Seat
            key: 'id',
        },
        allowNull: false,
    }
}, {
    tableName: 'TicketSeats',
    timestamps: false,
});

module.exports = TicketSeats;
