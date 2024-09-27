'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
      await queryInterface.addColumn('Payments', 'ticket_id', {
          type: Sequelize.INTEGER,
          references: {
              model: 'Tickets',
              key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
      });
  },

  async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn('Payments', 'ticket_id');
  }
};

