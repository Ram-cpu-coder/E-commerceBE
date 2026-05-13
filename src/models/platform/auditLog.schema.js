import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: "",
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: "platform",
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", AuditLogSchema);
