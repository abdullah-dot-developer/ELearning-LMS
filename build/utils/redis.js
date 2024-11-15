"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const ioredis_1 = __importDefault(require("ioredis"));
dotenv_1.default.config();
const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log("Redis also connected!");
        return process.env.REDIS_URL;
    }
    throw new Error("Redis connection failed!");
};
exports.redis = new ioredis_1.default(redisClient());
