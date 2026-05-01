import mongoose from "mongoose";
import { conf } from "../conf/conf.js";

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      `${conf.mongoUrl}/${conf.dbName}`
    );
    connection && console.log("MongoDB database connected");
  } catch (error) {
    console.log("Error while connecting to Database ", error?.message);
    process.exit(1);
  }
};
