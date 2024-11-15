import { Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import Course from "../models/course.model";

// Export constant to create course
export const createCourse = catchAsyncError(
  async (data: any, res: Response) => {
    // console.log("Creating course with: ", data);
    const course = await Course.create(data);
    await course.save();

    res.status(201).json({
      success: true,
      course,
    });
  }
);

//GET ALL COURSES
export const getAllCoursesService = async (res: Response) => {
  const courses = await Course.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    courses,
  });
};
