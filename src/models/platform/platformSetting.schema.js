import mongoose from "mongoose";

const PlatformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "default",
    },
    commissionRate: {
      type: Number,
      default: 8,
      min: 0,
      max: 100,
    },
    payoutHoldDays: {
      type: Number,
      default: 7,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 30,
      min: 0,
    },
    defaultCurrency: {
      type: String,
      uppercase: true,
      default: "AUD",
    },
    sellerApprovalMode: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },
    reviewModerationMode: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },
    allowShopSelfRegistration: {
      type: Boolean,
      default: true,
    },
    requireVerifiedPayoutBeforeSelling: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PlatformSetting", PlatformSettingSchema);
