import rateLimit from "express-rate-limit";

// Limit: 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // max 100 requests per window per IP
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
});
