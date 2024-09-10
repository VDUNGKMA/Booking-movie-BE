const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminAction = sequelize.define('AdminAction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    action_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Tham chiếu đến bảng Users
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
    tableName: 'AdminActions',
    timestamps: true
});

AdminAction.associate = (models) => {
    // Quan hệ n-1 giữa AdminActions và Users (admin là một user)
    AdminAction.belongsTo(models.User, { foreignKey: 'admin_id' });
};

module.exports = AdminAction;
