
import express from "express"
import { createWishListController, deleteWholeWishListController, deleteWishListController, fetchWishList } from "../controllers/wishList.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router()
router.post("/", authenticate, createWishListController)
router.get("/", authenticate, fetchWishList)
router.delete("/:id", authenticate, deleteWishListController)
router.delete("/", authenticate, deleteWholeWishListController)

export default router;