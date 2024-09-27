// controllers/payment.controller.js
const Ticket = require('../models/Ticket');
const Payment = require('../models/Payment');
const PaymentTickets = require('../models/PaymentTickets')
const fetch = require('node-fetch');

// Lấy danh sách hóa đơn
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.status(200).json({ status: 'success', data: payments });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};


//hàm lấy access token từ paypal
async function generateAccessToken() {
    const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorText = await response.text(); // Lấy thông điệp lỗi chi tiết
        throw new Error(`Error generating access token: ${response.statusText}, ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
}

//hàm tạo thanh toán
exports.createPayment = async (req, res) => {
    const { ticketIds, userId } = req.body;

    try {
        // Tìm vé
        const tickets = await Ticket.findAll({
            where: {
                id: ticketIds,
                user_id: userId,
                status: 'booked'
            }
        });

        if (!tickets || tickets.length === 0) {
            return res.status(404).json({ message: 'No valid tickets found' });
        }

        // Tính toán tổng tiền
        const items = tickets.map(ticket => ({
            name: 'Movie Ticket',
            sku: ticket.id.toString(),
            unit_amount: {
                currency_code: 'USD',
                value: ticket.price.toFixed(2),
            },
            quantity: 1
        }));

        const itemTotal = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.price), 0).toFixed(2);

        const createPaymentJson = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: `user-${userId}-tickets-${ticketIds.join('-')}`, // Thêm reference_id
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
                description: `Payment for tickets: ${ticketIds.join(', ')}`,
                items: items
            }],
            application_context: {
                return_url: 'http://localhost:5000/api/customer/payment/execute',
                cancel_url: 'http://localhost:5000/api/customer/payment/cancel',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'manfra.io',
            },
        };

        console.log('Create Payment JSON:', JSON.stringify(createPaymentJson, null, 2));

        const accessToken = await generateAccessToken();

        const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(createPaymentJson),
        });

        const responseData = await response.json();
        console.log('PayPal Response:', responseData);

        if (!response.ok) {
            throw new Error(`Error creating order: ${response.statusText}`);
        }

        // Lấy URL phê duyệt
        const approvalUrl = responseData.links.find(link => link.rel === 'approve').href;

        // Gửi trả về approvalUrl và orderId
        res.status(201).json({ approvalUrl});

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Error creating PayPal order');
    }
};


//xác nhận thanh toán
exports.executePayment = async (req, res) => {
    const { token } = req.query; // Nhận token mã giao dịch
    
    try {
        if (!token) {
            return res.status(400).json({ message: 'token không hợp lệ' });
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

        const responseData = await response.json();
        console.log('PayPal Capture Response:', responseData);

        if (!response.ok) {
            const errorDetails = responseData || { message: 'Unknown error' };
            throw new Error(`Error capturing payment: ${response.statusText} - ${JSON.stringify(errorDetails)}`);
        }

         // Kiểm tra trạng thái giao dịch
        if (responseData.status === 'COMPLETED') {
            // Lấy reference_id
            const purchaseUnit = responseData.purchase_units?.[0];
            const referenceId = purchaseUnit?.reference_id;

            // Phân tích reference_id để lấy userId và ticketIds
            const [userPart, ticketsPart] = referenceId.split('-tickets-');
            const userId = userPart.replace('user-', '');
            const ticketIds = ticketsPart.split('-');
        
            // Lưu thông tin thanh toán vào cơ sở dữ liệu
            const payment = await Payment.create({
                user_id: userId,
                amount: parseFloat(responseData.purchase_units[0].payments.captures[0].amount.value),
                payment_method: 'PayPal',
                status: responseData.status
            });

            // Lưu các ticket vào bảng PaymentTickets
            const paymentTickets = ticketIds.map(ticketId => ({
                payment_id: payment.id,
                ticket_id: ticketId
            }));

            await PaymentTickets.bulkCreate(paymentTickets); // Sử dụng bulkCreate để thêm nhiều bản ghi

            // Cập nhật trạng thái vé
            await Ticket.update(
                    { status: 'confirmed' },
                    { where: { id: ticketIds } } // Cập nhật tất cả vé với ID tương ứng
                );

            res.status(200).json({
                message: 'Giao dịch thành công',
                details: responseData,
                payment_id: payment.id, // Trả về ID của hóa đơn đã lưu
                userId, // Trả về userId
                ticketIds // Trả về danh sách ticketIds
            });
        } else {
            res.status(400).json({
                message: 'Giao dịch không thành công',
                details: responseData,
            });
        }
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({
            message: 'Đã xảy ra lỗi trong quá trình thực hiện giao dịch',
            error: err.message,
        });
    }
};

//hủy thanh toán
exports.cancelPayment = async (req, res) => {
    // Logic xử lý khi người dùng hủy thanh toán
    res.status(200).json({ message: 'Order has been canceled.' });
};