// seeders/seedRoles.js
const Role = require('../models/Role'); // Import model Role
const sequelize = require('../config/database'); // Kết nối cơ sở dữ liệu

// Hàm để tạo dữ liệu mẫu cho bảng roles
const seedRoles = async () => {
    try {
        // Kết nối với cơ sở dữ liệu
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Tạo các vai trò mặc định
        await Role.bulkCreate([
            { role_name: 'admin' },
            { role_name: 'staff' },
            { role_name: 'customer' }
        ]);

        console.log('Roles have been seeded successfully.');
    } catch (error) {
        console.error('Unable to seed roles:', error);
    } finally {
        // Đóng kết nối sau khi hoàn tất
        await sequelize.close();
    }
};

// Gọi hàm seedRoles
seedRoles();
