// models/showtime.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Theater = require('./Theater');

const Showtime = sequelize.define('Showtime', {
    theater_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    movie_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Scheduled',
    },
    price: { // Thêm trường price
        type: DataTypes.DECIMAL(10, 2), // Sử dụng DECIMAL để lưu trữ giá tiền
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0, // Giá không được âm
        },
    },
}, {
    tableName: 'Showtimes',
    timestamps: true,
});

Showtime.associate = function (models) {
    Showtime.belongsTo(models.Theater, {
        foreignKey: 'theater_id',
        as: 'theater',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Showtime.belongsTo(models.Movie, {
        foreignKey: 'movie_id',
        as: 'movie',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    Showtime.hasMany(models.Seat, {
        foreignKey: 'showtime_id',
        as: 'seats',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    // Quan hệ với Tickets (nếu có)
    Showtime.hasMany(models.Ticket, { foreignKey: 'showtime_id', as: 'tickets' });

};

module.exports = Showtime;