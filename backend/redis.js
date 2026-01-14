const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
