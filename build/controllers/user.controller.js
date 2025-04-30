"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser =
  exports.updateUserRole =
  exports.getAllUsers =
  exports.updateProfilePicture =
  exports.updatePassword =
  exports.updateUserInfo =
  exports.socialAuth =
  exports.getUserInfo =
  exports.updateAccessToken =
  exports.logoutUser =
  exports.loginUser =
  exports.activateUser =
  exports.createActivationToken =
  exports.registerUser =
    void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
dotenv_1.default.config();
exports.registerUser = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await user_model_1.default.findOne({ email });
      if (isEmailExist) {
        return next(
          new ErrorHandler_1.default(
            "An account with this email already exist.",
            400
          )
        );
      }
      // const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        name,
        email,
        password,
      };
      const activationToken = (0, exports.createActivationToken)(user);
      // console.log(activationToken);
      const activationCode = activationToken.activationCode;
      //Send Email template
      const data = { user, activationCode };
      const html = await ejs_1.default.renderFile(
        path_1.default.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );
      try {
        await (0, sendMail_1.default)({
          email: user?.email,
          subject: "Activate Your Account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          success: true,
          message: `We have sent an email to ${user.email}. Please check your inbox to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
      }
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
const createActivationToken = (user) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jsonwebtoken_1.default.sign(
    {
      user,
      activationCode,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { activation_token, activation_code } = req.body;
      const newUser = jsonwebtoken_1.default.verify(
        activation_token,
        process.env.JWT_SECRET
      );
      if (newUser.activationCode !== activation_code) {
        return next(
          new ErrorHandler_1.default("Invalid activation Code.", 400)
        );
      }
      const { name, email, password } = newUser.user;
      const existUser = await user_model_1.default.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler_1.default("Email already exist!", 400));
      }
      const hashedPassword = await bcryptjs_1.default.hash(password, 10);
      const user = new user_model_1.default({
        name,
        email,
        password: hashedPassword,
        isVerified: true,
      });
      await user.save();
      res.status(201).json({
        success: true,
        message: "User verified successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
exports.loginUser = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(
          new ErrorHandler_1.default("Please fill all the fields!", 400)
        );
      }
      const user = await user_model_1.default.findOne({ email });
      if (!user) {
        return next(
          new ErrorHandler_1.default("User with this email doesn't exist!", 400)
        );
      }
      // console.log(password, user.password, 'password');
      // const hashedPassword = await bcrypt.hash(password, 10);
      // console.log(hashedPassword);
      const isPasswordCorrect = await bcryptjs_1.default.compare(
        password,
        user?.password
      );
      // console.log(password, "Bcrypted Password: ", user.password);
      // console.log(isPasswordCorrect);
      if (!isPasswordCorrect) {
        return next(new ErrorHandler_1.default("Invalid Credentials!", 400));
      }
      (0, jwt_1.sendToken)(user, 200, res);
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
//LOGOUT USER
exports.logoutUser = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id;
      // console.log(req.user);
      // redis.del(userId);
      res.status(200).json({
        success: true,
        message: "User logged out successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
// Refresh Access Token Route
exports.updateAccessToken = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      // Extract refresh token from cookies
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) {
        return next(
          new ErrorHandler_1.default("Refresh token is missing!", 400)
        );
      }
      // Verify refresh token
      const decoded = jsonwebtoken_1.default.verify(
        refreshToken,
        process.env.REFRESH_TOKEN
      );
      if (!decoded) {
        return next(
          new ErrorHandler_1.default("Could not refresh token.", 400)
        );
      }
      // Retrieve session data from Redis (or any session store)
      // const sessionData = await redis.get(decoded.id as string);
      const sessionData = await user_model_1.default
        .findById(decoded?.id)
        .select("-password");
      if (!sessionData) {
        return next(
          new ErrorHandler_1.default("No session found. Please log in.", 401)
        );
      }
      // Parse session data (assumed to be stored in JSON format)
      const user = sessionData;
      // Create new access token
      const accessToken = jsonwebtoken_1.default.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN,
        { expiresIn: "5m" } // Access token expires in 5 minutes
      );
      // Optionally: create a new refresh token (if the existing one is about to expire)
      const newRefreshToken = jsonwebtoken_1.default.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN,
        { expiresIn: "3d" } // Refresh token expires in 3 days
      );
      req.user = user;
      // Update cookies with the new tokens
      res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
      res.cookie("refresh_token", newRefreshToken, jwt_1.refreshTokenOptions);
      // redis.set(user._id, JSON.stringify(user), "EX", 604800);
      // Return response
      next();
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
exports.getUserInfo = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const userId = req.user?._id;
      // getUserById(userId, res);
      const user = await user_model_1.default
        .findById(userId)
        .select("-password");
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
exports.socialAuth = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { email, name, avatar } = req.body;
      const user = await user_model_1.default.findOne({ email });
      if (!user) {
        const newUser = await user_model_1.default.create({
          email,
          name,
          avatar,
        });
        await newUser.save();
        (0, jwt_1.sendToken)(newUser, 200, res);
      } else {
        (0, jwt_1.sendToken)(user, 200, res);
      }
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
exports.updateUserInfo = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const userId = req.user?._id;
      const user = await user_model_1.default
        .findById(userId)
        .select("-password");
      if (user && name) {
        user.name = name;
        await user.save().catch((err) => console.error(err));
      }
      // await redis.set(userId, JSON.stringify(user));
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 500));
    }
  }
);
exports.updatePassword = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler_1.default("Please fill in all the fields!", 400)
        );
      }
      const userId = req.user?._id;
      const user = await user_model_1.default.findById(userId);
      if (user?.password === undefined) {
        return next(new ErrorHandler_1.default("Invalid user!", 400));
      }
      // console.log(user.password);
      // console.log(oldPassword);
      const isPasswordCorrect = await bcryptjs_1.default.compare(
        oldPassword,
        user?.password
      );
      if (!isPasswordCorrect) {
        return next(
          new ErrorHandler_1.default(
            "The old Password you entered is incorrect!",
            400
          )
        );
      }
      const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      // redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "Password updated Successfully.",
        user,
      });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 400));
    }
  }
);
exports.updateProfilePicture = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { avatar } = req.body;
      const userId = req.user?._id;
      // Find user by ID
      const user = await user_model_1.default
        .findById(userId)
        .select("-password");
      if (!user) {
        return next(new ErrorHandler_1.default("User not found", 400));
      }
      // Check if user already has a profile picture
      if (user.avatar && user.avatar.public_id) {
        // Delete old profile picture from Cloudinary
        await cloudinary_1.default.v2.uploader.destroy(user.avatar.public_id);
      }
      // Upload new profile picture to Cloudinary
      const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
      // Update user's avatar information
      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
      console.log(user?.avatar, "avatar");
      // Save the updated user information
      await user.save();
      // Optionally set in Redis if needed
      // await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully.",
        user,
      });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 500));
    }
  }
);
//GET ALL USERS
exports.getAllUsers = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      (0, user_service_1.getAllUsersService)(res);
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 500));
    }
  }
);
// UPDATE USER ROLE ==> ADMIN
exports.updateUserRole = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const { id, role } = req.body;
      (0, user_service_1.updateUserRoleService)(res, id, role);
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 500));
    }
  }
);
//DELETE USER ==> ADMIN
exports.deleteUser = (0, catchAsyncError_1.catchAsyncError)(
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      // Find the user by ID
      const user = await user_model_1.default.findById(userId);
      if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
      }
      // Delete the user
      await user.deleteOne({ userId });
      // Remove user from Redis cache if cached
      await redis_1.redis.del(userId);
      res
        .status(200)
        .json({ success: true, message: "User deleted successfully!" });
    } catch (error) {
      return next(new ErrorHandler_1.default(error.message, 500));
    }
  }
);
