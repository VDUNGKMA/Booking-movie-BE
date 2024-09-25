// controllers/seat.controller.js

const db = require('../models');
const Seat = db.Seat;
const Theater = db.Theater;
const Showtime = db.Showtime;
const Ticket = db.Ticket;
const { Op } = require('sequelize'); // Thêm dòng này để sử dụng toán tử Sequelize
// Định nghĩa mức giá cho mỗi loại ghế
const seatPrices = {
    'Normal': 100000, // 100,000 VND
    'VIP': 200000,    // 200,000 VND
    'Couple': 150000  // 150,000 VND
};

// Thêm ghế ngồi
exports.createSeat = async (req, res) => {
    try {
        const { theaterId } = req.params; // theaterId từ route parameter
        const { row, number, type } = req.body;

        // Kiểm tra đầy đủ thông tin
        if (!theaterId || !row || !number || !type) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin ghế (theaterId, row, number, type).' });
        }

        // Kiểm tra xem loại ghế có hợp lệ không
        if (!seatPrices.hasOwnProperty(type)) {
            return res.status(400).json({ status: 'fail', message: 'Loại ghế không hợp lệ!' });
        }

        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Kiểm tra xem ghế đã tồn tại trong cùng phòng chiếu chưa (row và number duy nhất)
        const existingSeat = await Seat.findOne({
            where: {
                theater_id: theaterId,
                row,
                number
            }
        });

        if (existingSeat) {
            return res.status(400).json({ status: 'fail', message: 'Ghế này đã tồn tại trong phòng chiếu!' });
        }
        console.log("check seat", row, number, type)
        // Thêm ghế mới vào cơ sở dữ liệu với mức giá dựa trên loại ghế
        const seat = await Seat.create({
            theater_id: theaterId,
            row,
            number,
            type,
            status: 'available', // Trạng thái mặc định
            price: seatPrices[type] // Gán mức giá dựa trên loại ghế
        });

        console.log("Giá trị ghế mới:", seat);

        res.status(201).json({ status: 'success', data: seat });
    } catch (error) {
        console.error('Error in createSeat:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi thêm ghế ngồi.' });
    }
};

// Sửa ghế ngồi
exports.updateSeat = async (req, res) => {
    try {
        const { theaterId, seatId } = req.params;
        const { row, number, type } = req.body;

        // Kiểm tra đầy đủ thông tin
        if (!theaterId || !seatId || !row || !number || !type) {
            return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp đầy đủ thông tin ghế (theaterId, seatId, row, number, type).' });
        }

        // Kiểm tra xem loại ghế có hợp lệ không
        if (!seatPrices.hasOwnProperty(type)) {
            return res.status(400).json({ status: 'fail', message: 'Loại ghế không hợp lệ!' });
        }

        // Tìm ghế cần cập nhật
        const seat = await Seat.findOne({
            where: {
                id: seatId,
                theater_id: theaterId
            }
        });

        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }

        // Kiểm tra xem ghế mới có trùng với ghế khác không
        const existingSeat = await Seat.findOne({
            where: {
                theater_id: theaterId,
                row,
                number,
                id: { [db.Sequelize.Op.ne]: seatId } // Loại bỏ ghế hiện tại khỏi kiểm tra
            }
        });

        if (existingSeat) {
            return res.status(400).json({ status: 'fail', message: 'Ghế này đã tồn tại trong phòng chiếu!' });
        }

        // Cập nhật thông tin ghế với mức giá mới
        await seat.update({
            row,
            number,
            type,
            price: seatPrices[type] // Cập nhật mức giá dựa trên loại ghế
        });

        console.log("Giá trị ghế sau khi cập nhật:", seat);

        res.status(200).json({ status: 'success', data: seat });
    } catch (error) {
        console.error('Error in updateSeat:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi sửa ghế ngồi.' });
    }
};

// Xóa ghế ngồi
exports.deleteSeat = async (req, res) => {
    try {
        const { theaterId, seatId } = req.params;

        // Kiểm tra xem ghế có tồn tại không
        const seat = await Seat.findOne({
            where: {
                id: seatId,
                theater_id: theaterId
            }
        });

        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }

        // Xóa ghế
        await seat.destroy();

        console.log(`Ghế ngồi với ID ${seatId} đã được xóa.`);

        res.status(204).json({ status: 'success' }); // No Content
    } catch (error) {
        console.error('Error in deleteSeat:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi xóa ghế ngồi.' });
    }
};

// Cập nhật trạng thái ghế ngồi
exports.updateSeatStatus = async (req, res) => {
    try {
        const { theaterId, seatId } = req.params;
        const { status } = req.body;

        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['available', 'reserved', 'booked'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ status: 'fail', message: 'Trạng thái ghế không hợp lệ!' });
        }

        // Tìm ghế cần cập nhật
        const seat = await Seat.findOne({
            where: {
                id: seatId,
                theater_id: theaterId
            }
        });

        if (!seat) {
            return res.status(404).json({ status: 'fail', message: 'Ghế ngồi không tồn tại!' });
        }

        // Cập nhật trạng thái ghế
        await seat.update({ status });

        console.log(`Trạng thái ghế ngồi với ID ${seatId} đã được cập nhật thành "${status}".`);

        res.status(200).json({ status: 'success', data: seat });
    } catch (error) {
        console.error('Error in updateSeatStatus:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi cập nhật trạng thái ghế ngồi.' });
    }
};

// // Lấy danh sách ghế theo phòng chiếu
exports.getSeatsByTheater = async (req, res) => {
    try {
        const { theaterId } = req.params;

        // Kiểm tra theaterId hợp lệ
        if (!theaterId) {
            return res.status(400).json({ status: 'fail', message: 'Tham số theaterId không hợp lệ!' });
        }

        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Lấy danh sách ghế
        const seats = await Seat.findAll({
            where: {
                theater_id: theaterId
            },
            order: [['row', 'ASC'], ['number', 'ASC']] // Sắp xếp theo hàng và số ghế
        });

        console.log(`Đã lấy ${seats.length} ghế cho phòng chiếu ID ${theaterId}.`);

        res.status(200).json({ status: 'success', data: { seats } });
    } catch (error) {
        console.error('Error in getSeatsByTheater:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế ngồi.' });
    }
};
exports.getSeatsByTheaterAdmin = async (req, res) => {
    try {
        const { theaterId } = req.params;

        // Kiểm tra theaterId hợp lệ
        if (!theaterId) {
            return res.status(400).json({ status: 'fail', message: 'Tham số theaterId không hợp lệ!' });
        }

        // Kiểm tra xem phòng chiếu có tồn tại không
        const theater = await Theater.findByPk(theaterId);
        if (!theater) {
            return res.status(404).json({ status: 'fail', message: 'Phòng chiếu không tồn tại!' });
        }

        // Lấy các tham số phân trang từ query
        let { page, limit, sortField, sortOrder, search } = req.query;

        page = parseInt(page) || 1; // Trang hiện tại, mặc định là 1
        limit = parseInt(limit) || 10; // Số ghế trên mỗi trang, mặc định là 10
        sortField = sortField || 'id'; // Trường sắp xếp, mặc định là 'id'
        sortOrder = sortOrder || 'ASC'; // Thứ tự sắp xếp, mặc định là 'ASC'
        search = search || ''; // Tìm kiếm, mặc định là rỗng

        const offset = (page - 1) * limit;

        // Tính tổng số ghế (có thể thêm điều kiện tìm kiếm)
        const totalSeats = await Seat.count({
            where: {
                theater_id: theaterId,
                [Op.or]: [
                    { row: { [Op.like]: `%${search}%` } },
                    { number: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } },
                ],
            },
        });

        // Lấy danh sách ghế với phân trang và sắp xếp
        const seats = await Seat.findAll({
            where: {
                theater_id: theaterId,
                [Op.or]: [
                    { row: { [Op.like]: `%${search}%` } },
                    { number: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } },
                ],
            },
            order: [[sortField, sortOrder]],
            limit: limit,
            offset: offset,
            attributes: ['id', 'row', 'number', 'type', 'price', 'status'],
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalSeats,
                currentPage: page,
                totalPages: Math.ceil(totalSeats / limit),
                seats,
            },
        });
    } catch (error) {
        console.error('Error in getSeatsByTheater:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế ngồi.' });
    }
};
// Lấy danh sách ghế theo suất chiếu
exports.getSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        // Kiểm tra xem suất chiếu có tồn tại không
        const showtime = await Showtime.findByPk(showtimeId);
        if (!showtime) {
            return res.status(404).json({ status: 'fail', message: 'Suất chiếu không tồn tại!' });
        }

        // Lấy danh sách ghế đã được đặt cho suất chiếu này
        const bookedSeats = await Ticket.findAll({
            where: {
                showtime_id: showtimeId,
                status: 'Booked',
            },
            attributes: ['seat_id'],
        });

        const bookedSeatIds = bookedSeats.map(ticket => ticket.seat_id);

        // Lấy danh sách tất cả ghế trong phòng chiếu của suất chiếu này
        const seats = await Seat.findAll({
            where: {
                theater_id: showtime.theater_id,
            },
            attributes: ['id', 'row', 'number', 'type', 'price'],
        });

        // Thêm thông tin về trạng thái ghế
        const seatsWithStatus = seats.map(seat => ({
            id: seat.id,
            row: seat.row,
            number: seat.number,
            type: seat.type,
            price: seat.price,
            status: bookedSeatIds.includes(seat.id) ? 'booked' : 'available',
        }));

        res.status(200).json({ status: 'success', data: { seats: seatsWithStatus } });
    } catch (error) {
        console.error('Error in getSeatsByShowtime:', error);
        res.status(500).json({ status: 'fail', message: 'Lỗi khi lấy danh sách ghế theo suất chiếu.' });
    }
};