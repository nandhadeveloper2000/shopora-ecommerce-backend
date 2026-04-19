import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(
    new ApiResponse("System health ok", {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});

export const readinessCheck = asyncHandler(async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;

  const isReady = mongoState === 1;

  res.status(isReady ? 200 : 503).json(
    new ApiResponse(isReady ? "System ready" : "System not ready", {
      mongoState,
      ready: isReady,
      timestamp: new Date().toISOString(),
    })
  );
});