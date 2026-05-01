
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        ref: "Order",
        required: true
    },
    userId: {
        type: String,
        ref: "User",
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    taxAmount: {
        type: Number,
        // required: true
    },
    status: {
        type: String,
        enum: ["paid", "unpaid"],
        required: true
    },
    products: [
        {
            id: {
                type: String,
                ref: "Product",
                required: true,
            },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            amount_total: {
                type: Number,
                min: 1
            },
            productImages: [String]

        },
    ],
    notes: {
        type: String
    }

}, { timestamps: true })

export default mongoose.model("Invoice", invoiceSchema)