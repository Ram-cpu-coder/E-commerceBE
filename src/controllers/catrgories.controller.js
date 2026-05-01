import {
  createCategoryModel,
  deleteCategoryModel,
  getCategoriesDB,
  updatingCategoryModel,
} from "../models/categories/category.model.js";

// creating the category
export const insertCategoryController = async (req, res, next) => {
  try {
    const obj = { ...req.body };

    // Handle file uploads
    if (req.files?.categoryImage?.[0]?.path) {
      obj.categoryImage = req.files.categoryImage[0].path;
    }

    if (req.files?.featureImage?.[0]?.path) {
      obj.featureImageUrl = req.files.featureImage[0].path;
    }

    const categoryData = await createCategoryModel(obj);

    if (!categoryData._id) {
      return next({
        statusCode: 401,
        message: "Error! Could not create the category.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Successfully created a Category",
      categoryData,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: error?.message || "Internal error in creating the category",
      errorMessage: error.message,
    });
  }
};

// fetching the category
export const getCategoryController = async (req, res, next) => {
  try {
    const categories = await getCategoriesDB();

    if (!categories) {
      next({
        statusCode: 401,
        message: "Error getting categories",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "all categories here",
      categories,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: error?.message || "Internal error in fetching the category",
      errorMessage: error.message,
    });
  }
};

// updating the category
export const updateCategoryController = async (req, res, next) => {
  try {
    const { _id } = req.params;

    if (!_id) {
      return next({
        statusCode: 400,
        message: "Category Id is required!",
        errorMessage: "Category id is not received!",
      });
    }

    const updateObj = { ...req.body };

    // Handle uploaded files
    if (req.files?.newCategoryImage?.[0]?.path) {
      updateObj.categoryImage = req.files.newCategoryImage[0].path;
    }

    if (req.files?.newFeatureImage?.[0]?.path) {
      updateObj.featureImageUrl = req.files.newFeatureImage[0].path;
    }

    const updatedCategory = await updatingCategoryModel(_id, updateObj);

    if (!updatedCategory) {
      return next({
        statusCode: 404,
        message: "Could not update the category! Category ID may be wrong.",
        errorMessage: "Category not updated.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Successfully updated the category.",
      updatedCategory,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message:
        error?.message || "Internal server error while updating category.",
      errorMessage: error.message,
    });
  }
};

// deleting the category
export const deleteCategoryController = async (req, res, next) => {
  try {
    const { _id } = req.params;
    if (!_id) {
      return res.status(400).json({ message: "Category ID is required" });
    }
    console.log(_id);
    const deletedCategory = await deleteCategoryModel(_id);
    console.log(deletedCategory);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({
      status: "success",
      message: "Deleted Successfully!",
      deletedCategory,
    });
  } catch (error) {
    console.log(error);
    next({
      statusCode: 500,
      message: error?.message || "Internal error in deleting the category",
      errorMessage: error?.message,
    });
  }
};
