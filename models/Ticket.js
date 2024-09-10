const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    screening_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Screenings',
            key: 'id'
        }
    },
    seat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Seats',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('booked', 'canceled', 'confirmed'),
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Tickets',
    timestamps: true
});

Ticket.associate = (models) => {
    // Quan hệ n-1 giữa Tickets và Users (qua bảng trung gian)
    Ticket.belongsToMany(models.User, {
        through: 'UserTickets',
        foreignKey: 'ticket_id',
    });

    // Quan hệ n-1 giữa Tickets và Screenings
    Ticket.belongsTo(models.Screening, { foreignKey: 'screening_id' });

    // Quan hệ n-1 giữa Tickets và Seats
    Ticket.belongsTo(models.Seat, { foreignKey: 'seat_id' });

    // Quan hệ 1-nhiều giữa Tickets và Payments
    Ticket.hasMany(models.Payment, { foreignKey: 'ticket_id' });

    // Quan hệ 1-1 giữa Tickets và QRCode
    Ticket.hasOne(models.QRCode, { foreignKey: 'ticket_id' });
};

module.exports = Ticket;
