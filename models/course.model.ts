import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user.model";

// Interface for Review
interface IReview extends Document {
  user: IUser; // Reference to User model
  rating: number;
  comment: string;
  replies?: IComment[]; // Optional replies to the review
}

// Interface for Comment
interface IComment extends Document {
  user: IUser; // Reference to User model
  question: string;
  questionReplies?: IComment[];
}

// Interface for Link
interface ILink extends Document {
  title: string;
  url: string;
}

// Interface for Course Data
interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: { public_id: string; url: string }; // Cloudinary object
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string; //suggestion could be....
  questions: IComment[];
}

// Interface for Course
interface ICourse extends Document {
  courseName: string;
  courseDescription: string;
  categories: string;
  coursePrice: number;
  courseEstimatedPrice: number; // Original price before discount
  thumbnail: { public_id: string; url: string }; // Cloudinary object
  tags: string[];
  level: string; // e.g., "Beginner", "Intermediate", "Advanced"
  demoVideoUrl: string;
  benefits: { title: string }[]; // Benefits as an array of titles
  prerequisites: { title: string }[]; // Prerequisites as an array of titles
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}

// Schema for Review
const reviewSchema = new Schema<IReview>(
  {
    user: { type: Object, ref: "User" },
    rating: { type: Number, default: 0 },
    comment: { type: String },
    replies: [{ type: Object, ref: "Comment" }],
  },
  { timestamps: true }
);

// Schema for Comment
const commentSchema = new Schema<IComment>(
  {
    user: { type: Object, ref: "User" },
    question: { type: String },
    questionReplies: [Object],
  },
  { timestamps: true }
);

// Schema for Link
const linkSchema = new Schema<ILink>({
  title: { type: String },
  url: { type: String },
});

// Schema for Course Data
const courseDataSchema = new Schema<ICourseData>({
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
const courseSchema = new Schema<ICourse>(
  {
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
  },
  {
    timestamps: true,
  }
);

// Export the Course model
const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
