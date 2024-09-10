'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Seats', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            seat_number: {
                type: Sequelize.STRING,
                allowNull: false
            },
            seat_category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'SeatCategories', key: 'id' }
            },
            status: {
                type: Sequelize.ENUM('available', 'reserved', 'booked'),
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Seats');
    }
};
