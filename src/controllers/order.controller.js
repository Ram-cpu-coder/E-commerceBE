import {
    deleteOrderDB,
    deleteOrderItemDB,
    getAllOrderDB,
    getOneOrderDB,
    getOrdersForTimeFrame,
    getSalesTimeFrameApi,
    updateOrderDB,
} from "../models/orders/order.model.js";
import Order from "../models/orders/order.schema.js";

import { findUserById } from "../models/users/user.model.js";
import { shipOrderEmail } from "../services/email.service.js";
import { getPaginatedDataFilter, getPaginatedOrderData } from "../utils/Pagination.js";
import { canAccessShopOwnedDoc, getShopScopedFilter } from "../utils/shopScope.js";

const statusRank = {
    pending: 0,
    confirmed: 1,
    shipped: 2,
    inTransit: 3,
    outForDelivery: 4,
    delivered: 5,
    cancelled: -1,
    canceled: -1,
};

const globalStatusFromFulfillments = (fulfillments = [], fallback = "pending") => {
    if (!fulfillments.length) return fallback;
    if (fulfillments.every((item) => item.status === "delivered")) return "delivered";
    if (fulfillments.every((item) => ["cancelled", "canceled"].includes(item.status))) return "cancelled";
    const active = fulfillments.filter((item) => !["cancelled", "canceled"].includes(item.status));
    if (!active.length) return "cancelled";
    return active.reduce((latest, item) =>
        (statusRank[item.status] || 0) > (statusRank[latest] || 0) ? item.status : latest,
        active[0].status || fallback
    );
};

const filterOrderForShop = (order, user) => {
    if (user?.role !== "admin") return order;
    const shopId = String(user.shopId || user._id || "");
    const plain = typeof order.toObject === "function" ? order.toObject() : { ...order };
    const fulfillments = (plain.fulfillments || []).filter((item) => String(item.shopId) === shopId);
    const products = fulfillments.flatMap((item) => item.products || []);
    return {
        ...plain,
        fulfillments,
        products,
        shopIds: [shopId],
        totalAmount: fulfillments.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    };
};

const filterOrdersForShop = (orders, user) => {
    if (user?.role !== "admin") return orders;
    if (Array.isArray(orders)) return orders.map((order) => filterOrderForShop(order, user));
    if (orders?.docs) {
        return {
            ...orders,
            docs: orders.docs.map((order) => filterOrderForShop(order, user)),
        };
    }
    return orders;
};

// with pagination 
export const getOrder = async (req, res, next) => {
    try {
        const orders = await getPaginatedDataFilter(Order, req, { userId: req.userData._id }, {
            select: "userId products fulfillments shopIds totalAmount status shippingAddress courier tracking_number expectedDeliveryDate status_history paymentIntentId createdAt updatedAt",
        })
        res.status(200).json({
            status: "success",
            message: "Here are your orders...",
            orders,
        });
    } catch (error) {
        next({
            message: "Error while listing order",
            errorMessage: error.message,
        });
    }
};
// with pagination 
export const getAllOrders = async (req, res, next) => {
    try {
        const orders = await getPaginatedOrderData(Order, req, getShopScopedFilter(req.userData, "shopIds"))
        res.status(200).json({
            status: "success",
            message: "All orders are here!",
            orders: filterOrdersForShop(orders, req.userData),
        });
    } catch (error) {
        next({
            message: "Error while listing  All orders",
            errorMessage: error.message,
        });
    }
};
export const getAllOrdersNoPagination = async (req, res, next) => {
    try {
        const filter = req.userData?.role === "superadmin"
            ? {}
            : req.userData?.role === "admin"
                ? getShopScopedFilter(req.userData, "shopIds")
                : { userId: req.userData._id };
        const orders = await getAllOrderDB(filter)
        res.status(200).json({
            status: "success",
            message: "All orders are here!",
            orders: filterOrdersForShop(orders, req.userData),
        });
    } catch (error) {
        next({
            message: "Error while listing  All orders",
            errorMessage: error.message,
        });
    }
};
// with out pagination and collecting orders acc to the time Frame
export const getAllOrdersTimeFrame = async (req, res, next) => {
    try {
        console.log(req.query)
        const orders = await getOrdersForTimeFrame(
            req.query.startTime,
            req.query.endTime,
            getShopScopedFilter(req.userData, "shopIds")
        )

        console.log(orders)
        res.status(200).json({
            status: "success",
            message: "All orders are here!",
            orders: filterOrdersForShop(orders, req.userData),
        });
    } catch (error) {
        next({
            message: "Error while listing  All orders",
            errorMessage: error.message,
        });
    }
};

export const updateOrder = async (req, res, next) => {
    try {
        // Dummy courier and tracking number (simulate external API)
        const courier = "Australian Post";
        const tracking_number = "AU123456789";

        const { _id, status, shippingAddress, expectedDeliveryDate } = req.body;

        // Fetch the order
        const order = await getOneOrderDB(_id);
        if (!order) {
            return next({
                statusCode: 404,
                status: "fail",
                message: "Order not found",
            });
        }

        // Fetch the user for sending email
        const user = await findUserById(order?.userId);
        if (user) {
            user.password = "";
        }
        const canUpdateOrder =
            String(order.userId || "") === String(req.userData?._id || "") ||
            canAccessShopOwnedDoc(req.userData, order, "shopIds");
        if (!canUpdateOrder) {
            return next({
                statusCode: 403,
                message: "You can only update orders from your own shop or account.",
            });
        }

        if (req.userData?.role === "admin") {
            const shopId = String(req.userData.shopId || req.userData._id || "");
            const fulfillment = order.fulfillments?.find((item) => String(item.shopId) === shopId);
            if (!fulfillment) {
                return next({
                    statusCode: 403,
                    message: "This order does not contain fulfillment for your shop.",
                });
            }

            const nextStatus = status || fulfillment.status;
            const statusChanged = Boolean(status && status !== fulfillment.status);
            if (status) fulfillment.status = nextStatus;
            if (shippingAddress) order.shippingAddress = shippingAddress;
            if (expectedDeliveryDate) fulfillment.expectedDeliveryDate = expectedDeliveryDate;
            fulfillment.courier = courier;
            fulfillment.tracking_number = tracking_number;

            if (statusChanged) {
                fulfillment.status_history.push({
                    status: nextStatus,
                    date: new Date(),
                    description: `Shop fulfillment is "${nextStatus}"`,
                });
            }

            order.status = globalStatusFromFulfillments(order.fulfillments, order.status);
            order.courier = courier;
            order.tracking_number = tracking_number;
            if (statusChanged) {
                order.status_history.push({
                    status: order.status,
                    date: new Date(),
                    description: `Overall order is "${order.status}"`,
                });
            }

            const orderUpdated = await order.save();

            if (statusChanged && nextStatus !== "pending" && user?.email) {
                const emailObj = {
                    userName: user.fName + " " + user.lName,
                    email: user.email,
                    order: filterOrderForShop(orderUpdated, req.userData),
                };
                try {
                    await shipOrderEmail(emailObj);
                } catch (emailError) {
                    console.warn("Order fulfillment email failed:", emailError.message);
                }
            }

            return res.status(200).json({
                status: "success",
                message: "Shop fulfillment updated!",
                orderUpdated: filterOrderForShop(orderUpdated, req.userData),
                user,
            });
        }

        const nextStatus = status || order.status;
        const statusChanged = Boolean(status && status !== order.status);
        const updatePayload = {
            ...(status ? { status: nextStatus } : {}),
            ...(shippingAddress ? { shippingAddress } : {}),
            ...(expectedDeliveryDate ? { expectedDeliveryDate } : {}),
            courier,
            tracking_number,
        };

        if (statusChanged) {
            updatePayload.status_history = {
                status: nextStatus,
                date: new Date(),
                description: `Order is "${nextStatus}"`,
            };
        }

        // Update order with status, courier, tracking number, and append status_history
        const orderUpdated = await updateOrderDB(_id, updatePayload);

        // Send email notification if status is not pending
        if (statusChanged && nextStatus !== "pending" && user?.email) {
            const emailObj = {
                userName: user.fName + " " + user.lName,
                email: user.email,
                order: orderUpdated,
            };
            try {
                await shipOrderEmail(emailObj);
            } catch (emailError) {
                console.warn("Order status email failed:", emailError.message);
            }
        }

        res.status(200).json({
            status: "success",
            message: "Order updated!",
            orderUpdated,
            user,
        });
    } catch (error) {
        console.error("Error updating order:", error.message);
        return next({
            message: "Error while updating order!",
            errorMessage: error.message,
        });
    }
};

export const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await getOneOrderDB(id);
        if (!order) {
            return res.status(404).json({
                status: "error",
                message: "Order Not Found!"
            })
        }
        const canDeleteOrder =
            String(order.userId || "") === String(req.userData?._id || "") ||
            canAccessShopOwnedDoc(req.userData, order, "shopIds");
        if (!canDeleteOrder) {
            return next({
                statusCode: 403,
                message: "You can only delete orders from your own shop or account.",
            });
        }
        const user = await findUserById(order.userId)

        const response = await deleteOrderDB(id);

        if (!id) {
            return res.status(404).json({
                status: "error",
                message: "Order Not Found!"
            })
        }
        return res.status(200).json({
            status: "success",
            message: "Order Cancelled!",
            response, user
        })
    } catch (error) {
        next({
            message: "Error while deleting the order!",
            errorMessage: error.message,
        });
    }
}

export const deleteOrderItem = async (req, res, next) => {
    try {
        const { id, ID } = req.params;
        const response = await deleteOrderItemDB(id, ID);
        if (!response) {
            return res.status(404).json({
                status: "error",
                message: "Item Not Found!"
            })
        }
        const order = await getOneOrderDB(id)
        if (order.products.length <= 0) {
            await deleteOrderDB(id)
        }
        return res.status(200).json({
            status: "success",
            message: "Item Deleted Successfully!",
            response
        })
    } catch (error) {
        next({
            message: "Error while deleting the order!",
            errorMessage: error.message,
        });
    }
}

export const getSalesTimeFrame = async (req, res, next) => {
    try {
        console.log(req.query)
        const sales = await getSalesTimeFrameApi(
            req.query.startTime,
            req.query.endTime,
            req.query.granularity,
            getShopScopedFilter(req.userData, "shopIds")
        )

        console.log(sales)
        res.status(200).json({
            status: "success",
            message: "All sales are here!",
            sales,
        });
    } catch (error) {
        next({
            message: "Error while listing  All sales",
            errorMessage: error.message,
        });
    }
};

// export const createOrder = async (req, res, next) => {
//     try {
//         req.body.userId = req.userData._id;
//         console.log(req.userData)
//         req.body.status = "pending";
//         const order = await createOrderDB(req.body)

//         res.status(201).json({
//             status: "success",
//             message: "Finalised your order successfully...",
//             order,
//         });
//     } catch (error) {
//         return next({
//             message: "Error while creating order",
//             errorMessage: error.message,
//         });
//     }
// };
