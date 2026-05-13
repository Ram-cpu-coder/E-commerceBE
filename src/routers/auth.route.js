import express from "express";
import {
  deleteUserController,
  getAdminAccessRequestsController,
  getAllUsersController,
  getAllUsersTimeFrame,
  getUserDetailController,
  logoutUserController,
  registerUserController,
  renewJwt,
  requestAdminAccessController,
  resendVerificationMail,
  respondAdminAccessRequestController,
  signInUserController,
  updateUserByAdminController,
  updateUserController,
  updateUserRoleController,
} from "../controllers/user.controller.js";
import { authenticate, isAdmin, isSuperAdmin, refreshAuthenticate } from "../middlewares/auth.middleware.js";
import upload from "../config/multer.config.js";
import {
  createUserValidator,
  singinUserValidator,
} from "../middlewares/joi.validation.js";

const router = express.Router();

// routers

// registering the user
router.post("/register", createUserValidator, registerUserController);

// signing the user
router.post("/signin", singinUserValidator, signInUserController);

// get user detail
router.get("/", authenticate, getUserDetailController);

// get users
router.get("/users", authenticate, isAdmin, getAllUsersController);
router.get("/timeFrame", authenticate, isAdmin, getAllUsersTimeFrame);

// admin access request flow
router.post("/admin-request", authenticate, requestAdminAccessController);
router.get("/admin-requests", authenticate, isSuperAdmin, getAdminAccessRequestsController);
router.put("/admin-requests/:id", authenticate, isSuperAdmin, respondAdminAccessRequestController);

//update user
router.put("/", authenticate, upload.single("image"), updateUserController);
router.put("/users/:id", authenticate, isAdmin, updateUserByAdminController);
router.put("/users/:id/role", authenticate, isSuperAdmin, updateUserRoleController);

//delete user
router.delete("/:_id", authenticate, isAdmin, deleteUserController);

// renew-jwt
router.get("/renew-jwt", refreshAuthenticate, renewJwt);

//logout
router.get("/logout", authenticate, logoutUserController);

// resending the verification Mail
router.post("/verification-email", resendVerificationMail)

export default router;
