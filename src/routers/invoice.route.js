import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { createInvoiceController } from "../controllers/invoice.controller.js";


const router = express.Router()

router.get("/:id", authenticate, createInvoiceController)

export default router;