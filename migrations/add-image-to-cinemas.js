'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Thêm cột image vào bảng Cinemas
        await queryInterface.addColumn('Cinemas', 'image', {
            type: Sequelize.STRING,
            allowNull: true,  // Cho phép null nếu bạn muốn
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Xóa cột image khỏi bảng Cinemas
        await queryInterface.removeColumn('Cinemas', 'image');
    }
};
