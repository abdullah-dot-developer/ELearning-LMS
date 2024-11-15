// File: controllers/course.controller.ts

import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import cloudinary from "cloudinary"; // Cloudinary for image uploads
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse, getAllCoursesService } from "../services/course.service";
import Course from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import Notification from "../models/notification.model";
import axios from "axios";

// Comment: Upload Course
export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //   console.log("Reached here");
      const data = req.body;
      //   console.log(req.body);
      // console.log(data);
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
          public_id: thumbnail.public_id,
        });
        // console.log(myCloud);

        // Prepare the response with uploaded cloud data
        data.thumbnail = {
          publicId: myCloud.public_id,
          url: myCloud.secure_url,
        };
        createCourse(data, res, next);
      } else {
        return next(new ErrorHandler("Thumbnail is required!", 400)); // Handle error
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500)); // Handle error
    }
  }
);

//EDIT COURSe
// update course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const courseId = req.params.id;

      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        await redis.del(courseId);
      }

      const courseData = (await Course.findById(courseId)) as any;

      if (thumbnail && !thumbnail.startsWith("https")) {
        if (
          courseData &&
          courseData.thumbnail &&
          courseData.thumbnail.public_id
        )
          await cloudinary.v2.uploader.destroy(
            courseData?.thumbnail?.public_id
          );

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }

      const course = await Course.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        {
          new: true,
        }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// GET SINGLE COURSE WITHOUT PURCHASE
// Get a single course without exposing sensitive content
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract course ID from request parameters
      const courseId = req.params.id;

      //   Check if course data exists in Redis cache
      const cachedCourse = await redis.get(courseId);
      if (cachedCourse) {
        // If cache exists, send it from Redis
        return res.status(200).json({
          success: true,
          course: JSON.parse(cachedCourse),
        });
      }

      // Fetch course data from MongoDB if not cached
      const course = await Course.findById(courseId).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      // Cache the result in Redis for future requests
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);

      // Send the course data without sensitive fields
      return res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if all courses are cached in Redis
      // const cachedCourses = await redis.get("allCourses");
      // if (cachedCourses) {
      //   // If cache exists, return it
      //   return res.status(200).json({
      //     success: true,
      //     courses: JSON.parse(cachedCourses),
      //   });
      // }

      // Fetch all courses from MongoDB excluding sensitive fields
      const courses = await Course.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      // Cache the result in Redis
      // await redis.set("allCourses", JSON.stringify(courses));

      // Send response with courses
      return res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course by user
export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the list of courses the user has access to
      const userCourses = req.user?.courses; // Assuming req.user is populated and contains user data

      // Get the course ID from the request parameters
      const courseId = req.params.id;

      // Check if the user has the course
      const courseExists = userCourses?.find(
        (course: any) => course._id.toString() === courseId
      );

      // If the course doesn't exist in the user's list
      // if (!courseExists) {
      //   return next(
      //     new ErrorHandler("You are not eligible to access this course.", 403)
      //   );
      // }

      // If the user has access, find the course content
      const course = await Course.findById(courseId);

      // If the course doesn't exist in the database
      if (!course) {
        return next(new ErrorHandler("Course not found.", 404));
      }

      const content = course?.courseData;

      // Send the course content if the user is eligible
      return res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;

      // Validate the content ID
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content ID", 400));
      }

      // Find the course by ID and check content
      const course = await Course.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found!", 404));
      }

      const content = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!content) {
        return next(new ErrorHandler("Invalid content ID", 400));
      }

      // Create a new question object
      const newQuestion: any = {
        user: req.user, // Assuming user is attached to request object after authentication
        question,
        replies: [],
      };

      // Add the new question to the content's questions array
      content.questions.push(newQuestion);

      await Notification.create({
        user: req.user?._id,
        title: "New Question Added!",
        message: `You have a new question in the video: ${content?.title}`,
      });

      // Save the updated course
      await course.save();

      return res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Adding Answers
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const addAnswer = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      // Validate the content ID
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content ID", 400));
      }

      // Find the course and its content
      const course = await Course.findById(courseId).populate({
        path: "courseData.questions.user",
        select: "email name",
      });
      if (!course) {
        return next(new ErrorHandler("Course not found!", 404));
      }

      const content = course?.courseData.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!content) {
        return next(new ErrorHandler("Invalid content ID", 400));
      }

      // Find the question in the content
      const question = content.questions.find((item: any) =>
        item._id.equals(questionId)
      );
      if (!question) {
        return next(new ErrorHandler("Question not found!", 404));
      }
      // console.log(question);

      // Create a new answer object
      const newAnswer: any = {
        user: req.user, // Assuming user is attached to request object
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the new answer to the question's replies array
      question.questionReplies?.push(newAnswer);

      // Save the updated course
      await course.save();
      //   console.log(question.user);

      // Check if the question creator is different from the user giving the answer
      if (req.user?._id === question.user._id) {
        //SEND NOTIFICATION
        await Notification.create({
          user: req.user?._id,
          title: "New Answer to the Question",
          message: `You have a new answer to the question: ${question.question} in video: ${content?.title}`,
        });
      } else {
        // Send email to question creator notifying them of the answer
        const data = {
          name: question.user.name,
          title: content.title,
        };
        const html = ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );
        try {
          await sendMail({
            email: question.user.email,
            subject: "New answer to your question",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      return res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//ADDING REVIEW
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      //check if course id exist in user course list
      // const courseExist = userCourseList?.some(
      //   (course: any) => course._id.toString() === courseId.toString()
      // );
      // if (!courseExist) {
      //   return next(
      //     new ErrorHandler("You are not eligible to access this course!", 400)
      //   );
      // }

      const course = await Course.findById(courseId);
      const { review, rating } = req.body as IAddReviewData;
      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };
      course?.reviews.push(reviewData);

      let average = 0;
      course?.reviews.forEach((review: any) => {
        average += review.rating;
      });
      if (course) {
        course.ratings = average / course.reviews.length;
      }

      await course?.save();

      redis.set(courseId, JSON.stringify(course), "EX", 604800);

      // create notification
      await Notification.create({
        user: req.user?._id,
        title: "New Review Recieved!",
        message: `${req.user?.name} has given a review on your course ${course?.courseName}`,
      });

      res.status(200).json({
        success: true,
        message: "Review Added successfully!",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add Reply in review
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const replyToReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;
      const course = await Course.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const review = course.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!review.replies) {
        review.replies = [];
      }

      review.replies?.push(replyData);
      await course.save();
      redis.set(courseId, JSON.stringify(course), "EX", 604800);

      res.status(200).json({
        success: true,
        message: "Replied successfully!",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//GET ALL COURSES
export const getAllCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete Course - Only admin can access
export const deleteCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      // Find the course by ID
      const course = await Course.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found!", 404));
      }

      // Delete the course
      await course.deleteOne({ courseId });

      // Remove course details from Redis cache if cached
      await redis.del(courseId);

      res
        .status(200)
        .json({ success: true, message: "Course deleted successfully!" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const generateVideoUrl = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_KEY}`,
          },
        }
      );
      res.json(response?.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
