import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";

import Order, { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import Course from "../models/course.model";
import path from "path";
import sendMail from "../utils/sendMail";
import Notification from "../models/notification.model";
import ejs from "ejs";
import { getAllOrdersService, newOrder } from "../services/order.service";
import { getAllCoursesService } from "../services/course.service";

import dotenv from "dotenv";
import { redis } from "../utils/redis";
dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const createOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body as IOrder;

      if (paymentInfo) {
        if ("id" in paymentInfo) {
          const paymentIntentId = paymentInfo.id;
          const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
          );

          if (paymentIntent.status !== "succeeded") {
            return next(new ErrorHandler("Payment not authorized!", 400));
          }
        }
      }

      // Find logged-in user
      const user = await userModel.findById(req.user?._id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check if user already purchased the course
      const courseExists = user.courses.some(
        (course: any) => course._id.toString() === courseId
      );
      if (courseExists) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      // Find the course by ID
      const course = await Course.findById(courseId);
      //   console.log(course);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const data: any = {
        courseId: course?._id,
        userId: user._id,
        paymentInfo,
      };

      // Send order confirmation email
      const mailData = {
        order: {
          username: user?.name,
          _id: course._id?.toString().slice(0, 6),
          name: course?.courseName,
          price: course?.coursePrice,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      // Update user courses and save
      const id = course._id as any;
      user?.courses?.push(id);
      await redis.set(req.user?._id as string, JSON.stringify(user));

      await user.save();

      // Create notification for admin
      await Notification.create({
        user: user?._id,
        title: "New Order",
        message: `You have a new order for the course: ${course?.courseName}`,
      });

      // Update course purchase count
      course.purchased = course.purchased ? course.purchased + 1 : 1;
      await course.save();

      // Create new order
      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//GET ALL ORDERS
export const getAllOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
//  send stripe publishble key

export const sendStripePublishableKey = catchAsyncError(
  async (req: Request, res: Response) => {
    res.status(200).json({
      publishablekey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  }
);

// new payment
export const newPayment = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "USD",
        description: "Purchase of CoursePool course for learning purpose!!",
        metadata: {
          company: "ELearning LMS",
        },
        automatic_payment_methods: {
          enabled: true,
        },
        shipping: {
          name: "Jenny Rosen",
          address: {
            line1: "510 Townsend St",
            postal_code: "98140",
            city: "San Francisco",
            state: "CA",
            country: "US",
          },
        },
      });
      // console.log(newPayment);

      res.status(201).json({
        success: true,
        client_secret: myPayment.client_secret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
