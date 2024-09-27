// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const Screening = sequelize.define('Screening', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true
//     },
//     screening_time: {
//         type: DataTypes.DATE,
//         allowNull: false
//     },
//     movie_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//     },
//     theater_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//     },
//     cinema_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//     },
//     available_seats: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//     }
// }, {
//     tableName: 'Screenings',
//     timestamps: true
// });

// Screening.associate = (models) => {
//     // Quan hệ n-1 giữa Screenings và Movies
//     Screening.belongsTo(models.Movie, { foreignKey: 'movie_id' });

//     // Quan hệ n-1 giữa Screenings và Theaters
//     Screening.belongsTo(models.Theater, { foreignKey: 'theater_id' });

//     // Quan hệ n-1 giữa Screenings và Cinemas
//     Screening.belongsTo(models.Cinema, { foreignKey: 'cinema_id' });

//     // Quan hệ nhiều-nhiều giữa Screenings và Users
//     Screening.belongsToMany(models.User, {
//         through: 'UserScreenings',
//         foreignKey: 'screening_id',
//     });
//     // Quan hệ 1-nhiều giữa Screenings và Tickets
//     Screening.hasMany(models.Ticket, { foreignKey: 'screening_id' });
// };

// module.exports = Screening;
