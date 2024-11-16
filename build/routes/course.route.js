"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const course_controller_1 = require("../controllers/course.controller");
const user_controller_1 = require("../controllers/user.controller");
// import { createCourse } from "../services/course.service";
const router = express_1.default.Router();
// Route for uploading a course
router.post("/create-course", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.uploadCourse);
router.put("/edit-course/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.editCourse);
router.get("/get-course/:id", course_controller_1.getSingleCourse);
router.get("/get-courses", course_controller_1.getAllCourses);
router.get("/get-all-courses", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.getAllCourse);
router.get("/get-course-content/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.getCourseByUser);
router.put("/add-question", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.addQuestion);
router.put("/add-answer", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.addAnswer);
router.put("/add-review/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.addReview);
router.put("/add-reply", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.replyToReview);
router.post("/getVdoCipherOTP", course_controller_1.generateVideoUrl);
router.delete("/delete-course/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.deleteCourse);
exports.default = router;
