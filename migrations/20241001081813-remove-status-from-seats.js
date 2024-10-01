'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the 'status' column from the 'seats' table
    await queryInterface.removeColumn('seats', 'status');
  },

  down: async (queryInterface, Sequelize) => {
    // Add the 'status' column back to the 'seats' table if the migration is rolled back
    await queryInterface.addColumn('seats', 'status', {
      type: Sequelize.ENUM('available', 'reserved', 'booked'),
      allowNull: false,
      defaultValue: 'available',
    });
  }
};
