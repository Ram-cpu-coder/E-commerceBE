import express from "express";
import {
  createShopController,
  deleteShopController,
  getMyShopController,
  getPlatformOverviewController,
  getShopApplicationsController,
  getShopOverviewController,
  getShopsController,
  respondShopApplicationController,
  submitShopApplicationController,
  updateShopController,
} from "../controllers/shop.controller.js";
import { authenticate, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/applications", submitShopApplicationController);
router.get("/applications", authenticate, isSuperAdmin, getShopApplicationsController);
router.put("/applications/:id", authenticate, isSuperAdmin, respondShopApplicationController);
router.get("/platform-overview", authenticate, isSuperAdmin, getPlatformOverviewController);
router.get("/my-shop", authenticate, isAdmin, getMyShopController);
router.get("/", authenticate, isSuperAdmin, getShopsController);
router.get("/:id/overview", authenticate, isSuperAdmin, getShopOverviewController);
router.post("/", authenticate, isSuperAdmin, createShopController);
router.put("/:id", authenticate, isSuperAdmin, updateShopController);
router.delete("/:id", authenticate, isSuperAdmin, deleteShopController);

export default router;
