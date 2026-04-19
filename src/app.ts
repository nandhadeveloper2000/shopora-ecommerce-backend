import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes";
import webhookRoutes from "./routes/webhook.routes";
import systemRoutes from "./routes/system.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(requestIdMiddleware);

// public health routes
app.use("/system", systemRoutes);

// Razorpay webhook raw body
app.use("/api/webhooks/razorpay", express.raw({ type: "*/*" }), webhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Multi-vendor ecommerce backend running",
  });
});

app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;