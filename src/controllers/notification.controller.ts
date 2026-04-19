import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { NotificationModel } from "../models/notification.model";

export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const items = await NotificationModel.find({
    $or: [{ userId }, { vendorId: userId }],
  }).sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Notifications fetched successfully", items));
});

export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const item = await NotificationModel.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, "Notification not found");
  }

  item.status = "READ";
  await item.save();

  res.status(200).json(new ApiResponse("Notification marked as read", item));
});