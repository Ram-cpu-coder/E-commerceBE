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
      enum: ["superadmin", "admin", "customer"],
      default: "customer",
    },
    shopId: {
      type: String,
      index: true,
      default: "",
    },
    shopIds: {
      type: [String],
      default: [],
      index: true,
    },
    shopName: {
      type: String,
      trim: true,
      default: "",
    },
    adminRequest: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      message: {
        type: String,
        default: "",
      },
      requestedAt: Date,
      respondedAt: Date,
      responseMessage: {
        type: String,
        default: "",
      },
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
