// controllers/cinema.controller.js
const db = require('../models');
const Cinema = db.Cinema;
const { cloudinary } = require('../config/cloudinary');
// Thêm rạp chiếu phim
exports.createCinema = async (req, res) => {
    try {
        const { name, location, number_of_halls } = req.body;

        // Xử lý upload ảnh nếu có
        let image_url = null;
        let image_public_id = null;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'cinemas',
                resource_type: 'image',
            });
            image_url = result.secure_url;
            image_public_id = result.public_id;
        }
        console.log("check image_url", image_url)
        console.log("check image_public", image_public_id)

        const cinema = await Cinema.create({
            name,
            location,
            number_of_halls: 0,
            image_url,
            image_public_id,
        });
        console.log("check cinema:", cinema)
        res.status(201).json({ status: 'success', data: cinema });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Sửa rạp chiếu phim
exports.updateCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findByPk(req.params.id);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }

        const { name, location, number_of_halls } = req.body;

        // Xử lý cập nhật ảnh nếu có
        let image_url = cinema.image_url;
        let image_public_id = cinema.image_public_id;

        if (req.file) {
            // Xóa ảnh cũ trên Cloudinary nếu có
            if (image_public_id) {
                await cloudinary.uploader.destroy(image_public_id);
            }

            // Upload ảnh mới lên Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'cinemas',
                resource_type: 'image',
            });
            image_url = result.secure_url;
            image_public_id = result.public_id;
        }

        await cinema.update({
            name,
            location,
            number_of_halls,
            image_url,
            image_public_id,
        });

        res.status(200).json({ status: 'success', data: cinema });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xóa rạp chiếu phim
exports.deleteCinema = async (req, res) => {
    try {
        const cinema = await Cinema.findByPk(req.params.id);
        if (!cinema) {
            return res.status(404).json({ status: 'fail', message: 'Rạp chiếu phim không tồn tại!' });
        }

        // Xóa ảnh trên Cloudinary nếu có
        if (cinema.image_public_id) {
            await cloudinary.uploader.destroy(cinema.image_public_id);
        }

        await cinema.destroy();
        res.status(204).json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Lấy danh sách rạp chiếu phim
exports.getCinemas = async (req, res) => {
    try {
        const cinemas = await Cinema.findAll();
        res.status(200).json({ status: 'success', data: cinemas });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
