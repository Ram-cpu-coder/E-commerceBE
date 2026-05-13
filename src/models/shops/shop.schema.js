import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    adminId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      index: true,
      default: null,
    },
    adminName: {
      type: String,
      trim: true,
      default: "",
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    paymentProvider: {
      type: String,
      trim: true,
      default: "manual",
    },
    payoutAccountName: {
      type: String,
      trim: true,
      default: "",
    },
    payoutAccountEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    payoutAccountId: {
      type: String,
      trim: true,
      default: "",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    bankAccountLast4: {
      type: String,
      trim: true,
      maxlength: 4,
      default: "",
    },
    payoutCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "AUD",
    },
    paymentSetupStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

ShopSchema.index({ name: 1 });

export default mongoose.model("Shop", ShopSchema);
