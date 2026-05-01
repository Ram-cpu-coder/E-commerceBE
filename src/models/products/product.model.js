// product.model.optimized.js
import ProductSchema from "./product.schema.js";

// Create a new product
export const createNewPoductDB = (newProductObj) => {
    return ProductSchema(newProductObj).save();
};

// Get all products (admin) with lean & select fields
export const getAllPoductsDB = () => {
    return ProductSchema.find()
        .select("name price status images category stock ratings createdAt updatedAt reviews")
        .populate({
            path: "reviews",
            select: "rating comment user createdAt", // only the fields frontend needs
        })
        .lean();
};


// Get all active products (public)
export const getActivePoductsDB = (limit = 20) => {
    return ProductSchema.find({ status: "active" })
        .select("name price images category ratings reviews")
        .populate({
            path: "reviews",
            select: "rating comment user createdAt", // pick only what FE needs
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};


// Get a single product by id (lean)
export const getSingleProduct = (id) => {
    return ProductSchema.findOne({ _id: id })
        .select("name price description images category stock ratings reviews")
        .populate({
            path: "reviews",
            select: "productId productName productImage userId email userName userImage rating comment approved createdAt", // specify fields to keep payload lean
        })
        .lean();
};

// Get products with filters (lean)
export const getProductWithFilter = (filter, limit = 20) => {
    return ProductSchema.find(filter)
        .select("name price images category ratings")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

// Update a product
export const updateProductDB = (id, updateObj) => {
    return ProductSchema.findByIdAndUpdate(id, updateObj, { new: true });
};

// Delete a product
export const deleteProductDB = (id) => {
    return ProductSchema.findByIdAndDelete(id);
};
