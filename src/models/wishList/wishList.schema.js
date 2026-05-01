
import mongoose from "mongoose";

const wishListSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "user",
        required: true,
    },
    productId: {
        type: String,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    stockStatus: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
},
    { timestamps: true })

export default mongoose.model("wishList", wishListSchema)