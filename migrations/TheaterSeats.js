'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('TheaterSeats', {
            theater_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Theaters', key: 'id' }
            },
            seat_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Seats', key: 'id' }
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('TheaterSeats');
    }
};
