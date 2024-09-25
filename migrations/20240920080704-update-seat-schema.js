'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.removeColumn('Seats', 'seat_number');
    // await queryInterface.removeColumn('Seats', 'seat_category_id');

    // Add new columns
    // await queryInterface.addColumn('Seats', 'theater_id', {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    //   references: {
    //     model: 'Theaters', // Assuming you have a Theaters table
    //     key: 'id'
    //   },
    //   onDelete: 'CASCADE'
    // });

    // await queryInterface.addColumn('Seats', 'row', {
    //   type: Sequelize.STRING,
    //   allowNull: false
    // });

    // await queryInterface.addColumn('Seats', 'number', {
    //   type: Sequelize.INTEGER,
    //   allowNull: false
    // });

    // await queryInterface.addColumn('Seats', 'type', {
    //   type: Sequelize.ENUM('Normal', 'VIP', 'Couple'),
    //   allowNull: false
    // });

    // await queryInterface.addColumn('Seats', 'status', {
    //   type: Sequelize.ENUM('available', 'reserved', 'booked'),
    //   allowNull: false,
    //   defaultValue: 'available'
    // });

    await queryInterface.addColumn('Seats', 'price', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse the migration by removing the new columns
    await queryInterface.removeColumn('Seats', 'theater_id');
    await queryInterface.removeColumn('Seats', 'row');
    await queryInterface.removeColumn('Seats', 'number');
    await queryInterface.removeColumn('Seats', 'type');
    await queryInterface.removeColumn('Seats', 'status');
    await queryInterface.removeColumn('Seats', 'price');

    // Add back the old columns
    await queryInterface.addColumn('Seats', 'seat_number', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn('Seats', 'seat_category_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
