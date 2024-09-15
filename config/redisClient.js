const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config();
// Kết nối tới Redis Cloud
const client = redis.createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.connect();

module.exports = client;
