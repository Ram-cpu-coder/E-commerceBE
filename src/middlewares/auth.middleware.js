import { findToken } from "../models/sessions/session.model.js";
import { getUserByEmail } from "../models/users/user.model.js";
import { jwtVerify, refreshJWTVerify } from "../utils/jwt.js";

export const authenticate = async (req, res, next) => {

    try {
        // 1.get the token from the headers
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Token is required",
            });
        }
        // 2.get the token from the database
        const tokenFromDb = await findToken(token);
        if (!tokenFromDb) {
            return res.status(401).json({
                status: "error",
                message: "Authentication Failed!",
                errorMessage: "Token not found in the database"
            });
        }
        // 3.verify the token
        // const decodedData = await jwtVerify(token, tokenFromDb);
        const decodedData = await jwtVerify(tokenFromDb.token);

        // 4.decode the data in case of verified
        // this email is inside the decoded data because user email was used while creating the token during the sign in
        if (decodedData?.email) {
            const userData = await getUserByEmail({ email: decodedData.email });
            if (userData) {
                req.userData = userData;
                next();
            } else {
                return res.status(400).json({
                    status: "error",
                    message: "Not Authorized!!!",
                });
            }
        } else {
            next({
                statusCode: 401,
                message: "Invalid Token",
            });
        }
    } catch (error) {
        next({
            statusCode: 500,
            message: error?.message || "Internal Error",
            errorMessage: error?.message,
        });
    }
};
export const refreshAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

        console.log(token)
        // verify the refreshtoken
        const decodedData = await refreshJWTVerify(token);
        console.log(decodedData, "decodedata")
        // checking if the token gets verified and if there is token
        if (decodedData?.email) {
            // find the user
            const userData = await getUserByEmail({ email: decodedData.email });
            console.log(userData, 8888)
            if (!userData || userData.refreshJWT !== token) {
                return next({
                    statusCode: 401,
                    message: "Not Authenticated !!!",
                });
            }
            console.log(req.user, 9999)
            req.user = userData;
            next();
        } else {
            return next({
                statusCode: 401,
                message: "Invalid Token!!!",
            });
        }
    } catch (error) {
        next({
            statusCode: 500,
            message:
                error?.message || "Internal Error in verifying the token!!!",
        });
    }
};
export const isAdmin = (req, res, next) => {
    req.user = req.userData || req.user;

    if (req.user?.role === "admin") {
        return next();
    } else {
        return next({
            statusCode: 500,
            message: "Not authorized!!!",
            errorMessage: "User is not an admin!",
        });
    }
};
