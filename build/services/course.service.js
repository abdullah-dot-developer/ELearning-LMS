"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.createCourse = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const course_model_1 = __importDefault(require("../models/course.model"));
// Export constant to create course
exports.createCourse = (0, catchAsyncError_1.catchAsyncError)(async (data, res) => {
    // console.log("Creating course with: ", data);
    const course = await course_model_1.default.create(data);
    await course.save();
    res.status(201).json({
        success: true,
        course,
    });
});
//GET ALL COURSES
const getAllCoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        courses,
    });
};
exports.getAllCoursesService = getAllCoursesService;
