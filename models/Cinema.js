// models/cinema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cinema = sequelize.define('Cinema', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    number_of_halls: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'Cinemas',
    timestamps: true
});

Cinema.associate = (models) => {
    // Quan hệ 1-nhiều giữa Cinema và Theater
    Cinema.hasMany(models.Theater, { foreignKey: 'cinema_id' });

    // Quan hệ 1-nhiều giữa Cinema và Screenings
    Cinema.hasMany(models.Screening, { foreignKey: 'cinema_id' });
};

module.exports = Cinema;
