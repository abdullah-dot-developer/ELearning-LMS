import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import LayoutModel from "../models/layout.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";

// Controller to create Layout
export const createLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      // Check if the layout type already exists
      const existingLayout = await LayoutModel.findOne({ type });
      if (existingLayout) {
        return next(new ErrorHandler(`${type} already exists`, 400));
      }

      if (type === "Banner") {
        const { title, subtitle, image } = req.body;
        // Upload banner image to Cloudinary
        const uploadedImage = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        const bannerData = {
          image: {
            publicId: uploadedImage.public_id,
            url: uploadedImage.secure_url,
          },
          title,
          subtitle,
        };

        await LayoutModel.create({ type, banner: bannerData });
        res
          .status(201)
          .json({ success: true, message: "Banner created successfully" });
      }

      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map((item: { question: string; answer: string }) => ({
            question: item.question,
            answer: item.answer,
          }))
        );

        await LayoutModel.create({ type, faq: faqItems });
        res
          .status(201)
          .json({ success: true, message: "FAQ created successfully" });
      }

      if (type === "Categories") {
        const categories = req.body.categories.map(
          (item: { title: string }) => ({
            title: item.title,
          })
        );

        await LayoutModel.create({ type, categories });
        res
          .status(201)
          .json({ success: true, message: "Categories created successfully" });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Edit Layout Function
export const editLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, image, title, subtitle, publicID } = req.body;
      // console.log(type, title, subtitle, image);

      if (type === "Banner") {
        const bannerData: any = await LayoutModel.findOne({ type: "Banner" });
        // console.log(bannerData);
        const newImage = image?.startsWith("https")
          ? bannerData
          : await cloudinary.v2.uploader.upload(image, {
              folder: "layout",
            });
        const banner = {
          image: {
            publicId: image?.startsWith("https")
              ? bannerData?.banner?.image?.public_id
              : newImage.public_id,
            url: image?.startsWith("https")
              ? bannerData?.banner?.image?.url
              : newImage.secure_url,
          },
          title,
          subtitle,
        };
        // console.log(banner.url);
        await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
      }

      // Handle FAQ Update
      else if (type === "FAQ") {
        const faqItem: any = await LayoutModel.findOne({ type: "FAQ" });
        // console.log(faqItem);
        faqItem.faq = req.body.faqData;
        // console.log(faqItem.faqData);
        await LayoutModel.findByIdAndUpdate(faqItem._id, faqItem);
      }

      // Handle Categories Update
      else if (type === "Categories") {
        const categoriesData: any = await LayoutModel.findOne({
          type: "Categories",
        });
        categoriesData.categories = req.body.categories;
        await LayoutModel.findByIdAndUpdate(
          categoriesData?._id,
          categoriesData
        );
      }

      res
        .status(200)
        .json({ success: true, message: "Layout updated successfully" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Layout by Type
export const getLayoutByType = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      const layout = await LayoutModel.findOne({ type });
      res.status(200).json({ success: true, layout });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
