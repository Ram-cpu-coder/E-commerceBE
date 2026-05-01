import express from "express"
import { createHistory, getUserHistoryController, pickedProductsController } from "../controllers/history.controller.js"

const router = express.Router()

router.post("/", createHistory)
router.get("/", getUserHistoryController)
router.get("/recommendation", pickedProductsController)

export default router