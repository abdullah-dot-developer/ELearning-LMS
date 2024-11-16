import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();

const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log("Redis also connected!");
    return process.env.REDIS_URL;
  }
  throw new Error("Redis connection failed!");
};

export const redis = new Redis(redisClient());
