// models/user.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database'); // Kết nối Sequelize
const Role = require('./Role'); // Import Role model

// Định nghĩa Model User
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING
    },
    image:{
        type: DataTypes.STRING
    },
    role_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Role, // Tham chiếu tới model Role
            key: 'role_id'
        },
        allowNull: false,
        defaultValue: 3 // Mặc định là 'customer'
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,  // Cho phép null khi chưa đặt lại mật khẩu
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,  // Cho phép null khi chưa đặt lại mật khẩu
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            user.password = await bcrypt.hash(user.password, 10); // Mã hóa mật khẩu trước khi lưu
        }
    }
});

// Thiết lập quan hệ giữa User và Role
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });
User.associate = (models) => {
    // Quan hệ nhiều-nhiều giữa Users và Tickets
    User.belongsToMany(models.Ticket, {
        through: 'UserTickets',
        foreignKey: 'user_id',
    });

    // Quan hệ nhiều-nhiều giữa Users và Screenings
    User.belongsToMany(models.Screening, {
        through: 'UserScreenings',
        foreignKey: 'user_id',
    });

    // Quan hệ 1-nhiều giữa Users và Payments
    User.hasMany(models.Payment, { foreignKey: 'user_id' });
};
module.exports = User;
