
import cartSchema from "./cart.schema.js"
import CartSchema from "./cart.schema.js"

// finding if the cart exist already
export const findCart = (userId) => {
    return CartSchema.findOne({ userId })
}
// finding the product item in the existing cart
export const findProductInCart = (userId, _id) => {
    return CartSchema.findOne(
        {
            userId,
            cartItems: {
                $elemMatch: {
                    _id: _id
                }
            }
        })
}
// if there is a existing cart and item, then just update the quantity that is provided or update by 1 by default and also adds the cost price upon change in the quantity from the user prospective
export const findProductInCartAndAdd = (userId, product) => {
    return CartSchema.findOneAndUpdate({ userId, "cartItems._id": product._id }, { $inc: { "cartItems.$.quantity": product.quantity || 1, "cartItems.$.costPrice": product.costPrice } }, { new: true })
}
// if there is a existing cart but not the product then simply add it 
export const findCartAndAdd = (filter, obj) => {
    return CartSchema.findOneAndUpdate({ userId: filter },
        {
            $push:
                { cartItems: [obj] }
        },
        {
            new: true
        })
}
// checks if there is existing cart or not, if not creates and add the items
export const createCart = (filter, obj) => {
    return CartSchema.findOneAndUpdate(
        { userId: filter },
        {
            $push:
                { cartItems: [obj] }

        },
        {
            upsert: true,
            new: true
        }

    )
}
export const deleteCartItems = (userId, _id) => {
    return CartSchema.findOneAndUpdate(
        { userId },
        {
            $pull: {
                cartItems: {
                    _id: { $in: _id }
                }
            }
        },
        { new: true }
    )
}
export const getCartItemByProductId = (userId, _id) => {
    console.log(userId, _id, 4444)
    return CartSchema.findOne(
        { userId, "cartItems._id": _id },
        { "cartItems.$": 1 }
    )
}
export const updateCartItem = (userId, _id, product) => {
    return CartSchema.findOneAndUpdate({ userId, "cartItems._id": _id },
        {
            $set: {
                "cartItems.$.quantity": product.quantity,
                "cartItems.$.costPrice": product.costPrice
            }
        },
        { new: true })
}
export const deleteCart = (userId) => {
    return cartSchema.deleteOne({ userId }, { new: true })
}