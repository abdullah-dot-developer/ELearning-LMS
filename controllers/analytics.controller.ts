import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import Course from "../models/course.model";
import Order from "../models/order.model";

export const userAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(userModel);
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
export const coursesAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData(Course);
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
export const orderAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsData(Order);
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
