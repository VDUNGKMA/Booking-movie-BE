// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');  // Import middleware CORS
const sequelize = require('./config/database'); // Kết nối Sequelize
const authRoutes = require('./routes/auth.routes'); // Import routes cho đăng nhập, đăng ký
const adminRoutes = require('./routes/admin.routes'); // Import routes cho admin
const staffRoutes = require('./routes/staff.routes');
const customerRoutes = require('./routes/customer.routes');
const { protect } = require('./middleware/authMiddleware'); // Middleware để bảo vệ route bằng JWT
const { getMe } = require('./controllers/user.controller'); // Hàm xử lý trong controller
// Khởi tạo ứng dụng Express
const app = express();

// Load các biến môi trường từ .env
dotenv.config();
// Cấu hình CORS để cho phép truy cập từ frontend
app.use(cors({
    origin: process.env.URL_FRONTEND,  // Cho phép frontend từ localhost:3001 (nếu frontend React chạy trên cổng này)
    credentials: true                 // Cho phép gửi cookie, token, thông tin xác thực
}));

// Middleware để xử lý JSON
app.use(express.json());

// Định nghĩa các route cho API
app.use('/api/auth', authRoutes); // Route cho đăng ký, đăng nhập
app.use('/api/admin', adminRoutes); // Route cho các hành động của admin
app.use('/api/staff',staffRoutes);
app.use('/api/customer',customerRoutes);
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
