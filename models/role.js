// models/role.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Kết nối Sequelize

// Định nghĩa Model Role
const Role = sequelize.define('Role', {
    role_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    timestamps: false // Không cần trường createdAt, updatedAt
});

module.exports = Role;
