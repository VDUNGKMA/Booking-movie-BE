'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tickets', 'payment_method', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn('Tickets', 'payment_status', {
      type: Sequelize.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tickets', 'payment_method');
    await queryInterface.removeColumn('Tickets', 'payment_status');
  }
};