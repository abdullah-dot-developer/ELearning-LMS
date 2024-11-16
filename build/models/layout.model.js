"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import necessary modules from mongoose
const mongoose_1 = require("mongoose");
// Define FAQ Schema
const faqSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
});
// Define Category Schema
const categorySchema = new mongoose_1.Schema({
    title: { type: String, required: true },
});
// Define Banner Image Schema
const bannerImageSchema = new mongoose_1.Schema({
    publicId: { type: String, required: true },
    url: { type: String, required: true },
});
// Define Layout Schema
const layoutSchema = new mongoose_1.Schema({
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
const LayoutModel = (0, mongoose_1.model)("Layout", layoutSchema);
exports.default = LayoutModel;
