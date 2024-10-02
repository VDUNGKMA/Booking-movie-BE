// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const UserTicket = sequelize.define('UserTicket', {
//     user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: 'Users', // Tham chiếu đến bảng Users
//             key: 'id'
//         }
//     },
//     ticket_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: 'Tickets', // Tham chiếu đến bảng Tickets
//             key: 'id'
//         }
//     },
//     createdAt: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: DataTypes.NOW
//     },
//     updatedAt: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: DataTypes.NOW
//     }
// }, {
//     tableName: 'UserTickets',
//     timestamps: true
// });

// module.exports = UserTicket;
