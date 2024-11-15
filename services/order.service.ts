import { catchAsyncError } from "../middleware/catchAsyncError";
import Order from "../models/order.model";
import { Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import Course from "../models/course.model";

// Create New Order Service
export const newOrder = catchAsyncError(
  async (data: any, res: Response, next: NextFunction) => {
    // Create the order
    const order = await Order.create(data);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
    next();
  }
);

//GET ALL ORDERS
export const getAllOrdersService = async (res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    orders,
  });
};
