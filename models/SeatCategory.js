const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeatCategory = sequelize.define('SeatCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price_multiplier: {
        type: DataTypes.FLOAT,
        allowNull: false
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
    tableName: 'SeatCategories',
    timestamps: true
});

SeatCategory.associate = (models) => {
    // Quan hệ 1-nhiều giữa SeatCategory và Seats
    SeatCategory.hasMany(models.Seat, { foreignKey: 'seat_category_id' });
};

module.exports = SeatCategory;
