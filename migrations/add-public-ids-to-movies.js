// migrations/xxxxxx-add-public-ids-to-movies.js
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('movies', 'poster_public_id', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('movies', 'trailer_public_id', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('movies', 'poster_public_id');
        await queryInterface.removeColumn('movies', 'trailer_public_id');
    },
};
