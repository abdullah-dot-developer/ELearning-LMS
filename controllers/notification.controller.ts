import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import Notification from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";

export const getNotifications = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get all notifications sorted by created date in descending order
      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Updating Notification Status
export const updateNotificationStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await Notification.findById(req.params.id);

      // Check if notification exists
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      } else {
        notification.status
          ? (notification.status = "read")
          : notification.status;
      }
      await notification.save();

      // Send updated notifications back
      const notifications = await Notification.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//DELETE NOTIFICATION
cron.schedule("0 0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({
    status: "read",
    createdAt: { $lt: thirtyDaysAgo },
  });
  console.log("Notification Deleted Successfully!");
});
