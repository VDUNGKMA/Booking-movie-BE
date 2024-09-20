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
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image_public_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'Cinemas',
    timestamps: true
});

Cinema.associate = (models) => {
    // Quan hệ 1-nhiều giữa Cinema và Theater
    Cinema.hasMany(models.Theater, {
        foreignKey: 'cinema_id',
        onDelete: 'CASCADE', // Thêm dòng này
        onUpdate: 'CASCADE',
    });

    // Quan hệ 1-nhiều giữa Cinema và Screenings
    Cinema.hasMany(models.Screening, {
        foreignKey: 'cinema_id',
        onDelete: 'CASCADE', // Thêm dòng này
        onUpdate: 'CASCADE',
    });
};

module.exports = Cinema;
