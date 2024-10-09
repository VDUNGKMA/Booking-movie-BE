'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Tickets', 'status', {
      type: Sequelize.ENUM('confirmed', 'cancelled', 'used'),
      allowNull: false,
      defaultValue: 'confirmed'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // For the down function, we need to remove the 'used' value and reset the ENUM back to the original values
    await queryInterface.changeColumn('Tickets', 'status', {
      type: Sequelize.ENUM('confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'confirmed'
    });
  }
};
