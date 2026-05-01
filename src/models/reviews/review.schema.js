
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

const ReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true
    },
    productImage: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String
    },
    userName: {
      type: String
    },
    userImage: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
ReviewSchema.plugin(mongoosePaginate)

export default mongoose.model("Review", ReviewSchema);
