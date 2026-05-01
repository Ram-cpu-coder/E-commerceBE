import { createWishList, deleteWholeWishList, deleteWishList, getWishList } from "../models/wishList/wishList.model.js"

export const createWishListController = async (req, res, next) => {
    try {
        const userId = req.userData._id
        console.log(userId)

        const obj = req.body

        const data = await createWishList({ userId, ...obj })
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "Please Log in!"
            })
        }

        return res.status(200).json({
            status: "success",
            message: "Added item in WishList",
            data
        })
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal server error",
            errorMessage: error?.message,
        });
    }
}

export const fetchWishList = async (req, res, next) => {
    try {
        const userId = req.userData._id
        const data = await getWishList({ userId })
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "Please Log in!"
            })
        }

        return res.status(200).json({
            status: "success",
            message: "WishList Fetched",
            data
        })
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal server error",
            errorMessage: error?.message,
        });
    }
}

export const deleteWishListController = async (req, res, next) => {
    try {
        const { id } = req.params
        const data = await deleteWishList({ _id: id })
        if (!id) {
            return res.status(400).json({
                status: "error",
                message: "No id provided"
            })
        }
        return res.status(200).json({
            status: "success",
            message: "Removed Successfully!",
            data
        })
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal server error",
            errorMessage: error?.message,
        });
    }
}

export const deleteWholeWishListController = async (req, res, next) => {
    try {
        const userId = req.userData._id;
        const data = await deleteWholeWishList({ userId })
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "Please Log in"
            })
        }
        return res.status(200).json({
            status: "success",
            message: "Removed Successfully",
            data
        })
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal server error",
            errorMessage: error?.message,
        });
    }
}