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

import { errorHandler } from "./src/middlewares/error.handler.js";
import { startCronJobs } from "./src/utils/cronsJobs.js";
import { apiLimiter } from "./src/services/rateLimiter.js";

// in your main server/app file, after middleware setup
import { eTransporter } from "./src/services/email.transport.js";

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT;

// log middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Run server here
app.use(express.json());

const allowedOrigins = ["http://localhost:5173", "https://e-commerce-fe-five.vercel.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server requests without origin
      if (!origin) return callback(null, true);

      // check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin); // must return origin when using credentials
      }

      // block if not allowed
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // allowed headers
  })
);

// debugging

app.get("/smtp-test", async (req, res) => {
  try {
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_EMAIL:", process.env.SMTP_EMAIL);
    console.log("SMTP_PASS_LENGTH:", process.env.SMTP_PASS?.length);

    const transporter = eTransporter();

    await transporter.verify();

    res.json({
      status: "success",
      message: "SMTP connection verified",
    });
  } catch (error) {
    console.error("SMTP TEST FAILED:", error);

    res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
  }
});

// Explicitly handle preflight OPTIONS requests
app.options("*", cors());

// // Global rate limiter: 100 requests per 15 minutes per IP
// // rate limiter
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 100,
//   standardHeaders: "draft-8",
//   legacyHeaders: false,
//   ipv6Subnet: 56
// });

// // Apply the rate limiting middleware to all requests.
// app.use(limiter);

// routers
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/wishlist", wishListRouter);
// verifying error
app.use("/verify-user", verifyEmailRouter);


app.use("/api/v1/products", productRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/invoice", invoiceRouter);
app.use("/api/v1/history", historyRouter);
app.use("/api/v1/featureBanner", featureBannerRouter);
app.use("/api/v1/recentActivity", recentActivityRouter)
app.use("/api/v1/inquiry", orderInquiryRouter)


// error handler
app.use(errorHandler);

// listen the server
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    // Start cron jobs asynchronously with delay
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
