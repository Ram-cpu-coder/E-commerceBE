import jwt from "jsonwebtoken";
import { insertSession } from "../models/sessions/session.model.js";

// creating a token
export const jwtSign = (tokenData) => {
    console.log("it is inside the jwtsign")
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    console.log(222222)
    insertSession({ token });
    console.log(333333)
    return token;
};
// verifying the token
export const jwtVerify = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
// creating a refreshToken
export const jwtRefreshSign = (tokenData) => {
    const refreshJWT = jwt.sign(tokenData, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return refreshJWT;
};
// verifying the refreshToken
export const refreshJWTVerify = (refreshJWT) => {
    return jwt.verify(refreshJWT, process.env.JWT_REFRESH_SECRET);
};
