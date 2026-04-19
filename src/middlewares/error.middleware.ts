import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { log } from "../utils/logger";

export function errorMiddleware(
  err: Error | ApiError,
  req: any,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const requestId = req.requestId || "";

  log("error", err.message || "Internal Server Error", {
    requestId,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    requestId,
  });
}