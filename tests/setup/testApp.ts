import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "../../src/routes";
import { errorMiddleware } from "../../src/middlewares/error.middleware";
import { notFoundMiddleware } from "../../src/middlewares/notFound.middleware";
import { requestIdMiddleware } from "../../src/middlewares/requestId.middleware";

export function createTestApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/health-test", (_req, res) => {
    res.status(200).json({ success: true, message: "ok" });
  });

  app.use("/api", routes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}   