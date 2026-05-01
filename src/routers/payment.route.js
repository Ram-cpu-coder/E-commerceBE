import express from "express";
import {
  createOrder,
  initiatePayment,
  stockHandling,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/checkout", authenticate, initiatePayment);

router.post("/verify-session", authenticate, createOrder);

router.get("/", authenticate, stockHandling)

export default router;

