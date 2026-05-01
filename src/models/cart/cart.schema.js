
import mongoose, { Schema } from "mongoose";

const CartItemSchema = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    images: [String],
    stock: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    }
})
const CartSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cartItems: [CartItemSchema]

}, {
    timestamps: true
})

export default mongoose.model("Cart", CartSchema)