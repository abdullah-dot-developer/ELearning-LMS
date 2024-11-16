"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationStatus = exports.getNotifications = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const node_cron_1 = __importDefault(require("node-cron"));
exports.getNotifications = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        // Get all notifications sorted by created date in descending order
        const notifications = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Updating Notification Status
exports.updateNotificationStatus = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.default.findById(req.params.id);
        // Check if notification exists
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", 404));
        }
        else {
            notification.status
                ? (notification.status = "read")
                : notification.status;
        }
        await notification.save();
        // Send updated notifications back
        const notifications = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//DELETE NOTIFICATION
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notification_model_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("Notification Deleted Successfully!");
});
