import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Define Product schema
const ProductSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
      index: true, // index for faster queries on active/inactive products
    },
    name: {
      type: String,
      required: true,
      index: true, // optional, useful if you search products by name
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      index: true, // index for faster category filtering
    },
    images: [String],
    ratings: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

// Add pagination plugin
ProductSchema.plugin(mongoosePaginate);

// Compound index for common queries (status + createdAt) to speed up sorting/pagination
ProductSchema.index({ status: 1, createdAt: -1 });

// Export the model
export default mongoose.model("Product", ProductSchema);
