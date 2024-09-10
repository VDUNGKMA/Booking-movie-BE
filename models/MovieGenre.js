const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovieGenre = sequelize.define('MovieGenre', {
    movie_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Movies', // Tham chiếu đến bảng Movies
            key: 'id'
        }
    },
    genre_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Genres', // Tham chiếu đến bảng Genres
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
    tableName: 'MovieGenres',
    timestamps: true
});

module.exports = MovieGenre;
