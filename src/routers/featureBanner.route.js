import express from 'express'
import { createFeatureBannerController, deleteFeatureBannerController, fetchFeatureBannerController, updateFeatureBannerController } from '../controllers/featureBanner.controller.js'
import { authenticate, isAdmin } from '../middlewares/auth.middleware.js'
import upload from '../config/multer.config.js'

const router = express.Router()

router.get("/", fetchFeatureBannerController)
router.post("/", authenticate, isAdmin, upload.single("featureBannerImgUrl"), createFeatureBannerController)
router.delete("/:id", authenticate, isAdmin, deleteFeatureBannerController)
router.put("/:id", authenticate, isAdmin, upload.single("featureBannerImgUrl"), updateFeatureBannerController)

export default router