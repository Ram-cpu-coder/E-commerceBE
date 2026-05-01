import express from "express";
import {
  deleteUserController,
  getAllUsersTimeFrame,
  getUserDetailController,
  logoutUserController,
  registerUserController,
  renewJwt,
  resendVerificationMail,
  signInUserController,
  updateUserController,
} from "../controllers/user.controller.js";
import { authenticate, isAdmin, refreshAuthenticate } from "../middlewares/auth.middleware.js";
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
router.get("/timeFrame", authenticate, isAdmin, getAllUsersTimeFrame);

//update user
router.put("/", authenticate, updateUserController);

//delete user
router.delete("/:_id", authenticate, isAdmin, deleteUserController);

// renew-jwt
router.get("/renew-jwt", refreshAuthenticate, renewJwt);

//logout
router.get("/logout", authenticate, logoutUserController);

// resending the verification Mail
router.post("/verification-email", resendVerificationMail)

export default router;
