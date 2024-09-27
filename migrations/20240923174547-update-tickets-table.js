'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Thêm cột 'showtime_id'
      await queryInterface.addColumn('Tickets', 'showtime_id','screening_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Showtimes',
          key: 'id',
        },
        onDelete: 'CASCADE',
      }, { transaction: t });

      // Thay đổi kiểu dữ liệu của 'price' nếu cần
      await queryInterface.changeColumn('Tickets', 'price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      }, { transaction: t });

      // Thay đổi kiểu ENUM của 'status' nếu cần
      await queryInterface.changeColumn('Tickets', 'status', {
        type: Sequelize.ENUM('Booked', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Booked',
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Xóa cột 'showtime_id'
      await queryInterface.removeColumn('Tickets', 'showtime_id', { transaction: t });

      // Khôi phục kiểu dữ liệu của 'price' nếu cần
      await queryInterface.changeColumn('Tickets', 'price', {
        type: Sequelize.FLOAT,
        allowNull: false,
      }, { transaction: t });

      // Khôi phục kiểu ENUM của 'status' nếu cần
      await queryInterface.changeColumn('Tickets', 'status', {
        type: Sequelize.ENUM('booked', 'canceled'), // Khôi phục các giá trị cũ
        allowNull: false,
        defaultValue: 'booked',
      }, { transaction: t });
    });
  }
};