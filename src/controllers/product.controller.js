import {
  createNewPoductDB,
  deleteProductDB,
  getActivePoductsDB,
  getAllPoductsDB,
  getSingleProduct,
  updateProductDB,
} from "../models/products/product.model.js";
import Product from "../models/products/product.schema.js";
import { getPaginatedData, getPaginatedDataFilter } from "../utils/Pagination.js";

export const createProduct = async (req, res, next) => {
  try {
    const imageUrls = req.files?.map((file) => file.path);
    req.body.images = imageUrls;

    const product = await createNewPoductDB(req.body);

    if (product?._id) {
      return res.status(201).json({
        status: "success",
        message: "Product successfully created",
        newProduct: product,
      });
    }
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while adding the Product",
      errorMessage: error.message,
    });
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await getPaginatedData(Product, req);

    if (products) {
      return res.status(200).json({
        status: "success",
        message: "All products fetched",
        products,
      });
    }
    return res.status(400).json({
      status: "error",
      message: "No Products Listed!",
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while getting the Products",
      errorMessage: error.message,
    });
  }
};

export const getPublicProducts = async (req, res, next) => {
  try {
    const products = await getPaginatedDataFilter(Product, req, {
      status: "active",
    });

    return res.status(200).json({
      status: "success",
      message: "All products fetched",
      products: products ?? { docs: [], totalDocs: 0, page: 1 },
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while getting the Products",
      errorMessage: error.message,
    });
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await getSingleProduct(req.params.id);
    if (!product) {
      return next({
        statusCode: 404,
        status: "error",
        message: "Product Not Found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Fetched Product",
      product,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while getting the Products",
      errorMessage: error.message,
    });
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    let { oldImages, ...rest } = req.body;

    oldImages = JSON.parse(oldImages || "[]");
    const newImages = (req.files || []).map((file) => file.path);
    const allImages = [...oldImages, ...newImages];

    const updateObj = { ...rest, images: allImages };

    const updatedProduct = await updateProductDB(req.params.id, updateObj);

    if (updatedProduct?._id) {
      return res.json({
        status: "success",
        message: "Product updated successfully",
        updatedProduct,
      });
    }
    next({
      statusCode: 404,
      message: "Product not found",
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while updating the Product",
      errorMessage: error.message,
    });
  }
};

export const updateProductIndividually = async (req, res, next) => {
  try {
    const { ratings } = req.body;
    const data = await updateProductDB(req.params.id, { ratings });
    return res.status(200).json({
      status: "success",
      message: "Updated",
      data,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Error while updating the Product",
      errorMessage: error.message,
    });
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await deleteProductDB(req.params.id);

    if (deletedProduct?._id) {
      return res.json({
        status: "success",
        message: "Product deleted successfully",
        deletedProduct,
      });
    }
    return next({
      statusCode: 404,
      message: "Product not found",
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Error while deleting the Product",
      errorMessage: error.message,
    });
  }
};

export const getActiveProduct = async (req, res, next) => {
  try {
    const products = await getActivePoductsDB();
    return res.json({
      status: "success",
      message: "Product fetched successfully",
      products,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Error while fetching active products",
      errorMessage: error.message,
    });
  }
};

export const getAdminProductNoPagination = async (req, res, next) => {
  try {
    const products = await getAllPoductsDB();
    return res.json({
      status: "success",
      message: "Product fetched successfully",
      products,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Error while fetching products",
      errorMessage: error.message,
    });
  }
};
