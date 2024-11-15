// Import necessary modules from mongoose
import { Schema, model, Document } from "mongoose";

// Define FAQ item interface extending Document
interface IFaqItem extends Document {
  question: string;
  answer: string;
}

// Define Category interface extending Document
interface ICategory extends Document {
  title: string;
}

// Define BannerImage interface extending Document
interface IBannerImage extends Document {
  publicId: string;
  url: string;
}

// Define Layout interface extending Document
interface ILayout extends Document {
  type: string;
  faq: IFaqItem[];
  categories: ICategory[];
  banner: {
    image: IBannerImage;
    title: string;
    subtitle: string;
  };
}

// Define FAQ Schema
const faqSchema = new Schema<IFaqItem>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

// Define Category Schema
const categorySchema = new Schema<ICategory>({
  title: { type: String, required: true },
});

// Define Banner Image Schema
const bannerImageSchema = new Schema<IBannerImage>({
  publicId: { type: String, required: true },
  url: { type: String, required: true },
});

// Define Layout Schema
const layoutSchema = new Schema<ILayout>({
  type: { type: String, required: true },
  faq: { type: [faqSchema], default: [] },
  categories: { type: [categorySchema], default: [] },
  banner: {
    image: { type: bannerImageSchema },
    title: { type: String },
    subtitle: { type: String },
  },
});

// Create and export the Layout model
const LayoutModel = model<ILayout>("Layout", layoutSchema);
export default LayoutModel;
