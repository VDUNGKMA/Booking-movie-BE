const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Genre = sequelize.define('Genre', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    genre_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'Genres',
    timestamps: true
});

Genre.associate = (models) => {
    // Quan hệ nhiều-nhiều giữa Genres và Movies
    Genre.belongsToMany(models.Movie, {
        through: 'MovieGenres',
        foreignKey: 'genre_id',
    });
};

module.exports = Genre;
