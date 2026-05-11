import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:
    Number(process.env.RATE_LIMIT_MAX) ||
    (process.env.NODE_ENV === "production" ? 500 : 5000),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.path === "/health",
  message: {
    status: "error",
    message: "Too many requests. Please wait a moment and try again.",
  },
});
