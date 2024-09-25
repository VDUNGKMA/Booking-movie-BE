const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    theater_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Theaters',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    row: {
        type: DataTypes.STRING,
        allowNull: false
    },
    number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Normal', 'VIP', 'Couple'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'reserved', 'booked'),
        allowNull: false,
        defaultValue: 'available'
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'seats',
    timestamps: true
});

Seat.associate = (models) => {
    Seat.belongsTo(models.Theater, { foreignKey: 'theater_id', as: 'theater' });
};

module.exports = Seat;
