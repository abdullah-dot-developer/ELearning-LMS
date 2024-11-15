import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbUrl: string = process.env.DB_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl).then((data: any) => {
      //   console.log(data);
      console.log(`DataBase connected with ${data.connection.host}`);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
