import OrderSchema from "./order.schema.js";

export const createOrderDB = (orderObj) => {
    return OrderSchema(orderObj).save();
};

export const getOrderDB = (filter) => {
    return OrderSchema.find(filter);
};

export const getAllOrderDB = () => {
    return OrderSchema.find({});
};

export const getOrdersForTimeFrame = (startTime, endTime) => {
    return OrderSchema.find({ createdAt: { $gte: new Date(startTime), $lt: new Date(endTime) } });
};

export const updateOrderDB = (_id, updateObj) => {
    // Separate the status_history from the rest
    const { status_history, ...rest } = updateObj;

    // Build the update object
    const updateQuery = { $set: rest };

    // If status_history exists, push new entries instead of overwriting
    if (status_history) {
        updateQuery.$push = { status_history: { $each: Array.isArray(status_history) ? status_history : [status_history] } };
    }

    return OrderSchema.findByIdAndUpdate(_id, updateQuery, {
        new: true,
        runValidators: true,
    });
};


export const getOneOrderDB = (id) => {
    return OrderSchema.findById(id);
};

export const deleteOrderDB = (_id) => {
    return OrderSchema.findByIdAndDelete(_id, { new: true })
}

export const deleteOrderItemDB = (_id, ID) => {
    return OrderSchema.findByIdAndUpdate(_id,
        {
            $pull: {
                products: { id: ID }
            }
        },
        { new: true })
}

export const getSalesTimeFrameApi = async (startTime, endTime, granularity) => {
    const dateFormats = {
        day: '%Y-%m-%d',
        week: '%Y-%U',
        month: '%Y-%m',
        year: '%Y',
    };

    // Validate granularity
    if (!dateFormats[granularity]) {
        return {
            status: 'error',
            message: 'Invalid granularity. Must be day, week, month, or year.',
            sales: [{ totalSales: 0, totalRevenue: 0, _id: '' }],
        };
    }

    try {
        // Validate input dates
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                status: 'error',
                message: 'Invalid startTime or endTime.',
                sales: [{ totalSales: 0, totalRevenue: 0, _id: '' }],
            };
        }

        const sales = await OrderSchema.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormats[granularity],
                            date: '$createdAt',
                        },
                    },
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    totalRevenue: 1,
                },
            },
        ]);

        return {
            status: 'success',
            message: 'Sales data retrieved successfully',
            sales: sales,
        };
    } catch (error) {
        console.error('Error in getSalesTimeFrameApi:', error);
        return {
            status: 'error',
            message: `Failed to fetch sales data: ${error.message}`,
            sales: [{ totalSales: 0, totalRevenue: 0, _id: '' }],
        };
    }
};