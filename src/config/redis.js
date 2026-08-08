const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis Successfully!'));

// Redis কানেক্ট করা
(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;
