import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error!";

  //wrong mongodb error
  if (err.name == "CastError") {
    const message = `Resource not found. Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //Duplicate key error
  if (err.code == 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
    err = new ErrorHandler(message, 400);
  }

  //jsonwebtoken error
  if (err.name == "JsonWebTokenError") {
    const message = `Json web token is invalid, Try again later.`;
    err = new ErrorHandler(message, 400);
  }

  //Duplicate key error
  if (err.name == "TokenExpireError") {
    const message = `Your token is expired, Please login again.`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
export default ErrorMiddleware;
