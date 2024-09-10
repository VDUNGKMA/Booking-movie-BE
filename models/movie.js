const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Movie = sequelize.define('Movie', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    release_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    director: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rating: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true
    },
    poster_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    trailer_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Movies',
    timestamps: true
});

Movie.associate = (models) => {
    // Quan hệ nhiều-nhiều giữa Movies và Genres
    Movie.belongsToMany(models.Genre, {
        through: 'MovieGenres',
        foreignKey: 'movie_id',
    });

    // Quan hệ nhiều-nhiều giữa Movies và Theaters
    Movie.belongsToMany(models.Theater, {
        through: 'MoviesTheaters',
        foreignKey: 'movie_id',
    });

    // Quan hệ 1-nhiều giữa Movies và Screenings
    Movie.hasMany(models.Screening, { foreignKey: 'movie_id' });
};

module.exports = Movie;
