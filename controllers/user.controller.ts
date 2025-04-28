import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel, { IUser } from "../models/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import dotenv from "dotenv";
import sendMail from "../utils/sendMail";
import bcrypt from "bcryptjs";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import {
  getAllUsersService,
  getUserById,
  updateUserRoleService,
} from "../services/user.service";
import cloudinary from "cloudinary";

dotenv.config();

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailExist = await userModel.findOne({ email });

      if (isEmailExist) {
        return next(
          new ErrorHandler("An account with this email already exist.", 400)
        );
      }

      // const hashedPassword = await bcrypt.hash(password, 10);

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      // console.log(activationToken);

      const activationCode = activationToken.activationCode;

      //Send Email template
      const data = { user, activationCode };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
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
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}
export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

//activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.JWT_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation Code.", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email already exist!", 400));
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new userModel({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//LOGIN USER
interface ILoginRequest {
  email: string;
  password: string;
}
export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Please fill all the fields!", 400));
      }

      const user = await userModel.findOne({ email });

      if (!user) {
        return next(
          new ErrorHandler("User with this email doesn't exist!", 400)
        );
      }
      // console.log(password, user.password, 'password');
      // const hashedPassword = await bcrypt.hash(password, 10);
      // console.log(hashedPassword);

      const isPasswordCorrect = await bcrypt.compare(password, user?.password);

      // console.log(password, "Bcrypted Password: ", user.password);
      // console.log(isPasswordCorrect);
      if (!isPasswordCorrect) {
        return next(new ErrorHandler("Invalid Credentials!", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//LOGOUT USER

export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id as string;
      // console.log(req.user);
      // redis.del(userId);

      res.status(200).json({
        success: true,
        message: "User logged out successfully!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Refresh Access Token Route
export const updateAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract refresh token from cookies
      const refreshToken = req.cookies.refresh_token as string;
      if (!refreshToken) {
        return next(new ErrorHandler("Refresh token is missing!", 400));
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      if (!decoded) {
        return next(new ErrorHandler("Could not refresh token.", 400));
      }

      // Retrieve session data from Redis (or any session store)
      // const sessionData = await redis.get(decoded.id as string);
      const sessionData = await userModel
        .findById(decoded?.id)
        .select("-password");
      if (!sessionData) {
        return next(new ErrorHandler("No session found. Please log in.", 401));
      }

      // Parse session data (assumed to be stored in JSON format)
      const user = sessionData;

      // Create new access token
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "5m" } // Access token expires in 5 minutes
      );

      // Optionally: create a new refresh token (if the existing one is about to expire)
      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: "3d" } // Refresh token expires in 3 days
      );

      req.user = user;

      // Update cookies with the new tokens
      res.cookie("access_token", accessToken, accessTokenOptions);

      res.cookie("refresh_token", newRefreshToken, refreshTokenOptions);

      // redis.set(user._id, JSON.stringify(user), "EX", 604800);

      // Return response
      next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id as string;
      // getUserById(userId, res);
      const user = await userModel.findById(userId).select("-password");
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//social auth

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar?: string;
}
export const socialAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        await newUser.save();
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//UPDATE USER INFORMATION
interface IUpdateUserInfo {
  name?: string;
}

export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as IUpdateUserInfo;
      const userId = req.user?._id as string;
      const user = await userModel.findById(userId).select("-password");

      if (user && name) {
        user.name = name;
        await user.save().catch((err) => console.error(err));
      }
      // await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//UPDATE USER PASSWORD
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please fill in all the fields!", 400));
      }
      const userId = req.user?._id as string;
      const user = await userModel.findById(userId);
      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid user!", 400));
      }
      // console.log(user.password);
      // console.log(oldPassword);

      const isPasswordCorrect = await bcrypt.compare(
        oldPassword,
        user?.password
      );
      if (!isPasswordCorrect) {
        return next(
          new ErrorHandler("The old Password you entered is incorrect!", 400)
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      // redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        message: "Password updated Successfully.",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// UPDATE PROFILE PICTURE
interface IUpdateProfilePicture {
  avatar: string;
}
export const updateProfilePicture = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;
      const userId = req.user?._id as string;

      // Find user by ID
      const user = await userModel.findById(userId).select("-password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      // Check if user already has a profile picture
      if (user.avatar && user.avatar.public_id) {
        // Delete old profile picture from Cloudinary
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }

      // Upload new profile picture to Cloudinary
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//GET ALL USERS
export const getAllUsers = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// UPDATE USER ROLE ==> ADMIN
export const updateUserRole = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body;
      updateUserRoleService(res, id, role);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//DELETE USER ==> ADMIN
export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;

      // Find the user by ID
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Delete the user
      await user.deleteOne({ userId });

      // Remove user from Redis cache if cached
      await redis.del(userId);

      res
        .status(200)
        .json({ success: true, message: "User deleted successfully!" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
