"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name."],
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email."],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email!",
        },
        unique: true,
    },
    password: {
        type: String,
        // required: [true, "Please Enter Your password."],
        minlength: [6, "Password must be of atleast 6 characters!"],
        select: true,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    courses: [
        {
            courseId: String,
        },
    ],
}, {
    timestamps: true,
});
// userSchema.pre<IUser>("save", async function (next) {
//   if (this.isModified("password")) {
//     next();
//   }
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });
//access token
userSchema.methods.SignAccessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
        expiresIn: "5m",
    });
};
//REFRESH token
userSchema.methods.SignRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
        expiresIn: "3d",
    });
};
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
