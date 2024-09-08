// server.js
const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database'); // Kết nối Sequelize
const authRoutes = require('./routes/auth.routes'); // Import routes cho đăng nhập, đăng ký
const adminRoutes = require('./routes/admin.routes'); // Import routes cho admin
const { protect } = require('./middleware/authMiddleware'); // Middleware để bảo vệ route bằng JWT
const { getMe } = require('./controllers/user.controller'); // Hàm xử lý trong controller
// Khởi tạo ứng dụng Express
const app = express();

// Load các biến môi trường từ .env
dotenv.config();

// Middleware để xử lý JSON
app.use(express.json());

// Định nghĩa các route cho API
app.use('/api/auth', authRoutes); // Route cho đăng ký, đăng nhập
app.use('/api/admin', adminRoutes); // Route cho các hành động của admin
app.get('/api/user/me', protect, getMe); // Route lấy thông tin người dùng với bảo vệ JWT

// Khởi tạo kết nối với cơ sở dữ liệu và đồng bộ model
sequelize.sync({ alter: true }).then(() => {
    console.log('Database synchronized');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

// Cổng server lắng nghe
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
