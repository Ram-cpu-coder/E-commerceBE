import express from "express";
import { sendOTP, verifyAndUpdatePw, verifyEmail, verifyOTP, verifyUser } from "../controllers/verifications.js";

const router = express.Router();

router.post("/", verifyAndUpdatePw);
router.post("/verifyEmail", verifyEmail, sendOTP)
router.post("/verify-otp", verifyOTP)
router.get("/", verifyUser)


export default router;
