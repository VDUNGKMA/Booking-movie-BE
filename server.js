// server.js
const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser'); // Đảm bảo body-parser đã được nhập
const cors = require('cors');  // Import middleware CORS
const session = require('express-session');
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
    origin: [process.env.URL_FRONTEND,
        'http://192.168.1.119:5000',
        'http://192.168.0.101:5000',
        'http://192.168.1.12:5000',
        'http://10.0.2.2:5000',],  // Cho phép frontend từ localhost:5000 (nếu frontend React chạy trên cổng này)
    credentials: true                 // Cho phép gửi cookie, token, thông tin xác thực
}));

// Đặt body-parser để xử lý các tệp lớn hơn (cho cả JSON và URL encoded)
app.use(bodyParser.json({ limit: '1000mb' }));   // Tăng giới hạn cho các payload JSON
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true })); // Tăng giới hạn cho payload dạng form-data
// Middleware để xử lý JSON
app.use(express.json());
// Định nghĩa các route cho API
app.use('/api/auth', authRoutes); // Route cho đăng ký, đăng nhập
app.use('/api/admin', adminRoutes); // Route cho các hành động của admin
app.use('/api/staff', staffRoutes);
app.use('/api/customer', customerRoutes);
// app.get('/api/user/me', protect, getMe); // Route lấy thông tin người dùng với bảo vệ JWT
// Import và chạy cron job
// require('./cron/reservationCleanup');
const cron = require('node-cron');
const releaseExpiredReservations = require('./cron/reservationCleanup');
// Thiết lập cron job chạy mỗi phút
cron.schedule('* * * * *', () => {
    releaseExpiredReservations();
});
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
