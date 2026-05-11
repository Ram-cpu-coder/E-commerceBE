import { findAuthSession, findAuthSessionAndDelete, insertAuthSession } from "../models/sessions/auth.session.model.js";
import { SessionSchema } from "../models/sessions/session.schema.js";
import {
  deleteUserById,
  findUserById,
  getUserByEmail,
  getUsersForTimeFrame,
  registerUserModel,
  updateUser,
} from "../models/users/user.model.js";
import { userActivatedEmail } from "../services/email.service.js";
import { comparePassword, encryptPassword } from "../utils/bcrypt.js";
import { jwtRefreshSign, jwtSign } from "../utils/jwt.js";
import { toPublicUser } from "../utils/userPublic.js";
import { v4 as uuidv4 } from "uuid";

const invalidCredentials = () => ({
  statusCode: 401,
  status: "error",
  message: "Invalid email or password.",
});

export const registerUserController = async (req, res, next) => {
  try {
    const { fName, lName, email, phone } = req.body;
    let { password } = req.body;
    password = await encryptPassword(password);

    const formObj = {
      fName,
      lName,
      email,
      phone,
      password,
    };
    const user = await registerUserModel(formObj);

    if (!user?._id) {
      return res.status(401).json({
        status: "error",
        message: "User Registration Failed!!!",
      });
    }
    const session = await insertAuthSession({
      token: uuidv4(),
      associate: user.email,
    });
    if (!session._id) {
      return res.status(400).json({
        status: "error",
        message: "Email sending failed! Registration aborted!",
      });
    }
    const url = `${process.env.ROOT_URL}/verify-user?sessionId=${session._id}&t=${session.token}`;

    let emailSent = true;
    try {
      await userActivatedEmail({
        email: user.email,
        userName: user.fName,
        url,
      });
    } catch (error) {
      emailSent = false;
      console.error("Activation email failed:", {
        message: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response,
      });
    }

    return res.status(201).json({
      status: "success",
      message: emailSent
        ? "Account created. Please check your email to activate your account."
        : "Account created, but activation email could not be sent. Please use resend verification.",
      user: toPublicUser(user),
      emailSent,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error in registration",
      errorMessage: error?.message,
    });
  }
};

export const signInUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail({ email });
    if (!user) {
      return next(invalidCredentials());
    }

    const isLogged = await comparePassword(password, user.password);
    if (!isLogged) {
      return next(invalidCredentials());
    }

    if (!user.verified) {
      return res.status(400).json({
        status: "error",
        message: "Your account is not Activated! Activate it First!",
      });
    }

    const tokenData = {
      email: user.email,
    };

    const token = await jwtSign(tokenData);
    const refreshToken = await jwtRefreshSign(tokenData);
    const obj = {
      refreshJWT: refreshToken,
    };
    await updateUser(
      {
        email: user.email,
      },
      obj
    );

    user.password = "";
    user.refreshJWT = "";

    req.userData = user;
    const userInfo = req.userData;
    return res.status(200).json({
      status: "success",
      message: "Logged in Successfully!!!",
      accessToken: token,
      refreshToken: refreshToken,
      userInfo,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Internal error!",
      errorMessage: error.message,
    });
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const obj = { ...req.body };
    const _id = req.userData._id;

    if (!_id) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    delete obj.password;
    delete obj.confirmPassword;
    delete obj.email;
    delete obj.role;
    delete obj.refreshJWT;

    const updatedUser = await updateUser(_id, obj);
    updatedUser?._id
      ? res.json({
          status: "success",
          message: "User updated successfully",
          updatedUser: toPublicUser(updatedUser),
        })
      : next({
          status: "error",
          message: "Could not update the user",
        });
  } catch (error) {
    next({
      statusCode: 500,
      status: "error",
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const { _id } = req.params;

    if (!_id) {
      return res
        .status(400)
        .json({ status: "error", message: "User ID is required" });
    }

    const deletedUser = await deleteUserById(_id);

    deletedUser?._id
      ? res.json({
          status: "success",
          message: "User deleted successfully",
          deletedUser,
        })
      : next({
          status: "error",
          message: "User not found",
        });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

export const getUserDetailController = async (req, res, next) => {
  try {
    const { email } = req.userData;
    const foundUser = await getUserByEmail({ email: email });

    if (!foundUser) {
      return next({
        statusCode: 404,
        message: "User Not Found!",
        errorMessage: "Check Id of user",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "User Found!",
      foundUser: toPublicUser(foundUser),
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

export const getAllUsersTimeFrame = async (req, res, next) => {
  try {
    const users = await getUsersForTimeFrame(
      req.query.startTime,
      req.query.endTime
    );

    res.status(200).json({
      status: "success",
      message: "All users are here!",
      users,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while listing all users",
      errorMessage: error.message,
    });
  }
};

export const renewJwt = async (req, res, next) => {
  try {
    const email = req.user.email;
    const token = await jwtSign({ email });

    return res.status(200).json({
      status: "success",
      message: "Token Refreshed",
      accessToken: token,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Could not refresh token",
      errorMessage: error.message,
    });
  }
};

export const logoutUserController = async (req, res) => {
  try {
    const user = req.userData;
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "No User found!",
      });
    }

    const dbUser = await findUserById(user._id);

    if (!dbUser) {
      return res.status(400).json({
        status: "error",
        message: "User not found",
      });
    }

    dbUser.refreshJWT = "";
    await dbUser.save({ validateBeforeSave: false });

    await SessionSchema.deleteMany({ associate: dbUser.email });

    return res.status(200).json({
      status: "success",
      message: "logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

export const resendVerificationMail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail({ email });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "No user with such email",
      });
    }

    if (user.verified) {
      return res.status(200).json({
        status: "success",
        message: "Your Account is already Verified!",
        user: toPublicUser(user),
      });
    }
    const authSessionExisting = await findAuthSession({ associate: email });

    if (authSessionExisting) {
      await findAuthSessionAndDelete({ associate: email });
    }

    const session = await insertAuthSession({
      token: uuidv4(),
      associate: email,
    });
    if (!session._id) {
      return res.status(400).json({
        status: "error",
        message: "Email sending failed! Verification process aborted!",
      });
    }
    const url = `${process.env.ROOT_URL}/verify-user?sessionId=${session._id}&t=${session.token}`;

    await userActivatedEmail({
      email: user.email,
      userName: user.fName,
      url,
    });

    return res.status(200).json({
      status: "success",
      message: "Please check your email to activate your account!",
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};
