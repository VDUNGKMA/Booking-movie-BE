const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Model tham chiếu
            key: 'id'
        }
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Tickets', // Model tham chiếu
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
    tableName: 'Payments',
    timestamps: true
});
Payment.associate = (models) => {
    // Quan hệ n-1 giữa Payments và Users
    Payment.belongsTo(models.User, { foreignKey: 'user_id' });

    // Quan hệ n-1 giữa Payments và Tickets
    Payment.belongsTo(models.Ticket, { foreignKey: 'ticket_id' });
};
module.exports = Payment;
