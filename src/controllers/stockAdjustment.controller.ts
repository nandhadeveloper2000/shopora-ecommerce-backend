import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { StockAdjustmentModel } from "../models/stockAdjustment.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { upsertInventoryBalance } from "../utils/inventoryBalance";
import { getNextSequenceNumber, formatSequence } from "../utils/sequence";
import { createNotification } from "../utils/notification";

export const createStockAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const {
    vendorId,
    shopId,
    warehouseId,
    stockLocationId = null,
    reasonType,
    items,
    note = "",
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "Adjustment items are required");
  }

  const seq = await getNextSequenceNumber("GRN");
  const adjustmentNumber = formatSequence("ADJ", seq.financialYear, seq.number);

  const adjustment = await StockAdjustmentModel.create({
    adjustmentNumber,
    vendorId,
    shopId,
    warehouseId,
    stockLocationId,
    reasonType,
    items,
    note,
  });

  for (const line of items) {
    const listing = await VendorListingModel.findById(line.vendorListingId);
    if (!listing) {
      throw new ApiError(404, "Vendor listing not found");
    }

    const before = listing.stock;
    const after = Math.max(0, before - Number(line.quantity || 0));
    const delta = after - before;

    listing.stock = after;
    await listing.save();

    await InventoryLedgerModel.create({
      vendorListingId: listing._id,
      masterProductId: listing.masterProductId,
      shopId: listing.shopId,
      vendorId: listing.vendorId,
      movementType: "MANUAL_REMOVE",
      quantityDelta: delta,
      stockBefore: before,
      stockAfter: after,
      referenceType: "ADMIN",
      referenceId: adjustment._id,
      note: `${reasonType} stock adjustment`,
    });

    await upsertInventoryBalance({
      vendorListingId: String(listing._id),
      masterProductId: String(listing.masterProductId),
      vendorId: String(listing.vendorId),
      shopId: String(listing.shopId),
      warehouseId: String(warehouseId),
      stockLocationId: stockLocationId ? String(stockLocationId) : null,
      quantityDelta: delta,
    });
  }

  await createNotification({
    vendorId,
    shopId,
    audienceType: "VENDOR",
    title: `${reasonType} stock adjustment`,
    message: `A stock adjustment was posted for reason ${reasonType}`,
    eventType: "SYSTEM",
    meta: { adjustmentId: adjustment._id },
  });

  res.status(201).json(new ApiResponse("Stock adjustment created successfully", adjustment));
});