// // controllers/screening.controller.js
// const Screening = require('../models/Screening');
// const Movie = require('../models/movie');
// const Theater = require('../models/Theater');
// const Cinema = require('../models/Cinema');

// // Thêm suất chiếu
// exports.createScreening = async (req, res) => {
//     try {
//         const screening = await Screening.create(req.body);
//         res.status(201).json({ status: 'success', data: screening });
//     } catch (error) {
//         res.status(400).json({ status: 'fail', message: error.message });
//     }
// };

// // Sửa suất chiếu
// exports.updateScreening = async (req, res) => {
//     try {
//         const screening = await Screening.findByPk(req.params.id);
//         if (!screening) {
//             return res.status(404).json({ status: 'fail', message: 'Suất chiếu không tồn tại!' });
//         }
//         await screening.update(req.body);
//         res.status(200).json({ status: 'success', data: screening });
//     } catch (error) {
//         res.status(400).json({ status: 'fail', message: error.message });
//     }
// };

// // Xóa suất chiếu
// exports.deleteScreening = async (req, res) => {
//     try {
//         const screening = await Screening.findByPk(req.params.id);
//         if (!screening) {
//             return res.status(404).json({ status: 'fail', message: 'Suất chiếu không tồn tại!' });
//         }
//         await screening.destroy();
//         res.status(204).json({ status: 'success' });
//     } catch (error) {
//         res.status(400).json({ status: 'fail', message: error.message });
//     }
// };
// exports.getScreenings = async (req, res) => {
//     try {
//         const screenings = await Screening.findAll();
//         res.status(200).json({
//             status: 'success',
//             data: { screenings }
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };

// // API Lấy Thông Tin Chi Tiết Suất Chiếu
// exports.getScreening = async (req, res) => {
//     try {
//         const screening = await Screening.findByPk(req.params.id, {
//             include: [
//                 { model: Movie, as: 'movie' },
//                 { model: Theater, as: 'theater' },
//                 { model: Cinema, as: 'cinema' }
//             ]
//         });

//         if (!screening) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Suất chiếu không tồn tại'
//             });
//         }

//         res.status(200).json({
//             status: 'success',
//             data: { screening }
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };

// exports.getScreeningsByMovie = async (req, res) => {
//     try {
//         const { movie_id } = req.query;  // Lọc theo movie_id
//         const screenings = await Screening.findAll({
//             where: { movie_id }
//         });
//         res.status(200).json({
//             status: 'success',
//             data: { screenings }
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// };