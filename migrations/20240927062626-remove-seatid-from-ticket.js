'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột seat_id từ bảng Tickets
    await queryInterface.removeColumn('Tickets', 'seat_id');
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột seat_id trong trường hợp cần rollback
    await queryInterface.addColumn('Tickets', 'seat_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Hoặc false, tùy theo yêu cầu của bạn
      references: {
        model: 'Seats', // Tên của bảng mà seat_id tham chiếu tới
        key: 'id'
      }
    });
  }
};

