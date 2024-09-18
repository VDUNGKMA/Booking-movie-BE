'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'image', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Users', 'image');
    }
};
