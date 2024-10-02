'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra nếu bảng tồn tại trước khi cố gắng xóa để tránh lỗi
    const tableExists = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'UserTickets';`
    );

    if (tableExists[0].length > 0) {
      await queryInterface.dropTable('UserTickets');
      console.log('Bảng UserTickets đã được xóa.');
    } else {
      console.log('Bảng UserTickets không tồn tại.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Tạo lại bảng UserTickets nếu cần thiết
    await queryInterface.createTable('UserTickets', {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Tên bảng Users trong cơ sở dữ liệu
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tickets', // Tên bảng Tickets trong cơ sở dữ liệu
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    console.log('Bảng UserTickets đã được tạo lại.');
  }
};
