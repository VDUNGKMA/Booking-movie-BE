const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Showtime = require('./Showtime');
const Seat = require('./Seat');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Tên bảng Users
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    showtime_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Showtimes', // Tên bảng Showtimes
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    seat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Seats', // Tên bảng Seats
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0,
        },
    },
    status: { // Trạng thái đặt vé
        type: DataTypes.ENUM('confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'confirmed'
    },
    payment_method: { // Phương thức thanh toán
        type: DataTypes.STRING,
        allowNull: false
    },
    payment_status: { // Trạng thái thanh toán
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'Tickets',
    timestamps: true,
});

// Associations
Ticket.associate = function (models) {
    Ticket.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Ticket.belongsTo(models.Showtime, {
        foreignKey: 'showtime_id',
        as: 'showtime',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    // Quan hệ n-1 giữa Tickets và Seats
    Ticket.belongsTo(models.Seat, { foreignKey: 'seat_id' });

    // Quan hệ n-nhiều giữa Tickets và Payments
    Ticket.belongsToMany(models.Payment, { through: 'PaymentTickets', foreignKey: 'ticket_id' });

    // Quan hệ 1-1 giữa Tickets và QRCode
    Ticket.hasOne(models.QRCode, { foreignKey: 'ticket_id' });

    Ticket.belongsTo(models.Seat, {
        foreignKey: 'seat_id',
        as: 'seat',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

};

module.exports = Ticket;
