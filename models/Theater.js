const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Seat = require('./Seat');

const Theater = sequelize.define('Theater', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cinema_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'Theaters',
    timestamps: true
});

Theater.associate = (models) => {
    // Quan hệ nhiều-nhiều giữa Theaters và Movies
    Theater.belongsToMany(models.Movie, {
        through: 'MoviesTheaters',
        foreignKey: 'theater_id',
        as: 'movies',
        onDelete: 'CASCADE', // Thêm dòng này
        onUpdate: 'CASCADE',
    });

    // Quan hệ nhiều-nhiều giữa Theaters và Seats
    Theater.belongsToMany(models.Seat, {
        through: 'TheaterSeats',
        foreignKey: 'theater_id',
        as: 'seats',
        onDelete: 'CASCADE', // Thêm dòng này
        onUpdate: 'CASCADE',
    });

    // Quan hệ 1-nhiều giữa Theaters và Screenings
    // Theater.hasMany(models.Screening, {
    //     foreignKey: 'theater_id', 
    //     onDelete: 'CASCADE', // Thêm dòng này
    //     onUpdate: 'CASCADE', });

    // Quan hệ n-1 giữa Theaters và Cinemas
    Theater.belongsTo(models.Cinema, {
        foreignKey: 'cinema_id', as: 'cinema',
        onDelete: 'CASCADE', // Thêm dòng này
        onUpdate: 'CASCADE', });
    // Quan hệ một-nhiều giữa Theater và Showtime
    Theater.hasMany(models.Showtime, {
        foreignKey: 'theater_id',
        as: 'showtimes',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
};

module.exports = Theater;
