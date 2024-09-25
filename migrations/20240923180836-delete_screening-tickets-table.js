'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cập nhật bảng Tickets
    await queryInterface.removeColumn('Tickets', 'screening_id'); // Xóa trường screening_id

  },

  down: async (queryInterface, Sequelize) => {
    // Quay lại thay đổi
    await queryInterface.addColumn('Tickets', 'screening_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Screenings',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });


  }
};