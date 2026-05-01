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

export const verifyAndUpdatePw = async (req, res, next) => {
    try {
        const { email, Otp, password, confirmPassword } = req.body
        console.log(req.body)

        if (password !== confirmPassword) {
            return next({
                statusCode: 404,
                message: "Password and Confirm Password didnt match !!!",
                errorMessage: "Password and Confirm Password didnt match!",
            });
        }
        const user = await getUserByEmail({ email: email })
        console.log(user, "user")
        const isPasswordSame = await comparePassword(password, user.password)
        if (isPasswordSame) {
            return res.status(404).json({
                status: "error",
                message: "Old Password!"
            })
        }
        console.log(isPasswordSame, 57)

        const encryptedPassword = await encryptPassword(password);

        // console.log(encrypting, "encrypted")

        const FoundOtp = await findOTP({ Otp: Otp })
        console.log(FoundOtp)
        if (FoundOtp.associate === email) {
            const updateUserData = await updateUser({ email: email }, {
                password: encryptedPassword
            })
            await findOTPAndDelete({ Otp: Otp })
        }

        return res.status(200).json({
            status: "success",
            message: "Password has been changed !"
        });
    } catch (error) {
        next({
            statusCode: 500,
            message: "Could not change the password!",
            errorMessage: error.message,
        });
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const user = await getUserByEmail(req.body)
        req.userData = req.body
        if (!user) {
            return res.status(400).json({
                status: "error",
                message: "User is not Found!"
            })
        }
        if (user.verified === false) {
            return res.status(404).json({
                status: "error",
                message: "Activate your account first!"
            })
        }

        next()
    } catch (error) {
        next({
            statusCode: 500,
            message: "User not Found!",
            errorMessage: error.message,
        });
    }
}

export const sendOTP = async (req, res, next) => {
    try {
        const generateRandomNumber = () => {
            const string = "1234567890"
            const len = 6;
            let Otp = ""
            for (let i = 1; i <= len; i++) {
                const randomIndex = Math.floor(Math.random() * string.length)
                Otp += string[randomIndex]
            }
            return Otp;
        }

        const OTP = generateRandomNumber();
        const email = req.userData.email;
        const user = await getUserByEmail({ email: email })
        const userName = user.fName;
        await insertOTP({ Otp: OTP, associate: email });
        const obj = {
            OTP,
            email,
            userName
        }
        const data = await OTPemail(obj)
        return res.status(200).json({
            status: "success",
            message: "OTP has been sent successfully to your email!"
        })
    } catch (error) {
        next({
            statusCode: 500,
            errorMessage: error.message,
            message: "OTP could not be sent!"
        })
    }
}

// verifying the OTP 
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, Otp } = req.body
        const foundOtp = await findOTP({ Otp: Otp })
        // console.log(foundOtp.associate)
        // console.log(email)
        if (!foundOtp) {
            next({
                statusCode: 400,
                message: "Invalid OTP!"
            })
        }
        if (foundOtp.associate !== email) {
            return res.status(404).json({
                status: "error",
                message: "Invalid OTP!"
            })
        }

        await findOTPAndDelete(req.body)


        return res.status(200).json({
            status: "success",
            message: "OTP verified!"
        })

    } catch (error) {
        next({
            statusCode: 500,
            message: "Verification failed",
            errorMessage: error.message,
        });
    }
}

export const verifyUser = async (req, res, next) => {
    try {
        const sessionId = req.query.sessionId;
        const token = req.query.t;

        console.log(sessionId, token)
        if (!sessionId || !token) {
            return next({
                statusCode: 404,
                message: "Invalid verification Link !!!",
                errorMessage: "No Session Id or No token",
            });
        }

        const session = await findAuthSessionById(sessionId);

        console.log(session)

        if (!session || session.token !== token) {
            return next({
                statusCode: 404,
                message: "Invalid or expired session !!!",
                errorMessage: "Invalid or expired session !!!",
            });
        }

        // marking the user as verified
        const userEmail = session.associate;
        // find the user
        const user = await getUserByEmail({ email: userEmail });
        console.log(user)
        if (!user) {
            return next({
                statusCode: 404,
                message: "Verification failed!!!",
                errorMessage: "No user found with such email!",
            });
        }
        const update = await updateUser({ email: userEmail }, { verified: true })
        if (update) { await findAuthSessionByIdandDelete({ _id: sessionId }) }
        console.log(update)
        return res.status(200).json({
            status: "success",
            message: "Verification Successful!"
        })
    } catch (error) {
        next({
            statusCode: 500,
            message: "Verification failed",
            errorMessage: error.message,
        });
    }
}