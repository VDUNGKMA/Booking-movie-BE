// migrations/xxxx-remove-seat-id-from-tickets.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tickets', 'seat_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tickets', 'seat_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Seats',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
};
