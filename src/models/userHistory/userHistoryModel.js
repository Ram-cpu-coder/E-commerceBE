import UserBehaviour from "./userHistorySchema.js";

export const createUserHistory = async ({ userId, guestSessionId, productId, categoryId, action }) => {
    try {
        const payload = {
            history: [
                {
                    productId,
                    categoryId,
                    action
                }
            ]
        };

        if (userId != null) payload.userId = userId;
        if (guestSessionId != null) payload.guestSessionId = guestSessionId;

        console.log(payload, "creating");

        return await UserBehaviour(payload).save();
    } catch (error) {
        console.log(error?.message, "error while creating user history");
        throw error;
    }
};


// user history
export const getUserHistory = (filter) => {
    console.log(filter, "getting the user")
    return UserBehaviour.find(filter).sort({ createdAt: -1 })
}

export const updateUserHistory = (filter, {
    productId,
    categoryId,
    action
}) => {
    try {
        return UserBehaviour.findOneAndUpdate(
            filter,
            {
                $push:
                {
                    history:
                    {
                        productId,
                        categoryId,
                        action
                    }
                }
            },
            {
                upsert: true,
                new: true
            })
    } catch (error) {
        console.log(error?.message)
    }

}