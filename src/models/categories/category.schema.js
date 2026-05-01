import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },

    displaytitle: {
      type: "String",
    },
    featureImageUrl: {
      type: "String",
    },
    categoryImage: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);
