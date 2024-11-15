"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// Controller to create Layout
exports.createLayout = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        // Check if the layout type already exists
        const existingLayout = await layout_model_1.default.findOne({ type });
        if (existingLayout) {
            return next(new ErrorHandler_1.default(`${type} already exists`, 400));
        }
        if (type === "Banner") {
            const { title, subtitle, image } = req.body;
            // Upload banner image to Cloudinary
            const uploadedImage = await cloudinary_1.default.v2.uploader.upload(image, {
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
            await layout_model_1.default.create({ type, banner: bannerData });
            res
                .status(201)
                .json({ success: true, message: "Banner created successfully" });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            })));
            await layout_model_1.default.create({ type, faq: faqItems });
            res
                .status(201)
                .json({ success: true, message: "FAQ created successfully" });
        }
        if (type === "Categories") {
            const categories = req.body.categories.map((item) => ({
                title: item.title,
            }));
            await layout_model_1.default.create({ type, categories });
            res
                .status(201)
                .json({ success: true, message: "Categories created successfully" });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Edit Layout Function
exports.editLayout = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { type, image, title, subtitle, publicID } = req.body;
        // console.log(type, title, subtitle, image);
        if (type === "Banner") {
            const bannerData = await layout_model_1.default.findOne({ type: "Banner" });
            // console.log(bannerData);
            const newImage = image?.startsWith("https")
                ? bannerData
                : await cloudinary_1.default.v2.uploader.upload(image, {
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
            await layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner });
        }
        // Handle FAQ Update
        else if (type === "FAQ") {
            const faqItem = await layout_model_1.default.findOne({ type: "FAQ" });
            // console.log(faqItem);
            faqItem.faq = req.body.faqData;
            // console.log(faqItem.faqData);
            await layout_model_1.default.findByIdAndUpdate(faqItem._id, faqItem);
        }
        // Handle Categories Update
        else if (type === "Categories") {
            const categoriesData = await layout_model_1.default.findOne({
                type: "Categories",
            });
            categoriesData.categories = req.body.categories;
            await layout_model_1.default.findByIdAndUpdate(categoriesData?._id, categoriesData);
        }
        res
            .status(200)
            .json({ success: true, message: "Layout updated successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Get Layout by Type
exports.getLayoutByType = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.params;
        const layout = await layout_model_1.default.findOne({ type });
        res.status(200).json({ success: true, layout });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
