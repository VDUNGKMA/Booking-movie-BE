'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('MovieGenres', {
            movie_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Movies', key: 'id' }
            },
            genre_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Genres', key: 'id' }
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
        await queryInterface.dropTable('MovieGenres');
    }
};
