const  SeatCategory  = require('../models/SeatCategory');

// API Thêm SeatCategory
exports.createSeatCategory = async (req, res) => {
    try {
        const { category_name, price_multiplier } = req.body;

        const seatCategory = await SeatCategory.create({
            category_name,
            price_multiplier
        });

        res.status(201).json({
            status: 'success',
            data: { seatCategory }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};

// API Sửa SeatCategory
exports.updateSeatCategory = async (req, res) => {
    try {
        const seatCategory = await SeatCategory.findByPk(req.params.id);
        if (!seatCategory) {
            return res.status(404).json({
                status: 'fail',
                message: 'Danh mục ghế ngồi không tồn tại'
            });
        }

        const { category_name, price_multiplier } = req.body;
        seatCategory.category_name = category_name || seatCategory.category_name;
        seatCategory.price_multiplier = price_multiplier || seatCategory.price_multiplier;

        await seatCategory.save();

        res.status(200).json({
            status: 'success',
            data: { seatCategory }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};

// API Xóa SeatCategory
exports.deleteSeatCategory = async (req, res) => {
    try {
        const seatCategory = await SeatCategory.findByPk(req.params.id);
        if (!seatCategory) {
            return res.status(404).json({
                status: 'fail',
                message: 'Danh mục ghế ngồi không tồn tại'
            });
        }

        await seatCategory.destroy();
        res.status(204).json({
            status: 'success',
            message: 'Danh mục ghế ngồi đã được xóa'
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
