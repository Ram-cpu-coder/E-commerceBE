import mongoose from "mongoose";

const actionHistorySchemas = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    action: {
        type: String,
        enum: ["view", "click", "add_to_cart", "purchase"],
        default: "view"
    },
    defaulttimestamp: {
        type: Date,
        default: Date.now
    }
});

const userHistorySchemas = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        index: true,
        sparse: true,
        default: undefined
    },
    guestSessionId: {
        type: String,
        index: true,
        sparse: true,
        default: undefined
    },
    history: [actionHistorySchemas]
}, { timestamps: true });

userHistorySchemas.index({ guestSessionId: 1 }, { sparse: true });
userHistorySchemas.index({ userId: 1 }, { sparse: true });

export default mongoose.model("UserBehaviour", userHistorySchemas);
