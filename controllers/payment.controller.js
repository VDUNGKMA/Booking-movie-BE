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
const db = require('../models');
const QRCode = require('../models/QRCode');
const { QRCode: QRCodeModel, Ticket, Payment } = db;
const { generateAccessToken } = require('../config/paypalClient');

/**
 * Hàm tạo đơn hàng PayPal
 */
exports.createPayment = async (req, res) => {
    const { ticketId, userId } = req.body;
    console.log("tickeid", ticketId, userId)
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
                return_url: 'movieapp://payment/success', // Deep Link tới SuccessScreen
                cancel_url: 'movieapp://payment/cancel',   // Deep Link tới FailScreen
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

/**
 * Hàm capture đơn hàng PayPal
 */
exports.executePayment = async (req, res) => {
    const { token } = req.query; // Nhận token từ query parameter

    try {
        if (!token) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Lấy access token
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
            throw new Error(`Error capturing payment: ${captureData.message || response.statusText}`);
        }

        // Kiểm tra trạng thái giao dịch
        if (captureData.status === 'COMPLETED') {
            // Lấy reference_id
            const purchaseUnit = captureData.purchase_units?.[0];
            const referenceId = purchaseUnit?.reference_id;

            if (!referenceId) {
                return res.status(400).json({ message: 'Missing reference_id in purchase_units' });
            }

            const [userPart, ticketPart] = referenceId.split('-ticket-');

            if (!userPart || !ticketPart) {
                return res.status(400).json({ message: 'Invalid reference_id format' });
            }

            const userId = parseInt(userPart.replace('user-', ''), 10);
            const ticketId = parseInt(ticketPart, 10);

            // Kiểm tra sự tồn tại của ticket
            const ticket = await Ticket.findOne({
                where: { id: ticketId }
            });

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket does not exist' });
            }

            // Cập nhật trạng thái thanh toán của vé
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
                const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

                // Lưu vào bảng QRCode
                const qrCodeEntry = await QRCodeModel.create({
                    ticket_id: ticketId,
                    code: qrCodeDataURL
                });

                return res.status(200).json({
                    message: 'Transaction successful',
                    details: captureData,
                    payment_id: payment.id,
                    userId,
                    ticketId,
                    qrCode: qrCodeEntry.code
                });
            } else {
                res.status(400).json({
                    message: 'Transaction failed',
                    details: captureData,
                });
            }
        } else {
            res.status(400).json({
                message: 'Transaction failed',
                details: captureData,
            });
        }
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({
            message: 'An error occurred during the transaction',
            error: err.message,
        });
    }
};
