const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary với các biến môi trường từ file .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình storage cho Cloudinary với multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'movies', // Lưu file vào thư mục "movies" trên Cloudinary
        resource_type: 'auto', // Cho phép tải lên nhiều loại file như video, ảnh
        allowed_formats: ['jpg', 'png', 'mp4', 'avi', 'mkv'], // Định dạng cho video và ảnh
    },
});

// Middleware upload file
const upload = multer({ storage });

module.exports = { cloudinary, upload };
