import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addQuestion,
  addReview,
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAllCourse,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  replyToReview,
  uploadCourse,
} from "../controllers/course.controller";
import { updateAccessToken } from "../controllers/user.controller";
// import { createCourse } from "../services/course.service";

const router = express.Router();

// Route for uploading a course
router.post(
  "/create-course",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
router.put(
  "/edit-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);
router.get("/get-course/:id", getSingleCourse);
router.get("/get-courses", getAllCourses);
router.get(
  "/get-all-courses",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCourse
);
router.get(
  "/get-course-content/:id",
  updateAccessToken,
  isAuthenticated,
  getCourseByUser
);
router.put("/add-question", updateAccessToken, isAuthenticated, addQuestion);
router.put("/add-answer", updateAccessToken, isAuthenticated, addAnswer);
router.put("/add-review/:id", updateAccessToken, isAuthenticated, addReview);
router.put(
  "/add-reply",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  replyToReview
);
router.post("/getVdoCipherOTP", generateVideoUrl);
router.delete(
  "/delete-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourse
);

export default router;
