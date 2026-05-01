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

// with pagination 
export const getOrder = async (req, res, next) => {
    try {
        const orders = await getPaginatedDataFilter(Order, req, { userId: req.userData._id })
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
        const orders = await getPaginatedOrderData(Order, req)
        res.status(200).json({
            status: "success",
            message: "All orders are here!",
            orders,
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
        const orders = await getAllOrderDB()
        res.status(200).json({
            status: "success",
            message: "All orders are here!",
            orders,
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
        const orders = await getOrdersForTimeFrame(req.query.startTime, req.query.endTime)

        console.log(orders)
        res.status(200).json({
            status: "success",
            message: "All orders are here!",
            orders,
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

        const { _id, status } = req.body;

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
        user.password = "";

        // Prepare a new status history entry
        const newStatusEntry = {
            status,
            date: new Date(),
            description: `Order is "${status}"`,
        };

        // Update order with status, courier, tracking number, and append status_history
        const orderUpdated = await updateOrderDB(_id, {
            status,
            courier,
            tracking_number,
            status_history: newStatusEntry,
        });

        // Send email notification if status is not pending
        if (status !== "pending") {
            const emailObj = {
                userName: user.fName + " " + user.lName,
                email: user.email,
                order: orderUpdated,
            };
            await shipOrderEmail(emailObj);
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
        const sales = await getSalesTimeFrameApi(req.query.startTime, req.query.endTime, req.query.granularity)

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