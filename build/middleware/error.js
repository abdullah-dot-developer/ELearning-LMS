"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const ErrorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error!";
    //wrong mongodb error
    if (err.name == "CastError") {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler_1.default(message, 400);
    }
    //Duplicate key error
    if (err.code == 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
        err = new ErrorHandler_1.default(message, 400);
    }
    //jsonwebtoken error
    if (err.name == "JsonWebTokenError") {
        const message = `Json web token is invalid, Try again later.`;
        err = new ErrorHandler_1.default(message, 400);
    }
    //Duplicate key error
    if (err.name == "TokenExpireError") {
        const message = `Your token is expired, Please login again.`;
        err = new ErrorHandler_1.default(message, 400);
    }
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
exports.default = ErrorMiddleware;
