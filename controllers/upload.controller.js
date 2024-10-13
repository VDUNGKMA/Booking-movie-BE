// controllers/upload.controller.js
const path = require('path');
const Image = require('../models/Image'); // Import model Image

// Lưu đường dẫn của ảnh vào cơ sở dữ liệu
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Tạo đường dẫn đến ảnh được lưu trữ
        const imagePath = path.join('/uploads', req.file.filename);
        const image = await Image.create({
            name: req.file.originalname,
            imagePath: imagePath,
        });

        return res.json({ message: 'Image uploaded and path saved to database', image });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ message: 'Error uploading image' });
    }
};

module.exports = { uploadImage };
