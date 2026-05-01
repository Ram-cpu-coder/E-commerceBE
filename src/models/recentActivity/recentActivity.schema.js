
import mongoose from "mongoose";

const recentActivitySchema = new mongoose.Schema({
    userDetail: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            // required: true,
            ref: "User"
        },
        userName: { type: String, required: true }
    },
    action: {
        type: String,
        enum: ["userRegistration", "userUpdated", "orderPlaced", "orderCancelled", "orderDelivered", "orderShipped", "orderUpdated", "productAdded", "productDeleted", "productUpdated", "bannerCreated", "bannerDeleted", "bannerUpdated", "productReviewed", "categoryCreated", "categoryUpdated", "categoryDeleted"],
        required: true
    },
    entityId: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        required: true
    },
    logMessage: {
        type: String
    }

}, { timestamps: true })


recentActivitySchema.pre("save", function (next) {
    if (!this.logMessage) {
        const { userDetail, action, entityId, entityType } = this

        const actionMessages = {
            userRegistration: `User ${userDetail.userName} registered.`,
            userUpdated: `User ${userDetail.userName} updated their profile.`,
            orderPlaced: `User ${userDetail.userName} placed a new order (${entityId}).`,
            orderCancelled: `User ${userDetail.userName} cancelled an order (${entityId}).`,
            orderDelivered: `Order (${entityId}) was delivered.`,
            orderShipped: `Order (${entityId}) was Shipped.`,
            orderUpdated: `User ${userDetail.userName} updated an order (${entityId}).`,
            productAdded: `${userDetail.userName} added a new product (${entityId}).`,
            productDeleted: `${userDetail.userName} deleted a product (${entityId}).`,
            productUpdated: `${userDetail.userName} updated a product (${entityId}).`,
            productReviewed: `User ${userDetail.userName} reviewed a product (${entityId}).`,
            bannerCreated: `${userDetail.userName} created a banner (${entityId}).`,
            bannerDeleted: `${userDetail.userName} deleted a banner (${entityId}).`,
            bannerUpdated: `${userDetail.userName} updated a banner (${entityId}).`,
            categoryCreated: `${userDetail.userName} created a category (${entityId}).`,
            categoryDeleted: `${userDetail.userName} deleted a category (${entityId}).`,
            categoryUpdated: `${userDetail.userName} updated a category (${entityId}).`,
        }

        this.logMessage = actionMessages[action] || `User ${userDetail.userName} performed '${action}' on ${entityType} (${entityId}).`;

    }
    next()
})

export const RecentActivitySchema = mongoose.model("RecentActivity", recentActivitySchema)