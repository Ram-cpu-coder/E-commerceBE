import mongoose from "mongoose";

const ShopApplicationSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    businessCategory: {
      type: String,
      trim: true,
      default: "",
    },
    businessType: {
      type: String,
      trim: true,
      default: "",
    },
    ownerFirstName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerLastName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    adminPasswordHash: {
      type: String,
      required: true,
      select: false,
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
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    taxId: {
      type: String,
      trim: true,
      default: "",
    },
    registrationNumber: {
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
      required: true,
      trim: true,
    },
    payoutAccountEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    responseMessage: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    createdShopId: {
      type: mongoose.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    createdAdminId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true }
);

ShopApplicationSchema.index({ ownerEmail: 1, status: 1 });

export default mongoose.model("ShopApplication", ShopApplicationSchema);
