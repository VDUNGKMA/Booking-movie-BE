'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Tạo bảng Roles
        await queryInterface.createTable('Roles', {
            role_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            role_name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Xóa bảng Roles nếu cần rollback
        await queryInterface.dropTable('Roles');
    }
};
