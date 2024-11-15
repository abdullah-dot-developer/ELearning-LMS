import dotenv from "dotenv";
import { app } from "./app";
import cloudinary from "cloudinary";
import connectDB from "./utils/db";
import http from "http";
import { initSocketServer } from "./socketServer";

dotenv.config();

const server = http.createServer(app);

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

initSocketServer(server);

server.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);
  connectDB();
});
