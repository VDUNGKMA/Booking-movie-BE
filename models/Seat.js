const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    seat_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    seat_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'reserved', 'booked'),
        allowNull: false
    }
}, {
    tableName: 'Seats',
    timestamps: true
});

Seat.associate = (models) => {
    // Quan hệ nhiều-nhiều giữa Seats và Theaters
    Seat.belongsToMany(models.Theater, {
        through: 'TheaterSeats',
        foreignKey: 'seat_id',
    });

    // Quan hệ n-1 giữa Seats và SeatCategories
    Seat.belongsTo(models.SeatCategory, { foreignKey: 'seat_category_id' });
    // Quan hệ n-1 giữa Seats và Tickets
    Seat.hasMany(models.Ticket, { foreignKey: 'seat_id' });
};

module.exports = Seat;
