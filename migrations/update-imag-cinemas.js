'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.renameColumn('Cinemas', 'image', 'image_url'); // Đổi tên cột image thành image_url
        await queryInterface.addColumn('Cinemas', 'image_public_id', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Cinemas', 'image_url');
        await queryInterface.renameColumn('Cinemas', 'image_url', 'image'); // Đổi tên cột image_url lại thành image nếu rollback
        await queryInterface.removeColumn('Cinemas', 'image_public_id');
    }
};
