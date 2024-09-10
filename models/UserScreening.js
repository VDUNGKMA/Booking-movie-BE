const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserScreening = sequelize.define('UserScreening', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Bảng Users
            key: 'id'
        }
    },
    screening_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Screenings', // Bảng Screenings
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
    tableName: 'UserScreenings',
    timestamps: true
});

module.exports = UserScreening;
