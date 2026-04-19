import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { EventQueueModel } from "../models/eventQueue.model";

export const enqueueEvent = asyncHandler(async (req: Request, res: Response) => {
  const { eventType, payload, maxAttempts = 5, nextRunAt = null } = req.body;

  const item = await EventQueueModel.create({
    eventType,
    payload: payload || {},
    status: "PENDING",
    attempts: 0,
    maxAttempts,
    lastError: "",
    nextRunAt,
  });

  res.status(201).json(new ApiResponse("Event queued successfully", item));
});

export const processPendingEvents = asyncHandler(async (_req: Request, res: Response) => {
  const items = await EventQueueModel.find({
    status: "PENDING",
  })
    .sort({ createdAt: 1 })
    .limit(50);

  const processed = [];

  for (const item of items) {
    item.status = "DONE";
    item.attempts += 1;
    await item.save();
    processed.push(item._id);
  }

  res.status(200).json(
    new ApiResponse("Pending events processed", {
      processedCount: processed.length,
      processed,
    })
  );
});