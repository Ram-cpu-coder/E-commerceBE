import express from "express";
import {
    deleteCategoryController,
    getCategoryController,
    insertCategoryController,
    updateCategoryController,
} from "../controllers/catrgories.controller.js";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";
import upload from "../config/multer.config.js";

const router = express.Router();

// these are all for the admin level

router.get("/",getCategoryController)

// creating a category
router.post(
  "/",
  authenticate,
  isAdmin,
  upload.fields([
    { name: "categoryImage", maxCount: 1 },
    { name: "featureImage", maxCount: 1 },
  ]),
  insertCategoryController
);

// updating a category
router.put(
  "/:_id",
  authenticate,
  isAdmin,
  upload.fields([
    { name: "newCategoryImage", maxCount: 1 },
    { name: "newFeatureImage", maxCount: 1 },
  ]),
  updateCategoryController
);

// deleting a category
router.delete("/delete/:_id", authenticate, isAdmin, deleteCategoryController);

export default router;
