import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fName: {
      type: String,
      required: true,
      trim: true,
    },
    lName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: Number,
      required: true
    },
    email: {
      type: String,
      unique: true,
      required: true,
      index: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true
    },
    confirmPassword: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },
    address: {
      type: String,
      default: ""
    },
    image: {
      type: String,
    },
    refreshJWT: {
      type: String,
      default: ""
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("user", UserSchema);
