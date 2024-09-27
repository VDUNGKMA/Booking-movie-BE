'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TicketSeats', {
      ticket_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tickets', // Tên bảng Tickets
          key: 'id',
        },
        onDelete: 'CASCADE', // Xóa dữ liệu liên quan khi xóa Ticket
      },
      seat_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Seats', // Tên bảng Seats
          key: 'id',
        },
        onDelete: 'CASCADE', // Xóa dữ liệu liên quan khi xóa Seat
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TicketSeats');
  },
};
