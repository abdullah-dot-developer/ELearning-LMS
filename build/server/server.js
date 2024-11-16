"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
const cloudinary_1 = __importDefault(require("cloudinary"));
const db_1 = __importDefault(require("./utils/db"));
const http_1 = __importDefault(require("http"));
const socketServer_1 = require("./socketServer");
dotenv_1.default.config();
const server = http_1.default.createServer(app_1.app);
// Cloudinary configuration
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});
(0, socketServer_1.initSocketServer)(server);
server.listen(process.env.PORT, () => {
    console.log(`Server is connected with port ${process.env.PORT}`);
    (0, db_1.default)();
});
