// config/database.js
const { Sequelize } = require('sequelize');
const config = require('./config.json'); // Import file config.json
const env = process.env.NODE_ENV || 'development'; // Môi trường hiện tại (development, test, production)
const dbConfig = config[env]; // Lấy cấu hình tương ứng

// Kết nối với cơ sở dữ liệu
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    timezone: '+07:00',
    dialectOptions: {
        useUTC: false,
        dateStrings: true
    }
});

module.exports = sequelize;
