import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { VendorListingModel } from "../models/vendorListing.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { withTransaction } from "../utils/transaction";

export const getInventoryListing = asyncHandler(async (req: Request, res: Response) => {
  const { vendorListingId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorListingId)) {
    throw new ApiError(400, "Invalid vendor listing id");
  }

  const listing = await VendorListingModel.findById(vendorListingId)
    .populate("masterProductId")
    .populate("shopId", "name slug")
    .populate("vendorId", "name email");

  if (!listing) {
    throw new ApiError(404, "Vendor listing not found");
  }

  const ledger = await InventoryLedgerModel.find({ vendorListingId }).sort({ createdAt: -1 }).limit(50);

  res.status(200).json(
    new ApiResponse("Inventory listing fetched successfully", {
      listing,
      ledger,
    })
  );
});

export const manualStockAdjust = asyncHandler(async (req: Request, res: Response) => {
  const { vendorListingId } = req.params;
  const { quantityDelta, note = "", movementType } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vendorListingId)) {
    throw new ApiError(400, "Invalid vendor listing id");
  }

  const delta = Number(quantityDelta);
  if (!delta || delta === 0) {
    throw new ApiError(400, "quantityDelta must be non-zero");
  }

  const allowedTypes = ["MANUAL_ADD", "MANUAL_REMOVE"];
  if (!allowedTypes.includes(movementType)) {
    throw new ApiError(400, "Invalid movementType");
  }

  const result = await withTransaction(async (session) => {
    const listing = await VendorListingModel.findById(vendorListingId).session(session);
    if (!listing) {
      throw new ApiError(404, "Vendor listing not found");
    }

    const before = listing.stock;
    const after = before + delta;

    if (after < 0) {
      throw new ApiError(400, "Stock cannot go below zero");
    }

    listing.stock = after;
    await listing.save({ session });

    const [ledger] = await InventoryLedgerModel.create(
      [
        {
          vendorListingId: listing._id,
          masterProductId: listing.masterProductId,
          shopId: listing.shopId,
          vendorId: listing.vendorId,
          movementType,
          quantityDelta: delta,
          stockBefore: before,
          stockAfter: after,
          referenceType: "ADMIN",
          referenceId: null,
          note,
        },
      ],
      { session }
    );

    return { listing, ledger };
  });

  res.status(200).json(new ApiResponse("Stock adjusted successfully", result));
});

export const getInventoryLedger = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId, shopId, movementType, page = "1", limit = "20" } = req.query;

  const query: Record<string, unknown> = {};

  if (vendorId && mongoose.Types.ObjectId.isValid(String(vendorId))) {
    query.vendorId = new mongoose.Types.ObjectId(String(vendorId));
  }

  if (shopId && mongoose.Types.ObjectId.isValid(String(shopId))) {
    query.shopId = new mongoose.Types.ObjectId(String(shopId));
  }

  if (movementType) {
    query.movementType = String(movementType);
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    InventoryLedgerModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    InventoryLedgerModel.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse("Inventory ledger fetched successfully", {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  );
});