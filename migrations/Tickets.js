'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Tickets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            price: {
                type: Sequelize.FLOAT,
                allowNull: false
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Users', key: 'id' }
            },
            screening_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Screenings', key: 'id' }
            },
            // seat_id: {
            //     type: Sequelize.INTEGER,
            //     allowNull: false,
            //     references: { model: 'Seats', key: 'id' }
            // },
            status: {
                type: Sequelize.ENUM('booked', 'canceled', 'confirmed'),
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
        await queryInterface.dropTable('Tickets');
    }
};
