// controllers/payment.controller.js
const Ticket = require('../models/Ticket');
const Payment = require('../models/Payment');
const Showtime = require('../models/Showtime')
const Cinema = require('../models/Cinema');
const Movie = require('../models/movie');
const Theater = require('../models/Theater');
const QR = require('qrcode');
const QRCode = require('../models/QRCode');
const Seat = require('../models/Seat');
const TicketSeats = require('../models/TicketSeats');
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
    const { ticketId, userId } = req.body;

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
                description: `Payment for tickets: ${ticketId}`,
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
            return res.status(400).json({ message: 'Token không hợp lệ' });
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

            const [userPart, ticketPart] = referenceId.split('-ticket-'); // Cập nhật từ '-tickets-' thành '-ticket-'
            
            const userId = parseInt(userPart.replace('user-', ''), 10);
            const ticketId = parseInt(ticketPart, 10); // Chỉ có một ticketId

            // Kiểm tra sự tồn tại của ticket
            const ticket = await Ticket.findOne({
                where: { id: ticketId }
            });

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket không tồn tại' });
            }
        
            // Lưu thông tin thanh toán vào cơ sở dữ liệu
            const payment = await Payment.create({
                user_id: userId,
                ticket_id: ticketId,
                amount: parseFloat(responseData.purchase_units[0].payments.captures[0].amount.value),
                payment_method: 'PayPal',
                status: responseData.status,
            });

            if (payment) {
                const qrData = await generateQRCodeInfo(ticketId); // Đảm bảo gọi hàm bất đồng bộ với await
    
                // Tạo QR code
                const qrCodeDataURL = await QR.toDataURL(JSON.stringify(qrData)); // Tạo QR code dưới dạng Data URL
    
                // Lưu vào bảng QRCode
                const qrCodeEntry = await QRCode.create({
                    ticket_id: ticketId, // Lưu ticketId để liên kết
                    code: qrCodeDataURL // Lưu QR code
                });
    
                return res.status(200).json({
                    message: 'Giao dịch thành công',
                    details: responseData,
                    payment_id: payment.id, // Trả về ID của hóa đơn đã lưu
                    userId, // Trả về userId
                    ticketId, // Trả về ticketId
                    qrCode: qrCodeEntry.code // Trả về mã QR code
                });
            } else {
                res.status(400).json({
                    message: 'Giao dịch không thành công',
                    details: responseData,
                });
            }
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

//hàm tạo dữ liệu cho QR Code
async function generateQRCodeInfo(ticketId) {
    const ticket = await Ticket.findByPk(ticketId, {
        include: [
            {
                model: Showtime,
                as: 'showtime', // Sử dụng alias ở đây
                include: [
                    {
                        model: Movie,
                        as: 'movie',
                        attributes: ['title']
                    },
                    {
                        model: Theater,
                        as: 'theater',
                        attributes: ['name'],
                        include: [
                            {
                                    model: Cinema,
                                    as: 'cinema',
                                    attributes: ['name', 'location']
                            }
                        ]
                    }
                ]
            },
            {
                model: Seat, // Lấy thông tin ghế từ Seat
                through: { // Xác định bảng quan hệ
                    model: TicketSeats, // Chỉ định model bảng quan hệ
                },
                attributes: ['row', 'number']
            }
        ],
    });

    if (ticket) {

        const seatNames = ticket.Seats.map(seat => `${seat.row}${seat.number}`).join(', ') || 'N/A'; // Vị trí ghế ngồi

        const showtime = ticket.showtime;
        const date = showtime?.start_time ? new Date(showtime.start_time).toLocaleDateString() : 'NA'; //ngày chiếu
        const startTime = showtime?.start_time ? new Date(showtime.start_time).toLocaleTimeString() : 'N/A' // thời gian bắt đầu
        const endTime = showtime?.end_time ? new Date(showtime.end_time).toLocaleTimeString() : 'N/A'//thời gian kết thúc
        
        return {
            movieName: showtime.movie?.title || 'N/A',
            totalPrice: ticket.price || 'N/A',
            theaterName: showtime.theater?.name || 'N/A',
            cinemaName: showtime.theater?.cinema?.name || 'N/A',
            location: showtime.theater?.cinema?.location || 'N/A',
            seatName: seatNames || 'N/A',
            date: date,
            time: startTime !== 'N/A' && endTime !== 'N/A' ? `${startTime} - ${endTime}` : 'N/A' // Nối start_time và end_time
        };
    }
    // Thông báo khi không tìm thấy vé
    console.error(`No tickets found for IDs: ${ticketId}`);
    return null;
}

//hủy thanh toán
exports.cancelPayment = async (req, res) => {
    // Logic xử lý khi người dùng hủy thanh toán
    res.status(200).json({ message: 'Order has been canceled.' });
};