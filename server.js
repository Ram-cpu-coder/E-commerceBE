import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./src/config/mongo.db.config.js";
import authRouter from "./src/routers/auth.route.js";
import productRouter from "./src/routers/product.route.js";
import categoryRouter from "./src/routers/category.route.js";
import reviewRouter from "./src/routers/review.route.js";
import orderRouter from "./src/routers/order.route.js";
import verifyEmailRouter from "./src/routers/verify.route.js";
import cartRouter from "./src/routers/cart.route.js";
import paymentRouter from "./src/routers/payment.route.js";
import chatRouter from "./src/routers/chat.route.js";
import invoiceRouter from "./src/routers/invoice.route.js";
import historyRouter from "./src/routers/history.route.js";
import wishListRouter from "./src/routers/wishList.route.js";
import featureBannerRouter from "./src/routers/featureBanner.route.js";
import recentActivityRouter from "./src/routers/recentActivity.route.js";
import orderInquiryRouter from "./src/routers/orderInquiry.route.js";
import shopRouter from "./src/routers/shop.route.js";
import platformRouter from "./src/routers/platform.route.js";

import { errorHandler } from "./src/middlewares/error.handler.js";
import { startCronJobs } from "./src/utils/cronsJobs.js";
import { apiLimiter } from "./src/services/rateLimiter.js";

const PORT = process.env.PORT;
if (!PORT) {
  console.error("PORT environment variable is required");
  process.exit(1);
}

const defaultOrigins = [
  "http://localhost:5173",
  "https://e-commerce-fe-five.vercel.app",
];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : defaultOrigins;

const app = express();

if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(express.json());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1/auth", apiLimiter, authRouter);
app.use("/api/v1/review", apiLimiter, reviewRouter);
app.use("/api/v1/orders", apiLimiter, orderRouter);
app.use("/api/v1/cart", apiLimiter, cartRouter);
app.use("/api/v1/payment", apiLimiter, paymentRouter);
app.use("/api/v1/wishlist", apiLimiter, wishListRouter);
app.use("/verify-user", apiLimiter, verifyEmailRouter);

app.use("/api/v1/products", apiLimiter, productRouter);
app.use("/api/v1/category", apiLimiter, categoryRouter);
app.use("/api/v1/chat", apiLimiter, chatRouter);
app.use("/api/v1/invoice", apiLimiter, invoiceRouter);
app.use("/api/v1/history", apiLimiter, historyRouter);
app.use("/api/v1/featureBanner", apiLimiter, featureBannerRouter);
app.use("/api/v1/recentActivity", apiLimiter, recentActivityRouter);
app.use("/api/v1/inquiry", apiLimiter, orderInquiryRouter);
app.use("/api/v1/shops", apiLimiter, shopRouter);
app.use("/api/v1/platform", apiLimiter, platformRouter);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    setTimeout(async () => {
      try {
        await startCronJobs();
        console.log("Cron jobs started");
      } catch (err) {
        console.error("Error starting cron jobs", err);
      }
    }, 5000);
  } catch (error) {
    console.log("SERVER failed to run", error);
  }
};
startServer();
