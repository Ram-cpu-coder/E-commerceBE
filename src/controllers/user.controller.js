import { findAuthSession, findAuthSessionAndDelete, insertAuthSession } from "../models/sessions/auth.session.model.js";
import { SessionSchema } from "../models/sessions/session.schema.js";
import {
  deleteUserById,
  findUserById,
  getAdminAccessRequests,
  getAllUsers,
  getUserByEmail,
  getUsersForTimeFrame,
  registerUserModel,
  updateUser,
} from "../models/users/user.model.js";
import { userActivatedEmail } from "../services/email.service.js";
import { comparePassword, encryptPassword } from "../utils/bcrypt.js";
import { jwtRefreshSign, jwtSign } from "../utils/jwt.js";
import { getUserShopId, getUserShopName, isSuperAdminUser } from "../utils/shopScope.js";
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
    delete obj.shopId;
    delete obj.shopIds;
    delete obj.shopName;
    delete obj.refreshJWT;

    if (req.file?.path) {
      obj.image = req.file.path;
    }

    const updatedUser = await updateUser({ _id }, obj);
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

export const updateUserByAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.userData;
    const obj = { ...req.body };

    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
    }

    const targetUser = await findUserById(id);
    if (!targetUser) {
      return next({ statusCode: 404, message: "User not found" });
    }

    const isSuperAdmin = actor?.role === "superadmin";
    const isAdminEditingCustomer =
      actor?.role === "admin" &&
      targetUser.role === "customer" &&
      (targetUser.shopIds || []).map(String).includes(String(getUserShopId(actor)));

    if (!isSuperAdmin && !isAdminEditingCustomer) {
      return next({
        statusCode: 403,
        message: "Admins can only update customer accounts.",
      });
    }

    delete obj.password;
    delete obj.confirmPassword;
    delete obj.email;
    delete obj.role;
    delete obj.refreshJWT;
    delete obj.adminRequest;

    const allowedFields = ["fName", "lName", "phone", "verified"];
    const updateObj = allowedFields.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});

    const updatedUser = await updateUser({ _id: id }, updateObj);

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      user: toPublicUser(updatedUser),
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

export const updateUserRoleController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, shopName } = req.body;
    const allowedRoles = ["admin", "customer"];

    if (!allowedRoles.includes(role)) {
      return next({
        statusCode: 400,
        message: "Role must be admin or customer.",
      });
    }

    if (String(req.userData?._id) === String(id)) {
      return next({
        statusCode: 400,
        message: "You cannot change your own Super Admin role.",
      });
    }

    const targetUser = await findUserById(id);
    if (!targetUser) {
      return next({ statusCode: 404, message: "User not found" });
    }

    if (targetUser.role === "superadmin") {
      return next({
        statusCode: 403,
        message: "Super Admin accounts cannot be changed here.",
      });
    }

    const nextShopId =
      role === "admin" ? targetUser.shopId || String(targetUser._id) : "";
    const nextShopName =
      role === "admin"
        ? shopName || targetUser.shopName || getUserShopName(targetUser)
        : "";

    const updatedUser = await updateUser(
      { _id: id },
      {
        role,
        shopId: nextShopId,
        shopName: nextShopName,
        adminRequest: {
          status: role === "admin" ? "approved" : "rejected",
          message: targetUser.adminRequest?.message || "",
          requestedAt: targetUser.adminRequest?.requestedAt || null,
          respondedAt: new Date(),
          responseMessage:
            role === "admin"
              ? "Role updated to admin by Super Admin."
              : "Role updated to customer by Super Admin.",
        },
      }
    );

    return res.status(200).json({
      status: "success",
      message: `User role updated to ${role}.`,
      user: toPublicUser(updatedUser),
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

    if (String(req.userData?._id) === String(_id)) {
      return res
        .status(400)
        .json({ status: "error", message: "You cannot delete your own account" });
    }

    const targetUser = await findUserById(_id);
    if (!targetUser) {
      return next({
        status: "error",
        message: "User not found",
      });
    }

    const isSuperAdmin = req.userData?.role === "superadmin";
    const isAdminDeletingCustomer =
      req.userData?.role === "admin" &&
      targetUser.role === "customer" &&
      (targetUser.shopIds || []).map(String).includes(String(getUserShopId(req.userData)));

    if (targetUser.role === "superadmin" || (!isSuperAdmin && !isAdminDeletingCustomer)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to delete this user",
      });
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
    const shopId = getUserShopId(req.userData);
    const filter = isSuperAdminUser(req.userData) ? {} : { shopIds: shopId };
    const users = await getUsersForTimeFrame(
      req.query.startTime,
      req.query.endTime,
      filter
    );

    res.status(200).json({
      status: "success",
      message: "All users are here!",
      users: users.map(toPublicUser),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while listing all users",
      errorMessage: error.message,
    });
  }
};

export const getAllUsersController = async (req, res, next) => {
  try {
    const shopId = getUserShopId(req.userData);
    const filter = isSuperAdminUser(req.userData)
      ? {}
      : { $or: [{ shopIds: shopId }, { shopId }] };
    const users = await getAllUsers(filter);

    res.status(200).json({
      status: "success",
      message: "All users are here!",
      users: users.map(toPublicUser),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while listing all users",
      errorMessage: error.message,
    });
  }
};

export const requestAdminAccessController = async (req, res, next) => {
  try {
    const user = await findUserById(req.userData._id);
    if (!user) {
      return next({ statusCode: 404, message: "User not found" });
    }

    if (user.role === "admin" || user.role === "superadmin") {
      return res.status(200).json({
        status: "success",
        message: "Your account already has Shop Admin or Super Admin access.",
        user: toPublicUser(user),
      });
    }

    const updatedUser = await updateUser(
      { _id: user._id },
      {
        adminRequest: {
          status: "pending",
          message: req.body?.message || "",
          requestedAt: new Date(),
          respondedAt: null,
          responseMessage: "",
        },
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Shop Admin access request sent to Super Admin.",
      user: toPublicUser(updatedUser),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while requesting admin access",
      errorMessage: error.message,
    });
  }
};

export const getAdminAccessRequestsController = async (req, res, next) => {
  try {
    const users = await getAdminAccessRequests();
    res.status(200).json({
      status: "success",
      message: "Shop Admin access requests listed.",
      users: users.map(toPublicUser),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while listing admin access requests",
      errorMessage: error.message,
    });
  }
};

export const respondAdminAccessRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, responseMessage = "" } = req.body;
    const isApproved = decision === "approved";
    const isRejected = decision === "rejected";

    if (!isApproved && !isRejected) {
      return next({
        statusCode: 400,
        message: "Decision must be approved or rejected.",
      });
    }

    const requestUser = await findUserById(id);
    if (!requestUser) {
      return next({ statusCode: 404, message: "User not found" });
    }

    const updatedUser = await updateUser(
      { _id: id },
      {
        ...(isApproved
          ? {
              role: "admin",
              shopId: requestUser.shopId || String(requestUser._id),
              shopName: requestUser.shopName || getUserShopName(requestUser),
            }
          : {}),
        adminRequest: {
          status: decision,
          message: requestUser.adminRequest?.message || "",
          requestedAt: requestUser.adminRequest?.requestedAt,
          respondedAt: new Date(),
          responseMessage,
        },
      }
    );

    res.status(200).json({
      status: "success",
      message: isApproved ? "Shop Admin access approved." : "Shop Admin access rejected.",
      user: toPublicUser(updatedUser),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while responding to admin access request",
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
