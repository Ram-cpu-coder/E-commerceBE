import express from "express";
import {
    createProduct,
    deleteProduct,
    getActiveProduct,
    getAdminProductNoPagination,
    getAllProducts,
    getProductById,
    getPublicProducts,
    updateProduct,
    updateProductIndividually,
} from "../controllers/product.controller.js";
import { createProductValidator } from "../middlewares/joi.validation.js";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";
import upload from '../config/multer.config.js'

const router = express.Router();

// creating the product // uploading array of images max 4 // under name form field images 
router.post("/", upload.array("images", 4), createProductValidator, authenticate, isAdmin, createProduct);

// get All The Admin products
router.get("/admin", authenticate, isAdmin, getAdminProductNoPagination);
// getting all active products for the customer
router.get("/active", getPublicProducts);
// all the active products
router.get("/active-products", getActiveProduct)

router.get("/:id", getProductById)

// getting all the products --- for admin including inactive products
router.get("/", authenticate, isAdmin, getAllProducts);

// updating the product detail
router.put("/:id", upload.array("images", 4), authenticate, isAdmin, updateProduct);

// updating the product detail apart images 
router.put("/rating/:id", authenticate, updateProductIndividually);

// deleting the product
router.delete("/:id", authenticate, isAdmin, deleteProduct);

export default router;
