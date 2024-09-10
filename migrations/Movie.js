'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Movies', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            release_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            duration: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            director: {
                type: Sequelize.STRING,
                allowNull: true
            },
            rating: {
                type: Sequelize.DECIMAL(3, 1),
                allowNull: true
            },
            poster_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            trailer_url: {
                type: Sequelize.STRING,
                allowNull: true
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
        await queryInterface.dropTable('Movies');
    }
};
