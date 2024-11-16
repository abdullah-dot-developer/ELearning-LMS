import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import ErrorMiddleware from "./middleware/error";
import userRoutes from "./routes/user.route";
import courseRoutes from "./routes/course.route";
import orderRoutes from "./routes/order.route";
import notificationRoutes from "./routes/notification.route";
import analyticsRoutes from "./routes/analytics.route";
import layoutRoutes from "./routes/layout.route";
import { rateLimit } from "express-rate-limit";

dotenv.config();

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "https://e-learning-lms-frontend.vercel.app",
    credentials: true,
  })
);

// api requests limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

//routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", courseRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", notificationRoutes);
app.use("/api/v1", analyticsRoutes);
app.use("/api/v1", layoutRoutes);

app.use("/test", (req, res) => {
  res.send("Api is working fine");
});

//unknown route
app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found!`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(limiter);
app.use(ErrorMiddleware);
