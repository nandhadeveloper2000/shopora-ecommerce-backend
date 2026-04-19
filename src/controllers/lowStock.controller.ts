import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { LowStockAlertModel } from "../models/lowStockAlert.model";

export const getLowStockAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const items = await LowStockAlertModel.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse("Low stock alerts fetched successfully", items));
});

export const acknowledgeLowStockAlert = asyncHandler(async (req: Request, res: Response) => {
  const item = await LowStockAlertModel.findById(req.params.id);
  if (!item) {
    throw new Error("Low stock alert not found");
  }

  item.status = "ACKNOWLEDGED";
  await item.save();

  res.status(200).json(new ApiResponse("Low stock alert acknowledged", item));
});