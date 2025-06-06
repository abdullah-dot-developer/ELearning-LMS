"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const catchAsyncError_1 = require("./catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
exports.isAuthenticated = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource!", 400));
    }
    const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
    // console.log(decoded);
    if (!decoded) {
        return next(new ErrorHandler_1.default("Invalid Access, Try again later.", 400));
    }
    // const user = await redis.get(decoded.id);
    const user = await user_model_1.default.findById(decoded?.id);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found!", 400));
    }
    // req.user = JSON.parse(user);
    req.user = user;
    next();
});
//authorizing roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler_1.default(`${req.user?.role} is not allowed to access this resource.`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
