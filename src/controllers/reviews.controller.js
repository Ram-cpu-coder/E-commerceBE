
import { getSingleProduct, updateProductDB } from "../models/products/product.model.js";
import {
    deleteReview,
    getActiveReview,
    insertReview,
    updateReview,
} from "../models/reviews/review.model.js";
import Review from "../models/reviews/review.schema.js";
import { getPaginatedData, getPaginatedDataFilter } from "../utils/Pagination.js";

export const createReview = async (req, res, next) => {
    try {
        const { userId, productId, rating, comment } = req.body;
        console.log(typeof (productId))
        const product = await getSingleProduct(productId)
        const { email, fName, lName } = req.userData
        if (!product) {
            return next({
                statusCode: 404,
                message: "No such Product in Db"
            });
        }
        const { images, name } = product
        const reviewObj = {
            userId,
            userName: fName + " " + lName,
            email: email,
            userImage: "/default.png",
            productId,
            productName: name,
            productImage: images[0],
            rating,
            comment
        }
        const review = await insertReview(reviewObj);

        await updateProductDB(productId, {
            $push: { reviews: review._id }
        })

        if (!review._id) {
            return next({
                statusCode: 404,
                message: "Couldnot post your review!",
                errorMessage: "No Review Id, Error while creating the review",
            });
        } else {
            return res.status(200).json({
                status: "success",
                message: "Successfully, posted review!",
                review,
            });
        }
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal Error while creating the review!",
            errorMessage: error?.message,
        });
    }
};
// acc to the pagination 
export const getAllReviewsController = async (req, res, next) => {
    try {
        // const reviews = await getAllReview();
        const reviews = await getPaginatedData(Review, req)

        if (!reviews) {
            return next({
                statusCode: 404,
                message: "Couldnot fetch the reviews!",
                errorMessage: "No Reviews, Error while fetching the reviewas",
            });
        } else {
            return res.status(200).json({
                status: "success",
                message: "Successfully, fetched review!",
                reviews,
            });
        }
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal Error while fetching the review!",
            errorMessage: error?.message,
        });
    }
};
//  acc to the pagination
export const getPubReviews = async (req, res, next) => {
    try {
        const { productId } = req.query;

        // Build filter conditionally
        const filter = { approved: true };
        if (productId) {
            filter.productId = productId;
        }

        const reviews = await getPaginatedDataFilter(Review, req, filter)

        if (!reviews) {
            return next({
                statusCode: 404,
                message: "Couldnot fetch the reviews!",
                errorMessage: "No Reviews, Error while fetching the reviewas",
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Successfully, fetched review!",
            reviews,
        });

    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal Error while fetching the review!",
            errorMessage: error?.message,
        });
    }
};

export const updateReviewController = async (req, res, next) => {
    try {
        const { _id, approved } = req.body
        const update = await updateReview(_id, { approved })
        if (!update) {
            return next({
                statusCode: 404,
                message: "Couldnot update the review!",
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Successfully, updated review!",
            update,
        });
    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal Error while fetching the review!",
            errorMessage: error?.message,
        });
    }
}

export const deleteReviewController = async (req, res, next) => {
    try {
        const { id } = req.body
        const deletingReview = await deleteReview(id)
        return res.status(200).json({
            status: "success",
            message: "Successfully, deleted review!",
            deletingReview,
        });
    } catch (error) {
        console.log(error?.message)
        return next({
            statusCode: 500,
            message: "Internal Error while deleting the review!",
            errorMessage: error?.message,
        });
    }
}
// all the review for public no paginated data
export const getAllPubReviews = async (req, res, next) => {
    try {
        const reviews = await getActiveReview()
        if (!reviews) {
            return next({
                statusCode: 404,
                message: "Couldnot fetch the reviews!",
                errorMessage: "No Reviews, Error while fetching the reviewas",
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Successfully, fetched review!",
            reviews,
        });

    } catch (error) {
        return next({
            statusCode: 500,
            message: "Internal Error while fetching the review!",
            errorMessage: error?.message,
        });
    }
};
