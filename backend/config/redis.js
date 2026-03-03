import { createClient } from "redis";

let redisClient = null;

export const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
        });

        redisClient.on("error", (err) =>
            console.error("Redis error:", err)
        );

        await redisClient.connect();

        console.log("🚀 Redis connected");

    } catch (err) {
        console.error("Redis connection failed:", err.message);
    }
};

export const getRedis = () => redisClient;