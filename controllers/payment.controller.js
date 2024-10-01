// // controllers/payment.controller.js
// const  Payment  = require('../models/Payment');

// // Lấy danh sách hóa đơn
// exports.getPayments = async (req, res) => {
//     try {
//         const payments = await Payment.findAll();
//         res.status(200).json({ status: 'success', data: payments });
//     } catch (error) {
//         res.status(400).json({ status: 'fail', message: error.message });
//     }
// };

// controllers/paypalController.js
// const db = require('../models');
// const QRCode = require('../models/QRCode');
// const { QRCode: QRCodeModel, Ticket, Payment } = db;
// const { generateAccessToken } = require('../config/paypalClient');

// /**
//  * Hàm tạo đơn hàng PayPal
//  */
// exports.createPayment = async (req, res) => {
//     const { ticketId, userId } = req.body;
//     console.log("tickeid", ticketId, userId)
//     try {
//         // Tìm vé
//         const ticket = await Ticket.findOne({
//             where: {
//                 id: ticketId,
//                 user_id: userId,
//                 status: 'confirmed'
//             }
//         });

//         if (!ticket) {
//             return res.status(404).json({ message: 'No valid ticket found' });
//         }

//         // Tính toán tổng tiền (ở đây chỉ có một vé)
//         const itemTotal = parseFloat(ticket.price).toFixed(2);

//         const createPaymentJson = {
//             intent: 'CAPTURE',
//             purchase_units: [{
//                 reference_id: `user-${userId}-ticket-${ticketId}`, // Thêm reference_id
//                 amount: {
//                     currency_code: 'USD',
//                     value: itemTotal,
//                     breakdown: {
//                         item_total: {
//                             currency_code: 'USD',
//                             value: itemTotal,
//                         }
//                     }
//                 },
//                 description: `Payment for ticket: ${ticketId}`,
//                 items: [{
//                     name: 'Movie Ticket',
//                     sku: ticket.id.toString(),
//                     unit_amount: {
//                         currency_code: 'USD',
//                         value: itemTotal,
//                     },
//                     quantity: 1
//                 }]
//             }],
//             application_context: {
//                 return_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html', // Deep Link tới SuccessScreen
//                 cancel_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html',   // Deep Link tới FailScreen
//                 shipping_preference: 'NO_SHIPPING',
//                 user_action: 'PAY_NOW',
//                 brand_name: 'manfra.io',
//             },
//         };

//         console.log('Create Payment JSON:', JSON.stringify(createPaymentJson, null, 2));

//         // Lấy access token
//         const accessToken = await generateAccessToken();

//         // Tạo đơn hàng PayPal
//         const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//             body: JSON.stringify(createPaymentJson),
//         });

//         const orderData = await response.json();
//         console.log('PayPal Order Response:', orderData);

//         if (!response.ok) {
//             throw new Error(`Error creating order: ${orderData.message || response.statusText}`);
//         }

//         // Lấy URL phê duyệt
//         const approvalLink = orderData.links.find(link => link.rel === 'approve');
//         if (!approvalLink) {
//             throw new Error('No approval URL found in PayPal response');
//         }

//         const approvalUrl = approvalLink.href;

//         // Gửi trả về approvalUrl và orderId
//         res.status(201).json({ approvalUrl, orderId: orderData.id });

//     } catch (err) {
//         console.error('Error:', err.message);
//         res.status(500).json({ message: 'Error creating PayPal order', error: err.message });
//     }
// };

// /**
//  * Hàm capture đơn hàng PayPal
//  */
// exports.executePayment = async (req, res) => {
//     const { token } = req.query; // Nhận token từ query parameter

//     try {
//         if (!token) {
//             return res.status(400).json({ message: 'Invalid token' });
//         }

//         // Lấy access token
//         const accessToken = await generateAccessToken();

//         // Gửi yêu cầu xác nhận giao dịch đến PayPal
//         const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//         });

//         const captureData = await response.json();
//         console.log('PayPal Capture Response:', captureData);

//         if (!response.ok) {
//             const errorDetails = captureData || { message: 'Unknown error' };
//             throw new Error(`Error capturing payment: ${captureData.message || response.statusText}`);
//         }

//         // Kiểm tra trạng thái giao dịch
//         if (captureData.status === 'COMPLETED') {
//             // Lấy reference_id
//             const purchaseUnit = captureData.purchase_units?.[0];
//             const referenceId = purchaseUnit?.reference_id;

//             if (!referenceId) {
//                 return res.status(400).json({ message: 'Missing reference_id in purchase_units' });
//             }

//             const [userPart, ticketPart] = referenceId.split('-ticket-');

//             if (!userPart || !ticketPart) {
//                 return res.status(400).json({ message: 'Invalid reference_id format' });
//             }

//             const userId = parseInt(userPart.replace('user-', ''), 10);
//             const ticketId = parseInt(ticketPart, 10);

//             // Kiểm tra sự tồn tại của ticket
//             const ticket = await Ticket.findOne({
//                 where: { id: ticketId }
//             });

//             if (!ticket) {
//                 return res.status(404).json({ message: 'Ticket does not exist' });
//             }

//             // Cập nhật trạng thái thanh toán của vé
//             ticket.payment_status = 'completed';
//             ticket.payment_method = 'PayPal';
//             await ticket.save();

//             // Lưu thông tin thanh toán vào cơ sở dữ liệu
//             const payment = await Payment.create({
//                 user_id: userId,
//                 ticket_id: ticketId,
//                 amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
//                 payment_method: 'PayPal',
//                 status: captureData.status,
//             });

//             if (payment) {
//                 const qrData = {
//                     ticketId: ticketId,
//                     userId: userId,
//                     paymentId: payment.id,
//                     // Các thông tin khác nếu cần
//                 };

//                 // Tạo QR code dưới dạng Data URL
//                 const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

//                 // Lưu vào bảng QRCode
//                 const qrCodeEntry = await QRCodeModel.create({
//                     ticket_id: ticketId,
//                     code: qrCodeDataURL
//                 });

//                 return res.status(200).json({
//                     message: 'Transaction successful',
//                     details: captureData,
//                     payment_id: payment.id,
//                     userId,
//                     ticketId,
//                     qrCode: qrCodeEntry.code
//                 });
//             } else {
//                 res.status(400).json({
//                     message: 'Transaction failed',
//                     details: captureData,
//                 });
//             }
//         } else {
//             res.status(400).json({
//                 message: 'Transaction failed',
//                 details: captureData,
//             });
//         }
//     } catch (err) {
//         console.error('Error:', err.message);
//         res.status(500).json({
//             message: 'An error occurred during the transaction',
//             error: err.message,
//         });
//     }
// };

// controllers/paypalController.js
const db = require('../models');
const QRCode = require('../models/QRCode');
const { QRCode: QRCodeModel, Ticket, Payment } = db;
const { generateAccessToken } = require('../config/paypalClient');
const QRCodeGenerator = require('qrcode'); // Đảm bảo đã cài đặt 'qrcode' npm package
const Seat = db.Seat;
/**
 * Hàm tạo đơn hàng PayPal
 */
exports.createPayment = async (req, res) => {
    const { ticketId, userId } = req.body;
    console.log("ticketId", ticketId, userId);
    try {
        // Tìm vé
        const ticket = await Ticket.findOne({
            where: {
                id: ticketId,
                user_id: userId,
                status: 'confirmed'
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'No valid ticket found' });
        }

        // Tính toán tổng tiền (ở đây chỉ có một vé)
        const itemTotal = parseFloat(ticket.price).toFixed(2);

        const createPaymentJson = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: `user-${userId}-ticket-${ticketId}`, // Thêm reference_id
                amount: {
                    currency_code: 'USD',
                    value: itemTotal,
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: itemTotal,
                        }
                    }
                },
                description: `Payment for ticket: ${ticketId}`,
                items: [{
                    name: 'Movie Ticket',
                    sku: ticket.id.toString(),
                    unit_amount: {
                        currency_code: 'USD',
                        value: itemTotal,
                    },
                    quantity: 1
                }]
            }],
            application_context: {
                return_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html', // URL của trang web trung gian
                cancel_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html',   // URL của trang web trung gian
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'manfra.io',
            },
        };

        console.log('Create Payment JSON:', JSON.stringify(createPaymentJson, null, 2));

        // Lấy access token
        const accessToken = await generateAccessToken();

        // Tạo đơn hàng PayPal
        const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(createPaymentJson),
        });

        const orderData = await response.json();
        console.log('PayPal Order Response:', orderData);

        if (!response.ok) {
            throw new Error(`Error creating order: ${orderData.message || response.statusText}`);
        }

        // Lấy URL phê duyệt
        const approvalLink = orderData.links.find(link => link.rel === 'approve');
        if (!approvalLink) {
            throw new Error('No approval URL found in PayPal response');
        }

        const approvalUrl = approvalLink.href;

        // Gửi trả về approvalUrl và orderId
        res.status(201).json({ approvalUrl, orderId: orderData.id });

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ message: 'Error creating PayPal order', error: err.message });
    }
};

// controllers/paypalController.js

// exports.executePayment = async (req, res) => {
//     const { token } = req.query; // Nhận token từ query parameter

//     try {
//         if (!token) {
//             return res.status(400).json({ message: 'Invalid token' });
//         }

//         // Lấy access token
//         const accessToken = await generateAccessToken();

//         // Gửi yêu cầu xác nhận giao dịch đến PayPal
//         const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//         });

//         const captureData = await response.json();
//         console.log('PayPal Capture Response:', captureData);

//         if (!response.ok) {
//             const errorDetails = captureData || { message: 'Unknown error' };
//             throw new Error(`Error capturing payment: ${captureData.message || response.statusText}`);
//         }

//         // Kiểm tra trạng thái giao dịch
//         if (captureData.status === 'COMPLETED') {
//             // Lấy reference_id
//             const purchaseUnit = captureData.purchase_units?.[0];
//             const referenceId = purchaseUnit?.reference_id;

//             if (!referenceId) {
//                 return res.status(400).json({ message: 'Missing reference_id in purchase_units' });
//             }

//             const [userPart, ticketPart] = referenceId.split('-ticket-');

//             if (!userPart || !ticketPart) {
//                 return res.status(400).json({ message: 'Invalid reference_id format' });
//             }

//             const userId = parseInt(userPart.replace('user-', ''), 10);
//             const ticketId = parseInt(ticketPart, 10);

//             // Kiểm tra sự tồn tại của ticket
//             const ticket = await Ticket.findOne({
//                 where: { id: ticketId }
//             });

//             if (!ticket) {
//                 return res.status(404).json({ message: 'Ticket does not exist' });
//             }

//             // Cập nhật trạng thái thanh toán của vé
//             ticket.payment_status = 'completed';
//             ticket.payment_method = 'PayPal';
//             await ticket.save();

//             // Lưu thông tin thanh toán vào cơ sở dữ liệu
//             const payment = await Payment.create({
//                 user_id: userId,
//                 ticket_id: ticketId,
//                 amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
//                 payment_method: 'PayPal',
//                 status: captureData.status,
//             });

//             if (payment) {
//                 const qrData = {
//                     ticketId: ticketId,
//                     userId: userId,
//                     paymentId: payment.id,
//                     // Các thông tin khác nếu cần
//                 };

//                 // Tạo QR code dưới dạng Data URL
//                 const qrCodeDataURL = await QRCodeGenerator.toDataURL(JSON.stringify(qrData));

//                 // Lưu vào bảng QRCode
//                 const qrCodeEntry = await QRCodeModel.create({
//                     ticket_id: ticketId,
//                     code: qrCodeDataURL
//                 });

//                 return res.status(200).json({
//                     message: 'Transaction successful',
//                     details: captureData,
//                     payment_id: payment.id,
//                     userId,
//                     ticketId,
//                     qrCode: qrCodeEntry.code
//                 });
//             } else {
//                 res.status(400).json({
//                     message: 'Transaction failed',
//                     details: captureData,
//                 });
//             }
//         } else {
//             res.status(400).json({
//                 message: 'Transaction failed',
//                 details: captureData,
//             });
//         }
//     } catch (err) {
//         console.error('Error:', err.message);
//         res.status(500).json({
//             message: 'An error occurred during the transaction',
//             error: err.message,
//         });
//     }
// };
// controllers/paypalController.js

// exports.executePayment = async (req, res) => {
//     const { token } = req.query;

//     try {
//         if (!token) {
//             return res.status(400).json({ message: 'Invalid token' });
//         }

//         const accessToken = await generateAccessToken();

//         const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//         });

//         const captureData = await response.json();
//         console.log('PayPal Capture Response:', captureData);

//         if (!response.ok) {
//             const errorDetails = captureData || { message: 'Unknown error' };
//             throw new Error(`Error capturing payment: ${errorDetails.message || response.statusText}`);
//         }

//         if (captureData.status === 'COMPLETED') {
//             const purchaseUnit = captureData.purchase_units?.[0];
//             const referenceId = purchaseUnit?.reference_id;

//             if (!referenceId) {
//                 return res.status(400).json({ message: 'Missing reference_id in purchase_units' });
//             }

//             const [userPart, ticketPart] = referenceId.split('-ticket-');

//             if (!userPart || !ticketPart) {
//                 return res.status(400).json({ message: 'Invalid reference_id format' });
//             }

//             const userId = parseInt(userPart.replace('user-', ''), 10);
//             const ticketId = parseInt(ticketPart, 10);

//             // Kiểm tra sự tồn tại của ticket
//             const ticket = await Ticket.findOne({
//                 where: { id: ticketId },
//                 include: [{ model: Seat }],
//             });

//             if (!ticket) {
//                 return res.status(404).json({ message: 'Ticket does not exist' });
//             }

//             // Cập nhật trạng thái thanh toán của vé
//             ticket.payment_status = 'completed';
//             ticket.payment_method = 'PayPal';
//             await ticket.save();

//             // Cập nhật trạng thái ghế từ 'reserved' thành 'booked'
//             const seats = await ticket.getSeats();
//             const seatIds = seats.map(seat => seat.id);

//             await Seat.update(
//                 { status: 'booked' },
//                 {
//                     where: {
//                         id: seatIds,
//                     },
//                 }
//             );

//             // Lưu thông tin thanh toán vào cơ sở dữ liệu
//             const payment = await Payment.create({
//                 user_id: userId,
//                 ticket_id: ticketId,
//                 amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
//                 payment_method: 'PayPal',
//                 status: captureData.status,
//             });

//             if (payment) {
//                 const qrData = {
//                     ticketId: ticketId,
//                     userId: userId,
//                     paymentId: payment.id,
//                     // Các thông tin khác nếu cần
//                 };

//                 // Tạo QR code dưới dạng Data URL
//                 const qrCodeDataURL = await QRCodeGenerator.toDataURL(JSON.stringify(qrData));

//                 // Lưu vào bảng QRCode
//                 const qrCodeEntry = await QRCodeModel.create({
//                     ticket_id: ticketId,
//                     code: qrCodeDataURL,
//                 });

//                 return res.status(200).json({
//                     message: 'Transaction successful',
//                     details: captureData,
//                     payment_id: payment.id,
//                     userId,
//                     ticketId,
//                     qrCode: qrCodeEntry.code,
//                 });
//             } else {
//                 res.status(400).json({
//                     message: 'Transaction failed',
//                     details: captureData,
//                 });
//             }
//         } else {
//             // Thanh toán thất bại, giải phóng ghế
//             await handleFailedPayment(ticketId);
//             res.status(400).json({
//                 message: 'Transaction failed',
//                 details: captureData,
//             });
//         }
//     } catch (err) {
//         console.error('Error:', err.message);
//         res.status(500).json({
//             message: 'An error occurred during the transaction',
//             error: err.message,
//         });
//     }
// };

// // Hàm xử lý giải phóng ghế khi thanh toán thất bại
// async function handleFailedPayment(ticketId) {
//     // Tìm vé và các ghế liên quan
//     const ticket = await Ticket.findOne({
//         where: { id: ticketId },
//         include: [{ model: Seat }],
//     });

//     if (ticket) {
//         const seats = await ticket.getSeats();
//         const seatIds = seats.map(seat => seat.id);

//         // Cập nhật trạng thái ghế thành 'available'
//         await Seat.update(
//             { status: 'available' },
//             {
//                 where: {
//                     id: seatIds,
//                 },
//             }
//         );

//         // Xóa vé
//         await ticket.destroy();

//         console.log(`Released reservation for ticket ID: ${ticket.id}`);
//     }
// }

// controllers/paypalController.js


// const QRCodeGenerator = require('qrcode'); // Đảm bảo đã cài đặt 'qrcode' npm package
const fetch = require('node-fetch'); // Đảm bảo đã cài đặt 'node-fetch'

/**
 * Hàm thực thi thanh toán PayPal sau khi người dùng hoàn thành thanh toán
 */
// exports.executePayment = async (req, res) => {
//     const { token } = req.query; // Nhận token từ query parameter

//     if (!token) {
//         return res.status(400).json({ message: 'Invalid token' });
//     }

//     try {
//         // Lấy access token từ PayPal
//         const accessToken = await generateAccessToken();

//         // Gửi yêu cầu xác nhận giao dịch đến PayPal
//         const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//         });

//         const captureData = await response.json();
//         console.log('PayPal Capture Response:', captureData);

//         if (!response.ok) {
//             const errorDetails = captureData || { message: 'Unknown error' };
//             throw new Error(`Error capturing payment: ${errorDetails.message || response.statusText}`);
//         }

//         // Kiểm tra trạng thái giao dịch
//         if (captureData.status === 'COMPLETED') {
//             // Lấy reference_id từ purchase_units
//             const purchaseUnit = captureData.purchase_units && captureData.purchase_units[0];
//             const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

//             if (!referenceId) {
//                 throw new Error('Missing reference_id in purchase_units');
//             }

//             // Trích xuất userId và ticketId từ reference_id
//             const [userPart, ticketPart] = referenceId.split('-ticket-');

//             if (!userPart || !ticketPart) {
//                 throw new Error('Invalid reference_id format');
//             }

//             const userId = parseInt(userPart.replace('user-', ''), 10);
//             const ticketId = parseInt(ticketPart, 10);

//             // Tìm vé trong cơ sở dữ liệu với alias 'seats'
//             const ticket = await Ticket.findOne({
//                 where: { id: ticketId, user_id: userId },
//                 include: [{
//                     model: Seat,
//                     as: 'seats', // Sử dụng alias đã định nghĩa trong model
//                 }],
//             });

//             if (!ticket) {
//                 return res.status(404).json({ message: 'Ticket does not exist' });
//             }

//             // Kiểm tra trạng thái thanh toán hiện tại
//             if (ticket.payment_status !== 'pending') {
//                 return res.status(400).json({ message: 'Payment is not pending and cannot be processed' });
//             }

//             // Cập nhật trạng thái thanh toán của vé thành 'completed'
//             ticket.payment_status = 'completed';
//             ticket.payment_method = 'PayPal';
//             await ticket.save();

//             // Cập nhật trạng thái ghế từ 'reserved' thành 'booked'
//             const seats = ticket.seats; // Sử dụng alias 'seats'
//             const seatIds = seats.map(seat => seat.id);

//             await Seat.update(
//                 { status: 'booked' },
//                 {
//                     where: { id: seatIds },
//                 }
//             );

//             // Lưu thông tin thanh toán vào cơ sở dữ liệu
//             const payment = await Payment.create({
//                 user_id: userId,
//                 ticket_id: ticketId,
//                 amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
//                 payment_method: 'PayPal',
//                 status: captureData.status,
//             });

//             if (payment) {
//                 const qrData = {
//                     ticketId: ticketId,
//                     userId: userId,
//                     paymentId: payment.id,
//                     // Các thông tin khác nếu cần
//                 };

//                 // Tạo QR code dưới dạng Data URL
//                 const qrCodeDataURL = await QRCodeGenerator.toDataURL(JSON.stringify(qrData));

//                 // Lưu vào bảng QRCode
//                 const qrCodeEntry = await QRCodeModel.create({
//                     ticket_id: ticketId,
//                     code: qrCodeDataURL,
//                 });

//                 return res.status(200).json({
//                     message: 'Transaction successful',
//                     details: captureData,
//                     payment_id: payment.id,
//                     userId,
//                     ticketId,
//                     qrCode: qrCodeEntry.code,
//                 });
//             } else {
//                 res.status(400).json({
//                     message: 'Transaction failed',
//                     details: captureData,
//                 });
//             }
//         } else {
//             // Thanh toán thất bại, giải phóng ghế
//             await handleFailedPayment(token);
//             res.status(400).json({
//                 message: 'Transaction failed',
//                 details: captureData,
//             });
//         }
//     } catch (err) {
//         console.error('Error in executePayment:', err.message);
//         res.status(500).json({
//             message: 'An error occurred during the transaction',
//             error: err.message,
//         });
//     }
// };

/**
 * Hàm xử lý khi thanh toán thất bại hoặc bị hủy
 */
// async function handleFailedPayment(token) {
//     try {
//         // Lấy access token từ PayPal
//         const accessToken = await generateAccessToken();

//         // Lấy thông tin đơn hàng từ PayPal để trích xuất reference_id
//         const orderResponse = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//         });

//         const orderData = await orderResponse.json();

//         if (!orderResponse.ok) {
//             throw new Error(`Error fetching order details: ${orderData.message || orderResponse.statusText}`);
//         }

//         // Lấy reference_id từ purchase_units
//         const purchaseUnit = orderData.purchase_units && orderData.purchase_units[0];
//         const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

//         if (!referenceId) {
//             throw new Error('Missing reference_id in purchase_units');
//         }

//         // Trích xuất userId và ticketId từ reference_id
//         const [userPart, ticketPart] = referenceId.split('-ticket-');

//         if (!userPart || !ticketPart) {
//             throw new Error('Invalid reference_id format');
//         }

//         const userId = parseInt(userPart.replace('user-', ''), 10);
//         const ticketId = parseInt(ticketPart, 10);

//         // Tìm vé trong cơ sở dữ liệu với alias 'seats'
//         const ticket = await Ticket.findOne({
//             where: { id: ticketId, user_id: userId },
//             include: [{
//                 model: Seat,
//                 as: 'seats', // Sử dụng alias đã định nghĩa trong model
//             }],
//         });

//         if (!ticket) {
//             console.log('Ticket not found during failed payment handling');
//             return;
//         }

//         // Kiểm tra trạng thái thanh toán hiện tại
//         if (ticket.payment_status !== 'pending') {
//             console.log('Payment is not pending during failed payment handling');
//             return;
//         }

//         // Cập nhật trạng thái thanh toán của vé thành 'cancelled'
//         ticket.payment_status = 'cancelled';
//         await ticket.save();

//         // Cập nhật trạng thái ghế từ 'reserved' thành 'available'
//         const seats = ticket.seats; // Sử dụng alias 'seats'
//         const seatIds = seats.map(seat => seat.id);

//         await Seat.update(
//             { status: 'available' },
//             {
//                 where: { id: seatIds },
//             }
//         );

//         console.log(`Cancelled payment for ticket ID: ${ticketId} and released seats: ${seatIds}`);
//     } catch (error) {
//         console.error('Error in handleFailedPayment:', error.message);
//     }
// }
 
// exports.cancelPayment = async (req, res) => {
//     const { token } = req.query; // Nhận token từ query parameter

//     if (!token) {
//         return res.status(400).json({ message: 'Invalid token' });
//     }

//     try {
//         // Lấy access token từ PayPal
//         const accessToken = await generateAccessToken();

//         // Lấy thông tin đơn hàng từ PayPal
//         const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//         });

//         const orderData = await response.json();
//         console.log('PayPal Order Details:', orderData);

//         if (!response.ok) {
//             throw new Error(`Error fetching order details: ${orderData.message || response.statusText}`);
//         }

//         // Lấy reference_id từ purchase_units
//         const purchaseUnit = orderData.purchase_units && orderData.purchase_units[0];
//         const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

//         if (!referenceId) {
//             throw new Error('Missing reference_id in purchase_units');
//         }

//         // Trích xuất userId và ticketId từ reference_id
//         const [userPart, ticketPart] = referenceId.split('-ticket-');

//         if (!userPart || !ticketPart) {
//             throw new Error('Invalid reference_id format');
//         }

//         const userId = parseInt(userPart.replace('user-', ''), 10);
//         const ticketId = parseInt(ticketPart, 10);

//         // Tìm vé trong cơ sở dữ liệu
//         const ticket = await Ticket.findOne({
//             where: { id: ticketId, user_id: userId },
//             include: [{ model: Seat }],
//         });

//         if (!ticket) {
//             return res.status(404).json({ message: 'Ticket does not exist' });
//         }

//         // Kiểm tra trạng thái thanh toán hiện tại
//         if (ticket.payment_status !== 'pending') {
//             return res.status(400).json({ message: 'Payment is not pending and cannot be cancelled' });
//         }

//         // Cập nhật trạng thái thanh toán của vé thành 'cancelled'
//         ticket.payment_status = 'cancelled';
//         await ticket.save();

//         // Cập nhật trạng thái ghế từ 'reserved' thành 'available'
//         const seats = await ticket.getSeats();
//         const seatIds = seats.map(seat => seat.id);

//         await Seat.update(
//             { status: 'available' },
//             {
//                 where: { id: seatIds },
//             }
//         );

//         // Optional: Xóa vé hoặc lưu lịch sử hủy
//         // await ticket.destroy();

//         res.status(200).json({
//             message: 'Payment cancelled and seats released successfully.',
//             ticketId: ticketId,
//             seatIds: seatIds,
//         });
//     } catch (err) {
//         console.error('Error in cancelPayment:', err.message);
//         res.status(500).json({
//             message: 'An error occurred while cancelling the payment.',
//             error: err.message,
//         });
//     }
// };

exports.executePayment = async (req, res) => {
    const { token } = req.query; // Nhận token từ query parameter

    if (!token) {
        return res.status(400).json({ message: 'Invalid token' });
    }

    try {
        // Lấy access token từ PayPal
        const accessToken = await generateAccessToken();

        // Gửi yêu cầu xác nhận giao dịch đến PayPal
        const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const captureData = await response.json();
        console.log('PayPal Capture Response:', captureData);

        if (!response.ok) {
            const errorDetails = captureData || { message: 'Unknown error' };
            throw new Error(`Error capturing payment: ${errorDetails.message || response.statusText}`);
        }

        // Kiểm tra trạng thái giao dịch
        if (captureData.status === 'COMPLETED') {
            // Lấy reference_id từ purchase_units
            const purchaseUnit = captureData.purchase_units && captureData.purchase_units[0];
            const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

            if (!referenceId) {
                throw new Error('Missing reference_id in purchase_units');
            }

            // Trích xuất userId và ticketId từ reference_id
            const [userPart, ticketPart] = referenceId.split('-ticket-');

            if (!userPart || !ticketPart) {
                throw new Error('Invalid reference_id format');
            }

            const userId = parseInt(userPart.replace('user-', ''), 10);
            const ticketId = parseInt(ticketPart, 10);

            // Tìm vé trong cơ sở dữ liệu với alias 'seats'
            const ticket = await Ticket.findOne({
                where: { id: ticketId, user_id: userId },
                include: [{
                    model: Seat,
                    as: 'seats', // Sử dụng alias đã định nghĩa trong model
                }],
            });

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket does not exist' });
            }

            // Kiểm tra trạng thái thanh toán hiện tại
            if (ticket.payment_status !== 'pending') {
                return res.status(400).json({ message: 'Payment is not pending and cannot be processed' });
            }

            // Cập nhật trạng thái thanh toán của vé thành 'completed'
            ticket.payment_status = 'completed';
            ticket.payment_method = 'PayPal';
            await ticket.save();

            // Lưu thông tin thanh toán vào cơ sở dữ liệu
            const payment = await Payment.create({
                user_id: userId,
                ticket_id: ticketId,
                amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
                payment_method: 'PayPal',
                status: captureData.status,
            });

            if (payment) {
                const qrData = {
                    ticketId: ticketId,
                    userId: userId,
                    paymentId: payment.id,
                    // Các thông tin khác nếu cần
                };

                // Tạo QR code dưới dạng Data URL
                const qrCodeDataURL = await QRCodeGenerator.toDataURL(JSON.stringify(qrData));

                // Lưu vào bảng QRCode
                const qrCodeEntry = await QRCodeModel.create({
                    ticket_id: ticketId,
                    code: qrCodeDataURL,
                });

                return res.status(200).json({
                    message: 'Transaction successful',
                    details: captureData,
                    payment_id: payment.id,
                    userId,
                    ticketId,
                    qrCode: qrCodeEntry.code,
                });
            } else {
                res.status(400).json({
                    message: 'Transaction failed',
                    details: captureData,
                });
            }
        } else {
            // Thanh toán thất bại, giải phóng ghế
            await handleFailedPayment(token);
            res.status(400).json({
                message: 'Transaction failed',
                details: captureData,
            });
        }
    } catch (err) {
        console.error('Error in executePayment:', err.message);
        res.status(500).json({
            message: 'An error occurred during the transaction',
            error: err.message,
        });
    }
};

/**
 * Hàm xử lý khi thanh toán thất bại hoặc bị hủy
 */
async function handleFailedPayment(token) {
    try {
        // Lấy access token từ PayPal
        const accessToken = await generateAccessToken();

        // Lấy thông tin đơn hàng từ PayPal để trích xuất reference_id
        const orderResponse = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(`Error fetching order details: ${orderData.message || orderResponse.statusText}`);
        }

        // Lấy reference_id từ purchase_units
        const purchaseUnit = orderData.purchase_units && orderData.purchase_units[0];
        const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

        if (!referenceId) {
            throw new Error('Missing reference_id in purchase_units');
        }

        // Trích xuất userId và ticketId từ reference_id
        const [userPart, ticketPart] = referenceId.split('-ticket-');

        if (!userPart || !ticketPart) {
            throw new Error('Invalid reference_id format');
        }

        const userId = parseInt(userPart.replace('user-', ''), 10);
        const ticketId = parseInt(ticketPart, 10);

        // Tìm vé trong cơ sở dữ liệu với alias 'seats'
        const ticket = await Ticket.findOne({
            where: { id: ticketId, user_id: userId },
            include: [{
                model: Seat,
                as: 'seats', // Sử dụng alias đã định nghĩa trong model
            }],
        });

        if (!ticket) {
            console.log('Ticket not found during failed payment handling');
            return;
        }

        // Kiểm tra trạng thái thanh toán hiện tại
        if (ticket.payment_status !== 'pending') {
            console.log('Payment is not pending during failed payment handling');
            return;
        }

        // Cập nhật trạng thái thanh toán của vé thành 'cancelled'
        ticket.payment_status = 'cancelled';
        await ticket.save();

        // Không cần cập nhật trạng thái ghế vì trạng thái ghế được quản lý qua sự tồn tại của vé
        // Nếu muốn, bạn có thể thực hiện một số hành động bổ sung ở đây

        console.log(`Cancelled payment for ticket ID: ${ticketId}`);
    } catch (error) {
        console.error('Error in handleFailedPayment:', error.message);
    }
}

exports.cancelPayment = async (req, res) => {
    const { token } = req.query; // Nhận token từ query parameter

    if (!token) {
        return res.status(400).json({ message: 'Invalid token' });
    }

    try {
        // Lấy access token từ PayPal
        const accessToken = await generateAccessToken();

        // Lấy thông tin đơn hàng từ PayPal
        const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const orderData = await response.json();
        console.log('PayPal Order Details:', orderData);

        if (!response.ok) {
            throw new Error(`Error fetching order details: ${orderData.message || response.statusText}`);
        }

        // Lấy reference_id từ purchase_units
        const purchaseUnit = orderData.purchase_units && orderData.purchase_units[0];
        const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

        if (!referenceId) {
            throw new Error('Missing reference_id in purchase_units');
        }

        // Trích xuất userId và ticketId từ reference_id
        const [userPart, ticketPart] = referenceId.split('-ticket-');

        if (!userPart || !ticketPart) {
            throw new Error('Invalid reference_id format');
        }

        const userId = parseInt(userPart.replace('user-', ''), 10);
        const ticketId = parseInt(ticketPart, 10);

        // Tìm vé trong cơ sở dữ liệu với alias 'seats'
        const ticket = await Ticket.findOne({
            where: { id: ticketId, user_id: userId },
            include: [{
                model: Seat,
                as: 'seats', // Sử dụng alias đã định nghĩa trong model
            }],
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket does not exist' });
        }

        // Kiểm tra trạng thái thanh toán hiện tại
        if (ticket.payment_status !== 'pending') {
            return res.status(400).json({ message: 'Payment is not pending and cannot be cancelled' });
        }

        // Cập nhật trạng thái thanh toán của vé thành 'cancelled'
        ticket.payment_status = 'cancelled';
        await ticket.save();

        // Không cần cập nhật trạng thái ghế vì trạng thái ghế được quản lý qua sự tồn tại của vé

        res.status(200).json({
            message: 'Payment cancelled successfully.',
            ticketId: ticketId,
        });
    } catch (err) {
        console.error('Error in cancelPayment:', err.message);
        res.status(500).json({
            message: 'An error occurred while cancelling the payment.',
            error: err.message,
        });
    }
};