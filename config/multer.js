// config/multer.js
const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu ảnh và tên file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Đảm bảo thư mục 'uploads' tồn tại trong thư mục root
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

// Tạo middleware `upload` cho multer với đường dẫn đầy đủ
const upload1 = multer({ storage: storage });

// Thêm middleware để tự động thêm URL đầy đủ vào `path` sau khi ảnh được lưu
upload1.afterUpload = (req, res, next) => {
    if (req.files && req.files['image']) {
        req.files['image'].forEach(file => {
            file.path = `${req.protocol}://${req.get('host')}/${file.path}`;
        });
    }
    next();
};

module.exports = upload1;
