import express from "express";
import {
  getAuditLogsController,
  getPlatformSettingsController,
  updatePlatformSettingsController,
} from "../controllers/platform.controller.js";
import { authenticate, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/settings", authenticate, isSuperAdmin, getPlatformSettingsController);
router.put("/settings", authenticate, isSuperAdmin, updatePlatformSettingsController);
router.get("/audit-logs", authenticate, isSuperAdmin, getAuditLogsController);

export default router;
