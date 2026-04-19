import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { StockBatchModel } from "../models/stockBatch.model";
import { EventQueueModel } from "../models/eventQueue.model";

export const getExpiringBatches = asyncHandler(async (req: Request, res: Response) => {
  const days = Number(req.query.days || 30);
  const now = new Date();
  const till = new Date();
  till.setDate(now.getDate() + days);

  const items = await StockBatchModel.find({
    status: "ACTIVE",
    expiryDate: { $ne: null, $lte: till, $gte: now },
  }).sort({ expiryDate: 1 });

  res.status(200).json(new ApiResponse("Expiring batches fetched successfully", items));
});

export const runExpiryAlertJob = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const till = new Date();
  till.setDate(now.getDate() + 30);

  const items = await StockBatchModel.find({
    status: "ACTIVE",
    expiryDate: { $ne: null, $lte: till, $gte: now },
  });

  for (const item of items) {
    await EventQueueModel.create({
      eventType: "SEND_LOW_STOCK_EMAIL",
      payload: {
        vendorId: item.vendorId,
        shopId: item.shopId,
        vendorListingId: item.vendorListingId,
        batchId: item._id,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      },
      status: "PENDING",
      attempts: 0,
      maxAttempts: 5,
      lastError: "",
      nextRunAt: null,
    });
  }

  res.status(200).json(
    new ApiResponse("Expiry alert job completed", {
      queued: items.length,
    })
  );
});