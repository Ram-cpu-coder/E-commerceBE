
import { createCart, deleteCart, deleteCartItems, findCart, findCartAndAdd, findProductInCart, findProductInCartAndAdd, getCartItemByProductId, updateCartItem } from "../models/cart/cart.model.js"
import { getSingleProduct } from "../models/products/product.model.js"

// creating the cart 
export const createCartController = async (req, res, next) => {
    try {
        const userId = req.userData._id
        // here _id is the productId
        const { _id, quantity } = req.body
        // checking if the user is signed in or not
        if (!userId) {
            return next({
                statusCode: 404,
                message: "Sign in please first!"
            })
        }
        // finding the detail of the product
        const productResponse = await getSingleProduct(_id);

        if (!productResponse || productResponse.status !== "active") {
            return next({
                statusCode: 404,
                message: "This product is not available right now."
            })
        }

        const requestedQuantity = Number(quantity || 1);
        const { price, stock } = productResponse;
        // console.log(costPrice)
        const product = {
            ...productResponse,
            quantity: requestedQuantity,
            price,
            totalAmount: price * requestedQuantity,
        }

        const existingCart = await findCart(userId)
        const existingItem = existingCart?.cartItems?.find((item) => String(item._id) === String(_id));
        const nextQuantity = (existingItem?.quantity || 0) + requestedQuantity;

        if (nextQuantity > stock) {
            return next({
                statusCode: 409,
                message: `${productResponse.name} has only ${stock} item${stock === 1 ? "" : "s"} available.`
            })
        }

        if (!existingCart) {
            const response = await createCart(userId, product)
            return res.status(200).json({
                status: "success",
                message: "Item added in Cart",
                response
            })

        }
        const itemExistsInCart = await findProductInCart(userId, _id)
        // if the item in the cart exists already, then we just add the quantity and calculate the cost price of total quantity 
        if (itemExistsInCart) {
            const response = await findProductInCartAndAdd(userId, product)
            return res.status(200).json({
                status: "success",
                message: "Items added in Cart",
                response
            })
        }
        const response = await findCartAndAdd(userId, product)
        return res.status(200).json({
            status: "success",
            message: "Item added successfully!",
            response
        })
    } catch (error) {
        next({
            statusCode: 500,
            message: error.message,
        })
    }
}
// deleting the single or multiple items from the cart 
export const deleteCartItemController = async (req, res, next) => {
    try {
        const userId = req.userData._id;
        const { _id } = req.body
        // finding the detail of the product
        const cart = await getCartItemByProductId(userId, _id)

        if (!cart?.cartItems?.[0]) {
            return next({
                statusCode: 404,
                message: "Item not found in the cart"
            })
        }

        // find the cart and delete the selected item
        const response = await deleteCartItems(userId, _id)
        if (!response) {
            return next({
                statusCode: 404,
                message: "Couldnot remove the item from the cart!",
                response
            })
        }

        return res.status(200).json({
            status: "success",
            message: "Item removed!",
            response
        })
    } catch (error) {
        next({
            statusCode: 500,
            message: error?.message,
        })
    }
}
//getting all the items in the cart 
export const fetchCart = async (req, res, next) => {
    try {
        const userId = req.userData._id
        const cart = await findCart(userId)
        return res.status(200).json({
            status: "success",
            message: "Cart fetched Successfully",
            cart
        })
    } catch (error) {
        next({
            statusCode: 500,
            message: error?.message,
        })
    }
}
// updating the cart items in the cart 
export const updateCartItems = async (req, res, next) => {
    try {
        const userId = req.userData._id
        const { quantity, _id, totalPrice } = req.body
        // const cart = await getCartItemByProductId(userId, _id)
        const productResponse = await getSingleProduct(_id);

        if (!productResponse || productResponse.status !== "active") {
            return next({
                statusCode: 404,
                message: "This product is not available right now."
            })
        }

        if (quantity === 0) {
            const response = await deleteCartItems(userId, _id);
            if (!response) {
                return next({
                    statusCode: 404,
                    message: `Could not remove item from the cart!`,
                    response
                });
            }

            return res.status(200).json({
                status: "success",
                message: "Item removed!",
                response
            })
        }

        if (quantity > productResponse.stock) {
            return next({
                statusCode: 409,
                message: `${productResponse.name} has only ${productResponse.stock} item${productResponse.stock === 1 ? "" : "s"} available.`
            })
        }

        const product = {
            quantity,
            totalAmount: productResponse.price * quantity
        }
        const response = await updateCartItem(userId, _id, product)
        return res.status(200).json({
            status: "success",
            message: "Updated Successfully",
            response
        })


    } catch (error) {
        console.log(error)
        next({
            statusCode: 500,
            message: "Internal Error",
            errorMessage: error?.message
        })
    }
}
// deleting the cart 
export const deleteCartController = async (req, res, next) => {
    try {
        const userId = req.userData._id

        const cartDeletion = await deleteCart(userId);
        if (!cartDeletion) {
            return res.status(400).json({
                status: "error",
                message: "Problem in removing the cart!"
            })
        }
        return res.status(200).json({
            status: "success",
            message: "Cart Removed",
            cartDeletion
        })
    } catch (error) {
        console.log(error)
        next({
            statusCode: 500,
            message: "Internal Error",
            errorMessage: error?.message
        })
    }
}
