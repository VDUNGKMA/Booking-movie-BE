// models/Image.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Đảm bảo rằng bạn đã kết nối với cơ sở dữ liệu

const Image = sequelize.define('Image', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imagePath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'images', // Tên bảng
    timestamps: false,    // Không dùng tự động timestamps của Sequelize
});

module.exports = Image;
