import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";

export const isAuthenticated = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource!", 400)
      );
    }

    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload;
    // console.log(decoded);
    if (!decoded) {
      return next(new ErrorHandler("Invalid Access, Try again later.", 400));
    }
    // const user = await redis.get(decoded.id);
    const user = await userModel.findById(decoded?.id)
    if (!user) {
      return next(new ErrorHandler("User not found!", 400));
    }

    // req.user = JSON.parse(user);
    req.user = user
    next();
  }
);

//authorizing roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `${req.user?.role} is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};
