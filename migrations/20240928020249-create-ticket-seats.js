'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TicketSeats', {
      ticket_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tickets', // Tên bảng Tickets
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      seat_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Seats', // Tên bảng Seats
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TicketSeats');
  }
};
