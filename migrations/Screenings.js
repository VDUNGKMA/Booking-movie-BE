'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Screenings', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            screening_time: {
                type: Sequelize.DATE,
                allowNull: false
            },
            movie_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Movies', key: 'id' }
            },
            theater_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Theaters', key: 'id' }
            },
            cinema_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Cinemas', key: 'id' }
            },
            available_seats: {
                type: Sequelize.INTEGER,
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
        await queryInterface.dropTable('Screenings');
    }
};
