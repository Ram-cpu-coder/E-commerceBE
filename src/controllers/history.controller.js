
import { getProductWithFilter } from "../models/products/product.model.js"
import { createUserHistory, getUserHistory, updateUserHistory } from "../models/userHistory/userHistoryModel.js"


export const getUserHistoryController = async (req, res, next) => {
    try {
        const { userId, guestSessionId } = req.body
        const userHistory = (userId != null) ? await getUserHistory({ userId }) : await getUserHistory({ guestSessionId })

        if (!userId && !guestSessionId) {
            return res.status(400).json({
                status: "error",
                message: "Missing something in req",
            })
        }
        return res.status(200).json({
            status: "success",
            message: "Fetched",
            userHistory
        })
    } catch (error) {
        console.log(error?.message, 2323)
        return next({
            statusCode: 500,
            message: error?.message || "Internal error",
            errorMessage: error.message,
        });
    }
}

export const getUserRecommendation = async (obj) => {

    const { userId, guestSessionId } = obj;
    const userHistory = (userId != null) ? await getUserHistory({ userId }) : await getUserHistory({ guestSessionId })
    return !!(userHistory && userHistory.length > 0);
}

export const createHistory = async (req, res, next) => {
    // console.log(req.body, "req")
    try {
        const { userId, guestSessionId, productId, categoryId, action } = req.body
        const dbData = await getUserRecommendation(req.body)
        const response = (dbData) ? await updateHistory(req.body) : await createUserHistory(req.body)

        if (!userId && !guestSessionId) {
            return res.status(400).json({
                status: "error",
                message: "Missing something in req",
            })
        }
        console.log(response)
        return res.status(200).json({
            status: "success",
            message: "added",
            response
        })
    } catch (error) {
        console.log(error?.message, 2323)
        return next({
            statusCode: 500,
            message: error?.message || "Internal error",
            errorMessage: error.message,
        });
    }
}

export const updateHistory = async (obj) => {

    const { userId, guestSessionId, productId, categoryId, action } = obj;
    const history = {
        productId,
        categoryId,
        action
    }
    const filter = userId != null ? { userId } : { guestSessionId }
    console.log(filter, "before being passed")
    if (!userId && !guestSessionId) {
        return res.status(400).json({
            status: "error",
            message: "No filter variable available",
        })
    }
    const response = await updateUserHistory(filter, history)
    console.log(response, "updated")
    return response
}

export const pickedProductsController = async (req, res, next) => {
    try {
        const clickedCategoryMap = {};
        const clickedProductSet = new Set()

        const { userId, guestSessionId } = req.body;

        const userHistory = (userId != null) ? await getUserHistory({ userId }) : await getUserHistory({ guestSessionId })

        if (!userHistory || !userHistory[0]?.history) {
            return res.status(404).json({
                status: "error",
                message: "No user history found",
            });
        }

        for (const { productId, categoryId } of userHistory[0].history) {
            clickedCategoryMap[categoryId] = (clickedCategoryMap[categoryId] || 0) + 1
            clickedProductSet.add(productId)
        }

        // sorting the categories acc to the count 
        const sortedCategories = Object.keys(clickedCategoryMap).sort((a, b) => clickedCategoryMap[b] - clickedCategoryMap[a])

        const recommendedProduct = [];

        const products = await Promise.all(sortedCategories.map(item => getProductWithFilter({ category: item, status: "active" })))

        const flatProducts = products.flat()

        const filteredProducts = await flatProducts.filter((item) => !clickedProductSet.has(item._id))

        recommendedProduct.push(...filteredProducts)

        // deduplication the product list 
        const uniqueProducts = Array.from(new Map(recommendedProduct.map(p => [p._id, p])).values())

        const top10Products = uniqueProducts.slice(0, 10)

        return res.status(200).json({
            status: "success",
            message: "Fetched history",
            sortedCategories,
            clickedProductSet: Array.from(clickedProductSet),
            top10Products
        })

    } catch (error) {
        console.log(error?.message, 2323)
        return next({
            statusCode: 500,
            message: error?.message || "Internal error",
            errorMessage: error.message,
        });
    }
} 