import { v2 as cloudinary } from "cloudinary";
import { conf } from "../conf/conf.js";
cloudinary.config({
  cloud_name: conf.cloudName,
  api_key: conf.cloudinaryApiKey,
  api_secret: conf.cloudinaryApiSecret,
});

export default cloudinary;