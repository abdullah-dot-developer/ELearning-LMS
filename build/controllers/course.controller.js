"use strict";
// File: controllers/course.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCourse = exports.replyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const cloudinary_1 = __importDefault(require("cloudinary")); // Cloudinary for image uploads
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
// Comment: Upload Course
exports.uploadCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        //   console.log("Reached here");
        const data = req.body;
        //   console.log(req.body);
        // console.log(data);
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
                public_id: thumbnail.public_id,
            });
            // console.log(myCloud);
            // Prepare the response with uploaded cloud data
            data.thumbnail = {
                publicId: myCloud.public_id,
                url: myCloud.secure_url,
            };
            (0, course_service_1.createCourse)(data, res, next);
        }
        else {
            return next(new ErrorHandler_1.default("Thumbnail is required!", 400)); // Handle error
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500)); // Handle error
    }
});
//EDIT COURSe
// update course
exports.editCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const isCacheExist = await redis_1.redis.get(courseId);
        if (isCacheExist) {
            await redis_1.redis.del(courseId);
        }
        const courseData = (await course_model_1.default.findById(courseId));
        if (thumbnail && !thumbnail.startsWith("https")) {
            if (courseData &&
                courseData.thumbnail &&
                courseData.thumbnail.public_id)
                await cloudinary_1.default.v2.uploader.destroy(courseData?.thumbnail?.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
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
        const course = await course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, {
            new: true,
        });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// GET SINGLE COURSE WITHOUT PURCHASE
// Get a single course without exposing sensitive content
exports.getSingleCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        // Extract course ID from request parameters
        const courseId = req.params.id;
        //   Check if course data exists in Redis cache
        const cachedCourse = await redis_1.redis.get(courseId);
        if (cachedCourse) {
            // If cache exists, send it from Redis
            return res.status(200).json({
                success: true,
                course: JSON.parse(cachedCourse),
            });
        }
        // Fetch course data from MongoDB if not cached
        const course = await course_model_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        // Cache the result in Redis for future requests
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        // Send the course data without sensitive fields
        return res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getAllCourses = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
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
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        // Cache the result in Redis
        // await redis.set("allCourses", JSON.stringify(courses));
        // Send response with courses
        return res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course by user
exports.getCourseByUser = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        // Get the list of courses the user has access to
        const userCourses = req.user?.courses; // Assuming req.user is populated and contains user data
        // Get the course ID from the request parameters
        const courseId = req.params.id;
        // Check if the user has the course
        const courseExists = userCourses?.find((course) => course._id.toString() === courseId);
        // If the course doesn't exist in the user's list
        // if (!courseExists) {
        //   return next(
        //     new ErrorHandler("You are not eligible to access this course.", 403)
        //   );
        // }
        // If the user has access, find the course content
        const course = await course_model_1.default.findById(courseId);
        // If the course doesn't exist in the database
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found.", 404));
        }
        const content = course?.courseData;
        // Send the course content if the user is eligible
        return res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        // Validate the content ID
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content ID", 400));
        }
        // Find the course by ID and check content
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found!", 404));
        }
        const content = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!content) {
            return next(new ErrorHandler_1.default("Invalid content ID", 400));
        }
        // Create a new question object
        const newQuestion = {
            user: req.user, // Assuming user is attached to request object after authentication
            question,
            replies: [],
        };
        // Add the new question to the content's questions array
        content.questions.push(newQuestion);
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "New Question Added!",
            message: `You have a new question in the video: ${content?.title}`,
        });
        // Save the updated course
        await course.save();
        return res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        // Validate the content ID
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content ID", 400));
        }
        // Find the course and its content
        const course = await course_model_1.default.findById(courseId).populate({
            path: "courseData.questions.user",
            select: "email name",
        });
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found!", 404));
        }
        const content = course?.courseData.find((item) => item._id.equals(contentId));
        if (!content) {
            return next(new ErrorHandler_1.default("Invalid content ID", 400));
        }
        // Find the question in the content
        const question = content.questions.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("Question not found!", 404));
        }
        // console.log(question);
        // Create a new answer object
        const newAnswer = {
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
            await notification_model_1.default.create({
                user: req.user?._id,
                title: "New Answer to the Question",
                message: `You have a new answer to the question: ${question.question} in video: ${content?.title}`,
            });
        }
        else {
            // Send email to question creator notifying them of the answer
            const data = {
                name: question.user.name,
                title: content.title,
            };
            const html = ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "New answer to your question",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
        }
        return res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
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
        const course = await course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        course?.reviews.push(reviewData);
        let average = 0;
        course?.reviews.forEach((review) => {
            average += review.rating;
        });
        if (course) {
            course.ratings = average / course.reviews.length;
        }
        await course?.save();
        redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        // create notification
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "New Review Recieved!",
            message: `${req.user?.name} has given a review on your course ${course?.courseName}`,
        });
        res.status(200).json({
            success: true,
            message: "Review Added successfully!",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.replyToReview = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const review = course.reviews?.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        const replyData = {
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
        redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
            success: true,
            message: "Replied successfully!",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//GET ALL COURSES
exports.getAllCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Delete Course - Only admin can access
exports.deleteCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        // Find the course by ID
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found!", 404));
        }
        // Delete the course
        await course.deleteOne({ courseId });
        // Remove course details from Redis cache if cached
        await redis_1.redis.del(courseId);
        res
            .status(200)
            .json({ success: true, message: "Course deleted successfully!" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.generateVideoUrl = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_KEY}`,
            },
        });
        res.json(response?.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
