'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thay đổi kiểu dữ liệu của cột status thành ENUM('confirmed', 'cancelled')
    await queryInterface.changeColumn('Tickets', 'status', {
      type: Sequelize.ENUM('confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'confirmed'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Khôi phục lại kiểu dữ liệu ban đầu nếu cần
    await queryInterface.changeColumn('Tickets', 'status', {
      type: Sequelize.ENUM('Booked', 'Cancelled'), // Giá trị cũ
      allowNull: false,
      defaultValue: 'Booked'
    });
  }
};
