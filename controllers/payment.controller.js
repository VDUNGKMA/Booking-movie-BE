// controllers/payment.controller.js
const  Payment  = require('../models/Payment');

// Lấy danh sách hóa đơn
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.status(200).json({ status: 'success', data: payments });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
