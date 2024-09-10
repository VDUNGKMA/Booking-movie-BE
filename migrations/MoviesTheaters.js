'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('MoviesTheaters', {
            movie_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Movies', key: 'id' }
            },
            theater_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Theaters', key: 'id' }
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('MoviesTheaters');
    }
};
