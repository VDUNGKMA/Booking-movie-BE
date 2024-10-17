'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true  // Cho phép null
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false  // Quay lại không cho phép null nếu rollback
    });
  }
};
