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
import { v4 as uuidv4 } from "uuid";

// registering the new user
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

    // console.log(user, 333);
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
    // email
    let emailSent = true;

    try {
      await userActivatedEmail({
        email: user.email,
        userName: user.fName,
        url,
      });
    } catch (error) {
      emailSent = false;
      console.error("Activation email failed:", error.message);
    }

    return res.status(201).json({
      status: "success",
      message: emailSent
        ? "Account created. Please check your email to activate your account."
        : "Account created, but activation email could not be sent. Please use resend verification.",
      user,
      emailSent,
    });

    return res.status(200).json({
      status: "success",
      message:
        "Your account has been created successfully. Please check your email to activate your account!",
      user,
    });
  } catch (error) {
    console.log(error);
    next({
      statusCode: 500,
      message: "Error in registiration",
      errorMessage: error?.message,
    });
  }
};

// logging the user
export const signInUserController = async (req, res, next) => {
  try {
    // taking the payload from the req.body
    const { email, password } = req.body;
    // finding the user
    const user = await getUserByEmail({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Couldnot find the user!",
      });
    } else {
      // comparing the password or say checking if the user's password matches with the password stored in database
      const isLogged = await comparePassword(password, user.password);
      if (!isLogged) {
        return res.status(404).json({
          status: "error",
          message: "Wrong Password!",
        });
      }

      if (user.verified) {
        // token data for creating accessToken and refreshToken
        const tokenData = {
          email: user.email,
        };

        const token = await jwtSign(tokenData);
        const refreshToken = await jwtRefreshSign(tokenData);
        const obj = {
          refreshJWT: refreshToken,
        }
        const data = await updateUser(
          {
            email: user.email,
          },
          obj
        );

        // removing the sensitive user data
        user.password = "";
        user.refreshJWT = "";

        if (isLogged) {
          req.userData = user;
          const userInfo = req.userData
          return res.status(200).json({
            status: "success",
            message: "Logged in Successfully!!!",
            accessToken: token,
            refreshToken: refreshToken,
            userInfo,
          });
        } else {
          return res.status(400).json({
            status: "error",
            message: "Ceredentials not matched!!!",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          message: "Your account is not Activated! Activate it First!",
        });
      }
    }
  } catch (error) {
    console.log(error);
    next({
      statusCode: 500,
      message: "Internal error!",
      errorMessage: error.message,
    });
  }
};

//edit the user
export const updateUserController = async (req, res, next) => {
  try {
    const obj = req.body;
    const _id = req.userData._id

    if (!_id) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const updatedUser = await updateUser(_id, obj);
    updatedUser?._id
      ? res.json({
        status: "success",
        message: "User updated successfully",
        updatedUser,
      })
      : next({
        status: "error",
        message: "Couldnot Update the user",
      });
  } catch (error) {
    console.log(error);
    next({
      status: "error",
      message: "Internal server error",
    });
  }
};

// delete the user
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
    console.log(error);
    return next({
      statusCode: 500,
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

// //get user detail
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
      foundUser,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

// with out pagination and collecting users acc to the time Frame
export const getAllUsersTimeFrame = async (req, res, next) => {
  try {
    const users = await getUsersForTimeFrame(req.query.startTime, req.query.endTime)

    res.status(200).json({
      status: "success",
      message: "All users are here!",
      users,
    });
  } catch (error) {
    next({
      message: "Error while listing all users",
      errorMessage: error.message,
    });
  }
};

// renew jwt
export const renewJwt = async (req, res, next) => {
  try {
    const email = req.user.email
    console.log("here", email)
    // recreate the access token
    const token = await jwtSign({ email });

    return res.status(200).json({
      status: "success",
      message: "Token Refreshed",
      accessToken: token,
    });
  } catch (error) {
    console.log(error.message, "error in renew jwt")
    next({
      errorMessage: error.message
    })
  }

};

//logout user
export const logoutUserController = async (req, res) => {
  try {
    const user = req.userData;
    console.log(user, "user for logout")
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

    // remove the refresh token from the user email
    dbUser.refreshJWT = "";
    await dbUser.save({ validateBeforeSave: false });

    //delete the session from the database associated with user email
    await SessionSchema.deleteMany({ associate: dbUser.email });

    return res.status(200).json({
      status: "success",
      message: "logged out successfully",
    });
  } catch (error) {
    console.log(error?.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
};

export const resendVerificationMail = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await getUserByEmail({ email })

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "No user with such email"
      })
    }

    if (user.verified) {
      return res.status(200).json({
        status: "success",
        message:
          "Your Account is already Verified!",
        user,
      });
    }
    const authSessionExisting = await findAuthSession({ associate: email })

    if (authSessionExisting) {
      await findAuthSessionAndDelete({ associate: email })
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

    const activationEmail = await userActivatedEmail({
      email: user.email,
      userName: user.fName,
      url,
    });

    return res.status(200).json({
      status: "success",
      message:
        "Please check your email to activate your account!",
      user,
    });
  } catch (error) {
    console.log(error?.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      errorMessage: error?.message,
    });
  }
}