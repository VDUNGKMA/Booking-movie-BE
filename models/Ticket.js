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
    // seat_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     references: {
    //         model: 'Seats', // Tên bảng Seats
    //         key: 'id',
    //     },
    //     onDelete: 'CASCADE',
    //     onUpdate: 'CASCADE'
    // },
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

    // Quan hệ n-n giữa Tickets và Seats
    Ticket.belongsToMany(models.Seat, { through: 'TicketSeats', foreignKey: 'ticket_id' });

    // Quan hệ 1-1 giữa Tickets và Payments
    Ticket.hasOne(models.Payment, {
        foreignKey: 'ticket_id',
        onDelete: 'CASCADE', // Xóa Payment khi Ticket bị xóa
        onUpdate: 'CASCADE'  // Cập nhật Payment khi Ticket bị cập nhật
    });

    // Quan hệ 1-1 giữa Tickets và QRCode
    Ticket.hasOne(models.QRCode, { foreignKey: 'ticket_id' });
};

module.exports = Ticket;
