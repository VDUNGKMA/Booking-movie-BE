const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    seating_capacity: {
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
    });

    // Quan hệ nhiều-nhiều giữa Theaters và Seats
    Theater.belongsToMany(models.Seat, {
        through: 'TheaterSeats',
        foreignKey: 'theater_id',
    });

    // Quan hệ 1-nhiều giữa Theaters và Screenings
    Theater.hasMany(models.Screening, { foreignKey: 'theater_id' });

    // Quan hệ n-1 giữa Theaters và Cinemas
    Theater.belongsTo(models.Cinema, { foreignKey: 'cinema_id' });
};

module.exports = Theater;
