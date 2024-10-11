

// controllers/paypalController.js
const db = require('../models');
const QRCode = require('../models/QRCode');
const { QRCode: QRCodeModel, Ticket, Payment } = db;
const { generateAccessToken } = require('../config/paypalClient');
const QRCodeGenerator = require('qrcode'); // Đảm bảo đã cài đặt 'qrcode' npm package
const Seat = db.Seat;
const Theater = db.Theater;
const Showtime = db.Showtime;
const Cinema = db.Cinema;
const Movie = db.Movie;
const User = db.User;
const fetch = require('node-fetch');

// Hàm lấy tỷ giá vnd so vs usd
async function getExchangeRate() {
    const url = `https://v6.exchangerate-api.com/v6/816cec465853e37428822374/latest/USD`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data || !data.conversion_rates) {
        throw new Error('Failed to fetch exchange rate');
    }
    // console.log('Exchange Rate API Response:', data);
    return data.conversion_rates.VND;
}

/**
 * Hàm tạo đơn hàng PayPal
 */
// exports.createPayment = async (req, res) => {
//     const { ticketId, userId } = req.body;
//     console.log("ticketId", ticketId, userId);
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
//                 return_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html', // URL của trang web trung gian
//                 cancel_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html',   // URL của trang web trung gian
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
exports.createPayment = async (req, res) => {
    const { ticketId, userId } = req.body;

    try {
        // Fetch the ticket details
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

        // Fetch the real-time exchange rate
        const exchangeRate = await getExchangeRate();

        // Calculate the ticket price in USD
        const itemTotalUSD = (parseFloat(ticket.price) / exchangeRate).toFixed(2);
        const createPaymentJson = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: `user-${userId}-ticket-${ticketId}`,
                amount: {
                    currency_code: 'USD',
                    value: itemTotalUSD,
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: itemTotalUSD,
                        }
                    }
                },
                description: `Payment for ticket: ${ticketId}`,
                items: [{
                    name: 'Movie Ticket',
                    sku: ticketId.toString(),
                    unit_amount: {
                        currency_code: 'USD',
                        value: itemTotalUSD,
                    },
                    quantity: 1
                }]
            }],
            application_context: {
                return_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html',
                cancel_url: 'https://vdungkma.github.io/movieapp-redirect/redirect.html',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'manfra.io',
                
            },
        };

        console.log('Create Payment JSON:', JSON.stringify(createPaymentJson, null, 2));

        // Fetch PayPal access token
        const accessToken = await generateAccessToken();

        // Create PayPal order
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

        // Get approval URL
        const approvalLink = orderData.links.find(link => link.rel === 'approve');
        if (!approvalLink) {
            throw new Error('No approval URL found in PayPal response');
        }

        const approvalUrl = approvalLink.href;

        // Return approval URL and order ID
        res.status(201).json({ approvalUrl, orderId: orderData.id });

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ message: 'Error creating PayPal order', error: err.message });
    }
};

exports.executePayment = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Invalid token' });
    }

    try {
        const accessToken = await generateAccessToken();

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
            throw new Error(`Error capturing payment: ${captureData.message || response.statusText}`);
        }
        if (captureData.status === 'COMPLETED') {
            const purchaseUnit = captureData.purchase_units && captureData.purchase_units[0];
            const referenceId = purchaseUnit ? purchaseUnit.reference_id : null;

            if (!referenceId) {
                throw new Error('Missing reference_id in purchase_units');
            }

            const [userPart, ticketPart] = referenceId.split('-ticket-');
            const userId = parseInt(userPart.replace('user-', ''), 10);
            const ticketId = parseInt(ticketPart, 10);
            console.log("check userId, TicketId", userId, ticketId)
            const ticket = await Ticket.findOne({
                where: { id: ticketId, user_id: userId },
                include: [
                    {
                        model: Seat,
                        as: 'seats',
                        attributes: ['id', 'row', 'number'],
                    },
                    {
                        model: Showtime,
                        as: 'showtime',
                        attributes: ['start_time', 'end_time'],
                        include: [
                            {
                                model: Theater,
                                as: 'theater',
                                attributes: ['name'],
                                include: [
                                    {
                                        model: Cinema,
                                        as: 'cinema',
                                        attributes: ['name'],
                                    },
                                ],
                            },
                            {
                                model: Movie,
                                as: 'movie',
                                attributes: ['title'],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: 'UserData',
                        attributes: ['username', 'email'],
                    },
                ],
            });
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket does not exist' });
            }

            if (ticket.payment_status !== 'pending') {
                return res.status(400).json({ message: 'Payment is not pending and cannot be processed' });
            }

            ticket.payment_status = 'completed';
            ticket.payment_method = 'PayPal';
            await ticket.save();

            const payment = await Payment.create({
                user_id: userId,
                ticket_id: ticketId,
                amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
                payment_method: 'PayPal',
                status: captureData.status,
            });

            if (payment) {
                // Chuẩn bị thông tin chi tiết để lưu vào mã QR
                const qrData = {
                    ticketId: ticketId,
                    userId: userId,
                    paymentId: payment.id,
                    user: {
                        name: ticket.UserData.username,
                        email: ticket.UserData.email,
                    },
                    bookingTime: ticket.createdAt,
                    movie: ticket.showtime.movie.title,
                    cinema: ticket.showtime.theater.cinema.name,
                    theater: ticket.showtime.theater.name,
                    seats: ticket.seats.map(seat => `${seat.row}-${seat.number}`).join(', '),
                    price: captureData.purchase_units[0].payments.captures[0].amount.value,
                    startTime: ticket.showtime.start_time,
                    endTime: ticket.showtime.end_time,
                };

                const qrCodeDataURL = await QRCodeGenerator.toDataURL(JSON.stringify(qrData));

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
        ticket.payment_status = 'failed';
        await ticket.save();


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