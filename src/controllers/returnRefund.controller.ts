import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { OrderModel } from "../models/order.model";
import { ReturnRequestModel } from "../models/returnRequest.model";
import { RefundRequestModel } from "../models/refundRequest.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { withTransaction } from "../utils/transaction";
import { env } from "../config/env";
import { ROLES } from "../constants/roles";

function daysBetween(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export const createReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { orderId, shopId, items, note = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order id");
  if (!mongoose.Types.ObjectId.isValid(shopId)) throw new ApiError(400, "Invalid shop id");
  if (!Array.isArray(items) || !items.length) throw new ApiError(400, "Items are required");

  const order = await OrderModel.findOne({ _id: orderId, userId });
  if (!order) throw new ApiError(404, "Order not found");

  const deliveredAt = order.updatedAt || order.createdAt;
  if (daysBetween(new Date(deliveredAt), new Date()) > env.RETURN_WINDOW_DAYS) {
    throw new ApiError(400, "Return window expired");
  }

  const bucket = order.vendorOrders.find((vo: any) => String(vo.shopId) === String(shopId));
  if (!bucket) throw new ApiError(404, "Vendor order bucket not found");

  const request = await ReturnRequestModel.create({
    orderId,
    userId,
    shopId,
    vendorId: bucket.vendorId,
    items,
    status: "REQUESTED",
    note,
  });

  res.status(201).json(new ApiResponse("Return request created successfully", request));
});

export const approveReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (![ROLES.VENDOR, ROLES.ADMIN, ROLES.MASTER_ADMIN].includes(role as any)) {
    throw new ApiError(403, "Forbidden");
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid return request id");

  const request = await ReturnRequestModel.findById(id);
  if (!request) throw new ApiError(404, "Return request not found");

  if (role === ROLES.VENDOR && String(request.vendorId) !== String(userId)) {
    throw new ApiError(403, "Forbidden");
  }

  request.status = "APPROVED";
  await request.save();

  res.status(200).json(new ApiResponse("Return request approved", request));
});

export const receiveReturnedItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (![ROLES.VENDOR, ROLES.ADMIN, ROLES.MASTER_ADMIN].includes(role as any)) {
    throw new ApiError(403, "Forbidden");
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid return request id");

  const result = await withTransaction(async (session) => {
    const request = await ReturnRequestModel.findById(id).session(session);
    if (!request) throw new ApiError(404, "Return request not found");

    if (role === ROLES.VENDOR && String(request.vendorId) !== String(userId)) {
      throw new ApiError(403, "Forbidden");
    }

    for (const line of request.items) {
      const listing = await VendorListingModel.findById(line.vendorListingId).session(session);
      if (!listing) continue;

      const before = listing.stock;
      listing.stock += line.quantity;
      await listing.save({ session });

      await InventoryLedgerModel.create(
        [
          {
            vendorListingId: listing._id,
            masterProductId: listing.masterProductId,
            shopId: listing.shopId,
            vendorId: listing.vendorId,
            movementType: "RETURN_RESTORE",
            quantityDelta: line.quantity,
            stockBefore: before,
            stockAfter: listing.stock,
            referenceType: "RETURN_REQUEST",
            referenceId: request._id,
            note: "Returned items received and stock restored",
          },
        ],
        { session }
      );
    }

    request.status = "RECEIVED";
    await request.save({ session });

    return request;
  });

  res.status(200).json(new ApiResponse("Returned items received", result));
});

export const createRefundRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { orderId, returnRequestId = null, shopId, amount, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order id");
  if (!mongoose.Types.ObjectId.isValid(shopId)) throw new ApiError(400, "Invalid shop id");
  if (!amount || amount <= 0) throw new ApiError(400, "Refund amount must be greater than 0");

  const order = await OrderModel.findOne({ _id: orderId, userId });
  if (!order) throw new ApiError(404, "Order not found");

  const bucket = order.vendorOrders.find((vo: any) => String(vo.shopId) === String(shopId));
  if (!bucket) throw new ApiError(404, "Vendor order bucket not found");

  const refund = await RefundRequestModel.create({
    orderId,
    returnRequestId,
    userId,
    shopId,
    vendorId: bucket.vendorId,
    amount,
    reason,
    status: "REQUESTED",
    mode: "ORIGINAL_PAYMENT",
  });

  res.status(201).json(new ApiResponse("Refund request created successfully", refund));
});

export const processRefundRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  if (![ROLES.ADMIN, ROLES.MASTER_ADMIN].includes(role as any)) {
    throw new ApiError(403, "Forbidden");
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid refund request id");

  const refund = await RefundRequestModel.findById(id);
  if (!refund) throw new ApiError(404, "Refund request not found");

  refund.status = "PROCESSED";
  await refund.save();

  res.status(200).json(new ApiResponse("Refund marked as processed", refund));
});