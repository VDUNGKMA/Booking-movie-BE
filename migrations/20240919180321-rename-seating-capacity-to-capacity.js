'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Theaters', 'seating_capacity', 'capacity');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Theaters', 'capacity', 'seating_capacity');
  }
};