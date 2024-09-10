const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TheaterSeat = sequelize.define('TheaterSeat', {
    theater_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Theaters', // Tham chiếu đến bảng Theaters
            key: 'id'
        }
    },
    seat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Seats', // Tham chiếu đến bảng Seats
            key: 'id'
        }
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
    tableName: 'TheaterSeats',
    timestamps: true
});

module.exports = TheaterSeat;
