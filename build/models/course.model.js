"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema for Review
const reviewSchema = new mongoose_1.Schema({
    user: { type: Object, ref: "User" },
    rating: { type: Number, default: 0 },
    comment: { type: String },
    replies: [{ type: Object, ref: "Comment" }],
}, { timestamps: true });
// Schema for Comment
const commentSchema = new mongoose_1.Schema({
    user: { type: Object, ref: "User" },
    question: { type: String },
    questionReplies: [Object],
}, { timestamps: true });
// Schema for Link
const linkSchema = new mongoose_1.Schema({
    title: { type: String },
    url: { type: String },
});
// Schema for Course Data
const courseDataSchema = new mongoose_1.Schema({
    title: {
        type: String,
    },
    description: { type: String },
    videoUrl: { type: String },
    videoThumbnail: {
        public_id: { type: String },
        url: { type: String },
    },
    videoSection: { type: String },
    videoLength: { type: Number },
    videoPlayer: { type: String },
    links: [linkSchema],
    suggestion: { type: String },
    questions: [commentSchema],
});
// Schema for Course
const courseSchema = new mongoose_1.Schema({
    courseName: { type: String },
    courseDescription: { type: String },
    categories: {
        type: String,
    },
    coursePrice: { type: Number },
    courseEstimatedPrice: { type: Number }, // Original price
    thumbnail: {
        public_id: { type: String },
        url: { type: String },
    },
    tags: [{ type: String }],
    level: { type: String },
    demoVideoUrl: { type: String },
    benefits: [{ title: { type: String } }],
    prerequisites: [{ title: { type: String } }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: { type: Number, default: 0 },
    purchased: {
        type: String,
        default: 0,
    },
}, {
    timestamps: true,
});
// Export the Course model
const Course = mongoose_1.default.model("Course", courseSchema);
exports.default = Course;
