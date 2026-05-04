import {
    findAuthSessionById,
    findAuthSessionByIdandDelete,
    findOTP,
    findOTPAndDelete,
    insertOTP,
} from "../models/sessions/auth.session.model.js";
import { getUserByEmail, updateUser } from "../models/users/user.model.js";
import { OTPemail } from "../services/email.service.js";
import { comparePassword, encryptPassword } from "../utils/bcrypt.js";

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyAndUpdatePw = async (req, res, next) => {
    try {
        const { email, Otp, password, confirmPassword } = req.body;

        if (!email || !Otp || !password || !confirmPassword) {
            return res.status(400).json({
                status: "error",
                message: "Email, OTP, password and confirm password are required.",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                status: "error",
                message: "Password and confirm password do not match.",
            });
        }

        const user = await getUserByEmail({ email });

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found.",
            });
        }

        const foundOtp = await findOTP({
            Otp: String(Otp),
            associate: email,
        });

        if (!foundOtp) {
            return res.status(400).json({
                status: "error",
                message: "Invalid or expired OTP.",
            });
        }

        const isPasswordSame = await comparePassword(password, user.password);

        if (isPasswordSame) {
            return res.status(400).json({
                status: "error",
                message: "New password cannot be the same as old password.",
            });
        }

        // Same encryption method used in registration
        const encryptedPassword = await encryptPassword(password);

        const updatedUser = await updateUser(
            { email },
            {
                password: encryptedPassword,
                refreshJWT: "",
            }
        );

        await findOTPAndDelete({
            Otp: String(Otp),
            associate: email,
        });

        updatedUser.password = "";
        updatedUser.refreshJWT = "";

        return res.status(200).json({
            status: "success",
            message: "Password has been changed successfully.",
            updatedUser,
        });
    } catch (error) {
        next({
            statusCode: 500,
            message: "Could not change the password.",
            errorMessage: error.message,
        });
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "error",
                message: "Email is required.",
            });
        }

        const user = await getUserByEmail({ email });

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User was not found.",
            });
        }

        if (!user.verified) {
            return res.status(400).json({
                status: "error",
                message: "Activate your account first.",
            });
        }

        req.userData = { email };
        next();
    } catch (error) {
        next({
            statusCode: 500,
            message: "User lookup failed.",
            errorMessage: error.message,
        });
    }
};

export const sendOTP = async (req, res, next) => {
    try {
        const email = req.userData.email;
        const user = await getUserByEmail({ email });

        const OTP = generateOTP();
        console.log(OTP, "OTP")

        // Remove old OTPs for this email before creating a new one
        await findOTPAndDelete({ associate: email });

        await insertOTP({
            Otp: OTP,
            associate: email,
        });

        await OTPemail({
            OTP,
            email,
            userName: user.fName,
        });

        return res.status(200).json({
            status: "success",
            message: "OTP has been sent successfully to your email.",
        });
    } catch (error) {
        next({
            statusCode: 500,
            errorMessage: error.message,
            message: "OTP could not be sent.",
        });
    }
};

export const verifyOTP = async (req, res, next) => {
    try {
        const { email, Otp } = req.body;

        if (!email || !Otp) {
            return res.status(400).json({
                status: "error",
                message: "Email and OTP are required.",
            });
        }

        const foundOtp = await findOTP({
            Otp: String(Otp),
            associate: email,
        });

        if (!foundOtp) {
            return res.status(400).json({
                status: "error",
                message: "Invalid or expired OTP.",
            });
        }

        // Do NOT delete OTP here.
        // It must still exist when password update happens.
        return res.status(200).json({
            status: "success",
            message: "OTP verified.",
        });
    } catch (error) {
        next({
            statusCode: 500,
            message: "Verification failed.",
            errorMessage: error.message,
        });
    }
};

export const verifyUser = async (req, res, next) => {
    try {
        const sessionId = req.query.sessionId;
        const token = req.query.t;

        if (!sessionId || !token) {
            return next({
                statusCode: 404,
                message: "Invalid verification link.",
                errorMessage: "No session ID or token.",
            });
        }

        const session = await findAuthSessionById(sessionId);

        if (!session || session.token !== token) {
            return next({
                statusCode: 404,
                message: "Invalid or expired session.",
                errorMessage: "Invalid or expired session.",
            });
        }

        const userEmail = session.associate;
        const user = await getUserByEmail({ email: userEmail });

        if (!user) {
            return next({
                statusCode: 404,
                message: "Verification failed.",
                errorMessage: "No user found with such email.",
            });
        }

        const updatedUser = await updateUser(
            { email: userEmail },
            { verified: true }
        );

        if (updatedUser) {
            await findAuthSessionByIdandDelete(sessionId);
        }

        return res.status(200).json({
            status: "success",
            message: "Verification successful.",
        });
    } catch (error) {
        next({
            statusCode: 500,
            message: "Verification failed.",
            errorMessage: error.message,
        });
    }
};