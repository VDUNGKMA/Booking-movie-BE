const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    theater_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Theaters',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    row: {
        type: DataTypes.STRING,
        allowNull: false
    },
    number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Normal', 'VIP', 'Couple'),
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'seats',
    timestamps: true
});

Seat.associate = (models) => {
    // Seat.belongsTo(models.Theater, { foreignKey: 'theater_id', as: 'theater' });
    Seat.belongsTo(models.Theater, {
        foreignKey: 'theater_id',
        as: 'theater'
    });
    // Quan hệ một-nhiều giữa Seat và Tickets (nếu có)
    // Seat.hasMany(models.Ticket, { foreignKey: 'seat_id', as: 'tickets' });
    Seat.belongsToMany(models.Ticket, {
        through: 'TicketSeats',
        foreignKey: 'seat_id',
        otherKey: 'ticket_id',
        as: 'tickets',
    });
};

module.exports = Seat;
