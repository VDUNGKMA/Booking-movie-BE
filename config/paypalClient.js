//paypalClient.js
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Hàm tạo access token từ PayPal
 * @returns {Promise<string>} - Access Token
 */
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

module.exports = {
    generateAccessToken,
};
